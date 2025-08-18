// Doughnut Chart Porject
document.addEventListener("DOMContentLoaded", function () {
    const ctx = document.getElementById("doughnutChart");
    if (!ctx) return;

    new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["Total", "Complete", "On Progress", "Late"],
            datasets: [
                {
                    data: [3, 5, 2],
                    backgroundColor: ["#b6e7c9", "#8fb3e8", "#ff9c9c"],
                    borderWidth: 0,
                },
            ],
        },
        options: {
            cutout: "60%", // Size middle hole
            plugins: {
                legend: { display: false },
            },
        },
    });
});


