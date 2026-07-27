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
    const importEmployeeForm = document.getElementById("importEmployeeForm");
    const importEmployeeLoader = document.getElementById("importEmployeeLoader");
    const importEmployeeSubmitBtn = document.getElementById("importEmployeeSubmitBtn");
    const importEmployeeModalEl = document.getElementById("importEmployeeModal");
    const importEmployeeModal = importEmployeeModalEl ? bootstrap.Modal.getOrCreateInstance(importEmployeeModalEl) : null;
    const employeePaginationWrap = document.getElementById("employeePaginationWrap");
    const employeePaginationInfo = document.getElementById("employeePaginationInfo");
    const employeePagination = document.getElementById("employeePagination");

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

    let currentPage = 1;
    const perPage = 10;

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
                    '<option value="">Partner</option>';
                data.forEach((dept) => {
                    const option = document.createElement("option");
                    option.value = dept.id;
                    option.textContent = dept.name_department;
                    filterDepartmentSelect.appendChild(option);
                });
                filterDivisionSelect.innerHTML =
                    '<option value="">Site</option>';
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
    function fetchEmployees(filters = {}, page = 1) {
        $.ajax({
            url: appUrl + "/employee/index",
            type: "GET",
            dataType: "json",
            data: {
                ...filters,
                page,
                per_page: perPage,
            },
            headers: {
                Accept: "application/json",
            },
            success: function (data) {
                const employees = data.data || [];
                const pagination = data.pagination || null;

                renderEmployees(employees);
                renderPagination(pagination);
                currentPage = pagination?.current_page || 1;

            },
            error: function () {
                tableBody.innerHTML =
                    '<tr><td colspan="8">Failed to load employee data.</td></tr>';
                renderPagination(null);
                showFloatingAlert('Failed to load employees.', 'warning', 3500);
            },
        });
    }

    function renderPagination(pagination) {
        if (!employeePaginationWrap || !employeePaginationInfo || !employeePagination) {
            return;
        }

        if (!pagination || (pagination.total || 0) === 0) {
            employeePaginationWrap.classList.add("d-none");
            employeePaginationInfo.textContent = "";
            employeePagination.innerHTML = "";
            return;
        }

        employeePaginationWrap.classList.remove("d-none");
        const from = pagination.from || 0;
        const to = pagination.to || 0;
        const total = pagination.total || 0;
        employeePaginationInfo.textContent = `Showing ${from}-${to} of ${total}`;

        const current = pagination.current_page || 1;
        const last = pagination.last_page || 1;

        const buttons = [];
        buttons.push(createPageButton("Prev", Math.max(current - 1, 1), current <= 1));

        const pages = buildPageNumbers(current, last);
        pages.forEach((item) => {
            if (item === "...") {
                buttons.push('<span class="employee-page-btn" style="pointer-events:none;">...</span>');
                return;
            }
            const activeClass = item === current ? " active" : "";
            buttons.push(`<button type="button" class="employee-page-btn${activeClass}" data-page="${item}">${item}</button>`);
        });

        buttons.push(createPageButton("Next", Math.min(current + 1, last), current >= last));

        employeePagination.innerHTML = buttons.join("");
    }

    function createPageButton(label, page, disabled) {
        return `<button type="button" class="employee-page-btn" data-page="${page}" ${disabled ? "disabled" : ""}>${label}</button>`;
    }

    function buildPageNumbers(current, last) {
        const pages = [];

        if (last <= 7) {
            for (let i = 1; i <= last; i++) {
                pages.push(i);
            }
            return pages;
        }

        pages.push(1);

        if (current > 3) {
            pages.push("...");
        }

        const start = Math.max(2, current - 1);
        const end = Math.min(last - 1, current + 1);

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        if (current < last - 2) {
            pages.push("...");
        }

        pages.push(last);
        return pages;
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
            let photoUrl = normalizeImageUrl(employee.photo || null);
            const fallbackAvatar = `${appUrl}/asset/img/avatar.png`;
            const departmentName = employee.department
                ? employee.department.name_department
                : "-";
            const partnerName = employee.partner
                ? employee.partner.partner_name
                : "-";
            const divisionName = employee.division
                ? employee.division.name_division
                : "-";
            const office = employee.office ? employee.office : "-";
            let status = employee.status ? String(employee.status).toUpperCase() : "-";
            if (status === 'INACTIVE') status = 'RESIGN';

            let statusClass = 'status-UNKNOWN';
            if (status === 'ACTIVE') statusClass = 'status-ACTIVE';
            else if (status === 'RESIGN') statusClass = 'status-RESIGN';
            else if (status === 'CANDIDATE') statusClass = 'status-CANDIDATE';

            let contractDisplay = '-';
            const hireDateDisplay = new Date(employee.hire_date);

            let now = new Date();
            let years = now.getFullYear() - hireDateDisplay.getFullYear();
            let months = now.getMonth() - hireDateDisplay.getMonth();

            if (months < 0) {
                years--;
                months += 12;
            }

            let workingPeriod = `${years} Year ${months} Month`;

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
                        <div class="d-inline-block w-100">
                            <div class="d-flex align-items-center gap-3 w-100">
                                <img src="${photoUrl}" alt="Employee Photo" class="table-image rounded-circle" width="40" height="40" onerror="this.onerror=null;this.src='${fallbackAvatar}';" />
                                <div class="overflow-hidden">
                                    <div class="fw-semibold" style="font-size: 14px;">${employee.first_name} ${employee.last_name}</div>
                                    <div class="employee-email" >${employee.email}</div>
                                </div>
                            </div>
                        </div>
                    </td>
                    <td>${formatDateENMedium(employee.hire_date)}</td>
                    <td>${contractDisplay}</td>
                    <td>${workingPeriod}</td>
                    <td>${departmentName}</td>
                    <td>${partnerName}</td>
                    <td>${divisionName}</td>
                    <td>
                        <div class="office-text">${office}</div>
                    </td>
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
                setTimeout(function () { fetchEmployees(currentFilters, currentPage); }, 1200);
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
        currentPage = 1;
        fetchEmployees(currentFilters, currentPage);
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
        currentPage = 1;
        fetchEmployees(currentFilters, currentPage);
        // Close dropdown
        const dropdown = bootstrap.Dropdown.getInstance(document.getElementById("filterDropdownBtn"));
        if (dropdown) dropdown.hide();
    });

    // Search input event
    searchInput.addEventListener("input", () => {
        currentFilters.query = searchInput.value.trim();
        currentPage = 1;
        fetchEmployees(currentFilters, currentPage);
    });

    if (employeePagination) {
        employeePagination.addEventListener("click", (event) => {
            const target = event.target.closest("button[data-page]");
            if (!target || target.disabled) {
                return;
            }
            const page = Number(target.getAttribute("data-page"));
            if (!Number.isFinite(page) || page < 1 || page === currentPage) {
                return;
            }
            currentPage = page;
            fetchEmployees(currentFilters, currentPage);
        });
    }

    // Initial load departments and fetch employees without filters
    loadDepartments();
    fetchEmployees(currentFilters, currentPage);

    window.addEventListener('profilePictureUpdated', function () {
        fetchEmployees(currentFilters, currentPage);
    });

    if (importEmployeeForm) {
        importEmployeeForm.addEventListener("submit", function (e) {
            e.preventDefault();

            if (!importEmployeeForm.checkValidity()) {
                importEmployeeForm.classList.add("was-validated");
                return;
            }

            importEmployeeForm.classList.remove("was-validated");

            if (importEmployeeLoader) {
                importEmployeeLoader.classList.remove("d-none");
            }
            if (importEmployeeSubmitBtn) {
                importEmployeeSubmitBtn.disabled = true;
            }

            const formData = new FormData(importEmployeeForm);

            fetch(importEmployeeForm.action, {
                method: "POST",
                headers: {
                    "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "",
                    "X-Requested-With": "XMLHttpRequest",
                    "Accept": "application/json",
                },
                body: formData,
            })
                .then(async (response) => {
                    let data = {};
                    try {
                        data = await response.json();
                    } catch (_) {
                        data = {};
                    }

                    if (!response.ok) {
                        throw new Error(data.message || "Import gagal.");
                    }

                    showFloatingAlert(data.message || "Import selesai.", data.status === "warning" ? "warning" : "success", 5000);
                    if (importEmployeeModal) {
                        importEmployeeModal.hide();
                    }
                    importEmployeeForm.reset();
                    currentPage = 1;
                    fetchEmployees(currentFilters, currentPage);
                })
                .catch((error) => {
                    showFloatingAlert(error.message || "Import gagal.", "warning", 5000);
                })
                .finally(() => {
                    if (importEmployeeLoader) {
                        importEmployeeLoader.classList.add("d-none");
                    }
                    if (importEmployeeSubmitBtn) {
                        importEmployeeSubmitBtn.disabled = false;
                    }
                });
        });
    }
});
