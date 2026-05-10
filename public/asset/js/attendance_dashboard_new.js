function updateClock() {
    const now = new Date();

    let hours = now.getHours().toString().padStart(2, "0");
    let minutes = now.getMinutes().toString().padStart(2, "0");
    let seconds = now.getSeconds().toString().padStart(2, "0");

    $('.text-clock-digital').text(`${hours} : ${minutes} : ${seconds}`);
    $("#clock").text(`${hours} : ${minutes} : ${seconds}`);
    
}

$(document).ready(function(){
    setInterval(updateClock, 1000);
});

const checkInModal = new bootstrap.Modal('#checkInModal', {
  keyboard: false
});

const checkOutModal = new bootstrap.Modal('#checkOutModal', {
  keyboard: false
});

const checkInDetailModal = new bootstrap.Modal('#checkInDetailModal', {
  keyboard: false
});

const checkOutDetailModal = new bootstrap.Modal('#checkOutDetailModal', {
  keyboard: false
});




$('#checkInModal').on('hidden.bs.modal', function (e) {
    //clearInterval(mapCheckInReload);
});

function setDefaultLocation(){
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                LOC_LATITUDE = position.coords.latitude;
                LOC_LONGITUDE = position.coords.longitude;

                //console.log(`Latitude: ${LOC_LATITUDE}, Longitude: ${LOC_LONGITUDE}`);
                
                $('[name="latitudeCheckIn"]').val(LOC_LATITUDE);
                $('[name="longitudeCheckIn"]').val(LOC_LONGITUDE);

                $('[name="latitudeCheckOut"]').val(LOC_LATITUDE);
                $('[name="longitudeCheckOut"]').val(LOC_LONGITUDE);
                
                MAP_CHECKIN.invalidateSize();
                MAP_CHECKIN.setView([LOC_LATITUDE, LOC_LONGITUDE], 16);
                MAP_CHECKIN.panTo([LOC_LATITUDE, LOC_LONGITUDE]);

                if(MAP_CHECKIN_MARKER){
                    MAP_CHECKIN_MARKER.setLatLng([LOC_LATITUDE, LOC_LONGITUDE]);
                    MAP_CHECKIN_MARKER.update();
                }
                
                $('[name="latitudeCheckOut"]').val(LOC_LATITUDE);
                $('[name="longitudeCheckOut"]').val(LOC_LONGITUDE);

                MAP_CHECKOUT.invalidateSize();
                MAP_CHECKOUT.setView([LOC_LATITUDE, LOC_LONGITUDE], 16);
                MAP_CHECKOUT.panTo([LOC_LATITUDE, LOC_LONGITUDE]);
                
                if(MAP_CHECKOUT_MARKER){
                    MAP_CHECKOUT_MARKER.setLatLng([LOC_LATITUDE, LOC_LONGITUDE]);
                    MAP_CHECKOUT_MARKER.update();
                }

            },
            (error) => {
                // Handle errors, such as user denying location access
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                    console.error("User denied the request for Geolocation.");
                    break;
                    case error.POSITION_UNAVAILABLE:
                    console.error("Location information is unavailable.");
                    break;
                    case error.TIMEOUT:
                    console.error("The request to get user location timed out.");
                    break;
                    case error.UNKNOWN_ERROR:
                    console.error("An unknown error occurred.");
                    break;
                }
            },
            {
                // Optional: configuration options for getCurrentPosition
                enableHighAccuracy: true, // Request the most accurate position available
                timeout: 5000, // Maximum time (in milliseconds) allowed to return a position
                maximumAge: 0 // Do not use a cached position, always try to get the real current position
            }
        );
    } else {
        console.error("Geolocation is not supported by this browser.");
    }
}

function initialiseMapsCheckIn(){
    MAP_CHECKIN = L.map('mapCheckIn', {
                center: [LOC_LATITUDE, LOC_LONGITUDE],
                zoom: 16
            });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'NSA Performance',
        maxZoom: 19
    }).addTo(MAP_CHECKIN);

    MAP_CHECKIN_MARKER = L.marker([LOC_LATITUDE, LOC_LONGITUDE]).addTo(MAP_CHECKIN);
    MAP_CHECKIN_MARKER.bindTooltip("Your Location", { permanent: true, direction: 'top', offset: [0, 0] });


    if($('#detailMapCheckIn').attr('data-location')){

        MAP_CHECKIN_DETAIL_LOCATION = $('#detailMapCheckIn').attr('data-location').split(',');

        MAP_CHECKIN_DETAIL = L.map('detailMapCheckIn', {
                    center: MAP_CHECKIN_DETAIL_LOCATION,
                    zoom: 16
                });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: 'NSA Performance',
            maxZoom: 19
        }).addTo(MAP_CHECKIN_DETAIL);

        MAP_CHECKIN_DETAIL_MARKER = L.marker(MAP_CHECKIN_DETAIL_LOCATION).addTo(MAP_CHECKIN_DETAIL);
        MAP_CHECKIN_DETAIL_MARKER.bindTooltip("Check In Location", { permanent: true, direction: 'top', offset: [0, 0] });


    }
}

let LOC_LATITUDE = 0;
let LOC_LONGITUDE = 0;
let MAP_CHECKIN = null;
let MAP_CHECKIN_MARKER = null;

let MAP_CHECKIN_DETAIL = null;
let MAP_CHECKIN_DETAIL_LOCATION = null;
let MAP_CHECKIN_DETAIL_MARKER = null;

const employeeOffice = $('[name="employee_office"]').val();

// -6.140808415355851, 106.8323372601321
let locationLat = -6.140808415355851;
let locationLong = 106.8323372601321;

if(employeeOffice){
    locationLat = employeeOffice.split(',')[0];
    locationLong = employeeOffice.split(',')[1];
}

const LOC_OFFICE = L.latLng(locationLat, locationLong);


$(document).ready(function(){
    initialiseMapsCheckIn();
});

const loopGetLocation = setInterval(setDefaultLocation, 500);


$('#checkInBtn').click(function(){

    if($('#checkInBtn').hasClass('active')){
        showCheckinDetail();
    }else{
        checkInModal.show();
    }
    
});

$('.time-log.time-in').on('click', function(){
    showCheckinDetail();
});

function showCheckinDetail(){
    checkInDetailModal.show();
        
    setTimeout(() => {
        MAP_CHECKIN_DETAIL.invalidateSize();
        MAP_CHECKIN_DETAIL.setView(MAP_CHECKIN_DETAIL_LOCATION, 16);
        MAP_CHECKIN_DETAIL.panTo(MAP_CHECKIN_DETAIL_LOCATION);

        if(MAP_CHECKIN_DETAIL_MARKER){
            MAP_CHECKIN_DETAIL_MARKER.setLatLng(MAP_CHECKIN_DETAIL_LOCATION);
            MAP_CHECKIN_DETAIL_MARKER.update();
        }
        
    }, 700);
}

$('#checkInModal [name="is_work_outside"]').change(function() {
    var selectedValue = $('#checkInModal input[name="is_work_outside"]:checked').val();
    
    if(selectedValue == 1){
        $('#checkInModal .col-map').addClass('col-6');
        $('#checkInModal .col-map .ratio').addClass('ratio-1x1');

        $('#checkInModal .col-map').removeClass('col-12');
        $('#checkInModal .col-map .ratio').removeClass('ratio-21x9');

        $('#checkInModal .col-photo').removeClass('d-none');
        //$('#checkInModal #imageUploadSection').removeClass('d-none');
    }else{

        $('#checkInModal .col-map').addClass('col-12');
        $('#checkInModal .col-map').removeClass('col-6');

        $('#checkInModal .col-map .ratio').removeClass('ratio-1x1');
        $('#checkInModal .col-map .ratio').addClass('ratio-21x9');

        $('#checkInModal .col-photo').addClass('d-none');

        //$('#checkInModal #imageUploadSection').addClass('d-none');
    }
    // You can perform other actions here based on the selected value
});

const $video = $('#videoElement');
const $canvas = $('#canvasElement');
const $photo = $('#photoResult');
const $captureButton = $('#captureButton');
const $closeButton = $('#closeButton');
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
    $('#checkInModal .box-camera').fadeOut();
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

        $('#checkInModal [name="photo_checkin"]').prop('files', dataTransfer.files);
        
    }, "image/jpeg", 0.9);
    
    stopStream();
    //console.log('Foto berhasil diambil');
});

$closeButton.on('click', stopStream);

$('#openCameraCheckIn').click(function(){
    if(!isMobileDevice()){
        startStream();
        $('#checkInModal .box-camera').fadeIn();
    }else{
        $('#checkInModal .label-photo-checkin').click();
    }
});


$('#checkInModal [name="photo_checkin"]').on('change', function(e){
    let reader = new FileReader();

    reader.onload = (e) => { 
        $photo.attr('src', e.target.result).removeClass('d-none');
    }   
    reader.readAsDataURL($(this).get(0).files[0]); 
});

 

$('#submitCheckInBtn').click(function(){
    
    var workOutside = $('#checkInModal input[name="is_work_outside"]:checked').val();
    const employeeLocation = L.latLng(LOC_LATITUDE, LOC_LONGITUDE);
    const distance = LOC_OFFICE.distanceTo(employeeLocation);
    //console.log(distance);

    if(workOutside == 1){
        submitCheckIn();
    }else{

        if(distance > 200){        
            showAlertMsg('You are not in the office area yet','error',5000);
        }else{
            submitCheckIn();
        }
    }
    
});

function submitCheckIn(){
    $.ajax({
        url: appUrl + "/attendance/submit-checkin",
        type: "POST",
        data: new FormData($('#checkInForm').get(0)) ,
        cache: false,
        processData: false,
        contentType: false,
        beforeSend:function(){
            $('#checkInModal .box-loader').fadeIn();
        },
        error:function(res){
            var resJson = res.responseJSON;
            showAlertMsg(resJson.message,'error',5000);
            $('#checkInModal .box-loader').fadeOut();
            //$('.loader').fadeOut('fast');
        },
        success: function(res) {
            //checkInModal.hide();
            //$('.modal .loader').fadeOut('fast');
            showAlertMsg(res.message,'success',15000);

            setTimeout(function() {
                window.location.reload();
            }, 2000);
        }
    });
}









// Check OUT

const $videoCheckout = $('#videoElementCheckout');
const $canvasCheckout = $('#canvasElementCheckout');
const $photoCheckout = $('#photoResultCheckout');
const $captureButtonCheckout = $('#captureButtonCheckout');
const $closeButtonCheckout = $('#closeButtonCheckout');
const contextCheckout = $canvasCheckout[0].getContext('2d');
let currentStreamCheckout;

function startStreamCheckout() {

    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(function(stream) {
            currentStreamCheckout = stream;
            $videoCheckout.prop('srcObject', stream);
            $videoCheckout[0].play();
        })
        .catch(function(err) {
            console.error("Error: " + err);
            showAlertMsg('Please alow permition to access camera','danger');
        });

}

function stopStreamCheckout() {
    if (currentStreamCheckout) {
        currentStreamCheckout.getTracks().forEach(track => track.stop());
        $videoCheckout.prop('srcObject', null);
    }
    $('#checkOutModal .box-camera').fadeOut();
}

$captureButtonCheckout.on('click', function() {
    if (!currentStreamCheckout) {
        showAlertMsg('Please open camera');
        return;
    }
    const videoElement = $videoCheckout[0];
    const canvasElement = $canvasCheckout[0];

    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;
    contextCheckout.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
    
    const dataUrl = canvasElement.toDataURL('image/png');
    
    $photoCheckout.attr('src', dataUrl).removeClass('d-none');


    canvasElement.toBlob(blob => {
        const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
        
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);

        $('#checkOutModal [name="photo_checkout"]').prop('files', dataTransfer.files);
        
    }, "image/jpeg", 0.9);
    
    stopStreamCheckout();
    //console.log('Foto berhasil diambil');
});

$closeButtonCheckout.on('click', stopStreamCheckout);

$('#openCameraCheckout').click(function(){
    if(!isMobileDevice()){
        startStreamCheckout();
        $('#checkOutModal .box-camera').fadeIn();
    }else{
        $('#checkOutModal .label-photo-checkout').click();
    }
});


$('#checkOutModal [name="photo_checkout"]').on('change', function(e){
    let reader = new FileReader();

    reader.onload = (e) => { 
        $photoCheckout.attr('src', e.target.result).removeClass('d-none');
    }   
    reader.readAsDataURL($(this).get(0).files[0]); 
});




let MAP_CHECKOUT = null;
let MAP_CHECKOUT_MARKER = null;

let MAP_CHECKOUT_DETAIL = null;
let MAP_CHECKOUT_DETAIL_MARKER = null;
let MAP_CHECKOUT_DETAIL_LOCATION = null;



function initialiseMapsCheckOut(){
    MAP_CHECKOUT = L.map('mapCheckOut', {
                center: [LOC_LATITUDE, LOC_LONGITUDE],
                zoom: 16
            });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'NSA Performance',
        maxZoom: 19
    }).addTo(MAP_CHECKOUT);

    MAP_CHECKOUT_MARKER = L.marker([LOC_LATITUDE, LOC_LONGITUDE]).addTo(MAP_CHECKOUT);
    MAP_CHECKOUT_MARKER.bindTooltip("Your Location", { permanent: true, direction: 'top', offset: [0, 0] });


    if($('#detailMapCheckOut').attr('data-location')){

        MAP_CHECKOUT_DETAIL_LOCATION = $('#detailMapCheckOut').attr('data-location').split(',');

        MAP_CHECKOUT_DETAIL = L.map('detailMapCheckOut', {
                    center: MAP_CHECKOUT_DETAIL_LOCATION,
                    zoom: 16
                });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: 'NSA Performance',
            maxZoom: 19
        }).addTo(MAP_CHECKOUT_DETAIL);

        MAP_CHECKOUT_DETAIL_MARKER = L.marker(MAP_CHECKOUT_DETAIL_LOCATION).addTo(MAP_CHECKOUT_DETAIL);
        MAP_CHECKOUT_DETAIL_MARKER.bindTooltip("Check In Location", { permanent: true, direction: 'top', offset: [0, 0] });

    }
}

initialiseMapsCheckOut();

$('#checkOutModal [name="is_work_outside"]').change(function() {
    var selectedValue = $('#checkOutModal input[name="is_work_outside"]:checked').val();
    
    if(selectedValue == 1){
        $('#checkOutModal .col-map').addClass('col-6');
        $('#checkOutModal .col-map .ratio').addClass('ratio-1x1');

        $('#checkOutModal .col-map').removeClass('col-12');
        $('#checkOutModal .col-map .ratio').removeClass('ratio-21x9');

        $('#checkOutModal .col-photo').removeClass('d-none');
        //$('#checkInModal #imageUploadSection').removeClass('d-none');
    }else{

        $('#checkOutModal .col-map').addClass('col-12');
        $('#checkOutModal .col-map').removeClass('col-6');

        $('#checkOutModal .col-map .ratio').removeClass('ratio-1x1');
        $('#checkOutModal .col-map .ratio').addClass('ratio-21x9');

        $('#checkOutModal .col-photo').addClass('d-none');

        //$('#checkInModal #imageUploadSection').addClass('d-none');
    }
    // You can perform other actions here based on the selected value
});

$('#submitCheckOutBtn').click(function(){

    //const employeeLocation = L.latLng(LOC_LATITUDE, LOC_LONGITUDE);
    // Calculate the distance in meters
    //const distance = LOC_OFFICE.distanceTo(employeeLocation);
    //console.log(distance);

    var workOutside = $('#checkOutModal input[name="is_work_outside"]:checked').val();
    const employeeLocation = L.latLng(LOC_LATITUDE, LOC_LONGITUDE);
    const distance = LOC_OFFICE.distanceTo(employeeLocation);
    //console.log(distance);

    if(workOutside == 1){
        submitCheckOut();
    }else{

        if(distance > 200){        
            showAlertMsg('You are not in the office area yet','error',5000);
        }else{
            submitCheckOut();
        }
    }
    
});

function submitCheckOut(){
    $.ajax({
        url: appUrl + "/attendance/submit-checkout",
        type: "POST",
        data: new FormData($('#checkOutForm').get(0)) ,
        cache: false,
        processData: false,
        contentType: false,
        beforeSend:function(){
            $('#checkOutModal .box-loader').fadeIn();
        },
        error:function(res){
            var resJson = res.responseJSON;
            showAlertMsg(resJson.message,'error',5000);
            $('#checkOutModal .box-loader').fadeOut();
            //$('.loader').fadeOut('fast');
        },
        success: function(res) {
            //checkInModal.hide();
            //$('.modal .loader').fadeOut('fast');
            showAlertMsg(res.message,'success',15000);
            
            setTimeout(function() {
                window.location.reload();
            }, 2000);
        }
    });
}

$('#checkOutBtn').click(function(){
    
    if($('#checkOutBtn').hasClass('active')){
        showCheckoutDetail();
    }else{
        checkOutModal.show();
    }

});

$('.time-log.time-out').on('click', function(){
    showCheckoutDetail();
});

function showCheckoutDetail(){
    checkOutDetailModal.show();
        
    setTimeout(() => {
        MAP_CHECKOUT_DETAIL.invalidateSize();
        MAP_CHECKOUT_DETAIL.setView(MAP_CHECKOUT_DETAIL_LOCATION, 16);
        MAP_CHECKOUT_DETAIL.panTo(MAP_CHECKOUT_DETAIL_LOCATION);

        if(MAP_CHECKOUT_DETAIL_MARKER){
            MAP_CHECKOUT_DETAIL_MARKER.setLatLng(MAP_CHECKOUT_DETAIL_LOCATION);
            MAP_CHECKOUT_DETAIL_MARKER.update();
        }
        
    }, 700);
}
