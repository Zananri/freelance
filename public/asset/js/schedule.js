var appUrl = (
    document.querySelector('meta[name="app-url"]')?.getAttribute("content") ||
    ""
).replace(/\/$/, "");

document.addEventListener("DOMContentLoaded", function () {
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

    // fetch function
    let currentRecurrenceFilter = "";
    let currentSearchFilter = "";
    let searchTimeout = null;

    function fetchScheduleData(page = 1, filter = "", search = "") {
        $.ajax({
            url: appUrl + "/schedules/index",
            type: "GET",
            data: {
                page: page,
                recurrence_type: filter,
                search: search,
            },
            dataType: "json",
            success: function (response) {
                const paginatedItems = response.data.data;
                const totalItems = response.data.total;
                const currentPage = response.data.current_page;
                const perPage = response.data.per_page;

                createScheduleCard(paginatedItems);
                renderPagination(Math.ceil(totalItems / perPage), currentPage);
            },
            error: function (xhr, status, error) {
                console.error("data gagal di fetch", status, error);
                console.log("error", xhr.responseText);
            },
        });
    }

    // Expose a global refresh helper so other modules (e.g., schedule-create.js) can trigger list reload
    window.refreshScheduleList = function () {
        try {
            fetchScheduleData(1, currentRecurrenceFilter, currentSearchFilter);
        } catch (e) {
            // Fallback: reload entire page if something goes wrong
            try {
                window.location.reload();
            } catch (_) {}
        }
    };

    function renderPagination(totalPages, currentPage) {
        const paginationContainer = document.querySelector(".pagination");
        if (!paginationContainer) return;

        // If only one or zero pages, hide pagination
        if (!Number.isFinite(totalPages) || totalPages <= 1) {
            paginationContainer.innerHTML = "";
            return;
        }

        paginationContainer.innerHTML = "";

        // Prev
        const prevLi = document.createElement("li");
        prevLi.className = "page-item" + (currentPage === 1 ? " disabled" : "");
        const prevBtn = document.createElement("button");
        prevBtn.className = "page-link";
        prevBtn.textContent = "Previous";
        prevBtn.addEventListener("click", function (e) {
            e.preventDefault();
            if (currentPage === 1) return;
            fetchScheduleData(
                currentPage - 1,
                currentRecurrenceFilter,
                currentSearchFilter
            );
        });
        prevLi.appendChild(prevBtn);
        paginationContainer.appendChild(prevLi);

        // Numbered pages
        for (let i = 1; i <= totalPages; i++) {
            const li = document.createElement("li");
            li.className = "page-item" + (i === currentPage ? " active" : "");
            const btn = document.createElement("button");
            btn.className = "page-link";
            btn.textContent = i;
            btn.addEventListener("click", function (e) {
                e.preventDefault();
                fetchScheduleData(
                    i,
                    currentRecurrenceFilter,
                    currentSearchFilter
                );
            });
            li.appendChild(btn);
            paginationContainer.appendChild(li);
        }

        // Next
        const nextLi = document.createElement("li");
        nextLi.className =
            "page-item" + (currentPage === totalPages ? " disabled" : "");
        const nextBtn = document.createElement("button");
        nextBtn.className = "page-link";
        nextBtn.textContent = "Next";
        nextBtn.addEventListener("click", function (e) {
            e.preventDefault();
            if (currentPage === totalPages) return;
            fetchScheduleData(
                currentPage + 1,
                currentRecurrenceFilter,
                currentSearchFilter
            );
        });
        nextLi.appendChild(nextBtn);
        paginationContainer.appendChild(nextLi);
    }

    document
        .getElementById("filterScheduleRecurrence")
        .addEventListener("change", function () {
            currentRecurrenceFilter = this.value;
        });

    fetchScheduleData(1, currentRecurrenceFilter, currentSearchFilter);

    // Search input listener
    document
        .getElementById("search_filter")
        .addEventListener("input", function () {
            const searchValue = this.value.trim();
            currentSearchFilter = searchValue;

            clearTimeout(searchTimeout);

            searchTimeout = setTimeout(() => {
                fetchScheduleData(
                    1,
                    currentRecurrenceFilter,
                    currentSearchFilter
                );
            }, 500);
        });

    // Filter apply button
    document
        .getElementById("applyScheduleFilterBtn")
        .addEventListener("click", function () {
            fetchScheduleData(1, currentRecurrenceFilter, currentSearchFilter);
        });

    // Filter reset button
    document
        .getElementById("resetScheduleFilterBtn")
        .addEventListener("click", function () {
            document.getElementById("filterScheduleRecurrence").value = "";
            currentRecurrenceFilter = "";
            fetchScheduleData(1, currentRecurrenceFilter, currentSearchFilter);
        });

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
            let imageUrl;

            if (item.image) {
                const imageUrl = `${appUrl}/file/schedule/${item.image}`;
                imageHtml = `
                <img src="${imageUrl}"
                    class="rounded-circle me-2"
                    style="width:34px;height:34px;object-fit:cover;"
                    onerror="this.onerror=null; this.src='${appUrl}/asset/img/avatar.png'">
            `;
            } else {
                const init = getInitials(item.title);
                const color = getInitialsColor(item.title);
                imageHtml = `
                <div class="rounded-circle me-2 d-flex align-items-center justify-content-center"
                    style="width:34px;height:34px;background:${color};color:#fff;font-size:14px;font-weight:600;">
                    ${init}
                </div>
            `;
            }
            const card = $(`
                <div class="col-md-4 mb-3 d-flex align-items-start position-relative" data-item-id="${
                    item.id
                }">
                                <div class="item-card p-4 w-100" style="background:#F0F1F8; border-radius:20px; display:flex; flex-direction:column; justify-content:space-between;">

                                    <!-- Header -->
                                    <div class="d-flex justify-content-between align-items-start mb-2">
                                        <div class="d-flex align-items-center">
                                            <div class="d-flex justify-content-between align-items-start mb-2">
                                                <div class="d-flex align-items-center">
                                                    ${imageHtml}
                                                </div>
                                            </div>
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

                                    <!-- Separator and Type (Daily/Weekly/Monthly) -->
                                    <div style="margin-top:12px;">
                                        <div style="height:1px;background:#E0E0E0;border-radius:2px;margin-bottom:8px;"></div>
                                        <div style="display:flex;align-items:center;justify-content:flex-start;font-size:10px;color:#4B4F5E;">
                                            <span style="color:#797E91;margin-right:6px;">Type :</span>
                                            <span style="text-transform:capitalize;">${
                                                item.recurrence_type || "-"
                                            }</span>
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

    // Event for Edit Schedule
    document.addEventListener("click", function (e) {
        if (
            e.target.closest(".dropdown-item") &&
            e.target.textContent.trim() === "Edit"
        ) {
            e.preventDefault();
            const card = e.target.closest("[data-item-id]");
            const scheduleId = card ? card.getAttribute("data-item-id") : null;

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
                        fetchScheduleData(
                            1,
                            currentRecurrenceFilter,
                            currentSearchFilter
                        );

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

    // Reset currentPage when filter changes
    document
        .getElementById("filterScheduleRecurrence")
        .addEventListener("change", function () {
            currentPage = 1;
        });

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
        document.getElementById("edit_schedule_start_at").value =
            schedule.start_at || "";
        document.getElementById("edit_schedule_end_at").value =
            schedule.end_at || "";
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
            $("#editScheduleImageLabel").css(
                "background-image",
                "url(" + appUrl + "/file/schedule/" + schedule.image + ")"
            );
            $("#editScheduleImageLabel").addClass("has-image");
            $("#editScheduleImageLabel").css({
                "background-size": "cover",
                opacity: "1",
            });
            $("#editImageClearBtn").removeClass("d-none");
        } else {
            $("#editScheduleImageLabel").removeClass("has-image");
            $("#editScheduleImageLabel").css("opacity", "1");
            $("#editImageClearBtn").addClass("d-none");
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
                const safeUrl = url ?? "";
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

        // (initial fetch moved below after helper initializations to avoid TDZ issues)

        function buildPhotoUrl(userPhoto) {
            if (!userPhoto) return appUrl + "/asset/img/avatar.png";
            if (/^https?:/i.test(userPhoto)) return userPhoto;
            if (userPhoto.startsWith("/")) return appUrl + userPhoto;
            if (userPhoto.startsWith("file/") || userPhoto.startsWith("asset/"))
                return appUrl + "/" + userPhoto;
            return appUrl + "/file/profile_picture/" + userPhoto;
        }

        // Cached fetch helper to reduce duplicate executor loads within schedule views
        const EMP_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
        const empCache = (window.__empExecCache = window.__empExecCache || {
            map: new Map(),
            inFlight: new Map(),
        });
        function fetchEmployeesCached(q = "") {
            const key = String(q || "")
                .trim()
                .toLowerCase();
            const now = Date.now();
            const hit = empCache.map.get(key);
            if (hit && now - hit.t < EMP_CACHE_TTL_MS)
                return Promise.resolve(hit.v);
            if (empCache.inFlight.has(key)) return empCache.inFlight.get(key);
            const p = fetch(
                appUrl +
                    "/task/employees-for-executor?q=" +
                    encodeURIComponent(key)
            )
                .then((r) => (r.ok ? r.json() : Promise.reject(r)))
                .then((d) => {
                    empCache.map.set(key, { v: d, t: Date.now() });
                    empCache.inFlight.delete(key);
                    return d;
                })
                .catch((e) => {
                    empCache.inFlight.delete(key);
                    throw e;
                });
            empCache.inFlight.set(key, p);
            return p;
        }
        function fetchEmployeesForEdit(ids) {
            fetchEmployeesCached("")
                .then((d) => {
                    employees = d.data || d || [];
                    // Exclude administrators
                    employees = employees.filter(
                        (emp) =>
                            String(emp.user_type || "").toUpperCase() !==
                            "ADMINISTRATOR"
                    );
                    selected = employees.filter((emp) => ids.includes(emp.id));
                    renderSelected();
                    updateHidden();
                })
                .catch(() => showAlertMsg("Failed to load employees", "error"));
        }

        // Load initial selected employees if any (deferred until helpers are initialized)
        if (initialExecutorIds.length > 0) {
            fetchEmployeesForEdit(initialExecutorIds);
        }

        function fetchEmployees(q = "") {
            fetchEmployeesCached(q)
                .then((d) => {
                    employees = d.data || d || [];
                    // Exclude administrators
                    employees = employees.filter(
                        (emp) =>
                            String(emp.user_type || "").toUpperCase() !==
                            "ADMINISTRATOR"
                    );
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
        const dateOpts = document.getElementById("edit_schedule_date_opts");
        const startAtDiv = document.getElementById("edit_schedule_start_at_div");
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
            if (dateOpts) {
                if (v === "daily") {
                    dateOpts.style.display = "block";
                } else if (v === "weekly" || v === "monthly") {
                    dateOpts.style.display = "block";
                } else {
                    dateOpts.style.display = "none";
                }
            }

            // hide start_at for daily
            if (startAtDiv) {
                startAtDiv.classList.toggle("d-none", v === "daily");
            }

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

    // Handle edit image input change
    document
        .getElementById("edit_schedule_image")
        .addEventListener("change", function () {
            if (this.files && this.files[0]) {
                const img = document.getElementById(
                    "edit_schedule_current_image_display"
                );
                const label = document.getElementById("editScheduleImageLabel");
                if (img && label) {
                    // Show preview of the newly selected image
                    const reader = new FileReader();
                    reader.onload = function (e) {
                        img.src = e.target.result;
                        img.style.display = "block";
                        label.style.backgroundImage = "none";
                        label.classList.add("has-image");
                    };
                    reader.readAsDataURL(this.files[0]);
                }
                // Clear the hidden current image value since a new image is selected
                document.getElementById("edit_schedule_current_image").value =
                    "";
                const clearBtn = document.getElementById(
                    "editScheduleImageClearBtn"
                );
                if (clearBtn) {
                    clearBtn.classList.remove("d-none");
                }
            }
        });

    // Handle edit image clear button
    document
        .getElementById("editScheduleImageClearBtn")
        .addEventListener("click", function () {
            const img = document.getElementById(
                "edit_schedule_current_image_display"
            );
            if (img) {
                img.style.display = "none";
                img.src = "";
            }
            document.getElementById("edit_schedule_current_image").value = "";
            document.getElementById("edit_schedule_image").value = "";
        });

    // Filter recurrence dropdown listener
    document
        .getElementById("filterScheduleRecurrence")
        .addEventListener("change", function () {
            const recurrenceType = this.value;
            currentRecurrenceFilter = recurrenceType;
        });

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
                    // Close the delete modal after successful deletion
                    const deleteModalEl = document.getElementById("deleteScheduleModal");
                    const deleteModal = bootstrap.Modal.getInstance(deleteModalEl);
                    if (deleteModal) {
                        deleteModal.hide();
                    }
                    fetchScheduleData(
                        1,
                        currentRecurrenceFilter,
                        currentSearchFilter
                    );
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
