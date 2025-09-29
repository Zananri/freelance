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
            $childGroup.append($child);
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
}

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
