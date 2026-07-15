$(function () {
    const routes = {
        data: "/recruitment/data",
        jobs: "/recruitment/jobs",
        candidates: "/candidates",
        schedules: "/schedules",
        calendar: "/recruitment/schedule-calendar",
        exportExcel: "/recruitment/export",
    };

    const today = new Date();

    const start = new Date(today.getFullYear(), today.getMonth(), 1);

    let selectedStart = formatDateID(start);
    let selectedEnd = formatDateID(today);

    let calendarViewDate = new Date();
    let calendarSchedules = [];
    let calendarCounts = {};
    let selectedDayDate = null;

    const statusColors = {
        Applied: { text: "#4A8CFF", bg: "#EAF3FF" },
        Screening: { text: "#8B5CF6", bg: "#F2ECFF" },
        Interview: { text: "#FF7A00", bg: "#FFF2E7" },
        "Tech Test": { text: "#F6B100", bg: "#FFF9DF" },
        Hired: { text: "#23C16B", bg: "#ECFFF5" },
        Rejected: { text: "#F44336", bg: "#FFF0F0" },
    };

    $.ajaxSetup({
        headers: {
            "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
        },
    });

    function showFloatingAlert(message, type = "success", delayMs = 2500) {
        try {
            if (typeof window.showAlertMsg === "function") {
                window.showAlertMsg(message, "light", delayMs);
                return;
            }
            const box = document.querySelector(
                ".box-alert-messages .box-message",
            );
            if (box && box.parentElement) {
                box.parentElement.style.display = "block";
                box.classList.remove("success", "warning", "error", "light");
                box.classList.add("light");
                box.innerHTML = message;
                setTimeout(() => {
                    if (typeof window.hideAlertMsg === "function") {
                        window.hideAlertMsg();
                    } else {
                        box.parentElement.style.display = "none";
                    }
                }, delayMs);
                return;
            }
        } catch (e) {
            /* no-op */
        }
        try {
            alert(
                typeof message === "string"
                    ? message.replace(/<[^>]+>/g, "")
                    : String(message),
            );
        } catch (e) {}
    }

    function getCurrentDateParams() {
        const value = $("#dateRange").val();

        if (!value) {
            return {
                start_date: selectedStart,
                end_date: selectedEnd,
            };
        }

        const dates = value.split(" to ");

        selectedStart = dates[0];
        selectedEnd = dates[1] ?? dates[0];

        return {
            start_date: selectedStart,
            end_date: selectedEnd,
        };
    }

    function renderPipeline(statuses, counts, candidatesByStatus) {
        const wrapper = $(".pipeline-wrapper").empty();

        statuses.forEach((status) => {
            const color = statusColors[status] || {
                text: "#333",
                bg: "#f5f5f5",
            };
            const candidates = candidatesByStatus[status] || [];
            const statusIndex = statuses.indexOf(status);
            const prevStatus = statuses[statusIndex - 1];
            const nextStatus = statuses[statusIndex + 1];

            const cards = candidates
                .map(
                    (candidate) => `
                    <div class="candidate-card" data-candidate-id="${candidate.id}">
                        <div class="candidate-avatar"></div>
                        <div class="candidate-info">
                            <div class="candidate-name">${candidate.candidate_name}</div>
                            <div class="candidate-position">${candidate.position}</div>
                        </div>
                        <div class="candidate-card-menu dropdown">
                            <button type="button" class="candidate-menu-btn" data-bs-toggle="dropdown" aria-expanded="false">
                                <span class="material-symbols-outlined">more_vert</span>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end candidate-dropdown-menu">
                                <li>
                                    <a class="dropdown-item candidate-action-next ${nextStatus ? "" : "disabled"}" href="#" data-id="${candidate.id}" data-target-status="${nextStatus || ""}">
                                        <span class="material-symbols-outlined">arrow_forward</span>
                                        Next${nextStatus ? `: ${nextStatus}` : ""}
                                    </a>
                                </li>
                                <li>
                                    <a class="dropdown-item candidate-action-prev ${prevStatus ? "" : "disabled"}" href="#" data-id="${candidate.id}" data-target-status="${prevStatus || ""}">
                                        <span class="material-symbols-outlined">arrow_back</span>
                                        Prev${prevStatus ? `: ${prevStatus}` : ""}
                                    </a>
                                </li>
                                <li>
                                    <hr class="dropdown-divider">
                                </li>
                                <li>
                                    <a class="dropdown-item candidate-action-edit" href="#" data-id="${candidate.id}">
                                        <span class="material-symbols-outlined">edit</span>
                                        Edit
                                    </a>
                                </li>
                                <li>
                                    <a class="dropdown-item text-danger candidate-action-delete" href="#" data-id="${candidate.id}">
                                        <span class="material-symbols-outlined">delete</span>
                                        Delete
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>`,
                )
                .join("");

            wrapper.append(`
                <div class="pipeline-column">
                    <div class="pipeline-card">
                        <div class="pipeline-header" style="background: ${color.bg}">
                            <div class="d-flex justify-content-between">
                                <span class="fw-semibold" style="color: ${color.text}">${status}</span>
                                <small style="color: ${color.text}">${counts[status] || 0}</small>
                            </div>
                        </div>
                        <div class="pipeline-body">
                            ${cards || '<div class="text-muted small">No candidates</div>'}
                        </div>
                    </div>
                </div>
            `);
        });
    }

    function renderScheduleList(schedules) {
        const list = $("#scheduleList").empty();
        $("#scheduleCount").text(schedules.length);

        if (!schedules.length) {
            $("#scheduleListWrapper").addClass("d-none");
            return;
        }

        $("#scheduleListWrapper").removeClass("d-none");

        schedules.forEach((schedule) => {
            list.append(`
                <li class="list-group-item d-flex justify-content-between align-items-start" data-schedule-id="${schedule.id}">
                    <div>
                        <div class="fw-semibold">${schedule.title}</div>
                        <div class="text-muted small">
                            ${schedule.schedule_type} • ${formatDateTime(schedule.time_start)} - ${formatTime(schedule.time_end)}
                        </div>
                    </div>
                    <div class="text-end d-flex align-items-center gap-2">
                        <small class="text-muted">${schedule.location || ""}</small>
                        <button type="button" class="btn btn-sm btn-link p-0 edit-schedule-btn" data-id="${schedule.id}">
                            <span class="material-symbols-outlined" style="font-size:16px;">edit</span>
                        </button>
                        <button type="button" class="btn btn-sm btn-link p-0 text-danger delete-schedule-btn" data-id="${schedule.id}">
                            <span class="material-symbols-outlined" style="font-size:16px;">delete</span>
                        </button>
                    </div>
                </li>
            `);
        });
    }

    function formatDateTime(value) {
        const date = new Date(value);
        return (
            date.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }) +
            " " +
            formatTime(value)
        );
    }

    function formatTime(value) {
        const date = new Date(value);
        return date.toTimeString().slice(0, 5);
    }

    function toISODateStr(date) {
        const pad = (n) => String(n).padStart(2, "0");
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    }

    function switchModal(fromSelector, callback) {
        $(fromSelector).one("hidden.bs.modal", function () {
            callback();
        });
        $(fromSelector).modal("hide");
    }

    function refreshDashboard(params) {
        return $.get(routes.data, params || getCurrentDateParams()).done(
            (data) => {
                selectedStart = data.selected_start;
                selectedEnd = data.selected_end;
                $("#totalEmployeesValue").text(data.totalEmployees ?? 0);
                $("#totalSchedulesValue").text(data.schedules.length ?? 0);

                renderPipeline(
                    data.pipeline_statuses,
                    data.pipeline_counts,
                    data.pipeline_candidates,
                );
                renderScheduleList(data.schedules);
                updateDateLabel();

                if (window.RecruitmentCharts) {
                    window.RecruitmentCharts.render({
                        employees: data.chart_employees,
                        positions: data.chart_positions,
                        applicants: data.chart_applicants,
                        schedules: data.chart_schedules,
                        overviewLabels: data.overview_labels,
                        overviewData: data.overview_data,
                    });
                }
            },
        );
    }

    function updateDateLabel() {
        const start = new Date(selectedStart);
        const end = new Date(selectedEnd);

        const option = {
            day: "2-digit",
            month: "short",
            year: "numeric",
        };

        $("#dateFilterLabel").text(
            `${start.toLocaleDateString("en-GB", option)} - ${end.toLocaleDateString("en-GB", option)}`,
        );
    }

    function loadJobOptions(targetSelector, selectedId = null) {
        return $.get(routes.jobs).done((jobs) => {
            const options = jobs
                .map(
                    (job) =>
                        `<option value="${job.id}">${job.job_name}</option>`,
                )
                .join("");

            $(targetSelector).html(
                `<option value="">Select Position</option>${options}`,
            );

            if (selectedId) {
                $(targetSelector).val(selectedId);
            }
        });
    }

    function loadCandidateOptions(selectedId = null) {
        return $.get(routes.candidates).done((candidates) => {

            const options = candidates.map(candidate => `
                <option value="${candidate.id}">
                    ${candidate.candidates_name} - ${candidate.job?.job_name ?? "-"}
                </option>
            `).join("");

            $("#scheduleCandidateId").html(
                `<option value="">Select Candidate</option>${options}`
            );

            if (selectedId) {
                $("#scheduleCandidateId").val(selectedId);
            }
        });
    }

    function resetScheduleForm() {
        $("#scheduleForm")[0].reset();
        $("#scheduleForm").data("mode", "create").data("id", null);
        $("#scheduleModalLabel").text("Add Schedule");
        $("#deleteScheduleBtn").addClass("d-none");
    }

    function openAddCandidateModal() {
        $("#candidateAddForm")[0].reset();
        loadJobOptions("#addCandidateJobId");
        $("#candidateAddModal").modal("show");
    }

    function openEditCandidateModal(id) {
        if (!id) return;

        $.get(`${routes.candidates}/${id}`)
            .done((candidate) => {
                loadJobOptions("#editCandidateJobId", candidate.job_id).done(
                    () => {
                        $("#candidateEditForm").data("id", id);
                        $("#editCandidateName").val(candidate.candidates_name);
                        $("#editCandidateEmail").val(
                            candidate.candidates_email,
                        );
                        $("#editCandidatePhone").val(
                            candidate.candidates_phone,
                        );
                        $("#editCandidateAddress").val(
                            candidate.candidates_address,
                        );
                        $("#editCandidateGender").val(candidate.gender);
                        $("#editCandidateBirthdate").val(
                            candidate.candidates_birthdate
                                ? candidate.candidates_birthdate.slice(0, 10)
                                : "",
                        );
                        $("#editCandidateEducation").val(
                            candidate.last_education,
                        );
                        $("#editCandidateExperience").val(
                            candidate.experience_years,
                        );
                        $("#editCandidateSalary").val(
                            candidate.expected_salary,
                        );
                        $("#editCandidateSource").val(candidate.source);
                        $("#editCandidateStatus").val(candidate.status);

                        $("#candidateEditModal").modal("show");
                    },
                );
            })
            .fail((xhr) =>
                showFloatingAlert("Something went wrong, please try again"),
            );
    }

    function openConfirmDeleteCandidate(id) {
        $("#confirmDeleteCandidateBtn").data("id", id);
        $("#confirmDeleteCandidateModal").modal("show");
    }

    function moveCandidateStatus(id, targetStatus) {
        if (!id || !targetStatus) return;

        $.get(`${routes.candidates}/${id}`)
            .done((candidate) => {
                const payload = {
                    job_id: candidate.job_id,
                    candidates_name: candidate.candidates_name,
                    candidates_email: candidate.candidates_email,
                    candidates_phone: candidate.candidates_phone,
                    candidates_address: candidate.candidates_address,
                    gender: candidate.gender,
                    candidates_birthdate: candidate.candidates_birthdate,
                    last_education: candidate.last_education,
                    experience_years: candidate.experience_years,
                    expected_salary: candidate.expected_salary,
                    source: candidate.source,
                    status: targetStatus,
                };

                $.ajax({
                    url: `${routes.candidates}/${id}`,
                    method: "PUT",
                    data: payload,
                })
                    .done((response) => {
                        showFloatingAlert(`Candidate moved to ${targetStatus}`);
                        refreshDashboard();
                    })
                    .fail((xhr) =>
                        showFloatingAlert(
                            "Something went wrong please try again",
                        ),
                    );
            })
            .fail((xhr) =>
                showFloatingAlert("Something went wrong please try again"),
            );
    }

    function openScheduleModal(id, presetDate) {
        resetScheduleForm();

        loadCandidateOptions().done(() => {
            if (id) {
                $.get(`${routes.schedules}/${id}`).done((schedule) => {
                    $("#scheduleForm").data("mode", "edit").data("id", id);
                    $("#scheduleModalLabel").text("Edit Schedule");

                    $("#deleteScheduleBtn")
                        .removeClass("d-none")
                        .data("id", id);

                    $("#scheduleCandidateId").val(schedule.candidate_id);
                    $("#scheduleType").val(schedule.schedule_type);
                    $("#scheduleTitle").val(schedule.title);
                    $("#scheduleDescription").val(schedule.description);
                    $("#scheduleLocation").val(schedule.location);
                    $("#scheduleTimeStart").val(
                        toDateTimeLocal(schedule.time_start),
                    );
                    $("#scheduleTimeEnd").val(
                        toDateTimeLocal(schedule.time_end),
                    );
                    $("#scheduleMeetingLink").val(schedule.meeting_link);

                    $("#scheduleModal").modal("show");
                });

                return;
            }

            if (presetDate) {
                $("#scheduleTimeStart").val(`${presetDate}T09:00`);
                $("#scheduleTimeEnd").val(`${presetDate}T10:00`);
            }

            $("#scheduleModal").modal("show");
        });
    }

    function toDateTimeLocal(value) {
        const date = new Date(value);
        const pad = (n) => String(n).padStart(2, "0");
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }

    function loadCalendarMonth(date) {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;

        return $.get(routes.calendar, { year, month }).done((data) => {
            calendarSchedules = data.schedules || [];
            calendarCounts = data.counts || {};
            renderCalendarGrid(date);
        });
    }

    function renderCalendarGrid(date) {
        const year = date.getFullYear();
        const month = date.getMonth();
        const monthLabel = date.toLocaleDateString("en-GB", {
            month: "long",
            year: "numeric",
        });
        $("#calendarMonthLabel").text(monthLabel);

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const todayStr = toISODateStr(new Date());

        const grid = $("#calendarGrid").empty();

        for (let i = 0; i < firstDay; i++) {
            grid.append('<div class="calendar-day calendar-day-empty"></div>');
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = toISODateStr(new Date(year, month, day));
            const count = calendarCounts[dateStr] || 0;
            const isToday = dateStr === todayStr;

            grid.append(`
                <div class="calendar-day ${isToday ? "calendar-day-today" : ""} ${count ? "has-schedule" : ""}" data-date="${dateStr}">
                    <span class="calendar-day-number">${day}</span>
                    ${count ? '<span class="calendar-day-dot"></span>' : ""}
                </div>
            `);
        }
    }

    function renderScheduleListItems(targetSelector, schedules, showDate) {
        const body = $(targetSelector).empty();

        if (!schedules.length) {
            body.append(
                '<li class="list-group-item text-muted small border-0">No schedules found.</li>',
            );
            return;
        }

        schedules
            .slice()
            .sort((a, b) => new Date(a.time_start) - new Date(b.time_start))
            .forEach((s) => {
                const timeLabel = showDate
                    ? formatDateTime(s.time_start)
                    : `${formatTime(s.time_start)} - ${formatTime(s.time_end)}`;

                body.append(`
                    <li class="list-group-item schedule-list-card" data-id="${s.id}">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <div class="fw-semibold">${s.title}</div>
                                <div class="text-muted small">${s.candidate ? s.candidate.candidates_name : "-"} • ${s.job ? s.job.job_name : "-"}</div>
                            </div>
                            <span class="schedule-type-badge">${s.schedule_type}</span>
                        </div>
                        <div class="text-muted small mt-1">${timeLabel}</div>
                    </li>
                `);
            });
    }

    function openScheduleDayListModal(dateStr) {
        selectedDayDate = dateStr;
        const dateObj = new Date(`${dateStr}T00:00:00`);
        const label = dateObj.toLocaleDateString("en-GB", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
        $("#scheduleDayListTitle").text(label);

        const daySchedules = calendarSchedules.filter(
            (s) => toISODateStr(new Date(s.time_start)) === dateStr,
        );
        renderScheduleListItems("#scheduleDayListBody", daySchedules, false);
        $("#scheduleDayListModal").modal("show");
    }

    function openScheduleMonthListModal(date) {
        const label = date.toLocaleDateString("en-GB", {
            month: "long",
            year: "numeric",
        });
        $("#scheduleMonthListTitle").text(`Schedule List - ${label}`);
        $("#scheduleSearchModeGroup button").removeClass("active");
        $('#scheduleSearchModeGroup button[data-mode="monthly"]').addClass(
            "active",
        );
        $("#scheduleSearchDate").addClass("d-none").val("");
        $("#scheduleSearchKeyword").val("");
        applyMonthListFilter();
        $("#scheduleMonthListModal").modal("show");
    }

    function applyMonthListFilter() {
        const mode = $("#scheduleSearchModeGroup button.active").data("mode");
        const keyword = ($("#scheduleSearchKeyword").val() || "")
            .trim()
            .toLowerCase();
        const dateFilter = $("#scheduleSearchDate").val();

        let filtered = calendarSchedules;

        if (mode === "daily" && dateFilter) {
            filtered = filtered.filter(
                (s) => toISODateStr(new Date(s.time_start)) === dateFilter,
            );
        }

        if (keyword) {
            filtered = filtered.filter((s) => {
                const title = (s.title || "").toLowerCase();
                const candidateName = s.candidate
                    ? (s.candidate.candidates_name || "").toLowerCase()
                    : "";
                const jobName = s.job
                    ? (s.job.job_name || "").toLowerCase()
                    : "";

                return (
                    title.includes(keyword) ||
                    candidateName.includes(keyword) ||
                    jobName.includes(keyword)
                );
            });
        }

        renderScheduleListItems("#scheduleMonthListBody", filtered, true);
    }

    $("#addCandidateBtn").on("click", () => openAddCandidateModal());

    $(document).on("click", ".candidate-card-menu", function (e) {
        e.stopPropagation();
    });

    $(document).on("click", ".candidate-card", function () {
        openEditCandidateModal($(this).data("candidate-id"));
    });

    $(document).on(
        "click",
        ".candidate-action-next, .candidate-action-prev",
        function (e) {
            e.preventDefault();
            e.stopPropagation();
            if ($(this).hasClass("disabled")) return;
            moveCandidateStatus(
                $(this).data("id"),
                $(this).data("target-status"),
            );
        },
    );

    $(document).on("click", ".candidate-action-edit", function (e) {
        e.preventDefault();
        e.stopPropagation();
        openEditCandidateModal($(this).data("id"));
    });

    $(document).on("click", ".candidate-action-delete", function (e) {
        e.preventDefault();
        e.stopPropagation();
        openConfirmDeleteCandidate($(this).data("id"));
    });

    $(document).on("click", ".edit-schedule-btn", function () {
        openScheduleModal($(this).data("id"));
    });

    $("#candidateAddForm").on("submit", function (event) {
        event.preventDefault();

        const payload = {
            job_id: $("#addCandidateJobId").val(),
            candidates_name: $("#addCandidateName").val(),
            candidates_email: $("#addCandidateEmail").val(),
            candidates_phone: $("#addCandidatePhone").val(),
            candidates_address: $("#addCandidateAddress").val(),
            gender: $("#addCandidateGender").val(),
            candidates_birthdate: $("#addCandidateBirthdate").val(),
            last_education: $("#addCandidateEducation").val(),
            experience_years: $("#addCandidateExperience").val(),
            expected_salary: $("#addCandidateSalary").val(),
            source: $("#addCandidateSource").val(),
            status: $("#addCandidateStatus").val(),
        };

        $.post(routes.candidates, payload)
            .done((response) => {
                showFloatingAlert("success", response.message);
                $("#candidateAddModal").modal("hide");
                refreshDashboard();
            })
            .fail((xhr) =>
                showFloatingAlert("Something went wrong please try again"),
            );
    });

    $("#candidateEditForm").on("submit", function (event) {
        event.preventDefault();

        const id = $(this).data("id");
        const payload = {
            job_id: $("#editCandidateJobId").val(),
            candidates_name: $("#editCandidateName").val(),
            candidates_email: $("#editCandidateEmail").val(),
            candidates_phone: $("#editCandidatePhone").val(),
            candidates_address: $("#editCandidateAddress").val(),
            gender: $("#editCandidateGender").val(),
            candidates_birthdate: $("#editCandidateBirthdate").val(),
            last_education: $("#editCandidateEducation").val(),
            experience_years: $("#editCandidateExperience").val(),
            expected_salary: $("#editCandidateSalary").val(),
            source: $("#editCandidateSource").val(),
            status: $("#editCandidateStatus").val(),
        };

        $.ajax({
            url: `${routes.candidates}/${id}`,
            method: "PUT",
            data: payload,
        })
            .done((response) => {
                showFloatingAlert("success", response.message);
                $("#candidateEditModal").modal("hide");
                refreshDashboard();
            })
            .fail((xhr) =>
                showFloatingAlert("Something went wrong please try again"),
            );
    });

    $("#editCandidateDeleteBtn").on("click", function () {
        const id = $("#candidateEditForm").data("id");
        switchModal("#candidateEditModal", () =>
            openConfirmDeleteCandidate(id),
        );
    });

    $("#confirmDeleteCandidateBtn").on("click", function () {
        const id = $(this).data("id");
        if (!id) return;

        $.ajax({ url: `${routes.candidates}/${id}`, method: "DELETE" })
            .done((response) => {
                showFloatingAlert("success", response.message);
                $("#confirmDeleteCandidateModal").modal("hide");
                refreshDashboard();
            })
            .fail((xhr) => {
                $("#confirmDeleteCandidateModal").modal("hide");
                showFloatingAlert("Something went wrong please try again");
            });
    });

    $("#scheduleForm").on("submit", function (event) {
        event.preventDefault();

        const form = $(this);
        const mode = form.data("mode");
        const id = form.data("id");
        const payload = {
            candidate_id: $("#scheduleCandidateId").val(),
            schedule_type: $("#scheduleType").val(),
            title: $("#scheduleTitle").val(),
            description: $("#scheduleDescription").val(),
            location: $("#scheduleLocation").val(),
            time_start: $("#scheduleTimeStart").val(),
            time_end: $("#scheduleTimeEnd").val(),
            meeting_link: $("#scheduleMeetingLink").val(),
        };

        const request =
            mode === "edit"
                ? $.ajax({
                      url: `${routes.schedules}/${id}`,
                      method: "PUT",
                      data: payload,
                  })
                : $.post(routes.schedules, payload);

        request
            .done((response) => {
                showFloatingAlert("success", response.message);
                $("#scheduleModal").modal("hide");
                refreshDashboard();
            })
            .fail((xhr) =>
                showFloatingAlert("Something went wrong please try again"),
            );
    });

    $("#deleteScheduleBtn").on("click", function () {
        const id = $(this).data("id");
        if (!id || !confirm("Delete this schedule?")) return;

        $.ajax({ url: `${routes.schedules}/${id}`, method: "DELETE" })
            .done((response) => {
                showFloatingAlert("success", response.message);
                $("#scheduleModal").modal("hide");
                refreshDashboard();
            })
            .fail((xhr) =>
                showFloatingAlert("Something went wrong please try again"),
            );
    });

    $(document).on("click", ".delete-schedule-btn", function () {
        const id = $(this).data("id");
        if (!confirm("Delete this schedule?")) return;

        $.ajax({ url: `${routes.schedules}/${id}`, method: "DELETE" })
            .done((response) => {
                showFloatingAlert("success", response.message);
                refreshDashboard();
            })
            .fail((xhr) =>
                showFloatingAlert("Something went wrong please try again"),
            );
    });

    $("#openScheduleCalendarBtn").on("click", function () {
        calendarViewDate = new Date();
        loadCalendarMonth(calendarViewDate).done(() => {
            $("#scheduleCalendarModal").modal("show");
        });
    });

    $("#calendarPrevMonth").on("click", function () {
        calendarViewDate = new Date(
            calendarViewDate.getFullYear(),
            calendarViewDate.getMonth() - 1,
            1,
        );
        loadCalendarMonth(calendarViewDate);
    });

    $("#calendarNextMonth").on("click", function () {
        calendarViewDate = new Date(
            calendarViewDate.getFullYear(),
            calendarViewDate.getMonth() + 1,
            1,
        );
        loadCalendarMonth(calendarViewDate);
    });

    $(document).on(
        "click",
        "#calendarGrid .calendar-day:not(.calendar-day-empty)",
        function () {
            const dateStr = $(this).data("date");
            switchModal("#scheduleCalendarModal", () =>
                openScheduleDayListModal(dateStr),
            );
        },
    );

    $("#openMonthListBtn").on("click", function () {
        const viewDate = calendarViewDate;
        switchModal("#scheduleCalendarModal", () =>
            openScheduleMonthListModal(viewDate),
        );
    });

    $("#scheduleDayAddBtn").on("click", function () {
        const presetDate = selectedDayDate;
        switchModal("#scheduleDayListModal", () =>
            openScheduleModal(null, presetDate),
        );
    });

    $(document).on("click", ".schedule-list-card", function () {
        const id = $(this).data("id");
        const modalId = "#" + $(this).closest(".modal").attr("id");
        switchModal(modalId, () => openScheduleModal(id));
    });

    $("#scheduleSearchModeGroup button").on("click", function () {
        $("#scheduleSearchModeGroup button").removeClass("active");
        $(this).addClass("active");

        if ($(this).data("mode") === "daily") {
            $("#scheduleSearchDate").removeClass("d-none");
        } else {
            $("#scheduleSearchDate").addClass("d-none");
        }

        applyMonthListFilter();
    });

    $("#scheduleSearchDate, #scheduleSearchKeyword").on(
        "input change",
        applyMonthListFilter,
    );

    $("#dateFilterForm").on("click", function (e) {
        e.stopPropagation();
    });

    const fp = flatpickr("#dateRange", {
        mode: "range",

        dateFormat: "d-m-Y",

        defaultDate: [selectedStart, selectedEnd],

        onClose() {
            refreshDashboard();
        },
    });

    $("#dateFilterToggle").on("click", function () {
        fp.open();
    });

    $("#generateReportBtn").on("click", function () {
        const btn = $(this);
        const originalHtml = btn.html();
        const params = getCurrentDateParams();
        const query = $.param(params);

        btn.prop("disabled", true).html(
            `<span class="material-symbols-outlined me-2">hourglass_top</span><small>Generating...</small>`,
        );

        const url = `${routes.exportExcel}?${query}`;

        const iframe = document.createElement("iframe");
        iframe.style.display = "none";
        iframe.src = url;
        document.body.appendChild(iframe);

        setTimeout(() => {
            btn.prop("disabled", false).html(originalHtml);
            iframe.remove();
        }, 2000);
    });

    if (window.recruitmentChartData && window.RecruitmentCharts) {
        window.RecruitmentCharts.render(
            Object.assign(
                {},
                window.recruitmentChartData,
                window.recruitmentExtra,
            ),
        );
    }
    refreshDashboard();
});