var appUrl = (
    document.querySelector('meta[name="app-url"]')?.getAttribute("content") ||
    ""
).replace(/\/$/, "");

document.addEventListener("DOMContentLoaded", function () {
    let allSchedules = [];

    fetchScheduleData();

    // function for fetch all schedules data
    function fetchScheduleData() {
        $.ajax({
            url: appUrl + "/schedules/index",
            type: "GET",
            dataType: "json",
            success: function (response) {
                allSchedules = response.data.data;
                filteredSchedule = response.data;
                console.log(allSchedules);

                createScheduleCard(allSchedules);
            },
            error: function (xhr, status, error) {
                console.error("data gagal di fetch", status, error);
            },
        });
    }

    function getInitials(title) {
        const text = (title || "").trim();
        if (!text) return "NA";
        const placeholder = /^(no project|no|none|null|n\/a|na)$/i;
        if (placeholder.test(text)) return "NA";
        const parts = text.split(/\s+/).filter(Boolean);
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }

    function getInitialsColor(title) {
        const colors = [
            "#6A5AE0",
            "#FF8A3C",
            "#00A881",
            "#D4526E",
            "#3E8EDE",
            "#546E7A",
            "#8E44AD",
            "#2E7D32",
            "#AD1457",
            "#EF6C00",
        ];
        const key = title || "NA";
        let hash = 0;
        for (let i = 0; i < key.length; i++)
            hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
        return colors[hash % colors.length];
    }

    // Function for create card
    function createScheduleCard(scheduleData) {
        const container = $("#scheduleContainer");

        container.empty();

        scheduleData.forEach((item) => {
            let imageUrl = item.image;
            const card = $(`
                <div class="col-md-4 mb-3 d-flex align-items-start position-relative" data-item-id="${
                    item.id
                }">
                                <div class="item-card p-4 w-100" style="background:#F0F1F8; border-radius:20px; display:flex; flex-direction:column; justify-content:space-between;">

                                    <!-- Header -->
                                    <div class="d-flex justify-content-between align-items-start mb-2">
                                        <div class="d-flex align-items-center">
                                            ${
                                                imageUrl
                                                    ? `<img src="${imageUrl}" class="rounded-circle me-2" style="width:34px;height:34px;object-fit:cover;">`
                                                    : (function () {
                                                          const init =
                                                              getInitials(
                                                                  item.title
                                                              );
                                                          const color =
                                                              getInitialsColor(
                                                                  item.title
                                                              );
                                                          return `<div class=\"rounded-circle me-2 d-flex align-items-center justify-content-center\"
                                                            style=\"width:34px;height:34px;background:${color};color:#fff;font-size:14px;font-weight:600;\">${init}</div>`;
                                                      })()
                                            }
                                        <div class="d-flex flex-column">
                                            ${
                                                item.project_id
                                                    ? `<small class="text-muted" style="line-height:1; font-size: 10px;">${item.project.title} </small>`
                                                    : ""
                                            }
                                            <h6 class="mb-0" style="font-size:14px; font-weight:600;">${
                                                item.title
                                            }</h6>
                                        </div>
                                        </div>
                                        <div class="dropdown-icon-container">
                                            <button class="btn btn-sm border-0 d-flex align-items-center justify-content-center dropdown-icon dropdown-icon-custom"
                                                    style="background:#E8E9F2; border-radius:50%; width:32px; height:32px;">
                                                <span class="material-symbols-outlined" style="font-size:16px; color:#828282;" tabindex="0">more_vert</span>
                                            </button>
                                            <div class="dropdown-menu dropdown-action d-none">
                                                <div class="dropdown-item">Detail</div>
                                                <div class="dropdown-item">Task</div>
                                                <div class="dropdown-item">Feedback</div>
                                                <div class="dropdown-item">Edit</div>
                                                <div class="dropdown-item text-danger delete-item">Delete</div>
                                            </div>
                                        </div>
                                    </div>
                                    <!-- Description (render only if non-empty) -->
                                    ${(function () {
                                        const d = (
                                            item.description || ""
                                        ).trim();
                                        if (!d) return "";
                                        return `<p class=\"mb-2 small text-muted\" style=\"font-size:12px; line-height:1.4;\">${d}</p>`;
                                    })()}

                                    <hr class="my-2 border-3" style="border-top:1px solid #DEDFE7;">

                                    <div class="d-flex justify-content-between align-items-center">
                                        <div style="font-size: 10px; font-weight: 400;">
                                            <span style="color: #797E91;">Priority: </span>
                                            <span style="color: ${
                                                item.priority === "HIGH"
                                                    ? "red"
                                                    : "#4B4F5E"
                                            }">
                                                ${item.priority}
                                            </span>
                                        </div>
                                        <div style="font-size: 10px; font-weight: 400;">
                                            <span style="color: #797E91;">Deadline: </span>
                                            <span style="#color: #4B4F5E">${
                                                item.due_date
                                                    ? item.due_date
                                                    : "-"
                                            }</span>
                                        </div>
                                    </div>

                                    <!-- Footer -->
                                    <div class="d-flex justify-content-between align-items-center mt-2">
                                        <div class="d-flex align-items-center">
                                            <div class="latest-feedback-snippet d-none align-items-center me-1" data-item-id="${
                                                item.id
                                            }" style="cursor:pointer; max-width: 160px;">
                                                <img class="latest-feedback-avatar rounded-circle me-1" src="${appUrl}/asset/img/avatar.png" alt="avatar" width="20" height="20" style="object-fit:cover;">
                                                <span class="latest-feedback-text text-truncate" style="max-width: 130px; font-size: 11px; color:#4B4F5E;"></span>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>
        `);
            container.append(card);
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

    document.querySelectorAll(".pagination .page-link").forEach((link) => {
        link.addEventListener("click", function (e) {
            e.preventDefault();

            document.querySelectorAll(".pagination .page-item").forEach((li) => li.classList.remove("active"));
            this.parentElement.classList.add("active");

            const view = this.getAttribute("data-view");
            updateDateTitle(view);

            let filtered = filteredSchedule.filter((item) => {
                if (view === "daily") return item.recurrence_type === "daily";
                if (view === "weekly") return item.recurrence_type === "weekly";
                if (view === "monthly") return item.recurrence_type === "monthly";
                return true;
            });

            createScheduleCard(filtered);
        });
    });
});
