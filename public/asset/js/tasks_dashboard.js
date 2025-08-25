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
                const dueText = t.due_date ? new Date(t.due_date).toLocaleDateString() : '-';
                const statusNorm = (t.status || '').toLowerCase();
                const bg = statusNorm === 'completed' ? '#E9FFF0' : (statusNorm === 'rejected' ? '#FFEAEA' : (statusNorm.includes('progress') ? '#E6F2FF' : '#FFFAE6'));
                const rejectedBadge = statusNorm === 'rejected'
                    ? '<span style="position:absolute;top:8px;right:10px;font-size:10px;font-weight:700;color:#B00020;background:#FFD6D6;padding:2px 6px;border-radius:8px;letter-spacing:.3px;">REJECTED</span>'
                    : '';

                const executors = (t.executors || []).slice(0,3).map(e => `<img src="${e.photo}" class="rounded-circle me-1" style="width:18px;height:18px;object-fit:cover;">`).join('');

                const card = `
                    <div class="task-card p-3 mb-3" style="background: ${bg}; position: relative;">
                        ${rejectedBadge}
                        <div class="d-flex align-items-center mb-2">
                            <img src="${t.project_image}" class="rounded-circle me-3" style="width:28px;height:28px;object-fit:cover;">
                            <h6 class="mb-0" style="font-size: 14px">${escapeHtml(t.title || '-') }</h6>
                        </div>
                        ${t.description ? `<p class="mb-2 small" style="font-size: 10px;">${escapeHtml(t.description).slice(0,140)}${t.description.length>140?'…':''}</p>` : ''}
                        <div class="d-flex justify-content-between align-items-center small mt-2" style="font-size: 10px;">
                            <div>
                                <span style="color:#828282;">Priority:</span><span class="mx-2" style="color:${priorityColor}">${t.priority || '-'}</span>
                                <span style="color:#828282;">Deadline:</span><span class="mx-2" style="color:#454545">${dueText}</span>
                            </div>
                            <div class="d-flex align-items-center">${executors}</div>
                        </div>
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

