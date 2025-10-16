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
    

        photoProfile = `<img src="${appUrl}/${imgSrc}" alt="${eventRow.employee.name}" data-bs-toggle="tooltip" data-bs-html="true" data-bs-title="${htmlTooltip}" class="rounded-circle employee-photo" >`;

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
});




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
});

function setEventDetail(employeeCalendar,employeeCalendarShare){

    //showAlertMsg(rowItem.title_event,'success',5000);

    // text-event-title text-event-date text-event-time text-event-description

    $('#eventDetailModal .text-event-title').text(employeeCalendar.title_event);
    $('#eventDetailModal .text-event-date').text(formatDateENMediumWithDay(employeeCalendar.date_event));
    $('#eventDetailModal .text-event-time').text(formatTimeDisplay(employeeCalendar.start_time) + ' - ' + formatTimeDisplay(employeeCalendar.end_time));
    $('#eventDetailModal .text-event-description').text(employeeCalendar.description);
    $('#eventDetailModal .box-header-event').css('background-color',employeeCalendar.color_event);

    $('#eventDetailModal .event-log .event-by').html(`Created By ${employeeCalendar.employee.name}`);
    $('#eventDetailModal .event-log .event-at').html(` at ${formatDatePHP('D, j M Y',employeeCalendar.created_at)}`);

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