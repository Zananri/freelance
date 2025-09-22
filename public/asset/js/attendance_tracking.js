const appUrl = $('meta[name=app-url]').attr("content");

const modalAttendance = new bootstrap.Modal('#modalAttendance', {
  keyboard: false
});




$('.input-search-query').on('keyup',function(){
    let searchQuery = $(this).val();
    console.log(searchQuery);

    if(searchQuery){
        $('.employee-row').addClass('d-none');
        
         

        $('.employee-row').each(function(){
            let employeeName = $(this).find('.employee-name').text();
            if(employeeName.toLowerCase().includes(searchQuery.toLowerCase())){
                $(this).removeClass('d-none');
            }
        });

    }else{
        $('.employee-row').removeClass('d-none');
    }
});




let CURRENT_DATE = new Date();

function renderCalendar(year, month) {
    
    getAttendanceTrackingData(month+1,year);
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const monthNames = new Date(year,month);


    $('.calendar-month').text(`${CURRENT_DATE.toLocaleString('default', { month: 'long' })}`);
    $('.calendar-month-short').text(`${CURRENT_DATE.toLocaleString('default', { month: 'short' })}`);
    $('.calendar-year').text(`${year}`);

    $('.col-day').removeClass('d-none');

    for (let i = totalDays+1; i <= 31; i++) {
        $('.col-day[data-day="' + i + '"]').addClass('d-none');
    }

    $('.table-attendance thead .col-day').removeClass('sunday');

    $('.table-attendance thead .col-day').each(function(){
        const day = parseInt($(this).attr('data-day'));
        const newDateDay = new Date(year, month, day).getDay();

        if(newDateDay == 0){
            $(this).addClass('sunday');
        }

        //console.log(day+'  '+newDate);
    });
 
}

renderCalendar(CURRENT_DATE.getFullYear(), CURRENT_DATE.getMonth());

$('.calendar-prev-month').click(function() {
    CURRENT_DATE.setMonth(CURRENT_DATE.getMonth() - 1);
    renderCalendar(CURRENT_DATE.getFullYear(), CURRENT_DATE.getMonth());
});

$('.calendar-next-month').click(function() {
    CURRENT_DATE.setMonth(CURRENT_DATE.getMonth() + 1);
    renderCalendar(CURRENT_DATE.getFullYear(), CURRENT_DATE.getMonth());
});

$(document).on('click','.dropdown-month .month-item',function(){
    let monthNum = $(this).attr('data-month');
    
    CURRENT_DATE.setMonth(parseInt(monthNum));

    renderCalendar(CURRENT_DATE.getFullYear(), CURRENT_DATE.getMonth());

    //$('.dropdown-month.show').removeClass('show');
});




function appendEventCalendar(dateCalendar,text,type){

}

$(document).on('click','.data-fullscreen, .data-fullscreen-exit',function(){
    $('.calendar-container').toggleClass('fullscreen');
    $('.data-fullscreen').toggleClass('d-none');
});

function getAttendanceTrackingData(month,year)
{

    $.ajax({
        url: appUrl + "/attendance_tracking/get-attendance-tracking-data",
        type: "GET",
        data:{
            'YEAR' : year,
            'MONTH' : month,
        },
        beforeSend:function(){
            //$('.col-user-management .loader').fadeIn('fast');
        },
        error:function(res){
            var resJson = res.responseJSON;
            showAlertMsg(resJson.message,'error',5000);
            $('.loader').fadeOut('fast');
          //$('.col-user-management .loader').fadeOut('fast');
        },
        success: function(response) {
            var resData = response.data;
            
            $('.employee-row .time-in, .employee-row  .time-out').text(' ');

            $('.table-attendance .col-day').removeClass('is-late');

            for (let i = 0; i < resData.length; i++) {
                const attendance = resData[i];

                const dateString = attendance.date_attendance;
                const dateObject = new Date(dateString);
                const dayOfMonth = dateObject.getDate();

                const timeIn = formatTimeDisplay(attendance.time_in);
                const timeOut = formatTimeDisplay(attendance.time_out);

                //console.log(attendance.time_late);

                if(attendance.time_late != null && attendance.time_late != '00:00:00'){
                    $('[data-employee-id="'+attendance.employee_id+'"] [data-day="'+dayOfMonth+'"]').addClass('is-late');   
                }

                $('[data-employee-id="'+attendance.employee_id+'"] [data-day="'+dayOfMonth+'"] .time-in').text(timeIn);
                $('[data-employee-id="'+attendance.employee_id+'"] [data-day="'+dayOfMonth+'"] .time-out').text(timeOut);
                
                
                
            }

            // "id": 1,
            // "employee_id": 1,
            // "date_attendance": "2025-08-12T17:00:00.000000Z",
            // "time_in": "15:24:00",
            // "time_out": null,
            // "time_late": "06:24:00",
            // "type_attendance": "check_in",
            // "note": null,
            // "image": null,
            // "status": "PRESENT",
            // "created_by": null,
            // "updated_by": null,
            // "deleted_by": null,
            // "created_at": "2025-08-13T01:24:26.000000Z",
            // "updated_at": "2025-08-13T01:24:26.000000Z"
        
        }
         
    });

}



$(document).on('click','tbody .col-day',function(){

    let dayCalendar = $(this).attr('data-day');
    let employeeId = $(this).closest('.employee-row').attr('data-employee-id');
    
    let dateAttendance = CURRENT_DATE.getFullYear()+'-'+(CURRENT_DATE.getMonth()+1)+'-'+dayCalendar;


    getAttendanceDetail(employeeId,dateAttendance)
    
    
});

function getAttendanceDetail(employeeId,dateAttendance)
{

    $.ajax({
        url: appUrl + "/attendance_tracking/get-attendance-detail",
        type: "GET",
        data:{
            'EMPLOYEE_ID' : employeeId,
            'DATE_ATTENDANCE' : dateAttendance,
        },
        beforeSend:function(){
            //$('.col-user-management .loader').fadeIn('fast');
        },
        error:function(res){
            var resJson = res.responseJSON;
            showAlertMsg(resJson.message,'error',5000);
            //$('.loader').fadeOut('fast');
            //$('.col-user-management .loader').fadeOut('fast');
        },
        success: function(response) {
            var resData = response.data;
            
            let employee = resData.employee;
            let attendance = resData.attendance;

            let employeeShift = formatTimeShort(attendance.shift_time_start)+' - '+formatTimeShort(attendance.shift_time_end);

            $('#modalAttendance .attendance-date').text(formateDateFull(attendance.date_attendance));
            
            $('#modalAttendance .employee-name').text(employee.name);
            $('#modalAttendance .employee-shift').text(employeeShift);

            $('#modalAttendance .attendance-late').text(formatTimeShort(attendance.time_late)).removeClass('text-danger');

            if(attendance.time_late != null && attendance.time_late != '00:00:00'){
                $('#modalAttendance .attendance-late').addClass('text-danger');   
            }

            $('#modalAttendance .attendance-checkin').text(formatTimeShort(attendance.time_in));
            $('#modalAttendance .attendance-checkout').text(formatTimeShort(attendance.time_out));
            $('#modalAttendance .attendance-work-duration').text(formatTimeShort(attendance.total_work_duration));

            
            //attendance-checkin attendance-checkout attendance-work-duration

            modalAttendance.show();
        
        }
         
    });

}

$('#btn-download-xlsx').on('click',function(){
    
    const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
    
    let currentYear = CURRENT_DATE.getFullYear();

    const monthName = months[CURRENT_DATE.getMonth()];

    window.location.href = `${appUrl}/attendance_tracking/export-attendance-monthly/attendance_${currentYear}_${monthName}.xlsx`;

});


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

const formatDateIDMonthYear = (date) => {

    
  const newDate = new Date(date);
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
    
  const m = monthNames[newDate.getMonth()];
  const y = newDate.getFullYear();
  
  return `${m} ${y}`;
};
