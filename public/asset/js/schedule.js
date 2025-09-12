var appUrl = (
    document.querySelector('meta[name="app-url"]')?.getAttribute("content") ||
    ""
).replace(/\/$/, "");

let allSchedules = [];
let currentView = "daily";
let currentFilterStatus = "";

document.addEventListener("DOMContentLoaded", function () {
    updateDateTitle("daily");

    fetchScheduleData();

    function showFloatingAlert(message, type = "success", delayMs = 2500) {
        try {
            if (typeof window.showAlertMsg === "function") {
                window.showAlertMsg(message, "light", delayMs);
                return;
            }
            const box = document.querySelector(
                ".box-alert-messages .box-message"
            );
            if (box && box.parentElement) {
                box.parentElement.style.display = "block";
                box.classList.remove("success", "warning", "error", "light");
                box.classList.add("light");
                box.innerHTML = message;
                setTimeout(() => {
                    if (typeof window.hideAlertMsg === "function") {
                        window.hideAlertMsg();
                    } else {
                        box.parentElement.style.display = "none";
                    }
                }, delayMs);
                return;
            }
        } catch (e) {
            /* no-op */
        }
        try {
            alert(
                typeof message === "string"
                    ? message.replace(/<[^>]+>/g, "")
                    : String(message)
            );
        } catch (e) {}
    }

    // function for fetch all schedules data
    function fetchScheduleData() {
        $.ajax({
            url: appUrl + "/schedules/index",
            type: "GET",
            dataType: "json",
            success: function (response) {
                console.log(response);

                allSchedules = response.data.data;
                applyFiltersAndView();
            },
            error: function (xhr, status, error) {
                console.error("data gagal di fetch", status, error);
                console.log("error", xhr.responseText);
            },
        });
    }

    // Function to apply current view and filter
    function applyFiltersAndView() {
        let filtered = allSchedules.filter(
            (item) =>
                (item.recurrence_type || "").toLowerCase() ===
                currentView.toLowerCase()
        );

        if (currentFilterStatus) {
            filtered = filtered.filter(
                (item) => (item.status || "") === currentFilterStatus
            );
        }

        createScheduleCard(filtered);
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
            let formatedDueDate = item.due_date
                ? new Date(item.due_date).toISOString().split("T")[0]
                : "";
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
                                                          return `<div class="rounded-circle me-2 d-flex align-items-center justify-content-center"
                                                            style="width:34px;height:34px;background:${color};color:#fff;font-size:14px;font-weight:600;">${init}</div>`;
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
                                                <div class="dropdown-item">Edit</div>
                                                <div class="dropdown-item text-danger delete-item">Delete</div>
                                            </div>
                                        </div>
                                    </div>
                                    <!-- Description (render only if non-empty) -->
                                    <div class="description-container">
                                        ${(function () {
                                            const d = (
                                                item.description || ""
                                            ).trim();
                                            if (!d) return "";
                                            return `<p class="teks-description mb-2 small text-muted" style="font-size:12px; line-height:1.4;">${d}</p>`;
                                        })()}
                                    </div>
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
                                                formatedDueDate
                                                    ? formatedDueDate
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

    // Event For Open Action Dropdown
    document.addEventListener("click", function (e) {
        const dropdownBtn = e.target.closest(".dropdown-icon-custom");

        if (dropdownBtn) {
            const dropdownMenu = dropdownBtn.nextElementSibling;
            if (dropdownMenu) {
                dropdownMenu.classList.toggle("d-none");
            }
        } else {
            document.querySelectorAll(".dropdown-action").forEach((menu) => {
                menu.classList.add("d-none");
            });
        }
    });

    // Event for Detail Schedule
    document.addEventListener("click", function (e) {
        if (
            e.target.closest(".dropdown-item") &&
            e.target.textContent.trim() === "Detail"
        ) {
            e.preventDefault();
            const card = e.target.closest(".col-md-4");
            const scheduleId = card.getAttribute("data-item-id");

            if (scheduleId) {
                fetchScheduleDetail(scheduleId);
            }
        }
    });

    // Event For Open Filter Dropdown
    document.addEventListener("click", function (e) {
        const dropdownBtn = document.getElementById("openProjectFilterBtn");
        const dropdownMenu = document.getElementById("projectFilterDropdown");
        const filterContainer = document.querySelector(
            ".title-filter-container"
        );

        if (dropdownBtn && e.target.closest("#openProjectFilterBtn")) {
            if (filterContainer.classList.contains("d-none")) {
                filterContainer.classList.remove("d-none");
                dropdownMenu.style.display = "block";
            } else {
                filterContainer.classList.add("d-none");
                dropdownMenu.style.display = "none";
            }
        } else {
            if (
                filterContainer &&
                !filterContainer.classList.contains("d-none")
            ) {
                filterContainer.classList.add("d-none");
            }
            if (dropdownMenu) {
                dropdownMenu.style.display = "none";
            }
        }
    });

    // Filter apply and reset button handlers
    document
        .getElementById("applyScheduleFilterBtn")
        .addEventListener("click", function () {
            const statusSelect = document.getElementById(
                "filterScheduleStatus"
            );
            currentFilterStatus = statusSelect.value;
            applyFiltersAndView();
        });

    document
        .getElementById("resetScheduleFilterBtn")
        .addEventListener("click", function () {
            const statusSelect = document.getElementById(
                "filterScheduleStatus"
            );
            statusSelect.value = "";
            currentFilterStatus = "";
            applyFiltersAndView();
        });

    // Event for Edit Schedule
    document.addEventListener("click", function (e) {
        if (
            e.target.closest(".dropdown-item") &&
            e.target.textContent.trim() === "Edit"
        ) {
            e.preventDefault();
            const card = e.target.closest(".col-md-4");
            const scheduleId = card.getAttribute("data-item-id");

            if (scheduleId) {
                fetchScheduleDataForEdit(scheduleId);
            }
        }
    });

    // Event for Edit Schedule Form Submission
    document.addEventListener("submit", function (e) {
        if (e.target.id === "scheduleEditForm") {
            e.preventDefault();

            const form = e.target;
            const formData = new FormData(form);

            formData.append("_method", "PUT");

            formData.append(
                "_token",
                document
                    .querySelector('meta[name="csrf-token"]')
                    .getAttribute("content")
            );

            const modalLoader = document.getElementById(
                "editScheduleModalLoader"
            );
            if (modalLoader) modalLoader.classList.remove("d-none");

            const scheduleId =
                document.getElementById("edit_schedule_id").value;

            $.ajax({
                url: appUrl + "/schedules/" + scheduleId,
                type: "POST",
                data: formData,
                processData: false,
                contentType: false,
                success: function (response) {
                    console.log("=== Response Success ===", response);

                    if (response.code === 200) {
                        $("#scheduleEditModal").modal("hide");
                        fetchScheduleData();

                        showFloatingAlert(
                            response.message ||
                                "Schedule updated successfully!",
                            "success",
                            1500
                        );
                    } else {
                        showFloatingAlert(
                            "Failed to update schedule: " +
                                (response.message || "Unknown error"),
                            "warning",
                            3500
                        );
                    }
                },
                error: function (xhr, status, error) {
                    console.error("=== Response Error ===", {
                        status: xhr.status,
                        statusText: xhr.statusText,
                        responseText: xhr.responseText,
                        error: error,
                    });
                },
                complete: function () {
                    if (modalLoader) modalLoader.classList.add("d-none");
                },
            });
        }
    });

    // Function to fetch schedule data for edit modal
    function fetchScheduleDataForEdit(scheduleId) {
        $.ajax({
            url: appUrl + "/schedules/" + scheduleId + "/edit",
            type: "GET",
            dataType: "json",
            success: function (response) {
                if (response.code === 200) {
                    populateEditModal(response.data);
                    $("#scheduleEditModal").modal("show");
                } else {
                    alert("Failed to load schedule data");
                }
            },
            error: function (xhr, status, error) {
                console.error("Error fetching schedule data:", status, error);
                alert("Failed to load schedule data");
            },
        });
    }

    // Function to populate edit modal fields
    function populateEditModal(schedule) {
        // Populate basic fields
        document.getElementById("edit_schedule_id").value = schedule.id;
        document.getElementById("edit_schedule_title").value =
            schedule.title || "";
        document.getElementById("edit_schedule_description").value =
            schedule.description || "";
        document.getElementById("edit_schedule_point").value =
            schedule.point || 1;
        document.getElementById("edit_schedule_priority").value =
            schedule.priority || "";
        document.getElementById("edit_schedule_due_in_days").value =
            schedule.due_in_days || "";
        document.getElementById("edit_schedule_recurrence_type").value =
            schedule.recurrence_type || "";

        // Handle recurrence options
        handleEditRecurrenceChange(
            schedule.recurrence_type,
            schedule.recurrence_day_of_week,
            schedule.recurrence_day_of_month
        );

        // Handle image
        if (schedule.image) {
            const imageLabel = document.getElementById(
                "editScheduleImageLabel"
            );
            if (imageLabel) {
                imageLabel.style.backgroundImage = `url('${appUrl}/file/schedule/${schedule.image}')`;
                imageLabel.classList.add("has-image");
                const clearBtn = document.getElementById(
                    "editScheduleImageClearBtn"
                );
                if (clearBtn) {
                    clearBtn.classList.remove("d-none");
                }
            }
        }

        // Handle reference URLs
        populateEditReferenceUrls(schedule.reference_urls || []);

        // Handle executors
        populateEditExecutors(schedule.executor_ids || []);

        // Load projects for edit modal and set the selected project
        loadProjectsForEdit(schedule.project_id);

        // Setup reference URL functionality for edit modal
        setupEditReferenceUrls();

        // Setup recurrence toggle functionality for edit modal
        setupEditRecurrenceToggles();
    }

    function setupEditReferenceUrls() {
        const container = document.getElementById(
            "edit_schedule_reference_urls_container"
        );
        if (!container) return;

        // Add event listeners for add/remove buttons
        document.addEventListener("click", function (e) {
            if (
                e.target.closest(".add-ref-url") &&
                e.target.closest("#edit_schedule_reference_urls_container")
            ) {
                const row = document.createElement("div");
                row.className = "d-flex gap-2 align-items-center";
                row.innerHTML = `<input type='url' class='form-control input-text' name='reference_urls[]' placeholder='https://example.com'><button type='button' class='btn btn-danger remove-ref-url'><span class='material-symbols-outlined'>close</span></button>`;
                container.appendChild(row);
            }
            if (
                e.target.closest(".remove-ref-url") &&
                e.target.closest("#edit_schedule_reference_urls_container")
            ) {
                const row = e.target.closest(".d-flex");
                if (row) row.remove();
            }
        });
    }

    function loadProjectsForEdit(selectedProjectId = null) {
        const sel = document.getElementById("edit_schedule_project_id");
        if (!sel) return;
        fetch(appUrl + "/project/index?task_scope=all")
            .then((r) => r.json())
            .then((d) => {
                const arr = d.data || [];
                let opts = '<option value="">No Project</option>';
                arr.forEach((p) => {
                    opts += `<option value='${p.id}'${
                        selectedProjectId === p.id ? " selected" : ""
                    }>${p.title}</option>`;
                });
                sel.innerHTML = opts;
            })
            .catch(() => {});
    }

    function handleEditRecurrenceChange(recurrenceType, dayOfWeek, dayOfMonth) {
        const weeklyOpts = document.getElementById("edit_schedule_weekly_opts");
        const monthlyOpts = document.getElementById(
            "edit_schedule_monthly_opts"
        );

        if (!weeklyOpts || !monthlyOpts) {
            return;
        }

        if (recurrenceType === "weekly") {
            weeklyOpts.classList.remove("d-none");
            monthlyOpts.classList.add("d-none");
            if (dayOfWeek !== null && dayOfWeek !== undefined) {
                const dowElem = document.getElementById(
                    "edit_schedule_recurrence_day_of_week"
                );
                if (dowElem) dowElem.value = dayOfWeek;
            }
        } else if (recurrenceType === "monthly") {
            weeklyOpts.classList.add("d-none");
            monthlyOpts.classList.remove("d-none");
            if (dayOfMonth !== null && dayOfMonth !== undefined) {
                const domElem = document.getElementById(
                    "edit_schedule_recurrence_day_of_month"
                );
                if (domElem) domElem.value = dayOfMonth;
            }
        } else {
            weeklyOpts.classList.add("d-none");
            monthlyOpts.classList.add("d-none");
        }
    }

    function populateEditReferenceUrls(urls) {
        const container = document.getElementById(
            "edit_schedule_reference_urls_container"
        );
        if (!container) return;

        container.innerHTML = "";

        if (!urls || urls.length === 0) {
            const row = document.createElement("div");
            row.className = "d-flex gap-2 align-items-center";
            row.innerHTML = `
                <input type='url' class='form-control input-text' name='reference_urls[]' placeholder='https://example.com'>
                <button type='button' class='btn btn-submit-black add-ref-url' aria-label='Add URL'>
                    <span class='material-symbols-outlined'>add</span>
                </button>`;
            container.appendChild(row);
        } else {
            urls.forEach((url) => {
                const safeUrl = url ?? ""; // <-- fallback biar null ga masuk
                const row = document.createElement("div");
                row.className = "d-flex gap-2 align-items-center";
                row.innerHTML = `
                    <input type='url' class='form-control input-text' name='reference_urls[]' value='${safeUrl}' placeholder='https://example.com'>
                    <button type='button' class='btn btn-danger remove-ref-url'>
                        <span class='material-symbols-outlined'>close</span>
                    </button>`;
                container.appendChild(row);
            });
        }
    }

    function populateEditExecutors(executorIds) {
        const executorInput = document.getElementById(
            "edit_schedule_executors"
        );
        if (executorInput) {
            executorInput.value = JSON.stringify(executorIds || []);
        }

        // Initialize executor picker for edit modal
        setupEditExecutorPicker(executorIds || []);
    }

    function setupEditExecutorPicker(initialExecutorIds = []) {
        const input = document.getElementById("edit_schedule_executor_input");
        const dropdown = document.getElementById(
            "edit_schedule_executor_dropdown"
        );
        const selectedContainer = document.getElementById(
            "edit_schedule_selected_executors"
        );
        const hidden = document.getElementById("edit_schedule_executors");

        if (!input || !dropdown || !selectedContainer || !hidden) return;

        let employees = [],
            filtered = [],
            selected = [];

        // Load initial selected employees if any
        if (initialExecutorIds.length > 0) {
            fetchEmployeesForEdit(initialExecutorIds);
        }

        function buildPhotoUrl(userPhoto) {
            if (!userPhoto) return appUrl + "/asset/img/avatar.png";
            if (/^https?:/i.test(userPhoto)) return userPhoto;
            if (userPhoto.startsWith("/")) return appUrl + userPhoto;
            if (userPhoto.startsWith("file/") || userPhoto.startsWith("asset/"))
                return appUrl + "/" + userPhoto;
            return appUrl + "/file/profile_picture/" + userPhoto;
        }

        function fetchEmployeesForEdit(ids) {
            // Fetch employees by IDs
            fetch(appUrl + "/task/employees-for-executor")
                .then((r) => r.json())
                .then((d) => {
                    employees = d.data || [];
                    selected = employees.filter((emp) => ids.includes(emp.id));
                    renderSelected();
                    updateHidden();
                })
                .catch(() => showAlertMsg("Failed to load employees", "error"));
        }

        function fetchEmployees(q = "") {
            fetch(
                appUrl +
                    "/task/employees-for-executor?q=" +
                    encodeURIComponent(q)
            )
                .then((r) => r.json())
                .then((d) => {
                    employees = d.data || [];
                    filtered = employees;
                    renderDropdown();
                })
                .catch(() => showAlertMsg("Failed to load employees", "error"));
        }

        function renderDropdown() {
            if (filtered.length === 0) {
                dropdown.innerHTML =
                    '<div class="dropdown-item disabled">No employees found</div>';
                dropdown.style.display = "block";
                return;
            }
            dropdown.innerHTML = filtered
                .map((emp) => {
                    const checked = selected.some((s) => s.id === emp.id);
                    const photo = buildPhotoUrl(emp.user_photo);
                    return `<label class='dropdown-item d-flex align-items-center justify-content-between'><div class='d-flex align-items-center'><img src='${photo}' class='rounded-circle me-2' style='width:30px;height:30px;object-fit:cover;'>${
                        emp.name
                    }</div><input type='checkbox' data-id='${emp.id}' ${
                        checked ? "checked" : ""
                    }></label>`;
                })
                .join("");
            dropdown.style.display = "block";
            dropdown.querySelectorAll("input[type=checkbox]").forEach((cb) =>
                cb.addEventListener("change", function () {
                    const id = parseInt(this.getAttribute("data-id"));
                    if (this.checked) {
                        if (!selected.some((s) => s.id === id)) {
                            const emp = employees.find((e) => e.id === id);
                            selected.push({
                                id,
                                name: emp.name,
                                user_photo: emp.user_photo,
                            });
                        }
                    } else {
                        selected = selected.filter((s) => s.id !== id);
                    }
                    renderSelected();
                    renderDropdown();
                    updateHidden();
                })
            );
        }

        function renderSelected() {
            selectedContainer.innerHTML = "";
            selected.forEach((emp) => {
                const photo = buildPhotoUrl(emp.user_photo);
                const badge = document.createElement("span");
                badge.className =
                    "badge bg-primary d-inline-flex align-items-center me-2 mb-2";
                badge.innerHTML = `<img src='${photo}' class='rounded-circle me-2' style='width:24px;height:24px;object-fit:cover;'>${emp.name}<button type='button' class='btn-close btn-close-white btn-sm ms-2'></button>`;
                badge.querySelector("button").addEventListener("click", () => {
                    selected = selected.filter((s) => s.id !== emp.id);
                    renderSelected();
                    renderDropdown();
                    updateHidden();
                });
                selectedContainer.appendChild(badge);
            });
        }

        function updateHidden() {
            hidden.value = JSON.stringify(selected.map((s) => s.id));
        }

        input.addEventListener("input", function () {
            fetchEmployees(this.value.trim());
        });

        input.addEventListener("focus", function () {
            fetchEmployees("");
        });

        document.addEventListener("click", (e) => {
            if (!dropdown.contains(e.target) && e.target !== input) {
                dropdown.style.display = "none";
            }
        });
    }

    function setupEditRecurrenceToggles() {
        const typeSel = document.getElementById(
            "edit_schedule_recurrence_type"
        );
        const weekly = document.getElementById("edit_schedule_weekly_opts");
        const monthly = document.getElementById("edit_schedule_monthly_opts");
        const monthlyDateInput = document.getElementById(
            "edit_schedule_monthly_date"
        );
        const monthlyDayHidden = document.getElementById(
            "edit_schedule_recurrence_day_of_month"
        );

        if (!typeSel || !weekly || !monthly) return;

        function sync() {
            const v = typeSel.value;
            weekly.classList.toggle("d-none", v !== "weekly");
            monthly.classList.toggle("d-none", v !== "monthly");

            if (v === "weekly") {
                const dayOfWeekSelect = document.getElementById(
                    "edit_schedule_recurrence_day_of_week"
                );
                if (dayOfWeekSelect) dayOfWeekSelect.required = true;
            } else {
                const dayOfWeekSelect = document.getElementById(
                    "edit_schedule_recurrence_day_of_week"
                );
                if (dayOfWeekSelect) dayOfWeekSelect.required = false;
            }

            if (v === "monthly") {
                if (!monthlyDayHidden.value) {
                    const today = new Date();
                    monthlyDayHidden.value = today.getDate();
                }
                if (!monthlyDateInput.value) {
                    const today = new Date();
                    const full = today.toLocaleDateString(undefined, {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                    });
                    monthlyDateInput.value = full;
                }
            } else {
            }
        }

        typeSel.addEventListener("change", sync);
        sync();
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

        if (view === "daily") {
            dateTitle.textContent = `${dayName}, ${date} ${monthName} ${year}`;
        } else if (view === "weekly") {
            const weekOfMonth = getWeekOfMonth(now);
            dateTitle.textContent = `Week ${weekOfMonth}, ${monthName} ${year}`;
        } else if (view === "monthly") {
            dateTitle.textContent = `${monthName} ${year}`;
        }
    }

    updateDateTitle("day");

    document.querySelectorAll(".pagination .page-link").forEach((link) => {
        link.addEventListener("click", function (e) {
            e.preventDefault();

            document
                .querySelectorAll(".pagination .page-item")
                .forEach((li) => li.classList.remove("active"));

            this.parentElement.classList.add("active");

            const view = this.getAttribute("data-view");
            updateDateTitle(view);

            const filtered = allSchedules.filter((item) => {
                return (
                    (item.recurrence_type || "").toLowerCase() ===
                    view.toLowerCase()
                );
            });

            createScheduleCard(filtered);
        });
    });

    updateDateTitle("day");

    // Function to fetch schedule detail
    function fetchScheduleDetail(scheduleId) {
        const modalLoader = document.getElementById(
            "detailScheduleModalLoader"
        );
        if (modalLoader) modalLoader.classList.remove("d-none");

        $.ajax({
            url: appUrl + "/schedules/" + scheduleId,
            type: "GET",
            dataType: "json",
            success: function (response) {
                if (response.code === 200) {
                    populateDetailModal(response.data);
                    $("#scheduleDetailModal").modal("show");
                } else {
                    showFloatingAlert(
                        "Failed to load schedule details",
                        "warning",
                        3500
                    );
                }
            },
            error: function (xhr, status, error) {
                console.error(
                    "Error fetching schedule details:",
                    status,
                    error
                );
                showFloatingAlert(
                    "Failed to load schedule details",
                    "warning",
                    3500
                );
            },
            complete: function () {
                if (modalLoader) modalLoader.classList.add("d-none");
            },
        });
    }

    // Function to populate detail modal
    function populateDetailModal(data) {
        const schedule = data.schedule;
        const executors = data.executors || [];

        // Populate schedule card
        const cardContainer = document.getElementById("scheduleDetailCard");
        if (cardContainer) {
            let imageUrl = schedule.image;
            const card = document.createElement("div");
            card.className = "item-card p-4";
            card.style.background = "#F0F1F8";
            card.style.borderRadius = "20px";
            card.innerHTML = `
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div class="d-flex align-items-center">
                        ${
                            imageUrl
                                ? `<img src="${imageUrl}" class="rounded-circle me-2" style="width:34px;height:34px;object-fit:cover;">`
                                : (function () {
                                      const init = getInitials(schedule.title);
                                      const color = getInitialsColor(
                                          schedule.title
                                      );
                                      return `<div class="rounded-circle me-2 d-flex align-items-center justify-content-center" style="width:34px;height:34px;background:${color};color:#fff;font-size:14px;font-weight:600;">${init}</div>`;
                                  })()
                        }
                        <div class="d-flex flex-column">
                            ${
                                schedule.project_id
                                    ? `<small class="text-muted" style="line-height:1; font-size: 10px;">${schedule.project.title}</small>`
                                    : ""
                            }
                            <h6 class="mb-0" style="font-size:14px; font-weight:600;">${
                                schedule.title
                            }</h6>
                        </div>
                    </div>
                </div>
                ${
                    schedule.description
                        ? `<p class="mb-2 small text-muted" style="font-size:12px; line-height:1.4;">${schedule.description}</p>`
                        : ""
                }
                <hr class="my-2 border-3" style="border-top:1px solid #DEDFE7;">
                <div class="d-flex justify-content-between align-items-center">
                    <div style="font-size: 10px; font-weight: 400;">
                        <span style="color: #797E91;">Priority: </span>
                        <span style="color: ${
                            schedule.priority === "HIGH" ? "red" : "#4B4F5E"
                        }">${schedule.priority}</span>
                    </div>
                    <div style="font-size: 10px; font-weight: 400;">
                        <span style="color: #797E91;">Deadline: </span>
                        <span style="#color: #4B4F5E">${
                            schedule.due_date || "-"
                        }</span>
                    </div>
                </div>
            `;
            cardContainer.innerHTML = "";
            cardContainer.appendChild(card);
        }

        // Populate executors
        const executorsContainer = document.getElementById(
            "scheduleDetailExecutors"
        );
        if (executorsContainer) {
            if (executors.length === 0) {
                executorsContainer.innerHTML =
                    "<p class='text-muted mb-0'>No executors assigned</p>";
            } else {
                executorsContainer.innerHTML = executors
                    .map((executor) => {
                        const photo = executor.user_photo
                            ? executor.user_photo.startsWith("http")
                                ? executor.user_photo
                                : appUrl +
                                  "/file/profile_picture/" +
                                  executor.user_photo
                            : appUrl + "/asset/img/avatar.png";
                        return `
                        <div class="d-flex align-items-center p-2 border rounded me-2 mb-2" style="background: white;">
                            <img src="${photo}" class="rounded-circle me-2" style="width:30px;height:30px;object-fit:cover;">
                            <div>
                                <div style="font-size:12px; font-weight:600;">${
                                    executor.name
                                }</div>
                                <div style="font-size:10px; color:#666;">NIK: ${
                                    executor.nik || "-"
                                }</div>
                            </div>
                        </div>
                    `;
                    })
                    .join("");
            }
        }

        // Populate departments and divisions
        const deptDivContainer = document.getElementById(
            "scheduleDetailDepartmentsDivisions"
        );
        if (deptDivContainer) {
            const uniqueDepts = [
                ...new Set(executors.map((e) => e.department).filter((d) => d)),
            ];
            const uniqueDivs = [
                ...new Set(executors.map((e) => e.division).filter((d) => d)),
            ];

            if (uniqueDepts.length === 0 && uniqueDivs.length === 0) {
                deptDivContainer.innerHTML =
                    "<p class='text-muted mb-0'>No department/division information available</p>";
            } else {
                deptDivContainer.innerHTML = `
                    ${
                        uniqueDepts.length > 0
                            ? `<div class="me-3"><strong>Departments:</strong> ${uniqueDepts.join(
                                  ", "
                              )}</div>`
                            : ""
                    }
                    ${
                        uniqueDivs.length > 0
                            ? `<div><strong>Divisions:</strong> ${uniqueDivs.join(
                                  ", "
                              )}</div>`
                            : ""
                    }
                `;
            }
        }
    }

    let scheduleIdToDelete = null;

    function openDeleteModal(scheduleId, scheduleTitle) {
        scheduleIdToDelete = scheduleId;
        document.getElementById("deleteScheduleTitle").innerText =
            scheduleTitle;
        const modal = new bootstrap.Modal(
            document.getElementById("deleteScheduleModal")
        );
        modal.show();
    }

    function deleteSchedule(scheduleId) {
        $.ajax({
            url: `${appUrl}/schedules/${scheduleId}`,
            type: "DELETE",
            data: {
                _token: $('meta[name="csrf-token"]').attr("content"),
            },
            success: function (response) {
                if (response.code === 200) {
                    showFloatingAlert(
                        response.message || "Schedule deleted successfully!",
                        "success",
                        1500
                    );
                    location.reload();
                    fetchScheduleData();
                } else {
                    showFloatingAlert(
                        "Failed to delete schedule: " +
                            (response.message || "Unknown error"),
                        "warning",
                        3500
                    );
                }
            },
            error: function (xhr, status, error) {
                console.error("Response Error", {
                    status: xhr.status,
                    statusText: xhr.statusText,
                    responseText: xhr.responseText,
                    error: error,
                });
                showFloatingAlert(
                    "Terjadi error saat hapus schedule!",
                    "danger",
                    3500
                );
            },
        });
    }

    document
        .getElementById("confirmDeleteBtn")
        .addEventListener("click", function () {
            if (!scheduleIdToDelete) return;
            deleteSchedule(scheduleIdToDelete);
        });

    document.addEventListener("click", function (e) {
        if (
            e.target.closest(".dropdown-item") &&
            e.target.textContent.trim() === "Delete"
        ) {
            e.preventDefault();
            const card = e.target.closest(".col-md-4");
            const scheduleId = card.getAttribute("data-item-id");
            const scheduleTitle =
                card.querySelector("h6")?.textContent.trim() || "this schedule";

            if (scheduleId) {
                openDeleteModal(scheduleId, scheduleTitle);
            }
        }
    });
});
