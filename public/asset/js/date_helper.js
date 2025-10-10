// Function to add days to a given date.
// @param {Date} date - The starting date.
// @param {number} days - The number of days to add.
// @returns {Date} The new date with the added days.

const addDays = (date, days) => {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
};

const subDays = (date, days) => {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() - days);
  return newDate;
};

// Function to add weeks to a given date.
// @param {Date} date - The starting date.
// @param {number} weeks - The number of weeks to add.
// @returns {Date} The new date with the added weeks.
const addWeeks = (date, weeks) => {
  return addDays(date, weeks * 7);
};

// Function to calculate the number of days between two dates.
// @param {Date} date1 - The first date.
// @param {Date} date2 - The second date.
// @returns {number} The number of days between the two dates (can be positive or negative).
const daysBetween = (date1, date2) => {
  const oneDay = 1000 * 60 * 60 * 24; // milliseconds in a day
  const diffInTime = date2.getTime() - date1.getTime();
  const diffInDays = Math.round(diffInTime / oneDay);
  return diffInDays;
};

// Function to calculate the number of months between two dates.
// @param {Date} date1 - The first date.
// @param {Date} date2 - The second date.
// @returns {number} The number of full months between the two dates.
const monthsBetween = (date1, date2) => {
    let months;
    months = (date2.getFullYear() - date1.getFullYear()) * 12;
    months -= date1.getMonth();
    months += date2.getMonth();
    // Return the absolute value to handle dates in any order
    return Math.abs(months);
};

// Function to generate an array of all dates for a given month and year.
// @param {number} year - The year.
// @param {number} month - The month (0-11).
// @returns {Date[]} An array of Date objects from the first to the last day of the month.
const getDaysInMonth = (year, month) => {
  const dates = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0); // Day 0 of the next month is the last day of the current month

  for (let d = firstDay; d <= lastDay; d = addDays(d, 1)) {
    dates.push(new Date(d));
  }

  return dates;
};

// Function to format a date into a standard Indonesian format (dd-mm-yyyy).
// @param {Date} date - The date to format.
// @returns {string} The formatted date string.
const formatDateID = (date) => {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
};

// Function to format a date into a full Indonesian format with day, month, and year names.
// @param {Date} date - The date to format.
// @returns {string} The formatted date string with full day and month names.
const formatDateIDMedium = (date) => {
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
  ];

  const day = dayNames[date.getDay()];
  const d = date.getDate();
  const m = monthNames[date.getMonth()];
  const y = date.getFullYear();

  return `${day}, ${d} ${m} ${y}`;
};

// Function to format a date into a full Indonesian format with day, month, and year names.
// @param {Date} date - The date to format.
// @returns {string} The formatted date string with full day and month names.
const formatDateIDFull = (date) => {
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const day = dayNames[date.getDay()];
  const d = date.getDate();
  const m = monthNames[date.getMonth()];
  const y = date.getFullYear();

  return `${day}, ${d} ${m} ${y}`;
};


// Function to format a date into a full Indonesian format with day, month, and year names.
// @param {Date} date - The date to format.
// @returns {string} The formatted date string with full day and month names.


const arrWeekdayNameENMedium = (indexDay) => {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return dayNames[indexDay];
};

const arrWeekdayENISO = (indexDay) => {
  const dayNames = [7, 1, 2, 3, 4, 5, 6];
  return dayNames[indexDay];
};

const formatDateENMedium = (date) => {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const newDate = new Date(date);
  const d = newDate.getDate();
  const m = monthNames[newDate.getMonth()];
  const y = newDate.getFullYear();

  return `${d} ${m} ${y}`;
};

const formatDateENMediumDayMonth = (date) => {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const newDate = new Date(date);
  const d = newDate.getDate();
  const m = monthNames[newDate.getMonth()];

  return `${d} ${m}`;
};

// Function to format a date into a full Indonesian format with day, month, and year names.
// @param {Date} date - The date to format.
// @returns {string} The formatted date string with full day and month names.
const formatDateENMediumWithDay = (date) => {
  const newDate = new Date(date);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const day = dayNames[newDate.getDay()];
  const d = newDate.getDate();
  const m = monthNames[newDate.getMonth()];
  const y = newDate.getFullYear();

  return `${day}, ${d} ${m} ${y}`;
};

// Function to format a date into a full Indonesian format with day, month, and year names.
// @param {Date} date - The date to format.
// @returns {string} The formatted date string with full day and month names.
const formatDateENFull = (date) => {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const day = dayNames[date.getDay()];
  const d = date.getDate();
  const m = monthNames[date.getMonth()];
  const y = date.getFullYear();

  return `${day}, ${d} ${m} ${y}`;
};

/**
 * Mengformat objek Date sesuai dengan string format ala PHP.
 *
 * @param {string} format String format (misalnya 'Y-m-d H:i:s').
 * @param {Date} [dateObj=new Date()] Objek Date yang akan diformat.
 * @returns {string} String tanggal yang diformat.
 */
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