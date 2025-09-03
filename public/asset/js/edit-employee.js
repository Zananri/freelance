document.addEventListener("DOMContentLoaded", function () {
    // Get appUrl from meta tag
    const appUrl = document.querySelector('meta[name="app-url"]')?.content || '';
    const form = document.getElementById("employeeEditForm");
    const loaderOverlay = document.createElement("div");
    loaderOverlay.className = "modal-loading-overlay d-none";
    loaderOverlay.innerHTML = '<div class="loader-spinner"></div>';
    form.appendChild(loaderOverlay);

    const profilePictureLabel = document.querySelector(
        'label[for="profile_picture"]'
    );
    const profilePictureClearBtn = document.getElementById(
        "profilePictureClearBtn"
    );
    const photoLabel = document.querySelector('label[for="photo"]');
    const photoClearBtn = document.getElementById("photoClearBtn");
    const ktpLabel = document.querySelector('label[for="ktp"]');
    const ktpClearBtn = document.getElementById("ktpClearBtn");
    const inputProfilePicture = document.getElementById("profile_picture");
    const inputPhoto = document.getElementById("photo");
    const inputKtp = document.getElementById("ktp");
    const formAlert = document.getElementById("formAlert");

    // Load departments, divisions, jobs dynamically
    const departmentSelect = document.getElementById("department_id");
    const divisionSelect = document.getElementById("division_id");
    const jobSelect = document.getElementById("job_id");
    const shiftSelect = document.getElementById("shift_id");
    const shiftTimeHint = document.getElementById("shift_time_hint");
function loadDepartments(selectedId) {
    $.ajax({
        url: appUrl + "/department/index",
        method: "GET",
        dataType: "json",
        success: function (data) {
            console.log("Departments loaded:", data);
            let options = '<option value="" disabled>Select Department</option>';
            (data.data || []).forEach((dept) => {
                options += `<option value="${dept.id}" ${
                    dept.id == selectedId ? "selected" : ""
                }>${dept.name_department || dept.name}</option>`;
            });
            departmentSelect.innerHTML = options;

            if (selectedId) {
                loadDivisions(selectedId, divisionSelect.getAttribute("data-current"));
            }
        },
        error: function () {
            console.error("Failed to load departments.");
        }
    });
}

function loadDivisions(departmentId, selectedId) {
    // Prepare UI while loading
    divisionSelect.innerHTML = '<option value="" disabled selected>Loading...</option>';
    divisionSelect.disabled = true;
    // Reset jobs while reloading divisions
    if (jobSelect) {
        jobSelect.innerHTML = '<option value="" disabled selected>Select Job</option>';
        jobSelect.disabled = true;
    }
    $.ajax({
        url: appUrl + "/division/index",
        method: "GET",
        data: { department_id: departmentId },
        dataType: "json",
        success: function (data) {
            console.log("Divisions loaded for department", departmentId, ":", data);
            let options = '<option value="" disabled selected>Select Division</option>';
            (data.data || []).forEach((div) => {
                options += `<option value="${div.id}" ${
                    div.id == selectedId ? "selected" : ""
                }>${div.name_division || div.name}</option>`;
            });
            divisionSelect.innerHTML = options;
            divisionSelect.disabled = false;

            if (selectedId) {
                loadJobs(selectedId, jobSelect.getAttribute("data-current"), departmentId);
            } else {
                if (jobSelect) {
                    jobSelect.innerHTML = '<option value="" disabled selected>Select Job</option>';
                    jobSelect.disabled = true;
                }
            }
        },
        error: function () {
            console.error("Failed to load divisions.");
        }
    });
}

function loadJobs(divisionId, selectedId, departmentId) {
    if (!jobSelect) return;
    jobSelect.innerHTML = '<option value="" disabled selected>Loading...</option>';
    jobSelect.disabled = true;
    $.ajax({
        url: appUrl + "/job/index",
        method: "GET",
        // Pass department_id as well to ensure strict scoping and avoid mismatches
        data: { division_id: divisionId, department_id: departmentId || departmentSelect.value || undefined },
        dataType: "json",
        success: function (data) {
            console.log("Jobs loaded for division", divisionId, ":", data);
            const jobs = data && Array.isArray(data.data) ? data.data : [];
            if (!jobs.length) {
                jobSelect.innerHTML = '<option value="" disabled selected>No jobs available</option>';
                jobSelect.disabled = true;
                return;
            }
            let options = '<option value="" disabled selected>Select Job</option>';
            jobs.forEach((job) => {
                options += `<option value="${job.id}" ${
                    selectedId && String(job.id) === String(selectedId) ? "selected" : ""
                }>${job.job_name || job.name}</option>`;
            });
            jobSelect.innerHTML = options;
            jobSelect.disabled = false;
        },
        error: function () {
            console.error("Failed to load jobs.");
            jobSelect.innerHTML = '<option value="" disabled selected>Failed to load jobs</option>';
            jobSelect.disabled = true;
        }
    });
}


    // Initialize dropdowns with current employee data
    const currentDepartmentId = window.currentEmployeeData
        ? window.currentEmployeeData.departmentId
        : null;
    const currentDivisionId = window.currentEmployeeData
        ? window.currentEmployeeData.divisionId
        : null;
    const currentJobId = window.currentEmployeeData
        ? window.currentEmployeeData.jobId
        : null;

    loadDepartments(currentDepartmentId);

    // Load shifts for selection and preselect current
    function loadShifts(selectedId) {
        if (!shiftSelect) return;
        const shiftsUrl = shiftSelect.getAttribute('data-fetch-url') || (appUrl ? appUrl + '/shift/list' : '/shift/list');
        $.ajax({
            url: shiftsUrl,
            type: "GET",
            dataType: "json",
            success: function (resp) {
                const data = resp.data || [];
                let options = '<option value="" disabled>Select Shift</option>';
                data.forEach((s) => {
                    const start = s.time_start?.slice(0,5) || "--:--";
                    const end = s.time_end?.slice(0,5) || "--:--";
                    const title = s.title || `Shift ${start}-${end}`;
                    options += `<option value="${s.id}" data-start="${start}" data-end="${end}">${title} (${start} - ${end})</option>`;
                });
                shiftSelect.innerHTML = options;
                if (selectedId) {
                    shiftSelect.value = String(selectedId);
                }
                // Trigger change to update hint
                const opt = shiftSelect.options[shiftSelect.selectedIndex];
                if (opt && opt.getAttribute('data-start') && shiftTimeHint) {
                    shiftTimeHint.textContent = `${opt.getAttribute('data-start')} - ${opt.getAttribute('data-end')}`;
                }
            },
            error: function () {
                console.error("Failed to load shifts");
            },
        });
    }

    if (shiftSelect) {
        const currentShiftId = shiftSelect.getAttribute('data-current');
        loadShifts(currentShiftId);
        shiftSelect.addEventListener("change", function(){
            const opt = this.options[this.selectedIndex];
            const start = opt.getAttribute("data-start");
            const end = opt.getAttribute("data-end");
            if (shiftTimeHint) shiftTimeHint.textContent = `${start} - ${end}`;
        });
    }

    departmentSelect.addEventListener("change", function () {
        const deptId = this.value;
        if (deptId) {
            // Clear current selections to avoid stale preselects
            if (divisionSelect) {
                divisionSelect.setAttribute("data-current", "");
            }
            if (jobSelect) {
                jobSelect.setAttribute("data-current", "");
                jobSelect.innerHTML = '<option value="" disabled selected>Select Job</option>';
                jobSelect.disabled = true;
            }
            loadDivisions(deptId, null);
        } else {
            divisionSelect.innerHTML = '<option value="" disabled selected>Select Division</option>';
            divisionSelect.disabled = true;
            jobSelect.innerHTML = '<option value="" disabled selected>Select Job</option>';
            jobSelect.disabled = true;
        }
    });

    divisionSelect.addEventListener("change", function () {
        const divId = this.value;
        if (divId) {
            // When division changes, clear any stale job preselect
            if (jobSelect) {
                jobSelect.setAttribute("data-current", "");
            }
            loadJobs(divId, null, departmentSelect ? departmentSelect.value : undefined);
        } else {
            jobSelect.innerHTML = '<option value="" disabled selected>Select Job</option>';
            jobSelect.disabled = true;
        }
    });

    // Image input preview and clear button handlers
    // This function handles image preview and clear button only for the edit employee modal inputs.
    // It does NOT affect images in employee table, office layout, user, or profile pages.
    function setupImageInput(input, label, clearBtn) {
        if (!input || !label) return;

        input.addEventListener("change", function () {
            if (input.files && input.files[0]) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    if (input !== inputProfilePicture) {
                        label.style.backgroundImage = `url('${e.target.result}')`;
                        label.classList.add("has-image");
                        label.style.backgroundSize = "cover";
                        label.style.opacity = "1";
                        if (clearBtn) clearBtn.classList.remove("d-none");
                    }
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

    setupImageInput(inputPhoto, photoLabel, photoClearBtn);

    // On successful form submission, save updated photo URL and employee ID in localStorage
    // Use a specific key to avoid conflicts with other pages.

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
                    if (typeof window.hideAlertMsg === 'function') {
                        window.hideAlertMsg();
                    } else {
                        box.parentElement.style.display = 'none';
                    }
                }, delayMs);
                return;
            }
        } catch(e) { /* no-op */ }
        try { alert(typeof message === 'string' ? message.replace(/<[^>]+>/g, '') : String(message)); } catch(e) {}
    }

    form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!form.checkValidity()) {
            e.stopPropagation();
            form.classList.add("was-validated");
            return;
        }
        form.classList.remove("was-validated");

        loaderOverlay.classList.remove("d-none");
        if (formAlert) formAlert.innerHTML = "";

        const formData = new FormData(form);

        // Add _method=PUT to simulate PUT request
        formData.append("_method", "PUT");

        // Map form field names to controller expected names
        formData.set("name", formData.get("employee_name"));
        formData.delete("employee_name");
        if (formData.get('employee_niks') !== null) {
            formData.set('employee_niks', formData.get('employee_niks'));
        }
        formData.set("email", formData.get("employee_email"));
        formData.delete("employee_email");
        formData.set("email_work", formData.get("employee_email_work"));
        formData.delete("employee_email_work");
        formData.set("phone", formData.get("employee_phone"));
        formData.delete("employee_phone");
        // Include shift_id if present
        if (formData.get("shift_id")) {
            formData.set("shift_id", formData.get("shift_id"));
        }
        // Ensure grade_id and office are ids
        if (formData.get("grade_id")) {
            formData.set("grade_id", formData.get("grade_id"));
        }
        if (formData.get("office")) {
            formData.set("office", formData.get("office"));
        }

        fetch(form.action, {
            method: "POST",
            headers: {
                "X-CSRF-TOKEN": document
                    .querySelector('meta[name="csrf-token"]')
                    .getAttribute("content"),
                "X-Requested-With": "XMLHttpRequest",
            },
            body: formData,
        })
            .then(async (response) => {
                let data = {};
                try { data = await response.json(); } catch (_) { /* server may return empty/HTML */ }
                loaderOverlay.classList.add("d-none");
                if (data && data.errors) {
                    // Clear previous errors
                    form.querySelectorAll(".text-danger").forEach((el) =>
                        el.remove()
                    );
                    // Show validation errors
                    for (const [field, messages] of Object.entries(
                        data.errors
                    )) {
                        const input = form.querySelector(`[name="${field}"]`);
                        if (input) {
                            const errorDiv = document.createElement("div");
                            errorDiv.className = "text-danger small";
                            errorDiv.textContent = messages.join(", ");
                            input.parentNode.appendChild(errorDiv);
                        }
                    }
                } else if (response.ok) {
                    // Success (with or without message)
                    const successMsg = (data && data.message) || 'Employee updated successfully.';
                    showFloatingAlert(successMsg, "success", 2000);
                    setTimeout(() => {
                        // Save updated photo URL and employee ID in localStorage if photo updated
                        if (data && data.updatedPhotoUrl && data.employeeId) {
                            localStorage.setItem(
                                "updatedEmployeePhoto",
                                JSON.stringify({
                                    employeeId: data.employeeId,
                                    photoUrl: data.updatedPhotoUrl,
                                })
                            );
                        }
                        window.location.href = appUrl + "/employee";
                    }, 2000);
                    // Remove validation classes after success
                    const inputs = form.querySelectorAll(
                        "input, select, textarea"
                    );
                    inputs.forEach((input) => {
                        input.classList.remove("is-valid", "is-invalid");
                    });
                    const labels = form.querySelectorAll("label");
                    labels.forEach((label) => {
                        label.classList.remove("is-valid", "is-invalid");
                    });
                    form.classList.remove("was-validated");
                } else {
                    // Non-OK response
                    if (formAlert) { formAlert.innerHTML = ""; }
                    showFloatingAlert('Failed to update employee. Please try again.', 'warning', 3500);
                }
            })
            .catch((error) => {
                loaderOverlay.classList.add("d-none");
                // Show Settings-style alert for network/unknown errors
                if (formAlert) { formAlert.innerHTML = ""; }
                showFloatingAlert('An error occurred while updating the employee.', 'warning', 3500);
                console.error(error);
            });
    });
    setupImageInput(inputKtp, ktpLabel, ktpClearBtn);

    // Add input/change event listeners for validation classes
    const inputs = form.querySelectorAll("input, select, textarea");
    inputs.forEach((input) => {
        input.addEventListener("input", () => {
            if (input.id === "profile_picture") {
                if (input.checkValidity()) {
                    input.classList.remove("is-invalid");
                    input.classList.add("is-valid");
                    if (profilePictureLabel) {
                        profilePictureLabel.classList.remove("is-invalid");
                        profilePictureLabel.classList.add("is-valid");
                    }
                } else {
                    input.classList.remove("is-valid");
                    input.classList.add("is-invalid");
                    if (profilePictureLabel) {
                        profilePictureLabel.classList.add("is-invalid");
                        profilePictureLabel.classList.remove("is-valid");
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
            form.classList.remove("was-validated");
        });
        input.addEventListener("change", () => {
            if (input.id === "profile_picture") {
                if (input.checkValidity()) {
                    input.classList.remove("is-invalid");
                    input.classList.add("is-valid");
                    if (profilePictureLabel) {
                        profilePictureLabel.classList.remove("is-invalid");
                        profilePictureLabel.classList.add("is-valid");
                    }
                } else {
                    input.classList.remove("is-valid");
                    input.classList.add("is-invalid");
                    if (profilePictureLabel) {
                        profilePictureLabel.classList.add("is-invalid");
                        profilePictureLabel.classList.remove("is-valid");
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
            form.classList.remove("was-validated");
        });
    });
});
