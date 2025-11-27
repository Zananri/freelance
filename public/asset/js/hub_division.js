// Get appUrl from meta tag
const appUrl = $('meta[name=app-url]').attr("content");

let currentDate = new Date();
let selectedEmployeeId = null;
let currentSearchQuery = ''; 
let allTasksData = []; 

function getTaskStatusColor(status) {
    const statusLower = (status || '').toLowerCase();

    if (statusLower.includes('request') || statusLower === 'new') {
        return '#E8E9F2';
    } else if (statusLower.includes('progress')) {
        return '#EEEEE3';
    } else if (statusLower.includes('revision') || statusLower.includes('reject')) {
        return '#F3E4E6';
    } else if (statusLower.includes('late')) {
        return '#F3E4E6';
    } else if (statusLower.includes('complete')) {
        return '#DFF2E7';
    } else if (statusLower.includes('finish')) {
        return '#DDE7EF';
    } else {
        return '#F3F4F6';
    }
}

function getTaskStatusTextColor(status) {
    const statusLower = (status || '').toLowerCase();

    if (statusLower.includes('request') || statusLower === 'new') {
        return '#7F808A';
    } else if (statusLower.includes('progress')) {
        return '#C29810';
    } else if (statusLower.includes('revision') || statusLower.includes('reject')) {
        return '#E44C4E';
    } else if (statusLower.includes('late')) {
        return '#E44C4E';
    } else if (statusLower.includes('complete')) {
        return '#19CC64';
    } else if (statusLower.includes('finish')) {
        return '#1799DE';
    } else {
        return '#6B7280';
    }
}

function isTaskLate(task) {
    try {
        const statusLower = (task.status || '').toLowerCase();
        
        // Jika sudah completed atau finished, tidak dianggap late
        if (statusLower.includes('completed') || statusLower.includes('finished')) {
            return false;
        }
        
        // Check if task has due_date
        if (!task.due_date) {
            return false;
        }
        
        // Parse due_date
        const dueDate = new Date(task.due_date);
        const now = new Date();
        
        // Task is late if due_date has passed
        return dueDate < now;
    } catch (e) {
        return false;
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

function buildPhotoUrl(userPhoto, profilePicture, profilePictureUrl) {
    try {
        let candidate = profilePictureUrl || profilePicture || userPhoto;
        if (!candidate) return appUrl + '/asset/img/avatar.png';
        if (typeof candidate !== 'string') candidate = String(candidate || '');
        const up = candidate.trim();
        if (up.startsWith('http://') || up.startsWith('https://')) return up;
        if (up.startsWith('/')) return appUrl + up;
        if (up.startsWith('file/') || up.startsWith('asset/')) return appUrl + '/' + up;
        return appUrl + '/file/profile_picture/' + up;
    } catch (_) {
        return appUrl + '/asset/img/avatar.png';
    }
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

    // Filter employees based on division
    if (divisionId === 'all') {
        $('.employee-item').show();
    } else {
        $('.employee-item').each(function () {
            const employeeDivisionId = $(this).data('employee-division-id');
            if (employeeDivisionId == divisionId) {
                $(this).show();
            } else {
                $(this).hide();
            }
        });
    }

    // Update division statistics (total projects and tasks)
    updateDivisionStats(divisionId);
});

async function updateDivisionStats(divisionId) {
    try {
        const response = await $.ajax({
            url: appUrl + "/hub_division/division-stats",
            type: "GET",
            data: {
                division_id: divisionId
            }
        });

        if (response.success) {
            $('.employee-total-task').text('Total Project : ' + response.total_projects);
            $('.employee-total-project').text('Total Task : ' + response.total_tasks);
        }
    } catch (error) {
        console.error("Error updating division stats:", error);
    }
}

async function loadEmployeeTasks(employeeId, year, month, query='') {
    try {
        const response = await $.ajax({
            url: appUrl + "/hub_division/employee-tasks-by-month",
            type: "GET",
            data: {
                employee_id: employeeId,
                year: year,
                month: month,
                query: query
            }
        });

        if (response.success) {
            allTasksData = response.data || [];

            return {
                tasks: response.data,
                total: response.total_tasks,
                total_in_progress: response.total_in_progress,
                total_late: response.total_late,
                total_finished: response.total_finished
            };
        }

        allTasksData = [];
        return { tasks: [], total: 0, total_in_progress: 0, total_late: 0, total_finished: 0 };
    } catch (error) {
        console.error("Error loading employee tasks:", error);
        allTasksData = [];
        return { tasks: [], total: 0, total_in_progress: 0, total_late: 0, total_finished: 0 };
    }
}

// Render task bar on calendar
function renderTaskBar(task) {
    const startDate = task.start_date;
    const dueDate = task.due_date;
    
    if (!startDate) return;
    
    const startDateStr = startDate.split(' ')[0];
    const start = new Date(startDateStr);
    
    let end = start;
    if (dueDate) {
        const dueDateStr = dueDate.split(' ')[0];
        end = new Date(dueDateStr);
    }
    
    if (start > end) {
        end = start;
    }
    
    const taskIsLate = isTaskLate(task);
    
    const backgroundColor = taskIsLate ? '#F4DCDF' : getTaskStatusColor(task.status);
    const textColor = taskIsLate ? '#46505B' : '#46505B';
    
    // Loop through all dates from start to end
    let currentDate = new Date(start);
    while (currentDate <= end) {
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        const $dayCell = $(`.calendar-day[data-calendar-date="${dateStr}"]`);
        
        if ($dayCell.length > 0) {
            const $boxEvent = $dayCell.find('.box-event');
            
            const taskHtml = `
                <div class="text-event" 
                     style="background-color: ${backgroundColor}; color: ${textColor};" 
                     data-task-id="${task.id}"
                     data-task-title="${escapeHtml(task.title)}"
                     title="${task.title}">
                    ${task.title}
                </div>
            `;
            
            $boxEvent.append(taskHtml);
        }
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
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

    // Reload calendar (with or without employee tasks)
    // Search query will be maintained automatically via renderEventCalendar
    if (selectedEmployeeId) {
        renderEventCalendar(currentDate.getFullYear(), currentDate.getMonth());
    } else {
        renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
    }
});

$('.calendar-next-month').click(function () {
    currentDate.setMonth(currentDate.getMonth() + 1);

    // Update month and year display
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    $('.calendar-month').text(monthNames[currentDate.getMonth()]);
    $('.calendar-year').text(currentDate.getFullYear());

    // Reload calendar (with or without employee tasks)
    // Search query will be maintained automatically via renderEventCalendar
    if (selectedEmployeeId) {
        renderEventCalendar(currentDate.getFullYear(), currentDate.getMonth());
    } else {
        renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
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

    // Reload calendar (with or without employee tasks)
    // Search query will be maintained automatically via renderEventCalendar
    if (selectedEmployeeId) {
        renderEventCalendar(currentDate.getFullYear(), currentDate.getMonth());
    } else {
        renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
    }
});

function showCalendarLoading() {
    $('.box-loader').removeClass('d-none');
}

function hideCalendarLoading() {
    $('.box-loader').addClass('d-none');
}

async function renderEventCalendar(year, month) {
    try {
        await renderCalendar(year, month);

        showCalendarLoading();

        if (selectedEmployeeId) {
            const result = await loadEmployeeTasks(
                selectedEmployeeId,
                year,
                month + 1,
                currentSearchQuery
            );

            const tasks = result.tasks;
            const total = result.total;
            const totalInProgress = result.total_in_progress;
            const totalLate = result.total_late;
            const totalFinished = result.total_finished;
            const totalStart = result.total_start;
            const totalComplete = result.total_complete;

            $('.selected-employee-task').text("Total task: " + total);
            $('.selected-employee-progress').text("In Progress: " + totalInProgress);
            $('.selected-employee-late').text("Late: " + totalLate);
            $('.selected-employee-finish').text("Finish: " + totalFinished);
            $('.mobile-selected-employee-task').text("Total task: " + total);
            $('.mobile-selected-employee-start').text(totalStart);
            $('.mobile-selected-employee-progress').text(totalInProgress);
            $('.mobile-selected-employee-complete').text(totalComplete);
            $('.mobile-selected-employee-late').text(totalLate);
            $('.mobile-selected-employee-finish').text(totalFinished);

            $('.box-event').empty();

            tasks.forEach(t => renderTaskBar(t));
        }

        return 'done-rendering';
    } catch (error) {
        console.error(error);
        return 'error-rendering';
    } finally {
        hideCalendarLoading();
    }
}

$(document).on("click", ".calendar-day", function () {
    const clickedDate = $(this).data("calendar-date");
    if (!clickedDate || !selectedEmployeeId) return;

    $(".calendar-day").removeClass("selected-date");
    $(this).addClass("selected-date");

    const dateObj = new Date(clickedDate);
    const formattedDate = dateObj.toISOString().split("T")[0];

    const emp = $(`.employee-item[data-employee-id="${selectedEmployeeId}"]`);
    const employeeName = emp.find('.employee-name').text();
    const employeeDivision = emp.attr('data-employee-division');
    const employeePhoto = emp.data('employee-photo');

    loadTasksForDate(formattedDate, selectedEmployeeId, employeeName, employeeDivision, employeePhoto);
});

async function loadTasksForDate(date, employeeId, employeeName, employeeDivision, employeePhoto) {
    try {
        const response = await $.ajax({
            url: appUrl + "/hub_division/employee-tasks-by-date",
            type: "GET",
            data: {
                employee_id: employeeId,
                date: date
            },
            dataType: "json"
        });

        if (!response.success) {
            showFloatingAlert(response.message || "Failed to load tasks", "danger", 3000);
            return;
        }

        const tasks = response.data || [];
        
        const totalTasks = tasks.length;

        const formattedDate = formatDateENFull(new Date(date));

        $(".selected-task-date").text(formattedDate);
        $(".selected-total-task").text("Total task " + totalTasks);

        $("#taskModalDate .selected-employee-name").text(employeeName);
        $("#taskModalDate .selected-employee-task").text(employeeDivision || "Division");

        if (employeePhoto) {
            $("#taskModalDate .selected-employee-photo")
                .attr("src", employeePhoto)
                .removeClass("d-none");
        } else {
            $("#taskModalDate .selected-employee-photo").addClass("d-none");
        }

        renderTaskListByDate(tasks);

        $("#taskModalDate").modal("show");

    } catch (err) {
        console.error("Error loadTasksForDate:", err);
        showFloatingAlert("Failed to load tasks", "danger", 3000);
    }
}

function renderTaskListByDate(tasks) {
    const container = $("#taskListByDate");
    container.empty();

    if (!tasks || tasks.length === 0) {
        container.html(`
            <div class="text-center py-4 text-muted">
                <span class="material-symbols-outlined" style="font-size: 48px; opacity: 0.3;">event_busy</span>
                <p class="mt-2">No tasks for this date</p>
            </div>
        `);
        return;
    }

    tasks.forEach(task => {
        const statusColor = getTaskStatusColor(task.status);
        const statusLower = (task.status || '').toLowerCase();
        const taskIsLate = isTaskLate(task);

        // Parse priority color
        let priorityColor = '#4B4F5E';
        let priorityBg = '#F3F4F6';
        if (task.priority === 'HIGH') {
            priorityColor = '#DC2626';
            priorityBg = '#FEE2E2';
        } else if (task.priority === 'NORMAL') {
            priorityColor = '#F59E0B';
            priorityBg = '#FEF3C7';
        }

        const taskHtml = `
            <div class="task-item-date mb-3 p-3" data-task-id="${task.id}">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <h6 class="task-list-title mb-2">
                            ${task.title || '-'}
                        </h6>

                        <p class="task-list-desc text-muted">
                            ${task.description ? (task.description.length > 100 ? task.description.substring(0, 100) + '...' : task.description) : ''}
                        </p>
                    </div>

                    <div class="d-flex g-1 mt-1">
                        ${taskIsLate ? 
                            '<span class="status-late-list">Late</span>' : 
                            `<span class="status-task-list" style="color: ${getTaskStatusTextColor(task.status)};">${task.status || 'New'}</span>`
                        }
                    </div>
                </div>
                
                <div class="d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center gap-2">
                        <span style="color: #797E91; text-align: start; font-size: 8px; font-weight: 600;">
                            Priority:&nbsp;
                        </span>
                        <span style="color: ${priorityColor}; font-size: 8px; font-weight: 400;">
                            ${task.priority || 'NORMAL'}
                        </span>
                    </div>

                    <div class="d-flex align-items-center">
                        <span style="font-size: 8px; color: #4B4F5E;">
                            ${task.start_date ? formatDateENMedium(task.start_date) : '-'} - ${task.due_date ? formatDateENMedium(task.due_date) : '-'}
                        </span>
                    </div>
                </div>
            </div>
        `;

        container.append(taskHtml);
    });
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
        const statusColor = getTaskStatusColor(t.status);
        const statusLower = (String(t.status || '').toLowerCase());
        const statusText = t.status ? (String(t.status).charAt(0).toUpperCase() + String(t.status).slice(1)) : '';
        const taskIsLate = isTaskLate(t);

        const avatar = img
            ? `<img src="${img}" class="project-image me-3">`
            : `<div class="project-initial-avatar me-3" style="background:${color};">${initials}</div>`;

        let refFilesHtml = '';
        const rawRefFiles = t.reference_files || t.reference_file || [];
        let referenceFiles = [];
        if (typeof rawRefFiles === 'string' && rawRefFiles.trim()) {
            try {
                const parsed = JSON.parse(rawRefFiles);
                if (Array.isArray(parsed)) referenceFiles = parsed;
                else referenceFiles = [rawRefFiles];
            } catch (_) {
                referenceFiles = [rawRefFiles];
            }
        } else if (Array.isArray(rawRefFiles)) {
            referenceFiles = rawRefFiles;
        }

        referenceFiles = (referenceFiles || []).map(f => {
            if (!f) return null;
            try {
                const val = String(f);
                const isAbs = val.startsWith('http://') || val.startsWith('https://');
                const isRefPath = val.startsWith('/file/task_reference_files/') || val.startsWith('file/task_reference_files/') ||
                    val.startsWith('/file/task/') || val.startsWith('file/task/') || val.startsWith('/storage/') || val.startsWith('storage/');
                if (isAbs) return val;
                if (isRefPath) return val.startsWith('/') ? (appUrl + val) : (appUrl + '/' + val);
                return appUrl + '/file/task_reference_files/' + val;
            } catch (_) {
                return null;
            }
        }).filter(Boolean);

        if (Array.isArray(referenceFiles) && referenceFiles.length) {
            refFilesHtml = `<div class="mb-2"><div class="row g-2">` + referenceFiles.map((u, idx) => {
                const rawName = (u || '').split('/').pop() || `file_${idx + 1}`;
                const fileName = decodeURIComponent(rawName).toLocaleLowerCase();
                return `
                    <div class="col-6">
                        <div class="ref-file-item d-flex align-items-center p-2 rounded bg-light mb-1" style="position:relative;">

                            <a href="${u}" target="_blank"
                                class="text-decoration-none flex-grow-1 text-truncate"
                                title="${fileName}">
                                ${fileName}
                            </a>

                            <a href="${u}" download="${fileName}" class="ms-2 text-decoration-none download-icon" title="Download ${fileName}">
                                <span class="material-symbols-outlined action-icon">download</span>
                            </a>
                        </div>
                    </div>
                `;
            }).join('') + `</div></div>`;
        }

        let refUrlsHtml = '';
        const referenceUrls = t.reference_urls || (t.reference_url ? [t.reference_url] : []);

        if (Array.isArray(referenceUrls) && referenceUrls.length) {
            refUrlsHtml = '<div class="mb-2">';

            referenceUrls.forEach((u, idx) => {
                const displayUrl = u || '';

                refUrlsHtml += `
                            <div class="ref-url-item d-flex align-items-center p-2 rounded bg-light mb-1" style="position:relative;">
                                
                                <a href="${u}" target="_blank"
                                    class="text-decoration-none flex-grow-1 text-truncate"
                                    style="color: #444; font-size: 10px;" title="${displayUrl}">
                                    ${displayUrl}
                                </a>

                                <span class="material-symbols-outlined ms-2 open-url-btn action-icon"
                                    data-url="${u}">
                                    open_in_new
                                </span>

                                <span class="material-symbols-outlined ms-2 copy-url-btn action-icon"
                                    data-url="${u}">
                                    content_copy
                                </span>

                            </div>
                        `;
            });

            refUrlsHtml += '</div>';
        }

        // Complete Ref Files
        let completeRefFilesHtml = '';
        const rawCompelteRefFiles = t.complete_files || t.complete_files || [];
        let completeReferenceFiles = [];
        if (typeof rawCompelteRefFiles === 'string' && rawCompelteRefFiles.trim()) {
            try {
                const parsed = JSON.parse(rawCompelteRefFiles);
                if (Array.isArray(parsed)) completeReferenceFiles = parsed;
                else completeReferenceFiles = [rawCompelteRefFiles];
            } catch (_) {
                completeReferenceFiles = [rawCompelteRefFiles];
            }
        } else if (Array.isArray(rawCompelteRefFiles)) {
            completeReferenceFiles = rawCompelteRefFiles;
        }

        completeReferenceFiles = (completeReferenceFiles || []).map(f => {
            if (!f) return null;
            try {
                const val = String(f);
                const isAbs = val.startsWith('http://') || val.startsWith('https://');
                const isRefPath = val.startsWith('/file/task_complete_files/') || val.startsWith('file/task_complete_files/') ||
                    val.startsWith('/file/task/') || val.startsWith('file/task/') || val.startsWith('/storage/') || val.startsWith('storage/');
                if (isAbs) return val;
                if (isRefPath) return val.startsWith('/') ? (appUrl + val) : (appUrl + '/' + val);
                return appUrl + '/file/task_complete_files/' + val;
            } catch (_) {
                return null;
            }
        }).filter(Boolean);

        if (Array.isArray(completeReferenceFiles) && completeReferenceFiles.length) {
            completeRefFilesHtml = `<div class="mb-2"><div class="row g-2">` + completeReferenceFiles.map((u, idx) => {
                const rawCompleteFileName = (u || '').split('/').pop() || `file_${idx + 1}`;
                const completeFileName = decodeURIComponent(rawCompleteFileName).toLocaleLowerCase();
                return `
                    <div class="col-6">
                        <div class="ref-file-item d-flex align-items-center p-2 rounded bg-light mb-1" style="position:relative;">

                            <a href="${u}" target="_blank"
                                class="text-decoration-none flex-grow-1 text-truncate"
                                title="${completeFileName}">
                                ${completeFileName}
                            </a>

                            <a href="${u}" download="${completeFileName}" class="ms-2 text-decoration-none" title="Download ${completeFileName}">
                                <span class="material-symbols-outlined action-icon">download</span>
                            </a>
                        </div>
                    </div>
                `;
            }).join('') + `</div></div>`;
        }

        // Complete Ref Urls
        let refCompleteUrlsHtml = '';
        const completeReferenceUrls = t.complete_urls || (t.complete_urls ? [t.complete_urls] : []);

        if (Array.isArray(completeReferenceUrls) && completeReferenceUrls.length) {
            refCompleteUrlsHtml = '<div class="mb-2">';

            completeReferenceUrls.forEach((u, idx) => {
                const displayCompleteUrl = u || '';

                refCompleteUrlsHtml += `
                            <div class="ref-url-item d-flex align-items-center p-2 rounded bg-light mb-1 position-relative">
                                
                                <a href="${u}" target="_blank"
                                    class="text-decoration-none flex-grow-1 text-truncate"
                                    title="${displayCompleteUrl}">
                                    ${displayCompleteUrl}
                                </a>

                                <span class="material-symbols-outlined ms-2 open-url-btn action-icon"
                                    data-url="${u}">
                                    open_in_new
                                </span>

                                <span class="material-symbols-outlined ms-2 copy-url-btn action-icon"
                                    data-url="${u}">
                                    content_copy
                                </span>

                            </div>
                        `;
            });

            refCompleteUrlsHtml += '</div>';
        }

        function stripHtml(raw) {
            try {
                const d = document.createElement('div');
                d.innerHTML = raw || '';
                return (d.textContent || d.innerText || '').trim();
            } catch (_) {
                return String(raw || '').replace(/<[^>]+>/g, '').trim();
            }
        }

        const completeNotePlain = stripHtml(t.complete_note || t.complete_note_html || '');

        document.addEventListener("click", function (e) {
            if (e.target.classList.contains("open-url-btn")) {
                const url = e.target.getAttribute("data-url");
                if (url) window.open(url, "_blank");
            }

            if (e.target.classList.contains("copy-url-btn")) {
                const url = e.target.getAttribute("data-url");
                if (url) {
                    navigator.clipboard.writeText(url)
                        .then(() => showFloatingAlert("URL copied!", "success", 2000))
                        .catch(() => showFloatingAlert("Failed to copy.", "danger", 2000));
                }
            }
        });

        const collab = (() => {
            const list = [];
            if (t.pic) list.push({ role: "PIC", emp: t.pic });
            (t.executors || []).forEach(e => list.push({ role: "Executor", emp: e }));
            if (!list.length) return "";

            return `<div class="row g-2 mt-3 mb-4">` + list.map(i => `
                <div class="col-6">
                    <div class="collab-item d-flex align-items-center">
                        <img src="${(i.emp.image || i.emp.profile_picture || i.emp.user_photo || i.emp.photo || appUrl + '/asset/img/avatar.png')}" class="rounded-circle" style="width:24px;height:24px;object-fit:cover;" 
                            onerror="this.src='${appUrl}/asset/img/avatar.png'">
                        <div class="ms-2">
                            <div class="employee-name-timeline">${i.emp.name || "Unknown"}</div>
                            <div class="text-muted fs-8">${i.role}</div>
                        </div>
                    </div>
                </div>
            `).join('') + `</div>`;
        })();

        const statusChanges = Array.isArray(t.status_changes) ? t.status_changes : [];
        let statusLogs = '';
        if (statusChanges.length) {
            statusLogs = `
                <div class="status-timeline mt-3 mb-3">
                    ${statusChanges.map((s) => {
                        const dateLabel = formatDateENMedium(s.updated_at || s.changed_at || '');
                        const label = escapeHtml(s.label || '');
                        const emp = escapeHtml(s.employee_name || '');

                        return `
                            <div class="timeline-row">
                                <div class="timeline-date">${dateLabel}</div>

                                <div class="timeline-line">
                                    <div class="timeline-dot"></div>
                                </div>

                                <div class="timeline-content">
                                    <div class="status-content">
                                        <span class="status-label">${label}</span>
                                        <span class="status-emp">${emp}</span>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }

        let completeAuthor = '';
        let completeDate = '';
        const compEntry = statusChanges.find(s => {
            const l = String(s.label || s.status || '').toLowerCase();
            return l.includes('complete') || l.includes('completed') || l.includes('finish') || l.includes('finished');
        });
        if (compEntry) {
            completeAuthor = escapeHtml(compEntry.employee_name || compEntry.employee_fullname || compEntry.employee || '');
            completeDate = formatDateENMedium(compEntry.updated_at || compEntry.changed_at || compEntry.created_at || '');
        } else {
            completeAuthor = escapeHtml(t.completed_by_name || t.completed_by || t.completed_by_employee || '');
            completeDate = t.completed_date ? formatDateENMedium(t.complete_date) : '';
        }

        const completeContentHtml = `
            <div class="complete-content p-3 rounded-3 mt-3">
                <h5 class="complete-title-content">Complete result task</h5>
                <div class="complete-note">${escapeHtml(completeNotePlain || '')}</div>
                ${completeAuthor || completeDate ? `<div class="complete-logs">Complete by ${completeAuthor || '-'} ${completeDate ? ' at ' + completeDate : ''}</div>` : ''}

                <div>
                    <h6 class="complete-reference"Link & File reference</h6>
                    ${completeRefFilesHtml || ''}
                    ${refCompleteUrlsHtml || ''}
                </div>
            </div>
        `;

        const html = `
            <div class="rounded-4 border-0" data-task-id="${t.id}">
                    <div class="d-flex justify-content-between align-items-start px-4 py-3">
                        <div class="d-flex align-items-center task-card-header">
                            ${avatar}
                            <div>
                                ${t.project?.id ? `<small class="project-title text-muted">${t.project.title}</small>` : ""}
                                <h5 class="task-title-detail mb-0">${t.title || "-"}</h5>
                            </div>
                        </div>
                        <div class="gap-2 mt-2 mx-2 d-flex align-items-center" tabindex="0">
                            ${taskIsLate ? 
                                '<span class="status-text-late">Late</span>' : 
                                `<span class="status-text" style="color:${getTaskStatusTextColor(t.status)}; background-color:${statusColor};">${escapeHtml(statusText)}</span>`
                            }
                        </div>
                    </div>
                    <div class="px-4 task-detail-description">${t.description || ""}</div>
                    <div class="d-flex justify-content-between px-4 py-2">
                        <div class="priority-section d-flex align-items-center gap-2">
                            <span class="priority-label">Priority:&nbsp;</span>
                            <span class="priority-value" style="color:${t.priority === 'HIGH' ? 'red' : '#4B4F5E'};">${t.priority}</span>
                        </div>

                        <div class="d-flex justify-content-center align-items-center flex-grow-1">
                            <span class="date-detail">${t.start_date ? formatDateENMedium(t.start_date) : '-'} - ${t.due_date ? formatDateENMedium(t.due_date) : '-'}</span>
                        </div>

                        <div class="status-section d-flex justify-content-end align-items-start gap-3">
                            ${(statusLower.includes('finish') || statusLower.includes('complete')) ? `
                                <div class="d-flex align-items-center">
                                    <button class="btn btn-sm p-0 m-0 border-0" type="button" data-bs-toggle="collapse" data-bs-target="#completeContent" aria-expanded="false" aria-controls="completeContent">
                                        <span class="material-symbols-outlined task-icon">playlist_add_check</span>
                                    </button>
                                </div>
                            ` : ''}

                            <div class="d-flex align-items-center position-relative">
                                <span class="material-symbols-outlined task-icon" data-task-id="${t.id}">mode_comment</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="px-4">
                        <div class="barrier-detail"></div>
                    </div>

                <div class="scrollable-content scrollbar-transparent px-4 py-3">
                    ${(statusLower.includes('finish') || statusLower.includes('complete')) ? `
                        <div class="collapse" id="completeContent">
                            ${completeContentHtml}
                        </div>
                    ` : ''}

                    ${collab}

                    <div class="mb-5">
                        <h5 class="ref-title">Link & File Reference</h5>
                        ${refFilesHtml}
                        ${refUrlsHtml}
                    </div>

                    <div class="barrier-detail"></div>

                    <div class="d-flex justify-content-between align-items-start mt-3 gap-3">
                        <div class="department-section d-flex justify-content-start">
                            <span class="text-muted">Department: &nbsp;</span>
                            <span>${t.project?.department?.name_department || t.project?.department_name || t.project?.department || "-"}</span>
                        </div>
                        <div class="division-section d-flex justify-content-end mb-2">
                            <span class="text-muted">Division: &nbsp;</span>
                            <span>${t.project?.division?.name_division || t.project?.division_name || t.project?.division || "-"}</span>
                        </div>
                    </div>
                    ${statusLogs}
                </div>
            </div>
        `;

        $("#taskDetailContent").html(html);
        new bootstrap.Modal($("#taskDetailModal")).show();
    }).fail(() => {
        showFloatingAlert("Failed to load task", "danger", 3000);
    });
}

let openedFromTaskItemDate = false;

$(document).on('click', '.text-event, .task-item-date', function (e) {
    e.stopPropagation();
    e.preventDefault();

    const taskId = $(this).data('task-id');
    if (!taskId) return;

    openedFromTaskItemDate = $(this).hasClass('task-item-date');

    try { $('#taskModalDate').modal('hide'); } catch (_) { }
    handleTaskDetail(taskId);
});

$('#taskDetailModal').on('hidden.bs.modal', function () {
    if (openedFromTaskItemDate) {
        openedFromTaskItemDate = false;
        $('#taskModalDate').modal('show');
    }
});

$(document).ready(function () {
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    $('.calendar-month').text(monthNames[currentDate.getMonth()]);
    $('.calendar-year').text(currentDate.getFullYear());
    renderCalendar(currentDate.getFullYear(), currentDate.getMonth());

    $('.selected-employee-photo').css('background-image', '');
    $('.selected-employee-name').text('Please select employee');
    $('.selected-employee-task').text('Total task: 0');
    $('.selected-employee-progress').text('In Progress: 0');
    $('.selected-employee-late').text('Late: 0');
    $('.selected-employee-finish').text('Finish: 0');
    $('.mobile-selected-employee-task').text('Total task: 0');
    $('.mobile-selected-employee-start').text('0');
    $('.mobile-selected-employee-progress').text('0');
    $('.mobile-selected-employee-late').text('0');
    $('.mobile-selected-employee-complete').text('0');
    $('.mobile-selected-employee-finish').text('0');
    $('.selected-employee-info').removeClass('d-none');
    $('.total-status-task').removeClass('d-none');

    $(document).on('click', '.employee-item', function () {
        const $emp = $(this);

        $('.employee-item').removeClass('selected');
        $emp.addClass('selected');

        selectedEmployeeId = $emp.data('employee-id');

        const name = $emp.find('.employee-name').text().trim();
        const photo = $emp.data('employee-photo') || '';
        const task = Number($emp.data('total-task')) || 0;
        const start = Number($emp.data('total-start')) || 0;
        const progress = Number($emp.data('total-progress')) || 0;
        const late = Number($emp.data('total-late')) || 0;
        const complete = Number($emp.data('total-complete')) || 0;
        const finish = Number($emp.data('total-finish')) || 0;

        if (photo) {
            $('.selected-employee-photo').css('background-image', `url('${photo}')`);
        } else {
            $('.selected-employee-photo').css('background-image', '');
        }

        $('.selected-employee-name').text(name);
        $('.selected-employee-task').text(`Total task: ${task}`);
        $('.selected-employee-progress').text(`In Progress: ${progress}`);
        $('.selected-employee-late').text(`Late: ${late}`);
        $('.selected-employee-finish').text(`Finish: ${finish}`);
        $('.mobile-selected-employee-task').text(`Total task: ${task}`);
        $('.mobile-selected-employee-start').text(`${start}`);
        $('.mobile-selected-employee-progress').text(`${progress}`);
        $('.mobile-selected-employee-late').text(`${late}`);
        $('.mobile-selected-employee-finish').text(`${finish}`);
        $('.mobile-selected-employee-complete').text(`${complete}`);

        currentSearchQuery = '';
        $('#search_task').val('');

        renderEventCalendar(currentDate.getFullYear(), currentDate.getMonth());
    });

    let typingTimer;
    const STOP_DELAY = 800;

    $('#search_task').on('input', function () {
        const value = $(this).val().trim();

        clearTimeout(typingTimer);

        typingTimer = setTimeout(() => {
            currentSearchQuery = value;

            if (selectedEmployeeId) {
                loadEmployeeTasks(
                    selectedEmployeeId,
                    currentDate.getFullYear(),
                    currentDate.getMonth() + 1,
                    currentSearchQuery
                ).then(() => {
                    renderEventCalendar(currentDate.getFullYear(), currentDate.getMonth());
                });
            }
        }, STOP_DELAY);
    });

});

// Constants
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_TOTAL_BYTES = 100 * 1024 * 1024;
let selectedFiles = [];
let __quillInlineFeedback = null;

// Time ago helper function
function timeAgo(createdAt) {
    try {
        const time = new Date(createdAt);
        const now = new Date();
        const diff = (now.getTime() - time.getTime()) / 1000;

        if (diff < 60) {
            return 'just now';
        } else if (diff < 3600) {
            const minutes = Math.round(diff / 60);
            return minutes + (minutes === 1 ? ' minute ago' : ' minutes ago');
        } else if (diff < 86400) {
            const hours = Math.round(diff / 3600);
            return hours + (hours === 1 ? ' hour ago' : ' hours ago');
        } else if (diff < 604800) {
            const days = Math.round(diff / 86400);
            return days + (days === 1 ? ' day ago' : ' days ago');
        } else if (diff < 2592000) {
            const weeks = Math.round(diff / 604800);
            return weeks + (weeks === 1 ? ' week ago' : ' weeks ago');
        } else if (diff < 31536000) {
            const months = Math.round(diff / 2592000);
            return months + (months === 1 ? ' month ago' : ' months ago');
        } else {
            const years = Math.round(diff / 31536000);
            return years + (years === 1 ? ' year ago' : ' years ago');
        }
    } catch (e) {
        return String(createdAt || '');
    }
}

// Get file type icon based on extension
function getFileTypeIcon(fileName) {
    try {
        var ext = (fileName || '').toLowerCase().split('.').pop();
        switch (ext) {
            case 'pdf':
                return 'picture_as_pdf';
            case 'doc':
            case 'docx':
                return 'article';
            case 'xls':
            case 'xlsx':
                return 'grid_on';
            case 'zip':
            case 'rar':
            case '7z':
                return 'folder_zip';
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
            case 'webp':
                return 'image';
            case 'mp4':
            case 'avi':
            case 'mov':
                return 'movie';
            case 'mp3':
            case 'wav':
            case 'ogg':
                return 'audio_file';
            case 'txt':
                return 'text_snippet';
            case 'ppt':
            case 'pptx':
                return 'slideshow';
            default:
                return 'description';
        }
    } catch (_) {
        return 'description';
    }
}

// Utility to escape HTML
function escapeHtml(str) {
    return String(str || '').replace(/[&<>"]+/g, function (m) {
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]) || m;
    });
}

// Show delete confirmation modal
function showDeleteConfirmModal(opts) {
    try {
        const id = opts.id;
        const type = opts.type || 'feedback';
        const avatarUrl = opts.avatarUrl || '';
        const authorName = opts.authorName || '';
        const content = opts.content || '';
        const modalId = 'deleteConfirmModal_' + (type || 'f') + '_' + id + '_' + Date.now();

        const avatarHtml = avatarUrl ?
            `<img src="${avatarUrl}" class="project-image rounded-circle"` :
            `<div class="project-initial-avatar rounded-circle d-flex align-items-center justify-content-center" style="background:#6A5AE0;">${(authorName || '').split(' ').map(s => s[0] || '').slice(0, 2).join('').toUpperCase() || 'NA'}</div>`;

        let title = '';
        let confirmText = '';
        if (type === 'reply') {
            title = 'Delete reply';
            confirmText = 'Are you sure you want to delete this reply?';
        } else {
            title = 'Delete feedback';
            confirmText = 'Are you sure you want to delete this feedback?';
        }

        const modalHtml = `
            <div class="modal fade" id="${modalId}" tabindex="-1" aria-modal="true" role="dialog">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content modal-content-custom">
                        <div class="modal-body modal-body-custom">
                            <div class="text-center mb-2">
                                <div class="task-description-container">
                                    <p class="task-description mb-0" id="${modalId}_desc">${escapeHtml(content)}</p>
                                </div>
                            </div>
                            <hr class="my-2">
                            <p class="fw-normal fs-6 text-center mb-4" id="${modalId}_confirm">${confirmText}</p>

                            <div class="modal-footer modal-footer-custom">
                                <button type="button" class="btn btn-custom-close" data-bs-dismiss="modal" id="${modalId}_cancel">Cancel</button>
                                <button type="button" class="btn btn-submit-black" id="${modalId}_confirmBtn">Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;

        const parentModalEl = document.getElementById('taskFeedbackModal');
        let _parentWasOpen = false;
        let _parentModalInstance = null;

        try {
            if (parentModalEl && parentModalEl.classList.contains('show')) {
                _parentWasOpen = true;
                _parentModalInstance = bootstrap.Modal.getInstance(parentModalEl) || new bootstrap.Modal(parentModalEl);
                _parentModalInstance.hide();
            }
        } catch (_) { }

        // Insert modal
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modalEl = document.getElementById(modalId);
        const modalInstance = new bootstrap.Modal(modalEl, { backdrop: 'static' });
        modalInstance.show();

        // Close & cleanup helper
        function cleanup() {
            try { modalInstance.hide(); } catch (_) { }
            try { modalEl.remove(); } catch (_) { }
            try {
                if (_parentWasOpen && _parentModalInstance) {
                    setTimeout(function () {
                        try { _parentModalInstance.show(); } catch (_) { }
                    }, 180);
                }
            } catch (_) { }
        }

        // Wire cancel to cleanup
        const cancelBtn = document.getElementById(`${modalId}_cancel`);
        if (cancelBtn) cancelBtn.addEventListener('click', cleanup);

        // Confirm button
        const confirmBtn = document.getElementById(`${modalId}_confirmBtn`);
        if (confirmBtn) {
            confirmBtn.addEventListener('click', function () {
                try {
                    confirmBtn.disabled = true;
                    confirmBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Deleting...';
                } catch (_) { }

                if (typeof opts.onConfirm === 'function') {
                    try {
                        opts.onConfirm(function doneFn(shouldClose) {
                            if (shouldClose === false) {
                                confirmBtn.disabled = false;
                                confirmBtn.innerHTML = 'Delete';
                                return;
                            }
                            cleanup();
                        });
                    } catch (e) {
                        confirmBtn.disabled = false;
                        confirmBtn.innerHTML = 'Delete';
                    }
                } else {
                    cleanup();
                }
            });
        }
    } catch (e) {
        console.warn('showDeleteConfirmModal error', e);
    }
}

// Initialize Quill editor for inline feedback
function initInlineFeedbackQuill() {
    try {
        if (__quillInlineFeedback) return __quillInlineFeedback;

        const editorEl = document.getElementById('inline_task_feedback_editor');
        if (!editorEl) return null;

        __quillInlineFeedback = new Quill('#inline_task_feedback_editor', {
            modules: {
                toolbar: false,
                clipboard: { matchVisual: false }
            },
            theme: 'snow',
            placeholder: 'Write feedback...'
        });

        // Prevent image paste/drop
        try {
            const Delta = Quill.import && Quill.import('delta');
            if (__quillInlineFeedback && __quillInlineFeedback.clipboard) {
                __quillInlineFeedback.clipboard.addMatcher('IMG', function (node, delta) {
                    return new Delta();
                });
            }
        } catch (_) { }

        // Remove images on text change
        __quillInlineFeedback.on('text-change', function () {
            try {
                const imgs = __quillInlineFeedback.root.querySelectorAll('img');
                imgs.forEach(i => i.remove());
            } catch (_) { }
        });

        return __quillInlineFeedback;
    } catch (e) {
        console.error('Failed to initialize Quill:', e);
        return null;
    }
}

// Show inline task feedback image preview (small 32x32)
function showTaskInlineImagePreviewSmall(fileObj, dataUrl) {
    try {
        // Create or get the preview container
        let previewContainer = document.getElementById("inline_task_feedback_image_preview");
        if (!previewContainer) {
            previewContainer = document.createElement("div");
            previewContainer.id = "inline_task_feedback_image_preview";
            previewContainer.style.cssText = "display: inline-flex; align-items: center; margin-left: 8px; opacity: 1; background: transparent;";

            // Insert after the file button
            const fileBtn = document.getElementById("inlineTaskFeedbackFileBtn");
            if (fileBtn && fileBtn.parentNode) {
                fileBtn.parentNode.insertBefore(previewContainer, fileBtn.nextSibling);
            }
        }

        // Create the image preview
        previewContainer.innerHTML = "";

        const imageLabel = document.createElement("div");
        imageLabel.className = "image-label";
        imageLabel.style.backgroundImage = `url('${dataUrl}')`;

        const clearBtn = document.createElement("span");
        clearBtn.className = "image-clear-btn";
        clearBtn.innerHTML = "&times;";
        clearBtn.title = "Remove image";


        // Store the file object for later use
        window.__taskInlineFeedbackImageFile = fileObj;

        clearBtn.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            try {
                const inp = document.getElementById("inline_task_feedback_image_input");
                if (inp) inp.value = "";
                window.__taskInlineFeedbackImageFile = null;
                if (previewContainer && previewContainer.parentNode) {
                    previewContainer.parentNode.removeChild(previewContainer);
                }
            } catch (_) { }
        });

        imageLabel.appendChild(clearBtn);
        previewContainer.appendChild(imageLabel);
    } catch (e) {
        console.warn("Failed to show inline task image preview:", e);
    }
}

// Render inline task feedback files preview
function renderInlineTaskFeedbackFilesPreview() {
    try {
        let preview = document.getElementById("inline_task_feedback_files_preview");
        if (!preview) {
            // Create preview container if it doesn't exist
            const form = document.querySelector(".feedback-form");
            if (form) {
                preview = document.createElement("div");
                preview.id = "inline_task_feedback_files_preview";
                preview.className = "mt-2";
                form.insertBefore(preview, form.firstChild);
            }
        }
        if (!preview) return;

        preview.innerHTML = "";

        if (!selectedFiles || !selectedFiles.length) return;

        const listWrap = document.createElement("div");
        listWrap.className = "selected-files-list mt-2";

        selectedFiles.forEach(function (f, idx) {
            try {
                const item = document.createElement("div");
                item.className = "d-flex align-items-center gap-2 p-2 rounded bg-light selected-task mb-2";

                const iconWrap = document.createElement("div");
                const iconName = getFileTypeIcon(f.name || '');
                iconWrap.innerHTML = '<span class="material-symbols-outlined">' + iconName + '</span>';
                iconWrap.style.fontSize = "10px";
                iconWrap.style.textAlign = "center";

                const name = document.createElement("span");
                name.className = "flex-grow-1";
                name.style.fontSize = "10px";
                const sizeMb = (f.size || 0) / 1024 / 1024;
                name.textContent = (f.name || "") + (isFinite(sizeMb) ? " (" + sizeMb.toFixed(2) + " MB)" : "");

                const rm = document.createElement("button");
                rm.type = "button";
                rm.className = "btn btn-sm btn-remove-task remove-task";
                rm.style.lineHeight = "1";
                rm.style.fontSize = "10px";
                rm.innerHTML = '<span class="material-symbols-outlined">close</span>';
                rm.addEventListener("click", function () {
                    try {
                        selectedFiles.splice(idx, 1);
                        renderInlineTaskFeedbackFilesPreview();
                    } catch (_) { }
                });

                item.appendChild(iconWrap);
                item.appendChild(name);
                item.appendChild(rm);
                listWrap.appendChild(item);
            } catch (_) { }
        });

        preview.appendChild(listWrap);
    } catch (e) {
        console.warn("Failed to render file preview:", e);
    }
}

// Handle task feedback modal open
function handleTaskFeedback(taskId) {
    const feedbackModalEl = document.getElementById("taskFeedbackModal");
    if (!feedbackModalEl) {
        console.warn('taskFeedbackModal element not found');
        return;
    }

    // Hide detail modal if open
    const detailEl = document.getElementById("taskDetailModal");
    if (detailEl) {
        const detailModal = bootstrap.Modal.getInstance(detailEl);
        if (detailModal) detailModal.hide();
    }

    const feedbackModal = new bootstrap.Modal(feedbackModalEl);
    feedbackModalEl.dataset.taskId = taskId;

    const modalTitle = feedbackModalEl.querySelector(".feedback-modal-title");
    const modalBody = feedbackModalEl.querySelector(".feedback-modal-body");

    if (modalTitle) modalTitle.textContent = "Task Feedback";
    if (modalBody) modalBody.innerHTML = "";

    // Initialize Quill editor
    setTimeout(() => {
        initInlineFeedbackQuill();
    }, 100);

    // Setup file input handlers ONCE (only if not already setup)
    if (!feedbackModalEl.dataset.handlersInitialized) {
        setupFileInputHandlers();
        feedbackModalEl.dataset.handlersInitialized = 'true';
    }

    loadTaskFeedbackData(taskId);
    feedbackModal.show();

    // Clean up duplicate backdrops
    setTimeout(() => {
        document.querySelectorAll('.modal-backdrop').forEach((el, idx, arr) => {
            if (idx < arr.length - 1) el.remove();
        });
    }, 200);
}

// Setup file input handlers (called once per modal)
function setupFileInputHandlers() {
    const photoBtn = document.getElementById('inlineTaskFeedbackPhotoBtn');
    const fileBtn = document.getElementById('inlineTaskFeedbackFileBtn');
    const imageInput = document.getElementById('inline_task_feedback_image_input');
    const filesInput = document.getElementById('inline_task_feedback_files_input');
    const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

    // Photo button handler
    if (photoBtn && imageInput) {
        photoBtn.addEventListener('click', function () {
            imageInput.click();
        });
    }

    // File button handler
    if (fileBtn && filesInput) {
        fileBtn.addEventListener('click', function () {
            filesInput.click();
        });
    }

    // Image input handler
    if (imageInput) {
        imageInput.addEventListener('change', function () {
            const file = this.files && this.files[0];
            if (!file) return;

            // Size validation
            if (file.size > MAX_IMAGE_BYTES) {
                if (typeof showFloatingAlert === 'function') {
                    showFloatingAlert('Image must be smaller than 10 MB.', 'warning');
                } else {
                    alert('Image must be smaller than 10 MB.');
                }
                this.value = '';
                return;
            }

            // Create preview
            const reader = new FileReader();
            reader.onload = function (e) {
                showTaskInlineImagePreviewSmall(file, e.target.result);
            };
            reader.readAsDataURL(file);
        });
    }

    // Files input handler
    if (filesInput) {
        filesInput.addEventListener('change', function () {
            const files = Array.from(this.files || []);
            if (!files.length) return;

            // Add to selection
            if (!selectedFiles) selectedFiles = [];
            selectedFiles = [...selectedFiles, ...files];

            // Render preview
            renderInlineTaskFeedbackFilesPreview();
            this.value = '';
        });
    }
}

// Load feedback data
function loadTaskFeedbackData(taskId) {
    const modalBody = document.getElementById("taskFeedbackList");
    if (!modalBody) return;

    modalBody.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';

    $.ajax({
        url: appUrl + "/task-feedbacks/" + taskId,
        type: "GET",
        dataType: "json",
        cache: false,
        success: function (response) {
            if (response.data && response.data.length > 0) {
                renderFeedbackList(response.data, taskId, modalBody);
            } else {
                modalBody.innerHTML = '<div class="text-center text-muted py-4">No feedback yet</div>';
            }
        },
        error: function (xhr) {
            modalBody.innerHTML = '<div class="text-center text-danger py-4">Failed to load feedback</div>';
        }
    });
}

// Render feedback list
function renderFeedbackList(feedbacks, taskId, modalBody) {
    const feedbackModalEl = document.getElementById("taskFeedbackModal");
    const currentEmployeeId = parseInt(
        (feedbackModalEl?.dataset?.employeeId || feedbackModalEl?.getAttribute('data-employee-id') || '0'),
        10
    ) || 0;

    let feedbackHtml = "";

    feedbacks.forEach(function (feedback) {
        const formattedDate = feedback.created_at ? timeAgo(feedback.created_at) : '';

        // Normalize image URL
        let topImageUrl = feedback.image || '';
        if (topImageUrl) {
            const isAbs = topImageUrl.startsWith('http://') || topImageUrl.startsWith('https://');
            const isFileTask = topImageUrl.startsWith('/file/task/') || topImageUrl.startsWith('file/task/');
            const isStorage = topImageUrl.startsWith('/storage/') || topImageUrl.startsWith('storage/');
            if (!isAbs && !isFileTask && !isStorage) {
                topImageUrl = appUrl + '/file/task/' + topImageUrl;
            } else if (!isAbs && (isFileTask || isStorage)) {
                topImageUrl = topImageUrl.startsWith('/') ? (appUrl + topImageUrl) : (appUrl + '/' + topImageUrl);
            }
        }

        // Build reference files list
        let topRefFiles = [];
        let topRfVal = feedback.reference_files;
        if (!Array.isArray(topRfVal) && typeof topRfVal === 'string') {
            try {
                const parsed = JSON.parse(topRfVal);
                if (Array.isArray(parsed)) topRfVal = parsed;
            } catch (_) { }
        }
        if (Array.isArray(topRfVal) && topRfVal.length > 0) {
            topRefFiles = topRfVal.map((f) => {
                if (!f) return null;
                const isAbs = f.startsWith('http://') || f.startsWith('https://');
                const isRefPath = f.startsWith('/file/task_reference_files/') || f.startsWith('file/task_reference_files/');
                if (!isAbs && !isRefPath) return appUrl + '/file/task_reference_files/' + f;
                if (!isAbs && isRefPath) return f.startsWith('/') ? (appUrl + f) : (appUrl + '/' + f);
                return f;
            }).filter(Boolean);
        }

        // Build reference URLs list
        let topRefUrls = [];
        let topRuVal = feedback.reference_urls;
        if (!Array.isArray(topRuVal) && typeof topRuVal === 'string') {
            try {
                const parsed = JSON.parse(topRuVal);
                if (Array.isArray(parsed)) topRuVal = parsed;
            } catch (_) { }
        }
        if (Array.isArray(topRuVal) && topRuVal.length > 0) {
            topRefUrls = topRuVal.filter((u) => typeof u === 'string' && u.trim() !== '');
        } else if (feedback.reference_url) {
            topRefUrls = [feedback.reference_url];
        }

        const topAuthorId = (feedback.employee && (feedback.employee.id || feedback.employee.employee_id)) || feedback.employee_id || 0;
        const canEditTop = String(topAuthorId) === String(currentEmployeeId);

        // Build replies HTML
        let repliesHtml = '';
        let viewRepliesBtnHtml = '';
        let repliesContainerHtml = '';

        if (Array.isArray(feedback.replies) && feedback.replies.length > 0) {
            const repliesCount = feedback.replies.length;
            const repliesContent = feedback.replies.map(function (rep) {
                const rDate = rep.created_at ? timeAgo(rep.created_at) : '';

                // Normalize reply image URL
                let repImageUrl = rep.image || '';
                if (repImageUrl) {
                    const isAbs = repImageUrl.startsWith('http://') || repImageUrl.startsWith('https://');
                    const isFileTask = repImageUrl.startsWith('/file/task/') || repImageUrl.startsWith('file/task/');
                    const isStorage = repImageUrl.startsWith('/storage/') || repImageUrl.startsWith('storage/');
                    if (!isAbs && !isFileTask && !isStorage) {
                        repImageUrl = appUrl + '/file/task/' + repImageUrl;
                    } else if (!isAbs && (isFileTask || isStorage)) {
                        repImageUrl = repImageUrl.startsWith('/') ? (appUrl + repImageUrl) : (appUrl + '/' + repImageUrl);
                    }
                }

                // Build reply reference files
                let repRefFiles = [];
                let repRfVal = rep.reference_files;
                if (!Array.isArray(repRfVal) && typeof repRfVal === 'string') {
                    try {
                        const parsed = JSON.parse(repRfVal);
                        if (Array.isArray(parsed)) repRfVal = parsed;
                    } catch (_) { }
                }
                if (Array.isArray(repRfVal) && repRfVal.length > 0) {
                    repRefFiles = repRfVal.map((f) => {
                        if (!f) return null;
                        const isAbs = f.startsWith('http://') || f.startsWith('https://');
                        const isRefPath = f.startsWith('/file/task_reference_files/') || f.startsWith('file/task_reference_files/');
                        if (!isAbs && !isRefPath) return appUrl + '/file/task_reference_files/' + f;
                        if (!isAbs && isRefPath) return f.startsWith('/') ? (appUrl + f) : (appUrl + '/' + f);
                        return f;
                    }).filter(Boolean);
                }

                // Build reply reference URLs
                let repRefUrls = [];
                let repRuVal = rep.reference_urls;
                if (!Array.isArray(repRuVal) && typeof repRuVal === 'string') {
                    try {
                        const parsed = JSON.parse(repRuVal);
                        if (Array.isArray(parsed)) repRuVal = parsed;
                    } catch (_) { }
                }
                if (Array.isArray(repRuVal) && repRuVal.length > 0) {
                    repRefUrls = repRuVal.filter((u) => typeof u === 'string' && u.trim() !== '');
                } else if (rep.reference_url) {
                    repRefUrls = [rep.reference_url];
                }

                const repAuthorId = (rep.employee && (rep.employee.id || rep.employee.employee_id)) || rep.employee_id || 0;
                const canEditReply = String(repAuthorId) === String(currentEmployeeId);

                return `
                    <div class="feedback-reply ms-4 mt-2 p-2 rounded" data-reply-id="${rep.id}" data-parent-id="${feedback.id}" style="background: rgb(240, 241, 248);">
                        <div class="d-flex align-items-start mb-1">
                            <img src="${rep.employee.photo}" alt="${rep.employee.name}" class="rounded-circle me-3" style="width: 24px; height: 24px; object-fit: cover;">
                            <div class="flex-grow-1">
                                <div>
                                    <strong style="font-size:12px; font-weight:600;">${rep.employee.name}</strong>
                                    <div><small class="text-muted d-block" style="font-size:9px;">${rDate}</small></div>
                                </div>
                                <div class="feedback-comment mt-2">
                                    <p class="mb-1" style="font-size: 13px;">${rep.feedback_comment || ''}</p>
                                    ${(repRefUrls.length > 0 || repRefFiles.length > 0) ? `
                                        <div class="feedback-reference-container mb-1">
                                            ${repRefUrls.map((u) => {
                    const shortUrl = u.replace(/^https?:\/\//, '').replace(/\/$/, '');
                    return `<a href="${u}" target="_blank" class="feedback-reference-url me-2">
                                                    <span class="material-symbols-outlined">link</span> ${shortUrl}
                                                </a>`;
                }).join('')}
                                            ${repRefFiles.map((u) => {
                    const fileName = u.split('/').pop();
                    return `<a href="${u}" download class="feedback-reference-file ms-2">
                                                    <span class="material-symbols-outlined">draft</span> ${fileName}
                                                </a>`;
                }).join('')}
                                        </div>
                                    ` : ''}
                                    ${repImageUrl ? `<img src="${repImageUrl}" class="img-fluid rounded reply-image" style="width: 70px; height: auto; border-radius: 8px; cursor: pointer;">` : ''}
                                    <div class="reply-actions mt-2 d-flex gap-4">
                                        <span class="d-flex align-items-center feedback-reply-trigger" data-feedback-id="${feedback.id}" data-task-id="${taskId}" style="cursor:pointer; color:#555; font-size:12px;">
                                            <span class="material-symbols-outlined" style="font-size:18px; line-height:1; margin-right:5px;">reply</span><span>Reply</span>
                                        </span>
                                        ${canEditReply ? `<span class="d-flex align-items-center reply-delete-trigger" data-reply-id="${rep.id}" data-parent-id="${feedback.id}" style="cursor:pointer; color:#555; font-size:12px;">
                                            <span class="material-symbols-outlined" style="font-size:18px; line-height:1; margin-right:5px;">delete</span><span>Delete</span>
                                        </span>` : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            viewRepliesBtnHtml = `<button type="button" class="btn btn-link p-0 view-replies-toggle feedback-toggle-replies" data-feedback-id="${feedback.id}" data-replies-count="${repliesCount}" style="font-size: 13px; color:#555; text-decoration: none;">View all (${repliesCount})</button>`;
            repliesContainerHtml = `<div class="feedback-replies d-none" id="replies-${feedback.id}">${repliesContent}</div>`;
        }

        feedbackHtml += `
            <div class="feedback-item mb-3 p-3" data-feedback-id="${feedback.id}">
                <div class="d-flex align-items-start mb-2">
                    <img src="${feedback.employee.photo}" alt="${feedback.employee.name}" class="rounded-circle me-3" style="width: 32px; height: 32px; object-fit: cover;">
                    <div class="flex-grow-1">
                        <div>
                            <strong style="font-size:14px; font-weight:600;">${feedback.employee.name}</strong>
                            <div><small class="text-muted d-block" style="font-size: 10px;">${formattedDate}</small></div>
                        </div>
                        <div class="feedback-comment mt-2">
                            <p class="mb-2" style="font-size:13px;">${feedback.feedback_comment}</p>
                            ${(topRefUrls.length > 0 || topRefFiles.length > 0) ? `
                                <div class="feedback-reference-container mb-2">
                                    ${topRefUrls.map((u) => {
            const shortUrl = u.replace(/^https?:\/\//, '').replace(/\/$/, '');
            return `<a href="${u}" target="_blank" class="feedback-reference-url bg-light rounded-2">
                                            <span class="material-symbols-outlined" style="color: #444444;">link</span> ${shortUrl}
                                        </a>`;
        }).join('')}
                                    ${topRefFiles.map((u) => {
            const fileName = u.split('/').pop();
            return `<a href="${u}" class="feedback-reference-file bg-light rounded-2">
                                            <span class="material-symbols-outlined" style="color: #444444;">draft</span> ${fileName}
                                        </a>`;
        }).join('')}
                                </div>
                            ` : ""}
                            ${topImageUrl ? `<img src="${topImageUrl}" class="img-fluid rounded mb-2 feedback-image" style="width: 70px; height: auto; border-radius: 8px; cursor: pointer;">` : ""}
                            <div class="feedback-actions mt-2 d-flex gap-4 align-items-center">
                                <span class="d-flex align-items-center feedback-reply-trigger" data-feedback-id="${feedback.id}" data-task-id="${taskId}" style="cursor:pointer; color:#555; font-size:12px;">
                                    <span class="material-symbols-outlined" style="font-size:18px; line-height:1; margin-right:5px;">reply</span><span>Reply</span>
                                </span>
                                ${canEditTop ? `<span class="d-flex align-items-center feedback-delete-trigger" data-feedback-id="${feedback.id}" style="cursor:pointer; color:#555; font-size:12px;">
                                    <span class="material-symbols-outlined" style="font-size:18px; line-height:1; margin-right:5px;">delete</span><span>Delete</span>
                                </span>` : ''}
                                ${viewRepliesBtnHtml}
                            </div>
                        </div>
                    </div>
                </div>
                ${repliesContainerHtml}
            </div>
        `;
    });

    modalBody.innerHTML = feedbackHtml;

    // Bind event handlers
    bindFeedbackEventHandlers(modalBody, taskId);
}

// Bind feedback event handlers
function bindFeedbackEventHandlers(modalBody, taskId) {
    // Reply trigger
    modalBody.querySelectorAll('.feedback-reply-trigger').forEach(function (btn) {
        btn.addEventListener('click', function () {
            const parentId = this.getAttribute('data-feedback-id');
            showReplyFeedbackForm(taskId, parentId);
        });
    });

    // Delete feedback
    modalBody.querySelectorAll('.feedback-delete-trigger').forEach(function (btn) {
        btn.addEventListener('click', function () {
            const fid = this.getAttribute('data-feedback-id');
            if (!fid) return;

            const authorName = (this.closest('.feedback-item')?.querySelector('strong')?.textContent) || '';
            const content = (this.closest('.feedback-item')?.querySelector('.feedback-comment p')?.textContent) || '';
            const avatarUrl = (this.closest('.feedback-item')?.querySelector('img')?.getAttribute('src')) || '';

            showDeleteConfirmModal({
                type: 'feedback',
                id: fid,
                authorName: authorName,
                content: content,
                avatarUrl: avatarUrl,
                onConfirm: function (done) {
                    deleteFeedback(fid, taskId, done);
                }
            });
        });
    });

    // Delete reply
    modalBody.querySelectorAll('.reply-delete-trigger').forEach(function (btn) {
        btn.addEventListener('click', function () {
            const rid = this.getAttribute('data-reply-id');
            const pid = this.getAttribute('data-parent-id');
            if (!rid) return;

            const authorName = (this.closest('.feedback-reply')?.querySelector('strong')?.textContent) || '';
            const content = (this.closest('.feedback-reply')?.querySelector('.feedback-comment p')?.textContent) || '';
            const avatarUrl = (this.closest('.feedback-reply')?.querySelector('img')?.getAttribute('src')) || '';

            showDeleteConfirmModal({
                type: 'reply',
                id: rid,
                parentId: pid,
                authorName: authorName,
                content: content,
                avatarUrl: avatarUrl,
                onConfirm: function (done) {
                    deleteReply(rid, taskId, done);
                }
            });
        });
    });

    // View replies toggle
    modalBody.querySelectorAll('.view-replies-toggle').forEach(function (btn) {
        btn.addEventListener('click', function () {
            const fid = this.getAttribute('data-feedback-id');
            const count = this.getAttribute('data-replies-count');
            const container = modalBody.querySelector('#replies-' + fid);
            if (!container) return;
            const hidden = container.classList.contains('d-none');
            if (hidden) {
                container.classList.remove('d-none');
                this.textContent = 'Hide';
            } else {
                container.classList.add('d-none');
                this.textContent = `View all (${count})`;
            }
            this.style.textDecoration = 'none';
            this.style.color = '#555';
        });
    });

    // Feedback image preview
    modalBody.querySelectorAll('.feedback-image, .reply-image').forEach(function (img) {
        img.addEventListener('click', function () {
            showImagePreview(this.src);
        });
    });
}

// Show reply form
function showReplyFeedbackForm(taskId, parentId) {
    try {
        const feedbackModalEl = document.getElementById("taskFeedbackModal");
        const inlineForm = feedbackModalEl.querySelector('.feedback-form');

        if (inlineForm) {
            let inlinePid = inlineForm.querySelector('#inline_parent_id_input');
            if (!inlinePid) {
                inlinePid = document.createElement('input');
                inlinePid.type = 'hidden';
                inlinePid.id = 'inline_parent_id_input';
                inlinePid.name = 'parent_id';
                inlineForm.appendChild(inlinePid);
            }
            inlinePid.value = parentId || '';

            // Prepare preview container inside inline form
            let previewContainer = inlineForm.querySelector('#reply_parent_preview_inline');
            if (!previewContainer) {
                previewContainer = document.createElement('div');
                previewContainer.id = 'reply_parent_preview_inline';
                previewContainer.className = 'mt-2';
                inlineForm.insertBefore(previewContainer, inlineForm.firstChild);
            }

            // Default preview while fetching
            previewContainer.innerHTML = '<div class="selected-files-list mt-2"><div class="d-flex align-items-center gap-2 p-2 rounded bg-light selected-task"><div style="width:28px;height:28px;border-radius:50%;overflow:hidden;flex:0 0 28px;display:flex;align-items:center;justify-content:center;"><span class="material-symbols-outlined">person</span></div><div class="flex-grow-1" style="font-size: 10px;"><div style="font-weight:500;font-size:11px">Loading...</div><div style="font-size:10px;color:#6b6b6b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:240px;">&nbsp;</div></div><button type="button" class="btn btn-sm btn-remove-task remove-task" style="line-height: 1; font-size: 10px;"><span class="material-symbols-outlined">close</span></button></div></div>';

            // Fetch feedback data to show preview
            fetch(appUrl + '/task-feedbacks/' + taskId)
                .then(function (res) {
                    if (!res.ok) return res.json().then(Promise.reject);
                    return res.json();
                })
                .then(function (json) {
                    const payload = json && json.data ? json.data : json;
                    let fb = null;

                    // Find feedback by parentId
                    function findById(node, id) {
                        if (!node) return null;
                        if (Array.isArray(node)) {
                            for (let k = 0; k < node.length; k++) {
                                const r = findById(node[k], id);
                                if (r) return r;
                            }
                            return null;
                        }
                        try {
                            if (node && String(node.id) === String(id)) return node;
                            if (node && node.replies && Array.isArray(node.replies)) {
                                const rr = findById(node.replies, id);
                                if (rr) return rr;
                            }
                        } catch (_) { }
                        return null;
                    }

                    fb = findById(payload, parentId);

                    const title = (fb && fb.employee && (fb.employee.name || fb.employee.fullname)) ||
                        (fb && (fb.employee_name || fb.employee_fullname)) || 'Unknown';
                    const commentRaw = (fb && (fb.feedback_comment || fb.comment || fb.description)) || '';

                    try {
                        const empRaw = (fb && fb.employee) || {};
                        let avatarRaw = empRaw.user_photo || empRaw.profile_picture || empRaw.photo || fb.employee_photo || '';
                        const avatarUrl = (typeof buildPhotoUrl === 'function') ?
                            buildPhotoUrl(avatarRaw, empRaw.profile_picture, empRaw.profile_picture_url) :
                            (avatarRaw ? appUrl + '/file/profile_picture/' + avatarRaw : appUrl + '/asset/img/avatar.png');

                        let plain = '';
                        try {
                            plain = (commentRaw || '').replace(/<[^>]+>/g, '');
                        } catch (_) {
                            plain = (commentRaw || '') + '';
                        }
                        if (plain && plain.length > 120) plain = plain.substring(0, 120).trim() + '...';

                        let html = '';
                        html += '<div class="selected-files-list mt-2">';
                        html += '<div class="d-flex align-items-center gap-2 p-2 rounded bg-light selected-task">';
                        html += '<div style="width:28px;height:28px;border-radius:50%;overflow:hidden;flex:0 0 28px;display:flex;align-items:center;justify-content:center;">';
                        html += '<img src="' + avatarUrl + '" alt="avatar" style="width:28px;height:28px;object-fit:cover;display:block;" onerror="this.onerror=null;this.src=\'' + appUrl + '/asset/img/avatar.png\';">';
                        html += '</div>';
                        html += '<div class="flex-grow-1" style="font-size: 10px;">';
                        html += '<div style="font-weight:500;font-size:11px">' + (title || 'Unknown') + '</div>';
                        html += '<div style="font-size:10px;color:#6b6b6b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:240px;">' + (plain || '') + '</div>';
                        html += '</div>';
                        html += '<button type="button" class="btn btn-sm btn-remove-task remove-task" style="line-height: 1; font-size: 10px;"><span class="material-symbols-outlined">close</span></button>';
                        html += '</div></div>';
                        previewContainer.innerHTML = html;
                    } catch (_) { }

                    try {
                        const btn = previewContainer.querySelector('.remove-task');
                        if (btn) btn.addEventListener('click', function () {
                            try {
                                previewContainer.remove();
                                inlinePid.value = '';
                            } catch (_) { }
                        });
                    } catch (_) { }
                })
                .catch(function () {
                    // On error, show minimal preview with remove button
                    previewContainer.innerHTML = '<div class="selected-files-list mt-2"><div class="d-flex align-items-center gap-2 p-2 rounded bg-light selected-task"><div style="width:28px;height:28px;border-radius:50%;overflow:hidden;flex:0 0 28px;display:flex;align-items:center;justify-content:center;"><span class="material-symbols-outlined">person</span></div><div class="flex-grow-1" style="font-size: 10px;"><div style="font-weight:500;font-size:11px">Reply to feedback</div><div style="font-size:10px;color:#6b6b6b;">&nbsp;</div></div><button type="button" class="btn btn-sm btn-remove-task remove-task" style="line-height: 1; font-size: 10px;"><span class="material-symbols-outlined">close</span></button></div></div>';

                    try {
                        const btn = previewContainer.querySelector('.remove-task');
                        if (btn) btn.addEventListener('click', function () {
                            try {
                                previewContainer.remove();
                                inlinePid.value = '';
                            } catch (_) { }
                        });
                    } catch (_) { }
                });

            // Focus editor
            try {
                if (__quillInlineFeedback) {
                    setTimeout(() => {
                        __quillInlineFeedback.focus();
                        document.querySelector('#inline_task_feedback_editor .ql-editor')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 200);
                }
            } catch (_) { }
        }
    } catch (e) {
        console.warn("showReplyFeedbackForm error", e);
    }
}

// Submit inline feedback
function submitInlineFeedback() {
    const feedbackModalEl = document.getElementById("taskFeedbackModal");
    const taskId = feedbackModalEl?.dataset?.taskId;

    if (!taskId) {
        showFloatingAlert('Task ID not found', 'danger', 3000);
        return;
    }

    const employeeId = feedbackModalEl?.dataset?.employeeId || '';

    // Get content from Quill
    let feedbackComment = '';
    if (__quillInlineFeedback) {
        feedbackComment = __quillInlineFeedback.root.innerHTML || '';
    }

    // Validate
    const plainText = feedbackComment.replace(/<[^>]+>/g, '').trim();
    if (!plainText) {
        showFloatingAlert('Please enter feedback comment', 'warning', 3000);
        return;
    }

    // Get parent ID for reply
    const parentIdInput = document.getElementById('inline_parent_id_input');
    const parentId = parentIdInput?.value || '';

    // Get image file from stored variable or input
    const imageFile = window.__taskInlineFeedbackImageFile || null;

    // Get reference files from selectedFiles array
    const refFiles = selectedFiles || [];

    // Validate image size
    if (imageFile && imageFile.size > MAX_IMAGE_BYTES) {
        showFloatingAlert('Image must be smaller than 10 MB', 'warning', 3000);
        return;
    }

    // Build FormData
    const formData = new FormData();
    formData.append('task_id', taskId);
    formData.append('employee_id', employeeId);
    formData.append('feedback_comment', feedbackComment);
    if (parentId) formData.append('parent_id', parentId);
    if (imageFile) formData.append('feedback_image', imageFile);

    // Append multiple files from selectedFiles array
    if (refFiles.length > 0) {
        for (let i = 0; i < refFiles.length; i++) {
            formData.append('reference_files[]', refFiles[i]);
        }
    }

    const sendBtn = document.getElementById('inlineTaskFeedbackSendBtn');
    const originalHtml = sendBtn?.innerHTML || '';

    if (sendBtn) {
        sendBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
        sendBtn.disabled = true;
    }

    $.ajax({
        url: appUrl + "/task-feedbacks",
        type: "POST",
        data: formData,
        contentType: false,
        processData: false,
        headers: {
            "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]').getAttribute("content")
        },
        success: function (response) {
            showFloatingAlert(response.message || 'Feedback submitted successfully', 'success', 2000);

            // Clear form
            if (__quillInlineFeedback) {
                __quillInlineFeedback.setText('');
            }

            // Clear image input and preview
            const imageInput = document.getElementById('inline_task_feedback_image_input');
            if (imageInput) imageInput.value = '';
            window.__taskInlineFeedbackImageFile = null;
            const imagePreview = document.getElementById('inline_task_feedback_image_preview');
            if (imagePreview && imagePreview.parentNode) {
                imagePreview.parentNode.removeChild(imagePreview);
            }

            // Clear files input and preview
            const filesInput = document.getElementById('inline_task_feedback_files_input');
            if (filesInput) filesInput.value = '';
            selectedFiles = [];
            const filesPreview = document.getElementById('inline_task_feedback_files_preview');
            if (filesPreview) filesPreview.innerHTML = '';

            // Clear parent ID and reply preview
            if (parentIdInput) parentIdInput.value = '';
            const replyPreview = document.getElementById('reply_parent_preview_inline');
            if (replyPreview && replyPreview.parentNode) {
                replyPreview.parentNode.removeChild(replyPreview);
            }

            // Reload feedback list
            loadTaskFeedbackData(taskId);
        },
        error: function (xhr) {
            let errorMessage = "Failed to submit feedback. Please try again.";
            if (xhr.responseJSON?.errors) {
                errorMessage = Object.values(xhr.responseJSON.errors).flat().join("\n");
            } else if (xhr.responseJSON?.message) {
                errorMessage = xhr.responseJSON.message;
            }
            showFloatingAlert(errorMessage, "danger", 3000);
        },
        complete: function () {
            if (sendBtn) {
                sendBtn.innerHTML = originalHtml;
                sendBtn.disabled = false;
            }
        }
    });
}

// Delete feedback
function deleteFeedback(feedbackId, taskId, done) {
    $.ajax({
        url: appUrl + "/task-feedbacks/" + feedbackId,
        type: "DELETE",
        headers: {
            "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]').getAttribute("content")
        },
        success: function (response) {
            showFloatingAlert(response.message || 'Feedback deleted successfully', 'success', 2000);
            loadTaskFeedbackData(taskId);
            if (typeof done === 'function') done(true);
        },
        error: function (xhr) {
            let msg = 'Failed to delete feedback';
            if (xhr.responseJSON && xhr.responseJSON.message) msg = xhr.responseJSON.message;
            showFloatingAlert(msg, 'danger', 3000);
            if (typeof done === 'function') done(false);
        }
    });
}

// Delete reply
function deleteReply(replyId, taskId, done) {
    $.ajax({
        url: appUrl + "/task-feedbacks/" + replyId,
        type: "DELETE",
        headers: {
            "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]').getAttribute("content")
        },
        success: function (response) {
            showFloatingAlert(response.message || 'Reply deleted successfully', 'success', 2000);
            loadTaskFeedbackData(taskId);
            if (typeof done === 'function') done(true);
        },
        error: function (xhr) {
            let msg = 'Failed to delete reply';
            if (xhr.responseJSON && xhr.responseJSON.message) msg = xhr.responseJSON.message;
            showFloatingAlert(msg, 'danger', 3000);
            if (typeof done === 'function') done(false);
        }
    });
}

// Show image preview modal
function showImagePreview(imageSrc) {
    let modal = document.getElementById('taskImagePreviewModal');

    if (!modal) {
        const html = `
            <div class="modal fade" id="taskImagePreviewModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered" id="taskImageDialog">
                    <div class="modal-content modal-content-custom bg-light border-0">
                        <div class="modal-body p-0 d-flex align-items-center justify-content-center" style="max-height:80vh;">
                            <img id="taskImagePreviewModalImg" src="" alt="Preview image" style="display:block; max-width:100%; max-height:80vh; object-fit:contain;">
                        </div>
                        <div class="modal-footer modal-footer-custom border-0 justify-content-center">
                            <button type="button" class="btn btn-custom-close" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
        modal = document.getElementById('taskImagePreviewModal');
    }

    const img = document.getElementById('taskImagePreviewModalImg');
    if (img) img.src = imageSrc;

    new bootstrap.Modal(modal).show();
}

// Show floating alert
function showFloatingAlert(message, type = 'info', duration = 3000) {
    if (typeof window.showAlertMsg === 'function') {
        window.showAlertMsg(message, type === 'success' ? 'light' : type, duration);
        return;
    }

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type === 'success' ? 'success' : type === 'danger' ? 'danger' : 'warning'} position-fixed top-0 start-50 translate-middle-x mt-3`;
    alertDiv.style.zIndex = '9999';
    alertDiv.textContent = message;

    document.body.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.remove();
    }, duration);
}

// Event listeners
$(document).ready(function () {
    $(document).on('click', '.task-icon', function (e) {
        const icon = $(this);
        if (icon.text().trim() === 'mode_comment') {
            const taskId = icon.data('task-id');
            if (taskId) {
                handleTaskFeedback(taskId);
            }
        }
    });

    // Send feedback button
    $(document).on('click', '#inlineTaskFeedbackSendBtn', function () {
        submitInlineFeedback();
    });

    // Clean up when modal closes
    $(document).on('hidden.bs.modal', '#taskFeedbackModal', function () {
        // Clear Quill editor
        if (__quillInlineFeedback) {
            __quillInlineFeedback.setText('');
        }

        // Clear file inputs
        $('#inline_task_feedback_image_input').val('');
        $('#inline_task_feedback_files_input').val('');
        $('#inline_parent_id_input').val('');

        // Clear stored variables
        window.__taskInlineFeedbackImageFile = null;
        selectedFiles = [];

        // Remove preview elements
        const imagePreview = document.getElementById('inline_task_feedback_image_preview');
        if (imagePreview && imagePreview.parentNode) {
            imagePreview.parentNode.removeChild(imagePreview);
        }

        const filesPreview = document.getElementById('inline_task_feedback_files_preview');
        if (filesPreview) filesPreview.innerHTML = '';

        const replyPreview = document.getElementById('reply_parent_preview_inline');
        if (replyPreview && replyPreview.parentNode) {
            replyPreview.parentNode.removeChild(replyPreview);
        }

        // Clean up modal backdrop
        $(".modal-backdrop").remove();
        $("body").removeClass("modal-open").css("overflow", "");
    });
});

function renderMobileOutsideCalendarHeader() {
    const container = document.getElementById('mobile-outside-calendar-header');

    container.innerHTML = `
        <div class="mobile-employee-info mb-3">
            <div class="d-flex align-items-center gap-2">
                <div class="selected-employee-photo me-2"></div>
                <span class="selected-employee-name"></span>
            </div>
        </div>
    `;
}

function renderMobileInsideCalendarHeader() {
    const container = document.getElementById('mobile-inside-calendar-header')

    container.innerHTML = `
        <div class="mobile-calendar-controls d-flex align-items-center p-2 gap-3 mb-3">
            <div class="dropdown dropdown-month">
                <div class="dropdown-toggle btn btn-dropdown-month p-0" data-bs-toggle="dropdown">
                    <div class="d-inline-flex align-items-center">
                        <span class="calendar-month">${new Date().toLocaleString('en', { month: 'long' })}</span>
                        <span class="calendar-year">${new Date().getFullYear()}</span>
                    </div>
                </div>

                <ul class="dropdown-menu border-0 shadow-sm bg-default-1 rounded-3">
                    ${Array.from({ length: 12 }, (_, i) => {
                        const month = new Date(2000, i, 1).toLocaleString('en', { month: 'long' });
                        return `<li data-month="${i + 1}" class="dropdown-item month-item fs-14">${month}</li>`;
                    }).join('')}
                </ul>
            </div>

            <div class="d-flex align-items-center gap-1">
                <span class="material-symbols-outlined calendar-prev-month">chevron_left</span>
                <span class="material-symbols-outlined calendar-next-month">chevron_right</span>
            </div>

            <div class="search-wrapper flex-grow-1 position-relative">
                <span class="material-symbols-outlined search-icon position-absolute">search</span>
                <input type="text" class="search-input-custom w-100" id="mobile_search_task" placeholder="search task...">
            </div>
        </div>`

    document.getElementById('mobile_search_task').addEventListener('input', e => {
        document.getElementById('search_task').value = e.target.value;
        $('#search_task').trigger('input');
    });

    $('.calendar-prev-month').click(function () {
        currentDate.setMonth(currentDate.getMonth() - 1);

        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"];
        $('.calendar-month').text(monthNames[currentDate.getMonth()]);
        $('.calendar-year').text(currentDate.getFullYear());

        if (selectedEmployeeId) {
            renderEventCalendar(currentDate.getFullYear(), currentDate.getMonth());
        } else {
            renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
        }
    });

    $('.calendar-next-month').click(function () {
        currentDate.setMonth(currentDate.getMonth() + 1);

        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"];
        $('.calendar-month').text(monthNames[currentDate.getMonth()]);
        $('.calendar-year').text(currentDate.getFullYear());

        if (selectedEmployeeId) {
            renderEventCalendar(currentDate.getFullYear(), currentDate.getMonth());
        } else {
            renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
        }
    });
}

function renderFooterStatusLegend() {
    const container = document.getElementById('legend-footer-mobile')

    container.innerHTML = `
        <div class="mobile-stats-wrapper mt-2">
            <span class="mobile-selected-employee-task">0</span>

            <div class="mobile-stats-boxes d-flex justify-content-between mt-2">
                <div class="stat-box stat-start">
                    <div class="stat-number mobile-selected-employee-start">0</div>
                    <div class="stat-label">Not Started</div>
                </div>

                <div class="stat-box stat-late">
                    <div class="stat-number mobile-selected-employee-late">0</div>
                    <div class="stat-label">Late</div>
                </div>

                <div class="stat-box stat-progress">
                    <div class="stat-number mobile-selected-employee-progress">0</div>
                    <div class="stat-label">In Progress</div>
                </div>

                <div class="stat-box stat-complete">
                    <div class="stat-number mobile-selected-employee-complete">0</div>
                    <div class="stat-label">Complete</div>
                </div>

                <div class="stat-box stat-finish">
                    <div class="stat-number mobile-selected-employee-finish">0</div>
                    <div class="stat-label">Finish</div>
                </div>
            </div>
        </div>
    `
}

function checkCalendarLayout() {
    if (window.innerWidth <= 768) {
        document.getElementById('mobile-inside-calendar-header').classList.remove('d-none');
        document.getElementById('mobile-outside-calendar-header').classList.remove('d-none');
        document.getElementById('legend-footer-mobile').classList.remove('d-none');
        renderMobileOutsideCalendarHeader();
        renderMobileInsideCalendarHeader();
        renderFooterStatusLegend();

        document.querySelector('.header-calendar').classList.add('d-none');
    } else {
        document.getElementById('mobile-inside-calendar-header').classList.add('d-none');
        document.getElementById('mobile-outside-calendar-header').classList.add('d-none');
        document.getElementById('legend-footer-mobile').classList.add('d-none');
        document.querySelector('.header-calendar').classList.remove('d-none');
    }
}

checkCalendarLayout();
window.addEventListener('resize', checkCalendarLayout);
