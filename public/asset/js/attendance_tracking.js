const appUrl = $('meta[name=app-url]').attr("content");

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

        $(this).find('.calendar-week-short').text(arrWeekdayNameENMedium(newDateDay))
        

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
                    
                    $('[data-employee-id="'+attendance.employee_id+'"] [data-day="'+dayOfMonth+'"] .description-leave').text('ABSENT');
                }

                if(attendance.status == 'SICK'){
                    $('[data-employee-id="'+attendance.employee_id+'"] [data-day="'+dayOfMonth+'"] .time-in').text('');
                    $('[data-employee-id="'+attendance.employee_id+'"] [data-day="'+dayOfMonth+'"] .time-out').text('');
                    
                    $('[data-employee-id="'+attendance.employee_id+'"] [data-day="'+dayOfMonth+'"] .description-leave').text('SICK');
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
                    textLeave = 'LEAVE';
                }
                else if(employeeLeaveRequest.leave_type == 'SICK'){
                    textLeave = 'SICK';
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
        showAlertMsg('Employee day off','error',5000);
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

    let leaveType = capitalizeFirstLetter(dataRow.leave_type);
    
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
                                            ${formatDateENMedium(dataRow.start_date)} - ${formatDateENMedium(dataRow.end_date)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-day-type">
                            <div class="item-status ${dataRow.status.toLowerCase()}">${capitalizeFirstLetter(dataRow.status)}</div>
                            
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
                            <div class="item-day">${dataRow.day_amount} Day</div>
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

    $('#modalAttendance .attendance-status').text(attendanceStatus);
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
        showAlertMsg('Attendance Not Complete Yet','error',5000);
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