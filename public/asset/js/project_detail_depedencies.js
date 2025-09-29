function buildTaskTree(tasks) {
    const map = {};
    const roots = [];
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

    let visual = "not-started";
    try {
        const s = String(task.status || "").toLowerCase();
        if (["new_request", "new request", "new-request"].includes(s)) {
            visual = "not-started";
        } else if (["in_progress", "in progress", "in-progress"].includes(s)) {
            visual = "in-progress";
        } else if (["complete", "completed"].includes(s)) {
            visual = "complete";
        } else {
            visual = normalizedStatus || "not-started";
        }

        if (task.due_date && visual !== "complete") {
            const due = new Date(task.due_date);
            const today = new Date();
            due.setHours(0, 0, 0, 0);
            today.setHours(0, 0, 0, 0);
            if (!isNaN(due.getTime()) && today > due) {
                visual = "late";
            }
        }
    } catch (e) {}

    const $card = $item.find(".task-box");
    switch (visual) {
        case "complete":
            $card.css("background-color", "#4CAF50");
            break;
        case "in-progress":
            $card.css("background-color", "#FFC107");
            break;
        case "late":
            $card.css("background-color", "#F44336");
            break;
        case "not-started":
        default:
            $card.css("background-color", "#9E9E9E");
            break;
    }

    $item.find(".task-name").text(task.title);
    $item.find(".task-date").text(task.due_date);

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

        task.children.forEach((child) => {
            const $child = renderTaskNode(child, $template);
            if (task.children.length > 1) {
                const $childWrap = $('<div class="child-wrap"></div>');
                const $childStub = $(
                    '<div class="connector-horizontal child-connector"></div>'
                );
                $childWrap.append($childStub).append($child);
                $childGroup.append($childWrap);
            } else {
                $childGroup.append($child);
            }
        });

        $branch.append($childGroup);
        return $branch;
    }

    return $item;
}

function renderTaskList(data) {
    const $tree = $("#task-tree");
    const $template = $("#task-template");
    $tree.empty();

    if (!data || data.length === 0) return;

    const treeData = buildTaskTree(data);

    const $rootCol = $('<div class="root-column"></div>');

    treeData.forEach((task) => {
        $rootCol.append(renderTaskNode(task, $template));
    });

    $tree.append($rootCol);
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

            const padding = 0;
            const top = Math.floor(minC - padding);
            const height = Math.ceil(maxC - minC + padding * 2);
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

            $childGroup.find(".child-wrap").each(function () {
                const $wrap = $(this);
                const $stub = $wrap.children(".child-connector").first();
                const $childItem = $wrap.children(".task-item").first();
                const $childBox = $childItem.find(".task-box").first();
                if (!$stub.length || !$childBox.length) return;
                const center =
                    $childBox.offset().top -
                    $childGroup.offset().top +
                    $childBox.outerHeight() / 2;
                const stubTop = Math.round(center - $stub.outerHeight() / 2);
                $stub.css({ marginTop: stubTop + "px" });
            });
        });
    } catch (e) {
        console.warn("adjustConnectors error", e);
    }
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
                const cX = ch.x;
                const cY = ch.y;
                const $stub = createSvgEl("line", {
                    x1: verticalX,
                    y1: cY,
                    x2: cX,
                    y2: cY,
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
    } catch (e) {
        console.warn("drawSvgConnectors error", e);
    }
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
        url: `${appUrl}/projects/${projectId}/tasks`,
        type: "GET",
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
            renderTaskList(response.data);
        })
        .fail(function (xhr, status, error) {
            $("#task-loading").addClass("d-none");
            console.error("Error fetching tasks:", error);
            $("#task-error").removeClass("d-none");
            $("#task-tree").empty();
        });
}

if (projectId) {
    getTaskByProject(projectId);
}

(function setupTreeResizeObservers() {
    try {
        var $tree = $("#task-tree");
        if (!$tree.length) return;

        // expose a debounced schedule function so other code (or tests) can
        // request a recalculation after layout mutations (sidebar open/close)
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
            // expose on window for manual triggering if needed
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
            var lastW = $tree.width();
            var lastH = $tree.height();
            var $parent2 = $tree.closest(".structure-detail-content");
            if (!$parent2.length) $parent2 = $tree.parent();
            var lastPW = $parent2.length ? $parent2.width() : null;

            window.__taskTreeInterval = setInterval(function () {
                try {
                    var w = $tree.width();
                    var h = $tree.height();
                    var pW = $parent2.length ? $parent2.width() : null;
                    if (w !== lastW || h !== lastH || pW !== lastPW) {
                        lastW = w;
                        lastH = h;
                        lastPW = pW;
                        scheduleRecalc(20);
                    }
                } catch (_) {}
            }, 220);
        }

        // Watch for DOM mutations that commonly occur when sidebar toggles
        // (body class changes, sidebar element resized, etc). If detected,
        // schedule a recalculation after a short debounce so connectors stay aligned.
        try {
            var moTarget = document.body;
            var mo = new MutationObserver(function (muts) {
                // only trigger when attributes or childList change (not every text mutation)
                scheduleRecalc(60);
            });
            mo.observe(moTarget, {
                attributes: true,
                childList: true,
                subtree: false,
            });
            window.__taskTreeMutationObserver = mo;
        } catch (e) {
            // ignore if MutationObserver isn't available
        }
    } catch (e) {
        console.warn("setupTreeResizeObservers error", e);
    }
})();

$("#fullscreen-tree-btn").on("click", function () {
    const $timeline = $(".structure-detail-content");
    const $icon = $(this).find("span.material-symbols-outlined");

    if ($timeline.hasClass("fullscreen")) {
        $timeline.removeClass("fullscreen");
        $icon.text("fullscreen");
    } else {
        $timeline.addClass("fullscreen");
        $icon.text("fullscreen_exit");
    }
});
