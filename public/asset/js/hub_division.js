let currentDate = new Date();
let selectedEmployeeId = null;

function getTaskStatusColor(status) {
    const statusLower = (status || '').toLowerCase();

    if (statusLower.includes('request') || statusLower === 'new') {
        return '#f2e2e4';
    } else if (statusLower.includes('progress')) {
        return '#f5efce';
    } else if (statusLower.includes('revision') || statusLower.includes('reject')) {
        return '#eba5a5';
    } else if (statusLower.includes('complete')) {
        return '#b2eecd';
    } else if (statusLower.includes('finish')) {
        return '#A5C6F1';
    } else {
        return '#dde4e8';
    }
}

function getTaskInitials(title) {
    if (!title) return "NA";
    const words = title.trim().split(/\s+/);
    if (words.length === 1) {
        return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function getRandomColorFromText(text) {
    const colors = [
        "#6A5AE0", "#FF8A3C", "#00A881", "#D4526E", "#3E8EDE",
        "#546E7A", "#8E44AD", "#2E7D32", "#AD1457", "#EF6C00"
    ];
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

$(document).on('click', '.division-item', function () {
    const divisionId = $(this).data('division-id');
    const divisionText = $(this).text().trim();

    $('.selected-division-text').text(divisionText);

    if (divisionId === 'all') {
        $('.employee-item').show();
    } else {
        $('.employee-item').each(function () {
            const employeeDivisionId = $(this).data('employee-division');
            if (employeeDivisionId == divisionId) {
                $(this).show();
            } else {
                $(this).hide();
            }
        });
    }
});

$(document).on('click', '.employee-item', function () {
    $('.employee-item').removeClass('selected');
    $(this).addClass('selected');

    selectedEmployeeId = $(this).data('employee-id');

    const employeeName = $(this).find('.employee-name').text();
    const employeePhoto = $(this).data('photo');
    const employeeTask = $(this).data('task');

    $('.selected-employee-photo').attr('src', employeePhoto);
    $('.selected-employee-name').text(employeeName);
    $('.selected-employee-task').text(employeeTask + " total tasks");

    $('.selected-employee-info').show();

    $('.calendar-placeholder').hide();
    $('.table-calendar').show();

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    $('.calendar-month').text(monthNames[currentDate.getMonth()]);
    $('.calendar-year').text(currentDate.getFullYear());

    renderEventCalendar(currentDate.getFullYear(), currentDate.getMonth());
});

async function loadEmployeeTasks(employeeId, year, month) {
    try {
        const response = await $.ajax({
            url: appUrl + "/hub_division/employee-tasks-by-month",
            type: "GET",
            data: {
                'employee_id': employeeId,
                'year': year,
                'month': month
            }
        });

        if (response.success) {
            return {
                tasks: response.data,
                total: response.total_tasks
            };
        }
        return { tasks: [], total: 0 };

    } catch (error) {
        console.error("Error loading employee tasks:", error);
        return { tasks: [], total: 0 };
    }
}

// Render task bar on calendar
function renderTaskBar(task) {
    const startDate = task.start_date;
    if (!startDate) return;

    const dateStr = startDate.split(' ')[0]; // Get date part only
    const $dayCell = $(`.calendar-day[data-calendar-date="${dateStr}"]`);

    if ($dayCell.length > 0) {
        const $boxEvent = $dayCell.find('.box-event');
        const backgroundColor = getTaskStatusColor(task.status);

        const taskHtml = `
            <div class="text-event" 
                 style="background-color: ${backgroundColor};" 
                 data-task-id="${task.id}"
                 title="${task.title}">
                ${task.title}
            </div>
        `;

        $boxEvent.append(taskHtml);
    }
}

async function renderCalendar(year, month) {

    const calendarBody = $('.table-calendar tbody');
    calendarBody.empty();

    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const monthNames = new Date(year, month);

    let day = 1;
    let row = $('<tr>');
    const pad = (n, len = 2) => String(n).padStart(len, '0');

    for (let i = 0; i < firstDay; i++) {
        row.append('<td class="empty-cell"></td>');
    }

    for (let i = 0; i < totalDays; i++) {
        if ((firstDay + i) % 7 === 0 && i !== 0) {
            calendarBody.append(row);
            row = $('<tr>');
        }
        const today = new Date();
        const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

        const dayNumPad = pad(day);
        const monthNumPad = pad(month + 1);

        row.append(`<td class="calendar-day  ${isToday ? 'today' : ''}" data-calendar-date="${year}-${monthNumPad}-${dayNumPad}"><div class="day">${day}</div><div class="box-event"></div></td>`);

        day++;
    }


    calendarBody.append(row);

    return 'done-rendering';
}

$('.calendar-prev-month').click(function () {
    currentDate.setMonth(currentDate.getMonth() - 1);

    // Update month and year display
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    $('.calendar-month').text(monthNames[currentDate.getMonth()]);
    $('.calendar-year').text(currentDate.getFullYear());

    // Reload calendar if employee is selected
    if (selectedEmployeeId) {
        renderEventCalendar(currentDate.getFullYear(), currentDate.getMonth());
    }
});

$('.calendar-next-month').click(function () {
    currentDate.setMonth(currentDate.getMonth() + 1);

    // Update month and year display
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    $('.calendar-month').text(monthNames[currentDate.getMonth()]);
    $('.calendar-year').text(currentDate.getFullYear());

    // Reload calendar if employee is selected
    if (selectedEmployeeId) {
        renderEventCalendar(currentDate.getFullYear(), currentDate.getMonth());
    }
});

// Month dropdown change
$(document).on('click', '.month-item', function () {
    const month = $(this).data('month');
    currentDate.setMonth(month - 1);

    // Update month and year display
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    $('.calendar-month').text(monthNames[currentDate.getMonth()]);
    $('.calendar-year').text(currentDate.getFullYear());

    // Reload calendar if employee is selected
    if (selectedEmployeeId) {
        renderEventCalendar(currentDate.getFullYear(), currentDate.getMonth());
    }
});

async function renderEventCalendar(year, month) {
    try {
        await renderCalendar(year, month);

        if (selectedEmployeeId) {
            const result = await loadEmployeeTasks(selectedEmployeeId, year, month + 1);

            const tasks = result.tasks;
            const total = result.total;

            // Update panel
            $('.selected-employee-task').text(total + " total tasks");

            $('.box-event').empty();
            tasks.forEach(task => renderTaskBar(task));
        }

        return 'done-rendering';
    } catch (error) {
        console.error("Error fetching or processing data:", error);
        return 'error-rendering';
    }
}

async function getAllTasksEmployeeCalendarByMonth(year, month) {

    return getAllEven = await $.ajax({
        url: appUrl + "/calendar/all-tasks-employee-calendar-by-month",
        type: "GET",
        data: {
            'YEAR': year,
            'MONTH': month
        },
        beforeSend: function () {
        },
        error: function (res) {
            return 'error-get-data';
        },
        success: function (response) {

            ARR_DATA_CALENDAR = [];

            var resData = response.data;
            var employeeCalendar = resData.employeeCalendar;

            ARR_DATA_CALENDAR = employeeCalendar;

            for (let i = 0; i < ARR_DATA_CALENDAR.length; i++) {
                const calendar = ARR_DATA_CALENDAR[i];
                appendEventCalendar(calendar);

                $('#calendarAllModal .box-data-event').append(htmlItemEventAll(calendar));
            }

            if (ARR_DATA_CALENDAR.length == 0) {
                $('#calendarAllModal .box-data-event').html(' ');
            }

            return 'done-get-data';
        }

    });

}

function handleTaskDetail(taskId) {
    $.getJSON(appUrl + "/task/" + taskId, function (res) {
        const t = res.data || res;
        const img = t.image ? `${appUrl}/file/task/${t.image}` : null;
        const initials = img ? "" : getTaskInitials(t.title);
        const color = img ? "" : getRandomColorFromText(t.title);

        const avatar = img
            ? `<img src="${img}" class="project-image me-3" style="width:48px;height:48px;object-fit:cover;border-radius:50%;" onerror="this.src='${appUrl}/asset/img/avatar.png'">`
            : `<div class="project-initial-avatar me-3" style="width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:14px;color:#fff;background:${color};">${initials}</div>`;

        const refUrls = (t.reference_urls || []).map(u => `
            <div class="ref-url-item d-flex align-items-center p-2 rounded bg-light mb-1" style="font-size:12px;">
                <a href="${u}" target="_blank" class="text-decoration-none flex-grow-1 text-truncate" style="color:#444;">${u}</a>
                <span class="material-symbols-outlined ms-2 open-url-btn" data-url="${u}">open_in_new</span>
                <span class="material-symbols-outlined ms-2 copy-url-btn" data-url="${u}">content_copy</span>
            </div>
        `).join("");

        const collab = (() => {
            const list = [];
            if (t.pic) list.push({ role: "PIC", emp: t.pic });
            (t.executors || []).forEach(e => list.push({ role: "Executor", emp: e }));
            return list.map(i => `
                <div class="collab-item d-flex align-items-center mb-2">
                    <img src="${(i.emp.profile_picture_url || i.emp.photo || appUrl + '/asset/img/avatar.png')}" class="rounded-circle" style="width:36px;height:36px;object-fit:cover;" 
                        onerror="this.src='${appUrl}/asset/img/avatar.png'">
                    <div class="ms-2">
                        <div>${i.emp.name || "Unknown"}</div>
                        <div class="text-muted" style="font-size:12px;">${i.role}</div>
                    </div>
                </div>
            `).join("");
        })();

        const statusLogs = (t.status_changes || []).map(s => `
            <div style="font-size:12px;margin-top:6px;color:#454545">
                <span style="color:#797E91;">${s.label}</span>
                <span style="margin-left:6px;">${s.employee_name}</span>
            </div>
        `).join("");

        const html = `
            <div class="custom-card rounded-4 p-3 border-0" data-task-id="${t.id}">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div class="d-flex align-items-center">
                        ${avatar}
                        <div>
                            ${t.project?.id ? `<small class="text-muted" style="font-size:11px;">${t.project.title}</small>` : ""}
                            <h5 class="mb-0" style="font-size: 14px;">${t.title || "-"}</h5>
                        </div>
                    </div>
                    <span class="material-symbols-outlined dropdown-icon mt-2 mx-2" tabindex="0">more_vert</span>
                </div>
                <div style="font-size: 13px;">${t.description || ""}</div>
                <hr>
                <div class="d-flex justify-content-between" style="font-size:12px;">
                    <span>Priority: <span style="color:${t.priority === 'HIGH' ? 'red' : '#4B4F5E'}">${t.priority}</span></span>
                    <span>Deadline: ${formatDateENMedium(t.due_date)}</span>
                </div>
                <div class="d-flex justify-content-between" style="font-size:12px;">
                    <span class="text-muted">Department:</span><span>${t.project?.department || "-"}</span>
                </div>
                <div class="d-flex justify-content-between mb-2" style="font-size:12px;">
                    <span class="text-muted">Division:</span><span>${t.project?.division || "-"}</span>
                </div>

                ${refUrls}

                <div class="d-flex justify-content-between align-items-start mt-2 gap-3">
                    <div class="flex-grow-1">
                        ${collab}
                        ${statusLogs}
                    </div>
                    <div class="d-flex align-items-start">
                        <div class="d-flex align-items-center me-3 position-relative">
                            <span class="material-symbols-outlined task-icon" data-task-id="${t.id}">mode_comment</span>
                            ${t.feedback_comments_count ? `<span style="font-size:12px;">${t.feedback_comments_count}</span>` : ""}
                        </div>
                        <div class="d-flex align-items-center">
                            <span class="material-symbols-outlined task-icon">attach_file</span>
                            ${t.reference_files_count ? `<span style="font-size:12px;">${t.reference_files_count}</span>` : ""}
                        </div>
                    </div>
                </div>
            </div>
        `;

        $("#taskDetailContent").html(html);
        new bootstrap.Modal($("#taskDetailModal")).show();
    }).fail(() => {
        showFloatingAlert("Failed to load task", "danger", 3000);
    });
}

$(document).on('click', '.text-event', function () {
    const taskId = $(this).data('task-id');
    handleTaskDetail(taskId);
});

