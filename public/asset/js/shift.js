// Shift Management JavaScript - Updated to use employee_shifts data
document.addEventListener("DOMContentLoaded", function () {
    loadEmployeeData();
    setupEventListeners();
});

// Global variables
let currentDate = new Date();
let employees = [];

// Load employee data
async function loadEmployeeData() {
    try {
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();

        const basePath =
            window.location.pathname.split("/").slice(0, -1).join("/") || "";
        const endpoint = `${basePath}/shift/employees-basic?month=${month}&year=${year}`;

        const response = await fetch(endpoint);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.data) {
            employees = data.data;
            renderHeader(month, year);
            renderEmployeeTable(employees, month, year);
        } else {
            console.error("Invalid data format:", data);
            renderError("Failed to load employee data");
        }
    } catch (error) {
        console.error("Error loading employee data:", error);
        renderError(error.message || "Failed to load employee data");
    }
}

// Year Dropdown
function populateYearDropdown() {
    const yearSelect = document.getElementById("yearSelect");
    const currentYear = currentDate.getFullYear();
    yearSelect.innerHTML = "";

    for (let y = currentYear - 5; y <= currentYear + 5; y++) {
        const option = document.createElement("option");
        option.value = y;
        option.textContent = y;
        if (y === currentYear) option.selected = true;
        yearSelect.appendChild(option);
    }

    yearSelect.addEventListener("change", () => {
        currentDate.setFullYear(parseInt(yearSelect.value));
        loadEmployeeData();
    });
}

// Event tombol prev/next bulan
document.getElementById("prevMonthBtn").addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    loadEmployeeData();
});

document.getElementById("nextMonthBtn").addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    loadEmployeeData();
});

// Panggil pertama kali
populateYearDropdown();
loadEmployeeData();

// Render header tanggal
function renderHeader(month, year) {
    const headerRow = document.getElementById("shiftTableHeader");
    headerRow.innerHTML = `<th class="sticky-col">Employee</th>`;

    const daysInMonth = new Date(year, month, 0).getDate();

    for (let i = 1; i <= daysInMonth; i++) {
        const th = document.createElement("th");
        const day = new Date(year, month - 1, i).getDay();

        th.textContent = i;
        if (day === 0) th.classList.add("sunday");
        headerRow.appendChild(th);
    }
}

// Render isi tabel
function renderEmployeeTable(employees, month, year) {
    const tableBody = document.getElementById("shiftTableBody");
    const monthTitle = document.getElementById("shiftMonthTitle");

    if (!tableBody) return;
    tableBody.innerHTML = "";

    if (!employees || employees.length === 0) {
        tableBody.innerHTML =
            '<tr><td colspan="32" class="text-center">No employees found</td></tr>';
        return;
    }

    const daysInMonth = new Date(year, month, 0).getDate();
    const monthName = new Date(year, month - 1, 1).toLocaleString("default", {
        month: "long",
    });
    monthTitle.textContent = `${monthName} ${year}`;

    employees.forEach((employee) => {
        const row = document.createElement("tr");

        // Kolom nama
        const employeeCell = document.createElement("td");
        employeeCell.classList.add("sticky-col");

        employeeCell.innerHTML = `
            <div class="employee-wrapper d-flex align-items-center gap-2">
                <img src="${
                    employee.profile_picture || "/asset/img/default-profile.png"
                }"
                    alt="Profile Picture"
                    class="table-image rounded-circle"
                    width="28px"
                    height="28px" />
                <div>
                    <div class="fw-semibold" style="font-size: 14px;">${
                        employee.name
                    }</div>
                </div>
                <div class="overlay-edit-employee">
                    <button class="btn btn-sm btn-light btn-edit-employee"
                            data-employee-id="${employee.id}"
                            data-employee-name="${employee.name}"
                            data-employee-picture="${
                                employee.profile_picture ||
                                "/asset/img/default-profile.png"
                            }">
                        <span class="material-symbols-outlined">edit</span>
                    </button>
                </div>
            </div>
        `;

        // Hover show edit button
        const overlayEmp = employeeCell.querySelector(".overlay-edit-employee");
        employeeCell.addEventListener("mouseenter", () => {
            overlayEmp.style.display = "flex";
        });
        employeeCell.addEventListener("mouseleave", () => {
            overlayEmp.style.display = "none";
        });

        // Klik tombol edit employee
        const editEmployeeBtn =
            employeeCell.querySelector(".btn-edit-employee");
        const employeeModalEl = document.getElementById("editEmployeeModal");
        const employeeModal = new bootstrap.Modal(employeeModalEl);

        editEmployeeBtn.addEventListener("click", (e) => {
            e.preventDefault();
            const btn = e.currentTarget;

            employeeModalEl.querySelector("#editShiftId").value = "";
            employeeModalEl.querySelector("#editEmployeeId").value =
                btn.dataset.employeeId;
            employeeModalEl.querySelector("#editEmployeeName").value =
                btn.dataset.employeeName;
            employeeModalEl.querySelector("#editEmployeePicture").src =
                btn.dataset.employeePicture;

            // kosongin shift karena ini edit employee
            employeeModalEl.querySelector("#editDateShiftDisplay").value = "";
            employeeModalEl.querySelector("#editDateShift").value = "";
            employeeModalEl.querySelector("#editTimeStart").value = "";
            employeeModalEl.querySelector("#editTimeEnd").value = "";

            employeeModal.show();
        });

        row.appendChild(employeeCell);

        // Kolom tanggal
        for (let i = 1; i <= daysInMonth; i++) {
            const td = document.createElement("td");
            td.classList.add("shift-cell");
            td.style.position = "relative";
            const day = new Date(year, month - 1, i).getDay();
            if (day === 0) td.classList.add("sunday");

            const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(
                i
            ).padStart(2, "0")}`;

            const shift = employee.shifts.find((s) => s.date_shift === dateKey);

            let start = shift ? shift.time_start : "";
            let end = shift ? shift.time_end : "";
            let shiftId = shift ? shift.shift_id : "";

            td.innerHTML = `
                <div class="shift-wrapper">
                    <span class="shift-text">${
                        shift ? `${start || "??"}  ${end || "??"}` : ""
                    }</span>
                    <div class="overlay-edit">
                        <button class="btn btn-sm btn-light btn-edit-shift"
                                data-shift-id="${shiftId}"
                                data-employee-id="${employee.id}"
                                data-employee-name="${employee.name}"
                                data-employee-picture="${
                                    employee.profile_picture ||
                                    "/asset/img/default-profile.png"
                                }"
                                data-date="${dateKey}"
                                data-start="${start}"
                                data-end="${end}">
                            <span class="material-symbols-outlined">edit</span>
                        </button>
                    </div>
                </div>
            `;

            const overlay = td.querySelector(".overlay-edit");
            const editBtn = td.querySelector(".btn-edit-shift");

            td.addEventListener("mouseenter", () => {
                overlay.style.display = "flex";
            });
            td.addEventListener("mouseleave", () => {
                overlay.style.display = "none";
            });

            const shiftModalEl = document.getElementById("editShiftModal");
            const shiftModal = new bootstrap.Modal(shiftModalEl);

            editBtn.addEventListener("click", (e) => {
                e.preventDefault();
                const btn = e.currentTarget;

                // isi hidden input
                document.getElementById("editShiftId").value =
                    btn.dataset.shiftId;
                document.getElementById("editEmployeeId").value =
                    btn.dataset.employeeId;
                document.getElementById("editEmployeeNameInput").value =
                    btn.dataset.employeeName;
                document.getElementById("editDateShift").value =
                    btn.dataset.date;
                document.getElementById("editTimeStart").value =
                    btn.dataset.start;
                document.getElementById("editTimeEnd").value = btn.dataset.end;

                // isi tampilan modal
                document.getElementById("editEmployeeName").textContent =
                    btn.dataset.employeeName;
                document.getElementById("editEmployeePicture").src =
                    btn.dataset.employeePicture;

                // Format date for display
                const date = new Date(btn.dataset.date);
                const formattedDate = date.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                });

                document.getElementById("editDateShiftDisplay").textContent =
                    formattedDate;
                document.getElementById("editTimeStartDisplay").textContent =
                    btn.dataset.start;
                document.getElementById("editTimeEndDisplay").textContent =
                    btn.dataset.end;

                shiftModal.show();
            });

            row.appendChild(td);
        }

        tableBody.appendChild(row);
    });
}

// Jalankan
loadEmployeeData();

// tombol prev/next bulan
document.getElementById("prevMonthBtn").addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    loadEmployeeData();
});

document.getElementById("nextMonthBtn").addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    loadEmployeeData();
});

// Function to render error message
function renderError(message) {
    const tableBody = document.getElementById("shiftTableBody");
    if (tableBody) {
        tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">${message}</td></tr>`;
    }
}

// Setup event listeners for edit buttons
function setupEventListeners() {
    // Event delegation for edit buttons
    document.addEventListener("click", function (e) {
        if (e.target.closest(".btn-edit")) {
            const button = e.target.closest(".btn-edit");
            openEditEmployeeModal(button);
        }
    });

    // Save shift button
    document
        .getElementById("saveShiftBtn")
        .addEventListener("click", saveShiftChanges);
}

// Initialize date picker for shift dates
let selectedShiftDates = [];

function initializeShiftDatePicker() {
    const dateDisplay = document.getElementById("editDateShiftDisplay");
    const dateInput = document.getElementById("editDateShift");

    if (!dateDisplay || !dateInput) return;

    // Create datepicker container
    const datepickerContainer = document.createElement("div");
    datepickerContainer.id = "shift-datepicker";
    datepickerContainer.className = "datepicker-container";
    datepickerContainer.style.cssText = `
        position: absolute;
        background: white;
        border: 1px solid #ddd;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        padding: 10px;
        z-index: 1000;
        display: none;
        max-width: 300px;
    `;

    dateDisplay.parentNode.style.position = "relative";
    dateDisplay.parentNode.appendChild(datepickerContainer);

    // Create calendar
    const calendar = document.createElement("div");
    calendar.className = "calendar-grid";
    calendar.style.cssText = `
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 2px;
        font-size: 12px;
    `;

    // Header
    const header = document.createElement("div");
    header.style.cssText =
        "grid-column: span 7; display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;";
    header.innerHTML = `
        <button type="button" class="btn-prev-month" style="border: none; background: none; cursor: pointer;"><</button>
        <span class="month-year"></span>
        <button type="button" class="btn-next-month" style="border: none; background: none; cursor: pointer;">></button>
    `;

    // Weekday headers
    const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
    weekdays.forEach((day) => {
        const dayHeader = document.createElement("div");
        dayHeader.textContent = day;
        dayHeader.style.cssText =
            "text-align: center; font-weight: bold; padding: 5px;";
        calendar.appendChild(dayHeader);
    });

    datepickerContainer.appendChild(header);
    datepickerContainer.appendChild(calendar);

    let currentDate = new Date();

    function renderCalendar() {
        calendar.innerHTML = "";
        weekdays.forEach((day) => {
            const dayHeader = document.createElement("div");
            dayHeader.textContent = day;
            dayHeader.style.cssText =
                "text-align: center; font-weight: bold; padding: 5px;";
            calendar.appendChild(dayHeader);
        });

        const firstDay = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            1
        );
        const lastDay = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth() + 1,
            0
        );
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        header.querySelector(".month-year").textContent =
            currentDate.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
            });

        for (let i = 0; i < 42; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);

            const dayElement = document.createElement("div");
            dayElement.textContent = date.getDate();
            dayElement.style.cssText = `
                text-align: center;
                padding: 8px;
                cursor: pointer;
                border-radius: 4px;
                ${
                    date.getMonth() !== currentDate.getMonth()
                        ? "color: #ccc;"
                        : ""
                }
                ${
                    selectedShiftDates.some(
                        (d) => d.toDateString() === date.toDateString()
                    )
                        ? "background: #007bff; color: white;"
                        : ""
                }
            `;

            dayElement.addEventListener("click", () => toggleShiftDate(date));
            calendar.appendChild(dayElement);
        }
    }

    function toggleShiftDate(date) {
        const index = selectedShiftDates.findIndex(
            (d) => d.toDateString() === date.toDateString()
        );
        if (index > -1) {
            selectedShiftDates.splice(index, 1);
        } else {
            selectedShiftDates.push(new Date(date));
        }
        updateDisplay();
        renderCalendar();
    }

    function updateDisplay() {
        selectedShiftDates.sort((a, b) => a - b);
        const formattedDates = selectedShiftDates.map((d) => {
            // Format as YYYY-MM-DD to avoid year issues
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, "0");
            const day = String(d.getDate()).padStart(2, "0");
            return `${year}-${month}-${day}`;
        });

        dateDisplay.value = formattedDates
            .map((d) => {
                const date = new Date(d);
                return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                });
            })
            .join(", ");

        dateInput.value = JSON.stringify(formattedDates);
    }

    // Event listeners
    dateDisplay.addEventListener("click", () => {
        datepickerContainer.style.display =
            datepickerContainer.style.display === "none" ? "block" : "none";
        renderCalendar();
    });

    header.querySelector(".btn-prev-month").addEventListener("click", () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    header.querySelector(".btn-next-month").addEventListener("click", () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    // Close datepicker when clicking outside
    document.addEventListener("click", (e) => {
        if (
            !e.target.closest("#shift-datepicker") &&
            e.target !== dateDisplay
        ) {
            datepickerContainer.style.display = "none";
        }
    });

    renderCalendar();
}

// Open edit modal with employee data
function openEditEmployeeModal(button) {
    const employeeId = button.dataset.id;
    const employeeName = button.dataset.name;
    const datesData = button.dataset.dates;
    const timeStart = button.dataset.start;
    const timeEnd = button.dataset.end;

    // Reset selected dates
    selectedShiftDates = [];

    // Parse existing dates
    if (datesData && datesData !== "null" && datesData !== "") {
        try {
            const dates = JSON.parse(datesData);
            if (Array.isArray(dates)) {
                selectedShiftDates = dates
                    .filter((d) => d)
                    .map((d) => new Date(d));
            } else {
                selectedShiftDates = [new Date(datesData)];
            }
        } catch (e) {
            console.error("Error parsing dates:", e);
            selectedShiftDates = [];
        }
    }

    // Populate modal fields
    document.getElementById("editEmployeeId").value = employeeId;
    document.getElementById("editEmployeeName").value = employeeName;
    document.getElementById("editTimeStart").value = timeStart || "";
    document.getElementById("editTimeEnd").value = timeEnd || "";

    // Update date display
    const dateDisplay = document.getElementById("editDateShiftDisplay");
    const dateInput = document.getElementById("editDateShift");

    if (selectedShiftDates.length > 0) {
        const formattedDates = selectedShiftDates.map((d) => {
            // Format as YYYY-MM-DD to avoid year issues
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, "0");
            const day = String(d.getDate()).padStart(2, "0");
            return `${year}-${month}-${day}`;
        });

        dateDisplay.value = formattedDates
            .map((d) => {
                const date = new Date(d);
                return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                });
            })
            .join(", ");

        dateInput.value = JSON.stringify(formattedDates);
    } else {
        dateDisplay.value = "";
        dateInput.value = "";
    }

    // Initialize date picker
    initializeShiftDatePicker();

    // Show modal
    const modal = new bootstrap.Modal(
        document.getElementById("editShiftModal")
    );
    modal.show();
}

// Save shift changes via AJAX
async function saveShiftChanges() {
    const form = document.getElementById("editShiftForm");
    const formData = new FormData(form);

    const dateShiftData = formData.get("date_shift");
    let dateShifts = [];

    try {
        dateShifts = JSON.parse(dateShiftData);
    } catch (e) {
        dateShifts = [dateShiftData];
    }

    // Validate required fields
    const timeStart = formData.get("time_start");
    const timeEnd = formData.get("time_end");
    const employeeId = formData.get("employee_id");

    if (
        !dateShifts ||
        dateShifts.length === 0 ||
        !timeStart ||
        !timeEnd ||
        !employeeId
    ) {
        alert("Please fill all required fields");
        return;
    }

    // Parse time and calculate duration
    const startDate = new Date(`1970-01-01T${timeStart}:00`);
    let endDate = new Date(`1970-01-01T${timeEnd}:00`);

    if (endDate <= startDate) {
        // Overnight shift: add 1 day to end time
        endDate.setDate(endDate.getDate() + 1);
    }

    const durationHours = (endDate - startDate) / (1000 * 60 * 60);
    if (durationHours <= 0) {
        alert("Invalid time range");
        return;
    }

    // Format dates to YYYY-MM-DD
    const formattedDates = dateShifts.map((date) => {
        if (typeof date === "string") {
            if (date.match(/^\d{4}-\d{2}-\d{2}$/)) return date;
            const parsedDate = new Date(date);
            const year = parsedDate.getFullYear();
            const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
            const day = String(parsedDate.getDate()).padStart(2, "0");
            return `${year}-${month}-${day}`;
        } else if (date instanceof Date) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            return `${year}-${month}-${day}`;
        }
        return date;
    });

    try {
        const basePath =
            window.location.pathname.split("/").slice(0, -1).join("/") || "";
        const endpoint = `${basePath}/shift/update/${employeeId}`;

        const response = await fetch(endpoint, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-TOKEN": document.querySelector(
                    'meta[name="csrf-token"]'
                ).content,
            },
            body: JSON.stringify({
                employee_id: employeeId,
                date_shifts: formattedDates,
                time_start: timeStart,
                time_end: timeEnd,
            }),
        });

        if (!response.ok) {
            showFloatingAlert(
                "Failed to update shift: " + response.statusText,
                "danger"
            );
            return;
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            const text = await response.text();
            showFloatingAlert(
                "Server returned non-JSON response: " + text,
                "danger"
            );
            return;
        }

        const result = await response.json();

        if (result.success) {
            const modal = bootstrap.Modal.getInstance(
                document.getElementById("editShiftModal")
            );
            modal.hide();
            loadEmployeeData();
            showFloatingAlert("Shift updated successfully", "success");
        } else {
            showFloatingAlert(
                "Failed to update shift: " + result.message,
                "danger"
            );
        }
    } catch (error) {
        console.error("Error updating shift:", error);
        showFloatingAlert("Error updating shift: " + error.message, "danger");
    }
}

// Function to show floating alert with SVG icon - same as task.js
function showFloatingAlert(message, type = "success") {
    const alertDiv = document.createElement("div");
    alertDiv.className = `alert alert-${type} d-flex align-items-center task-status-alert`;
    alertDiv.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        opacity: 1;
        transition: opacity 0.5s ease;
    `;

    let iconClass =
        type === "success" ? "check-circle-fill" : "exclamation-triangle-fill";

    alertDiv.innerHTML = `
        <i class="fas ${iconClass} me-2"></i>
        <div>${message}</div>
    `;

    document.body.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.style.opacity = "0";
        setTimeout(() => alertDiv.remove(), 500);
    }, 3000);
}

$(document).ready(function () {
    const today = new Date();
    const month = today.getMonth(); // 0 = Jan
    const year = today.getFullYear();

    // Jumlah hari dalam bulan ini
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Generate header
    let headerRow = $("#shiftHeader");
    for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(year, month, i);
        const isSunday = date.getDay() === 0 ? "sunday" : "";
        headerRow.append(`<th class="${isSunday}">${i}</th>`);
    }

    // Generate body
    let body = $("#shiftBody");
    employees.forEach((emp) => {
        let row = $("<tr></tr>");

        // Kolom employee
        row.append(`
            <td class="sticky-col">
                <div class="d-flex align-items-center gap-2">
                    <img src="${emp.avatar}" class="rounded-circle" alt="avatar">
                    <span>${emp.name}</span>
                </div>
            </td>
        `);

        // Kolom shift per tanggal
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            const isSunday = date.getDay() === 0 ? "sunday" : "";

            let cellContent = "";
            if (emp.shifts[i]) {
                if (emp.shifts[i] === "edit") {
                    cellContent = `
                        <button class="btn btn-sm btn-light">
                            <span class="material-symbols-outlined">edit</span>
                        </button>
                    `;
                } else {
                    cellContent = emp.shifts[i];
                }
            }

            row.append(`<td class="${isSunday}">${cellContent}</td>`);
        }

        body.append(row);
    });
});

const dropdownSelected = document.getElementById("dropdownSelected");
const dropdownList = document.getElementById("dropdownList");
const items = document.querySelectorAll(".dropdown-item");

dropdownSelected.addEventListener("click", () => {
    dropdownList.style.display =
        dropdownList.style.display === "block" ? "none" : "block";
});

items.forEach((item) => {
    item.addEventListener("click", () => {
        dropdownSelected.innerHTML = `
      ${item.querySelector(".title").textContent}
      <span class="time">${item.querySelector(".time").textContent}</span>
      <span class="arrow">▼</span>
    `;
        dropdownList.style.display = "none";
    });
});

document.addEventListener("click", (e) => {
    if (!e.target.closest(".dropdown-container")) {
        dropdownList.style.display = "none";
    }
});
