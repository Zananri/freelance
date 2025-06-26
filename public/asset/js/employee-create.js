document.addEventListener("DOMContentLoaded", function () {
    // --- DYNAMIC DROPDOWN LOGIC ---
    const departmentSelect = document.getElementById("department_id");
    const divisionSelect = document.getElementById("division_id");
    const jobSelect = document.getElementById("job_id");

    // Load departments on page load
    function loadDepartments() {
        fetch("/departments", { headers: { Accept: "application/json" } })
            .then((res) => res.json())
            .then((data) => {
                let options =
                    '<option value="" disabled selected>Select Department</option>';
                (data.data || []).forEach((dept) => {
                    options += `<option value="${dept.id}">${
                        dept.name_department || dept.name
                    }</option>`;
                });
                departmentSelect.innerHTML = options;
            });
    }

    // Load divisions when department changes
    function loadDivisions(departmentId) {
        divisionSelect.innerHTML =
            '<option value="" disabled selected>Loading...</option>';
        fetch(`/divisions?department_id=${departmentId}`, {
            headers: { Accept: "application/json" },
        })
            .then((res) => res.json())
            .then((data) => {
                let options =
                    '<option value="" disabled selected>Select Division</option>';
                (data.data || []).forEach((div) => {
                    options += `<option value="${div.id}">${
                        div.name_division || div.name
                    }</option>`;
                });
                divisionSelect.innerHTML = options;
                jobSelect.innerHTML =
                    '<option value="" disabled selected>Select Job</option>'; // reset job
            });
    }

    // Load jobs when division changes
    function loadJobs(divisionId) {
        jobSelect.innerHTML =
            '<option value="" disabled selected>Loading...</option>';
        fetch(`/jobs?division_id=${divisionId}`, {
            headers: { Accept: "application/json" },
        })
            .then((res) => res.json())
            .then((data) => {
                let options =
                    '<option value="" disabled selected>Select Job</option>';
                (data.data || []).forEach((job) => {
                    options += `<option value="${job.id}">${
                        job.job_name || job.name
                    }</option>`;
                });
                jobSelect.innerHTML = options;
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

    function setupImageInput(inputId, labelSelector, clearBtnId) {
        const input = document.getElementById(inputId);
        const label = document.querySelector(labelSelector);
        const clearBtn = document.getElementById(clearBtnId);

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
                clearBtn.classList.add("d-none");
            });
        }
    }

    // AJAX form submission for employee create form
    const employeeCreateForm = document.getElementById("employeeCreateForm");
    const formAlert = document.getElementById("formAlert");

    if (employeeCreateForm) {
        employeeCreateForm.addEventListener("submit", function (e) {
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
            formData.set("phone", formData.get("employee_phone"));
            formData.delete("employee_phone");
            formData.set("status", formData.get("status"));
            formData.set("address", formData.get("address"));
            formData.set("birth_date", formData.get("birth_date"));
            formData.set("hire_date", formData.get("hire_date"));
            formData.set("grade", formData.get("grade"));
            formData.set("office", formData.get("office"));
            formData.set("department_id", formData.get("department_id"));
            formData.set("division_id", formData.get("division_id"));
            formData.set("job_id", formData.get("job_id"));

            fetch("/employees", {
                method: "POST",
                headers: {
                    "X-CSRF-TOKEN": document
                        .querySelector('meta[name="csrf-token"]')
                        .getAttribute("content"),
                    Accept: "application/json",
                },
                body: formData,
            })
                .then((response) =>
                    response
                        .json()
                        .then((data) => ({
                            status: response.status,
                            body: data,
                        }))
                )
                .then(({ status, body }) => {
                    // Hide loader
                    if (employeeCreateLoader) employeeCreateLoader.classList.add("d-none");

                    if (status === 422) {
                        // Validation errors
                        let errorsHtml = '<div class="alert alert-danger"><ul>';
                        for (const key in body.errors) {
                            body.errors[key].forEach((msg) => {
                                errorsHtml += `<li>${msg}</li>`;
                            });
                        }
                        errorsHtml += "</ul></div>";
                        formAlert.innerHTML = errorsHtml;
                    } else if (status >= 200 && status < 300) {
                    formAlert.innerHTML =
                        '<div class="alert alert-success">Employee created successfully.</div>';
                    // Hide alert after 2.5 seconds (same as department)
                    setTimeout(() => {
                        formAlert.innerHTML = "";
                    }, 1500);
                    employeeCreateForm.reset();
                    // Reset image previews
                    ["photo", "ktp", "profile_picture"].forEach((id) => {
                        const input = document.getElementById(id);
                        if (input) input.value = "";
                        const label = document.querySelector(
                            `label[for="${id}"]`
                        );
                        if (label) {
                            label.style.backgroundImage = "";
                            label.classList.remove("has-image");
                            label.style.opacity = "0.5";
                        }
                        const clearBtn = document.getElementById(
                            id === "profile_picture"
                                ? "profilePictureClearBtn"
                                : id + "ClearBtn"
                        );
                        if (clearBtn) clearBtn.classList.add("d-none");
                    });
                    } else {
                        formAlert.innerHTML =
                            '<div class="alert alert-danger">Failed to create employee.</div>';
                    }
                })
                .catch(() => {
                    // Hide loader
                    if (employeeCreateLoader) employeeCreateLoader.classList.add("d-none");
                    formAlert.innerHTML =
                        '<div class="alert alert-danger">Failed to create employee.</div>';
                });
        });
    }

    setupImageInput("photo", 'label[for="photo"]', "photoClearBtn");
    setupImageInput("ktp", 'label[for="ktp"]', "ktpClearBtn");
    setupImageInput(
        "profile_picture",
        'label[for="profile_picture"]',
        "profilePictureClearBtn"
    );
});
