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

let CURRENT_DATE = new Date();
let DATA_OVERTIME_REQUEST = [];
let SEARCH_QUERY_OVERTIME_REQUEST = '';
let PAGE_OVERTIME_REQUEST = 1;

let OVERTIME_CURRENT_MONTH = CURRENT_DATE.getMonth() + 1;
let OVERTIME_CURRENT_YEAR = CURRENT_DATE.getFullYear();
let OVERTIME_PAGE = 1;

function htmlDataRequestOvertime(dataRow){
    let photoStart = '';
    let photoEnd = '';
    let btnReject = '';
    let btnApprove = '';

    if(dataRow.status != 'APPROVED' && dataRow.status != 'REJECTED'){
        btnReject = `
            <div class="">
                <button class="btn btn-action reject">
                    <span class="material-symbols-outlined check-icon">close</span>
                    Reject
                </button>
            </div>
        `;
        btnApprove = `
            <div class="">
                <button class="btn btn-action approve">
                    <span class="material-symbols-outlined check-icon">check</span>
                    Approve
                </button>
            </div>
        `;
    }

    if(dataRow.photo_start){
        photoStart = `<img src="${appUrl}/${dataRow.photo_start}" class="img-stamp photo-start" alt="">`;
    }
    if(dataRow.photo_end){
        photoEnd = `<img src="${appUrl}/${dataRow.photo_end}" class="img-stamp photo-end" alt="">`;
    }

    let employeePhoto = dataRow.employee?.photo;
    if(!employeePhoto || employeePhoto == '' || employeePhoto == null){
        employeePhoto = appUrl+'/asset/img/avatar.png';
    }

    let htmlRow = `
        <div class="item-overtime mb-3" data-overtime="${dataRow.id}" data-employee="${dataRow.employee?.id}" data-status="${dataRow.status}">
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
                                            ${dataRow.employee?.name || ''}
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
                                ${dataRow.description || ''}
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
        error:function(res){
            var resJson = res.responseJSON;
            showAlertMsg(resJson?.message || 'Error','error',5000);
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
    if(!str) return '';
    return str.toLowerCase().split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

$(document).on('click','.col-overtime-request .img-stamp',function(){
    let photo = $(this).attr('src');
    $('#overtimePhotoModal .img-viewer').attr('src',photo);
    overtimePhotoModal.show();
});

$('#overtimePhotoModal .btn-close-img-viewer').on('click',function(){
    overtimePhotoModal.hide();
});

// OVERVIEW EMPLOYEE TABLE WITH PAGINATION
function getEmployeeOvertimeByMonth(){
    $.ajax({
        url: appUrl + "/overtime/employee-overtime-by-month",
        type: "GET",
        data: {
            YEAR: OVERTIME_CURRENT_YEAR,
            MONTH: OVERTIME_CURRENT_MONTH,
            PAGE: OVERTIME_PAGE,
        },
        error:function(res){
            var resJson = res.responseJSON;
            showAlertMsg(resJson?.message || 'Error','error',5000);
        },
        success: function(response) {
            const employees = response.data.employees || [];
            const totalOvertime = response.data.total_overtime || [];
            const pagination = response.data.pagination || null;

            renderEmployeeTable(employees, totalOvertime);
            renderOvertimePagination(pagination);
        }
    });
}

function renderEmployeeTable(employees, totalOvertime){
    let tbody = $('#overtime-employee-tbody');
    if(!employees || employees.length < 1){
        tbody.html('<tr><td colspan="3" class="text-center p-3 fs-12">No Data</td></tr>');
        return;
    }
    let rows = '';
    employees.forEach(function(emp){
        let empPhoto = emp.photo ? appUrl + '/' + emp.photo : appUrl + '/asset/img/avatar.png';
        let ot = totalOvertime.find(t => t.id == emp.id);
        let totalDays = ot ? (ot.total_days || 0) : 0;
        let totalHours = ot ? formatSecondsToHm(ot.total_hours || 0) : '0h 0m';
        rows += `
            <tr class="employee-row" data-employee-id="${emp.id}" data-employee-name="${emp.name}" data-employee-photo="${emp.photo}" data-division="${emp.division_id || ''}" data-department="${emp.department_id || ''}">
                <td>
                    <div class="box-employee">
                        <div class="d-flex align-items-center">
                            <div class="col-photo">
                                <div class="employee-photo">
                                    <img src="${empPhoto}" class="rounded-circle w-100 h-100 object-fit-cover" alt="">
                                </div>
                            </div>
                            <div class="col-name w-100">
                                <div class="employee-name">${emp.name}</div>
                            </div>
                        </div>
                    </div>
                    <div class="box-action h-100 top-0 end-0 position-absolute">
                        <div class="d-flex h-100 flex-column justify-content-center align-items-center">
                            <div>
                                <span class="material-symbols-outlined fill fs-14 px-2">visibility</span>
                            </div>
                        </div>
                    </div>
                </td>
                <td class="text-center position-relative">
                    <span class="col-total-days">${totalDays}</span>
                </td>
                <td class="col-total-hours text-center">${totalHours}</td>
            </tr>
        `;
    });
    tbody.html(rows);
}

function formatSecondsToHm(seconds){
    let s = parseInt(seconds) || 0;
    let h = Math.floor(s / 3600);
    let m = Math.floor((s % 3600) / 60);
    return h + 'h ' + m + 'm';
}

function renderOvertimePagination(pagination){
    const infoEl = document.getElementById('overtimePaginationInfo');
    const ctrlEl = document.getElementById('overtimePagination');
    if(!infoEl || !ctrlEl) return;

    if(!pagination || pagination.total === 0){
        infoEl.textContent = '';
        ctrlEl.innerHTML = '';
        return;
    }

    const from = pagination.from || 0;
    const to = pagination.to || 0;
    const total = pagination.total || 0;
    infoEl.textContent = `Showing ${from}-${to} of ${total}`;

    const current = pagination.current_page || 1;
    const last = pagination.last_page || 1;

    let buttons = [];

    buttons.push(`<button type="button" class="page-btn" data-page="${Math.max(current - 1, 1)}" ${current <= 1 ? 'disabled' : ''}>Prev</button>`);

    let pages = buildOvertimePages(current, last);
    pages.forEach(function(item){
        if(item === '...'){
            buttons.push('<span style="font-size:11px;padding:0 4px;">...</span>');
        } else {
            buttons.push(`<button type="button" class="page-btn ${item === current ? 'is-active' : ''}" data-page="${item}">${item}</button>`);
        }
    });

    buttons.push(`<button type="button" class="page-btn" data-page="${Math.min(current + 1, last)}" ${current >= last ? 'disabled' : ''}>Next</button>`);

    ctrlEl.innerHTML = buttons.join('');
}

function buildOvertimePages(current, last){
    let pages = [];
    if(last <= 7){
        for(let i = 1; i <= last; i++) pages.push(i);
        return pages;
    }
    pages.push(1);
    if(current > 3) pages.push('...');
    let start = Math.max(2, current - 1);
    let end = Math.min(last - 1, current + 1);
    for(let i = start; i <= end; i++) pages.push(i);
    if(current < last - 2) pages.push('...');
    pages.push(last);
    return pages;
}

$(document).on('click', '#overtimePagination .page-btn', function(){
    let page = parseInt($(this).data('page'));
    if(!page || page < 1) return;
    OVERTIME_PAGE = page;
    getEmployeeOvertimeByMonth();
});

$('.dropdown-year .month-item').on('click', function(){
    let month = $(this).data('month');
    let monthText = $(this).find('.dropdown-item').text().trim();
    if(month === 'all'){
        OVERTIME_CURRENT_MONTH = 'all';
    } else {
        OVERTIME_CURRENT_MONTH = month;
    }
    $('.text-month').text(monthText);
    OVERTIME_PAGE = 1;
    getEmployeeOvertimeByMonth();
});

$('.input-search-total-overtime').on('keyup', function(){
    OVERTIME_PAGE = 1;
    getEmployeeOvertimeByMonth();
});

getEmployeeOvertimeByMonth();

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
    let dataRow = DATA_OVERTIME_REQUEST.find(item => item.id == overtimeId);
    if(!dataRow) return;

    let empPhoto = dataRow.employee?.photo ? appUrl+'/'+dataRow.employee.photo : appUrl+'/asset/img/avatar.png';
    $('#overtimeApproveModal .img-employee-photo').attr('src', empPhoto);
    $('#overtimeApproveModal .employee-name').html(dataRow.employee?.name || '');
    $('#overtimeApproveModal .item-date').html(formatDateENMedium(dataRow.date_overtime));
    $('#overtimeApproveModal .total-overtime').html(formatTimeDisplayHm(dataRow.total_overtime));
    $('#overtimeApproveModal .item-hour-range').html(formatTimeDisplay(dataRow.time_start) + ' - ' + formatTimeDisplay(dataRow.time_end));
    $('#overtimeApproveModal .item-description').html(dataRow.description || '');
    $('#overtimeApproveModal .item-status').html(capitalizeFirstLetter(dataRow.status));

    let ps = dataRow.photo_start ? appUrl+'/'+dataRow.photo_start : '';
    let pe = dataRow.photo_end ? appUrl+'/'+dataRow.photo_end : '';
    $('#overtimeApproveModal .photo-start').attr('src', ps);
    $('#overtimeApproveModal .photo-end').attr('src', pe);
    if(dataRow.photo_end){
        $('#overtimeApproveModal .col-photo-end').removeClass('d-none');
    } else {
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
        data: new FormData($('#form-approve-overtime').get(0)),
        cache: false,
        processData: false,
        contentType: false,
        beforeSend:function(){
            $('#overtimeApproveModal .box-loader').fadeIn();
        },
        error:function(res){
            var resJson = res.responseJSON;
            showAlertMsg(resJson?.message || 'Error','error',5000);
            $('#overtimeApproveModal .box-loader').fadeOut();
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
    let dataRow = DATA_OVERTIME_REQUEST.find(item => item.id == overtimeId);
    if(!dataRow) return;

    let empPhoto = dataRow.employee?.photo ? appUrl+'/'+dataRow.employee.photo : appUrl+'/asset/img/avatar.png';
    $('#overtimeRejectModal .img-employee-photo').attr('src', empPhoto);
    $('#overtimeRejectModal .employee-name').html(dataRow.employee?.name || '');
    $('#overtimeRejectModal .item-date').html(formatDateENMedium(dataRow.date_overtime));
    $('#overtimeRejectModal .total-overtime').html(formatTimeDisplayHm(dataRow.total_overtime));
    $('#overtimeRejectModal .item-hour-range').html(formatTimeDisplay(dataRow.time_start) + ' - ' + formatTimeDisplay(dataRow.time_end));
    $('#overtimeRejectModal .item-description').html(dataRow.description || '');
    $('#overtimeRejectModal .item-status').html(capitalizeFirstLetter(dataRow.status));

    let ps = dataRow.photo_start ? appUrl+'/'+dataRow.photo_start : '';
    let pe = dataRow.photo_end ? appUrl+'/'+dataRow.photo_end : '';
    $('#overtimeRejectModal .photo-start').attr('src', ps);
    $('#overtimeRejectModal .photo-end').attr('src', pe);
    if(dataRow.photo_end){
        $('#overtimeRejectModal .col-photo-end').removeClass('d-none');
    } else {
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
        data: new FormData($('#form-reject-overtime').get(0)),
        cache: false,
        processData: false,
        contentType: false,
        beforeSend:function(){
            $('#overtimeRejectModal .box-loader').fadeIn();
        },
        error:function(res){
            var resJson = res.responseJSON;
            showAlertMsg(resJson?.message || 'Error','error',5000);
            $('#overtimeRejectModal .box-loader').fadeOut();
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

