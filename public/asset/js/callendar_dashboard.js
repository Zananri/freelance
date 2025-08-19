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

                    // Special handling for current day to show 3 segments with previous day checkout
                    const today = new Date();
                    const checkDate = new Date(year, month, day);
                    const isToday =
                        checkDate.toDateString() === today.toDateString();

                    // Define dateString for current day
                    const dateString = checkDate.toISOString().split("T")[0];

                    // Group records by type and date
                    const todayRecords = records.filter(
                        (r) => r.date_attendance === dateString
                    );
                    const previousDayRecords = records.filter(
                        (r) => r.date_attendance < dateString
                    );

                    // Check for previous day checkout
                    const hasPreviousDayCheckout = previousDayRecords.some(
                        (r) => r.type_attendance === "check_out"
                    );

                    // Count today's check-ins and check-outs
                    const todayCheckIns = todayRecords.filter(
                        (r) => r.type_attendance === "check_in"
                    );
                    const todayCheckOuts = todayRecords.filter(
                        (r) => r.type_attendance === "check_out"
                    );

                    // Handle 3-segment display for current day
                    if (
                        isToday &&
                        (hasPreviousDayCheckout ||
                            todayCheckIns.length > 0 ||
                            todayCheckOuts.length > 0)
                    ) {
                        // Always use 3-segment layout for today
                        dayElement.classList.add("has-three-sections");

                        // Create date number container
                        const dateNumber = document.createElement("span");
                        dateNumber.className = "date-number";
                        dateNumber.textContent = day;
                        dayElement.appendChild(dateNumber);

                        // Top section - Previous day's checkout (if exists)
                        if (hasPreviousDayCheckout) {
                            const outLabelTop = document.createElement("span");
                            outLabelTop.className = "check-out-label-top";
                            dayElement.appendChild(outLabelTop);
                        }

                        // Middle section - Today's check-in
                        if (todayCheckIns.length > 0) {
                            const inLabel = document.createElement("span");
                            inLabel.className = "check-in-label-middle";
                            inLabel.textContent = "In";
                            dayElement.appendChild(inLabel);
                        }

                        // Bottom section - Today's checkout
                        if (todayCheckOuts.length > 0) {
                            const outLabelBottom =
                                document.createElement("span");
                            outLabelBottom.className = "check-out-label-bottom";
                            dayElement.appendChild(outLabelBottom);
                        }
                    } else {
                        // Handle other days with simpler display
                        let checkInCount = 0;
                        let checkOutCount = 0;
                        records.forEach((rec) => {
                            if (rec.type_attendance === "check_in")
                                checkInCount++;
                            if (rec.type_attendance === "check_out")
                                checkOutCount++;
                        });

                        if (checkInCount > 0 && checkOutCount > 0) {
                            // Both check-in and check-out
                            dayElement.classList.add("checked-in");
                            dayElement.classList.add("checked-out");
                            const inLabel = document.createElement("span");
                            inLabel.className = "check-in-label";
                            dayElement.appendChild(inLabel);
                            const outLabel = document.createElement("span");
                            outLabel.className = "check-out-label";
                            dayElement.appendChild(outLabel);
                        } else if (checkInCount > 0) {
                            // Only check-in
                            dayElement.classList.add("checked-in");
                            const inLabel = document.createElement("span");
                            inLabel.className = "check-in-label";
                            dayElement.appendChild(inLabel);
                        } else if (checkOutCount > 0) {
                            // Only check-out
                            dayElement.classList.add("checked-out");
                            const outLabel = document.createElement("span");
                            outLabel.className = "check-out-label";
                            dayElement.appendChild(outLabel);
                        }
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
