var appUrl = $('meta[name="app-url"]').attr("content");

var selectedStatus = "ALL";

var editDepartmentModal = new bootstrap.Modal(
    document.getElementById("editDepartmentModal")
);

var addDepartmentModal;

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
    if ($("#editDepartmentForm input[name='remove_image']").length === 0) {
        $("#editDepartmentForm").append(
            '<input type="hidden" name="remove_image" id="edit_remove_image" value="0">'
        );
    }

    addDepartmentModal = new bootstrap.Modal(
        document.getElementById("addDepartmentModal")
    );

    $("#editDepartmentModal").on("hidden.bs.modal", function () {
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
    });

    function resetAddDepartmentForm() {
        $("#addDepartmentModal .alert-container").empty();
        var form = $("#addDepartmentForm")[0];
        form.reset();
        $(form).removeClass("was-validated");
        $("#name_department, #description, #status, #image").removeClass(
            "is-valid is-invalid"
        );
        $("#imageLabel").removeClass("is-valid is-invalid");
        $("#imageLabel").css({
            "background-image":
                "url('" + appUrl + "/asset/img/background/add-image.png')",
            "background-position": "center center",
            "background-repeat": "no-repeat",
            "background-size": "50%",
            opacity: "0.5",
        });
        $("#imageLabel").removeClass("has-image");
        $("#imageClearBtn").addClass("d-none");
    }

    $("#btnAddData").on("click", function () {
        resetAddDepartmentForm();
        addDepartmentModal.show();
    });

    $("#editDepartmentModal").on("show.bs.modal", function () {
        $("#editDepartmentModal .alert-container").empty();
        $("#edit_name_department").removeClass("is-valid is-invalid");
        $("#edit_status").removeClass("is-valid is-invalid");
        $("#edit_description").removeClass("is-valid is-invalid");
        $("#edit_image").removeClass("is-valid is-invalid");
        $("#editModalLoader").addClass("d-none");

        var bgImage = $("#editImageLabel").css("background-image");
        if (
            !bgImage ||
            bgImage === "none" ||
            bgImage.indexOf("add-image.png") !== -1
        ) {
            $("#editImageLabel").css("opacity", "0.5");
            $("#editImageLabel").removeClass("is-valid is-invalid");
        } else {
            $("#editImageLabel").css("opacity", "1");
        }
    });

    $("#image").change(function () {
        readURL(this, "#imageLabel");
        if (this.checkValidity()) {
            $("#imageLabel").removeClass("is-invalid").addClass("is-valid");
        } else {
            $("#imageLabel").removeClass("is-valid").addClass("is-invalid");
        }
    });

    $("#edit_image").change(function () {
        readURL(this, "#editImageLabel");
        $("#edit_image_preview").hide();
        if (this.checkValidity()) {
            $("#editImageLabel").removeClass("is-invalid").addClass("is-valid");
        } else {
            $("#editImageLabel").removeClass("is-valid").addClass("is-invalid");
        }
        $("#edit_remove_image").val("0");
    });

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
        // Validasi
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
    });
    $("#image").removeClass("is-valid is-invalid");
    $("#imageLabel").removeClass("is-valid is-invalid");

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
        $("#edit_image_preview").hide();
        $("#editImageLabel").removeClass("is-valid is-invalid");
        $("#edit_image").removeClass("is-valid is-invalid");
        $("#editImageClearBtn").addClass("d-none");
        $("#edit_remove_image").val("1");
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
        } else {
            $("#editImageLabel").removeClass("is-valid").addClass("is-invalid");
        }
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

    $("#addDepartmentForm").submit(function (e) {
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
            url: appUrl + "/department/store",
            type: "POST",
            data: formData,
            contentType: false,
            processData: false,
            headers: {
                "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
            },
            success: function (response) {
                showLoader("add", false);
                showFloatingAlert(response.message || 'Department created successfully.', 'success', 1500);
                loadDepartments();
                setTimeout(function () {
                    var addDepartmentModalEl =
                        document.getElementById("addDepartmentModal");
                    var addDepartmentModal =
                        bootstrap.Modal.getInstance(addDepartmentModalEl);
                    addDepartmentModal.hide();
                }, 1500);
            },
            error: function (xhr) {
                showLoader("add", false);
                console.log("Add Department Error:", xhr);
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

    $(document).on("click", ".btn-edit", function () {
        var id = $(this).data("id");
        $.ajax({
            url: appUrl + "/department/" + id,
            type: "GET",
            success: function (department) {
                $("#edit_name_department").val(department.name_department);
                $("#edit_status").val(department.status);
                $("#edit_description").val(department.description);
                if (department.image_url) {
                    var imageUrl = department.image_url;
                    $("#editImageLabel").css({
                        "background-image": "url(" + imageUrl + ")",
                        "background-position": "center center",
                        "background-repeat": "no-repeat",
                        "background-size": "cover",
                        opacity: "1",
                    });
                    $("#editImageClearBtn").removeClass("d-none");
                    $("#edit_image_preview").hide();
                } else {
                    $("#editImageLabel").css({
                        "background-image":
                            "url('" +
                            appUrl +
                            "/asset/img/background/add-image.png')",
                        "background-position": "center center",
                        "background-repeat": "no-repeat",
                        "background-size": "50%",
                        opacity: "0.5",
                    });
                    $("#editImageClearBtn").addClass("d-none");
                    $("#edit_image_preview").hide();
                }
                $("#editDepartmentForm").data("id", id);
                editDepartmentModal.show();
            },
            error: function () {
                showFloatingAlert("Failed to fetch department data.", 'warning', 3000);
            },
        });
    });

    $("#editDepartmentForm").submit(function (e) {
        e.preventDefault();

        var id = $(this).data("id");
        var form = this;

        if (!form.checkValidity()) {
            e.stopPropagation();
            $(form).addClass("was-validated");
            return false;
        }
        $(form).removeClass("was-validated");

        var formData = new FormData(form);
        formData.append("_method", "PUT");

        showLoader("edit", true);

        $.ajax({
            url: appUrl + "/department/" + id,
            type: "POST",
            data: formData,
            contentType: false,
            processData: false,
            headers: {
                "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
            },
            success: function (response) {
                showLoader("edit", false);
                showFloatingAlert(response.message || 'Department updated successfully.', 'success', 1500);
                loadDepartments();
                setTimeout(function () {
                    var editDepartmentModalEl = document.getElementById(
                        "editDepartmentModal"
                    );
                    var editDepartmentModal = bootstrap.Modal.getInstance(
                        editDepartmentModalEl
                    );
                    editDepartmentModal.hide();
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

    $("#edit_name_department, #edit_status, #edit_description, #edit_image").on(
        "input change",
        function () {
            var input = $(this)[0];
            if (input.checkValidity()) {
                $(this).removeClass("is-invalid").addClass("is-valid");
                if (this.id === "edit_image") {
                    $("#editImageLabel")
                        .removeClass("is-invalid")
                        .addClass("is-valid");
                }
            } else {
                $(this).removeClass("is-valid").addClass("is-invalid");
                if (this.id === "edit_image") {
                    $("#editImageLabel")
                        .removeClass("is-valid")
                        .addClass("is-invalid");
                }
            }
            $("#editDepartmentForm").removeClass("was-validated");
        }
    );

    $("#name_department, #status, #description, #image").on(
        "input change",
        function () {
            var input = $(this)[0];
            if (input.checkValidity()) {
                $(this).removeClass("is-invalid").addClass("is-valid");
                if (this.id === "image") {
                    $("#imageLabel")
                        .removeClass("is-invalid")
                        .addClass("is-valid");
                }
            } else {
                $(this).removeClass("is-valid").addClass("is-invalid");
                if (this.id === "image") {
                    $("#imageLabel")
                        .removeClass("is-valid")
                        .addClass("is-invalid");
                }
            }
            $("#addDepartmentForm").removeClass("was-validated");
        }
    );

    $(document).on("click", ".btn-delete", function () {
        var id = $(this).data("id");
        $.ajax({
            url: appUrl + "/department/" + id,
            type: "GET",
            success: function (department) {
                $("#delete_name_department").val(department.name_department);
                $("#delete_status").val(department.status);
                $("#delete_description").val(department.description);
                if (department.image_url) {
                    $("#deleteImageLabel").css({
                        "background-image": "url(" + department.image_url + ")",
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
                $("#deleteDepartmentForm").data("id", id);
                var deleteDepartmentModal = new bootstrap.Modal(
                    document.getElementById("deleteDepartmentModal")
                );
                deleteDepartmentModal.show();
            },
            error: function () {
                showFloatingAlert("Failed to fetch department data.", 'warning', 3000);
            },
        });
    });

    $("#deleteDepartmentForm").submit(function (e) {
        e.preventDefault();
        var id = $(this).data("id");

        showLoader("delete", true);

        $.ajax({
            url: appUrl + "/department/" + id,
            type: "DELETE",
            headers: {
                "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
            },
            success: function (response) {
                showLoader("delete", false);
                showFloatingAlert(response.message || 'Department deleted successfully.', 'success', 1200);
                $('#departmentTableBody tr[data-id="' + id + '"]').remove();
                var deleteDepartmentModalEl = document.getElementById(
                    "deleteDepartmentModal"
                );
                var deleteDepartmentModal = bootstrap.Modal.getInstance(
                    deleteDepartmentModalEl
                );
                deleteDepartmentModal.hide();
                setTimeout(function(){ location.reload(); }, 1200);
            },
            error: function () {
                showLoader("delete", false);
                showFloatingAlert("Failed to delete department.", 'warning', 3500);
            },
        });
    });
});

    function loadDepartments(query = "", status = "ALL") {
        $.ajax({
            url: appUrl + "/department/index",
            type: "GET",
            data: { query: query, status: status },
            success: function (response) {
                var departments = response.data;
                var rowHtml = "";
                if (departments.length === 0) {
                    rowHtml =
                        '<tr><td colspan="4" class="text-center">No Data</td></tr>';
                } else {
                    $.each(departments, function (index, department) {
                        var statusText =
                            department.status === "ACTIVE"
                                ? "ACTIVE"
                                : department.status;
                        var statusClass =
                            department.status === "ACTIVE"
                                ? "status-ACTIVE"
                                : "status-INACTIVE";
                        if (department.status === "DELETED") {
                            statusText = "DELETED";
                            statusClass = "status-DELETED";
                        }
                        var imageHtml = "";
                        if (department.image_url) {
                            imageHtml =
                                '<img src="' +
                                department.image_url +
                                '" alt="Department Image" class="table-image" />';
                        } else {
                            imageHtml = "";
                        }
                        rowHtml +=
                            '<tr data-id="' +
                            department.id +
                            '">' +
                            "<td>" +
                            imageHtml +
                            "</td>" +
                            "<td>" +
                            department.name_department +
                            "</td>" +
                            '<td><span class="' +
                            statusClass +
                            '">' +
                            statusText +
                            "</span></td>" +
                            '<td style="text-align: right;">' +
                            '<button class="btn-icon-toggle btn-edit" data-id="' +
                            department.id +
                            '"><span class="material-symbols-outlined icon">edit</span></button> ' +
                            '<button class="btn-icon-toggle btn-delete" data-id="' +
                            department.id +
                            '"><span class="material-symbols-outlined icon">delete</span></button>' +
                            "</td>" +
                            "</tr>";
                    });
                }

                $("#departmentTableBody").html(rowHtml);
            },
            error: function () {
                showFloatingAlert("Failed to load departments.", 'warning', 3500);
            },
        });
    }

$(document).ready(function () {
    $("#searchInput").on("input", function () {
        var query = $(this).val();
        loadDepartments(query, selectedStatus);
    });

    loadDepartments("", selectedStatus);

    $(".filter-option").click(function (e) {
        e.preventDefault();
        $(".filter-option").removeClass("active");
        $(this).addClass("active");
        selectedStatus = $(this).data("status");
        loadDepartments($("#searchInput").val(), selectedStatus);
    });
});
