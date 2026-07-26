const appUrl = $('meta[name=app-url]').attr("content");
const attendanceI18n = window.attendanceTrackingI18n || {};
const attendanceLocale = attendanceI18n.locale || 'en-US';
const attendanceText = attendanceI18n.text || {};

function attendanceTranslate(key, replacements = {}) {
    let text = attendanceText[key] || key;

    Object.entries(replacements).forEach(([name, value]) => {
        text = text.replaceAll(`:${name}`, value);
    });

    return text;
}

function translateAttendanceValue(value) {
    const key = String(value || '').toLowerCase();
    return attendanceText[key] || capitalizeFirstLetter(String(value || ''));
}

const modalAttendance = new bootstrap.Modal('#modalAttendance', {
  keyboard: false
});

const modalAttendanceEdit = new bootstrap.Modal('#modalAttendanceEdit', {
  keyboard: false
});

const modalLeave = new bootstrap.Modal('#modalLeave', {
  keyboard: false
});

function capitalizeFirstLetter(str) {
    const formattedStr = str
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

    return formattedStr;
}


// Search handler moved to pagination section below




let CURRENT_DATE = new Date();

function renderCalendar(year, month) {
    
    getAttendanceTrackingData(month+1,year);
    const totalDays = new Date(year, month + 1, 0).getDate();
    const selectedMonth = new Date(year, month, 1);


    $('.calendar-month').text(
        new Intl.DateTimeFormat(attendanceLocale, { month: 'long' }).format(selectedMonth)
    );
    $('.calendar-month-short').text(
        new Intl.DateTimeFormat(attendanceLocale, { month: 'short' }).format(selectedMonth)
    );
    $('.calendar-year').text(`${year}`);

    $('.col-day').removeClass('d-none');

    for (let i = totalDays+1; i <= 31; i++) {
        $('.col-day[data-day="' + i + '"]').addClass('d-none');
    }

    $('.table-attendance thead .col-day').removeClass('sunday');

    $('.table-attendance thead .col-day').each(function(){
        const day = parseInt($(this).attr('data-day'));
        const newDateDay = new Date(year, month, day).getDay();

        $(this).find('.calendar-week-short').text(
            new Intl.DateTimeFormat(attendanceLocale, { weekday: 'short' })
                .format(new Date(year, month, day))
        );
        

        if(newDateDay == 0){
            $(this).addClass('sunday');
        }

        //console.log(day+'  '+newDate);
    });

    
    $('.table-attendance tbody .col-day').removeClass('off-day');

    $('.table-attendance tbody .col-day').each(function(){
        const day = parseInt($(this).attr('data-day'));
        const weekdayOff = $(this).closest('.employee-row').attr('data-weekday-off');
        const weekDay = arrWeekdayENISO(new Date(year, month, day).getDay());


        if(weekdayOff){
            if(weekdayOff.toLowerCase().includes(weekDay)){
                $(this).addClass('off-day');
            }
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
    
    CURRENT_DATE.setMonth(parseInt(monthNum)-1);

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
            var dtAttendance = response.data.attendance;
            var employeeLeave = response.data.employeeLeave;
            
            $('.employee-row .time-in, .employee-row  .time-out').text(' ');

            $('.table-attendance .col-day').removeClass('is-late');
            $('.table-attendance .col-day').removeClass('annual_leave');
            $('.table-attendance .col-day').removeClass('sick');
            $('.table-attendance .col-day').removeClass('absent');
            $('.table-attendance .col-day').removeClass('present');

            $('.col-day .description-leave').text('');

            for (let i = 0; i < dtAttendance.length; i++) {
                const attendance = dtAttendance[i];

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
                
                if(attendance.status == 'ABSENT'){
                    $('[data-employee-id="'+attendance.employee_id+'"] [data-day="'+dayOfMonth+'"] .time-in').text('');
                    $('[data-employee-id="'+attendance.employee_id+'"] [data-day="'+dayOfMonth+'"] .time-out').text('');
                    
                    $('[data-employee-id="'+attendance.employee_id+'"] [data-day="'+dayOfMonth+'"] .description-leave').text(attendanceTranslate('absent'));
                }

                if(attendance.status == 'SICK'){
                    $('[data-employee-id="'+attendance.employee_id+'"] [data-day="'+dayOfMonth+'"] .time-in').text('');
                    $('[data-employee-id="'+attendance.employee_id+'"] [data-day="'+dayOfMonth+'"] .time-out').text('');
                    
                    $('[data-employee-id="'+attendance.employee_id+'"] [data-day="'+dayOfMonth+'"] .description-leave').text(attendanceTranslate('sick'));
                }

                $('[data-employee-id="'+attendance.employee_id+'"] [data-day="'+dayOfMonth+'"]').addClass(attendance.status.toLowerCase());
            }

            
            
            for (let i = 0; i < employeeLeave.length; i++) {
                const employeeLeaveRequest = employeeLeave[i];

                const startDateObject = new Date(employeeLeaveRequest.start_date);
                const startDatedayOfMonth = startDateObject.getDate();

                $('[data-employee-id="'+employeeLeaveRequest.employee_id+'"] [data-day="'+startDatedayOfMonth+'"]').addClass(employeeLeaveRequest.leave_type.toLowerCase());

                let textLeave = '';

                if(employeeLeaveRequest.leave_type == 'ANNUAL_LEAVE'){
                    textLeave = attendanceTranslate('leave');
                }
                else if(employeeLeaveRequest.leave_type == 'SICK'){
                    textLeave = attendanceTranslate('sick');
                }
                
                $('[data-employee-id="'+employeeLeaveRequest.employee_id+'"] [data-day="'+startDatedayOfMonth+'"] .description-leave').text(textLeave);
                
                for (let j = 1; j < employeeLeaveRequest.day_amount; j++) {
                    let startDateNew = addDays(employeeLeaveRequest.start_date,j);
                    let startDatedayOfMonthNew = startDateNew.getDate();
                    console.log(startDatedayOfMonthNew);
                    $('[data-employee-id="'+employeeLeaveRequest.employee_id+'"] [data-day="'+startDatedayOfMonthNew+'"]').addClass(employeeLeaveRequest.leave_type.toLowerCase());
                    $('[data-employee-id="'+employeeLeaveRequest.employee_id+'"] [data-day="'+startDatedayOfMonthNew+'"] .description-leave').text(textLeave);
                }
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

    if($(this).hasClass('off-day')){
        showAlertMsg(attendanceTranslate('employee_day_off'),'error',5000);
    }else{
        let dayCalendar = $(this).attr('data-day');
        let employeeId = $(this).closest('.employee-row').attr('data-employee-id');
        
        let dateAttendance = CURRENT_DATE.getFullYear()+'-'+(CURRENT_DATE.getMonth()+1)+'-'+dayCalendar;


        $('#modalAttendance [name="employee_id"]').text(employeeId);
        $('#modalAttendance [name="attendance_date"],#modalAttendanceEdit [name="attendance_date"]').val(dateAttendance);
        $('#modalAttendance .attendance-date,#modalAttendanceEdit .attendance-date').text(formateDateFull(dateAttendance));

        getAttendanceDetail(employeeId,dateAttendance);
    }
    
});

let CURRENT_ATTENDANCE = [];
let CURRENT_EMPLOYEE = [];
let CURRENT_LEAVE = [];

async function getAttendanceDetail(employeeId,dateAttendance)
{
    return getData = await $.ajax({
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
            
            CURRENT_ATTENDANCE = resData.attendance;
            CURRENT_EMPLOYEE = resData.employee;
            CURRENT_LEAVE = resData.leave;

            setAttendanceDetail();
            //attendance-checkin attendance-checkout attendance-work-duration

            if(CURRENT_LEAVE){
                modalLeave.show();
            }else{
                modalAttendance.show();
            }
            
        
        }
         
    });

}

function htmlDataRequestTimeOff(dataRow){

    let leaveType = translateAttendanceValue(dataRow.leave_type);
    
    let file1 = '';
    let file2 = '';

    let file1Name = '';
    let file2Name = '';

    if(dataRow.file_1){
        file1Name = dataRow.file_1.split('/').pop();
        file1Name = file1Name.split('_').pop();

        file1 = `
            <div class="">
                <a class="btn btn-action" target="_blank" href="${appUrl}/${dataRow.file_1}">
                    <span class="material-symbols-outlined check-icon">attach_file</span>
                    ${file1Name}
                </a>
            </div>
            `;
    }

    if(dataRow.file_2){
        file2Name = dataRow.file_2.split('/').pop();
        file2Name = file2Name.split('_').pop();

        file2 = `
            <div class="">
                <a class="btn btn-action" target="_blank" href="${appUrl}/${dataRow.file_2}">
                    <span class="material-symbols-outlined check-icon">attach_file</span>
                    ${file2Name}
                </a>
            </div>
            `;
    }

    let actionButton = '';

    var rowItem = `
        <div class="item-time-off mb-3" data-time-off="${dataRow.id}">
            <div class="item-header mb-2">
                <div class="mb-0">
                    <div class="d-flex align-items-center justify-content-between">
                        <div class="col-employee">
                            <div class="box-employee">
                                <div class="d-flex align-items-center">
                                    <div class="col-photo">
                                        <div class="employee-photo">
                                            <img src="${appUrl}/${dataRow.employee.photo}" class="rounded-circle w-100 h-100 object-fit-cover" alt="">
                                        </div>
                                    </div>
                                    <div class="col-name w-100">
                                        <div class="employee-name">
                                            ${dataRow.employee.name}
                                        </div>
                                        <div class="item-date">
                                            ${formatDateMediumLocalized(dataRow.start_date)} - ${formatDateMediumLocalized(dataRow.end_date)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-day-type">
                            <div class="item-status ${dataRow.status.toLowerCase()}">${translateAttendanceValue(dataRow.status)}</div>
                            
                        </div>
                    </div>
                </div>

                <div class="h-line my-2"></div>
                
                <div class="">

                    <div class="d-flex align-items-start justify-content-between gap-3 mb-3">
                        <div class=" w-100">
                            <div class="item-type">${leaveType}</div>
                        </div>
                        <div class="">
                            <div class="item-day">${dataRow.day_amount} ${Number(dataRow.day_amount) === 1 ? attendanceTranslate('day') : attendanceTranslate('days')}</div>
                        </div>
                    </div>

                    <div class="d-flex align-items-start justify-content-between gap-3">
                        <div class="col-desciption w-100">
                            <div class="item-description">
                                ${dataRow.reason}
                            </div>
                        </div>
                        <div class="col-status">
                            
                        </div>
                    </div>
                </div>
                
            </div>
            <div class="item-footer ">
                <div class="d-flex align-items-center justify-content-between mt-2">
                    <div class="col-item-action mb-2">
                        <div class="item-action d-flex gap-3 justify-content-end ">
                            ${file1}
                            ${file2}
                        </div>
                    </div>                     
                    <div class="col-item-action mb-2">
                        <div class="item-action d-flex gap-3 justify-content-end ">
                            ${actionButton}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    return rowItem;
}

async function setAttendanceDetail(){

    let attendance = CURRENT_ATTENDANCE;
    let employee = CURRENT_EMPLOYEE;
    let leave = CURRENT_LEAVE;

    let attendanceId = '';
    let employeeShift = '';
    let attendanceDate = '';
    let attendanceTimelate = '';
    let attendanceStatus = 'ABSENT';
    let attendanceNote = '';
    let attendanceTotalWorkDuration = '';
    
    let attendanceTimeIn = '';
    let attendanceTimeOut = '';

    if(CURRENT_EMPLOYEE){
        if(employee.shift){
            employeeShift = formatTimeShort(employee.shift.time_start)+' - '+formatTimeShort(employee.shift.time_end);
        }
    }

    if(CURRENT_ATTENDANCE){
        attendanceId = attendance.id;
        attendanceNote = attendance.note;
        attendanceStatus = attendance.status;
        employeeShift = formatTimeShort(attendance.shift_time_start)+' - '+formatTimeShort(attendance.shift_time_end);
        attendanceDate = attendance.date_attendance;
        attendanceTimelate = formatTimeShort(attendance.time_late);

        attendanceTotalWorkDuration = attendance.total_work_duration;

        attendanceTimeIn = attendance.time_in;
        attendanceTimeOut = attendance.time_out;

    }


    $('#modalLeave .box-data-leave').html('');
        
    if(CURRENT_LEAVE){
        // ${appUrl}/${dataRow.employee.photo}

        let htmlLeave =  htmlDataRequestTimeOff(leave);
        $('#modalLeave .box-data-leave').html(htmlLeave);
    
    }

    if(attendanceStatus == 'ABSENT'){
        $('#modalAttendanceEdit .form-block-present').addClass('d-none');
    }else{
        $('#modalAttendanceEdit .form-block-present').removeClass('d-none');
    }


    

    
    $('#modalAttendance .employee-shift,#modalAttendanceEdit .employee-shift').text(employeeShift);

    $('#modalAttendance .attendance-late,#modalAttendanceEdit .attendance-late').text(attendanceTimelate).removeClass('text-danger');

    if(CURRENT_ATTENDANCE){
        if(attendance.time_late != null && attendance.time_late != '00:00:00'){
            $('#modalAttendance .attendance-late').addClass('text-danger');   
        }
    }
    
    
    $('#modalAttendance .employee-name,#modalAttendanceEdit .employee-name').text(employee.name);
    $('#modalAttendance [name="employee_id"],#modalAttendanceEdit [name="employee_id"]').val(employee.id);

    $('#modalAttendance [name="attendance_id"],#modalAttendanceEdit [name="attendance_id"]').val(attendanceId);

    $('#modalAttendance .attendance-status').text(translateAttendanceValue(attendanceStatus));
    $('#modalAttendance .attendance-checkin').text(formatTimeShort(attendanceTimeIn));
    $('#modalAttendance .attendance-checkout').text(formatTimeShort(attendanceTimeOut));
    $('#modalAttendance .attendance-work-duration').text(formatTimeShort(attendanceTotalWorkDuration));

    $('#modalAttendance .attendance-note').text('-');

    $('#modalAttendanceEdit [name="attendance_time_in"]').val(attendanceTimeIn);
    $('#modalAttendanceEdit [name="attendance_time_out"]').val(attendanceTimeOut);
    $('#modalAttendanceEdit [name="attendance_note"]').val(attendanceNote);
    $('#modalAttendanceEdit [name="attendance_status"]').val(attendanceStatus);
    
    if(attendanceNote != null && attendanceNote != '' && attendanceNote != 'null'){
        $('#modalAttendance .attendance-note').text(attendanceNote);
    }
    
    return true;
}

$('#modalAttendanceEdit [name="attendance_status"]').on('change',function(){
    let attendanceStatus = $(this).val();

    if(attendanceStatus == 'ABSENT'){
        $('#modalAttendanceEdit .form-block-present').addClass('d-none');
    }else{
        $('#modalAttendanceEdit .form-block-present').removeClass('d-none');
    }

});


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

    return new Intl.DateTimeFormat(attendanceLocale, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(new Date(dateString));

} 

function formatDateMediumLocalized(dateString) {
    if (!dateString) return '';

    return new Intl.DateTimeFormat(attendanceLocale, {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    }).format(new Date(dateString));
}

const formatDateIDMonthYear = (date) => {
    return new Intl.DateTimeFormat(attendanceLocale, {
        month: 'long',
        year: 'numeric'
    }).format(new Date(date));
};



$('#modalAttendance .btn-submit-note').on('click',function(){

    let note = $('#note-attendance').val();

    

});

$('#modalAttendance .btn-edit-attendance').on('click',function(){
    
    let attendanceDate = $('#modalAttendanceEdit [name="attendance_date"]').val();

    let dateNow = new Date();
    dateNow.setHours(0, 0, 0, 0);

    let attendanceDateObject = new Date(attendanceDate);
    attendanceDateObject.setHours(0, 0, 0, 0);

    let days = daysBetween(dateNow,attendanceDateObject);

    if(attendanceDateObject < dateNow){
        modalAttendance.hide();
        modalAttendanceEdit.show();
    }else{
        showAlertMsg(attendanceTranslate('attendance_not_complete'),'error',5000);
    }


});

$('#modalAttendanceEdit .btn-close-modal-edit').on('click',function(){
    modalAttendanceEdit.hide();
    modalAttendance.show();
});

$('#modalAttendanceEdit .btn-submit-attendance').on('click',function(){
    submitEditAttendance();
});

function submitEditAttendance(){
    $.ajax({
        url: appUrl + "/attendance_tracking/edit-employee-attendance",
        type: "POST",
        data: new FormData($('#form-edit-attendance').get(0)) ,
        cache: false,
        processData: false,
        contentType: false,
        beforeSend:function(){
            $('#modalAttendanceEdit .box-loader').fadeIn();
        },
        error:function(res){
            var resJson = res.responseJSON;
            showAlertMsg(resJson.message,'error',5000);
            $('#modalAttendanceEdit .box-loader').fadeOut();
            //$('.loader').fadeOut('fast');
        },
        success: function(res) {
            
            CURRENT_ATTENDANCE = res.data.attendance;

            setAttendanceDetail();
            
            modalAttendanceEdit.hide();
            modalAttendance.show();

            $('#modalAttendanceEdit .box-loader').fadeOut();
            //$('#form-edit-attendance')[0].reset();
            showAlertMsg(res.message,'success',3000);
            renderCalendar(CURRENT_DATE.getFullYear(), CURRENT_DATE.getMonth());
        },
        complete:function(res){
            $('#modalAttendanceEdit .box-loader').fadeOut();
        }
    });
}



$('#modalLeave .btn-back-modal-leave').on('click',function(){
    modalLeave.hide();
    modalAttendance.show();
});

$('#modalLeave .btn-close-modal-leave').on('click',function(){
    modalLeave.hide();
});

// Pagination for attendance tracking
let TRACKING_PAGE = 1;
const TRACKING_PER_PAGE = 15;

function renderTrackingPagination() {
    const rows = document.querySelectorAll('#attendance-tracking-tbody .employee-row');
    const total = rows.length;
    const last = Math.ceil(total / TRACKING_PER_PAGE) || 1;

    if (total === 0) {
        document.getElementById('trackingPaginationWrap')?.classList.add('d-none');
        return;
    }

    const from = (TRACKING_PAGE - 1) * TRACKING_PER_PAGE + 1;
    const to = Math.min(TRACKING_PAGE * TRACKING_PER_PAGE, total);

    document.getElementById('trackingPaginationInfo').textContent = attendanceTranslate('showing', {
        from,
        to,
        total
    });

    const pages = [];
    pages.push(`<button type="button" class="page-btn tracking-page" data-page="${Math.max(TRACKING_PAGE - 1, 1)}" ${TRACKING_PAGE <= 1 ? 'disabled' : ''}>${attendanceTranslate('previous')}</button>`);

    const pageNums = [];
    if (last <= 7) {
        for (let i = 1; i <= last; i++) pageNums.push(i);
    } else {
        pageNums.push(1);
        if (TRACKING_PAGE > 3) pageNums.push('...');
        const start = Math.max(2, TRACKING_PAGE - 1);
        const end = Math.min(last - 1, TRACKING_PAGE + 1);
        for (let i = start; i <= end; i++) pageNums.push(i);
        if (TRACKING_PAGE < last - 2) pageNums.push('...');
        pageNums.push(last);
    }

    pageNums.forEach(p => {
        if (p === '...') {
            pages.push('<span class="page-btn" style="pointer-events:none;border:none;box-shadow:none;">...</span>');
        } else {
            pages.push(`<button type="button" class="page-btn tracking-page ${p === TRACKING_PAGE ? 'is-active' : ''}" data-page="${p}">${p}</button>`);
        }
    });

    pages.push(`<button type="button" class="page-btn tracking-page" data-page="${Math.min(TRACKING_PAGE + 1, last)}" ${TRACKING_PAGE >= last ? 'disabled' : ''}>${attendanceTranslate('next')}</button>`);

    document.getElementById('trackingPagination').innerHTML = pages.join('');
    showTrackingPage(TRACKING_PAGE);
}

function showTrackingPage(page) {
    const rows = document.querySelectorAll('#attendance-tracking-tbody .employee-row');
    const start = (page - 1) * TRACKING_PER_PAGE;
    const end = start + TRACKING_PER_PAGE;

    rows.forEach((row, i) => {
        row.style.display = (i >= start && i < end) ? '' : 'none';
    });
}

$(document).on('click', '.tracking-page', function() {
    const page = parseInt($(this).data('page'));
    if (!page || page === TRACKING_PAGE || $(this).prop('disabled')) return;
    TRACKING_PAGE = page;
    renderTrackingPagination();
});

$('.input-search-query').on('keyup', function() {
    const query = $(this).val().toLowerCase();
    const rows = document.querySelectorAll('#attendance-tracking-tbody .employee-row');
    rows.forEach(row => {
        const name = row.getAttribute('data-employee-name')?.toLowerCase() || '';
        row.dataset.filterMatch = name.includes(query) ? '1' : '0';
    });
    TRACKING_PAGE = 1;
    const filteredRows = Array.from(rows).filter(r => r.dataset.filterMatch === '1');
    const totalFiltered = filteredRows.length;

    if (query) {
        rows.forEach(row => {
            row.style.display = row.dataset.filterMatch === '1' ? '' : 'none';
        });
        const last = Math.ceil(totalFiltered / TRACKING_PER_PAGE) || 1;
        const from = totalFiltered > 0 ? 1 : 0;
        const to = Math.min(TRACKING_PER_PAGE, totalFiltered);
        document.getElementById('trackingPaginationInfo').textContent = attendanceTranslate('showing', {
            from: totalFiltered > 0 ? from : 0,
            to: totalFiltered > 0 ? to : 0,
            total: totalFiltered
        });
        
        const pages = [];
        pages.push(`<button type="button" class="page-btn tracking-page" data-page="1" disabled>${attendanceTranslate('previous')}</button>`);
        const pageNums = [];
        if (last <= 7) {
            for (let i = 1; i <= last; i++) pageNums.push(i);
        } else {
            pageNums.push(1);
            if (last > 2) pageNums.push('...');
            pageNums.push(last);
        }
        pageNums.forEach(p => {
            if (p === '...') {
                pages.push('<span class="page-btn" style="pointer-events:none;border:none;box-shadow:none;">...</span>');
            } else {
                pages.push(`<button type="button" class="page-btn tracking-page ${p === 1 ? 'is-active' : ''}" data-page="${p}">${p}</button>`);
            }
        });
        pages.push(`<button type="button" class="page-btn tracking-page" data-page="${Math.min(2, last)}" ${last <= 1 ? 'disabled' : ''}>${attendanceTranslate('next')}</button>`);
        document.getElementById('trackingPagination').innerHTML = pages.join('');
    } else {
        renderTrackingPagination();
    }
});

renderTrackingPagination();