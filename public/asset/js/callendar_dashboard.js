const dashboardAppUrl = $("meta[name=app-url]").attr("content");
const dashboardCalendarLocale = document.documentElement.lang
    .toLowerCase()
    .startsWith("id")
    ? "id-ID"
    : "en-US";
const dashboardCalendarModalEl = document.getElementById(
    "dashboardCalendarEventModal",
);
const dashboardCalendarEventModal = dashboardCalendarModalEl
    ? new bootstrap.Modal("#dashboardCalendarEventModal", { keyboard: false })
    : null;
const dashboardCalendarMonthModalEl = document.getElementById(
    "dashboardCalendarMonthModal",
);
const dashboardCalendarMonthModal = dashboardCalendarMonthModalEl
    ? new bootstrap.Modal("#dashboardCalendarMonthModal", { keyboard: false })
    : null;

let currentDate = new Date();
let ARR_DATA_CALENDAR = [];

function pad(number) {
    return String(number).padStart(2, "0");
}

function escapeHtml(text) {
    return String(text || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatTimeDisplay(timeString) {
    if (!timeString) return "--:--";
    if (typeof timeString === "string") {
        const match = timeString.match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
        if (match) return `${match[1]}:${match[2]}`;
    }

    const date = new Date(timeString);
    if (Number.isNaN(date.getTime())) return "--:--";
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDateLabel(dateString) {
    const date = new Date(`${dateString}T00:00:00`);
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString(dashboardCalendarLocale, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

function toggleCalendarLoader(show) {
    $(".calendar-attendance .loader").toggleClass("d-none", !show);
}

async function renderCalendar(year, month) {
    const calendarBody = $(".table-calendar tbody");
    calendarBody.empty();

    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    $(".calendar-month").text(
        currentDate.toLocaleString(dashboardCalendarLocale, { month: "long" }),
    );
    $(".calendar-year").text(`${year}`);

    let day = 1;
    let row = $("<tr>");

    for (let i = 0; i < firstDay; i++) {
        row.append('<td class="empty-cell"></td>');
    }

    for (let i = 0; i < totalDays; i++) {
        if ((firstDay + i) % 7 === 0 && i !== 0) {
            calendarBody.append(row);
            row = $("<tr>");
        }

        const today = new Date();
        const isToday =
            today.getFullYear() === year &&
            today.getMonth() === month &&
            today.getDate() === day;
        const dateKey = `${year}-${pad(month + 1)}-${pad(day)}`;

        row.append(
            `<td class="calendar-day ${isToday ? "today" : ""}" data-calendar-date="${dateKey}"><div class="day">${day}</div><div class="box-event"></div></td>`,
        );
        day++;
    }

    calendarBody.append(row);
    return true;
}

function appendEventCalendar(eventRow) {
    const $targetDay = $(document).find(
        `[data-calendar-date="${eventRow.date_event}"] .box-event`,
    );
    if (!$targetDay.length) return;
    const title = escapeHtml(eventRow.title_event);
    const color = eventRow.color_event || "#f2e2e4";
    $targetDay.append(
        `<div class="text-event fs-8" style="background-color:${color};">${title}</div>`,
    );
}

function htmlDashboardEventItem(eventRow) {
    const title = escapeHtml(eventRow.title_event);
    const description = eventRow.description
        ? `<div class="dashboard-calendar-event-description">${escapeHtml(eventRow.description)}</div>`
        : "";
    const timeRange = `${formatTimeDisplay(eventRow.start_time)} - ${formatTimeDisplay(eventRow.end_time)}`;
    const color = eventRow.color_event || "#e9eef4";
    return `<div class="dashboard-calendar-event-item" style="background-color:${color};"><div class="dashboard-calendar-event-time">${timeRange}</div><div class="dashboard-calendar-event-title">${title}</div>${description}</div>`;
}

function htmlDashboardMonthEventItem(eventRow) {
    const title = escapeHtml(eventRow.title_event);
    const description = eventRow.description
        ? `<div class="dashboard-calendar-month-event-item-description">${escapeHtml(eventRow.description)}</div>`
        : "";
    const dateLabel = formatDateLabel(eventRow.date_event);
    const timeRange = `${formatTimeDisplay(eventRow.start_time)} - ${formatTimeDisplay(eventRow.end_time)}`;
    const color = eventRow.color_event || "#e9eef4";
    return `<div class="dashboard-calendar-month-event-item" data-event-date="${eventRow.date_event}" style="background-color:${color};"><div class="d-flex justify-content-between gap-3"><div class="dashboard-calendar-month-event-item-date">${dateLabel}</div><div class="dashboard-calendar-month-event-item-time">${timeRange}</div></div><div class="dashboard-calendar-month-event-item-title">${title}</div>${description}</div>`;
}

function showEventsByMonth() {
    if (!dashboardCalendarMonthModal) {
        return;
    }

    const monthLabel = currentDate.toLocaleString(dashboardCalendarLocale, {
        month: "long",
    });
    const yearLabel = currentDate.getFullYear();
    const monthEvents = [...ARR_DATA_CALENDAR].sort((a, b) => {
        const aDate = `${a.date_event} ${a.start_time || "00:00:00"}`;
        const bDate = `${b.date_event} ${b.start_time || "00:00:00"}`;
        return new Date(aDate).getTime() - new Date(bDate).getTime();
    });

    const listHtml = monthEvents.length
        ? monthEvents.map((item) => htmlDashboardMonthEventItem(item)).join("")
        : '<div class="dashboard-calendar-event-empty">No events this month</div>';

    $("#dashboardCalendarMonthModal .dashboard-calendar-month").text(
        monthLabel,
    );
    $("#dashboardCalendarMonthModal .dashboard-calendar-year").text(yearLabel);
    $("#dashboardSearchMonthEvent").val("");
    $("#dashboardCalendarMonthModal .dashboard-calendar-month-event-list").html(
        listHtml,
    );
    dashboardCalendarMonthModal.show();
}

function showEventsByDate(dateCalendar) {
    if (!dashboardCalendarEventModal) {
        return;
    }

    const dayEvents = ARR_DATA_CALENDAR.filter(
        (item) => item.date_event === dateCalendar,
    );
    const listHtml = dayEvents.length
        ? dayEvents.map((item) => htmlDashboardEventItem(item)).join("")
        : '<div class="dashboard-calendar-event-empty">No events on this date</div>';

    $("#dashboardCalendarDate").val(dateCalendar);
    $("#dashboardCalendarEventModal .dashboard-calendar-date").text(
        formatDateLabel(dateCalendar),
    );
    $("#dashboardCalendarEventModal .dashboard-calendar-event-list").html(
        listHtml,
    );

    dashboardCalendarEventModal.show();
}

async function getAllEventEmployeeCalendarByMonth(year, month) {
    return $.ajax({
        url: `${dashboardAppUrl}/calendar/all-event-employee-calendar-by-month`,
        type: "GET",
        data: {
            YEAR: year,
            MONTH: month,
        },
        beforeSend: function () {
            toggleCalendarLoader(true);
        },
        error: function (res) {
            const resJson = res.responseJSON;
            if (resJson && resJson.message) {
                showAlertMsg(resJson.message, "error", 5000);
            }
            toggleCalendarLoader(false);
        },
        success: function (response) {
            ARR_DATA_CALENDAR = [];
            const resData = response.data || {};
            const employeeCalendar = resData.employeeCalendar || [];

            ARR_DATA_CALENDAR = employeeCalendar;
            for (let i = 0; i < ARR_DATA_CALENDAR.length; i++) {
                appendEventCalendar(ARR_DATA_CALENDAR[i]);
            }

            toggleCalendarLoader(false);
        },
    });
}

async function renderEventCalendar(year, month) {
    try {
        await renderCalendar(year, month);
        await getAllEventEmployeeCalendarByMonth(year, month + 1);
    } catch (error) {
        toggleCalendarLoader(false);
        console.error("Error fetching or processing data:", error);
    }
}

$(".calendar-prev-month").on("click", function () {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderEventCalendar(currentDate.getFullYear(), currentDate.getMonth());
});

$(".calendar-next-month").on("click", function () {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderEventCalendar(currentDate.getFullYear(), currentDate.getMonth());
});

$(document).on("click", ".dropdown-month .month-item", function () {
    const monthNum = Number($(this).attr("data-month"));
    if (!monthNum) return;
    currentDate.setMonth(monthNum - 1);
    renderEventCalendar(currentDate.getFullYear(), currentDate.getMonth());
});

$(document).on("click", ".calendar-day", function () {
    const dateCalendar = $(this).attr("data-calendar-date");
    if (!dateCalendar) return;
    showEventsByDate(dateCalendar);
});

$(document).on("click", ".calendar-event-list", function () {
    showEventsByMonth();
});

let dashboardEventSearchTimer = null;
$("#dashboardSearchMonthEvent").on("input", function () {
    const input = this;
    clearTimeout(dashboardEventSearchTimer);
    dashboardEventSearchTimer = setTimeout(function () {
    const searchQuery = String($(input).val() || "")
        .trim()
        .toLowerCase();
    const $items = $(
        "#dashboardCalendarMonthModal .dashboard-calendar-month-event-item",
    );

    if (!searchQuery) {
        $items.removeClass("d-none");
        return;
    }

    $items.each(function () {
        const title = String(
            $(this).find(".dashboard-calendar-month-event-item-title").text() ||
                "",
        ).toLowerCase();
        const description = String(
            $(this)
                .find(".dashboard-calendar-month-event-item-description")
                .text() || "",
        ).toLowerCase();
        const date = String(
            $(this).find(".dashboard-calendar-month-event-item-date").text() ||
                "",
        ).toLowerCase();
        const isMatch =
            title.includes(searchQuery) ||
            description.includes(searchQuery) ||
            date.includes(searchQuery);
        $(this).toggleClass("d-none", !isMatch);
    });
    }, 500);
});

$(document).on("click", ".dashboard-calendar-month-event-item", function () {
    const eventDate = $(this).attr("data-event-date");
    if (!eventDate) return;
    if (dashboardCalendarMonthModal) {
        dashboardCalendarMonthModal.hide();
    }
    showEventsByDate(eventDate);
});

renderEventCalendar(currentDate.getFullYear(), currentDate.getMonth());
