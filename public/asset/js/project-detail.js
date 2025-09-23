(function ($) {
    "use strict";

    function getMeta(name) {
        return $('meta[name="' + name + '"]').attr("content") || "";
    }

    function safeText(str) {
        return str === null || typeof str === "undefined" ? "-" : String(str);
    }

    function formatDate(dateStr) {
        if (!dateStr) return "-";
        try {
            var d = new Date(dateStr);
            if (isNaN(d.getTime())) return "-";
            var opts = { year: "numeric", month: "short", day: "2-digit" };
            return d.toLocaleDateString(undefined, opts);
        } catch (e) {
            return "-";
        }
    }

    function resolveAvatar(url) {
        if (!url) return "/asset/img/avatar.png";
        return url;
    }

    // Build 1-2 character initials from a title/name
    function buildInitials(title) {
        try {
            if (!title) return '';
            var t = String(title || '').trim();
            if (!t) return '';
            var parts = t.split(/\s+/).filter(Boolean);
            if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
            return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
        } catch (e) { return ''; }
    }

    // Deterministic color pick from text
    function getRandomColorFromText(text) {
        try {
            var colors = [
                '#6A5AE0', '#FF8A3C', '#00A881', '#D4526E', '#3E8EDE',
                '#546E7A', '#8E44AD', '#2E7D32', '#AD1457', '#EF6C00'
            ];
            var h = 0;
            for (var i = 0; i < (text || '').length; i++) {
                h = text.charCodeAt(i) + ((h << 5) - h);
            }
            return colors[Math.abs(h) % colors.length];
        } catch (e) { return '#6A5AE0'; }
    }

    // Build a simple SVG data URI with initials centered
    function buildInitialsSvg(initials, bgColor) {
        try {
            var w = 256, h = 256; // canvas size for crisp output
            var text = (initials || '').toUpperCase();
            // font size relative to canvas width for consistent scaling
            var fontSize = Math.round(w * 0.44);
            // Use viewBox so SVG scales nicely; center text with dominant-baseline & text-anchor
            var svg = '';
            svg += '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '">';
            svg += '<rect width="100%" height="100%" fill="' + (bgColor || '#6A5AE0') + '"/>';
            svg += '<text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" fill="#ffffff" font-family="Inter, Arial, Helvetica, sans-serif" font-weight="700" font-size="' + fontSize + '">' + (text || '') + '</text>';
            svg += '</svg>';
            return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
        } catch (e) {
            return '/asset/img/avatar.png';
        }
    }

    function renderAssignments(container, author, coAuthors, contributors) {
        container.empty();
        var makeEntry = function (person, roleLabel) {
            var $wrap = $("<div>").addClass(
                "d-flex align-items-center detail-role me-2 mb-2"
            );
            var avatarSrc = "/asset/img/avatar.png";
            if (person) {
                avatarSrc =
                    person.profile_picture ||
                    person.user_photo ||
                    person.photo ||
                    avatarSrc;
            }
            var $img = $("<img>")
                .addClass("user-profile me-2")
                .attr("alt", "user profile")
                .attr("src", resolveAvatar(avatarSrc));
            var $info = $("<div>");
            var nameText = person && person.name ? person.name : "-";
            var $name = $("<p>")
                .addClass("m-0 fw-normal")
                .text(safeText(nameText));
            var $role = $("<p>")
                .addClass("m-0 text-muted small")
                .text(roleLabel);
            $info.append($name).append($role);
            $wrap.append($img).append($info);
            return $wrap;
        };

        if (author) container.append(makeEntry(author, "Author"));
        if (Array.isArray(coAuthors))
            coAuthors.forEach(function (c) {
                container.append(makeEntry(c, "Co Author"));
            });
        if (Array.isArray(contributors))
            contributors.forEach(function (c) {
                container.append(makeEntry(c, "Contributor"));
            });
    }

    function createActionButtons(projectId, actionsContainer) {
        actionsContainer.empty();
        var appUrl = getMeta("app-url") || "";
        var editUrl =
            appUrl.replace(/\/$/, "") + "/project/" + projectId + "/edit";
        var $edit = $("<a>")
            .addClass("detail-icon")
            .attr("title", "Edit")
            .attr("href", editUrl)
            .append(
                $("<span>")
                    .addClass("material-symbols-outlined icon-fill me-3")
                    .text("edit")
            );

        // Delete button
        var $delete = $("<button>")
            .addClass("detail-icon btn-delete-project")
            .attr("title", "Delete")
            .append(
                $("<span>")
                    .addClass("material-symbols-outlined icon-fill")
                    .text("delete")
            );

        actionsContainer.append($edit).append($delete);

        // Delete handler: open modal (modal already contains server-rendered project details)
        $delete.on("click", function (e) {
            e.preventDefault();
            var modalEl = document.getElementById("deleteProjectModal");
            if (!modalEl) {
                if (!confirm("Are you sure you want to delete this project?"))
                    return;
                // fallback delete
                var appUrlFb = getMeta("app-url") || "";
                $.ajax({
                    url: appUrlFb.replace(/\/$/, "") + "/project/" + projectId,
                    method: "DELETE",
                    headers: {
                        "X-CSRF-TOKEN": getMeta("csrf-token"),
                        Accept: "application/json",
                    },
                    success: function () {
                        window.location.href =
                            appUrlFb.replace(/\/$/, "") + "/project";
                    },
                    error: function () {
                        alert("Failed to delete");
                    },
                });
                return;
            }
            // ensure confirm button has correct project id (server already set it, but set again for safety)
            $("#confirmDeleteProjectBtn").attr("data-project-id", projectId);
            var bsModal = new bootstrap.Modal(modalEl, {
                backdrop: "static",
                keyboard: false,
            });
            bsModal.show();
        });

        // Confirm delete button handler (delegated in case element created later)
        $(document)
            .off("click", "#confirmDeleteProjectBtn")
            .on("click", "#confirmDeleteProjectBtn", function (e) {
                var $btn = $(this);
                var pid =
                    $btn.attr("data-project-id") || $btn.data("projectId");
                if (!pid) {
                    alert("Project ID tidak ditemukan");
                    return;
                }
                var appUrlLocal = getMeta("app-url") || "";
                var token = getMeta("csrf-token");
                // show loader state on button
                $btn.prop("disabled", true).text("Deleting...");
                $.ajax({
                    url: appUrlLocal.replace(/\/$/, "") + "/project/" + pid,
                    method: "DELETE",
                    headers: {
                        "X-CSRF-TOKEN": token,
                        Accept: "application/json",
                    },
                    success: function (res) {
                        if (res && res.status === "success") {
                            // hide modal and redirect
                            var modalEl =
                                document.getElementById("deleteProjectModal");
                            try {
                                var m = bootstrap.Modal.getInstance(modalEl);
                                if (m) m.hide();
                            } catch (_) {}
                            window.location.href =
                                appUrlLocal.replace(/\/$/, "") + "/project";
                        } else {
                            alert(
                                (res && res.message) ||
                                    "Failed to delete project"
                            );
                            $btn.prop("disabled", false).text("Delete");
                        }
                    },
                    error: function (xhr) {
                        var msg = "Failed to delete project";
                        try {
                            msg =
                                xhr.responseJSON && xhr.responseJSON.message
                                    ? xhr.responseJSON.message
                                    : msg;
                        } catch (e) {}
                        alert(msg);
                        $btn.prop("disabled", false).text("Delete");
                    },
                });
            });
    }

    function populateProject(data) {
        $("#project-title").text(safeText(data.title));
        if (data.image) {
            var imgUrl = data.image;
            // if image is a filename, prefix with /file/project/
            if (!imgUrl.match(/^(https?:)?\/\//)) {
                var appUrl = getMeta("app-url") || "";
                imgUrl =
                    appUrl.replace(/\/$/, "") +
                    "/file/project/" +
                    imgUrl.replace(/^\//, "");
            }
            $("#project-image").attr("src", imgUrl);
        } else {
            // Project has no image: prefer an initials avatar generated from title.
            // Only fall back to the server-provided meta placeholder if we cannot build initials.
            var initials = buildInitials(data.title || '');
            if (initials) {
                var color = getRandomColorFromText(data.title || '');
                var svg = buildInitialsSvg(initials, color);
                $("#project-image").attr("src", svg);
            } else {
                var metaImg = getMeta("project-image");
                if (metaImg) $("#project-image").attr("src", metaImg);
            }
        }
        $("#project-description").html(
            data.description ? data.description.replace(/\n/g, "<br>") : "-"
        );
        if (data.task_counts && typeof data.task_counts.total !== "undefined") {
            $("#project-total-tasks").text(
                data.task_counts.total +
                    " Task" +
                    (data.task_counts.total > 1 ? "s" : "")
            );
        } else {
            var metaTotal = getMeta("project-total-tasks");
            if (metaTotal) {
                $("#project-total-tasks").text(
                    metaTotal + " Task" + (Number(metaTotal) > 1 ? "s" : "")
                );
            }
        }
        $("#project-deadline").text(formatDate(data.due_date));
        $("#project-department").text(safeText(data.department));
        $("#project-division").text(safeText(data.division));
        renderAssignments(
            $("#project-assignments"),
            data.author,
            data.co_authors,
            data.contributors
        );
        createActionButtons(data.id, $("#project-actions"));
    }

    function fetchProject(projectId) {
        if (!projectId) return;
        var appUrl = getMeta("app-url") || "";
        var url = appUrl.replace(/\/$/, "") + "/project/" + projectId;
        $.ajax({
            url: url,
            method: "GET",
            headers: { Accept: "application/json" },
            success: function (res) {
                if (res && res.status === "success" && res.data) {
                    populateProject(res.data);
                } else {
                    console.error("Invalid project payload", res);
                    alert("Gagal mengambil data project");
                }
            },
            error: function (xhr) {
                console.error("Error fetching project", xhr);
                alert("Gagal mengambil data project");
            },
        });
    }

    // Setup global AJAX CSRF for forms if token present
    $(function () {
        var csrf = getMeta("csrf-token");
        if (csrf) {
            $.ajaxSetup({ headers: { "X-CSRF-TOKEN": csrf } });
        }

        var projectId = getMeta("project-id");
        // initialize placeholders from meta if available
        var initialImg = getMeta("project-image");
        if (initialImg) {
            $("#project-image").attr("src", initialImg);
        }
        var initialTotal = getMeta("project-total-tasks");
        if (initialTotal) {
            $("#project-total-tasks").text(
                initialTotal + " Task" + (Number(initialTotal) > 1 ? "s" : "")
            );
        }
        if (projectId) {
            fetchProject(projectId);
        }

        // Ensure edit image input has preview/clear behavior
        try {
            var editImageEl = document.getElementById('edit_image');
            var editImageLabel = document.getElementById('editImageLabel');
            var editImageClearBtn = document.getElementById('editImageClearBtn');
            setupImageInput(editImageEl, editImageLabel, editImageClearBtn);
        } catch (e) {}

        // button references (anchor to #references) - if project doesn't have references this simply navigates
        $("#btn-references").on("click", function () {
            window.location.hash = "#references";
        });
        $("#btn-comments").on("click", function () {
            window.location.hash = "#comments";
        });

        // --- Edit modal logic (adapted from project.js) ---
        // Helper: load departments into a target select
        function loadDepartments(callback, targetSelect) {
            targetSelect = targetSelect || document.getElementById("edit_department");
            $.ajax({
                url: getMeta('app-url').replace(/\/$/, '') + "/departments-for-projects",
                type: "GET",
                dataType: "json",
                success: function (data) {
                    var options = '<option value="">Select Department</option>';
                    (data.data || []).forEach(function (dept) {
                        options += '<option value="' + dept.id + '">' + (dept.name_department || dept.name) + '</option>';
                    });
                    try { targetSelect.innerHTML = options; } catch (e) {}
                    if (typeof callback === 'function') callback();
                },
                error: function () {
                    if (typeof callback === 'function') callback();
                }
            });
        }

        function loadDivisions(departmentId, callback, targetSelect) {
            targetSelect = targetSelect || document.getElementById("edit_division");
            if (!departmentId) {
                targetSelect.innerHTML = '<option value="">Select Division</option>';
                if (typeof callback === 'function') callback();
                return;
            }
            $.ajax({
                url: getMeta('app-url').replace(/\/$/, '') + "/divisions-for-projects",
                type: "GET",
                data: { department_id: departmentId },
                dataType: "json",
                success: function (data) {
                    var options = '<option value="">Select Division</option>';
                    (data.data || []).forEach(function (d) {
                        options += '<option value="' + d.id + '">' + (d.name_division || d.name) + '</option>';
                    });
                    try { targetSelect.innerHTML = options; } catch (e) {}
                    if (typeof callback === 'function') callback();
                },
                error: function () {
                    if (typeof callback === 'function') callback();
                }
            });
        }

        function populatePartOfProjectSelects(currentProjectId, currentProjectTitle, selectedPartOfProjectId) {
            $.ajax({
                url: getMeta('app-url').replace(/\/$/, '') + "/project/index?task_scope=all",
                type: "GET",
                dataType: "json",
                success: function (payload) {
                    var arr = Array.isArray(payload) ? payload : Array.isArray(payload.data) ? payload.data : [];
                    var options = '<option value="">Select Project</option>';
                    var foundCurrent = false;
                    arr.forEach(function (p) {
                        if (!p) return;
                        if (String(p.id) === String(currentProjectId)) foundCurrent = true;
                        options += '<option value="' + p.id + '">' + (p.title || p.name || ('Project ' + p.id)) + '</option>';
                    });
                    if (currentProjectId && !foundCurrent) {
                        options += '<option value="' + currentProjectId + '">' + (currentProjectTitle || ('Project ' + currentProjectId)) + '</option>';
                    }
                    try { document.getElementById('edit_part_of_project').innerHTML = options; } catch (e) {}
                    if (selectedPartOfProjectId) {
                        try { $('#edit_part_of_project').val(selectedPartOfProjectId); } catch (e) {}
                    }
                },
                error: function () {
                    // ignore
                }
            });
        }

        // Image input helper for edit modal
        function setupImageInput(inputEl, labelEl, clearBtnEl) {
            if (!inputEl || !labelEl) return;
            inputEl.addEventListener('change', function () {
                var file = this.files && this.files[0];
                if (!file) return;
                var reader = new FileReader();
                reader.onload = function (e) {
                    try {
                        labelEl.style.backgroundImage = 'url(' + e.target.result + ')';
                        labelEl.classList.add('has-image');
                        labelEl.style.backgroundSize = 'cover';
                        labelEl.style.opacity = '1';
                        if (clearBtnEl) clearBtnEl.classList.remove('d-none');
                        // if user selects a new image, ensure remove_image flag is reset
                        try { document.getElementById('edit_remove_image').value = '0'; } catch(_){ }
                    } catch (err) {}
                };
                reader.readAsDataURL(file);
            });

            // Helper: build initials from a title string (first+last char or first two chars)
            function buildInitials(title) {
                try {
                    if (!title) return '';
                    var t = String(title || '').trim();
                    if (!t) return '';
                    var parts = t.split(/\s+/).filter(Boolean);
                    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
                    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
                } catch (e) { return ''; }
            }

            // Helper: deterministic color from text
            function getRandomColorFromText(text) {
                try {
                    var colors = [
                        '#6A5AE0', '#FF8A3C', '#00A881', '#D4526E', '#3E8EDE',
                        '#546E7A', '#8E44AD', '#2E7D32', '#AD1457', '#EF6C00'
                    ];
                    var h = 0;
                    for (var i = 0; i < (text || '').length; i++) {
                        h = text.charCodeAt(i) + ((h << 5) - h);
                    }
                    return colors[Math.abs(h) % colors.length];
                } catch (e) { return '#6A5AE0'; }
            }

            if (clearBtnEl) {
                clearBtnEl.addEventListener('click', function (ev) {
                    ev.preventDefault();
                    try {
                        inputEl.value = '';
                        var placeholder = getMeta('app-url').replace(/\/$/, '') + '/asset/img/background/add-image.png';
                        labelEl.style.backgroundImage = "url('" + placeholder + "')";
                        labelEl.classList.remove('has-image');
                        labelEl.style.opacity = '0.5';
                        clearBtnEl.classList.add('d-none');
                        // mark remove_image so backend deletes existing image
                        try { document.getElementById('edit_remove_image').value = '1'; } catch(_){ }

                        // Note: do not change the project detail image immediately here.
                        // The actual project image on the detail page will be refreshed
                        // after the Update request succeeds (see edit form success handler
                        // which calls fetchProject). We only update modal preview and
                        // set the remove flag so the server knows to delete the image.
                    } catch (err) {}
                });
            }

        } // end setupImageInput

            // Render selected collaborators badges into edit modal (blue with remove button)
            function renderSelectedBadges(containerId, arr, hiddenInputId) {
                try {
                    var container = document.getElementById(containerId);
                    if (!container) return;
                    container.innerHTML = '';
                    if (!arr || !arr.length) return;

                    // Ensure hidden input exists
                    var hidden = hiddenInputId ? document.getElementById(hiddenInputId) : null;
                    if (hidden && (!hidden.value || hidden.value === '')) {
                        try { hidden.value = JSON.stringify((arr || []).map(function(x){ return x.id; })); } catch(_){}
                    }

                    arr.forEach(function (a) {
                        var id = a.id || a.employee_id || a.user_id || null;
                        var span = document.createElement('span');
                        span.className = 'badge bg-primary d-inline-flex align-items-center me-2 mb-2 text-white';
                        span.style.padding = '6px 8px';

                        var img = document.createElement('img');
                        img.src = a.user_photo || a.profile_picture || (getMeta('app-url').replace(/\/$/, '') + '/asset/img/avatar.png');
                        img.style.width = '24px';
                        img.style.height = '24px';
                        img.style.objectFit = 'cover';
                        img.className = 'rounded-circle me-2';

                        var txt = document.createElement('span');
                        txt.textContent = a.name || a.employee_name || a.username || '-';

                        var removeBtn = document.createElement('button');
                        removeBtn.type = 'button';
                        removeBtn.className = 'btn-close btn-close-white btn-sm ms-2';
                        removeBtn.setAttribute('aria-label', 'Remove');
                        removeBtn.addEventListener('click', function () {
                            try {
                                // remove from DOM
                                if (span && span.parentNode) span.parentNode.removeChild(span);
                                // update hidden input JSON by removing this id
                                if (hidden) {
                                    try {
                                        var cur = JSON.parse(hidden.value || '[]');
                                        if (Array.isArray(cur)) {
                                            cur = cur.filter(function(v){ return String(v) !== String(id); });
                                            hidden.value = JSON.stringify(cur);
                                        }
                                    } catch (_) {}
                                }
                            } catch (e) {}
                        });

                        span.appendChild(img);
                        span.appendChild(txt);
                        span.appendChild(removeBtn);
                        container.appendChild(span);
                    });
                } catch (e) {}
            }

            // Intercept edit link clicks created by createActionButtons
            $(document).off('click', '.detail-icon a, .detail-icon').on('click', '.detail-icon a, .detail-icon', function (e) {
                // If it's the edit anchor inside project actions, handle specially
                var $el = $(e.target).closest('a');
                if (!$el || !$el.attr('href')) return; // let other icons behave normally
                var href = $el.attr('href');
                if (!/\/project\/\d+\/edit$/.test(href)) return; // not project edit
                e.preventDefault();
                // extract id
                var m = href.match(/\/project\/(\d+)\/edit$/);
                if (!m) return;
                var projectId = m[1];
                // fetch edit payload
                $.ajax({
                    url: getMeta('app-url').replace(/\/$/, '') + '/project/' + projectId + '/edit',
                    type: 'GET',
                    dataType: 'json',
                    success: function (data) {
                        try {
                            // Populate basic fields
                            $('#edit_project_id').val(data.id);
                            $('#edit_title').val(data.title || '');
                            $('#edit_description').val(data.description || '');
                            $('#edit_start_date').val(data.start_date || '');
                            $('#edit_due_date').val(data.due_date || '');

                            // Reference URLs
                            try {
                                var container = document.getElementById('edit_project_reference_urls_container');
                                container.innerHTML = '';
                                var urls = [];
                                if (Array.isArray(data.reference_urls)) urls = data.reference_urls;
                                else if (typeof data.reference_urls === 'string') {
                                    try { var parsed = JSON.parse(data.reference_urls); if (Array.isArray(parsed)) urls = parsed; } catch(_){}
                                }
                                if ((!urls || !urls.length) && data.reference_url) urls = [data.reference_url];
                                function makeRow(value, withAdd) {
                                    var row = document.createElement('div');
                                    row.className = 'd-flex gap-2 align-items-center';
                                    row.innerHTML = '<input type="url" class="form-control input-text" name="reference_urls[]" placeholder="https://example.com">' + (withAdd ? ' <button type="button" class="btn btn-submit-black add-ref-url" aria-label="Add URL"><span class="material-symbols-outlined">add</span></button>' : ' <button type="button" class="btn btn-danger remove-ref-url" aria-label="Remove URL"><span class="material-symbols-outlined">close</span></button>');
                                    container.appendChild(row);
                                    var inp = row.querySelector('input[type="url"]'); if (inp && value) inp.value = value;
                                }
                                if (urls && urls.length) { urls.forEach(function(u){ makeRow(u, false); }); makeRow('', true); } else { makeRow('', true); }
                            } catch (e) {}

                            // Part of project select
                            populatePartOfProjectSelects(data.id, data.title || '', data.part_of_project || '');

                            // Departments/divisions
                            loadDepartments(function () {
                                try { $('#edit_department').val(data.department_id).trigger('change'); } catch(_){}
                                loadDivisions(data.department_id, function () {
                                    try { $('#edit_division').val(data.division_id); } catch(_){}
                                });
                            });

                            // Image preview
                            if (data.image) {
                                var url = getMeta('app-url').replace(/\/$/, '') + '/file/project/' + data.image.replace(/^\//, '');
                                var label = document.getElementById('editImageLabel');
                                if (label) {
                                    label.style.backgroundImage = 'url(' + url + ')';
                                    label.classList.add('has-image');
                                    label.style.backgroundSize = 'cover';
                                    label.style.opacity = '1';
                                    document.getElementById('editImageClearBtn')?.classList.remove('d-none');
                                }
                            } else {
                                var lbl = document.getElementById('editImageLabel');
                                if (lbl) {
                                    lbl.style.backgroundImage = "url('" + getMeta('app-url').replace(/\/$/, '') + "/asset/img/background/add-image.png')";
                                    lbl.classList.remove('has-image');
                                    lbl.style.opacity = '0.5';
                                    document.getElementById('editImageClearBtn')?.classList.add('d-none');
                                }
                            }

                            // Existing reference files
                            var existingFiles = Array.isArray(data.reference_files) ? data.reference_files.slice() : (data.reference_file ? (Array.isArray(data.reference_file) ? data.reference_file.slice() : [data.reference_file]) : []);
                            try { document.getElementById('existing_reference_files_input').value = JSON.stringify(existingFiles); } catch(_){}
                            try {
                                var existingContainer = document.getElementById('existing_reference_files');
                                if (existingContainer) {
                                    existingContainer.innerHTML = '';
                                    if (existingFiles.length > 0) {
                                        var title = document.createElement('div'); title.className = 'fw-bold mb-2'; title.textContent = 'Current Files:'; existingContainer.appendChild(title);
                                        var list = document.createElement('div'); list.className = 'existing-files-list w-100';
                                        existingFiles.forEach(function(fn){
                                            var item = document.createElement('div'); item.className = 'existing-file-item d-flex align-items-center justify-content-between mb-2 p-2 bg-light border rounded';
                                            var info = document.createElement('div'); info.className = 'd-flex align-items-center flex-grow-1';
                                            var icon = document.createElement('span'); icon.className = 'material-symbols-outlined me-2'; icon.textContent = 'description';
                                            var link = document.createElement('a'); link.href = getMeta('app-url').replace(/\/$/, '') + '/file/project/' + fn; link.textContent = fn; link.target = '_blank'; link.className = 'text-decoration-none';
                                            var removeBtn = document.createElement('button'); removeBtn.type='button'; removeBtn.className='btn btn-sm btn-outline-danger'; removeBtn.innerHTML='&times;'; removeBtn.addEventListener('click', function(){
                                                existingFiles = existingFiles.filter(function(f){ return f !== fn; });
                                                try { document.getElementById('existing_reference_files_input').value = JSON.stringify(existingFiles); } catch(_){}
                                                // re-render
                                                this.parentNode && this.parentNode.parentNode && this.parentNode.parentNode.removeChild(this.parentNode);
                                            });
                                            info.appendChild(icon); info.appendChild(link); item.appendChild(info); item.appendChild(removeBtn); list.appendChild(item);
                                        });
                                        existingContainer.appendChild(list);
                                    }
                                }
                            } catch(_){}

                            // Clear file input for new files
                            try { $('#edit_reference_file').val(''); } catch(_){}

                            // co-authors & contributors: set hidden inputs and render badges for display
                            try {
                                var co = data.co_authors || [];
                                var cont = data.contributors || data.executors || [];
                                try { $('#edit_co_author').val(JSON.stringify((co.map && co.map(function(c){ return c.id; })) || [])); } catch(_){}
                                try { $('#edit_contributors').val(JSON.stringify((cont.map && cont.map(function(c){ return c.id; })) || [])); } catch(_){}
                                renderSelectedBadges('edit_selected_co_authors', co);
                                renderSelectedBadges('edit_selected_contributors', cont);
                            } catch(_){}

                            // Show modal
                            var modalEl = document.getElementById('editProjectModal');
                            if (modalEl) {
                                var m = bootstrap && bootstrap.Modal && bootstrap.Modal.getOrCreateInstance ? bootstrap.Modal.getOrCreateInstance(modalEl) : new bootstrap.Modal(modalEl);
                                m.show();
                            }
                        } catch (e) {
                            console.error('Failed to populate edit modal', e);
                        }
                    },
                    error: function (xhr) {
                        alert('Gagal mengambil data untuk edit');
                    }
                });
            });

            // Handle edit project form submission
            var isSubmitting = false;
            $(document).off('submit', '#editProjectForm').on('submit', '#editProjectForm', function (e) {
                e.preventDefault();
                if (isSubmitting) return;
                isSubmitting = true;
                var projectId = $('#edit_project_id').val();
                if (!projectId) { alert('Project ID tidak ditemukan'); isSubmitting = false; return; }
                var formEl = this;
                var formData = new FormData(formEl);
                // map reference_urls[] to single reference_url
                try {
                    var urlInputs = formEl.querySelectorAll('input[name="reference_urls[]"]');
                    var urls = Array.from(urlInputs).map(function(i){ return (i.value || '').trim(); }).filter(Boolean);
                    if (urls.length) formData.set('reference_url', urls[0]); else formData.set('reference_url', '');
                } catch(_){}
                formData.append('_method', 'PUT');
                // attach newly selected files
                try {
                    var newFiles = document.getElementById('edit_reference_file').files || [];
                    Array.from(newFiles).forEach(function(f){ formData.append('reference_file[]', f); });
                } catch(_){}

                $('#editModalLoader').removeClass('d-none');
                var submitBtn = $('#editProjectForm button[type="submit"]');
                submitBtn.prop('disabled', true);

                $.ajax({
                    url: getMeta('app-url').replace(/\/$/, '') + '/project/' + projectId,
                    type: 'POST',
                    data: formData,
                    contentType: false,
                    processData: false,
                    success: function (res) {
                        try { if (res && (res.status === 'success' || res.message)) { var msg = res.message || 'Project updated successfully!'; if (typeof showFloatingAlert === 'function') showFloatingAlert(msg, 'success', 1500); else alert(msg); } } catch(_){}
                        // hide modal and refresh project detail
                        setTimeout(function(){ try { var me = bootstrap.Modal.getInstance(document.getElementById('editProjectModal')); if (me) me.hide(); } catch(_){} fetchProject(getMeta('project-id')); }, 700);
                    },
                    error: function (xhr) {
                        if (xhr.status === 422) {
                            try {
                                var errors = xhr.responseJSON.errors || {};
                                var listHtml = '';
                                Object.keys(errors).forEach(function(k){ var v = errors[k]; if (Array.isArray(v)) v.forEach(function(m){ listHtml += '\n- ' + m; }); else listHtml += '\n- ' + v; });
                                if (typeof showFloatingAlert === 'function') showFloatingAlert(listHtml, 'warning', 5000); else alert(listHtml);
                            } catch (e) { alert('Validation failed'); }
                        } else {
                            alert('Failed to update project');
                        }
                    },
                    complete: function () {
                        $('#editModalLoader').addClass('d-none');
                        submitBtn.prop('disabled', false);
                        isSubmitting = false;
                    }
                });
            });

        }); // end $(function)

    })(jQuery);
