document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('employeeEditForm');
    const loaderOverlay = document.createElement('div');
    loaderOverlay.className = 'modal-loading-overlay d-none';
    loaderOverlay.innerHTML = '<div class="loader-spinner"></div>';
    form.appendChild(loaderOverlay);

    const profilePictureLabel = document.querySelector('label[for="profile_picture"]');
    const clearBtn = document.getElementById('profilePictureClearBtn');
    const input = document.getElementById('profile_picture');

    // Removed adding is-valid on DOMContentLoaded for profilePictureLabel
    const formAlert = document.getElementById('formAlert');

    if (clearBtn) {
        clearBtn.addEventListener('click', function (e) {
            e.preventDefault();
            profilePictureLabel.style.backgroundImage = '';
            profilePictureLabel.classList.remove('has-image', 'is-valid', 'is-invalid');
            clearBtn.classList.add('d-none');
            input.value = '';
        });
    }

    input.addEventListener('change', function (e) {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = function (e) {
                profilePictureLabel.style.backgroundImage = 'url(' + e.target.result + ')';
                profilePictureLabel.classList.add('has-image');
                clearBtn.classList.remove('d-none');
            }
            reader.readAsDataURL(input.files[0]);
        } else {
            profilePictureLabel.style.backgroundImage = '';
            profilePictureLabel.classList.remove('has-image', 'is-valid', 'is-invalid');
            clearBtn.classList.add('d-none');
        }
    });

    // Add input/change event listeners for validation classes
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach((input) => {
        input.addEventListener('input', () => {
            if (input.id === 'profile_picture') {
                if (input.checkValidity()) {
                    input.classList.remove('is-invalid');
                    input.classList.add('is-valid');
                    if (profilePictureLabel) {
                        profilePictureLabel.classList.remove('is-invalid');
                        profilePictureLabel.classList.add('is-valid');
                    }
                } else {
                    input.classList.remove('is-valid');
                    input.classList.add('is-invalid');
                    if (profilePictureLabel) {
                        profilePictureLabel.classList.add('is-invalid');
                        profilePictureLabel.classList.remove('is-valid');
                    }
                }
            } else {
                if (input.checkValidity()) {
                    input.classList.remove('is-invalid');
                    input.classList.add('is-valid');
                } else {
                    input.classList.remove('is-valid');
                    input.classList.add('is-invalid');
                }
            }
            form.classList.remove('was-validated');
        });
        input.addEventListener('change', () => {
            if (input.id === 'profile_picture') {
                if (input.checkValidity()) {
                    input.classList.remove('is-invalid');
                    input.classList.add('is-valid');
                    if (profilePictureLabel) {
                        profilePictureLabel.classList.remove('is-invalid');
                        profilePictureLabel.classList.add('is-valid');
                    }
                } else {
                    input.classList.remove('is-valid');
                    input.classList.add('is-invalid');
                    if (profilePictureLabel) {
                        profilePictureLabel.classList.add('is-invalid');
                        profilePictureLabel.classList.remove('is-valid');
                    }
                }
            } else {
                if (input.checkValidity()) {
                    input.classList.remove('is-invalid');
                    input.classList.add('is-valid');
                } else {
                    input.classList.remove('is-valid');
                    input.classList.add('is-invalid');
                }
            }
            form.classList.remove('was-validated');
        });
    });

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!form.checkValidity()) {
            e.stopPropagation();
            form.classList.add('was-validated');

            // Handle profile picture label validation classes
            if (profilePictureLabel && input && input.checkValidity()) {
                profilePictureLabel.classList.add('is-valid');
                profilePictureLabel.classList.remove('is-invalid');
            } else {
                profilePictureLabel.classList.remove('is-valid');
                profilePictureLabel.classList.add('is-invalid');
            }

            return;
        }
        form.classList.remove('was-validated');

        loaderOverlay.classList.remove('d-none');
        if (formAlert) formAlert.innerHTML = '';

        const formData = new FormData(form);

        fetch(form.action, {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            loaderOverlay.classList.add('d-none');
            if (data.errors) {
                // Clear previous errors
                form.querySelectorAll('.text-danger').forEach(el => el.remove());
                // Show validation errors
                for (const [field, messages] of Object.entries(data.errors)) {
                    const input = form.querySelector(`[name="${field}"]`);
                    if (input) {
                        const errorDiv = document.createElement('div');
                        errorDiv.className = 'text-danger small';
                        errorDiv.textContent = messages.join(', ');
                        input.parentNode.appendChild(errorDiv);
                    }
                }
            } else if (data.message) {
                if (formAlert) {
                    formAlert.innerHTML = '<div class="alert alert-success">Employee updated successfully.</div>';
                    setTimeout(() => {
                        formAlert.innerHTML = '';
                        window.location.href = '/employee-page';
                    }, 1500);
                } else {
                    alert(data.message);
                    window.location.href = '/employee-page';
                }
                // Remove validation classes after success
                const inputs = form.querySelectorAll('input, select, textarea');
                inputs.forEach((input) => {
                    input.classList.remove('is-valid', 'is-invalid');
                });
                if (profilePictureLabel) {
                    profilePictureLabel.classList.remove('is-valid', 'is-invalid', 'has-image');
                    profilePictureLabel.style.backgroundImage = '';
                }
                if (clearBtn) clearBtn.classList.add('d-none');
                if (input) input.value = '';
                form.classList.remove('was-validated');
            }
        })
        .catch(error => {
            loaderOverlay.classList.add('d-none');
            if (formAlert) {
                formAlert.innerHTML = '<div class="alert alert-danger">An error occurred while updating the employee.</div>';
            } else {
                alert('An error occurred while updating the employee.');
            }
            console.error(error);
        });
    });
});
