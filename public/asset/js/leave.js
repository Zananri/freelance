const appUrl = $('meta[name=app-url]').attr("content");

const modalAttendance = new bootstrap.Modal('#modalAttendance', {
  keyboard: false
});

let CURRENT_DATE = new Date();

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

$(document).on('click','.dropdown-year .year-item',function(){
    let yearChoose = $(this).attr('data-year');
    $('.btn-dropdown-year .text-year').text(yearChoose);
    getEmployeeLeaveByYear(yearChoose);
    //$('.dropdown-month.show').removeClass('show');
});

$(document).on('click','.data-fullscreen, .data-fullscreen-exit',function(){
    $('.leave-container').toggleClass('fullscreen');
    $('.data-fullscreen').toggleClass('d-none');
});

$(document).on('click','.data-fullscreen-request',function(){
    $('.leave-container').toggleClass('fullscreen-request');
    $('.data-fullscreen-request').toggleClass('d-none');
});

function getEmployeeLeaveByYear(year)
{

    $.ajax({
        url: appUrl + "/leave/employee-leave-by-year",
        type: "GET",
        data:{
            'YEAR' : year
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

            //$('.table-attendance .col-day').removeClass('is-late');

            for (let i = 0; i < resData.length; i++) {
                const leave = resData[i];   
                
                $(`.employee-row[data-employee-id="${leave.employee_id}"] .col-annual-leave`).text(leave.annual_leave);
                $(`.employee-row[data-employee-id="${leave.employee_id}"] .col-use-annual-leave`).text((leave.annual_leave - leave.remaining_annual_leave));
                $(`.employee-row[data-employee-id="${leave.employee_id}"] .col-sick`).text(leave.sick);
            }

        }
         
    });

}

getEmployeeLeaveByYear(CURRENT_DATE.getFullYear());

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




//LEAVE REQUEST

function htmlDataRequestTimeOff(dataRow){

    let leaveType = capitalizeFirstLetter(dataRow.leave_type);
    
    let file1 = '';
    let file2 = '';

    if(dataRow.file_1){
        file1 = `
            <a class="btn-action" target="_blank" href="${appUrl}/${dataRow.file_1}">
                <span class="material-symbols-outlined">attach_file</span>
            </a>
            `;
    }

    if(dataRow.file_2){
        file2 = `
            <a class="btn-action" target="_blank" href="${appUrl}/${dataRow.file_2}">
                <span class="material-symbols-outlined">attach_file</span>
            </a>
            `;
    }

    var rowItem = `
        <div class="item-time-off mb-3" data-time-off="${dataRow.id}">
            <div class="item-header mb-2">
                <div class="mb-0">
                    <div class="d-flex align-items-center justify-content-between">
                        <div class="col-title">
                            <div class="item-title me-2">${leaveType}</div>
                        </div>
                        <div class="col-day-status">
                            <div class="item-day">${dataRow.day_amount} Day</div>
                        </div>
                    </div>
                </div>
                <div>
                    <div class="d-flex align-items-center justify-content-between">
                        <div class="col-date"> 
                            <div class="item-date">
                                ${formateDateNumMonYear(dataRow.start_date)} - ${formateDateNumMonYear(dataRow.end_date)}
                            </div>
                        </div>
                        <div class="col-status">
                            <div class="item-status">${capitalizeFirstLetter(dataRow.status)}</div>
                        </div>
                    </div>
                </div>
                
            </div>
            <div class="item-body mb-2">
                <div class="d-flex align-items-center justify-content-between">
                    <div class="col-description">
                        <div class="item-description">
                            ${dataRow.reason}
                        </div>
                    </div> 
                </div>
            </div>
            <div class="item-footer">
                <div class="d-flex align-items-center justify-content-between">
                    
                    <div class="">

                    </div>
                    
                    <div class="col-item-action">
                        <div class="item-action">
                            ${file1}
                            ${file2}

                            <div class="btn-action edit-time-off">
                                <span class="material-symbols-outlined">edit</span>
                            </div>
                            <div class="btn-action delete-time-off">
                                <span class="material-symbols-outlined">delete</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    return rowItem;
}

//END LEAVE REQUEST



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

function formateDateNumMonYear(dateString){

    if (!dateString) return '';

    const newDate = new Date(dateString); // Or your specific date object

    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

    //const dayOfWeek = weekdays[newDate.getDay()];
    const dateNumber = newDate.getDate();
    const monthName = months[newDate.getMonth()];
    const year = newDate.getFullYear();

    const formattedDate = `${dateNumber} ${monthName} ${year}`;

    return formattedDate;

}

function capitalizeFirstLetter(str) {
    const formattedStr = str
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

    return formattedStr;
}

