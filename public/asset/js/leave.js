const appUrl = $('meta[name=app-url]').attr("content");
 
const approveLeaveRequestModal = new bootstrap.Modal('#approveLeaveRequestModal', {
  keyboard: false
});

const rejectLeaveRequestModal = new bootstrap.Modal('#rejectLeaveRequestModal', {
  keyboard: false
});

const employeeLeaveModal = new bootstrap.Modal('#employeeLeaveModal', {
  keyboard: false
});

// EMPLOYEE LEAVE

let CURRENT_DATE = new Date();
let DATA_EMPLOYEE_LEAVE = [];

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

    CURRENT_DATE.setYear(parseInt(yearChoose));

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

            DATA_EMPLOYEE_LEAVE = response.data;
            //$('.table-attendance .col-day').removeClass('is-late');

            $(`.employee-row .col-annual-leave`).text(0);
            $(`.employee-row .col-use-annual-leave`).text(0);
            $(`.employee-row .col-sick`).text(0);

            for (let i = 0; i < DATA_EMPLOYEE_LEAVE.length; i++) {
                const leave = DATA_EMPLOYEE_LEAVE[i];   
                
                $(`.employee-row[data-employee-id="${leave.employee_id}"] .col-annual-leave`).text(leave.annual_leave);
                $(`.employee-row[data-employee-id="${leave.employee_id}"] .col-use-annual-leave`).text((leave.annual_leave - leave.remaining_annual_leave));
                $(`.employee-row[data-employee-id="${leave.employee_id}"] .col-sick`).text(leave.sick);
            }

        }
         
    });

}

getEmployeeLeaveByYear(CURRENT_DATE.getFullYear());

$('#employeeLeaveModal .btn-close-modal').on('click',function(){

    $('#form-edit-employee-leave')[0].reset();

    employeeLeaveModal.hide();
});

$(document).on('click','.table-leave-employee .employee-row',function(){
    let employeeId = parseInt($(this).attr('data-employee-id'));
    let employeeName = $(this).attr('data-employee-name');
    let employeePhoto = $(this).attr('data-employee-photo');

    if(employeePhoto == '' || employeePhoto == null){
        employeePhoto = appUrl+'/asset/img/avatar.png';
    }
        
    $('#employeeLeaveModal .employee-photo img').attr('src',employeePhoto);
    $('#employeeLeaveModal .employee-name').text(employeeName);

    
    $('#form-edit-employee-leave .year-leave').text(CURRENT_DATE.getFullYear());
    $('#form-edit-employee-leave [name="year"]').val(CURRENT_DATE.getFullYear());
    $('#form-edit-employee-leave [name="id_employee"]').val(employeeId);

    
    let rowItem = DATA_EMPLOYEE_LEAVE.find(item => item.employee_id == employeeId);
    
    if(rowItem){
        
        $('#form-edit-employee-leave [name="annual_leave"]').val(rowItem.annual_leave);
        
        employeeLeaveModal.show();
    }else{
        $('#form-edit-employee-leave [name="id_employee"]').val(employeeId);
        $('#form-edit-employee-leave [name="annual_leave"]').val(0);

        employeeLeaveModal.show();
    }
    
});

function validationFormEmployeeLeave(){

    $('#form-edit-employee-leave').find('[attr-validation="required"]').each(function(){
        if(!$(this).val()){
            $(this).addClass('is-invalid');
        }else{
            $(this).removeClass('is-invalid');
        }
    });


    if($('#form-edit-employee-leave [attr-validation="required"]').hasClass('is-invalid')){
        return false;
    }else{
        return true;
    }

}

$('#employeeLeaveModal .btn-submit-modal').on('click',function(){
    
    if(validationFormEmployeeLeave()){
        editEmployeeLeave();
    }

});

function editEmployeeLeave(){
    $.ajax({
        url: appUrl + "/leave/edit-employee-leave-by-year",
        type: "POST",
        data: new FormData($('#form-edit-employee-leave').get(0)) ,
        cache: false,
        processData: false,
        contentType: false,
        beforeSend:function(){
            $('#employeeLeaveModal .box-loader').fadeIn();
        },
        error:function(res){
            var resJson = res.responseJSON;
            showAlertMsg(resJson.message,'error',5000);
            $('#employeeLeaveModal .box-loader').fadeOut();
            //$('.loader').fadeOut('fast');
        },
        success: function(res) {
            
            showAlertMsg(res.message,'success',3000);

            getEmployeeLeaveByYear(CURRENT_DATE.getFullYear());

            employeeLeaveModal.hide();
            $('#employeeLeaveModal .box-loader').fadeOut();
            $('#form-edit-employee-leave')[0].reset();
            
        }
    });
}

// END EMPLOYEE LEAVE



//LEAVE REQUEST

let SEARCH_QUERY_LEAVE_REQUEST = '';
let DATA_LEAVE_REQUEST = [];
let PAGE_LEAVE_REQUEST = 1;

$('.col-leave-request .input-search-query-request').on('keyup',function(){
    
    SEARCH_QUERY_LEAVE_REQUEST = $(this).val();
    getAllEmployeeLeaveRequest();

});

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

    if(dataRow.status == 'REQUEST'){
        actionButton = `
            <div class="">
                <button class="btn btn-action reject">
                    <span class="material-symbols-outlined check-icon">close</span>
                    Reject
                </button>
            </div>

            <div class="">
                <button class="btn btn-action approve">
                    <span class="material-symbols-outlined check-icon">check</span>
                    Approve
                </button>
            </div>
        `;
    }
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
                            <div class="item-day">${dataRow.day_amount} Day</div>
                            <div class="item-type">${leaveType}</div>
                        </div>
                    </div>
                </div>

                <div class="h-line my-2"></div>
                
                <div class="">
                    <div class="d-flex align-items-start justify-content-between gap-3">
                        <div class="col-desciption w-100">
                            <div class="item-description">
                                ${dataRow.reason}
                            </div>
                        </div>
                        <div class="col-status">
                            <div class="item-status ${dataRow.status.toLowerCase()}">${capitalizeFirstLetter(dataRow.status)}</div>
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

function getAllEmployeeLeaveRequest(){

    $.ajax({
        url: appUrl + "/leave/all-employee-leave-request",
        type: "GET",
        data:{
            'SEARCH_QUERY_LEAVE_REQUEST' : SEARCH_QUERY_LEAVE_REQUEST,
            'page' : PAGE_LEAVE_REQUEST,
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
            
            DATA_LEAVE_REQUEST = response.data.employeeLeaveRequest;

            let rowItem = '';
                
            for (let i = 0; i < DATA_LEAVE_REQUEST.length; i++) {
                rowItem += htmlDataRequestTimeOff(DATA_LEAVE_REQUEST[i]);
            }

            if(DATA_LEAVE_REQUEST.length < 1){
                rowItem = `<div class="p-3 fs-12 mb-5 mt-2 border rounded-2">No Data</div>`;
            }
            $('.col-leave-request .box-data').html(rowItem);

            //attendance-checkin attendance-checkout attendance-work-duration

            //modalAttendance.show();
        
        }
         
    });

}

getAllEmployeeLeaveRequest();
//END LEAVE REQUEST

// REJECT LEAVE REQUEST
//item-time-off btn-action reject approve

$(document).on('click','.item-time-off .btn-action.reject',function(){

    let timeOffId = $(this).closest('.item-time-off').attr('data-time-off');

    let rowItem = DATA_LEAVE_REQUEST.find(item => item.id == timeOffId);

    if(rowItem){
        
        $('#form-reject-leave-request .box-data').html('');

        $('#form-reject-leave-request [name="id_leave_request"]').val(rowItem.id);
        $('#form-reject-leave-request [name="id_employee"]').val(rowItem.employee.id);
        
        let htmlData = $(htmlDataRequestTimeOff(rowItem));
        htmlData.find('.item-footer').html(' ');


        $('#form-reject-leave-request .box-data').html(htmlData);
 
        rejectLeaveRequestModal.show();

    }else{
        showAlertMsg(resJson.message,'Not found',5000);
    }

});

$('#rejectLeaveRequestModal .btn-close-modal').on('click',function(){
    rejectLeaveRequestModal.hide();
    $('#form-reject-leave-request')[0].reset();
});

function validationFormReject(){

    $('#form-reject-leave-request').find('[attr-validation="required"]').each(function(){
        if(!$(this).val()){
            $(this).addClass('is-invalid');
        }else{
            $(this).removeClass('is-invalid');
        }
    });


    if($('#form-reject-leave-request [attr-validation="required"]').hasClass('is-invalid')){
        return false;
    }else{
        return true;
    }

}

$('#rejectLeaveRequestModal .btn-submit-modal').on('click',function(){
    
    if(validationFormReject()){
        rejectLeaveRequest();
    }

});

function rejectLeaveRequest(){
    $.ajax({
        url: appUrl + "/leave/reject-employee-leave-request",
        type: "POST",
        data: new FormData($('#form-reject-leave-request').get(0)) ,
        cache: false,
        processData: false,
        contentType: false,
        beforeSend:function(){
            $('#rejectLeaveRequestModal .box-loader').fadeIn();
        },
        error:function(res){
            var resJson = res.responseJSON;
            showAlertMsg(resJson.message,'error',5000);
            $('#rejectLeaveRequestModal .box-loader').fadeOut();
            //$('.loader').fadeOut('fast');
        },
        success: function(res) {
            
            showAlertMsg(res.message,'success',3000);

            getEmployeeLeaveByYear(CURRENT_DATE.getFullYear());
            getAllEmployeeLeaveRequest();

            rejectLeaveRequestModal.hide();
            $('#rejectLeaveRequestModal .box-loader').fadeOut();
            $('#form-reject-leave-request')[0].reset();
            
        }
    });
}

// END REJECT LEAVE REQUEST


// APPROVE LEAVE REQUEST
//item-time-off btn-action approve

$(document).on('click','.item-time-off .btn-action.approve',function(){

    let timeOffId = $(this).closest('.item-time-off').attr('data-time-off');

    let rowItem = DATA_LEAVE_REQUEST.find(item => item.id == timeOffId);

    if(rowItem){
        
        $('#form-approve-leave-request .box-data').html('');

        $('#form-approve-leave-request [name="id_leave_request"]').val(rowItem.id);
        $('#form-approve-leave-request [name="id_employee"]').val(rowItem.employee.id);
        
        let htmlData = $(htmlDataRequestTimeOff(rowItem));
        htmlData.find('.item-footer').html(' ');


        $('#form-approve-leave-request .box-data').html(htmlData);
 
        approveLeaveRequestModal.show();

    }else{
        showAlertMsg(resJson.message,'Not found',5000);
    }

});

$('#approveLeaveRequestModal .btn-close-modal').on('click',function(){
    approveLeaveRequestModal.hide();
    $('#form-approve-leave-request')[0].reset();
});

$('#approveLeaveRequestModal .btn-submit-modal').on('click',function(){
    
    $.ajax({
        url: appUrl + "/leave/approve-employee-leave-request",
        type: "POST",
        data: new FormData($('#form-approve-leave-request').get(0)) ,
        cache: false,
        processData: false,
        contentType: false,
        beforeSend:function(){
            $('#approveLeaveRequestModal .box-loader').fadeIn();
        },
        error:function(res){
            var resJson = res.responseJSON;
            showAlertMsg(resJson.message,'error',5000);
            $('#approveLeaveRequestModal .box-loader').fadeOut();
            //$('.loader').fadeOut('fast');
        },
        success: function(res) {
            
            showAlertMsg(res.message,'success',3000);
            getEmployeeLeaveByYear(CURRENT_DATE.getFullYear());
            getAllEmployeeLeaveRequest();
            approveLeaveRequestModal.hide();
            $('#approveLeaveRequestModal .box-loader').fadeOut();
            $('#form-approve-leave-request')[0].reset();
            
        }
    });

});


// END APPROVE LEAVE REQUEST



function capitalizeFirstLetter(str) {
    const formattedStr = str
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

    return formattedStr;
}

