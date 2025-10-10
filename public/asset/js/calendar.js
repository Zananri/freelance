const appUrl = $('meta[name=app-url]').attr("content");

const calendarDayModal = new bootstrap.Modal('#calendarDayModal', {
  keyboard: false
});

const newEventModal = new bootstrap.Modal('#newEventModal', {
  keyboard: false
});


$('#btn-new-event').click(function(){
    newEventModal.show();
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

async function renderEventCalendar(year, month){
    try {
        const calendaerResponse = await renderCalendar(year, month);

        if(calendaerResponse == 'done-rendering'){
            const attendanceReposnse = await getAllEventEmployeeCalendarByMonth(year,month+1);
        }
        
        //console.log(data);
    } catch (error) {
        console.error("Error fetching or processing data:", error);
    }
}

renderEventCalendar(currentDate.getFullYear(), currentDate.getMonth());

$('.calendar-prev-month').click(function() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderEventCalendar(currentDate.getFullYear(), currentDate.getMonth());
});

$('.calendar-next-month').click(function() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderEventCalendar(currentDate.getFullYear(), currentDate.getMonth());
});

$(document).on('click','.dropdown-month .month-item',function(){
    let monthNum = $(this).attr('data-month');
    
    currentDate.setMonth(parseInt(monthNum));

    renderEventCalendar(currentDate.getFullYear(), currentDate.getMonth());

    //$('.dropdown-month.show').removeClass('show');
});

let ARR_DATA_CALENDAR = [];

async function getAllEventEmployeeCalendarByMonth(year,month){

    $.ajax({
        url: appUrl + "/calendar/all-event-employee-calendar-by-month",
        type: "GET",
        data:{
            'YEAR' : year,
            'MONTH' : month
        },
        beforeSend:function(){
            //$('.col-user-management .loader').fadeIn('fast');
        },
        error:function(res){
          //$('.col-user-management .loader').fadeOut('fast');
        },
        success: function(response) {
        //     {
        //     "code": 200,
        //     "status": "success",
        //     "data": {
        //         "employeeCalendar": [
        //             {
        //                 "id": 1,
        //                 "employee_id": 1,
        //                 "share_to": "PRIVATE",
        //                 "status": "ACTIVE",
        //                 "title_event": "Sunmori BSD",
        //                 "description": "Touring anak NSA",
        //                 "date_event": "2025-10-05",
        //                 "end_date_event": "2025-10-05",
        //                 "start_time": "09:00:00",
        //                 "end_time": "12:00:00",
        //                 "color_event": null,
        //                 "image": null,
        //                 "file_1": null,
        //                 "file_2": null,
        //                 "file_3": null,
        //                 "file_4": null,
        //                 "file_5": null,
        //                 "created_by": 4,
        //                 "updated_by": 4,
        //                 "created_at": "2025-10-10T01:46:17.000000Z",
        //                 "updated_at": "2025-10-10T01:46:17.000000Z"
        //             }
        //         ]
        //     },
        //     "message": "All Employee Calendar"
        // }

            var resData = response.data;
            var employeeCalendar = resData.employeeCalendar;

            ARR_DATA_CALENDAR = employeeCalendar;

            for (let i = 0; i < ARR_DATA_CALENDAR.length; i++) {
                const calendar = ARR_DATA_CALENDAR[i];
                appendEventCalendar(calendar.date_event,calendar.color_event,calendar.title_event);
            }

        }
         
    });

}

function htmlItemEvent(dataRow){

    let htmlRow = `<div class="item-event mb-3">
        <div class="d-flex align-items-start">
            <div class="col-time pt-3">
                <div class="d-flex-inline text-time me-3" >
                    ${formatTimeDisplay(dataRow.start_time)}
                </div>
            </div>
            <div class="col-event-title w-100">
                <div class="p-2 rounded-3 fs-14" style="background-color:${dataRow.color_event};">
                    <span class="text-title-event text-body">
                        ${dataRow.title_event}
                    </span>
                    <div class="fs-12 text-body text-opacity-75">
                        ${dataRow.description}
                    </div>
                </div>
            </div>
        </div>
    </div>`;

    return htmlRow;

}
$(document).on('click','.calendar-day',function(){
    let dateCalendar = $(this).attr('data-calendar-date');

    $('#newEventModal [name="start_date"]').val(dateCalendar);
    $('#newEventModal [name="end_date"]').val(dateCalendar);
    
    $('#calendarDayModal .calendar-date').text(formatDateENMediumWithDay(dateCalendar));

    let itemEvent = '';
    for (let i = 0; i < ARR_DATA_CALENDAR.length; i++) {
        
        console.log(ARR_DATA_CALENDAR[i].date_event + ' '+dateCalendar);
        
        if(ARR_DATA_CALENDAR[i].date_event == dateCalendar){
            console.log(ARR_DATA_CALENDAR[i]);
            itemEvent += htmlItemEvent(ARR_DATA_CALENDAR[i]);
        }
        
    }

    $('#calendarDayModal .box-data-event').html(itemEvent);

    calendarDayModal.show();
});


function appendEventCalendar(dateCalendar,color,title){

    let boxEvent = `<div class="text-event " style="background-color:${color}">${title}</div>`;

    $(document).find('[data-calendar-date="'+dateCalendar+'"] .box-event').append(boxEvent);

}







$('#calendarDayModal .btn-new-event').on('click',function(){
    calendarDayModal.hide();
    newEventModal.show();
});


$('#newEventModal .dropdown-color .dropdown-item').click(function(){
    let color = $(this).find('.dot-color').css('background-color');
    $('#newEventModal [name="event_color"]').val(color);
    $('#newEventModal .dropdown-color .btn-dot-color').css('background-color',color);
});

$('#newEventModal .dropdown-color .dropdown-item:eq(0)').click();

$('#newEventModal .btn-close-modal').click(function(){
    newEventModal.hide();
    
});


$('#newEventModal .btn-submit-modal').click(function(){
    submitNewEmployeeCalendarEvent();
});


function submitNewEmployeeCalendarEvent(){
    $.ajax({
        url: appUrl + "/calendar/new-employee-event",
        type: "POST",
        data: new FormData($('#form-new-event').get(0)) ,
        cache: false,
        processData: false,
        contentType: false,
        beforeSend:function(){
            $('#newEventModal .box-loader').fadeIn();
        },
        error:function(res){
            var resJson = res.responseJSON;
            showAlertMsg(resJson.message,'error',5000);
            $('#newEventModal .box-loader').fadeOut();
            //$('.loader').fadeOut('fast');
        },
        success: function(res) {
            
            showAlertMsg(res.message,'success',5000);
            newEventModal.hide();

            $('#form-new-event')[0].reset();
        }
    });
}