var appUrl = (
    document.querySelector('meta[name="app-url"]')?.getAttribute("content") ||
    ""
).replace(/\/$/, "");

// Flags to prevent double modal triggering
window.isReopeningTimeline = false;
window.isHandlingTimelineBarClick = false;

// Helper function for consistent employee loading error handling (quiet by default)
function handleEmployeeLoadError(xhr, status, error, context = "") {
    try {
        console.warn(
            `Failed to load employees${context ? " (" + context + ")" : ""}:`,
            {
                status: xhr?.status,
                statusText: xhr?.statusText,
                responseText: xhr?.responseText,
                error: error,
            }
        );

        // Only notify the user if they're actively interacting with employee pickers
        function isUserInteracting() {
            try {
                const active = document.activeElement;
                const interactiveIds = new Set([
                    "co_author_input",
                    "contributor_input",
                    "edit_co_author_input",
                    "edit_contributor_input",
                ]);
                if (active && interactiveIds.has(active.id)) return true;
                // Or if any employee dropdown is currently visible
                const dropdownSelectors = [
                    "#co_author_dropdown",
                    "#contributor_dropdown",
                    "#edit_co_author_dropdown",
                    "#edit_contributor_dropdown",
                ];
                for (const sel of dropdownSelectors) {
                    const el = document.querySelector(sel);
                    if (
                        el &&
                        el.style.display !== "none" &&
                        el.offsetParent !== null
                    ) {
                        return true;
                    }
                }
            } catch (_) {}
            return false;
        }

        // Throttle notifications to avoid noise
        const now = Date.now();
        const THROTTLE_MS = 60_000; // 60s
        window.__employeeErrorLastShown = window.__employeeErrorLastShown || 0;
        const canNotify = now - window.__employeeErrorLastShown > THROTTLE_MS;

        // Decide whether to show any UI notice at all
        const shouldShow = isUserInteracting() && canNotify;

        if (!shouldShow) return; // stay quiet (only console.warn)

        window.__employeeErrorLastShown = now;

        if (typeof showFloatingAlert === "function") {
            let message = "Failed to load employees list. ";
            if (status === "timeout") {
                message += "Request timed out. Please try again.";
            } else if (xhr && xhr.status === 401) {
                message +=
                    "Authentication required. Please refresh and try again.";
            } else if (xhr && xhr.status === 500) {
                message += "Server error. Please contact administrator.";
            } else if (xhr && xhr.status === 0) {
                message += "Network error. Please check your connection.";
            } else {
                message += "Please try again or contact administrator.";
            }
            showFloatingAlert(message, "warning", 4000);
        } else {
            // No global alert UI available: do not block the user with window.alert; stay silent
        }
    } catch (e) {
        // As a last resort, avoid breaking the page
        try {
            console.warn("handleEmployeeLoadError fallback", e);
        } catch (_) {}
    }
}

// Mobile detection utility for tooltip placement
function isMobileDevice() {
    return (
        window.matchMedia("(max-width: 768px)").matches ||
        window.innerWidth <= 768 ||
        /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
        )
    );
}

// Get appropriate tooltip placement based on device
function getTooltipPlacement() {
    return isMobileDevice() ? "top" : "bottom";
}

// Global function to initialize responsive tooltips
function initResponsiveTooltips(container = document) {
    try {
        const tooltipElements = container.querySelectorAll(
            '[data-bs-toggle="tooltip"]'
        );
        const placement = getTooltipPlacement();

        tooltipElements.forEach((el) => {
            // Dispose existing tooltip if any
            const existingTooltip = bootstrap.Tooltip.getInstance(el);
            if (existingTooltip) {
                existingTooltip.dispose();
            }

            try {
                new bootstrap.Tooltip(el, {
                    placement: placement,
                    container: "body",
                    trigger: "hover focus",
                });
            } catch (e) {
                // Ignore initialization errors
            }
        });
    } catch (e) {
        // Ignore any errors
    }
}

// Make function globally available
window.initResponsiveTooltips = initResponsiveTooltips;

// Global avatar cache-bust version (updated when profile picture changes)
window.__avatarVersion = Date.now();
function appendAvatarVersion(url) {
    try {
        if (!url) return url;
        if (/\?(.*)(t|v)=/.test(url)) return url; // already has timestamp param
        const sep = url.includes("?") ? "&" : "?";
        return url + sep + "t=" + window.__avatarVersion;
    } catch (_) {
        return url;
    }
}

// Global avatar builder (used by add/edit modals). Priority: profile_picture_url > profile_picture > user_photo (raw can be any).
if (typeof window.buildAvatarUrl !== "function") {
    window.buildAvatarUrl = function (raw) {
        if (!raw) return appendAvatarVersion(appUrl + "/asset/img/avatar.png");
        try {
            raw = String(raw).trim();
            const trimmed = raw.replace(/^\/+/, "");
            if (/^https?:\/\//i.test(raw)) return appendAvatarVersion(raw);
            if (/^(file\/|asset\/|storage\/)/.test(trimmed))
                return appendAvatarVersion(appUrl + "/" + trimmed);
            if (raw.startsWith("/")) return appendAvatarVersion(appUrl + raw);
            if (raw.indexOf("/") !== -1)
                return appendAvatarVersion(appUrl + "/" + trimmed);
            return appendAvatarVersion(appUrl + "/file/profile_picture/" + raw);
        } catch (_) {
            return appendAvatarVersion(appUrl + "/asset/img/avatar.png");
        }
    };
}

window.addEventListener("profilePictureUpdated", function () {
    window.__avatarVersion = Date.now();
    // Update any collaborator images in add/edit modals
    document
        .querySelectorAll(
            "#selected_co_authors img, #selected_contributors img, #edit_selected_co_authors img, #edit_selected_contributors img, #co_author_dropdown img, #contributor_dropdown img, #edit_co_author_dropdown img, #edit_contributor_dropdown img"
        )
        .forEach(function (img) {
            try {
                img.src = img.src.replace(/\?t=\d+$/, "");
                img.src = appendAvatarVersion(img.src);
            } catch (_) {}
        });
    // Trigger re-fetch if modals are open
    try {
        if (
            document
                .getElementById("addProjectModal")
                ?.classList.contains("show")
        ) {
            if (typeof window.__refreshAddProjectEmployees === "function")
                window.__refreshAddProjectEmployees();
        }
        if (
            document
                .getElementById("editProjectModal")
                ?.classList.contains("show")
        ) {
            if (typeof window.__refreshEditProjectEmployees === "function")
                window.__refreshEditProjectEmployees();
        }
    } catch (_) {}
});

document.addEventListener("DOMContentLoaded", function () {
    // Initialize responsive tooltips on page load
    setTimeout(() => {
        initResponsiveTooltips();
    }, 100);

    const departmentSelect = document.getElementById("department");
    const divisionSelect = document.getElementById("division");
    const partOfProjectSelect = document.getElementById("part_of_project");

    // Helper: populate part_of_project selects (add + edit). If currentProjectId is provided
    // ensure an option for it exists even if the fetched list does not contain it.
    function populatePartOfProjectSelects(
        currentProjectId = null,
        currentProjectTitle = "",
        selectedPartOfProjectId = ""
    ) {
        fetch(appUrl + "/project/index?task_scope=all")
            .then(function (response) {
                if (!response.ok) throw new Error("Failed to load projects");
                return response.json();
            })
            .then(function (payload) {
                const arr = Array.isArray(payload)
                    ? payload
                    : Array.isArray(payload.data)
                    ? payload.data
                    : [];
                let options = '<option value="">Select Project</option>';
                let foundCurrent = false;
                arr.forEach(function (p) {
                    if (!p) return;
                    const id = p.id;
                    const title = p.title || p.name || "Project " + id;
                    if (String(id) === String(currentProjectId))
                        foundCurrent = true;
                    options += `<option value="${id}">${title}</option>`;
                });

                if (currentProjectId && !foundCurrent) {
                    const safeTitle =
                        currentProjectTitle || "Project " + currentProjectId;
                    options += `<option value="${currentProjectId}">${safeTitle}</option>`;
                }

                try {
                    if (partOfProjectSelect)
                        partOfProjectSelect.innerHTML = options;
                } catch (_) {}
                try {
                    const editSel = document.getElementById(
                        "edit_part_of_project"
                    );
                    if (editSel) editSel.innerHTML = options;
                } catch (_) {}

                if (selectedPartOfProjectId) {
                    try {
                        $("#edit_part_of_project").val(selectedPartOfProjectId);
                    } catch (_) {}
                }
            })
            .catch(function (err) {
                console.warn("populatePartOfProjectSelects failed", err);
            });
    }
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
                fileSize.textContent = ` (${(file.size / 1024 / 1024).toFixed(
                    2
                )} MB)`;
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

    // Delegated handler: add/remove reference URL rows (match Task behavior)
    document.addEventListener("click", function (e) {
        const addBtn = e.target.closest(".add-ref-url");
        if (addBtn) {
            e.preventDefault();
            const container = addBtn.closest(
                "#feedback_reference_urls_container, #project_reference_urls_container, #edit_project_reference_urls_container"
            );
            if (!container) return;
            const row = document.createElement("div");
            row.className = "d-flex gap-2 align-items-center";
            row.innerHTML =
                '<input type="url" class="form-control input-text" name="reference_urls[]" placeholder="https://example.com">' +
                ' <button type="button" class="btn btn-danger remove-ref-url" aria-label="Remove URL"><span class="material-symbols-outlined">close</span></button>';
            container.appendChild(row);
            const input = row.querySelector('input[type="url"]');
            if (input) input.focus();
            return;
        }

        const removeBtn = e.target.closest(".remove-ref-url");
        if (removeBtn) {
            e.preventDefault();
            const row = removeBtn.closest(".d-flex");
            if (row && row.parentNode) {
                row.parentNode.removeChild(row);
            }
        }
    });

    // Global avatar update listener: refresh collaborator images (simple approach: re-trigger any lightweight rerender if project list cached globally)
    window.addEventListener("profilePictureUpdated", function () {
        try {
            // If we have a global projects array and a render function, invoke it.
            if (
                window.currentProjects &&
                Array.isArray(window.currentProjects) &&
                typeof window.renderProjectCards === "function"
            ) {
                window.renderProjectCards(window.currentProjects, true); // pass true to indicate avatar-only refresh if supported
            } else {
                // Fallback: update any img with data-author-current attribute
                document
                    .querySelectorAll('img[data-author-current="1"]')
                    .forEach(function (img) {
                        // Append cache buster
                        img.src =
                            img.src.replace(/\?t=\d+$/, "") +
                            "?t=" +
                            Date.now();
                    });
            }
        } catch (e) {
            console.warn("Project avatar refresh failed", e);
        }
    });

    // Helper to format role labels to capitalized form (Author, Co-Author, Contributor)
    function formatRoleText(role) {
        if (!role) return "";
        try {
            const r = String(role)
                .trim()
                .toLowerCase()
                .replace(/[-\s]+/g, "_");
            if (r === "author") return "Author";
            if (r === "co_author") return "Co-Author";
            if (r === "contributor") return "Contributor";
            // Fallback: Title Case each token
            return String(role)
                .split(/[\s_-]+/)
                .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ""))
                .join(" ");
        } catch (_) {
            return String(role);
        }
    }

    // Helper to resolve employee photo URL and return img HTML string
    function resolvePhotoHtml(emp, size = 30, marginLeft = 0, role = "") {
        // Prioritize universal profile picture fields
        let userPhoto =
            emp &&
            (emp.profile_picture_url ||
                emp.profile_picture ||
                emp.user_photo ||
                emp.user_photo_url ||
                emp.user_photo_path);
        let photoUrl = "";
        if (userPhoto) {
            try {
                const raw = String(userPhoto).trim();
                const trimmed = raw.replace(/^\/+/, "");

                // 1. Sudah full URL
                if (/^https?:\/\//i.test(raw)) {
                    photoUrl = raw;
                }
                // 2. Path yang sudah mengarah ke folder publik kita: file/, asset/, storage/
                else if (/^(file\/|asset\/|storage\/)/.test(trimmed)) {
                    photoUrl = appUrl + "/" + trimmed;
                }
                // 3. Absolute path diawali '/'
                else if (raw.startsWith("/")) {
                    photoUrl = appUrl + raw;
                }
                // 4. Memiliki slash (subfolder lain) -> sambung langsung
                else if (raw.indexOf("/") !== -1) {
                    photoUrl = appUrl + "/" + trimmed;
                }
                // 5. Hanya filename -> coba di file/profile_picture/ sebelum fallback
                else {
                    photoUrl = appUrl + "/file/profile_picture/" + raw;
                }
                // Jika ternyata menghasilkan /storage/asset (kasus lama) koreksi ke tanpa storage
                photoUrl = photoUrl.replace(/\/storage\/asset\//, "/asset/");
            } catch (e) {
                photoUrl = appUrl + "/asset/img/avatar.png";
            }
        } else {
            photoUrl = appUrl + "/asset/img/avatar.png";
        }

        // Prefer API fields in this order: explicit name, employee_name (from assignments),
        // username/full_name, and nested employee.name when payload uses nested structure.
        const name = (function () {
            if (!emp) return "Unknown";
            const direct =
                emp.name || emp.employee_name || emp.username || emp.full_name;
            if (direct) return direct;
            const nested =
                emp.employee && (emp.employee.name || emp.employee.full_name);
            return nested || "Unknown";
        })();
        // Remove role from tooltip - only show name
        const titleText = name;

        return `<img src="${photoUrl}" alt="${name}" title="${titleText}" data-bs-toggle="tooltip" class="rounded-circle" style="width:${size}px;height:${size}px;object-fit:cover;${marginLeft ? "margin-left:" + marginLeft + "px;" : ""}" onerror="this.onerror=null;this.src='${appUrl}/asset/img/avatar.png';">`;
    }

    // Build collaborators HTML: author first, then co_authors, then contributors. Shows up to 3 images and +N overflow.
    // Optional sizeOverride lets caller control avatar size (default 30 for cards; use 40 for Project Detail modal)
    function renderCollaborators(project, sizeOverride) {
        try {
            const size = (function (s) {
                const n = Number(s);
                return Number.isFinite(n) && n > 0 ? n : 30;
            })(sizeOverride);
            const maxVisible = 3;
            let coll = [];

            // Author (put first)
            if (project.author) {
                coll.push({ type: "author", emp: project.author });
            }

            // Co-authors
            if (project.co_authors && Array.isArray(project.co_authors)) {
                project.co_authors.forEach((c) =>
                    coll.push({ type: "co_author", emp: c })
                );
            }

            // Contributors (support legacy key 'executors' by treating them as contributors for display)
            if (project.executors && Array.isArray(project.executors)) {
                project.executors.forEach((c) =>
                    coll.push({ type: "contributor", emp: c })
                );
            } else if (
                project.contributors &&
                Array.isArray(project.contributors)
            ) {
                project.contributors.forEach((c) =>
                    coll.push({ type: "contributor", emp: c })
                );
            }

            if (coll.length === 0) {
                // fallback: show default placeholder
                return (
                    resolvePhotoHtml(null, size, 0) +
                    resolvePhotoHtml(null, size, -8)
                );
            }

            let html = "";
            const visible = coll.slice(0, maxVisible);
            visible.forEach((c, idx) => {
                const margin = idx === 0 ? 0 : -8;
                html += resolvePhotoHtml(c.emp, size, margin, c.type);
            });

            const overflow = coll.length - maxVisible;
            if (overflow > 0) {
                const hidden = coll
                    .slice(maxVisible)
                    .map((h) => {
                        const n = (function (emp) {
                            if (!emp) return "Unknown";
                            return (
                                emp.name ||
                                emp.employee_name ||
                                emp.username ||
                                emp.full_name ||
                                (emp.employee &&
                                    (emp.employee.name ||
                                        emp.employee.full_name)) ||
                                "Unknown"
                            );
                        })(h.emp);
                        // Remove role from tooltip - only show name
                        return n;
                    })
                    .join(", ");

                const moreFont = size >= 38 ? 14 : 12;
                html += `<div class="more-collaborators rounded-circle d-flex justify-content-center align-items-center text-dark fw-bold" title="${hidden}" data-bs-toggle="tooltip" style="width:${size}px;height:${size}px;font-size:${moreFont}px;margin-left:-8px;">+${overflow}</div>`;
            }

            return html;
        } catch (e) {
            console.error("renderCollaborators error", e);
            return resolvePhotoHtml(null, sizeOverride || 30, 0);
        }
    }

    // Build vertical collaborators list for Project Detail modal
    // Each row: avatar on the left, then name, and division beneath the name; stacked vertically and scrollable via CSS
    function buildCollaboratorsDetailList(project) {
        try {
            const items = [];
            if (project && project.author)
                items.push({ role: "author", emp: project.author });
            if (project && Array.isArray(project.co_authors)) {
                project.co_authors.forEach((emp) =>
                    items.push({ role: "co_author", emp })
                );
            }
            // Support legacy key 'executors' as contributors
            if (project && Array.isArray(project.executors)) {
                project.executors.forEach((emp) =>
                    items.push({ role: "contributor", emp })
                );
            } else if (project && Array.isArray(project.contributors)) {
                project.contributors.forEach((emp) =>
                    items.push({ role: "contributor", emp })
                );
            }

            function getName(emp) {
                try {
                    return (
                        emp?.name ||
                        emp?.employee_name ||
                        emp?.username ||
                        emp?.full_name ||
                        (emp?.employee &&
                            (emp.employee.name || emp.employee.full_name)) ||
                        "Unknown"
                    );
                } catch (_) {
                    return "Unknown";
                }
            }

            if (!items.length) {
                return '<div class="text-muted small">No collaborators</div>';
            }

            const rows = items.map(({ role, emp }) => {
                const name = getName(emp);
                // Use global resolver for photo (includes cache busting and onerror handling)
                const photo = resolvePhotoHtml(emp, 36, 0, role);
                return (
                    '<div class="collab-item d-flex align-items-center mb-2">' +
                    '<div class="flex-shrink-0">' +
                    photo +
                    "</div>" +
                    '<div class="ms-2">' +
                    '<div class="collab-name">' +
                    (name || "Unknown") +
                    "</div>" +
                    '<div class="collab-division text-muted">' +
                    (role || "-") +
                    "</div>" +
                    "</div>" +
                    "</div>"
                );
            });

            return '<div class="collab-list">' + rows.join("") + "</div>";
        } catch (e) {
            console.warn("buildCollaboratorsDetailList error", e);
            return '<div class="text-muted small">No collaborators</div>';
        }
    }

    let currentPage = 1;

    // Unified initials logic (match task.js style) + placeholder filtering
    function getInitials(title) {
        const text = (title || "").trim();
        if (!text) return "NA";
        const placeholder = /^(no project|no|none|null|n\/a|na)$/i;
        if (placeholder.test(text)) return "NA";
        const parts = text.split(/\s+/).filter(Boolean);
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }

    // Deterministic background color based on title (avoid random color changing each reload)
    function getInitialsColor(title) {
        const colors = [
            "#6A5AE0",
            "#FF8A3C",
            "#00A881",
            "#D4526E",
            "#3E8EDE",
            "#546E7A",
            "#8E44AD",
            "#2E7D32",
            "#AD1457",
            "#EF6C00",
        ];
        const key = title || "NA";
        let hash = 0;
        for (let i = 0; i < key.length; i++)
            hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
        return colors[hash % colors.length];
    }

    // Load project card data and generate cards dynamically
    // Accepts optional filter (status grouping), page, and search text
    // Keep a local state mirrored to window.currentSearch for cross-scope access
    let currentSearch =
        typeof window.currentSearch === "string" ? window.currentSearch : "";
    let currentProjectId =
        typeof window.currentProjectId !== "undefined"
            ? window.currentProjectId
            : "";
    let currentFilterDate =
        typeof window.currentFilterDate === "string"
            ? window.currentFilterDate
            : "";
    function loadProjectCardData(
        filter = null,
        page = 1,
        search = null,
        sortBy = "asc"
    ) {
        // DEBUG: Log filter parameter
        if (filter) {
            console.log("=== FILTER DEBUG ===");
            console.log("Filter applied:", filter);
        }
        // Track current search text
        if (typeof search === "string") {
            currentSearch = search;
            try {
                window.currentSearch = currentSearch;
            } catch (_) {}
        }

        const params = {
            filter: filter,
            task_scope: "me",
            page: page,
            sort_by: sortBy,
        };
        if (currentSearch && currentSearch.trim() !== "") {
            params.search = currentSearch.trim();
        }
        if (currentProjectId) {
            params.project_id = currentProjectId;
        }
        if (currentFilterDate && currentFilterDate.trim() !== "") {
            params.date = currentFilterDate.trim();
        }

        $.ajax({
            url: appUrl + "/project/get-all-projects",
            type: "GET",
            dataType: "json",
            data: params,
            beforeSend: function () {
                $(".loader").fadeIn("fast");
            },
            error: function (res) {
                $(".loader").fadeOut("fast");
            },
            success: function (data) {
                // DEBUG: Log filter results
                if (filter || currentSearch) {
                    console.log(
                        "Filter results count:",
                        Array.isArray(data)
                            ? data.length
                            : data.data
                            ? data.data.length
                            : 0
                    );
                    console.log("Filter/search results:", data);
                }
                let container = document.getElementById("all-cards-container");
                container.innerHTML = ""; // Clear existing cards

                // support API returning either array or { data: [...] }
                const projects = Array.isArray(data)
                    ? data
                    : Array.isArray(data.data)
                    ? data.data
                    : [];

                // compute chart counts even if zero or empty

                // Build timeline from actual projects and render. If list items lack start/due, fetch details.

                if (projects && projects.length > 0) {
                    let rowHtml = '<div class="row">';

                    projects.forEach((project) => {
                        let imageUrl = project.image
                            ? appUrl + "/file/project/" + project.image
                            : null;

                        const dataTitle = (project.title || "").replace(
                            /"/g,
                            "&quot;"
                        );
                        rowHtml += `
                            <div class="col-md-4 mb-3 d-flex align-items-start position-relative" data-project-id="${
                                project.id
                            }" data-project-title="${dataTitle}">
                                <div class="project-card p-4 w-100" style="background:#F0F1F8; border-radius:20px; display:flex; flex-direction:column; justify-content:space-between;">

                                    <!-- Header -->
                                    <div class="d-flex justify-content-between align-items-start mb-2">
                                        <div class="d-flex align-items-center">
                                            ${
                                                imageUrl
                                                    ? `<img src="${imageUrl}" data-role="project-avatar" class="rounded-circle me-2" style="width:34px;height:34px;object-fit:cover;">`
                                                    : (function () {
                                                          const init =
                                                              getInitials(
                                                                  project.title
                                                              );
                                                          const color =
                                                              getInitialsColor(
                                                                  project.title
                                                              );
                                                          return `<div class=\"rounded-circle me-2 d-flex align-items-center justify-content-center\"
                                                            style=\"width:34px;height:34px;background:${color};color:#fff;font-size:14px;font-weight:600;\">${init}</div>`;
                                                      })()
                                            }
                                            <h6 class="mb-0 title-project" style="font-size:14px; font-weight:600; cursor:pointer;">${
                                                project.title
                                            }</h6>
                                        </div>
                                        <div class="dropdown-icon-container">
                                            <button class="btn btn-sm border-0 d-flex align-items-center justify-content-center dropdown-icon dropdown-icon-custom"
                                                    style="background:#E8E9F2; border-radius:50%; width:32px; height:32px;">
                                                <span class="material-symbols-outlined" style="font-size:16px; color:#828282;" tabindex="0">more_vert</span>
                                            </button>
                                            <div class="dropdown-menu dropdown-action d-none">
                                                <div class="dropdown-item">Detail</div>
                                                <div class="dropdown-item">Task</div>
                                                <div class="dropdown-item">Feedback</div>
                                                <div class="dropdown-item">Edit</div>
                                                <div class="dropdown-item text-danger delete-project">Delete</div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Description (render only if non-empty) -->
                                    <div class="description-container">
                                        ${(function () {
                                            const d = (
                                                project.description || ""
                                            ).trim();
                                            if (!d) return "";
                                            return `<p class="description mb-2 small text-muted" style="font-size:12px; line-height:1.4;">${d}</p>`;
                                        })()}
                                    </div>

                                    <hr class="my-2 border-3" style="border-top:1px solid #DEDFE7;">

                                    <!-- Footer -->
                                    <div class="d-flex justify-content-between align-items-center mt-2">
                                        <div class="collaborators-image d-flex align-items-center">
                                            ${renderCollaborators(project)}
                                        </div>
                                        <div class="d-flex align-items-center">
                                            <div class="latest-feedback-snippet d-none align-items-center me-1" data-project-id="${
                                                project.id
                                            }" style="cursor:pointer; max-width: 160px;">
                                                <img class="latest-feedback-avatar rounded-circle me-1" src="${appUrl}/asset/img/avatar.png" alt="avatar" width="20" height="20" style="object-fit:cover;">
                                                <span class="latest-feedback-text text-truncate" style="max-width: 130px; font-size: 11px; color:#4B4F5E;"></span>
                                            </div>
                              <button class="btn btn-sm p-0 border-0 bg-transparent me-2 comment-icon d-flex align-items-center position-relative"
        title="Comment" data-project-id="${project.id}">
    <span class="material-symbols-outlined" style="font-size:16px; color:#828282;">mode_comment</span>
    <span class="project-feedback-count ms-1" data-project-id="${
        project.id
    }" style="font-size:12px; color:#454545;"></span>
    <span class="unread-badge position-absolute top-0 start-75 translate-middle d-none"
          data-project-id="${
              project.id
          }" style="background: red; color: white; border-radius: 50%; font-size: 10px; display: flex; align-items: center; justify-content: center; font-weight: bold;"></span>
</button>

                                            <button class="btn btn-sm p-0 border-0 bg-transparent project-attach-file d-flex align-items-center" title="Attach File" data-project-id="${
                                                project.id
                                            }">
                                                <span class="material-symbols-outlined" style="font-size:16px; color:#828282;">attach_file</span>
                                                <span class="project-file-count ms-1" data-project-id="${
                                                    project.id
                                                }" style="font-size:12px; color:#454545;"></span>
                                            </button>
                                            <!-- Add Schedule button: opens schedule create modal and passes project id -->
                                            <button class="btn btn-sm p-0 border-0 bg-transparent ms-2 add-schedule-btn" title="Add Schedule" data-bs-toggle="modal" data-bs-target="#scheduleCreateModal" data-project-id="${project.id}">
                                                <span class="material-symbols-outlined" style="font-size:16px; color:#828282;">calendar_month</span>
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
                        initResponsiveTooltips(container);
                    } catch (e) {
                        // ignore
                    }

                    // Delegated click: clicking on a project title opens Project Detail modal
                    try {
                        // Ensure we don't bind multiple times by removing any previous listener
                        if (container.__titleClickBound !== true) {
                            container.addEventListener("click", function (ev) {
                                const titleEl =
                                    ev.target.closest(".title-project");
                                if (!titleEl) return;
                                ev.preventDefault();
                                ev.stopPropagation();
                                const card = titleEl.closest(".col-md-4");
                                const pid =
                                    card &&
                                    card.getAttribute("data-project-id");
                                if (pid) {
                                    try {
                                        fetchAndShowProjectDetail(pid);
                                    } catch (_) {
                                        console.warn(
                                            "fetchAndShowProjectDetail not available"
                                        );
                                    }
                                }
                            });
                            container.__titleClickBound = true;
                        }
                    } catch (_) {
                        /* noop */
                    }

                    // Add robust delegated listener for card action menu toggle
                    if (container && container.__cardMenuDelegated !== true) {
                        container.addEventListener("click", function (e) {
                            const btn = e.target.closest(".dropdown-icon");
                            if (!btn) return;
                            if (!container.contains(btn)) return;
                            e.preventDefault();
                            e.stopPropagation();

                            const dropdownMenu = btn.nextElementSibling;
                            const isVisible =
                                dropdownMenu &&
                                !dropdownMenu.classList.contains("d-none");

                            // Close all card action menus within this container only
                            container
                                .querySelectorAll(".dropdown-action")
                                .forEach((menu) => {
                                    menu.classList.add("d-none");
                                });

                            // Open the requested one if it wasn't visible
                            if (dropdownMenu && !isVisible) {
                                dropdownMenu.classList.remove("d-none");
                            }
                        });
                        // Close any open card menus when clicking outside the cards
                        if (!window.__globalCardMenuCloserBound) {
                            window.__globalCardMenuCloserBound = true;
                            document.addEventListener("click", function () {
                                try {
                                    document
                                        .querySelectorAll(".dropdown-action")
                                        .forEach((menu) =>
                                            menu.classList.add("d-none")
                                        );
                                } catch (_) {}
                            });
                        }
                        container.__cardMenuDelegated = true;
                    }

                    // Bind latest-feedback-snippet clicks to open modal and mark read
                    try {
                        container
                            .querySelectorAll(
                                ".latest-feedback-snippet[data-project-id]"
                            )
                            .forEach((el) => {
                                el.addEventListener("click", function (ev) {
                                    ev.preventDefault();
                                    ev.stopPropagation();
                                    const pid =
                                        this.getAttribute("data-project-id");
                                    // Hide indicators immediately and mark as read
                                    hideProjectUnreadBadge(pid);
                                    hideProjectLatestFeedbackSnippet(pid);
                                    // Set target to latest payload for deep-link
                                    try {
                                        window.__projectLatestTarget =
                                            window.__projectLatestTarget || {};
                                        const latest =
                                            (window.__projectLatest &&
                                                window.__projectLatest[
                                                    String(pid)
                                                ]) ||
                                            null;
                                        if (latest)
                                            window.__projectLatestTarget[
                                                String(pid)
                                            ] = latest;
                                    } catch (_) {}
                                    markProjectFeedbacksRead(pid).always(() => {
                                        const projectFeedbackModalEl =
                                            document.getElementById(
                                                "projectFeedbackModal"
                                            );
                                        if (!projectFeedbackModalEl) return;
                                        projectFeedbackModalEl.setAttribute(
                                            "data-project-id",
                                            pid
                                        );
                                        try {
                                            loadFeedbackData(pid);
                                        } catch (_) {}
                                        const m = new bootstrap.Modal(
                                            projectFeedbackModalEl
                                        );
                                        m.show();
                                    });
                                });
                            });
                    } catch (_) {
                        /* noop */
                    }

                    // After rendering, refresh unread badges and latest feedback snippets
                    try {
                        refreshAllProjectUnreadBadges();
                    } catch (_) {}
                    // Only refresh feedback snippets if search is empty
                    try {
                        const searchInput =
                            document.getElementById("search_filter");
                        if (!searchInput || searchInput.value.trim() === "") {
                            refreshAllProjectLatestFeedbackSnippets();
                        }
                    } catch (_) {}

                    // Update pagination if backend provides it (supports search pagination)
                    try {
                        if (data && data.pagination) {
                            updatePagination(data.pagination);
                        }
                    } catch (_) {}

                    // Event listener for "Edit" dropdown item click (bind once to avoid duplicates)
                    if (!window.__projectEditListenerBound) {
                        window.__projectEditListenerBound = true;
                        document.addEventListener("click", function (e) {
                            if (
                                e.target &&
                                e.target.classList.contains("dropdown-item")
                            ) {
                                const text = e.target.textContent.trim();
                                if (text === "Edit") {
                                    e.preventDefault();
                                    e.stopPropagation();

                                    // Find the project card container from the clicked dropdown item
                                    const card = e.target.closest(".col-md-4");
                                    if (!card) {
                                        showFloatingAlert(
                                            "Project card not found.",
                                            "warning",
                                            3000
                                        );
                                        return;
                                    }

                                    const projectId =
                                        card.getAttribute("data-project-id");
                                    if (!projectId) {
                                        showFloatingAlert(
                                            "Project ID not found.",
                                            "warning",
                                            3000
                                        );
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
                                            // Populate edit modal form fields
                                            $("#edit_project_id").val(data.id);
                                            $("#edit_title").val(data.title);
                                            $("#edit_description").val(
                                                data.description
                                            );
                                            // Prefill multiple reference URLs in Edit Project (match Task behavior)
                                            (function () {
                                                try {
                                                    const container =
                                                        document.getElementById(
                                                            "edit_project_reference_urls_container"
                                                        );
                                                    if (!container) return;
                                                    container.innerHTML = "";
                                                    // Normalize URLs from API: reference_urls (array or JSON) or legacy reference_url (string)
                                                    let urls = [];
                                                    if (
                                                        Array.isArray(
                                                            data.reference_urls
                                                        )
                                                    )
                                                        urls =
                                                            data.reference_urls;
                                                    else if (
                                                        typeof data.reference_urls ===
                                                        "string"
                                                    ) {
                                                        try {
                                                            const arr =
                                                                JSON.parse(
                                                                    data.reference_urls
                                                                );
                                                            if (
                                                                Array.isArray(
                                                                    arr
                                                                )
                                                            )
                                                                urls = arr;
                                                        } catch (_) {}
                                                    }
                                                    if (
                                                        (!urls ||
                                                            urls.length ===
                                                                0) &&
                                                        data.reference_url
                                                    )
                                                        urls = [
                                                            data.reference_url,
                                                        ];

                                                    function makeRow(
                                                        value,
                                                        withAdd
                                                    ) {
                                                        const row =
                                                            document.createElement(
                                                                "div"
                                                            );
                                                        row.className =
                                                            "d-flex gap-2 align-items-center";
                                                        row.innerHTML =
                                                            '<input type="url" class="form-control input-text" name="reference_urls[]" placeholder="https://example.com">' +
                                                            (withAdd
                                                                ? ' <button type="button" class="btn btn-submit-black add-ref-url" aria-label="Add URL"><span class="material-symbols-outlined">add</span></button>'
                                                                : ' <button type="button" class="btn btn-danger remove-ref-url" aria-label="Remove URL"><span class="material-symbols-outlined">close</span></button>');
                                                        container.appendChild(
                                                            row
                                                        );
                                                        const inp =
                                                            row.querySelector(
                                                                'input[type="url"]'
                                                            );
                                                        if (inp && value)
                                                            inp.value = value;
                                                    }

                                                    if (urls && urls.length) {
                                                        urls.forEach((u) =>
                                                            makeRow(u, false)
                                                        );
                                                        makeRow("", true);
                                                    } else {
                                                        makeRow("", true);
                                                    }
                                                } catch (_) {
                                                    /* noop */
                                                }
                                            })();
                                            $("#edit_start_date").val(
                                                data.start_date
                                            );
                                            $("#edit_due_date").val(
                                                data.due_date
                                            );
                                            // Populate part_of_project selects and ensure the current project appears
                                            try {
                                                const currentProjectId =
                                                    data.id ||
                                                    $("#edit_project_id").val();
                                                const currentProjectTitle =
                                                    data.title || "";
                                                populatePartOfProjectSelects(
                                                    currentProjectId,
                                                    currentProjectTitle,
                                                    data.part_of_project
                                                );
                                            } catch (_) {
                                                try {
                                                    $(
                                                        "#edit_part_of_project"
                                                    ).val(data.part_of_project);
                                                } catch (_) {}
                                            }

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
                                                        $(
                                                            "#edit_division"
                                                        ).trigger("change");
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
                                                $(
                                                    "#editImageClearBtn"
                                                ).removeClass("d-none");
                                            } else {
                                                $("#editImageLabel").css(
                                                    "background-image",
                                                    "url('" +
                                                        appUrl +
                                                        "/asset/img/background/add-image.png')"
                                                );
                                                $(
                                                    "#editImageLabel"
                                                ).removeClass("has-image");
                                                $("#editImageLabel").css(
                                                    "opacity",
                                                    "0.5"
                                                );
                                                $(
                                                    "#editImageClearBtn"
                                                ).addClass("d-none");
                                            }

                                            // Clear file input for reference file
                                            $("#edit_reference_file").val("");

                                            // --- Reference files preview / management for edit modal (match Task UI) ---
                                            // Normalize existing files array from API (supports reference_files or reference_file)
                                            var existingFiles = Array.isArray(
                                                data.reference_files
                                            )
                                                ? data.reference_files.slice()
                                                : Array.isArray(
                                                      data.reference_file
                                                  )
                                                ? data.reference_file.slice()
                                                : data.reference_file
                                                ? [data.reference_file]
                                                : [];

                                            // Hidden input holds JSON of files to keep
                                            var existingInput =
                                                document.getElementById(
                                                    "existing_reference_files_input"
                                                );
                                            if (!existingInput) {
                                                existingInput =
                                                    document.createElement(
                                                        "input"
                                                    );
                                                existingInput.type = "hidden";
                                                existingInput.id =
                                                    "existing_reference_files_input";
                                                existingInput.name =
                                                    "existing_reference_files";
                                                document
                                                    .getElementById(
                                                        "editProjectForm"
                                                    )
                                                    .appendChild(existingInput);
                                            }
                                            existingInput.value =
                                                JSON.stringify(existingFiles);

                                            // Containers
                                            var previewEdit =
                                                document.getElementById(
                                                    "edit_reference_files_preview"
                                                );
                                            var existingContainer =
                                                document.getElementById(
                                                    "existing_reference_files"
                                                );
                                            if (previewEdit)
                                                previewEdit.innerHTML = "";
                                            if (existingContainer)
                                                existingContainer.innerHTML =
                                                    "";

                                            // Local state for newly selected files
                                            window.editProjectSelectedFiles =
                                                [];

                                            // Render existing files list (Task-style)
                                            function renderExistingProjectFiles() {
                                                if (!existingContainer) return;
                                                existingContainer.innerHTML =
                                                    "";
                                                if (existingFiles.length > 0) {
                                                    var title =
                                                        document.createElement(
                                                            "div"
                                                        );
                                                    title.className =
                                                        "fw-bold mb-2";
                                                    title.textContent =
                                                        "Current Files:";
                                                    existingContainer.appendChild(
                                                        title
                                                    );

                                                    var fileList =
                                                        document.createElement(
                                                            "div"
                                                        );
                                                    fileList.className =
                                                        "existing-files-list w-100";

                                                    existingFiles.forEach(
                                                        function (
                                                            fileName,
                                                            idx
                                                        ) {
                                                            var fileItem =
                                                                document.createElement(
                                                                    "div"
                                                                );
                                                            fileItem.className =
                                                                "existing-file-item d-flex align-items-center justify-content-between mb-2 p-2 bg-light border rounded";

                                                            var fileInfo =
                                                                document.createElement(
                                                                    "div"
                                                                );
                                                            fileInfo.className =
                                                                "d-flex align-items-center flex-grow-1";

                                                            var fileIcon =
                                                                document.createElement(
                                                                    "span"
                                                                );
                                                            fileIcon.className =
                                                                "material-symbols-outlined me-2";
                                                            fileIcon.textContent =
                                                                "description";

                                                            var fileLink =
                                                                document.createElement(
                                                                    "a"
                                                                );
                                                            fileLink.href =
                                                                appUrl +
                                                                "/file/project/" +
                                                                fileName;
                                                            fileLink.textContent =
                                                                fileName;
                                                            fileLink.className =
                                                                "text-decoration-none";
                                                            fileLink.target =
                                                                "_blank";

                                                            var removeBtn =
                                                                document.createElement(
                                                                    "button"
                                                                );
                                                            removeBtn.type =
                                                                "button";
                                                            removeBtn.className =
                                                                "btn btn-sm btn-outline-danger";
                                                            removeBtn.innerHTML =
                                                                "&times;";
                                                            removeBtn.onclick =
                                                                function () {
                                                                    // remove from list and re-render
                                                                    existingFiles =
                                                                        existingFiles.filter(
                                                                            function (
                                                                                f
                                                                            ) {
                                                                                return (
                                                                                    f !==
                                                                                    fileName
                                                                                );
                                                                            }
                                                                        );
                                                                    existingInput.value =
                                                                        JSON.stringify(
                                                                            existingFiles
                                                                        );
                                                                    renderExistingProjectFiles();

                                                                    // update badge count on project card immediately (decrement)
                                                                    try {
                                                                        var pid =
                                                                            data.id;
                                                                        var card =
                                                                            document.querySelector(
                                                                                '[data-project-id="' +
                                                                                    pid +
                                                                                    '"]'
                                                                            );
                                                                        if (
                                                                            card
                                                                        ) {
                                                                            var fileBadge =
                                                                                card.querySelector(
                                                                                    ".project-file-count"
                                                                                );
                                                                            if (
                                                                                fileBadge
                                                                            ) {
                                                                                var cur =
                                                                                    parseInt(
                                                                                        fileBadge.textContent ||
                                                                                            "0",
                                                                                        10
                                                                                    ) ||
                                                                                    0;
                                                                                fileBadge.textContent =
                                                                                    Math.max(
                                                                                        0,
                                                                                        cur -
                                                                                            1
                                                                                    );
                                                                            }
                                                                        }
                                                                    } catch (e) {}
                                                                };

                                                            fileInfo.appendChild(
                                                                fileIcon
                                                            );
                                                            fileInfo.appendChild(
                                                                fileLink
                                                            );
                                                            fileItem.appendChild(
                                                                fileInfo
                                                            );
                                                            fileItem.appendChild(
                                                                removeBtn
                                                            );
                                                            fileList.appendChild(
                                                                fileItem
                                                            );
                                                        }
                                                    );

                                                    existingContainer.appendChild(
                                                        fileList
                                                    );
                                                }
                                            }

                                            // Render newly selected files (Task-style)
                                            function renderEditProjectSelectedFiles() {
                                                if (!previewEdit) return;
                                                previewEdit.innerHTML = "";

                                                if (
                                                    window
                                                        .editProjectSelectedFiles
                                                        .length > 0
                                                ) {
                                                    var fileList =
                                                        document.createElement(
                                                            "div"
                                                        );
                                                    fileList.className =
                                                        "selected-files-list mt-2";

                                                    window.editProjectSelectedFiles.forEach(
                                                        function (file, index) {
                                                            var fileItem =
                                                                document.createElement(
                                                                    "div"
                                                                );
                                                            fileItem.className =
                                                                "selected-file-item d-flex align-items-center justify-content-between mb-2 p-2 bg-light border rounded";

                                                            var fileInfo =
                                                                document.createElement(
                                                                    "div"
                                                                );
                                                            fileInfo.className =
                                                                "d-flex align-items-center flex-grow-1";

                                                            var fileIcon =
                                                                document.createElement(
                                                                    "span"
                                                                );
                                                            fileIcon.className =
                                                                "material-symbols-outlined me-2";
                                                            fileIcon.textContent =
                                                                "description";

                                                            var fileName =
                                                                document.createElement(
                                                                    "span"
                                                                );
                                                            fileName.textContent =
                                                                file.name;
                                                            fileName.className =
                                                                "file-name";

                                                            var fileSize =
                                                                document.createElement(
                                                                    "small"
                                                                );
                                                            fileSize.textContent =
                                                                " (" +
                                                                (
                                                                    file.size /
                                                                    1024 /
                                                                    1024
                                                                ).toFixed(2) +
                                                                " MB)";
                                                            fileSize.className =
                                                                "text-muted ms-1";

                                                            var removeBtn =
                                                                document.createElement(
                                                                    "button"
                                                                );
                                                            removeBtn.type =
                                                                "button";
                                                            removeBtn.className =
                                                                "btn btn-sm btn-outline-danger";
                                                            removeBtn.innerHTML =
                                                                "&times;";
                                                            removeBtn.onclick =
                                                                function () {
                                                                    window.editProjectSelectedFiles.splice(
                                                                        index,
                                                                        1
                                                                    );
                                                                    renderEditProjectSelectedFiles();
                                                                };

                                                            fileInfo.appendChild(
                                                                fileIcon
                                                            );
                                                            fileInfo.appendChild(
                                                                fileName
                                                            );
                                                            fileInfo.appendChild(
                                                                fileSize
                                                            );
                                                            fileItem.appendChild(
                                                                fileInfo
                                                            );
                                                            fileItem.appendChild(
                                                                removeBtn
                                                            );
                                                            fileList.appendChild(
                                                                fileItem
                                                            );
                                                        }
                                                    );

                                                    previewEdit.appendChild(
                                                        fileList
                                                    );
                                                }
                                            }

                                            // Bind change handler for selecting new files (Task-style behavior)
                                            $("#edit_reference_file")
                                                .off("change")
                                                .on("change", function () {
                                                    var files = Array.from(
                                                        this.files || []
                                                    );
                                                    if (files.length > 0) {
                                                        window.editProjectSelectedFiles =
                                                            window.editProjectSelectedFiles.concat(
                                                                files
                                                            );
                                                        renderEditProjectSelectedFiles();
                                                        this.value = "";
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
                                                var coAuthors =
                                                    data.co_authors.map(
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
                                                    data.contributors.map(
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
                                                showFloatingAlert(
                                                    "Edit Project Modal element not found",
                                                    "warning",
                                                    3500
                                                );
                                                return;
                                            }
                                            const editProjectModal =
                                                bootstrap &&
                                                bootstrap.Modal &&
                                                bootstrap.Modal
                                                    .getOrCreateInstance
                                                    ? bootstrap.Modal.getOrCreateInstance(
                                                          editProjectModalEl
                                                      )
                                                    : bootstrap.Modal.getInstance(
                                                          editProjectModalEl
                                                      ) ||
                                                      new bootstrap.Modal(
                                                          editProjectModalEl
                                                      );
                                            editProjectModal.show();
                                        },
                                    });
                                }
                            }
                        });
                    }

                    // Handle edit project form submission
                    let isSubmitting = false;

                    $("#editProjectForm")
                        .off("submit")
                        .on("submit", function (e) {
                            e.preventDefault();

                            if (isSubmitting) return; // ⛔ cegah submit dobel
                            isSubmitting = true;

                            const projectId = $("#edit_project_id").val();
                            if (!projectId) {
                                showFloatingAlert(
                                    "Project ID is missing.",
                                    "warning",
                                    3000
                                );
                                isSubmitting = false;
                                return;
                            }

                            const formData = new FormData(this);

                            // Map first non-empty reference_urls[] to single reference_url (backend expects this)
                            try {
                                const urlInputs = this.querySelectorAll(
                                    'input[name="reference_urls[]"]'
                                );
                                const urls = Array.from(urlInputs)
                                    .map((i) => (i.value || "").trim())
                                    .filter(Boolean);
                                if (urls.length)
                                    formData.set("reference_url", urls[0]);
                                else formData.set("reference_url", "");
                            } catch (_) {}

                            // Add _method to FormData for Laravel PUT request
                            formData.append("_method", "PUT");

                            // ✅ Filter unique IDs untuk co-authors & contributors
                            let coAuthors = JSON.parse(
                                $("#edit_co_author").val() || "[]"
                            );
                            let contributors = JSON.parse(
                                $("#edit_contributors").val() || "[]"
                            );

                            coAuthors = [...new Set(coAuthors)];
                            contributors = [...new Set(contributors)];

                            formData.set(
                                "co_author",
                                JSON.stringify(coAuthors)
                            );
                            formData.set(
                                "contributors",
                                JSON.stringify(contributors)
                            );

                            // Append newly selected reference files (if any) to FormData as reference_file[]
                            if (
                                window.editProjectSelectedFiles &&
                                window.editProjectSelectedFiles.length
                            ) {
                                window.editProjectSelectedFiles.forEach(
                                    function (f) {
                                        try {
                                            formData.append(
                                                "reference_file[]",
                                                f
                                            );
                                        } catch (e) {
                                            console.warn(
                                                "Failed to append new reference file to FormData",
                                                e
                                            );
                                        }
                                    }
                                );
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
                                    showFloatingAlert(
                                        response.message ||
                                            "Project updated successfully!",
                                        "success",
                                        1500
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
                                        loadProjectCardData(); // refresh project cards
                                    }, 800);
                                },
                                error: function (xhr) {
                                    if (xhr.status === 422) {
                                        let errors = xhr.responseJSON.errors;
                                        var listHtml =
                                            '<ul style="margin:0; padding-left:18px;">';
                                        $.each(errors, function (key, value) {
                                            if (Array.isArray(value)) {
                                                value.forEach(function (msg) {
                                                    listHtml +=
                                                        "<li>" + msg + "</li>";
                                                });
                                            } else {
                                                listHtml +=
                                                    "<li>" + value + "</li>";
                                            }
                                        });
                                        listHtml += "</ul>";
                                        showFloatingAlert(
                                            listHtml,
                                            "warning",
                                            5000
                                        );
                                    } else {
                                        showFloatingAlert(
                                            "Failed to update project.",
                                            "warning",
                                            3500
                                        );
                                    }
                                },
                                complete: function () {
                                    $("#editModalLoader").addClass("d-none");
                                    submitBtn.prop("disabled", false);
                                    isSubmitting = false; // reset flag biar bisa submit lagi
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
                            loadCardProjects();

                            // Clear selected co-authors and contributors display and hidden inputs
                            window.clearSelectedCoAuthorsEdit &&
                                window.clearSelectedCoAuthorsEdit();
                            window.clearSelectedContributorsEdit &&
                                window.clearSelectedContributorsEdit();

                            // Clear temporary reference files arrays and preview list (Task-style containers)
                            try {
                                window.editProjectSelectedFiles = [];
                                const previewEdit = document.getElementById(
                                    "edit_reference_files_preview"
                                );
                                if (previewEdit) previewEdit.innerHTML = "";
                                const existingContainer =
                                    document.getElementById(
                                        "existing_reference_files"
                                    );
                                if (existingContainer)
                                    existingContainer.innerHTML = "";
                                const hiddenExisting = document.getElementById(
                                    "existing_reference_files_input"
                                );
                                if (hiddenExisting) hiddenExisting.value = "[]";
                                $("#edit_reference_file").off("change");
                            } catch (e) {}

                            $("#editProjectAlert").addClass("d-none").hide();

                            // Safety: remove stray backdrops if no other modal is open
                            try {
                                const anyOpen =
                                    document.querySelector(".modal.show");
                                if (!anyOpen) {
                                    document
                                        .querySelectorAll(".modal-backdrop")
                                        .forEach(function (el) {
                                            el.parentNode &&
                                                el.parentNode.removeChild(el);
                                        });
                                    document.body.classList.remove(
                                        "modal-open"
                                    );
                                    document.body.style.removeProperty(
                                        "padding-right"
                                    );
                                }
                            } catch (_) {}
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
                        let isDropdownOpen = false;

                        function fetchEmployees(query = "") {
                            const currentEmployeeId =
                                document
                                    .getElementById("editProjectModal")
                                    ?.getAttribute("data-employee-id") || "";
                            $.ajax({
                                url: appUrl + "/employees-for-projects",
                                type: "GET",
                                data: {
                                    query: query,
                                    exclude_employee_id: currentEmployeeId,
                                },
                                dataType: "json",
                                timeout: 10000, // 10 second timeout
                                success: function (data) {
                                    employees = (data.data || []).map(function (
                                        e
                                    ) {
                                        const candidate =
                                            e.profile_picture_url ||
                                            e.profile_picture ||
                                            e.user_photo;
                                        e.user_photo = candidate;
                                        return e;
                                    });
                                    filteredEmployees = employees;
                                    renderDropdown();
                                },
                                error: function (xhr, status, error) {
                                    handleEmployeeLoadError(
                                        xhr,
                                        status,
                                        error,
                                        "Edit Project"
                                    );

                                    // Provide fallback with empty list
                                    employees = [];
                                    filteredEmployees = [];
                                    renderDropdown();
                                },
                            });
                        }
                        window.__refreshEditProjectEmployees = function () {
                            fetchEmployees(
                                document.getElementById("edit_co_author_input")
                                    ?.value || ""
                            );
                        };

                        function renderDropdown() {
                            if (filteredEmployees.length === 0) {
                                dropdown.innerHTML =
                                    '<div class="dropdown-item disabled">No employees found</div>';
                                dropdown.style.display = isDropdownOpen
                                    ? "block"
                                    : "none";
                                return;
                            }

                            // Exclude employees already selected as Contributors
                            function getContributorIds() {
                                try {
                                    const raw =
                                        document.getElementById(
                                            "edit_contributors"
                                        )?.value || "[]";
                                    const arr = JSON.parse(raw);
                                    return Array.isArray(arr)
                                        ? arr.map((v) => Number(v))
                                        : [];
                                } catch (_) {
                                    return [];
                                }
                            }
                            const contributorIds = getContributorIds();
                            const availableEmployees = filteredEmployees.filter(
                                (emp) =>
                                    !contributorIds.includes(Number(emp.id))
                            );

                            const html = availableEmployees
                                .map((emp) => {
                                    const isChecked = selectedEmployees.some(
                                        (e) => e.id === emp.id
                                    );

                                    // Atur default user_photo jika kosong
                                    if (!emp.user_photo) {
                                        emp.user_photo =
                                            "/asset/img/avatar.png"; // relatif terhadap appUrl
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
                            dropdown.style.display = isDropdownOpen
                                ? "block"
                                : "none";

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
                                            // Ensure contributors exclude any selected co-authors
                                            try {
                                                window.syncContributorsWithCoAuthors &&
                                                    window.syncContributorsWithCoAuthors();
                                            } catch (_) {}
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
                                    appUrl + "/asset/img/avatar.png";
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
                                    // Ensure contributors exclude any selected co-authors
                                    try {
                                        window.syncContributorsWithCoAuthors &&
                                            window.syncContributorsWithCoAuthors();
                                    } catch (_) {}
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
                            isDropdownOpen = true;
                            filterEmployees(this.value);
                        });

                        input.addEventListener("focus", function () {
                            isDropdownOpen = true;
                            filterEmployees(this.value);
                        });

                        document.addEventListener("click", function (e) {
                            if (
                                !input.contains(e.target) &&
                                !dropdown.contains(e.target)
                            ) {
                                isDropdownOpen = false;
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

                        // Helper: build unified avatar URL (profile_picture_url > profile_picture > user_photo)
                        function buildAvatarUrl(raw) {
                            if (!raw) return appUrl + "/asset/img/avatar.png";
                            try {
                                raw = String(raw).trim();
                                const trimmed = raw.replace(/^\/+/, "");
                                if (/^https?:\/\//i.test(raw)) return raw;
                                if (/^(file\/|asset\/|storage\/)/.test(trimmed))
                                    return appUrl + "/" + trimmed;
                                if (raw.startsWith("/")) return appUrl + raw;
                                if (raw.indexOf("/") !== -1)
                                    return appUrl + "/" + trimmed;
                                return appUrl + "/file/profile_picture/" + raw;
                            } catch (_) {
                                return appUrl + "/asset/img/avatar.png";
                            }
                        }

                        window.setSelectedCoAuthorsEdit = function (coAuthors) {
                            // Filter out anyone already selected as contributor
                            let contribIds = [];
                            try {
                                const raw =
                                    document.getElementById("edit_contributors")
                                        ?.value || "[]";
                                const arr = JSON.parse(raw);
                                contribIds = Array.isArray(arr)
                                    ? arr.map((v) => Number(v))
                                    : [];
                            } catch (_) {
                                contribIds = [];
                            }

                            selectedEmployees = coAuthors
                                .filter(
                                    (ca) => !contribIds.includes(Number(ca.id))
                                )
                                .map((ca) => {
                                    const candidate =
                                        ca.profile_picture_url ||
                                        ca.profile_picture ||
                                        ca.user_photo;
                                    return {
                                        id: ca.id,
                                        name: ca.name,
                                        user_photo: buildAvatarUrl(candidate),
                                    };
                                });
                            renderSelected();
                            updateHiddenInput();
                            // After programmatically setting co-authors, sync contributors and refresh dropdown
                            try {
                                window.syncContributorsWithCoAuthors &&
                                    window.syncContributorsWithCoAuthors();
                            } catch (_) {}
                            renderDropdown();
                        };

                        // Expose sync function to be called when contributors change
                        window.syncCoAuthorsWithContributors = function () {
                            const contributorIds = (function () {
                                try {
                                    const raw =
                                        document.getElementById(
                                            "edit_contributors"
                                        )?.value || "[]";
                                    const arr = JSON.parse(raw);
                                    return Array.isArray(arr)
                                        ? arr.map((v) => Number(v))
                                        : [];
                                } catch (_) {
                                    return [];
                                }
                            })();
                            const before = selectedEmployees.length;
                            selectedEmployees = selectedEmployees.filter(
                                (se) => !contributorIds.includes(Number(se.id))
                            );
                            if (selectedEmployees.length !== before) {
                                renderSelected();
                                updateHiddenInput();
                            }
                            renderDropdown();
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
                        let isDropdownOpen = false;

                        function fetchEmployees(query = "") {
                            const currentEmployeeId =
                                document
                                    .getElementById("editProjectModal")
                                    ?.getAttribute("data-employee-id") || "";
                            $.ajax({
                                url: appUrl + "/employees-for-projects",
                                type: "GET",
                                data: {
                                    query: query,
                                    exclude_employee_id: currentEmployeeId,
                                },
                                dataType: "json",
                                timeout: 10000, // 10 second timeout
                                success: function (data) {
                                    employees = (data.data || []).map(function (
                                        e
                                    ) {
                                        const candidate =
                                            e.profile_picture_url ||
                                            e.profile_picture ||
                                            e.user_photo;
                                        e.user_photo = candidate;
                                        return e;
                                    });
                                    filteredEmployees = employees;
                                    renderDropdown();
                                },
                                error: function (xhr, status, error) {
                                    handleEmployeeLoadError(
                                        xhr,
                                        status,
                                        error,
                                        "Edit Contributors"
                                    );

                                    // Provide fallback with empty list
                                    employees = [];
                                    filteredEmployees = [];
                                    renderDropdown();
                                },
                            });
                        }
                        window.__refreshEditProjectEmployees = (function (
                            orig
                        ) {
                            return function () {
                                if (typeof orig === "function") orig();
                                fetchEmployees(
                                    document.getElementById(
                                        "edit_contributor_input"
                                    )?.value || ""
                                );
                            };
                        })(window.__refreshEditProjectEmployees);

                        function renderDropdown() {
                            if (filteredEmployees.length === 0) {
                                dropdown.innerHTML =
                                    '<div class="dropdown-item disabled">No employees found</div>';
                                dropdown.style.display = isDropdownOpen
                                    ? "block"
                                    : "none";
                                return;
                            }

                            // Exclude employees already selected as co-authors
                            function getCoAuthorIds() {
                                try {
                                    const raw =
                                        document.getElementById(
                                            "edit_co_author"
                                        )?.value || "[]";
                                    const arr = JSON.parse(raw);
                                    return Array.isArray(arr)
                                        ? arr.map((v) => Number(v))
                                        : [];
                                } catch (_) {
                                    return [];
                                }
                            }
                            const coAuthorIds = getCoAuthorIds();
                            const availableEmployees = filteredEmployees.filter(
                                (emp) => !coAuthorIds.includes(Number(emp.id))
                            );

                            const html = availableEmployees
                                .map((emp) => {
                                    const isChecked = selectedEmployees.some(
                                        (e) => e.id === emp.id
                                    );

                                    // Pastikan user_photo ada, jika tidak set default
                                    if (!emp.user_photo) {
                                        emp.user_photo =
                                            "/asset/img/avatar.png"; // relatif terhadap appUrl
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
                            dropdown.style.display = isDropdownOpen
                                ? "block"
                                : "none";

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
                                            // Ensure co-authors exclude any selected contributors
                                            try {
                                                window.syncCoAuthorsWithContributors &&
                                                    window.syncCoAuthorsWithContributors();
                                            } catch (_) {}
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
                                    appUrl + "/asset/img/avatar.png";
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
                                    // After removing a contributor, refresh co-author dropdown availability
                                    try {
                                        window.syncCoAuthorsWithContributors &&
                                            window.syncCoAuthorsWithContributors();
                                    } catch (_) {}
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
                            isDropdownOpen = true;
                            filterEmployees(this.value);
                        });

                        input.addEventListener("focus", function () {
                            isDropdownOpen = true;
                            filterEmployees(this.value);
                        });

                        document.addEventListener("click", function (e) {
                            if (
                                !input.contains(e.target) &&
                                !dropdown.contains(e.target)
                            ) {
                                isDropdownOpen = false;
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
                            // Filter out anyone already selected as co-author
                            let coIds = [];
                            try {
                                const raw =
                                    document.getElementById("edit_co_author")
                                        ?.value || "[]";
                                const arr = JSON.parse(raw);
                                coIds = Array.isArray(arr)
                                    ? arr.map((v) => Number(v))
                                    : [];
                            } catch (_) {
                                coIds = [];
                            }

                            selectedEmployees = contributors
                                .filter((c) => !coIds.includes(Number(c.id)))
                                .map((ca) => {
                                    const candidate =
                                        ca.profile_picture_url ||
                                        ca.profile_picture ||
                                        ca.user_photo;
                                    return {
                                        id: ca.id,
                                        name: ca.name,
                                        user_photo: buildAvatarUrl(candidate),
                                    };
                                });
                            renderSelected();
                            updateHiddenInput();
                            // After programmatically setting contributors, sync co-authors
                            try {
                                window.syncCoAuthorsWithContributors &&
                                    window.syncCoAuthorsWithContributors();
                            } catch (_) {}
                        };

                        // Expose sync function to be called when co-authors change
                        window.syncContributorsWithCoAuthors = function () {
                            const coAuthorIds = (function () {
                                try {
                                    const raw =
                                        document.getElementById(
                                            "edit_co_author"
                                        )?.value || "[]";
                                    const arr = JSON.parse(raw);
                                    return Array.isArray(arr)
                                        ? arr.map((v) => Number(v))
                                        : [];
                                } catch (_) {
                                    return [];
                                }
                            })();
                            const before = selectedEmployees.length;
                            selectedEmployees = selectedEmployees.filter(
                                (se) => !coAuthorIds.includes(Number(se.id))
                            );
                            if (selectedEmployees.length !== before) {
                                renderSelected();
                                updateHiddenInput();
                            }
                            renderDropdown();
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

                    // Helper to resolve footer element across possible class names (match Task behavior)
                    function getProjectFeedbackFooter() {
                        try {
                            return (
                                projectFeedbackModalEl.querySelector(
                                    ".feedback-modal-footer"
                                ) ||
                                projectFeedbackModalEl.querySelector(
                                    ".modal-footer"
                                ) ||
                                projectFeedbackModalEl.querySelector(
                                    ".modal-footer-custom"
                                )
                            );
                        } catch (_) {
                            return null;
                        }
                    }

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
                                // Ensure dialog element is available for height toggling
                                const dialogEl =
                                    projectFeedbackModalEl.closest(
                                        ".modal-dialog"
                                    );

                                // Update feedback badge count on project card
                                const card = document.querySelector(
                                    `[data-project-id="${projectId}"]`
                                );
                                if (card) {
                                    const feedbackBadge = card.querySelector(
                                        ".project-feedback-count"
                                    );
                                    if (feedbackBadge) {
                                        const feedbackCount =
                                            (data.data && data.data.length) ||
                                            0;
                                        feedbackBadge.textContent =
                                            feedbackCount;
                                    }
                                }

                                if (!data.data || data.data.length === 0) {
                                    modalBody.innerHTML =
                                        '<p class="text-center text-muted">No feedback available for this project.</p>';
                                    // Shrink modal height when empty
                                    if (dialogEl)
                                        dialogEl.classList.add("compact");
                                    return;
                                } else {
                                    // Ensure default height when there is content
                                    if (dialogEl)
                                        dialogEl.classList.remove("compact");
                                }

                                // Render feedback items
                                data.data.forEach((feedback) => {
                                    const feedbackItem =
                                        document.createElement("div");
                                    feedbackItem.className =
                                        "feedback-item mb-3 p-3 border-bottom";
                                    if (feedback && feedback.id != null) {
                                        feedbackItem.setAttribute(
                                            "data-feedback-id",
                                            String(feedback.id)
                                        );
                                    }

                                    // Header with employee info
                                    const headerDiv =
                                        document.createElement("div");
                                    headerDiv.className =
                                        "d-flex align-items-center mb-2";

                                    const img = document.createElement("img");
                                    // Prefer employee object if present, fallback to legacy employee_photo
                                    (function () {
                                        const emp = feedback.employee || {};
                                        const raw =
                                            emp.user_photo ||
                                            emp.profile_picture ||
                                            emp.photo ||
                                            feedback.employee_photo ||
                                            "";
                                        let url = "";
                                        if (
                                            typeof raw === "string" &&
                                            raw.length > 0
                                        ) {
                                            if (raw.startsWith("http"))
                                                url = raw;
                                            else if (raw.startsWith("/"))
                                                url = appUrl + raw;
                                            else if (raw.indexOf("/") !== -1)
                                                url = appUrl + "/" + raw;
                                            else
                                                url =
                                                    appUrl +
                                                    "/file/profile_picture/" +
                                                    raw;
                                        } else {
                                            url =
                                                appUrl +
                                                "/asset/img/avatar.png";
                                        }
                                        img.src = url;
                                    })();
                                    img.alt = "Employee Photo";
                                    img.className =
                                        "feedback-employee-photo me-2 rounded-circle";
                                    img.style.width = "40px";
                                    img.style.height = "40px";

                                    const infoDiv =
                                        document.createElement("div");
                                    // Determine author/edit permissions early (used for placing edit icon next to name like Task)
                                    const currentEmployeeIdTop =
                                        parseInt(
                                            projectFeedbackModalEl.getAttribute(
                                                "data-employee-id"
                                            ) || "0",
                                            10
                                        ) || 0;
                                    const authorIdTop =
                                        feedback.employee_id != null
                                            ? feedback.employee_id
                                            : (feedback.employee &&
                                                  feedback.employee.id) ||
                                              0;
                                    const canEditTopInline =
                                        String(authorIdTop) ===
                                        String(currentEmployeeIdTop);
                                    // Name row with edit icon inline (exactly like Task)
                                    const nameRow =
                                        document.createElement("div");
                                    nameRow.className =
                                        "d-flex align-items-center";
                                    const nameStrong =
                                        document.createElement("strong");
                                    nameStrong.textContent =
                                        (feedback.employee &&
                                            feedback.employee.name) ||
                                        feedback.employee_name ||
                                        "Unknown";
                                    nameRow.appendChild(nameStrong);

                                    // Store edit button data for later positioning
                                    let editBtnInline = null;
                                    if (canEditTopInline) {
                                        editBtnInline =
                                            document.createElement("span");
                                        editBtnInline.className =
                                            "material-symbols-outlined icon feedback-edit-trigger ms-2";
                                        editBtnInline.style.cssText =
                                            "cursor:pointer; font-size:18px; line-height:1; color:#555;";
                                        editBtnInline.textContent = "edit";
                                        editBtnInline.addEventListener(
                                            "click",
                                            function () {
                                                const payload = {
                                                    id: feedback.id,
                                                    parent_id: null,
                                                    feedback_comment:
                                                        feedback.feedback_comment ||
                                                        "",
                                                    reference_url:
                                                        feedback.reference_url ||
                                                        "",
                                                    reference_urls:
                                                        feedback.reference_urls ||
                                                        [],
                                                    reference_file_url:
                                                        feedback.reference_file ||
                                                        "",
                                                    reference_files_urls:
                                                        (function () {
                                                            let files = [];
                                                            let rf =
                                                                feedback.reference_files;
                                                            if (
                                                                !Array.isArray(
                                                                    rf
                                                                ) &&
                                                                typeof rf ===
                                                                    "string"
                                                            ) {
                                                                try {
                                                                    const arr =
                                                                        JSON.parse(
                                                                            rf
                                                                        );
                                                                    if (
                                                                        Array.isArray(
                                                                            arr
                                                                        )
                                                                    )
                                                                        rf =
                                                                            arr;
                                                                } catch (_) {}
                                                            }
                                                            if (
                                                                Array.isArray(
                                                                    rf
                                                                ) &&
                                                                rf.length
                                                            ) {
                                                                files = rf
                                                                    .map(
                                                                        function (
                                                                            f
                                                                        ) {
                                                                            if (
                                                                                !f
                                                                            )
                                                                                return null;
                                                                            const isAbs =
                                                                                typeof f ===
                                                                                    "string" &&
                                                                                (f.startsWith(
                                                                                    "http://"
                                                                                ) ||
                                                                                    f.startsWith(
                                                                                        "https://"
                                                                                    ));
                                                                            const isPath =
                                                                                typeof f ===
                                                                                    "string" &&
                                                                                (f.startsWith(
                                                                                    "/file/project/"
                                                                                ) ||
                                                                                    f.startsWith(
                                                                                        "file/project/"
                                                                                    ));
                                                                            if (
                                                                                !isAbs &&
                                                                                !isPath
                                                                            )
                                                                                return (
                                                                                    appUrl +
                                                                                    "/file/project/" +
                                                                                    f
                                                                                );
                                                                            if (
                                                                                !isAbs &&
                                                                                isPath
                                                                            )
                                                                                return f.startsWith(
                                                                                    "/"
                                                                                )
                                                                                    ? appUrl +
                                                                                          f
                                                                                    : appUrl +
                                                                                          "/" +
                                                                                          f;
                                                                            return f;
                                                                        }
                                                                    )
                                                                    .filter(
                                                                        Boolean
                                                                    );
                                                            } else if (
                                                                feedback.reference_file
                                                            ) {
                                                                let single =
                                                                    feedback.reference_file;
                                                                const isAbs2 =
                                                                    typeof single ===
                                                                        "string" &&
                                                                    (single.startsWith(
                                                                        "http://"
                                                                    ) ||
                                                                        single.startsWith(
                                                                            "https://"
                                                                        ));
                                                                const isPath2 =
                                                                    typeof single ===
                                                                        "string" &&
                                                                    (single.startsWith(
                                                                        "/file/project/"
                                                                    ) ||
                                                                        single.startsWith(
                                                                            "file/project/"
                                                                        ));
                                                                if (
                                                                    !isAbs2 &&
                                                                    !isPath2
                                                                )
                                                                    single =
                                                                        appUrl +
                                                                        "/file/project/" +
                                                                        single;
                                                                else if (
                                                                    !isAbs2 &&
                                                                    isPath2
                                                                )
                                                                    single =
                                                                        single.startsWith(
                                                                            "/"
                                                                        )
                                                                            ? appUrl +
                                                                              single
                                                                            : appUrl +
                                                                              "/" +
                                                                              single;
                                                                files = [
                                                                    single,
                                                                ];
                                                            }
                                                            return files;
                                                        })(),
                                                    image_url: (function () {
                                                        const img =
                                                            feedback.image ||
                                                            "";
                                                        if (!img) return "";
                                                        if (
                                                            String(
                                                                img
                                                            ).startsWith("http")
                                                        )
                                                            return img;
                                                        if (
                                                            String(
                                                                img
                                                            ).startsWith("/")
                                                        )
                                                            return appUrl + img;
                                                        return (
                                                            appUrl +
                                                            "/file/project/" +
                                                            img
                                                        );
                                                    })(),
                                                };
                                                showEditFeedbackForm(
                                                    projectId,
                                                    payload,
                                                    false
                                                );
                                            }
                                        );
                                    }

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

                                    infoDiv.appendChild(nameRow);
                                    infoDiv.appendChild(dateDiv);
                                    infoDiv.appendChild(roleDiv);
                                    // Wrap left side like Task: avatar + (name/date)
                                    const leftWrap =
                                        document.createElement("div");
                                    leftWrap.className =
                                        "d-flex align-items-center";
                                    leftWrap.appendChild(img);
                                    leftWrap.appendChild(infoDiv);
                                    // Prepare header container
                                    headerDiv.className =
                                        "d-flex align-items-center mb-2";
                                    headerDiv.appendChild(leftWrap);

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
                                        feedback.reference_urls ||
                                        feedback.reference_file ||
                                        (Array.isArray(
                                            feedback.reference_files
                                        ) &&
                                            feedback.reference_files.length > 0)
                                    ) {
                                        const refContainer =
                                            document.createElement("div");
                                        refContainer.className =
                                            "feedback-reference-container";

                                        // Render one or multiple reference URLs
                                        (function () {
                                            let urls = [];
                                            if (
                                                Array.isArray(
                                                    feedback.reference_urls
                                                )
                                            )
                                                urls = feedback.reference_urls;
                                            else if (
                                                feedback.reference_urls &&
                                                typeof feedback.reference_urls ===
                                                    "string"
                                            ) {
                                                try {
                                                    const arr = JSON.parse(
                                                        feedback.reference_urls
                                                    );
                                                    if (Array.isArray(arr))
                                                        urls = arr;
                                                } catch (_) {}
                                            }
                                            if (
                                                (!urls || urls.length === 0) &&
                                                feedback.reference_url
                                            )
                                                urls = [feedback.reference_url];
                                            urls.forEach((u, idx) => {
                                                const a =
                                                    document.createElement("a");
                                                a.href = u;
                                                a.target = "_blank";
                                                a.className =
                                                    "feedback-reference-url me-2";
                                                a.innerHTML = `<span class="material-symbols-outlined">link</span> Link ${
                                                    idx + 1
                                                }`;
                                                refContainer.appendChild(a);
                                            });
                                        })();

                                        // Render multiple reference files
                                        (function () {
                                            let files = [];
                                            let rf = feedback.reference_files;
                                            if (
                                                !Array.isArray(rf) &&
                                                typeof rf === "string"
                                            ) {
                                                try {
                                                    const arr = JSON.parse(rf);
                                                    if (Array.isArray(arr))
                                                        rf = arr;
                                                } catch (_) {}
                                            }
                                            if (Array.isArray(rf) && rf.length)
                                                files = rf;
                                            else if (feedback.reference_file)
                                                files = [
                                                    feedback.reference_file,
                                                ];
                                            (files || []).forEach(function (
                                                file,
                                                idx
                                            ) {
                                                if (!file) return;
                                                let fileHref = file;
                                                if (
                                                    fileHref &&
                                                    !(
                                                        String(
                                                            fileHref
                                                        ).startsWith("http") ||
                                                        String(
                                                            fileHref
                                                        ).startsWith("/")
                                                    )
                                                ) {
                                                    fileHref =
                                                        appUrl +
                                                        "/file/project/" +
                                                        fileHref;
                                                } else if (
                                                    fileHref &&
                                                    String(fileHref).startsWith(
                                                        "/"
                                                    )
                                                ) {
                                                    fileHref =
                                                        appUrl + fileHref;
                                                }
                                                const a =
                                                    document.createElement("a");
                                                a.href = fileHref;
                                                a.download = "";
                                                a.className =
                                                    "feedback-reference-file ms-2";
                                                a.innerHTML = `<span class=\"material-symbols-outlined\">draft</span> FILE ${
                                                    idx + 1
                                                }`;
                                                refContainer.appendChild(a);
                                            });
                                        })();

                                        mediaDiv.appendChild(refContainer);
                                    }

                                    if (feedback.image) {
                                        const feedbackImage =
                                            document.createElement("img");
                                        // Normalize image URL
                                        let imgSrc = feedback.image;
                                        if (
                                            imgSrc &&
                                            !(
                                                String(imgSrc).startsWith(
                                                    "http"
                                                ) ||
                                                String(imgSrc).startsWith("/")
                                            )
                                        ) {
                                            imgSrc =
                                                appUrl +
                                                "/file/project/" +
                                                imgSrc;
                                        } else if (
                                            imgSrc &&
                                            String(imgSrc).startsWith("/")
                                        ) {
                                            imgSrc = appUrl + imgSrc;
                                        }
                                        feedbackImage.src = imgSrc;
                                        feedbackImage.alt = "Feedback Image";
                                        feedbackImage.className =
                                            "feedback-image me-2 mb-4";
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

                                    // Store reply button for later positioning
                                    const replyBtn =
                                        document.createElement("span");
                                    replyBtn.className =
                                        "material-symbols-outlined feedback-reply-trigger";
                                    replyBtn.style.cssText =
                                        "cursor:pointer; font-size:18px; line-height:1; color:rgb(85, 85, 85);";
                                    replyBtn.textContent = "reply";
                                    replyBtn.addEventListener(
                                        "click",
                                        function () {
                                            showReplyFeedbackForm(
                                                projectId,
                                                feedback.id
                                            );
                                        }
                                    );

                                    // Append sections
                                    feedbackItem.appendChild(headerDiv);
                                    feedbackItem.appendChild(commentDiv);
                                    feedbackItem.appendChild(mediaDiv);

                                    // Create actions container for edit and reply buttons
                                    const actionsDiv =
                                        document.createElement("div");
                                    actionsDiv.className =
                                        "feedback-actions mt-2 d-flex gap-3";

                                    // Add edit button if exists
                                    if (editBtnInline) {
                                        // Store the original event listener
                                        const editClickHandler =
                                            editBtnInline.onclick ||
                                            function () {};

                                        // Create edit button wrapper with icon + text
                                        const editWrapper =
                                            document.createElement("span");
                                        editWrapper.className =
                                            "d-flex align-items-center";
                                        editWrapper.style.cssText =
                                            "cursor:pointer; color:#555; font-size:12px;";

                                        // Recreate edit icon
                                        const editIcon =
                                            document.createElement("span");
                                        editIcon.className =
                                            "material-symbols-outlined feedback-edit-trigger";
                                        editIcon.style.cssText =
                                            "font-size:18px; line-height:1; margin-right:5px;";
                                        editIcon.textContent = "edit";

                                        const editText =
                                            document.createElement("span");
                                        editText.textContent = "Edit";

                                        editWrapper.appendChild(editIcon);
                                        editWrapper.appendChild(editText);

                                        // Add click handler to wrapper
                                        editWrapper.addEventListener(
                                            "click",
                                            function () {
                                                const payload = {
                                                    id: feedback.id,
                                                    parent_id: null,
                                                    feedback_comment:
                                                        feedback.feedback_comment ||
                                                        "",
                                                    reference_url:
                                                        feedback.reference_url ||
                                                        "",
                                                    reference_urls:
                                                        feedback.reference_urls ||
                                                        [],
                                                    reference_file_url:
                                                        feedback.reference_file ||
                                                        "",
                                                    reference_files_urls:
                                                        (function () {
                                                            let files = [];
                                                            let rf =
                                                                feedback.reference_files;
                                                            if (
                                                                !Array.isArray(
                                                                    rf
                                                                ) &&
                                                                typeof rf ===
                                                                    "string"
                                                            ) {
                                                                try {
                                                                    const arr =
                                                                        JSON.parse(
                                                                            rf
                                                                        );
                                                                    if (
                                                                        Array.isArray(
                                                                            arr
                                                                        )
                                                                    )
                                                                        rf =
                                                                            arr;
                                                                } catch (_) {}
                                                            }
                                                            if (
                                                                Array.isArray(
                                                                    rf
                                                                ) &&
                                                                rf.length
                                                            ) {
                                                                files = rf
                                                                    .map(
                                                                        function (
                                                                            f
                                                                        ) {
                                                                            if (
                                                                                !f
                                                                            )
                                                                                return null;
                                                                            const isAbs =
                                                                                typeof f ===
                                                                                    "string" &&
                                                                                (f.startsWith(
                                                                                    "http://"
                                                                                ) ||
                                                                                    f.startsWith(
                                                                                        "https://"
                                                                                    ));
                                                                            const isPath =
                                                                                typeof f ===
                                                                                    "string" &&
                                                                                (f.startsWith(
                                                                                    "/file/project/"
                                                                                ) ||
                                                                                    f.startsWith(
                                                                                        "file/project/"
                                                                                    ));
                                                                            if (
                                                                                !isAbs &&
                                                                                !isPath
                                                                            )
                                                                                return (
                                                                                    appUrl +
                                                                                    "/file/project/" +
                                                                                    f
                                                                                );
                                                                            if (
                                                                                !isAbs &&
                                                                                isPath
                                                                            )
                                                                                return f.startsWith(
                                                                                    "/"
                                                                                )
                                                                                    ? appUrl +
                                                                                          f
                                                                                    : appUrl +
                                                                                          "/" +
                                                                                          f;
                                                                            return f;
                                                                        }
                                                                    )
                                                                    .filter(
                                                                        Boolean
                                                                    );
                                                            } else if (
                                                                feedback.reference_file
                                                            ) {
                                                                let single =
                                                                    feedback.reference_file;
                                                                const isAbs2 =
                                                                    typeof single ===
                                                                        "string" &&
                                                                    (single.startsWith(
                                                                        "http://"
                                                                    ) ||
                                                                        single.startsWith(
                                                                            "https://"
                                                                        ));
                                                                const isPath2 =
                                                                    typeof single ===
                                                                        "string" &&
                                                                    (single.startsWith(
                                                                        "/file/project/"
                                                                    ) ||
                                                                        single.startsWith(
                                                                            "file/project/"
                                                                        ));
                                                                if (
                                                                    !isAbs2 &&
                                                                    !isPath2
                                                                )
                                                                    single =
                                                                        appUrl +
                                                                        "/file/project/" +
                                                                        single;
                                                                else if (
                                                                    !isAbs2 &&
                                                                    isPath2
                                                                )
                                                                    single =
                                                                        single.startsWith(
                                                                            "/"
                                                                        )
                                                                            ? appUrl +
                                                                              single
                                                                            : appUrl +
                                                                              "/" +
                                                                              single;
                                                                files = [
                                                                    single,
                                                                ];
                                                            }
                                                            return files;
                                                        })(),
                                                    image_url: (function () {
                                                        const img =
                                                            feedback.image ||
                                                            "";
                                                        if (!img) return "";
                                                        if (
                                                            String(
                                                                img
                                                            ).startsWith("http")
                                                        )
                                                            return img;
                                                        if (
                                                            String(
                                                                img
                                                            ).startsWith("/")
                                                        )
                                                            return appUrl + img;
                                                        return (
                                                            appUrl +
                                                            "/file/project/" +
                                                            img
                                                        );
                                                    })(),
                                                };
                                                showEditFeedbackForm(
                                                    projectId,
                                                    payload,
                                                    false
                                                );
                                            }
                                        );

                                        actionsDiv.appendChild(editWrapper);
                                    }

                                    // Create reply button wrapper with icon + text
                                    const replyWrapper =
                                        document.createElement("span");
                                    replyWrapper.className =
                                        "d-flex align-items-center";
                                    replyWrapper.style.cssText =
                                        "cursor:pointer; color:#555; font-size:12px;";

                                    // Recreate reply icon
                                    const replyIcon =
                                        document.createElement("span");
                                    replyIcon.className =
                                        "material-symbols-outlined feedback-reply-trigger";
                                    replyIcon.style.cssText =
                                        "font-size:18px; line-height:1; margin-right:5px;";
                                    replyIcon.textContent = "reply";

                                    const replyText =
                                        document.createElement("span");
                                    replyText.textContent = "Reply";

                                    replyWrapper.appendChild(replyIcon);
                                    replyWrapper.appendChild(replyText);

                                    // Add click handler to wrapper
                                    replyWrapper.addEventListener(
                                        "click",
                                        function () {
                                            showReplyFeedbackForm(
                                                projectId,
                                                feedback.id
                                            );
                                        }
                                    );

                                    // Add reply button
                                    actionsDiv.appendChild(replyWrapper);

                                    // Insert actions after media (image/links/files) or comment if no media
                                    feedbackItem.appendChild(actionsDiv);

                                    // Replies list
                                    if (
                                        Array.isArray(feedback.replies) &&
                                        feedback.replies.length > 0
                                    ) {
                                        const repliesCount =
                                            feedback.replies.length;
                                        const repliesWrap =
                                            document.createElement("div");
                                        repliesWrap.className =
                                            "view-replies-wrap feedback-replies-wrap mt-1";
                                        const toggleBtn =
                                            document.createElement("button");
                                        toggleBtn.type = "button";
                                        toggleBtn.className =
                                            "btn btn-link p-0 view-replies-toggle feedback-toggle-replies";
                                        toggleBtn.style.cssText =
                                            "font-size: 13px; color:#555; text-decoration: none;";
                                        toggleBtn.textContent = `View all replies (${repliesCount})`;
                                        const repliesContainer =
                                            document.createElement("div");
                                        repliesContainer.className =
                                            "feedback-replies d-none";

                                        feedback.replies.forEach((rep) => {
                                            const repEmp = rep.employee || {};
                                            const repDiv =
                                                document.createElement("div");
                                            repDiv.className =
                                                "feedback-reply ms-4 mt-2 p-2 rounded";
                                            if (rep && rep.id != null) {
                                                repDiv.setAttribute(
                                                    "data-reply-id",
                                                    String(rep.id)
                                                );
                                                if (
                                                    feedback &&
                                                    feedback.id != null
                                                ) {
                                                    repDiv.setAttribute(
                                                        "data-parent-id",
                                                        String(feedback.id)
                                                    );
                                                }
                                            }
                                            repDiv.style.background = "#fafafa";

                                            const repHeader =
                                                document.createElement("div");
                                            repHeader.className =
                                                "d-flex align-items-center mb-1";
                                            const repImg =
                                                document.createElement("img");
                                            (function () {
                                                const raw =
                                                    repEmp.user_photo ||
                                                    repEmp.profile_picture ||
                                                    repEmp.photo ||
                                                    "";
                                                let url =
                                                    appUrl +
                                                    "/asset/img/avatar.png";
                                                if (raw) {
                                                    if (
                                                        String(raw).startsWith(
                                                            "http"
                                                        )
                                                    )
                                                        url = raw;
                                                    else if (
                                                        String(raw).startsWith(
                                                            "/"
                                                        )
                                                    )
                                                        url = appUrl + raw;
                                                    else if (
                                                        String(raw).indexOf(
                                                            "/"
                                                        ) !== -1
                                                    )
                                                        url =
                                                            appUrl + "/" + raw;
                                                    else
                                                        url =
                                                            appUrl +
                                                            "/file/profile_picture/" +
                                                            raw;
                                                }
                                                repImg.src = url;
                                            })();
                                            repImg.alt =
                                                repEmp.name || "Employee";
                                            repImg.className =
                                                "rounded-circle me-2";
                                            repImg.style.width = "24px";
                                            repImg.style.height = "24px";
                                            repImg.style.objectFit = "cover";
                                            const repInfo =
                                                document.createElement("div");
                                            const repNameRow =
                                                document.createElement("div");
                                            repNameRow.className =
                                                "d-flex align-items-center";
                                            const repName =
                                                document.createElement(
                                                    "strong"
                                                );
                                            repName.style.fontSize = "13px";
                                            repName.textContent =
                                                repEmp.name || "Unknown";
                                            repNameRow.appendChild(repName);
                                            const canEditReply =
                                                String(
                                                    rep.employee_id != null
                                                        ? rep.employee_id
                                                        : repEmp.id || 0
                                                ) ===
                                                String(currentEmployeeIdTop);

                                            // Store reply edit button for later positioning
                                            let rEdit = null;
                                            if (canEditReply) {
                                                rEdit =
                                                    document.createElement(
                                                        "span"
                                                    );
                                                rEdit.className =
                                                    "material-symbols-outlined feedback-edit-trigger ms-2";
                                                rEdit.style.cssText =
                                                    "cursor:pointer; font-size:18px; line-height:1; color:rgb(85, 85, 85);";
                                                rEdit.textContent = "edit";
                                                rEdit.addEventListener(
                                                    "click",
                                                    function () {
                                                        const payload = {
                                                            id: rep.id,
                                                            parent_id:
                                                                feedback.id,
                                                            feedback_comment:
                                                                rep.feedback_comment ||
                                                                "",
                                                            reference_url:
                                                                rep.reference_url ||
                                                                "",
                                                            reference_urls:
                                                                rep.reference_urls ||
                                                                [],
                                                            reference_file_url:
                                                                rep.reference_file ||
                                                                "",
                                                            reference_files_urls:
                                                                (function () {
                                                                    let files =
                                                                        [];
                                                                    let rf =
                                                                        rep.reference_files;
                                                                    if (
                                                                        !Array.isArray(
                                                                            rf
                                                                        ) &&
                                                                        typeof rf ===
                                                                            "string"
                                                                    ) {
                                                                        try {
                                                                            const arr =
                                                                                JSON.parse(
                                                                                    rf
                                                                                );
                                                                            if (
                                                                                Array.isArray(
                                                                                    arr
                                                                                )
                                                                            )
                                                                                rf =
                                                                                    arr;
                                                                        } catch (_) {}
                                                                    }
                                                                    if (
                                                                        Array.isArray(
                                                                            rf
                                                                        ) &&
                                                                        rf.length
                                                                    ) {
                                                                        files =
                                                                            rf
                                                                                .map(
                                                                                    function (
                                                                                        f
                                                                                    ) {
                                                                                        if (
                                                                                            !f
                                                                                        )
                                                                                            return null;
                                                                                        const isAbs =
                                                                                            typeof f ===
                                                                                                "string" &&
                                                                                            (f.startsWith(
                                                                                                "http://"
                                                                                            ) ||
                                                                                                f.startsWith(
                                                                                                    "https://"
                                                                                                ));
                                                                                        const isPath =
                                                                                            typeof f ===
                                                                                                "string" &&
                                                                                            (f.startsWith(
                                                                                                "/file/project/"
                                                                                            ) ||
                                                                                                f.startsWith(
                                                                                                    "file/project/"
                                                                                                ));
                                                                                        if (
                                                                                            !isAbs &&
                                                                                            !isPath
                                                                                        )
                                                                                            return (
                                                                                                appUrl +
                                                                                                "/file/project/" +
                                                                                                f
                                                                                            );
                                                                                        if (
                                                                                            !isAbs &&
                                                                                            isPath
                                                                                        )
                                                                                            return f.startsWith(
                                                                                                "/"
                                                                                            )
                                                                                                ? appUrl +
                                                                                                      f
                                                                                                : appUrl +
                                                                                                      "/" +
                                                                                                      f;
                                                                                        return f;
                                                                                    }
                                                                                )
                                                                                .filter(
                                                                                    Boolean
                                                                                );
                                                                    } else if (
                                                                        rep.reference_file
                                                                    ) {
                                                                        let single =
                                                                            rep.reference_file;
                                                                        const isAbs2 =
                                                                            typeof single ===
                                                                                "string" &&
                                                                            (single.startsWith(
                                                                                "http://"
                                                                            ) ||
                                                                                single.startsWith(
                                                                                    "https://"
                                                                                ));
                                                                        const isPath2 =
                                                                            typeof single ===
                                                                                "string" &&
                                                                            (single.startsWith(
                                                                                "/file/project/"
                                                                            ) ||
                                                                                single.startsWith(
                                                                                    "file/project/"
                                                                                ));
                                                                        if (
                                                                            !isAbs2 &&
                                                                            !isPath2
                                                                        )
                                                                            single =
                                                                                appUrl +
                                                                                "/file/project/" +
                                                                                single;
                                                                        else if (
                                                                            !isAbs2 &&
                                                                            isPath2
                                                                        )
                                                                            single =
                                                                                single.startsWith(
                                                                                    "/"
                                                                                )
                                                                                    ? appUrl +
                                                                                      single
                                                                                    : appUrl +
                                                                                      "/" +
                                                                                      single;
                                                                        files =
                                                                            [
                                                                                single,
                                                                            ];
                                                                    }
                                                                    return files;
                                                                })(),
                                                            image_url:
                                                                (function () {
                                                                    const img =
                                                                        rep.image ||
                                                                        "";
                                                                    if (!img)
                                                                        return "";
                                                                    if (
                                                                        String(
                                                                            img
                                                                        ).startsWith(
                                                                            "http"
                                                                        )
                                                                    )
                                                                        return img;
                                                                    if (
                                                                        String(
                                                                            img
                                                                        ).startsWith(
                                                                            "/"
                                                                        )
                                                                    )
                                                                        return (
                                                                            appUrl +
                                                                            img
                                                                        );
                                                                    return (
                                                                        appUrl +
                                                                        "/file/project/" +
                                                                        img
                                                                    );
                                                                })(),
                                                        };
                                                        showEditFeedbackForm(
                                                            projectId,
                                                            payload,
                                                            true
                                                        );
                                                    }
                                                );
                                            }
                                            repInfo.appendChild(repNameRow);
                                            const repTime =
                                                document.createElement("small");
                                            repTime.className =
                                                "text-muted d-block";
                                            repTime.style.fontSize = "11px";
                                            if (rep.created_at) {
                                                const d = new Date(
                                                    rep.created_at
                                                );
                                                repTime.textContent =
                                                    d.toLocaleTimeString(
                                                        undefined,
                                                        {
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        }
                                                    );
                                            }
                                            repInfo.appendChild(repTime);
                                            repHeader.appendChild(repImg);
                                            repHeader.appendChild(repInfo);

                                            const repComment =
                                                document.createElement("p");
                                            repComment.className = "mb-1";
                                            repComment.style.fontSize = "13px";
                                            repComment.textContent =
                                                rep.feedback_comment || "";

                                            const repMedia =
                                                document.createElement("div");
                                            repMedia.className =
                                                "feedback-reference-container mb-1";
                                            // Render one or multiple reference URLs in reply
                                            (function () {
                                                let urls = [];
                                                if (
                                                    Array.isArray(
                                                        rep.reference_urls
                                                    )
                                                )
                                                    urls = rep.reference_urls;
                                                else if (
                                                    rep.reference_urls &&
                                                    typeof rep.reference_urls ===
                                                        "string"
                                                ) {
                                                    try {
                                                        const arr = JSON.parse(
                                                            rep.reference_urls
                                                        );
                                                        if (Array.isArray(arr))
                                                            urls = arr;
                                                    } catch (_) {}
                                                }
                                                if (
                                                    (!urls ||
                                                        urls.length === 0) &&
                                                    rep.reference_url
                                                )
                                                    urls = [rep.reference_url];
                                                urls.forEach((u, idx) => {
                                                    const a =
                                                        document.createElement(
                                                            "a"
                                                        );
                                                    a.href = u;
                                                    a.target = "_blank";
                                                    a.className =
                                                        "feedback-reference-url me-2";
                                                    a.innerHTML = `<span class="material-symbols-outlined">link</span> Link ${
                                                        idx + 1
                                                    }`;
                                                    repMedia.appendChild(a);
                                                });
                                            })();
                                            (function () {
                                                let files = [];
                                                let rf = rep.reference_files;
                                                if (
                                                    !Array.isArray(rf) &&
                                                    typeof rf === "string"
                                                ) {
                                                    try {
                                                        const arr =
                                                            JSON.parse(rf);
                                                        if (Array.isArray(arr))
                                                            rf = arr;
                                                    } catch (_) {}
                                                }
                                                if (
                                                    Array.isArray(rf) &&
                                                    rf.length
                                                )
                                                    files = rf;
                                                else if (rep.reference_file)
                                                    files = [
                                                        rep.reference_file,
                                                    ];
                                                (files || []).forEach(function (
                                                    file,
                                                    idx
                                                ) {
                                                    if (!file) return;
                                                    let href = file;
                                                    if (
                                                        href &&
                                                        !(
                                                            String(
                                                                href
                                                            ).startsWith(
                                                                "http"
                                                            ) ||
                                                            String(
                                                                href
                                                            ).startsWith("/")
                                                        )
                                                    ) {
                                                        href =
                                                            appUrl +
                                                            "/file/project/" +
                                                            href;
                                                    } else if (
                                                        href &&
                                                        String(href).startsWith(
                                                            "/"
                                                        )
                                                    ) {
                                                        href = appUrl + href;
                                                    }
                                                    const a2 =
                                                        document.createElement(
                                                            "a"
                                                        );
                                                    a2.href = href;
                                                    a2.download = "";
                                                    a2.className =
                                                        "feedback-reference-file ms-2";
                                                    a2.innerHTML = `<span class=\"material-symbols-outlined\">draft</span> FILE ${
                                                        idx + 1
                                                    }`;
                                                    repMedia.appendChild(a2);
                                                });
                                            })();
                                            // Prepare reply image element but append later (below comment and references) like Task
                                            let rImg = null;
                                            if (rep.image) {
                                                rImg =
                                                    document.createElement(
                                                        "img"
                                                    );
                                                let rsrc = rep.image;
                                                if (
                                                    rsrc &&
                                                    !(
                                                        String(rsrc).startsWith(
                                                            "http"
                                                        ) ||
                                                        String(rsrc).startsWith(
                                                            "/"
                                                        )
                                                    )
                                                ) {
                                                    rsrc =
                                                        appUrl +
                                                        "/file/project/" +
                                                        rsrc;
                                                } else if (
                                                    rsrc &&
                                                    String(rsrc).startsWith("/")
                                                ) {
                                                    rsrc = appUrl + rsrc;
                                                }
                                                rImg.src = rsrc;
                                                rImg.className =
                                                    "img-fluid rounded reply-image mt-1";
                                                rImg.style.width = "70px";
                                                rImg.style.borderRadius = "8px";
                                                rImg.style.cursor = "pointer";
                                                rImg.addEventListener(
                                                    "click",
                                                    () =>
                                                        window.open(
                                                            rImg.src,
                                                            "_blank"
                                                        )
                                                );
                                            }

                                            repDiv.appendChild(repHeader);
                                            repDiv.appendChild(repComment);
                                            if (
                                                rep.reference_url ||
                                                (Array.isArray(
                                                    rep.reference_urls
                                                ) &&
                                                    rep.reference_urls
                                                        .length) ||
                                                rep.reference_file ||
                                                (Array.isArray(
                                                    rep.reference_files
                                                ) &&
                                                    rep.reference_files.length)
                                            )
                                                repDiv.appendChild(repMedia);
                                            if (rImg) repDiv.appendChild(rImg);

                                            // Create reply actions container for edit and reply buttons
                                            const replyActionsDiv =
                                                document.createElement("div");
                                            replyActionsDiv.className =
                                                "reply-actions mt-2 d-flex gap-3";

                                            // Add edit button if exists
                                            if (rEdit) {
                                                // Create edit wrapper with icon + text
                                                const editReplyWrapper =
                                                    document.createElement(
                                                        "span"
                                                    );
                                                editReplyWrapper.className =
                                                    "d-flex align-items-center";
                                                editReplyWrapper.style.cssText =
                                                    "cursor:pointer; color:#555; font-size:12px;";

                                                // Recreate edit icon
                                                const editReplyIcon =
                                                    document.createElement(
                                                        "span"
                                                    );
                                                editReplyIcon.className =
                                                    "material-symbols-outlined feedback-edit-trigger";
                                                editReplyIcon.style.cssText =
                                                    "font-size:18px; line-height:1; margin-right:5px;";
                                                editReplyIcon.textContent =
                                                    "edit";

                                                const editReplyText =
                                                    document.createElement(
                                                        "span"
                                                    );
                                                editReplyText.textContent =
                                                    "Edit";

                                                editReplyWrapper.appendChild(
                                                    editReplyIcon
                                                );
                                                editReplyWrapper.appendChild(
                                                    editReplyText
                                                );

                                                // Add click handler to wrapper
                                                editReplyWrapper.addEventListener(
                                                    "click",
                                                    function () {
                                                        const payload = {
                                                            id: rep.id,
                                                            parent_id:
                                                                feedback.id,
                                                            feedback_comment:
                                                                rep.feedback_comment ||
                                                                "",
                                                            reference_url:
                                                                rep.reference_url ||
                                                                "",
                                                            reference_urls:
                                                                rep.reference_urls ||
                                                                [],
                                                            reference_file_url:
                                                                rep.reference_file ||
                                                                "",
                                                            reference_files_urls:
                                                                (function () {
                                                                    let files =
                                                                        [];
                                                                    let rf =
                                                                        rep.reference_files;
                                                                    if (
                                                                        !Array.isArray(
                                                                            rf
                                                                        ) &&
                                                                        typeof rf ===
                                                                            "string"
                                                                    ) {
                                                                        try {
                                                                            const arr =
                                                                                JSON.parse(
                                                                                    rf
                                                                                );
                                                                            if (
                                                                                Array.isArray(
                                                                                    arr
                                                                                )
                                                                            )
                                                                                rf =
                                                                                    arr;
                                                                        } catch (_) {}
                                                                    }
                                                                    if (
                                                                        Array.isArray(
                                                                            rf
                                                                        ) &&
                                                                        rf.length
                                                                    )
                                                                        files =
                                                                            rf;
                                                                    else if (
                                                                        rep.reference_file
                                                                    )
                                                                        files =
                                                                            [
                                                                                rep.reference_file,
                                                                            ];
                                                                    return files
                                                                        .map(
                                                                            function (
                                                                                f
                                                                            ) {
                                                                                if (
                                                                                    !f
                                                                                )
                                                                                    return null;
                                                                                let href =
                                                                                    f;
                                                                                if (
                                                                                    href &&
                                                                                    !(
                                                                                        String(
                                                                                            href
                                                                                        ).startsWith(
                                                                                            "http"
                                                                                        ) ||
                                                                                        String(
                                                                                            href
                                                                                        ).startsWith(
                                                                                            "/"
                                                                                        )
                                                                                    )
                                                                                ) {
                                                                                    href =
                                                                                        appUrl +
                                                                                        "/file/project/" +
                                                                                        href;
                                                                                } else if (
                                                                                    href &&
                                                                                    String(
                                                                                        href
                                                                                    ).startsWith(
                                                                                        "/"
                                                                                    )
                                                                                ) {
                                                                                    href =
                                                                                        appUrl +
                                                                                        href;
                                                                                }
                                                                                return href;
                                                                            }
                                                                        )
                                                                        .filter(
                                                                            Boolean
                                                                        );
                                                                })(),
                                                            image_url:
                                                                (function () {
                                                                    const img =
                                                                        rep.image ||
                                                                        "";
                                                                    if (!img)
                                                                        return "";
                                                                    if (
                                                                        String(
                                                                            img
                                                                        ).startsWith(
                                                                            "http"
                                                                        )
                                                                    )
                                                                        return img;
                                                                    if (
                                                                        String(
                                                                            img
                                                                        ).startsWith(
                                                                            "/"
                                                                        )
                                                                    )
                                                                        return (
                                                                            appUrl +
                                                                            img
                                                                        );
                                                                    return (
                                                                        appUrl +
                                                                        "/file/project/" +
                                                                        img
                                                                    );
                                                                })(),
                                                        };
                                                        showEditFeedbackForm(
                                                            projectId,
                                                            payload,
                                                            true
                                                        );
                                                    }
                                                );

                                                replyActionsDiv.appendChild(
                                                    editReplyWrapper
                                                );
                                            }

                                            // Create reply wrapper with icon + text
                                            const replyReplyWrapper =
                                                document.createElement("span");
                                            replyReplyWrapper.className =
                                                "d-flex align-items-center";
                                            replyReplyWrapper.style.cssText =
                                                "cursor:pointer; color:#555; font-size:12px;";

                                            // Add reply button for nested reply
                                            const replyToReplyIcon =
                                                document.createElement("span");
                                            replyToReplyIcon.className =
                                                "material-symbols-outlined feedback-reply-trigger";
                                            replyToReplyIcon.style.cssText =
                                                "font-size:18px; line-height:1; margin-right:5px;";
                                            replyToReplyIcon.textContent =
                                                "reply";

                                            const replyReplyText =
                                                document.createElement("span");
                                            replyReplyText.textContent =
                                                "Reply";

                                            replyReplyWrapper.appendChild(
                                                replyToReplyIcon
                                            );
                                            replyReplyWrapper.appendChild(
                                                replyReplyText
                                            );

                                            replyReplyWrapper.addEventListener(
                                                "click",
                                                function () {
                                                    showReplyFeedbackForm(
                                                        projectId,
                                                        feedback.id
                                                    );
                                                }
                                            );

                                            replyActionsDiv.appendChild(
                                                replyReplyWrapper
                                            );

                                            repDiv.appendChild(replyActionsDiv);
                                            repliesContainer.appendChild(
                                                repDiv
                                            );
                                        });

                                        repliesWrap.appendChild(toggleBtn);
                                        repliesWrap.appendChild(
                                            repliesContainer
                                        );
                                        feedbackItem.appendChild(repliesWrap);

                                        toggleBtn.addEventListener(
                                            "click",
                                            function () {
                                                const hidden =
                                                    repliesContainer.classList.contains(
                                                        "d-none"
                                                    );
                                                if (hidden) {
                                                    repliesContainer.classList.remove(
                                                        "d-none"
                                                    );
                                                    this.textContent =
                                                        "Hide replies";
                                                } else {
                                                    repliesContainer.classList.add(
                                                        "d-none"
                                                    );
                                                    this.textContent = `View all replies (${repliesCount})`;
                                                }
                                                this.style.textDecoration =
                                                    "none";
                                                this.style.color = "#555";
                                            }
                                        );
                                    }

                                    modalBody.appendChild(feedbackItem);
                                });

                                // After render: auto-scroll to target reply/feedback (if any)
                                try {
                                    const pidKey = String(projectId);
                                    const target =
                                        (window.__projectLatestTarget &&
                                            window.__projectLatestTarget[
                                                pidKey
                                            ]) ||
                                        null;
                                    if (target) {
                                        // consume it so it won't trigger next time
                                        delete window.__projectLatestTarget[
                                            pidKey
                                        ];
                                        const isReply =
                                            target.parent_id != null &&
                                            target.parent_id !== "";
                                        if (isReply) {
                                            const parentEl =
                                                modalBody.querySelector(
                                                    `.feedback-item[data-feedback-id="${target.parent_id}"]`
                                                );
                                            if (parentEl) {
                                                const container =
                                                    parentEl.querySelector(
                                                        ".feedback-replies"
                                                    );
                                                const toggle =
                                                    parentEl.querySelector(
                                                        ".feedback-toggle-replies"
                                                    );
                                                if (
                                                    container &&
                                                    container.classList.contains(
                                                        "d-none"
                                                    )
                                                ) {
                                                    if (toggle) {
                                                        try {
                                                            toggle.click();
                                                        } catch (_) {
                                                            container.classList.remove(
                                                                "d-none"
                                                            );
                                                        }
                                                    } else {
                                                        container.classList.remove(
                                                            "d-none"
                                                        );
                                                    }
                                                }
                                                const replyEl =
                                                    parentEl.querySelector(
                                                        `.feedback-reply[data-reply-id="${target.id}"]`
                                                    );
                                                if (replyEl) {
                                                    replyEl.scrollIntoView({
                                                        behavior: "smooth",
                                                        block: "center",
                                                    });
                                                    const oldBg =
                                                        replyEl.style
                                                            .backgroundColor;
                                                    replyEl.style.transition =
                                                        "background-color 0.6s ease";
                                                    replyEl.style.backgroundColor =
                                                        "#fff9c4";
                                                    setTimeout(() => {
                                                        replyEl.style.backgroundColor =
                                                            oldBg || "";
                                                    }, 1200);
                                                }
                                            }
                                        } else {
                                            const topEl =
                                                modalBody.querySelector(
                                                    `.feedback-item[data-feedback-id="${target.id}"]`
                                                );
                                            if (topEl) {
                                                topEl.scrollIntoView({
                                                    behavior: "smooth",
                                                    block: "center",
                                                });
                                                const oldBg =
                                                    topEl.style.backgroundColor;
                                                topEl.style.transition =
                                                    "background-color 0.6s ease";
                                                topEl.style.backgroundColor =
                                                    "#fff9c4";
                                                setTimeout(() => {
                                                    topEl.style.backgroundColor =
                                                        oldBg || "";
                                                }, 1200);
                                            }
                                        }
                                    }
                                } catch (_) {
                                    /* noop */
                                }
                            })
                            .catch((error) => {
                                modalBody.innerHTML =
                                    '<div class="text-center text-muted">Failed to load feedback data.</div>';
                                showFloatingAlert(
                                    "Error loading feedback data. Please try again.",
                                    "warning",
                                    3500
                                );
                                console.error(
                                    "Error fetching feedback data:",
                                    error
                                );
                            });
                    }

                    // Function to show add feedback form
                    function showAddFeedbackForm(projectId) {
                        modalTitle.textContent = "Add Feedback";

                        modalBody.innerHTML = `
                            <form id="addFeedbackForm" enctype="multipart/form-data">
                                <input type="hidden" name="project_id" value="${projectId}">
                                <input type="hidden" name="employee_id" value="${
                                    projectFeedbackModalEl.getAttribute(
                                        "data-employee-id"
                                    ) || ""
                                }">
                                <input type="hidden" name="parent_id" value="">
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

                                    <div class="mb-3 input-custom">
                                        <label for="feedback_comment" class="form-label">Feedback Comment</label>
                                        <textarea class="form-control" id="feedback_comment" name="feedback_comment" rows="3" required></textarea>
                                    </div>

                                    <div class="mb-3 input-custom">
                                        <label class="form-label">Reference URLs (Optional)</label>
                                        <div id="feedback_reference_urls_container" class="d-flex flex-column gap-2">
                                            <div class="d-flex gap-2 align-items-center">
                                                <input type="url" class="form-control input-text" name="reference_urls[]" placeholder="https://example.com">
                                                <button type="button" class="btn btn-submit-black add-ref-url" aria-label="Add URL"><span class="material-symbols-outlined">add</span></button>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="mb-3 input-custom">
                                        <label for="feedback_reference_files" class="form-label">Reference Files (Optional)</label>
                                        <input type="file" class="form-control" id="feedback_reference_files" name="reference_files[]" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip">
                                        <div id="feedback_reference_files_preview" class="mt-2"></div>
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

                        // Setup multi-file preview for Add Feedback reference files
                        (function () {
                            try {
                                window.addFeedbackSelectedFiles = [];
                                const input = modalBody.querySelector(
                                    "#feedback_reference_files"
                                );
                                const preview = modalBody.querySelector(
                                    "#feedback_reference_files_preview"
                                );
                                if (!input || !preview) return;
                                function render() {
                                    preview.innerHTML = "";
                                    if (!window.addFeedbackSelectedFiles.length)
                                        return;
                                    const list = document.createElement("div");
                                    list.className = "selected-files-list mt-2";
                                    window.addFeedbackSelectedFiles.forEach(
                                        function (file, idx) {
                                            const item =
                                                document.createElement("div");
                                            item.className =
                                                "selected-file-item d-flex align-items-center justify-content-between mb-2 p-2 bg-light border rounded";
                                            const info =
                                                document.createElement("div");
                                            info.className =
                                                "d-flex align-items-center flex-grow-1";
                                            const icon =
                                                document.createElement("span");
                                            icon.className =
                                                "material-symbols-outlined me-2";
                                            icon.textContent = "description";
                                            const name =
                                                document.createElement("span");
                                            name.textContent = file.name;
                                            name.className = "file-name";
                                            const size =
                                                document.createElement("small");
                                            size.className = "text-muted ms-1";
                                            size.textContent =
                                                " (" +
                                                (
                                                    file.size /
                                                    1024 /
                                                    1024
                                                ).toFixed(2) +
                                                " MB)";
                                            const rm =
                                                document.createElement(
                                                    "button"
                                                );
                                            rm.type = "button";
                                            rm.className =
                                                "btn btn-sm btn-outline-danger";
                                            rm.innerHTML = "&times;";
                                            rm.onclick = function () {
                                                window.addFeedbackSelectedFiles.splice(
                                                    idx,
                                                    1
                                                );
                                                render();
                                            };
                                            info.appendChild(icon);
                                            info.appendChild(name);
                                            info.appendChild(size);
                                            item.appendChild(info);
                                            item.appendChild(rm);
                                            list.appendChild(item);
                                        }
                                    );
                                    preview.appendChild(list);
                                }
                                input.addEventListener("change", function () {
                                    const files = Array.from(this.files || []);
                                    window.addFeedbackSelectedFiles =
                                        window.addFeedbackSelectedFiles.concat(
                                            files
                                        );
                                    render();
                                    this.value = "";
                                });
                            } catch (_) {}
                        })();

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
                        // Arrange Close & Submit buttons side-by-side like Accept/Reject task buttons
                        (function () {
                            try {
                                const footer = getProjectFeedbackFooter();
                                if (!footer) return;
                                const submitBtnRef =
                                    document.getElementById(
                                        "addFeedbackButton"
                                    );
                                if (!submitBtnRef) return;
                                // Match Task: side-by-side with flex-grow-1
                                submitBtnRef.classList.remove("w-100");
                                submitBtnRef.classList.add("flex-grow-1");

                                // Cleanup old wrapper if any
                                const oldWrapper = footer.querySelector(
                                    "#feedbackFormButtonsWrapper"
                                );
                                if (oldWrapper) oldWrapper.remove();

                                // Create wrapper
                                const wrap = document.createElement("div");
                                wrap.id = "feedbackFormButtonsWrapper";
                                wrap.className = "d-flex gap-2 w-100";

                                // Create Close button
                                const closeBtn =
                                    document.createElement("button");
                                closeBtn.id = "replyCloseButton";
                                closeBtn.type = "button";
                                closeBtn.className =
                                    "btn btn-close-reply flex-grow-1";
                                closeBtn.textContent = "Close";
                                closeBtn.addEventListener("click", function () {
                                    try {
                                        // Restore footer to single Add Feedback button (like Task)
                                        footer.innerHTML = "";
                                        const restore =
                                            document.createElement("button");
                                        restore.type = "button";
                                        restore.className =
                                            "btn btn-submit-black w-100";
                                        restore.id = "addFeedbackButton";
                                        restore.textContent = "Add Feedback";
                                        restore.addEventListener(
                                            "click",
                                            function () {
                                                showAddFeedbackForm(projectId);
                                            }
                                        );
                                        footer.appendChild(restore);
                                    } catch (_) {}
                                    loadFeedbackData(projectId);
                                });

                                // Insert elements
                                wrap.appendChild(closeBtn);
                                wrap.appendChild(submitBtnRef);
                                footer.innerHTML = ""; // clear footer then add wrapper
                                footer.appendChild(wrap);
                            } catch (_) {
                                /* noop */
                            }
                        })();
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
                        // Map first non-empty reference_urls[] to single reference_url for backend
                        try {
                            const urlInputs = form.querySelectorAll(
                                'input[name="reference_urls[]"]'
                            );
                            const urls = Array.from(urlInputs)
                                .map((i) => (i.value || "").trim())
                                .filter(Boolean);
                            if (urls.length)
                                formData.set("reference_url", urls[0]);
                        } catch (_) {}

                        // Append selected reference files for add form
                        try {
                            if (
                                window.addFeedbackSelectedFiles &&
                                window.addFeedbackSelectedFiles.length
                            ) {
                                window.addFeedbackSelectedFiles.forEach((f) =>
                                    formData.append("reference_files[]", f)
                                );
                            } else {
                                const rfInput = form.querySelector(
                                    "#feedback_reference_files"
                                );
                                if (
                                    rfInput &&
                                    rfInput.files &&
                                    rfInput.files.length
                                ) {
                                    Array.from(rfInput.files).forEach((f) =>
                                        formData.append("reference_files[]", f)
                                    );
                                }
                            }
                        } catch (_) {}

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
                                // Show success alert
                                showFloatingAlert(
                                    data.message ||
                                        "Feedback submitted successfully!",
                                    "success",
                                    1500
                                );

                                // Update feedback badge count immediately
                                const card = document.querySelector(
                                    `[data-project-id="${projectId}"]`
                                );
                                if (card) {
                                    const feedbackBadge = card.querySelector(
                                        ".project-feedback-count"
                                    );
                                    if (feedbackBadge) {
                                        const currentCount =
                                            parseInt(
                                                feedbackBadge.textContent
                                            ) || 0;
                                        feedbackBadge.textContent =
                                            currentCount + 1;
                                    }
                                }

                                // Muat ulang daftar feedback setelah 1 detik
                                setTimeout(() => {
                                    loadFeedbackData(projectId);

                                    // Reset form setelah sukses untuk memungkinkan tambah feedback lagi
                                    form.reset();

                                    // Reset image preview
                                    const imageLabel = form.querySelector(
                                        "#feedbackImageLabel"
                                    );
                                    const imageClearBtn = form.querySelector(
                                        "#feedbackImageClearBtn"
                                    );
                                    if (imageLabel) {
                                        imageLabel.style.backgroundImage =
                                            "url('" +
                                            appUrl +
                                            "/asset/img/background/add-image.png')";
                                        imageLabel.style.backgroundPosition =
                                            "center center";
                                        imageLabel.style.backgroundRepeat =
                                            "no-repeat";
                                        imageLabel.style.backgroundSize = "50%";
                                        imageLabel.classList.remove(
                                            "has-image"
                                        );
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

                                showFloatingAlert(
                                    errorMessage,
                                    "warning",
                                    4000
                                );
                            })
                            .finally(() => {
                                // Reset tombol submit
                                submitBtn.innerHTML = originalBtnText;
                                submitBtn.disabled = false;
                            });
                    }

                    // Show reply form for a given parent feedback (mirror Add Feedback UI)
                    function showReplyFeedbackForm(projectId, parentId) {
                        modalTitle.textContent = "Reply Feedback";
                        modalBody.innerHTML = `
                        <form id="replyFeedbackForm" enctype="multipart/form-data">
                            <input type="hidden" name="project_id" value="${projectId}">
                            <input type="hidden" name="parent_id" value="${parentId}">
                            <input type="hidden" name="employee_id" value="${
                                projectFeedbackModalEl.getAttribute(
                                    "data-employee-id"
                                ) || ""
                            }">

                            <div class="mb-3 input-custom">
                                <label class="form-label">Upload Image</label>
                                <div class="image-upload-container">
                                    <label for="feedback_image" class="custom-image-upload position-relative label-custom" id="feedbackImageLabel"
                                        style="background-position: center center; background-repeat: no-repeat; background-size: 50%; background-image: url('${appUrl}/asset/img/background/add-image.png'); cursor: pointer;">
                                        <input type="file" id="feedback_image" name="feedback_image" accept="image/*" class="d-none">
                                        <span class="image-clear-btn d-none" id="feedbackImageClearBtn" title="Remove image">&times;</span>
                                    </label>
                                </div>
                            </div>

                            <div class="mb-3 input-custom">
                                <label for="feedback_comment" class="form-label label-custom">Feedback Comment</label>
                                <textarea class="form-control" id="feedback_comment" name="feedback_comment" rows="3" required></textarea>
                            </div>

                            <div class="mb-3 input-custom">
                                <label class="form-label label-custom">Reference URLs (Optional)</label>
                                <div id="feedback_reference_urls_container" class="d-flex flex-column gap-2">
                                    <div class="d-flex gap-2 align-items-center">
                                        <input type="url" class="form-control input-text" name="reference_urls[]" placeholder="https://example.com">
                                        <button type="button" class="btn btn-submit-black add-ref-url" aria-label="Add URL"><span class="material-symbols-outlined">add</span></button>
                                    </div>
                                </div>
                            </div>

                            <div class="mb-3 input-custom">
                                <label for="reply_reference_files" class="form-label label-custom">Reference Files (Optional)</label>
                                <input type="file" class="form-control" id="reply_reference_files" name="reference_files[]" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip">
                                <div id="reply_reference_files_preview" class="mt-2"></div>
                            </div>
                        </form>`;

                        // Setup image preview and clear like Add Feedback
                        (function () {
                            const imageInput =
                                modalBody.querySelector("#feedback_image");
                            const imageLabel = modalBody.querySelector(
                                "#feedbackImageLabel"
                            );
                            const imageClearBtn = modalBody.querySelector(
                                "#feedbackImageClearBtn"
                            );
                            if (!imageInput || !imageLabel || !imageClearBtn)
                                return;
                            imageInput.addEventListener("change", function () {
                                if (this.files && this.files[0]) {
                                    const reader = new FileReader();
                                    reader.onload = function (e) {
                                        imageLabel.style.backgroundImage = `url('${e.target.result}')`;
                                        imageLabel.classList.add("has-image");
                                        imageLabel.style.backgroundSize =
                                            "cover";
                                        imageLabel.style.opacity = "1";
                                        imageClearBtn.classList.remove(
                                            "d-none"
                                        );
                                    };
                                    reader.readAsDataURL(this.files[0]);
                                }
                            });
                            imageClearBtn.addEventListener(
                                "click",
                                function (e) {
                                    e.preventDefault();
                                    imageInput.value = "";
                                    imageLabel.style.backgroundImage = `url('${appUrl}/asset/img/background/add-image.png')`;
                                    imageLabel.style.backgroundPosition =
                                        "center center";
                                    imageLabel.style.backgroundRepeat =
                                        "no-repeat";
                                    imageLabel.style.backgroundSize = "50%";
                                    imageLabel.classList.remove("has-image");
                                    imageLabel.style.opacity = "0.5";
                                    imageClearBtn.classList.add("d-none");
                                }
                            );
                        })();

                        // Setup multi-file preview for Reply reference files
                        (function () {
                            try {
                                window.replyFeedbackSelectedFiles = [];
                                const input = modalBody.querySelector(
                                    "#reply_reference_files"
                                );
                                const preview = modalBody.querySelector(
                                    "#reply_reference_files_preview"
                                );
                                if (!input || !preview) return;
                                function render() {
                                    preview.innerHTML = "";
                                    if (
                                        !window.replyFeedbackSelectedFiles
                                            .length
                                    )
                                        return;
                                    const list = document.createElement("div");
                                    list.className = "selected-files-list mt-2";
                                    window.replyFeedbackSelectedFiles.forEach(
                                        function (file, idx) {
                                            const item =
                                                document.createElement("div");
                                            item.className =
                                                "selected-file-item d-flex align-items-center justify-content-between mb-2 p-2 bg-light border rounded";
                                            const info =
                                                document.createElement("div");
                                            info.className =
                                                "d-flex align-items-center flex-grow-1";
                                            const icon =
                                                document.createElement("span");
                                            icon.className =
                                                "material-symbols-outlined me-2";
                                            icon.textContent = "description";
                                            const name =
                                                document.createElement("span");
                                            name.className = "file-name";
                                            name.textContent = file.name;
                                            const size =
                                                document.createElement("small");
                                            size.className = "text-muted ms-1";
                                            size.textContent =
                                                " (" +
                                                (
                                                    file.size /
                                                    1024 /
                                                    1024
                                                ).toFixed(2) +
                                                " MB)";
                                            const rm =
                                                document.createElement(
                                                    "button"
                                                );
                                            rm.type = "button";
                                            rm.className =
                                                "btn btn-sm btn-outline-danger";
                                            rm.innerHTML = "&times;";
                                            rm.onclick = function () {
                                                window.replyFeedbackSelectedFiles.splice(
                                                    idx,
                                                    1
                                                );
                                                render();
                                            };
                                            info.appendChild(icon);
                                            info.appendChild(name);
                                            info.appendChild(size);
                                            item.appendChild(info);
                                            item.appendChild(rm);
                                            list.appendChild(item);
                                        }
                                    );
                                    preview.appendChild(list);
                                }
                                input.addEventListener("change", function () {
                                    const files = Array.from(this.files || []);
                                    window.replyFeedbackSelectedFiles =
                                        window.replyFeedbackSelectedFiles.concat(
                                            files
                                        );
                                    render();
                                    this.value = "";
                                });
                            } catch (_) {}
                        })();

                        const addBtn =
                            document.getElementById("addFeedbackButton");
                        if (addBtn) {
                            addBtn.textContent = "Submit";
                            const fresh = addBtn.cloneNode(true);
                            addBtn.parentNode.replaceChild(fresh, addBtn);
                            fresh.addEventListener("click", function (e) {
                                e.preventDefault();
                                const form =
                                    document.getElementById(
                                        "replyFeedbackForm"
                                    );
                                if (!form) return;
                                const fd = new FormData(form);
                                // Map first non-empty reference_urls[] to single reference_url for backend
                                try {
                                    const urlInputs = form.querySelectorAll(
                                        'input[name="reference_urls[]"]'
                                    );
                                    const urls = Array.from(urlInputs)
                                        .map((i) => (i.value || "").trim())
                                        .filter(Boolean);
                                    if (urls.length)
                                        fd.set("reference_url", urls[0]);
                                } catch (_) {}
                                // Append selected reference files for reply form
                                try {
                                    if (
                                        window.replyFeedbackSelectedFiles &&
                                        window.replyFeedbackSelectedFiles.length
                                    ) {
                                        window.replyFeedbackSelectedFiles.forEach(
                                            (f) =>
                                                fd.append(
                                                    "reference_files[]",
                                                    f
                                                )
                                        );
                                    } else {
                                        const rfInput = form.querySelector(
                                            "#reply_reference_files"
                                        );
                                        if (
                                            rfInput &&
                                            rfInput.files &&
                                            rfInput.files.length
                                        ) {
                                            Array.from(rfInput.files).forEach(
                                                (f) =>
                                                    fd.append(
                                                        "reference_files[]",
                                                        f
                                                    )
                                            );
                                        }
                                    }
                                } catch (_) {}

                                fetch(appUrl + "/project-feedbacks", {
                                    method: "POST",
                                    headers: {
                                        "X-CSRF-TOKEN": document
                                            .querySelector(
                                                'meta[name="csrf-token"]'
                                            )
                                            .getAttribute("content"),
                                    },
                                    body: fd,
                                })
                                    .then((r) =>
                                        r.ok
                                            ? r.json()
                                            : r.json().then(Promise.reject)
                                    )
                                    .then((res) => {
                                        showFloatingAlert(
                                            res.message || "Reply submitted",
                                            "success",
                                            1500
                                        );
                                        loadFeedbackData(projectId);
                                    })
                                    .catch((err) => {
                                        const msg =
                                            (err &&
                                                (err.message ||
                                                    (err.errors &&
                                                        Object.values(
                                                            err.errors
                                                        ).join("\n")))) ||
                                            "Failed to submit reply";
                                        showFloatingAlert(msg, "warning", 3500);
                                    });
                            });
                        }
                        // Arrange Close & Submit buttons side-by-side
                        (function () {
                            try {
                                const footer = getProjectFeedbackFooter();
                                if (!footer) return;
                                const submitBtnRef =
                                    document.getElementById(
                                        "addFeedbackButton"
                                    );
                                if (!submitBtnRef) return;
                                submitBtnRef.classList.remove("w-100");
                                submitBtnRef.classList.add("flex-grow-1");
                                const oldWrapper = footer.querySelector(
                                    "#feedbackFormButtonsWrapper"
                                );
                                if (oldWrapper) oldWrapper.remove();
                                const wrap = document.createElement("div");
                                wrap.id = "feedbackFormButtonsWrapper";
                                wrap.className = "d-flex gap-2 w-100";
                                const closeBtn =
                                    document.createElement("button");
                                closeBtn.id = "replyCloseButton";
                                closeBtn.type = "button";
                                closeBtn.className =
                                    "btn btn-close-reply flex-grow-1";
                                closeBtn.textContent = "Close";
                                closeBtn.addEventListener("click", function () {
                                    try {
                                        footer.innerHTML = "";
                                        const restore =
                                            document.createElement("button");
                                        restore.type = "button";
                                        restore.className =
                                            "btn btn-submit-black w-100";
                                        restore.id = "addFeedbackButton";
                                        restore.textContent = "Add Feedback";
                                        restore.addEventListener(
                                            "click",
                                            function () {
                                                showAddFeedbackForm(projectId);
                                            }
                                        );
                                        footer.appendChild(restore);
                                    } catch (_) {}
                                    loadFeedbackData(projectId);
                                });
                                wrap.appendChild(closeBtn);
                                wrap.appendChild(submitBtnRef);
                                footer.innerHTML = "";
                                footer.appendChild(wrap);
                            } catch (_) {
                                /* noop */
                            }
                        })();
                    }

                    // Show edit form for feedback or reply (mirror Add Feedback UI)
                    function showEditFeedbackForm(projectId, data, isReply) {
                        modalTitle.textContent = isReply
                            ? "Edit Reply"
                            : "Edit Feedback";
                        const existingImg = data.image_url || "";
                        const bgStyle = existingImg
                            ? `background-image: url('${existingImg}'); background-size: cover; opacity: 1;`
                            : `background-image: url('${appUrl}/asset/img/background/add-image.png'); background-size: 50%; opacity: 0.5;`;
                        const clearClass = existingImg ? "" : "d-none";
                        modalBody.innerHTML = `
                        <form id="editFeedbackForm" enctype="multipart/form-data">
                            ${
                                data.parent_id
                                    ? `<input type="hidden" name="parent_id" value="${data.parent_id}">`
                                    : ""
                            }

                            <div class="mb-3 input-custom">
                                <label class="form-label label-custom">Upload Image</label>
                                <div class="image-upload-container">
                                    <label for="feedback_image" class="custom-image-upload position-relative" id="editFeedbackImageLabel"
                                        style="background-position: center center; background-repeat: no-repeat; ${bgStyle} cursor: pointer;">
                                        <input type="file" id="feedback_image" name="feedback_image" accept="image/*" class="d-none">
                                        <span class="image-clear-btn ${clearClass}" id="editFeedbackImageClearBtn" title="Remove image">&times;</span>
                                    </label>
                                </div>
                            </div>

                            <div class="mb-3 input-custom">
                                <label for="feedback_comment" class="form-label label-custom">Feedback Comment</label>
                                <textarea class="form-control" id="feedback_comment" name="feedback_comment" rows="3" required>${
                                    data.feedback_comment || ""
                                }</textarea>
                            </div>

                            <div class="mb-3 input-custom">
                                <label class="form-label label-custom">Reference URLs (Optional)</label>
                                <div id="feedback_reference_urls_container" class="d-flex flex-column gap-2"></div>
                            </div>

                            <div class="mb-3 input-custom">
                                <label for="edit_reference_files" class="form-label label-custom">Reference Files (Optional)</label>
                                <input type="file" class="form-control" id="edit_reference_files" name="reference_files[]" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip">
                                <input type="hidden" id="existing_feedback_reference_files_input" name="existing_reference_files" value="[]">
                                <div id="existing_feedback_reference_files" class="mt-2 d-flex flex-wrap gap-2"></div>
                                <div id="edit_feedback_reference_files_preview" class="mt-2"></div>
                            </div>
                        </form>`;

                        // Image preview/clear logic like Add
                        (function () {
                            const imageInput =
                                modalBody.querySelector("#feedback_image");
                            const imageLabel = modalBody.querySelector(
                                "#editFeedbackImageLabel"
                            );
                            const imageClearBtn = modalBody.querySelector(
                                "#editFeedbackImageClearBtn"
                            );
                            if (!imageInput || !imageLabel || !imageClearBtn)
                                return;
                            imageInput.addEventListener("change", function () {
                                if (this.files && this.files[0]) {
                                    const reader = new FileReader();
                                    reader.onload = function (e) {
                                        imageLabel.style.backgroundImage = `url('${e.target.result}')`;
                                        imageLabel.classList.add("has-image");
                                        imageLabel.style.backgroundSize =
                                            "cover";
                                        imageLabel.style.opacity = "1";
                                        imageClearBtn.classList.remove(
                                            "d-none"
                                        );
                                    };
                                    reader.readAsDataURL(this.files[0]);
                                }
                            });
                            imageClearBtn.addEventListener(
                                "click",
                                function (e) {
                                    e.preventDefault();
                                    imageInput.value = "";
                                    imageLabel.style.backgroundImage = `url('${appUrl}/asset/img/background/add-image.png')`;
                                    imageLabel.style.backgroundPosition =
                                        "center center";
                                    imageLabel.style.backgroundRepeat =
                                        "no-repeat";
                                    imageLabel.style.backgroundSize = "50%";
                                    imageLabel.classList.remove("has-image");
                                    imageLabel.style.opacity = "0.5";
                                    imageClearBtn.classList.add("d-none");
                                }
                            );
                        })();

                        // Setup multi-file preview for Edit Feedback reference files
                        (function () {
                            try {
                                window.editFeedbackSelectedFiles = [];
                                const input = modalBody.querySelector(
                                    "#edit_reference_files"
                                );
                                const preview = modalBody.querySelector(
                                    "#edit_feedback_reference_files_preview"
                                );
                                if (!input || !preview) return;
                                function render() {
                                    preview.innerHTML = "";
                                    if (
                                        !window.editFeedbackSelectedFiles.length
                                    )
                                        return;
                                    const list = document.createElement("div");
                                    list.className = "selected-files-list mt-2";
                                    window.editFeedbackSelectedFiles.forEach(
                                        function (file, idx) {
                                            const item =
                                                document.createElement("div");
                                            item.className =
                                                "selected-file-item d-flex align-items-center justify-content-between mb-2 p-2 bg-light border rounded";
                                            const info =
                                                document.createElement("div");
                                            info.className =
                                                "d-flex align-items-center flex-grow-1";
                                            const icon =
                                                document.createElement("span");
                                            icon.className =
                                                "material-symbols-outlined me-2";
                                            icon.textContent = "description";
                                            const name =
                                                document.createElement("span");
                                            name.className = "file-name";
                                            name.textContent = file.name;
                                            const size =
                                                document.createElement("small");
                                            size.className = "text-muted ms-1";
                                            size.textContent =
                                                " (" +
                                                (
                                                    file.size /
                                                    1024 /
                                                    1024
                                                ).toFixed(2) +
                                                " MB)";
                                            const rm =
                                                document.createElement(
                                                    "button"
                                                );
                                            rm.type = "button";
                                            rm.className =
                                                "btn btn-sm btn-outline-danger";
                                            rm.innerHTML = "&times;";
                                            rm.onclick = function () {
                                                window.editFeedbackSelectedFiles.splice(
                                                    idx,
                                                    1
                                                );
                                                render();
                                            };
                                            info.appendChild(icon);
                                            info.appendChild(name);
                                            info.appendChild(size);
                                            item.appendChild(info);
                                            item.appendChild(rm);
                                            list.appendChild(item);
                                        }
                                    );
                                    preview.appendChild(list);
                                }
                                input.addEventListener("change", function () {
                                    const files = Array.from(this.files || []);
                                    window.editFeedbackSelectedFiles =
                                        window.editFeedbackSelectedFiles.concat(
                                            files
                                        );
                                    render();
                                    this.value = "";
                                });
                            } catch (_) {}
                        })();

                        const addBtn =
                            document.getElementById("addFeedbackButton");
                        if (addBtn) {
                            addBtn.textContent = "Update";
                            const fresh = addBtn.cloneNode(true);
                            addBtn.parentNode.replaceChild(fresh, addBtn);
                            fresh.addEventListener("click", function (e) {
                                e.preventDefault();
                                const form =
                                    document.getElementById("editFeedbackForm");
                                if (!form) return;
                                const fd = new FormData(form);
                                // Map first non-empty reference_urls[] to single reference_url for backend
                                try {
                                    const urlInputs = form.querySelectorAll(
                                        'input[name="reference_urls[]"]'
                                    );
                                    const urls = Array.from(urlInputs)
                                        .map((i) => (i.value || "").trim())
                                        .filter(Boolean);
                                    if (urls.length)
                                        fd.set("reference_url", urls[0]);
                                    else fd.set("reference_url", "");
                                } catch (_) {}
                                // Include existing files and new selected files for edit form
                                try {
                                    const existingHidden = form.querySelector(
                                        "#existing_feedback_reference_files_input"
                                    );
                                    const existingList = form.querySelectorAll(
                                        "#existing_feedback_reference_files .existing-file-item a"
                                    );
                                    let keep = [];
                                    existingList.forEach((a) => {
                                        const name = (
                                            a.textContent || ""
                                        ).trim();
                                        if (name) keep.push(name);
                                    });
                                    if (existingHidden)
                                        existingHidden.value =
                                            JSON.stringify(keep);
                                } catch (_) {}
                                try {
                                    if (
                                        window.editFeedbackSelectedFiles &&
                                        window.editFeedbackSelectedFiles.length
                                    ) {
                                        window.editFeedbackSelectedFiles.forEach(
                                            (f) =>
                                                fd.append(
                                                    "reference_files[]",
                                                    f
                                                )
                                        );
                                    } else {
                                        const rfInput = form.querySelector(
                                            "#edit_reference_files"
                                        );
                                        if (
                                            rfInput &&
                                            rfInput.files &&
                                            rfInput.files.length
                                        ) {
                                            Array.from(rfInput.files).forEach(
                                                (f) =>
                                                    fd.append(
                                                        "reference_files[]",
                                                        f
                                                    )
                                            );
                                        }
                                    }
                                } catch (_) {}
                                fd.append("_method", "PUT");
                                fetch(
                                    appUrl + `/project-feedbacks/${data.id}`,
                                    {
                                        method: "POST",
                                        headers: {
                                            "X-CSRF-TOKEN": document
                                                .querySelector(
                                                    'meta[name="csrf-token"]'
                                                )
                                                .getAttribute("content"),
                                        },
                                        body: fd,
                                    }
                                )
                                    .then((r) =>
                                        r.ok
                                            ? r.json()
                                            : r.json().then(Promise.reject)
                                    )
                                    .then((res) => {
                                        showFloatingAlert(
                                            res.message || "Feedback updated",
                                            "success",
                                            1500
                                        );
                                        loadFeedbackData(projectId);
                                    })
                                    .catch((err) => {
                                        const msg =
                                            (err &&
                                                (err.message ||
                                                    (err.errors &&
                                                        Object.values(
                                                            err.errors
                                                        ).join("\n")))) ||
                                            "Failed to update feedback";
                                        showFloatingAlert(msg, "warning", 3500);
                                    });
                            });
                        }

                        // Prefill reference URLs container for edit form
                        (function () {
                            const container = document.getElementById(
                                "feedback_reference_urls_container"
                            );
                            if (!container) return;
                            container.innerHTML = "";
                            let urls = [];
                            if (Array.isArray(data.reference_urls))
                                urls = data.reference_urls;
                            else if (typeof data.reference_urls === "string") {
                                try {
                                    const arr = JSON.parse(data.reference_urls);
                                    if (Array.isArray(arr)) urls = arr;
                                } catch (_) {}
                            }
                            if (
                                (!urls || urls.length === 0) &&
                                data.reference_url
                            )
                                urls = [data.reference_url];
                            function addRow(value, withAdd) {
                                const row = document.createElement("div");
                                row.className =
                                    "d-flex gap-2 align-items-center";
                                row.innerHTML =
                                    '<input type="url" class="form-control input-text" name="reference_urls[]" placeholder="https://example.com">' +
                                    (withAdd
                                        ? ' <button type="button" class="btn btn-submit-black add-ref-url"><span class="material-symbols-outlined">add</span></button>'
                                        : ' <button type="button" class="btn btn-danger remove-ref-url"><span class="material-symbols-outlined">close</span></button>');
                                container.appendChild(row);
                                const inp =
                                    row.querySelector('input[type="url"]');
                                if (inp && value) inp.value = value;
                            }
                            // Place the ADD row first, then existing URL rows below it
                            addRow("", true);
                            (urls || []).forEach((u) => addRow(u, false));
                        })();

                        // Prefill existing reference files list for edit form and wire remove buttons
                        (function () {
                            // Scope to modalBody to avoid clashing with project edit modal elements
                            const container = modalBody.querySelector(
                                "#existing_feedback_reference_files"
                            );
                            const hidden = modalBody.querySelector(
                                "#existing_feedback_reference_files_input"
                            );
                            if (!container || !hidden) return;

                            // Build files array from multiple possible shapes
                            let files = [];
                            if (Array.isArray(data.reference_files_urls)) {
                                files = data.reference_files_urls.slice();
                            } else if (Array.isArray(data.reference_files)) {
                                files = data.reference_files.slice();
                            } else if (data.reference_file_url) {
                                files = [data.reference_file_url];
                            } else if (data.reference_file) {
                                files = [data.reference_file];
                            }

                            function toUrl(v) {
                                if (!v) return "";
                                const s = String(v);
                                if (
                                    s.startsWith("http://") ||
                                    s.startsWith("https://")
                                )
                                    return s;
                                if (s.startsWith("/")) return appUrl + s;
                                return appUrl + "/file/project/" + s;
                            }
                            function toName(u) {
                                if (!u) return "";
                                const s = String(u);
                                if (
                                    s.startsWith("http://") ||
                                    s.startsWith("https://")
                                ) {
                                    try {
                                        return new URL(s).pathname
                                            .split("/")
                                            .pop();
                                    } catch (_) {
                                        return s.split("/").pop();
                                    }
                                }
                                return s.split("/").pop();
                            }

                            container.innerHTML = "";
                            if ((files || []).length > 0) {
                                const title = document.createElement("div");
                                title.className = "fw-bold mb-2";
                                title.textContent = "Current Files:";
                                container.appendChild(title);

                                const list = document.createElement("div");
                                list.className = "existing-files-list w-100";

                                (files || []).forEach(function (f) {
                                    const url = toUrl(f);
                                    const name = toName(f);
                                    if (!name) return;

                                    const item = document.createElement("div");
                                    item.className =
                                        "existing-file-item d-flex align-items-center justify-content-between mb-2 p-2 bg-light border rounded";

                                    const info = document.createElement("div");
                                    info.className =
                                        "d-flex align-items-center flex-grow-1";

                                    const icon = document.createElement("span");
                                    icon.className =
                                        "material-symbols-outlined me-2";
                                    icon.textContent = "description";

                                    const link = document.createElement("a");
                                    link.href = url;
                                    link.textContent = name;
                                    link.className = "text-decoration-none";
                                    link.target = "_blank";

                                    const removeBtn =
                                        document.createElement("button");
                                    removeBtn.type = "button";
                                    removeBtn.className =
                                        "btn btn-sm btn-outline-danger";
                                    removeBtn.innerHTML = "&times;";
                                    removeBtn.onclick = function () {
                                        item.remove();
                                        try {
                                            const anchors =
                                                container.querySelectorAll(
                                                    ".existing-file-item a"
                                                );
                                            const next = Array.from(anchors)
                                                .map((a) =>
                                                    (a.textContent || "").trim()
                                                )
                                                .filter(Boolean);
                                            hidden.value = JSON.stringify(next);
                                        } catch (_) {}
                                    };

                                    info.appendChild(icon);
                                    info.appendChild(link);
                                    item.appendChild(info);
                                    item.appendChild(removeBtn);
                                    list.appendChild(item);
                                });

                                container.appendChild(list);
                            }

                            // Initialize hidden keep list with all names
                            try {
                                const anchors = container.querySelectorAll(
                                    ".existing-file-item a"
                                );
                                const names = Array.from(anchors)
                                    .map((a) => (a.textContent || "").trim())
                                    .filter(Boolean);
                                hidden.value = JSON.stringify(names);
                            } catch (_) {
                                hidden.value = "[]";
                            }
                        })();

                        // Arrange Close & Update buttons side-by-side
                        (function () {
                            try {
                                const footer = getProjectFeedbackFooter();
                                if (!footer) return;
                                const submitBtnRef =
                                    document.getElementById(
                                        "addFeedbackButton"
                                    );
                                if (!submitBtnRef) return;
                                submitBtnRef.classList.remove("w-100");
                                submitBtnRef.classList.add("flex-grow-1");
                                const oldWrapper = footer.querySelector(
                                    "#feedbackFormButtonsWrapper"
                                );
                                if (oldWrapper) oldWrapper.remove();
                                const wrap = document.createElement("div");
                                wrap.id = "feedbackFormButtonsWrapper";
                                wrap.className = "d-flex gap-2 w-100";
                                const closeBtn =
                                    document.createElement("button");
                                closeBtn.id = "replyCloseButton";
                                closeBtn.type = "button";
                                closeBtn.className =
                                    "btn btn-close-reply flex-grow-1";
                                closeBtn.textContent = "Close";
                                closeBtn.addEventListener("click", function () {
                                    try {
                                        footer.innerHTML = "";
                                        const restore =
                                            document.createElement("button");
                                        restore.type = "button";
                                        restore.className =
                                            "btn btn-submit-black w-100";
                                        restore.id = "addFeedbackButton";
                                        restore.textContent = "Add Feedback";
                                        restore.addEventListener(
                                            "click",
                                            function () {
                                                showAddFeedbackForm(projectId);
                                            }
                                        );
                                        footer.appendChild(restore);
                                    } catch (_) {}
                                    loadFeedbackData(projectId);
                                });
                                wrap.appendChild(closeBtn);
                                wrap.appendChild(submitBtnRef);
                                footer.innerHTML = "";
                                footer.appendChild(wrap);
                            } catch (_) {
                                /* noop */
                            }
                        })();
                    }

                    // Modal hidden event to reset modal title and clear modal body
                    // Also customize backdrop brightness specifically for this modal
                    projectFeedbackModalEl.addEventListener(
                        "show.bs.modal",
                        function () {
                            try {
                                // Mark body so CSS scope applies only while this modal open
                                document.body.classList.add(
                                    "feedback-modal-open"
                                );
                                // Inject style once
                                if (
                                    !document.getElementById(
                                        "feedbackBackdropStyle"
                                    )
                                ) {
                                    const style =
                                        document.createElement("style");
                                    style.id = "feedbackBackdropStyle";
                                    // Reduce darkness of backdrop only while feedback modal open
                                    style.textContent = `.feedback-modal-open .modal-backdrop.show {opacity:0.18 !important;}`;
                                    document.head.appendChild(style);
                                }
                            } catch (_) {
                                /* noop */
                            }
                        }
                    );
                    projectFeedbackModalEl.addEventListener(
                        "hidden.bs.modal",
                        function () {
                            modalTitle.textContent = "Feedback";
                            modalBody.innerHTML = "";
                            try {
                                document.body.classList.remove(
                                    "feedback-modal-open"
                                );
                            } catch (_) {
                                /* noop */
                            }

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

                        // Helper to safely resolve project ID from various possible DOM contexts
                        function resolveProjectId(el) {
                            if (!el) return null;
                            // 1. Direct ancestor card .col-md-4
                            const cardEl =
                                el.closest &&
                                el.closest(".col-md-4[data-project-id]");
                            if (
                                cardEl &&
                                cardEl.getAttribute("data-project-id")
                            )
                                return cardEl.getAttribute("data-project-id");
                            // 2. Element itself data-project-id
                            if (
                                el.getAttribute &&
                                el.getAttribute("data-project-id")
                            )
                                return el.getAttribute("data-project-id");
                            // 3. Any ancestor carrying data-project-id
                            const anyAncestor =
                                el.closest && el.closest("[data-project-id]");
                            if (
                                anyAncestor &&
                                anyAncestor.getAttribute("data-project-id")
                            )
                                return anyAncestor.getAttribute(
                                    "data-project-id"
                                );
                            // 4. Fallback: previously stored on modal (e.g., from detail view)
                            try {
                                if (
                                    projectFeedbackModalEl &&
                                    projectFeedbackModalEl.getAttribute(
                                        "data-project-id"
                                    )
                                ) {
                                    return projectFeedbackModalEl.getAttribute(
                                        "data-project-id"
                                    );
                                }
                            } catch (_) {
                                /* noop */
                            }
                            return null;
                        }

                        // --- Klik dari dropdown Feedback ---
                        if (
                            target.classList.contains("dropdown-item") &&
                            target.textContent.trim() === "Feedback"
                        ) {
                            e.preventDefault();
                            e.stopPropagation();
                            const projectId = resolveProjectId(target);
                            if (!projectId) {
                                alert("Project ID not found.");
                                return;
                            }

                            projectFeedbackModalEl.setAttribute(
                                "data-project-id",
                                projectId
                            );

                            // Hide unread badge and latest feedback snippet, and mark as read
                            hideProjectUnreadBadge(projectId);
                            hideProjectLatestFeedbackSnippet(projectId);
                            // Set target to latest payload when opening from dropdown Feedback
                            try {
                                window.__projectLatestTarget =
                                    window.__projectLatestTarget || {};
                                const latest =
                                    (window.__projectLatest &&
                                        window.__projectLatest[
                                            String(projectId)
                                        ]) ||
                                    null;
                                if (latest)
                                    window.__projectLatestTarget[
                                        String(projectId)
                                    ] = latest;
                            } catch (_) {}
                            markProjectFeedbacksRead(projectId).always(() => {
                                // continue to load data
                            });

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
                            const projectId = resolveProjectId(target);
                            if (!projectId) {
                                alert("Project ID not found.");
                                return;
                            }

                            projectFeedbackModalEl.setAttribute(
                                "data-project-id",
                                projectId
                            );

                            // Hide unread badge and latest feedback snippet, and mark as read
                            hideProjectUnreadBadge(projectId);
                            hideProjectLatestFeedbackSnippet(projectId);
                            // Set target to latest payload when opening from comment icon
                            try {
                                window.__projectLatestTarget =
                                    window.__projectLatestTarget || {};
                                const latest =
                                    (window.__projectLatest &&
                                        window.__projectLatest[
                                            String(projectId)
                                        ]) ||
                                    null;
                                if (latest)
                                    window.__projectLatestTarget[
                                        String(projectId)
                                    ] = latest;
                            } catch (_) {}
                            markProjectFeedbacksRead(projectId).always(() => {
                                // continue to load data
                            });

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

                    // Mark project feedbacks as read helper
                    function markProjectFeedbacksRead(projectId) {
                        return $.ajax({
                            url:
                                appUrl +
                                `/project/${projectId}/feedbacks/mark-read`,
                            type: "POST",
                            headers: {
                                "X-CSRF-TOKEN": document
                                    .querySelector('meta[name="csrf-token"]')
                                    .getAttribute("content"),
                            },
                        }).always(() => {
                            hideProjectUnreadBadge(projectId);
                            hideProjectLatestFeedbackSnippet(projectId);
                            latestProjectSnippetSeq[projectId] =
                                (latestProjectSnippetSeq[projectId] || 0) + 1;
                        });
                    }

                    // Helper: Build delete preview content like Task modal and inject into #deleteProjectContent
                    function setDeleteProjectModalPreview(project) {
                        try {
                            const deleteModalEl =
                                document.getElementById("deleteProjectModal");
                            if (!deleteModalEl) return;
                            const contentEl = deleteModalEl.querySelector(
                                "#deleteProjectContent"
                            );
                            if (!contentEl) return;

                            const title = project?.title || "";
                            let imgUrl = project?.image || "";
                            let avatarHtml = "";

                            if (imgUrl) {
                                const isAbsolute = /^https?:\/\//i.test(imgUrl);
                                const isFile = /^\/?(file|storage)\//i.test(
                                    imgUrl
                                );
                                if (!isAbsolute && !isFile) {
                                    imgUrl = appUrl + "/file/project/" + imgUrl;
                                } else if (!isAbsolute && isFile) {
                                    imgUrl = imgUrl.startsWith("/")
                                        ? appUrl + imgUrl
                                        : appUrl + "/" + imgUrl;
                                }
                                avatarHtml = `<img src="${imgUrl}" alt="Project Image" class="rounded-circle me-3" style="width:34px;height:34px;object-fit:cover;" onerror="this.onerror=null;this.replaceWith('<div class=&quot;rounded-circle d-flex align-items-center justify-content-center me-3&quot; style=&quot;width:34px;height:34px;background:${getInitialsColor(
                                    title
                                )};color:#fff;font-weight:600;font-size:11px;&quot;>${getInitials(
                                    title
                                )}</div>')">`;
                            } else {
                                avatarHtml = `<div class="rounded-circle d-flex align-items-center justify-content-center me-3" style="width:34px;height:34px;background:${getInitialsColor(
                                    title
                                )};color:#fff;font-weight:600;font-size:11px;">${getInitials(
                                    title
                                )}</div>`;
                            }

                                function _getDeptText(val) {
                                    try {
                                        if (!val) return "-";
                                        if (typeof val === "string") return val;
                                        if (typeof val === "object") {
                                            return (
                                                val.name_department ||
                                                val.name_division ||
                                                val.name ||
                                                val.title ||
                                                "-"
                                            );
                                        }
                                        return "-";
                                    } catch (_) {
                                        return "-";
                                    }
                                }

                                const deptRaw =
                                    project.department ??
                                    project.department_name ??
                                    project.dept ??
                                    project.departmentTitle ??
                                    project.department_obj;
                                const divRaw =
                                    project.division ??
                                    project.division_name ??
                                    project.div ??
                                    project.divisionTitle ??
                                    project.division_obj;
                                const deptText = _getDeptText(deptRaw);
                                const divText = _getDeptText(divRaw);

                                function getTaskByDueDate(projectId, callback) {
                                    $.ajax({
                                        url: appUrl + "/projects/" + projectId + "/tasks",
                                        type: "GET",
                                        dataType: "json",
                                        success: function (response) {
                                            if (response.data && response.data.length > 0) {
                                                const tasksWithDue = response.data.filter(t => t.due_date);
                                                if (tasksWithDue.length === 0) return callback(null);

                                                const maxTask = tasksWithDue.reduce((latest, t) => {
                                                    return new Date(t.due_date) > new Date(latest.due_date) ? t : latest;
                                                });

                                                callback(maxTask);
                                            } else {
                                                callback(null);
                                            }
                                        },
                                        error: function (xhr, status, err) {
                                            console.error("Error fetch tasks:", err);
                                            callback(null);
                                        }
                                    });
                                }

                                function formatTaskDate(date) {
                                    if (!date) return "-";
                                    const d = new Date(date);

                                    const year = d.getFullYear();
                                    const month = String(d.getMonth() + 1).padStart(2, "0");
                                    const day = String(d.getDate()).padStart(2, "0");

                                    return `${year}-${month}-${day}`;
                                }


                                getTaskByDueDate(project.id, function(maxTask) {
                                    const deadlineEl = document.getElementById("deadline-" + project.id);
                                    if (!deadlineEl) return;

                                    const projectDue = project.due_date ? new Date(project.due_date) : null;

                                    if (maxTask && maxTask.due_date) {
                                        const taskDue = new Date(maxTask.due_date);

                                        if (!projectDue || taskDue > projectDue) {
                                            deadlineEl.textContent = formatTaskDate(taskDue);
                                        } else {
                                            deadlineEl.textContent = formatTaskDate(projectDue);
                                        }
                                    } else {
                                        deadlineEl.textContent = projectDue ? formatTaskDate(projectDue) : "-";
                                    }
                                });

                            const parentTitle = project?.part_of_project_title
                                ? `<p class="text-muted" style="line-height:1; font-size: 10px;">${project.part_of_project_title}</p>`
                                : "";
                            const desc = project?.description
                                ? String(project.description)
                                : "";

                            const cardHtml = `
                                <div class="custom-card-delete rounded-4 position-relative p-3 border-0">
                                    <div class="d-flex align-items-center mb-2">
                                        ${avatarHtml}
                                        <div class="d-flex flex-column">
                                            ${parentTitle}
                                            <h5 class="mb-0 task-title" style="line-height:1.2;">${
                                                title || "Untitled Project"
                                            }</h5>
                                        </div>
                                    </div>
                                    ${
                                        desc
                                            ? `<div class="task-description-container mb-2"><p class="task-description mb-0" style="font-size:14px;">${desc}</p></div>`
                                            : ""
                                    }
                                    <hr class="task-separator rounded-4">
                                    <div id="project-${project.id}" class="project-card">
                                        <div class="d-flex justify-content-between align-items-center mb-2" style="font-size:12px;">
                                            <div>
                                                <span style="color:#797E91;">Deadline: </span>
                                                <span id="deadline-${project.id}" style="color:#4B4F5E;">
                                                    ${project.due_date || "-"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="d-flex justify-content-between mb-1" style="font-size:12px;">
                                        <span class="text-muted">Department:</span>
                                        <span>${deptText}</span>
                                    </div>
                                    <div class="d-flex justify-content-between mb-2" style="font-size:12px;">
                                        <span class="text-muted">Division:</span>
                                        <span>${divText}</span>
                                    </div>
                                </div>`;

                            contentEl.innerHTML = cardHtml;
                        } catch (e) {
                            console.error(
                                "setDeleteProjectModalPreview error:",
                                e
                            );
                        }
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

                                // Open delete confirmation modal and populate data (mirror Task delete flow)
                                const deleteModalEl =
                                    document.getElementById(
                                        "deleteProjectModal"
                                    );
                                const deleteModal = new bootstrap.Modal(
                                    deleteModalEl
                                );
                                // Store projectId and card element on modal for use in delete
                                deleteModalEl.dataset.projectId = projectId;
                                deleteModalEl.dataset.cardId =
                                    card.getAttribute("data-project-id");

                                // Fetch project detail to build rich preview content
                                $.ajax({
                                    url: appUrl + "/project/" + projectId,
                                    type: "GET",
                                    dataType: "json",
                                    success: function (response) {
                                        try {
                                            const project =
                                                response && response.data
                                                    ? response.data
                                                    : {};
                                            setDeleteProjectModalPreview(
                                                project
                                            );
                                        } catch (_) {
                                            const projectTitleEl =
                                                card.querySelector(
                                                    ".title-project"
                                                );
                                            const title = projectTitleEl
                                                ? projectTitleEl.textContent
                                                : "";
                                            setDeleteProjectModalPreview({
                                                title: title,
                                            });
                                        }
                                        deleteModal.show();
                                        // Clean excess backdrops if any
                                        try {
                                            document
                                                .querySelectorAll(
                                                    ".modal-backdrop"
                                                )
                                                .forEach((el, idx, arr) => {
                                                    if (idx < arr.length - 1)
                                                        el.remove();
                                                });
                                        } catch (_) {}
                                    },
                                    error: function () {
                                        const projectTitleEl =
                                            card.querySelector(
                                                ".title-project"
                                            );
                                        const title = projectTitleEl
                                            ? projectTitleEl.textContent
                                            : "";
                                        setDeleteProjectModalPreview({
                                            title: title,
                                        });
                                        deleteModal.show();
                                        try {
                                            document
                                                .querySelectorAll(
                                                    ".modal-backdrop"
                                                )
                                                .forEach((el, idx, arr) => {
                                                    if (idx < arr.length - 1)
                                                        el.remove();
                                                });
                                        } catch (_) {}
                                    },
                                });

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

                                            // Show success alert
                                            showFloatingAlert(
                                                response.message ||
                                                    "Project deleted successfully",
                                                "success",
                                                2000
                                            );
                                        },
                                        error: function (xhr) {
                                            console.error("Delete error:", xhr);
                                            showFloatingAlert(
                                                "Failed to delete project: " +
                                                    (xhr.responseJSON
                                                        ?.message ||
                                                        "Unknown error"),
                                                "warning",
                                                4000
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

                    function fetchAndShowProjectDetail(projectId) {
                        $.ajax({
                            url: appUrl + "/project/" + projectId,
                            type: "GET",
                            dataType: "json",
                            success: function (response) {
                                const project = response.data || {};
                                const baseFileUrl = appUrl + "/file/project/";
                                const pid = project.id || projectId;

                                const imageUrl = project.image
                                    ? baseFileUrl + project.image
                                    : null;

                                // Build modal content to mirror Task Detail layout
                                let avatarHtml = imageUrl
                                    ? `<img src="${imageUrl}" class="rounded-circle me-3" style="width:48px;height:48px;object-fit:cover;" onerror="this.onerror=null; this.src='${appUrl}/asset/img/avatar.png'">`
                                    : (function () {
                                          const init = getInitials(
                                              project.title || "N/A"
                                          );
                                          const color = getInitialsColor(
                                              project.title || "N/A"
                                          );
                                          return `<div class="rounded-circle d-flex align-items-center justify-content-center me-3" style="width:48px;height:48px;background:${color};color:#fff;font-weight:600;font-size:11px;">${init}</div>`;
                                      })();

                                // Normalize department/division fields: accept string or object and various key names
                                function _getDeptText(val) {
                                    try {
                                        if (!val) return "-";
                                        if (typeof val === "string") return val;
                                        if (typeof val === "object") {
                                            return (
                                                val.name_department ||
                                                val.name_division ||
                                                val.name ||
                                                val.title ||
                                                "-"
                                            );
                                        }
                                        return "-";
                                    } catch (_) {
                                        return "-";
                                    }
                                }
                                // Pull from various possible fields in the payload
                                const deptRaw =
                                    project.department ??
                                    project.department_name ??
                                    project.dept ??
                                    project.departmentTitle ??
                                    project.department_obj;
                                const divRaw =
                                    project.division ??
                                    project.division_name ??
                                    project.div ??
                                    project.divisionTitle ??
                                    project.division_obj;
                                const deptText = _getDeptText(deptRaw);
                                const divText = _getDeptText(divRaw);

                                function getTaskByDueDate(projectId, callback) {
                                    $.ajax({
                                        url: appUrl + "/projects/" + projectId + "/tasks",
                                        type: "GET",
                                        dataType: "json",
                                        success: function (response) {
                                            if (response.data && response.data.length > 0) {
                                                const tasksWithDue = response.data.filter(t => t.due_date);
                                                if (tasksWithDue.length === 0) return callback(null);

                                                const maxTask = tasksWithDue.reduce((latest, t) => {
                                                    return new Date(t.due_date) > new Date(latest.due_date) ? t : latest;
                                                });

                                                callback(maxTask);
                                            } else {
                                                callback(null);
                                            }
                                        },
                                        error: function (xhr, status, err) {
                                            console.error("Error fetch tasks:", err);
                                            callback(null);
                                        }
                                    });
                                }

                                function formatTaskDate(date) {
                                    if (!date) return "-";
                                    const d = new Date(date);

                                    const year = d.getFullYear();
                                    const month = String(d.getMonth() + 1).padStart(2, "0");
                                    const day = String(d.getDate()).padStart(2, "0");

                                    return `${year}-${month}-${day}`;
                                }


                                getTaskByDueDate(project.id, function(maxTask) {
                                    const deadlineEl = document.getElementById("deadline-" + project.id);
                                    if (!deadlineEl) return;

                                    const projectDue = project.due_date ? new Date(project.due_date) : null;

                                    if (maxTask && maxTask.due_date) {
                                        const taskDue = new Date(maxTask.due_date);

                                        if (!projectDue || taskDue > projectDue) {
                                            deadlineEl.textContent = formatTaskDate(taskDue);
                                        } else {
                                            deadlineEl.textContent = formatTaskDate(projectDue);
                                        }
                                    } else {
                                        deadlineEl.textContent = projectDue ? formatTaskDate(projectDue) : "-";
                                    }
                                });

                                const detailHtml = `
                <div class="custom-card-detail rounded-4 p-3 border-0" data-project-id="${pid}">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div class="d-flex align-items-center">
                            ${avatarHtml}
                            <div class="d-flex flex-column">
                                ${
                                    project.part_of_project_title
                                        ? `<small class=\"text-muted\" style=\"font-size:11px;\">${project.part_of_project_title}</small>`
                                        : ""
                                }
                                <h5 class="mb-0 task-title" style="font-size:16px; font-weight:600;">${
                                    project.title || "Unknown Project"
                                }</h5>
                            </div>
                        </div>
                        <div class="dropdown-icon-container">
                            <span class="material-symbols-outlined dropdown-icon mt-2 mx-2 project-edit-icon" tabindex="0">edit</span>
                        </div>
                    </div>
                    ${
                        project.description
                            ? `<p style=\"font-size:14px;\" class=\"mb-2\">${project.description}</p>`
                            : ""
                    }
                    <hr class="task-separator rounded-4">
                    <div class="d-flex justify-content-between align-items-center mb-2" style="font-size:12px;">
                        <div>
                            <span style="color:#797E91;">Deadline: </span>
                            <span id="deadline-${project.id}" style="color:#4B4F5E;">
                                ${project.due_date || "-"}
                            </span>
                        </div>
                    </div>
                    <div class="d-flex justify-content-between mb-1" style="font-size:12px;">
                        <span class="text-muted">Department:</span>
                        <span>${deptText}</span>
                    </div>
                    <div class="d-flex justify-content-between mb-2" style="font-size:12px;">
                        <span class="text-muted">Division:</span>
                        <span>${divText}</span>
                    </div>
                        <div class="d-flex justify-content-between align-items-start mt-2 gap-3">
                        <div class="flex-grow-1">${buildCollaboratorsDetailList(
                            project
                        )}</div>
                        <div class="d-flex align-items-start">
                            <div class="btn-attach-file-wrapper d-flex align-items-center me-3 position-relative">
                                <span class="material-symbols-outlined task-icon mode_comment" data-project-id="${pid}">mode_comment</span>

                                <span class="unread-badge position-absolute top-0 start-100 translate-middle d-none" data-project-id="${pid}"></span>
                            </div>
                            <div class="btn-attach-file-wrapper d-flex align-items-center">
                                <span class="material-symbols-outlined task-icon">attach_file</span>

                            </div>
                        </div>
                    </div>
                </div>`;

                                // Inject ke modal
                                $("#projectDetailContent").html(detailHtml);
                                // Initialize tooltips for collaborator avatars and +N badge inside the detail modal
                                try {
                                    const container = document.getElementById(
                                        "projectDetailContent"
                                    );
                                    if (
                                        container &&
                                        typeof initResponsiveTooltips ===
                                            "function"
                                    ) {
                                        initResponsiveTooltips(container);
                                    }
                                } catch (_) {
                                    /* noop */
                                }

                                // Bind Edit icon to open Edit Project modal
                                (function bindEditIcon() {
                                    const editBtn = document.querySelector(
                                        "#projectDetailContent .project-edit-icon"
                                    );
                                    if (!editBtn) return;
                                    editBtn.addEventListener(
                                        "click",
                                        function () {
                                            // Mark that a child modal (edit) is about to open so timeline won't be restored yet
                                            try {
                                                const detailModalEl =
                                                    document.getElementById(
                                                        "projectDetailModal"
                                                    );
                                                if (detailModalEl)
                                                    detailModalEl.setAttribute(
                                                        "data-child-opened",
                                                        "edit"
                                                    );
                                            } catch (_) {
                                                /* noop */
                                            }
                                            // Hide project detail modal first
                                            try {
                                                $("#projectDetailModal").modal(
                                                    "hide"
                                                );
                                            } catch (_) {}
                                            // Reuse edit flow: fetch project data and populate modal, then show
                                            $.ajax({
                                                url:
                                                    appUrl +
                                                    "/project/" +
                                                    pid +
                                                    "/edit",
                                                type: "GET",
                                                dataType: "json",
                                                success: function (data) {
                                                    try {
                                                        // Populate Edit form fields (same logic as dropdown Edit)
                                                        $(
                                                            "#edit_project_id"
                                                        ).val(data.id);
                                                        $("#edit_title").val(
                                                            data.title
                                                        );
                                                        $(
                                                            "#edit_description"
                                                        ).val(data.description);

                                                        // Prefill multiple reference URLs
                                                        (function () {
                                                            const container =
                                                                document.getElementById(
                                                                    "edit_project_reference_urls_container"
                                                                );
                                                            if (!container)
                                                                return;
                                                            container.innerHTML =
                                                                "";
                                                            let urls = [];
                                                            if (
                                                                Array.isArray(
                                                                    data.reference_urls
                                                                )
                                                            )
                                                                urls =
                                                                    data.reference_urls;
                                                            else if (
                                                                typeof data.reference_urls ===
                                                                "string"
                                                            ) {
                                                                try {
                                                                    const arr =
                                                                        JSON.parse(
                                                                            data.reference_urls
                                                                        );
                                                                    if (
                                                                        Array.isArray(
                                                                            arr
                                                                        )
                                                                    )
                                                                        urls =
                                                                            arr;
                                                                } catch (_) {}
                                                            }
                                                            if (
                                                                (!urls ||
                                                                    urls.length ===
                                                                        0) &&
                                                                data.reference_url
                                                            )
                                                                urls = [
                                                                    data.reference_url,
                                                                ];
                                                            function makeRow(
                                                                value,
                                                                withAdd
                                                            ) {
                                                                const row =
                                                                    document.createElement(
                                                                        "div"
                                                                    );
                                                                row.className =
                                                                    "d-flex gap-2 align-items-center";
                                                                row.innerHTML =
                                                                    '<input type="url" class="form-control input-text" name="reference_urls[]" placeholder="https://example.com">' +
                                                                    (withAdd
                                                                        ? ' <button type="button" class="btn btn-submit-black add-ref-url" aria-label="Add URL"><span class="material-symbols-outlined">add</span></button>'
                                                                        : ' <button type="button" class="btn btn-danger remove-ref-url" aria-label="Remove URL"><span class="material-symbols-outlined">close</span></button>');
                                                                container.appendChild(
                                                                    row
                                                                );
                                                                const inp =
                                                                    row.querySelector(
                                                                        'input[type="url"]'
                                                                    );
                                                                if (
                                                                    inp &&
                                                                    value
                                                                )
                                                                    inp.value =
                                                                        value;
                                                            }
                                                            if (
                                                                urls &&
                                                                urls.length
                                                            ) {
                                                                urls.forEach(
                                                                    (u) =>
                                                                        makeRow(
                                                                            u,
                                                                            false
                                                                        )
                                                                );
                                                                makeRow(
                                                                    "",
                                                                    true
                                                                );
                                                            } else {
                                                                makeRow(
                                                                    "",
                                                                    true
                                                                );
                                                            }
                                                        })();

                                                        $(
                                                            "#edit_start_date"
                                                        ).val(data.start_date);
                                                        $("#edit_due_date").val(
                                                            data.due_date
                                                        );

                                                        try {
                                                            const currentProjectId =
                                                                data.id ||
                                                                $(
                                                                    "#edit_project_id"
                                                                ).val();
                                                            const currentProjectTitle =
                                                                data.title ||
                                                                "";
                                                            populatePartOfProjectSelects(
                                                                currentProjectId,
                                                                currentProjectTitle,
                                                                data.part_of_project
                                                            );
                                                        } catch (_) {
                                                            try {
                                                                $(
                                                                    "#edit_part_of_project"
                                                                ).val(
                                                                    data.part_of_project
                                                                );
                                                            } catch (_) {}
                                                        }

                                                        // Load departments/divisions
                                                        loadDepartments(
                                                            function () {
                                                                $(
                                                                    "#edit_department"
                                                                )
                                                                    .val(
                                                                        data.department_id
                                                                    )
                                                                    .trigger(
                                                                        "change"
                                                                    );
                                                                loadDivisions(
                                                                    data.department_id,
                                                                    function () {
                                                                        $(
                                                                            "#edit_division"
                                                                        ).val(
                                                                            data.division_id
                                                                        );
                                                                        $(
                                                                            "#edit_division"
                                                                        ).trigger(
                                                                            "change"
                                                                        );
                                                                    },
                                                                    document.getElementById(
                                                                        "edit_division"
                                                                    )
                                                                );
                                                                $(
                                                                    "#edit_department"
                                                                ).trigger(
                                                                    "change"
                                                                );
                                                            },
                                                            document.getElementById(
                                                                "edit_department"
                                                            )
                                                        );

                                                        // Image preview
                                                        if (data.image) {
                                                            $(
                                                                "#editImageLabel"
                                                            ).css(
                                                                "background-image",
                                                                "url(" +
                                                                    appUrl +
                                                                    "/file/project/" +
                                                                    data.image +
                                                                    ")"
                                                            );
                                                            $(
                                                                "#editImageLabel"
                                                            ).addClass(
                                                                "has-image"
                                                            );
                                                            $(
                                                                "#editImageLabel"
                                                            ).css({
                                                                "background-size":
                                                                    "cover",
                                                                opacity: "1",
                                                            });
                                                            $(
                                                                "#editImageClearBtn"
                                                            ).removeClass(
                                                                "d-none"
                                                            );
                                                        } else {
                                                            $(
                                                                "#editImageLabel"
                                                            ).css(
                                                                "background-image",
                                                                "url('" +
                                                                    appUrl +
                                                                    "/asset/img/background/add-image.png')"
                                                            );
                                                            $(
                                                                "#editImageLabel"
                                                            ).removeClass(
                                                                "has-image"
                                                            );
                                                            $(
                                                                "#editImageLabel"
                                                            ).css(
                                                                "opacity",
                                                                "0.5"
                                                            );
                                                            $(
                                                                "#editImageClearBtn"
                                                            ).addClass(
                                                                "d-none"
                                                            );
                                                        }

                                                        // Files (existing and new)
                                                        $(
                                                            "#edit_reference_file"
                                                        ).val("");
                                                        var existingFiles =
                                                            Array.isArray(
                                                                data.reference_files
                                                            )
                                                                ? data.reference_files.slice()
                                                                : Array.isArray(
                                                                      data.reference_file
                                                                  )
                                                                ? data.reference_file.slice()
                                                                : data.reference_file
                                                                ? [
                                                                      data.reference_file,
                                                                  ]
                                                                : [];
                                                        var existingInput =
                                                            document.getElementById(
                                                                "existing_reference_files_input"
                                                            );
                                                        if (!existingInput) {
                                                            existingInput =
                                                                document.createElement(
                                                                    "input"
                                                                );
                                                            existingInput.type =
                                                                "hidden";
                                                            existingInput.id =
                                                                "existing_reference_files_input";
                                                            existingInput.name =
                                                                "existing_reference_files";
                                                            document
                                                                .getElementById(
                                                                    "editProjectForm"
                                                                )
                                                                .appendChild(
                                                                    existingInput
                                                                );
                                                        }
                                                        existingInput.value =
                                                            JSON.stringify(
                                                                existingFiles
                                                            );

                                                        var previewEdit =
                                                            document.getElementById(
                                                                "edit_reference_files_preview"
                                                            );
                                                        var existingContainer =
                                                            document.getElementById(
                                                                "existing_reference_files"
                                                            );
                                                        if (previewEdit)
                                                            previewEdit.innerHTML =
                                                                "";
                                                        if (existingContainer)
                                                            existingContainer.innerHTML =
                                                                "";
                                                        window.editProjectSelectedFiles =
                                                            [];
                                                        function renderExistingProjectFiles() {
                                                            if (
                                                                !existingContainer
                                                            )
                                                                return;
                                                            existingContainer.innerHTML =
                                                                "";
                                                            if (
                                                                existingFiles.length >
                                                                0
                                                            ) {
                                                                var title =
                                                                    document.createElement(
                                                                        "div"
                                                                    );
                                                                title.className =
                                                                    "fw-bold mb-2";
                                                                title.textContent =
                                                                    "Current Files:";
                                                                existingContainer.appendChild(
                                                                    title
                                                                );
                                                                var fileList =
                                                                    document.createElement(
                                                                        "div"
                                                                    );
                                                                fileList.className =
                                                                    "existing-files-list w-100";
                                                                existingFiles.forEach(
                                                                    function (
                                                                        fileName
                                                                    ) {
                                                                        var fileItem =
                                                                            document.createElement(
                                                                                "div"
                                                                            );
                                                                        fileItem.className =
                                                                            "existing-file-item d-flex align-items-center justify-content-between mb-2 p-2 bg-light border rounded";
                                                                        var fileInfo =
                                                                            document.createElement(
                                                                                "div"
                                                                            );
                                                                        fileInfo.className =
                                                                            "d-flex align-items-center flex-grow-1";
                                                                        var fileIcon =
                                                                            document.createElement(
                                                                                "span"
                                                                            );
                                                                        fileIcon.className =
                                                                            "material-symbols-outlined me-2";
                                                                        fileIcon.textContent =
                                                                            "description";
                                                                        var fileLink =
                                                                            document.createElement(
                                                                                "a"
                                                                            );
                                                                        fileLink.href =
                                                                            appUrl +
                                                                            "/file/project/" +
                                                                            fileName;
                                                                        fileLink.textContent =
                                                                            fileName;
                                                                        fileLink.className =
                                                                            "text-decoration-none";
                                                                        fileLink.target =
                                                                            "_blank";
                                                                        var removeBtn =
                                                                            document.createElement(
                                                                                "button"
                                                                            );
                                                                        removeBtn.type =
                                                                            "button";
                                                                        removeBtn.className =
                                                                            "btn btn-sm btn-outline-danger";
                                                                        removeBtn.innerHTML =
                                                                            "&times;";
                                                                        removeBtn.onclick =
                                                                            function () {
                                                                                existingFiles =
                                                                                    existingFiles.filter(
                                                                                        function (
                                                                                            f
                                                                                        ) {
                                                                                            return (
                                                                                                f !==
                                                                                                fileName
                                                                                            );
                                                                                        }
                                                                                    );
                                                                                existingInput.value =
                                                                                    JSON.stringify(
                                                                                        existingFiles
                                                                                    );
                                                                                renderExistingProjectFiles();
                                                                            };
                                                                        fileInfo.appendChild(
                                                                            fileIcon
                                                                        );
                                                                        fileInfo.appendChild(
                                                                            fileLink
                                                                        );
                                                                        fileItem.appendChild(
                                                                            fileInfo
                                                                        );
                                                                        fileItem.appendChild(
                                                                            removeBtn
                                                                        );
                                                                        fileList.appendChild(
                                                                            fileItem
                                                                        );
                                                                    }
                                                                );
                                                                existingContainer.appendChild(
                                                                    fileList
                                                                );
                                                            }
                                                        }
                                                        function renderEditProjectSelectedFiles() {
                                                            if (!previewEdit)
                                                                return;
                                                            previewEdit.innerHTML =
                                                                "";
                                                            if (
                                                                window
                                                                    .editProjectSelectedFiles
                                                                    .length > 0
                                                            ) {
                                                                var fileList =
                                                                    document.createElement(
                                                                        "div"
                                                                    );
                                                                fileList.className =
                                                                    "selected-files-list mt-2";
                                                                window.editProjectSelectedFiles.forEach(
                                                                    function (
                                                                        file,
                                                                        index
                                                                    ) {
                                                                        var fileItem =
                                                                            document.createElement(
                                                                                "div"
                                                                            );
                                                                        fileItem.className =
                                                                            "selected-file-item d-flex align-items-center justify-content-between mb-2 p-2 bg-light border rounded";
                                                                        var fileInfo =
                                                                            document.createElement(
                                                                                "div"
                                                                            );
                                                                        fileInfo.className =
                                                                            "d-flex align-items-center flex-grow-1";
                                                                        var fileIcon =
                                                                            document.createElement(
                                                                                "span"
                                                                            );
                                                                        fileIcon.className =
                                                                            "material-symbols-outlined me-2";
                                                                        fileIcon.textContent =
                                                                            "description";
                                                                        var fileName =
                                                                            document.createElement(
                                                                                "span"
                                                                            );
                                                                        fileName.textContent =
                                                                            file.name;
                                                                        fileName.className =
                                                                            "file-name";
                                                                        var fileSize =
                                                                            document.createElement(
                                                                                "small"
                                                                            );
                                                                        fileSize.textContent =
                                                                            " (" +
                                                                            (
                                                                                file.size /
                                                                                1024 /
                                                                                1024
                                                                            ).toFixed(
                                                                                2
                                                                            ) +
                                                                            " MB)";
                                                                        fileSize.className =
                                                                            "text-muted ms-1";
                                                                        var removeBtn =
                                                                            document.createElement(
                                                                                "button"
                                                                            );
                                                                        removeBtn.type =
                                                                            "button";
                                                                        removeBtn.className =
                                                                            "btn btn-sm btn-outline-danger";
                                                                        removeBtn.innerHTML =
                                                                            "&times;";
                                                                        removeBtn.onclick =
                                                                            function () {
                                                                                window.editProjectSelectedFiles.splice(
                                                                                    index,
                                                                                    1
                                                                                );
                                                                                renderEditProjectSelectedFiles();
                                                                            };
                                                                        fileInfo.appendChild(
                                                                            fileIcon
                                                                        );
                                                                        fileInfo.appendChild(
                                                                            fileName
                                                                        );
                                                                        fileInfo.appendChild(
                                                                            fileSize
                                                                        );
                                                                        fileItem.appendChild(
                                                                            fileInfo
                                                                        );
                                                                        fileItem.appendChild(
                                                                            removeBtn
                                                                        );
                                                                        fileList.appendChild(
                                                                            fileItem
                                                                        );
                                                                    }
                                                                );
                                                                previewEdit.appendChild(
                                                                    fileList
                                                                );
                                                            }
                                                        }
                                                        $(
                                                            "#edit_reference_file"
                                                        )
                                                            .off("change")
                                                            .on(
                                                                "change",
                                                                function () {
                                                                    var files =
                                                                        Array.from(
                                                                            this
                                                                                .files ||
                                                                                []
                                                                        );
                                                                    if (
                                                                        files.length >
                                                                        0
                                                                    ) {
                                                                        window.editProjectSelectedFiles =
                                                                            window.editProjectSelectedFiles.concat(
                                                                                files
                                                                            );
                                                                        renderEditProjectSelectedFiles();
                                                                        this.value =
                                                                            "";
                                                                    }
                                                                }
                                                            );
                                                        renderExistingProjectFiles();
                                                        renderEditProjectSelectedFiles();

                                                        // Co-authors & contributors
                                                        window.clearSelectedCoAuthorsEdit &&
                                                            window.clearSelectedCoAuthorsEdit();
                                                        window.clearSelectedContributorsEdit &&
                                                            window.clearSelectedContributorsEdit();
                                                        if (data.co_authors) {
                                                            var coAuthors =
                                                                data.co_authors.map(
                                                                    function (
                                                                        a
                                                                    ) {
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
                                                        if (data.contributors) {
                                                            var contributors =
                                                                data.contributors.map(
                                                                    function (
                                                                        a
                                                                    ) {
                                                                        return {
                                                                            id: a.id,
                                                                            name: a.name,
                                                                            user_photo:
                                                                                a.user_photo ||
                                                                                null,
                                                                        };
                                                                    }
                                                                );
                                                            window.setSelectedContributorsEdit &&
                                                                window.setSelectedContributorsEdit(
                                                                    contributors
                                                                );
                                                        }

                                                        const editProjectModalEl =
                                                            document.getElementById(
                                                                "editProjectModal"
                                                            );
                                                        if (
                                                            !editProjectModalEl
                                                        ) {
                                                            showFloatingAlert(
                                                                "Edit Project Modal element not found",
                                                                "warning",
                                                                3500
                                                            );
                                                            return;
                                                        }
                                                        const editProjectModal =
                                                            bootstrap &&
                                                            bootstrap.Modal &&
                                                            bootstrap.Modal
                                                                .getOrCreateInstance
                                                                ? bootstrap.Modal.getOrCreateInstance(
                                                                      editProjectModalEl
                                                                  )
                                                                : bootstrap.Modal.getInstance(
                                                                      editProjectModalEl
                                                                  ) ||
                                                                  new bootstrap.Modal(
                                                                      editProjectModalEl
                                                                  );
                                                        editProjectModal.show();
                                                        // When Edit closes, return to Detail (and clear child-open flag)
                                                        try {
                                                            const onEditHidden =
                                                                function () {
                                                                    const detailEl =
                                                                        document.getElementById(
                                                                            "projectDetailModal"
                                                                        );
                                                                    if (
                                                                        detailEl
                                                                    ) {
                                                                        detailEl.removeAttribute(
                                                                            "data-child-opened"
                                                                        );
                                                                        // Prefer showing existing detail modal instance; fallback to refetch
                                                                        try {
                                                                            $(
                                                                                "#projectDetailModal"
                                                                            ).modal(
                                                                                "show"
                                                                            );
                                                                        } catch (_) {
                                                                            try {
                                                                                fetchAndShowProjectDetail(
                                                                                    pid
                                                                                );
                                                                            } catch (__) {}
                                                                        }
                                                                    }
                                                                    editProjectModalEl.removeEventListener(
                                                                        "hidden.bs.modal",
                                                                        onEditHidden
                                                                    );
                                                                };
                                                            editProjectModalEl.addEventListener(
                                                                "hidden.bs.modal",
                                                                onEditHidden,
                                                                { once: true }
                                                            );
                                                        } catch (_) {
                                                            /* noop */
                                                        }
                                                    } catch (err) {
                                                        console.error(
                                                            "Failed to open edit project modal from detail:",
                                                            err
                                                        );
                                                        showFloatingAlert(
                                                            "Failed to open edit project modal",
                                                            "warning",
                                                            3500
                                                        );
                                                    }
                                                },
                                                error: function () {
                                                    try {
                                                        const detailEl =
                                                            document.getElementById(
                                                                "projectDetailModal"
                                                            );
                                                        if (detailEl)
                                                            detailEl.removeAttribute(
                                                                "data-child-opened"
                                                            );
                                                        $(
                                                            "#projectDetailModal"
                                                        ).modal("show");
                                                    } catch (_) {}
                                                    showFloatingAlert(
                                                        "Failed to load edit form. Please try again.",
                                                        "warning",
                                                        3500
                                                    );
                                                },
                                            });
                                        }
                                    );
                                })();

                                // Bind comment icon (mode_comment) to open Project Feedback modal
                                (function bindCommentIcon() {
                                    const icon = document.querySelector(
                                        "#projectDetailContent .task-icon.mode_comment"
                                    );
                                    const btn = document.getElementById(
                                        "projectDetailCommentBtn"
                                    );
                                    const handler = function (ev) {
                                        ev &&
                                            ev.preventDefault &&
                                            ev.preventDefault();
                                        ev &&
                                            ev.stopPropagation &&
                                            ev.stopPropagation();
                                        // Mark that a child modal (feedback) is about to open
                                        try {
                                            const detailModalEl =
                                                document.getElementById(
                                                    "projectDetailModal"
                                                );
                                            if (detailModalEl)
                                                detailModalEl.setAttribute(
                                                    "data-child-opened",
                                                    "feedback"
                                                );
                                        } catch (_) {
                                            /* noop */
                                        }
                                        try {
                                            $("#projectDetailModal").modal(
                                                "hide"
                                            );
                                        } catch (_) {}
                                        const projectFeedbackModalEl =
                                            document.getElementById(
                                                "projectFeedbackModal"
                                            );
                                        if (projectFeedbackModalEl) {
                                            projectFeedbackModalEl.setAttribute(
                                                "data-project-id",
                                                String(pid)
                                            );
                                            projectFeedbackModalEl.setAttribute(
                                                "data-return-to-detail",
                                                "1"
                                            );
                                            // When feedback modal closes, return to detail (one-time listener)
                                            projectFeedbackModalEl.addEventListener(
                                                "hidden.bs.modal",
                                                function onHidden() {
                                                    try {
                                                        if (
                                                            projectFeedbackModalEl.getAttribute(
                                                                "data-return-to-detail"
                                                            ) === "1"
                                                        ) {
                                                            projectFeedbackModalEl.removeAttribute(
                                                                "data-return-to-detail"
                                                            );
                                                            const detailEl =
                                                                document.getElementById(
                                                                    "projectDetailModal"
                                                                );
                                                            if (detailEl)
                                                                detailEl.removeAttribute(
                                                                    "data-child-opened"
                                                                );
                                                            fetchAndShowProjectDetail(
                                                                pid
                                                            );
                                                        }
                                                    } catch (_) {}
                                                },
                                                { once: true }
                                            );
                                        }
                                        try {
                                            loadFeedbackData(pid);
                                        } catch (_) {}
                                        const m = new bootstrap.Modal(
                                            projectFeedbackModalEl
                                        );
                                        m.show();
                                    };
                                    if (icon)
                                        (icon.style.cursor = "pointer"),
                                            icon.addEventListener(
                                                "click",
                                                handler
                                            );
                                    if (btn)
                                        (btn.style.cursor = "pointer"),
                                            btn.addEventListener(
                                                "click",
                                                handler
                                            );
                                })();

                                // Bind attach icon to open Project Files modal
                                (function bindAttachIcon() {
                                    const attachWrapper =
                                        document.querySelectorAll(
                                            "#projectDetailContent .btn-attach-file-wrapper .task-icon"
                                        );
                                    attachWrapper.forEach(function (el) {
                                        if (
                                            el.textContent.trim() ===
                                            "attach_file"
                                        ) {
                                            el.style.cursor = "pointer";
                                            el.addEventListener(
                                                "click",
                                                function () {
                                                    // Mark that a child modal (files) is about to open
                                                    try {
                                                        const detailModalEl =
                                                            document.getElementById(
                                                                "projectDetailModal"
                                                            );
                                                        if (detailModalEl)
                                                            detailModalEl.setAttribute(
                                                                "data-child-opened",
                                                                "files"
                                                            );
                                                    } catch (_) {
                                                        /* noop */
                                                    }
                                                    try {
                                                        $(
                                                            "#projectDetailModal"
                                                        ).modal("hide");
                                                    } catch (_) {}
                                                    const filesModalEl =
                                                        document.getElementById(
                                                            "projectFilesModal"
                                                        );
                                                    if (filesModalEl) {
                                                        filesModalEl.setAttribute(
                                                            "data-return-to-detail",
                                                            "1"
                                                        );
                                                        // One-time listener to return to detail when files modal closes
                                                        filesModalEl.addEventListener(
                                                            "hidden.bs.modal",
                                                            function onHidden() {
                                                                try {
                                                                    if (
                                                                        filesModalEl.getAttribute(
                                                                            "data-return-to-detail"
                                                                        ) ===
                                                                        "1"
                                                                    ) {
                                                                        filesModalEl.removeAttribute(
                                                                            "data-return-to-detail"
                                                                        );
                                                                        const detailEl =
                                                                            document.getElementById(
                                                                                "projectDetailModal"
                                                                            );
                                                                        if (
                                                                            detailEl
                                                                        )
                                                                            detailEl.removeAttribute(
                                                                                "data-child-opened"
                                                                            );
                                                                        fetchAndShowProjectDetail(
                                                                            pid
                                                                        );
                                                                    }
                                                                } catch (_) {}
                                                            },
                                                            { once: true }
                                                        );
                                                    }
                                                    showProjectFiles(pid);
                                                }
                                            );
                                        }
                                    });
                                })();

                                // Bind Delete button in footer to open Delete Project confirmation modal
                                (function bindDeleteButton() {
                                    const delBtn = document.querySelector(
                                        "#projectDetailContent .delete-project-btn"
                                    );
                                    if (!delBtn) return;
                                    delBtn.addEventListener(
                                        "click",
                                        function () {
                                            try {
                                                $("#projectDetailModal").modal(
                                                    "hide"
                                                );
                                            } catch (_) {}
                                            const deleteModalEl =
                                                document.getElementById(
                                                    "deleteProjectModal"
                                                );
                                            if (!deleteModalEl) {
                                                showFloatingAlert(
                                                    "Delete Project Modal not found",
                                                    "warning",
                                                    3000
                                                );
                                                return;
                                            }
                                            const deleteModal =
                                                new bootstrap.Modal(
                                                    deleteModalEl
                                                );
                                            // Populate content card
                                            setDeleteProjectModalPreview(
                                                project
                                            );
                                            deleteModalEl.dataset.projectId =
                                                pid;
                                            deleteModal.show();
                                            // Confirm delete handler
                                            const confirmDeleteBtn =
                                                document.getElementById(
                                                    "confirmDeleteProjectBtn"
                                                );
                                            if (confirmDeleteBtn) {
                                                confirmDeleteBtn.onclick =
                                                    function () {
                                                        $.ajax({
                                                            url:
                                                                appUrl +
                                                                "/project/" +
                                                                pid,
                                                            type: "DELETE",
                                                            headers: {
                                                                "X-CSRF-TOKEN":
                                                                    $(
                                                                        "meta[name='csrf-token']"
                                                                    ).attr(
                                                                        "content"
                                                                    ),
                                                            },
                                                            success: function (
                                                                resp
                                                            ) {
                                                                deleteModal.hide();
                                                                try {
                                                                    loadProjectCardData();
                                                                } catch (_) {}
                                                                showFloatingAlert(
                                                                    resp.message ||
                                                                        "Project deleted successfully",
                                                                    "success",
                                                                    2000
                                                                );
                                                            },
                                                            error: function (
                                                                xhr
                                                            ) {
                                                                console.error(
                                                                    "Delete error:",
                                                                    xhr
                                                                );
                                                                showFloatingAlert(
                                                                    "Failed to delete project: " +
                                                                        (xhr
                                                                            .responseJSON
                                                                            ?.message ||
                                                                            "Unknown error"),
                                                                    "warning",
                                                                    4000
                                                                );
                                                            },
                                                        });
                                                    };
                                            }
                                        }
                                    );
                                })();

                                // Show modal
                                $("#projectDetailModal").modal("show");

                                // Bind sticky footer delete button to open delete modal for this project
                                try {
                                    const footerDeleteBtn =
                                        document.getElementById(
                                            "projectDetailDeleteBtn"
                                        );
                                    if (footerDeleteBtn) {
                                        footerDeleteBtn.onclick = function () {
                                            try {
                                                $("#projectDetailModal").modal(
                                                    "hide"
                                                );
                                            } catch (_) {}
                                            const deleteModalEl =
                                                document.getElementById(
                                                    "deleteProjectModal"
                                                );
                                            if (!deleteModalEl) {
                                                showFloatingAlert(
                                                    "Delete Project Modal not found",
                                                    "warning",
                                                    3000
                                                );
                                                return;
                                            }
                                            const deleteModal =
                                                new bootstrap.Modal(
                                                    deleteModalEl
                                                );
                                            // Populate preview content using fetched project data
                                            try {
                                                setDeleteProjectModalPreview(
                                                    project
                                                );
                                            } catch (_) {}
                                            deleteModalEl.dataset.projectId =
                                                pid;
                                            deleteModal.show();
                                            const confirmDeleteBtn =
                                                document.getElementById(
                                                    "confirmDeleteProjectBtn"
                                                );
                                            if (confirmDeleteBtn) {
                                                confirmDeleteBtn.onclick =
                                                    function () {
                                                        $.ajax({
                                                            url:
                                                                appUrl +
                                                                "/project/" +
                                                                pid,
                                                            type: "DELETE",
                                                            headers: {
                                                                "X-CSRF-TOKEN":
                                                                    $(
                                                                        "meta[name='csrf-token']"
                                                                    ).attr(
                                                                        "content"
                                                                    ),
                                                            },
                                                            success: function (
                                                                resp
                                                            ) {
                                                                deleteModal.hide();
                                                                try {
                                                                    loadProjectCardData();
                                                                } catch (_) {}
                                                                showFloatingAlert(
                                                                    resp.message ||
                                                                        "Project deleted successfully",
                                                                    "success",
                                                                    2000
                                                                );
                                                            },
                                                            error: function (
                                                                xhr
                                                            ) {
                                                                console.error(
                                                                    "Delete error:",
                                                                    xhr
                                                                );
                                                                showFloatingAlert(
                                                                    "Failed to delete project: " +
                                                                        (xhr
                                                                            .responseJSON
                                                                            ?.message ||
                                                                            "Unknown error"),
                                                                    "warning",
                                                                    4000
                                                                );
                                                            },
                                                        });
                                                    };
                                            }
                                        };
                                    }
                                } catch (_) {
                                    /* noop */
                                }
                            },
                            error: function () {
                                alert("Failed to load project details.");
                            },
                        });
                    }

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

                                // Clear any timeline reopening flags when opening from dropdown
                                const detailEl = document.getElementById(
                                    "projectDetailModal"
                                );
                                if (detailEl) {
                                    detailEl.removeAttribute("data-reopen-timeline");
                                    detailEl.removeAttribute("data-child-opened");
                                }

                                // Redirect to project show page instead of opening modal
                                // Build a simple slug from project title (fallback to title text if data attribute missing)
                                function slugify(str) {
                                    if (!str) return "";
                                    try {
                                        return String(str)
                                            .toLowerCase()
                                            .normalize('NFD')
                                            .replace(/\p{Diacritic}/gu, "")
                                            .replace(/[^a-z0-9\s-]/g, "")
                                            .trim()
                                            .replace(/\s+/g, "-")
                                            .replace(/-+/g, "-");
                                    } catch (err) {
                                        return String(str)
                                            .toLowerCase()
                                            .replace(/[^a-z0-9\s-]/g, "")
                                            .trim()
                                            .replace(/\s+/g, "-")
                                            .replace(/-+/g, "-");
                                    }
                                }

                                var titleAttr = card.getAttribute("data-project-title") || "";
                                var titleTextEl = card.querySelector('.title-project');
                                var titleText = titleTextEl ? titleTextEl.textContent.trim() : "";
                                var slugSource = titleAttr || titleText || projectId;
                                var slug = slugify(slugSource);

                                var redirectUrl = appUrl + "/project/" + projectId + (slug ? "/" + slug : "");
                                // perform navigation
                                window.location.href = redirectUrl;
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

                    // Click on timeline bar opens the same Project Detail modal
                    // If the click comes from the timeline modal, close the timeline first,
                    // then show Project Detail. After closing Project Detail, reopen the timeline modal.
                    document.addEventListener("click", function (e) {
                        const bar = e.target.closest(
                            ".timeline-bar[data-project-id]"
                        );
                        if (!bar) return;
                        const pid = bar.getAttribute("data-project-id");
                        if (!pid) return;

                        // Detect if timeline modal is currently open
                        const timelineModalEl =
                            document.getElementById("timelineModal");
                        let shouldReopenTimeline = false;
                        if (
                            timelineModalEl &&
                            timelineModalEl.classList.contains("show")
                        ) {
                            try {
                                const tlInstance =
                                    bootstrap.Modal.getInstance(
                                        timelineModalEl
                                    ) || new bootstrap.Modal(timelineModalEl);
                                tlInstance.hide();
                                shouldReopenTimeline = true;
                            } catch (_) {}
                        }

                        // Mark to reopen timeline after detail is closed (only when originated from timeline)
                        if (shouldReopenTimeline) {
                            const detailEl =
                                document.getElementById("projectDetailModal");
                            if (detailEl) {
                                // Clear any existing flags first
                                detailEl.removeAttribute("data-child-opened");
                                // Set a flag on detail so we remember to reopen timeline later
                                detailEl.setAttribute(
                                    "data-reopen-timeline",
                                    "1"
                                );
                                // Timeline reopen logic is now handled by the main modal hidden handler
                            }
                        } else {
                            // Ensure no timeline reopening if not originated from timeline
                            const detailEl =
                                document.getElementById("projectDetailModal");
                            if (detailEl) {
                                detailEl.removeAttribute(
                                    "data-reopen-timeline"
                                );
                                detailEl.removeAttribute("data-child-opened");
                            }
                        }

                        // Proceed to open Project Detail
                        fetchAndShowProjectDetail(pid);
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

                    let taskModal;
                    // Function to load project tasks
                    function loadProjectTasks(projectId) {
                        const taskModalEl =
                            document.getElementById("taskModal");
                        const taskModal =
                            bootstrap.Modal.getOrCreateInstance(taskModalEl);

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
                                    // Ensure global fallback handler exists (once)
                                    if (!window.replaceTaskImageError) {
                                        window.replaceTaskImageError =
                                            function (imgEl, title) {
                                                try {
                                                    if (!imgEl) return;
                                                    const txt = (
                                                        title || ""
                                                    ).trim();
                                                    let initials = "NA";
                                                    if (
                                                        typeof getInitials ===
                                                        "function"
                                                    ) {
                                                        initials =
                                                            getInitials(txt) ||
                                                            "NA";
                                                    } else if (txt) {
                                                        const parts = txt
                                                            .split(/\s+/)
                                                            .filter(Boolean);
                                                        initials =
                                                            parts.length === 1
                                                                ? parts[0]
                                                                      .substring(
                                                                          0,
                                                                          2
                                                                      )
                                                                      .toUpperCase()
                                                                : (
                                                                      parts[0].charAt(
                                                                          0
                                                                      ) +
                                                                      parts[
                                                                          parts.length -
                                                                              1
                                                                      ].charAt(
                                                                          0
                                                                      )
                                                                  ).toUpperCase();
                                                    }
                                                    let color = "#6A5AE0";
                                                    if (
                                                        typeof getInitialsColor ===
                                                        "function"
                                                    ) {
                                                        color =
                                                            getInitialsColor(
                                                                txt
                                                            ) || color;
                                                    }
                                                    const avatar =
                                                        document.createElement(
                                                            "div"
                                                        );
                                                    avatar.className =
                                                        "task-modal-initial-avatar me-3";
                                                    avatar.style.cssText =
                                                        "width:100px;height:100px;flex:0 0 100px;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:30px;color:#fff;border-radius:8px;background:" +
                                                        color +
                                                        ";";
                                                    avatar.textContent =
                                                        initials;
                                                    imgEl.replaceWith(avatar);
                                                } catch (_) {}
                                            };
                                    }

                                    response.data.forEach((task) => {
                                        const hasImage = !!(
                                            task.image &&
                                            String(task.image).trim()
                                        );
                                        const taskImage = hasImage
                                            ? appUrl +
                                              "/file/task/" +
                                              task.image
                                            : null;
                                        const safeTitle = (
                                            task.title || ""
                                        ).replace(/['"\\]/g, function (m) {
                                            return "\\" + m;
                                        });
                                        let imageBlockHtml;
                                        if (taskImage) {
                                            imageBlockHtml = `<img src="${taskImage}" alt="${safeTitle}" class="me-3" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px;" onerror="window.replaceTaskImageError && window.replaceTaskImageError(this, '${safeTitle}')">`;
                                        } else {
                                            // Directly render initials avatar
                                            let initials = "NA";
                                            if (
                                                typeof getInitials ===
                                                "function"
                                            ) {
                                                initials =
                                                    getInitials(
                                                        task.title || ""
                                                    ) || "NA";
                                            } else {
                                                const txt = (
                                                    task.title || ""
                                                ).trim();
                                                if (txt) {
                                                    const parts = txt
                                                        .split(/\s+/)
                                                        .filter(Boolean);
                                                    initials =
                                                        parts.length === 1
                                                            ? parts[0]
                                                                  .substring(
                                                                      0,
                                                                      2
                                                                  )
                                                                  .toUpperCase()
                                                            : (
                                                                  parts[0].charAt(
                                                                      0
                                                                  ) +
                                                                  parts[
                                                                      parts.length -
                                                                          1
                                                                  ].charAt(0)
                                                              ).toUpperCase();
                                                }
                                            }
                                            let color = "#6A5AE0";
                                            if (
                                                typeof getInitialsColor ===
                                                "function"
                                            ) {
                                                color =
                                                    getInitialsColor(
                                                        task.title || ""
                                                    ) || color;
                                            }
                                            imageBlockHtml = `<div class=\"task-modal-initial-avatar me-3\" style=\"width:100px;height:100px;flex:0 0 100px;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:30px;color:#fff;border-radius:8px;background:${color};\">${initials}</div>`;
                                        }

                                        const createdDate = formatTaskDate(
                                            task.created_at
                                        );

                                        function getImageUrl(userPhoto) {
                                            if (!userPhoto) {
                                                return (
                                                    appUrl +
                                                    "/asset/img/avatar.png"
                                                );
                                            }
                                            // Absolute URL
                                            if (/^https?:\/\//i.test(userPhoto))
                                                return userPhoto;
                                            // Already has leading slash, just append base appUrl
                                            if (userPhoto.startsWith("/"))
                                                return appUrl + userPhoto;
                                            // If it's already a relative path with directories (e.g. file/photo/..., file/profile_picture/..., asset/img/...) don't re-prefix profile_picture
                                            if (userPhoto.includes("/"))
                                                return (
                                                    appUrl +
                                                    "/" +
                                                    userPhoto.replace(
                                                        /^\/+/,
                                                        ""
                                                    )
                                                );
                                            // Otherwise treat as bare filename that lives in profile_picture
                                            return (
                                                appUrl +
                                                "/file/profile_picture/" +
                                                userPhoto
                                            );
                                        }

                                        let allPeople = [];
                                        if (task.pic) {
                                            allPeople.push({
                                                id: task.pic.id,
                                                image: getImageUrl(
                                                    task.pic.user_photo
                                                ),
                                                name:
                                                    task.pic.name || "Unknown",
                                                title: "PIC",
                                            });
                                        }

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
                                                        allPeople.push({
                                                            id: executor.id,
                                                            image: getImageUrl(
                                                                executor.user_photo
                                                            ),
                                                            name:
                                                                executor.name ||
                                                                "Unknown",
                                                            title: "Contributor",
                                                        });
                                                    }
                                                }
                                            );
                                        }

                                        const combinedImagesHtml = allPeople
                                            .map((person, index) => {
                                                const overlapStyle =
                                                    index === 0
                                                        ? ""
                                                        : " margin-left: -8px;";
                                                const zIndex =
                                                    allPeople.length - index;
                                                return `
                                                    <img src="${person.image}"
                                                        alt="${person.name}"
                                                        class="pic-contributor-image"
                                                        data-bs-toggle="tooltip"
                                                        title="${person.name} (${person.title})"
                                                        style="width:28px; height:28px; object-fit:cover; border-radius:50%;${overlapStyle} z-index:${zIndex};">
                                                `;
                                            })
                                            .join("");

                                        let statusClass = "";
                                        let statusText = task.status;
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
                                        }

                                        html += `
                                            <div class="task-item d-flex align-items-start mb-3 pb-3 border-bottom">
                                                ${imageBlockHtml}
                                                <div class="flex-grow-1">
                                                    <div class="d-flex justify-content-between align-items-start">
                                                        <div class="fw-bold">${task.title}</div>
                                                        <span class="${statusClass}">${statusText}</span>
                                                    </div>
                                                    <div class="text-muted small mb-2">${createdDate}</div>
                                                    <div class="d-flex align-items-center">
                                                        <div class="d-flex align-items-center pic-contributor-container">
                                                            ${combinedImagesHtml}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        `;
                                    });

                                    taskListContainer.innerHTML = html;

                                    // Init tooltip setelah DOM siap dengan responsive placement
                                    initResponsiveTooltips(taskListContainer);
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
                        // Resolve footer consistently (like Task)
                        const footer = (function () {
                            try {
                                return (
                                    projectFeedbackModalEl.querySelector(
                                        ".feedback-modal-footer"
                                    ) ||
                                    projectFeedbackModalEl.querySelector(
                                        ".modal-footer"
                                    ) ||
                                    projectFeedbackModalEl.querySelector(
                                        ".modal-footer-custom"
                                    )
                                );
                            } catch (_) {
                                return null;
                            }
                        })();

                        if (footer) {
                            try {
                                // Clear footer completely and rebuild single Add Feedback button
                                footer.innerHTML = "";
                                const addBtn = document.createElement("button");
                                addBtn.type = "button";
                                addBtn.className = "btn btn-submit-black w-100";
                                addBtn.id = "addFeedbackButton";
                                addBtn.textContent = "Add Feedback";
                                addBtn.addEventListener("click", function () {
                                    const projectId =
                                        projectFeedbackModalEl.getAttribute(
                                            "data-project-id"
                                        );
                                    if (projectId)
                                        showAddFeedbackForm(projectId);
                                });
                                footer.appendChild(addBtn);
                            } catch (_) {
                                /* noop */
                            }
                        } else {
                            // Fallback: just update existing button text
                            try {
                                const addFeedbackButton =
                                    document.getElementById(
                                        "addFeedbackButton"
                                    );
                                if (addFeedbackButton) {
                                    addFeedbackButton.textContent =
                                        "Add Feedback";
                                    addFeedbackButton.classList.add("w-100");
                                    const fresh =
                                        addFeedbackButton.cloneNode(true);
                                    addFeedbackButton.parentNode.replaceChild(
                                        fresh,
                                        addFeedbackButton
                                    );
                                    fresh.addEventListener(
                                        "click",
                                        function () {
                                            const projectId =
                                                projectFeedbackModalEl.getAttribute(
                                                    "data-project-id"
                                                );
                                            if (projectId)
                                                showAddFeedbackForm(projectId);
                                        }
                                    );
                                }
                            } catch (_) {
                                /* noop */
                            }
                        }
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
                        const updatePromises = projects.map((project) => {
                            return new Promise((resolve) => {
                                if (
                                    typeof window.updateProjectBadges ===
                                    "function"
                                ) {
                                    window.updateProjectBadges(project.id);
                                }
                                resolve();
                            });
                        });

                        Promise.all(updatePromises).then(() => {
                            console.log(
                                "All project badges updated successfully"
                            );
                        });
                    }, 50); // Further reduced delay for instant update
                } else {
                    // No projects. If backend provides aggregated task chart_counts,
                    // we already updated the chart above. Only set zero state when chart_counts is missing.
                    try {
                        if (!data || !data.chart_counts) {
                            updateProjectChartFromData([], null);
                        }
                    } catch (_) {
                        updateProjectChartFromData([], null);
                    }
                }

                $(".loader").fadeOut("fast");
            },
            error: function () {
                console.error("Failed to load project card data.");
            },
        });
    }

    // Load departments dynamically
    function loadDepartments(callback, targetSelect = departmentSelect) {
        $.ajax({
            url: appUrl + "/departments-for-projects",
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
                showFloatingAlert(
                    "Failed to load departments.",
                    "warning",
                    3500
                );
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
            url: appUrl + "/divisions-for-projects",
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
                showFloatingAlert("Failed to load divisions.", "warning", 3500);
                if (typeof callback === "function") callback();
            },
        });
    }

    function loadCardProjects(page = 1) {
        $.ajax({
            url: appUrl + "/project/get-all-projects",
            type: "GET",
            dataType: "json",
            data: (function () {
                const params = { task_scope: "me", page: page };
                try {
                    const q =
                        typeof window.currentSearch === "string"
                            ? window.currentSearch
                            : currentSearch;
                    if (typeof q === "string" && q.trim() !== "") {
                        params.search = q.trim();
                    }

                    const pid =
                        typeof window.currentProjectId !== "undefined"
                            ? window.currentProjectId
                            : currentProjectId;
                    if (pid) {
                        params.project_id = pid;
                    }
                    const dt =
                        typeof window.currentFilterDate === "string"
                            ? window.currentFilterDate
                            : currentFilterDate;
                    if (typeof dt === "string" && dt.trim() !== "") {
                        params.date = dt.trim();
                    }
                } catch (_) {}
                return params;
            })(),
            success: function (data) {
                // Render with the same page and current search
                const q =
                    typeof window.currentSearch === "string"
                        ? window.currentSearch
                        : currentSearch;
                loadProjectCardData(null, page, typeof q === "string" ? q : "");

                if (data && data.pagination) {
                    updatePagination(data.pagination);
                }
            },
            error: function () {
                console.error("Failed to load project cards");
            },
        });
    }

    // Expose to global so other blocks (e.g., late DOMContentLoaded handlers) can invoke it
    try {
        window.loadProjectCardData = loadProjectCardData;
        window.loadCardProjects = loadCardProjects;
        window.currentSearch = currentSearch;
        window.currentProjectId = currentProjectId;
        window.currentFilterDate = currentFilterDate;
    } catch (_) {}

    function updatePagination(pagination) {
        if (!pagination) return;

        const paginationContainer = document.querySelector(".pagination");
        if (!paginationContainer) return;

        const currentPage = parseInt(pagination.current_page, 10);
        const perPage = parseInt(pagination.per_page, 10);
        const total = parseInt(pagination.total, 10);
        const lastPage = parseInt(pagination.last_page, 10);

        if (total <= perPage || lastPage <= 1) {
            paginationContainer.innerHTML = "";
            return;
        }

        paginationContainer.innerHTML = "";

        const prevLi = document.createElement("li");
        prevLi.className = "page-item" + (currentPage === 1 ? " disabled" : "");
        const prevBtn = document.createElement("button");
        prevBtn.className = "page-link";1
        prevBtn.textContent = "Previous";
        prevBtn.addEventListener("click", function (e) {
            e.preventDefault();
            if (currentPage === 1) return;
            loadCardProjects(currentPage - 1);
        });
        prevLi.appendChild(prevBtn);
        paginationContainer.appendChild(prevLi);

        for (let i = 1; i <= lastPage; i++) {
            const li = document.createElement("li");
            li.className = "page-item" + (i === currentPage ? " active" : "");
            const btn = document.createElement("button");
            btn.className = "page-link";
            btn.textContent = i;
            btn.addEventListener("click", function (e) {
                e.preventDefault();
                loadCardProjects(i);
            });
            li.appendChild(btn);
            paginationContainer.appendChild(li);
        }

        const nextLi = document.createElement("li");
        nextLi.className = "page-item" + (currentPage === lastPage ? " disabled" : "");
        const nextBtn = document.createElement("button");
        nextBtn.className = "page-link";
        nextBtn.textContent = "Next";
        nextBtn.addEventListener("click", function (e) {
            e.preventDefault();
            if (currentPage === lastPage) return;
            loadCardProjects(currentPage + 1);
        });
        nextLi.appendChild(nextBtn);
        paginationContainer.appendChild(nextLi);

        const infoEl = document.getElementById("paginationInfo");
        if (infoEl) {
            infoEl.textContent = `${currentPage} OF ${lastPage}`;
        }
    }

    function updateProjectChartFromData(projects, chartCounts) {}

    // ===== Unread badge and latest feedback snippet for Project (parity with Task) =====
    // Helpers to show/hide unread badge

    function hideProjectUnreadBadge(projectId) {
        try {
            const badge = document.querySelector(
                `.unread-badge[data-project-id="${projectId}"]`
            );
            if (!badge) return;
            badge.classList.add("d-none");
        } catch (_) {}
    }

    // Latest feedback snippet helpers
    function hideProjectLatestFeedbackSnippet(projectId) {
        try {
            const els = document.querySelectorAll(
                `.latest-feedback-snippet[data-project-id="${projectId}"]`
            );
            els.forEach((el) => {
                el.classList.add("d-none");
                el.style.display = "none";
                const textEl = el.querySelector(".latest-feedback-text");
                if (textEl) textEl.textContent = "";
                const avatar = el.querySelector(".latest-feedback-avatar");
                if (avatar) avatar.src = appUrl + "/asset/img/avatar.png";
            });
        } catch (_) {}

        // sembunyikan unread badge juga
        try {
            const badge = document.querySelector(
                `.unread-badge[data-project-id="${projectId}"]`
            );
            if (badge) {
                badge.classList.add("d-none");
            }
        } catch (_) {}
    }

    window.latestProjectSnippetSeq = window.latestProjectSnippetSeq || {};
    let lastRefresh = 0;
    let feedbackCache = {};

    function fetchLatestFeedbackForProject(projectIds) {
        if (!projectIds?.length) return Promise.resolve();

        const now = Date.now();
        const fresh = [];
        const needFetch = [];

        projectIds.forEach(pid => {
            const cached = feedbackCache[pid];
            if (cached && (now - cached.time < 60000)) {
                setProjectLatestFeedbackSnippet(pid, cached.data);
                fresh.push(cached.data);
            } else {
                needFetch.push(pid);
            }
        });

        if (!needFetch.length) return Promise.resolve(fresh);

        const query = needFetch.join(",");

        return $.ajax({
            url: appUrl + "/project-feedbacks/latest?ids=" + query,
            type: "GET",
            dataType: "json",
        })
        .then(res => {
            const map = res?.data || {};
            Object.entries(map).forEach(([pid, data]) => {
                feedbackCache[pid] = { time: now, data };
                setProjectLatestFeedbackSnippet(pid, data);
            });
            return map;
        })
        .catch(() => {
            needFetch.forEach(pid => {
                feedbackCache[pid] = { time: now, data: null };
                setProjectLatestFeedbackSnippet(pid, null);
            });
        });
    }


    function refreshAllProjectLatestFeedbackSnippets() {
        const now = Date.now();
        if (now - lastRefresh < 5000) return;
        lastRefresh = now;

        const projectIds = [
            ...new Set(
                [...document.querySelectorAll("[data-project-id]")]
                    .map(el => el.getAttribute("data-project-id"))
                    .filter(Boolean)
            ),
        ];

        fetchLatestFeedbackForProject(projectIds);
    }

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
        let isDropdownOpen = false;

        // Fetch employees from API with optional search query
        function fetchEmployees(query = "") {
            // Get current logged-in employee ID from modal data attribute
            const currentEmployeeId =
                document
                    .getElementById("projectFeedbackModal")
                    ?.getAttribute("data-employee-id") || "";

            $.ajax({
                url: appUrl + "/employees-for-projects",
                type: "GET",
                data: { query: query, exclude_employee_id: currentEmployeeId },
                dataType: "json",
                timeout: 10000, // 10 second timeout
                success: function (data) {
                    employees = (data.data || []).map(function (e) {
                        // Normalize unified avatar fields
                        const candidate =
                            e.profile_picture_url ||
                            e.profile_picture ||
                            e.user_photo;
                        e.user_photo = candidate; // maintain backwards key
                        return e;
                    });
                    filteredEmployees = employees;
                    renderDropdown();
                },
                error: function (xhr, status, error) {
                    handleEmployeeLoadError(
                        xhr,
                        status,
                        error,
                        "Add Project Co-Authors"
                    );

                    // Provide fallback with empty list
                    employees = [];
                    filteredEmployees = [];
                    renderDropdown();
                },
            });
        }
        // Expose refresh function
        window.__refreshAddProjectEmployees = function () {
            fetchEmployees(
                document.getElementById("co_author_input")?.value || ""
            );
        };

        // Render dropdown list with checkboxes
        function renderDropdown() {
            if (filteredEmployees.length === 0) {
                dropdown.innerHTML =
                    '<div class="dropdown-item disabled">No employees found</div>';
                dropdown.style.display = isDropdownOpen ? "block" : "none";
                return;
            }

            const html = filteredEmployees
                .map((emp) => {
                    const isChecked = selectedEmployees.some(
                        (e) => e.id === emp.id
                    );
                    const candidate =
                        emp.profile_picture_url ||
                        emp.profile_picture ||
                        emp.user_photo;
                    const photoUrl = (function (raw) {
                        if (!raw) return appUrl + "/asset/img/avatar.png";
                        try {
                            raw = String(raw).trim();
                            const trimmed = raw.replace(/^\/+/, "");
                            if (/^https?:\/\//i.test(raw)) return raw;
                            if (/^(file\/|asset\/|storage\/)/.test(trimmed))
                                return appUrl + "/" + trimmed;
                            if (raw.startsWith("/")) return appUrl + raw;
                            if (raw.indexOf("/") !== -1)
                                return appUrl + "/" + trimmed;
                            return appUrl + "/file/profile_picture/" + raw;
                        } catch (_) {
                            return appUrl + "/asset/img/avatar.png";
                        }
                    })(candidate);

                    return `
            <label class="dropdown-item d-flex align-items-center justify-content-between" style="cursor: pointer;">
                <div class="d-flex align-items-center">
                    <img src="${appendAvatarVersion(photoUrl)}" alt="${
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
            dropdown.style.display = isDropdownOpen ? "block" : "none";

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
                                const candidate = employeeObj
                                    ? employeeObj.profile_picture_url ||
                                      employeeObj.profile_picture ||
                                      employeeObj.user_photo
                                    : null;
                                selectedEmployees.push({
                                    id,
                                    name,
                                    user_photo: candidate,
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
                const candidate =
                    emp.profile_picture_url ||
                    emp.profile_picture ||
                    emp.user_photo;
                const photoUrl = (function (raw) {
                    if (!raw) return appUrl + "/asset/img/avatar.png";
                    try {
                        raw = String(raw).trim();
                        const trimmed = raw.replace(/^\/+/, "");
                        if (/^https?:\/\//i.test(raw)) return raw;
                        if (/^(file\/|asset\/|storage\/)/.test(trimmed))
                            return appUrl + "/" + trimmed;
                        if (raw.startsWith("/")) return appUrl + raw;
                        if (raw.indexOf("/") !== -1)
                            return appUrl + "/" + trimmed;
                        return appUrl + "/file/profile_picture/" + raw;
                    } catch (_) {
                        return appUrl + "/asset/img/avatar.png";
                    }
                })(candidate);

                const badge = document.createElement("span");
                badge.className =
                    "badge bg-primary d-inline-flex align-items-center me-2 mb-2";

                const img = document.createElement("img");
                img.src = appendAvatarVersion(photoUrl);
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
            isDropdownOpen = true;
            filterEmployees(this.value);
        });

        input.addEventListener("focus", function () {
            isDropdownOpen = true;
            filterEmployees(this.value);
        });

        // Hide dropdown when clicking outside
        document.addEventListener("click", function (e) {
            if (!input.contains(e.target) && !dropdown.contains(e.target)) {
                isDropdownOpen = false;
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
        let isDropdownOpen = false;

        // Fetch employees from API with optional search query
        function fetchEmployees(query = "") {
            // Get current logged-in employee ID from modal data attribute
            const currentEmployeeId =
                document
                    .getElementById("projectFeedbackModal")
                    ?.getAttribute("data-employee-id") || "";

            $.ajax({
                url: appUrl + "/employees-for-projects",
                type: "GET",
                data: { query: query, exclude_employee_id: currentEmployeeId },
                dataType: "json",
                timeout: 10000, // 10 second timeout
                success: function (data) {
                    // Exclude employees already selected as co-authors
                    const coAuthorIds = window.selectedCoAuthorIds || [];
                    employees = (data.data || [])
                        .filter((emp) => !coAuthorIds.includes(emp.id))
                        .map(function (e) {
                            const candidate =
                                e.profile_picture_url ||
                                e.profile_picture ||
                                e.user_photo;
                            e.user_photo = candidate;
                            return e;
                        });
                    filteredEmployees = employees;
                    renderDropdown();
                },
                error: function (xhr, status, error) {
                    handleEmployeeLoadError(
                        xhr,
                        status,
                        error,
                        "Add Project Contributors"
                    );

                    // Provide fallback with empty list
                    employees = [];
                    filteredEmployees = [];
                    renderDropdown();
                },
            });
        }
        window.__refreshAddProjectEmployees = (function (orig) {
            // Chain existing refresh if already defined
            return function () {
                if (typeof orig === "function") orig();
                fetchEmployees(
                    document.getElementById("contributor_input")?.value || ""
                );
            };
        })(window.__refreshAddProjectEmployees);

        // Render dropdown list with checkboxes
        function renderDropdown() {
            if (filteredEmployees.length === 0) {
                dropdown.innerHTML =
                    '<div class="dropdown-item disabled">No employees found</div>';
                dropdown.style.display = isDropdownOpen ? "block" : "none";
                return;
            }

            const html = filteredEmployees
                .map((emp) => {
                    const isChecked = selectedEmployees.some(
                        (e) => e.id === emp.id
                    );
                    const candidate =
                        emp.profile_picture_url ||
                        emp.profile_picture ||
                        emp.user_photo;
                    const photoUrl = (function (raw) {
                        if (!raw) return appUrl + "/asset/img/avatar.png";
                        try {
                            raw = String(raw).trim();
                            const trimmed = raw.replace(/^\/+/, "");
                            if (/^https?:\/\//i.test(raw)) return raw;
                            if (/^(file\/|asset\/|storage\/)/.test(trimmed))
                                return appUrl + "/" + trimmed;
                            if (raw.startsWith("/")) return appUrl + raw;
                            if (raw.indexOf("/") !== -1)
                                return appUrl + "/" + trimmed;
                            return appUrl + "/file/profile_picture/" + raw;
                        } catch (_) {
                            return appUrl + "/asset/img/avatar.png";
                        }
                    })(candidate);

                    return `
            <label class="dropdown-item d-flex align-items-center justify-content-between" style="cursor: pointer;">
                <div class="d-flex align-items-center">
                    <img src="${appendAvatarVersion(photoUrl)}" alt="${
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
            dropdown.style.display = isDropdownOpen ? "block" : "none";

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
                                const candidate = employeeObj
                                    ? employeeObj.profile_picture_url ||
                                      employeeObj.profile_picture ||
                                      employeeObj.user_photo
                                    : null;
                                selectedEmployees.push({
                                    id,
                                    name,
                                    user_photo: candidate,
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
                const candidate =
                    emp.profile_picture_url ||
                    emp.profile_picture ||
                    emp.user_photo;
                const photoUrl = (function (raw) {
                    if (!raw) return appUrl + "/asset/img/avatar.png";
                    try {
                        raw = String(raw).trim();
                        const trimmed = raw.replace(/^\/+/, "");
                        if (/^https?:\/\//i.test(raw)) return raw;
                        if (/^(file\/|asset\/|storage\/)/.test(trimmed))
                            return appUrl + "/" + trimmed;
                        if (raw.startsWith("/")) return appUrl + raw;
                        if (raw.indexOf("/") !== -1)
                            return appUrl + "/" + trimmed;
                        return appUrl + "/file/profile_picture/" + raw;
                    } catch (_) {
                        return appUrl + "/asset/img/avatar.png";
                    }
                })(candidate);

                const badge = document.createElement("span");
                badge.className =
                    "badge bg-primary d-inline-flex align-items-center me-2 mb-2";

                const img = document.createElement("img");
                img.src = appendAvatarVersion(photoUrl);
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
            isDropdownOpen = true;
            filterEmployees(this.value);
        });

        input.addEventListener("focus", function () {
            isDropdownOpen = true;
            filterEmployees(this.value);
        });

        // Hide dropdown when clicking outside
        document.addEventListener("click", function (e) {
            if (!input.contains(e.target) && !dropdown.contains(e.target)) {
                isDropdownOpen = false;
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

    // Unified alert: use Settings-style white alert (from office.js)
    function showFloatingAlert(message, type = "success", delayMs = 2500) {
        try {
            if (typeof window.showAlertMsg === "function") {
                window.showAlertMsg(message, "light", delayMs);
                return;
            }
            const box = document.querySelector(
                ".box-alert-messages .box-message"
            );
            if (box && box.parentElement) {
                box.parentElement.style.display = "block";
                box.classList.remove("success", "warning", "error", "light");
                box.classList.add("light");
                box.innerHTML = message;
                setTimeout(() => {
                    if (typeof window.hideAlertMsg === "function") {
                        window.hideAlertMsg();
                    } else {
                        box.parentElement.style.display = "none";
                    }
                }, delayMs);
                return;
            }
        } catch (e) {
            /* no-op */
        }
        try {
            alert(
                typeof message === "string"
                    ? message.replace(/<[^>]+>/g, "")
                    : String(message)
            );
        } catch (e) {}
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
        // Map first non-empty reference_urls[] to single reference_url for backend compatibility
        try {
            const urlInputs = addProjectForm.querySelectorAll(
                'input[name="reference_urls[]"]'
            );
            const urls = Array.from(urlInputs)
                .map((i) => (i.value || "").trim())
                .filter(Boolean);
            if (urls.length) formData.set("reference_url", urls[0]);
        } catch (_) {}

        // Append project selected reference files (if any)
        if (projectSelectedFiles && projectSelectedFiles.length) {
            projectSelectedFiles.forEach(function (f) {
                formData.append("reference_file[]", f);
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
                    "success",
                    1500
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
            error: function (xhr, status, error) {
                console.error("Error creating project:", {
                    status: xhr.status,
                    statusText: xhr.statusText,
                    responseText: xhr.responseText,
                    error: error,
                });

                if (xhr.status === 422) {
                    let errors = xhr.responseJSON?.errors || {};
                    var listHtml = '<ul style="margin:0; padding-left:18px;">';
                    $.each(errors, function (key, value) {
                        if (Array.isArray(value)) {
                            value.forEach(function (msg) {
                                listHtml += "<li>" + msg + "</li>";
                            });
                        } else {
                            listHtml += "<li>" + value + "</li>";
                        }
                    });
                    listHtml += "</ul>";
                    showFloatingAlert(listHtml, "warning", 5000);
                } else if (xhr.status === 500) {
                    let errorMsg = "Server error occurred.";
                    if (xhr.responseJSON?.message) {
                        errorMsg += " " + xhr.responseJSON.message;
                    }
                    showFloatingAlert(errorMsg, "warning", 5000);
                } else {
                    showFloatingAlert(
                        "Failed to create project. Status: " + xhr.status,
                        "warning",
                        3500
                    );
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
    loadProjectCardData();
    loadTimelineProjects();
    loadDepartments();
    // Populate "Part of Project" selects for Add and Edit modals
    try {
        populatePartOfProjectSelects();
    } catch (_) {}

    // Setup filter dropdown functionality
    setupFilterDropdown();
    setupGlobalFilterClickHandler();

    // Setup project detail modal hidden event handler to re-initialize filter dropdown
    const projectDetailModalEl = document.getElementById("projectDetailModal");
    if (
        projectDetailModalEl &&
        !projectDetailModalEl.getAttribute("data-main-handler-attached")
    ) {
        const onModalHidden = function () {
            try {
                // Handle timeline reopening logic first
                if (projectDetailModalEl.getAttribute("data-child-opened")) {
                    // Skip timeline reopening if a child modal is opening
                    projectDetailModalEl.removeAttribute("data-child-opened");
                    return;
                }

                if (
                    projectDetailModalEl.getAttribute(
                        "data-reopen-timeline"
                    ) === "1"
                ) {
                    projectDetailModalEl.removeAttribute(
                        "data-reopen-timeline"
                    );

                    // Add a small delay to ensure the current modal is fully closed before opening timeline
                    setTimeout(() => {
                        const timelineModalEl =
                            document.getElementById("timelineModal");
                        if (timelineModalEl) {
                            try {
                                const tlInstance =
                                    bootstrap.Modal.getInstance(
                                        timelineModalEl
                                    ) || new bootstrap.Modal(timelineModalEl);
                                tlInstance.show();
                            } catch (e) {
                                console.warn(
                                    "Error reopening timeline modal:",
                                    e
                                );
                            }
                        }
                    }, 200);
                    return; // Don't continue with filter dropdown setup immediately
                }

                // Re-initialize filter dropdown to ensure it works after modal closes
                setTimeout(() => {
                    try {
                        setupFilterDropdown();
                        setupGlobalFilterClickHandler();
                    } catch (e) {
                        console.warn(
                            "Failed to re-initialize filter dropdown after project detail modal close:",
                            e
                        );
                    }
                }, 100);
            } catch (e) {
                console.warn(
                    "Error in project detail modal hidden handler:",
                    e
                );
            }
        };

        projectDetailModalEl.addEventListener("hidden.bs.modal", onModalHidden);
        projectDetailModalEl.setAttribute("data-main-handler-attached", "1");
    }

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
        let isDropdownOpen = false;

        function fetchEmployees(query = "") {
            const currentEmployeeId =
                document
                    .getElementById("projectFeedbackModal")
                    ?.getAttribute("data-employee-id") || "";

            $.ajax({
                url: appUrl + "/employees-for-projects",
                type: "GET",
                data: { query: query, exclude_employee_id: currentEmployeeId },
                dataType: "json",
                timeout: 10000, // 10 second timeout
                success: function (data) {
                    // Exclude employees already selected as contributors
                    const contributorIds = window.selectedContributorIds || [];
                    employees = (data.data || []).filter(
                        (emp) => !contributorIds.includes(emp.id)
                    );
                    filteredEmployees = employees;
                    renderDropdown();
                },
                error: function (xhr, status, error) {
                    handleEmployeeLoadError(
                        xhr,
                        status,
                        error,
                        "Project Co-Authors (Modal)"
                    );

                    // Provide fallback with empty list
                    employees = [];
                    filteredEmployees = [];
                    renderDropdown();
                },
            });
        }

        function renderDropdown() {
            if (filteredEmployees.length === 0) {
                dropdown.innerHTML =
                    '<div class="dropdown-item disabled">No employees found</div>';
                dropdown.style.display = isDropdownOpen ? "block" : "none";
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
                        photoUrl = appUrl + "/asset/img/avatar.png";
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
            dropdown.style.display = isDropdownOpen ? "block" : "none";

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
                    emp.user_photo || appUrl + "/asset/img/avatar.png";
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
            isDropdownOpen = true;
            filterEmployees(this.value);
        });

        input.addEventListener("focus", function () {
            isDropdownOpen = true;
            filterEmployees(this.value);
        });

        document.addEventListener("click", function (e) {
            if (!input.contains(e.target) && !dropdown.contains(e.target)) {
                isDropdownOpen = false;
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

        // Expose helpers to sync with contributor list without clearing all
        window.getSelectedCoAuthorIds = function () {
            return selectedEmployees.map((e) => e.id);
        };
        window.removeCoAuthorsByIds = function (ids) {
            if (!Array.isArray(ids) || ids.length === 0) return;
            const before = selectedEmployees.length;
            selectedEmployees = selectedEmployees.filter(
                (e) => !ids.includes(e.id)
            );
            if (selectedEmployees.length !== before) {
                renderSelected();
                updateHiddenInput();
                window.selectedCoAuthorIds = selectedEmployees.map((e) => e.id);
            }
            renderDropdown();
        };
        window.refreshCoAuthorListOnly = function () {
            // Re-fetch to apply new exclusion (selectedContributorIds)
            fetchEmployees();
        };
    }

    wrappedSetupCoAuthorInput();

    // Initialize contributor input
    // setupContributorInput(); // replaced by wrappedSetupContributorInput to support cross-exclusion and syncing

    // Attach click handler for attach_file buttons on project cards
    document.querySelectorAll(".project-attach-file").forEach((btn) => {
        btn.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            const projectId = this.getAttribute("data-project-id");
            if (!projectId) return;
            showProjectFiles(projectId);
        });
    });

    // Also add delegated handler as fallback (catches dynamically added/changed elements)
    document.addEventListener("click", function (e) {
        const btn =
            e.target.closest && e.target.closest(".project-attach-file");
        if (!btn) return;
        e.preventDefault();
        e.stopPropagation();
        const projectId =
            btn.getAttribute("data-project-id") || btn.dataset.projectId;
        console.debug("project-attach-file clicked (delegated)", projectId);
        if (projectId)
            window.showProjectFiles && window.showProjectFiles(projectId);
    });

    // Expose global showProjectFiles so delegated handlers (or other scripts) can call it
    window.showProjectFiles = function (projectId) {
        const modalEl = document.getElementById("projectFilesModal");
        const listEl = document.getElementById("projectReferenceFilesList");
        if (!modalEl || !listEl) return;

        // loading state
        listEl.innerHTML = `<div class="text-center py-4"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>`;

        fetch(appUrl + "/project/" + projectId)
            .then((r) => {
                if (!r.ok) throw new Error("Failed to fetch project");
                return r.json();
            })
            .then((resp) => {
                const data = resp.data || resp;
                const files = Array.isArray(data.reference_files)
                    ? data.reference_files
                    : Array.isArray(data.reference_file)
                    ? data.reference_file
                    : data.reference_file
                    ? [data.reference_file]
                    : [];

                listEl.innerHTML = "";

                if (files && files.length > 0) {
                    files.forEach((fileName) => {
                        const link = document.createElement("a");
                        link.href = appUrl + "/file/project/" + fileName;
                        link.target = "_blank";
                        link.className = "d-block text-decoration-none mb-1";
                        link.innerHTML = `<span class="material-symbols-outlined me-1" style="font-size: 16px; vertical-align: middle;">description</span> ${fileName}`;
                        listEl.appendChild(link);
                    });
                } else {
                    listEl.textContent = "No reference files available.";
                }

                const modal = new bootstrap.Modal(modalEl);
                modal.show();
            })
            .catch((err) => {
                showFloatingAlert(
                    "Failed to load reference files.",
                    "warning",
                    3000
                );
                console.error("showProjectFiles error", err);
                // Still show modal but without content
                const modal = new bootstrap.Modal(modalEl);
                modal.show();
            });
    };

    window.__projectCache = window.__projectCache || {};
    window.__feedbackCache = window.__feedbackCache || {};
    window.__projectFetchPromises = window.__projectFetchPromises || {};
    window.__feedbackFetchPromises = window.__feedbackFetchPromises || {};

    let projectBatchQueue = [];
    let projectBatchTimer = null;

    function getProject(pid, force = false) {
        if (!force && window.__projectCache[pid]) return Promise.resolve(window.__projectCache[pid]);
        if (window.__projectFetchPromises[pid]) return window.__projectFetchPromises[pid];

        const p = new Promise((resolve, reject) => {
            projectBatchQueue.push({ pid, resolve, reject });

            if (!projectBatchTimer) {
                projectBatchTimer = setTimeout(() => {
                    const batch = [...projectBatchQueue];
                    projectBatchQueue = [];
                    projectBatchTimer = null;

                    const ids = batch.map(b => b.pid);

                    fetch(`${appUrl}/projects?ids=${ids.join(",")}`)
                        .then(r => r.ok ? r.json() : Promise.reject(r))
                        .then(resp => {
                            const dataArr = Array.isArray(resp.data) ? resp.data : [];
                            // update cache
                            dataArr.forEach(d => {
                                window.__projectCache[d.id] = d;
                            });
                            // resolve tiap promise sesuai urutan request
                            batch.forEach(b => {
                                b.resolve(window.__projectCache[b.pid] || null);
                            });
                        })
                        .catch(err => {
                            // reject semua kalau ada error fetch
                            batch.forEach(b => b.reject(err));
                        })
                        .finally(() => {
                            ids.forEach(id => delete window.__projectFetchPromises[id]);
                        });
                }, 50);
            }
        });

        window.__projectFetchPromises[pid] = p;
        return p;
    }

    let feedbackBatchQueue = [];
    let feedbackBatchTimer = null;

    function getFeedback(pid, force = false) {
        if (!force && window.__feedbackCache[pid]) {
            return Promise.resolve(window.__feedbackCache[pid]);
        }
        if (window.__feedbackFetchPromises[pid]) {
            return window.__feedbackFetchPromises[pid];
        }

        const p = new Promise((resolve, reject) => {
            feedbackBatchQueue.push({ pid, resolve, reject });

            if (!feedbackBatchTimer) {
                feedbackBatchTimer = setTimeout(() => {
                    const batch = [...feedbackBatchQueue];
                    feedbackBatchQueue = [];
                    feedbackBatchTimer = null;

                    const ids = batch.map(i => i.pid);

                    fetch(`${appUrl}/project-feedbacks?ids=${ids.join(",")}`)
                        .then(r => (r.ok ? r.json() : Promise.reject(r)))
                        .then(resp => {
                            const grouped = resp.data || {};
                            batch.forEach(b => {
                                const arr = grouped[b.pid] || [];
                                window.__feedbackCache[b.pid] = arr;
                                b.resolve(arr);
                            });
                        })
                        .catch(err => {
                            batch.forEach(b => b.reject(err));
                        })
                        .finally(() => {
                            ids.forEach(id => delete window.__feedbackFetchPromises[id]);
                        });
                }, 50);
            }
        });

        window.__feedbackFetchPromises[pid] = p;
        return p;
    }


    (function populateCounts(retry = 0) {
        const MAX_RETRIES = 12;
        const RETRY_DELAY = 250;
        const containerEl = document.getElementById("all-cards-container");
        if (!containerEl) {
            if (retry < MAX_RETRIES)
                return setTimeout(() => populateCounts(retry + 1), RETRY_DELAY);
            return;
        }
        const cards = containerEl.querySelectorAll("[data-project-id]");
        if (!cards || cards.length === 0) {
            if (retry < MAX_RETRIES)
                return setTimeout(() => populateCounts(retry + 1), RETRY_DELAY);
            return;
        }
        cards.forEach((card) => {
            const pid = card.getAttribute("data-project-id");
            const fbBadge = card.querySelector(".project-feedback-count");
            const fileBadge = card.querySelector(".project-file-count");
            if (window.__feedbackCache && window.__feedbackCache[pid]) {
                const count =
                    (window.__feedbackCache[pid] &&
                        window.__feedbackCache[pid].length) ||
                    0;
                if (fbBadge) {
                    fbBadge.textContent = count > 0 ? count : "";
                    fbBadge.style.display = count > 0 ? "" : "none";
                }
            } else {
                getFeedback(pid)
                    .then((arr) => {
                        const count = (arr && arr.length) || 0;
                        if (fbBadge) {
                            fbBadge.textContent = count > 0 ? count : "";
                            fbBadge.style.display = count > 0 ? "" : "none";
                        }
                    })
                    .catch(() => {
                        if (fbBadge) {
                            fbBadge.textContent = "";
                            fbBadge.style.display = "none";
                        }
                    });
            }
            if (window.__projectCache && window.__projectCache[pid]) {
                const data = window.__projectCache[pid];
                let files = [];
                if (Array.isArray(data.reference_files))
                    files = data.reference_files;
                else if (Array.isArray(data.reference_file))
                    files = data.reference_file;
                else if (
                    typeof data.reference_file === "string" &&
                    data.reference_file.trim() !== ""
                )
                    files = [data.reference_file];
                const count = files.length || 0;
                if (fileBadge) {
                    fileBadge.textContent = count > 0 ? count : "";
                    fileBadge.style.display = count > 0 ? "" : "none";
                }
            } else {
                getProject(pid)
                    .then((data) => {
                        let files = [];
                        if (Array.isArray(data.reference_files))
                            files = data.reference_files;
                        else if (Array.isArray(data.reference_file))
                            files = data.reference_file;
                        else if (
                            typeof data.reference_file === "string" &&
                            data.reference_file.trim() !== ""
                        )
                            files = [data.reference_file];
                        const count = files.length || 0;
                        if (fileBadge) {
                            fileBadge.textContent = count > 0 ? count : "";
                            fileBadge.style.display = count > 0 ? "" : "none";
                        }
                    })
                    .catch(() => {
                        if (fileBadge) {
                            fileBadge.textContent = "";
                            fileBadge.style.display = "none";
                        }
                    });
            }
        });
    })(0);

    window.updateProjectBadges = function (pid, attempt = 0) {
        try {
            const containerEl = document.getElementById("all-cards-container");
            if (!containerEl) return;
            const card = containerEl.querySelector(
                '[data-project-id="' + pid + '"]'
            );
            if (!card) {
                if (attempt < 5)
                    return setTimeout(
                        () => window.updateProjectBadges(pid, attempt + 1),
                        50
                    );
                return;
            }
            const fbBadge = card.querySelector(".project-feedback-count");
            const fileBadge = card.querySelector(".project-file-count");
            getFeedback(pid)
                .then((arr) => {
                    const count = (arr && arr.length) || 0;
                    if (fbBadge) {
                        fbBadge.textContent = count > 0 ? count : "";
                        fbBadge.style.display = count > 0 ? "" : "none";
                    }
                })
                .catch(() => {
                    if (fbBadge) {
                        fbBadge.textContent = "";
                        fbBadge.style.display = "none";
                    }
                });
            getProject(pid)
                .then((data) => {
                    let files = [];
                    if (Array.isArray(data.reference_files))
                        files = data.reference_files;
                    else if (Array.isArray(data.reference_file))
                        files = data.reference_file;
                    else if (
                        typeof data.reference_file === "string" &&
                        data.reference_file.trim() !== ""
                    )
                        files = [data.reference_file];
                    const count = files.length || 0;
                    if (fileBadge) {
                        fileBadge.textContent = count > 0 ? count : "";
                        fileBadge.style.display = count > 0 ? "" : "none";
                    }
                })
                .catch(() => {
                    if (fileBadge) {
                        fileBadge.textContent = "";
                        fileBadge.style.display = "none";
                    }
                });
        } catch (e) {}
    };

    function bindCardInteractions(cardEl, pid) {
        try {
            if (!cardEl) return;
            cardEl.querySelectorAll(".dropdown-icon").forEach((icon) => {
                icon.addEventListener("click", function (e) {
                    e.stopPropagation();
                    const dropdownMenu = this.nextElementSibling;
                    const isVisible =
                        dropdownMenu &&
                        !dropdownMenu.classList.contains("d-none");
                    document
                        .querySelectorAll(".dropdown-menu")
                        .forEach((menu) => menu.classList.add("d-none"));
                    if (!isVisible && dropdownMenu)
                        dropdownMenu.classList.remove("d-none");
                });
            });
            cardEl
                .querySelectorAll(".latest-feedback-snippet[data-project-id]")
                .forEach((el) => {
                    el.addEventListener("click", function (ev) {
                        ev.preventDefault();
                        ev.stopPropagation();
                        const pidLocal = this.getAttribute("data-project-id");
                        hideProjectUnreadBadge(pidLocal);
                        hideProjectLatestFeedbackSnippet(pidLocal);
                        markProjectFeedbacksRead(pidLocal).always(() => {
                            const projectFeedbackModalEl =
                                document.getElementById("projectFeedbackModal");
                            if (!projectFeedbackModalEl) return;
                            projectFeedbackModalEl.setAttribute(
                                "data-project-id",
                                pidLocal
                            );
                            loadFeedbackData(pidLocal);
                            const m = new bootstrap.Modal(
                                projectFeedbackModalEl
                            );
                            m.show();
                        });
                    });
                });
            const tooltipTriggerList = cardEl.querySelectorAll(
                '[data-bs-toggle="tooltip"]'
            );
            tooltipTriggerList.forEach(function (el) {
                try {
                    new bootstrap.Tooltip(el, { placement: "bottom" });
                } catch (e) {}
            });
        } catch (e) {}
    }

    window.refreshSingleProjectCard = function (pid, attempt = 0) {
        try {
            const containerEl = document.getElementById("all-cards-container");
            if (!containerEl) return;
            const col = containerEl.querySelector(
                '[data-project-id="' + pid + '"]'
            );
            if (!col) {
                if (attempt < 10)
                    return setTimeout(
                        () => window.refreshSingleProjectCard(pid, attempt + 1),
                        200
                    );
                return;
            }
            const currentFb =
                col.querySelector(".project-feedback-count")?.textContent || "";
            const currentFiles =
                col.querySelector(".project-file-count")?.textContent || "";
            getProject(pid, true)
                .then((p) => {
                    window.__projectCache[pid] = p;
                    const imageUrl = p.image
                        ? appUrl + "/file/project/" + p.image
                        : appUrl + "/asset/img/background/add-image.png";
                    const newHeader = `
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div class="d-flex align-items-center">
                        ${
                            p.image
                                ? `<img src="${imageUrl}" data-role="project-avatar" class="rounded-circle me-2" style="width:34px;height:34px;object-fit:cover;">`
                                : (function () {
                                      const init = getInitials(p.title || "");
                                      const color = getInitialsColor(
                                          p.title || ""
                                      );
                                      return `<div class="rounded-circle me-2 d-flex align-items-center justify-content-center" style="width:34px;height:34px;background:${color};color:#fff;font-size:14px;font-weight:600;">${init}</div>`;
                                  })()
                        }
                        <h6 class="mb-0 title-project" style="font-size:14px; font-weight:600;">${
                            p.title || ""
                        }</h6>
                    </div>
                    <div class="dropdown-icon-container">
                        <button class="btn btn-sm border-0 d-flex align-items-center justify-content-center dropdown-icon" style="background:#E8E9F2; border-radius:50%; width:32px; height:32px;">
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
                    const newDesc = (function () {
                        const d = (p.description || "").trim();
                        if (!d) return "";
                        return `<p class="mb-2 small text-muted" style="font-size:12px; line-height:1.4;">${d}</p>`;
                    })();
                    let files = [];
                    if (Array.isArray(p.reference_files))
                        files = p.reference_files;
                    else if (Array.isArray(p.reference_file))
                        files = p.reference_file;
                    else if (
                        typeof p.reference_file === "string" &&
                        p.reference_file.trim() !== ""
                    )
                        files = [p.reference_file];
                    const fileCount = files.length || currentFiles || "";
                    const fbCountPlaceholder = currentFb || "";
                    const newFooter = `
                <div class="d-flex justify-content-between align-items-center mt-2">
                    <div class="collaborators-image d-flex align-items-center">${renderCollaborators(
                        p
                    )}</div>
                    <div class="d-flex align-items-center">
                        <div class="latest-feedback-snippet d-none align-items-center me-1" data-project-id="${
                            p.id
                        }" style="cursor:pointer; max-width: 160px;">
                            <img class="latest-feedback-avatar rounded-circle me-1" src="${appUrl}/asset/img/avatar.png" alt="avatar" width="20" height="20" style="object-fit:cover;">
                            <span class="latest-feedback-text text-truncate" style="max-width: 130px; font-size: 11px; color:#4B4F5E;"></span>
                        </div>
                        <button class="btn btn-sm p-0 border-0 bg-transparent me-2 comment-icon d-flex align-items-center position-relative" title="Comment" data-project-id="${
                            p.id
                        }">
                            <span class="material-symbols-outlined" style="font-size:16px; color:#828282;">mode_comment</span>
                            <span class="project-feedback-count ms-1" data-project-id="${
                                p.id
                            }" style="font-size:12px; color:#454545;">${fbCountPlaceholder}</span>
                            <span class="unread-badge position-absolute top-0 start-75 translate-middle d-none" data-project-id="${
                                p.id
                            }" style="background: red; border-radius: 50%; width: 8px; height: 8px;"></span>
                        </button>
                        <button class="btn btn-sm p-0 border-0 bg-transparent project-attach-file d-flex align-items-center" title="Attach File" data-project-id="${
                            p.id
                        }">
                            <span class="material-symbols-outlined" style="font-size:16px; color:#828282;">attach_file</span>
                            <span class="project-file-count ms-1" data-project-id="${
                                p.id
                            }" style="font-size:12px; color:#454545;">${fileCount}</span>
                        </button>
                    </div>
                </div>`;
                    const cardEl = col.querySelector(".project-card");
                    if (cardEl) {
                        cardEl.innerHTML =
                            newHeader +
                            newDesc +
                            '<hr class="my-2 border-3" style="border-top:1px solid #DEDFE7;">' +
                            newFooter;
                    }
                    if (cardEl) bindCardInteractions(cardEl, pid);
                    if (typeof window.updateProjectBadges === "function")
                        window.updateProjectBadges(pid);
                    try {
                        if (typeof fetchUnreadForProject === "function")
                            fetchUnreadForProject(pid);
                    } catch (_) {}
                    try {
                        if (typeof fetchLatestFeedbackForProject === "function")
                            fetchLatestFeedbackForProject(projectId);
                    } catch (_) {}
                })
                .catch(() => {
                    if (typeof window.updateProjectBadges === "function")
                        window.updateProjectBadges(pid);
                });
        } catch (e) {}
    };

    // Function to refresh contributor dropdown when co-author selection changes
    window.refreshContributorDropdown = function () {
        const coAuthorIds = window.selectedCoAuthorIds || [];
        // Remove overlaps from current contributors without clearing all
        if (typeof window.removeContributorsByIds === "function") {
            window.removeContributorsByIds(coAuthorIds.map((n) => Number(n)));
        }
        // Rebuild contributor dropdown list applying new exclusions
        if (typeof window.refreshContributorListOnly === "function") {
            window.refreshContributorListOnly();
        } else if (typeof setupContributorInput === "function") {
            // Fallback
            setupContributorInput();
        }
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
        let isDropdownOpen = false;

        // Fetch employees from API with optional search query
        function fetchEmployees(query = "") {
            // Get current logged-in employee ID from modal data attribute
            const currentEmployeeId =
                document
                    .getElementById("projectFeedbackModal")
                    ?.getAttribute("data-employee-id") || "";

            $.ajax({
                url: appUrl + "/employees-for-projects",
                type: "GET",
                data: { query: query, exclude_employee_id: currentEmployeeId },
                dataType: "json",
                timeout: 10000, // 10 second timeout
                success: function (data) {
                    // Exclude employees already selected as co-authors
                    const coAuthorIds = window.selectedCoAuthorIds || [];
                    employees = (data.data || []).filter(
                        (emp) => !coAuthorIds.includes(emp.id)
                    );
                    filteredEmployees = employees;
                    renderDropdown();
                },
                error: function (xhr, status, error) {
                    handleEmployeeLoadError(
                        xhr,
                        status,
                        error,
                        "Project Contributors (Modal)"
                    );

                    // Provide fallback with empty list
                    employees = [];
                    filteredEmployees = [];
                    renderDropdown();
                },
            });
        }

        // Render dropdown list with checkboxes
        function renderDropdown() {
            if (filteredEmployees.length === 0) {
                dropdown.innerHTML =
                    '<div class="dropdown-item disabled">No employees found</div>';
                dropdown.style.display = isDropdownOpen ? "block" : "none";
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
                        photoUrl = appUrl + "/asset/img/avatar.png";
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
            dropdown.style.display = isDropdownOpen ? "block" : "none";

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
                    emp.user_photo || appUrl + "/asset/img/avatar.png";

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
            isDropdownOpen = true;
            filterEmployees(this.value);
        });

        input.addEventListener("focus", function () {
            isDropdownOpen = true;
            filterEmployees(this.value);
        });

        // Hide dropdown when clicking outside
        document.addEventListener("click", function (e) {
            if (!input.contains(e.target) && !dropdown.contains(e.target)) {
                isDropdownOpen = false;
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

        // Expose helpers to sync with co-author list without clearing all
        window.getSelectedContributorIds = function () {
            return selectedEmployees.map((e) => e.id);
        };
        window.removeContributorsByIds = function (ids) {
            if (!Array.isArray(ids) || ids.length === 0) return;
            const before = selectedEmployees.length;
            selectedEmployees = selectedEmployees.filter(
                (e) => !ids.includes(e.id)
            );
            if (selectedEmployees.length !== before) {
                renderSelected();
                updateHiddenInput();
                window.selectedContributorIds = selectedEmployees.map(
                    (e) => e.id
                );
            }
            renderDropdown();
        };
        window.refreshContributorListOnly = function () {
            // Re-fetch to apply new exclusion (selectedCoAuthorIds)
            fetchEmployees();
        };
    }

    wrappedSetupContributorInput();

    // Function to refresh co-author dropdown when contributor selection changes
    window.refreshCoAuthorDropdown = function () {
        const contributorIds = window.selectedContributorIds || [];
        // Remove overlaps from current co-authors without clearing all
        if (typeof window.removeCoAuthorsByIds === "function") {
            window.removeCoAuthorsByIds(contributorIds.map((n) => Number(n)));
        }
        // Rebuild co-author dropdown list applying new exclusions
        if (typeof window.refreshCoAuthorListOnly === "function") {
            window.refreshCoAuthorListOnly();
        } else if (typeof wrappedSetupCoAuthorInput === "function") {
            // Fallback
            wrappedSetupCoAuthorInput();
        }
    };

    // Setup filter dropdown functionality with improved event handling
    function setupFilterDropdown() {
        const openFilterBtn = document.getElementById("openProjectFilterBtn");
        const filterDropdown = document.getElementById("projectFilterDropdown");
        const applyFilterBtn = document.getElementById("applyProjectFilterBtn");
        const resetFilterBtn = document.getElementById("resetProjectFilterBtn");
        const filterStatus = document.getElementById("filterProjectStatus");
        const sortBySelect = document.getElementById("filterSortBy");

        if (!openFilterBtn || !filterDropdown) return;

        // Remove dup event listener
        openFilterBtn.replaceWith(openFilterBtn.cloneNode(true));
        const newOpenFilterBtn = document.getElementById("openProjectFilterBtn");

        newOpenFilterBtn.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();

            document.querySelectorAll(".dropdown-menu:not(#projectFilterDropdown)")
                .forEach((menu) => menu.classList.add("d-none"));

            const isVisible =
                filterDropdown.style.display === "block" ||
                !filterDropdown.classList.contains("d-none");

            if (isVisible) {
                filterDropdown.style.display = "none";
                filterDropdown.classList.add("d-none");
            } else {
                filterDropdown.style.display = "block";
                filterDropdown.classList.remove("d-none");
            }
        });

        if (applyFilterBtn) {
            applyFilterBtn.replaceWith(applyFilterBtn.cloneNode(true));
            const newApplyFilterBtn = document.getElementById("applyProjectFilterBtn");
            newApplyFilterBtn.addEventListener("click", function (e) {
                e.preventDefault();
                e.stopPropagation();

                const selectedStatus = filterStatus ? filterStatus.value : "";
                filterDropdown.style.display = "none";
                filterDropdown.classList.add("d-none");

                let filterParam = null;
                let sortBy = "asc";
                if (selectedStatus === "ongoing") {
                    filterParam = "not_started";
                } else if (selectedStatus === "completed") {
                    filterParam = "completed";
                } else if (selectedStatus === "pending") {
                    filterParam = "in_progress";
                }

                if (sortBySelect) {
                    sortBy = sortBySelect.value || "desc";
                }

                const q =
                    typeof window.currentSearch === "string"
                        ? window.currentSearch
                        : "";

                loadProjectCardData(filterParam, 1, q, sortBy);
            });
        }

        if (resetFilterBtn) {
            resetFilterBtn.replaceWith(resetFilterBtn.cloneNode(true));
            const newResetFilterBtn = document.getElementById("resetProjectFilterBtn");
            newResetFilterBtn.addEventListener("click", function (e) {
                e.preventDefault();
                e.stopPropagation();

                if (filterStatus) filterStatus.value = "";

                filterDropdown.style.display = "none";
                filterDropdown.classList.add("d-none");

                const q =
                    typeof window.currentSearch === "string"
                        ? window.currentSearch
                        : "";
                loadProjectCardData(null, 1, q);
            });
        }

        filterDropdown.addEventListener("click", function (e) {
            e.stopPropagation();
        });
    }

    // Global click handler to close filter dropdown when clicking outside
    // Use event delegation to ensure it works even after DOM changes
    function setupGlobalFilterClickHandler() {
        // Remove any existing global click handler for filter
        if (window.filterClickHandler) {
            document.removeEventListener("click", window.filterClickHandler);
        }

        window.filterClickHandler = function (e) {
            const filterDropdown = document.getElementById(
                "projectFilterDropdown"
            );
            const openFilterBtn = document.getElementById(
                "openProjectFilterBtn"
            );

            if (!filterDropdown || !openFilterBtn) return;

            // Check if click is outside both button and dropdown
            if (
                !openFilterBtn.contains(e.target) &&
                !filterDropdown.contains(e.target)
            ) {
                // filterDropdown.style.display = "none";
                filterDropdown.classList.add("d-none");
            }
        };

        document.addEventListener("click", window.filterClickHandler);
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

        // Clear selected reference files and preview
        try {
            if (typeof projectSelectedFiles !== "undefined") {
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
    const ctx = document.getElementById("projectChart");
    let projectChartInstance = null;

    const createDoughnut = (el, data = []) => {
        let chartData, colors, labels;

        if (!data || data.length === 0 || data.every((v) => v === 0)) {
            chartData = [1];
            colors = ["#E8E9F2"];
            labels = ["No Data"];
        } else {
            chartData = data;
            colors = [
                "#E8E9F2", // not started
                "#4fc97a", // complete
                "#5a9be6", // on progress
                "#ff6b6b", // late
            ];
            labels = ["Not Started", "Complete", "On Progress", "Late"];
        }

        return new Chart(el, {
            type: "doughnut",
            data: {
                labels,
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

    if (ctx) {
        projectChartInstance = createDoughnut(ctx, []);
    }

    function updateProjectChartFromData(projects, chartCounts) {
        const numberOfProjects = Array.isArray(projects) ? projects.length : 0;

        const completed = Number(chartCounts?.completed || 0);
        const inProgress = Number(chartCounts?.in_progress || 0);
        const late = Number(chartCounts?.late || 0);
        const notStarted = Number(chartCounts?.not_started || 0);

        const chartData = [notStarted, completed, inProgress, late];
        const total = chartData.reduce((a, b) => a + b, 0);

        if (total === 0) {
            projectChartInstance.data.labels = ["No Data"];
            projectChartInstance.data.datasets[0].data = [1];
            projectChartInstance.data.datasets[0].backgroundColor = ["#E8E9F2"];
        } else {
            projectChartInstance.data.labels = [
                "Not Started",
                "Complete",
                "On Progress",
                "Late",
            ];
            projectChartInstance.data.datasets[0].data = chartData;
            projectChartInstance.data.datasets[0].backgroundColor = [
                "#E8E9F2",
                "#4fc97a",
                "#5a9be6",
                "#ff6b6b",
            ];
        }
        try {
            projectChartInstance.update();
        } catch (_) {}

        const spans = document.querySelectorAll(
            ".chart-labels .text-center span:first-child"
        );
        if (spans && spans.length >= 4) {
            // Order under chart: Total, Complete, On Progress, Late
            spans[0].textContent = numberOfProjects;
            spans[1].textContent = completed;
            spans[2].textContent = inProgress;
            spans[3].textContent = late;
        }
    }

    function loadProjectAndTaskData() {
        // Helper to normalize API payloads into arrays
        function normalizeArray(res) {
            if (!res) return [];
            if (Array.isArray(res)) return res;
            if (res.data && Array.isArray(res.data)) return res.data;
            return [];
        }

        $(".loader").fadeIn("fast");

        const totalReq = $.ajax({
            url: appUrl + "/project/index",
            type: "GET",
            dataType: "json",
        });
        const completedReq = $.ajax({
            url: appUrl + "/project/index",
            type: "GET",
            dataType: "json",
            data: { filter: "completed" },
        });
        const inProgressReq = $.ajax({
            url: appUrl + "/project/index",
            type: "GET",
            dataType: "json",
            data: { filter: "in_progress" },
        });
        const notStartedReq = $.ajax({
            url: appUrl + "/project/index",
            type: "GET",
            dataType: "json",
            data: { filter: "not_started" },
        });
        const tasksReq = $.ajax({
            url: appUrl + "/task/index/no-pagination",
            type: "GET",
            dataType: "json",
        });

        $.when(totalReq, completedReq, inProgressReq, notStartedReq, tasksReq)
            .done(function (totalRes, compRes, progRes, notRes, tRes) {
                try {
                    const projects = normalizeArray(totalRes[0]);
                    const countCompleted = normalizeArray(compRes[0]).length;
                    const countOnProgress = normalizeArray(progRes[0]).length;
                    const countNotStarted = normalizeArray(notRes[0]).length;

                    // Compute LATE using dashboard logic from tasks
                    const buckets = (tRes && tRes[0] && tRes[0].data) || {};
                    const tasksByProject = {};
                    function collect(list, statusName) {
                        if (!Array.isArray(list)) return;
                        list.forEach(function (t) {
                            const pid =
                                t.project_id ||
                                (t.project &&
                                    (t.project.id || t.project.project_id));
                            if (!pid) return;
                            if (!tasksByProject[pid]) tasksByProject[pid] = [];
                            tasksByProject[pid].push(
                                Object.assign({}, t, { __status: statusName })
                            );
                        });
                    }
                    collect(buckets.not_started?.tasks, "not_started");
                    collect(buckets.in_progress?.tasks, "in_progress");
                    collect(buckets.completed?.tasks, "completed");
                    collect(buckets.late?.tasks, "late");
                    collect(buckets.rejected?.tasks, "rejected");
                    collect(buckets.new_request?.tasks, "new_request");

                    function parseDue(dateStr) {
                        if (!dateStr) return null;
                        const s = String(dateStr).trim();
                        const m = s.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
                        if (m)
                            return new Date(
                                +m[1],
                                +m[2] - 1,
                                +m[3],
                                23,
                                59,
                                59,
                                999
                            );
                        const d = new Date(s);
                        return isNaN(d.getTime()) ? null : d;
                    }

                    const now = new Date();
                    let countLate = 0;
                    projects.forEach(function (p) {
                        const pid = p.id || p.project_id;
                        const tasks = tasksByProject[pid] || [];
                        if (!tasks.length) return; // no tasks -> not late
                        const lateTasks = tasks.filter(function (t) {
                            if (t.__status === "late") return true;
                            const dueStr = t.due_date || t.due || t.deadline;
                            const due = parseDue(dueStr);
                            return !!(
                                due &&
                                due.getTime() < now.getTime() &&
                                t.__status !== "completed"
                            );
                        });
                        if (lateTasks.length > 0) countLate++;
                    });

                    const derivedCounts = {
                        total: projects.length,
                        completed: countCompleted,
                        in_progress: countOnProgress,
                        late: countLate,
                        not_started: countNotStarted,
                    };
                    updateProjectChartFromData(projects, derivedCounts);
                } catch (e) {
                    console.warn("Failed to derive project chart counts", e);
                } finally {
                    $(".loader").fadeOut("fast");
                }
            })
            .fail(function () {
                try {
                    // As a fallback, try to at least load total projects to avoid empty chart
                    $.ajax({
                        url: appUrl + "/project/index",
                        type: "GET",
                        dataType: "json",
                    })
                        .done(function (res) {
                            const projects = Array.isArray(res)
                                ? res
                                : Array.isArray(res.data)
                                ? res.data
                                : [];
                            const derivedCounts = {
                                total: projects.length,
                                completed: 0,
                                in_progress: 0,
                                late: 0,
                                not_started: projects.length,
                            };
                            updateProjectChartFromData(projects, derivedCounts);
                        })
                        .always(function () {
                            $(".loader").fadeOut("fast");
                        });
                } catch (_) {
                    $(".loader").fadeOut("fast");
                }
            });
    }
    loadProjectAndTaskData();
});

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let currentWeek = (function () {
    const today = new Date();
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const offset = firstOfMonth.getDay() === 0 ? 6 : firstOfMonth.getDay() - 1;
    return Math.ceil((today.getDate() + offset) / 7) - 1;
})();

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

function loadTimelineProjects(filter = null) {
    $.ajax({
        url: appUrl + "/project/index",
        type: "GET",
        dataType: "json",
        data: { task_scope: "me", filter: filter },
        beforeSend: function () {
            $(".loader").fadeIn("fast");
        },
        success: function (res) {
            console.log(res);

            const projects = Array.isArray(res)
                ? res
                : Array.isArray(res.data)
                ? res.data
                : [];

            const completeProjects = projects.filter(
                (p) => (p.start_date || p.start) && (p.due_date || p.due)
            );
            const incompleteProjects = projects.filter(
                (p) => !(p.start_date || p.start) || !(p.due_date || p.due)
            );

            try {
                buildTimelineFromProjects(completeProjects);
                renderTimeline(
                    "#timelineHeader",
                    "#timelineRows",
                    "week",
                    currentMonth,
                    currentYear,
                    currentWeek
                );
                updateModalTimeline();
            } catch (e) {
                console.error("timeline build/render error", e);
            }

            if (incompleteProjects.length > 0) {
                incompleteProjects.forEach((p) => {
                    $.ajax({
                        url: appUrl + "/project/" + p.id,
                        type: "GET",
                        dataType: "json",
                        success: function (resp) {
                            console.log(resp);

                            const data = resp.data || resp;
                            p.start_date =
                                p.start_date || data.start_date || data.start;
                            p.due_date =
                                p.due_date || data.due_date || data.due;

                            try {
                                const updatedProjects =
                                    completeProjects.concat(incompleteProjects);
                                buildTimelineFromProjects(updatedProjects);
                                renderTimeline(
                                    "#timelineHeader",
                                    "#timelineRows",
                                    "week",
                                    currentMonth,
                                    currentYear,
                                    currentWeek
                                );
                                updateModalTimeline();
                            } catch (e) {
                                console.error("timeline update error", e);
                            }
                        },
                        error: function (err) {
                            console.warn(
                                "failed to fetch project detail for",
                                p.id,
                                err
                            );
                        },
                    });
                });
            }

            $(".loader").fadeOut("fast");
        },
        error: function () {
            console.error("Failed to load timeline projects");
            $(".loader").fadeOut("fast");
        },
    });
}

function buildTimelineFromProjects(projects) {
    timelineData = [];
    if (!Array.isArray(projects)) return;

    projects.forEach((p, idx) => {
        function parseLocal(dateStr, fallback) {
            const src = (dateStr || "").toString().trim();
            if (!src) {
                if (fallback) return parseLocal(fallback);
                return null;
            }
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
        if (start) start.setHours(0, 0, 0, 0);
        if (due) due.setHours(23, 59, 59, 999);

        timelineData.push({
            id: p.id,
            name: p.title || `Project ${p.id || idx + 1}`,
            start_date: start,
            due_date: due,
            color: TIMELINE_COLORS[idx % TIMELINE_COLORS.length],
        });
    });
}

function getWeeksInMonth(year, month) {
const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const used = first.getDay() + last.getDate();
    return Math.ceil(used / 7);
}

function getCalendarWeeks(year, month) {
    const firstOfMonth = new Date(year, month, 1);
    const lastOfMonth = new Date(year, month + 1, 0);

    // Cari Senin pertama sebelum atau sama dengan tanggal 1
    let firstMonday = new Date(firstOfMonth);
    while (firstMonday.getDay() !== 1) {
        firstMonday.setDate(firstMonday.getDate() - 1);
    }

    // Generate minggu per 7 hari
    const weeks = [];
    let start = new Date(firstMonday);
    while (start <= lastOfMonth || start.getMonth() === month) {
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        weeks.push({ start, end });
        start = new Date(start);
        start.setDate(start.getDate() + 7);
    }
    return weeks;
}

function getWeekOfDate(date, weeks) {
    return weeks.findIndex((w) => date >= w.start && date <= w.end);
}

function renderTimeline(
    targetHeaderSelector,
    targetRowsSelector,
    mode = "week",
    month = null,
    year = null,
    weekIndex = null
) {
    const headerRow = document.querySelector(targetHeaderSelector);
    const rowsContainer = document.querySelector(targetRowsSelector);
    if (!headerRow || !rowsContainer) return;

    headerRow.innerHTML = "";
    rowsContainer.innerHTML = "";

    month = month ?? new Date().getMonth();
    year = year ?? new Date().getFullYear();

    if (mode === "month") {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let d = 1; d <= daysInMonth; d++) {
            const th = document.createElement("th");
            th.textContent = d;
            headerRow.appendChild(th);
        }

        timelineData.forEach((proj) => {
            const startDay = Math.max(
                1,
                proj.start_date.getMonth() === month ? proj.start_date.getDate() : 1
            );
            const endDay = Math.min(
                daysInMonth,
                proj.due_date.getMonth() === month ? proj.due_date.getDate() : daysInMonth
            );
            if (proj.start_date.getMonth() > month || proj.due_date.getMonth() < month) return;
            const tr = document.createElement("tr");
            for (let i = 1; i < startDay; i++) tr.appendChild(document.createElement("td"));
            if (endDay >= startDay) {
                const barTd = document.createElement("td");
                barTd.colSpan = endDay - startDay + 1;
                const titleText = `${proj.name} (${proj.start_date.toLocaleDateString()} → ${proj.due_date.toLocaleDateString()})`;
                barTd.innerHTML = `<div class="timeline-bar ${proj.color}" data-project-id="${proj.id}" title="${titleText}"><span class="circle"></span> ${proj.name}</div>`;
                tr.appendChild(barTd);
            }
            for (let i = endDay + 1; i <= daysInMonth; i++) tr.appendChild(document.createElement("td"));
            rowsContainer.appendChild(tr);
        });
        const titleEl = document.getElementById("timelineModalTitle");
        if (titleEl) {
            titleEl.textContent = `Timeline ${months[month]} ${year}`;
        }
        return;
    }

    let totalCells = 7;
    const headerLabels = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    headerLabels.forEach((label) => {
        const th = document.createElement("th");
        th.textContent = label;
        headerRow.appendChild(th);
    });

    const weeks = getCalendarWeeks(year, month);
    if (weekIndex == null) {
        const today = new Date();
        weekIndex = getWeekOfDate(today, weeks);
        if (weekIndex < 0) weekIndex = 0;
    }

    const weekInfo = weeks[weekIndex];
    if (!weekInfo) return;

    let weekStartDate = weekInfo.start;
    let weekEndDate = weekInfo.end;

    const filteredProjects = timelineData.filter((proj) => {
        return proj.start_date <= weekEndDate && proj.due_date >= weekStartDate;
    });

    filteredProjects.forEach((proj) => {
        const tr = document.createElement("tr");
        function diffDaysUTC(a, b) {
            const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
            const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
            return Math.floor((utcA - utcB) / (1000 * 60 * 60 * 24));
        }
        const rawStart = diffDaysUTC(proj.start_date, weekStartDate);
        const rawEnd = diffDaysUTC(proj.due_date, weekStartDate);
        const projStartIdx = Math.max(0, rawStart);
        const projEndIdx = Math.min(6, rawEnd);

        for (let i = 0; i < projStartIdx; i++) tr.appendChild(document.createElement("td"));

        if (projEndIdx >= projStartIdx) {
            const barTd = document.createElement("td");
            barTd.colSpan = projEndIdx - projStartIdx + 1;
            const titleText = `${proj.name} (${proj.start_date.toLocaleDateString()} → ${proj.due_date.toLocaleDateString()})`;
            barTd.innerHTML = `<div class="timeline-bar ${proj.color}" data-project-id="${proj.id}" title="${titleText}"><span class="circle"></span> ${proj.name}</div>`;
            tr.appendChild(barTd);
        }

        for (let i = projEndIdx + 1; i < totalCells; i++) tr.appendChild(document.createElement("td"));

        rowsContainer.appendChild(tr);
    });

    const titleEl = document.getElementById("timelineTitle");
    if (titleEl) {
        const monthShort = months[month];
        titleEl.textContent = `${monthShort} Week ${weekIndex + 1}`;
    }
}

document.getElementById("prevTimeline").addEventListener("click", () => {
    if (currentWeek > 0) {
        currentWeek--;
    } else {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        const weeks = getCalendarWeeks(currentYear, currentMonth);
        currentWeek = weeks.length > 0 ? weeks.length - 1 : 0;
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
    const weeks = getCalendarWeeks(currentYear, currentMonth);
    const maxWeek = weeks.length - 1;
    if (currentWeek < maxWeek) {
        currentWeek++;
    } else {
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
    updateModalTimeline();
});

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

document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById("search_filter");
    if (!searchInput) return;

    function doSearch() {
        const raw = searchInput.value || "";
        const q = raw.trim();

        if (q !== "") {
            document
                .querySelectorAll(".latest-feedback-snippet")
                .forEach((snippet) => {
                    snippet.classList.add("d-none");
                    snippet.style.display = "none";
                });
        }

        try {
            if (typeof window.loadProjectCardData === "function") {
                window.loadProjectCardData(null, 1, q);
            } else if (typeof loadProjectCardData === "function") {
                loadProjectCardData(null, 1, q);
            } else {
                throw new ReferenceError("loadProjectCardData is not defined");
            }
        } catch (e) {
            console.warn("Search reload failed", e);
        }

        if (q === "") {
            document
                .querySelectorAll(".latest-feedback-snippet")
                .forEach((snippet) => {
                    const projectId = snippet.getAttribute("data-project-id");
                    if (projectId) {
                        if (
                            window.__projectLatest &&
                            window.__projectLatest[projectId]
                        ) {
                            const data = window.__projectLatest[projectId];
                            setProjectLatestFeedbackSnippet(projectId, data);
                        } else {
                            try {
                                fetchLatestFeedbackForProject(projectId);
                            } catch (_) {}
                        }
                    }
                });
        }
    }

    searchInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
            e.preventDefault();
            doSearch();
        }
    });
});

function stripTags(s) {
    try {
        return String(s || "").replace(/<[^>]*>/g, "");
    } catch {
        return String(s || "");
    }
}

function hideProjectLatestFeedbackSnippet(projectId) {
    document.querySelectorAll(`.latest-feedback-snippet[data-project-id="${projectId}"]`)
        .forEach(el => {
            el.classList.add("d-none");
            const avatar = el.querySelector(".latest-feedback-avatar");
            if (avatar) avatar.src = appUrl + "/asset/img/avatar.png";
            const textEl = el.querySelector(".latest-feedback-text");
            if (textEl) textEl.textContent = "";
        });
}

function setProjectLatestFeedbackSnippet(projectId, data) {
    const els = document.querySelectorAll(`.latest-feedback-snippet[data-project-id="${projectId}"]`);
    if (!els.length) return;

    if (!data) {
        hideProjectLatestFeedbackSnippet(projectId);
        return;
    }

    try {
        window.__projectLatest = window.__projectLatest || {};
        window.__projectLatest[String(projectId)] = data;
    } catch {}

    const rawPhoto = data.employee?.photo || data.employee?.user_photo || data.employee?.profile_picture_url;
    const photo = rawPhoto ? buildAvatarUrl(rawPhoto) : appUrl + "/asset/img/avatar.png";

    let plain = stripTags(data.feedback_comment).trim();
    let truncated = plain
        ? (plain.length > 30 ? plain.slice(0, 30) + "..." : plain)
        : (data.image || data.reference_file || (data.reference_files?.length) ? "[attachment]" : "");

    els.forEach(el => {
        const avatar = el.querySelector(".latest-feedback-avatar");
        const textEl = el.querySelector(".latest-feedback-text");

        if (avatar) avatar.src = photo.startsWith("http") ? photo : appUrl + "/" + photo.replace(/^\//, "");
        if (textEl) textEl.textContent = truncated;

        if (truncated) {
            el.classList.remove("d-none");
            el.style.removeProperty("display");
        } else {
            el.classList.add("d-none");
            el.style.display = "none";
        }
    });
}

// === Global Unread Badge Refresher ===
function refreshAllProjectUnreadBadges() {
    try {
        const unreadMap = window.__projectUnread || {};
        document
            .querySelectorAll(".unread-badge[data-project-id]")
            .forEach(function (badge) {
                const pid = badge.getAttribute("data-project-id");
                const count = unreadMap[pid] || 0;
                setProjectUnreadBadge(pid, count);
            });
        // optional console trace
        // console.log('All project badges updated successfully');
    } catch (e) {
        console.warn("refreshAllProjectUnreadBadges error", e);
        // fallback: hide all
        document
            .querySelectorAll(".unread-badge[data-project-id]")
            .forEach(function (badge) {
                badge.classList.add("d-none");
            });
    }
}

function setProjectUnreadBadge(projectId, count) {
    try {
        const badge = document.querySelector(
            `.unread-badge[data-project-id="${projectId}"]`
        );
        if (!badge) return;

        if (count > 0) {
            badge.classList.remove("d-none");
            badge.style.display = "inline-block";
        } else {
            badge.classList.add("d-none");
            badge.style.display = "none";
        }
    } catch (e) {
        console.warn("setProjectUnreadBadge error", e);
    }
}

// Handle responsive tooltip updates on resize and orientation change
let resizeTimeout;
function handleResponsiveTooltipUpdate() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        // Reinitialize all tooltips with correct placement
        initResponsiveTooltips();
    }, 250);
}

// Listen for resize and orientation change events
window.addEventListener("resize", handleResponsiveTooltipUpdate);
window.addEventListener("orientationchange", handleResponsiveTooltipUpdate);
