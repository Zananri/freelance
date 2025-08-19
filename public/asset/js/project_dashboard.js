// Doughnut Chart Porject
document.addEventListener("DOMContentLoaded", function () {
    const createDoughnut = (el) =>
        new Chart(el, {
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
            options: { cutout: "60%", plugins: { legend: { display: false } } },
        });

    const ctxDesktop = document.getElementById("doughnutChart");
    if (ctxDesktop) createDoughnut(ctxDesktop);

    const ctxMobile = document.getElementById("doughnutChartMobile");
    if (ctxMobile) createDoughnut(ctxMobile);
});

// State untuk timeline
let currentMonthProject = new Date().getMonth(); // 0 - 11
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

// Dummy data project (ubah sesuai backend lu)
const timelineData = [
    { name: "Name Project", start: 0, end: 3, color: "color1" },
    { name: "Name Project", start: 1, end: 4, color: "color2" },
    { name: "Name Project", start: 2, end: 6, color: "color3" },
    { name: "Name Project", start: 0, end: 6, color: "color4" },
];

// Fungsi render timeline
function renderTimeline(
    targetRows = "#timelineRows",
    targetTitle = "#timelineTitle"
) {
    $(targetTitle).text(
        `${months[currentMonthProject]} week ${currentWeekProject + 1}`
    );

    const $timelineRows = $(targetRows);
    $timelineRows.empty();

    $.each(timelineData, function (_, proj) {
        const $row = $("<div>")
            .addClass("timeline-row d-flex")
            .css("position", "relative");

        // bikin 7 kolom (hari Senin–Minggu)
        for (let i = 0; i < 7; i++) {
            $row.append(
                $("<div>").addClass("timeline-cell").css("position", "relative")
            );
        }

        const barLeft = proj.start * (100 / 7);
        const barWidth = (proj.end - proj.start + 1) * (100 / 7);

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
            .html(
                `<span class="circle border-0 ${proj.color}"></span>${proj.name}`
            );

        $row.append($bar);
        $timelineRows.append($row);
    });
}

$(document).ready(function () {
    // render pertama kali
    if ($("#timelineRows").length) {
        renderTimeline("#timelineRows", "#timelineTitle");
    }

    // event prev
    $("#prevTimeline").on("click", function () {
        if (currentWeekProject > 0) {
            currentWeekProject--;
        } else if (currentMonthProject > 0) {
            currentMonthProject--;
            currentWeekProject = 3;
        }
        renderTimeline("#timelineRows", "#timelineTitle");
    });

    // event next
    $("#nextTimeline").on("click", function () {
        if (currentWeekProject < 3) {
            currentWeekProject++;
        } else if (currentMonthProject < 11) {
            currentMonthProject++;
            currentWeekProject = 0;
        }
        renderTimeline("#timelineRows", "#timelineTitle");
    });
});

// Initialize Swiper for mobile task display
function initializeTaskSwiper() {
    // Check if we're on mobile (width <= 768px)
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
        // Initialize Swiper if not already initialized
        if (!window.taskSwiper) {
            window.taskSwiper = new Swiper(".task-swiper", {
                slidesPerView: 1,
                spaceBetween: 5,
                centeredSlides: true,
                pagination: {
                    el: ".swiper-pagination",
                    clickable: true,
                },
                loop: true,
                grabCursor: false,
                effect: "slide",
                speed: 300,
                breakpoints: {
                    320: {
                        slidesPerView: 1,
                        spaceBetween: 10,
                    },
                    480: {
                        slidesPerView: 1,
                        spaceBetween: 15,
                    },
                    640: {
                        slidesPerView: 1,
                        spaceBetween: 20,
                    },
                },
            });
        }
    } else {
        // Destroy Swiper if it exists and we're on desktop
        if (window.taskSwiper) {
            window.taskSwiper.destroy();
            window.taskSwiper = null;
        }
    }
}

$(document).ready(function () {
    initializeTaskSwiper();
    $(window).on("resize", function () {
        handleResize();
    });
});

$(document).ready(function () {
    // existing code...
    initializeTaskSwiper();

    // render default timeline untuk desktop
    if ($("#timelineRows").length) {
        renderTimeline("#timelineRows", "#timelineTitle");
    }
});

$(document).on("click", ".toggle-timeline", function () {
    const $timelineCard = $(this)
        .closest(".project-card")
        .find(".timeline-card");

    $timelineCard.slideToggle();

    if ($timelineCard.is(":visible")) {
        renderTimeline("#timelineRows", "#timelineTitle");
    }
});

// Handle window resize for responsive behavior
function handleResize() {
    initializeTaskSwiper();
}

// Initialize on document ready and window resize
$(document).ready(function () {
    initializeTaskSwiper();
    $(window).on("resize", handleResize);
});
