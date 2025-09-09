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
            box.classList.remove('success','warning','error','light');
            box.classList.add('light');
            box.innerHTML = message;
            setTimeout(() => {
                if (typeof window.hideAlertMsg === 'function') { window.hideAlertMsg(); }
                else { box.parentElement.style.display = 'none'; }
            }, delayMs);
            return;
        }
    } catch (e) { /* no-op */ }
    try { alert(typeof message === 'string' ? message.replace(/<[^>]+>/g, '') : String(message)); } catch(e) {}
}

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
                showFloatingAlert("Failed to load departments.", 'warning', 3000);
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
                showFloatingAlert("Failed to load divisions.", 'warning', 3000);
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
                renderEmployees(data.data);
            },
            error: function () {
                tableBody.innerHTML =
                    '<tr><td colspan="6">Failed to load employee data.</td></tr>';
                showFloatingAlert('Failed to load employees.', 'warning', 3500);
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
            // Tabel employee menampilkan avatar universal (profile_picture) agar edit halaman employee (photo) hanya mempengaruhi modal detail.
            let profilePicture = employee.profile_picture_url || employee.profile_picture || null;
            const fallbackAvatar = `${appUrl}/asset/img/avatar.png`;
            if (!profilePicture || String(profilePicture).toLowerCase() === 'null' || String(profilePicture).toLowerCase() === 'undefined') {
                profilePicture = fallbackAvatar;
            } else if (!/^https?:\/\//i.test(profilePicture) && !profilePicture.startsWith(appUrl)) {
                profilePicture = `${appUrl}/${String(profilePicture).replace(/^\//,'')}`;
            }
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
                            <img src="${profilePicture}" alt="Profile Picture" class="table-image rounded-circle" width="40" height="40" onerror="this.onerror=null;this.src='${fallbackAvatar}';" />
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
              let photoUrl = employee.profile_picture_url || employee.profile_picture || null;
              const fallbackAvatarDel = `${appUrl}/asset/img/avatar.png`;
              if (!photoUrl || String(photoUrl).toLowerCase() === 'null' || String(photoUrl).toLowerCase() === 'undefined') photoUrl = fallbackAvatarDel;
              else if (!/^https?:\/\//i.test(photoUrl) && !photoUrl.startsWith(appUrl)) {
                  photoUrl = `${appUrl}/${photoUrl.replace(/^\//,'')}`;
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
                setTimeout(function(){ location.reload(); }, 1200);
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
            // Detail modal harus menggunakan foto internal (employee.photo) saja agar perubahan dari halaman profile (profile_picture) tidak mempengaruhi.
            let photoUrl = updatedPhoto || employee.photo || null;
            if (!photoUrl) photoUrl = `${appUrl}/asset/img/avatar.png`;
            if (!/^https?:\/\//i.test(photoUrl) && !photoUrl.startsWith(appUrl)) {
                photoUrl = `${appUrl}/${photoUrl.replace(/^\//,'')}`;
            }

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

    window.addEventListener('profilePictureUpdated', function(){
        // Refresh table so current user's universal avatar updates immediately.
        fetchEmployees(currentFilters);
    });
});
