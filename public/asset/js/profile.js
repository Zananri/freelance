// Show floating alert at bottom right corner (like task page)
function showFloatingAlert(message, type = "success") {
    const alertDiv = document.createElement("div");
    alertDiv.className = `alert alert-${type} d-flex align-items-center profile-status-alert`;
    alertDiv.setAttribute("role", "alert");
    alertDiv.style.opacity = "1";
    alertDiv.style.position = "fixed";
    alertDiv.style.bottom = "20px";
    alertDiv.style.right = "20px";
    alertDiv.style.zIndex = "9999";
    alertDiv.style.minWidth = "300px";
    alertDiv.style.margin = "0";

    let iconId = "";
    if (type === "success") {
        iconId = "check-circle-fill";
    } else if (type === "danger") {
        iconId = "exclamation-triangle-fill";
    } else {
        iconId = "info-fill";
    }

    alertDiv.innerHTML = `
        <svg class="bi flex-shrink-0 me-2" width="24" height="24" role="img" aria-label="${
            type.charAt(0).toUpperCase() + type.slice(1)
        }:">
            <use xlink:href="#${iconId}"/>
        </svg>
        <div>
            ${message}
        </div>
    `;

    document.body.appendChild(alertDiv);

    // After 1.5 seconds, fade out alert
    setTimeout(() => {
        alertDiv.style.opacity = "0";
        setTimeout(() => {
            alertDiv.remove();
        }, 500);
    }, 1500);
}

$(document).ready(function () {
    var appUrl =
        window.location.origin +
        window.location.pathname.replace(/\/[^/]+$/, "");

    // Form fields
    var employeeName = $("#employee_name");
    var employeeEmail = $("#employee_email");
    var employeeEmailWork = $("#employee_email_work");
    var employeePhone = $("#employee_phone");
    var address = $("#address");
    var birthDate = $("#birth_date");
    var departmentId = $("#department_id");
    var divisionId = $("#division_id");
    var jobId = $("#job_id");
    var grade = $("#grade");
    var office = $("#office");
    var hireDate = $("#hire_date");

    var formAlert = $("#formAlert");
    var profileForm = $("#profileForm");
    var submitButton = profileForm.find('button[type="submit"]');
    var loaderOverlay = $("#profileLoaderOverlay");

    // Fetch user data from API using AJAX
    $.ajax({
        url: appUrl + "/profile/index",
        method: "GET",
        dataType: "json",
        success: function (user) {
            console.log("Profile data fetched:", user);
            employeeName.val(user.name || "");
            employeeEmail.val(user.employee?.email || "");
            employeeEmailWork.val(user.employee?.email_work || "");
            employeePhone.val(user.employee?.phone || "");
            address.text(user.employee?.address || "");
            birthDate.val(user.employee?.birth_date || "");
            departmentId.val(user.employee?.department?.name_department || "");
            divisionId.val(user.employee?.division?.name_division || "");
            jobId.val(user.employee?.job?.job_name || "");
            grade.val(user.employee?.grade || "");
            office.val(user.employee?.office || "");
            hireDate.val(user.employee?.hire_date || "");
        },
        error: function (xhr, status, error) {
            console.error("Error fetching profile data:", error);
        },
    });

    // Current password and new password inputs
    var currentPasswordInput = $("#current_password");
    var newPasswordInput = $("#new_password");

    // Disable new password input and submit button initially
    newPasswordInput.prop("readonly", true);
    submitButton.prop("disabled", true);

    // Debounce function to limit the rate of function calls
    function debounce(func, wait) {
        var timeout;
        return function () {
            var context = this,
                args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(function () {
                func.apply(context, args);
            }, wait);
        };
    }

    // Function to validate current password via AJAX
    function validateCurrentPassword() {
        var currentPassword = currentPasswordInput.val().trim();
        console.log("Validating current password:", currentPassword);
        if (currentPassword.length === 0) {
            currentPasswordInput.removeClass("is-valid is-invalid");
            newPasswordInput.prop("disabled", true);
            submitButton.prop("disabled", true);
            return;
        }

        $.ajax({
            url: appUrl + "/profile/verify-current-password",
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify({ current_password: currentPassword }),
            headers: {
                "X-CSRF-TOKEN": $('input[name="_token"]').val(),
            },
            success: function (data) {
                console.log("Current password validation response:", data);
                if (data.valid) {
                    currentPasswordInput
                        .removeClass("is-invalid")
                        .addClass("is-valid");
                    newPasswordInput.prop("readonly", false);
                    submitButton.prop("disabled", false);
                } else {
                    currentPasswordInput
                        .removeClass("is-valid")
                        .addClass("is-invalid");
                    newPasswordInput.prop("readonly", true);
                    submitButton.prop("disabled", true);
                }
            },
            error: function () {
                console.error("Error validating current password");
                currentPasswordInput
                    .removeClass("is-valid")
                    .addClass("is-invalid");
                newPasswordInput.prop("readonly", true);
                submitButton.prop("disabled", true);
            },
        });
    }

    // Use debounced version of validateCurrentPassword on input event
    var debouncedValidateCurrentPassword = debounce(
        validateCurrentPassword,
        300
    );

    currentPasswordInput.on("input", function () {
        debouncedValidateCurrentPassword();
    });

    // Handle form submission with AJAX
    profileForm.on("submit", function (e) {
        e.preventDefault();
        console.log("Submitting profile update form");

        var formData = new FormData(this);

        // Clear previous alerts
        formAlert.html("");
        // Show loader and disable submit button
        loaderOverlay.removeClass("d-none");
        submitButton.prop("disabled", true);

        $.ajax({
            url: appUrl + "/profile/update",
            method: "POST",
            data: formData,
            processData: false,
            contentType: false,
            headers: {
                "X-CSRF-TOKEN": $('input[name="_token"]').val(),
            },
            success: function (response) {
                console.log("Profile update success:", response);
                // Show success alert
                showFloatingAlert(response.message, "success");
                // Hide alert after 1.5 seconds and reload page
                setTimeout(function () {
                    location.reload();
                }, 1500);
            },
            error: function (xhr, status, error) {
                console.error("Profile update error:", error);
                var errorMessage =
                    xhr.responseJSON?.error ||
                    error ||
                    "Error updating profile.";
                showFloatingAlert(
                    "Error updating profile: " + errorMessage,
                    "danger"
                );
            },
            complete: function () {
                // Hide loader and enable submit button
                loaderOverlay.addClass("d-none");
                submitButton.prop("disabled", false);
            },
        });
    });
});

function adjustLayout() {
    if ($(window).width() < 768) {
        // Gabung profile-section & personal-info ke dalam 1 card
        if (!$(".profile-card-mobile").length) {
            $(".profile-section, .personal-info").wrapAll(
                '<div class="profile-card-mobile card p-0 overflow-hidden" style="background: transparent; border-radius:20px; border: none; box-shadow:0 10px 25px rgba(0,0,0,0.05);"></div>'
            );
        }
    } else {
        // Desktop
        $(".password-form").show();

        // Unwrap kalau ada wrapper mobile
        if ($(".profile-card-mobile").length) {
            $(".profile-section, .personal-info").unwrap();
        }
    }
}

// jalanin pas load
$(document).ready(function () {
    adjustLayout();
});

// jalanin pas resize
$(window).resize(function () {
    adjustLayout();
});
