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
            showFloatingAlert("Failed to load profile data.", 'warning', 3500);
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
                showFloatingAlert("Failed to validate current password.", 'warning', 3000);
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
                showFloatingAlert(response.message || 'Profile updated successfully.', "success", 1500);
                // Hide alert after 1.5 seconds and reload page
                setTimeout(function () {
                    location.reload();
                }, 1500);
            },
            error: function (xhr, status, error) {
                console.error("Profile update error:", error);
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
                    var errorMessage = xhr.responseJSON?.error || error || "Error updating profile.";
                    showFloatingAlert("Error updating profile: " + errorMessage, 'warning', 3500);
                }
            },
            complete: function () {
                // Hide loader and enable submit button
                loaderOverlay.addClass("d-none");
                submitButton.prop("disabled", false);
            },
        });
    });

    /* ================= Profile Photo Logic ================= */
    const photoInput = document.getElementById('profile_photo_input');
    const photoPreview = document.getElementById('profilePreview');
    const clearBtn = document.getElementById('clearProfilePhotoBtn');
    const removeFlag = document.getElementById('remove_profile_photo');
    const uploadBtn = document.getElementById('uploadProfilePhotoBtn');
    const profileImageLabel = document.getElementById('profileImageLabel');

    function resetToPlaceholder() {
        // Hide preview, remove has-image class so background shows add-image icon
        if (photoPreview) {
            photoPreview.style.display = 'none';
            photoPreview.src = '';
        }
        if (profileImageLabel) profileImageLabel.classList.remove('has-image');
    }

    // Clicking label already triggers file input via for attribute

    if (photoInput) {
        photoInput.addEventListener('change', function(e){
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(ev){
                    photoPreview.src = ev.target.result;
                    photoPreview.style.display = 'block';
                    if (profileImageLabel) profileImageLabel.classList.add('has-image');
                    if (clearBtn) clearBtn.style.display = 'flex';
                    removeFlag.value = '0';
                };
                reader.readAsDataURL(file);
            } else {
                resetToPlaceholder();
            }
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', function(){
            // Clear input & preview
            if (photoInput) photoInput.value = '';
            resetToPlaceholder();
            if (clearBtn) clearBtn.style.display = 'none';
            removeFlag.value = '1';
        });
    }

    if (uploadBtn) {
        uploadBtn.addEventListener('click', function(){
            // Build a FormData solely for photo upload (and CSRF token)
            const fd = new FormData();
            const tokenInput = document.querySelector('input[name="_token"]');
            if (tokenInput) fd.append('_token', tokenInput.value);
            if (removeFlag.value === '1') {
                fd.append('remove_profile_photo', '1');
            } else if (photoInput && photoInput.files[0]) {
                fd.append('profile_photo', photoInput.files[0]);
            } else {
                showFloatingAlert('Tidak ada perubahan foto.', 'warning', 2000);
                return;
            }

            loaderOverlay.removeClass('d-none');
            uploadBtn.disabled = true;

            $.ajax({
                url: appUrl + '/profile/update',
                method: 'POST',
                data: fd,
                processData: false,
                contentType: false,
                headers: { 'X-CSRF-TOKEN': $('input[name="_token"]').val() },
                success: function(res){
                    showFloatingAlert(res.message || 'Foto profil diperbarui.', 'success', 1200);
                    if (res.photo_url) {
                        if (photoPreview) {
                            photoPreview.src = res.photo_url + '?t=' + Date.now(); // cache bust
                            photoPreview.style.display = 'block';
                        }
                        if (profileImageLabel) profileImageLabel.classList.add('has-image');
                        if (clearBtn) clearBtn.style.display = 'flex';
                        removeFlag.value = '0';
                        // Update any global avatar images (navbar, dropdown)
                        // Update global nav avatars
                        document.querySelectorAll('img[data-global-avatar]').forEach(function(img){
                            const baseUrl = res.photo_url;
                            if (baseUrl) {
                                img.src = baseUrl + '?t=' + Date.now();
                            }
                        });
                        // Dispatch custom event so other modules (user/project/task/attendance/dashboard) can listen and update their avatar elements
                        window.dispatchEvent(new CustomEvent('profilePictureUpdated', { detail: { url: res.photo_url + '?t=' + Date.now() } }));
                    } else {
                        // cleared
                        resetToPlaceholder();
                        if (clearBtn) clearBtn.style.display = 'none';
                        // Revert global avatars to default if cleared
                        document.querySelectorAll('img[data-global-avatar]').forEach(function(img){
                            const def = img.getAttribute('data-default');
                            if (def) { img.src = def + '?t=' + Date.now(); }
                        });
                        window.dispatchEvent(new CustomEvent('profilePictureUpdated', { detail: { url: null } }));
                    }
                },
                error: function(xhr){
                    const msg = xhr.responseJSON?.error || 'Gagal memperbarui foto profil.';
                    showFloatingAlert(msg, 'warning', 3000);
                },
                complete: function(){
                    loaderOverlay.addClass('d-none');
                    uploadBtn.disabled = false;
                }
            });
        });
    }
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
