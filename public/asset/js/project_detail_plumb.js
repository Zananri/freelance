/*
 Multi-parent task edges using jsPlumb. Draws additional connections between parent and child cards.
 Requires: jsPlumb community lib loaded globally as jsPlumb or window.jsPlumb and jQuery ($).
*/
(function ($) {
    function meta(name) {
        try {
            return $('meta[name="' + name + '"]').attr("content") || null;
        } catch (_) {
            return null;
        }
    }
    var appUrl = (
        window.appUrl ||
        meta("app-url") ||
        (window.location && window.location.origin) ||
        ""
    ).replace(/\/$/, "");
    var projectId = String(window.projectId || meta("project-id") || "");
    var csrf = window.csrfToken || meta("csrf-token") || "";

    var instance = null;
    var endpoints = {};
    var currentTasks = [];
    function getElId(taskId) {
        return "task-node-" + String(taskId);
    }

    // Refresh only the task tree section by fetching latest tasks from server,
    // while preserving the user's viewport position.
    function refreshTaskTreePartial() {
        try {
            var $c = $("#task-tree");
            var cEl = $c[0] || null;
            var containerScrolls = {
                st: $c.scrollTop(),
                sl: $c.scrollLeft(),
            };

            // Determine if the tree container is the scroll container
            function isContainerScrollable() {
                try {
                    if (!cEl) return false;
                    var sh = cEl.scrollHeight || 0,
                        ch = cEl.clientHeight || 0,
                        sw = cEl.scrollWidth || 0,
                        cw = cEl.clientWidth || 0;
                    return sh > ch + 2 || sw > cw + 2;
                } catch (_) {
                    return false;
                }
            }

            // Pick an anchor: task box closest to the viewport center
            function pickAnchor() {
                var nodes = [].slice.call(document.querySelectorAll("#task-tree .task-box"));
                if (!nodes.length) return null;
                var useContainer = isContainerScrollable();
                var vRect = useContainer && cEl
                    ? cEl.getBoundingClientRect()
                    : { top: 0, left: 0, width: window.innerWidth || 0, height: window.innerHeight || 0 };
                var vMidX = vRect.left + (vRect.width || 0) / 2;
                var vMidY = vRect.top + (vRect.height || 0) / 2;
                var best = null;
                nodes.forEach(function (el) {
                    try {
                        var r = el.getBoundingClientRect();
                        // Only consider elements that intersect viewport vertically
                        if (r.bottom < vRect.top || r.top > vRect.top + (vRect.height || 0)) return;
                        var cx = r.left + r.width / 2;
                        var cy = r.top + r.height / 2;
                        var d = Math.abs(cy - vMidY) + Math.abs(cx - vMidX);
                        if (!best || d < best.d) best = { el: el, d: d, rect: r };
                    } catch (_) {}
                });
                if (!best) return null;
                var id = best.el && best.el.getAttribute("id");
                if (!id) return null;
                return {
                    id: id,
                    // Position of the anchor within the viewport (container or window)
                    topInView: best.rect.top - vRect.top,
                    leftInView: best.rect.left - vRect.left,
                    useContainer: useContainer,
                    winX: window.pageXOffset || document.documentElement.scrollLeft || 0,
                    winY: window.pageYOffset || document.documentElement.scrollTop || 0,
                };
            }

            var anchor = pickAnchor();

            // Prevent layout jump while emptying the tree by fixing min-height temporarily
            var prevH = $c.height();
            if (prevH && prevH > 0) {
                try { $c.css("min-height", prevH + "px"); } catch (_) {}
            }

            if (typeof window.getTaskByProject === "function" && projectId) {
                var req = window.getTaskByProject(projectId);
                if (req && typeof req.always === "function") {
                    req.always(function () {
                        try {
                            // Remove temp min-height
                            $c.css("min-height", "");

                            // Try anchor-based restoration first
                            if (anchor && anchor.id) {
                                var elNew = document.getElementById(anchor.id);
                                if (elNew) {
                                    var vRectNew = (anchor.useContainer && cEl)
                                        ? cEl.getBoundingClientRect()
                                        : { top: 0, left: 0 };
                                    var rNew = elNew.getBoundingClientRect();
                                    var dY = (rNew.top - vRectNew.top) - anchor.topInView;
                                    var dX = (rNew.left - vRectNew.left) - anchor.leftInView;
                                    if (anchor.useContainer && cEl) {
                                        cEl.scrollTop += dY;
                                        cEl.scrollLeft += dX;
                                    } else {
                                        window.scrollTo(
                                            (anchor.winX || 0) + dX,
                                            (anchor.winY || 0) + dY
                                        );
                                    }
                                } else {
                                    // Fallback to simple container scroll restore
                                    $c.scrollTop(containerScrolls.st);
                                    $c.scrollLeft(containerScrolls.sl);
                                }
                            } else {
                                // Fallback to simple container scroll restore
                                $c.scrollTop(containerScrolls.st);
                                $c.scrollLeft(containerScrolls.sl);
                            }
                        } catch (_) {}
                    });
                }
            } else {
                // Fallback: just repaint existing connections
                try {
                    var inst = ensureInstance();
                    inst && inst.repaintEverything && inst.repaintEverything();
                } catch (_) {}
                try { $c.css("min-height", ""); } catch (_) {}
            }
        } catch (_) {}
    }

    // Expose to global so other modules (DnD) can request a partial refresh while preserving scroll
    try { window.refreshTaskTreePartial = refreshTaskTreePartial; } catch (_) {}

    function ensureInstance() {
        if (instance) return instance;
        if (!(window.jsPlumb && window.jsPlumb.jsPlumb)) {
            instance = window.jsPlumb ? window.jsPlumb.getInstance() : null;
        } else {
            instance = window.jsPlumb.jsPlumb.getInstance();
        }
        if (!instance) return null;
        try {
            var $c = $("#task-tree");
            if ($c.length) {
                if (typeof instance.setContainer === "function")
                    instance.setContainer($c[0]);
                if ($c.css("position") === "static") {
                    $c.css("position", "relative");
                }
            }
            instance.importDefaults({
                Connector: ["Flowchart", {
                stub: [60, 60],
                cornerRadius: 30,
                }],
                Endpoint: ["Dot", { radius: 2 }],
                PaintStyle: { stroke: "#D2D3E1", strokeWidth: 2 },
                EndpointStyle: { fill: "#D2D3E1" },
                Overlays: [["Label", { location: 1, width: 8, length: 8 }]],
                ConnectionsDetachable: true,
            });
        } catch (_) {}
        return instance;
    }

    function makeSourceAndTarget(el) {
        var inst = ensureInstance();
        if (!inst || !el) return;
        try {
            inst.makeSource(el, {
                filter: ".plumb-handle",
                filterExclude: false,
                extract: {
                    action: "the-action",
                },
                anchor: "Right",
                allowLoopback: false,
                maxConnections: -1,
            });
        } catch (_) {}
        try {
            inst.makeTarget(el, {
                dropOptions: { hoverClass: "plumb-drop-ok" },
                anchor: "Left",
                allowLoopback: false,
                maxConnections: -1,
            });
        } catch (_) {}
    }

    function buildExistingEdges(tasks) {
        var edges = [];
        try {
            (tasks || []).forEach(function (t) {
                var parents = [];
                if (Array.isArray(t.parent_ids)) parents = t.parent_ids.slice();
                if (t.parent_id && parents.indexOf(t.parent_id) === -1)
                    parents.push(t.parent_id);
                parents.forEach(function (pid) {
                    if (pid)
                        edges.push({
                            parent: String(pid),
                            child: String(t.id),
                        });
                });
            });
        } catch (_) {}
        return edges;
    }

    function connectEdge(pId, cId) {
        var inst = ensureInstance();
        if (!inst) return;
        var sourceId = getElId(pId),
            targetId = getElId(cId);
        try {
            inst.connect({ source: sourceId, target: targetId });
        } catch (_) {}
    }

    function clearAll() {
        var inst = ensureInstance();
        if (!inst) return;
        try {
            inst.deleteEveryConnection();
            inst.reset();
        } catch (_) {}
        instance = null;
    }

    function attachEvents() {
        var inst = ensureInstance();
        if (!inst) return;
        try {
            inst.bind("connection", function (info, originalEvent) {
                try {
                    try {
                        if (info && info.source)
                            info.source.setAttribute("draggable", "true");
                    } catch (_) {}
                    try {
                        if (info && info.target)
                            info.target.setAttribute("draggable", "true");
                    } catch (_) {}
                    var isUser =
                        !!originalEvent ||
                        (info && info.originalEvent) ||
                        (info &&
                            info.connection &&
                            info.connection._jsPlumb &&
                            info.connection._jsPlumb.params &&
                            info.connection._jsPlumb.params.originalEvent);
                    if (!isUser) return;
                    var source = info.sourceId,
                        target = info.targetId;
                    var $sEl = $("#" + source),
                        $tEl = $("#" + target);
                    var sRect = $sEl.length
                        ? $sEl[0].getBoundingClientRect()
                        : null;
                    var tRect = $tEl.length
                        ? $tEl[0].getBoundingClientRect()
                        : null;
                    var parentId = source.replace("task-node-", "");
                    var childId = target.replace("task-node-", "");
                    try {
                        if (sRect && tRect && tRect.left < sRect.left - 5) {
                            parentId = target.replace("task-node-", "");
                            childId = source.replace("task-node-", "");
                        }
                    } catch (_) {}
                    if (!parentId || !childId || parentId === childId) return;
                    // Add parent to the child's parent_ids array (multi-parent support)
                    $.ajax({
                        url:
                            appUrl +
                            "/task/" +
                            encodeURIComponent(childId) +
                            "/parents",
                        type: "POST",
                        data: JSON.stringify({ parent_id: Number(parentId) }),
                        contentType: "application/json",
                        headers: {
                            "X-CSRF-TOKEN": csrf,
                            "X-Requested-With": "XMLHttpRequest",
                            Accept: "application/json",
                        },
                    })
                        .done(function (res) {
                            var ok = !!(
                                res && (res.status === "success" || res.code === 200)
                            );
                            if (!ok) {
                                try {
                                    info.connection &&
                                        inst.deleteConnection(info.connection);
                                } catch (_) {}
                                try {
                                    window.showFloatingAlert &&
                                        window.showFloatingAlert(
                                            (res && res.message) || "Gagal menambahkan parent",
                                            "warning",
                                            3000
                                        );
                                } catch (_) {}
                            } else {
                                try {
                                    window.showFloatingAlert &&
                                        window.showFloatingAlert(
                                            "Parent ditambahkan",
                                            "success",
                                            1400
                                        );
                                } catch (_) {}
                                // Reload only the tree content to reflect new relationship
                                refreshTaskTreePartial();
                            }
                        })
                        .fail(function () {
                            try {
                                info.connection &&
                                    inst.deleteConnection(info.connection);
                            } catch (_) {}
                        });
                } catch (_) {}
            });
        } catch (_) {}

        try {
            inst.bind("click", function (conn) {
                try {
                    var sId = String(conn.sourceId || "");
                    var tId = String(conn.targetId || "");
                    var parentId = sId.replace("task-node-", "");
                    var childId = tId.replace("task-node-", "");
                    try {
                        var $sEl = $("#" + sId),
                            $tEl = $("#" + tId);
                        var sRect = $sEl.length
                            ? $sEl[0].getBoundingClientRect()
                            : null;
                        var tRect = $tEl.length
                            ? $tEl[0].getBoundingClientRect()
                            : null;
                        if (sRect && tRect && tRect.left < sRect.left - 5) {
                            parentId = tId.replace("task-node-", "");
                            childId = sId.replace("task-node-", "");
                        }
                    } catch (_) {}
                    if (!parentId || !childId) return;
                    // Remove parent from child's parent_ids array (multi-parent)
                    $.ajax({
                        url:
                            appUrl +
                            "/task/" +
                            encodeURIComponent(childId) +
                            "/parents",
                        type: "DELETE",
                        data: JSON.stringify({ parent_id: Number(parentId) }),
                        contentType: "application/json",
                        headers: {
                            "X-CSRF-TOKEN": csrf,
                            "X-Requested-With": "XMLHttpRequest",
                            Accept: "application/json",
                        },
                    })
                        .done(function (res) {
                            if (res && (res.status === "success" || res.code === 200)) {
                                try {
                                    inst.deleteConnection(conn);
                                } catch (_) {}
                                try {
                                    window.showFloatingAlert &&
                                        window.showFloatingAlert(
                                            "Parent dihapus",
                                            "success",
                                            1200
                                        );
                                } catch (_) {}
                                // Reload only the tree content to reflect removal
                                refreshTaskTreePartial();
                            } else {
                                try {
                                    window.showFloatingAlert &&
                                        window.showFloatingAlert(
                                            (res && res.message) ||
                                                "Gagal menghapus parent",
                                            "warning",
                                            2800
                                        );
                                } catch (_) {}
                            }
                        })
                        .fail(function () {
                            try {
                                window.showFloatingAlert &&
                                    window.showFloatingAlert(
                                        "Gagal menghapus parent",
                                        "warning",
                                        2800
                                    );
                            } catch (_) {}
                        });
                } catch (_) {}
            });
        } catch (_) {}
    }

    function layConnections(tasks) {
        var edges = buildExistingEdges(tasks);
        edges.forEach(function (e) {
            connectEdge(e.parent, e.child);
        });
    }

    function init(tasks) {
        try {
            clearAll();
        } catch (_) {}
        var inst = ensureInstance();
        if (!inst) return;
        try { currentTasks = Array.isArray(tasks) ? tasks.slice() : []; } catch(_) { currentTasks = []; }
        try {
            (tasks || []).forEach(function (t) {
                var $el = $("#" + getElId(t.id));
                if ($el.length) makeSourceAndTarget($el[0]);
            });
        } catch (_) {}
        layConnections(tasks);
        attachEvents();
        try {
            inst.repaintEverything && inst.repaintEverything();
        } catch (_) {}
    }

    window.initTaskPlumb = function (tasks) {
        clearTimeout(window.__initTaskPlumbTimer);
        window.__initTaskPlumbTimer = setTimeout(function () {
            init(tasks);
        }, 60);
    };

    try {
        $(window).on("resize", function () {
            try {
                var inst = ensureInstance();
                inst && inst.repaintEverything && inst.repaintEverything();
            } catch (_) {}
        });
        $(window).on("scroll", function () {
            try {
                var inst = ensureInstance();
                inst && inst.repaintEverything && inst.repaintEverything();
            } catch (_) {}
        });
    } catch (_) {}
})(jQuery);
