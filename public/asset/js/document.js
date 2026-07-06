$(".switch-btn").click(function () {
    $(".switch-btn").removeClass("active");
    $(this).addClass("active");

    if ($(this).data("view") === "grid") {
        $(".switch-indicator").addClass("grid");
        $(".grid-view").removeClass("d-none");
        $(".table-view").addClass("d-none");
    } else {
        $(".switch-indicator").removeClass("grid");
        $(".table-view").removeClass("d-none");
        $(".grid-view").addClass("d-none");
    }
});

function renderTable(folders) {
    let html = "";
    if (folders.length == 0) {
        $("#tableFolderBody").html(`
        <tr>
            <td colspan="5" class="text-center text-muted py-5">
                Nothing documents found
            </td>
        </tr>
    `);

        return;
    }

    folders.forEach((folder) => {
        html += `
            <tr class="folder-row" data-id="${folder.id}" data-folder-name="${folder.folder_name}">
                <td>
                    <div class="d-flex align-items-center">
                        <span class="material-symbols-outlined me-2">
                            folder
                        </span>

                        ${folder.folder_name}
                    </div>
                </td>

                <td>${folder.creator.name || "Unknown"}</td>

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

    $("#tableFolderBody").html(html);
}

$(document).on("click", ".btn-menu-folder", function (e) {
    e.stopPropagation();
});

function renderGrid(folders) {
    let html = "";

    if (folders.length == 0) {
        $("#gridFolderBody").html(`
            <div class="empty-folder">
                <p>Nothing documents found</p>
            </div>
        `);

        return;
    }

    folders.forEach((folder) => {
        html += `
            <div class="folder-wrapper folder-card"
                 data-id="${folder.id}">

                <div class="folder-shadow-tab"></div>

                <div class="folder-shadow"></div>

                <div class="folder-tab"></div>

                <div class="folder-body">

                    <p class="folder-name">
                        ${folder.folder_name}
                    </p>

                    <p class="folder-role">
                        ${folder.creator.name || "Unknown"}
                    </p>

                    <hr class="folder-divider">

                    <div class="folder-footer">

                        <div class="folder-avatar"></div>

                        <span class="folder-items">
                            ${folder.total_items || "0"} Items
                        </span>

                    </div>

                </div>

            </div>
        `;
    });

    $("#gridFolderBody").html(html);
}

let currentFolder = null;
let currentFolderData = null;
let currentSort = {
    field: "folder_name",
    direction: "asc",
};

function loadFolder(folderId = null) {
    currentFolder = folderId;

    $.ajax({
        url: "/document/get-all-folder",
        type: "GET",
        data: {
            parent_id: folderId,
            sort_by: currentSort.field,
            sort_direction: currentSort.direction,
        },
        success: function (res) {
            renderBreadcrumb(res.breadcrumb);
            renderTable(res.folders);
            renderGrid(res.folders);
        },
    });
}

// Sort By Functionality
$(document).on("click", ".sortable", function () {
    const field = $(this).data("sort");

    if (currentSort.field === field) {
        currentSort.direction =
            currentSort.direction === "asc" ? "desc" : "asc";
    } else {
        currentSort.field = field;
        currentSort.direction = "asc";
    }

    updateSortIcon();
    loadFolder(currentFolder);
});

function updateSortIcon() {
    $(".sortable .material-symbols-outlined").text("swap_vert");

    const icon =
        currentSort.direction === "asc"
            ? "arrow_upward"
            : "arrow_downward";

    $(`.sortable[data-sort="${currentSort.field}"] .material-symbols-outlined`)
        .text(icon);
}

$(document).ready(function () {
    loadFolder();
    updateSortIcon();
});

$(document).on('click', '.add-folder', function () {

    $('#folder_name').val('');

    $('#parent_folder_id').val(currentFolder);

    $('#modalCreateFolder').modal('show');

});

$(document).on('click', '.edit-folder', function (e) {
    e.stopPropagation();
    const folderRow = $(this).closest('.folder-row');
    const folderId = folderRow.data('id');
    const folderName = folderRow.data('folder-name');

    $('#edit_folder_id').val(folderId);
    $('#edit_folder_name').val(folderName);
    $('#modalEditFolder').modal('show');
});

$(document).on('click', '.delete-folder', function (e) {
    e.stopPropagation();
    const folderRow = $(this).closest('.folder-row');
    const folderId = folderRow.data('id');

    $('#confirmDeleteFolder').data('folder-id', folderId);
    $('#modalDeleteFolder').modal('show');
});

$("#formCreateFolder").submit(function (e) {
    e.preventDefault();

    $.ajax({
        url: "/document/create-folder",
        type: "POST",
        data: $(this).serialize(),
        beforeSend: function () {
            $("#formCreateFolder button[type=submit]")
                .prop("disabled", true)
                .text("Creating...");
        },
        success: function (res) {
            $("#modalCreateFolder").modal("hide");
            showAlertMsg(res.message);
            loadFolder(currentFolder);
            $("#formCreateFolder")[0].reset();
        },
        complete: function () {
            $("#formCreateFolder button[type=submit]")
                .prop("disabled", false)
                .text("Create");
        },
        error: function (xhr) {
            let message = "Something went wrong.";
            if (xhr.responseJSON?.message) {
                message = xhr.responseJSON.message;
            }
            if (xhr.responseJSON?.errors) {
                message = Object.values(xhr.responseJSON.errors)[0][0];
            }
            showAlertMsg(message);
        },
    });
});

$("#formEditFolder").submit(function (e) {
    e.preventDefault();

    $.ajax({
        url: "/document/update-folder",
        type: "POST",
        data: $(this).serialize(),
        beforeSend: function () {
            $("#formEditFolder button[type=submit]")
                .prop("disabled", true)
                .text("Saving...");
        },
        success: function (res) {
            $("#modalEditFolder").modal("hide");
            showAlertMsg(res.message);
            loadFolder(currentFolder);
        },
        complete: function () {
            $("#formEditFolder button[type=submit]")
                .prop("disabled", false)
                .text("Save");
        },
        error: function (xhr) {
            let message = "Something went wrong.";
            if (xhr.responseJSON?.message) {
                message = xhr.responseJSON.message;
            }
            if (xhr.responseJSON?.errors) {
                message = Object.values(xhr.responseJSON.errors)[0][0];
            }
            showAlertMsg(message);
        },
    });
});

$(document).on('click', '#confirmDeleteFolder', function () {
    const folderId = $(this).data('folder-id');

    $.ajax({
        url: `/document/delete-folder/${folderId}`,
        type: "DELETE",
        headers: {
            'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
        },
        beforeSend: function () {
            $('#confirmDeleteFolder').prop('disabled', true).text('Deleting...');
        },
        success: function (res) {
            $('#modalDeleteFolder').modal('hide');
            showAlertMsg(res.message);
            loadFolder(currentFolder);
        },
        complete: function () {
            $('#confirmDeleteFolder').prop('disabled', false).text('Yes');
        },
        error: function (xhr) {
            let message = "Something went wrong.";
            if (xhr.responseJSON?.message) {
                message = xhr.responseJSON.message;
            }
            showAlertMsg(message);
        },
    });
});

$(document).on("click", ".folder-row", function () {
    const folderId = $(this).data("id");

    loadFolder(folderId);
});

$(document).on("click", ".folder-row, .folder-card", function () {
    const folderId = $(this).data("id");

    loadFolder(folderId);
});

function renderBreadcrumb(breadcrumb = []) {

    let html = '';

    if (!breadcrumb.length) {
        html = `
            <span class="breadcrumb-root">Documents</span>
        `;

        $('#breadcrumbDocument').html(html);
        return;
    }

    let items = [...breadcrumb];

    if (items.length > 3) {
        items = items.slice(-3);

        items.unshift({
            id: null,
            folder_name: 'Documents'
        });
    }

    items.forEach((item, index) => {

        const isRoot = item.folder_name === 'Documents';

        html += `
            <span
                class="${isRoot ? 'breadcrumb-root breadcrumb-clickable' : 'breadcrumb-folder'}"
                data-id="${item.id ?? ''}">
                ${item.folder_name}
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

    $('#breadcrumbDocument').html(html);
}

$(document).on('click', '.breadcrumb-folder, .breadcrumb-clickable', function () {

    const id = $(this).data('id');

    loadFolder(id || null);

});

$(document).on('click', '.breadcrumb-folder', function () {

    const id = $(this).data('id');

    loadFolder(id);

});