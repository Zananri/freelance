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

                // Normalize possible formats: stringified JSON, comma-separated string, or single reference_url
                if (typeof referenceUrls === "string") {
                    try {
                        const parsed = JSON.parse(referenceUrls);
                        if (Array.isArray(parsed)) referenceUrls = parsed;
                        else referenceUrls = [String(referenceUrls)];
                    } catch (e) {
                        // fallback: split by comma
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

                try { listEl.dataset.taskId = String(taskId || ''); } catch(_) {}
                try { document.getElementById('referenceUrlsModal').dataset.taskId = String(taskId || ''); } catch(_) {}

                if (Array.isArray(referenceUrls) && referenceUrls.length > 0) {
                    referenceUrls.forEach(function (u) {
                        if (!u) return;
                        const safeUrl = String(u || '').trim();

                        const row = document.createElement('div');
                        row.className = 'd-flex align-items-center justify-content-between gap-2 p-2 rounded bg-light selected-task mb-2';

                        const a = document.createElement('a');
                        a.href = safeUrl;
                        a.target = '_blank';
                        a.className = 'flex-grow-1 text-decoration-none text-truncate feedback-reference-url';
                        a.textContent = safeUrl;
                        a.style.color = '#444444';

                        const btnGroup = document.createElement('div');
                        btnGroup.className = 'd-flex align-items-center gap-1 ms-auto';

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
                            navigator.clipboard?.writeText(safeUrl).then(function () {
                                if (typeof showFloatingAlert === 'function')
                                    showFloatingAlert('URL copied to clipboard', 'success');
                            }).catch(function () {
                                const ta = document.createElement('textarea');
                                ta.value = safeUrl;
                                ta.style.position = 'fixed';
                                ta.style.left = '-9999px';
                                document.body.appendChild(ta);
                                ta.select();
                                try {
                                    document.execCommand('copy');
                                    if (typeof showFloatingAlert === 'function')
                                        showFloatingAlert('URL copied to clipboard', 'success');
                                } catch (_) {
                                    if (typeof showFloatingAlert === 'function')
                                        showFloatingAlert('Failed to copy', 'warning');
                                }
                                document.body.removeChild(ta);
                            });
                        });

                        const openBtn = makeBtn('open_in_new', 'Open URL', function (ev) {
                            ev.preventDefault(); ev.stopPropagation();
                            window.open(safeUrl, '_blank');
                        });

                        const delBtn = makeBtn('delete', 'Remove URL', function (ev) {
                            ev.preventDefault(); ev.stopPropagation();
                            try {
                                showDeleteConfirmModal({
                                    type: 'reference_url',
                                    id: safeUrl,
                                    authorName: '',
                                    content: safeUrl,
                                    avatarUrl: '',
                                    parentModalId: 'referenceUrlsModal',
                                    onConfirm: function (done) {
                                        $.ajax({
                                            url: appUrl + '/task/' + taskId + '/reference-url',
                                            type: 'DELETE',
                                            data: { url: safeUrl },
                                            headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content') },
                                            success: function (resp) {
                                                if (typeof showFloatingAlert === 'function')
                                                    showFloatingAlert(resp.message || 'Reference URL removed', 'success');
                                                if (row && row.parentNode) row.parentNode.removeChild(row);
                                                done(true);
                                            },
                                            error: function () {
                                                const update = function () {
                                                    $.ajax({
                                                        url: appUrl + '/task/' + taskId,
                                                        type: 'PUT',
                                                        contentType: 'application/json',
                                                        data: JSON.stringify({
                                                            reference_urls: (function (orig) {
                                                                try {
                                                                    let arr = Array.isArray(orig)
                                                                        ? orig
                                                                        : (typeof orig === 'string' ? JSON.parse(orig) : []);
                                                                    return arr.filter(x => String(x || '').trim() !== String(safeUrl || '').trim());
                                                                } catch (e) { return []; }
                                                            })(referenceUrls)
                                                        }),
                                                        headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content') },
                                                        success: function (r2) {
                                                            if (typeof showFloatingAlert === 'function')
                                                                showFloatingAlert(r2.message || 'Reference URL removed', 'success');
                                                            if (row && row.parentNode) row.parentNode.removeChild(row);
                                                            done(true);
                                                        },
                                                        error: function () {
                                                            if (typeof showFloatingAlert === 'function')
                                                                showFloatingAlert('Failed to remove URL', 'danger');
                                                            done(false);
                                                        }
                                                    });
                                                };
                                                update();
                                            }
                                        });
                                    }
                                });
                            } catch (_) { }
                        });

                        btnGroup.append(copyBtn, openBtn, delBtn);
                        row.append(a, btnGroup);
                        listEl.appendChild(row);
                    });
                } else {
                    listEl.textContent = 'No reference URLs available.';
                }

                const modalEl = document.getElementById('referenceUrlsModal');
                if (modalEl) {
                    try { modalEl.dataset.taskId = String(taskId || ''); } catch(_) {}
                    const m = bootstrap.Modal.getOrCreateInstance(modalEl);
                    m.show();
                }
            },
            error: function(){
                showFloatingAlert && showFloatingAlert('Failed to load reference URLs.', 'danger');
            }
        });
    } catch(_){}
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
    else if (["complete", "completed"].includes(s)) visual = "complete";
    else visual = normalizedStatus || "not-started";
    if (task.due_date && visual !== "complete") {
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

        let showMenu = false;
        if (currentEmployeeId) {
            const isPIC = task.pic?.id && String(currentEmployeeId) === String(task.pic.id);
            const isAuthor = task.project?.authors?.some((a) => String(a.id) === String(currentEmployeeId));
            const isCoAuthor = task.project?.co_authors?.some((a) => String(a.id) === String(currentEmployeeId));
            showMenu = isPIC || isAuthor || isCoAuthor;
        }

        if (showMenu) {
            const taskId = task?.id ? String(task.id) : null;
            const $moreBtn = $('<div class="task-more-btn d-none" title="More actions" style="position:absolute;top:-7px;right:-7px;width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,0.15);display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:9999;user-select:none;border:1px solid rgba(0,0,0,0.08);pointer-events:auto;"><span style="font-size:12px;line-height:1;color:#555;">&#8942;</span></div>');
            if (taskId) $moreBtn.attr("data-task-id", taskId);
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
    else if (visual === "in-progress") $card.css("background-color", "#F5EFCE");
    else if (visual === "late") $card.css("background-color", "#EBA5A5");
    else $card.css("background-color", "#DDE4E8");

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

$(document).on("click", "#projectTaskDetailModal .playlist-add-check", function () {
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

    // Teks dasar
    $('#completed_task_title').text(task.title || '-');
    $('#completed_project_title').text(task.project_title || (task.project && task.project.title) || '-');
    $('#completed_task_note').html(task.complete_note || task.description || '<em>No note</em>');
    $('#completed_priority').text(task.priority || '-');
    $('#completed_date').text(task.complete_date || task.due_date || '-');

    // Links
    const $urls = $('#completed_task_urls').empty();
    if (Array.isArray(task.complete_urls) && task.complete_urls.length) {
        task.complete_urls.forEach((u, idx) => {
            const href = u.startsWith('http') ? u : '/' + String(u).replace(/^\/+/, '');
            const $a = $('<a>', { href, target: '_blank', text: 'link_' + (idx+1) });
            $urls.append($a).append('<br>');
        });
    } else $urls.html('<em>-</em>');

    // Files
    const $files = $('#completed_task_files').empty();
    if (Array.isArray(task.complete_files) && task.complete_files.length) {
        task.complete_files.forEach(f => {
            const raw = f && (f.url || f) || '';
            const url = raw.startsWith('http') ? raw : '/' + String(raw).replace(/^\/+/, '');
            const filename = decodeURIComponent(String(url).split('/').pop() || url);
            const $link = $('<a>', { href: url, target: '_blank', text: filename });
            $files.append($link).append('<br>');
        });
    } else $files.html('<em>-</em>');

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
    if (taskId) handleProjectTaskDetail(taskId);
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

    const checkBtn = document.querySelector('#projectTaskDetailModal .playlist-add-check');
    if (checkBtn) checkBtn._task = task;

    const detailEl = document.getElementById('projectTaskDetailModal');
    if (detailEl) detailEl.dataset.taskId = String(task.id || '');

    const refBtn = detailEl?.querySelector('button[data-bs-target="#referenceFilesModal"]');
    if (refBtn) {
        try { refBtn.removeEventListener('click', refBtn._refClickHandler || function(){}); } catch(_) {}
        refBtn._refClickHandler = function(e) {
            e?.preventDefault?.();
            showReferenceFilesForTask(task.id);
        };
        refBtn.addEventListener('click', refBtn._refClickHandler);
    }

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
                const parent = document.getElementById('projectTaskDetailModal');
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

    const $checkBtn = $("#projectTaskDetailModal .playlist-add-check").closest("button");
    if (task.status?.toLowerCase() === "completed") $checkBtn.show();
    else $checkBtn.hide();

    const buttons = detailEl?.querySelectorAll('button.border-0');
    let attachBtn = null;
    buttons?.forEach(b => {
        if (b.querySelector('.material-symbols-outlined')?.textContent.trim() === 'attach_file') attachBtn = b;
    });
    if (attachBtn) {
        try { attachBtn.removeEventListener('click', attachBtn._attachClickHandler || function(){}); } catch(_) {}
        attachBtn._attachClickHandler = function(e) {
            e?.preventDefault?.();
            showReferenceUrlsForTask(task.id);
        };
        attachBtn.addEventListener('click', attachBtn._attachClickHandler);
    }
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

                // keep task id on the list for later operations (delete / add)
                try { referenceFilesList.dataset.taskId = String(taskId || ''); } catch(_) {}
                try { document.getElementById('referenceFilesModal').dataset.taskId = String(taskId || ''); } catch(_) {}

                if (Array.isArray(referenceFiles) && referenceFiles.length > 0) {
                    referenceFiles.forEach((fileName, idx) => {
                        if (!fileName) return;

                        let fileUrl = String(fileName || '');
                        const isAbs = fileUrl.startsWith('http://') || fileUrl.startsWith('https://');
                        const isRefPath = fileUrl.startsWith('/file/task_reference_files/') || fileUrl.startsWith('file/task_reference_files/') || fileUrl.startsWith('/file/') || fileUrl.startsWith('file/');
                        if (!isAbs && !isRefPath) {
                            fileUrl = appUrl + '/file/task_reference_files/' + fileUrl;
                        } else if (!isAbs && fileUrl.startsWith('/')) {
                            fileUrl = appUrl + fileUrl;
                        }

                        const item = document.createElement('div');
                        item.className = 'd-flex align-items-center gap-2 p-2 rounded bg-light selected-task mb-2';

                        const lower = String(fileName || '').toLowerCase();
                        const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(lower);

                        if (isImage) {
                            const img = document.createElement('img');
                            img.src = fileUrl;
                            img.width = 28; img.height = 28;
                            img.style.objectFit = 'cover'; img.style.borderRadius = '50%';
                            img.alt = fileName;
                            item.appendChild(img);
                        } else {
                            const badge = document.createElement('div');
                            item.appendChild(badge);
                        }

                        const title = document.createElement('a');
                        title.className = 'flex-grow-1 text-decoration-none text-truncate';
                        title.href = fileUrl;
                        title.target = '_blank';
                        try {
                            var ext = (String(fileName || '').split('.').pop()||'').toLowerCase();
                            var num = Number(idx) + 1;
                            title.textContent = ext ? ('PROJECT_REF_FILE_' + num + '.' + ext) : ('PROJECT_REF_FILE_' + num);
                        } catch (e) {
                            title.textContent = fileName;
                        }
                        title.style.color = "#444444";
                        item.appendChild(title);

                        const dlBtn = document.createElement('button');
                        dlBtn.type = 'button';
                        dlBtn.className = 'btn btn-sm btn-link p-0 ms-2';
                        dlBtn.title = 'Download';
                        dlBtn.style.color = "#444444";
                        dlBtn.innerHTML = '<span class="material-symbols-outlined">download</span>';
                        dlBtn.addEventListener('click', function (ev) {
                            try {
                                ev.preventDefault(); ev.stopPropagation();
                                const a = document.createElement('a');
                                a.style.display = 'none';
                                a.href = fileUrl;
                                try { a.download = String(fileName || '').split('/').pop(); } catch(_) {}
                                a.target = '_blank';
                                document.body.appendChild(a);
                                a.click();
                                setTimeout(() => { try { document.body.removeChild(a); } catch(_) {} }, 100);
                            } catch (e) {
                                window.open(fileUrl, '_blank');
                            }
                        });

                        item.appendChild(dlBtn);

                        // Delete button (server will enforce permissions)
                        const delBtn = document.createElement('button');
                        delBtn.type = 'button';
                        delBtn.className = 'btn btn-sm btn-link p-0 ms-2';
                        delBtn.title = 'Delete';
                        delBtn.style.color = '#444444';
                        delBtn.innerHTML = '<span class="material-symbols-outlined icon-fill">delete</span>';
                        delBtn.addEventListener('click', function (ev) {
                            ev.preventDefault(); ev.stopPropagation();
                            try {
                                showDeleteConfirmModal({
                                    type: 'reference_file',
                                    id: fileName,
                                    authorName: '',
                                    content: (function(){ try { var e=(String(fileName||'').split('.').pop()||'').toLowerCase(); return e?('PROJECT_REF_FILE_1.'+e):'PROJECT_REF_FILE_1'; }catch(_){return fileName;} })(),
                                    avatarUrl: '',
                                    parentModalId: 'referenceFilesModal',
                                    onConfirm: function (done) {
                                        try {
                                            $.ajax({
                                                url: appUrl + '/task/' + taskId + '/reference-file',
                                                type: 'DELETE',
                                                data: { filename: fileName },
                                                headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content') },
                                                success: function (res) {
                                                    try { if (typeof showFloatingAlert === 'function') showFloatingAlert(res.message || 'Reference file deleted', 'success'); } catch(_) {}
                                                    if (item && item.parentNode) item.parentNode.removeChild(item);
                                                    done(true);
                                                },
                                                error: function (xhr) {
                                                    let msg = 'Failed to delete reference file';
                                                    if (xhr.responseJSON && xhr.responseJSON.message) msg = xhr.responseJSON.message;
                                                    try { if (typeof showFloatingAlert === 'function') showFloatingAlert(msg, 'danger'); } catch(_) { alert(msg); }
                                                    done(false);
                                                }
                                            });
                                        } catch (e) { done(false); }
                                    }
                                });
                            } catch (e) {}
                        });

                        item.appendChild(delBtn);
                        referenceFilesList.appendChild(item);
                    });
                } else {
                    referenceFilesList.textContent = "No reference files available.";
                }

                const modalEl = document.getElementById("referenceFilesModal");
                if (modalEl) {
                    try { modalEl.dataset.taskId = String(taskId || ''); } catch(_) {}
                    const referenceFilesModal = bootstrap.Modal.getOrCreateInstance(modalEl);
                    referenceFilesModal.show();
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
    const modal = new bootstrap.Modal("#projectTaskDetailModal");
    const $modal = $("#projectTaskDetailModal");

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

    function createOrGetMenu() {
        if (!$globalMenu || !$globalMenu.parent().length) {
            $globalMenu = $(`
                <div id="task-global-more-menu" class="d-none"
                    style="position:fixed;min-width:140px;background:#fff;border:1px solid #e5e7eb;
                    box-shadow:0 8px 20px rgba(0,0,0,0.12);border-radius:8px;z-index:99999;
                    overflow:hidden;pointer-events:auto;">
                    <button type="button" class="clear-parent-action"
                    style="display:block;width:100%;padding:8px 12px;background:#fff;border:0;
                    text-align:left;font-size:13px;color:#333;cursor:pointer;">Clear Parent
                    </button>
                    <button type="button" class="edit-task-action"
                        style="display:block;width:100%;padding:8px 12px;background:#fff;border:0;
                        text-align:left;font-size:13px;color:#333;cursor:pointer;">Edit
                    </button>
                    <button type="button" class="delete-task-action"
                        style="display:block;width:100%;padding:8px 12px;background:#fff;border:0;
                        text-align:left;font-size:13px;color:#d33;cursor:pointer;">Delete
                    </button>
                </div>
            `);
            $("body").append($globalMenu);
        }
        return $globalMenu;
    }

    function showMenuAt($btn, taskId) {
        try {
            var $menu = createOrGetMenu();
            var rect = $btn[0].getBoundingClientRect();
            var top = rect.bottom + 4;
            var left = rect.left - 60;
            if (left < 10) left = 10;
            $menu.css({ top: top + "px", left: left + "px" });
            $menu.removeClass("d-none");
            currentTaskId = taskId;
        } catch (_) {}
    }

    function hideMenu() {
        try {
            if ($globalMenu) $globalMenu.addClass("d-none");
            currentTaskId = null;
        } catch (_) {}
    }

    $(document).on("click", ".task-more-btn", function (e) {
        try {
            e.preventDefault();
            e.stopPropagation();
            var $btn = $(this);
            var taskId =
                $btn.attr("data-task-id") ||
                $btn.closest(".task-box").attr("data-task-id");
            if (!taskId) return;
            var $menu = createOrGetMenu();
            if (!$menu.hasClass("d-none") && currentTaskId === taskId) {
                hideMenu();
            } else {
                hideMenu();
                showMenuAt($btn, taskId);
            }
        } catch (_) {}
    });

    // Action Edit
    $(document).on(
        "click",
        "#task-global-more-menu .edit-task-action",
        function (e) {
            e.preventDefault();
            e.stopPropagation();
            var taskId = currentTaskId;
            hideMenu();
            if (!taskId) return;

            try {
                const modal = new bootstrap.Modal("#editProjectTaskModal");
                $("#editProjectTaskModal").attr("data-task-id", taskId);
                modal.show();

                if (typeof window.handleProjectTaskEdit === "function") {
                    window.handleProjectTaskEdit(taskId);
                }
            } catch (err) {}
        }
    );

    // Action Clear Parent
    $(document).on(
        "click",
        "#task-global-more-menu .clear-parent-action",
        function (e) {
            try {
                e.preventDefault();
                e.stopPropagation();
                var taskId = currentTaskId;
                if (!taskId) return;
                hideMenu();

                $.ajax({
                    url: appUrl + "/task/" + encodeURIComponent(String(taskId)),
                    type: "PUT",
                    data: JSON.stringify({ parent_id: null, parent_ids: [] }),
                    contentType: "application/json",
                    dataType: "json",
                    headers: {
                        "X-CSRF-TOKEN":
                            window.csrfToken ||
                            $('meta[name="csrf-token"]').attr("content") ||
                            "",
                        "X-Requested-With": "XMLHttpRequest",
                        Accept: "application/json",
                    },
                })
                    .done(function () {
                        if (
                            typeof window.refreshTaskTreePartial === "function"
                        ) {
                            window.refreshTaskTreePartial();
                        } else {
                            var idStr = String(taskId);
                            (allTasks || []).forEach(function (t) {
                                if (String(t.id) === idStr) {
                                    t.parent_id = null;
                                    t.parent_ids = [];
                                }
                            });
                            renderTaskList(allTasks);
                        }
                        window.showFloatingAlert?.(
                            "Parent clear succesfully",
                            "success",
                            1400
                        );
                    })
                    .fail(function (xhr) {
                        console.error("Gagal clear parent", xhr?.responseText);
                        window.showFloatingAlert?.(
                            "Failed to delete parent",
                            "warning",
                            2400
                        );
                    });
            } catch (_) {}
        }
    );

    // Action Delete
    $(document).on(
        "click",
        "#task-global-more-menu .delete-task-action",
        function (e) {
            e.preventDefault();
            e.stopPropagation();
            var taskId = currentTaskId;
            hideMenu();
            if (!taskId) return;

            try {
                const modal = new bootstrap.Modal("#deleteProjectTaskModal");
                $("#deleteProjectTaskModal").attr("data-task-id", taskId);
                modal.show();

                if (typeof window.handleProjectTaskDelete === "function") {
                    window.handleProjectTaskDelete(taskId);
                }
            } catch (err) {}
        }
    );

    $(document).on("click", function (e) {
        if (
            !$(e.target).closest("#task-global-more-menu, .task-more-btn")
                .length
        )
            hideMenu();
    });

    $(window).on("scroll", function () {
        hideMenu();
    });
})();

$(function () {
    var modal = $("#addTaskModalProject");
    if (!modal.length) return;

    function loadTasksForProject(projectId) {
        var $dropdown = $("#task_parent_dropdown");
        var $selected = $("#task_selected_parent");
        var $input = $("#task_parent_input");
        var $id = $("#task_parent_id");

        $dropdown.html('<div class="dropdown-item text-muted">Loading tasks...</div>').show();

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
                    var $item = $("<div>")
                        .addClass("dropdown-item")
                        .css("cursor", "pointer")
                        .text(task.title || "Task #" + task.id)
                        .on("click", function () {
                            $id.val(task.id);
                            $input.val(task.title || "Task #" + task.id);
                            $selected.html(`
                                <div class="d-flex align-items-center gap-2 p-2 rounded bg-light selected-task">
                                    <span class="flex-grow-1">${task.title || "Task #" + task.id}</span>
                                    <button type="button" class="btn btn-sm btn-remove-task remove-task">
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
