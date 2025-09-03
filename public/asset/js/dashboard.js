
const baseUrl = $('meta[name="app-url"]').attr('content');
const appUrl = $('meta[name="app-url"]').attr('content');
// calendar mobile toggle
$(document).ready(function () {
    // --- Calendar Toggle ---
    const $calendar = $(".calendar-card-mobile");
    const $calendarOverlay = $("<div class='calendar-overlay'></div>").appendTo("body");

    $(".toggle-calendar").on("click", function (e) {
        e.preventDefault();

        if ($calendar.hasClass("active")) {
            // Tutup
            $calendar.removeClass("animate-in").addClass("animate-out");
            $calendarOverlay.removeClass("active");

            setTimeout(() => {
                $calendar.removeClass("active animate-out");
            }, 400);
        } else {
            // Buka
            $calendar.addClass("active animate-in p-3").removeClass("animate-out");
            $calendarOverlay.addClass("active");
        }
    });

    $calendarOverlay.on("click", function () {
        $calendar.removeClass("animate-in").addClass("animate-out");
        $(this).removeClass("active");

        setTimeout(() => {
            $calendar.removeClass("active animate-out");
        }, 400);
    });


    // --- Timeline Toggle ---
    const $timeline = $(".timeline-card-mobile");
    const $timelineOverlay = $("<div class='timeline-overlay'></div>").appendTo("body");

    $(".toggle-timeline").on("click", function (e) {
        e.preventDefault();

        if ($timeline.hasClass("active")) {
            // Tutup
            $timeline.removeClass("animate-in").addClass("animate-out");
            $timelineOverlay.removeClass("active");

            setTimeout(() => {
                $timeline.removeClass("active animate-out");
            }, 400);
        } else {
            // Buka
            $timeline.addClass("active animate-in p-3").removeClass("animate-out");
            $timelineOverlay.addClass("active");
        }
    });

    $timelineOverlay.on("click", function () {
        $timeline.removeClass("animate-in").addClass("animate-out");
        $(this).removeClass("active");

        setTimeout(() => {
            $timeline.removeClass("active animate-out");
        }, 400);
    });
});
