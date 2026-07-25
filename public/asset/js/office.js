$(function () {

    (function () {
        const APP_URL = ($('meta[name="app-url"]').attr('content') || '').replace(/\/$/, '');

        function resolveAvatarPath(raw) {
            if (!raw) return null;
            if (/^https?:\/\//i.test(raw)) return raw;
            return `${APP_URL}/${raw.replace(/^\//, '')}`;
        }

        window.pickEmployeeAvatar = function (obj) {
            return (obj && (obj.profile_picture || obj.photo || obj.user_photo)) || null;
        };

        window.buildEmployeeAvatarUrl = function (obj) {
            return resolveAvatarPath(window.pickEmployeeAvatar(obj)) || `${APP_URL}/asset/img/avatar.png`;
        };

        $(function () {
            $('img[data-global-avatar]').each(function () {
                if (!$(this).attr('data-default')) {
                    $(this).attr('data-default', `${APP_URL}/asset/img/avatar.png`);
                }
            });
        });

        $(window).on('profilePictureUpdated', function (e) {
            const newUrl = e.originalEvent?.detail?.url;
            $('img[data-global-avatar]').each(function () {
                const $img = $(this);
                const fallback = $img.attr('data-default') || `${APP_URL}/asset/img/avatar.png`;
                const src = newUrl
                    ? (newUrl.includes('?t=') ? newUrl : `${newUrl}?t=${Date.now()}`)
                    : `${fallback}?t=${Date.now()}`;
                $img.attr('src', src);
            });
        });
    })();

    function toggleSidebar() {
        $('body').toggleClass('hide-sidebar');
        const isHidden = $('body').hasClass('hide-sidebar');
        localStorage.setItem('sidebarHidden', isHidden);
        document.documentElement.setAttribute('data-sidebar', isHidden ? 'hide-sidebar' : isHidden);

        if (typeof window.__taskTreeScheduleRecalc === 'function') {
            window.__taskTreeScheduleRecalc(60);
        }
    }

    if (localStorage.getItem('sidebarHidden') === 'true' && window.innerWidth > 570) {
        $('body').addClass('hide-sidebar');
        if (typeof window.__taskTreeScheduleRecalc === 'function') {
            window.__taskTreeScheduleRecalc(60);
        }
    }

    $(document).on('click', '#sidebar-control', function (e) {
        e.preventDefault();
        toggleSidebar();
    });

    function showToast(message, type = 'success') {
        const icons = {
            success: `<svg class="bi flex-shrink-0 me-2" width="24" height="24"><use xlink:href="#check-circle-fill"/></svg>`,
            error: `<svg class="bi flex-shrink-0 me-2" width="24" height="24"><use xlink:href="#exclamation-triangle-fill"/></svg>`,
        };
        const alertClass = type === 'success' ? 'alert-success' : 'alert-danger';
        const $alert = $(`
            <div class="alert ${alertClass} fade show position-fixed d-flex align-items-center"
                 style="bottom:20px;right:20px;z-index:9999;min-width:300px;box-shadow:0 4px 6px rgba(0,0,0,.1);"
                 role="alert">
                ${icons[type] || icons.success}
                <div>${message}</div>
            </div>
        `);
        $('body').append($alert);
        setTimeout(() => $alert.fadeOut(300, () => $alert.remove()), 1500);
    }

    window.showAlertMsg = function (msgHtml = '', msgType = 'light', delay = 2500) {
        const $box = $('.box-alert-messages');
        $box.find('.box-message').removeClass('error warning success light').addClass(msgType);
        $box.find('.message-content').html(msgHtml);
        $box.stop().fadeIn('fast').delay(delay).fadeOut('fast', () => $box.find('.message_content').html(''));
    };

    window.hideAlertMsg = function () {
        $('.box-alert-messages').stop().fadeOut('fast', function () {
            $(this).find('.message_content').html('');
        });
    };

    $(document).on('click', '.btn-close-alert-messages', window.hideAlertMsg);

    const Notif = (function () {
        const APP_URL = ($('meta[name="app-url"]').attr('content') || '').replace(/\/$/, '');
        const CSRF = $('meta[name="csrf-token"]').attr('content');

        let cache = [];
        let openedByUser = false;

        function timeAgo(dateString) {
            const diff = Math.floor((Date.now() - new Date(dateString)) / 1000);
            if (diff < 60) return 'Just now';
            if (diff < 3600) return `${Math.floor(diff / 60)} minute${Math.floor(diff / 60) > 1 ? 's' : ''} ago`;
            if (diff < 86400) return `${Math.floor(diff / 3600)} hour${Math.floor(diff / 3600) > 1 ? 's' : ''} ago`;
            return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) > 1 ? 's' : ''} ago`;
        }

        function api(method, path, data) {
            return $.ajax({
                url: `${APP_URL}${path}`,
                method,
                data,
                headers: { 'X-CSRF-TOKEN': CSRF },
            });
        }

        function fetchCount() {
            api('GET', '/notifications/count').done((res) => {
                const count = res.count || 0;
                $('#notificationCount').text(count);
                $('#notificationBadge').toggle(count > 0);
            }).fail(() => console.error('Failed to fetch notification count'));
        }

        function renderItem(n) {
            const readLabel = n.is_read ? '<div class="notification-read-label">Read</div>' : '';
            const unreadDot = n.is_read ? '' : '<div class="notification-unread-dot"></div>';

            const leaveKeywords = /absen|leave|late|telat|sick|sakit|izin|cuti/i;
            const isLeaveNotif = leaveKeywords.test(n.type || '') || leaveKeywords.test(n.title || '');

            return `
                <div class="notification-item position-relative d-flex align-items-start"
                    data-notification-id="${n.id}"
                    data-redirect="${isLeaveNotif ? '/leave' : ''}"
                    style="${isLeaveNotif ? 'cursor:pointer;' : ''}">
                    ${unreadDot}
                    <div class="notification-content" style="position:relative;width:100%;">
                        <div class="notification-title">${n.title}</div>
                        <div class="d-flex justify-content-between align-items-center">
                            <div class="notification-time">${timeAgo(n.sent_at || n.created_at)}</div>
                            <div class="notification-actions">
                                ${readLabel}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        $(document).on('click', '.notification-item', function (e) {
            if ($(e.target).closest('.btn-delete-notification').length) return;

            const redirectPath = $(this).data('redirect');
            const id = $(this).data('notification-id');

            if (redirectPath) {
                api('POST', `/notifications/${id}/read`).always(() => {
                    window.location.href = `${APP_URL}${redirectPath}`;
                });
            }
        });

        function emptyState(message, isError = false) {
            const color = isError ? '#dc3545' : '#dee2e6';
            const icon = isError ? 'error' : 'notifications_none';
            return `
                <div class="empty-notifications">
                    <span class="material-symbols-outlined d-block mb-2" style="font-size:48px;color:${color};">${icon}</span>
                    <p class="mb-0">${message}</p>
                </div>
            `;
        }

        function fetchList() {
            api('GET', '/notifications').done((res) => {
                cache = res.data || [];
                const $list = $('#notificationList');

                if (!cache.length) {
                    $list.html(emptyState('No new notifications'));
                    return;
                }

                $list.html(cache.map(renderItem).join(''));
            }).fail(() => {
                $('#notificationList').html(emptyState('Failed to load notifications', true));
            });
        }

        function deleteOne(id) {
            api('DELETE', `/notifications/${id}`).done(() => {
                showToast('Notification deleted successfully');
                fetchCount();
                fetchList();
            }).fail(() => showToast('Failed to delete notification', 'error'));
        }

        function markAllRead() {
            api('POST', '/notifications/mark-all-read').done(() => {
                $('#notificationBadge').hide();
                $('#notificationCount').text('0');
                fetchList();
            }).fail(() => console.error('Failed to mark all notifications as read'));
        }

        function markUnreadOnScreen() {
            const unreadIds = cache.filter((n) => !n.is_read).map((n) => n.id);
            if (!unreadIds.length) return;

            const calls = unreadIds.map((id) => api('POST', `/notifications/${id}/read`));
            $.when(...calls).always(() => {
                fetchCount();
                fetchList();
            });
        }

        function toggleDropdown() {
            const $dropdown = $('#notificationDropdownCard');
            Avatar.hide();
            Language.hide();
            $dropdown.toggle();

            if ($dropdown.is(':visible')) {
                fetchList();
                openedByUser = true;
            } else {
                closeDropdown();
            }
        }

        function closeDropdown() {
            $('#notificationDropdownCard').hide();
            if (openedByUser) {
                markUnreadOnScreen();
            }
            openedByUser = false;
        }

        function bindEvents() {
            $(document).on('click', '#notificationDropdownToggle', function (e) {
                e.stopPropagation();
                toggleDropdown();
            });

            $(document).on('click', '#closeNotificationDropdown', function (e) {
                e.stopPropagation();
                closeDropdown();
            });

            $(document).on('click', function (e) {
                if ($(e.target).closest('.modal, .modal-backdrop').length) return;
                if (!$(e.target).closest('#notificationDropdownCard, #notificationDropdownToggle').length) {
                    closeDropdown();
                }
            });

            $(document).on('click', '.btn-delete-notification', function (e) {
                e.stopPropagation();
                const id = $(this).data('notification-id');
                if (confirm('Are you sure you want to delete this notification?')) {
                    deleteOne(id);
                }
            });
        }

        return {
            init() {
                bindEvents();
                fetchCount();
                setInterval(fetchCount, 30000);
            },
            refresh: fetchList,
        };
    })();

    const Avatar = (function () {
        function toggle() {
            $("#notificationDropdownCard").hide();
            $("#languageDropdownCard").hide();
            $("#avatarDropdownCard").toggle();
        }

        function hide() {
            $('#avatarDropdownCard').hide();
        }

        function bindEvents() {
            $(document).on('click', '#avatarDropdownToggle', function (e) {
                e.stopPropagation();
                toggle();
            });

            $(document).on('click', '#closeAvatarDropdown', function (e) {
                e.stopPropagation();
                hide();
            });

            $(document).on('click', function (e) {
                if ($(e.target).closest('.modal, .modal-backdrop').length) return;
                if (!$(e.target).closest('#avatarDropdownCard, #avatarDropdownToggle').length) {
                    hide();
                }
            });
        }

        return { init: bindEvents, hide };
    })();

    const Language = (function () {
        function toggle() {
            $("#notificationDropdownCard").hide();
            $("#avatarDropdownCard").hide();
            $("#languageDropdownCard").toggle();
        }

        function hide() {
            $("#languageDropdownCard").hide();
        }

        function bindEvents() {
            $(document).on("click", "#languageDropdownToggle", function (e) {
                e.stopPropagation();
                toggle();
            });

            $(document).on("click", "#closeLanguageDropdown", function (e) {
                e.stopPropagation();
                hide();
            });

            $(document).on("click", function (e) {
                if ($(e.target).closest(".modal, .modal-backdrop").length) {
                    return;
                }

                if (
                    !$(e.target).closest(
                        "#languageDropdownCard, #languageDropdownToggle",
                    ).length
                ) {
                    hide();
                }
            });
        }

        return {
            init: bindEvents,
            hide,
        };
    })();

    Avatar.init();
    Notif.init();
    Language.init();

    window.fetchNotifications = Notif.refresh;
});