$(".btn-tab-task").on("click", function () {
    $(".btn-tab-task").removeClass("active");
    $(this).addClass("active");

    showTask();
});

function showTask() {
    let taskActive = $(".btn-tab-task.active").attr("data-tab-active");

    if (taskActive === "today") {
        getTaskToday();
    } else if (taskActive === "tomorrow") {
        getTaskTomorrow();
    }
}

function getTaskToday() {
    const $list = $(".task-list");
    $list.empty().append(`<div class="text-center py-3 text-secondary small">Loading tasks…</div>`);

    const ensureRoute = () => {
        if (window.NSA_ROUTES && window.NSA_ROUTES.tasksToday) return Promise.resolve(window.NSA_ROUTES.tasksToday);
        // fetch from controller-provided JSON
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
            try {
                return JSON.parse(text);
            } catch (e) {
                throw new Error('Non-JSON response: ' + text.slice(0, 120));
            }
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
                // Prefer raw YYYY-MM-DD if provided, else fallback to locale date
                const dueText = /^\d{4}-\d{2}-\d{2}/.test(rawDue) ? rawDue : (rawDue ? new Date(rawDue).toLocaleDateString() : '-');
                const statusNorm = (t.status || '').toLowerCase();
                const bg = statusNorm === 'completed' ? '#E9FFF0' : (statusNorm === 'rejected' ? '#FFEAEA' : (statusNorm.includes('progress') ? '#E6F2FF' : '#FFFAE6'));
                const rejectedBadge = statusNorm === 'rejected'
                    ? '<span style="position:absolute;top:8px;right:10px;font-size:10px;font-weight:700;color:#B00020;background:#FFD6D6;padding:2px 6px;border-radius:8px;letter-spacing:.3px;">REJECTED</span>'
                    : '';

                // Build PIC + Executors list with de-dup
                const getPhoto = (obj) => obj?.photo || obj?.image || obj?.user_photo || obj || '';
                const getId = (obj) => obj?.id || obj?.employee_id || null;
                const people = [];
                if (t.pic || t.pic_photo) {
                    people.push(t.pic || { id: t.pic_id || null, photo: t.pic_photo, name: t.pic_name || 'PIC' });
                }
                if (Array.isArray(t.executors)) {
                    t.executors.forEach(e => people.push(e));
                }
                // unique by id then by photo url
                const seen = new Set();
                const avatars = [];
                people.forEach(p => {
                    const pid = getId(p) ? 'id:' + getId(p) : 'ph:' + getPhoto(p);
                    if (pid && !seen.has(pid)) {
                        seen.add(pid);
                        avatars.push(getPhoto(p));
                    }
                });
                // Use the same status color used for card background
                let borderColor = bg;

                const avatarHtml = avatars.slice(0, 5).map((url, idx) => {
                    const size = idx === 0 ? 22 : 20; // PIC slightly bigger at base
                    const overlap = idx > 0 ? '-10px' : '0';
                    const z = idx + 1; // later avatars (executors) on top
                    const safeUrl = url || '/asset/img/profile_picture/default.png';
                    return `
                        <span class="avatar-overlap" style="position: relative; display:inline-block; margin-left:${overlap}; z-index:${z};">
                            <img src="${safeUrl}" alt="member" style="width:${size}px;height:${size}px;object-fit:cover;border:2px solid ${borderColor};border-radius:50%;">
                        </span>
                    `;
                }).join('');

                const commentsCount = t.feedback_comments_count || t.comments_count || 0;
                const filesCount = t.reference_files_count || t.attachments_count || 0;

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
                            <span class="material-symbols-outlined" style="font-size:18px;color:#828282;">mode_comment</span>
                            ${commentsCount>0?`<span class="ms-1 small" style="color:#555;">${commentsCount}</span>`:''}
                            <span class="material-symbols-outlined ms-3" style="font-size:18px;color:#828282;">attach_file</span>
                            ${filesCount>0?`<span class="ms-1 small" style="color:#555;">${filesCount}</span>`:''}
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
        })
        .catch(err => {
            console.error(err);
            $list.empty().append(`<div class="text-center py-3 text-danger small">Failed to load tasks.</div>`);
        });
}

function getTaskTomorrow() {
    console.log("task aktive today");
}

// util
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

// auto-load on page ready for default active tab
document.addEventListener('DOMContentLoaded', () => {
    showTask();
});

