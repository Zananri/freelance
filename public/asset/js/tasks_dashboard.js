$(".btn-tab-task").on("click", function () {
    $(".btn-tab-task").removeClass("active");
    $(this).addClass("active");

    showTask();
});

function showTask() {
    let taskActive = $(".btn-tab-task.active").attr("data-tab-active");

    if (taskActive === "today") {
        getTaskToday();
    } else if (taskActive === "tomorrow") {
        getTaskTomorrow();
    }
}

function getTaskToday() {
    console.log("task aktive today");
}

function getTaskTomorrow() {
    console.log("task aktive today");
}
