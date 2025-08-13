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

document.addEventListener("click", function (e) {
    if (e.target && e.target.classList.contains("arrow-forward-icon")) {
        const taskId = e.target.getAttribute("data-task-id");
        const currentStatus = e.target.getAttribute("data-task-status");
        
        if (!taskId) {
            alert("Task ID not found.");
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
            return `
            <div class="executor-container" style="position: relative; display: inline-block; margin-right: -8px;">
                <img src="${executor.image}" alt="${executor.name}" class="pic-executor-image ${overlapClass}" data-bs-toggle="tooltip" data-bs-placement="bottom" title="${executor.name}" ${zIndexStyle}>
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
        statusBadge = '<span class="badge bg-danger position-absolute" style="font-size: 10px; font-weight: 500; top: 4.5%; right: 70px;">REJECTED</span>';
    }

    // FIXED: Proper icon logic based on current status
    let iconHtml = '';
    if (task.status !== 'completed') {
        if (task.status === 'in_progress' || task.status === 'in progress' || task.status === 'rejected') {
            // Show check icon for In Progress and Rejected tasks (both can be completed)
            iconHtml = `<span class="material-symbols-outlined arrow-forward-icon" 
                data-bs-toggle="tooltip" 
                data-placement="bottom" 
                data-task-id="${task.id}" 
                data-task-status="${task.status}" 
                title="Set to Complete"
                style="cursor: pointer;">
                check
            </span>`;
        } else if (task.status === 'new_request' || task.status === 'new request') {
            // Show arrow icon for New Request tasks
            iconHtml = `<span class="material-symbols-outlined arrow-forward-icon" 
                data-bs-toggle="tooltip" 
                data-placement="bottom" 
                data-task-id="${task.id}" 
                data-task-status="${task.status}" 
                title="Progress"
                style="cursor: pointer;">
                arrow_forward
            </span>`;
        }
    }

    // Check if description is long enough to need truncation
    const description = task.description || '';
    const needsTruncation = description.length > 123; // Approximate 3 lines
    
    return `
        <div class="custom-card mb-3 rounded-4 position-relative" data-task-id="${task.id}" data-task-status="${task.status}">
            ${statusBadge}
            <div class="dropdown-icon-container">
                <span class="material-symbols-outlined dropdown-icon" tabindex="0">more_vert</span>
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
                <img src="${task.project_image}" alt="Project Image" class="project-image me-3">
                <h5 class="mb-0 task-title">${task.title}</h5>
            </div>
            <div class="task-description-container">
                <p class="task-description ${needsTruncation ? 'truncated' : ''}" data-full-description="${description}">
                    ${description}
                </p>
                ${needsTruncation ? '<span class="task-description-toggle" onclick="toggleDescription(this)">View More</span>' : ''}
            </div>
            <hr class="task-separator rounded-4">
            <div class="d-flex justify-content-between align-items-center mb-2">
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
    function fetchAndRenderTasks() {
        $.ajax({
            url: appUrl + "/task/index",
            type: "GET",
            dataType: "json",
            success: function (response) {
                console.log("DEBUG: Received task data from backend:", response);

                if (!response || response.code !== 200 || !response.data) {
                    console.error("Invalid response data format");
                    return;
                }

                const data = response.data;

                // Clear existing task lists
                document.getElementById("new-request-tasks").innerHTML = "";
                document.getElementById("in-progress-tasks").innerHTML = "";
                document.getElementById("completed-tasks").innerHTML = "";

                // Use empty arrays if any category missing
                const newRequestTasks = Array.isArray(data.new_request) ? data.new_request : [];
                const inProgressTasks = Array.isArray(data.in_progress) ? data.in_progress : [];
                const completedTasks = Array.isArray(data.completed) ? data.completed : [];
                const rejectedTasks = Array.isArray(data.rejected) ? data.rejected : [];

                // Render tasks in respective sections
                newRequestTasks.forEach(task => {
                    document.getElementById("new-request-tasks").insertAdjacentHTML("beforeend", createTaskCard(task));
                });

                inProgressTasks.forEach(task => {
                    document.getElementById("in-progress-tasks").insertAdjacentHTML("beforeend", createTaskCard(task));
                });

                completedTasks.forEach(task => {
                    document.getElementById("completed-tasks").insertAdjacentHTML("beforeend", createTaskCard(task));
                });

                // Render rejected tasks in in-progress section with badge
                rejectedTasks.forEach(task => {
                    document.getElementById("in-progress-tasks").insertAdjacentHTML("beforeend", createTaskCard(task));
                });

                // Setup event listeners after rendering
                setupTaskDropdownListeners();
                addAttachFileIconListeners();

                // Initialize Bootstrap tooltips
                setTimeout(() => {
                    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
                    tooltipTriggerList.map(function (tooltipTriggerEl) {
                        return new bootstrap.Tooltip(tooltipTriggerEl);
                    });
                }, 100);
            },
            error: function (xhr, status, error) {
                console.error("Error fetching tasks:", error);
                const taskContainer = document.getElementById("task-cards-container");
                if (taskContainer) {
                    taskContainer.innerHTML = '<div class="alert alert-danger">Failed to load tasks. Please refresh the page.</div>';
                }
            }
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

        // Open Modal from mode_comment icon click
        document.querySelectorAll(".task-icon.mode_comment").forEach((icon) => {
            icon.addEventListener("click", function () {
                const taskId = this.dataset.taskId;
                handleTaskFeedback(taskId);
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
                alert(errorMessage);
            },
        });
    }

    // Function to show floating alert with SVG icon
    function showFloatingAlert(message, type = "success") {
        const alertDiv = document.createElement("div");
        alertDiv.className = `alert alert-${type} d-flex align-items-center task-status-alert`;
        alertDiv.setAttribute("role", "alert");
        alertDiv.style.opacity = "1";
        alertDiv.style.position = "fixed";
        alertDiv.style.bottom = "20px";
        alertDiv.style.right = "20px";
        alertDiv.style.zIndex = "9999";
        alertDiv.style.minWidth = "300px";
        alertDiv.style.margin = "0";

        let iconId = "";
        if (type === "success") {
            iconId = "check-circle-fill";
        } else if (type === "danger") {
            iconId = "exclamation-triangle-fill";
        } else {
            iconId = "info-fill";
        }

        alertDiv.innerHTML = `
            <svg class="bi flex-shrink-0 me-2" width="24" height="24" role="img" aria-label="${type.charAt(0).toUpperCase() + type.slice(1)}:">
                <use xlink:href="#${iconId}"/>
            </svg>
            <div>
                ${message}
            </div>
        `;

        document.body.appendChild(alertDiv);

        // After 1.5 seconds, fade out alert
        setTimeout(() => {
            alertDiv.style.opacity = "0";
            setTimeout(() => {
                alertDiv.remove();
            }, 500);
        }, 1500);
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

    // Function to submit task feedback form
    function submitTaskFeedbackForm(form, taskId) {
        const submitBtn = form.querySelector("button[type='submit']");
        const originalText = submitBtn.textContent;

        submitBtn.innerHTML =
            '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Submitting...';
        submitBtn.disabled = true;

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
                // Show success message
                const alertDiv = document.createElement("div");
                alertDiv.className =
                    "alert alert-success alert-dismissible fade show";
                alertDiv.innerHTML = `
                    ${response.message || "Feedback submitted successfully!"}
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                `;

                const modalBody = document.getElementById("taskFeedbackList");
                modalBody.prepend(alertDiv);

                // Reset form and reload feedback
                setTimeout(() => {
                    feedbackModal.hide();
                    loadTaskFeedbackData(taskId);
                }, 2000);
            },
            error: function (xhr, status, error) {
                const feedbackModalEl =
                    document.getElementById("taskFeedbackModal");
                const modalBody = feedbackModalEl.querySelector(
                    ".feedback-modal-body"
                );
                const alertDiv = document.createElement("div");
                alertDiv.className =
                    "alert alert-danger alert-dismissible fade show";
                alertDiv.innerHTML = `
                    ${
                        error.message ||
                        "Failed to submit feedback. Please try again."
                    }
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                `;
                modalBody.prepend(alertDiv);
            },
            complete: function () {
                if (submitBtn) {
                    submitBtn.innerHTML = originalBtnText;
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

    // Function to submit feedback form via AJAX
    function submitFeedbackForm(form, taskId) {
        const submitBtn =
            form.querySelector("button[type='submit']") ||
            document.getElementById("addFeedbackButton");
        const originalBtnText = submitBtn ? submitBtn.innerHTML : "";

        if (submitBtn) {
            submitBtn.innerHTML =
                '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Submitting...';
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
                // Mark feedback as submitted
                feedbackSubmitted = true;
                
                // Show success alert
                const feedbackModalEl =
                    document.getElementById("taskFeedbackModal");
                const modalBody = feedbackModalEl.querySelector(
                    ".feedback-modal-body"
                );
                const alertDiv = document.createElement("div");
                alertDiv.className =
                    "alert alert-success alert-dismissible fade show";
                alertDiv.innerHTML = `
                    ${response.message || "Feedback submitted successfully!"}
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                `;
                modalBody.prepend(alertDiv);

                // Update feedback count dynamically on task card
                $.ajax({
                    url: appUrl + "/task-feedbacks/count/" + taskId,
                    type: "GET",
                    dataType: "json",
                    success: function (countResponse) {
                        const count = countResponse.count || 0;
                        const taskCard = document.querySelector(`.custom-card[data-task-id="${taskId}"]`);
                        if (taskCard) {
                            let feedbackCountSpan = taskCard.querySelector(".feedback-comments-count");
                            if (count > 0) {
                                if (feedbackCountSpan) {
                                    feedbackCountSpan.textContent = count;
                                } else {
                                    // Create span if not exists
                                    feedbackCountSpan = document.createElement("span");
                                    feedbackCountSpan.className = "feedback-comments-count ms-1";
                                    feedbackCountSpan.style.color = "#555";
                                    feedbackCountSpan.textContent = count;
                                    const modeCommentIcon = taskCard.querySelector(".task-icon.mode_comment");
                                    if (modeCommentIcon && modeCommentIcon.parentNode) {
                                        modeCommentIcon.parentNode.appendChild(feedbackCountSpan);
                                    }
                                }
                            } else {
                                // Remove span if count is zero
                                if (feedbackCountSpan) {
                                    feedbackCountSpan.remove();
                                }
                            }
                        }
                    },
                    error: function () {
                        console.error("Failed to update feedback count");
                    }
                });

                // Reset form and reload feedback list
                setTimeout(() => {
                    loadTaskFeedbackData(taskId);

                    // Reset Add Feedback button text
                    const addFeedbackButton =
                        document.getElementById("addFeedbackButton");
                    addFeedbackButton.textContent = "Add Feedback";

                    // Re-attach event listener
                    const newButton = addFeedbackButton.cloneNode(true);
                    addFeedbackButton.parentNode.replaceChild(
                        newButton,
                        addFeedbackButton
                    );
                    newButton.addEventListener("click", function () {
                        showAddFeedbackForm(taskId);
                    });
                }, 1500);
            },
            error: function (xhr) {
                const feedbackModalEl =
                    document.getElementById("taskFeedbackModal");
                const modalBody = feedbackModalEl.querySelector(
                    ".feedback-modal-body"
                );
                const alertDiv = document.createElement("div");
                alertDiv.className =
                    "alert alert-danger alert-dismissible fade show";

                let errorMessage =
                    "Failed to submit feedback. Please try again.";
                if (xhr.responseJSON && xhr.responseJSON.errors) {
                    errorMessage = Object.values(xhr.responseJSON.errors)
                        .flat()
                        .join("\n");
                } else if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMessage = xhr.responseJSON.message;
                }

                alertDiv.innerHTML = `
                    ${errorMessage}
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                `;
                modalBody.prepend(alertDiv);
            },
            complete: function () {
                if (submitBtn) {
                    submitBtn.innerHTML = originalBtnText;
                    submitBtn.disabled = false;
                }
            },
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
        success: function (res) {
            if (res.status !== 'success' || !res.data) {
                alert("Failed to load task details.");
                return;
            }

            const data = res.data;

            // Gambar task
            $("#taskDetailImage").attr("src", data.image);

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

        // Fetch task details to display image and title
        $.ajax({
            url: appUrl + "/task/" + taskId,
            type: "GET",
            dataType: "json",
            success: function (data) {
                // Set task image
                const deleteTaskImage = document.getElementById("deleteTaskImage");
                if (deleteTaskImage) {
                    if (data.image) {
                        deleteTaskImage.src = appUrl + "/file/task/" + data.image;
                    } else {
                        deleteTaskImage.src = appUrl + "/asset/img/background/add-image.png";
                    }
                }

                // Set task title
                const deleteTaskTitle = document.getElementById("deleteTaskTitle");
                if (deleteTaskTitle) {
                    deleteTaskTitle.textContent = data.title || "Untitled Task";
                }

                // Show modal after data is loaded
                deleteModal.show();
            },
            error: function () {
                // Fallback if task details can't be loaded
                const deleteTaskImage = document.getElementById("deleteTaskImage");
                if (deleteTaskImage) {
                    deleteTaskImage.src = appUrl + "/asset/img/background/add-image.png";
                }
                const deleteTaskTitle = document.getElementById("deleteTaskTitle");
                if (deleteTaskTitle) {
                    deleteTaskTitle.textContent = "Task #" + taskId;
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
            displayElement.style.display = 'none';
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
            // ✅ Ambil data di dalam "data"
            let tasksData = data.data || {};

            // Clear existing task lists
            document.getElementById("new-request-tasks").innerHTML = "";
            document.getElementById("in-progress-tasks").innerHTML = "";
            document.getElementById("completed-tasks").innerHTML = "";

            // Gabungkan semua task
            let allTasks = [];
            if (tasksData.new_request) allTasks = allTasks.concat(tasksData.new_request);
            if (tasksData.in_progress) allTasks = allTasks.concat(tasksData.in_progress);
            if (tasksData.completed) allTasks = allTasks.concat(tasksData.completed);
            if (tasksData.rejected) allTasks = allTasks.concat(tasksData.rejected);

            // Filter berdasarkan project
            if (filters.project && filters.project !== "") {
                allTasks = allTasks.filter(task => task.project_id == filters.project);
            }

            // Filter berdasarkan status
            if (filters.status && filters.status !== "") {
                allTasks = allTasks.filter(task => {
                    let taskStatus = task.status.toLowerCase().replace(" ", "_");
                    return taskStatus === filters.status;
                });
            }

            // Group ulang berdasarkan status
            const groupedTasks = {
                new_request: [],
                in_progress: [],
                completed: [],
                rejected: []
            };

            allTasks.forEach(task => {
                let normalizedStatus = task.status.toLowerCase().replace(" ", "_");
                if (groupedTasks[normalizedStatus] !== undefined) {
                    groupedTasks[normalizedStatus].push(task);
                } else if (normalizedStatus === "rejected") {
                    groupedTasks.rejected.push(task);
                }
            });

            // Render tasks ke kolom masing-masing
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

            // Event listener tambahan
            setupTaskDropdownListeners();
            addAttachFileIconListeners();

            // Tooltip bootstrap
            setTimeout(() => {
                var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
                tooltipTriggerList.map(function (tooltipTriggerEl) {
                    return new bootstrap.Tooltip(tooltipTriggerEl);
                });
            }, 100);
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
