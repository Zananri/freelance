var appUrl = $('meta[name="app-url"]').attr("content");

document.addEventListener("DOMContentLoaded", function () {
    const tableBody = document.getElementById("employeeTableBody");

    // Current filter selections
    let currentFilters = {
        query: "",
        department: "",
        division: "",
        job: "",
    };

    const filterDepartmentSelect = document.getElementById("filterDepartment");
    const filterDivisionSelect = document.getElementById("filterDivision");
    const filterJobSelect = document.getElementById("filterJob");
    const searchInput = document.getElementById("searchInput");
    const applyFilterBtn = document.getElementById("applyFilterBtn");
    const openFilterModalBtn = document.getElementById("openFilterModalBtn");

    // Load departments for filter select
    function loadDepartments() {
        $.ajax({
            url: appUrl + "/department/index",
            method: "GET",
            dataType: "json",
            success: function (response) {
                const data = response.data || response;
                filterDepartmentSelect.innerHTML =
                    '<option value="">Select Department</option>';
                data.forEach((dept) => {
                    const option = document.createElement("option");
                    option.value = dept.id;
                    option.textContent = dept.name_department;
                    filterDepartmentSelect.appendChild(option);
                });
                filterDivisionSelect.innerHTML =
                    '<option value="">Select Division</option>';
                filterDivisionSelect.disabled = true;
                filterJobSelect.innerHTML =
                    '<option value="">Select Job</option>';
                filterJobSelect.disabled = true;
            },
            error: function () {
                alert("Failed to load departments.");
            },
        });
    }

    // Load divisions based on selected department
    function loadDivisions(departmentId) {
        if (!departmentId) {
            filterDivisionSelect.innerHTML =
                '<option value="">Select Division</option>';
            filterDivisionSelect.disabled = true;
            filterJobSelect.innerHTML = '<option value="">Select Job</option>';
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
                    '<option value="">Select Division</option>';
                data.forEach((div) => {
                    const option = document.createElement("option");
                    option.value = div.id;
                    option.textContent = div.name_division;
                    filterDivisionSelect.appendChild(option);
                });
                filterDivisionSelect.disabled = false;
                filterJobSelect.innerHTML =
                    '<option value="">Select Job</option>';
                filterJobSelect.disabled = true;
            },
            error: function () {
                alert("Failed to load divisions.");
            },
        });
    }

    // Load jobs based on selected division
    function loadJobs(divisionId) {
        if (!divisionId) {
            filterJobSelect.innerHTML = '<option value="">Select Job</option>';
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
                    '<option value="">Select Job</option>';
                data.forEach((job) => {
                    const option = document.createElement("option");
                    option.value = job.id;
                    option.textContent = job.job_name;
                    filterJobSelect.appendChild(option);
                });
                filterJobSelect.disabled = false;
            },
            error: function () {
                alert("Failed to load jobs.");
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
                renderEmployees(data.data);
            },
            error: function () {
                tableBody.innerHTML =
                    '<tr><td colspan="6">Failed to load employee data.</td></tr>';
            },
        });
    }

    // Render employee rows in table
    function renderEmployees(employees) {
        if (!employees.length) {
            tableBody.innerHTML =
                '<tr class="no-data-row"><td colspan="6" class="text-center">No employees found.</td></tr>';
            return;
        }

        let rows = "";
        employees.forEach((employee) => {
            // Jangan pernah ambil foto dari localStorage di tabel, hanya dari API/database
            const profilePicture = employee.user_photo
                ? employee.user_photo
                : employee.profile_picture
                ? employee.profile_picture
                : "asset/img/default-profile.png";
            const departmentName = employee.department
                ? employee.department.name_department
                : "-";
            const divisionName = employee.division
                ? employee.division.name_division
                : "-";
            const office = employee.office ? employee.office : "-";
            const status = employee.status ? employee.status : "-";

            const statusClass =
                status === "ACTIVE" ? "status-ACTIVE" : "status-INACTIVE";

            rows += `
                <tr data-id="${employee.id}">
                    <td>
                        <div class="d-flex align-items-center gap-3">
                            <img src="/${profilePicture}" alt="Profile Picture" class="table-image rounded-circle" width="40" height="40" />
                            <div>
                                <div class="fw-semibold" style="font-size: 14px;">${employee.first_name} ${employee.last_name}</div>
                                <div style="font-size: 10px; color: #6c757d;">${employee.email}</div>
                            </div>
                        </div>
                    </td>
                    <td>${departmentName}</td>
                    <td>${divisionName}</td>
                    <td>${office}</td>
                    <td><span class="${statusClass}">${status}</span></td>
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
                const photoUrl = employee.profile_picture
                    ? `/${employee.profile_picture}`
                    : "/asset/img/default-profile.png";
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
                alert("Failed to fetch employee data.");
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
                // Show success alert
                $(".alert-delete-container").empty();
                const alertHtml = `
                    <div class="alert alert-success alert-dismissible fade show d-flex justify-content-between align-items-center" role="alert" style="margin-bottom:0;">
                        <div>${response.message}</div>
                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                    </div>`;
                $(".alert-delete-container").append(alertHtml).show();
                setTimeout(() => {
                    $(".alert-delete-container .alert").alert("close");
                }, 2000);
                // Hide modal
                deleteEmployeeModal.hide();
                // Reload page to reflect changes
                location.reload();
            },
            error: function () {
                loaderOverlay.classList.add("d-none");
                alert("Failed to delete employee.");
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
                $("#detailGrade").text(employee.grade || "-");
                $("#detailOffice").text(employee.office || "-");
                $("#detailStatus").text(employee.status || "-");
                $("#detailStatus").removeClass("status-ACTIVE status-INACTIVE");
                if (employee.status === "ACTIVE") {
                    $("#detailStatus").addClass("status-ACTIVE");
                } else if (employee.status === "INACTIVE") {
                    $("#detailStatus").addClass("status-INACTIVE");
                }


                // Use updated photo if available, else use employee.photo
                const photoUrl = updatedPhoto
                    ? updatedPhoto
                    : employee.photo
                    ? `/${employee.photo}`
                    : "/asset/img/default-profile.png";
                $("#detailPhoto").attr("src", photoUrl);

                employeeDetailModal.show();
            },
            error: function () {
                alert("Failed to fetch employee details.");
            },
        });
    });

    // Filter modal open button
    openFilterModalBtn.addEventListener("click", () => {
        loadDepartments();
        $("#filterModal").modal("show");
    });

    // Filter selects change events
    filterDepartmentSelect.addEventListener("change", () => {
        const departmentId = filterDepartmentSelect.value;
        loadDivisions(departmentId);
    });

    filterDivisionSelect.addEventListener("change", () => {
        const divisionId = filterDivisionSelect.value;
        loadJobs(divisionId);
    });

    // Apply filter button click
    applyFilterBtn.addEventListener("click", () => {
        currentFilters.department = filterDepartmentSelect.value
            ? [filterDepartmentSelect.value]
            : [];
        currentFilters.division = filterDivisionSelect.value
            ? [filterDivisionSelect.value]
            : [];
        currentFilters.job = filterJobSelect.value
            ? [filterJobSelect.value]
            : [];
        currentFilters.query = searchInput.value.trim();

        fetchEmployees(currentFilters);
        $("#filterModal").modal("hide");
    });

    // Search input event
    searchInput.addEventListener("input", () => {
        currentFilters.query = searchInput.value.trim();
        fetchEmployees(currentFilters);
    });

    // Initial fetch employees without filters
    fetchEmployees();
});
