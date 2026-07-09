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
const searchInput = document.getElementById("search_filter");
const filterTypeSelect = document.getElementById("filter_type");
const filterExtensionSelect = document.getElementById("filter_extension");
const filterUpdatedSelect = document.getElementById("filter_updated");
let currentFolder = null;
let selectedFiles = [];
let currentSearch = "";
let currentFilterType = "all";
let currentFilterExtension = "all";
let currentFilterUpdated = "all";
const currentSort = {
    field: "folder_name",
    direction: "asc",
};

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

function renderTable(folders, files = []) {
    let html = "";
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
                    <div class="dropdown">
                        <button class="btn btn-menu-folder px-3 py-2 dropdown-toggle no-caret" data-bs-toggle="dropdown">
                            <span class="material-symbols-outlined">more_vert</span>
                        </button>
                        <div class="dropdown-menu">
                            <div class="dropdown-item add-doc edit-folder"><span class="material-symbols-outlined me-2">border_color</span>Change Name</div>
                            <div class="dropdown-item add-doc delete-folder"><span class="material-symbols-outlined me-2">delete</span>Delete</div>
                        </div>
                    </div>
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
                    <div class="dropdown">
                        <button class="btn btn-menu-folder px-3 py-2 dropdown-toggle no-caret" data-bs-toggle="dropdown">
                            <span class="material-symbols-outlined">more_vert</span>
                        </button>
                        <div class="dropdown-menu">
                            <div class="dropdown-item add-doc edit-file"><span class="material-symbols-outlined me-2">border_color</span>Change Name</div>
                            <div class="dropdown-item add-doc delete-file"><span class="material-symbols-outlined me-2">delete</span>Delete</div>
                            <div class="dropdown-item add-doc detail-file"><span class="material-symbols-outlined me-2">info</span>Detail</div>
                            <div class="dropdown-item add-doc download-file"><span class="material-symbols-outlined me-2">download</span>Download</div>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    });
    tableBody.innerHTML = html;
}

function renderGrid(folders, files = []) {
    if (folders.length === 0 && files.length === 0) {
        gridBody.innerHTML = `
            <div class="empty-folder">
                <p>Nothing documents found</p>
            </div>
        `;
        return;
    }

    let html = '';

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
                            <div class="folder-card-actions dropdown">
                                <button class="btn btn-menu-folder p-0 dropdown-toggle no-caret" data-bs-toggle="dropdown">
                                    <span class="material-symbols-outlined">more_vert</span>
                                </button>
                                <div class="dropdown-menu dropdown-menu-end">
                                    <div class="dropdown-item add-doc edit-folder"><span class="material-symbols-outlined me-2">border_color</span>Change Name</div>
                                    <div class="dropdown-item add-doc delete-folder"><span class="material-symbols-outlined me-2">delete</span>Delete</div>
                                </div>
                            </div>
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
                        <div class="dropdown">
                            <button class="btn btn-menu-folder dropdown-toggle no-caret" data-bs-toggle="dropdown">
                                <span class="material-symbols-outlined">more_vert</span>
                            </button>
                            <div class="dropdown-menu dropdown-menu-end">
                                <div class="dropdown-item detail-file">Detail</div>
                                <div class="dropdown-item download-file">Download</div>
                                <div class="dropdown-item delete-file">Delete</div>
                            </div>
                        </div>
                    </div>
                    <div class="file-preview">
                        ${preview}
                    </div>
                    <div class="file-info">
                        <div class="file-title">${escapeHtml(file.file_name)}</div>
                        <div class="file-subtitle">${file.employee?.name ?? "Unknown"}</div>
                    </div>
                    <a href="${href}" target="_blank" class="stretched-link"></a>
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

function getCsrfToken() {
    return document
        .querySelector('meta[name="csrf-token"]')
        .getAttribute("content");
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
    let html = "";
    if (breadcrumb.length === 0) {
        breadcrumbContainer.innerHTML =
            '<span class="breadcrumb-root">Documents</span>';
        return;
    }
    const items =
        breadcrumb.length > 3 ? [...breadcrumb.slice(-3)] : [...breadcrumb];
    if (breadcrumb.length > 3) {
        items.unshift({ id: null, folder_name: "Documents" });
    }
    items.forEach((item, index) => {
        const isRoot = item.folder_name === "Documents";
        html += `<span class="${isRoot ? "breadcrumb-root breadcrumb-clickable" : "breadcrumb-folder"}" data-id="${item.id ?? ""}">${item.folder_name}</span>`;
        if (index !== items.length - 1) {
            html +=
                '<span class="material-symbols-outlined breadcrumb-arrow">chevron_right</span>';
        }
    });
    breadcrumbContainer.innerHTML = html;
}

function loadFolder(folderId = null) {
    currentFolder = folderId;
    const url = new URL("/document/get-all-folder", window.location.origin);
    if (folderId !== null) {
        url.searchParams.set("parent_id", folderId);
    }
    url.searchParams.set("sort_by", currentSort.field);
    url.searchParams.set("sort_direction", currentSort.direction);
    if (currentSearch) {
        url.searchParams.set("search", currentSearch);
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
    fetch(url.toString(), {
        method: "GET",
        credentials: "same-origin",
    })
        .then((response) => response.json())
        .then((res) => {
            renderBreadcrumb(res.breadcrumb);
            renderTable(res.folders, res.files);
            renderGrid(res.folders, res.files);
        });
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
        loadFolder(currentFolder);
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
    const detailFileTarget = event.target.closest(".detail-file");
    if (detailFileTarget) {
        event.stopPropagation();
        const row = detailFileTarget.closest(".file-row, .file-card");
        showFileDetail({
            id: row.dataset.fileId,
            name: row.dataset.fileName,
            url: row.dataset.fileUrl,
            size: row.dataset.fileSize,
            type: row.dataset.fileType,
            updated: row.dataset.fileUpdated,
        });
        new bootstrap.Modal(document.getElementById("modalFileDetail")).show();
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
        loadFolder(id);
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
        loadFolder(folderRow.dataset.id);
    }
    if (
        folderCard &&
        !event.target.closest(".dropdown") &&
        !event.target.closest(".edit-folder") &&
        !event.target.closest(".delete-folder")
    ) {
        loadFolder(folderCard.dataset.id);
    }
});

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
        if (file.size > 1073741824) {
            showAlertMsg(`File ${file.name} exceeds 1GB limit`);
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

uploadSelectedFilesButton.addEventListener("click", function () {
    if (selectedFiles.length === 0) {
        showAlertMsg("No files selected for upload");
        return;
    }
    const formData = new FormData();
    if (currentFolder !== null) {
        formData.append("folder_id", currentFolder);
    }
    selectedFiles.forEach((file) => {
        formData.append("files[]", file);
    });
    fetch("/document/upload-files", {
        method: "POST",
        headers: {
            "X-CSRF-TOKEN": getCsrfToken(),
        },
        body: formData,
    })
        .then((response) => response.json())
        .then((res) => {
            if (res.status) {
                showAlertMsg(res.message);
                loadFolder(currentFolder);
                selectedFiles = [];
                renderUploadPreview();
                bootstrap.Modal.getInstance(
                    document.getElementById("modalUploadFiles"),
                ).hide();
            } else {
                showAlertMsg(res.message || "Upload failed");
            }
        })
        .catch(() => {
            showAlertMsg("Upload failed");
        });
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

function debounce(fn, wait) {
    let timeout;
    return function () {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(context, args), wait);
    };
}

if (typeof jQuery !== "undefined") {
    $(function () {
        $("#search_filter").on(
            "input",
            debounce(function () {
                currentSearch = $(this).val().trim();
                loadFolder(currentFolder);
            }, 250),
        );

        $("#filter_type, #filter_extension, #filter_updated").on(
            "change",
            function () {
                currentFilterType = $("#filter_type").val() || "all";
                currentFilterExtension = $("#filter_extension").val() || "all";
                currentFilterUpdated = $("#filter_updated").val() || "all";
                loadFolder(currentFolder);
            },
        );
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
    loadFolder();
    updateSortIcon();
});
