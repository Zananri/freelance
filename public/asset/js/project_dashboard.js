// Dashboard Project: dynamic chart and timeline (mirrors project page behavior)
(function () {
    const appUrl = (document.querySelector('meta[name="app-url"]')?.getAttribute('content') || '').replace(/\/$/, '');
    // State
    let chartInstance = null;
    let projectsCache = [];

    let currentMonthProject = new Date().getMonth(); // 0-11
    let currentYearProject = new Date().getFullYear();
    let currentWeekProject = 0; // 0-3

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
    const CHART_COLORS = ["#E8E9F2", "#4fc97a", "#5a9be6", "#ff6b6b"]; // Not Started, Complete, On Progress, Late
    const TIMELINE_COLORS = ["color1", "color2", "color3", "color4"]; // CSS classes

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

    function updateChartAndLabels(projects) {
        projects = Array.isArray(projects) ? projects : [];

        let total = projects.length;
        let complete = 0;
        let onProgress = 0;
        let late = 0;
        let notStarted = 0;

        projects.forEach((p) => {
            const tc = p.task_counts || {};
            const tTotal = tc.total || 0;
            const tCompleted = tc.completed || 0;
            const tInProgress = tc.in_progress || 0;
            const tRejected = tc.rejected || 0;
            const tLate = tc.late || 0;

            if (tLate > 0) late += 1;
            else if (tTotal > 0 && tCompleted === tTotal) complete += 1;
            else if (tInProgress > 0 || tRejected > 0) onProgress += 1;
            else notStarted += 1;
        });

        // Update labels under chart: Total, Complete, On Progress, Late (in that order)
        try {
            const blocks = document.querySelectorAll(".chart-labels .text-center");
            if (blocks && blocks.length >= 4) {
                const nums = [total, complete, onProgress, late];
                blocks.forEach((el, idx) => {
                    const numSpan = el.querySelector("span:first-child");
                    if (numSpan) numSpan.textContent = String(nums[idx] || 0);
                });
            }
        } catch (e) {}

        // Update chart: slices order Not Started, Complete, On Progress, Late
        if (chartInstance) {
            if (total === 0) {
                chartInstance.data.labels = ["No Data"]; 
                chartInstance.data.datasets[0].data = [1];
                chartInstance.data.datasets[0].backgroundColor = [CHART_COLORS[0]];
            } else {
                chartInstance.data.labels = [
                    "Not Started",
                    "Complete",
                    "On Progress",
                    "Late",
                ];
                chartInstance.data.datasets[0].data = [
                    notStarted,
                    complete,
                    onProgress,
                    late,
                ];
                chartInstance.data.datasets[0].backgroundColor = CHART_COLORS;
            }
            try { chartInstance.update(); } catch (e) {}
        }
    }

    // Build timeline data from projects
    function buildTimelineData(projects) {
        const list = [];
        if (!Array.isArray(projects)) return list;

        projects.forEach((p, idx) => {
            const name = p.title || `Project ${p.id || idx + 1}`;
            const color = TIMELINE_COLORS[idx % TIMELINE_COLORS.length];

            function parseLocal(d) {
                const s = (d || "").toString().trim();
                if (!s) return null;
                const m = s.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
                if (m) return new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10));
                return new Date(s);
            }

            let start = parseLocal(p.start_date) || new Date();
            let due = parseLocal(p.due_date) || new Date(start);
            start.setHours(0, 0, 0, 0);
            due.setHours(23, 59, 59, 999);

            list.push({ name, start, due, color });
        });

        return list;
    }

    function getWeekStart(year, month, weekIndex) {
        const firstOfMonth = new Date(year, month, 1);
        const weekStartDate = new Date(firstOfMonth);
        weekStartDate.setDate(weekStartDate.getDate() + weekIndex * 7);
        // set to Monday
        while (weekStartDate.getDay() !== 1) {
            weekStartDate.setDate(weekStartDate.getDate() - 1);
        }
        weekStartDate.setHours(0, 0, 0, 0);
        return weekStartDate;
    }

    function diffDaysUTC(a, b) {
        const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
        const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
        return Math.floor((utcA - utcB) / (1000 * 60 * 60 * 24));
    }

    function renderTimeline(targetRows = "#timelineRows", targetTitle = "#timelineTitle") {
        // Title
        $(targetTitle).text(`${months[currentMonthProject]} week ${currentWeekProject + 1}`);

        const $rows = $(targetRows);
        if (!$rows.length) return;
        $rows.empty();

        const weekStart = getWeekStart(currentYearProject, currentMonthProject, currentWeekProject);

        const data = buildTimelineData(projectsCache);
        data.forEach((proj) => {
            // Build a 7-day row container
            const $row = $("<div>")
                .addClass("timeline-row d-flex")
                .css("position", "relative");

            for (let i = 0; i < 7; i++) {
                $row.append($("<div>").addClass("timeline-cell").css("position", "relative"));
            }

            const rawStart = diffDaysUTC(proj.start, weekStart);
            const rawEnd = diffDaysUTC(proj.due, weekStart);
            const startIdx = Math.max(0, rawStart);
            const endIdx = Math.min(6, rawEnd);

            if (endIdx >= 0 && startIdx <= 6 && startIdx <= endIdx) {
                const barLeft = startIdx * (100 / 7);
                const barWidth = (endIdx - startIdx + 1) * (100 / 7);
                const $bar = $("<div>")
                    .addClass(`timeline-bar ${proj.color}`)
                    .css({
                        left: `${barLeft}%`,
                        width: `${barWidth}%`,
                        position: "absolute",
                        top: "50%",
                        transform: "translateY(-50%)",
                        border: "none",
                    })
                    .attr("title", `${proj.name}`)
                    .html(`<span class="circle border-0 ${proj.color}"></span>${proj.name}`);

                $row.append($bar);
            }

            $rows.append($row);
        });
    }

    async function fetchProjectsAndRender() {
        try {
            const resp = await fetch(appUrl + "/project/index");
            const json = await resp.json();
            const projects = Array.isArray(json) ? json : (Array.isArray(json.data) ? json.data : []);
            // If start/due dates are missing, fetch details in parallel to enrich
            const needsDetail = projects.filter(p => !(p.start_date && p.due_date));
            if (needsDetail.length) {
                await Promise.all(needsDetail.map(async (p) => {
                    try {
                        const r = await fetch(appUrl + "/project/" + p.id);
                        const d = await r.json();
                        const data = d.data || d;
                        if (data) {
                            p.start_date = p.start_date || data.start_date || data.start || data.startDate;
                            p.due_date = p.due_date || data.due_date || data.due || data.end_date || data.endDate;
                        }
                    } catch (_) { /* ignore */ }
                }));
            }
            projectsCache = projects;
            updateChartAndLabels(projectsCache);
            renderTimeline("#timelineRows", "#timelineTitle");
        } catch (e) {
            // fallback to zeros
            projectsCache = [];
            updateChartAndLabels(projectsCache);
            renderTimeline("#timelineRows", "#timelineTitle");
        }
    }

    // Init after DOM ready
    document.addEventListener("DOMContentLoaded", function () {
        const ctx = document.getElementById("doughnutChart");
        if (ctx) chartInstance = createChart(ctx);

        // Initial render (will update after fetch)
        updateChartAndLabels([]);
        renderTimeline("#timelineRows", "#timelineTitle");

        // Navigation buttons
        $("#prevTimeline").on("click", function () {
            if (currentWeekProject > 0) {
                currentWeekProject--;
            } else {
                currentMonthProject--;
                if (currentMonthProject < 0) {
                    currentMonthProject = 11;
                    currentYearProject--;
                }
                currentWeekProject = 3;
            }
            renderTimeline("#timelineRows", "#timelineTitle");
        });

        $("#nextTimeline").on("click", function () {
            if (currentWeekProject < 3) {
                currentWeekProject++;
            } else {
                currentMonthProject++;
                if (currentMonthProject > 11) {
                    currentMonthProject = 0;
                    currentYearProject++;
                }
                currentWeekProject = 0;
            }
            renderTimeline("#timelineRows", "#timelineTitle");
        });

        // Toggle timeline (fix selector to dashboard DOM)
        $(document).on("click", ".toggle-timeline", function () {
            const $timelineCard = $(this).closest(".project-card").find(".timeline-card-mobile");
            $timelineCard.slideToggle();
            if ($timelineCard.is(":visible")) {
                renderTimeline("#timelineRows", "#timelineTitle");
            }
        });

        // Fetch and render
        fetchProjectsAndRender();
    });
})();

