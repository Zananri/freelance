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

    const startYear = 2022;
    const endYear = currentYear + 50;

    for (let y = startYear; y <= endYear; y++) {
        const option = document.createElement("option");
        option.value = y;
        option.textContent = y;
        if (y === currentYear) option.selected = true;
        yearSelect.appendChild(option);
    }

    yearSelect.onchange = () => {
        currentDate.setFullYear(parseInt(yearSelect.value));
        loadEmployeeData();
    };
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

// Render Table Content
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
    const monthName = new Date(year, month - 1, 1).toLocaleString("en-US", {
        month: "long",
    });
    monthTitle.textContent = `${monthName} ${year}`;

    employees.forEach((employee) => {
        const row = document.createElement("tr");

        // Employee cell
        const employeeCell = createEmployeeCell(employee);
        row.appendChild(employeeCell);

        // Dates cells
        for (let i = 1; i <= daysInMonth; i++) {
            const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(
                i
            ).padStart(2, "0")}`;
            const shift = employee.shifts.find((s) => s.date_shift === dateKey);

            const td = createShiftCell(employee, shift, dateKey);
            row.appendChild(td);
        }

        tableBody.appendChild(row);
    });
}

function createEmployeeCell(employee) {
    const td = document.createElement("td");
    td.classList.add("sticky-col");

    td.innerHTML = `
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
                <button class="btn-edit-employee"
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

    const overlayEmp = td.querySelector(".overlay-edit-employee");
    td.addEventListener(
        "mouseenter",
        () => (overlayEmp.style.display = "flex")
    );
    td.addEventListener(
        "mouseleave",
        () => (overlayEmp.style.display = "none")
    );

    const editBtn = td.querySelector(".btn-edit-employee");
    editBtn.addEventListener("click", () => setEditEmployeeModal(editBtn));

    return td;
}

function formatTimeWithSpaces(time) {
    if (!time) return "";
    let [h, m] = time.split(":");
    return `${h.padStart(2, "0")} : ${m.padStart(2, "0")}`;
}

function createShiftCell(employee, shift, dateKey) {
    const td = document.createElement("td");
    td.classList.add("shift-cell");
    td.style.position = "relative";

    const day = new Date(dateKey).getDay();
    if (day === 0) td.classList.add("sunday");

    let start = shift ? formatTimeWithSpaces(shift.time_start) : "";
    let end = shift ? formatTimeWithSpaces(shift.time_end) : "";
    let shiftId = shift ? shift.shift_id : "";

    td.innerHTML = `
        <div class="shift-wrapper">
            <span class="shift-text">${
                shift ? `${start || "??"}  ${end || "??"}` : ""
            }</span>
            <div class="overlay-edit">
                <button class="btn-edit-shift"
                        data-shift-id="${shiftId}"
                        data-employee-id="${employee.id}"
                        data-employee-name="${employee.name}"
                        data-employee-picture="${
                            employee.profile_picture ||
                            "/asset/img/default-profile.png"
                        }"
                        data-date="${dateKey}"
                        data-start="${shift?.time_start || ""}"
                        data-end="${shift?.time_end || ""}">
                    <span class="material-symbols-outlined">${"edit"}</span>
                </button>
            </div>
        </div>
    `;

    const overlay = td.querySelector(".overlay-edit");
    const btn = td.querySelector("button");

    td.addEventListener("mouseenter", () => (overlay.style.display = "flex"));
    td.addEventListener("mouseleave", () => (overlay.style.display = "none"));

    if (shift) {
        btn.addEventListener("click", () => setEditShiftModal(btn));
    } else {
        btn.addEventListener("click", () => setAddShiftModal(btn));
    }

    return td;
}

function setEditEmployeeModal(btn) {
    const employeeModalEl = document.getElementById("editEmployeeModal");
    const employeeModal = new bootstrap.Modal(employeeModalEl);

    employeeModalEl.querySelector("#editShiftId").value = "";
    employeeModalEl.querySelector("#editEmployeeId").value =
        btn.dataset.employeeId;
    employeeModalEl.querySelector("#editEmployeeName").value =
        btn.dataset.employeeName;
    employeeModalEl.querySelector("#editEmployeePicture").src =
        btn.dataset.employeePicture;

    employeeModal.show();
}

function setAddShiftModal(btn) {
    const addShiftModalEl = document.getElementById("addShiftModal");
    const addShiftModal = new bootstrap.Modal(addShiftModalEl);

    addShiftModal.getElementById("addEmployeeId").value = btn.dataset.employeeId;
    addShiftModal.getElementById("addDateShift").value = btn.dataset.date;
    addShiftModal.querySelector("#editEmployeePicture").src =
        btn.dataset.employeePicture;

    addShiftModal.getElementById("addTimeStart").value = "";
    addShiftModal.("addTimeEnd").value = "";

    addShiftModal.show();
}

function setEditShiftModal(btn) {
    const shiftModalEl = document.getElementById("editShiftModal");
    const shiftModal = new bootstrap.Modal(shiftModalEl);

    shiftModalEl.querySelector("#editShiftId").value = btn.dataset.shiftId;
    shiftModalEl.querySelector("#editEmployeeId").value =
        btn.dataset.employeeId;
    shiftModalEl.querySelector("#editShiftEmployeeName").textContent =
        btn.dataset.employeeName;
    shiftModalEl.querySelector("#editEmployeePicture").src =
        btn.dataset.employeePicture;

    // FIX: set ke input juga biar muncul
    shiftModalEl.querySelector("#editTimeStart").value = btn.dataset.start;
    shiftModalEl.querySelector("#editTimeEnd").value = btn.dataset.end;

    shiftModalEl.querySelector("#editTimeStartDisplay").textContent =
        btn.dataset.start || "--";
    shiftModalEl.querySelector("#editTimeEndDisplay").textContent =
        btn.dataset.end || "--";

    let rawDate = btn.dataset.date;
    if (rawDate) {
        const dateObj = new Date(rawDate);
        const formattedDate = dateObj.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
            day: "numeric",
        });

        shiftModalEl.querySelector("#editDateShiftDisplayText").textContent =
            formattedDate;
        shiftModalEl.querySelector("#editDateShift").value = rawDate;
    }

    shiftModalEl.querySelector("#editEmployeePicture").src =
        btn.dataset.employeePicture;

    shiftModal.show();
}

function shiftConfigModal(btn) {
    const addShiftModalEl = document.getElementById("shiftConfigModal");
    const addShiftModal = new bootstrap.Modal(addShiftModalEl);

    addShiftModal.show();
}

document.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
        const row = btn.closest("tr");
        const titleCell = row.querySelector('[data-field="title"]');
        const timeCell = row.querySelector('[data-field="time"]');
        const saveBtn = row.querySelector(".save-btn");

        // ubah cell jadi input
        const currentTitle = titleCell.textContent.trim();
        const currentTime = timeCell.textContent.trim();

        titleCell.innerHTML = `<input type="text" class="form-control form-control-sm" value="${currentTitle}">`;

        const [timeIn, timeOut] = currentTime.split(" - ");
        timeCell.innerHTML = `
      <div class="d-flex gap-1">
        <input type="time" class="form-control form-control-sm" value="${timeIn}">
        <input type="time" class="form-control form-control-sm" value="${timeOut}">
      </div>
    `;

        // toggle tombol
        btn.classList.add("d-none");
        saveBtn.classList.remove("d-none");
    });
});

// Edit Shift Column
document.querySelectorAll(".save-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
        const row = btn.closest("tr");
        const titleCell = row.querySelector('[data-field="title"]');
        const timeCell = row.querySelector('[data-field="time"]');
        const editBtn = row.querySelector(".edit-btn");

        const newTitle = titleCell.querySelector("input").value;
        const inputs = timeCell.querySelectorAll("input");
        const newTime = `${inputs[0].value} - ${inputs[1].value}`;

        titleCell.textContent = newTitle;
        timeCell.textContent = newTime;

        btn.classList.add("d-none");
        editBtn.classList.remove("d-none");

        console.log("Updated:", { newTitle, newTime });
    });
});

loadEmployeeData();

// Function to render error message
function renderError(message) {
    const tableBody = document.getElementById("shiftTableBody");
    if (tableBody) {
        tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">${message}</td></tr>`;
    }
}

// Setup event listeners for edit buttons
function setupEventListeners() {
    // Save shift button for Add Shift Modal
    document
        .getElementById("saveShiftBtn")
        .addEventListener("click", saveNewShift);
}

// Save new shift (for Add Shift Modal)
async function saveNewShift() {
    const form = document.getElementById("addShiftForm");
    const formData = new FormData(form);

    // Validate required fields
    const title = formData.get("title");
    const timeStart = formData.get("time_start");
    const timeEnd = formData.get("time_end");

    if (!title || !timeStart || !timeEnd) {
        alert("Please fill all required fields");
        return;
    }

    try {
        const basePath =
            window.location.pathname.split("/").slice(0, -1).join("/") || "";
        const endpoint = `${basePath}/shift/store`;

        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-TOKEN": document.querySelector(
                    'meta[name="csrf-token"]'
                ).content,
            },
            body: JSON.stringify({
                title: title,
                description: formData.get("description") || "",
                time_start: timeStart,
                time_end: timeEnd,
            }),
        });

        if (!response.ok) {
            showFloatingAlert(
                "Failed to create shift: " + response.statusText,
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
                document.getElementById("addShiftModal")
            );
            modal.hide();

            // Reset form
            form.reset();

            showFloatingAlert("Shift created successfully", "success");

            // Optionally reload data or update UI
            loadEmployeeData();
        } else {
            showFloatingAlert(
                "Failed to create shift: " + result.message,
                "danger"
            );
        }
    } catch (error) {
        console.error("Error creating shift:", error);
        showFloatingAlert("Error creating shift: " + error.message, "danger");
    }
}

// Initialize date picker for shift dates
// let selectedShiftDates = [];

// function initializeShiftDatePicker() {
//     const dateDisplay = document.getElementById("editDateShiftDisplay");
//     const dateInput = document.getElementById("editDateShift");

//     if (!dateDisplay || !dateInput) return;

//     // Create datepicker container
//     const datepickerContainer = document.createElement("div");
//     datepickerContainer.id = "shift-datepicker";
//     datepickerContainer.className = "datepicker-container";
//     datepickerContainer.style.cssText = `
//         position: absolute;
//         background: white;
//         border: 1px solid #ddd;
//         border-radius: 8px;
//         box-shadow: 0 4px 8px rgba(0,0,0,0.1);
//         padding: 10px;
//         z-index: 1000;
//         display: none;
//         max-width: 300px;
//     `;

//     dateDisplay.parentNode.style.position = "relative";
//     dateDisplay.parentNode.appendChild(datepickerContainer);

//     // Create calendar
//     const calendar = document.createElement("div");
//     calendar.className = "calendar-grid";
//     calendar.style.cssText = `
//         display: grid;
//         grid-template-columns: repeat(7, 1fr);
//         gap: 2px;
//         font-size: 12px;
//     `;

//     // Header
//     const header = document.createElement("div");
//     header.style.cssText =
//         "grid-column: span 7; display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;";
//     header.innerHTML = `
//         <button type="button" class="btn-prev-month" style="border: none; background: none; cursor: pointer;"><</button>
//         <span class="month-year"></span>
//         <button type="button" class="btn-next-month" style="border: none; background: none; cursor: pointer;">></button>
//     `;

//     // Weekday headers
//     const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
//     weekdays.forEach((day) => {
//         const dayHeader = document.createElement("div");
//         dayHeader.textContent = day;
//         dayHeader.style.cssText =
//             "text-align: center; font-weight: bold; padding: 5px;";
//         calendar.appendChild(dayHeader);
//     });

//     datepickerContainer.appendChild(header);
//     datepickerContainer.appendChild(calendar);

//     let currentDate = new Date();

//     function renderCalendar() {
//         calendar.innerHTML = "";
//         weekdays.forEach((day) => {
//             const dayHeader = document.createElement("div");
//             dayHeader.textContent = day;
//             dayHeader.style.cssText =
//                 "text-align: center; font-weight: bold; padding: 5px;";
//             calendar.appendChild(dayHeader);
//         });

//         const firstDay = new Date(
//             currentDate.getFullYear(),
//             currentDate.getMonth(),
//             1
//         );
//         const lastDay = new Date(
//             currentDate.getFullYear(),
//             currentDate.getMonth() + 1,
//             0
//         );
//         const startDate = new Date(firstDay);
//         startDate.setDate(startDate.getDate() - firstDay.getDay());

//         header.querySelector(".month-year").textContent =
//             currentDate.toLocaleDateString("en-US", {
//                 month: "long",
//                 year: "numeric",
//             });

//         for (let i = 0; i < 42; i++) {
//             const date = new Date(startDate);
//             date.setDate(startDate.getDate() + i);

//             const dayElement = document.createElement("div");
//             dayElement.textContent = date.getDate();
//             dayElement.style.cssText = `
//                 text-align: center;
//                 padding: 8px;
//                 cursor: pointer;
//                 border-radius: 4px;
//                 ${
//                     date.getMonth() !== currentDate.getMonth()
//                         ? "color: #ccc;"
//                         : ""
//                 }
//                 ${
//                     selectedShiftDates.some(
//                         (d) => d.toDateString() === date.toDateString()
//                     )
//                         ? "background: #007bff; color: white;"
//                         : ""
//                 }
//             `;

//             dayElement.addEventListener("click", () => toggleShiftDate(date));
//             calendar.appendChild(dayElement);
//         }
//     }

//     function toggleShiftDate(date) {
//         const index = selectedShiftDates.findIndex(
//             (d) => d.toDateString() === date.toDateString()
//         );
//         if (index > -1) {
//             selectedShiftDates.splice(index, 1);
//         } else {
//             selectedShiftDates.push(new Date(date));
//         }
//         updateDisplay();
//         renderCalendar();
//     }

//     function updateDisplay() {
//         selectedShiftDates.sort((a, b) => a - b);
//         const formattedDates = selectedShiftDates.map((d) => {
//             // Format as YYYY-MM-DD to avoid year issues
//             const year = d.getFullYear();
//             const month = String(d.getMonth() + 1).padStart(2, "0");
//             const day = String(d.getDate()).padStart(2, "0");
//             return `${year}-${month}-${day}`;
//         });

//         dateDisplay.value = formattedDates
//             .map((d) => {
//                 const date = new Date(d);
//                 return date.toLocaleDateString("en-US", {
//                     month: "short",
//                     day: "numeric",
//                 });
//             })
//             .join(", ");

//         dateInput.value = JSON.stringify(formattedDates);
//     }

//     // Event listeners
//     dateDisplay.addEventListener("click", () => {
//         datepickerContainer.style.display =
//             datepickerContainer.style.display === "none" ? "block" : "none";
//         renderCalendar();
//     });

//     header.querySelector(".btn-prev-month").addEventListener("click", () => {
//         currentDate.setMonth(currentDate.getMonth() - 1);
//         renderCalendar();
//     });

//     header.querySelector(".btn-next-month").addEventListener("click", () => {
//         currentDate.setMonth(currentDate.getMonth() + 1);
//         renderCalendar();
//     });

//     // Close datepicker when clicking outside
//     document.addEventListener("click", (e) => {
//         if (
//             !e.target.closest("#shift-datepicker") &&
//             e.target !== dateDisplay
//         ) {
//             datepickerContainer.style.display = "none";
//         }
//     });

//     renderCalendar();
// }

// Save shift changes via AJAX
async function saveShiftChanges() {
    const form = document.getElementById("editShiftForm");
    const formData = new FormData(form);

    // Get selected shift from dropdown (you may need to implement this)
    const selectedShiftId = getSelectedShiftId(); // This function needs to be implemented

    if (!selectedShiftId) {
        alert("Please select a shift");
        return;
    }

    const dateShiftData = formData.get("date");
    let dateShifts = [];

    // Handle single date for edit modal
    if (dateShiftData) {
        dateShifts = [dateShiftData];
    } else {
        alert("Please provide a valid date");
        return;
    }

    // Validate required fields
    const employeeId = formData.get("employee_id");

    if (!employeeId || dateShifts.length === 0) {
        alert("Please fill all required fields");
        return;
    }

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
                date_shifts: dateShifts,
                shift_id: selectedShiftId,
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

// Helper function to get selected shift ID from dropdown
function getSelectedShiftId() {
    // You need to implement this based on your dropdown implementation
    // For now, return a placeholder
    const dropdown = document.getElementById("dropdownSelected");
    return dropdown.dataset.shiftId || null;
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
    const month = today.getMonth();
    const year = today.getFullYear();

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

        row.append(`
            <td class="sticky-col">
                <div class="d-flex align-items-center gap-2">
                    <img src="${emp.avatar}" class="rounded-circle" alt="avatar">
                    <span>${emp.name}</span>
                </div>
            </td>
        `);

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

document.getElementById("search_filter").addEventListener("keyup", function () {
    const filter = this.value.toLowerCase();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();

    const filteredEmployees = employees.filter((emp) => {
        return emp.name.toLowerCase().includes(filter);
    });

    renderEmployeeTable(filteredEmployees, month, year);
});
