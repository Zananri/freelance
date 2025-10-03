// New simplified drag and drop implementation for project detail dependencies

var allTasks = []; // Global tasks array

// Build task tree from flat array
function buildTaskTree(data) {
    const map = {};
    const tree = [];
    
    // Create map
    data.forEach(task => {
        map[task.id] = { ...task, children: [] };
    });
    
    // Build tree
    data.forEach(task => {
        if (task.parent_id && map[task.parent_id]) {
            map[task.parent_id].children.push(map[task.id]);
        } else {
            tree.push(map[task.id]);
        }
    });
    
    return tree;
}

// Render single task node
function renderTaskNode(task, template) {
    const $template = template.clone().removeAttr('id').show();
    
    // Basic task info
    $template.find('.task-title').text(task.title || 'No Title');
    $template.find('.task-point').text(task.point || '0');
    $template.find('.task-date').text((task.start_date || '') + ' - ' + (task.due_date || ''));
    $template.attr('data-task-id', task.id);
    
    // Priority styling
    const priorityClass = {
        'HIGH': 'high-priority',
        'MEDIUM': 'medium-priority', 
        'LOW': 'low-priority'
    }[task.priority] || 'low-priority';
    $template.addClass(priorityClass);
    
    // Add children if any
    if (task.children && task.children.length > 0) {
        const $childGroup = $('<div class="child-group"></div>');
        task.children.forEach(child => {
            $childGroup.append(renderTaskNode(child, template.clone()));
        });
        $template.append($childGroup);
    }
    
    return $template;
}

// Main render function
function renderTaskList(data) {
    console.log("renderTaskList called with data:", data);
    
    const $tree = $("#task-tree");
    $tree.empty();
    
    if (!data || data.length === 0) return;
    
    // Separate free-positioned tasks from tree tasks
    const freePositionedTasks = data.filter(task => {
        const isFreePositioned = task.free_positioned == 1 || task.free_positioned === true || task.free_positioned === "1";
        const hasValidPosition = task.position_x != null && task.position_y != null;
        return isFreePositioned && hasValidPosition;
    });
    
    const treeTaskData = data.filter(task => {
        const isFreePositioned = task.free_positioned == 1 || task.free_positioned === true || task.free_positioned === "1";
        return !isFreePositioned;
    });
    
    console.log("Free positioned tasks:", freePositionedTasks);
    console.log("Tree tasks:", treeTaskData);
    
    // Render tree structure
    const treeData = buildTaskTree(treeTaskData);
    const $rootCol = $('<div class="root-column"></div>');
    $tree.append($rootCol);
    
    treeData.forEach((root) => {
        $rootCol.append(renderTaskNode(root, $("#task-template")));
    });
    
    // Render free-positioned tasks with absolute positioning
    freePositionedTasks.forEach((task) => {
        console.log("Rendering free-positioned task:", task);
        const $freeTask = renderTaskNode(task, $("#task-template"));
        $freeTask.addClass("free-positioned-task");
        $freeTask.css({
            position: "absolute",
            left: task.position_x + "px",
            top: task.position_y + "px",
            zIndex: 1000,
            border: "2px solid #007bff"
        });
        console.log("Applied CSS:", {
            left: task.position_x + "px",
            top: task.position_y + "px"
        });
        $tree.append($freeTask);
    });
}

// Setup drag and drop functionality
function setupTaskTreeDnD() {
    if (window.__taskTreeDndBound) return;
    window.__taskTreeDndBound = true;
    
    console.log("Setting up drag and drop");
    
    var dragState = {
        draggedTaskId: null
    };
    
    function updateTaskPosition(taskId, updateData) {
        console.log("Updating task position:", { taskId, updateData });
        
        // Update database
        return $.ajax({
            url: appUrl + "/task/" + encodeURIComponent(String(taskId)),
            type: "PUT",
            data: updateData,
            dataType: "json"
        })
        .done(function(response) {
            console.log("Database update successful:", response);
            
            // Update local data
            const task = allTasks.find(t => String(t.id) === String(taskId));
            if (task) {
                if (updateData.hasOwnProperty('parent_id')) task.parent_id = updateData.parent_id;
                if (updateData.hasOwnProperty('position_x')) task.position_x = parseInt(updateData.position_x);
                if (updateData.hasOwnProperty('position_y')) task.position_y = parseInt(updateData.position_y);
                if (updateData.hasOwnProperty('free_positioned')) task.free_positioned = updateData.free_positioned;
                
                console.log("Local task updated:", task);
                
                // Re-render
                renderTaskList(allTasks);
            }
        })
        .fail(function(xhr) {
            console.error("Database update failed:", xhr.responseText);
            alert("Gagal memindahkan task: " + (xhr.responseJSON?.message || "Error"));
        });
    }
    
    // Drag start
    $(document).on("dragstart", "#task-tree .task-box", function(e) {
        const taskId = $(this).attr("data-task-id");
        if (!taskId) return false;
        
        dragState.draggedTaskId = taskId;
        console.log("Drag started:", taskId);
        
        if (e.originalEvent?.dataTransfer) {
            e.originalEvent.dataTransfer.setData("text/plain", taskId);
        }
        $(this).addClass("dragging");
    });
    
    // Drag end
    $(document).on("dragend", "#task-tree .task-box", function(e) {
        $(this).removeClass("dragging");
        dragState.draggedTaskId = null;
    });
    
    // Allow drop on tree container (empty space)
    $(document).on("dragover", "#task-tree", function(e) {
        e.preventDefault();
    });
    
    // Drop on empty space
    $(document).on("drop", "#task-tree", function(e) {
        e.preventDefault();
        
        // Check if dropped on task card (not empty space)
        if ($(e.target).closest(".task-box").length > 0) return;
        
        const taskId = dragState.draggedTaskId;
        if (!taskId) return;
        
        // Calculate drop position relative to tree container
        const treeOffset = $("#task-tree").offset();
        const scrollLeft = $("#task-tree").scrollLeft();
        const scrollTop = $("#task-tree").scrollTop();
        
        let dropX = e.originalEvent.clientX - treeOffset.left + scrollLeft;
        let dropY = e.originalEvent.clientY - treeOffset.top + scrollTop;
        
        // Ensure minimum distance from edges
        dropX = Math.max(20, dropX);
        dropY = Math.max(20, dropY);
        
        console.log("Dropping task to free position:", {
            taskId: taskId,
            position: { x: dropX, y: dropY },
            treeOffset: treeOffset,
            clientPos: { x: e.originalEvent.clientX, y: e.originalEvent.clientY }
        });
        
        const updateData = {
            parent_id: null,
            position_x: Math.round(dropX),
            position_y: Math.round(dropY),
            free_positioned: 1
        };
        
        updateTaskPosition(taskId, updateData);
    });
    
    // Allow drop on task cards
    $(document).on("dragover", "#task-tree .task-box", function(e) {
        e.preventDefault();
    });
    
    // Drop on task card (make it child)
    $(document).on("drop", "#task-tree .task-box", function(e) {
        e.preventDefault();
        
        const targetTaskId = $(this).attr("data-task-id");
        const sourceTaskId = dragState.draggedTaskId;
        
        if (!targetTaskId || !sourceTaskId || targetTaskId === sourceTaskId) return;
        
        console.log("Dropping task on another task:", {
            sourceTaskId: sourceTaskId,
            targetTaskId: targetTaskId
        });
        
        const updateData = {
            parent_id: targetTaskId
        };
        
        updateTaskPosition(sourceTaskId, updateData);
    });
}

// Initialize when document is ready
$(document).ready(function() {
    setupTaskTreeDnD();
    console.log("Drag and drop initialized");
});