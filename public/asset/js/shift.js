// Shift Management JavaScript - Updated to use employee_shifts data
// Base URL helpers to ensure correct absolute paths for assets and file links
const __deriveBaseFromPath = () => {
    try {
        const seg = window.location.pathname.split('/').filter(Boolean)[0] || '';
        return seg ? (window.location.origin + '/' + seg) : window.location.origin;
    } catch (e) { return window.location.origin; }
};
const __metaAppUrl = (document.querySelector('meta[name="app-url"]')?.getAttribute('content') || '').replace(/\/+$/,'');
const APP_URL = __metaAppUrl || __deriveBaseFromPath();
const DEFAULT_AVATAR = APP_URL + '/asset/img/avatar.png';
function toAbsoluteUrl(p){
    const raw = (p == null ? '' : String(p));
    if (!raw) return DEFAULT_AVATAR;
    // absolute (http, https, protocol-relative)
    if (/^(https?:)?\/\//i.test(raw)) return raw;
    // strip leading slashes to avoid root-relative paths that drop subpath
    const cleaned = raw.replace(/^\/+/, '');
    return APP_URL + '/' + cleaned;
}
document.addEventListener("DOMContentLoaded", function () {
    loadEmployeeData();
    setupEventListeners();
    // Preload shifts for dropdowns
    ensureShiftsLoaded(true).then((shifts) => {
        populateFilterShiftDropdown(shifts);
    });
    // Load departments for filter dropdown
    loadDepartments();
});

// Populate filterDepartment dropdown
function populateFilterDepartmentDropdown(departments) {
    const filterDepartmentDropdown = document.getElementById("filterDepartment");
    if (!filterDepartmentDropdown) return;

    filterDepartmentDropdown.innerHTML = '<option value="">Select Department</option>';

    departments.forEach((d) => {
        const option = document.createElement("option");
        option.value = d.id;
        option.textContent = d.name_department || "(No name)";
        filterDepartmentDropdown.appendChild(option);
    });
}

const filterDepartmentSelect = document.getElementById("filterDepartment");
const filterDivisionSelect = document.getElementById("filterDivision");

// Load departments for filter select
function loadDepartments() {
    $.ajax({
        url: $('meta[name="app-url"]').attr('content') + "/department/index",
        method: "GET",
        dataType: "json",
        success: function (response) {
            const data = response.data || response;
            filterDepartmentSelect.innerHTML =
                '<option value="">Department</option>';
            data.forEach((dept) => {
                const option = document.createElement("option");
                option.value = dept.id;
                option.textContent = dept.name_department;
                filterDepartmentSelect.appendChild(option);
            });
            filterDivisionSelect.innerHTML =
                '<option value="">Division</option>';
            filterDivisionSelect.disabled = true;
        },
        error: function () {
            showFloatingAlert("Failed to load departments.", 'warning', 3000);
        },
    });
}

loadDepartments();

// Populate filterDivision dropdown
function populateFilterDivisionDropdown(divisions) {
    const filterDivisionDropdown = document.getElementById("filterDivision");
    if (!filterDivisionDropdown) return;

    filterDivisionDropdown.innerHTML = '<option value="">Select Division</option>';

    divisions.forEach((d) => {
        const option = document.createElement("option");
        option.value = d.id;
        option.textContent = d.name_division || "(No name)";
        filterDivisionDropdown.appendChild(option);
    });

    filterDivisionDropdown.disabled = false;
}

// Load divisions data based on department and populate filterDivision dropdown
async function loadDivisions(departmentId) {
    try {
        const basePath = window.location.pathname.split("/").slice(0, -1).join("/") || "";
        const endpoint = `${basePath}/divisions-for-projects?department_id=${departmentId}`;

        const res = await fetch(endpoint);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        if (json.status === 'success' && Array.isArray(json.data)) {
            populateFilterDivisionDropdown(json.data);
        } else {
            console.warn("Failed to load divisions data");
            // Clear division dropdown
            const filterDivision = document.getElementById("filterDivision");
            if (filterDivision) {
                filterDivision.innerHTML = '<option value="">Select Division</option>';
                filterDivision.disabled = true;
                filterDivision.value = '';
            }
        }
    } catch (e) {
        console.error("Error loading divisions:", e);
        // Clear division dropdown on error
        const filterDivision = document.getElementById("filterDivision");
        if (filterDivision) {
            filterDivision.innerHTML = '<option value="">Select Division</option>';
            filterDivision.disabled = true;
            filterDivision.value = '';
        }
    }
}

// Global variables
let currentDate = new Date();
let employees = [];
window.shifts = window.shifts || [];
// Global variable untuk menyimpan filter saat ini
let currentFilters = {
    department: '',
    division: '',
    shift: '',
    search: ''
};

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
async function loadEmployeeData(filters = {}) {
    try {
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();

        const basePath =
            window.location.pathname.split("/").slice(0, -1).join("/") || "";
        let endpoint = `${basePath}/shift/employees-basic?month=${month}&year=${year}`;

        // Merge current filters with new filters
        currentFilters = { ...currentFilters, ...filters };

        // Add filter parameters if provided
        if (currentFilters.department) {
            endpoint += `&department=${encodeURIComponent(currentFilters.department)}`;
        }
        if (currentFilters.division) {
            endpoint += `&division=${encodeURIComponent(currentFilters.division)}`;
        }
        if (currentFilters.shift) {
            endpoint += `&shift=${encodeURIComponent(currentFilters.shift)}`;
        }
        if (currentFilters.search) {
            endpoint += `&search=${encodeURIComponent(currentFilters.search)}`;
        }

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

    if (monthDropdownMenu) {
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
}

// Modal Month Dropdown
function populateMonthDropdownModal() {
    const monthDropdownMenuModal = document.getElementById("monthDropdownMenuModal");
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

    if (monthDropdownMenuModal) {
        monthDropdownMenuModal.innerHTML = "";

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
            monthDropdownMenuModal.appendChild(li);
        });
    }
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

// When global profile picture updated, reload employee data to refresh table avatars
window.addEventListener('profilePictureUpdated', function(){
    try { loadEmployeeData(); } catch(e) { console.warn('Failed to refresh shift employee data after avatar update', e); }
});

// Render header tanggal
function renderHeader(month, year) {
    const headerRow = document.getElementById("shiftTableHeader");

    // Render main table header
    if (headerRow) {
        headerRow.innerHTML = `<th class="sticky-col fw-semiboled text-center">Employee</th>`;
        const daysInMonth = new Date(year, month, 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) {
            const th = document.createElement("th");
            const day = new Date(year, month - 1, i).getDay();
            th.textContent = i;
            if (day === 0) th.classList.add("sunday");
            headerRow.appendChild(th);
        }
    }
}

// Render Table Content
function renderEmployeeTable(employees, month, year) {
    const tableBody = document.getElementById("shiftTableBody");
    const monthTitle = document.getElementById("shiftMonthTitle");

    // Render main table body
    if (tableBody) {
        tableBody.innerHTML = "";

        if (!employees || employees.length === 0) {
            tableBody.innerHTML =
                '<tr><td colspan="32" class="text-center">No employees found</td></tr>';
        } else {
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
    }
}

function createEmployeeCell(employee) {
    const td = document.createElement("td");
    td.classList.add("sticky-col");

    // Sesuai kebutuhan: di halaman Shift, pakai foto khusus employee (field `photo`), bukan profile_picture
    let profile = toAbsoluteUrl(employee.photo || 'asset/img/avatar.png');
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

// Normalize any time string into HH:MM (24h) to satisfy backend validation (format H:i)
function toHHMM(t) {
    if (!t || typeof t !== "string") return "";
    const s = t.trim();
    // Accept forms like HH:MM, HH:MM:SS, HH : MM, H:MM
    const parts = s.split(":").map((x) => x.trim());
    if (parts.length >= 2) {
        let h = parts[0] || "0";
        let m = parts[1] || "0";
        // Zero-pad
        h = String(parseInt(h, 10)).padStart(2, "0");
        m = String(parseInt(m, 10)).padStart(2, "0");
        return `${h}:${m}`;
    }
    // Fallback: try regex to extract numbers
    const mrx = s.match(/(\d{1,2}).?(\d{2})/);
    if (mrx) {
        const h = String(parseInt(mrx[1], 10)).padStart(2, "0");
        const m = String(parseInt(mrx[2], 10)).padStart(2, "0");
        return `${h}:${m}`;
    }
    return "";
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
                        data-employee-picture="${toAbsoluteUrl(employee.photo || 'asset/img/avatar.png')}"
                        data-date="${dateKey}"
                        data-start="${shift?.time_start || ""}"
                        data-end="${shift?.time_end || ""}"
                        data-checkpoints='${JSON.stringify(shift?.checkpoint_times || [])}'
                        data-total-check="${shift?.total_checkpoint || ""}">
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

            let checkpoints = btn.dataset.checkpoints || "[]";

            try {
                checkpoints = JSON.parse(checkpoints);

                if (typeof checkpoints === "string") {
                    checkpoints = JSON.parse(checkpoints);
                }

                if (!Array.isArray(checkpoints)) {
                    checkpoints = [];
                }
            } catch (e) {
                checkpoints = [];
            }

            console.log(checkpoints);
            console.log(Array.isArray(checkpoints));

            renderTimeline(
                btn.dataset.start,
                checkpoints,
                btn.dataset.end
            );
        } catch (e) {
            console.warn("Could not populate shift dropdown:", e);
        }
        shiftModal.show();
    });
}

function renderTimeline(start, checkpoints, end) {

    let html = `
        <div class="timeline-item">

            <div class="timeline-dot success"></div>
            <span style="font-size: 10px;">Check In</span>
            <span class="timeline-time">${start}</span>

            <div class="timeline-line"></div>

        </div>
    `;

    checkpoints.forEach((time,index)=>{
        html+=`
            <div class="timeline-item">

                <div class="timeline-dot success"></div>

                <span style="font-size: 10px;">Checkpoint ${index+1}</span>

                <span class="timeline-time">${time}</span>

                <div class="timeline-line"></div>

            </div>
        `;

    });

    html+=`
        <div class="timeline-item">

            <div class="timeline-dot danger"></div>

            <span style="font-size: 10px;">Check Out</span>

            <span class="timeline-time">${end}</span>

        </div>
    `;

    $("#shiftTimeline").html(html);

    $("#editCheckpointCount").text(
        `${checkpoints.length} Point${checkpoints.length>1?"s":""}`
    );

}

function renderShiftConfigTable(shifts) {
    const tbody = document.getElementById("shiftConfigTableBody");
    if (!tbody) return;

    const formatTime = t => {
        if (!t) return "--";
        const [h, m] = String(t).split(":");
        return `${h.padStart(2,"0")}:${m.padStart(2,"0")}`;
    };

    tbody.innerHTML = "";
    if (!Array.isArray(shifts) || shifts.length === 0) {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td colspan="3" class="text-center text-muted">No shifts found</td>`;
        tbody.appendChild(tr);
        return;
    }

    shifts.forEach(s => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td data-field="title">${s.title || "(No title)"}</td>
            <td data-field="description">${s.description || ""}</td>
            <td data-field="time">${formatTime(s.time_start || "")}</td>
            <td data-field="time">${formatTime(s.time_end || "")}</td>
            <td data-field="checkpoint">${s.total_checkpoint}</td>
            <td>
                <div class="d-flex justify-content-between align-items-center config-group-icon">
                    <div class="d-flex">
                        <button class="btn btn-sm edit-btn"
                            data-shift-id="${s.id}"
                            data-title="${s.title || ""}"
                            data-description="${s.description || ""}"
                            data-start="${s.time_start || ""}"
                            data-end="${s.time_end || ""}"
                            data-checkpoints='${JSON.stringify(s.checkpoint_times || [])}'>
                            <span class="material-symbols-outlined">edit</span>
                        </button>

                        <button class="btn btn-sm delete-btn"
                            data-shift-id="${s.id}"
                            data-title="${s.title || ""}"
                            data-start="${s.time_start || ""}"
                            data-end="${s.time_end || ""}">
                            <span class="material-symbols-outlined">delete</span>
                        </button>
                    </div>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function shiftConfigModal(btn) {
    const addShiftModalEl = document.getElementById("shiftConfigModal");
    const addShiftModal = new bootstrap.Modal(addShiftModalEl);
    ensureShiftsLoaded(true).then((shifts) => {
        // Filter out deleted shifts and render table
        const activeShifts = shifts.filter(s => !s.deleted_by);
        renderShiftConfigTable(activeShifts);
    });
    addShiftModal.show();
}

document.addEventListener("click", async (e) => {
    const editBtn = e.target.closest(".edit-btn");
    const deleteBtn = e.target.closest(".delete-btn");

    if (editBtn) {
        const modalEl = document.getElementById("editConfigModal");
        const modal = new bootstrap.Modal(modalEl);

        modalEl.querySelector("#editConfigShiftId").value = editBtn.dataset.shiftId || "";
        modalEl.querySelector("#editTitle").value = editBtn.dataset.title || "";
        modalEl.querySelector("#editDescription").value = editBtn.dataset.description || "";
    // Ensure inputs are in HH:MM (backend expects H:i)
    modalEl.querySelector("#editTimeStart").value = toHHMM(editBtn.dataset.start || "");
    modalEl.querySelector("#editTimeEnd").value = toHHMM(editBtn.dataset.end || "");

        // Load existing checkpoints into edit modal
        resetCheckpoint("#checkpointContainerEdit");
        let checkpoints = editBtn.dataset.checkpoints || "[]";
        try {
            checkpoints = JSON.parse(checkpoints);
            if (typeof checkpoints === "string") checkpoints = JSON.parse(checkpoints);
            if (!Array.isArray(checkpoints)) checkpoints = [];
        } catch (e) {
            checkpoints = [];
        }
        const $editModalBody = $(modalEl).find(".modal-body");
        checkpoints.forEach(function(time) {
            if (time) {
                const container = $editModalBody.find(".checkpoint-wrapper");
                const items = container.find(".checkpoint-item");
                const index = items.length + 1;
                container.append(`
                    <div class="row align-items-center mb-2 checkpoint-item">
                        <div class="col-3">
                            <small class="fw-semibold">Checkpoint ${index}</small>
                        </div>
                        <div class="col-8">
                            <input type="time" class="form-control border-0 checkpoint-time" name="checkpoints[]" value="${time}">
                        </div>
                        <div class="col-1 text-end">
                            <button type="button" class="btn btn-sm btn-link text-dark removeCheckpoint">
                                <span class="material-symbols-outlined">close</span>
                            </button>
                        </div>
                    </div>
                `);
            }
        });

        modal.show();
    }

    if (deleteBtn) {
        const shiftId = deleteBtn.dataset.shiftId;
        const shiftTitle = deleteBtn.dataset.title || "Shift";
        const shiftStart = deleteBtn.dataset.start || "";
        const shiftEnd = deleteBtn.dataset.end || "";

        // Close shift config modal first
        const shiftConfigModalEl = document.getElementById("shiftConfigModal");
        const shiftConfigModal = bootstrap.Modal.getInstance(shiftConfigModalEl);
        if (shiftConfigModal) {
            shiftConfigModal.hide();
        }

        // Show delete confirmation modal
        const deleteModalEl = document.getElementById("deleteConfigModal");
        const deleteModal = new bootstrap.Modal(deleteModalEl);

        // Populate modal with shift details
        deleteModalEl.querySelector("#deleteConfigShiftId").value = shiftId;
        deleteModalEl.querySelector("#deleteShiftTitle").textContent = shiftTitle;

        const formatTime = (t) => {
            if (!t) return "--";
            const [h, m] = String(t).split(":");
            return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
        };

        deleteModalEl.querySelector("#deleteShiftTime").textContent =
            `Time: ${formatTime(shiftStart)} - ${formatTime(shiftEnd)}`;

        deleteModal.show();
    }
});

document.getElementById("saveUpdateShiftConfigBtn").addEventListener("click", async () => {
    const modalEl = document.getElementById("editConfigModal");
    const shiftId = modalEl.querySelector("#editConfigShiftId").value;
    const title = modalEl.querySelector("#editTitle").value.trim();
    const description = modalEl.querySelector("#editDescription").value.trim();
    const timeStart = toHHMM(modalEl.querySelector("#editTimeStart").value);
    const timeEnd = toHHMM(modalEl.querySelector("#editTimeEnd").value);

    const checkpoints = [];
    $(modalEl).find(".checkpoint-time").each(function () {
        if ($(this).val()) {
            checkpoints.push($(this).val());
        }
    });

    if (!title || !timeStart || !timeEnd) {
        showFloatingAlert("Please fill all required fields", "warning");
        return;
    }

    try {
        const basePath = window.location.pathname.split("/").slice(0, -1).join("/") || "";
        const endpoint = `${basePath}/shift/config/${shiftId}`;

        const res = await fetch(endpoint, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]').content,
            },
            body: JSON.stringify({ title, description, time_start: timeStart, time_end: timeEnd, checkpoints }),
        });

        // Handle validation errors (e.g., 422) gracefully
        if (!res.ok) {
            let message = `Failed to update shift (${res.status})`;
            try {
                const ctype = res.headers.get("content-type") || "";
                if (ctype.includes("application/json")) {
                    const errJson = await res.json();
                    // Laravel validation often returns { message, errors: {field: [msg]} }
                    if (errJson && errJson.errors) {
                        const firstKey = Object.keys(errJson.errors)[0];
                        if (firstKey && Array.isArray(errJson.errors[firstKey])) {
                            message = errJson.errors[firstKey][0] || message;
                        }
                    } else if (errJson && errJson.message) {
                        message = errJson.message;
                    }
                } else {
                    const txt = await res.text();
                    if (txt) message = txt;
                }
            } catch (_) {}
            showFloatingAlert(message, "danger");
            return;
        }

        const json = await res.json();
        if (!json.success) {
            showFloatingAlert(json.message || "Failed to update shift", "danger");
            return;
        }

        await ensureShiftsLoaded(true);
        renderShiftConfigTable(window.shifts);
        showFloatingAlert("Shift updated successfully", "success");

        bootstrap.Modal.getInstance(modalEl).hide();
    } catch (err) {
        console.error(err);
        showFloatingAlert("Error updating shift", "danger");
    }
});

// Event listener for confirm delete button in delete modal
document.getElementById("confirmDeleteShiftConfigBtn").addEventListener("click", async () => {
    const deleteModalEl = document.getElementById("deleteConfigModal");
    const shiftId = deleteModalEl.querySelector("#deleteConfigShiftId").value;

    if (!shiftId) {
        showFloatingAlert("Shift ID not found", "danger");
        return;
    }

    const userId = document.querySelector('meta[name="user-id"]').content || null;

    if (!userId) {
        showFloatingAlert("User ID not found. Please login again.", "danger");
        return;
    }

    const basePath = window.location.pathname.split("/").slice(0, -1).join("/") || "";
    try {
        const res = await fetch(`${basePath}/shift/${shiftId}/soft-delete`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]').content,
            },
            body: JSON.stringify({ deleted_by: userId }),
        });

        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            const text = await res.text();
            throw new Error("Server returned non-JSON response: " + text);
        }

        const json = await res.json();
        if (!json.success) {
            showFloatingAlert(json.message || "Failed to delete shift", "danger");
            return;
        }

        // Update local shifts array
        window.shifts = window.shifts.map(s => {
            if (s.id == shiftId) s.deleted_by = userId;
            return s;
        });

        // Re-render table without deleted shifts
        const activeShifts = window.shifts.filter(s => !s.deleted_by);
        renderShiftConfigTable(activeShifts);

        // Also refresh the filter shift dropdown with updated data
        populateFilterShiftDropdown(activeShifts);

        showFloatingAlert("Shift deleted successfully", "success");

        // Set flag to prevent re-opening config modal after successful delete
        deleteModalEl.setAttribute('data-delete-success', 'true');

        // Hide delete modal
        bootstrap.Modal.getInstance(deleteModalEl).hide();

    } catch (err) {
        console.error(err);
        showFloatingAlert("Error deleting shift: " + err.message, "danger");
    }
});

// Event listeners for delete modal hide/close events
const deleteConfigModal = document.getElementById("deleteConfigModal");
if (deleteConfigModal) {
    deleteConfigModal.addEventListener('hidden.bs.modal', function () {
        // Check if delete was successful - if so, don't re-open config modal
        const deleteSuccess = this.getAttribute('data-delete-success');

        if (deleteSuccess === 'true') {
            // Remove the flag and don't re-open config modal
            this.removeAttribute('data-delete-success');
            return;
        }

        // Re-open shift config modal when delete modal is closed (cancelled)
        const shiftConfigModalEl = document.getElementById("shiftConfigModal");
        if (shiftConfigModalEl) {
            const shiftConfigModal = new bootstrap.Modal(shiftConfigModalEl);
            shiftConfigModal.show();
        }
    });
}

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

    // Save Employee Base Shift button
    const saveEmployeeBtn = document.getElementById("saveEmployeeBtn");
    if (saveEmployeeBtn) {
        saveEmployeeBtn.addEventListener("click", (e) => {
            e.preventDefault();
            saveEmployeeBaseShiftFromShiftPage();
        });
    }

    // When Shift Config modal is opened, load and render shifts
    const shiftConfigEl = document.getElementById("shiftConfigModal");
    if (shiftConfigEl) {
        shiftConfigEl.addEventListener("show.bs.modal", () => {
            ensureShiftsLoaded(true).then((shifts) => {
                // Filter out deleted shifts and render table
                const activeShifts = shifts.filter(s => !s.deleted_by);
                renderShiftConfigTable(activeShifts);
            });
        });
    }

    // Reset checkpoint container when add config modal opens
    const addConfigEl = document.getElementById("addConfigModal");
    if (addConfigEl) {
        addConfigEl.addEventListener("show.bs.modal", function () {
            resetCheckpoint("#checkpointContainerAdd");
        });
    }

    // Reset checkpoint container when edit config modal opens
    const editConfigEl = document.getElementById("editConfigModal");
    if (editConfigEl) {
        editConfigEl.addEventListener("show.bs.modal", function () {
            // Reset is done in the click handler after data loads,
            // but ensure clean state on show
        });
    }

    // Modal navigation buttons
    const prevMonthBtnModal = document.getElementById("prevMonthBtnModal");
    if (prevMonthBtnModal) {
        prevMonthBtnModal.addEventListener("click", () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            loadEmployeeData();
        });
    }

    const nextMonthBtnModal = document.getElementById("nextMonthBtnModal");
    if (nextMonthBtnModal) {
        nextMonthBtnModal.addEventListener("click", () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            loadEmployeeData();
        });
    }

    // Modal month dropdown
    const monthDropdownBtnModal = document.getElementById("monthDropdownBtnModal");
    if (monthDropdownBtnModal) {
        populateMonthDropdownModal();
    }

    // Filter event listeners
    const applyFilterBtn = document.getElementById("applyFilterBtn");
    if (applyFilterBtn) {
        applyFilterBtn.addEventListener("click", applyFilters);
    }

    const resetFilterBtn = document.getElementById("resetFilter");
    if (resetFilterBtn) {
        resetFilterBtn.addEventListener("click", resetFilters);
    }

    const filterDepartment = document.getElementById("filterDepartment");
    if (filterDepartment) {
        filterDepartment.addEventListener("change", (e) => {
            const departmentId = e.target.value;
            const filterDivision = document.getElementById("filterDivision");

            if (departmentId) {
                loadDivisions(departmentId);
            } else {
                // Clear division dropdown if no department selected
                if (filterDivision) {
                    filterDivision.innerHTML = '<option value="">Select Division</option>';
                    filterDivision.disabled = true;
                    filterDivision.value = ''; // Reset value
                }
            }

            // Reset division filter in currentFilters when department changes
            if (currentFilters.division) {
                currentFilters.division = '';
            }
        });
    }
}

function applyFilters() {
    const department = document.getElementById("filterDepartment").value;
    const division = document.getElementById("filterDivision").value;
    const shift = document.getElementById("filterShift").value;

    const filters = {
        department: department || '',
        division: division || '',
        shift: shift || ''
    };

    // Preserve search filter if exists
    if (currentFilters.search) {
        filters.search = currentFilters.search;
    }

    loadEmployeeData(filters);

    // Close dropdown after applying filters
    const filterDropdown = document.querySelector('.filter-dropdown .dropdown-toggle');
    if (filterDropdown) {
        const dropdown = bootstrap.Dropdown.getInstance(filterDropdown);
        if (dropdown) {
            dropdown.hide();
        }
    }
}

function resetFilters() {
    document.getElementById("filterDepartment").value = "";
    document.getElementById("filterDivision").value = "";
    document.getElementById("filterShift").value = "";

    // Clear division dropdown and disable it
    const filterDivision = document.getElementById("filterDivision");
    if (filterDivision) {
        filterDivision.innerHTML = '<option value="">Select Division</option>';
        filterDivision.disabled = true;
    }

    // Reset filters but preserve search
    currentFilters = {
        department: '',
        division: '',
        shift: '',
        search: currentFilters.search || ''
    };

    loadEmployeeData(currentFilters);

    // Close dropdown after resetting filters
    const filterDropdown = document.querySelector('.filter-dropdown .dropdown-toggle');
    if (filterDropdown) {
        const dropdown = bootstrap.Dropdown.getInstance(filterDropdown);
        if (dropdown) {
            dropdown.hide();
        }
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

    const checkpoints = [];

    $(`#${formId} .checkpoint-time`).each(function () {
        if ($(this).val()) {
            checkpoints.push($(this).val());
        }
    });

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
                checkpoints: checkpoints,
            })
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

function addCheckpoint($modalBody) {
    const container = $modalBody.find(".checkpoint-wrapper");
    const items = container.find(".checkpoint-item");
    const index = items.length + 1;

    container.append(`
        <div class="row align-items-center mb-2 checkpoint-item">
            <div class="col-3">
                <small class="fw-semibold">Checkpoint ${index}</small>
            </div>
            <div class="col-8">
                <input type="time" class="form-control border-0 checkpoint-time" name="checkpoints[]">
            </div>
            <div class="col-1 text-end">
                <button type="button" class="btn btn-sm btn-link text-dark removeCheckpoint">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
        </div>
    `);
}

$(document).on("click", ".addCheckpointBtn, .addCheckpointInput", function () {
    const $modalBody = $(this).closest(".modal-body");
    addCheckpoint($modalBody);
});

$(document).on("click", ".removeCheckpoint", function () {
    const wrapper = $(this).closest(".checkpoint-wrapper");
    $(this).closest(".checkpoint-item").remove();
    wrapper.find(".checkpoint-item").each(function(index){
        $(this).find("small").text(`Checkpoint ${index + 1}`);
    });
});

function resetCheckpoint(containerId){
    $(containerId).empty();
}

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

async function saveEmployeeBaseShiftFromShiftPage() {
    try {
        const modalEl =
            document.querySelector("#editEmployeeModal") ||
            document.querySelector(".modal.show") ||
            document.querySelector(".modal");
        if (!modalEl) {
            showFloatingAlert("Edit Employee modal not found", "danger");
            return;
        }

        const employeeId = modalEl.querySelector("#editEmployeeId")?.value;
        const selectedShiftId = modalEl.querySelector("#editShiftId")?.value;
        if (!employeeId) {
            showFloatingAlert("Employee ID missing", "warning");
            return;
        }
        if (!selectedShiftId) {
            showFloatingAlert("Please select a shift", "warning");
            return;
        }

        const basePath =
            window.location.pathname.split("/").slice(0, -1).join("/") || "";
        const endpoint = `${basePath}/employee/${employeeId}`;

        const res = await fetch(endpoint, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-TOKEN": document.querySelector(
                    'meta[name="csrf-token"]'
                ).content,
                "X-Requested-With": "XMLHttpRequest",
            },
            body: JSON.stringify({ shift_id: selectedShiftId }),
        });

        if (!res.ok) {
            const txt = await res.text().catch(() => "");
            showFloatingAlert(
                `Failed to update base shift: ${res.status} ${txt}`,
                "danger"
            );
            return;
        }

        let json = {};
        try {
            json = await res.json();
        } catch (_) {}

        if (json && (json.status === "success" || json.code === 200)) {
            const modal =
                bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
            modal.hide();
            await ensureShiftsLoaded(true);
            loadEmployeeData();
            showFloatingAlert("Base shift updated successfully", "success");
        } else {
            showFloatingAlert(
                (json && json.message) || "Failed to update base shift",
                "danger"
            );
        }
    } catch (err) {
        console.error(err);
        showFloatingAlert("Error updating base shift", "danger");
    }
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

$(document).ready(function () {
    let debounceTimer;

    $('#search_filter').on('input', function () {
        const query = $(this).val().trim();

        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function () {
            if (query.length >= 2 || query.length === 0) {
                currentFilters.search = query;
                loadEmployeeData(currentFilters);
            }
        }, 500);
    });
});

$(document).on('click','.data-fullscreen, .data-fullscreen-exit',function(){
    $('.shift-container').toggleClass('fullscreen');
    $('.data-fullscreen').toggleClass('d-none');
});
