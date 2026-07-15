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

    const start = new Date(
        today.getFullYear(),
        today.getMonth(),
        1
    );

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

    function showAlert(type, message) {
        const alert = $(
            `<div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>`,
        );
        $(".alert-delete-container").append(alert);
        setTimeout(() => alert.alert("close"), 4000);
    }

    function extractErrorMessage(xhr) {
        if (xhr.responseJSON && xhr.responseJSON.errors) {
            return Object.values(xhr.responseJSON.errors).flat().join("<br>");
        }
        if (xhr.responseJSON && xhr.responseJSON.message) {
            return xhr.responseJSON.message;
        }
        return "Something went wrong. Please try again.";
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
                        <div class="candidate-move-actions">
                            <button type="button" class="candidate-move-btn candidate-move-prev" data-id="${candidate.id}" data-target-status="${prevStatus || ""}" title="Move to ${prevStatus || "-"}" ${prevStatus ? "" : "disabled"}>
                                <span class="material-symbols-outlined">chevron_left</span>
                            </button>
                            <button type="button" class="candidate-move-btn candidate-move-next" data-id="${candidate.id}" data-target-status="${nextStatus || ""}" title="Move to ${nextStatus || "-"}" ${nextStatus ? "" : "disabled"}>
                                <span class="material-symbols-outlined">chevron_right</span>
                            </button>
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

    function loadJobOptions(selectedId = null) {
        return $.get(routes.jobs).done((jobs) => {
            const options = jobs
                .map((job) => `<option value="${job.id}">${job.job_name}</option>`)
                .join("");

            $("#candidateJobId").html(
                `<option value="">Select Position</option>${options}`
            );

            if (selectedId) {
                $("#candidateJobId").val(selectedId);
            }
        });
    }

    function loadCandidateOptions(selectedId) {
        return $.get(routes.candidates).done((candidates) => {
            const options = candidates.map(c => `
            <option value="${c.id}">
                ${c.candidates_name} (${c.job.job_name})
            </option>
            `).join("");
            $("#scheduleCandidateId").html(
                `<option value="">Select Candidate</option>${options}`,
            );
            if (selectedId) $("#scheduleCandidateId").val(selectedId);
        });
    }

    function resetCandidateForm() {
        $("#candidateForm")[0].reset();
        $("#candidateForm").data("mode", "create").data("id", null);
        $("#candidateModalLabel").text("Add Candidate");
        $("#deleteCandidateBtn").addClass("d-none");
    }

    function resetScheduleForm() {
        $("#scheduleForm")[0].reset();
        $("#scheduleForm").data("mode", "create").data("id", null);
        $("#scheduleModalLabel").text("Add Schedule");
        $("#deleteScheduleBtn").addClass("d-none");
    }

    function openCandidateModal(id) {
        resetCandidateForm();
        loadJobOptions();

        if (id) {
            $.get(`${routes.candidates}/${id}`).done((candidate) => {
                $("#candidateForm").data("mode", "edit").data("id", id);
                $("#candidateModalLabel").text("Edit Candidate");
                $("#deleteCandidateBtn").removeClass("d-none").data("id", id);
                $("#candidateName").val(candidate.name);
                $("#candidateEmail").val(candidate.email);
                $("#candidatePhone").val(candidate.phone);
                $("#candidateAddress").val(candidate.address);
                $("#candidateResumeLink").val(candidate.resume_link);
                $("#candidateStatus").val(candidate.status);
            });
        }


        $("#candidateModal").modal("show");
    }

    function openScheduleModal(id) {
        resetScheduleForm();

        $.when(loadJobOptions(), loadCandidateOptions()).done(() => {
            if (id) {
                $.get(`${routes.schedules}/${id}`).done((schedule) => {
                    $("#scheduleForm").data("mode", "edit").data("id", id);
                    $("#scheduleModalLabel").text("Edit Schedule");
                    $("#deleteScheduleBtn")
                        .removeClass("d-none")
                        .data("id", id);
                    $("#scheduleCandidateId").val(schedule.candidate_id);
                    $("#scheduleJobId").val(schedule.job_id);
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
                });
            }

            $("#scheduleModal").modal("show");
        });
    }

    function toDateTimeLocal(value) {
        const date = new Date(value);
        const pad = (n) => String(n).padStart(2, "0");
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }

    $("#addCandidateBtn").on("click", () => openCandidateModal());
    $("#addScheduleBtn").on("click", () => openScheduleModal());

    $(document).on("click", ".candidate-card", function () {
        openCandidateModal($(this).data("candidate-id"));
    });

    $(document).on("click", ".edit-schedule-btn", function () {
        openScheduleModal($(this).data("id"));
    });

    $("#candidateForm").on("submit", function (event) {
        event.preventDefault();

        const form = $(this);
        const mode = form.data("mode");
        const id = form.data("id");
        const payload = {
            job_id: $("#candidateJobId").val(),

            candidates_name: $("#candidateName").val(),
            candidates_email: $("#candidateEmail").val(),
            candidates_phone: $("#candidatePhone").val(),
            candidates_address: $("#candidateAddress").val(),

            gender: $("#candidateGender").val(),

            candidates_birthdate: $("#candidateBirthdate").val(),

            last_education: $("#candidateEducation").val(),

            experience_years: $("#candidateExperience").val(),

            expected_salary: $("#candidateSalary").val(),

            source: $("#candidateSource").val(),

            status: $("#candidateStatus").val(),
        };

        const request =
            mode === "edit"
                ? $.ajax({
                      url: `${routes.candidates}/${id}`,
                      method: "PUT",
                      data: payload,
                  })
                : $.post(routes.candidates, payload);

        request
            .done((response) => {
                showAlert("success", response.message);
                $("#candidateModal").modal("hide");
                refreshDashboard();
            })
            .fail((xhr) => showAlert("danger", extractErrorMessage(xhr)));
    });

    $("#scheduleForm").on("submit", function (event) {
        event.preventDefault();

        const form = $(this);
        const mode = form.data("mode");
        const id = form.data("id");
        const payload = {
            candidate_id: $("#scheduleCandidateId").val(),
            job_id: $("#scheduleJobId").val(),
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
                showAlert("success", response.message);
                $("#scheduleModal").modal("hide");
                refreshDashboard();
            })
            .fail((xhr) => showAlert("danger", extractErrorMessage(xhr)));
    });

    $("#deleteCandidateBtn").on("click", function () {
        const id = $(this).data("id");
        if (!id || !confirm("Delete this candidate?")) return;

        $.ajax({ url: `${routes.candidates}/${id}`, method: "DELETE" })
            .done((response) => {
                showAlert("success", response.message);
                $("#candidateModal").modal("hide");
                refreshDashboard();
            })
            .fail((xhr) => showAlert("danger", extractErrorMessage(xhr)));
    });

    $("#deleteScheduleBtn").on("click", function () {
        const id = $(this).data("id");
        if (!id || !confirm("Delete this schedule?")) return;

        $.ajax({ url: `${routes.schedules}/${id}`, method: "DELETE" })
            .done((response) => {
                showAlert("success", response.message);
                $("#scheduleModal").modal("hide");
                refreshDashboard();
            })
            .fail((xhr) => showAlert("danger", extractErrorMessage(xhr)));
    });

    $(document).on("click", ".delete-schedule-btn", function () {
        const id = $(this).data("id");
        if (!confirm("Delete this schedule?")) return;

        $.ajax({ url: `${routes.schedules}/${id}`, method: "DELETE" })
            .done((response) => {
                showAlert("success", response.message);
                refreshDashboard();
            })
            .fail((xhr) => showAlert("danger", extractErrorMessage(xhr)));
    });

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