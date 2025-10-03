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

$('#overtimeModal .btn-new-overtime').on('click',function(){
    overtimeModal.hide();
    overtimeNewModal.show();
});


$('#overtimeNewModal .btn-close-modal').on('click',function(){
    overtimeModal.show();
    overtimeNewModal.hide();
});



const $video = $('#overtimeVideoElement');
const $canvas = $('#overtimeCanvasElement');
const $photo = $('#overtimePhotoResultStart');
const $captureButton = $('#overtimeCaptureButton');
const $closeButton = $('#overtimeCloseButton');
const context = $canvas[0].getContext('2d');
let currentStream;

function isMobileDevice() {
  return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
}

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
    //console.log('Foto berhasil diambil');
});

$closeButton.on('click', stopStream);

$('#openCameraCheckIn').click(function(){
    if(!isMobileDevice()){
        startStream();
        $('#overtimeNewModal .box-camera').fadeIn();
    }else{
        $('#overtimeNewModal .label-photo-checkin').click();
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
    
    var workOutside = $('#overtimeNewModal input[name="is_work_outside"]:checked').val();
    //const employeeLocation = L.latLng(LOC_LATITUDE, LOC_LONGITUDE);
    //const distance = LOC_OFFICE.distanceTo(employeeLocation);
    //console.log(distance);

    if(workOutside == 1){
        submitCheckIn();
    }else{

        if(distance > 200){        
            showAlertMsg('You are not in the office area yet','error',5000);
        }else{
            submitNewOvertime();
        }
    }
    
});

function submitNewOvertime(){
    $.ajax({
        url: appUrl + "/attendance/submit-checkin",
        type: "POST",
        data: new FormData($('#checkInForm').get(0)) ,
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
            //overtimeNewModal.hide();
            //$('.modal .loader').fadeOut('fast');
            showAlertMsg(res.message,'success',15000);

            setTimeout(function() {
                window.location.reload();
            }, 2000);
        }
    });
}