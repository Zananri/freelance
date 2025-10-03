let currentMaxLevel = 6;
let allTasks = [];

function renderChildGroups(task, $container, $template) {
    if (!task.children || task.children.length === 0) return;
    $container.find(".task-item").remove();
    for (let i = 0; i < task.children.length; i++) {
        const child = task.children[i];
        const $child = renderTaskNode(child, $template);
        const $childStub = $(
            '<div class="connector-horizontal child-connector"></div>'
        );
        const $wrap = $('<div class="task-item"></div>');
        $wrap.append($childStub).append($child);
        $container.append($wrap);
    }
}

function updateViewMoreButton() {
    if ($("#view-more-wrapper").length === 0) {
        const wrapper = $(`
            <div id="view-more-wrapper" class="text-center">
                <button id="view-more-btn" class="btn btn-submit-black">View More</button>
            </div>
        `);
        $("#task-legend").append(wrapper);
        $("#view-more-btn").on("click", function () {
            currentMaxLevel += 7;
            $.ajax({
                url: `${appUrl}/projects/${projectId}/tasks/tree`,
                type: "GET",
                data: { pageTab: currentMaxLevel },
                dataType: "json",
            })
            .done(function (response) {
                if (response.status === "success" && response.data) {
                    allTasks = response.data;
                    renderTaskList(allTasks);
                    if (response.has_more) {
                        $("#view-more-wrapper").show();
                    } else {
                        $("#view-more-wrapper").hide();
                    }
                }
            })
            .fail(function () {
                // Optionally handle error
            });
        });
    }
    $("#view-more-btn").show();
}

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
    // tag the node with its task id and make it draggable via the card element
    try {
        if (task && task.id != null) {
            $item.attr("data-task-id", String(task.id));
        }
    } catch (_) {}
    let visual = "not-started";
    try {
        const s = String(task.status || "").toLowerCase();
        if (["new_request", "new request", "new-request"].includes(s))
            visual = "not-started";
        else if (["in_progress", "in progress", "in-progress"].includes(s))
            visual = "in-progress";
        else if (["complete", "completed"].includes(s)) visual = "complete";
        else visual = normalizedStatus || "not-started";
        if (task.due_date && visual !== "complete") {
            const due = new Date(task.due_date);
            const today = new Date();
            due.setHours(0, 0, 0, 0);
            today.setHours(0, 0, 0, 0);
            if (!isNaN(due.getTime()) && today > due) visual = "late";
        }
    } catch (e) {}
    const $card = $item.find(".task-box");
    try {
        if (task && task.id != null) {
            $card.attr("data-task-id", String(task.id));
            $card.attr("draggable", true);
            $card.addClass("draggable-task");
            // small affordance for users
            if (!$card.attr("title")) {
                $card.attr("title", "Drag this task and drop onto another task to re-parent");
            }
        }
    } catch (_) {}
    if (visual === "complete") $card.css("background-color", "#B2EECD");
    else if (visual === "in-progress") $card.css("background-color", "#F5EFCE");
    else if (visual === "late") $card.css("background-color", "#EBA5A5");
    else $card.css("background-color", "#DDE4E8");
    $item.find(".task-name").text(task.title);
    let startText = task.start_date
        ? formatDateENMediumDayMonth(task.start_date)
        : "";
    let dueText = task.due_date
        ? formatDateENMediumDayMonth(task.due_date)
        : "";
    let dateText =
        startText && dueText
            ? `${startText} - ${dueText}`
            : startText || dueText;
    $item.find(".task-date").text(dateText);
    if (task.children && task.children.length > 0) {
        const $branch = $('<div class="task-branch"></div>');
        $branch.append($item);
        const $connector = $('<div class="connector-horizontal"></div>');
        $branch.append($connector);
        const $childGroup = $('<div class="child-group"></div>').css({
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            position: "relative",
        });
        if (task.children.length > 1) {
            const $vertical = $('<div class="connector-vertical"></div>');
            $childGroup.append($vertical);
        }
        renderChildGroups(task, $childGroup, $template);
        $branch.append($childGroup);
        return $branch;
    }
    return $item;
}

function renderTaskList(data) {
    const $tree = $("#task-tree");
    $tree.empty();
    if (!data || data.length === 0) return;
    const treeData = buildTaskTree(data);
    const $rootCol = $('<div class="root-column"></div>');
    $tree.append($rootCol);
    treeData.forEach((root) => {
        $rootCol.append(renderTaskNode(root, $("#task-template")));
    });
    setTimeout(adjustConnectors, 40);
    setTimeout(drawSvgConnectors, 60);
}

function adjustConnectors() {
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
    setTimeout(adjustConnectors, 60);
});

function ensureSvgOverlay() {
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

setTimeout(drawSvgConnectors, 50);
$(window).on("resize scroll", function () {
    setTimeout(drawSvgConnectors, 80);
});

function getTaskByProject(projectId) {
    fetchProjectDueDate(projectId);
    $("#task-loading").removeClass("d-none");
    $("#task-error").addClass("d-none");
    $("#task-tree").empty();
    return $.ajax({
        url: `${appUrl}/projects/${projectId}/tasks/tree`,
        type: "GET",
        data: { pageTab: currentMaxLevel },
        dataType: "json",
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
            if (response.has_more) {
                updateViewMoreButton();
            } else {
                $("#view-more-wrapper").hide();
            }
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
                    adjustConnectors();
                    drawSvgConnectors();
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
                scheduleRecalc();
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
                        scheduleRecalc(20);
                    }
                } catch (_) {}
            }, 220);
        }
        var mo = new MutationObserver(function () {
            scheduleRecalc(60);
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
            var id = $(this).attr("data-task-id");
            window.__dragTaskId = id != null ? String(id) : null;
            if (e.originalEvent && e.originalEvent.dataTransfer) {
                e.originalEvent.dataTransfer.setData("text/plain", window.__dragTaskId || "");
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
            var denied = !draggedId || String(draggedId) === String(targetId) || isDescendant(draggedId, targetId);
            if (e.originalEvent && e.originalEvent.dataTransfer) {
                e.originalEvent.dataTransfer.dropEffect = denied ? "none" : "move";
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
            var relatedTarget = e.originalEvent ? e.originalEvent.relatedTarget : null;
            if (relatedTarget && $(relatedTarget).closest("#task-tree").length > 0) {
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
                    dragData = e.originalEvent.dataTransfer.getData("text/plain");
                }
            } catch (_) {}
            
            var draggedId = dragData || window.__dragTaskId;
            
            if (!draggedId || !canMoveToEmptySpace(draggedId)) {
                clearEmptySpaceDropVisuals();
                return;
            }

            // Show visual feedback for successful drop to empty space
            $("#task-tree").css({ outline: "3px solid #2a7", backgroundColor: "rgba(42, 167, 42, 0.1)" });

            // Move task to root level (parent_id = null)
            $.ajax({
                url: appUrl + "/task/" + encodeURIComponent(String(draggedId)),
                type: "PUT",
                data: { parent_id: null },
                dataType: "json"
            })
                .done(function () {
                    try {
                        var map = taskMap();
                        var dragged = map[String(draggedId)];
                        if (dragged) {
                            dragged.parent_id = null;
                        }
                        renderTaskList(allTasks);
                    } catch (_) {}
                    try { 
                        if (typeof projectId !== "undefined" && projectId) {
                            getTaskByProject(projectId);
                        }
                    } catch (_) {}
                    
                    // Show success message
                    try {
                        if (typeof window.showFloatingAlert === "function") {
                            window.showFloatingAlert("Task berhasil dipindahkan ke root level", "success", 2000);
                        }
                    } catch (_) {}
                })
                .fail(function (xhr) {
                    try {
                        console.error("Failed to move task to empty space", xhr && xhr.responseText);
                        if (typeof window.showFloatingAlert === "function") {
                            window.showFloatingAlert("Gagal memindahkan task. Coba lagi.", "warning", 3000);
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
                    dragData = e.originalEvent.dataTransfer.getData("text/plain");
                }
            } catch (_) {}
            var draggedId = dragData || window.__dragTaskId;
            if (!draggedId || !targetId) {
                clearDropVisual($target);
                return;
            }
            if (String(draggedId) === String(targetId) || isDescendant(draggedId, targetId)) {
                clearDropVisual($target);
                return; // invalid move
            }

            var map = taskMap();
            var dragged = map[String(draggedId)];
            if (dragged && String(dragged.parent_id || "") === String(targetId)) {
                clearDropVisual($target);
                return;
            }

            $target.css({ outline: "2px solid #2a7" });

            $.ajax({
                url: appUrl + "/task/" + encodeURIComponent(String(draggedId)),
                type: "PUT",
                data: { parent_id: String(targetId) },
                dataType: "json"
            })
                .done(function () {
                    try {
                        if (dragged) dragged.parent_id = targetId;
                        renderTaskList(allTasks);
                    } catch (_) {}
                    try { if (typeof projectId !== "undefined" && projectId) getTaskByProject(projectId); } catch (_) {}
                })
                .fail(function (xhr) {
                    try {
                        console.error("Failed to move task", xhr && xhr.responseText);
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

    (function setupTouchDnd(){
        var hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0);
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
            longPressTimer: null,
            moved: false
        };

        function cleanupTouchDrag() {
            try {
                if (state.longPressTimer) {
                    clearTimeout(state.longPressTimer);
                    state.longPressTimer = null;
                }
                if (state.originEl) $(state.originEl).removeClass('dragging');
                if (state.dropTarget) {
                    if (state.dropTarget.isEmptySpace) {
                        clearEmptySpaceDropVisuals();
                    } else {
                        clearDropVisual($(state.dropTarget));
                    }
                }
                if (state.ghost && state.ghost.parentNode) state.ghost.parentNode.removeChild(state.ghost);
            } catch(_){}
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
            g.style.position = 'fixed';
            g.style.left = (rect.left) + 'px';
            g.style.top = (rect.top) + 'px';
            g.style.width = rect.width + 'px';
            g.style.height = rect.height + 'px';
            g.style.pointerEvents = 'none';
            g.style.opacity = '0.85';
            g.style.zIndex = 9999;
            g.style.boxShadow = '0 6px 16px rgba(0,0,0,0.15)';
            document.body.appendChild(g);
            state.dx = x - rect.left;
            state.dy = y - rect.top;
            return g;
        }

        function findDropTargetAt(x, y) {
            var hidden = false;
            if (state.ghost) { state.ghost.style.display = 'none'; hidden = true; }
            var el = document.elementFromPoint(x, y);
            if (hidden) state.ghost.style.display = '';
            if (!el) return null;
            
            // Check if we're over a task box
            var taskBoxCandidate = $(el).closest('#task-tree .task-box')[0] || null;
            if (taskBoxCandidate) return taskBoxCandidate;
            
            // Check if we're over empty space in task-tree
            var treeCandidate = $(el).closest('#task-tree')[0] || null;
            if (treeCandidate) return { isEmptySpace: true, element: treeCandidate };
            
            return null;
        }

        function isValidDrop(draggedId, targetEl) {
            if (!targetEl) return false;
            
            // Handle empty space drops
            if (targetEl.isEmptySpace) {
                return draggedId && canMoveToEmptySpace(draggedId);
            }
            
            // Handle task-to-task drops
            var targetId = targetEl.getAttribute('data-task-id');
            if (!draggedId || !targetId) return false;
            if (String(draggedId) === String(targetId)) return false;
            return !isDescendant(draggedId, targetId);
        }

        function onTouchMove(e) {
            if (!state.dragging) return;
            var t = (e.changedTouches && e.changedTouches[0]) || (e.touches && e.touches[0]);
            if (!t) return;
            try { e.preventDefault(); } catch(_){}
            var x = t.clientX, y = t.clientY;
            if (state.ghost) {
                state.ghost.style.left = (Math.round(x - state.dx)) + 'px';
                state.ghost.style.top = (Math.round(y - state.dy)) + 'px';
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
                    // Handle empty space visual feedback
                    if (isValidDrop(state.draggedId, targetEl)) {
                        $("#task-tree").addClass("empty-space-drop-ok");
                        $("#task-tree").css({ outline: "3px dashed #2a7", backgroundColor: "rgba(42, 167, 42, 0.05)" });
                    }
                } else {
                    // Handle task box visual feedback
                    var $t = $(targetEl);
                    if (isValidDrop(state.draggedId, targetEl)) {
                        $t.addClass('drop-ok').removeClass('drop-denied');
                        $t.css({ outline: '2px dashed #2a7' });
                    } else {
                        $t.addClass('drop-denied').removeClass('drop-ok');
                        $t.css({ outline: '2px dashed #d66' });
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

            var map = (function(){ var m={}; try{ (allTasks||[]).forEach(function(t){ m[String(t.id)] = t; }); }catch(_){ } return m; })();
            var dragged = map[String(draggedId)];

            if (targetEl.isEmptySpace) {
                // Handle drop to empty space
                $("#task-tree").css({ outline: "3px solid #2a7", backgroundColor: "rgba(42, 167, 42, 0.1)" });
                
                $.ajax({
                    url: appUrl + "/task/" + encodeURIComponent(String(draggedId)),
                    type: 'PUT',
                    data: { parent_id: null },
                    dataType: 'json'
                })
                .done(function(){
                    try { 
                        if (dragged) dragged.parent_id = null; 
                        renderTaskList(allTasks); 
                    } catch(_){ }
                    try { 
                        if (typeof projectId !== 'undefined' && projectId) getTaskByProject(projectId); 
                    } catch(_){ }
                    try {
                        if (typeof window.showFloatingAlert === "function") {
                            window.showFloatingAlert("Task berhasil dipindahkan ke root level", "success", 2000);
                        }
                    } catch (_) {}
                })
                .fail(function(xhr){
                    try { 
                        console.error('Failed to move task to empty space (touch)', xhr && xhr.responseText); 
                        if (typeof window.showFloatingAlert === "function") {
                            window.showFloatingAlert("Gagal memindahkan task. Coba lagi.", "warning", 3000);
                        } else {
                            alert('Gagal memindahkan task. Coba lagi.');
                        }
                    } catch(_){ }
                })
                .always(function(){ clearEmptySpaceDropVisuals(); });
            } else {
                // Handle drop to another task
                var targetId = targetEl.getAttribute('data-task-id');
                if (dragged && String(dragged.parent_id || '') === String(targetId)) {
                    clearDropVisual($(targetEl));
                    return;
                }

                var $target = $(targetEl);
                $target.css({ outline: '2px solid #2a7' });

                $.ajax({
                    url: appUrl + "/task/" + encodeURIComponent(String(draggedId)),
                    type: 'PUT',
                    data: { parent_id: String(targetId) },
                    dataType: 'json'
                })
                .done(function(){
                    try { if (dragged) dragged.parent_id = targetId; renderTaskList(allTasks); } catch(_){ }
                    try { if (typeof projectId !== 'undefined' && projectId) getTaskByProject(projectId); } catch(_){ }
                })
                .fail(function(xhr){
                    try { 
                        console.error('Failed to move task (touch)', xhr && xhr.responseText); 
                        if (typeof window.showFloatingAlert === "function") {
                            window.showFloatingAlert("Gagal memindahkan task. Coba lagi.", "warning", 3000);
                        } else {
                            alert('Gagal memindahkan task. Coba lagi.');
                        }
                    } catch(_){ }
                })
                .always(function(){ clearDropVisual($target); });
            }
        }

        document.addEventListener('touchmove', onTouchMove, { passive: false });
        document.addEventListener('touchend', function(e){
            if (!state.dragging) return;
            performDropIfValid();
            cleanupTouchDrag();
        }, { passive: false });
        document.addEventListener('touchcancel', function(){ if (state.dragging) cleanupTouchDrag(); }, { passive: true });

        $(document).on('touchstart', '#task-tree .task-box', function(e){
            try {
                var t = e.originalEvent && (e.originalEvent.touches && e.originalEvent.touches[0]);
                if (!t) return;
                state.startX = t.clientX; state.startY = t.clientY; state.moved = false;
                var el = this;
                var id = el.getAttribute('data-task-id');
                state.draggedId = id ? String(id) : null;
                state.originEl = el;

                state.longPressTimer = setTimeout(function(){
                    state.dragging = true;
                    $(el).addClass('dragging');
                    state.ghost = createGhostFrom(el, state.startX, state.startY);
                }, 350);
            } catch(_){ }
        });

        $(document).on('touchmove', '#task-tree .task-box', function(e){
            try {
                var t = e.originalEvent && (e.originalEvent.touches && e.originalEvent.touches[0]);
                if (!t) return;
                var dx = Math.abs(t.clientX - state.startX);
                var dy = Math.abs(t.clientY - state.startY);
                if (!state.dragging) {
                    if (dx > 10 || dy > 10) {
                        state.moved = true;
                        if (state.longPressTimer) { clearTimeout(state.longPressTimer); state.longPressTimer = null; }
                        return;
                    }
                }
                if (state.dragging) {
                    try { e.preventDefault(); } catch(_){}
                }
            } catch(_){ }
        });

        $(document).on('touchend touchcancel', '#task-tree .task-box', function(){
            if (!state.dragging) {
                if (state.longPressTimer) { clearTimeout(state.longPressTimer); state.longPressTimer = null; }
                state.originEl = null; state.draggedId = null; state.moved = false;
                return;
            }
        });
    })();
})();
