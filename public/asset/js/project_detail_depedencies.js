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

    $item.find(".task-status").addClass(`status-${normalizedStatus}`);
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

            // Gather center Y of each child .task-box relative to childGroup
            const childCenters = [];
            $childGroup.find('.task-item').each(function() {
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
    return $svg;
}

function drawSvgConnectors() {
    try {
        const $svg = ensureSvgOverlay();
        // clear
        $svg.empty();

        // compute bounding of tree to set SVG viewbox if needed
        const treeOff = $('#task-tree').offset();
        const treeW = $('#task-tree').outerWidth();
        const treeH = $('#task-tree').outerHeight();
        $svg.attr('width', treeW).attr('height', treeH);

        // for each branch, find parent box and children boxes
        $('#task-tree .task-branch').each(function() {
            const $branch = $(this);
            const $parentBox = $branch.children('.task-item').first().find('.task-box').first();
            const $childGroup = $branch.children('.child-group').first();
            if (!$parentBox.length || !$childGroup.length) return;

            // compute vertical center points for each child
            const childCenters = [];
            $childGroup.find('.task-item .task-box').each(function() {
                const $b = $(this);
                childCenters.push({ el: $b, x: $b.offset().left - treeOff.left, y: $b.offset().top - treeOff.top + ($b.outerHeight()/2) });
            });
            if (childCenters.length === 0) return;

            // compute parent point (right center)
            const pX = $parentBox.offset().left - treeOff.left + $parentBox.outerWidth();
            const pY = $parentBox.offset().top - treeOff.top + ($parentBox.outerHeight()/2);

            // compute vertical center line x (slightly to left of child boxes left edge)
            // choose verticalX halfway between parent right and first child left
            const firstChildLeft = $childGroup.find('.task-item .task-box').first().offset().left - treeOff.left;
            const verticalX = Math.round((pX + firstChildLeft) / 2);

            // draw vertical line from top child center to bottom child center
            const ys = childCenters.map(c => c.y).sort((a,b)=>a-b);
            const vTop = ys[0];
            const vBottom = ys[ys.length-1];
            const vLine = document.createElementNS('http://www.w3.org/2000/svg','line');
            vLine.setAttribute('x1', verticalX);
            vLine.setAttribute('y1', vTop);
            vLine.setAttribute('x2', verticalX);
            vLine.setAttribute('y2', vBottom);
            vLine.setAttribute('stroke','#d1d5db');
            vLine.setAttribute('stroke-width','1');
            $svg[0].appendChild(vLine);

            // for each child draw a path from parent to child via verticalX
            childCenters.forEach(function(ch){
                const cX = ch.x;
                const cY = ch.y;
                // path: parent -> mid -> verticalX -> child
                // use simple cubic bezier for slight curve
                const midX = (pX + verticalX) / 2;
                const path = document.createElementNS('http://www.w3.org/2000/svg','path');
                const d = `M ${pX} ${pY} C ${midX} ${pY} ${midX} ${cY} ${verticalX} ${cY}`;
                path.setAttribute('d', d);
                path.setAttribute('stroke', '#d1d5db');
                path.setAttribute('stroke-width', '2');
                path.setAttribute('fill', 'none');
                path.setAttribute('stroke-linecap','butt');
                $svg[0].appendChild(path);

                // small horizontal stub from verticalX to child box left edge (so it looks connected)
                const stub = document.createElementNS('http://www.w3.org/2000/svg','line');
                stub.setAttribute('x1', verticalX);
                stub.setAttribute('y1', cY);
                stub.setAttribute('x2', cX - 6); // stop a few px before box to match visual
                stub.setAttribute('y2', cY);
                stub.setAttribute('stroke','#d1d5db');
                stub.setAttribute('stroke-width','2');
                $svg[0].appendChild(stub);
            });

            // also draw a short horizontal connector from parent right edge toward verticalX
            const parentStub = document.createElementNS('http://www.w3.org/2000/svg','line');
            parentStub.setAttribute('x1', pX);
            parentStub.setAttribute('y1', pY);
            parentStub.setAttribute('x2', verticalX); // meet exactly at verticalX
            parentStub.setAttribute('y2', pY);
            parentStub.setAttribute('stroke','#d1d5db');
            parentStub.setAttribute('stroke-width','2');
            $svg[0].appendChild(parentStub);
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
