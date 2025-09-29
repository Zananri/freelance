function buildTaskTree(tasks) {
    const map = {};
    const roots = [];
    tasks.forEach(task => {
        map[task.id] = { ...task, children: [] };
    });
    tasks.forEach(task => {
        if (task.parent_id && task.parent_id != task.id && map[task.parent_id]) {
            map[task.parent_id].children.push(map[task.id]);
        } else {
            roots.push(map[task.id]);
        }
    });
    return roots;
}

function normalizeStatus(status) {
    const statusMap = {
        'not started': 'not-started',
        'in progress': 'in-progress',
        'not-started': 'not-started',
        'in-progress': 'in-progress',
    };
    return statusMap[status.toLowerCase()] || status.toLowerCase().replace(/\s+/g, '-');
}

function renderTaskNode(task, $template) {
    const normalizedStatus = normalizeStatus(task.status);
    let $item = $template.clone().removeClass("d-none").removeAttr("id");

    // Determine visual status for legend & dot
    let visual = 'not-started';
    try {
        const s = String((task.status || '')).toLowerCase();
        if (s === 'new_request' || s === 'new request' || s === 'new-request' || s === 'new_request') {
            visual = 'not-started';
        } else if (s === 'in_progress' || s === 'in progress' || s === 'in-progress') {
            visual = 'in-progress';
        } else if (s === 'complete' || s === 'completed') {
            visual = 'complete';
        } else {
            visual = normalizedStatus || 'not-started';
        }

        // late detection: if due_date present and today > due_date and not complete
        if (task.due_date && visual !== 'complete') {
            const due = new Date(task.due_date);
            const today = new Date();
            // normalize dates (midnight) for comparison
            due.setHours(0,0,0,0);
            today.setHours(0,0,0,0);
            if (!isNaN(due.getTime()) && today > due) {
                visual = 'late';
            }
        }
    } catch (e) { /* ignore */ }

    $item.find(".task-status").addClass(visual);
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
            position: "relative"
        });

        if (task.children.length > 1) {
            const $vertical = $('<div class="connector-vertical"></div>');
            $childGroup.append($vertical);
        }

        task.children.forEach(child => {
            const $child = renderTaskNode(child, $template);
            // If there are multiple children, render a short horizontal stub from
            // the central vertical connector to each child box so connectors don't
            // mistakenly join child-to-child. This matches the visual in the
            // provided screenshot: a central vertical line with small horizontals
            // to each child.
            if (task.children.length > 1) {
                const $childWrap = $('<div class="child-wrap"></div>');
                const $childStub = $('<div class="connector-horizontal child-connector"></div>');
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

    treeData.forEach(task => {
        $rootCol.append(renderTaskNode(task, $template));
    });

    $tree.append($rootCol);
    // After DOM is inserted, adjust connector sizes/positions so lines meet exactly
    // Use a short timeout to allow browser to compute layout (images/fonts)
    setTimeout(adjustConnectors, 40);
    // Also draw SVG connectors after layout
    setTimeout(drawSvgConnectors, 60);
}

// Ensure connectors are sized/positioned to visually meet:
function adjustConnectors() {
    try {
        $('#task-tree .task-branch').each(function() {
            const $branch = $(this);
            const $childGroup = $branch.children('.child-group').first();
            if (!$childGroup.length) return;
            const $vertical = $childGroup.children('.connector-vertical').first();
            if (!$vertical.length) return;

            // Gather center Y of each IMMEDIATE child .task-box relative to childGroup
            // Use children() to avoid picking up nested descendant .task-item elements
            const childCenters = [];
            $childGroup.children().each(function() {
                const $item = $(this);
                const $box = $item.find('.task-box').first();
                if (!$box.length) return;
                const relTop = $box.offset().top - $childGroup.offset().top + ($box.outerHeight() / 2);
                childCenters.push(relTop);
            });
            if (childCenters.length === 0) return;

            const minC = Math.min.apply(null, childCenters);
            const maxC = Math.max.apply(null, childCenters);

            // Set vertical top/height to span child centers (plus tiny padding)
            const padding = 0; // tweakable
            const top = Math.floor(minC - padding);
            const height = Math.ceil((maxC - minC) + (padding * 2));
            $vertical.css({ top: top + 'px', height: Math.max(2, height) + 'px' });

            // Compute vertical middle (where parent horizontal should meet)
            const verticalMid = minC + ((maxC - minC) / 2);

            // Adjust the main horizontal connector width and vertical position so it
            // meets the verticalMid exactly.
            const $connector = $branch.children('.connector-horizontal').first();
            if ($connector.length) {
                // compute absolute x of vertical left edge
                const verticalLeft = $childGroup.offset().left + parseFloat($vertical.css('left') || 0);
                const parentBox = $branch.children('.task-item').first().find('.task-box').first();
                if (parentBox.length) {
                    const parentRight = parentBox.offset().left + parentBox.outerWidth();
                    // Ensure the horizontal line extends at least up to the vertical
                    // including child-group padding. Provide a reasonable minimum.
                    const childGroupPaddingLeft = parseFloat($childGroup.css('padding-left') || 0);
                    let desiredWidth = Math.round((verticalLeft + childGroupPaddingLeft) - parentRight);
                    if (desiredWidth < 10) desiredWidth = 10; // min width
                    $connector.css({ width: desiredWidth + 'px' });

                    // Position the horizontal vertically so it aligns to verticalMid
                    const branchTop = $branch.offset().top;
                    const connTop = Math.round(verticalMid + $childGroup.offset().top - branchTop - ($connector.outerHeight() / 2));
                    // Use margin-top for positioning inside flex row
                    $connector.css({ marginTop: connTop + 'px' });
                }
            }

            // Align child connectors vertically to each child center (they meet vertical at child's center)
            $childGroup.find('.child-wrap').each(function() {
                const $wrap = $(this);
                const $stub = $wrap.children('.child-connector').first();
                const $childItem = $wrap.children('.task-item').first();
                const $childBox = $childItem.find('.task-box').first();
                if (!$stub.length || !$childBox.length) return;
                const center = $childBox.offset().top - $childGroup.offset().top + ($childBox.outerHeight() / 2);
                // position stub so it's vertically centered to child box (so it meets vertical at child center)
                const stubTop = Math.round(center - ($stub.outerHeight() / 2));
                $stub.css({ marginTop: (stubTop) + 'px' });
            });
        });
    } catch (e) {
        console.warn('adjustConnectors error', e);
    }
}

// Recompute connectors on resize and when fonts/images may change layout
$(window).on('resize', function() { setTimeout(adjustConnectors, 60); });

// --- SVG based connectors: more accurate and curveable ---
function ensureSvgOverlay() {
    let $svg = $('#task-tree-svg');
    if ($svg.length === 0) {
        $svg = $("<svg id='task-tree-svg' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'></svg>");
        $('#task-tree').append($svg);
    }
    // ensure SVG covers the full scrollable area inside #task-tree
    const $tree = $('#task-tree');
    if ($tree.length) {
        const w = $tree.prop('scrollWidth');
        const h = $tree.prop('scrollHeight');
        // set both attributes and explicit css pixel size so the SVG coordinates
        // line up exactly with elements inside the container even when the
        // container is translated (for example when a sidebar opens/closes).
        $svg.attr('width', w).attr('height', h).attr('viewBox', `0 0 ${w} ${h}`);
        $svg.css({ left: 0, top: 0, width: (w || 0) + 'px', height: (h || 0) + 'px' });
    }
    // keep pointer-events disabled so clicks pass through
    $svg.css({ pointerEvents: 'none' });
    return $svg;
}

// Helper: create an SVG element with namespace then return as jQuery object
function createSvgEl(tagName, attrs) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tagName);
    const $el = $(el);
    if (attrs) {
        $el.attr(attrs);
    }
    return $el;
}

function drawSvgConnectors() {
    try {
        const $svg = ensureSvgOverlay();
        // clear
        $svg.empty();
    // compute bounding of tree to set SVG viewbox using scroll sizes (covers full area)
    const $tree = $('#task-tree');
    // Use getBoundingClientRect plus scroll offsets so coordinates remain
    // correct when the page layout is translated (e.g. sidebar open/close)
    const treeEl = $tree[0];
    const treeRect = treeEl ? treeEl.getBoundingClientRect() : { left: 0, top: 0 };
    const treeScrollLeft = $tree.scrollLeft();
    const treeScrollTop = $tree.scrollTop();
    const treeW = ($tree.prop('scrollWidth') || $tree.outerWidth());
    const treeH = ($tree.prop('scrollHeight') || $tree.outerHeight());
    $svg.attr('width', treeW).attr('height', treeH).attr('viewBox', `0 0 ${treeW} ${treeH}`);

        // for each branch, find parent box and children boxes
        $('#task-tree .task-branch').each(function() {
            const $branch = $(this);
            const $parentBox = $branch.children('.task-item').first().find('.task-box').first();
            const $childGroup = $branch.children('.child-group').first();
            if (!$parentBox.length || !$childGroup.length) return;

            // compute vertical center points for each IMMEDIATE child only
            // (avoid finding nested descendant boxes which belong to deeper levels)
            const childCenters = [];
            $childGroup.children().each(function() {
                const $childEl = $(this);
                const $b = $childEl.find('.task-box').first();
                if (!$b.length) return;
                const bRect = $b[0].getBoundingClientRect();
                // coordinates relative to the tree's scroll coordinate system
                const relX = Math.round((bRect.left - treeRect.left) + treeScrollLeft);
                const relY = Math.round((bRect.top - treeRect.top) + treeScrollTop + ($b.outerHeight()/2));
                childCenters.push({ el: $b, x: relX, y: relY });
            });
            if (childCenters.length === 0) return;

            // compute parent point (right center)
            const pRect = $parentBox[0].getBoundingClientRect();
            const pX = Math.round((pRect.left - treeRect.left) + treeScrollLeft + $parentBox.outerWidth());
            const pY = Math.round((pRect.top - treeRect.top) + treeScrollTop + ($parentBox.outerHeight()/2));

            // compute vertical center line x: halfway between parent right and
            // the first IMMEDIATE child's left (use childCenters[0] which was
            // collected from immediate children) so connectors don't jump to
            // ancestor-level boxes.
            const verticalX = Math.round((pX + (childCenters[0] ? childCenters[0].x : pX)) / 2);

            // draw vertical line from top child center to bottom child center
            const ys = childCenters.map(c => c.y).sort((a,b)=>a-b);
            const vTop = ys[0];
            const vBottom = ys[ys.length-1];
            const $vLine = createSvgEl('line', {
                x1: verticalX,
                y1: vTop,
                x2: verticalX,
                y2: vBottom,
                stroke: '#d1d5db',
                'stroke-width': '1',
                'stroke-linecap': 'butt',
                'stroke-linejoin': 'miter'
            });
            $svg.append($vLine);

            // for each child draw a straight horizontal stub from verticalX to the child's left edge
            childCenters.forEach(function(ch){
                const cX = ch.x;
                const cY = ch.y;
                // small horizontal stub from verticalX to child box left edge
                const $stub = createSvgEl('line', {
                    x1: verticalX,
                    y1: cY,
                    x2: cX,
                    y2: cY,
                    stroke: '#d1d5db',
                    'stroke-width': '2',
                    'stroke-linecap': 'butt'
                });
                $svg.append($stub);
            });

            // also draw a short horizontal connector from parent right edge toward verticalX
            const $parentStub = createSvgEl('line', {
                x1: pX,
                y1: pY,
                x2: verticalX,
                y2: pY,
                stroke: '#d1d5db',
                'stroke-width': '2',
                'stroke-linecap': 'butt'
            });
            $svg.append($parentStub);
        });
    } catch (e) { console.warn('drawSvgConnectors error', e); }
}

// call SVG draw after layout changes
setTimeout(drawSvgConnectors, 50);
$(window).on('resize scroll', function(){ setTimeout(drawSvgConnectors, 80); });

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
        if (response.status !== "success" || !response.data || response.data.length === 0) {
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

(function setupTreeResizeObservers(){
    try {
        var $tree = $('#task-tree');
        if (!$tree.length) return;

        // expose a debounced schedule function so other code (or tests) can
        // request a recalculation after layout mutations (sidebar open/close)
        var scheduleRecalc = (function(){
            var t = null;
            var inner = function(){ try { adjustConnectors(); drawSvgConnectors(); } catch(_){} };
            var debounced = function(delay){
                clearTimeout(t); t = setTimeout(inner, delay || 40);
            };
            // expose on window for manual triggering if needed
            window.__taskTreeScheduleRecalc = debounced;
            return debounced;
        })();
        
        if (typeof window.ResizeObserver !== 'undefined') {
            var ro = new ResizeObserver(function(){ scheduleRecalc(); });
            ro.observe($tree[0]);
            var $parent = $tree.closest('.structure-detail-content');
            if (!$parent.length) $parent = $tree.parent();
            if ($parent.length && $parent[0] !== $tree[0]) ro.observe($parent[0]);
            window.__taskTreeResizeObserver = ro;
        } else {
            
            var lastW = $tree.width();
            var lastH = $tree.height();
            var $parent2 = $tree.closest('.structure-detail-content');
            if (!$parent2.length) $parent2 = $tree.parent();
            var lastPW = $parent2.length ? $parent2.width() : null;

            window.__taskTreeInterval = setInterval(function(){
                try {
                    var w = $tree.width();
                    var h = $tree.height();
                    var pW = $parent2.length ? $parent2.width() : null;
                    if (w !== lastW || h !== lastH || pW !== lastPW) {
                        lastW = w; lastH = h; lastPW = pW;
                        scheduleRecalc(20);
                    }
                } catch(_){}
            }, 220); 
        }

        // Watch for DOM mutations that commonly occur when sidebar toggles
        // (body class changes, sidebar element resized, etc). If detected,
        // schedule a recalculation after a short debounce so connectors stay aligned.
        try {
            var moTarget = document.body;
            var mo = new MutationObserver(function(muts){
                // only trigger when attributes or childList change (not every text mutation)
                scheduleRecalc(60);
            });
            mo.observe(moTarget, { attributes: true, childList: true, subtree: false });
            window.__taskTreeMutationObserver = mo;
        } catch (e) {
            // ignore if MutationObserver isn't available
        }
    } catch (e) {
        console.warn('setupTreeResizeObservers error', e);
    }
})();
