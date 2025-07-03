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
    $('#profileForm').on('submit', function (e) {
        e.preventDefault();

        var formData = new FormData(this);

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
                alert(response.message);
                // Optionally, refresh the profile data or page
                location.reload();
            },
            error: function (xhr, status, error) {
                alert('Error updating profile: ' + (xhr.responseJSON?.error || error));
            }
        });
    });
});
