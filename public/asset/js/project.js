var appUrl = $('meta[name="app-url"]').attr("content");

document.addEventListener("DOMContentLoaded", function () {
    const departmentSelect = document.getElementById("department");
    const divisionSelect = document.getElementById("division");
    const partOfProjectSelect = document.getElementById("part_of_project");
    const imageInput = document.getElementById("image");
    const imageLabel = document.getElementById("imageLabel");
    const imageClearBtn = document.getElementById("imageClearBtn");
    const referenceFileInput = document.getElementById("reference_file");
    const addProjectForm = document.getElementById("addProjectForm");

    // Load project card data and generate cards dynamically
    function loadProjectCardData() {
        $.ajax({
            url: appUrl + "/project/card-data",
            type: "GET",
            dataType: "json",
            success: function (data) {
                let container = document.getElementById(
                    "project-cards-container"
                );
                container.innerHTML = ""; // Clear existing cards

                if (data.project_titles && data.project_titles.length > 0) {
                    let rowHtml = '<div class="row">';
                    data.project_titles.forEach((title, index) => {
                        let taskCount = data.task || 0;
                        let inProgressCount = data.in_progress || 0;
                        let completedCount = data.completed || 0;
                        let imageUrl =
                            data.project_images && data.project_images[index]
                                ? appUrl +
                                  "/file/project/" +
                                  data.project_images[index]
                                : "{{ asset('asset/img/background/add-image.png') }}";

                        rowHtml += `
                            <div class="col-md-4 mb-4 position-relative">
                                <a href="#" class="card-link">
                                    <div class="card shadow-sm rounded-4 p-0" style="background-color: rgb(240, 241, 248); border:0; position: relative;">
                                        <div class="dropdown-icon-container">
                                            <span class="material-symbols-outlined dropdown-icon" tabindex="0">more_vert</span>
                                            <div class="dropdown-menu d-none">
                                                <div class="dropdown-item">Detail Project</div>
                                                <div class="dropdown-item">Task</div>
                                                <div class="dropdown-item">Project Feedback</div>
                                                <div class="dropdown-item">Project Assignment</div>
                                                <div class="dropdown-item text-danger">Delete</div>
                                            </div>
                                        </div>
                                        <div class="card-body">
                                            <div class="d-flex">
                                                <div class="me-3">
                                                    <img src="${imageUrl}" alt="Project Image" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px;">
                                                </div>
                                                <div class="flex-grow-1">
                                                    <div class="d-flex align-items-started mb-1">
                                                        <h6 class="mb-0 title-project">${title}</h6>
                                                    </div>
                                                    <div class="d-flex justify-content-start mt-2">
                                                        <div class="d-flex align-items-center me-3">
                                                            <span class="material-symbols-outlined icon-format_list_bulleted">format_list_bulleted</span>
                                                            <span class="icon-number">${taskCount}</span>
                                                        </div>
                                                        <div class="d-flex align-items-center me-3">
                                                            <span class="material-symbols-outlined icon-av-timer">av_timer</span>
                                                            <span class="icon-number">${inProgressCount}</span>
                                                        </div>
                                                        <div class="d-flex align-items-center">
                                                            <span class="material-symbols-outlined icon-checklist">checklist</span>
                                                            <span class="icon-number">${completedCount}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </a>
                               
                            </div>
                        `;

                        if (
                            (index + 1) % 3 === 0 &&
                            index !== data.project_titles.length - 1
                        ) {
                            rowHtml += '</div><div class="row">';
                        }
                    });
                    rowHtml += "</div>";
                    container.innerHTML = rowHtml;

                    // Add event listeners for dropdown toggle
                    document.querySelectorAll('.dropdown-icon').forEach(icon => {
                        icon.addEventListener('click', function (e) {
                            e.stopPropagation();
                            const dropdownMenu = this.nextElementSibling;
                            const isVisible = !dropdownMenu.classList.contains('d-none');
                            // Close all dropdowns
                            document.querySelectorAll('.dropdown-menu').forEach(menu => {
                                menu.classList.add('d-none');
                            });
                            // Toggle current dropdown
                            if (!isVisible) {
                                dropdownMenu.classList.remove('d-none');
                            }
                        });
                    });

                    // Close dropdown when clicking outside
                    document.addEventListener('click', function () {
                        document.querySelectorAll('.dropdown-menu').forEach(menu => {
                            menu.classList.add('d-none');
                        });
                    });
                } else {
                    container.innerHTML = "<p>No projects available.</p>";
                }
            },
            error: function () {
                console.error("Failed to load project card data.");
            },
        });
    }

    // Load departments dynamically
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

    // Load divisions based on selected department
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
            },
            error: function () {
                alert("Failed to load divisions.");
            },
        });
    }

    // Load projects for "part_of_project" select
    function loadProjects() {
        $.ajax({
            url: appUrl + "/projects",
            type: "GET",
            dataType: "json",
            success: function (data) {
                let options =
                    '<option value="" disabled selected>Select Project</option>';
                (data.data || []).forEach((proj) => {
                    options += `<option value="${proj.id}">${proj.title}</option>`;
                });
                partOfProjectSelect.innerHTML = options;
            },
            error: function () {
                alert("Failed to load projects.");
            },
        });
    }

    // Image preview and clear button logic for image input
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

    setupImageInput(imageInput, imageLabel, imageClearBtn);

    // Show loading overlay
    function showLoading() {
        document.getElementById('addModalLoader').classList.remove('d-none');
    }

    // Hide loading overlay
    function hideLoading() {
        document.getElementById('addModalLoader').classList.add('d-none');
    }

    // Show alert message below modal
    function showAlert(message, type = 'success') {
        let alertContainer = document.querySelector('#addProjectModal').parentElement.querySelector('.alert-container');
        if (!alertContainer) {
            alertContainer = document.createElement('div');
            alertContainer.className = 'alert-container mt-2';
            alertContainer.style.width = '100%';
            document.querySelector('#addProjectModal').parentElement.appendChild(alertContainer);
        }
        alertContainer.innerHTML = `<div class="alert alert-${type}" role="alert">${message}</div>`;
        alertContainer.style.display = 'block';
        setTimeout(() => {
            alertContainer.style.display = 'none';
            // Reload the page after alert disappears
            location.reload();
        }, 1500);
    }

    addProjectForm.addEventListener('submit', function (e) {
        e.preventDefault();

        if (!addProjectForm.checkValidity()) {
            e.stopPropagation();
            addProjectForm.classList.add('was-validated');
            return;
        }
        addProjectForm.classList.remove('was-validated');

        // Show loading overlay and disable submit button
        showLoading();
        const submitBtn = addProjectForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;

        const formData = new FormData(addProjectForm);

        $.ajax({
            url: appUrl + "/projects",
            type: "POST",
            data: formData,
            contentType: false,
            processData: false,
            headers: {
                "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
            },
            success: function (response) {
                // Show success alert
                showAlert(response.message || "Project added successfully!", "success");

                // Reset form and preview
                addProjectForm.reset();
                imageLabel.style.backgroundImage = "";
                imageLabel.classList.remove("has-image");
                imageLabel.style.opacity = "0.5";
                imageClearBtn.classList.add("d-none");
                divisionSelect.innerHTML =
                    '<option value="" disabled selected>Select Division</option>';
                loadDepartments();
                loadProjects();

                // Close modal after short delay to show alert
                setTimeout(() => {
                    var addProjectModalEl =
                        document.getElementById("addProjectModal");
                    var addProjectModal =
                        bootstrap.Modal.getInstance(addProjectModalEl);
                    if (addProjectModal) addProjectModal.hide();
                }, 1500);
            },
            error: function (xhr) {
                if (xhr.status === 422) {
                    let errors = xhr.responseJSON.errors;
                    let errorMessages = "";
                    for (let key in errors) {
                        errorMessages += errors[key].join("\n") + "\n";
                    }
                    alert(errorMessages);
                } else {
                    alert("Failed to create project.");
                }
            },
            complete: function () {
                // Hide loading overlay and enable submit button
                hideLoading();
                const submitBtn = addProjectForm.querySelector('button[type="submit"]');
                submitBtn.disabled = false;
            }
        });
    });

    // Load departments and projects on page load
    loadDepartments();
    loadProjects();
    loadProjectCardData();

    // Load divisions when department changes
    departmentSelect.addEventListener("change", function () {
        const deptId = this.value;
        if (deptId) {
            loadDivisions(deptId);
        } else {
            divisionSelect.innerHTML =
                '<option value="" disabled selected>Select Division</option>';
        }
    });

    // Clear form and reset image preview when modal is closed
    var addProjectModalEl = document.getElementById("addProjectModal");
    addProjectModalEl.addEventListener("hidden.bs.modal", function () {
        addProjectForm.reset();
        imageLabel.style.backgroundImage =
            "url('" + appUrl + "/asset/img/background/add-image.png')";
        imageLabel.style.backgroundPosition = "center center";
        imageLabel.style.backgroundRepeat = "no-repeat";
        imageLabel.style.backgroundSize = "50%";
        imageLabel.classList.remove("has-image");and
        imageLabel.style.opacity = "0.5";
        imageClearBtn.classList.add("d-none");
        divisionSelect.innerHTML =
            '<option value="" disabled selected>Select Division</option>';
    });
});

