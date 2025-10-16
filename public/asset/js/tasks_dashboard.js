$(".btn-tab-task").on("click", function () {
    $(".btn-tab-task").removeClass("active");
    $(this).addClass("active");

    showTask();
});

// Helper function to set dashboard feedback count with proper zero handling
function setDashboardFeedbackCount(taskId, count) {
    const selector = `.feedback-comments-count[data-task-id="${taskId}"]`;
    let countEl = document.querySelector(selector);

    if (count > 0) {
        if (countEl) {
            countEl.textContent = count;
            countEl.style.display = '';
        } else {
            // Create new counter element
            const iconEl = document.querySelector(`.task-feedback-trigger[data-task-id="${taskId}"]`);
            if (iconEl && iconEl.parentElement) {
                const span = document.createElement('span');
                span.className = 'ms-1 small feedback-comments-count';
                span.style.color = '#555';
                span.setAttribute('data-task-id', String(taskId));
                span.textContent = count;
                iconEl.insertAdjacentElement('afterend', span);
            }
        }
    } else if (countEl) {
        // Hide counter when count is 0
        countEl.textContent = '';
        countEl.style.display = 'none';
    }
}

// Mapping warna status
function getStatusBackground(statusNorm) {
    let bg = '#FFFFFF'; // default
    if (statusNorm === 'new_request') {
        bg = '#a1a3a60d';
    } else if (statusNorm === 'in_progress') {
        bg = '#edebdf';
    } else if (statusNorm === 'completed') {
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
                    const safeUrl = av.url || '/asset/img/avatar.png';
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
                            ${(function(){
                                // Fallback avatar if project_image is default placeholder
                                const img = (t.project_image||'').toString();
                                const isDefault = /asset\/img\/profile_picture\/default\.png$/i.test(img);
                                const titleSource = t.project_title || t.title || '';
                                function buildInitials(txt){
                                    const parts = (txt||'').trim().split(/\s+/).filter(Boolean);
                                    if (!parts.length) return 'NA';
                                    if (parts.length === 1) return parts[0].substring(0,2).toUpperCase();
                                    return (parts[0][0] + parts[parts.length-1][0]).toUpperCase();
                                }
                                function pickColor(key){
                                    const colors=['#6A5AE0','#FF8A3C','#00A881','#D4526E','#3E8EDE','#546E7A','#8E44AD','#2E7D32','#AD1457','#EF6C00'];
                                    let h=0; for(let i=0;i<key.length;i++){h=(h*31+key.charCodeAt(i))>>>0;} return colors[h%colors.length];
                                }
                                if (isDefault) {
                                    const initials = buildInitials(titleSource);
                                    const color = pickColor(titleSource||initials);
                                    return `<div class=\"rounded-circle me-3 d-flex justify-content-center align-items-center\" style=\"width:28px;height:28px;font-size:11px;font-weight:600;color:#fff;background:${color};\">${initials}</div>`;
                                }
                                return `<img src=\"${img}\" class=\"rounded-circle me-3\" style=\"width:28px;height:28px;object-fit:cover;\" onerror=\"this.onerror=null;this.style.display='none';\">`;
                            })()}
                        <h6 class="mb-0" style="font-size: 14px">${escapeHtml(t.title || '-')}</h6>
                    </div>`;

                const descText = t.description ? htmlToText(t.description) : '';
                const descPreview = descText ? (descText.length > 140 ? descText.slice(0, 140) + '…' : descText) : '';
                // Wrap preview in a scrollable container so long descriptions in the
                // dashboard card don't stretch the card. Preserve line breaks.
                const descHtml = descPreview
                    ? `<div class="task-desc-scroll mb-2">
                            <p class="mb-0 small">${escapeHtml(descPreview).replace(/\n/g, '<br>')}</p>
                       </div>`
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
                    <div class="custom-card p-3 mb-3" style="background:${bg};position:relative;" data-task-id={${t.id}}>
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
                    const safeUrl = av.url || '/asset/img/avatar.png';
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
                            ${(function(){
                                const img=(t.project_image||'').toString();
                                const isDefault=/asset\/img\/profile_picture\/default\.png$/i.test(img);
                                const titleSource=t.project_title || t.title || '';
                                function buildInitials(txt){
                                    const parts=(txt||'').trim().split(/\s+/).filter(Boolean);
                                    if(!parts.length) return 'NA';
                                    if(parts.length===1) return parts[0].substring(0,2).toUpperCase();
                                    return (parts[0][0]+parts[parts.length-1][0]).toUpperCase();
                                }
                                function pickColor(key){
                                    const colors=['#6A5AE0','#FF8A3C','#00A881','#D4526E','#3E8EDE','#546E7A','#8E44AD','#2E7D32','#AD1457','#EF6C00'];
                                    let h=0; for(let i=0;i<key.length;i++){h=(h*31+key.charCodeAt(i))>>>0;} return colors[h%colors.length];
                                }
                                if(isDefault){
                                    const initials=buildInitials(titleSource);
                                    const color=pickColor(titleSource||initials);
                                    return `<div class=\"rounded-circle me-3 d-flex justify-content-center align-items-center\" style=\"width:28px;height:28px;font-size:11px;font-weight:600;color:#fff;background:${color};\">${initials}</div>`;
                                }
                                return `<img src=\"${img}\" class=\"rounded-circle me-3\" style=\"width:28px;height:28px;object-fit:cover;\" onerror=\"this.onerror=null;this.style.display='none';\">`;
                            })()}
                        <h6 class="mb-0" style="font-size: 14px">${escapeHtml(t.title || '-')}</h6>
                    </div>`;

                const descText = t.description ? htmlToText(t.description) : '';
                const descPreview = descText ? (descText.length > 140 ? descText.slice(0, 140) + '…' : descText) : '';
                // Wrap preview in a scrollable container so long descriptions in the
                // dashboard card don't stretch the card. Preserve line breaks.
                const descHtml = descPreview
                    ? `<div class="task-desc-scroll mb-2">
                            <p class="mb-0 small">${escapeHtml(descPreview).replace(/\n/g, '<br>')}</p>
                       </div>`
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
                    <div class="custom-card p-3 mb-3" style="background:${bg};position:relative;" data-task-id={${t.id}}>
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

// Convert HTML string to plain text safely (strip tags). Uses a detached element
// so any markup is converted to text and scripts won't execute in the document.
function htmlToText(html) {
    if (!html) return '';
    try {
        // Convert common block/line-break tags to newline placeholders so textContent
        // preserves separations (e.g. <p> and <br> become line breaks in the result).
        let s = String(html || '');
        s = s.replace(/<br\s*\/?>/gi, '\n')
             .replace(/<\/(p|div|li|h[1-6])>/gi, '\n');
        const div = document.createElement('div');
        div.innerHTML = s;
        let txt = (div.textContent || div.innerText || '').toString();
        // Normalize line endings, trim each line and collapse multiple blank lines
        txt = txt.split(/\r?\n/).map(l => l.trim()).filter((v,i,a) => !(v === '' && a[i-1] === '')).join('\n').trim();
        return txt;
    } catch (e) {
        // Fallback: replace br/closing blocks with newlines then strip tags
        return String(html).replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '').trim();
    }
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

document.addEventListener('click', function(e) {
    const referenceFileBtn = e.target.closest(".task-attach-trigger");
    if (referenceFileBtn) {
        const taskId = referenceFileBtn.getAttribute("data-task-id");
        if (!taskId) return;
        addAttachFileIconListeners(taskId);
    }
});

function AddFilesModal() {
    let modalEl = $("#addFilesModal");
    if(modalEl) return modalEl;
    const wrapper = document.createElement('div');
    wrapper.innerHtml = `
        <div class="">
    `;
}

function showDeleteConfirmModal({ id, content, parentModalId, onConfirm }) {
    try {
        const modalId = 'deleteConfirmModal_ref_' + id + '_' + Date.now();

        const modalHtml = `
            <div class="modal fade" id="${modalId}" tabindex="-1" aria-modal="true" role="dialog">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content modal-content-custom">
                        <div class="modal-body modal-body-custom">
                            <div class="text-center mb-2">
                                <p class="fw-bold fs-6 mb-1">${escapeHtml(content || '')}</p>
                            </div>
                            <hr class="my-2">
                            <p class="fw-normal fs-6 text-center mb-4">
                                Are you sure want to delete this reference file?
                            </p>
                            <div class="modal-footer modal-footer-custom">
                                <button type="button" class="btn btn-custom-close" data-bs-dismiss="modal">Cancel</button>
                                <button type="button" class="btn btn-submit-black" id="${modalId}_confirmBtn">Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;

        // Hide parent modal if provided
        let parentModalInstance = null;
        const parentEl = parentModalId ? document.getElementById(parentModalId) : null;
        const wasParentOpen = parentEl && parentEl.classList.contains('show');
        if (wasParentOpen) {
            parentModalInstance = bootstrap.Modal.getInstance(parentEl);
            parentModalInstance?.hide();
        }

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modalEl = document.getElementById(modalId);
        const modalInstance = new bootstrap.Modal(modalEl, { backdrop: 'static' });
        modalInstance.show();

        // Cancel handler
        modalEl.querySelector('[data-bs-dismiss="modal"]').addEventListener('click', () => {
            modalInstance.hide();
            modalEl.remove();
            if (wasParentOpen && parentModalInstance) {
                setTimeout(() => parentModalInstance.show(), 180);
            }
        });

        // Confirm handler
        const confirmBtn = document.getElementById(`${modalId}_confirmBtn`);
        confirmBtn.addEventListener('click', function () {
            confirmBtn.disabled = true;
            confirmBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Deleting...';
            if (typeof onConfirm === 'function') {
                onConfirm(function done(shouldClose = true) {
                    confirmBtn.disabled = false;
                    confirmBtn.innerHTML = 'Delete';
                    if (shouldClose) {
                        modalInstance.hide();
                        modalEl.remove();
                        if (wasParentOpen && parentModalInstance) {
                            setTimeout(() => parentModalInstance.show(), 180);
                        }
                    }
                });
            } else {
                modalInstance.hide();
                modalEl.remove();
            }
        });
    } catch (e) {
        console.error('showDeleteConfirmModal error:', e);
    }
}

let attachFileIconListenerBound = false;

function addAttachFileIconListeners(taskId) {
    $.ajax({
        url: appUrl + "/task/" + taskId,
        type: "GET",
        dataType: "json",
        success: function (res) {
            const payload = res && (res.data || res);
            let referenceFiles = payload && payload.reference_files;

            if (typeof referenceFiles === "string") {
                try {
                    referenceFiles = JSON.parse(referenceFiles);
                } catch {
                    referenceFiles = referenceFiles.includes("[")
                        ? []
                        : referenceFiles.split(",").map(s => s.trim()).filter(Boolean);
                }
            }

            const referenceFilesList = document.getElementById("referenceFilesList");
            if (!referenceFilesList) return;
            referenceFilesList.innerHTML = "";
            referenceFilesList.dataset.taskId = String(taskId || '');

                    if (Array.isArray(referenceFiles) && referenceFiles.length > 0) {
                        referenceFiles.forEach((fileName) => {
                            if (!fileName) return;

                                let fileUrl = String(fileName || '');
                                const isAbs = fileUrl.startsWith('http://') || fileUrl.startsWith('https://');
                                const isRefPath = fileUrl.startsWith('/file/task_reference_files/') || fileUrl.startsWith('file/task_reference_files/') || fileUrl.startsWith('/file/') || fileUrl.startsWith('file/');
                                if (!isAbs && !isRefPath) {
                                    fileUrl = appUrl + '/file/task_reference_files/' + fileUrl;
                                } else if (!isAbs && fileUrl.startsWith('/')) {
                                    fileUrl = appUrl + fileUrl;
                                }

                                const item = document.createElement('div');
                                item.className = 'd-flex align-items-center gap-2 p-2 rounded bg-light selected-task mb-2';

                                const lower = String(fileName || '').toLowerCase();
                                const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(lower);

                                if (isImage) {
                                    const img = document.createElement('img');
                                    img.src = fileUrl;
                                    img.width = 28; img.height = 28;
                                    img.style.objectFit = 'cover'; img.style.borderRadius = '50%';
                                    img.alt = fileName;
                                    item.appendChild(img);
                                } else {
                                    const badge = document.createElement('div');
                                    item.appendChild(badge);
                                }

                                const title = document.createElement('a');
                                title.className = 'flex-grow-1 text-decoration-none text-truncate';
                                title.href = fileUrl;
                                title.target = '_blank';
                                title.textContent = fileName;
                                title.style.color = "#444444"
                                item.appendChild(title);

                                const dlBtn = document.createElement('button');
                                dlBtn.type = 'button';
                                dlBtn.className = 'btn btn-sm btn-link p-0 ms-2';
                                dlBtn.title = 'Download';
                                dlBtn.style.color = "#444444"
                                dlBtn.innerHTML = '<span class="material-symbols-outlined">download</span>';
                                dlBtn.addEventListener('click', function (ev) {
                                    try {
                                        ev.preventDefault(); ev.stopPropagation();
                                        const a = document.createElement('a');
                                        a.style.display = 'none';
                                        a.href = fileUrl;
                                        try { a.download = String(fileName || '').split('/').pop(); } catch(_) {}
                                        a.target = '_blank';
                                        document.body.appendChild(a);
                                        a.click();
                                        setTimeout(() => { try { document.body.removeChild(a); } catch(_) {} }, 100);
                                    } catch (e) {
                                        window.open(fileUrl, '_blank');
                                    }
                                });

                                item.appendChild(dlBtn);

                                const delBtn = document.createElement('button');
                                delBtn.type = 'button';
                                delBtn.className = 'btn btn-sm btn-link p-0 ms-2';
                                delBtn.title = 'Delete';
                                delBtn.style.color = '#444444';
                                delBtn.innerHTML = '<span class="material-symbols-outlined icon-fill">delete</span>';
                                delBtn.addEventListener('click', function (ev) {
                                ev.preventDefault(); ev.stopPropagation();
                                try {
                                    showDeleteConfirmModal({
                                        id: fileName,
                                        content: fileName,
                                        parentModalId: 'referenceFilesModal',
                                        onConfirm: function (done) {
                                            try {
                                                const remaining = (Array.isArray(referenceFiles) ? referenceFiles.slice() : [])
                                                    .filter(f => String(f) !== String(fileName));

                                                $.ajax({
                                                    url: appUrl + '/task/' + taskId + '/reference-file',
                                                    type: 'DELETE',
                                                    data: { filename: fileName },
                                                    headers: {
                                                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                                                    },
                                                    success: function (res) {
                                                        try {
                                                            if (typeof showFloatingAlert === 'function')
                                                                showFloatingAlert(res.message || 'Reference file deleted', 'success');
                                                        } catch (_) {}

                                                        if (item && item.parentNode) item.parentNode.removeChild(item);

                                                        try {
                                                            const idx = referenceFiles.indexOf(fileName);
                                                            if (idx !== -1) referenceFiles.splice(idx, 1);
                                                        } catch (_) {}

                                                        try {
                                                            const card = document.querySelector('.custom-card[data-task-id="' + taskId + '"]');
                                                            if (card) {
                                                                const span = card.querySelector('.reference-files-count');
                                                                let newCount = 0;
                                                                try {
                                                                    newCount = Math.max(
                                                                        (parseInt(span ? span.textContent : '0', 10) || 0) - 1,
                                                                        0
                                                                    );
                                                                } catch (_) {
                                                                    newCount = 0;
                                                                }
                                                                if (span) {
                                                                    if (newCount <= 0) {
                                                                        try {
                                                                            span.remove();
                                                                        } catch (_) {
                                                                            span.style.display = 'none';
                                                                        }
                                                                    } else {
                                                                        span.textContent = String(newCount);
                                                                    }
                                                                }
                                                            }
                                                        } catch (_) {}

                                                        try {
                                                            const rList = document.getElementById('referenceFilesList');
                                                            if (rList) {
                                                                if (!(Array.isArray(referenceFiles) && referenceFiles.length > 0)) {
                                                                    rList.innerHTML = '';
                                                                    rList.textContent = 'No reference files available.';
                                                                }
                                                            }
                                                        } catch (_) {}

                                                        done(true);
                                                    },
                                                    error: function (xhr) {
                                                        let msg = 'Failed to delete reference file';
                                                        if (xhr.responseJSON && xhr.responseJSON.message)
                                                            msg = xhr.responseJSON.message;
                                                        try {
                                                            if (typeof showFloatingAlert === 'function')
                                                                showFloatingAlert(msg, 'danger');
                                                        } catch (_) {
                                                            alert(msg);
                                                        }
                                                        done(false);
                                                    }
                                                });
                                            } catch (e) {
                                                try {
                                                    if (typeof showFloatingAlert === 'function')
                                                        showFloatingAlert('Failed to delete reference file', 'danger');
                                                } catch (_) {}
                                                done(false);
                                            }
                                        }
                                    });

                                } catch (e) {}
                            });

                            item.appendChild(delBtn);
                            referenceFilesList.appendChild(item);
                        });
                    } else {
                        referenceFilesList.textContent = "No reference files available.";
                    }

            const modalEl = document.getElementById("referenceFilesModal");
            if (modalEl) {
                modalEl.dataset.taskId = String(taskId || '');
                const referenceFilesModal = bootstrap.Modal.getOrCreateInstance(modalEl);
                referenceFilesModal.show();
            }
        },
        error: function () {
            showFloatingAlert("Failed to load reference files.", "danger", 3000);
        },
    });
}

function displaySelectedFiles() {
    function findVisiblePreview(ids) {
        let fallback = null;
        for (const id of ids) {
            const el = document.getElementById(id);
            if (el && !fallback) fallback = el;
            if (el && el.offsetParent !== null) return el;
        }
        return fallback;
    }
    const preview = findVisiblePreview([
        'schedule_reference_files_preview',
        'feedback_reference_files_preview',
        'reference_files_preview',
    ]);
    if (!preview) return;
    preview.innerHTML = '';

    if (selectedFiles.length > 0) {
        const fileList = document.createElement('div');
        fileList.className = 'selected-files-list mt-2';

        selectedFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'd-flex align-items-center gap-2 p-2 rounded bg-light selected-task mb-2';

            // Thumbnail or placeholder
            if (file && file.type && file.type.indexOf('image') === 0) {
                const img = document.createElement('img');
                const url = URL.createObjectURL(file);
                img.src = url;
                img.width = 28;
                img.height = 28;
                img.style.objectFit = 'cover';
                img.style.borderRadius = '50%';
                img.alt = file.name;
                // revoke object URL after load
                img.onload = function() { try { URL.revokeObjectURL(url); } catch(_) {} };
                fileItem.appendChild(img);
                } else {
                const badge = document.createElement('div');
                fileItem.appendChild(badge);
            }

            const title = document.createElement('span');
            title.className = 'flex-grow-1';
            title.textContent = file.name;
            fileItem.appendChild(title);

            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'btn btn-sm btn-remove-task remove-task';
            removeBtn.style.lineHeight = '1';
            removeBtn.innerHTML = '<span class="material-symbols-outlined">close</span>';
            removeBtn.addEventListener('click', function () {
                selectedFiles.splice(index, 1);
                displaySelectedFiles();
            });

            fileItem.appendChild(removeBtn);
            fileList.appendChild(fileItem);
        });

        preview.appendChild(fileList);
    }
}

selectedFiles = [];

function setupReferenceFilesInput() {
    const input = document.getElementById("task_reference_files");
    const preview = document.getElementById("reference_files_preview");

    if (!input || !preview) return;

    input.addEventListener("change", function () {
        const files = Array.from(this.files);
        selectedFiles = [...selectedFiles, ...files];
        displaySelectedFiles();

        this.value = "";
    });
}

function initAddReferenceFilesModal() {
    const openBtn = $('#openAddReferenceFilesBtn');
    const refModalEl = $('#addFilesModal');
    const refModal = refModalEl.length ? new bootstrap.Modal(refModalEl[0]) : null;
    const refForm = $('#referenceFilesForm');
    const fileInput = $('#task_reference_files');
    const preview = $('#reference_files_preview');
    const submitBtn = $('#submitAddReferenceFiles');

    if (!openBtn.length || !refModalEl.length || !refForm.length || !fileInput.length || !preview.length || !submitBtn.length) return;

    openBtn.on('click', function () {
        try {
            const refFilesModalEl = $('#referenceFilesModal');
            if (refFilesModalEl.length) {
                const cm = bootstrap.Modal.getInstance(refFilesModalEl[0]) || new bootstrap.Modal(refFilesModalEl[0]);
                cm.hide();
            }
        } catch (_) {}
        const taskId = $('#referenceFilesModal').data('taskId')
            || $('#referenceFilesList').data('taskId')
            || $(this).data('taskId')
        if (!taskId) {
            if (typeof showFloatingAlert === 'function') showFloatingAlert('Task ID not found. Cannot add files.', 'danger');
            return;
        }
        $('#refTaskId').val(taskId || '');
        fileInput.val('');
        fileInput.css('border', 'none');
        preview.empty();
        window.addRefSelectedFiles = [];
        refModal.show();
    });

    fileInput.on('change', function () {
        const files = Array.from(this.files || []);
        window.addRefSelectedFiles = window.addRefSelectedFiles || [];
        window.addRefSelectedFiles = window.addRefSelectedFiles.concat(files);
        renderAddRefSelectedFiles();
        this.value = '';
    });

    function renderAddRefSelectedFiles() {
        preview.empty();
        const list = $('<div class="selected-files-list mt-2"></div>');
        (window.addRefSelectedFiles || []).forEach((file, idx) => {
            const item = $('<div class="d-flex align-items-center gap-2 p-2 rounded bg-light selected-task mb-2"></div>');
            if (file && file.type && file.type.indexOf('image') === 0) {
                const url = URL.createObjectURL(file);
                const img = $('<img width="28" height="28" style="object-fit:cover;border-radius:50%;">').attr('src', url).attr('alt', file.name);
                img.on('load', () => { try { URL.revokeObjectURL(url); } catch (_) {} });
                item.append(img);
            } else {
                item.append($('<div></div>'));
            }
            const title = $('<span class="flex-grow-1"></span>').text(file.name);
            item.append(title);
            const removeBtn = $('<button type="button" class="btn btn-sm btn-remove-task remove-task" style="line-height:1;"><span class="material-symbols-outlined">close</span></button>');
            removeBtn.on('click', function () {
                window.addRefSelectedFiles.splice(idx, 1);
                renderAddRefSelectedFiles();
            });
            item.append(removeBtn);
            list.append(item);
        });
        preview.append(list);
    }

    submitBtn.on('click', function (e) {
        e.preventDefault();
        const taskId = $('#refTaskId').val();
        if (!taskId) {
            if (typeof showFloatingAlert === 'function') showFloatingAlert('Task ID not found.', 'danger');
            return;
        }
        const files = window.addRefSelectedFiles || [];
        if (!files.length) {
            if (typeof showFloatingAlert === 'function') showFloatingAlert('Please select at least one file to upload.', 'warning');
            return;
        }
        const fd = new FormData();
        files.forEach(f => fd.append('reference_files[]', f));
        fd.append('task_id', taskId);
        submitBtn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span>');
        fetch(appUrl + '/task/' + encodeURIComponent(taskId) + '/reference-file', {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
            },
            body: fd
        }).then(res => res.ok ? res.json() : res.json().then(Promise.reject))
            .then(payload => {
                const newCount = (() => {
                    try {
                        if (!payload) return undefined;
                        if (Array.isArray(payload.reference_files)) return payload.reference_files.length;
                        if (typeof payload.reference_files_count === 'number') return payload.reference_files_count;
                        if (typeof payload.reference_files === 'string') {
                            try {
                                const parsed = JSON.parse(payload.reference_files);
                                if (Array.isArray(parsed)) return parsed.length;
                            } catch (_) {
                                return payload.reference_files.split(',').filter(Boolean).length;
                            }
                        }
                        return undefined;
                    } catch (_) { return undefined; }
                })();
                if (typeof showFloatingAlert === 'function') showFloatingAlert(payload.message || 'Files uploaded', 'success', 2000);
                refModal.hide();
                window.addRefSelectedFiles = [];
                renderAddRefSelectedFiles();
                try {
                    const card = $('.custom-card[data-task-id="' + taskId + '"]');
                    if (card.length && typeof newCount !== 'undefined') {
                        let span = card.find('.reference-files-count');
                        if (newCount > 0) {
                            if (span.length) span.text(String(newCount));
                            else {
                                const s = $('<span class="reference-files-count ms-1" style="color:#454545;font-size:12px;"></span>').text(String(newCount));
                                let attachWrapper = card.find('.btn-attach-file-wrapper').filter(function () {
                                    const icon = $(this).find('.material-symbols-outlined');
                                    return icon.text().trim() === 'attach_file';
                                }).first();
                                if (!attachWrapper.length) attachWrapper = card.find('.btn-attach-file-wrapper.d-flex.align-items-center').first();
                                if (attachWrapper.length) attachWrapper.append(s);
                            }
                        } else if (span.length) span.remove();
                    }
                } catch (_) {}
                const cardForClick = $('.custom-card[data-task-id="' + taskId + '"]');
                let attachBtn = null;
                if (cardForClick.length) {
                    const icons = cardForClick.find('.task-icon');
                    attachBtn = icons.filter(function () { return $(this).text().trim() === 'attach_file'; }).first();
                }
                if (attachBtn && typeof attachBtn[0].click === 'function') {
                    setTimeout(function () { try { attachBtn[0].click(); } catch (_) {} }, 200);
                } else {
                    $.ajax({
                        url: appUrl + '/task/' + encodeURIComponent(taskId),
                        type: 'GET',
                        dataType: 'json',
                        success: function (res) {
                            const t = res && (res.data || res);
                            const card = $('.custom-card[data-task-id="' + taskId + '"]');
                            if (card.length) {
                                let span = card.find('.reference-files-count');
                                const count = (Array.isArray(t.reference_files) ? t.reference_files.length : (t.reference_files_count || 0)) || 0;
                                if (count > 0) {
                                    if (span.length) span.text(String(count));
                                    else {
                                        const s = $('<span class="reference-files-count ms-1" style="color:#454545;font-size:12px;"></span>').text(String(count));
                                        let attachWrapper = card.find('.btn-attach-file-wrapper').filter(function () {
                                            const icon = $(this).find('.material-symbols-outlined');
                                            return icon.text().trim() === 'attach_file';
                                        }).first();
                                        if (!attachWrapper.length) attachWrapper = card.find('.btn-attach-file-wrapper.d-flex.align-items-center').first();
                                        if (attachWrapper.length) attachWrapper.append(s);
                                    }
                                } else if (span.length) span.remove();
                            }
                        }
                    });
                }
            }).catch(err => {
                console.error('Upload failed', err);
                const msg = (err && (err.message || err.error || (err.errors && err.errors[0]))) || 'Upload failed';
                if (typeof showFloatingAlert === 'function') showFloatingAlert(msg, 'danger');
            }).finally(() => {
                submitBtn.prop('disabled', false).html('Upload');
            });
    });
}

(function(){
    try {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initAddReferenceFilesModal);
        } else {
            initAddReferenceFilesModal();
        }
    } catch (e) {}
})();

function openDashboardTaskFeedback(taskId) {
    const modalEl = $('#taskFeedbackModal')[0];
    if (!modalEl) return;
    $(modalEl).data('taskId', taskId);
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    $('.feedback-modal-title', modalEl).text('Task Feedback');
    $('.feedback-modal-body', modalEl).html('');
    setupDashboardInlineFeedbackEditor(taskId);
    modal.show();
    setTimeout(() => loadDashboardTaskFeedbackData(taskId), 100);
}

function loadDashboardTaskFeedbackData(taskId) {
    const bodyEl = $('#taskFeedbackList');
    if (!bodyEl.length) return;
    bodyEl.html('<div class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>');
    const appUrl = $('meta[name="app-url"]').attr('content') || '';
    $.ajax({
        url: `${appUrl}/task-feedbacks/${taskId}?_=${Date.now()}`,
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
        cache: false,
        success: res => {
            const data = res.data || [];
            if (!data.length) {
                bodyEl.html('<p class="text-center text-muted">No feedback available for this task.</p>');
                return;
            }
            const timeAgo = d => {
                if (!d) return '';
                const date = new Date(d);
                const diff = Date.now() - date;
                const min = Math.floor(diff / 60000), hr = Math.floor(min / 60), day = Math.floor(hr / 24);
                if (day > 1) return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
                if (day === 1) return '1 day ago';
                if (hr > 0) return `${hr} hour${hr > 1 ? 's' : ''} ago`;
                if (min > 0) return `${min} minute${min > 1 ? 's' : ''} ago`;
                return 'just now';
            };
            const currentEmployeeId = $('#taskFeedbackModal').data('employeeId') || '';
            const html = data.map(fb => {
                const formattedDate = timeAgo(fb.created_at);
                const name = fb.employee?.name || 'Unknown';
                const photo = fb.employee?.photo || `${appUrl}/asset/img/avatar.png`;
                const feedbackComment = fb.feedback_comment || '';
                let topImageUrl = fb.image || '';
                if (topImageUrl && !topImageUrl.startsWith('http')) topImageUrl = `${appUrl}/file/task/${topImageUrl}`;
                let topRefFiles = [];
                try {
                    let refFiles = fb.reference_files_urls || fb.reference_files || [];
                    if (typeof refFiles === 'string') {
                        try { refFiles = JSON.parse(refFiles); } catch { refFiles = refFiles.split(',').map(s => s.trim()).filter(Boolean); }
                    }
                    if (Array.isArray(refFiles) && refFiles.length > 0) {
                        topRefFiles = refFiles.map(f => f.startsWith('http') ? f : `${appUrl}/file/task_reference_files/${f}`).filter(Boolean);
                    }
                } catch {}
                let topRefUrls = [];
                try {
                    let refUrls = fb.reference_urls || [];
                    if (typeof refUrls === 'string') {
                        try { refUrls = JSON.parse(refUrls); } catch { if (refUrls.trim()) refUrls = [refUrls]; else refUrls = []; }
                    }
                    if (Array.isArray(refUrls) && refUrls.length > 0) topRefUrls = refUrls.filter(u => typeof u === 'string' && u.trim() !== '');
                    else if (fb.reference_url) topRefUrls = [fb.reference_url];
                } catch {}
                const topAuthorId = fb.employee?.id || fb.employee_id || 0;
                const canEditTop = String(topAuthorId) === String(currentEmployeeId);
                const filesHtml = topRefFiles.length ? `
                    <div class="feedback-reference-container mb-2">
                        ${topRefFiles.map(fileUrl => {
                            const fileName = fileUrl.split('/').pop() || 'File';
                            return `<a href="${fileUrl}" class="feedback-reference-file bg-light rounded-2">
                                <span class="material-symbols-outlined" style="color: #444444;">draft</span> ${fileName}
                            </a>`;
                        }).join('')}
                    </div>` : '';
                const urlsHtml = topRefUrls.length ? `
                    <div class="feedback-reference-container mb-2">
                        ${topRefUrls.map(url => {
                            const shortUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
                            return `<a href="${url}" target="_blank" class="feedback-reference-url bg-light rounded-2">
                                <span class="material-symbols-outlined" style="color: #444444;">link</span> ${shortUrl}
                            </a>`;
                        }).join('')}
                    </div>` : '';
                const imgHtml = topImageUrl ? `<img src="${topImageUrl}" class="img-fluid rounded mb-2 feedback-image" style="width:70px;height:auto;border-radius:8px;cursor:pointer;">` : '';

                // Process replies
                const replies = Array.isArray(fb.replies) ? fb.replies : [];
                const repliesCount = replies.length;

                let repliesHtml = '';
                if (repliesCount > 0) {
                    repliesHtml = `<div class="replies-container d-none mt-3" id="replies-${fb.id}">`;
                    replies.forEach(rep => {
                        const repDate = timeAgo(rep.created_at);
                        const repName = rep.employee?.name || 'Unknown';
                        const repPhoto = rep.employee?.photo || `${appUrl}/asset/img/avatar.png`;
                        const repComment = rep.feedback_comment || '';

                        let repImageUrl = rep.image || '';
                        if (repImageUrl && !repImageUrl.startsWith('http')) repImageUrl = `${appUrl}/file/task/${repImageUrl}`;

                        let repRefFiles = [];
                        try {
                            let refFiles = rep.reference_files_urls || rep.reference_files || [];
                            if (typeof refFiles === 'string') {
                                try { refFiles = JSON.parse(refFiles); } catch { refFiles = refFiles.split(',').map(s => s.trim()).filter(Boolean); }
                            }
                            if (Array.isArray(refFiles) && refFiles.length > 0) {
                                repRefFiles = refFiles.map(f => f.startsWith('http') ? f : `${appUrl}/file/task_reference_files/${f}`).filter(Boolean);
                            }
                        } catch {}

                        let repRefUrls = [];
                        try {
                            let refUrls = rep.reference_urls || [];
                            if (typeof refUrls === 'string') {
                                try { refUrls = JSON.parse(refUrls); } catch { if (refUrls.trim()) refUrls = [refUrls]; else refUrls = []; }
                            }
                            if (Array.isArray(refUrls) && refUrls.length > 0) repRefUrls = refUrls.filter(u => typeof u === 'string' && u.trim() !== '');
                            else if (rep.reference_url) repRefUrls = [rep.reference_url];
                        } catch {}

                        const repAuthorId = rep.employee?.id || rep.employee_id || 0;
                        const canEditRep = String(repAuthorId) === String(currentEmployeeId);

                        const repFilesHtml = repRefFiles.length ? `
                            <div class="feedback-reference-container mb-2">
                                ${repRefFiles.map(fileUrl => {
                                    const fileName = fileUrl.split('/').pop() || 'File';
                                    return `<a href="${fileUrl}" class="feedback-reference-file bg-light rounded-2">
                                        <span class="material-symbols-outlined" style="color: #444444;">draft</span> ${fileName}
                                    </a>`;
                                }).join('')}
                            </div>` : '';
                        const repUrlsHtml = repRefUrls.length ? `
                            <div class="feedback-reference-container mb-2">
                                ${repRefUrls.map(url => {
                                    const shortUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
                                    return `<a href="${url}" target="_blank" class="feedback-reference-url bg-light rounded-2">
                                        <span class="material-symbols-outlined" style="color: #444444;">link</span> ${shortUrl}
                                    </a>`;
                                }).join('')}
                            </div>` : '';
                        const repImgHtml = repImageUrl ? `<img src="${repImageUrl}" class="img-fluid rounded mb-2 reply-image" style="width:70px;height:auto;border-radius:8px;cursor:pointer;">` : '';

                        repliesHtml += `
                            <div class="feedback-reply ms-4 mt-2 p-2 rounded" data-reply-id="${rep.id}" data-parent-id="${fb.id}" style="background: rgb(240, 241, 248);">
                                <div class="d-flex align-items-start">
                                    <img src="${repPhoto}" alt="${repName}" class="rounded-circle me-2" style="width:28px;height:28px;object-fit:cover;">
                                    <div class="flex-grow-1">
                                        <div>
                                            <strong style="font-size:13px;font-weight:600;">${repName}</strong>
                                            <div><small class="text-muted d-block" style="font-size:10px;">${repDate}</small></div>
                                        </div>
                                        <div class="reply-comment mt-1">
                                            <p class="mb-1" style="font-size:12px;">${repComment}</p>
                                            ${repUrlsHtml}${repFilesHtml}${repImgHtml}
                                            <div class="reply-actions mt-2 d-flex gap-3 align-items-center">
                                                <span class="d-flex align-items-center feedback-reply-trigger" data-feedback-id="${fb.id}" data-task-id="${taskId}" data-author-name="${encodeURIComponent(repName)}" data-author-photo="${encodeURIComponent(repPhoto)}" data-preview-text="${encodeURIComponent(repComment)}" style="cursor:pointer;color:#555;font-size:11px;">
                                                    <span class="material-symbols-outlined" style="font-size:16px;line-height:1;margin-right:3px;">reply</span>
                                                    <span>Reply</span>
                                                </span>
                                                ${canEditRep ? `
                                                <span class="d-flex align-items-center reply-edit-trigger"
                                                    data-task-id="${taskId}"
                                                    data-parent-id="${fb.id}"
                                                    data-reply-id="${rep.id}"
                                                    data-comment="${encodeURIComponent(repComment || '')}"
                                                    data-ref-url="${encodeURIComponent(rep.reference_url || '')}"
                                                    data-ref-urls='${encodeURIComponent(JSON.stringify(repRefUrls || []))}'
                                                    data-ref-file="${encodeURIComponent((repRefFiles && repRefFiles[0]) || '')}"
                                                    data-ref-files='${encodeURIComponent(JSON.stringify(repRefFiles || []))}'
                                                    data-image="${encodeURIComponent(repImageUrl || '')}"
                                                    style="cursor:pointer;color:#555;font-size:11px;">
                                                    <span class="material-symbols-outlined" style="font-size:16px;line-height:1;margin-right:3px;">edit</span>
                                                    <span>Edit</span>
                                                </span>
                                                ` : ''}
                                                ${canEditRep ? `
                                                <span class="d-flex align-items-center reply-delete-trigger" data-reply-id="${rep.id}" data-parent-id="${fb.id}" style="cursor:pointer;color:#555;font-size:11px;">
                                                    <span class="material-symbols-outlined" style="font-size:16px;line-height:1;margin-right:3px;">delete</span>
                                                    <span>Delete</span>
                                                </span>
                                                ` : ''}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>`;
                    });
                    repliesHtml += '</div>';
                }

                const viewAllBtn = repliesCount > 0 ? `<span class="view-replies-toggle" data-feedback-id="${fb.id}" data-replies-count="${repliesCount}" style="font-size:13px;color:#555;cursor:pointer;text-decoration:none;">View all (${repliesCount})</span>` : '';
                return `
                    <div class="feedback-item mb-3 p-3" data-feedback-id="${fb.id}">
                        <div class="d-flex align-items-start mb-2">
                            <img src="${photo}" alt="${name}" class="rounded-circle me-3" style="width:32px;height:32px;object-fit:cover;">
                            <div class="flex-grow-1">
                                <div>
                                    <strong style="font-size:14px;font-weight:600;">${name}</strong>
                                    <div><small class="text-muted d-block" style="font-size:10px;">${formattedDate}</small></div>
                                </div>
                                <div class="feedback-comment mt-2">
                                    <p class="mb-2" style="font-size:13px;">${feedbackComment}</p>
                                    ${urlsHtml}${filesHtml}${imgHtml}
                                    <div class="feedback-actions mt-2 d-flex gap-4 align-items-center">
                                        <span class="d-flex align-items-center feedback-reply-trigger" data-feedback-id="${fb.id}" data-task-id="${taskId}" data-author-name="${encodeURIComponent(name)}" data-author-photo="${encodeURIComponent(photo)}" data-preview-text="${encodeURIComponent(feedbackComment)}" style="cursor:pointer;color:#555;font-size:12px;">
                                            <span class="material-symbols-outlined" style="font-size:18px;line-height:1;margin-right:5px;">reply</span>
                                            <span>Reply</span>
                                        </span>
${canEditTop ? `
    <span
        class="d-flex align-items-center feedback-edit-trigger"
        style="cursor:pointer;color:#555;font-size:12px;"
        data-task-id="${taskId}"
        data-feedback-id="${fb.id}"
        data-comment="${encodeURIComponent(feedbackComment || '')}"
        data-ref-url="${encodeURIComponent(fb.reference_url || '')}"
        data-ref-urls='${encodeURIComponent(JSON.stringify(topRefUrls || []))}'
        data-ref-file="${encodeURIComponent((topRefFiles && topRefFiles[0]) || '')}"
        data-ref-files='${encodeURIComponent(JSON.stringify(topRefFiles || []))}'
        data-image="${encodeURIComponent(topImageUrl || '')}"
    >
        <span class="material-symbols-outlined" style="font-size:18px;line-height:1;margin-right:5px;">edit</span>
        <span>Edit</span>
    </span>
` : ''}

                                        ${canEditTop ? `
                                        <span class="d-flex align-items-center feedback-delete-trigger" data-feedback-id="${fb.id}" style="cursor:pointer;color:#555;font-size:12px;">
                                            <span class="material-symbols-outlined" style="font-size:18px;line-height:1;margin-right:5px;">delete</span>
                                            <span>Delete</span>
                                        </span>` : ''}
                                        ${viewAllBtn}
                                    </div>
                                </div>
                            </div>
                        </div>
                        ${repliesHtml}
                    </div>`;
            }).join('');
            bodyEl.html(html);

            // Bind reply icon click
            $('.feedback-reply-trigger', bodyEl).off('click').on('click', function() {
                const feedbackId = $(this).data('feedbackId');
                const tId = $(this).data('taskId');
                const authorName = decodeURIComponent($(this).attr('data-author-name') || '');
                const authorPhoto = decodeURIComponent($(this).attr('data-author-photo') || '');
                const previewText = decodeURIComponent($(this).attr('data-preview-text') || '');

                // Show preview above editor
                removeDashboardReplyPreview();
                renderDashboardReplyPreview(previewText || '', authorName || 'Unknown', authorPhoto || ((document.querySelector('meta[name="app-url"]')?.getAttribute('content') || '') + '/asset/img/avatar.png'), previewText || '');

                showDashboardReplyFeedbackForm(tId, feedbackId);
            });

            // Bind edit icon click (top-level feedback)
            $('.feedback-edit-trigger', bodyEl).off('click').on('click', function() {
                const tId = $(this).data('taskId');
                const fid = $(this).data('feedbackId');
                const payload = {
                    id: fid,
                    parent_id: null,
                    feedback_comment: decodeURIComponent($(this).data('comment') || ''),
                    reference_url: decodeURIComponent($(this).data('refUrl') || ''),
                    reference_urls: (function(){ try { return JSON.parse(decodeURIComponent($(this).data('refUrls') || '[]')); } catch(e){ return []; } }).call(this),
                    reference_file_url: decodeURIComponent($(this).data('refFile') || ''),
                    reference_files_urls: (function(){ try { return JSON.parse(decodeURIComponent($(this).data('refFiles') || '[]')); } catch(e){ return []; } }).call(this),
                    image_url: decodeURIComponent($(this).data('image') || ''),
                };

                startDashboardInlineEditFeedback(payload);
            });

            // Bind edit icon click (reply)
            $('.reply-edit-trigger', bodyEl).off('click').on('click', function() {
                const tId = $(this).data('taskId');
                const rid = $(this).data('replyId');
                const pid = $(this).data('parentId');
                const payload = {
                    id: rid,
                    parent_id: pid,
                    feedback_comment: decodeURIComponent($(this).data('comment') || ''),
                    reference_url: decodeURIComponent($(this).data('refUrl') || ''),
                    reference_urls: (function(){ try { return JSON.parse(decodeURIComponent($(this).data('refUrls') || '[]')); } catch(e){ return []; } }).call(this),
                    reference_file_url: decodeURIComponent($(this).data('refFile') || ''),
                    reference_files_urls: (function(){ try { return JSON.parse(decodeURIComponent($(this).data('refFiles') || '[]')); } catch(e){ return []; } }).call(this),
                    image_url: decodeURIComponent($(this).data('image') || ''),
                };

                startDashboardInlineEditFeedback(payload);
            });

            // Bind delete icon click (top-level feedback)
            $('.feedback-delete-trigger', bodyEl).off('click').on('click', function() {
                const fid = $(this).data('feedbackId');
                if (!fid) return;
                const authorName = $(this).closest('.feedback-item').find('strong').first().text() || '';
                const content = $(this).closest('.feedback-item').find('.feedback-comment p').first().text() || '';
                const avatarUrl = $(this).closest('.feedback-item').find('img').first().attr('src') || '';
                showDashboardDeleteConfirmModal({
                    type: 'feedback',
                    id: fid,
                    authorName: authorName,
                    content: content,
                    avatarUrl: avatarUrl,
                    taskId: taskId,
                    onConfirm: function(done){
                        const appUrl = $('meta[name="app-url"]').attr('content') || '';
                        const url = appUrl + '/task-feedbacks/' + fid;
                        $.ajax({
                            url: url,
                            type: 'DELETE',
                            headers: {
                                'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
                            },
                            success: function (res) {
                                if (typeof showFloatingAlert === 'function') {
                                    showFloatingAlert(res.message || 'Feedback deleted', 'success');
                                }
                                // Remove feedback DOM
                                $(`.feedback-item[data-feedback-id="${fid}"]`).remove();
                                // Refresh feedback count
                                $.ajax({
                                    url: appUrl + '/task-feedbacks/count/' + taskId,
                                    type: 'GET',
                                    success: function(c){
                                        if (c && c.data && typeof c.data.count === 'number') {
                                            setDashboardFeedbackCount(taskId, c.data.count);
                                        }
                                    }
                                });
                                done(true);
                            },
                            error: function (xhr) {
                                let msg = 'Failed to delete feedback';
                                if (xhr.responseJSON && xhr.responseJSON.message) msg = xhr.responseJSON.message;
                                if (typeof showFloatingAlert === 'function') {
                                    showFloatingAlert(msg, 'danger');
                                } else {
                                    alert(msg);
                                }
                                done(false);
                            }
                        });
                    }
                });
            });

            // Bind delete icon click (reply)
            $('.reply-delete-trigger', bodyEl).off('click').on('click', function() {
                const rid = $(this).data('replyId');
                const pid = $(this).data('parentId');
                if (!rid) return;
                const authorName = $(this).closest('.feedback-reply').find('strong').text() || '';
                const content = $(this).closest('.feedback-reply').find('.reply-comment p').first().text() || '';
                const avatarUrl = $(this).closest('.feedback-reply').find('img').attr('src') || '';
                showDashboardDeleteConfirmModal({
                    type: 'reply',
                    id: rid,
                    parentId: pid,
                    authorName: authorName,
                    content: content,
                    avatarUrl: avatarUrl,
                    taskId: taskId,
                    onConfirm: function(done){
                        const appUrl = $('meta[name="app-url"]').attr('content') || '';
                        const url = appUrl + '/task-feedbacks/' + rid;
                        $.ajax({
                            url: url,
                            type: 'DELETE',
                            headers: { 'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content') },
                            success: function (res) {
                                if (typeof showFloatingAlert === 'function') {
                                    showFloatingAlert(res.message || 'Reply deleted', 'success');
                                }
                                // Remove reply DOM
                                $(`.feedback-reply[data-reply-id="${rid}"]`).remove();
                                // Update view all count
                                const parentItem = $(`.feedback-item[data-feedback-id="${pid}"]`);
                                const repliesContainer = parentItem.find(`#replies-${pid}`);
                                const remainingCount = repliesContainer.find('.feedback-reply').length;
                                const viewBtn = parentItem.find(`.view-replies-toggle[data-feedback-id="${pid}"]`);
                                if (remainingCount > 0) {
                                    viewBtn.attr('data-replies-count', remainingCount);
                                    if (!repliesContainer.hasClass('d-none')) {
                                        viewBtn.text('Hide');
                                    } else {
                                        viewBtn.text(`View all (${remainingCount})`);
                                    }
                                } else {
                                    viewBtn.remove();
                                    repliesContainer.remove();
                                }
                                // Refresh feedback count
                                $.ajax({
                                    url: appUrl + '/task-feedbacks/count/' + taskId,
                                    type: 'GET',
                                    success: function(c){
                                        if (c && c.data && typeof c.data.count === 'number') {
                                            setDashboardFeedbackCount(taskId, c.data.count);
                                        }
                                    }
                                });
                                done(true);
                            },
                            error: function (xhr) {
                                let msg = 'Failed to delete reply';
                                if (xhr.responseJSON && xhr.responseJSON.message) msg = xhr.responseJSON.message;
                                if (typeof showFloatingAlert === 'function') {
                                    showFloatingAlert(msg, 'danger');
                                } else {
                                    alert(msg);
                                }
                                done(false);
                            }
                        });
                    }
                });
            });

            // Bind view replies toggle
            $('.view-replies-toggle', bodyEl).off('click').on('click', function() {
                const fid = $(this).data('feedbackId');
                const count = $(this).data('repliesCount');
                const container = $(`#replies-${fid}`);
                if (!container.length) return;
                const hidden = container.hasClass('d-none');
                if (hidden) {
                    container.removeClass('d-none');
                    $(this).text('Hide');
                } else {
                    container.addClass('d-none');
                    $(this).text(`View all (${count})`);
                }
                // Enforce style: no underline and #555 color
                $(this).css({
                    'text-decoration': 'none',
                    'color': '#555'
                });
            });

            // Open feedback/reply images in a new tab
            $('.feedback-image, .reply-image', bodyEl).off('click').on('click', function() {
                const src = $(this).attr('src');
                if (src) {
                    window.open(src, '_blank');
                }
            });
        },
        error: () => bodyEl.html('<p class="text-center text-danger">Failed to load feedback.</p>')
    });
}

function setupDashboardInlineFeedbackEditor(taskId) {
    const modal = $('#taskFeedbackModal');
    if (!modal.length) return;
    initDashboardInlineFeedbackEditor(taskId);
    const photoBtn = $('#inlineFeedbackPhotoBtn');
    const fileBtn = $('#inlineFeedbackFileBtn');
    const sendBtn = $('#inlineFeedbackSendBtn');
    const imageInput = $('#inline_feedback_image_input');
    const filesInput = $('#inline_feedback_files_input');
    photoBtn.off('click').on('click', () => imageInput.trigger('click'));
    fileBtn.off('click').on('click', () => filesInput.trigger('click'));
    imageInput.off('change').on('change', function() {
        const f = this.files[0];
        if (!f || !f.type.startsWith('image/') || f.size > 10 * 1024 * 1024) return;
        const reader = new FileReader();
        reader.onload = e => showDashboardInlineImagePreview(f, e.target.result);
        reader.readAsDataURL(f);
    });
    filesInput.off('change').on('change', function() {
        const files = Array.from(this.files || []);
        if (!files.length) return;
        window.dashboardInlineFeedbackSelectedFiles = (window.dashboardInlineFeedbackSelectedFiles || []).concat(files);
        renderDashboardInlineFeedbackFilesPreview();
        this.value = "";
    });
    sendBtn.off('click').on('click', () => submitDashboardInlineFeedback(taskId));
}

// Render a selected reply preview above the inline editor
function renderDashboardReplyPreview(previewText, authorName, authorPhoto, previewText) {
    // Ensure preview container exists inside modal footer area
    const modal = document.getElementById('taskFeedbackModal');
    if (!modal) return null;
    let footer = modal.querySelector('.modal-footer .feedback-form');
    if (!footer) footer = modal.querySelector('.modal-footer');
    if (!footer) return null;

    // Remove existing preview if any
    const existing = modal.querySelector('.selected-reply-preview');
    if (existing) existing.remove();

    const wrapper = document.createElement('div');
    wrapper.className = 'd-flex align-items-center gap-2 p-2 rounded bg-light selected-task selected-reply-preview';
    wrapper.style.marginBottom = '8px';
    wrapper.innerHTML = `
        <div style="width:28px;height:28px;border-radius:50%;overflow:hidden;flex:0 0 28px;display:flex;align-items:center;justify-content:center;">
            <img src="${authorPhoto}" alt="avatar" style="width:28px;height:28px;object-fit:cover;display:block;" onerror="this.onerror=null;this.src='${(document.querySelector('meta[name="app-url"]')?.getAttribute('content') || '')}/asset/img/avatar.png';">
        </div>
        <div class="flex-grow-1">
            <div style="font-weight:500;font-size:11px">${escapeHtml(authorName)}</div>
            <div style="font-size: 10px;">${previewText}</div>
        </div>
        <button type="button" class="btn btn-sm btn-remove-task remove-task" title="Remove reply preview" style="line-height: 1; font-size: 10px;">
            <span class="material-symbols-outlined">close</span>
        </button>`;

    // Insert preview before the editor element
    const editorEl = modal.querySelector('#inline_feedback_editor');
    if (editorEl && editorEl.parentNode) {
        editorEl.parentNode.insertBefore(wrapper, editorEl);
    } else if (footer) {
        footer.insertAdjacentElement('beforebegin', wrapper);
    }

    // wire remove
    wrapper.querySelector('.remove-task').addEventListener('click', function() {
        // clear reply state
        window.__dashboardReplyingToFeedbackId = null;
        // reset editor placeholder
        try { const q = window.__quillDashboardInlineFeedback; if (q) { const pl = q.root.closest('.ql-container').querySelector('.ql-editor'); if (pl) pl.dataset.placeholder = 'Write feedback...'; } } catch(_) {}
        wrapper.remove();
        // reset send button icon
        const sendBtn = document.getElementById('inlineFeedbackSendBtn'); if (sendBtn) sendBtn.innerHTML = '<span class="material-symbols-outlined">send</span>';
    });

    return wrapper;
}

// Remove preview helper
function removeDashboardReplyPreview() {
    const modal = document.getElementById('taskFeedbackModal');
    if (!modal) return;
    const existing = modal.querySelector('.selected-reply-preview');
    if (existing) existing.remove();
}

function initDashboardInlineFeedbackEditor(taskId) {
    if (window.__quillDashboardInlineFeedback) window.__quillDashboardInlineFeedback = null;
    const editorEl = $('#inline_feedback_editor')[0];
    if (!editorEl) return;
    window.__quillDashboardInlineFeedback = new Quill('#inline_feedback_editor', {
        modules: { toolbar: false, clipboard: { matchVisual: false } },
        theme: 'snow',
        placeholder: 'Write feedback...'
    });
    try {
        const Delta = Quill.import('delta');
        window.__quillDashboardInlineFeedback.clipboard.addMatcher('IMG', (node, delta) => new Delta());
        window.__quillDashboardInlineFeedback.on('text-change', () => {
            $('#inline_feedback_editor img').remove();
        });
    } catch {}
}

// Show inline image preview
function showDashboardInlineImagePreview(fileObj, dataUrl) {
    try {
        // Store the file for later submission
        window.__dashboardInlineFeedbackImageFile = fileObj;

        // Create or update preview
        let previewContainer = document.getElementById('inline_feedback_image_preview');
        if (!previewContainer) {
            previewContainer = document.createElement('div');
            previewContainer.id = 'inline_feedback_image_preview';
            previewContainer.style.cssText = 'display: inline-flex; align-items: center; margin-left: 8px; opacity: 1; background: transparent;';

            const fileBtn = document.getElementById('inlineFeedbackFileBtn');
            if (fileBtn && fileBtn.parentNode) {
                fileBtn.parentNode.insertBefore(previewContainer, fileBtn.nextSibling);
            }
        }

        previewContainer.innerHTML = '';

        const imageLabel = document.createElement('div');
        imageLabel.className = 'custom-image-upload position-relative';
        imageLabel.style.cssText =
            'width: 32px; height: 32px; ' +
            'background-image: url(\'' + dataUrl + '\'); ' +
            'background-size: cover; background-position: center center; background-repeat: no-repeat; ' +
            'border-radius: 6px; cursor: pointer; border: 1px solid #ddd; margin-right: 4px; ' +
            'opacity: 1; background-color: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.12);';

        const clearBtn = document.createElement('span');
        clearBtn.className = 'image-clear-btn';
        clearBtn.innerHTML = '&times;';
        clearBtn.title = 'Remove image';
        clearBtn.style.cssText =
            'position: absolute; top: -6px; right: -6px; background: #ff4444; color: #ffffff; ' +
            'border-radius: 50%; width: 16px; height: 16px; font-size: 12px; line-height: 16px; ' +
            'text-align: center; cursor: pointer; font-weight: 700; border: none; ' +
            'box-shadow: 0 2px 6px rgba(0,0,0,0.25); z-index: 30;';

        clearBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            try {
                const inp = document.getElementById('inline_feedback_image_input');
                if (inp) inp.value = '';
                window.__dashboardInlineFeedbackImageFile = null;
                if (previewContainer && previewContainer.parentNode) {
                    previewContainer.parentNode.removeChild(previewContainer);
                }
            } catch(_) {}
        });

        imageLabel.appendChild(clearBtn);
        previewContainer.appendChild(imageLabel);
    } catch(e) {
        console.warn('Failed to show inline image preview:', e);
    }
}

// Render files preview
function renderDashboardInlineFeedbackFilesPreview() {
    try {
        let preview = document.getElementById('inline_feedback_files_preview');
        if (!preview) {
            const editor = document.getElementById('inline_feedback_editor');
            if (editor && editor.parentNode) {
                preview = document.createElement('div');
                preview.id = 'inline_feedback_files_preview';
                preview.className = 'mb-2';
                editor.parentNode.insertBefore(preview, editor);
            }
        }
        if (!preview) return;

        const sel = window.dashboardInlineFeedbackSelectedFiles || [];
        preview.innerHTML = '';

        if (!sel.length) return;

        const listWrap = document.createElement('div');
        listWrap.className = 'selected-files-list mt-2';

        sel.forEach(function(f, idx) {
            try {
                const item = document.createElement('div');
                item.className = 'd-flex align-items-center gap-2 p-2 rounded bg-light mb-2';

                const iconWrap = document.createElement('div');
                iconWrap.innerHTML = '<span class="material-symbols-outlined">description</span>';
                iconWrap.style.fontSize = '18px';

                const name = document.createElement('span');
                name.className = 'flex-grow-1';
                name.style.fontSize = '12px';
                const sizeMb = (f.size || 0) / 1024 / 1024;
                name.textContent = (f.name || '') + (isFinite(sizeMb) ? ' (' + sizeMb.toFixed(2) + ' MB)' : '');

                const rm = document.createElement('button');
                rm.type = 'button';
                rm.className = 'btn btn-sm';
                rm.innerHTML = '<span class="material-symbols-outlined">close</span>';
                rm.addEventListener('click', function() {
                    try {
                        window.dashboardInlineFeedbackSelectedFiles.splice(idx, 1);
                        renderDashboardInlineFeedbackFilesPreview();
                    } catch(_) {}
                });

                item.appendChild(iconWrap);
                item.appendChild(name);
                item.appendChild(rm);
                listWrap.appendChild(item);
            } catch(_) {}
        });

        preview.appendChild(listWrap);
    } catch(e) {}
}

// Submit inline feedback
function submitDashboardInlineFeedback(taskId) {
    const editor = window.__quillDashboardInlineFeedback;
    if (!editor) return;

    const content = editor.root.innerHTML.trim();
    if (!content || content === '<p><br></p>') {
        if (typeof showFloatingAlert === 'function') {
            showFloatingAlert('Please write some feedback', 'warning');
        }
        return;
    }

    const appUrl = document.querySelector('meta[name="app-url"]')?.getAttribute('content') || '';
    const formData = new FormData();
    formData.append('feedback_comment', content);
    formData.append('task_id', taskId);

    const sendBtn = document.getElementById('inlineFeedbackSendBtn');
    const originalHtml = sendBtn.innerHTML;
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';

    // Check if replying or editing
    const parentId = window.__dashboardReplyingToFeedbackId;
    const editId = window.__dashboardEditingFeedbackId;

    let method = 'POST';
    let url = `${appUrl}/task-feedbacks`;

    if (editId) {
        // Edit mode
        method = 'PUT';
        url = `${appUrl}/task-feedbacks/${editId}`;
    } else if (parentId) {
        // Reply mode
        formData.append('parent_id', parentId);
    }

    // Add image if exists
    const imageFile = window.__dashboardInlineFeedbackImageFile;
    if (imageFile) {
        formData.append('image', imageFile);
    }

    // Add files if exists
    const files = window.dashboardInlineFeedbackSelectedFiles || [];
    if (files.length > 0) {
        files.forEach(function(file) {
            formData.append('reference_files[]', file);
        });
    }

    // Add CSRF token
    formData.append('_token', document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '');

    // For PUT request, add method override
    if (method === 'PUT') {
        formData.append('_method', 'PUT');
        method = 'POST'; // Send as POST with _method override
    }

    fetch(url, {
        method: method,
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(r => r.json())
    .then(res => {
        if (res.status === 'success' || res.message) {
            if (typeof showFloatingAlert === 'function') {
                const msg = editId ? 'Feedback updated successfully' : (parentId ? 'Reply posted successfully' : 'Feedback posted successfully');
                showFloatingAlert(res.message || msg, 'success');
            }

            // Clear editor and reset state
            editor.root.innerHTML = '';
            window.__dashboardEditingFeedbackId = null;
            window.__dashboardReplyingToFeedbackId = null;
            window.__dashboardInlineFeedbackImageFile = null;
            window.dashboardInlineFeedbackSelectedFiles = [];

            // Clear image preview
            const imagePreview = document.getElementById('inline_feedback_image_preview');
            if (imagePreview) imagePreview.remove();

            // Clear files preview
            const filesPreview = document.getElementById('inline_feedback_files_preview');
            if (filesPreview) filesPreview.innerHTML = '';

            // Reset placeholder
            const placeholderEl = editor.root.closest('.ql-container').querySelector('.ql-editor');
            if (placeholderEl) {
                placeholderEl.dataset.placeholder = 'Write feedback...';
            }

            // Reset send button
            sendBtn.innerHTML = '<span class="material-symbols-outlined">send</span>';

            // Reload feedback list
            loadDashboardTaskFeedbackData(taskId);

            // remove reply preview if any
            removeDashboardReplyPreview();

            // Update feedback count
            $.ajax({
                url: appUrl + '/task-feedbacks/count/' + taskId,
                type: 'GET',
                success: function(c){
                    if (c && c.data && typeof c.data.count === 'number') {
                        setDashboardFeedbackCount(taskId, c.data.count);
                    }
                }
            });
        } else {
            throw new Error(res.message || 'Failed to post feedback');
        }
    })
    .catch(err => {
        console.error(err);
        if (typeof showFloatingAlert === 'function') {
            showFloatingAlert(err.message || 'Failed to post feedback', 'danger');
        }
        sendBtn.innerHTML = originalHtml;
    })
    .finally(() => {
        sendBtn.disabled = false;
    });
}

// ensure floating alert util exists (fallback only). Prefer global one from attendance.js
if (typeof window.showFloatingAlert !== 'function') {
    window.showFloatingAlert = function(message) {
        if (typeof window.showAlertMsg === 'function') {
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

// Show reply feedback form
function showDashboardReplyFeedbackForm(taskId, parentId) {
    const editor = window.__quillDashboardInlineFeedback;
    if (!editor) return;

    // Clear editor and show placeholder
    editor.root.innerHTML = '';
    editor.root.dataset.replyTo = parentId;
    editor.root.dataset.taskId = taskId;

    // Update placeholder
    const placeholderEl = editor.root.closest('.ql-container').querySelector('.ql-editor');
    if (placeholderEl) {
        placeholderEl.dataset.placeholder = 'Write reply...';
    }

    // Store reply context
    window.__dashboardReplyingToFeedbackId = parentId;
    window.__dashboardEditingFeedbackId = null;

    // Update send button text
    const sendBtn = document.getElementById('inlineFeedbackSendBtn');
    if (sendBtn) {
        sendBtn.innerHTML = '<span class="material-symbols-outlined">reply</span>';
    }

    // Focus editor
    editor.focus();

    // Scroll to editor
    try {
        const editorEl = document.getElementById('inline_feedback_editor');
        if (editorEl) {
            editorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    } catch(_) {}
}

// Start inline edit feedback
function startDashboardInlineEditFeedback(payload) {
    const editor = window.__quillDashboardInlineFeedback;
    if (!editor) return;

    // Clear reply mode
    window.__dashboardReplyingToFeedbackId = null;
    window.__dashboardEditingFeedbackId = payload.id;

    // Set content
    editor.root.innerHTML = '';
    const content = payload.feedback_comment || '';
    if (content) {
        editor.root.innerHTML = content;
    }

    // Update placeholder
    const placeholderEl = editor.root.closest('.ql-container').querySelector('.ql-editor');
    if (placeholderEl) {
        placeholderEl.dataset.placeholder = 'Edit feedback...';
    }

    // Update send button text
    const sendBtn = document.getElementById('inlineFeedbackSendBtn');
    if (sendBtn) {
        sendBtn.innerHTML = '<span class="material-symbols-outlined">send</span>';
    }

    // Focus editor
    editor.focus();

    // Scroll to editor
    try {
        const editorEl = document.getElementById('inline_feedback_editor');
        if (editorEl) {
            editorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    } catch(_) {}
}

// Delete confirmation modal
function showDashboardDeleteConfirmModal(opts) {
    try {
        const appUrl = document.querySelector('meta[name="app-url"]')?.getAttribute('content') || '';
        const id = opts.id;
        const type = opts.type || 'feedback';
        const avatarUrl = opts.avatarUrl || '';
        const authorName = opts.authorName || '';
        const content = opts.content || '';
        const modalId = 'deleteConfirmModal_dash_' + (type || 'f') + '_' + id + '_' + Date.now();

        const title = type === 'reply' ? 'Delete reply' : 'Delete feedback';
        let confirmText = '';
        if (type === 'reply') {
            confirmText = 'Are you sure you want to delete this reply?';
        } else {
            confirmText = 'Are you sure you want to delete this feedback?';
        }

        const modalHtml = `
            <div class="modal fade" id="${modalId}" tabindex="-1" aria-modal="true" role="dialog">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content modal-content-custom">
                        <div class="modal-body modal-body-custom">
                            <div class="text-center mb-2">
                                <div class="task-description-container">
                                    <p class="task-description mb-0" id="${modalId}_desc">${escapeHtml(content)}</p>
                                </div>
                            </div>
                            <hr class="my-2">
                            <p class="fw-normal fs-6 text-center mb-4" id="${modalId}_confirm">${confirmText}</p>

                            <div class="modal-footer modal-footer-custom">
                                <button type="button" class="btn btn-custom-close" data-bs-dismiss="modal" id="${modalId}_cancel">Cancel</button>
                                <button type="button" class="btn btn-submit-black" id="${modalId}_confirmBtn">Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;

        // Hide parent modal temporarily
        const parentModalEl = document.getElementById('taskFeedbackModal');
        let _parentWasOpen = false;
        let _parentModalInstance = null;
        try {
            if (parentModalEl && parentModalEl.classList.contains('show')) {
                _parentWasOpen = true;
                _parentModalInstance = bootstrap.Modal.getInstance(parentModalEl) || new bootstrap.Modal(parentModalEl);
                try { window.__suppressFeedbackBackdropRemoval = true; } catch(_) {}
                try { _parentModalInstance.hide(); } catch(_) {}
            }
        } catch(_) {}

        // Insert modal
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modalEl = document.getElementById(modalId);
        const modalInstance = new bootstrap.Modal(modalEl, { backdrop: 'static' });
        modalInstance.show();

        // Close & cleanup helper
        function cleanup() {
            try { modalInstance.hide(); } catch(_) {}
            try { modalEl.remove(); } catch(_) {}
            try {
                if (_parentWasOpen && _parentModalInstance) {
                    try { window.__suppressFeedbackBackdropRemoval = false; } catch(_) {}
                    setTimeout(function(){ try { _parentModalInstance.show(); } catch(_) {} }, 180);
                }
            } catch(_) {}
        }

        // Wire cancel to cleanup
        const cancelBtn = document.getElementById(`${modalId}_cancel`);
        if (cancelBtn) cancelBtn.addEventListener('click', cleanup);

        // Confirm button
        const confirmBtn = document.getElementById(`${modalId}_confirmBtn`);
        if (confirmBtn) {
            confirmBtn.addEventListener('click', function () {
                try { confirmBtn.disabled = true; confirmBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Deleting...'; } catch(_) {}
                if (typeof opts.onConfirm === 'function') {
                    try {
                        opts.onConfirm(function doneFn(shouldClose){
                            if (shouldClose === false) {
                                confirmBtn.disabled = false; confirmBtn.innerHTML = 'Delete';
                                return;
                            }
                            cleanup();
                        });
                    } catch (e) {
                        confirmBtn.disabled = false; confirmBtn.innerHTML = 'Delete';
                    }
                } else {
                    cleanup();
                }
            });
        }
    } catch (e) {
        console.warn('showDashboardDeleteConfirmModal error', e);
    }
}

$(document).on('click', '#toggleFilterTask', function(e) {
    e.stopPropagation();
    $('#customFilterDropdown').toggleClass('show');
});

$(document).on('click', function(e) {
    if (!$(e.target).closest('.filter-dropdown-wrapper').length) {
        $('#customFilterDropdown').removeClass('show');
    }
});

document.addEventListener("DOMContentLoaded", function () {
  const startDateInput = document.getElementById('filterStartDate')
  const endDateInput = document.getElementById('filterEndDate')

  flatpickr("#filterDateRange", {
    mode: "range",
    dateFormat: "d/m/Y",
    locale: {
      firstDayOfWeek: 1
    },
    onChange: function(selectedDates) {
      if (selectedDates.length === 2) {
        const [start, end] = selectedDates
        startDateInput.value = start.toISOString().split('T')[0]
        endDateInput.value = end.toISOString().split('T')[0]
      }
    }
  })
})
