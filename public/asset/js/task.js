 document.addEventListener("DOMContentLoaded", function () {
    // Mark pure touch-only devices (coarse pointer & no hover) to adjust hover behavior.
    // Avoid disabling hover on hybrid laptops (touchscreen + mouse) which report touch capabilities.
    try {
        const hasTouchCap = ("ontouchstart" in window) || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
        const noHover = window.matchMedia && window.matchMedia('(hover: none)').matches;
        const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
        const pureTouch = hasTouchCap && noHover && coarse; // stricter condition
        if (pureTouch) {
            document.body.classList.add('touch-device');
        } else {
            document.body.classList.remove('touch-device');
        }
    } catch(_) {}
    // Robust appUrl derivation: prefer meta, fallback to origin + first path segment (supports subfolders)
    let appUrl = (function(){
        try {
            const meta = document.querySelector('meta[name="app-url"]');
            let v = (meta && meta.getAttribute('content')) || '';
            if (v) {
                // Ensure absolute and trim trailing slash
                v = new URL(v, window.location.origin).href.replace(/\/+$/, '');
                return v;
            }
            const parts = (window.location.pathname || '').split('/').filter(Boolean);
            const baseSeg = parts.length > 0 ? ('/' + parts[0]) : '';
            return (window.location.origin + baseSeg).replace(/\/+$/, '');
        } catch(_) { return (window.location.origin || '').replace(/\/+$/, ''); }
    })();

    // Current logged-in employee id (from shared modal dataset)
    const currentEmployeeId = (function(){
        try { return document.getElementById('taskFeedbackModal')?.dataset?.employeeId || null; } catch(_) { return null; }
    })();

    // Flags to prevent duplicate global bindings
    let globalDropdownDocListenersBound = false;
    let attachFileIconListenerBound = false;
    // Shared buffer for multi-file preview across modals (Add Task, Add/Reply Feedback)
    let selectedFiles = [];

    // File size limits (bytes)
    const MAX_TOTAL_UPLOAD_BYTES = 100 * 1024 * 1024; // 100 MB
    const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB for image inputs (label image uploads)

    // Helper: compute total size of FileList/Array of File objects
    function computeTotalBytes(filesArray) {
        try {
            if (!filesArray) return 0;
            return filesArray.reduce((acc, f) => acc + (f && f.size ? f.size : 0), 0);
        } catch (_) { return 0; }
    }

    // Helper: validate total size (including optional image) against MAX_TOTAL_UPLOAD_BYTES
    function validateTotalUploadSize({imageFile, extraFiles}) {
        try {
            let total = 0;
            if (imageFile) total += (imageFile.size || 0);
            if (Array.isArray(extraFiles) && extraFiles.length) total += computeTotalBytes(extraFiles);
            return {ok: total <= MAX_TOTAL_UPLOAD_BYTES, totalBytes: total};
        } catch (e) { return {ok: false, totalBytes: Infinity}; }
    }

    // Initialize Bootstrap tooltips within a DOM scope (default document)
    function initBootstrapTooltips(root = document) {
        try {
            // More reliable mobile detection using multiple methods
            const isMobile = window.matchMedia('(max-width: 1024px)').matches ||
                             window.innerWidth <= 1024 ||
                             /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            const defaultPlacement = isMobile ? "top" : "bottom";

            const nodes = [].slice.call(root.querySelectorAll('[data-bs-toggle="tooltip"]'));
            nodes.forEach((el) => {
                const existing = bootstrap.Tooltip.getInstance(el);
                if (existing) existing.dispose();

                // Remove any existing placement attribute to ensure consistency
                el.removeAttribute('data-bs-placement');

                new bootstrap.Tooltip(el, {
                    container: 'body',
                    placement: defaultPlacement,
                    trigger: 'hover focus'
                });
            });
        } catch (_) { /* noop */ }
    }
    window.initBootstrapTooltips = initBootstrapTooltips;

    try {
        if (window.bootstrap && bootstrap.Tooltip && bootstrap.Tooltip.prototype) {
            (function(){
                const proto = bootstrap.Tooltip.prototype;
                // Avoid double-patching
                if (proto._isWithActiveTrigger && proto._isWithActiveTrigger._patched) return;
                const orig = proto._isWithActiveTrigger;
                proto._isWithActiveTrigger = function() {
                    try {
                        if (!this._activeTrigger || typeof this._activeTrigger !== 'object') {
                            try { this._activeTrigger = {}; } catch(_) {}
                        }
                        return orig.call(this);
                    } catch (_) {
                        // Fallback: compute safely without throwing
                        try {
                            const at = this._activeTrigger || {};
                            for (const v of Object.values(at)) { if (v) return true; }
                        } catch (_) {}
                        return false;
                    }
                };
                try { proto._isWithActiveTrigger._patched = true; } catch(_){}
            })();
        }
    } catch(_) {}

    // Helper: hide and dispose any visible Bootstrap tooltips to avoid orphaned popper nodes
    function hideAllFloatingTooltips() {
        try {
            const triggers = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            triggers.forEach(el => {
                try {
                    const inst = bootstrap.Tooltip.getInstance(el);
                    if (inst) {
                        try {
                            if (!inst._activeTrigger || typeof inst._activeTrigger !== 'object') {
                                try { inst._activeTrigger = {}; } catch(_) {}
                            }
                        } catch(_) {}

                        // Attempt to hide, but if hide throws, still attempt dispose to clean up.
                        try { inst.hide(); } catch(_) { /* ignore hide error */ }
                        try { inst.dispose(); } catch(_) { /* ignore dispose error */ }
                    }
                } catch(_) {}
            });
            // Remove any leftover tooltip elements appended directly to body
            document.querySelectorAll('body > .tooltip').forEach(t => { try { t.remove(); } catch(_) {} });
        } catch(_) {}
    }

    // Debounced tooltip reinitialization for scroll events
    let tooltipScrollTimeout;
    function debouncedTooltipReinit() {
        clearTimeout(tooltipScrollTimeout);
        tooltipScrollTimeout = setTimeout(() => {
            initBootstrapTooltips();
        }, 150);
    }

    // Listen for scroll on task containers to reinitialize tooltips
    document.addEventListener('DOMContentLoaded', function() {
        const taskContainers = ['new-request-tasks', 'in-progress-tasks', 'completed-tasks', 'finished-tasks'];
        taskContainers.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) {
                container.addEventListener('scroll', debouncedTooltipReinit, { passive: true });
            }
        });
    });

    // Listen for resize and orientation change to reinitialize tooltips with correct placement
    let resizeTimeout;
    function handleResponsiveTooltipUpdate() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            initBootstrapTooltips();
        }, 100);
    }

    window.addEventListener('resize', handleResponsiveTooltipUpdate, { passive: true });
    window.addEventListener('orientationchange', handleResponsiveTooltipUpdate, { passive: true });

    // Listen for global avatar update: refresh visible task cards (minimal: update any img[data-avatar-universal])
    window.addEventListener('profilePictureUpdated', function(e){
        try {
            // Update any universal avatar images
            document.querySelectorAll('img[data-avatar-universal], img[data-global-avatar]').forEach(function(img){
                const srcClean = img.src.replace(/\?t=\d+$/,'');
                img.src = srcClean + '?t=' + Date.now();
            });
            // Optional: if a global function to refetch tasks exists
            if (typeof fetchAndRenderTasks === 'function') {
                fetchAndRenderTasks();
            }
        } catch(err) { console.warn('Task avatar refresh error', err); }
    });

    // Normalize various user_photo values to a valid absolute URL
    // Supports: full http(s), paths starting with '/', 'file/...', 'asset/...', or plain filenames
    function buildPhotoUrl(userPhoto, profilePicture, profilePictureUrl) {
        try {
            // Prioritise universal avatar (profile_pictureUrl > profilePicture) then fallback userPhoto
            let candidate = profilePictureUrl || profilePicture || userPhoto;
            if (!candidate) return appUrl + '/asset/img/avatar.png';
            if (typeof candidate !== 'string') candidate = String(candidate || '');
            const up = candidate.trim();
            if (up.startsWith('http://') || up.startsWith('https://')) return up;
            if (up.startsWith('/')) return appUrl + up;
            if (up.startsWith('file/') || up.startsWith('asset/')) return appUrl + '/' + up;
            return appUrl + '/file/profile_picture/' + up;
        } catch (_) {
            return appUrl + '/asset/img/avatar.png';
        }
    }

    // Helper: determine if current viewer (PIC or Executor) hasn't accepted yet for this task
    function isViewerPendingExecutor(task) {
        if (!currentEmployeeId) return false;
        try {
            const pic = task && task.pic ? task.pic : null;
            // If viewer is PIC, pending when PIC hasn't accepted yet
            if (pic && String(pic.id) === String(currentEmployeeId)) {
                const isPicAccepted = (pic.is_receive === true || pic.is_receive === 1);
                return !isPicAccepted;
            }
            // Otherwise, check executor acceptance state
            const exList = Array.isArray(task?.executors) ? task.executors : [];
            const mine = exList.find(ex => String(ex.id) === String(currentEmployeeId));
            if (!mine) return false;
            const isAccepted = (mine.is_receive === true || mine.is_receive === 1);
            return !isAccepted;
        } catch(_) { return false; }
    }

    // Helper: mark task-assignment notifications as read for this task (affects only current user)
    function markTaskAssignmentNotificationsRead(taskId) {
        return $.ajax({
            url: appUrl + "/notifications/task/" + taskId + "/mark-read",
            method: "POST",
            headers: {
                "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            }
        });
    }

    // Helper: refresh notification count badge (local copy of logic in office.js)
    function refreshNotificationCountBadge() {
        $.ajax({
            url: appUrl + "/notifications/count",
            type: "GET",
            success: function(response) {
                const count = response && typeof response.count === 'number' ? response.count : 0;
                const badge = document.getElementById('notificationBadge');
                const countEl = document.getElementById('notificationCount');
                if (badge && countEl) {
                    if (count > 0) {
                        countEl.textContent = String(count);
                        badge.style.display = '';
                    } else {
                        badge.style.display = 'none';
                    }
                }
            }
        });
    }

    function getTaskInitials(title) {
        if (!title) return "NA";
        const words = title.trim().split(/\s+/);
        if (words.length === 1) {
            return words[0].substring(0, 2).toUpperCase();
        }
        return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }

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

    // Shared cached fetch for employees-for-executor to avoid duplicate XHRs
    const EMP_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
    const __empCache = { map: new Map(), inFlight: new Map() };
    function fetchEmployeesForExecutorCached(query = "") {
        try {
            const key = String(query || "").trim().toLowerCase();
            const now = Date.now();
            const cached = __empCache.map.get(key);
            if (cached && (now - cached.t) < EMP_CACHE_TTL_MS) {
                // Return a resolved Deferred with cached value
                const d = $.Deferred();
                d.resolve(cached.v);
                return d.promise();
            }
            const inflight = __empCache.inFlight.get(key);
            if (inflight) return inflight;
            const jq = $.ajax({ url: appUrl + '/task/employees-for-executor', type: 'GET', data: { q: key }, dataType: 'json' })
                .then(res => {
                    __empCache.map.set(key, { v: res, t: Date.now() });
                    __empCache.inFlight.delete(key);
                    return res;
                })
                .catch(err => { __empCache.inFlight.delete(key); throw err; });
            __empCache.inFlight.set(key, jq);
            return jq;
        } catch (_) {
            // Fallback: no cache
            return $.ajax({ url: appUrl + '/task/employees-for-executor', type: 'GET', data: { q: query }, dataType: 'json' });
        }
    }

// Show Accept confirmation modal (task page, no notification context)
    function showAcceptInviteModal(taskId) {
        // Fetch task to display context
        $.ajax({
            url: appUrl + "/task/" + taskId,
            method: 'GET',
            success: function(res) {
                const t = res && (res.data || res) || {};
                const title = t.title || 'Accept Task';
                const desc = t.description || '';
                const priority = t.priority || '';
                const due_date = t.due_date || '';

                // Helper to format due date using the project's canonical formatter (day first)
                function formatDueDate(d) {
                    try {
                        if (!d) return '-';
                        if (typeof formatDateENMedium === 'function') return formatDateENMedium(d);
                        // Fallback: parse and return day month year
                        const dt = new Date(d);
                        if (isNaN(dt.getTime())) return d;
                        const day = dt.getDate();
                        const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                        const m = monthNames[dt.getMonth()];
                        const y = dt.getFullYear();
                        return `${day} ${m} ${y}`;
                    } catch (e) { return String(d || '-'); }
                }

                // Local HTML escaper
                function escapeHtml(str) {
                    try {
                        return String(str || '').replace(/[&<>"'']/g, function(m) {
                            return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m] || m;
                        });
                    } catch (e) { return String(str || ''); }
                }

                // Build description paragraphs (preserve basic line breaks)
                const descHtml = (function(desc){
                    if (!desc) return '';
                    // If contains HTML block tags, keep as-is; otherwise split by newlines
                    if (/<\/[a-z]+>/i.test(desc)) return desc;
                    return desc.split(/\r?\n/).filter(Boolean).map(s => `<p>${s}</p>`).join('');
                })(desc);

                // Build collaborators (pic + executors)
                function buildCollabHtml(data) {
                    const people = [];
                    try {
                        // Keep explicit roles so we can mark PIC properly
                        if (data.pic) people.push({ person: data.pic, role: 'pic' });
                        if (Array.isArray(data.executors)) data.executors.forEach(e => people.push({ person: e, role: 'executor' }));
                    } catch(_) {}
                    if (!people.length) return '<div class="text-muted">No collaborators</div>';
                    return people.map(entry => {
                        const p = entry.person || {};
                        const roleFlag = entry.role || (p.role ? String(p.role).toLowerCase() : 'executor');
                        const photo = p.photo || p.profile_picture || p.user_photo || p.user_photo_url || '';
                        const url = photo && /^https?:\/\//.test(photo) ? photo : (photo ? (appUrl + '/file/profile_picture/' + photo) : appUrl + '/asset/img/avatar.png');
                        const name = p.name || p.full_name || p.employee_name || p.username || 'Member';
                        // Prefer explicit PIC label when this entry represents the pic
                        const roleLabel = (function(){
                            try {
                                if (roleFlag === 'pic') return 'PIC';
                                if (p && p.role) return String(p.role).replace(/_/g,' ');
                                if (p && p.designation) return String(p.designation);
                                // Fall back to division or executor label
                                if (p && (p.division || p.division_name)) return String(p.division || p.division_name);
                                return roleFlag === 'executor' ? 'Executor' : '';
                            } catch(_) { return ''; }
                        })();
                        return `
                            <div class="collab-item d-flex align-items-center mb-2">
                                <div class="flex-shrink-0">
                                    <img src="${url}" alt="${escapeHtml(name)}" data-bs-toggle="tooltip" class="rounded-circle" style="width:36px;height:36px;object-fit:cover;" onerror="this.onerror=null;this.src='${appUrl}/asset/img/avatar.png';" aria-label="${escapeHtml(name)}" data-bs-original-title="${escapeHtml(name)}">
                                </div>
                                <div class="ms-2">
                                    <div class="collab-name">${escapeHtml(name)}</div>
                                    <div class="collab-division text-muted">${escapeHtml(roleLabel)}</div>
                                </div>
                            </div>`;
                    }).join('');
                }

                const id = 'acceptInviteModal';
                const taskStatus = (t && t.status) ? t.status : 'new';
                const dueText = formatDueDate(due_date);
                const priorityColor = priority === 'HIGH' ? 'red' : (priority === 'MEDIUM' ? '#E6A15A' : '#4fc97a');
                const initials = getTaskInitials(t.title || title || 'NA');
                const initialColor = getRandomColorFromText(t.title || title || initials);
                // Project and department/division fallbacks
                const projectTitleText = (t && t.project && (t.project.title || t.project.project_title)) ? (t.project.title || t.project.project_title) : '';
                const deptName = (t && t.project && (t.project.department || t.project.department_name)) ? (t.project.department || t.project.department_name) : (t.department_name || 'No Department');
                const divName = (t && t.project && (t.project.division || t.project.division_name)) ? (t.project.division || t.project.division_name) : (t.division_name || 'No Division');

                // Build status rows only when data present
                const statusRows = (function(){
                    try {
                        const rows = [];
                        const ip = (t && t.in_progress_by_name) ? String(t.in_progress_by_name).trim() : '';
                        const cb = (t && t.completed_by_name) ? String(t.completed_by_name).trim() : '';
                        const rb = (t && t.rejected_by_name) ? String(t.rejected_by_name).trim() : '';
                        if (ip) rows.push(`<div style="font-size:12px;margin-top:6px;color:#454545"><span style="color:#797E91;">In Progress by:</span><span style="margin-left:6px;color:#454545">${escapeHtml(ip)}</span></div>`);
                        if (cb) rows.push(`<div style="font-size:12px;margin-top:6px;color:#454545"><span style="color:#797E91;">Completed by:</span><span style="margin-left:6px;color:#454545">${escapeHtml(cb)}</span></div>`);
                        if (rb) rows.push(`<div style="font-size:12px;margin-top:6px;color:#454545"><span style="color:#797E91;">Rejected by:</span><span style="margin-left:6px;color:#454545">${escapeHtml(rb)}</span></div>`);
                        return rows.join('');
                    } catch (e) { return ''; }
                })();

                // Prepare inner card HTML so it can be injected into the taskDetailModal (ensures identical styling)
                const cardHtml = `
                                        <div class="custom-card rounded-4 p-3 border-0" data-task-id="${t.id || taskId}" data-task-status="${escapeHtml(taskStatus)}">
                                            <div class="d-flex justify-content-between align-items-start mb-2 task-card-header">
                                                <div class="d-flex align-items-center">
                                                    <div class="project-initial-avatar me-3" style="width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:14px;color:#fff;background:${initialColor};">${escapeHtml(initials)}</div>
                                                    <div class="d-flex flex-column">
                                                        ${projectTitleText ? `<small class="text-muted" style="font-size:11px;">${escapeHtml(projectTitleText)}</small>` : ''}
                                                        <h5 class="mb-0 task-title">${escapeHtml(title)}</h5>
                                                    </div>
                                                </div>
                                                <!-- dropdown removed for accept modal -->
                                            </div>
                                            <div class="task-detail-description-container">
                                                <div class="task-description">
                                                    ${descHtml}
                                                </div>
                                            </div>
                                            <hr class="task-separator rounded-4">
                                            <div class="d-flex justify-content-between align-items-center mb-2">
                                                <div style="font-size:12px;">
                                                    <span style="color:#797E91;">Priority: </span>
                                                    <span style="color:${priorityColor}">${escapeHtml(priority || '-')}</span>
                                                </div>
                                                <div style="font-size:12px;">
                                                    <span style="color:#797E91;">Deadline: </span>
                                                    <span style="color:#4B4F5E;">${escapeHtml(dueText)}</span>
                                                </div>
                                            </div>
                                            <div class="d-flex justify-content-between mb-1" style="font-size:12px;">
                                                <span class="text-muted">Department:</span>
                                                <span>${escapeHtml(deptName)}</span>
                                            </div>
                                            <div class="d-flex justify-content-between mb-2" style="font-size:12px;">
                                                <span class="text-muted">Division:</span>
                                                <span>${escapeHtml(divName)}</span>
                                            </div>
                                            <div class="d-flex justify-content-between align-items-start mt-2 gap-3">
                                                <div class="flex-grow-1">
                                                    <div class="collab-list">
                                                        ${buildCollabHtml(t)}
                                                    </div>
                                                    ${statusRows}
                                                </div>
                                                <!-- comment/attach icons removed for accept modal -->
                                            </div>
                                        </div>`;

                // If a taskDetailModal already exists on the page (task page), reuse it so all CSS rules (which often target #taskDetailModal) apply exactly.
                const existingDetail = document.getElementById('taskDetailModal');
                if (existingDetail) {
                    try {
                        const contentEl = existingDetail.querySelector('#taskDetailContent');
                        if (contentEl) contentEl.innerHTML = cardHtml;

                        // Replace footer with Accept/Cancel for this flow, but save original to restore later
                        const footerEl = existingDetail.querySelector('.modal-footer') || existingDetail.querySelector('.modal-footer-custom');
                        if (footerEl) {
                            if (!footerEl.dataset._originalHtml) footerEl.dataset._originalHtml = footerEl.innerHTML;
                            footerEl.innerHTML = '<button type="button" class="btn btn-custom-close" data-bs-dismiss="modal">Cancel</button><button type="button" class="btn btn-submit-black" id="confirmAcceptInviteBtn">Accept Task</button>';
                        }

                        const modalInst = bootstrap.Modal.getOrCreateInstance(existingDetail) || new bootstrap.Modal(existingDetail);
                        modalInst.show();

                        // Wire confirm button
                        const confirmBtn = existingDetail.querySelector('#confirmAcceptInviteBtn');
                        if (confirmBtn) {
                            confirmBtn.addEventListener('click', function onConfirm() {
                                try { modalInst.hide(); } catch(_) {}
                                // perform accept
                                const btn = this;
                                btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Accepting...';
                                $.ajax({
                                    url: appUrl + '/task/' + taskId + '/accept',
                                    method: 'POST',
                                    headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content') },
                                    success: function(response){
                                        // Check if executor was rejected (late acceptance)
                                        var message = 'Task accepted successfully!';
                                        var alertType = 'success';
                                        try {
                                            if (response && response.executor_removed === true) {
                                                message = response.message || 'Task was already completed by another executor. You have been removed from this task.';
                                                alertType = 'warning';
                                            } else if (response && response.task_status === 'rejected') {
                                                message = response.message || 'Task moved to In Progress with rejected status.';
                                                alertType = 'warning';
                                            }
                                        } catch(_) {}
                                        try { if (typeof showFloatingAlert === 'function') showFloatingAlert(message, alertType); } catch(_){ }
                                        markTaskAssignmentNotificationsRead(taskId).always(function(){ refreshNotificationCountBadge(); });
                                        window.location.reload();
                                    },
                                    error: function(xhr){
                                        let msg = 'Failed to accept task';
                                        try { if (xhr.responseJSON && (xhr.responseJSON.message || xhr.responseJSON.error)) msg = xhr.responseJSON.message || xhr.responseJSON.error; } catch(_){ }
                                        if (typeof showFloatingAlert === 'function') showFloatingAlert(msg, 'danger');
                                    },
                                    complete: function(){
                                        try { btn.disabled = false; btn.innerHTML = '<span>Accept Task</span>'; } catch(_){}
                                    }
                                });
                            }, { once: true });
                        }

                        // When modal is hidden, restore original footer if it was changed
                        existingDetail.addEventListener('hidden.bs.modal', function restoreFooter() {
                            try {
                                const f = existingDetail.querySelector('.modal-footer') || existingDetail.querySelector('.modal-footer-custom');
                                if (f && f.dataset && f.dataset._originalHtml) {
                                    f.innerHTML = f.dataset._originalHtml;
                                    delete f.dataset._originalHtml;
                                }
                            } catch(_) {}
                            try { existingDetail.removeEventListener('hidden.bs.modal', restoreFooter); } catch(_) {}
                        }, { once: true });
                    } catch (e) {
                        console.error('Failed to reuse existing taskDetailModal, falling back to creating a new one', e);
                        // fallback to create new modal below
                        const newModalHtml = `
                    <div class="modal fade" id="taskDetailModal" tabindex="-1" aria-labelledby="taskDetailModalLabel" aria-hidden="true">
                        <div class="modal-dialog modal-dialog-centered" style="max-width:720px;">
                            <div class="modal-content modal-content-custom">
                                <div class="modal-body modal-body-custom">
                                    <div id="taskDetailContent">${cardHtml}</div>
                                </div>
                                <div class="modal-footer modal-footer-custom mt-3">
                                    <button type="button" class="btn btn-custom-close" data-bs-dismiss="modal">Cancel</button>
                                    <button type="button" class="btn btn-submit-black" id="confirmAcceptInviteBtn">Accept Task</button>
                                </div>
                            </div>
                        </div>
                    </div>`;
                        document.body.insertAdjacentHTML('beforeend', newModalHtml);
                        const modalEl = document.getElementById('taskDetailModal');
                        const modal2 = new bootstrap.Modal(modalEl);
                        modal2.show();
                        document.getElementById('confirmAcceptInviteBtn').addEventListener('click', function(){
                            this.disabled = true; this.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Accepting...';
                            $.ajax({
                                url: appUrl + '/task/' + taskId + '/accept',
                                method: 'POST',
                                headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content') },
                                success: function(response){
                                    var message = 'Task accepted successfully!';
                                    var alertType = 'success';
                                    try {
                                        if (response && response.executor_removed === true) {
                                            message = response.message || 'Task was already completed by another executor. You have been removed from this task.';
                                            alertType = 'warning';
                                        } else if (response && response.task_status === 'rejected') {
                                            message = response.message || 'Task moved to In Progress with rejected status.';
                                            alertType = 'warning';
                                        }
                                    } catch(_) {}
                                    try { if (typeof showFloatingAlert === 'function') showFloatingAlert(message, alertType); } catch(_){}
                                    modal2.hide();
                                    markTaskAssignmentNotificationsRead(taskId).always(function(){ refreshNotificationCountBadge(); });
                                    window.location.reload();
                                },
                                error: function(xhr){ let msg = 'Failed to accept task'; try { if (xhr.responseJSON && (xhr.responseJSON.message || xhr.responseJSON.error)) msg = xhr.responseJSON.message || xhr.responseJSON.error; } catch(_){ } if (typeof showFloatingAlert === 'function') showFloatingAlert(msg, 'danger'); },
                                complete: function(){ const btn = document.getElementById('confirmAcceptInviteBtn'); if (btn) { btn.disabled = false; btn.innerHTML = '<span>Accept Task</span>'; } }
                            });
                        });
                        $(modalEl).on('hidden.bs.modal', function(){ $(this).remove(); });
                    }
                } else {
                    // No existing detail modal on page; create one that uses the same ID so CSS from task.css applies
                    const newModalHtml = `
                    <div class="modal fade" id="taskDetailModal" tabindex="-1" aria-labelledby="taskDetailModalLabel" aria-hidden="true">
                        <div class="modal-dialog modal-dialog-centered" style="max-width:720px;">
                            <div class="modal-content modal-content-custom">
                                <div class="modal-body modal-body-custom">
                                    <div id="taskDetailContent">${cardHtml}</div>
                                </div>
                                <div class="modal-footer modal-footer-custom mt-3">
                                    <button type="button" class="btn btn-custom-close" data-bs-dismiss="modal">Cancel</button>
                                    <button type="button" class="btn btn-submit-black" id="confirmAcceptInviteBtn">Accept Task</button>
                                </div>
                            </div>
                        </div>
                    </div>`;

                    document.body.insertAdjacentHTML('beforeend', newModalHtml);
                    const modalEl = document.getElementById('taskDetailModal');
                    const modal2 = new bootstrap.Modal(modalEl);
                    modal2.show();
                    document.getElementById('confirmAcceptInviteBtn').addEventListener('click', function(){
                        this.disabled = true;
                        this.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Accepting...';
                        $.ajax({
                            url: appUrl + '/task/' + taskId + '/accept',
                            method: 'POST',
                            headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content') },
                            success: function(response){
                                var message = 'Task accepted successfully!';
                                var alertType = 'success';
                                try {
                                    if (response && response.executor_removed === true) {
                                        message = response.message || 'Task was already completed by another executor. You have been removed from this task.';
                                        alertType = 'warning';
                                    } else if (response && response.task_status === 'rejected') {
                                        message = response.message || 'Task moved to In Progress with rejected status.';
                                        alertType = 'warning';
                                    }
                                } catch(_) {}
                                try { if (typeof showFloatingAlert === 'function') showFloatingAlert(message, alertType); } catch(_){}
                                modal2.hide();
                                markTaskAssignmentNotificationsRead(taskId).always(function(){ refreshNotificationCountBadge(); });
                                window.location.reload();
                            },
                            error: function(xhr){
                                let msg = 'Failed to accept task';
                                try { if (xhr.responseJSON && (xhr.responseJSON.message || xhr.responseJSON.error)) msg = xhr.responseJSON.message || xhr.responseJSON.error; } catch(_){ }
                                if (typeof showFloatingAlert === 'function') showFloatingAlert(msg, 'danger');
                            },
                            complete: function(){
                                const btn = document.getElementById('confirmAcceptInviteBtn');
                                if (btn) { btn.disabled = false; btn.innerHTML = '<span>Accept Task</span>'; }
                            }
                        });
                    });
                    $(modalEl).on('hidden.bs.modal', function(){ $(this).remove(); });
                }
            },
            error: function(){
                // Fallback simpler confirm
                if (confirm('Accept this task?')) {
                    $.ajax({
                        url: appUrl + '/task/' + taskId + '/accept',
                        method: 'POST',
                        headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content') },
            success: function(){ markTaskAssignmentNotificationsRead(taskId).always(function(){ refreshNotificationCountBadge(); }); window.location.reload(); },
                    });
                }
            }
        });
    }

    // Show Reject confirmation modal (task page)
    function showRejectInviteModal(taskId) {
        $.ajax({
            url: appUrl + "/task/" + taskId,
            method: 'GET',
            success: function(res){
                const t = res && (res.data || res) || {};
                const title = t.title || 'Reject Task';
                const desc = t.description || '';
                                            // Refresh feedback count on task card after reply deletion
                                            try {
                                                $.ajax({
                                                    url: appUrl + "/task-feedbacks/count/" + (modalBody.closest('#taskFeedbackModal')?.dataset?.taskId || ''),
                                                    type: 'GET',
                                                    success: function(c){
                                                        if (c && c.data && typeof c.data.count === 'number') {
                                                            const card = document.querySelector('.custom-card[data-task-id="' + (modalBody.closest('#taskFeedbackModal')?.dataset?.taskId || '') + '"]');
                                                            if (card) {
                                                                let span = card.querySelector('.feedback-comments-count');
                                                                if (span) { span.textContent = String(c.data.count); }
                                                            }
                                                        }
                                                    }
                                                });
                                            } catch(_) { }
                const project_title = t.project.title || '';
                const priority = t.priority || '';
                const due_date = t.due_date || '';
                let img = "";
                if (t.image) {
                    // Kalau ada gambar
                    img = `<img src="${appUrl}/file/task/${t.image}"
                                    alt="Task Image"
                                    class="rounded-circle"
                                    style="width:34px; height:34px; object-fit:cover;"
                                    onerror="this.onerror=null;this.src='${appUrl}/asset/img/avatar.png'">`;
                } else {
                    const initials = getTaskInitials(t.title);
                    const bgColor = getRandomColorFromText(t.title);

                    img = `<div class="rounded-circle d-flex align-items-center justify-content-center"
                                    style="width:34px;height:34px;background:${bgColor};color:#fff;
                                            font-size:13px;font-weight:600;">
                                    ${initials}
                            </div>`;
                }                const id = 'rejectInviteModal';
                const modalHtml = `
                    <div class="modal fade" id="${id}" tabindex="-1" aria-hidden="true">
                        <div class="modal-dialog modal-dialog-centered" style="max-width: 400px;">
                            <div class="modal-content modal-content-custom">

                                <div class="modal-body modal-body-custom">
                                    <div class="d-flex">
                                        <div class="me-3">
                                        ${img}
                                        </div>
                                        <div class="custom-card m-0 p-0 border-0">
                                            ${id ? `<small class="text-muted" style="line-height:1; font-size: 10px;"> ${project_title || '-'}</small>` : ''}
                                            <h6 style="font-size:16px; font-weight:600; margin:0;">${title}</h6>
                                            <div class="task-description-container">
                                                <p class="task-description" data-full-description="${desc}">${desc ? desc : ''}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <hr class="text-seperator rounded-md">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <div style="font-size: 10px; font-weight: 400;">
                                            <span style="color: #797E91;">Priority: </span>
                                            <span style="color: ${priority === 'HIGH' ? 'red' : '#4B4F5E'}">
                                                ${priority}
                                            </span>
                                        </div>
                                        <div style="font-size: 10px; font-weight: 400;">
                                            <span style="color: #797E91;">Deadline: </span>
                                            <span style="#color: #4B4F5E">${due_date }</span>
                                        </div>
                                    </div>

                                </div>
                                <div class="modal-footer modal-footer-custom">
                                    <button type="button" class="btn btn-custom-close" data-bs-dismiss="modal">Cancel</button>
                                    <button type="button" class="btn btn-submit-black" id="confirmRejectInviteBtn">Reject</button>
                                </div>
                            </div>
                        </div>
                    </div>`;
                document.body.insertAdjacentHTML('beforeend', modalHtml);
                const mEl = document.getElementById(id);
                const modal = new bootstrap.Modal(mEl);
                modal.show();
                mEl.addEventListener('hidden.bs.modal', function onHide(){ mEl.removeEventListener('hidden.bs.modal', onHide); mEl.remove(); });
                mEl.querySelector('#confirmRejectInviteBtn').addEventListener('click', function(){
                    const btn = this; btn.disabled = true; btn.textContent = 'Rejecting...';
                    $.ajax({
                        url: appUrl + '/task/' + taskId + '/reject',
                        method: 'POST',
                        headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content') },
                        success: function(){
                            try { if (typeof showFloatingAlert === 'function') showFloatingAlert('Invitation rejected.', 'success'); } catch(_){ }
                            modal.hide();
                            const card = document.querySelector('.custom-card[data-task-id="' + taskId + '"]');
                            if (card && card.parentNode) card.parentNode.removeChild(card);
                            // Mark assignment notifications read (or removed) and refresh counts & UI
                            markTaskAssignmentNotificationsRead(taskId)
                                .always(function(){
                                    refreshNotificationCountBadge();
                                    try {
                                        if (typeof fetchAndRenderTasks === 'function') {
                                            // Refresh only the New column to ensure rejected item disappears from pending list
                                            fetchAndRenderTasks('new_request', 1, false, '');
                                            window.location.reload();
                                        }
                                    } catch(_){ }
                                    try { if (typeof fetchNotifications === 'function') fetchNotifications(); } catch(_){ }
                                });
                        },
                        error: function(xhr){
                            let msg = 'Failed to reject task';
                            try { if (xhr.responseJSON && (xhr.responseJSON.message || xhr.responseJSON.error)) msg = xhr.responseJSON.message || xhr.responseJSON.error; } catch(_){ }
                            if (typeof showFloatingAlert === 'function') showFloatingAlert(msg, 'danger');
                        },
                        complete: function(){ btn.disabled = false; btn.textContent = 'Reject'; }
                    });
                });
            },
            error: function(){
                if (confirm('Reject this task invitation?')) {
                    $.ajax({
                        url: appUrl + '/task/' + taskId + '/reject',
                        method: 'POST',
                        headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content') },
                        success: function(){ const card = document.querySelector('.custom-card[data-task-id="' + taskId + '"]'); if (card && card.parentNode) card.parentNode.removeChild(card); markTaskAssignmentNotificationsRead(taskId).always(function(){ refreshNotificationCountBadge(); }); }
                    });
                }
            }
        });
    }

    $(document).ready(function() {
        const modals = ['#addTaskModal', '#editTaskModal'];
        modals.forEach(id => {
            const $modal = $(id);
            const formSelector = $modal.find('form');
            let allowClose = false;

            $modal.on('click', '.btn-custom-close, [data-bs-dismiss="modal"]', function() {
                allowClose = true;
            });

            // When modal is shown, mark form as pristine (no user edits yet).
            // Attach input/change listeners to mark it dirty when the user edits
            // any input except the ignored auto-filled fields for the Add modal.
            $modal.on('show.bs.modal', function() {
                try {
                    if ($modal[0] && $modal[0].dataset) {
                        $modal[0].dataset.formPristine = '1';
                    }
                } catch(_) {}

                // Prevent attaching multiple handlers
                try {
                    if ($modal[0] && $modal[0].dataset && $modal[0].dataset.pristineHandlerAdded === '1') return;
                    const ignoredForAdd = new Set(['task_priority', 'task_point', 'task_start_date', 'task_due_date']);
                    $modal.on('input change', 'input, textarea, select', function(e) {
                        try {
                            const modalId = $modal && $modal.attr ? $modal.attr('id') : null;
                            const elId = this.id || '';
                            // If this is add modal and the changed field is one of the ignored, do not mark dirty
                            if (modalId === 'addTaskModal' && ignoredForAdd.has(elId)) return;
                            if ($modal[0] && $modal[0].dataset) $modal[0].dataset.formPristine = '0';
                        } catch(_) {}
                    });
                    if ($modal[0] && $modal[0].dataset) $modal[0].dataset.pristineHandlerAdded = '1';
                } catch(_) {}
            });

            $modal.on('hide.bs.modal', function(e) {
                // If a programmatic close was intended, allow it and clear the flag.
                try {
                    if ($modal[0] && $modal[0].dataset && $modal[0].dataset.allowProgrammaticClose === '1') {
                        allowClose = true;
                        delete $modal[0].dataset.allowProgrammaticClose;
                    }
                } catch(_) {}

                const triggerElement = $(document.activeElement);
                const clickedOutside = triggerElement.length === 0 || !$.contains($modal[0], triggerElement[0]);
                // If the form is still pristine (user hasn't changed anything),
                // treat it as not partially filled. This avoids false positives when
                // only auto-filled defaults exist (priority/point/start/due).
                let partiallyFilled = false;
                try {
                    if ($modal[0] && $modal[0].dataset && $modal[0].dataset.formPristine === '1') {
                        partiallyFilled = false;
                    } else {
                        partiallyFilled = isFormPartiallyFilled(formSelector);
                    }
                } catch(_) {
                    partiallyFilled = isFormPartiallyFilled(formSelector);
                }

                if (clickedOutside && partiallyFilled && !allowClose) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    if (typeof showFloatingAlert === 'function') {
                        showFloatingAlert("Please complete the form first", "warning", 3000);
                    } else {
                        alert("Please complete the form first");
                    }
                    return false;
                }

                allowClose = false;
            });

            function isFormPartiallyFilled(form) {
                let filled = false;
                // Fields that are auto-populated on Add Task modal and should not
                // count as "partially filled" for the purpose of blocking outside-close.
                const ignoredForAdd = new Set(['task_priority', 'task_point', 'task_start_date', 'task_due_date']);

                form.find('input, textarea, select').each(function() {
                    const type = $(this).attr('type');
                    if (type === 'hidden' || type === 'file') return;

                    // If this is the Add Task modal, ignore certain auto-filled fields
                    try {
                        const modalId = $modal && $modal.attr ? $modal.attr('id') : null;
                        const elId = $(this).attr('id') || '';
                        if (modalId === 'addTaskModal' && ignoredForAdd.has(elId)) return;
                    } catch(_) {}

                    const val = $(this).val();
                    if (val && val.trim() !== '') {
                        filled = true;
                        return false;
                    }
                });
                return filled;
            }
        });
    });

    const imageInput = document.getElementById("task_image");
    const imageLabel = document.getElementById("taskImageLabel");
    const imageClearBtn = document.getElementById("taskImageClearBtn");
    const addTaskModalEl = document.getElementById("addTaskModal");
    const addTaskForm = document.getElementById("addTaskForm");
    const projectSelect = document.getElementById("task_project_id");

    // Helper function to load tasks from a specific project for "Related to Task" dropdown
    function loadProjectTasksForRelated(projectId) {
        if (!projectId) return;

        const taskParentDropdown = document.getElementById('task_parent_dropdown');
        if (!taskParentDropdown) return;

        // Show loading state
        taskParentDropdown.innerHTML = '<div class="dropdown-item text-muted">Loading tasks...</div>';
        taskParentDropdown.style.display = 'block';

        // Fetch tasks for this project
        fetch(appUrl + '/projects/' + projectId + '/tasks/tree', {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            const tasks = data.data || data || [];

            if (tasks.length === 0) {
                taskParentDropdown.innerHTML = '<div class="dropdown-item text-muted">No tasks available in this project</div>';
            } else {
                // Clear and populate with tasks
                taskParentDropdown.innerHTML = '';
                tasks.forEach(task => {
                    const item = document.createElement('div');
                    item.className = 'dropdown-item';
                    item.style.cursor = 'pointer';
                    item.textContent = task.title || `Task #${task.id}`;
                    item.dataset.taskId = task.id;
                    item.dataset.taskTitle = task.title || '';

                    item.addEventListener('click', function() {
                        document.getElementById('task_parent_id').value = task.id;
                        document.getElementById('task_parent_input').value = task.title || `Task #${task.id}`;

                        const selectedParent = document.getElementById('task_selected_parent');
                        if (selectedParent) {
                            selectedParent.innerHTML = `
                                <div class="d-flex align-items-center gap-2 p-2 rounded bg-light selected-task">
                                    <span class="flex-grow-1">${task.title || `Task #${task.id}`}</span>
                                    <button type="button" class="btn btn-sm btn-remove-task remove-task" onclick="this.closest('.selected-task').remove(); document.getElementById('task_parent_id').value=''; document.getElementById('task_parent_input').value='';">
                                        <span class="material-symbols-outlined">close</span>
                                    </button>
                                </div>
                            `;
                        }
                        taskParentDropdown.style.display = 'none';
                    });

                    taskParentDropdown.appendChild(item);
                });
            }

            // Hide dropdown initially
            setTimeout(() => {
                taskParentDropdown.style.display = 'none';
            }, 100);
        })
        .catch(error => {
            console.error('Error loading project tasks:', error);
            taskParentDropdown.innerHTML = '<div class="dropdown-item text-danger">Failed to load tasks</div>';
        });
    }

    function setupImageInput(input, label, clearBtn) {
        // Setup paste event for screenshot
        const setupPasteHandler = () => {
            // Remove existing paste listeners to avoid duplicates
            const modal = input.closest('.modal');
            if (modal && !modal.dataset.pasteHandlerAdded) {
                modal.dataset.pasteHandlerAdded = 'true';

                modal.addEventListener('paste', function(e) {
                    try {
                        const clipboardData = e.clipboardData || window.clipboardData;
                        if (!clipboardData) return;

                        const items = clipboardData.items || [];
                        for (let i = 0; i < items.length; i++) {
                            const item = items[i];
                            if (item.type && item.type.indexOf('image') === 0) {
                                e.preventDefault();
                                const blob = item.getAsFile();
                                if (!blob) continue;

                                // Check size limit
                                if (blob.size > MAX_IMAGE_BYTES) {
                                    try {
                                        if (typeof showFloatingAlert === 'function')
                                            showFloatingAlert('Image must be smaller than 10 MB.', 'warning');
                                    } catch(_) {
                                        alert('Image must be smaller than 10 MB.');
                                    }
                                    return;
                                }

                                // Create a File object from blob
                                const file = new File([blob], 'pasted-image-' + Date.now() + '.png', { type: blob.type });

                                // Create a DataTransfer to set the files
                                const dataTransfer = new DataTransfer();
                                dataTransfer.items.add(file);
                                input.files = dataTransfer.files;

                                // Trigger change event
                                const event = new Event('change', { bubbles: true });
                                input.dispatchEvent(event);

                                // Show floating alert
                                try {
                                    if (typeof showFloatingAlert === 'function')
                                        showFloatingAlert('Screenshot pasted successfully!', 'success', 1500);
                                } catch(_) {}

                                break;
                            }
                        }
                    } catch(err) {
                        console.error('Paste error:', err);
                    }
                }, true);
            }
        };

        input.addEventListener("change", function () {
            if (input.files && input.files[0]) {
                // Enforce image size limit
                const file = input.files[0];
                if (file.size > MAX_IMAGE_BYTES) {
                    try { if (typeof showFloatingAlert === 'function') showFloatingAlert('Image must be smaller than 10 MB.', 'warning'); } catch(_) { alert('Image must be smaller than 10 MB.'); }
                    input.value = '';
                    return;
                }
                const reader = new FileReader();
                reader.onload = function (e) {
                    label.style.backgroundImage = `url('${e.target.result}')`;
                    label.classList.add("has-image");
                    label.style.backgroundSize = "cover";
                    label.style.opacity = "1";
                    clearBtn.classList.remove("d-none");
                };
                reader.readAsDataURL(file);
            } else {
                label.style.backgroundImage = "";
                label.classList.remove("has-image");
                label.style.opacity = "0.5";
                clearBtn.classList.add("d-none");
            }
        });

        clearBtn.addEventListener("click", function (e) {
            e.preventDefault();
            input.value = "";
            label.style.backgroundImage =
                "url('" + appUrl + "/asset/img/background/add-image.png')";
            label.style.backgroundPosition = "center center";
            label.style.backgroundRepeat = "no-repeat";
            label.style.backgroundSize = "50%";
            label.classList.remove("has-image");
            label.style.opacity = "0.5";
            label.classList.remove("is-valid");
            label.classList.remove("is-invalid");
            clearBtn.classList.add("d-none");
        });

        // Setup paste handler after a short delay to ensure modal is ready
        setTimeout(setupPasteHandler, 100);
    }

    function loadProjects() {
        // Support multiple Add Task modal variants that may exist on the page
        // by binding per-instance handlers while fetching project list once.
        const inputs = Array.from(document.querySelectorAll('#task_project_input'));
        if (!inputs.length) return;

        let projects = [];
        let fetched = false;

        function fetchProjectsOnce() {
            if (fetched) return;
            fetched = true;
            fetch(appUrl + '/project/index')
                .then(res => res.json())
                .then(payload => {
                    projects = payload && (payload.data || payload.projects || payload) ? (payload.data || payload.projects || payload) : [];
                    if (!Array.isArray(projects)) projects = [];
                })
                .catch(err => {
                    console.error('Error loading projects:', err);
                    projects = [];
                });
        }

        // render dropdown for a specific scope (modal/form)
        function renderDropdownFor(scope, dropdown, filter) {
            dropdown.innerHTML = '';
            const q = String(filter || '').toLowerCase();
            const filtered = projects.filter(p => (p.title || '').toLowerCase().includes(q));
            if (!filtered.length) {
                const note = document.createElement('div');
                note.className = 'dropdown-item disabled text-muted';
                note.textContent = 'No projects found';
                dropdown.appendChild(note);
                dropdown.style.display = 'block';
                return;
            }
            filtered.forEach(p => {
                const avatarHtml = p.image ? `<img src="${appUrl}/file/project/${p.image}" width="24" height="24" style="object-fit:cover;border-radius:50%;"/>` : `<div class="rounded-circle d-flex align-items-center justify-content-center" style="width:24px;height:24px;background:#6A5AE0;color:#fff;font-size:12px;">${(p.title||'').charAt(0).toUpperCase()}</div>`;
                const item = document.createElement('div');
                item.className = 'dropdown-item d-flex align-items-center gap-2';
                item.innerHTML = `${avatarHtml}<span>${p.title}</span>`;
                item.addEventListener('click', () => {
                    try {
                        const hiddenInput = scope.querySelector('#task_project_id');
                        const input = scope.querySelector('#task_project_input');
                        const selectedContainer = scope.querySelector('#task_selected_project');
                        if (hiddenInput) hiddenInput.value = p.id;
                        if (input) input.value = p.title;
                        dropdown.style.display = 'none';
                        if (selectedContainer) {
                            selectedContainer.innerHTML = `\n                                <div class="d-flex align-items-center gap-2 p-2 rounded bg-light selected-project">\n                                    ${p.image ? `<img src="${appUrl}/file/project/${p.image}" width="28" height="28" style="object-fit:cover;border-radius:50%;">` : `<div class="rounded-circle d-flex align-items-center justify-content-center" style="width:28px;height:28px;background:#6A5AE0;color:#fff;font-size:14px;">${(p.title||'').charAt(0).toUpperCase()}</div>`}\n                                    <span class="flex-grow-1">${p.title}</span>\n                                    <button type="button" class="btn btn-sm btn-remove-project" style="line-height:1">\n                                        <span class="material-symbols-outlined">close</span>\n                                    </button>\n                                </div>`;
                            const btn = selectedContainer.querySelector('.btn-remove-project');
                            if (btn) btn.addEventListener('click', () => { if (hiddenInput) hiddenInput.value = ''; if (input) input.value = ''; selectedContainer.innerHTML = ''; const parentSel = document.getElementById('task_parent_id'); if (parentSel) parentSel.innerHTML = "<option value=''>No Parent</option>"; });
                        }
                        // Trigger loadRelatedTasks for this project
                        try { loadRelatedTasks(p.id, 'task', null); } catch(_){}
                    } catch (e) { console.warn('project select click err', e); }
                });
                dropdown.appendChild(item);
            });
            dropdown.style.display = 'block';
        }

        // kick off initial fetch
        fetchProjectsOnce();

        inputs.forEach(input => {
            const scope = input.closest('.modal') || input.closest('form') || document;
            const dropdown = scope.querySelector('#task_project_dropdown');
            if (!dropdown) return;
            input.addEventListener('input', function(){ renderDropdownFor(scope, dropdown, this.value); });
            input.addEventListener('focus', function(){ renderDropdownFor(scope, dropdown, this.value); });
            // hide dropdown when click outside
            document.addEventListener('click', function(e){ if (!dropdown.contains(e.target) && e.target !== input) dropdown.style.display = 'none'; });
        });
    }

    function loadRelatedTasks(projectId, prefix = "task", selectedParentId = null, selectedParentTitle = "") {
        try {
            // If prefix is a DOM element (e.g., a select), derive prefix from its id
            if (prefix && typeof prefix !== 'string' && prefix.id) {
                var match = String(prefix.id).match(/^(.+)_parent_id$/) || String(prefix.id).match(/^(.+)_parent_input$/);
                if (match) prefix = match[1];
            }
        } catch (_) {}

        try {
            // If selectedParentId is actually a DOM element (e.g., passed accidentally), extract its value
            if (selectedParentId && typeof selectedParentId !== 'string' && typeof selectedParentId !== 'number') {
                if (selectedParentId.id && String(selectedParentId.id).match(/_parent_id$/) && typeof selectedParentId.value !== 'undefined') {
                    selectedParentId = selectedParentId.value;
                } else if (selectedParentId.getAttribute && selectedParentId.getAttribute('data-parent-id')) {
                    selectedParentId = selectedParentId.getAttribute('data-parent-id');
                } else {
                    // fallback: not a usable value
                    selectedParentId = selectedParentId || null;
                }
            }
        } catch (_) { selectedParentId = null; }

        const input = document.getElementById(`${prefix}_parent_input`);
        const dropdown = document.getElementById(`${prefix}_parent_dropdown`);
        const selectedContainer = document.getElementById(`${prefix}_selected_parent`);
        const hiddenInput = document.getElementById(`${prefix}_parent_id`);

        if (!input || !dropdown || !selectedContainer || !hiddenInput) return;

        let tasks = [];

        function getInitialAvatar(name) {
            const colors = [
                "#F44336", "#E91E63", "#9C27B0", "#673AB7",
                "#3F51B5", "#2196F3", "#03A9F4", "#00BCD4",
                "#009688", "#4CAF50", "#8BC34A", "#FFC107",
                "#FF9800", "#FF5722", "#795548"
            ];
            const color = colors[Math.floor(Math.random() * colors.length)];
            const initial = (name || "?").charAt(0).toUpperCase();
            return `<div style="
                width:28px;height:28px;
                border-radius:50%;
                background:${color};
                color:#fff;
                font-size:13px;
                font-weight:bold;
                display:flex;
                align-items:center;
                justify-content:center;
            ">${initial}</div>`;
        }

        function showSelectedTask(task) {
            try {
                if (window.__debugLoadRelatedTasks) console.debug('loadRelatedTasks.showSelectedTask', { prefix: prefix, taskId: task && task.id, taskTitle: task && task.title });
            } catch(_) {}
            let avatarHtml = task.image
                ? `<img src="${appUrl}/file/task/${task.image}" width="28" height="28" style="object-fit:cover;border-radius:50%;">`
                : getInitialAvatar(task.title);

            selectedContainer.innerHTML = `
                <div class="d-flex align-items-center gap-2 p-2 rounded bg-light selected-task">
                    ${avatarHtml}
                    <span class="flex-grow-1">${task.title}</span>
                    <button type="button" class="btn btn-sm btn-remove-task remove-task" style="line-height:1">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
            `;

            selectedContainer.querySelector(".remove-task").addEventListener("click", () => {
                hiddenInput.value = "";
                input.value = "";
                selectedContainer.innerHTML = "";
            });
        }

        function renderDropdown(filter = "") {
            dropdown.innerHTML = "";
            let filtered = tasks.filter(t =>
                t.title.toLowerCase().includes(filter.toLowerCase())
            );

            filtered.forEach(t => {
                let avatarHtml = t.image
                    ? `<img src="${appUrl}/file/task/${t.image}" width="24" height="24" style="object-fit:cover;border-radius:50%;">`
                    : getInitialAvatar(t.title);

                const item = document.createElement("div");
                item.className = "dropdown-item d-flex align-items-center gap-2";
                item.innerHTML = `${avatarHtml}<span>${t.title}</span>`;
                item.addEventListener("click", () => {
                    hiddenInput.value = t.id;
                    input.value = t.title;
                    dropdown.style.display = "none";
                    showSelectedTask(t);
                });
                dropdown.appendChild(item);
            });

            dropdown.style.display = filtered.length ? "block" : "none";
        }

        fetch(appUrl + "/projects/" + encodeURIComponent(projectId) + "/tasks")
            .then(res => res.json())
            .then(payload => {
                tasks = (payload.data || []).map(t => ({
                    id: t.id,
                    title: t.title,
                    image: t.image || ""
                }));

                // Jika edit mode dan parent sudah ada → tampilkan langsung
                if (selectedParentId) {
                    const found = tasks.find(t => String(t.id) === String(selectedParentId));
                    if (found) {
                        hiddenInput.value = found.id;
                        input.value = found.title;
                        showSelectedTask(found);
                    } else if (selectedParentTitle) {
                        hiddenInput.value = selectedParentId;
                        input.value = selectedParentTitle;
                        showSelectedTask({ id: selectedParentId, title: selectedParentTitle, image: "" });
                    }
                }
            })
            .catch(err => console.error("Failed to load related tasks", err));

        input.addEventListener("input", () => renderDropdown(input.value));
        input.addEventListener("focus", () => renderDropdown(input.value));

        document.addEventListener("click", (e) => {
            if (!dropdown.contains(e.target) && e.target !== input) {
                dropdown.style.display = "none";
            }
        });
    }

    // Ensure a parent option exists in select by fetching single task and appending if missing
    function ensureParentOption(selectElement, parentId) {
        if (!selectElement || !parentId) return;
        try {
            const found = selectElement.querySelector('option[value="' + String(parentId) + '"]');
            if (found) {
                selectElement.value = String(parentId);
                return;
            }
            fetch(appUrl + '/task/' + encodeURIComponent(String(parentId)))
                .then(r => r.ok ? r.json() : Promise.reject('Not found'))
                .then(res => {
                    const taskSingle = (res && (res.data || res)) || null;
                    if (taskSingle && taskSingle.id) {
                        const opt2 = document.createElement('option');
                        opt2.value = taskSingle.id;
                        opt2.textContent = taskSingle.title || ('Task #' + taskSingle.id);
                        selectElement.appendChild(opt2);
                        selectElement.value = String(taskSingle.id);
                    }
                })
                .catch(err => { console.warn('ensureParentOption fetch failed', err); });
        } catch (e) { console.warn('ensureParentOption error', e); }
    }

    // Export helpers to global scope so other modules (schedule.js, schedule-create.js) can call them
    try {
        window.loadRelatedTasks = loadRelatedTasks;
        window.ensureParentOption = ensureParentOption;
    } catch (e) {
        console.warn('Failed to export loadRelatedTasks/ensureParentOption to window', e);
    }

    if (imageInput && imageLabel && imageClearBtn) {
        setupImageInput(imageInput, imageLabel, imageClearBtn);
    }

    if (addTaskModalEl) {
        addTaskModalEl.addEventListener("hidden.bs.modal", function () {
            if (addTaskForm) {
                addTaskForm.reset();
                try { if (window.__quillTaskAdd && window.__quillTaskAdd.root) window.__quillTaskAdd.root.innerHTML = ''; } catch(_){}
            }
            if (imageLabel && imageClearBtn) {
                imageLabel.style.backgroundImage =
                    "url('" + appUrl + "/asset/img/background/add-image.png')";
                imageLabel.style.backgroundPosition = "center center";
                imageLabel.style.backgroundRepeat = "no-repeat";
                imageLabel.style.backgroundSize = "50%";
                imageLabel.classList.remove("has-image");
                imageLabel.style.opacity = "0.5";
                imageClearBtn.classList.add("d-none");
            }
            // Clear executor selections
            if (window.clearSelectedExecutors) {
                window.clearSelectedExecutors();
            }

            // Reset project input visibility for normal task page
            const taskProjectInput = document.getElementById('task_project_input');
            const taskSelectedProject = document.getElementById('task_selected_project');
            const taskProjectDropdown = document.getElementById('task_project_dropdown');
            const taskProjectId = document.getElementById('task_project_id');
            const taskProjectContainer = taskProjectInput ? taskProjectInput.closest('.mb-3.custom-input') : null;

            // Show entire project container
            if (taskProjectContainer) {
                taskProjectContainer.style.display = 'block';
            }

            if (taskProjectInput) {
                taskProjectInput.style.display = 'block';
                taskProjectInput.setAttribute('required', 'required');
                taskProjectInput.disabled = false; // Re-enable
                taskProjectInput.value = '';
            }

            if (taskProjectDropdown) {
                taskProjectDropdown.style.display = 'block';
                taskProjectDropdown.innerHTML = '';
            }

            if (taskSelectedProject) {
                taskSelectedProject.innerHTML = '';
                taskSelectedProject.style.display = 'none';
            }

            if (taskProjectId) {
                taskProjectId.value = '';
            }

            // Reset parent task selection
            const taskParentInput = document.getElementById('task_parent_input');
            const taskParentId = document.getElementById('task_parent_id');
            const taskSelectedParent = document.getElementById('task_selected_parent');
            const taskParentDropdown = document.getElementById('task_parent_dropdown');

            if (taskParentInput) taskParentInput.value = '';
            if (taskParentId) taskParentId.value = '';
            if (taskSelectedParent) taskSelectedParent.innerHTML = '';
            if (taskParentDropdown) {
                taskParentDropdown.innerHTML = '';
                taskParentDropdown.style.display = 'none';
            }
        });
        // When Add Task modal is shown, set sensible defaults if fields are empty.
        addTaskModalEl.addEventListener('show.bs.modal', function () {
            try {
                // Check if we're on project detail page
                const projectIdMeta = document.querySelector('meta[name="project-id"]');
                const currentProjectId = projectIdMeta ? projectIdMeta.getAttribute('content') : null;

                if (currentProjectId) {
                    // Auto-fill project for project detail page
                    const taskProjectIdInput = document.getElementById('task_project_id');
                    const taskProjectInput = document.getElementById('task_project_input');
                    const taskSelectedProject = document.getElementById('task_selected_project');
                    const taskProjectDropdown = document.getElementById('task_project_dropdown');
                    const taskProjectContainer = taskProjectInput ? taskProjectInput.closest('.mb-3.custom-input') : null;

                    if (taskProjectIdInput) {
                        taskProjectIdInput.value = currentProjectId;
                    }

                    // Hide entire project input container (including label)
                    if (taskProjectContainer) {
                        taskProjectContainer.style.display = 'none';
                    } else {
                        // Fallback: hide individual elements
                        if (taskProjectInput) {
                            taskProjectInput.style.display = 'none';
                        }
                        if (taskProjectDropdown) {
                            taskProjectDropdown.style.display = 'none';
                        }
                        if (taskSelectedProject) {
                            taskSelectedProject.style.display = 'none';
                        }
                    }

                    // CRITICAL: Remove required attribute and disable to prevent validation error
                    if (taskProjectInput) {
                        taskProjectInput.removeAttribute('required');
                        taskProjectInput.disabled = true;
                    }

                    // Load tasks from current project for "Related to Task" dropdown
                    loadProjectTasksForRelated(currentProjectId);
                } else {
                    // Reset to normal behavior for task page
                    const taskProjectInput = document.getElementById('task_project_input');
                    const taskSelectedProject = document.getElementById('task_selected_project');
                    const taskProjectDropdown = document.getElementById('task_project_dropdown');
                    const taskProjectContainer = taskProjectInput ? taskProjectInput.closest('.mb-3.custom-input') : null;

                    // Show entire project input container
                    if (taskProjectContainer) {
                        taskProjectContainer.style.display = 'block';
                    }

                    if (taskProjectInput) {
                        taskProjectInput.style.display = 'block';
                        taskProjectInput.setAttribute('required', 'required');
                        taskProjectInput.disabled = false; // Re-enable
                    }

                    if (taskProjectDropdown) {
                        taskProjectDropdown.style.display = 'block';
                    }

                    if (taskSelectedProject) {
                        taskSelectedProject.innerHTML = '';
                        taskSelectedProject.style.display = 'none';
                    }
                }

                // Priority default: MEDIUM if not selected
                const prio = document.getElementById('task_priority');
                if (prio && (!prio.value || String(prio.value).trim() === '')) {
                    prio.value = 'MEDIUM';
                }

                // Date defaults: start_date = today, due_date = today + 2 days
                const startEl = document.getElementById('task_start_date');
                const dueEl = document.getElementById('task_due_date');
                const now = new Date();
                function formatDate(d) {
                    const yyyy = d.getFullYear();
                    const mm = String(d.getMonth() + 1).padStart(2, '0');
                    const dd = String(d.getDate()).padStart(2, '0');
                    return `${yyyy}-${mm}-${dd}`;
                }
                const todayStr = formatDate(now);
                const dueDate = new Date(now.getTime());
                dueDate.setDate(dueDate.getDate() + 2);
                const dueStr = formatDate(dueDate);

                if (startEl && (!startEl.value || String(startEl.value).trim() === '')) {
                    startEl.value = todayStr;
                }
                if (dueEl && (!dueEl.value || String(dueEl.value).trim() === '')) {
                    dueEl.value = dueStr;
                }
            } catch (e) {
                // swallow errors to avoid breaking modal show
                console.warn('AddTaskModal show handler error', e);
            }
        });
    }

    if (addTaskForm) {
        addTaskForm.addEventListener("submit", function (e) {
            e.preventDefault();

            if (!addTaskForm.checkValidity()) {
                e.stopPropagation();
                addTaskForm.classList.add("was-validated");
                return;
            }
            // Executor required validation
            try {
                const execHidden = document.getElementById('executors');
                let execVal = execHidden ? execHidden.value : '';
                let execArr = [];
                if (execVal) {
                    try { execArr = JSON.parse(execVal); } catch(_) { execArr = []; }
                }
                if (!Array.isArray(execArr) || execArr.length === 0) {
                    showFloatingAlert('Please select at least one executor.', 'warning', 2500);
                    return;
                }
            } catch(_) {}
            addTaskForm.classList.remove("was-validated");

            // Show loading overlay and disable submit button
            const loader = document.getElementById("addTaskModalLoader");
            if (loader) loader.classList.remove("d-none");
            const submitBtn = addTaskForm.querySelector(
                "button[type='submit']"
            );
            if (submitBtn) submitBtn.disabled = true;

            // Validate sizes: include task image (if any) and selectedFiles
            try {
                const imageEl = document.getElementById('task_image');
                const imageFile = (imageEl && imageEl.files && imageEl.files[0]) ? imageEl.files[0] : null;
                if (imageFile && imageFile.size > MAX_IMAGE_BYTES) {
                    try { if (typeof showFloatingAlert === 'function') showFloatingAlert('Task image must be smaller than 10 MB.', 'warning'); } catch(_) { alert('Task image must be smaller than 10 MB.'); }
                    return;
                }
                const totalCheck = validateTotalUploadSize({imageFile: imageFile, extraFiles: selectedFiles});
                if (!totalCheck.ok) {
                    try { if (typeof showFloatingAlert === 'function') showFloatingAlert('Total upload size must be 100 MB or less.', 'warning'); } catch(_) { alert('Total upload size must be 100 MB or less.'); }
                    return;
                }
            } catch(_) {}

            const formData = new FormData(addTaskForm);
            // Ensure parent_id is appended only when it has a real value
            try {
                const parentSel = document.getElementById('task_parent_id');
                if (parentSel) {
                    var pval = parentSel.value;
                    // Only send parent_id when it's a non-empty numeric value that likely corresponds to a real task id
                    if (pval && pval !== '' && pval !== 'null' && !isNaN(Number(pval))) {
                        formData.set('parent_id', String(Number(pval)));
                    } else {
                        // Remove parent_id to avoid sending invalid values which fail server-side exists validation
                        try { formData.delete('parent_id'); } catch (_) {}
                    }
                }
            } catch(_) {}
            // Append all selected reference files to formData
            selectedFiles.forEach((file) => {
                formData.append("reference_files[]", file);
            });

            $.ajax({
                url: appUrl + "/task/store",
                type: "POST",
                headers: {
                    "X-CSRF-TOKEN": document
                        .querySelector('meta[name="csrf-token"]')
                        .getAttribute("content"),
                },
                data: formData,
                processData: false,
                contentType: false,
                success: function (data) {
                    // Keep loading overlay visible for a moment to show success
                    setTimeout(() => {
                        // Hide loading overlay
                        if (loader) loader.classList.add("d-none");
                        if (submitBtn) submitBtn.disabled = false;

                // Show success floating alert instead of modal alert
                showFloatingAlert(data.message || "Task added successfully!", "success");

                        // Reset form and preview
                    addTaskForm.reset();
                    try { if (window.__quillTaskAdd && window.__quillTaskAdd.root) window.__quillTaskAdd.root.innerHTML = ''; } catch(_){}
                        imageLabel.style.backgroundImage = "";
                        imageLabel.classList.remove("has-image");
                        imageLabel.style.opacity = "0.5";
                        imageClearBtn.classList.add("d-none");

                        // Reset selected files array
                        selectedFiles = [];
                        displaySelectedFiles();

                        // Close modal after short delay to show alert
                        setTimeout(() => {
                            var addTaskModalInstance =
                                bootstrap.Modal.getInstance(addTaskModalEl);
                            try {
                                if (addTaskModalEl && addTaskModalEl.dataset) addTaskModalEl.dataset.allowProgrammaticClose = '1';
                            } catch(_) {}
                            if (addTaskModalInstance)
                                addTaskModalInstance.hide();

                            // Check if we're on project detail page
                            const projectIdMeta = document.querySelector('meta[name="project-id"]');
                            const currentProjectId = projectIdMeta ? projectIdMeta.getAttribute('content') : null;

                            if (currentProjectId) {
                                // Stay on project detail page and reload
                                window.location.reload();
                            } else {
                                // Redirect to task page (default behavior)
                                window.location.href = appUrl + "/task";
                            }
                        }, 1500);
                    }, 800); // Show loading for 800ms before showing success alert
                },
                error: function (xhr) {
                    // Hide loading overlay on error
                    if (loader) loader.classList.add("d-none");
                    if (submitBtn) submitBtn.disabled = false;

                    let errorMessage = "Failed to create task.";
                    if (xhr.responseJSON && xhr.responseJSON.errors) {
                        errorMessage = Object.values(xhr.responseJSON.errors)
                            .flat()
                            .join("\n");
                    } else if (xhr.responseJSON && xhr.responseJSON.message) {
                        errorMessage = xhr.responseJSON.message;
                    }
                    showFloatingAlert(errorMessage, "danger");
                },
                complete: function () {
                    // Don't hide loader here, let success/error handle it
                    // This prevents loader from disappearing too early
                },
            });
        });
    }


    // Executor input setup
    function setupExecutorInput() {
        const input = document.getElementById("executor_input");
        const dropdown = document.getElementById("executor_dropdown");
        const selectedContainer = document.getElementById("selected_executors");
        const hiddenInput = document.getElementById("executors");

        let employees = [];
        let filteredEmployees = [];
        let selectedEmployees = [];

        function fetchEmployees(query = "") {
                fetchEmployeesForExecutorCached(query)
                .then(function(data){
                    employees = (data && (data.data || data)) || [];
                    // Exclude administrator users from executor pickers
                    employees = employees.filter(emp => String(emp.user_type || '').toUpperCase() !== 'ADMINISTRATOR');
                    filteredEmployees = employees;
                    renderDropdown();
                })
                .catch(function(){
                    try { showFloatingAlert("Failed to load employees.", "warning", 3000); } catch(_) {}
                });
        }

        function renderDropdown() {
            if (filteredEmployees.length === 0) {
                dropdown.innerHTML =
                    '<div class="dropdown-item disabled">No employees found</div>';
                dropdown.style.display = "block";
                return;
            }

        const html = filteredEmployees
                .map((emp) => {
                    const isChecked = selectedEmployees.some(
                        (e) => e.id === emp.id
                    );
            const photoUrl = buildPhotoUrl(emp.user_photo, emp.profile_picture, emp.profile_picture_url);
            return `
                    <label class="dropdown-item d-flex align-items-center justify-content-between" style="cursor: pointer;">
                        <div class="d-flex align-items-center">
                <img src="${photoUrl}" alt="${
                        emp.name
            }" class="rounded-circle me-2" style="width: 30px; height: 30px; object-fit: cover;" onerror="this.onerror=null;this.src='${appUrl}/asset/img/avatar.png'">
                            <div class="d-flex flex-column">
                                <span class="executor-name">${emp.name}</span>
                                <small class="text-muted executor-division">${emp.division || emp.division_name || ''}</small>
                            </div>
                        </div>
                        <input type="checkbox" class="executor-checkbox" data-id="${
                            emp.id
                        }" data-name="${emp.name}" ${
                        isChecked ? "checked" : ""
                    }>
                    </label>
                `;
                })
                .join("");
            dropdown.innerHTML = html;
            dropdown.style.display = "block";

            dropdown
                .querySelectorAll(".executor-checkbox")
                .forEach((checkbox) => {
                    checkbox.addEventListener("change", function () {
                        const id = parseInt(this.getAttribute("data-id"));
                        const name = this.getAttribute("data-name");
                        const employeeObj = employees.find(
                            (emp) => emp.id === id
                        );
                        if (this.checked) {
                            if (!selectedEmployees.some((e) => e.id === id)) {
                                selectedEmployees.push({
                                    id,
                                    name,
                                    user_photo: employeeObj
                                        ? employeeObj.user_photo
                                        : null,
                                    division: employeeObj ? (employeeObj.division || employeeObj.division_name || '') : ''
                                });
                            }
                        } else {
                            selectedEmployees = selectedEmployees.filter(
                                (e) => e.id !== id
                            );
                        }
                        renderSelected();
                        updateHiddenInput();
                    });
                });
        }

        function renderSelected() {
            selectedContainer.innerHTML = "";
            selectedEmployees.forEach((emp) => {
                const photoUrl = buildPhotoUrl(emp.user_photo, emp.profile_picture, emp.profile_picture_url);

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

                const nameSpan = document.createElement("span");
                // show name with division under it
                const nameCol = document.createElement('div');
                nameCol.className = 'd-flex flex-column';
                const nameText = document.createElement('span');
                nameText.textContent = emp.name || '';
                nameText.style.marginBottom = "5px";

                const divSmall = document.createElement('small');
                divSmall.className = 'text-muted executor-division';
                divSmall.textContent = emp.division || '';
                nameCol.appendChild(nameText);
                nameCol.appendChild(divSmall);

                const removeBtn = document.createElement("button");
                removeBtn.type = "button";
                removeBtn.className = "btn-close btn-sm ms-2";
                removeBtn.setAttribute("aria-label", "Remove");
                removeBtn.addEventListener("click", () => {
                    selectedEmployees = selectedEmployees.filter(
                        (e) => e.id !== emp.id
                    );
                    renderSelected();
                    updateHiddenInput();
                    renderDropdown();
                });

                badge.appendChild(img);
                badge.appendChild(nameCol);
                badge.appendChild(removeBtn);
                selectedContainer.appendChild(badge);
            });
        }

        function updateHiddenInput() {
            hiddenInput.value = JSON.stringify(
                selectedEmployees.map((e) => e.id)
            );
        }

        function filterEmployees(value) {
            const val = value.trim().toLowerCase();
            if (val === "") {
                filteredEmployees = employees;
            } else {
                filteredEmployees = employees.filter((emp) =>
                    emp.name.toLowerCase().includes(val)
                );
            }
            renderDropdown();
        }

        input.addEventListener("input", function () {
            filterEmployees(this.value);
        });

        input.addEventListener("focus", function () {
            filterEmployees(this.value);
        });

        document.addEventListener("click", function (e) {
            if (!input.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = "none";
            }
        });

        fetchEmployees();

        window.clearSelectedExecutors = function () {
            selectedEmployees = [];
            renderSelected();
            updateHiddenInput();
            dropdown.style.display = "none";
            input.value = "";
        };
        // Allow programmatically setting selected executors for Add modal
        window.setSelectedExecutorsAdd = function (executors) {
            try {
                selectedEmployees = (executors || []).map(function (ex) {
                    var photo = ex.user_photo || ex.profile_picture || ex.profile_picture_url || null;
                    var photoUrl = buildPhotoUrl(photo, ex.profile_picture, ex.profile_picture_url);
                    return { id: ex.id, name: ex.name, user_photo: photoUrl, division: ex.division || ex.division_name || '' };
                });
                renderSelected();
                updateHiddenInput();
                // Hide the dropdown and clear the search input so the employee dropup does not appear
                try { dropdown.style.display = 'none'; } catch(_) {}
                try { input.value = ''; } catch(_) {}
            } catch (e) { console.warn('setSelectedExecutorsAdd error', e); }
        };
    }

    setupExecutorInput();
    setupEditExecutorInput();
    setupReferenceFilesInput();
    setupEditReferenceFilesInput();

    loadProjects();
    // Wire project selects to load related tasks for parent selection
    try {
        const addProjectSel = document.getElementById('task_project_id');
        const addParentSel = document.getElementById('task_parent_id');
        if (addProjectSel) {
            addProjectSel.addEventListener('change', function () {
                // Pass prefix string 'task' (not DOM element) for consistent behavior
                loadRelatedTasks(this.value || null, 'task', null);
            });
        }

        const editProjectSel = document.getElementById('edit_task_project_id');
        const editParentSel = document.getElementById('edit_task_parent_id');
        if (editProjectSel) {
            editProjectSel.addEventListener('change', function () {
                const excludeId = document.getElementById('edit_task_id') ? document.getElementById('edit_task_id').value : null;
                // Use prefix 'edit_task' so loadRelatedTasks populates the edit modal parent UI
                loadRelatedTasks(this.value || null, 'edit_task', excludeId);
            });
        }
    } catch (e) { console.warn('Failed to wire project->parent selects', e); }

    // Wire division select in Add Task modal to auto-select executors from that division
    try {
        const addDivisionSel = document.getElementById('task_division_id');
        if (addDivisionSel) {
            // Read logged-in employee's department id from DOM if present
            let empDeptId = null;
            try { empDeptId = document.getElementById('taskFeedbackModal')?.dataset?.employeeDepartmentId || null; } catch(_) { empDeptId = null; }
            // Populate divisions on page load: prefer department-scoped list when department id available
            const populateAddDivisions = (data) => {
                if (!data || !data.data) return;
                let opts = '<option value="">Select Division</option>';
                data.data.forEach(function(div){ opts += `<option value="${div.id}" data-name="${(div.name_division||div.name)}">${(div.name_division||div.name)}</option>`; });
                addDivisionSel.innerHTML = opts;
            };

            if (empDeptId) {
                fetch(appUrl + '/divisions-for-projects?department_id=' + encodeURIComponent(empDeptId))
                    .then(r => r.ok ? r.json() : Promise.reject('Failed to load divisions'))
                    .then(populateAddDivisions)
                    .catch(err => {
                        // fallback to unfiltered list
                        fetch(appUrl + '/divisions-for-projects')
                            .then(r => r.ok ? r.json() : Promise.reject('Failed'))
                            .then(populateAddDivisions)
                            .catch(() => {});
                    });
            } else {
                fetch(appUrl + '/divisions-for-projects')
                    .then(r => r.ok ? r.json() : Promise.reject('Failed to load divisions'))
                    .then(populateAddDivisions)
                    .catch(err => { /* ignore */ });
            }

            addDivisionSel.addEventListener('change', function () {
                const val = this.value;
                const selectedName = (this.selectedOptions && this.selectedOptions[0] && this.selectedOptions[0].dataset && this.selectedOptions[0].dataset.name) ? this.selectedOptions[0].dataset.name : '';
                if (!val) {
                    // Clear auto-selection when unselected
                    try { if (window.clearSelectedExecutors) window.clearSelectedExecutors(); } catch(_){}
                    return;
                }
                // Fetch employees and filter by division name primarily
                fetch(appUrl + '/employees-for-projects')
                    .then(r => r.ok ? r.json() : Promise.reject('Failed'))
                    .then(res => {
                        const arr = (res && res.data) || [];
                        const nameLower = String(selectedName || '').toLowerCase();
                        const filteredByName = arr.filter(emp => String(emp.division || '').toLowerCase() === nameLower);
                        // If the employees payload contains division_id field, also try matching by id
                        const filteredById = arr.filter(emp => String(emp.division_id || '').toLowerCase() === String(val).toLowerCase());
                        const final = filteredByName.length ? filteredByName : (filteredById.length ? filteredById : []);
                        if (!final.length) {
                            try { showFloatingAlert('No employees found for selected division.', 'warning', 2500); } catch(_){}
                            return;
                        }
                        if (window.setSelectedExecutorsAdd) window.setSelectedExecutorsAdd(final);
                    })
                    .catch(err => { try { showFloatingAlert('Failed to load employees for division.', 'warning', 2500); } catch(_){} });
            });

                // Setup dropup UI for division select so it behaves like executor dropup
                try {
                    const divisionDropdown = document.getElementById('task_division_dropdown');
                    if (divisionDropdown) {
                        // Populate items when select is focused/clicked
                        function renderDivisionDropup() {
                            const opts = Array.from(addDivisionSel.options || []);
                            if (!opts.length) {
                                divisionDropdown.innerHTML = '<div class="division-item disabled">No divisions</div>';
                                divisionDropdown.style.display = 'block';
                                return;
                            }
                            const html = opts.map(o => {
                                const val = o.value || '';
                                const txt = o.textContent || o.innerText || '';
                                return `<div class="division-item" data-value="${val}">${escapeHtml(txt)}</div>`;
                            }).join('');
                            divisionDropdown.innerHTML = html;
                            divisionDropdown.style.display = 'block';

                            divisionDropdown.querySelectorAll('.division-item').forEach(el => {
                                el.addEventListener('click', function () {
                                    const v = this.getAttribute('data-value');
                                    try { addDivisionSel.value = v; addDivisionSel.dispatchEvent(new Event('change', { bubbles: true })); } catch(_) {}
                                    divisionDropdown.style.display = 'none';
                                });
                            });
                        }

                        // Utility to escape HTML
                        function escapeHtml(str) {
                            return String(str || '').replace(/[&<>"']/g, function (m) {
                                return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[m];
                            });
                        }

                        // Show dropup on focus/click. Also intercept mousedown to prevent
                        // the browser's native select dropdown from opening while still
                        // allowing the element to receive focus (useful for keyboard).
                        addDivisionSel.addEventListener('focus', renderDivisionDropup);
                        // Bind click on the transparent activator (placed above the select)
                        // so pointer clicks open our custom dropup while the real select
                        // remains non-interactive (pointer-events:none) on desktop.
                        const activator = document.getElementById('task_division_activator');
                        if (activator) {
                            activator.addEventListener('click', function (e) {
                                try { e.preventDefault(); e.stopPropagation(); } catch(_) {}
                                renderDivisionDropup();
                                try { addDivisionSel.focus(); } catch(_) {}
                            });
                        } else {
                            // Fallback: if activator not present, keep select's click behavior
                            addDivisionSel.addEventListener('click', function (e) {
                                try { e.preventDefault(); e.stopPropagation(); } catch(_) {}
                                renderDivisionDropup();
                                try { addDivisionSel.focus(); } catch(_) {}
                            });
                        }
                        // Intercept certain keyboard keys (Space / ArrowDown / ArrowUp)
                        // to prevent native select opening and show custom dropup instead.
                        addDivisionSel.addEventListener('keydown', function (e) {
                            const k = e.key || '';
                            if (k === ' ' || k === 'Spacebar' || k === 'ArrowDown' || k === 'ArrowUp') {
                                try { e.preventDefault(); renderDivisionDropup(); } catch (_) {}
                            }
                        });

                        // Hide when clicking outside
                        document.addEventListener('click', function (e) {
                            if (!addDivisionSel.contains(e.target) && !divisionDropdown.contains(e.target)) {
                                divisionDropdown.style.display = 'none';
                            }
                        });
                    }
                } catch (e) { console.warn('division dropup init failed', e); }
        }
    } catch (e) { console.warn('Failed to wire division->executors', e); }
    // Also load projects for schedule modal (optional select)
    (function loadProjectsForSchedule(){
        const select = document.getElementById('schedule_project_id');
        if (!select) return;
    fetch(appUrl + "/project/index")
            .then(r => r.ok ? r.json() : Promise.reject('Failed to load projects'))
                .then(d => {
                    if (!d || !d.data) return;
                    let opts = '<option value="">No Project</option>';
                    (d.data || []).filter(p => !p.project_type || String(p.project_type) === 'public')
                        .forEach(p => { opts += `<option value="${p.id}">${p.title}</option>`; });
                    select.innerHTML = opts;
                })
            .catch(console.error);
    })();

    try {
        const editDivisionSel = document.getElementById('edit_task_division_id');
        if (editDivisionSel) {
            // Read logged-in employee's department id from DOM if present
            let empDeptIdEdit = null;
            try { empDeptIdEdit = document.getElementById('taskFeedbackModal')?.dataset?.employeeDepartmentId || null; } catch(_) { empDeptIdEdit = null; }
            // Load divisions on page load (prefer department-scoped)
            const populateEditDivisions = (d) => {
                if (!d || !d.data) return;
                let opts = '<option value="">Select Division</option>';
                d.data.forEach(function (div) {
                    opts += `
                        <option value="${div.id}"
                                data-name="${(div.name_division || div.name || '').trim()}">
                            ${(div.name_division || div.name || '').trim()}
                        </option>`;
                });
                editDivisionSel.innerHTML = opts;
            };

            if (empDeptIdEdit) {
                fetch(appUrl + '/divisions-for-projects?department_id=' + encodeURIComponent(empDeptIdEdit))
                    .then(r => r.ok ? r.json() : Promise.reject('Failed to load divisions'))
                    .then(populateEditDivisions)
                    .catch(err => {
                        fetch(appUrl + '/divisions-for-projects')
                            .then(r => r.ok ? r.json() : Promise.reject('Failed'))
                            .then(populateEditDivisions)
                            .catch(() => {});
                    });
            } else {
                fetch(appUrl + '/divisions-for-projects')
                    .then(r => r.ok ? r.json() : Promise.reject('Failed to load divisions'))
                    .then(populateEditDivisions)
                    .catch(err => console.warn('Failed to load divisions for edit', err));
            }

            // Division change → fetch employees
            editDivisionSel.addEventListener('change', function () {
                const val = this.value;
                const selectedName = (this.selectedOptions[0]?.dataset?.name || '').trim();

                if (!val) {
                    try { window.clearSelectedExecutors?.(); } catch (_) {}
                    return;
                }

                fetch(appUrl + '/employees-for-projects')
                    .then(r => r.ok ? r.json() : Promise.reject('Failed'))
                    .then(res => {
                        const arr = res?.data || [];
                        const valStr = String(val).toLowerCase();
                        const nameStr = String(selectedName).toLowerCase();

                        // Cari by ID dulu, kalau ga ada fallback ke nama
                        let final = arr.filter(emp => String(emp.division_id || '').toLowerCase() === valStr);

                        if (!final.length) {
                            final = arr.filter(emp => String(emp.division || '').toLowerCase() === nameStr);
                        }

                        if (!final.length) {
                            showFloatingAlert?.('No employees found for selected division.', 'warning', 2500);
                            return;
                        }
                        window.setSelectedExecutorsEdit?.(final);
                    })
                    .catch(() => {
                        showFloatingAlert?.('Failed to load employees for division.', 'warning', 2500);
                    });
            });

            // Custom dropdown
            const divisionDropdown = document.getElementById('edit_task_division_dropdown');
            if (divisionDropdown) {
                function renderDivisionDropup() {
                    const opts = Array.from(editDivisionSel.options || []);
                    if (!opts.length) {
                        divisionDropdown.innerHTML = '<div class="division-item disabled">No divisions</div>';
                        divisionDropdown.style.display = 'block';
                        return;
                    }

                    const html = opts.map(o => `
                        <div class="division-item" data-value="${o.value}">
                            ${escapeHtml(o.textContent || '')}
                        </div>
                    `).join('');
                    divisionDropdown.innerHTML = html;
                    divisionDropdown.style.display = 'block';

                    divisionDropdown.querySelectorAll('.division-item').forEach(el => {
                        el.addEventListener('click', function () {
                            const v = this.dataset.value;
                            editDivisionSel.value = v;
                            editDivisionSel.dispatchEvent(new Event('change', { bubbles: true }));
                            divisionDropdown.style.display = 'none';
                        });
                    });
                }

                function escapeHtml(str) {
                    return String(str || '').replace(/[&<>"']/g, m => ({
                        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
                    })[m]);
                }

                editDivisionSel.addEventListener('focus', renderDivisionDropup);

                const activator = document.getElementById('edit_task_division_activator');
                (activator || editDivisionSel).addEventListener('click', e => {
                    e.preventDefault();
                    e.stopPropagation();
                    renderDivisionDropup();
                    editDivisionSel.focus();
                });

                editDivisionSel.addEventListener('keydown', e => {
                    if ([' ', 'Spacebar', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
                        e.preventDefault();
                        renderDivisionDropup();
                    }
                });

                document.addEventListener('click', e => {
                    if (!editDivisionSel.contains(e.target) && !divisionDropdown.contains(e.target)) {
                        divisionDropdown.style.display = 'none';
                    }
                });
            }
        }
    } catch (e) {
        console.warn('Failed to wire edit division->executors', e);
    }

    // If an Edit Schedule modal exists, make its Project field optional
    (function relaxEditScheduleProjectRequired(){
        try {
            const sel = document.getElementById('edit_schedule_project_id');
            if (sel) sel.required = false;
            const label = document.querySelector('label[for="edit_schedule_project_id"]');
            if (label && !/optional/i.test(label.textContent)) {
                label.textContent = (label.textContent || 'Project').replace(/\s*\(.*\)\s*$/,'') + ' (optional)';
            }
        } catch(_) { /* noop */ }
    })();

    // Reference URL rows: delegated handlers (Add/Edit Task + Feedback modals)
    (function initReferenceUrlDynamicRows() {
        if (window._refUrlHandlersBound) return;
        window._refUrlHandlersBound = true;

        function findRefUrlsContainer(startEl) {
            if (!startEl) return null;
            return startEl.closest('#task_reference_urls_container, #edit_task_reference_urls_container, #feedback_reference_urls_container, #schedule_reference_urls_container');
        }

        function makeBtn(html) {
            const tmp = document.createElement('div');
            tmp.innerHTML = html.trim();
            return tmp.firstElementChild;
        }

        function createAddButton() {
            return makeBtn(`
                <button type="button" class="btn btn-submit-black add-ref-url" aria-label="Add URL">
                    <span class="material-symbols-outlined">add</span>
                </button>
            `);
        }

        function createRemoveButton() {
            return makeBtn(`
                <button type="button" class="btn btn-remove-url remove-ref-url" aria-label="Remove URL">
                    <span class="material-symbols-outlined">close</span>
                </button>
            `);
        }

        function getRowEls(container) {
            return Array.from(container.querySelectorAll(':scope > .input-group'));
        }

        function normalizeRows(container) {
            const rows = getRowEls(container);
            if (rows.length === 0) {
                container.appendChild(createRow(container, ''));
            }
            const fresh = getRowEls(container);
            fresh.forEach((row, idx) => {
                row.querySelectorAll('.add-ref-url, .remove-ref-url').forEach(btn => btn.remove());

                const isFirst = idx === 0;
                const btn = isFirst ? createAddButton() : createRemoveButton();
                row.appendChild(btn);
            });
        }

        function createRow(container, value = '') {
            const row = document.createElement('div');
            row.className = 'input-group';

            const input = document.createElement('input');
            input.type = 'url';
            input.name = 'reference_urls[]';
            input.placeholder = 'https://example.com';
            input.className = (container && container.id === 'feedback_reference_urls_container')
                ? 'form-control'
                : 'form-control input-text';

            if (value) input.value = value;
            row.appendChild(input);
            row.appendChild(createAddButton());
            return row;
        }

        (function ensureDownwardDirection() {
            try {
                document.querySelectorAll('#task_reference_urls_container, #edit_task_reference_urls_container, #feedback_reference_urls_container')
                    .forEach(ct => { ct.style.flexDirection = 'column'; });
            } catch (_) {}
        })();

        document.addEventListener('click', function (e) {
            const addBtn = e.target.closest('.add-ref-url');
            if (addBtn) {
                const container = findRefUrlsContainer(addBtn);
                if (!container) return;
                const rows = getRowEls(container);
                const firstRow = rows[0] || null;
                const newRow = createRow(container, '');
                if (firstRow && firstRow.parentElement === container) {
                    container.insertBefore(newRow, firstRow.nextSibling);
                } else {
                    container.appendChild(newRow);
                }
                normalizeRows(container);
                return;
            }

            const rmBtn = e.target.closest('.remove-ref-url');
            if (rmBtn) {
                const container = findRefUrlsContainer(rmBtn);
                if (!container) return;
                const row = rmBtn.closest('.input-group');
                if (row && row.parentElement === container) row.remove();
                let rows = getRowEls(container);
                if (rows.length === 0) {
                    container.appendChild(createRow(container, ''));
                }
                normalizeRows(container);
                return;
            }
        });
    })();

    // Schedule creation now uses separate page; modal trigger disabled.
    (function initScheduleTrigger(){
        const btn = document.querySelector('.btn.btn-schedule-custom');
        if (btn) {
            // Ensure no leftover modal attributes
            btn.removeAttribute('data-bs-toggle');
            btn.removeAttribute('data-bs-target');
        }
    })();


    // Schedule image input
    (function initScheduleImage(){
        const input = document.getElementById('schedule_image');
        const label = document.getElementById('scheduleImageLabel');
        const clearBtn = document.getElementById('scheduleImageClearBtn');
        if (input && label && clearBtn) setupImageInput(input, label, clearBtn);
    })();

    // Schedule reference files reuse of preview util (same look & feel as Task)
    (function initScheduleRefFiles(){
        const input = document.getElementById('schedule_reference_files');
        const preview = document.getElementById('schedule_reference_files_preview');
        if (!input || !preview) return;
        input.addEventListener('change', function(e){
            const files = Array.from(e.target.files || []);
            selectedFiles = [...selectedFiles, ...files];
            displaySelectedFiles();
            // Clear input so the same file can be chosen again if needed
            input.value = '';
        });
    })();

    // Schedule recurrence UI toggles
    (function initScheduleRecurrenceToggles(){
    const typeSel = document.getElementById('schedule_recurrence_type');
    const weekly = document.getElementById('schedule_weekly_opts');
    const monthly = document.getElementById('schedule_monthly_opts');
    const monthlyDateInput = document.getElementById('schedule_monthly_date');
    const weeklyDay = document.getElementById('schedule_recurrence_day_of_week');
    const monthlyDayHidden = document.getElementById('schedule_recurrence_day_of_month');
    const defaultDatesSection = document.getElementById('schedule_default_dates_section');
    const defaultStart = document.getElementById('schedule_start_date');
    const defaultDue = document.getElementById('schedule_due_date');
    const dueDaysWrapper = document.getElementById('schedule_due_days_wrapper');
    const dueDateWrapper = document.getElementById('schedule_due_date_wrapper');
    const dueInDaysInput = document.getElementById('schedule_due_in_days');
    // Note: monthly date input is removed; only ensure existing elements are present
    if (!typeSel || !weekly || !monthly || !weeklyDay || !monthlyDayHidden) return;
        const sync = () => {
            const v = typeSel.value;
            const isWeekly = v === 'weekly';
            const isMonthly = v === 'monthly';
            const isDaily = v === 'daily';

            // Hide/show by class to work with Bootstrap d-none
            if (isWeekly) weekly.classList.remove('d-none'); else weekly.classList.add('d-none');
            if (isMonthly) monthly.classList.remove('d-none'); else monthly.classList.add('d-none');

            // Required flags only for visible controls
            weeklyDay.required = isWeekly;
            // no separate date input for monthly now
            // Keep hidden field in sync
            // keep monthly day in sync with Start From when monthly
            try {
                const startEl = document.getElementById('schedule_recurrence_start_date');
                if (isMonthly && startEl && startEl.value) {
                    const d = new Date(startEl.value);
                    if (!isNaN(d.getTime())) monthlyDayHidden.value = String(d.getDate());
                    if (monthlyDateInput) monthlyDateInput.value = startEl.value;
                } else {
                    monthlyDayHidden.value = '';
                    if (monthlyDateInput) monthlyDateInput.value = '';
                }
            } catch(_) { monthlyDayHidden.value = ''; if (monthlyDateInput) monthlyDateInput.value = ''; }

        // Toggle default dates: show start date when a recurrence type is chosen so user can pick when the schedule starts.
            if (defaultDatesSection) {
                // Always show the container so due date can be set
                defaultDatesSection.classList.remove('d-none');
                if (defaultStart) { /* we'll control required below */ }
                if (defaultDue) { defaultDue.required = false; }

                const startWrapper = defaultStart ? defaultStart.closest('.date-form') : null;
                const dueWrapper = defaultDue ? defaultDue.closest('.date-form') : null;

                // Show start date input for daily, weekly or monthly recurrences
                if (startWrapper) {
                    if (isDaily || isWeekly || isMonthly) {
                        startWrapper.classList.remove('d-none');
                        // make start date required so recurrence has a defined start
                        if (defaultStart) defaultStart.required = true;
                    } else {
                        // hide when no recurrence selected
                        startWrapper.classList.add('d-none');
                        if (defaultStart) { defaultStart.required = false; defaultStart.value = ''; }
                    }
                }

                // For all recurrence types we prefer Due In Days input; hide legacy date field
                if (dueDaysWrapper) dueDaysWrapper.classList.remove('d-none');
                if (dueDateWrapper) dueDateWrapper.classList.add('d-none');
                if (defaultDue) defaultDue.value = '';
            }
        };
        typeSel.addEventListener('change', sync);
        // Sync monthly day-of-month from Start From
        const startEl = document.getElementById('schedule_recurrence_start_date');
        if (startEl) {
            startEl.addEventListener('change', function(){
                const type = typeSel.value;
                if (type === 'monthly' && this.value) {
                    try {
                        const d = new Date(this.value);
                        if (!isNaN(d.getTime())) monthlyDayHidden.value = String(d.getDate());
                        if (monthlyDateInput) monthlyDateInput.value = this.value;
                    } catch(_) { monthlyDayHidden.value = ''; if (monthlyDateInput) monthlyDateInput.value=''; }
                } else {
                    if (monthlyDateInput) monthlyDateInput.value = '';
                }
            });
        }
        sync();
    })();


    // Schedule executor picker (clone of task executor with different IDs)
    ;(function setupScheduleExecutorInput(){
        const input = document.getElementById('schedule_executor_input');
        const dropdown = document.getElementById('schedule_executor_dropdown');
        const selectedContainer = document.getElementById('schedule_selected_executors');
        const hiddenInput = document.getElementById('schedule_executors');
        if (!input || !dropdown || !selectedContainer || !hiddenInput) return;

        let employees = [], filtered = [], selected = [];

        function fetchEmployees(query = ''){
            fetchEmployeesForExecutorCached(query)
                .then(res => { employees = (res && (res.data || res)) || [];
                    // Exclude administrator users from executor pickers
                    employees = employees.filter(emp => String(emp.user_type || '').toUpperCase() !== 'ADMINISTRATOR');
                    filtered = employees; renderDropdown(); })
                .catch(() => { try { showFloatingAlert('Failed to load employees.', 'warning', 3000); } catch(_) {} });
        }

        function renderDropdown(){
            if (filtered.length === 0){ dropdown.innerHTML = '<div class="dropdown-item disabled">No employees found</div>'; dropdown.style.display='block'; return; }
            dropdown.innerHTML = filtered.map(emp => {
                const isChecked = selected.some(e => e.id === emp.id);
                const photoUrl = buildPhotoUrl(emp.user_photo, emp.profile_picture, emp.profile_picture_url);
        return `<label class="dropdown-item d-flex align-items-center justify-content-between" style="cursor: pointer;">
            <div class="d-flex align-items-center"><img src="${photoUrl}" class="rounded-circle me-2" style="width:30px;height:30px;object-fit:cover;" alt="${emp.name}" onerror="this.onerror=null;this.src='${appUrl}/asset/img/avatar.png'">
                <div class="d-flex flex-column">
                    <span class="executor-name">${emp.name}</span>
                    <small class="text-muted executor-division">${emp.division || emp.division_name || ''}</small>
                </div>
            </div>
                        <input type="checkbox" class="schedule-executor-checkbox" data-id="${emp.id}" data-name="${emp.name}" ${isChecked ? 'checked' : ''}>
                    </label>`;
            }).join('');
            dropdown.style.display='block';
            dropdown.querySelectorAll('.schedule-executor-checkbox').forEach(cb => {
                cb.addEventListener('change', function(){
                    const id = parseInt(this.getAttribute('data-id')); const name = this.getAttribute('data-name');
                    if (this.checked) { if (!selected.some(e => e.id === id)) selected.push({ id, name, user_photo: (employees.find(e => e.id===id)||{}).user_photo || null }); }
                    else { selected = selected.filter(e => e.id !== id); }
                    renderSelected(); updateHidden(); renderDropdown();
                });
            });
        }

        function renderSelected(){
            selectedContainer.innerHTML = '';
            selected.forEach(emp => {
                const photoUrl = buildPhotoUrl(emp.user_photo, emp.profile_picture, emp.profile_picture_url);
                const badge = document.createElement('span'); badge.className = 'badge fw-normal bg-light d-inline-flex align-items-center me-2 mb-2';
                const img = document.createElement('img'); img.src = photoUrl; img.alt = emp.name; img.className = 'rounded-circle me-2'; img.style.width='24px'; img.style.height='24px'; img.style.objectFit='cover';
                const nameSpan = document.createElement('span'); nameSpan.textContent = emp.name;
                const removeBtn = document.createElement('button'); removeBtn.type='button'; removeBtn.className='btn-close btn-sm ms-2'; removeBtn.addEventListener('click', () => { selected = selected.filter(e => e.id !== emp.id); renderSelected(); updateHidden(); renderDropdown(); });
                badge.appendChild(img); badge.appendChild(nameSpan); badge.appendChild(removeBtn); selectedContainer.appendChild(badge);
            });
        }

        function updateHidden(){ hiddenInput.value = JSON.stringify(selected.map(e => e.id)); }

        input.addEventListener('input', function(){ const q = this.value.trim(); fetchEmployees(q); });
        input.addEventListener('focus', function(){ fetchEmployees(''); });
        document.addEventListener('click', function(e){ if (!dropdown.contains(e.target) && e.target !== input) dropdown.style.display = 'none'; });
    })();

    // Removed inline schedule form submit (handled on dedicated page now)

    // Handle edit task form submission (rebuilt from scratch like add task)
    const editTaskModalEl = document.getElementById("editTaskModal");
    const editTaskForm = document.getElementById("editTaskForm");

    if (editTaskForm) {
        editTaskForm.addEventListener("submit", function (e) {
            e.preventDefault();

            const taskId = document.getElementById("edit_task_id").value;
            if (!taskId) {
                showFloatingAlert("Task ID is missing.", "warning", 3000);
                return;
            }

            if (!editTaskForm.checkValidity()) {
                e.stopPropagation();
                editTaskForm.classList.add("was-validated");
                return;
            }
            // Executor required validation (edit)
            try {
                const execHidden = document.getElementById('edit_executors');
                let execVal = execHidden ? execHidden.value : '';
                let execArr = [];
                if (execVal) { try { execArr = JSON.parse(execVal); } catch(_) { execArr = []; } }
                if (!Array.isArray(execArr) || execArr.length === 0) {
                    showFloatingAlert('Please select at least one executor.', 'warning', 2500);
                    return;
                }
            } catch(_) {}
            editTaskForm.classList.remove("was-validated");

            // Show loading overlay and disable submit button
            const loader = document.getElementById("editTaskModalLoader");
            if (loader) loader.classList.remove("d-none");
            const submitBtn = editTaskForm.querySelector(
                "button[type='submit']"
            );
            if (submitBtn) submitBtn.disabled = true;

            // Validate sizes: include edit task image and editSelectedFiles
            try {
                const imageEl = document.getElementById('edit_task_image');
                const imageFile = (imageEl && imageEl.files && imageEl.files[0]) ? imageEl.files[0] : null;
                if (imageFile && imageFile.size > MAX_IMAGE_BYTES) {
                    try { if (typeof showFloatingAlert === 'function') showFloatingAlert('Task image must be smaller than 10 MB.', 'warning'); } catch(_) { alert('Task image must be smaller than 10 MB.'); }
                    return;
                }
                const extraFiles = (window.editSelectedFiles && Array.isArray(window.editSelectedFiles)) ? window.editSelectedFiles : [];
                const totalCheck = validateTotalUploadSize({imageFile: imageFile, extraFiles: extraFiles});
                if (!totalCheck.ok) {
                    try { if (typeof showFloatingAlert === 'function') showFloatingAlert('Total upload size must be 100 MB or less.', 'warning'); } catch(_) { alert('Total upload size must be 100 MB or less.'); }
                    return;
                }
            } catch(_) {}

            const formData = new FormData(editTaskForm);
            // Add _method to FormData for Laravel PUT request
            formData.append("_method", "PUT");

            // Append all selected reference files from global array to formData
            if (
                window.editSelectedFiles &&
                window.editSelectedFiles.length > 0
            ) {
                window.editSelectedFiles.forEach((file) => {
                    formData.append("reference_files[]", file);
                });
            }

            $.ajax({
                url: appUrl + "/task/" + taskId,
                type: "POST", // Laravel expects POST with _method=PUT for PUT requests
                headers: {
                    "X-CSRF-TOKEN": document
                        .querySelector('meta[name="csrf-token"]')
                        .getAttribute("content"),
                },
                data: formData,
                processData: false,
                contentType: false,
                success: function (data) {
                    // Keep loading overlay visible for a moment to show success
                    setTimeout(() => {
                        // Hide loading overlay
                        if (loader) loader.classList.add("d-none");
                        if (submitBtn) submitBtn.disabled = false;

                // Show success floating alert instead of modal alert
                showFloatingAlert(data.message || "Task updated successfully!", "success");

                        // Reset form and preview (same as Add Task)
                        editTaskForm.reset();
                        const editImageLabel =
                            document.getElementById("editTaskImageLabel");
                        const editImageClearBtn = document.getElementById(
                            "editTaskImageClearBtn"
                        );
                        if (editImageLabel) {
                            editImageLabel.style.backgroundImage = "";
                            editImageLabel.classList.remove("has-image");
                            editImageLabel.style.opacity = "0.5";
                        }
                        if (editImageClearBtn) {
                            editImageClearBtn.classList.add("d-none");
                        }

                        // Clear selected executors
                        if (window.clearSelectedExecutorsEdit) {
                            window.clearSelectedExecutorsEdit();
                        }

                        // Clear selected files after successful update
                        window.editSelectedFiles = [];
                        displayEditSelectedFiles();

                        // Close modal after short delay to show alert and insert updated task
                        setTimeout(() => {
                            var editTaskModalInstance =
                                bootstrap.Modal.getInstance(editTaskModalEl);
                            try {
                                if (editTaskModalEl && editTaskModalEl.dataset) editTaskModalEl.dataset.allowProgrammaticClose = '1';
                            } catch(_) {}
                            if (editTaskModalInstance)
                                editTaskModalInstance.hide();
                            // Insert/refresh single updated task so client-archived tasks get restored immediately
                            try { fetchAndInsertTask(taskId); } catch(_) { fetchAndRenderTasks(); }
                        }, 1500);
                    }, 800); // Show loading for 800ms before showing success alert
                },
                error: function (xhr) {
                    // Hide loading overlay on error
                    if (loader) loader.classList.add("d-none");
                    if (submitBtn) submitBtn.disabled = false;

                    let errorMessage = "Failed to update task.";
                    if (xhr.responseJSON && xhr.responseJSON.errors) {
                        errorMessage = Object.values(xhr.responseJSON.errors)
                            .flat()
                            .join("\n");
                    } else if (xhr.responseJSON && xhr.responseJSON.message) {
                        errorMessage = xhr.responseJSON.message;
                    }
                    showFloatingAlert(errorMessage, "danger");
                },
                complete: function () {
                    // Don't hide loader here, let success/error handle it
                    // This prevents loader from disappearing too early
                },
            });
        });
    }

    // Setup image input for edit task modal
    const editTaskImageInput = document.getElementById("edit_task_image");
    const editTaskImageLabel = document.getElementById("editTaskImageLabel");
    const editTaskImageClearBtn = document.getElementById(
        "editTaskImageClearBtn"
    );

    if (editTaskImageInput && editTaskImageLabel && editTaskImageClearBtn) {
        setupImageInput(
            editTaskImageInput,
            editTaskImageLabel,
            editTaskImageClearBtn
        );
    }

    // Clear form and reset image preview when edit modal is closed
    var editTaskModalElement = document.getElementById("editTaskModal");
    if (editTaskModalElement) {
        editTaskModalElement.addEventListener("hidden.bs.modal", function () {
            $("#editTaskForm")[0].reset();

            $("#editTaskImageLabel").css(
                "background-image",
                "url('" + appUrl + "/asset/img/background/add-image.png')"
            );
            $("#editTaskImageLabel").removeClass("has-image");
            $("#editTaskImageLabel").css("opacity", "0.5");
            $("#editTaskImageClearBtn").addClass("d-none");

            // Reload projects to reset select
            loadProjects();

            // Clear selected executors display and hidden inputs
            window.clearSelectedExecutorsEdit &&
                window.clearSelectedExecutorsEdit();

            $("#editTaskAlert").addClass("d-none").hide();

            // Handle timeline modal restoration logic
            const detailEl = document.getElementById('taskDetailModal');
            if (detailEl) {
                // Clear the child opened flag
                detailEl.removeAttribute('data-child-opened');

                // Check if we should show the detail modal back
                if (detailEl.getAttribute('data-reopen-timeline') === '1') {
                    // Show detail modal back first
                    const detailModal = bootstrap.Modal.getInstance(detailEl) || new bootstrap.Modal(detailEl);
                    detailModal.show();

                    // Restore the backed up timeline handler if it exists
                    if (detailEl._timelineHiddenHandlerBackup) {
                        detailEl._timelineHiddenHandler = detailEl._timelineHiddenHandlerBackup;
                        detailEl.addEventListener('hidden.bs.modal', detailEl._timelineHiddenHandler);
                        detailEl._timelineHiddenHandlerBackup = null;
                    } else {
                        // Create fresh one-time listener to reopen timeline when detail is closed
                        const onDetailHiddenAfterEdit = function() {
                            if (detailEl.getAttribute('data-reopen-timeline') === '1') {
                                const timelineEl = document.getElementById('timelineModal');
                                if (timelineEl) {
                                    const tlInstance = bootstrap.Modal.getInstance(timelineEl) || new bootstrap.Modal(timelineEl);
                                    tlInstance.show();
                                    detailEl.removeAttribute('data-reopen-timeline');
                                }
                            }
                            // Clear the reference
                            detailEl._timelineHiddenHandler = null;
                        };

                        // Store and attach the handler
                        detailEl._timelineHiddenHandler = onDetailHiddenAfterEdit;
                        detailEl.addEventListener('hidden.bs.modal', onDetailHiddenAfterEdit, { once: true });
                    }
                } else {
                    // If not showing detail modal back, restore the backed up handler anyway
                    if (detailEl._timelineHiddenHandlerBackup) {
                        detailEl._timelineHiddenHandler = detailEl._timelineHiddenHandlerBackup;
                        detailEl.addEventListener('hidden.bs.modal', detailEl._timelineHiddenHandler);
                        detailEl._timelineHiddenHandlerBackup = null;
                    }
                }
            }
        });
    }

    // Function to setup executor input for edit modal
    function setupEditExecutorInput() {
        const input = document.getElementById("edit_executor_input");
        const dropdown = document.getElementById("edit_executor_dropdown");
        const selectedContainer = document.getElementById("edit_selected_executors");
        const hiddenInput = document.getElementById("edit_executors");

        if (!input || !dropdown || !selectedContainer || !hiddenInput) {
            return; // Elements not found, skip setup
        }

        let employees = [];
        let filteredEmployees = [];
        let selectedEmployees = [];

        function fetchEmployees(query = "") {
            return fetchEmployeesForExecutorCached(query)
                .then(function(data) {
                    employees = (data && (data.data || data)) || [];
                    employees = employees.filter(emp => String(emp.user_type || '').toUpperCase() !== 'ADMINISTRATOR');
                    filteredEmployees = employees;
                    renderDropdown();
                })
                .catch(function() {
                    try { showFloatingAlert("Failed to load employees.", "warning", 3000); } catch (_) {}
                });
        }

        function renderDropdown() {
            if (filteredEmployees.length === 0) {
                dropdown.innerHTML =
                    '<div class="dropdown-item disabled">No employees found</div>';
                dropdown.style.display = "block";
                return;
            }

            const html = filteredEmployees
                .map((emp) => {
                    const isChecked = selectedEmployees.some(e => e.id === emp.id);
                    const photoUrl = buildPhotoUrl(emp.user_photo, emp.profile_picture, emp.profile_picture_url);
                    return `
                        <label class="dropdown-item d-flex align-items-center justify-content-between" style="cursor: pointer;">
                            <div class="d-flex align-items-center">
                                <img src="${photoUrl}" alt="${emp.name}" class="rounded-circle me-2" style="width: 30px; height: 30px; object-fit: cover;">
                                <div class="d-flex flex-column">
                                    <span class="executor-name">${emp.name}</span>
                                    <small class="text-muted executor-division">${emp.division || emp.division_name || ''}</small>
                                </div>
                            </div>
                            <input type="checkbox" class="executor-checkbox" data-id="${emp.id}" data-name="${emp.name}" ${isChecked ? "checked" : ""}>
                        </label>
                    `;
                })
                .join("");
            dropdown.innerHTML = html;
            dropdown.style.display = "block";

            dropdown.querySelectorAll(".executor-checkbox").forEach((checkbox) => {
                checkbox.addEventListener("change", function () {
                    const id = parseInt(this.getAttribute("data-id"));
                    const name = this.getAttribute("data-name");
                    const employeeObj = employees.find(emp => emp.id === id);

                    if (this.checked) {
                        if (!selectedEmployees.some((e) => e.id === id)) {
                            selectedEmployees.push({
                                id,
                                name,
                                user_photo: employeeObj ? employeeObj.user_photo : null,
                                division: employeeObj ? (employeeObj.division || employeeObj.division_name || '') : ''
                            });
                        }
                    } else {
                        selectedEmployees = selectedEmployees.filter(e => e.id !== id);
                    }
                    renderSelected();
                    updateHiddenInput();
                });
            });
        }

        function renderSelected() {
            selectedContainer.innerHTML = "";
            selectedEmployees.forEach((emp) => {
                const photoUrl = buildPhotoUrl(emp.user_photo, emp.profile_picture, emp.profile_picture_url);

                const badge = document.createElement("span");
                badge.className = "badge fw-normal bg-light d-inline-flex align-items-center me-2 mb-2";

                const img = document.createElement("img");
                img.src = photoUrl;
                img.alt = emp.name;
                img.className = "rounded-circle me-2";
                img.style.width = "24px";
                img.style.height = "24px";
                img.style.objectFit = "cover";

                const nameCol = document.createElement('div');
                nameCol.className = 'd-flex flex-column';
                const nameText = document.createElement('span');
                nameText.textContent = emp.name || '';
                nameText.style.marginBottom = "5px";

                const divSmall = document.createElement('small');
                divSmall.className = 'text-muted executor-division';
                divSmall.textContent = emp.division || '';

                nameCol.appendChild(nameText);
                nameCol.appendChild(divSmall);

                const removeBtn = document.createElement("button");
                removeBtn.type = "button";
                removeBtn.className = "btn-close btn-sm ms-2";
                removeBtn.setAttribute("aria-label", "Remove");
                removeBtn.addEventListener("click", () => {
                    selectedEmployees = selectedEmployees.filter(e => e.id !== emp.id);
                    renderSelected();
                    updateHiddenInput();
                    renderDropdown();
                });

                badge.appendChild(img);
                badge.appendChild(nameCol);
                badge.appendChild(removeBtn);
                selectedContainer.appendChild(badge);
            });
        }

        function updateHiddenInput() {
            hiddenInput.value = JSON.stringify(selectedEmployees.map(e => e.id));
        }

        function filterEmployees(value) {
            const val = value.trim().toLowerCase();
            filteredEmployees = val === ""
                ? employees
                : employees.filter(emp => emp.name.toLowerCase().includes(val));
            renderDropdown();
        }

        input.addEventListener("input", function () {
            filterEmployees(this.value);
        });

        input.addEventListener("focus", function () {
            filterEmployees(this.value);
        });

        document.addEventListener("click", function (e) {
            if (!input.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = "none";
            }
        });

        fetchEmployees();

        window.clearSelectedExecutorsEdit = function () {
            selectedEmployees = [];
            renderSelected();
            updateHiddenInput();
            dropdown.style.display = "none";
            input.value = "";
        };

        window.setSelectedExecutorsEdit = async function (executors) {
            try {
                // Fetch all employees to get divisions
                const data = await fetchEmployeesForExecutorCached("");
                employees = (data && (data.data || data)) || [];
                employees = employees.filter(emp => String(emp.user_type || '').toUpperCase() !== 'ADMINISTRATOR');
            } catch (e) {
                console.warn("Gagal ambil data employee:", e);
            }

            selectedEmployees = executors.map((ex) => {
                let photoUrl = "";
                let userPhoto = ex.user_photo;
                if (userPhoto) {
                    if (userPhoto.startsWith("http")) {
                        photoUrl = userPhoto;
                    } else if (
                        userPhoto.startsWith("/file/photo") ||
                        userPhoto.startsWith("/file/profile_picture")
                    ) {
                        photoUrl = appUrl + userPhoto;
                    } else if (
                        userPhoto.startsWith("file/photo") ||
                        userPhoto.startsWith("file/profile_picture")
                    ) {
                        photoUrl = appUrl + "/" + userPhoto;
                    } else {
                        photoUrl = appUrl + "/file/profile_picture/" + userPhoto;
                    }
                } else {
                    photoUrl = appUrl + "/asset/img/avatar.png";
                }

                // Cari division dari list employees
                let divisionName = "";
                const empData = employees.find(e => e.id === ex.id);
                if (empData) {
                    divisionName = empData.division || empData.division_name || "";
                }

                return {
                    id: ex.id,
                    name: ex.name,
                    user_photo: photoUrl,
                    division: divisionName
                };
            });

            renderSelected();
            updateHiddenInput();
        };
    }


document.addEventListener("click", function (e) {
    if (e.target && e.target.classList.contains("arrow-forward-icon")) {
        // Ensure any visible tooltips are hidden and disposed before we move/remove the card.
        try { hideAllFloatingTooltips(); } catch(_) {}
        const taskId = e.target.getAttribute("data-task-id");
        const currentStatus = e.target.getAttribute("data-task-status");
        if (!taskId) { showFloatingAlert("Task ID not found.", "warning", 3000); return; }
        let nextStatus = '';
        if (currentStatus === 'new_request' || currentStatus === 'new request') {
            nextStatus = 'in_progress';
        } else if (currentStatus === 'in_progress' || currentStatus === 'in progress') {
            nextStatus = 'completed';
        } else if (currentStatus === 'rejected') {
            nextStatus = 'completed';
        }
        if (nextStatus) {
            const taskCard = document.querySelector(`.custom-card[data-task-id="${taskId}"]`);
            // If the destination is completed, show confirmation modal to collect
            // complete_note (Quill), complete_urls and complete_files first.
            if (String(nextStatus).toLowerCase() === 'completed') {
                try { showConfirmationToCompleteModal(taskId, taskCard); } catch (err) { console.error(err); updateTaskStatus(taskId, nextStatus, taskCard); }
            } else {
                updateTaskStatus(taskId, nextStatus, taskCard);
            }
        }
    }
});

// Show modal to collect completion note/urls/files before marking completed
function showConfirmationToCompleteModal(taskId, taskCard) {
    $.ajax({ url: appUrl + '/task/' + taskId, type: 'GET', dataType: 'json' })
    .done(function(res){
        const t = (res && (res.data || res)) || {};
        const modalId = 'confirmation-to-complete';
        try { const existing = document.getElementById(modalId); if (existing) existing.remove(); } catch(_){}
        const modalHtml = `
        <div class="modal fade" id="${modalId}" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content modal-content-custom">
                    <div class="modal-loading-overlay d-none" id="confirmationToCompleteLoader">
                        <div class="loader-spinner"></div>
                    </div>
                    <div class="modal-header modal-header-custom">
                        <h5 class="modal-title modal-title-custom" id="${modalId}Label">Complete Task</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <form id="confirmationToCompleteForm" enctype="multipart/form-data">
                        <div class="modal-body modal-body-custom">
                            <div class="mb-3 custom-input">
                                <label class="form-label label-custom">Complete Note (required)</label>
                                <div id="complete_note_editor" style="min-height:120px; background:#fff; border:1px solid #e3e6ee; border-radius:6px;"></div>
                                <textarea class="form-control input-text d-none" id="complete_note" name="complete_note" rows="4"></textarea>
                            </div>
                            <div class="mb-3 custom-input">
                                <label class="form-label label-custom">Complete URLs (optional)</label>
                                <div id="complete_reference_urls_container" class="d-flex flex-column gap-2">
                                    <div class="input-group">
                                        <input type="url" name="complete_urls[]" placeholder="https://example.com" class="form-control input-text">
                                        <button type="button" class="btn btn-submit-black add-ref-url" aria-label="Add URL">
                                            <span class="material-symbols-outlined">add</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div class="mb-3 custom-input">
                                <label class="form-label label-custom" for="complete_files">Complete Files (optional)</label>
                                <input type="file" class="form-control input-text" id="complete_files" name="complete_files[]" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip" multiple>
                                <div class="form-text">Multiple files supported.</div>
                                <div id="complete_files_preview" class="mt-2"></div>
                            </div>
                        </div>
                        <div class="modal-footer modal-footer-custom">
                            <button type="button" class="btn btn-custom-close" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-submit-black" id="confirmCompleteBtn">Submit</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const mEl = document.getElementById(modalId);
        const modal = new bootstrap.Modal(mEl);
        modal.show();
        mEl.addEventListener('hidden.bs.modal', function onHide(){ mEl.removeEventListener('hidden.bs.modal', onHide); try { mEl.remove(); } catch(_){} });
        window.__quillComplete = new Quill('#complete_note_editor', { theme: 'snow', modules: { toolbar: false } });
        mEl.addEventListener('click', function(ev){
            const addBtn = ev.target.closest('.add-ref-url');
            if (addBtn) {
                const container = document.getElementById('complete_reference_urls_container');
                if (!container) return;
                const row = document.createElement('div');
                row.className = 'input-group';
                const input = document.createElement('input'); input.type = 'url'; input.name = 'complete_urls[]'; input.placeholder = 'https://example.com'; input.className = 'form-control input-text';
                const rm = document.createElement('button'); rm.type = 'button'; rm.className = 'btn btn-remove-url remove-ref-url'; rm.innerHTML = '<span class="material-symbols-outlined">close</span>';
                row.appendChild(input); row.appendChild(rm);
                addBtn.closest('.input-group').after(row);
                return;
            }
            const rmBtn = ev.target.closest('.remove-ref-url');
            if (rmBtn) {
                const row = rmBtn.closest('.input-group'); if (row) row.remove();
                return;
            }
        });

        const fileInput = mEl.querySelector('#complete_files');
        const preview = mEl.querySelector('#complete_files_preview');
        const submitBtn = mEl.querySelector('#confirmCompleteBtn');
        let selectedFiles = [];

        if (fileInput && preview) {
            fileInput.addEventListener('change', function (e) {
                const newFiles = Array.from(e.target.files || []);
                selectedFiles = selectedFiles.concat(newFiles);
                renderFilePreview();
                fileInput.value = '';
            });

            function renderFilePreview() {
                preview.innerHTML = '';
                if (!selectedFiles.length) {
                    preview.innerHTML = '<div class="text-muted small"><em>No files selected</em></div>';
                    return;
                }
                selectedFiles.forEach((file, idx) => {
                    const div = document.createElement('div');
                    div.className = 'd-flex align-items-center justify-content-between bg-light rounded px-2 py-1 mb-1';
                    div.style.fontSize = '12px';
                    div.innerHTML = `
                        <div class="text-truncate me-2">
                            ${escapeHtml(file.name)} 
                            <small class="text-muted">(${formatBytes(file.size)})</small>
                        </div>
                        <button type="button" class="btn btn-sm btn-link text-secondary p-0 remove-file" data-index="${idx}">
                            <span class="material-symbols-outlined" style="font-size:16px;">close</span>
                        </button>
                    `;
                    preview.appendChild(div);
                });
                preview.querySelectorAll('.remove-file').forEach(btn => {
                    btn.addEventListener('click', function () {
                        const idx = parseInt(this.dataset.index);
                        selectedFiles.splice(idx, 1);
                        renderFilePreview();
                    });
                });
            }

            submitBtn.addEventListener('click', function () {
                let noteHtml = '';
                try { noteHtml = (window.__quillComplete && typeof window.__quillComplete.root !== 'undefined') ? window.__quillComplete.root.innerHTML.trim() : ''; } catch(_) { noteHtml = ''; }
                const plain = (noteHtml || '').replace(/<(.|\n)*?>/g, '').trim();
                if (!plain) {
                    showFloatingAlert('Complete note is required.', 'warning');
                    try { window.__quillComplete.focus(); } catch(_){}
                    return;
                }
                submitBtn.disabled = true; submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Submitting...';
                const fd = new FormData();
                fd.append('_method','PUT');
                fd.append('status','completed');
                fd.append('complete_note', noteHtml);
                const urlInputs = Array.from(mEl.querySelectorAll('input[name="complete_urls[]"]'));
                const urls = urlInputs.map(i => (i.value||'').trim()).filter(Boolean);
                if (urls.length) fd.append('complete_urls', JSON.stringify(urls));
                selectedFiles.forEach(f => fd.append('complete_files[]', f));
                fetch(appUrl + '/task/' + taskId + '/status', {
                    method: 'POST',
                    headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content') },
                    body: fd,
                    credentials: 'same-origin'
                }).then(function(r){
                    return r.ok ? r.json() : r.json().then(Promise.reject);
                }).then(function(json){
                    try { modal.hide(); } catch(_){}
                    try { showFloatingAlert(json.message || 'Task marked as completed.', 'success'); } catch(_){}
                    try { if (taskCard && taskCard.parentNode) taskCard.parentNode.removeChild(taskCard); } catch(_){}
                    try { fetchAndInsertTask(taskId); } catch(_) { try { fetchAndRenderTasks(); } catch(_){} }
                }).catch(function(err){
                    let msg = 'Failed to mark task as completed.';
                    try { if (err && err.message) msg = err.message; } catch(_){}
                    showFloatingAlert(msg, 'danger');
                }).finally(function(){ submitBtn.disabled = false; submitBtn.innerHTML = 'Submit'; });
            });
        }
    }).fail(function(){
        showFloatingAlert('Failed to load task details.', 'danger');
    });
}

// small helpers used in modal
function escapeHtml(s){ return String(s||'').replace(/[&<>"]+/g, function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m])||m; }); }
function formatBytes(bytes){ if (!bytes) return '0 B'; const sizes=['B','KB','MB','GB','TB']; const i=Math.floor(Math.log(bytes)/Math.log(1024)); return (bytes/Math.pow(1024,i)).toFixed(i?1:0)+' '+sizes[i]; }

// (Removed duplicate early updateTaskStatus; using unified bulk-aware version later)

    // Function to check if all executors have accepted the task
    function hasAllExecutorsAccepted(task) {
        // Always return true to show task cards regardless of executor acceptance status
        return true;
    }

    // Function to create task card HTML
    // Ensure client-side archive buffer exists (global map of id -> task)
    window.__clientArchivedTasks = window.__clientArchivedTasks || new Map();

    // Global date parse helper (safe)
    function __parseDateForCompareGlobal(d) {
        if (!d) return null;
        try {
            const dt = new Date(d);
            if (isNaN(dt.getTime())) return null;
            return dt;
        } catch (e) { return null; }
    }

    // Global helper to check if a task with status completed is older than `days`
    function __isCompletedOlderThanDaysGlobal(task, days) {
        try {
            if (!task) return false;
            const status = String(task.status || '').toLowerCase();
            if (!status.includes('completed')) return false;
            const d = __parseDateForCompareGlobal(task.complete_date || task.updated_at || task.updatedAt || null);
            if (!d) return false;
            const now = new Date();
            const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
            return diffDays > Number(days);
        } catch (e) { return false; }
    }

    function createTaskCard(task) {
        let inArchiveRender = !!(window.__renderingArchiveModal);
        try {
            if (!inArchiveRender && __isCompletedOlderThanDaysGlobal(task, 90)) {
                const idKey = String(task.id || task.task_id || '');
                if (idKey) {
                    const normalized = Object.assign({}, task, { status: task.status || 'completed' });
                    window.__clientArchivedTasks = window.__clientArchivedTasks || new Map();
                    window.__clientArchivedTasks.set(idKey, normalized);
                    console.debug('[archive-client] createTaskCard suppressed rendering for archived task id:', idKey);
                }
                return '';
            }
        } catch(_) {}

        function buildProjectInitialsAvatar(title) {
            const text = (title || '').trim();
            if (!text) return 'NA';
            const parts = text.split(/\s+/).filter(Boolean);
            if (parts.length === 1) {
                return parts[0].substring(0,2).toUpperCase();
            }
            const first = parts[0].charAt(0);
            const last = parts[parts.length - 1].charAt(0);
            return (first + last).toUpperCase();
        }

        function pickAvatarColor(key) {
            const colors = [
                '#6A5AE0', '#FF8A3C', '#00A881', '#D4526E', '#3E8EDE',
                '#546E7A', '#8E44AD', '#2E7D32', '#AD1457', '#EF6C00'
            ];
            if (!key) return colors[0];
            let hash = 0;
            for (let i=0;i<key.length;i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
            return colors[hash % colors.length];
        }

        const projectImg = (function() {
            try {
                const raw = (task && task.project_image);
                if (!raw) return null;
                const val = String(raw || '').trim();
                if (!val || val.toLowerCase() === 'null' || val.toLowerCase() === 'undefined') {
                    return null;
                }
                if (/^https?:\/\//i.test(val)) return val;
                if (val.includes('/file/project/')) {
                    const fname = val.split('/file/project/').pop().split(/[?#]/)[0];
                    if (!fname) return null;
                    return `${appUrl}/file/project/${fname}`;
                }
                if (val.includes('/asset/')) {
                    const suffix = val.split('/asset/').pop().replace(/^\/+/, '');
                    return `${appUrl}/asset/${suffix}`;
                }
                if (val.startsWith('/asset/')) {
                    const suffix = val.replace(/^\/+/, '');
                    return `${appUrl}/${suffix}`;
                }
                if (val.startsWith('/')) {
                    return `${appUrl}${val}`;
                }
                if (!/^https?:\/\//i.test(val) && !val.startsWith('/')) {
                    return `${appUrl}/file/project/${val}`;
                }
                return val;
            } catch(_) { return null; }
        })();

        const avatarTitle = (function() {
            const taskTitle = (task.title || '').trim();
            const projTitle = (task.project_title || '').trim();
            const placeholderRegex = /^(no project|no|none|null|n\/a|na)$/i;
            if (taskTitle && !placeholderRegex.test(taskTitle)) return taskTitle;
            if (projTitle && !placeholderRegex.test(projTitle)) return projTitle;
            return taskTitle || projTitle || 'NA';
        })();

        const useInitials = !projectImg;
        const initials = useInitials ? buildProjectInitialsAvatar(avatarTitle) : '';
        const initialsColor = useInitials ? pickAvatarColor(avatarTitle || initials) : '#6A5AE0';

        const allExecutors = [];
        if (task.pic) {
            allExecutors.push(task.pic);
        }
        const acceptedExecutors = (task.executors || []).filter(ex => ex && (ex.is_receive === true || ex.is_receive === 1));
        acceptedExecutors.forEach((executor) => {
            if (!allExecutors.some(e => e && e.id === executor.id)) {
                allExecutors.push(executor);
            }
        });

        const executorsHtml = allExecutors
            .map((executor, index) => {
                const fallbackAvatar = `${appUrl}/asset/img/avatar.png`;
                const overlapClass = index === 0 ? "" : "executor-image-overlap";
                const zIndexStyle = `style="z-index: ${index + 1};"`;
                const isPic = task.pic && executor && task.pic.id === executor.id;
                // Tooltip should only show employee name (remove role label)
                const tooltipTitle = `${executor.name}`;
                let imgSrc = (executor && executor.image) ? String(executor.image).trim() : '';
                if (!imgSrc || imgSrc.toLowerCase() === 'null' || imgSrc.toLowerCase() === 'undefined') {
                    imgSrc = fallbackAvatar;
                } else {
                    if (!/^https?:\/\//i.test(imgSrc)) {
                        if (imgSrc.startsWith('/')) imgSrc = appUrl + imgSrc;
                        else if (imgSrc.indexOf('/') !== -1) imgSrc = appUrl + '/' + imgSrc;
                        else imgSrc = appUrl + '/file/profile_picture/' + imgSrc;
                    }
                }
                return `
                <div class="executor-container" style="position: relative; display: inline-block; margin-right: -8px;">
                    <img src="${imgSrc}" alt="${executor.name}" class="pic-executor-image ${overlapClass}" data-bs-toggle="tooltip" title="${tooltipTitle}" ${zIndexStyle} onerror="this.onerror=null;this.src='${fallbackAvatar}';">
                </div>
                `;
            })
            .join("");

        let statusMenuItem = '';
        if (task.status === 'new_request' || task.status === 'new request') {
            statusMenuItem = '<div class="dropdown-item progress-task">Progress</div>';
        } else if (task.status === 'in_progress' || task.status === 'in progress') {
            statusMenuItem = '<div class="dropdown-item complete-task">Set to Complete</div><div class="dropdown-item back-to-request">Back to Request</div>';
        } else if (task.status === 'completed') {
            statusMenuItem = '<div class="dropdown-item reject-task">Reject</div>';
        } else if (task.status === 'rejected') {
            statusMenuItem = '<div class="dropdown-item complete-task">Set to Complete</div>';
        }

        const showDelete = (function(){
            // Only show delete if current employee is the PIC
            try {
                const empId = (document.getElementById('taskFeedbackModal')?.dataset?.employeeId) || null;
                const picId = task?.pic?.id ? String(task.pic.id) : null;
                if (!empId || !picId) return false;
                return String(empId) === picId;
            } catch(_) { return false; }
        })();

        let statusBadge = '';
        if (task.status === 'rejected') {
            statusBadge = `
                <div class="d-flex justify-content-end mt-1">
                    <span class="badge bg-danger" style="font-size:10px; font-weight:500; color:#fff;">
                        Rejected
                    </span>
                </div>
            `;
        }

        let iconHtml = '';
        if (task.status !== 'completed') {
            if (task.status === 'in_progress' || task.status === 'in progress' || task.status === 'rejected') {
                iconHtml = `<span class="material-symbols-outlined arrow-forward-icon mt-2 mx-3"
                    data-bs-toggle="tooltip"
                    data-bs-placement="top"
                    data-task-id="${task.id}"
                    data-task-status="${task.status}"
                    title="Set to Complete"
                    style="cursor: pointer;">
                    check
                </span>`;
            } else if (task.status === 'new_request' || task.status === 'new request') {
                iconHtml = `<span class="material-symbols-outlined arrow-forward-icon mt-2 mx-3"
                    data-bs-toggle="tooltip"
                    data-bs-placement="top"
                    data-task-id="${task.id}"
                    data-task-status="${task.status}"
                    title="Progress"
                    style="cursor: pointer;">
                    arrow_right_alt
                </span>`;
            }
        }

    const viewerPending = isViewerPendingExecutor(task);
        if (viewerPending) {
            iconHtml = '';
        }

        const viewerIsPic = (function(){
            try { return !!(currentEmployeeId && task.pic && String(task.pic.id) === String(currentEmployeeId)); } catch(_) { return false; }
        })();
        const viewerIsExecutor = (function(){
            try { return !!(currentEmployeeId && Array.isArray(task.executors) && task.executors.some(ex => String(ex.id) === String(currentEmployeeId))); } catch(_) { return false; }
        })();

        // determine if current viewer is the project author (project author is set in project_detail.js)
        const viewerIsProjectAuthor = (function(){
            try {
                var pa = window.__projectAuthorId || null;
                return !!(pa && currentEmployeeId && String(pa) === String(currentEmployeeId));
            } catch(_) { return false; }
        })();

        // Show the dropdown when the viewer is the PIC (and not pending executor) OR when the viewer is the project author.
        // Executors (non-PIC) will not see the dropdown unless they are the project author.
        const shouldShowDropdown = !!((viewerIsPic && !viewerPending) || viewerIsProjectAuthor);

        // If dropdown isn't shown, make sure the arrow icon aligns to the right on THIS card only
        if (iconHtml && !shouldShowDropdown) {
            iconHtml = iconHtml.replace('style="cursor: pointer;"', 'style="cursor: pointer; right: 0;"');
        }

        const dropdownHtml = `
            <div class="dropdown-icon-container${shouldShowDropdown ? '' : ' d-none'}">
                <span class="material-symbols-outlined dropdown-icon mt-2 mx-2" tabindex="0">more_vert</span>
                <div class="dropdown-menu d-none">
                    <div class="dropdown-item">Detail</div>
                    <div class="dropdown-item">Edit</div>
                    <div class="dropdown-item">Feedback</div>
                    ${statusMenuItem}
                    ${showDelete ? '<div class="dropdown-item cancel-task">Cancel</div>' : ''}
                    ${showDelete ? '<div class="dropdown-item delete-task">Delete</div>' : ''}
                </div>
            </div>
        `;

        if (task.status === 'finished') {
            const dropdownHtmlFinal = viewerIsPic ? dropdownHtml : '';

            return `
            <div class="custom-card mb-3 rounded-4 position-relative" data-task-id="${task.id}" data-task-status="${task.status}" style="cursor: default;" id="custom-card">
                ${dropdownHtmlFinal}
                <div class="d-flex align-items-center mb-2 mt-2">
                    ${(function(){
                        const showInitials = !projectImg;
                        const avatarHtml = showInitials
                            ? `<div class="project-initial-avatar me-3" style="width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:11px;color:#fff;background:${initialsColor};">${buildProjectInitialsAvatar(avatarTitle)}</div>`
                            : `<img src="${projectImg}" alt="Project Image" class="project-image me-3" style="width:34px;height:34px;object-fit:cover;" onerror="this.onerror=null; this.src='${appUrl}/asset/img/avatar.png'">`;
                        return avatarHtml;
                    })()}
                    <div class="d-flex flex-column">
                        ${task.project_id ? `<small class="text-muted" style="line-height:1; font-size: 10px;">${task.project_title}</small>` : ''}
                        <h5 class="mb-0 task-title" style="line-height:1.2;">${task.title}</h5>
                    </div>
                </div>
                <div class="task-description-container">
                    <p class="task-description" data-full-description="${task.description}">
                        ${task.description ? task.description : ''}
                    </p>
                </div>
                <div class="d-flex align-items-center justify-content-between mt-1">
                    <div style="font-size: 8px; font-weight: 400;">
                        <span style="color: #797E91;">Priority: </span>
                        <span style="font-size: 8px; color: ${task.priority === 'HIGH' ? 'red' : '#4B4F5E'}">${task.priority}</span>
                    </div>
                </div>
                <hr class="task-separator rounded-4">
                <div class="d-flex justify-content-between align-items-center" style="font-size:8px; color:#797E91;">
                    <div>Finish at: <span style="color: #797E91; font-size: 8px;">${formatDateTimeENMedium(task.finished_date)}</span></div>

                    <div class="d-flex align-items-center gap-2">
                        <div class="d-flex align-items-center position-relative"
                            data-bs-toggle="modal" data-bs-target="#completedModal" style="cursor:pointer;">
                            <span class="material-symbols-outlined task-icon playlist_add_check"
                                data-task-id="${task.id}" style="color: #797E91; font-size: 18px;">
                                playlist_add_check
                            </span>
                            <span class="unread-badge position-absolute top-0 start-100 translate-middle d-none" data-task-id="${task.id}"></span>
                        </div>

                        <div class="d-flex align-items-center position-relative">
                            <span class="material-symbols-outlined task-icon mode_comment" data-task-id="${task.id}" style="font-size:18px; cursor: pointer;">mode_comment</span>
                            ${task.feedback_comments_count > 0 ? `<span class="feedback-comments-count ms-1" style="color: #797E91; font-size: 11px;">${task.feedback_comments_count}</span>` : ""}
                            <span class="unread-badge position-absolute top-0 start-100 translate-middle d-none" data-task-id="${task.id}"></span>
                        </div>

                        <div class="d-flex align-items-center">
                            <span class="material-symbols-outlined task-icon" style="font-size:18px; cursor: pointer;">attach_file</span>
                            ${task.reference_files_count > 0 ? `<span class="reference-files-count ms-1" style="color: #797E91; font-size: 11px;">${task.reference_files_count}</span>` : ""}
                        </div>
                    </div>
                </div>
            </div>`;
        }

        
        if (task.status === 'completed') {
            let completedBy = '-';

            if(task.status_change) {
                completedBy = task.status_change.employee_name;
            }

            const dropdownHtmlFinal = viewerIsPic ? dropdownHtml : '';

            return `
            <div class="custom-card mb-3 rounded-4 position-relative" data-task-id="${task.id}" data-task-status="${task.status}" style="cursor: default;" id="custom-card">
                ${dropdownHtmlFinal}
                <div class="d-flex align-items-center mb-2 mt-2">
                    ${(function(){
                        const showInitials = !projectImg;
                        const avatarHtml = showInitials
                            ? `<div class="project-initial-avatar me-3" style="width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:11px;color:#fff;background:${initialsColor};">${buildProjectInitialsAvatar(avatarTitle)}</div>`
                            : `<img src="${projectImg}" alt="Project Image" class="project-image me-3" style="width:34px;height:34px;object-fit:cover;" onerror="this.onerror=null; this.src='${appUrl}/asset/img/avatar.png'">`;
                        return avatarHtml;
                    })()}
                    <div class="d-flex flex-column">
                        ${task.project_id ? `<small class="text-muted" style="line-height:1; font-size: 10px;">${task.project_title}</small>` : ''}
                        <h5 class="mb-0 task-title" style="line-height:1.2;">${task.title}</h5>
                    </div>
                </div>
                <div class="task-description-container">
                    <p class="task-description" data-full-description="${task.description}">
                        ${task.description ? task.description : ''}
                    </p>
                </div>
                <div class="d-flex align-items-center justify-content-between mt-1">
                    <div style="font-size: 8px; font-weight: 400;">
                        <span style="color: #797E91;">Priority: </span>
                        <span style="font-size: 8px; color: ${task.priority === 'HIGH' ? 'red' : '#454545'}">${task.priority}</span>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                        <div class="d-flex align-items-center position-relative">
                            <span class="material-symbols-outlined task-icon mode_comment" data-task-id="${task.id}" style="font-size:18px; cursor: pointer;">mode_comment</span>
                            ${task.feedback_comments_count > 0 ? `<span class="feedback-comments-count ms-1" style="color: #797E91; font-size: 11px;">${task.feedback_comments_count}</span>` : ""}
                            <span class="unread-badge position-absolute top-0 start-100 translate-middle d-none" data-task-id="${task.id}"></span>
                        </div>
                        <div class="d-flex align-items-center">
                            <span class="material-symbols-outlined task-icon" style="font-size:18px; cursor: pointer;">attach_file</span>
                            ${task.reference_files_count > 0 ? `<span class="reference-files-count ms-1" style="color: #797E91; font-size: 11px;">${task.reference_files_count}</span>` : ""}
                        </div>
                    </div>
                </div>
                <hr class="task-separator rounded-4">
                <div class="complete-note-container" 
                    style="max-height: 3.6em; overflow-y: auto; font-size:12px; color: #4C5060;">
                    ${task.complete_note || '<i>No completion note provided.</i>'}
                </div>
                
                <div class="d-flex justify-content-between align-items-center mt-3" style="font-size:8px; color:#797E91;">
                    <div>Complete by: <span style="color: #797E91; font-size: 8px;">${completedBy}</span></div>
                    <div>at: <span style="color: #797E91; font-size: 8px;">${formatDateTimeENMedium(task.complete_date)}</span></div>
                </div>
                ${
                (() => {
                    let html = `
                    <div class="d-flex align-items-center w-100 justify-content-between mt-3 gap-2">
                    `;

                    if (viewerIsPic) {
                        html += `
                        <div class="d-flex align-items-center">
                            <button class="btn btn-sm btn-approve-complete me-2" data-task-id="${task.id}">
                                Approve
                            </button>
                            <button class="btn btn-sm btn-reject-complete" data-task-id="${task.id}">
                                Reject
                            </button>
                        </div>
                        `;
                    } else {
                        html += `<div></div>`;
                    }

                    html += `
                        <div class="d-flex justify-content-end align-items-center ms-auto">
                            <div class="btn-attach-file-wrapper d-flex align-items-center position-relative"
                                data-bs-toggle="modal" data-bs-target="#completedModal" style="cursor:pointer;">
                                <span class="material-symbols-outlined task-icon playlist_add_check"
                                    data-task-id="${task.id}" 
                                    style="color: #797E91; font-size: 24px;">
                                    playlist_add_check
                                </span>
                                <span class="unread-badge position-absolute top-0 start-100 translate-middle d-none" 
                                    data-task-id="${task.id}">
                                </span>
                            </div>
                        </div>
                    </div>
                    `;
                    return html;
                })()
                }

            </div>`;
        }

    return `
        <div class="custom-card mb-3 rounded-4 position-relative${viewerPending ? ' pending-executor-card' : ''}" data-task-id="${task.id}" data-task-status="${task.status}" style="${inArchiveRender ? 'cursor: default;' : 'cursor: grab;'}" id="custom-card">
                ${dropdownHtml}
                ${iconHtml}

                <div class="d-flex align-items-center mb-2 mt-2">
                    ${(function(){
                        const showInitials = !projectImg;
                        const viewerPendingLocal = isViewerPendingExecutor(task);
                        const selectable = viewerPendingLocal || task.status === 'new_request' || task.status === 'new request';
                        const avatarHtml = showInitials
                            ? `<div class="project-initial-avatar${selectable ? '' : ' me-3'}" style="width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:11px;color:#fff;background:${initialsColor};">${buildProjectInitialsAvatar(avatarTitle)}</div>`
                            : `<img src="${projectImg}" alt="Project Image" class="project-image${selectable ? '' : ' me-3'}" style="width:34px;height:34px;object-fit:cover;" onerror="this.onerror=null; this.src='${appUrl}/asset/img/avatar.png'">`;
                        if (selectable) {
                            return `<div class="task-selectable-thumb me-3" data-task-id="${task.id}" data-pending="${viewerPendingLocal ? '1' : '0'}">
                                ${avatarHtml}
                                <span class="thumb-check"><span class="material-symbols-outlined">check</span></span>
                            </div>`;
                        }
                        return avatarHtml;
                    })()}
                    <div class="d-flex flex-column">
                        ${task.project_id ? `<small class="text-muted" style="line-height:1; font-size: 10px;">${task.project_title} </small>` : ''}
                        <h5 class="mb-0 task-title" style="line-height:1.2;">${task.title}</h5>
                    </div>
                </div>
                <div class="task-description-container mb-1">
                    <p class="task-description" data-full-description="${task.description}">
                        ${task.description ? task.description : ''}
                    </p>
                </div>
                ${statusBadge || ''} 
                <hr class="task-separator rounded-4">
                <div class="d-flex justify-content-between align-items-center">
                    <div style="font-size: 10px; font-weight: 400; display:flex; flex-direction:column;">
                        <div>
                            <span style="color: #797E91;">Priority: </span>
                            <span style="color: ${task.priority === 'HIGH' ? 'red' : '#4B4F5E'}">
                                ${task.priority}
                            </span>
                        </div>
                        ${''}
                    </div>
                    <div style="font-size: 10px; font-weight: 400;">
                        <span style="color: #4B4F5E">
                            ${formatDateENMedium(task.start_date)} - ${formatDateENMedium(task.due_date)}
                        </span>
                    </div>
                </div>
                <div class="d-flex justify-content-between align-items-center mt-3">
                        ${viewerPending
                                            ? `
                                            <div class="d-flex align-items-center w-100 justify-content-between gap-1">
                                                <button class="btn btn-secondary btn-cancel-invite" data-task-id="${task.id}" style="flex:1 1 0;">Reject</button>
                                                <button class="btn btn-submit-black btn-accept-invite" data-task-id="${task.id}" style="padding:8px 12px; font-size:12px; flex:1 1 0;">
                                                    Accept Task
                                                </button>
                                            </div>
                                            `
                                        : (
                                            // Special case: PIC viewing a Completed task should be able to Approve or Reject the completion
                                            (viewerIsPic && (String(task.status).toLowerCase() === 'completed'))
                                            ? `
                                                <div class="d-flex align-items-center w-100 justify-content-between gap-1">
                                                    <button class="btn btn-secondary btn-reject-complete" data-task-id="${task.id}" style="height: 40px; font-size: 12px; flex:1 1 0;">Reject</button>
                                                    <button class="btn btn-submit-black btn-approve-complete" data-task-id="${task.id}" style="height: 40px; font-size:12px; flex:1 1 0;">
                                                        Approve Task
                                                    </button>
                                                </div>
                                              `
                                            : `
                        <div class="d-flex align-items-center pic-executor-container">${executorsHtml}</div>
                        <div class="d-flex align-items-center">
                            <div class="latest-feedback-snippet d-none align-items-center me-1" data-task-id="${task.id}" style="cursor:pointer; max-width: 160px;">
                                <img class="latest-feedback-avatar rounded-circle me-1" src="" alt="avatar" width="20" height="20" style="object-fit:cover;">
                                <span class="latest-feedback-text text-truncate" style="max-width: 130px; font-size: 11px; color:#4B4F5E;"></span>
                            </div>
                            ${task.status === 'completed'
                                ? `
                                <div class="btn-attach-file-wrapper d-flex align-items-center ms-2 position-relative"
                                    data-bs-toggle="modal"
                                    data-bs-target="#completedModal">
                                    <span class="material-symbols-outlined task-icon playlist_add_check" data-task-id="${task.id}" style="color: #797E91; font-size: 25px;">
                                        playlist_add_check
                                    </span>
                                    <span class="unread-badge position-absolute top-0 start-100 translate-middle d-none" data-task-id="${task.id}"></span>
                                </div>
                                <div class="btn-attach-file-wrapper d-flex align-items-center ms-3 position-relative">
                                    <span class="material-symbols-outlined task-icon mode_comment" data-task-id="${task.id}">mode_comment</span>
                                    ${task.feedback_comments_count > 0 ? `<span class="feedback-comments-count ms-1" style="color: #797E91; font-size: 12px;">${task.feedback_comments_count}</span>` : ""}
                                    <span class="unread-badge position-absolute top-0 start-100 translate-middle d-none" data-task-id="${task.id}"></span>
                                </div>
                                <div class="btn-attach-file-wrapper d-flex align-items-center ms-3">
                                    <span class="material-symbols-outlined task-icon">attach_file</span>
                                    ${task.reference_files_count > 0 ? `<span class="reference-files-count ms-1" style="color: #797E91; font-size: 12px;">${task.reference_files_count}</span>` : ""}
                                </div>
                                `
                                : `
                                <div class="btn-attach-file-wrapper d-flex align-items-center ms-3 position-relative">
                                    <span class="material-symbols-outlined task-icon mode_comment" data-task-id="${task.id}">mode_comment</span>
                                    ${task.feedback_comments_count > 0 ? `<span class="feedback-comments-count ms-1" style="color: #797E91; font-size: 12px;">${task.feedback_comments_count}</span>` : ""}
                                    <span class="unread-badge position-absolute top-0 start-100 translate-middle d-none" data-task-id="${task.id}"></span>
                                </div>
                                <div class="btn-attach-file-wrapper d-flex align-items-center ms-3">
                                    <span class="material-symbols-outlined task-icon">attach_file</span>
                                    ${task.reference_files_count > 0 ? `<span class="reference-files-count ms-1" style="color: #797E91; font-size: 12px;">${task.reference_files_count}</span>` : ""}
                                </div>
                                `
                            }
                 </div>
            `)}
                </div>
            </div>
        `;
    }

    // Function to toggle description expansion
    function toggleDescription(element) {
        const container = element.closest('.task-description-container');
        const description = container.querySelector('.task-description');
        const isExpanded = description.classList.contains('expanded');

        if (isExpanded) {
            // Collapse
            description.classList.remove('expanded');
            description.classList.add('truncated');
            element.textContent = 'View More';
        } else {
            // Expand
            description.classList.add('expanded');
            description.classList.remove('truncated');
            element.textContent = 'See Less';
        }
    }
    window.toggleDescription = toggleDescription;

// Ensure canonical generator is reachable from other scopes (some runtimes wrap files)
try { if (typeof window !== 'undefined' && typeof createTaskCard === 'function') window.createTaskCard = createTaskCard; } catch(_) {}

const desktopState = {
  new_request: { page: 1, last: 1, loading: false },
  in_progress: { page: 1, last: 1, loading: false },
  completed: { page: 1, last: 1, loading: false }
};

window.allTasksCache = window.allTasksCache || {};
const allTasksCache = window.allTasksCache;

const loaderMap = {
  new_request: "#newTaskLoading",
  in_progress: "#progressTaskLoading",
  completed: "#completedTaskLoading",
  finished: "#finishedTaskLoading",
};

const sectionMap = {
  new_request: "new-request-tasks",
  in_progress: "in-progress-tasks",
  completed: "completed-tasks",
  finished: "finished-tasks"
};

let taskFetchSeq = 0
window.__taskAjaxRequestsMap = window.__taskAjaxRequestsMap || {}

function fetchAndRenderTasks(statusKey = null, page = 1, append = false, query = "") {
  const callSeq = ++taskFetchSeq
  const params = {}
  if (statusKey) params.status = statusKey
  params.page = page
  if (query) params.search = query
  try {
    if (currentTaskFilters && currentTaskFilters.project) params.project = currentTaskFilters.project
        // Forward explicit employee filter (id or name) from UI filters
        if (currentTaskFilters && currentTaskFilters.employee) params.employee = currentTaskFilters.employee
    if (!statusKey && !query && currentTaskFilters && currentTaskFilters.status) params.status = currentTaskFilters.status
  } catch (_) {}
  if (statusKey && loaderMap[statusKey]) $(loaderMap[statusKey]).removeClass("d-none")
  try {
    const reqKey = statusKey ? String(statusKey) : "all"
    const prev = window.__taskAjaxRequestsMap[reqKey]
    if (prev && typeof prev.abort === "function") prev.abort()
  } catch (_) {}
  const jq = $.ajax({
    url: appUrl + "/task/index",
    type: "GET",
    dataType: "json",
    headers: { "X-Requested-With": "XMLHttpRequest" },
    data: params,
    success: function (response) {

      if (callSeq !== taskFetchSeq) return
      if (!response || response.code !== 200 || !response.data) return

      if (!statusKey) {
        const data = response.data
        if (data.in_progress && data.rejected && Array.isArray(data.rejected.tasks)) {
          const inPT = Array.isArray(data.in_progress.tasks) ? data.in_progress.tasks : []
          const rejT = data.rejected.tasks || []
          data.in_progress.tasks = [...inPT, ...rejT]
        }
        ;["new_request", "in_progress", "completed", "finished"].forEach(sk => {
          if (!desktopState[sk]) desktopState[sk] = { page: 1, last: 1, loading: false }
          desktopState[sk].last = data[sk]?.pagination?.last_page || 1
          desktopState[sk].page = data[sk]?.pagination?.current_page || 1
          allTasksCache[sk] = data[sk] || { tasks: [], pagination: {} }
        })
        renderTasks(data)
        injectRejectedIfMissing(response.data)
        return
      }

      const respSection = response.data?.[statusKey] ?? { tasks: [], pagination: {} }
      if (statusKey === "in_progress" && !append && response.data?.rejected?.tasks) {
        const rej = response.data.rejected.tasks
        if (Array.isArray(rej) && rej.length) respSection.tasks = [...(respSection.tasks || []), ...rej]
      }

      if (!desktopState[statusKey]) desktopState[statusKey] = { page: 1, last: 1, loading: false }
      desktopState[statusKey].last = respSection?.pagination?.last_page || 1
      desktopState[statusKey].page = respSection?.pagination?.current_page || page

      let renderTasksArr = []
      if (!allTasksCache[statusKey] || !append) {
        allTasksCache[statusKey] = respSection
        renderTasksArr = respSection.tasks || []
      } else {
        const existing = new Map((allTasksCache[statusKey].tasks || []).map(t => [t.id, t]))
        const newTasks = (respSection.tasks || []).filter(t => !existing.has(t.id))
        newTasks.forEach(t => {
          allTasksCache[statusKey].tasks.push(t)
          existing.set(t.id, t)
        })
        allTasksCache[statusKey].pagination = respSection.pagination || allTasksCache[statusKey].pagination
        renderTasksArr = newTasks
      }

    renderSingleSection(statusKey, respSection.tasks || [], true)
      injectRejectedIfMissing(response.data)
    },
    error: function (xhr, textStatus) {
      if (textStatus === "abort" || (xhr && xhr.status === 0)) return
      let msg = "Failed to load tasks."
      try {
        if (xhr && xhr.responseJSON && (xhr.responseJSON.message || xhr.responseJSON.error)) {
          msg = xhr.responseJSON.message || xhr.responseJSON.error
        }
      } catch (_) {}
      try {
        if (typeof window.showAlertMsg === "function") window.showAlertMsg(msg, "light", 2500)
        else if (typeof window.showFloatingAlert === "function") window.showFloatingAlert(msg, "light")
        else console.warn("Task fetch error:", msg)
      } catch (_) {}
    },
    complete: function () {
      if (statusKey && loaderMap[statusKey]) $(loaderMap[statusKey]).addClass("d-none")
      if (statusKey && desktopState[statusKey]) desktopState[statusKey].loading = false
    }
  })
  try {
    const reqKey = statusKey ? String(statusKey) : "all"
    window.__taskAjaxRequestsMap[reqKey] = jq
  } catch (_) {}
  return jq
}

function renderTasks(data) {
  renderSingleSection("new_request", data.new_request?.tasks || [], false)
  renderSingleSection("in_progress", [...(data.in_progress?.tasks || []), ...(data.rejected?.tasks || [])], false)
  renderSingleSection("completed", data.completed?.tasks || [], false)
  renderSingleSection("finished", data.finished?.tasks || [], false)
  ensureRejectedCardsPlaced()
  try {
    applyCurrentSearchFilter()
  } catch (_) {}
    try {
        // Also refresh the List/Table view whenever grid data renders
        renderTaskTableFromCache()
    } catch (_) {}
  try {
    const clientMap = window.__clientArchivedTasks || new Map()
    if (clientMap && typeof clientMap.forEach === "function" && clientMap.size) {
      clientMap.forEach(function (t, k) {
        try {
          const selector = '.custom-card[data-task-id="' + (t.id || t.task_id) + '"]'
          document.querySelectorAll(selector).forEach(function (el) {
            el.remove()
          })
        } catch (_) {}
      })
    }
  } catch (_) {}
}

function renderSingleSection(status, tasks, append = false) {
  const containerId = sectionMap[status]
  if (!containerId) return
  const container = document.getElementById(containerId)
  if (!container) return
  if (!append) container.innerHTML = ""

  const userIdMeta = document.querySelector('meta[name="user-id"]')
  let currentUserId = null
  if (userIdMeta && userIdMeta.content !== undefined && userIdMeta.content !== null) currentUserId = String(userIdMeta.content)
  else if (typeof window.CurrentUserId !== "undefined" && window.CurrentUserId !== null) currentUserId = String(window.CurrentUserId)
  else currentUserId = ""

  let incomingTasks = Array.isArray(tasks) ? tasks.slice() : []
  window.__clientArchivedTasks = window.__clientArchivedTasks || new Map()

  function parseDateForCompare(d) {
    if (!d) return null
    try {
      const dt = new Date(d)
      if (isNaN(dt.getTime())) return null
      return dt
    } catch (e) {
      return null
    }
  }

  function isCompletedOlderThanDays(task, days) {
    try {
      if (!task) return false
      const status = String(task.status || "").toLowerCase()
      if (!status.includes("completed")) return false
      const d = parseDateForCompare(task.complete_date || task.updated_at || task.updatedAt || null)
      if (!d) return false
      const now = new Date()
      const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24))
      return diffDays > Number(days)
    } catch (e) {
      return false
    }
  }

  incomingTasks = incomingTasks.filter(task => {
    const statusNorm = String(task.status || "").trim().toLowerCase()
    const isRejected = statusNorm.includes("reject")
    const picId = task.pic ? String(task.pic.id) : ""
    const executorIds = (task.executors || []).map(e => String(e.id))
    const uid = String(currentUserId || "")
    const isPic = picId && uid && picId === uid
    const isExecutor = executorIds.some(id => id === uid)
    if (isRejected) {
      if (isPic || isExecutor) return true
      return false
    }
    try {
      if (statusNorm.includes("completed")) {
        if (isCompletedOlderThanDays(task, 90)) {
          const idKey = String(task.id || task.task_id || "")
          if (idKey) {
            const normalized = Object.assign({}, task, { status: task.status || "completed" })
            window.__clientArchivedTasks.set(idKey, normalized)
            try {
              const selector = '.custom-card[data-task-id="' + idKey + '"]'
              document.querySelectorAll(selector).forEach(function (el) {
                el.remove()
              })
            } catch (_) {}
          }
          return false
        }
      }
    } catch (_) {}
    return true
  })

  incomingTasks.forEach(task => container.insertAdjacentHTML("beforeend", createTaskCard(task)))

  addAttachFileIconListeners()
  initBootstrapTooltips()
  scheduleRefreshLatestFeedbackSnippets()
  if (!append) ensureRejectedCardsPlaced()
  try {
    applyCurrentSearchFilter()
  } catch (_) {}
    try { renderTaskTableFromCache() } catch(_) {}
  try {
    if (status === "new_request" && typeof window.updateNewRequestArrowVisibility === "function") window.updateNewRequestArrowVisibility()
  } catch (_) {}
  try {
    const clientMap = window.__clientArchivedTasks || new Map()
    if (clientMap && typeof clientMap.forEach === "function" && clientMap.size) {
      clientMap.forEach(function (t, k) {
        try {
          const selector = '.custom-card[data-task-id="' + (t.id || t.task_id) + '"]'
          document.querySelectorAll(selector).forEach(function (el) {
            el.remove()
          })
        } catch (_) {}
      })
    }
  } catch (_) {}
}

function ensureRejectedCardsPlaced() {
  try {
    const inProgressCol = document.getElementById("in-progress-tasks")
    if (!inProgressCol) return
    const allRejected = document.querySelectorAll(".custom-card[data-task-status]")
    allRejected.forEach(card => {
      const st = String(card.getAttribute("data-task-status") || "").toLowerCase()
      if (st.includes("reject")) {
        if (!card.querySelector(".badge.bg-danger")) {
          const badge = document.createElement("span")
          badge.className = "badge bg-danger position-absolute"
          badge.style.cssText = "font-size:10px;font-weight:500;top:25%;right:18px;"
          badge.textContent = "REJECTED"
          card.appendChild(badge)
        }
        if (card.parentElement !== inProgressCol) {
          card.parentElement && card.parentElement.removeChild(card)
          inProgressCol.prepend(card)
        }
      }
    })
    initBootstrapTooltips()
  } catch (err) {
    console.warn("ensureRejectedCardsPlaced error", err)
  }
}

function injectRejectedIfMissing(rawData) {
  try {
    if (!rawData) return
    const inProgressCol = document.getElementById("in-progress-tasks")
    if (!inProgressCol) return
    const buckets = ["new_request", "in_progress", "completed", "rejected", "finished"]
    const collected = []
    buckets.forEach(b => {
      const arr = rawData[b]?.tasks
      if (Array.isArray(arr)) collected.push(...arr)
    })
    const rejected = collected.filter(t => String(t.status || "").toLowerCase().includes("reject"))
    if (!rejected.length) return
    const existingIds = new Set(Array.from(inProgressCol.querySelectorAll(".custom-card[data-task-id]")).map(c => c.getAttribute("data-task-id")))
    rejected.forEach(task => {
      const idStr = String(task.id)
      if (!existingIds.has(idStr)) {
        inProgressCol.insertAdjacentHTML("afterbegin", createTaskCard(task))
        existingIds.add(idStr)
      }
    })
    ensureRejectedCardsPlaced()
  } catch (err) {
    console.warn("injectRejectedIfMissing error", err)
  }
}

function initDesktopInfiniteScroll(query = "") {
  try { window.__taskCurrentSearchQuery = String(query || '') } catch(_) {}
  ;["new_request", "in_progress", "completed", "finished"].forEach(status => {
    const containerId = sectionMap[status]
    const el = document.getElementById(containerId)
    if (!el) return
    if (el.dataset.infiniteScrollBound === '1') return
    el.dataset.infiniteScrollBound = '1'
    el.addEventListener('scroll', function () {
      const state = desktopState[status]
      if (!state || state.loading) return
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 50) {
        if (state.page < state.last) {
          state.loading = true
          const nextPage = state.page + 1
          const q = (typeof window.__taskCurrentSearchQuery === 'string') ? window.__taskCurrentSearchQuery : ''
          fetchAndRenderTasks(status, nextPage, true, q)
        }
      }
    }, { passive: true })
  })
}

// Client-side, in-place filter for visible task cards (title + project title)
function filterVisibleTasks(queryRaw) {
    try {
        const q = String(queryRaw || '').trim().toLowerCase();
        const containers = ['new-request-tasks', 'in-progress-tasks', 'completed-tasks', 'filteredTasks'];
        containers.forEach(id => {
            const c = document.getElementById(id);
            if (!c) return;
            const cards = c.querySelectorAll('.custom-card');
            cards.forEach(card => {
                const title = (card.querySelector('.task-title')?.textContent || '').toLowerCase();
                // project title is rendered in a small.text-muted near title
                const project = (card.querySelector('small.text-muted')?.textContent || '').toLowerCase();
                const desc = (card.querySelector('.task-description')?.textContent || '').toLowerCase();
                // Also include PIC and Executors names when filtering so employee searches are preserved.
                // Executors are often rendered as <img> with alt/title attributes, so include those attributes
                // in the searchable text in addition to any plain text nodes.
                let picText = '';
                try {
                    const picContainer = card.querySelector('.pic-executor-container');
                    if (picContainer) {
                        picText = (picContainer.textContent || '').toLowerCase();
                        picContainer.querySelectorAll('img').forEach(function(img){
                            try {
                                const a = img.alt || img.getAttribute('alt') || '';
                                const t = img.title || img.getAttribute('title') || '';
                                const bs = img.getAttribute('data-bs-original-title') || '';
                                if (a) picText += ' ' + String(a).toLowerCase();
                                if (t) picText += ' ' + String(t).toLowerCase();
                                if (bs) picText += ' ' + String(bs).toLowerCase();
                            } catch(_){}
                        });
                    }
                } catch(_) { picText = '' }

                let executorsText = '';
                try {
                    const execWrapper = card.querySelector('.executor-wrapper') || card.querySelector('.executor-list') || card.querySelector('.pic-executor-container');
                    if (execWrapper) {
                        executorsText = (execWrapper.textContent || '').toLowerCase();
                        // include image alt/title inside executor wrapper too
                        execWrapper.querySelectorAll('img').forEach(function(img){
                            try {
                                const a = img.alt || img.getAttribute('alt') || '';
                                const t = img.title || img.getAttribute('title') || '';
                                const bs = img.getAttribute('data-bs-original-title') || '';
                                if (a) executorsText += ' ' + String(a).toLowerCase();
                                if (t) executorsText += ' ' + String(t).toLowerCase();
                                if (bs) executorsText += ' ' + String(bs).toLowerCase();
                            } catch(_){}
                        });
                    }
                } catch(_) { executorsText = '' }

                const match = !q || title.includes(q) || project.includes(q) || desc.includes(q) || picText.includes(q) || executorsText.includes(q);
                if (match) card.style.removeProperty('display');
                else card.style.display = 'none';
            });
        });
        // Optional: also filter mobile list if present
        const mobileList = document.getElementById('mobile-task-list');
        if (mobileList) {
            mobileList.querySelectorAll('.custom-card').forEach(card => {
                const title = (card.querySelector('.task-title')?.textContent || '').toLowerCase();
                const project = (card.querySelector('small.text-muted')?.textContent || '').toLowerCase();
                const desc = (card.querySelector('.task-description')?.textContent || '').toLowerCase();
                const match = !q || title.includes(q) || project.includes(q) || desc.includes(q);
                if (match) card.style.removeProperty('display');
                else card.style.display = 'none';
            });
        }
    } catch(_) { /* noop */ }
}

// Re-apply active filter after any render
function applyCurrentSearchFilter() {
    try {
        const input = document.getElementById('search_filter');
        if (!input) return;
        const q = input.value || '';
        filterVisibleTasks(q);
        // Also filter table rows when list view is active
        try { filterTaskTableRows(q); } catch (_) {}
    } catch(_) { /* noop */ }
}

// ----- List/Table View Rendering -----
function getAllTasksFlatFromCache() {
    try {
        const buckets = window.allTasksCache || {};
        const newReq = (buckets.new_request && buckets.new_request.tasks) ? buckets.new_request.tasks : [];
        const prog = (buckets.in_progress && buckets.in_progress.tasks) ? buckets.in_progress.tasks : [];
        const rej = (buckets.rejected && buckets.rejected.tasks) ? buckets.rejected.tasks : [];
        const comp = (buckets.completed && buckets.completed.tasks) ? buckets.completed.tasks : [];
        const fin = (buckets.finished && buckets.finished.tasks) ? buckets.finished.tasks : [];
        const inProgressMerged = [...prog, ...rej];
        return [...newReq, ...inProgressMerged, ...comp, ...fin];
    } catch(_) { return []; }
}

function getUserPhotoUrl(user) {
    try {
        if (!user) return appUrl + '/asset/img/avatar.png';
        // Prefer explicit properties commonly returned by API
        let img = user.image || user.profile_picture_url || user.profile_picture || user.user_photo || '';
        if (!img) return appUrl + '/asset/img/avatar.png';
        img = String(img).trim();
        if (/^https?:\/\//i.test(img)) return img;
        if (img.startsWith('/')) return appUrl + img;
        if (img.indexOf('/') !== -1) return appUrl + '/' + img;
        // Fallback to profile_picture folder for plain filenames
        return appUrl + '/file/profile_picture/' + img;
    } catch(_) { return appUrl + '/asset/img/avatar.png'; }
}

function createExecutorsCellHtml(task) {
    try {
        const execs = Array.isArray(task?.executors) ? task.executors : [];
        if (execs.length === 0) return '<span class="text-muted">-</span>';

        const execsName = execs.map(e => safeText(e.name || '-')).join(', ');

        return `
            <div class="executor-wrapper">
                ${execsName}
            </div>
        `;
    } catch(_) {
        return '<span class="text-muted">-</span>';
    }
}

function statusLabel(statusRaw) {
    const s = String(statusRaw || '').toLowerCase().replace(/\s+/g,'_');
    if (s.includes('finish')) return '<span class="badge bg-finish text-dark">Finished</span>';
    if (s.includes('new')) return '<span class="badge bg-secondary text-dark" style="background:#ecedf5 !important;">New</span>';
    if (s.includes('progress')) return '<span class="badge bg-info text-dark" style="background:#edebdf !important; color:#5b4b00;">In Progress</span>';
    if (s.includes('completed')) return '<span class="badge bg-success">Completed</span>';
    if (s.includes('reject')) return '<span class="badge bg-danger">Rejected</span>';
    return `<span class="badge bg-light text-dark">${statusRaw || '-'}</span>`;
}

function safeText(v) { try { return (v == null ? '' : String(v)); } catch(_) { return ''; } }

    function renderTaskTableFromCache() {
        try {
            const sections = [
                document.getElementById('task-table-section'),
                document.getElementById('task-table-section-mobile')
            ].filter(Boolean);

            if (!sections.length) return;
            const tasks = getAllTasksFlatFromCache();
            if (!Array.isArray(tasks)) return;

            const parseDate = d => { 
                try { const x = new Date(d); return isNaN(x) ? null : x.getTime(); } 
                catch(_) { return null; } 
            };

            const sorted = tasks.slice().sort((a,b) => {
                const ad = parseDate(a?.due_date); 
                const bd = parseDate(b?.due_date);
                if (ad !== bd) return (ad||Infinity) - (bd||Infinity);
                const as = parseDate(a?.start_date); 
                const bs = parseDate(b?.start_date);
                return (as||Infinity) - (bs||Infinity);
            });

            let html = '';
            sorted.forEach(t => {
                const taskTitle = safeText(t.title);
                const projectTitle = safeText(t.project_title || (t.project && t.project.title));
                const pic = t.pic || null;
                const picName = pic ? safeText(pic.name) : '-';
                const execCell = createExecutorsCellHtml(t);
                const startStr = (typeof formatDateWithSlash === 'function') ? formatDateWithSlash(t.start_date) : safeText(t.start_date);
                const dueStr = (typeof formatDateWithSlash === 'function') ? formatDateWithSlash(t.due_date) : safeText(t.due_date);
                const st = statusLabel(t.status);

                const titleForInitials = taskTitle || projectTitle || 'NA';
                const initials = (() => {
                    const s = String(titleForInitials).trim();
                    if (!s) return 'NA';
                    const parts = s.split(/\s+/).filter(Boolean);
                    if (parts.length === 1) return parts[0].substring(0,2).toUpperCase();
                    return (parts[0][0] + parts[parts.length-1][0]).toUpperCase();
                })();

                const colors = ['#6A5AE0','#FF8A3C','#00A881','#D4526E','#3E8EDE','#546E7A','#8E44AD','#2E7D32','#AD1457','#EF6C00'];
                const bgColor = (() => {
                    let hash=0; for (let i=0;i<titleForInitials.length;i++){ hash = (hash*31 + titleForInitials.charCodeAt(i))>>>0; }
                    return colors[hash % colors.length];
                })();

                const projectImg = (() => {
                    try {
                        const raw = (t && t.project_image);
                        if (!raw) return null;
                        const val = String(raw || '').trim();
                        if (!val || val.toLowerCase() === 'null' || val.toLowerCase() === 'undefined') return null;
                        if (/^https?:\/\//i.test(val)) return val;
                        if (val.includes('/file/project/')) {
                            const fname = val.split('/file/project/').pop().split(/[?#]/)[0];
                            if (!fname) return null;
                            return `${appUrl}/file/project/${fname}`;
                        }
                        if (val.includes('/asset/')) {
                            const suffix = val.split('/asset/').pop().replace(/^\/+/, '');
                            return `${appUrl}/asset/${suffix}`;
                        }
                        if (val.startsWith('/asset/')) {
                            const suffix = val.replace(/^\/+/, '');
                            return `${appUrl}/${suffix}`;
                        }
                        if (val.startsWith('/')) return `${appUrl}${val}`;
                        return `${appUrl}/file/project/${val}`;
                    } catch(_) { return null; }
                })();

                const taskImgHtml = projectImg
                    ? `<div style="flex-shrink:0;">
                            <img src="${projectImg}" alt="Project Image" class="rounded-circle" width="40" height="40" style="object-fit:cover;" onerror="this.onerror=null;this.src='${appUrl}/asset/img/avatar.png'">
                    </div>`
                    : `<div style="flex-shrink:0;">
                            <div class="rounded-circle d-flex align-items-center justify-content-center" style="width:40px;height:40px;background:${bgColor};color:#fff;font-size:12px;font-weight:600;">
                                ${initials}
                            </div>
                    </div>`;

                html += `
                <tr data-task-id="${t.id}" data-project-id="${t.project_id || ''}" data-priority="${t.priority || ''}" data-status="${t.status || ''}" data-due-date="${t.due_date || ''}">
                    <td>
                        <div style="display:flex;gap:0.5rem;align-items:flex-start;">
                            ${taskImgHtml}
                            <div>
                                <div style="font-size: 10px; color: #6c757d;">${projectTitle || taskTitle}</div>
                                <div class="task-name-wrapper fw-semibold task-title" style="font-size: 14px; cursor: pointer;">${taskTitle}</div>
                            </div>
                        </div>
                    </td>
                    <td style="white-space:normal;">${picName}</td>
                    <td style="white-space:normal;">${execCell}</td>
                    <td>${startStr || '-'}</td>
                    <td>${dueStr || '-'}</td>
                    <td>${st}</td>
                </tr>
                `;
            });

            sections.forEach(section => {
                const tbody = section.querySelector('tbody');
                if (!tbody) return;
                tbody.innerHTML = html || '<tr><td colspan="6" class="text-center text-muted">No tasks found</td></tr>';
                try { initBootstrapTooltips(section); } catch(_) {}
                try { 
                    const q = (document.getElementById('search_filter')?.value) 
                        || (document.getElementById('search_filter_mobile')?.value) 
                        || ''; 
                    filterTaskTableRows(q, section); 
                } catch(_) {}
            });
        } catch(_) {}
    }

    function filterTaskTableRows(queryRaw = '', targetSection = null) {
        try {
            const q = String(queryRaw || '').trim().toLowerCase();
            const sections = targetSection ? [targetSection] : [
                document.getElementById('task-table-section'),
                document.getElementById('task-table-section-mobile')
            ].filter(Boolean);

            sections.forEach(section => {
                const rows = section.querySelectorAll('tbody tr');
                rows.forEach(tr => {
                    const projectCell = tr.dataset.projectId || '';
                    const statusCell = tr.dataset.status || '';
                    const priorityCell = tr.dataset.priority || '';
                    const dueDateCell = tr.dataset.dueDate || '';

                    const colsText = Array.from(tr.querySelectorAll('td')).map(td => (td.textContent||'').toLowerCase()).join(' ');

                    let match = true;
                    if (q && !colsText.includes(q)) match = false;
                    if (currentTaskFilters.project && projectCell !== currentTaskFilters.project) match = false;
                    if (currentTaskFilters.status && statusCell !== currentTaskFilters.status) match = false;
                    if (currentTaskFilters.priority && priorityCell !== currentTaskFilters.priority) match = false;
                    if (currentTaskFilters.date && dueDateCell !== currentTaskFilters.date) match = false;

                    tr.style.display = match ? '' : 'none';
                });
            });
        } catch(_) {}
    }

    (function initTaskSearchFilter() {
        let lastSearchAt = 0;
        let lastSearchedQuery = '';
        let debounceTimer = null;

        function runSearch(query) {
            try {
                Object.keys(desktopState || {}).forEach(k => {
                    if (desktopState[k]) {
                        desktopState[k].page = 1;
                        desktopState[k].last = 1;
                        desktopState[k].loading = false;
                    }
                });
            } catch (_) {}

            const q = (query || '').trim();
            window.__taskCurrentSearchQuery = q;

            const now = Date.now();
            if (q === lastSearchedQuery && (now - lastSearchAt) < 350) return;

            lastSearchedQuery = q;
            lastSearchAt = now;

            fetchAndRenderTasks(null, 1, false, q);
        }

        document.addEventListener('input', function (e) {
            const el = e.target;
            if (!el || el.id !== 'search_filter') return;

            const val = (el.value || '').trim();
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                if (val !== lastSearchedQuery) {
                    runSearch(val);
                }
            }, 500);
        });

        document.addEventListener('keydown', function (e) {
            const el = e.target;
            if (!el || el.id !== 'search_filter') return;
            if (e.key === 'Enter') {
                e.preventDefault();
                clearTimeout(debounceTimer);
                runSearch(el.value || '');
            }
        });
    })();

    // init
    $(document).ready(function () {
    // Ensure dropdown toggle handler is bound once globally
    try { setupTaskDropdownListeners(); } catch(_) {}
        // Initialize infinite scroll once
        initDesktopInfiniteScroll();
        // Perform a single full-bucket fetch to populate all sections
        fetchAndRenderTasks(null, 1, false);
    });

    // --- New flow: checkbox selects, done_all triggers Accept; arrow triggers Progress ---
    (function initBulkAcceptFlow(){
    // Keep a memory set of selected pending ids
    let selectedPendingIds = [];
    // Also track all selected ids in New (for Progress action)
    let selectedAllNewIds = [];

        // NEW: hide select-all label initially
        const _selectAllLabelInitial = document.querySelector('.task-selectall-toggle');
        if (_selectAllLabelInitial) {
            // Force element to occupy space from start to avoid layout shift
            if (getComputedStyle(_selectAllLabelInitial).display === 'none') {
                _selectAllLabelInitial.style.display = 'inline-flex';
            }
            _selectAllLabelInitial.style.visibility = 'hidden';
            _selectAllLabelInitial.style.opacity = '0';
        }

        // NEW: control visibility of select-all checkbox label
        function updateSelectAllVisibility(){
            const labels = document.querySelectorAll('.task-selectall-toggle');
            if (!labels.length) return;
            if (selectedAllNewIds.length > 0) {
                labels.forEach(label=>{ label.style.visibility='visible'; label.style.opacity='1'; });
            } else {
                ['taskNewAcceptAll','taskNewAcceptAllMobile'].forEach(id=>{ const cb=document.getElementById(id); if(cb) cb.checked=false; });
                labels.forEach(label=>{ label.style.visibility='hidden'; label.style.opacity='0'; });
            }
            // Update arrow visibility to reflect select-all state
            try { if (typeof window.updateNewRequestArrowVisibility === 'function') window.updateNewRequestArrowVisibility(); } catch(_) {}
        }

        function collectPendingNewTaskIds(){
            const cards = Array.from(document.querySelectorAll('#new-request-tasks .custom-card, #mobile-task-list .custom-card'));
            return cards.reduce((acc, el) => {
                const tId = el.getAttribute('data-task-id');
                if (tId && el.querySelector('.btn-accept-invite')) acc.push(tId);
                return acc;
            }, []);
        }

        function collectAllNewTaskIds(){
            return Array.from(document.querySelectorAll('#new-request-tasks .custom-card, #mobile-task-list .custom-card'))
                .map(el => el.getAttribute('data-task-id'))
                .filter(Boolean);
        }

        function syncSelectAllCheckboxState(){
            const allIds = collectAllNewTaskIds();
            const allSelected = allIds.length > 0 && allIds.every(id => selectedAllNewIds.includes(String(id)));
            ['taskNewAcceptAll','taskNewAcceptAllMobile'].forEach(mid => {
                const master = document.getElementById(mid);
                if (!master) return;
                if (master.checked && !allSelected) master.checked = false;
                else if (!master.checked && allSelected) master.checked = true;
            });
        }

        function acceptOne(taskId){
            return $.ajax({
                url: appUrl + '/task/' + taskId + '/accept',
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content') }
            }).then(function(){
                // Also mark its task-assignment notifications read for this user
                return markTaskAssignmentNotificationsRead(taskId).then(function(){
                    try { showFloatingAlert('Task accepted', 'success', 1200); } catch(_) {}
                });
            }).catch(function(){
                // keep going
                return $.Deferred().resolve().promise();
            });
        }

        function acceptAll(ids){
            if (!ids || ids.length === 0) return Promise.resolve();
            let chain = Promise.resolve();
            ids.forEach((id) => { chain = chain.then(() => acceptOne(id)); });
            return chain.then(() => {
                refreshNotificationCountBadge();
                try { showFloatingAlert(ids.length + ' task(s) accepted', 'success', 1500); } catch(_) {}
            });
        }

        // When checkbox is toggled, only (de)select in memory and toggle bulk icon state
        document.addEventListener('change', function(e){
            const cb = e.target.closest('#taskNewAcceptAll, #taskNewAcceptAllMobile');
            if (!cb) return;
            if (cb.checked) {
                // When Select All is enabled, include all tasks across pages from cache
                if (allTasksCache && allTasksCache.new_request && Array.isArray(allTasksCache.new_request.tasks)) {
                    const allNewTasks = allTasksCache.new_request.tasks;
                    selectedAllNewIds = allNewTasks.map(t => String(t.id));
                    selectedPendingIds = allNewTasks
                        .filter(t => isViewerPendingExecutor(t))
                        .map(t => String(t.id));
                } else {
                    // Fallback to current DOM
                    selectedPendingIds = collectPendingNewTaskIds();
                    selectedAllNewIds = collectAllNewTaskIds();
                }
                // visually select all thumbnails (desktop + mobile list)
                document.querySelectorAll('#new-request-tasks .task-selectable-thumb, #mobile-task-list .task-selectable-thumb').forEach(el=> el.classList.add('selected'));
            } else {
                selectedPendingIds = [];
                selectedAllNewIds = [];
                // clear visual selection (desktop + mobile)
                document.querySelectorAll('#new-request-tasks .task-selectable-thumb.selected, #mobile-task-list .task-selectable-thumb.selected').forEach(el=> el.classList.remove('selected'));
            }
            updateBulkHeaderButtons();
            updateSelectAllVisibility(); // NEW
        });

        // Bulk action icon opens confirmation modal, then runs accept
        document.addEventListener('click', function(e){
            // Toggle single-select on pending project image
            const thumb = e.target.closest('.task-selectable-thumb');
            if (thumb) {
                const taskId = thumb.getAttribute('data-task-id');
                // Toggle selection
                if (thumb.classList.contains('selected')) {
                    thumb.classList.remove('selected');
                    selectedPendingIds = selectedPendingIds.filter(id => String(id) !== String(taskId));
                    selectedAllNewIds = selectedAllNewIds.filter(id => String(id) !== String(taskId));
                    // Remove any inline styles previously applied so CSS can drive next visual state
                    try {
                        const chk = thumb.querySelector('.thumb-check');
                        if (chk) {
                            chk.style.removeProperty('background');
                            const ic = chk.querySelector('.material-symbols-outlined');
                            if (ic) ic.style.removeProperty('color');
                        }
                    } catch(_) { /* noop */ }
                } else {
                    // Single selection if checkbox not checked; if checked, add to list
                    thumb.classList.add('selected');
                    if (thumb.dataset.pending === '1' && !selectedPendingIds.includes(taskId)) selectedPendingIds.push(taskId);
                    if (!selectedAllNewIds.includes(taskId)) selectedAllNewIds.push(taskId);
                    // Ensure any stale inline styles from previous deselect are cleared so overlay becomes visible
                    try {
                        const chk = thumb.querySelector('.thumb-check');
                        if (chk) {
                            chk.style.removeProperty('background');
                            const ic = chk.querySelector('.material-symbols-outlined');
                            if (ic) ic.style.removeProperty('color');
                        }
                    } catch(_) { /* noop */ }
                }
                syncSelectAllCheckboxState();
                updateBulkHeaderButtons();
                updateSelectAllVisibility(); // NEW
                return;
            }

            const btn = e.target.closest('#taskNewBulkAction');
            if (!btn) return;
            if (btn.disabled) return;
            const count = selectedPendingIds.length;
            if (count <= 0) return;

            const id = 'taskBulkAcceptModal';
            const html = `
                <div class="modal fade" id="${id}" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog modal-dialog-centered" style="max-width:480px;">
                        <div class="modal-content modal-content-custom">
                            <div class="modal-body"><p class="mb-3">Accept ${count} selected task${count>1?'s':''}?</p></div>
                            <hr class="border-1">
                            <p class="text-center mb-3">Are you sure want to accept all selected task?</p>
                            <div class="modal-footer modal-footer-custom">
                                <button type="button" class="btn btn-custom-close" data-bs-dismiss="modal">Cancel</button>
                                <button type="button" class="btn btn-submit-black" id="confirmBulkAcceptBtn">Accept</button>
                            </div>
                        </div>
                    </div>
                </div>`;
            document.querySelectorAll('#'+id).forEach(n => n.remove());
            document.body.insertAdjacentHTML('beforeend', html);
            const modalEl = document.getElementById(id);
            const m = new bootstrap.Modal(modalEl);
            m.show();
            modalEl.addEventListener('hidden.bs.modal', () => modalEl.remove(), { once: true });
            modalEl.querySelector('#confirmBulkAcceptBtn').addEventListener('click', function(){
                acceptAll(selectedPendingIds).finally(() => {
                    try { m.hide(); } catch(_) {}
                    window.location.reload();
                });
            });
        });

        // Bulk Progress button behavior
        document.addEventListener('click', function(e){
            const btn = e.target.closest('#taskNewBulkProgress, #taskNewBulkProgressMobile');
            if (!btn) return;
            if (btn.disabled) return;
            // If select-all checkbox is on, include all IDs across pagination from cache
            const selectAllChecked = !!document.getElementById('taskNewAcceptAll')?.checked || !!document.getElementById('taskNewAcceptAllMobile')?.checked;
            let ids = selectedAllNewIds.slice();
            if (selectAllChecked && allTasksCache && allTasksCache.new_request && Array.isArray(allTasksCache.new_request.tasks)) {
                ids = allTasksCache.new_request.tasks.map(t => String(t.id));
            }
            if (ids.length === 0) return;

            // Only move tasks that are already accepted (non-pending thumbnails)
            const movableIds = ids.filter(id => {
                const card = document.querySelector(`#new-request-tasks .custom-card[data-task-id="${id}"]`);
                if (!card) return false;
                return !card.querySelector('.btn-accept-invite');
            });
            if (movableIds.length === 0) return;

            if (movableIds.length === 1) {
                const id = movableIds[0];
                // Use existing status confirmation modal in the page
                const modalId = 'statusConfirmModal';
                const modalEl = document.getElementById(modalId);
                const statusModal = new bootstrap.Modal(modalEl);
                // Update modal texts to reflect single selection Progress action
                const titleEl = document.getElementById('statusModalTitle');
                const descEl = document.getElementById('statusModalDescription');
                const confirmTextEl = document.getElementById('statusModalConfirmText');
                if (titleEl) titleEl.textContent = '1 selected';
                if (descEl) descEl.textContent = 'Move selected task to In Progress?';
                if (confirmTextEl) confirmTextEl.textContent = 'Are you sure want to move the task to Progress?';
                statusModal.show();
                const confirmBtn = document.getElementById('statusModalConfirmBtn');
                // Clear any previous inline onclick set by other flows
                if (confirmBtn) confirmBtn.onclick = null;
                const singleHandler = function(){
                    confirmBtn.removeEventListener('click', singleHandler);
                    const card = document.querySelector(`#new-request-tasks .custom-card[data-task-id="${id}"]`);
                    bulkStatusOperationActive = true; bulkStatusSuppressRefresh = true;
                    bulkStatusPendingCount = 0; bulkStatusCompletedCount = 0; bulkStatusExpectedCount = 1; bulkFinalStatusMessage = null; bulkFinalAlertShown = false;
                    updateTaskStatus(id, 'in_progress', card).finally(() => {
                        bulkStatusOperationActive = false; bulkStatusSuppressRefresh = false; bulkStatusExpectedCount = 0;
                        try { statusModal.hide(); } catch(_){ }
                        ['taskNewAcceptAll','taskNewAcceptAllMobile'].forEach(id=>{ const el=document.getElementById(id); if(el) el.checked=false; });
                        selectedPendingIds = [];
                        selectedAllNewIds = [];
                        document.querySelectorAll('#new-request-tasks .task-selectable-thumb.selected, #mobile-task-list .task-selectable-thumb.selected').forEach(n => n.classList.remove('selected'));
                        updateBulkHeaderButtons();
                        updateSelectAllVisibility();
                    });
                };
                confirmBtn.addEventListener('click', singleHandler);
                return;
            }

            // multiple: show Progress modal with count
            const modalId = 'statusConfirmModal';
            const statusModal = new bootstrap.Modal(document.getElementById(modalId));
            const titleEl = document.getElementById('statusModalTitle');
            const descEl = document.getElementById('statusModalDescription');
            if (titleEl) titleEl.textContent = `${movableIds.length} selected`;
            if (descEl) descEl.textContent = 'Move selected tasks to In Progress?';
            statusModal.show();
            const confirmBtn = document.getElementById('statusModalConfirmBtn');
            const handler = function(){
                // chain updates sequentially with bulk flags to suppress per-item alerts and refresh
                bulkStatusOperationActive = true; bulkStatusSuppressRefresh = true;
                bulkStatusPendingCount = 0; bulkStatusCompletedCount = 0; bulkStatusExpectedCount = movableIds.length; bulkFinalStatusMessage = null; bulkFinalAlertShown = false;
                let chain = Promise.resolve();
                movableIds.forEach((id) => {
                    const card = document.querySelector(`#new-request-tasks .custom-card[data-task-id="${id}"]`);
                    chain = chain.then(() => updateTaskStatus(id, 'in_progress', card).then(()=> new Promise(r=> setTimeout(r,80))));
                });
                chain.finally(() => {
                    bulkStatusOperationActive = false; bulkStatusSuppressRefresh = false;
                    statusModal.hide();
                    confirmBtn.removeEventListener('click', handler);
                    ['taskNewAcceptAll','taskNewAcceptAllMobile'].forEach(id=>{ const el=document.getElementById(id); if(el) el.checked=false; });
                    selectedPendingIds = [];
                    selectedAllNewIds = [];
                    document.querySelectorAll('#new-request-tasks .task-selectable-thumb.selected, #mobile-task-list .task-selectable-thumb.selected').forEach(n => n.classList.remove('selected'));
                    // Final refresh & alert sudah ditangani aggregator; fallback refresh bila gagal aggregator
                    if (!bulkFinalAlertShown) fetchAndRenderTasks();
                    updateBulkHeaderButtons();
                    updateSelectAllVisibility(); // NEW
                });
            };
            confirmBtn.addEventListener('click', handler);
        });

        function updateBulkHeaderButtons(){
            const hasAnySelection = (selectedAllNewIds.length + selectedPendingIds.length) > 0;
            const anyPendingSelected = selectedPendingIds.length > 0;
            const allAcceptedSelected = hasAnySelection && !anyPendingSelected;

            const bulkAccept = document.getElementById('taskNewBulkAction');
            const bulkAcceptMobile = document.getElementById('taskNewBulkActionMobile');
            const bulkProgress = document.getElementById('taskNewBulkProgress');
            const bulkProgressMobile = document.getElementById('taskNewBulkProgressMobile');

            if (bulkAccept) {
                // Keep element in flow; toggle visibility only
                if (getComputedStyle(bulkAccept).display === 'none') bulkAccept.style.display = 'inline-flex';
                bulkAccept.style.visibility = anyPendingSelected ? 'visible' : 'hidden';
                bulkAccept.style.opacity = anyPendingSelected ? '1' : '0';
                bulkAccept.disabled = !anyPendingSelected;
            }
            if (bulkAcceptMobile) {
                if (getComputedStyle(bulkAcceptMobile).display === 'none') bulkAcceptMobile.style.display = 'inline-flex';
                bulkAcceptMobile.style.visibility = anyPendingSelected ? 'visible' : 'hidden';
                bulkAcceptMobile.style.opacity = anyPendingSelected ? '1' : '0';
                bulkAcceptMobile.disabled = !anyPendingSelected;
            }
            if (bulkProgress) {
                if (getComputedStyle(bulkProgress).display === 'none') bulkProgress.style.display = 'inline-flex';
                // Show progress (arrow) only when there is a selection AND all selected are accepted
                bulkProgress.style.visibility = (hasAnySelection && !anyPendingSelected) ? 'visible' : 'hidden';
                bulkProgress.style.opacity = (hasAnySelection && !anyPendingSelected) ? '1' : '0';
                bulkProgress.disabled = !(hasAnySelection && !anyPendingSelected);
            }
            if (bulkProgressMobile) {
                if (getComputedStyle(bulkProgressMobile).display === 'none') bulkProgressMobile.style.display = 'inline-flex';
                bulkProgressMobile.style.visibility = (hasAnySelection && !anyPendingSelected) ? 'visible' : 'hidden';
                bulkProgressMobile.style.opacity = (hasAnySelection && !anyPendingSelected) ? '1' : '0';
                bulkProgressMobile.disabled = !(hasAnySelection && !anyPendingSelected);
            }
            // Ensure visibility sync each time state recalculated
            updateSelectAllVisibility(); // NEW

            // Mobile container: only show if status select is New & there is at least one selection
            try {
                const statusSel = document.getElementById('taskStatusSelect');
                const mobileContainer = document.getElementById('mobileBulkControls');
                if (statusSel && mobileContainer) {
                    const statusIsNew = statusSel.value === 'new_request';
                    if (statusIsNew && hasAnySelection) {
                        mobileContainer.style.display = 'flex';
                        mobileContainer.dataset.forcedShow = '1';
                    } else {
                        mobileContainer.style.display = 'none';
                        delete mobileContainer.dataset.forcedShow;
                    }
                }
            } catch(_) {}
        }

        // initialize bulk button hidden and disabled by default
        document.addEventListener('DOMContentLoaded', function(){
            const bulkAccept = document.getElementById('taskNewBulkAction');
            const bulkProgress = document.getElementById('taskNewBulkProgress');
            const bulkAcceptMobile = document.getElementById('taskNewBulkActionMobile');
            const bulkProgressMobile = document.getElementById('taskNewBulkProgressMobile');
            if (bulkAccept) {
                if (getComputedStyle(bulkAccept).display === 'none') bulkAccept.style.display = 'inline-flex';
                bulkAccept.style.visibility = 'hidden';
                bulkAccept.style.opacity = '0';
                bulkAccept.disabled = true;
            }
            if (bulkAcceptMobile) {
                if (getComputedStyle(bulkAcceptMobile).display === 'none') bulkAcceptMobile.style.display = 'inline-flex';
                bulkAcceptMobile.style.visibility = 'hidden';
                bulkAcceptMobile.style.opacity = '0';
                bulkAcceptMobile.disabled = true;
            }
            if (bulkProgress) {
                if (getComputedStyle(bulkProgress).display === 'none') bulkProgress.style.display = 'inline-flex';
                bulkProgress.style.visibility = 'hidden';
                bulkProgress.style.opacity = '0';
                bulkProgress.disabled = true;
            }
            if (bulkProgressMobile) {
                if (getComputedStyle(bulkProgressMobile).display === 'none') bulkProgressMobile.style.display = 'inline-flex';
                bulkProgressMobile.style.visibility = 'hidden';
                bulkProgressMobile.style.opacity = '0';
                bulkProgressMobile.disabled = true;
            }
            updateSelectAllVisibility(); // NEW
        });
    })();

    // Update visibility of arrow-forward icons in New Request column
    // When Select All is checked but any task still shows Accept button, hide the arrows.
    // Otherwise show arrows on cards that are accepted (i.e., do not have .btn-accept-invite).
    window.updateNewRequestArrowVisibility = function() {
        try {
            const desktopCheckbox = document.getElementById('taskNewAcceptAll');
            const mobileCheckbox = document.getElementById('taskNewAcceptAllMobile');
            const selectAllChecked = !!(desktopCheckbox && desktopCheckbox.checked) || !!(mobileCheckbox && mobileCheckbox.checked);

            // Determine selection set: if select-all checked => all cards; else selected thumbs only
            let selectedCards = [];
            if (selectAllChecked) {
                selectedCards = Array.from(document.querySelectorAll('#new-request-tasks .custom-card, #mobile-task-list .custom-card'));
            } else {
                const thumbs = Array.from(document.querySelectorAll('#new-request-tasks .task-selectable-thumb.selected, #mobile-task-list .task-selectable-thumb.selected'));
                selectedCards = thumbs.map(t => t.closest('.custom-card')).filter(Boolean);
            }

            const bulkAccept = document.getElementById('taskNewBulkAction');
            const bulkProgress = document.getElementById('taskNewBulkProgress');
            const bulkAcceptMobile = document.getElementById('taskNewBulkActionMobile');
            const bulkProgressMobile = document.getElementById('taskNewBulkProgressMobile');

            // No explicit selection => hide header icons
            if (!selectedCards || selectedCards.length === 0) {
                if (bulkAccept) { bulkAccept.style.display = 'inline-flex'; bulkAccept.style.visibility = 'hidden'; bulkAccept.style.opacity = '0'; bulkAccept.disabled = true; }
                if (bulkAcceptMobile) { bulkAcceptMobile.style.display = 'inline-flex'; bulkAcceptMobile.style.visibility = 'hidden'; bulkAcceptMobile.style.opacity = '0'; bulkAcceptMobile.disabled = true; }
                if (bulkProgress) { bulkProgress.style.display = 'inline-flex'; bulkProgress.style.visibility = 'hidden'; bulkProgress.style.opacity = '0'; bulkProgress.disabled = true; }
                if (bulkProgressMobile) { bulkProgressMobile.style.display = 'inline-flex'; bulkProgressMobile.style.visibility = 'hidden'; bulkProgressMobile.style.opacity = '0'; bulkProgressMobile.disabled = true; }
                return;
            }

            // Check if any selected card is still unaccepted (has Accept button)
            const anySelectedUnaccepted = selectedCards.some(card => !!card.querySelector('.btn-accept-invite'));

            if (anySelectedUnaccepted) {
                // show done_all (accept) and hide arrow (progress)
                if (bulkAccept) { bulkAccept.style.display = 'inline-flex'; bulkAccept.style.visibility = 'visible'; bulkAccept.style.opacity = '1'; bulkAccept.disabled = false; }
                if (bulkAcceptMobile) { bulkAcceptMobile.style.display = 'inline-flex'; bulkAcceptMobile.style.visibility = 'visible'; bulkAcceptMobile.style.opacity = '1'; bulkAcceptMobile.disabled = false; }
                if (bulkProgress) { bulkProgress.style.display = 'inline-flex'; bulkProgress.style.visibility = 'hidden'; bulkProgress.style.opacity = '0'; bulkProgress.disabled = true; }
                if (bulkProgressMobile) { bulkProgressMobile.style.display = 'inline-flex'; bulkProgressMobile.style.visibility = 'hidden'; bulkProgressMobile.style.opacity = '0'; bulkProgressMobile.disabled = true; }
                // Place the visible icon right before the select-all label (desktop)
                try {
                    const desktopLabel = document.querySelector('.new-request-container .task-selectall-toggle');
                    if (desktopLabel && bulkAccept && bulkAccept.parentNode && desktopLabel.parentNode) {
                        desktopLabel.parentNode.insertBefore(bulkAccept, desktopLabel);
                    }
                } catch(_) {}
                // Mobile placement inside mobileBulkControls
                try {
                    const mobileLabel = document.querySelector('#mobileBulkControls .task-selectall-toggle');
                    if (mobileLabel && bulkAcceptMobile && mobileLabel.parentNode) {
                        mobileLabel.parentNode.insertBefore(bulkAcceptMobile, mobileLabel);
                    }
                } catch(_) {}
            } else {
                // all selected are accepted -> show arrow (progress) only
                if (bulkProgress) { bulkProgress.style.display = 'inline-flex'; bulkProgress.style.visibility = 'visible'; bulkProgress.style.opacity = '1'; bulkProgress.disabled = false; }
                if (bulkProgressMobile) { bulkProgressMobile.style.display = 'inline-flex'; bulkProgressMobile.style.visibility = 'visible'; bulkProgressMobile.style.opacity = '1'; bulkProgressMobile.disabled = false; }
                if (bulkAccept) { bulkAccept.style.display = 'inline-flex'; bulkAccept.style.visibility = 'hidden'; bulkAccept.style.opacity = '0'; bulkAccept.disabled = true; }
                if (bulkAcceptMobile) { bulkAcceptMobile.style.display = 'inline-flex'; bulkAcceptMobile.style.visibility = 'hidden'; bulkAcceptMobile.style.opacity = '0'; bulkAcceptMobile.disabled = true; }
                // Place arrow icon right before the select-all label (desktop)
                try {
                    const desktopLabel = document.querySelector('.new-request-container .task-selectall-toggle');
                    if (desktopLabel && bulkProgress && desktopLabel.parentNode) {
                        desktopLabel.parentNode.insertBefore(bulkProgress, desktopLabel);
                    }
                } catch(_) {}
                // Mobile placement inside mobileBulkControls
                try {
                    const mobileLabel = document.querySelector('#mobileBulkControls .task-selectall-toggle');
                    if (mobileLabel && bulkProgressMobile && mobileLabel.parentNode) {
                        mobileLabel.parentNode.insertBefore(bulkProgressMobile, mobileLabel);
                    }
                } catch(_) {}
            }
        } catch(_) { /* noop */ }
    };

    // Function to setup dropdown event listeners for task cards
    function setupTaskDropdownListeners() {
        // Add a single delegated document click handler (bind once)
        if (!document._taskDropdownToggleHandlerBound) {
            document.addEventListener("click", function (e) {
                const icon = e.target.closest(".dropdown-icon");
                if (icon) {
                    // Toggle the dropdown menu next to the icon
                    const dropdownMenu = icon.nextElementSibling;
                    const isVisible = dropdownMenu && !dropdownMenu.classList.contains("d-none");

                    // Close all menus first
                    document.querySelectorAll(".dropdown-menu").forEach((menu) => menu.classList.add("d-none"));

                    // Open if it was not visible
                    if (dropdownMenu && !isVisible) {
                        dropdownMenu.classList.remove("d-none");
                    }

                    // Prevent any other document click handlers from immediately closing it
                    e.preventDefault();
                    e.stopPropagation();
                    if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
                    return;
                }

                // Click outside any dropdown menu closes all
                if (!e.target.closest(".dropdown-menu")) {
                    document.querySelectorAll(".dropdown-menu").forEach((menu) => menu.classList.add("d-none"));
                }
            });
            document._taskDropdownToggleHandlerBound = true;
        }

        // Open Modal from mode_comment icon click
        document.addEventListener("click", function (e) {
            $(document).on("hidden.bs.modal", "#taskFeedbackModal", function () {
                try {
                    // If suppression flag is set, do not remove the backdrop because we're swapping to another modal
                    if (window.__suppressFeedbackBackdropRemoval) return;
                } catch(_) {}
                $(".modal-backdrop").remove();
                $("body").removeClass("modal-open").css("overflow", "");
            });

            // (Opsional) kalau masih ada double backdrop pas buka, bersihin sisanya
            $(document).on("shown.bs.modal", "#taskFeedbackModal", function () {
                const backdrops = $(".modal-backdrop");
                if (backdrops.length > 1) {
                    backdrops.not(":first").remove();
                }
            });

            const icon = e.target.closest(".task-icon.mode_comment");
            if (icon) {
                const taskId = icon.dataset.taskId;
                // Set deep-link target to latest payload if available
                try {
                    window.__taskLatestTarget = window.__taskLatestTarget || {};
                    const latest = (window.__taskLatest && window.__taskLatest[String(taskId)]) || null;
                    if (latest) window.__taskLatestTarget[String(taskId)] = latest;
                } catch (_) {}
                markTaskFeedbacksRead(taskId).always(() => {
                    handleTaskFeedback(taskId);
                });
                return;
            }

            // Click on task title -> open detail modal
            const titleEl = e.target.closest('.task-title');
            if (titleEl) {
                // Find nearest task card and its id; if not in card (table/list view),
                // try to find enclosing table row with data-task-id.
                let taskId = null;
                const card = titleEl.closest('.custom-card');
                if (card) taskId = card.getAttribute('data-task-id');
                if (!taskId) {
                    const tr = titleEl.closest('tr[data-task-id]');
                    if (tr) taskId = tr.getAttribute('data-task-id');
                }
                if (taskId) {
                    try {
                        // If detail modal already open, hide it first to avoid duplicates
                        const detailModalEl = document.getElementById('taskDetailModal');
                        if (detailModalEl) {
                            const dm = bootstrap.Modal.getInstance(detailModalEl);
                            if (dm) dm.hide();
                        }
                    } catch(_) {}
                    try { handleTaskDetail(taskId); } catch(_) { /* noop */ }
                }
                return; // prevent other handlers from also reacting
            }
        });

        // Bind latest-feedback-snippet clicks
        document.querySelectorAll('.latest-feedback-snippet').forEach((el) => {
            if (el.dataset.bound === '1') return;
            el.dataset.bound = '1';
            el.addEventListener('click', function () {
                const taskId = this.getAttribute('data-task-id');
                hideLatestFeedbackSnippet(taskId);
                // Set deep-link target to latest payload if available
                try {
                    window.__taskLatestTarget = window.__taskLatestTarget || {};
                    const latest = (window.__taskLatest && window.__taskLatest[String(taskId)]) || null;
                    if (latest) window.__taskLatestTarget[String(taskId)] = latest;
                } catch (_) {}
                markTaskFeedbacksRead(taskId).always(() => {
                    handleTaskFeedback(taskId);
                });
            });
        });

        // Event listener for dropdown item clicks (bind once)
        if (!document._taskDropdownItemHandlerBound) {
            document.addEventListener("click", function (e) {
                if (e.target && e.target.classList.contains("dropdown-item")) {
                    // Check if this is a task card dropdown item (not executor dropdown)
                    const taskCard = e.target.closest(".custom-card");
                    const executorDropdown = e.target.closest(
                        "#executor_dropdown, #edit_executor_dropdown"
                    );

                    // If this is an executor dropdown item, ignore it
                    if (executorDropdown) {
                        return;
                    }

                    // If this is not from a task card, ignore it
                    if (!taskCard) {
                        return;
                    }

                    const text = e.target.textContent.trim();
                    const taskId = taskCard.getAttribute("data-task-id");

                    if (!taskId) {
                        try { showFloatingAlert("Task ID not found.", "warning", 3000); } catch(_) { try { alert("Task ID not found."); } catch(e){} }
                        return;
                    }

                    switch (text) {
                        case "Detail":
                            handleTaskDetail(taskId);
                            break;
                        case "Edit":
                            handleTaskEdit(taskId);
                            break;
                        case "Feedback":
                            // Set deep-link target to latest payload if available
                            try {
                                window.__taskLatestTarget = window.__taskLatestTarget || {};
                                const latest = (window.__taskLatest && window.__taskLatest[String(taskId)]) || null;
                                if (latest) window.__taskLatestTarget[String(taskId)] = latest;
                            } catch (_) {}
                            markTaskFeedbacksRead(taskId).always(() => {
                                handleTaskFeedback(taskId);
                            });
                            break;
                        case "mode_comment":
                            // Set deep-link target to latest payload if available
                            try {
                                window.__taskLatestTarget = window.__taskLatestTarget || {};
                                const latest = (window.__taskLatest && window.__taskLatest[String(taskId)]) || null;
                                if (latest) window.__taskLatestTarget[String(taskId)] = latest;
                            } catch (_) {}
                            markTaskFeedbacksRead(taskId).always(() => {
                                handleTaskFeedback(taskId);
                            });
                            break;
                        case "Progress":
                            handleTaskProgress(taskId, taskCard);
                            break;
                        case "Set to Complete":
                            handleTaskComplete(taskId, taskCard);
                            break;
                        case "Reject":
                            handleTaskReject(taskId, taskCard);
                            break;
                        case "Back to Request":
                            handleTaskBackToRequest(taskId, taskCard);
                            break;
                        case "Cancel":
                            handleTaskCancel(taskId, taskCard);
                            break;
                    }
                }
            });
            document._taskDropdownItemHandlerBound = true;
        }

        // Accept/Reject buttons for pending executor state (bind once globally)
        if (!document._taskPendingInviteHandlerBound) {
            document.addEventListener('click', function(e) {
                const acceptBtn = e.target.closest('.btn-accept-invite');
                if (acceptBtn) {
                    e.preventDefault();
                    const tId = acceptBtn.getAttribute('data-task-id');
                    if (!tId) return;
                    showAcceptInviteModal(tId);

                    setTimeout(() => {
                        window.updateNewRequestArrowVisibility();
                    }, 200);
                    return;
                }

                const rejectBtn = e.target.closest('.btn-cancel-invite');
                if (rejectBtn) {
                    e.preventDefault();
                    const tId = rejectBtn.getAttribute('data-task-id');
                    if (!tId) return;
                    showRejectInviteModal(tId);

                    setTimeout(() => {
                        window.updateNewRequestArrowVisibility();
                    }, 200);
                    return;
                }
            });
            document._taskPendingInviteHandlerBound = true;
        }

            // Approve/Reject buttons for PIC on Completed tasks (bind once globally)
            if (!document._taskCompletedApproveRejectHandlerBound) {
                document.addEventListener('click', function(e) {
                    const approveBtn = e.target.closest('.btn-approve-complete');
                    if (approveBtn) {
                        e.preventDefault();
                        const tId = approveBtn.getAttribute('data-task-id');
                        if (!tId) return;
                        const taskCard = approveBtn.closest('.custom-card') || document.querySelector('.custom-card[data-task-id="' + tId + '"]');
                        // Confirm and set status to finished (Approve)
                        showStatusModal(tId, taskCard, 'finished', 'Approve Task', 'Finished', 'Approve this task?');
                        return;
                    }

                    const rejBtn = e.target.closest('.btn-reject-complete');
                    if (rejBtn) {
                        e.preventDefault();
                        const tId = rejBtn.getAttribute('data-task-id');
                        if (!tId) return;
                        const taskCard = rejBtn.closest('.custom-card') || document.querySelector('.custom-card[data-task-id="' + tId + '"]');
                        // Confirm and set status to rejected (Reject)
                        showStatusModal(tId, taskCard, 'rejected', 'Reject', 'Rejected', 'Task has been rejected');
                        return;
                    }
                });
                document._taskCompletedApproveRejectHandlerBound = true;
            }
    }

    function handleTaskProgress(taskId, taskCard) {
        showStatusModal(taskId, taskCard, 'in_progress', 'Progress', 'In Progress', 'Task is being worked on');
    }

    // Function to handle task complete (in progress -> completed)
    function handleTaskComplete(taskId, taskCard) {
        showStatusModal(taskId, taskCard, 'completed', 'Set to Complete', 'Completed', 'Task has been finished');
    }

    // Function to handle task reject (completed -> rejected)
    function handleTaskReject(taskId, taskCard) {
        showStatusModal(taskId, taskCard, 'rejected', 'Reject', 'Rejected', 'Task has been rejected');
    }

    // Function to handle task back to request (in progress -> new request)
    function handleTaskBackToRequest(taskId, taskCard) {
        showStatusModal(taskId, taskCard, 'new_request', 'Back to Request', 'New Request', 'Task is back to new request');
    }

    function showStatusModal(taskId, taskCard, newStatus) {
        $.ajax({
            url: appUrl + "/task/" + taskId,
            type: "GET",
            dataType: "json",
            success: function (res) {
                const task = res.data || {};
                const taskTitle = task.title || "Untitled Task";
                const taskDescription = task.description || "No description available";
                const taskProject = task.project.title || "No Project";
                const taskImage = task.image ? `${appUrl}/file/task/${task.image}` : null;

                const initials = !taskImage ? getTaskInitials(task.title) : "";
                const initialsColor = !taskImage ? getRandomColorFromText(task.title) : "#6A5AE0";

                const avatarHtml = taskImage
                    ? `<img src="${taskImage}" class="rounded-circle" style="width:48px;height:48px;object-fit:cover;" onerror="this.onerror=null; this.src='${appUrl}/asset/img/avatar.png'">`
                    : `<div class="d-flex align-items-center justify-content-center rounded-circle"
                            style="width:34px;height:34px;font-size:12px;font-weight:600;color:#fff;background:${initialsColor};">
                            ${initials}
                    </div>`;

                document.getElementById("statusModalAvatar").innerHTML = avatarHtml;
                document.getElementById("statusModalPartofProject").innerHTML = taskProject;
                document.getElementById("statusModalTitle").textContent = taskTitle;
                document.getElementById("statusModalDescription").innerHTML = taskDescription;

                let confirmText = "Are you sure want to move this task?";
                if (newStatus === "in_progress") confirmText = "Are you sure want to move the task to Progress?";
                if (newStatus === "completed") confirmText = "Are you sure want to move the task to Completed?";
                if (newStatus === "rejected") confirmText = "Are you sure want to Reject this task?";
                if (newStatus === "finished") confirmText = "Are you sure want to Approve this task?";
                document.getElementById("statusModalConfirmText").textContent = confirmText;

                const confirmBtn = document.getElementById("statusModalConfirmBtn");
                confirmBtn.textContent = newStatus === "finished" ? "Approve" : "Confirm";

                const modalEl = new bootstrap.Modal(document.getElementById("statusConfirmModal"));
                modalEl.show();

                confirmBtn.onclick = function () {
                    updateTaskStatus(taskId, newStatus, taskCard);
                    modalEl.hide();
                };
            },
            error: function () {
                alert("Failed to load task details.");
            }
        });
    }

    // Bulk operation control flags
    let bulkStatusOperationActive = false;
    let bulkStatusSuppressRefresh = false;
    let bulkStatusPendingCount = 0;
    let bulkStatusCompletedCount = 0;
    let bulkStatusExpectedCount = 0;
    let bulkFinalStatusMessage = null;
    let bulkFinalAlertShown = false;

    // Universal update function
    function updateTaskStatus(taskId, newStatus, taskCard) {
        if (bulkStatusOperationActive) bulkStatusPendingCount++;
        return new Promise((resolve, reject) => {
            $.ajax({
                url: appUrl + "/task/" + taskId + "/status",
                type: "PUT",
                headers: {
                    "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]').getAttribute("content"),
                },
                data: { status: newStatus },
                success: function (response) {
                    const oldStatus = (taskCard && taskCard.getAttribute('data-task-status')) || null;
                    try {
                        if (taskCard) {
                            const tooltipTriggerList = [].slice.call(taskCard.querySelectorAll('[data-bs-toggle="tooltip"]'));
                            tooltipTriggerList.forEach(function (tooltipTriggerEl) {
                                const tooltipInstance = bootstrap.Tooltip.getInstance(tooltipTriggerEl);
                                if (tooltipInstance) tooltipInstance.dispose();
                            });
                            taskCard.remove();
                        }
                    } catch(_) {}

                    if (!bulkStatusSuppressRefresh) {
                        (function insertUpdatedTask() {
                            $.ajax({
                                url: appUrl + '/task/' + taskId,
                                type: 'GET',
                                dataType: 'json'
                            }).done(function(res) {
                                const t = (res && (res.data || res)) || null;
                                if (!t) { try { fetchAndRenderTasks(); } catch(_) {} return; }

                                const destKey = (String(newStatus || '').toLowerCase().includes('reject')) ? 'in_progress' : String(newStatus || '').toLowerCase();
                                const destContainerId = sectionMap[destKey] || sectionMap['in_progress'];
                                const destContainer = document.getElementById(destContainerId);

                                try { document.querySelectorAll('.custom-card[data-task-id="' + taskId + '"]').forEach(n => n.remove()); } catch(_) {}

                                if (destContainer) {
                                    try {
                                        const normalized = Object.assign({}, t);
                                        normalized.project_title = (t.project && t.project.title) ? t.project.title : (t.project_title || '');
                                        normalized.project_id = (t.project && t.project.id) ? t.project.id : (t.project_id || null);
                                        normalized.project_image = (t.project && t.project.image) ? t.project.image : (t.project_image || null);
                                        normalized.pic = t.pic || normalized.pic || null;
                                        normalized.executors = Array.isArray(t.executors) ? t.executors : (normalized.executors || []);
                                        normalized.feedback_comments_count = t.feedback_comments_count || normalized.feedback_comments_count || 0;
                                        normalized.reference_files_count = (Array.isArray(t.reference_files) ? t.reference_files.length : (t.reference_files_count || 0));

                                        const clientMap = window.__clientArchivedTasks || new Map();
                                        const idKey = String(normalized.id || normalized.task_id || '');
                                        if (idKey && clientMap && clientMap.has(idKey)) {
                                            if (!(__isCompletedOlderThanDaysGlobal(normalized, 90))) {
                                                clientMap.delete(idKey);
                                            }
                                        }

                                        destContainer.insertAdjacentHTML('afterbegin', createTaskCard(normalized));
                                    } catch (e) {
                                        try { fetchAndRenderTasks(); } catch(_) {}
                                        return;
                                    }
                                } else {
                                    try { fetchAndRenderTasks(); } catch(_) {}
                                    return;
                                }

                                try {
                                    ['new_request','in_progress','completed','finished'].forEach(k => {
                                        if (allTasksCache[k] && Array.isArray(allTasksCache[k].tasks)) {
                                            allTasksCache[k].tasks = allTasksCache[k].tasks.filter(x => String(x.id) !== String(taskId));
                                        }
                                    });
                                    if (!allTasksCache[destKey]) allTasksCache[destKey] = { tasks: [], pagination: {} };
                                    if (allTasksCache[destKey] && Array.isArray(allTasksCache[destKey].tasks)) {
                                        allTasksCache[destKey].tasks.unshift(t);
                                    }
                                } catch(_) {}

                                try { ensureRejectedCardsPlaced(); } catch(_) {}
                                try { initBootstrapTooltips(destContainer); addAttachFileIconListeners(); scheduleRefreshLatestFeedbackSnippets(); } catch(_) {}
                            }).fail(function() {
                                try { fetchAndRenderTasks(); } catch(_) {}
                            });
                        })();
                    }

                    try {
                        const mobileStatusSel = document.getElementById('taskStatusSelect');
                        if (mobileStatusSel) {
                            const currentMobileStatus = mobileStatusSel.value;
                            const destStatus = String(newStatus);
                            const sourceStatus = oldStatus ? String(oldStatus).toLowerCase() : null;
                            const needsRefreshCurrent = (currentMobileStatus === destStatus) || (sourceStatus && currentMobileStatus === sourceStatus);
                            const statusesToRefresh = new Set();
                            if (sourceStatus) statusesToRefresh.add(sourceStatus);
                            statusesToRefresh.add(destStatus);
                            statusesToRefresh.forEach(st => {
                                if (typeof mobileState !== 'undefined') {
                                    const prevActive = (st === currentMobileStatus);
                                    mobileState.page = 1; mobileState.last = 1; mobileState.status = prevActive ? currentMobileStatus : st;
                                }
                                try { fetchMobileTasks(st, 1, false, { prefetch: true }); } catch(_) {}
                            });
                            if (typeof mobileState !== 'undefined') mobileState.status = currentMobileStatus;
                            if (needsRefreshCurrent) {
                                try { const list = document.getElementById('mobile-task-list'); if (list) list.scrollTop = 0; } catch(_) {}
                            }
                        }
                    } catch(_) {}

                    if (bulkStatusOperationActive) {
                        bulkStatusCompletedCount++;
                        if (!bulkFinalStatusMessage) bulkFinalStatusMessage = response.message || 'Task status updated successfully';
                        const totalExpected = bulkStatusExpectedCount || bulkStatusPendingCount;
                        if (!bulkFinalAlertShown && totalExpected > 0 && bulkStatusCompletedCount === totalExpected) {
                            bulkFinalAlertShown = true;
                            fetchAndRenderTasks();
                            showFloatingAlert(bulkFinalStatusMessage, 'success');
                            bulkStatusPendingCount = 0;
                            bulkStatusCompletedCount = 0;
                            bulkStatusExpectedCount = 0;
                            bulkFinalStatusMessage = null;
                        }
                    } else {
                        showFloatingAlert(response.message || 'Task status updated successfully', 'success');
                    }

                    resolve();
                },
                error: function (xhr) {
                    let errorMessage = "Failed to update task status.";
                    if (xhr.responseJSON && xhr.responseJSON.message) errorMessage = xhr.responseJSON.message;
                    if (xhr.responseJSON && xhr.responseJSON.errors) errorMessage = Object.values(xhr.responseJSON.errors).join(", ");
                    showFloatingAlert(errorMessage, "danger");
                    if (bulkStatusOperationActive) {
                        bulkStatusCompletedCount++;
                        const totalExpected = bulkStatusExpectedCount || bulkStatusPendingCount;
                        if (!bulkFinalAlertShown && totalExpected > 0 && bulkStatusCompletedCount === totalExpected) {
                            bulkFinalAlertShown = true;
                            if (!bulkFinalStatusMessage) bulkFinalStatusMessage = 'Bulk update finished (with some errors)';
                            fetchAndRenderTasks();
                        }
                    }
                    reject(errorMessage);
                },
            });
        });
    }

    function fetchAndInsertTask(taskId) {
        if (!taskId) return;
        $.ajax({
            url: appUrl + '/task/' + taskId,
            type: 'GET',
            dataType: 'json'
        }).done(function(res){
            const t = (res && (res.data || res)) || null;
            if (!t) {
                try { fetchAndRenderTasks(); } catch(_) {}
                return;
            }

            const normalized = Object.assign({}, t);
            try {
                normalized.project_title = (t.project && t.project.title) ? t.project.title : (t.project_title || '');
                normalized.project_id = (t.project && t.project.id) ? t.project.id : (t.project_id || null);
                normalized.project_image = (t.project && t.project.image) ? t.project.image : (t.project_image || null);
                normalized.pic = t.pic || normalized.pic || null;
                normalized.executors = Array.isArray(t.executors) ? t.executors : (normalized.executors || []);
                normalized.feedback_comments_count = t.feedback_comments_count || normalized.feedback_comments_count || 0;
                normalized.reference_files_count = (Array.isArray(t.reference_files) ? t.reference_files.length : (t.reference_files_count || 0));
            } catch(_) {}

            // Remove from client archive buffer if it's no longer older than threshold
            try {
                const clientMap = window.__clientArchivedTasks || new Map();
                const idKey = String(normalized.id || normalized.task_id || '');
                if (idKey && clientMap && clientMap.has(idKey)) {
                    try {
                        if (!(__isCompletedOlderThanDaysGlobal(normalized, 90))) {
                            clientMap.delete(idKey);
                            console.debug('[archive-client] removed id from buffer before edit-insert:', idKey);
                        }
                    } catch(_) {}
                }
            } catch(_) {}

            const destKey = (String(normalized.status || '').toLowerCase().includes('reject')) ? 'in_progress' : String(normalized.status || '').toLowerCase();
            const destContainerId = sectionMap[destKey] || sectionMap['in_progress'];
            const destContainer = document.getElementById(destContainerId);

            // Remove duplicates then insert
            try { document.querySelectorAll('.custom-card[data-task-id="' + taskId + '"]').forEach(n => n.remove()); } catch(_) {}

            if (destContainer) {
                try {
                    destContainer.insertAdjacentHTML('afterbegin', createTaskCard(normalized));
                } catch (e) {
                    try { fetchAndRenderTasks(); } catch(_) {}
                    return;
                }
            } else {
                try { fetchAndRenderTasks(); } catch(_) {}
                return;
            }

            // Update client-side cache: remove from other buckets and add to destination
            try {
                ['new_request','in_progress','completed'].forEach(k => {
                    if (allTasksCache[k] && Array.isArray(allTasksCache[k].tasks)) {
                        allTasksCache[k].tasks = allTasksCache[k].tasks.filter(x => String(x.id) !== String(taskId));
                    }
                });
                if (!allTasksCache[destKey]) allTasksCache[destKey] = { tasks: [], pagination: {} };
                if (allTasksCache[destKey] && Array.isArray(allTasksCache[destKey].tasks)) {
                    allTasksCache[destKey].tasks.unshift(t);
                }
            } catch(_) {}

            try { ensureRejectedCardsPlaced(); } catch(_) {}
            try { initBootstrapTooltips(destContainer); addAttachFileIconListeners(); scheduleRefreshLatestFeedbackSnippets(); } catch(_) {}
        }).fail(function(){
            try { fetchAndRenderTasks(); } catch(_) {}
        });
    }

    (function enableKanbanDnD() {
        const colToStatus = {
            'new-request-tasks': 'new_request',
            'in-progress-tasks': 'in_progress',
            'completed-tasks': 'completed',
            'finished-tasks': 'finished',
        };

        const SCALE = 1;

        if (!$('#kanban-drag-layer').length) {
            $('body').append('<div id="kanban-drag-layer"></div>');
        }

        $(function() {
            $('#new-request-tasks, #in-progress-tasks, #completed-tasks, #finished-tasks').addClass('kanban-droppable');
        });

        let kanbanDrag = null;
        let $clone = null;
        let offsetX = 0;
        let offsetY = 0;
        let lastX = 0;
        let isDragging = false;

        function normStatus(s) {
            s = String(s || '').toLowerCase();
            if (s === 'in progress') return 'in_progress';
            if (s === 'new request') return 'new_request';
            if (s === 'finished') return 'finished';
            return s;
        }

        function mapTransition(fromStatus, toStatus) {
            fromStatus = normStatus(fromStatus);
            toStatus = normStatus(toStatus);
            if (fromStatus === toStatus) return { allowed: false };
            if (fromStatus === 'rejected') {
                if (toStatus === 'completed') return { allowed: true, newStatus: 'completed' };
                return { allowed: false };
            }
            if (fromStatus === 'new_request') {
                if (toStatus === 'in_progress') return { allowed: true, newStatus: 'in_progress' };
                return { allowed: false };
            }
            if (fromStatus === 'in_progress') {
                if (toStatus === 'new_request') return { allowed: true, newStatus: 'new_request' };
                if (toStatus === 'completed') return { allowed: true, newStatus: 'completed' };
                return { allowed: false };
            }
            if (fromStatus === 'completed') {
                if (toStatus === 'in_progress') return { allowed: true, newStatus: 'rejected' };
                if (toStatus === 'finished') return { allowed: true, newStatus: 'finished' }
                return { allowed: false };
            }
            return { allowed: false };
        }

        function clearDropHighlights() {
            $('.kanban-droppable').removeClass('kanban-allowed kanban-denied kanban-over');
            $('#custom-card').removeClass('dragging');
        }

        function refreshDropHighlights() {
            if (!kanbanDrag) return;
            Object.keys(colToStatus).forEach(function(colId) {
                const $col = $('#' + colId);
                const toStatus = colToStatus[colId];
                const m = mapTransition(kanbanDrag.fromStatus, toStatus);
                $col.toggleClass('kanban-allowed', !!m.allowed);
                $col.toggleClass('kanban-denied', !m.allowed && $col.hasClass('kanban-over'));
            });
        }

        // === MOUSE EVENTS ===
        $(document).on('mousedown', '#custom-card', function(e) {
            if (e.which !== 1) return; // kiri mouse

            // Do not initialize kanban drag when the card is inside a modal (e.g. archive modal)
            // Cards rendered inside modals should be non-interactive for dragging.
            try {
                if ($(this).closest('.modal').length) return;
            } catch (_) {}

            e.preventDefault();

            const $card = $(this);
            const id = $card.data('task-id');
            const fromStatus = normStatus($card.data('task-status'));
            const rect = $card[0].getBoundingClientRect();

            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;

            kanbanDrag = { id: id, fromStatus: fromStatus, $card: $card, startX: e.clientX, startY: e.clientY };
            isDragging = false;
            lastX = e.clientX;

            $card.addClass('dragging');
            $('body').addClass('no-select');
        });

        $(document).on('mousemove', function(e) {
            if (!kanbanDrag) return;

            if (!isDragging && Math.abs(e.clientX - kanbanDrag.startX) + Math.abs(e.clientY - kanbanDrag.startY) < 5) return;

            if (!isDragging) {
                isDragging = true;
                $clone = kanbanDrag.$card.clone().addClass('dragging-clone');
                $('#kanban-drag-layer').append($clone);
                const rect = kanbanDrag.$card[0].getBoundingClientRect();
                const scaledOffsetX = offsetX * SCALE;
                const scaledOffsetY = offsetY * SCALE;
                const initialTop = e.clientY - scaledOffsetY;
                const initialLeft = e.clientX - scaledOffsetX;

                $clone.css({
                    position: 'fixed',
                    top: initialTop + 'px',
                    left: initialLeft + 'px',
                    width: rect.width + 'px',
                    height: rect.height + 'px',
                    margin: 0,
                    transform: `scale(${SCALE}) rotate(0deg)`,
                    zIndex: 99999,
                    pointerEvents: 'none'
                });

                kanbanDrag.$card.css('opacity', 0.5);
            } else {
                const scaledOffsetX = offsetX * SCALE;
                const scaledOffsetY = offsetY * SCALE;
                $clone.css({
                    top: (e.clientY - scaledOffsetY) + 'px',
                    left: (e.clientX - scaledOffsetX) + 'px'
                });

                const dx = e.clientX - lastX;
                lastX = e.clientX;
                const rotation = Math.max(-6, Math.min(6, dx / 4));
                $clone.css('transform', `scale(${SCALE}) rotate(${rotation}deg)`);
            }

            const $targetCol = $(document.elementFromPoint(e.clientX, e.clientY)).closest('.kanban-droppable');
            clearDropHighlights();
            if ($targetCol.length) {
                $targetCol.addClass('kanban-over');
                refreshDropHighlights();
            } else {
                refreshDropHighlights();
            }
        });

        $(document).on('mouseup', function(e) {
            if (!kanbanDrag) return;

            $('body').removeClass('no-select');

            if (!isDragging) {
                kanbanDrag = null;
                return;
            }

            const $targetCol = $(document.elementFromPoint(e.clientX, e.clientY)).closest('.kanban-droppable');
            const toStatus = $targetCol.length ? colToStatus[$targetCol.attr('id')] : null;
            const m = mapTransition(kanbanDrag.fromStatus, toStatus);
            const taskId = kanbanDrag.id;

            if ($targetCol.length && m.allowed) {
                if (m.newStatus === 'completed') {
                    try { showConfirmationToCompleteModal(taskId, kanbanDrag.$card[0]); }
                    catch (err) { try { updateTaskStatus(taskId, 'completed', kanbanDrag.$card[0]); } catch (_) {} }
                } else {
                    try { updateTaskStatus(taskId, m.newStatus, kanbanDrag.$card[0]); } catch (_) {}
                }
            }

            kanbanDrag.$card.removeClass('dragging').css({ opacity: 1, transform: 'scale(1) rotate(0deg)' });
            if ($clone) { $clone.remove(); $clone = null; }

            kanbanDrag = null;
            isDragging = false;
            lastX = 0;
            clearDropHighlights();
        });
    })();

    // NEW: Bulk Progress All (across cached pages) when master checkbox is checked and user presses a dedicated trigger
    document.addEventListener('click', function(e){
        const trigger = e.target.closest('#taskNewBulkProgressAll');
        if (!trigger) return;
        // Ensure we have cache
        if (!allTasksCache || !allTasksCache.new_request || !Array.isArray(allTasksCache.new_request.tasks)) return;
        const allTasks = allTasksCache.new_request.tasks;
        // Filter only tasks that are already accepted by viewer (no Accept button scenario) => backend already marks is_receive; we rely on executors list
        const movable = allTasks.filter(t => {
            // viewer pending executor? skip
            return !isViewerPendingExecutor(t);
        });
        if (movable.length === 0) return;
    bulkStatusOperationActive = true;
    bulkStatusSuppressRefresh = true; // avoid intermediate refreshes
    bulkStatusPendingCount = 0;
    bulkStatusCompletedCount = 0;
    bulkStatusExpectedCount = movable.length;
    bulkFinalStatusMessage = null;
    bulkFinalAlertShown = false;
        // Kick sequential chain to avoid server overload
        let chain = Promise.resolve();
        movable.forEach(t => {
            chain = chain.then(() => updateTaskStatus(t.id, 'in_progress', document.querySelector(`#new-request-tasks .custom-card[data-task-id="${t.id}"]`))
                .then(()=> new Promise(r=> setTimeout(r,60))));
        });
        chain.finally(() => {
            bulkStatusOperationActive = false;
            bulkStatusSuppressRefresh = false;
            const master = document.getElementById('taskNewAcceptAll');
            if (master) master.checked = false;
            document.querySelectorAll('#new-request-tasks .task-selectable-thumb.selected').forEach(el => el.classList.remove('selected'));
            // Aggregator already refreshed & alerted; nothing more here.
        });
    });

    // Function to show alert using Settings/Project style (office.js -> showAlertMsg)
    function showFloatingAlert(message, type = "success", delayMs = 2500) {
        // Normalize to Settings types: 'light' | 'success' | 'warning' | 'error'
        // Use 'light' for success/neutral to match Settings & Project usage
        const mapped = type === 'danger' ? 'error'
                     : type === 'error' ? 'error'
                     : type === 'warning' ? 'warning'
                     : 'light';

        if (typeof window.showAlertMsg === 'function') {
            window.showAlertMsg(String(message || ''), mapped, delayMs);
        }
        // No browser alert fallback to keep UX consistent with Settings
    }

    // Track whether feedback was submitted
    let feedbackSubmitted = false;

    // Add event listener for modal close to handle conditional reload
    document.addEventListener('DOMContentLoaded', function () {
        const feedbackModalEl = document.getElementById("taskFeedbackModal");
        if (feedbackModalEl) {
            feedbackModalEl.addEventListener('hidden.bs.modal', function () {
                // Store the current state before resetting
                const wasSubmitted = feedbackSubmitted;

                if (feedbackSubmitted) {
                    // Reload the page only if feedback was submitted
                    window.location.reload();
                    return; // Exit early if reloading
                }

                // Reset feedback submission state
                feedbackSubmitted = false;

                // Handle timeline modal restoration logic for feedback modal
                const detailEl = document.getElementById('taskDetailModal');
                if (detailEl) {
                    // Clear the child opened flag
                    detailEl.removeAttribute('data-child-opened');

                    // Check if we should show the detail modal back
                    if (detailEl.getAttribute('data-reopen-timeline') === '1') {
                        // Show detail modal back first
                        const detailModal = bootstrap.Modal.getInstance(detailEl) || new bootstrap.Modal(detailEl);
                        detailModal.show();

                        // Restore the backed up timeline handler if it exists
                        if (detailEl._timelineHiddenHandlerBackup) {
                            detailEl._timelineHiddenHandler = detailEl._timelineHiddenHandlerBackup;
                            detailEl.addEventListener('hidden.bs.modal', detailEl._timelineHiddenHandler);
                            detailEl._timelineHiddenHandlerBackup = null;
                        } else {
                            // Create fresh one-time listener to reopen timeline when detail is closed
                            const onDetailHiddenAfterFeedback = function() {
                                if (detailEl.getAttribute('data-reopen-timeline') === '1') {
                                    const timelineEl = document.getElementById('timelineModal');
                                    if (timelineEl) {
                                        const tlInstance = bootstrap.Modal.getInstance(timelineEl) || new bootstrap.Modal(timelineEl);
                                        tlInstance.show();
                                        detailEl.removeAttribute('data-reopen-timeline');
                                    }
                                }
                                // Clear the reference
                                detailEl._timelineHiddenHandler = null;
                            };

                            // Store and attach the handler
                            detailEl._timelineHiddenHandler = onDetailHiddenAfterFeedback;
                            detailEl.addEventListener('hidden.bs.modal', onDetailHiddenAfterFeedback, { once: true });
                        }
                    } else {
                        // If not showing detail modal back, restore the backed up handler anyway
                        if (detailEl._timelineHiddenHandlerBackup) {
                            detailEl._timelineHiddenHandler = detailEl._timelineHiddenHandlerBackup;
                            detailEl.addEventListener('hidden.bs.modal', detailEl._timelineHiddenHandler);
                            detailEl._timelineHiddenHandlerBackup = null;
                        }
                    }
                }
            });
        }
    });

    // Add event listener for reference files modal close
    document.addEventListener('DOMContentLoaded', function () {
        const referenceFilesModalEl = document.getElementById("referenceFilesModal");
        if (referenceFilesModalEl) {
            referenceFilesModalEl.addEventListener('hidden.bs.modal', function () {
                // Handle timeline modal restoration logic for reference files modal
                const detailEl = document.getElementById('taskDetailModal');
                if (detailEl) {
                    // Clear the child opened flag
                    detailEl.removeAttribute('data-child-opened');

                    // Check if we should show the detail modal back
                    if (detailEl.getAttribute('data-reopen-timeline') === '1') {
                        // Show detail modal back first
                        const detailModal = bootstrap.Modal.getInstance(detailEl) || new bootstrap.Modal(detailEl);
                        detailModal.show();

                        // Restore the backed up timeline handler if it exists
                        if (detailEl._timelineHiddenHandlerBackup) {
                            detailEl._timelineHiddenHandler = detailEl._timelineHiddenHandlerBackup;
                            detailEl.addEventListener('hidden.bs.modal', detailEl._timelineHiddenHandler);
                            detailEl._timelineHiddenHandlerBackup = null;
                        } else {
                            // Create fresh one-time listener to reopen timeline when detail is closed
                            const onDetailHiddenAfterRefFiles = function() {
                                if (detailEl.getAttribute('data-reopen-timeline') === '1') {
                                    const timelineEl = document.getElementById('timelineModal');
                                    if (timelineEl) {
                                        const tlInstance = bootstrap.Modal.getInstance(timelineEl) || new bootstrap.Modal(timelineEl);
                                        tlInstance.show();
                                        detailEl.removeAttribute('data-reopen-timeline');
                                    }
                                }
                                // Clear the reference
                                detailEl._timelineHiddenHandler = null;
                            };

                            // Store and attach the handler
                            detailEl._timelineHiddenHandler = onDetailHiddenAfterRefFiles;
                            detailEl.addEventListener('hidden.bs.modal', onDetailHiddenAfterRefFiles, { once: true });
                        }
                    } else {
                        // If not showing detail modal back, restore the backed up handler anyway
                        if (detailEl._timelineHiddenHandlerBackup) {
                            detailEl._timelineHiddenHandler = detailEl._timelineHiddenHandlerBackup;
                            detailEl.addEventListener('hidden.bs.modal', detailEl._timelineHiddenHandler);
                            detailEl._timelineHiddenHandlerBackup = null;
                        }
                    }
                }
            });
        }
    });

    // Function to handle task feedback
    // function handleTaskFeedback(taskId) {
    //     // Reset feedback submission state
    //     feedbackSubmitted = false;

    //     // Show the feedback modal
    //     const feedbackModalEl = document.getElementById("taskFeedbackModal");
    //     const feedbackModal = new bootstrap.Modal(feedbackModalEl);

    //     // Set task ID on modal
    //     feedbackModalEl.dataset.taskId = taskId;

    //     // Load feedback data (kosongan dulu)
    // loadTaskFeedbackData(taskId);

    // // Hide unread badge and latest feedback snippet immediately upon opening
    // hideUnreadBadge(taskId);
    // hideLatestFeedbackSnippet(taskId);

    //     feedbackModal.show();

    //     document.querySelectorAll('.modal-backdrop').forEach((el, idx, arr) => {
    //         if (idx < arr.length - 1) el.remove();
    //     });
    // }

    // Unread feedback badge helpers
    function setUnreadBadge(taskId, count) {
        const card = document.querySelector(`.custom-card[data-task-id="${taskId}"]`);
        if (!card) return;
        const badge = card.querySelector(`.unread-badge[data-task-id="${taskId}"]`);
        if (!badge) return;
        const n = parseInt(count, 10) || 0;
        if (n > 0) badge.classList.remove('d-none');
        else badge.classList.add('d-none');
    }
    function hideUnreadBadge(taskId) {
        setUnreadBadge(taskId, 0);
    }
    // (removed: older fetchLatestFeedback without abort). See throttled version below.
    function refreshAllUnreadBadges() {
        // Jadwalkan penyegaran snippet/unread secara terpusat
        scheduleRefreshLatestFeedbackSnippets();
    }
    // Track snippet fetch sequence per task to ignore stale responses
    const latestSnippetSeq = {};

    function markTaskFeedbacksRead(taskId) {
        return $.ajax({
            url: appUrl + `/task/${taskId}/feedbacks/mark-read`,
            type: 'POST',
            headers: {
                "X-CSRF-TOKEN": document
                    .querySelector('meta[name="csrf-token"]')
                    .getAttribute("content"),
            },
        }).always(() => {
            hideUnreadBadge(taskId);
            hideLatestFeedbackSnippet(taskId);
            // Invalidate any in-flight latest snippet fetches
            latestSnippetSeq[taskId] = (latestSnippetSeq[taskId] || 0) + 1;
        });
    }

    // Latest feedback snippet helpers
    function hideLatestFeedbackSnippet(taskId) {
        const els = document.querySelectorAll(`.latest-feedback-snippet[data-task-id="${taskId}"]`);
        els.forEach((el) => {
            el.classList.add('d-none');
            el.style.display = 'none';
            const textEl = el.querySelector('.latest-feedback-text');
            if (textEl) textEl.textContent = '';
        });
    }
    function setLatestFeedbackSnippet(taskId, data) {
        const els = document.querySelectorAll(`.latest-feedback-snippet[data-task-id="${taskId}"]`);
        if (!els || els.length === 0) return;
        if (!data) {
            hideLatestFeedbackSnippet(taskId);
            return;
        }
    const photo = (data.employee && data.employee.photo) ? data.employee.photo : (appUrl + '/asset/img/avatar.png');
        const raw = String(data.feedback_comment || '');
        const truncated = raw.length > 10 ? (raw.slice(0, 10) + '...') : raw;
        els.forEach((el) => {
            const avatar = el.querySelector('.latest-feedback-avatar');
            const textEl = el.querySelector('.latest-feedback-text');
            if (avatar) avatar.src = photo;
            if (textEl) textEl.textContent = truncated;
            el.classList.remove('d-none');
            el.style.removeProperty('display');
        });
    }
    // Keep only one in-flight latest feedback request; abort older (keyed by ids set)
    let __latestFeedbackXHR = window.__latestFeedbackXHR || null;
    let __latestFeedbackKey = window.__latestFeedbackKey || '';
    function fetchLatestFeedback(taskIds) {
        if (!taskIds.length) return;

        // Deduplicate and normalize IDs once here
        const uniqueIds = Array.from(new Set((taskIds || []).map(id => String(id))));

        // Build a stable key for the current request (sorted ids)
        const idsKey = uniqueIds.slice().sort().join(',');

        // If an identical request is already in-flight, just return it
        try {
            if (__latestFeedbackXHR && __latestFeedbackKey === idsKey && __latestFeedbackXHR.readyState && __latestFeedbackXHR.readyState !== 4) {
                return __latestFeedbackXHR;
            }
        } catch(_) {}

        // Different request incoming: abort the previous
        try { if (__latestFeedbackXHR && typeof __latestFeedbackXHR.abort === 'function') __latestFeedbackXHR.abort(); } catch(_) {}

        __latestFeedbackXHR = $.ajax({
            url: appUrl + "/task-feedbacks/latest",
            type: "GET",
            dataType: "json",
            traditional: true, // penting buat serialize array jadi ids[]=1&ids[]=2
            data: { ids: uniqueIds },
        }).then((res) => {
            const map = res.data || {};
            uniqueIds.forEach((tid) => {
                setLatestFeedbackSnippet(tid, map[tid] || null);
            });
        }).catch(() => {
            uniqueIds.forEach((tid) => setLatestFeedbackSnippet(tid, null));
        });

        // store on window for next call
        try { window.__latestFeedbackXHR = __latestFeedbackXHR; window.__latestFeedbackKey = idsKey; } catch(_) {}
        return __latestFeedbackXHR;
    }
    // Scheduler batching for latest feedback to ensure only one request fires rapidly
    let __latestRefreshTimer = null;
    function scheduleRefreshLatestFeedbackSnippets(delayMs = 50){
        if (__latestRefreshTimer) {
            clearTimeout(__latestRefreshTimer);
        }
        __latestRefreshTimer = setTimeout(() => {
            __latestRefreshTimer = null;
            const nodes = Array.from(document.querySelectorAll('.custom-card[data-task-id]'));
            const ids = nodes.map(card => card.getAttribute('data-task-id')).filter(Boolean);
            const uniqueIds = Array.from(new Set(ids));
            fetchLatestFeedback(uniqueIds || []);
        }, delayMs);
    }

    function refreshAllLatestFeedbackSnippets() {
        scheduleRefreshLatestFeedbackSnippets(10);
    }

    // Helper: show delete confirmation modal (Bootstrap) with avatar, content and confirm/cancel
    function showDeleteConfirmModal(opts) {
        // opts: { type: 'feedback'|'reply'|'reference_file', id, parentId?, avatarUrl?, authorName?, content?, parentModalId?, parentModalEl?, onConfirm: function(done){} }
        try {
            const id = opts.id;
            const type = opts.type || 'feedback';
            const avatarUrl = opts.avatarUrl || '';
            const authorName = opts.authorName || '';
            const content = opts.content || '';
            const modalId = 'deleteConfirmModal_' + (type || 'f') + '_' + id + '_' + Date.now();

            const avatarHtml = avatarUrl ? `<img src="${avatarUrl}" class="rounded-circle" style="width:48px;height:48px;object-fit:cover;" onerror="this.onerror=null;this.src='${appUrl}/asset/img/avatar.png'">` :
                `<div class="rounded-circle d-flex align-items-center justify-content-center" style="width:48px;height:48px;background:#6A5AE0;color:#fff;font-weight:600;font-size:16px;">${(authorName || '').split(' ').map(s=>s[0]||'').slice(0,2).join('').toUpperCase() || 'NA'}</div>`;

            let title = '';
            let confirmText = '';
            if (type === 'reply') {
                title = 'Delete reply';
                confirmText = 'Are you sure you want to delete this reply?';
            } else if (type === 'reference_file') {
                title = 'Delete reference file';
                // Exact text requested by user
                confirmText = 'Are you sure want to delete this reference file?';
            } else {
                title = 'Delete feedback';
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

            // If a parent modal is provided in opts, hide it first so delete modal appears alone.
            const parentModalEl = (function(){
                try {
                    if (opts.parentModalEl) return opts.parentModalEl;
                    if (opts.parentModalId) return document.getElementById(opts.parentModalId);
                } catch(_) {}
                try { return document.getElementById('taskFeedbackModal'); } catch(_) { return null; }
            })();
            let _parentWasOpen = false;
            let _parentModalInstance = null;
            try {
                if (parentModalEl && parentModalEl.classList.contains('show')) {
                    _parentWasOpen = true;
                    _parentModalInstance = bootstrap.Modal.getInstance(parentModalEl) || new bootstrap.Modal(parentModalEl);
                    // Set global suppression so hidden handler doesn't remove the backdrop while we swap modals
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
                // If we previously hid the parent feedback modal, show it again
                try {
                    if (_parentWasOpen && _parentModalInstance) {
                        // clear suppression before re-showing so hidden handler resumes normal behavior
                        try { window.__suppressFeedbackBackdropRemoval = false; } catch(_) {}
                        // small delay to allow modal hide animation to finish
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
                    // Provide a done callback the caller must call when finished (success or error)
                    if (typeof opts.onConfirm === 'function') {
                        try {
                            opts.onConfirm(function doneFn(shouldClose){
                                // shouldClose default true
                                if (shouldClose === false) {
                                    confirmBtn.disabled = false; confirmBtn.innerHTML = 'Delete';
                                    return;
                                }
                                cleanup();
                            });
                        } catch (e) {
                            // onConfirm threw
                            confirmBtn.disabled = false; confirmBtn.innerHTML = 'Delete';
                        }
                    } else {
                        cleanup();
                    }
                });
            }
        } catch (e) { console.warn('showDeleteConfirmModal error', e); }
    }

    // Utility to escape HTML
    function escapeHtml(str) {
        return String(str || '').replace(/[&<>"]+/g, function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]) || m; });
    }

    // timeAgo helper (human readable relative time)
    function timeAgo(createdAt){
        try {
            const time = new Date(createdAt);
            const now = new Date();
            const diff = (now.getTime() - time.getTime()) / 1000;

            if(diff < 60){
                return 'just now';
            }else if(diff < 3600){
                return Math.round(diff/60)+' minute ago';
            }else if(diff < 86400){
                return Math.round(diff/3600)+' hour ago';
            }else if(diff < 604800){
                return Math.round(diff/86400)+' day ago';
            }else if(diff < 2592000){
                return Math.round(diff/604800)+' week ago';
            }else if(diff < 31526000){
                return Math.round(diff/2592000)+' month ago';
            }else if(diff < 63072000){
                return Math.round(diff/31536000)+' year ago';
            }

            return time.toDateString();
        } catch (e) { return String(createdAt || ''); }
    }

    // Fungsi untuk memuat data feedback
    function loadTaskFeedbackData(taskId) {
        const modalBody = document.getElementById("taskFeedbackList");
        modalBody.innerHTML =
            '<div class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';

        $.ajax({
            url: appUrl + "/task-feedbacks/" + taskId,
            type: "GET",
            dataType: "json",
            cache: false,
            success: function (response) {
                if (response.data && response.data.length > 0) {
                    let feedbackHtml = "";
                    response.data.forEach(function (feedback) {
                        // Who is the current employee (to decide edit permission)
                        const feedbackModalEl = document.getElementById("taskFeedbackModal");
                        const currentEmployeeId = parseInt(
                            (feedbackModalEl?.dataset?.employeeId || feedbackModalEl?.getAttribute('data-employee-id') || '0'),
                            10
                        ) || 0;

                        // Format the date using timeAgo helper
                        let formattedDate = "";
                        if (feedback.created_at) {
                            formattedDate = timeAgo(feedback.created_at);
                        }

                                                // Build top-level feedback block
                                                // Normalize top-level image & ref file URLs for reliable preview
                                                let topImageUrl = feedback.image || '';
                                                if (topImageUrl) {
                                                    const isAbs = typeof topImageUrl === 'string' && (topImageUrl.startsWith('http://') || topImageUrl.startsWith('https://'));
                                                    const isFileTask = typeof topImageUrl === 'string' && (topImageUrl.startsWith('/file/task/') || topImageUrl.startsWith('file/task/'));
                                                    const isStorage = typeof topImageUrl === 'string' && (topImageUrl.startsWith('/storage/') || topImageUrl.startsWith('storage/'));
                                                    if (!isAbs && !isFileTask && !isStorage) {
                                                        topImageUrl = appUrl + '/file/task/' + topImageUrl;
                                                    } else if (!isAbs && (isFileTask || isStorage)) {
                                                        topImageUrl = topImageUrl.startsWith('/') ? (appUrl + topImageUrl) : (appUrl + '/' + topImageUrl);
                                                    }
                                                }
                                                // Build top-level reference files list (array-first, fallback to single)
                                                let topRefFiles = [];
                                                // Coerce to array if backend sends JSON string
                                                let topRfVal = feedback.reference_files;
                                                if (!Array.isArray(topRfVal) && typeof topRfVal === 'string') {
                                                    try { const parsed = JSON.parse(topRfVal); if (Array.isArray(parsed)) topRfVal = parsed; } catch(_) { /* noop */ }
                                                }
                                                if (Array.isArray(topRfVal) && topRfVal.length > 0) {
                                                    topRefFiles = topRfVal.map((f) => {
                                                        if (!f) return null;
                                                        const isAbs = typeof f === 'string' && (f.startsWith('http://') || f.startsWith('https://'));
                                                        const isRefPath = typeof f === 'string' && (f.startsWith('/file/task_reference_files/') || f.startsWith('file/task_reference_files/'));
                                                        if (!isAbs && !isRefPath) return appUrl + '/file/task_reference_files/' + f;
                                                        if (!isAbs && isRefPath) return f.startsWith('/') ? (appUrl + f) : (appUrl + '/' + f);
                                                        return f;
                                                    }).filter(Boolean);
                                                } else {
                                                    let singleTop = feedback.reference_file || '';
                                                    if (singleTop) {
                                                        const isAbs2 = typeof singleTop === 'string' && (singleTop.startsWith('http://') || singleTop.startsWith('https://'));
                                                        const isRefPath2 = typeof singleTop === 'string' && (singleTop.startsWith('/file/task_reference_files/') || singleTop.startsWith('file/task_reference_files/'));
                                                        if (!isAbs2 && !isRefPath2) singleTop = appUrl + '/file/task_reference_files/' + singleTop;
                                                        else if (!isAbs2 && isRefPath2) singleTop = singleTop.startsWith('/') ? (appUrl + singleTop) : (appUrl + '/' + singleTop);
                                                        topRefFiles = [singleTop];
                                                    }
                                                }

                                                // Build top-level reference URLs list (array-first, fallback to single)
                                                let topRefUrls = [];
                                                let topRuVal = feedback.reference_urls;
                                                if (!Array.isArray(topRuVal) && typeof topRuVal === 'string') {
                                                    try { const parsed2 = JSON.parse(topRuVal); if (Array.isArray(parsed2)) topRuVal = parsed2; } catch(_) { /* noop */ }
                                                }
                                                if (Array.isArray(topRuVal) && topRuVal.length > 0) {
                                                    topRefUrls = topRuVal.filter((u) => typeof u === 'string' && u.trim() !== '');
                                                } else if (feedback.reference_url) {
                                                    topRefUrls = [feedback.reference_url];
                                                }

                                                // Determine if current user is the author of the top-level feedback
                                                const topAuthorId = (feedback.employee && (feedback.employee.id || feedback.employee.employee_id)) || feedback.employee_id || 0;
                                                const canEditTop = String(topAuthorId) === String(currentEmployeeId);
                                                const topCanEdit = canEditTop; // keep flag for actions row

                                    let repliesHtml = '';
                                    let viewRepliesBtnHtml = '';
                                    let repliesContainerHtml = '';
                                    if (Array.isArray(feedback.replies) && feedback.replies.length > 0) {
                                        const repliesCount = feedback.replies.length;
                                        const repliesContent = feedback.replies.map(function (rep) {
                                // reply date formatting (relative)
                                let rDate = '';
                                if (rep.created_at) {
                                    rDate = timeAgo(rep.created_at);
                                }
                                                                // Normalize image URL if backend returns filename/relative
                                                                let repImageUrl = rep.image || '';
                                                                if (repImageUrl) {
                                                                    const isAbs = typeof repImageUrl === 'string' && (repImageUrl.startsWith('http://') || repImageUrl.startsWith('https://'));
                                                                    const isFileTask = typeof repImageUrl === 'string' && (repImageUrl.startsWith('/file/task/') || repImageUrl.startsWith('file/task/'));
                                                                    const isStorage = typeof repImageUrl === 'string' && (repImageUrl.startsWith('/storage/') || repImageUrl.startsWith('storage/'));
                                                                    if (!isAbs && !isFileTask && !isStorage) {
                                                                        repImageUrl = appUrl + '/file/task/' + repImageUrl;
                                                                    } else if (!isAbs && (isFileTask || isStorage)) {
                                                                        repImageUrl = repImageUrl.startsWith('/') ? (appUrl + repImageUrl) : (appUrl + '/' + repImageUrl);
                                                                    }
                                                                }
                                                                // Build reply reference files list
                                                                let repRefFiles = [];
                                                                let repRfVal = rep.reference_files;
                                                                if (!Array.isArray(repRfVal) && typeof repRfVal === 'string') {
                                                                    try { const parsed = JSON.parse(repRfVal); if (Array.isArray(parsed)) repRfVal = parsed; } catch(_) { /* noop */ }
                                                                }
                                                                if (Array.isArray(repRfVal) && repRfVal.length > 0) {
                                                                    repRefFiles = repRfVal.map((f) => {
                                                                        if (!f) return null;
                                                                        const isAbs = typeof f === 'string' && (f.startsWith('http://') || f.startsWith('https://'));
                                                                        const isRefPath = typeof f === 'string' && (f.startsWith('/file/task_reference_files/') || f.startsWith('file/task_reference_files/'));
                                                                        if (!isAbs && !isRefPath) return appUrl + '/file/task_reference_files/' + f;
                                                                        if (!isAbs && isRefPath) return f.startsWith('/') ? (appUrl + f) : (appUrl + '/' + f);
                                                                        return f;
                                                                    }).filter(Boolean);
                                                                } else {
                                                                    let singleRep = rep.reference_file || '';
                                                                    if (singleRep) {
                                                                        const isAbs2 = typeof singleRep === 'string' && (singleRep.startsWith('http://') || singleRep.startsWith('https://'));
                                                                        const isRefPath = typeof singleRep === 'string' && (singleRep.startsWith('/file/task_reference_files/') || singleRep.startsWith('file/task_reference_files/'));
                                                                        if (!isAbs2 && !isRefPath) singleRep = appUrl + '/file/task_reference_files/' + singleRep;
                                                                        else if (!isAbs2 && isRefPath) singleRep = singleRep.startsWith('/') ? (appUrl + singleRep) : (appUrl + '/' + singleRep);
                                                                        repRefFiles = [singleRep];
                                                                    }
                                                                }
                                                                // Build reply reference URL list (array-first, fallback to single)
                                                                let repRefUrls = [];
                                                                let repRuVal = rep.reference_urls;
                                                                if (!Array.isArray(repRuVal) && typeof repRuVal === 'string') {
                                                                    try { const parsed = JSON.parse(repRuVal); if (Array.isArray(parsed)) repRuVal = parsed; } catch(_) { /* noop */ }
                                                                }
                                                                if (Array.isArray(repRuVal) && repRuVal.length > 0) {
                                                                    repRefUrls = repRuVal.filter((u) => typeof u === 'string' && u.trim() !== '');
                                                                } else if (rep.reference_url) {
                                                                    repRefUrls = [rep.reference_url];
                                                                }
                                                                // Determine if current user can edit this reply
                                                                const repAuthorId = (rep.employee && (rep.employee.id || rep.employee.employee_id)) || rep.employee_id || 0;
                                                                const canEditReply = String(repAuthorId) === String(currentEmployeeId);
                                                                const canEditRep = canEditReply; // used in actions row

                                                                return `
                                                                            <div class="feedback-reply ms-4 mt-2 p-2 rounded" data-reply-id="${rep.id}" data-parent-id="${feedback.id}" style="background: rgb(240, 241, 248);">
                                                                                <div class="d-flex align-items-start mb-1">
                                                                                    <img src="${rep.employee.photo}" alt="${rep.employee.name}" class="rounded-circle me-3" style="width: 24px; height: 24px; object-fit: cover;">
                                                                                    <div class="flex-grow-1">
                                                                                        <div>
                                                                                            <strong style="font-size:12px; font-weight:600;">${rep.employee.name}</strong>
                                                                                            <div><small class="text-muted d-block" style="font-size:9px;">${rDate}</small></div>
                                                                                        </div>

                                                                                        <div class="feedback-comment mt-2">
                                                                                            <p class="mb-1" style="font-size: 13px;">${rep.feedback_comment || ''}</p>

                                                                                            ${
                                                                                                ((Array.isArray(repRefUrls) && repRefUrls.length > 0) || (Array.isArray(repRefFiles) && repRefFiles.length > 0))
                                                                                                    ? `
                                                                                                        <div class="feedback-reference-container mb-1">
                                                                                                        ${Array.isArray(repRefUrls) && repRefUrls.length > 0
                                                                                                            ? repRefUrls.map((u) => {
                                                                                                                const shortUrl = u.replace(/^https?:\/\//, '').replace(/\/$/, '');
                                                                                                                return `<a href="${u}" target="_blank" class="feedback-reference-url me-2">
                                                                                                                            <span class="material-symbols-outlined">link</span> ${shortUrl}
                                                                                                                        </a>`;
                                                                                                            }).join('')
                                                                                                            : ''}

                                                                                                        ${Array.isArray(repRefFiles) && repRefFiles.length > 0
                                                                                                            ? repRefFiles.map((u) => {
                                                                                                                const fileName = u.split('/').pop();
                                                                                                                return `<a href="${u}" download class="feedback-reference-file ms-2">
                                                                                                                            <span class="material-symbols-outlined">draft</span> ${fileName}
                                                                                                                        </a>`;
                                                                                                            }).join('')
                                                                                                            : ''}
                                                                                                        </div>
                                                                                                    `
                                                                                                    : ''
                                                                                            }

                                                                                            ${repImageUrl ? `<img src="${repImageUrl}" class="img-fluid rounded reply-image" style="width: 70px; height: auto; border-radius: 8px; cursor: pointer;">` : ''}

                                                                                                                            <div class="reply-actions mt-2 d-flex gap-4">
                                                                                                                                <span class="d-flex align-items-center feedback-reply-trigger" data-feedback-id="${feedback.id}" data-task-id="${taskId}" style="cursor:pointer; color:#555; font-size:12px;"><span class="material-symbols-outlined" style="font-size:18px; line-height:1; margin-right:5px;">reply</span><span>Reply</span></span>
                                                                                                                                ${canEditRep ? `<span class="d-flex align-items-center reply-edit-trigger" data-task-id="${taskId}" data-parent-id="${feedback.id}" data-reply-id="${rep.id}" data-comment="${encodeURIComponent(rep.feedback_comment || '')}" data-ref-url="${encodeURIComponent(rep.reference_url || '')}" data-ref-urls="${encodeURIComponent(JSON.stringify(repRefUrls || []))}" data-ref-file="${encodeURIComponent((repRefFiles && repRefFiles[0]) || '')}" data-ref-files="${encodeURIComponent(JSON.stringify(repRefFiles || []))}" data-image="${encodeURIComponent(repImageUrl || '')}" style="cursor:pointer; color:#555; font-size:12px;"><span class="material-symbols-outlined" style="font-size:18px; line-height:1; margin-right:5px;">edit</span><span>Edit</span></span>` : ''}
                                                                                                                                ${canEditRep ? `<span class="d-flex align-items-center reply-delete-trigger" data-reply-id="${rep.id}" data-parent-id="${feedback.id}" style="cursor:pointer; color:#555; font-size:12px;"><span class="material-symbols-outlined" style="font-size:18px; line-height:1; margin-right:5px;">delete</span><span>Delete</span></span>` : ''}
                                                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                `;
                                                        }).join('');

                                                        // Keep the "View all" button separate so it can be aligned inline
                                                        viewRepliesBtnHtml = `<button type="button" class="btn btn-link p-0 view-replies-toggle feedback-toggle-replies" data-feedback-id="${feedback.id}" data-replies-count="${repliesCount}" style="font-size: 13px; color:#555; text-decoration: none;">View all (${repliesCount})</button>`;
                                                        repliesContainerHtml = `<div class="feedback-replies d-none" id="replies-${feedback.id}">${repliesContent}</div>`;
                                                }
                                                feedbackHtml += `
                                                <div class="feedback-item mb-3 p-3" data-feedback-id="${feedback.id}">
                                                    <div class="d-flex align-items-start mb-2">
                                                        <img src="${feedback.employee.photo}" alt="${feedback.employee.name}" class="rounded-circle me-3" style="width: 32px; height: 32px; object-fit: cover;">
                                                        <div class="flex-grow-1">
                                                            <div>
                                                                <strong style="font-size:14px; font-weight:600;">${feedback.employee.name}</strong>
                                                                <div><small class="text-muted d-block" style="font-size: 10px;">${formattedDate}</small></div>
                                                            </div>

                                                            <div class="feedback-comment mt-2">
                                                                <p class="mb-2" style="font-size:13px;">${feedback.feedback_comment}</p>

                                                                ${
                                ((Array.isArray(topRefUrls) && topRefUrls.length > 0) || (Array.isArray(topRefFiles) && topRefFiles.length > 0))
                                    ? `
                                <div class="feedback-reference-container mb-2">
                                    ${Array.isArray(topRefUrls) && topRefUrls.length > 0
                                    ? topRefUrls.map((u) => {
                                        // Buat tampilan URL lebih pendek biar gak kepanjangan
                                        const shortUrl = u.replace(/^https?:\/\//, '').replace(/\/$/, '');
                                        return `<a href="${u}" target="_blank" class="feedback-reference-url bg-light rounded-2">
                                                    <span class="material-symbols-outlined" style="color: #444444;">link</span> ${shortUrl}
                                                </a>`;
                                        }).join('')
                                    : ''}

                                    ${Array.isArray(topRefFiles) && topRefFiles.length > 0
                                    ? topRefFiles.map((u) => {
                                        // Ambil nama file dari URL
                                        const fileName = u.split('/').pop();
                                        return `<a href="${u}" class="feedback-reference-file bg-light rounded-2">
                                                    <span class="material-symbols-outlined" style="color: #444444;">draft</span> ${fileName}
                                                </a>`;
                                        }).join('')
                                    : ''}
                                </div>
                            `
                                    : ""
                            }

                                                                ${
                                topImageUrl
                                    ? `<img src="${topImageUrl}" class="img-fluid rounded mb-2 feedback-image" style="width: 70px; height: auto; border-radius: 8px; cursor: pointer;">`
                                    : ""
                            }

                                                                <div class="feedback-actions mt-2 d-flex gap-4 align-items-center">
                                                                    <span class="d-flex align-items-center feedback-reply-trigger" data-feedback-id="${feedback.id}" data-task-id="${taskId}" style="cursor:pointer; color:#555; font-size:12px;"><span class="material-symbols-outlined" style="font-size:18px; line-height:1; margin-right:5px;">reply</span><span>Reply</span></span>
                                                                    ${topCanEdit ? `<span class="d-flex align-items-center feedback-edit-trigger" data-feedback-id="${feedback.id}" data-task-id="${taskId}" data-comment="${encodeURIComponent(feedback.feedback_comment || '')}" data-ref-url="${encodeURIComponent(feedback.reference_url || '')}" data-ref-urls="${encodeURIComponent(JSON.stringify(topRefUrls || []))}" data-ref-file="${encodeURIComponent((topRefFiles && topRefFiles[0]) || '')}" data-ref-files="${encodeURIComponent(JSON.stringify(topRefFiles || []))}" data-image="${encodeURIComponent(topImageUrl || '')}" style="cursor:pointer; color:#555; font-size:12px;"><span class="material-symbols-outlined" style="font-size:18px; line-height:1; margin-right:5px;">edit</span><span>Edit</span></span>` : ''}
                                                                    ${topCanEdit ? `<span class="d-flex align-items-center feedback-delete-trigger" data-feedback-id="${feedback.id}" style="cursor:pointer; color:#555; font-size:12px;"><span class="material-symbols-outlined" style="font-size:18px; line-height:1; margin-right:5px;">delete</span><span>Delete</span></span>` : ''}
                                                                    ${viewRepliesBtnHtml}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ${repliesContainerHtml}
                                                </div>
                                            `;
                    });
                    modalBody.innerHTML = feedbackHtml;

                    // Bind reply icon click
                    modalBody.querySelectorAll('.feedback-reply-trigger').forEach(function (btn) {
                        btn.addEventListener('click', function () {
                            const parentId = this.getAttribute('data-feedback-id');
                            const tId = this.getAttribute('data-task-id');
                            showReplyFeedbackForm(tId, parentId);
                        });
                    });

                    // Bind edit (top-level) icon click
                    modalBody.querySelectorAll('.feedback-edit-trigger').forEach(function (btn) {
                        btn.addEventListener('click', function () {
                            const tId = this.getAttribute('data-task-id');
                            const fid = this.getAttribute('data-feedback-id');
                            const payload = {
                                id: fid,
                                parent_id: null,
                                feedback_comment: decodeURIComponent(this.getAttribute('data-comment') || ''),
                                reference_url: decodeURIComponent(this.getAttribute('data-ref-url') || ''),
                                reference_urls: (function(){ try { return JSON.parse(decodeURIComponent(this.getAttribute('data-ref-urls') || '[]')); } catch(e){ return []; } }).call(this),
                                reference_file_url: decodeURIComponent(this.getAttribute('data-ref-file') || ''),
                                reference_files_urls: (function(){ try { return JSON.parse(decodeURIComponent(this.getAttribute('data-ref-files') || '[]')); } catch(e){ return []; } }).call(this),
                                image_url: decodeURIComponent(this.getAttribute('data-image') || ''),
                            };

                            // Prefer inline edit in the footer panel (similar to project feedback)
                            const inlineEditor = document.getElementById("inline_task_feedback_editor");
                            if (inlineEditor && typeof window.startInlineTaskEditFeedback === "function") {
                                try {
                                    window.startInlineTaskEditFeedback(payload);
                                    try { inlineEditor.scrollIntoView({ behavior: "smooth", block: "center" }); } catch (_) {}
                                    return;
                                } catch (_) {}
                            }
                            // Fallback to modal-based edit if inline not available
                            showEditFeedbackForm(tId, payload, false);
                        });
                    });

                    // Bind edit (reply) icon click
                    modalBody.querySelectorAll('.reply-edit-trigger').forEach(function (btn) {
                        btn.addEventListener('click', function () {
                            const tId = this.getAttribute('data-task-id');
                            const rid = this.getAttribute('data-reply-id');
                            const pid = this.getAttribute('data-parent-id');
                            const payload = {
                                id: rid,
                                parent_id: pid,
                                feedback_comment: decodeURIComponent(this.getAttribute('data-comment') || ''),
                                reference_url: decodeURIComponent(this.getAttribute('data-ref-url') || ''),
                                reference_urls: (function(){ try { return JSON.parse(decodeURIComponent(this.getAttribute('data-ref-urls') || '[]')); } catch(e){ return []; } }).call(this),
                                reference_file_url: decodeURIComponent(this.getAttribute('data-ref-file') || ''),
                                reference_files_urls: (function(){ try { return JSON.parse(decodeURIComponent(this.getAttribute('data-ref-files') || '[]')); } catch(e){ return []; } }).call(this),
                                image_url: decodeURIComponent(this.getAttribute('data-image') || ''),
                            };

                            // Prefer inline edit for replies too
                            const inlineEditor = document.getElementById("inline_task_feedback_editor");
                            if (inlineEditor && typeof window.startInlineTaskEditFeedback === "function") {
                                try {
                                    window.startInlineTaskEditFeedback(payload);
                                    try { inlineEditor.scrollIntoView({ behavior: "smooth", block: "center" }); } catch (_) {}
                                    return;
                                } catch (_) {}
                            }
                            // Fallback to modal-based edit
                            showEditFeedbackForm(tId, payload, true);
                        });
                    });

                    // Bind view replies toggle per feedback
                    modalBody.querySelectorAll('.view-replies-toggle').forEach(function (btn) {
                        btn.addEventListener('click', function () {
                            const fid = this.getAttribute('data-feedback-id');
                            const count = this.getAttribute('data-replies-count');
                            const container = modalBody.querySelector('#replies-' + fid);
                            if (!container) return;
                            const hidden = container.classList.contains('d-none');
                            if (hidden) {
                                container.classList.remove('d-none');
                                this.textContent = 'Hide';
                            } else {
                                container.classList.add('d-none');
                                this.textContent = `View all (${count})`;
                            }
                            // Enforce style: no underline and #555 color
                            this.style.textDecoration = 'none';
                            this.style.color = '#555';
                        });
                    });

                    // Open feedback/reply images in an in-page modal preview (do not open new tab)
                    (function(){
                        // Ensure modal exists only once
                        function ensureImagePreviewModalExists() {
                            if (document.getElementById('taskImagePreviewModal')) return;
                            const html = `
                                <div class="modal fade" id="taskImagePreviewModal" tabindex="-1" aria-hidden="true">
                                    <div class="modal-dialog modal-dialog-centered" id="taskImageDialog">
                                        <div class="modal-content modal-content-custom bg-light border-0">
                                            <div class="modal-body p-0 d-flex align-items-center justify-content-center" style="max-height:80vh;">
                                                <img id="taskImagePreviewModalImg" src="" alt="Preview image" style="display:block; max-width:100%; max-height:80vh; object-fit:contain;">
                                            </div>
                                            <div class="modal-footer modal-footer-custom border-0 justify-content-center">
                                                <button type="button" class="btn btn-custom-close" data-bs-dismiss="modal">Close</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>`;

                                // Use delegated click for feedback images as before but with slightly smaller sizing
                                $(document).on('click', '.feedback-image', function(e) {
                                    e.preventDefault()
                                    const imgSrc = $(this).attr('src') || $(this).data('img')
                                    const $img = $('#taskImagePreviewModalImg')
                                    const $dialog = $('#taskImageDialog')
                                    $img.off('load')
                                    $img.attr('src', imgSrc)
                                    $('#taskImagePreviewModal').modal('show')
                                    $img.on('load', function() {
                                        try {
                                            const naturalW = this.naturalWidth || 0
                                            const naturalH = this.naturalHeight || 0
                                            // Tighter viewport multipliers to avoid overly large previews
                                            const viewportW = window.innerWidth * 0.8
                                            const viewportH = window.innerHeight * 0.7
                                            // Cap scale so very large images don't become huge modals
                                            const ratio = Math.min(viewportW / Math.max(naturalW,1), viewportH / Math.max(naturalH,1), 0.9)
                                            const modalWidth = Math.round(naturalW * ratio)
                                            $dialog.css({ 'max-width': modalWidth + 'px' })
                                        } catch(_) {}
                                    })
                                })
                            try { document.body.insertAdjacentHTML('beforeend', html); } catch(_){ }
                        }

                        function showImageInModal(src, filename) {
                            try {
                                ensureImagePreviewModalExists();
                                const modalEl = document.getElementById('taskImagePreviewModal');
                                const imgEl = document.getElementById('taskImagePreviewModalImg');
                                const dlEl = document.getElementById('taskImagePreviewDownload');
                                if (imgEl) imgEl.src = src;
                                // No download button per UX request; preview only

                                // If certain parent modals are open (feedback/detail/project), hide them first and remember to restore later
                                const parentIds = ['taskFeedbackModal', 'taskDetailModal', 'projectTaskDetailModal', 'projectDetailModal'];
                                let parentModalEl = null;
                                let parentWasOpen = false;
                                try {
                                    for (let i = 0; i < parentIds.length; i++) {
                                        const id = parentIds[i];
                                        const el = document.getElementById(id);
                                        if (el && el.classList && el.classList.contains('show')) {
                                            parentModalEl = el;
                                            parentWasOpen = true;
                                            break;
                                        }
                                    }
                                } catch(_) {}

                                try {
                                    if (parentWasOpen && parentModalEl) {
                                        // Suppress any backdrop removal logic used elsewhere
                                        try { window.__suppressFeedbackBackdropRemoval = true; } catch(_) {}
                                        const pmInst = bootstrap.Modal.getInstance(parentModalEl) || new bootstrap.Modal(parentModalEl);
                                        try { pmInst.hide(); } catch(_) {}
                                    }
                                } catch(_) {}

                                const inst = bootstrap.Modal.getOrCreateInstance(modalEl) || new bootstrap.Modal(modalEl);

                                // When preview modal hides, restore parent modal if it was previously open
                                const onPreviewHidden = function() {
                                    try { inst._element.removeEventListener('hidden.bs.modal', onPreviewHidden); } catch(_) {}
                                    try {
                                        if (parentWasOpen && parentModalEl) {
                                            try { window.__suppressFeedbackBackdropRemoval = false; } catch(_) {}
                                            const pm2 = bootstrap.Modal.getOrCreateInstance(parentModalEl) || new bootstrap.Modal(parentModalEl);
                                            try { pm2.show(); } catch(_) {}
                                        }
                                    } catch(_) {}
                                };
                                try { inst._element.addEventListener('hidden.bs.modal', onPreviewHidden); } catch(_) {}
                                inst.show();
                            } catch (e) { try { window.open(src, '_blank'); } catch(_) {} }
                        }

                        modalBody.querySelectorAll('.feedback-image, .reply-image').forEach(function (img) {
                            // Remove any previous click handlers to avoid duplicates
                            try { img.replaceWith(img.cloneNode(true)); } catch(_) {}
                        });
                        // Re-query after clone
                        modalBody.querySelectorAll('.feedback-image, .reply-image').forEach(function (img) {
                            img.addEventListener('click', function (ev) {
                                ev.preventDefault();
                                ev.stopPropagation();
                                const src = this.getAttribute('src') || this.dataset.src;
                                if (!src) return;
                                // Derive filename fallback
                                let filename = (src.split('/').pop() || '').split('?')[0];
                                showImageInModal(src, filename);
                            });
                        });
                    })();

                        // Bind delete triggers for feedback and replies
                        modalBody.querySelectorAll('.feedback-delete-trigger').forEach(function (btn) {
                            btn.addEventListener('click', function () {
                                const fid = this.getAttribute('data-feedback-id');
                                if (!fid) return;
                                const authorName = (this.closest('.feedback-item')?.querySelector('strong')?.textContent) || '';
                                const content = (this.closest('.feedback-item')?.querySelector('.task-description, p, .task-description-container p, .task-description')?.textContent) || '';
                                const avatarUrl = (this.closest('.feedback-item')?.querySelector('img')?.getAttribute('src')) || '';
                                showDeleteConfirmModal({ type: 'feedback', id: fid, authorName: authorName, content: content, avatarUrl: avatarUrl, onConfirm: function(done){
                                    const url = appUrl + '/task-feedbacks/' + fid;
                                    $.ajax({
                                        url: url,
                                        type: 'DELETE',
                                        headers: {
                                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                                        },
                                        success: function (res) {
                                            try { if (typeof showFloatingAlert === 'function') showFloatingAlert(res.message || 'Feedback deleted', 'success'); } catch(_){ }
                                            // Remove feedback DOM
                                            const el = modalBody.querySelector(`.feedback-item[data-feedback-id="${fid}"]`);
                                            if (el && el.parentNode) el.parentNode.removeChild(el);
                                            // Refresh feedback count on task card
                                            try { $.ajax({ url: appUrl + '/task-feedbacks/count/' + (modalBody.closest('#taskFeedbackModal')?.dataset?.taskId || '') , type: 'GET', success: function(c){ if (c && c.data && typeof c.data.count === 'number') { const card = document.querySelector('.custom-card[data-task-id="' + (modalBody.closest('#taskFeedbackModal')?.dataset?.taskId || '') + '"]'); if (card) { let span = card.querySelector('.feedback-comments-count'); if (span) { span.textContent = String(c.data.count); } } } } }); } catch(_){ }
                                            done(true);
                                        },
                                        error: function (xhr) {
                                            let msg = 'Failed to delete feedback';
                                            if (xhr.responseJSON && xhr.responseJSON.message) msg = xhr.responseJSON.message;
                                            try { if (typeof showFloatingAlert === 'function') showFloatingAlert(msg, 'danger'); } catch(_) { alert(msg); }
                                            done(false);
                                        }
                                    });
                                }});
                            });
                        });

                        modalBody.querySelectorAll('.reply-delete-trigger').forEach(function (btn) {
                            btn.addEventListener('click', function () {
                                const rid = this.getAttribute('data-reply-id');
                                const pid = this.getAttribute('data-parent-id');
                                if (!rid) return;
                                const authorName = (this.closest('.feedback-reply')?.querySelector('strong')?.textContent) || '';
                                const content = (this.closest('.feedback-reply')?.querySelector('p')?.textContent) || '';
                                const avatarUrl = (this.closest('.feedback-reply')?.querySelector('img')?.getAttribute('src')) || '';
                                showDeleteConfirmModal({ type: 'reply', id: rid, parentId: pid, authorName: authorName, content: content, avatarUrl: avatarUrl, onConfirm: function(done){
                                    const url = appUrl + '/task-feedbacks/' + rid;
                                    $.ajax({
                                        url: url,
                                        type: 'DELETE',
                                        headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content') },
                                        success: function (res) {
                                            try { if (typeof showFloatingAlert === 'function') showFloatingAlert(res.message || 'Reply deleted', 'success'); } catch(_){}

                                            // Remove the reply element
                                            const el = modalBody.querySelector(`.feedback-reply[data-reply-id="${rid}"][data-parent-id="${pid}"]`);
                                            if (el && el.parentNode) el.parentNode.removeChild(el);

                                            // Update the "View all" button and replies count
                                            const repliesContainer = modalBody.querySelector(`#replies-${pid}`);
                                            const viewAllBtn = modalBody.querySelector(`.view-replies-toggle[data-feedback-id="${pid}"]`);

                                            if (repliesContainer && viewAllBtn) {
                                                // Count remaining replies in the container
                                                const remainingReplies = repliesContainer.querySelectorAll('.feedback-reply');
                                                const remainingCount = remainingReplies.length;

                                                if (remainingCount === 0) {
                                                    // No replies left, remove the View all button and replies container
                                                    viewAllBtn.remove();
                                                    repliesContainer.remove();
                                                } else {
                                                    // Update the count in the View all button
                                                    viewAllBtn.setAttribute('data-replies-count'    , remainingCount);
                                                    const isVisible = !repliesContainer.classList.contains('d-none');
                                                    if (isVisible) {
                                                        viewAllBtn.textContent = 'Hide';
                                                    } else {
                                                        viewAllBtn.textContent = `View all (${remainingCount})`;
                                                    }
                                                }
                                            }

                                            // Refresh feedback count on task card after reply deletion
                                            try {
                                                $.ajax({
                                                    url: appUrl + "/task-feedbacks/count/" + (modalBody.closest('#taskFeedbackModal')?.dataset?.taskId || ''),
                                                    type: 'GET',
                                                    success: function(c){
                                                        if (c && c.data && typeof c.data.count === 'number') {
                                                            const card = document.querySelector('.custom-card[data-task-id="' + (modalBody.closest('#taskFeedbackModal')?.dataset?.taskId || '') + '"]');
                                                            if (card) {
                                                                let span = card.querySelector('.feedback-comments-count');
                                                                if (span) {
                                                                    span.textContent = String(c.data.count);
                                                                    // Hide the span if count is 0
                                                                    if (c.data.count === 0) {
                                                                        span.style.display = 'none';
                                                                    } else {
                                                                        span.style.display = '';
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                });
                                            } catch(_) {}

                                            done(true);
                                        },
                                        error: function (xhr) {
                                            let msg = 'Failed to delete reply';
                                            if (xhr.responseJSON && xhr.responseJSON.message) msg = xhr.responseJSON.message;
                                            try { if (typeof showFloatingAlert === 'function') showFloatingAlert(msg, 'danger'); } catch(_) { alert(msg); }
                                            done(false);
                                        }
                                    });
                                }});
                            });
                        });

                    // Deep-link scroll/highlight if a target is set for this task
                    try {
                        const target = (window.__taskLatestTarget && window.__taskLatestTarget[String(taskId)]) || null;
                        if (target && target.id) {
                            // If it's a reply (parent_id present), expand its parent replies first
                            if (target.parent_id) {
                                const wrap = modalBody.querySelector(`.feedback-replies-wrap .feedback-toggle-replies[data-feedback-id="${target.parent_id}"]`);
                                if (wrap) {
                                    // Ensure container is expanded
                                    const container = modalBody.querySelector('#replies-' + target.parent_id);
                                    if (container && container.classList.contains('d-none')) {
                                        container.classList.remove('d-none');
                                    }
                                    // Update toggle text to Hide
                                    wrap.textContent = 'Hide';
                                }
                                const replyEl = modalBody.querySelector(`.feedback-reply[data-reply-id="${target.id}"][data-parent-id="${target.parent_id}"]`);
                                if (replyEl) {
                                    replyEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    replyEl.style.transition = 'background-color 0.3s ease';
                                    const old = replyEl.style.backgroundColor;
                                    replyEl.style.backgroundColor = '#fff3cd';
                                    setTimeout(() => { replyEl.style.backgroundColor = old || '#fafafa'; }, 1200);
                                }
                            } else {
                                // Top-level feedback
                                const topEl = modalBody.querySelector(`.feedback-item[data-feedback-id="${target.id}"]`);
                                if (topEl) {
                                    topEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    topEl.style.transition = 'background-color 0.3s ease';
                                    const old = topEl.style.backgroundColor;
                                    topEl.style.backgroundColor = '#fff3cd';
                                    setTimeout(() => { topEl.style.backgroundColor = old || ''; }, 1200);
                                }
                            }
                        }
                        // Clear target after using it
                        if (window.__taskLatestTarget) delete window.__taskLatestTarget[String(taskId)];
                    } catch (_) {}
                } else {
                    modalBody.innerHTML =
                        '<p class="text-center text-muted">No feedback available for this task.</p>';
                }

                // Initialize Quill editors after modal content is loaded
                try {
                    if (typeof initTaskFeedbackQuillEditors === 'function') {
                        initTaskFeedbackQuillEditors(modalBody);
                    }
                } catch (_) {}

                // Setup inline feedback editor in footer
                try {
                    setupTaskInlineFeedbackEditor(taskId);
                } catch (_) {}
            },
            error: function () {
                modalBody.innerHTML =
                    '<p class="text-center text-danger">Failed to load feedback.</p>';
            },
        });
    }

    // Function to show add task feedback form
    function showAddFeedbackForm(taskId) {
        const modalTitle = document.getElementById("taskFeedbackModalLabel");
        const modalBody = document.getElementById("taskFeedbackList");

        modalTitle.textContent = "Add Feedback";
        modalBody.innerHTML = "";

        const form = document.createElement("form");
        form.id = "addFeedbackForm";
        form.enctype = "multipart/form-data";

        const taskIdInput = document.createElement("input");
        taskIdInput.type = "hidden";
        taskIdInput.name = "task_id";
        taskIdInput.value = taskId;

        const employeeIdInput = document.createElement("input");
        employeeIdInput.type = "hidden";
        employeeIdInput.name = "employee_id";
        employeeIdInput.value =
            document
                .getElementById("taskFeedbackModal")
                .getAttribute("data-employee-id") || "";

        form.appendChild(taskIdInput);
        form.appendChild(employeeIdInput);

        // Comment field
        const commentDiv = document.createElement("div");
        commentDiv.className = "mb-3 custom-input";

        const commentLabel = document.createElement("label");
        commentLabel.htmlFor = "feedback_comment";
        commentLabel.className = "form-label label-custom";
        commentLabel.textContent = "Comment";
        commentDiv.appendChild(commentLabel);

        const commentTextarea = document.createElement("textarea");
        commentTextarea.className = "form-control input-text";
        commentTextarea.id = "feedback_comment";
        commentTextarea.name = "feedback_comment";
        commentTextarea.rows = 3;
        commentTextarea.required = true;
        commentDiv.appendChild(commentTextarea);

        form.appendChild(commentDiv);

        // Attachment buttons (Photo & File) like project feedback
        const attachmentDiv = document.createElement("div");
        attachmentDiv.className = "d-flex align-items-center gap-2 mb-3";

        const photoBtn = document.createElement("button");
        photoBtn.type = "button";
        photoBtn.className = "btn btn-outline-secondary d-flex align-items-center";
        photoBtn.id = "taskFeedbackPhotoBtn";
        photoBtn.innerHTML = '<span class="material-symbols-outlined me-1">photo_camera</span>Photo';

        const fileBtn = document.createElement("button");
        fileBtn.type = "button";
        fileBtn.className = "btn btn-outline-secondary d-flex align-items-center ms-2";
        fileBtn.id = "taskFeedbackFileBtn";
        fileBtn.innerHTML = '<span class="material-symbols-outlined me-1">attach_file</span>File';

        // Hidden inputs for image and files
        const imageInput = document.createElement("input");
        imageInput.type = "file";
        imageInput.id = "task_feedback_image_input";
        imageInput.name = "feedback_image";
        imageInput.accept = "image/*";
        imageInput.hidden = true;

        const filesInput = document.createElement("input");
        filesInput.type = "file";
        filesInput.id = "task_feedback_files_input";
        filesInput.name = "reference_files[]";
        filesInput.accept = "image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip";
        filesInput.multiple = true;
        filesInput.hidden = true;

        attachmentDiv.appendChild(photoBtn);
        attachmentDiv.appendChild(fileBtn);
        form.appendChild(attachmentDiv);
        form.appendChild(imageInput);
        form.appendChild(filesInput);

        // Initialize selected files array and setup handlers
        window.taskFeedbackSelectedFiles = window.taskFeedbackSelectedFiles || [];

        photoBtn.addEventListener('click', function() {
            imageInput.click();
        });

        fileBtn.addEventListener('click', function() {
            filesInput.click();
        });

        // Handle image preview (show small preview like project)
        imageInput.addEventListener('change', function(ev) {
            try {
                var f = (this.files && this.files[0]) || null;
                if (!f) return;
                if (!f.type || f.type.indexOf("image/") !== 0) return;
                if (f.size > MAX_IMAGE_BYTES) {
                    try { if (typeof showFloatingAlert === 'function') showFloatingAlert('Image must be smaller than 10 MB.', 'warning'); } catch(_) { alert('Image must be smaller than 10 MB.'); }
                    this.value = '';
                    return;
                }

                var reader = new FileReader();
                reader.onload = function (e) {
                    try {
                        showInlineImagePreviewSmall(f, e.target.result);
                    } catch (_) {}
                };
                reader.readAsDataURL(f);
            } catch (_) {}
        });

        // Handle file attachments preview
        filesInput.addEventListener('change', function(ev) {
            try {
                var files = Array.from(this.files || []);
                if (!files.length) return;
                window.taskFeedbackSelectedFiles = (window.taskFeedbackSelectedFiles || []).concat(files);
                renderTaskFeedbackFilesPreview();
                try { this.value = ""; } catch (_) {}
            } catch (_) {}
        });

        // Reference URLs (Multiple URLs like project)
        const refUrlDiv = document.createElement("div");
        refUrlDiv.className = "mb-3 custom-input";

        const refUrlLabel = document.createElement("label");
        refUrlLabel.className = "form-label label-custom";
        refUrlLabel.textContent = "Reference URLs (Optional)";
        refUrlDiv.appendChild(refUrlLabel);

        const refUrlContainer = document.createElement("div");
        refUrlContainer.id = "task_feedback_reference_urls_container";
        refUrlContainer.className = "d-flex flex-column gap-2";

        // Add initial URL row
        const initialUrlRow = document.createElement("div");
        initialUrlRow.className = "d-flex gap-2 align-items-center";
        initialUrlRow.innerHTML = '<input type="url" class="form-control" name="reference_urls[]" placeholder="https://example.com">' +
            '<button type="button" class="btn btn-submit-black add-ref-url" aria-label="Add URL"><span class="material-symbols-outlined">add</span></button>';
        refUrlContainer.appendChild(initialUrlRow);

        refUrlDiv.appendChild(refUrlContainer);
        form.appendChild(refUrlDiv);

    modalBody.appendChild(form);

        // Setup image preview
        setupImageInput(imageInput, imageLabel, imageClearBtn);

        // Form submission handler
        form.addEventListener("submit", function (e) {
            e.preventDefault();
            submitTaskFeedbackForm(this, taskId);
        });

        // Use unified footer: Close + Submit
        setUnifiedTaskFeedbackFooter(taskId, 'Submit', function(){
            const form = document.getElementById('addFeedbackForm');
            if (form) submitTaskFeedbackForm(form, taskId);
        });

        // Initialize Quill editors after modal content is set (first version)
        try {
            if (typeof initTaskFeedbackQuillEditors === 'function') {
                initTaskFeedbackQuillEditors(modalBody);
            }
        } catch (_) {}
    }

    // Function to submit task feedback form (Task page legacy path) – use floating alert and keep modal open
    function submitTaskFeedbackForm(form, taskId) {
        // Helpers to manage feedback count badge
        function getExistingFeedbackCount(taskId) {
            const card = document.querySelector(`.custom-card[data-task-id="${taskId}"]`);
            const span = card ? card.querySelector('.feedback-comments-count') : null;
            const n = span ? parseInt(span.textContent, 10) : NaN;
            return Number.isFinite(n) ? n : 0;
        }
        function setFeedbackCount(taskId, count) {
            const card = document.querySelector(`.custom-card[data-task-id="${taskId}"]`);
            if (!card) return;
            let span = card.querySelector('.feedback-comments-count');
            if (!span) {
                span = document.createElement('span');
                span.className = 'feedback-comments-count ms-1';
                span.style.color = '#555';
                const icon = card.querySelector('.task-icon.mode_comment');
                if (icon && icon.parentNode) {
                    icon.parentNode.appendChild(span);
                } else {
                    return; // no place to put it
                }
            }
            span.textContent = String(count);
        }
        function optimisticIncrementFeedbackCount(taskId) {
            const prev = getExistingFeedbackCount(taskId);
            setFeedbackCount(taskId, Math.max(prev + 1, 1));
        }
        function extractCountFromResponse(resp) {
            if (!resp) return null;
            const candidates = [
                resp.count,
                resp.total,
                resp?.data?.count,
                resp?.data?.total,
            ];
            const val = candidates.find((v) => typeof v === 'number' && !isNaN(v));
            return (typeof val === 'number') ? val : null;
        }
        const submitBtn = form.querySelector("button[type='submit']") || document.getElementById("addFeedbackButton");
        const originalBtnHtml = submitBtn ? submitBtn.innerHTML : "";

        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            submitBtn.disabled = true;
        }

        // Validate image and total sizes before creating FormData
        try {
            const imageEl = form.querySelector('#feedback_image') || document.getElementById('feedback_image');
            const imageFile = (imageEl && imageEl.files && imageEl.files[0]) ? imageEl.files[0] : null;
            if (imageFile && imageFile.size > MAX_IMAGE_BYTES) {
                try { if (typeof showFloatingAlert === 'function') showFloatingAlert('Image must be smaller than 10 MB.', 'warning'); } catch(_) { alert('Image must be smaller than 10 MB.'); }
                if (submitBtn) { submitBtn.innerHTML = originalBtnHtml; submitBtn.disabled = false; }
                return;
            }
            const totalCheck = validateTotalUploadSize({imageFile: imageFile, extraFiles: selectedFiles});
            if (!totalCheck.ok) {
                try { if (typeof showFloatingAlert === 'function') showFloatingAlert('Total upload size must be 100 MB or less.', 'warning'); } catch(_) { alert('Total upload size must be 100 MB or less.'); }
                if (submitBtn) { submitBtn.innerHTML = originalBtnHtml; submitBtn.disabled = false; }
                return;
            }
        } catch(_) {}

        const formData = new FormData(form);
        // Append multi-selected files from preview buffer
        try {
            if (Array.isArray(selectedFiles) && selectedFiles.length > 0) {
                selectedFiles.forEach(file => formData.append('reference_files[]', file));
            }
        } catch (_) {}
        formData.append("task_id", taskId);

        $.ajax({
            url: appUrl + "/task-feedbacks",
            type: "POST",
            data: formData,
            contentType: false,
            processData: false,
            headers: {
                "X-CSRF-TOKEN": document
                    .querySelector('meta[name="csrf-token"]')
                    .getAttribute("content"),
            },
            success: function (response) {
                // Use the app's white alert style (Settings/Project): showAlertMsg -> light
                const msg = (response && response.message) || 'Feedback submitted successfully!';
                if (typeof window.showAlertMsg === 'function') {
                    window.showAlertMsg(String(msg), 'light', 2000);
                } else if (typeof showFloatingAlert === 'function') {
                    showFloatingAlert(msg, 'light', 2000);
                }

                // Switch back to list view inside the modal (keep modal open)
                try {
                    const feedbackModalEl = document.getElementById("taskFeedbackModal");
                    const titleEl = feedbackModalEl?.querySelector('.feedback-modal-title');
                    if (titleEl) titleEl.textContent = 'Task Feedback';
                    // Restore Add Feedback button in footer if missing
                    let footer = feedbackModalEl.querySelector('.feedback-modal-footer')
                                || feedbackModalEl.querySelector('.modal-footer')
                                || feedbackModalEl.querySelector('.modal-footer-custom');
                    if (!footer) {
                        const maybeBtn = feedbackModalEl.querySelector('#addFeedbackButton');
                        if (maybeBtn && maybeBtn.parentElement) footer = maybeBtn.parentElement;
                    }
            if (footer) {
                        let addBtn = footer.querySelector('#addFeedbackButton');
                        if (!addBtn) {
                            addBtn = document.createElement('button');
                            addBtn.type = 'button';
                addBtn.className = 'btn btn-submit-black w-100';
                            addBtn.id = 'addFeedbackButton';
                            addBtn.textContent = 'Add Feedback';
                            footer.innerHTML = '';
                            footer.appendChild(addBtn);
                        } else {
                            addBtn.textContent = 'Add Feedback';
                            const fresh = addBtn.cloneNode(true);
                            addBtn.parentNode.replaceChild(fresh, addBtn);
                            addBtn = fresh;
                        }
                        addBtn.disabled = false;
                        addBtn.removeAttribute('disabled');
                        addBtn.addEventListener('click', () => showAddFeedbackForm(taskId));
                    }
                    // Remove reply close button if present
                    const closeBtn = document.getElementById('replyCloseButton');
                    if (closeBtn && closeBtn.parentNode) {
                        closeBtn.parentNode.removeChild(closeBtn);
                    }
                    // Reload feedback list inside modal so newly created feedback appears without full page reload
                    try { loadTaskFeedbackData(taskId); } catch (e) { console.warn('Failed to reload feedback list', e); }
                } catch (e) { /* noop */ }

                // Clear selected files buffer and preview
                try {
                    selectedFiles = [];
                    const preview = document.getElementById('feedback_reference_files_preview') || document.getElementById('reference_files_preview');
                    if (preview) preview.innerHTML = '';
                } catch (_) {}

                // Update feedback count dynamically on the task card
                // 1) Optimistic UI increment
                optimisticIncrementFeedbackCount(taskId);
                // 2) Reconcile with server value (if provided and > 0)
                $.ajax({
                    url: appUrl + "/task-feedbacks/count/" + taskId,
                    type: "GET",
                    dataType: "json",
                    success: function (countResponse) {
                        const serverCount = extractCountFromResponse(countResponse);
                        if (typeof serverCount === 'number' && serverCount > 0) {
                            setFeedbackCount(taskId, serverCount);
                        }
                    }
                });
                // Refresh task cards so counts and other data reflect the latest changes
                // try { fetchAndRenderTasks(); } catch(_) {}
                // Avoid page reload when closing modal
                try { feedbackSubmitted = false; } catch(_) {}
            },
            error: function (xhr) {
                let errorMessage = "Failed to submit feedback. Please try again.";
                if (xhr.responseJSON && xhr.responseJSON.errors) {
                    errorMessage = Object.values(xhr.responseJSON.errors).flat().join("\n");
                } else if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMessage = xhr.responseJSON.message;
                }
                if (typeof showFloatingAlert === 'function') {
                    showFloatingAlert(errorMessage, "danger");
                } else {
                    alert(errorMessage);
                }
            },
            complete: function () {
                if (submitBtn) {
                    submitBtn.innerHTML = originalBtnHtml;
                    submitBtn.disabled = false;
                }
                try { selectedFiles = []; } catch (_) {}
            },
        });
    }

    // Function to handle task feedback
    function handleTaskFeedback(taskId) {
        // Mark that a child modal (feedback) is about to open so timeline won't be restored yet
        const detailEl = document.getElementById("taskDetailModal");
        if (detailEl) {
            detailEl.setAttribute('data-child-opened', '1');

            // Remove any existing timeline handler temporarily to prevent conflicts
            if (detailEl._timelineHiddenHandler) {
                detailEl.removeEventListener('hidden.bs.modal', detailEl._timelineHiddenHandler);
                detailEl._timelineHiddenHandlerBackup = detailEl._timelineHiddenHandler;
                detailEl._timelineHiddenHandler = null;
            }

            const detailModal = bootstrap.Modal.getInstance(detailEl) || new bootstrap.Modal(detailEl);
            detailModal.hide();
        }

        // Show the feedback modal
        const feedbackModalEl = document.getElementById("taskFeedbackModal");
        if (!feedbackModalEl) {
            console.warn('taskFeedbackModal element not found');
            return;
        }
        const feedbackModal = new bootstrap.Modal(feedbackModalEl);

        // Set task ID on modal
        feedbackModalEl.dataset.taskId = taskId;

        const modalTitle = feedbackModalEl.querySelector(".feedback-modal-title") || document.getElementById("taskFeedbackModalLabel");
        const modalBody = feedbackModalEl.querySelector(".feedback-modal-body") || document.getElementById("taskFeedbackList");
        // Reset modal
        if (modalTitle) modalTitle.textContent = "Task Feedback";
        if (modalBody) modalBody.innerHTML = "";

        try { loadTaskFeedbackData(taskId); } catch(_) {}

        feedbackModal.show();

        // Clean up any duplicate modal backdrops
        document.querySelectorAll('.modal-backdrop').forEach((el, idx, arr) => {
            if (idx < arr.length - 1) el.remove();
        });
    }

    // Function to show add feedback form in the modal
    function showAddFeedbackForm(taskId) {
        const modalTitle = document.getElementById("taskFeedbackModalLabel");
        const modalBody = document.getElementById("taskFeedbackList");

    modalTitle.textContent = "Add Feedback";
        modalBody.innerHTML = "";

        const form = document.createElement("form");
        form.id = "addFeedbackForm";
        form.enctype = "multipart/form-data";

        const taskIdInput = document.createElement("input");
        taskIdInput.type = "hidden";
        taskIdInput.name = "task_id";
        taskIdInput.value = taskId;

        const employeeIdInput = document.createElement("input");
        employeeIdInput.type = "hidden";
        employeeIdInput.name = "employee_id";
        employeeIdInput.value =
            document
                .getElementById("taskFeedbackModal")
                .getAttribute("data-employee-id") || "";

        form.appendChild(taskIdInput);
        form.appendChild(employeeIdInput);

                // Image upload
        const imageDiv = document.createElement("div");
        imageDiv.className = "mb-3";

        const imageLabelTitle = document.createElement("div");
        imageLabelTitle.className = "title-label-image";
        imageLabelTitle.textContent = "Upload Image";
        imageDiv.appendChild(imageLabelTitle);

        const imageLabel = document.createElement("label");
        imageLabel.className = "custom-image-upload position-relative";
        imageLabel.style.backgroundPosition = "center center";
        imageLabel.style.backgroundRepeat = "no-repeat";
        imageLabel.style.backgroundSize = "50%";
        imageLabel.style.backgroundImage =
            "url('" + appUrl + "/asset/img/background/add-image.png')";
        imageLabel.htmlFor = "feedback_image";

        const imageInput = document.createElement("input");
        imageInput.type = "file";
        imageInput.className = "input-image";
        imageInput.id = "feedback_image";
        imageInput.name = "feedback_image";
        imageInput.accept = "image/*";
        imageInput.hidden = true;

        const imageClearBtn = document.createElement("span");
        imageClearBtn.className = "image-clear-btn d-none";
        imageClearBtn.id = "feedbackImageClearBtn";
        imageClearBtn.title = "Remove image";
        imageClearBtn.textContent = "×";

        imageLabel.appendChild(imageInput);
        imageLabel.appendChild(imageClearBtn);
        imageDiv.appendChild(imageLabel);

        form.appendChild(imageDiv);

        // Comment field
        const commentDiv = document.createElement("div");
        commentDiv.className = "mb-3 custom-input";

        const commentLabel = document.createElement("label");
        commentLabel.htmlFor = "feedback_comment";
        commentLabel.className = "form-label label-custom";
        commentLabel.textContent = "Comment";
        commentDiv.appendChild(commentLabel);

        const commentTextarea = document.createElement("textarea");
        commentTextarea.className = "form-control input-text";
        commentTextarea.id = "feedback_comment";
        commentTextarea.name = "feedback_comment";
        commentTextarea.rows = 3;
        commentTextarea.required = true;
        commentDiv.appendChild(commentTextarea);

        form.appendChild(commentDiv);

        // Reference URL
        const refUrlDiv = document.createElement("div");
        refUrlDiv.className = "mb-3 custom-input";

        const refUrlLabel = document.createElement("label");
        refUrlLabel.htmlFor = "reference_url";
        refUrlLabel.className = "form-label label-custom";
        refUrlLabel.textContent = "Reference URL";
        refUrlDiv.appendChild(refUrlLabel);

        const refUrlInput = document.createElement("input");
        refUrlInput.type = "text";
        refUrlInput.className = "form-control input-text";
        refUrlInput.id = "reference_url";
        refUrlInput.name = "reference_url";
        refUrlDiv.appendChild(refUrlInput);

        form.appendChild(refUrlDiv);

    // Reference Files
        const refFileDiv = document.createElement("div");
        refFileDiv.className = "mb-3 custom-input";

        const refFileLabel = document.createElement("label");
    refFileLabel.htmlFor = "reference_files";
        refFileLabel.className = "form-label label-custom";
    refFileLabel.textContent = "Reference Files";
        refFileDiv.appendChild(refFileLabel);

        const refFileInput = document.createElement("input");
        refFileInput.type = "file";
        refFileInput.className = "form-control input-text";
    refFileInput.id = "reference_files";
    refFileInput.name = "reference_files[]";
    refFileInput.accept = "image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip";
    refFileInput.multiple = true;
        refFileDiv.appendChild(refFileInput);

        form.appendChild(refFileDiv);

        // Render form into body
        modalBody.appendChild(form);

        // Setup image preview
        setupImageInput(imageInput, imageLabel, imageClearBtn);

        // Form submission handler
        form.addEventListener("submit", function (e) {
            e.preventDefault();
            submitTaskFeedbackForm(this, taskId);
        });

        // Use unified footer: Close + Submit
        setUnifiedTaskFeedbackFooter(taskId, 'Submit', function(){
            const form = document.getElementById('addFeedbackForm');
            if (form) submitTaskFeedbackForm(form, taskId);
        });

        // Initialize Quill editors after modal content is set (second version)
        try {
            if (typeof initTaskFeedbackQuillEditors === 'function') {
                initTaskFeedbackQuillEditors(modalBody);
            }
        } catch (_) {}
    }

    // Helper to clear reply state
    function clearReplyState() {
        try {
            const pid = document.getElementById('inline_parent_id_input');
            if (pid) pid.value = '';
            const previewContainer = document.getElementById('reply_parent_preview_inline');
            if (previewContainer) previewContainer.remove();
        } catch(_) {}
    }

    // Show reply form (using inline approach like project.js)
    function showReplyFeedbackForm(taskId, parentId) {
        try {
            const feedbackModalEl = document.getElementById("taskFeedbackModal");
            const modalTitle = feedbackModalEl.querySelector(".feedback-modal-title");
            const modalBody = feedbackModalEl.querySelector(".feedback-modal-body");

            // Look for the inline feedback form in the modal footer
            const inlineForm = feedbackModalEl.querySelector('.feedback-form');
            if (inlineForm) {
                // Create or update hidden parent id input
                let inlinePid = inlineForm.querySelector('#inline_parent_id_input');
                if (!inlinePid) {
                    inlinePid = document.createElement('input');
                    inlinePid.type = 'hidden';
                    inlinePid.id = 'inline_parent_id_input';
                    inlinePid.name = 'parent_id';
                    inlineForm.appendChild(inlinePid);
                }
                inlinePid.value = parentId || '';

                // Prepare preview container inside inline form
                let previewContainer = inlineForm.querySelector('#reply_parent_preview_inline');
                if (!previewContainer) {
                    previewContainer = document.createElement('div');
                    previewContainer.id = 'reply_parent_preview_inline';
                    previewContainer.className = 'mt-2';
                }

                // Default preview while fetching
                previewContainer.innerHTML = '<div class="selected-files-list mt-2"><div class="d-flex align-items-center gap-2 p-2 rounded bg-light selected-task"><div style="width:28px;height:28px;border-radius:50%;overflow:hidden;flex:0 0 28px;display:flex;align-items:center;justify-content:center;"><span class="material-symbols-outlined">person</span></div><div class="flex-grow-1" style="font-size: 10px;"><div style="font-weight:500;font-size:11px">Loading...</div><div style="font-size:10px;color:#6b6b6b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:240px;">&nbsp;</div></div><button type="button" class="btn btn-sm btn-remove-task remove-task" style="line-height: 1; font-size: 10px;"><span class="material-symbols-outlined">close</span></button></div></div>';

                // Fetch feedback data to show preview
                try {
                    fetch(appUrl + '/task-feedbacks/' + taskId)
                        .then(function (res) {
                            if (!res.ok) return res.json().then(Promise.reject);
                            return res.json();
                        })
                        .then(function (json) {
                            const payload = json && json.data ? json.data : json;
                            let fb = null;

                            // Find feedback by parentId
                            function findById(node, id) {
                                if (!node) return null;
                                if (Array.isArray(node)) {
                                    for (let k = 0; k < node.length; k++) {
                                        const r = findById(node[k], id);
                                        if (r) return r;
                                    }
                                    return null;
                                }
                                try {
                                    if (node && String(node.id) === String(id)) return node;
                                    if (node && node.replies && Array.isArray(node.replies)) {
                                        const rr = findById(node.replies, id);
                                        if (rr) return rr;
                                    }
                                } catch (_) {}
                                return null;
                            }

                            fb = findById(payload, parentId);

                            const title = (fb && fb.employee && (fb.employee.name || fb.employee.fullname)) ||
                                         (fb && (fb.employee_name || fb.employee_fullname)) || 'Unknown';
                            const commentRaw = (fb && (fb.feedback_comment || fb.comment || fb.description)) || '';

                            try {
                                const empRaw = (fb && fb.employee) || {};
                                let avatarRaw = empRaw.user_photo || empRaw.profile_picture || empRaw.photo || fb.employee_photo || '';
                                // Use the same buildPhotoUrl helper from task.js if available
                                const avatarUrl = (typeof buildPhotoUrl === 'function') ?
                                    buildPhotoUrl(avatarRaw, empRaw.profile_picture, empRaw.profile_picture_url) :
                                    (avatarRaw ? appUrl + '/file/profile_picture/' + avatarRaw : appUrl + '/asset/img/avatar.png');

                                let plain = '';
                                try {
                                    plain = (commentRaw || '').replace(/<[^>]+>/g, '');
                                } catch (_) {
                                    plain = (commentRaw || '') + '';
                                }
                                if (plain && plain.length > 120) plain = plain.substring(0, 120).trim() + '...';

                                let html = '';
                                html += '<div class="selected-files-list mt-2">';
                                html += '<div class="d-flex align-items-center gap-2 p-2 rounded bg-light selected-task">';
                                html += '<div style="width:28px;height:28px;border-radius:50%;overflow:hidden;flex:0 0 28px;display:flex;align-items:center;justify-content:center;">';
                                html += '<img src="' + avatarUrl + '" alt="avatar" style="width:28px;height:28px;object-fit:cover;display:block;" onerror="this.onerror=null;this.src=\'' + appUrl + '/asset/img/avatar.png\';">';
                                html += '</div>';
                                html += '<div class="flex-grow-1" style="font-size: 10px;">';
                                html += '<div style="font-weight:500;font-size:11px">' + (title || 'Unknown') + '</div>';
                                html += '<div style="font-size:10px;color:#6b6b6b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:240px;">' + (plain || '') + '</div>';
                                html += '</div>';
                                html += '<button type="button" class="btn btn-sm btn-remove-task remove-task" style="line-height: 1; font-size: 10px;"><span class="material-symbols-outlined">close</span></button>';
                                html += '</div></div>';
                                previewContainer.innerHTML = html;
                            } catch (_) {}

                            try {
                                const btn = previewContainer.querySelector('.remove-task');
                                if (btn) btn.addEventListener('click', function () {
                                    try {
                                        previewContainer.remove();
                                        inlinePid.value = '';
                                    } catch (_) {}
                                });
                            } catch (_) {}
                        })
                        .catch(function () {
                            // Handle error with remove button
                            try {
                                const btn = previewContainer.querySelector('.remove-task');
                                if (btn) btn.addEventListener('click', function () {
                                    try {
                                        previewContainer.remove();
                                        inlinePid.value = '';
                                    } catch (_) {}
                                });
                            } catch (_) {}
                        });
                } catch (_) {}

                // Insert preview before inline files preview if present
                try {
                    const filesPreview = inlineForm.querySelector('#inline_feedback_files_preview');
                    const editor = inlineForm.querySelector('#inline_feedback_editor');
                    if (filesPreview && filesPreview.parentNode) {
                        filesPreview.parentNode.insertBefore(previewContainer, filesPreview);
                    } else if (editor && editor.parentNode) {
                        editor.parentNode.insertBefore(previewContainer, editor);
                    } else {
                        inlineForm.insertBefore(previewContainer, inlineForm.firstChild);
                    }
                } catch(_) {}

                // Focus inline editor
                try {
                    const editorEl = document.querySelector('#inline_feedback_editor .ql-editor');
                    if (editorEl) {
                        editorEl.focus();
                        // Scroll into view smoothly
                        editorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                } catch(_) {}

                return; // handled via inline form
            }

            // Fallback: if no inline form found, show message
            try {
                showFloatingAlert('Reply functionality requires inline feedback form.', 'warning', 3000);
            } catch (_) {
                console.warn('No inline feedback form found for reply');
            }

        } catch (e) {
            console.warn("showReplyFeedbackForm error", e);
        }
    }

    // Show edit form (for feedback or reply) with prefilled data
    function showEditFeedbackForm(taskId, data, isReply) {
        const feedbackModalEl = document.getElementById("taskFeedbackModal");
        const modalTitle = feedbackModalEl.querySelector(".feedback-modal-title") || document.getElementById("taskFeedbackModalLabel");
        const modalBody = feedbackModalEl.querySelector(".feedback-modal-body") || document.getElementById("taskFeedbackList");
        const addFeedbackButton = document.getElementById("addFeedbackButton");

        if (modalTitle) modalTitle.textContent = isReply ? "Edit Reply" : "Edit Feedback";

        // Build form HTML
        const existingImg = data.image_url || '';
        const bgImage = existingImg ? `background-image: url('${existingImg}'); background-size: cover; opacity: 1;` : `background-image: url('${appUrl}/asset/img/background/add-image.png'); background-size: 50%; opacity: 0.5;`;
        const clearBtnClass = existingImg ? '' : 'd-none';

        modalBody.innerHTML = `
            <form id="editFeedbackForm" enctype="multipart/form-data">
                <input type="hidden" name="task_id" value="${taskId}">
                ${data.parent_id ? `<input type=\"hidden\" name=\"parent_id\" value=\"${data.parent_id}\">` : ''}

                <!-- Attachment buttons (Photo & File) -->
                <div class="mb-3">
                    <label class="form-label">Attachment</label>
                    <div class="d-flex align-items-center">
                        <button type="button" class="btn btn-outline-secondary d-flex align-items-center" id="taskEditFeedbackPhotoBtn">
                            <span class="material-symbols-outlined me-1">photo_camera</span>Photo
                        </button>
                        <button type="button" class="btn btn-outline-secondary d-flex align-items-center ms-2" id="taskEditFeedbackFileBtn">
                            <span class="material-symbols-outlined me-1">attach_file</span>File
                        </button>
                    </div>
                    <!-- Hidden inputs -->
                    <input type="file" id="task_edit_feedback_image_input" ${isReply ? 'name="image"' : 'name="feedback_image"'} accept="image/*" hidden>
                    <input type="file" id="task_edit_feedback_files_input" name="reference_files[]" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip" multiple hidden>
                </div>

                <div class="mb-3 custom-input">
                    <label for="feedback_comment" class="form-label">Feedback Comment</label>

                    <!-- Quill toolbar + editor (visual) -->
                    <div id="task_edit_feedback_toolbar">
                        <span class="ql-formats">
                            <button class="ql-bold"></button>
                            <button class="ql-italic"></button>
                            <button class="ql-underline"></button>
                        </span>
                        <span class="ql-formats">
                            <button class="ql-list" value="ordered"></button>
                            <button class="ql-list" value="bullet"></button>
                        </span>
                        <span class="ql-formats">
                            <button class="ql-link"></button>
                        </span>
                    </div>

                    <div id="task_edit_feedback_editor"
                        style="min-height:120px; background:#fff; border:1px solid #e3e6ee; border-radius:6px;"></div>

                    <!-- canonical hidden textarea so backend controllers keep receiving same payload -->
                    <textarea class="form-control input-text d-none" id="feedback_comment" name="feedback_comment" rows="3" required style="display:none;">${data.feedback_comment || ''}</textarea>
                </div>

                <div class="mb-3 custom-input">
                    <label class="form-label">Reference URLs (Optional)</label>
                    <div id="feedback_reference_urls_container" class="d-flex flex-column gap-2"></div>
                </div>

                <div class="mb-3 custom-input">
                    <label class="form-label">Reference Files (Optional)</label>
                    <div id="task_edit_feedback_files_preview" class="mt-2"></div>
                    <div id="existing_feedback_reference_files" class="mt-2"></div>
                    <input type="hidden" id="existing_feedback_reference_files_input" name="existing_reference_files" value="[]">
                </div>
            </form>
        `;

        // Wire image preview/clear
        (function(){
            try {
                const imageInput = modalBody.querySelector('#feedback_image');
                const imageLabel = modalBody.querySelector('#editFeedbackImageLabel');
                const imageClearBtn = modalBody.querySelector('#editFeedbackImageClearBtn');

                if (imageInput) {
                    imageInput.addEventListener('change', function () {
                        if (this.files && this.files[0]) {
                            const file = this.files[0];
                            if (file.size > MAX_IMAGE_BYTES) {
                                try { if (typeof showFloatingAlert === 'function') showFloatingAlert('Image must be smaller than 10 MB.', 'warning'); } catch(_) { alert('Image must be smaller than 10 MB.'); }
                                this.value = '';
                                return;
                            }
                            const reader = new FileReader();
                            reader.onload = function (e) {
                                try {
                                    if (imageLabel) {
                                        imageLabel.style.backgroundImage = `url('${e.target.result}')`;
                                        imageLabel.classList.add('has-image');
                                        imageLabel.style.backgroundSize = 'cover';
                                        imageLabel.style.opacity = '1';
                                    }
                                    if (imageClearBtn) imageClearBtn.classList.remove('d-none');
                                } catch (_) {}
                            };
                            reader.readAsDataURL(file);
                        }
                    });
                }

                if (imageClearBtn) {
                    imageClearBtn.addEventListener('click', function (e) {
                        e.preventDefault();
                        try {
                            if (imageInput) imageInput.value = '';
                            if (imageLabel) {
                                imageLabel.style.backgroundImage = `url('${appUrl}/asset/img/background/add-image.png')`;
                                imageLabel.style.backgroundPosition = 'center center';
                                imageLabel.style.backgroundRepeat = 'no-repeat';
                                imageLabel.style.backgroundSize = '50%';
                                imageLabel.classList.remove('has-image');
                                imageLabel.style.opacity = '0.5';
                            }
                            imageClearBtn.classList.add('d-none');
                        } catch (_) {}
                    });
                }
            } catch (_) {}
        })();

        // Prefill multiple reference URLs for edit form
        (function() {
            const container = modalBody.querySelector('#feedback_reference_urls_container');
            if (!container) return;
            let urls = [];
            if (Array.isArray(data.reference_urls) && data.reference_urls.length > 0) {
                urls = data.reference_urls;
            } else if (data.reference_url) {
                urls = [data.reference_url];
            }
            if (urls.length === 0) {
                // add one empty row
                const row = document.createElement('div');
                row.className = 'd-flex gap-2 align-items-center';
                row.innerHTML = `<input type="url" class="form-control" name="reference_urls[]" placeholder="https://example.com">` +
                    `<button type="button" class="btn btn-submit-black add-ref-url" aria-label="Add URL"><span class="material-symbols-outlined">add</span></button>`;
                container.appendChild(row);
            } else {
                urls.forEach((u, idx) => {
                    const row = document.createElement('div');
                    row.className = 'd-flex gap-2 align-items-center';
                    const controls = (idx === 0)
                        ? `<button type="button" class="btn btn-submit-black add-ref-url" aria-label="Add URL"><span class="material-symbols-outlined">add</span></button>`
                        : `<button type="button" class="btn btn-remove-url remove-ref-url" aria-label="Remove URL"><span class="material-symbols-outlined">close</span></button>`;
                    row.innerHTML = `<input type="url" class="form-control" name="reference_urls[]" value="${u}" placeholder="https://example.com">${controls}`;
                    container.appendChild(row);
                });
            }
        })();

        // Prefill existing reference files as removable list
        (function() {
            const container = document.getElementById('existing_feedback_reference_files');
            const hidden = document.getElementById('existing_feedback_reference_files_input');
            if (!container || !hidden) return;
            // data.reference_files_urls contains absolute URLs; we need display names while keeping URL for click
            let files = Array.isArray(data.reference_files_urls) ? data.reference_files_urls.slice() : [];
            // Fallback single
            if (files.length === 0 && data.reference_file_url) files = [data.reference_file_url];
            // Initialize state as array of URLs (server will derive file names if needed)
            let kept = files.slice();
            hidden.value = JSON.stringify(kept);

            container.innerHTML = '';
            if (files.length > 0) {
                files.forEach((url, idx) => {
                    const item = document.createElement('div');
                    item.className = 'existing-file-item d-flex align-items-center justify-content-between mb-2 p-2 bg-light border rounded';
                    const info = document.createElement('div');
                    info.className = 'd-flex align-items-center flex-grow-1';
                    const icon = document.createElement('span');
                    icon.className = 'material-symbols-outlined me-2';
                    icon.textContent = 'description';
                    const link = document.createElement('a');
                    link.href = url;
                    link.target = '_blank';
                    const fileName = (function(){
                        try { const u = new URL(url, window.location.origin); return decodeURIComponent(u.pathname.split('/').pop()); } catch(e) {
                            const parts = String(url).split('/'); return decodeURIComponent(parts[parts.length-1] || String(url));
                        }
                    })();
                    link.textContent = fileName;
                    const remove = document.createElement('button');
                    remove.type = 'button';
                    remove.className = 'btn btn-sm btn-outline-danger ms-2';
                    remove.innerHTML = '&times;';
                    remove.addEventListener('click', function(){
                        // remove from DOM and state
                        const indexInKept = kept.indexOf(url);
                        if (indexInKept !== -1) { kept.splice(indexInKept, 1); hidden.value = JSON.stringify(kept); }
                        item.remove();
                    });
                    info.appendChild(icon);
                    info.appendChild(link);
                    item.appendChild(info);
                    item.appendChild(remove);
                    container.appendChild(item);
                });
            }
        })();

        // Setup selected-files preview for reference files (same UX as Add/Reply)
        try {
            selectedFiles = [];
            const refInput = modalBody.querySelector('#reference_files');
            if (refInput) {
                refInput.addEventListener('change', function () {
                    const files = Array.from(this.files || []);
                    if (files.length) {
                        selectedFiles = [...selectedFiles, ...files];
                        if (typeof displaySelectedFiles === 'function') {
                            displaySelectedFiles();
                        }
                    }
                    this.value = '';
                });
            }
        } catch (_) {}

        // Setup photo/file button handlers for edit form
        try {
            const photoBtn = document.getElementById('taskEditFeedbackPhotoBtn');
            const fileBtn = document.getElementById('taskEditFeedbackFileBtn');
            const imageInput = document.getElementById('task_edit_feedback_image_input');
            const filesInput = document.getElementById('task_edit_feedback_files_input');

            if (photoBtn && imageInput) {
                photoBtn.addEventListener('click', function() {
                    imageInput.click();
                });
            }

            if (fileBtn && filesInput) {
                fileBtn.addEventListener('click', function() {
                    filesInput.click();
                });
            }

            // Image input handler
            if (imageInput) {
                imageInput.addEventListener('change', function() {
                    const file = this.files && this.files[0];
                    if (!file) return;

                    // Size validation
                    if (file.size > MAX_IMAGE_BYTES) {
                        if (typeof showFloatingAlert === 'function') {
                            showFloatingAlert('Image must be smaller than 10 MB.', 'warning');
                        }
                        this.value = '';
                        return;
                    }

                    // Create preview
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        showInlineImagePreviewSmall(file, e.target.result);
                    };
                    reader.readAsDataURL(file);
                });
            }

            // Files input handler
            if (filesInput) {
                filesInput.addEventListener('change', function() {
                    const files = Array.from(this.files || []);
                    if (!files.length) return;

                    // Add to selection
                    if (!window.taskEditFeedbackSelectedFiles) window.taskEditFeedbackSelectedFiles = [];
                    window.taskEditFeedbackSelectedFiles = [...window.taskEditFeedbackSelectedFiles, ...files];

                    // Render preview
                    renderTaskEditFeedbackFilesPreview();
                    this.value = '';
                });
            }
        } catch (_) {}

        setUnifiedTaskFeedbackFooter(taskId, 'Save', function(){
            const form = document.getElementById('editFeedbackForm');
            if (!form) return; submitEditFeedbackForm(form, taskId, data.id, isReply);
        });

        // Initialize Quill editors after modal content is set and pre-fill with existing content
        try {
            if (typeof initTaskFeedbackQuillEditors === 'function') {
                initTaskFeedbackQuillEditors(modalBody);
                // Set content for edit form
                if (window.__quillTaskFeedbackEdit && data.feedback_comment) {
                    window.__quillTaskFeedbackEdit.root.innerHTML = data.feedback_comment || '';
                }
            }
        } catch (_) {}
    }

    // Helper to unify footer button styling (Close + Submit/Save) identical to Add Feedback modal
    function setUnifiedTaskFeedbackFooter(taskId, submitLabel, onSubmit){
        const modal = document.getElementById('taskFeedbackModal');
        if (!modal) return;
        // Be flexible: task modal footer may not have .feedback-modal-footer class
        let footer = modal.querySelector('.feedback-modal-footer')
                  || modal.querySelector('.modal-footer')
                  || modal.querySelector('.modal-footer-custom');
        if (!footer) {
            const addBtn = modal.querySelector('#addFeedbackButton');
            if (addBtn && addBtn.parentElement) footer = addBtn.parentElement;
        }
        const titleEl = modal.querySelector('.feedback-modal-title');
        if (!footer) return;
        footer.innerHTML = '';
        const wrapper = document.createElement('div');
        wrapper.id = 'taskFeedbackFormButtonsWrapper';
        wrapper.className = 'd-flex gap-2 w-100';
        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'btn btn-close-reply flex-grow-1';
        closeBtn.textContent = 'Close';
        closeBtn.addEventListener('click', function(){
            if (titleEl) titleEl.textContent = 'Task Feedback';
            loadTaskFeedbackData(taskId); // This will restore inline editor via setupTaskInlineFeedbackEditor
        });
        const submitBtn = document.createElement('button');
        submitBtn.type = 'button';
        submitBtn.className = 'btn btn-submit-black flex-grow-1';
        submitBtn.textContent = submitLabel;
        submitBtn.addEventListener('click', function(e){ e.preventDefault(); onSubmit && onSubmit(); });
        wrapper.appendChild(closeBtn);
        wrapper.appendChild(submitBtn);
        footer.appendChild(wrapper);
    }

    function submitEditFeedbackForm(form, taskId, id, isReply) {
        const submitBtn = document.getElementById('addFeedbackButton');
        const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            submitBtn.disabled = true;
        }

        // Validate image and total sizes before creating FormData
        try {
            const imageEl = form.querySelector('#feedback_image') || document.getElementById('feedback_image');
            const imageFile = (imageEl && imageEl.files && imageEl.files[0]) ? imageEl.files[0] : null;
            if (imageFile && imageFile.size > MAX_IMAGE_BYTES) {
                try { if (typeof showFloatingAlert === 'function') showFloatingAlert('Image must be smaller than 10 MB.', 'warning'); } catch(_) { alert('Image must be smaller than 10 MB.'); }
                if (submitBtn) { submitBtn.innerHTML = originalBtnHtml; submitBtn.disabled = false; }
                return;
            }
            const totalCheck = validateTotalUploadSize({imageFile: imageFile, extraFiles: selectedFiles});
            if (!totalCheck.ok) {
                try { if (typeof showFloatingAlert === 'function') showFloatingAlert('Total upload size must be 100 MB or less.', 'warning'); } catch(_) { alert('Total upload size must be 100 MB or less.'); }
                if (submitBtn) { submitBtn.innerHTML = originalBtnHtml; submitBtn.disabled = false; }
                return;
            }
        } catch(_) {}

        const formData = new FormData(form);
        formData.append('_method', 'PUT');
        // Append any newly selected reference files from preview buffer
        try {
            const editSelectedFiles = window.taskEditFeedbackSelectedFiles || selectedFiles || [];
            if (Array.isArray(editSelectedFiles) && editSelectedFiles.length > 0) {
                editSelectedFiles.forEach(file => formData.append('reference_files[]', file));
            }
        } catch (_) {}
        // Ensure correct image field name already set in form; nothing extra here

        $.ajax({
            url: appUrl + "/task-feedbacks/" + id,
            type: "POST",
            data: formData,
            contentType: false,
            processData: false,
            headers: {
                "X-CSRF-TOKEN": document
                    .querySelector('meta[name="csrf-token"]')
                    .getAttribute("content"),
            },
            success: function (response) {
                if (typeof showFloatingAlert === 'function') {
                    showFloatingAlert(response.message || 'Feedback updated successfully!', 'success');
                }
                // Return to list view
                const titleEl = document.querySelector('#taskFeedbackModal .feedback-modal-title') || document.getElementById('taskFeedbackModalLabel');
                if (titleEl) titleEl.textContent = 'Task Feedback';
                // Restore Add Feedback button in footer (replace Save/Close)
                const feedbackModalEl = document.getElementById('taskFeedbackModal');
                let footer = feedbackModalEl?.querySelector('.feedback-modal-footer')
                          || feedbackModalEl?.querySelector('.modal-footer')
                          || feedbackModalEl?.querySelector('.modal-footer-custom');
                if (!footer) {
                    const maybeBtn = feedbackModalEl?.querySelector('#addFeedbackButton');
                    if (maybeBtn && maybeBtn.parentElement) footer = maybeBtn.parentElement;
                }
                if (footer) {
                    let addBtn = footer.querySelector('#addFeedbackButton');
                    // Always clear footer to remove Save/Close wrapper
                    footer.innerHTML = '';
                    if (!addBtn) {
                        addBtn = document.createElement('button');
                        addBtn.type = 'button';
                        addBtn.className = 'btn btn-submit-black w-100';
                        addBtn.id = 'addFeedbackButton';
                        addBtn.textContent = 'Add Feedback';
                        footer.appendChild(addBtn);
                    } else {
                        addBtn.textContent = 'Add Feedback';
                        const fresh = addBtn.cloneNode(true);
                        addBtn.parentNode.replaceChild(fresh, addBtn);
                        addBtn = fresh;
                        footer.appendChild(addBtn);
                    }
                    addBtn.disabled = false;
                    addBtn.removeAttribute('disabled');
                    addBtn.addEventListener('click', () => showAddFeedbackForm(taskId));
                }
                loadTaskFeedbackData(taskId);
                // Refresh snippets/badges best-effort
                try { scheduleRefreshLatestFeedbackSnippets(10); } catch(_) {}
                // Refresh task cards to update counts immediately
                try { fetchAndRenderTasks(); } catch(_) {}
            },
            error: function (xhr) {
                let errorMessage = 'Failed to update feedback. Please try again.';
                if (xhr.responseJSON && xhr.responseJSON.errors) {
                    errorMessage = Object.values(xhr.responseJSON.errors).flat().join("\n");
                } else if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMessage = xhr.responseJSON.message;
                }
                if (typeof showFloatingAlert === 'function') {
                    showFloatingAlert(errorMessage, 'danger');
                } else {
                    alert(errorMessage);
                }
            },
            complete: function () {
                if (submitBtn) {
                    submitBtn.innerHTML = originalBtnHtml || 'Save';
                    submitBtn.disabled = false;
                }
                // Clear preview buffer after save
                try { selectedFiles = []; const preview = document.getElementById('feedback_reference_files_preview'); if (preview) preview.innerHTML = ''; } catch(_) {}
            }
        });
    }

    // Function to submit feedback form via AJAX (unified spinner + floating alert)
    function submitFeedbackForm(form, taskId) {
        const submitBtn =
            form.querySelector("button[type='submit']") ||
            document.getElementById("addFeedbackButton");
        const originalBtnHtml = submitBtn ? submitBtn.innerHTML : "";

        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            submitBtn.disabled = true;
        }

        // Validate image and total sizes before creating FormData
        try {
            const imageEl = form.querySelector('#feedback_image') || document.getElementById('feedback_image');
            const imageFile = (imageEl && imageEl.files && imageEl.files[0]) ? imageEl.files[0] : null;
            if (imageFile && imageFile.size > MAX_IMAGE_BYTES) {
                try { if (typeof showFloatingAlert === 'function') showFloatingAlert('Image must be smaller than 10 MB.', 'warning'); } catch(_) { alert('Image must be smaller than 10 MB.'); }
                if (submitBtn) { submitBtn.innerHTML = originalBtnHtml; submitBtn.disabled = false; }
                return;
            }
            const totalCheck = validateTotalUploadSize({imageFile: imageFile, extraFiles: selectedFiles});
            if (!totalCheck.ok) {
                try { if (typeof showFloatingAlert === 'function') showFloatingAlert('Total upload size must be 100 MB or less.', 'warning'); } catch(_) { alert('Total upload size must be 100 MB or less.'); }
                if (submitBtn) { submitBtn.innerHTML = originalBtnHtml; submitBtn.disabled = false; }
                return;
            }
        } catch(_) {}

        const formData = new FormData(form);
        // Ensure selectedFiles (from preview buffer) are appended
        try {
            if (Array.isArray(selectedFiles) && selectedFiles.length > 0) {
                selectedFiles.forEach(file => formData.append('reference_files[]', file));
            }
        } catch (_) {}

        $.ajax({
            url: appUrl + "/task-feedbacks",
            type: "POST",
            data: formData,
            contentType: false,
            processData: false,
            headers: {
                "X-CSRF-TOKEN": document
                    .querySelector('meta[name="csrf-token"]')
                    .getAttribute("content"),
            },
            success: function (response) {
                // Use the app's white alert style
                const msg = (response && response.message) || 'Feedback submitted successfully!';
                if (typeof window.showAlertMsg === 'function') {
                    window.showAlertMsg(String(msg), 'light', 2000);
                } else if (typeof showFloatingAlert === 'function') {
                    showFloatingAlert(msg, 'light', 2000);
                }
                // Switch back to list view inside the modal (keep modal open)
                try {
                    const feedbackModalEl = document.getElementById("taskFeedbackModal");
                    const titleEl = feedbackModalEl?.querySelector('.feedback-modal-title');
                    if (titleEl) titleEl.textContent = 'Task Feedback';
                    // Restore Add Feedback button in footer (replace Submit/Close wrapper)
                    let footer = feedbackModalEl?.querySelector('.feedback-modal-footer')
                              || feedbackModalEl?.querySelector('.modal-footer')
                              || feedbackModalEl?.querySelector('.modal-footer-custom');
                    if (!footer) {
                        const maybeBtn = feedbackModalEl?.querySelector('#addFeedbackButton');
                        if (maybeBtn && maybeBtn.parentElement) footer = maybeBtn.parentElement;
                    }
                    if (footer) {
                        // Clear any unified footer content
                        footer.innerHTML = '';
                        // Ensure Add Feedback button exists and is bound
                        let addBtn = document.getElementById('addFeedbackButton');
                        if (!addBtn) {
                            addBtn = document.createElement('button');
                            addBtn.type = 'button';
                            addBtn.className = 'btn btn-submit-black w-100';
                            addBtn.id = 'addFeedbackButton';
                            addBtn.textContent = 'Add Feedback';
                            footer.appendChild(addBtn);
                        } else {
                            addBtn.textContent = 'Add Feedback';
                            const freshBtn = addBtn.cloneNode(true);
                            addBtn.parentNode.replaceChild(freshBtn, addBtn);
                            addBtn = freshBtn;
                            footer.appendChild(addBtn);
                        }
                        addBtn.disabled = false;
                        addBtn.removeAttribute('disabled');
                        addBtn.addEventListener('click', () => showAddFeedbackForm(taskId));
                    }
                    // Reload feedback list inside modal so newly created feedback appears without full page reload
                    try { loadTaskFeedbackData(taskId); } catch (e) { console.warn('Failed to reload feedback list', e); }
                } catch (e) { /* noop */ }

                // Clear local buffers and preview area after successful submit
                try {
                    selectedFiles = [];
                    const preview = document.getElementById('reference_files_preview');
                    if (preview) preview.innerHTML = '';
                } catch (_) {}

                // Also try to update feedback count in-place (best-effort)
                // 1) Optimistic UI increment
                (function () {
                    try {
                        const card = document.querySelector(`.custom-card[data-task-id="${taskId}"]`);
                        if (card) {
                            const span = card.querySelector('.feedback-comments-count');
                            const prev = span ? parseInt(span.textContent, 10) || 0 : 0;
                            const next = Math.max(prev + 1, 1);
                            if (span) { span.textContent = String(next); }
                            else {
                                const newSpan = document.createElement('span');
                                newSpan.className = 'feedback-comments-count ms-1';
                                newSpan.style.color = '#555';
                                newSpan.textContent = String(next);
                                const icon = card.querySelector('.task-icon.mode_comment');
                                if (icon && icon.parentNode) icon.parentNode.appendChild(newSpan);
                            }
                        }
                    } catch(_) {}
                })();
                // 2) Reconcile with server value (if provided and > 0)
                $.ajax({
                    url: appUrl + "/task-feedbacks/count/" + taskId,
                    type: "GET",
                    dataType: "json",
                    success: function (countResponse) {
                        const serverCount = (function (resp) {
                            if (!resp) return null;
                            const candidates = [resp.count, resp.total, resp?.data?.count, resp?.data?.total];
                            const val = candidates.find((v) => typeof v === 'number' && !isNaN(v));
                            return (typeof val === 'number') ? val : null;
                        })(countResponse);
                        if (typeof serverCount === 'number' && serverCount > 0) {
                            const taskCard = document.querySelector(`.custom-card[data-task-id="${taskId}"]`);
                            if (!taskCard) return;
                            let span = taskCard.querySelector('.feedback-comments-count');
                            if (!span) {
                                span = document.createElement('span');
                                span.className = 'feedback-comments-count ms-1';
                                span.style.color = '#555';
                                const icon = taskCard.querySelector('.task-icon.mode_comment');
                                if (icon && icon.parentNode) icon.parentNode.appendChild(span);
                            }
                            span.textContent = String(serverCount);
                        }
                    }
                });
                // Avoid page reload when closing modal
                try { feedbackSubmitted = false; } catch(_) {}
            },
            error: function (xhr) {
                let errorMessage = "Failed to submit feedback. Please try again.";
                if (xhr.responseJSON && xhr.responseJSON.errors) {
                    errorMessage = Object.values(xhr.responseJSON.errors).flat().join("\n");
                } else if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMessage = xhr.responseJSON.message;
                }
                if (typeof showFloatingAlert === 'function') {
                    showFloatingAlert(errorMessage, "danger");
                } else {
                    alert(errorMessage);
                }
            },
            complete: function () {
                if (submitBtn) {
                    submitBtn.innerHTML = originalBtnHtml;
                    submitBtn.disabled = false;
                }
                // Safety: clear preview buffer on completion
                try {
                    selectedFiles = [];
                } catch (_) {}
            },
        });
    }

    // Function to add event listeners for attach_file icon click
    function addAttachFileIconListeners() {
        if (attachFileIconListenerBound) return;

        document.addEventListener("click", function (event) {
            const target = event.target;

            if (
                target &&
                target.classList.contains("task-icon") &&
                target.textContent.trim() === "attach_file"
            ) {
                const taskCard = target.closest(".custom-card");
                if (!taskCard) return;

                const taskId = taskCard.getAttribute("data-task-id");
                if (!taskId) {
                    showFloatingAlert("Task ID not found.", "warning", 3000);
                    return;
                }

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
                            } catch (e) {
                                referenceFiles = referenceFiles.includes("[")
                                    ? []
                                    : referenceFiles
                                        .split(",")
                                        .map((s) => s.trim())
                                        .filter(Boolean);
                            }
                        }

                        const referenceFilesList = document.getElementById("referenceFilesList");
                        if (!referenceFilesList) return;
                        referenceFilesList.innerHTML = "";

                        // keep task id on the list for later operations (delete)
                        try { referenceFilesList.dataset.taskId = String(taskId || ''); } catch(_) {}

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
                                // DETEKSI khusus hanya gambar
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

                                // Delete button (only shown to PIC / authorized users on server-side enforcement)
                                const delBtn = document.createElement('button');
                                delBtn.type = 'button';
                                delBtn.className = 'btn btn-sm btn-link p-0 ms-2';
                                delBtn.title = 'Delete';
                                // color should match download (#444444)
                                delBtn.style.color = '#444444';
                                delBtn.innerHTML = '<span class="material-symbols-outlined icon-fill">delete</span>';
                                delBtn.addEventListener('click', function (ev) {
                                    ev.preventDefault(); ev.stopPropagation();
                                    try {
                                        showDeleteConfirmModal({
                                            type: 'reference_file',
                                            id: fileName,
                                            authorName: '',
                                            content: fileName,
                                            avatarUrl: '',
                                            parentModalId: 'referenceFilesModal',
                                            onConfirm: function (done) {
                                                // Prepare remaining files array and call update endpoint
                                                try {
                                                    const remaining = (Array.isArray(referenceFiles) ? referenceFiles.slice() : []).filter(f => String(f) !== String(fileName));
                                                    // Call dedicated delete endpoint to remove single reference file
                                                    $.ajax({
                                                        url: appUrl + '/task/' + taskId + '/reference-file',
                                                        type: 'DELETE',
                                                        data: { filename: fileName },
                                                        headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content') },
                                                        success: function (res) {
                                                            try { if (typeof showFloatingAlert === 'function') showFloatingAlert(res.message || 'Reference file deleted', 'success'); } catch(_) {}
                                                            // Remove item from DOM
                                                            if (item && item.parentNode) item.parentNode.removeChild(item);
                                                            // Update internal referenceFiles array so subsequent deletes are correct
                                                            try {
                                                                const idx = referenceFiles.indexOf(fileName);
                                                                if (idx !== -1) referenceFiles.splice(idx, 1);
                                                            } catch(_) {}
                                                            // Update badge on task card if present
                                                            try {
                                                                const card = document.querySelector('.custom-card[data-task-id="' + taskId + '"]');
                                                                if (card) {
                                                                    const span = card.querySelector('.reference-files-count');
                                                                    // compute new count (defensive); if it reaches 0, remove the badge entirely
                                                                    let newCount = 0;
                                                                    try {
                                                                        newCount = Math.max((parseInt(span ? span.textContent : '0', 10) || 0) - 1, 0);
                                                                    } catch(_) { newCount = 0; }
                                                                    if (span) {
                                                                        if (newCount <= 0) {
                                                                            try { span.remove(); } catch(_) { span.style.display = 'none'; }
                                                                        } else {
                                                                            span.textContent = String(newCount);
                                                                        }
                                                                    }
                                                                }
                                                            } catch(_) {}
                                                            // If there are no more reference files, show the empty message in the modal
                                                            try {
                                                                const rList = document.getElementById('referenceFilesList');
                                                                if (rList) {
                                                                    // if our in-memory referenceFiles array is empty, show default message
                                                                    if (!(Array.isArray(referenceFiles) && referenceFiles.length > 0)) {
                                                                        rList.innerHTML = '';
                                                                        rList.textContent = 'No reference files available.';
                                                                    }
                                                                }
                                                            } catch(_) {}
                                                            done(true);
                                                        },
                                                        error: function (xhr) {
                                                            let msg = 'Failed to delete reference file';
                                                            if (xhr.responseJSON && xhr.responseJSON.message) msg = xhr.responseJSON.message;
                                                            try { if (typeof showFloatingAlert === 'function') showFloatingAlert(msg, 'danger'); } catch(_) { alert(msg); }
                                                            done(false);
                                                        }
                                                    });
                                                } catch (e) {
                                                    try { if (typeof showFloatingAlert === 'function') showFloatingAlert('Failed to delete reference file', 'danger'); } catch(_) { }
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
                            try { modalEl.dataset.taskId = String(taskId || ''); } catch(_) {}
                            const detailEl = document.getElementById('taskDetailModal');
                            if (detailEl && bootstrap.Modal.getInstance(detailEl)) {
                                detailEl.setAttribute('data-child-opened', '1');

                                if (detailEl._timelineHiddenHandler) {
                                    detailEl._timelineHiddenHandlerBackup = detailEl._timelineHiddenHandler;
                                    detailEl.removeEventListener('hidden.bs.modal', detailEl._timelineHiddenHandler);
                                    detailEl._timelineHiddenHandler = null;
                                }

                                const detailModal = bootstrap.Modal.getInstance(detailEl);
                                if (detailModal) {
                                    detailModal.hide();
                                }
                            }

                            const referenceFilesModal = bootstrap.Modal.getOrCreateInstance(modalEl);
                            referenceFilesModal.show();
                        }
                    },
                    error: function () {
                        showFloatingAlert("Failed to load reference files.", "danger", 3000);
                    },
                });
            }
        });

        attachFileIconListenerBound = true;
    }

    document.addEventListener("click", function(e) {
        const deleteBtn = e.target.closest(".dropdown-item.cancel-task");
        if (deleteBtn) {
            const card = deleteBtn.closest("[data-task-id]");
            const taskId = card?.getAttribute("data-task-id");
            if (!taskId) return;

            const detailModalEl = document.getElementById("taskDetailModal");
            if (detailModalEl) {
                const detailModal = bootstrap.Modal.getInstance(detailModalEl);
                if (detailModal) {
                    detailModal.hide();
                    return;
                }
            }

            handleTaskCancel(taskId);
        }

        const softDeleteBtn = e.target.closest(".dropdown-item.delete-task");
        if (softDeleteBtn) {
            const card = softDeleteBtn.closest("[data-task-id]");
            const taskId = card?.getAttribute("data-task-id");
            if (!taskId) return;

            const detailModalEl = document.getElementById("taskDetailModal");
            if (detailModalEl) {
                const detailModal = bootstrap.Modal.getInstance(detailModalEl);
                if (detailModal) {
                    detailModal.hide();
                    // do not return; proceed to delete
                }
            }

            handleTaskDelete(taskId);
        }

        const editBtn = e.target.closest(".dropdown-item.edit-task");
        if (editBtn) {
            const card = editBtn.closest("[data-task-id]");
            const taskId = card?.getAttribute("data-task-id");
            if (!taskId) return;

            const detailModalEl = document.getElementById("taskDetailModal");
            if (detailModalEl) {
                const detailModal = bootstrap.Modal.getInstance(detailModalEl);
                if (detailModal) {
                    detailModal.hide();
                    return;
                }
            }

            handleTaskEdit(taskId);
        }

        const feedbackBtn = e.target.closest(".task-icon.mode-comment");
        if (feedbackBtn) {
            const card = feedbackBtn.closest("[data-task-id]");
            const taskId = card?.getAttribute("data-task-id");
            if (!taskId) return;

            const detailModalEl = document.getElementById("taskDetailModal");
            if (detailModalEl) {
                const detailModal = bootstrap.Modal.getInstance(detailModalEl);
                if (detailModal) {
                    detailModal.hide();
                }
            }

            handleTaskFeedback(taskId);
        }

        const referenceFileBtn = e.target.closest(".task-icon.attach-file");
        if (referenceFileBtn) {
            const card = referenceFileBtn.closest("[data-task-id]");
            const taskId = card?.getAttribute("data-task-id");
            if (!taskId) return;

            const detailModalEl = document.getElementById("taskDetailModal");
            if (detailModalEl) {
                const detailModal = bootstrap.Modal.getInstance(detailModalEl);
                if (detailModal) {
                    detailModal.hide();
                }
            }

            addAttachFileIconListeners(taskId);
        }
    });

    // Function to handle task detail view
    function handleTaskDetail(taskId) {
        $.ajax({
            url: appUrl + "/task/" + taskId,
            type: "GET",
            dataType: "json",
            success: function (res) {
                const task = res && (res.data || res);
                if (!task || typeof task !== "object") {
                    try { showFloatingAlert("Failed to load task details.", "danger", 3000); } catch(_) { alert("Failed to load task details."); }
                    return;
                }

                const taskImage = task.image ? `${appUrl}/file/task/${task.image}` : null;

                const avatarTitle = task.title || task.project_title || "NA";
                const useInitials = !taskImage;
                const initials = useInitials ? getTaskInitials(task.title) : "";
                const initialsColor = useInitials ? getRandomColorFromText(task.title) : "#6A5AE0";

                const avatarHtml = useInitials
                    ? `<div class="project-initial-avatar me-3" style="width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:14px;color:#fff;background:${initialsColor};">${initials}</div>`
                    : `<img src="${taskImage}" alt="Project Image" class="project-image me-3" style="width:48px;height:48px;object-fit:cover;border-radius:50%;" onerror="this.onerror=null; this.src='${appUrl}/asset/img/avatar.png'">`;

                const fallbackAvatar = `${appUrl}/asset/img/avatar.png`;
                const allExecutors = [];
                if (task.pic) {
                    allExecutors.push({ ...task.pic, role: "PIC" });
                }
                (task.executors || []).forEach(ex => {
                    if (ex && !allExecutors.some(e => e && e.id === ex.id)) {
                        allExecutors.push({ ...ex, role: "Executor" });
                    }
                });
                // Build vertical collaborator list HTML for Task Detail modal to match Project Detail
                function buildTaskCollaboratorsList(taskObj) {
                    try {
                        const items = [];
                        if (taskObj && taskObj.pic) items.push({ role: 'pic', emp: taskObj.pic });
                        if (taskObj && Array.isArray(taskObj.executors)) {
                            taskObj.executors.forEach(emp => items.push({ role: 'executor', emp }));
                        }

                        if (!items.length) return '<div class="text-muted small">No collaborators</div>';

                        function getName(emp) {
                            try {
                                return (
                                    emp?.name ||
                                    emp?.employee_name ||
                                    emp?.username ||
                                    emp?.full_name ||
                                    (emp?.employee && (emp.employee.name || emp.employee.full_name)) ||
                                    'Unknown'
                                );
                            } catch (_) { return 'Unknown'; }
                        }

                        function getDivision(emp) {
                            try {
                                // Try common fields first, then nested structures (mirror project.js logic)
                                return (
                                    emp?.division_name ||
                                    emp?.division ||
                                    emp?.division_title ||
                                    (typeof emp?.division === 'string' ? emp?.division : null) ||
                                    (typeof emp?.division === 'object' && (emp.division?.name || emp.division?.title)) ||
                                    emp?.employee_division ||
                                    (emp?.employee && (emp.employee.division_name || (emp.employee.division && (emp.employee.division.name || emp.employee.division.title)))) ||
                                    '-'
                                );
                            } catch (_) { return '-'; }
                        }

                        function resolvePhotoHtmlForTask(emp, size = 36, marginLeft = 0) {
                            let userPhoto = emp && (emp.profile_picture_url || emp.profile_picture || emp.user_photo || emp.user_photo_url || emp.photo || emp.image);
                            let photoUrl = '';
                            try {
                                if (userPhoto) {
                                    const raw = String(userPhoto).trim();
                                    const trimmed = raw.replace(/^\/+/, '');
                                    if (/^https?:\/\//i.test(raw)) photoUrl = raw;
                                    else if (/^(file\/|asset\/|storage\/)/.test(trimmed)) photoUrl = appUrl + '/' + trimmed;
                                    else if (raw.startsWith('/')) photoUrl = appUrl + raw;
                                    else if (raw.indexOf('/') !== -1) photoUrl = appUrl + '/' + trimmed;
                                    else photoUrl = appUrl + '/file/profile_picture/' + raw;
                                    photoUrl = photoUrl.replace(/\/storage\/asset\//, '/asset/');
                                } else {
                                    photoUrl = fallbackAvatar;
                                }
                            } catch (e) { photoUrl = fallbackAvatar; }

                            const name = (emp && (emp.name || emp.employee_name || emp.username || emp.full_name)) || 'Unknown';
                            const titleText = name;
                            return `<img src="${photoUrl}" alt="${name}" data-bs-toggle="tooltip" title="${titleText}" class="rounded-circle" style="width:${size}px;height:${size}px;object-fit:cover;${marginLeft ? 'margin-left:' + marginLeft + 'px;' : ''}" onerror="this.onerror=null;this.src='${fallbackAvatar}';">`;
                        }

                        const rows = items.map(({ role, emp }) => {
                            const name = getName(emp);
                            // For Task Detail, show each employee's role inside the task instead of division
                            function getRoleLabel(role, empObj) {
                                try {
                                    // Prefer explicit role on employee object if available
                                    if (empObj && empObj.role) return String(empObj.role).replace(/_/g, ' ');
                                    if (!role) return '-';
                                    switch (role) {
                                        case 'pic': return 'PIC';
                                        case 'executor': return 'Executor';
                                        case 'author': return 'Author';
                                        case 'co_author': return 'Co-author';
                                        case 'contributor': return 'Contributor';
                                        default: return String(role).charAt(0).toUpperCase() + String(role).slice(1);
                                    }
                                } catch (_) { return '-'; }
                            }
                            const roleLabel = getRoleLabel(role, emp);
                            const photo = resolvePhotoHtmlForTask(emp, 36, 0);
                            return (
                                '<div class="collab-item d-flex align-items-center mb-2">' +
                                    '<div class="flex-shrink-0">' + photo + '</div>' +
                                    '<div class="ms-2">' +
                                        '<div class="collab-name">' + (name || 'Unknown') + '</div>' +
                                        '<div class="collab-division text-muted">' + (roleLabel || '-') + '</div>' +
                                    '</div>' +
                                '</div>'
                            );
                        });

                        return '<div class="collab-list">' + rows.join('') + '</div>';
                    } catch (e) {
                        return '<div class="text-muted small">No collaborators</div>';
                    }
                }

                let refUrlsHtml = '';
                const referenceUrls = task.reference_urls || (task.reference_url ? [task.reference_url] : []);
                if (Array.isArray(referenceUrls) && referenceUrls.length) {
                    refUrlsHtml = '<div class="mb-2">';
                    referenceUrls.forEach((u, idx) => {
                        refUrlsHtml += `<div class="d-flex align-items-center p-2 rounded bg-light mb-1" style="font-size:12px;">
                                            <a href="${u}" target="_blank" class="text-decoration-none flex-grow-1" style="color: #444;">REF_URL_TASK_${idx+1}</a>
                                        </div>`;
                    });
                    refUrlsHtml += '</div>';
                }

                const showDelete = (function(){
                    try {
                        const empId = (document.getElementById('taskFeedbackModal')?.dataset?.employeeId) || null;
                        const picId = task?.pic?.id ? String(task.pic.id) : null;
                        if (!empId || !picId) return false;
                        return String(empId) === picId;
                    } catch(_) { return false; }
                })();

                const html = `
                <div class="custom-card rounded-4 p-3 border-0" data-task-id="${task.id}" data-task-status="${task.status}">
                    <div class="d-flex justify-content-between align-items-start mb-2 task-card-header">
                        <div class="d-flex align-items-center">
                            ${avatarHtml}
                            <div class="d-flex flex-column">
                                ${task.project?.id ? `<small class="text-muted" style="font-size:11px;"> ${task.project.title || '-'}</small>` : ""}
                                <h5 class="mb-0 task-title">${task.title || "Untitled Task"}</h5>
                            </div>
                        </div>
                        <div class="dropdown-icon-container">
                            <span class="material-symbols-outlined dropdown-icon mt-2 mx-2" tabindex="0">more_vert</span>
                            <div class="dropdown-menu d-none">
                                <div class="dropdown-item edit-task">Edit</div>
                                ${showDelete ? '<div class="dropdown-item cancel-task">Cancel</div>' : ''}
                                ${showDelete ? '<div class="dropdown-item delete-task">Delete</div>' : ''}
                            </div>
                        </div>
                    </div>
                    <div class="task-detail-description-container">
                        <div class="task-description">
                            ${task.description ? task.description : ''}
                        </div>
                    </div>
                    <hr class="task-separator rounded-4">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <div style="font-size:12px;">
                            <span style="color:#797E91;">Priority: </span>
                            <span style="color:${task.priority === "HIGH" ? "red" : "#4B4F5E"}">${task.priority || "-"}</span>
                        </div>
                        <div style="font-size:12px;">
                            <span style="color:#797E91;">Deadline: </span>
                            <span style="color:#4B4F5E;">${formatDateENMedium(task.due_date) || "-"}</span>
                        </div>
                    </div>
                    <div class="d-flex justify-content-between mb-1" style="font-size:12px;">
                        <span class="text-muted">Department:</span>
                        <span>${task.project?.department || "-"}</span>
                    </div>
                    <div class="d-flex justify-content-between mb-2" style="font-size:12px;">
                        <span class="text-muted">Division:</span>
                        <span>${task.project?.division || "-"}</span>
                    </div>
                    ${refUrlsHtml}
                    <div class="d-flex justify-content-between align-items-start mt-2 gap-3">
                        <div class="flex-grow-1">${buildTaskCollaboratorsList(task)}
                            ${(function(){
                                try {
                                    let scs = task.status_changes || null;
                                    // Backwards-compat: fallback to single status_change if present
                                    if ((!scs || !Array.isArray(scs) || scs.length === 0) && task.status_change) {
                                        scs = [task.status_change];
                                    }
                                    if (!scs || !Array.isArray(scs) || scs.length === 0) return '';
                                    function esc(s){ return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }
                                    const rows = scs.map(function(sc){
                                        const lbl = (sc.label || '').toString();
                                        const name = (sc.employee_name || '').toString();
                                        if (!lbl && !name) return '';
                                        return `<div style="font-size:12px;margin-top:6px;color:#454545"><span style="color:#797E91;">${esc(lbl)}</span><span style="margin-left:6px;color:#454545">${esc(name)}</span></div>`;
                                    });
                                    return rows.join('');
                                } catch(e){ return ''; }
                            })()}
                        </div>
                        <div class="d-flex align-items-start">
                            <div class="btn-attach-file-wrapper d-flex align-items-center me-3 position-relative">
                                <span class="material-symbols-outlined task-icon mode_comment" data-task-id="${task.id}">mode_comment</span>

                                ${task.feedback_comments_count > 0
                                    ? `<span class="feedback-comments-count ms-1" style="color: #454545; font-size: 12px;">${task.feedback_comments_count}</span>`
                                    : ""}
                                <span class="unread-badge position-absolute top-0 start-100 translate-middle d-none" data-task-id="${task.id}"></span>
                            </div>
                            <div class="btn-attach-file-wrapper d-flex align-items-center">
                                <span class="material-symbols-outlined task-icon">attach_file</span>

                                ${task.reference_files_count > 0
                                    ? `<span class="reference-files-count ms-1" style="color: #454545; font-size: 12px;">${task.reference_files_count}</span>`
                                    : ""}
                            </div>
                        </div>
                    </div>
                </div>`;

                const contentEl = document.getElementById("taskDetailContent");
                if (contentEl) {
                    contentEl.innerHTML = html;

                    // Make task image clickable to open a centered preview modal
                    try {
                        const imgs = contentEl.querySelectorAll('img.project-image');
                        imgs.forEach(function(img) {
                            try {
                                img.style.cursor = 'pointer';
                                // Prevent binding duplicate handlers
                                if (img.__previewHandlerBound) return;
                                img.__previewHandlerBound = true;

                                img.addEventListener('click', function () {
                                    try {
                                        const src = this.src || this.getAttribute('src') || '';
                                        if (!src) return;

                                        // If task detail modal is open, mark it as having a child opened
                                        // and hide it first (follow existing pattern used elsewhere)
                                        const detailEl = document.getElementById('taskDetailModal');
                                        if (detailEl && detailEl.classList && detailEl.classList.contains('show')) {
                                            try {
                                                detailEl.setAttribute('data-child-opened', '1');

                                                if (detailEl._timelineHiddenHandler) {
                                                    detailEl._timelineHiddenHandlerBackup = detailEl._timelineHiddenHandler;
                                                    detailEl.removeEventListener('hidden.bs.modal', detailEl._timelineHiddenHandler);
                                                    detailEl._timelineHiddenHandler = null;
                                                }

                                                const detailModalInst = bootstrap.Modal.getInstance(detailEl) || new bootstrap.Modal(detailEl);
                                                try { detailModalInst.hide(); } catch (_) {}
                                            } catch (_) {}
                                        }

                                        const modalId = 'taskImagePreviewModal_' + Date.now();
                                        const modalHtml = `
                                            <div class="modal fade" id="${modalId}" tabindex="-1" aria-hidden="true">
                                                <div class="modal-dialog modal-dialog-centered modal-xl">
                                                    <div class="modal-content modal-content-custom bg-light border-0">
                                                        <div class="modal-body p-0 d-flex align-items-center justify-content-center" style="max-height:80vh;">
                                                            <img id="taskImagePreviewModalImg" src="${src}" alt="Preview image" style="display:block; max-width:100%; max-height:80vh; object-fit:contain;">
                                                        </div>
                                                        <div class="modal-footer modal-footer-custom border-0 justify-content-center">
                                                            <button type="button" class="btn btn-custom-close" data-bs-dismiss="modal">Close</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>`;

                                        document.body.insertAdjacentHTML('beforeend', modalHtml);
                                        const mEl = document.getElementById(modalId);
                                        const mInst = new bootstrap.Modal(mEl);

                                        // Ensure image fits within viewport on load
                                        mEl.addEventListener('shown.bs.modal', function () {
                                            try { const imgEl = mEl.querySelector('#taskImagePreviewModalImg'); if (imgEl) imgEl.style.maxHeight = (window.innerHeight * 0.8) + 'px'; } catch(_) {}
                                        }, { once: true });

                                        // When preview modal hides, remove it and restore the detail modal if needed
                                        mEl.addEventListener('hidden.bs.modal', function () {
                                            try { mEl.remove(); } catch(_) {}
                                            try {
                                                const d = document.getElementById('taskDetailModal');
                                                if (d && d.getAttribute && d.getAttribute('data-child-opened')) {
                                                    try { d.removeAttribute('data-child-opened'); } catch(_) {}

                                                    // Restore timeline hidden handler if backed up
                                                    try {
                                                        if (d._timelineHiddenHandlerBackup) {
                                                            d._timelineHiddenHandler = d._timelineHiddenHandlerBackup;
                                                            d.addEventListener('hidden.bs.modal', d._timelineHiddenHandler);
                                                            d._timelineHiddenHandlerBackup = null;
                                                        }
                                                    } catch(_) {}

                                                    try {
                                                        const restoreInst = bootstrap.Modal.getOrCreateInstance(d) || new bootstrap.Modal(d);
                                                        restoreInst.show();
                                                    } catch(_) {}
                                                }
                                            } catch(_) {}
                                        }, { once: true });

                                        mInst.show();
                                    } catch (e) {
                                        console.warn('Failed to open image preview', e);
                                    }
                                });
                            } catch (_) {}
                        });
                    } catch (_) {}
                }

                const detailEl = document.getElementById("taskDetailModal");
                if (detailEl) {
                    const detailModal = new bootstrap.Modal(detailEl);

                    // Initialize tooltips for PIC and executor images in modal after it's shown
                    detailEl.addEventListener('shown.bs.modal', function () {
                        // Wait a bit for DOM to be fully rendered
                        setTimeout(() => {
                            initBootstrapTooltips(detailEl);
                        }, 100);
                    }, { once: true });

                    // Clean up tooltips when modal is hidden
                    detailEl.addEventListener('hidden.bs.modal', function () {
                        const tooltipElements = detailEl.querySelectorAll('[data-bs-toggle="tooltip"]');
                        tooltipElements.forEach(el => {
                            const tooltip = bootstrap.Tooltip.getInstance(el);
                            if (tooltip) {
                                tooltip.dispose();
                            }
                        });
                    }, { once: true });

                    detailModal.show();
                }
            },
            error: function () {
                try { showFloatingAlert("Failed to load task details.", "danger", 3000); } catch(_) { alert("Failed to load task details."); }
            }
        });
    }

    // Expose for handlers defined outside this scope (e.g., timeline click)
    window.handleTaskDetail = handleTaskDetail;

    // Function to handle task edit (removed old implementation)

    function loadProjectsForEdit(selectedProjectId = null, callback) {
        const input = document.getElementById("edit_task_project_input");
        const dropdown = document.getElementById("edit_task_project_dropdown");
        const selectedContainer = document.getElementById("edit_task_selected_project");
        const hiddenInput = document.getElementById("edit_task_project_id");

        if (!input || !dropdown || !selectedContainer || !hiddenInput) return;

        let projects = [];

        function renderDropdown(filter = "", autoShow = false) {
            dropdown.innerHTML = "";
            const filtered = projects.filter((p) =>
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
                item.className = "dropdown-item d-flex align-items-center gap-2";
                item.innerHTML = `${avatarHtml}<span>${p.title}</span>`;
                item.addEventListener("click", () => {
                    hiddenInput.value = p.id;
                    input.value = p.title;
                    dropdown.style.display = "none";
                    showSelectedProject(p);
                    // Do not pass a DOM element as selectedParentId; no parent is selected by
                    // default when user picks a project manually via the dropdown.
                    loadRelatedTasks(p.id, "edit_task", null);
                });
                dropdown.appendChild(item);
            });

            dropdown.style.display = (filtered.length && autoShow) ? "block" : "none";
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

            selectedContainer.querySelector(".btn-remove-project").addEventListener("click", () => {
                hiddenInput.value = "";
                input.value = "";
                selectedContainer.innerHTML = "";
                document.getElementById("edit_task_parent_id").innerHTML = "<option value=''>No Parent</option>";
            });
        }

        fetch(appUrl + "/project/index")
            .then((res) => res.json())
                .then((payload) => {
                    projects = (payload.data || []).map((p) => ({
                                id: p.id,
                                title: p.title,
                                image: p.image || "",
                                project_type: p.project_type || 'public'
                            }));

                // Kalau ada project yang sudah dipilih sebelumnya
                if (selectedProjectId) {
                    const project = projects.find(p => String(p.id) === String(selectedProjectId));
                    if (project) {
                        hiddenInput.value = project.id;
                        input.value = project.title;
                        showSelectedProject(project);
                        // Important: do not auto-call loadRelatedTasks here. The caller that
                        // initializes the edit modal (handleTaskEdit) is responsible for
                        // invoking loadRelatedTasks with the correct selectedParentId and
                        // selectedParentTitle to ensure the parent preview is accurate and
                        // not overwritten by this initialization step.
                    }
                }

                if (typeof callback === "function") callback();
            })
            .catch((err) => {
                console.error("Error loading projects for edit:", err);
                if (typeof callback === "function") callback();
            });

        input.addEventListener("input", () => renderDropdown(input.value, true));
        input.addEventListener("focus", () => renderDropdown(input.value, true));

        document.addEventListener("click", (e) => {
            if (!dropdown.contains(e.target) && e.target !== input) {
                dropdown.style.display = "none";
            }
        });
    }

    // Function to handle task cancel (soft-delete semantics preserved)
    function handleTaskCancel(taskId, taskCard) {
        const deleteModalEl = document.getElementById("deleteTaskModal");
        const deleteModal = bootstrap.Modal.getOrCreateInstance(deleteModalEl);

        deleteModalEl.dataset.taskId = taskId;

        // For Cancel flow: left button "Close", right action "Cancel"
        try {
            const dismissBtn = deleteModalEl.querySelector('.btn.btn-custom-close[data-bs-dismiss="modal"]');
            if (dismissBtn) dismissBtn.textContent = 'Close';
            const confirmBtn = document.getElementById('confirmDeleteTaskBtn');
            if (confirmBtn) confirmBtn.textContent = 'Cancel';
        } catch(_) {}

        // Pre-show the modal with a loader to avoid backdrop flicker while fetching
        const preContentEl = deleteModalEl.querySelector(".modal-body");
        if (preContentEl) {
            preContentEl.innerHTML = '<div class="text-center p-3"><div class="spinner-border spinner-border-sm"></div></div>';
        }
        deleteModal.show();

        $.ajax({
            url: appUrl + "/task/" + taskId,
            type: "GET",
            dataType: "json",
            success: function (data) {
                const task = data.data;

                let avatarHtml = "";
                if (task.image) {
                    let imgUrl = task.image;
                    const isAbsolute = imgUrl.startsWith("http://") || imgUrl.startsWith("https://");
                    const isFileTask = imgUrl.startsWith("/file/task/") || imgUrl.startsWith("file/task/");
                    const isPublicPath = imgUrl.startsWith("/storage/") || imgUrl.startsWith("storage/");

                    if (!isAbsolute && !isFileTask && !isPublicPath) {
                        imgUrl = appUrl + "/file/task/" + imgUrl;
                    } else if (!isAbsolute && (isFileTask || isPublicPath)) {
                        imgUrl = imgUrl.startsWith("/") ? appUrl + imgUrl : appUrl + "/" + imgUrl;
                    }

                    avatarHtml = `<img src="${imgUrl}" alt="Task Image"
                                    class="rounded-circle me-3"
                                    style="width:34px;height:34px;object-fit:cover;"
                                    onerror="this.onerror=null;this.src='${appUrl}/asset/img/avatar.png'">`;
                } else {
                    const initials = getTaskInitials(task.title);
                    const bgColor = getRandomColorFromText(task.title);
                    avatarHtml = `<div class="rounded-circle d-flex align-items-center justify-content-center me-3"
                                    style="width:34px;height:34px;background:${bgColor};color:#fff;
                                            font-weight:600;font-size:11px;">
                                    ${initials}
                                </div>`;
                }

                const cardHtml = `
                    <div class="custom-card rounded-4 position-relative p-3 border-0">
                        <div class="d-flex align-items-center mb-2">
                            ${avatarHtml}
                            <div class="d-flex flex-column">
                                ${task.project.id ?
                                    `<p class="text-muted" style="line-height:1; font-size: 10px;">
                                        ${task.project.title || '-'}
                                    </p>`
                                    : ''
                                }
                                <h5 class="mb-0 task-title" style="line-height:1.2;">${task.title || 'Untitled Task'}</h5>
                            </div>
                        </div>
                        <div class="task-description-container mb-2">
                            <p class="task-description mb-0" style="font-size:14px;">${task.description || ''}</p>
                        </div>
                        <hr class="task-separator rounded-4">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <div style="font-size:12px;">
                                <span style="color:#797E91;">Priority: </span>
                                <span style="color:${task.priority === "HIGH" ? "red" : "#4B4F5E"}">${task.priority || "-"}</span>
                            </div>
                            <div style="font-size:12px;">
                                <span style="color:#797E91;">Deadline: </span>
                                <span style="color:#4B4F5E;">${task.due_date || "-"}</span>
                            </div>
                        </div>
                        <div class="d-flex justify-content-between mb-1" style="font-size:12px;">
                            <span class="text-muted">Department:</span>
                            <span>${task.project?.department || "-"}</span>
                        </div>
                        <div class="d-flex justify-content-between mb-2" style="font-size:12px;">
                            <span class="text-muted">Division:</span>
                            <span>${task.project?.division || "-"}</span>
                        </div>
                    </div>
                `;

                const contentEl = deleteModalEl.querySelector(".modal-body");
                if (contentEl) contentEl.innerHTML = cardHtml;
            }
        });

        // Cancel (soft-delete) button click handler
        const confirmDeleteBtn = document.getElementById("confirmDeleteTaskBtn");
        confirmDeleteBtn.onclick = function () {
            $.ajax({
                url: appUrl + "/task/" + taskId,
                type: "DELETE",
                headers: {
                    "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]').getAttribute("content"),
                },
                success: function (response) {
                    // Remove card from UI (safely handle null)
                    try {
                        let cardEl = taskCard;
                        if (!cardEl) {
                            cardEl = document.querySelector(`[data-task-id="${taskId}"]`);
                        }
                        if (cardEl) {
                            cardEl.remove();
                        }
                    } catch (_) {}
                    // Hide modal
                    deleteModal.hide();
                    // Unified success alert
                    try {
                        // Keep backend behavior (soft delete -> CANCELED) but show Cancel message in UI
                        showFloatingAlert(response.message || "Task canceled successfully", "success", 1500);
                    } catch (_) {}
                    // Optionally refresh lists to ensure CANCELED tasks are not shown anywhere
                    try {
                        if (typeof fetchAndRenderTasks === 'function') {
                            fetchAndRenderTasks('new_request', 1, false, '');
                            fetchAndRenderTasks('in_progress', 1, false, '');
                            fetchAndRenderTasks('completed', 1, false, '');
                            try { if (typeof loadArchivedTasksIntoModal === 'function') loadArchivedTasksIntoModal(); } catch(_) {}
                        }
                    } catch (_) {}
                },
                error: function () {
                    try {
                        showFloatingAlert("Failed to cancel task.", "danger", 3000);
                    } catch (_) {
                        try { alert("Failed to cancel task."); } catch(e) {}
                    }
                },
            });
        };
    }

    // Function to handle task soft-delete to DELETED
    function handleTaskDelete(taskId) {
        // Reuse the existing delete modal UI but with different labels
        const deleteModalEl = document.getElementById("deleteTaskModal");
        const deleteModal = bootstrap.Modal.getOrCreateInstance(deleteModalEl);

        deleteModalEl.dataset.taskId = taskId;
        // For Delete flow: left button "Cancel", right action "Delete"
        try {
            const dismissBtn = deleteModalEl.querySelector('.btn.btn-custom-close[data-bs-dismiss="modal"]');
            if (dismissBtn) dismissBtn.textContent = 'Cancel';
            const confirmBtn = document.getElementById('confirmDeleteTaskBtn');
            if (confirmBtn) confirmBtn.textContent = 'Delete';
        } catch(_) {}
        const preContentEl = deleteModalEl.querySelector(".modal-body");
        if (preContentEl) {
            preContentEl.innerHTML = '<div class="text-center p-3"><div class="spinner-border spinner-border-sm"></div></div>';
        }
        deleteModal.show();

        // Load task info for preview
        $.ajax({
            url: appUrl + "/task/" + taskId,
            type: "GET",
            dataType: "json",
            success: function (data) {
                const task = data.data || {};
                let avatarHtml = "";
                if (task.image) {
                    let imgUrl = task.image;
                    const isAbsolute = imgUrl.startsWith("http://") || imgUrl.startsWith("https://");
                    const isFileTask = imgUrl.startsWith("/file/task/") || imgUrl.startsWith("file/task/");
                    const isPublicPath = imgUrl.startsWith("/storage/") || imgUrl.startsWith("storage/");

                    if (!isAbsolute && !isFileTask && !isPublicPath) {
                        imgUrl = appUrl + "/file/task/" + imgUrl;
                    } else if (!isAbsolute && (isFileTask || isPublicPath)) {
                        imgUrl = imgUrl.startsWith("/") ? appUrl + imgUrl : appUrl + "/" + imgUrl;
                    }

                    avatarHtml = `<img src="${imgUrl}" alt="Task Image"
                                    class="rounded-circle me-3"
                                    style="width:34px;height:34px;object-fit:cover;"
                                    onerror="this.onerror=null;this.src='${appUrl}/asset/img/avatar.png'">`;
                } else {
                    const initials = getTaskInitials(task.title);
                    const bgColor = getRandomColorFromText(task.title);
                    avatarHtml = `<div class="rounded-circle d-flex align-items-center justify-content-center me-3"
                                    style="width:34px;height:34px;background:${bgColor};color:#fff;
                                            font-weight:600;font-size:11px;">
                                    ${initials}
                                </div>`;
                }

                const contentEl = deleteModalEl.querySelector(".modal-body");
                if (contentEl) {

                contentEl.innerHTML = `
                    <div class="custom-card rounded-4 position-relative p-3 border-0">
                        <div class="d-flex align-items-center mb-2">
                            ${avatarHtml}
                            <div class="d-flex flex-column">
                                ${task.project.id ?
                                    `<p class="text-muted" style="line-height:1; font-size: 10px;">
                                        ${task.project.title || '-'}
                                    </p>`
                                    : ''
                                }
                                <h5 class="mb-0 task-title" style="line-height:1.2;">${task.title || 'Untitled Task'}</h5>
                            </div>
                        </div>
                        <div class="task-description-container mb-2">
                            <p class="task-description mb-0" style="font-size:14px;">${task.description || ''}</p>
                        </div>
                        <hr class="task-separator rounded-4">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <div style="font-size:12px;">
                                <span style="color:#797E91;">Priority: </span>
                                <span style="color:${task.priority === "HIGH" ? "red" : "#4B4F5E"}">${task.priority || "-"}</span>
                            </div>
                            <div style="font-size:12px;">
                                <span style="color:#797E91;">Deadline: </span>
                                <span style="color:#4B4F5E;">${task.due_date || "-"}</span>
                            </div>
                        </div>
                        <div class="d-flex justify-content-between mb-1" style="font-size:12px;">
                            <span class="text-muted">Department:</span>
                            <span>${task.project?.department || "-"}</span>
                        </div>
                        <div class="d-flex justify-content-between mb-2" style="font-size:12px;">
                            <span class="text-muted">Division:</span>
                            <span>${task.project?.division || "-"}</span>
                        </div>
                    </div>
                `;
                }
            }
        });

        // Bind confirm button for soft delete
        const confirmDeleteBtn = document.getElementById("confirmDeleteTaskBtn");
        confirmDeleteBtn.onclick = function () {
            $.ajax({
                url: appUrl + "/task/" + taskId + "/soft-delete",
                type: "PUT",
                headers: {
                    "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]').getAttribute("content"),
                },
                success: function (response) {
                    try {
                        const cardEl = document.querySelector(`[data-task-id="${taskId}"]`);
                        if (cardEl) cardEl.remove();
                    } catch (_) {}
                    deleteModal.hide();
                    try { showFloatingAlert(response.message || 'Task deleted', 'success', 1500); } catch(_) {}
                    try {
                        if (typeof fetchAndRenderTasks === 'function') {
                            fetchAndRenderTasks('new_request', 1, false, '');
                            fetchAndRenderTasks('in_progress', 1, false, '');
                            fetchAndRenderTasks('completed', 1, false, '');
                        }
                        if (typeof loadArchivedTasksIntoModal === 'function') loadArchivedTasksIntoModal();

                    } catch(_) {}
                },
                error: function (xhr) {
                    let msg = 'Failed to delete task';
                    if (xhr && xhr.responseJSON && xhr.responseJSON.message) msg = xhr.responseJSON.message;
                    try { showFloatingAlert(msg, 'danger', 3000); } catch(_) { alert(msg); }
                }
            });
        };
    }

    // Function untuk menampilkan file yang sudah dipilih (pilih preview yang sedang aktif/terlihat)
    function displaySelectedFiles() {
        function findVisiblePreview(ids) {
            let fallback = null;
            for (const id of ids) {
                const el = document.getElementById(id);
                if (el && !fallback) fallback = el;
                if (el && el.offsetParent !== null) return el; // visible
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
                    // Non-image: show generic icon badge
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

    // Function to setup reference files input for add modal
    function setupReferenceFilesInput() {
        const input = document.getElementById("task_reference_files");
        const preview = document.getElementById("reference_files_preview");

        if (!input || !preview) return;

        input.addEventListener("change", function () {
            const files = Array.from(this.files);
            selectedFiles = [...selectedFiles, ...files];
            displaySelectedFiles();

            // Kosongkan input file untuk memungkinkan upload berikutnya
            this.value = "";
        });
    }

    // Function to setup reference files input for edit modal
    function setupEditReferenceFilesInput() {
        const input = document.getElementById("edit_task_reference_files");
        const preview = document.getElementById("edit_reference_files_preview");
        const existing = document.getElementById("existing_reference_files");

        if (!input || !preview) return;

        // Use a global variable to track selected files for edit modal
        window.editSelectedFiles = [];

        input.addEventListener("change", function () {
            const files = Array.from(this.files);
            // Add debug log to check files selected
            window.editSelectedFiles = [...window.editSelectedFiles, ...files];
            displayEditSelectedFiles();

            // Clear input for next selection AFTER adding files to array
            // (already done here, but keep for clarity)
            this.value = "";
        });

        window.displayEditSelectedFiles = function () {
            preview.innerHTML = "";

            if (window.editSelectedFiles.length > 0) {
                    const fileList = document.createElement("div");
                    fileList.className = "selected-files-list mt-2";

                    window.editSelectedFiles.forEach((file, index) => {
                        const fileItem = document.createElement("div");
                        fileItem.className = 'd-flex align-items-center gap-2 p-2 rounded bg-light selected-task mb-2';

                        if (file && file.type && file.type.indexOf('image') === 0) {
                            const img = document.createElement('img');
                            const url = URL.createObjectURL(file);
                            img.src = url;
                            img.width = 28;
                            img.height = 28;
                            img.style.objectFit = 'cover';
                            img.style.borderRadius = '50%';
                            img.alt = file.name;
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
                            window.editSelectedFiles.splice(index, 1);
                            window.displayEditSelectedFiles();
                        });

                        fileItem.appendChild(removeBtn);
                        fileList.appendChild(fileItem);
                    });

                    preview.appendChild(fileList);
            }
        };


        // Function to display existing files
        window.displayExistingReferenceFiles = function (files) {
            if (!existing || !files || !Array.isArray(files)) return;

            existing.innerHTML = "";

            if (files.length > 0) {
                    const title = document.createElement("div");
                    // title.className = "fw-normal mb-2";
                    // title.textContent = "Current Files:";
                    // title.style.fontSize = "12px"
                    existing.appendChild(title);

                    const fileList = document.createElement("div");
                    fileList.className = "existing-files-list";

                    files.forEach((fileName, idx) => {
                        const fileItem = document.createElement("div");
                        fileItem.className = 'd-flex align-items-center gap-2 p-2 rounded bg-light selected-task mb-2';

                        // determine if file is an image by extension
                        const lower = String(fileName || '').toLowerCase();
                        const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(lower);
                        if (isImage) {
                            const img = document.createElement('img');
                            img.src = appUrl + '/file/task_reference_files/' + encodeURIComponent(fileName);
                            img.width = 28; img.height = 28;
                            img.style.objectFit = 'cover'; img.style.borderRadius = '50%';
                            img.alt = fileName;
                            fileItem.appendChild(img);
                        } else {
                            const badge = document.createElement('div');
                            fileItem.appendChild(badge);
                        }

                        const titleSpan = document.createElement('span');
                        titleSpan.className = 'flex-grow-1';
                        // store original filename and show formatted display name
                        titleSpan.setAttribute('data-filename', fileName);
                        try {
                            var ext = (String(fileName || '').split('.').pop()||'').toLowerCase();
                            var num = Number(idx) + 1;
                            titleSpan.textContent = ext ? ('PROJECT_REF_FILE_' + num + '.' + ext) : ('PROJECT_REF_FILE_' + num);
                        } catch (e) {
                            titleSpan.textContent = fileName;
                        }
                        fileItem.appendChild(titleSpan);

                        const removeBtn = document.createElement('button');
                        removeBtn.type = 'button';
                        removeBtn.className = 'btn btn-sm btn-remove-task remove-task';
                        removeBtn.style.lineHeight = '1';
                        removeBtn.innerHTML = '<span class="material-symbols-outlined">close</span>';
                        removeBtn.addEventListener('click', function () {
                            fileItem.remove();
                            updateExistingFiles();
                        });

                        fileItem.appendChild(removeBtn);
                        fileList.appendChild(fileItem);
                    });

                    existing.appendChild(fileList);
                }
            // Initialize or update hidden input with all existing files on display
            let existingFilesInput = document.getElementById(
                "existing_reference_files_input"
            );
            if (!existingFilesInput) {
                existingFilesInput = document.createElement("input");
                existingFilesInput.type = "hidden";
                existingFilesInput.id = "existing_reference_files_input";
                existingFilesInput.name = "existing_reference_files";
                document
                    .getElementById("editTaskForm")
                    .appendChild(existingFilesInput);
            }
            existingFilesInput.value = JSON.stringify(files);
        };

        // Function to update existing files array
        function updateExistingFiles() {
            const existingItems = document.querySelectorAll(
                    "#existing_reference_files .existing-file-item, #existing_reference_files .selected-task"
                );
            const existingFiles = [];

            existingItems.forEach((item) => {
                let fileName = '';
                const sp = item.querySelector('span.flex-grow-1');
                if (sp && sp.getAttribute) fileName = sp.getAttribute('data-filename') || sp.textContent.trim();
                if (fileName) existingFiles.push(fileName);
            });

            // Update hidden input
            let existingFilesInput = document.getElementById(
                "existing_reference_files_input"
            );
            if (!existingFilesInput) {
                existingFilesInput = document.createElement("input");
                existingFilesInput.type = "hidden";
                existingFilesInput.id = "existing_reference_files_input";
                existingFilesInput.name = "existing_reference_files";
                document
                    .getElementById("editTaskForm")
                    .appendChild(existingFilesInput);
            }
            existingFilesInput.value = JSON.stringify(existingFiles);
        }

        // Initialize
        updateExistingFiles();

        // Ensure updateExistingFiles is called when removing existing files
        document
            .getElementById("existing_reference_files")
            ?.addEventListener("click", function (e) {
                // Support new remove button classes and legacy btn-outline-danger
                if (e.target && (e.target.matches("button.btn-remove-task") || e.target.matches("button.remove-task") || e.target.matches("button.btn-outline-danger") || e.target.closest('button.btn-remove-task') || e.target.closest('button.remove-task'))) {
                    setTimeout(() => {
                        updateExistingFiles();
                    }, 10);
                }
            });
    }

    // --- Handlers for new Add Reference Files modal ---
    function initAddReferenceFilesModal() {
        const openBtn = document.getElementById('openAddReferenceFilesBtn');
        const refModalEl = document.getElementById('addReferenceFilesModal');
        const refModal = refModalEl ? new bootstrap.Modal(refModalEl) : null;
        const refForm = document.getElementById('addReferenceFilesForm');
        const fileInput = document.getElementById('add_reference_files');
        const preview = document.getElementById('add_reference_files_preview');
        const submitBtn = document.getElementById('submitAddReferenceFiles');

        if (!openBtn || !refModalEl || !refForm || !fileInput || !preview || !submitBtn) return;

        // When clicking "Add Files" in Reference Files modal: close it and open add modal
        openBtn.addEventListener('click', function (e) {
            try {
                const refFilesModalEl = document.getElementById('referenceFilesModal');
                if (refFilesModalEl) {
                    const cm = bootstrap.Modal.getInstance(refFilesModalEl) || new bootstrap.Modal(refFilesModalEl);
                    cm.hide();
                }
            } catch (_) {}
            // populate hidden task id from data attribute on reference modal if available
            const taskId = document.getElementById('referenceFilesModal')?.dataset?.taskId
                || document.getElementById('referenceFilesList')?.dataset?.taskId
                || this.dataset?.taskId
                || document.getElementById('taskDetailModal')?.dataset?.taskId;
            // If still not found, warn early and don't open add modal
            if (!taskId) {
                try { showFloatingAlert && showFloatingAlert('Task ID not found. Cannot add files.', 'danger'); } catch(_) {}
                return;
            }
            const hidden = document.getElementById('addRefTaskId');
            if (hidden) hidden.value = taskId || '';
            // reset previous selection
            fileInput.value = '';
            fileInput.style.border = "none"
            preview.innerHTML = '';
            window.addRefSelectedFiles = [];
            refModal.show();
        });

        // File input change: collect files and render preview
        fileInput.addEventListener('change', function () {
            const files = Array.from(this.files || []);
            window.addRefSelectedFiles = window.addRefSelectedFiles || [];
            window.addRefSelectedFiles = window.addRefSelectedFiles.concat(files);
            renderAddRefSelectedFiles();
            // clear input so same file can be selected again if needed
            this.value = '';
        });

        function renderAddRefSelectedFiles() {
            preview.innerHTML = '';
            const list = document.createElement('div');
            list.className = 'selected-files-list mt-2';
            (window.addRefSelectedFiles || []).forEach((file, idx) => {
                const item = document.createElement('div');
                item.className = 'd-flex align-items-center gap-2 p-2 rounded bg-light selected-task mb-2';

                if (file && file.type && file.type.indexOf('image') === 0) {
                    const img = document.createElement('img');
                    const url = URL.createObjectURL(file);
                    img.src = url; img.width = 28; img.height = 28; img.style.objectFit = 'cover'; img.style.borderRadius = '50%'; img.alt = file.name;
                    img.onload = function(){ try{ URL.revokeObjectURL(url); } catch(_){} };
                    item.appendChild(img);
                } else {
                    const badge = document.createElement('div');
                    item.appendChild(badge);
                }

                const title = document.createElement('span'); title.className = 'flex-grow-1'; title.textContent = file.name; item.appendChild(title);

                const removeBtn = document.createElement('button');
                removeBtn.type = 'button'; removeBtn.className = 'btn btn-sm btn-remove-task remove-task'; removeBtn.style.lineHeight = '1'; removeBtn.innerHTML = '<span class="material-symbols-outlined">close</span>';
                removeBtn.addEventListener('click', function () {
                    window.addRefSelectedFiles.splice(idx, 1);
                    renderAddRefSelectedFiles();
                });
                item.appendChild(removeBtn);

                list.appendChild(item);
            });

            preview.appendChild(list);
        }

        // Submit handler: upload selected files to server
        submitBtn.addEventListener('click', function (e) {
            e.preventDefault();
            const taskId = document.getElementById('addRefTaskId')?.value;
            if (!taskId) {
                showFloatingAlert && showFloatingAlert('Task ID not found.', 'danger');
                return;
            }

            const files = window.addRefSelectedFiles || [];
            if (!files.length) {
                showFloatingAlert && showFloatingAlert('Please select at least one file to upload.', 'warning');
                return;
            }

            const fd = new FormData();
            files.forEach(f => fd.append('reference_files[]', f));
            fd.append('task_id', taskId);

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';

            fetch(appUrl + '/task/' + encodeURIComponent(taskId) + '/reference-file', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                },
                body: fd
            }).then(res => res.ok ? res.json() : res.json().then(Promise.reject))
            .then(payload => {
                // Determine new count from payload when available
                const newCount = (function(p){
                    try {
                        if (!p) return undefined;
                        if (Array.isArray(p.reference_files)) return p.reference_files.length;
                        if (typeof p.reference_files_count === 'number') return p.reference_files_count;
                        if (typeof p.reference_files === 'string') {
                            try {
                                const parsed = JSON.parse(p.reference_files);
                                if (Array.isArray(parsed)) return parsed.length;
                            } catch(_) {
                                return p.reference_files.split(',').filter(Boolean).length;
                            }
                        }
                        return undefined;
                    } catch(_) { return undefined; }
                })(payload);

                showFloatingAlert && showFloatingAlert(payload.message || 'Files uploaded', 'success', 2000);
                // hide add modal and reopen reference files modal (refresh contents)
                refModal.hide();
                // Reset selection
                window.addRefSelectedFiles = [];
                renderAddRefSelectedFiles();

                // Update badge immediately if server returned new count
                try {
                    const card = document.querySelector('.custom-card[data-task-id="' + taskId + '"]');
                    if (card && typeof newCount !== 'undefined') {
                        let span = card.querySelector('.reference-files-count');
                        if (newCount > 0) {
                            if (span) span.textContent = String(newCount);
                            else {
                                const s = document.createElement('span');
                                s.className = 'reference-files-count ms-1';
                                s.style.color = '#454545'; s.style.fontSize = '12px';
                                s.textContent = String(newCount);
                                // prefer attaching to the wrapper that holds the attach_file icon
                                const wrappers = Array.from(card.querySelectorAll('.btn-attach-file-wrapper')) || [];
                                let attachWrapper = wrappers.find(w => {
                                    try {
                                        const icon = w.querySelector('.material-symbols-outlined');
                                        return icon && icon.textContent && icon.textContent.trim() === 'attach_file';
                                    } catch(_) { return false; }
                                });
                                if (!attachWrapper) attachWrapper = card.querySelector('.btn-attach-file-wrapper.d-flex.align-items-center');
                                if (attachWrapper) attachWrapper.appendChild(s);
                            }
                        } else if (span) {
                            try { span.remove(); } catch(_) { span.style.display = 'none'; }
                        }
                    }
                } catch(_) {}

                // Reopen reference files modal by triggering the task's attach_file icon click specifically
                const cardForClick = document.querySelector('.custom-card[data-task-id="' + taskId + '"]');
                let attachBtn = null;
                if (cardForClick) {
                    const icons = Array.from(cardForClick.querySelectorAll('.task-icon')) || [];
                    attachBtn = icons.find(el => el && el.textContent && el.textContent.trim() === 'attach_file');
                }

                if (attachBtn && typeof attachBtn.click === 'function') {
                    // small delay to allow modal hide animation to complete
                    setTimeout(function () { try { attachBtn.click(); } catch(_) { /* fallback below */ } }, 200);
                } else {
                    // Fallback: fetch latest task data and update reference files badge manually
                    try {
                        $.ajax({
                            url: appUrl + '/task/' + encodeURIComponent(taskId),
                            type: 'GET',
                            dataType: 'json',
                            success: function(res) {
                                const t = res && (res.data || res) ;
                                // Update badge count on task card
                                try {
                                    const card = document.querySelector('.custom-card[data-task-id="' + taskId + '"]');
                                    if (card) {
                                        const span = card.querySelector('.reference-files-count');
                                        const count = (Array.isArray(t.reference_files) ? t.reference_files.length : (t.reference_files_count || 0)) || 0;
                                        if (count > 0) {
                                            if (span) span.textContent = String(count);
                                            else {
                                                const s = document.createElement('span');
                                                s.className = 'reference-files-count ms-1';
                                                s.style.color = '#454545'; s.style.fontSize = '12px';
                                                s.textContent = String(count);
                                                const wrappers = Array.from(card.querySelectorAll('.btn-attach-file-wrapper')) || [];
                                                let attachWrapper = wrappers.find(w => {
                                                    try { const icon = w.querySelector('.material-symbols-outlined'); return icon && icon.textContent && icon.textContent.trim() === 'attach_file'; } catch(_) { return false; }
                                                });
                                                if (!attachWrapper) attachWrapper = card.querySelector('.btn-attach-file-wrapper.d-flex.align-items-center');
                                                if (attachWrapper) attachWrapper.appendChild(s);
                                            }
                                        } else if (span) {
                                            try { span.remove(); } catch(_) { span.style.display = 'none'; }
                                        }
                                    }
                                } catch(_){ }
                            },
                            error: function() { /* ignore */ }
                        });
                    } catch(_) { /* ignore fallback */ }
                }
            }).catch(err => {
                console.error('Upload failed', err);
                try { const msg = (err && (err.message || (err.error || (err.errors && err.errors[0]) ) )) || 'Upload failed'; showFloatingAlert && showFloatingAlert(msg, 'danger'); } catch(_) {}
            }).finally(() => {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Upload';
            });
        });
    }

    // Initialize add reference files modal handlers after DOM ready.
    // Use readyState check so initialization runs even when this script is loaded after DOMContentLoaded.
    (function(){
        try {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initAddReferenceFilesModal);
            } else {
                // DOM already ready
                initAddReferenceFilesModal();
            }
        } catch (e) {}
    })();

    // Open and populate Edit Task Modal
    function handleTaskEdit(taskId) {
        const modalEl = document.getElementById("editTaskModal");
        if (!modalEl) {
            if (typeof showFloatingAlert === 'function') showFloatingAlert('Edit modal not found.', 'danger');
            return;
        }

        // Mark that a child modal (edit) is about to open so timeline won't be restored yet
        const detailEl = document.getElementById('taskDetailModal');
        if (detailEl) {
            detailEl.setAttribute('data-child-opened', '1');

            // Remove any existing timeline handler temporarily to prevent conflicts
            if (detailEl._timelineHiddenHandler) {
                detailEl.removeEventListener('hidden.bs.modal', detailEl._timelineHiddenHandler);
                detailEl._timelineHiddenHandlerBackup = detailEl._timelineHiddenHandler;
                detailEl._timelineHiddenHandler = null;
            }
        }

        const form = document.getElementById("editTaskForm");
        form && form.reset();
        const idInput = document.getElementById("edit_task_id");
        if (idInput) idInput.value = taskId;

        const loader = document.getElementById("editTaskModalLoader");
        if (loader) loader.classList.remove("d-none");

        // Open modal immediately to show loader
        const modal = new bootstrap.Modal(modalEl);
        modal.show();

        document.querySelectorAll('.modal-backdrop').forEach((el, idx, arr) => {
            if (idx < arr.length - 1) el.remove();
        });

        $.ajax({
            url: appUrl + "/task/" + taskId + "/edit",
            type: "GET",
            dataType: "json",
            success: function (res) {
                const t = (res && res.data) ? res.data : (res || {});

                // Ensure stored parent is present in select as early fallback
                try {
                    const earlyParentSel = document.getElementById('edit_task_parent_id');
                    if (earlyParentSel && t.parent_id) {
                        ensureParentOption(earlyParentSel, t.parent_id);
                    }
                } catch (e) { console.warn('early ensureParentOption failed', e); }

                // Basic fields
                const titleEl = document.getElementById("edit_task_title");
                const descEl = document.getElementById("edit_task_description");
                if (titleEl) titleEl.value = t.title || "";
                if (descEl) {
                    descEl.value = t.description || "";
                    try {
                        if (window.__quillTaskEdit && window.__quillTaskEdit.root) {
                            window.__quillTaskEdit.root.innerHTML = t.description || '';
                        }
                    } catch (e) { /* noop */ }
                }

                const projectId = t.project_id || (t.project && t.project.id);
                // Clear previous project/parent UI to avoid stale values from earlier modal opens
                try {
                    const editProjSelected = document.getElementById('edit_task_selected_project');
                    const editProjInput = document.getElementById('edit_task_project_input');
                    const editParentSel = document.getElementById('edit_task_parent_id');
                    const editParentInput = document.getElementById('edit_task_parent_input');
                    const editParentSelected = document.getElementById('edit_task_selected_parent');
                    if (editProjSelected) editProjSelected.innerHTML = '';
                    if (editProjInput) editProjInput.value = '';
                    if (editParentSel) editParentSel.innerHTML = "<option value=''>No Parent</option>";
                    if (editParentInput) editParentInput.value = '';
                    if (editParentSelected) editParentSelected.innerHTML = '';
                } catch(_) {}

                loadProjectsForEdit(projectId, function () {
                    try {
                        if (window.__debugLoadRelatedTasks) {
                            try { console.debug('handleTaskEdit: calling loadRelatedTasks', { projectId: projectId, prefix: 'edit_task', selectedParentId: t.parent_id, selectedParentTitle: (t.parent && t.parent.title) ? t.parent.title : null, t: t }); } catch(_) {}
                        }
                    } catch(_) {}
                    // Pass the stored parent_id (and parent title when available) so the preview shows the chosen parent task
                    loadRelatedTasks(projectId, "edit_task", t.parent_id, (t.parent && t.parent.title) ? t.parent.title : "");
                    ensureParentOption(document.getElementById("edit_task_parent_id"), t.parent_id);
                });

                // Point, Priority
                const pointEl = document.getElementById("edit_task_point");
                if (pointEl) pointEl.value = t.point || 1;
                const prioEl = document.getElementById("edit_task_priority");
                if (prioEl) prioEl.value = (t.priority || '').toUpperCase();

                // Reference URLs (prefill dynamic rows)
                (function() {
                    const container = document.getElementById('edit_task_reference_urls_container');
                    if (!container) return;
                    container.innerHTML = '';
                    let urls = [];
                    let ru = t.reference_urls;
                    if (!Array.isArray(ru) && typeof ru === 'string') {
                        try { const parsed = JSON.parse(ru); if (Array.isArray(parsed)) ru = parsed; } catch(_) { /* noop */ }
                    }
                    if (Array.isArray(ru) && ru.length > 0) {
                        urls = ru.filter((u) => typeof u === 'string' && u.trim() !== '');
                    } else if (t.reference_url) {
                        urls = [t.reference_url];
                    }
                    if (urls.length === 0) urls = [''];
                    urls.forEach((u, idx) => {
                        const row = document.createElement('div');
                        row.className = 'input-group';
                        const controls = (idx === 0)
                            ? `<button type="button" class="btn btn-submit-black add-ref-url" aria-label="Add URL"><span class="material-symbols-outlined">add</span></button>`
                            : `<button type="button" class="btn btn-remove-url remove-ref-url" aria-label="Remove URL"><span class="material-symbols-outlined">close</span></button>`;
                        row.innerHTML = `<input type="url" class="form-control input-text" name="reference_urls[]" placeholder="https://example.com" value="${u}">` + controls;
                        container.appendChild(row);
                    });
                })();

                // Dates
                const startEl = document.getElementById("edit_task_start_date");
                const dueEl = document.getElementById("edit_task_due_date");
                if (startEl) startEl.value = (t.start_date || '').slice(0, 10);
                if (dueEl) dueEl.value = (t.due_date || '').slice(0, 10);

                // Image label preview
                const imgLabel = document.getElementById("editTaskImageLabel");
                const clearBtn = document.getElementById("editTaskImageClearBtn");
                if (imgLabel) {
                    if (t.image) {
                        // Normalize image URL: accept absolute URL or existing /file/task path; else prefix
                        let imgUrl = t.image;
                        if (typeof imgUrl === 'string') {
                            const isAbsolute = imgUrl.startsWith('http://') || imgUrl.startsWith('https://');
                            const isFileTask = imgUrl.startsWith('/file/task/') || imgUrl.startsWith('file/task/');
                            const isPublicPath = imgUrl.startsWith('/storage/') || imgUrl.startsWith('storage/');
                            if (!isAbsolute && !isFileTask && !isPublicPath) {
                                imgUrl = appUrl + '/file/task/' + imgUrl;
                            } else if (!isAbsolute && (isFileTask || isPublicPath)) {
                                // Ensure leading slash and appUrl prefix
                                imgUrl = imgUrl.startsWith('/') ? appUrl + imgUrl : appUrl + '/' + imgUrl;
                            }
                        }
                        imgLabel.style.backgroundImage = `url('${imgUrl}')`;
                        imgLabel.classList.add('has-image');
                        imgLabel.style.backgroundSize = 'cover';
                        imgLabel.style.opacity = '1';
                        clearBtn && clearBtn.classList.remove('d-none');
                    } else {
                        imgLabel.style.backgroundImage = `url('${appUrl}/asset/img/background/add-image.png')`;
                        imgLabel.classList.remove('has-image');
                        imgLabel.style.opacity = '0.5';
                        clearBtn && clearBtn.classList.add('d-none');
                    }
                }

                // Executors
                if (Array.isArray(t.executors) && typeof window.setSelectedExecutorsEdit === 'function') {
                    window.setSelectedExecutorsEdit(t.executors.map(e => ({
                        id: e.id,
                        name: e.name,
                        user_photo: e.user_photo || e.photo || e.image || '',
                        division: e.division || e.division_name || ''
                    })));
                }

                // parent select is set by loadRelatedTasks (selectedParentId)

                // Existing reference files
                let refFiles = t.reference_files;
                if (typeof refFiles === 'string') {
                    try { refFiles = JSON.parse(refFiles); }
                    catch (e) { refFiles = refFiles.split(',').map(s => s.trim()).filter(Boolean); }
                }
                if (typeof window.displayExistingReferenceFiles === 'function') {
                    window.displayExistingReferenceFiles(Array.isArray(refFiles) ? refFiles : []);
                }

                // Fields populated; loader will be hidden in complete
            },
            error: function () {
                showFloatingAlert('Failed to load task data.', 'danger');
            },
            complete: function () {
                if (loader) loader.classList.add('d-none');
            }
        });
    }

    // Enhanced Task Filtering with All Project Support
    let currentTaskFilters = {
        project: "",
        status: "",
        priority: "",
        date: "",
    };

    const filterTaskProjectSelect = document.getElementById("filterTaskProject");
    const filterTaskStatusSelect = document.getElementById("filterTaskStatus");
    const filterTaskPrioritySelect = document.getElementById("filterTaskPriority");
    const filterByDate = document.getElementById("filterByDate");
    const applyTaskFilterBtn = document.getElementById("applyTaskFilterBtn");
    const openTaskFilterBtn = document.getElementById("openTaskFilterBtn");
    const resetTaskFilterBtn = document.getElementById("resetTaskFilterBtn");

    function loadProjectsForFilterMobile() {
        const selectIds = ["filterTaskProjectMobileCard", "filterTaskProjectMobileTable"];

        $.ajax({
            url: appUrl + "/project/index?task_scope=all",
            type: "GET",
            dataType: "json",
            success: function (response) {
                const projects = Array.isArray(response.data) ? response.data : [];

                let options = '<option value="">All Projects</option>';
                projects.forEach(function (project) {
                    options += `<option value="${project.id}">${project.title || project.name}</option>`;
                });

                selectIds.forEach(id => {
                    const selectEl = document.getElementById(id);
                    if (selectEl) {
                        selectEl.innerHTML = options;
                    }
                });
            },
            error: function (xhr, status, error) {
                console.error("Error loading projects:", error);
            }
        });
    }


    // Desktop: Apply filter handler (missing previously)
    if (applyTaskFilterBtn && !applyTaskFilterBtn._bound) {
        applyTaskFilterBtn._bound = true;
        applyTaskFilterBtn.addEventListener("click", function () {
            if (filterTaskProjectSelect) currentTaskFilters.project = filterTaskProjectSelect.value;
            if (filterTaskStatusSelect) currentTaskFilters.status = filterTaskStatusSelect.value;
            if (filterTaskPrioritySelect) currentTaskFilters.priority = filterTaskPrioritySelect.value;
            if (filterTaskPrioritySelect) currentTaskFilters.date = filterByDate.value;
            fetchAndRenderFilteredTasks(currentTaskFilters);
            const dd = document.getElementById("taskFilterDropdown");
            if (dd) dd.style.display = "none";
        });
    }

    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
            const cardDropdown = document.getElementById("taskFilterDropdownMobileCard");
            const tableDropdown = document.getElementById("taskFilterDropdownMobileTable");

            if(cardDropdown) cardDropdown.style.display = "none";
            if(tableDropdown) tableDropdown.style.display = "none";
        }
    });

    // Function to update project filter display
    function updateProjectFilterDisplay() {
        const displayElement = document.getElementById('projectFilterDisplay');
        const projectNameElement = document.getElementById('currentProjectName');

        if (!displayElement || !projectNameElement) return;

        const selectedProjectId = filterTaskProjectSelect.value;
        const selectedProjectText = filterTaskProjectSelect.options[filterTaskProjectSelect.selectedIndex]?.text || '';

        if (selectedProjectId && selectedProjectId !== '') {
            projectNameElement.textContent = selectedProjectText;
            displayElement.style.display = 'flex';
        } else {
            displayElement.style.display = 'flex';
        }
    }

    // Load projects for filter select
    function loadProjectsForFilter() {
        if (!filterTaskProjectSelect) return;

        fetch(appUrl + "/project/index?task_scope=all")
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Failed to load projects");
                }
                return response.json();
            })
            .then((data) => {
                if (!data.data) return;
                let options = '<option value="">All Projects</option>';
                data.data.forEach((project) => {
                    options += `<option value="${project.id}">${project.title}</option>`;
                });
                filterTaskProjectSelect.innerHTML = options;

                // Set current filter values if they exist
                if (currentTaskFilters.project) {
                    filterTaskProjectSelect.value = currentTaskFilters.project;
                }
                if (currentTaskFilters.status) {
                    filterTaskStatusSelect.value = currentTaskFilters.status;
                }
                if (currentTaskFilters.priority) {
                    filterTaskPrioritySelect.value = currentTaskFilters.priority;
                }
                if (currentTaskFilters.date) {
                    filterTaskPrioritySelect.value = currentTaskFilters.date;
                }
            })
            .catch((error) => {
                console.error("Error loading projects for filter:", error);
            });
    }

    // Reset filters
    if (resetTaskFilterBtn) {
        resetTaskFilterBtn.addEventListener("click", function() {
            currentTaskFilters = {
                project: "",
                status: "",
                priority: "",
            };

            if (filterTaskProjectSelect) filterTaskProjectSelect.value = "";
            if (filterTaskStatusSelect) filterTaskStatusSelect.value = "";
            if (filterTaskPrioritySelect) filterTaskPrioritySelect.value = "";
            if (filterByDate) filterByDate.value = "";

            fetchAndRenderTasks();

            // Update project filter display (hide it)
            updateProjectFilterDisplay();

            // Hide the dropdown
            document.getElementById("taskFilterDropdown").style.display = "none";
        });
    }

    // Toggle filter dropdown
    if (openTaskFilterBtn) {
        openTaskFilterBtn.addEventListener("click", function(e) {
            e.stopPropagation();
            const dropdown = document.getElementById("taskFilterDropdown");
            const isVisible = dropdown.style.display !== "none";

            if (isVisible) {
                dropdown.style.display = "none";
            } else {
                loadProjectsForFilter();
                dropdown.style.display = "block";

                // Position dropdown below button
                const buttonRect = openTaskFilterBtn.getBoundingClientRect();
                dropdown.style.position = "absolute";
                dropdown.style.top = "100%";
                dropdown.style.right = "0";
                dropdown.style.zIndex = "1000";
            }
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener("click", function(e) {
        const dropdown = document.getElementById("taskFilterDropdown");
        const button = document.getElementById("openTaskFilterBtn");

        if (dropdown && button && !dropdown.contains(e.target) && !button.contains(e.target)) {
            dropdown.style.display = "none";
        }
    });

    // Close dropdown on escape key
    document.addEventListener("keydown", function(e) {
        if (e.key === "Escape") {
            const dropdown = document.getElementById("taskFilterDropdown");
            if (dropdown) {
                dropdown.style.display = "none";
            }
        }
    });

    function fetchAndRenderFilteredTasks(filters = {}) {
        $.ajax({
            url: appUrl + "/task/index",
            type: "GET",
            dataType: "json",
            data: (function(){
                const p = {};
                if (filters && filters.project) p.project = filters.project;
                if (filters && filters.status) p.status = filters.status;
                if (filters && filters.priority) p.priority = filters.priority;
                if (filters && filters.date) p.date = filters.date;
                return p;
            })(),
            success: function (data) {
                const payload = data && data.data ? data.data : {};

                const newEl = document.getElementById("new-request-tasks");
                const progEl = document.getElementById("in-progress-tasks");
                const compEl = document.getElementById("completed-tasks");
                const finishEl = document.getElementById("finished-tasks");
                if (newEl) newEl.innerHTML = "";
                if (progEl) progEl.innerHTML = "";
                if (compEl) compEl.innerHTML = "";
                if (finishEl) finishEl.innerHTML = "";

                // Helper to read tasks from a bucket that could be an array or {tasks:[]}
                const getTasks = (section) => {
                    if (!section) return [];
                    if (Array.isArray(section)) return section;
                    if (Array.isArray(section.tasks)) return section.tasks;
                    return [];
                };

                let newTasks = getTasks(payload.new_request);
                let progTasks = getTasks(payload.in_progress);
                let compTasks = getTasks(payload.completed);
                let finishTasks = getTasks(payload.finished);
                let rejTasks = getTasks(payload.rejected);

                // When filtering by status=in_progress, backend may already merge rejected; keep extra merge safe
                if (rejTasks.length) {
                    progTasks = [...progTasks, ...rejTasks];
                }

                // Render each bucket
                newTasks.forEach(t => { if (newEl) newEl.insertAdjacentHTML("beforeend", createTaskCard(t)); });
                progTasks.forEach(t => { if (progEl) progEl.insertAdjacentHTML("beforeend", createTaskCard(t)); });
                compTasks.forEach(t => { if (compEl) compEl.insertAdjacentHTML("beforeend", createTaskCard(t)); });
                finishTasks.forEach(t => { if (finishEl) finishEl.insertAdjacentHTML("beforeend", createTaskCard(t)); });

                // Dropdown listeners are bound once globally; avoid rebinding here
                addAttachFileIconListeners();
                initBootstrapTooltips();
                refreshAllUnreadBadges();

                // ⬇️ Refresh mobile view biar ikutin hasil terbaru
                $("#taskStatusSelect").trigger("change");
                // Update the client-side cache so the List/Table view can render the filtered results
                try {
                    // Ensure merged rejected tasks are included in in_progress bucket
                    const rejectedArr = Array.isArray(payload.rejected) ? (payload.rejected.tasks || payload.rejected) : (payload.rejected?.tasks || []);
                    const inProgressMergedForCache = Array.isArray(payload.in_progress?.tasks) ? [...payload.in_progress.tasks] : (Array.isArray(payload.in_progress) ? payload.in_progress : []);
                    if (Array.isArray(rejectedArr) && rejectedArr.length) {
                        inProgressMergedForCache.push(...rejectedArr);
                    }

                    allTasksCache.new_request = { tasks: Array.isArray(payload.new_request) ? payload.new_request : (payload.new_request?.tasks || []), pagination: payload.new_request?.pagination || {} };
                    allTasksCache.in_progress = { tasks: inProgressMergedForCache, pagination: payload.in_progress?.pagination || {} };
                    allTasksCache.completed = { tasks: Array.isArray(payload.completed) ? payload.completed : (payload.completed?.tasks || []), pagination: payload.completed?.pagination || {} };
                    allTasksCache.finished = { tasks: Array.isArray(payload.finished) ? payload.finished : (payload.finished?.tasks || []), pagination: payload.finished?.pagination || {} };
                } catch (_) {}

                // Refresh the List/Table view to reflect current filters
                try { renderTaskTableFromCache(); } catch (_) {}
            },
            error: function (xhr, status, error) {
                console.error("Error fetching filtered tasks:", error);
            },
        });
    }

    // Reset filters
    function resetTaskFilters() {
        currentTaskFilters = {
            project: "",
            status: "",
            priority: "",
            date: "",
        };

        if (filterTaskProjectSelect) filterTaskProjectSelect.value = "";
        if (filterTaskPrioritySelect) {
            filterTaskPrioritySelect.value = "";
            filterTaskPrioritySelect.disabled = false;
        }
        if (filterByDate) filterByDate.value = "";
        if (filterTaskStatusSelect) {
            filterTaskStatusSelect.value = "";
            filterTaskStatusSelect.disabled = false;
        }

        fetchAndRenderTasks();

        // Hide project filter display on reset
        updateProjectFilterDisplay();
    }

    // Add reset filter button functionality
    const resetFilterBtn = document.getElementById('resetTaskFilterBtn');
    if (resetFilterBtn) {
        resetFilterBtn.addEventListener('click', resetTaskFilters);

        if (applyTaskFilterBtn && applyTaskFilterBtn.parentNode) {
            applyTaskFilterBtn.parentNode.insertBefore(resetFilterBtn, applyTaskFilterBtn.nextSibling);
        }
    }

    let mobileState = {
    page: 1,
    last: 1,
    loading: false,
    status: "new_request"
    };

    // Flag continuous auto load for in_progress list
    let mobileAutoFullLoad = false;

    let searchQueryMobile = '';
    let searchTimeout;

    function filterMobileTable(query) {
        const q = (query || '').trim().toLowerCase();
        const rows = document.querySelectorAll('#task-table-section-mobile tbody tr');
        rows.forEach(row => {
            const text = row.innerText.toLowerCase();
            row.style.display = text.includes(q) ? '' : 'none';
        });
    }

    $(document).on("keyup", "#search_filter_mobile", function () {
        clearTimeout(searchTimeout);
        const q = this.value.trim();
        searchTimeout = setTimeout(() => {
            filterMobileTable(q);
            const status = $("#taskStatusTabs .tab-item.active").data("status");
            mobileState.page = 1;
            mobileState.last = 1;
            fetchMobileTasks(status, 1, false);
        }, 300);
    });

    function fetchMobileTasks(status, page = 1, append = false, opts = {}) {
        mobileState.status = status;
        if (mobileState.loading) return;
        if (!append && opts.loadAll && status === 'in_progress' && page === 1) {
            mobileAutoFullLoad = true;
        }

        mobileState.loading = true;
        if (!append) $("#mobile-task-list").empty();

        $("#mobile-task-list").append(
            '<div id="mobileLoader" class="text-center p-2"><div class="spinner-border spinner-border-sm"></div></div>'
        );

        const params = { status, page };

        if (searchQueryMobile && searchQueryMobile.trim() !== "") {
            params.search = searchQueryMobile.trim();
        }
        if (currentTaskFilters?.project) {
            params.project = currentTaskFilters.project;
        }
        if (currentTaskFilters?.priority) {
            params.priority = currentTaskFilters.priority;
        }
        if (currentTaskFilters?.date) {
            params.date = currentTaskFilters.date;
        }

        $.ajax({
            url: appUrl + "/task/index",
            type: "GET",
            dataType: "json",
            data: params,
            success: function (response) {
                if (!response || response.code !== 200 || !response.data) return;
                let data = response.data?.[status];
                if (status === 'in_progress' && response.data?.rejected?.tasks) {
                    const rej = response.data.rejected.tasks;
                    if (Array.isArray(rej) && rej.length) {
                        const baseTasks = Array.isArray(data?.tasks) ? data.tasks : [];
                        data = { ...(data || {}), tasks: [...baseTasks, ...rej] };
                    }
                }
                mobileState.last = data?.pagination?.last_page || 1;
                renderMobileTasks(status, data, append);
                if (!append && opts.prefetch && mobileState.page === 1 && mobileState.last > 1 && status !== 'new_request') {
                    setTimeout(() => {
                        if (mobileState.status === status && mobileState.page === 1) {
                            mobileState.page = 2;
                            fetchMobileTasks(status, 2, true, { prefetch: false });
                        }
                    }, 80);
                }
                attemptAutoFillMobile(status);
                if (mobileAutoFullLoad && status === 'in_progress') {
                    if (mobileState.page < mobileState.last) {
                        setTimeout(() => {
                            if (!mobileState.loading) {
                                mobileState.page++;
                                fetchMobileTasks(status, mobileState.page, true, { loadAll: true });
                            }
                        }, 100);
                    } else {
                        mobileAutoFullLoad = false;
                    }
                }
            },
            error: function (xhr, status, error) {
                console.error("Error fetching mobile tasks:", error);
                mobileAutoFullLoad = false;
            },
            complete: function () {
                mobileState.loading = false;
                $("#mobileLoader").remove();
            }
        });
    }

    function attemptAutoFillMobile(status) {
        try {
            const list = document.getElementById('mobile-task-list');
            if (!list) return;
            if (mobileState.loading) return;
            if (mobileState.page >= mobileState.last) return;
            if (list.scrollHeight <= list.clientHeight + 4) {
                mobileState.page++;
            }

            // Add click handler to open task detail
            card.addEventListener('click', function() {
                const taskId = this.getAttribute('data-task-id');
                if (taskId) {
                    // Close the archive modal
                    const archiveModal = document.getElementById('archieveModal');
                    if (archiveModal) {
                        const bsModal = bootstrap.Modal.getInstance(archiveModal);
                        if (bsModal) bsModal.hide();
                    }
                    // Open task detail
                    handleTaskDetail(taskId);
                }
            });

        } catch (_) {}
    }

    function renderMobileTasks(status, data, append = false) {
        const list = $("#mobile-task-list");
        const container = $(".mobile-task-container");

        container.removeClass("bg-new bg-progress bg-completed");
        if (status === "new_request") {
            container.addClass("bg-new");
        } else if (status === "in_progress") {
            container.addClass("bg-progress");
        } else if (status === "completed") {
            container.addClass("bg-completed");
        } else if (status === 'finished') {
            container.addClass('bg-finish')
        }

        if (!append) list.empty();

        if (!data || !data.tasks || data.tasks.length === 0) {
            if (!append) {
                list.append('<div class="text-center text-muted py-3">No tasks found</div>');
            }
        } else {
            data.tasks.forEach(task => list.append(createTaskCard(task)));
        }

        try {
            const bulk = document.getElementById('mobileBulkControls');
            if (bulk) {
                if (status === 'new_request') {
                    bulk.style.display = 'inline-flex';
                } else {
                    bulk.style.display = 'none';
                }
            }
        } catch(_) {}

        // Reinitialize tooltips for mobile with small delay to ensure DOM is stable
        // Force tooltip reinitialization after DOM update to fix mobile placement timing
        setTimeout(() => {
            // Ensure proper cleanup of existing tooltips first
            const existingTooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
            existingTooltips.forEach(el => {
                const tooltip = bootstrap.Tooltip.getInstance(el);
                if (tooltip) {
                    tooltip.dispose();
                }
            });

            // Reinitialize with fresh mobile detection
            initBootstrapTooltips();
        }, 100);
    }

    function initMobileInfiniteScroll() {
    $("#mobile-task-list").on("scroll", function () {
        const el = this;
        if (mobileState.loading) return;

        const scrollBottom = el.scrollTop + el.clientHeight;

        if (scrollBottom >= el.scrollHeight - 50) {
        if (mobileState.page < mobileState.last) {
            mobileState.page++;
            fetchMobileTasks(mobileState.status, mobileState.page, true);
        }
        }
    });
    // Fallback: if internal scroll tidak aktif karena tinggi container kecil, gunakan window scroll
    window.addEventListener('scroll', function(){
        try {
            const list = document.getElementById('mobile-task-list');
            if (!list) return;
            if (mobileState.loading) return;
            // Check if list bottom is within viewport threshold and we still have pages
            const rect = list.getBoundingClientRect();
            const vh = window.innerHeight || document.documentElement.clientHeight;
            if (rect.bottom - vh < 50) {
                if (mobileState.page < mobileState.last) {
                    mobileState.page++;
                    fetchMobileTasks(mobileState.status, mobileState.page, true);
                }
            }
        } catch(_) {}
    }, { passive: true });
    }

    $(document).on("click", "#taskStatusTabs .tab-item", function () {
        const st = $(this).data("status");
        mobileState.status = st;
        mobileState.page = 1;
        mobileState.last = 1;
        mobileAutoFullLoad = false;

        const existingTooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        existingTooltips.forEach(el => {
            const tooltip = bootstrap.Tooltip.getInstance(el);
            if (tooltip) tooltip.dispose();
        });

        fetchMobileTasks(st, 1, false, { loadAll: st === "in_progress" });
    });

    $(document).on("click", "#openTaskFilterBtnMobile", function (e) {
        e.stopPropagation();
        const isCard = $(this).closest(".mobile-task-container").length > 0;
        const dropdownId = isCard ? "#taskFilterDropdownMobileCard" : "#taskFilterDropdownMobileTable";
        const $dropdown = $(dropdownId);

        loadProjectsForFilterMobile();
        if ($dropdown.css("display") === "none") {
            $dropdown.css("display", "block");
        } else {
            $dropdown.css("display", "none");
        }
    });

    $(document).on("click", "#applyTaskFilterBtnMobile", function () {
        const isCard = $(this).closest(".mobile-task-container").length > 0;
        const $container = $(this).closest(".mobile-task-container, #task-table-section-mobile");

        currentTaskFilters.project = $container.find(isCard ? "#filterTaskProjectMobileCard" : "#filterTaskProjectMobileTable").val() || '';
        currentTaskFilters.priority = $container.find(isCard ? "#filterTaskPriorityMobileCard" : "#filterTaskPriorityMobileTable").val() || '';
        currentTaskFilters.status = $container.find(isCard ? "#filterTaskStatusMobileCard" : "#filterTaskStatusMobileTable").val() || '';
        currentTaskFilters.date = $container.find(isCard ? "#filterByDateMobileCard" : "#filterByDateMobileTable").val() || '';

        const activeStatus = $container.find("#taskStatusTabs .tab-item.active").data("status") || "new_request";

        if (isCard) {
            mobileState.page = 1;
            mobileState.last = 1;
            fetchMobileTasks(activeStatus, 1, false, { loadAll: false });
        } else {
            renderTaskTableFromCache();
            filterTaskTableRows('', $container[0]);
        }

        const $dropdown = $(isCard ? "#taskFilterDropdownMobileCard" : "#taskFilterDropdownMobileTable");
        $dropdown.hide();
    });

    $(document).on("click", "#resetTaskFilterBtnMobile", function() {
        const isCard = $(this).closest(".mobile-task-container").length > 0;
        const $container = $(this).closest(".mobile-task-container, #task-table-section-mobile");

        currentTaskFilters = { project:'', priority:'', status:'', date:'' };

        $container.find(isCard ? "#filterTaskProjectMobileCard" : "#filterTaskProjectMobileTable").val('');
        $container.find(isCard ? "#filterTaskPriorityMobileCard" : "#filterTaskPriorityMobileTable").val('');
        $container.find(isCard ? "#filterTaskStatusMobileCard" : "#filterTaskStatusMobileTable").val('');
        $container.find(isCard ? "#filterByDateMobileCard" : "#filterByDateMobileTable").val('');

        if (isCard) {
            mobileState.page = 1;
            mobileState.last = 1;
            fetchMobileTasks('new_request', 1, false, { loadAll: false });
        } else {
            renderTaskTableFromCache();
            filterTaskTableRows('', $container[0]);
        }

        const $dropdown = $(isCard ? "#taskFilterDropdownMobileCard" : "#taskFilterDropdownMobileTable");
        $dropdown.hide();
    });

    $(document).ready(function () {
        const mobileCardHtml = `
            <div class="mobile-task-container p-3 rounded-4">
                <div class="task-mobile-status mb-2">
                    <div class="status-tabs d-flex justify-content-between align-items-center text-center border-bottom" id="taskStatusTabs">
                        <div class="tab-item flex-grow-1 py-2 active" data-status="new_request" style="position:relative;">New</div>
                        <div class="tab-item flex-grow-1 py-2" data-status="in_progress" style="position:relative;">In Progress</div>
                        <div class="tab-item flex-grow-1 py-2" data-status="completed" style="position:relative;">Completed</div>
                        <div class="tab-item flex-grow-1 py-2" data-status="finished" style="position:relative;">Finished</div>
                    </div>
                </div>
                <div class="task-mobile-actions d-flex justify-content-between align-items-center mt-3">
                    <div class="search-input-container flex-grow-1 me-2">
                        <span class="material-symbols-outlined search-icon">search</span>
                        <input class="form-control custom-form-filter" type="text" name="search_filter_mobile" id="search_filter_mobile">
                    </div>
                    <button class="btn btn-sm toggle-grid d-none me-2" id="gridViewMobileTask" data-bs-toggle="tooltip" title="Grid View">
                        <span class="material-symbols-outlined">grid_view</span>
                    </button>
                    <button class="btn btn-sm toggle-list me-2" id="listViewMobileTask" data-bs-toggle="tooltip" title="List View">
                        <span class="material-symbols-outlined">list</span>
                    </button>
                    <button class="btn btn-sm toggle-timeline timeline-toggle-btn me-2" data-bs-toggle="modal" data-bs-target="#timelineModal">
                        <span class="material-symbols-outlined">calendar_month</span>
                    </button>
                    <button class="btn btn-sm toggle-archieve me-2" data-bs-toggle="modal" data-bs-target="#archieveModal">
                        <span class="material-symbols-outlined">box</span>
                    </button>
                    <button class="btn btn-sm toggle-filter align-items-center" type="button" id="openTaskFilterBtnMobile">
                        <span class="material-symbols-outlined">filter_list</span>
                    </button>
                </div>
                <div id="mobileBulkControls" class="d-flex align-items-center justify-content-end gap-2 mt-2 mb-2" style="display:none;">
                    <button type="button" id="taskNewBulkActionMobile" class="task-bulk-icon" aria-label="Confirm accept selected tasks">
                        <span class="material-symbols-outlined">done_all</span>
                    </button>
                    <button type="button" id="taskNewBulkProgressMobile" class="task-bulk-icon" aria-label="Move selected tasks to In Progress">
                        <span class="material-symbols-outlined">arrow_right_alt</span>
                    </button>
                    <label for="taskNewAcceptAllMobile" class="task-selectall-toggle">
                        <input class="task-selectall-input" type="checkbox" id="taskNewAcceptAllMobile" aria-label="Select all pending new tasks" />
                    </label>
                </div>
                <div class="dropdown-filter-menu shadow-sm" id="taskFilterDropdownMobileCard" style="display: none;">
                    <div class="dropdown-filter-body">
                        <div class="mb-3">
                            <label for="filterTaskProjectMobileCard" class="form-label">Project</label>
                            <select id="filterTaskProjectMobileCard" class="form-select">
                                <option value="">All Projects</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label for="filterTaskPriorityMobile" class="form-label label-custom">Priority</label>
                            <select id="filterTaskPriorityMobile" class="form-select">
                                <option value="">All Priority</option>
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label for="filterByDateMobile" class="form-label label-custom">By Date</label>
                            <input class="form-select border-0" type="date" name="filter_by_date" id="filterByDateMobile">
                        </div>
                    </div>
                    <div class="dropdown-filter-footer">
                        <button type="button" class="btn btn-submit-filter" id="applyTaskFilterBtnMobile">Apply</button>
                        <button type="button" class="btn btn-submit-filter" id="resetTaskFilterBtnMobile">Reset</button>
                    </div>
                </div>
                <div id="mobile-task-list" style="max-height: calc(100vh - 120px); overflow-y: auto;"></div>
            </div>`;

        $("#task-cards-container").before(mobileCardHtml);

        const mobileTableHtml = `
            <div id="task-table-section-mobile" class="task-table-section d-none">
                <div class="body-content rounded-4 px-4 py-3">
                    <div class="task-mobile-actions d-flex justify-content-between align-items-center mt-3 mb-3">
                        <div class="search-input-container flex-grow-1 me-2">
                            <span class="material-symbols-outlined search-icon">search</span>
                            <input class="form-control custom-form-filter" type="text" name="search_filter_mobile" id="search_filter_mobile">
                        </div>
                        <button class="btn btn-sm toggle-grid me-2" id="gridViewMobileTask" data-bs-toggle="tooltip" title="Grid View">
                            <span class="material-symbols-outlined">grid_view</span>
                        </button>
                        <button class="btn btn-sm toggle-list d-none me-2" id="listViewMobileTask" data-bs-toggle="tooltip" title="List View">
                            <span class="material-symbols-outlined">list</span>
                        </button>
                        <button class="btn btn-sm toggle-timeline timeline-toggle-btn me-2" data-bs-toggle="modal" data-bs-target="#timelineModal">
                            <span class="material-symbols-outlined">calendar_month</span>
                        </button>
                        <button class="btn btn-sm toggle-archieve me-2" data-bs-toggle="modal" data-bs-target="#archieveModal">
                            <span class="material-symbols-outlined">box</span>
                        </button>
                        <button class="btn btn-sm toggle-filter align-items-center" type="button" id="openTaskFilterBtnMobile">
                            <span class="material-symbols-outlined">filter_list</span>
                        </button>
                    </div>
                    <div class="dropdown-filter-menu shadow-sm" id="taskFilterDropdownMobileTable" style="display: none;">
                        <div class="dropdown-filter-body">
                            <div class="mb-3">
                                <label for="filterTaskProjectMobileTable" class="form-label">Project</label>
                                <select id="filterTaskProjectMobileTable" class="form-select">
                                    <option value="">All Projects</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="filterTaskPriorityMobile" class="form-label label-custom">Priority</label>
                                <select id="filterTaskPriorityMobile" class="form-select">
                                    <option value="">All Priority</option>
                                    <option value="LOW">Low</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HIGH">High</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="filterByDateMobile" class="form-label label-custom">By Date</label>
                                <input class="form-select border-0" type="date" name="filter_by_date" id="filterByDateMobile">
                            </div>
                        </div>
                        <div class="dropdown-filter-footer">
                            <button type="button" class="btn btn-submit-filter" id="applyTaskFilterBtnMobile">Apply</button>
                            <button type="button" class="btn btn-submit-filter" id="resetTaskFilterBtnMobile">Reset</button>
                        </div>
                    </div>
                    <div class="table-wrapper-mobile">
                        <table class="table table-borderless align-middle table-transparent">
                            <thead>
                                <tr>
                                    <th scope="col">Task</th>
                                    <th scope="col">PIC</th>
                                    <th scope="col">Executors</th>
                                    <th scope="col">Start Date</th>
                                    <th scope="col">Due Date</th>
                                    <th scope="col">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        $("#task-table-section").before(mobileTableHtml);

        $(document).on('click', '.tab-item', function () {
            const status = $(this).data('status');
            $('.tab-item').removeClass('active');
            $(this).addClass('active');

            const bgMap = {
                new_request: 'bg-new',
                in_progress: 'bg-progress',
                completed: 'bg-completed',
                finished: 'bg-finish'
            };

            $('.mobile-task-container')
                .removeClass('bg-new bg-progress bg-completed bg-finish')
                .addClass(bgMap[status] || '');

            fetchMobileTasks(status, 1);
        });

        $(document).on('click', '#listViewMobileTask', function() {
            $('.mobile-task-container').addClass('d-none');
            $('#task-table-section-mobile').removeClass('d-none');

            $('#listViewMobileTask').addClass('d-none');
            $('#gridViewMobileTask').removeClass('d-none')
                .find('span').text('grid_view');
            $('#gridViewMobileTask').attr('title', 'Grid View').tooltip('dispose').tooltip();
        });

        $(document).on('click', '#gridViewMobileTask', function() {
            $('#task-table-section-mobile').addClass('d-none');
            $('.mobile-task-container').removeClass('d-none');

            $('#gridViewMobileTask').addClass('d-none');
            $('#listViewMobileTask').removeClass('d-none')
                .find('span').text('list');
            $('#listViewMobileTask').attr('title', 'List View').tooltip('dispose').tooltip();
        });

        function toggleDropdownFilter() {
            let dropdown = $(".dropdown-filter-container");
            let mobileContainer = $(".mobile-task-container");
            let desktopContainer = $("#task-cards-container");
            let tableSectionMobile = $("#task-table-section-mobile");
            let tableSection = $("#task-table-section");
            if ($(window).width() <= 1024) {
                mobileContainer.show();
                tableSectionMobile.show();
                desktopContainer.hide();
                tableSection.hide();
            } else {
                mobileContainer.hide();
                tableSectionMobile.hide();
                desktopContainer.show();
                tableSection.show();
            }
            if ($(window).width() <= 1024) dropdown.hide();
            else dropdown.show();
        }
        toggleDropdownFilter();
        $(window).on("resize", toggleDropdownFilter);

        function updateMobileBulkControlsVisibility(){
            const statusIsNew = $("#taskStatusTabs .tab-item.active").data('status') === 'new_request';
            if(!statusIsNew){ $("#mobileBulkControls").hide(); return; }
            if($("#mobileBulkControls").data('forced-show') !== '1') {
                $("#mobileBulkControls").hide();
            }
        }

        function adjustMobileListHeight(){
            const list = document.getElementById('mobile-task-list');
            if(!list) return;
            const rect = list.getBoundingClientRect();
            const vh = window.innerHeight || document.documentElement.clientHeight;
            const desired = Math.max(200, vh - rect.top - 16);
            list.style.maxHeight = desired + 'px';
        }
        window.addEventListener('resize', adjustMobileListHeight);
        setTimeout(adjustMobileListHeight, 50);
        setTimeout(adjustMobileListHeight, 350);

        initMobileInfiniteScroll();
        fetchMobileTasks('new_request', 1, false);
        updateMobileBulkControlsVisibility();
    });

    let archivePage = 1
    let archiveLoading = false
    let archiveHasMore = true

    function resetArchiveState() {
        archivePage = 1
        archiveLoading = false
        archiveHasMore = true
    }

    async function loadArchivedTasksIntoModal(page = 1, append = false) {
        try {
            const baseAppUrl = (typeof appUrl !== 'undefined' && appUrl)
                ? appUrl
                : (document.querySelector('meta[name="app-url"]')?.getAttribute('content') || (window.location.origin || ''));

            const modalEl = document.getElementById('archieveModal');
            if (!modalEl) return;
            const body = modalEl.querySelector('.modal-body');
            if (!body) return;

            if (!append) {
                resetArchiveState();
                body.innerHTML = '<div class="text-center p-3"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';
                // reset ID set kalau reload full
                window.__renderedArchiveIds = new Set();
            }

            if (archiveLoading || !archiveHasMore) return;
            archiveLoading = true;

            // Fetch both canceled and deleted pages in parallel and merge
            const [resCanceled, resDeleted] = await Promise.all([
                fetch(`${baseAppUrl}/task/index?status=canceled&include_canceled=1&per_page=10&page=${page}`, { headers: { 'X-Requested-With': 'XMLHttpRequest' } }).catch(() => null),
                fetch(`${baseAppUrl}/task/index?status=deleted&include_canceled=1&per_page=10&page=${page}`, { headers: { 'X-Requested-With': 'XMLHttpRequest' } }).catch(() => null)
            ]);

            if ((!resCanceled || !resCanceled.ok) && (!resDeleted || !resDeleted.ok)) {
                if (!append) body.innerHTML = '<div class="text-center text-muted py-3">Failed to load archived tasks</div>';
                archiveLoading = false;
                return;
            }
            const parseTasksFromResponse = async (res) => {
                if (!res || !res.ok) return [];
                const j = await res.json().catch(() => ({}));
                const data = (j && j.data) ? j.data : {};
                let arr = [];
                if (data) {
                    const keys = ['canceled','CANCELED','deleted','DELETED'];
                    for (const key of keys) {
                        const section = data[key];
                        if (!section) continue;
                        if (Array.isArray(section)) arr = arr.concat(section);
                        else if (Array.isArray(section.tasks)) arr = arr.concat(section.tasks);
                    }
                }
                if ((!arr || !arr.length) && data) {
                    // fallback: flatten buckets and filter by status canceled/deleted
                    const collected = [];
                    const buckets = ['new_request','in_progress','completed', 'finished','rejected','canceled','deleted','CANCELED','DELETED'];
                    buckets.forEach(key => {
                        const section = data[key];
                        if (!section) return;
                        if (Array.isArray(section)) collected.push(...section);
                        else if (Array.isArray(section.tasks)) collected.push(...section.tasks);
                    });
                    arr = collected.filter(t => {
                        const s = String(t.status || '').toLowerCase();
                        return s === 'canceled' || s === 'deleted' || s.includes('cancel') || s.includes('deleted');
                    });
                }
                return arr;
            };

            let tasks = [];
            const [tasksCanceled, tasksDeleted] = await Promise.all([
                parseTasksFromResponse(resCanceled),
                parseTasksFromResponse(resDeleted)
            ]);
            tasks = tasks.concat(tasksCanceled || [], tasksDeleted || []);
            if (!tasks || tasks.length === 0) {
                let collected = [];
                const buckets = ['new_request', 'in_progress', 'completed', 'finished', 'rejected', 'canceled', 'CANCELED'];
                buckets.forEach(key => {
                    const section = data[key];
                    if (!section) return;
                    if (Array.isArray(section)) collected.push(...section);
                    else if (Array.isArray(section.tasks)) collected.push(...section.tasks);
                });
                if (Array.isArray(data)) collected.push(...data);
                const seen = new Set();
                const allTasks = [];
                collected.forEach(t => {
                    const id = t && (t.id || t.task_id);
                    if (!id) return;
                    if (seen.has(String(id))) return;
                    seen.add(String(id));
                    allTasks.push(t);
                });
                tasks = allTasks.filter(t => String(t.status || '').toLowerCase().includes('cancel'));
            }

            try {
                const clientMap = window.__clientArchivedTasks || new Map();
                if (clientMap && typeof clientMap.forEach === 'function') {
                    clientMap.forEach(function (t) {
                        if (!tasks.some(x => String(x.id) === String(t.id))) tasks.push(t);
                    });
                }
                if (!tasks || !tasks.length) {
                    body.innerHTML = '<div class="text-center text-muted py-3">No archived tasks</div>';
                    try { window.__renderingArchiveModal = false } catch (_) { }
                    archiveLoading = false;
                    archiveHasMore = false;
                    return;
                }
            } catch (_) { }

            let container = body.querySelector('.task-list');
            if (!container) {
                container = document.createElement('div');
                container.className = 'task-list d-flex flex-column gap-2 p-2';
                if (!append) {
                    body.innerHTML = '';
                    body.appendChild(container);
                }
            }

            function buildSafeCardHtml(t) {
                const title = (t.title || 'Untitled Task');
                const proj = (t.project && t.project.title) ? t.project.title : (t.project_title || '');
                const desc = (t.description || '').toString();
                const priority = t.priority || '';
                const rawStatus = String((t.status || '')).toUpperCase();
                const typeBadge = (rawStatus === 'CANCELED' || rawStatus === 'DELETED' || rawStatus.includes('CANCEL'))
                    ? `<span style="color:red; font-weight:600;">${rawStatus}</span>`
                    : `<span style="color:#baeed340; font-weight:600;">${rawStatus}</span>`;
                return `
                    <div class="custom-card mb-3 rounded-4 position-relative" data-task-id="${t.id || ''}" data-task-status="${t.status || ''}">
                        ${proj ? `<small class="text-muted" style="line-height:1; font-size: 10px;">${proj}</small>` : ''}
                        <h5 class="mb-0 task-title" style="line-height:1.2; margin-top:6px;">${title}</h5>
                        <div class="task-description-container"><p class="task-description" style="margin-top:6px;">${desc}</p></div>
                        <hr class="task-separator rounded-4">
                        <div class="d-flex justify-content-between align-items-center">
                            <div style="font-size: 10px; font-weight: 400;">
                                <span style="color: #797E91;">Priority: </span>
                                <span style="color: ${priority === 'HIGH' ? 'red' : '#4B4F5E'}">${priority}</span>
                            </div>
                            <div style="font-size: 10px; font-weight: 400;">
                                <span style="color: #797E91;">Status: </span>
                                <span class="type-badge-wrapper">${typeBadge}</span>
                            </div>
                        </div>
                    </div>`;
            }

            function safeInsertTask(container, t, html) {
                const id = String(t.id || t.task_id || '');
                if (!id) return;
                window.__renderedArchiveIds = window.__renderedArchiveIds || new Set();
                if (window.__renderedArchiveIds.has(id)) return;
                window.__renderedArchiveIds.add(id);
                container.insertAdjacentHTML('beforeend', html);
            }

            try { window.__renderingArchiveModal = true } catch (_) { }
            tasks.forEach(t => {
                try {
                    const normalized = Object.assign({}, t);
                    normalized.project_title = (t.project && t.project.title) ? t.project.title : (t.project_title || '');
                    normalized.project_id = (t.project && t.project.id) ? t.project.id : (t.project_id || null);
                    normalized.project_image = (t.project && t.project.image) ? t.project.image : (t.project_image || null);

                    let html = '';
                    if (typeof createTaskCard === 'function') {
                        try { html = createTaskCard(normalized); } catch { html = buildSafeCardHtml(normalized); }
                    } else if (typeof window !== 'undefined' && typeof window.createTaskCard === 'function') {
                        try { html = window.createTaskCard(normalized); } catch { html = buildSafeCardHtml(normalized); }
                    } else {
                        html = buildSafeCardHtml(normalized);
                    }

                    safeInsertTask(container, normalized, html);
                } catch (e) {
                    const simple = document.createElement('div');
                    simple.className = 'custom-card rounded-4 position-relative p-3 border-0';
                    simple.innerHTML = `<h5 class="mb-1">${(t.title || 'Untitled Task')}</h5><p class="mb-0 text-muted">${(t.project && t.project.title) || t.project_title || ''}</p>`;
                    safeInsertTask(container, t, simple.outerHTML);
                }
            });
            try { window.__renderingArchiveModal = false } catch (_) { }

            try {
                body.innerHTML = '';
                body.appendChild(container);
                container.querySelectorAll('.custom-card').forEach(function (card) {
                    try {
                        const ds = card.querySelectorAll('div[style*="Deadline:"]');
                        card.querySelectorAll('.executor-container, .executor-list, .task-executor').forEach(el => el.remove());
                        card.querySelectorAll('.pic-container, .task-pic').forEach(el => el.remove());
                        card.querySelectorAll('.task-icon').forEach(el => el.remove());
                        card.querySelectorAll('button, a.btn').forEach(btn => {
                            if (btn.textContent.toLowerCase().includes('edit') || btn.textContent.toLowerCase().includes('delete')) btn.remove();
                        });
                        card.querySelectorAll('.feedback-comments-count').forEach(el => el.remove());
                        card.querySelectorAll('.reference-files-count').forEach(el => el.remove());
                        const status = (card.getAttribute('data-task-status') || '').toLowerCase();
                        const dropdownMenu = card.querySelector('.dropdown-menu');
                        if (dropdownMenu) {
                            dropdownMenu.innerHTML = '';
                            if (status === 'completed') {
                                dropdownMenu.innerHTML = `<div class="dropdown-item">Detail</div>`;
                            } else {
                                dropdownMenu.innerHTML = `<div class="dropdown-item">Detail</div><div class="dropdown-item">Restore Task</div>`;
                            }
                        }
                        if (ds && ds.length) {
                            ds.forEach(function (dd) {
                                const st = (card.getAttribute('data-task-status') || '').toUpperCase();
                                const badge = (st === 'CANCELED' || st === 'DELETED' || st.includes('CANCEL'))
                                    ? `<span style="color:#D0322D; font-weight:600;">${st}</span>`
                                    : `<span style="color:#1E8E3E; font-weight:600;">${st}</span>`;
                                dd.innerHTML = dd.innerHTML.replace(/Deadline:\s*<\/span>\s*<span[^>]*>[^<]*<\/span>/i, 'Type: <span class="type-badge-wrapper">' + badge + '</span>');
                            });
                        } else {
                            card.innerHTML = card.innerHTML.replace(/Deadline:\s*<\/span>\s*<span[^>]*>([^<]*)<\/span>/i, function (_, g1) {
                                const st = (card.getAttribute('data-task-status') || '').toUpperCase();
                                const badge = (st === 'CANCELED' || st === 'DELETED' || st.includes('CANCEL'))
                                    ? `<span style="color:#D0322D; font-weight:600;">${st}</span>`
                                    : `<span style="color:#1E8E3E; font-weight:600;">${st}</span>`;
                                return 'Status: <span class="type-badge-wrapper">' + badge + '</span>';
                            });
                        }
                    } catch (_) { }
                });
                container.querySelectorAll('.custom-card .dropdown-menu .dropdown-item').forEach(function (item) {
                    item.addEventListener('click', function (e) {
                        e.stopPropagation();
                        const text = this.textContent.trim();
                        const card = this.closest('.custom-card');
                        const taskId = card && card.getAttribute('data-task-id');
                        if (!taskId) return;
                        if (text === 'Detail') {
                            const archiveModal = document.getElementById('archieveModal');
                            if (archiveModal) {
                                const bsModal = bootstrap.Modal.getInstance(archiveModal);
                                if (bsModal) bsModal.hide();
                            }
                            handleTaskDetail(taskId);
                        }
                        if (text === 'Restore Task') {
                            const restoreStatus = 'new_request';
                            updateTaskStatus(taskId, restoreStatus, card)
                                .then(() => {
                                    showFloatingAlert('Task restored to ' + restoreStatus, 'success');
                                    card.remove();
                                })
                                .catch(err => {
                                    showFloatingAlert('Failed to restore task: ' + err, 'danger');
                                });
                        }
                    });
                });
                initBootstrapTooltips(modalEl);
            } catch (_) {
                try { body.innerHTML = ''; body.appendChild(container); initBootstrapTooltips(modalEl); } catch (_) { }
            }

            if (tasks.length < 10) {
                archiveHasMore = false;
                const sentinel = body.querySelector('.lazy-sentinel');
                if (sentinel) sentinel.remove();
            } else {
                let sentinel = body.querySelector('.lazy-sentinel');
                if (!sentinel) {
                    sentinel = document.createElement('div');
                    sentinel.className = 'lazy-sentinel text-center p-2 text-muted';
                    sentinel.innerText = 'Loading more...';
                    body.appendChild(sentinel);
                    const io = new IntersectionObserver(entries => {
                        entries.forEach(entry => {
                            if (entry.isIntersecting && archiveHasMore && !archiveLoading) {
                                archivePage++;
                                loadArchivedTasksIntoModal(archivePage, true);
                            }
                        });
                    });
                    io.observe(sentinel);
                }
            }

            archiveLoading = false;
        } catch (err) {
            try {
                const modalEl = document.getElementById('archieveModal');
                const body = modalEl && modalEl.querySelector('.modal-body');
                if (body) body.innerHTML = '<div class="text-center text-muted py-3">Failed to load archived tasks</div>';
            } catch (_) { }
        }
    }

    // Bind modal show event
    try {
        const archModal = document.getElementById('archieveModal');
        if (archModal) {
            archModal.addEventListener('show.bs.modal', function () {
                loadArchivedTasksIntoModal();
                resetArchiveState()
            });
        }
    } catch(_) {}

 let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();

    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

    // Task timeline data cache
    let timelineTasksCache = [];
    const TL_COLORS = ["color1","color2","color3","color4"];
    const appUrlTimeline = document.querySelector('meta[name="app-url"]')?.getAttribute('content') || '';

    function parseDateLoose(s) {
        if (!s) return null;
        const m = String(s).match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
        if (m) return new Date(parseInt(m[1],10), parseInt(m[2],10)-1, parseInt(m[3],10));
        const d = new Date(s);
        return isNaN(d.getTime()) ? null : d;
    }

    function colorForStatus(t, idx) {
        const s = (t.status || '').toLowerCase();
        if (s.includes('completed')) return 'color2';
        if (s.includes('in') && s.includes('progress')) return 'color3';
        if (s.includes('reject') || s.includes('late')) return 'color4';
        return TL_COLORS[idx % TL_COLORS.length];
    }

    async function fetchTimelineTasksOnce() {
        if (timelineTasksCache.length) return; // cache already prepared
        try {
            const r = await fetch(appUrlTimeline + '/task/index/no-pagination', { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
            const j = await r.json();
            const buckets = (j && j.data) ? j.data : {};
            const flat = [];

            // API structure: { new_request: {tasks:[...]}, in_progress:{tasks:[...]}, completed:{tasks:[...]}, rejected:{tasks:[...]?} }
            Object.keys(buckets).forEach(key => {
                const section = buckets[key];
                if (!section) return;
                if (Array.isArray(section)) {
                    section.forEach(t => flat.push(t));
                } else if (Array.isArray(section.tasks)) {
                    section.tasks.forEach(t => flat.push(t));
                }
            });

            // Filter duplicate task by ID
            const uniqueFlat = [];
            const seenIds = new Set();
            flat.forEach(t => {
                if (!t.id) return;
                if (!seenIds.has(t.id)) {
                    uniqueFlat.push(t);
                    seenIds.add(t.id);
                }
            });

            // Enrich missing dates (only for items lacking either start or due date)
            await Promise.all(uniqueFlat.map(async (t) => {
                if (t.start_date && t.due_date) return;
                try {
                    const rr = await fetch(appUrlTimeline + '/task/' + t.id, { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
                    if (!rr.ok) return;
                    const dd = await rr.json();
                    const d = dd && (dd.data || dd);
                    if (d) {
                        t.start_date = t.start_date || d.start_date || d.start || d.startDate || null;
                        t.due_date   = t.due_date   || d.due_date   || d.end_date || d.endDate || d.due || null;
                    }
                } catch (e) {
                    // silent – keep existing data
                }
            }));

            // Only keep tasks that have at least one bound (start/due)
            timelineTasksCache = uniqueFlat.filter(t => t.start_date || t.due_date);
        } catch (e) {
            console.error('[timeline] Failed to fetch tasks for timeline', e);
            timelineTasksCache = [];
        }
    }

    function renderTimeline(targetHeaderSelector, targetRowsSelector, month, year) {
        const headerRow = document.querySelector(targetHeaderSelector);
        const rowsContainer = document.querySelector(targetRowsSelector);
        if (!headerRow || !rowsContainer) return;

        headerRow.innerHTML = "";
        rowsContainer.innerHTML = "";

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const headerLabels = Array.from({ length: daysInMonth }, (_, i) => i + 1);

        // Header
        headerLabels.forEach((day) => {
            const th = document.createElement("th");
            th.textContent = day;
            th.classList.add("timeline-cell");
            if (new Date(year, month, day).getDay() === 0) {
            th.classList.add("sunday");
            }
            headerRow.appendChild(th);
        });

        // Rows (tasks) – build from cache for the requested month
        const monthRows = (timelineTasksCache || []).map((t, idx) => {
            const name = t.title || t.name || ('Task ' + (t.id || idx+1));
            const color = colorForStatus(t, idx);
            const start = parseDateLoose(t.start_date);
            const due = parseDateLoose(t.due_date) || start || new Date(year, month, 1);
            return { id: t.id, name, start, due, color };
        }).filter(x => x.start || x.due);

        let rendered = 0;
        monthRows.forEach((task) => {
            const tr = document.createElement("tr");
            if (task.id) tr.setAttribute('data-task-id', String(task.id));

            // Visible month window
            const monthStart = new Date(year, month, 1, 0, 0, 0, 0);
            const monthEnd = new Date(year, month, daysInMonth, 23, 59, 59, 999);

            // Task span (prefer start..due, fallback to single-day when one side missing)
            const s = task.start ? new Date(task.start) : (task.due ? new Date(task.due) : null);
            const e = task.due ? new Date(task.due) : (task.start ? new Date(task.start) : null);
            if (!s || !e) return; // nothing to render

            // If the task is completely outside this month, skip
            if (e < monthStart || s > monthEnd) return;

            // Clamp to month window so bars end exactly at due_date and not beyond
            const clampedStart = new Date(Math.max(s.getTime(), monthStart.getTime()));
            const clampedEnd = new Date(Math.min(e.getTime(), monthEnd.getTime()));

            let startDay = clampedStart.getDate();
            let endDay = clampedEnd.getDate();
            if (endDay < startDay) endDay = startDay; // safety

            // Empty cells before the bar
            for (let i = 1; i < startDay; i++) {
                const td = document.createElement("td");
                td.classList.add("timeline-cell");
                if (new Date(year, month, i).getDay() === 0) td.classList.add("sunday");
                tr.appendChild(td);
            }

            // Bar cell spanning the exact number of days
            const barTd = document.createElement("td");
            barTd.colSpan = endDay - startDay + 1;
            barTd.classList.add("timeline-cell");
            if (task.id) barTd.setAttribute('data-task-id', String(task.id));
            barTd.innerHTML = `<div class="timeline-bar ${task.color}" data-task-id="${task.id || ''}" style="cursor:pointer; pointer-events:auto; z-index:2; position:relative;"><span class="circle"></span><p class="bar-name">${task.name}</p></div>`;
            tr.appendChild(barTd);

            // Empty cells after the bar
            for (let i = endDay + 1; i <= daysInMonth; i++) {
                const td = document.createElement("td");
                td.classList.add("timeline-cell");
                if (new Date(year, month, i).getDay() === 0) td.classList.add("sunday");
                tr.appendChild(td);
            }

            rowsContainer.appendChild(tr);
            rendered++;
    });

    // Ensure consistent modal/table height by padding with empty rows
    const MIN_ROWS = 6; // baseline number of rows to maintain look and feel
    if (rendered < MIN_ROWS) {
        for (let r = rendered; r < MIN_ROWS; r++) {
            const tr = document.createElement("tr");
            for (let d = 1; d <= daysInMonth; d++) {
                const td = document.createElement("td");
                td.classList.add("timeline-cell");
                if (new Date(year, month, d).getDay() === 0) td.classList.add("sunday");
                tr.appendChild(td);
            }
            rowsContainer.appendChild(tr);
        }
    }

    document.getElementById("timelineModalTitle").textContent = `${months[month]} ${year}`;
    }

    // Delegated click: when clicking a bar inside timeline, close timeline first, then show task detail;
    // when detail closes, re-open the timeline modal.
    document.addEventListener('click', function (e) {
        const timelineEl = document.getElementById('timelineModal');
        if (!timelineEl || !timelineEl.classList.contains('show')) return;
        const host = e.target.closest('[data-task-id]');
        if (!host) return;
        const tid = host.getAttribute('data-task-id');
        if (!tid) return;

        // Detect if timeline modal is currently open
        let shouldReopenTimeline = false;
        if (timelineEl && timelineEl.classList.contains('show')) {
            try {
                const tlInstance = bootstrap.Modal.getInstance(timelineEl) || new bootstrap.Modal(timelineEl);
                tlInstance.hide();
                shouldReopenTimeline = true;
            } catch (_) {}
        }

        // Mark to reopen timeline after detail is closed (only when originated from timeline)
        if (shouldReopenTimeline) {
            const detailEl = document.getElementById('taskDetailModal');
            if (detailEl) {
                // Set a flag on detail so we remember to reopen timeline later
                detailEl.setAttribute('data-reopen-timeline', '1');

                // Remove any existing timeline handler to avoid conflicts
                if (detailEl._timelineHiddenHandler) {
                    detailEl.removeEventListener('hidden.bs.modal', detailEl._timelineHiddenHandler);
                }

                // Create a fresh handler for this specific timeline interaction
                const onDetailHidden = function () {
                    try {
                        // If a child modal (edit/feedback/files) is opening, skip reopening timeline now
                        if (detailEl.getAttribute('data-child-opened')) {
                            return;
                        }
                        if (detailEl.getAttribute('data-reopen-timeline') === '1') {
                            const tlInstance2 = bootstrap.Modal.getInstance(timelineEl) || new bootstrap.Modal(timelineEl);
                            tlInstance2.show();
                            detailEl.removeAttribute('data-reopen-timeline');
                        }
                    } catch(_) { /* noop */ }
                };

                // Store reference to handler and attach it
                detailEl._timelineHiddenHandler = onDetailHidden;
                detailEl.addEventListener('hidden.bs.modal', onDetailHidden);
            }
        }

        // Proceed to open Task Detail
        try { handleTaskDetail(tid); } catch(_) {}
    });

    // First render on modal show
    const timelineModal = document.getElementById("timelineModal");
    timelineModal.addEventListener("show.bs.modal", async () => {
        await fetchTimelineTasksOnce();
        renderTimeline("#timelineHeaderModal", "#timelineRowsModal", currentMonth, currentYear);
    });

    // Prev / Next bulan
    document.getElementById("prevTimelineModal").addEventListener("click", () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderTimeline("#timelineHeaderModal", "#timelineRowsModal", currentMonth, currentYear);
    });

    document.getElementById("nextTimelineModal").addEventListener("click", () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderTimeline("#timelineHeaderModal", "#timelineRowsModal", currentMonth, currentYear);
    });

    // Initialize tooltips for task detail modal when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        const taskDetailModal = document.getElementById('taskDetailModal');
        if (taskDetailModal) {
            // Add event listeners for tooltip management in modal
            taskDetailModal.addEventListener('shown.bs.modal', function () {
                setTimeout(() => {
                    initBootstrapTooltips(taskDetailModal);
                }, 100);
            });

            taskDetailModal.addEventListener('hidden.bs.modal', function () {
                const tooltipElements = taskDetailModal.querySelectorAll('[data-bs-toggle="tooltip"]');
                tooltipElements.forEach(el => {
                    const tooltip = bootstrap.Tooltip.getInstance(el);
                    if (tooltip) {
                        tooltip.dispose();
                    }
                });
            });
        }
    });

    function showCompletedModal(task) {
        let appUrl = (function(){
            try {
                const meta = document.querySelector('meta[name="app-url"]');
                let v = (meta && meta.getAttribute('content')) || '';
                if (v) {
                    v = new URL(v, window.location.origin).href.replace(/\/+$/, '');
                    return v;
                }
                const parts = (window.location.pathname || '').split('/').filter(Boolean);
                const baseSeg = parts.length > 0 ? ('/' + parts[0]) : '';
                return (window.location.origin + baseSeg).replace(/\/+$/, '');
            } catch(_) {
                return (window.location.origin || '').replace(/\/+$/, '');
            }
        })();

        const $img = $("#completed_task_image");
        const $imgParent = $img.parent();
        const title = task.title || "No Title";

        $imgParent.find(".completed-task-initial-avatar").remove();

        if (task.image) {
            $img.attr("src", task.image).show();
        } else {
            $img.hide();
            const initials = getTaskInitials(title);
            const bgColor = getRandomColorFromText(title);
            const initialsEl = $(`
                <div class="completed-task-initial-avatar d-flex align-items-center justify-content-center me-2"
                    style="width:34px;height:34px;border-radius:50%;font-weight:600;
                        font-size:12px;color:#fff;background:${bgColor};flex-shrink:0;">
                    ${initials}
                </div>
            `);
            $imgParent.prepend(initialsEl);
        }

        $("#completed_task_title").text(task.title || "-");
        $("#completed_project_title").text(task.project_title || "-");
        $("#completed_task_note").html(task.complete_note || task.finished_note || "<em>No note</em>");
        $("#completed_date").text(formatDateENMedium(task.complete_date || task.finished_date || "-"));

        const $priority = $("#completed_priority");
        $priority.text(task.priority || "-").css({ "color": "", "font-weight": "500" });
        if (task.priority === "HIGH") $priority.css("color", "#d9534f");
        else if (task.priority === "MEDIUM") $priority.css("color", "#f0ad4e");
        else if (task.priority === "LOW") $priority.css("color", "#5cb85c");

        const $urlsContainer = $("#completed_task_urls").empty();
        const urls = task.complete_urls || task.finished_urls || [];

        if ($.isArray(urls) && urls.length) {
            urls.forEach((u) => {
                const absUrl = u.startsWith("http")
                    ? u
                    : `${appUrl.replace(/\/+$/, '')}/${u.replace(/^\/+/, '')}`;
                const linkName = absUrl.split('/').pop() || absUrl;

                const linkHtml = `
                <div class="d-flex align-items-center p-2 rounded bg-light mb-2" style="font-size:12px;">
                    <a href="${absUrl}" target="_blank" class="text-decoration-none"
                    style="
                        color:#444;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        display: block;
                        width: 100%;
                    ">
                    ${absUrl}
                    </a>
                </div>`;

                $urlsContainer.append(linkHtml);
            });
        } else {
            $urlsContainer.html('<div class="text-center text-muted small"><em>-</em></div>');
        }

        const $filesContainer = $("#completed_task_files").empty();
        const files = task.complete_files || task.finished_files || [];

        if ($.isArray(files) && files.length) {
            files.forEach((f, idx) => {
                let raw = f.url || f;
                let absUrl = "";
                const isAbs = raw.startsWith("http://") || raw.startsWith("https://");
                const isRefPath = raw.startsWith("/file/") || raw.startsWith("file/");
                if (isAbs) absUrl = raw;
                else if (isRefPath) absUrl = appUrl.replace(/\/+$/, '') + '/' + raw.replace(/^\/+/, '');
                else absUrl = appUrl.replace(/\/+$/, '') + '/file/task_complete_files/' + raw.replace(/^\/+/, '');

                const extMatch = raw.match(/\.[^/.]+$/);
                const ext = extMatch ? extMatch[0] : "";
                const fileName = `TASK_FILE_${idx + 1}${ext}`;

                const lower = absUrl.toLowerCase();
                const isPreviewable =
                    lower.endsWith(".pdf") ||
                    lower.endsWith(".jpg") ||
                    lower.endsWith(".jpeg") ||
                    lower.endsWith(".png");

                const fileLinkHtml = `
                    <div class="d-flex align-items-center p-2 rounded bg-light mb-2" style="font-size:12px;">
                        <a href="${absUrl}" target="_blank" ${!isPreviewable ? `download="${fileName}"` : ''} 
                        class="text-decoration-none flex-grow-1" 
                        style="color:#444; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display:block; width:100%;">
                        ${fileName}
                        </a>
                    </div>`;
                $filesContainer.append(fileLinkHtml);
            });
        } else {
            $filesContainer.html('<div class="text-center text-muted small"><em>-</em></div>');
        }

    }

    $(document).on("click", ".playlist_add_check", function () {
        const taskId = $(this).data("task-id");

        const task =
            (allTasksCache?.completed?.tasks || []).find(t => t.id == taskId) ||
            (allTasksCache?.finished?.tasks || []).find(t => t.id == taskId);

        if (task) {
            showCompletedModal(task);
        } else {
            console.warn("Task not found for ID:", taskId);
        }
    });

    $(document).on('click', '#listViewTask', function() {
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        const $btnList = $('#listViewTask');
        const $btnGrid = $('#gridViewTask');

        if (isMobile) {
            $('#mobile-task-container').removeClass('d-none');
            $('#task-cards-container, #task-table-section').addClass('d-none');
        } else {
            $('#task-table-section').removeClass('d-none');
            $('#task-cards-container').addClass('d-none');
        }

        $btnList.addClass('d-none');
        $btnGrid.removeClass('d-none');
        $btnGrid.find('span').text('grid_view');
        $btnGrid.attr('title', 'Grid View').tooltip('dispose').tooltip();
    });

    $(document).on('click', '#gridViewTask', function() {
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        const $btnList = $('#listViewTask');
        const $btnGrid = $('#gridViewTask');

        if (isMobile) {
            $('#mobile-task-container').addClass('d-none');
            $('#task-cards-container').removeClass('d-none');
        } else {
            $('#task-table-section').addClass('d-none');
            $('#task-cards-container').removeClass('d-none');
        }

        $btnGrid.addClass('d-none');
        $btnList.removeClass('d-none');
        $btnList.find('span').text('list');
        $btnList.attr('title', 'List View').tooltip('dispose').tooltip();
    });

    // Helper functions for task feedback image and file preview (similar to project feedback)
                    function showInlineImagePreviewSmall(fileObj, dataUrl) {
                        try {
                            // Create or get the preview container
                            var previewContainer = document.getElementById(
                                "inline_feedback_image_preview"
                            );
                            if (!previewContainer) {
                                previewContainer = document.createElement("div");
                                previewContainer.id = "inline_feedback_image_preview";
                                // ensure container and its children are fully opaque and do not inherit any translucent styles
                                previewContainer.style.cssText =
                                    "display: inline-flex; align-items: center; margin-left: 8px; opacity: 1; background: transparent;";

                                // Insert after the file button
                                var fileBtn = document.getElementById(
                                    "inlineFeedbackFileBtn"
                                );
                                if (fileBtn && fileBtn.parentNode) {
                                    fileBtn.parentNode.insertBefore(
                                        previewContainer,
                                        fileBtn.nextSibling
                                    );
                                }
                            }

                            // Create the image preview similar to modal add project style
                            previewContainer.innerHTML = "";

                            var imageLabel = document.createElement("div");
                            imageLabel.className =
                                "custom-image-upload position-relative";
                            // apply explicit opaque styles so the preview doesn't look translucent
                            imageLabel.style.cssText =
                                "" +
                                "width: 32px; " +
                                "height: 32px; " +
                                "background-image: url('" +
                                dataUrl +
                                "'); " +
                                "background-size: cover; " +
                                "background-position: center center; " +
                                "background-repeat: no-repeat; " +
                                "border-radius: 6px; " +
                                "cursor: pointer; " +
                                "border: 1px solid #ddd; " +
                                "margin-right: 4px; " +
                                "opacity: 1; " +
                                "background-color: #ffffff; " +
                                "box-shadow: 0 1px 3px rgba(0,0,0,0.12); " +
                                "overflow: visible; ";

                            var clearBtn = document.createElement("span");
                            clearBtn.className = "image-clear-btn";
                            clearBtn.innerHTML = "&times;";
                            clearBtn.title = "Remove image";
                            // make the clear button visually prominent and above other elements
                            clearBtn.style.cssText =
                                "" +
                                "position: absolute; " +
                                "top: -6px; " +
                                "right: -6px; " +
                                "background: #ff4444; " +
                                "color: #ffffff; " +
                                "border-radius: 50%; " +
                                "width: 16px; " +
                                "height: 16px; " +
                                "font-size: 12px; " +
                                "line-height: 16px; " +
                                "text-align: center; " +
                                "cursor: pointer; " +
                                "font-weight: 700; " +
                                "border: none; " +
                                "box-shadow: 0 2px 6px rgba(0,0,0,0.25); " +
                                "z-index: 30; " +
                                "opacity: 1; ";

                            // Store the file object for later use
                            window.__inlineFeedbackImageFile = fileObj;

                            clearBtn.addEventListener("click", function (e) {
                                e.preventDefault();
                                e.stopPropagation();
                                try {
                                    // Clear the file input
                                    var inp = document.getElementById(
                                        "inline_feedback_image_input"
                                    );
                                    if (inp) inp.value = "";
                                    // Clear the stored file
                                    window.__inlineFeedbackImageFile = null;
                                    // Remove the preview container
                                    if (
                                        previewContainer &&
                                        previewContainer.parentNode
                                    ) {
                                        previewContainer.parentNode.removeChild(
                                            previewContainer
                                        );
                                    }
                                } catch (_) {}
                            });

                            // Add click to preview (optional - could open larger view)
                            imageLabel.addEventListener("click", function (e) {
                                e.preventDefault();
                                // Optional: show larger preview or do nothing
                                try {
                                    showInlineImagePreview(fileObj, dataUrl);
                                } catch (_) {}
                            });

                            imageLabel.appendChild(clearBtn);
                            previewContainer.appendChild(imageLabel);
                        } catch (e) {
                            console.warn("Failed to show image preview:", e);
                        }
                    }

                    // show inline image preview overlay (WhatsApp-like)
                    function showInlineImagePreview(fileObj, dataUrl) {
                        try {
                            if (document.getElementById("inlineImagePreviewOverlay")) return;

                            function cleanup() {
                                try {
                                    const inp = document.getElementById("inline_feedback_image_input");
                                    if (inp) inp.value = "";
                                } catch (_) {}
                                try {
                                    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
                                } catch (_) {}
                                try {
                                    window.__inlineFeedbackImageFile = null;
                                    const previewContainer = document.getElementById("inline_feedback_image_preview");
                                    if (previewContainer && previewContainer.parentNode) {
                                        previewContainer.parentNode.removeChild(previewContainer);
                                    }
                                } catch (_) {}
                            }

                            cancelBtn.addEventListener("click", cleanup);

                            sendBtn.addEventListener("click", function () {
                                try {
                                    const fd = new FormData();
                                    fd.append("project_id", getMeta("project-id") || "");
                                    fd.append(
                                        "employee_id",
                                        document
                                            .getElementById("projectFeedbackModal")
                                            ?.getAttribute("data-employee-id") || ""
                                    );

                                    const imageFileToUse = window.__inlineFeedbackImageFile || fileObj;
                                    if (imageFileToUse) fd.append("feedback_image", imageFileToUse);

                                    const origText = sendBtn.innerHTML;
                                    sendBtn.disabled = true;
                                    sendBtn.innerHTML =
                                        '<span class="spinner-border spinner-border-sm me-1"></span>Sending...';

                                    fetch(getMeta("app-url").replace(/\/$/, "") + "/project-feedbacks", {
                                        method: "POST",
                                        headers: {
                                            "X-CSRF-TOKEN": document
                                                .querySelector('meta[name="csrf-token"]')
                                                .getAttribute("content"),
                                        },
                                        body: fd,
                                    })
                                        .then((res) => {
                                            if (!res.ok)
                                                return res.json().then((j) => Promise.reject(j));
                                            return res.json();
                                        })
                                        .then((data) => {
                                            window.showFloatingAlert &&
                                                window.showFloatingAlert(
                                                    "Feedback submitted",
                                                    "success",
                                                    2000
                                                );
                                            try {
                                                loadFeedbackData(getMeta("project-id"));
                                            } catch (_) {}
                                            cleanup();
                                        })
                                        .catch((err) => {
                                            let msg = "Failed to submit feedback";
                                            if (err?.errors)
                                                msg = Object.values(err.errors).join("\n");
                                            else if (err?.message) msg = err.message;
                                            window.showFloatingAlert &&
                                                window.showFloatingAlert(msg, "warning", 4000);
                                        })
                                        .finally(() => {
                                            sendBtn.disabled = false;
                                            sendBtn.innerHTML = origText;
                                        });
                                } catch (_) {}
                            });
                        } catch (_) {}
                    }

    // Render task feedback files preview (similar to project feedback)
    function renderTaskFeedbackFilesPreview() {
        try {
            var preview = document.getElementById("task_feedback_files_preview");
            if (!preview) {
                // Create preview container if it doesn't exist
                var form = document.getElementById("addFeedbackForm");
                if (form) {
                    preview = document.createElement("div");
                    preview.id = "task_feedback_files_preview";
                    preview.className = "mt-2";
                    form.appendChild(preview);
                }
            }
            if (!preview) return;

            var sel = window.taskFeedbackSelectedFiles || [];
            preview.innerHTML = "";

            if (!sel.length) return;

            var listWrap = document.createElement("div");
            listWrap.className = "selected-files-list mt-2";

            sel.forEach(function (f, idx) {
                try {
                    var item = document.createElement("div");
                    item.className = "d-flex align-items-center gap-2 p-2 rounded bg-light selected-task mb-2";

                    var iconWrap = document.createElement("div");
                    var iconName = getFileTypeIcon(f.name || '');
                    iconWrap.innerHTML = '<span class="material-symbols-outlined">' + iconName + '</span>';
                    iconWrap.style.fontSize = "10px";
                    iconWrap.style.textAlign = "center";

                    var name = document.createElement("span");
                    name.className = "flex-grow-1";
                    name.style.fontSize = "10px";
                    var sizeMb = (f.size || 0) / 1024 / 1024;
                    name.textContent = (f.name || "") + (isFinite(sizeMb) ? " (" + sizeMb.toFixed(2) + " MB)" : "");

                    var rm = document.createElement("button");
                    rm.type = "button";
                    rm.className = "btn btn-sm btn-remove-task remove-task";
                    rm.style.lineHeight = "1";
                    rm.style.fontSize = "10px";
                    rm.innerHTML = '<span class="material-symbols-outlined">close</span>';
                    rm.addEventListener("click", function () {
                        try {
                            window.taskFeedbackSelectedFiles.splice(idx, 1);
                            renderTaskFeedbackFilesPreview();
                        } catch (_) {}
                    });

                    item.appendChild(iconWrap);
                    item.appendChild(name);
                    item.appendChild(rm);
                    listWrap.appendChild(item);
                } catch (_) {}
            });

            preview.appendChild(listWrap);
        } catch (e) {}
    }

    // Render task edit feedback files preview (similar to add feedback)
    function renderTaskEditFeedbackFilesPreview() {
        try {
            var preview = document.getElementById("task_edit_feedback_files_preview");
            if (!preview) return;

            var sel = window.taskEditFeedbackSelectedFiles || [];
            preview.innerHTML = "";

            if (!sel.length) return;

            var listWrap = document.createElement("div");
            listWrap.className = "selected-files-list mt-2";

            sel.forEach(function (f, idx) {
                try {
                    var item = document.createElement("div");
                    item.className = "d-flex align-items-center gap-2 p-2 rounded bg-light selected-task mb-2";

                    var iconWrap = document.createElement("div");
                    var iconName = getFileTypeIcon(f.name || '');
                    iconWrap.innerHTML = '<span class="material-symbols-outlined">' + iconName + '</span>';
                    iconWrap.style.fontSize = "10px";
                    iconWrap.style.textAlign = "center";

                    var name = document.createElement("span");
                    name.className = "flex-grow-1";
                    name.style.fontSize = "10px";
                    var sizeMb = (f.size || 0) / 1024 / 1024;
                    name.textContent = (f.name || "") + (isFinite(sizeMb) ? " (" + sizeMb.toFixed(2) + " MB)" : "");

                    var rm = document.createElement("button");
                    rm.type = "button";
                    rm.className = "btn btn-sm btn-remove-task remove-task";
                    rm.style.lineHeight = "1";
                    rm.style.fontSize = "10px";
                    rm.innerHTML = '<span class="material-symbols-outlined">close</span>';
                    rm.addEventListener("click", function () {
                        try {
                            window.taskEditFeedbackSelectedFiles.splice(idx, 1);
                            renderTaskEditFeedbackFilesPreview();
                        } catch (_) {}
                    });

                    item.appendChild(iconWrap);
                    item.appendChild(name);
                    item.appendChild(rm);
                    listWrap.appendChild(item);
                } catch (_) {}
            });

            preview.appendChild(listWrap);
        } catch (e) {}
    }

    // Helper function to get appropriate file type icon
    function getFileTypeIcon(fileName) {
        try {
            var ext = (fileName || '').toLowerCase().split('.').pop();
            switch (ext) {
                case 'pdf':
                    return 'picture_as_pdf';
                case 'doc':
                case 'docx':
                    return 'article';
                case 'xls':
                case 'xlsx':
                    return 'grid_on';
                case 'zip':
                case 'rar':
                case '7z':
                    return 'folder_zip';
                case 'jpg':
                case 'jpeg':
                case 'png':
                case 'gif':
                case 'webp':
                    return 'image';
                case 'mp4':
                case 'avi':
                case 'mov':
                    return 'movie';
                case 'mp3':
                case 'wav':
                case 'ogg':
                    return 'audio_file';
                case 'txt':
                    return 'text_snippet';
                case 'ppt':
                case 'pptx':
                    return 'slideshow';
                default:
                    return 'description';
            }
        } catch (_) {
            return 'description';
        }
    }

    // Helper function to add image preview from URL (for existing images)
    function addImagePreviewFromUrl(previewContainer, imageUrl, filename) {
        if (!imageUrl) return;

        const imagePreview = document.createElement('div');
        imagePreview.className = 'image-preview existing-image';
        imagePreview.innerHTML = `
            <img src="${imageUrl}" alt="${filename || 'Image'}" style="max-width: 200px; max-height: 150px; object-fit: cover;">
            <span class="filename">${filename || 'Existing Image'}</span>
        `;
        previewContainer.appendChild(imagePreview);
    }

    // Helper function to cleanup existing file previews
    function cleanupExistingFiles(container) {
        try {
            const existingPreviews = container.querySelectorAll('.existing-image, .existing-file');
            existingPreviews.forEach(preview => preview.remove());
        } catch (e) {}
    }

    // Initialize Quill editors for task feedback forms (similar to project feedback)
    function initTaskFeedbackQuillEditors(containerEl) {
        try {
            // helper to prevent image paste/drop
            function preventImageDropAndPaste(quill, selector) {
                try {
                    var editor = document.querySelector(selector);
                    if (!editor || !quill) return;
                    editor.addEventListener(
                        "dragover",
                        function (e) {
                            try {
                                e.preventDefault();
                            } catch (_) {}
                        },
                        true
                    );
                    editor.addEventListener(
                        "drop",
                        function (e) {
                            try {
                                if (!e.dataTransfer) return;
                                var hasFiles =
                                    e.dataTransfer.files &&
                                    e.dataTransfer.files.length > 0;
                                var html =
                                    (e.dataTransfer.getData &&
                                        e.dataTransfer.getData(
                                            "text/html"
                                        )) ||
                                    "";
                                if (hasFiles || /<img\s*/i.test(html)) {
                                    e.preventDefault();
                                    e.stopImmediatePropagation();
                                    return;
                                }
                            } catch (_) {}
                        },
                        true
                    );
                    editor.addEventListener(
                        "paste",
                        function (e) {
                            try {
                                var clipboard =
                                    e.clipboardData ||
                                    window.clipboardData;
                                if (!clipboard) return;
                                var items = clipboard.items || [];
                                for (var i = 0; i < items.length; i++) {
                                    var t = items[i].type || "";
                                    if (
                                        t.indexOf &&
                                        t.indexOf("image") === 0
                                    ) {
                                        e.preventDefault();
                                        e.stopImmediatePropagation();
                                        return;
                                    }
                                }
                                var html =
                                    (clipboard.getData &&
                                        clipboard.getData(
                                            "text/html"
                                        )) ||
                                    "";
                                if (/<img\s*/i.test(html)) {
                                    e.preventDefault();
                                    e.stopImmediatePropagation();
                                    return;
                                }
                            } catch (_) {}
                        },
                        true
                    );
                } catch (_) {}
            }

            // safe create quill if container exists and not already created
            function createQuillIfNeeded(
                editorSelector,
                toolbarSelector,
                globalName
            ) {
                try {
                    if (!document.querySelector(editorSelector))
                        return null;
                    if (window[globalName]) return window[globalName];
                    var q = new Quill(editorSelector, {
                        modules: {
                            toolbar: toolbarSelector,
                            clipboard: { matchVisual: false },
                        },
                        theme: "snow",
                    });
                    // remove any images inserted
                    try {
                        var Delta =
                            Quill.import && Quill.import("delta");
                        if (
                            q &&
                            q.clipboard &&
                            typeof q.clipboard.addMatcher === "function"
                        ) {
                            try {
                                q.clipboard.addMatcher(
                                    "IMG",
                                    function (node, delta) {
                                        try {
                                            return new Delta();
                                        } catch (_) {
                                            return delta;
                                        }
                                    }
                                );
                            } catch (_) {}
                        }
                    } catch (_) {}
                    try {
                        q.on &&
                            q.on("text-change", function () {
                                try {
                                    var imgs =
                                        q.root.querySelectorAll("img");
                                    imgs.forEach(function (i) {
                                        i.remove();
                                    });
                                } catch (_) {}
                            });
                    } catch (_) {}
                    try {
                        preventImageDropAndPaste(q, editorSelector);
                    } catch (_) {}
                    window[globalName] = q;
                    return q;
                } catch (e) {
                    return null;
                }
            }

            // initialize any editors present inside modal body
            try {
                createQuillIfNeeded(
                    "#task_feedback_editor",
                    "#task_feedback_toolbar",
                    "__quillTaskFeedbackAdd"
                );
                createQuillIfNeeded(
                    "#task_edit_feedback_editor",
                    "#task_edit_feedback_toolbar",
                    "__quillTaskFeedbackEdit"
                );
            } catch (_) {}
        } catch (_) {}
    }

    // Ensure Quill content is synced to hidden textarea before forms are submitted
    function syncAllTaskFeedbackQuills() {
        try {
            try {
                if (window.__quillTaskFeedbackAdd) {
                    var ta = document.querySelector(
                        "#addFeedbackForm #feedback_comment"
                    );
                    if (ta)
                        ta.value =
                            window.__quillTaskFeedbackAdd.root
                                .innerHTML || "";
                }
            } catch (_) {}
            try {
                if (window.__quillTaskFeedbackEdit) {
                    var ta3 = document.querySelector(
                        "#editFeedbackForm #feedback_comment"
                    );
                    if (ta3)
                        ta3.value =
                            window.__quillTaskFeedbackEdit.root
                                .innerHTML || "";
                }
            } catch (_) {}
        } catch (_) {}
    }

    // Hook capture-phase submit on modal to ensure sync between Quill and textarea
    try {
        document.addEventListener(
            "submit",
            function (ev) {
                try {
                    var form = ev.target || null;
                    if (!form) return;
                    if (
                        form.id === "addFeedbackForm" ||
                        form.id === "editFeedbackForm"
                    ) {
                        syncAllTaskFeedbackQuills(); // basic validation
                        try {
                            var tmp =
                                (
                                    form.querySelector(
                                        "#feedback_comment"
                                    ) || {}
                                ).value || "";
                            if (
                                !tmp ||
                                String(tmp)
                                    .replace(/<[^>]+>/g, "")
                                    .trim() === ""
                            ) {
                                ev.preventDefault();
                                if (typeof showFloatingAlert === 'function') {
                                    showFloatingAlert(
                                        "Feedback is required",
                                        "warning",
                                        3000
                                    );
                                }
                                return false;
                            }
                        } catch (_) {}
                    }
                } catch (_) {}
            },
            true
        );
    } catch (_) {}

    // Delegated handler: add/remove reference URL rows (match project feedback behavior)
    document.addEventListener("click", function (e) {
        try {
            var addBtn = e.target.closest(".add-ref-url");
            if (addBtn) {
                e.preventDefault && e.preventDefault();
                var container = addBtn.closest(
                    "#task_feedback_reference_urls_container, #feedback_reference_urls_container"
                );
                if (!container) return;
                var row = document.createElement("div");
                row.className = "input-group";
                row.innerHTML =
                    '<input type="url" class="form-control input-text" name="reference_urls[]" placeholder="https://example.com">' +
                    ' <button type="button" class="btn btn-remove-url remove-ref-url" aria-label="Remove URL"><span class="material-symbols-outlined">close</span></button>';
                container.appendChild(row);
                var input = row.querySelector('input[type="url"]');
                if (input)
                    try {
                        input.focus();
                    } catch (_) {}
                return;
            }
        } catch (_) {}

        try {
            var remBtn = e.target.closest(".remove-ref-url");
            if (remBtn) {
                e.preventDefault && e.preventDefault();
                var row = remBtn.closest(".input-group");
                if (row && row.parentNode) row.parentNode.removeChild(row);
                return;
            }
        } catch (_) {}
    });

    // Clean up Quill instances when task feedback modal is hidden to avoid stale instances
    try {
        var taskFeedbackModal = document.getElementById("taskFeedbackModal");
        if (taskFeedbackModal) {
            taskFeedbackModal.addEventListener("hidden.bs.modal", function () {
                try {
                    if (window.__quillTaskFeedbackAdd) {
                        window.__quillTaskFeedbackAdd = null;
                    }
                } catch (_) {}
                try {
                    if (window.__quillTaskFeedbackEdit) {
                        window.__quillTaskFeedbackEdit = null;
                    }
                } catch (_) {}
                try {
                    // Clear selected files arrays
                    window.taskFeedbackSelectedFiles = [];
                    window.taskEditFeedbackSelectedFiles = [];
                } catch (_) {}
                try {
                    // Clear image preview files
                    window.__taskFeedbackImageFile = null;
                } catch (_) {}
                try {
                    // Clear inline feedback variables
                    if (window.__quillTaskFeedbackInline) {
                        window.__quillTaskFeedbackInline = null;
                    }
                    window.inlineTaskFeedbackSelectedFiles = [];
                    window.__taskInlineFeedbackImageFile = null;
                    // Clear reply state when modal closes
                    clearReplyState();
                } catch (_) {}
            });
        }
    } catch (_) {}

    // Setup inline feedback editor in task modal footer (similar to project feedback)
    function setupTaskInlineFeedbackEditor(taskId) {
        try {
            const modal = document.getElementById('taskFeedbackModal');
            if (!modal) return;

            // Find modal footer
            let footer = modal.querySelector('.modal-footer') || modal.querySelector('.modal-footer-custom');
            if (!footer) return;

            // Replace footer content with inline feedback editor
            footer.innerHTML = `
                <div class="feedback-form w-100">
                <div id="inline_task_feedback_files_preview"></div>
                <div id="inline_existing_files_preview"></div>
                    <div id="inline_task_feedback_editor" class="border-0 ql-container ql-snow" style="min-height:40px; max-height:160px; overflow:auto; background:transparent; padding:8px 10px; border-radius:6px;">
                        <div class="ql-editor ql-blank" contenteditable="true" data-placeholder="Write feedback..."><p><br></p></div>
                    </div>

                    <textarea id="inline_task_feedback_comment" name="feedback_comment" class="d-none" style="display:none;"></textarea>
                    <input type="hidden" id="inline_edit_task_feedback_input" value="">
                    <input type="hidden" id="inline_parent_id_input" name="parent_id" value="">

                    <div class="d-flex justify-content-between btn-actions-feedback mt-2">
                        <div class="d-flex-justify-content-start">
                            <button type="button" class="btn btn-sm border-0" id="inlineTaskFeedbackPhotoBtn" title="Upload photo">
                                <span class="material-symbols-outlined feedback-photo-icon">photo</span>
                            </button>
                            <button type="button" class="btn btn-sm border-0" id="inlineTaskFeedbackFileBtn" title="Attach file">
                                <span class="material-symbols-outlined feedback-file-icon">attach_file</span>
                            </button>
                            <input type="file" id="inline_task_feedback_image_input" name="feedback_image" accept="image/*" class="d-none">
                            <input type="file" id="inline_task_feedback_files_input" name="reference_files[]" multiple="" accept="image/*,.csv,.pdf,.doc,.docx,.xls,.xlsx,.zip,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" class="d-none">
                        </div>
                        <div class="d-flex justify-content-end submit-feedback">
                            <button type="button" class="btn btn-submit-black" id="inlineTaskFeedbackSendBtn">
                                <span class="material-symbols-outlined">send</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;


            try { window.__quillTaskFeedbackInline = null; } catch(_) {}
            initTaskInlineFeedbackEditor(taskId);

            // Ensure placeholder toggling is attached for contenteditable fallback
            try {
                const editor = document.getElementById('inline_task_feedback_editor');
                if (editor) {
                    const editorRoot = editor.querySelector('.ql-editor');
                    if (editorRoot && !editorRoot.dataset.placeholderHandlerAttached) {
                        const togglePlaceholder = function () {
                            try {
                                const txt = (editorRoot.textContent || '').replace(/\uFEFF/g, '').trim();
                                if (txt.length > 0) {
                                    editorRoot.classList.remove('ql-blank');
                                } else {
                                    if (!editorRoot.classList.contains('ql-blank')) editorRoot.classList.add('ql-blank');
                                }
                            } catch (_) {}
                        };
                        editorRoot.addEventListener('input', togglePlaceholder);
                        editorRoot.addEventListener('keydown', function () { setTimeout(togglePlaceholder, 0); });
                        // Mark as attached so we don't double-bind
                        editorRoot.dataset.placeholderHandlerAttached = '1';
                    }
                }
            } catch(_) {}

        } catch (e) {
            console.warn('Failed to setup inline task feedback editor:', e);
        }
    }

    // Enter inline EDIT mode for task feedback (similar to project feedback)
    window.startInlineTaskEditFeedback = function(data) {
        try {
            const hiddenInput = document.getElementById("inline_edit_task_feedback_input");
            if (hiddenInput) hiddenInput.value = data.id || "";

            // Set parent_id for replies
            try {
                const inlinePid = document.getElementById('inline_parent_id_input');
                if (inlinePid) inlinePid.value = data.parent_id || '';
            } catch(_) {}

            // Ensure inline editor exists; initialize if not
            try {
                if (!window.__quillTaskFeedbackInline) {
                    // Attempt to create it synchronously
                    initTaskInlineFeedbackEditor((document.getElementById('taskFeedbackModal')||{}).dataset?.taskId || '');
                }
            } catch(_) {}

            // Fill editor with existing content (guarded)
            try {
                if (window.__quillTaskFeedbackInline && window.__quillTaskFeedbackInline.root) {
                    // Use setTimeout(0) to ensure DOM is painted and Quill has attached
                    setTimeout(function(){
                        try { window.__quillTaskFeedbackInline.root.innerHTML = data.feedback_comment || ""; } catch(_) {}
                        try {
                            if (typeof window.__quillTaskFeedbackInline.setSelection === 'function') {
                                try { window.__quillTaskFeedbackInline.setSelection(0, 0); } catch(_) {}
                            }
                        } catch(_) {}
                    }, 0);
                }
            } catch(_) {}

            // Show existing image if available
            try {
                const rawImg = data.image_url || data.image || "";
                if (rawImg) {
                    let url = rawImg;
                    if (url.indexOf('http') !== 0) {
                        url = (url.indexOf('/') === 0) ? appUrl.replace(/\/$/, "") + url : appUrl.replace(/\/$/, "") + "/file/task_feedback/" + url;
                    }
                    showTaskInlineImagePreviewFromUrl(url);
                }
            } catch(_) {}

            // Show existing files if available
            try {
                let files = [];
                if (Array.isArray(data.reference_files_urls)) {
                    files = data.reference_files_urls;
                } else if (Array.isArray(data.reference_files)) {
                    files = data.reference_files;
                } else if (data.reference_file_url) {
                    files = [data.reference_file_url];
                } else if (data.reference_file) {
                    files = [data.reference_file];
                }
                renderInlineTaskExistingFiles(files);
            } catch(_) {}

            // Change Send button to Update
            const sendBtn = document.getElementById("inlineTaskFeedbackSendBtn");
            if (sendBtn) {
                sendBtn._origHTML = sendBtn._origHTML || sendBtn.innerHTML;
                try {
                    sendBtn.innerHTML = `
                        <span class="material-symbols-outlined" style="font-size:18px;vertical-align:middle;">send</span>
                    `;
                } catch(_) {
                    sendBtn.textContent = 'Update';
                }
            }

            // Add Cancel button
            const actions = document.querySelector('.btn-actions-feedback .submit-feedback');
            if (actions && !document.getElementById('inlineTaskFeedbackCancelBtn')) {
                const cancel = document.createElement('button');
                cancel.type = 'button';
                cancel.id = 'inlineTaskFeedbackCancelBtn';
                cancel.className = 'btn btn-custom-close me-2 d-flex align-items-center gap-1';
                cancel.innerHTML = '<span class="material-symbols-outlined" style="font-size:18px;vertical-align:middle;">cancel</span>';
                cancel.addEventListener('click', function() {
                    try {
                        window.cancelInlineTaskEditFeedback();
                    } catch(_) {}
                });
                actions.insertBefore(cancel, actions.firstChild);
            }
        } catch(_) {}
    };

    // Exit inline EDIT mode for task feedback
    window.cancelInlineTaskEditFeedback = function() {
        try {
            // Clear edit marker
            const hiddenInput = document.getElementById('inline_edit_task_feedback_input');
            if (hiddenInput) hiddenInput.value = '';

            // Clear parent_id
            const inlinePid = document.getElementById('inline_parent_id_input');
            if (inlinePid) inlinePid.value = '';

            // Clear existing files keep list and remove preview
            window.inlineTaskExistingFilesKeep = [];
            try {
                const existingPreview = document.getElementById('inline_existing_files_preview');
                if (existingPreview && existingPreview.parentNode) {
                    existingPreview.parentNode.removeChild(existingPreview);
                }
            } catch(_) {}

            // Remove image preview and clear stored image file
            try {
                const imagePreview = document.getElementById('inline_task_feedback_image_preview');
                if (imagePreview && imagePreview.parentNode) {
                    imagePreview.parentNode.removeChild(imagePreview);
                }
            } catch(_) {}
            window.__taskInlineFeedbackImageFile = null;

            // Clear native file inputs
            try {
                const imgInput = document.getElementById('inline_task_feedback_image_input');
                if (imgInput) imgInput.value = '';
            } catch(_) {}
            try {
                const filesInput = document.getElementById('inline_task_feedback_files_input');
                if (filesInput) filesInput.value = '';
            } catch(_) {}

            // Clear selected files array and file previews
            try {
                window.inlineTaskFeedbackSelectedFiles = [];
                renderInlineTaskFeedbackFilesPreview();
            } catch(_) {}

            // Clear Quill editor
            try {
                if (window.__quillTaskFeedbackInline && window.__quillTaskFeedbackInline.root) {
                    window.__quillTaskFeedbackInline.root.innerHTML = '';
                    if (typeof window.__quillTaskFeedbackInline.setSelection === 'function') {
                        try {
                            window.__quillTaskFeedbackInline.setSelection(0);
                        } catch(_) {}
                    }
                }
            } catch(_) {}

            // Clear fallback textarea
            try {
                const textarea = document.getElementById('inline_task_feedback_comment');
                if (textarea) textarea.value = '';
            } catch(_) {}

            // Restore send button text
            try {
                const sendBtn = document.getElementById('inlineTaskFeedbackSendBtn');
                if (sendBtn) {
                    if (sendBtn._origHTML) {
                        try {
                            sendBtn.innerHTML = sendBtn._origHTML;
                        } catch(_) {
                            sendBtn.textContent = sendBtn._origHTML;
                        }
                    } else {
                        try {
                            sendBtn.innerHTML = '<span class="material-symbols-outlined">send</span>';
                        } catch(_) {
                            sendBtn.textContent = 'Send';
                        }
                    }
                }
            } catch(_) {}

            // Remove cancel button
            try {
                const cancelBtn = document.getElementById('inlineTaskFeedbackCancelBtn');
                if (cancelBtn && cancelBtn.parentNode) {
                    cancelBtn.parentNode.removeChild(cancelBtn);
                }
            } catch(_) {}

            // Reset remove-image flag
            window.__inlineTaskRemoveImage = false;
        } catch(_) {}
    };

    // Show inline image preview from URL for existing image
    window.showTaskInlineImagePreviewFromUrl = function(imageUrl) {
        try {
            // Create preview container if not exists
            let previewContainer = document.getElementById("inline_task_feedback_image_preview");
            if (!previewContainer) {
                previewContainer = document.createElement("div");
                previewContainer.id = "inline_task_feedback_image_preview";
                previewContainer.style.cssText = "display: inline-flex; align-items: center; margin-left: 8px; opacity: 1; background: transparent;";

                const fileBtn = document.getElementById("inlineTaskFeedbackFileBtn");
                if (fileBtn && fileBtn.parentNode) {
                    fileBtn.parentNode.insertBefore(previewContainer, fileBtn.nextSibling);
                }
            }

            previewContainer.innerHTML = "";

            const imageLabel = document.createElement("div");
            imageLabel.className = "custom-image-upload position-relative";
            imageLabel.style.cssText =
                "width: 32px; height: 32px; " +
                "background-image: url('" + imageUrl + "'); " +
                "background-size: cover; background-position: center center; background-repeat: no-repeat; " +
                "border-radius: 6px; cursor: pointer; border: 1px solid #ddd; margin-right: 4px; " +
                "opacity: 1; background-color: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.12); overflow: visible;";

            const clearBtn = document.createElement("span");
            clearBtn.className = "image-clear-btn";
            clearBtn.innerHTML = "&times;";
            clearBtn.title = "Remove image";
            clearBtn.style.cssText =
                "position: absolute; top: -6px; right: -6px; background: #ff4444; color: #ffffff; " +
                "border-radius: 50%; width: 16px; height: 16px; font-size: 12px; line-height: 16px; " +
                "text-align: center; cursor: pointer; font-weight: 700; border: none; " +
                "box-shadow: 0 2px 6px rgba(0,0,0,0.25); z-index: 30; opacity: 1;";

            clearBtn.addEventListener("click", function(e) {
                e.preventDefault();
                e.stopPropagation();
                try {
                    // Set remove flag for existing image
                    window.__inlineTaskRemoveImage = true;
                    // Clear any new image input
                    const inp = document.getElementById("inline_task_feedback_image_input");
                    if (inp) inp.value = "";
                    // Clear stored new image
                    window.__taskInlineFeedbackImageFile = null;
                    // Remove preview
                    if (previewContainer && previewContainer.parentNode) {
                        previewContainer.parentNode.removeChild(previewContainer);
                    }
                } catch(_) {}
            });

            imageLabel.appendChild(clearBtn);
            previewContainer.appendChild(imageLabel);
        } catch(e) {
            console.warn("Failed to show inline image preview from URL:", e);
        }
    };

    // Render existing files for inline edit mode
    window.renderInlineTaskExistingFiles = function(files) {
        try {
            const container = document.getElementById('inline_existing_files_preview');
            let existingContainer = container;

            if (!existingContainer) {
                existingContainer = document.createElement('div');
                existingContainer.id = 'inline_existing_files_preview';
                existingContainer.className = 'mb-2';

                // Insert before the editor
                const editor = document.getElementById('inline_task_feedback_editor');
                if (editor && editor.parentNode) {
                    editor.parentNode.insertBefore(existingContainer, editor);
                }
            }

            existingContainer.innerHTML = '';

            if (!Array.isArray(files) || files.length === 0) return;

            // Initialize keep list
            if (!window.inlineTaskExistingFilesKeep) {
                window.inlineTaskExistingFilesKeep = files.slice();
            }

            files.forEach(function(fileUrl, idx) {
                if (!fileUrl) return;

                const item = document.createElement('div');
                item.className = 'existing-file-item d-flex align-items-center justify-content-between mb-1 p-2 bg-transparent border-0 rounded';

                const info = document.createElement('div');
                info.className = 'd-flex align-items-center flex-grow-1';

                const icon = document.createElement('span');
                icon.className = 'material-symbols-outlined me-2';
                icon.textContent = 'description';
                icon.style.fontSize = '16px';

                const link = document.createElement('a');
                link.href = fileUrl;
                link.target = '_blank';
                link.style.textDecoration = 'none';
                link.style.color = '#444';

                const fileName = (function() {
                    try {
                        const url = new URL(fileUrl, window.location.origin);
                        return decodeURIComponent(url.pathname.split('/').pop());
                    } catch(e) {
                        const parts = String(fileUrl).split('/');
                        return decodeURIComponent(parts[parts.length - 1] || String(fileUrl));
                    }
                })();
                link.textContent = fileName;

                const removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.className = 'btn btn-sm ms-2';
                removeBtn.innerHTML = '<span class="material-symbols-outlined">close</span>';
                removeBtn.title = 'Remove file';
                removeBtn.addEventListener('click', function() {
                    // Remove from keep list
                    const keepList = window.inlineTaskExistingFilesKeep || [];
                    const indexInKeep = keepList.indexOf(fileUrl);
                    if (indexInKeep !== -1) {
                        keepList.splice(indexInKeep, 1);
                    }
                    // Remove from DOM
                    item.remove();
                });

                info.appendChild(icon);
                info.appendChild(link);
                item.appendChild(info);
                item.appendChild(removeBtn);
                existingContainer.appendChild(item);
            });
        } catch(e) {
            console.warn('Failed to render existing files:', e);
        }
    };

    // Initialize inline Quill editor for task feedback
    function initTaskInlineFeedbackEditor(taskId) {
        try {
            if (typeof Quill === "undefined") return;
            if (window.__quillTaskFeedbackInline) return window.__quillTaskFeedbackInline;

            const editorEl = document.getElementById("inline_task_feedback_editor");
            if (!editorEl) return null;

            // Create Quill with minimal toolbar (no visible toolbar)
            const q = new Quill("#inline_task_feedback_editor", {
                modules: {
                    toolbar: false, // No toolbar for inline editor
                    clipboard: { matchVisual: false },
                },
                theme: "snow",
                placeholder: "Write feedback...",
            });

            // Remove images if pasted
            try {
                const Delta = Quill.import && Quill.import("delta");
                if (q && q.clipboard && typeof q.clipboard.addMatcher === "function") {
                    q.clipboard.addMatcher("IMG", function (node, delta) {
                        try {
                            return new Delta();
                        } catch (_) {
                            return delta;
                        }
                    });
                }
            } catch (_) {}

            try {
                q.on && q.on("text-change", function () {
                    try {
                        const imgs = q.root.querySelectorAll("img");
                        imgs.forEach(function (i) {
                            i.remove();
                        });
                    } catch (_) {}

                    // Toggle placeholder state immediately when user types or removes content.
                    try {
                        const plain = (typeof q.getText === 'function') ? (q.getText() || '').trim() : (q.root.textContent || '').replace(/\s+/g, '').trim();
                        if (plain && String(plain).length > 0) {
                            q.root.classList.remove('ql-blank');
                        } else {
                            if (!q.root.classList.contains('ql-blank')) q.root.classList.add('ql-blank');
                        }
                    } catch (_) {}
                });
            } catch (_) {}

            window.__quillTaskFeedbackInline = q;

            // Ensure contenteditable root toggles placeholder on native input as well
            try {
                const editorRoot = editorEl.querySelector('.ql-editor');
                if (editorRoot) {
                    const togglePlaceholder = function () {
                        try {
                            const txt = (editorRoot.textContent || '').replace(/\uFEFF/g, '').trim();
                            if (txt.length > 0) {
                                editorRoot.classList.remove('ql-blank');
                            } else {
                                if (!editorRoot.classList.contains('ql-blank')) editorRoot.classList.add('ql-blank');
                            }
                        } catch (_) {}
                    };
                    editorRoot.addEventListener('input', togglePlaceholder);
                    editorRoot.addEventListener('keydown', function () { setTimeout(togglePlaceholder, 0); });
                }
            } catch (_) {}

            // Initialize selected files array
            if (!window.inlineTaskFeedbackSelectedFiles) {
                window.inlineTaskFeedbackSelectedFiles = [];
            }

            // Setup button handlers
            setupInlineTaskFeedbackButtons(taskId, q);

            return q;
        } catch (e) {
            console.warn('Failed to init inline task feedback editor:', e);
            return null;
        }
    }

    // Setup button handlers for inline task feedback editor
    function setupInlineTaskFeedbackButtons(taskId, quill) {
        try {
            const photoBtn = document.getElementById('inlineTaskFeedbackPhotoBtn');
            const fileBtn = document.getElementById('inlineTaskFeedbackFileBtn');
            const sendBtn = document.getElementById('inlineTaskFeedbackSendBtn');
            const imageInput = document.getElementById('inline_task_feedback_image_input');
            const filesInput = document.getElementById('inline_task_feedback_files_input');
            const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

            // Photo button handler
            if (photoBtn && imageInput) {
                photoBtn.addEventListener('click', function() {
                    imageInput.click();
                });
            }

            // File button handler
            if (fileBtn && filesInput) {
                fileBtn.addEventListener('click', function() {
                    filesInput.click();
                });
            }

            // Image input handler
            if (imageInput) {
                imageInput.addEventListener('change', function() {
                    const file = this.files && this.files[0];
                    if (!file) return;

                    // Size validation
                    if (file.size > MAX_IMAGE_BYTES) {
                        if (typeof showFloatingAlert === 'function') {
                            showFloatingAlert('Image must be smaller than 10 MB.', 'warning');
                        }
                        this.value = '';
                        return;
                    }

                    // Create preview
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        showTaskInlineImagePreviewSmall(file, e.target.result);
                    };
                    reader.readAsDataURL(file);
                });
            }

            // Files input handler
            if (filesInput) {
                filesInput.addEventListener('change', function() {
                    const files = Array.from(this.files || []);
                    if (!files.length) return;

                    // Add to selection
                    if (!window.inlineTaskFeedbackSelectedFiles) window.inlineTaskFeedbackSelectedFiles = [];
                    window.inlineTaskFeedbackSelectedFiles = [...window.inlineTaskFeedbackSelectedFiles, ...files];

                    // Render preview
                    renderInlineTaskFeedbackFilesPreview();
                    this.value = '';
                });
            }

            // Send button handler
            if (sendBtn && quill) {
                sendBtn.addEventListener('click', function() {
                    submitInlineTaskFeedback(taskId, quill);
                });
            }

        } catch (e) {
            console.warn('Failed to setup inline task feedback buttons:', e);
        }
    }

    // Submit inline task feedback
    function submitInlineTaskFeedback(taskId, quill) {
        const appUrl = (function(){
            try {
                const meta = document.querySelector('meta[name="app-url"]');
                let v = (meta && meta.getAttribute('content')) || '';
                if (v) {
                    v = new URL(v, window.location.origin).href.replace(/\/+$/, '');
                    return v;
                }
                const parts = (window.location.pathname || '').split('/').filter(Boolean);
                const baseSeg = parts.length > 0 ? ('/' + parts[0]) : '';
                return (window.location.origin + baseSeg).replace(/\/+$/, '');
            } catch(_) {
                return (window.location.origin || '').replace(/\/+$/, '');
            }
        })();

        try {
            const html = quill.root.innerHTML || '';
            let hasImage = false, hasRefFiles = false;

            try {
                if (window.__taskInlineFeedbackImageFile) hasImage = true;
                else {
                    const pi = document.getElementById("inline_task_feedback_image_input");
                    if (pi && pi.files && pi.files.length) hasImage = true;
                }
            } catch(_) {}

            try {
                if (window.inlineTaskFeedbackSelectedFiles && window.inlineTaskFeedbackSelectedFiles.length) hasRefFiles = true;
                else {
                    const fi = document.getElementById("inline_task_feedback_files_input");
                    if (fi && fi.files && fi.files.length) hasRefFiles = true;
                }
            } catch(_) {}

            const plainText = String(html || '').replace(/<[^>]+>/g, '').trim();
            if (!plainText && !hasImage && !hasRefFiles) {
                if (typeof showFloatingAlert === 'function')
                    showFloatingAlert('Please write feedback or attach a file', 'warning');
                return;
            }

            const feedbackModalEl = document.getElementById('taskFeedbackModal');
            const employeeId = feedbackModalEl?.getAttribute('data-employee-id') || '';

            const fd = new FormData();
            fd.append('feedback_comment', html);
            fd.append('task_id', taskId);
            fd.append('employee_id', employeeId);

            try {
                const pid = document.getElementById('inline_parent_id_input');
                if (pid && pid.value) fd.append('parent_id', pid.value);
            } catch(_) {}

            const imageFile = window.__taskInlineFeedbackImageFile;
            if (imageFile) fd.append('feedback_image', imageFile);

            const selectedFiles = window.inlineTaskFeedbackSelectedFiles || [];
            selectedFiles.forEach(f => fd.append('reference_files[]', f));

            const editId = (document.getElementById('inline_edit_task_feedback_input') || {}).value || '';
            const isEdit = String(editId).trim() !== '';
            if (isEdit) {
                try {
                    const keepList = window.inlineTaskExistingFilesKeep || [];
                    fd.set('existing_reference_files', JSON.stringify(keepList));
                } catch(_) {}
                try {
                    if (typeof window.__inlineTaskRemoveImage !== 'undefined') {
                        fd.set('remove_image', window.__inlineTaskRemoveImage ? '1' : '0');
                    }
                } catch(_) {}
                fd.append('_method', 'PUT');
            }

            const sendBtn = $("#inlineTaskFeedbackSendBtn");
            const origText = sendBtn.html();
            sendBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin me-1"></i>' + (isEdit ? 'Updating...' : 'Sending...'));

            $.ajax({
                url: isEdit ? appUrl + '/task-feedbacks/' + editId : appUrl + '/task-feedbacks',
                type: 'POST',
                data: fd,
                processData: false,
                contentType: false,
                headers: {
                    "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr('content')
                },
                success: function (res) {
                    const msg = (res && res.message) || (isEdit ? 'Feedback updated successfully!' : 'Feedback submitted successfully!');
                    if (typeof showFloatingAlert === 'function') showFloatingAlert(msg, 'light', 2000);

                    // Reset editor dan file
                    quill.root.innerHTML = '';
                    window.inlineTaskFeedbackSelectedFiles = [];
                    window.__taskInlineFeedbackImageFile = null;

                    $('#inline_task_feedback_image_preview, #inline_task_feedback_files_preview, #inline_existing_files_preview').empty();

                    // Clear reply state
                    clearReplyState();

                    if (isEdit && typeof window.cancelInlineTaskEditFeedback === 'function') {
                        window.cancelInlineTaskEditFeedback();
                    }

                    setTimeout(() => {
                        try {
                            loadTaskFeedbackData(taskId + '?t=' + Date.now());
                        } catch (e) {
                            console.warn('Failed to reload feedback list', e);
                        }
                    }, 300);
                },
                error: function (xhr) {
                    let msg = isEdit ? "Failed to update feedback" : "Failed to submit feedback";
                    if (xhr.responseJSON && xhr.responseJSON.errors) {
                        msg = Object.values(xhr.responseJSON.errors).flat().join("\n");
                    } else if (xhr.responseJSON && xhr.responseJSON.message) {
                        msg = xhr.responseJSON.message;
                    }
                    if (typeof showFloatingAlert === 'function')
                        showFloatingAlert(msg, "danger", 4000);
                    else alert(msg);
                },
                complete: function () {
                    sendBtn.prop('disabled', false).html(origText);
                }
            });

        } catch (e) {
            console.warn('Failed to submit inline task feedback:', e);
            if (typeof showFloatingAlert === 'function')
                showFloatingAlert("Failed to submit feedback", "warning");
        }
    }

    // Show inline task feedback image preview
    function showTaskInlineImagePreviewSmall(fileObj, dataUrl) {
        try {
            // Create or get the preview container
            let previewContainer = document.getElementById("inline_task_feedback_image_preview");
            if (!previewContainer) {
                previewContainer = document.createElement("div");
                previewContainer.id = "inline_task_feedback_image_preview";
                previewContainer.style.cssText = "display: inline-flex; align-items: center; margin-left: 8px; opacity: 1; background: transparent;";

                // Insert after the file button
                const fileBtn = document.getElementById("inlineTaskFeedbackFileBtn");
                if (fileBtn && fileBtn.parentNode) {
                    fileBtn.parentNode.insertBefore(previewContainer, fileBtn.nextSibling);
                }
            }

            // Create the image preview
            previewContainer.innerHTML = "";

            const imageLabel = document.createElement("div");
            imageLabel.className = "custom-image-upload position-relative";
            imageLabel.style.cssText =
                "width: 32px; height: 32px; " +
                "background-image: url('" + dataUrl + "'); " +
                "background-size: cover; background-position: center center; background-repeat: no-repeat; " +
                "border-radius: 6px; cursor: pointer; border: 1px solid #ddd; margin-right: 4px; " +
                "opacity: 1; background-color: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.12); overflow: visible;";

            const clearBtn = document.createElement("span");
            clearBtn.className = "image-clear-btn";
            clearBtn.innerHTML = "&times;";
            clearBtn.title = "Remove image";
            clearBtn.style.cssText =
                "position: absolute; top: -6px; right: -6px; background: #ff4444; color: #ffffff; " +
                "border-radius: 50%; width: 16px; height: 16px; font-size: 12px; line-height: 16px; " +
                "text-align: center; cursor: pointer; font-weight: 700; border: none; " +
                "box-shadow: 0 2px 6px rgba(0,0,0,0.25); z-index: 30; opacity: 1;";

            // Store the file object for later use
            window.__taskInlineFeedbackImageFile = fileObj;

            clearBtn.addEventListener("click", function (e) {
                e.preventDefault();
                e.stopPropagation();
                try {
                    const inp = document.getElementById("inline_task_feedback_image_input");
                    if (inp) inp.value = "";
                    window.__taskInlineFeedbackImageFile = null;
                    if (previewContainer && previewContainer.parentNode) {
                        previewContainer.parentNode.removeChild(previewContainer);
                    }
                } catch (_) {}
            });

            imageLabel.appendChild(clearBtn);
            previewContainer.appendChild(imageLabel);
        } catch (e) {
            console.warn("Failed to show inline task image preview:", e);
        }
    }

    // Render inline task feedback files preview
    function renderInlineTaskFeedbackFilesPreview() {
        try {
            let preview = document.getElementById("inline_task_feedback_files_preview");
            if (!preview) {
                // Create preview container if it doesn't exist
                const form = document.querySelector(".feedback-form");
                if (form) {
                    preview = document.createElement("div");
                    preview.id = "inline_task_feedback_files_preview";
                    preview.className = "mt-2";
                    form.appendChild(preview);
                }
            }
            if (!preview) return;

            const sel = window.inlineTaskFeedbackSelectedFiles || [];
            preview.innerHTML = "";

            if (!sel.length) return;

            const listWrap = document.createElement("div");
            listWrap.className = "selected-files-list mt-2";

            sel.forEach(function (f, idx) {
                try {
                    const item = document.createElement("div");
                    item.className = "d-flex align-items-center gap-2 p-2 rounded bg-light selected-task mb-2";

                    const iconWrap = document.createElement("div");
                    const iconName = getFileTypeIcon(f.name || '');
                    iconWrap.innerHTML = '<span class="material-symbols-outlined">' + iconName + '</span>';
                    iconWrap.style.fontSize = "10px";
                    iconWrap.style.textAlign = "center";

                    const name = document.createElement("span");
                    name.className = "flex-grow-1";
                    name.style.fontSize = "10px";
                    const sizeMb = (f.size || 0) / 1024 / 1024;
                    name.textContent = (f.name || "") + (isFinite(sizeMb) ? " (" + sizeMb.toFixed(2) + " MB)" : "");

                    const rm = document.createElement("button");
                    rm.type = "button";
                    rm.className = "btn btn-sm btn-remove-task remove-task";
                    rm.style.lineHeight = "1";
                    rm.style.fontSize = "10px";
                    rm.innerHTML = '<span class="material-symbols-outlined">close</span>';
                    rm.addEventListener("click", function () {
                        try {
                            window.inlineTaskFeedbackSelectedFiles.splice(idx, 1);
                            renderInlineTaskFeedbackFilesPreview();
                        } catch (_) {}
                    });

                    item.appendChild(iconWrap);
                    item.appendChild(name);
                    item.appendChild(rm);
                    listWrap.appendChild(item);
                } catch (_) {}
            });

            preview.appendChild(listWrap);
        } catch (e) {}
    }
});