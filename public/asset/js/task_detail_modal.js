// Task Detail Modal - Shared functions for task detail modal across pages
// This file contains only the necessary functions for task detail modal without hub_division specific code

// Only declare appUrl if not already declared
if (typeof appUrl === 'undefined') {
    var appUrl = (
        document.querySelector('meta[name="app-url"]')?.getAttribute("content") ||
        $('meta[name=app-url]').attr("content") ||
        ""
    ).replace(/\/$/, "");
}

// Helper functions for task status colors
if (typeof getTaskStatusColor === 'undefined') {
    function getTaskStatusColor(status) {
        const statusLower = (status || '').toLowerCase();

        if (statusLower.includes('request') || statusLower === 'new') {
            return '#E8E9F2';
        } else if (statusLower.includes('progress')) {
            return '#EEEEE3';
        } else if (statusLower.includes('revision') || statusLower.includes('reject')) {
            return '#F3E4E6';
        } else if (statusLower.includes('late')) {
            return '#F3E4E6';
        } else if (statusLower.includes('complete')) {
            return '#DCF3E5';
        } else if (statusLower.includes('finish')) {
            return '#DDE7EF';
        } else {
            return '#F3F4F6';
        }
    }
}

if (typeof getTaskStatusTextColor === 'undefined') {
    function getTaskStatusTextColor(status) {
        const statusLower = (status || '').toLowerCase();

        if (statusLower.includes('request') || statusLower === 'new') {
            return '#7F808A';
        } else if (statusLower.includes('progress')) {
            return '#C29810';
        } else if (statusLower.includes('revision') || statusLower.includes('reject')) {
            return '#E44C4E';
        } else if (statusLower.includes('late')) {
            return '#E44C4E';
        } else if (statusLower.includes('complete')) {
            return '#42AE6F';
        } else if (statusLower.includes('finish')) {
            return '#1799DE';
        } else {
            return '#6B7280';
        }
    }
}

if (typeof isTaskLate === 'undefined') {
    function isTaskLate(task) {
        try {
            const statusLower = (task.status || '').toLowerCase();

            // Jika sudah completed atau finished, tidak dianggap late
            if (statusLower.includes('completed') || statusLower.includes('finished')) {
                return false;
            }

            // Check if task has due_date
            if (!task.due_date) {
                return false;
            }

            // Parse due_date
            const dueDate = new Date(task.due_date);
            const now = new Date();

            // Task is late if due_date has passed
            return dueDate < now;
        } catch (e) {
            return false;
        }
    }
}

if (typeof getTaskInitials === 'undefined') {
    function getTaskInitials(title) {
        if (!title) return "NA";
        const words = title.trim().split(/\s+/);
        if (words.length === 1) {
            return words[0].substring(0, 2).toUpperCase();
        }
        return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
}

if (typeof getRandomColorFromText === 'undefined') {
    function getRandomColorFromText(text) {
        const colors = [
            "#6A5AE0", "#FF8A3C", "#00A881", "#D4526E", "#3E8EDE",
            "#546E7A", "#8E44AD", "#2E7D32", "#AD1457", "#EF6C00"
        ];
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            hash = text.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    }
}

if (typeof escapeHtml === 'undefined') {
    function escapeHtml(str) {
        if (!str) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

// Main function to handle task detail modal
if (typeof handleTaskDetail === 'undefined') {
    function handleTaskDetail(taskId) {
        $.getJSON(appUrl + "/task/" + taskId, function (res) {
            const t = res.data || res;
            const img = t.image ? `${appUrl}/file/task/${t.image}` : null;
            const initials = img ? "" : getTaskInitials(t.title);
            const color = img ? "" : getRandomColorFromText(t.title);
            const statusColor = getTaskStatusColor(t.status);
            const statusLower = (String(t.status || '').toLowerCase());
            const statusText = t.status
                ? String(t.status)
                    .replace(/_/g, ' ')
                    .split(' ')
                    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                    .join(' ')
                : '';
            const taskIsLate = isTaskLate(t);

            const avatar = img
                ? `<img src="${img}" class="project-image me-3">`
                : `<div class="project-initial-avatar me-3" style="background:${color};">${initials}</div>`;

            let refFilesHtml = '';
            const rawRefFiles = t.reference_files || t.reference_file || [];
            let referenceFiles = [];
            if (typeof rawRefFiles === 'string' && rawRefFiles.trim()) {
                try {
                    const parsed = JSON.parse(rawRefFiles);
                    if (Array.isArray(parsed)) referenceFiles = parsed;
                    else referenceFiles = [rawRefFiles];
                } catch (_) {
                    referenceFiles = [rawRefFiles];
                }
            } else if (Array.isArray(rawRefFiles)) {
                referenceFiles = rawRefFiles;
            }

            referenceFiles = (referenceFiles || []).map(f => {
                if (!f) return null;
                try {
                    const val = String(f);
                    const isAbs = val.startsWith('http://') || val.startsWith('https://');
                    const isRefPath = val.startsWith('/file/task_reference_files/') || val.startsWith('file/task_reference_files/') ||
                        val.startsWith('/file/task/') || val.startsWith('file/task/') || val.startsWith('/storage/') || val.startsWith('storage/');
                    if (isAbs) return val;
                    if (isRefPath) return val.startsWith('/') ? (appUrl + val) : (appUrl + '/' + val);
                    return appUrl + '/file/task_reference_files/' + val;
                } catch (_) {
                    return null;
                }
            }).filter(Boolean);

            if (Array.isArray(referenceFiles) && referenceFiles.length) {
                refFilesHtml = `<div class="mb-2"><div class="row g-2">` + referenceFiles.map((u, idx) => {
                    const rawName = (u || '').split('/').pop() || `file_${idx + 1}`;
                    const fileName = decodeURIComponent(rawName).toLocaleLowerCase();
                    return `
                        <div class="col-6">
                            <div class="ref-file-item d-flex align-items-center p-2 rounded bg-light mb-1" style="position:relative;">

                                <a href="${u}" target="_blank"
                                    class="text-decoration-none flex-grow-1 text-truncate"
                                    title="${fileName}">
                                    ${fileName}
                                </a>

                                <a href="${u}" download="${fileName}" class="ms-2 text-decoration-none download-icon" title="Download ${fileName}">
                                    <span class="material-symbols-outlined action-icon">download</span>
                                </a>
                            </div>
                        </div>
                    `;
                }).join('') + `</div></div>`;
            }

            let refUrlsHtml = '';
            const referenceUrls = t.reference_urls || (t.reference_url ? [t.reference_url] : []);

            if (Array.isArray(referenceUrls) && referenceUrls.length) {
                refUrlsHtml = '<div class="mb-2">';

                referenceUrls.forEach((u, idx) => {
                    const displayUrl = u || '';

                    refUrlsHtml += `
                                <div class="ref-url-item d-flex align-items-center p-2 rounded bg-light mb-1" style="position:relative;">
                                    
                                    <a href="${u}" target="_blank"
                                        class="text-decoration-none flex-grow-1 text-truncate"
                                        style="color: #444; font-size: 10px;" title="${displayUrl}">
                                        ${displayUrl}
                                    </a>

                                    <span class="material-symbols-outlined ms-2 open-url-btn action-icon"
                                        data-url="${u}">
                                        open_in_new
                                    </span>

                                    <span class="material-symbols-outlined ms-2 copy-url-btn action-icon"
                                        data-url="${u}">
                                        content_copy
                                    </span>

                                </div>
                            `;
                });

                refUrlsHtml += '</div>';
            }

            // Complete Ref Files
            let completeRefFilesHtml = '';
            const rawCompelteRefFiles = t.complete_files || t.complete_files || [];
            let completeReferenceFiles = [];
            if (typeof rawCompelteRefFiles === 'string' && rawCompelteRefFiles.trim()) {
                try {
                    const parsed = JSON.parse(rawCompelteRefFiles);
                    if (Array.isArray(parsed)) completeReferenceFiles = parsed;
                    else completeReferenceFiles = [rawCompelteRefFiles];
                } catch (_) {
                    completeReferenceFiles = [rawCompelteRefFiles];
                }
            } else if (Array.isArray(rawCompelteRefFiles)) {
                completeReferenceFiles = rawCompelteRefFiles;
            }

            completeReferenceFiles = (completeReferenceFiles || []).map(f => {
                if (!f) return null;
                try {
                    const val = String(f);
                    const isAbs = val.startsWith('http://') || val.startsWith('https://');
                    const isRefPath = val.startsWith('/file/task_complete_files/') || val.startsWith('file/task_complete_files/') ||
                        val.startsWith('/file/task/') || val.startsWith('file/task/') || val.startsWith('/storage/') || val.startsWith('storage/');
                    if (isAbs) return val;
                    if (isRefPath) return val.startsWith('/') ? (appUrl + val) : (appUrl + '/' + val);
                    return appUrl + '/file/task_complete_files/' + val;
                } catch (_) {
                    return null;
                }
            }).filter(Boolean);

            if (Array.isArray(completeReferenceFiles) && completeReferenceFiles.length) {
                completeRefFilesHtml = `<div class="mb-2"><div class="row g-2">` + completeReferenceFiles.map((u, idx) => {
                    const rawCompleteFileName = (u || '').split('/').pop() || `file_${idx + 1}`;
                    const completeFileName = decodeURIComponent(rawCompleteFileName).toLocaleLowerCase();
                    return `
                        <div class="col-6">
                            <div class="ref-file-item d-flex align-items-center p-2 rounded bg-light mb-1" style="position:relative;">

                                <a href="${u}" target="_blank"
                                    class="text-decoration-none flex-grow-1 text-truncate"
                                    title="${completeFileName}">
                                    ${completeFileName}
                                </a>

                                <a href="${u}" download="${completeFileName}" class="ms-2 text-decoration-none" title="Download ${completeFileName}">
                                    <span class="material-symbols-outlined action-icon">download</span>
                                </a>
                            </div>
                        </div>
                    `;
                }).join('') + `</div></div>`;
            }

            // Complete Ref Urls
            let refCompleteUrlsHtml = '';
            const completeReferenceUrls = t.complete_urls || (t.complete_urls ? [t.complete_urls] : []);

            if (Array.isArray(completeReferenceUrls) && completeReferenceUrls.length) {
                refCompleteUrlsHtml = '<div class="mb-2">';

                completeReferenceUrls.forEach((u, idx) => {
                    const displayCompleteUrl = u || '';

                    refCompleteUrlsHtml += `
                                <div class="ref-url-item d-flex align-items-center p-2 rounded bg-light mb-1 position-relative">
                                    
                                    <a href="${u}" target="_blank"
                                        class="text-decoration-none flex-grow-1 text-truncate"
                                        title="${displayCompleteUrl}">
                                        ${displayCompleteUrl}
                                    </a>

                                    <span class="material-symbols-outlined ms-2 open-url-btn action-icon"
                                        data-url="${u}">
                                        open_in_new
                                    </span>

                                    <span class="material-symbols-outlined ms-2 copy-url-btn action-icon"
                                        data-url="${u}">
                                        content_copy
                                    </span>

                                </div>
                            `;
                });

                refCompleteUrlsHtml += '</div>';
            }

            function stripHtml(raw) {
                try {
                    const d = document.createElement('div');
                    d.innerHTML = raw || '';
                    return (d.textContent || d.innerText || '').trim();
                } catch (_) {
                    return String(raw || '').replace(/<[^>]+>/g, '').trim();
                }
            }

            const completeNotePlain = stripHtml(t.complete_note || t.complete_note_html || '');

            document.addEventListener("click", function (e) {
                if (e.target.classList.contains("open-url-btn")) {
                    const url = e.target.getAttribute("data-url");
                    if (url) window.open(url, "_blank");
                }

                if (e.target.classList.contains("copy-url-btn")) {
                    const url = e.target.getAttribute("data-url");
                    if (url) {
                        navigator.clipboard.writeText(url)
                            .then(() => {
                                if (typeof showFloatingAlert === 'function') {
                                    showFloatingAlert("URL copied!", "success", 2000);
                                }
                            })
                            .catch(() => {
                                if (typeof showFloatingAlert === 'function') {
                                    showFloatingAlert("Failed to copy.", "danger", 2000);
                                }
                            });
                    }
                }
            });

            const collab = (() => {
                const list = [];
                if (t.pic) list.push({ role: "PIC", emp: t.pic });
                (t.executors || []).forEach(e => list.push({ role: "Executor", emp: e }));
                if (!list.length) return "";

                return `<div class="row g-2 mt-3 mb-4">` + list.map(i => `
                    <div class="col-6">
                        <div class="collab-item d-flex align-items-center">
                            <img src="${(i.emp.image || i.emp.profile_picture || i.emp.user_photo || i.emp.photo || appUrl + '/asset/img/avatar.png')}" class="rounded-circle" style="width:24px;height:24px;object-fit:cover;" 
                                onerror="this.src='${appUrl}/asset/img/avatar.png'">
                            <div class="ms-2">
                                <div class="employee-name-timeline">${i.emp.name || "Unknown"}</div>
                                <div class="employee-role-timeline text-muted fs-8">${i.role}</div>
                            </div>
                        </div>
                    </div>
                `).join('') + `</div>`;
            })();

            const statusChanges = Array.isArray(t.status_changes) ? t.status_changes : [];
            let statusLogs = '';
            if (statusChanges.length) {
                statusLogs = `
                    <div class="status-timeline mt-3 mb-3">
                        ${statusChanges.map((s) => {
                    const dateLabel = typeof formatDateENMedium === 'function' ? formatDateENMedium(s.updated_at || s.changed_at || '') : (s.updated_at || s.changed_at || '');
                    const label = escapeHtml(s.label || '');
                    const emp = escapeHtml(s.employee_name || '');

                    return `
                                <div class="timeline-row">
                                    <div class="timeline-date">${dateLabel}</div>

                                    <div class="timeline-line">
                                        <div class="timeline-dot"></div>
                                    </div>

                                    <div class="timeline-content">
                                        <div class="status-content">
                                            <span class="status-label">${label}</span>
                                            <span class="status-emp">${emp}</span>
                                        </div>
                                    </div>
                                </div>
                            `;
                }).join('')}
                    </div>
                `;
            }

            let completeAuthor = '';
            let completeDate = '';
            const compEntry = statusChanges.find(s => {
                const l = String(s.label || s.status || '').toLowerCase();
                return l.includes('complete') || l.includes('completed') || l.includes('finish') || l.includes('finished');
            });
            if (compEntry) {
                completeAuthor = escapeHtml(compEntry.employee_name || compEntry.employee_fullname || compEntry.employee || '');
                completeDate = typeof formatDateENMedium === 'function' ? formatDateENMedium(compEntry.updated_at || compEntry.changed_at || compEntry.created_at || '') : '';
            } else {
                completeAuthor = escapeHtml(t.completed_by_name || t.completed_by || t.completed_by_employee || '');
                completeDate = t.completed_date && typeof formatDateENMedium === 'function' ? formatDateENMedium(t.complete_date) : '';
            }

            const completeContentHtml = `
                <div class="complete-content p-3 rounded-3 mt-3">
                    <h5 class="complete-title-content">Complete result task</h5>
                    <div class="complete-note">${escapeHtml(completeNotePlain || '')}</div>
                    ${completeAuthor || completeDate ? `<div class="complete-logs">Complete by ${completeAuthor || '-'} ${completeDate ? ' at ' + completeDate : ''}</div>` : ''}

                    <div>
                        <h6 class="complete-reference">Link & File reference</h6>
                        ${completeRefFilesHtml || ''}
                        ${refCompleteUrlsHtml || ''}
                    </div>
                </div>
            `;

            const html = `
                <div class="rounded-4 border-0" data-task-id="${t.id}">
                        <div class="d-flex justify-content-between align-items-start px-4 py-3">
                            <div class="d-flex align-items-center task-card-header">
                                ${avatar}
                                <div>
                                    ${t.project?.id ? `<small class="project-title text-muted">${t.project.title}</small>` : ""}
                                    <h5 class="task-title-detail mb-0">${t.title || "-"}</h5>
                                </div>
                            </div>
                            <div class="gap-2 mt-2 mx-2 d-flex align-items-center" tabindex="0">
                                ${taskIsLate ?
                    '<span class="status-text-late">Late</span>' :
                    `<span class="status-text" style="color:${getTaskStatusTextColor(t.status)}; background-color:${statusColor};">${escapeHtml(statusText)}</span>`
                }
                            </div>
                        </div>
                        <div class="px-4 task-detail-description">${t.description || ""}</div>
                        <div class="d-flex justify-content-between px-4 py-2">
                            <div class="priority-section d-flex align-items-center gap-2">
                                <span class="priority-label">Priority:&nbsp;</span>
                                <span class="priority-value" style="color:${t.priority === 'HIGH' ? 'red' : '#4B4F5E'};">${t.priority}</span>
                            </div>

                            <div class="d-flex justify-content-center align-items-center flex-grow-1">
                                <span class="date-detail">${t.start_date && typeof formatDateENMedium === 'function' ? formatDateENMedium(t.start_date) : (t.start_date || '-')} - ${t.due_date && typeof formatDateENMedium === 'function' ? formatDateENMedium(t.due_date) : (t.due_date || '-')}</span>
                            </div>

                            <div class="status-section d-flex justify-content-end align-items-start gap-3">
                                ${(statusLower.includes('finish') || statusLower.includes('complete')) ? `
                                    <div class="d-flex align-items-center">
                                        <button class="btn btn-sm p-0 m-0 border-0" type="button" data-bs-toggle="collapse" data-bs-target="#completeContent" aria-expanded="false" aria-controls="completeContent">
                                            <span class="material-symbols-outlined task-icon">playlist_add_check</span>
                                        </button>
                                    </div>
                                ` : ''}

                                <div class="d-flex align-items-center position-relative">
                                    <button class="btn p-0 border-0 project-task-feedback-btn">
                                        <span class="material-symbols-outlined task-icon mode_comment" data-task-id="${t.id}">mode_comment</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="px-4">
                            <div class="barrier-detail"></div>
                        </div>

                    <div class="scrollable-content scrollbar-transparent px-4 py-3">
                        ${(statusLower.includes('finish') || statusLower.includes('complete')) ? `
                            <div class="collapse" id="completeContent">
                                ${completeContentHtml}
                            </div>
                        ` : ''}

                        ${collab}

                        <div class="mb-5">
                            <h5 class="ref-title">Link & File Reference</h5>
                            ${refFilesHtml}
                            ${refUrlsHtml}
                        </div>

                        <div class="barrier-detail"></div>

                        <div class="d-flex justify-content-between align-items-start mt-3 gap-3">
                            <div class="department-section d-flex justify-content-start">
                                <span class="text-muted">Department: &nbsp;</span>
                                <span>${t.project?.department?.name_department || t.project?.department_name || t.project?.department || "-"}</span>
                            </div>
                            <div class="division-section d-flex justify-content-end mb-2">
                                <span class="text-muted">Division: &nbsp;</span>
                                <span>${t.project?.division?.name_division || t.project?.division_name || t.project?.division || "-"}</span>
                            </div>
                        </div>
                        ${statusLogs}
                    </div>
                </div>
            `;

            $("#taskDetailContent").html(html);
            new bootstrap.Modal($("#taskDetailModal")).show();
        }).fail(() => {
            if (typeof showFloatingAlert === 'function') {
                showFloatingAlert("Failed to load task", "danger", 3000);
            }
        });
    }

    // Expose to window for external calls
    window.handleTaskDetail = handleTaskDetail;
}
