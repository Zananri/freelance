document.addEventListener("DOMContentLoaded", function () {
    // Get appUrl from meta tag
    const appUrl = document.querySelector('meta[name="app-url"]')?.content || '';
    // Helper: extract employee id from URL like /employee/{id}/edit or form.action
    const getEmployeeIdFromUrl = () => {
        try {
            const href = (typeof window !== 'undefined' && window.location && window.location.pathname) ? window.location.pathname : '';
            // Try pattern /employee/{id}/edit
            let m = href.match(/\/employee\/(\d+)\/(edit|update)?/i);
            if (m && m[1]) return m[1];
        } catch (_) {}
        try {
            if (form && form.action) {
                const m2 = String(form.action).match(/\/employee\/(\d+)/i);
                if (m2 && m2[1]) return m2[1];
            }
        } catch (_) {}
        return null;
    };
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
                const isSelected = selectedId && String(dept.id) === String(selectedId);
                options += `<option value="${dept.id}" ${isSelected ? "selected" : ""}>${dept.name_department || dept.name}</option>`;
            });
            departmentSelect.innerHTML = options;

            // Only preselect if selectedId is provided
            if (selectedId) {
                departmentSelect.value = String(selectedId);
                console.log("Department preselected:", selectedId);
            }
        },
        error: function (xhr, status, error) {
            console.error("Failed to load departments. Status:", status, "Error:", error);
        }
    });
}

function loadDivisions(departmentId, selectedId) {
    console.log("Loading divisions for department:", departmentId, "with selected:", selectedId);
    
    if (!departmentId) {
        divisionSelect.innerHTML = '<option value="" disabled selected>Select Department first</option>';
        divisionSelect.disabled = true;
        return;
    }
    
    // Show loading state
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
            
            // Always start with "Select Division" as the first option
            let options = '<option value="" disabled selected>Select Division</option>';
            (data.data || []).forEach((div) => {
                const isSelected = selectedId && String(div.id) === String(selectedId);
                options += `<option value="${div.id}" ${isSelected ? "selected" : ""}>${div.name_division || div.name}</option>`;
            });
            
            divisionSelect.innerHTML = options;
            divisionSelect.disabled = false;
            
            // Only preselect if selectedId is provided (initialization only)
            if (selectedId) {
                divisionSelect.value = String(selectedId);
                console.log("Division preselected:", selectedId);
                // Don't automatically load jobs here for manual changes
            }
            
            // Reset jobs to unselected state
            if (jobSelect) {
                jobSelect.innerHTML = '<option value="" disabled selected>Select Job</option>';
                jobSelect.disabled = true;
            }
        },
        error: function (xhr, status, error) {
            console.error("Failed to load divisions. Status:", status, "Error:", error);
            divisionSelect.innerHTML = '<option value="" disabled selected>Failed to load divisions</option>';
            divisionSelect.disabled = true;
        }
    });
}

function loadJobs(divisionId, selectedId, departmentId) {
    console.log("Loading jobs for division:", divisionId, "selectedId:", selectedId, "department:", departmentId);
    
    if (!jobSelect) return;
    
    // Make sure we have division_id
    if (!divisionId) {
        jobSelect.innerHTML = '<option value="" disabled selected>Select Division first</option>';
        jobSelect.disabled = true;
        return;
    }
    
    // Show loading state
    jobSelect.innerHTML = '<option value="" disabled selected>Loading...</option>';
    jobSelect.disabled = true;
    
    $.ajax({
        url: appUrl + "/job/index",
        method: "GET",
        data: { 
            division_id: divisionId, 
            department_id: departmentId || departmentSelect.value || undefined,
            status: 'ACTIVE' // Only load active jobs
        },
        dataType: "json",
        success: function (data) {
            console.log("Jobs loaded for division", divisionId, "with department", departmentId, ":", data);
            const jobs = data && Array.isArray(data.data) ? data.data : [];
            console.log("Processed jobs array:", jobs);
            console.log("Selected job ID:", selectedId);
            
            if (!jobs.length) {
                console.log("No jobs found for this division/department combination");
                jobSelect.innerHTML = '<option value="" disabled selected>No jobs available for this division</option>';
                jobSelect.disabled = true;
                return;
            }
            
            // Always start with "Select Job" option
            let options = '<option value="" disabled selected>Select Job</option>';
            jobs.forEach((job) => {
                const isSelected = selectedId && String(job.id) === String(selectedId);
                console.log(`Job: ${job.job_name || job.name} (ID: ${job.id}) - Selected: ${isSelected}`);
                options += `<option value="${job.id}" ${isSelected ? "selected" : ""}>${job.job_name || job.name}</option>`;
            });
            
            jobSelect.innerHTML = options;
            jobSelect.disabled = false; // Always enable if we have jobs
            
            // Only preselect if selectedId is provided (initialization only)
            if (selectedId) {
                jobSelect.value = String(selectedId);
                console.log("Job preselected:", selectedId);
            }
            
            console.log("Job select populated successfully, disabled:", jobSelect.disabled);
        },
        error: function (xhr, status, error) {
            console.error("Failed to load jobs. Status:", status, "Error:", error);
            console.error("Response:", xhr.responseText);
            jobSelect.innerHTML = '<option value="" disabled selected>Failed to load jobs</option>';
            jobSelect.disabled = true;
        }
    });
}


    // Initialize dropdowns with current employee data from data attributes
    const currentDepartmentId = departmentSelect.getAttribute("data-current-dept") || null;
    const currentDivisionId = divisionSelect.getAttribute("data-current") || null;
    const currentJobId = jobSelect.getAttribute("data-current") || null;

    console.log("Initializing employee edit form with:", {
        departmentId: currentDepartmentId,
        divisionId: currentDivisionId,
        jobId: currentJobId
    });

    // Check if jobs are already populated in the HTML (from server-side)
    const hasExistingJobs = jobSelect && jobSelect.options.length > 1; // More than just "Select Job" option
    
    console.log("Has existing jobs:", hasExistingJobs);
    console.log("Current job options count:", jobSelect ? jobSelect.options.length : 0);
    
    // Always load departments for consistency
    if (currentDepartmentId) {
        console.log("Loading departments for:", currentDepartmentId);
        loadDepartments(currentDepartmentId);
    }
    
    // If we have existing job options from server and current job is selected, don't reload
    if (hasExistingJobs && currentJobId) {
        console.log("Jobs already populated from server with current job selected");
        // Ensure the correct job is selected
        if (jobSelect) {
            jobSelect.value = currentJobId;
            jobSelect.disabled = false;
        }
    } else {
        // Need to load divisions and jobs dynamically
        console.log("Loading divisions and jobs dynamically");
        
        if (currentDivisionId) {
            setTimeout(() => {
                loadDivisions(currentDepartmentId, currentDivisionId);
                
                if (currentJobId) {
                    console.log("Will load jobs for division:", currentDivisionId, "with current job:", currentJobId);
                    // Add delay to ensure division is loaded first
                    setTimeout(() => {
                        loadJobs(currentDivisionId, currentJobId, currentDepartmentId);
                    }, 800);
                }
            }, 300);
        }
    }

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
        console.log("Department changed to:", deptId);
        
        if (deptId) {
            // Clear current selections and reset to empty state
            if (divisionSelect) {
                divisionSelect.value = ""; // Clear selection
                divisionSelect.setAttribute("data-current", "");
                divisionSelect.innerHTML = '<option value="" disabled selected>Loading...</option>';
                divisionSelect.disabled = true;
            }
            if (jobSelect) {
                jobSelect.value = ""; // Clear selection
                jobSelect.setAttribute("data-current", "");
                jobSelect.innerHTML = '<option value="" disabled selected>Select Job</option>';
                jobSelect.disabled = true;
            }
            // Load divisions for the new department, but don't preselect any
            loadDivisions(deptId, null);
        } else {
            // Reset both division and job when no department selected
            if (divisionSelect) {
                divisionSelect.innerHTML = '<option value="" disabled selected>Select Division</option>';
                divisionSelect.disabled = true;
                divisionSelect.value = "";
            }
            if (jobSelect) {
                jobSelect.innerHTML = '<option value="" disabled selected>Select Job</option>';
                jobSelect.disabled = true;
                jobSelect.value = "";
            }
        }
    });

    divisionSelect.addEventListener("change", function () {
        const divId = this.value;
        const deptId = departmentSelect ? departmentSelect.value : null;
        
        console.log("Division changed to:", divId, "for department:", deptId);
        
        if (divId && deptId) {
            // When division changes manually, clear any stale job preselect
            if (jobSelect) {
                jobSelect.setAttribute("data-current", "");
                jobSelect.value = ""; // Clear current selection
            }
            loadJobs(divId, null, deptId);
        } else {
            // Reset job selection when no division selected
            if (jobSelect) {
                jobSelect.innerHTML = '<option value="" disabled selected>Select Job</option>';
                jobSelect.disabled = true;
                jobSelect.value = "";
            }
        }
    });

    // Image input preview and clear button handlers
    // This function handles image preview and clear button only for the edit employee modal inputs.
    // It does NOT affect images in employee table, office layout, user, or profile pages.
    function setupImageInput(input, label, clearBtn) {
        if (!input || !label) return;

        input.addEventListener("change", function () {
            if (input.files && input.files[0]) {
                // Enforce 10 MB max on client-side
                const maxBytes = 10 * 1024 * 1024; // 10MB
                if (input.files[0].size > maxBytes) {
                    showFloatingAlert('Maximum file size is 10 MB.', 'warning', 3500);
                    input.value = '';
                    label.style.backgroundImage = '';
                    label.classList.remove('has-image');
                    label.style.opacity = '0.5';
                    if (clearBtn) clearBtn.classList.add('d-none');
                    return;
                }
                const reader = new FileReader();
                reader.onload = function (e) {
                    if (input !== inputProfilePicture) {
                        label.style.backgroundImage = `url('${e.target.result}')`;
                        label.classList.add("has-image");
                        label.style.backgroundSize = "cover";
                        label.style.opacity = "1";
                        if (clearBtn) clearBtn.classList.remove("d-none");
                        // Persist updated employee photo preview so Employee Detail modal can show latest without reload
                        if (input === inputPhoto) {
                            const empId = getEmployeeIdFromUrl();
                            if (empId) {
                                try {
                                    localStorage.setItem(
                                        "editEmployeeUpdatedPhoto",
                                        JSON.stringify({ employeeId: String(empId), photoUrl: e.target.result })
                                    );
                                } catch (_) { /* no-op */ }
                            }
                        }
                    }
                };
                reader.readAsDataURL(input.files[0]);
            } else {
                label.style.backgroundImage = "";
                label.classList.remove("has-image");
                label.style.opacity = "0.5";
                if (clearBtn) clearBtn.classList.add("d-none");
                // If photo cleared, also clear any pending updated preview cache
                if (input === inputPhoto) {
                    try { localStorage.removeItem("editEmployeeUpdatedPhoto"); } catch(_) { /* no-op */ }
                }
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
                if (response.ok) {
                    // Success (with or without message)
                    const successMsg = (data && data.message) || 'Employee updated successfully.';
                    showFloatingAlert(successMsg, "success", 2000);
                    setTimeout(() => {
                        // Save updated photo URL and employee ID in localStorage if photo updated
                        if (data && data.updatedPhotoUrl && data.employeeId) {
                            try {
                                localStorage.setItem(
                                    "editEmployeeUpdatedPhoto",
                                    JSON.stringify({
                                        employeeId: String(data.employeeId),
                                        photoUrl: data.updatedPhotoUrl,
                                    })
                                );
                            } catch (_) { /* no-op */ }
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
                    // Non-OK response (e.g., 422 validation)
                    const errors = data && data.errors ? data.errors : null;
                    if (errors) {
                        // Show only the first error line
                        const keys = Object.keys(errors);
                        let message = (data && data.message) ? data.message : 'Validation failed.';
                        if (keys.length) {
                            const firstKey = keys[0];
                            const arr = errors[firstKey] || [];
                            if (arr.length) message = arr[0];
                        }
                        if (formAlert) { formAlert.innerHTML = ""; }
                        showFloatingAlert(message, 'warning', 5000);
                    } else {
                        const msg = (data && data.message) ? data.message : 'Failed to update employee. Please try again.';
                        if (formAlert) { formAlert.innerHTML = ""; }
                        showFloatingAlert(msg, 'warning', 4000);
                    }
                }
            })
            .catch((error) => {
                loaderOverlay.classList.add("d-none");
                // Network/unknown error
                if (formAlert) { formAlert.innerHTML = ""; }
                showFloatingAlert('Failed to update employee. Please try again.', 'warning', 4000);
                console.error(error);
            });
    });
    setupImageInput(inputKtp, ktpLabel, ktpClearBtn);

    const cvInput = document.getElementById('cv');
    const cvFileName = document.getElementById('cvFileName');
    if (cvInput && cvFileName) {
        cvInput.addEventListener('change', function () {
            const file = this.files && this.files[0] ? this.files[0] : null;
            cvFileName.value = file ? file.name : '';
        });
    }

    const pkwtInput = document.getElementById('pkwt');
    const pkwtFileName = document.getElementById('pkwtFileName');
    if (pkwtInput && pkwtFileName) {
        pkwtInput.addEventListener('change', function () {
            const file = this.files && this.files[0] ? this.files[0] : null;
            pkwtFileName.value = file ? file.name : '';
        });
    }


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


$('#basic_salary,#positional_allowance,#pension_allowance,#bpjs_allowance,#bpjs_tenaga_kerja_allowance').mask('000.000.000', {reverse: true});

$('[name="hid_thp"]').mask('000.000.000', {reverse: true});

$('.text-thp').html($('[name="hid_thp"]').val());

$('#basic_salary').on('keyup',function(){
    $('[name="basic_salary"]').val($('#basic_salary').cleanVal());
});

$('#positional_allowance').on('keyup',function(){
    $('[name="positional_allowance"]').val($('#positional_allowance').cleanVal());
});

$('#pension_allowance').on('keyup',function(){
    $('[name="pension_allowance"]').val($('#pension_allowance').cleanVal());
});

$('#bpjs_allowance').on('keyup',function(){
    $('[name="bpjs_allowance"]').val($('#bpjs_allowance').cleanVal());
});

$('#bpjs_tenaga_kerja_allowance').on('keyup',function(){
    $('[name="bpjs_tenaga_kerja_allowance"]').val($('#bpjs_tenaga_kerja_allowance').cleanVal());
});


$('#basic_salary,#positional_allowance,#pension_allowance,#bpjs_allowance,#bpjs_tenaga_kerja_allowance').on('keyup',function(){
    setTHP();
});

function setTHP(){
    let basicSalary = $('[name="basic_salary"]').val();
    let positionalAllowance = $('[name="positional_allowance"]').val();
    let transportationAllowance = $('[name="pension_allowance"]').val();
    let mealAllowance = $('[name="bpjs_allowance"]').val();
    let internetPhoneAllowance = $('[name="bpjs_tenaga_kerja_allowance"]').val();
    let thp = parseInt(basicSalary) + parseInt(positionalAllowance) + parseInt(transportationAllowance) + parseInt(mealAllowance) + parseInt(internetPhoneAllowance);
    
    $('[name="hid_thp"]').val(thp).unmask().mask('000.000.000', {reverse: true});

    $('.text-thp').html($('[name="hid_thp"]').val());
}