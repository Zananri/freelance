const appUrl = $('meta[name=app-url]').attr("content");

const calendarDayModal = new bootstrap.Modal('#calendarDayModal', {
  keyboard: false
});

const calendarAllModal = new bootstrap.Modal('#calendarAllModal', {
  keyboard: false
});

const eventDetailModal = new bootstrap.Modal('#eventDetailModal', {
  keyboard: false
});

const newEventModal = new bootstrap.Modal('#newEventModal', {
  keyboard: false
});

const editEventModal = new bootstrap.Modal('#editEventModal', {
  keyboard: false
});

const deleteEventModal = new bootstrap.Modal('#deleteEventModal', {
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
        const getAllEventResponse = await getAllEventEmployeeCalendarByMonth(year,month+1);
        

        return getAllEventResponse;
        
        
        //console.log(data);
    } catch (error) {
        console.error("Error fetching or processing data:", error);
        return 'error-rendering';
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
          return 'error-get-data';
        },
        success: function(response) {
            

            var resData = response.data;
            var employeeCalendar = resData.employeeCalendar;

            ARR_DATA_CALENDAR = employeeCalendar;

            for (let i = 0; i < ARR_DATA_CALENDAR.length; i++) {
                const calendar = ARR_DATA_CALENDAR[i];
                appendEventCalendar(calendar.date_event,calendar.color_event,calendar.title_event);

                $('#calendarAllModal .box-data-event').append(htmlItemEventAll(calendar));
            }

            if(ARR_DATA_CALENDAR.length == 0){
                $('#calendarAllModal .box-data-event').html(' ');
            }
                    

            return 'done-get-data';
        }
         
    });

}

$('#search-event-all').on('keyup',function(){
    let searchQuery = $(this).val();

    if(searchQuery == ''){
        $('#calendarAllModal .box-data-event .item-event').removeClass('d-none');
        return;
    }

    $('#calendarAllModal .box-data-event .item-event').addClass('d-none');
    
    $('#calendarAllModal .box-data-event .item-event').each(function(){
        let titleEvent = $(this).find('.text-title-event').text();
        let descriptionEvent = $(this).find('.text-description-event').text();

        if(titleEvent.toLowerCase().includes(searchQuery.toLowerCase())){
            $(this).closest('.item-event').removeClass('d-none');
        }

        if(descriptionEvent.toLowerCase().includes(searchQuery.toLowerCase())){
            $(this).closest('.item-event').removeClass('d-none');
        }
    });
    
    
});


function htmlItemEvent(dataRow){

    let description = '';

    if(dataRow.description != null && dataRow.description != '' && dataRow.description != 'null'){

        description = `<div class="fs-12 text-body text-opacity-75">
                        ${dataRow.description}
                    </div>`;
    }

    //
    let htmlRow = `
        <div class="item-event mb-3" data-event-id="${dataRow.id}" data-employee="${dataRow.employee_id}" data-status="${dataRow.status}">
            <div class="d-flex align-items-start">
                <div class="col-time pt-2">
                    <div class="d-flex-inline text-time me-3" >
                        ${formatTimeDisplay(dataRow.start_time)}
                    </div>
                </div>
                <div class="col-event-title w-100">
                    <div class="p-2 rounded-3 fs-14" style="background-color:${dataRow.color_event};">
                        <span class="text-title-event text-body fw-medium">
                            ${dataRow.title_event}
                        </span>
                        <div class="fs-12 text-body text-description-event">
                            ${description}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    return htmlRow;

}

function htmlItemEventAll(dataRow){

    let description = '';

    if(dataRow.description != null && dataRow.description != '' && dataRow.description != 'null'){

        description = `<div class="fs-12 text-body mt-3">
                        ${dataRow.description}
                    </div>`;
    }

    //
    let htmlRow = `
        <div class="item-event mb-3" data-event-id="${dataRow.id}" data-employee="${dataRow.employee_id}" data-status="${dataRow.status}">
            <div class="d-flex align-items-start">
                <div class="col-event-title w-100">
                    <div class="p-2 rounded-3 fs-14" style="background-color:${dataRow.color_event};">
                        <span class="text-title-event text-body fw-medium">
                            ${dataRow.title_event}
                        </span>
                        <div >
                            <div class="d-flex gap-2 align-items-center justify-content-between w-100">
                               <div>
                                    <span class="fs-12">${formatDateENMediumWithDay(dataRow.date_event)} </span>
                               </div>
                               <div>
                                    <span  class="fs-12" >${formatTimeDisplay(dataRow.start_time)} - ${formatTimeDisplay(dataRow.end_time)}</span>
                               </div>
                            </div>
                        </div>
                        <div class="fs-12 text-body text-description-event">
                            ${description}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    return htmlRow;

}

$('.calendar-event-list').on('click',function(){
    calendarAllModal.show();
});

$('#calendarAllModal .btn-close-modal').click(function(){
    calendarAllModal.hide();
});


$(document).on('click','.calendar-day',function(){
    let dateCalendar = $(this).attr('data-calendar-date');

    $('#newEventModal [name="start_date"]').val(dateCalendar);
    $('#newEventModal [name="end_date"]').val(dateCalendar);
    
    $('#calendarDayModal .calendar-date').text(formatDateENMediumWithDay(dateCalendar));

    let itemEvent = '';
    for (let i = 0; i < ARR_DATA_CALENDAR.length; i++) {
        
        //console.log(ARR_DATA_CALENDAR[i].date_event + ' '+dateCalendar);
        
        if(ARR_DATA_CALENDAR[i].date_event == dateCalendar){
            //console.log(ARR_DATA_CALENDAR[i]);
            itemEvent += htmlItemEvent(ARR_DATA_CALENDAR[i]);
        }
        
    }

    $('#calendarDayModal .box-data-event').html(itemEvent);

    calendarDayModal.show();
});


function appendEventCalendar(dateCalendar,color,title){

    let boxEvent = `<div class="text-event" style="background-color:${color};">    
    ${title}
    </div>`;

    $(document).find('[data-calendar-date="'+dateCalendar+'"] .box-event').append(boxEvent);

}



$('#search-event-day').on('keyup',function(){
    let searchQuery = $(this).val();

    $('#calendarDayModal .box-data-event .item-event').addClass('d-none');

    $('#calendarDayModal .box-data-event .item-event').each(function(){
        let titleEvent = $(this).find('.text-title-event').text();
        let descriptionEvent = $(this).find('.text-description-event').text();

        if(titleEvent.toLowerCase().includes(searchQuery.toLowerCase())){
            $(this).closest('.item-event').removeClass('d-none');
        }

        if(descriptionEvent.toLowerCase().includes(searchQuery.toLowerCase())){
            $(this).closest('.item-event').removeClass('d-none');
        }
    });

});




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
            renderEventCalendar(currentDate.getFullYear(), currentDate.getMonth());
            showAlertMsg(res.message,'success',5000);
            newEventModal.hide();

            $('#form-new-event')[0].reset();
            $('#newEventModal .box-loader').fadeOut();
        }
    });
}


$(document).on('click','#calendarDayModal .item-event',function(){

    let itemEvenId = $(this).attr('data-event-id');
    let employeeId = $(this).attr('data-employee');
    let status = $(this).attr('data-status');

    setEventDetail(itemEvenId,employeeId);

    eventDetailModal.show();
    calendarDayModal.hide();

    // calendarDayModal.hide();
    // newEventModal.show();
});

function setEventDetail(itemEvenId,employeeId){
    let rowItem = ARR_DATA_CALENDAR.find(item => item.id == itemEvenId);

    //showAlertMsg(rowItem.title_event,'success',5000);

    // text-event-title text-event-date text-event-time text-event-description

    $('#eventDetailModal .text-event-title, #deleteEventModal .text-event-title').text(rowItem.title_event);
    $('#eventDetailModal .text-event-date, #deleteEventModal .text-event-date').text(formatDateENMediumWithDay(rowItem.date_event));
    $('#eventDetailModal .text-event-time, #deleteEventModal .text-event-time').text(formatTimeDisplay(rowItem.start_time) + ' - ' + formatTimeDisplay(rowItem.end_time));
    $('#eventDetailModal .text-event-description').text(rowItem.description);
    $('#eventDetailModal .box-header-event, #deleteEventModal .box-header-event').css('background-color',rowItem.color_event);

    $('#editEventModal [name="event_id"], #deleteEventModal [name="event_id"]').val(itemEvenId);
    $('#editEventModal [name="employee_id"], #deleteEventModal [name="employee_id"]').val(employeeId);

    $('#editEventModal [name="event_title"]').val(rowItem.title_event);
    $('#editEventModal [name="event_description"]').val(rowItem.description);
    $('#editEventModal [name="event_color"]').val(rowItem.color_event);

    $('#editEventModal [name="start_date"]').val(rowItem.date_event);
    $('#editEventModal [name="end_date"]').val(rowItem.date_event);
    $('#editEventModal [name="start_time"]').val(rowItem.start_time);
    $('#editEventModal [name="end_time"]').val(rowItem.end_time);

    $('#editEventModal .dropdown-color .btn-dot-color').css('background-color',rowItem.color_event);

}

$('#eventDetailModal .btn-close-modal').click(function(){
    eventDetailModal.hide();
    calendarDayModal.show();
});

$('#eventDetailModal .btn-edit-modal').click(function(){
    eventDetailModal.hide();
    editEventModal.show();
});

$('#editEventModal .dropdown-color .dropdown-item').click(function(){
    let color = $(this).find('.dot-color').css('background-color');
    $('#editEventModal [name="event_color"]').val(color);
    $('#editEventModal .dropdown-color .btn-dot-color').css('background-color',color);
});

$('#editEventModal .btn-close-modal').click(function(){
    eventDetailModal.show();
    editEventModal.hide();
});

$('#editEventModal .btn-submit-modal').click(function(){
    submitEditEmployeeCalendarEvent();
});

async function submitEditEmployeeCalendarEvent(){
    $.ajax({
        url: appUrl + "/calendar/edit-employee-event",
        type: "POST",
        data: new FormData($('#form-edit-event').get(0)) ,
        cache: false,
        processData: false,
        contentType: false,
        beforeSend:function(){
            $('#editEventModal .box-loader').fadeIn();
        },
        error:function(res){
            var resJson = res.responseJSON;
            showAlertMsg(resJson.message,'error',5000);
            $('#editEventModal .box-loader').fadeOut();
            //$('.loader').fadeOut('fast');
        },
        success: function(response) {

            renderEventCalendar(currentDate.getFullYear(), currentDate.getMonth()).then(res=>{
                
                let itemEvenId = $('#editEventModal [name="event_id"]').val();
                let employeeId = $('#editEventModal [name="employee_id"]').val();

                setEventDetail(itemEvenId,employeeId);
                editEventModal.hide();
                showAlertMsg(response.message,'success',5000);
                eventDetailModal.hide();

                $('#editEventModal .box-loader').fadeOut();
            });
            

            

        }
    });
}

$('#deleteEventModal .btn-close-modal').click(function(){
    eventDetailModal.show();
    deleteEventModal.hide();
});
$('#eventDetailModal .btn-delete-modal').click(function(){
    eventDetailModal.hide();
    deleteEventModal.show();
});

$('#deleteEventModal .btn-delete-modal').click(function(){
    submitDeleteEmployeeCalendarEvent();
});

async function submitDeleteEmployeeCalendarEvent(){
    $.ajax({
        url: appUrl + "/calendar/delete-employee-event",
        type: "POST",
        data: new FormData($('#form-delete-event').get(0)) ,
        cache: false,
        processData: false,
        contentType: false,
        beforeSend:function(){
            $('#deleteEventModal .box-loader').fadeIn();
        },
        error:function(res){
            var resJson = res.responseJSON;
            showAlertMsg(resJson.message,'error',5000);
            $('#deleteEventModal .box-loader').fadeOut();
            //$('.loader').fadeOut('fast');
        },
        success: function(response) {

            renderEventCalendar(currentDate.getFullYear(), currentDate.getMonth()).then(res=>{
                 
                deleteEventModal.hide();
                showAlertMsg(response.message,'success',5000);
                $('#deleteEventModal .box-loader').fadeOut();
            });
            

            

        }
    });
}