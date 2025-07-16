document.addEventListener("DOMContentLoaded", function () {
    const appUrl = document.querySelector('meta[name="app-url"]')?.getAttribute("content") || "";

    const imageInput = document.getElementById("task_image");
    const imageLabel = document.getElementById("taskImageLabel");
    const imageClearBtn = document.getElementById("taskImageClearBtn");
    const addTaskModalEl = document.getElementById("addTaskModal");
    const addTaskForm = document.getElementById("addTaskForm");
    const projectSelect = document.getElementById("task_project_id");

    function setupImageInput(input, label, clearBtn) {
        input.addEventListener("change", function () {
            if (input.files && input.files[0]) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    label.style.backgroundImage = `url('${e.target.result}')`;
                    label.classList.add("has-image");
                    label.style.backgroundSize = "cover";
                    label.style.opacity = "1";
                    clearBtn.classList.remove("d-none");
                };
                reader.readAsDataURL(input.files[0]);
            } else {
                label.style.backgroundImage = "";
                label.classList.remove("has-image");
                label.style.opacity = "0.5";
                clearBtn.classList.add("d-none");
            }
        });

        clearBtn.addEventListener("click", function (e) {
            e.preventDefault();
            input.value = "";
            label.style.backgroundImage =
                "url('" + appUrl + "/asset/img/background/add-image.png')";
            label.style.backgroundPosition = "center center";
            label.style.backgroundRepeat = "no-repeat";
            label.style.backgroundSize = "50%";
            label.classList.remove("has-image");
            label.style.opacity = "0.5";
            label.classList.remove("is-valid");
            label.classList.remove("is-invalid");
            clearBtn.classList.add("d-none");
        });
    }

    function loadProjects() {
        if (!projectSelect) return;
        fetch(appUrl + "/project/index")
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Failed to load projects");
                }
                return response.json();
            })
            .then((data) => {
                if (!data.data) return;
                let options = '<option value="" disabled selected>Select Project</option>';
                data.data.forEach((project) => {
                    options += `<option value="${project.id}">${project.title}</option>`;
                });
                projectSelect.innerHTML = options;
            })
            .catch((error) => {
                console.error("Error loading projects:", error);
            });
    }

    if (imageInput && imageLabel && imageClearBtn) {
        setupImageInput(imageInput, imageLabel, imageClearBtn);
    }

    if (addTaskModalEl) {
        addTaskModalEl.addEventListener("hidden.bs.modal", function () {
            if (addTaskForm) {
                addTaskForm.reset();
            }
            if (imageLabel && imageClearBtn) {
                imageLabel.style.backgroundImage =
                    "url('" + appUrl + "/asset/img/background/add-image.png')";
                imageLabel.style.backgroundPosition = "center center";
                imageLabel.style.backgroundRepeat = "no-repeat";
                imageLabel.style.backgroundSize = "50%";
                imageLabel.classList.remove("has-image");
                imageLabel.style.opacity = "0.5";
                imageClearBtn.classList.add("d-none");
            }
            // Clear executor selections
            if (window.clearSelectedExecutors) {
                window.clearSelectedExecutors();
            }
        });
    }

    if (addTaskForm) {
        addTaskForm.addEventListener("submit", function (e) {
            e.preventDefault();

            if (!addTaskForm.checkValidity()) {
                e.stopPropagation();
                addTaskForm.classList.add("was-validated");
                return;
            }
            addTaskForm.classList.remove("was-validated");

            // Show loading overlay and disable submit button
            const loader = document.getElementById("addTaskModalLoader");
            if (loader) loader.classList.remove("d-none");
            const submitBtn = addTaskForm.querySelector("button[type='submit']");
            if (submitBtn) submitBtn.disabled = true;

            const formData = new FormData(addTaskForm);

            fetch(appUrl + "/task/store", {
                method: "POST",
                headers: {
                    "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]').getAttribute("content"),
                },
                body: formData,
            })
                .then((response) => {
                    if (!response.ok) {
                        return response.json().then((err) => {
                            throw err;
                        });
                    }
                    return response.json();
                })
                .then((data) => {
                    // Show success alert
                    let alertContainer = document.querySelector("#addTaskModal").parentElement.querySelector(".alert-container");
                    if (!alertContainer) {
                        alertContainer = document.createElement("div");
                        alertContainer.className = "alert-container mt-2";
                        alertContainer.style.width = "100%";
                        document.querySelector("#addTaskModal").parentElement.appendChild(alertContainer);
                    }
                    alertContainer.innerHTML = `<div class="alert alert-success" role="alert">${data.message || "Task added successfully!"}</div>`;
                    alertContainer.style.display = "block";

                    // Reset form and preview
                    addTaskForm.reset();
                    imageLabel.style.backgroundImage = "";
                    imageLabel.classList.remove("has-image");
                    imageLabel.style.opacity = "0.5";
                    imageClearBtn.classList.add("d-none");

                    // Close modal after short delay to show alert
                    setTimeout(() => {
                        var addTaskModalInstance = bootstrap.Modal.getInstance(addTaskModalEl);
                        if (addTaskModalInstance) addTaskModalInstance.hide();
                        alertContainer.style.display = "none";
                        // Optionally reload or update task list here
                    }, 1500);
                })
                .catch((error) => {
                    let errorMessage = "Failed to create task.";
                    if (error.errors) {
                        errorMessage = Object.values(error.errors).flat().join("\n");
                    } else if (error.message) {
                        errorMessage = error.message;
                    }
                    alert(errorMessage);
                })
                .finally(() => {
                    if (loader) loader.classList.add("d-none");
                    if (submitBtn) submitBtn.disabled = false;
                });
        });
    }

    // Existing code...

    // Executor input setup
    function setupExecutorInput() {
        const input = document.getElementById('executor_input');
        const dropdown = document.getElementById('executor_dropdown');
        const selectedContainer = document.getElementById('selected_executors');
        const hiddenInput = document.getElementById('executors');

        let employees = [];
        let filteredEmployees = [];
        let selectedEmployees = [];

        function fetchEmployees(query = '') {
            $.ajax({
                url: appUrl + '/employee/index',
                type: 'GET',
                data: { query: query },
                dataType: 'json',
                success: function (data) {
                    employees = data.data || [];
                    filteredEmployees = employees;
                    renderDropdown();
                },
                error: function () {
                    alert('Failed to load employees.');
                }
            });
        }

        function renderDropdown() {
            if (filteredEmployees.length === 0) {
                dropdown.innerHTML = '<div class="dropdown-item disabled">No employees found</div>';
                dropdown.style.display = 'block';
                return;
            }

            const html = filteredEmployees.map(emp => {
                const isChecked = selectedEmployees.some(e => e.id === emp.id);
                let photoUrl = '';
                if (emp.user_photo) {
                    if (emp.user_photo.startsWith('http')) {
                        photoUrl = emp.user_photo;
                    } else if (emp.user_photo.startsWith('/file/photo') || emp.user_photo.startsWith('/file/profile_picture')) {
                        photoUrl = appUrl + emp.user_photo;
                    } else if (emp.user_photo.startsWith('file/photo') || emp.user_photo.startsWith('file/profile_picture')) {
                        photoUrl = appUrl + '/' + emp.user_photo;
                    } else {
                        photoUrl = appUrl + '/file/profile_picture/' + emp.user_photo;
                    }
                } else {
                    photoUrl = appUrl + '/asset/img/profile_picture/default.png';
                }
                return `
                    <label class="dropdown-item d-flex align-items-center justify-content-between" style="cursor: pointer;">
                        <div class="d-flex align-items-center">
                            <img src="${photoUrl}" alt="${emp.name}" class="rounded-circle me-2" style="width: 30px; height: 30px; object-fit: cover;">
                            <span>${emp.name}</span>
                        </div>
                        <input type="checkbox" class="executor-checkbox" data-id="${emp.id}" data-name="${emp.name}" ${isChecked ? 'checked' : ''}>
                    </label>
                `;
            }).join('');
            dropdown.innerHTML = html;
            dropdown.style.display = 'block';

            dropdown.querySelectorAll('.executor-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', function () {
                    const id = parseInt(this.getAttribute('data-id'));
                    const name = this.getAttribute('data-name');
                    const employeeObj = employees.find(emp => emp.id === id);
                    if (this.checked) {
                        if (!selectedEmployees.some(e => e.id === id)) {
                            selectedEmployees.push({ id, name, user_photo: employeeObj ? employeeObj.user_photo : null });
                        }
                    } else {
                        selectedEmployees = selectedEmployees.filter(e => e.id !== id);
                    }
                    renderSelected();
                    updateHiddenInput();
                });
            });
        }

        function renderSelected() {
            selectedContainer.innerHTML = '';
            selectedEmployees.forEach(emp => {
                let photoUrl = '';
                if (emp.user_photo) {
                    if (emp.user_photo.startsWith('http')) {
                        photoUrl = emp.user_photo;
                    } else if (emp.user_photo.startsWith('/file/photo') || emp.user_photo.startsWith('/file/profile_picture')) {
                        photoUrl = appUrl + emp.user_photo;
                    } else if (emp.user_photo.startsWith('file/photo') || emp.user_photo.startsWith('file/profile_picture')) {
                        photoUrl = appUrl + '/' + emp.user_photo;
                    } else {
                        photoUrl = appUrl + '/file/profile_picture/' + emp.user_photo;
                    }
                } else {
                    photoUrl = appUrl + '/asset/img/profile_picture/default.png';
                }

                const badge = document.createElement('span');
                badge.className = 'badge bg-primary d-inline-flex align-items-center me-2 mb-2';

                const img = document.createElement('img');
                img.src = photoUrl;
                img.alt = emp.name;
                img.className = 'rounded-circle me-2';
                img.style.width = '24px';
                img.style.height = '24px';
                img.style.objectFit = 'cover';

                const nameSpan = document.createElement('span');
                nameSpan.textContent = emp.name;

                const removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.className = 'btn-close btn-close-white btn-sm ms-2';
                removeBtn.setAttribute('aria-label', 'Remove');
                removeBtn.addEventListener('click', () => {
                    selectedEmployees = selectedEmployees.filter(e => e.id !== emp.id);
                    renderSelected();
                    updateHiddenInput();
                    renderDropdown();
                });

                badge.appendChild(img);
                badge.appendChild(nameSpan);
                badge.appendChild(removeBtn);
                selectedContainer.appendChild(badge);
            });
        }

        function updateHiddenInput() {
            hiddenInput.value = JSON.stringify(selectedEmployees.map(e => e.id));
        }

        function filterEmployees(value) {
            const val = value.trim().toLowerCase();
            if (val === '') {
                filteredEmployees = employees;
            } else {
                filteredEmployees = employees.filter(emp => emp.name.toLowerCase().includes(val));
            }
            renderDropdown();
        }

        input.addEventListener('input', function () {
            filterEmployees(this.value);
        });

        input.addEventListener('focus', function () {
            filterEmployees(this.value);
        });

        document.addEventListener('click', function (e) {
            if (!input.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });

        fetchEmployees();

        window.clearSelectedExecutors = function () {
            selectedEmployees = [];
            renderSelected();
            updateHiddenInput();
            dropdown.style.display = 'none';
            input.value = '';
        };
    }

    setupExecutorInput();

    loadProjects();
});
