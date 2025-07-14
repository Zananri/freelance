var appUrl = $('meta[name="app-url"]').attr("content");

var selectedStatus = "ALL";

var selectedDepartmentId = "";
var selectedDivisionId = "";
var selectedFilterType = "";

var editJobModal = new bootstrap.Modal(document.getElementById("editJobModal"));

var addJobModal;

function showLoader(modalType, show = true) {
    const loaderId = {
        add: "#addModalLoader",
        edit: "#editModalLoader",
        delete: "#deleteModalLoader",
    }[modalType];
    if (loaderId) {
        document.querySelector(loaderId).classList.toggle("d-none", !show);
    }
}

function loadDepartmentsDropdown(
    selectedId = null,
    selector = "#department_id",
    callback = null
) {
    $.ajax({
        url: appUrl + "/department/index",
        type: "GET",
        success: function (response) {
            var departments = response.data;
            var options =
                '<option value="" disabled selected>Select Department</option>';
            $.each(departments, function (index, department) {
                options +=
                    '<option value="' +
                    department.id +
                    '"' +
                    (selectedId == department.id ? " selected" : "") +
                    ">" +
                    department.name_department +
                    "</option>";
            });
            $(selector).html(options);
            if (selectedId) {
                $(selector).val(selectedId);
            }
            if (typeof callback === "function") {
                callback();
            }
        },
    });
}

function loadDivisionsDropdown(
    departmentId,
    selectedId = null,
    selector = "#division_id"
) {
    console.log(
        "loadDivisionsDropdown called with:",
        departmentId,
        selectedId,
        selector
    );
    if (!departmentId) {
        $(selector).html(
            '<option value="" disabled selected>Select Division</option>'
        );
        return;
    }
    $.ajax({
        url: appUrl + "/division/index",
        type: "GET",
        data: { department_id: departmentId },
        success: function (response) {
            console.log("Divisions response:", response);
            var divisions = response.data;
            var options =
                '<option value="" disabled selected>Select Division</option>';
            $.each(divisions, function (index, division) {
                options +=
                    '<option value="' +
                    division.id +
                    '"' +
                    (selectedId == division.id ? " selected" : "") +
                    ">" +
                    division.name_division +
                    "</option>";
            });
            $(selector).html(options);
        },
    });
}

function loadFilterOptions(
    selectedId = null,
    selector = "#filterOptions",
    callback = null
) {
    $.ajax({
        url: appUrl + "/filters",
        type: "GET",
        success: function (response) {
            var filters = response.data;
            var options =
                '<option value="" disabled selected>Select Filter Option</option>';
            $.each(filters, function (index, filter) {
                options +=
                    '<option value="' +
                    filter.id +
                    '"' +
                    (selectedId == filter.id ? " selected" : "") +
                    ">" +
                    filter.name +
                    "</option>";
            });
            $(selector).html(options);
            if (selectedId) {
                $(selector).val(selectedId);
            }
            if (typeof callback === "function") {
                callback();
            }
        },
        error: function () {
            $(selector).html(
                '<option value="" disabled selected>Failed to load filters</option>'
            );
        },
    });
}

// Change event handler to use event delegation for dynamic elements
$(document).on("change", "#department_id", function () {
    var departmentId = $(this).val();
    loadDivisionsDropdown(departmentId);
});

// Fungsi untuk load division pada filter sesuai department
function loadDivisionsForFilter(departmentId) {
    $("#divisionFilterOptions").html('<span class="dropdown-item text-muted">Loading divisions...</span>');
    $.ajax({
        url: appUrl + "/division/index",
        type: "GET",
        data: departmentId ? { department_id: departmentId } : {},
        success: function (response) {
            var divisions = response.data;
            var menuHtml =
                '<a class="dropdown-item division-filter-option active" href="#" data-division="">All Divisions</a>';
            $.each(divisions, function (index, division) {
                menuHtml +=
                    '<a class="dropdown-item division-filter-option" href="#" data-division="' +
                    division.id +
                    '">' +
                    division.name_division +
                    "</a>";
            });
            $("#divisionFilterOptions").html(menuHtml);
        },
        error: function () {
            $("#divisionFilterOptions").html(
                '<span class="dropdown-item text-danger">Failed to load divisions</span>'
            );
        },
    });
}

// Handler klik division pada filter
$(document).on("click", "#divisionFilterOptions .division-filter-option", function (e) {
    e.preventDefault();
    $("#divisionFilterOptions .division-filter-option").removeClass("active");
    $(this).addClass("active");
    selectedDivisionId = $(this).data("division") || "";
    loadJobs();
});

function loadJobs() {
    $.ajax({
        url: appUrl + "/job/index",
        type: "GET",
        data: {
            query: $("#searchInput").val() || "",
            status: selectedFilterType === "status" ? selectedStatus : "ALL",
            department_id: selectedFilterType === "department" || selectedFilterType === "division" ? selectedDepartmentId : "",
            division_id: selectedFilterType === "division" ? selectedDivisionId : "",
        },
        success: function (response) {
            const jobs = response.data;
            const tbody = $("#jobTableBody");
            tbody.empty();

            if (!jobs || jobs.length === 0) {
                tbody.append(`
                    <tr>
                        <td colspan="5" class="text-center text-muted">No data found</td>
                    </tr>
                `);
                return;
            }

            jobs.forEach((job) => {
                const statusBadge =
                    job.status === "ACTIVE"
                        ? `<span class="status-ACTIVE">Active</span>`
                        : `<span class="status-INACTIVE">Inactive</span>`;

                tbody.append(`
                    <tr data-id="${job.id}">
                        <td>${job.job_name}</td>
                        <td>${job.department?.name_department || "-"}</td>
                        <td>${job.division?.name_division || "-"}</td>
                        <td>${statusBadge}</td>
                        <td class="text-end">
<button class="btn-detail" data-id="${job.id}">
    <span class="material-symbols-outlined icon">visibility</span>
</button>
                            <button class="btn-edit" data-id="${job.id}">
                                <span class="material-symbols-outlined icon">edit</span>
                            </button>
                            <button class="btn-delete" data-id="${
                                job.id
                            }" data-name="${job.job_name}" data-status="${
                                job.status
                            }" data-description="${job.description || ""}">
                                <span class="material-symbols-outlined icon">delete</span>
                            </button>
                        </td>
                    </tr>
                `);
            });
        },
        error: function () {
            $("#jobTableBody").html(`
                <tr>
                    <td colspan="5" class="text-center text-danger">Failed to load data</td>
                </tr>
            `);
        },
    });
}

$(document).ready(function () {
    addJobModal = new bootstrap.Modal(document.getElementById("addJobModal"));

    // Event handler search
    $("#searchInput").on("input", function () {
        loadJobs();
    });

    // Event handler filter type (status/department)
    $("#filterTypeSelect").on("change", function () {
        selectedFilterType = $(this).val();
        $("#statusFilterOptions, #departmentFilterOptions, #divisionFilterOptions").addClass("d-none");

        if (selectedFilterType === "status") {
            $("#statusFilterOptions").removeClass("d-none");
        } else if (selectedFilterType === "department") {
            $("#departmentFilterOptions").removeClass("d-none");
            // Load department list jika belum ada
            if ($("#departmentFilterOptions").find("a").length === 0) {
                $.ajax({
                    url: appUrl + "/department/index",
                    type: "GET",
                    success: function (response) {
                        var departments = response.data;
                        var menuHtml =
                            '<a class="dropdown-item department-filter-option disabled selected" href="#" data-department="">Select Department</a>';
                        $.each(departments, function (index, department) {
                            menuHtml +=
                                '<a class="dropdown-item department-filter-option" href="#" data-department="' +
                                department.id +
                                '">' +
                                department.name_department +
                                "</a>";
                        });
                        $("#departmentFilterOptions").html(menuHtml);
                    },
                    error: function () {
                        $("#departmentFilterOptions").html(
                            '<span class="dropdown-item text-danger">Failed to load departments</span>'
                        );
                    },
                });
            }
        } else if (selectedFilterType === "division") {
            $("#departmentFilterOptions").removeClass("d-none");
            $("#divisionFilterOptions").removeClass("d-none");
            // Jika belum ada department, load dulu
            if ($("#departmentFilterOptions").find("a").length === 0) {
                $.ajax({
                    url: appUrl + "/department/index",
                    type: "GET",
                    success: function (response) {
                        var departments = response.data;
                        var menuHtml =
                            '<a class="dropdown-item department-filter-option disabled selected" href="#" data-department="">Select Department</a>';
                        $.each(departments, function (index, department) {
                            menuHtml +=
                                '<a class="dropdown-item department-filter-option" href="#" data-department="' +
                                department.id +
                                '">' +
                                department.name_department +
                                "</a>";
                        });
                        $("#departmentFilterOptions").html(menuHtml);
                    },
                    error: function () {
                        $("#departmentFilterOptions").html(
                            '<span class="dropdown-item text-danger">Failed to load departments</span>'
                        );
                    },
                });
            }
            // Load all divisions (default)
            loadDivisionsForFilter(selectedDepartmentId);
        }
        loadJobs();
    });

    // Filter status change handler
    $("#filterStatus").on("change", function () {
        selectedStatus = $(this).val() || "ALL";
        loadJobs();
    });

    loadJobs(); // Load job data on page load

    $("#editJobModal").on("hidden.bs.modal", function () {
        $("#editJobForm")[0].reset();
        $("#editJobForm").removeClass("was-validated");
        $("#editJobModal .alert-container").empty();
        $("#editModalLoader").addClass("d-none");
    });

    // Event handler filter status option click
    $(document).on("click", "#statusFilterOptions .filter-option", function (e) {
        e.preventDefault();
        $("#statusFilterOptions .filter-option").removeClass("active");
        $(this).addClass("active");
        selectedStatus = $(this).data("status");
        loadJobs();
    });

    // Event handler filter department option click
    $(document).on("click", "#departmentFilterOptions .department-filter-option", function (e) {
        e.preventDefault();
        $("#departmentFilterOptions .department-filter-option").removeClass("active");
        $(this).addClass("active");
        selectedDepartmentId = $(this).data("department") || "";
        // Jika filter by division, reload division list sesuai department
        if (selectedFilterType === "division") {
            loadDivisionsForFilter(selectedDepartmentId);
            selectedDivisionId = ""; // reset division
        }
        loadJobs();
    });

    // Set default filter type
    // $("#filterTypeSelect").val("status").trigger("change");


    function resetAddJobForm() {
        $("#addJobModal .alert-container").empty();
        var form = $("#addJobForm")[0];
        form.reset();
        $(form).removeClass("was-validated");
        $(
            "#department_id, #division_id, #job_name, #status, #description"
        ).removeClass("is-valid is-invalid");
    }

    $("#btnAddData").on("click", function () {
        resetAddJobForm();
        loadDepartmentsDropdown(null, "#department_id", function () {
            // Keep the default "Select Department" option selected (disabled and selected)
            $("#department_id").val("");
            // Reset division dropdown to default
            $("#division_id").html(
                '<option value="" disabled selected>Select Division</option>'
            );
        });
        addJobModal.show();
    });

    $("#editJobModal").on("show.bs.modal", function () {
        $("#editJobModal .alert-container").empty();
        $(
            "#edit_department_id, #edit_division_id, #edit_job_name, #edit_status, #edit_description"
        ).removeClass("is-valid is-invalid");
        $("#editModalLoader").addClass("d-none");
    });

    // Add Job form validation feedback
    $("#addJobForm input, #addJobForm select, #addJobForm textarea").on(
        "input change",
        function () {
            var input = $(this)[0];
            var $input = $(this);
            if (input.checkValidity()) {
                $input.removeClass("is-invalid").addClass("is-valid");
            } else {
                $input.removeClass("is-valid").addClass("is-invalid");
            }
            $("#addJobForm").removeClass("was-validated");
        }
    );

    // Edit Job form validation feedback
    $("#editJobForm input, #editJobForm select, #editJobForm textarea").on(
        "input change",
        function () {
            var input = $(this)[0];
            var $input = $(this);
            if (input.checkValidity()) {
                $input.removeClass("is-invalid").addClass("is-valid");
            } else {
                $input.removeClass("is-valid").addClass("is-invalid");
            }
            $("#editJobForm").removeClass("was-validated");
        }
    );

    // Add Job form submit
    $("#addJobForm").submit(function (e) {
        e.preventDefault();

        var form = this;
        if (!form.checkValidity()) {
            e.stopPropagation();
            $(form).addClass("was-validated");
            return false;
        }
        $(form).removeClass("was-validated");

        showLoader("add", true);

        var formData = {
            department_id: $("#department_id").val(),
            division_id: $("#division_id").val(),
            job_name: $("#job_name").val(),
            status: $("#status").val(),
            description: $("#description").val(),
        };

        $.ajax({
            url: appUrl + "/job/store",
            type: "POST",
            data: formData,
            headers: {
                "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
            },
            success: function (response) {
                showLoader("add", false);
                $("#addJobModal .alert-container").empty();
                var alertHtml =
                    '<div class="alert alert-success alert-dismissible fade show d-flex justify-content-between align-items-center" role="alert" style="margin-bottom:0;">' +
                    "<div>" +
                    response.message +
                    "</div>" +
                    '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>' +
                    "</div>";
                $("#addJobModal .alert-container").append(alertHtml);
                $("#addJobModal .alert-container").show();
                loadJobs();
                setTimeout(function () {
                    $("#addJobModal .alert-container .alert").alert("close");
                    addJobModal.hide();
                }, 1500);
            },
            error: function (xhr) {
                showLoader("add", false);
                var errorMsg = "Failed to add job.";
                if (
                    xhr.status === 422 &&
                    xhr.responseJSON &&
                    xhr.responseJSON.errors
                ) {
                    errorMsg = Object.values(xhr.responseJSON.errors).join(
                        "<br>"
                    );
                }
                $("#addJobModal .alert-container")
                    .html(
                        '<div class="alert alert-danger alert-dismissible fade show d-flex justify-content-between align-items-center" role="alert">' +
                            errorMsg +
                            '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>' +
                            "</div>"
                    )
                    .show();
            },
        });
    });

    // Edit Job form submit
    $("#editJobForm").submit(function (e) {
        e.preventDefault();

        var form = this;
        if (!form.checkValidity()) {
            e.stopPropagation();
            $(form).addClass("was-validated");
            return false;
        }
        $(form).removeClass("was-validated");

        showLoader("edit", true);

        var jobId = $("#edit_job_id").val();
        var formData = {
            department_id: $("#edit_department_id").val(),
            division_id: $("#edit_division_id").val(),
            job_name: $("#edit_job_name").val(),
            status: $("#edit_status").val(),
            description: $("#edit_description").val(),
        };

        $.ajax({
            url: appUrl + "/job/" + jobId,
            type: "PUT",
            data: formData,
            headers: {
                "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
            },
            success: function (response) {
                showLoader("edit", false);
                $("#editJobModal .alert-container").empty();
                var alertHtml =
                    '<div class="alert alert-success alert-dismissible fade show d-flex justify-content-between align-items-center" role="alert" style="margin-bottom:0;">' +
                    "<div>" +
                    response.message +
                    "</div>" +
                    '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>' +
                    "</div>";
                $("#editJobModal .alert-container").append(alertHtml);
                $("#editJobModal .alert-container").show();
                loadJobs();
                setTimeout(function () {
                    $("#editJobModal .alert-container .alert").alert("close");
                    editJobModal.hide();
                }, 1500);
            },
            error: function (xhr) {
                showLoader("edit", false);
                var errorMsg = "Failed to update job.";
                if (xhr.status === 422) {
                    var errors = xhr.responseJSON.errors;
                    errorMsg = "";
                    $.each(errors, function (key, value) {
                        errorMsg += value + "<br>";
                    });
                }
                $("#editJobModal .alert-container")
                    .html(
                        '<div class="alert alert-danger alert-dismissible fade show d-flex justify-content-between align-items-center" role="alert">' +
                            errorMsg +
                            '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>' +
                            "</div>"
                    )
                    .show();
            },
        });
    });

    // Event handler tombol edit
    $(document).on("click", ".btn-edit", function () {
        const jobId = $(this).data("id");

        // Tampilkan loader
        showLoader("edit", true);

        $.ajax({
            url: `${appUrl}/job/${jobId}`,
            type: "GET",
            success: function (response) {
                const job = response;

                // Isi data ke form edit
                $("#edit_job_id").val(job.id);
                $("#edit_job_name").val(job.job_name);
                $("#edit_status").val(job.status);
                $("#edit_description").val(job.description || "");

                // Load department dan division yang sesuai
                loadDepartmentsDropdown(job.department_id, "#edit_department_id", function () {
                    loadDivisionsDropdown(job.department_id, job.division_id, "#edit_division_id");
                });

                editJobModal.show();
            },
            error: function () {
                alert("Failed to fetch job data.");
            },
            complete: function () {
                showLoader("edit", false);
            }
        });
    });

    // Event handler tombol delete
    $(document).on("click", ".btn-delete", function () {
        const jobId = $(this).data("id");
        const jobName = $(this).data("name");
        const jobStatus = $(this).data("status");
        const jobDescription = $(this).data("description");

        // Set data ke form delete
        $("#deleteJobForm").data("jobId", jobId);
        $("#delete_job_name").val(jobName);
        $("#delete_status").val(jobStatus);
        $("#delete_description").val(jobDescription);

        // Tampilkan modal
        const deleteJobModal = new bootstrap.Modal(document.getElementById("deleteJobModal"));
        deleteJobModal.show();
    });

    // Delete Job form submit
    $("#deleteJobForm").submit(function (e) {
        e.preventDefault();
        var jobId = $("#deleteJobForm").data("jobId");

        showLoader("delete", true);

        $.ajax({
            url: appUrl + "/job/" + jobId,
            type: "DELETE",
            headers: {
                "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
            },
            success: function (response) {
                showLoader("delete", false);
                $(".alert-delete-container").empty();
                var alertHtml =
                    '<div class="alert alert-success alert-dismissible fade show d-flex justify-content-between align-items-center" role="alert" style="margin-bottom:0;">' +
                    "<div>" +
                    response.message +
                    "</div>" +
                    '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>' +
                    "</div>";
                $(".alert-delete-container").append(alertHtml);
                $(".alert-delete-container").show();
                setTimeout(function () {
                    $(".alert-delete-container .alert").alert("close");
                }, 1500);
                $('#jobTableBody tr[data-id="' + jobId + '"]').remove();
                var deleteJobModalEl =
                    document.getElementById("deleteJobModal");
                var deleteJobModal =
                    bootstrap.Modal.getInstance(deleteJobModalEl);
                deleteJobModal.hide();
                location.reload();
            },
            error: function (xhr) {
                showLoader("delete", false);
                var errorMsg = "Failed to delete job.";
                if (
                    xhr.status === 422 &&
                    xhr.responseJSON &&
                    xhr.responseJSON.errors
                ) {
                    errorMsg = Object.values(xhr.responseJSON.errors).join(
                        "<br>"
                    );
                }
                $(".alert-delete-container")
                    .html(
                        '<div class="alert alert-danger alert-dismissible fade show d-flex justify-content-between align-items-center" role="alert">' +
                            errorMsg +
                            '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>' +
                            "</div>"
                    )
                    .show();
            },
        });
    });
});

// Change event handler to use event delegation for dynamic elements
$(document).on("change", "#department_id", function () {
    var departmentId = $(this).val();
    loadDivisionsDropdown(departmentId);
});
