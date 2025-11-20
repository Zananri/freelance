let currentDate = new Date();
let selectedEmployeeId = null;

function getTaskStatusColor(status) {
    const statusLower = (status || '').toLowerCase();
    
    if (statusLower.includes('request') || statusLower === 'new') {
        return '#f2e2e4';
    } else if (statusLower.includes('progress')) {
        return '#f5efce';
    } else if (statusLower.includes('revision') || statusLower.includes('reject')) {
        return '#eba5a5';
    } else if (statusLower.includes('complete')) {
        return '#b2eecd';
    } else if (statusLower.includes('finish')) {
        return '#A5C6F1';
    } else {
        return '#dde4e8';
    }
}

$(document).on('click', '.division-item', function() {
    const divisionId = $(this).data('division-id');
    const divisionText = $(this).text().trim();
    
    $('.selected-division-text').text(divisionText);
    
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

$(document).on('click', '.employee-item', function() {
    $('.employee-item').removeClass('selected');
    $(this).addClass('selected');

    selectedEmployeeId = $(this).data('employee-id');

    const employeeName = $(this).find('.employee-name').text();
    const employeePhoto = $(this).data('photo');
    const employeeTask = $(this).data('task');

    $('.selected-employee-photo').attr('src', employeePhoto);
    $('.selected-employee-name').text(employeeName);
    $('.selected-employee-task').text(employeeTask + " total tasks");

    $('.selected-employee-info').show();

    $('.calendar-placeholder').hide();
    $('.table-calendar').show();

    const monthNames = [
        "January","February","March","April","May","June",
        "July","August","September","October","November","December"
    ];

    $('.calendar-month').text(monthNames[currentDate.getMonth()]);
    $('.calendar-year').text(currentDate.getFullYear());

    renderEventCalendar(currentDate.getFullYear(), currentDate.getMonth());
});

async function loadEmployeeTasks(employeeId, year, month) {
    try {
        const response = await $.ajax({
            url: appUrl + "/hub_division/employee-tasks-by-month",
            type: "GET",
            data: {
                'employee_id': employeeId,
                'year': year,
                'month': month
            }
        });

        if (response.success) {
            return {
                tasks: response.data,
                total: response.total_tasks
            };
        }
        return { tasks: [], total: 0 };

    } catch (error) {
        console.error("Error loading employee tasks:", error);
        return { tasks: [], total: 0 };
    }
}

// Render task bar on calendar
function renderTaskBar(task) {
    const startDate = task.start_date;
    if (!startDate) return;

    const dateStr = startDate.split(' ')[0]; // Get date part only
    const $dayCell = $(`.calendar-day[data-calendar-date="${dateStr}"]`);
    
    if ($dayCell.length > 0) {
        const $boxEvent = $dayCell.find('.box-event');
        const backgroundColor = getTaskStatusColor(task.status);
        
        const taskHtml = `
            <div class="text-event" 
                 style="background-color: ${backgroundColor};" 
                 data-task-id="${task.id}"
                 title="${task.title}">
                ${task.title}
            </div>
        `;
        
        $boxEvent.append(taskHtml);
    }
}

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
    
    // Update month and year display
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    $('.calendar-month').text(monthNames[currentDate.getMonth()]);
    $('.calendar-year').text(currentDate.getFullYear());
    
    // Reload calendar if employee is selected
    if (selectedEmployeeId) {
        renderEventCalendar(currentDate.getFullYear(), currentDate.getMonth());
    }
});

$('.calendar-next-month').click(function() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    
    // Update month and year display
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    $('.calendar-month').text(monthNames[currentDate.getMonth()]);
    $('.calendar-year').text(currentDate.getFullYear());
    
    // Reload calendar if employee is selected
    if (selectedEmployeeId) {
        renderEventCalendar(currentDate.getFullYear(), currentDate.getMonth());
    }
});

// Month dropdown change
$(document).on('click', '.month-item', function() {
    const month = $(this).data('month');
    currentDate.setMonth(month - 1);
    
    // Update month and year display
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    $('.calendar-month').text(monthNames[currentDate.getMonth()]);
    $('.calendar-year').text(currentDate.getFullYear());
    
    // Reload calendar if employee is selected
    if (selectedEmployeeId) {
        renderEventCalendar(currentDate.getFullYear(), currentDate.getMonth());
    }
});

async function renderEventCalendar(year, month){
    try {
        await renderCalendar(year, month);

        if (selectedEmployeeId) {
            const result = await loadEmployeeTasks(selectedEmployeeId, year, month + 1);
            
            const tasks = result.tasks;
            const total = result.total;

            // Update panel
            $('.selected-employee-task').text(total + " total tasks");

            $('.box-event').empty();
            tasks.forEach(task => renderTaskBar(task));
        }

        return 'done-rendering';
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