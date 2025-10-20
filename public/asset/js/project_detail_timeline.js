const appUrl = $("meta[name=app-url]").attr("content");
const BAR_COLOR_MAP = {
    new_request: "new",
    in_progress: "progress",
    completed: "completed",
    late: "late",
};

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let projectDueDate = null;
let tasks = [];

function fetchProjectDueDate(projectId) {
    return $.ajax({
        url: `${appUrl}/projects/${projectId}`,
        type: "GET",
        dataType: "json",
    }).done(function (response) {
        console.log(response);

        if (response.status === "success") {
            projectDueDate = new Date(response.data.due_date);
        }
    });
}

function getTaskStatus(task) {
    const due = new Date(task.due_date);
    const today = new Date();
    due.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    if (task.status === "completed") return "completed";

    if (due < today) return "late";

    if (task.status === "new_request") return "new_request";
    if (task.status === "in_progress") return "in_progress";

    return "in_progress";
}

const getMonthYearEN = (date) => {
  const formatted = formatDateENFull(date);
  const parts = formatted.split(" ");
  return `${parts[2]} ${parts[3]}`;
};

function renderTimeline(tasks) {
    const displayDate = new Date(currentYear, currentMonth, 1);
    $("#monthTitleTimeline").text(getMonthYearEN(displayDate));

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const headerRow = $("#timelineHeader").empty();
    const allDates = [];
    for (let d = 1; d <= daysInMonth; d++) {
        const loopDate = new Date(currentYear, currentMonth, d);
        headerRow.append(`<th>${d}</th>`);
        allDates.push(loopDate);
    }

    const body = $("#timelineRows").empty();
    const statusCounts = { new_request: 0, completed: 0, in_progress: 0, late: 0 };

    const tasksInMonth = tasks.filter(task => {
        const startDate = new Date(task.start_date);
        const dueDate = new Date(task.due_date);
        const monthStart = new Date(currentYear, currentMonth, 1);
        const monthEnd = new Date(currentYear, currentMonth, daysInMonth);
        return !(dueDate < monthStart || startDate > monthEnd) && task.status !== 'canceled' && task.status !== 'deleted';
    });

    $("#totalTaskTimeline").text(`Total ${tasksInMonth.length} Tasks`);

    tasksInMonth.forEach((task) => {
        const startDate = new Date(task.start_date);
        const dueDate = new Date(task.due_date);

        const monthStart = new Date(currentYear, currentMonth, 1);
        const monthEnd = new Date(currentYear, currentMonth, daysInMonth);

        const effectiveStart = startDate < monthStart ? monthStart : startDate;
        const effectiveEnd = dueDate > monthEnd ? monthEnd : dueDate;

        const startIdx = allDates.findIndex(
            (d) => d.toDateString() === effectiveStart.toDateString()
        );
        const endIdx = allDates.findIndex(
            (d) => d.toDateString() === effectiveEnd.toDateString()
        );

        const status = getTaskStatus(task);
        statusCounts[status]++;

        const barColorClass = BAR_COLOR_MAP[status] || "new";

        const row = $("<tr></tr>");
        for (let i = 0; i < startIdx; i++) row.append("<td></td>");

        const barTd = $("<td></td>")
            .attr("colspan", endIdx - startIdx + 1)
            .append(
                $("<div></div>")
                    .addClass(`timeline-bar ${barColorClass}`)
                    .attr("data-task-id", task.id)
                    .css({
                        "pointer-events": "auto",
                        "cursor": "pointer",
                        "z-index": "2",
                        "position": "relative",
                    })
                    .html(`<span class="bar-name">${task.title}</span>`)
            );

        row.append(barTd);

        for (let i = endIdx + 1; i < allDates.length; i++) row.append("<td></td>");

        body.append(row);
    });

    $("#newRequestCount").text(`${statusCounts.new_request} Task`);
    $("#inProgressCount").text(`${statusCounts.in_progress} Task`);
    $("#lateCount").text(`${statusCounts.late} Task`);
    $("#completedCount").text(`${statusCounts.completed} Task`);

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
        console.log(response);

        $("#task-loading").addClass("d-none");
        if (response.status !== "success" || !response.data || response.data.length === 0) {
            $("#task-tree").empty();
            return;
        }
        tasks = response.data;
        renderTimeline(response.data);
    })
    .fail(function (xhr, status, error) {
        $("#task-loading").addClass("d-none");
        console.error("Error fetching tasks:", error);
        $("#task-error").removeClass("d-none");
        $("#task-tree").empty();
    });
}

$(document).on("click", "#prevTimelineModal", function () {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    if (tasks.length > 0) {
        renderTimeline(tasks);
    } else {
        let projectId = $('meta[name="project-id"]').attr("content");
        getTaskByProject(projectId);
    }
});

$(document).on("click", "#nextTimelineModal", function () {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    if (tasks.length > 0) {
        renderTimeline(tasks);
    } else {
        let projectId = $('meta[name="project-id"]').attr("content");
        getTaskByProject(projectId);
    }
});

let projectId = $('meta[name="project-id"]').attr("content");
if (projectId) {
    getTaskByProject(projectId);
}

$("#fullscreen-btn").on("click", function () {
    const $timeline = $(".timeline-content");
    const $icon = $(this).find("span.material-symbols-outlined");

    if ($timeline.hasClass("fullscreen")) {
        $timeline.removeClass("fullscreen");
        $icon.text("fullscreen");
    } else {
        $timeline.addClass("fullscreen");
        $icon.text("fullscreen_exit");
    }
});
