const switchButtons = document.querySelectorAll(".switch-btn");
const switchIndicator = document.querySelector(".switch-indicator");
const tableView = document.querySelector(".table-view");
const gridView = document.querySelector(".grid-view");
const tableBody = document.getElementById("tableFolderBody");
const gridBody = document.getElementById("gridFolderBody");
const breadcrumbContainer = document.getElementById("breadcrumbDocument");
const fileInput = document.getElementById("documentFilesInput");
const uploadPreviewList = document.getElementById("uploadPreviewList");
const openFileExplorer = document.getElementById("openFileExplorer");
const uploadSelectedFilesButton = document.getElementById(
    "uploadSelectedFiles",
);
const createFolderForm = document.getElementById("formCreateFolder");
const editFolderForm = document.getElementById("formEditFolder");
const editFileForm = document.getElementById("formEditFile");
const confirmDeleteFileButton = document.getElementById("confirmDeleteFile");
const tableLoader = document.getElementById("tableLoader");
const gridLoader = document.getElementById("gridLoader");
const searchInput = document.getElementById("search_filter");
const filterTypeSelect = document.getElementById("filter_type");
const filterExtensionSelect = document.getElementById("filter_extension");
const filterUpdatedSelect = document.getElementById("filter_updated");
const filterDepartmentSelect = document.getElementById("filter_department");
const filterSiteSelect = document.getElementById("filter_site");
const filterJobSelect = document.getElementById("filter_job");
const resetDocumentFiltersButton = document.getElementById("btnResetDocumentFilters");
const documentPaginationWrap = document.getElementById("documentPaginationWrap");
const documentPaginationInfo = document.getElementById("documentPaginationInfo");
const documentPagination = document.getElementById("documentPagination");
let currentFolder = null;
let selectedFiles = [];
let currentSearch = "";
let documentSearchTimer = null;
let currentFilterType = "all";
let currentFilterExtension = "all";
let currentFilterUpdated = "all";
let currentFilterDepartment = "all";
let currentFilterSite = "all";
let currentFilterJob = "all";
const currentSort = {
    field: "folder_name",
    direction: "asc",
};
let currentPage = 1;
const perPage = 10;

const currentUserEmployeeId = Number(document.querySelector('meta[name="current-employee-id"]')?.content || 0);
const currentUserType = (document.querySelector('meta[name="current-user-type"]')?.content || '').toUpperCase();
const currentUserRole = (document.querySelector('meta[name="current-user-role"]')?.content || '').toUpperCase();
const currentUserDepartmentId = Number(document.querySelector('meta[name="current-employee-department-id"]')?.content || 0);
const isCurrentUserAdmin = ["ADMIN", "ADMINISTRATOR"].includes(currentUserType)
    || ["ADMIN", "ADMINISTRATOR"].includes(currentUserRole);
const currentUserDepartmentName = document.querySelector('meta[name="current-employee-department-name"]')?.content || '';

function formatBytes(bytes) {
    if (bytes === 0) {
        return "0 B";
    }
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
}

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function canManageDocument(item) {
    return Number(item?.created_by || 0) === Number(document.querySelector('meta[name="current-user-id"]')?.content || 0);
}

function populateSelectOptions($select, placeholder, items, labelResolver) {
    if (!$select || !$select.length) {
        return;
    }

    const options = [`<option value="all">${placeholder}</option>`];
    (items || []).forEach((item) => {
        options.push(`<option value="${item.id}">${escapeHtml(labelResolver(item))}</option>`);
    });

    $select.html(options.join(""));
}

function loadDepartmentFilters(selectedId = "all") {
    if (!filterDepartmentSelect || currentUserType !== "SUPERADMIN") {
        return $.Deferred().resolve().promise();
    }

    const $select = $(filterDepartmentSelect);
    $select.html('<option value="all">Loading partners...</option>');

    return $.ajax({
        url: "/department/index",
        type: "GET",
        dataType: "json",
    }).done(function (response) {
        populateSelectOptions($select, "All Partners", response.data || [], (item) => item.name_department || item.name || "Untitled");
        $select.val(selectedId);
    }).fail(function () {
        populateSelectOptions($select, "All Partners", [], () => "");
    });
}

function loadSiteFilters(departmentId = "all", selectedId = "all") {
    if (!filterSiteSelect) {
        return $.Deferred().resolve().promise();
    }

    const $select = $(filterSiteSelect);
    const $jobSelect = $(filterJobSelect);

    $select.html('<option value="all">Loading sites...</option>');
    $jobSelect.html('<option value="all">Select Job</option>');

    if (!departmentId || departmentId === "all") {
        populateSelectOptions($select, "All Sites", [], () => "");
        populateSelectOptions($jobSelect, "All Jobs", [], () => "");
        return $.Deferred().resolve().promise();
    }

    return $.ajax({
        url: "/division/index",
        type: "GET",
        dataType: "json",
        data: { department_id: departmentId },
    }).done(function (response) {
        populateSelectOptions($select, "All Sites", response.data || [], (item) => item.name_division || item.name || "Untitled");
        $select.val(selectedId);
    }).fail(function () {
        populateSelectOptions($select, "All Sites", [], () => "");
        populateSelectOptions($jobSelect, "All Jobs", [], () => "");
    });
}

function loadJobFilters(divisionId = "all", selectedId = "all") {
    if (!filterJobSelect) {
        return $.Deferred().resolve().promise();
    }

    const $select = $(filterJobSelect);
    $select.html('<option value="all">Loading jobs...</option>');

    if (!divisionId || divisionId === "all") {
        populateSelectOptions($select, "All Jobs", [], () => "");
        return $.Deferred().resolve().promise();
    }

    return $.ajax({
        url: "/job/index",
        type: "GET",
        dataType: "json",
        data: { division_id: divisionId },
    }).done(function (response) {
        populateSelectOptions($select, "All Jobs", response.data || [], (item) => item.job_name || item.name || "Untitled");
        $select.val(selectedId);
    }).fail(function () {
        populateSelectOptions($select, "All Jobs", [], () => "");
    });
}

function renderCurrentFolderRow(folder) {
    if (!folder) {
        return "";
    }

    return `
        <tr class="folder-row current-folder-row" data-id="${folder.id}" data-folder-name="${escapeHtml(folder.folder_name)}">
            <td>
                <div class="d-flex align-items-center gap-2">
                    <span class="material-symbols-outlined me-1">folder_open</span>
                    <div class="d-flex align-items-center gap-2 flex-wrap">
                        <span>${escapeHtml(folder.folder_name)}</span>
                        <span class="current-folder-badge">Current Folder</span>
                    </div>
                </div>
            </td>
            <td>${folder.creator?.name || "Unknown"}</td>
            <td>-</td>
            <td>${formatDateWithSlash(folder.updated_at)}</td>
            <td></td>
        </tr>
    `;
}

function renderCurrentFolderCard(folder) {
    if (!folder) {
        return "";
    }

    return `
        <div class="grid-section current-folder-section">
            <div class="section-title">Current Folder</div>
            <div class="grid-items current-folder-items">
                <div class="folder-wrapper folder-card current-folder-card" data-id="${folder.id}">
                    <div class="folder-shadow-tab"></div>
                    <div class="folder-shadow"></div>
                    <div class="folder-tab"></div>
                    <div class="folder-body">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <div>
                                <div class="d-flex align-items-center gap-2 mb-1">
                                    <p class="folder-name mb-0">${escapeHtml(folder.folder_name)}</p>
                                    <span class="current-folder-badge">Current Folder</span>
                                </div>
                                <p class="folder-role mb-0">${folder.creator?.name || "Unknown"}</p>
                            </div>
                        </div>
                        <hr class="folder-divider">
                        <div class="folder-footer">
                            <div class="folder-avatar"></div>
                            <span class="folder-items">Open to view children</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderTable(folders, files = [], currentFolderData = null) {
    let html = "";
    html += renderCurrentFolderRow(currentFolderData);
    if (folders.length === 0 && files.length === 0) {
        tableBody.innerHTML = `
        <tr>
            <td colspan="5" class="text-center text-muted py-5">
                Nothing documents found
            </td>
        </tr>
        `;
        return;
    }
    folders.forEach((folder) => {
        html += `
            <tr class="folder-row" data-id="${folder.id}" data-folder-name="${folder.folder_name}">
                <td>
                    <div class="d-flex align-items-center">
                        <span class="material-symbols-outlined me-2">folder</span>
                        ${folder.folder_name}
                    </div>
                </td>
                <td>${folder.creator?.name || "Unknown"}</td>
                <td>-</td>
                <td>${formatDateWithSlash(folder.updated_at)}</td>
                <td>
                    ${canManageDocument(folder) ? `<div class="dropdown">
                        <button class="btn btn-menu-folder px-3 py-2 dropdown-toggle no-caret" data-bs-toggle="dropdown">
                            <span class="material-symbols-outlined">more_vert</span>
                        </button>
                        <div class="dropdown-menu">
                            <div class="dropdown-item add-doc edit-folder"><span class="material-symbols-outlined me-2">border_color</span>Change Name</div>
                            <div class="dropdown-item add-doc delete-folder"><span class="material-symbols-outlined me-2">delete</span>Delete</div>
                        </div>
                    </div>` : ''}
                </td>
            </tr>
        `;
    });
    files.forEach((file) => {
        const href = file.file_path.startsWith("/")
            ? file.file_path
            : `/${file.file_path}`;
        html += `
            <tr class="file-row" data-file-id="${file.id}" data-file-name="${escapeHtml(file.file_name)}" data-file-url="${href}" data-file-size="${file.file_size}" data-file-type="${escapeHtml(file.file_type)}" data-file-updated="${file.updated_at}">
                <td>
                    <div class="d-flex align-items-center">
                        <span class="material-symbols-outlined me-2">insert_drive_file</span>
                        ${escapeHtml(file.file_name)}
                    </div>
                </td>
                <td>${file.employee?.name || "Unknown"}</td>
                <td>${formatBytes(file.file_size)}</td>
                <td>${formatDateWithSlash(file.updated_at)}</td>
                <td>
                    ${canManageDocument(file) ? `<div class="dropdown">
                        <button class="btn btn-menu-folder px-3 py-2 dropdown-toggle no-caret" data-bs-toggle="dropdown">
                            <span class="material-symbols-outlined">more_vert</span>
                        </button>
                        <div class="dropdown-menu">
                            <div class="dropdown-item add-doc edit-file"><span class="material-symbols-outlined me-2">border_color</span>Change Name</div>
                            <div class="dropdown-item add-doc delete-file"><span class="material-symbols-outlined me-2">delete</span>Delete</div>
                            <div class="dropdown-item add-doc download-file"><span class="material-symbols-outlined me-2">download</span>Download</div>
                        </div>
                    </div>` : ''}
                </td>
            </tr>
        `;
    });
    tableBody.innerHTML = html;
}

function renderGrid(folders, files = [], currentFolderData = null) {
    if (folders.length === 0 && files.length === 0) {
        gridBody.innerHTML = `${renderCurrentFolderCard(currentFolderData)}
            <div class="empty-folder">
                <p>Nothing documents found</p>
            </div>
        `;
        return;
    }

    let html = renderCurrentFolderCard(currentFolderData);

    if (folders.length > 0) {
        html += `
            <div class="grid-section folder-section">
                <div class="section-title">Folders</div>
                <div class="grid-items folder-items">
        `;

        folders.forEach((folder) => {
            html += `
                <div class="folder-wrapper folder-card" data-id="${folder.id}">
                    <div class="folder-shadow-tab"></div>
                    <div class="folder-shadow"></div>
                    <div class="folder-tab"></div>
                    <div class="folder-body">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <div>
                                <p class="folder-name mb-1">${folder.folder_name}</p>
                                <p class="folder-role mb-0">${folder.creator?.name || "Unknown"}</p>
                            </div>
                            ${canManageDocument(folder) ? `<div class="folder-card-actions dropdown">
                                <button class="btn btn-menu-folder p-0 dropdown-toggle no-caret" data-bs-toggle="dropdown">
                                    <span class="material-symbols-outlined">more_vert</span>
                                </button>
                                <div class="dropdown-menu dropdown-menu-end">
                                    <div class="dropdown-item add-doc edit-folder"><span class="material-symbols-outlined me-2">border_color</span>Change Name</div>
                                    <div class="dropdown-item add-doc delete-folder"><span class="material-symbols-outlined me-2">delete</span>Delete</div>
                                </div>
                            </div>` : ''}
                        </div>
                        <hr class="folder-divider">
                        <div class="folder-footer">
                            <div class="folder-avatar"></div>
                            <span class="folder-items">${folder.total_items || "0"} Items</span>
                        </div>
                    </div>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;
    }

    if (files.length > 0) {
        html += `
            <div class="grid-section file-section">
                <div class="section-title">Files</div>
                <div class="grid-items file-items">
        `;

        files.forEach((file) => {
            const href = file.file_path.startsWith("/")
                ? file.file_path
                : `/${file.file_path}`;

            const fileExt = (file.file_name || file.file_type || "").toLowerCase();

            const isImage =
                fileExt.match(/\.(png|jpe?g|gif|webp)$/) ||
                file.file_type?.startsWith("image/");

            const preview = isImage
                ? `<img src="${href}" alt="${escapeHtml(file.file_name)}">`
                : `
                <div class="file-icon">
                    <span class="material-symbols-outlined">
                        insert_drive_file
                    </span>
                </div>
            `;

            html += `
                <div class="file-card" data-file-id="${file.id}" data-file-name="${escapeHtml(file.file_name)}" data-file-url="${href}" data-file-type="${escapeHtml(file.file_type)}" data-file-updated="${file.updated_at}">
                    <div class="file-card-header d-flex justify-content-between align-items-start">
                        <span class="file-type-badge">${escapeHtml(file.file_type.split("/").pop() || fileExt.split('.').pop() || 'FILE').toUpperCase()}</span>
                        ${canManageDocument(file) ? `<div class="dropdown">
                            <button class="btn btn-menu-folder dropdown-toggle no-caret" data-bs-toggle="dropdown">
                                <span class="material-symbols-outlined">more_vert</span>
                            </button>
                            <div class="dropdown-menu dropdown-menu-end">
                                <div class="dropdown-item add-doc edit-file"><span class="material-symbols-outlined me-2">border_color</span>Change Name</div>
                                <div class="dropdown-item add-doc delete-file"><span class="material-symbols-outlined me-2">delete</span>Delete</div>
                                <div class="dropdown-item add-doc download-file"><span class="material-symbols-outlined me-2">download</span>Download</div>
                            </div>
                        </div>` : ''}
                    </div>
                    <div class="file-preview">
                        <a href="${href}" target="_blank" class="file-preview-link">
                            ${preview}
                        </a>
                    </div>
                    <div class="file-info">
                        <div class="file-title">${escapeHtml(file.file_name)}</div>
                        <div class="file-subtitle">${file.employee?.name ?? "Unknown"}</div>
                    </div>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;
    }

    gridBody.innerHTML = html;
}

function createPaginationButton(label, page, disabled) {
    return `<button type="button" class="document-page-btn" data-page="${page}" ${disabled ? "disabled" : ""}>${label}</button>`;
}

function buildPaginationNumbers(current, last) {
    const pages = [];

    if (last <= 7) {
        for (let i = 1; i <= last; i++) {
            pages.push(i);
        }
        return pages;
    }

    pages.push(1);

    if (current > 3) {
        pages.push("...");
    }

    const start = Math.max(2, current - 1);
    const end = Math.min(last - 1, current + 1);

    for (let i = start; i <= end; i++) {
        pages.push(i);
    }

    if (current < last - 2) {
        pages.push("...");
    }

    pages.push(last);

    return pages;
}

function renderPagination(pagination) {
    if (!documentPaginationWrap || !documentPaginationInfo || !documentPagination) {
        return;
    }

    if (!pagination || (pagination.total || 0) === 0) {
        documentPaginationWrap.classList.add("d-none");
        documentPaginationInfo.textContent = "";
        documentPagination.innerHTML = "";
        return;
    }

    documentPaginationWrap.classList.remove("d-none");
    const from = pagination.from || 0;
    const to = pagination.to || 0;
    const total = pagination.total || 0;
    documentPaginationInfo.textContent = `Showing ${from}-${to} of ${total}`;

    const current = pagination.current_page || 1;
    const last = pagination.last_page || 1;
    const buttons = [];

    buttons.push(createPaginationButton("Prev", Math.max(current - 1, 1), current <= 1));

    buildPaginationNumbers(current, last).forEach((item) => {
        if (item === "...") {
            buttons.push('<span class="document-page-btn" style="pointer-events:none;">...</span>');
            return;
        }
        const activeClass = item === current ? " active" : "";
        buttons.push(`<button type="button" class="document-page-btn${activeClass}" data-page="${item}">${item}</button>`);
    });

    buttons.push(createPaginationButton("Next", Math.min(current + 1, last), current >= last));
    documentPagination.innerHTML = buttons.join("");
}

function getCsrfToken() {
    return document
        .querySelector('meta[name="csrf-token"]')
        .getAttribute("content");
}

function showDocumentLoaders() {
    if (tableLoader) {
        tableLoader.style.display = "block";
    }
    if (gridLoader) {
        gridLoader.style.display = "block";
    }
}

function hideDocumentLoaders() {
    if (tableLoader) {
        tableLoader.style.display = "none";
    }
    if (gridLoader) {
        gridLoader.style.display = "none";
    }
}

function updateSortIcon() {
    document
        .querySelectorAll(".sortable .material-symbols-outlined")
        .forEach((icon) => {
            icon.textContent = "swap_vert";
        });
    const currentIcon = document.querySelector(
        `.sortable[data-sort="${currentSort.field}"] .material-symbols-outlined`,
    );
    if (currentIcon) {
        currentIcon.textContent =
            currentSort.direction === "asc" ? "arrow_upward" : "arrow_downward";
    }
}

function renderBreadcrumb(breadcrumb = []) {
    const documentsLabel =
        breadcrumbContainer.dataset.documentsLabel || "Documents";

    let html = "";

    if (breadcrumb.length === 0) {
        breadcrumbContainer.innerHTML = `
            <span class="breadcrumb-root">
                ${documentsLabel}
            </span>
        `;

        return;
    }

    const items =
        breadcrumb.length > 3
            ? [...breadcrumb.slice(-3)]
            : [...breadcrumb];

    if (breadcrumb.length > 3) {
        items.unshift({
            id: null,
            folder_name: documentsLabel,
            is_root: true,
        });
    }

    items.forEach((item, index) => {
        const isRoot =
            item.is_root === true ||
            item.folder_name === "Documents";

        const folderName = isRoot
            ? documentsLabel
            : item.folder_name;

        html += `
            <span
                class="${
                    isRoot
                        ? "breadcrumb-root breadcrumb-clickable"
                        : "breadcrumb-folder"
                }"
                data-id="${item.id ?? ""}"
            >
                ${folderName}
            </span>
        `;

        if (index !== items.length - 1) {
            html += `
                <span class="material-symbols-outlined breadcrumb-arrow">
                    chevron_right
                </span>
            `;
        }
    });

    breadcrumbContainer.innerHTML = html;
}

function loadFolder(folderId = currentFolder, page = currentPage) {
    const normalizedCurrentFolder =
        currentFolder === null || currentFolder === undefined
            ? null
            : String(currentFolder);
    const normalizedTargetFolder =
        folderId === null || folderId === undefined || folderId === ""
            ? null
            : String(folderId);
    const folderChanged = normalizedCurrentFolder !== normalizedTargetFolder;

    if (folderChanged) {
        resetDocumentSearch();
    }

    currentFolder = folderId;
    currentPage = page;
    const url = new URL("/document/get-all-folder", window.location.origin);
    if (folderId !== null) {
        url.searchParams.set("parent_id", folderId);
    }
    url.searchParams.set("page", String(currentPage));
    url.searchParams.set("per_page", String(perPage));
    url.searchParams.set("sort_by", currentSort.field);
    url.searchParams.set("sort_direction", currentSort.direction);
    if (currentSearch) {
        url.searchParams.set("search", currentSearch);
    }
    if (currentFilterDepartment && currentFilterDepartment !== "all") {
        url.searchParams.set("filter_department", currentFilterDepartment);
    }
    if (currentFilterSite && currentFilterSite !== "all") {
        url.searchParams.set("filter_division", currentFilterSite);
    }
    if (currentFilterJob && currentFilterJob !== "all") {
        url.searchParams.set("filter_job", currentFilterJob);
    }
    if (currentFilterType && currentFilterType !== "all") {
        url.searchParams.set("filter_type", currentFilterType);
    }
    if (currentFilterExtension && currentFilterExtension !== "all") {
        url.searchParams.set("filter_extension", currentFilterExtension);
    }
    if (currentFilterUpdated && currentFilterUpdated !== "all") {
        url.searchParams.set("filter_updated", currentFilterUpdated);
    }
    showDocumentLoaders();
    fetch(url.toString(), {
        method: "GET",
        credentials: "same-origin",
    })
        .then((response) => response.json())
        .then((res) => {
            renderBreadcrumb(res.breadcrumb);
            renderTable(res.folders, res.files, res.current_folder);
            renderGrid(res.folders, res.files, res.current_folder);
            renderPagination(res.pagination || null);
            currentPage = res.pagination?.current_page || 1;
        })
        .catch(() => {
            showAlertMsg("Failed to load documents");
            renderPagination(null);
        })
        .finally(() => {
            hideDocumentLoaders();
        });
}

function resetDocumentSearch() {
    clearTimeout(documentSearchTimer);
    currentSearch = "";
    if (searchInput) {
        searchInput.value = "";
    }
    if (typeof jQuery !== "undefined") {
        $("#search_filter").val("");
    }
}

function navigateDocumentFolder(folderId) {
    resetDocumentSearch();
    currentPage = 1;
    loadFolder(folderId, currentPage);
}

function applyDocumentSearch() {
    const nextSearch = searchInput ? searchInput.value.trim() : "";
    if (nextSearch === currentSearch) {
        return;
    }

    currentSearch = nextSearch;
    currentPage = 1;
    loadFolder(currentFolder, currentPage);
}

function toggleView(view) {
    if (view === "grid") {
        switchIndicator.classList.add("grid");
        gridView.classList.remove("d-none");
        tableView.classList.add("d-none");
    } else {
        switchIndicator.classList.remove("grid");
        tableView.classList.remove("d-none");
        gridView.classList.add("d-none");
    }
}

document.addEventListener("click", function (event) {
    const switchButton = event.target.closest(".switch-btn");
    if (switchButton) {
        switchButtons.forEach((button) => button.classList.remove("active"));
        switchButton.classList.add("active");
        toggleView(switchButton.dataset.view);
        return;
    }
    const sortTarget = event.target.closest(".sortable");
    if (sortTarget) {
        const field = sortTarget.dataset.sort;
        if (currentSort.field === field) {
            currentSort.direction =
                currentSort.direction === "asc" ? "desc" : "asc";
        } else {
            currentSort.field = field;
            currentSort.direction = "asc";
        }
        updateSortIcon();
        currentPage = 1;
        loadFolder(currentFolder, currentPage);
        return;
    }
    const addFolder = event.target.closest(".add-folder");
    if (addFolder) {
        document.getElementById("folder_name").value = "";
        document.getElementById("parent_folder_id").value = currentFolder;
        new bootstrap.Modal(
            document.getElementById("modalCreateFolder"),
        ).show();
        return;
    }
    const addFiles = event.target.closest(".add-files");
    if (addFiles) {
        selectedFiles = [];
        new bootstrap.Modal(document.getElementById("modalUploadFiles")).show();
        renderUploadPreview();
        return;
    }
    const editTarget = event.target.closest(".edit-folder");
    if (editTarget) {
        event.stopPropagation();
        const row = editTarget.closest(".folder-row");
        document.getElementById("edit_folder_id").value = row.dataset.id;
        document.getElementById("edit_folder_name").value =
            row.dataset.folderName;
        new bootstrap.Modal(document.getElementById("modalEditFolder")).show();
        return;
    }
    const deleteTarget = event.target.closest(".delete-folder");
    if (deleteTarget) {
        event.stopPropagation();
        const row = deleteTarget.closest(".folder-row");
        document.getElementById("confirmDeleteFolder").dataset.folderId =
            row.dataset.id;
        new bootstrap.Modal(
            document.getElementById("modalDeleteFolder"),
        ).show();
        return;
    }
    const editFileTarget = event.target.closest(".edit-file");
    if (editFileTarget) {
        event.stopPropagation();
        const row = editFileTarget.closest(".file-row, .file-card");
        document.getElementById("edit_file_id").value = row.dataset.fileId;
        document.getElementById("edit_file_name").value = row.dataset.fileName;
        new bootstrap.Modal(document.getElementById("modalEditFile")).show();
        return;
    }
    const deleteFileTarget = event.target.closest(".delete-file");
    if (deleteFileTarget) {
        event.stopPropagation();
        const row = deleteFileTarget.closest(".file-row, .file-card");
        document.getElementById("confirmDeleteFile").dataset.fileId =
            row.dataset.fileId;
        new bootstrap.Modal(document.getElementById("modalDeleteFile")).show();
        return;
    }
    const downloadFileTarget = event.target.closest(".download-file");
    if (downloadFileTarget) {
        event.stopPropagation();
        const row = downloadFileTarget.closest(".file-row, .file-card");
        window.open(row.dataset.fileUrl, "_blank");
        return;
    }
    const breadcrumbTarget = event.target.closest(
        ".breadcrumb-folder, .breadcrumb-clickable",
    );
    if (breadcrumbTarget) {
        const id = breadcrumbTarget.dataset.id || null;
        navigateDocumentFolder(id);
        return;
    }
    const folderRow = event.target.closest(".folder-row");
    const folderCard = event.target.closest(".folder-card");
    if (
        folderRow &&
        !event.target.closest(".dropdown") &&
        !event.target.closest(".edit-folder") &&
        !event.target.closest(".delete-folder")
    ) {
        navigateDocumentFolder(folderRow.dataset.id);
    }
    if (
        folderCard &&
        !event.target.closest(".dropdown") &&
        !event.target.closest(".edit-folder") &&
        !event.target.closest(".delete-folder")
    ) {
        navigateDocumentFolder(folderCard.dataset.id);
    }
});

if (documentPagination) {
    documentPagination.addEventListener("click", function (event) {
        const target = event.target.closest("button[data-page]");
        if (!target || target.disabled) {
            return;
        }
        const page = Number(target.getAttribute("data-page"));
        if (!Number.isFinite(page) || page < 1 || page === currentPage) {
            return;
        }
        currentPage = page;
        loadFolder(currentFolder, currentPage);
    });
}

function renderUploadPreview() {
    if (!uploadPreviewList) {
        return;
    }
    if (selectedFiles.length === 0) {
        uploadPreviewList.innerHTML =
            '<div class="text-muted">No files selected</div>';
        return;
    }
    uploadPreviewList.innerHTML = selectedFiles
        .map((file, index) => {
            return `
            <div class="d-flex align-items-center justify-content-between border rounded-3 p-2 bg-light">
                <div class="d-flex align-items-center gap-3">
                    <span class="material-symbols-outlined">insert_drive_file</span>
                    <div>
                        <div class="fw-semibold">${file.name}</div>
                        <div class="text-muted" style="font-size:.85rem;">${formatBytes(file.size)}</div>
                    </div>
                </div>
                <button type="button" class="btn btn-sm btn-outline-danger" data-index="${index}">×</button>
            </div>
        `;
        })
        .join("");
}

document.addEventListener("click", function (event) {
    const removeButton = event.target.closest(
        "#uploadPreviewList button[data-index]",
    );
    if (removeButton) {
        const removeIndex = parseInt(removeButton.dataset.index, 10);
        selectedFiles = selectedFiles.filter(
            (_, index) => index !== removeIndex,
        );
        renderUploadPreview();
        return;
    }
});

openFileExplorer.addEventListener("click", function () {
    fileInput.click();
});

fileInput.addEventListener("change", function () {
    const files = Array.from(fileInput.files);
    if (files.length === 0) {
        return;
    }
    const validFiles = [];
    for (const file of files) {
        if (file.size > 20 * 1024 * 1024) {
            showAlertMsg(`File ${file.name} exceeds 20MB limit`);
            continue;
        }
        validFiles.push(file);
    }
    if (validFiles.length === 0) {
        fileInput.value = "";
        return;
    }
    selectedFiles = selectedFiles.concat(validFiles);
    renderUploadPreview();
    fileInput.value = "";
});

async function uploadDocumentFileInChunks(file, fileIndex) {
    const chunkSize = 1024 * 1024;
    const totalChunks = Math.ceil(file.size / chunkSize);
    const uploadId = [
        Date.now(),
        fileIndex,
        Math.random().toString(36).slice(2),
    ].join("_");

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * chunkSize;
        const chunk = file.slice(start, Math.min(start + chunkSize, file.size));
        const formData = new FormData();

        if (currentFolder !== null) {
            formData.append("folder_id", currentFolder);
        }
        formData.append("upload_id", uploadId);
        formData.append("chunk_index", chunkIndex);
        formData.append("total_chunks", totalChunks);
        formData.append("original_name", file.name);
        formData.append("mime_type", file.type || "application/octet-stream");
        formData.append("total_size", file.size);
        formData.append("chunk", chunk, `${file.name}.part`);

        uploadSelectedFilesButton.textContent =
            `Uploading ${fileIndex + 1}/${selectedFiles.length} (${chunkIndex + 1}/${totalChunks})`;

        const response = await fetch("/document/upload-chunk", {
            method: "POST",
            headers: {
                "X-CSRF-TOKEN": getCsrfToken(),
                "Accept": "application/json",
            },
            body: formData,
        });
        const contentType = response.headers.get("content-type") || "";
        const result = contentType.includes("application/json")
            ? await response.json()
            : { message: `Upload failed (${response.status}).` };

        if (!response.ok || result.status === false) {
            const validationMessage = result.errors
                ? Object.values(result.errors).flat().join(" ")
                : result.message;
            throw new Error(validationMessage || "Upload failed");
        }
    }
}

uploadSelectedFilesButton.addEventListener("click", async function () {
    if (selectedFiles.length === 0) {
        showAlertMsg("No files selected for upload");
        return;
    }

    const originalButtonText = uploadSelectedFilesButton.textContent;
    uploadSelectedFilesButton.disabled = true;

    try {
        for (let fileIndex = 0; fileIndex < selectedFiles.length; fileIndex++) {
            await uploadDocumentFileInChunks(selectedFiles[fileIndex], fileIndex);
        }

        showAlertMsg("Files uploaded successfully.");
        loadFolder(currentFolder);
        selectedFiles = [];
        renderUploadPreview();
        bootstrap.Modal.getInstance(
            document.getElementById("modalUploadFiles"),
        ).hide();
    } catch (error) {
        showAlertMsg(error.message || "Upload failed");
    } finally {
        uploadSelectedFilesButton.disabled = false;
        uploadSelectedFilesButton.textContent = originalButtonText;
    }
});

function showFileDetail(file) {
    const content = `
        <div class="mb-3">
            <strong>Name:</strong>
            <div>${escapeHtml(file.name)}</div>
        </div>
        <div class="mb-3">
            <strong>Type:</strong>
            <div>${escapeHtml(file.type)}</div>
        </div>
        <div class="mb-3">
            <strong>Size:</strong>
            <div>${formatBytes(Number(file.size) || 0)}</div>
        </div>
        <div class="mb-3">
            <strong>Updated:</strong>
            <div>${escapeHtml(file.updated)}</div>
        </div>
        <div class="mb-3">
            <strong>Download:</strong>
            <div><a href="${file.url}" target="_blank" class="text-decoration-none">Download file</a></div>
        </div>
    `;
    document.getElementById("fileDetailContent").innerHTML = content;
}

editFileForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const formData = new FormData(editFileForm);
    fetch("/document/update-file", {
        method: "POST",
        headers: {
            "X-CSRF-TOKEN": getCsrfToken(),
        },
        body: formData,
    })
        .then((response) => response.json())
        .then((res) => {
            if (res.status) {
                bootstrap.Modal.getInstance(
                    document.getElementById("modalEditFile"),
                ).hide();
                showAlertMsg(res.message);
                loadFolder(currentFolder);
            } else {
                showAlertMsg(res.message || "Update failed");
            }
        })
        .catch(() => {
            showAlertMsg("Update failed");
        });
});

confirmDeleteFileButton.addEventListener("click", function () {
    const fileId = this.dataset.fileId;
    if (!fileId) {
        return;
    }
    fetch(`/document/delete-file/${fileId}`, {
        method: "DELETE",
        headers: {
            "X-CSRF-TOKEN": getCsrfToken(),
        },
    })
        .then((response) => response.json())
        .then((res) => {
            if (res.status) {
                bootstrap.Modal.getInstance(
                    document.getElementById("modalDeleteFile"),
                ).hide();
                showAlertMsg(res.message);
                loadFolder(currentFolder);
            } else {
                showAlertMsg(res.message || "Delete failed");
            }
        })
        .catch(() => {
            showAlertMsg("Delete failed");
        });
});

createFolderForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const formData = new FormData(createFolderForm);
    fetch("/document/create-folder", {
        method: "POST",
        headers: {
            "X-CSRF-TOKEN": getCsrfToken(),
        },
        body: formData,
    })
        .then((response) => response.json())
        .then((res) => {
            if (res.status) {
                bootstrap.Modal.getInstance(
                    document.getElementById("modalCreateFolder"),
                ).hide();
                showAlertMsg(res.message);
                loadFolder(currentFolder);
                createFolderForm.reset();
            } else {
                showAlertMsg(res.message || "Create folder failed");
            }
        })
        .catch(() => {
            showAlertMsg("Create folder failed");
        });
});

editFolderForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const formData = new FormData(editFolderForm);
    fetch("/document/update-folder", {
        method: "POST",
        headers: {
            "X-CSRF-TOKEN": getCsrfToken(),
        },
        body: formData,
    })
        .then((response) => response.json())
        .then((res) => {
            if (res.status) {
                bootstrap.Modal.getInstance(
                    document.getElementById("modalEditFolder"),
                ).hide();
                showAlertMsg(res.message);
                loadFolder(currentFolder);
            } else {
                showAlertMsg(res.message || "Update folder failed");
            }
        })
        .catch(() => {
            showAlertMsg("Update folder failed");
        });
});

document
    .getElementById("confirmDeleteFolder")
    .addEventListener("click", function () {
        const folderId = this.dataset.folderId;
        fetch(`/document/delete-folder/${folderId}`, {
            method: "DELETE",
            headers: {
                "X-CSRF-TOKEN": getCsrfToken(),
            },
        })
            .then((response) => response.json())
            .then((res) => {
                if (res.status) {
                    bootstrap.Modal.getInstance(
                        document.getElementById("modalDeleteFolder"),
                    ).hide();
                    showAlertMsg(res.message);
                    loadFolder(currentFolder);
                } else {
                    showAlertMsg(res.message || "Delete failed");
                }
            })
            .catch(() => {
                showAlertMsg("Delete failed");
            });
    });

if (typeof jQuery !== "undefined") {
    $(function () {
        $("#search_filter")
            .on("keydown", function (event) {
                if (event.key === "Enter") {
                    event.preventDefault();
                    clearTimeout(documentSearchTimer);
                    applyDocumentSearch();
                }
            })
            .on("input", function () {
                clearTimeout(documentSearchTimer);
                const value = $(this).val().trim();

                if (value === "") {
                    applyDocumentSearch();
                    return;
                }

                documentSearchTimer = setTimeout(function () {
                    applyDocumentSearch();
                }, 650);
            })
            .on("change", function () {
                clearTimeout(documentSearchTimer);
                applyDocumentSearch();
            });

        if (currentUserType === "SUPERADMIN") {
            loadDepartmentFilters("all").then(function () {
                loadSiteFilters("all", "all");
                loadJobFilters("all", "all");
            });
        } else if (isCurrentUserAdmin) {
            if (currentUserDepartmentId) {
                loadSiteFilters(currentUserDepartmentId, "all").then(function () {
                    loadJobFilters("all", "all");
                });
            }
        }

        $(filterDepartmentSelect).on("change", function () {
            currentFilterDepartment = $(this).val() || "all";
            currentFilterSite = "all";
            currentFilterJob = "all";
            loadSiteFilters(currentFilterDepartment, "all").then(function () {
                loadJobFilters("all", "all").then(function () {
                    currentPage = 1;
                    loadFolder(currentFolder, currentPage);
                });
            });
        });

        $(filterSiteSelect).on("change", function () {
            currentFilterSite = $(this).val() || "all";
            currentFilterJob = "all";
            loadJobFilters(currentFilterSite, "all").then(function () {
                currentPage = 1;
                loadFolder(currentFolder, currentPage);
            });
        });

        $(filterJobSelect).on("change", function () {
            currentFilterJob = $(this).val() || "all";
            currentPage = 1;
            loadFolder(currentFolder, currentPage);
        });

        $("#filter_type, #filter_extension, #filter_updated").on(
            "change",
            function () {
                currentFilterType = $("#filter_type").val() || "all";
                currentFilterExtension = $("#filter_extension").val() || "all";
                currentFilterUpdated = $("#filter_updated").val() || "all";
                currentPage = 1;
                loadFolder(currentFolder, currentPage);
            },
        );

        if (resetDocumentFiltersButton) {
            $(resetDocumentFiltersButton).on("click", function () {
                currentFilterType = "all";
                currentFilterExtension = "all";
                currentFilterUpdated = "all";
                currentFilterDepartment = "all";
                currentFilterSite = "all";
                currentFilterJob = "all";
                currentPage = 1;

                $("#filter_type").val("all");
                $("#filter_extension").val("all");
                $("#filter_updated").val("all");

                if (currentUserType === "SUPERADMIN") {
                    loadDepartmentFilters("all").then(function () {
                        loadSiteFilters("all", "all").then(function () {
                            loadJobFilters("all", "all").then(function () {
                                loadFolder(currentFolder, currentPage);
                            });
                        });
                    });
                } else if (isCurrentUserAdmin) {
                    if (currentUserDepartmentId) {
                        loadSiteFilters(currentUserDepartmentId, "all").then(function () {
                            loadJobFilters("all", "all").then(function () {
                                loadFolder(currentFolder, currentPage);
                            });
                        });
                    } else {
                        loadFolder(currentFolder, currentPage);
                    }
                } else {
                    loadFolder(currentFolder, currentPage);
                }
            });
        }
    });
}

window.addEventListener("DOMContentLoaded", function () {
    if (searchInput && searchInput.value) {
        currentSearch = searchInput.value.trim();
    }
    if (filterTypeSelect) {
        currentFilterType = filterTypeSelect.value || "all";
    }
    if (filterExtensionSelect) {
        currentFilterExtension = filterExtensionSelect.value || "all";
    }
    if (filterUpdatedSelect) {
        currentFilterUpdated = filterUpdatedSelect.value || "all";
    }
    if (isCurrentUserAdmin) {
        currentFilterDepartment = currentUserDepartmentId ? String(currentUserDepartmentId) : "all";
    }
    loadFolder(null, currentPage);
    updateSortIcon();
});
