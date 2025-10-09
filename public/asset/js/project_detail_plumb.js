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
    function getElId(taskId) {
        return "task-node-" + String(taskId);
    }

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
                                res &&
                                (res.status === "success" || res.code === 200)
                            );
                            if (!ok) {
                                try {
                                    info.connection &&
                                        inst.deleteConnection(info.connection);
                                } catch (_) {}
                                try {
                                    window.showFloatingAlert &&
                                        window.showFloatingAlert(
                                            (res && res.message) ||
                                                "Gagal menambah parent",
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
                                try {
                                    inst.repaintEverything &&
                                        inst.repaintEverything();
                                } catch (_) {}
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
                            if (
                                res &&
                                (res.status === "success" || res.code === 200)
                            ) {
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
                                try {
                                    inst.repaintEverything &&
                                        inst.repaintEverything();
                                } catch (_) {}
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
