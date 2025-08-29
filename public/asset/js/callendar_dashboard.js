$(document).ready(function () {
    initializeCalendar();
});

// Calendar Functions
let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();

// Helper: format YYYY-MM-DD in local time
function formatLocalYMD(dateInput) {
    const d = (dateInput instanceof Date) ? dateInput : new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

// Simple selectDate for dashboard (sets hidden input and highlights selection)
function selectDate(day, month, year) {
    const selectedDate = new Date(year, month, day);
    const dateString = formatLocalYMD(selectedDate);

    const currentDateInput = document.getElementById("currentDate");
    if (currentDateInput) currentDateInput.value = dateString;

    const days = document.querySelectorAll(".calendar-day");
    days.forEach((d) => d.classList.remove("selected"));

    const selectedDay = Array.from(days).find(
        (d) => d.textContent == day && !d.classList.contains("other-month")
    );
    if (selectedDay) selectedDay.classList.add("selected");
}

function initializeCalendar() {
    currentDate = new Date();
    currentMonth = currentDate.getMonth();
    currentYear = currentDate.getFullYear();
    renderCalendar(currentMonth, currentYear);
}

function renderCalendar(month, year) {
    console.log("Rendering calendar for", month, year); // Debug log
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    // Update header
    const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];
    document.getElementById(
        "currentMonthYear"
    ).textContent = `${monthNames[month]} ${year}`;

    // Clear previous days
    const calendarDays = document.getElementById("calendarDays");
    calendarDays.innerHTML = "";

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDay; i++) {
        const emptyDay = document.createElement("div");
        emptyDay.className = "calendar-day other-month";
        calendarDays.appendChild(emptyDay);
    }

    // Fetch attendance data for the month and employee
    const employeeId = document.querySelector(
        'input[name="employee_id"]'
    )?.value;
    if (!employeeId) {
        console.error("Employee ID not found for attendance calendar");
        return;
    }
    

    fetch(`${baseUrl}/attendance/monthly/${employeeId}/${year}/${month + 1}`)
        .then((response) => response.json())
        .then((data) => {
            let attendanceData = {};
            if (data.status === "success" && Array.isArray(data.data)) {
                // Group attendance records by date
                data.data.forEach((record) => {
                    const ds = (record.date_attendance || '').toString();
                    let day = NaN;
                    try {
                        if (/Z$|[+\-]\d{2}:?\d{2}$/.test(ds)) {
                            // ISO string with timezone -> use Date to get local day
                            const d = new Date(ds);
                            if (!isNaN(d.getTime())) day = d.getDate();
                        } else if (ds.includes('T') || ds.includes(' ')) {
                            // Likely "YYYY-MM-DDTHH:MM:SS" or "YYYY-MM-DD HH:MM:SS"
                            const norm = ds.replace(' ', 'T');
                            const d = new Date(norm);
                            if (!isNaN(d.getTime())) day = d.getDate();
                        } else {
                            // Pure date string YYYY-MM-DD
                            const parts = ds.split('-');
                            day = parseInt(parts[2], 10);
                        }
                    } catch (e) {}
                    if (!isFinite(day)) return;
                    if (!attendanceData[day]) attendanceData[day] = [];
                    attendanceData[day].push(record);
                });
            }

            // Add days of the month
            for (let day = 1; day <= daysInMonth; day++) {
                const dayElement = document.createElement("div");
                dayElement.className = "calendar-day";
                dayElement.textContent = day;

                // Check if this is today
                const checkDate = new Date(year, month, day);
                if (checkDate.toDateString() === new Date().toDateString()) {
                    dayElement.classList.add("today");
                }

                // Add attendance classes based on data
                if (attendanceData[day]) {
                    const records = attendanceData[day];

                    // Detect using either time_in/time_out or type_attendance fields
                    const hasCheckIn = records.some(
                        (r) => (r.time_in && String(r.time_in).length > 0) || r.type_attendance === "check_in"
                    );
                    const hasCheckOut = records.some(
                        (r) => (r.time_out && String(r.time_out).length > 0) || r.type_attendance === "check_out"
                    );

                    if (hasCheckIn && hasCheckOut) {
                        // Both check-in and check-out (two-color background only)
                        dayElement.classList.add("checked-in", "checked-out");
                    } else if (hasCheckIn) {
                        // Only check-in (blue corner only)
                        dayElement.classList.add("checked-in");
                    } else if (hasCheckOut) {
                        // Only check-out (gray corner only)
                        dayElement.classList.add("checked-out");
                    }
                }

                // Add click event with left/right split behavior
                dayElement.addEventListener("click", function (e) {
                    selectDate(day, month, year);
                    const hasIn = dayElement.classList.contains('checked-in');
                    const hasOut = dayElement.classList.contains('checked-out');
                    const clickedDate = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;

                    try {
                        if (hasIn && hasOut && e && e.currentTarget) {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const clickX = e.clientX - rect.left;
                            const isLeftHalf = clickX < rect.width / 2;
                            if (isLeftHalf) {
                                if (typeof openCheckInDetailModal === 'function') openCheckInDetailModal(clickedDate);
                            } else {
                                if (typeof openCheckOutDetailModal === 'function') openCheckOutDetailModal(clickedDate);
                            }
                            return;
                        }

                        if (hasIn) {
                            if (typeof openCheckInDetailModal === 'function') openCheckInDetailModal(clickedDate);
                        } else if (hasOut) {
                            if (typeof openCheckOutDetailModal === 'function') openCheckOutDetailModal(clickedDate);
                        }
                    } catch (err) { console.error(err); }
                });

                calendarDays.appendChild(dayElement);
            }
        })
        .catch((error) => {
            console.error("Error fetching monthly attendance:", error);
        });
}
