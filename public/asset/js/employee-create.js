var appUrl = $('meta[name="app-url"]').attr("content");

document.addEventListener("DOMContentLoaded", function () {
    // --- DYNAMIC DROPDOWN LOGIC ---
    const departmentSelect = document.getElementById("department_id");
    const divisionSelect = document.getElementById("division_id");
    const jobSelect = document.getElementById("job_id");

    // Load departments on page load
    function loadDepartments() {
        $.ajax({
            url: appUrl + "/departments",
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
                alert("Failed to load departments.");
            },
        });
    }

    // Load divisions when department changes
    function loadDivisions(departmentId) {
        divisionSelect.innerHTML =
            '<option value="" disabled selected>Loading...</option>';
        $.ajax({
            url: appUrl + "/divisions",
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
                alert("Failed to load divisions.");
            },
        });
    }

    // Load jobs when division changes
    function loadJobs(divisionId) {
        jobSelect.innerHTML =
            '<option value="" disabled selected>Loading...</option>';
        $.ajax({
            url: appUrl + "/jobs",
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
                alert("Failed to load jobs.");
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
            formData.set("email", formData.get("employee_email"));
            formData.delete("employee_email");
            formData.set("email_work", formData.get("employee_email_work"));
            formData.delete("employee_email_work");
            formData.set("phone", formData.get("employee_phone"));
            formData.delete("employee_phone");
            // Removed setting status as it is not present in the form
            // formData.set("status", formData.get("status"));
            formData.set("address", formData.get("address"));
            formData.set("birth_date", formData.get("birth_date"));
            formData.set("hire_date", formData.get("hire_date"));
            formData.set("grade", formData.get("grade"));
            formData.set("office", formData.get("office"));
            formData.set("department_id", formData.get("department_id"));
            formData.set("division_id", formData.get("division_id"));
            formData.set("job_id", formData.get("job_id"));

            $.ajax({
                url: appUrl + "/employees",
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

                if (response.redirect_url) {
                    formAlert.innerHTML =
                        '<div class="alert alert-success">Employee created successfully.</div>';
                    // Hide alert after 1.5 seconds and then redirect
                    setTimeout(() => {
                        formAlert.innerHTML = "";
                        window.location.href = response.redirect_url;
                    }, 1500);
                    employeeCreateForm.reset();
                    return;
                }
                formAlert.innerHTML =
                    '<div class="alert alert-success">Employee created successfully.</div>';
                // Hide alert after 1.5 seconds
                setTimeout(() => {
                    formAlert.innerHTML = "";
                }, 1500);
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
                        // Validation errors
                        let errorsHtml = '<div class="alert alert-danger"><ul>';
                        const errors = xhr.responseJSON.errors;
                        for (const key in errors) {
                            errors[key].forEach((msg) => {
                                errorsHtml += `<li>${msg}</li>`;
                            });
                        }
                        errorsHtml += "</ul></div>";
                        formAlert.innerHTML = errorsHtml;
                    } else {
                        formAlert.innerHTML =
                            '<div class="alert alert-danger">Failed to create employee.</div>';
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
});
