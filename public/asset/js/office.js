$(document).ready(function() {
    // Notification functionality
    function fetchNotificationCount() {
        const appUrl = $('meta[name="app-url"]').attr('content');
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
        const appUrl = $('meta[name="app-url"]').attr('content');
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

                let html = '';
                notifications.forEach(notification => {
                    const timeAgo = getTimeAgo(notification.sent_at || notification.created_at);
                    html += `
                        <div class="notification-item d-flex align-items-start p-3 mb-2 rounded-3 hover-bg-light" data-notification-id="${notification.id}">
                            <div class="notification-icon me-3">
                                <span class="material-symbols-outlined text-primary">info</span>
                            </div>
                            <div class="notification-content flex-grow-1">
                                <div class="notification-title fw-medium mb-1">${notification.title}</div>
                                <div class="notification-text text-muted small">${notification.message}</div>
                                <div class="notification-time text-muted small mt-1">${timeAgo}</div>
                            </div>
                        </div>
                    `;
                });
                
                notificationList.html(html);
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

    // Load notifications when modal is opened
    $(document).on('shown.bs.modal', '#notificationModal', function() {
        fetchNotifications();
        // Mark all notifications as read when modal is opened
        markAllAsRead();
    });

    // Mark notification as read when clicked
    $(document).on('click', '.notification-item', function() {
        const notificationId = $(this).data('notification-id');
        $.ajax({
            url: `/notifications/${notificationId}/read`,
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
            },
            success: function() {
                fetchNotificationCount();
                fetchNotifications();
            },
            error: function() {
                console.error('Failed to mark notification as read');
            }
        });
    });

    // Function to mark all notifications as read
    function markAllAsRead() {
        const appUrl = $('meta[name="app-url"]').attr('content');
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
            },
            error: function() {
                console.error('Failed to mark all notifications as read');
            }
        });
    }

    // Initial load
    fetchNotificationCount();
    
    // Refresh notification count every 30 seconds
    setInterval(fetchNotificationCount, 30000);
});
