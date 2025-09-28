const appUrl = $("meta[name=app-url]").attr("content");
const BAR_COLORS = ["color1", "color2", "color3", "color4"];

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let projectDueDate = null;

function fetchProjectDueDate(projectId) {
    return $.ajax({
        url: `${appUrl}/projects/${projectId}`,
        type: "GET",
        dataType: "json",
    }).done(function (response) {
        if (response.status === "success") {
            projectDueDate = new Date(response.data.due_date);
        }
    });
}

function getTaskStatus(task) {
    if (task.status === "completed") return "completed";
    if (task.status === "in_progress") return "in_progress";
    if (projectDueDate && new Date(task.due_date) > projectDueDate)
        return "late";
    return "in_progress";
}

function renderTimeline(tasks) {
    const totalTasks = tasks.length;
    $("#totalTaskTimeline").text(`Total ${totalTasks} Tasks`);

    const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
    ];
    $("#monthTitleTimeline").text(`${months[currentMonth]} ${currentYear}`);

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const headerRow = $("#timelineHeader").empty();
    const allDates = [];
    for (let d = 1; d <= daysInMonth; d++) {
        const loopDate = new Date(currentYear, currentMonth, d);
        headerRow.append(`<th>${d}</th>`);
        allDates.push(loopDate);
    }

    const body = $("#timelineRows").empty();
    const statusCounts = { completed: 0, in_progress: 0, late: 0 };
    tasks.forEach((task, idx) => {
        const startDate = new Date(task.start_date);
        const dueDate = new Date(task.due_date);

        const monthStart = new Date(currentYear, currentMonth, 1);
        const monthEnd = new Date(currentYear, currentMonth, daysInMonth);

        if (dueDate < monthStart || startDate > monthEnd) return;

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
``
        const barColorClass = BAR_COLORS[idx % BAR_COLORS.length];

        const row = $("<tr></tr>");
        for (let i = 0; i < startIdx; i++) row.append("<td></td>");

        const barTd = $("<td></td>")
            .attr("colspan", endIdx - startIdx + 1)
            .append(
                $("<div></div>")
                    .addClass(`timeline-bar ${barColorClass}`)
                    .css("pointer-events", "none")
                    .html(`<span class="circle"></span>${task.title}`)
            );
        row.append(barTd);

        for (let i = endIdx + 1; i < allDates.length; i++)
            row.append("<td></td>");
        body.append(row);
    });

    $("#inProgressCount").text(`${statusCounts.in_progress} Task`);
    $("#lateCount").text(`${statusCounts.late} Task`);
    $("#completedCount").text(`${statusCounts.completed} Task`);

}

function getTaskByProject(projectId) {
    fetchProjectDueDate(projectId);
    return $.ajax({
        url: `${appUrl}/projects/${projectId}/tasks`,
        type: "GET",
        dataType: "json",
    })
        .done(function (response) {
            if (response.status !== "success") return;
            renderTimeline(response.data);
        })
        .fail(function (xhr, status, error) {
            console.error("Error fetching tasks:", error);
        });
}

$(document).on("click", "#prevTimelineModal", function () {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    let projectId = $('meta[name="project-id"]').attr("content");
    getTaskByProject(projectId);
});

$(document).on("click", "#nextTimelineModal", function () {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    let projectId = $('meta[name="project-id"]').attr("content");
    getTaskByProject(projectId);
});

let projectId = $('meta[name="project-id"]').attr("content");
if (projectId) {
    getTaskByProject(projectId);
}
