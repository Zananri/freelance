const appUrl = $('meta[name=app-url]').attr("content");


function updateClock() {
    const now = new Date();

    let hours = now.getHours().toString().padStart(2, "0");
    let minutes = now.getMinutes().toString().padStart(2, "0");
    let seconds = now.getSeconds().toString().padStart(2, "0");

    $('.text-clock-digital').text(`${hours} : ${minutes} : ${seconds}`);
    $("#clock").text(`${hours} : ${minutes} : ${seconds}`);
    
}

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
    
    if($('#detailMapCheckIn').attr('data-location')){

        MAP_CHECKIN_DETAIL_LOCATION = $('#detailMapCheckIn').attr('data-location').split(',');

        MAP_CHECKIN_DETAIL = L.map('detailMapCheckIn', {
                    center: MAP_CHECKIN_DETAIL_LOCATION,
                    zoom: 16
                });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: 'ACER',
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
initialiseMapsCheckIn();
let locationLat = -6.140808415355851;
let locationLong = 106.8323372601321;

if(employeeOffice){
    locationLat = employeeOffice.split(',')[0];
    locationLong = employeeOffice.split(',')[1];
}

const LOC_OFFICE = L.latLng(locationLat, locationLong);

const loopGetLocation = setInterval(setDefaultLocation, 500);


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
 
function isMobileDevice() {
  return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
}

 

$('.time-log.time-out').on('click', function(){
    showCheckoutDetail();
});

let MAP_CHECKOUT_DETAIL = null;
let MAP_CHECKOUT_DETAIL_LOCATION = null;
let MAP_CHECKOUT_DETAIL_MARKER = null;


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


function initialiseMapsCheckOut(){
    
    if($('#detailMapCheckOut').attr('data-location')){

        MAP_CHECKOUT_DETAIL_LOCATION = $('#detailMapCheckOut').attr('data-location').split(',');

        MAP_CHECKOUT_DETAIL = L.map('detailMapCheckOut', {
                    center: MAP_CHECKOUT_DETAIL_LOCATION,
                    zoom: 16
                });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: 'ACER',
            maxZoom: 19
        }).addTo(MAP_CHECKOUT_DETAIL);

        MAP_CHECKOUT_DETAIL_MARKER = L.marker(MAP_CHECKOUT_DETAIL_LOCATION).addTo(MAP_CHECKOUT_DETAIL);
        MAP_CHECKOUT_DETAIL_MARKER.bindTooltip("Check In Location", { permanent: true, direction: 'top', offset: [0, 0] });

    }
}

initialiseMapsCheckOut();








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

        row.append(`<td class="calendar-day  ${isToday ? 'today' : ''}" data-calendar-date="${year}-${month+1}-${day}"><div class="bg-day"><div class="day">${day}</div>
            <div class="note" data-bs-toggle="tooltip" data-bs-placement="top"
                data-bs-title="This top tooltip is themed via CSS variables.">
                Note : Lorem ipsum dolor sit amet, consectetur adipiscing elit.</div>
            </div></td>`);

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


            const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
            const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
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

    return getData = await $.ajax({
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
                
                const note = attendance.note;
                const timeIn = formatTimeDisplay(attendance.time_in);
                const timeOut = formatTimeDisplay(attendance.time_out);

                const dateAttendance = formatDateMedium(attendance.date_attendance);

                $(`[data-calendar-date="${dateAttendance}"]`).attr('attendance_date',attendanceDateEN);
                $(`[data-calendar-date="${dateAttendance}"]`).attr('attendance',attendance.id);
                $(`[data-calendar-date="${dateAttendance}"]`).attr('check-in',timeIn);
                $(`[data-calendar-date="${dateAttendance}"]`).attr('check-out',timeOut);
                $(`[data-calendar-date="${dateAttendance}"]`).attr('note',note);

                if(note != '' && note != null && note != undefined && note != 'null' && note != 'undefined'){
                    $(document).find(`[data-calendar-date="${dateAttendance}"]`).addClass('has-note');
                    
                    $(document).find(`[data-calendar-date="${dateAttendance}"] .note`).text(`note : ${note}`).attr('data-bs-title',`note : ${note}`);
                }

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

function formatTimeDisplayHm(timeString) {

    if (!timeString) return '0h 0m';

    if (typeof timeString === 'string') {
        timeString.split(':')[0];
        const m = timeString.match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
        if (m) return `${parseInt(m[1])}h ${parseInt(m[2])}m`;
    }
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


function formateDateNumMonYear(dateString){

    if (!dateString) return '';

    const newDate = new Date(dateString); // Or your specific date object

    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    //const dayOfWeek = weekdays[newDate.getDay()];
    const dateNumber = newDate.getDate();
    const monthName = months[newDate.getMonth()];
    const year = newDate.getFullYear();

    const formattedDate = `${dateNumber} ${monthName} ${year}`;

    return formattedDate;

}
//

function formatDatePHP(format, dateString) {
    
    if (!dateString) return '';

    const dateObj = new Date(dateString);

    // Variabel untuk menyimpan komponen tanggal
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1; // getMonth() mengembalikan 0-11
    const day = dateObj.getDate();
    const hours = dateObj.getHours();
    const minutes = dateObj.getMinutes();
    const seconds = dateObj.getSeconds();
    const dayOfWeek = dateObj.getDay(); // 0 (Minggu) - 6 (Sabtu)
    const dayOfYear = Math.ceil((dateObj - new Date(year, 0, 1)) / (1000 * 60 * 60 * 24)) + 1;
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

    // Helper untuk menambahkan nol di depan (misalnya 01, 09)
    const pad = (n, len = 2) => String(n).padStart(len, '0');

    // Array nama hari dan bulan untuk format teks
    const daysFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const daysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthsFull = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Objek pemetaan token format PHP ke nilai JavaScript
    const tokens = {
        // Hari
        'd': pad(day),                      // Hari dalam bulan, 2 digit dengan nol awal (01 sampai 31)
        'D': daysShort[dayOfWeek],          // Representasi tekstual hari, 3 huruf
        'j': day,                           // Hari dalam bulan tanpa nol awal (1 sampai 31)
        'l': daysFull[dayOfWeek],           // Representasi tekstual hari, lengkap
        'N': dayOfWeek === 0 ? 7 : dayOfWeek, // Representasi numerik hari dalam seminggu (1=Senin sampai 7=Minggu)
        'S': (day % 10 === 1 && day !== 11) ? 'st' : // Akhiran ordinal hari bulan (st, nd, rd, th)
             (day % 10 === 2 && day !== 12) ? 'nd' :
             (day % 10 === 3 && day !== 13) ? 'rd' : 'th',
        'w': dayOfWeek,                     // Representasi numerik hari dalam seminggu (0=Minggu sampai 6=Sabtu)
        'z': dayOfYear - 1,                 // Hari dalam tahun (0 sampai 365)

        // Minggu
        'W': 'XX', // Penanganan Week number (W) cukup kompleks dan sering memerlukan locale/ISO-standard, di sini diabaikan/disederhanakan.

        // Bulan
        'F': monthsFull[month - 1],         // Representasi tekstual bulan, lengkap
        'm': pad(month),                    // Representasi numerik bulan, dengan nol awal (01 sampai 12)
        'M': monthsShort[month - 1],        // Representasi tekstual bulan, 3 huruf
        'n': month,                         // Representasi numerik bulan, tanpa nol awal (1 sampai 12)
        't': new Date(year, month, 0).getDate(), // Jumlah hari dalam bulan yang diberikan (28 sampai 31)

        // Tahun
        'L': isLeap ? 1 : 0,                // Apakah tahun kabisat (1 jika kabisat, 0 jika tidak)
        'o': year,                          // Tahun ISO 8601 (disini disederhanakan sama dengan Y)
        'Y': year,                          // Tahun, 4 digit
        'y': String(year).slice(-2),        // Tahun, 2 digit

        // Waktu
        'a': hours < 12 ? 'am' : 'pm',      // 'am' atau 'pm' huruf kecil
        'A': hours < 12 ? 'AM' : 'PM',      // 'AM' atau 'PM' huruf besar
        'g': hours % 12 || 12,              // Format jam 12 tanpa nol awal (1 sampai 12)
        'G': hours,                         // Format jam 24 tanpa nol awal (0 sampai 23)
        'h': pad(hours % 12 || 12),         // Format jam 12 dengan nol awal (01 sampai 12)
        'H': pad(hours),                    // Format jam 24 dengan nol awal (00 sampai 23)
        'i': pad(minutes),                  // Menit, dengan nol awal (00 sampai 59)
        's': pad(seconds),                  // Detik, dengan nol awal (00 sampai 59)
        'u': pad(dateObj.getMilliseconds(), 3), // Milidetik (meniru mikrodetik PHP, disederhanakan)

        // Zona waktu
        'e': 'UTC',                         // Zona waktu (disini disederhanakan)
        'I': 0,                             // Apakah Daylight Saving Time (DST) atau tidak (disini disederhanakan)
        'O': dateObj.toString().match(/([+-]\d{4})/)?.[1] || '+0000', // Perbedaan waktu dengan GMT, dalam jam dan menit
        'P': dateObj.toString().match(/([+-]\d{2})(\d{2})/)?.[1] + ':' + dateObj.toString().match(/([+-]\d{2})(\d{2})/)?.[2] || '+00:00', // Perbedaan waktu dengan GMT, dengan titik dua
        'T': dateObj.toLocaleTimeString('en', { timeZoneName: 'short' }).split(' ')[2] || 'GMT', // Singkatan zona waktu (disini disederhanakan)
        'Z': dateObj.getTimezoneOffset() * -60, // Offset zona waktu dalam detik (-43200 sampai 50400)

        // Full Date/Time
        'c': dateObj.toISOString().slice(0, 19) + dateObj.toString().match(/([+-]\d{2})(\d{2})/)?.[0].replace(/(\d{2})(\d{2})/g, '$1:$2') || dateObj.toISOString(), // ISO 8601
        'r': dateObj.toUTCString(),         // RFC 2822 (Email)
        'U': Math.floor(dateObj.getTime() / 1000) // Detik sejak Epoch (1 Januari 1970 00:00:00 GMT)
    };
 

    // Split the string into an array of individual characters
    let charFormat = format.split('');

    // Iterate over each character using forEach
    let newStringFormat = '';
    
    charFormat.forEach(char => {
        if(tokens[char]){
            newStringFormat += tokens[char];
        }else{
            newStringFormat += char;
        }
         
    });

    return newStringFormat;
}

function timeDiffFromNow(dateString){
    const startTime = new Date();
    const endTime = new Date(dateString);

    const diffMilliseconds = Math.abs(endTime.getTime() - startTime.getTime());

    const diffSeconds = diffMilliseconds / 1000;
    const diffMinutes = diffMilliseconds / (1000 * 60);
    const diffHours = diffMilliseconds / (1000 * 60 * 60);

    const format = {
        'seconds': parseInt(diffSeconds % 60),
        'minutes': parseInt(diffMinutes % 60),
        'hours': parseInt(diffHours)
    }

    return format;
    // console.log(`Difference in milliseconds: ${diffMilliseconds}`);
    // console.log(`Difference in seconds: ${diffSeconds}`);
    // console.log(`Difference in minutes: ${diffMinutes}`);
    // console.log(`Difference in hours: ${diffHours}`)
}