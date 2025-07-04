document.addEventListener("DOMContentLoaded", function () {
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

    function loadDepartments(selectedId) {
        fetch("/departments", { headers: { Accept: "application/json" } })
            .then((res) => res.json())
            .then((data) => {
                let options =
                    '<option value="" disabled>Select Department</option>';
                (data.data || []).forEach((dept) => {
                    options += `<option value="${dept.id}" ${
                        dept.id == selectedId ? "selected" : ""
                    }>${dept.name_department || dept.name}</option>`;
                });
                departmentSelect.innerHTML = options;
                if (selectedId) {
                    loadDivisions(
                        selectedId,
                        divisionSelect.getAttribute("data-current")
                    );
                }
            });
    }

    function loadDivisions(departmentId, selectedId) {
        divisionSelect.innerHTML =
            '<option value="" disabled>Loading...</option>';
        fetch(`/divisions?department_id=${departmentId}`, {
            headers: { Accept: "application/json" },
        })
            .then((res) => res.json())
            .then((data) => {
                let options =
                    '<option value="" disabled>Select Division</option>';
                (data.data || []).forEach((div) => {
                    options += `<option value="${div.id}" ${
                        div.id == selectedId ? "selected" : ""
                    }>${div.name_division || div.name}</option>`;
                });
                divisionSelect.innerHTML = options;
                if (selectedId) {
                    loadJobs(
                        selectedId,
                        jobSelect.getAttribute("data-current")
                    );
                } else {
                    jobSelect.innerHTML =
                        '<option value="" disabled>Select Job</option>';
                }
            });
    }

    function loadJobs(divisionId, selectedId) {
        jobSelect.innerHTML = '<option value="" disabled>Loading...</option>';
        fetch(`/jobs?division_id=${divisionId}`, {
            headers: { Accept: "application/json" },
        })
            .then((res) => res.json())
            .then((data) => {
                let options = '<option value="" disabled>Select Job</option>';
                (data.data || []).forEach((job) => {
                    options += `<option value="${job.id}" ${
                        job.id == selectedId ? "selected" : ""
                    }>${job.job_name || job.name}</option>`;
                });
                jobSelect.innerHTML = options;
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

    departmentSelect.addEventListener("change", function () {
        const deptId = this.value;
        if (deptId) {
            loadDivisions(deptId, null);
        } else {
            divisionSelect.innerHTML =
                '<option value="" disabled>Select Division</option>';
            jobSelect.innerHTML =
                '<option value="" disabled>Select Job</option>';
        }
    });

    divisionSelect.addEventListener("change", function () {
        const divId = this.value;
        if (divId) {
            loadJobs(divId, null);
        } else {
            jobSelect.innerHTML =
                '<option value="" disabled>Select Job</option>';
        }
    });

    // Image input preview and clear button handlers
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
    setupImageInput(inputKtp, ktpLabel, ktpClearBtn);

    // Form validation and submission
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
        formData.set("email", formData.get("employee_email"));
        formData.delete("employee_email");
        formData.set("email_work", formData.get("employee_email_work"));
        formData.delete("employee_email_work");
        formData.set("phone", formData.get("employee_phone"));
        formData.delete("employee_phone");

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
            .then((response) => response.json())
.then((data) => {
                loaderOverlay.classList.add("d-none");
                if (data.errors) {
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
                } else if (data.message) {
                    if (formAlert) {
                        formAlert.innerHTML =
                            '<div class="alert alert-success">Employee updated successfully.</div>';
                        setTimeout(() => {
                            formAlert.innerHTML = "";
                            // Save updated photo URL and employee ID in localStorage if photo updated
                            if (data.updatedPhotoUrl && data.employeeId) {
                                localStorage.setItem(
                                    "updatedEmployeePhoto",
                                    JSON.stringify({
                                        employeeId: data.employeeId,
                                        photoUrl: data.updatedPhotoUrl,
                                    })
                                );
                            }
                            window.location.href = "/employee";
                        }, 1500);
                    } else {
                        alert(data.message);
                        // Save updated photo URL and employee ID in localStorage if photo updated
                        if (data.updatedPhotoUrl && data.employeeId) {
                            localStorage.setItem(
                                "updatedEmployeePhoto",
                                JSON.stringify({
                                    employeeId: data.employeeId,
                                    photoUrl: data.updatedPhotoUrl,
                                })
                            );
                        }
                        window.location.href = "/employee";
                    }
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
                }
            })
            .catch((error) => {
                loaderOverlay.classList.add("d-none");
                if (formAlert) {
                    formAlert.innerHTML =
                        '<div class="alert alert-danger">An error occurred while updating the employee.</div>';
                } else {
                    alert("An error occurred while updating the employee.");
                }
                console.error(error);
            });
    });

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
