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

    if (typeof ATTENDANCE_STATUS !== 'undefined' && ATTENDANCE_STATUS.hasCheckedIn && !ATTENDANCE_STATUS.hasCheckedOut) {
        startLiveLocationTracking();
    }
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
});

$('#checkInModal').on('shown.bs.modal', function () {
    setTimeout(function () {
        updateMapCheckInLocation();
    }, 200);
});

function setDefaultLocation(){
    if (LOCATION_REQUEST_IN_FLIGHT) {
        return;
    }

    if (navigator.geolocation) {
        LOCATION_REQUEST_IN_FLIGHT = true;
        navigator.geolocation.getCurrentPosition(
            (position) => {
                LOC_LATITUDE = position.coords.latitude;
                LOC_LONGITUDE = position.coords.longitude;
                LOC_ACCURACY = position.coords.accuracy;
                HAS_VALID_GEOLOCATION = true;
                LOCATION_REQUEST_IN_FLIGHT = false;

                $('[name="latitudeCheckIn"]').val(LOC_LATITUDE);
                $('[name="longitudeCheckIn"]').val(LOC_LONGITUDE);
                $('[name="latitudeCheckOut"]').val(LOC_LATITUDE);
                $('[name="longitudeCheckOut"]').val(LOC_LONGITUDE);

                if (MAP_CHECKIN_MARKER) {
                    MAP_CHECKIN_MARKER.setLatLng([LOC_LATITUDE, LOC_LONGITUDE]).update();
                }

                if (MAP_CHECKOUT_MARKER) {
                    MAP_CHECKOUT_MARKER.setLatLng([LOC_LATITUDE, LOC_LONGITUDE]).update();
                }
            },
            (error) => {
                LOCATION_REQUEST_IN_FLIGHT = false;

                if (!HAS_VALID_GEOLOCATION && LOC_OFFICE) {
                    LOC_LATITUDE = LOC_OFFICE.lat;
                    LOC_LONGITUDE = LOC_OFFICE.lng;
                    LOC_ACCURACY = 0;

                    $('[name="latitudeCheckIn"]').val(LOC_LATITUDE);
                    $('[name="longitudeCheckIn"]').val(LOC_LONGITUDE);
                    $('[name="latitudeCheckOut"]').val(LOC_LATITUDE);
                    $('[name="longitudeCheckOut"]').val(LOC_LONGITUDE);
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 15000
            }
        );
    } else if (!HAS_VALID_GEOLOCATION && LOC_OFFICE) {
        LOC_LATITUDE = LOC_OFFICE.lat;
        LOC_LONGITUDE = LOC_OFFICE.lng;
        LOC_ACCURACY = 0;

        $('[name="latitudeCheckIn"]').val(LOC_LATITUDE);
        $('[name="longitudeCheckIn"]').val(LOC_LONGITUDE);
        $('[name="latitudeCheckOut"]').val(LOC_LATITUDE);
        $('[name="longitudeCheckOut"]').val(LOC_LONGITUDE);
    }
}

function sendLiveLocation() {
    if (!LOC_LATITUDE || !LOC_LONGITUDE) return;

    $.ajax({
        url: appUrl + "/location/update",
        type: "POST",
        data: {
            latitude: LOC_LATITUDE,
            longitude: LOC_LONGITUDE,
            accuracy: LOC_ACCURACY,
            tracked_at: new Date().toISOString(),
            _token: $('input[name="_token"]').first().val()
        }
    });
}

function startLiveLocationTracking() {
    if (LIVE_LOCATION_INTERVAL || LIVE_LOCATION_WATCH_ID !== null) return;

    if (navigator.geolocation && navigator.geolocation.watchPosition) {
        LIVE_LOCATION_WATCH_ID = navigator.geolocation.watchPosition(
            function (position) {
                LOC_LATITUDE = position.coords.latitude;
                LOC_LONGITUDE = position.coords.longitude;
                LOC_ACCURACY = position.coords.accuracy;

                sendLiveLocation();
            },
            function () {
                return;
            },
            {
                enableHighAccuracy: true,
                maximumAge: 3000,
                timeout: 10000,
            }
        );
    }

    sendLiveLocation();
    LIVE_LOCATION_INTERVAL = setInterval(sendLiveLocation, 10000);
}

function stopLiveLocationTracking() {
    if (LIVE_LOCATION_WATCH_ID !== null && navigator.geolocation && navigator.geolocation.clearWatch) {
        navigator.geolocation.clearWatch(LIVE_LOCATION_WATCH_ID);
        LIVE_LOCATION_WATCH_ID = null;
    }

    if (LIVE_LOCATION_INTERVAL) {
        clearInterval(LIVE_LOCATION_INTERVAL);
        LIVE_LOCATION_INTERVAL = null;
    }
}

async function getAttendanceToday() {
    return await $.ajax({
        url: '/attendance/get-attendance-today',
        type: 'GET'
    });
}

const CHECKIN_DEFAULT_ZOOM = 16;

function getCheckInCoordinates() {
    const latitude = Number(LOC_LATITUDE);
    const longitude = Number(LOC_LONGITUDE);

    if (
        Number.isFinite(latitude) &&
        Number.isFinite(longitude) &&
        latitude !== 0 &&
        longitude !== 0
    ) {
        return [latitude, longitude];
    }

    return [
        CHECKOUT_DEFAULT_LATITUDE,
        CHECKOUT_DEFAULT_LONGITUDE
    ];
}

function updateMapCheckInLocation() {
    if (!MAP_CHECKIN) {
        return;
    }

    const coordinates = getCheckInCoordinates();

    MAP_CHECKIN.invalidateSize();

    MAP_CHECKIN.setView(
        coordinates,
        CHECKIN_DEFAULT_ZOOM,
        {
            animate: false
        }
    );

    if (MAP_CHECKIN_MARKER) {
        MAP_CHECKIN_MARKER
            .setLatLng(coordinates)
            .update();
    }

    $('[name="latitudeCheckIn"]').val(coordinates[0]);
    $('[name="longitudeCheckIn"]').val(coordinates[1]);
}

async function initialiseMapsCheckIn() {
    const coordinates = getCheckInCoordinates();

    MAP_CHECKIN = L.map('mapCheckIn', {
        center: coordinates,
        zoom: CHECKIN_DEFAULT_ZOOM
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'ACER',
        maxZoom: 19
    }).addTo(MAP_CHECKIN);

    MAP_CHECKIN_MARKER = L.marker(coordinates).addTo(MAP_CHECKIN);

    MAP_CHECKIN_MARKER.bindTooltip("Your Location", {
        permanent: true,
        direction: 'top'
    });

    const response = await getAttendanceToday();

    if (!response.data || !response.data.length) {
        return;
    }

    const latlngs = [];
    let checkpoint = 1;

    response.data.forEach(attendance => {

        attendance.attendance_trackings.forEach(tracking => {

            if (!tracking.location) return;

            const [lat, lng] = tracking.location.split(',').map(Number);

            if (isNaN(lat) || isNaN(lng)) return;

            const latlng = [lat, lng];

            const time = tracking.date_time
                ? new Date(tracking.date_time).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                })
                : '-';

            L.marker(latlng)
                .addTo(MAP_CHECKIN)
                .bindTooltip(
                    `Checkpoint ${checkpoint}<br>${time}`,
                    {
                        permanent: true,
                        direction: 'top'
                    }
                );

            latlngs.push(latlng);
            checkpoint++;

        });

    });

    if (latlngs.length > 1) {
        L.polyline(latlngs, {
            color: 'blue',
            weight: 4
        }).addTo(MAP_CHECKIN);
    }
}

let LOC_LATITUDE = 0;
let LOC_LONGITUDE = 0;
let LOC_ACCURACY = 0;
let LOCATION_REQUEST_IN_FLIGHT = false;
let HAS_VALID_GEOLOCATION = false;
let MAP_CHECKIN = null;
let MAP_CHECKIN_MARKER = null;
let LIVE_LOCATION_INTERVAL = null;
let LIVE_LOCATION_WATCH_ID = null;

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
    setDefaultLocation();
});

const loopGetLocation = setInterval(function () {
    if (!HAS_VALID_GEOLOCATION) {
        setDefaultLocation();
    }
}, 10000);


$('#checkInBtn').click(function(){

    if($('#checkInBtn').hasClass('active')){
        checkInModal.show();
    }else{
        checkInModal.show();
    }
    
});

$('.time-log.time-in').on('click', function(){
    showCheckinDetail();
});

function showCheckinDetail() {
    checkInDetailModal.show();

    setTimeout(() => {
        try {
            if (window.MAP_CHECKIN_DETAIL_INSTANCE) {
                window.MAP_CHECKIN_DETAIL_INSTANCE.remove();
                window.MAP_CHECKIN_DETAIL_INSTANCE = null;
            }

            const mapEl = document.getElementById("detailMapCheckIn");
            if (!mapEl) return;

            let effectiveTrackings = [];

            try {
                effectiveTrackings = JSON.parse(mapEl.dataset.location || "[]");
            } catch (err) {
                console.error("Invalid tracking JSON", err);
                effectiveTrackings = [];
            }

            if (!effectiveTrackings.length) {
                mapEl.innerHTML =
                    '<div class="alert alert-warning text-center">Location data not available</div>';
                return;
            }

            const first = effectiveTrackings[0];
            const firstParts = String(first.location)
                .split(",")
                .map((s) => s.trim());

            if (firstParts.length < 2) return;

            const center = [
                parseFloat(firstParts[0]),
                parseFloat(firstParts[1]),
            ];

            const detailMap = L.map("detailMapCheckIn", {
                center: center,
                zoom: 16,
            });

            window.MAP_CHECKIN_DETAIL_INSTANCE = detailMap;

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                maxZoom: 19,
            }).addTo(detailMap);

            const latlngs = [];
            let checkpoint = 1;

            effectiveTrackings.forEach((tracking) => {
                if (!tracking.location) return;

                console.log(tracking);

                const parts = tracking.location
                    .split(",")
                    .map((s) => s.trim());

                if (parts.length < 2) return;

                const lat = parseFloat(parts[0]);
                const lng = parseFloat(parts[1]);

                if (isNaN(lat) || isNaN(lng)) return;

                const latlng = [lat, lng];

                const time = tracking.date_time
                    ? new Date(tracking.date_time).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                      })
                    : "--:--";

                L.marker(latlng)
                    .addTo(detailMap)
                    .bindTooltip(
                        `Checkpoint ${checkpoint}<br>Jam Checkin: ${time}`,
                        {
                            permanent: true,
                            direction: "top",
                            offset: [0, -10],
                        }
                    );

                latlngs.push(latlng);
                checkpoint++;
            });

            if (latlngs.length > 1) {

                L.polyline(latlngs, {
                    color: "#0d6efd",
                    weight: 4,
                    opacity: 0.8
                }).addTo(detailMap);

                detailMap.fitBounds(latlngs, {
                    padding: [20, 20],
                });

            } else {
                detailMap.setView(latlngs[0], 16);
            }

            setTimeout(() => {
                detailMap.invalidateSize();
            }, 200);
        } catch (e) {
            console.error("Multi-checkpoint map error:", e);
        }
    }, 200);
}

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
    
    // var workOutside = $('#checkInModal input[name="is_work_outside"]:checked').val();
    const employeeLocation = L.latLng(LOC_LATITUDE, LOC_LONGITUDE);
    const distance = LOC_OFFICE.distanceTo(employeeLocation);

    submitCheckIn();
    
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

const CHECKOUT_DEFAULT_LATITUDE = -6.601375904876687;
const CHECKOUT_DEFAULT_LONGITUDE = 106.80689246674521;
const CHECKOUT_DEFAULT_ZOOM = 16;

let MAP_CHECKOUT = null;
let MAP_CHECKOUT_MARKER = null;

let MAP_CHECKOUT_DETAIL = null;
let MAP_CHECKOUT_DETAIL_MARKER = null;
let MAP_CHECKOUT_DETAIL_LOCATION = null;

function getCheckOutCoordinates() {
    const latitude = Number(LOC_LATITUDE);
    const longitude = Number(LOC_LONGITUDE);

    if (
        Number.isFinite(latitude) &&
        Number.isFinite(longitude) &&
        latitude !== 0 &&
        longitude !== 0
    ) {
        return [latitude, longitude];
    }

    return [
        CHECKOUT_DEFAULT_LATITUDE,
        CHECKOUT_DEFAULT_LONGITUDE
    ];
}

function updateMapCheckOutLocation() {
    if (!MAP_CHECKOUT) {
        return;
    }

    const coordinates = getCheckOutCoordinates();

    MAP_CHECKOUT.invalidateSize();

    MAP_CHECKOUT.setView(
        coordinates,
        CHECKOUT_DEFAULT_ZOOM,
        {
            animate: false
        }
    );

    if (MAP_CHECKOUT_MARKER) {
        MAP_CHECKOUT_MARKER
            .setLatLng(coordinates)
            .update();
    }

    $('[name="latitudeCheckOut"]').val(coordinates[0]);
    $('[name="longitudeCheckOut"]').val(coordinates[1]);
}

function initialiseMapsCheckOut() {
    if (MAP_CHECKOUT) {
        return;
    }

    const coordinates = getCheckOutCoordinates();

    MAP_CHECKOUT = L.map('mapCheckOut', {
        center: coordinates,
        zoom: CHECKOUT_DEFAULT_ZOOM
    });

    L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
            attribution: 'ACER',
            maxZoom: 19
        }
    ).addTo(MAP_CHECKOUT);

    MAP_CHECKOUT_MARKER = L.marker(
        coordinates
    ).addTo(MAP_CHECKOUT);

    MAP_CHECKOUT_MARKER.bindTooltip(
        'Your Location',
        {
            permanent: true,
            direction: 'top',
            offset: [0, 0]
        }
    );

    $('[name="latitudeCheckOut"]').val(coordinates[0]);
    $('[name="longitudeCheckOut"]').val(coordinates[1]);

    const detailLocation = $('#detailMapCheckOut').attr('data-location');

    if (detailLocation) {
        MAP_CHECKOUT_DETAIL_LOCATION = detailLocation
            .split(',')
            .map(Number);

        MAP_CHECKOUT_DETAIL = L.map('detailMapCheckOut', {
            center: MAP_CHECKOUT_DETAIL_LOCATION,
            zoom: CHECKOUT_DEFAULT_ZOOM
        });

        L.tileLayer(
            'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            {
                attribution: 'ACER',
                maxZoom: 19
            }
        ).addTo(MAP_CHECKOUT_DETAIL);

        MAP_CHECKOUT_DETAIL_MARKER = L.marker(
            MAP_CHECKOUT_DETAIL_LOCATION
        ).addTo(MAP_CHECKOUT_DETAIL);

        MAP_CHECKOUT_DETAIL_MARKER.bindTooltip(
            'Check Out Location',
            {
                permanent: true,
                direction: 'top',
                offset: [0, 0]
            }
        );
    }
}

$(document).ready(function () {
    initialiseMapsCheckOut();
});

$('#checkOutModal').on('shown.bs.modal', function () {
    setTimeout(function () {
        updateMapCheckOutLocation();
    }, 200);
});

$('#checkOutModal [name="is_work_outside"]').change(function () {
    $('#checkOutModal .col-map').addClass('col-6');
    $('#checkOutModal .col-map .ratio').addClass('ratio-1x1');

    $('#checkOutModal .col-map').removeClass('col-12');
    $('#checkOutModal .col-map .ratio').removeClass('ratio-21x9');

    $('#checkOutModal .col-photo').removeClass('d-none');

    setTimeout(function () {
        updateMapCheckOutLocation();
    }, 200);
});

$('#submitCheckOutBtn').click(function () {
    const coordinates = getCheckOutCoordinates();

    LOC_LATITUDE = coordinates[0];
    LOC_LONGITUDE = coordinates[1];

    $('[name="latitudeCheckOut"]').val(LOC_LATITUDE);
    $('[name="longitudeCheckOut"]').val(LOC_LONGITUDE);

    submitCheckOut();
});

function submitCheckOut() {
    $.ajax({
        url: appUrl + '/attendance/submit-checkout',
        type: 'POST',
        data: new FormData($('#checkOutForm').get(0)),
        cache: false,
        processData: false,
        contentType: false,

        beforeSend: function () {
            $('#checkOutModal .box-loader').fadeIn();
        },

        error: function (res) {
            const resJson = res.responseJSON;

            showAlertMsg(
                resJson?.message || 'Failed to check out',
                'error',
                5000
            );

            $('#checkOutModal .box-loader').fadeOut();
        },

        success: function (res) {
            stopLiveLocationTracking();

            showAlertMsg(
                res.message,
                'success',
                15000
            );

            setTimeout(function () {
                window.location.reload();
            }, 2000);
        }
    });
}

$('#checkOutBtn').click(function () {
    if ($('#checkOutBtn').hasClass('active')) {
        showCheckoutDetail();
        return;
    }

    checkOutModal.show();
});

$('.time-log.time-out').on('click', function () {
    showCheckoutDetail();
});

function showCheckoutDetail() {
    checkOutDetailModal.show();

    setTimeout(function () {
        if (
            !MAP_CHECKOUT_DETAIL ||
            !MAP_CHECKOUT_DETAIL_LOCATION
        ) {
            return;
        }

        MAP_CHECKOUT_DETAIL.invalidateSize();

        MAP_CHECKOUT_DETAIL.setView(
            MAP_CHECKOUT_DETAIL_LOCATION,
            CHECKOUT_DEFAULT_ZOOM,
            {
                animate: false
            }
        );

        if (MAP_CHECKOUT_DETAIL_MARKER) {
            MAP_CHECKOUT_DETAIL_MARKER
                .setLatLng(MAP_CHECKOUT_DETAIL_LOCATION)
                .update();
        }
    }, 700);
}
