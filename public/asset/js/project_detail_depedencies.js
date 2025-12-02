// Get appUrl and projectId from meta tags
if (typeof appUrl === 'undefined') {
    var appUrl = (
        document.querySelector('meta[name="app-url"]')?.getAttribute("content") ||
        $('meta[name=app-url]').attr("content") ||
        ""
    ).replace(/\/$/, "");
}

if (typeof projectId === 'undefined') {
    var projectId = document.querySelector('meta[name="project-id"]')?.getAttribute("content") || 
                    $('meta[name="project-id"]').attr("content") || 
                    "";
}

let currentMaxLevel = 6;
let allTasks = [];
// When true, we use jsPlumb lines only and disable the old DOM/SVG connector logic
window.USE_PLUMB_ONLY = true;

function renderChildGroups(task, $container, $template) {
    if (!task.children || task.children.length === 0) return;
    $container.find(".task-item").remove();
    for (let i = 0; i < task.children.length; i++) {
        const child = task.children[i];
        const $child = renderTaskNode(child, $template);
        const $wrap = $('<div class="task-item"></div>');
        try {
            $wrap.css({ overflow: "visible", position: "relative" });
        } catch (_) {}
        // Old connector stub removed in jsPlumb-only mode
        $wrap.append($child);
        $container.append($wrap);
    }
}

// Helper: fetch reference URLs for a given task id, populate #referenceUrlsList and show the modal
function showReferenceUrlsForTask(taskId) {
    if (!taskId) return;
    try {
        $.ajax({
            url: appUrl + "/task/" + encodeURIComponent(String(taskId)),
            type: "GET",
            dataType: "json",
            success: function (res) {
                const payload = res && (res.data || res);
                let referenceUrls = payload && payload.reference_urls;

                if (typeof referenceUrls === "string") {
                    try {
                        const parsed = JSON.parse(referenceUrls);
                        referenceUrls = Array.isArray(parsed)
                            ? parsed
                            : [String(referenceUrls)];
                    } catch (e) {
                        referenceUrls = referenceUrls
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean);
                    }
                }
                if ((!referenceUrls || referenceUrls.length === 0) && payload && payload.reference_url) {
                    referenceUrls = [payload.reference_url];
                }

                const listEl = document.getElementById('referenceUrlsList');
                if (!listEl) return;
                listEl.innerHTML = '';
                try { listEl.dataset.taskId = String(taskId || ''); } catch (_) {}

                if (Array.isArray(referenceUrls) && referenceUrls.length > 0) {
                    referenceUrls.forEach(function (u, idx) {
                        if (!u) return;
                        const safeUrl = String(u || '').trim();

                        const row = document.createElement('div');
                        row.className =
                            'd-flex align-items-center justify-content-between gap-2 p-2 rounded bg-light selected-task mb-2';

                        const left = document.createElement('div');
                        left.className = 'd-flex align-items-center flex-grow-1 text-truncate';
                        left.style.fontSize = "10px";

                        const a = document.createElement('a');
                        a.href = safeUrl;
                        a.target = '_blank';
                        a.className = 'text-decoration-none text-truncate flex-grow-1';
                        // Display the actual URL instead of label
                        a.textContent = safeUrl;
                        a.style.color = '#444';
                        a.title = safeUrl; // Show full URL on hover
                        left.appendChild(a);

                        const btnGroup = document.createElement('div');
                        btnGroup.className = 'd-flex align-items-center gap-1 ms-auto btn-hover-only';

                        const makeBtn = (icon, title, onClick) => {
                            const btn = document.createElement('button');
                            btn.type = 'button';
                            btn.className = 'btn btn-sm btn-link p-0';
                            btn.title = title;
                            btn.style.color = '#444444';
                            btn.innerHTML = `<span class="material-symbols-outlined" style="font-size:18px;">${icon}</span>`;
                            btn.addEventListener('click', onClick);
                            return btn;
                        };

                        const copyBtn = makeBtn('content_copy', 'Copy URL', function (ev) {
                            ev.preventDefault(); ev.stopPropagation();
                            navigator.clipboard?.writeText(safeUrl)
                                .then(() => showFloatingAlert?.('URL copied to clipboard', 'success'))
                                .catch(() => {
                                    const ta = document.createElement('textarea');
                                    ta.value = safeUrl;
                                    ta.style.position = 'fixed';
                                    ta.style.left = '-9999px';
                                    document.body.appendChild(ta);
                                    ta.select();
                                    try {
                                        document.execCommand('copy');
                                        showFloatingAlert?.('URL copied to clipboard', 'success');
                                    } catch (_) {
                                        showFloatingAlert?.('Failed to copy', 'warning');
                                    }
                                    document.body.removeChild(ta);
                                });
                        });

                        const openBtn = makeBtn('open_in_new', 'Open URL', function (ev) {
                            ev.preventDefault(); ev.stopPropagation();
                            window.open(safeUrl, '_blank');
                        });

                        btnGroup.append(copyBtn, openBtn);
                        row.append(left, btnGroup);
                        listEl.appendChild(row);
                    });
                }
            },
            error: function () {
                showFloatingAlert?.('Failed to load reference URLs.', 'danger');
            }
        });
    } catch (_) { }
}

// function updateViewMoreButton() {
//     if ($("#view-more-wrapper").length === 0) {
//         const wrapper = $(`
//             <div id="view-more-wrapper" class="text-center">
//                 <button id="view-more-btn" class="btn btn-submit-black">View More</button>
//             </div>
//         `);
//         $("#task-legend").append(wrapper);
//         $("#view-more-btn").on("click", function () {
//             currentMaxLevel += 7;
//             $.ajax({
//                 url: `${appUrl}/projects/${projectId}/tasks/tree`,
//                 type: "GET",
//                 data: { pageTab: currentMaxLevel },
//                 dataType: "json",
//             })
//             .done(function (response) {
//                 if (response.status === "success" && response.data) {
//                     allTasks = response.data;
//                     renderTaskList(allTasks);
//                     if (response.has_more) {
//                         $("#view-more-wrapper").show();
//                     } else {
//                         $("#view-more-wrapper").hide();
//                     }
//                 }
//             })
//             .fail(function () {
//                 // Optionally handle error
//             });
//         });
//     }
//     $("#view-more-btn").show();
// }

function buildTaskTree(tasks) {
    const map = {},
        roots = [];
    tasks.forEach((task) => {
        map[task.id] = { ...task, children: [] };
    });
    tasks.forEach((task) => {
        if (
            task.parent_id &&
            task.parent_id != task.id &&
            map[task.parent_id]
        ) {
            map[task.parent_id].children.push(map[task.id]);
        } else {
            roots.push(map[task.id]);
        }
    });
    return roots;
}

function normalizeStatus(status) {
    const statusMap = {
        "not started": "not-started",
        "in progress": "in-progress",
        "not-started": "not-started",
        "in-progress": "in-progress",
        "finished": "finished",
    };
    return (
        statusMap[status.toLowerCase()] ||
        status.toLowerCase().replace(/\s+/g, "-")
    );
}

function renderTaskNode(task, $template) {
    const normalizedStatus = normalizeStatus(task.status);
    let $item = $template.clone().removeClass("d-none").removeAttr("id");
    if (task?.id != null) $item.attr("data-task-id", String(task.id));

    let visual = "not-started";
    const s = String(task.status || "").toLowerCase();
    if (["new_request", "new request", "new-request"].includes(s)) visual = "not-started";
    else if (["in_progress", "in progress", "in-progress"].includes(s)) visual = "in-progress";
    else if (["finished", "finish"].includes(s)) visual = "finished";
    else if (["complete", "completed"].includes(s)) visual = "complete";
    else if (["rejected"].includes(s)) visual = "rejected";
    else visual = normalizedStatus || "not-started";

    if (task.due_date && !["complete", "rejected", "finished"].includes(visual)) {
        const due = new Date(task.due_date), today = new Date();
        due.setHours(0, 0, 0, 0); today.setHours(0, 0, 0, 0);
        if (!isNaN(due.getTime()) && today > due) visual = "late";
    }

    const $card = $item.find(".task-box");
    if (task?.id != null) {
        $card.attr("data-task-id", String(task.id));
        $card.attr("id", "task-node-" + String(task.id));
        $card.attr("draggable", true).addClass("draggable-task");
        if (!$card.attr("title")) $card.attr("title", "Drag this task and drop onto another task to re-parent");
    }

    $card.css("position", "relative").css("overflow", "visible").css("z-index", 10);

    if ($card.find(".plumb-handle").length === 0) {
        const $handle = $('<div class="plumb-handle d-none" title="Drag a line to add a parent" style="position:absolute;top:15px;right:-5px;width:14px;height:14px;border-radius:50%;background:#D2D3E1;cursor:crosshair;opacity:0.9;box-shadow:0 0 0 1px #fff;z-index:10;pointer-events:auto;"></div>');
        $handle.attr("draggable", false);
        $handle.on("pointerdown mousedown touchstart", () => $card.attr("draggable", false));
        $handle.on("pointerup mouseup touchend touchcancel", () => $card.attr("draggable", true));
        $card.append($handle);
    }

    if ($card.find(".task-more-btn").length === 0) {
        let currentEmployeeId = null;
        const empInput =
            document.querySelector('input[name="employee_id"]') ||
            document.querySelector("#currentEmployee") ||
            document.querySelector("[data-employee-id]");
        if (empInput) {
            currentEmployeeId =
                empInput.value ||
                empInput.getAttribute("data-employee-id") ||
                (empInput.dataset && empInput.dataset.employeeId) ||
                null;
        }

    
        let isPrivileged = false;
        if (currentEmployeeId) {
            const isPIC = task.pic?.id && String(currentEmployeeId) === String(task.pic.id);
            const isAuthor = task.project?.authors?.some((a) => String(a.id) === String(currentEmployeeId));
            // Note: intentionally do NOT grant privileges to co-authors here
            isPrivileged = !!(isPIC || isAuthor);
        }
        // Only show the menu button when viewer is privileged
        const showMenu = !!isPrivileged;

        try {
            if (["complete", "finished"].includes(visual)) {
                if ($card.find('.playlist_add_check').length === 0) {
                    const $icon = $(`
                        <span class="material-symbols-outlined task-icon playlist_add_check" 
                            data-task-id="${task.id}" 
                            role="button" 
                            tabindex="0" 
                            aria-label="Lihat task selesai" 
                            style="font-size:16px; color:#828282; position:absolute; top:8px; right:8px; cursor:pointer; z-index:2000;">
                            playlist_add_check
                        </span>
                    `);
                    $card.append($icon);
                }
            }
        } catch (_) {}

        if (showMenu) {
            const taskId = task?.id ? String(task.id) : null;
            const $moreBtn = $('<div class="task-more-btn d-none" title="More actions" style="position:absolute;top:-7px;right:-7px;width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,0.15);display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:9999;user-select:none;border:1px solid rgba(0,0,0,0.08);pointer-events:auto;"><span style="font-size:12px;line-height:1;color:#555;">&#8942;</span></div>');
            if (taskId) $moreBtn.attr("data-task-id", taskId);
            if (task.status) $moreBtn.attr("data-task-status", task.status);
            $moreBtn.attr("data-privileged", isPrivileged ? "1" : "0");
            $card.append($moreBtn);

            const isMobile =
                (window.matchMedia && window.matchMedia("(max-width: 1024px)").matches) ||
                window.innerWidth <= 1024 ||
                /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            if (isMobile) $moreBtn.removeClass("d-none");
        }
    }

    $card.hover(
        function () {
            $(this).find(".plumb-handle, .task-more-btn").removeClass("d-none");
        },
        function () {
            $(this).find(".plumb-handle, .task-more-btn").addClass("d-none");
        }
    );

    if (visual === "complete") $card.css("background-color", "#B2EECD");
    else if (visual === "in-progress" || visual === "rejected") $card.css("background-color", "#F5EFCE");
    else if (visual === "finished") $card.css("background-color", "#A5C6F1");
    else if (visual === "late") $card.css("background-color", "#EBA5A5");
    else $card.css("background-color", "#DDE4E8");

    if (visual === "rejected") {
        const $badge = $('<div class="rejected-badge" style="position:absolute;top:-10px;left:0;background:#dc3545;color:#fff;font-size:8px;padding:2px 6px;border-radius:10px;box-shadow:0 1px 3px rgba(0,0,0,0.2);z-index:999;">REJECTED</div>');
        $card.prepend($badge);
    }

    $item.find(".task-name").text(task.title);
    const startText = task.start_date ? formatDateENMediumDayMonth(task.start_date) : "";
    const dueText = task.due_date ? formatDateENMediumDayMonth(task.due_date) : "";
    $item.find(".task-date").text(startText && dueText ? `${startText} - ${dueText}` : startText || dueText);

    if (task.children && task.children.length > 0) {
        const $branch = $('<div class="task-branch"></div>');
        $branch.append($item);
        const $childGroup = $('<div class="child-group"></div>').css({
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            position: "relative",
            overflow: "visible",
        });
        renderChildGroups(task, $childGroup, $template);
        $branch.append($childGroup);
        return $branch;
    }
    return $item;
}

function renderTaskList(data) {
    const $tree = $("#task-tree");
    $tree.empty();
    try {
        $tree.css({
            overflow: "visible",
            position: function (i, v) {
                return v || "relative";
            },
        });
    } catch (_) {}
    if (!data || data.length === 0) return;

    const treeData = buildTaskTree(data);
    const $rootCol = $('<div class="root-column"></div>');
    try {
        $rootCol.css({ overflow: "visible", position: "relative" });
    } catch (_) {}
    $tree.append($rootCol);
    treeData.forEach((root) => {
        $rootCol.append(renderTaskNode(root, $("#task-template")));
    });

    if (!window.USE_PLUMB_ONLY) {
        setTimeout(adjustConnectors, 40);
        setTimeout(drawSvgConnectors, 60);
    }
    try {
        if (typeof window.initTaskPlumb === "function") {
            window.initTaskPlumb(allTasks || data || []);
        }
    } catch (_) {}
}

function adjustConnectors() {
    if (window.USE_PLUMB_ONLY) return;
    try {
        $("#task-tree .task-branch").each(function () {
            const $branch = $(this);
            const $childGroup = $branch.children(".child-group").first();
            if (!$childGroup.length) return;
            const $vertical = $childGroup
                .children(".connector-vertical")
                .first();
            if (!$vertical.length) return;
            const childCenters = [];
            $childGroup.children().each(function () {
                const $item = $(this);
                const $box = $item.find(".task-box").first();
                if (!$box.length) return;
                const relTop =
                    $box.offset().top -
                    $childGroup.offset().top +
                    $box.outerHeight() / 2;
                childCenters.push(relTop);
            });
            if (childCenters.length === 0) return;
            const minC = Math.min.apply(null, childCenters);
            const maxC = Math.max.apply(null, childCenters);
            const top = Math.floor(minC);
            const height = Math.ceil(maxC - minC);
            $vertical.css({
                top: top + "px",
                height: Math.max(2, height) + "px",
            });
            const verticalMid = minC + (maxC - minC) / 2;
            const $connector = $branch
                .children(".connector-horizontal")
                .first();
            if ($connector.length) {
                const verticalLeft =
                    $childGroup.offset().left +
                    parseFloat($vertical.css("left") || 0);
                const parentBox = $branch
                    .children(".task-item")
                    .first()
                    .find(".task-box")
                    .first();
                if (parentBox.length) {
                    const parentRight =
                        parentBox.offset().left + parentBox.outerWidth();
                    const childGroupPaddingLeft = parseFloat(
                        $childGroup.css("padding-left") || 0
                    );
                    let desiredWidth = Math.round(
                        verticalLeft + childGroupPaddingLeft - parentRight
                    );
                    if (desiredWidth < 10) desiredWidth = 10;
                    $connector.css({ width: desiredWidth + "px" });
                    const branchTop = $branch.offset().top;
                    const connTop = Math.round(
                        verticalMid +
                            $childGroup.offset().top -
                            branchTop -
                            $connector.outerHeight() / 2
                    );
                    $connector.css({ marginTop: connTop + "px" });
                }
            }
            $childGroup.children(".task-item, .child-group").each(function () {
                const $item = $(this).hasClass("child-group")
                    ? $(this).children(".task-item").first()
                    : $(this);
                const $box = $item.find(".task-box").first();
                if (!$box.length) return;

                const center =
                    $box.offset().top -
                    $childGroup.offset().top +
                    $box.outerHeight() / 2;

                let $stub;
                if ($(this).hasClass("child-group")) {
                    $stub = $(this).children(".child-connector").first();
                } else {
                    $stub = $(this).children(".child-connector").first();
                }
                if ($stub.length) {
                    const stubTop = Math.round(
                        center - $stub.outerHeight() / 2
                    );
                    $stub.css({ marginTop: stubTop + "px" });
                }
            });
        });
    } catch (e) {}
}

$(window).on("resize", function () {
    if (!window.USE_PLUMB_ONLY) setTimeout(adjustConnectors, 60);
});

$(document).on('click', '.playlist_add_check', function () {
    const taskId = $(this).data('task-id');

    $.ajax({
        url: appUrl + "/task/" + taskId,
        type: "GET",
        dataType: "json",
        success: function(res) {
            const task = res && (res.data || res);
            if (!task) return;

            try {
                const $avatarContainer = $('#completed_task_image');
                if ($avatarContainer.length) {
                    const avatarHtml = getAvatarHTML(task, 34);
                    const $parent = $avatarContainer.parent();
                    if ($parent.length) {
                        $avatarContainer.remove();
                        const $wrapper = $(avatarHtml);
                        $wrapper.addClass('me-2');
                        $parent.prepend($wrapper);
                    } else {
                        $avatarContainer.attr('src', task.image || task.project_image || task.image_url || '/img/default.png');
                    }
                }
            } catch(_) {}

            $('#completed_task_title').text(task.title || '-');
            $('#completed_project_title').text(task.project_title || (task.project && task.project.title) || '-');
            $('#completed_task_note').html(task.complete_note || '<em>No note</em>');
            $('#completed_priority').text(task.priority || '-');
            $('#completed_date').text(formatDateENMedium(task.complete_date) || '-');

            const $urlsContainer = $("#completed_task_urls").empty();
            const urls = task.complete_urls || task.finished_urls || [];

            if ($.isArray(urls) && urls.length) {
                urls.forEach((u) => {
                    const absUrl = u.startsWith("http")
                        ? u
                        : `${appUrl.replace(/\/+$/, '')}/${u.replace(/^\/+/, '')}`;
                    const linkName = absUrl.split('/').pop() || absUrl;

                    const linkHtml = `
                    <div class="d-flex align-items-center p-2 rounded bg-light mb-2" style="font-size:12px;">
                        <a href="${absUrl}" target="_blank" class="text-decoration-none"
                        style="
                            color:#444;
                            white-space: nowrap;
                            overflow: hidden;
                            text-overflow: ellipsis;
                            display: block;
                            width: 100%;
                        ">
                        ${absUrl}
                        </a>
                    </div>`;

                    $urlsContainer.append(linkHtml);
                });
            } else {
                $urlsContainer.html('<div class="text-center text-muted small"><em>-</em></div>');
            }

            const $filesContainer = $("#completed_task_files").empty();
            const files = task.complete_files || task.finished_files || [];

            if ($.isArray(files) && files.length) {
                files.forEach((f, idx) => {
                    let raw = f.url || f;
                    let absUrl = "";
                    const isAbs = raw.startsWith("http://") || raw.startsWith("https://");
                    const isRefPath = raw.startsWith("/file/") || raw.startsWith("file/");
                    if (isAbs) absUrl = raw;
                    else if (isRefPath) absUrl = appUrl.replace(/\/+$/, '') + '/' + raw.replace(/^\/+/, '');
                    else absUrl = appUrl.replace(/\/+$/, '') + '/file/task_complete_files/' + raw.replace(/^\/+/, '');

                    const extMatch = raw.match(/\.[^/.]+$/);
                    const ext = extMatch ? extMatch[0] : "";
                    const fileName = files;

                    const lower = absUrl.toLowerCase();
                    const isPreviewable =
                        lower.endsWith(".pdf") ||
                        lower.endsWith(".jpg") ||
                        lower.endsWith(".jpeg") ||
                        lower.endsWith(".png");

                    const fileLinkHtml = `
                        <div class="d-flex align-items-center p-2 rounded bg-light mb-2" style="font-size:12px;">
                            <a href="${absUrl}" target="_blank" ${!isPreviewable ? `download="${fileName}"` : ''} 
                            class="text-decoration-none flex-grow-1" 
                            style="color:#444; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display:block; width:100%;">
                            ${fileName}
                            </a>
                        </div>`;
                    $filesContainer.append(fileLinkHtml);
                });
            } else {
                $filesContainer.html('<div class="text-center text-muted small"><em>-</em></div>');
            }

            const modal = new bootstrap.Modal(document.getElementById('completedModal'));
            modal.show();
        }
    });
});

$(document).on("click", "#taskDetailModal .playlist-add-check", function () {
    const task = this._task;
    if (!task) return console.warn("Task not found");

    // Avatar / gambar
    try {
        const $avatarContainer = $('#completed_task_image');
        if ($avatarContainer.length) {
            const avatarHtml = getAvatarHTML(task, 34);
            const $parent = $avatarContainer.parent();
            if ($parent.length) {
                $avatarContainer.remove();
                const $wrapper = $(avatarHtml);
                $wrapper.addClass('me-2');
                $parent.prepend($wrapper);
            } else {
                $avatarContainer.attr('src', task.image || task.project_image || task.image_url || '/img/default.png');
            }
        }
    } catch(_) {}
    
    $('#completed_task_title').text(task.title || '-');
    $('#completed_project_title').text(task.project_title || (task.project && task.project.title) || '-');
    $('#completed_task_note').html(task.complete_note || '<em>No note</em>');
    $('#completed_priority').text(task.priority || '-');
    $('#completed_date').text(task.complete_date || '-');

    // Completed URLs
    const $urls = $('#completed_task_urls').empty();
    if (Array.isArray(task.complete_urls) && task.complete_urls.length) {
        task.complete_urls.forEach((u, idx) => {
            const href = u.startsWith('http') ? u : '/' + String(u).replace(/^\/+/, '');
            
            const $item = $('<div>').addClass('d-flex align-items-center gap-2 p-2 rounded bg-light selected-task mb-2');

            // link
            const $link = $('<a>', {
                href,
                target: '_blank',
                class: 'flex-grow-1 text-decoration-none text-truncate',
                text: 'COMPLETED_LINK_' + (idx + 1)
            }).css({ fontSize: '10px', color: '#444444' });
            $item.append($link);

            $urls.append($item);
        });
    } else $urls.html('<em>-</em>');

    // Completed Files
    const $files = $('#completed_task_files').empty();
    if (Array.isArray(task.complete_files) && task.complete_files.length) {
        task.complete_files.forEach((f, idx) => {
            let fileUrl = f && (f.url || f) || '';
            const lower = fileUrl.toLowerCase();

            const isAbs = fileUrl.startsWith('http://') || fileUrl.startsWith('https://');
            const isRefPath = fileUrl.startsWith('/file/task_complete_files/') || fileUrl.startsWith('file/task_complete_files/') ||
                            fileUrl.startsWith('/file/') || fileUrl.startsWith('file/');

            if (!isAbs && !isRefPath) fileUrl = appUrl + '/file/task_complete_files/' + fileUrl;
            else if (!isAbs && fileUrl.startsWith('/')) fileUrl = appUrl + fileUrl;

            const ext = (fileUrl.split('.').pop() || '').toLowerCase();
            const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(ext);

            const $item = $('<div>').addClass('d-flex align-items-center gap-2 p-2 rounded bg-light selected-task mb-2');

            if (isImage) {
                const $img = $('<img>', { src: fileUrl, width: 28, height: 28, alt: fileUrl });
                $img.css({ objectFit: 'cover', borderRadius: '50%' });
                $item.append($img);
            }

            const $link = $('<a>')
                .attr({
                    href: fileUrl,
                    target: '_blank',
                    class: 'text-decoration-none flex-grow-1 text-truncate'
                })
                .css({ fontSize: '10px', color: '#444444' })
                .text(`COMPLETED_FILE_${idx + 1}`);

            $item.append($link);
            $files.append($item);
        });
    } else {
        $files.html('<em>-</em>');
    }

});

function ensureSvgOverlay() {
    if (window.USE_PLUMB_ONLY) {
        return $("#task-tree-svg");
    }
    let $svg = $("#task-tree-svg");
    if ($svg.length === 0) {
        $svg = $(
            "<svg id='task-tree-svg' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'></svg>"
        );
        $("#task-tree").append($svg);
    }
    const $tree = $("#task-tree");
    if ($tree.length) {
        const w = $tree.prop("scrollWidth");
        const h = $tree.prop("scrollHeight");
        $svg.attr("width", w)
            .attr("height", h)
            .attr("viewBox", `0 0 ${w} ${h}`);
        $svg.css({
            left: 0,
            top: 0,
            width: (w || 0) + "px",
            height: (h || 0) + "px",
        });
    }
    $svg.css({ pointerEvents: "none" });
    return $svg;
}

function createSvgEl(tagName, attrs) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", tagName);
    const $el = $(el);
    if (attrs) {
        $el.attr(attrs);
    }
    return $el;
}

function drawSvgConnectors() {
    if (window.USE_PLUMB_ONLY) return;
    try {
        const $svg = ensureSvgOverlay();
        $svg.empty();
        const $tree = $("#task-tree");
        const treeEl = $tree[0];
        const treeRect = treeEl
            ? treeEl.getBoundingClientRect()
            : { left: 0, top: 0 };
        const treeScrollLeft = $tree.scrollLeft();
        const treeScrollTop = $tree.scrollTop();
        const treeW = $tree.prop("scrollWidth") || $tree.outerWidth();
        const treeH = $tree.prop("scrollHeight") || $tree.outerHeight();
        $svg.attr("width", treeW)
            .attr("height", treeH)
            .attr("viewBox", `0 0 ${treeW} ${treeH}`);
        $("#task-tree .task-branch").each(function () {
            const $branch = $(this);
            const $parentBox = $branch
                .children(".task-item")
                .first()
                .find(".task-box")
                .first();
            const $childGroup = $branch.children(".child-group").first();
            if (!$parentBox.length || !$childGroup.length) return;
            const childCenters = [];
            $childGroup.children().each(function () {
                const $childEl = $(this);
                const $b = $childEl.find(".task-box").first();
                if (!$b.length) return;
                const bRect = $b[0].getBoundingClientRect();
                const relX = Math.round(
                    bRect.left - treeRect.left + treeScrollLeft
                );
                const relY = Math.round(
                    bRect.top -
                        treeRect.top +
                        treeScrollTop +
                        $b.outerHeight() / 2
                );
                childCenters.push({ el: $b, x: relX, y: relY });
            });
            if (childCenters.length === 0) return;
            const pRect = $parentBox[0].getBoundingClientRect();
            const pX = Math.round(
                pRect.left -
                    treeRect.left +
                    treeScrollLeft +
                    $parentBox.outerWidth()
            );
            const pY = Math.round(
                pRect.top -
                    treeRect.top +
                    treeScrollTop +
                    $parentBox.outerHeight() / 2
            );
            const verticalX = Math.round(
                (pX + (childCenters[0] ? childCenters[0].x : pX)) / 2
            );
            const ys = childCenters.map((c) => c.y).sort((a, b) => a - b);
            const vTop = ys[0];
            const vBottom = ys[ys.length - 1];
            const $vLine = createSvgEl("line", {
                x1: verticalX,
                y1: vTop,
                x2: verticalX,
                y2: vBottom,
                stroke: "#D2D3E1",
                "stroke-width": "2",
                "stroke-linecap": "butt",
                "stroke-linejoin": "miter",
            });
            $svg.append($vLine);
            childCenters.forEach(function (ch) {
                const $stub = createSvgEl("line", {
                    x1: verticalX,
                    y1: ch.y,
                    x2: ch.x,
                    y2: ch.y,
                    stroke: "#D2D3E1",
                    "stroke-width": "2",
                    "stroke-linecap": "butt",
                });
                $svg.append($stub);
            });
            const $parentStub = createSvgEl("line", {
                x1: pX,
                y1: pY,
                x2: verticalX,
                y2: pY,
                stroke: "#D2D3E1",
                "stroke-width": "2",
                "stroke-linecap": "butt",
            });
            $svg.append($parentStub);
        });
    } catch (e) {}
}

if (!window.USE_PLUMB_ONLY) {
    setTimeout(drawSvgConnectors, 50);
    $(window).on("resize scroll", function () {
        setTimeout(drawSvgConnectors, 80);
    });
}

function getTaskByProject(projectId, bustCache) {
    fetchProjectDueDate(projectId);
    $("#task-loading").removeClass("d-none");
    $("#task-error").addClass("d-none");
    $("#task-tree").empty();

    var ajaxData = { pageTab: currentMaxLevel };
    if (bustCache) {
        ajaxData._t = Date.now(); // Add timestamp to prevent caching
    }

    return $.ajax({
        url: `${appUrl}/projects/${projectId}/tasks/tree`,
        type: "GET",
        data: ajaxData,
        dataType: "json",
        cache: false, // Disable jQuery cache
    })
        .done(function (response) {
            $("#task-loading").addClass("d-none");
            if (
                response.status !== "success" ||
                !response.data ||
                response.data.length === 0
            ) {
                $("#task-tree").empty();
                return;
            }
            allTasks = response.data;
            renderTaskList(allTasks);
            // if (response.has_more) {
            //     updateViewMoreButton();
            // } else {
            //     $("#view-more-wrapper").hide();
            // }
        })
        .fail(function () {
            $("#task-loading").addClass("d-none");
            $("#task-error").removeClass("d-none");
            $("#task-tree").empty();
        });
}

if (projectId) getTaskByProject(projectId);
(function setupTreeResizeObservers() {
    try {
        var $tree = $("#task-tree");
        if (!$tree.length) return;
        var scheduleRecalc = (function () {
            var t = null;
            var inner = function () {
                try {
                    if (!window.USE_PLUMB_ONLY) {
                        adjustConnectors();
                        drawSvgConnectors();
                    }
                } catch (_) {}
            };
            var debounced = function (delay) {
                clearTimeout(t);
                t = setTimeout(inner, delay || 40);
            };
            window.__taskTreeScheduleRecalc = debounced;
            return debounced;
        })();
        if (typeof window.ResizeObserver !== "undefined") {
            var ro = new ResizeObserver(function () {
                if (!window.USE_PLUMB_ONLY) scheduleRecalc();
            });
            ro.observe($tree[0]);
            var $parent = $tree.closest(".structure-detail-content");
            if (!$parent.length) $parent = $tree.parent();
            if ($parent.length && $parent[0] !== $tree[0])
                ro.observe($parent[0]);
            window.__taskTreeResizeObserver = ro;
        } else {
            var lastW = $tree.width(),
                lastH = $tree.height();
            var $parent2 = $tree.closest(".structure-detail-content");
            if (!$parent2.length) $parent2 = $tree.parent();
            var lastPW = $parent2.length ? $parent2.width() : null;
            window.__taskTreeInterval = setInterval(function () {
                try {
                    var w = $tree.width(),
                        h = $tree.height(),
                        pW = $parent2.length ? $parent2.width() : null;
                    if (w !== lastW || h !== lastH || pW !== lastPW) {
                        lastW = w;
                        lastH = h;
                        lastPW = pW;
                        if (!window.USE_PLUMB_ONLY) scheduleRecalc(20);
                    }
                } catch (_) {}
            }, 220);
        }
        var mo = new MutationObserver(function () {
            if (!window.USE_PLUMB_ONLY) scheduleRecalc(60);
        });
        mo.observe(document.body, {
            attributes: true,
            childList: true,
            subtree: false,
        });
        window.__taskTreeMutationObserver = mo;
    } catch (_) {}
})();

$("#fullscreen-tree-btn").on("click", function () {
    const $treeContent = $(".structure-detail-content");
    const $icon = $(this).find("span.material-symbols-outlined");
    if ($treeContent.hasClass("fullscreen")) {
        $treeContent.removeClass("fullscreen");
        $icon.text("fullscreen");
    } else {
        $treeContent.addClass("fullscreen");
        $icon.text("fullscreen_exit");
    }
});

(function setupTaskTreeDnD() {
    if (window.__taskTreeDndBound) return; // bind once
    window.__taskTreeDndBound = true;

    function taskMap() {
        var map = {};
        try {
            (allTasks || []).forEach(function (t) {
                map[String(t.id)] = t;
            });
        } catch (_) {}
        return map;
    }

    function isDescendant(sourceId, targetId) {
        try {
            if (sourceId == null || targetId == null) return false;
            var s = String(sourceId);
            var t = String(targetId);
            if (s === t) return true;
            var map = taskMap();
            var seen = 0;
            var MAX_HOPS = 2000;
            var cur = map[t];
            while (cur && cur.parent_id != null && seen < MAX_HOPS) {
                var p = String(cur.parent_id);
                if (p === s) return true;
                cur = map[p];
                seen++;
            }
        } catch (_) {}
        return false;
    }

    function clearDropVisual($el) {
        try {
            $el.removeClass("drop-ok drop-denied dragging");
            $el.css({ outline: "" });
        } catch (_) {}
    }

    function clearEmptySpaceDropVisuals() {
        try {
            $("#task-tree").removeClass("empty-space-drop-ok");
            $("#task-tree").css({ outline: "", backgroundColor: "" });
        } catch (_) {}
    }

    function canMoveToEmptySpace(taskId) {
        // Allow tasks without parent_id or any task to be moved to empty space
        try {
            var map = taskMap();
            var task = map[String(taskId)];
            return task != null; // Any task can be moved to empty space
        } catch (_) {
            return false;
        }
    }

    $(document).on("dragstart", "#task-tree .task-box", function (e) {
        try {
            // If starting drag from plumb handle, ignore DnD
            if ($(e.target).closest(".plumb-handle").length) {
                e.preventDefault();
                return;
            }
            var id = $(this).attr("data-task-id");
            window.__dragTaskId = id != null ? String(id) : null;
            if (e.originalEvent && e.originalEvent.dataTransfer) {
                e.originalEvent.dataTransfer.setData(
                    "text/plain",
                    window.__dragTaskId || ""
                );
                e.originalEvent.dataTransfer.effectAllowed = "move";
            }
            $(this).addClass("dragging");
        } catch (_) {}
    });

    $(document).on("dragend", "#task-tree .task-box", function () {
        clearDropVisual($(this));
        clearEmptySpaceDropVisuals();
        window.__dragTaskId = null;
    });

    $(document).on("dragover dragenter", "#task-tree .task-box", function (e) {
        try {
            e.preventDefault();
            var $target = $(this);
            var targetId = $target.attr("data-task-id");
            var draggedId = window.__dragTaskId;
            var denied =
                !draggedId ||
                String(draggedId) === String(targetId) ||
                isDescendant(draggedId, targetId);
            if (e.originalEvent && e.originalEvent.dataTransfer) {
                e.originalEvent.dataTransfer.dropEffect = denied
                    ? "none"
                    : "move";
            }
            if (denied) {
                $target.addClass("drop-denied");
                $target.removeClass("drop-ok");
                $target.css({ outline: "2px dashed #d66" });
            } else {
                $target.addClass("drop-ok");
                $target.removeClass("drop-denied");
                $target.css({ outline: "2px dashed #2a7" });
            }
        } catch (_) {}
    });

    $(document).on("dragleave", "#task-tree .task-box", function () {
        clearDropVisual($(this));
    });

    // Empty space drag and drop handlers
    $(document).on("dragover dragenter", "#task-tree", function (e) {
        try {
            // Only handle empty space drops, not when over task boxes
            var $target = $(e.target);
            if ($target.closest(".task-box").length > 0) {
                return;
            }

            e.preventDefault();
            var draggedId = window.__dragTaskId;

            if (!draggedId || !canMoveToEmptySpace(draggedId)) {
                return;
            }

            if (e.originalEvent && e.originalEvent.dataTransfer) {
                e.originalEvent.dataTransfer.dropEffect = "move";
            }
        } catch (_) {}
    });

    $(document).on("dragleave", "#task-tree", function (e) {
        try {
            // Only clear if we're leaving the task-tree completely
            var relatedTarget = e.originalEvent
                ? e.originalEvent.relatedTarget
                : null;
            if (
                relatedTarget &&
                $(relatedTarget).closest("#task-tree").length > 0
            ) {
                return;
            }
            clearEmptySpaceDropVisuals();
        } catch (_) {}
    });

    $(document).on("drop", "#task-tree", function (e) {
        try {
            // Only handle empty space drops, not when over task boxes
            var $target = $(e.target);
            if ($target.closest(".task-box").length > 0) {
                return;
            }

            e.preventDefault();

            var dragData = null;
            try {
                if (e.originalEvent && e.originalEvent.dataTransfer) {
                    dragData =
                        e.originalEvent.dataTransfer.getData("text/plain");
                }
            } catch (_) {}

            var draggedId = dragData || window.__dragTaskId;

            if (!draggedId || !canMoveToEmptySpace(draggedId)) {
                clearEmptySpaceDropVisuals();
                return;
            }

            // Move task to empty space (set parent_id to null)
            $.ajax({
                url: appUrl + "/task/" + encodeURIComponent(String(draggedId)),
                type: "PUT",
                data: {
                    parent_id: null,
                },
                dataType: "json",
            })
                .done(function () {
                    try {
                        if (
                            typeof window.refreshTaskTreePartial === "function"
                        ) {
                            window.refreshTaskTreePartial();
                        } else {
                            // Fallback to local render if global not available
                            var map = taskMap();
                            var dragged = map[String(draggedId)];
                            if (dragged) dragged.parent_id = null;
                            renderTaskList(allTasks);
                        }
                        if (typeof window.showFloatingAlert === "function") {
                            window.showFloatingAlert(
                                "Task berhasil dikeluarkan dari parent",
                                "success",
                                2000
                            );
                        }
                    } catch (_) {}
                })
                .fail(function (xhr) {
                    try {
                        console.error(
                            "Failed to move task to free position",
                            xhr && xhr.responseText
                        );
                        if (typeof window.showFloatingAlert === "function") {
                            window.showFloatingAlert(
                                "Gagal memindahkan task. Coba lagi.",
                                "warning",
                                3000
                            );
                        } else {
                            alert("Gagal memindahkan task. Coba lagi.");
                        }
                    } catch (_) {}
                })
                .always(function () {
                    clearEmptySpaceDropVisuals();
                });
        } catch (_) {
            clearEmptySpaceDropVisuals();
        }
    });

    $(document).on("drop", "#task-tree .task-box", function (e) {
        try {
            e.preventDefault();
        } catch (_) {}
        var $target = $(this);
        try {
            var targetId = $target.attr("data-task-id");
            var dragData = null;
            try {
                if (e.originalEvent && e.originalEvent.dataTransfer) {
                    dragData =
                        e.originalEvent.dataTransfer.getData("text/plain");
                }
            } catch (_) {}
            var draggedId = dragData || window.__dragTaskId;
            if (!draggedId || !targetId) {
                clearDropVisual($target);
                return;
            }
            if (
                String(draggedId) === String(targetId) ||
                isDescendant(draggedId, targetId)
            ) {
                clearDropVisual($target);
                return; // invalid move
            }

            var map = taskMap();
            var dragged = map[String(draggedId)];
            if (
                dragged &&
                String(dragged.parent_id || "") === String(targetId)
            ) {
                clearDropVisual($target);
                return;
            }

            $target.css({ outline: "2px solid #2a7" });

            // Moving task under another task (making it a child)

            $.ajax({
                url: appUrl + "/task/" + encodeURIComponent(String(draggedId)),
                type: "PUT",
                data: {
                    parent_id: String(targetId),
                },
                dataType: "json",
            })
                .done(function () {
                    try {
                        if (
                            typeof window.refreshTaskTreePartial === "function"
                        ) {
                            window.refreshTaskTreePartial();
                        } else {
                            if (dragged) dragged.parent_id = targetId;
                            try {
                                if (typeof window.initTaskPlumb === "function")
                                    window.initTaskPlumb(allTasks);
                            } catch (_) {}
                        }
                    } catch (_) {}
                })
                .fail(function (xhr) {
                    try {
                        console.error(
                            "Failed to move task",
                            xhr && xhr.responseText
                        );
                        alert("Gagal memindahkan task. Coba lagi.");
                    } catch (_) {}
                })
                .always(function () {
                    clearDropVisual($target);
                });
        } catch (_) {
            clearDropVisual($target);
        }
    });

    (function setupTouchDnd() {
        var hasTouch =
            "ontouchstart" in window ||
            navigator.maxTouchPoints > 0 ||
            navigator.msMaxTouchPoints > 0;
        if (!hasTouch) return;

        var state = {
            dragging: false,
            draggedId: null,
            originEl: null,
            ghost: null,
            dropTarget: null,
            startX: 0,
            startY: 0,
            dx: 0,
            dy: 0,
            lastTouchX: 0,
            lastTouchY: 0,
            longPressTimer: null,
            moved: false,
        };

        function cleanupTouchDrag() {
            try {
                if (state.longPressTimer) {
                    clearTimeout(state.longPressTimer);
                    state.longPressTimer = null;
                }
                if (state.originEl) $(state.originEl).removeClass("dragging");
                if (state.dropTarget) {
                    if (state.dropTarget.isEmptySpace) {
                        clearEmptySpaceDropVisuals();
                    } else {
                        clearDropVisual($(state.dropTarget));
                    }
                }
                if (state.ghost && state.ghost.parentNode)
                    state.ghost.parentNode.removeChild(state.ghost);
            } catch (_) {}
            state.dragging = false;
            state.draggedId = null;
            state.originEl = null;
            state.ghost = null;
            state.dropTarget = null;
            state.moved = false;
        }

        function createGhostFrom(el, x, y) {
            var rect = el.getBoundingClientRect();
            var g = el.cloneNode(true);
            g.style.position = "fixed";
            g.style.left = rect.left + "px";
            g.style.top = rect.top + "px";
            g.style.width = rect.width + "px";
            g.style.height = rect.height + "px";
            g.style.pointerEvents = "none";
            g.style.opacity = "0.85";
            g.style.zIndex = 9999;
            g.style.boxShadow = "0 6px 16px rgba(0,0,0,0.15)";
            document.body.appendChild(g);
            state.dx = x - rect.left;
            state.dy = y - rect.top;
            return g;
        }

        function findDropTargetAt(x, y) {
            var hidden = false;
            if (state.ghost) {
                state.ghost.style.display = "none";
                hidden = true;
            }
            var el = document.elementFromPoint(x, y);
            if (hidden) state.ghost.style.display = "";
            if (!el) return null;

            // Check if we're over a task box
            var taskBoxCandidate =
                $(el).closest("#task-tree .task-box")[0] || null;
            if (taskBoxCandidate) return taskBoxCandidate;

            // Check if we're over empty space in task-tree
            var treeCandidate = $(el).closest("#task-tree")[0] || null;
            if (treeCandidate)
                return { isEmptySpace: true, element: treeCandidate };

            return null;
        }

        function isValidDrop(draggedId, targetEl) {
            if (!targetEl) return false;

            // Handle empty space drops
            if (targetEl.isEmptySpace) {
                return draggedId && canMoveToEmptySpace(draggedId);
            }

            // Handle task-to-task drops
            var targetId = targetEl.getAttribute("data-task-id");
            if (!draggedId || !targetId) return false;
            if (String(draggedId) === String(targetId)) return false;
            return !isDescendant(draggedId, targetId);
        }

        function onTouchMove(e) {
            if (!state.dragging) return;
            var t =
                (e.changedTouches && e.changedTouches[0]) ||
                (e.touches && e.touches[0]);
            if (!t) return;
            try {
                e.preventDefault();
            } catch (_) {}
            var x = t.clientX,
                y = t.clientY;

            // Store last touch position for coordinate calculation
            state.lastTouchX = x;
            state.lastTouchY = y;

            if (state.ghost) {
                state.ghost.style.left = Math.round(x - state.dx) + "px";
                state.ghost.style.top = Math.round(y - state.dy) + "px";
            }
            var targetEl = findDropTargetAt(x, y);
            if (state.dropTarget && state.dropTarget !== targetEl) {
                if (state.dropTarget.isEmptySpace) {
                    clearEmptySpaceDropVisuals();
                } else {
                    clearDropVisual($(state.dropTarget));
                }
            }
            state.dropTarget = targetEl;
            if (targetEl) {
                if (targetEl.isEmptySpace) {
                    // Handle empty space visual feedback (minimal)
                    if (isValidDrop(state.draggedId, targetEl)) {
                        // No visual feedback for empty space drops
                    }
                } else {
                    // Handle task box visual feedback
                    var $t = $(targetEl);
                    if (isValidDrop(state.draggedId, targetEl)) {
                        $t.addClass("drop-ok").removeClass("drop-denied");
                        $t.css({ outline: "2px dashed #007bff" });
                    } else {
                        $t.addClass("drop-denied").removeClass("drop-ok");
                        $t.css({ outline: "2px dashed #dc3545" });
                    }
                }
            }
        }

        function performDropIfValid() {
            var targetEl = state.dropTarget;
            var originEl = state.originEl;
            var draggedId = state.draggedId;
            if (!targetEl || !originEl || !draggedId) return;

            if (!isValidDrop(draggedId, targetEl)) return;

            var map = (function () {
                var m = {};
                try {
                    (allTasks || []).forEach(function (t) {
                        m[String(t.id)] = t;
                    });
                } catch (_) {}
                return m;
            })();
            var dragged = map[String(draggedId)];

            if (targetEl.isEmptySpace) {
                // Handle drop to empty space with coordinates
                var treeOffset = $("#task-tree").offset();
                var scrollLeft = $("#task-tree").scrollLeft();
                var scrollTop = $("#task-tree").scrollTop();

                // Touch: Move task to empty space (set parent_id to null)
                $.ajax({
                    url:
                        appUrl +
                        "/task/" +
                        encodeURIComponent(String(draggedId)),
                    type: "PUT",
                    data: {
                        parent_id: null,
                    },
                    dataType: "json",
                })
                    .done(function () {
                        try {
                            if (
                                typeof window.refreshTaskTreePartial ===
                                "function"
                            ) {
                                window.refreshTaskTreePartial();
                            } else {
                                if (dragged) dragged.parent_id = null;
                                renderTaskList(allTasks);
                            }
                            if (
                                typeof window.showFloatingAlert === "function"
                            ) {
                                window.showFloatingAlert(
                                    "Task berhasil dikeluarkan dari parent",
                                    "success",
                                    2000
                                );
                            }
                        } catch (_) {}
                    })
                    .fail(function (xhr) {
                        try {
                            console.error(
                                "Failed to move task to free position (touch)",
                                xhr && xhr.responseText
                            );
                            if (
                                typeof window.showFloatingAlert === "function"
                            ) {
                                window.showFloatingAlert(
                                    "Gagal memindahkan task. Coba lagi.",
                                    "warning",
                                    3000
                                );
                            } else {
                                alert("Gagal memindahkan task. Coba lagi.");
                            }
                        } catch (_) {}
                    })
                    .always(function () {
                        clearEmptySpaceDropVisuals();
                    });
            } else {
                // Handle drop to another task
                var targetId = targetEl.getAttribute("data-task-id");
                if (
                    dragged &&
                    String(dragged.parent_id || "") === String(targetId)
                ) {
                    clearDropVisual($(targetEl));
                    return;
                }

                var $target = $(targetEl);
                $target.css({ outline: "2px solid #2a7" });

                // Touch: Moving task under another task

                $.ajax({
                    url:
                        appUrl +
                        "/task/" +
                        encodeURIComponent(String(draggedId)),
                    type: "PUT",
                    data: {
                        parent_id: String(targetId),
                    },
                    dataType: "json",
                })
                    .done(function () {
                        try {
                            if (
                                typeof window.refreshTaskTreePartial ===
                                "function"
                            ) {
                                window.refreshTaskTreePartial();
                            } else {
                                if (dragged) dragged.parent_id = targetId;
                                try {
                                    if (
                                        typeof window.initTaskPlumb ===
                                        "function"
                                    )
                                        window.initTaskPlumb(allTasks);
                                } catch (_) {}
                            }
                        } catch (_) {}
                    })
                    .fail(function (xhr) {
                        try {
                            console.error(
                                "Failed to move task (touch)",
                                xhr && xhr.responseText
                            );
                            if (
                                typeof window.showFloatingAlert === "function"
                            ) {
                                window.showFloatingAlert(
                                    "Gagal memindahkan task. Coba lagi.",
                                    "warning",
                                    3000
                                );
                            } else {
                                alert("Gagal memindahkan task. Coba lagi.");
                            }
                        } catch (_) {}
                    })
                    .always(function () {
                        clearDropVisual($target);
                    });
            }
        }

        document.addEventListener("touchmove", onTouchMove, { passive: false });
        document.addEventListener(
            "touchend",
            function (e) {
                if (!state.dragging) return;
                performDropIfValid();
                cleanupTouchDrag();
            },
            { passive: false }
        );
        document.addEventListener(
            "touchcancel",
            function () {
                if (state.dragging) cleanupTouchDrag();
            },
            { passive: true }
        );

        $(document).on("touchstart", "#task-tree .task-box", function (e) {
            try {
                // Ignore long-press start if touching the plumb handle
                var target =
                    e.target || (e.originalEvent && e.originalEvent.target);
                if (target && $(target).closest(".plumb-handle").length) return;
                var t =
                    e.originalEvent &&
                    e.originalEvent.touches &&
                    e.originalEvent.touches[0];
                if (!t) return;
                state.startX = t.clientX;
                state.startY = t.clientY;
                state.moved = false;
                var el = this;
                var id = el.getAttribute("data-task-id");
                state.draggedId = id ? String(id) : null;
                state.originEl = el;

                state.longPressTimer = setTimeout(function () {
                    state.dragging = true;
                    $(el).addClass("dragging");
                    state.ghost = createGhostFrom(
                        el,
                        state.startX,
                        state.startY
                    );
                }, 350);
            } catch (_) {}
        });

        $(document).on("touchmove", "#task-tree .task-box", function (e) {
            try {
                var t =
                    e.originalEvent &&
                    e.originalEvent.touches &&
                    e.originalEvent.touches[0];
                if (!t) return;
                var dx = Math.abs(t.clientX - state.startX);
                var dy = Math.abs(t.clientY - state.startY);
                if (!state.dragging) {
                    if (dx > 10 || dy > 10) {
                        state.moved = true;
                        if (state.longPressTimer) {
                            clearTimeout(state.longPressTimer);
                            state.longPressTimer = null;
                        }
                        return;
                    }
                }
                if (state.dragging) {
                    try {
                        e.preventDefault();
                    } catch (_) {}
                }
            } catch (_) {}
        });

        $(document).on(
            "touchend touchcancel",
            "#task-tree .task-box",
            function () {
                if (!state.dragging) {
                    if (state.longPressTimer) {
                        clearTimeout(state.longPressTimer);
                        state.longPressTimer = null;
                    }
                    state.originEl = null;
                    state.draggedId = null;
                    state.moved = false;
                    return;
                }
            }
        );
    })();
})();

$(document).on("click", ".task-box, .timeline-bar", function (e) {
    // If click came from the completed icon, do not open task detail here
    if ($(e.target).closest('.playlist_add_check').length) {
        // Let the playlist_add_check delegated handler handle it
        return;
    }
    if ($(e.target).closest(".plumb-handle").length) {
        e.preventDefault();
        e.stopPropagation();
        return;
    }
    if ($(e.target).closest(".task-more-btn, .task-more-menu").length) {
        e.preventDefault();
        e.stopPropagation();
        return;
    }
    const taskId = $(this).data("task-id");
    // Now using handleTaskDetail from hub_division.js for consistent UI
    if (taskId && typeof handleTaskDetail === 'function') {
        handleTaskDetail(taskId);
    } else if (taskId) {
        console.warn('handleTaskDetail not available, falling back to old implementation');
        handleProjectTaskDetail(taskId);
    }
});

$(function () {
    $('[data-bs-toggle="tooltip"]').tooltip();
});

function handleProjectTaskDetail(taskId) {
    if (!taskId) return showAlert("Task ID is missing.", "danger");

    $.ajax({
        url: `${appUrl}/task/${taskId}`,
        type: "GET",
        dataType: "json",
        success: function (res) {
            renderProjectTaskDetail(res);
        },
        error: function (xhr, status, error) {
            console.error(
                "Failed to load task detail:",
                status,
                error,
                xhr.responseText
            );
            showAlert("Failed to load task details.", "danger");
        },
    });
}

function showAlert(msg, type) {
    try {
        showFloatingAlert(msg, type, 3000);
    } catch {
        alert(msg);
    }
}

function renderProjectTaskDetail(res) {
    const task = res?.data || res;
    if (!task || typeof task !== "object") return showAlert("Invalid task data.", "danger");

    $("#projectTaskProjectAvatar").html(getAvatarHTML(task));
    $("#projectTaskProjectTitle").text(task.project?.title || "-");
    $("#projectTaskTitle").text(task.title || "Untitled Task");
    $("#projectTaskDescription").html(task.description || "No description");
    $("#projectTaskPriority").html(formatPriority(task.priority));
    $("#projectTaskDeadline").text(formatDateENMedium(task.due_date) || "-");
    $("#projectTaskDepartment").text(task.project?.department || "-");
    $("#projectTaskDivision").text(task.project?.division || "-");
    $("#projectTaskCollaborators").html(buildCollaboratorsList(task));
    $("#projectTaskStatusChanges").html(buildStatusChangesHTML(task.status_changes || task.status_change));

    initProjectTaskDetailModal();

    const checkBtn = document.querySelector('#taskDetailModal .playlist-add-check');
    if (checkBtn) checkBtn._task = task;

    const detailEl = document.getElementById('taskDetailModal');
    if (detailEl) detailEl.dataset.taskId = String(task.id || '');

    const avatarContainer = document.getElementById('projectTaskProjectAvatar');
    const img = avatarContainer?.querySelector('img');
    if (img) {
        img.style.cursor = 'pointer';
        try { img.removeEventListener('click', img._previewHandler || function(){}); } catch(_) {}
        img._previewHandler = function(e) {
            e?.preventDefault?.();
            const src = img.getAttribute('src') || img.src;
            if (!src) return;
            if (typeof showImageInModal === 'function') {
                const parent = document.getElementById('taskDetailModal');
                if (parent?.classList.contains('show')) bootstrap.Modal.getInstance(parent)?.hide();
                showImageInModal(src);
                return;
            }
            let modalEl = document.getElementById('taskImagePreviewModal');
            if (!modalEl) {
                const tpl = document.createElement('div');
                tpl.innerHTML = `
                    <div class="modal fade" id="taskImagePreviewModal" tabindex="-1" aria-hidden="true">
                        <div class="modal-dialog modal-dialog-centered" id="taskImageDialog">
                            <div class="modal-content modal-content-custom bg-light border-0">
                                <div class="modal-body p-0 d-flex align-items-center justify-content-center" style="max-height:80vh;">
                                    <img id="taskImagePreviewModalImg" src="" style="display:block; max-width:100%; max-height:80vh; object-fit:contain;">
                                </div>
                                <div class="modal-footer modal-footer-custom border-0 justify-content-center">
                                    <button type="button" class="btn btn-custom-close" data-bs-dismiss="modal">Close</button>
                                </div>
                            </div>
                        </div>
                    </div>`;
                document.body.insertAdjacentHTML('beforeend', tpl.innerHTML);
                modalEl = document.getElementById('taskImagePreviewModal');
            }
            const imgEl = document.getElementById('taskImagePreviewModalImg');
            if (imgEl) imgEl.setAttribute('src', src);
            bootstrap.Modal.getOrCreateInstance(modalEl).show();
        };
        img.addEventListener('click', img._previewHandler);
    }

    const $checkBtn = $("#taskDetailModal .playlist-add-check").closest("button");
    const isAbleShowIcon = ["completed", "finished"]
    if (isAbleShowIcon.includes(task.status?.toLowerCase())) {
        $checkBtn.show();
    }
    else $checkBtn.hide();

    showReferenceUrlsForTask(task.id);
    showReferenceFilesForTask(task.id);
}

// Helper: fetch reference files for a given task id, populate #referenceFilesList and show the modal
function showReferenceFilesForTask(taskId) {
    if (!taskId) return;
    try {
        $.ajax({
            url: appUrl + "/task/" + encodeURIComponent(String(taskId)),
            type: "GET",
            dataType: "json",
            success: function (res) {
                const payload = res && (res.data || res);
                let referenceFiles = payload && payload.reference_files;

                if (typeof referenceFiles === "string") {
                    try {
                        referenceFiles = JSON.parse(referenceFiles);
                    } catch (e) {
                        referenceFiles = referenceFiles.includes("[")
                            ? []
                            : referenceFiles
                                  .split(",")
                                  .map((s) => s.trim())
                                  .filter(Boolean);
                    }
                }

                const referenceFilesList = document.getElementById("referenceFilesList");
                if (!referenceFilesList) return;
                referenceFilesList.innerHTML = "";
                try { referenceFilesList.dataset.taskId = String(taskId || ''); } catch(_) {}
                try { document.getElementById('referenceFilesModal').dataset.taskId = String(taskId || ''); } catch(_) {}

                if (Array.isArray(referenceFiles) && referenceFiles.length > 0) {
                    referenceFiles.forEach((fileName, idx) => {
                        if (!fileName) return;

                        let fileUrl = String(fileName || '');
                        const isAbs = fileUrl.startsWith('http://') || fileUrl.startsWith('https://');
                        const isRefPath = fileUrl.startsWith('/file/task_reference_files/') || fileUrl.startsWith('file/task_reference_files/') || fileUrl.startsWith('/file/') || fileUrl.startsWith('file/');
                        if (!isAbs && !isRefPath) fileUrl = appUrl + '/file/task_reference_files/' + fileUrl;
                        else if (!isAbs && fileUrl.startsWith('/')) fileUrl = appUrl + fileUrl;

                        const item = document.createElement('div');
                        item.className = 'd-flex align-items-center justify-content-between gap-2 p-2 rounded bg-light selected-task mb-2';

                        const lower = String(fileName || '').toLowerCase();
                        const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(lower);
                        if (isImage) {
                            const img = document.createElement('img');
                            img.src = fileUrl;
                            img.width = 28; img.height = 28;
                            img.style.objectFit = 'cover'; img.style.borderRadius = '50%';
                            img.alt = fileName;
                            item.appendChild(img);
                        }

                        const title = document.createElement('a');
                        title.className = 'flex-grow-1 text-decoration-none text-truncate';
                        title.style.fontSize = "10px";
                        title.href = fileUrl;
                        title.target = '_blank';
                        title.textContent = referenceFiles;
                        title.style.color = "#444444";
                        item.appendChild(title);

                        const dlBtn = document.createElement('button');
                        dlBtn.type = 'button';
                        dlBtn.className = 'btn btn-sm btn-link p-0 ms-2 btn-hover-only';
                        dlBtn.title = 'Download';
                        dlBtn.style.color = "#444444";
                        dlBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 18px;">download</span>';
                        dlBtn.addEventListener('click', function (ev) {
                            try {
                                ev.preventDefault(); ev.stopPropagation();
                                const a = document.createElement('a');
                                a.style.display = 'none';
                                a.href = fileUrl;
                                a.download = fileName.split('/').pop();
                                a.target = '_blank';
                                document.body.appendChild(a);
                                a.click();
                                setTimeout(() => { try { document.body.removeChild(a); } catch(_) {} }, 100);
                            } catch (e) {
                                window.open(fileUrl, '_blank');
                            }
                        });

                        item.appendChild(dlBtn);

                        referenceFilesList.appendChild(item);
                    });
                }
            },
            error: function () {
                showFloatingAlert("Failed to load reference files.", "danger", 3000);
            }
        });
    } catch (_) {}
}

function buildStatusChangesHTML(statusChanges) {
    if (!statusChanges) return "";
    const list = Array.isArray(statusChanges) ? statusChanges : [statusChanges];
    return list
        .map((sc) => {
            const lbl = sc.label || "";
            const name = sc.employee_name || "";
            if (!lbl && !name) return "";
            return `<div style="font-size:12px;margin-top:6px;color:#454545">
                        <span style="color:#797E91;">${escapeHTML(lbl)}</span>
                        <span style="margin-left:6px;color:#454545">${escapeHTML(
                            name
                        )}</span>
                    </div>`;
        })
        .join("");
}

function buildCollaboratorsList(taskObj) {
    const items = collectCollaborators(taskObj);
    if (!items.length)
        return '<div class="text-muted small">No collaborators</div>';

    const rows = items.map(({ role, emp }) => {
        const name = getEmployeeName(emp);
        const roleLabel = getRoleLabel(role, emp);
        const photo = getEmployeePhoto(emp, 36);

        return `
            <div class="collab-item d-flex align-items-center mb-2">
                <div class="flex-shrink-0">${photo}</div>
                <div class="ms-2">
                    <div class="collab-name">${escapeHTML(name)}</div>
                    <div class="collab-division text-muted">${escapeHTML(
                        roleLabel
                    )}</div>
                </div>
            </div>`;
    });

    return `<div class="collab-list">${rows.join("")}</div>`;
}

function collectCollaborators(task) {
    const list = [];
    if (task?.pic) list.push({ role: "pic", emp: task.pic });
    if (Array.isArray(task?.executors)) {
        task.executors.forEach((emp) => list.push({ role: "executor", emp }));
    }
    return list;
}

function getEmployeeName(emp) {
    return (
        emp?.name ||
        emp?.employee_name ||
        emp?.username ||
        emp?.full_name ||
        emp?.employee?.name ||
        emp?.employee?.full_name ||
        "Unknown"
    );
}

function getRoleLabel(role, emp) {
    if (emp?.role) return capitalize(emp.role.replace(/_/g, " "));
    const roles = {
        pic: "PIC",
        executor: "Executor",
        author: "Author",
        co_author: "Co-author",
        contributor: "Contributor",
    };
    return roles[role] || capitalize(role || "-");
}

function getEmployeePhoto(emp, size = 36) {
    const fallback = `${appUrl}/asset/img/avatar.png`;
    const src = normalizePhotoUrl(emp) || fallback;
    const name = escapeHTML(getEmployeeName(emp));

    return `
        <img src="${src}" alt="${name}"
            data-bs-toggle="tooltip" title="${name}"
            class="rounded-circle"
            style="width:${size}px;height:${size}px;object-fit:cover;"
            onerror="this.onerror=null;this.src='${fallback}'">`;
}

function normalizePhotoUrl(emp) {
    const raw = String(
        emp?.profile_picture_url ||
            emp?.profile_picture ||
            emp?.user_photo ||
            emp?.user_photo_url ||
            emp?.photo ||
            emp?.image ||
            ""
    ).trim();

    if (!raw) return null;
    const trimmed = raw.replace(/^\/+/, "");
    if (/^https?:\/\//i.test(raw)) return raw;
    if (/^(file\/|asset\/|storage\/)/.test(trimmed))
        return `${appUrl}/${trimmed}`;
    if (raw.startsWith("/")) return `${appUrl}${raw}`;
    if (raw.includes("/")) return `${appUrl}/${trimmed}`;
    return `${appUrl}/file/profile_picture/${raw}`;
}

function capitalize(str) {
    return (
        String(str || "")
            .charAt(0)
            .toUpperCase() + String(str || "").slice(1)
    );
}

function escapeHTML(str) {
    return String(str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function getAvatarHTML(task, size = 48) {
    // size: numeric pixel for width/height (default 48)
    const px = Number(size) || 48;
    const img = task && (task.image || task.image_url || task.project_image) ? `${appUrl}/file/task/${(task.image || task.image_url || task.project_image)}` : null;

    if (img) {
        // Safer fallback: set image src to default avatar on error instead of injecting HTML
        return `<img src="${img}" alt="Task" class="project-image" style="width:${px}px;height:${px}px;object-fit:cover;border-radius:50%;" onerror="this.onerror=null;this.src='${appUrl}/asset/img/avatar.png'">`;
    }

    const initials = escapeHTML(getTaskInitials(task.title || ''));
    const color = getRandomColorFromText(task.title || '');
    return `<div class="project-initial-avatar" style="width:${px}px;height:${px}px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:${Math.max(10, Math.round(px*0.34))}px;color:#fff;background:${color};">${initials}</div>`;
}

if (typeof window.getTaskInitials !== "function") {
    window.getTaskInitials = function (title) {
        try {
            if (!title) return "NA";
            const words = String(title || "")
                .trim()
                .split(/\s+/)
                .filter(Boolean);
            if (!words.length) return "NA";
            if (words.length === 1)
                return words[0].substring(0, 2).toUpperCase();
            return (
                words[0].charAt(0) + words[words.length - 1].charAt(0)
            ).toUpperCase();
        } catch (e) {
            return "NA";
        }
    };
}

if (typeof window.getRandomColorFromText !== "function") {
    window.getRandomColorFromText = function (text) {
        try {
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
            const key = String(text || "");
            let hash = 0;
            for (let i = 0; i < key.length; i++)
                hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
            return colors[hash % colors.length];
        } catch (e) {
            return "#6A5AE0";
        }
    };
}

function formatPriority(priority) {
    if (!priority) return "-";
    const color = priority === "HIGH" ? "red" : "#4B4F5E";
    return `<span style="color:${color}">${priority}</span>`;
}

function initBootstrapTooltips(root = document) {
    try {
        const isMobile =
            window.matchMedia("(max-width: 1024px)").matches ||
            window.innerWidth <= 1024 ||
            /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
                navigator.userAgent
            );
        const defaultPlacement = isMobile ? "top" : "bottom";

        const nodes = [].slice.call(
            root.querySelectorAll('[data-bs-toggle="tooltip"]')
        );
        nodes.forEach((el) => {
            const existing = bootstrap.Tooltip.getInstance(el);
            if (existing) existing.dispose();

            el.removeAttribute("data-bs-placement");

            new bootstrap.Tooltip(el, {
                container: "body",
                placement: defaultPlacement,
                trigger: "hover focus",
            });
        });
    } catch (_) {
        /* noop */
    }
}

function initProjectTaskDetailModal() {
    const el = document.getElementById('taskDetailModal');
    if (!el) return;
    const modal = bootstrap.Modal.getOrCreateInstance(el) || new bootstrap.Modal(el);
    const $modal = $(el);

    $modal.on("shown.bs.modal", () =>
        setTimeout(() => initBootstrapTooltips($modal[0]), 100)
    );
    $modal.on("hidden.bs.modal", () => {
        $modal.find("[data-bs-toggle='tooltip']").each(function () {
            const tip = bootstrap.Tooltip.getInstance(this);
            if (tip) tip.dispose();
        });
    });

    modal.show();
}

(function setupTaskMoreMenu() {
    if (window.__taskMoreMenuBound) return;
    window.__taskMoreMenuBound = true;

    var $globalMenu = null;
    var currentTaskId = null;
    var isPrivileged = false;

    function createOrGetMenu() {
        if (!$globalMenu || !$globalMenu.length) {
            $globalMenu = $('<div id="task-global-more-menu" class="d-none" style="position:fixed;z-index:9999;background:#fff;border:1px solid #ddd;border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,0.1);min-width:160px;overflow:hidden;"></div>');
            $("body").append($globalMenu);
        }
        return $globalMenu;
    }

    function createMenuForStatus(status, privileged) {
        let baseButtons = "";
        if (privileged) {
            baseButtons = `
                <button type="button" class="clear-parent-action" style="display:block;width:100%;padding:8px 12px;background:#fff;border:0;text-align:left;font-size:10px;color:#333;cursor:pointer;">Clear Parent</button>
                <button type="button" class="edit-task-action" style="display:block;width:100%;padding:8px 12px;background:#fff;border:0;text-align:left;font-size:10px;color:#333;cursor:pointer;">Edit</button>
                <button type="button" class="delete-task-action" style="display:block;width:100%;padding:8px 12px;background:#fff;border:0;text-align:left;font-size:10px;color:#d33;cursor:pointer;">Delete</button>
            `;
        }

        let extraButtons = "";
        switch ((status || "").trim()) {
            case "new_request":
                extraButtons = `<button type="button" class="status-progress-action" style="display:block;width:100%;padding:8px 12px;background:#fff;border:0;text-align:left;font-size:10px;color:#0066cc;cursor:pointer;">Progress</button>`;
                break;
            case "in_progress":
                extraButtons = `
                    <button type="button" class="status-newrequest-action" style="display:block;width:100%;padding:8px 12px;background:#fff;border:0;text-align:left;font-size:10px;color:#0066cc;cursor:pointer;">Back to New Request</button>
                    <button type="button" class="status-completed-action" style="display:block;width:100%;padding:8px 12px;background:#fff;border:0;text-align:left;font-size:10px;color:#00aa44;cursor:pointer;">Completed</button>`;
                break;
            case "completed":
                extraButtons = `
                    <button type="button" class="status-back-to-progress-action" style="display:block;width:100%;padding:8px 12px;background:#fff;border:0;text-align:left;font-size:10px;color:#0066cc;cursor:pointer;">Back to Progress</button>
                    <button type="button" class="status-rejected-action" style="display:block;width:100%;padding:8px 12px;background:#fff;border:0;text-align:left;font-size:10px;color:#ff6600;cursor:pointer;">Rejected</button>
                    <button type="button" class="status-finished-action" style="display:block;width:100%;padding:8px 12px;background:#fff;border:0;text-align:left;font-size:10px;color:#444;cursor:pointer;">Finished</button>`;
                break;
            case "rejected":
                extraButtons = `<button type="button" class="status-completed-action" style="display:block;width:100%;padding:8px 12px;background:#fff;border:0;text-align:left;font-size:10px;color:#00aa44;cursor:pointer;">Completed</button>`;
                break;
            case "finished":
                extraButtons = `
                    <button type="button" class="status-rejected-action" style="display:block;width:100%;padding:8px 12px;background:#fff;border:0;text-align:left;font-size:10px;color:#ff6600;cursor:pointer;">Rejected</button>
                    <button type="button" class="status-completed-action" style="display:block;width:100%;padding:8px 12px;background:#fff;border:0;text-align:left;font-size:10px;color:#444;cursor:pointer;">Back to Completed</button>`;
                break;

        }
        return extraButtons + baseButtons;
    }

    function showMenuAt($btn, taskId) {
        const $menu = createOrGetMenu();
        const rect = $btn[0].getBoundingClientRect();
        const top = rect.bottom + 4;
        const left = Math.max(rect.left - 60, 10);
        const status = $btn.attr("data-task-status") || "";
        const privileged = $btn.attr("data-privileged") === "1";
        isPrivileged = privileged;
        $menu.html(createMenuForStatus(status, privileged));
        $menu.css({ top: top + "px", left: left + "px" });
        $menu.removeClass("d-none");
        currentTaskId = taskId;
    }

    function hideMenu() {
        if ($globalMenu) $globalMenu.addClass("d-none");
        currentTaskId = null;
    }

    $(document).on("click", ".task-more-btn", function (e) {
        e.preventDefault();
        e.stopPropagation();
        const $btn = $(this);
        const taskId = $btn.attr("data-task-id");
        if (!taskId) return;
        const $menu = createOrGetMenu();
        if (!$menu.hasClass("d-none") && currentTaskId === taskId) hideMenu();
        else { hideMenu(); showMenuAt($btn, taskId); }
    });

    $(document).on("click", "#task-global-more-menu [class^='status-']", function (e) {
        e.preventDefault();
        e.stopPropagation();
        const $btn = $(this);
        const taskId = currentTaskId;
        if (!taskId) return;
        hideMenu();
        let newStatus = null;
        if ($btn.hasClass("status-progress-action")) newStatus = "in_progress";
        if ($btn.hasClass("status-newrequest-action")) newStatus = "new_request";
        if ($btn.hasClass("status-completed-action")) newStatus = "completed";
        if ($btn.hasClass("status-rejected-action")) newStatus = "rejected";
        if ($btn.hasClass("status-finished-action")) newStatus = "finished";
        if ($btn.hasClass("status-back-to-progress-action")) newStatus = "back_to_progress";
        if (!newStatus) return;

        if (newStatus === "completed") {
            const $taskCard = $(`[data-task-id='${taskId}']`).closest(".task-box");
            showConfirmationToCompleteModal(taskId, $taskCard[0]);
            return;
        }

        if (newStatus === "back_to_progress") {
            // Show confirmation modal before moving completed task back to In Progress
            showStatusModalProjectDetail(taskId, 'in_progress', 'Back to Progress', 'In Progress', 'Move this task back to In Progress?');
            return;
        }

        $.ajax({
            url: `${appUrl}/task/${taskId}/status`,
            type: "PUT",
            data: JSON.stringify({ status: newStatus }),
            contentType: "application/json",
            dataType: "json",
            headers: {
                "X-CSRF-TOKEN": window.csrfToken || $('meta[name="csrf-token"]').attr("content") || "",
                "X-Requested-With": "XMLHttpRequest",
                Accept: "application/json",
            },
        })
            .done(function () {
                window.showFloatingAlert?.(`Status changed to ${newStatus}`, "success", 1400);
                if (typeof window.refreshTaskTreePartial === "function") window.refreshTaskTreePartial();
                else renderTaskList?.(allTasks);
            })
            .fail(function (xhr) {
                console.error("Failed to update status", xhr?.responseText);
                window.showFloatingAlert?.("Failed to update status", "warning", 2000);
            });
    });

    $(document).on("click", "#task-global-more-menu .edit-task-action", function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (!isPrivileged) return;
        const taskId = currentTaskId;
        hideMenu();
        if (!taskId) return;
        const el = document.getElementById('editProjectTaskModal');
        if (!el) return;
        // Let the centralized handler manage modal instantiation and showing.
        el.setAttribute('data-task-id', taskId);
        try { window.handleProjectTaskEdit && window.handleProjectTaskEdit(taskId); } catch (e) { console.warn('handleProjectTaskEdit failed', e); }
    });

    $(document).on("click", "#task-global-more-menu .clear-parent-action", function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (!isPrivileged) return;
        const taskId = currentTaskId;
        hideMenu();
        if (!taskId) return;
        $.ajax({
            url: appUrl + "/task/" + encodeURIComponent(String(taskId)),
            type: "PUT",
            data: JSON.stringify({ parent_id: null, parent_ids: [] }),
            contentType: "application/json",
            dataType: "json",
            headers: {
                "X-CSRF-TOKEN": window.csrfToken || $('meta[name="csrf-token"]').attr("content") || "",
                "X-Requested-With": "XMLHttpRequest",
                Accept: "application/json",
            },
        })
            .done(function () {
                if (typeof window.refreshTaskTreePartial === "function") window.refreshTaskTreePartial();
                else {
                    var idStr = String(taskId);
                    (allTasks || []).forEach(function (t) {
                        if (String(t.id) === idStr) {
                            t.parent_id = null;
                            t.parent_ids = [];
                        }
                    });
                    renderTaskList(allTasks);
                }
                window.showFloatingAlert?.("Parent cleared successfully", "success", 1400);
            })
            .fail(function (xhr) {
                console.error("Failed to clear parent", xhr?.responseText);
                window.showFloatingAlert?.("Failed to clear parent", "warning", 2400);
            });
    });

    $(document).on("click", "#task-global-more-menu .delete-task-action", function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (!isPrivileged) return;
        const taskId = currentTaskId;
        hideMenu();
        if (!taskId) return;
        const delEl = document.getElementById('deleteProjectTaskModal');
        if (!delEl) return;
        delEl.setAttribute('data-task-id', taskId);
        try { window.handleProjectTaskDelete && window.handleProjectTaskDelete(taskId); } catch (e) { console.warn('handleProjectTaskDelete failed', e); }
    });

    $(document).on("click", function (e) {
        if (!$(e.target).closest("#task-global-more-menu, .task-more-btn").length) hideMenu();
    });

    $(window).on("scroll", hideMenu);
})();

function showConfirmationToCompleteModal(taskId, taskCard) {
    $.ajax({ url: appUrl + '/task/' + taskId, type: 'GET', dataType: 'json' })
    .done(function(res){
        const t = (res && (res.data || res)) || {};
        const modalId = 'confirmation-to-complete';
        try { const existing = document.getElementById(modalId); if (existing) existing.remove(); } catch(_){}

        const modalHtml = `
        <div class="modal fade" id="${modalId}" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content modal-content-custom">
                    <div class="modal-header modal-header-custom">
                        <h5 class="modal-title modal-title-custom">Complete Task</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <form id="confirmationToCompleteForm" enctype="multipart/form-data">
                        <div class="modal-body modal-body-custom">
                            <div class="mb-3 custom-input">
                                <label class="form-label label-custom">Complete Note (required)</label>
                                <div id="complete_note_editor" style="min-height:120px;background:#fff;border:1px solid #e3e6ee;border-radius:6px;"></div>
                            </div>
                            <div class="mb-3 custom-input">
                                <label class="form-label label-custom">Complete URLs (optional)</label>
                                <div id="complete_reference_urls_container" class="d-flex flex-column gap-2">
                                    <div class="input-group">
                                        <input type="url" name="complete_urls[]" placeholder="https://example.com" class="form-control input-text">
                                        <button type="button" class="btn btn-submit-black add-ref-url"><span class="material-symbols-outlined">add</span></button>
                                    </div>
                                </div>
                            </div>
                            <div class="mb-3 custom-input">
                                <label class="form-label label-custom" for="complete_files">Complete Files (optional)</label>
                                <input type="file" class="form-control input-text" id="complete_files" name="complete_files[]" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip" multiple>
                                <div id="complete_files_preview" class="mt-2"></div>
                            </div>
                        </div>
                        <div class="modal-footer modal-footer-custom">
                            <button type="button" class="btn btn-custom-close" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-submit-black" id="confirmCompleteBtn">Submit</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const mEl = document.getElementById(modalId);
        const modal = new bootstrap.Modal(mEl);
        modal.show();

        window.__quillComplete = new Quill('#complete_note_editor', { theme: 'snow', modules: { toolbar: false } });

        mEl.addEventListener('click', function(ev){
            const addBtn = ev.target.closest('.add-ref-url');
            if (addBtn) {
                const container = document.getElementById('complete_reference_urls_container');
                const row = document.createElement('div');
                row.className = 'input-group';
                row.innerHTML = `<input type="url" name="complete_urls[]" placeholder="https://example.com" class="form-control input-text">
                                 <button type="button" class="btn btn-remove-url remove-ref-url"><span class="material-symbols-outlined">close</span></button>`;
                addBtn.closest('.input-group').after(row);
                return;
            }
            const rmBtn = ev.target.closest('.remove-ref-url');
            if (rmBtn) rmBtn.closest('.input-group')?.remove();
        });

        const fileInput = mEl.querySelector('#complete_files');
        const preview = mEl.querySelector('#complete_files_preview');
        if (fileInput && preview) {
            fileInput.addEventListener('change', e => {
                const files = Array.from(e.target.files || []);
                preview.innerHTML = files.map(f => `<div>${f.name} <small class="text-muted">(${(f.size/1024).toFixed(1)} KB)</small></div>`).join('');
            });
        }

        const submitBtn = mEl.querySelector('#confirmCompleteBtn');
        submitBtn.addEventListener('click', function(){
            let noteHtml = '';
            try { noteHtml = window.__quillComplete.root.innerHTML.trim(); } catch(_) {}
            const plain = noteHtml.replace(/<(.|\n)*?>/g, '').trim();
            if (!plain) { showFloatingAlert('Complete note is required.', 'warning'); return; }

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Submitting...';

            const fd = new FormData();
            fd.append('_method', 'PUT');
            fd.append('status', 'completed');
            fd.append('complete_note', noteHtml);

            const urls = Array.from(mEl.querySelectorAll('input[name="complete_urls[]"]')).map(i => i.value.trim()).filter(Boolean);
            if (urls.length) fd.append('complete_urls', JSON.stringify(urls));

            const fl = mEl.querySelector('#complete_files');
            if (fl && fl.files.length) Array.from(fl.files).forEach(f => fd.append('complete_files[]', f));

            fetch(appUrl + '/task/' + taskId + '/status', {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content') },
                body: fd,
                credentials: 'same-origin'
            }).then(r => r.ok ? r.json() : r.json().then(Promise.reject))
            .then(json => {
                modal.hide();
                showFloatingAlert(json.message || 'Task marked as completed.', 'success');
                if (typeof window.refreshTaskTreePartial === 'function') {
                    window.refreshTaskTreePartial();
                } else if (typeof fetchAndRenderTasks === 'function') {
                    fetchAndRenderTasks();
                }
            }).catch(err => {
                showFloatingAlert('Failed to mark task as completed.', 'danger');
            }).finally(() => {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Submit';
            });
        });
    }).fail(function(){
        showFloatingAlert('Failed to load task details.', 'danger');
    });
}

// Show status confirmation modal for task status changes in project detail
function showStatusModalProjectDetail(taskId, newStatus, actionTitle, statusLabel, confirmMessage) {
    $.ajax({
        url: appUrl + "/task/" + taskId,
        type: "GET",
        dataType: "json",
        success: function (res) {
            const task = res.data || {};
            const taskTitle = task.title || "Untitled Task";
            const taskDescription = task.description || "No description available";
            const taskProject = (task.project && task.project.title) || "No Project";
            const taskImage = task.image ? `${appUrl}/file/task/${task.image}` : null;

            function getTaskInitials(title) {
                if (!title) return "NA";
                const words = String(title).trim().split(/\s+/);
                if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
                return String(title).substring(0, 2).toUpperCase();
            }

            function getRandomColorFromText(text) {
                const colors = ["#6A5AE0", "#FF6B6B", "#4ECDC4", "#FFD93D", "#6BCF7F", "#FF8C42"];
                if (!text) return colors[0];
                let hash = 0;
                for (let i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
                return colors[hash % colors.length];
            }

            const initials = !taskImage ? getTaskInitials(task.title) : "";
            const initialsColor = !taskImage ? getRandomColorFromText(task.title) : "#6A5AE0";

            const avatarHtml = taskImage
                ? `<img src="${taskImage}" class="rounded-circle" style="width:48px;height:48px;object-fit:cover;" onerror="this.onerror=null; this.src='${appUrl}/asset/img/avatar.png'">`
                : `<div class="d-flex align-items-center justify-content-center rounded-circle"
                        style="width:48px;height:48px;font-size:14px;font-weight:600;color:#fff;background:${initialsColor};">
                        ${initials}
                </div>`;

            const modalId = 'statusConfirmModalProjectDetail';
            try { const existing = document.getElementById(modalId); if (existing) existing.remove(); } catch(_){}

            const modalHtml = `
            <div class="modal fade" id="${modalId}" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content modal-content-custom">
                        <div class="modal-body modal-body-custom">
                            <div class="d-flex mb-3">
                                <div class="me-3">${avatarHtml}</div>
                                <div class="p-0 m-0 border-0">
                                    <small class="text-muted" style="font-size: 10px">${taskProject}</small>
                                    <h5 class="fw-bold" style="font-size: 16px">${taskTitle}</h5>
                                    <div class="task-description-container flex-grow-1">
                                        <p class="task-description">${taskDescription || ''}</p>
                                    </div>
                                </div>
                            </div>
                            <hr class="my-3">
                            <p class="fw-normal fs-6 text-center mb-4">${confirmMessage || 'Are you sure want to move this task?'}</p>
                            <div class="modal-footer modal-footer-custom">
                                <button type="button" class="btn btn-custom-close" data-bs-dismiss="modal">Cancel</button>
                                <button type="button" class="btn btn-submit-black" id="statusModalProjectDetailConfirmBtn">Confirm</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;

            document.body.insertAdjacentHTML('beforeend', modalHtml);
            const mEl = document.getElementById(modalId);
            const modal = new bootstrap.Modal(mEl);
            modal.show();

            mEl.addEventListener('hidden.bs.modal', function onHide(){ 
                mEl.removeEventListener('hidden.bs.modal', onHide); 
                try { mEl.remove(); } catch(_){} 
            });

            const confirmBtn = document.getElementById('statusModalProjectDetailConfirmBtn');
            confirmBtn.onclick = function () {
                confirmBtn.disabled = true;
                confirmBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';

                $.ajax({
                    url: `${appUrl}/task/${taskId}/status`,
                    type: "PUT",
                    data: JSON.stringify({ status: newStatus }),
                    contentType: "application/json",
                    dataType: "json",
                    headers: {
                        "X-CSRF-TOKEN": window.csrfToken || $('meta[name="csrf-token"]').attr("content") || "",
                        "X-Requested-With": "XMLHttpRequest",
                        Accept: "application/json",
                    },
                })
                .done(function () {
                    modal.hide();
                    window.showFloatingAlert?.(`Status changed to ${newStatus}`, "success", 1400);
                    if (typeof window.refreshTaskTreePartial === "function") window.refreshTaskTreePartial();
                    else if (typeof renderTaskList === 'function') renderTaskList(allTasks);
                })
                .fail(function (xhr) {
                    console.error("Failed to update status", xhr?.responseText);
                    window.showFloatingAlert?.("Failed to update status", "warning", 2000);
                    modal.hide();
                })
                .always(function() {
                    confirmBtn.disabled = false;
                    confirmBtn.innerHTML = 'Confirm';
                });
            };
        },
        error: function () {
            window.showFloatingAlert?.("Failed to load task details.", "danger");
        }
    });
}

$(function () {
    var modal = $("#addTaskModalProject");
    if (!modal.length) return;

    function loadTasksForProject(projectId) {
        var $dropdown = $("#task_parent_dropdown");
        var $selected = $("#task_selected_parent");
        var $input = $("#task_parent_input");
        var $id = $("#task_parent_id");

        $dropdown.html('<div class="dropdown-item text-muted">Loading tasks...</div>').show();

        function getInitialAvatar(name) {
            const colors = [
                "#F44336", "#E91E63", "#9C27B0", "#673AB7",
                "#3F51B5", "#2196F3", "#03A9F4", "#00BCD4",
                "#009688", "#4CAF50", "#8BC34A", "#FFC107",
                "#FF9800", "#FF5722", "#795548"
            ];
            const color = colors[Math.floor(Math.random() * colors.length)];
            const initial = (name || "?").charAt(0).toUpperCase();
            return `<div style="
                width:28px;height:28px;
                border-radius:50%;
                background:${color};
                color:#fff;
                font-size:13px;
                font-weight:bold;
                display:flex;
                align-items:center;
                justify-content:center;
            ">${initial}</div>`;
        }

        $.ajax({
            url: (window.APP_URL || "") + `/projects/${projectId}/tasks`,
            type: "GET",
            dataType: "json",
            success: function (res) {
                var data = res.data || [];
                if (!data.length) {
                    $dropdown.html('<div class="dropdown-item text-muted">No tasks available in this project</div>');
                    return;
                }

                $dropdown.empty();
                $.each(data, function (_, task) {
                    let avatarHtml = task.image
                        ? `<img src="${appUrl}/file/task/${task.image}" width="24" height="24" style="object-fit:cover;border-radius:50%;">`
                        : getInitialAvatar(task.title);

                    let startDate = task.start_date ? task.start_date : "-";
                    let dueDate = task.due_date ? task.due_date : "-";

                    var $item = $(`
                        <div class="dropdown-item d-flex align-items-start gap-2 py-2" style="cursor:pointer;">
                            ${avatarHtml}
                            <div class="d-flex flex-column">
                                <span class="fw-semibold">${task.title || "Task #" + task.id}</span>
                                <small class="text-muted fs-8">${formatDateENMediumDayMonth(startDate)} - ${formatDateENMediumDayMonth(dueDate)}</small>
                            </div>
                        </div>
                    `);

                    $item.on("click", function () {
                        $id.val(task.id);
                        $input.val(task.title || "Task #" + task.id);
                        $selected.html(`
                            <div class="d-flex align-items-center gap-2 p-2 rounded bg-light selected-task">
                                ${avatarHtml}
                                <div class="d-flex flex-column">
                                    <span class="flex-grow-1">${task.title || "Task #" + task.id}</span>
                                    <small class="text-muted fs-8">${formatDateENMediumDayMonth(startDate)} - ${formatDateENMediumDayMonth(dueDate)}</small>
                                </div>
                                <button type="button" class="btn btn-sm btn-remove-task remove-task" style="line-height:1">
                                    <span class="material-symbols-outlined">close</span>
                                </button>
                            </div>
                        `);
                        $dropdown.hide();
                    });

                    $dropdown.append($item);
                });

                $selected.on("click", ".remove-task", function () {
                    $(this).closest(".selected-task").remove();
                    $id.val("");
                    $input.val("");
                });
            },
            error: function () {
                $dropdown.html('<div class="dropdown-item text-danger">Failed to load tasks</div>');
            }
        });
    }

    modal.on("show.bs.modal", function () {
        var projectId = $('meta[name="project-id"]').attr("content") || "";
        var $projectIdInput = $("#task_project_id");
        var $projectInput = $("#task_project_input");
        var $projectDropdown = $("#task_project_dropdown");
        var $projectSelected = $("#task_selected_project");
        var $projectContainer = $projectInput.closest(".mb-3");

        if (projectId) {
            $projectIdInput.val(projectId);
            $projectContainer.hide();
            $projectInput.prop("required", false).prop("disabled", true);
            loadTasksForProject(projectId);
        } else {
            $projectInput.on("change", function () {
                var pid = $projectIdInput.val();
                if (pid) loadTasksForProject(pid);
            });
        }

        var $prio = $("#task_priority");
        if (!$prio.val()) $prio.val("MEDIUM");

        var now = new Date();
        var today = now.toISOString().split("T")[0];
        var due = new Date(now);
        due.setDate(due.getDate() + 2);
        var dueStr = due.toISOString().split("T")[0];

        var $start = $("#task_start_date");
        var $due = $("#task_due_date");
        if (!$start.val()) $start.val(today);
        if (!$due.val()) $due.val(dueStr);
    });

    modal.on("hidden.bs.modal", function () {
        var $form = $("#addTaskForm");
        $form.trigger("reset");
        if (window.__quillTaskAdd?.root) window.__quillTaskAdd.root.innerHTML = "";

        var $projectInput = $("#task_project_input");
        var $projectDropdown = $("#task_project_dropdown");
        var $projectSelected = $("#task_selected_project");
        var $projectId = $("#task_project_id");

        $projectInput.show().val("").prop("required", true).prop("disabled", false);
        $projectDropdown.show().empty();
        $projectSelected.hide().empty();
        $projectId.val("");

        var $parentInput = $("#task_parent_input");
        var $parentDropdown = $("#task_parent_dropdown");
        var $parentSelected = $("#task_selected_parent");
        var $parentId = $("#task_parent_id");

        $parentInput.val("");
        $parentDropdown.empty().hide();
        $parentSelected.empty();
        $parentId.val("");
    });
});


(function () {
    try {
        var addTaskForm = document.getElementById("addTaskForm");
        var addTaskModalEl = document.getElementById("addTaskModalProject");
        var loader = document.getElementById("addTaskModalLoader");
        var imageLabel = document.getElementById("taskImageLabel");
        var imageClearBtn = document.getElementById("taskImageClearBtn");

        if (!addTaskForm) return; // nothing to do

        // Helper: sync quill editor if present
        function syncQuillIfPresent(quill, taId) {
            try {
                if (quill && quill.root && document.getElementById(taId)) {
                    document.getElementById(taId).value =
                        quill.root.innerHTML || "";
                }
            } catch (_) {}
        }

        // Capture-phase listener runs before other bubble listeners; attach once
        addTaskForm.addEventListener(
            "submit",
            function (e) {
                try {
                    // Only run when this modal is open (prevents interfering on global task page)
                    if (
                        addTaskModalEl &&
                        !addTaskModalEl.classList.contains("show") &&
                        !addTaskModalEl.classList.contains("modal")
                    ) {
                        // allow normal submit flow elsewhere
                        return;
                    }
                    e.preventDefault();
                    e.stopImmediatePropagation();

                    // Sync Quill editors
                    try {
                        if (window.__quillTaskAdd)
                            syncQuillIfPresent(
                                window.__quillTaskAdd,
                                "task_description"
                            );
                    } catch (_) {}

                    // Basic HTML5 validation
                    if (!addTaskForm.checkValidity()) {
                        addTaskForm.classList.add("was-validated");
                        return;
                    }

                    // Executor validation (hidden input)
                    try {
                        var execHidden = document.getElementById("executors");
                        var execVal = execHidden ? execHidden.value : "";
                        var execArr = [];
                        if (execVal) {
                            try {
                                execArr = JSON.parse(execVal);
                            } catch (_) {
                                execArr = [];
                            }
                        }
                        if (!Array.isArray(execArr) || execArr.length === 0) {
                            try {
                                if (typeof showFloatingAlert === "function")
                                    showFloatingAlert(
                                        "Please select at least one executor.",
                                        "warning",
                                        2500
                                    );
                                else
                                    alert(
                                        "Please select at least one executor."
                                    );
                            } catch (_) {
                                alert("Please select at least one executor.");
                            }
                            return;
                        }
                    } catch (_) {}

                    // Show loader and disable submit
                    try {
                        if (loader) loader.classList.remove("d-none");
                    } catch (_) {}
                    var submitBtn = addTaskForm.querySelector(
                        "button[type='submit']"
                    );
                    if (submitBtn) submitBtn.disabled = true;

                    // Additional description content validation (robust: check Quill, textarea and editor text)
                    try {
                        var descTa = document.getElementById('task_description');
                        var plainText = '';
                        var htmlContent = '';

                        // 1) Prefer Quill plain-text if available
                        try {
                            if (window.__quillTaskAdd && typeof window.__quillTaskAdd.getText === 'function') {
                                plainText = (window.__quillTaskAdd.getText() || '').replace(/\uFEFF/g, '').trim();
                                htmlContent = (window.__quillTaskAdd.root && window.__quillTaskAdd.root.innerHTML) ? window.__quillTaskAdd.root.innerHTML : '';
                            }
                        } catch (_) {}

                        // 2) Fallback to canonical textarea value
                        try {
                            if ((!plainText || plainText.length === 0) && descTa) {
                                htmlContent = descTa.value || '';
                                plainText = (htmlContent || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\u00A0/g, ' ').replace(/\uFEFF/g, '').trim();
                            }
                        } catch (_) {}

                        // 3) Fallback to editor container visible text
                        try {
                            var editorEl = document.getElementById('task_description_editor');
                            if ((!plainText || plainText.length === 0) && editorEl) {
                                plainText = (editorEl.innerText || '').replace(/\u00A0/g, ' ').replace(/\uFEFF/g, '').trim();
                                htmlContent = htmlContent || (editorEl.innerHTML || '');
                            }
                        } catch (_) {}

                        if (!plainText || plainText.length === 0) {
                            // restore submit button state
                            try { if (loader) loader.classList.add('d-none'); } catch(_) {}
                            if (submitBtn) submitBtn.disabled = false;
                            try {
                                if (typeof showFloatingAlert === 'function') showFloatingAlert('Description is required.', 'warning', 2500);
                                else alert('Description is required.');
                            } catch(_) { alert('Description is required.'); }
                            addTaskForm.classList.add('was-validated');
                            // focus quill editor if exists
                            try { if (window.__quillTaskAdd && window.__quillTaskAdd.focus) window.__quillTaskAdd.focus(); } catch(_) {}
                            return;
                        }

                        // Ensure canonical textarea contains HTML (backend expects description field)
                        try {
                            if (descTa && (!descTa.value || descTa.value.trim() === '')) {
                                // prefer HTML content but fallback to plain text
                                descTa.value = htmlContent && htmlContent.trim() !== '' ? htmlContent : plainText;
                            }
                        } catch (_) {}
                    } catch (_) {}

                    // Assemble FormData (respect existing form structure)
                    var fd = new FormData(addTaskForm);

                    // Ensure parent_id only when numeric
                    try {
                        var parentSel =
                            document.getElementById("task_parent_id");
                        if (parentSel) {
                            var pv = parentSel.value;
                            if (
                                !pv ||
                                pv === "" ||
                                pv === "null" ||
                                isNaN(Number(pv))
                            ) {
                                try {
                                    fd.delete("parent_id");
                                } catch (_) {}
                            } else {
                                fd.set("parent_id", String(Number(pv)));
                            }
                        }
                    } catch (_) {}

                    // Append image file if present (task_image)
                    try {
                        var imgEl = document.getElementById("task_image");
                        if (imgEl && imgEl.files && imgEl.files[0])
                            fd.set("image", imgEl.files[0]);
                    } catch (_) {}

                    // Append reference files if any (input id task_reference_files) and also use selectedFiles if present globally
                    try {
                        var refInput = document.getElementById(
                            "task_reference_files"
                        );
                        if (
                            refInput &&
                            refInput.files &&
                            refInput.files.length
                        ) {
                            for (var i = 0; i < refInput.files.length; i++)
                                fd.append(
                                    "reference_files[]",
                                    refInput.files[i]
                                );
                        }
                    } catch (_) {}

                    // CSRF token header
                    var csrf = document.querySelector('meta[name="csrf-token"]')
                        ? document
                              .querySelector('meta[name="csrf-token"]')
                              .getAttribute("content")
                        : "";

                    // Send via fetch so multipart works
                    fetch((window.APP_URL || "") + "/task/store", {
                        method: "POST",
                        headers: csrf ? { "X-CSRF-TOKEN": csrf } : {},
                        body: fd,
                        credentials: "same-origin",
                    })
                        .then(function (res) {
                            if (!res.ok)
                                return res.json().then(function (json) {
                                    throw { status: res.status, body: json };
                                });
                            return res.json();
                        })
                        .then(function (json) {
                            try {
                                if (loader) loader.classList.add("d-none");
                            } catch (_) {}
                            if (submitBtn) submitBtn.disabled = false;
                            try {
                                if (typeof showFloatingAlert === "function")
                                    showFloatingAlert(
                                        json.message ||
                                            "Task added successfully!",
                                        "success"
                                    );
                            } catch (_) {}

                            // close modal after short delay and reload
                            setTimeout(function () {
                                try {
                                    if (
                                        addTaskModalEl &&
                                        addTaskModalEl.dataset
                                    )
                                        addTaskModalEl.dataset.allowProgrammaticClose =
                                            "1";
                                } catch (_) {}
                                try {
                                    var m =
                                        bootstrap.Modal.getInstance(
                                            addTaskModalEl
                                        );
                                    if (m) m.hide();
                                } catch (_) {}
                                window.location.reload();
                            }, 1200);
                        })
                        .catch(function (err) {
                            try {
                                if (loader) loader.classList.add("d-none");
                            } catch (_) {}
                            if (submitBtn) submitBtn.disabled = false;
                            var msg = "Failed to create task.";
                            try {
                                if (err && err.body) {
                                    if (err.body.errors)
                                        msg = Object.values(err.body.errors)
                                            .flat()
                                            .join("\n");
                                    else if (err.body.message)
                                        msg = err.body.message;
                                }
                            } catch (_) {}
                            try {
                                if (typeof showFloatingAlert === "function")
                                    showFloatingAlert(msg, "danger");
                                else alert(msg);
                            } catch (_) {
                                alert(msg);
                            }
                        });
                } catch (e) {
                    try {
                        if (loader) loader.classList.add("d-none");
                    } catch (_) {}
                    console.error("AddTask fallback submit error", e);
                }
            },
            true
        ); // capture
    } catch (e) {
        console.warn("AddTask fallback install failed", e);
    }
})();

    function timeAgo(createdAt){
        try {
            const time = new Date(createdAt);
            const now = new Date();
            const diff = (now.getTime() - time.getTime()) / 1000;

            if(diff < 60){
                return 'just now';
            }else if(diff < 3600){
                return Math.round(diff/60)+' minute ago';
            }else if(diff < 86400){
                return Math.round(diff/3600)+' hour ago';
            }else if(diff < 604800){
                return Math.round(diff/86400)+' day ago';
            }else if(diff < 2592000){
                return Math.round(diff/604800)+' week ago';
            }else if(diff < 31526000){
                return Math.round(diff/2592000)+' month ago';
            }else if(diff < 63072000){
                return Math.round(diff/31536000)+' year ago';
            }

            return time.toDateString();
        } catch (e) { return String(createdAt || ''); }
    }

    $(document).on("click", "#projectTaskFeedbackBtn", function() {
        const modal = document.getElementById("taskDetailModal");
        const taskId = modal?.dataset?.taskId;

        loadProjectTaskFeedbackData(taskId);
    });

    function setupProjectTaskInlineFeedbackEditor(taskId) {
        try {
            const modal = document.getElementById('projectTaskFeedbackModal');
            if (!modal) return;

            let footer = modal.querySelector('.modal-footer') || modal.querySelector('.modal-footer-custom');
            if (!footer) return;

            footer.innerHTML = `
                <div class="feedback-form w-100">
                <div id="inline_task_feedback_files_preview"></div>
                <div id="inline_existing_files_preview"></div>
                    <div id="inline_task_feedback_editor" class="border-0 ql-container ql-snow" style="min-height:40px; max-height:160px; overflow:auto; background:transparent; padding:8px 10px; border-radius:6px;">
                        <div class="ql-editor ql-blank" contenteditable="true" data-placeholder="Write feedback..."><p><br></p></div>
                    </div>

                    <textarea id="inline_task_feedback_comment" name="feedback_comment" class="d-none" style="display:none;"></textarea>
                    <input type="hidden" id="inline_edit_task_feedback_input" value="">
                    <input type="hidden" id="inline_parent_id_input" name="parent_id" value="">

                    <div class="d-flex justify-content-between btn-actions-feedback mt-2">
                        <div class="d-flex-justify-content-start">
                            <button type="button" class="btn btn-sm border-0" id="inlineTaskFeedbackPhotoBtn" title="Upload photo">
                                <span class="material-symbols-outlined feedback-photo-icon">photo</span>
                            </button>
                            <button type="button" class="btn btn-sm border-0" id="inlineTaskFeedbackFileBtn" title="Attach file">
                                <span class="material-symbols-outlined feedback-file-icon">attach_file</span>
                            </button>
                            <input type="file" id="inline_task_feedback_image_input" name="feedback_image" accept="image/*" class="d-none">
                            <input type="file" id="inline_task_feedback_files_input" name="reference_files[]" multiple="" accept="image/*,.csv,.pdf,.doc,.docx,.xls,.xlsx,.zip,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" class="d-none">
                        </div>
                        <div class="d-flex justify-content-end submit-feedback">
                            <button type="button" class="btn btn-submit-black" id="inlineTaskFeedbackSendBtn">
                                <span class="material-symbols-outlined">send</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;


            try { window.__quillTaskFeedbackInline = null; } catch(_) {}
            initProjectTaskInlineFeedbackEditor(taskId);

            try {
                const editor = document.getElementById('inline_task_feedback_editor');
                if (editor) {
                    const editorRoot = editor.querySelector('.ql-editor');
                    if (editorRoot && !editorRoot.dataset.placeholderHandlerAttached) {
                        const togglePlaceholder = function () {
                            try {
                                const txt = (editorRoot.textContent || '').replace(/\uFEFF/g, '').trim();
                                if (txt.length > 0) {
                                    editorRoot.classList.remove('ql-blank');
                                } else {
                                    if (!editorRoot.classList.contains('ql-blank')) editorRoot.classList.add('ql-blank');
                                }
                            } catch (_) {}
                        };
                        editorRoot.addEventListener('input', togglePlaceholder);
                        editorRoot.addEventListener('keydown', function () { setTimeout(togglePlaceholder, 0); });
                        editorRoot.dataset.placeholderHandlerAttached = '1';
                    }
                }
            } catch(_) {}

        } catch (e) {
            console.warn('Failed to setup inline task feedback editor:', e);
        }
    }

    function setupInlineProjectTaskFeedbackButtons(taskId, quill) {
        try {
            const photoBtn = document.getElementById("inlineTaskFeedbackPhotoBtn");
            const fileBtn = document.getElementById("inlineTaskFeedbackFileBtn");
            const sendBtn = document.getElementById("inlineTaskFeedbackSendBtn");
            const imageInput = document.getElementById("inline_task_feedback_image_input");
            const filesInput = document.getElementById("inline_task_feedback_files_input");
            const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

            if (photoBtn && imageInput) {
                photoBtn.addEventListener("click", () => imageInput.click());
            }

            if (fileBtn && filesInput) {
                fileBtn.addEventListener("click", () => filesInput.click());
            }

            if (imageInput) {
                imageInput.addEventListener("change", function () {
                    const file = this.files && this.files[0];
                    if (!file) return;
                    if (file.size > MAX_IMAGE_BYTES) {
                        if (typeof showFloatingAlert === "function")
                            showFloatingAlert("Image must be smaller than 10 MB.", "warning");
                        this.value = "";
                        return;
                    }
                    const reader = new FileReader();
                    reader.onload = e => showProjectTaskInlineImagePreviewSmall(file, e.target.result);
                    reader.readAsDataURL(file);
                });
            }

            if (filesInput) {
                filesInput.addEventListener("change", function () {
                    const files = Array.from(this.files || []);
                    if (!files.length) return;
                    if (!window.inlineTaskFeedbackSelectedFiles)
                        window.inlineTaskFeedbackSelectedFiles = [];
                    window.inlineTaskFeedbackSelectedFiles = [
                        ...window.inlineTaskFeedbackSelectedFiles,
                        ...files
                    ];
                    renderInlineTaskFeedbackFilesPreview();
                    this.value = "";
                });
            }

            if (sendBtn && quill) {
                sendBtn.addEventListener("click", function () {
                    submitInlineProjectTaskFeedback(taskId, quill);
                });
            }
        } catch (e) {
            console.warn("Failed to setup inline task feedback buttons:", e);
        }
    }

    function showProjectTaskInlineImagePreviewSmall(fileObj, dataUrl) {
        try {
            let previewContainer = document.getElementById("inline_task_feedback_image_preview");
            if (!previewContainer) {
                previewContainer = document.createElement("div");
                previewContainer.id = "inline_task_feedback_image_preview";
                previewContainer.style.cssText = "display: inline-flex; align-items: center; margin-left: 8px; opacity: 1; background: transparent;";

                const fileBtn = document.getElementById("inlineTaskFeedbackFileBtn");
                if (fileBtn && fileBtn.parentNode) {
                    fileBtn.parentNode.insertBefore(previewContainer, fileBtn.nextSibling);
                }
            }

            previewContainer.innerHTML = "";

            const imageLabel = document.createElement("div");
            imageLabel.className = "custom-image-upload position-relative";
            imageLabel.style.cssText =
                "width: 32px; height: 32px; " +
                "background-image: url('" + dataUrl + "'); " +
                "background-size: cover; background-position: center center; background-repeat: no-repeat; " +
                "border-radius: 6px; cursor: pointer; border: 1px solid #ddd; margin-right: 4px; " +
                "opacity: 1; background-color: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.12); overflow: visible;";

            const clearBtn = document.createElement("span");
            clearBtn.className = "image-clear-btn";
            clearBtn.innerHTML = "&times;";
            clearBtn.title = "Remove image";
            clearBtn.style.cssText =
                "position: absolute; top: -6px; right: -6px; background: #ff4444; color: #ffffff; " +
                "border-radius: 50%; width: 16px; height: 16px; font-size: 12px; line-height: 16px; " +
                "text-align: center; cursor: pointer; font-weight: 700; border: none; " +
                "box-shadow: 0 2px 6px rgba(0,0,0,0.25); z-index: 30; opacity: 1;";

            window.__taskInlineFeedbackImageFile = fileObj;

            clearBtn.addEventListener("click", function (e) {
                e.preventDefault();
                e.stopPropagation();
                try {
                    const inp = document.getElementById("inline_task_feedback_image_input");
                    if (inp) inp.value = "";
                    window.__taskInlineFeedbackImageFile = null;
                    if (previewContainer && previewContainer.parentNode) {
                        previewContainer.parentNode.removeChild(previewContainer);
                    }
                } catch (_) {}
            });

            imageLabel.appendChild(clearBtn);
            previewContainer.appendChild(imageLabel);
        } catch (e) {
            console.warn("Failed to show inline task image preview:", e);
        }
    }

    function showInlineFeedbackImagePreviewSmall(fileObj, dataUrl) {
        try {
            var previewContainer = document.getElementById("inline_feedback_image_preview");
            if (!previewContainer) {
                previewContainer = document.createElement("div");
                previewContainer.id = "inline_feedback_image_preview";
                previewContainer.style.cssText =
                    "display:inline-flex;align-items:center;margin-left:8px;opacity:1;background:transparent;";
                var fileBtn = document.getElementById("inlineFeedbackFileBtn");
                if (fileBtn && fileBtn.parentNode) {
                    fileBtn.parentNode.insertBefore(previewContainer, fileBtn.nextSibling);
                }
            }

            previewContainer.innerHTML = "";

            var imageLabel = document.createElement("div");
            imageLabel.className = "custom-image-upload position-relative";
            imageLabel.style.cssText =
                "width:32px;height:32px;background-image:url('" + dataUrl +
                "');background-size:cover;background-position:center;background-repeat:no-repeat;" +
                "border-radius:6px;cursor:pointer;border:1px solid #ddd;margin-right:4px;opacity:1;" +
                "background-color:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.12);overflow:visible;";

            var clearBtn = document.createElement("span");
            clearBtn.className = "image-clear-btn";
            clearBtn.innerHTML = "&times;";
            clearBtn.title = "Remove image";
            clearBtn.style.cssText =
                "position:absolute;top:-6px;right:-6px;background:#ff4444;color:#fff;border-radius:50%;" +
                "width:16px;height:16px;font-size:12px;line-height:16px;text-align:center;cursor:pointer;" +
                "font-weight:700;border:none;box-shadow:0 2px 6px rgba(0,0,0,0.25);z-index:30;opacity:1;";

            window.__inlineFeedbackImageFile = fileObj;

            clearBtn.addEventListener("click", function (e) {
                e.preventDefault();
                e.stopPropagation();
                try {
                    var inp = document.getElementById("inline_feedback_image_input");
                    if (inp) inp.value = "";
                    window.__inlineFeedbackImageFile = null;
                    if (previewContainer && previewContainer.parentNode) {
                        previewContainer.parentNode.removeChild(previewContainer);
                    }
                } catch (_) {}
            });

            imageLabel.addEventListener("click", function (e) {
                e.preventDefault();
                try {
                    showInlineFeedbackImagePreview(fileObj, dataUrl);
                } catch (_) {}
            });

            imageLabel.appendChild(clearBtn);
            previewContainer.appendChild(imageLabel);
        } catch (e) {
            console.warn("Failed to show image preview:", e);
        }
    }

    function showInlineFeedbackImagePreview(fileObj, dataUrl) {
        try {
            if (document.getElementById("inlineImagePreviewOverlay")) return;

            function cleanup() {
                try {
                    const inp = document.getElementById("inline_feedback_image_input");
                    if (inp) inp.value = "";
                } catch (_) {}
                try {
                    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
                } catch (_) {}
                try {
                    window.__inlineFeedbackImageFile = null;
                    const previewContainer = document.getElementById("inline_feedback_image_preview");
                    if (previewContainer && previewContainer.parentNode) {
                        previewContainer.parentNode.removeChild(previewContainer);
                    }
                } catch (_) {}
            }

            cancelBtn.addEventListener("click", cleanup);

            sendBtn.addEventListener("click", function () {
                try {
                    const fd = new FormData();
                    fd.append("project_id", getMeta("project-id") || "");
                    fd.append(
                        "employee_id",
                        document
                            .getElementById("projectFeedbackModal")
                            ?.getAttribute("data-employee-id") || ""
                    );

                    const imageFileToUse = window.__inlineFeedbackImageFile || fileObj;
                    if (imageFileToUse) fd.append("feedback_image", imageFileToUse);

                    const origText = sendBtn.innerHTML;
                    sendBtn.disabled = true;
                    sendBtn.innerHTML =
                        '<span class="spinner-border spinner-border-sm me-1"></span>Sending...';

                    fetch(getMeta("app-url").replace(/\/$/, "") + "/project-feedbacks", {
                        method: "POST",
                        headers: {
                            "X-CSRF-TOKEN": document
                                .querySelector('meta[name="csrf-token"]')
                                .getAttribute("content"),
                        },
                        body: fd,
                    })
                        .then((res) => {
                            if (!res.ok) return res.json().then((j) => Promise.reject(j));
                            return res.json();
                        })
                        .then((data) => {
                            window.showFloatingAlert &&
                                window.showFloatingAlert("Feedback submitted", "success", 2000);
                            try {
                                loadFeedbackData(getMeta("project-id"));
                            } catch (_) {}
                            cleanup();
                        })
                        .catch((err) => {
                            let msg = "Failed to submit feedback";
                            if (err?.errors) msg = Object.values(err.errors).join("\n");
                            else if (err?.message) msg = err.message;
                            window.showFloatingAlert &&
                                window.showFloatingAlert(msg, "warning", 4000);
                        })
                        .finally(() => {
                            sendBtn.disabled = false;
                            sendBtn.innerHTML = origText;
                        });
                } catch (_) {}
            });
        } catch (_) {}
    }

    function renderProjectTaskFeedbackFilesPreview() {
        try {
            var preview = document.getElementById("task_feedback_files_preview");
            if (!preview) {
                var form = document.getElementById("addFeedbackForm");
                if (form) {
                    preview = document.createElement("div");
                    preview.id = "task_feedback_files_preview";
                    preview.className = "mt-2";
                    form.appendChild(preview);
                }
            }
            if (!preview) return;

            var sel = window.taskFeedbackSelectedFiles || [];
            preview.innerHTML = "";

            if (!sel.length) return;

            var listWrap = document.createElement("div");
            listWrap.className = "selected-files-list mt-2";

            sel.forEach(function (f, idx) {
                try {
                    var item = document.createElement("div");
                    item.className = "d-flex align-items-center gap-2 p-2 rounded bg-light selected-task mb-2";

                    var iconWrap = document.createElement("div");
                    var iconName = getFileTypeIcon(f.name || '');
                    iconWrap.innerHTML = '<span class="material-symbols-outlined">' + iconName + '</span>';
                    iconWrap.style.fontSize = "10px";
                    iconWrap.style.textAlign = "center";

                    var name = document.createElement("span");
                    name.className = "flex-grow-1";
                    name.style.fontSize = "10px";
                    var sizeMb = (f.size || 0) / 1024 / 1024;
                    name.textContent = (f.name || "") + (isFinite(sizeMb) ? " (" + sizeMb.toFixed(2) + " MB)" : "");

                    var rm = document.createElement("button");
                    rm.type = "button";
                    rm.className = "btn btn-sm btn-remove-task remove-task";
                    rm.style.lineHeight = "1";
                    rm.style.fontSize = "10px";
                    rm.innerHTML = '<span class="material-symbols-outlined">close</span>';
                    rm.addEventListener("click", function () {
                        try {
                            window.taskFeedbackSelectedFiles.splice(idx, 1);
                            renderProjectTaskFeedbackFilesPreview();
                        } catch (_) {}
                    });

                    item.appendChild(iconWrap);
                    item.appendChild(name);
                    item.appendChild(rm);
                    listWrap.appendChild(item);
                } catch (_) {}
            });

            preview.appendChild(listWrap);
        } catch (e) {}
    }

    function renderTaskProjectEditFeedbackFilesPreview() {
        try {
            var preview = document.getElementById("task_edit_feedback_files_preview");
            if (!preview) return;

            var sel = window.taskEditFeedbackSelectedFiles || [];
            preview.innerHTML = "";

            if (!sel.length) return;

            var listWrap = document.createElement("div");
            listWrap.className = "selected-files-list mt-2";

            sel.forEach(function (f, idx) {
                try {
                    var item = document.createElement("div");
                    item.className = "d-flex align-items-center gap-2 p-2 rounded bg-light selected-task mb-2";

                    var iconWrap = document.createElement("div");
                    var iconName = getFileTypeIcon(f.name || '');
                    iconWrap.innerHTML = '<span class="material-symbols-outlined">' + iconName + '</span>';
                    iconWrap.style.fontSize = "10px";
                    iconWrap.style.textAlign = "center";

                    var name = document.createElement("span");
                    name.className = "flex-grow-1";
                    name.style.fontSize = "10px";
                    var sizeMb = (f.size || 0) / 1024 / 1024;
                    name.textContent = (f.name || "") + (isFinite(sizeMb) ? " (" + sizeMb.toFixed(2) + " MB)" : "");

                    var rm = document.createElement("button");
                    rm.type = "button";
                    rm.className = "btn btn-sm btn-remove-task remove-task";
                    rm.style.lineHeight = "1";
                    rm.style.fontSize = "10px";
                    rm.innerHTML = '<span class="material-symbols-outlined">close</span>';
                    rm.addEventListener("click", function () {
                        try {
                            window.taskEditFeedbackSelectedFiles.splice(idx, 1);
                            renderTaskProjectEditFeedbackFilesPreview();
                        } catch (_) {}
                    });

                    item.appendChild(iconWrap);
                    item.appendChild(name);
                    item.appendChild(rm);
                    listWrap.appendChild(item);
                } catch (_) {}
            });

            preview.appendChild(listWrap);
        } catch (e) {}
    }

    function loadProjectTaskFeedbackData(taskId) {
        const modalBody = document.getElementById("projectTaskFeedbackList");
        modalBody.innerHTML =
            '<div class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';

        $.ajax({
            url: appUrl + "/task-feedbacks/" + taskId,
            type: "GET",
            dataType: "json",
            cache: false,
            success: function (response) {
                if (response.data && response.data.length > 0) {
                    let feedbackHtml = "";
                    response.data.forEach(function (feedback) {
                        const feedbackModalEl = document.getElementById("projectTaskFeedbackModal");
                        const currentEmployeeId = parseInt(
                            (feedbackModalEl?.dataset?.employeeId || feedbackModalEl?.getAttribute('data-employee-id') || '0'),
                            10
                        ) || 0;

                        let formattedDate = "";
                        if (feedback.created_at) {
                            formattedDate = timeAgo(feedback.created_at);
                        }

                                                let topImageUrl = feedback.image || '';
                                                if (topImageUrl) {
                                                    const isAbs = typeof topImageUrl === 'string' && (topImageUrl.startsWith('http://') || topImageUrl.startsWith('https://'));
                                                    const isFileTask = typeof topImageUrl === 'string' && (topImageUrl.startsWith('/file/task/') || topImageUrl.startsWith('file/task/'));
                                                    const isStorage = typeof topImageUrl === 'string' && (topImageUrl.startsWith('/storage/') || topImageUrl.startsWith('storage/'));
                                                    if (!isAbs && !isFileTask && !isStorage) {
                                                        topImageUrl = appUrl + '/file/task/' + topImageUrl;
                                                    } else if (!isAbs && (isFileTask || isStorage)) {
                                                        topImageUrl = topImageUrl.startsWith('/') ? (appUrl + topImageUrl) : (appUrl + '/' + topImageUrl);
                                                    }
                                                }
                                                let topRefFiles = [];
                                                let topRfVal = feedback.reference_files;
                                                if (!Array.isArray(topRfVal) && typeof topRfVal === 'string') {
                                                    try { const parsed = JSON.parse(topRfVal); if (Array.isArray(parsed)) topRfVal = parsed; } catch(_) { /* noop */ }
                                                }
                                                if (Array.isArray(topRfVal) && topRfVal.length > 0) {
                                                    topRefFiles = topRfVal.map((f) => {
                                                        if (!f) return null;
                                                        const isAbs = typeof f === 'string' && (f.startsWith('http://') || f.startsWith('https://'));
                                                        const isRefPath = typeof f === 'string' && (f.startsWith('/file/task_reference_files/') || f.startsWith('file/task_reference_files/'));
                                                        if (!isAbs && !isRefPath) return appUrl + '/file/task_reference_files/' + f;
                                                        if (!isAbs && isRefPath) return f.startsWith('/') ? (appUrl + f) : (appUrl + '/' + f);
                                                        return f;
                                                    }).filter(Boolean);
                                                } else {
                                                    let singleTop = feedback.reference_file || '';
                                                    if (singleTop) {
                                                        const isAbs2 = typeof singleTop === 'string' && (singleTop.startsWith('http://') || singleTop.startsWith('https://'));
                                                        const isRefPath2 = typeof singleTop === 'string' && (singleTop.startsWith('/file/task_reference_files/') || singleTop.startsWith('file/task_reference_files/'));
                                                        if (!isAbs2 && !isRefPath2) singleTop = appUrl + '/file/task_reference_files/' + singleTop;
                                                        else if (!isAbs2 && isRefPath2) singleTop = singleTop.startsWith('/') ? (appUrl + singleTop) : (appUrl + '/' + singleTop);
                                                        topRefFiles = [singleTop];
                                                    }
                                                }

                                                let topRefUrls = [];
                                                let topRuVal = feedback.reference_urls;
                                                if (!Array.isArray(topRuVal) && typeof topRuVal === 'string') {
                                                    try { const parsed2 = JSON.parse(topRuVal); if (Array.isArray(parsed2)) topRuVal = parsed2; } catch(_) { /* noop */ }
                                                }
                                                if (Array.isArray(topRuVal) && topRuVal.length > 0) {
                                                    topRefUrls = topRuVal.filter((u) => typeof u === 'string' && u.trim() !== '');
                                                } else if (feedback.reference_url) {
                                                    topRefUrls = [feedback.reference_url];
                                                }

                                                const topAuthorId = (feedback.employee && (feedback.employee.id || feedback.employee.employee_id)) || feedback.employee_id || 0;
                                                const canEditTop = String(topAuthorId) === String(currentEmployeeId);
                                                const topCanEdit = canEditTop;

                                    let repliesHtml = '';
                                    let viewRepliesBtnHtml = '';
                                    let repliesContainerHtml = '';
                                    if (Array.isArray(feedback.replies) && feedback.replies.length > 0) {
                                        const repliesCount = feedback.replies.length;
                                        const repliesContent = feedback.replies.map(function (rep) {
                                let rDate = '';
                                if (rep.created_at) {
                                    rDate = timeAgo(rep.created_at);
                                }
                                                                let repImageUrl = rep.image || '';
                                                                if (repImageUrl) {
                                                                    const isAbs = typeof repImageUrl === 'string' && (repImageUrl.startsWith('http://') || repImageUrl.startsWith('https://'));
                                                                    const isFileTask = typeof repImageUrl === 'string' && (repImageUrl.startsWith('/file/task/') || repImageUrl.startsWith('file/task/'));
                                                                    const isStorage = typeof repImageUrl === 'string' && (repImageUrl.startsWith('/storage/') || repImageUrl.startsWith('storage/'));
                                                                    if (!isAbs && !isFileTask && !isStorage) {
                                                                        repImageUrl = appUrl + '/file/task/' + repImageUrl;
                                                                    } else if (!isAbs && (isFileTask || isStorage)) {
                                                                        repImageUrl = repImageUrl.startsWith('/') ? (appUrl + repImageUrl) : (appUrl + '/' + repImageUrl);
                                                                    }
                                                                }
                                                                let repRefFiles = [];
                                                                let repRfVal = rep.reference_files;
                                                                if (!Array.isArray(repRfVal) && typeof repRfVal === 'string') {
                                                                    try { const parsed = JSON.parse(repRfVal); if (Array.isArray(parsed)) repRfVal = parsed; } catch(_) { /* noop */ }
                                                                }
                                                                if (Array.isArray(repRfVal) && repRfVal.length > 0) {
                                                                    repRefFiles = repRfVal.map((f) => {
                                                                        if (!f) return null;
                                                                        const isAbs = typeof f === 'string' && (f.startsWith('http://') || f.startsWith('https://'));
                                                                        const isRefPath = typeof f === 'string' && (f.startsWith('/file/task_reference_files/') || f.startsWith('file/task_reference_files/'));
                                                                        if (!isAbs && !isRefPath) return appUrl + '/file/task_reference_files/' + f;
                                                                        if (!isAbs && isRefPath) return f.startsWith('/') ? (appUrl + f) : (appUrl + '/' + f);
                                                                        return f;
                                                                    }).filter(Boolean);
                                                                } else {
                                                                    let singleRep = rep.reference_file || '';
                                                                    if (singleRep) {
                                                                        const isAbs2 = typeof singleRep === 'string' && (singleRep.startsWith('http://') || singleRep.startsWith('https://'));
                                                                        const isRefPath = typeof singleRep === 'string' && (singleRep.startsWith('/file/task_reference_files/') || singleRep.startsWith('file/task_reference_files/'));
                                                                        if (!isAbs2 && !isRefPath) singleRep = appUrl + '/file/task_reference_files/' + singleRep;
                                                                        else if (!isAbs2 && isRefPath) singleRep = singleRep.startsWith('/') ? (appUrl + singleRep) : (appUrl + '/' + singleRep);
                                                                        repRefFiles = [singleRep];
                                                                    }
                                                                }
                                                                let repRefUrls = [];
                                                                let repRuVal = rep.reference_urls;
                                                                if (!Array.isArray(repRuVal) && typeof repRuVal === 'string') {
                                                                    try { const parsed = JSON.parse(repRuVal); if (Array.isArray(parsed)) repRuVal = parsed; } catch(_) { /* noop */ }
                                                                }
                                                                if (Array.isArray(repRuVal) && repRuVal.length > 0) {
                                                                    repRefUrls = repRuVal.filter((u) => typeof u === 'string' && u.trim() !== '');
                                                                } else if (rep.reference_url) {
                                                                    repRefUrls = [rep.reference_url];
                                                                }
                                                                const repAuthorId = (rep.employee && (rep.employee.id || rep.employee.employee_id)) || rep.employee_id || 0;
                                                                const canEditReply = String(repAuthorId) === String(currentEmployeeId);
                                                                const canEditRep = canEditReply;

                                                                return `
                                                                            <div class="feedback-reply ms-4 mt-2 p-2 rounded" data-reply-id="${rep.id}" data-parent-id="${feedback.id}" style="background: rgb(240, 241, 248);">
                                                                                <div class="d-flex align-items-start mb-1">
                                                                                    <img src="${rep.employee.photo}" alt="${rep.employee.name}" class="rounded-circle me-3" style="width: 24px; height: 24px; object-fit: cover;">
                                                                                    <div class="flex-grow-1">
                                                                                        <div>
                                                                                            <strong style="font-size:12px; font-weight:600;">${rep.employee.name}</strong>
                                                                                            <div><small class="text-muted d-block" style="font-size:9px;">${rDate}</small></div>
                                                                                        </div>

                                                                                        <div class="feedback-comment mt-2">
                                                                                            <p class="mb-1" style="font-size: 13px;">${rep.feedback_comment || ''}</p>

                                                                                            ${
                                                                                                ((Array.isArray(repRefUrls) && repRefUrls.length > 0) || (Array.isArray(repRefFiles) && repRefFiles.length > 0))
                                                                                                    ? `
                                                                                                        <div class="feedback-reference-container mb-1">
                                                                                                        ${Array.isArray(repRefUrls) && repRefUrls.length > 0
                                                                                                            ? repRefUrls.map((u) => {
                                                                                                                const shortUrl = u.replace(/^https?:\/\//, '').replace(/\/$/, '');
                                                                                                                return `<a href="${u}" target="_blank" class="feedback-reference-url me-2">
                                                                                                                            <span class="material-symbols-outlined">link</span> ${shortUrl}
                                                                                                                        </a>`;
                                                                                                            }).join('')
                                                                                                            : ''}

                                                                                                        ${Array.isArray(repRefFiles) && repRefFiles.length > 0
                                                                                                            ? repRefFiles.map((u) => {
                                                                                                                const fileName = u.split('/').pop();
                                                                                                                return `<a href="${u}" download class="feedback-reference-file ms-2">
                                                                                                                            <span class="material-symbols-outlined">draft</span> ${fileName}
                                                                                                                        </a>`;
                                                                                                            }).join('')
                                                                                                            : ''}
                                                                                                        </div>
                                                                                                    `
                                                                                                    : ''
                                                                                            }

                                                                                            ${repImageUrl ? `<img src="${repImageUrl}" class="img-fluid rounded reply-image" style="width: 70px; height: auto; border-radius: 8px; cursor: pointer;">` : ''}

                                                                                                                            <div class="reply-actions mt-2 d-flex gap-4">
                                                                                                                                <span class="d-flex align-items-center feedback-reply-trigger" data-feedback-id="${feedback.id}" data-task-id="${taskId}" style="cursor:pointer; color:#555; font-size:12px;"><span class="material-symbols-outlined" style="font-size:18px; line-height:1; margin-right:5px;">reply</span><span>Reply</span></span>
                                                                                                                                ${canEditRep ? `<span class="d-flex align-items-center reply-edit-trigger" data-task-id="${taskId}" data-parent-id="${feedback.id}" data-reply-id="${rep.id}" data-comment="${encodeURIComponent(rep.feedback_comment || '')}" data-ref-url="${encodeURIComponent(rep.reference_url || '')}" data-ref-urls="${encodeURIComponent(JSON.stringify(repRefUrls || []))}" data-ref-file="${encodeURIComponent((repRefFiles && repRefFiles[0]) || '')}" data-ref-files="${encodeURIComponent(JSON.stringify(repRefFiles || []))}" data-image="${encodeURIComponent(repImageUrl || '')}" style="cursor:pointer; color:#555; font-size:12px;"><span class="material-symbols-outlined" style="font-size:18px; line-height:1; margin-right:5px;">edit</span><span>Edit</span></span>` : ''}
                                                                                                                                ${canEditRep ? `<span class="d-flex align-items-center reply-delete-trigger" data-reply-id="${rep.id}" data-parent-id="${feedback.id}" style="cursor:pointer; color:#555; font-size:12px;"><span class="material-symbols-outlined" style="font-size:18px; line-height:1; margin-right:5px;">delete</span><span>Delete</span></span>` : ''}
                                                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                `;
                                                        }).join('');

                                                        viewRepliesBtnHtml = `<button type="button" class="btn btn-link p-0 view-replies-toggle feedback-toggle-replies" data-feedback-id="${feedback.id}" data-replies-count="${repliesCount}" style="font-size: 13px; color:#555; text-decoration: none;">View all (${repliesCount})</button>`;
                                                        repliesContainerHtml = `<div class="feedback-replies d-none" id="replies-${feedback.id}">${repliesContent}</div>`;
                                                }
                                                feedbackHtml += `
                                                <div class="feedback-item mb-3 p-3" data-feedback-id="${feedback.id}">
                                                    <div class="d-flex align-items-start mb-2">
                                                        <img src="${feedback.employee.photo}" alt="${feedback.employee.name}" class="rounded-circle me-3" style="width: 32px; height: 32px; object-fit: cover;">
                                                        <div class="flex-grow-1">
                                                            <div>
                                                                <strong style="font-size:14px; font-weight:600;">${feedback.employee.name}</strong>
                                                                <div><small class="text-muted d-block" style="font-size: 10px;">${formattedDate}</small></div>
                                                            </div>

                                                            <div class="feedback-comment mt-2">
                                                                <p class="mb-2" style="font-size:13px;">${feedback.feedback_comment}</p>

                                                                ${
                                ((Array.isArray(topRefUrls) && topRefUrls.length > 0) || (Array.isArray(topRefFiles) && topRefFiles.length > 0))
                                    ? `
                                <div class="feedback-reference-container mb-2">
                                    ${Array.isArray(topRefUrls) && topRefUrls.length > 0
                                    ? topRefUrls.map((u) => {
                                        const shortUrl = u.replace(/^https?:\/\//, '').replace(/\/$/, '');
                                        return `<a href="${u}" target="_blank" class="feedback-reference-url bg-light rounded-2">
                                                    <span class="material-symbols-outlined" style="color: #444444;">link</span> ${shortUrl}
                                                </a>`;
                                        }).join('')
                                    : ''}

                                    ${Array.isArray(topRefFiles) && topRefFiles.length > 0
                                    ? topRefFiles.map((u) => {
                                        const fileName = u.split('/').pop();
                                        return `<a href="${u}" class="feedback-reference-file bg-light rounded-2">
                                                    <span class="material-symbols-outlined" style="color: #444444;">draft</span> ${fileName}
                                                </a>`;
                                        }).join('')
                                    : ''}
                                </div>
                            `
                                    : ""
                            }

                                                                ${
                                topImageUrl
                                    ? `<img src="${topImageUrl}" class="img-fluid rounded mb-2 feedback-image" style="width: 70px; height: auto; border-radius: 8px; cursor: pointer;">`
                                    : ""
                            }

                                                                <div class="feedback-actions mt-2 d-flex gap-4 align-items-center">
                                                                    <span class="d-flex align-items-center feedback-reply-trigger" data-feedback-id="${feedback.id}" data-task-id="${taskId}" style="cursor:pointer; color:#555; font-size:12px;"><span class="material-symbols-outlined" style="font-size:18px; line-height:1; margin-right:5px;">reply</span><span>Reply</span></span>
                                                                    ${topCanEdit ? `<span class="d-flex align-items-center feedback-edit-trigger" data-feedback-id="${feedback.id}" data-task-id="${taskId}" data-comment="${encodeURIComponent(feedback.feedback_comment || '')}" data-ref-url="${encodeURIComponent(feedback.reference_url || '')}" data-ref-urls="${encodeURIComponent(JSON.stringify(topRefUrls || []))}" data-ref-file="${encodeURIComponent((topRefFiles && topRefFiles[0]) || '')}" data-ref-files="${encodeURIComponent(JSON.stringify(topRefFiles || []))}" data-image="${encodeURIComponent(topImageUrl || '')}" style="cursor:pointer; color:#555; font-size:12px;"><span class="material-symbols-outlined" style="font-size:18px; line-height:1; margin-right:5px;">edit</span><span>Edit</span></span>` : ''}
                                                                    ${topCanEdit ? `<span class="d-flex align-items-center feedback-delete-trigger" data-feedback-id="${feedback.id}" style="cursor:pointer; color:#555; font-size:12px;"><span class="material-symbols-outlined" style="font-size:18px; line-height:1; margin-right:5px;">delete</span><span>Delete</span></span>` : ''}
                                                                    ${viewRepliesBtnHtml}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ${repliesContainerHtml}
                                                </div>
                                            `;
                    });
                    modalBody.innerHTML = feedbackHtml;

                    modalBody.querySelectorAll('.feedback-reply-trigger').forEach(function (btn) {
                        btn.addEventListener('click', function () {
                            const parentId = this.getAttribute('data-feedback-id');
                            const tId = this.getAttribute('data-task-id');
                            showReplyFeedbackTaskForm(tId, parentId);
                        });
                    });

                    modalBody.querySelectorAll('.feedback-edit-trigger').forEach(function (btn) {
                        btn.addEventListener('click', function () {
                            const tId = this.getAttribute('data-task-id');
                            const fid = this.getAttribute('data-feedback-id');
                            const payload = {
                                id: fid,
                                parent_id: null,
                                feedback_comment: decodeURIComponent(this.getAttribute('data-comment') || ''),
                                reference_url: decodeURIComponent(this.getAttribute('data-ref-url') || ''),
                                reference_urls: (function(){ try { return JSON.parse(decodeURIComponent(this.getAttribute('data-ref-urls') || '[]')); } catch(e){ return []; } }).call(this),
                                reference_file_url: decodeURIComponent(this.getAttribute('data-ref-file') || ''),
                                reference_files_urls: (function(){ try { return JSON.parse(decodeURIComponent(this.getAttribute('data-ref-files') || '[]')); } catch(e){ return []; } }).call(this),
                                image_url: decodeURIComponent(this.getAttribute('data-image') || ''),
                            };

                            const inlineEditor = document.getElementById("inline_task_feedback_editor");
                            if (inlineEditor && typeof window.startInlineProjectTaskEditFeedback === "function") {
                                try {
                                    window.startInlineProjectTaskEditFeedback(payload);
                                    try { inlineEditor.scrollIntoView({ behavior: "smooth", block: "center" }); } catch (_) {}
                                    return;
                                } catch (_) {}
                            }
                            showEditFeedbackTaskForm(tId, payload, false);
                        });
                    });

                    modalBody.querySelectorAll('.reply-edit-trigger').forEach(function (btn) {
                        btn.addEventListener('click', function () {
                            const tId = this.getAttribute('data-task-id');
                            const rid = this.getAttribute('data-reply-id');
                            const pid = this.getAttribute('data-parent-id');
                            const payload = {
                                id: rid,
                                parent_id: pid,
                                feedback_comment: decodeURIComponent(this.getAttribute('data-comment') || ''),
                                reference_url: decodeURIComponent(this.getAttribute('data-ref-url') || ''),
                                reference_urls: (function(){ try { return JSON.parse(decodeURIComponent(this.getAttribute('data-ref-urls') || '[]')); } catch(e){ return []; } }).call(this),
                                reference_file_url: decodeURIComponent(this.getAttribute('data-ref-file') || ''),
                                reference_files_urls: (function(){ try { return JSON.parse(decodeURIComponent(this.getAttribute('data-ref-files') || '[]')); } catch(e){ return []; } }).call(this),
                                image_url: decodeURIComponent(this.getAttribute('data-image') || ''),
                            };

                            const inlineEditor = document.getElementById("inline_task_feedback_editor");
                            if (inlineEditor && typeof window.startInlineProjectTaskEditFeedback === "function") {
                                try {
                                    window.startInlineProjectTaskEditFeedback(payload);
                                    try { inlineEditor.scrollIntoView({ behavior: "smooth", block: "center" }); } catch (_) {}
                                    return;
                                } catch (_) {}
                            }
                            showEditFeedbackTaskForm(tId, payload, true);
                        });
                    });

                    modalBody.querySelectorAll('.view-replies-toggle').forEach(function (btn) {
                        btn.addEventListener('click', function () {
                            const fid = this.getAttribute('data-feedback-id');
                            const count = this.getAttribute('data-replies-count');
                            const container = modalBody.querySelector('#replies-' + fid);
                            if (!container) return;
                            const hidden = container.classList.contains('d-none');
                            if (hidden) {
                                container.classList.remove('d-none');
                                this.textContent = 'Hide';
                            } else {
                                container.classList.add('d-none');
                                this.textContent = `View all (${count})`;
                            }
                            this.style.textDecoration = 'none';
                            this.style.color = '#555';
                        });
                    });

                    (function(){
                        function ensureImagePreviewModalExists() {
                            if (document.getElementById('taskImagePreviewModal')) return;
                            const html = `
                                <div class="modal fade" id="taskImagePreviewModal" tabindex="-1" aria-hidden="true">
                                    <div class="modal-dialog modal-dialog-centered" id="taskImageDialog">
                                        <div class="modal-content modal-content-custom bg-light border-0">
                                            <div class="modal-body p-0 d-flex align-items-center justify-content-center" style="max-height:80vh;">
                                                <img id="taskImagePreviewModalImg" src="" alt="Preview image" style="display:block; max-width:100%; max-height:80vh; object-fit:contain;">
                                            </div>
                                            <div class="modal-footer modal-footer-custom border-0 justify-content-center">
                                                <button type="button" class="btn btn-custom-close" data-bs-dismiss="modal">Close</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>`;

                                $(document).on('click', '.feedback-image', function(e) {
                                    e.preventDefault()
                                    const imgSrc = $(this).attr('src') || $(this).data('img')
                                    const $img = $('#taskImagePreviewModalImg')
                                    const $dialog = $('#taskImageDialog')
                                    $img.off('load')
                                    $img.attr('src', imgSrc)
                                    $('#taskImagePreviewModal').modal('show')
                                    $img.on('load', function() {
                                        try {
                                            const naturalW = this.naturalWidth || 0
                                            const naturalH = this.naturalHeight || 0
                                            const viewportW = window.innerWidth * 0.8
                                            const viewportH = window.innerHeight * 0.7
                                            const ratio = Math.min(viewportW / Math.max(naturalW,1), viewportH / Math.max(naturalH,1), 0.9)
                                            const modalWidth = Math.round(naturalW * ratio)
                                            $dialog.css({ 'max-width': modalWidth + 'px' })
                                        } catch(_) {}
                                    })
                                })
                            try { document.body.insertAdjacentHTML('beforeend', html); } catch(_){ }
                        }

                        function showImageInModal(src, filename) {
                            try {
                                ensureImagePreviewModalExists();
                                const modalEl = document.getElementById('taskImagePreviewModal');
                                const imgEl = document.getElementById('taskImagePreviewModalImg');
                                const dlEl = document.getElementById('taskImagePreviewDownload');
                                if (imgEl) imgEl.src = src;

                                const parentIds = ['projectTaskFeedbackModal', 'taskDetailModal', 'projectDetailModal'];
                                let parentModalEl = null;
                                let parentWasOpen = false;
                                try {
                                    for (let i = 0; i < parentIds.length; i++) {
                                        const id = parentIds[i];
                                        const el = document.getElementById(id);
                                        if (el && el.classList && el.classList.contains('show')) {
                                            parentModalEl = el;
                                            parentWasOpen = true;
                                            break;
                                        }
                                    }
                                } catch(_) {}

                                try {
                                    if (parentWasOpen && parentModalEl) {
                                        try { window.__suppressFeedbackBackdropRemoval = true; } catch(_) {}
                                        const pmInst = bootstrap.Modal.getInstance(parentModalEl) || new bootstrap.Modal(parentModalEl);
                                        try { pmInst.hide(); } catch(_) {}
                                    }
                                } catch(_) {}

                                const inst = bootstrap.Modal.getOrCreateInstance(modalEl) || new bootstrap.Modal(modalEl);

                                const onPreviewHidden = function() {
                                    try { inst._element.removeEventListener('hidden.bs.modal', onPreviewHidden); } catch(_) {}
                                    try {
                                        if (parentWasOpen && parentModalEl) {
                                            try { window.__suppressFeedbackBackdropRemoval = false; } catch(_) {}
                                            const pm2 = bootstrap.Modal.getOrCreateInstance(parentModalEl) || new bootstrap.Modal(parentModalEl);
                                            try { pm2.show(); } catch(_) {}
                                        }
                                    } catch(_) {}
                                };
                                try { inst._element.addEventListener('hidden.bs.modal', onPreviewHidden); } catch(_) {}
                                inst.show();
                            } catch (e) { try { window.open(src, '_blank'); } catch(_) {} }
                        }

                        modalBody.querySelectorAll('.feedback-image, .reply-image').forEach(function (img) {
                            try { img.replaceWith(img.cloneNode(true)); } catch(_) {}
                        });
                        modalBody.querySelectorAll('.feedback-image, .reply-image').forEach(function (img) {
                            img.addEventListener('click', function (ev) {
                                ev.preventDefault();
                                ev.stopPropagation();
                                const src = this.getAttribute('src') || this.dataset.src;
                                if (!src) return;
                                let filename = (src.split('/').pop() || '').split('?')[0];
                                showImageInModal(src, filename);
                            });
                        });
                    })();

                        modalBody.querySelectorAll('.feedback-delete-trigger').forEach(function (btn) {
                            btn.addEventListener('click', function () {
                                const fid = this.getAttribute('data-feedback-id');
                                if (!fid) return;
                                const authorName = (this.closest('.feedback-item')?.querySelector('strong')?.textContent) || '';
                                const content = (this.closest('.feedback-item')?.querySelector('.task-description, p, .task-description-container p, .task-description')?.textContent) || '';
                                const avatarUrl = (this.closest('.feedback-item')?.querySelector('img')?.getAttribute('src')) || '';
                                showDeleteConfirmModal({ type: 'feedback', id: fid, authorName: authorName, content: content, avatarUrl: avatarUrl, onConfirm: function(done){
                                    const url = appUrl + '/task-feedbacks/' + fid;
                                    $.ajax({
                                        url: url,
                                        type: 'DELETE',
                                        headers: {
                                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                                        },
                                        success: function (res) {
                                            try { if (typeof showFloatingAlert === 'function') showFloatingAlert(res.message || 'Feedback deleted', 'success'); } catch(_){ }
                                            const el = modalBody.querySelector(`.feedback-item[data-feedback-id="${fid}"]`);
                                            if (el && el.parentNode) el.parentNode.removeChild(el);
                                            try { $.ajax({ url: appUrl + '/task-feedbacks/count/' + (modalBody.closest('#projectTaskFeedbackModal')?.dataset?.taskId || '') , type: 'GET', success: function(c){ if (c && c.data && typeof c.data.count === 'number') { const card = document.querySelector('.custom-card[data-task-id="' + (modalBody.closest('#projectTaskFeedbackModal')?.dataset?.taskId || '') + '"]'); if (card) { let span = card.querySelector('.feedback-comments-count'); if (span) { span.textContent = String(c.data.count); } } } } }); } catch(_){ }
                                            done(true);
                                        },
                                        error: function (xhr) {
                                            let msg = 'Failed to delete feedback';
                                            if (xhr.responseJSON && xhr.responseJSON.message) msg = xhr.responseJSON.message;
                                            try { if (typeof showFloatingAlert === 'function') showFloatingAlert(msg, 'danger'); } catch(_) { alert(msg); }
                                            done(false);
                                        }
                                    });
                                }});
                            });
                        });

                        modalBody.querySelectorAll('.reply-delete-trigger').forEach(function (btn) {
                            btn.addEventListener('click', function () {
                                const rid = this.getAttribute('data-reply-id');
                                const pid = this.getAttribute('data-parent-id');
                                if (!rid) return;
                                const authorName = (this.closest('.feedback-reply')?.querySelector('strong')?.textContent) || '';
                                const content = (this.closest('.feedback-reply')?.querySelector('p')?.textContent) || '';
                                const avatarUrl = (this.closest('.feedback-reply')?.querySelector('img')?.getAttribute('src')) || '';
                                showDeleteConfirmModal({ type: 'reply', id: rid, parentId: pid, authorName: authorName, content: content, avatarUrl: avatarUrl, onConfirm: function(done){
                                    const url = appUrl + '/task-feedbacks/' + rid;
                                    $.ajax({
                                        url: url,
                                        type: 'DELETE',
                                        headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content') },
                                        success: function (res) {
                                            try { if (typeof showFloatingAlert === 'function') showFloatingAlert(res.message || 'Reply deleted', 'success'); } catch(_){}

                                            const el = modalBody.querySelector(`.feedback-reply[data-reply-id="${rid}"][data-parent-id="${pid}"]`);
                                            if (el && el.parentNode) el.parentNode.removeChild(el);

                                            const repliesContainer = modalBody.querySelector(`#replies-${pid}`);
                                            const viewAllBtn = modalBody.querySelector(`.view-replies-toggle[data-feedback-id="${pid}"]`);

                                            if (repliesContainer && viewAllBtn) {
                                                const remainingReplies = repliesContainer.querySelectorAll('.feedback-reply');
                                                const remainingCount = remainingReplies.length;

                                                if (remainingCount === 0) {
                                                    viewAllBtn.remove();
                                                    repliesContainer.remove();
                                                } else {
                                                    viewAllBtn.setAttribute('data-replies-count'    , remainingCount);
                                                    const isVisible = !repliesContainer.classList.contains('d-none');
                                                    if (isVisible) {
                                                        viewAllBtn.textContent = 'Hide';
                                                    } else {
                                                        viewAllBtn.textContent = `View all (${remainingCount})`;
                                                    }
                                                }
                                            }

                                            try {
                                                $.ajax({
                                                    url: appUrl + "/task-feedbacks/count/" + (modalBody.closest('#projectTaskFeedbackModal')?.dataset?.taskId || ''),
                                                    type: 'GET',
                                                    success: function(c){
                                                        if (c && c.data && typeof c.data.count === 'number') {
                                                            const card = document.querySelector('.custom-card[data-task-id="' + (modalBody.closest('#projectTaskFeedbackModal')?.dataset?.taskId || '') + '"]');
                                                            if (card) {
                                                                let span = card.querySelector('.feedback-comments-count');
                                                                if (span) {
                                                                    span.textContent = String(c.data.count);
                                                                    if (c.data.count === 0) {
                                                                        span.style.display = 'none';
                                                                    } else {
                                                                        span.style.display = '';
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                });
                                            } catch(_) {}

                                            done(true);
                                        },
                                        error: function (xhr) {
                                            let msg = 'Failed to delete reply';
                                            if (xhr.responseJSON && xhr.responseJSON.message) msg = xhr.responseJSON.message;
                                            try { if (typeof showFloatingAlert === 'function') showFloatingAlert(msg, 'danger'); } catch(_) { alert(msg); }
                                            done(false);
                                        }
                                    });
                                }});
                            });
                        });

                    try {
                        const target = (window.__taskLatestTarget && window.__taskLatestTarget[String(taskId)]) || null;
                        if (target && target.id) {
                            if (target.parent_id) {
                                const wrap = modalBody.querySelector(`.feedback-replies-wrap .feedback-toggle-replies[data-feedback-id="${target.parent_id}"]`);
                                if (wrap) {
                                    const container = modalBody.querySelector('#replies-' + target.parent_id);
                                    if (container && container.classList.contains('d-none')) {
                                        container.classList.remove('d-none');
                                    }
                                    wrap.textContent = 'Hide';
                                }
                                const replyEl = modalBody.querySelector(`.feedback-reply[data-reply-id="${target.id}"][data-parent-id="${target.parent_id}"]`);
                                if (replyEl) {
                                    replyEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    replyEl.style.transition = 'background-color 0.3s ease';
                                    const old = replyEl.style.backgroundColor;
                                    replyEl.style.backgroundColor = '#fff3cd';
                                    setTimeout(() => { replyEl.style.backgroundColor = old || '#fafafa'; }, 1200);
                                }
                            } else {
                                const topEl = modalBody.querySelector(`.feedback-item[data-feedback-id="${target.id}"]`);
                                if (topEl) {
                                    topEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    topEl.style.transition = 'background-color 0.3s ease';
                                    const old = topEl.style.backgroundColor;
                                    topEl.style.backgroundColor = '#fff3cd';
                                    setTimeout(() => { topEl.style.backgroundColor = old || ''; }, 1200);
                                }
                            }
                        }
                        if (window.__taskLatestTarget) delete window.__taskLatestTarget[String(taskId)];
                    } catch (_) {}
                } else {
                    modalBody.innerHTML =
                        '<p class="text-center text-muted">No feedback available for this task.</p>';
                }

                try {
                    if (typeof initTaskFeedbackQuillEditors === 'function') {
                        initTaskFeedbackQuillEditors(modalBody);
                    }
                } catch (_) {}

                try {
                    setupProjectTaskInlineFeedbackEditor(taskId);
                } catch (_) {}
            },
            error: function () {
                modalBody.innerHTML =
                    '<p class="text-center text-danger">Failed to load feedback.</p>';
            },
        });
    }

    function showAddFeedbackTaskForm(taskId) {
        const modalTitle = document.getElementById("projectTaskFeedbackModalLabel");
        const modalBody = document.getElementById("projectTaskFeedbackList");

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
                .getElementById("projectTaskFeedbackModal")
                .getAttribute("data-employee-id") || "";

        form.appendChild(taskIdInput);
        form.appendChild(employeeIdInput);

        const commentDiv = document.createElement("div");
        commentDiv.className = "mb-3 custom-input";

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

        const attachmentDiv = document.createElement("div");
        attachmentDiv.className = "d-flex align-items-center gap-2 mb-3";

        const photoBtn = document.createElement("button");
        photoBtn.type = "button";
        photoBtn.className = "btn btn-outline-secondary d-flex align-items-center";
        photoBtn.id = "taskFeedbackPhotoBtn";
        photoBtn.innerHTML = '<span class="material-symbols-outlined me-1">photo_camera</span>Photo';

        const fileBtn = document.createElement("button");
        fileBtn.type = "button";
        fileBtn.className = "btn btn-outline-secondary d-flex align-items-center ms-2";
        fileBtn.id = "taskFeedbackFileBtn";
        fileBtn.innerHTML = '<span class="material-symbols-outlined me-1">attach_file</span>File';

        const imageInput = document.createElement("input");
        imageInput.type = "file";
        imageInput.id = "task_feedback_image_input";
        imageInput.name = "feedback_image";
        imageInput.accept = "image/*";
        imageInput.hidden = true;

        const filesInput = document.createElement("input");
        filesInput.type = "file";
        filesInput.id = "task_feedback_files_input";
        filesInput.name = "reference_files[]";
        filesInput.accept = "image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip";
        filesInput.multiple = true;
        filesInput.hidden = true;

        attachmentDiv.appendChild(photoBtn);
        attachmentDiv.appendChild(fileBtn);
        form.appendChild(attachmentDiv);
        form.appendChild(imageInput);
        form.appendChild(filesInput);

        window.taskFeedbackSelectedFiles = window.taskFeedbackSelectedFiles || [];

        photoBtn.addEventListener('click', function() {
            imageInput.click();
        });

        fileBtn.addEventListener('click', function() {
            filesInput.click();
        });

        imageInput.addEventListener('change', function(ev) {
            try {
                var f = (this.files && this.files[0]) || null;
                if (!f) return;
                if (!f.type || f.type.indexOf("image/") !== 0) return;
                if (f.size > MAX_IMAGE_BYTES) {
                    try { if (typeof showFloatingAlert === 'function') showFloatingAlert('Image must be smaller than 10 MB.', 'warning'); } catch(_) { alert('Image must be smaller than 10 MB.'); }
                    this.value = '';
                    return;
                }

                var reader = new FileReader();
                reader.onload = function (e) {
                    try {
                        showInlineFeedbackImagePreviewSmall(f, e.target.result);
                    } catch (_) {}
                };
                reader.readAsDataURL(f);
            } catch (_) {}
        });

        filesInput.addEventListener('change', function(ev) {
            try {
                var files = Array.from(this.files || []);
                if (!files.length) return;
                window.taskFeedbackSelectedFiles = (window.taskFeedbackSelectedFiles || []).concat(files);
                renderProjectTaskFeedbackFilesPreview();
                try { this.value = ""; } catch (_) {}
            } catch (_) {}
        });

        const refUrlDiv = document.createElement("div");
        refUrlDiv.className = "mb-3 custom-input";

        const refUrlLabel = document.createElement("label");
        refUrlLabel.className = "form-label label-custom";
        refUrlLabel.textContent = "Reference URLs (Optional)";
        refUrlDiv.appendChild(refUrlLabel);

        const refUrlContainer = document.createElement("div");
        refUrlContainer.id = "task_feedback_reference_urls_container";
        refUrlContainer.className = "d-flex flex-column gap-2";

        const initialUrlRow = document.createElement("div");
        initialUrlRow.className = "d-flex gap-2 align-items-center";
        initialUrlRow.innerHTML = '<input type="url" class="form-control" name="reference_urls[]" placeholder="https://example.com">' +
            '<button type="button" class="btn btn-submit-black add-ref-url" aria-label="Add URL"><span class="material-symbols-outlined">add</span></button>';
        refUrlContainer.appendChild(initialUrlRow);

        refUrlDiv.appendChild(refUrlContainer);
        form.appendChild(refUrlDiv);

    modalBody.appendChild(form);

        setupImageInput(imageInput, imageLabel, imageClearBtn);

        form.addEventListener("submit", function (e) {
            e.preventDefault();
            submitFeedbackTaskForm(this, taskId);
        });

        setUnifiedProjectTaskFeedbackFooter(taskId, 'Submit', function(){
            const form = document.getElementById('addFeedbackForm');
            if (form) submitFeedbackTaskForm(form, taskId);
        });

        try {
            if (typeof initTaskFeedbackQuillEditors === 'function') {
                initTaskFeedbackQuillEditors(modalBody);
            }
        } catch (_) {}
    }

    function submitFeedbackTaskForm(form, taskId) {
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
                    const header = card.querySelector('.card-header') || card;
                    header.appendChild(span);
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
            const candidates = [resp.count, resp.total, resp?.data?.count, resp?.data?.total];
            const val = candidates.find((v) => typeof v === 'number' && !isNaN(v));
            return typeof val === 'number' ? val : null;
        }

        const submitBtn = form.querySelector("button[type='submit']") || document.getElementById("addFeedbackButton");
        const originalBtnHtml = submitBtn ? submitBtn.innerHTML : "";
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            submitBtn.disabled = true;
        }

        try {
            const imageEl = form.querySelector('#feedback_image') || document.getElementById('feedback_image');
            const imageFile = (imageEl && imageEl.files && imageEl.files[0]) ? imageEl.files[0] : null;
            if (imageFile && imageFile.size > MAX_IMAGE_BYTES) {
                if (typeof showFloatingAlert === 'function') showFloatingAlert('Image must be smaller than 10 MB.', 'warning');
                if (submitBtn) { submitBtn.innerHTML = originalBtnHtml; submitBtn.disabled = false; }
                return;
            }
            const totalCheck = validateTotalUploadSize({ imageFile: imageFile, extraFiles: selectedFiles });
            if (!totalCheck.ok) {
                if (typeof showFloatingAlert === 'function') showFloatingAlert('Total upload size must be 100 MB or less.', 'warning');
                if (submitBtn) { submitBtn.innerHTML = originalBtnHtml; submitBtn.disabled = false; }
                return;
            }
        } catch (_) {}

        const formData = new FormData(form);
        try {
            if (Array.isArray(selectedFiles) && selectedFiles.length > 0) {
                selectedFiles.forEach(file => formData.append('reference_files[]', file));
            }
        } catch (_) {}
        formData.append("task_id", taskId);

        optimisticIncrementFeedbackCount(taskId);

        $.ajax({
            url: appUrl + "/task-feedbacks",
            type: "POST",
            data: formData,
            contentType: false,
            processData: false,
            headers: {
                "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]').getAttribute("content"),
            },
            success: function (response) {
                const msg = (response && response.message) || 'Feedback submitted successfully!';
                if (typeof showFloatingAlert === 'function') showFloatingAlert(msg, 'light', 2000);
                try {
                    selectedFiles = [];
                    const preview = document.getElementById('feedback_reference_files_preview') || document.getElementById('reference_files_preview');
                    if (preview) preview.innerHTML = '';
                } catch (_) {}

                $.ajax({
                    url: appUrl + "/task-feedbacks/count/" + taskId,
                    type: "GET",
                    dataType: "json",
                    success: function (countResponse) {
                        const serverCount = extractCountFromResponse(countResponse);
                        if (typeof serverCount === 'number' && serverCount > 0) setFeedbackCount(taskId, serverCount);
                        if (typeof loadProjectTaskFeedbackData === 'function') {
                            try { loadProjectTaskFeedbackData(taskId); } catch (_) {}
                        } else {
                            const ev = new CustomEvent('taskFeedbacksUpdated', { detail: { taskId } });
                            window.dispatchEvent(ev);
                            const container = document.querySelector(`#task-feedback-list-${taskId}, #task-feedbacks-${taskId}`);
                            if (container) {
                                const fragUrl = appUrl + "/task-feedbacks?task_id=" + encodeURIComponent(taskId);
                                fetch(fragUrl, { credentials: 'same-origin', headers: { 'X-Requested-With': 'XMLHttpRequest' } })
                                    .then(r => { if (!r.ok) throw new Error('no fragment'); return r.text(); })
                                    .then(html => { container.innerHTML = html; })
                                    .catch(() => { if (typeof refreshTaskFeedbacks === 'function') try { refreshTaskFeedbacks(taskId); } catch (_) {} });
                            }
                        }
                    },
                    error: function () {
                        if (typeof loadProjectTaskFeedbackData === 'function') {
                            try { setTimeout(() => loadProjectTaskFeedbackData(taskId), 1000); } catch (_) {}
                        } else {
                            window.dispatchEvent(new CustomEvent('taskFeedbacksUpdated', { detail: { taskId } }));
                        }
                    }
                });

                if (typeof loadProjectTaskFeedbackData === 'function') {
                    loadProjectTaskFeedbackData(taskId);
                }

                if (form) form.reset();
                $("#addFeedbackTaskFormContainer").slideUp(200);
            },
            error: function (xhr) {
                let errorMessage = "Failed to submit feedback. Please try again.";
                if (xhr.responseJSON && xhr.responseJSON.errors) {
                    errorMessage = Object.values(xhr.responseJSON.errors).flat().join("\n");
                } else if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMessage = xhr.responseJSON.message;
                }
                if (typeof showFloatingAlert === 'function') showFloatingAlert(errorMessage, "danger");
                else alert(errorMessage);
                try {
                    $.ajax({
                        url: appUrl + "/task-feedbacks/count/" + taskId,
                        type: "GET",
                        dataType: "json",
                        success: function (countResponse) {
                            const serverCount = extractCountFromResponse(countResponse);
                            if (typeof serverCount === 'number') setFeedbackCount(taskId, serverCount);
                        }
                    });
                } catch (_) {}
            },
            complete: function () {
                if (submitBtn) {
                    submitBtn.innerHTML = originalBtnHtml;
                    submitBtn.disabled = false;
                }
                try { selectedFiles = []; } catch (_) {}
            },
        });
    }

    function handleProjectTaskFeedback(taskId) {
        const detailEl = document.getElementById("taskDetailModal");
        if (detailEl) {
            detailEl.setAttribute('data-child-opened', '1');

            if (detailEl._timelineHiddenHandler) {
                detailEl.removeEventListener('hidden.bs.modal', detailEl._timelineHiddenHandler);
                detailEl._timelineHiddenHandlerBackup = detailEl._timelineHiddenHandler;
                detailEl._timelineHiddenHandler = null;
            }

            const detailModal = bootstrap.Modal.getInstance(detailEl) || new bootstrap.Modal(detailEl);
            detailModal.hide();
        }

        const feedbackModalEl = document.getElementById("projectTaskFeedbackModal");
        if (!feedbackModalEl) {
            console.warn('projectTaskFeedbackModal element not found');
            return;
        }
        const feedbackModal = new bootstrap.Modal(feedbackModalEl);

        feedbackModalEl.dataset.taskId = taskId;

        const modalTitle = feedbackModalEl.querySelector(".feedback-modal-title") || document.getElementById("projectTaskFeedbackModalLabel");
        const modalBody = feedbackModalEl.querySelector(".feedback-modal-body") || document.getElementById("projectTaskFeedbackList");
        if (modalTitle) modalTitle.textContent = "Task Feedback";
        if (modalBody) modalBody.innerHTML = "";

        try { loadProjectTaskFeedbackData(taskId); } catch(_) {}

        feedbackModal.show();

        document.querySelectorAll('.modal-backdrop').forEach((el, idx, arr) => {
            if (idx < arr.length - 1) el.remove();
        });
    }

    function clearReply() {
        try {
            const pid = document.getElementById('inline_parent_id_input');
            if (pid) pid.value = '';
            const previewContainer = document.getElementById('reply_parent_preview_inline');
            if (previewContainer) previewContainer.remove();
        } catch(_) {}
    }

    function showReplyFeedbackTaskForm(taskId, parentId) {
        try {
            const feedbackModalEl = document.getElementById("projectTaskFeedbackModal");
            const modalTitle = feedbackModalEl.querySelector(".feedback-modal-title");
            const modalBody = feedbackModalEl.querySelector(".feedback-modal-body");

            const inlineForm = feedbackModalEl.querySelector('.feedback-form');
            if (inlineForm) {
                let inlinePid = inlineForm.querySelector('#inline_parent_id_input');
                if (!inlinePid) {
                    inlinePid = document.createElement('input');
                    inlinePid.type = 'hidden';
                    inlinePid.id = 'inline_parent_id_input';
                    inlinePid.name = 'parent_id';
                    inlineForm.appendChild(inlinePid);
                }
                inlinePid.value = parentId || '';

                let previewContainer = inlineForm.querySelector('#reply_parent_preview_inline');
                if (!previewContainer) {
                    previewContainer = document.createElement('div');
                    previewContainer.id = 'reply_parent_preview_inline';
                    previewContainer.className = 'mt-2';
                }

                previewContainer.innerHTML = '<div class="selected-files-list mt-2"><div class="d-flex align-items-center gap-2 p-2 rounded bg-light selected-task"><div style="width:28px;height:28px;border-radius:50%;overflow:hidden;flex:0 0 28px;display:flex;align-items:center;justify-content:center;"><span class="material-symbols-outlined">person</span></div><div class="flex-grow-1" style="font-size: 10px;"><div style="font-weight:500;font-size:11px">Loading...</div><div style="font-size:10px;color:#6b6b6b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:240px;">&nbsp;</div></div><button type="button" class="btn btn-sm btn-remove-task remove-task" style="line-height: 1; font-size: 10px;"><span class="material-symbols-outlined">close</span></button></div></div>';

                try {
                    fetch(appUrl + '/task-feedbacks/' + taskId)
                        .then(function (res) {
                            if (!res.ok) return res.json().then(Promise.reject);
                            return res.json();
                        })
                        .then(function (json) {
                            const payload = json && json.data ? json.data : json;
                            let fb = null;

                            function findById(node, id) {
                                if (!node) return null;
                                if (Array.isArray(node)) {
                                    for (let k = 0; k < node.length; k++) {
                                        const r = findById(node[k], id);
                                        if (r) return r;
                                    }
                                    return null;
                                }
                                try {
                                    if (node && String(node.id) === String(id)) return node;
                                    if (node && node.replies && Array.isArray(node.replies)) {
                                        const rr = findById(node.replies, id);
                                        if (rr) return rr;
                                    }
                                } catch (_) {}
                                return null;
                            }

                            fb = findById(payload, parentId);

                            const title = (fb && fb.employee && (fb.employee.name || fb.employee.fullname)) ||
                                         (fb && (fb.employee_name || fb.employee_fullname)) || 'Unknown';
                            const commentRaw = (fb && (fb.feedback_comment || fb.comment || fb.description)) || '';

                            try {
                                const empRaw = (fb && fb.employee) || {};
                                let avatarRaw = empRaw.user_photo || empRaw.profile_picture || empRaw.photo || fb.employee_photo || '';
                                const avatarUrl = (typeof buildPhotoUrl === 'function') ?
                                    buildPhotoUrl(avatarRaw, empRaw.profile_picture, empRaw.profile_picture_url) :
                                    (avatarRaw ? appUrl + '/file/profile_picture/' + avatarRaw : appUrl + '/asset/img/avatar.png');

                                let plain = '';
                                try {
                                    plain = (commentRaw || '').replace(/<[^>]+>/g, '');
                                } catch (_) {
                                    plain = (commentRaw || '') + '';
                                }
                                if (plain && plain.length > 120) plain = plain.substring(0, 120).trim() + '...';

                                let html = '';
                                html += '<div class="selected-files-list mt-2">';
                                html += '<div class="d-flex align-items-center gap-2 p-2 rounded bg-light selected-task">';
                                html += '<div style="width:28px;height:28px;border-radius:50%;overflow:hidden;flex:0 0 28px;display:flex;align-items:center;justify-content:center;">';
                                html += '<img src="' + avatarUrl + '" alt="avatar" style="width:28px;height:28px;object-fit:cover;display:block;" onerror="this.onerror=null;this.src=\'' + appUrl + '/asset/img/avatar.png\';">';
                                html += '</div>';
                                html += '<div class="flex-grow-1" style="font-size: 10px;">';
                                html += '<div style="font-weight:500;font-size:11px">' + (title || 'Unknown') + '</div>';
                                html += '<div style="font-size:10px;color:#6b6b6b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:240px;">' + (plain || '') + '</div>';
                                html += '</div>';
                                html += '<button type="button" class="btn btn-sm btn-remove-task remove-task" style="line-height: 1; font-size: 10px;"><span class="material-symbols-outlined">close</span></button>';
                                html += '</div></div>';
                                previewContainer.innerHTML = html;
                            } catch (_) {}

                            try {
                                const btn = previewContainer.querySelector('.remove-task');
                                if (btn) btn.addEventListener('click', function () {
                                    try {
                                        previewContainer.remove();
                                        inlinePid.value = '';
                                    } catch (_) {}
                                });
                            } catch (_) {}
                        })
                        .catch(function () {
                            try {
                                const btn = previewContainer.querySelector('.remove-task');
                                if (btn) btn.addEventListener('click', function () {
                                    try {
                                        previewContainer.remove();
                                        inlinePid.value = '';
                                    } catch (_) {}
                                });
                            } catch (_) {}
                        });
                } catch (_) {}

                try {
                    const filesPreview = inlineForm.querySelector('#inline_feedback_files_preview');
                    const editor = inlineForm.querySelector('#inline_feedback_editor');
                    if (filesPreview && filesPreview.parentNode) {
                        filesPreview.parentNode.insertBefore(previewContainer, filesPreview);
                    } else if (editor && editor.parentNode) {
                        editor.parentNode.insertBefore(previewContainer, editor);
                    } else {
                        inlineForm.insertBefore(previewContainer, inlineForm.firstChild);
                    }
                } catch(_) {}

                try {
                    const editorEl = document.querySelector('#inline_feedback_editor .ql-editor');
                    if (editorEl) {
                        editorEl.focus();
                        editorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                } catch(_) {}

                return;
            }

            try {
                showFloatingAlert('Reply functionality requires inline feedback form.', 'warning', 3000);
            } catch (_) {
                console.warn('No inline feedback form found for reply');
            }

        } catch (e) {
            console.warn("showReplyFeedbackTaskForm error", e);
        }
    }

    function showEditFeedbackTaskForm(taskId, data, isReply) {
        const feedbackModalEl = document.getElementById("projectTaskFeedbackModal");
        const modalTitle = feedbackModalEl.querySelector(".feedback-modal-title") || document.getElementById("projectTaskFeedbackModalLabel");
        const modalBody = feedbackModalEl.querySelector(".feedback-modal-body") || document.getElementById("projectTaskFeedbackList");
        const addFeedbackButton = document.getElementById("addFeedbackButton");

        if (modalTitle) modalTitle.textContent = isReply ? "Edit Reply" : "Edit Feedback";

        const existingImg = data.image_url || '';
        const bgImage = existingImg ? `background-image: url('${existingImg}'); background-size: cover; opacity: 1;` : `background-image: url('${appUrl}/asset/img/background/add-image.png'); background-size: 50%; opacity: 0.5;`;
        const clearBtnClass = existingImg ? '' : 'd-none';

        modalBody.innerHTML = `
            <form id="editFeedbackForm" enctype="multipart/form-data">
                <input type="hidden" name="task_id" value="${taskId}">
                ${data.parent_id ? `<input type=\"hidden\" name=\"parent_id\" value=\"${data.parent_id}\">` : ''}

                <!-- Attachment buttons (Photo & File) -->
                <div class="mb-3">
                    <label class="form-label">Attachment</label>
                    <div class="d-flex align-items-center">
                        <button type="button" class="btn btn-outline-secondary d-flex align-items-center" id="taskEditFeedbackPhotoBtn">
                            <span class="material-symbols-outlined me-1">photo_camera</span>Photo
                        </button>
                        <button type="button" class="btn btn-outline-secondary d-flex align-items-center ms-2" id="taskEditFeedbackFileBtn">
                            <span class="material-symbols-outlined me-1">attach_file</span>File
                        </button>
                    </div>
                    <!-- Hidden inputs -->
                    <input type="file" id="task_edit_feedback_image_input" ${isReply ? 'name="image"' : 'name="feedback_image"'} accept="image/*" hidden>
                    <input type="file" id="task_edit_feedback_files_input" name="reference_files[]" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip" multiple hidden>
                </div>

                <div class="mb-3 custom-input">
                    <label for="feedback_comment" class="form-label">Feedback Comment</label>

                    <!-- Quill toolbar + editor (visual) -->
                    <div id="task_edit_feedback_toolbar">
                        <span class="ql-formats">
                            <button class="ql-bold"></button>
                            <button class="ql-italic"></button>
                            <button class="ql-underline"></button>
                        </span>
                        <span class="ql-formats">
                            <button class="ql-list" value="ordered"></button>
                            <button class="ql-list" value="bullet"></button>
                        </span>
                        <span class="ql-formats">
                            <button class="ql-link"></button>
                        </span>
                    </div>

                    <div id="task_edit_feedback_editor"
                        style="min-height:120px; background:#fff; border:1px solid #e3e6ee; border-radius:6px;"></div>

                    <!-- canonical hidden textarea so backend controllers keep receiving same payload -->
                    <textarea class="form-control input-text d-none" id="feedback_comment" name="feedback_comment" rows="3" required style="display:none;">${data.feedback_comment || ''}</textarea>
                </div>

                <div class="mb-3 custom-input">
                    <label class="form-label">Reference URLs (Optional)</label>
                    <div id="feedback_reference_urls_container" class="d-flex flex-column gap-2"></div>
                </div>

                <div class="mb-3 custom-input">
                    <label class="form-label">Reference Files (Optional)</label>
                    <div id="task_edit_feedback_files_preview" class="mt-2"></div>
                    <div id="existing_feedback_reference_files" class="mt-2"></div>
                    <input type="hidden" id="existing_feedback_reference_files_input" name="existing_reference_files" value="[]">
                </div>
            </form>
        `;

        (function(){
            try {
                const imageInput = modalBody.querySelector('#feedback_image');
                const imageLabel = modalBody.querySelector('#editFeedbackImageLabel');
                const imageClearBtn = modalBody.querySelector('#editFeedbackImageClearBtn');

                if (imageInput) {
                    imageInput.addEventListener('change', function () {
                        if (this.files && this.files[0]) {
                            const file = this.files[0];
                            if (file.size > MAX_IMAGE_BYTES) {
                                try { if (typeof showFloatingAlert === 'function') showFloatingAlert('Image must be smaller than 10 MB.', 'warning'); } catch(_) { alert('Image must be smaller than 10 MB.'); }
                                this.value = '';
                                return;
                            }
                            const reader = new FileReader();
                            reader.onload = function (e) {
                                try {
                                    if (imageLabel) {
                                        imageLabel.style.backgroundImage = `url('${e.target.result}')`;
                                        imageLabel.classList.add('has-image');
                                        imageLabel.style.backgroundSize = 'cover';
                                        imageLabel.style.opacity = '1';
                                    }
                                    if (imageClearBtn) imageClearBtn.classList.remove('d-none');
                                } catch (_) {}
                            };
                            reader.readAsDataURL(file);
                        }
                    });
                }

                if (imageClearBtn) {
                    imageClearBtn.addEventListener('click', function (e) {
                        e.preventDefault();
                        try {
                            if (imageInput) imageInput.value = '';
                            if (imageLabel) {
                                imageLabel.style.backgroundImage = `url('${appUrl}/asset/img/background/add-image.png')`;
                                imageLabel.style.backgroundPosition = 'center center';
                                imageLabel.style.backgroundRepeat = 'no-repeat';
                                imageLabel.style.backgroundSize = '50%';
                                imageLabel.classList.remove('has-image');
                                imageLabel.style.opacity = '0.5';
                            }
                            imageClearBtn.classList.add('d-none');
                        } catch (_) {}
                    });
                }
            } catch (_) {}
        })();

        (function() {
            const container = modalBody.querySelector('#feedback_reference_urls_container');
            if (!container) return;
            let urls = [];
            if (Array.isArray(data.reference_urls) && data.reference_urls.length > 0) {
                urls = data.reference_urls;
            } else if (data.reference_url) {
                urls = [data.reference_url];
            }
            if (urls.length === 0) {
                const row = document.createElement('div');
                row.className = 'd-flex gap-2 align-items-center';
                row.innerHTML = `<input type="url" class="form-control" name="reference_urls[]" placeholder="https://example.com">` +
                    `<button type="button" class="btn btn-submit-black add-ref-url" aria-label="Add URL"><span class="material-symbols-outlined">add</span></button>`;
                container.appendChild(row);
            } else {
                urls.forEach((u, idx) => {
                    const row = document.createElement('div');
                    row.className = 'd-flex gap-2 align-items-center';
                    const controls = (idx === 0)
                        ? `<button type="button" class="btn btn-submit-black add-ref-url" aria-label="Add URL"><span class="material-symbols-outlined">add</span></button>`
                        : `<button type="button" class="btn btn-remove-url remove-ref-url" aria-label="Remove URL"><span class="material-symbols-outlined">close</span></button>`;
                    row.innerHTML = `<input type="url" class="form-control" name="reference_urls[]" value="${u}" placeholder="https://example.com">${controls}`;
                    container.appendChild(row);
                });
            }
        })();

        (function() {
            const container = document.getElementById('existing_feedback_reference_files');
            const hidden = document.getElementById('existing_feedback_reference_files_input');
            if (!container || !hidden) return;
            let files = Array.isArray(data.reference_files_urls) ? data.reference_files_urls.slice() : [];
            if (files.length === 0 && data.reference_file_url) files = [data.reference_file_url];
            let kept = files.slice();
            hidden.value = JSON.stringify(kept);

            container.innerHTML = '';
            if (files.length > 0) {
                files.forEach((url, idx) => {
                    const item = document.createElement('div');
                    item.className = 'existing-file-item d-flex align-items-center justify-content-between mb-2 p-2 bg-light border rounded';
                    const info = document.createElement('div');
                    info.className = 'd-flex align-items-center flex-grow-1';
                    const icon = document.createElement('span');
                    icon.className = 'material-symbols-outlined me-2';
                    icon.textContent = 'description';
                    const link = document.createElement('a');
                    link.href = url;
                    link.target = '_blank';
                    const fileName = (function(){
                        try { const u = new URL(url, window.location.origin); return decodeURIComponent(u.pathname.split('/').pop()); } catch(e) {
                            const parts = String(url).split('/'); return decodeURIComponent(parts[parts.length-1] || String(url));
                        }
                    })();
                    link.textContent = fileName;
                    const remove = document.createElement('button');
                    remove.type = 'button';
                    remove.className = 'btn btn-sm btn-outline-danger ms-2';
                    remove.innerHTML = '&times;';
                    remove.addEventListener('click', function(){
                        const indexInKept = kept.indexOf(url);
                        if (indexInKept !== -1) { kept.splice(indexInKept, 1); hidden.value = JSON.stringify(kept); }
                        item.remove();
                    });
                    info.appendChild(icon);
                    info.appendChild(link);
                    item.appendChild(info);
                    item.appendChild(remove);
                    container.appendChild(item);
                });
            }
        })();

        try {
            selectedFiles = [];
            const refInput = modalBody.querySelector('#reference_files');
            if (refInput) {
                refInput.addEventListener('change', function () {
                    const files = Array.from(this.files || []);
                    if (files.length) {
                        selectedFiles = [...selectedFiles, ...files];
                        if (typeof displaySelectedFiles === 'function') {
                            displaySelectedFiles();
                        }
                    }
                    this.value = '';
                });
            }
        } catch (_) {}

        try {
            const photoBtn = document.getElementById('taskEditFeedbackPhotoBtn');
            const fileBtn = document.getElementById('taskEditFeedbackFileBtn');
            const imageInput = document.getElementById('task_edit_feedback_image_input');
            const filesInput = document.getElementById('task_edit_feedback_files_input');

            if (photoBtn && imageInput) {
                photoBtn.addEventListener('click', function() {
                    imageInput.click();
                });
            }

            if (fileBtn && filesInput) {
                fileBtn.addEventListener('click', function() {
                    filesInput.click();
                });
            }

            if (imageInput) {
                imageInput.addEventListener('change', function() {
                    const file = this.files && this.files[0];
                    if (!file) return;

                    // Size validation
                    if (file.size > MAX_IMAGE_BYTES) {
                        if (typeof showFloatingAlert === 'function') {
                            showFloatingAlert('Image must be smaller than 10 MB.', 'warning');
                        }
                        this.value = '';
                        return;
                    }

                    const reader = new FileReader();
                    reader.onload = function(e) {
                        showInlineFeedbackImagePreviewSmall(file, e.target.result);
                    };
                    reader.readAsDataURL(file);
                });
            }

            if (filesInput) {
                filesInput.addEventListener('change', function() {
                    const files = Array.from(this.files || []);
                    if (!files.length) return;

                    if (!window.taskEditFeedbackSelectedFiles) window.taskEditFeedbackSelectedFiles = [];
                    window.taskEditFeedbackSelectedFiles = [...window.taskEditFeedbackSelectedFiles, ...files];

                    renderTaskProjectEditFeedbackFilesPreview();
                    this.value = '';
                });
            }
        } catch (_) {}

        setUnifiedProjectTaskFeedbackFooter(taskId, 'Save', function(){
            const form = document.getElementById('editFeedbackForm');
            if (!form) return; submitEditFeedbackTaskForm(form, taskId, data.id, isReply);
        });

        try {
            if (typeof initTaskFeedbackQuillEditors === 'function') {
                initTaskFeedbackQuillEditors(modalBody);
                if (window.__quillTaskFeedbackEdit && data.feedback_comment) {
                    window.__quillTaskFeedbackEdit.root.innerHTML = data.feedback_comment || '';
                }
            }
        } catch (_) {}
    }

    function setUnifiedProjectTaskFeedbackFooter(taskId, submitLabel, onSubmit){
        const modal = document.getElementById('projectTaskFeedbackModal');
        if (!modal) return;
        let footer = modal.querySelector('.feedback-modal-footer')
                  || modal.querySelector('.modal-footer')
                  || modal.querySelector('.modal-footer-custom');
        if (!footer) {
            const addBtn = modal.querySelector('#addFeedbackButton');
            if (addBtn && addBtn.parentElement) footer = addBtn.parentElement;
        }
        const titleEl = modal.querySelector('.feedback-modal-title');
        if (!footer) return;
        footer.innerHTML = '';
        const wrapper = document.createElement('div');
        wrapper.id = 'taskFeedbackFormButtonsWrapper';
        wrapper.className = 'd-flex gap-2 w-100';
        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'btn btn-close-reply flex-grow-1';
        closeBtn.textContent = 'Close';
        closeBtn.addEventListener('click', function(){
            if (titleEl) titleEl.textContent = 'Task Feedback';
            loadProjectTaskFeedbackData(taskId);
        });
        const submitBtn = document.createElement('button');
        submitBtn.type = 'button';
        submitBtn.className = 'btn btn-submit-black flex-grow-1';
        submitBtn.textContent = submitLabel;
        submitBtn.addEventListener('click', function(e){ e.preventDefault(); onSubmit && onSubmit(); });
        wrapper.appendChild(closeBtn);
        wrapper.appendChild(submitBtn);
        footer.appendChild(wrapper);
    }

    function submitEditFeedbackTaskForm(form, taskId, id, isReply) {
        const submitBtn = document.getElementById('addFeedbackButton');
        const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            submitBtn.disabled = true;
        }

        try {
            const imageEl = form.querySelector('#feedback_image') || document.getElementById('feedback_image');
            const imageFile = (imageEl && imageEl.files && imageEl.files[0]) ? imageEl.files[0] : null;
            if (imageFile && imageFile.size > MAX_IMAGE_BYTES) {
                try { if (typeof showFloatingAlert === 'function') showFloatingAlert('Image must be smaller than 10 MB.', 'warning'); } catch(_) { alert('Image must be smaller than 10 MB.'); }
                if (submitBtn) { submitBtn.innerHTML = originalBtnHtml; submitBtn.disabled = false; }
                return;
            }
            const totalCheck = validateTotalUploadSize({imageFile: imageFile, extraFiles: selectedFiles});
            if (!totalCheck.ok) {
                try { if (typeof showFloatingAlert === 'function') showFloatingAlert('Total upload size must be 100 MB or less.', 'warning'); } catch(_) { alert('Total upload size must be 100 MB or less.'); }
                if (submitBtn) { submitBtn.innerHTML = originalBtnHtml; submitBtn.disabled = false; }
                return;
            }
        } catch(_) {}

        const formData = new FormData(form);
        formData.append('_method', 'PUT');
        try {
            const editSelectedFiles = window.taskEditFeedbackSelectedFiles || selectedFiles || [];
            if (Array.isArray(editSelectedFiles) && editSelectedFiles.length > 0) {
                editSelectedFiles.forEach(file => formData.append('reference_files[]', file));
            }
        } catch (_) {}

        $.ajax({
            url: appUrl + "/task-feedbacks/" + id,
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
                if (typeof showFloatingAlert === 'function') {
                    showFloatingAlert(response.message || 'Feedback updated successfully!', 'success');
                }
                const titleEl = document.querySelector('#projectTaskFeedbackModal .feedback-modal-title') || document.getElementById('projectTaskFeedbackModalLabel');
                if (titleEl) titleEl.textContent = 'Task Feedback';
                const feedbackModalEl = document.getElementById('projectTaskFeedbackModal');
                let footer = feedbackModalEl?.querySelector('.feedback-modal-footer')
                          || feedbackModalEl?.querySelector('.modal-footer')
                          || feedbackModalEl?.querySelector('.modal-footer-custom');
                if (!footer) {
                    const maybeBtn = feedbackModalEl?.querySelector('#addFeedbackButton');
                    if (maybeBtn && maybeBtn.parentElement) footer = maybeBtn.parentElement;
                }
                if (footer) {
                    let addBtn = footer.querySelector('#addFeedbackButton');
                    footer.innerHTML = '';
                    if (!addBtn) {
                        addBtn = document.createElement('button');
                        addBtn.type = 'button';
                        addBtn.className = 'btn btn-submit-black w-100';
                        addBtn.id = 'addFeedbackButton';
                        addBtn.textContent = 'Add Feedback';
                        footer.appendChild(addBtn);
                    } else {
                        addBtn.textContent = 'Add Feedback';
                        const fresh = addBtn.cloneNode(true);
                        addBtn.parentNode.replaceChild(fresh, addBtn);
                        addBtn = fresh;
                        footer.appendChild(addBtn);
                    }
                    addBtn.disabled = false;
                    addBtn.removeAttribute('disabled');
                    addBtn.addEventListener('click', () => showAddFeedbackTaskForm(taskId));
                }
                loadProjectTaskFeedbackData(taskId);
                try { scheduleRefreshLatestFeedbackSnippets(10); } catch(_) {}
                try { fetchAndRenderTasks(); } catch(_) {}
            },
            error: function (xhr) {
                let errorMessage = 'Failed to update feedback. Please try again.';
                if (xhr.responseJSON && xhr.responseJSON.errors) {
                    errorMessage = Object.values(xhr.responseJSON.errors).flat().join("\n");
                } else if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMessage = xhr.responseJSON.message;
                }
                if (typeof showFloatingAlert === 'function') {
                    showFloatingAlert(errorMessage, 'danger');
                } else {
                    alert(errorMessage);
                }
            },
            complete: function () {
                if (submitBtn) {
                    submitBtn.innerHTML = originalBtnHtml || 'Save';
                    submitBtn.disabled = false;
                }
                try { selectedFiles = []; const preview = document.getElementById('feedback_reference_files_preview'); if (preview) preview.innerHTML = ''; } catch(_) {}
            }
        });
    }

    function initProjectTaskInlineFeedbackEditor(taskId) {
    try {
        if (typeof Quill === "undefined") return;
        if (window.__quillTaskFeedbackInline) return window.__quillTaskFeedbackInline;

        const editorEl = document.getElementById("inline_task_feedback_editor");
        if (!editorEl) return null;

        const q = new Quill("#inline_task_feedback_editor", {
            modules: { toolbar: false, clipboard: { matchVisual: false } },
            theme: "snow",
            placeholder: "Write feedback..."
        });

        try {
            const Delta = Quill.import && Quill.import("delta");
            if (q && q.clipboard && typeof q.clipboard.addMatcher === "function") {
                q.clipboard.addMatcher("IMG", function (node, delta) {
                    try { return new Delta(); } catch (_) { return delta; }
                });
            }
        } catch (_) {}

        try {
            q.on && q.on("text-change", function () {
                try {
                    const imgs = q.root.querySelectorAll("img");
                    imgs.forEach(i => i.remove());
                } catch (_) {}
                try {
                    const plain = typeof q.getText === "function"
                        ? (q.getText() || "").trim()
                        : (q.root.textContent || "").replace(/\s+/g, "").trim();
                    if (plain && plain.length > 0) {
                        q.root.classList.remove("ql-blank");
                    } else {
                        if (!q.root.classList.contains("ql-blank"))
                            q.root.classList.add("ql-blank");
                    }
                } catch (_) {}
            });
        } catch (_) {}

        window.__quillTaskFeedbackInline = q;

        try {
            const editorRoot = editorEl.querySelector(".ql-editor");
            if (editorRoot) {
                const togglePlaceholder = function () {
                    try {
                        const txt = (editorRoot.textContent || "").replace(/\uFEFF/g, "").trim();
                        if (txt.length > 0) {
                            editorRoot.classList.remove("ql-blank");
                        } else {
                            if (!editorRoot.classList.contains("ql-blank"))
                                editorRoot.classList.add("ql-blank");
                        }
                    } catch (_) {}
                };
                editorRoot.addEventListener("input", togglePlaceholder);
                editorRoot.addEventListener("keydown", () => setTimeout(togglePlaceholder, 0));
            }
        } catch (_) {}

        if (!window.inlineTaskFeedbackSelectedFiles) {
            window.inlineTaskFeedbackSelectedFiles = [];
        }

        setupInlineProjectTaskFeedbackButtons(taskId, q);
        return q;
    } catch (e) {
        console.warn("Failed to init inline task feedback editor:", e);
        return null;
    }
    }

    function submitInlineProjectTaskFeedback(taskId, quill) {
        const appUrl = (() => {
            try {
                const meta = document.querySelector('meta[name="app-url"]');
                let v = (meta && meta.getAttribute("content")) || "";
                if (v) {
                    v = new URL(v, window.location.origin).href.replace(/\/+$/, "");
                    return v;
                }
                const parts = (window.location.pathname || "").split("/").filter(Boolean);
                const baseSeg = parts.length > 0 ? "/" + parts[0] : "";
                return (window.location.origin + baseSeg).replace(/\/+$/, "");
            } catch (_) {
                return (window.location.origin || "").replace(/\/+$/, "");
            }
        })();

        try {
            const html = quill.root.innerHTML || "";
            let hasImage = false,
                hasRefFiles = false;

            try {
                if (window.__taskInlineFeedbackImageFile) hasImage = true;
                else {
                    const pi = document.getElementById("inline_task_feedback_image_input");
                    if (pi && pi.files && pi.files.length) hasImage = true;
                }
            } catch (_) {}

            try {
                if (window.inlineTaskFeedbackSelectedFiles?.length) hasRefFiles = true;
                else {
                    const fi = document.getElementById("inline_task_feedback_files_input");
                    if (fi && fi.files && fi.files.length) hasRefFiles = true;
                }
            } catch (_) {}

            const plainText = String(html || "").replace(/<[^>]+>/g, "").trim();
            if (!plainText && !hasImage && !hasRefFiles) {
                if (typeof showFloatingAlert === "function")
                    showFloatingAlert("Please write feedback or attach a file", "warning");
                return;
            }

            const feedbackModalEl = document.getElementById("projectTaskFeedbackModal");
            const employeeId = feedbackModalEl?.getAttribute("data-employee-id") || "";
            const fd = new FormData();

            fd.append("feedback_comment", html);
            fd.append("task_id", taskId);
            fd.append("employee_id", employeeId);

            try {
                const pid = document.getElementById("inline_parent_id_input");
                if (pid && pid.value) fd.append("parent_id", pid.value);
            } catch (_) {}

            const imageFile = window.__taskInlineFeedbackImageFile;
            if (imageFile) fd.append("feedback_image", imageFile);

            const selectedFiles = window.inlineTaskFeedbackSelectedFiles || [];
            selectedFiles.forEach(f => fd.append("reference_files[]", f));

            const editId = (document.getElementById("inline_edit_task_feedback_input") || {}).value || "";
            const isEdit = String(editId).trim() !== "";

            if (isEdit) {
                try {
                    const keepList = window.inlineTaskExistingFilesKeep || [];
                    fd.set("existing_reference_files", JSON.stringify(keepList));
                } catch (_) {}
                try {
                    if (typeof window.__inlineTaskRemoveImage !== "undefined") {
                        fd.set("remove_image", window.__inlineTaskRemoveImage ? "1" : "0");
                    }
                } catch (_) {}
                fd.append("_method", "PUT");
            }

            const sendBtn = $("#inlineTaskFeedbackSendBtn");
            const origText = sendBtn.html();
            sendBtn.prop("disabled", true)
                .html('<i class="fas fa-spinner fa-spin me-1"></i>' + (isEdit ? "Updating..." : "Sending..."));

            $.ajax({
                url: isEdit ? appUrl + "/task-feedbacks/" + editId : appUrl + "/task-feedbacks",
                type: "POST",
                data: fd,
                processData: false,
                contentType: false,
                headers: { "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content") },
                success: function (res) {
                    const msg = (res && res.message) ||
                        (isEdit ? "Feedback updated successfully!" : "Feedback submitted successfully!");
                    if (typeof showFloatingAlert === "function")
                        showFloatingAlert(msg, "light", 2000);

                    quill.root.innerHTML = "";
                    window.inlineTaskFeedbackSelectedFiles = [];
                    window.__taskInlineFeedbackImageFile = null;

                    $("#inline_task_feedback_image_preview, #inline_task_feedback_files_preview, #inline_existing_files_preview").empty();

                    clearReplyState();

                    if (isEdit && typeof window.cancelInlineTaskEditFeedback === "function") {
                        window.cancelInlineTaskEditFeedback();
                    }

                    setTimeout(() => {
                        try {
                            loadTaskFeedbackData(taskId + "?t=" + Date.now());
                        } catch (e) {
                            console.warn("Failed to reload feedback list", e);
                        }
                    }, 300);
                },
                error: function (xhr) {
                    let msg = isEdit ? "Failed to update feedback" : "Failed to submit feedback";
                    if (xhr.responseJSON?.errors) {
                        msg = Object.values(xhr.responseJSON.errors).flat().join("\n");
                    } else if (xhr.responseJSON?.message) {
                        msg = xhr.responseJSON.message;
                    }
                    if (typeof showFloatingAlert === "function")
                        showFloatingAlert(msg, "danger", 4000);
                    else alert(msg);
                },
                complete: function () {
                    sendBtn.prop("disabled", false).html(origText);
                }
            });
        } catch (e) {
            console.warn("Failed to submit inline task feedback:", e);
            if (typeof showFloatingAlert === "function")
                showFloatingAlert("Failed to submit feedback", "warning");
        }
    }

    window.startInlineProjectTaskEditFeedback = function(data) {
        try {
            const hiddenInput = document.getElementById("inline_edit_task_feedback_input");
            if (hiddenInput) hiddenInput.value = data.id || "";

            try {
                const inlinePid = document.getElementById('inline_parent_id_input');
                if (inlinePid) inlinePid.value = data.parent_id || '';
            } catch(_) {}

            try {
                if (!window.__quillTaskFeedbackInline) {
                    initProjectTaskInlineFeedbackEditor((document.getElementById('projectTaskFeedbackModal')||{}).dataset?.taskId || '');
                }
            } catch(_) {}

            try {
                if (window.__quillTaskFeedbackInline && window.__quillTaskFeedbackInline.root) {
                    setTimeout(function(){
                        try { window.__quillTaskFeedbackInline.root.innerHTML = data.feedback_comment || ""; } catch(_) {}
                        try {
                            if (typeof window.__quillTaskFeedbackInline.setSelection === 'function') {
                                try { window.__quillTaskFeedbackInline.setSelection(0, 0); } catch(_) {}
                            }
                        } catch(_) {}
                    }, 0);
                }
            } catch(_) {}

            try {
                const rawImg = data.image_url || data.image || "";
                if (rawImg) {
                    let url = rawImg;
                    if (url.indexOf('http') !== 0) {
                        url = (url.indexOf('/') === 0) ? appUrl.replace(/\/$/, "") + url : appUrl.replace(/\/$/, "") + "/file/task_feedback/" + url;
                    }
                    showTaskInlineImagePreviewFromUrl(url);
                }
            } catch(_) {}

            try {
                let files = [];
                if (Array.isArray(data.reference_files_urls)) {
                    files = data.reference_files_urls;
                } else if (Array.isArray(data.reference_files)) {
                    files = data.reference_files;
                } else if (data.reference_file_url) {
                    files = [data.reference_file_url];
                } else if (data.reference_file) {
                    files = [data.reference_file];
                }
                renderInlineTaskExistingFiles(files);
            } catch(_) {}

            const sendBtn = document.getElementById("inlineTaskFeedbackSendBtn");
            if (sendBtn) {
                sendBtn._origHTML = sendBtn._origHTML || sendBtn.innerHTML;
                try {
                    sendBtn.innerHTML = `
                        <span class="material-symbols-outlined" style="font-size:18px;vertical-align:middle;">send</span>
                    `;
                } catch(_) {
                    sendBtn.textContent = 'Update';
                }
            }

            const actions = document.querySelector('.btn-actions-feedback .submit-feedback');
            if (actions && !document.getElementById('inlineTaskFeedbackCancelBtn')) {
                const cancel = document.createElement('button');
                cancel.type = 'button';
                cancel.id = 'inlineTaskFeedbackCancelBtn';
                cancel.className = 'btn btn-custom-close me-2 d-flex align-items-center gap-1';
                cancel.innerHTML = '<span class="material-symbols-outlined" style="font-size:18px;vertical-align:middle;">cancel</span>';
                cancel.addEventListener('click', function() {
                    try {
                        window.cancelInlineTaskEditFeedback();
                    } catch(_) {}
                });
                actions.insertBefore(cancel, actions.firstChild);
            }
        } catch(_) {}
    };