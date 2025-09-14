const appUrl = $('meta[name=app-url]').attr("content");


function updateClock() {
    const now = new Date();

    let hours = now.getHours().toString().padStart(2, "0");
    let minutes = now.getMinutes().toString().padStart(2, "0");
    let seconds = now.getSeconds().toString().padStart(2, "0");

    $('.text-clock-digital').text(`${hours} : ${minutes} : ${seconds}`);
    $("#clock").text(`${hours} : ${minutes} : ${seconds}`);
    
}
 
const timeOffModal = new bootstrap.Modal('#timeOffModal', {
  keyboard: false
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

//const LOC_OFFICE = L.latLng(-6.164849, 106.809542); // NSA Petotjo
let locationLat = -6.164849;
let locationLong = 106.809542;

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









// CALENDAR

let currentDate = new Date();

async function renderCalendar(year, month) {
    
    const calendarBody = $('.table-calendar tbody');
    calendarBody.empty();

    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const monthNames = new Date(year,month);


    $('.calendar-month').text(`${currentDate.toLocaleString('default', { month: 'long' })}`);
    $('.calendar-year').text(`${year}`);

    let day = 1;
    let row = $('<tr>');

    for (let i = 0; i < firstDay; i++) {
        row.append('<td class="empty-cell"></td>');
    }

    for (let i = 0; i < totalDays; i++) {
        if ((firstDay + i) % 7 === 0 && i !== 0) {
            calendarBody.append(row);
            row = $('<tr>');
        }
        const today = new Date();
        const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

        row.append(`<td class="calendar-day  ${isToday ? 'today' : ''}" data-calendar-date="${year}-${month+1}-${day}"><div class="bg-day"><div class="day">${day}</div></div></td>`);

        day++;
    }

    calendarBody.append(row);

    return 'done-rendering';
}

renderAttendance(currentDate.getFullYear(), currentDate.getMonth());


async function renderAttendance(year, month){
    try {
        const calendaerResponse = await renderCalendar(year, month);

        if(calendaerResponse == 'done-rendering'){
            const attendanceReposnse = await getAttendanceEmployeeByMonth(month+1,year);
        }
        
        //console.log(data);
    } catch (error) {
        console.error("Error fetching or processing data:", error);
    }
}

$('.calendar-prev-month').click(function() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderAttendance(currentDate.getFullYear(), currentDate.getMonth());
});

$('.calendar-next-month').click(function() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderAttendance(currentDate.getFullYear(), currentDate.getMonth());
});

$(document).on('click','.dropdown-month .month-item',function(){
    let monthNum = $(this).attr('data-month');
    
    currentDate.setMonth(parseInt(monthNum) - 1);

    renderAttendance(currentDate.getFullYear(), currentDate.getMonth());

    //$('.dropdown-month.show').removeClass('show');
});

$(document).on('click','.calendar-day',function(){
    let dateCalendar = $(this).attr('data-calendar-date');
    //alert(dateCalendar);
});


function appendEventCalendar(dateCalendar,text,type){

    let boxEvent = `<div class="text-event">${text}</div>`;

    $(document).find('[data-calendar-date="'+dateCalendar+'"] .box-event').append(boxEvent);

}

// END CALENDAR

// Attendance Calendar Data

async function getAttendanceEmployeeByMonth(month,year)
{

    $.ajax({
        url: appUrl + "/attendance/get-attendance-employee-by-month",
        type: "GET",
        data:{
            'YEAR' : year,
            'MONTH' : month,
        },
        beforeSend:function(){
            //$('.col-user-management .loader').fadeIn('fast');
            $('.calendar-attendance .loader').fadeIn('fast');
        },
        error:function(res){
            var resJson = res.responseJSON;
            showAlertMsg(resJson.message,'error',5000);
            $('.calendar-attendance .loader').fadeOut('fast');
          //$('.col-user-management .loader').fadeOut('fast');
        },
        success: function(response) {
            var resData = response.data;
            
            for (let i = 0; i < resData.length; i++) {
                const attendance = resData[i];

                const attendanceDateObject = new Date(attendance.date_attendance);
                const attendanceDateEN = attendanceDateObject.toISOString().slice(0, 10);
                
                const timeIn = formatTimeDisplay(attendance.time_in);
                const timeOut = formatTimeDisplay(attendance.time_out);

                const dateAttendance = formatDateMedium(attendance.date_attendance);

                $(`[data-calendar-date="${dateAttendance}"]`).attr('attendance_date',attendanceDateEN);
                $(`[data-calendar-date="${dateAttendance}"]`).attr('attendance',attendance.id);
                $(`[data-calendar-date="${dateAttendance}"]`).attr('check-in',timeIn);
                $(`[data-calendar-date="${dateAttendance}"]`).attr('check-out',timeOut);

                if(timeIn != '--:--'){
                    $(document).find(`[data-calendar-date="${dateAttendance}"]`).addClass('check-in');
                }

                if(timeOut != '--:--'){
                    $(document).find(`[data-calendar-date="${dateAttendance}"]`).addClass('check-out');
                }

            }

            $('.calendar-attendance .loader').fadeOut('fast');
        
        }
         
    });

}

// Attendance Calendar Data


// Format Date Time

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

function formatDateMedium(date) {
    const newDate = new Date(date);
    const year = newDate.getFullYear();
    const month = newDate.getMonth() + 1; // getMonth() returns 0-11
    const day = newDate.getDate();

    // No padding needed for single-digit month/day in yyyy-m-d format
    return `${year}-${month}-${day}`;
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
//