
// CALENDAR

const calendarModal = new bootstrap.Modal('#calendarModal', {
  keyboard: false
});

$('.calendar-toggle-btn').on('click',function(){
    calendarModal.show();
});

let currentDate = new Date();

async function renderCalendar(year, month) {
    
    const calendarBody = $('.table-calendar tbody');
    calendarBody.empty();

    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const monthNames = new Date(year,month);


    $('.calendar-month').text(`${currentDate.toLocaleString('default', { month: 'long' })}`);
    $('.calendar-year').text(`${year}`);

    let day = 1;
    let row = $('<tr>');

    for (let i = 0; i < firstDay; i++) {
        row.append('<td class="empty-cell"></td>');
    }

    for (let i = 0; i < totalDays; i++) {
        if ((firstDay + i) % 7 === 0 && i !== 0) {
            calendarBody.append(row);
            row = $('<tr>');
        }
        const today = new Date();
        const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

        row.append(`<td class="calendar-day  ${isToday ? 'today' : ''}" data-calendar-date="${year}-${month+1}-${day}"><div class="bg-day"><div class="day">${day}</div></div></td>`);

        day++;
    }

    calendarBody.append(row);

    return 'done-rendering';
}

renderAttendance(currentDate.getFullYear(), currentDate.getMonth());


async function renderAttendance(year, month){
    try {
        const calendaerResponse = await renderCalendar(year, month);

        if(calendaerResponse == 'done-rendering'){
            const attendanceReposnse = await getAttendanceEmployeeByMonth(month+1,year);
        }
        
        //console.log(data);
    } catch (error) {
        console.error("Error fetching or processing data:", error);
    }
}

$('.calendar-prev-month').click(function() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderAttendance(currentDate.getFullYear(), currentDate.getMonth());
});

$('.calendar-next-month').click(function() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderAttendance(currentDate.getFullYear(), currentDate.getMonth());
});

$(document).on('click','.dropdown-month .month-item',function(){
    let monthNum = $(this).attr('data-month');
    
    currentDate.setMonth(parseInt(monthNum) - 1);

    renderAttendance(currentDate.getFullYear(), currentDate.getMonth());

    //$('.dropdown-month.show').removeClass('show');
});

$(document).on('click','.calendar-day',function(){
    let dateCalendar = $(this).attr('data-calendar-date');
    //alert(dateCalendar);
});


function appendEventCalendar(dateCalendar,text,type){

    let boxEvent = `<div class="text-event">${text}</div>`;

    $(document).find('[data-calendar-date="'+dateCalendar+'"] .box-event').append(boxEvent);

}

// END CALENDAR

// Attendance Calendar Data

async function getAttendanceEmployeeByMonth(month,year)
{

    $.ajax({
        url: appUrl + "/attendance/get-attendance-employee-by-month",
        type: "GET",
        data:{
            'YEAR' : year,
            'MONTH' : month,
        },
        beforeSend:function(){
            //$('.col-user-management .loader').fadeIn('fast');
            $('.calendar-attendance .loader').fadeIn('fast');
        },
        error:function(res){
            var resJson = res.responseJSON;
            showAlertMsg(resJson.message,'error',5000);
            $('.calendar-attendance .loader').fadeOut('fast');
          //$('.col-user-management .loader').fadeOut('fast');
        },
        success: function(response) {
            var resData = response.data;
            
            for (let i = 0; i < resData.length; i++) {
                const attendance = resData[i];

                const attendanceDateObject = new Date(attendance.date_attendance);
                const attendanceDateEN = attendanceDateObject.toISOString().slice(0, 10);
                
                const timeIn = formatTimeDisplay(attendance.time_in);
                const timeOut = formatTimeDisplay(attendance.time_out);

                const dateAttendance = formatDateMedium(attendance.date_attendance);

                $(`[data-calendar-date="${dateAttendance}"]`).attr('attendance_date',attendanceDateEN);
                $(`[data-calendar-date="${dateAttendance}"]`).attr('attendance',attendance.id);
                $(`[data-calendar-date="${dateAttendance}"]`).attr('check-in',timeIn);
                $(`[data-calendar-date="${dateAttendance}"]`).attr('check-out',timeOut);

                if(timeIn != '--:--'){
                    $(document).find(`[data-calendar-date="${dateAttendance}"]`).addClass('check-in');
                }

                if(timeOut != '--:--'){
                    $(document).find(`[data-calendar-date="${dateAttendance}"]`).addClass('check-out');
                }

            }

            $('.calendar-attendance .loader').fadeOut('fast');
        
        }
         
    });

}

// Attendance Calendar Data



// Format Date Time

function formatTimeDisplay(timeString) {

    if (!timeString) return '--:--';

    if (typeof timeString === 'string') {
        const m = timeString.match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
        if (m) return `${m[1]}:${m[2]}`;
    }
    
    let date = new Date(timeString);

    if (isNaN(date.getTime()) && typeof timeString === 'string' && timeString.includes(' ')) {
        
        date = new Date(timeString.replace(' ', 'T'));
    }
    
    if (isNaN(date.getTime())) {
        return '--:--';
    }

    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${hours}:${minutes}`;
}

function formatTimeShort(timeString) {

    if (!timeString) return '--:--';

    if (typeof timeString === 'string') {
        const m = timeString.match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
        if (m) return `${m[1]} : ${m[2]}`;
    }
    
    return timeString;
}

function formatDateMedium(date) {
    const newDate = new Date(date);
    const year = newDate.getFullYear();
    const month = newDate.getMonth() + 1; // getMonth() returns 0-11
    const day = newDate.getDate();

    // No padding needed for single-digit month/day in yyyy-m-d format
    return `${year}-${month}-${day}`;
}

function formateDateFull(dateString){

    if (!dateString) return '';

    const newDate = new Date(dateString); // Or your specific date object

    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const dayOfWeek = weekdays[newDate.getDay()];
    const dateNumber = newDate.getDate();
    const monthName = months[newDate.getMonth()];
    const year = newDate.getFullYear();

    const formattedDate = `${dayOfWeek} ${dateNumber} ${monthName} ${year}`;

    return formattedDate;

}


