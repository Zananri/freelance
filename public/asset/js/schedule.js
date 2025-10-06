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
                                            return `<p class="text-description mb-2 small text-muted">${d}</p>`;
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

    document.addEventListener("submit", function (e) {
        if (e.target.id === "scheduleEditForm") {
            e.preventDefault();

            const form = e.target;

            if (!form.checkValidity()) {
                e.stopPropagation();
                form.classList.add('was-validated');
                showFloatingAlert("Please fill in all required fields.", "warning", 3000);
                return;
            }
            form.classList.remove('was-validated');

            const projectHidden = document.getElementById("edit_schedule_project_id");
            const projectSearchInput = document.getElementById("edit_schedule_project_search");
            if (projectHidden && projectHidden.required && (!projectHidden.value || projectHidden.value.trim() === "")) {
                if (projectSearchInput) {
                    projectSearchInput.classList.add("is-invalid");
                }
                showFloatingAlert("Please select a project.", "warning", 3000);
                return;
            } else {
                if (projectSearchInput) {
                    projectSearchInput.classList.remove("is-invalid");
                }
            }

            const formData = new FormData(form);

            try {
                const newFiles = Array.isArray(window.editScheduleSelectedFiles)
                    ? window.editScheduleSelectedFiles
                    : [];
                newFiles.forEach((f) =>
                    formData.append("reference_files[]", f)
                );
            } catch (e) {
                console.warn("append edit files failed", e);
            }

            formData.append("_method", "PUT");

            formData.append(
                "_token",
                document
                    .querySelector('meta[name="csrf-token"]')
                    .getAttribute("content")
            );

            try {
                const parentHidden = document.getElementById(
                    "edit_schedule_parent_id"
                );
                if (parentHidden) {
                    const pv = parentHidden.value;
                    if (
                        pv &&
                        pv !== "" &&
                        pv !== "null" &&
                        !isNaN(Number(pv))
                    ) {
                        formData.set("parent_id", String(Number(pv)));
                    } else {
                        try {
                            formData.delete("parent_id");
                        } catch (_) {}
                    }
                }
            } catch (_) {}

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

    // Edit modal: manage selected files preview and existing files list
    (function initEditScheduleReferenceFiles() {
        window.editScheduleSelectedFiles =
            window.editScheduleSelectedFiles || [];
        const input = document.getElementById("edit_schedule_reference_files");
        const preview = document.getElementById(
            "edit_schedule_reference_files_preview"
        );

        function renderEditSelectedFiles() {
            if (!preview) return;
            preview
                .querySelectorAll(".selected-files-list")
                .forEach((el) => el.remove());
            if (
                window.editScheduleSelectedFiles &&
                window.editScheduleSelectedFiles.length
            ) {
                const list = document.createElement("div");
                list.className = "selected-files-list mt-2";
                window.editScheduleSelectedFiles.forEach((file, idx) => {
                    const item = document.createElement("div");
                    item.className =
                        "d-flex align-items-center gap-2 p-2 rounded bg-light selected-task mb-2";
                    if (file && file.type && file.type.indexOf("image") === 0) {
                        const img = document.createElement("img");
                        const url = URL.createObjectURL(file);
                        img.src = url;
                        img.width = 28;
                        img.height = 28;
                        img.style.objectFit = "cover";
                        img.style.borderRadius = "50%";
                        img.alt = file.name;
                        img.onload = function () {
                            try {
                                URL.revokeObjectURL(url);
                            } catch (_) {}
                        };
                        item.appendChild(img);
                    } else {
                        const badge = document.createElement("div");
                        item.appendChild(badge);
                    }
                    const title = document.createElement("span");
                    title.className = "flex-grow-1";
                    title.textContent = file.name;
                    item.appendChild(title);
                    const removeBtn = document.createElement("button");
                    removeBtn.type = "button";
                    removeBtn.className =
                        "btn btn-sm btn-remove-task remove-task";
                    removeBtn.style.lineHeight = "1";
                    removeBtn.innerHTML =
                        '<span class="material-symbols-outlined">close</span>';
                    removeBtn.addEventListener("click", () => {
                        window.editScheduleSelectedFiles.splice(idx, 1);
                        renderEditSelectedFiles();
                    });
                    item.appendChild(removeBtn);
                    list.appendChild(item);
                });
                preview.appendChild(list);
            }
        }

        window.displayEditExistingReferenceFiles = function (files) {
            try {
                const existingListId =
                    "edit_schedule_existing_reference_files_list";
                const prev = document.getElementById(existingListId);
                if (prev) prev.remove();
                if (!files || !files.length) return;
                const wrapper = document.createElement("div");
                wrapper.id = existingListId;
                wrapper.className = "existing-files-list mt-2";
                files.forEach((fname) => {
                    const item = document.createElement("div");
                    item.className =
                        "d-flex align-items-center gap-2 p-2 rounded bg-light selected-task mb-2 existing-file-item";
                    const lower = String(fname || "").toLowerCase();
                    const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(
                        lower
                    );
                    if (isImage) {
                        const img = document.createElement("img");
                        img.src =
                            appUrl +
                            "/file/schedule_reference_files/" +
                            encodeURIComponent(fname);
                        img.width = 28;
                        img.height = 28;
                        img.style.objectFit = "cover";
                        img.style.borderRadius = "50%";
                        img.alt = fname;
                        item.appendChild(img);
                    } else {
                        const badge = document.createElement("div");
                        item.appendChild(badge);
                    }
                    const title = document.createElement("span");
                    title.className = "flex-grow-1";
                    title.textContent = fname;
                    item.appendChild(title);
                    const removeBtn = document.createElement("button");
                    removeBtn.type = "button";
                    removeBtn.className =
                        "btn btn-sm btn-remove-task remove-task";
                    removeBtn.style.lineHeight = "1";
                    removeBtn.innerHTML =
                        '<span class="material-symbols-outlined">close</span>';
                    removeBtn.addEventListener("click", function () {
                        item.remove();
                        updateExistingFilesHidden();
                    });
                    item.appendChild(removeBtn);
                    wrapper.appendChild(item);
                });
                if (preview)
                    preview.insertAdjacentElement("afterbegin", wrapper);
                updateExistingFilesHidden();
            } catch (e) {}
        };

        function updateExistingFilesHidden() {
            try {
                const existingItems = document.querySelectorAll(
                    "#edit_schedule_reference_files_preview .existing-file-item"
                );
                const arr = [];
                existingItems.forEach((it) => {
                    const sp = it.querySelector("span.flex-grow-1");
                    if (sp && sp.textContent) arr.push(sp.textContent.trim());
                });

                // bersihin hidden lama
                document
                    .querySelectorAll('input[name="existing_reference_files"]')
                    .forEach((el) => el.remove());

                const form = document.getElementById("scheduleEditForm");
                // Always create a hidden input with JSON array
                const hidden = document.createElement("input");
                hidden.type = "hidden";
                hidden.name = "existing_reference_files";
                hidden.value = JSON.stringify(arr);
                form.appendChild(hidden);
            } catch (e) {}
        }

        if (input) {
            input.addEventListener("change", function () {
                const files = Array.from(this.files || []);
                window.editScheduleSelectedFiles = [
                    ...window.editScheduleSelectedFiles,
                    ...files,
                ];
                renderEditSelectedFiles();
                this.value = "";
            });
        }

        window.displayEditSelectedFiles = renderEditSelectedFiles;

        window.populateEditModal = function (schedule) {
            document.getElementById("edit_schedule_title").value =
                schedule.title || "";
            if (schedule.reference_files) {
                displayEditExistingReferenceFiles(schedule.reference_files);
            }
            displayEditSelectedFiles();
        };
    })();

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
        document.getElementById("edit_schedule_id").value = schedule.id;
        document.getElementById("edit_schedule_title").value =
            schedule.title || "";
        try {
            const desc = schedule.description || "";
            const ta = document.getElementById("edit_schedule_description");
            if (ta) ta.value = desc;
            if (
                window.__quillScheduleEdit &&
                typeof window.__quillScheduleEdit.root !== "undefined"
            ) {
                try {
                    // Use clipboard to insert HTML safely when available; fallback to innerHTML
                    if (
                        typeof window.__quillScheduleEdit.clipboard !==
                            "undefined" &&
                        typeof window.__quillScheduleEdit.clipboard
                            .dangerouslyPasteHTML === "function"
                    ) {
                        window.__quillScheduleEdit.clipboard.dangerouslyPasteHTML(
                            desc || ""
                        );
                    } else if (window.__quillScheduleEdit.root) {
                        window.__quillScheduleEdit.root.innerHTML = desc || "";
                    }
                } catch (e) {
                    try {
                        window.__quillScheduleEdit.root.innerHTML = desc || "";
                    } catch (_) {}
                }
            }
        } catch (e) {
            try {
                document.getElementById("edit_schedule_description").value =
                    schedule.description || "";
            } catch (_) {}
        }
        document.getElementById("edit_schedule_point").value =
            schedule.point || 1;
        document.getElementById("edit_schedule_priority").value =
            schedule.priority || "";
        document.getElementById("edit_schedule_due_in_days").value =
            schedule.due_in_days || "";
        // Use only start_at/end_at for edit modal (do not fallback to legacy start_date/due_date)
        const startVal = schedule.start_at ?? "";
        const endVal = schedule.end_at ?? "";
        const startEl = document.getElementById("edit_schedule_start_at");
        const endEl = document.getElementById("edit_schedule_end_at");

        // Early-parse recurrence days so we can decide whether to touch start_at
        let parsedDays =
            schedule.recurrence_days_of_week ??
            schedule.recurrence_days_of_week_raw ??
            null;
        if (!Array.isArray(parsedDays) && typeof parsedDays === "string") {
            try {
                parsedDays = JSON.parse(parsedDays);
            } catch (e) {
                parsedDays = parsedDays
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .map(Number);
            }
        }
        if (!Array.isArray(parsedDays)) parsedDays = [];

        function toLocalDateInput(val) {
            if (!val) return "";
            const s = String(val).trim();
            // If it's already in YYYY-MM-DD form, return it
            if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
            // Try to extract a YYYY-MM-DD substring first
            const m = s.match(/\d{4}-\d{2}-\d{2}/);
            // Try to parse into Date and use local components to avoid timezone shift
            const d = new Date(s);
            if (!isNaN(d.getTime())) {
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, "0");
                const dd = String(d.getDate()).padStart(2, "0");
                return `${yyyy}-${mm}-${dd}`;
            }
            return (m && m[0]) || "";
        }

        try {
            const newStart = toLocalDateInput(startVal);
            const newEnd = toLocalDateInput(endVal);
            // Debug log to help trace unexpected date shifts (can be removed later)
            if (window.__scheduleDebug)
                console.debug(
                    "populateEditModal: startVal, endVal, parsedDays",
                    startVal,
                    endVal,
                    parsedDays
                );

            // If recurrence is daily and user already selected weekdays (parsedDays non-empty),
            // avoid overwriting an existing start_at value to prevent repeat-adjust behavior.
            const isDailyWithDays =
                schedule.recurrence_type === "daily" && parsedDays.length > 0;
            if (startEl) {
                const shouldSetStart = !isDailyWithDays || !startEl.value;
                if (shouldSetStart) startEl.value = newStart;
                else if (window.__scheduleDebug)
                    console.debug(
                        "populateEditModal: skip setting start_at because daily with selected weekdays and input already has value"
                    );
            }
            if (endEl) endEl.value = newEnd;
        } catch (e) {
            if (startEl)
                startEl.value = (startVal || "").toString().slice(0, 10);
            if (endEl) endEl.value = (endVal || "").toString().slice(0, 10);
        }

        // Sync hidden recurrence start/end fields and compute next run date when start_at or due_in_days changes
        function computeEditDerivedDates() {
            try {
                const startInput = document.getElementById(
                    "edit_schedule_start_at"
                );
                const dueInDaysInput = document.getElementById(
                    "edit_schedule_due_in_days"
                );
                const hiddenStart = document.getElementById(
                    "edit_schedule_recurrence_start_date"
                );
                const hiddenEnd = document.getElementById(
                    "edit_schedule_recurrence_end_date"
                );
                const hiddenNext = document.getElementById(
                    "edit_schedule_next_run_at"
                );
                if (!startInput || !hiddenStart || !hiddenEnd) return;
                // Set recurrence_start_date = start_at
                hiddenStart.value = startInput.value || "";
                // Compute end date = start_at + due_in_days (if provided)
                const days = parseInt(dueInDaysInput?.value || "0", 10);
                if (startInput.value) {
                    const parts = startInput.value
                        .split("-")
                        .map((n) => parseInt(n, 10));
                    if (parts.length === 3 && !parts.some(isNaN)) {
                        const d = new Date(parts[0], parts[1] - 1, parts[2]);
                        if (!isNaN(d.getTime())) {
                            if (!Number.isNaN(days) && days > 0) {
                                const endDate = new Date(d);
                                endDate.setDate(d.getDate() + days);
                                hiddenEnd.value = `${endDate.getFullYear()}-${String(
                                    endDate.getMonth() + 1
                                ).padStart(2, "0")}-${String(
                                    endDate.getDate()
                                ).padStart(2, "0")}`;
                            } else {
                                hiddenEnd.value = "";
                            }
                        }
                    }
                } else {
                    hiddenEnd.value = "";
                }

                // compute next_run_at based on recurrence type
                try {
                    if (!hiddenNext) return;
                    const recurrenceType =
                        document.getElementById("edit_schedule_recurrence_type")
                            ?.value || "";
                    const daysJson =
                        document.getElementById(
                            "edit_schedule_recurrence_days_of_week"
                        )?.value || "[]";
                    let daysArr = [];
                    try {
                        daysArr = JSON.parse(daysJson || "[]");
                    } catch (e) {
                        daysArr = [];
                    }

                    function isoDate(d) {
                        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                    }
                    const parseYMD = (s) => {
                        if (!s) return null;
                        const p = s.split("-").map((n) => parseInt(n, 10));
                        if (p.length !== 3 || p.some(isNaN)) return null;
                        return new Date(p[0], p[1] - 1, p[2]);
                    };
                    const startDate = parseYMD(startInput.value);
                    const today = new Date();
                    let nextRun = null;

                    if (recurrenceType === "daily") {
                        if (Array.isArray(daysArr) && daysArr.length > 0) {
                            const base = startDate || today;
                            for (let i = 0; i < 14; i++) {
                                const cand = new Date(base);
                                cand.setDate(base.getDate() + i);
                                if (daysArr.includes(cand.getDay())) {
                                    nextRun = cand;
                                    break;
                                }
                            }
                        } else {
                            nextRun = startDate || today;
                        }
                    } else if (recurrenceType === "weekly") {
                        const dow = parseInt(
                            document.getElementById(
                                "edit_schedule_recurrence_day_of_week"
                            )?.value
                        );
                        if (!isNaN(dow)) {
                            const base = startDate || today;
                            for (let i = 0; i < 14; i++) {
                                const cand = new Date(base);
                                cand.setDate(base.getDate() + i);
                                if (cand.getDay() === dow) {
                                    nextRun = cand;
                                    break;
                                }
                            }
                        }
                    } else if (recurrenceType === "monthly") {
                        const dom = parseInt(
                            document.getElementById(
                                "edit_schedule_recurrence_day_of_month"
                            )?.value
                        );
                        const base = startDate || today;
                        if (!isNaN(dom) && dom > 0) {
                            let cand = null;
                            for (let i = 0; i < 12; i++) {
                                const tryDate = new Date(
                                    base.getFullYear(),
                                    base.getMonth() + i,
                                    1
                                );
                                const daysInMonth = new Date(
                                    tryDate.getFullYear(),
                                    tryDate.getMonth() + 1,
                                    0
                                ).getDate();
                                const day = Math.min(dom, daysInMonth);
                                cand = new Date(
                                    tryDate.getFullYear(),
                                    tryDate.getMonth(),
                                    day
                                );
                                if (startDate) {
                                    if (cand.getTime() >= startDate.getTime()) {
                                        nextRun = cand;
                                        break;
                                    }
                                } else {
                                    nextRun = cand;
                                    break;
                                }
                            }
                        } else if (startDate) {
                            nextRun = startDate;
                        }
                    }

                    if (nextRun) {
                        hiddenNext.value = isoDate(nextRun);
                    } else {
                        hiddenNext.value = "";
                    }
                } catch (e) {}
            } catch (e) {}
        }

        // Attach listeners so when user edits start_at or due_in_days in edit modal we recompute derived dates
        try {
            const hiddenNext = document.getElementById(
                "edit_schedule_next_run_at"
            );
            const startInputEdit = document.getElementById(
                "edit_schedule_start_at"
            );
            const dueInEdit = document.getElementById(
                "edit_schedule_due_in_days"
            );
            if (startInputEdit)
                startInputEdit.addEventListener("change", function () {
                    computeEditDerivedDates();
                });
            if (dueInEdit)
                dueInEdit.addEventListener("input", function () {
                    computeEditDerivedDates();
                });
            // run once to initialize
            computeEditDerivedDates();
        } catch (e) {}
        document.getElementById("edit_schedule_recurrence_type").value =
            schedule.recurrence_type || "";

        // Handle recurrence options
        handleEditRecurrenceChange(
            schedule.recurrence_type,
            schedule.recurrence_day_of_week,
            schedule.recurrence_day_of_month
        );

        // include_weekend removed

        // Handle image
        if (schedule.image) {
            // Set label background and show clear button
            $("#editScheduleImageLabel").css(
                "background-image",
                "url(" + appUrl + "/file/schedule/" + schedule.image + ")"
            );
            $("#editScheduleImageLabel").addClass("has-image");
            $("#editScheduleImageLabel").css({
                "background-size": "cover",
                opacity: "1",
            });
            // correct clear button id
            $("#editScheduleImageClearBtn").removeClass("d-none");
        } else {
            $("#editScheduleImageLabel").removeClass("has-image");
            $("#editScheduleImageLabel").css("opacity", "1");
            $("#editScheduleImageClearBtn").addClass("d-none");
        }

        // Handle reference URLs
        populateEditReferenceUrls(schedule.reference_urls || []);

        // Handle reference files (existing on server)
        try {
            let refFiles =
                schedule.reference_files ?? schedule.reference_files_raw ?? [];
            if (typeof refFiles === "string") {
                try {
                    refFiles = JSON.parse(refFiles);
                } catch (e) {
                    refFiles = refFiles
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean);
                }
            }
            if (!Array.isArray(refFiles)) refFiles = [];
            // expose existing files list and render into preview
            if (
                typeof window.displayEditExistingReferenceFiles === "function"
            ) {
                window.displayEditExistingReferenceFiles(refFiles);
            }
            // reset any previously selected new files for edit modal
            window.editScheduleSelectedFiles = [];
            if (typeof window.displayEditSelectedFiles === "function")
                window.displayEditSelectedFiles();
        } catch (e) {
            console.warn(
                "populateEditModal: failed render existing reference files",
                e
            );
        }

        // Handle executors
        populateEditExecutors(schedule.executor_ids || []);

        // Set division select value for edit modal (do not dispatch change to avoid overwriting selected executors)
        try {
            const divSel = document.getElementById("edit_schedule_division_id");
            if (divSel) {
                let divId = null;
                if (schedule.division_id) divId = schedule.division_id;
                else if (
                    schedule.division &&
                    (schedule.division.id || schedule.division.division_id)
                )
                    divId =
                        schedule.division.id || schedule.division.division_id;
                else if (
                    schedule.project &&
                    schedule.project.division &&
                    (schedule.project.division.id ||
                        schedule.project.division.division_id)
                )
                    divId =
                        schedule.project.division.id ||
                        schedule.project.division.division_id;

                if (divId) {
                    // try to select if option exists, else add temporary option then select
                    const opt = divSel.querySelector(
                        'option[value="' + divId + '"]'
                    );
                    if (!opt) {
                        const tmp = document.createElement("option");
                        tmp.value = divId;
                        tmp.text = "Division #" + divId;
                        divSel.appendChild(tmp);
                    }
                    divSel.value = divId;
                } else {
                    // attempt to match by name if provided
                    const divName =
                        schedule.division ||
                        (schedule.project &&
                            schedule.project.division &&
                            (schedule.project.division.name_division ||
                                schedule.project.division.name ||
                                ""));
                    if (divName) {
                        // try find option by text content
                        const opts = Array.from(divSel.options || []);
                        const found = opts.find(
                            (o) =>
                                String(o.textContent || o.innerText || "")
                                    .trim()
                                    .toLowerCase() ===
                                String(divName).trim().toLowerCase()
                        );
                        if (found) divSel.value = found.value;
                    }
                }
            }
        } catch (e) {
            /* ignore */
        }

        // After setting division value, automatically seed executors for edit modal
        try {
            const divSel2 = document.getElementById(
                "edit_schedule_division_id"
            );
            if (divSel2 && divSel2.value) {
                const val = divSel2.value;
                const selectedName =
                    divSel2.selectedOptions &&
                    divSel2.selectedOptions[0] &&
                    divSel2.selectedOptions[0].dataset &&
                    divSel2.selectedOptions[0].dataset.name
                        ? divSel2.selectedOptions[0].dataset.name
                        : "";
                fetch(appUrl + "/employees-for-projects")
                    .then((r) => (r.ok ? r.json() : Promise.reject("fail")))
                    .then((res) => {
                        const arr = (res && res.data) || [];
                        const nameLower = String(
                            selectedName || ""
                        ).toLowerCase();
                        const filteredByName = arr.filter(
                            (emp) =>
                                String(emp.division || "").toLowerCase() ===
                                nameLower
                        );
                        const filteredById = arr.filter(
                            (emp) =>
                                String(emp.division_id || "").toLowerCase() ===
                                String(val).toLowerCase()
                        );
                        const final = filteredByName.length
                            ? filteredByName
                            : filteredById.length
                            ? filteredById
                            : [];
                        if (!final.length) return; // do not overwrite existing selected executors if none found
                        const mapped = final.map((e) => ({
                            id: e.id,
                            name: e.name || e.full_name || "",
                            user_photo: e.user_photo || e.profile_picture || "",
                        }));
                        try {
                            window.setSelectedExecutorsEdit?.(mapped);
                        } catch (_) {}
                    })
                    .catch(() => {
                        // ignore fetch failure on auto-seed: keep existing executor selection
                    });
            }
        } catch (e) {
            /* ignore */
        }

        // Load projects for edit modal and set the selected project
        loadProjectsForEdit(schedule.project_id, schedule.parent_id, schedule.parent ? schedule.parent.title : null);

        try {
            const parentId = schedule.parent_id || null;
            if (!schedule.project_id && parentId) {
                // If schedule has parent_id but no project context, fetch task details and populate the edit parent display
                try {
                    fetch(
                        appUrl + "/task/" + encodeURIComponent(String(parentId))
                    )
                        .then((r) => (r.ok ? r.json() : Promise.reject(r)))
                        .then((res) => {
                            const t = (res && (res.data || res)) || null;
                            if (!t || !t.id) return;
                            const input = document.getElementById(
                                "edit_schedule_parent_input"
                            );
                            const hidden = document.getElementById(
                                "edit_schedule_parent_id"
                            );
                            const selectedContainer = document.getElementById(
                                "edit_schedule_selected_parent"
                            );
                            if (hidden) hidden.value = t.id;
                            if (input)
                                input.value =
                                    t.title || (t.id ? "Task #" + t.id : "");
                            if (selectedContainer) {
                                const avatarHtml = t.image
                                    ? `<img src="${appUrl}/file/task/${t.image}" width="28" height="28" style="object-fit:cover;border-radius:50%;">`
                                    : `<div style="width:28px;height:28px;border-radius:50%;background:#6A5AE0;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:600;">${(
                                          t.title || "?"
                                      )
                                          .charAt(0)
                                          .toUpperCase()}</div>`;
                                selectedContainer.innerHTML = `<div class="d-flex align-items-center gap-2 p-2 rounded bg-light selected-task">${avatarHtml}<span class="flex-grow-1">${
                                    t.title || "Task #" + t.id
                                }</span><button type="button" class="btn btn-sm btn-remove-task remove-task" style="line-height:1"><span class="material-symbols-outlined">close</span></button></div>`;
                                const btn =
                                    selectedContainer.querySelector(
                                        ".remove-task"
                                    );
                                if (btn)
                                    btn.addEventListener("click", function () {
                                        if (hidden) hidden.value = "";
                                        if (input) input.value = "";
                                        selectedContainer.innerHTML = "";
                                    });
                            }
                        })
                        .catch(() => {});
                } catch (_) {}
            }
        } catch (e) {
            console.warn("populateEditModal parent init failed", e);
        }

        // Setup reference URL functionality for edit modal
        // recompute next_run_at when recurrence type or recurrence day changes
        try {
            const recType = document.getElementById(
                "edit_schedule_recurrence_type"
            );
            const recDow = document.getElementById(
                "edit_schedule_recurrence_day_of_week"
            );
            const recDays = document.getElementById(
                "edit_schedule_recurrence_days_of_week"
            );
            const recDom = document.getElementById(
                "edit_schedule_recurrence_day_of_month"
            );
            if (recType)
                recType.addEventListener("change", function () {
                    computeEditDerivedDates();
                });
            if (recDow)
                recDow.addEventListener("change", function () {
                    computeEditDerivedDates();
                });
            if (recDays)
                recDays.addEventListener("change", function () {
                    computeEditDerivedDates();
                });
            if (recDom)
                recDom.addEventListener("change", function () {
                    computeEditDerivedDates();
                });
        } catch (e) {}
        setupEditReferenceUrls();

        // Setup recurrence toggle functionality for edit modal
        setupEditRecurrenceToggles();

        // Setup/edit weekday picker state for daily recurrence
        try {
            const buttonsContainer = document.getElementById(
                "edit_schedule_daily_weekdays_buttons"
            );
            const hidden = document.getElementById(
                "edit_schedule_recurrence_days_of_week"
            );
            if (hidden && buttonsContainer) {
                // initialize hidden value from schedule (controller may send recurrence_days_of_week as array or comma string)
                let days =
                    schedule.recurrence_days_of_week ??
                    schedule.recurrence_days_of_week_raw ??
                    null;
                if (!Array.isArray(days) && typeof days === "string") {
                    try {
                        days = JSON.parse(days);
                    } catch (e) {
                        days = days
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean)
                            .map(Number);
                    }
                }
                if (!Array.isArray(days)) days = [];
                hidden.value = JSON.stringify(days);
                // Update buttons: use weekday-selected class for consistency with create modal
                buttonsContainer
                    .querySelectorAll(".edit-weekday-btn")
                    .forEach((btn) => {
                        const d = parseInt(btn.getAttribute("data-day"));
                        // initialize accessible pressed state and classes
                        btn.setAttribute("aria-pressed", "false");
                        if (days.includes(d)) {
                            btn.classList.add("weekday-selected");
                            btn.classList.add("active");
                            btn.classList.remove("btn-outline-secondary");
                            btn.setAttribute("aria-pressed", "true");
                        } else {
                            btn.classList.remove("weekday-selected");
                            btn.classList.remove("active");
                            btn.classList.add("btn-outline-secondary");
                            btn.setAttribute("aria-pressed", "false");
                        }
                    });
            }
        } catch (e) {
            /* ignore */
        }
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
                row.className = "input-group";
                row.innerHTML = `<input type='url' class='form-control input-text' name='reference_urls[]' placeholder='https://example.com'><button type='button' class='btn btn-remove-url remove-ref-url'><span class='material-symbols-outlined'>close</span></button>`;
                container.appendChild(row);
            }
            if (
                e.target.closest(".remove-ref-url") &&
                e.target.closest("#edit_schedule_reference_urls_container")
            ) {
                const row = e.target.closest(".input-group");
                if (row) row.remove();
            }
        });
    }

    function loadProjectsForEdit(selectedProjectId = null, selectedParentId = null, selectedParentTitle = null) {
        const input = document.getElementById("edit_schedule_project_search");
        const dropdown = document.getElementById(
            "edit_schedule_project_dropdown"
        );
        const selectedContainer = document.getElementById(
            "edit_schedule_selected_project"
        );
        const hiddenInput = document.getElementById("edit_schedule_project_id");

        if (!input || !dropdown || !selectedContainer || !hiddenInput) return;

        let projects = [];

        function renderDropdown(filter = "") {
            dropdown.innerHTML = "";
            let filtered = projects.filter((p) =>
                p.title.toLowerCase().includes(filter.toLowerCase())
            );

            filtered.forEach((p) => {
                let avatarHtml = p.image
                    ? `<img src="${appUrl}/file/project/${p.image}" width="24" height="24" style="object-fit:cover;border-radius:50%;"/>`
                    : `<div class="rounded-circle d-flex align-items-center justify-content-center"
                            style="width:24px;height:24px;background:#6A5AE0;color:#fff;font-size:12px;">
                            ${p.title.charAt(0).toUpperCase()}
                    </div>`;

                const item = document.createElement("div");
                item.className =
                    "dropdown-item d-flex align-items-center gap-2";
                item.innerHTML = `${avatarHtml}<span>${p.title}</span>`;
                item.addEventListener("click", () => {
                    hiddenInput.value = p.id; // isi ke hidden
                    input.value = p.title; // tampil di text box
                    dropdown.style.display = "none";
                    showSelectedProject(p);
                });
                dropdown.appendChild(item);
            });

            dropdown.style.display = filtered.length ? "block" : "none";
        }

        function showSelectedProject(p) {
            selectedContainer.innerHTML = `
                <div class="d-flex align-items-center gap-2 p-2 rounded bg-light selected-project">
                    ${
                        p.image
                            ? `<img src="${appUrl}/file/project/${p.image}" width="28" height="28" style="object-fit:cover;border-radius:50%;">`
                            : `<div class="rounded-circle d-flex align-items-center justify-content-center"
                                    style="width:28px;height:28px;background:#6A5AE0;color:#fff;font-size:14px;">
                                    ${p.title.charAt(0).toUpperCase()}
                            </div>`
                    }
                    <span class="flex-grow-1">${p.title}</span>
                    <button type="button" class="btn btn-sm btn-remove-project" style="line-height:1">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
            `;

            selectedContainer
                .querySelector(".btn-remove-project")
                .addEventListener("click", () => {
                    hiddenInput.value = "";
                    input.value = "";
                    selectedContainer.innerHTML = "";
                    // Clear related task when project is removed
                    try {
                        const pinput = document.getElementById('edit_schedule_parent_input'); if(pinput) pinput.value = '';
                        const phidden = document.getElementById('edit_schedule_parent_id'); if(phidden) phidden.value = '';
                        const selContainer = document.getElementById('edit_schedule_selected_parent'); if(selContainer) selContainer.innerHTML = '';
                    } catch(_){}
                });

            // Load tasks for this project into the edit schedule parent selector
            try { loadRelatedTasks(p.id, 'edit_schedule', selectedParentId, selectedParentTitle); } catch(_) {}
        }

        fetch(appUrl + "/project/index?task_scope=all")
            .then((res) => res.json())
                .then((payload) => {
                    projects = (payload.data || [])
                        .filter(p => !p.project_type || String(p.project_type) === 'public')
                        .map((p) => ({
                            id: p.id,
                            title: p.title,
                            image: p.image || "",
                        }));

                if (selectedProjectId) {
                    const selected = projects.find(
                        (p) => p.id == selectedProjectId
                    );
                    if (selected) {
                        hiddenInput.value = selected.id;
                        input.value = selected.title;
                        showSelectedProject(selected);
                    }
                }
            })
            .catch((err) => console.error("Error loading projects:", err));

        input.addEventListener("input", () => renderDropdown(input.value));
        input.addEventListener("focus", () => renderDropdown(input.value));

        document.addEventListener("click", (e) => {
            if (!dropdown.contains(e.target) && e.target !== input) {
                dropdown.style.display = "none";
            }
        });
    }

    function handleEditRecurrenceChange(recurrenceType, dayOfWeek, dayOfMonth) {
        const weeklyOpts = document.getElementById("edit_schedule_weekly_opts");
        const monthlyOpts = document.getElementById(
            "edit_schedule_monthly_opts"
        );
        const startAtDiv = document.getElementById(
            "edit_schedule_start_at_div"
        );

        if (!weeklyOpts || !monthlyOpts || !startAtDiv) {
            return;
        }

        if (recurrenceType === "weekly") {
            weeklyOpts.classList.remove("d-none");
            monthlyOpts.classList.add("d-none");
            startAtDiv.classList.remove("d-none");
            if (dayOfWeek !== null && dayOfWeek !== undefined) {
                const dowElem = document.getElementById(
                    "edit_schedule_recurrence_day_of_week"
                );
                if (dowElem) dowElem.value = dayOfWeek;
            }
        } else if (recurrenceType === "monthly") {
            weeklyOpts.classList.add("d-none");
            monthlyOpts.classList.remove("d-none");
            startAtDiv.classList.remove("d-none");
            if (dayOfMonth !== null && dayOfMonth !== undefined) {
                const domElem = document.getElementById(
                    "edit_schedule_recurrence_day_of_month"
                );
                if (domElem) domElem.value = dayOfMonth;
            }
        } else if (recurrenceType === "daily") {
            weeklyOpts.classList.add("d-none");
            monthlyOpts.classList.add("d-none");
            startAtDiv.classList.remove("d-none"); // Show start_at for daily in edit modal
        } else {
            weeklyOpts.classList.add("d-none");
            monthlyOpts.classList.add("d-none");
            startAtDiv.classList.add("d-none");
        }

        // include_weekend removed
    }

    function populateEditReferenceUrls(urls) {
        const container = document.getElementById(
            "edit_schedule_reference_urls_container"
        );
        if (!container) return;

        container.innerHTML = "";

        if (!urls || urls.length === 0) {
            const row = document.createElement("div");
            row.className = "input-group";
            row.innerHTML = `
                <input type='url' class='form-control input-text' name='reference_urls[]' placeholder='https://example.com'>
                <button type='button' class='btn btn-submit-black add-ref-url' aria-label='Add URL'>
                    <span class='material-symbols-outlined'>add</span>
                </button>`;
            container.appendChild(row);
        } else {
            urls.forEach((url, idx) => {
                const safeUrl = url ?? "";
                const row = document.createElement("div");
                row.className = "input-group";
                row.innerHTML = `
                    <input type='url' class='form-control input-text' name='reference_urls[]' value='${safeUrl}' placeholder='https://example.com'>
                    <button type='button' class='btn ${
                        idx === 0
                            ? "btn-submit-black add-ref-url"
                            : "btn-remove-url remove-ref-url"
                    }'>
                        <span class='material-symbols-outlined'>${
                            idx === 0 ? "add" : "close"
                        }</span>
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

        function buildPhotoUrl(userPhoto) {
            if (!userPhoto) return appUrl + "/asset/img/avatar.png";
            if (/^https?:/i.test(userPhoto)) return userPhoto;
            if (userPhoto.startsWith("/")) return appUrl + userPhoto;
            if (userPhoto.startsWith("file/") || userPhoto.startsWith("asset/"))
                return appUrl + "/" + userPhoto;
            return appUrl + "/file/profile_picture/" + userPhoto;
        }

        const EMP_CACHE_TTL_MS = 5 * 60 * 1000;
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

        function fetchAllEmployees() {
            return fetchEmployeesCached("")
                .then((d) => {
                    employees = (d.data || d || []).filter(
                        (emp) =>
                            String(emp.user_type || "").toUpperCase() !==
                            "ADMINISTRATOR"
                    );
                    filtered = employees;
                    return employees;
                })
                .catch(() => {
                    showAlertMsg("Failed to load employees", "error");
                    return [];
                });
        }

        function renderDropdown() {
            if (filtered.length === 0) {
                dropdown.innerHTML =
                    '<div class="dropdown-item disabled">No employees found</div>';
                return;
            }
            dropdown.innerHTML = filtered
                .map((emp) => {
                    const checked = selected.some((s) => s.id === emp.id);
                    const photo = buildPhotoUrl(emp.user_photo);
                    return `<label class='dropdown-item d-flex align-items-center justify-content-between'>
                    <div class='d-flex align-items-center'>
                        <img src='${photo}' class='rounded-circle me-2' style='width:30px;height:30px;object-fit:cover;'>
                        <div class='d-flex flex-column'>
                            <span class='executor-name'>${emp.name}</span>
                            <small class='text-muted executor-division'>${
                                emp.division || emp.division_name || ""
                            }</small>
                        </div>
                    </div>
                    <input type='checkbox' data-id='${emp.id}' ${
                        checked ? "checked" : ""
                    }>
                </label>`;
                })
                .join("");

            // Bind change listeners so selections persist and preview updates
            dropdown
                .querySelectorAll('input[type=checkbox]')
                .forEach((cb) => {
                    cb.addEventListener('change', function () {
                        const id = parseInt(this.getAttribute('data-id'));
                        if (this.checked) {
                            if (!selected.some((s) => s.id === id)) {
                                const emp = employees.find((e) => e.id === id) || {};
                                selected.push({
                                    id,
                                    name: emp.name || '',
                                    user_photo: emp.user_photo || '',
                                    division: emp.division || emp.division_name || '',
                                });
                            }
                        } else {
                            selected = selected.filter((s) => s.id !== id);
                        }
                        renderSelected();
                        updateHidden();
                        renderDropdown();
                    });
                });
        }

        function renderSelected() {
            selectedContainer.innerHTML = "";
            selected.forEach((emp) => {
                const photoUrl = buildPhotoUrl(emp.user_photo);
                const badge = document.createElement("span");
                badge.className =
                    "badge fw-normal bg-light d-inline-flex align-items-center me-2 mb-2";

                const img = document.createElement("img");
                img.src = photoUrl;
                img.alt = emp.name;
                img.className = "rounded-circle me-2";
                img.style.width = "24px";
                img.style.height = "24px";
                img.style.objectFit = "cover";

                const nameCol = document.createElement("div");
                nameCol.className = "d-flex flex-column";
                const nameText = document.createElement("span");
                nameText.textContent = emp.name || "";
                nameText.style.marginBottom = "5px";

                const divSmall = document.createElement("small");
                divSmall.className = "text-muted executor-division";
                divSmall.textContent = emp.division || "";

                nameCol.appendChild(nameText);
                nameCol.appendChild(divSmall);

                const removeBtn = document.createElement("button");
                removeBtn.type = "button";
                removeBtn.className = "btn-close btn-sm ms-2";
                removeBtn.setAttribute("aria-label", "Remove");
                removeBtn.addEventListener("click", () => {
                    selected = selected.filter((e) => e.id !== emp.id);
                    renderSelected();
                    updateHidden();
                });

                badge.appendChild(img);
                badge.appendChild(nameCol);
                badge.appendChild(removeBtn);
                selectedContainer.appendChild(badge);
            });
        }

        function updateHidden() {
            hidden.value = JSON.stringify(selected.map((s) => s.id));
        }

        function filterEmployeesByName(val) {
            const v = String(val || "")
                .trim()
                .toLowerCase();
            filtered = !v
                ? employees
                : employees.filter((emp) =>
                      (emp.name || "").toLowerCase().includes(v)
                  );
            renderDropdown();
        }

        input.addEventListener("input", function () {
            filterEmployeesByName(this.value);
            dropdown.style.display = "block";
        });

        input.addEventListener("focus", function () {
            filterEmployeesByName(this.value);
            dropdown.style.display = "block";
        });

        document.addEventListener("click", (e) => {
            if (!dropdown.contains(e.target) && e.target !== input) {
                dropdown.style.display = "none";
            }
        });

        window.__scheduleEditExecPicker = {
            clear: function () {
                selected = [];
                renderSelected();
                updateHidden();
                dropdown.innerHTML = "";
            },
            set: async function (arr) {
                await fetchAllEmployees();
                if (!Array.isArray(arr)) return;
                selected = arr.map((a) => {
                    const empData = employees.find((e) => e.id === a.id);
                    return {
                        id: a.id,
                        name:
                            a.name ||
                            a.full_name ||
                            (empData ? empData.name : ""),
                        user_photo:
                            a.user_photo || (empData ? empData.user_photo : ""),
                        division: empData
                            ? empData.division || empData.division_name || ""
                            : "",
                    };
                });
                renderSelected();
                updateHidden();
                renderDropdown();
            },
        };

    // Expose setter for edit modal to allow other modules to seed selected executors
    window.setSelectedExecutorsEdit = execs => window.__scheduleEditExecPicker && typeof window.__scheduleEditExecPicker.set === 'function' ? window.__scheduleEditExecPicker.set(execs||[]) : null;

        // Pastikan fetch semua employee sebelum set initialExecutorIds
        if (initialExecutorIds.length > 0) {
            fetchAllEmployees().then(() => {
                window.__scheduleEditExecPicker.set(
                    initialExecutorIds.map((id) => ({ id }))
                );
            });
        }

        dropdown.style.display = "none"; // Dropdown hide awalnya
    }

    function setupEditRecurrenceToggles() {
        const typeSel = document.getElementById(
            "edit_schedule_recurrence_type"
        );
        const weekly = document.getElementById("edit_schedule_weekly_opts");
        const monthly = document.getElementById("edit_schedule_monthly_opts");
        const dateOpts = document.getElementById("edit_schedule_date_opts");
        const startAtDiv = document.getElementById(
            "edit_schedule_start_at_div"
        );
        const monthlyDateInput = document.getElementById(
            "edit_schedule_monthly_date"
        );
        const monthlyDayHidden = document.getElementById(
            "edit_schedule_recurrence_day_of_month"
        );

        if (!typeSel || !weekly || !monthly) return;

        function updateEditWeeklyStartDate() {
            try {
                const weeklyDay = document.getElementById(
                    "edit_schedule_recurrence_day_of_week"
                );
                const startAt = document.getElementById(
                    "edit_schedule_start_at"
                );
                if (!weeklyDay || !startAt) return;
                const selectedDow = parseInt(weeklyDay.value);
                if (Number.isNaN(selectedDow)) return;
                const today = new Date();
                const currentDow = today.getDay();
                let daysToAdd = selectedDow - currentDow;
                if (daysToAdd <= 0) daysToAdd += 7; // ensure next occurrence (today -> next week)
                const newDate = new Date(today);
                newDate.setDate(today.getDate() + daysToAdd);
                startAt.value = newDate.toISOString().split("T")[0];
                if (window.__scheduleDebug)
                    console.debug("updateEditWeeklyStartDate", {
                        selectedDow,
                        currentDow,
                        daysToAdd,
                        startAt: startAt.value,
                    });
            } catch (e) {}
        }

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

            // hide start_at for daily in create modal, but show in edit modal
            if (startAtDiv) {
                startAtDiv.classList.remove("d-none"); // Always show in edit modal
            }

            if (v === "weekly") {
                const dayOfWeekSelect = document.getElementById(
                    "edit_schedule_recurrence_day_of_week"
                );
                if (dayOfWeekSelect) dayOfWeekSelect.required = true;
                // update start_at to the next occurrence of selected weekday (same behavior as create modal)
                updateEditWeeklyStartDate();
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

            // Toggle include_weekend visibility in edit modal
            // include_weekend removed

            // Toggle weekday picker visibility for edit modal when daily
            try {
                const editDaily = document.getElementById(
                    "edit_schedule_daily_weekdays"
                );
                if (editDaily)
                    editDaily.classList.toggle("d-none", v !== "daily");
            } catch (e) {}
        }

        typeSel.addEventListener("change", sync);
        sync();
        // Attach change listener to weekly select so user selection immediately adjusts start_at
        try {
            const editWeeklyDay = document.getElementById(
                "edit_schedule_recurrence_day_of_week"
            );
            if (editWeeklyDay)
                editWeeklyDay.addEventListener(
                    "change",
                    updateEditWeeklyStartDate
                );
        } catch (e) {}
    }

    // Setup edit modal weekday buttons handler
    (function setupEditWeekdayButtons() {
        const container = document.getElementById(
            "edit_schedule_daily_weekdays_buttons"
        );
        const hidden = document.getElementById(
            "edit_schedule_recurrence_days_of_week"
        );
        if (!container || !hidden) return;
        function getSel() {
            try {
                return JSON.parse(hidden.value || "[]").map((d) => parseInt(d));
            } catch (e) {
                return [];
            }
        }
        function setSel(arr) {
            try {
                const vals = Array.from(
                    new Set((arr || []).map(Number))
                ).filter((n) => !Number.isNaN(n));
                hidden.value = JSON.stringify(vals);
            } catch (e) {
                hidden.value = JSON.stringify([]);
            }
        }
        container.querySelectorAll(".edit-weekday-btn").forEach((btn) =>
            btn.addEventListener("click", function () {
                const day = parseInt(this.getAttribute("data-day"));
                let sel = getSel();
                if (sel.includes(day)) {
                    sel = sel.filter((s) => s !== day);
                    this.classList.remove("weekday-selected");
                    this.classList.remove("active");
                    this.classList.add("btn-outline-secondary");
                    this.setAttribute("aria-pressed", "false");
                } else {
                    sel.push(day);
                    this.classList.add("weekday-selected");
                    this.classList.add("active");
                    this.classList.remove("btn-outline-secondary");
                    this.setAttribute("aria-pressed", "true");
                }
                setSel(sel);
            })
        );
        // expose for debug
        window.__editScheduleWeekdayPicker = { get: getSel, set: setSel };
    })();

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

    function openDeleteModal(scheduleId, scheduleTitle, imageUrl) {
        scheduleIdToDelete = scheduleId;

        // Fetch schedule details and render modal content similar to Task delete modal
        try {
            const contentEl = document.getElementById("deleteScheduleContent");
            // show loader immediately
            if (contentEl)
                contentEl.innerHTML =
                    '<div class="text-center p-3"><div class="spinner-border spinner-border-sm"></div></div>';

            // Use the API endpoint that includes department/division info: GET /get-schedule-data/{id}
            fetch(appUrl + "/get-schedule-data/" + scheduleId, {
                headers: { Accept: "application/json" },
            })
                .then((res) => (res.ok ? res.json() : Promise.reject(res)))
                .then((data) => {
                    // The controller returns an object with data => { schedule, executors, department, division }
                    const payload = data.data || data;
                    const schedule = payload.schedule || payload;
                    let avatarHtml = "";

                    // Determine image URL similar to task.js logic
                    if (schedule && schedule.image) {
                        let imgUrl = String(schedule.image || "");
                        const isAbsolute =
                            imgUrl.startsWith("http://") ||
                            imgUrl.startsWith("https://");
                        const isFile =
                            imgUrl.startsWith("/file/schedule/") ||
                            imgUrl.startsWith("file/schedule/");
                        const isPublic =
                            imgUrl.startsWith("/storage/") ||
                            imgUrl.startsWith("storage/");

                        if (!isAbsolute && !isFile && !isPublic) {
                            imgUrl = appUrl + "/file/schedule/" + imgUrl;
                        } else if (!isAbsolute && (isFile || isPublic)) {
                            imgUrl = imgUrl.startsWith("/")
                                ? appUrl + imgUrl
                                : appUrl + "/" + imgUrl;
                        }

                        avatarHtml = `<img src="${imgUrl}" alt="Schedule Image" class="rounded-circle me-3" style="width:34px;height:34px;object-fit:cover;" onerror="this.onerror=null;this.src='${appUrl}/asset/img/avatar.png'">`;
                    } else {
                        const initials = getInitials(scheduleTitle);
                        const color = getInitialsColor(scheduleTitle);
                        avatarHtml = `<div class="rounded-circle d-flex align-items-center justify-content-center me-3" style="width:34px;height:34px;background:${color};color:#fff;font-size:14px;font-weight:600;">${initials}</div>`;
                    }

                    const priority = schedule.priority || "-";

                    // Department/Division: prefer controller-provided strings (payload.department/payload.division)
                    // or fall back to related project objects (different shapes handled)
                    let department = "-";
                    if (payload.department) {
                        department = payload.department;
                    } else if (
                        schedule &&
                        schedule.project &&
                        schedule.project.department
                    ) {
                        const pd = schedule.project.department;
                        if (typeof pd === "string") department = pd;
                        else
                            department =
                                pd.name_department ||
                                pd.name ||
                                pd.department_name ||
                                pd.department ||
                                "-";
                    } else if (schedule && schedule.department) {
                        department = schedule.department;
                    }

                    let division = "-";
                    if (payload.division) {
                        division = payload.division;
                    } else if (
                        schedule &&
                        schedule.project &&
                        schedule.project.division
                    ) {
                        const dv = schedule.project.division;
                        if (typeof dv === "string") division = dv;
                        else
                            division =
                                dv.name_division ||
                                dv.name ||
                                dv.division_name ||
                                dv.division ||
                                "-";
                    } else if (schedule && schedule.division) {
                        division = schedule.division;
                    }

                    const description = schedule.description || "";

                    const cardHtml = `
                        <div class="custom-card rounded-4 position-relative p-3 border-0">
                            <div class="d-flex align-items-center mb-2">
                                ${avatarHtml}
                                <div class="d-flex flex-column">
                                    ${
                                        schedule.project && schedule.project.id
                                            ? `<p class="text-muted mb-0" style="line-height:1; font-size: 10px;">${
                                                  schedule.project.title || "-"
                                              }</p>`
                                            : ""
                                    }
                                    <h5 class="mb-0" style="line-height:1.2; font-size:16px; font-weight:600;">${scheduleTitle}</h5>
                                </div>
                            </div>
                            ${
                                description
                                    ? `<div class="schedule-description-container mb-2"><p class="schedule-description mb-0" style="font-size:14px;">${description}</p></div>`
                                    : ""
                            }
                            <hr class="task-separator rounded-4">
                            <div class="d-flex justify-content-between align-items-center mb-2" style="font-size:12px;">
                                <div>
                                    <span style="color:#797E91;">Priority: </span>
                                    <span style="color:${
                                        priority === "HIGH" ? "red" : "#4B4F5E"
                                    }">${priority}</span>
                                </div>
                            </div>
                            <div class="d-flex justify-content-between mb-1" style="font-size:12px;">
                                <span class="text-muted">Department:</span>
                                <span>${department || "-"}</span>
                            </div>
                            <div class="d-flex justify-content-between" style="font-size:12px;">
                                <span class="text-muted">Division:</span>
                                <span>${division || "-"}</span>
                            </div>
                        </div>
                    `;

                    if (contentEl) contentEl.innerHTML = cardHtml;
                })
                .catch((err) => {
                    // Fallback to simple view if fetch fails
                    console.error(
                        "Failed to fetch schedule for delete modal",
                        err
                    );
                    try {
                        const contentEl = document.getElementById(
                            "deleteScheduleContent"
                        );
                        if (contentEl) {
                            let html = "";
                            if (imageUrl) {
                                html = `
                                    <div class="custom-card rounded-4 position-relative p-0 border-0">
                                        <div class="d-flex align-items-center mb-2">
                                            <img src="${imageUrl}" alt="Schedule Image" class="rounded-circle me-3" style="width:34px;height:34px;object-fit:cover;" onerror="this.onerror=null;this.src='${appUrl}/asset/img/avatar.png'">
                                            <div class="d-flex flex-column">
                                                <h6 class="mb-0" style="font-size:16px; font-weight:600; line-height:1;">${scheduleTitle}</h6>
                                                <p class="schedule-description small text-muted" style="margin:0;">Are you sure want to delete this schedule?</p>
                                            </div>
                                        </div>
                                    </div>
                                `;
                            } else {
                                const initials = getInitials(scheduleTitle);
                                const color = getInitialsColor(scheduleTitle);
                                html = `
                                    <div class="d-flex">
                                        <div class="me-3">
                                            <div class="rounded-circle d-flex align-items-center justify-content-center" style="width:34px;height:34px;background:${color};color:#fff;font-size:14px;font-weight:600;">${initials}</div>
                                        </div>
                                        <div class="custom-card p-0 m-0 border-0">
                                            <h6 style="font-size:16px; font-weight:600; margin:0;">${scheduleTitle}</h6>
                                            <div class="schedule-description-container">
                                                <p class="schedule-description small text-muted" style="margin:0;">Are you sure want to delete this schedule?</p>
                                            </div>
                                        </div>
                                    </div>
                                `;
                            }
                            contentEl.innerHTML = html;
                        }
                    } catch (e) {
                        console.error(e);
                    }
                })
                .finally(() => {
                    const modal = new bootstrap.Modal(
                        document.getElementById("deleteScheduleModal")
                    );
                    modal.show();
                });
        } catch (e) {
            console.error("Failed to render delete modal content", e);
            const modal = new bootstrap.Modal(
                document.getElementById("deleteScheduleModal")
            );
            modal.show();
        }
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
                    const deleteModalEl = document.getElementById(
                        "deleteScheduleModal"
                    );
                    const deleteModal =
                        bootstrap.Modal.getInstance(deleteModalEl);
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
                // try to find an image inside the card (img tag or background-image)
                let imageUrl = null;
                try {
                    const imgEl = card.querySelector("img");
                    if (imgEl && imgEl.src) {
                        imageUrl = imgEl.src;
                    } else {
                        // attempt to read background-image from element inside card
                        const bgEl = card.querySelector(
                            ".item-card, .custom-card, .project-image, .rounded-circle"
                        );
                        if (bgEl) {
                            const bg =
                                window.getComputedStyle(bgEl).backgroundImage ||
                                "";
                            const m = bg.match(/url\(["']?(.*?)["']?\)/);
                            if (m && m[1]) imageUrl = m[1];
                        }
                    }
                } catch (e) {
                    /* ignore */
                }

                openDeleteModal(scheduleId, scheduleTitle, imageUrl);
            }
        }
    });
});
