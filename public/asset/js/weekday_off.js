const appUrl = $('meta[name=app-url]').attr('content');

const modalAttendance = new bootstrap.Modal('#modalAttendance', {
    keyboard: false
});

let weekdayOffCurrentPage = 1;
const weekdayOffPerPage = 10;
let weekdayOffSearchQuery = '';
let weekdayOffSearchTimeout = null;

const weekdayOffState = {};

function normalizeImageUrl(url) {
    let u = url == null ? '' : String(url);
    if (!u || u.toLowerCase() === 'null' || u.toLowerCase() === 'undefined') {
        return `${appUrl}/asset/img/avatar.png`;
    }
    if (/^(https?:)?\/\//i.test(u) || /^data:/i.test(u) || /^blob:/i.test(u)) {
        return u;
    }
    return `${appUrl}/${u.replace(/^\//, '')}`;
}

function createPageButton(label, page, disabled) {
    return `<button type="button" class="page-btn" data-page="${page}" ${disabled ? 'disabled' : ''}>${label}</button>`;
}

function buildPageNumbers(current, last) {
    const pages = [];

    if (last <= 7) {
        for (let i = 1; i <= last; i++) {
            pages.push(i);
        }
        return pages;
    }

    pages.push(1);

    if (current > 3) {
        pages.push('...');
    }

    const start = Math.max(2, current - 1);
    const end = Math.min(last - 1, current + 1);

    for (let i = start; i <= end; i++) {
        pages.push(i);
    }

    if (current < last - 2) {
        pages.push('...');
    }

    pages.push(last);
    return pages;
}

function renderWeekdayOffPagination(pagination) {
    const $infoEl = $('#weekdayOffPaginationInfo');
    const $controlsEl = $('#weekdayOffPagination');

    if (!pagination || (pagination.total || 0) === 0) {
        $infoEl.text('');
        $controlsEl.html('');
        return;
    }

    const from = pagination.from || 0;
    const to = pagination.to || 0;
    const total = pagination.total || 0;
    $infoEl.text(`Showing ${from}-${to} of ${total}`);

    const current = pagination.current_page || 1;
    const last = pagination.last_page || 1;

    const buttons = [];
    buttons.push(createPageButton('Prev', Math.max(current - 1, 1), current <= 1));

    buildPageNumbers(current, last).forEach((item) => {
        if (item === '...') {
            buttons.push('<span class="page-btn" style="pointer-events:none;box-shadow:none;">...</span>');
            return;
        }
        const activeClass = item === current ? ' is-active' : '';
        buttons.push(`<button type="button" class="page-btn${activeClass}" data-page="${item}">${item}</button>`);
    });

    buttons.push(createPageButton('Next', Math.min(current + 1, last), current >= last));

    $controlsEl.html(buttons.join(''));
}

$('#weekdayOffPagination').on('click', 'button[data-page]', function () {
    if (this.disabled) return;
    const page = Number($(this).data('page'));
    if (!Number.isFinite(page)) return;
    weekdayOffCurrentPage = page;
    fetchWeekdayOffEmployees(page);
});

function renderWeekdayOffTable(employees) {
    const $tbody = $('#weekdayOffTableBody');

    if (!employees.length) {
        $tbody.html('<tr><td colspan="8" class="text-center">No employee found.</td></tr>');
        return;
    }

    let rows = '';
    employees.forEach((employee) => {
        const employeeId = employee.id;

        if (!weekdayOffState[employeeId]) {
            const daysFromServer = String(employee.weekday_off || '')
                .split(',')
                .map((d) => d.trim())
                .filter((d) => d !== '');
            weekdayOffState[employeeId] = {
                divisionId: employee.division_id,
                days: new Set(daysFromServer),
            };
        }

        const state = weekdayOffState[employeeId];
        const photoUrl = normalizeImageUrl(employee.photo);

        let cells = '';
        for (let day = 1; day <= 7; day++) {
            const isDayOff = state.days.has(String(day));
            cells += `
                <td class="col-day ${isDayOff ? 'day-off' : ''}" data-weekday="${day}">
                    <div class="box-weekday"></div>
                </td>
            `;
        }

        rows += `
            <tr class="employee-row" data-employee-id="${employeeId}" data-division="${employee.division_id}" data-department="${employee.department_id}">
                <td>
                    <div class="box-employee">
                        <div class="d-flex align-items-center">
                            <div class="col-photo">
                                <div class="employee-photo">
                                    <img src="${photoUrl}" class="rounded-circle w-100 h-100 object-fit-cover" alt="">
                                </div>
                            </div>
                            <div class="col-name w-100">
                                <div class="employee-name">${employee.name}</div>
                            </div>
                        </div>
                    </div>
                </td>
                ${cells}
            </tr>
        `;
    });

    $tbody.html(rows);
}

function fetchWeekdayOffEmployees(page = 1) {
    const departmentId = $('.col-dropdown-department').attr('data-department-id');
    const divisionId = $('.col-dropdown-division').attr('data-division-id');

    $('.col-weekday-off .loader').fadeIn('fast');

    $.ajax({
        url: appUrl + '/weekday_off/get-employee',
        type: 'GET',
        data: {
            DEPARTMENT_ID: departmentId,
            DIVISION_ID: divisionId && divisionId != 0 ? divisionId : null,
            SEARCH_QUERY: weekdayOffSearchQuery,
            PAGE: page,
            PER_PAGE: weekdayOffPerPage,
        },
        success: function (response) {
            renderWeekdayOffTable(response.data || []);
            weekdayOffCurrentPage = (response.pagination && response.pagination.current_page) || 1;
            renderWeekdayOffPagination(response.pagination);
            $('.col-weekday-off .loader').fadeOut('fast');
        },
        error: function () {
            $('#weekdayOffTableBody').html('<tr><td colspan="8" class="text-center text-danger">Failed to load employee data.</td></tr>');
            $('.col-weekday-off .loader').fadeOut('fast');
        },
    });
}

$('.input-search-query').on('keyup', function () {
    clearTimeout(weekdayOffSearchTimeout);
    weekdayOffSearchTimeout = setTimeout(function () {
        weekdayOffSearchQuery = $('.input-search-query').val();
        weekdayOffCurrentPage = 1;
        fetchWeekdayOffEmployees(1);
    }, 350);
});

$('.department-item').on('click', function () {
    const departmentId = $(this).attr('data-department-id');
    const departmentName = $(this).attr('data-department-name');

    $('.col-dropdown-department').attr('data-department-id', departmentId);
    $('.col-dropdown-department .title-dropdown').text(departmentName);

    $('.col-dropdown-division').attr('data-division-id', 0);
    $('.col-dropdown-division .title-dropdown').text((window.dropdownTranslations || {}).all_site || 'All Site');

    $('.division-item').addClass('d-none');
    $(`.division-item[data-department-id="${departmentId}"]`).removeClass('d-none');
    $('.division-item[data-department-id="0"]').removeClass('d-none');

    weekdayOffCurrentPage = 1;
    fetchWeekdayOffEmployees(1);
});

$('.division-item').on('click', function () {
    const departmentId = $(this).attr('data-department-id');
    const divisionId = $(this).attr('data-division-id');
    const divisionName = $(this).attr('data-division-name');

    $('.col-dropdown-division').attr('data-department-id', departmentId);
    $('.col-dropdown-division').attr('data-division-id', divisionId);
    $('.col-dropdown-division .title-dropdown').text(divisionName);

    weekdayOffCurrentPage = 1;
    fetchWeekdayOffEmployees(1);
});

function setDefaultDropdown() {
    const $firstDepartment = $('.department-item').first();
    const departmentId = $firstDepartment.attr('data-department-id');
    const departmentName = $firstDepartment.attr('data-department-name');

    $('.col-dropdown-department').attr('data-department-id', departmentId);
    $('.col-dropdown-department .title-dropdown').text(departmentName);

    $('.col-dropdown-division').attr('data-department-id', departmentId);
    $('.col-dropdown-division').attr('data-division-id', 0);
    $('.col-dropdown-division .title-dropdown').text((window.dropdownTranslations || {}).all_site || 'All Site');

    $('.division-item').addClass('d-none');
    $(`.division-item[data-department-id="${departmentId}"]`).removeClass('d-none');
    $('.division-item[data-department-id="0"]').removeClass('d-none');
}

setDefaultDropdown();
fetchWeekdayOffEmployees(1);

$(document).on('click', '.data-fullscreen, .data-fullscreen-exit', function () {
    $('.weekday-off-container').toggleClass('fullscreen');
    $('.data-fullscreen').toggleClass('d-none');
});

$('#btn-save-weekday-off').on('click', function () {
    const rowEmployee = [];

    Object.keys(weekdayOffState).forEach((employeeId) => {
        const state = weekdayOffState[employeeId];
        const weekDay = Array.from(state.days).sort();
        rowEmployee.push([employeeId, state.divisionId, weekDay.join(',')]);
    });

    const jsonEmployee = JSON.stringify(rowEmployee);
    saveWeekdayOff(jsonEmployee);
});

function saveWeekdayOff(jsonEmployee) {
    const formData = new FormData();
    formData.append('json_weekday_off', jsonEmployee);
    formData.append('_token', $('meta[name="csrf-token"]').attr('content'));

    $.ajax({
        url: appUrl + '/weekday_off/save-employee-weekday-off',
        type: 'POST',
        data: formData,
        cache: false,
        processData: false,
        contentType: false,
        beforeSend: function () {
            $('.col-weekday-off .loader').fadeIn('fast');
        },
        error: function (res) {
            const resJson = res.responseJSON;
            showAlertMsg(resJson.message, 'error', 5000);
            $('.col-weekday-off .loader').fadeOut('fast');
        },
        success: function (response) {
            showAlertMsg(response.message);
            $('.col-weekday-off .loader').fadeOut('fast');
        }
    });
}

$(document).on('click', 'tbody .col-day', function () {
    const employeeId = $(this).closest('.employee-row').attr('data-employee-id');
    const weekday = String($(this).attr('data-weekday'));

    $(this).toggleClass('day-off');

    if (!weekdayOffState[employeeId]) {
        weekdayOffState[employeeId] = {
            divisionId: $(this).closest('.employee-row').attr('data-division'),
            days: new Set(),
        };
    }

    if ($(this).hasClass('day-off')) {
        weekdayOffState[employeeId].days.add(weekday);
    } else {
        weekdayOffState[employeeId].days.delete(weekday);
    }
});

$(document).on('click', 'thead .col-day', function () {
    const weekday = $(this).attr('data-weekday');

    $(this).toggleClass('day-off');

    const hasDayOff = $(this).hasClass('day-off');

    $(`tbody tr [data-weekday="${weekday}"]`).each(function () {
        const employeeId = $(this).closest('.employee-row').attr('data-employee-id');

        if (!weekdayOffState[employeeId]) {
            weekdayOffState[employeeId] = {
                divisionId: $(this).closest('.employee-row').attr('data-division'),
                days: new Set(),
            };
        }

        if (hasDayOff) {
            $(this).addClass('day-off');
            weekdayOffState[employeeId].days.add(weekday);
        } else {
            $(this).removeClass('day-off');
            weekdayOffState[employeeId].days.delete(weekday);
        }
    });
});

function getAttendanceDetail(employeeId, dateAttendance) {
    $.ajax({
        url: appUrl + '/attendance_tracking/get-attendance-detail',
        type: 'GET',
        data: {
            EMPLOYEE_ID: employeeId,
            DATE_ATTENDANCE: dateAttendance,
        },
        error: function (res) {
            const resJson = res.responseJSON;
            showAlertMsg(resJson.message, 'error', 5000);
        },
        success: function (response) {
            const resData = response.data;

            const employee = resData.employee;
            const attendance = resData.attendance;

            const employeeShift = formatTimeShort(attendance.shift_time_start) + ' - ' + formatTimeShort(attendance.shift_time_end);

            $('#modalAttendance .attendance-date').text(formateDateFull(attendance.date_attendance));

            $('#modalAttendance .employee-name').text(employee.name);
            $('#modalAttendance .employee-shift').text(employeeShift);

            $('#modalAttendance .attendance-late').text(formatTimeShort(attendance.time_late)).removeClass('text-danger');

            if (attendance.time_late != null && attendance.time_late != '00:00:00') {
                $('#modalAttendance .attendance-late').addClass('text-danger');
            }

            $('#modalAttendance .attendance-checkin').text(formatTimeShort(attendance.time_in));
            $('#modalAttendance .attendance-checkout').text(formatTimeShort(attendance.time_out));
            $('#modalAttendance .attendance-work-duration').text(formatTimeShort(attendance.total_work_duration));

            modalAttendance.show();
        }
    });
}

$('#btn-download-xlsx').on('click', function () {
    const department = 'all';
    const division = 'all';

    window.location.href = `${appUrl}/weekdays_off/export/weekday_off_${department}_${division}.xlsx`;
});
