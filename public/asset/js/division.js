var appUrl = $('meta[name="app-url"]').attr("content");

$(document).ready(function () {
    var addDivisionModal = new bootstrap.Modal(
        document.getElementById("addDivisionModal")
    );
    var editDivisionModal = new bootstrap.Modal(
        document.getElementById("editDivisionModal")
    );
    var deleteDivisionModal = new bootstrap.Modal(
        document.getElementById("deleteDivisionModal")
    );

    // Tambahkan di sini (setelah deklarasi modal dan sebelum event submit)
    function readURL(input, labelSelector) {
        if (input.files && input.files[0]) {
            var reader = new FileReader();
            reader.onload = function (e) {
                $(labelSelector).css(
                    "background-image",
                    "url(" + e.target.result + ")"
                );
            };
            reader.readAsDataURL(input.files[0]);
        }
    }

    // Remove page reload on alert close to match department.js behavior
    // $(document).on(
    //     "closed.bs.alert",
    //     "#addDivisionModal .alert-container .alert, #editDivisionModal .alert-container .alert",
    //     function () {
    //         location.reload();
    //     }
    // );

    // Load departments for dropdowns
    function loadDepartmentsDropdown() {
        $.ajax({
            url: appUrl + "/departments",
            type: "GET",
            success: function (departments) {
                var options =
                    '<option value="" disabled selected>Select Department</option>';
                $.each(departments, function (index, department) {
                    options +=
                        '<option value="' +
                        department.id +
                        '">' +
                        department.name_department +
                        "</option>";
                });
                $("#department_id").html(options);
                $("#edit_department_id").html(options);
            },
        });
    }

    // Load departments for filter dropdown into #departmentFilterOptions
    function loadDepartmentsFilter() {
        $.ajax({
            url: appUrl + "/departments",
            type: "GET",
            success: function (departments) {
                var menuHtml =
                    '<a class="dropdown-item department-filter-option active" href="#" data-department="">All Departments</a>';
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

    loadDepartmentsDropdown();
    loadDepartmentsFilter();

    $("#btnAddData").click(function () {
        $("#imageLabel").css(
            "background-image",
            "url('/asset/img/background/add-image.png')"
        );
        $("#addDivisionModal .alert-container").empty();
        var form = $("#addDivisionForm")[0];
        form.reset();
        $(form).removeClass("was-validated");
        $("#department_id").removeClass("is-valid is-invalid");
        $("#name_division").removeClass("is-valid is-invalid");
        $("#status").removeClass("is-valid is-invalid");
        $("#description").removeClass("is-valid is-invalid");
        $("#image").removeClass("is-valid is-invalid");
        $("#imageLabel").removeClass("is-valid is-invalid");
        $("#imageLabel").next(".invalid-feedback").hide();
        addDivisionModal.show();
    });

    // Real-time validation for addDivisionForm inputs
    $("#department_id, #name_division, #description, #status, #image").on(
        "input change",
        function () {
            var input = $(this)[0];
            if (input.checkValidity()) {
                $(this).removeClass("is-invalid").addClass("is-valid");
                if (this.id === "image") {
                    $("#imageLabel")
                        .removeClass("is-invalid")
                        .addClass("is-valid");
                    $("#imageLabel").next(".invalid-feedback").hide();
                }
            } else {
                $(this).removeClass("is-valid").addClass("is-invalid");
                if (this.id === "image") {
                    $("#imageLabel")
                        .removeClass("is-valid")
                        .addClass("is-invalid");
                    $("#imageLabel").next(".invalid-feedback").show();
                }
            }
            $("#addDivisionForm").removeClass("was-validated");
        }
    );

    $("#image").change(function () {
        readURL(this, "#imageLabel");
        if (this.checkValidity()) {
            $("#imageLabel").removeClass("is-invalid").addClass("is-valid");
        } else {
            $("#imageLabel").removeClass("is-valid").addClass("is-invalid");
        }
    });

    $("#remove_image_btn").on("click", function () {
        $("#image").val("");
        $("#image_preview img").hide();
        $(this).hide();
        $("#image").removeClass("is-valid is-invalid");
    });

    // Real-time validation for editDivisionForm inputs
    $(
        "#edit_department_id, #edit_name_division, #edit_description, #edit_status"
    ).on("input change", function () {
        var input = $(this)[0];
        if (input.checkValidity()) {
            $(this).removeClass("is-invalid").addClass("is-valid");
        } else {
            $(this).removeClass("is-valid").addClass("is-invalid");
        }
        $("#editDivisionForm").removeClass("was-validated");
    });

    $("#editDivisionModal").on("show.bs.modal", function () {
        $("#editImageLabel").removeClass("is-valid is-invalid");
        $("#editImageLabel").next(".invalid-feedback").hide();
    });

    $("#edit_image").change(function () {
        readURL(this, "#editImageLabel");
        if (this.checkValidity()) {
            $("#editImageLabel").removeClass("is-invalid").addClass("is-valid");
            $("#editImageLabel").next(".invalid-feedback").hide();
        } else {
            $("#editImageLabel").removeClass("is-valid").addClass("is-invalid");
            $("#editImageLabel").next(".invalid-feedback").show();
        }
    });

    $(document).on("click", ".btn-edit", function () {
        var id = $(this).data("id");
        $.ajax({
            url: appUrl + "/divisions/" + id,
            type: "GET",
            success: function (division) {
                if (division.images) {
                    $("#editImageLabel").css(
                        "background-image",
                        "url('/file/division/" + division.images + "')"
                    );
                } else {
                    $("#editImageLabel").css(
                        "background-image",
                        "url('/asset/img/background/add-image.png')"
                    );
                }
            },
        });
    });

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

    $("#addDivisionForm").submit(function (e) {
        e.preventDefault();

        var form = this;
        var imageInput = $("#image")[0];
        var isValid = form.checkValidity();

        // Manual validation for hidden file input
        if (!imageInput.value) {
            $("#imageLabel").addClass("is-invalid");
            $("#imageLabel").next(".invalid-feedback").show();
            isValid = false;
        } else {
            $("#imageLabel").removeClass("is-invalid");
            $("#imageLabel").next(".invalid-feedback").hide();
        }

        if (!isValid) {
            e.stopPropagation();
            $(form).addClass("was-validated");
            return false;
        }
        $(form).removeClass("was-validated");

        showLoader("add", true);

        var formData = new FormData(form);

        $.ajax({
            url: appUrl + "/divisions",
            type: "POST",
            data: formData,
            contentType: false,
            processData: false,
            headers: {
                "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
            },
            success: function (response) {
                showLoader("add", false);
                $("#addDivisionModal .alert-container").empty();
                var alertHtml =
                    '<div class="alert alert-success alert-dismissible fade show d-flex justify-content-between align-items-center" role="alert" style="margin-bottom:0;">' +
                    "<div>" +
                    response.message +
                    "</div>" +
                    "</div>";
                $("#addDivisionModal .alert-container").append(alertHtml);
                $("#addDivisionModal .alert-container").show();
                loadDivisions();
                setTimeout(function () {
                    $("#addDivisionModal .alert-container .alert").alert(
                        "close"
                    );
                    var addDivisionModalEl =
                        document.getElementById("addDivisionModal");
                    var addDivisionModal =
                        bootstrap.Modal.getInstance(addDivisionModalEl);
                    addDivisionModal.hide();
                }, 1500);
            },
            error: function (xhr) {
                showLoader("add", false);
                if (xhr.status === 422) {
                    var errors = xhr.responseJSON.errors;
                    var errorMessages = "";
                    $.each(errors, function (key, value) {
                        errorMessages += value + "\\n";
                    });
                    alert(errorMessages);
                } else {
                    alert("An error occurred. Please try again.");
                }
            },
        });
    });

    $(document).on("click", ".btn-edit", function () {
        var id = $(this).data("id");
        $.ajax({
            url: appUrl + "/divisions/" + id,
            type: "GET",
            success: function (division) {
                $("#edit_division_id").val(division.id);
                $("#edit_department_id").val(division.department_id);
                $("#edit_name_division").val(division.name_division);
                $("#edit_status").val(division.status);
                $("#edit_description").val(division.description);
                if (division.images) {
                    $("#edit_image_preview img")
                        .attr("src", "/file/division/" + division.images)
                        .show();
                } else {
                    $("#edit_image_preview img").hide();
                }
                $("#editDivisionForm").data("id", id);
                editDivisionModal.show();
            },
            error: function () {
                alert("Failed to fetch division data.");
            },
        });
    });

    $("#editDivisionForm").submit(function (e) {
        e.preventDefault();
        var id = $("#edit_division_id").val();
        var form = this;
        var isValid = form.checkValidity();

        if (!isValid) {
            e.stopPropagation();
            $(form).addClass("was-validated");
            return false;
        }
        $(form).removeClass("was-validated");

        var formData = new FormData(form);
        // Add _method=PUT to formData to match Laravel route
        formData.append("_method", "PUT");

        showLoader("edit", true);

        $.ajax({
            url: appUrl + "/divisions/" + id,
            type: "POST",
            data: formData,
            contentType: false,
            processData: false,
            headers: {
                "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
            },
            success: function (response) {
                showLoader("edit", false);
                $("#editDivisionModal .alert-container").empty();
                var alertHtml =
                    '<div class="alert alert-success alert-dismissible fade show d-flex justify-content-between align-items-center" role="alert" style="margin-bottom:0;">' +
                    "<div>" +
                    response.message +
                    "</div>" +
                    "</div>";
                $("#editDivisionModal .alert-container").append(alertHtml);
                $("#editDivisionModal .alert-container").show();
                loadDivisions();
                setTimeout(function () {
                    $("#editDivisionModal .alert-container .alert").alert(
                        "close"
                    );
                    var editDivisionModalEl =
                        document.getElementById("editDivisionModal");
                    var editDivisionModal =
                        bootstrap.Modal.getInstance(editDivisionModalEl);
                    editDivisionModal.hide();
                }, 1500);
            },
            error: function (xhr) {
                if (xhr.status === 422) {
                    var errors = xhr.responseJSON.errors;
                    var errorMessages = "";
                    $.each(errors, function (key, value) {
                        errorMessages += value + "\\n";
                    });
                    alert(errorMessages);
                } else {
                    alert("An error occurred. Please try again.");
                }
                showLoader("edit", false);
            },
        });
    });

    $(document).on("click", ".btn-delete", function () {
        var id = $(this).data("id");
        $.ajax({
            url: appUrl + "/divisions/" + id,
            type: "GET",
            success: function (division) {
                $("#delete_name_division").val(division.name_division);
                $("#deleteDivisionForm").data("id", id);
                deleteDivisionModal.show();
            },
            error: function () {
                alert("Failed to fetch division data.");
            },
        });
    });

    $("#deleteDivisionForm").submit(function (e) {
        e.preventDefault();
        var id = $("#deleteDivisionForm").data("id");

        showLoader("delete", true);

        $.ajax({
            url: appUrl + "/divisions/" + id,
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
                $('#divisionTableBody tr[data-id="' + id + '"]').remove();
                var deleteDivisionModalEl = document.getElementById(
                    "deleteDivisionModal"
                );
                var deleteDivisionModal = bootstrap.Modal.getInstance(
                    deleteDivisionModalEl
                );
                deleteDivisionModal.hide();
            },
            error: function () {
                showLoader("delete", false);
                alert("Failed to delete division.");
            },
        });
    });

    // Load divisions with optional search and filter
    function loadDivisions(query = "", status = "ALL", departmentId = "") {
        $.ajax({
            url: appUrl + "/divisions",
            type: "GET",
            data: { query: query, status: status, department_id: departmentId },
            success: function (divisions) {
                var rowHtml = "";
                if (divisions.length === 0) {
                    rowHtml =
                        '<tr><td colspan="4" class="text-center">No Data</td></tr>';
                } else {
                    $.each(divisions, function (index, division) {
                        var statusText =
                            division.status === "ACTIVE"
                                ? "ACTIVE"
                                : division.status;
                        var statusClass =
                            division.status === "ACTIVE"
                                ? "status-ACTIVE"
                                : "status-INACTIVE";
                        if (division.status === "DELETED") {
                            statusText = "DELETED";
                            statusClass = "status-DELETED";
                        }
                        rowHtml +=
                            '<tr data-id="' +
                            division.id +
                            '">' +
                            "<td>" +
                            (division.department
                                ? division.department.name_department
                                : "") +
                            "</td>" +
                            "<td>" +
                            division.name_division +
                            "</td>" +
                            '<td><span class="' +
                            statusClass +
                            '">' +
                            statusText +
                            "</span></td>" +
                            '<td class="text-end">' +
                            '<button class="btn btn-sm btn-edit" data-id="' +
                            division.id +
                            '"><span class="material-symbols-outlined">edit</span></button> ' +
                            '<button class="btn btn-sm btn-delete" data-id="' +
                            division.id +
                            '"><span class="material-symbols-outlined">delete</span></button>' +
                            "</td>" +
                            "</tr>";
                    });
                }
                $("#divisionTableBody").html(rowHtml);
            },
            error: function () {
                $("#divisionTableBody").html(
                    '<tr><td colspan="4" class="text-center">Failed to load data</td></tr>'
                );
            },
        });
    }

    // Trigger search dynamically as user types
    $("#searchInput").on("input", function () {
        var query = $(this).val();
        var filterType = $("#filterTypeSelect").val();
        if (filterType === "status") {
            var status =
                $("#statusFilterOptions .filter-option.active").data(
                    "status"
                ) || "ALL";
            loadDivisions(query, status, "");
        } else if (filterType === "department") {
            var departmentId =
                $(
                    "#departmentFilterOptions .department-filter-option.active"
                ).data("department") || "";
            loadDivisions(query, "ALL", departmentId);
        } else {
            loadDivisions(query, "ALL", "");
        }
    });

    var selectedStatus = "ALL";

    // Handle filter option click for status
    $(document).on("click", ".filter-option", function (e) {
        e.preventDefault();
        $(".filter-option").removeClass("active");
        $(this).addClass("active");
        selectedStatus = $(this).data("status");

        var query = $("#searchInput").val();
        var filterType = $("#filterTypeSelect").val();
        if (filterType === "status") {
            loadDivisions(query, selectedStatus, "");
        } else if (filterType === "department") {
            var selectedDepartmentId =
                $("#departmentFilterOptions a.active").data("department") || "";
            loadDivisions(query, "ALL", selectedDepartmentId);
        }
    });

    // Handle filter option click for department
    $(document).on("click", ".department-filter-option", function (e) {
        e.preventDefault();
        $("#departmentFilterOptions a.department-filter-option").removeClass(
            "active"
        );
        $(this).addClass("active");

        var query = $("#searchInput").val();
        var selectedDepartmentId = $(this).data("department") || "";
        loadDivisions(query, "ALL", selectedDepartmentId);
    });

    // Handle filter type dropdown change
    $("#filterTypeSelect").change(function () {
        var filterType = $(this).val();
        if (filterType === "status") {
            $("#statusFilterOptions").removeClass("d-none");
            $("#departmentFilterOptions").addClass("d-none");
            // Remove active class from all status filter options
            $("#statusFilterOptions a.filter-option").removeClass("active");
            // Reset selectedStatus to empty to indicate no selection
            selectedStatus = "";
            // Do not reload divisions until user selects a status option
        } else if (filterType === "department") {
            $("#departmentFilterOptions").removeClass("d-none");
            $("#statusFilterOptions").addClass("d-none");
            // Remove active class from all department filter options
            $(
                "#departmentFilterOptions a.department-filter-option"
            ).removeClass("active");
            // Do not reload divisions until user selects a department option
        }
    });

    // Initial load
    loadDivisions("", selectedStatus, "");
});
