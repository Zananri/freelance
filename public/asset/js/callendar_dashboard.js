$(document).ready(function () {
    initializeCalendar();
});

// Calendar Functions
let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();

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
                    const date = new Date(record.date_attendance);
                    const day = date.getDate();
                    if (!attendanceData[day]) {
                        attendanceData[day] = [];
                    }
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

                // Add click event
                dayElement.addEventListener("click", function () {
                    selectDate(day, month, year);
                });

                calendarDays.appendChild(dayElement);
            }
        })
        .catch((error) => {
            console.error("Error fetching monthly attendance:", error);
        });
}
