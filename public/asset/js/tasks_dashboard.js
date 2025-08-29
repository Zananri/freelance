$(".btn-tab-task").on("click", function () {
    $(".btn-tab-task").removeClass("active");
    $(this).addClass("active");

    showTask();
});

// Mapping warna status
function getStatusBackground(statusNorm) {
    let bg = '#FFFFFF'; // default
    if (statusNorm === 'new_request') {
        bg = '#a1a3a60d';
    } else if (statusNorm === 'in_progress') {
        bg = '#edebdf5c';
    } else if (statusNorm === 'complete') {
        bg = '#baeed340';
    } else if (statusNorm === 'rejected') {
        bg = '#FFFFFF';
    }
    return bg;
}

function getTaskToday() {
    const $list = $(".task-list");
    $list.empty().append(`<div class="text-center py-3 text-secondary small">Loading tasks…</div>`);

    const ensureRoute = () => {
        if (window.NSA_ROUTES && window.NSA_ROUTES.tasksToday) return Promise.resolve(window.NSA_ROUTES.tasksToday);
        return fetch('client-routes', { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
            .then(r => r.ok ? r.json() : Promise.reject(new Error('Failed to load routes')))
            .then(j => {
                window.NSA_ROUTES = Object.assign({}, window.NSA_ROUTES, j || {});
                const finalUrl = (j && j.tasksToday) ? j.tasksToday : 'task/dashboard/today';
                window.NSA_ROUTES.tasksToday = finalUrl;
                return finalUrl;
            })
            .catch(() => 'task/dashboard/today');
    };

    ensureRoute().then(url => {
        const finalUrl = url.startsWith('http') || url.startsWith('/') ? url : ('/' + url);
        return fetch(finalUrl, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
    })
        .then(async res => {
            const text = await res.text();
            try { return JSON.parse(text); }
            catch { throw new Error('Non-JSON response: ' + text.slice(0, 120)); }
        })
        .then(json => {
            if (json.status !== 'success') throw new Error(json.message || 'Failed to fetch tasks');
            const tasks = json.data || [];
            $list.empty();
            if (!tasks.length) {
                $list.append(`<div class="text-center py-3 text-secondary small">No tasks for today.</div>`);
                return;
            }

            tasks.forEach(t => {
                const priorityColor = t.priority === 'HIGH' ? '#E14F4F' : (t.priority === 'MEDIUM' ? '#E6A15A' : '#4fc97a');
                const rawDue = t.due_date || '';
                const dueText = /^\d{4}-\d{2}-\d{2}/.test(rawDue) ? rawDue : (rawDue ? new Date(rawDue).toLocaleDateString() : '-');
                const statusNorm = (t.status || '').toLowerCase();
                const bg = getStatusBackground(statusNorm);

                const rejectedBadge = statusNorm === 'rejected'
                    ? '<span style="position:absolute;top:8px;right:10px;font-size:10px;font-weight:700;color:#B00020;background:#FFD6D6;padding:2px 6px;border-radius:8px;letter-spacing:.3px;">REJECTED</span>'
                    : '';

                const getPhoto = (obj) => obj?.photo || obj?.image || obj?.user_photo || obj || '';
                const getId = (obj) => obj?.id || obj?.employee_id || null;
                const getName = (obj) => obj?.name || obj?.full_name || obj?.employee_name || 'Member';

                const people = [];
                if (t.pic || t.pic_photo) {
                    people.push(t.pic || { id: t.pic_id || null, photo: t.pic_photo, name: t.pic_name || 'PIC' });
                }
                // Correctly append executors (bugfix: previously iterated over people instead of t.executors)
                if (Array.isArray(t.executors)) {
                    t.executors.forEach(e => people.push(e));
                }

                const seen = new Set();
                const avatars = [];
                people.forEach(p => {
                    const photo = getPhoto(p);
                    const pid = getId(p) ? 'id:' + getId(p) : 'ph:' + photo;
                    if (pid && !seen.has(pid)) {
                        seen.add(pid);
                        avatars.push({ url: photo, name: getName(p) });
                    }
                });
                let borderColor = bg;

                const avatarHtml = avatars.slice(0, 5).map((av, idx) => {
                    const size = idx === 0 ? 22 : 20;
                    const overlap = idx > 0 ? '-10px' : '0';
                    const z = idx + 1;
                    const safeUrl = av.url || '/asset/img/profile_picture/default.png';
                    const safeName = escapeHtml(av.name || '');
                    return `
                        <span class="avatar-overlap" style="position: relative; display:inline-block; margin-left:${overlap}; z-index:${z};">
                            <img src="${safeUrl}" alt="${safeName}" data-bs-toggle="tooltip" data-bs-placement="bottom" title="${safeName}" style="width:${size}px;height:${size}px;object-fit:cover;border:2px solid ${borderColor};border-radius:50%;">
                        </span>
                    `;
                }).join('');

                const commentsCount = (
                    t.feedback_comments_count || t.comments_count || t.feedbacks_count ||
                    (Array.isArray(t.feedbacks) ? t.feedbacks.length : 0) || 0
                );

                let filesCount = t.reference_files_count || t.attachments_count || 0;
                if (!filesCount) {
                    let rf = t.reference_files;
                    if (typeof rf === 'string') {
                        try { rf = JSON.parse(rf); }
                        catch { rf = rf.includes('[') ? [] : rf.split(',').map(s => s.trim()).filter(Boolean); }
                    }
                    if (Array.isArray(rf)) filesCount = rf.length;
                }

                const topTitle = `
                    <div class="d-flex align-items-center mb-1">
                        <img src="${t.project_image}" class="rounded-circle me-3" style="width:28px;height:28px;object-fit:cover;">
                        <h6 class="mb-0" style="font-size: 14px">${escapeHtml(t.title || '-')}</h6>
                    </div>`;

                const descHtml = t.description
                    ? `<p class="mb-2 small" style="font-size: 10px;">${escapeHtml(t.description).slice(0,140)}${t.description.length>140?'…':''}</p>`
                    : '';

                const priorityRow = `
                    <div class="d-flex justify-content-between align-items-center small" style="font-size:10px;">
                        <div><span style="color:#828282;">Priority:</span><span class="mx-2" style="color:${priorityColor}">${t.priority || '-'}</span></div>
                        <div><span style="color:#828282;">Deadline:</span><span class="mx-2" style="color:#454545">${dueText}</span></div>
                    </div>`;

                const actionsRow = `
                    <div class="d-flex justify-content-between align-items-center mt-2">
                        <div class="d-flex align-items-center">${avatarHtml}</div>
                        <div class="d-flex align-items-center">
                            <span class="material-symbols-outlined task-feedback-trigger" data-task-id="${t.id}" style="font-size:18px;color:#828282;cursor:pointer;">mode_comment</span>
                            ${commentsCount>0?`<span class="ms-1 small feedback-comments-count" data-task-id="${t.id}" style="color:#555;">${commentsCount}</span>`:''}
                            <span class="material-symbols-outlined ms-3 task-attach-trigger" data-task-id="${t.id}" style="font-size:18px;color:#828282;cursor:pointer;">attach_file</span>
                            ${filesCount>0?`<span class="ms-1 small reference-files-count" data-task-id="${t.id}" style="color:#555;">${filesCount}</span>`:''}
                        </div>
                    </div>`;

                const card = `
                    <div class="task-card p-3 mb-3" style="background:${bg};position:relative;">
                        ${rejectedBadge}
                        ${topTitle}
                        ${descHtml}
                        <hr class="my-2" style="opacity:.25;">
                        ${priorityRow}
                        ${actionsRow}
                    </div>`;
                $list.append(card);
            });

            setTimeout(() => {
                if (window.bootstrap && typeof window.bootstrap.Tooltip === 'function') {
                    const triggers = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
                    triggers.forEach(el => { try { new bootstrap.Tooltip(el); } catch(e) {} });
                }
            }, 50);
        })
        .catch(err => {
            console.error(err);
            $list.empty().append(`<div class="text-center py-3 text-danger small">Failed to load tasks.</div>`);
        });
}

function getTaskTomorrow() {
    const $list = $(".task-list");
    $list.empty().append(`<div class="text-center py-3 text-secondary small">Loading tasks…</div>`);

    const ensureRoute = () => {
        if (window.NSA_ROUTES && window.NSA_ROUTES.tasksTomorrow) {
            return Promise.resolve(window.NSA_ROUTES.tasksTomorrow);
        }
        return fetch('client-routes', { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
            .then(r => r.ok ? r.json() : Promise.reject(new Error('Failed to load routes')))
            .then(j => {
                window.NSA_ROUTES = Object.assign({}, window.NSA_ROUTES, j || {});
                const finalUrl = (j && j.tasksTomorrow) ? j.tasksTomorrow : 'task/dashboard/tomorrow';
                window.NSA_ROUTES.tasksTomorrow = finalUrl;
                return finalUrl;
            })
            .catch(() => 'task/dashboard/tomorrow');
    };

    ensureRoute()
        .then(url => {
            const finalUrl = url.startsWith('http') || url.startsWith('/') ? url : ('/' + url);
            return fetch(finalUrl, { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
        })
        .then(async res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const text = await res.text();
            try { return JSON.parse(text); }
            catch { throw new Error('Non-JSON response: ' + text.slice(0, 120)); }
        })
        .then(json => {
            if (json.status !== 'success') throw new Error(json.message || 'Failed to fetch tasks');

            const tasks = json.data || [];
            $list.empty();
            if (!tasks.length) {
                $list.append(`<div class="text-center py-3 text-secondary small">No tasks for tomorrow.</div>`);
                return;
            }

            tasks.forEach(t => {
                const priorityColor = t.priority === 'HIGH' ? '#E14F4F'
                    : (t.priority === 'MEDIUM' ? '#E6A15A' : '#4fc97a');

                const rawDue = t.due_date || '';
                const dueText = /^\d{4}-\d{2}-\d{2}/.test(rawDue)
                    ? rawDue
                    : (rawDue ? new Date(rawDue).toLocaleDateString() : '-');

                const statusNorm = (t.status || '').toLowerCase();
                const bg = getStatusBackground(statusNorm);

                const rejectedBadge = statusNorm === 'rejected'
                    ? '<span style="position:absolute;top:8px;right:10px;font-size:10px;font-weight:700;color:#B00020;background:#FFD6D6;padding:2px 6px;border-radius:8px;letter-spacing:.3px;">REJECTED</span>'
                    : '';

                // Build PIC + Executors
                const getPhoto = (obj) => obj?.photo || obj?.image || obj?.user_photo || obj || '';
                const getId = (obj) => obj?.id || obj?.employee_id || null;
                const getName = (obj) => obj?.name || obj?.full_name || obj?.employee_name || 'Member';

                const people = [];
                if (t.pic || t.pic_photo) {
                    people.push(t.pic || { id: t.pic_id || null, photo: t.pic_photo, name: t.pic_name || 'PIC' });
                }
                if (Array.isArray(t.executors)) {
                    t.executors.forEach(e => people.push(e));
                }

                const seen = new Set();
                const avatars = [];
                people.forEach(p => {
                    const photo = getPhoto(p);
                    const pid = getId(p) ? 'id:' + getId(p) : 'ph:' + photo;
                    if (pid && !seen.has(pid)) {
                        seen.add(pid);
                        avatars.push({ url: photo, name: getName(p) });
                    }
                });

                const borderColor = bg;

                const avatarHtml = avatars.slice(0, 5).map((av, idx) => {
                    const size = idx === 0 ? 22 : 20;
                    const overlap = idx > 0 ? '-10px' : '0';
                    const z = idx + 1;
                    const safeUrl = av.url || '/asset/img/profile_picture/default.png';
                    const safeName = escapeHtml(av.name || '');
                    return `
                        <span class="avatar-overlap" style="position: relative; display:inline-block; margin-left:${overlap}; z-index:${z};">
                            <img src="${safeUrl}" alt="${safeName}" data-bs-toggle="tooltip" data-bs-placement="bottom" title="${safeName}" style="width:${size}px;height:${size}px;object-fit:cover;border:2px solid ${borderColor};border-radius:50%;">
                        </span>
                    `;
                }).join('');

                const commentsCount = (
                    t.feedback_comments_count || t.comments_count || t.feedbacks_count ||
                    (Array.isArray(t.feedbacks) ? t.feedbacks.length : 0) || 0
                );

                let filesCount = t.reference_files_count || t.attachments_count || 0;
                if (!filesCount) {
                    let rf = t.reference_files;
                    if (typeof rf === 'string') {
                        try { rf = JSON.parse(rf); }
                        catch { rf = rf.includes('[') ? [] : rf.split(',').map(s => s.trim()).filter(Boolean); }
                    }
                    if (Array.isArray(rf)) filesCount = rf.length;
                }

                const topTitle = `
                    <div class="d-flex align-items-center mb-1">
                        <img src="${t.project_image}" class="rounded-circle me-3" style="width:28px;height:28px;object-fit:cover;">
                        <h6 class="mb-0" style="font-size: 14px">${escapeHtml(t.title || '-')}</h6>
                    </div>`;

                const descHtml = t.description
                    ? `<p class="mb-2 small" style="font-size: 10px;">${escapeHtml(t.description).slice(0,140)}${t.description.length>140?'…':''}</p>`
                    : '';

                const priorityRow = `
                    <div class="d-flex justify-content-between align-items-center small" style="font-size:10px;">
                        <div><span style="color:#828282;">Priority:</span><span class="mx-2" style="color:${priorityColor}">${t.priority || '-'}</span></div>
                        <div><span style="color:#828282;">Deadline:</span><span class="mx-2" style="color:#454545">${dueText}</span></div>
                    </div>`;

                const actionsRow = `
                    <div class="d-flex justify-content-between align-items-center mt-2">
                        <div class="d-flex align-items-center">${avatarHtml}</div>
                        <div class="d-flex align-items-center">
                            <span class="material-symbols-outlined task-feedback-trigger" data-task-id="${t.id}" style="font-size:18px;color:#828282;cursor:pointer;">mode_comment</span>
                            ${commentsCount>0?`<span class="ms-1 small feedback-comments-count" data-task-id="${t.id}" style="color:#555;">${commentsCount}</span>`:''}
                            <span class="material-symbols-outlined ms-3 task-attach-trigger" data-task-id="${t.id}" style="font-size:18px;color:#828282;cursor:pointer;">attach_file</span>
                            ${filesCount>0?`<span class="ms-1 small reference-files-count" data-task-id="${t.id}" style="color:#555;">${filesCount}</span>`:''}
                        </div>
                    </div>`;

                const card = `
                    <div class="task-card p-3 mb-3" style="background:${bg};position:relative;">
                        ${rejectedBadge}
                        ${topTitle}
                        ${descHtml}
                        <hr class="my-2" style="opacity:.25;">
                        ${priorityRow}
                        ${actionsRow}
                    </div>`;
                $list.append(card);
            });

            setTimeout(() => {
                if (window.bootstrap && typeof window.bootstrap.Tooltip === 'function') {
                    const triggers = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
                    triggers.forEach(el => { try { new bootstrap.Tooltip(el); } catch(e) {} });
                }
            }, 50);
        })
        .catch(err => {
            console.error(err);
            $list.empty().append(`<div class="text-center py-3 text-danger small">Failed to load tasks.</div>`);
        });
}

// util
function showTask() {
    let taskActive = $(".btn-tab-task.active").attr("data-tab-active");

    if (taskActive === "today") {
        getTaskToday();
    } else if (taskActive === "tomorrow") {
        getTaskTomorrow();
    }
}

function escapeHtml(text) {
    if (!text) return "";
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// auto-load on page ready for default active tab
document.addEventListener('DOMContentLoaded', () => {
    showTask();
});

// Feedback modal logic (mirrors task.js simplified)
document.addEventListener('click', function(e) {
    const trigger = e.target.closest('.task-feedback-trigger');
    if (!trigger) return;
    const taskId = trigger.getAttribute('data-task-id');
    openDashboardTaskFeedback(taskId);
});

// Handle attach_file click and open Reference Files modal (parity with Task page)
document.addEventListener('click', function(e) {
    const attach = e.target.closest('.task-attach-trigger');
    if (!attach) return;
    const taskId = attach.getAttribute('data-task-id');
    openDashboardReferenceFiles(taskId);
});

function ensureReferenceFilesModal() {
    let modalEl = document.getElementById('referenceFilesModal');
    if (modalEl) return modalEl;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
        <div class="modal fade" id="referenceFilesModal" tabindex="-1" aria-labelledby="referenceFilesModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                <div class="modal-content modal-content-custom">
                    <div class="modal-header modal-header-custom">
                        <h5 class="modal-title modal-title-custom" id="referenceFilesModalLabel">Reference Files</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <hr>
                    <div class="modal-body modal-body-custom">
                        <div id="referenceFilesList" class="d-flex flex-column gap-2"></div>
                    </div>
                </div>
            </div>
        </div>`;
    document.body.appendChild(wrapper.firstElementChild);
    return document.getElementById('referenceFilesModal');
}

function openDashboardReferenceFiles(taskId) {
    const appUrl = document.querySelector('meta[name="app-url"]')?.getAttribute('content') || '';
    const modalEl = ensureReferenceFilesModal();
    const listEl = modalEl.querySelector('#referenceFilesList');
    listEl.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';

    fetch((appUrl ? appUrl : '') + '/task/' + taskId, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
        .then(r => r.json())
        .then(res => {
            // Support {data:{...}} or direct payload
            const payload = res && (res.data || res);
            let referenceFiles = payload && payload.reference_files;

            if (typeof referenceFiles === 'string') {
                try {
                    referenceFiles = JSON.parse(referenceFiles);
                } catch (e) {
                    referenceFiles = referenceFiles.includes('[') ? [] : referenceFiles.split(',').map(s => s.trim()).filter(Boolean);
                }
            }

            listEl.innerHTML = '';
            if (Array.isArray(referenceFiles) && referenceFiles.length > 0) {
                referenceFiles.forEach(fileName => {
                    if (!fileName) return;
                    const a = document.createElement('a');
                    a.href = (appUrl ? appUrl : '') + '/file/task_reference_files/' + fileName;
                    a.target = '_blank';
                    a.className = 'd-block text-decoration-none mb-1';
                    a.innerHTML = '<span class="material-symbols-outlined me-1" style="font-size:16px;vertical-align:middle;">description</span> ' + fileName;
                    listEl.appendChild(a);
                });
            } else {
                listEl.textContent = 'No reference files available.';
            }
        })
        .catch(() => {
            listEl.innerHTML = '<div class="alert alert-danger">Failed to load reference files.</div>';
        })
        .finally(() => {
            const modal = (bootstrap && bootstrap.Modal && bootstrap.Modal.getOrCreateInstance)
                ? bootstrap.Modal.getOrCreateInstance(modalEl)
                : new bootstrap.Modal(modalEl);
            modal.show();
        });
}

function openDashboardTaskFeedback(taskId) {
    const modalEl = document.getElementById('taskFeedbackModal');
    if (!modalEl) return;
    modalEl.dataset.taskId = taskId;

    const modal = (bootstrap && bootstrap.Modal && bootstrap.Modal.getOrCreateInstance)
        ? bootstrap.Modal.getOrCreateInstance(modalEl)
        : new bootstrap.Modal(modalEl);
    // reset title and button
    const titleEl = modalEl.querySelector('.feedback-modal-title');
    const addBtn = document.getElementById('addFeedbackButton');
    const bodyEl = modalEl.querySelector('.feedback-modal-body');
    titleEl.textContent = 'Task Feedback';
    bodyEl.innerHTML = '';
    addBtn.textContent = 'Add Feedback';

    // bind add feedback click
    const newBtn = addBtn.cloneNode(true);
    addBtn.parentNode.replaceChild(newBtn, addBtn);
    newBtn.addEventListener('click', () => showDashboardAddFeedbackForm(taskId));

    loadDashboardTaskFeedbackData(taskId);
    modal.show();
}

function loadDashboardTaskFeedbackData(taskId) {
    const bodyEl = document.getElementById('taskFeedbackList');
    if (!bodyEl) return;
    bodyEl.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';

    const appUrl = document.querySelector('meta[name="app-url"]')?.getAttribute('content') || '';
    fetch((appUrl ? appUrl : '') + '/task-feedbacks/' + taskId, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
        .then(r => r.json())
        .then(res => {
            const data = res.data || [];
            if (!data.length) {
                bodyEl.innerHTML = '<p class="text-center text-muted">No feedback available for this task.</p>';
                return;
            }

            // helper functions to match Task page formatting
            const isSameDay = (d1, d2) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
            const isYesterday = (d1, d2) => {
                const y = new Date(d2);
                y.setDate(d2.getDate() - 1);
                return isSameDay(d1, y);
            };

            const html = data.map(fb => {
                let formattedDate = '';
                if (fb.created_at) {
                    const created = new Date(fb.created_at);
                    const now = new Date();
                    if (isSameDay(created, now)) {
                        formattedDate = created.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
                    } else if (isYesterday(created, now)) {
                        formattedDate = 'yesterday';
                    } else {
                        formattedDate = created.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
                    }
                }

                const name = fb.employee?.name || 'Unknown';
                const photo = fb.employee?.photo || ((appUrl ? appUrl : '') + '/asset/img/profile_picture/default.png');
                const imgHtml = fb.image ? `<img src="${fb.image}" class="img-fluid rounded mb-2" style="width: 70px; height: auto; border-radius: 8px; cursor: pointer;">` : '';
                const urlHtml = fb.reference_url ? `<a href="${fb.reference_url}" target="_blank" class="feedback-reference-url"><span class="material-symbols-outlined">link</span> Reference Link</a>` : '';
                const fileHtml = fb.reference_file ? `<a href="${fb.reference_file}" download class="feedback-reference-file"><span class="material-symbols-outlined">draft</span> FEEDBACK_FILE</a>` : '';
                const refs = (urlHtml || fileHtml) ? `<div class="feedback-reference-container">${urlHtml}${fileHtml}</div>` : '';
                return `
                    <div class="feedback-item mb-3 p-3">
                        <div class="d-flex align-items-center mb-2">
                            <img src="${photo}" alt="${escapeHtml(name)}" class="rounded-circle me-2" style="width: 32px; height: 32px; object-fit: cover;">
                            <div>
                                <strong>${escapeHtml(name)}</strong>
                                <small class="text-muted d-block">${formattedDate}</small>
                            </div>
                        </div>
                        <p class="mb-2">${escapeHtml(fb.feedback_comment || '')}</p>
                        ${refs}
                        ${imgHtml}
                    </div>`;
            }).join('');
            bodyEl.innerHTML = html;
        })
        .catch(() => {
            bodyEl.innerHTML = '<p class="text-center text-danger">Failed to load feedback.</p>';
        });
}

function showDashboardAddFeedbackForm(taskId) {
    const modalEl = document.getElementById('taskFeedbackModal');
    const appUrl = document.querySelector('meta[name="app-url"]')?.getAttribute('content') || '';
    const titleEl = modalEl.querySelector('.feedback-modal-title');
    const bodyEl = modalEl.querySelector('.feedback-modal-body');
    const addBtn = document.getElementById('addFeedbackButton');
    titleEl.textContent = 'Add Feedback';

    // Use the exact Task page markup and IDs for parity
    bodyEl.innerHTML = `
        <form id="addFeedbackForm" enctype="multipart/form-data">
            <input type="hidden" name="task_id" value="${taskId}">
            <input type="hidden" name="employee_id" value="${modalEl.dataset.employeeId || ''}">

            <div class="mb-3">
                <div class="title-label-image">Upload Image</div>
                <div class="image-upload-container">
                    <label for="feedback_image" class="custom-image-upload position-relative" id="feedbackImageLabel"
                        style="background-position: center center; background-repeat: no-repeat; background-size: 50%; background-image: url('${appUrl}/asset/img/background/add-image.png'); cursor: pointer;">
                        <input type="file" id="feedback_image" name="image" accept="image/*" class="d-none">
                        <span class="image-clear-btn d-none" id="feedbackImageClearBtn" title="Remove image">&times;</span>
                    </label>
                </div>
            </div>

            <div class="mb-3">
                <label for="feedback_comment" class="form-label label-custom">Feedback Comment</label>
                <textarea class="form-control input-text" id="feedback_comment" name="feedback_comment" rows="3" required></textarea>
            </div>

            <div class="mb-3">
                <label for="reference_url" class="form-label label-custom">Reference URL (Optional)</label>
                <input type="url" class="form-control input-text" id="reference_url" name="reference_url" placeholder="https://example.com">
            </div>

            <div class="mb-3">
                <label for="reference_file" class="form-label label-custom">Reference File (Optional)</label>
                <input type="file" class="form-control input-text" id="reference_file" name="reference_file" accept=".pdf,.doc,.docx" multiple>
            </div>
        </form>`;

    // setup image preview/clear
    const imgInput = bodyEl.querySelector('#feedback_image');
    const imgLabel = bodyEl.querySelector('#feedbackImageLabel');
    const imgClear = bodyEl.querySelector('#feedbackImageClearBtn');
    imgInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imgLabel.style.backgroundImage = `url('${e.target.result}')`;
                imgLabel.classList.add('has-image');
                imgLabel.style.backgroundSize = 'cover';
                imgLabel.style.opacity = '1';
                imgClear.classList.remove('d-none');
            };
            reader.readAsDataURL(this.files[0]);
        }
    });
    imgClear.addEventListener('click', function(e) {
        e.preventDefault();
        imgInput.value = '';
    imgLabel.style.backgroundImage = `url('${appUrl}/asset/img/background/add-image.png')`;
        imgLabel.classList.remove('has-image');
        imgLabel.style.opacity = '0.5';
        imgClear.classList.add('d-none');
    });

    // rebind Add Feedback button to submit
    const newBtn = addBtn.cloneNode(true);
    addBtn.parentNode.replaceChild(newBtn, addBtn);
    newBtn.textContent = 'Submit';
    newBtn.addEventListener('click', function() {
    const form = document.getElementById('addFeedbackForm');
        if (!form) return;
        // show unified spinner on the button
        const originalBtnHtml = newBtn.innerHTML;
        newBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        newBtn.disabled = true;

        const formData = new FormData(form);
        fetch((appUrl ? appUrl : '') + '/task-feedbacks', {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            },
            body: formData
        })
        .then(r => r.json())
    .then(res => {
            // Show global floating alert using Settings style if available
            const msg = res.message || 'Feedback submitted successfully!';
            if (typeof window.showAlertMsg === 'function') {
                // Force light style
                window.showAlertMsg(msg, 'light', 2000);
            } else if (typeof showFloatingAlert === 'function') {
                showFloatingAlert(msg, 'success');
            } else {
                // lightweight fallback
                const alertDiv = document.createElement('div');
                alertDiv.className = 'alert alert-success d-flex align-items-center';
                Object.assign(alertDiv.style, { position: 'fixed', right: '20px', bottom: '20px', zIndex: '9999', opacity: '1', minWidth: '300px', margin: '0' });
                alertDiv.textContent = msg;
                document.body.appendChild(alertDiv);
                setTimeout(() => { alertDiv.style.opacity = '0'; setTimeout(() => alertDiv.remove(), 500); }, 1500);
            }
            // Keep modal open and switch back to list view
            try {
                const titleEl = document.querySelector('#taskFeedbackModal .feedback-modal-title');
                if (titleEl) titleEl.textContent = 'Task Feedback';
                const addBtnRef = document.getElementById('addFeedbackButton');
                if (addBtnRef) {
                    addBtnRef.textContent = 'Add Feedback';
                    const freshBtn = addBtnRef.cloneNode(true);
                    addBtnRef.parentNode.replaceChild(freshBtn, addBtnRef);
                    // ensure the new button is enabled and clickable
                    freshBtn.disabled = false;
                    freshBtn.removeAttribute('disabled');
                    freshBtn.addEventListener('click', () => showDashboardAddFeedbackForm(taskId));
                }
                loadDashboardTaskFeedbackData(taskId);

                // Also update the feedback count on the dashboard card immediately
                try {
                    const selector = `.feedback-comments-count[data-task-id="${taskId}"]`;
                    let countEl = document.querySelector(selector);
                    if (countEl) {
                        const cur = parseInt(countEl.textContent || '0', 10) || 0;
                        countEl.textContent = cur + 1;
                    } else {
                        // If not present (was zero), insert a new counter span after the icon
                        const iconEl = document.querySelector(`.task-feedback-trigger[data-task-id="${taskId}"]`);
                        if (iconEl && iconEl.parentElement) {
                            const span = document.createElement('span');
                            span.className = 'ms-1 small feedback-comments-count';
                            span.style.color = '#555';
                            span.setAttribute('data-task-id', String(taskId));
                            span.textContent = '1';
                            iconEl.insertAdjacentElement('afterend', span);
                        }
                    }
                } catch(_){}
            } catch (e) { /* noop */ }
    })
    .catch(() => {
            const msg = 'Failed to submit feedback. Please try again.';
            if (typeof window.showAlertMsg === 'function') {
                // Force light style
                window.showAlertMsg(msg, 'light', 3000);
            } else if (typeof showFloatingAlert === 'function') {
                // Fallback util will render light style
                showFloatingAlert(msg, 'light');
            } else {
                // Minimal DOM fallback in light style
                const alertDiv = document.createElement('div');
                alertDiv.className = 'alert alert-light d-flex align-items-center';
                Object.assign(alertDiv.style, { position: 'fixed', right: '20px', bottom: '20px', zIndex: '9999', opacity: '1', minWidth: '300px', margin: '0' });
                alertDiv.textContent = msg;
                document.body.appendChild(alertDiv);
                setTimeout(() => { alertDiv.style.opacity = '0'; setTimeout(() => alertDiv.remove(), 500); }, 2000);
            }
    })
    .finally(() => {
            newBtn.innerHTML = originalBtnHtml;
            newBtn.disabled = false;
    });
    });
}

// ensure floating alert util exists (fallback only). Prefer global one from attendance.js
if (typeof window.showFloatingAlert !== 'function') {
    window.showFloatingAlert = function(message) {
        if (typeof window.showAlertMsg === 'function') {
            // Force light style
            window.showAlertMsg(String(message || ''), 'light', 2000);
            return;
        }
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-light d-flex align-items-center';
        Object.assign(alertDiv.style, { position: 'fixed', right: '20px', bottom: '20px', zIndex: '9999', opacity: '1', minWidth: '300px', margin: '0' });
        alertDiv.textContent = String(message || '');
        document.body.appendChild(alertDiv);
        setTimeout(() => { alertDiv.style.opacity = '0'; setTimeout(() => alertDiv.remove(), 500); }, 1500);
    };
}

