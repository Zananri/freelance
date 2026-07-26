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
const appLocale = $('meta[name="app-locale"]').attr('content') || 'en';

async function renderCalendar(year, month) {
    
    const calendarBody = $('.table-calendar tbody');
    calendarBody.empty();

    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const monthLocale = appLocale === "id" ? "id-ID" : "en-US";
    const calendarDate = new Date(year, month, 1);

    $(".calendar-month").text(
        calendarDate.toLocaleString(monthLocale, {
            month: "long",
        })
    );

    $(".calendar-year").text(year);
    
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

$(document).on("click", ".dropdown-month .month-item", function () {
    const monthNum = Number($(this).data("month"));

    currentDate.setDate(1);
    currentDate.setMonth(monthNum - 1);

    renderEventCalendar(
        currentDate.getFullYear(),
        currentDate.getMonth()
    );
});

let ARR_DATA_CALENDAR = [];

async function getAllEventEmployeeCalendarByMonth(year,month){

    return getAllEven = await $.ajax({
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

    let photoProfile = '';
    let currentEmployee = $('[name="current_employee"]').val();

    
    if(currentEmployee != dataRow.employee_id){

        let imgSrc = 'asset/img/avatar.png';

        if(dataRow.employee.profile_picture != null && dataRow.employee.profile_picture != '' && dataRow.employee.profile_picture != 'null'){
            imgSrc = dataRow.employee.profile_picture;
        }

        let htmlTooltip = `<div>Created by <strong>${dataRow.employee.name}</strong></div>
                            <small>Created at : ${formatDatePHP('D, j M Y',dataRow.created_at)}</small>`;
    

        photoProfile = `<img src="${appUrl}/${imgSrc}" alt="${dataRow.employee.name}" data-bs-toggle="tooltip" data-bs-html="true" data-bs-title="${htmlTooltip}" class="rounded-circle" style="position:absolute; right:8px; top:10px; width: 24px; height: 24px; object-fit: cover; cursor: pointer;" >`;

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
                    <div class="position-relative rounded-3 fs-14" style="background-color:${dataRow.color_event};">
                        <div class="p-2 pb-3 pe-4 bg-white bg-opacity-20  rounded-3">
                            <span class="text-title-event text-body fw-medium">
                                ${dataRow.title_event}
                            </span>
                            ${photoProfile}
                            <div class="fs-12 text-body text-description-event">
                                ${description}
                            </div>
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
    
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));


    calendarDayModal.show();
});


function appendEventCalendar(eventRow){

    //calendar.date_event,calendar.color_event,calendar.title_event
    

    let photoProfile = '';
    let currentEmployee = $('[name="current_employee"]').val();

    if(currentEmployee != eventRow.employee_id){

        let imgSrc = 'asset/img/avatar.png';

        if(eventRow.employee.profile_picture){
            imgSrc = eventRow.employee.profile_picture;
        }

        let htmlTooltip = `<div>Created by <strong>${eventRow.employee.name}</strong></div>
                            <small>Created at : ${formatDatePHP('D, j M Y',eventRow.created_at)}</small>`;
    

        photoProfile = `<img src="${appUrl}/${imgSrc}" alt="${eventRow.employee.name}" data-bs-toggle="tooltip" data-bs-html="true" data-bs-title="${htmlTooltip}" class="rounded-circle" style="position:absolute; right:4px; top:4px; width: 10px; height: 10px; object-fit: cover; cursor: pointer;" >`;

    }
    
    let boxEvent = `<div class="text-event position-relative" style="background-color:${eventRow.color_event};">    
        ${eventRow.title_event}
        ${photoProfile}
    </div>`;

    $(document).find('[data-calendar-date="'+eventRow.date_event+'"] .box-event').append(boxEvent);

    if(currentEmployee != eventRow.employee_id){
        const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
    }
    
    

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

$('#newEventModal [name="event_share_to"]').on('change',function(){
    let shareTo = $(this).val();
    
    if(shareTo == 'GUEST'){
        $('#newEventModal .box-input-guest, #newEventModal .box-selected-employee').removeClass('d-none');
    }else{
        $('#newEventModal .box-input-guest, #newEventModal .box-selected-employee').addClass('d-none');
        $('#newEventModal [name="employee_share_id"]').val();
        $('#newEventModal .box-selected-employee').html(' ');
        $('#newEventModal .employee-checkbox').prop("checked", false);
    }
});

$('#newEventModal .box-input-guest [name="event_search_guest"]').focus(function(){
    $('#newEventModal .dropdown-list-employee').removeClass('d-none');
});

$('#newEventModal .box-input-guest [name="event_search_guest"]').on('keyup',function(){
    let searchQuery = $(this).val();

    $('#newEventModal .dropdown-list-employee .dropdown-item').addClass('d-none');

    $('#newEventModal .dropdown-list-employee .dropdown-item').each(function(){
        let employeeName = $(this).find('.employee-name').text();
        
        if(employeeName.toLowerCase().includes(searchQuery.toLowerCase())){
            $(this).closest('.dropdown-item').removeClass('d-none');
        }

    });

});

$(document).click(function(event) {
  // Check if the clicked element is not the target element or a descendant of it
  if (!$(event.target).closest("#newEventModal .dropdown-list-employee").length && !$(event.target).closest('#newEventModal .box-input-guest [name="event_search_guest"]').length ) {
    // Code to execute when a click occurs outside #myElement
    $('#newEventModal .dropdown-list-employee').addClass('d-none');
  }
});

// To prevent clicks inside #myElement from triggering the document click handler
$("#newEventModal .dropdown-list-employee").click(function(event) {
    event.stopPropagation();
});

$('#newEventModal .employee-checkbox').on('change',function(){
    setEmployeeSelected();
});

function htmlEmployeeSelected(employeeId){

    //dropdown-item d-flex align-items-center justify-content-between p-2" data-id="{{ $item->id }}"
    //<input type="checkbox" class="employee-checkbox" data-id="{{ $item->id }}" data-name="{{ $item->name }}" data-photo="{{ $photoPofile }}" data-division-job="{{ $item->name_division}}/{{ $item->job_name}}">
    //let employeeId = $(`#newEventModal .employee-checkbox[data-id="${employeeId}"]`).attr('data-id');
    let employeeName = $(`#newEventModal .employee-checkbox[data-id="${employeeId}"]`).attr('data-name');
    let employeePhoto = $(`#newEventModal .employee-checkbox[data-id="${employeeId}"]`).attr('data-photo');
    let employeeDivisionJob = $(`#newEventModal .employee-checkbox[data-id="${employeeId}"]`).attr('data-division-job');

    let rowHtml = `<div class="employee-item">
                        <div class="d-flex align-items-center justify-content-between p-2" >
                            <div class="d-flex align-items-center">
                                <img src="${employeePhoto}" alt="" class="employee-photo rounded-circle me-2">
                                <div class="d-flex flex-column">
                                    <span class="employee-name fs-12 fw-medium">${employeeName}</span>
                                    <small class="fs-10">${employeeDivisionJob}</small>
                                </div>
                            </div>
                            <span class="material-symbols-outlined act-remove-employee" data-id="${employeeId}">
                                delete
                            </span>
                        </div>
                    </div>`;
    return rowHtml;
}

function setEmployeeSelected(){

    $('#newEventModal .box-selected-employee').html(' ');

    let arrId = [];

    $('#newEventModal .employee-checkbox:checked').each(function(){
        let idEmployee = $(this).attr('data-id');
        arrId.push(idEmployee);
        $('#newEventModal .box-selected-employee').append(htmlEmployeeSelected(idEmployee));
    });

    $('#newEventModal [name="employee_share_id"]').val(arrId.join(','));
}

$(document).on('click','#newEventModal .act-remove-employee',function(){
    let employeeId = $(this).attr('data-id');

    $(`#newEventModal .employee-checkbox[data-id="${employeeId}"]`).prop("checked", false);
    setEmployeeSelected();
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


$(document).on('click','#calendarDayModal .item-event, #calendarAllModal .item-event',function(){

    let itemEvenId = $(this).attr('data-event-id');
    let employeeId = $(this).attr('data-employee');
    let status = $(this).attr('data-status');

    $('#calendarDayModal .box-loader,#calendarAllModal .box-loader').fadeIn();
    
    getEventDetail(itemEvenId,employeeId).then(res=>{
        eventDetailModal.show();
        calendarDayModal.hide();
        calendarAllModal.hide();
        $('#calendarDayModal .box-loader,#calendarAllModal .box-loader').fadeOut();
    });
    
    $('#calendarDayModal .box-loader,#calendarAllModal .box-loader').fadeOut();

    // calendarDayModal.hide();
    // newEventModal.show();
});

function setEventDetail(employeeCalendar,employeeCalendarShare){

    //showAlertMsg(rowItem.title_event,'success',5000);

    // text-event-title text-event-date text-event-time text-event-description

    $('#eventDetailModal .text-event-title, #deleteEventModal .text-event-title').text(employeeCalendar.title_event);
    $('#eventDetailModal .text-event-date, #deleteEventModal .text-event-date').text(formatDateENMediumWithDay(employeeCalendar.date_event));
    $('#eventDetailModal .text-event-time, #deleteEventModal .text-event-time').text(formatTimeDisplay(employeeCalendar.start_time) + ' - ' + formatTimeDisplay(employeeCalendar.end_time));
    $('#eventDetailModal .text-event-description').text(employeeCalendar.description);
    $('#eventDetailModal .box-header-event, #deleteEventModal .box-header-event').css('background-color',employeeCalendar.color_event);

    $('#eventDetailModal .event-log .event-by').html(`Created By ${employeeCalendar.employee.name}`);
    $('#eventDetailModal .event-log .event-at').html(` at ${formatDatePHP('D, j M Y',employeeCalendar.created_at)}`);


    $(`#editEventModal .employee-checkbox`).prop("checked", false);
    
    for (let i = 0; i < employeeCalendarShare.length; i++) {
        const employeeId = employeeCalendarShare[i].employee_id;
        
        $(`#editEventModal .employee-checkbox[data-id="${employeeId}"]`).prop("checked", true);
    }
    
    setEmployeeSelectedEdit();

    $('#editEventModal [name="event_id"], #deleteEventModal [name="event_id"]').val(employeeCalendar.id);
    $('#editEventModal [name="employee_id"], #deleteEventModal [name="employee_id"]').val(employeeCalendar.employee_id);

    if(employeeCalendar.share_to == 'GUEST'){
        $('#editEventModal .box-input-guest, #editEventModal .box-selected-employee').removeClass('d-none');
    }else{
        $('#editEventModal .box-input-guest, #editEventModal .box-selected-employee').addClass('d-none');
        $('#editEventModal [name="employee_share_id"]').val();
        $('#editEventModal .box-selected-employee').html(' ');
        $('#editEventModal .employee-checkbox').prop("checked", false);
    }

    $('#editEventModal [name="event_share_to"]').val(employeeCalendar.share_to);
    $('#editEventModal [name="event_title"]').val(employeeCalendar.title_event);
    $('#editEventModal [name="event_description"]').val(employeeCalendar.description);
    $('#editEventModal [name="event_color"]').val(employeeCalendar.color_event);

    $('#editEventModal [name="start_date"]').val(employeeCalendar.date_event);
    $('#editEventModal [name="end_date"]').val(employeeCalendar.date_event);
    $('#editEventModal [name="start_time"]').val(employeeCalendar.start_time);
    $('#editEventModal [name="end_time"]').val(employeeCalendar.end_time);

    $('#editEventModal .dropdown-color .btn-dot-color').css('background-color',employeeCalendar.color_event);

}

async function getEventDetail(itemEvenId,employeeId){
    let ajaxGetDetail = await $.ajax({
        url: appUrl + "/calendar/event-employee-detail",
        type: "GET",
        data:{
            'EVENT_ID' : itemEvenId,
            'EMPLOYEE_ID' : employeeId
        },
        beforeSend:function(){
            //$('.col-user-management .loader').fadeIn('fast');
        },
        error:function(res){
            var resJson = res.responseJSON;
            showAlertMsg(resJson.message,'error',5000);
        },
        success: function(response) {
            
            var employeeCalendar = response.data.employeeCalendar;
            var employeeCalendarShare = response.data.employeeCalendarShare;

            setEventDetail(employeeCalendar,employeeCalendarShare);
        }
         
    });

    return ajaxGetDetail;
}


$('#eventDetailModal .btn-close-modal').click(function(){
    eventDetailModal.hide();
    //calendarDayModal.show();
});

$('#eventDetailModal .act-icon-edit').click(function(){
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
    processEditEvent();
});

async function processEditEvent() {
  try {
    const editEvent = await submitEditEmployeeCalendarEvent();
    const processRender = await renderEventCalendar(currentDate.getFullYear(), currentDate.getMonth());

    //console.log(processRender);
    if((editEvent.status) == 'success' && processRender){
        let itemEvenId = $('#editEventModal [name="event_id"]').val();
        let employeeId = $('#editEventModal [name="employee_id"]').val();

        getEventDetail(itemEvenId,employeeId);

        editEventModal.hide();
        eventDetailModal.show();

        $('#editEventModal .box-loader').fadeOut();
    }


    // Further operations with the received data
  }catch (error) {
    console.error('Error in processing data:', error);
  }
}

async function submitEditEmployeeCalendarEvent(){
    try {
        const result = await $.ajax({
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
                return 'ERROR';
            },
            success: function(response) {
                //$('#editEventModal .box-loader').fadeOut();
                showAlertMsg(response.message,'success',5000);
                $('#editEventModal .box-loader').fadeOut();
                return 'SUCCESS';
            }
        });
        
    return result;
  } catch (error) {
    console.error('AJAX request failed:', error);
    throw error; // Re-throw the error for further handling if needed
  }

    
}


$('#editEventModal [name="event_share_to"]').on('change',function(){
    let shareTo = $(this).val();
    
    if(shareTo == 'GUEST'){
        $('#editEventModal .box-input-guest, #editEventModal .box-selected-employee').removeClass('d-none');
    }else{
        $('#editEventModal .box-input-guest, #editEventModal .box-selected-employee').addClass('d-none');
        $('#editEventModal [name="employee_share_id"]').val();
        $('#editEventModal .box-selected-employee').html(' ');
        $('#editEventModal .employee-checkbox').prop("checked", false);
    }
});

$('#editEventModal .box-input-guest [name="event_search_guest"]').focus(function(){
    $('#editEventModal .dropdown-list-employee').removeClass('d-none');
});

$('#editEventModal .box-input-guest [name="event_search_guest"]').on('keyup',function(){
    let searchQuery = $(this).val();

    $('#editEventModal .dropdown-list-employee .dropdown-item').addClass('d-none');

    $('#editEventModal .dropdown-list-employee .dropdown-item').each(function(){
        let employeeName = $(this).find('.employee-name').text();
        
        if(employeeName.toLowerCase().includes(searchQuery.toLowerCase())){
            $(this).closest('.dropdown-item').removeClass('d-none');
        }

    });

});

$(document).click(function(event) {
  // Check if the clicked element is not the target element or a descendant of it
  if (!$(event.target).closest("#editEventModal .dropdown-list-employee").length && !$(event.target).closest('#editEventModal .box-input-guest [name="event_search_guest"]').length ) {
    // Code to execute when a click occurs outside #myElement
    $('#editEventModal .dropdown-list-employee').addClass('d-none');
  }
});

// To prevent clicks inside #myElement from triggering the document click handler
$("#editEventModal .dropdown-list-employee").click(function(event) {
    event.stopPropagation();
});

$('#editEventModal .employee-checkbox').on('change',function(){
    setEmployeeSelectedEdit();
});

function htmlEmployeeSelectedEdit(employeeId){

    //dropdown-item d-flex align-items-center justify-content-between p-2" data-id="{{ $item->id }}"
    //<input type="checkbox" class="employee-checkbox" data-id="{{ $item->id }}" data-name="{{ $item->name }}" data-photo="{{ $photoPofile }}" data-division-job="{{ $item->name_division}}/{{ $item->job_name}}">
    //let employeeId = $(`#newEventModal .employee-checkbox[data-id="${employeeId}"]`).attr('data-id');
    let employeeName = $(`#newEventModal .employee-checkbox[data-id="${employeeId}"]`).attr('data-name');
    let employeePhoto = $(`#newEventModal .employee-checkbox[data-id="${employeeId}"]`).attr('data-photo');
    let employeeDivisionJob = $(`#newEventModal .employee-checkbox[data-id="${employeeId}"]`).attr('data-division-job');

    let rowHtml = `<div class="employee-item">
                        <div class="d-flex align-items-center justify-content-between p-2" >
                            <div class="d-flex align-items-center">
                                <img src="${employeePhoto}" alt="" class="employee-photo rounded-circle me-2">
                                <div class="d-flex flex-column">
                                    <span class="employee-name fs-12 fw-medium">${employeeName}</span>
                                    <small class="fs-10">${employeeDivisionJob}</small>
                                </div>
                            </div>
                            <span class="material-symbols-outlined act-remove-employee" data-id="${employeeId}">
                                delete
                            </span>
                        </div>
                    </div>`;
    return rowHtml;
}

function setEmployeeSelectedEdit(){

    $('#editEventModal .box-selected-employee').html(' ');

    let arrId = [];

    $('#editEventModal .employee-checkbox:checked').each(function(){
        let idEmployee = $(this).attr('data-id');
        arrId.push(idEmployee);
        $('#editEventModal .box-selected-employee').append(htmlEmployeeSelectedEdit(idEmployee));
    });

    $('#editEventModal [name="employee_share_id"]').val(arrId.join(','));
}

$(document).on('click','#editEventModal .act-remove-employee',function(){
    let employeeId = $(this).attr('data-id');

    $(`#editEventModal .employee-checkbox[data-id="${employeeId}"]`).prop("checked", false);
    setEmployeeSelectedEdit();
});



$('#deleteEventModal .btn-close-modal').click(function(){
    eventDetailModal.show();
    deleteEventModal.hide();
});
$('#eventDetailModal .act-icon-delete').click(function(){
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