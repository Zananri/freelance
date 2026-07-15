const RecruitmentCharts = (function ($) {
    const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const instances = {};

    function gradient(ctx, chartArea, color) {
        if (!chartArea) return null;
        const g = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        g.addColorStop(0, color.from);
        g.addColorStop(1, color.to);
        return g;
    }

    function buildTrendChart(canvasId, data, color) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;

        if (instances[canvasId]) {
            instances[canvasId].destroy();
        }

        instances[canvasId] = new Chart(canvas, {
            type: "line",
            data: {
                labels: MONTH_LABELS,
                datasets: [
                    {
                        data: data,
                        borderColor: color.line,
                        borderWidth: 3,
                        tension: 0.45,
                        fill: true,
                        pointRadius: 0,
                        pointHoverRadius: 6,
                        pointHoverBackgroundColor: color.line,
                        pointHoverBorderColor: "#FFFFFF",
                        pointHoverBorderWidth: 2,
                        backgroundColor: ({ chart }) => gradient(chart.ctx, chart.chartArea, color.fill),
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: "index", intersect: false },
                animation: { duration: 1200, easing: "easeOutQuart" },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        enabled: true,
                        displayColors: false,
                        backgroundColor: "#222",
                        titleColor: "#FFFFFF",
                        bodyColor: "#FFFFFF",
                        padding: 12,
                        cornerRadius: 10,
                        caretSize: 6,
                        callbacks: {
                            title: (ctx) => ctx[0].label,
                            label: (ctx) => `Total : ${ctx.parsed.y}`,
                        },
                    },
                },
                scales: {
                    x: { display: false, grid: { display: false }, border: { display: false } },
                    y: { display: false, grid: { display: false }, border: { display: false } },
                },
                onHover(event, elements) {
                    event.native.target.style.cursor = elements.length ? "pointer" : "default";
                },
            },
        });

        return instances[canvasId];
    }

    function buildOverviewChart(labels, data) {
        const canvas = document.getElementById("candidateOverview");
        if (!canvas) return null;

        if (instances.candidateOverview) {
            instances.candidateOverview.destroy();
        }

        instances.candidateOverview = new Chart(canvas, {
            type: "line",
            data: {
                labels: labels.length ? labels : ["No Data"],
                datasets: [
                    {
                        label: "Applicants",
                        data: data.length ? data : [0],
                        borderColor: "#8A7BFF",
                        backgroundColor: "rgba(138,123,255,0.08)",
                        tension: 0.45,
                        fill: true,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        pointBackgroundColor: "#fff",
                        pointBorderWidth: 2,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: "index", intersect: false },
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: "#E5E7EB", borderDash: [5, 5] }, border: { display: false } },
                    x: { grid: { color: "#E5E7EB", borderDash: [5, 5] }, border: { display: false } },
                },
                elements: { line: { borderWidth: 2 }, point: { hoverBorderWidth: 3 } },
            },
        });

        return instances.candidateOverview;
    }

    function render(data) {

        const fallback = [18, 28, 15, 32, 22, 35, 20, 24, 33, 29, 38, 35];

        buildTrendChart("employeeChart", data.employees || fallback, {
            line: "#149BFF",
            fill: { from: "rgba(20,155,255,.35)", to: "rgba(20,155,255,0)" },
        });

        buildTrendChart("positionChart", data.positions || fallback, {
            line: "#017DC0",
            fill: { from: "rgba(1, 125, 192, 0.35)", to: "rgba(1, 125, 192, 0)" },
        });

        buildTrendChart("applicantsChart", data.applicants || fallback, {
            line: "#2ECB71",
            fill: { from: "rgba(46, 203, 113, 0.35)", to: "rgba(46, 203, 113, 0)" },
        });

        buildTrendChart("scheduleChart", data.schedules || fallback, {
            line: "#F39A3C",
            fill: { from: "rgba(243, 154, 60, 0.35)", to: "rgba(243, 154, 60, 0)" },
        });

        buildOverviewChart(data.overviewLabels || [], data.overviewData || []);
    }

    return { render };
})(jQuery);

window.RecruitmentCharts = RecruitmentCharts;