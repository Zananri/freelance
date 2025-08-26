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

    // --- Multi-file preview for Add Project modal (match task behavior) ---
    // Array to store selected files for add project
    let projectSelectedFiles = [];

    function displayProjectSelectedFiles() {
        const preview = document.getElementById("reference_files_preview");
        if (!preview) return;
        preview.innerHTML = "";

        if (projectSelectedFiles.length > 0) {
            const fileList = document.createElement("div");
            fileList.className = "selected-files-list mt-2";

            projectSelectedFiles.forEach((file, index) => {
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
                fileSize.textContent = ` (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
                fileSize.className = "text-muted ms-1";

                const removeBtn = document.createElement("button");
                removeBtn.type = "button";
                removeBtn.className = "btn btn-sm btn-outline-danger";
                removeBtn.innerHTML = "&times;";
                removeBtn.onclick = function () {
                    projectSelectedFiles.splice(index, 1);
                    displayProjectSelectedFiles();
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

    function setupProjectReferenceFilesInput() {
        const input = document.getElementById("reference_file");
        const preview = document.getElementById("reference_files_preview");
        if (!input || !preview) return;

        input.addEventListener("change", function () {
            const files = Array.from(this.files || []);
            projectSelectedFiles = [...projectSelectedFiles, ...files];
            displayProjectSelectedFiles();
            // clear native input so same file can be reselected later
            this.value = "";
        });
    }

    setupProjectReferenceFilesInput();

    // Helper to resolve employee photo URL and return img HTML string
    function resolvePhotoHtml(emp, size = 30, marginLeft = 0, role = '') {
        let userPhoto = emp && (emp.profile_picture || emp.user_photo || emp.user_photo_path || emp.user_photo_url);
        let photoUrl = "";
        if (userPhoto) {
            try {
                // full URL
                if (typeof userPhoto === 'string' && userPhoto.startsWith('http')) {
                    photoUrl = userPhoto;
                }
                // paths already starting with /file or file/ or /storage
                else if (typeof userPhoto === 'string' && (userPhoto.startsWith('/file/') || userPhoto.startsWith('file/') || userPhoto.startsWith('/storage/') || userPhoto.startsWith('storage/'))) {
                    // make absolute via appUrl if it doesn't already contain host
                    if (userPhoto.startsWith('/')) {
                        photoUrl = appUrl + userPhoto;
                    } else {
                        photoUrl = appUrl + '/' + userPhoto;
                    }
                }
                // absolute path starting with /
                else if (typeof userPhoto === 'string' && userPhoto.startsWith('/')) {
                    photoUrl = appUrl + userPhoto;
                }
                // contains a slash (maybe relative path like file/photo/..., keep appending)
                else if (typeof userPhoto === 'string' && userPhoto.indexOf('/') !== -1) {
                    photoUrl = appUrl + '/' + userPhoto;
                }
                // otherwise treat as filename stored in storage and use storage URL
                else {
                    photoUrl = appUrl + '/storage/' + userPhoto;
                }
            } catch (e) {
                photoUrl = appUrl + '/asset/img/profile_picture/default.png';
            }
        } else {
            photoUrl = appUrl + '/asset/img/profile_picture/default.png';
        }

        const name = (emp && (emp.name || emp.username || emp.full_name)) ? (emp.name || emp.username || emp.full_name) : 'Unknown';
        const roleText = role ? ` (${role.replace('_', ' ')})` : '';
        const titleText = `${name}${roleText}`;

    return `<img src="${photoUrl}" alt="${name}" title="${titleText}" data-bs-toggle="tooltip" data-bs-placement="bottom" class="rounded-circle" style="width:${size}px;height:${size}px;object-fit:cover;${marginLeft ? 'margin-left:'+marginLeft+'px;' : ''}">`;
    }

    // Build collaborators HTML: author first, then co_authors, then executors. Shows up to 3 images and +N overflow.
    function renderCollaborators(project) {
        try {
            const maxVisible = 3;
            let coll = [];

            // Author (put first)
            if (project.author) {
                coll.push({ type: 'author', emp: project.author });
            }

            // Co-authors
            if (project.co_authors && Array.isArray(project.co_authors)) {
                project.co_authors.forEach((c) => coll.push({ type: 'co_author', emp: c }));
            }

            // Executors / contributors (try multiple property names)
            if (project.executors && Array.isArray(project.executors)) {
                project.executors.forEach((c) => coll.push({ type: 'executor', emp: c }));
            } else if (project.contributors && Array.isArray(project.contributors)) {
                project.contributors.forEach((c) => coll.push({ type: 'executor', emp: c }));
            }

            if (coll.length === 0) {
                // fallback: show default placeholder
                return resolvePhotoHtml(null, 30, 0) + resolvePhotoHtml(null, 30, -8);
            }

            let html = "";
            const visible = coll.slice(0, maxVisible);
            visible.forEach((c, idx) => {
                const margin = idx === 0 ? 0 : -8;
                html += resolvePhotoHtml(c.emp, 30, margin, c.type);
            });

            const overflow = coll.length - maxVisible;
            if (overflow > 0) {
                const hidden = coll.slice(maxVisible).map(h => {
                    const n = h.emp && (h.emp.name || h.emp.username || h.emp.full_name) ? (h.emp.name || h.emp.username || h.emp.full_name) : 'Unknown';
                    return `${n} (${h.type.replace('_',' ')})`;
                }).join(', ');

                html += `<div class="more-collaborators rounded-circle d-flex justify-content-center align-items-center text-dark fw-bold" title="${hidden}" data-bs-toggle="tooltip" data-bs-placement="bottom" style="width:30px;height:30px;font-size:12px;margin-left:-8px;">+${overflow}</div>`;
            }

            return html;
        } catch (e) {
            console.error('renderCollaborators error', e);
            return resolvePhotoHtml(null, 30, 0);
        }
    }

    // Load project card data and generate cards dynamically
    function loadProjectCardData(filter = null) {
        $.ajax({
            url: appUrl + "/project/index",
            type: "GET",
            dataType: "json",
            data: { filter: filter },
            success: function (data) {
                let container = document.getElementById("all-cards-container");
                container.innerHTML = ""; // Clear existing cards

                // support API returning either array or { data: [...] }
                const projects = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : []);

                // compute chart counts even if zero or empty
                try {
                    updateProjectChartFromData(projects);
                } catch (e) {
                    console.error('updateProjectChartFromData error', e);
                }

                // Build timeline from actual projects and render. If list items lack start/due, fetch details.
                (function () {
                    // Helper to decide if project has valid date fields
                    function hasValidDates(p) {
                        if (!p) return false;
                        const s = p.start_date || p.start || p.startDate || p.startAt;
                        const e = p.due_date || p.due || p.end_date || p.endDate || p.dueAt;
                        return !!(s && e);
                    }

                    const needsFetch = projects.filter((p) => !hasValidDates(p));

                    if (needsFetch.length === 0) {
                        try {
                            buildTimelineFromProjects(projects);
                            renderTimeline("#timelineHeader", "#timelineRows", "week", currentMonth, currentYear, currentWeek);
                            updateModalTimeline();
                        } catch (e) {
                            console.error('timeline build/render error', e);
                        }
                    } else {
                        // Fetch details for projects missing dates (parallel)
                        const fetches = needsFetch.map((p) => {
                            return $.ajax({
                                url: appUrl + "/project/" + p.id,
                                type: "GET",
                                dataType: "json",
                            })
                                .then((resp) => {
                                    const data = resp.data || resp;
                                    // merge date fields back into list item
                                    p.start_date = p.start_date || data.start_date || data.start || data.startDate;
                                    p.due_date = p.due_date || data.due_date || data.due || data.endDate || data.end_date;
                                    return p;
                                })
                                .catch((err) => {
                                    console.warn('failed to fetch project detail for', p.id, err);
                                    return p;
                                });
                        });

                        Promise.all(fetches).then(() => {
                            try {
                                buildTimelineFromProjects(projects);
                                renderTimeline("#timelineHeader", "#timelineRows", "week", currentMonth, currentYear, currentWeek);
                                updateModalTimeline();
                            } catch (e) {
                                console.error('timeline build/render error', e);
                            }
                        });
                    }
                })();

                if (projects && projects.length > 0) {
                    let rowHtml = '<div class="row">';

                    projects.forEach((project) => {
                        let imageUrl = project.image
                            ? appUrl + "/file/project/" + project.image
                            : appUrl + "/asset/img/background/add-image.png";

                        rowHtml += `
                            <div class="col-md-4 mb-3 d-flex align-items-start position-relative" data-project-id="${
                                project.id
                            }">
                                <div class="project-card p-4 w-100" style="background:#F0F1F8; border-radius:20px; display:flex; flex-direction:column; justify-content:space-between;">

                                    <!-- Header -->
                                    <div class="d-flex justify-content-between align-items-start mb-2">
                                        <div class="d-flex align-items-center">
                                            <img src="${imageUrl}" class="rounded-circle me-2" style="width:34px;height:34px;">
                                            <h6 class="mb-0" style="font-size:14px; font-weight:600;">${
                                                project.title
                                            }</h6>
                                        </div>
                                        <div class="dropdown-icon-container">
                                            <button class="btn btn-sm border-0 d-flex align-items-center justify-content-center dropdown-icon"
                                                    style="background:#E8E9F2; border-radius:50%; width:32px; height:32px;">
                                                <span class="material-symbols-outlined" style="font-size:16px; color:#828282;" tabindex="0">more_vert</span>
                                            </button>
                                            <div class="dropdown-menu d-none">
                                                <div class="dropdown-item">Detail</div>
                                                <div class="dropdown-item">Task</div>
                                                <div class="dropdown-item">Feedback</div>
                                                <div class="dropdown-item">Edit</div>
                                                <div class="dropdown-item text-danger delete-project">Delete</div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Description -->
                                    <p class="mb-2 small text-muted" style="font-size:12px; line-height:1.4;">
                                        ${
                                            project.description ||
                                            "No Description"
                                        }
                                    </p>

                                    <hr class="my-2 border-3"style="border-top:1px solid #DEDFE7;">

                                    <!-- Footer -->
                                    <div class="d-flex justify-content-between align-items-center mt-2">
                                        <div class="collaborators-image d-flex align-items-center">

                                            <!-- collaborators will be injected here -->
                                            ${renderCollaborators(project)}

                                        </div>
                                        <div class="d-flex">
                                            <button class="btn btn-sm p-0 border-0 bg-transparent me-2 comment-icon d-flex align-items-center" title="Comment" data-project-id="${project.id}">
                                                <span class="material-symbols-outlined" style="font-size:16px; color:#828282;">mode_comment</span>
                                                <span class="project-feedback-count ms-1" data-project-id="${project.id}" style="font-size:12px; color:#454545;"></span>
                                            </button>
                                            <button class="btn btn-sm p-0 border-0 bg-transparent project-attach-file d-flex align-items-center" title="Attach File" data-project-id="${project.id}">
                                                <span class="material-symbols-outlined" style="font-size:16px; color:#828282;">attach_file</span>
                                                <span class="project-file-count ms-1" data-project-id="${project.id}" style="font-size:12px; color:#454545;"></span>
                                            </button>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        `;
                    });

                    rowHtml += "</div>";
                    container.innerHTML = rowHtml;

                    // Initialize Bootstrap tooltips for newly injected collaborator images and +N badges
                    try {
                        const tooltipTriggerList = container.querySelectorAll('[data-bs-toggle="tooltip"]');
                        tooltipTriggerList.forEach(function (el) {
                            // dispose existing (safe) then init bottom placement
                            try {
                                if (el._tooltip) {
                                    el._tooltip.dispose && el._tooltip.dispose();
                                }
                            } catch (e) {}
                            try {
                                const tip = new bootstrap.Tooltip(el, { placement: 'bottom' });
                                // store ref to allow future disposal
                                el._tooltip = tip;
                            } catch (e) {
                                // bootstrap not available or init failed
                                // fallback silently
                                // console.warn('tooltip init failed', e);
                            }
                        });
                    } catch (e) {
                        // ignore
                    }

                    // Add event listeners for dropdown toggle
                    document
                        .querySelectorAll(".dropdown-icon")
                        .forEach((icon) => {
                            icon.addEventListener("click", function (e) {
                                e.stopPropagation();
                                const dropdownMenu = this.nextElementSibling;
                                const isVisible =
                                    !dropdownMenu.classList.contains("d-none");
                                // Close all dropdowns
                                document
                                    .querySelectorAll(".dropdown-menu")
                                    .forEach((menu) => {
                                        menu.classList.add("d-none");
                                    });
                                // Toggle current dropdownz
                                if (!isVisible) {
                                    dropdownMenu.classList.remove("d-none");
                                }
                            });
                        });

                    // Event listener for "Edit" dropdown item click
                    document.addEventListener("click", function (e) {
                        if (
                            e.target &&
                            e.target.classList.contains("dropdown-item")
                        ) {
                            const text = e.target.textContent.trim();
                            if (text === "Edit") {
                                e.preventDefault();
                                e.stopPropagation();

                                const card = e.target.closest(".col-md-4");
                                if (!card) {
                                    alert("Project card not found.");
                                    return;
                                }

                                const projectId =
                                    card.getAttribute("data-project-id");
                                if (!projectId) {
                                    alert("Project ID not found.");
                                    return;
                                }

                                // Fetch project data for editing
                                $.ajax({
                                    url:
                                        appUrl +
                                        "/project/" +
                                        projectId +
                                        "/edit",
                                    type: "GET",
                                    dataType: "json",
                                    success: function (data) {
                                        console.log(
                                            "Edit project data loaded:",
                                            data
                                        ); // Debug log
                                        // Populate edit modal form fields
                                        $("#edit_project_id").val(data.id);
                                        $("#edit_title").val(data.title);
                                        $("#edit_description").val(
                                            data.description
                                        );
                                        $("#edit_reference_url").val(
                                            data.reference_url
                                        );
                                        $("#edit_start_date").val(
                                            data.start_date
                                        );
                                        $("#edit_due_date").val(data.due_date);
                                        $("#edit_part_of_project").val(
                                            data.part_of_project
                                        );

                                        // Load departments and set selected department
                                        loadDepartments(function () {
                                            $("#edit_department")
                                                .val(data.department_id)
                                                .trigger("change");

                                            // After department is set, load divisions and set selected division
                                            loadDivisions(
                                                data.department_id,
                                                function () {
                                                    $("#edit_division").val(
                                                        data.division_id
                                                    );
                                                    // Force refresh select display if needed
                                                    $("#edit_division").trigger(
                                                        "change"
                                                    );
                                                },
                                                document.getElementById(
                                                    "edit_division"
                                                )
                                            );
                                            // Force refresh select display if needed
                                            $("#edit_department").trigger(
                                                "change"
                                            );
                                        }, document.getElementById(
                                            "edit_department"
                                        ));

                                        // Reset image preview
                                        if (data.image) {
                                            $("#editImageLabel").css(
                                                "background-image",
                                                "url(" +
                                                    appUrl +
                                                    "/file/project/" +
                                                    data.image +
                                                    ")"
                                            );
                                            $("#editImageLabel").addClass(
                                                "has-image"
                                            );
                                            $("#editImageLabel").css(
                                                "background-size",
                                                "cover"
                                            );
                                            $("#editImageLabel").css(
                                                "opacity",
                                                "1"
                                            );
                                            $("#editImageClearBtn").removeClass(
                                                "d-none"
                                            );
                                        } else {
                                            $("#editImageLabel").css(
                                                "background-image",
                                                "url('" +
                                                    appUrl +
                                                    "/asset/img/background/add-image.png')"
                                            );
                                            $("#editImageLabel").removeClass(
                                                "has-image"
                                            );
                                            $("#editImageLabel").css(
                                                "opacity",
                                                "0.5"
                                            );
                                            $("#editImageClearBtn").addClass(
                                                "d-none"
                                            );
                                        }

                                        // Clear file input for reference file
                                        $("#edit_reference_file").val("");

                                        // --- Reference files preview / management for edit modal (match Task UI) ---
                                        // Normalize existing files array from API (supports reference_files or reference_file)
                                        var existingFiles = Array.isArray(data.reference_files)
                                            ? data.reference_files.slice()
                                            : (Array.isArray(data.reference_file) ? data.reference_file.slice() : (data.reference_file ? [data.reference_file] : []));

                                        // Hidden input holds JSON of files to keep
                                        var existingInput = document.getElementById('existing_reference_files_input');
                                        if (!existingInput) {
                                            existingInput = document.createElement('input');
                                            existingInput.type = 'hidden';
                                            existingInput.id = 'existing_reference_files_input';
                                            existingInput.name = 'existing_reference_files';
                                            document.getElementById('editProjectForm').appendChild(existingInput);
                                        }
                                        existingInput.value = JSON.stringify(existingFiles);

                                        // Containers
                                        var previewEdit = document.getElementById('edit_reference_files_preview');
                                        var existingContainer = document.getElementById('existing_reference_files');
                                        if (previewEdit) previewEdit.innerHTML = '';
                                        if (existingContainer) existingContainer.innerHTML = '';

                                        // Local state for newly selected files
                                        window.editProjectSelectedFiles = [];

                                        // Render existing files list (Task-style)
                                        function renderExistingProjectFiles() {
                                            if (!existingContainer) return;
                                            existingContainer.innerHTML = '';
                                            if (existingFiles.length > 0) {
                                                var title = document.createElement('div');
                                                title.className = 'fw-bold mb-2';
                                                title.textContent = 'Current Files:';
                                                existingContainer.appendChild(title);

                                                var fileList = document.createElement('div');
                                                fileList.className = 'existing-files-list';

                                                existingFiles.forEach(function (fileName, idx) {
                                                    var fileItem = document.createElement('div');
                                                    fileItem.className = 'existing-file-item d-flex align-items-center justify-content-between mb-2 p-2 bg-light border rounded';

                                                    var fileInfo = document.createElement('div');
                                                    fileInfo.className = 'd-flex align-items-center flex-grow-1';

                                                    var fileIcon = document.createElement('span');
                                                    fileIcon.className = 'material-symbols-outlined me-2';
                                                    fileIcon.textContent = 'description';

                                                    var fileLink = document.createElement('a');
                                                    fileLink.href = appUrl + '/file/project/' + fileName;
                                                    fileLink.textContent = fileName;
                                                    fileLink.className = 'text-decoration-none';
                                                    fileLink.target = '_blank';

                                                    var removeBtn = document.createElement('button');
                                                    removeBtn.type = 'button';
                                                    removeBtn.className = 'btn btn-sm btn-outline-danger';
                                                    removeBtn.innerHTML = '&times;';
                                                    removeBtn.onclick = function () {
                                                        // remove from list and re-render
                                                        existingFiles = existingFiles.filter(function (f) { return f !== fileName; });
                                                        existingInput.value = JSON.stringify(existingFiles);
                                                        renderExistingProjectFiles();

                                                        // update badge count on project card immediately (decrement)
                                                        try {
                                                            var pid = data.id;
                                                            var card = document.querySelector('[data-project-id="' + pid + '"]');
                                                            if (card) {
                                                                var fileBadge = card.querySelector('.project-file-count');
                                                                if (fileBadge) {
                                                                    var cur = parseInt(fileBadge.textContent || '0', 10) || 0;
                                                                    fileBadge.textContent = Math.max(0, cur - 1);
                                                                }
                                                            }
                                                        } catch (e) {}
                                                    };

                                                    fileInfo.appendChild(fileIcon);
                                                    fileInfo.appendChild(fileLink);
                                                    fileItem.appendChild(fileInfo);
                                                    fileItem.appendChild(removeBtn);
                                                    fileList.appendChild(fileItem);
                                                });

                                                existingContainer.appendChild(fileList);
                                            }
                                        }

                                        // Render newly selected files (Task-style)
                                        function renderEditProjectSelectedFiles() {
                                            if (!previewEdit) return;
                                            previewEdit.innerHTML = '';

                                            if (window.editProjectSelectedFiles.length > 0) {
                                                var fileList = document.createElement('div');
                                                fileList.className = 'selected-files-list mt-2';

                                                window.editProjectSelectedFiles.forEach(function (file, index) {
                                                    var fileItem = document.createElement('div');
                                                    fileItem.className = 'selected-file-item d-flex align-items-center justify-content-between mb-2 p-2 bg-light border rounded';

                                                    var fileInfo = document.createElement('div');
                                                    fileInfo.className = 'd-flex align-items-center flex-grow-1';

                                                    var fileIcon = document.createElement('span');
                                                    fileIcon.className = 'material-symbols-outlined me-2';
                                                    fileIcon.textContent = 'description';

                                                    var fileName = document.createElement('span');
                                                    fileName.textContent = file.name;
                                                    fileName.className = 'file-name';

                                                    var fileSize = document.createElement('small');
                                                    fileSize.textContent = ' (' + (file.size / 1024 / 1024).toFixed(2) + ' MB)';
                                                    fileSize.className = 'text-muted ms-1';

                                                    var removeBtn = document.createElement('button');
                                                    removeBtn.type = 'button';
                                                    removeBtn.className = 'btn btn-sm btn-outline-danger';
                                                    removeBtn.innerHTML = '&times;';
                                                    removeBtn.onclick = function () {
                                                        window.editProjectSelectedFiles.splice(index, 1);
                                                        renderEditProjectSelectedFiles();
                                                    };

                                                    fileInfo.appendChild(fileIcon);
                                                    fileInfo.appendChild(fileName);
                                                    fileInfo.appendChild(fileSize);
                                                    fileItem.appendChild(fileInfo);
                                                    fileItem.appendChild(removeBtn);
                                                    fileList.appendChild(fileItem);
                                                });

                                                previewEdit.appendChild(fileList);
                                            }
                                        }

                                        // Bind change handler for selecting new files (Task-style behavior)
                                        $("#edit_reference_file").off('change').on('change', function () {
                                            var files = Array.from(this.files || []);
                                            if (files.length > 0) {
                                                window.editProjectSelectedFiles = window.editProjectSelectedFiles.concat(files);
                                                renderEditProjectSelectedFiles();
                                                this.value = '';
                                            }
                                        });

                                        // Initial renders
                                        renderExistingProjectFiles();
                                        renderEditProjectSelectedFiles();

                                        // Populate co-author and contributor inputs
                                        // Clear previous selections
                                        window.clearSelectedCoAuthorsEdit &&
                                            window.clearSelectedCoAuthorsEdit();
                                        window.clearSelectedContributorsEdit &&
                                            window.clearSelectedContributorsEdit();

                                        // Set co-authors
                                        if (data.co_authors) {
                                            var coAuthors = data.co_authors.map(
                                                function (a) {
                                                    return {
                                                        id: a.id,
                                                        name: a.name,
                                                        user_photo:
                                                            a.user_photo ||
                                                            null,
                                                    };
                                                }
                                            );
                                            window.setSelectedCoAuthorsEdit &&
                                                window.setSelectedCoAuthorsEdit(
                                                    coAuthors
                                                );
                                        }

                                        // Set contributors
                                        if (data.contributors) {
                                            var contributors =
                                                data.contributors.map(function (
                                                    a
                                                ) {
                                                    return {
                                                        id: a.id,
                                                        name: a.name,
                                                        user_photo:
                                                            a.user_photo ||
                                                            null,
                                                    };
                                                });
                                            window.setSelectedContributorsEdit &&
                                                window.setSelectedContributorsEdit(
                                                    contributors
                                                );
                                        }

                                        // Show edit modal after data is set
                                        const editProjectModalEl =
                                            document.getElementById(
                                                "editProjectModal"
                                            );
                                        if (!editProjectModalEl) {
                                            console.error(
                                                "Edit Project Modal element not found"
                                            );
                                            alert(
                                                "Edit Project Modal element not found"
                                            );
                                            return;
                                        }
                                        const editProjectModal =
                                            new bootstrap.Modal(
                                                editProjectModalEl
                                            );
                                        editProjectModal.show();
                                    },
                                });
                            }
                        }
                    });

                    // Handle edit project form submission
                    $("#editProjectForm").on("submit", function (e) {
                        e.preventDefault();

                        const projectId = $("#edit_project_id").val();
                        if (!projectId) {
                            alert("Project ID is missing.");
                            return;
                        }

                        const formData = new FormData(this);

                        // Add _method to FormData for Laravel PUT request
                        formData.append("_method", "PUT");

                        // Append co_author and contributors JSON strings from hidden inputs
                        formData.set("co_author", $("#edit_co_author").val());
                        formData.set(
                            "contributors",
                            $("#edit_contributors").val()
                        );

                        // Append newly selected reference files (if any) to FormData as reference_file[]
                        if (window.editProjectSelectedFiles && window.editProjectSelectedFiles.length) {
                            window.editProjectSelectedFiles.forEach(function (f) {
                                try {
                                    formData.append('reference_file[]', f);
                                } catch (e) {
                                    // some browsers may not allow appending File-like objects from other contexts; ignore
                                    console.warn('Failed to append new reference file to FormData', e);
                                }
                            });
                        }

                        // Show loading overlay and disable submit button
                        $("#editModalLoader").removeClass("d-none");
                        const submitBtn = $(
                            '#editProjectForm button[type="submit"]'
                        );
                        submitBtn.prop("disabled", true);

                        $.ajax({
                            url: appUrl + "/project/" + projectId,
                            type: "POST", // Laravel expects POST with _method=PUT for PUT requests
                            data: formData,
                            contentType: false,
                            processData: false,
                            headers: {
                                "X-CSRF-TOKEN": $(
                                    'meta[name="csrf-token"]'
                                ).attr("content"),
                            },
                            success: function (response) {
                                // Show success alert
                                showFloatingAlert(
                                    response.message ||
                                        "Project updated successfully!",
                                    "success"
                                );

                                // Close modal after short delay
                                setTimeout(() => {
                                    var editProjectModalEl =
                                        document.getElementById(
                                            "editProjectModal"
                                        );
                                    var editProjectModal =
                                        bootstrap.Modal.getInstance(
                                            editProjectModalEl
                                        );
                                    if (editProjectModal)
                                        editProjectModal.hide();

                                    // Refresh project data without page reload
                                    loadProjectCardData();
                                }, 800);
                            },
                            error: function (xhr) {
                                if (xhr.status === 422) {
                                    let errors = xhr.responseJSON.errors;
                                    let errorMessages = "";
                                    for (let key in errors) {
                                        errorMessages +=
                                            errors[key].join("\n") + "\n";
                                    }
                                    alert(errorMessages);
                                } else {
                                    alert("Failed to update project.");
                                }
                            },
                            complete: function () {
                                // Hide loading overlay and enable submit button
                                $("#editModalLoader").addClass("d-none");
                                submitBtn.prop("disabled", false);
                            },
                        });
                    });

                    // Image preview and clear button logic for edit image input
                    setupImageInput(
                        document.getElementById("edit_image"),
                        document.getElementById("editImageLabel"),
                        document.getElementById("editImageClearBtn")
                    );

                    // Clear form and reset image preview when edit modal is closed
                    var editProjectModalEl =
                        document.getElementById("editProjectModal");
                    editProjectModalEl.addEventListener(
                        "hidden.bs.modal",
                        function () {
                            $("#editProjectForm")[0].reset();

                            $("#editImageLabel").css(
                                "background-image",
                                "url('" +
                                    appUrl +
                                    "/asset/img/background/add-image.png')"
                            );
                            $("#editImageLabel").removeClass("has-image");
                            $("#editImageLabel").css("opacity", "0.5");
                            $("#editImageClearBtn").addClass("d-none");

                            // Reload departments, divisions, projects to reset selects
                            loadDepartments();
                            $("#edit_division").html(
                                '<option value="" disabled selected>Select Division</option>'
                            );
                            loadProjects();

                            // Clear selected co-authors and contributors display and hidden inputs
                            window.clearSelectedCoAuthorsEdit &&
                                window.clearSelectedCoAuthorsEdit();
                            window.clearSelectedContributorsEdit &&
                                window.clearSelectedContributorsEdit();

                            // Clear temporary reference files arrays and preview list (Task-style containers)
                            try {
                                window.editProjectSelectedFiles = [];
                                const previewEdit = document.getElementById('edit_reference_files_preview');
                                if (previewEdit) previewEdit.innerHTML = '';
                                const existingContainer = document.getElementById('existing_reference_files');
                                if (existingContainer) existingContainer.innerHTML = '';
                                const hiddenExisting = document.getElementById('existing_reference_files_input');
                                if (hiddenExisting) hiddenExisting.value = '[]';
                                $("#edit_reference_file").off('change');
                            } catch (e) {}

                            $("#editProjectAlert").addClass("d-none").hide();
                        }
                    );

                    // Setup co-author and contributor inputs for edit modal (similar to add modal)
                    function setupCoAuthorInputEdit() {
                        const input = document.getElementById(
                            "edit_co_author_input"
                        );
                        const dropdown = document.getElementById(
                            "edit_co_author_dropdown"
                        );
                        const selectedContainer = document.getElementById(
                            "edit_selected_co_authors"
                        );
                        const hiddenInput =
                            document.getElementById("edit_co_author");

                        let employees = [];
                        let filteredEmployees = [];
                        let selectedEmployees = [];

                        function fetchEmployees(query = "") {
                            const currentEmployeeId =
                                document
                                    .getElementById("editProjectModal")
                                    ?.getAttribute("data-employee-id") || "";
                            $.ajax({
                                url: appUrl + "/employee/index",
                                type: "GET",
                                data: {
                                    query: query,
                                    exclude_employee_id: currentEmployeeId,
                                },
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

                                    // Atur default user_photo jika kosong
                                    if (!emp.user_photo) {
                                        emp.user_photo =
                                            "/asset/img/profile_picture/default.png"; // relatif terhadap appUrl
                                    }

                                    // Bangun URL gambar profile
                                    let photoUrl;
                                    if (emp.user_photo.startsWith("http")) {
                                        photoUrl = emp.user_photo;
                                    } else if (emp.user_photo.startsWith("/")) {
                                        photoUrl = appUrl + emp.user_photo;
                                    } else if (emp.user_photo.includes("/")) {
                                        photoUrl =
                                            appUrl + "/" + emp.user_photo;
                                    } else {
                                        photoUrl =
                                            appUrl +
                                            "/file/profile_picture/" +
                                            emp.user_photo;
                                    }

                                    return `
            <label class="dropdown-item d-flex align-items-center justify-content-between" style="cursor: pointer;">
                <div class="d-flex align-items-center">
                    <img src="${photoUrl}" alt="${
                                        emp.name
                                    }" class="rounded-circle me-2" style="width: 30px; height: 30px; object-fit: cover;">
                    <span>${emp.name}</span>
                </div>
                <input type="checkbox" class="co-author-checkbox" data-id="${
                    emp.id
                }" data-name="${emp.name}" ${isChecked ? "checked" : ""}>
            </label>
        `;
                                })
                                .join("");

                            dropdown.innerHTML = html;
                            dropdown.style.display = "block";

                            dropdown
                                .querySelectorAll(".co-author-checkbox")
                                .forEach((checkbox) => {
                                    checkbox.addEventListener(
                                        "change",
                                        function () {
                                            const id = parseInt(
                                                this.getAttribute("data-id")
                                            );
                                            const name =
                                                this.getAttribute("data-name");
                                            const employeeObj = employees.find(
                                                (emp) => emp.id === id
                                            );

                                            if (this.checked) {
                                                if (
                                                    !selectedEmployees.some(
                                                        (e) => e.id === id
                                                    )
                                                ) {
                                                    selectedEmployees.push({
                                                        id,
                                                        name,
                                                        user_photo: employeeObj
                                                            ? employeeObj.user_photo
                                                            : null,
                                                    });
                                                }
                                            } else {
                                                selectedEmployees =
                                                    selectedEmployees.filter(
                                                        (e) => e.id !== id
                                                    );
                                            }

                                            renderSelected();
                                            updateHiddenInput();
                                        }
                                    );
                                });
                        }

                        function renderSelected() {
                            selectedContainer.innerHTML = "";
                            selectedEmployees.forEach((emp) => {
                                // Ganti semua logika pengambilan foto dengan:
                                const photoUrl =
                                    emp.user_photo ||
                                    appUrl +
                                        "/asset/img/profile_picture/default.png";
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

                                const removeBtn =
                                    document.createElement("button");
                                removeBtn.type = "button";
                                removeBtn.className =
                                    "btn-close btn-close-white btn-sm ms-2";
                                removeBtn.setAttribute("aria-label", "Remove");
                                removeBtn.addEventListener("click", () => {
                                    selectedEmployees =
                                        selectedEmployees.filter(
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
                            if (
                                !input.contains(e.target) &&
                                !dropdown.contains(e.target)
                            ) {
                                dropdown.style.display = "none";
                            }
                        });

                        fetchEmployees();

                        window.clearSelectedCoAuthorsEdit = function () {
                            selectedEmployees = [];
                            renderSelected();
                            updateHiddenInput();
                            dropdown.style.display = "none";
                            input.value = "";
                        };

                        window.setSelectedCoAuthorsEdit = function (coAuthors) {
                            selectedEmployees = coAuthors.map((ca) => {
                                let photoUrl = "";
                                let userPhoto = ca.user_photo;
                                if (userPhoto) {
                                    if (userPhoto.startsWith("http")) {
                                        photoUrl = userPhoto;
                                    } else if (
                                        userPhoto.startsWith("/file/photo") ||
                                        userPhoto.startsWith(
                                            "/file/profile_picture"
                                        )
                                    ) {
                                        photoUrl = appUrl + userPhoto;
                                    } else if (
                                        userPhoto.startsWith("file/photo") ||
                                        userPhoto.startsWith(
                                            "file/profile_picture"
                                        )
                                    ) {
                                        photoUrl = appUrl + "/" + userPhoto;
                                    } else {
                                        photoUrl =
                                            appUrl +
                                            "/file/profile_picture/" +
                                            userPhoto;
                                    }
                                } else {
                                    photoUrl =
                                        appUrl +
                                        "/asset/img/profile_picture/default.png";
                                }
                                return {
                                    id: ca.id,
                                    name: ca.name,
                                    user_photo: photoUrl,
                                };
                            });
                            renderSelected();
                            updateHiddenInput();
                        };
                    }

                    function setupContributorInputEdit() {
                        const input = document.getElementById(
                            "edit_contributor_input"
                        );
                        const dropdown = document.getElementById(
                            "edit_contributor_dropdown"
                        );
                        const selectedContainer = document.getElementById(
                            "edit_selected_contributors"
                        );
                        const hiddenInput =
                            document.getElementById("edit_contributors");

                        let employees = [];
                        let filteredEmployees = [];
                        let selectedEmployees = [];

                        function fetchEmployees(query = "") {
                            const currentEmployeeId =
                                document
                                    .getElementById("editProjectModal")
                                    ?.getAttribute("data-employee-id") || "";
                            $.ajax({
                                url: appUrl + "/employee/index",
                                type: "GET",
                                data: {
                                    query: query,
                                    exclude_employee_id: currentEmployeeId,
                                },
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

                                    // Pastikan user_photo ada, jika tidak set default
                                    if (!emp.user_photo) {
                                        emp.user_photo =
                                            "/asset/img/profile_picture/default.png"; // relatif terhadap appUrl
                                    }

                                    // Tentukan URL gambar profil
                                    let photoUrl;
                                    if (emp.user_photo.startsWith("http")) {
                                        photoUrl = emp.user_photo;
                                    } else if (emp.user_photo.startsWith("/")) {
                                        photoUrl = appUrl + emp.user_photo;
                                    } else if (emp.user_photo.includes("/")) {
                                        photoUrl =
                                            appUrl + "/" + emp.user_photo;
                                    } else {
                                        photoUrl =
                                            appUrl +
                                            "/file/profile_picture/" +
                                            emp.user_photo;
                                    }

                                    return `
            <label class="dropdown-item d-flex align-items-center justify-content-between" style="cursor: pointer;">
                <div class="d-flex align-items-center">
                    <img src="${photoUrl}" alt="${
                                        emp.name
                                    }" class="rounded-circle me-2" style="width: 30px; height: 30px; object-fit: cover;">
                    <span>${emp.name}</span>
                </div>
                <input type="checkbox" class="contributor-checkbox" data-id="${
                    emp.id
                }" data-name="${emp.name}" ${isChecked ? "checked" : ""}>
            </label>
        `;
                                })
                                .join("");

                            dropdown.innerHTML = html;
                            dropdown.style.display = "block";

                            dropdown
                                .querySelectorAll(".contributor-checkbox")
                                .forEach((checkbox) => {
                                    checkbox.addEventListener(
                                        "change",
                                        function () {
                                            const id = parseInt(
                                                this.getAttribute("data-id")
                                            );
                                            const name =
                                                this.getAttribute("data-name");
                                            const employeeObj = employees.find(
                                                (emp) => emp.id === id
                                            );

                                            if (this.checked) {
                                                if (
                                                    !selectedEmployees.some(
                                                        (e) => e.id === id
                                                    )
                                                ) {
                                                    selectedEmployees.push({
                                                        id,
                                                        name,
                                                        user_photo: employeeObj
                                                            ? employeeObj.user_photo
                                                            : null,
                                                    });
                                                }
                                            } else {
                                                selectedEmployees =
                                                    selectedEmployees.filter(
                                                        (e) => e.id !== id
                                                    );
                                            }

                                            renderSelected();
                                            updateHiddenInput();
                                            renderDropdown(); // refresh dropdown setelah perubahan
                                        }
                                    );
                                });
                        }

                        function renderSelected() {
                            selectedContainer.innerHTML = "";
                            selectedEmployees.forEach((emp) => {
                                // Ganti semua logika pengambilan foto dengan:
                                const photoUrl =
                                    emp.user_photo ||
                                    appUrl +
                                        "/asset/img/profile_picture/default.png";
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

                                const removeBtn =
                                    document.createElement("button");
                                removeBtn.type = "button";
                                removeBtn.className =
                                    "btn-close btn-close-white btn-sm ms-2";
                                removeBtn.setAttribute("aria-label", "Remove");
                                removeBtn.addEventListener("click", () => {
                                    selectedEmployees =
                                        selectedEmployees.filter(
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
                            if (
                                !input.contains(e.target) &&
                                !dropdown.contains(e.target)
                            ) {
                                dropdown.style.display = "none";
                            }
                        });

                        fetchEmployees();

                        window.clearSelectedContributorsEdit = function () {
                            selectedEmployees = [];
                            renderSelected();
                            updateHiddenInput();
                            dropdown.style.display = "none";
                            input.value = "";
                        };

                        window.setSelectedContributorsEdit = function (
                            contributors
                        ) {
                            selectedEmployees = contributors.map((ca) => {
                                let photoUrl = "";
                                let userPhoto = ca.user_photo;

                                if (!userPhoto) {
                                    photoUrl =
                                        appUrl +
                                        "/asset/img/profile_picture/default.png";
                                } else if (userPhoto.startsWith("http")) {
                                    photoUrl = userPhoto;
                                } else if (
                                    userPhoto.startsWith("/file/photo") ||
                                    userPhoto.startsWith(
                                        "/file/profile_picture"
                                    )
                                ) {
                                    photoUrl = appUrl + userPhoto;
                                } else if (
                                    userPhoto.startsWith("file/photo") ||
                                    userPhoto.startsWith("file/profile_picture")
                                ) {
                                    photoUrl = appUrl + "/" + userPhoto;
                                } else if (userPhoto.startsWith("/")) {
                                    photoUrl = appUrl + userPhoto;
                                } else {
                                    photoUrl =
                                        appUrl +
                                        "/file/profile_picture/" +
                                        userPhoto;
                                }

                                return {
                                    id: ca.id,
                                    name: ca.name,
                                    user_photo: photoUrl,
                                };
                            });
                            renderSelected();
                            updateHiddenInput();
                        };
                    }

                    setupCoAuthorInputEdit();
                    setupContributorInputEdit();

                    // Feedback modal elements
                    var projectFeedbackModalEl = document.getElementById(
                        "projectFeedbackModal"
                    );
                    var modalTitle = projectFeedbackModalEl.querySelector(
                        ".feedback-modal-title"
                    );
                    var modalBody = projectFeedbackModalEl.querySelector(
                        ".feedback-modal-body"
                    );
                    var feedbackModalCloseBtn =
                        projectFeedbackModalEl.querySelector(".btn-close");

                    // Function to load feedback data with loading spinner
                    function loadFeedbackData(projectId) {
                        modalTitle.textContent = "Feedback";
                        modalBody.innerHTML =
                            '<div class="text-center my-4"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';

                        resetAddFeedbackButton();

                        fetch(appUrl + "/project-feedbacks/" + projectId)
                            .then((response) => {
                                if (!response.ok) {
                                    throw new Error(
                                        "Failed to fetch feedback data"
                                    );
                                }
                                return response.json();
                            })
                            .then((data) => {
                                modalBody.innerHTML = ""; // Clear loading spinner

                                // Update feedback badge count on project card
                                const card = document.querySelector(`[data-project-id="${projectId}"]`);
                                if (card) {
                                    const feedbackBadge = card.querySelector('.project-feedback-count');
                                    if (feedbackBadge) {
                                        const feedbackCount = (data.data && data.data.length) || 0;
                                        feedbackBadge.textContent = feedbackCount;
                                    }
                                }

                                if (!data.data || data.data.length === 0) {
                                    modalBody.innerHTML =
                                        "<p>No feedback available for this project.</p>";
                                    return;
                                }

                                // Render feedback items
                                data.data.forEach((feedback) => {
                                    const feedbackItem =
                                        document.createElement("div");
                                    feedbackItem.className =
                                        "feedback-item mb-3 p-3 border-bottom";

                                    // Header with employee info
                                    const headerDiv =
                                        document.createElement("div");
                                    headerDiv.className =
                                        "d-flex align-items-center mb-2";

                                    const img = document.createElement("img");
                                    // Adjust employee_photo path to avoid duplicate segments
                                    let employeePhotoPath =
                                        feedback.employee_photo || "";
                                    if (
                                        employeePhotoPath.startsWith(
                                            "/file/photo"
                                        ) ||
                                        employeePhotoPath.startsWith(
                                            "/file/profile_picture"
                                        )
                                    ) {
                                        // already full relative path, use as is
                                    } else if (
                                        employeePhotoPath.startsWith(
                                            "file/photo"
                                        ) ||
                                        employeePhotoPath.startsWith(
                                            "file/profile_picture"
                                        )
                                    ) {
                                        employeePhotoPath =
                                            "/" + employeePhotoPath;
                                    } else if (employeePhotoPath.length > 0) {
                                        employeePhotoPath =
                                            "/file/profile_picture/" +
                                            employeePhotoPath;
                                    }
                                    img.src =
                                        employeePhotoPath.length > 0
                                            ? appUrl + employeePhotoPath
                                            : appUrl +
                                              "/asset/img/profile_picture/default.png";
                                    img.alt = "Employee Photo";
                                    img.className =
                                        "feedback-employee-photo me-2 rounded-circle";
                                    img.style.width = "40px";
                                    img.style.height = "40px";

                                    const infoDiv =
                                        document.createElement("div");
                                    const nameDiv =
                                        document.createElement("div");
                                    nameDiv.className = "fw-bold";
                                    nameDiv.textContent =
                                        feedback.employee_name || "Unknown";

                                    // Add creation date below employee name
                                    const dateDiv =
                                        document.createElement("div");
                                    dateDiv.className = "text-muted small";
                                    if (feedback.created_at) {
                                        const dateObj = new Date(
                                            feedback.created_at
                                        );
                                        const now = new Date();

                                        // Helper function to check if two dates are the same day
                                        function isSameDay(d1, d2) {
                                            return (
                                                d1.getFullYear() ===
                                                    d2.getFullYear() &&
                                                d1.getMonth() ===
                                                    d2.getMonth() &&
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
                                            dateDiv.textContent =
                                                dateObj.toLocaleTimeString(
                                                    undefined,
                                                    {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    }
                                                );
                                        } else if (isYesterday(dateObj, now)) {
                                            dateDiv.textContent = "yesterday";
                                        } else {
                                            dateDiv.textContent =
                                                dateObj.toLocaleDateString(
                                                    undefined,
                                                    {
                                                        year: "numeric",
                                                        month: "long",
                                                        day: "numeric",
                                                    }
                                                );
                                        }
                                    } else {
                                        dateDiv.textContent = "";
                                    }

                                    const roleDiv =
                                        document.createElement("div");
                                    roleDiv.className = "text-muted small";
                                    roleDiv.textContent =
                                        (feedback.division
                                            ? feedback.division + " | "
                                            : "") + (feedback.role || "");

                                    infoDiv.appendChild(nameDiv);
                                    infoDiv.appendChild(dateDiv);
                                    infoDiv.appendChild(roleDiv);
                                    headerDiv.appendChild(img);
                                    headerDiv.appendChild(infoDiv);

                                    // Comment
                                    const commentDiv =
                                        document.createElement("div");
                                    commentDiv.className =
                                        "feedback-comment mb-2";
                                    commentDiv.textContent =
                                        feedback.feedback_comment || "";

                                    // Media attachments
                                    const mediaDiv =
                                        document.createElement("div");
                                    mediaDiv.className = "feedback-media mt-2";

                                    if (
                                        feedback.reference_url ||
                                        feedback.reference_file
                                    ) {
                                        const refContainer =
                                            document.createElement("div");
                                        refContainer.className =
                                            "feedback-reference-container";

                                        if (feedback.reference_url) {
                                            const refUrlLink =
                                                document.createElement("a");
                                            refUrlLink.href =
                                                feedback.reference_url;
                                            refUrlLink.target = "_blank";
                                            refUrlLink.className =
                                                "feedback-reference-url";

                                            refUrlLink.innerHTML = `<span class="material-symbols-outlined">link</span> Reference Link`;
                                            refContainer.appendChild(
                                                refUrlLink
                                            );
                                        }

                                        if (feedback.reference_file) {
                                            const refFileLink =
                                                document.createElement("a");
                                            refFileLink.href =
                                                appUrl +
                                                "/file/project/" +
                                                feedback.reference_file;
                                            refFileLink.download = "";
                                            refFileLink.className =
                                                "feedback-reference-file";

                                            // Extract file extension/type from filename
                                            const fileName =
                                                feedback.reference_file;
                                            let fileType = "";
                                            const extMatch =
                                                fileName.match(/\.(\w+)$/);
                                            if (extMatch) {
                                                fileType =
                                                    extMatch[1].toUpperCase();
                                            }

                                            refFileLink.innerHTML = `<span class="material-symbols-outlined">draft</span> FEEDBACK_${fileType}`;
                                            refContainer.appendChild(
                                                refFileLink
                                            );
                                        }

                                        mediaDiv.appendChild(refContainer);
                                    }

                                    if (feedback.image) {
                                        const feedbackImage =
                                            document.createElement("img");
                                        feedbackImage.src =
                                            appUrl +
                                            "/file/project/" +
                                            feedback.image;
                                        feedbackImage.alt = "Feedback Image";
                                        feedbackImage.className =
                                            "feedback-image me-2 mb-2";
                                        feedbackImage.style.maxWidth = "150px";
                                        feedbackImage.style.maxHeight = "150px";
                                        feedbackImage.style.borderRadius =
                                            "8px";
                                        feedbackImage.style.cursor = "pointer";
                                        feedbackImage.addEventListener(
                                            "click",
                                            () => {
                                                showImageModal(
                                                    feedbackImage.src
                                                );
                                            }
                                        );
                                        mediaDiv.appendChild(feedbackImage);
                                    }

                                    feedbackItem.appendChild(headerDiv);
                                    feedbackItem.appendChild(commentDiv);
                                    feedbackItem.appendChild(mediaDiv);

                                    modalBody.appendChild(feedbackItem);
                                });
                            })
                            .catch((error) => {
                                modalBody.innerHTML =
                                    '<div class="alert alert-danger">Error loading feedback data. Please try again.</div>';
                                console.error(
                                    "Error fetching feedback data:",
                                    error
                                );
                            });
                    }

                    // ...existing code...

                    // Function to show add feedback form
                    function showAddFeedbackForm(projectId) {
                        modalTitle.textContent = "Add Feedback";

                        modalBody.innerHTML = `
        <form id="addFeedbackForm" enctype="multipart/form-data">
            <input type="hidden" name="project_id" value="${projectId}">
            <input type="hidden" name="employee_id" value="${
                projectFeedbackModalEl.getAttribute("data-employee-id") || ""
            }">
           <div class="mb-3">
                    <label class="form-label">Upload Image</label>
                    <div class="image-upload-container">
                        <label for="feedback_image" class="custom-image-upload position-relative" id="feedbackImageLabel"
                            style="background-position: center center; background-repeat: no-repeat; background-size: 50%; background-image: url('${appUrl}/asset/img/background/add-image.png'); cursor: pointer;">
                            <input type="file" id="feedback_image" name="feedback_image" accept="image/*" class="d-none">
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
                        const imageInput =
                            modalBody.querySelector("#feedback_image");
                        const imageLabel = modalBody.querySelector(
                            "#feedbackImageLabel"
                        );
                        const imageClearBtn = modalBody.querySelector(
                            "#feedbackImageClearBtn"
                        );

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
                                "url('" +
                                appUrl +
                                "/asset/img/background/add-image.png')";
                            imageLabel.style.backgroundPosition =
                                "center center";
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
                        addFeedbackButton.parentNode.replaceChild(
                            newButton,
                            addFeedbackButton
                        );

                        newButton.addEventListener("click", function (e) {
                            e.preventDefault();
                            const form =
                                document.getElementById("addFeedbackForm");
                            if (form) {
                                submitFeedbackForm(form, projectId);
                            }
                        });
                    }

                    function submitFeedbackForm(form, projectId) {
                        const submitBtn =
                            document.getElementById("addFeedbackButton");
                        const originalBtnText = submitBtn.innerHTML;

                        // Tampilkan loading state
                        submitBtn.innerHTML =
                            '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Submitting...';
                        submitBtn.disabled = true;

                        const formData = new FormData(form);

                        fetch(appUrl + "/project-feedbacks", {
                            method: "POST",
                            headers: {
                                "X-CSRF-TOKEN": document
                                    .querySelector('meta[name="csrf-token"]')
                                    .getAttribute("content"),
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
                                // Tampilkan alert sukses
                                const alertDiv = document.createElement("div");
                                alertDiv.className =
                                    "alert alert-success alert-dismissible fade show";
                                alertDiv.innerHTML = `
            ${data.message || "Feedback submitted successfully!"}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
                                modalBody.prepend(alertDiv);

                                // Update feedback badge count immediately
                                const card = document.querySelector(`[data-project-id="${projectId}"]`);
                                if (card) {
                                    const feedbackBadge = card.querySelector('.project-feedback-count');
                                    if (feedbackBadge) {
                                        const currentCount = parseInt(feedbackBadge.textContent) || 0;
                                        feedbackBadge.textContent = currentCount + 1;
                                    }
                                }

                                // Muat ulang daftar feedback setelah 1 detik
                                setTimeout(() => {
                                    loadFeedbackData(projectId);

                                    // Reset form setelah sukses untuk memungkinkan tambah feedback lagi
                                    form.reset();

                                    // Reset image preview
                                    const imageLabel = form.querySelector('#feedbackImageLabel');
                                    const imageClearBtn = form.querySelector('#feedbackImageClearBtn');
                                    if (imageLabel) {
                                        imageLabel.style.backgroundImage = "url('" + appUrl + "/asset/img/background/add-image.png')";
                                        imageLabel.style.backgroundPosition = "center center";
                                        imageLabel.style.backgroundRepeat = "no-repeat";
                                        imageLabel.style.backgroundSize = "50%";
                                        imageLabel.classList.remove("has-image");
                                        imageLabel.style.opacity = "0.5";
                                    }
                                    if (imageClearBtn) {
                                        imageClearBtn.classList.add("d-none");
                                    }
                                }, 1000);
                            })
                            .catch((error) => {
                                let errorMessage =
                                    "Failed to submit feedback. Please try again.";
                                if (error.errors) {
                                    errorMessage = Object.values(
                                        error.errors
                                    ).join("<br>");
                                } else if (error.message) {
                                    errorMessage = error.message;
                                }

                                const alertDiv = document.createElement("div");
                                alertDiv.className =
                                    "alert alert-danger alert-dismissible fade show";
                                alertDiv.innerHTML = `
            ${errorMessage}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
                                modalBody.prepend(alertDiv);
                            })
                            .finally(() => {
                                // Reset tombol submit
                                submitBtn.innerHTML = originalBtnText;
                                submitBtn.disabled = false;
                            });
                    }

                    // Modal hidden event to reset modal title and clear modal body
                    projectFeedbackModalEl.addEventListener(
                        "hidden.bs.modal",
                        function () {
                            modalTitle.textContent = "Feedback";
                            modalBody.innerHTML = "";

                            // Remove any leftover modal backdrop elements to fix background remaining dark issue
                            const backdrops =
                                document.querySelectorAll(".modal-backdrop");
                            backdrops.forEach((backdrop) =>
                                backdrop.parentNode.removeChild(backdrop)
                            );
                        }
                    );

                    // Event listener for "Feedback" dropdown item click
                    document.addEventListener("click", function (e) {
                        const target = e.target.closest(
                            "button[title='Comment'], .dropdown-item"
                        );

                        if (!target) return;

                        // --- Klik dari dropdown Feedback ---
                        if (
                            target.classList.contains("dropdown-item") &&
                            target.textContent.trim() === "Feedback"
                        ) {
                            e.preventDefault();
                            e.stopPropagation();

                            const card = target.closest(".col-md-4");
                            if (!card) {
                                alert("Project card not found.");
                                return;
                            }

                            const projectId =
                                card.getAttribute("data-project-id");
                            if (!projectId) {
                                alert("Project ID not found.");
                                return;
                            }

                            projectFeedbackModalEl.setAttribute(
                                "data-project-id",
                                projectId
                            );

                            loadFeedbackData(projectId);
                            const projectFeedbackModal = new bootstrap.Modal(
                                projectFeedbackModalEl
                            );
                            projectFeedbackModal.show();
                        }

                        // --- Klik dari tombol Comment ---
                        if (target.getAttribute("title") === "Comment") {
                            e.preventDefault();
                            e.stopPropagation();

                            const card = target.closest(".col-md-4");
                            if (!card) {
                                alert("Project card not found.");
                                return;
                            }

                            const projectId =
                                card.getAttribute("data-project-id");
                            if (!projectId) {
                                alert("Project ID not found.");
                                return;
                            }

                            projectFeedbackModalEl.setAttribute(
                                "data-project-id",
                                projectId
                            );

                            loadFeedbackData(projectId);
                            const projectFeedbackModal = new bootstrap.Modal(
                                projectFeedbackModalEl
                            );
                            projectFeedbackModal.show();
                        }
                    });

                    // Helper function to show image in modal (for lightbox effect)
                    function showImageModal(imageSrc) {
                        window.open(imageSrc, "_blank");
                    }

                    // Remove old confirm dialog and use modal instead
                    document
                        .querySelectorAll(".delete-project")
                        .forEach((item) => {
                            item.addEventListener("click", function (e) {
                                e.stopPropagation();

                                const card = this.closest(".col-md-4");
                                const projectId =
                                    card.getAttribute("data-project-id");
                                if (!projectId) {
                                    alert("Project ID not found.");
                                    return;
                                }

                                // Open delete confirmation modal and populate data
                                const deleteModalEl =
                                    document.getElementById(
                                        "deleteProjectModal"
                                    );
                                const deleteModal = new bootstrap.Modal(
                                    deleteModalEl
                                );

                                // Set project image and title in modal
                                const projectImage = card.querySelector("img");
                                const projectTitle =
                                    card.querySelector(".title-project");

                                const deleteProjectImage =
                                    document.getElementById(
                                        "deleteProjectImage"
                                    );
                                const deleteProjectTitle =
                                    document.getElementById(
                                        "deleteProjectTitle"
                                    );

                                deleteProjectImage.src = projectImage
                                    ? projectImage.src
                                    : "";
                                deleteProjectTitle.textContent = projectTitle
                                    ? projectTitle.textContent
                                    : "";

                                // Store projectId and card element on modal for use in delete
                                deleteModalEl.dataset.projectId = projectId;
                                deleteModalEl.dataset.cardId =
                                    card.getAttribute("data-project-id");

                                deleteModal.show();

                                // Delete button click handler
                                const confirmDeleteBtn =
                                    document.getElementById(
                                        "confirmDeleteProjectBtn"
                                    );
                                confirmDeleteBtn.onclick = function () {
                                    $.ajax({
                                        url: appUrl + "/project/" + projectId,
                                        type: "DELETE",
                                        headers: {
                                            "X-CSRF-TOKEN": $(
                                                'meta[name="csrf-token"]'
                                            ).attr("content"),
                                        },
                                        success: function (response) {
                                            // Remove card from UI
                                            card.remove();

                                            // Hide modal
                                            deleteModal.hide();

                                            // Show success alert fixed at bottom right corner
                                            let alertContainer =
                                                document.createElement("div");
                                            alertContainer.className =
                                                "alert alert-success d-flex align-items-center project-delete-alert";
                                            alertContainer.setAttribute(
                                                "role",
                                                "alert"
                                            );
                                            alertContainer.style.opacity = "1";

                                            alertContainer.innerHTML = `
                                        <svg class="bi flex-shrink-0 me-2" width="24" height="24" role="img" aria-label="Success:">
                                            <use xlink:href="#check-circle-fill"/>
                                        </svg>
                                        <div>
                                            ${
                                                response.message ||
                                                "Project deleted successfully"
                                            }
                                        </div>
                                    `;

                                            document.body.appendChild(
                                                alertContainer
                                            );

                                            // After 1.5 seconds, fade out alert and reload page
                                            setTimeout(() => {
                                                alertContainer.style.opacity =
                                                    "0";
                                                setTimeout(() => {
                                                    alertContainer.remove();
                                                }, 500);
                                            }, 1500);
                                        },
                                        error: function (xhr) {
                                            console.error("Delete error:", xhr);
                                            alert(
                                                "Failed to delete project: " +
                                                    (xhr.responseJSON
                                                        ?.message ||
                                                        "Unknown error")
                                            );
                                        },
                                    });
                                };
                            });
                        });

                    // Close dropdown when clicking outside
                    document.addEventListener("click", function () {
                        document
                            .querySelectorAll(".dropdown-menu")
                            .forEach((menu) => {
                                menu.classList.add("d-none");
                            });
                    });

                    // Event listener for "Detail", "Task", and "Feedback" dropdown item click
                    document.addEventListener("click", function (e) {
                        if (
                            e.target &&
                            e.target.classList.contains("dropdown-item")
                        ) {
                            const text = e.target.textContent.trim();
                            const card = e.target.closest(".col-md-4");
                            if (!card) return;

                            const projectId =
                                card.getAttribute("data-project-id");
                            if (!projectId) {
                                alert("Project ID not found.");
                                return;
                            }

                            if (text === "Detail") {
                                e.preventDefault();
                                e.stopPropagation();

                                // Fetch project details via AJAX
                                $.ajax({
                                    url: appUrl + "/project/" + projectId,
                                    type: "GET",
                                    dataType: "json",
                                    success: function (response) {
                                        const data = response.data || {};

                                        // Populate modal fields
                                        const baseFileUrl =
                                            appUrl + "/file/project/";

                                        $("#projectDetailImage").attr(
                                            "src",
                                            data.image
                                                ? baseFileUrl + data.image
                                                : appUrl +
                                                      "/asset/img/background/add-image.png"
                                        );
                                        $("#projectDetailImage").attr(
                                            "style",
                                            "border-radius: 8px;"
                                        );

                                        $("#projectDetailTitle").replaceWith(
                                            `<h2 class="project-title" id="projectDetailTitle">${
                                                data.title || ""
                                            }</h2>`
                                        );
                                        $("#projectDetailAuthor")
                                            .text(
                                                data.author
                                                    ? data.author.name
                                                    : "Unknown"
                                            )
                                            .css("text-align", "justify");
                                        $("#projectDetailDepartment").text(
                                            data.department || ""
                                        );
                                        $("#projectDetailDivision").text(
                                            data.division || ""
                                        );
                                        $("#projectDetailDescription").text(
                                            data.description || ""
                                        );

                                        if (data.reference_url) {
                                            $("#projectDetailReferenceUrl")
                                                .attr(
                                                    "href",
                                                    data.reference_url
                                                )
                                                .text(data.reference_url)
                                                .show();
                                        } else {
                                            $(
                                                "#projectDetailReferenceUrl"
                                            ).hide();
                                        }

                                        if (data.reference_file) {
                                            $("#projectDetailReferenceFile")
                                                .attr(
                                                    "href",
                                                    baseFileUrl +
                                                        data.reference_file
                                                )
                                                .show();
                                        } else {
                                            $(
                                                "#projectDetailReferenceFile"
                                            ).hide();
                                        }

                                        function formatDate(dateStr) {
                                            if (!dateStr) return "";
                                            const options = {
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                            };
                                            const dateObj = new Date(dateStr);
                                            return dateObj.toLocaleDateString(
                                                undefined,
                                                options
                                            );
                                        }

                                        $("#projectDetailStartDate").text(
                                            formatDate(data.start_date)
                                        );
                                        $("#projectDetailDueDate").text(
                                            formatDate(data.due_date)
                                        );

                                        if (
                                            data.co_authors &&
                                            data.co_authors.length > 0
                                        ) {
                                            const coAuthorNames =
                                                data.co_authors
                                                    .map((ca) => ca.name)
                                                    .join(", ");
                                            $("#projectDetailCoAuthors").text(
                                                coAuthorNames
                                            );
                                        } else {
                                            $("#projectDetailCoAuthors").text(
                                                "None"
                                            );
                                        }

                                        if (
                                            data.contributors &&
                                            data.contributors.length > 0
                                        ) {
                                            const contributorNames =
                                                data.contributors
                                                    .map((c) => c.name)
                                                    .join(", ");
                                            $(
                                                "#projectDetailContributors"
                                            ).text(contributorNames);
                                        } else {
                                            $(
                                                "#projectDetailContributors"
                                            ).text("None");
                                        }

                                        const projectDetailModal =
                                            new bootstrap.Modal(
                                                document.getElementById(
                                                    "projectDetailModal"
                                                )
                                            );
                                        projectDetailModal.show();
                                    },
                                    error: function () {
                                        alert(
                                            "Failed to load project details."
                                        );
                                    },
                                });
                            } else if (text === "Task") {
                                e.preventDefault();
                                e.stopPropagation();

                                loadProjectTasks(projectId);
                            } else if (text === "Feedback") {
                                e.preventDefault();
                                e.stopPropagation();

                                const projectFeedbackModalEl =
                                    document.getElementById(
                                        "projectFeedbackModal"
                                    );
                                projectFeedbackModalEl.setAttribute(
                                    "data-project-id",
                                    projectId
                                );

                                const modalBody =
                                    projectFeedbackModalEl.querySelector(
                                        ".feedback-modal-body"
                                    );
                                modalBody.innerHTML = "";

                                loadFeedbackData(projectId);
                                const projectFeedbackModal =
                                    new bootstrap.Modal(projectFeedbackModalEl);
                                projectFeedbackModal.show();
                            }
                        }
                    });

                    // Function to format task date like feedback
                    function formatTaskDate(dateStr) {
                        if (!dateStr) return "";

                        const dateObj = new Date(dateStr);
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
                            return dateObj.toLocaleTimeString(undefined, {
                                hour: "2-digit",
                                minute: "2-digit",
                            });
                        } else if (isYesterday(dateObj, now)) {
                            return "yesterday";
                        } else {
                            return dateObj.toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            });
                        }
                    }

                    // Function to load project tasks
                    function loadProjectTasks(projectId) {
                        const taskModal = new bootstrap.Modal(
                            document.getElementById("taskModal")
                        );
                        const taskListContainer =
                            document.getElementById("taskListContainer");

                        taskListContainer.innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        `;

                        taskModal.show();

                        $.ajax({
                            url: appUrl + "/projects/" + projectId + "/tasks",
                            type: "GET",
                            dataType: "json",
                            success: function (response) {
                                if (response.data && response.data.length > 0) {
                                    let html = "";
                                    response.data.forEach((task, index) => {
                                        const taskImage = task.image
                                            ? appUrl +
                                              "/file/task/" +
                                              task.image
                                            : appUrl +
                                              "/asset/img/profile_picture/default.png";

                                        const createdDate = formatTaskDate(
                                            task.created_at
                                        );

                                        // Get PIC image
                                        let picImage =
                                            appUrl +
                                            "/asset/img/profile_picture/default.png";
                                        if (task.pic && task.pic.user_photo) {
                                            if (
                                                task.pic.user_photo.startsWith(
                                                    "http"
                                                )
                                            ) {
                                                picImage = task.pic.user_photo;
                                            } else if (
                                                task.pic.user_photo.startsWith(
                                                    "/"
                                                )
                                            ) {
                                                picImage =
                                                    appUrl +
                                                    task.pic.user_photo;
                                            } else {
                                                picImage =
                                                    appUrl +
                                                    "/file/profile_picture/" +
                                                    task.pic.user_photo;
                                            }
                                        }

                                        // Get status badge class and text
                                        let statusClass = "";
                                        let statusText = "";

                                        switch (task.status) {
                                            case "new_request":
                                            case "new request":
                                                statusClass =
                                                    "status-badge status-new-request";
                                                statusText = "New Request";
                                                break;
                                            case "in_progress":
                                            case "in progress":
                                                statusClass =
                                                    "status-badge status-in-progress";
                                                statusText = "In Progress";
                                                break;
                                            case "completed":
                                                statusClass =
                                                    "status-badge status-completed";
                                                statusText = "Completed";
                                                break;
                                            case "rejected":
                                                statusClass =
                                                    "status-badge status-rejected";
                                                statusText = "Rejected";
                                                break;
                                            default:
                                                statusClass = "status-badge";
                                                statusText = task.status;
                                        }

                                        // Build combined PIC and Executors HTML
                                        let combinedImagesHtml = "";
                                        let allPeople = [];

                                        // Helper function to get correct image URL
                                        function getImageUrl(userPhoto) {
                                            if (!userPhoto) {
                                                return (
                                                    appUrl +
                                                    "/asset/img/profile_picture/default.png"
                                                );
                                            }

                                            if (userPhoto.startsWith("http")) {
                                                return userPhoto;
                                            }

                                            // Handle different path formats
                                            if (
                                                userPhoto.startsWith(
                                                    "/file/photo/"
                                                )
                                            ) {
                                                return appUrl + userPhoto;
                                            } else if (
                                                userPhoto.startsWith(
                                                    "/file/profile_picture/"
                                                )
                                            ) {
                                                return appUrl + userPhoto;
                                            } else if (
                                                userPhoto.startsWith(
                                                    "file/photo/"
                                                )
                                            ) {
                                                return appUrl + "/" + userPhoto;
                                            } else if (
                                                userPhoto.startsWith(
                                                    "file/profile_picture/"
                                                )
                                            ) {
                                                return appUrl + "/" + userPhoto;
                                            } else if (
                                                userPhoto.startsWith("/")
                                            ) {
                                                return appUrl + userPhoto;
                                            } else {
                                                return (
                                                    appUrl +
                                                    "/file/profile_picture/" +
                                                    userPhoto
                                                );
                                            }
                                        }

                                        // Add PIC first
                                        if (task.pic) {
                                            let picImage = getImageUrl(
                                                task.pic.user_photo
                                            );
                                            allPeople.push({
                                                id: task.pic.id,
                                                image: picImage,
                                                name:
                                                    task.pic.name || "Unknown",
                                                title: "PIC",
                                            });
                                        }

                                        // Add executors, excluding PIC duplicates
                                        if (
                                            task.executors &&
                                            task.executors.length > 0
                                        ) {
                                            task.executors.forEach(
                                                (executor) => {
                                                    if (
                                                        !allPeople.some(
                                                            (p) =>
                                                                p.id ===
                                                                executor.id
                                                        )
                                                    ) {
                                                        let executorImage =
                                                            getImageUrl(
                                                                executor.user_photo
                                                            );
                                                        allPeople.push({
                                                            id: executor.id,
                                                            image: executorImage,
                                                            name:
                                                                executor.name ||
                                                                "Unknown",
                                                            title: "Executor",
                                                        });
                                                    }
                                                }
                                            );
                                        }

                                        // Build combined images HTML
                                        combinedImagesHtml = allPeople
                                            .map((person, index) => {
                                                const overlapClass =
                                                    index === 0
                                                        ? ""
                                                        : "executor-image-overlap";
                                                const zIndexStyle = `style="z-index: ${
                                                    allPeople.length - index
                                                };"`;
                                                return `<img src="${person.image}" alt="${person.name}" class="pic-executor-image ${overlapClass}" data-bs-toggle="tooltip" data-bs-placement="bottom" title="${person.name} (${person.title})" ${zIndexStyle}>`;
                                            })
                                            .join("");

                                        // Initialize Bootstrap tooltips after images are added to DOM
                                        setTimeout(() => {
                                            var tooltipTriggerList =
                                                [].slice.call(
                                                    document.querySelectorAll(
                                                        '[data-bs-toggle="tooltip"]'
                                                    )
                                                );
                                            tooltipTriggerList.map(function (
                                                tooltipTriggerEl
                                            ) {
                                                return new bootstrap.Tooltip(
                                                    tooltipTriggerEl
                                                );
                                            });
                                        }, 100);

                                        html += `
                            <div class="task-item d-flex align-items-start mb-3 pb-3 border-bottom">
                                <img src="${taskImage}" alt="${task.title}" class="me-3" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px;">
                                <div class="flex-grow-1">
                                    <div class="d-flex justify-content-between align-items-start">
                                        <div class="fw-bold">${task.title}</div>
                                        <span class="${statusClass}">${statusText}</span>
                                    </div>
                                    <div class="text-muted small mb-2">${createdDate}</div>
                                    <div class="d-flex align-items-center">
                                        <div class="d-flex align-items-center">
                                            <div class="d-flex align-items-center pic-executor-container">
                                                ${combinedImagesHtml}
                                            </div>

                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                                    });
                                    taskListContainer.innerHTML = html;
                                } else {
                                    taskListContainer.innerHTML =
                                        '<div class="text-center py-4 text-muted">No tasks found for this project.</div>';
                                }
                            },
                            error: function () {
                                taskListContainer.innerHTML =
                                    '<div class="text-center py-4 text-danger">Failed to load tasks. Please try again.</div>';
                            },
                        });
                    }

                    // Reset footer button text and remove submit handler when modal is closed
                    const feedbackModalEl = document.getElementById(
                        "projectFeedbackModal"
                    );
                    feedbackModalEl.addEventListener(
                        "hidden.bs.modal",
                        function () {
                            // Remove any click event listeners by cloning the button
                            const newButton = addFeedbackButton.cloneNode(true);
                            addFeedbackButton.parentNode.replaceChild(
                                newButton,
                                addFeedbackButton
                            );
                        }
                    );

                    // Reset button text to "Add Feedback" when loading feedback list
                    feedbackModalEl.addEventListener(
                        "shown.bs.modal",
                        function () {}
                    );

                    function resetAddFeedbackButton() {
                        const addFeedbackButton =
                            document.getElementById("addFeedbackButton");
                        addFeedbackButton.textContent = "Add Feedback";

                        // Clone tombol untuk menghapus semua event listener sebelumnya
                        const newButton = addFeedbackButton.cloneNode(true);
                        addFeedbackButton.parentNode.replaceChild(
                            newButton,
                            addFeedbackButton
                        );

                        // Tambahkan event listener untuk menampilkan form
                        newButton.addEventListener("click", function () {
                            const projectId =
                                projectFeedbackModalEl.getAttribute(
                                    "data-project-id"
                                );
                            if (projectId) {
                                showAddFeedbackForm(projectId);
                            }
                        });
                    }

                    // Inisialisasi event listener untuk tombol Add Feedback saat modal muncul
                    feedbackModalEl.addEventListener(
                        "shown.bs.modal",
                        function () {
                            resetAddFeedbackButton();
                        }
                    );

                    // Update badge counts for all project cards after rendering - optimized for speed
                    setTimeout(() => {
                        // Batch update all badges in parallel for faster performance
                        const updatePromises = projects.map(project => {
                            return new Promise((resolve) => {
                                if (typeof window.updateProjectBadges === 'function') {
                                    window.updateProjectBadges(project.id);
                                }
                                resolve();
                            });
                        });

                        Promise.all(updatePromises).then(() => {
                            console.log('All project badges updated successfully');
                        });
                    }, 50); // Further reduced delay for instant update
                }
                else {
                    // no projects - ensure chart shows zero state
                    updateProjectChartFromData([]);
                }
            },
            error: function () {
                console.error("Failed to load project card data.");
            },
        });
    }

    // Load departments dynamically
    function loadDepartments(callback, targetSelect = departmentSelect) {
        $.ajax({
            url: appUrl + "/department/index",
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
                targetSelect.innerHTML = options;
                if (typeof callback === "function") callback();
            },
            error: function () {
                alert("Failed to load departments.");
                if (typeof callback === "function") callback();
            },
        });
    }

    // Load divisions based on selected department
    function loadDivisions(
        departmentId,
        callback,
        targetSelect = divisionSelect
    ) {
        targetSelect.innerHTML =
            '<option value="" disabled selected>Loading...</option>';
        $.ajax({
            url: appUrl + "/division/index",
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
                targetSelect.innerHTML = options;
                targetSelect.disabled = false; // Ensure select is enabled
                targetSelect.style.display = "block"; // Ensure visible
                if (typeof callback === "function") callback();
            },
            error: function () {
                alert("Failed to load divisions.");
                if (typeof callback === "function") callback();
            },
        });
    }

    // Load projects for "part_of_project" select
let allProjectsCache = [];

// Load semua project dari API
function loadProjects() {
    $.ajax({
        url: appUrl + "/project/index",
        type: "GET",
        dataType: "json",
        success: function (data) {
            allProjectsCache = data.data || [];
            renderProjects(allProjectsCache);
        },
        error: function () {
            console.error("Failed to load projects");
        }
    });
}

function initProjectFilter() {
    const searchInput = document.getElementById("search_filter");
    if (!searchInput) return;

    searchInput.addEventListener("keyup", function () {
        const query = this.value.toLowerCase().trim();

        // Ambil semua card project yang udah ada di container
        const cards = document.querySelectorAll("#all-cards-container .card");

        cards.forEach(card => {
            const text = card.innerText.toLowerCase();
            if (text.includes(query)) {
                card.style.display = "";  // tampil
            } else {
                card.style.display = "none"; // sembunyi
            }
        });
    });
}

// init pas ready
$(document).ready(function () {
    initProjectFilter();
});

    // New implementation for co-author input with checkbox multi-select and search
    function setupCoAuthorInput() {
        const input = document.getElementById("co_author_input");
        const dropdown = document.getElementById("co_author_dropdown");
        const selectedContainer = document.getElementById(
            "selected_co_authors"
        );
        const hiddenInput = document.getElementById("co_author");

        let employees = [];
        let filteredEmployees = [];
        let selectedEmployees = [];

        // Fetch employees from API with optional search query
        function fetchEmployees(query = "") {
            // Get current logged-in employee ID from modal data attribute
            const currentEmployeeId =
                document
                    .getElementById("projectFeedbackModal")
                    ?.getAttribute("data-employee-id") || "";

            $.ajax({
                url: appUrl + "/employee/index",
                type: "GET",
                data: { query: query, exclude_employee_id: currentEmployeeId },
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

        // Render dropdown list with checkboxes
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

                    // Gunakan default foto jika tidak ada user_photo
                    let photoUrl;
                    if (!emp.user_photo) {
                        photoUrl =
                            appUrl + "/asset/img/profile_picture/default.png";
                    } else if (emp.user_photo.startsWith("http")) {
                        photoUrl = emp.user_photo;
                    } else if (emp.user_photo.startsWith("/")) {
                        photoUrl = appUrl + emp.user_photo;
                    } else if (emp.user_photo.includes("/")) {
                        photoUrl = appUrl + "/" + emp.user_photo;
                    } else {
                        photoUrl =
                            appUrl + "/file/profile_picture/" + emp.user_photo;
                    }

                    return `
            <label class="dropdown-item d-flex align-items-center justify-content-between" style="cursor: pointer;">
                <div class="d-flex align-items-center">
                    <img src="${photoUrl}" alt="${
                        emp.name
                    }" class="rounded-circle me-2" style="width: 30px; height: 30px; object-fit: cover;">
                    <span>${emp.name}</span>
                </div>
                <input type="checkbox" class="co-author-checkbox" data-id="${
                    emp.id
                }" data-name="${emp.name}" ${isChecked ? "checked" : ""}>
            </label>
        `;
                })
                .join("");

            dropdown.innerHTML = html;
            dropdown.style.display = "block";

            dropdown
                .querySelectorAll(".co-author-checkbox")
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

        // Render selected employees as badges with remove buttons
        function renderSelected() {
            selectedContainer.innerHTML = "";
            selectedEmployees.forEach((emp) => {
                const photoUrl =
                    emp.user_photo ||
                    appUrl + "/asset/img/profile_picture/default.png";

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
                    renderDropdown(); // Update checkboxes
                });

                badge.appendChild(img);
                badge.appendChild(nameSpan);
                badge.appendChild(removeBtn);
                selectedContainer.appendChild(badge);
            });
        }

        // Update hidden input with JSON string of selected employee IDs
        function updateHiddenInput() {
            hiddenInput.value = JSON.stringify(
                selectedEmployees.map((e) => e.id)
            );
        }

        // Filter employees based on input value
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

        // Event listeners
        input.addEventListener("input", function () {
            filterEmployees(this.value);
        });

        input.addEventListener("focus", function () {
            filterEmployees(this.value);
        });

        // Hide dropdown when clicking outside
        document.addEventListener("click", function (e) {
            if (!input.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = "none";
            }
        });

        // Initial fetch of employees
        fetchEmployees();

        // Expose clearSelectedCoAuthors function to global scope for use in modal close event
        window.clearSelectedCoAuthors = function () {
            selectedEmployees = [];
            renderSelected();
            updateHiddenInput();
            dropdown.style.display = "none";
            input.value = "";
        };
    }

    // New implementation for contributor input with checkbox multi-select and search
    function setupContributorInput() {
        const input = document.getElementById("contributor_input");
        const dropdown = document.getElementById("contributor_dropdown");
        const selectedContainer = document.getElementById(
            "selected_contributors"
        );
        const hiddenInput = document.getElementById("contributors");

        let employees = [];
        let filteredEmployees = [];
        let selectedEmployees = [];

        // Fetch employees from API with optional search query
        function fetchEmployees(query = "") {
            // Get current logged-in employee ID from modal data attribute
            const currentEmployeeId =
                document
                    .getElementById("projectFeedbackModal")
                    ?.getAttribute("data-employee-id") || "";

            $.ajax({
                url: appUrl + "/employee/index",
                type: "GET",
                data: { query: query, exclude_employee_id: currentEmployeeId },
                dataType: "json",
                success: function (data) {
                    // Exclude employees already selected as co-authors
                    const coAuthorIds = window.selectedCoAuthorIds || [];
                    employees = (data.data || []).filter(
                        (emp) => !coAuthorIds.includes(emp.id)
                    );
                    filteredEmployees = employees;
                    renderDropdown();
                },
                error: function () {
                    alert("Failed to load employees.");
                },
            });
        }

        // Render dropdown list with checkboxes
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

                    // Perbaikan aman untuk photoUrl
                    let photoUrl;
                    if (!emp.user_photo) {
                        photoUrl =
                            appUrl + "/asset/img/profile_picture/default.png";
                    } else if (emp.user_photo.startsWith("http")) {
                        photoUrl = emp.user_photo;
                    } else if (emp.user_photo.startsWith("/")) {
                        photoUrl = appUrl + emp.user_photo;
                    } else if (emp.user_photo.includes("/")) {
                        photoUrl = appUrl + "/" + emp.user_photo;
                    } else {
                        photoUrl =
                            appUrl + "/file/profile_picture/" + emp.user_photo;
                    }

                    return `
            <label class="dropdown-item d-flex align-items-center justify-content-between" style="cursor: pointer;">
                <div class="d-flex align-items-center">
                    <img src="${photoUrl}" alt="${
                        emp.name
                    }" class="rounded-circle me-2" style="width: 30px; height: 30px; object-fit: cover;">
                    <span>${emp.name}</span>
                </div>
                <input type="checkbox" class="contributor-checkbox" data-id="${
                    emp.id
                }" data-name="${emp.name}" ${isChecked ? "checked" : ""}>
            </label>
        `;
                })
                .join("");

            dropdown.innerHTML = html;
            dropdown.style.display = "block";

            // Add event listeners for checkboxes
            dropdown
                .querySelectorAll(".contributor-checkbox")
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

        // Render selected employees as badges with remove buttons
        function renderSelected() {
            selectedContainer.innerHTML = "";
            selectedEmployees.forEach((emp) => {
                const photoUrl =
                    emp.user_photo ||
                    appUrl + "/asset/img/profile_picture/default.png";

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
                    renderDropdown(); // Update checkboxes
                });

                badge.appendChild(img);
                badge.appendChild(nameSpan);
                badge.appendChild(removeBtn);
                selectedContainer.appendChild(badge);
            });
        }

        // Update hidden input with JSON string of selected employee IDs
        function updateHiddenInput() {
            hiddenInput.value = JSON.stringify(
                selectedEmployees.map((e) => e.id)
            );
        }

        // Filter employees based on input value
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

        // Event listeners
        input.addEventListener("input", function () {
            filterEmployees(this.value);
        });

        input.addEventListener("focus", function () {
            filterEmployees(this.value);
        });

        // Hide dropdown when clicking outside
        document.addEventListener("click", function (e) {
            if (!input.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = "none";
            }
        });

        // Initial fetch of employees
        fetchEmployees();

        // Expose clearSelectedContributors function to global scope for use in modal close event
        window.clearSelectedContributors = function () {
            selectedEmployees = [];
            renderSelected();
            updateHiddenInput();
            dropdown.style.display = "none";
            input.value = "";
        };
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
        document.getElementById("addModalLoader").classList.remove("d-none");
    }

    // Hide loading overlay
    function hideLoading() {
        document.getElementById("addModalLoader").classList.add("d-none");
    }

    // Show alert message below modal
    function showAlert(message, type = "success") {
        let alertContainer = document
            .querySelector("#addProjectModal")
            .parentElement.querySelector(".alert-container");
        if (!alertContainer) {
            alertContainer = document.createElement("div");
            alertContainer.className = "alert-container mt-2";
            alertContainer.style.width = "100%";
            document
                .querySelector("#addProjectModal")
                .parentElement.appendChild(alertContainer);
        }
        alertContainer.innerHTML = `
            <div class="alert alert-${type} d-flex align-items-center" role="alert">
                <svg class="bi flex-shrink-0 me-2" width="24" height="24" role="img" aria-label="Success:">
                    <use xlink:href="#check-circle-fill"/>
                </svg>
                <div>${message}</div>
            </div>
        `;
        alertContainer.style.display = "block";
        setTimeout(() => {
            alertContainer.style.display = "none";
            // No reload needed - let the individual functions handle data refresh
        }, 1500);
    }

    // Show floating alert at bottom right corner (like task page)
    function showFloatingAlert(message, type = "success") {
        const alertDiv = document.createElement("div");
        alertDiv.className = `alert alert-${type} d-flex align-items-center project-status-alert`;
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
            <svg class="bi flex-shrink-0 me-2" width="24" height="24" role="img" aria-label="${
                type.charAt(0).toUpperCase() + type.slice(1)
            }:">
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

    addProjectForm.addEventListener("submit", function (e) {
        e.preventDefault();

        if (!addProjectForm.checkValidity()) {
            e.stopPropagation();
            addProjectForm.classList.add("was-validated");
            return;
        }
        addProjectForm.classList.remove("was-validated");

        // Show loading overlay and disable submit button
        showLoading();
        const submitBtn = addProjectForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;

        const formData = new FormData(addProjectForm);

        // Append project selected reference files (if any)
        if (projectSelectedFiles && projectSelectedFiles.length) {
            projectSelectedFiles.forEach(function (f) {
                formData.append('reference_file[]', f);
            });
        }

        $.ajax({
            url: appUrl + "/project/store",
            type: "POST",
            data: formData,
            contentType: false,
            processData: false,
            headers: {
                "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
            },
            success: function (response) {
                // Show success alert
                showFloatingAlert(
                    response.message || "Project added successfully!",
                    "success"
                );

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

                    // Refresh project data without page reload
                    loadProjectCardData();
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
                const submitBtn = addProjectForm.querySelector(
                    'button[type="submit"]'
                );
                submitBtn.disabled = false;
            },
        });
    });

    // Load departments and projects on page load
    loadDepartments();
    loadProjects();
    loadProjectCardData();
    // loadEmployees(); // Removed obsolete function call
    setupCoAuthorInput();

    // Setup filter dropdown functionality
    setupFilterDropdown();

    // Add event listener to department select to load divisions on change
    departmentSelect.addEventListener("change", function () {
        const selectedDepartmentId = this.value;
        if (selectedDepartmentId) {
            loadDivisions(selectedDepartmentId);
        } else {
            divisionSelect.innerHTML =
                '<option value="" disabled selected>Select Division</option>';
            divisionSelect.disabled = true;
        }
    });

    // Global array to track selected co-author IDs for exclusion in contributor input
    window.selectedCoAuthorIds = [];

    // Wrap original setupCoAuthorInput to update global selectedCoAuthorIds and refresh contributor dropdown
    function wrappedSetupCoAuthorInput() {
        const input = document.getElementById("co_author_input");
        const dropdown = document.getElementById("co_author_dropdown");
        const selectedContainer = document.getElementById(
            "selected_co_authors"
        );
        const hiddenInput = document.getElementById("co_author");

        let employees = [];
        let filteredEmployees = [];
        let selectedEmployees = [];

        function fetchEmployees(query = "") {
            const currentEmployeeId =
                document
                    .getElementById("projectFeedbackModal")
                    ?.getAttribute("data-employee-id") || "";

            $.ajax({
                url: appUrl + "/employee/index",
                type: "GET",
                data: { query: query, exclude_employee_id: currentEmployeeId },
                dataType: "json",
                success: function (data) {
                    // Exclude employees already selected as contributors
                    const contributorIds = window.selectedContributorIds || [];
                    employees = (data.data || []).filter(
                        (emp) => !contributorIds.includes(emp.id)
                    );
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

                    // Perbaikan logika foto: aman untuk berbagai format
                    let photoUrl;
                    if (!emp.user_photo) {
                        photoUrl =
                            appUrl + "/asset/img/profile_picture/default.png";
                    } else if (emp.user_photo.startsWith("http")) {
                        photoUrl = emp.user_photo;
                    } else if (emp.user_photo.startsWith("/")) {
                        photoUrl = appUrl + emp.user_photo;
                    } else if (emp.user_photo.includes("/")) {
                        photoUrl = appUrl + "/" + emp.user_photo;
                    } else {
                        photoUrl =
                            appUrl + "/file/profile_picture/" + emp.user_photo;
                    }

                    return `
            <label class="dropdown-item d-flex align-items-center justify-content-between" style="cursor: pointer;">
                <div class="d-flex align-items-center">
                    <img src="${photoUrl}" alt="${
                        emp.name
                    }" class="rounded-circle me-2" style="width: 30px; height: 30px; object-fit: cover;">
                    <span>${emp.name}</span>
                </div>
                <input type="checkbox" class="co-author-checkbox" data-id="${
                    emp.id
                }" data-name="${emp.name}" ${isChecked ? "checked" : ""}>
            </label>
        `;
                })
                .join("");

            dropdown.innerHTML = html;
            dropdown.style.display = "block";

            dropdown
                .querySelectorAll(".co-author-checkbox")
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

                        // Update global selectedCoAuthorIds
                        window.selectedCoAuthorIds = selectedEmployees.map(
                            (e) => e.id
                        );

                        // Refresh contributor dropdown if available
                        if (window.refreshContributorDropdown) {
                            window.refreshContributorDropdown();
                        }
                    });
                });
        }

        function renderSelected() {
            selectedContainer.innerHTML = "";
            selectedEmployees.forEach((emp) => {
                // Ganti semua logika pengambilan foto dengan:
                const photoUrl =
                    emp.user_photo ||
                    appUrl + "/asset/img/profile_picture/default.png";
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
                    // Update global selectedCoAuthorIds
                    window.selectedCoAuthorIds = selectedEmployees.map(
                        (e) => e.id
                    );
                    if (window.refreshContributorDropdown) {
                        window.refreshContributorDropdown();
                    }
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

        window.clearSelectedCoAuthors = function () {
            selectedEmployees = [];
            renderSelected();
            updateHiddenInput();
            dropdown.style.display = "none";
            input.value = "";
            window.selectedCoAuthorIds = [];
            if (window.refreshContributorDropdown) {
                window.refreshContributorDropdown();
            }
        };
    }

    wrappedSetupCoAuthorInput();

    // Initialize contributor input
    setupContributorInput();

                    // Attach click handler for attach_file buttons on project cards
                    document.querySelectorAll('.project-attach-file').forEach(btn => {
                        btn.addEventListener('click', function (e) {
                            e.preventDefault();
                            e.stopPropagation();
                            const projectId = this.getAttribute('data-project-id');
                            if (!projectId) return;
                            showProjectFiles(projectId);
                        });
                    });

                    // Also add delegated handler as fallback (catches dynamically added/changed elements)
                    document.addEventListener('click', function (e) {
                        const btn = e.target.closest && e.target.closest('.project-attach-file');
                        if (!btn) return;
                        e.preventDefault();
                        e.stopPropagation();
                        const projectId = btn.getAttribute('data-project-id') || btn.dataset.projectId;
                        console.debug('project-attach-file clicked (delegated)', projectId);
                        if (projectId) window.showProjectFiles && window.showProjectFiles(projectId);
                    });

                    // Expose global showProjectFiles so delegated handlers (or other scripts) can call it
                    window.showProjectFiles = function(projectId) {
                        const modalEl = document.getElementById('projectFilesModal');
                        const listEl = document.getElementById('projectReferenceFilesList');
                        if (!modalEl || !listEl) return;

                        // loading state
                        listEl.innerHTML = `<div class="text-center py-4"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>`;

                        fetch(appUrl + '/project/' + projectId)
                            .then(r => { if (!r.ok) throw new Error('Failed to fetch project'); return r.json(); })
                            .then(resp => {
                                const data = resp.data || resp;
                                const files = Array.isArray(data.reference_files) ? data.reference_files
                                    : (Array.isArray(data.reference_file) ? data.reference_file
                                    : (data.reference_file ? [data.reference_file] : []));

                                listEl.innerHTML = '';

                                if (files && files.length > 0) {
                                    files.forEach((fileName) => {
                                        const link = document.createElement('a');
                                        link.href = appUrl + '/file/project/' + fileName;
                                        link.target = '_blank';
                                        link.className = 'd-block text-decoration-none mb-1';
                                        link.innerHTML = `<span class="material-symbols-outlined me-1" style="font-size: 16px; vertical-align: middle;">description</span> ${fileName}`;
                                        listEl.appendChild(link);
                                    });
                                } else {
                                    listEl.textContent = 'No reference files available.';
                                }

                                const modal = new bootstrap.Modal(modalEl);
                                modal.show();
                            })
                            .catch(err => {
                                listEl.innerHTML = '<div class="alert alert-danger">Failed to load reference files.</div>';
                                console.error('showProjectFiles error', err);
                                const modal = new bootstrap.Modal(modalEl);
                                modal.show();
                            });
                    };

                    // Populate feedback and file counts for each card
                    // Retry a few times if cards are not yet present (cards are loaded via AJAX)
                    (function populateCounts(retry = 0) {
                        const MAX_RETRIES = 12; // total ~12 * 250ms = 3s max wait
                        const RETRY_DELAY = 250;

                        const containerEl = document.getElementById('all-cards-container');
                        if (!containerEl) {
                            if (retry < MAX_RETRIES) {
                                return setTimeout(() => populateCounts(retry + 1), RETRY_DELAY);
                            }
                            return; // give up
                        }

                        const cards = containerEl.querySelectorAll('[data-project-id]');
                        if (!cards || cards.length === 0) {
                            if (retry < MAX_RETRIES) {
                                return setTimeout(() => populateCounts(retry + 1), RETRY_DELAY);
                            }
                            return;
                        }

                        cards.forEach(card => {
                            const pid = card.getAttribute('data-project-id');
                            // find badges
                            const fbBadge = card.querySelector('.project-feedback-count');
                            const fileBadge = card.querySelector('.project-file-count');

                            // request feedback count (robust parsing)
                            fetch(appUrl + '/project-feedbacks/' + pid)
                                .then(r => r.ok ? r.json() : Promise.reject(r))
                                .then(resp => {
                                    let count = 0;
                                    // resp can be array, { data: [...] }, { total: n }, or single object
                                    if (Array.isArray(resp)) {
                                        count = resp.length;
                                    } else if (Array.isArray(resp.data)) {
                                        count = resp.data.length;
                                    } else if (typeof resp.total === 'number') {
                                        count = resp.total;
                                    } else if (resp.meta && typeof resp.meta.total === 'number') {
                                        count = resp.meta.total;
                                    } else if (resp.data && typeof resp.data === 'object') {
                                        // single item
                                        count = 1;
                                    }
                                    if (fbBadge) fbBadge.textContent = count;
                                })
                                .catch(err => {
                                    if (fbBadge) fbBadge.textContent = '0';
                                });

                            // request project detail to read reference_file
                            fetch(appUrl + '/project/' + pid)
                                .then(r => r.ok ? r.json() : Promise.reject(r))
                                .then(resp => {
                                    const data = resp.data || resp;
                                    let count = 0;
                                    if (data.reference_file) {
                                        if (Array.isArray(data.reference_file)) count = data.reference_file.length;
                                        else if (typeof data.reference_file === 'string' && data.reference_file.trim() !== '') count = 1;
                                    }
                                    if (fileBadge) fileBadge.textContent = count;
                                })
                                .catch(err => {
                                    if (fileBadge) fileBadge.textContent = '0';
                                });
                        });
                    })(0);

                    // Expose helper to update badges for a single project id (used after edit)
                    window.updateProjectBadges = function(pid, attempt = 0) {
                        try {
                            const containerEl = document.getElementById('all-cards-container');
                            if (!containerEl) return;
                            const card = containerEl.querySelector('[data-project-id="' + pid + '"]');
                            if (!card) {
                                // retry a few times until card is rendered
                                if (attempt < 5) {
                                    return setTimeout(() => window.updateProjectBadges(pid, attempt + 1), 50);
                                }
                                return;
                            }

                            const fbBadge = card.querySelector('.project-feedback-count');
                            const fileBadge = card.querySelector('.project-file-count');

                            // Parallel fetch for faster loading
                            const feedbackPromise = fetch(appUrl + '/project-feedbacks/' + pid)
                                .then(r => r.ok ? r.json() : Promise.reject(r))
                                .then(resp => {
                                    let count = 0;
                                    if (Array.isArray(resp)) count = resp.length;
                                    else if (Array.isArray(resp.data)) count = resp.data.length;
                                    else if (typeof resp.total === 'number') count = resp.total;
                                    else if (resp.meta && typeof resp.meta.total === 'number') count = resp.meta.total;
                                    else if (resp.data && typeof resp.data === 'object') count = 1;
                                    if (fbBadge) fbBadge.textContent = count;
                                })
                                .catch(() => { if (fbBadge) fbBadge.textContent = '0'; });

                            const filePromise = fetch(appUrl + '/project/' + pid)
                                .then(r => r.ok ? r.json() : Promise.reject(r))
                                .then(resp => {
                                    const data = resp.data || resp;
                                    let files = [];
                                    if (Array.isArray(data.reference_file)) files = data.reference_file;
                                    else if (Array.isArray(data.reference_files)) files = data.reference_files;
                                    else if (typeof data.reference_file === 'string' && data.reference_file.trim() !== '') files = [data.reference_file];
                                    if (fileBadge) fileBadge.textContent = files.length;
                                })
                                .catch(() => { if (fileBadge) fileBadge.textContent = '0'; });

                            // Wait for both requests to complete
                            Promise.all([feedbackPromise, filePromise]).then(() => {
                                // Both badges updated
                            });
                        } catch (e) {}
                    };

                    // Refresh only one project card in-place using fresh data
                    window.refreshSingleProjectCard = function(pid, attempt = 0) {
                        try {
                            const containerEl = document.getElementById('all-cards-container');
                            if (!containerEl) return;
                            const col = containerEl.querySelector('[data-project-id="' + pid + '"]');
                            if (!col) {
                                if (attempt < 10) return setTimeout(() => window.refreshSingleProjectCard(pid, attempt + 1), 200);
                                return;
                            }

                            // Keep current badge counts while refreshing content to avoid flashing 0
                            const currentFb = col.querySelector('.project-feedback-count')?.textContent || '';
                            const currentFiles = col.querySelector('.project-file-count')?.textContent || '';

                            fetch(appUrl + '/project/' + pid)
                                .then(r => r.ok ? r.json() : Promise.reject(r))
                                .then(resp => {
                                    const p = resp.data || resp;

                                    // Rebuild only the inner content of the card body with latest fields
                                    let imageUrl = p.image ? (appUrl + '/file/project/' + p.image)
                                                           : (appUrl + '/asset/img/background/add-image.png');

                                    const newHeader = `
                                        <div class="d-flex justify-content-between align-items-start mb-2">
                                            <div class="d-flex align-items-center">
                                                <img src="${imageUrl}" class="rounded-circle me-2" style="width:34px;height:34px;">
                                                <h6 class="mb-0" style="font-size:14px; font-weight:600;">${p.title || ''}</h6>
                                            </div>
                                            <div class="dropdown-icon-container">
                                                <button class="btn btn-sm border-0 d-flex align-items-center justify-content-center dropdown-icon"
                                                        style="background:#E8E9F2; border-radius:50%; width:32px; height:32px;">
                                                    <span class="material-symbols-outlined" style="font-size:16px; color:#828282;" tabindex="0">more_vert</span>
                                                </button>
                                                <div class="dropdown-menu d-none">
                                                    <div class="dropdown-item">Detail</div>
                                                    <div class="dropdown-item">Task</div>
                                                    <div class="dropdown-item">Feedback</div>
                                                    <div class="dropdown-item">Edit</div>
                                                    <div class="dropdown-item text-danger delete-project">Delete</div>
                                                </div>
                                            </div>
                                        </div>`;

                                    const newDesc = `<p class="mb-2 small text-muted" style="font-size:12px; line-height:1.4;">${(p.description || 'No Description')}</p>`;

                                    const newFooter = `
                                        <div class="d-flex justify-content-between align-items-center mt-2">
                                            <div class="collaborators-image d-flex align-items-center">${renderCollaborators(p)}</div>
                                            <div class="d-flex">
                                                <button class="btn btn-sm p-0 border-0 bg-transparent me-2 comment-icon d-flex align-items-center" title="Comment" data-project-id="${p.id}">
                                                    <span class="material-symbols-outlined" style="font-size:16px; color:#828282;">mode_comment</span>
                                                    <span class="project-feedback-count ms-1" data-project-id="${p.id}" style="font-size:12px; color:#454545;">${currentFb}</span>
                                                </button>
                                                <button class="btn btn-sm p-0 border-0 bg-transparent project-attach-file d-flex align-items-center" title="Attach File" data-project-id="${p.id}">
                                                    <span class="material-symbols-outlined" style="font-size:16px; color:#828282;">attach_file</span>
                                                    <span class="project-file-count ms-1" data-project-id="${p.id}" style="font-size:12px; color:#454545;">${currentFiles}</span>
                                                </button>
                                            </div>
                                        </div>`;

                                    const cardEl = col.querySelector('.project-card');
                                    if (cardEl) {
                                        // Replace sections inside card
                                        const oldDropdown = cardEl.querySelector('.dropdown-menu');
                                    }

                                    // Re-bind dropdown and attach-file handlers and tooltips
                                    try {
                                        cardEl.querySelectorAll('.dropdown-icon').forEach(icon => {
                                            icon.addEventListener('click', function (e) {
                                                e.stopPropagation();
                                                const dropdownMenu = this.nextElementSibling;
                                                const isVisible = !dropdownMenu.classList.contains('d-none');
                                                document.querySelectorAll('.dropdown-menu').forEach(menu => menu.classList.add('d-none'));
                                                if (!isVisible) dropdownMenu.classList.remove('d-none');
                                            });
                                        });
                                        const tooltipTriggerList = cardEl.querySelectorAll('[data-bs-toggle="tooltip"]');
                                        tooltipTriggerList.forEach(function (el) { try { new bootstrap.Tooltip(el, { placement: 'bottom' }); } catch (e) {} });
                                    } catch (e) {}

                                    // Finally, update badges with live values
                                    if (typeof window.updateProjectBadges === 'function') {
                                        window.updateProjectBadges(pid);
                                    }
                                })
                                .catch(() => {
                                    // As a fallback, update badges only
                                    if (typeof window.updateProjectBadges === 'function') {
                                        window.updateProjectBadges(pid);
                                    }
                                });
                        } catch (e) {}
                    };

    // Function to refresh contributor dropdown when co-author selection changes
    window.refreshContributorDropdown = function () {
        // Clear contributor input and selected contributors
        const contributorInput = document.getElementById("contributor_input");
        const contributorDropdown = document.getElementById(
            "contributor_dropdown"
        );
        const selectedContributorsContainer = document.getElementById(
            "selected_contributors"
        );
        const hiddenContributorsInput = document.getElementById("contributors");

        if (
            !contributorInput ||
            !contributorDropdown ||
            !selectedContributorsContainer ||
            !hiddenContributorsInput
        ) {
            return;
        }

        // Clear current selections
        contributorInput.value = "";
        contributorDropdown.style.display = "none";
        selectedContributorsContainer.innerHTML = "";
        hiddenContributorsInput.value = "";

        // Re-initialize contributor input to fetch updated employee list excluding current co-authors
        setupContributorInput();
    };

    // Add global array to track selected contributors
    window.selectedContributorIds = [];

    // Wrap original setupContributorInput to update global selectedContributorIds and refresh co-author dropdown
    function wrappedSetupContributorInput() {
        const input = document.getElementById("contributor_input");
        const dropdown = document.getElementById("contributor_dropdown");
        const selectedContainer = document.getElementById(
            "selected_contributors"
        );
        const hiddenInput = document.getElementById("contributors");

        let employees = [];
        let filteredEmployees = [];
        let selectedEmployees = [];

        // Fetch employees from API with optional search query
        function fetchEmployees(query = "") {
            // Get current logged-in employee ID from modal data attribute
            const currentEmployeeId =
                document
                    .getElementById("projectFeedbackModal")
                    ?.getAttribute("data-employee-id") || "";

            $.ajax({
                url: appUrl + "/employee/index",
                type: "GET",
                data: { query: query, exclude_employee_id: currentEmployeeId },
                dataType: "json",
                success: function (data) {
                    // Exclude employees already selected as co-authors
                    const coAuthorIds = window.selectedCoAuthorIds || [];
                    employees = (data.data || []).filter(
                        (emp) => !coAuthorIds.includes(emp.id)
                    );
                    filteredEmployees = employees;
                    renderDropdown();
                },
                error: function () {
                    alert("Failed to load employees.");
                },
            });
        }

        // Render dropdown list with checkboxes
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

                    // Penanganan URL foto secara aman
                    let photoUrl;
                    if (!emp.user_photo) {
                        photoUrl =
                            appUrl + "/asset/img/profile_picture/default.png";
                    } else if (emp.user_photo.startsWith("http")) {
                        photoUrl = emp.user_photo;
                    } else if (emp.user_photo.startsWith("/")) {
                        photoUrl = appUrl + emp.user_photo;
                    } else if (emp.user_photo.includes("/")) {
                        photoUrl = appUrl + "/" + emp.user_photo;
                    } else {
                        photoUrl =
                            appUrl + "/file/profile_picture/" + emp.user_photo;
                    }

                    return `
            <label class="dropdown-item d-flex align-items-center justify-content-between" style="cursor: pointer;">
                <div class="d-flex align-items-center">
                    <img src="${photoUrl}" alt="${
                        emp.name
                    }" class="rounded-circle me-2" style="width: 30px; height: 30px; object-fit: cover;">
                    <span>${emp.name}</span>
                </div>
                <input type="checkbox" class="contributor-checkbox" data-id="${
                    emp.id
                }" data-name="${emp.name}" ${isChecked ? "checked" : ""}>
            </label>
        `;
                })
                .join("");

            dropdown.innerHTML = html;
            dropdown.style.display = "block";

            // Event listener untuk checkbox
            dropdown
                .querySelectorAll(".contributor-checkbox")
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

                        // Update global selectedContributorIds
                        window.selectedContributorIds = selectedEmployees.map(
                            (e) => e.id
                        );

                        // Refresh co-author dropdown jika tersedia
                        if (window.refreshCoAuthorDropdown) {
                            window.refreshCoAuthorDropdown();
                        }
                    });
                });
        }

        // Render selected employees as badges with remove buttons
        function renderSelected() {
            selectedContainer.innerHTML = "";
            selectedEmployees.forEach((emp) => {
                const photoUrl =
                    emp.user_photo ||
                    appUrl + "/asset/img/profile_picture/default.png";

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
                    // Update global selectedContributorIds
                    window.selectedContributorIds = selectedEmployees.map(
                        (e) => e.id
                    );
                    if (window.refreshCoAuthorDropdown) {
                        window.refreshCoAuthorDropdown();
                    }
                });

                badge.appendChild(img);
                badge.appendChild(nameSpan);
                badge.appendChild(removeBtn);
                selectedContainer.appendChild(badge);
            });
        }

        // Update hidden input with JSON string of selected employee IDs
        function updateHiddenInput() {
            hiddenInput.value = JSON.stringify(
                selectedEmployees.map((e) => e.id)
            );
        }

        // Filter employees based on input value
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

        // Event listeners
        input.addEventListener("input", function () {
            filterEmployees(this.value);
        });

        input.addEventListener("focus", function () {
            filterEmployees(this.value);
        });

        // Hide dropdown when clicking outside
        document.addEventListener("click", function (e) {
            if (!input.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = "none";
            }
        });

        // Initial fetch of employees
        fetchEmployees();

        // Expose clearSelectedContributors function to global scope for use in modal close event
        window.clearSelectedContributors = function () {
            selectedEmployees = [];
            renderSelected();
            updateHiddenInput();
            dropdown.style.display = "none";
            input.value = "";
            window.selectedContributorIds = [];
            if (window.refreshCoAuthorDropdown) {
                window.refreshCoAuthorDropdown();
            }
        };
    }

    wrappedSetupContributorInput();

    // Function to refresh co-author dropdown when contributor selection changes
    window.refreshCoAuthorDropdown = function () {
        // Clear co-author input and selected co-authors
        const coAuthorInput = document.getElementById("co_author_input");
        const coAuthorDropdown = document.getElementById("co_author_dropdown");
        const selectedCoAuthorsContainer = document.getElementById(
            "selected_co_authors"
        );
        const hiddenCoAuthorsInput = document.getElementById("co_author");

        if (
            !coAuthorInput ||
            !coAuthorDropdown ||
            !selectedCoAuthorsContainer ||
            !hiddenCoAuthorsInput
        ) {
            return;
        }

        // Clear current selections
        coAuthorInput.value = "";
        coAuthorDropdown.style.display = "none";
        selectedCoAuthorsContainer.innerHTML = "";
        hiddenCoAuthorsInput.value = "";

        // Re-initialize co-author input to fetch updated employee list excluding current contributors
        wrappedSetupCoAuthorInput();
    };

    // Setup filter dropdown functionality
    function setupFilterDropdown() {
        const openFilterBtn = document.getElementById("openProjectFilterBtn");
        const filterDropdown = document.getElementById("projectFilterDropdown");
        const applyFilterBtn = document.getElementById("applyProjectFilterBtn");
        const resetFilterBtn = document.getElementById("resetProjectFilterBtn");
        const filterStatus = document.getElementById("filterProjectStatus");

        if (!openFilterBtn || !filterDropdown) return;

        // Toggle dropdown visibility
        openFilterBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            const isVisible = filterDropdown.style.display === "block";
            filterDropdown.style.display = isVisible ? "none" : "block";
        });

        // Close dropdown when clicking outside
        document.addEventListener("click", function (e) {
            if (
                !openFilterBtn.contains(e.target) &&
                !filterDropdown.contains(e.target)
            ) {
                filterDropdown.style.display = "none";
            }
        });

        // Handle apply filter button
        if (applyFilterBtn) {
            applyFilterBtn.addEventListener("click", function () {
                const selectedStatus = filterStatus ? filterStatus.value : "";
                console.log("Filter applied with status:", selectedStatus);
                filterDropdown.style.display = "none";

                // Map UI filter values to backend filter parameters
                let filterParam = null;
                if (selectedStatus === "") {
                    filterParam = null; // no filter
                } else if (selectedStatus === "ongoing") {
                    filterParam = "not_started"; // map "Not Started" to backend filter
                } else if (selectedStatus === "completed") {
                    filterParam = "completed"; // map "Completed" to backend filter
                } else if (selectedStatus === "pending") {
                    filterParam = "in_progress"; // map "In Progress" to backend filter
                }

                // Reload project cards with filter parameter
                loadProjectCardData(filterParam);
            });
        }

        // Handle reset filter button
        if (resetFilterBtn) {
            resetFilterBtn.addEventListener("click", function () {
                // Reset the filter dropdown to default
                if (filterStatus) {
                    filterStatus.value = "";
                }

                // Close the dropdown
                filterDropdown.style.display = "none";

                // Reload project cards without filter (show all)
                loadProjectCardData(null);

                // Provide visual feedback
            });
        }

        // Handle dropdown item clicks
        filterDropdown.addEventListener("click", function (e) {
            e.stopPropagation();
        });
    }

    // Clear form and reset image preview when modal is closed
    var addProjectModalEl = document.getElementById("addProjectModal");
    addProjectModalEl.addEventListener("hidden.bs.modal", function () {
        // Reset the form
        addProjectForm.reset();

        // Reset image preview
        imageLabel.style.backgroundImage =
            "url('" + appUrl + "/asset/img/background/add-image.png')";
        imageLabel.style.backgroundPosition = "center center";
        imageLabel.style.backgroundRepeat = "no-repeat";
        imageLabel.style.backgroundSize = "50%";
        imageLabel.classList.remove("has-image");
        imageLabel.style.opacity = "0.5";
        imageClearBtn.classList.add("d-none");

        // Reload departments, divisions, projects to reset selects
        loadDepartments();
        divisionSelect.innerHTML =
            '<option value="" disabled selected>Select Division</option>';
        loadProjects();

        // Clear selected reference files and preview
        try {
            if (typeof projectSelectedFiles !== 'undefined') {
                projectSelectedFiles = [];
            }
            const preview = document.getElementById("reference_files_preview");
            if (preview) preview.innerHTML = "";
            const input = document.getElementById("reference_file");
            if (input) input.value = "";
        } catch (e) {}

        if (window.clearSelectedCoAuthors) {
            window.clearSelectedCoAuthors();
        }
    });
});

// Doughnut Chart Porject
document.addEventListener("DOMContentLoaded", function () {
    const createDoughnut = (el, data = []) => {
        let chartData, colors, labels;

        if (!data || data.length === 0 || data.every((v) => v === 0)) {
            chartData = [1];
            colors = ["#E8E9F2"];
            labels = ["No Data"];
        } else {
            chartData = data;
            // expect slices: Not Started, Complete, On Progress, Late
            colors = ["#E8E9F2", "#4fc97a", "#5a9be6", "#ff6b6b"];
            labels = ["Not Started", "Complete", "On Progress", "Late"];
        }

        return new Chart(el, {
            type: "doughnut",
            data: {
                labels: labels,
                datasets: [
                    {
                        data: chartData,
                        backgroundColor: colors,
                        borderWidth: 0,
                    },
                ],
            },
            options: {
                cutout: "60%",
                plugins: {
                    legend: { display: false },
                },
            },
        });
    };

    const ctx = document.getElementById("projectChart");
    let projectChartInstance = null;
    if (ctx) {
        const dataset = [];
        projectChartInstance = createDoughnut(ctx, dataset);
    }

    // update chart and label counts based on project array
    function updateProjectChartFromData(projects) {
        // projects is array of project objects with task_counts (project-level buckets)
        projects = projects || [];

        let totalProjects = projects.length;
        let complete = 0;
        let onProgress = 0;
        let late = 0;
        let notStarted = 0;

        projects.forEach((p) => {
            const tc = p.task_counts || {};
            const tTotal = tc.total || 0;
            const tCompleted = tc.completed || 0;
            const tInProgress = tc.in_progress || 0; // already includes rejected
            const tLate = tc.late || 0;

            if (tLate > 0) {
                late += 1;
            } else if (tTotal > 0 && tCompleted === tTotal) {
                complete += 1;
            } else if (tInProgress > 0) {
                onProgress += 1;
            } else {
                notStarted += 1;
            }
        });

        // Chart slices: Not Started, Complete, On Progress, Late
        const chartData = [notStarted, complete, onProgress, late];

        // update chart instance: set labels and colors accordingly
        try {
            if (projectChartInstance && projectChartInstance.data) {
                if (totalProjects === 0) {
                    // no projects at all -> show No Data
                    projectChartInstance.data.labels = ["No Data"];
                    projectChartInstance.data.datasets[0].data = [1];
                    projectChartInstance.data.datasets[0].backgroundColor = ["#E8E9F2"];
                } else {
                    projectChartInstance.data.labels = ["Not Started", "Complete", "On Progress", "Late"];
                    projectChartInstance.data.datasets[0].data = chartData;
                    projectChartInstance.data.datasets[0].backgroundColor = ["#E8E9F2", "#4fc97a", "#5a9be6", "#ff6b6b"];
                }
                projectChartInstance.update();
            } else if (ctx) {
                // create chart if missing
                projectChartInstance = createDoughnut(ctx, totalProjects === 0 ? [] : chartData);
            }
        } catch (e) {
            console.error('chart update failed', e);
        }

        // Update label numbers in the UI (Total, Complete, On Progress, Late)
        try {
            const labelsContainer = document.querySelector('.chart-labels');
            if (labelsContainer) {
                const spans = labelsContainer.querySelectorAll('.text-center span:first-child');
                if (spans && spans.length >= 4) {
                    spans[0].textContent = totalProjects;
                    spans[1].textContent = complete;
                    spans[2].textContent = onProgress;
                    spans[3].textContent = late;
                }
            }
        } catch (e) {}
    }
    // expose updater to global scope so other code can call it safely
    try {
        window.updateProjectChartFromData = updateProjectChartFromData;
        window.getProjectChartInstance = function () { return projectChartInstance; };
    } catch (e) {
        // ignore
    }
});

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let currentWeek = 0;

const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
];

// timeline projects (will be populated from backend projects)
let timelineData = [];

// color palette cycles every 4
const TIMELINE_COLORS = ["color1", "color2", "color3", "color4"];

/**
 * Build timelineData from projects array. Expects each project to have
 * - title
 * - start_date (ISO string)
 * - due_date (ISO string)
 * - id
 * Colors will cycle every 4 projects.
 * This function stores normalized start/end indexes for the given mode (week/month) later used by renderTimeline.
 */
function buildTimelineFromProjects(projects) {
    timelineData = [];
    if (!Array.isArray(projects)) return;

    projects.forEach((p, idx) => {
        // parse dates as local (avoid timezone shifts from Date(string))
        function parseLocal(dateStr, fallback) {
            const src = (dateStr || "" ).toString().trim();
            if (!src) {
                if (fallback) return parseLocal(fallback);
                return null;
            }
            // extract YYYY-MM-DD using regex to be robust against ' ' or 'T' separators and time parts
            const m = src.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
            if (m) {
                const y = parseInt(m[1], 10);
                const mon = parseInt(m[2], 10) - 1;
                const d = parseInt(m[3], 10);
                return new Date(y, mon, d);
            }
            return new Date(src);
        }

        let start = p.start_date ? parseLocal(p.start_date) : new Date();
        let due = p.due_date ? parseLocal(p.due_date, p.start_date) : new Date(start);
        // normalize to day boundaries (start at 00:00:00, due at 23:59:59)
        if (start) start.setHours(0,0,0,0);
        if (due) due.setHours(23,59,59,999);

        timelineData.push({
            id: p.id,
            name: p.title || `Project ${p.id || idx + 1}`,
            start_date: start,
            due_date: due,
            color: TIMELINE_COLORS[idx % TIMELINE_COLORS.length],
        });
    });

    // debug: print timeline entries used for rendering
    try {
        console.debug('timelineData built:', timelineData.map(t => ({ id: t.id, name: t.name, start: t.start_date && t.start_date.toISOString(), due: t.due_date && t.due_date.toISOString(), color: t.color })));
    } catch(e) {}
}

function renderTimeline(
    targetHeaderSelector,
    targetRowsSelector,
    mode = "week",
    month = null,
    year = null,
    weekIndex = 0
) {
    const headerRow = document.querySelector(targetHeaderSelector);
    const rowsContainer = document.querySelector(targetRowsSelector);
    if (!headerRow || !rowsContainer) return;

    headerRow.innerHTML = "";
    rowsContainer.innerHTML = "";

    let totalCells,
        headerLabels = [];

    if (mode === "week") {
        headerLabels = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        totalCells = 7;
    } else {
        // month
        month = month ?? new Date().getMonth();
        year = year ?? new Date().getFullYear();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        headerLabels = Array.from({ length: daysInMonth }, (_, i) => i + 1);
        totalCells = daysInMonth;
    }

    // Render header
    headerLabels.forEach((label, idx) => {
        const th = document.createElement("th");
        th.textContent = label;

        let isSunday = false;
        if (mode === "week" && idx === 6) isSunday = true;
        if (mode === "month") {
            const date = new Date(year, month, label);
            if (date.getDay() === 0) isSunday = true;
        }

        if (isSunday) th.style.color = "red";
        headerRow.appendChild(th);
    });

    // Render rows based on timelineData date ranges
    timelineData.forEach((proj) => {
        const tr = document.createElement("tr");

        if (mode === "week") {
            // determine week start (Monday) for the given month/weekIndex
            const firstOfMonth = new Date(year, month, 1);
            const weekStartDate = new Date(firstOfMonth);
            weekStartDate.setDate(weekStartDate.getDate() + weekIndex * 7);
            // ensure weekStartDate is Monday
            while (weekStartDate.getDay() !== 1) {
                weekStartDate.setDate(weekStartDate.getDate() - 1);
            }

            for (let i = 0; i < totalCells; i++) {
                const cellDate = new Date(weekStartDate);
                cellDate.setDate(weekStartDate.getDate() + i);

                const td = document.createElement("td");
                if (cellDate.getDay() === 0) td.style.color = "red";

                // If proj covers this cellDate, add bar cell later
                tr.appendChild(td);
            }

            // Helper: difference in days using UTC to avoid timezone/DST edges
            function diffDaysUTC(a, b) {
                const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
                const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
                return Math.floor((utcA - utcB) / (1000 * 60 * 60 * 24));
            }

            // Compute start/end index (0..6) for this project within the week (may be outside 0..6)
            const rawStart = diffDaysUTC(proj.start_date, weekStartDate);
            const rawEnd = diffDaysUTC(proj.due_date, weekStartDate);
            const projStartIdx = Math.max(0, rawStart);
            const projEndIdx = Math.min(6, rawEnd);
            try { console.debug('weekStartDate', weekStartDate.toISOString(), 'proj', proj.name, 'start', proj.start_date && proj.start_date.toISOString(), 'due', proj.due_date && proj.due_date.toISOString(), 'rawStart', rawStart, 'rawEnd', rawEnd, 'projStartIdx', projStartIdx, 'projEndIdx', projEndIdx); } catch(e) {}

            // If project overlaps this week, replace cells with a colspan bar in correct position
            if (projEndIdx >= 0 && projStartIdx <= 6 && projStartIdx <= projEndIdx) {
                // remove child nodes and rebuild with bar
                while (tr.firstChild) tr.removeChild(tr.firstChild);

                // empty before
                for (let i = 0; i < projStartIdx; i++) tr.appendChild(document.createElement('td'));

                const barTd = document.createElement('td');
                barTd.colSpan = projEndIdx - projStartIdx + 1;
                const titleText = `${proj.name} (${proj.start_date.toLocaleDateString()} → ${proj.due_date.toLocaleDateString()})`;
                barTd.innerHTML = `<div class="timeline-bar ${proj.color}" title="${titleText}"><span class="circle"></span> ${proj.name}</div>`;
                tr.appendChild(barTd);

                for (let i = projEndIdx + 1; i < totalCells; i++) tr.appendChild(document.createElement('td'));
            }
        } else {
            // month mode: cells are days 1..daysInMonth
            const daysInMonth = totalCells;

            // compute overlap between project and this month
            const monthStart = new Date(year, month, 1);
            const monthEnd = new Date(year, month, daysInMonth, 23, 59, 59, 999);

            const startDate = proj.start_date < monthStart ? monthStart : proj.start_date;
            const endDate = proj.due_date > monthEnd ? monthEnd : proj.due_date;

            if (endDate >= monthStart && startDate <= monthEnd) {
                const startIdx = startDate.getDate() - 1; // 0-based
                const endIdx = endDate.getDate() - 1;

                // empty before
                for (let i = 0; i < startIdx; i++) tr.appendChild(document.createElement('td'));

                const barTd = document.createElement('td');
                barTd.colSpan = endIdx - startIdx + 1;
                const titleText = `${proj.name} (${proj.start_date.toLocaleDateString()} → ${proj.due_date.toLocaleDateString()})`;
                barTd.innerHTML = `<div class="timeline-bar ${proj.color}" title="${titleText}"><span class="circle"></span> ${proj.name}</div>`;
                tr.appendChild(barTd);

                for (let i = endIdx + 1; i < daysInMonth; i++) tr.appendChild(document.createElement('td'));
            } else {
                // no overlap -> empty row
                for (let i = 0; i < daysInMonth; i++) tr.appendChild(document.createElement('td'));
            }
        }

        rowsContainer.appendChild(tr);
    });

    if (mode === "week") {
        const title = document.getElementById("timelineTitle");
        title.textContent = `${months[month]} week ${weekIndex + 1}`;
    }
}

renderTimeline(
    "#timelineHeader",
    "#timelineRows",
    "week",
    currentMonth,
    currentYear,
    currentWeek
);

document.getElementById("prevTimeline").addEventListener("click", () => {
    if (currentWeek > 0) currentWeek--;
    else {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        currentWeek = 3;
    }
    renderTimeline(
        "#timelineHeader",
        "#timelineRows",
        "week",
        currentMonth,
        currentYear,
        currentWeek
    );
});

document.getElementById("nextTimeline").addEventListener("click", () => {
    if (currentWeek < 3) currentWeek++;
    else {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        currentWeek = 0;
    }
    renderTimeline(
        "#timelineHeader",
        "#timelineRows",
        "week",
        currentMonth,
        currentYear,
        currentWeek
    );
});

const modalTitle = document.getElementById("timelineModalTitle");
const prevBtn = document.getElementById("prevTimelineModal");
const nextBtn = document.getElementById("nextTimelineModal");
const timelineModal = document.getElementById("timelineModal");

timelineModal.addEventListener("show.bs.modal", () => {
    updateModalTimeline()
})

function updateModalTimeline() {
    modalTitle.textContent = `Timeline ${months[currentMonth]} ${currentYear}`;
    renderTimeline(
        "#timelineHeaderModal",
        "#timelineRowsModal",
        "month",
        currentMonth,
        currentYear
    );
}

prevBtn.addEventListener("click", () => {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    updateModalTimeline();
});

nextBtn.addEventListener("click", () => {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    updateModalTimeline();
});

// document.addEventListener("DOMContentLoaded", function () {
//     const searchInput = document.getElementById("search_filter");

//     searchInput.addEventListener("input", function () {
//         const query = this.value.toLowerCase();

//         const cards = document.querySelectorAll(
//             "#all-cards-container [data-project-id]"
//         );

//         cards.forEach((card) => {
//             const projectId = card.getAttribute("data-project-id");
//             const title =
//                 card.querySelector("h6")?.textContent.toLowerCase() || "";
//             const desc =
//                 card.querySelector("p")?.textContent.toLowerCase() || "";

//             const match =
//                 title.includes(query) ||
//                 desc.includes(query) ||
//                 projectId.includes(query);

//             if (match) {
//                 card.classList.remove("d-none");
//             } else {
//                 card.classList.add("d-none");
//             }
//         });
//     });
// });
