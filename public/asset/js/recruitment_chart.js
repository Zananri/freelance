new Chart(document.getElementById("employeeChart"), {
    type: "line",
    data: {
        labels: [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "Mei",
            "Jun",
            "Jul",
            "Agu",
            "Sep",
            "Okt",
            "Nov",
            "Des",
        ],
        datasets: [
            {
                label: "Employees",
                data: [18, 28, 15, 32, 22, 35, 20, 24, 33, 29, 38, 35],
                borderColor: "#149BFF",
                borderWidth: 3,
                tension: 0.45,
                fill: true,

                pointRadius: 0,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: "#149BFF",
                pointHoverBorderColor: "#FFFFFF",
                pointHoverBorderWidth: 2,

                backgroundColor: ({ chart }) => {

                    if (!chart.chartArea) return null;

                    const gradient = chart.ctx.createLinearGradient(
                        0,
                        chart.chartArea.top,
                        0,
                        chart.chartArea.bottom
                    );

                    gradient.addColorStop(0, "rgba(20,155,255,.35)");
                    gradient.addColorStop(1, "rgba(20,155,255,0)");

                    return gradient;
                },
            },
        ],
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,

        interaction: {
            mode: "index",
            intersect: false,
        },

        animation: {
            duration: 1200,
            easing: "easeOutQuart",
        },

        plugins: {
            legend: {
                display: false,
            },
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
                    title(context) {
                        return context[0].label;
                    },
                    label(context) {
                        return `Total Employees : ${context.parsed.y}`;
                    },
                },
            },
        },

        scales: {
            x: {
                display: false,
                grid: {
                    display: false,
                },
                border: {
                    display: false,
                },
            },
            y: {
                display: false,
                grid: {
                    display: false,
                },
                border: {
                    display: false,
                },
            },
        },

        onHover(event, elements) {
            event.native.target.style.cursor = elements.length
                ? "pointer"
                : "default";
        },
    },
});

new Chart(document.getElementById("positionChart"), {
    type: "line",
    data: {
        labels: [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "Mei",
            "Jun",
            "Jul",
            "Agu",
            "Sep",
            "Okt",
            "Nov",
            "Des",
        ],
        datasets: [
            {
                label: "Positions",
                data: [18, 28, 15, 32, 22, 35, 20, 24, 33, 29, 38, 35],
                borderColor: "#017DC0",
                borderWidth: 3,
                tension: 0.45,
                fill: true,

                pointRadius: 0,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: "#017DC0",
                pointHoverBorderColor: "#FFFFFF",
                pointHoverBorderWidth: 2,

                backgroundColor: ({ chart }) => {

                    if (!chart.chartArea) return null;

                    const gradient = chart.ctx.createLinearGradient(
                        0,
                        chart.chartArea.top,
                        0,
                        chart.chartArea.bottom
                    );

                    gradient.addColorStop(0, "rgba(1, 125, 192, 0.35)");
                    gradient.addColorStop(1, "rgba(1, 125, 192, 0)");

                    return gradient;
                },
            },
        ],
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,

        interaction: {
            mode: "index",
            intersect: false,
        },

        animation: {
            duration: 1200,
            easing: "easeOutQuart",
        },

        plugins: {
            legend: {
                display: false,
            },
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
                    title(context) {
                        return context[0].label;
                    },
                    label(context) {
                        return `Total Employees : ${context.parsed.y}`;
                    },
                },
            },
        },

        scales: {
            x: {
                display: false,
                grid: {
                    display: false,
                },
                border: {
                    display: false,
                },
            },
            y: {
                display: false,
                grid: {
                    display: false,
                },
                border: {
                    display: false,
                },
            },
        },

        onHover(event, elements) {
            event.native.target.style.cursor = elements.length
                ? "pointer"
                : "default";
        },
    },
});

new Chart(document.getElementById("applicantsChart"), {
    type: "line",
    data: {
        labels: [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "Mei",
            "Jun",
            "Jul",
            "Agu",
            "Sep",
            "Okt",
            "Nov",
            "Des",
        ],
        datasets: [
            {
                label: "Positions",
                data: [18, 28, 15, 32, 22, 35, 20, 24, 33, 29, 38, 35],
                borderColor: "#2ECB71",
                borderWidth: 3,
                tension: 0.45,
                fill: true,

                pointRadius: 0,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: "#2ECB71",
                pointHoverBorderColor: "#FFFFFF",
                pointHoverBorderWidth: 2,

                backgroundColor: ({ chart }) => {

                    if (!chart.chartArea) return null;

                    const gradient = chart.ctx.createLinearGradient(
                        0,
                        chart.chartArea.top,
                        0,
                        chart.chartArea.bottom
                    );

                    gradient.addColorStop(0, "rgba(46, 203, 113, 0.35)");
                    gradient.addColorStop(1, "rgba(46, 203, 113, 0)");

                    return gradient;
                },
            },
        ],
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,

        interaction: {
            mode: "index",
            intersect: false,
        },

        animation: {
            duration: 1200,
            easing: "easeOutQuart",
        },

        plugins: {
            legend: {
                display: false,
            },
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
                    title(context) {
                        return context[0].label;
                    },
                    label(context) {
                        return `Total Employees : ${context.parsed.y}`;
                    },
                },
            },
        },

        scales: {
            x: {
                display: false,
                grid: {
                    display: false,
                },
                border: {
                    display: false,
                },
            },
            y: {
                display: false,
                grid: {
                    display: false,
                },
                border: {
                    display: false,
                },
            },
        },

        onHover(event, elements) {
            event.native.target.style.cursor = elements.length
                ? "pointer"
                : "default";
        },
    },
});

new Chart(document.getElementById("scheduleChart"), {
    type: "line",
    data: {
        labels: [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "Mei",
            "Jun",
            "Jul",
            "Agu",
            "Sep",
            "Okt",
            "Nov",
            "Des",
        ],
        datasets: [
            {
                label: "Positions",
                data: [18, 28, 15, 32, 22, 35, 20, 24, 33, 29, 38, 35],
                borderColor: "#F39A3C",
                borderWidth: 3,
                tension: 0.45,
                fill: true,

                pointRadius: 0,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: "#F39A3C",
                pointHoverBorderColor: "#FFFFFF",
                pointHoverBorderWidth: 2,

                backgroundColor: ({ chart }) => {

                    if (!chart.chartArea) return null;

                    const gradient = chart.ctx.createLinearGradient(
                        0,
                        chart.chartArea.top,
                        0,
                        chart.chartArea.bottom
                    );

                    gradient.addColorStop(0, "rgba(243, 154, 60, 0.35)");
                    gradient.addColorStop(1, "rgba(243, 154, 60, 0)");

                    return gradient;
                },
            },
        ],
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,

        interaction: {
            mode: "index",
            intersect: false,
        },

        animation: {
            duration: 1200,
            easing: "easeOutQuart",
        },

        plugins: {
            legend: {
                display: false,
            },
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
                    title(context) {
                        return context[0].label;
                    },
                    label(context) {
                        return `Total Employees : ${context.parsed.y}`;
                    },
                },
            },
        },

        scales: {
            x: {
                display: false,
                grid: {
                    display: false,
                },
                border: {
                    display: false,
                },
            },
            y: {
                display: false,
                grid: {
                    display: false,
                },
                border: {
                    display: false,
                },
            },
        },

        onHover(event, elements) {
            event.native.target.style.cursor = elements.length
                ? "pointer"
                : "default";
        },
    },
});

// Candidate Overview Chart
const ctx = document.getElementById("candidateOverview");

new Chart(ctx,{
    type:"line",

    data:{
        labels:[
            "27 Apr",
            "28 Apr",
            "29 Apr",
            "30 Apr",
            "1 Mei",
            "2 Mei",
            "3 Mei"
        ],

        datasets:[
            {
                label:"Applied",
                data:[90,35,75,45,25,88,92],
                borderColor:"#8A7BFF",
                backgroundColor:"#8A7BFF",
                tension:.45,
                fill:false,
                pointRadius:5,
                pointHoverRadius:7,
                pointBackgroundColor:"#fff",
                pointBorderWidth:2
            },

            {
                label:"Screening",
                data:[32,31,32,70,78,50,8],
                borderColor:"#FF8E83",
                backgroundColor:"#FF8E83",
                tension:.45,
                fill:false,
                pointRadius:5,
                pointBackgroundColor:"#fff",
                pointBorderWidth:2
            },

            {
                label:"Interview",
                data:[56,54,82,20,20,78,45],
                borderColor:"#43C6F4",
                backgroundColor:"#43C6F4",
                tension:.45,
                fill:false,
                pointRadius:5,
                pointBackgroundColor:"#fff",
                pointBorderWidth:2
            },

            {
                label:"Technical Test",
                data:[88,25,32,34,82,58,44],
                borderColor:"#FFA12D",
                backgroundColor:"#FFA12D",
                tension:.45,
                fill:false,
                pointRadius:5,
                pointBackgroundColor:"#fff",
                pointBorderWidth:2
            },

            {
                label:"Hired",
                data:[28,95,12,80,95,92,97],
                borderColor:"#4F81FF",
                backgroundColor:"#4F81FF",
                tension:.45,
                fill:false,
                pointRadius:5,
                pointBackgroundColor:"#fff",
                pointBorderWidth:2
            },

            {
                label:"Rejected",
                data:[58,73,84,17,73,89,5],
                borderColor:"#4FD18A",
                backgroundColor:"#4FD18A",
                tension:.45,
                fill:false,
                pointRadius:5,
                pointBackgroundColor:"#fff",
                pointBorderWidth:2
            }
        ]
    },

    options:{
        responsive:true,
        maintainAspectRatio:false,

        interaction:{
            mode:"index",
            intersect:false
        },

        plugins:{
            legend:{
                position:"top",
                align:"center",

                labels:{
                    usePointStyle:true,
                    pointStyle:"circle",
                    padding:25,
                    font:{
                        size:14,
                        family:"Poppins"
                    }
                }
            }
        },

        scales:{
            y:{
                beginAtZero:true,
                max:100,

                ticks:{
                    stepSize:20
                },

                grid:{
                    color:"#E5E7EB",
                    borderDash:[5,5]
                },

                border:{
                    display:false
                }
            },

            x:{
                grid:{
                    color:"#E5E7EB",
                    borderDash:[5,5]
                },

                border:{
                    display:false
                }
            }
        },

        elements:{
            line:{
                borderWidth:2
            },

            point:{
                hoverBorderWidth:3
            }
        }
    }
});