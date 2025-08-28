$(document).ready(function() {

     function toggleSidebar() {
        $('body').toggleClass('hide-sidebar');
        
        // Save state to localStorage
        const isHidden = $('body').hasClass('hide-sidebar');
        localStorage.setItem('sidebarHidden', isHidden);
    }

    // Load saved state on page load
    const savedState = localStorage.getItem('sidebarHidden');
    if (savedState === 'true') {
        $('body').addClass('hide-sidebar');
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
            let html = '';
            notificationsWithStatus.forEach(notification => {
                const timeAgo = getTimeAgo(notification.sent_at || notification.created_at);
                const taskIdMatch = notification.message.match(/Task ID: (\d+)/);
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
                            <button class="btn btn-sm btn-primary btn-accept-task" 
                                    data-task-id="${taskId}" 
                                    data-notification-id="${notification.id}"
                                    style="font-size: 12px; padding: 4px 8px;">
                                <span class="material-symbols-outlined" style="font-size: 14px; vertical-align: middle;">check_circle</span>
                                Accept Task
                            </button>
                        </div>
                    `;
                } else if (isProjectAssignment && !isAccepted) {
                    // Show accept button for unaccepted project assignments
                    // Escape single quotes in project title to prevent JavaScript errors
                    const escapedProjectTitle = projectTitle ? projectTitle.replace(/'/g, "\\'") : '';
                    actionElement = `
                        <div class="d-flex gap-2 mt-2">
                            <button class="btn btn-sm btn-primary btn-accept-project" 
                                    onclick="acceptProject('${escapedProjectTitle}', ${notification.id})"
                                    style="font-size: 12px; padding: 4px 8px;">
                                <span class="material-symbols-outlined" style="font-size: 14px; vertical-align: middle;">check_circle</span>
                                Accept Project
                            </button>
                        </div>
                    `;
                } else {
                    // Show "Read" label for accepted/read notifications
                    actionElement = '<div class="notification-read-label">Read</div>';
                }
                
                // Add unread indicator dot for unread notifications
                const unreadIndicator = !notification.is_read ? '<div class="notification-unread-dot"></div>' : '';
                
                // Show notification message only for task creators
                const showMessage = notification.type === 'task_assignment' && notification.created_by_name === notification.employee_name;
                const messageElement = showMessage ? `<div class="notification-message" style="font-size: 14px;">${notification.message}</div>` : '';
                
                html += `
                    <div class="notification-item position-relative d-flex align-items-start" data-notification-id="${notification.id}">
                        ${unreadIndicator}
                        <div class="notification-content" style="position: relative; width: 100%;">
                            <div class="notification-title">${notification.title}</div>
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

    // Add event listener for accept task buttons
    $(document).on('click', '.btn-accept-task', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const taskId = $(this).data('task-id');
        const notificationId = $(this).data('notification-id');
        
        acceptTask(taskId, notificationId);
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
                        return {
                            ...notification,
                            is_accepted: response.is_accepted || (response.data && response.data.is_accepted)
                        };
                    }).catch((xhr, status, error) => {
                        console.error('Failed to check accept status for task', taskId, ':', error, xhr.responseText);
                        return {
                            ...notification,
                            is_accepted: false
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

    // Close dropdown when clicking outside
    $(document).on('click', function(e) {
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
            fetchNotifications();
            dropdownClosed = false;
        }
    }

    function hideNotificationDropdown() {
        $('#notificationDropdownCard').hide();
        dropdownClosed = true;
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

    // Close dropdown when clicking outside
    $(document).on('click', function(e) {
        if (!$(e.target).closest('#notificationDropdownCard, #notificationDropdownToggle').length) {
            hideNotificationDropdown();
        }
    });

    // Redirect to appropriate page when notification is clicked (only mark task_accepted notifications as read)
    $(document).on('click', '.notification-item', function() {
        const appUrl = (document.querySelector('meta[name=\"app-url\"]')?.getAttribute('content') || '').replace(/\/$/, '');
        const notificationId = $(this).data('notification-id');
        const notificationTitle = $(this).find('.notification-title').text().toLowerCase();
        const notificationElement = $(this);
        const notificationType = notificationElement.find('.notification-title').text().includes('accepted task') ? 'task_accepted' : 'other';
        
        // Only mark 'task_accepted' notifications as read when clicked
        if (notificationType === 'task_accepted') {
            markNotificationAsRead(notificationId, function() {
                // Redirect to task page
                window.location.href = `${appUrl}/task`;
            });
        } else {
            // Check if this is a project notification
            if (notificationTitle.includes('project')) {
                // Redirect to project page without marking as read
                window.location.href = `${appUrl}/project`;
            } else {
                // Redirect to task page for other notifications without marking as read
                window.location.href = `${appUrl}/task`;
            }
        }
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
                                return {
                                    ...notification,
                                    is_accepted: statusResponse.is_accepted,
                                    project_id: project.id
                                };
                            }).catch(() => {
                                return {
                                    ...notification,
                                    is_accepted: false,
                                    project_id: project.id
                                };
                            });
                        } else {
                            // If project not found, mark as not accepted
                            return {
                                ...notification,
                                is_accepted: false
                            };
                        }
                    }).catch(() => {
                        return {
                            ...notification,
                            is_accepted: false
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
                            showDeleteSuccessAlert('Project accepted successfully!', 'success');
                        
                        // Mark the notification as read
                        $.ajax({
                            url: `${appUrl}/notifications/${notificationId}/read`,
                            method: 'POST',
                            headers: {
                                'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
                            },
                            success: function() {
                                console.log('Notification marked as read successfully');
                                // Update the notification UI to show it as read
                                const notificationElement = $(`[data-notification-id="${notificationId}"]`);
                                notificationElement.find('.notification-unread-dot').remove();
                                notificationElement.find('.notification-actions').html('<div class="notification-read-label">Read</div>');
                                
                                // Update notification count
                                fetchNotificationCount();
                                
                                // Reload the page after short delay (optional)
                                setTimeout(() => {
                                    // Check if the response indicates a reload is needed
                                    if (response && response.reload) {
                                        // Reload the project cards instead of the entire page
                                        if (typeof loadProjectCardData === 'function') {
                                            loadProjectCardData();
                                        } else {
                                            window.location.href = `${appUrl}/project`;
                                        }   
                                    } else {
                                        window.location.href = `${appUrl}/project`;
                                    }
                                }, 2000); // 2 second delay so UI updates are visible
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
                                    window.location.href = `${appUrl}/project`;
                                }, 2000); // 2 second delay so UI updates are visible
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
                        
                        showDeleteSuccessAlert('Error: ' + errorMessage, 'error');
                    }
                });
            } else {
                console.error('Project not found:', projectTitle);
                showDeleteSuccessAlert('Project not found', 'error');
            }
            },
            error: function(xhr, status, error) {
                console.error('Error fetching projects:', error);
                console.error('XHR:', xhr.responseText);
                showDeleteSuccessAlert('Failed to fetch projects', 'error');
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
                // Update notification UI to show as read
                const notificationElement = $(`[data-notification-id="${notificationId}"]`);
                notificationElement.find('.notification-unread-dot').remove();
                notificationElement.find('.notification-actions').html('<div class="notification-read-label">Read</div>');
                
                // Update notification count
                fetchNotificationCount();
                
                // Execute callback if provided
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
                                    <button type="button" class="btn btn-accept" id="confirmAcceptTaskBtn"><span class="material-symbols-outlined" style="font-size: 12px; vertical-align: middle;">check_circle</span>
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
                showDeleteSuccessAlert('Task accepted successfully!', 'success');
                
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
                showDeleteSuccessAlert('Failed to accept task', 'error');
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

