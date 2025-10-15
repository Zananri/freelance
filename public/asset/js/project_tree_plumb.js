/*
 Project Tree multi-parent project edges using jsPlumb.
 Draws connections between parent and child project cards.
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
    var csrf = window.csrfToken || meta("csrf-token") || "";

    var instance = null;
    var currentProjects = [];

    function getElId(projectId) {
        return "proj-node-" + String(projectId);
    }

    // Partial refresh function to reload tree without full page reload
    function refreshProjectTreePartial() {
        try {
            // Find element near viewport center for scroll preservation
            var $tree = $("#task-tree");
            var viewportTop = $tree.scrollTop();
            var viewportHeight = $tree.height();
            var viewportCenter = viewportTop + viewportHeight / 2;
            
            var $cards = $tree.find('.task-box[data-project-id]');
            var anchorId = null;
            var anchorOffset = 0;
            
            $cards.each(function() {
                var $card = $(this);
                var cardTop = $card.position().top;
                if (cardTop >= viewportCenter - 100 && cardTop <= viewportCenter + 100) {
                    anchorId = $card.attr('data-project-id');
                    anchorOffset = viewportTop - cardTop;
                    return false; // break
                }
            });
            
            // Fetch fresh data and re-render
            if (typeof window.fetchProjectTree === 'function') {
                window.fetchProjectTree().done(function() {
                    // Restore scroll position
                    if (anchorId) {
                        setTimeout(function() {
                            var $anchor = $tree.find('.task-box[data-project-id="' + anchorId + '"]');
                            if ($anchor.length) {
                                var newTop = $anchor.position().top + anchorOffset;
                                $tree.scrollTop(newTop);
                            }
                        }, 100);
                    }
                });
            }
        } catch(_) {}
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
                    instance.setContainer($c.get(0));
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
            // accept either a jQuery object or raw element/selector
            var $el = el && el.jquery ? el : $(el);
            if (!$el.length) return;
            inst.makeSource($el.get(0), {
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
            var $el2 = el && el.jquery ? el : $(el);
            if (!$el2.length) return;
            inst.makeTarget($el2.get(0), {
                dropOptions: { hoverClass: "plumb-drop-ok" },
                anchor: "Left",
                allowLoopback: false,
                maxConnections: -1,
            });
        } catch (_) {}
    }

    function buildExistingEdges(projects) {
        var edges = [];
        try {
            $.each(projects || [], function (_i, p) {
                var parents = [];
                if ($.isArray(p.parent_ids)) parents = p.parent_ids.slice();
                if (p.legacy_parent_id && $.inArray(p.legacy_parent_id, parents) === -1)
                    parents.push(p.legacy_parent_id);
                $.each(parents, function (_j, pid) {
                    if (pid)
                        edges.push({ parent: String(pid), child: String(p.id) });
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
                        if (info && info.source) $(info.source).attr("draggable", "true");
                    } catch (_) {}
                    try {
                        if (info && info.target) $(info.target).attr("draggable", "true");
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
                    var $sEl = $("#" + source), $tEl = $("#" + target);
                    var sRect = $sEl.length ? $sEl.get(0).getBoundingClientRect() : null;
                    var tRect = $tEl.length ? $tEl.get(0).getBoundingClientRect() : null;
                    var parentId = source.replace("proj-node-", "");
                    var childId = target.replace("proj-node-", "");
                    try {
                        if (sRect && tRect) {
                            // Check horizontal first (left card = parent, right card = child)
                            var horizontalDiff = Math.abs(tRect.left - sRect.left);
                            
                            if (horizontalDiff > 10) {
                                // Horizontal layout: left = parent, right = child
                                if (tRect.left < sRect.left - 5) {
                                    parentId = target.replace("proj-node-", "");
                                    childId = source.replace("proj-node-", "");
                                }
                            } else {
                                // Vertical layout: top = parent, bottom = child
                                if (sRect.top > tRect.top + 5) {
                                    parentId = target.replace("proj-node-", "");
                                    childId = source.replace("proj-node-", "");
                                }
                            }
                        }
                    } catch (_) {}
                    if (!parentId || !childId || parentId === childId) return;
                    
                    // Delete the connection immediately to prevent visual duplication
                    try {
                        if (info && info.connection) {
                            inst.deleteConnection(info.connection, { fireEvent: false });
                        }
                    } catch (_) {}
                    
                    $.ajax({
                        url:
                            appUrl +
                            "/project/" +
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
                                // Reload only the tree content to reflect new relationship
                                refreshProjectTreePartial();
                            }
                        })
                        .fail(function () {
                            try {
                                window.showFloatingAlert &&
                                    window.showFloatingAlert(
                                        "Gagal menambah parent",
                                        "warning",
                                        2800
                                    );
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
                    var parentId = sId.replace("proj-node-", "");
                    var childId = tId.replace("proj-node-", "");
                    try {
                        var $sEl = $("#" + sId), $tEl = $("#" + tId);
                        var sRect = $sEl.length ? $sEl.get(0).getBoundingClientRect() : null;
                        var tRect = $tEl.length ? $tEl.get(0).getBoundingClientRect() : null;
                        if (sRect && tRect) {
                            // Check horizontal first (left card = parent, right card = child)
                            var horizontalDiff = Math.abs(tRect.left - sRect.left);
                            
                            if (horizontalDiff > 10) {
                                // Horizontal layout: left = parent, right = child
                                if (tRect.left < sRect.left - 5) {
                                    parentId = tId.replace("proj-node-", "");
                                    childId = sId.replace("proj-node-", "");
                                }
                            } else {
                                // Vertical layout: top = parent, bottom = child
                                if (sRect.top > tRect.top + 5) {
                                    parentId = tId.replace("proj-node-", "");
                                    childId = sId.replace("proj-node-", "");
                                }
                            }
                        }
                    } catch (_) {}
                    if (!parentId || !childId) return;
                    $.ajax({
                        url: appUrl + "/project/" + encodeURIComponent(childId) + "/parents",
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
                                    window.showFloatingAlert && window.showFloatingAlert("Parent dihapus", "success", 1200);
                                } catch (_) {}
                                // Reload tree to reflect changes
                                refreshProjectTreePartial();
                            } else {
                                try {
                                    window.showFloatingAlert && window.showFloatingAlert((res && res.message) || "Gagal menghapus parent", "warning", 2800);
                                } catch (_) {}
                            }
                        })
                        .fail(function () {
                            try {
                                window.showFloatingAlert && window.showFloatingAlert("Gagal menghapus parent", "warning", 2800);
                            } catch (_) {}
                        });
                } catch (_) {}
            });
        } catch (_) {}
    }

    function layConnections(projects) {
        var edges = buildExistingEdges(projects);
        $.each(edges, function (_i, e) {
            connectEdge(e.parent, e.child);
        });
    }

    function init(projects) {
        try {
            clearAll();
        } catch (_) {}
        var inst = ensureInstance();
        if (!inst) return;
        try { currentProjects = Array.isArray(projects) ? projects.slice() : []; } catch(_) { currentProjects = []; }
        try {
            $.each(projects || [], function (_i, p) {
                var $el = $("#" + getElId(p.id));
                if ($el.length) makeSourceAndTarget($el);
            });
        } catch (_) {}
        layConnections(projects);
        attachEvents();
        try {
            inst.repaintEverything && inst.repaintEverything();
        } catch (_) {}
    }

    window.initProjectPlumb = function (projects) {
        clearTimeout(window.__initProjectPlumbTimer);
        window.__initProjectPlumbTimer = setTimeout(function () {
            init(projects);
        }, 60);
    };
    
    window.refreshProjectTreePartial = refreshProjectTreePartial;

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
