var appUrl = $('meta[name="app-url"]').attr("content");

var selectedStatus = "ALL";

var editDepartmentModal = new bootstrap.Modal(
    document.getElementById("editDepartmentModal")
);

var addDepartmentModal;

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
        // Remove reload page on alert close event handler
        // $(document).on('closed.bs.alert', '#addDepartmentModal .alert-container .alert, #editDepartmentModal .alert-container .alert', function() {
        //     location.reload();
        // });

        // Tambahkan input hidden remove_image jika belum ada
        if ($("#editDepartmentForm input[name='remove_image']").length === 0) {
            $("#editDepartmentForm").append('<input type="hidden" name="remove_image" id="edit_remove_image" value="0">');
        }

        addDepartmentModal = new bootstrap.Modal(
            document.getElementById("addDepartmentModal")
        );

        // Reset edit modal saat ditutup
        $("#editDepartmentModal").on("hidden.bs.modal", function () {
            // Reset input file
            $("#edit_image").val("");
            // Reset background label ke default icon
            $("#editImageLabel").css({
                "background-image":
                    "url('" + appUrl + "/asset/img/background/add-image.png')",
                "background-position": "center center",
                "background-repeat": "no-repeat",
                "background-size": "50%",
                opacity: "0.5",
            });
            // Hide clear button
            $("#editImageClearBtn").addClass("d-none");
            // Reset validation classes
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
        // Also remove validation classes from image label
        $("#imageLabel").removeClass("is-valid is-invalid");
        // Reset image label background to default with full CSS properties
        $("#imageLabel").css({
            "background-image":
                "url('" + appUrl + "/asset/img/background/add-image.png')",
            "background-position": "center center",
            "background-repeat": "no-repeat",
            "background-size": "50%",
            opacity: "0.5",
        });
        // Remove has-image class on reset
        $("#imageLabel").removeClass("has-image");
        // Hide the image clear button (X)
        $("#imageClearBtn").addClass("d-none");
    }

    // Event handler for Add Data button to show addDepartmentModal
    $("#btnAddData").on("click", function () {
        resetAddDepartmentForm();
        addDepartmentModal.show();
    });

    // Clear any existing alert when opening edit modal
    $("#editDepartmentModal").on("show.bs.modal", function () {
        $("#editDepartmentModal .alert-container").empty();
        $("#edit_name_department").removeClass("is-valid is-invalid");
        $("#edit_status").removeClass("is-valid is-invalid");
        $("#edit_description").removeClass("is-valid is-invalid");
        $("#edit_image").removeClass("is-valid is-invalid");
        // Ensure loader overlay is hidden to allow input
        $("#editModalLoader").addClass("d-none");

        // Set opacity of image label based on whether an image is set
        var bgImage = $("#editImageLabel").css("background-image");
        if (
            !bgImage ||
            bgImage === "none" ||
            bgImage.indexOf("add-image.png") !== -1
        ) {
            $("#editImageLabel").css("opacity", "0.5");
            // Remove validation classes if no image
            $("#editImageLabel").removeClass("is-valid is-invalid");
        } else {
            $("#editImageLabel").css("opacity", "1");
        }
    });

    // Image input change handlers for preview
    $("#image").change(function () {
        readURL(this, "#imageLabel");
        // Validation for image input label
        if (this.checkValidity()) {
            $("#imageLabel").removeClass("is-invalid").addClass("is-valid");
        } else {
            $("#imageLabel").removeClass("is-valid").addClass("is-invalid");
        }
    });

    $("#edit_image").change(function () {
        readURL(this, "#editImageLabel");
        // Hide the old image preview when new image selected
        $("#edit_image_preview").hide();
        // Validation for edit image input label
        if (this.checkValidity()) {
            $("#editImageLabel").removeClass("is-invalid").addClass("is-valid");
        } else {
            $("#editImageLabel").removeClass("is-valid").addClass("is-invalid");
        }
        // Reset flag remove_image jika user memilih gambar baru
        $("#edit_remove_image").val("0");
    });

    // Handler tombol X pada label image (Add Department)
    $("#image").change(function () {
        readURL(this, "#imageLabel");
        // Tampilkan tombol X jika ada file
        if (this.files && this.files[0]) {
            $("#imageClearBtn").removeClass("d-none");
            $("#imageLabel").css({
                "background-size": "cover",
                opacity: "1",
            });
        } else {
            $("#imageClearBtn").addClass("d-none");
            // Kembalikan ke icon default
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
        // Reset input file
        $("#image").val("");
        // Reset background label ke default icon
        $("#imageLabel").css({
            "background-image":
                "url('" + appUrl + "/asset/img/background/add-image.png')",
            "background-position": "center center",
            "background-repeat": "no-repeat",
            "background-size": "50%",
            opacity: "0.5",
        });
        $("#imageClearBtn").addClass("d-none");
        // Reset validasi
    });
    $("#image").removeClass("is-valid is-invalid");
    $("#imageLabel").removeClass("is-valid is-invalid");

    // Handler tombol X pada label image (Edit Department)
    $("#editImageClearBtn").on("click", function (e) {
        e.preventDefault();
        // Reset input file
        $("#edit_image").val("");
        // Reset background label ke default icon
        $("#editImageLabel").css({
            "background-image":
                "url('" + appUrl + "/asset/img/background/add-image.png')",
            "background-position": "center center",
            "background-repeat": "no-repeat",
            "background-size": "50%",
            opacity: "0.5",
        });
        // Hide image preview
        $("#edit_image_preview").hide();
        // Reset validasi
        $("#editImageLabel").removeClass("is-valid is-invalid");
        $("#edit_image").removeClass("is-valid is-invalid");
        // Hide the X button after clearing
        $("#editImageClearBtn").addClass("d-none");
        // Set flag remove_image
        $("#edit_remove_image").val("1");
    });

    $("#edit_image").change(function () {
        readURL(this, "#editImageLabel");
        // Tampilkan tombol X jika ada file
        if (this.files && this.files[0]) {
            $("#editImageClearBtn").removeClass("d-none");
            $("#editImageLabel").css({
                "background-size": "cover",
                opacity: "1",
            });
        } else {
            $("#editImageClearBtn").addClass("d-none");
            // Kembalikan ke icon default
            $("#editImageLabel").css({
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
            url: appUrl + "/departments",
            type: "POST",
            data: formData,
            contentType: false,
            processData: false,
            headers: {
                "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
            },
            success: function (response) {
                showLoader("add", false);
                console.log("Add Department Success:", response);
                $("#addDepartmentModal .alert-container").empty();
                var alertHtml =
                    '<div class="alert alert-success alert-dismissible fade show d-flex justify-content-between align-items-center" role="alert" style="margin-bottom:0;">' +
                    "<div>" +
                    response.message +
                    "</div>" +
                    "</div>";
                $("#addDepartmentModal .alert-container").append(alertHtml);
                $("#addDepartmentModal .alert-container").show();
                loadDepartments();
                setTimeout(function () {
                    $("#addDepartmentModal .alert-container .alert").alert(
                        "close"
                    );
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
            url: appUrl + "/departments/" + id,
            type: "GET",
            success: function (department) {
                $("#edit_name_department").val(department.name_department);
                $("#edit_status").val(department.status);
                $("#edit_description").val(department.description);
                // Show current image only as label background, NOT in <img>
                if (department.image_url) {
                    var imageUrl = department.image_url;
                    // Set the background image of the label to the current image
                    $("#editImageLabel").css({
                        "background-image": "url(" + imageUrl + ")",
                        "background-position": "center center",
                        "background-repeat": "no-repeat",
                        "background-size": "cover",
                        opacity: "1",
                    });
                    // Tampilkan tombol X
                    $("#editImageClearBtn").removeClass("d-none");
                    // Hide the <img> preview
                    $("#edit_image_preview").hide();
                } else {
                    // Reset label background to default if no image
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
                alert("Failed to fetch department data.");
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
        formData.append("_method", "PUT"); // Add this line to spoof PUT method

        showLoader("edit", true);

        $.ajax({
            url: appUrl + "/departments/" + id,
            type: "POST",
            data: formData,
            contentType: false,
            processData: false,
            headers: {
                "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
            },
            success: function (response) {
                showLoader("edit", false);
                $("#editDepartmentModal .alert-container").empty();
                var alertHtml =
                    '<div class="alert alert-success alert-dismissible fade show d-flex justify-content-between align-items-center" role="alert" style="margin-bottom:0;">' +
                    "<div>" +
                    response.message +
                    "</div>" +
                    "</div>";
                $("#editDepartmentModal .alert-container").append(alertHtml);
                $("#editDepartmentModal .alert-container").show();
                loadDepartments();
                setTimeout(function () {
                    $("#editDepartmentModal .alert-container .alert").alert(
                        "close"
                    );
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

    // Real-time validation for editDepartmentForm inputs
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

    // Real-time validation for addDepartmentForm inputs
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
        // Fetch department data to show in delete modal
        $.ajax({
            url: appUrl + "/departments/" + id,
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
                        "opacity": "1"
                    });
                } else {
                    $("#deleteImageLabel").css({
                        "background-image": "url('" + appUrl + "/asset/img/background/add-image.png')",
                        "background-position": "center center",
                        "background-repeat": "no-repeat",
                        "background-size": "50%",
                        "opacity": "0.5"
                    });
                }
                $("#deleteDepartmentForm").data("id", id);
                var deleteDepartmentModal = new bootstrap.Modal(
                    document.getElementById("deleteDepartmentModal")
                );
                deleteDepartmentModal.show();
            },
            error: function () {
                alert("Failed to fetch department data.");
            },
        });
    });

    $("#deleteDepartmentForm").submit(function (e) {
        e.preventDefault();
        var id = $(this).data("id");

        showLoader("delete", true);

        $.ajax({
            url: appUrl + "/departments/" + id,
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
                // Remove the deleted row from the table immediately
                $('#departmentTableBody tr[data-id="' + id + '"]').remove();
                var deleteDepartmentModalEl = document.getElementById(
                    "deleteDepartmentModal"
                );
                var deleteDepartmentModal = bootstrap.Modal.getInstance(
                    deleteDepartmentModalEl
                );
                deleteDepartmentModal.hide();
                // Reload the page after delete to reflect changes
                location.reload();
            },
            error: function () {
                showLoader("delete", false);
                alert("Failed to delete department.");
            },
        });
    });
});

// Remove pagination and scroll loading, revert to loading all data at once
function loadDepartments(query = "", status = "ALL") {
    $.ajax({
        url: appUrl + "/departments",
        type: "GET",
        data: { query: query, status: status },
        success: function (departments) {
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
                    var imageHtml = '';
                    if (department.image_url) {
                        imageHtml = '<img src="' + department.image_url + '" alt="Department Image" class="table-image" />';
                    } else {
                        imageHtml = 'No image available';
                    }
                    rowHtml +=
                        '<tr data-id="' + department.id + '">' +
                        '<td>' + imageHtml + '</td>' +
                        '<td>' + department.name_department + '</td>' +
                        '<td><span class="' + statusClass + '">' + statusText + '</span></td>' +
                        '<td style="text-align: right;">' +
                        '<button class="btn-icon-toggle btn-edit" data-id="' + department.id + '"><span class="material-symbols-outlined icon">edit</span></button> ' +
                        '<button class="btn-icon-toggle btn-delete" data-id="' + department.id + '"><span class="material-symbols-outlined icon">delete</span></button>' +
                        '</td>' +
                        '</tr>';
                });
            }

            $("#departmentTableBody").html(rowHtml);
        },
        error: function () {
            alert("Failed to load departments.");
        },
    });
}

$(document).ready(function () {
    // Trigger search dynamically as user types
    $("#searchInput").on("input", function () {
        var query = $(this).val();
        loadDepartments(query, selectedStatus);
    });

    // Initial load
    loadDepartments("", selectedStatus);

    // Handle filter option click
    $(".filter-option").click(function (e) {
        e.preventDefault();
        $(".filter-option").removeClass("active");
        $(this).addClass("active");
        selectedStatus = $(this).data("status");
        loadDepartments($("#searchInput").val(), selectedStatus);
    });
});
