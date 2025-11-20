var appUrl = $('meta[name="app-url"]').attr("content");

// Unified alert: use Settings-style white alert (from office.js)
function showFloatingAlert(message, type = 'success', delayMs = 2500) {
    try {
        if (typeof window.showAlertMsg === 'function') {
            window.showAlertMsg(message, 'light', delayMs);
            return;
        }
        const box = document.querySelector('.box-alert-messages .box-message');
        if (box && box.parentElement) {
            box.parentElement.style.display = 'block';
            box.classList.remove('success', 'warning', 'error', 'light');
            box.classList.add('light');
            box.innerHTML = message;
            setTimeout(() => {
                if (typeof window.hideAlertMsg === 'function') { window.hideAlertMsg(); }
                else { box.parentElement.style.display = 'none'; }
            }, delayMs);
            return;
        }
    } catch (e) { /* no-op */ }
    try { alert(typeof message === 'string' ? message.replace(/<[^>]+>/g, '') : String(message)); } catch (e) { }
}

document.addEventListener("DOMContentLoaded", function () {
    const tableBody = document.getElementById("employeeTableBody");

    // Normalize image URL: keep absolute/http(s), data:, and blob: as-is; otherwise prefix with appUrl
    function normalizeImageUrl(url) {
        let u = url == null ? '' : String(url);
        if (!u || u.toLowerCase() === 'null' || u.toLowerCase() === 'undefined') {
            return `${appUrl}/asset/img/avatar.png`;
        }
        // Absolute http(s) or protocol-relative //, or data/blob URIs
        if (/^(https?:)?\/\//i.test(u) || /^data:/i.test(u) || /^blob:/i.test(u)) {
            return u;
        }
        if (u.startsWith(appUrl)) return u;
        return `${appUrl}/${u.replace(/^\//, '')}`;
    }

    // Current filter selections
    let currentFilters = {
        query: "",
        department: "",
        division: "",
        job: "",
        sort: "",
    };

    const filterDepartmentSelect = document.getElementById("filterDepartment");
    const filterDivisionSelect = document.getElementById("filterDivision");
    const filterJobSelect = document.getElementById("filterJob");
    const sortBySelect = document.getElementById("sortBy");
    const searchInput = document.getElementById("searchInput");

    // Load departments for filter select
    function loadDepartments() {
        $.ajax({
            url: appUrl + "/department/index",
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
                filterJobSelect.innerHTML =
                    '<option value="">Job</option>';
                filterJobSelect.disabled = true;
            },
            error: function () {
                showFloatingAlert("Failed to load departments.", 'warning', 3000);
            },
        });
    }

    // Load divisions based on selected department
    function loadDivisions(departmentId) {
        if (!departmentId) {
            filterDivisionSelect.innerHTML =
                '<option value="">Division</option>';
            filterDivisionSelect.disabled = true;
            filterJobSelect.innerHTML = '<option value="">Job</option>';
            filterJobSelect.disabled = true;
            return;
        }
        $.ajax({
            url: appUrl + "/division/index",
            method: "GET",
            dataType: "json",
            data: { department_id: departmentId },
            success: function (response) {
                const data = response.data || response;
                filterDivisionSelect.innerHTML =
                    '<option value="">Division</option>';
                data.forEach((div) => {
                    const option = document.createElement("option");
                    option.value = div.id;
                    option.textContent = div.name_division;
                    filterDivisionSelect.appendChild(option);
                });
                filterDivisionSelect.disabled = false;
                filterJobSelect.innerHTML =
                    '<option value="">Job</option>';
                filterJobSelect.disabled = true;
            },
            error: function () {
                showFloatingAlert("Failed to load divisions.", 'warning', 3000);
            },
        });
    }

    // Load jobs based on selected division
    function loadJobs(divisionId) {
        if (!divisionId) {
            filterJobSelect.innerHTML = '<option value="">Job</option>';
            filterJobSelect.disabled = true;
            return;
        }
        $.ajax({
            url: appUrl + "/job/index",
            method: "GET",
            dataType: "json",
            data: { division_id: divisionId },
            success: function (response) {
                const data = response.data || response;
                console.log(data);

                filterJobSelect.innerHTML =
                    '<option value="">Job</option>';
                data.forEach((job) => {
                    const option = document.createElement("option");
                    option.value = job.id;
                    option.textContent = job.job_name;
                    filterJobSelect.appendChild(option);
                });
                filterJobSelect.disabled = false;
            },
            error: function () {
                showFloatingAlert("Failed to load jobs.", 'warning', 3000);
            },
        });
    }

    // Fetch employees with filters
    function fetchEmployees(filters = {}) {
        $.ajax({
            url: appUrl + "/employee/index",
            type: "GET",
            dataType: "json",
            data: filters,
            headers: {
                Accept: "application/json",
            },
            success: function (data) {
                let employees = data.data;
                
                // Apply client-side sorting if sort parameter exists
                if (filters.sort) {
                    employees = applySorting(employees, filters.sort);
                }
                
                renderEmployees(employees);
                console.log(employees);

            },
            error: function () {
                tableBody.innerHTML =
                    '<tr><td colspan="8">Failed to load employee data.</td></tr>';
                showFloatingAlert('Failed to load employees.', 'warning', 3500);
            },
        });
    }

    // Render employee rows in table
    function renderEmployees(employees) {
        if (!employees.length) {
            tableBody.innerHTML =
                '<tr class="no-data-row"><td colspan="8" class="text-center">No employees found.</td></tr>';
            return;
        }

        let rows = "";
        employees.forEach((employee) => {
            // Sesuai permintaan: table Employee menggunakan field photo milik employee saja (bukan profile_picture)
            let photoUrl = normalizeImageUrl(employee.photo || null);
            const fallbackAvatar = `${appUrl}/asset/img/avatar.png`;
            const departmentName = employee.department
                ? employee.department.name_department
                : "-";
            const divisionName = employee.division
                ? employee.division.name_division
                : "-";
            const office = employee.office ? employee.office : "-";
            // Ensure status uppercase and map legacy INACTIVE -> RESIGN for UI
            let status = employee.status ? String(employee.status).toUpperCase() : "-";
            if (status === 'INACTIVE') status = 'RESIGN';

            let statusClass = 'status-UNKNOWN';
            if (status === 'ACTIVE') statusClass = 'status-ACTIVE';
            else if (status === 'RESIGN') statusClass = 'status-RESIGN';
            else if (status === 'CANDIDATE') statusClass = 'status-CANDIDATE';

            let contractDisplay = '-';
            const hireDateDisplay = employee.hire_date;

            if (employee.contract_end_date) {
                const cDate = new Date(employee.contract_end_date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                cDate.setHours(0, 0, 0, 0);
                const msPerDay = 1000 * 60 * 60 * 24;
                const dayDiff = Math.floor((cDate - today) / msPerDay);
                const formatted = formatDateENMedium(employee.contract_end_date);

                if (isNaN(dayDiff)) {
                    contractDisplay = formatted;
                } else {
                    if (dayDiff <= 30) {
                        contractDisplay = `<span class="text-danger rounded px-2 py-1">${formatted}</span>`;
                    } else {
                        contractDisplay = formatted;
                    }
                }
            }

            rows += `
                <tr data-id="${employee.id}">
                    <td>
                        <div class="d-flex align-items-center gap-3">
                            <img src="${photoUrl}" alt="Employee Photo" class="table-image rounded-circle" width="40" height="40" onerror="this.onerror=null;this.src='${fallbackAvatar}';" />
                            <div>
                                <div class="fw-semibold" style="font-size: 14px;">${employee.first_name} ${employee.last_name}</div>
                                <div style="font-size: 10px; color: #6c757d;">${employee.email}</div>
                            </div>
                        </div>
                    </td>
                    <td>${formatDateENMedium(employee.hire_date)}</td>
                    <td>${contractDisplay}</td>
                    <td>${departmentName}</td>
                    <td>${divisionName}</td>
                    <td>${office}</td>
                    <td><span class="status-badge ${statusClass}">${status}</span></td>
                    <td class="text-end">
                        <button class="btn-icon-toggle btn-detail" data-id="${employee.id}" title="Detail">
                            <span class="material-symbols-outlined icon">visibility</span>
                        </button>
                        <button class="btn-icon-toggle btn-edit" data-id="${employee.id}" title="Edit">
                            <span class="material-symbols-outlined icon">edit</span>
                        </button>
                        <button class="btn-icon-toggle btn-delete" data-id="${employee.id}" title="Delete">
                            <span class="material-symbols-outlined icon">delete</span>
                        </button>
                    </td>
                </tr>
            `;
        });
        tableBody.innerHTML = rows;
    }

    // Apply sorting to employees array
    function applySorting(employees, sortType) {
        if (!sortType) return employees;
        
        let sortedEmployees = [...employees];
        
        switch (sortType) {
            case 'name_asc':
                sortedEmployees.sort((a, b) => {
                    const nameA = `${a.first_name || ''} ${a.last_name || ''}`.trim().toLowerCase();
                    const nameB = `${b.first_name || ''} ${b.last_name || ''}`.trim().toLowerCase();
                    return nameA.localeCompare(nameB);
                });
                break;
            case 'name_desc':
                sortedEmployees.sort((a, b) => {
                    const nameA = `${a.first_name || ''} ${a.last_name || ''}`.trim().toLowerCase();
                    const nameB = `${b.first_name || ''} ${b.last_name || ''}`.trim().toLowerCase();
                    return nameB.localeCompare(nameA);
                });
                break;
            case 'hire_date_newest':
                sortedEmployees.sort((a, b) => {
                    const dateA = a.hire_date ? new Date(a.hire_date) : new Date(0);
                    const dateB = b.hire_date ? new Date(b.hire_date) : new Date(0);
                    return dateB - dateA;
                });
                break;
            case 'hire_date_oldest':
                sortedEmployees.sort((a, b) => {
                    const dateA = a.hire_date ? new Date(a.hire_date) : new Date(0);
                    const dateB = b.hire_date ? new Date(b.hire_date) : new Date(0);
                    return dateA - dateB;
                });
                break;
            case 'contract_date_newest':
                sortedEmployees.sort((a, b) => {
                    const dateA = a.contract_end_date ? new Date(a.contract_end_date) : new Date(0);
                    const dateB = b.contract_end_date ? new Date(b.contract_end_date) : new Date(0);
                    return dateB - dateA;
                });
                break;
            case 'contract_date_oldest':
                sortedEmployees.sort((a, b) => {
                    const dateA = a.contract_end_date ? new Date(a.contract_end_date) : new Date(0);
                    const dateB = b.contract_end_date ? new Date(b.contract_end_date) : new Date(0);
                    return dateA - dateB;
                });
                break;
            case 'department_asc':
                sortedEmployees.sort((a, b) => {
                    const deptA = (a.department?.name_department || '').toLowerCase();
                    const deptB = (b.department?.name_department || '').toLowerCase();
                    return deptA.localeCompare(deptB);
                });
                break;
            case 'department_desc':
                sortedEmployees.sort((a, b) => {
                    const deptA = (a.department?.name_department || '').toLowerCase();
                    const deptB = (b.department?.name_department || '').toLowerCase();
                    return deptB.localeCompare(deptA);
                });
                break;
            case 'division_asc':
                sortedEmployees.sort((a, b) => {
                    const divA = (a.division?.name_division || '').toLowerCase();
                    const divB = (b.division?.name_division || '').toLowerCase();
                    return divA.localeCompare(divB);
                });
                break;
            case 'division_desc':
                sortedEmployees.sort((a, b) => {
                    const divA = (a.division?.name_division || '').toLowerCase();
                    const divB = (b.division?.name_division || '').toLowerCase();
                    return divB.localeCompare(divA);
                });
                break;
        }
        
        return sortedEmployees;
    }

    // Delete modal and logic
    const deleteEmployeeModalEl = document.getElementById(
        "deleteEmployeeModal"
    );
    const deleteEmployeeModal = new bootstrap.Modal(deleteEmployeeModalEl);
    const deleteEmployeeForm = document.getElementById("deleteEmployeeForm");

    // Create loader overlay element similar to department.js and division.js
    let loaderOverlay = document.createElement("div");
    loaderOverlay.id = "deleteModalLoader";
    loaderOverlay.className = "modal-loading-overlay d-none";
    loaderOverlay.innerHTML = '<div class="loader-spinner"></div>';
    deleteEmployeeForm.appendChild(loaderOverlay);

    $(document).on("click", ".btn-delete", function () {
        const id = $(this).data("id");
        // Fetch employee details
        $.ajax({
            url: appUrl + `/employee/${id}`,
            method: "GET",
            dataType: "json",
            success: function (employee) {
                // Populate modal fields
                let photoUrl = employee.profile_picture_url || employee.profile_picture || null;
                const fallbackAvatarDel = `${appUrl}/asset/img/avatar.png`;
                if (!photoUrl || String(photoUrl).toLowerCase() === 'null' || String(photoUrl).toLowerCase() === 'undefined') photoUrl = fallbackAvatarDel;
                else if (!/^https?:\/\//i.test(photoUrl) && !photoUrl.startsWith(appUrl)) {
                    photoUrl = `${appUrl}/${photoUrl.replace(/^\//, '')}`;
                }

                $(".delete-employee-photo").css({
                    "background-image": `url(${photoUrl})`,
                    "background-size": "cover",

                    "background-position": "center center",
                    "background-repeat": "no-repeat",
                    width: "100px",
                    height: "100px",
                    "border-radius": "50%",
                    margin: "0 auto",
                });
                $("#deleteEmployeeName").text(employee.name);
                $("#deleteEmployeeEmail").text(employee.email);
                $("#deleteEmployeeDepartment").text(
                    employee.department
                        ? employee.department.name_department
                        : "-"
                );
                $("#deleteEmployeeDivision").text(
                    employee.division ? employee.division.name_division : "-"
                );
                $("#deleteEmployeeOffice").text(employee.office || "-");
                $("#deleteEmployeeStatus").text(employee.status || "-");

                // Store id in form data attribute
                $(deleteEmployeeForm).data("id", id);

                // Show modal
                deleteEmployeeModal.show();
            },
            error: function () {
                showFloatingAlert("Failed to fetch employee data.", 'warning', 3000);
            },
        });
    });

    $(document).on("click", ".btn-edit", function () {
        const id = $(this).data("id");
        window.location.href = appUrl + `/employee/${id}/edit`;
    });

    deleteEmployeeForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const id = $(this).data("id");
        // Show loader overlay
        loaderOverlay.classList.remove("d-none");

        $.ajax({
            url: appUrl + `/employee/${id}`,
            method: "DELETE",
            headers: {
                "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
            },
            success: function (response) {
                // Hide loader overlay
                loaderOverlay.classList.add("d-none");
                showFloatingAlert(response.message || 'Employee deleted successfully.', 'success', 1200);
                // Hide modal
                deleteEmployeeModal.hide();
                // Reload page to reflect changes
                setTimeout(function () { location.reload(); }, 1200);
            },
            error: function () {
                loaderOverlay.classList.add("d-none");
                showFloatingAlert("Failed to delete employee.", 'warning', 3500);
            },
        });
    });

    // Employee Detail Modal Logic
    const employeeDetailModalEl = document.getElementById(
        "employeeDetailModal"
    );
    const employeeDetailModal = new bootstrap.Modal(employeeDetailModalEl);

    $(document).on("click", ".btn-detail", function () {
        const id = $(this).data("id");

        // Check localStorage for updated photo for this employee (only for modal detail)
        let updatedPhoto = null;
        const updatedPhotoData = localStorage.getItem("editEmployeeUpdatedPhoto");
        if (updatedPhotoData) {
            try {
                const parsedData = JSON.parse(updatedPhotoData);
                // id dari data-attribute adalah number, employeeId bisa string/number
                if (String(parsedData.employeeId) === String(id)) {
                    updatedPhoto = parsedData.photoUrl;
                }
            } catch (e) {
                console.error("Failed to parse updatedEmployeePhoto from localStorage", e);
            }
        }

        $.ajax({
            url: appUrl + `/employee/${id}`,
            method: "GET",
            dataType: "json",
            success: function (employee) {
                // Populate modal fields
                $("#detailName").text(employee.name);
                const birthDate = new Date(employee.birth_date);
                const options = {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                };
                $("#detailBirthDate").text(
                    birthDate.toLocaleDateString("en-GB", options)
                );
                $("#detailEmail").text(employee.email);
                $("#detailPhone").text(employee.phone);
                $("#detailAddress").text(employee.address);

                $("#detailDepartment").text(
                    employee.department
                        ? employee.department.name_department
                        : "-"
                );
                $("#detailDivision").text(
                    employee.division ? employee.division.name_division : "-"
                );
                $("#detailJob").text(
                    employee.job ? employee.job.job_name : "-"
                );

                // Set new fields
                const hireDate = new Date(employee.hire_date);
                $("#detailHireDate").text(
                    hireDate.toLocaleDateString("en-GB", options)
                );
                // Handle grade - check if it's an object or string
                const gradeText = (employee.grade && typeof employee.grade === 'object') 
                    ? (employee.grade.title || "-") 
                    : (employee.grade || "-");
                $("#detailGrade").text(gradeText);
                $("#detailOffice").text(employee.office || "-");
                // Status badge in detail modal
                let dStatus = employee.status ? String(employee.status).toUpperCase() : '-';
                if (dStatus === 'INACTIVE') dStatus = 'RESIGN';
                $("#detailStatus").text(dStatus);
                $("#detailStatus").removeClass("status-badge status-ACTIVE status-RESIGN status-CANDIDATE");
                $("#detailStatus").addClass("status-badge");
                if (dStatus === "ACTIVE") {
                    $("#detailStatus").addClass("status-ACTIVE");
                } else if (dStatus === "RESIGN") {
                    $("#detailStatus").addClass("status-RESIGN");
                } else if (dStatus === "CANDIDATE") {
                    $("#detailStatus").addClass("status-CANDIDATE");
                }


                // Use updated photo if available, else use employee.photo
                // Detail modal harus menggunakan foto internal (employee.photo) saja agar perubahan dari halaman profile (profile_picture) tidak mempengaruhi.
                let photoUrl = normalizeImageUrl(updatedPhoto || employee.photo || null);

                $("#detailPhoto").attr("src", photoUrl);

                employeeDetailModal.show();
            },
            error: function () {
                alert("Failed to fetch employee details.");
            },
        });
    });

    // Filter selects change events (only load cascading, no auto-apply)
    filterDepartmentSelect.addEventListener("change", () => {
        const departmentId = filterDepartmentSelect.value;
        loadDivisions(departmentId);
    });

    filterDivisionSelect.addEventListener("change", () => {
        const divisionId = filterDivisionSelect.value;
        loadJobs(divisionId);
    });

    // Apply filter button
    const applyFilterBtn = document.getElementById("applyFilterBtn");
    applyFilterBtn.addEventListener("click", () => {
        currentFilters.sort = sortBySelect.value;
        currentFilters.department = filterDepartmentSelect.value ? [filterDepartmentSelect.value] : [];
        currentFilters.division = filterDivisionSelect.value ? [filterDivisionSelect.value] : [];
        currentFilters.job = filterJobSelect.value ? [filterJobSelect.value] : [];
        fetchEmployees(currentFilters);
        // Close dropdown
        const dropdown = bootstrap.Dropdown.getInstance(document.getElementById("filterDropdownBtn"));
        if (dropdown) dropdown.hide();
    });

    // Clear filter button
    const clearFilterBtn = document.getElementById("clearFilterBtn");
    clearFilterBtn.addEventListener("click", () => {
        sortBySelect.value = "";
        filterDepartmentSelect.value = "";
        filterDivisionSelect.value = "";
        filterJobSelect.value = "";
        filterDivisionSelect.disabled = true;
        filterJobSelect.disabled = true;
        currentFilters.sort = "";
        currentFilters.department = [];
        currentFilters.division = [];
        currentFilters.job = [];
        fetchEmployees(currentFilters);
        // Close dropdown
        const dropdown = bootstrap.Dropdown.getInstance(document.getElementById("filterDropdownBtn"));
        if (dropdown) dropdown.hide();
    });

    // Search input event
    searchInput.addEventListener("input", () => {
        currentFilters.query = searchInput.value.trim();
        fetchEmployees(currentFilters);
    });

    // Initial load departments and fetch employees without filters
    loadDepartments();
    fetchEmployees();

    window.addEventListener('profilePictureUpdated', function () {
        // Refresh table so current user's universal avatar updates immediately.
        fetchEmployees(currentFilters);
    });
});
