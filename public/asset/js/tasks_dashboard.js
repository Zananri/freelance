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
    
    // Reset title
    const titleEl = modalEl.querySelector('.feedback-modal-title');
    const bodyEl = modalEl.querySelector('.feedback-modal-body');
    if (titleEl) titleEl.textContent = 'Task Feedback';
    if (bodyEl) bodyEl.innerHTML = '';

    // Setup inline feedback editor in footer
    try {
        setupDashboardInlineFeedbackEditor(taskId);
    } catch(_) {}

    loadDashboardTaskFeedbackData(taskId);
    modal.show();
}

function loadDashboardTaskFeedbackData(taskId) {
    const bodyEl = document.getElementById('taskFeedbackList');
    if (!bodyEl) return;
    bodyEl.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';

    const appUrl = document.querySelector('meta[name="app-url"]')?.getAttribute('content') || '';
    fetch((appUrl ? appUrl : '') + '/task-feedbacks/' + taskId + '?_=' + Date.now(), { headers: { 'X-Requested-With': 'XMLHttpRequest' }, cache: 'no-store' })
        .then(r => r.json())
        .then(res => {
            const data = res.data || [];
            if (!data.length) {
                bodyEl.innerHTML = '<p class="text-center text-muted">No feedback available for this task.</p>';
                return;
            }

            // Helper: Format date like Task page (timeAgo)
            const timeAgo = (dateStr) => {
                if (!dateStr) return '';
                const date = new Date(dateStr);
                const now = new Date();
                const diffMs = now - date;
                const diffSec = Math.floor(diffMs / 1000);
                const diffMin = Math.floor(diffSec / 60);
                const diffHr = Math.floor(diffMin / 60);
                const diffDay = Math.floor(diffHr / 24);
                
                if (diffDay > 1) {
                    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
                } else if (diffDay === 1) {
                    return '1 day ago';
                } else if (diffHr > 0) {
                    return diffHr + ' hour' + (diffHr > 1 ? 's' : '') + ' ago';
                } else if (diffMin > 0) {
                    return diffMin + ' minute' + (diffMin > 1 ? 's' : '') + ' ago';
                } else {
                    return 'just now';
                }
            };

            const currentEmployeeId = document.getElementById('taskFeedbackModal')?.dataset?.employeeId || '';

            const html = data.map(fb => {
                const formattedDate = timeAgo(fb.created_at);
                const name = fb.employee?.name || 'Unknown';
                const photo = fb.employee?.photo || ((appUrl ? appUrl : '') + '/asset/img/avatar.png');
                
                // Render feedback comment as HTML (not escaped)
                const feedbackComment = fb.feedback_comment || '';
                
                // Normalize image URL
                let topImageUrl = fb.image || '';
                if (topImageUrl && !topImageUrl.startsWith('http')) {
                    topImageUrl = (appUrl ? appUrl : '') + '/file/task/' + topImageUrl;
                }
                
                // Handle reference files - support multiple files
                let topRefFiles = [];
                try {
                    let refFiles = fb.reference_files_urls || fb.reference_files || [];
                    if (typeof refFiles === 'string') {
                        try {
                            refFiles = JSON.parse(refFiles);
                        } catch(e) {
                            refFiles = refFiles.split(',').map(s => s.trim()).filter(Boolean);
                        }
                    }
                    if (Array.isArray(refFiles) && refFiles.length > 0) {
                        topRefFiles = refFiles.map(f => {
                            if (!f) return null;
                            if (f.startsWith('http')) return f;
                            return (appUrl ? appUrl : '') + '/file/task_reference_files/' + f;
                        }).filter(Boolean);
                    }
                } catch(e) {}
                
                // Handle reference URLs - support multiple URLs
                let topRefUrls = [];
                try {
                    let refUrls = fb.reference_urls || [];
                    if (typeof refUrls === 'string') {
                        try {
                            refUrls = JSON.parse(refUrls);
                        } catch(e) {
                            if (refUrls.trim()) refUrls = [refUrls];
                            else refUrls = [];
                        }
                    }
                    if (Array.isArray(refUrls) && refUrls.length > 0) {
                        topRefUrls = refUrls.filter(u => typeof u === 'string' && u.trim() !== '');
                    } else if (fb.reference_url) {
                        topRefUrls = [fb.reference_url];
                    }
                } catch(e) {}
                
                // Check if current user can edit
                const topAuthorId = fb.employee?.id || fb.employee_id || 0;
                const canEditTop = String(topAuthorId) === String(currentEmployeeId);
                
                // Build reference files HTML
                const filesHtml = (topRefFiles.length > 0) ? `
                    <div class="feedback-reference-container mb-2">
                        ${topRefFiles.map(fileUrl => {
                            const fileName = fileUrl.split('/').pop() || 'File';
                            return `<a href="${fileUrl}" class="feedback-reference-file bg-light rounded-2">
                                <span class="material-symbols-outlined" style="color: #444444;">draft</span> ${escapeHtml(fileName)}
                            </a>`;
                        }).join('')}
                    </div>` : '';
                
                // Build reference URLs HTML
                const urlsHtml = (topRefUrls.length > 0) ? `
                    <div class="feedback-reference-container mb-2">
                        ${topRefUrls.map(url => {
                            const shortUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
                            return `<a href="${url}" target="_blank" class="feedback-reference-url bg-light rounded-2">
                                <span class="material-symbols-outlined" style="color: #444444;">link</span> ${escapeHtml(shortUrl)}
                            </a>`;
                        }).join('')}
                    </div>` : '';
                
                // Build image HTML
                const imgHtml = topImageUrl ? `<img src="${topImageUrl}" class="img-fluid rounded mb-2 feedback-image" style="width: 70px; height: auto; border-radius: 8px; cursor: pointer;">` : '';
                
                // Build actions (Reply, Edit, Delete, View all)
                const repliesCount = (Array.isArray(fb.replies) ? fb.replies.length : 0);
                const viewAllBtn = repliesCount > 0 ? `<span style="font-size: 13px; color:#555;">View all (${repliesCount})</span>` : '';
                
                return `
                    <div class="feedback-item mb-3 p-3" data-feedback-id="${fb.id}">
                        <div class="d-flex align-items-start mb-2">
                            <img src="${photo}" alt="${escapeHtml(name)}" class="rounded-circle me-3" style="width: 32px; height: 32px; object-fit: cover;">
                            <div class="flex-grow-1">
                                <div>
                                    <strong style="font-size:14px; font-weight:600;">${escapeHtml(name)}</strong>
                                    <div><small class="text-muted d-block" style="font-size: 10px;">${formattedDate}</small></div>
                                </div>

                                <div class="feedback-comment mt-2">
                                    <p class="mb-2" style="font-size:13px;">${feedbackComment}</p>
                                    ${urlsHtml}
                                    ${filesHtml}
                                    ${imgHtml}

                                    <div class="feedback-actions mt-2 d-flex gap-4 align-items-center">
                                        <span class="d-flex align-items-center" style="cursor:pointer; color:#555; font-size:12px;">
                                            <span class="material-symbols-outlined" style="font-size:18px; line-height:1; margin-right:5px;">reply</span>
                                            <span>Reply</span>
                                        </span>
                                        ${canEditTop ? `
                                        <span class="d-flex align-items-center" style="cursor:pointer; color:#555; font-size:12px;">
                                            <span class="material-symbols-outlined" style="font-size:18px; line-height:1; margin-right:5px;">edit</span>
                                            <span>Edit</span>
                                        </span>
                                        ` : ''}
                                        ${canEditTop ? `
                                        <span class="d-flex align-items-center" style="cursor:pointer; color:#555; font-size:12px;">
                                            <span class="material-symbols-outlined" style="font-size:18px; line-height:1; margin-right:5px;">delete</span>
                                            <span>Delete</span>
                                        </span>
                                        ` : ''}
                                        ${viewAllBtn}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>`;
            }).join('');
            bodyEl.innerHTML = html;

            // Setup inline feedback editor in footer after loading data
            try {
                setupDashboardInlineFeedbackEditor(taskId);
            } catch(_) {}
        })
        .catch(() => {
            bodyEl.innerHTML = '<p class="text-center text-danger">Failed to load feedback.</p>';
        });
}

// Setup inline feedback editor in dashboard modal footer (matching task.js behavior)
function setupDashboardInlineFeedbackEditor(taskId) {
    try {
        const modal = document.getElementById('taskFeedbackModal');
        if (!modal) return;

        // The footer is already in the HTML with inline editor structure
        // We just need to initialize the Quill editor
        initDashboardInlineFeedbackEditor(taskId);

        // Bind button handlers
        const photoBtn = document.getElementById('inlineFeedbackPhotoBtn');
        const fileBtn = document.getElementById('inlineFeedbackFileBtn');
        const sendBtn = document.getElementById('inlineFeedbackSendBtn');
        const imageInput = document.getElementById('inline_feedback_image_input');
        const filesInput = document.getElementById('inline_feedback_files_input');

        if (photoBtn && imageInput) {
            // Remove existing listeners by cloning
            const newPhotoBtn = photoBtn.cloneNode(true);
            photoBtn.parentNode.replaceChild(newPhotoBtn, photoBtn);
            newPhotoBtn.addEventListener('click', function() {
                imageInput.click();
            });
        }

        if (fileBtn && filesInput) {
            const newFileBtn = fileBtn.cloneNode(true);
            fileBtn.parentNode.replaceChild(newFileBtn, fileBtn);
            newFileBtn.addEventListener('click', function() {
                filesInput.click();
            });
        }

        // Handle image selection
        if (imageInput) {
            const newImageInput = imageInput.cloneNode(true);
            imageInput.parentNode.replaceChild(newImageInput, imageInput);
            newImageInput.addEventListener('change', function(ev) {
                try {
                    const f = (this.files && this.files[0]) || null;
                    if (!f) return;
                    if (!f.type || f.type.indexOf("image/") !== 0) return;
                    
                    const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
                    if (f.size > MAX_IMAGE_BYTES) {
                        alert('Image must be smaller than 10 MB.');
                        this.value = '';
                        return;
                    }

                    const reader = new FileReader();
                    reader.onload = function(e) {
                        try {
                            showDashboardInlineImagePreview(f, e.target.result);
                        } catch(_) {}
                    };
                    reader.readAsDataURL(f);
                } catch(_) {}
            });
        }

        // Handle file attachments
        if (filesInput) {
            const newFilesInput = filesInput.cloneNode(true);
            filesInput.parentNode.replaceChild(newFilesInput, filesInput);
            window.dashboardInlineFeedbackSelectedFiles = window.dashboardInlineFeedbackSelectedFiles || [];
            newFilesInput.addEventListener('change', function(ev) {
                try {
                    const files = Array.from(this.files || []);
                    if (!files.length) return;
                    window.dashboardInlineFeedbackSelectedFiles = (window.dashboardInlineFeedbackSelectedFiles || []).concat(files);
                    renderDashboardInlineFeedbackFilesPreview();
                    this.value = "";
                } catch(_) {}
            });
        }

        // Bind send button
        if (sendBtn) {
            const newSendBtn = sendBtn.cloneNode(true);
            sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);
            newSendBtn.addEventListener('click', function() {
                submitDashboardInlineFeedback(taskId);
            });
        }

    } catch(e) {
        console.warn('Failed to setup dashboard inline feedback editor:', e);
    }
}

// Initialize Quill editor for inline feedback
function initDashboardInlineFeedbackEditor(taskId) {
    try {
        // Destroy existing instance if any
        if (window.__quillDashboardInlineFeedback) {
            try {
                window.__quillDashboardInlineFeedback = null;
            } catch(_) {}
        }

        const editorEl = document.getElementById('inline_feedback_editor');
        if (!editorEl) return;

        // Initialize Quill
        window.__quillDashboardInlineFeedback = new Quill('#inline_feedback_editor', {
            modules: {
                toolbar: false,
                clipboard: { matchVisual: false }
            },
            theme: 'snow',
            placeholder: 'Write feedback...'
        });

        // Prevent image paste/drop
        try {
            const Delta = Quill.import && Quill.import('delta');
            if (window.__quillDashboardInlineFeedback && window.__quillDashboardInlineFeedback.clipboard) {
                window.__quillDashboardInlineFeedback.clipboard.addMatcher('IMG', function(node, delta) {
                    try {
                        return new Delta();
                    } catch(_) {
                        return delta;
                    }
                });
            }
        } catch(_) {}

        // Remove images on text change
        try {
            window.__quillDashboardInlineFeedback.on('text-change', function() {
                try {
                    const imgs = window.__quillDashboardInlineFeedback.root.querySelectorAll('img');
                    imgs.forEach(function(i) { i.remove(); });
                } catch(_) {}
            });
        } catch(_) {}

    } catch(e) {
        console.warn('Failed to init dashboard inline feedback editor:', e);
    }
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
    try {
        const appUrl = document.querySelector('meta[name="app-url"]')?.getAttribute('content') || '';
        const sendBtn = document.getElementById('inlineFeedbackSendBtn');
        
        // Get feedback content from Quill
        let feedbackHtml = '';
        try {
            if (window.__quillDashboardInlineFeedback && window.__quillDashboardInlineFeedback.root) {
                feedbackHtml = window.__quillDashboardInlineFeedback.root.innerHTML.trim();
            }
        } catch(_) {}

        // Validate content
        const textContent = feedbackHtml.replace(/<[^>]+>/g, '').trim();
        if (!textContent && !window.__dashboardInlineFeedbackImageFile && !(window.dashboardInlineFeedbackSelectedFiles && window.dashboardInlineFeedbackSelectedFiles.length)) {
            alert('Please enter feedback comment or attach files');
            return;
        }

        // Show loading state
        const originalBtnHtml = sendBtn ? sendBtn.innerHTML : '';
        if (sendBtn) {
            sendBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
            sendBtn.disabled = true;
        }

        // Build FormData
        const formData = new FormData();
        formData.append('task_id', taskId);
        formData.append('employee_id', document.getElementById('taskFeedbackModal')?.dataset?.employeeId || '');
        formData.append('feedback_comment', feedbackHtml);

        // Add image if selected
        if (window.__dashboardInlineFeedbackImageFile) {
            formData.append('feedback_image', window.__dashboardInlineFeedbackImageFile);
        }

        // Add files if selected
        if (Array.isArray(window.dashboardInlineFeedbackSelectedFiles) && window.dashboardInlineFeedbackSelectedFiles.length > 0) {
            window.dashboardInlineFeedbackSelectedFiles.forEach(file => {
                formData.append('reference_files[]', file);
            });
        }

        // Submit via fetch
        fetch((appUrl ? appUrl : '') + '/task-feedbacks', {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: formData
        })
        .then(r => r.json())
        .then(res => {
            // Show success message
            const msg = res.message || 'Feedback submitted successfully!';
            if (typeof window.showAlertMsg === 'function') {
                window.showAlertMsg(msg, 'light', 2000);
            } else if (typeof showFloatingAlert === 'function') {
                showFloatingAlert(msg, 'success');
            }

            // Clear editor and files
            try {
                if (window.__quillDashboardInlineFeedback && window.__quillDashboardInlineFeedback.root) {
                    window.__quillDashboardInlineFeedback.root.innerHTML = '';
                }
            } catch(_) {}

            // Clear image preview
            try {
                const imagePreview = document.getElementById('inline_feedback_image_preview');
                if (imagePreview && imagePreview.parentNode) {
                    imagePreview.parentNode.removeChild(imagePreview);
                }
                window.__dashboardInlineFeedbackImageFile = null;
                const imageInput = document.getElementById('inline_feedback_image_input');
                if (imageInput) imageInput.value = '';
            } catch(_) {}

            // Clear files preview
            try {
                window.dashboardInlineFeedbackSelectedFiles = [];
                renderDashboardInlineFeedbackFilesPreview();
                const filesInput = document.getElementById('inline_feedback_files_input');
                if (filesInput) filesInput.value = '';
            } catch(_) {}

            // Reload feedback list
            loadDashboardTaskFeedbackData(taskId);

            // Update feedback count on card
            try {
                const selector = `.feedback-comments-count[data-task-id="${taskId}"]`;
                let countEl = document.querySelector(selector);
                const cur = countEl ? parseInt(countEl.textContent || '0', 10) || 0 : 0;
                const newCount = cur + 1;
                setDashboardFeedbackCount(taskId, newCount);
            } catch(_) {}
        })
        .catch(err => {
            const msg = 'Failed to submit feedback. Please try again.';
            if (typeof window.showAlertMsg === 'function') {
                window.showAlertMsg(msg, 'light', 3000);
            } else if (typeof showFloatingAlert === 'function') {
                showFloatingAlert(msg, 'danger');
            } else {
                alert(msg);
            }
        })
        .finally(() => {
            if (sendBtn) {
                sendBtn.innerHTML = originalBtnHtml;
                sendBtn.disabled = false;
            }
        });

    } catch(e) {
        console.error('Submit feedback error:', e);
    }
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
