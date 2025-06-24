var appUrl = $('meta[name="app-url"]').attr("content");

var selectedStatus = "ALL";

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
        url: appUrl + "/departments",
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
        url: appUrl + "/divisions",
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

// Change event handler to use event delegation for dynamic elements
$(document).on("change", "#department_id", function () {
    var departmentId = $(this).val();
    loadDivisionsDropdown(departmentId);
});

function loadJobs() {
    $.ajax({
        url: appUrl + "/jobs",
        type: "GET",
        data: {
            query: $("#searchInput").val() || "",
            status: selectedStatus,
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
                        ? `<span class="badge" style="
            background-color: #28a745;
            color: white;
            font-weight: 600;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 10px;
            display: inline-block;
            text-align: center;
        ">Active</span>`
                        : `<span class="badge" style="
            background-color: #6c757d;
            color: white;
            font-weight: 600;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 10px;
            display: inline-block;
            text-align: center;
        ">Inactive</span>`;

                tbody.append(`
                    <tr data-id="${job.id}">
                        <td>${job.department?.name_department || "-"}</td>
                        <td>${job.division?.name_division || "-"}</td>
                        <td>${job.job_name}</td>
                        <td>${statusBadge}</td>
                        <td class="text-end">
                            <button class="btn-edit" data-id="${job.id}">
                                <i class="material-symbols-outlined">edit</i>
                            </button>
                            <button class="btn-delete" data-id="${
                                job.id
                            }" data-name="${job.job_name}" data-status="${
                    job.status
                }" data-description="${job.description || ""}">
                                <i class="material-symbols-outlined">delete</i>
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

    loadJobs(); // Load job data on page load

    $("#editJobModal").on("hidden.bs.modal", function () {
        $("#editJobForm")[0].reset();
        $("#editJobForm").removeClass("was-validated");
        $("#editJobModal .alert-container").empty();
        $("#editModalLoader").addClass("d-none");
    });

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
            url: appUrl + "/jobs",
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
            url: appUrl + "/jobs/" + jobId,
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

    // Delete Job form submit
    $("#deleteJobForm").submit(function (e) {
        e.preventDefault();
        var jobId = $("#deleteJobForm").data("jobId");

        showLoader("delete", true);

        $.ajax({
            url: appUrl + "/jobs/" + jobId,
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
