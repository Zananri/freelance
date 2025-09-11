var appUrl = (
    document.querySelector('meta[name="app-url"]')?.getAttribute("content") ||
    ""
).replace(/\/$/, "");

document.addEventListener("DOMContentLoaded", function () {
    fetchScheduleData();

    // function for fetch all schedules data
    function fetchScheduleData() {
        $.ajax({
            url: appUrl + "/schedules/index",
            type: "GET",
            dataType: "json",
            success: function (response) {
                console.log("fetch berhasil, data:", response);
            },
            error: function (xhr, status, error) {
                console.error("data gagal di fetch", status, error);
                console.log("error", xhr.response.responseText);
            },
        });
    }


    // Function for update title
    function updateDateTitle(view = "day") {
        const dateTitle = document.getElementById("date-title");

        const days = [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
        ];
        const months = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
        ];

        const now = new Date();
        const dayName = days[now.getDay()];
        const date = now.getDate();
        const monthName = months[now.getMonth()];
        const year = now.getFullYear();

        function getWeekOfMonth(d) {
            const firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
            const dayOfWeek = firstDay.getDay();
            return Math.ceil((d.getDate() + dayOfWeek) / 7);
        }

        if (view === "day") {
            dateTitle.textContent = `${dayName}, ${date} ${monthName} ${year}`;
        } else if (view === "week") {
            const weekOfMonth = getWeekOfMonth(now);
            dateTitle.textContent = `Week ${weekOfMonth}, ${monthName} ${year}`;
        } else if (view === "month") {
            dateTitle.textContent = `${monthName} ${year}`;
        }
    }

    updateDateTitle("day");

    // event listener for pagination schedule
    document.querySelectorAll(".pagination .page-link").forEach((link) => {
        link.addEventListener("click", function (e) {
            e.preventDefault();

            document
                .querySelectorAll(".pagination .page-item")
                .forEach((li) => li.classList.remove("active"));

            this.parentElement.classList.add("active");

            const view = this.getAttribute("data-view");
            updateDateTitle(view);
        });
    });
});
