 document.addEventListener("DOMContentLoaded", function () {
    const appUrl =
        document
            .querySelector('meta[name="app-url"]')
            ?.getAttribute("content") || "";

    // Flags to prevent duplicate global bindings
    let globalDropdownDocListenersBound = false;
    let attachFileIconListenerBound = false;

    // Initialize Bootstrap tooltips within a DOM scope (default document)
    function initBootstrapTooltips(root = document) {
        try {
            const nodes = [].slice.call(root.querySelectorAll('[data-bs-toggle="tooltip"]'));
            nodes.forEach((el) => {
                const existing = bootstrap.Tooltip.getInstance(el);
                if (existing) existing.dispose();
                new bootstrap.Tooltip(el, { container: 'body' });
            });
        } catch (_) { /* noop */ }
    }
    // Expose globally for use outside this block
    window.initBootstrapTooltips = initBootstrapTooltips;

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

                // Show success floating alert instead of modal alert
                showFloatingAlert(data.message || "Task added successfully!", "success");

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
                            // Reload page after adding task
                            window.location.href = appUrl + "/task";
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
                    showFloatingAlert(errorMessage, "danger");
                },
                complete: function () {
                    // Don't hide loader here, let success/error handle it
                    // This prevents loader from disappearing too early
                },
            });
        });
    }


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
                    showFloatingAlert("Failed to load employees.", "warning", 3000);
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
                showFloatingAlert("Task ID is missing.", "warning", 3000);
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

                // Show success floating alert instead of modal alert
                showFloatingAlert(data.message || "Task updated successfully!", "success");

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
                    showFloatingAlert(errorMessage, "danger");
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
                    showFloatingAlert("Failed to load employees.", "warning", 3000);
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

document.addEventListener("click", function (e) {
    if (e.target && e.target.classList.contains("arrow-forward-icon")) {
        const taskId = e.target.getAttribute("data-task-id");
        const currentStatus = e.target.getAttribute("data-task-status");

        if (!taskId) {
            showFloatingAlert("Task ID not found.", "warning", 3000);
            return;
        }

        // Determine next status based on current status
        let nextStatus = '';
        let actionDescription = '';

        if (currentStatus === 'new_request' || currentStatus === 'new request') {
            nextStatus = 'in_progress';
            actionDescription = 'Progress';
        } else if (currentStatus === 'in_progress' || currentStatus === 'in progress') {
            nextStatus = 'completed';
            actionDescription = 'Set to Complete';
        } else if (currentStatus === 'rejected') {
            nextStatus = 'completed';
            actionDescription = 'Set to Complete';
        }

      if (nextStatus) {
    // Cari card task
    const taskCard = document.querySelector(`.custom-card[data-task-id="${taskId}"]`);

    // Langsung update status tanpa modal
    updateTaskStatus(taskId, nextStatus, taskCard);
}
    }
});

function updateTaskStatus(taskId, newStatus, taskCard) {
    $.ajax({
        url: appUrl + "/task/" + taskId + "/status",
        type: "PUT",
        headers: {
            "X-CSRF-TOKEN": document
                .querySelector('meta[name="csrf-token"]')
                .getAttribute("content"),
        },
        data: {
            status: newStatus,
        },
        success: function (response) {
            // Dispose all Bootstrap tooltips inside the taskCard before removing it
            const tooltipTriggerList = [].slice.call(taskCard.querySelectorAll('[data-bs-toggle="tooltip"]'));
            tooltipTriggerList.forEach(function (tooltipTriggerEl) {
                const tooltipInstance = bootstrap.Tooltip.getInstance(tooltipTriggerEl);
                if (tooltipInstance) {
                    tooltipInstance.dispose();
                }
            });

            // Remove the task card from current section immediately
            taskCard.remove();

            // Refresh task cards to show in new section
            fetchAndRenderTasks();

            // Show success message
            showFloatingAlert(response.message || "Task status updated successfully", "success");
        },
        error: function (xhr) {
            let errorMessage = "Failed to update task status.";
            if (xhr.responseJSON && xhr.responseJSON.message) {
                errorMessage = xhr.responseJSON.message;
            }
            if (xhr.responseJSON && xhr.responseJSON.errors) {
                errorMessage = Object.values(xhr.responseJSON.errors).join(", ");
            }
            showFloatingAlert(errorMessage, "danger");
        },
    });
}

    // Function to check if all executors have accepted the task
    function hasAllExecutorsAccepted(task) {
        // Always return true to show task cards regardless of executor acceptance status
        return true;
    }

    // Function to create task card HTML
   function createTaskCard(task) {
    // Combine PIC and executors into one array for uniform rendering without duplicates
    const allExecutors = [];
    if (task.pic) {
        allExecutors.push(task.pic);
    }
    if (task.executors && task.executors.length > 0) {
        task.executors.forEach((executor) => {
            // Avoid duplicate if executor is same as PIC
            if (!allExecutors.some(e => e.id === executor.id)) {
                allExecutors.push(executor);
            }
        });
    }

    // Remove picHtml variable usage, use only executorsHtml for rendering all images overlapped
    const executorsHtml = allExecutors
        .map((executor, index) => {
            const overlapClass = index === 0 ? "" : "executor-image-overlap";
            const zIndexStyle = `style="z-index: ${index + 1};"`;
            const isPic = task.pic && executor && task.pic.id === executor.id;
            const roleLabel = isPic ? 'PIC' : 'Executor';
            const tooltipTitle = `${executor.name} (${roleLabel})`;
            return `
            <div class="executor-container" style="position: relative; display: inline-block; margin-right: -8px;">
                <img src="${executor.image}" alt="${executor.name}" class="pic-executor-image ${overlapClass}" data-bs-toggle="tooltip" data-bs-placement="bottom" title="${tooltipTitle}" ${zIndexStyle}>
            </div>
            `;
        })
        .join("");

    // Determine status-based menu items
    let statusMenuItem = '';

    if (task.status === 'new_request' || task.status === 'new request') {
        statusMenuItem = '<div class="dropdown-item progress-task">Progress</div>';
    } else if (task.status === 'in_progress' || task.status === 'in progress') {
        statusMenuItem = '<div class="dropdown-item complete-task">Set to Complete</div><div class="dropdown-item back-to-request">Back to Request</div>';
    } else if (task.status === 'completed') {
        statusMenuItem = '<div class="dropdown-item reject-task">Reject</div>';
    } else if (task.status === 'rejected') {
        statusMenuItem = '<div class="dropdown-item complete-task">Set to Complete</div>';
    }

    // Determine if delete should be shown (only for new_request and rejected)
    const showDelete = task.status === 'new_request' ||
                      task.status === 'new request' ||
                      task.status === 'rejected';

    // Add status badge for rejected tasks
    let statusBadge = '';
    if (task.status === 'rejected') {
        statusBadge = '<span class="badge bg-danger position-absolute" style="font-size: 10px; font-weight: 500; top: 10%; right: 90px;">REJECTED</span>';
    }

    // FIXED: Proper icon logic based on current status
    let iconHtml = '';

    if (task.status !== 'completed') {
    if (task.status === 'in_progress' || task.status === 'in progress' || task.status === 'rejected') {
            // Show check icon for In Progress and Rejected tasks (both can be completed)
            iconHtml = `<span class="material-symbols-outlined arrow-forward-icon mt-2 mx-3"
                data-bs-toggle="tooltip"
        data-bs-placement="bottom"
                data-task-id="${task.id}"
                data-task-status="${task.status}"
                title="Set to Complete"
                style="cursor: pointer;">
                check
            </span>`;
        } else if (task.status === 'new_request' || task.status === 'new request') {
            // Show arrow icon for New Request tasks
            iconHtml = `<span class="material-symbols-outlined arrow-forward-icon mt-2 mx-3"
                data-bs-toggle="tooltip"
        data-bs-placement="bottom"
                data-task-id="${task.id}"
                data-task-status="${task.status}"
                title="Progress"
                style="cursor: pointer;">
                arrow_right_alt
            </span>`;
        }
    }

    // Check if description is long enough to need truncation
    return `
        <div class="custom-card mb-3 rounded-4 position-relative" data-task-id="${task.id}" data-task-status="${task.status}">
            ${statusBadge}
            <div class="dropdown-icon-container">
                <span class="material-symbols-outlined dropdown-icon mt-2 mx-2" tabindex="0">more_vert</span>
                <div class="dropdown-menu d-none">
                    <div class="dropdown-item">Detail</div>
                    <div class="dropdown-item">Edit</div>
                    <div class="dropdown-item">Feedback</div>
                    ${statusMenuItem}
                    ${showDelete ? '<div class="dropdown-item delete-task">Delete</div>' : ''}
                </div>
            </div>
            ${iconHtml}

            <div class="d-flex align-items-center mb-2 mt-2">
                <img src="${task.project_image}" alt="Project Image" class="project-image me-3" style="width: 34px; height: 34px;">
                <h5 class="mb-0 task-title">${task.title}</h5>
            </div>
            <div class="task-description-container">
                <p class="task-description" data-full-description="${task.description}">
                    ${task.description}
                </p>
            </div>
            <hr class="task-separator rounded-4">
            <div class="d-flex justify-content-between align-items-center">
                <div style="font-size: 10px; font-weight: 400;">
                    <span style="color: #797E91;">Priority: </span>
                    <span style="color: ${task.priority === 'HIGH' ? 'red' : '#4B4F5E'}">
                        ${task.priority}
                    </span>
                </div>
                <div style="font-size: 10px; font-weight: 400;">
                    <span style="color: #797E91;">Deadline: </span>
                    <span style="#color: #4B4F5E">${task.due_date }</span>
                </div>
            </div>
            <div class="d-flex justify-content-between align-items-center mt-3">
                <div class="d-flex align-items-center pic-executor-container">
                    ${executorsHtml}
                </div>
                <div class="d-flex">
                   <div class="btn-attach-file-wrapper d-flex align-items-center ms-3">
                        <span class="material-symbols-outlined task-icon mode_comment"
                            data-task-id="${task.id}">mode_comment</span>
                        ${
                            task.feedback_comments_count > 0
                                ? `<span class="feedback-comments-count ms-1" style="color: #555" >${task.feedback_comments_count}</span>`
                                : ""
                        }
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
        </div>
    `;
}

    // Function to toggle description expansion
    function toggleDescription(element) {
        const container = element.closest('.task-description-container');
        const description = container.querySelector('.task-description');
        const isExpanded = description.classList.contains('expanded');

        if (isExpanded) {
            // Collapse
            description.classList.remove('expanded');
            description.classList.add('truncated');
            element.textContent = 'View More';
        } else {
            // Expand
            description.classList.add('expanded');
            description.classList.remove('truncated');
            element.textContent = 'See Less';
        }
    }
    window.toggleDescription = toggleDescription;

    // Function to fetch and render tasks
    let allTasksCache = null; // simpen semua data task

    function fetchAndRenderTasks() {
        $.ajax({
            url: appUrl + "/task/index",
            type: "GET",
            dataType: "json",
            success: function (response) {
                if (!response || response.code !== 200 || !response.data) {
                    console.error("Invalid response data format");
                    return;
                }

                allTasksCache = response.data; // simpen data asli
                renderTasks(allTasksCache);
            },
            error: function (xhr, status, error) {
                console.error("Error fetching tasks:", error);
            }
        });
    }

    function renderTasks(data, query = "") {
        // Clear section
        document.getElementById("new-request-tasks").innerHTML = "";
        document.getElementById("in-progress-tasks").innerHTML = "";
        document.getElementById("completed-tasks").innerHTML = "";

        // Function filter by query
        const filterTasks = (tasks) => {
            if (!Array.isArray(tasks)) return [];
            if (!query) return tasks;
            return tasks.filter(task =>
                JSON.stringify(task).toLowerCase().includes(query.toLowerCase())
            );
        };

        // Preserve dropdown state
        const currentProject = document.getElementById("filterTaskProject").value;
        const currentStatus = document.getElementById("filterTaskStatus").value;

        // Filter + render
        filterTasks(data.new_request).forEach(task => {
            document.getElementById("new-request-tasks").insertAdjacentHTML("beforeend", createTaskCard(task));
        });

        filterTasks(data.in_progress).forEach(task => {
            document.getElementById("in-progress-tasks").insertAdjacentHTML("beforeend", createTaskCard(task));
        });

        filterTasks(data.completed).forEach(task => {
            document.getElementById("completed-tasks").insertAdjacentHTML("beforeend", createTaskCard(task));
        });

        filterTasks(data.rejected).forEach(task => {
            document.getElementById("in-progress-tasks").insertAdjacentHTML("beforeend", createTaskCard(task));
        });

    // After cards are in DOM, wire listeners and tooltips
    setupTaskDropdownListeners();
    addAttachFileIconListeners();
    initBootstrapTooltips();
    }

    $(document).on("keyup", "#search_filter, #search_filter_mobile", function () {
    const query = this.value.trim();

    if (allTasksCache) {
        renderTasks(allTasksCache, query);

        // refresh mobile biar clone ikut update
        $("#taskStatusSelect").trigger("change");
    }
    });

    // init
    $(document).ready(function () {
        fetchAndRenderTasks();
    });

    // Function to setup dropdown event listeners for task cards
    function setupTaskDropdownListeners() {
        // Add event listeners for dropdown toggle
        document.querySelectorAll(".dropdown-icon").forEach((icon) => {
            if (icon.dataset.bound === '1') return;
            icon.dataset.bound = '1';
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

        // Close dropdown when clicking outside (bind once)
        if (!globalDropdownDocListenersBound) {
            document.addEventListener("click", function () {
                document.querySelectorAll(".dropdown-menu").forEach((menu) => {
                    menu.classList.add("d-none");
                });
            });
            globalDropdownDocListenersBound = true;
        }

        // Open Modal from mode_comment icon click
        document.querySelectorAll(".task-icon.mode_comment").forEach((icon) => {
            if (icon.dataset.bound === '1') return;
            icon.dataset.bound = '1';
            icon.addEventListener("click", function () {
                const taskId = this.dataset.taskId;
                handleTaskFeedback(taskId);
            });
        });

        // Event listener for dropdown item clicks (bind once)
        if (!document._taskDropdownItemHandlerBound) {
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
                        try { showFloatingAlert("Task ID not found.", "warning", 3000); } catch(_) { try { alert("Task ID not found."); } catch(e){} }
                        return;
                    }

                    switch (text) {
                        case "Detail":
                            handleTaskDetail(taskId);
                            break;
                        case "Edit":
                            handleTaskEdit(taskId);
                            break;
                        case "Feedback":
                            handleTaskFeedback(taskId);
                            break;
                        case "mode_comment":
                            handleTaskFeedback(taskId);
                            break;
                        case "Progress":
                            handleTaskProgress(taskId, taskCard);
                            break;
                        case "Set to Complete":
                            handleTaskComplete(taskId, taskCard);
                            break;
                        case "Reject":
                            handleTaskReject(taskId, taskCard);
                            break;
                        case "Back to Request":
                            handleTaskBackToRequest(taskId, taskCard);
                            break;
                        case "Delete":
                            handleTaskDelete(taskId, taskCard);
                            break;
                    }
                }
            });
            document._taskDropdownItemHandlerBound = true;
        }
    }

    // Function to handle task progress (new request -> in progress)
    function handleTaskProgress(taskId, taskCard) {
        showStatusModal(taskId, taskCard, 'in_progress', 'Progress', 'In Progress', 'Task is being worked on');
    }

    // Function to handle task complete (in progress -> completed)
    function handleTaskComplete(taskId, taskCard) {
        showStatusModal(taskId, taskCard, 'completed', 'Set to Complete', 'Completed', 'Task has been finished');
    }

    // Function to handle task reject (completed -> rejected)
    function handleTaskReject(taskId, taskCard) {
        showStatusModal(taskId, taskCard, 'rejected', 'Reject', 'Rejected', 'Task has been rejected');
    }

    // Function to handle task back to request (in progress -> new request)
    function handleTaskBackToRequest(taskId, taskCard) {
        showStatusModal(taskId, taskCard, 'new_request', 'Back to Request', 'New Request', 'Task is back to new request');
    }

   function showStatusModal(taskId, taskCard, newStatus, modalTitle, statusTitle, statusDescription) {
    $.ajax({
        url: appUrl + "/task/" + taskId,
        type: "GET",
        dataType: "json",
        success: function (res) {
            // Ambil dari data.data sesuai struktur Laravel
            const taskData = res.data || {};
            const taskTitle = taskData.title || 'Untitled Task';
            const taskDescription = taskData.description || 'No description available';

            // Potong description kalau terlalu panjang
            const truncatedDescription = taskDescription.length > 20
                ? taskDescription.substring(0, 20) + '...'
                : taskDescription;

            // Tentukan modal ID & confirm button ID
            let modalId, confirmBtnId;
            switch (newStatus) {
                case 'in_progress':
                    modalId = 'progressStatusModal';
                    confirmBtnId = 'confirmProgressStatusBtn';
                    break;
                case 'completed':
                    modalId = 'completeStatusModal';
                    confirmBtnId = 'confirmCompleteStatusBtn';
                    break;
                case 'rejected':
                    modalId = 'rejectStatusModal';
                    confirmBtnId = 'confirmRejectStatusBtn';
                    break;
                default:
                    modalId = 'progressStatusModal';
                    confirmBtnId = 'confirmProgressStatusBtn';
            }

            // Set teks modal
            const statusTitleEl = document.getElementById(modalId.replace('Modal', 'Title'));
            const statusDescriptionEl = document.getElementById(modalId.replace('Modal', 'Description'));

            if (statusTitleEl) statusTitleEl.textContent = taskTitle;
            if (statusDescriptionEl) statusDescriptionEl.textContent = truncatedDescription;

            // Tampilkan modal
            const statusModal = new bootstrap.Modal(document.getElementById(modalId));
            statusModal.show();

            // Tombol konfirmasi
            const confirmBtn = document.getElementById(confirmBtnId);
            confirmBtn.onclick = function () {
                updateTaskStatus(taskId, newStatus, taskCard);
                statusModal.hide();
            };
        },
        error: function () {
            const fallbackTitle = 'Task #' + taskId;
            const fallbackDescription = 'Task description not available';

            const truncatedDescription = fallbackDescription.length > 20
                ? fallbackDescription.substring(0, 20) + '...'
                : fallbackDescription;

            let modalId, confirmBtnId;
            switch (newStatus) {
                case 'in_progress':
                    modalId = 'progressStatusModal';
                    confirmBtnId = 'confirmProgressStatusBtn';
                    break;
                case 'completed':
                    modalId = 'completeStatusModal';
                    confirmBtnId = 'confirmCompleteStatusBtn';
                    break;
                case 'rejected':
                    modalId = 'rejectStatusModal';
                    confirmBtnId = 'confirmRejectStatusBtn';
                    break;
                default:
                    modalId = 'progressStatusModal';
                    confirmBtnId = 'confirmProgressStatusBtn';
            }

            const statusTitleEl = document.getElementById(modalId.replace('Modal', 'Title'));
            const statusDescriptionEl = document.getElementById(modalId.replace('Modal', 'Description'));

            if (statusTitleEl) statusTitleEl.textContent = fallbackTitle;
            if (statusDescriptionEl) statusDescriptionEl.textContent = truncatedDescription;

            const statusModal = new bootstrap.Modal(document.getElementById(modalId));
            statusModal.show();

            const confirmBtn = document.getElementById(confirmBtnId);
            confirmBtn.onclick = function () {
                updateTaskStatus(taskId, newStatus, taskCard);
                statusModal.hide();
            };
        }
    });
}

    // Function to update task status via AJAX
    function updateTaskStatus(taskId, newStatus, taskCard) {
        $.ajax({
            url: appUrl + "/task/" + taskId + "/status",
            type: "PUT",
            headers: {
                "X-CSRF-TOKEN": document
                    .querySelector('meta[name="csrf-token"]')
                    .getAttribute("content"),
            },
            data: {
                status: newStatus,
            },
            success: function (response) {
                // Dispose all Bootstrap tooltips inside the taskCard before removing it
                const tooltipTriggerList = [].slice.call(taskCard.querySelectorAll('[data-bs-toggle="tooltip"]'));
                tooltipTriggerList.forEach(function (tooltipTriggerEl) {
                    const tooltipInstance = bootstrap.Tooltip.getInstance(tooltipTriggerEl);
                    if (tooltipInstance) {
                        tooltipInstance.dispose();
                    }
                });

                // Remove the task card from current section
                taskCard.remove();

                // Refresh task cards to show in new section
                fetchAndRenderTasks();

                // Show success message
                showFloatingAlert(response.message || "Task status updated successfully", "success");
            },
            error: function (xhr) {
                let errorMessage = "Failed to update task status.";
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMessage = xhr.responseJSON.message;
                }
                if (xhr.responseJSON && xhr.responseJSON.errors) {
                    errorMessage = Object.values(xhr.responseJSON.errors).join(", ");
                }
                showFloatingAlert(errorMessage, "danger");
            },
        });
    }

    // New function to update task status directly without confirmation modal
    function updateTaskStatusDirect(taskId, newStatus) {
        // Find the task card element
        const taskCard = document.querySelector(`.custom-card[data-task-id="${taskId}"]`);

        $.ajax({
            url: appUrl + "/task/" + taskId + "/status",
            type: "PUT",
            headers: {
                "X-CSRF-TOKEN": document
                    .querySelector('meta[name="csrf-token"]')
                    .getAttribute("content"),
            },
            data: {
                status: newStatus,
            },
            success: function (response) {
                // Dispose all Bootstrap tooltips inside the taskCard before removing it
                if (taskCard) {
                    const tooltipTriggerList = [].slice.call(taskCard.querySelectorAll('[data-bs-toggle="tooltip"]'));
                    tooltipTriggerList.forEach(function (tooltipTriggerEl) {
                        const tooltipInstance = bootstrap.Tooltip.getInstance(tooltipTriggerEl);
                        if (tooltipInstance) {
                            tooltipInstance.dispose();
                        }
                    });
                }

                // Refresh task cards to show updated status
                fetchAndRenderTasks();

                // Show success alert immediately
                showFloatingAlert(response.message || "Task status updated successfully", "success");
            },
            error: function (xhr) {
                let errorMessage = "Failed to update task status.";
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMessage = xhr.responseJSON.message;
                }
                if (xhr.responseJSON && xhr.responseJSON.errors) {
                    errorMessage = Object.values(xhr.responseJSON.errors).join(", ");
                }
                showFloatingAlert(errorMessage, "danger", 3000);
            },
        });
    }

    // Function to show alert using Settings/Project style (office.js -> showAlertMsg)
    function showFloatingAlert(message, type = "success", delayMs = 2500) {
        // Normalize to Settings types: 'light' | 'success' | 'warning' | 'error'
        // Use 'light' for success/neutral to match Settings & Project usage
        const mapped = type === 'danger' ? 'error'
                     : type === 'error' ? 'error'
                     : type === 'warning' ? 'warning'
                     : 'light';

        if (typeof window.showAlertMsg === 'function') {
            window.showAlertMsg(String(message || ''), mapped, delayMs);
        }
        // No browser alert fallback to keep UX consistent with Settings
    }

    // Track whether feedback was submitted
    let feedbackSubmitted = false;

    // Add event listener for modal close to handle conditional reload
    document.addEventListener('DOMContentLoaded', function () {
        const feedbackModalEl = document.getElementById("taskFeedbackModal");
        if (feedbackModalEl) {
            feedbackModalEl.addEventListener('hidden.bs.modal', function () {
                if (feedbackSubmitted) {
                    // Reload the page only if feedback was submitted
                    window.location.reload();
                }
                // Reset feedback submission state
                feedbackSubmitted = false;
            });
        }
    });

    // Function to handle task feedback
    function handleTaskFeedback(taskId) {
        // Reset feedback submission state
        feedbackSubmitted = false;

        // Show the feedback modal
        const feedbackModalEl = document.getElementById("taskFeedbackModal");
        const feedbackModal = new bootstrap.Modal(feedbackModalEl);

        // Set task ID on modal
        feedbackModalEl.dataset.taskId = taskId;

        // Load feedback data (kosongan dulu)
        loadTaskFeedbackData(taskId);

        feedbackModal.show();
    }

    // Fungsi untuk memuat data feedback
    function loadTaskFeedbackData(taskId) {
        const modalBody = document.getElementById("taskFeedbackList");
        modalBody.innerHTML =
            '<div class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';

        $.ajax({
            url: appUrl + "/task-feedbacks/" + taskId,
            type: "GET",
            dataType: "json",
            success: function (response) {
                if (response.data && response.data.length > 0) {
                    let feedbackHtml = "";
                    response.data.forEach(function (feedback) {
                        // Format the date with the requested format
                        let formattedDate = "";
                        if (feedback.created_at) {
                            const dateObj = new Date(feedback.created_at);
                            const now = new Date();

                            // Helper function to check if two dates are the same day
                            function isSameDay(d1, d2) {
                                return (
                                    d1.getFullYear() === d2.getFullYear() &&
                                    d1.getMonth() === d2.getMonth() &&
                                    d1.getDate() === d2.getDate()
                                );
                            }

                            // Helper function to check if d1 is yesterday of d2
                            function isYesterday(d1, d2) {
                                const yesterday = new Date(d2);
                                yesterday.setDate(d2.getDate() - 1);
                                return isSameDay(d1, yesterday);
                            }

                            if (isSameDay(dateObj, now)) {
                                // Show time only
                                formattedDate = dateObj.toLocaleTimeString(
                                    undefined,
                                    { hour: "2-digit", minute: "2-digit" }
                                );
                            } else if (isYesterday(dateObj, now)) {
                                formattedDate = "yesterday";
                            } else {
                                formattedDate = dateObj.toLocaleDateString(
                                    undefined,
                                    {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    }
                                );
                            }
                        }

                        feedbackHtml += `
                        <div class="feedback-item mb-3 p-3">
                            <div class="d-flex align-items-center mb-2">
                                <img src="${feedback.employee.photo}" alt="${
                            feedback.employee.name
                        }"
                                     class="rounded-circle me-2" style="width: 32px; height: 32px; object-fit: cover;">
                                <div>
                                    <strong>${feedback.employee.name}</strong>
                                    <small class="text-muted d-block">${formattedDate}</small>
                                </div>
                            </div>
                            <p class="mb-2">${feedback.feedback_comment}</p>
                            ${
                                feedback.reference_url ||
                                feedback.reference_file
                                    ? `
                                <div class="feedback-reference-container">
                                    ${
                                        feedback.reference_url
                                            ? `<a href="${feedback.reference_url}" target="_blank" class="feedback-reference-url"><span class="material-symbols-outlined">link</span> Reference Link</a>`
                                            : ""
                                    }
                                    ${
                                        feedback.reference_file
                                            ? `<a href="${feedback.reference_file}" download="" class="feedback-reference-file"><span class="material-symbols-outlined">draft</span> FEEDBACK_PDF</a>`
                                            : ""
                                    }
                                </div>
                            `
                                    : ""
                            }
                            ${
                                feedback.image
                                    ? `<img src="${feedback.image}" class="img-fluid rounded mb-2" style="width: 70px; height: auto; border-radius: 8px; cursor: pointer;">`
                                    : ""
                            }
                        </div>
                    `;
                    });
                    modalBody.innerHTML = feedbackHtml;
                } else {
                    modalBody.innerHTML =
                        '<p class="text-center text-muted">No feedback available for this task.</p>';
                }
            },
            error: function () {
                modalBody.innerHTML =
                    '<p class="text-center text-danger">Failed to load feedback.</p>';
            },
        });
    }

    // Function to show add task feedback form
    function showAddFeedbackForm(taskId) {
        const modalTitle = document.getElementById("taskFeedbackModalLabel");
        const modalBody = document.getElementById("taskFeedbackList");
        const addFeedbackButton = document.getElementById("addFeedbackButton");

        modalTitle.textContent = "Add Feedback";
        modalBody.innerHTML = "";

        const form = document.createElement("form");
        form.id = "addFeedbackForm";
        form.enctype = "multipart/form-data";

        const taskIdInput = document.createElement("input");
        taskIdInput.type = "hidden";
        taskIdInput.name = "task_id";
        taskIdInput.value = taskId;

        const employeeIdInput = document.createElement("input");
        employeeIdInput.type = "hidden";
        employeeIdInput.name = "employee_id";
        employeeIdInput.value =
            document
                .getElementById("taskFeedbackModal")
                .getAttribute("data-employee-id") || "";

        form.appendChild(taskIdInput);
        form.appendChild(employeeIdInput);

        // Comment field
        const commentDiv = document.createElement("div");
        commentDiv.className = "mb-3";

        const commentLabel = document.createElement("label");
        commentLabel.htmlFor = "feedback_comment";
        commentLabel.className = "form-label label-custom";
        commentLabel.textContent = "Comment";
        commentDiv.appendChild(commentLabel);

        const commentTextarea = document.createElement("textarea");
        commentTextarea.className = "form-control input-text";
        commentTextarea.id = "feedback_comment";
        commentTextarea.name = "feedback_comment";
        commentTextarea.rows = 3;
        commentTextarea.required = true;
        commentDiv.appendChild(commentTextarea);

        form.appendChild(commentDiv);

        // Image upload
        const imageDiv = document.createElement("div");
        imageDiv.className = "mb-3";

        const imageLabelTitle = document.createElement("div");
        imageLabelTitle.className = "title-label-image";
        imageLabelTitle.textContent = "Upload Image";
        imageDiv.appendChild(imageLabelTitle);

        const imageLabel = document.createElement("label");
        imageLabel.className = "custom-image-upload position-relative";
        imageLabel.style.backgroundPosition = "center center";
        imageLabel.style.backgroundRepeat = "no-repeat";
        imageLabel.style.backgroundSize = "50%";
        imageLabel.style.backgroundImage =
            "url('" + appUrl + "/asset/img/background/add-image.png')";
        imageLabel.htmlFor = "feedback_image";

        const imageInput = document.createElement("input");
        imageInput.type = "file";
        imageInput.className = "input-image";
        imageInput.id = "feedback_image";
        imageInput.name = "feedback_image";
        imageInput.accept = "image/*";
        imageInput.hidden = true;

        const imageClearBtn = document.createElement("span");
        imageClearBtn.className = "image-clear-btn d-none";
        imageClearBtn.id = "feedbackImageClearBtn";
        imageClearBtn.title = "Remove image";
        imageClearBtn.textContent = "×";

        imageLabel.appendChild(imageInput);
        imageLabel.appendChild(imageClearBtn);
        imageDiv.appendChild(imageLabel);

        form.appendChild(imageDiv);

        // Reference URL
        const refUrlDiv = document.createElement("div");
        refUrlDiv.className = "mb-3";

        const refUrlLabel = document.createElement("label");
        refUrlLabel.htmlFor = "reference_url";
        refUrlLabel.className = "form-label label-custom";
        refUrlLabel.textContent = "Reference URL";
        refUrlDiv.appendChild(refUrlLabel);

        const refUrlInput = document.createElement("input");
        refUrlInput.type = "text";
        refUrlInput.className = "form-control input-text";
        refUrlInput.id = "reference_url";
        refUrlInput.name = "reference_url";
        refUrlDiv.appendChild(refUrlInput);

        form.appendChild(refUrlDiv);

        // Reference File
        const refFileDiv = document.createElement("div");
        refFileDiv.className = "mb-3";

        const refFileLabel = document.createElement("label");
        refFileLabel.htmlFor = "reference_file";
        refFileLabel.className = "form-label label-custom";
        refFileLabel.textContent = "Reference File";
        refFileDiv.appendChild(refFileLabel);

        const refFileInput = document.createElement("input");
        refFileInput.type = "file";
        refFileInput.className = "form-control input-text";
        refFileInput.id = "reference_file";
        refFileInput.name = "reference_file";
        refFileInput.accept = ".pdf,.doc,.docx";
        refFileDiv.appendChild(refFileInput);

        form.appendChild(refFileDiv);

        // Buttons
        const buttonDiv = document.createElement("div");
        buttonDiv.className = "d-flex justify-content-between mt-4";

        const cancelBtn = document.createElement("button");
        cancelBtn.type = "button";
        cancelBtn.className = "btn btn-secondary";
        cancelBtn.textContent = "Cancel";
        cancelBtn.addEventListener("click", function () {
            loadTaskFeedbackData(taskId);
            document.getElementById("addFeedbackButton").textContent =
                "Add Feedback";
        });

        form.appendChild(buttonDiv);
        modalBody.appendChild(form);

        // Setup image preview
        setupImageInput(imageInput, imageLabel, imageClearBtn);

        // Form submission handler
        form.addEventListener("submit", function (e) {
            e.preventDefault();
            submitTaskFeedbackForm(this, taskId);
        });

        // Change button text to Submit
        addFeedbackButton.textContent = "Submit";

        // Remove previous click handler
        const newButton = addFeedbackButton.cloneNode(true);
        addFeedbackButton.parentNode.replaceChild(newButton, addFeedbackButton);

        // Add new click handler for submit
        newButton.addEventListener("click", function (e) {
            e.preventDefault();
            const form = document.getElementById("addFeedbackForm");
            if (form) {
                submitTaskFeedbackForm(form, taskId);
            }
        });
    }

    // Function to submit task feedback form (Task page legacy path) – use floating alert and keep modal open
    function submitTaskFeedbackForm(form, taskId) {
        // Helpers to manage feedback count badge
        function getExistingFeedbackCount(taskId) {
            const card = document.querySelector(`.custom-card[data-task-id="${taskId}"]`);
            const span = card ? card.querySelector('.feedback-comments-count') : null;
            const n = span ? parseInt(span.textContent, 10) : NaN;
            return Number.isFinite(n) ? n : 0;
        }
        function setFeedbackCount(taskId, count) {
            const card = document.querySelector(`.custom-card[data-task-id="${taskId}"]`);
            if (!card) return;
            let span = card.querySelector('.feedback-comments-count');
            if (!span) {
                span = document.createElement('span');
                span.className = 'feedback-comments-count ms-1';
                span.style.color = '#555';
                const icon = card.querySelector('.task-icon.mode_comment');
                if (icon && icon.parentNode) {
                    icon.parentNode.appendChild(span);
                } else {
                    return; // no place to put it
                }
            }
            span.textContent = String(count);
        }
        function optimisticIncrementFeedbackCount(taskId) {
            const prev = getExistingFeedbackCount(taskId);
            setFeedbackCount(taskId, Math.max(prev + 1, 1));
        }
        function extractCountFromResponse(resp) {
            if (!resp) return null;
            const candidates = [
                resp.count,
                resp.total,
                resp?.data?.count,
                resp?.data?.total,
            ];
            const val = candidates.find((v) => typeof v === 'number' && !isNaN(v));
            return (typeof val === 'number') ? val : null;
        }
        const submitBtn = form.querySelector("button[type='submit']") || document.getElementById("addFeedbackButton");
        const originalBtnHtml = submitBtn ? submitBtn.innerHTML : "";

        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            submitBtn.disabled = true;
        }

        const formData = new FormData(form);
        formData.append("task_id", taskId);

        $.ajax({
            url: appUrl + "/task-feedbacks",
            type: "POST",
            data: formData,
            contentType: false,
            processData: false,
            headers: {
                "X-CSRF-TOKEN": document
                    .querySelector('meta[name="csrf-token"]')
                    .getAttribute("content"),
            },
            success: function (response) {
                // Floating success alert
                if (typeof showFloatingAlert === 'function') {
                    showFloatingAlert(response.message || "Feedback submitted successfully!", "success");
                }

                // Switch back to list view inside the modal (keep modal open)
                try {
                    const feedbackModalEl = document.getElementById("taskFeedbackModal");
                    const titleEl = feedbackModalEl?.querySelector('.feedback-modal-title');
                    if (titleEl) titleEl.textContent = 'Task Feedback';
                    const addBtnRef = document.getElementById('addFeedbackButton');
                    if (addBtnRef) {
                        addBtnRef.textContent = 'Add Feedback';
                        const freshBtn = addBtnRef.cloneNode(true);
                        addBtnRef.parentNode.replaceChild(freshBtn, addBtnRef);
                        freshBtn.disabled = false;
                        freshBtn.removeAttribute('disabled');
                        freshBtn.addEventListener('click', () => showAddFeedbackForm(taskId));
                    }
                    loadTaskFeedbackData(taskId);
                } catch (e) { /* noop */ }

                // Update feedback count dynamically on the task card
                // 1) Optimistic UI increment
                optimisticIncrementFeedbackCount(taskId);
                // 2) Reconcile with server value (if provided and > 0)
                $.ajax({
                    url: appUrl + "/task-feedbacks/count/" + taskId,
                    type: "GET",
                    dataType: "json",
                    success: function (countResponse) {
                        const serverCount = extractCountFromResponse(countResponse);
                        if (typeof serverCount === 'number' && serverCount > 0) {
                            setFeedbackCount(taskId, serverCount);
                        }
                    }
                });
            },
            error: function (xhr) {
                let errorMessage = "Failed to submit feedback. Please try again.";
                if (xhr.responseJSON && xhr.responseJSON.errors) {
                    errorMessage = Object.values(xhr.responseJSON.errors).flat().join("\n");
                } else if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMessage = xhr.responseJSON.message;
                }
                if (typeof showFloatingAlert === 'function') {
                    showFloatingAlert(errorMessage, "danger");
                } else {
                    alert(errorMessage);
                }
            },
            complete: function () {
                if (submitBtn) {
                    submitBtn.innerHTML = originalBtnHtml;
                    submitBtn.disabled = false;
                }
            },
        });
    }

    // Function to handle task feedback
    function handleTaskFeedback(taskId) {
        // Show the feedback modal
        const feedbackModalEl = document.getElementById("taskFeedbackModal");
        const feedbackModal = new bootstrap.Modal(feedbackModalEl);

        // Set task ID on modal
        feedbackModalEl.dataset.taskId = taskId;

        const modalTitle = feedbackModalEl.querySelector(
            ".feedback-modal-title"
        );
        const modalBody = feedbackModalEl.querySelector(".feedback-modal-body");
        const addFeedbackButton = document.getElementById("addFeedbackButton");

        // Reset modal title and body to show existing feedback list (empty for now)
        modalTitle.textContent = "Task Feedback";
        modalBody.innerHTML = "";

        // Reset Add Feedback button text and remove previous event listeners
        addFeedbackButton.textContent = "Add Feedback";
        const newButton = addFeedbackButton.cloneNode(true);
        addFeedbackButton.parentNode.replaceChild(newButton, addFeedbackButton);

        // Add event listener for Add Feedback button to show add feedback form
        newButton.addEventListener("click", function () {
            showAddFeedbackForm(taskId);
        });

        loadTaskFeedbackData(taskId);

        feedbackModal.show();
    }

    // Function to show add feedback form in the modal
    function showAddFeedbackForm(taskId) {
        const feedbackModalEl = document.getElementById("taskFeedbackModal");
        const modalTitle = feedbackModalEl.querySelector(
            ".feedback-modal-title"
        );
        const modalBody = feedbackModalEl.querySelector(".feedback-modal-body");
        const addFeedbackButton = document.getElementById("addFeedbackButton");

        modalTitle.textContent = "Add Feedback";

        modalBody.innerHTML = `
            <form id="addFeedbackForm" enctype="multipart/form-data">
                <input type="hidden" name="task_id" value="${taskId}">
                <input type="hidden" name="employee_id" value="${
                    feedbackModalEl.dataset.employeeId || ""
                }">

                <div class="mb-3">
                    <label class="form-label">Upload Image</label>
                    <div class="image-upload-container">
                        <label for="feedback_image" class="custom-image-upload position-relative" id="feedbackImageLabel"
                            style="background-position: center center; background-repeat: no-repeat; background-size: 50%; background-image: url('${appUrl}/asset/img/background/add-image.png'); cursor: pointer;">
                            <input type="file" id="feedback_image" name="image" accept="image/*" class="d-none">
                            <span class="image-clear-btn d-none" id="feedbackImageClearBtn" title="Remove image">&times;</span>
                        </label>
                    </div>
                </div>

                <div class="mb-3">
                    <label for="feedback_comment" class="form-label">Feedback Comment</label>
                    <textarea class="form-control" id="feedback_comment" name="feedback_comment" rows="3" required></textarea>
                </div>

                <div class="mb-3">
                    <label for="reference_url" class="form-label">Reference URL (Optional)</label>
                    <input type="url" class="form-control" id="reference_url" name="reference_url" placeholder="https://example.com">
                </div>

                <div class="mb-3">
                    <label for="reference_file" class="form-label">Reference File (Optional)</label>
                    <input type="file" class="form-control" id="reference_file" name="reference_file" accept=".pdf,.doc,.docx" multiple>
                </div>
            </form>
        `;

        // Setup image preview and clear button logic
        const imageInput = modalBody.querySelector("#feedback_image");
        const imageLabel = modalBody.querySelector("#feedbackImageLabel");
        const imageClearBtn = modalBody.querySelector("#feedbackImageClearBtn");

        imageInput.addEventListener("change", function () {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    imageLabel.style.backgroundImage = `url('${e.target.result}')`;
                    imageLabel.classList.add("has-image");
                    imageLabel.style.backgroundSize = "cover";
                    imageLabel.style.opacity = "1";
                    imageClearBtn.classList.remove("d-none");
                };
                reader.readAsDataURL(this.files[0]);
            }
        });

        imageClearBtn.addEventListener("click", function (e) {
            e.preventDefault();
            imageInput.value = "";
            imageLabel.style.backgroundImage =
                "url('" + appUrl + "/asset/img/background/add-image.png')";
            imageLabel.style.backgroundPosition = "center center";
            imageLabel.style.backgroundRepeat = "no-repeat";
            imageLabel.style.backgroundSize = "50%";
            imageLabel.classList.remove("has-image");
            imageLabel.style.opacity = "0.5";
            imageClearBtn.classList.add("d-none");
        });

        // Change Add Feedback button text to Submit
        addFeedbackButton.textContent = "Submit";

        // Remove previous event listeners and add submit handler
        const newButton = addFeedbackButton.cloneNode(true);
        addFeedbackButton.parentNode.replaceChild(newButton, addFeedbackButton);

        newButton.addEventListener("click", function (e) {
            e.preventDefault();
            const form = document.getElementById("addFeedbackForm");
            if (form) {
                submitFeedbackForm(form, taskId);
            }
        });
    }

    // Function to submit feedback form via AJAX (unified spinner + floating alert)
    function submitFeedbackForm(form, taskId) {
        const submitBtn =
            form.querySelector("button[type='submit']") ||
            document.getElementById("addFeedbackButton");
        const originalBtnHtml = submitBtn ? submitBtn.innerHTML : "";

        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            submitBtn.disabled = true;
        }

        const formData = new FormData(form);

        $.ajax({
            url: appUrl + "/task-feedbacks",
            type: "POST",
            data: formData,
            contentType: false,
            processData: false,
            headers: {
                "X-CSRF-TOKEN": document
                    .querySelector('meta[name="csrf-token"]')
                    .getAttribute("content"),
            },
            success: function (response) {
                // mark to reload after modal closes
                feedbackSubmitted = true;
                // floating success alert
                if (typeof showFloatingAlert === 'function') {
                    showFloatingAlert(response.message || "Feedback submitted successfully!", "success");
                }
                // Switch back to list view inside the modal (keep modal open)
                try {
                    const feedbackModalEl = document.getElementById("taskFeedbackModal");
                    const titleEl = feedbackModalEl?.querySelector('.feedback-modal-title');
                    if (titleEl) titleEl.textContent = 'Task Feedback';
                    const addBtnRef = document.getElementById('addFeedbackButton');
                    if (addBtnRef) {
                        addBtnRef.textContent = 'Add Feedback';
                        const freshBtn = addBtnRef.cloneNode(true);
                        addBtnRef.parentNode.replaceChild(freshBtn, addBtnRef);
                        // ensure the new button is enabled and clickable
                        freshBtn.disabled = false;
                        freshBtn.removeAttribute('disabled');
                        freshBtn.addEventListener('click', () => showAddFeedbackForm(taskId));
                    }
                    loadTaskFeedbackData(taskId);
                } catch (e) { /* noop */ }

                // Also try to update feedback count in-place (best-effort)
                // 1) Optimistic UI increment
                (function () {
                    try {
                        const card = document.querySelector(`.custom-card[data-task-id="${taskId}"]`);
                        if (card) {
                            const span = card.querySelector('.feedback-comments-count');
                            const prev = span ? parseInt(span.textContent, 10) || 0 : 0;
                            const next = Math.max(prev + 1, 1);
                            if (span) { span.textContent = String(next); }
                            else {
                                const newSpan = document.createElement('span');
                                newSpan.className = 'feedback-comments-count ms-1';
                                newSpan.style.color = '#555';
                                newSpan.textContent = String(next);
                                const icon = card.querySelector('.task-icon.mode_comment');
                                if (icon && icon.parentNode) icon.parentNode.appendChild(newSpan);
                            }
                        }
                    } catch(_) {}
                })();
                // 2) Reconcile with server value (if provided and > 0)
                $.ajax({
                    url: appUrl + "/task-feedbacks/count/" + taskId,
                    type: "GET",
                    dataType: "json",
                    success: function (countResponse) {
                        const serverCount = (function (resp) {
                            if (!resp) return null;
                            const candidates = [resp.count, resp.total, resp?.data?.count, resp?.data?.total];
                            const val = candidates.find((v) => typeof v === 'number' && !isNaN(v));
                            return (typeof val === 'number') ? val : null;
                        })(countResponse);
                        if (typeof serverCount === 'number' && serverCount > 0) {
                            const taskCard = document.querySelector(`.custom-card[data-task-id="${taskId}"]`);
                            if (!taskCard) return;
                            let span = taskCard.querySelector('.feedback-comments-count');
                            if (!span) {
                                span = document.createElement('span');
                                span.className = 'feedback-comments-count ms-1';
                                span.style.color = '#555';
                                const icon = taskCard.querySelector('.task-icon.mode_comment');
                                if (icon && icon.parentNode) icon.parentNode.appendChild(span);
                            }
                            span.textContent = String(serverCount);
                        }
                    }
                });
            },
            error: function (xhr) {
                let errorMessage = "Failed to submit feedback. Please try again.";
                if (xhr.responseJSON && xhr.responseJSON.errors) {
                    errorMessage = Object.values(xhr.responseJSON.errors).flat().join("\n");
                } else if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMessage = xhr.responseJSON.message;
                }
                if (typeof showFloatingAlert === 'function') {
                    showFloatingAlert(errorMessage, "danger");
                } else {
                    alert(errorMessage);
                }
            },
            complete: function () {
                if (submitBtn) {
                    submitBtn.innerHTML = originalBtnHtml;
                    submitBtn.disabled = false;
                }
            },
        });
    }

    // Function to add event listeners for attach_file icon click
    function addAttachFileIconListeners() {
        if (attachFileIconListenerBound) return;
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
                    showFloatingAlert("Task ID not found.", "warning", 3000);
                    return;
                }

                // Fetch task details to get reference_files
                $.ajax({
                    url: appUrl + "/task/" + taskId,
                    type: "GET",
                    dataType: "json",
                    success: function (res) {
                        // Support both { status, data: {...} } and direct payloads
                        const payload = res && (res.data || res);
                        let referenceFiles = payload && payload.reference_files;

                        // If backend sends a JSON string, parse it
                        if (typeof referenceFiles === 'string') {
                            try {
                                referenceFiles = JSON.parse(referenceFiles);
                            } catch (e) {
                                // fallback: treat as single filename or comma-separated
                                referenceFiles = referenceFiles.includes('[') ? [] : referenceFiles.split(',').map(s => s.trim()).filter(Boolean);
                            }
                        }

                        const referenceFilesList = document.getElementById("referenceFilesList");
                        if (!referenceFilesList) return;
                        referenceFilesList.innerHTML = "";

                        if (Array.isArray(referenceFiles) && referenceFiles.length > 0) {
                            referenceFiles.forEach((fileName) => {
                                if (!fileName) return;
                                const link = document.createElement("a");
                                link.href = appUrl + "/file/task_reference_files/" + fileName;
                                link.target = "_blank";
                                link.className = "d-block text-decoration-none mb-1";
                                link.innerHTML = `<span class="material-symbols-outlined me-1" style="font-size: 16px; vertical-align: middle;">description</span> ${fileName}`;
                                referenceFilesList.appendChild(link);
                            });
                        } else {
                            referenceFilesList.textContent = "No reference files available.";
                        }

                        const modalEl = document.getElementById("referenceFilesModal");
                        if (modalEl) {
                            const referenceFilesModal = new bootstrap.Modal(modalEl);
                            referenceFilesModal.show();
                        }
                    },
                    error: function () {
                        showFloatingAlert("Failed to load reference files.", "danger", 3000);
                    },
                });
            }
        });
    attachFileIconListenerBound = true;
    }

    // Function to handle task detail view
    function handleTaskDetail(taskId) {
        $.ajax({
            url: appUrl + "/task/" + taskId,
            type: "GET",
            dataType: "json",
            success: function (res) {
                if (res.status !== 'success' || !res.data) {
                    try { showFloatingAlert("Failed to load task details.", "danger", 3000); } catch(_) { try { alert("Failed to load task details."); } catch(e){} }
                    return;
                }

                const data = res.data;

                // Gambar task (normalize URL + fallback)
                (function() {
                    const imgEl = document.getElementById('taskDetailImage');
                    if (!imgEl) return;
                    const placeholder = appUrl + '/asset/img/background/add-image.png';
                    let imgUrl = data.image || '';
                    if (!imgUrl) {
                        imgEl.src = placeholder;
                    } else {
                        const isAbsolute = imgUrl.startsWith('http://') || imgUrl.startsWith('https://');
                        const isFileTask = imgUrl.startsWith('/file/task/') || imgUrl.startsWith('file/task/');
                        const isPublicPath = imgUrl.startsWith('/storage/') || imgUrl.startsWith('storage/');
                        if (!isAbsolute && !isFileTask && !isPublicPath) {
                            imgUrl = appUrl + '/file/task/' + imgUrl;
                        } else if (!isAbsolute && (isFileTask || isPublicPath)) {
                            imgUrl = imgUrl.startsWith('/') ? appUrl + imgUrl : appUrl + '/' + imgUrl;
                        }
                        imgEl.onerror = function() { this.onerror = null; this.src = placeholder; };
                        imgEl.src = imgUrl;
                    }
                })();

                // Judul & Deskripsi
                $("#taskDetailTitle").text(data.title || "");
                $("#taskDetailDescription").text(data.description || "");
                // Point & Priority
                $("#taskDetailPoint").text(data.point || 0);
                $("#taskDetailPriority").text(data.priority || "Normal");

                // Department, Division, Project
                $("#taskDetailDepartment").text(data.project?.department || "");
                $("#taskDetailDivision").text(data.project?.division || "");
                $("#taskDetailProject").text(data.project?.title || "");

                // PIC
                $("#taskDetailPIC").text(data.pic?.name || "None");

                // Executors
                if (Array.isArray(data.executors) && data.executors.length > 0) {
                    $("#taskDetailExecutors").text(data.executors.map(ex => ex.name).join(", "));
                } else {
                    $("#taskDetailExecutors").text("None");
                }

                // Reference URL
                if (data.reference_url) {
                    $("#taskDetailReferenceUrl")
                        .attr("href", data.reference_url)
                        .text(data.reference_url)
                        .show();
                } else {
                    $("#taskDetailReferenceUrl").hide();
                }

                // Reference Files
                if (Array.isArray(data.reference_files) && data.reference_files.length > 0) {
                    const referenceFilesHtml = data.reference_files.map((fileName) => {
                        return `<a href="${appUrl}/file/task_reference_files/${fileName}" target="_blank" class="d-block text-decoration-none mb-1">
                            <span class="material-symbols-outlined me-1" style="font-size: 16px; vertical-align: middle;">description</span>
                            ${fileName}
                        </a>`;
                    }).join("");
                    $("#taskDetailReferenceFiles").html(referenceFilesHtml);
                } else {
                    $("#taskDetailReferenceFiles").text("No files");
                }

                // Format tanggal
                const formatDate = (dateStr) => {
                    if (!dateStr) return "";
                    const options = { year: "numeric", month: "long", day: "numeric" };
                    return new Date(dateStr).toLocaleDateString(undefined, options);
                };
                $("#taskDetailStartDate").text(formatDate(data.start_date));
                $("#taskDetailDueDate").text(formatDate(data.due_date));

                // Tampilkan modal
                new bootstrap.Modal(document.getElementById("taskDetailModal")).show();
            },
            error: function () {
                try { showFloatingAlert("Failed to load task details.", "danger", 3000); } catch(_) { try { alert("Failed to load task details."); } catch(e){} }
            },
        });
    }

    // Function to handle task edit (removed old implementation)

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

        // Fetch task details to display image and title
        $.ajax({
            url: appUrl + "/task/" + taskId,
            type: "GET",
            dataType: "json",
         success: function (data) {
    const task = data.data; // ambil objek task di dalam response

    const deleteTaskImage = document.getElementById("deleteTaskImage");
    if (deleteTaskImage) {
        // Build a safe image URL from possible shapes (filename, relative path, absolute URL)
        let imgSrc = appUrl + "/asset/img/background/add-image.png"; // default fallback
        const img = task.image || "";
        if (img) {
            if (typeof img === "string" && (img.startsWith("http://") || img.startsWith("https://"))) {
                imgSrc = img; // absolute URL
            } else if (typeof img === "string" && (img.startsWith("/file/task/") || img.startsWith("file/task/"))) {
                imgSrc = img.startsWith("/") ? (appUrl + img) : (appUrl + "/" + img);
            } else if (typeof img === "string") {
                // assume plain filename stored in DB
                imgSrc = appUrl + "/file/task/" + img;
            }
        }

        deleteTaskImage.src = imgSrc;
        // Fallback if the built URL 404s
        deleteTaskImage.onerror = function () {
            this.onerror = null;
            this.src = appUrl + "/asset/img/background/add-image.png";
        };
    }

    const deleteTaskTitle = document.getElementById("deleteTaskTitle");
    if (deleteTaskTitle) {
        deleteTaskTitle.textContent = task.title || "Untitled Task";
    }

    deleteModal.show();
}
        });

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

                    // Unified success alert
                    try { showFloatingAlert(response.message || "Task deleted successfully", "success", 1500); } catch(_) {}
                },
                error: function () {
                    try { showFloatingAlert("Failed to delete task.", "danger", 3000); } catch(_) { try { alert("Failed to delete task."); } catch(e){} }
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

    // Open and populate Edit Task Modal
    function handleTaskEdit(taskId) {
        const modalEl = document.getElementById("editTaskModal");
        if (!modalEl) {
            if (typeof showFloatingAlert === 'function') showFloatingAlert('Edit modal not found.', 'danger');
            return;
        }
        const form = document.getElementById("editTaskForm");
        form && form.reset();
        const idInput = document.getElementById("edit_task_id");
        if (idInput) idInput.value = taskId;

        const loader = document.getElementById("editTaskModalLoader");
        if (loader) loader.classList.remove("d-none");

        // Open modal immediately to show loader
        const modal = new bootstrap.Modal(modalEl);
        modal.show();

    $.ajax({
            url: appUrl + "/task/" + taskId,
            type: "GET",
            dataType: "json",
            success: function (res) {
                const t = res.data || {};

                // Basic fields
                const titleEl = document.getElementById("edit_task_title");
                const descEl = document.getElementById("edit_task_description");
                if (titleEl) titleEl.value = t.title || "";
                if (descEl) descEl.value = t.description || "";

                // Project select: load options first, then set value
                const projSel = document.getElementById("edit_task_project_id");
                if (projSel && typeof loadProjectsForEdit === 'function') {
                    const projectId = (t.project_id != null) ? t.project_id : (t.project && t.project.id != null ? t.project.id : '');
                    loadProjectsForEdit(function() {
                        projSel.value = projectId != null ? String(projectId) : '';
                    });
                }

                // Point, Priority
                const pointEl = document.getElementById("edit_task_point");
                if (pointEl) pointEl.value = t.point || 1;
                const prioEl = document.getElementById("edit_task_priority");
                if (prioEl) prioEl.value = (t.priority || '').toUpperCase();

                // Reference URL
                const refUrlEl = document.getElementById("edit_task_reference_url");
                if (refUrlEl) refUrlEl.value = t.reference_url || '';

                // Dates
                const startEl = document.getElementById("edit_task_start_date");
                const dueEl = document.getElementById("edit_task_due_date");
                if (startEl) startEl.value = (t.start_date || '').slice(0, 10);
                if (dueEl) dueEl.value = (t.due_date || '').slice(0, 10);

                // Image label preview
                const imgLabel = document.getElementById("editTaskImageLabel");
                const clearBtn = document.getElementById("editTaskImageClearBtn");
                if (imgLabel) {
                    if (t.image) {
                        // Normalize image URL: accept absolute URL or existing /file/task path; else prefix
                        let imgUrl = t.image;
                        if (typeof imgUrl === 'string') {
                            const isAbsolute = imgUrl.startsWith('http://') || imgUrl.startsWith('https://');
                            const isFileTask = imgUrl.startsWith('/file/task/') || imgUrl.startsWith('file/task/');
                            const isPublicPath = imgUrl.startsWith('/storage/') || imgUrl.startsWith('storage/');
                            if (!isAbsolute && !isFileTask && !isPublicPath) {
                                imgUrl = appUrl + '/file/task/' + imgUrl;
                            } else if (!isAbsolute && (isFileTask || isPublicPath)) {
                                // Ensure leading slash and appUrl prefix
                                imgUrl = imgUrl.startsWith('/') ? appUrl + imgUrl : appUrl + '/' + imgUrl;
                            }
                        }
                        imgLabel.style.backgroundImage = `url('${imgUrl}')`;
                        imgLabel.classList.add('has-image');
                        imgLabel.style.backgroundSize = 'cover';
                        imgLabel.style.opacity = '1';
                        clearBtn && clearBtn.classList.remove('d-none');
                    } else {
                        imgLabel.style.backgroundImage = `url('${appUrl}/asset/img/background/add-image.png')`;
                        imgLabel.classList.remove('has-image');
                        imgLabel.style.opacity = '0.5';
                        clearBtn && clearBtn.classList.add('d-none');
                    }
                }

                // Executors
                if (Array.isArray(t.executors) && typeof window.setSelectedExecutorsEdit === 'function') {
                    window.setSelectedExecutorsEdit(t.executors.map(e => ({ id: e.id, name: e.name, user_photo: e.user_photo || e.photo || e.image || '' })));
                }

                // Existing reference files
                let refFiles = t.reference_files;
                if (typeof refFiles === 'string') {
                    try { refFiles = JSON.parse(refFiles); }
                    catch (e) { refFiles = refFiles.split(',').map(s => s.trim()).filter(Boolean); }
                }
                if (typeof window.displayExistingReferenceFiles === 'function') {
                    window.displayExistingReferenceFiles(Array.isArray(refFiles) ? refFiles : []);
                }

                // Fields populated; loader will be hidden in complete
            },
            error: function () {
                showFloatingAlert('Failed to load task data.', 'danger');
            },
            complete: function () {
                if (loader) loader.classList.add('d-none');
            }
        });
    }
    // Fetch and render tasks on page load
    fetchAndRenderTasks();

    // Enhanced Task Filtering with All Project Support
    let currentTaskFilters = {
        project: "",
        status: ""
    };

    const filterTaskProjectSelect = document.getElementById("filterTaskProject");
    const filterTaskStatusSelect = document.getElementById("filterTaskStatus");
    const applyTaskFilterBtn = document.getElementById("applyTaskFilterBtn");
    const openTaskFilterBtn = document.getElementById("openTaskFilterBtn");
    const resetTaskFilterBtn = document.getElementById("resetTaskFilterBtn");

    const filterTaskProjectSelectMobile = document.getElementById("filterTaskProjectMobile");
    const filterTaskStatusSelectMobile = document.getElementById("filterTaskStatusMobile");
    const applyTaskFilterBtnMobile = document.getElementById("applyTaskFilterBtnMobile");
    const openTaskFilterBtnMobile = document.getElementById("openTaskFilterBtnMobile");

    function loadProjectsForFilterMobile() {
        if (!filterTaskProjectSelectMobile) return;
        fetch(appUrl + "/project/index")
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Failed to load projects");
                }
                return response.json();
            })
            .then((data) => {
                if (!data.data) return;
                let options = '<option value="">All Projects</option>';
                data.data.forEach((project) => {
                    options += `<option value="${project.id}">${project.title}</option>`;
                });
                filterTaskProjectSelectMobile.innerHTML = options;
                if (currentTaskFilters.project) {
                    filterTaskProjectSelectMobile.value = currentTaskFilters.project;
                }
                if (currentTaskFilters.status) {
                    filterTaskStatusSelectMobile.value = currentTaskFilters.status;
                }
            })
            .catch((error) => {
                console.error("Error loading projects for filter (mobile):", error);
            });
    }

    if (applyTaskFilterBtnMobile) {
        applyTaskFilterBtnMobile.addEventListener("click", function () {
            currentTaskFilters.project = filterTaskProjectSelectMobile.value;
            currentTaskFilters.status = filterTaskStatusSelectMobile.value;
            fetchAndRenderFilteredTasks(currentTaskFilters);
            document.getElementById("taskFilterDropdownMobile").style.display = "none";
        });
    }

    if (openTaskFilterBtnMobile) {
        openTaskFilterBtnMobile.addEventListener("click", function (e) {
            e.stopPropagation();
            const dropdown = document.getElementById("taskFilterDropdownMobile");
            const isVisible = dropdown.style.display !== "none";
            if (isVisible) {
                dropdown.style.display = "none";
            } else {
                loadProjectsForFilterMobile();
                dropdown.style.display = "block";
                const buttonRect = openTaskFilterBtnMobile.getBoundingClientRect();
                dropdown.style.position = "absolute";
                dropdown.style.top = "100%";
                dropdown.style.right = "0";
                dropdown.style.zIndex = "1000";
            }
        });
    }

    document.addEventListener("click", function (e) {
        const dropdown = document.getElementById("taskFilterDropdownMobile");
        const button = document.getElementById("openTaskFilterBtnMobile");
        if (dropdown && button && !dropdown.contains(e.target) && !button.contains(e.target)) {
            dropdown.style.display = "none";
        }
    });

    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
            const dropdown = document.getElementById("taskFilterDropdownMobile");
            if (dropdown) {
                dropdown.style.display = "none";
            }
        }
    });
    // Function to update project filter display
    function updateProjectFilterDisplay() {
        const displayElement = document.getElementById('projectFilterDisplay');
        const projectNameElement = document.getElementById('currentProjectName');

        if (!displayElement || !projectNameElement) return;

        const selectedProjectId = filterTaskProjectSelect.value;
        const selectedProjectText = filterTaskProjectSelect.options[filterTaskProjectSelect.selectedIndex]?.text || '';

        if (selectedProjectId && selectedProjectId !== '') {
            projectNameElement.textContent = selectedProjectText;
            displayElement.style.display = 'flex';
        } else {
            displayElement.style.display = 'flex';
        }
    }

    // Load projects for filter select
    function loadProjectsForFilter() {
        if (!filterTaskProjectSelect) return;

        fetch(appUrl + "/project/index")
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Failed to load projects");
                }
                return response.json();
            })
            .then((data) => {
                if (!data.data) return;
                let options = '<option value="">All Projects</option>';
                data.data.forEach((project) => {
                    options += `<option value="${project.id}">${project.title}</option>`;
                });
                filterTaskProjectSelect.innerHTML = options;

                // Set current filter values if they exist
                if (currentTaskFilters.project) {
                    filterTaskProjectSelect.value = currentTaskFilters.project;
                }
                if (currentTaskFilters.status) {
                    filterTaskStatusSelect.value = currentTaskFilters.status;
                }
            })
            .catch((error) => {
                console.error("Error loading projects for filter:", error);
            });
    }

    // Apply task filters
    if (applyTaskFilterBtn) {
        applyTaskFilterBtn.addEventListener("click", function() {
            currentTaskFilters.project = filterTaskProjectSelect.value;
            currentTaskFilters.status = filterTaskStatusSelect.value;

            fetchAndRenderFilteredTasks(currentTaskFilters);

            // Update project filter display
            updateProjectFilterDisplay();

            // Hide the dropdown
            document.getElementById("taskFilterDropdown").style.display = "none";
        });
    }

    // Reset filters
    if (resetTaskFilterBtn) {
        resetTaskFilterBtn.addEventListener("click", function() {
            currentTaskFilters = {
                project: "",
                status: ""
            };

            if (filterTaskProjectSelect) filterTaskProjectSelect.value = "";
            if (filterTaskStatusSelect) filterTaskStatusSelect.value = "";

            fetchAndRenderTasks();

            // Update project filter display (hide it)
            updateProjectFilterDisplay();

            // Hide the dropdown
            document.getElementById("taskFilterDropdown").style.display = "none";
        });
    }

    // Toggle filter dropdown
    if (openTaskFilterBtn) {
        openTaskFilterBtn.addEventListener("click", function(e) {
            e.stopPropagation();
            const dropdown = document.getElementById("taskFilterDropdown");
            const isVisible = dropdown.style.display !== "none";

            if (isVisible) {
                dropdown.style.display = "none";
            } else {
                loadProjectsForFilter();
                dropdown.style.display = "block";

                // Position dropdown below button
                const buttonRect = openTaskFilterBtn.getBoundingClientRect();
                dropdown.style.position = "absolute";
                dropdown.style.top = "100%";
                dropdown.style.right = "0";
                dropdown.style.zIndex = "1000";
            }
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener("click", function(e) {
        const dropdown = document.getElementById("taskFilterDropdown");
        const button = document.getElementById("openTaskFilterBtn");

        if (dropdown && button && !dropdown.contains(e.target) && !button.contains(e.target)) {
            dropdown.style.display = "none";
        }
    });

    // Close dropdown on escape key
    document.addEventListener("keydown", function(e) {
        if (e.key === "Escape") {
            const dropdown = document.getElementById("taskFilterDropdown");
            if (dropdown) {
                dropdown.style.display = "none";
            }
        }
    });

    function fetchAndRenderFilteredTasks(filters = {}) {
        $.ajax({
            url: appUrl + "/task/index",
            type: "GET",
            dataType: "json",
            data: filters,
            success: function (data) {
                let tasksData = data.data || {};

                document.getElementById("new-request-tasks").innerHTML = "";
                document.getElementById("in-progress-tasks").innerHTML = "";
                document.getElementById("completed-tasks").innerHTML = "";

                let allTasks = [];
                if (tasksData.new_request) allTasks = allTasks.concat(tasksData.new_request);
                if (tasksData.in_progress) allTasks = allTasks.concat(tasksData.in_progress);
                if (tasksData.completed) allTasks = allTasks.concat(tasksData.completed);
                if (tasksData.rejected) allTasks = allTasks.concat(tasksData.rejected);

                if (filters.project && filters.project !== "") {
                    allTasks = allTasks.filter(task => task.project_id == filters.project);
                }

                if (filters.status && filters.status !== "") {
                    allTasks = allTasks.filter(task => {
                        let taskStatus = task.status.toLowerCase().replace(" ", "_");
                        return taskStatus === filters.status;
                    });
                }

                const groupedTasks = { new_request: [], in_progress: [], completed: [], rejected: [] };
                allTasks.forEach(task => {
                    let normalizedStatus = task.status.toLowerCase().replace(" ", "_");
                    if (groupedTasks[normalizedStatus] !== undefined) {
                        groupedTasks[normalizedStatus].push(task);
                    } else if (normalizedStatus === "rejected") {
                        groupedTasks.rejected.push(task);
                    }
                });

                groupedTasks.new_request.forEach(task => {
                    document.getElementById("new-request-tasks")
                        .insertAdjacentHTML("beforeend", createTaskCard(task));
                });
                groupedTasks.in_progress.forEach(task => {
                    document.getElementById("in-progress-tasks")
                        .insertAdjacentHTML("beforeend", createTaskCard(task));
                });
                groupedTasks.completed.forEach(task => {
                    document.getElementById("completed-tasks")
                        .insertAdjacentHTML("beforeend", createTaskCard(task));
                });

                setupTaskDropdownListeners();
                addAttachFileIconListeners();
                initBootstrapTooltips();

                // ⬇️ Refresh mobile view biar ikutin hasil terbaru
                $("#taskStatusSelect").trigger("change");
            },
            error: function (xhr, status, error) {
                console.error("Error fetching filtered tasks:", error);
            },
        });
    }

    // Reset filters
    function resetTaskFilters() {
        currentTaskFilters = {
            project: "",
            status: ""
        };

        if (filterTaskProjectSelect) filterTaskProjectSelect.value = "";
        if (filterTaskStatusSelect) {
            filterTaskStatusSelect.value = "";
            filterTaskStatusSelect.disabled = false;
        }

        fetchAndRenderTasks();

        // Hide project filter display on reset
        updateProjectFilterDisplay();
    }

    // Add reset filter button functionality
    const resetFilterBtn = document.createElement('button');
    resetFilterBtn.type = 'button';
    resetFilterBtn.className = 'btn btn-submit-reset';
    resetFilterBtn.textContent = 'Reset';
    resetFilterBtn.addEventListener('click', resetTaskFilters);

    if (applyTaskFilterBtn && applyTaskFilterBtn.parentNode) {
        applyTaskFilterBtn.parentNode.insertBefore(resetFilterBtn, applyTaskFilterBtn.nextSibling);
    }
});

$(document).ready(function () {
  const mobileCardHtml = `
  <div class="mobile-task-container p-3 rounded-4 d-md-none">
    <div class="task-mobile-card-header d-flex justify-content-between align-items-center">
      <select id="taskStatusSelect" class="form-select border-0 bg-transparent" style="max-width:140px;">
        <option value="new_request">New</option>
        <option value="in_progress">In Progress</option>
        <option value="completed">Completed</option>
      </select>

      <div class="action-buttons d-flex align-items-center gap-2">
        <div class="search-input-container">
          <span class="material-symbols-outlined search-icon">search</span>
          <input class="form-control custom-form-filter" type="text" name="search_filter_mobile"
            id="search_filter_mobile">
        </div>

        <button class="btn btn-sm toggle-timeline timeline-toggle-btn" data-bs-toggle="modal" data-bs-target="#timelineModal">
          <span class="material-symbols-outlined">calendar_month</span>
        </button>

        <button class="btn btn-sm toggle-filter" type="button" id="openTaskFilterBtnMobile">
          <span class="material-symbols-outlined">filter_list</span>
        </button>

        <div class="dropdown-filter-menu shadow-sm" id="taskFilterDropdownMobile" style="display: none;">
            <div class="dropdown-filter-body">
                <div class="mb-3">
                    <label for="filterTaskProjectMobile" class="form-label">Project</label>
                    <select id="filterTaskProjectMobile" class="form-select">
                        <option value="">All Projects</option>
                    </select>
                </div>
                <div class="mb-3">
                    <label for="filterTaskStatusMobile" class="form-label">Status</label>
                    <select id="filterTaskStatusMobile" class="form-select">
                        <option value="">All Status</option>
                        <option value="new_request">New Request</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
            </div>
            <div class="dropdown-filter-footer">
                <button type="button" class="btn btn-submit-filter" id="applyTaskFilterBtnMobile">Filter</button>
            </div>
        </div>
      </div>
    </div>
    <div id="mobile-task-list"></div>
  </div>
`;

  $("#task-cards-container").before(mobileCardHtml);

  function toggleDropdownFilter() {
    let dropdown = $(".dropdown-filter-container");
    if ($(window).width() <= 768) {
      dropdown.hide();
    } else {
      dropdown.show();
    }
  }
  toggleDropdownFilter();
  $(window).on("resize", toggleDropdownFilter);

  $("#taskStatusSelect").on("change", function () {
    let status = $(this).val();
    let container = $(".mobile-task-container");
    let list = $("#mobile-task-list");

    container.removeClass("task-mobile-new task-mobile-progress task-mobile-completed");
    list.empty();

    if (status === "new_request") {
      container.addClass("task-mobile-new");
      let newClone = $("#new-request-tasks").clone(false, false);
      newClone.removeAttr("id");
      list.append(newClone);
    } else if (status === "in_progress") {
      container.addClass("task-mobile-progress");
      let progressClone = $("#in-progress-tasks").clone(false, false);
      progressClone.removeAttr("id");
      list.append(progressClone);
    } else if (status === "completed") {
      container.addClass("task-mobile-completed");
      let completedClone = $("#completed-tasks").clone(false, false);
      completedClone.removeAttr("id");
      list.append(completedClone);
    }

    if (window.initBootstrapTooltips) {
      window.initBootstrapTooltips(list[0] || document);
    }
  });

  $("#taskStatusSelect").val("new_request").trigger("change");
});

// Toggle filter mobile
$(document).on("click", "#openTaskFilterBtnMobile", function (e) {
  e.stopPropagation();
  const $dropdown = $("#taskFilterDropdownMobile");
  if ($dropdown.css("display") === "none") {
    $dropdown.css("display", "block");
  } else {
    $dropdown.css("display", "none");
  }
});

 let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();

    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

    // Task timeline data cache
    let timelineTasksCache = [];
    const TL_COLORS = ["color1","color2","color3","color4"];
    const appUrlTimeline = document.querySelector('meta[name="app-url"]')?.getAttribute('content') || '';

    function parseDateLoose(s) {
        if (!s) return null;
        const m = String(s).match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
        if (m) return new Date(parseInt(m[1],10), parseInt(m[2],10)-1, parseInt(m[3],10));
        const d = new Date(s);
        return isNaN(d.getTime()) ? null : d;
    }

    function colorForStatus(t, idx) {
        const s = (t.status || '').toLowerCase();
        if (s.includes('completed')) return 'color2';
        if (s.includes('in') && s.includes('progress')) return 'color3';
        if (s.includes('reject') || s.includes('late')) return 'color4';
        return TL_COLORS[idx % TL_COLORS.length];
    }

    async function fetchTimelineTasksOnce() {
        if (timelineTasksCache.length) return;
        try {
            const r = await fetch(appUrlTimeline + '/task/index', { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
            const j = await r.json();
            const buckets = j && j.data ? j.data : {};
            const flat = [];
            Object.keys(buckets).forEach(k => {
                const arr = buckets[k];
                if (Array.isArray(arr)) arr.forEach(t => flat.push(t));
            });
            // Enrich missing dates
            await Promise.all(flat.map(async (t) => {
                if (t.start_date && t.due_date) return;
                try {
                    const rr = await fetch(appUrlTimeline + '/task/' + t.id, { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
                    const dd = await rr.json();
                    const d = dd && (dd.data || dd);
                    if (d) {
                        t.start_date = t.start_date || d.start_date || d.start || d.startDate || null;
                        t.due_date = t.due_date || d.due_date || d.end_date || d.endDate || d.due || null;
                    }
                } catch(_){ }
            }));
            timelineTasksCache = flat.filter(t => t.start_date || t.due_date);
        } catch(_) {
            timelineTasksCache = [];
        }
    }

    function renderTimeline(targetHeaderSelector, targetRowsSelector, month, year) {
        const headerRow = document.querySelector(targetHeaderSelector);
        const rowsContainer = document.querySelector(targetRowsSelector);
        if (!headerRow || !rowsContainer) return;

        headerRow.innerHTML = "";
        rowsContainer.innerHTML = "";

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const headerLabels = Array.from({ length: daysInMonth }, (_, i) => i + 1);

        // Header
        headerLabels.forEach((day) => {
            const th = document.createElement("th");
            th.textContent = day;
            th.classList.add("timeline-cell");                 // << wajib
            if (new Date(year, month, day).getDay() === 0) {
            th.classList.add("sunday");                      // << jadi match .timeline-cell.sunday
            }
            headerRow.appendChild(th);
        });

        // Rows (tasks) – build from cache for the requested month
        const monthRows = (timelineTasksCache || []).map((t, idx) => {
            const name = t.title || t.name || ('Task ' + (t.id || idx+1));
            const color = colorForStatus(t, idx);
            const start = parseDateLoose(t.start_date);
            const due = parseDateLoose(t.due_date) || start || new Date(year, month, 1);
            return { name, start, due, color };
        }).filter(x => x.start || x.due);

        let rendered = 0;
        monthRows.forEach((task) => {
            const tr = document.createElement("tr");

            // Visible month window
            const monthStart = new Date(year, month, 1, 0, 0, 0, 0);
            const monthEnd = new Date(year, month, daysInMonth, 23, 59, 59, 999);

            // Task span (prefer start..due, fallback to single-day when one side missing)
            const s = task.start ? new Date(task.start) : (task.due ? new Date(task.due) : null);
            const e = task.due ? new Date(task.due) : (task.start ? new Date(task.start) : null);
            if (!s || !e) return; // nothing to render

            // If the task is completely outside this month, skip
            if (e < monthStart || s > monthEnd) return;

            // Clamp to month window so bars end exactly at due_date and not beyond
            const clampedStart = new Date(Math.max(s.getTime(), monthStart.getTime()));
            const clampedEnd = new Date(Math.min(e.getTime(), monthEnd.getTime()));

            let startDay = clampedStart.getDate();
            let endDay = clampedEnd.getDate();
            if (endDay < startDay) endDay = startDay; // safety

            // Empty cells before the bar
            for (let i = 1; i < startDay; i++) {
                const td = document.createElement("td");
                td.classList.add("timeline-cell");
                if (new Date(year, month, i).getDay() === 0) td.classList.add("sunday");
                tr.appendChild(td);
            }

            // Bar cell spanning the exact number of days
            const barTd = document.createElement("td");
            barTd.colSpan = endDay - startDay + 1;
            barTd.classList.add("timeline-cell");
            barTd.innerHTML = `<div class="timeline-bar ${task.color}"><span class="circle"></span>${task.name}</div>`;
            tr.appendChild(barTd);

            // Empty cells after the bar
            for (let i = endDay + 1; i <= daysInMonth; i++) {
                const td = document.createElement("td");
                td.classList.add("timeline-cell");
                if (new Date(year, month, i).getDay() === 0) td.classList.add("sunday");
                tr.appendChild(td);
            }

            rowsContainer.appendChild(tr);
            rendered++;
    });

    // Ensure consistent modal/table height by padding with empty rows
    const MIN_ROWS = 6; // baseline number of rows to maintain look and feel
    if (rendered < MIN_ROWS) {
        for (let r = rendered; r < MIN_ROWS; r++) {
            const tr = document.createElement("tr");
            for (let d = 1; d <= daysInMonth; d++) {
                const td = document.createElement("td");
                td.classList.add("timeline-cell");
                if (new Date(year, month, d).getDay() === 0) td.classList.add("sunday");
                tr.appendChild(td);
            }
            rowsContainer.appendChild(tr);
        }
    }

    document.getElementById("timelineModalTitle").textContent = `Timeline ${months[month]} ${year}`;
    }

    // First render on modal show
    const timelineModal = document.getElementById("timelineModal");
    timelineModal.addEventListener("show.bs.modal", async () => {
        await fetchTimelineTasksOnce();
        renderTimeline("#timelineHeaderModal", "#timelineRowsModal", currentMonth, currentYear);
    });

    // Prev / Next bulan
    document.getElementById("prevTimelineModal").addEventListener("click", () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderTimeline("#timelineHeaderModal", "#timelineRowsModal", currentMonth, currentYear);
    });

    document.getElementById("nextTimelineModal").addEventListener("click", () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderTimeline("#timelineHeaderModal", "#timelineRowsModal", currentMonth, currentYear);
    });
