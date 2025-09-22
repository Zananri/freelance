var appUrl = $('meta[name="app-url"]').attr("content");

// selectedStatus is declared within the ready handler below

var editDivisionModal = new bootstrap.Modal(
    document.getElementById("editDivisionModal")
);

var addDivisionModal;

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

function readURL(input, labelSelector) {
    if (input.files && input.files[0]) {
        var reader = new FileReader();

        reader.onload = function (e) {
            $(labelSelector)
                .css("background-image", "url(" + e.target.result + ")")
                .css("background-size", "cover");
        };

        reader.readAsDataURL(input.files[0]);
    }
}

$(document).ready(function () {
    if ($("#editDivisionForm input[name='remove_image']").length === 0) {
        $("#editDivisionForm").append(
            '<input type="hidden" name="remove_image" id="edit_remove_image" value="0">'
        );
    }

    var addDivisionModal = new bootstrap.Modal(
        document.getElementById("addDivisionModal")
    );
    var editDivisionModal = new bootstrap.Modal(
        document.getElementById("editDivisionModal")
    );
    var deleteDivisionModal = new bootstrap.Modal(
        document.getElementById("deleteDivisionModal")
    );

    $("#editDivisionModal").on("hidden.bs.modal", function () {
        $("#edit_image").val("");
        $("#editImageLabel").css({
            "background-image":
                "url('" + appUrl + "/asset/img/background/add-image.png')",
            "background-position": "center center",
            "background-repeat": "no-repeat",
            "background-size": "50%",
            opacity: "0.5",
        });
        $("#editImageClearBtn").addClass("d-none");
        $("#editImageLabel").removeClass("is-valid is-invalid");
        $("#edit_image").removeClass("is-valid is-invalid");
        $("#edit_remove_image").val("0");
    });

    function readURL(input, labelSelector) {
        if (input.files && input.files[0]) {
            var reader = new FileReader();
            reader.onload = function (e) {
                $(labelSelector)
                    .css("background-image", "url(" + e.target.result + ")")
                    .css("background-size", "cover");
            };
            reader.readAsDataURL(input.files[0]);
        }
    }

    function toggleImageLabelHasImage(inputId, labelId, clearBtnId) {
        const input = document.getElementById(inputId);
        const label = document.getElementById(labelId);
        const clearBtn = document.getElementById(clearBtnId);

        function updateLabel() {
            if (input.files && input.files.length > 0) {
                label.classList.add("has-image");
                clearBtn.classList.remove("d-none");
            } else {
                label.classList.remove("has-image");
                clearBtn.classList.add("d-none");
            }
        }

        updateLabel();

        input.addEventListener("change", updateLabel);

        clearBtn.addEventListener("click", function (e) {
            e.preventDefault();
            input.value = "";
            updateLabel();
        });
    }

    toggleImageLabelHasImage("image", "imageLabel", "imageClearBtn");
    toggleImageLabelHasImage(
        "edit_image",
        "editImageLabel",
        "editImageClearBtn"
    );

    function loadDepartmentsDropdown(callback) {
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
                        '">' +
                        department.name_department +
                        "</option>";
                });
                $("#department_id").html(options);
                $("#edit_department_id").html(options);
                if (callback && typeof callback === "function") {
                    callback();
                }
            },
        });
    }

    function loadDepartmentsFilter() {
        $.ajax({
            url: appUrl + "/department/index",
            type: "GET",
            success: function (response) {
                var departments = response.data;
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
        $("#imageLabel").css({
            "background-image":
                "url('" + appUrl + "/asset/img/background/add-image.png')",
            "background-position": "center center",
            "background-repeat": "no-repeat",
            "background-size": "50%",
            opacity: "0.5",
        });
        $("#imageClearBtn").addClass("d-none");
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
        if (this.files && this.files[0]) {
            $("#imageClearBtn").removeClass("d-none");
            $("#imageLabel").css({
                "background-size": "cover",
                opacity: "1",
            });
        } else {
            $("#imageClearBtn").addClass("d-none");
            $("#imageLabel").css({
                "background-image":
                    "url('" + appUrl + "/asset/img/background/add-image.png')",
                "background-position": "center center",
                "background-repeat": "no-repeat",
                "background-size": "50%",
                opacity: "0.5",
            });
        }
        if (this.checkValidity()) {
            $("#imageLabel").removeClass("is-invalid").addClass("is-valid");
        } else {
            $("#imageLabel").removeClass("is-valid").addClass("is-invalid");
        }
    });

    $("#imageClearBtn").on("click", function (e) {
        e.preventDefault();
        $("#image").val("");
        $("#imageLabel").css({
            "background-image":
                "url('" + appUrl + "/asset/img/background/add-image.png')",
            "background-position": "center center",
            "background-repeat": "no-repeat",
            "background-size": "50%",
            opacity: "0.5",
        });
        $("#imageClearBtn").addClass("d-none");
        $("#imageLabel").removeClass("is-valid is-invalid");
        $("#image").removeClass("is-valid is-invalid");
    });

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
        $("#editImageClearBtn").addClass("d-none");

        var bgImage = $("#editImageLabel").css("background-image");
        if (
            !bgImage ||
            bgImage === "none" ||
            bgImage.indexOf("add-image.png") !== -1
        ) {
            $("#editImageLabel").css("opacity", "0.5");
        } else {
            $("#editImageLabel").css("opacity", "1");
        }
    });

    $("#edit_image").change(function () {
        readURL(this, "#editImageLabel");
        if (this.files && this.files[0]) {
            $("#editImageClearBtn").removeClass("d-none");
            $("#editImageLabel").css({
                "background-size": "cover",
                opacity: "1",
            });
        } else {
            $("#editImageClearBtn").addClass("d-none");
            $("#editImageLabel").css({
                "background-image":
                    "url('" + appUrl + "/asset/img/background/add-image.png')",
                "background-position": "center center",
                "background-repeat": "no-repeat",
                "background-size": "50%",
                opacity: "0.5",
            });
        }
        if (this.checkValidity()) {
            $("#editImageLabel").removeClass("is-invalid").addClass("is-valid");
            $("#editImageLabel").next(".invalid-feedback").hide();
        } else {
            $("#editImageLabel").removeClass("is-valid").addClass("is-invalid");
            $("#editImageLabel").next(".invalid-feedback").show();
        }
    });

    $("#editImageClearBtn").on("click", function (e) {
        e.preventDefault();
        $("#edit_image").val("");
        $("#editImageLabel").css({
            "background-image":
                "url('" + appUrl + "/asset/img/background/add-image.png')",
            "background-position": "center center",
            "background-repeat": "no-repeat",
            "background-size": "50%",
            opacity: "0.5",
        });
        $("#editImageClearBtn").addClass("d-none");
        $("#edit_image_preview").hide();
        $("#editImageLabel").removeClass("is-valid is-invalid");
        $("#edit_image").removeClass("is-valid is-invalid");
        $("#edit_remove_image").val("1");
    });

    $("#editImageClearBtn").on("click", function (e) {
        e.preventDefault();
        $("#edit_image").val("");
        $("#editImageLabel").css({
            "background-image":
                "url('" + appUrl + "/asset/img/background/add-image.png')",
            "background-position": "center center",
            "background-repeat": "no-repeat",
            "background-size": "50%",
        });
        $("#edit_image_preview img").hide();
        $("#editImageClearBtn").addClass("d-none");
        $("#editImageLabel").removeClass("is-valid is-invalid");
        $("#edit_image").removeClass("is-valid is-invalid");
    });

    // Note: Single .btn-edit handler is defined below to avoid duplicates




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

        if (!isValid) {
            e.stopPropagation();
            $(form).addClass("was-validated");
            return false;
        }
        $(form).removeClass("was-validated");

        showLoader("add", true);

        var formData = new FormData(form);

        $.ajax({
            url: appUrl + "/division/store",
            type: "POST",
            data: formData,
            contentType: false,
            processData: false,
            headers: {
                "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
            },
            success: function (response) {
                showLoader("add", false);
                showFloatingAlert(response.message || 'Division created successfully.', 'success', 1500);
                loadDivisions();
                setTimeout(function () {
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
                    var listHtml = '<ul style="margin:0; padding-left:18px;">';
                    $.each(errors, function (key, value) {
                        if (Array.isArray(value)) { value.forEach(function(msg){ listHtml += '<li>'+msg+'</li>'; }); }
                        else { listHtml += '<li>'+value+'</li>'; }
                    });
                    listHtml += '</ul>';
                    showFloatingAlert(listHtml, 'warning', 5000);
                } else {
                    showFloatingAlert("An error occurred. Please try again.", 'warning', 3500);
                }
            },
        });
    });

    // Unified Edit handler
    $(document).on("click", ".btn-edit", function () {
        var id = $(this).data("id");
        loadDepartmentsDropdown(function () {
            $.ajax({
                url: appUrl + "/division/" + id,
                type: "GET",
                success: function (response) {
                    // Some endpoints return {code, data}, others return raw entity
                    var division = response && response.data ? response.data : response;
                    if (!division || (response && response.code && response.code !== 200)) {
                        showFloatingAlert((response && response.message) || "Failed to fetch division data.", 'warning', 3500);
                        return;
                    }

                    $("#edit_division_id").val(division.id);
                    $("#edit_department_id").val(division.department_id);
                    $("#edit_name_division").val(division.name_division);
                    $("#edit_status").val(division.status);
                    $("#edit_description").val(division.description || '');

                    // Reset validation
                    $("#editDivisionForm").removeClass("was-validated");
                    $("#editDivisionForm .is-invalid").removeClass("is-invalid");
                    $("#editDivisionForm .is-valid").removeClass("is-valid");

                    // Image handling
                    var imgUrl = division.image_url || (division.images ? (appUrl + '/file/division/' + division.images) : null);
                    if (imgUrl) {
                        $("#editImageLabel").css({
                            "background-image": "url('" + imgUrl + "')",
                            "background-position": "center center",
                            "background-repeat": "no-repeat",
                            "background-size": "cover",
                            "opacity": "1"
                        });
                        $("#editImageClearBtn").removeClass("d-none");
                    } else {
                        $("#editImageLabel").css({
                            "background-image": "url('" + appUrl + "/asset/img/background/add-image.png')",
                            "background-position": "center center",
                            "background-repeat": "no-repeat",
                            "background-size": "50%",
                            "opacity": "0.5"
                        });
                        $("#editImageClearBtn").addClass("d-none");
                    }

                    $("#edit_remove_image").val("0");
                    $("#edit_image").val("");

                    $("#editDivisionForm").data("id", id);
                    editDivisionModal.show();
                },
                error: function () {
                    showFloatingAlert("Failed to fetch division data.", 'warning', 3500);
                },
            });
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
        formData.append("_method", "PUT");

        showLoader("edit", true);

        $.ajax({
            url: appUrl + "/division/" + id,
            type: "POST",
            data: formData,
            contentType: false,
            processData: false,
            headers: {
                "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
            },
            success: function (response) {
                showLoader("edit", false);
                showFloatingAlert(response.message || 'Division updated successfully.', 'success', 1500);
                loadDivisions();
                setTimeout(function () {
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
                    var listHtml = '<ul style="margin:0; padding-left:18px;">';
                    $.each(errors, function (key, value) {
                        if (Array.isArray(value)) { value.forEach(function(msg){ listHtml += '<li>'+msg+'</li>'; }); }
                        else { listHtml += '<li>'+value+'</li>'; }
                    });
                    listHtml += '</ul>';
                    showFloatingAlert(listHtml, 'warning', 5000);
                } else {
                    showFloatingAlert("An error occurred. Please try again.", 'warning', 3500);
                }
                showLoader("edit", false);
            },
        });
    });

    $(document).on("click", ".btn-delete", function () {
        var id = $(this).data("id");
        $.ajax({
            url: appUrl + "/division/" + id,
            type: "GET",
            success: function (division) {
                $("#delete_department_name").val(
                    division.department
                        ? division.department.name_department
                        : ""
                );
                $("#delete_name_division").val(division.name_division);
                $("#delete_status").val(division.status);
                $("#delete_description").val(division.description);
                if (division.image_url) {
                    $("#deleteImageLabel").css({
                        "background-image": "url(" + division.image_url + ")",
                        "background-position": "center center",
                        "background-repeat": "no-repeat",
                        "background-size": "cover",
                        opacity: "1",
                    });
                } else {
                    $("#deleteImageLabel").css({
                        "background-image":
                            "url('" +
                            appUrl +
                            "/asset/img/background/add-image.png')",
                        "background-position": "center center",
                        "background-repeat": "no-repeat",
                        "background-size": "50%",
                        opacity: "0.5",
                    });
                }
                $("#deleteDivisionForm").data("id", id);
                deleteDivisionModal.show();
            },
            error: function () {
                showFloatingAlert("Failed to fetch division data.", 'warning', 3500);
            },
        });
    });

    $("#deleteDivisionForm").submit(function (e) {
        e.preventDefault();
        var id = $("#deleteDivisionForm").data("id");

        showLoader("delete", true);

        $.ajax({
            url: appUrl + "/division/" + id,
            type: "DELETE",
            headers: {
                "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
            },
            success: function (response) {
                showLoader("delete", false);
                showFloatingAlert(response.message || 'Division deleted successfully.', 'success', 1200);
                $('#divisionTableBody tr[data-id="' + id + '"]').remove();
                var deleteDivisionModalEl = document.getElementById(
                    "deleteDivisionModal"
                );
                var deleteDivisionModal = bootstrap.Modal.getInstance(
                    deleteDivisionModalEl
                );
                deleteDivisionModal.hide();
                setTimeout(function(){ location.reload(); }, 1200);
            },
            error: function () {
                showLoader("delete", false);
                showFloatingAlert("Failed to delete division.", 'warning', 3500);
            },
        });
    });

function loadDivisions(query = "", status = "ALL", departmentId = "") {
$.ajax({
            url: appUrl + "/division/index",
            type: "GET",
            data: { query: query, status: status, department_id: departmentId },
            success: function (response) {
                var divisions = response.data;
                var rowHtml = "";
                if (divisions.length === 0) {
                    rowHtml =
                        '<tr><td colspan="5" class="text-center">No Data</td></tr>';
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
                        var imageHtml = "";
                        if (division.image_url) {
                            imageHtml =
                                '<img src="' +
                                division.image_url +
                                '" alt="Division Image" class="table-image" />';
                        } else {
                            imageHtml = "";
                        }
                        rowHtml +=
                            '<tr data-id="' +
                            division.id +
                            '">' +
                            "<td>" +
                            imageHtml +
                            "</td>" +
                            "<td>" +
                            division.name_division +
                            "</td>" +
                            "<td>" +
                            (division.department
                                ? division.department.name_department
                                : "") +
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
                    '<tr><td colspan="5" class="text-center">Failed to load data</td></tr>'
                );
                showFloatingAlert('Failed to load divisions.', 'warning', 3500);
            },
        });
    }

    $("#searchInput").on("keydown", function (e) {
        if (e.key === "Enter") {
            e.preventDefault();
            var query = $(this).val();
            var filterType = $("#filterTypeSelect").val();

            if (filterType === "status") {
                var status =
                    $("#statusFilterOptions .filter-option.active").data("status") || "ALL";
                loadDivisions(query, status, "");
            } else if (filterType === "department") {
                var departmentId =
                    $("#departmentFilterOptions .department-filter-option.active").data("department") || "";
                loadDivisions(query, "ALL", departmentId);
            } else {
                loadDivisions(query, "ALL", "");
            }
        }
    });

    var selectedStatus = "ALL";

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

    $("#filterTypeSelect").change(function () {
        var filterType = $(this).val();
        if (filterType === "status") {
            $("#statusFilterOptions").removeClass("d-none");
            $("#departmentFilterOptions").addClass("d-none");
            $("#statusFilterOptions a.filter-option").removeClass("active");
            selectedStatus = "";
        } else if (filterType === "department") {
            $("#departmentFilterOptions").removeClass("d-none");
            $("#statusFilterOptions").addClass("d-none");
            $(
                "#departmentFilterOptions a.department-filter-option"
            ).removeClass("active");
        }
    });

    loadDivisions("", selectedStatus, "");
});
