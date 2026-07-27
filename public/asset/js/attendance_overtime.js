function updateClock() {
    const now = new Date();

    let hours = now.getHours().toString().padStart(2, "0");
    let minutes = now.getMinutes().toString().padStart(2, "0");
    let seconds = now.getSeconds().toString().padStart(2, "0");

    $('.modal .text-clock-digital').text(`${hours} : ${minutes} : ${seconds}`);
    //$("#clock").text(`${hours} : ${minutes} : ${seconds}`);
    
}

$(document).ready(function(){
    setInterval(updateClock, 1000);
});

const overtimeModal = new bootstrap.Modal('#overtimeModal', { keyboard: false });

const overtimeNewModal = new bootstrap.Modal('#overtimeNewModal', { keyboard: false });
const overtimeStopModal = new bootstrap.Modal('#overtimeStopModal', { keyboard: false });
const overtimeEditModal = new bootstrap.Modal('#overtimeEditModal', { keyboard: false });
const overtimeDeleteModal = new bootstrap.Modal('#overtimeDeleteModal', { keyboard: false });

$('#overtimeModal .btn-new-overtime').on('click',function(){
    
    let isExistStart = false;
    
    if(ARR_DATA_OVERTIME.length > 0){
        
        for (let i = 0; i < ARR_DATA_OVERTIME.length; i++) {
            if(ARR_DATA_OVERTIME[i].status == 'REQUEST'){
                if(ARR_DATA_OVERTIME[i].date_overtime == DATE_NOW){
                    isExistStart = true;
                    break;
                }
            }
        }

    }

    if(isExistStart){
        showAlertMsg('Overtime today already started','error',5000);
    }else{
        overtimeModal.hide();
        overtimeNewModal.show();
    }

});



$('#overtimeNewModal .btn-close-modal').on('click',function(){
    overtimeModal.show();
    overtimeNewModal.hide();
});

let DATE_NOW = formatDatePHP('Y-m-d',new Date().toString());
let SEARCH_QUERY_OVERTIME = '';
let PAGE_DATA_OVERTIME = 1;
let ARR_DATA_OVERTIME = [];

function getAllRequestOvertime(){

    $.ajax({
        url: appUrl + "/employee-overtime/all-request",
        type: "GET",
        data:{
            'SEARCH_QUERY' : SEARCH_QUERY_OVERTIME,
            'page' : PAGE_DATA_OVERTIME
        },
        beforeSend:function(){
            //$('.col-user-management .loader').fadeIn('fast');
        },
        error:function(res){
          //$('.col-user-management .loader').fadeOut('fast');
        },
        success: function(response) {
            
            ARR_DATA_OVERTIME = response.data.employeeOvertime;

            $('#overtimeModal .box-data').html('');

            for (let i = 0; i < ARR_DATA_OVERTIME.length; i++) {
                $('#overtimeModal .box-data').append(htmlDataRequestOvertime(ARR_DATA_OVERTIME[i]));
            }

        }
         
    });

}

function htmlDataRequestOvertime(dataRow){
    // {
    //     "id": 2,
    //     "employee_id": 1,
    //     "status": "REQUEST",
    //     "description": "Lembur",
    //     "date_overtime": "2025-10-03",
    //     "time_start": "18:48:00",
    //     "time_end": null,
    //     "total_overtime": null,
    //     "photo_start": "file/overtime/OVERTIME_1_1759492111.jpg",
    //     "photo_end": null,
    //     "location_start": null,
    //     "location_end": null,
    //     "created_by": 4,
    //     "updated_by": 4,
    //     "reject_by": 0,
    //     "approve_by": 0,
    //     "approve_at": null,
    //     "reject_at": null,
    //     "reject_note": null,
    //     "created_at": "2025-10-03T11:48:31.000000Z",
    //     "updated_at": "2025-10-03T11:48:31.000000Z"
    // }
    
    const today = new Date();
    const pad = (n, len = 2) => String(n).padStart(len, '0');

    let photoStart = '';
    let photoEnd = '';
    let btnStop = '';
    let btnEdit = '<div class="btn-action btn-edit-overtime"><span class="material-symbols-outlined">edit</span></div>';
    let btnDelete = '<div class="btn-action btn-delete-overtime"><span class="material-symbols-outlined">delete</span></div>';

    let itemHourMinute = '';
    let timeStart = '';
    let timeEnd = '';
    let totalOvertime = dataRow.total_overtime;


    if(dataRow.photo_start){
        photoStart = `<img src="${appUrl}/${dataRow.photo_start}" class="img-stamp photo-start" alt="">`;
    }
     
    if(dataRow.photo_end){
        photoEnd = `<img src="${appUrl}/${dataRow.photo_end}" class="img-stamp photo-end" alt="">`;
    }
    
    itemHourMinute = `<div class="item-hour-minute">${formatTimeDisplayHm(dataRow.total_overtime)}</div>`;
    

    

    if(dataRow.status == 'REQUEST'){
        if(dataRow.date_overtime == DATE_NOW){
            

            btnStop = `<div class="btn-stop btn-stop-overtime" data-overtime-id="${dataRow.id}" data-status="${dataRow.status}" data-photo-start="${dataRow.photo_start}" data-overtime-start-time="${dataRow.time_start}" >
                Stop
            </div>`;

            let timeDiff = timeDiffFromNow(`${dataRow.date_overtime}T${dataRow.time_start}`);
            
            itemHourMinute = `<div class="item-hour-minute" data-status="${dataRow.status}" data-overtime-start-time="${dataRow.date_overtime}T${dataRow.time_start}">
                ${timeDiff.hours}h ${timeDiff.minutes}m ${timeDiff.seconds}s
            </div>`;
        }
    }

    if(dataRow.status == 'APPROVED' || dataRow.status == 'REJECTED'){
        btnDelete = '';
        btnEdit = '';
    }
  
    let htmlRow = `
        <div class="item-overtime" data-overtime-id="${dataRow.id}" data-status="${dataRow.status}" data-overtime-start-time="${dataRow.date_overtime}T${dataRow.time_start}" data-date-overtime="${dataRow.date_overtime}">
            <div class="item-header mb-2">
                <div class="mb-0">
                    <div class="d-flex align-items-center justify-content-between">
                        <div class="col-title">
                            <div class="item-title me-2">${formatDatePHP("D, j M Y",dataRow.date_overtime)}</div>
                        </div>
                        <div class="col-hour-minute">
                            ${itemHourMinute}
                        </div>
                    </div>
                </div>
                <div>
                    <div class="d-flex align-items-center justify-content-between">
                        <div class="col-hour-start-end"> 
                            <div class="item-hour-start-end">
                                ${formatTimeDisplay(dataRow.time_start)} - ${formatTimeDisplay(dataRow.time_end)}
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
                            ${dataRow.description}
                        </div>
                    </div> 
                </div>
            </div>
            <div class="item-footer mb-1">
                <div class="d-flex align-items-center justify-content-between">
                    
                    <div class="">
                        ${photoStart}
                        ${photoEnd}
                    </div>
                    
                    <div class="col-item-action">
                        <div class="item-action item-action d-flex gap-2">
                            ${btnEdit}
                            ${btnDelete}
                            ${btnStop}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    return htmlRow;
}

getAllRequestOvertime();

function overtimeRunningTimer(){
    const pad = (n, len = 2) => String(n).padStart(len, '0');
    $('#overtimeStopModal .text-clock-overtime').text(' ');

    $(document).find('.item-overtime').each(function(){
        let overtimeStartTime = $(this).attr('data-overtime-start-time');
        let dateOvertime = $(this).attr('data-date-overtime');
        let status = $(this).attr('data-status');
        

        if(dateOvertime == DATE_NOW){
            if(status == 'REQUEST'){
                let timeDiff = timeDiffFromNow(overtimeStartTime);
                let newTime = `${timeDiff.hours}h ${timeDiff.minutes}m ${timeDiff.seconds}s`;
                $(this).find('.item-hour-minute').text(newTime);

                $('#overtimeStopModal .text-clock-overtime').text(newTime);
            }
        }
    });
}

$(document).ready(function(){
    setInterval(overtimeRunningTimer, 1000);
});

$(document).on('click','#overtimeModal .photo-start, #overtimeModal .photo-end',function(){
    $('#overtimeModal .img-viewer').attr('src',$(this).attr('src'));
    $('#overtimeModal .box-img-view').fadeIn('fast');
});

$('#overtimeModal .btn-close-img-viewer').on('click',function(){
    $('#overtimeModal .box-img-view').fadeOut('fast');
});

 

$('#input-search-overtime').on('keyup',function(){
    let searchQuery = $(this).val();
     

    if(searchQuery){
        $('#overtimeModal .item-overtime').addClass('d-none'); 

        $('#overtimeModal .item-overtime').each(function(){
            let itemDescription = $(this).find('.item-description').text();
            let itemTitle = $(this).find('.item-title').text();
            let itemStatus = $(this).find('.item-status').text();
            let searchExist = false;

            if(itemDescription.toLowerCase().includes(searchQuery.toLowerCase())){
                searchExist = true;
            }

            if(itemTitle.toLowerCase().includes(searchQuery.toLowerCase())){
                searchExist = true;
            }
            
            if(itemStatus.toLowerCase().includes(searchQuery.toLowerCase())){
                searchExist = true;
            }

            if(searchExist){
                $(this).removeClass('d-none');
            }
        });

    }else{
        $('#overtimeModal .item-overtime').removeClass('d-none');
    }
});

function isMobileDevice() {
  return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
}


const $video = $('#overtimeVideoElement');
const $canvas = $('#overtimeCanvasElement');
const $photo = $('#overtimePhotoResultStart');
const $captureButton = $('#overtimeCaptureButton');
const $closeButton = $('#overtimeCloseButton');
const context = $canvas[0].getContext('2d');
let currentStream;


function startStream() {

    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(function(stream) {
            currentStream = stream;
            $video.prop('srcObject', stream);
            $video[0].play();
        })
        .catch(function(err) {
            console.error("Terjadi kesalahan: " + err);
            showAlertMsg('Please alow permition to access camera','danger');
        });

}

function stopStream() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        $video.prop('srcObject', null);
    }
    $('#overtimeNewModal .box-camera').fadeOut();
}

$captureButton.on('click', function() {
    if (!currentStream) {
        showAlertMsg('Please open camera');
        return;
    }
    const videoElement = $video[0];
    const canvasElement = $canvas[0];

    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;
    context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
    
    const dataUrl = canvasElement.toDataURL('image/png');
    
    $photo.attr('src', dataUrl).removeClass('d-none');

    canvasElement.toBlob(blob => {
        const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
        
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);

        $('#overtimeNewModal [name="overtime_photo_start"]').prop('files', dataTransfer.files);
        
    }, "image/jpeg", 0.9);
    
    stopStream();
});

$closeButton.on('click', stopStream);

$('#openCameraOvertimeStart').click(function(){
    if(!isMobileDevice()){
        startStream();
        $('#overtimeNewModal .box-camera').fadeIn();
    }else{
        $('#overtimeNewModal .label-photo-overtime-start').click();
    }
});


$('#overtimeNewModal [name="overtime_photo_start"]').on('change', function(e){
    let reader = new FileReader();

    reader.onload = (e) => { 
        $photo.attr('src', e.target.result).removeClass('d-none');
    }   
    reader.readAsDataURL($(this).get(0).files[0]); 
});

$('#overtimeNewModal .btn-submit-modal').click(function(){
    submitNewOvertime();    
});

function submitNewOvertime(){
    $.ajax({
        url: appUrl + "/employee-overtime/submit-new-request",
        type: "POST",
        data: new FormData($('#form-new-overtime').get(0)) ,
        cache: false,
        processData: false,
        contentType: false,
        beforeSend:function(){
            $('#overtimeNewModal .box-loader').fadeIn();
        },
        error:function(res){
            var resJson = res.responseJSON;
            showAlertMsg(resJson.message,'error',5000);
            $('#overtimeNewModal .box-loader').fadeOut();
            //$('.loader').fadeOut('fast');
        },
        success: function(res) {
            getAllRequestOvertime();

            showAlertMsg(res.message,'success',15000);
            overtimeNewModal.hide();
            overtimeModal.show();

            $('#form-new-overtime')[0].reset();
        }
    });
}



const $videoStop = $('#stopOvertimeVideoElement');
const $canvasStop = $('#stopOvertimeCanvasElement');
const $photoStop = $('#overtimePhotoResultStop');
const $captureButtonStop = $('#stopOvertimeCaptureButton');
const $closeButtonStop = $('#stopOvertimeCloseButton');
const contextStop = $canvasStop[0].getContext('2d');
let currentStreamStop;


function startStreamStop() {

    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(function(stream) {
            currentStreamStop = stream;
            $videoStop.prop('srcObject', stream);
            $videoStop[0].play();
        })
        .catch(function(err) {
            console.error("Terjadi kesalahan: " + err);
            showAlertMsg('Please alow permition to access camera','danger');
        });

}

function stopStreamStop() {
    if (currentStreamStop) {
        currentStreamStop.getTracks().forEach(track => track.stop());
        $videoStop.prop('srcObject', null);
    }
    $('#overtimeStopModal .box-camera').fadeOut();
}

$captureButtonStop.on('click', function() {
    if (!currentStreamStop) {
        showAlertMsg('Please open camera');
        return;
    }
    const videoElement = $videoStop[0];
    const canvasElement = $canvasStop[0];

    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;
    contextStop.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
    
    const dataUrl = canvasElement.toDataURL('image/png');
    
    $photoStop.attr('src', dataUrl).removeClass('d-none');

    canvasElement.toBlob(blob => {
        const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
        
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);

        $('#overtimeStopModal [name="overtime_photo_stop"]').prop('files', dataTransfer.files);
        
    }, "image/jpeg", 0.9);
    
    stopStreamStop();
});

$closeButtonStop.on('click', stopStreamStop);

$('#openCameraOvertimeStop').click(function(){
    if(!isMobileDevice()){
        startStreamStop();
        $('#overtimeStopModal .box-camera').fadeIn();
    }else{
        $('#overtimeStopModal .label-photo-overtime-stop').click();
    }
});


$('#overtimeStopModal [name="overtime_photo_stop"]').on('change', function(e){
    let reader = new FileReader();

    reader.onload = (e) => { 
        $photoStop.attr('src', e.target.result).removeClass('d-none');
    }   
    reader.readAsDataURL($(this).get(0).files[0]); 
});

$('#overtimeStopModal .btn-close-modal').on('click',function(){
    overtimeModal.show();
    overtimeStopModal.hide();
});


$(document).on('click','#overtimeModal .item-overtime .btn-stop-overtime',function(){
    let overtimeId = $(this).attr('data-overtime-id');
    let photoStart = $(this).attr('data-photo-start');

    $('#overtimeStopModal #overtimePhotoStart').attr('src',photoStart);
    $('#overtimeStopModal [name="overtime_id"]').val(overtimeId);
    $('#overtimeModal .img-viewer').attr('src',$(this).attr('src'));
    overtimeModal.hide();
    overtimeStopModal.show();
});

$('#overtimeStopModal .btn-submit-modal').click(function(){
    submitStopOvertime();    
});

function submitStopOvertime(){
    $.ajax({
        url: appUrl + "/employee-overtime/submit-stop-overtime",
        type: "POST",
        data: new FormData($('#form-stop-overtime').get(0)) ,
        cache: false,
        processData: false,
        contentType: false,
        beforeSend:function(){
            $('#overtimeStopModal .box-loader').fadeIn();
        },
        error:function(res){
            var resJson = res.responseJSON;
            showAlertMsg(resJson.message,'error',5000);
            $('#overtimeStopModal .box-loader').fadeOut();
            //$('.loader').fadeOut('fast');
        },
        success: function(res) {
            getAllRequestOvertime();

            showAlertMsg(res.message,'success',10000);
            overtimeStopModal.hide();
            overtimeModal.show();

            $('#form-stop-overtime')[0].reset();
        }
    });
}



$('#overtimeEditModal .btn-close-modal').on('click',function(){    
    overtimeModal.show();
    overtimeEditModal.hide();
});

$(document).on('click','.item-overtime .btn-edit-overtime, .item-overtime .item-title',function(){
    let overtimeId = $(this).closest('.item-overtime').attr('data-overtime-id');
    let dateOvertime = $(this).closest('.item-overtime').attr('data-date-overtime');
    let overtimeStartTime = $(this).closest('.item-overtime').attr('data-overtime-start-time');
    
    let dataRow = ARR_DATA_OVERTIME.find(item => item.id == overtimeId);

    $('#overtimeEditModal [name="overtime_id"]').val(overtimeId);
    $('#overtimeEditModal [name="description"]').val(dataRow.description);
    $('#overtimeEditModal .overtime_date').val(formatDatePHP("D, j M Y",dataRow.date_overtime));
    
    if(dataRow.photo_start){
        $('#overtimeEditModal .photo-start').attr('src',appUrl + '/' + dataRow.photo_start);
    }
     
    $('#overtimeEditModal .col-photo-end').addClass('d-none');

    if(dataRow.photo_end){
        $('#overtimeEditModal .col-photo-end').removeClass('d-none');
        $('#overtimeEditModal .photo-end').attr('src',appUrl + '/' + dataRow.photo_end);
    }
    
    if(dataRow.total_overtime){
        $('#overtimeEditModal .overtime-total-hour').text(formatTimeDisplayHm(dataRow.total_overtime));
    }

    $('#overtimeEditModal .overtime-time-start').text(formatTimeDisplay(dataRow.time_start));
    $('#overtimeEditModal .overtime-time-end').text(formatTimeDisplay(dataRow.time_end));
    
    overtimeModal.hide();
    overtimeEditModal.show();
});

$('#overtimeEditModal .btn-submit-modal').click(function(){
    submitEditOvertime();    
});

function submitEditOvertime(){
    $.ajax({
        url: appUrl + "/employee-overtime/submit-edit-overtime",
        type: "POST",
        data: new FormData($('#form-edit-overtime').get(0)) ,
        cache: false,
        processData: false,
        contentType: false,
        beforeSend:function(){
            $('#overtimeEditModal .box-loader').fadeIn();
        },
        error:function(res){
            var resJson = res.responseJSON;
            showAlertMsg(resJson.message,'error',5000);
            $('#overtimeEditModal .box-loader').fadeOut();
            //$('.loader').fadeOut('fast');
        },
        success: function(res) {
            getAllRequestOvertime();

            showAlertMsg(res.message,'success',10000);
            overtimeEditModal.hide();
            overtimeModal.show();
            $('#overtimeEditModal .box-loader').fadeOut();
            $('#form-edit-overtime')[0].reset();
        }
    });
}

$('#overtimeDeleteModal .btn-close-modal').on('click',function(){    
    overtimeModal.show();
    overtimeDeleteModal.hide();
});

$(document).on('click','.item-overtime .btn-delete-overtime',function(){
    let overtimeId = $(this).closest('.item-overtime').attr('data-overtime-id');
    
    let dataRow = ARR_DATA_OVERTIME.find(item => item.id == overtimeId);

    $('#overtimeDeleteModal [name="overtime_id"]').val(overtimeId);
    $('#overtimeDeleteModal .overtime-description').text(dataRow.description);
    $('#overtimeDeleteModal .overtime_date').val(formatDatePHP("D, j M Y",dataRow.date_overtime));
    
    if(dataRow.photo_start){
        $('#overtimeDeleteModal .photo-start').attr('src',appUrl + '/' + dataRow.photo_start);
    }
     
    $('#overtimeDeleteModal .col-photo-end').addClass('d-none');

    if(dataRow.photo_end){
        $('#overtimeDeleteModal .col-photo-end').removeClass('d-none');
        $('#overtimeDeleteModal .photo-end').attr('src',appUrl + '/' + dataRow.photo_end);
    }
    
    if(dataRow.total_overtime){
        $('#overtimeDeleteModal .overtime-total-hour').text(formatTimeDisplayHm(dataRow.total_overtime));
    }

    $('#overtimeDeleteModal .overtime-time-start').text(formatTimeDisplay(dataRow.time_start));
    $('#overtimeDeleteModal .overtime-time-end').text(formatTimeDisplay(dataRow.time_end));
    
    overtimeModal.hide();
    overtimeDeleteModal.show();
});

$('#overtimeDeleteModal .btn-submit-modal').click(function(){
    submitDeleteOvertime();    
});

function submitDeleteOvertime(){
    $.ajax({
        url: appUrl + "/employee-overtime/submit-delete-overtime",
        type: "POST",
        data: new FormData($('#form-delete-overtime').get(0)) ,
        cache: false,
        processData: false,
        contentType: false,
        beforeSend:function(){

            $('#overtimeDeleteModal .box-loader').fadeIn();
        },
        error:function(res){
            var resJson = res.responseJSON;
            showAlertMsg(resJson.message,'error',5000);
            $('#overtimeDeleteModal .box-loader').fadeOut();
            //$('.loader').fadeOut('fast');
        },
        success: function(res) {

            getAllRequestOvertime();

            showAlertMsg(res.message,'success',10000);
            overtimeDeleteModal.hide();
            overtimeModal.show();
            $('#overtimeDeleteModal .box-loader').fadeOut();
            $('#form-edit-overtime')[0].reset();
        }
    });
}
