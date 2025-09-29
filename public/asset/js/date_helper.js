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
  const y = date.getFullYear();

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





