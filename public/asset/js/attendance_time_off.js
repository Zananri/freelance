const timeOffModal = new bootstrap.Modal('#timeOffModal', {
  keyboard: false
});
const requestTimeOffModal = new bootstrap.Modal('#requestTimeOffModal', {
  keyboard: false
});

const editTimeOffModal = new bootstrap.Modal('#editTimeOffModal', {
  keyboard: false
});

const deleteTimeOffModal = new bootstrap.Modal('#deleteTimeOffModal', {
  keyboard: false
});

const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

function capitalizeFirstLetter(str) {
    const formattedStr = str
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

    return formattedStr;
}

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

    let actionButton = '';
    let rejectText = '';

    if(dataRow.status == 'REQUEST' ){
        actionButton = `
            <div class="btn-action edit-time-off">
                <span class="material-symbols-outlined">edit</span>
            </div>
            <div class="btn-action delete-time-off">
                <span class="material-symbols-outlined">delete</span>
            </div>
        `;

        
    }

    if(dataRow.reject_reason != null && dataRow.reject_reason != '' && dataRow.reject_reason != 'null'){
        rejectText = `
            <div class="text-danger fs-12">NOTE : ${dataRow.reject_reason}</div>
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
                            <div class="item-status ${dataRow.status.toLowerCase()} ">${capitalizeFirstLetter(dataRow.status)}</div>
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
                        ${rejectText}
                    </div>
                    
                    <div class="col-item-action">
                        <div class="item-action">
                            ${file1}
                            ${file2}

                            ${actionButton}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    return rowItem;
}


let SEARCH_QUERY_TIME_OFF = '';
let PAGE_DATA_TIME_OFF = 1;
let ARR_DATA_TIME_OFF = [];

function getAllRequestTimeOff(){

    $.ajax({
        url: appUrl + "/employee-time-off/all-request",
        type: "GET",
        data:{
            'SEARCH_QUERY' : SEARCH_QUERY_TIME_OFF,
            'page' : PAGE_DATA_TIME_OFF
        },
        beforeSend:function(){
            //$('.col-user-management .loader').fadeIn('fast');
        },
        error:function(res){
          //$('.col-user-management .loader').fadeOut('fast');
        },
        success: function(response) {
            
            ARR_DATA_TIME_OFF = response.data.employeeLeaveRequest;

            $('#timeOffModal .box-data').html('');

            var rowHtml = '';

            for (let i = 0; i < ARR_DATA_TIME_OFF.length; i++) {
                
                rowHtml += htmlDataRequestTimeOff(ARR_DATA_TIME_OFF[i]);
            }

            $('#timeOffModal .box-data').html(rowHtml);
        }
         
    });

}

getAllRequestTimeOff();


// SUBMIT TIME OFF
$('#requestTimeOffModal .btn-close-modal').on('click',function(){
    requestTimeOffModal.hide();
    timeOffModal.show();
    $('#form-time-off')[0].reset();
});

$('#timeOffModal .btn-submit-modal').on('click',function(){
    
    timeOffModal.hide();
    requestTimeOffModal.show();

});

$('#requestTimeOffModal .btn-submit-modal').on('click',function(){
    
    if(validationFormRequestTimeOff()){
        submitFormRequestTimeOff();
    }

});

function submitFormRequestTimeOff(){

    $.ajax({
        url: appUrl + "/employee-time-off/submit-new-request",
        type: "POST",
        data: new FormData($('#form-request-time-off').get(0)) ,
        cache: false,
        processData: false,
        contentType: false,
        beforeSend:function(){
            $('#requestTimeOffModal .box-loader').fadeIn();
        },
        error:function(res){
            var resJson = res.responseJSON;
            showAlertMsg(resJson.message,'error',5000);
            $('#requestTimeOffModal .box-loader').fadeOut();
            //$('.loader').fadeOut('fast');
        },
        success: function(res) {
            
            showAlertMsg(res.message,'success',3000);

            getAllRequestTimeOff();
            timeOffModal.show();
            requestTimeOffModal.hide();
            $('#requestTimeOffModal .box-loader').fadeOut();
            
        }
    });
    
}


$('#form-request-time-off [attr-validation="required"]').on('change',function(){
    if($(this).val()){
        $(this).removeClass('is-invalid');
    }
});

function validationFormRequestTimeOff(){

    $('#form-request-time-off').find('[attr-validation="required"]').each(function(){
        if(!$(this).val()){
            $(this).addClass('is-invalid');
        }else{
            $(this).removeClass('is-invalid');
        }
    });


    if($('#form-request-time-off [attr-validation="required"]').hasClass('is-invalid')){
        return false;
    }else{
        return true;
    }

}

// END SUBMIT TIME OFF


// EDIT  TIME OFF

$('#editTimeOffModal .btn-close-modal').on('click',function(){
    editTimeOffModal.hide();
    timeOffModal.show();
    $('#form-edit-time-off')[0].reset();
});

$(document).on('click','.item-action .edit-time-off',function(){
    let timeOffId = $(this).closest('.item-time-off').attr('data-time-off');

    let rowItem = ARR_DATA_TIME_OFF.find(item => item.id == timeOffId);

    if(rowItem){
        setFormEditValue(rowItem);
        timeOffModal.hide();
        editTimeOffModal.show();
    }else{
        showAlertMsg(resJson.message,'Not found',5000);
    }

});

$('#form-edit-time-off .remove-file-1').on('click',function(){
    $('#form-edit-time-off .pill-file-1').addClass('d-none');
    $('#form-edit-time-off .old_file_1_name').text('').attr('href','');
    $('#form-edit-time-off [name="old_file_1"]').val('');
});

$('#form-edit-time-off .remove-file-2').on('click',function(){
    $('#form-edit-time-off .pill-file-2').addClass('d-none');
    $('#form-edit-time-off .old_file_2_name').text('').attr('href','');
    $('#form-edit-time-off [name="old_file_2"]').val('');
});

function setFormEditValue(rowItem){

    $('#form-edit-time-off [name="id_time_off"]').val(rowItem.id);
    $('#form-edit-time-off [name="old_file_1"]').val(rowItem.file_1);
    $('#form-edit-time-off [name="old_file_2"]').val(rowItem.file_2);
    $('#form-edit-time-off [name="leave_type"]').val(rowItem.leave_type);
    $('#form-edit-time-off [name="description"]').val(rowItem.reason);
    $('#form-edit-time-off [name="start_date"]').val(rowItem.start_date);
    $('#form-edit-time-off [name="end_date"]').val(rowItem.end_date);    
    $('#form-edit-time-off .pill-file-1').addClass('d-none');
    $('#form-edit-time-off .pill-file-2').addClass('d-none');


    if(rowItem.file_1){
        let file1Name = rowItem.file_1.split('/').pop();
        $('#form-edit-time-off .old_file_1_name').text(file1Name).attr('href',appUrl+'/'+rowItem.file_1);
        $('#form-edit-time-off .pill-file-1').removeClass('d-none');
    }

    if(rowItem.file_2){
        let file2Name = rowItem.file_2.split('/').pop();
        $('#form-edit-time-off .old_file_2_name').text(file2Name).attr('href',appUrl+'/'+rowItem.file_2);
        $('#form-edit-time-off .pill-file-2').removeClass('d-none');
    }

}

function validationFormEditTimeOff(){

    $('#form-edit-time-off').find('[attr-validation="required"]').each(function(){
        if(!$(this).val()){
            $(this).addClass('is-invalid');
        }else{
            $(this).removeClass('is-invalid');
        }
    });


    if($('#form-edit-time-off [attr-validation="required"]').hasClass('is-invalid')){
        return false;
    }else{
        return true;
    }

}

$('#editTimeOffModal .btn-submit-modal').on('click',function(){
    
    if(validationFormEditTimeOff()){
        saveFormEditTimeOff();
    }

});

function saveFormEditTimeOff(){

    $.ajax({
        url: appUrl + "/employee-time-off/edit-time-off",
        type: "POST",
        data: new FormData($('#form-edit-time-off').get(0)) ,
        cache: false,
        processData: false,
        contentType: false,
        beforeSend:function(){
            $('#editTimeOffModal .box-loader').fadeIn();
        },
        error:function(res){
            var resJson = res.responseJSON;
            showAlertMsg(resJson.message,'error',5000);
            $('#editTimeOffModal .box-loader').fadeOut();
            //$('.loader').fadeOut('fast');
        },
        success: function(res) {
            
            showAlertMsg(res.message,'success',3000);

            getAllRequestTimeOff();
            timeOffModal.show();
            editTimeOffModal.hide();
            $('#editTimeOffModal .box-loader').fadeOut();
            $('#form-edit-time-off')[0].reset();
            
        }
    });
}

// END EDIT TIME OFF

// DELETE TIME OFF

$('#deleteTimeOffModal .btn-close-modal').on('click',function(){
    deleteTimeOffModal.hide();
    timeOffModal.show();
    $('#form-delete-time-off')[0].reset();
});

$(document).on('click','.item-action .delete-time-off',function(){
    let timeOffId = $(this).closest('.item-time-off').attr('data-time-off');

    let rowItem = ARR_DATA_TIME_OFF.find(item => item.id == timeOffId);

    if(rowItem){

        $('#form-delete-time-off .box-data').html('');

        $('#form-delete-time-off [name="id_time_off"]').val(rowItem.id);

        let htmlData = $(htmlDataRequestTimeOff(rowItem));
        htmlData.find('.item-footer').html(' ');


        $('#form-delete-time-off .box-data').html(htmlData);

        timeOffModal.hide();
        deleteTimeOffModal.show();
    }else{
        showAlertMsg(resJson.message,'Not found',5000);
    }

});

$('#deleteTimeOffModal .btn-submit-modal').on('click',function(){
    
    $.ajax({
        url: appUrl + "/employee-time-off/delete-time-off",
        type: "POST",
        data: new FormData($('#form-delete-time-off').get(0)) ,
        cache: false,
        processData: false,
        contentType: false,
        beforeSend:function(){
            $('#deleteTimeOffModal .box-loader').fadeIn();
        },
        error:function(res){
            var resJson = res.responseJSON;
            showAlertMsg(resJson.message,'error',5000);
            $('#deleteTimeOffModal .box-loader').fadeOut();
            //$('.loader').fadeOut('fast');
        },
        success: function(res) {
            
            showAlertMsg(res.message,'success',3000);

            getAllRequestTimeOff();
            timeOffModal.show();
            deleteTimeOffModal.hide();
            $('#deleteTimeOffModal .box-loader').fadeOut();
            $('#form-delete-time-off')[0].reset();
            
        }
    });

});

// END DELETE TIME OFF