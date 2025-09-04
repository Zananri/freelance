// Shift Management JavaScript - Updated to use employee_shifts data
document.addEventListener("DOMContentLoaded", function () {
    loadEmployeeData();
    setupEventListeners();
    // Preload shifts for dropdowns
    ensureShiftsLoaded(true).then((shifts) => {
        populateFilterShiftDropdown(shifts);
    });
});

// Global variables
let currentDate = new Date();
let employees = [];
window.shifts = window.shifts || [];

// Fetch all shifts from backend (cached in window.shifts)
async function ensureShiftsLoaded(force = false) {
    if (!force && Array.isArray(window.shifts) && window.shifts.length > 0)
        return window.shifts;
    try {
        const basePath =
            window.location.pathname.split("/").slice(0, -1).join("/") || "";
        const endpoint = `${basePath}/shift/list`;
        const res = await fetch(endpoint);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (json.success) {
            window.shifts = json.data || [];
        } else {
            window.shifts = [];
        }
    } catch (e) {
        console.error("Failed to load shifts:", e);
        window.shifts = [];
    }
    return window.shifts;
}

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
        console.log(data);

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

// Month Dropdown
function populateMonthDropdown() {
    const monthDropdownMenu = document.getElementById("monthDropdownMenu");
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

    monthDropdownMenu.innerHTML = "";

    monthNames.forEach((name, i) => {
        const li = document.createElement("li");
        const btn = document.createElement("button");
        btn.className = "dropdown-item";
        btn.textContent = `${name}`;
        btn.addEventListener("click", () => {
            currentDate.setMonth(i);
            loadEmployeeData();
        });
        li.appendChild(btn);
        monthDropdownMenu.appendChild(li);
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

populateMonthDropdown();
loadEmployeeData();

// Render header tanggal
function renderHeader(month, year) {
    const headerRow = document.getElementById("shiftTableHeader");
    headerRow.innerHTML = `<th class="sticky-col fw-semiboled">Employee</th>`;

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

    const profile = employee.profile_picture || "/asset/img/default-profile.png";
    // Try to read any available base shift info on employee, otherwise fallback to empty strings
    const baseShift = employee.shift || null;
    const baseTitle = (baseShift && baseShift.title) || employee.shift_title || "";
    const baseStart = (baseShift && baseShift.time_start) || employee.time_start || "";
    const baseEnd = (baseShift && baseShift.time_end) || employee.time_end || "";

    td.innerHTML = `
        <div class="employee-wrapper d-flex align-items-center gap-2">
            <img src="${profile}"
                alt="Profile Picture"
                class="table-image rounded-circle"
                width="28px"
                height="28px" />
            <div>
                <div class="fw-normal" style="font-size: 14px;">${employee.name}</div>
            </div>
            <div class="overlay-edit-employee">
                <button class="btn-edit-employee"
                        data-employee-id="${employee.id || ""}"
                        data-employee-name="${employee.name || ""}"
                        data-employee-picture="${profile}"
                        data-shift-id="${employee.shift_id || ""}"
                        data-start="${baseStart || ""}"
                        data-end="${baseEnd || ""}"
                        data-title="${baseTitle || ""}">
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
                shift
                    ? `<div>${start || "??"}</div><div>${end || "??"}</div>`
                    : ""
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
                    <span class="material-symbols-outlined">edit</span>
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

    employeeModalEl.querySelector("#editShiftId").value = btn.dataset.shiftId;
    employeeModalEl.querySelector("#editEmployeeId").value =
        btn.dataset.employeeId;
    employeeModalEl.querySelector("#editShiftEmployeeName").textContent =
        btn.dataset.employeeName;
    employeeModalEl.querySelector("#editEmployeePicture").src =
        btn.dataset.employeePicture;

    employeeModalEl.querySelector("#editTimeStart").value = btn.dataset.start;
    employeeModalEl.querySelector("#editTimeEnd").value = btn.dataset.end;

    employeeModalEl.querySelector("#editTimeStartDisplay").textContent =
        btn.dataset.start || "--";
    employeeModalEl.querySelector("#editTimeEndDisplay").textContent =
        btn.dataset.end || "--";

    // Set the title display
    employeeModalEl.querySelector("#editTitleShiftDisplay").textContent =
        btn.dataset.title || "--";

    // Populate shift dropdown from backend and preselect current shift
    ensureShiftsLoaded().then((shifts) => {
        try {
            populateEditEmployeeDropdown(
                employeeModalEl,
                shifts,
                btn.dataset.shiftId || null
            );
        } catch (e) {
            console.warn("Could not populate shift dropdown:", e);
        }
        employeeModal.show();
    });
}

function setAddShiftModal(btn) {
    const addShiftModalEl = document.getElementById("addShiftModal");
    const addShiftModal = new bootstrap.Modal(addShiftModalEl);

    addShiftModalEl.querySelector("#addShiftId").value = btn.dataset.shiftId;
    addShiftModalEl.querySelector("#addEmployeeId").value =
        btn.dataset.employeeId;
    addShiftModalEl.querySelector("#addShiftEmployeeName").textContent =
        btn.dataset.employeeName;
    addShiftModalEl.querySelector("#addEmployeePicture").src =
        btn.dataset.employeePicture;

    addShiftModalEl.querySelector("#addTimeStart").value = btn.dataset.start;
    addShiftModalEl.querySelector("#addTimeEnd").value = btn.dataset.end;

    addShiftModalEl.querySelector("#addTimeStartDisplay").textContent =
        btn.dataset.start || "--";
    addShiftModalEl.querySelector("#addTimeEndDisplay").textContent =
        btn.dataset.end || "--";

    let rawDate = btn.dataset.date;
    if (rawDate) {
        const dateObj = new Date(rawDate);

        const day = String(dateObj.getDate()).padStart(2, "0");

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
        const month = monthNames[dateObj.getMonth()];

        const year = dateObj.getFullYear();

        const formattedDate = `${day} ${month} ${year}`;

        addShiftModalEl.querySelector("#addDateShiftDisplayText").textContent =
            formattedDate;
        addShiftModalEl.querySelector("#addDateShift").value = rawDate;
    }

    // Populate shift dropdown from backend and preselect current shift
    ensureShiftsLoaded().then((shifts) => {
        try {
            populateEditShiftDropdown(
                addShiftModalEl,
                shifts,
                btn.dataset.shiftId || null
            );
        } catch (e) {
            console.warn("Could not populate shift dropdown:", e);
        }
        addShiftModal.show();
    });
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

        const day = String(dateObj.getDate()).padStart(2, "0");

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
        const month = monthNames[dateObj.getMonth()];

        const year = dateObj.getFullYear();

        const formattedDate = `${day} ${month} ${year}`;

        shiftModalEl.querySelector("#editDateShiftDisplayText").textContent =
            formattedDate;
        shiftModalEl.querySelector("#editDateShift").value = rawDate;
    }

    // Populate shift dropdown from backend and preselect current shift
    ensureShiftsLoaded().then((shifts) => {
        try {
            populateEditShiftDropdown(
                shiftModalEl,
                shifts,
                btn.dataset.shiftId || null
            );
        } catch (e) {
            console.warn("Could not populate shift dropdown:", e);
        }
        shiftModal.show();
    });
}

function shiftConfigModal(btn) {
    const addShiftModalEl = document.getElementById("shiftConfigModal");
    const addShiftModal = new bootstrap.Modal(addShiftModalEl);
    // Load and render shifts into the config table
    ensureShiftsLoaded().then((shifts) => renderShiftConfigTable(shifts));
    addShiftModal.show();
}

// Inline Edit for Shift Config table (delegated handlers to support re-render)
document.addEventListener("click", async (e) => {
    const editBtn = e.target.closest(".edit-btn");
    const saveBtn = e.target.closest(".save-btn");
    const deleteBtn = e.target.closest(".delete-btn");

    if (editBtn) {
        const row = editBtn.closest("tr");
        const titleCell = row.querySelector('[data-field="title"]');
        const timeCell = row.querySelector('[data-field="time"]');
        const group = timeCell.querySelector(".config-group-icon");
        const timeSpan = group?.querySelector("span");
        const save = row.querySelector(".save-btn");

        const currentTitle = (titleCell.textContent || "").trim();
        const timeText = (timeSpan?.textContent || "").trim();
        const [timeIn = "", timeOut = ""] = timeText.split(" - ");

        // Ensure vertical centering during edit
        row.querySelectorAll("td").forEach((td) => (td.style.verticalAlign = "middle"));

        // Replace title with input container (full width)
        titleCell.innerHTML = `
            <div class="config-title-edit d-flex align-items-center w-100">
                <input type="text" class="form-control form-control-sm w-100 border-0" style="min-width: 0;" value="${currentTitle}">
            </div>`;

        // Build time inputs and replace only the span, keep action buttons intact
    const inputsWrap = document.createElement("div");
    inputsWrap.className = "time-edit d-flex gap-1 align-items-center";
        inputsWrap.style.minHeight = "36px";
        inputsWrap.innerHTML = `
            <input type="time" class="form-control form-control-sm border-0" value="${timeIn}">
            <span class="mx-1">-</span>
            <input type="time" class="form-control form-control-sm border-0" value="${timeOut}">
        `;
        if (timeSpan && timeSpan.parentNode) {
            timeSpan.replaceWith(inputsWrap);
        } else {
            group?.prepend(inputsWrap);
        }

        // Toggle buttons
        editBtn.classList.add("d-none");
        if (save) save.classList.remove("d-none");
    }

    if (saveBtn) {
        const row = saveBtn.closest("tr");
        const shiftId = saveBtn.dataset.shiftId;
        const titleCell = row.querySelector('[data-field="title"]');
        const timeCell = row.querySelector('[data-field="time"]');
        const group = timeCell.querySelector(".config-group-icon");
        const edit = row.querySelector(".edit-btn");

        const titleInput = titleCell.querySelector("input");
        const inputs = group?.querySelectorAll("input[type='time']") || [];
        const newTitle = (titleInput?.value || "").trim();
        const timeStart = inputs[0]?.value || "";
        const timeEnd = inputs[1]?.value || "";

        if (!newTitle || !timeStart || !timeEnd) {
            showFloatingAlert("Please fill all fields (Title, Time In, Time Out)", "warning");
            return;
        }

        try {
            const basePath =
                window.location.pathname.split("/").slice(0, -1).join("/") || "";
            const endpoint = `${basePath}/shift/config/${shiftId}`;
            const res = await fetch(endpoint, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]').content,
                },
                body: JSON.stringify({
                    title: newTitle,
                    description: "",
                    time_start: timeStart,
                    time_end: timeEnd,
                }),
            });

            if (!res.ok) {
                const txt = await res.text();
                showFloatingAlert(`Failed to update shift: ${res.status} ${txt}`, "danger");
                return;
            }
            const json = await res.json();
            if (!json.success) {
                showFloatingAlert(json.message || "Failed to update shift", "danger");
                return;
            }

            // Refresh shifts cache and table
            await ensureShiftsLoaded(true);
            renderShiftConfigTable(window.shifts);
            showFloatingAlert("Shift updated successfully", "success");
        } catch (err) {
            console.error(err);
            showFloatingAlert("Error updating shift", "danger");
        }
    }

    if (deleteBtn) {
        // No change to delete flow here; placeholder if needed later
    }
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
    // Save/Submit button for Add Shift Modal (assign an existing shift to employee/date)
    const addModalBtn = document.getElementById("saveShiftBtn");
    if (addModalBtn) {
        addModalBtn.addEventListener("click", (e) => {
            e.preventDefault();
            assignShiftForEmployee();
        });
    }

    // Save shift button for Add Config Modal (Shift Config > Add)
    const addConfigBtn = document.getElementById("saveShiftConfigBtn");
    if (addConfigBtn) {
        addConfigBtn.addEventListener("click", (e) => {
            e.preventDefault();
            saveNewShift("addShiftConfigForm");
        });
    }

    // Intercept Edit Shift form submit
    const editForm = document.getElementById("editShiftForm");
    if (editForm) {
        editForm.addEventListener("submit", (e) => {
            e.preventDefault();
            saveShiftChanges();
        });
    }

    // When Shift Config modal is opened, load and render shifts
    const shiftConfigEl = document.getElementById("shiftConfigModal");
    if (shiftConfigEl) {
        shiftConfigEl.addEventListener("show.bs.modal", () => {
            ensureShiftsLoaded().then((shifts) =>
                renderShiftConfigTable(shifts)
            );
        });
    }
}

// Assign selected shift to an employee for a specific date (from Add Shift Modal)
async function assignShiftForEmployee() {
    const form = document.getElementById("addShiftForm");
    const formData = new FormData(form);

    // Read selected values populated by dropdown selection
    const shiftId = formData.get("shift_id");
    const employeeId = formData.get("employee_id");
    const date = formData.get("date");

    if (!employeeId || !date || !shiftId) {
        showFloatingAlert("Please fill all required fields", "warning");
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
                date_shifts: [date],
                shift_id: shiftId,
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
            const modalEl = document.getElementById("addShiftModal");
            const modal =
                bootstrap.Modal.getInstance(modalEl) ||
                new bootstrap.Modal(modalEl);
            modal.hide();
            loadEmployeeData();
            showFloatingAlert("Shift updated successfully", "success");
        } else {
            showFloatingAlert(
                "Failed to update shift: " + (result.message || "Unknown error"),
                "danger"
            );
        }
    } catch (error) {
        console.error("Error updating shift:", error);
        showFloatingAlert("Error updating shift: " + error.message, "danger");
    }
}

// Save new shift (for Add Shift Modal)
async function saveNewShift(formId = "addShiftForm") {
    const form = document.getElementById(formId);
    const formData = new FormData(form);

    // Validate required fields
    const title = formData.get("title");
    const timeStart = formData.get("time_start");
    const timeEnd = formData.get("time_end");

    if (!title || !timeStart || !timeEnd) {
        showFloatingAlert("Please fill all required fields", "warning");
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
            // Hide whichever modal is open
            const addCellModalEl = document.getElementById("addShiftModal");
            const addConfigModalEl = document.getElementById("addConfigModal");
            const activeModalEl =
                (addCellModalEl &&
                    addCellModalEl.classList.contains("show") &&
                    addCellModalEl) ||
                (addConfigModalEl &&
                    addConfigModalEl.classList.contains("show") &&
                    addConfigModalEl);

            if (activeModalEl) {
                const modal =
                    bootstrap.Modal.getInstance(activeModalEl) ||
                    new bootstrap.Modal(activeModalEl);
                modal.hide();
            }

            // Reset form
            try {
                form.reset();
            } catch (_) {}

            showFloatingAlert("Shift created successfully", "success");

            // Optionally reload data or update UI
            loadEmployeeData();
            // refresh shifts cache and config table
            await ensureShiftsLoaded(true);
            const tbody = document.getElementById("shiftConfigTableBody");
            if (tbody) renderShiftConfigTable(window.shifts);
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
    const selectedShiftId = getSelectedShiftId();

    if (!selectedShiftId) {
        showFloatingAlert("Please select a shift", "warning");
        return;
    }

    const dateShiftData = formData.get("date");
    let dateShifts = [];

    // Handle single date for edit modal
    if (dateShiftData) {
        dateShifts = [dateShiftData];
    } else {
        showFloatingAlert("Please provide a valid date", "warning");
        return;
    }

    // Validate required fields
    const employeeId = formData.get("employee_id");

    if (!employeeId || dateShifts.length === 0) {
        showFloatingAlert("Please fill all required fields", "warning");
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

function getSelectedShiftId() {
    const input = document.getElementById("editShiftId");
    return input && input.value ? input.value : null;
}

function populateEditShiftDropdown(modalEl, shifts, selectedId = null) {
    if (!modalEl) return;
    const dropdownContainer =
        modalEl.querySelector(".dropdown-container") ||
        modalEl.querySelector(".dropdown");
    if (!dropdownContainer) return;
    const button = dropdownContainer.querySelector(".dropdown-btn");
    const menu = dropdownContainer.querySelector(".dropdown-menu");
    if (!button || !menu) return;

    menu.innerHTML = "";
    if (!Array.isArray(shifts) || shifts.length === 0) {
        const li = document.createElement("li");
        li.innerHTML =
            '<div class="dropdown-item text-muted">No shifts available</div>';
        menu.appendChild(li);
        return;
    }

    const shiftIdInput =
        modalEl.querySelector("#editShiftId") || modalEl.querySelector("#addShiftId");
    const titleDisp =
        modalEl.querySelector("#editTitleShiftDisplay") ||
        modalEl.querySelector("#addTitleShiftDisplay");
    const timeStartDisp =
        modalEl.querySelector("#editTimeStartDisplay") ||
        modalEl.querySelector("#addTimeStartDisplay");
    const timeEndDisp =
        modalEl.querySelector("#editTimeEndDisplay") ||
        modalEl.querySelector("#addTimeEndDisplay");
    const timeStartInput =
        modalEl.querySelector("#editTimeStart") || modalEl.querySelector("#addTimeStart");
    const timeEndInput =
        modalEl.querySelector("#editTimeEnd") || modalEl.querySelector("#addTimeEnd");

    const formatTime = (t) => {
        if (!t) return "--";
        const [h, m] = String(t).split(":");
        return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
    };

    shifts.forEach((s) => {
        const li = document.createElement("li");
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "dropdown-item d-flex justify-content-between";
        btn.dataset.shiftId = s.id;
        btn.dataset.title = s.title || "";
        btn.dataset.timeStart = s.time_start || "";
        btn.dataset.timeEnd = s.time_end || "";
        btn.innerHTML = `<span>${
            s.title || "(No title)"
        }</span><span>${formatTime(s.time_start)} - ${formatTime(
            s.time_end
        )}</span>`;
        btn.addEventListener("click", () => {
            if (shiftIdInput) shiftIdInput.value = s.id;
            if (titleDisp) titleDisp.textContent = s.title || "-";
            if (timeStartDisp) timeStartDisp.textContent = formatTime(s.time_start);
            if (timeEndDisp) timeEndDisp.textContent = formatTime(s.time_end);
            if (timeStartInput) timeStartInput.value = s.time_start || "";
            if (timeEndInput) timeEndInput.value = s.time_end || "";
            button.firstChild &&
                (button.firstChild.textContent = "Select Shift");
            button.click();
        });
        li.appendChild(btn);
        menu.appendChild(li);
    });

    if (selectedId) {
        const sel = shifts.find((x) => String(x.id) === String(selectedId));
        if (sel) {
            if (shiftIdInput) shiftIdInput.value = sel.id;
            if (titleDisp) titleDisp.textContent = sel.title || "-";
            if (timeStartDisp) timeStartDisp.textContent = formatTime(sel.time_start);
            if (timeEndDisp) timeEndDisp.textContent = formatTime(sel.time_end);
            if (timeStartInput) timeStartInput.value = sel.time_start || "";
            if (timeEndInput) timeEndInput.value = sel.time_end || "";
        }
    }
}

function populateFilterShiftDropdown(shifts) {
    const filterShiftDropdown = document.getElementById("filterShift");
    if (!filterShiftDropdown) return;

    filterShiftDropdown.innerHTML = '<option value="">Select Shift</option>';

    shifts.forEach((s) => {
        const option = document.createElement("option");
        option.value = s.id;
        option.textContent = s.title || "(No title)";
        filterShiftDropdown.appendChild(option);
    });
}

function populateEditEmployeeDropdown(modalEl, shifts, selectedId = null) {
    if (!modalEl) return;
    const dropdownContainer = modalEl.querySelector(".dropdown-container");
    if (!dropdownContainer) return;
    const button = dropdownContainer.querySelector(".dropdown-btn");
    const menu = dropdownContainer.querySelector(".dropdown-menu");
    if (!button || !menu) return;

    menu.innerHTML = "";
    if (!Array.isArray(shifts) || shifts.length === 0) {
        const li = document.createElement("li");
        li.innerHTML =
            '<div class="dropdown-item text-muted">No shifts available</div>';
        menu.appendChild(li);
        return;
    }

    const shiftIdInput = modalEl.querySelector("#editShiftId");
    const timeStartInput = modalEl.querySelector("#editTimeStart");
    const timeEndInput = modalEl.querySelector("#editTimeEnd");
    const timeStartDisplay = modalEl.querySelector("#editTimeStartDisplay");
    const timeEndDisplay = modalEl.querySelector("#editTimeEndDisplay");
    const titleDisplay = modalEl.querySelector("#editTitleShiftDisplay");

    const formatTime = (t) => {
        if (!t) return "--";
        const [h, m] = String(t).split(":");
        return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
    };

    shifts.forEach((s) => {
        const li = document.createElement("li");
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "dropdown-item d-flex justify-content-between";
        btn.dataset.shiftId = s.id;
        btn.dataset.timeStart = s.time_start || "";
        btn.dataset.timeEnd = s.time_end || "";
        btn.dataset.title = s.title || "";
        btn.innerHTML = `<span>${
            s.title || "(No title)"
        }</span><span>${formatTime(s.time_start)} - ${formatTime(
            s.time_end
        )}</span>`;
        btn.addEventListener("click", () => {
            if (shiftIdInput) shiftIdInput.value = s.id;
            if (timeStartInput) timeStartInput.value = s.time_start || "";
            if (timeEndInput) timeEndInput.value = s.time_end || "";
            if (timeStartDisplay) timeStartDisplay.textContent = formatTime(s.time_start);
            if (timeEndDisplay) timeEndDisplay.textContent = formatTime(s.time_end);
            if (titleDisplay) titleDisplay.textContent = s.title || "--";
            button.firstChild &&
                (button.firstChild.textContent = "Select Shift");
            button.click();
        });
        li.appendChild(btn);
        menu.appendChild(li);
    });

    if (selectedId) {
        const sel = shifts.find((x) => String(x.id) === String(selectedId));
        if (sel) {
            if (shiftIdInput) shiftIdInput.value = sel.id;
            if (timeStartInput) timeStartInput.value = sel.time_start || "";
            if (timeEndInput) timeEndInput.value = sel.time_end || "";
            if (timeStartDisplay) timeStartDisplay.textContent = formatTime(sel.time_start);
            if (timeEndDisplay) timeEndDisplay.textContent = formatTime(sel.time_end);
            if (titleDisplay) titleDisplay.textContent = sel.title || "--";
        }
    }
}

// Function to show alert using the same component as Settings page
function showFloatingAlert(message, type = "success", delayMs = 3000) {
    // Force using Settings' white-style alert (light) for consistency across Shift
    const mapped = "light";

    // Prefer global showAlertMsg if available (provided by office.js)
    if (typeof window.showAlertMsg === "function") {
        window.showAlertMsg(String(message || ""), mapped, delayMs);
        return;
    }

    // Fallback: try to use the alert container if present
    try {
        if (window.$ && $(".box-alert-messages").length) {
            $(".box-alert-messages .box-message").removeClass("error warning success").addClass(mapped);
            $(".box-alert-messages .message-content").html(String(message || ""));
            $(".box-alert-messages").stop().fadeIn("fast").delay(delayMs).fadeOut("fast");
            return;
        }
    } catch (_) {}

    // Last resort
    try { alert(String(message || "")); } catch (_) { console.log("ALERT:", message); }
}

// Render rows in the Shift Config modal table from shifts array
function renderShiftConfigTable(shifts) {
    const tbody = document.getElementById("shiftConfigTableBody");
    if (!tbody) return;
    const formatTime = (t) => {
        if (!t) return "--";
        const [h, m] = String(t).split(":");
        return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
    };
    tbody.innerHTML = "";
    if (!Array.isArray(shifts) || shifts.length === 0) {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td colspan="2" class="text-center text-muted">No shifts found</td>`;
        tbody.appendChild(tr);
        return;
    }
    shifts.forEach((s) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td data-field="title">${s.title || "(No title)"}</td>
            <td data-field="time">
                <div class="d-flex justify-content-between align-items-center config-group-icon">
                    <span>${formatTime(s.time_start)} - ${formatTime(
            s.time_end
        )}</span>
                    <div class="d-flex">
                        <button class="btn btn-sm edit-btn" data-shift-id="${
                            s.id
                        }">
                            <span class="material-symbols-outlined">edit</span>
                        </button>
                        <button class="btn btn-sm save-btn d-none" data-shift-id="${
                            s.id
                        }">
                            <span class="material-symbols-outlined">check</span>
                        </button>
                        <button class="btn btn-sm delete-btn" data-shift-id="${
                            s.id
                        }">
                            <span class="material-symbols-outlined">delete</span>
                        </button>
                    </div>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
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

document.getElementById("search_filter").addEventListener("keyup", function () {
    const filter = this.value.toLowerCase();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();

    const filteredEmployees = employees.filter((emp) => {
        return emp.name.toLowerCase().includes(filter);
    });

    renderEmployeeTable(filteredEmployees, month, year);
});
