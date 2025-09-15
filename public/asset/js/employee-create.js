var appUrl = $('meta[name="app-url"]').attr("content");

document.addEventListener("DOMContentLoaded", function () {
    // --- DYNAMIC DROPDOWN LOGIC ---
    const departmentSelect = document.getElementById("department_id");

    // Unified alert: route to Settings-style white alert (office.js -> showAlertMsg)
    function showFloatingAlert(message, type = 'success', delayMs = 2500) {
        try {
            if (typeof window.showAlertMsg === 'function') {
                // Force white style as requested (use 'light' variant)
                window.showAlertMsg(message, 'light', delayMs);
                return;
            }
            // Fallback to container if present
            const box = document.querySelector('.box-alert-messages .box-message');
            if (box && box.parentElement) {
                box.parentElement.style.display = 'block';
                box.classList.remove('success','warning','error','light');
                box.classList.add('light');
                box.innerHTML = message;
                setTimeout(() => {
                    if (typeof window.hideAlertMsg === 'function') {
                        window.hideAlertMsg();
                    } else {
                        box.parentElement.style.display = 'none';
                    }
                }, delayMs);
                return;
            }
        } catch (e) { /* no-op */ }
        // Last resort
        try { alert(typeof message === 'string' ? message.replace(/<[^>]+>/g, '') : String(message)); } catch(e) {}
    }
    const divisionSelect = document.getElementById("division_id");
    const jobSelect = document.getElementById("job_id");
    const shiftSelect = document.getElementById("shift_id");
    const shiftTimeHint = document.getElementById("shift_time_hint");

    // Load departments on page load
    function loadDepartments() {
        $.ajax({
            url: appUrl + "/department/index",
            type: "GET",
            dataType: "json",
            success: function (data) {
                let options =
                    '<option value="" disabled selected>Select Department</option>';
                (data.data || []).forEach((dept) => {
                    options += `<option value="${dept.id}">${
                        dept.name_department || dept.name
                    }</option>`;
                });
                departmentSelect.innerHTML = options;
            },
            error: function () {
                showFloatingAlert("Failed to load departments.", "warning", 3000);
            },
        });
    }

    // Load divisions when department changes
    function loadDivisions(departmentId) {
        divisionSelect.innerHTML =
            '<option value="" disabled selected>Loading...</option>';
        $.ajax({
            url: appUrl + "/division/index",
            type: "GET",
            data: { department_id: departmentId },
            dataType: "json",
            success: function (data) {
                let options =
                    '<option value="" disabled selected>Select Division</option>';
                (data.data || []).forEach((div) => {
                    options += `<option value="${div.id}">${
                        div.name_division || div.name
                    }</option>`;
                });
                divisionSelect.innerHTML = options;
                jobSelect.innerHTML =
                    '<option value="" disabled selected>Select Job</option>';
            },
            error: function () {
                showFloatingAlert("Failed to load divisions.", "warning", 3000);
            },
        });
    }

    // Load jobs when division changes
    function loadJobs(divisionId) {
        jobSelect.innerHTML =
            '<option value="" disabled selected>Loading...</option>';
        $.ajax({
            url: appUrl + "/job/index",
            type: "GET",
            data: { division_id: divisionId },
            dataType: "json",
            success: function (data) {
                let options =
                    '<option value="" disabled selected>Select Job</option>';
                (data.data || []).forEach((job) => {
                    options += `<option value="${job.id}">${
                        job.job_name || job.name
                    }</option>`;
                });
                jobSelect.innerHTML = options;
            },
            error: function () {
                showFloatingAlert("Failed to load jobs.", "warning", 3000);
            },
        });
    }

    if (departmentSelect && divisionSelect && jobSelect) {
        loadDepartments();

        departmentSelect.addEventListener("change", function () {
            const deptId = this.value;
            if (deptId) {
                loadDivisions(deptId);
            } else {
                divisionSelect.innerHTML =
                    '<option value="" disabled selected>Select Division</option>';
                jobSelect.innerHTML =
                    '<option value="" disabled selected>Select Job</option>';
            }
        });

        divisionSelect.addEventListener("change", function () {
            const divId = this.value;
            if (divId) {
                loadJobs(divId);
            } else {
                jobSelect.innerHTML =
                    '<option value="" disabled selected>Select Job</option>';
            }
        });
    }

    // Load shifts for selection and show time hint
    function loadShifts() {
        if (!shiftSelect) return;
        const shiftsUrl = shiftSelect.getAttribute('data-fetch-url') || (appUrl ? appUrl + '/shift/list' : '/shift/list');
        $.ajax({
            url: shiftsUrl,
            type: "GET",
            dataType: "json",
            success: function (resp) {
                const data = resp.data || [];
                let options = '<option value="" disabled selected>Select Shift</option>';
                data.forEach((s) => {
                    const start = s.time_start?.slice(0,5) || "--:--";
                    const end = s.time_end?.slice(0,5) || "--:--";
                    const title = s.title || `Shift ${start}-${end}`;
                    options += `<option value="${s.id}" data-start="${start}" data-end="${end}">${title} (${start} - ${end})</option>`;
                });
                shiftSelect.innerHTML = options;
                // If we have at least one shift, select it by default to show the hint
                if (data.length > 0) {
                    // Keep placeholder selected unless required to auto-select
                    // Uncomment to auto-select first shift:
                    // shiftSelect.selectedIndex = 1;
                    // const first = shiftSelect.options[1];
                    // if (first && shiftTimeHint) {
                    //     shiftTimeHint.textContent = `${first.getAttribute('data-start')} - ${first.getAttribute('data-end')}`;
                    // }
                }
            },
            error: function () {
                console.error("Failed to load shifts");
                showFloatingAlert("Gagal memuat data shift. Coba refresh halaman.", "warning", 3500);
            },
        });
    }

    if (shiftSelect) {
        loadShifts();
        shiftSelect.addEventListener("change", function(){
            const opt = this.options[this.selectedIndex];
            const start = opt.getAttribute("data-start");
            const end = opt.getAttribute("data-end");
            if (shiftTimeHint) shiftTimeHint.textContent = `${start} - ${end}`;
        });
    }

    // New code to auto-fill email_work based on employee_name
    const employeeNameInput = document.getElementById("employee_name");
    const employeeEmailWorkInput = document.getElementById("employee_email_work");

    if (employeeNameInput && employeeEmailWorkInput) {
        employeeNameInput.addEventListener("input", function () {
            const fullName = employeeNameInput.value.trim();
            if (fullName.length > 0) {
                // Only auto-fill if email_work is empty or matches previous auto-fill pattern
                const currentEmailWork = employeeEmailWorkInput.value.trim();
                const generatedEmailWork = fullName.replace(/\s+/g, "_").toLowerCase() + "@nsaperformance.id";
                if (currentEmailWork === "" || currentEmailWork === employeeEmailWorkInput.getAttribute("data-auto-filled")) {
                    employeeEmailWorkInput.value = generatedEmailWork;
                    employeeEmailWorkInput.setAttribute("data-auto-filled", generatedEmailWork);
                }
                employeeEmailWorkInput.readOnly = false; // allow editing
                employeeEmailWorkInput.removeAttribute("disabled");
            } else {
                employeeEmailWorkInput.value = "";
                employeeEmailWorkInput.readOnly = false;
                employeeEmailWorkInput.removeAttribute("disabled");
                employeeEmailWorkInput.removeAttribute("data-auto-filled");
            }
        });

        // Remove data-auto-filled attribute if user manually edits email_work
        employeeEmailWorkInput.addEventListener("input", function () {
            employeeEmailWorkInput.removeAttribute("data-auto-filled");
        });
    }

    function setupImageInput(inputId, labelSelector, clearBtnId) {
        const input = document.getElementById(inputId);
        const label = document.querySelector(labelSelector);
        const clearBtn = clearBtnId ? document.getElementById(clearBtnId) : null;

        if (!input || !label) return;

        input.addEventListener("change", function () {
            if (input.files && input.files[0]) {
                // Enforce 10 MB max on client-side
                const maxBytes = 10 * 1024 * 1024; // 10MB
                if (input.files[0].size > maxBytes) {
                    showFloatingAlert('Maximum file size is 10 MB.', 'warning', 3500);
                    input.value = '';
                    if (label) {
                        label.style.backgroundImage = '';
                        label.classList.remove('has-image');
                        label.style.opacity = '0.5';
                    }
                    if (clearBtn) clearBtn.classList.add('d-none');
                    return;
                }
                const reader = new FileReader();
                reader.onload = function (e) {
                    label.style.backgroundImage = `url('${e.target.result}')`;
                    label.classList.add("has-image");
                    label.style.backgroundSize = "cover";
                    label.style.opacity = "1";
                    if (clearBtn) clearBtn.classList.remove("d-none");
                };
                reader.readAsDataURL(input.files[0]);
            } else {
                label.style.backgroundImage = "";
                label.classList.remove("has-image");
                label.style.opacity = "0.5";
                if (clearBtn) clearBtn.classList.add("d-none");
            }
        });

        if (clearBtn) {
            clearBtn.addEventListener("click", function (e) {
                e.preventDefault();
                input.value = "";
                label.style.backgroundImage = "";
                label.classList.remove("has-image");
                label.style.opacity = "0.5";
                label.classList.remove("is-valid");
                label.classList.remove("is-invalid");
                clearBtn.classList.add("d-none");
            });
        }
    }

    // AJAX form submission for employee create form
    const employeeCreateForm = document.getElementById("employeeCreateForm");
    const formAlert = document.getElementById("formAlert");

    if (employeeCreateForm) {
        const photoLabel = document.querySelector('label[for="photo"]');
        employeeCreateForm.addEventListener("submit", function (e) {
            // Bootstrap validation
            if (!employeeCreateForm.checkValidity()) {
                e.preventDefault();
                e.stopPropagation();
                employeeCreateForm.classList.add("was-validated");
                return;
            }
            employeeCreateForm.classList.remove("was-validated");

            e.preventDefault();

            const employeeCreateLoader = document.getElementById("employeeCreateLoader");
            formAlert.innerHTML = "";
            // Show loader
            if (employeeCreateLoader) employeeCreateLoader.classList.remove("d-none");

            const formData = new FormData(employeeCreateForm);

            // Map form field names to controller expected names
            formData.set("name", formData.get("employee_name"));
            formData.delete("employee_name");
            if (formData.get("employee_niks") !== null) {
                formData.set("employee_niks", formData.get("employee_niks"));
            }
            formData.set("email", formData.get("employee_email"));
            formData.delete("employee_email");
            formData.set("email_work", formData.get("employee_email_work"));
            formData.delete("employee_email_work");
            formData.set("phone", formData.get("employee_phone"));
            formData.delete("employee_phone");
            formData.set("address", formData.get("address"));
            formData.set("birth_date", formData.get("birth_date"));
            formData.set("hire_date", formData.get("hire_date"));
            // grade and office are ids now
            formData.set("grade_id", formData.get("grade_id"));
            formData.delete("grade");
            formData.set("office", formData.get("office"));
            formData.set("department_id", formData.get("department_id"));
            formData.set("division_id", formData.get("division_id"));
            formData.set("job_id", formData.get("job_id"));
            // Map shift id
            if (formData.get("shift_id")) {
                formData.set("shift_id", formData.get("shift_id"));
            }

            $.ajax({
                url: appUrl + "/employee",
                type: "POST",
                data: formData,
                contentType: false,
                processData: false,
                headers: {
                    "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
                    Accept: "application/json",
                },
                success: function (response) {
                    // Hide loader
                    if (employeeCreateLoader) employeeCreateLoader.classList.add("d-none");

                // Show success floating alert
                showFloatingAlert("Employee created successfully!", "success");

                if (response.redirect_url) {
                    // Redirect after showing alert
                    setTimeout(() => {
                        window.location.href = response.redirect_url;
                    }, 2000);
                    employeeCreateForm.reset();
                    return;
                }

                employeeCreateForm.reset();

                // Remove validation classes from inputs and labels
                const inputs = employeeCreateForm.querySelectorAll("input, select, textarea");
                inputs.forEach((input) => {
                    input.classList.remove("is-valid", "is-invalid");
                });
                const labels = employeeCreateForm.querySelectorAll("label");
                labels.forEach((label) => {
                    label.classList.remove("is-valid", "is-invalid");
                });
                employeeCreateForm.classList.remove("was-validated");

                // Reset image previews
                ["photo", "ktp", "profile_picture"].forEach((id) => {
                    const input = document.getElementById(id);
                    if (input) input.value = "";
                    const label = document.querySelector(
                        `label[for="${id}"]`
                    );
                    if (label) {
                        label.style.backgroundImage = "";
                        label.classList.remove("has-image", "is-valid", "is-invalid");
                        label.style.opacity = "0.5";
                    }
                    const clearBtn = document.getElementById(
                        id === "photo"
                            ? "photoClearBtn"
                            : id === "ktp"
                            ? "ktpClearBtn"
                            : id + "ClearBtn"
                    );

                    if (clearBtn) clearBtn.classList.add("d-none");
                });
                },
                error: function (xhr) {
                    // Hide loader
                    if (employeeCreateLoader) employeeCreateLoader.classList.add("d-none");

                    if (xhr.status === 422) {
                        const resp = xhr.responseJSON || {};
                        const errors = resp.errors || {};
                        let message = resp.message || 'Validation failed.';
                        const keys = Object.keys(errors);
                        if (keys.length) {
                            const firstKey = keys[0];
                            const arr = errors[firstKey] || [];
                            if (arr.length) message = arr[0];
                        }
                        if (formAlert) formAlert.innerHTML = "";
                        showFloatingAlert(message, 'warning', 5000);
                    } else {
                        const msg = (xhr.responseJSON && xhr.responseJSON.message) ? xhr.responseJSON.message : 'Failed to create employee.';
                        if (formAlert) formAlert.innerHTML = "";
                        showFloatingAlert(msg, 'warning', 4000);
                    }
                },
            });
        });

        // Add input/change event listeners for validation classes
        const inputs = employeeCreateForm.querySelectorAll("input, select, textarea");
        inputs.forEach((input) => {
            input.addEventListener("input", () => {
                if (input.id === "photo" || input.id === "ktp") {
                    if (input.checkValidity()) {
                        input.classList.remove("is-invalid");
                        input.classList.add("is-valid");
                        if (photoLabel) {
                            photoLabel.classList.remove("is-invalid");
                            photoLabel.classList.add("is-valid");
                        }
                    } else {
                        input.classList.remove("is-valid");
                        input.classList.add("is-invalid");
                        if (photoLabel) {
                            photoLabel.classList.add("is-invalid");
                            photoLabel.classList.remove("is-valid");
                        }
                    }
                } else {
                    if (input.checkValidity()) {
                        input.classList.remove("is-invalid");
                        input.classList.add("is-valid");
                    } else {
                        input.classList.remove("is-valid");
                        input.classList.add("is-invalid");
                    }
                }
                employeeCreateForm.classList.remove("was-validated");
            });
            input.addEventListener("change", () => {
                if (input.id === "photo" || input.id === "ktp") {
                    if (input.checkValidity()) {
                        input.classList.remove("is-invalid");
                        input.classList.add("is-valid");
                        if (photoLabel) {
                            photoLabel.classList.remove("is-invalid");
                            photoLabel.classList.add("is-valid");
                        }
                    } else {
                        input.classList.remove("is-valid");
                        input.classList.add("is-invalid");
                        if (photoLabel) {
                            photoLabel.classList.add("is-invalid");
                            photoLabel.classList.remove("is-valid");
                        }
                    }
                } else {
                    if (input.checkValidity()) {
                        input.classList.remove("is-invalid");
                        input.classList.add("is-valid");
                    } else {
                        input.classList.remove("is-valid");
                        input.classList.add("is-invalid");
                    }
                }
                employeeCreateForm.classList.remove("was-validated");
            });
        });
    }

    setupImageInput(
        "photo",
        'label[for="photo"]',
        "photoClearBtn"
    );

    setupImageInput(
        "ktp",
        'label[for="ktp"]',
        "ktpClearBtn"
    );

    // Date picker removed for employee create; shift selection is used instead
});
