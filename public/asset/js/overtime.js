const appUrl = $('meta[name=app-url]').attr("content");

const overtimePhotoModal = new bootstrap.Modal('#overtimePhotoModal', {
  keyboard: false
});

const overtimeApproveModal = new bootstrap.Modal('#overtimeApproveModal', {
  keyboard: false
});

const overtimeRejectModal = new bootstrap.Modal('#overtimeRejectModal', {
  keyboard: false
});


// EMPLOYEE LEAVE

let CURRENT_DATE = new Date();
let DATA_OVERTIME_REQUEST = [];
let SEARCH_QUERY_OVERTIME_REQUEST = '';
let PAGE_OVERTIME_REQUEST = 1;



function htmlDataRequestOvertime(dataRow){
    
    //     [
    //     {
    //         "id": 7,
    //         "employee_id": 4,
    //         "status": "REQUEST_SUBMIT",
    //         "description": "Cek",
    //         "date_overtime": "2025-10-06",
    //         "time_start": "17:59:00",
    //         "time_end": "18:00:00",
    //         "total_overtime": "00:01:00",
    //         "photo_start": "file/overtime/OVERTIME_4_1759748378.jpg",
    //         "photo_end": "file/overtime/OVERTIME_4_1759748410.jpg",
    //         "location_start": null,
    //         "location_end": null,
    //         "created_by": 9,
    //         "updated_by": 9,
    //         "reject_by": 0,
    //         "approve_by": 0,
    //         "approve_at": null,
    //         "reject_at": null,
    //         "reject_note": null,
    //         "created_at": "2025-10-06T10:59:38.000000Z",
    //         "updated_at": "2025-10-06T11:00:10.000000Z",
    //         "employee": {
    //             "id": 4,
    //             "user_id": 9,
    //             "department_id": 1,
    //             "division_id": 2,
    //             "job_id": 7,
    //             "shift_id": 6,
    //             "weekday_off": "1,5,6",
    //             "profile_picture": "file/profile_picture/PROFILE_PICTURE_1756457192.jpg",
    //             "name": "Hendy Pratama Herman",
    //             "employee_niks": "NSAID-007",
    //             "email": "hendypratama@nsaperformance.id",
    //             "email_work": "hendypratama@nsaperformance.id",
    //             "phone": "085174339475",
    //             "status": "ACTIVE",
    //             "address": "jakaKedaung Kali Angke\r\nCengkareng\r\nWest Jakarta City\r\nJakarta",
    //             "photo": "file/photo/PHOTO_1756457192.jpg",
    //             "ktp": "file/ktp/KTP_Hendy_Pratama_Herman.jpg",
    //             "birth_date": "2000-01-01",
    //             "hire_date": "2024-01-01",
    //             "contract_end_date": "2025-09-30",
    //             "resign_date": null,
    //             "grade_id": 1,
    //             "office": 1,
    //             "created_by": 4,
    //             "deleted_by": null,
    //             "updated_by": 4,
    //             "created_at": "2025-08-29T08:46:32.000000Z",
    //             "updated_at": "2025-10-02T03:03:45.000000Z"
    //         }
    //     }
    // ]

    let photoStart = '';
    let photoEnd = '';
    
    let btnReject = `
        <div class="">
            <button class="btn btn-action reject">
                <span class="material-symbols-outlined check-icon">close</span>
                Reject
            </button>
        </div>
    `;

    let btnApprove = `
        <div class="">
            <button class="btn btn-action approve">
                <span class="material-symbols-outlined check-icon">check</span>
                Approve
            </button>
        </div>
    `;
    


    if(dataRow.photo_start){
        photoStart = `<img src="${appUrl}/${dataRow.photo_start}" class="img-stamp photo-start" alt="">`;
    }
     
    if(dataRow.photo_end){
        photoEnd = `<img src="${appUrl}/${dataRow.photo_end}" class="img-stamp photo-end" alt="">`;
    }
    
    if(dataRow.status == 'APPROVED' || dataRow.status == 'REJECTED'){
        btnReject = '';
        btnApprove = '';
    }
    
    //console.log(`${dataRow.date_overtime} ${formatDatePHP('Y-m-d',new Date().toString())}`);

    let employeePhoto = dataRow.employee.photo;

    if(employeePhoto == '' || employeePhoto == null){
        employeePhoto = appUrl+'/asset/img/avatar.png';
    }
    
    let htmlRow = `
        <div class="item-overtime mb-3" data-overtime="${dataRow.id}" data-employee="${dataRow.employee.id}" data-status="${dataRow.status}">
            <div class="item-header mb-2">
                <div class="mb-0">
                    <div class="d-flex align-items-center justify-content-between">
                        <div class="col-employee">
                            <div class="box-employee">
                                <div class="d-flex align-items-center">
                                    <div class="col-photo">
                                        <div class="employee-photo">
                                            <img src="${employeePhoto}" class="rounded-circle w-100 h-100 object-fit-cover" alt="">
                                        </div>
                                    </div>
                                    <div class="col-name w-100">
                                        <div class="employee-name">
                                            ${dataRow.employee.name}
                                        </div>
                                        <div class="item-date">
                                            ${formatDateENMedium(dataRow.date_overtime)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-time-overtime">
                            <div class="total-overtime">${formatTimeDisplayHm(dataRow.total_overtime)}</div>
                            <div class="item-hour-range">${formatTimeDisplay(dataRow.time_start)} - ${formatTimeDisplay(dataRow.time_end)}</div>
                        </div>
                    </div>
                </div>

                <div class="h-line my-2"></div>
                
                <div class="">
                    <div class="d-flex align-items-start justify-content-between gap-3">
                        <div class="col-desciption w-100">
                            <div class="item-description">
                                ${dataRow.description}
                            </div>
                        </div>
                        <div class="col-status">
                            <div class="item-status ${dataRow.status.toLowerCase()}">
                                ${capitalizeFirstLetter(dataRow.status)}
                            </div>
                        </div>
                    </div>
                </div>
                
            </div>
            <div class="item-footer ">
                <div class="d-flex align-items-center justify-content-between mt-2">
                    <div class="col-item-action mb-2">
                        <div class="item-action d-flex gap-3 justify-content-end ">

                            <div class="">
                                ${photoStart}
                                ${photoEnd}
                            </div>

                        </div>
                    </div>                     
                    <div class="col-item-action mb-2">
                        <div class="item-action d-flex gap-3 justify-content-end ">
                            
                            ${btnReject}
                            ${btnApprove}
        
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    return htmlRow;
}

function getAllEmployeeOvertimeRequest(){

    $.ajax({
        url: appUrl + "/overtime/employee-overtime-request",
        type: "GET",
        data:{
            'SEARCH_QUERY' : SEARCH_QUERY_OVERTIME_REQUEST,
            'page' : PAGE_OVERTIME_REQUEST,
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
            
            DATA_OVERTIME_REQUEST = response.data.employee_overtime;

            let rowItem = '';
                
            for (let i = 0; i < DATA_OVERTIME_REQUEST.length; i++) {
                rowItem += htmlDataRequestOvertime(DATA_OVERTIME_REQUEST[i]);
            }

            if(DATA_OVERTIME_REQUEST.length < 1){
                rowItem = `<div class="p-3 fs-12 mb-5 mt-2 border rounded-2">No Data</div>`;
            }

            $('.col-overtime-request .box-data').html(rowItem);

            //attendance-checkin attendance-checkout attendance-work-duration

            //modalAttendance.show();
        
        }
         
    });

}

getAllEmployeeOvertimeRequest();

$('.input-search-overtime-request').on('keyup',function(){
    SEARCH_QUERY_OVERTIME_REQUEST = $(this).val();
    PAGE_OVERTIME_REQUEST = 1;
    getAllEmployeeOvertimeRequest();
});



function capitalizeFirstLetter(str) {
    const formattedStr = str
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

    return formattedStr;
}

$(document).on('click','.col-overtime-request .img-stamp',function(){
    let photo = $(this).attr('src');
    $('#overtimePhotoModal .img-viewer').attr('src',photo);
    overtimePhotoModal.show();
});

$('#overtimePhotoModal .btn-close-img-viewer').on('click',function(){
    overtimePhotoModal.hide();
});



// APPROVE OVERTIME
$('#overtimeApproveModal .btn-close-modal').on('click',function(){
    overtimeApproveModal.hide();
    $('#form-approve-overtime')[0].reset();
});

$('#overtimeApproveModal .photo-start, #overtimeApproveModal .photo-end').on('click',function(){
    $('#overtimeApproveModal .box-img-view .img-viewer').attr('src',$(this).attr('src'));
    $('#overtimeApproveModal .box-img-view').fadeIn('fast');
});

$('#overtimeApproveModal .btn-close-img-viewer').on('click',function(){
    $('#overtimeApproveModal .box-img-view').fadeOut('fast');
});



$(document).on('click','.item-overtime .btn-action.approve',function(){
    let overtimeId = $(this).closest('.item-overtime').data('overtime');
    let employeeId = $(this).closest('.item-overtime').data('employee');
    let status = $(this).closest('.item-overtime').data('status');

    let dataRow = DATA_OVERTIME_REQUEST.find(item => item.id == overtimeId);

    $('#overtimeApproveModal .img-employee-photo').attr('src',appUrl+'/'+dataRow.employee.photo);
    $('#overtimeApproveModal .employee-name').html(dataRow.employee.name);
    
    $('#overtimeApproveModal .item-date').html(formatDateENMedium(dataRow.date_overtime));
    $('#overtimeApproveModal .total-overtime').html(formatTimeDisplayHm(dataRow.total_overtime));
    $('#overtimeApproveModal .item-hour-range').html(formatTimeDisplay(dataRow.time_start) + ' - ' + formatTimeDisplay(dataRow.time_end));
    $('#overtimeApproveModal .item-description').html(dataRow.description);
    $('#overtimeApproveModal .item-status').html(capitalizeFirstLetter(dataRow.status));

    $('#overtimeApproveModal .photo-start').attr('src',appUrl+'/'+dataRow.photo_start);
    $('#overtimeApproveModal .photo-end').attr('src',appUrl+'/'+dataRow.photo_end);

    if(dataRow.photo_end){
        $('#overtimeApproveModal .col-photo-end').removeClass('d-none');
    }else{
        $('#overtimeApproveModal .col-photo-end').addClass('d-none');
    }

    
    $('#form-approve-overtime input[name=overtime_id]').val(overtimeId);
    $('#form-approve-overtime input[name=employee_id]').val(employeeId);


    overtimeApproveModal.show();
});

$('#overtimeApproveModal .btn-submit-modal').on('click',function(){
    approveOvertimeRequest();
});

function approveOvertimeRequest(){
    $.ajax({
        url: appUrl + "/overtime/approve-employee-overtime-request",
        type: "POST",
        data: new FormData($('#form-approve-overtime').get(0)) ,
        cache: false,
        processData: false,
        contentType: false,
        beforeSend:function(){
            $('#overtimeApproveModal .box-loader').fadeIn();
        },
        error:function(res){
            var resJson = res.responseJSON;
            showAlertMsg(resJson.message,'error',5000);
            $('#overtimeApproveModal .box-loader').fadeOut();
            //$('.loader').fadeOut('fast');
        },
        success: function(res) {
            
            showAlertMsg(res.message,'success',3000);

            getAllEmployeeOvertimeRequest();

            overtimeApproveModal.hide();
            $('#overtimeApproveModal .box-loader').fadeOut();
            $('#form-approve-overtime')[0].reset();
            
        }
    });
}

// END APPROVE OVERTIME 



// REJECT OVERTIME

$('#overtimeRejectModal .btn-close-modal').on('click',function(){
    overtimeRejectModal.hide();
    $('#form-reject-overtime')[0].reset();
});

$('#overtimeRejectModal .photo-start, #overtimeRejectModal .photo-end').on('click',function(){
    $('#overtimeRejectModal .box-img-view .img-viewer').attr('src',$(this).attr('src'));
    $('#overtimeRejectModal .box-img-view').fadeIn('fast');
});

$('#overtimeRejectModal .btn-close-img-viewer').on('click',function(){
    $('#overtimeRejectModal .box-img-view').fadeOut('fast');
});

$(document).on('click','.item-overtime .btn-action.reject',function(){
    let overtimeId = $(this).closest('.item-overtime').data('overtime');
    let employeeId = $(this).closest('.item-overtime').data('employee');
    let status = $(this).closest('.item-overtime').data('status');

    let dataRow = DATA_OVERTIME_REQUEST.find(item => item.id == overtimeId);

    $('#overtimeRejectModal .img-employee-photo').attr('src',appUrl+'/'+dataRow.employee.photo);
    $('#overtimeRejectModal .employee-name').html(dataRow.employee.name);

    $('#overtimeRejectModal .item-date').html(formatDateENMedium(dataRow.date_overtime));
    $('#overtimeRejectModal .total-overtime').html(formatTimeDisplayHm(dataRow.total_overtime));
    $('#overtimeRejectModal .item-hour-range').html(formatTimeDisplay(dataRow.time_start) + ' - ' + formatTimeDisplay(dataRow.time_end));
    $('#overtimeRejectModal .item-description').html(dataRow.description);
    $('#overtimeRejectModal .item-status').html(capitalizeFirstLetter(dataRow.status));

    $('#overtimeRejectModal .photo-start').attr('src',appUrl+'/'+dataRow.photo_start);
    $('#overtimeRejectModal .photo-end').attr('src',appUrl+'/'+dataRow.photo_end);

    if(dataRow.photo_end){
        $('#overtimeRejectModal .col-photo-end').removeClass('d-none');
    }else{
        $('#overtimeRejectModal .col-photo-end').addClass('d-none');
    }
    
    $('#form-reject-overtime input[name=overtime_id]').val(overtimeId);
    $('#form-reject-overtime input[name=employee_id]').val(employeeId);

    overtimeRejectModal.show();


});


$('#overtimeRejectModal .btn-submit-modal').on('click',function(){
    rejectOvertimeRequest();
});

function rejectOvertimeRequest(){
    $.ajax({
        url: appUrl + "/overtime/reject-employee-overtime-request",
        type: "POST",
        data: new FormData($('#form-reject-overtime').get(0)) ,
        cache: false,
        processData: false,
        contentType: false,
        beforeSend:function(){
            $('#overtimeRejectModal .box-loader').fadeIn();
        },
        error:function(res){
            var resJson = res.responseJSON;
            showAlertMsg(resJson.message,'error',5000);
            $('#overtimeRejectModal .box-loader').fadeOut();
            //$('.loader').fadeOut('fast');
        },
        success: function(res) {
            
            showAlertMsg(res.message,'success',3000);

            getAllEmployeeOvertimeRequest();

            overtimeRejectModal.hide();
            $('#overtimeRejectModal .box-loader').fadeOut();
            $('#form-reject-overtime')[0].reset();
            
        }
    });
}

// END REJECT OVERTIME
