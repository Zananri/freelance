$(document).ready(function() {

    // === Global Avatar Utilities (office scope) ===
    (function(){
        const appUrlMeta = document.querySelector('meta[name="app-url"]');
        const APP_URL = appUrlMeta ? appUrlMeta.getAttribute('content').replace(/\/$/,'') : '';

        function resolveAvatarPath(raw){
            if(!raw) return null;
            if(/^https?:\/\//i.test(raw)) return raw; // absolute already
            return APP_URL + '/' + raw.replace(/^\//,'');
        }
        window.pickEmployeeAvatar = function(obj){
            if(!obj) return null;
            return obj.profile_picture || obj.photo || obj.user_photo || null;
        };
        window.buildEmployeeAvatarUrl = function(obj){
            const chosen = window.pickEmployeeAvatar(obj);
            const url = resolveAvatarPath(chosen);
            return url || (APP_URL + '/asset/img/avatar.png');
        };

        // Auto-upgrade any existing img[data-global-avatar] without src or with legacy avatar.png 404 pattern
        document.addEventListener('DOMContentLoaded', function(){
            document.querySelectorAll('img[data-global-avatar]').forEach(function(img){
                if(!img.getAttribute('data-default')){
                    img.setAttribute('data-default', APP_URL + '/asset/img/avatar.png');
                }
            });
        });

        // Listener (reinforced) for profilePictureUpdated to ensure any late-loaded avatars update
        window.addEventListener('profilePictureUpdated', function(e){
            const newUrl = e.detail && e.detail.url;
            document.querySelectorAll('img[data-global-avatar]').forEach(function(img){
                const fallback = img.getAttribute('data-default') || (APP_URL + '/asset/img/avatar.png');
                if(newUrl){
                    img.src = newUrl.indexOf('?t=') !== -1 ? newUrl : (newUrl + '?t=' + Date.now());
                } else {
                    img.src = fallback + '?t=' + Date.now();
                }
            });
        });
    })();

    // === Notification Helper Functions ===
    
    // Helper function to check if notification should show "Read" label
    function shouldShowReadLabel(notificationId) {
        const notificationElement = $(`[data-notification-id="${notificationId}"]`);
        
        // Check if red dot (unread indicator) is still visible
        // Periksa apakah notification-unread-dot masih ada
        const hasRedDot = notificationElement.find('.notification-unread-dot').length > 0;
        
        // Check badge count and visibility
        const badge = $('#notificationBadge');
        const badgeCount = parseInt(badge.text()) || 0;
        const isBadgeHidden = badge.is(':hidden') || badge.css('display') === 'none';
        
        // PENTING: Label "Read" HANYA muncul jika:
        // 1. notification-unread-dot sudah hilang DAN
        // 2. badge count sudah 0 ATAU badge sudah disembunyikan
        // Jangan tampilkan "Read" jika notification-unread-dot masih ada atau badge count masih > 0
        return !hasRedDot && (badgeCount === 0 || isBadgeHidden);
    }
    
    // Helper function to update notification read status with conditional "Read" label
    function updateNotificationReadStatus(notificationId) {
        const notificationElement = $(`[data-notification-id="${notificationId}"]`);
        
        // Always create "Read" label with hidden attribute first
        notificationElement.find('.notification-actions').html('<div class="notification-read-label" hidden="">Read</div>');
        
        // Always remove the red dot first
        notificationElement.find('.notification-unread-dot').remove();
        
        // Wait a moment to ensure DOM is updated, then check if we should show the "Read" label
        setTimeout(function() {
            // Check if red dot is really gone
            const stillHasRedDot = notificationElement.find('.notification-unread-dot').length > 0;
            
            if (!stillHasRedDot) {
                // Remove hidden attribute to show "Read" label only when red dot is gone
                notificationElement.find('.notification-read-label').removeAttr('hidden');
            }
            // If red dot still exists, "Read" label stays hidden
        }, 200); // Short delay to ensure red dot removal is processed
    }

     function toggleSidebar() {
        $('body').toggleClass('hide-sidebar');

        // Save state to localStorage
        const isHidden = $('body').hasClass('hide-sidebar');
        localStorage.setItem('sidebarHidden', isHidden);

        if (isHidden == true) {
            document.documentElement.setAttribute('data-sidebar', 'hide-sidebar');
        }else{
            document.documentElement.setAttribute('data-sidebar', isHidden);
        }
        // If the task tree script exposed a recalc helper, call it so connectors redraw immediately
        try {
            if (typeof window.__taskTreeScheduleRecalc === 'function') {
                // small debounce delay to allow layout transition to settle
                window.__taskTreeScheduleRecalc(60);
            }
        } catch (e) {
            // ignore
        }
    }

    // Load saved state on page load
    const savedState = localStorage.getItem('sidebarHidden');
    const windowWidth = window.innerWidth;

    if (savedState === 'true' && windowWidth > 570) {
        $('body').addClass('hide-sidebar');
        // Ensure task tree recalculates after restoring saved sidebar state
        try {
            if (typeof window.__taskTreeScheduleRecalc === 'function') window.__taskTreeScheduleRecalc(60);
        } catch (e) {}
    }

    // Event listener for menu button
    $(document).on('click', '#sidebar-control', function(e) {
        e.preventDefault();
        toggleSidebar();
    });

    // Notification functionality
    function fetchNotificationCount() {
        const appUrl = (document.querySelector('meta[name=\"app-url\"]')?.getAttribute('content') || '').replace(/\/$/, '');
        $.ajax({
            url: appUrl + "/notifications/count",
            type: "GET",
            success: function(response) {
                const count = response.count;
                if (count > 0) {
                    $('#notificationCount').text(count);
                    $('#notificationBadge').show();
                } else {
                    $('#notificationBadge').hide();
                }
            },
            error: function() {
                console.error('Failed to fetch notification count');
            }
        });
    }

    // Cache for latest fetched notifications with acceptance status
    let __notificationsCache = [];
    
    // Track user interaction with notification dropdown
    let __dropdownWasOpenedByUser = false;
    // Track in-flight mark-as-read operations triggered on dropdown close
    let __pendingMarkReadPromise = null;

    function fetchNotifications() {
        console.log('Fetching notifications...');
        const appUrl = (document.querySelector('meta[name=\"app-url\"]')?.getAttribute('content') || '').replace(/\/$/, '');
        $.ajax({
            url: appUrl + "/notifications",
            type: "GET",
            success: function(response) {
                console.log('Notifications fetched:', response);
                const notifications = response.data;
                const notificationList = $('#notificationList');

                if (notifications.length === 0) {
                    notificationList.html(`
                        <div class="empty-notifications">
                            <span class="material-symbols-outlined d-block mb-2" style="font-size: 48px; color: #dee2e6;">notifications_none</span>
                            <p class="mb-0">No new notifications</p>
                        </div>
                    `);
                    return;
                }

        // Check task and project acceptance status for each notification
        checkTaskAcceptanceStatus(notifications).then(notificationsWithTaskStatus => {
            return checkProjectAcceptanceStatus(notificationsWithTaskStatus);
        }).then(notificationsWithStatus => {
            // Filter out task assignment notifications that are no longer assigned (e.g., after reject)
            const filteredNotifications = (notificationsWithStatus || []).filter(function(n){
                try {
                    if (n && n.type === 'task_assignment' && typeof n.is_assigned !== 'undefined') {
                        // Keep only still-assigned task invites; hide when unassigned (rejected)
                        return !!n.is_assigned;
                    }
                } catch(_) {}
                return true;
            });

            // Cache for bulk operations (post-filter)
            __notificationsCache = filteredNotifications || [];

            // Render empty state when none left after filtering
            if (!filteredNotifications || filteredNotifications.length === 0) {
                $('#notificationList').html(`
                        <div class="empty-notifications">
                            <span class="material-symbols-outlined d-block mb-2" style="font-size: 48px; color: #dee2e6;">notifications_none</span>
                            <p class="mb-0">No new notifications</p>
                        </div>
                    `);
                return;
            }

            let html = '';
                filteredNotifications.forEach(notification => {
                const timeAgo = getTimeAgo(notification.sent_at || notification.created_at);
                const taskIdMatch = (notification.message || '').match(/Task ID: (\d+)/);
                const taskId = taskIdMatch ? taskIdMatch[1] : null;

                // Check if this is a task assignment notification
                const isTaskAssignment = notification.type === 'task_assignment' && taskId;

                // Check if this is a project assignment notification
                const isProjectAssignment = notification.type === 'new job' && notification.title.includes('project');
                // Extract project title from the message
                const projectTitleMatch = isProjectAssignment ? notification.message.match(/project: (.+)$/) : null;
                const projectTitle = projectTitleMatch ? projectTitleMatch[1] : null;

                // For task assignments, show either accept button or "Read" label in the same position
                // For project assignments, show either accept button or "Read" label in the same position
                // For other notifications, show "Read" label when read
                let actionElement = '';

                // Check if task/project is already accepted
                const isAccepted = notification.is_accepted || notification.is_read;

                if (isTaskAssignment && !isAccepted) {
                    // Show accept button for unaccepted task assignments
                    actionElement = `
                        <div class="d-flex gap-2 mt-2">
                            <button class="btn btn-accept-task btn-submit-black"
                                    data-task-id="${taskId}"
                                    data-notification-id="${notification.id}">
                                Accept
                            </button>
                        </div>
                    `;
                } else if (isProjectAssignment && !isAccepted) {
                    // Show accept button for unaccepted project assignments
                    const escapedProjectTitle = (projectTitle || '').replace(/"/g, '&quot;');
                    actionElement = `
                        <div class="d-flex gap-2 mt-2">
                            <button class="btn btn-submit-black btn-accept-project"
                                    data-project-title="${escapedProjectTitle}"
                                    data-notification-id="${notification.id}"">
                                Accept
                            </button>
                        </div>
                    `;
                } else {
                    // For other notifications (e.g., task_reject), only show "Read" when it's actually read.
                    // Project notifications keep a hidden label that will be revealed after the red dot is cleared on close.
                    if (isProjectAssignment) {
                        actionElement = '<div class="notification-read-label" hidden="">Read</div>';
                    } else {
                        actionElement = notification.is_read ? '<div class="notification-read-label">Read</div>' : '';
                    }
                }

                // Add unread indicator dot for unread notifications
                const unreadIndicator = !notification.is_read ? '<div class="notification-unread-dot"></div>' : '';

                // Show notification message only for task creators
                const showMessage = notification.type === 'task_assignment' && notification.created_by_name === notification.employee_name;
                const messageElement = showMessage ? `<div class="notification-message" style="font-size: 14px;">${notification.message}</div>` : '';

                // For task_reject notifications, use the message (without "[Task ID: N]") as the title
                let displayTitle = notification.title;
                if ((notification.type || '').toLowerCase() === 'task_reject') {
                    // Remove trailing "[Task ID: N]" if present
                    displayTitle = (notification.message || '').replace(/\s*\[Task ID:\s*\d+\]\s*$/, '').trim();
                }

                html += `
                    <div class="notification-item position-relative d-flex align-items-start" data-notification-id="${notification.id}" data-notification-type="${notification.type}" data-notification-message="${(notification.message||'').replace(/\"/g,'&quot;')}">
                        ${unreadIndicator}
                        <div class="notification-content" style="position: relative; width: 100%;">
                            <div class="notification-title">${displayTitle}</div>
                            ${messageElement}
                            <div class="d-flex justify-content-between align-items-center">
                                <div class="notification-time">${timeAgo}</div>
                                <div class="notification-actions">
                                    ${actionElement}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });
            notificationList.html(html);
            
            // After rendering notifications, check and update "Read" label visibility for project notifications
            setTimeout(function() {
                $('.notification-item').each(function() {
                    const notificationElement = $(this);
                    const notificationTitle = notificationElement.find('.notification-title').text().toLowerCase();
                    
                    // Only process project notifications
                    if (notificationTitle.includes('project')) {
                        const hasRedDot = notificationElement.find('.notification-unread-dot').length > 0;
                        const readLabel = notificationElement.find('.notification-read-label');
                        
                        if (!hasRedDot && readLabel.length > 0) {
                            // Remove hidden attribute to show "Read" label when red dot is gone
                            readLabel.removeAttr('hidden');
                        }
                    }
                });
            }, 100); // Small delay to ensure DOM is fully rendered
        });
            },
            error: function(xhr, status, error) {
                console.error('Failed to load notifications:', status, error);
                $('#notificationList').html(`
                    <div class="empty-notifications">
                        <span class="material-symbols-outlined d-block mb-2" style="font-size: 48px; color: #dc3545;">error</span>
                        <p class="mb-0">Failed to load notifications</p>
                    </div>
                `);
            }
        });
    }

    // Helpers to extract task/project notifications (unaccepted only)
    function extractTaskAssignments(list) {
        return (list || []).reduce((acc, n) => {
            try {
                const isTask = n.type === 'task_assignment';
                const m = (n.message || '').match(/Task ID: (\d+)/);
                const taskId = m ? parseInt(m[1], 10) : null;
                const isAssigned = (n && typeof n.is_assigned !== 'undefined') ? !!n.is_assigned : true; // default true for backward compat
                if (isTask && taskId && isAssigned && !n.is_accepted) {
                    acc.push({ taskId, notificationId: n.id });
                }
            } catch(_) {}
            return acc;
        }, []);
    }
    function extractProjectAssignments(list) {
        // Disable bulk-accept for projects: never return items
        return [];
    }

    // Fetch all projects once and build a map: title -> id
    let __projectTitleToId = null;
    function getProjectTitleMap() {
        const appUrl = (document.querySelector('meta[name="app-url"]')?.getAttribute('content') || '').replace(/\/$/, '');
        if (__projectTitleToId) return Promise.resolve(__projectTitleToId);
        return $.ajax({ url: `${appUrl}/project/index?include_unaccepted=true`, type: 'GET' })
            .then((res) => {
                const map = {};
                (res && Array.isArray(res.data) ? res.data : []).forEach(p => { if (p && p.title) map[p.title] = p.id; });
                __projectTitleToId = map;
                return map;
            });
    }

    // Perform one acceptance + mark notification read
    function acceptOneTask(taskId, notificationId) {
        const appUrl = (document.querySelector('meta[name="app-url"]')?.getAttribute('content') || '').replace(/\/$/, '');
        return $.ajax({
            url: `${appUrl}/task/${taskId}/accept`,
            method: 'POST',
            headers: { 'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content') }
        }).then(() => {
            return $.ajax({ url: `${appUrl}/notifications/${notificationId}/read`, method: 'POST', headers: { 'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content') } });
        }).catch((e) => {
            // Continue bulk even if one fails
            return $.Deferred().resolve().promise();
        });
    }
    function acceptOneProject(projectId, notificationId) {
        const appUrl = (document.querySelector('meta[name="app-url"]')?.getAttribute('content') || '').replace(/\/$/, '');
        return $.ajax({
            url: `${appUrl}/project/${projectId}/accept`,
            method: 'POST',
            headers: { 'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content') }
        }).then(() => {
            return $.ajax({ url: `${appUrl}/notifications/${notificationId}/read`, method: 'POST', headers: { 'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content') } });
        }).catch(() => {
            return $.Deferred().resolve().promise();
        });
    }

    function acceptAllTasks(list) {
        const items = extractTaskAssignments(list);
        if (items.length === 0) return Promise.resolve();
        // Chain sequentially to avoid server overload
        let chain = Promise.resolve();
        items.forEach(({ taskId, notificationId }) => {
            chain = chain.then(() => acceptOneTask(taskId, notificationId));
        });
        return chain;
    }

    function acceptAllProjects(list) {
        const items = extractProjectAssignments(list);
        if (items.length === 0) return Promise.resolve();
        // Prefer already-resolved projectId; fallback to title map only when missing
        return getProjectTitleMap().then((map) => {
            let chain = Promise.resolve();
            items.forEach(({ projectTitle, notificationId, projectId }) => {
                const pid = projectId || map[projectTitle];
                if (!pid) return; // skip unknown
                chain = chain.then(() => acceptOneProject(pid, notificationId));
            });
            return chain;
        });
    }


    function showBulkAcceptModal(opts) {
        const { showTasks, showProjects, onTasks, onProjects, onAll } = opts || {};
        const id = 'bulkAcceptModal';
        // Remove existing
        $('#' + id).remove();
        const hasBoth = !!(showTasks && showProjects);
        const title = 'Confirmation';
        const body = hasBoth
            ? 'There are Task and Project notifications. Choose an action:'
            : (showTasks ? 'Task notifications found. Proceed to accept all tasks?' : 'Project notifications found. Proceed to accept all projects?');

    const actionsHtml = hasBoth
        ? `<button type="button" class="btn btn-submit-black btn-accept-all" id="bulkAcceptTasksBtn" style="white-space: nowrap;">Accept all tasks</button>
            <button type="button" class="btn btn-submit-black btn-accept-all" id="bulkAcceptProjectsBtn" style="white-space: nowrap;">Accept all projects</button>
            <button type="button" class="btn btn-submit-black btn-accept-all" id="bulkAcceptAllBtn" style="white-space: nowrap;">Accept all</button>`
        : (showTasks
        ? `<button type="button" class="btn btn-submit-black btn-accept-all" id="bulkAcceptTasksBtn" style="white-space: nowrap;">Accept all tasks</button>`
        : `<button type="button" class="btn btn-submit-black btn-accept-all" id="bulkAcceptProjectsBtn" style="white-space: nowrap;">Accept all projects</button>`);

    const footerButtons = hasBoth
        ? `<div class="d-flex justify-content-center w-100" style="gap:8px; flex-wrap: nowrap;">
           ${actionsHtml}
           </div>`
        : `<div class="d-flex justify-content-center w-100" style="gap:8px; flex-wrap: nowrap;">
            <button type="button" class="btn btn-close-reply" data-bs-dismiss="modal">Cancel</button>
            ${actionsHtml}
           </div>`;

        const html = `
            <div class="modal fade" id="${id}" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered" style="max-width:520px;">
                    <div class="modal-content modal-content-custom">
                        <div class="modal-header modal-header-custom">
                            <h5 class="modal-title modal-title-custom">${title}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <p class="mb-0">${body}</p>
                        </div>
                        <div class="modal-footer">
                            ${footerButtons}
                        </div>
                    </div>
                </div>
            </div>`;
        $('body').append(html);
        const m = new bootstrap.Modal(document.getElementById(id));
        // When modal fully hides, remove it and uncheck Select all; keep dropdown open
        $('#'+id).on('hidden.bs.modal', function(){
            const selectAll = $('#notificationSelectAll');
            if (selectAll.length) selectAll.prop('checked', false);
            $(this).remove();
        });
        m.show();
        const closeModal = () => { try { m.hide(); } catch(_) {} };
        const settle = (ret, done) => {
            try {
                if (!ret) { done(); return; }
                if (typeof ret.always === 'function') { ret.always(done); return; }
                if (typeof ret.finally === 'function') { ret.finally(done); return; }
                if (typeof ret.then === 'function') { ret.then(done).catch(done); return; }
                done();
            } catch (_) { done(); }
        };
        if (showTasks) {
            $('#bulkAcceptTasksBtn').on('click', function(){ if (onTasks) settle(onTasks(), closeModal); });
        }
        if (showProjects) {
            $('#bulkAcceptProjectsBtn').on('click', function(){ if (onProjects) settle(onProjects(), closeModal); });
        }
        if (hasBoth) {
            $('#bulkAcceptAllBtn').on('click', function(){ if (onAll) settle(onAll(), closeModal); });
        }
    }

    function afterBulkDone(message, redirectPath = null) {
        if (typeof window.showAlertMsg === 'function') {
            window.showAlertMsg(message, 'light', 2000);
        } else {
            showDeleteSuccessAlert(message, 'success');
        }
        // Refresh UI state
        fetchNotificationCount();
        fetchNotifications();
        // Uncheck select all
        $('#notificationSelectAll').prop('checked', false);
        if (redirectPath) {
            const appUrl = (document.querySelector('meta[name="app-url"]')?.getAttribute('content') || '').replace(/\/$/, '');
            setTimeout(() => { window.location.href = `${appUrl}${redirectPath}`; }, 800);
        }
    }

    // Select All checkbox handler
    $(document).on('change', '#notificationSelectAll', function(){
        if (!this.checked) return; // only react on check

        const taskItems = extractTaskAssignments(__notificationsCache);
        const projectItems = extractProjectAssignments(__notificationsCache);
        const hasTasks = taskItems.length > 0;
        const hasProjects = projectItems.length > 0;

        if (!hasTasks && !hasProjects) {
            // Nothing to accept
            if (typeof window.showAlertMsg === 'function') {
                window.showAlertMsg('No Task/Project notifications to accept.', 'warning', 2000);
            }
            $(this).prop('checked', false);
            return;
        }

        showBulkAcceptModal({
            showTasks: hasTasks,
            showProjects: hasProjects,
            onTasks: () => acceptAllTasks(__notificationsCache).then(() => {
                afterBulkDone('Successfully accepted all tasks', '/task');
            }),
            onProjects: () => acceptAllProjects(__notificationsCache).then(() => {
                afterBulkDone('Successfully accepted all projects', '/project');
            }),
            onAll: () => acceptAllTasks(__notificationsCache).then(() => acceptAllProjects(__notificationsCache)).then(() => {
                afterBulkDone('Successfully accepted all tasks and projects', null);
            })
        });
    });

    // Add event listener for accept task buttons
    $(document).on('click', '.btn-accept-task', function(e) {
        e.preventDefault();
        e.stopPropagation();

        const taskId = $(this).data('task-id');
        const notificationId = $(this).data('notification-id');

        acceptTask(taskId, notificationId);
    });

    // Add event listener for accept project buttons
    $(document).on('click', '.btn-accept-project', function(e) {
        e.preventDefault();
        e.stopPropagation();

        const projectTitle = $(this).data('project-title');
        const notificationId = $(this).data('notification-id');

        if (typeof acceptProject === 'function') {
            acceptProject(projectTitle, notificationId);
        }
    });

    // Function to check task acceptance status
    function checkTaskAcceptanceStatus(notifications) {
        const appUrl = (document.querySelector('meta[name=\"app-url\"]')?.getAttribute('content') || '').replace(/\/$/, '');
        const promises = notifications.map(notification => {
            if (notification.type === 'task_assignment') {
                const taskIdMatch = notification.message.match(/Task ID: (\d+)/);
                const taskId = taskIdMatch ? taskIdMatch[1] : null;

                if (taskId) {
                    console.log('Checking accept status for task:', taskId, 'URL:', `${appUrl}/task/${taskId}/accept-status`);
                    return $.ajax({
                        url: `${appUrl}/task/${taskId}/accept-status`,
                        type: "GET"
                    }).then(response => {
                        console.log('Accept status response for task', taskId, ':', response);
                        const data = response && response.data ? response.data : {};
                        const isAccepted = !!(response.is_accepted || data.is_accepted);
                        const notAssignedMsg = String(data.message || '').toLowerCase();
                        const isAssigned = notAssignedMsg.includes('not assigned') ? false : true;
                        return {
                            ...notification,
                            is_accepted: isAccepted,
                            is_assigned: isAssigned
                        };
                    }).catch((xhr, status, error) => {
                        console.error('Failed to check accept status for task', taskId, ':', error, xhr.responseText);
                        return {
                            ...notification,
                            is_accepted: false,
                            is_assigned: false
                        };
                    });
                }
            }
            return Promise.resolve(notification);
        });

        return Promise.all(promises);
    }

    function getTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) {
            return 'Just now';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days} day${days > 1 ? 's' : ''} ago`;
        }
    }

    // Avatar Dropdown functionality
    function toggleAvatarDropdown() {
        const dropdown = $('#avatarDropdownCard');
        // Close notification dropdown first
        hideNotificationDropdown();
        dropdown.toggle();
    }

    function hideAvatarDropdown() {
        $('#avatarDropdownCard').hide();
    }

    // Avatar dropdown event handlers
    $(document).on('click', '#avatarDropdownToggle', function(e) {
        e.stopPropagation();
        toggleAvatarDropdown();
    });

    $(document).on('click', '#closeAvatarDropdown', function(e) {
        e.stopPropagation();
        hideAvatarDropdown();
    });

    // Close dropdown when clicking outside (ignore clicks inside modals)
    $(document).on('click', function(e) {
        if ($(e.target).closest('.modal, .modal-backdrop').length) return;
        if (!$(e.target).closest('#avatarDropdownCard, #avatarDropdownToggle').length) {
            hideAvatarDropdown();
        }
    });

    let dropdownClosed = false;

    // Notification Dropdown functionality
    function toggleNotificationDropdown() {
        const dropdown = $('#notificationDropdownCard');
        // Close avatar dropdown first
        hideAvatarDropdown();
        dropdown.toggle();

        if (dropdown.is(':visible')) {
            // If we just closed previously and are still marking items as read, wait for that first
            if (__pendingMarkReadPromise && typeof __pendingMarkReadPromise.always === 'function') {
                __pendingMarkReadPromise.always(function(){
                    fetchNotifications();
                });
            } else {
                fetchNotifications();
            }
            dropdownClosed = false;
            __dropdownWasOpenedByUser = true; // Mark that user explicitly opened the dropdown
        } else {
            // When dropdown is hidden via toggle, also reset Select all checkbox
            dropdownClosed = true;
            const selectAll = $('#notificationSelectAll');
            if (selectAll.length) selectAll.prop('checked', false);
        }
    }

    function hideNotificationDropdown() {
        $('#notificationDropdownCard').hide();
        dropdownClosed = true;
        // Reset Select all checkbox when dropdown closes
        const selectAll = $('#notificationSelectAll');
        if (selectAll.length) selectAll.prop('checked', false);

        // ONLY mark project notifications as read if user explicitly opened the dropdown
        // This ensures notifications are only marked as read when user intentionally closes the dropdown
        if (__dropdownWasOpenedByUser) {
            const appUrl = (document.querySelector('meta[name="app-url"]')?.getAttribute('content') || '').replace(/\/$/, '');
            const csrf = $('meta[name="csrf-token"]').attr('content');

            // Queue project notifications mark-as-read
            const projectReq = $.ajax({
                url: `${appUrl}/notifications/mark-project-read`,
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': csrf }
            });

            // Collect all unread task_reject notification IDs present in the list at close time
            const ids = [];
            try {
                $('#notificationList .notification-item[data-notification-type="task_reject"]').each(function(){
                    const $item = $(this);
                    if ($item.find('.notification-unread-dot').length > 0) {
                        const nid = $item.data('notification-id');
                        if (nid) ids.push(nid);
                    }
                });
            } catch(_) {}

            // Create ajax calls for each id (without DOM side-effects)
            const readCalls = ids.map(function(nid){
                return $.ajax({
                    url: `${appUrl}/notifications/${nid}/read`,
                    method: 'POST',
                    headers: { 'X-CSRF-TOKEN': csrf }
                });
            });

            // Track the combined completion; ensure we refresh only after all are done
            __pendingMarkReadPromise = $.when.apply($, [projectReq].concat(readCalls));
            __pendingMarkReadPromise.always(function(){
                __pendingMarkReadPromise = null;
                fetchNotificationCount();
                fetchNotifications();
            });
        }
        
        // Reset the flag after closing
        __dropdownWasOpenedByUser = false;
    }

    // Notification dropdown event handlers
    $(document).on('click', '#notificationDropdownToggle', function(e) {
        e.stopPropagation();
        toggleNotificationDropdown();
    });

    $(document).on('click', '#closeNotificationDropdown', function(e) {
        e.stopPropagation();
        hideNotificationDropdown();
    });

    // Close dropdown when clicking outside, but ignore clicks inside any Bootstrap modal
    $(document).on('click', function(e) {
        // If click is inside an open modal (or its backdrop), do not close the dropdown
        if ($(e.target).closest('.modal, .modal-backdrop').length) {
            return;
        }
        if (!$(e.target).closest('#notificationDropdownCard, #notificationDropdownToggle').length) {
            hideNotificationDropdown();
        }
    });

    // Redirect to appropriate page when notification is clicked
    $(document).on('click', '.notification-item', function() {
        const appUrl = (document.querySelector('meta[name="app-url"]')?.getAttribute('content') || '').replace(/\/$/, '');
        const notificationId = $(this).data('notification-id');
        const notificationElement = $(this);
        const notificationTitle = notificationElement.find('.notification-title').text().toLowerCase();
        const message = notificationElement.attr('data-notification-message') || '';

        // Only automatically mark-as-read + navigate to specific task when notification type is 'task_reject'
        const notifType = (notificationElement.attr('data-notification-type') || '').toLowerCase();
        const taskIdMatch = message.match(/Task ID: (\d+)/);
        if (notifType === 'task_reject' && taskIdMatch) {
            const targetTaskId = taskIdMatch[1];
            markNotificationAsRead(notificationId, function() {
                window.location.href = `${appUrl}/task`;
            });
            return;
        }

        // Fallback: project notifications should be marked as read then go to projects
        if (notificationTitle.includes('project')) {
            markNotificationAsRead(notificationId, function() {
                window.location.href = `${appUrl}/project`;
            });
            return;
        }

        // For 'task_accepted' legacy flows, mark read then go to /task
        if (notificationTitle.includes('accepted task')) {
            markNotificationAsRead(notificationId, function() {
                window.location.href = `${appUrl}/task`;
            });
            return;
        }

        // For task_assignment notifications, do NOT auto-mark-read on click (Accept button handles that).
        if (notifType === 'task_assignment') {
            // Navigate to task list (or detail if you prefer). Keep unread state so accept button remains available.
            window.location.href = `${appUrl}/task`;
            return;
        }

        // Default for other notification types: mark as read then go to task list
        markNotificationAsRead(notificationId, function() {
            window.location.href = `${appUrl}/task`;
        });
    });

    // Function to check project acceptance status
    function checkProjectAcceptanceStatus(notifications) {
        const appUrl = (document.querySelector('meta[name=\"app-url\"]')?.getAttribute('content') || '').replace(/\/$/, '');
        const promises = notifications.map(notification => {
            if (notification.type === 'new job' && notification.title.includes('project')) {
                // Extract project title from message
                const projectTitleMatch = notification.message.match(/project: (.+)$/);
                const projectTitle = projectTitleMatch ? projectTitleMatch[1] : null;

                if (projectTitle) {
                    // We need to get the project ID by title
                    // First, get all projects (including unaccepted ones)
                    return $.ajax({
                        url: `${appUrl}/project/index?include_unaccepted=true`,
                        type: "GET"
                    }).then(response => {
                        // Find the project with the matching title
                        const project = response.data.find(p => p.title === projectTitle);
                        if (project) {
                            // Now check the accept status using the project ID
                            return $.ajax({
                                url: `${appUrl}/project/${project.id}/accept-status`,
                                type: "GET"
                            }).then(statusResponse => {
                                const isAccepted = !!(statusResponse?.is_accepted || statusResponse?.data?.is_accepted);
                                return {
                                    ...notification,
                                    is_accepted: isAccepted,
                                    project_id: project.id
                                };
                            }).catch(() => {
                                // If we cannot determine status, do not count it for bulk operations
                                return {
                                    ...notification,
                                    is_accepted: true
                                };
                            });
                        } else {
                            // If project not found, exclude from bulk by treating as accepted
                            return {
                                ...notification,
                                is_accepted: true
                            };
                        }
                    }).catch(() => {
                        // If fetching projects fails, exclude from bulk by treating as accepted
                        return {
                            ...notification,
                            is_accepted: true
                        };
                    });
                }
            }
            return Promise.resolve(notification);
        });

        return Promise.all(promises);
    }

    // Accept project function for project assignment notifications
    function acceptProject(projectTitle, notificationId) {
        console.log('=== Accept Project Debug ===');
        console.log('Project Title:', projectTitle);
        console.log('Notification ID:', notificationId);

        const appUrl = (document.querySelector('meta[name=\"app-url\"]')?.getAttribute('content') || '').replace(/\/$/, '');
        console.log('App URL:', appUrl);

        // First, get all projects to find the project ID by title
        $.ajax({
            url: `${appUrl}/project/index?include_unaccepted=true`,
            type: "GET",
            success: function(response) {
                console.log('Projects response:', response);
                console.log('Looking for project title:', projectTitle);
                console.log('Available projects:', response.data.map(p => ({ id: p.id, title: p.title })));

                // Find the project with the matching title
                const project = response.data.find(p => p.title === projectTitle);
                console.log('Found project:', project);

                if (project) {
                    console.log('Calling accept endpoint for project ID:', project.id);
                    // Now call the accept endpoint with the project ID
                    $.ajax({
                        url: `${appUrl}/project/${project.id}/accept`,
                        method: 'POST',
                        headers: {
                            'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
                        },
                        success: function(response) {
                            console.log('Accept project response:', response);
                            if (typeof window.showAlertMsg === 'function') {
                                window.showAlertMsg('Project accepted successfully!', 'light', 2000);
                            } else {
                                showDeleteSuccessAlert('Project accepted successfully!', 'success');
                            }

                        // Mark the notification as read
                        $.ajax({
                            url: `${appUrl}/notifications/${notificationId}/read`,
                            method: 'POST',
                            headers: {
                                'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
                            },
                            success: function() {
                                console.log('Notification marked as read successfully');
                                
                                // Update notification count first
                                fetchNotificationCount();
                                
                                // Then update the notification UI with conditional "Read" label
                                setTimeout(function() {
                                    updateNotificationReadStatus(notificationId);
                                }, 200); // Delay to ensure badge count is updated first

                                // Optional navigation: only if API requests reload or user is already on project page
                                const onProjectPage = (window.location.pathname || '').includes('/project');
                                if ((response && response.reload) || onProjectPage) {
                                    setTimeout(() => {
                                        if (typeof loadProjectCardData === 'function') {
                                            loadProjectCardData();
                                        } else {
                                            window.location.href = `${appUrl}/project`;
                                        }
                                    }, 1500);
                                }
                            },
                            error: function() {
                                console.error('Failed to mark notification as read');
                                
                                // Still update the UI and count even if marking as read fails
                                fetchNotificationCount();
                                
                                setTimeout(function() {
                                    updateNotificationReadStatus(notificationId);
                                }, 200);

                                // Optional navigation: only if user is already on project page
                                const onProjectPage2 = (window.location.pathname || '').includes('/project');
                                if (onProjectPage2) {
                                    setTimeout(() => {
                                        window.location.href = `${appUrl}/project`;
                                    }, 1500);
                                }
                            }
                        });
                    },
                    error: function(xhr, status, error) {
                        console.error('Error accepting project:', status, error);
                        console.error('XHR response:', xhr.responseText);

                        let errorMessage = 'Failed to accept project';
                        if (xhr.responseJSON && xhr.responseJSON.message) {
                            errorMessage = xhr.responseJSON.message;
                        } else if (xhr.responseJSON && xhr.responseJSON.error) {
                            errorMessage = xhr.responseJSON.error;
                        }

                        if (typeof window.showAlertMsg === 'function') {
                            window.showAlertMsg('Error: ' + errorMessage, 'error', 4000);
                        } else {
                            showDeleteSuccessAlert('Error: ' + errorMessage, 'error');
                        }
                    }
                });
            } else {
                console.error('Project not found:', projectTitle);
                if (typeof window.showAlertMsg === 'function') {
                    window.showAlertMsg('Project not found', 'error', 3000);
                } else {
                    showDeleteSuccessAlert('Project not found', 'error');
                }
            }
            },
            error: function(xhr, status, error) {
                console.error('Error fetching projects:', error);
                console.error('XHR:', xhr.responseText);
                if (typeof window.showAlertMsg === 'function') {
                    window.showAlertMsg('Failed to fetch projects', 'error', 3000);
                } else {
                    showDeleteSuccessAlert('Failed to fetch projects', 'error');
                }
            }
        });
    }

    // Make acceptProject function globally available
    window.acceptProject = acceptProject;

    // Function to mark notification as read
    function markNotificationAsRead(notificationId, callback) {
        const appUrl = (document.querySelector('meta[name=\"app-url\"]')?.getAttribute('content') || '').replace(/\/$/, '');
        $.ajax({
            url: `${appUrl}/notifications/${notificationId}/read`,
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
            },
            success: function() {
                // Update notification count first
                fetchNotificationCount();

                // Immediately update the notification UI so unread indicator is removed before any redirect
                try {
                    const notificationElement = $(`[data-notification-id="${notificationId}"]`);
                    const notificationTitle = (notificationElement.find('.notification-title').text() || '').toLowerCase();

                    // Remove unread dot immediately
                    notificationElement.find('.notification-unread-dot').remove();

                    // Only apply conditional logic for project notifications for the Read label behavior
                    if (notificationTitle.includes('project')) {
                        // Use existing helper to show 'Read' label with conditional timing
                        updateNotificationReadStatus(notificationId);
                    } else {
                        // For non-project notifications (like tasks), set Read label immediately
                        notificationElement.find('.notification-actions').html('<div class="notification-read-label">Read</div>');
                    }
                } catch (e) {
                    console.error('Failed to update notification DOM after marking read', e);
                }

                // Execute callback if provided (redirect should happen after DOM update)
                if (typeof callback === 'function') {
                    callback();
                }
            },
            error: function() {
                console.error('Failed to mark notification as read');
                // Still execute callback even if marking as read fails
                if (typeof callback === 'function') {
                    callback();
                }
            }
        });
    }

    // Function to mark all notifications as read
    function markAllAsRead() {
        const appUrl = (document.querySelector('meta[name=\"app-url\"]')?.getAttribute('content') || '').replace(/\/$/, '');
        $.ajax({
            url: appUrl + "/notifications/mark-all-read",
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
            },
            success: function() {
                // Hide badge immediately for current user only
                $('#notificationBadge').hide();
                $('#notificationCount').text('0');
                // Refresh notifications to update UI with read labels
                fetchNotifications();
            },
            error: function() {
                console.error('Failed to mark all notifications as read');
            }
        });
    }

    // Function to delete notification
    function deleteNotification(notificationId) {
        const appUrl = (document.querySelector('meta[name=\"app-url\"]')?.getAttribute('content') || '').replace(/\/$/, '');
        $.ajax({
            url: `${appUrl}/notifications/${notificationId}`,
            method: 'DELETE',
            headers: {
                'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
            },
            success: function() {
                showDeleteSuccessAlert('Notification deleted successfully');
                fetchNotificationCount();
                fetchNotifications();
            },
            error: function(xhr, status, error) {
                console.error('Failed to delete notification:', status, error);
                showDeleteSuccessAlert('Failed to delete notification', 'error');
            }
        });
    }

    // Function to show success alert with SVG icons (no close button, 1.5s auto-dismiss)
    function showDeleteSuccessAlert(message, type = 'success') {
        const iconSvg = type === 'success'
            ? `<svg class="bi flex-shrink-0 me-2" width="24" height="24" role="img" aria-label="Success:"><use xlink:href="#check-circle-fill"/></svg>`
            : `<svg class="bi flex-shrink-0 me-2" width="24" height="24" role="img" aria-label="Danger:"><use xlink:href="#exclamation-triangle-fill"/></svg>`;

        const alertClass = type === 'success' ? 'alert-success' : 'alert-danger';
        const alertId = 'delete-alert-' + Date.now();

        const alertHtml = `
            <svg xmlns="http://www.w3.org/2000/svg" style="display: none;">
                <symbol id="check-circle-fill" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                </symbol>
                <symbol id="exclamation-triangle-fill" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                </symbol>
            </svg>
            <div id="${alertId}" class="alert ${alertClass} fade show position-fixed d-flex align-items-center"
                 style="bottom: 20px; right: 20px; z-index: 9999; min-width: 300px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: opacity 0.3s ease;"
                 role="alert">
                ${iconSvg}
                <div>${message}</div>
            </div>
        `;

        $('body').append(alertHtml);

        // Auto remove after 1.5 seconds with proper cleanup
        setTimeout(() => {
            const alert = $('#' + alertId);
            if (alert.length) {
                alert.fadeOut(300, function() {
                    $(this).remove();
                });
            }
        }, 1500);
    }

    // Event handler for delete notification button
    $(document).on('click', '.btn-delete-notification', function(e) {
        e.stopPropagation();
        const notificationId = $(this).data('notification-id');

        // Confirm delete
        if (confirm('Are you sure you want to delete this notification?')) {
            deleteNotification(notificationId);
        }
    });

    // Show accept task confirmation modal
    function showAcceptTaskModal(taskId, notificationId) {
        const appUrl = (document.querySelector('meta[name=\"app-url\"]')?.getAttribute('content') || '').replace(/\/$/, '');
        console.log('Fetching task details for ID:', taskId, 'with appUrl:', appUrl);

        // Fetch task details
        $.ajax({
            url: `${appUrl}/task/${taskId}`,
            method: 'GET',
            success: function(response) {
                console.log('=== Office.js Debug Info ===');
                console.log('Task details response:', response);
                // Safely access response data with fallback defaults
                const taskTitle = (response.data && response.data.title) || 'undefined';
                const taskDescription = (response.data && response.data.description) || 'No description';

                // Better image handling with multiple fallbacks
                let taskImage;
                if (response.data && response.data.image) {
                    taskImage = `${appUrl}/file/task/${response.data.image}`;
                } else {
                    taskImage = `${appUrl}/asset/img/background/add-image.png`;
                }

                console.log('Task image URL:', taskImage);
                console.log('Task data:', response.data);
                console.log('=============================');
                // Create modal HTML
                const modalHtml = `
                    <div class="modal fade" id="acceptTaskModal" tabindex="-1" aria-labelledby="acceptTaskModalLabel" aria-hidden="true">
                        <div class="modal-dialog modal-dialog-centered" style="max-width: 400px;">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title" id="acceptTaskModalLabel">Accept Task</h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                </div>
                                <div class="modal-body">
                                    <div class="d-flex">
                                        <div class="me-3">
                                            <img src="${taskImage}"
                                                 alt="Task Image"
                                                 class="rounded-circle task-image"
                                                 style="width: 70px; height: 70px; object-fit: cover;"
                                                 onerror="this.src='${appUrl}/asset/img/background/add-image.png'">
                                        </div>
                                        <div>
                                            <h6 style="font-size: 16px; font-weight: 600; margin: 0;">${taskTitle}</h6>
                                            <div style="margin-top: 0.25rem; font-size: 14px;">
                                                ${taskDescription}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-submit-black" data-bs-dismiss="modal">Cancel</button>
                                    <button type="button" class="btn btn-submit-black" id="confirmAcceptTaskBtn"><span class="material-symbols-outlined me-1" style="font-size: 12px; vertical-align: middle;">check_circle</span>
                                    Accept Task</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                // Add modal to body
                $('body').append(modalHtml);

                // Show modal
                const modal = new bootstrap.Modal(document.getElementById('acceptTaskModal'));
                modal.show();

                // Handle confirm button click
                $('#confirmAcceptTaskBtn').on('click', function() {
                    // Close modal
                    modal.hide();

                    // Actually accept the task
                    actuallyAcceptTask(taskId, notificationId);
                });

                // Remove modal from DOM when closed
                $('#acceptTaskModal').on('hidden.bs.modal', function () {
                    $(this).remove();
                });
            },
            error: function(xhr, status, error) {
                console.error('Failed to fetch task details:', error, xhr.responseText);
                // Fallback if task details can't be loaded
                actuallyAcceptTask(taskId, notificationId);
            }
        });
    }

    // Actually accept task function
    function actuallyAcceptTask(taskId, notificationId) {
        const appUrl = (document.querySelector('meta[name=\"app-url\"]')?.getAttribute('content') || '').replace(/\/$/, '');
        $.ajax({
            url: `${appUrl}/task/${taskId}/accept`,
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
            },
            success: function(response) {
                // Unified alert style (same as Settings)
                if (typeof window.showAlertMsg === 'function') {
                    window.showAlertMsg('Task accepted successfully!', 'light', 2000);
                } else {
                    showDeleteSuccessAlert('Task accepted successfully!', 'success');
                }

                // Mark the notification as read
                $.ajax({
                    url: `${appUrl}/notifications/${notificationId}/read`,
                    method: 'POST',
                    headers: {
                        'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
                    },
                    success: function() {
                        console.log('Task notification marked as read successfully');
                        // Update the notification UI to show it as read
                        const notificationElement = $(`[data-notification-id="${notificationId}"]`);

                        // Update notification count
                        fetchNotificationCount();

                        // Reload the page after short delay (optional)
                        setTimeout(() => {
                            window.location.href = `${appUrl}/task`;
                        }, 1000); // 1 second delay so alert is visible first
                    },
                    error: function() {
                        console.error('Failed to mark notification as read');
                        // Still update the UI and count even if marking as read fails
                        const notificationElement = $(`[data-notification-id="${notificationId}"]`);
                        notificationElement.find('.notification-unread-dot').remove();
                        notificationElement.find('.notification-actions').html('<div class="notification-read-label">Read</div>');

                        // Update notification count
                        fetchNotificationCount();

                        // Reload the page after short delay (optional)
                        setTimeout(() => {
                            window.location.href = `${appUrl}/task`;
                        }, 1000); // 1 second delay so alert is visible first
                    }
                });
            },
            error: function(xhr, status, error) {
                console.error('Error accepting task:', status, error);
                let errMsg = 'Failed to accept task';
                try {
                    if (xhr && xhr.responseJSON && (xhr.responseJSON.message || xhr.responseJSON.error)) {
                        errMsg = xhr.responseJSON.message || xhr.responseJSON.error;
                    }
                } catch(_) {}
                if (typeof window.showAlertMsg === 'function') {
                    window.showAlertMsg(errMsg, 'error', 4000);
                } else {
                    showDeleteSuccessAlert(errMsg, 'error');
                }
            }
        });
    }

    // Accept task function for task assignment notifications
    function acceptTask(taskId, notificationId) {
        showAcceptTaskModal(taskId, notificationId);
    }

    // Make acceptTask function globally available
    window.acceptTask = acceptTask;

    // Initial load
    fetchNotificationCount();
    // Expose fetchNotifications globally so other modules can trigger a refresh after actions like reject
    window.fetchNotifications = fetchNotifications;

    // Refresh notification count every 30 seconds
    setInterval(fetchNotificationCount, 30000);
});

// cara menggunakan tinggal panggil fungsi)
// showAlertMsg('Teks pesan yang di tampilkan');
// showAlertMsg('Teks pesan yang di tampilkan','error');

function showAlertMsg(msgHtml = '',msgType = 'light', delay = 2500){

    // msgType = 'light','success','warning','error'

    $('.box-alert-messages .box-message').removeClass('error warning success');

    $('.box-alert-messages .box-message').addClass(msgType);


    $('.box-alert-messages .message-content').html(msgHtml);

    $('.box-alert-messages').stop().fadeIn('fast').delay(delay).fadeOut('fast',function(){
        $('.nsa_message_box .message_content').html('');
    });

}

function hideAlertMsg(){

    $('.box-alert-messages').stop().fadeOut('fast',function(){
        $('.nsa_message_box .message_content').html('');
    });

}

$(document).on('click','.btn-close-alert-messages',function(){
    hideAlertMsg();
});


