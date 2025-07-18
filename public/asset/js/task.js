document.addEventListener("DOMContentLoaded", function () {
    const appUrl =
        document
            .querySelector('meta[name="app-url"]')
            ?.getAttribute("content") || "";

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
                let options =
                    '<option value="" disabled selected>Select Project</option>';
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
            const submitBtn = addTaskForm.querySelector(
                "button[type='submit']"
            );
            if (submitBtn) submitBtn.disabled = true;

            const formData = new FormData(addTaskForm);

            // Append all selected reference files to formData
            selectedFiles.forEach((file) => {
                formData.append("reference_files[]", file);
            });

            $.ajax({
                url: appUrl + "/task/store",
                type: "POST",
                headers: {
                    "X-CSRF-TOKEN": document
                        .querySelector('meta[name="csrf-token"]')
                        .getAttribute("content"),
                },
                data: formData,
                processData: false,
                contentType: false,
                success: function (data) {
                    // Keep loading overlay visible for a moment to show success
                    setTimeout(() => {
                        // Hide loading overlay
                        if (loader) loader.classList.add("d-none");
                        if (submitBtn) submitBtn.disabled = false;

                        // Show success alert
                        let alertContainer = document.querySelector(
                            "#addTaskModal .modal-dialog .alert-container"
                        );
                        if (!alertContainer) {
                            alertContainer = document.createElement("div");
                            alertContainer.className = "alert-container mt-2";
                            alertContainer.style.width = "100%";
                            document
                                .querySelector("#addTaskModal .modal-dialog")
                                .appendChild(alertContainer);
                        }
                        alertContainer.innerHTML = `<div class="alert alert-success" role="alert">${
                            data.message || "Task added successfully!"
                        }</div>`;
                        alertContainer.style.display = "block";

                        // Reset form and preview
                        addTaskForm.reset();
                        imageLabel.style.backgroundImage = "";
                        imageLabel.classList.remove("has-image");
                        imageLabel.style.opacity = "0.5";
                        imageClearBtn.classList.add("d-none");

                        // Reset selected files array
                        selectedFiles = [];
                        displaySelectedFiles();

                        // Close modal after short delay to show alert
                        setTimeout(() => {
                            var addTaskModalInstance =
                                bootstrap.Modal.getInstance(addTaskModalEl);
                            if (addTaskModalInstance)
                                addTaskModalInstance.hide();
                            alertContainer.style.display = "none";
                            // Reload page after adding task
                            window.location.reload();
                        }, 1500);
                    }, 800); // Show loading for 800ms before showing success alert
                },
                error: function (xhr) {
                    // Hide loading overlay on error
                    if (loader) loader.classList.add("d-none");
                    if (submitBtn) submitBtn.disabled = false;

                    let errorMessage = "Failed to create task.";
                    if (xhr.responseJSON && xhr.responseJSON.errors) {
                        errorMessage = Object.values(xhr.responseJSON.errors)
                            .flat()
                            .join("\n");
                    } else if (xhr.responseJSON && xhr.responseJSON.message) {
                        errorMessage = xhr.responseJSON.message;
                    }
                    alert(errorMessage);
                },
                complete: function () {
                    // Don't hide loader here, let success/error handle it
                    // This prevents loader from disappearing too early
                },
            });
        });
    }

    // Existing code...

    // Executor input setup
    function setupExecutorInput() {
        const input = document.getElementById("executor_input");
        const dropdown = document.getElementById("executor_dropdown");
        const selectedContainer = document.getElementById("selected_executors");
        const hiddenInput = document.getElementById("executors");

        let employees = [];
        let filteredEmployees = [];
        let selectedEmployees = [];

        function fetchEmployees(query = "") {
            $.ajax({
                url: appUrl + "/task/employees-for-executor",
                type: "GET",
                data: { q: query },
                dataType: "json",
                success: function (data) {
                    employees = data.data || [];
                    filteredEmployees = employees;
                    renderDropdown();
                },
                error: function () {
                    alert("Failed to load employees.");
                },
            });
        }

        function renderDropdown() {
            if (filteredEmployees.length === 0) {
                dropdown.innerHTML =
                    '<div class="dropdown-item disabled">No employees found</div>';
                dropdown.style.display = "block";
                return;
            }

            const html = filteredEmployees
                .map((emp) => {
                    const isChecked = selectedEmployees.some(
                        (e) => e.id === emp.id
                    );
                    let photoUrl = "";
                    if (emp.user_photo) {
                        if (emp.user_photo.startsWith("http")) {
                            photoUrl = emp.user_photo;
                        } else if (
                            emp.user_photo.startsWith("/file/photo") ||
                            emp.user_photo.startsWith("/file/profile_picture")
                        ) {
                            photoUrl = appUrl + emp.user_photo;
                        } else if (
                            emp.user_photo.startsWith("file/photo") ||
                            emp.user_photo.startsWith("file/profile_picture")
                        ) {
                            photoUrl = appUrl + "/" + emp.user_photo;
                        } else {
                            photoUrl =
                                appUrl +
                                "/file/profile_picture/" +
                                emp.user_photo;
                        }
                    } else {
                        photoUrl =
                            appUrl + "/asset/img/profile_picture/default.png";
                    }
                    return `
                    <label class="dropdown-item d-flex align-items-center justify-content-between" style="cursor: pointer;">
                        <div class="d-flex align-items-center">
                            <img src="${photoUrl}" alt="${
                        emp.name
                    }" class="rounded-circle me-2" style="width: 30px; height: 30px; object-fit: cover;">
                            <span>${emp.name}</span>
                        </div>
                        <input type="checkbox" class="executor-checkbox" data-id="${
                            emp.id
                        }" data-name="${emp.name}" ${
                        isChecked ? "checked" : ""
                    }>
                    </label>
                `;
                })
                .join("");
            dropdown.innerHTML = html;
            dropdown.style.display = "block";

            dropdown
                .querySelectorAll(".executor-checkbox")
                .forEach((checkbox) => {
                    checkbox.addEventListener("change", function () {
                        const id = parseInt(this.getAttribute("data-id"));
                        const name = this.getAttribute("data-name");
                        const employeeObj = employees.find(
                            (emp) => emp.id === id
                        );
                        if (this.checked) {
                            if (!selectedEmployees.some((e) => e.id === id)) {
                                selectedEmployees.push({
                                    id,
                                    name,
                                    user_photo: employeeObj
                                        ? employeeObj.user_photo
                                        : null,
                                });
                            }
                        } else {
                            selectedEmployees = selectedEmployees.filter(
                                (e) => e.id !== id
                            );
                        }
                        renderSelected();
                        updateHiddenInput();
                    });
                });
        }

        function renderSelected() {
            selectedContainer.innerHTML = "";
            selectedEmployees.forEach((emp) => {
                let photoUrl = "";
                if (emp.user_photo) {
                    if (emp.user_photo.startsWith("http")) {
                        photoUrl = emp.user_photo;
                    } else if (
                        emp.user_photo.startsWith("/file/photo") ||
                        emp.user_photo.startsWith("/file/profile_picture")
                    ) {
                        photoUrl = appUrl + emp.user_photo;
                    } else if (
                        emp.user_photo.startsWith("file/photo") ||
                        emp.user_photo.startsWith("file/profile_picture")
                    ) {
                        photoUrl = appUrl + "/" + emp.user_photo;
                    } else {
                        photoUrl =
                            appUrl + "/file/profile_picture/" + emp.user_photo;
                    }
                } else {
                    photoUrl =
                        appUrl + "/asset/img/profile_picture/default.png";
                }

                const badge = document.createElement("span");
                badge.className =
                    "badge bg-primary d-inline-flex align-items-center me-2 mb-2";

                const img = document.createElement("img");
                img.src = photoUrl;
                img.alt = emp.name;
                img.className = "rounded-circle me-2";
                img.style.width = "24px";
                img.style.height = "24px";
                img.style.objectFit = "cover";

                const nameSpan = document.createElement("span");
                nameSpan.textContent = emp.name;

                const removeBtn = document.createElement("button");
                removeBtn.type = "button";
                removeBtn.className = "btn-close btn-close-white btn-sm ms-2";
                removeBtn.setAttribute("aria-label", "Remove");
                removeBtn.addEventListener("click", () => {
                    selectedEmployees = selectedEmployees.filter(
                        (e) => e.id !== emp.id
                    );
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
            hiddenInput.value = JSON.stringify(
                selectedEmployees.map((e) => e.id)
            );
        }

        function filterEmployees(value) {
            const val = value.trim().toLowerCase();
            if (val === "") {
                filteredEmployees = employees;
            } else {
                filteredEmployees = employees.filter((emp) =>
                    emp.name.toLowerCase().includes(val)
                );
            }
            renderDropdown();
        }

        input.addEventListener("input", function () {
            filterEmployees(this.value);
        });

        input.addEventListener("focus", function () {
            filterEmployees(this.value);
        });

        document.addEventListener("click", function (e) {
            if (!input.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = "none";
            }
        });

        fetchEmployees();

        window.clearSelectedExecutors = function () {
            selectedEmployees = [];
            renderSelected();
            updateHiddenInput();
            dropdown.style.display = "none";
            input.value = "";
        };
    }

    setupExecutorInput();
    setupEditExecutorInput();
    setupReferenceFilesInput();
    setupEditReferenceFilesInput();

    loadProjects();

    // Handle edit task form submission (rebuilt from scratch like add task)
    const editTaskModalEl = document.getElementById("editTaskModal");
    const editTaskForm = document.getElementById("editTaskForm");

    if (editTaskForm) {
        editTaskForm.addEventListener("submit", function (e) {
            e.preventDefault();

            const taskId = document.getElementById("edit_task_id").value;
            if (!taskId) {
                alert("Task ID is missing.");
                return;
            }

            if (!editTaskForm.checkValidity()) {
                e.stopPropagation();
                editTaskForm.classList.add("was-validated");
                return;
            }
            editTaskForm.classList.remove("was-validated");

            // Show loading overlay and disable submit button
            const loader = document.getElementById("editTaskModalLoader");
            if (loader) loader.classList.remove("d-none");
            const submitBtn = editTaskForm.querySelector(
                "button[type='submit']"
            );
            if (submitBtn) submitBtn.disabled = true;

            const formData = new FormData(editTaskForm);
            // Add _method to FormData for Laravel PUT request
            formData.append("_method", "PUT");

            // Append all selected reference files from global array to formData
            if (
                window.editSelectedFiles &&
                window.editSelectedFiles.length > 0
            ) {
                window.editSelectedFiles.forEach((file) => {
                    formData.append("reference_files[]", file);
                });
            }

            $.ajax({
                url: appUrl + "/task/" + taskId,
                type: "POST", // Laravel expects POST with _method=PUT for PUT requests
                headers: {
                    "X-CSRF-TOKEN": document
                        .querySelector('meta[name="csrf-token"]')
                        .getAttribute("content"),
                },
                data: formData,
                processData: false,
                contentType: false,
                success: function (data) {
                    // Keep loading overlay visible for a moment to show success
                    setTimeout(() => {
                        // Hide loading overlay
                        if (loader) loader.classList.add("d-none");
                        if (submitBtn) submitBtn.disabled = false;

                        // Show success alert (exactly same as Add Task)
                        let alertContainer = document.querySelector(
                            "#editTaskModal .modal-dialog .alert-container"
                        );
                        if (!alertContainer) {
                            alertContainer = document.createElement("div");
                            alertContainer.className = "alert-container mt-2";
                            alertContainer.style.width = "100%";
                            document
                                .querySelector("#editTaskModal .modal-dialog")
                                .appendChild(alertContainer);
                        }
                        alertContainer.innerHTML = `<div class="alert alert-success" role="alert">${
                            data.message || "Task updated successfully!"
                        }</div>`;
                        alertContainer.style.display = "block";

                        // Reset form and preview (same as Add Task)
                        editTaskForm.reset();
                        const editImageLabel =
                            document.getElementById("editTaskImageLabel");
                        const editImageClearBtn = document.getElementById(
                            "editTaskImageClearBtn"
                        );
                        if (editImageLabel) {
                            editImageLabel.style.backgroundImage = "";
                            editImageLabel.classList.remove("has-image");
                            editImageLabel.style.opacity = "0.5";
                        }
                        if (editImageClearBtn) {
                            editImageClearBtn.classList.add("d-none");
                        }

                        // Clear selected executors
                        if (window.clearSelectedExecutorsEdit) {
                            window.clearSelectedExecutorsEdit();
                        }

                        // Clear selected files after successful update
                        window.editSelectedFiles = [];
                        displayEditSelectedFiles();

                        // Close modal after short delay to show alert
                        setTimeout(() => {
                            var editTaskModalInstance =
                                bootstrap.Modal.getInstance(editTaskModalEl);
                            if (editTaskModalInstance)
                                editTaskModalInstance.hide();
                            alertContainer.style.display = "none";
                            // Refresh task cards without page reload
                            fetchAndRenderTasks();
                        }, 1500);
                    }, 800); // Show loading for 800ms before showing success alert
                },
                error: function (xhr) {
                    // Hide loading overlay on error
                    if (loader) loader.classList.add("d-none");
                    if (submitBtn) submitBtn.disabled = false;

                    let errorMessage = "Failed to update task.";
                    if (xhr.responseJSON && xhr.responseJSON.errors) {
                        errorMessage = Object.values(xhr.responseJSON.errors)
                            .flat()
                            .join("\n");
                    } else if (xhr.responseJSON && xhr.responseJSON.message) {
                        errorMessage = xhr.responseJSON.message;
                    }
                    alert(errorMessage);
                },
                complete: function () {
                    // Don't hide loader here, let success/error handle it
                    // This prevents loader from disappearing too early
                },
            });
        });
    }

    // Setup image input for edit task modal
    const editTaskImageInput = document.getElementById("edit_task_image");
    const editTaskImageLabel = document.getElementById("editTaskImageLabel");
    const editTaskImageClearBtn = document.getElementById(
        "editTaskImageClearBtn"
    );

    if (editTaskImageInput && editTaskImageLabel && editTaskImageClearBtn) {
        setupImageInput(
            editTaskImageInput,
            editTaskImageLabel,
            editTaskImageClearBtn
        );
    }

    // Clear form and reset image preview when edit modal is closed
    var editTaskModalElement = document.getElementById("editTaskModal");
    if (editTaskModalElement) {
        editTaskModalElement.addEventListener("hidden.bs.modal", function () {
            $("#editTaskForm")[0].reset();

            $("#editTaskImageLabel").css(
                "background-image",
                "url('" + appUrl + "/asset/img/background/add-image.png')"
            );
            $("#editTaskImageLabel").removeClass("has-image");
            $("#editTaskImageLabel").css("opacity", "0.5");
            $("#editTaskImageClearBtn").addClass("d-none");

            // Reload projects to reset select
            loadProjects();

            // Clear selected executors display and hidden inputs
            window.clearSelectedExecutorsEdit &&
                window.clearSelectedExecutorsEdit();

            $("#editTaskAlert").addClass("d-none").hide();
        });
    }

    // Function to setup executor input for edit modal
    function setupEditExecutorInput() {
        const input = document.getElementById("edit_executor_input");
        const dropdown = document.getElementById("edit_executor_dropdown");
        const selectedContainer = document.getElementById(
            "edit_selected_executors"
        );
        const hiddenInput = document.getElementById("edit_executors");

        if (!input || !dropdown || !selectedContainer || !hiddenInput) {
            return; // Elements not found, skip setup
        }

        let employees = [];
        let filteredEmployees = [];
        let selectedEmployees = [];

        function fetchEmployees(query = "") {
            $.ajax({
                url: appUrl + "/task/employees-for-executor",
                type: "GET",
                data: { q: query },
                dataType: "json",
                success: function (data) {
                    employees = data.data || [];
                    filteredEmployees = employees;
                    renderDropdown();
                },
                error: function () {
                    alert("Failed to load employees.");
                },
            });
        }

        function renderDropdown() {
            if (filteredEmployees.length === 0) {
                dropdown.innerHTML =
                    '<div class="dropdown-item disabled">No employees found</div>';
                dropdown.style.display = "block";
                return;
            }

            const html = filteredEmployees
                .map((emp) => {
                    const isChecked = selectedEmployees.some(
                        (e) => e.id === emp.id
                    );
                    let photoUrl = "";
                    if (emp.user_photo) {
                        if (emp.user_photo.startsWith("http")) {
                            photoUrl = emp.user_photo;
                        } else if (
                            emp.user_photo.startsWith("/file/photo") ||
                            emp.user_photo.startsWith("/file/profile_picture")
                        ) {
                            photoUrl = appUrl + emp.user_photo;
                        } else if (
                            emp.user_photo.startsWith("file/photo") ||
                            emp.user_photo.startsWith("file/profile_picture")
                        ) {
                            photoUrl = appUrl + "/" + emp.user_photo;
                        } else {
                            photoUrl =
                                appUrl +
                                "/file/profile_picture/" +
                                emp.user_photo;
                        }
                    } else {
                        photoUrl =
                            appUrl + "/asset/img/profile_picture/default.png";
                    }
                    return `
                    <label class="dropdown-item d-flex align-items-center justify-content-between" style="cursor: pointer;">
                        <div class="d-flex align-items-center">
                            <img src="${photoUrl}" alt="${
                        emp.name
                    }" class="rounded-circle me-2" style="width: 30px; height: 30px; object-fit: cover;">
                            <span>${emp.name}</span>
                        </div>
                        <input type="checkbox" class="executor-checkbox" data-id="${
                            emp.id
                        }" data-name="${emp.name}" ${
                        isChecked ? "checked" : ""
                    }>
                    </label>
                `;
                })
                .join("");
            dropdown.innerHTML = html;
            dropdown.style.display = "block";

            dropdown
                .querySelectorAll(".executor-checkbox")
                .forEach((checkbox) => {
                    checkbox.addEventListener("change", function () {
                        const id = parseInt(this.getAttribute("data-id"));
                        const name = this.getAttribute("data-name");
                        const employeeObj = employees.find(
                            (emp) => emp.id === id
                        );
                        if (this.checked) {
                            if (!selectedEmployees.some((e) => e.id === id)) {
                                selectedEmployees.push({
                                    id,
                                    name,
                                    user_photo: employeeObj
                                        ? employeeObj.user_photo
                                        : null,
                                });
                            }
                        } else {
                            selectedEmployees = selectedEmployees.filter(
                                (e) => e.id !== id
                            );
                        }
                        renderSelected();
                        updateHiddenInput();
                    });
                });
        }

        function renderSelected() {
            selectedContainer.innerHTML = "";
            selectedEmployees.forEach((emp) => {
                let photoUrl = "";
                if (emp.user_photo) {
                    if (emp.user_photo.startsWith("http")) {
                        photoUrl = emp.user_photo;
                    } else if (
                        emp.user_photo.startsWith("/file/photo") ||
                        emp.user_photo.startsWith("/file/profile_picture")
                    ) {
                        photoUrl = appUrl + emp.user_photo;
                    } else if (
                        emp.user_photo.startsWith("file/photo") ||
                        emp.user_photo.startsWith("file/profile_picture")
                    ) {
                        photoUrl = appUrl + "/" + emp.user_photo;
                    } else {
                        photoUrl =
                            appUrl + "/file/profile_picture/" + emp.user_photo;
                    }
                } else {
                    photoUrl =
                        appUrl + "/asset/img/profile_picture/default.png";
                }

                const badge = document.createElement("span");
                badge.className =
                    "badge bg-primary d-inline-flex align-items-center me-2 mb-2";

                const img = document.createElement("img");
                img.src = photoUrl;
                img.alt = emp.name;
                img.className = "rounded-circle me-2";
                img.style.width = "24px";
                img.style.height = "24px";
                img.style.objectFit = "cover";

                const nameSpan = document.createElement("span");
                nameSpan.textContent = emp.name;

                const removeBtn = document.createElement("button");
                removeBtn.type = "button";
                removeBtn.className = "btn-close btn-close-white btn-sm ms-2";
                removeBtn.setAttribute("aria-label", "Remove");
                removeBtn.addEventListener("click", () => {
                    selectedEmployees = selectedEmployees.filter(
                        (e) => e.id !== emp.id
                    );
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
            hiddenInput.value = JSON.stringify(
                selectedEmployees.map((e) => e.id)
            );
        }

        function filterEmployees(value) {
            const val = value.trim().toLowerCase();
            if (val === "") {
                filteredEmployees = employees;
            } else {
                filteredEmployees = employees.filter((emp) =>
                    emp.name.toLowerCase().includes(val)
                );
            }
            renderDropdown();
        }

        input.addEventListener("input", function () {
            filterEmployees(this.value);
        });

        input.addEventListener("focus", function () {
            filterEmployees(this.value);
        });

        document.addEventListener("click", function (e) {
            if (!input.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = "none";
            }
        });

        fetchEmployees();

        window.clearSelectedExecutorsEdit = function () {
            selectedEmployees = [];
            renderSelected();
            updateHiddenInput();
            dropdown.style.display = "none";
            input.value = "";
        };

        window.setSelectedExecutorsEdit = function (executors) {
            selectedEmployees = executors.map((ex) => {
                let photoUrl = "";
                let userPhoto = ex.user_photo;
                if (userPhoto) {
                    if (userPhoto.startsWith("http")) {
                        photoUrl = userPhoto;
                    } else if (
                        userPhoto.startsWith("/file/photo") ||
                        userPhoto.startsWith("/file/profile_picture")
                    ) {
                        photoUrl = appUrl + userPhoto;
                    } else if (
                        userPhoto.startsWith("file/photo") ||
                        userPhoto.startsWith("file/profile_picture")
                    ) {
                        photoUrl = appUrl + "/" + userPhoto;
                    } else {
                        photoUrl =
                            appUrl + "/file/profile_picture/" + userPhoto;
                    }
                } else {
                    photoUrl =
                        appUrl + "/asset/img/profile_picture/default.png";
                }
                return {
                    id: ex.id,
                    name: ex.name,
                    user_photo: photoUrl,
                };
            });
            renderSelected();
            updateHiddenInput();
        };
    }

    // Function to create task card HTML
    function createTaskCard(task) {
        // Combine PIC and executors into one array for uniform rendering
        const allExecutors = [];
        if (task.pic) {
            allExecutors.push(task.pic);
        }
        if (task.executors && task.executors.length > 0) {
            allExecutors.push(...task.executors);
        }
        const executorsHtml = allExecutors
            .map((executor, index) => {
                const overlapClass =
                    index === 0 ? "" : "executor-image-overlap";
                const zIndexStyle = `style="z-index: ${index + 1};"`;
                return `<img src="${executor.image}" alt="${executor.name}" class="pic-executor-image ${overlapClass}" title="${executor.name}" ${zIndexStyle}>`;
            })
            .join("");

        return `
            <div class="custom-card mb-3 rounded-4 position-relative" data-task-id="${
                task.id
            }">
                <div class="dropdown-icon-container">
                    <span class="material-symbols-outlined dropdown-icon" tabindex="0">more_vert</span>
                    <div class="dropdown-menu d-none">
                        <div class="dropdown-item">Detail</div>
                        <div class="dropdown-item">Edit</div>
                        <div class="dropdown-item delete-task">Delete</div>
                    </div>
                </div>
                <div class="d-flex align-items-center mb-2">
                    <img src="${
                        task.project_image
                    }" alt="Project Image" class="project-image me-3">
                    <h5 class="mb-0 task-title">${task.title}</h5>
                </div>
                <p class="task-description">${task.description}</p>
                <hr class="task-separator rounded-4">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <div class="d-flex align-items-center pic-executor-container">
                        ${
                            task.pic
                                ? `<img src="${task.pic.image}" alt="${task.pic.name}" class="pic-executor-image" title="${task.pic.name}">`
                                : ""
                        }
                        ${executorsHtml}
                    </div>
                    <div class="d-flex">
                    <div class="btn-attach-file-wrapper d-flex align-items-center ms-3">
                        <span class="material-symbols-outlined task-icon">mode_comment</span>
                       
                    </div>
                    <div class="btn-attach-file-wrapper d-flex align-items-center ms-3">
                        <span class="material-symbols-outlined task-icon">attach_file</span>
                        ${
                            task.reference_files_count > 0
                                ? `<span class="reference-files-count ms-1" style="color: #555">${task.reference_files_count}</span>`
                                : ""
                        }
                    </div>
                </div>
            </div>
        `;
    }

    // Function to fetch and render tasks
    function fetchAndRenderTasks() {
        $.ajax({
            url: appUrl + "/task/index",
            type: "GET",
            dataType: "json",
            success: function (data) {
                // Clear existing task lists
                document.getElementById("new-request-tasks").innerHTML = "";
                document.getElementById("in-progress-tasks").innerHTML = "";
                document.getElementById("completed-tasks").innerHTML = "";

                // Render tasks in respective sections
                data.new_request.forEach((task) => {
                    document
                        .getElementById("new-request-tasks")
                        .insertAdjacentHTML("beforeend", createTaskCard(task));
                });
                data.in_progress.forEach((task) => {
                    document
                        .getElementById("in-progress-tasks")
                        .insertAdjacentHTML("beforeend", createTaskCard(task));
                });
                data.completed.forEach((task) => {
                    document
                        .getElementById("completed-tasks")
                        .insertAdjacentHTML("beforeend", createTaskCard(task));
                });

                // Add event listeners for dropdown functionality after rendering
                setupTaskDropdownListeners();

                // Add event listener for attach_file icon click to show reference files modal
                addAttachFileIconListeners();
            },
            error: function (xhr, status, error) {
                console.error("Error fetching tasks:", error);
            },
        });
    }

    // Function to setup dropdown event listeners for task cards
    function setupTaskDropdownListeners() {
        // Add event listeners for dropdown toggle
        document.querySelectorAll(".dropdown-icon").forEach((icon) => {
            icon.addEventListener("click", function (e) {
                e.stopPropagation();
                const dropdownMenu = this.nextElementSibling;
                const isVisible = !dropdownMenu.classList.contains("d-none");
                // Close all dropdowns
                document.querySelectorAll(".dropdown-menu").forEach((menu) => {
                    menu.classList.add("d-none");
                });
                // Toggle current dropdown
                if (!isVisible) {
                    dropdownMenu.classList.remove("d-none");
                }
            });
        });

        // Close dropdown when clicking outside
        document.addEventListener("click", function () {
            document.querySelectorAll(".dropdown-menu").forEach((menu) => {
                menu.classList.add("d-none");
            });
        });

        // Event listener for dropdown item clicks
        document.addEventListener("click", function (e) {
            if (e.target && e.target.classList.contains("dropdown-item")) {
                // Check if this is a task card dropdown item (not executor dropdown)
                const taskCard = e.target.closest(".custom-card");
                const executorDropdown = e.target.closest(
                    "#executor_dropdown, #edit_executor_dropdown"
                );

                // If this is an executor dropdown item, ignore it
                if (executorDropdown) {
                    return;
                }

                // If this is not from a task card, ignore it
                if (!taskCard) {
                    return;
                }

                const text = e.target.textContent.trim();
                const taskId = taskCard.getAttribute("data-task-id");

                if (!taskId) {
                    alert("Task ID not found.");
                    return;
                }

                switch (text) {
                    case "Detail":
                        handleTaskDetail(taskId);
                        break;
                    case "Edit":
                        handleTaskEdit(taskId);
                        break;
                    case "Delete":
                        handleTaskDelete(taskId, taskCard);
                        break;
                }
            }
        });
    }

    // Function to add event listeners for attach_file icon click
    function addAttachFileIconListeners() {
        // Use event delegation on the container to handle dynamically added cards
        const container = document.getElementById("task-cards-container");
        if (!container) return;

        container.addEventListener("click", function (event) {
            const target = event.target;
            if (
                target &&
                target.classList.contains("task-icon") &&
                target.textContent.trim() === "attach_file"
            ) {
                // Find the closest task card element
                const taskCard = target.closest(".custom-card");
                if (!taskCard) return;

                const taskId = taskCard.getAttribute("data-task-id");
                if (!taskId) {
                    alert("Task ID not found.");
                    return;
                }

                // Fetch task details to get reference_files
                $.ajax({
                    url: appUrl + "/task/" + taskId,
                    type: "GET",
                    dataType: "json",
                    success: function (data) {
                        const referenceFiles = data.reference_files;
                        const referenceFilesList =
                            document.getElementById("referenceFilesList");
                        if (!referenceFilesList) return;

                        // Clear previous content
                        referenceFilesList.innerHTML = "";

                        if (
                            referenceFiles &&
                            Array.isArray(referenceFiles) &&
                            referenceFiles.length > 0
                        ) {
                            referenceFiles.forEach((fileName) => {
                                const link = document.createElement("a");
                                link.href =
                                    appUrl +
                                    "/file/task_reference_files/" +
                                    fileName;
                                link.target = "_blank";
                                link.className =
                                    "d-block text-decoration-none mb-1";
                                link.innerHTML = `<span class="material-symbols-outlined me-1" style="font-size: 16px; vertical-align: middle;">description</span> ${fileName}`;
                                referenceFilesList.appendChild(link);
                            });
                        } else {
                            referenceFilesList.textContent =
                                "No reference files available.";
                        }

                        // Show the modal
                        const referenceFilesModal = new bootstrap.Modal(
                            document.getElementById("referenceFilesModal")
                        );
                        referenceFilesModal.show();
                    },
                    error: function () {
                        alert("Failed to load reference files.");
                    },
                });
            }
        });
    }

    // Function to handle task detail view
    function handleTaskDetail(taskId) {
        $.ajax({
            url: appUrl + "/task/" + taskId,
            type: "GET",
            dataType: "json",
            success: function (data) {
                // Populate task detail modal
                $("#taskDetailImage").attr(
                    "src",
                    data.image
                        ? appUrl + "/file/task/" + data.image
                        : appUrl + "/asset/img/background/add-image.png"
                );
                $("#taskDetailTitle").text(data.title || "");
                $("#taskDetailDescription").text(data.description || "");

                // Department and Division from project
                $("#taskDetailDepartment").text(
                    data.project && data.project.department
                        ? data.project.department
                        : ""
                );
                $("#taskDetailDivision").text(
                    data.project && data.project.division
                        ? data.project.division
                        : ""
                );
                $("#taskDetailProject").text(
                    data.project ? data.project.title : ""
                );

                // PIC (Person in Charge)
                $("#taskDetailPIC").text(data.pic ? data.pic.name : "None");

                $("#taskDetailPoint").text(data.point || "");
                $("#taskDetailPriority").text(data.priority || "");

                if (data.reference_url) {
                    $("#taskDetailReferenceUrl")
                        .attr("href", data.reference_url)
                        .text(data.reference_url)
                        .show();
                } else {
                    $("#taskDetailReferenceUrl").hide();
                }

                // Reference Files
                if (
                    data.reference_files &&
                    Array.isArray(data.reference_files) &&
                    data.reference_files.length > 0
                ) {
                    const referenceFilesHtml = data.reference_files
                        .map((fileName) => {
                            return `<a href="${appUrl}/file/task_reference_files/${fileName}" target="_blank" class="d-block text-decoration-none mb-1">
                            <span class="material-symbols-outlined me-1" style="font-size: 16px; vertical-align: middle;">description</span>
                            ${fileName}
                        </a>`;
                        })
                        .join("");
                    $("#taskDetailReferenceFiles").html(referenceFilesHtml);
                } else {
                    $("#taskDetailReferenceFiles").text("No files");
                }

                // Format dates
                function formatDate(dateStr) {
                    if (!dateStr) return "";
                    const options = {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                    };
                    const dateObj = new Date(dateStr);
                    return dateObj.toLocaleDateString(undefined, options);
                }

                $("#taskDetailStartDate").text(formatDate(data.start_date));
                $("#taskDetailDueDate").text(formatDate(data.due_date));

                // Executors list
                if (data.executors && data.executors.length > 0) {
                    const executorNames = data.executors
                        .map((ex) => ex.name)
                        .join(", ");
                    $("#taskDetailExecutors").text(executorNames);
                } else {
                    $("#taskDetailExecutors").text("None");
                }

                // Show modal
                const taskDetailModal = new bootstrap.Modal(
                    document.getElementById("taskDetailModal")
                );
                taskDetailModal.show();
            },
            error: function () {
                alert("Failed to load task details.");
            },
        });
    }

    // Function to handle task edit
    function handleTaskEdit(taskId) {
        $.ajax({
            url: appUrl + "/task/" + taskId + "/edit",
            type: "GET",
            dataType: "json",
            success: function (data) {
                // Load projects first, then populate form
                loadProjectsForEdit(function () {
                    // Populate edit modal form fields
                    $("#edit_task_id").val(data.id);
                    $("#edit_task_title").val(data.title);
                    $("#edit_task_description").val(data.description);
                    $("#edit_task_project_id").val(data.project_id);
                    $("#edit_task_point").val(data.point);
                    $("#edit_task_priority").val(data.priority);
                    $("#edit_task_reference_url").val(data.reference_url);
                    $("#edit_task_start_date").val(data.start_date);
                    $("#edit_task_due_date").val(data.due_date);

                    // Reset image preview
                    if (data.image) {
                        $("#editTaskImageLabel").css(
                            "background-image",
                            "url(" + appUrl + "/file/task/" + data.image + ")"
                        );
                        $("#editTaskImageLabel").addClass("has-image");
                        $("#editTaskImageLabel").css(
                            "background-size",
                            "cover"
                        );
                        $("#editTaskImageLabel").css("opacity", "1");
                        $("#editTaskImageClearBtn").removeClass("d-none");
                    } else {
                        $("#editTaskImageLabel").css(
                            "background-image",
                            "url('" +
                                appUrl +
                                "/asset/img/background/add-image.png')"
                        );
                        $("#editTaskImageLabel").removeClass("has-image");
                        $("#editTaskImageLabel").css("opacity", "0.5");
                        $("#editTaskImageClearBtn").addClass("d-none");
                    }

                    // Clear file input for reference files
                    $("#edit_task_reference_files").val("");

                    // Display existing reference files
                    if (data.reference_files) {
                        window.displayExistingReferenceFiles(
                            data.reference_files
                        );
                    }

                    // Set executors
                    if (data.executors) {
                        var executors = data.executors.map(function (ex) {
                            return {
                                id: ex.id,
                                name: ex.name,
                                user_photo: ex.user_photo || null,
                            };
                        });
                        window.setSelectedExecutorsEdit &&
                            window.setSelectedExecutorsEdit(executors);
                    }

                    // Show edit modal
                    const editTaskModal = new bootstrap.Modal(
                        document.getElementById("editTaskModal")
                    );
                    editTaskModal.show();
                });
            },
            error: function () {
                alert("Failed to load task data for editing.");
            },
        });
    }

    // Function to load projects for edit modal
    function loadProjectsForEdit(callback) {
        const editProjectSelect = document.getElementById(
            "edit_task_project_id"
        );
        if (!editProjectSelect) return;

        fetch(appUrl + "/project/index")
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Failed to load projects");
                }
                return response.json();
            })
            .then((data) => {
                if (!data.data) return;
                let options =
                    '<option value="" disabled selected>Select Project</option>';
                data.data.forEach((project) => {
                    options += `<option value="${project.id}">${project.title}</option>`;
                });
                editProjectSelect.innerHTML = options;
                if (typeof callback === "function") callback();
            })
            .catch((error) => {
                console.error("Error loading projects for edit:", error);
                if (typeof callback === "function") callback();
            });
    }

    // Function to handle task delete
    function handleTaskDelete(taskId, taskCard) {
        // Open delete confirmation modal
        const deleteModalEl = document.getElementById("deleteTaskModal");
        const deleteModal = new bootstrap.Modal(deleteModalEl);

        // Store taskId on modal for use in delete
        deleteModalEl.dataset.taskId = taskId;

        deleteModal.show();

        // Delete button click handler
        const confirmDeleteBtn = document.getElementById(
            "confirmDeleteTaskBtn"
        );
        confirmDeleteBtn.onclick = function () {
            $.ajax({
                url: appUrl + "/task/" + taskId,
                type: "DELETE",
                headers: {
                    "X-CSRF-TOKEN": document
                        .querySelector('meta[name="csrf-token"]')
                        .getAttribute("content"),
                },
                success: function (response) {
                    // Remove card from UI
                    taskCard.remove();

                    // Hide modal
                    deleteModal.hide();

                    // Show success alert
                    let alertContainer = document.createElement("div");
                    alertContainer.className =
                        "alert alert-success d-flex align-items-center task-delete-alert";
                    alertContainer.setAttribute("role", "alert");
                    alertContainer.style.opacity = "1";

                    alertContainer.innerHTML = `
                        <svg class="bi flex-shrink-0 me-2" width="24" height="24" role="img" aria-label="Success:">
                            <use xlink:href="#check-circle-fill"/>
                        </svg>
                        <div>
                            ${response.message || "Task deleted successfully"}
                        </div>
                    `;

                    document.body.appendChild(alertContainer);

                    // After 1.5 seconds, fade out alert
                    setTimeout(() => {
                        alertContainer.style.opacity = "0";
                        setTimeout(() => {
                            alertContainer.remove();
                        }, 500);
                    }, 1500);
                },
                error: function () {
                    alert("Failed to delete task.");
                },
            });
        };
    }

    // Array untuk menyimpan file yang sudah dipilih
    let selectedFiles = [];

    // Function untuk menampilkan file yang sudah dipilih
    function displaySelectedFiles() {
        const preview = document.getElementById("reference_files_preview");
        preview.innerHTML = "";

        if (selectedFiles.length > 0) {
            const fileList = document.createElement("div");
            fileList.className = "selected-files-list mt-2";

            selectedFiles.forEach((file, index) => {
                const fileItem = document.createElement("div");
                fileItem.className =
                    "selected-file-item d-flex align-items-center justify-content-between mb-2 p-2 bg-light border rounded";

                const fileInfo = document.createElement("div");
                fileInfo.className = "d-flex align-items-center flex-grow-1";

                const fileIcon = document.createElement("span");
                fileIcon.className = "material-symbols-outlined me-2";
                fileIcon.textContent = "description";

                const fileName = document.createElement("span");
                fileName.textContent = file.name;
                fileName.className = "file-name";

                const fileSize = document.createElement("small");
                fileSize.textContent = ` (${(file.size / 1024 / 1024).toFixed(
                    2
                )} MB)`;
                fileSize.className = "text-muted ms-1";

                const removeBtn = document.createElement("button");
                removeBtn.type = "button";
                removeBtn.className = "btn btn-sm btn-outline-danger";
                removeBtn.innerHTML = "&times;";
                removeBtn.onclick = function () {
                    selectedFiles.splice(index, 1);
                    displaySelectedFiles();
                };

                fileInfo.appendChild(fileIcon);
                fileInfo.appendChild(fileName);
                fileInfo.appendChild(fileSize);

                fileItem.appendChild(fileInfo);
                fileItem.appendChild(removeBtn);
                fileList.appendChild(fileItem);
            });

            preview.appendChild(fileList);
        }
    }

    // Function to setup reference files input for add modal
    function setupReferenceFilesInput() {
        const input = document.getElementById("task_reference_files");
        const preview = document.getElementById("reference_files_preview");

        if (!input || !preview) return;

        input.addEventListener("change", function () {
            const files = Array.from(this.files);
            selectedFiles = [...selectedFiles, ...files];
            displaySelectedFiles();

            // Kosongkan input file untuk memungkinkan upload berikutnya
            this.value = "";
        });
    }

    // Function to setup reference files input for edit modal
    function setupEditReferenceFilesInput() {
        const input = document.getElementById("edit_task_reference_files");
        const preview = document.getElementById("edit_reference_files_preview");
        const existing = document.getElementById("existing_reference_files");

        if (!input || !preview) return;

        // Use a global variable to track selected files for edit modal
        window.editSelectedFiles = [];

        input.addEventListener("change", function () {
            const files = Array.from(this.files);
            // Add debug log to check files selected
            console.log("Files selected in edit modal:", files);
            window.editSelectedFiles = [...window.editSelectedFiles, ...files];
            displayEditSelectedFiles();

            // Clear input for next selection AFTER adding files to array
            // (already done here, but keep for clarity)
            this.value = "";
        });

        window.displayEditSelectedFiles = function () {
            preview.innerHTML = "";

            if (window.editSelectedFiles.length > 0) {
                const fileList = document.createElement("div");
                fileList.className = "selected-files-list mt-2";

                window.editSelectedFiles.forEach((file, index) => {
                    const fileItem = document.createElement("div");
                    fileItem.className =
                        "selected-file-item d-flex align-items-center justify-content-between mb-2 p-2 bg-light border rounded";

                    const fileInfo = document.createElement("div");
                    fileInfo.className =
                        "d-flex align-items-center flex-grow-1";

                    const fileIcon = document.createElement("span");
                    fileIcon.className = "material-symbols-outlined me-2";
                    fileIcon.textContent = "description";

                    const fileName = document.createElement("span");
                    fileName.textContent = file.name;
                    fileName.className = "file-name";

                    const fileSize = document.createElement("small");
                    fileSize.textContent = ` (${(
                        file.size /
                        1024 /
                        1024
                    ).toFixed(2)} MB)`;
                    fileSize.className = "text-muted ms-1";

                    const removeBtn = document.createElement("button");
                    removeBtn.type = "button";
                    removeBtn.className = "btn btn-sm btn-outline-danger";
                    removeBtn.innerHTML = "&times;";
                    removeBtn.onclick = function () {
                        window.editSelectedFiles.splice(index, 1);
                        window.displayEditSelectedFiles();
                    };

                    fileInfo.appendChild(fileIcon);
                    fileInfo.appendChild(fileName);
                    fileInfo.appendChild(fileSize);

                    fileItem.appendChild(fileInfo);
                    fileItem.appendChild(removeBtn);
                    fileList.appendChild(fileItem);
                });

                preview.appendChild(fileList);
            }
        };

        // Function to display existing files
        window.displayExistingReferenceFiles = function (files) {
            if (!existing || !files || !Array.isArray(files)) return;

            existing.innerHTML = "";

            if (files.length > 0) {
                const title = document.createElement("div");
                title.className = "fw-bold mb-2";
                title.textContent = "Current Files:";
                existing.appendChild(title);

                const fileList = document.createElement("div");
                fileList.className = "existing-files-list";

                files.forEach((fileName) => {
                    const fileItem = document.createElement("div");
                    fileItem.className =
                        "existing-file-item d-flex align-items-center justify-content-between mb-2 p-2 bg-light border rounded";

                    const fileInfo = document.createElement("div");
                    fileInfo.className =
                        "d-flex align-items-center flex-grow-1";

                    const fileIcon = document.createElement("span");
                    fileIcon.className = "material-symbols-outlined me-2";
                    fileIcon.textContent = "description";

                    const fileLink = document.createElement("a");
                    fileLink.href =
                        appUrl + "/file/task_reference_files/" + fileName;
                    fileLink.textContent = fileName;
                    fileLink.className = "text-decoration-none";
                    fileLink.target = "_blank";

                    const removeBtn = document.createElement("button");
                    removeBtn.type = "button";
                    removeBtn.className = "btn btn-sm btn-outline-danger";
                    removeBtn.innerHTML = "&times;";
                    removeBtn.onclick = function () {
                        fileItem.remove();
                        updateExistingFiles();
                    };

                    fileInfo.appendChild(fileIcon);
                    fileInfo.appendChild(fileLink);

                    fileItem.appendChild(fileInfo);
                    fileItem.appendChild(removeBtn);
                    fileList.appendChild(fileItem);
                });

                existing.appendChild(fileList);
            }
            // Initialize or update hidden input with all existing files on display
            let existingFilesInput = document.getElementById(
                "existing_reference_files_input"
            );
            if (!existingFilesInput) {
                existingFilesInput = document.createElement("input");
                existingFilesInput.type = "hidden";
                existingFilesInput.id = "existing_reference_files_input";
                existingFilesInput.name = "existing_reference_files";
                document
                    .getElementById("editTaskForm")
                    .appendChild(existingFilesInput);
            }
            existingFilesInput.value = JSON.stringify(files);
            console.log(
                "Initialized existing_reference_files_input:",
                existingFilesInput.value
            );
        };

        // Function to update existing files array
        function updateExistingFiles() {
            const existingItems = document.querySelectorAll(
                "#existing_reference_files .existing-file-item"
            );
            const existingFiles = [];

            existingItems.forEach((item) => {
                const fileName = item.querySelector("a").textContent;
                existingFiles.push(fileName);
            });

            // Update hidden input
            let existingFilesInput = document.getElementById(
                "existing_reference_files_input"
            );
            if (!existingFilesInput) {
                existingFilesInput = document.createElement("input");
                existingFilesInput.type = "hidden";
                existingFilesInput.id = "existing_reference_files_input";
                existingFilesInput.name = "existing_reference_files";
                document
                    .getElementById("editTaskForm")
                    .appendChild(existingFilesInput);
            }
            existingFilesInput.value = JSON.stringify(existingFiles);
            console.log(
                "Updated existing_reference_files_input:",
                existingFilesInput.value
            );
        }

        // Initialize
        updateExistingFiles();

        // Ensure updateExistingFiles is called when removing existing files
        document
            .getElementById("existing_reference_files")
            ?.addEventListener("click", function (e) {
                if (e.target && e.target.matches("button.btn-outline-danger")) {
                    setTimeout(() => {
                        updateExistingFiles();
                    }, 10);
                }
            });
    }

    // Fetch and render tasks on page load
    fetchAndRenderTasks();
});
