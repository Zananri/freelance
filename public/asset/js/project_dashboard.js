// Dashboard Project: dynamic chart and timeline (mirrors project page behavior)
(function () {
    // unified alert helper (Settings style)
    function dashboardNotify(msg, type) {
        try {
            if (typeof window.showAlertMsg === "function") {
                // Always use light as requested
                window.showAlertMsg(String(msg || ""), "light", 2000);
                return;
            }
        } catch (_) {}
        // minimal fallback
        try {
            const el = document.createElement("div");
            el.className =
                "alert alert-" + (type === "error" ? "danger" : type || "info");
            Object.assign(el.style, {
                position: "fixed",
                right: "20px",
                bottom: "20px",
                zIndex: 9999,
                minWidth: "280px",
            });
            el.textContent = String(msg || "");
            document.body.appendChild(el);
            setTimeout(() => {
                el.style.opacity = "0";
                setTimeout(() => el.remove(), 400);
            }, 1600);
        } catch (_) {}
    }
    const appUrl = (
        document
            .querySelector('meta[name="app-url"]')
            ?.getAttribute("content") || ""
    ).replace(/\/$/, "");
    // State
    let chartInstance = null;
    let projectsCache = [];

    const today = new Date();
    let currentYearProject = today.getFullYear();
    let currentMonthProject = today.getMonth();
    let weeksCache = [];
    let currentWeekProject = 0;

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

    // Colors align with project page
    const CHART_COLORS = ["#E8E9F2", "#4fc97a", "#5a9be6", "#ff6b6b"];
    const TIMELINE_COLORS = ["color1", "color2", "color3", "color4"];
    let timelineData = [];

    function createChart(ctx) {
        if (!ctx || typeof Chart === "undefined") return null;
        return new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: ["Not Started", "Complete", "On Progress", "Late"],
                datasets: [
                    {
                        data: [1], // placeholder, replaced after fetch
                        backgroundColor: [CHART_COLORS[0]],
                        borderWidth: 0,
                    },
                ],
            },
            options: { cutout: "60%", plugins: { legend: { display: false } } },
        });
    }

    // Mirror logic from project.js -> updateProjectChartFromData
    function updateChartAndLabels(projects, chartCounts) {
        const numberOfProjects = Array.isArray(projects) ? projects.length : 0;

        let completed = Number(chartCounts?.completed || 0);
        let inProgress = Number(chartCounts?.in_progress || 0);
        let late = Number(chartCounts?.late || 0);
        let notStarted = Number(chartCounts?.not_started || 0);

        const chartData = [notStarted, completed, inProgress, late];
        const total = chartData.reduce((a, b) => a + b, 0);

        if (chartInstance) {
            if (total === 0) {
                chartInstance.data.labels = ["No Data"];
                chartInstance.data.datasets[0].data = [1];
                chartInstance.data.datasets[0].backgroundColor = [
                    CHART_COLORS[0],
                ];
            } else {
                chartInstance.data.labels = [
                    "Not Started",
                    "Complete",
                    "On Progress",
                    "Late",
                ];
                chartInstance.data.datasets[0].data = chartData;
                chartInstance.data.datasets[0].backgroundColor = CHART_COLORS;
            }
            try {
                chartInstance.update();
            } catch (_) {}
        }

        // Labels: Total (projects), Complete, On Progress, Late
        try {
            const spans = document.querySelectorAll(
                ".chart-labels .text-center span:first-child"
            );
            if (spans && spans.length >= 4) {
                spans[0].textContent = numberOfProjects; // project count (match project.js semantics)
                spans[1].textContent = completed;
                spans[2].textContent = inProgress;
                spans[3].textContent = late;
            }
        } catch (_) {}
    }

    function loadTimelineProjects(filter = null) {
        $.ajax({
            url: appUrl + "/project/index",
            type: "GET",
            dataType: "json",
            data: { task_scope: "me", filter: filter },
            beforeSend: function () {
                $(".loader").fadeIn("fast");
            },
            success: function (res) {
                const projects = Array.isArray(res)
                    ? res
                    : Array.isArray(res.data)
                    ? res.data
                    : [];

                const completeProjects = projects.filter(
                    (p) => (p.start_date || p.start) && (p.due_date || p.due)
                );
                const incompleteProjects = projects.filter(
                    (p) => !(p.start_date || p.start) || !(p.due_date || p.due)
                );

                try {
                    buildTimelineFromProjects(completeProjects);
                    renderTimeline(
                        "#timelineHeader",
                        "#timelineRows",
                        "week",
                        currentMonth,
                        currentYear,
                        currentWeek
                    );
                } catch (e) {
                    console.error("timeline build/render error", e);
                }

                if (incompleteProjects.length > 0) {
                    incompleteProjects.forEach((p) => {
                        $.ajax({
                            url: appUrl + "/project/" + p.id,
                            type: "GET",
                            dataType: "json",
                            success: function (resp) {
                                const data = resp.data || resp;
                                p.start_date =
                                    p.start_date ||
                                    data.start_date ||
                                    data.start;
                                p.due_date =
                                    p.due_date || data.due_date || data.due;

                                try {
                                    const updatedProjects =
                                        completeProjects.concat(
                                            incompleteProjects
                                        );
                                    buildTimelineFromProjects(updatedProjects);
                                    renderTimeline(
                                        "#timelineHeader",
                                        "#timelineRows",
                                        "week",
                                        currentMonth,
                                        currentYear,
                                        currentWeek
                                    );
                                } catch (e) {
                                    console.error("timeline update error", e);
                                }
                            },
                            error: function (err) {
                                console.warn(
                                    "failed to fetch project detail for",
                                    p.id,
                                    err
                                );
                            },
                        });
                    });
                }

                $(".loader").fadeOut("fast");
            },
            error: function () {
                console.error("Failed to load timeline projects");
                $(".loader").fadeOut("fast");
            },
        });
    }

    function buildTimelineFromProjects(projects) {
        timelineData = [];
        if (!Array.isArray(projects)) return;

        projects.forEach((p, idx) => {
            function parseLocal(dateStr, fallback) {
                const src = (dateStr || "").toString().trim();
                if (!src) {
                    if (fallback) return parseLocal(fallback);
                    return null;
                }
                const m = src.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
                if (m) {
                    const y = parseInt(m[1], 10);
                    const mon = parseInt(m[2], 10) - 1;
                    const d = parseInt(m[3], 10);
                    return new Date(y, mon, d);
                }
                return new Date(src);
            }

            let start = p.start_date ? parseLocal(p.start_date) : new Date();
            let due = p.due_date
                ? parseLocal(p.due_date, p.start_date)
                : new Date(start);
            if (start) start.setHours(0, 0, 0, 0);
            if (due) due.setHours(23, 59, 59, 999);

            timelineData.push({
                id: p.id,
                name: p.title || `Project ${p.id || idx + 1}`,
                start_date: start,
                due_date: due,
                color: TIMELINE_COLORS[idx % TIMELINE_COLORS.length],
            });
        });
    }

    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    let currentWeek = (function () {
        const today = new Date();
        const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const offset = firstOfMonth.getDay() === 0 ? 6 : firstOfMonth.getDay() - 1;
        return Math.ceil((today.getDate() + offset) / 7) - 1;
    })();

    function getCalendarWeeks(year, month) {
        const firstOfMonth = new Date(year, month, 1);
        const lastOfMonth = new Date(year, month + 1, 0);

        let firstMonday = new Date(firstOfMonth);
        while (firstMonday.getDay() !== 1) {
            firstMonday.setDate(firstMonday.getDate() - 1);
        }

        const weeks = [];
        let start = new Date(firstMonday);
        while (start <= lastOfMonth || start.getMonth() === month) {
            const end = new Date(start);
            end.setDate(start.getDate() + 6);
            weeks.push({ start, end });
            start = new Date(start);
            start.setDate(start.getDate() + 7);
        }
        return weeks;
    }

    function getWeekOfDate(date, weeks) {
        return weeks.findIndex((w) => date >= w.start && date <= w.end);
    }

    function renderTimeline(
        targetHeaderSelector,
        targetRowsSelector,
        mode = "week",
        month = null,
        year = null,
        weekIndex = null
    ) {
        const headerRow = document.querySelector(targetHeaderSelector);
        const rowsContainer = document.querySelector(targetRowsSelector);
        if (!headerRow || !rowsContainer) return;

        headerRow.innerHTML = "";
        rowsContainer.innerHTML = "";

        month = month ?? new Date().getMonth();
        year = year ?? new Date().getFullYear();

        if (mode === "month") {
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            for (let d = 1; d <= daysInMonth; d++) {
                const th = document.createElement("th");
                th.textContent = d;
                headerRow.appendChild(th);
            }

            timelineData.forEach((proj) => {
                const startDay = Math.max(
                    1,
                    proj.start_date.getMonth() === month
                        ? proj.start_date.getDate()
                        : 1
                );
                const endDay = Math.min(
                    daysInMonth,
                    proj.due_date.getMonth() === month
                        ? proj.due_date.getDate()
                        : daysInMonth
                );
                if (
                    proj.start_date.getMonth() > month ||
                    proj.due_date.getMonth() < month
                )
                    return;
                const tr = document.createElement("tr");
                for (let i = 1; i < startDay; i++)
                    tr.appendChild(document.createElement("td"));
                if (endDay >= startDay) {
                    const barTd = document.createElement("td");
                    barTd.colSpan = endDay - startDay + 1;
                    const titleText = `${
                        proj.name
                    } (${proj.start_date.toLocaleDateString()} → ${proj.due_date.toLocaleDateString()})`;
                    barTd.innerHTML = `<div class="timeline-bar ${proj.color}" data-project-id="${proj.id}" title="${titleText}"><span class="circle"></span> ${proj.name}</div>`;
                    tr.appendChild(barTd);
                }
                for (let i = endDay + 1; i <= daysInMonth; i++)
                    tr.appendChild(document.createElement("td"));
                rowsContainer.appendChild(tr);
            });
            const titleEl = document.getElementById("timelineModalTitle");
            if (titleEl) {
                titleEl.textContent = `Timeline ${months[month]} ${year}`;
            }
            return;
        }

        let totalCells = 7;
        const headerLabels = [
            "Mo",
            "Tu",
            "We",
            "Th",
            "Fr",
            "Sa",
            "Su",
        ];
        headerLabels.forEach((label) => {
            const th = document.createElement("th");
            th.textContent = label;
            headerRow.appendChild(th);
        });

        const weeks = getCalendarWeeks(year, month);
        if (weekIndex == null) {
            const today = new Date();
            weekIndex = getWeekOfDate(today, weeks);
            if (weekIndex < 0) weekIndex = 0;
        }

        const weekInfo = weeks[weekIndex];
        if (!weekInfo) return;

        let weekStartDate = weekInfo.start;
        let weekEndDate = weekInfo.end;

        const filteredProjects = timelineData.filter((proj) => {
            return (
                proj.start_date <= weekEndDate && proj.due_date >= weekStartDate
            );
        });

        filteredProjects.forEach((proj) => {
            const tr = document.createElement("tr");
            function diffDaysUTC(a, b) {
                const utcA = Date.UTC(
                    a.getFullYear(),
                    a.getMonth(),
                    a.getDate()
                );
                const utcB = Date.UTC(
                    b.getFullYear(),
                    b.getMonth(),
                    b.getDate()
                );
                return Math.floor((utcA - utcB) / (1000 * 60 * 60 * 24));
            }
            const rawStart = diffDaysUTC(proj.start_date, weekStartDate);
            const rawEnd = diffDaysUTC(proj.due_date, weekStartDate);
            const projStartIdx = Math.max(0, rawStart);
            const projEndIdx = Math.min(6, rawEnd);

            for (let i = 0; i < projStartIdx; i++)
                tr.appendChild(document.createElement("td"));

            if (projEndIdx >= projStartIdx) {
                const barTd = document.createElement("td");
                barTd.colSpan = projEndIdx - projStartIdx + 1;
                const titleText = `${
                    proj.name
                } (${proj.start_date.toLocaleDateString()} → ${proj.due_date.toLocaleDateString()})`;
                barTd.innerHTML = `<div class="timeline-bar ${proj.color}" data-project-id="${proj.id}" title="${titleText}"><span class="circle"></span><div class="bar-name">${proj.name}</div></div>`;
                tr.appendChild(barTd);
            }

            for (let i = projEndIdx + 1; i < totalCells; i++)
                tr.appendChild(document.createElement("td"));

            rowsContainer.appendChild(tr);
        });

        const titleEl = document.getElementById("timelineTitle");
        if (titleEl) {
            const monthShort = months[month];
            titleEl.textContent = `${monthShort} Week ${weekIndex + 1}`;
        }
    }

    document.getElementById("prevTimeline").addEventListener("click", () => {
        if (currentWeek > 0) {
            currentWeek--;
        } else {
            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear--;
            }
            const weeks = getCalendarWeeks(currentYear, currentMonth);
            currentWeek = weeks.length > 0 ? weeks.length - 1 : 0;
        }
        renderTimeline(
            "#timelineHeader",
            "#timelineRows",
            "week",
            currentMonth,
            currentYear,
            currentWeek
        );
    });

    document.getElementById("nextTimeline").addEventListener("click", () => {
        const weeks = getCalendarWeeks(currentYear, currentMonth);
        const maxWeek = weeks.length - 1;
        if (currentWeek < maxWeek) {
            currentWeek++;
        } else {
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
            currentWeek = 0;
        }
        renderTimeline(
            "#timelineHeader",
            "#timelineRows",
            "week",
            currentMonth,
            currentYear,
            currentWeek
        );
    });

    async function fetchProjectsAndRender() {
        function normalizeArray(json) {
            if (Array.isArray(json)) return json;
            if (json && Array.isArray(json.data)) return json.data;
            return [];
        }
        function extractTotal(json) {
            if (!json) return 0;
            if (
                json.pagination &&
                typeof json.pagination.total !== "undefined"
            ) {
                return Number(json.pagination.total || 0);
            }
            const arr = normalizeArray(json);
            return Array.isArray(arr) ? arr.length : 0;
        }
        try {
            // Parallel requests using the same endpoint as project filter to guarantee identical counts
            const cacheBuster = Date.now();
            const url = appUrl + "/project/get-all-projects";
            const base = new URLSearchParams({
                task_scope: "me",
                _cb: String(cacheBuster),
            });
            if (
                window.currentSearch &&
                String(window.currentSearch).trim() !== ""
            ) {
                base.set("search", String(window.currentSearch).trim());
            }
            if (
                typeof window.currentProjectId !== "undefined" &&
                window.currentProjectId
            ) {
                base.set("project_id", String(window.currentProjectId));
            }
            if (
                window.currentFilterDate &&
                String(window.currentFilterDate).trim() !== ""
            ) {
                base.set("date", String(window.currentFilterDate).trim());
            }
            const sortBySel = document.getElementById("filterSortBy");
            if (sortBySel && sortBySel.value)
                base.set("sort_by", sortBySel.value);

            const [totalRes, compRes, progRes, notRes, lateRes, tasksRes] =
                await Promise.all([
                    fetch(url + "?" + base.toString()),
                    fetch(
                        url +
                            "?" +
                            new URLSearchParams({
                                ...Object.fromEntries(base),
                                filter: "completed",
                            })
                    ),
                    fetch(
                        url +
                            "?" +
                            new URLSearchParams({
                                ...Object.fromEntries(base),
                                filter: "in_progress",
                            })
                    ),
                    fetch(
                        url +
                            "?" +
                            new URLSearchParams({
                                ...Object.fromEntries(base),
                                filter: "not_started",
                            })
                    ),
                    fetch(
                        url +
                            "?" +
                            new URLSearchParams({
                                ...Object.fromEntries(base),
                                filter: "late",
                            })
                    ),
                    fetch(
                        appUrl + "/task/index/no-pagination?_cb=" + cacheBuster
                    ),
                ]);

            const [
                totalJson,
                compJson,
                progJson,
                notJson,
                lateJson,
                tasksJson,
            ] = await Promise.all([
                totalRes.json(),
                compRes.json(),
                progRes.json(),
                notRes.json(),
                lateRes.json(),
                tasksRes.json(),
            ]);

            // Use totals derived from filter API
            const totalCount = extractTotal(totalJson);
            const completedCount = extractTotal(compJson);
            const inProgressCount = extractTotal(progJson);
            const notStartedCount = extractTotal(notJson);
            const lateCount = extractTotal(lateJson);

            const projects = normalizeArray(totalJson); // still used for timeline data enrichment

            // Enrich missing dates for timeline only
            const needsDetail = projects.filter(
                (p) => !(p.start_date && p.due_date)
            );
            if (needsDetail.length) {
                await Promise.all(
                    needsDetail.map(async (p) => {
                        try {
                            const r = await fetch(appUrl + "/project/" + p.id);
                            const d = await r.json();
                            const data = d.data || d;
                            if (data) {
                                p.start_date =
                                    p.start_date ||
                                    data.start_date ||
                                    data.start ||
                                    data.startDate;
                                p.due_date =
                                    p.due_date ||
                                    data.due_date ||
                                    data.due ||
                                    data.end_date ||
                                    data.endDate;
                            }
                        } catch (_) {}
                    })
                );
            }

            // Build tasks map and compute LATE per project (Dashboard logic)
            const buckets = tasksJson?.data || {};
            const tasksByProject = {};
            function collect(arr, statusName) {
                if (!Array.isArray(arr)) return;
                arr.forEach((t) => {
                    const pid =
                        t.project_id ||
                        t.projectId ||
                        (t.project && (t.project.id || t.project.project_id));
                    if (!pid) return;
                    if (!tasksByProject[pid]) tasksByProject[pid] = [];
                    tasksByProject[pid].push(
                        Object.assign({}, t, { __status: statusName })
                    );
                });
            }
            collect(buckets.not_started?.tasks, "not_started");
            collect(buckets.in_progress?.tasks, "in_progress");
            collect(buckets.completed?.tasks, "completed");
            collect(buckets.late?.tasks, "late");
            collect(buckets.rejected?.tasks, "rejected");
            collect(buckets.new_request?.tasks, "new_request");

            function parseDue(dateStr) {
                if (!dateStr) return null;
                const s = String(dateStr).trim();
                const m = s.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
                if (m)
                    return new Date(+m[1], +m[2] - 1, +m[3], 23, 59, 59, 999);
                const d = new Date(s);
                return isNaN(d.getTime()) ? null : d;
            }
            const derivedCounts = {
                total: totalCount,
                completed: completedCount,
                in_progress: inProgressCount,
                late: lateCount,
                not_started: notStartedCount,
            };

            // Debug logging
            console.log("Dashboard Filter Results:", derivedCounts);

            updateChartAndLabels(projects, derivedCounts);
            projectsCache = projects;
            renderTimeline(
                "#timelineHeader",
                "#timelineRows",
                "week",
                currentMonth,
                currentYear,
                currentWeek
            );
        } catch (e) {
            console.error("fetchProjectsAndRender error", e);
            projectsCache = [];
            updateChartAndLabels([], {
                completed: 0,
                in_progress: 0,
                late: 0,
                not_started: 0,
            });
            renderTimeline(
                "#timelineHeader",
                "#timelineRows",
                "week",
                currentMonth,
                currentYear,
                currentWeek
            );
        }
    }

    // Init after DOM ready
    document.addEventListener("DOMContentLoaded", function () {
        const ctx = document.getElementById("doughnutChart");
        if (ctx) chartInstance = createChart(ctx);

        // Calculate weeksCache and set currentWeekProject to current week index by default
        weeksCache = getCalendarWeeks(currentYearProject, currentMonthProject);
        currentWeekProject = getWeekOfDate(new Date(), weeksCache);
        if (currentWeekProject < 0) currentWeekProject = 0;

        // Initial render (will update after fetch)
        updateChartAndLabels([], {
            completed: 0,
            in_progress: 0,
            late: 0,
            not_started: 0,
        });
        renderTimeline(
            "#timelineHeader",
            "#timelineRows",
            "week",
            currentMonth,
            currentYear,
            currentWeek
        );
        $("#prevTimeline").on("click", function () {
            if (currentWeekProject > 0) {
                currentWeekProject--;
            } else {
                currentMonthProject--;
                if (currentMonthProject < 0) {
                    currentMonthProject = 11;
                    currentYearProject--;
                }
                weeksCache = getCalendarWeeks(
                    currentYearProject,
                    currentMonthProject
                );
                currentWeekProject = weeksCache.length - 1;
            }
            renderTimeline(
                "#timelineHeader",
                "#timelineRows",
                "week",
                currentMonth,
                currentYear,
                currentWeek
            );
        });

        $("#nextTimeline").on("click", function () {
            if (currentWeekProject < weeksCache.length - 1) {
                currentWeekProject++;
            } else {
                currentMonthProject++;
                if (currentMonthProject > 11) {
                    currentMonthProject = 0;
                    currentYearProject++;
                }
                weeksCache = getCalendarWeeks(
                    currentYearProject,
                    currentMonthProject
                );
                currentWeekProject = 0;
            }
            renderTimeline(
                "#timelineHeader",
                "#timelineRows",
                "week",
                currentMonth,
                currentYear,
                currentWeek
            );
        });

        // Toggle timeline (fix selector to dashboard DOM)
        $(document).on("click", ".toggle-timeline", function () {
            const $timelineCard = $(this)
                .closest(".project-card")
                .find(".timeline-card-mobile");
            $timelineCard.slideToggle();
            if ($timelineCard.is(":visible")) {
                renderTimeline(
                    "#timelineHeader",
                    "#timelineRows",
                    "week",
                    currentMonth,
                    currentYear,
                    currentWeek
                );
            }
        });

        fetchProjectsAndRender();
        loadTimelineProjects();
    });

    // Open Project Detail modal when clicking a timeline bar (reuse project page endpoint)
    document.addEventListener("click", async function (e) {
        const bar = e.target.closest(".timeline-bar[data-project-id]");
        if (!bar) return;
        const pid = bar.getAttribute("data-project-id");
        if (!pid) return;
        try {
            const r = await fetch(appUrl + "/project/" + pid);
            const response = await r.json();
            const data = response.data || {};
            // Fill fields in a shared Project Detail modal if exists on page
            const modalEl = document.getElementById("projectDetailModal");
            if (!modalEl) return; // dashboard might not include it
            const baseFileUrl = appUrl + "/file/project/";
            const imgEl = document.getElementById("projectDetailImage");
            if (imgEl) {
                imgEl.src = data.image
                    ? baseFileUrl + data.image
                    : appUrl + "/asset/img/background/add-image.png";
                imgEl.style.borderRadius = "8px";
            }
            const titleEl = document.getElementById("projectDetailTitle");
            if (titleEl) titleEl.textContent = data.title || "";
            const textSet = (id, v) => {
                const el = document.getElementById(id);
                if (el) el.textContent = v || "";
            };
            textSet(
                "projectDetailAuthor",
                (data.author && data.author.name) || "Unknown"
            );
            textSet("projectDetailDepartment", data.department);
            textSet("projectDetailDivision", data.division);
            textSet("projectDetailDescription", data.description);
            const refUrlEl = document.getElementById(
                "projectDetailReferenceUrl"
            );
            if (refUrlEl) {
                if (data.reference_url) {
                    refUrlEl.href = data.reference_url;
                    refUrlEl.textContent = data.reference_url;
                    refUrlEl.style.display = "";
                } else refUrlEl.style.display = "none";
            }
            const refFileEl = document.getElementById(
                "projectDetailReferenceFile"
            );
            if (refFileEl) {
                if (data.reference_file) {
                    refFileEl.href = baseFileUrl + data.reference_file;
                    refFileEl.style.display = "";
                } else refFileEl.style.display = "none";
            }
            const fmt = (s) =>
                s
                    ? new Date(s).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                      })
                    : "";
            textSet("projectDetailStartDate", fmt(data.start_date));
            textSet("projectDetailDueDate", fmt(data.due_date));
            textSet(
                "projectDetailCoAuthors",
                Array.isArray(data.co_authors) && data.co_authors.length
                    ? data.co_authors.map((a) => a.name).join(", ")
                    : "None"
            );
            textSet(
                "projectDetailContributors",
                Array.isArray(data.contributors) && data.contributors.length
                    ? data.contributors.map((a) => a.name).join(", ")
                    : "None"
            );

            new bootstrap.Modal(modalEl).show();
        } catch (_) {}
    });
})();
