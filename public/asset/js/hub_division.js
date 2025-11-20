let currentDate = new Date();
let selectedEmployeeId = null;

// Filter employee by division
$(document).on('click', '.division-item', function() {
    const divisionId = $(this).data('division-id');
    const divisionText = $(this).text().trim();
    
    // Update dropdown text
    $('.selected-division-text').text(divisionText);
    
    // Filter employees
    if (divisionId === 'all') {
        $('.employee-item').show();
    } else {
        $('.employee-item').each(function() {
            const employeeDivisionId = $(this).data('employee-division');
            if (employeeDivisionId == divisionId) {
                $(this).show();
            } else {
                $(this).hide();
            }
        });
    }
});

// Select employee when clicked
$(document).on('click', '.employee-item', function() {
    $('.employee-item').removeClass('selected');
    $(this).addClass('selected');
    
    selectedEmployeeId = $(this).data('employee-id');
    
    // Render calendar for selected employee
    renderEventCalendar(currentDate.getFullYear(), currentDate.getMonth());
});

async function renderCalendar(year, month) {
    
    const calendarBody = $('.table-calendar tbody');
    calendarBody.empty();

    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const monthNames = new Date(year,month);

    let day = 1;
    let row = $('<tr>');
    const pad = (n, len = 2) => String(n).padStart(len, '0');

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

        const dayNumPad = pad(day);
        const monthNumPad = pad(month + 1);

        row.append(`<td class="calendar-day  ${isToday ? 'today' : ''}" data-calendar-date="${year}-${monthNumPad}-${dayNumPad}"><div class="day">${day}</div><div class="box-event"></div></td>`);

        day++;
    }


    calendarBody.append(row);

    return 'done-rendering';
}

$('.calendar-prev-month').click(function() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    // renderEventCalendar(currentDate.getFullYear(), currentDate.getMonth());
});

$('.calendar-next-month').click(function() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    // renderEventCalendar(currentDate.getFullYear(), currentDate.getMonth());
});

async function renderEventCalendar(year, month){
    try {
        const calendaerResponse = await renderCalendar(year, month);
        const getAllEventResponse = await getAllEventEmployeeCalendarByMonth(year,month+1);
        

        return getAllEventResponse;
        
        
        //console.log(data);
    } catch (error) {
        console.error("Error fetching or processing data:", error);
        return 'error-rendering';
    }
}

async function getAllTasksEmployeeCalendarByMonth(year,month){

    return getAllEven = await $.ajax({
        url: appUrl + "/calendar/all-tasks-employee-calendar-by-month",
        type: "GET",
        data:{
            'YEAR' : year,
            'MONTH' : month
        },
        beforeSend:function(){
        },
        error:function(res){
          return 'error-get-data';
        },
        success: function(response) {
            
            ARR_DATA_CALENDAR = [];

            var resData = response.data;
            var employeeCalendar = resData.employeeCalendar;

            ARR_DATA_CALENDAR = employeeCalendar;

            for (let i = 0; i < ARR_DATA_CALENDAR.length; i++) {
                const calendar = ARR_DATA_CALENDAR[i];
                appendEventCalendar(calendar);

                $('#calendarAllModal .box-data-event').append(htmlItemEventAll(calendar));
            }

            if(ARR_DATA_CALENDAR.length == 0){
                $('#calendarAllModal .box-data-event').html(' ');
            }

            return 'done-get-data';
        }
         
    });

}