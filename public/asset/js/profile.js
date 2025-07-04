$(document).ready(function () {
    var appUrl = window.location.origin;
    var profilePhotoLabel = $('.profile-photo-upload');
    var profilePhotoInput = $('#profile_photo');
    var profilePhotoClearBtn = $('#profilePhotoClearBtn');

    // Form fields
    var employeeName = $('#employee_name');
    var employeeEmail = $('#employee_email');
    var employeeEmailWork = $('#employee_email_work');
    var employeePhone = $('#employee_phone');
    var address = $('#address');
    var birthDate = $('#birth_date');
    var departmentId = $('#department_id');
    var divisionId = $('#division_id');
    var jobId = $('#job_id');
    var grade = $('#grade');
    var office = $('#office');
    var hireDate = $('#hire_date');

    var formAlert = $('#formAlert');
    var profileForm = $('#profileForm');
    var submitButton = profileForm.find('button[type="submit"]');
    var loaderOverlay = $('#profileLoaderOverlay');

    // Function to set profile photo background
    function setProfilePhoto(url) {
        if (url) {
            profilePhotoLabel.addClass('has-image');
            profilePhotoLabel.css('background-image', 'url(' + url + ')');
            profilePhotoClearBtn.removeClass('d-none');
        } else {
            profilePhotoLabel.removeClass('has-image');
            profilePhotoLabel.css('background-image', "url('" + appUrl + "/asset/img/background/add-image.png')");
            profilePhotoClearBtn.addClass('d-none');
        }
    }

    // Fetch user data from API using AJAX
    $.ajax({
        url: appUrl + '/profiles',
        method: 'GET',
        dataType: 'json',
        success: function (user) {
            employeeName.val(user.name || '');
            employeeEmail.val(user.employee?.email || '');
            employeeEmailWork.val(user.employee?.email_work || '');
            employeePhone.val(user.employee?.phone || '');
            address.val(user.employee?.address || '');
            birthDate.val(user.employee?.birth_date || '');
            departmentId.val(user.employee?.department?.name_department || '');
            divisionId.val(user.employee?.division?.name_division || '');
            jobId.val(user.employee?.job?.job_name || '');
            grade.val(user.employee?.grade || '');
            office.val(user.employee?.office || '');
            hireDate.val(user.employee?.hire_date || '');

            var photoUrl = user.photo || null;
            setProfilePhoto(photoUrl);
        },
        error: function (xhr, status, error) {
            console.error('Error fetching profile data:', error);
        }
    });

    // When user selects a new photo, update the preview
    profilePhotoInput.on('change', function () {
        var file = this.files[0];
        if (file) {
            var reader = new FileReader();
            reader.onload = function (e) {
                profilePhotoLabel.addClass('has-image');
                profilePhotoLabel.css('background-image', 'url(' + e.target.result + ')');
                profilePhotoClearBtn.removeClass('d-none');
            };
            reader.readAsDataURL(file);
        }
    });

    // Add click event handler for clear button to remove image
    profilePhotoClearBtn.on('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        profilePhotoInput.val(''); // Clear file input
        setProfilePhoto(null); // Reset background and hide clear button
    });

    // Handle form submission with AJAX
    profileForm.on('submit', function (e) {
        e.preventDefault();

        var formData = new FormData(this);

        // Clear previous alerts
        formAlert.html('');
        // Show loader and disable submit button
        loaderOverlay.removeClass('d-none');
        submitButton.prop('disabled', true);

        $.ajax({
            url: appUrl + '/profile/update',
            method: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            headers: {
                'X-CSRF-TOKEN': $('input[name="_token"]').val()
            },
            success: function (response) {
                // Show success alert
                formAlert.html('<div class="alert alert-success" role="alert">' + response.message + '</div>');
                // Hide alert after 1.5 seconds and reload page
                setTimeout(function () {
                    formAlert.html('');
                    location.reload();
                }, 1500);
            },
            error: function (xhr, status, error) {
                var errorMessage = xhr.responseJSON?.error || error || 'Error updating profile.';
                formAlert.html('<div class="alert alert-danger" role="alert">Error updating profile: ' + errorMessage + '</div>');
            },
            complete: function () {
                // Hide loader and enable submit button
                loaderOverlay.addClass('d-none');
                submitButton.prop('disabled', false);
            }
        });
    });
});
