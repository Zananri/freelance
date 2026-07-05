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
            <tr class="folder-row" data-id="${folder.id}">
                <td class="d-flex align-items-center">
                    <span class="material-symbols-outlined me-2">
                        folder
                    </span>

                    ${folder.folder_name}
                </td>

                <td>${folder.creator.name || "Unknown"}</td>

                <td>-</td>

                <td>${formatDateWithSlash(folder.updated_at)}</td>

                <td></td>
            </tr>
        `;
    });

    $("#tableFolderBody").html(html);
}

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

function loadFolder(folderId = null) {

    currentFolder = folderId;

    $.ajax({
        url: "/document/get-all-folder",
        type: "GET",
        data: {
            parent_id: folderId,
        },
        success: function (res) {

            currentFolderData = res.current_folder;

            renderBreadcrumb(res.breadcrumb);
            renderTable(res.folders);
            renderGrid(res.folders);
        },
    });
}

$(document).ready(function () {
    loadFolder();
});

$(document).on('click', '.add-folder', function () {

    $('#folder_name').val('');

    $('#parent_folder_id').val(currentFolder);

    $('#modalCreateFolder').modal('show');

});

$("#formCreateFolder").submit(function (e) {
    e.preventDefault();

    console.log($('#parent_folder_id').val());
    console.log(currentFolder);

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