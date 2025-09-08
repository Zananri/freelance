// Dashboard Project: dynamic chart and timeline (mirrors project page behavior)
(function () {
    // unified alert helper (Settings style)
    function dashboardNotify(msg, type) {
        try {
            if (typeof window.showAlertMsg === 'function') {
                // Always use light as requested
                window.showAlertMsg(String(msg || ''), 'light', 2000);
                return;
            }
        } catch(_) {}
        // minimal fallback
        try {
            const el = document.createElement('div');
            el.className = 'alert alert-' + (type === 'error' ? 'danger' : (type || 'info'));
            Object.assign(el.style, { position:'fixed', right:'20px', bottom:'20px', zIndex:9999, minWidth:'280px' });
            el.textContent = String(msg || '');
            document.body.appendChild(el);
            setTimeout(() => { el.style.opacity = '0'; setTimeout(()=> el.remove(), 400); }, 1600);
        } catch(_) {}
    }
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

    // Mirror logic from project.js -> updateProjectChartFromData
    function updateChartAndLabels(projects, chartCounts) {
        const numberOfProjects = Array.isArray(projects) ? projects.length : 0;

        let completed = Number(chartCounts?.completed || 0);
        let inProgress = Number(chartCounts?.in_progress || 0);
        let late = Number(chartCounts?.late || 0);
        let notStarted = Number(chartCounts?.not_started || 0);

        const chartData = [notStarted, completed, inProgress, late];
        const total = chartData.reduce((a,b)=>a+b,0);

        if (chartInstance) {
            if (total === 0) {
                chartInstance.data.labels = ["No Data"]; 
                chartInstance.data.datasets[0].data = [1];
                chartInstance.data.datasets[0].backgroundColor = [CHART_COLORS[0]];
            } else {
                chartInstance.data.labels = ["Not Started","Complete","On Progress","Late"]; 
                chartInstance.data.datasets[0].data = chartData;
                chartInstance.data.datasets[0].backgroundColor = CHART_COLORS;
            }
            try { chartInstance.update(); } catch(_) {}
        }

        // Labels: Total (projects), Complete, On Progress, Late
        try {
            const spans = document.querySelectorAll('.chart-labels .text-center span:first-child');
            if (spans && spans.length >= 4) {
                spans[0].textContent = numberOfProjects; // project count (match project.js semantics)
                spans[1].textContent = completed;
                spans[2].textContent = inProgress;
                spans[3].textContent = late;
            }
        } catch(_) {}
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

            list.push({ id: p.id, name, start, due, color });
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
                    .attr("data-project-id", proj.id || '')
                    .html(`<span class="circle border-0 ${proj.color}"></span>${proj.name}`);

                $row.append($bar);
            }

            $rows.append($row);
        });
    }

    async function fetchProjectsAndRender() {
        try {
            const url = appUrl + "/project/index?task_scope=me";
            const resp = await fetch(url);
            const json = await resp.json();
            const projects = Array.isArray(json) ? json : (Array.isArray(json.data) ? json.data : []);
            const chartCounts = json.chart_counts || null;

            // Enrich dates if missing
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
                    } catch(_) {}
                }));
            }

            const hasChartCounts = chartCounts && (
                Number(chartCounts.total||0) > 0 ||
                Number(chartCounts.completed||0) > 0 ||
                Number(chartCounts.in_progress||0) > 0 ||
                Number(chartCounts.late||0) > 0 ||
                Number(chartCounts.not_started||0) > 0
            );

            if (hasChartCounts) {
                updateChartAndLabels(projects, chartCounts);
            } else {
                // fallback fetch tasks aggregate as in project.js
                try {
                    const tResp = await fetch(appUrl + '/task/index/no-pagination');
                    const tJson = await tResp.json();
                    const d = tJson?.data || {};
                    const notStartedCount = Number(d?.not_started?.count ?? (Array.isArray(d?.not_started?.tasks) ? d.not_started.tasks.length : 0));
                    const inProgressCount = Number(d?.in_progress?.count ?? (Array.isArray(d?.in_progress?.tasks) ? d.in_progress.tasks.length : 0));
                    const completedCount = Number(d?.completed?.count ?? (Array.isArray(d?.completed?.tasks) ? d.completed.tasks.length : 0));
                    const lateCount = Number(d?.late?.count ?? (Array.isArray(d?.late?.tasks) ? d.late.tasks.length : 0));
                    const rejectedCount = Number(d?.rejected?.count ?? (Array.isArray(d?.rejected?.tasks) ? d.rejected.tasks.length : 0));
                    const derived = {
                        total: notStartedCount + inProgressCount + completedCount + rejectedCount,
                        completed: completedCount,
                        in_progress: inProgressCount,
                        late: lateCount,
                        not_started: notStartedCount,
                    };
                    updateChartAndLabels(projects, derived);
                } catch(_) {
                    updateChartAndLabels(projects, {completed:0,in_progress:0,late:0,not_started:0});
                }
            }

            projectsCache = projects;
            renderTimeline("#timelineRows", "#timelineTitle");
        } catch(_) {
            projectsCache = [];
            updateChartAndLabels([], {completed:0,in_progress:0,late:0,not_started:0});
            renderTimeline("#timelineRows", "#timelineTitle");
        }
    }

    // Init after DOM ready
    document.addEventListener("DOMContentLoaded", function () {
        const ctx = document.getElementById("doughnutChart");
        if (ctx) chartInstance = createChart(ctx);

        // Initial render (will update after fetch)
    updateChartAndLabels([], {completed:0,in_progress:0,late:0,not_started:0});
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

    // Open Project Detail modal when clicking a timeline bar (reuse project page endpoint)
    document.addEventListener('click', async function (e) {
        const bar = e.target.closest('.timeline-bar[data-project-id]');
        if (!bar) return;
        const pid = bar.getAttribute('data-project-id');
        if (!pid) return;
        try {
            const r = await fetch(appUrl + '/project/' + pid);
            const response = await r.json();
            const data = response.data || {};
            // Fill fields in a shared Project Detail modal if exists on page
            const modalEl = document.getElementById('projectDetailModal');
            if (!modalEl) return; // dashboard might not include it
            const baseFileUrl = appUrl + '/file/project/';
            const imgEl = document.getElementById('projectDetailImage');
            if (imgEl) {
                imgEl.src = data.image ? (baseFileUrl + data.image) : (appUrl + '/asset/img/background/add-image.png');
                imgEl.style.borderRadius = '8px';
            }
            const titleEl = document.getElementById('projectDetailTitle');
            if (titleEl) titleEl.textContent = data.title || '';
            const textSet = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v || ''; };
            textSet('projectDetailAuthor', (data.author && data.author.name) || 'Unknown');
            textSet('projectDetailDepartment', data.department);
            textSet('projectDetailDivision', data.division);
            textSet('projectDetailDescription', data.description);
            const refUrlEl = document.getElementById('projectDetailReferenceUrl');
            if (refUrlEl) {
                if (data.reference_url) { refUrlEl.href = data.reference_url; refUrlEl.textContent = data.reference_url; refUrlEl.style.display = ''; }
                else refUrlEl.style.display = 'none';
            }
            const refFileEl = document.getElementById('projectDetailReferenceFile');
            if (refFileEl) {
                if (data.reference_file) { refFileEl.href = baseFileUrl + data.reference_file; refFileEl.style.display = ''; }
                else refFileEl.style.display = 'none';
            }
            const fmt = (s) => s ? new Date(s).toLocaleDateString(undefined, {year:'numeric', month:'long', day:'numeric'}) : '';
            textSet('projectDetailStartDate', fmt(data.start_date));
            textSet('projectDetailDueDate', fmt(data.due_date));
            textSet('projectDetailCoAuthors', Array.isArray(data.co_authors) && data.co_authors.length ? data.co_authors.map(a=>a.name).join(', ') : 'None');
            textSet('projectDetailContributors', Array.isArray(data.contributors) && data.contributors.length ? data.contributors.map(a=>a.name).join(', ') : 'None');

            new bootstrap.Modal(modalEl).show();
        } catch(_) {}
    });
})();

