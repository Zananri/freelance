document.addEventListener('DOMContentLoaded', function () {
    function setupImageInput(inputId, labelSelector, clearBtnId) {
        const input = document.getElementById(inputId);
        const label = document.querySelector(labelSelector);
        const clearBtn = document.getElementById(clearBtnId);

        if (!input || !label) return;

        input.addEventListener('change', function () {
            if (input.files && input.files[0]) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    label.style.backgroundImage = `url('${e.target.result}')`;
                    label.classList.add('has-image');
                    label.style.backgroundSize = 'cover';
                    label.style.opacity = '1';
                    if (clearBtn) clearBtn.classList.remove('d-none');
                };
                reader.readAsDataURL(input.files[0]);
            } else {
                label.style.backgroundImage = '';
                label.classList.remove('has-image');
                label.style.opacity = '0.5';
                if (clearBtn) clearBtn.classList.add('d-none');
            }
        });

        if (clearBtn) {
            clearBtn.addEventListener('click', function (e) {
                e.preventDefault();
                input.value = '';
                label.style.backgroundImage = '';
                label.classList.remove('has-image');
                label.style.opacity = '0.5';
                clearBtn.classList.add('d-none');
            });
        }
    }

    setupImageInput('photo', 'label[for="photo"]', 'photoClearBtn');
    setupImageInput('ktp', 'label[for="ktp"]', 'ktpClearBtn');
    setupImageInput('profile_picture', 'label[for="profile_picture"]', 'profilePictureClearBtn');
});
