(function ($) {
    "use strict";

    function getMeta(name) {
        return $('meta[name="' + name + '"]').attr("content") || "";
    }

    function safeText(str) {
        return str === null || typeof str === "undefined" ? "-" : String(str);
    }

    function formatDate(dateStr) {
        if (!dateStr) return "-";
        try {
            var d = new Date(dateStr);
            if (isNaN(d.getTime())) return "-";
            var opts = { year: "numeric", month: "short", day: "2-digit" };
            return d.toLocaleDateString(undefined, opts);
        } catch (e) {
            return "-";
        }
    }

    function resolveAvatar(url) {
        if (!url) return "/asset/img/avatar.png";
        return url;
    }

        function showFloatingAlert(message, type = "success", delayMs = 2500) {
        try {
            if (typeof window.showAlertMsg === "function") {
                window.showAlertMsg(message, "light", delayMs);
                return;
            }
            const box = document.querySelector(
                ".box-alert-messages .box-message"
            );
            if (box && box.parentElement) {
                box.parentElement.style.display = "block";
                box.classList.remove("success", "warning", "error", "light");
                box.classList.add("light");
                box.innerHTML = message;
                setTimeout(() => {
                    if (typeof window.hideAlertMsg === "function") {
                        window.hideAlertMsg();
                    } else {
                        box.parentElement.style.display = "none";
                    }
                }, delayMs);
                return;
            }
        } catch (e) {
            /* no-op */
        }
        try {
            alert(
                typeof message === "string"
                    ? message.replace(/<[^>]+>/g, "")
                    : String(message)
            );
        } catch (e) {}
    }

    // Build 1-2 character initials from a title/name
    function buildInitials(title) {
        try {
            if (!title) return '';
            var t = String(title || '').trim();
            if (!t) return '';
            var parts = t.split(/\s+/).filter(Boolean);
            if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
            return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
        } catch (e) { return ''; }
    }

    // Deterministic color pick from text
    function getRandomColorFromText(text) {
        try {
            var colors = [
                '#6A5AE0', '#FF8A3C', '#00A881', '#D4526E', '#3E8EDE',
                '#546E7A', '#8E44AD', '#2E7D32', '#AD1457', '#EF6C00'
            ];
            var h = 0;
            for (var i = 0; i < (text || '').length; i++) {
                h = text.charCodeAt(i) + ((h << 5) - h);
            }
            return colors[Math.abs(h) % colors.length];
        } catch (e) { return '#6A5AE0'; }
    }

    // Build a simple SVG data URI with initials centered
    function buildInitialsSvg(initials, bgColor) {
        try {
            var w = 256, h = 256; // canvas size for crisp output
            var text = (initials || '').toUpperCase();
            // font size relative to canvas width for consistent scaling
            var fontSize = Math.round(w * 0.44);
            // Use viewBox so SVG scales nicely; center text with dominant-baseline & text-anchor
            var svg = '';
            svg += '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '">';
            svg += '<rect width="100%" height="100%" fill="' + (bgColor || '#6A5AE0') + '"/>';
            svg += '<text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" fill="#ffffff" font-family="Inter, Arial, Helvetica, sans-serif" font-weight="700" font-size="' + fontSize + '">' + (text || '') + '</text>';
            svg += '</svg>';
            return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
        } catch (e) {
            return '/asset/img/avatar.png';
        }
    }

    function renderAssignments(container, author, coAuthors, contributors) {
        container.empty();
        var makeEntry = function (person, roleLabel) {
            var $wrap = $("<div>").addClass(
                "d-flex align-items-center detail-role me-2 mb-2"
            );
            var avatarSrc = "/asset/img/avatar.png";
            if (person) {
                avatarSrc =
                    person.profile_picture ||
                    person.user_photo ||
                    person.photo ||
                    avatarSrc;
            }
            var $img = $("<img>")
                .addClass("user-profile me-2")
                .attr("alt", "user profile")
                .attr("src", resolveAvatar(avatarSrc));
            var $info = $("<div>");
            var nameText = person && person.name ? person.name : "-";
            var $name = $("<p>")
                .addClass("m-0 fw-normal")
                .text(safeText(nameText));
            var $role = $("<p>")
                .addClass("m-0 text-muted small")
                .text(roleLabel);
            $info.append($name).append($role);
            $wrap.append($img).append($info);
            return $wrap;
        };
        // --- Feedback modal functions (ported from project.js) ---
        var projectFeedbackModalEl = document.getElementById("projectFeedbackModal");
        if (projectFeedbackModalEl) {
            var modalTitle = projectFeedbackModalEl.querySelector(".feedback-modal-title");
            var modalBody = projectFeedbackModalEl.querySelector(".feedback-modal-body");

            function getProjectFeedbackFooter() {
                try {
                    return (
                        projectFeedbackModalEl.querySelector(".feedback-modal-footer") ||
                        projectFeedbackModalEl.querySelector(".modal-footer") ||
                        projectFeedbackModalEl.querySelector(".modal-footer-custom")
                    );
                } catch (_) {
                    return null;
                }
            }

            function resetAddFeedbackButton() {
                const footer = getProjectFeedbackFooter();
                if (footer) {
                    try {
                        footer.innerHTML = "";
                        const addBtn = document.createElement("button");
                        addBtn.type = "button";
                        addBtn.className = "btn btn-submit-black w-100";
                        addBtn.id = "addFeedbackButton";
                        addBtn.textContent = "Add Feedback";
                        addBtn.addEventListener("click", function () {
                            const projectId = projectFeedbackModalEl.getAttribute("data-project-id");
                            if (projectId) showAddFeedbackForm(projectId);
                        });
                        footer.appendChild(addBtn);
                    } catch (_) {}
                } else {
                    try {
                        const addFeedbackButton = document.getElementById("addFeedbackButton");
                        if (addFeedbackButton) {
                            addFeedbackButton.textContent = "Add Feedback";
                            addFeedbackButton.classList.add("w-100");
                            const fresh = addFeedbackButton.cloneNode(true);
                            addFeedbackButton.parentNode.replaceChild(fresh, addFeedbackButton);
                            fresh.addEventListener("click", function () {
                                const projectId = projectFeedbackModalEl.getAttribute("data-project-id");
                                if (projectId) showAddFeedbackForm(projectId);
                            });
                        }
                    } catch (_) {}
                }
            }

            function showFloatingAlertFallback(message, type, delay) {
                try {
                    alert(typeof message === 'string' ? message.replace(/<[^>]+>/g, '') : String(message));
                } catch (e) {}
            }
            if (typeof window.showFloatingAlert !== 'function') {
                window.showFloatingAlert = showFloatingAlertFallback;
            }

            function showImageModal(imageSrc) {
                window.open(imageSrc, "_blank");
            }

            function loadFeedbackData(projectId) {
                if (!modalTitle || !modalBody) return;
                modalTitle.textContent = "Feedback";
                modalBody.innerHTML = '<div class="text-center my-4"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';
                resetAddFeedbackButton();

                fetch(getMeta('app-url').replace(/\/$/, '') + "/project-feedbacks/" + projectId)
                    .then(function (response) {
                        if (!response.ok) throw new Error('Failed to fetch feedback data');
                        return response.json();
                    })
                    .then(function (data) {
                        modalBody.innerHTML = '';
                        // current employee id (used to show Edit for own feedback/reply)
                        var currentEmployeeId = (projectFeedbackModalEl.getAttribute('data-employee-id') || '');
                        function getOwnerId(item) {
                            try {
                                if (!item) return '';
                                if (item.employee) {
                                    return String(item.employee.id || item.employee.employee_id || item.employee.user_id || '');
                                }
                                if (item.employee_id) return String(item.employee_id);
                                if (item.employee_user_id) return String(item.employee_user_id);
                                return '';
                            } catch (_) { return ''; }
                        }
                        var dialogEl = projectFeedbackModalEl.closest('.modal-dialog');
                        if (!data.data || data.data.length === 0) {
                            modalBody.innerHTML = '<p class="text-center text-muted">No feedback available for this project.</p>';
                            if (dialogEl) dialogEl.classList.add('compact');
                            return;
                        } else {
                            if (dialogEl) dialogEl.classList.remove('compact');
                        }

                        data.data.forEach(function (feedback) {
                            var feedbackItem = document.createElement('div');
                            feedbackItem.className = 'feedback-item mb-3 p-3 border-bottom';
                            if (feedback && feedback.id != null) feedbackItem.setAttribute('data-feedback-id', String(feedback.id));

                            var headerDiv = document.createElement('div');
                            headerDiv.className = 'd-flex align-items-center mb-2';

                            var img = document.createElement('img');
                            (function () {
                                var emp = feedback.employee || {};
                                var raw = emp.user_photo || emp.profile_picture || emp.photo || feedback.employee_photo || '';
                                var url = '';
                                if (typeof raw === 'string' && raw.length > 0) {
                                    if (raw.startsWith('http')) url = raw;
                                    else if (raw.startsWith('/')) url = getMeta('app-url') + raw;
                                    else if (raw.indexOf('/') !== -1) url = getMeta('app-url') + '/' + raw;
                                    else url = getMeta('app-url') + '/file/profile_picture/' + raw;
                                } else {
                                    url = getMeta('app-url') + '/asset/img/avatar.png';
                                }
                                img.src = url;
                            })();
                            img.alt = 'Employee Photo';
                            img.className = 'feedback-employee-photo me-2 rounded-circle';
                            img.style.width = '40px';
                            img.style.height = '40px';

                            var infoDiv = document.createElement('div');
                            var nameRow = document.createElement('div');
                            nameRow.className = 'd-flex align-items-center';
                            var nameStrong = document.createElement('strong');
                            nameStrong.textContent = (feedback.employee && feedback.employee.name) || feedback.employee_name || 'Unknown';
                            nameRow.appendChild(nameStrong);

                            var dateDiv = document.createElement('div');
                            dateDiv.className = 'text-muted small';
                            if (feedback.created_at) {
                                var d = new Date(feedback.created_at);
                                var now = new Date();
                                function isSameDay(d1, d2) { return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate(); }
                                function isYesterday(d1, d2) { var y = new Date(d2); y.setDate(d2.getDate() - 1); return isSameDay(d1, y); }
                                if (isSameDay(d, now)) dateDiv.textContent = d.toLocaleTimeString(undefined, {hour:'2-digit', minute:'2-digit'});
                                else if (isYesterday(d, now)) dateDiv.textContent = 'yesterday';
                                else dateDiv.textContent = d.toLocaleDateString(undefined, {year:'numeric', month:'long', day:'numeric'});
                            }

                            var roleDiv = document.createElement('div');
                            roleDiv.className = 'text-muted small';
                            roleDiv.textContent = (feedback.division ? feedback.division + ' | ' : '') + (feedback.role || '');

                            infoDiv.appendChild(nameRow);
                            infoDiv.appendChild(dateDiv);
                            infoDiv.appendChild(roleDiv);

                            var leftWrap = document.createElement('div');
                            leftWrap.className = 'd-flex align-items-center';
                            leftWrap.appendChild(img);
                            leftWrap.appendChild(infoDiv);
                            headerDiv.appendChild(leftWrap);

                            var commentDiv = document.createElement('div');
                            commentDiv.className = 'feedback-comment mb-2';
                            commentDiv.textContent = feedback.feedback_comment || '';

                            var mediaDiv = document.createElement('div');
                            mediaDiv.className = 'feedback-media mt-2';

                            // Reference URLs
                            (function () {
                                var urls = [];
                                if (Array.isArray(feedback.reference_urls)) urls = feedback.reference_urls;
                                else if (feedback.reference_urls && typeof feedback.reference_urls === 'string') {
                                    try { var arr = JSON.parse(feedback.reference_urls); if (Array.isArray(arr)) urls = arr; } catch (_) {}
                                }
                                if ((!urls || urls.length === 0) && feedback.reference_url) urls = [feedback.reference_url];
                                if (urls && urls.length) {
                                    var refContainer = document.createElement('div');
                                    refContainer.className = 'feedback-reference-container';
                                    urls.forEach(function (u, idx) {
                                        var a = document.createElement('a');
                                        a.href = u; a.target = '_blank'; a.className = 'feedback-reference-url me-2';
                                        a.innerHTML = '<span class="material-symbols-outlined">link</span> Link ' + (idx + 1);
                                        refContainer.appendChild(a);
                                    });
                                    mediaDiv.appendChild(refContainer);
                                }
                            })();

                            // Reference files
                            (function () {
                                var files = [];
                                var rf = feedback.reference_files;
                                if (!Array.isArray(rf) && typeof rf === 'string') {
                                    try { var arr = JSON.parse(rf); if (Array.isArray(arr)) rf = arr; } catch (_) {}
                                }
                                if (Array.isArray(rf) && rf.length) files = rf; else if (feedback.reference_file) files = [feedback.reference_file];
                                if (files && files.length) {
                                    var refContainer = document.createElement('div');
                                    refContainer.className = 'feedback-reference-container mb-3';
                                    files.forEach(function (file, idx) {
                                        if (!file) return;
                                        var fileHref = file;
                                        if (fileHref && !(String(fileHref).startsWith('http') || String(fileHref).startsWith('/'))) fileHref = getMeta('app-url').replace(/\/$/, '') + '/file/project/' + fileHref;
                                        else if (fileHref && String(fileHref).startsWith('/')) fileHref = getMeta('app-url').replace(/\/$/, '') + fileHref;
                                        var a = document.createElement('a');
                                        a.href = fileHref; a.download = ''; a.className = 'feedback-reference-file';
                                        a.innerHTML = '<span class="material-symbols-outlined">draft</span> FILE ' + (idx + 1);
                                        refContainer.appendChild(a);
                                    });
                                    mediaDiv.appendChild(refContainer);
                                }
                            })();

                            if (feedback.image) {
                                var feedbackImage = document.createElement('img');
                                var imgSrc = feedback.image;
                                if (imgSrc && !(String(imgSrc).startsWith('http') || String(imgSrc).startsWith('/'))) imgSrc = getMeta('app-url').replace(/\/$/, '') + '/file/project/' + imgSrc;
                                else if (imgSrc && String(imgSrc).startsWith('/')) imgSrc = getMeta('app-url').replace(/\/$/, '') + imgSrc;
                                feedbackImage.src = imgSrc; feedbackImage.alt = 'Feedback Image';
                                feedbackImage.className = 'feedback-image me-2 mb-4';
                                feedbackImage.style.maxWidth = '150px'; feedbackImage.style.maxHeight = '150px'; feedbackImage.style.borderRadius = '8px'; feedbackImage.style.cursor = 'pointer';
                                feedbackImage.addEventListener('click', function () { showImageModal(feedbackImage.src); });
                                mediaDiv.appendChild(feedbackImage);
                            }

                            var actionsDiv = document.createElement('div');
                            actionsDiv.className = 'feedback-actions mt-2 d-flex gap-3';

                            // Reply & Edit buttons (Edit should be on the left, Reply on the right)
                            var replyWrapper = document.createElement('span');
                            replyWrapper.className = 'd-flex align-items-center';
                            replyWrapper.style.cssText = 'cursor:pointer; color:#555; font-size:12px;';
                            var replyIcon = document.createElement('span'); replyIcon.className = 'material-symbols-outlined feedback-reply-trigger'; replyIcon.style.cssText = 'font-size:18px; line-height:1; margin-right:5px;'; replyIcon.textContent = 'reply';
                            var replyText = document.createElement('span'); replyText.textContent = 'Reply';
                            replyWrapper.appendChild(replyIcon); replyWrapper.appendChild(replyText);
                            replyWrapper.addEventListener('click', function () { showReplyFeedbackForm(projectId, feedback.id); });

                            try {
                                var ownerId = getOwnerId(feedback);
                                if (ownerId && String(ownerId) === String(currentEmployeeId)) {
                                    var editWrapper = document.createElement('span');
                                    editWrapper.className = 'd-flex align-items-center';
                                    editWrapper.style.cssText = 'cursor:pointer; color:#555; font-size:12px;';
                                    var editIcon = document.createElement('span'); editIcon.className = 'material-symbols-outlined feedback-edit-trigger'; editIcon.style.cssText = 'font-size:18px; line-height:1; margin-right:5px;'; editIcon.textContent = 'edit';
                                    var editText = document.createElement('span'); editText.textContent = 'Edit';
                                    editWrapper.appendChild(editIcon); editWrapper.appendChild(editText);
                                    editWrapper.addEventListener('click', function () { showEditFeedbackForm(projectId, feedback, false); });
                                    // append edit first, then reply so Edit appears on the left
                                    actionsDiv.appendChild(editWrapper);
                                    actionsDiv.appendChild(replyWrapper);
                                } else {
                                    // only reply
                                    actionsDiv.appendChild(replyWrapper);
                                }
                            } catch (_) {
                                actionsDiv.appendChild(replyWrapper);
                            }

                            feedbackItem.appendChild(headerDiv);
                            feedbackItem.appendChild(commentDiv);
                            feedbackItem.appendChild(mediaDiv);
                            feedbackItem.appendChild(actionsDiv);

                            // Replies rendering
                            if (Array.isArray(feedback.replies) && feedback.replies.length > 0) {
                                var repliesWrap = document.createElement('div'); repliesWrap.className = 'view-replies-wrap feedback-replies-wrap mt-1';
                                var toggleBtn = document.createElement('button'); toggleBtn.type = 'button'; toggleBtn.className = 'btn btn-link p-0 view-replies-toggle feedback-toggle-replies'; toggleBtn.style.cssText = 'font-size:13px; color:#555; text-decoration:none;'; toggleBtn.textContent = 'View all replies (' + feedback.replies.length + ')';
                                var repliesContainer = document.createElement('div'); repliesContainer.className = 'feedback-replies d-none';
                                feedback.replies.forEach(function (rep) {
                                    var repDiv = document.createElement('div'); repDiv.className = 'feedback-reply ms-4 mt-2 p-2 rounded'; repDiv.style.background = '#fafafa';
                                    if (rep && rep.id != null) { repDiv.setAttribute('data-reply-id', String(rep.id)); if (feedback && feedback.id != null) repDiv.setAttribute('data-parent-id', String(feedback.id)); }
                                    var repHeader = document.createElement('div'); repHeader.className = 'd-flex align-items-center mb-1';
                                    var repImg = document.createElement('img'); (function(){ var raw = (rep.employee || {}).user_photo || (rep.employee || {}).profile_picture || (rep.employee || {}).photo || ''; var url = getMeta('app-url') + '/asset/img/avatar.png'; if (raw) { if (String(raw).startsWith('http')) url = raw; else if (String(raw).startsWith('/')) url = getMeta('app-url') + raw; else if (String(raw).indexOf('/') !== -1) url = getMeta('app-url') + '/' + raw; else url = getMeta('app-url') + '/file/profile_picture/' + raw; } repImg.src = url; })();
                                    repImg.alt = (rep.employee || {}).name || 'Employee'; repImg.className = 'rounded-circle me-2'; repImg.style.width = '24px'; repImg.style.height = '24px'; repImg.style.objectFit = 'cover';
                                    var repInfo = document.createElement('div'); var repNameRow = document.createElement('div'); repNameRow.className = 'd-flex align-items-center'; var repName = document.createElement('strong'); repName.style.fontSize = '13px'; repName.textContent = (rep.employee || {}).name || 'Unknown'; repNameRow.appendChild(repName); repInfo.appendChild(repNameRow); var repTime = document.createElement('small'); repTime.className = 'text-muted d-block'; repTime.style.fontSize = '11px'; if (rep.created_at) { var dt = new Date(rep.created_at); repTime.textContent = dt.toLocaleTimeString(undefined, {hour:'2-digit', minute:'2-digit'}); } repInfo.appendChild(repTime); repHeader.appendChild(repImg); repHeader.appendChild(repInfo);
                                    var repComment = document.createElement('p'); repComment.className = 'mb-1'; repComment.style.fontSize = '13px'; repComment.textContent = rep.feedback_comment || '';
                                    var repMedia = document.createElement('div'); repMedia.className = 'feedback-reference-container mb-1';
                                    (function(){ var urls=[]; if (Array.isArray(rep.reference_urls)) urls = rep.reference_urls; else if (rep.reference_urls && typeof rep.reference_urls === 'string') { try{ var arr = JSON.parse(rep.reference_urls); if (Array.isArray(arr)) urls = arr; } catch(_){} } if ((!urls || !urls.length) && rep.reference_url) urls = [rep.reference_url]; urls.forEach(function(u, idx){ var a = document.createElement('a'); a.href = u; a.target = '_blank'; a.className = 'feedback-reference-url me-2'; a.innerHTML = '<span class="material-symbols-outlined">link</span> Link ' + (idx+1); repMedia.appendChild(a); }); })();
                                    (function(){ var files=[]; var rf = rep.reference_files; if (!Array.isArray(rf) && typeof rf === 'string') { try{ var arr=JSON.parse(rf); if (Array.isArray(arr)) rf=arr; } catch(_){} } if (Array.isArray(rf) && rf.length) files = rf; else if (rep.reference_file) files = [rep.reference_file]; files.forEach(function(file, idx){ if(!file) return; var href = file; if (href && !(String(href).startsWith('http') || String(href).startsWith('/'))) href = getMeta('app-url').replace(/\/$/, '') + '/file/project/' + href; else if (href && String(href).startsWith('/')) href = getMeta('app-url').replace(/\/$/, '') + href; var a2 = document.createElement('a'); a2.href = href; a2.download=''; a2.className='feedback-reference-file ms-2'; a2.innerHTML = '<span class="material-symbols-outlined">draft</span> FILE ' + (idx+1); repMedia.appendChild(a2); }); })();
                                    var rImg = null; if (rep.image) { rImg = document.createElement('img'); var rsrc = rep.image; if (rsrc && !(String(rsrc).startsWith('http') || String(rsrc).startsWith('/'))) rsrc = getMeta('app-url').replace(/\/$/, '') + '/file/project/' + rsrc; else if (rsrc && String(rsrc).startsWith('/')) rsrc = getMeta('app-url').replace(/\/$/, '') + rsrc; rImg.src = rsrc; rImg.className = 'img-fluid rounded reply-image mt-1'; rImg.style.width = '70px'; rImg.style.borderRadius = '8px'; rImg.style.cursor = 'pointer'; rImg.addEventListener('click', function(){ window.open(rImg.src, '_blank'); }); }
                                    repDiv.appendChild(repHeader); repDiv.appendChild(repComment); if (rep.reference_url || (Array.isArray(rep.reference_urls) && rep.reference_urls.length) || rep.reference_file || (Array.isArray(rep.reference_files) && rep.reference_files.length)) repDiv.appendChild(repMedia); if (rImg) repDiv.appendChild(rImg);
                                    var replyActionsDiv = document.createElement('div'); replyActionsDiv.className = 'reply-actions mt-2 d-flex gap-3';
                                    var replyReplyWrapper = document.createElement('span'); replyReplyWrapper.className='d-flex align-items-center'; replyReplyWrapper.style.cssText='cursor:pointer; color:#555; font-size:12px;'; var replyToReplyIcon = document.createElement('span'); replyToReplyIcon.className='material-symbols-outlined feedback-reply-trigger'; replyToReplyIcon.style.cssText='font-size:18px; line-height:1; margin-right:5px;'; replyToReplyIcon.textContent='reply'; var replyReplyText = document.createElement('span'); replyReplyText.textContent='Reply'; replyReplyWrapper.appendChild(replyToReplyIcon); replyReplyWrapper.appendChild(replyReplyText); replyReplyWrapper.addEventListener('click', function(){ showReplyFeedbackForm(projectId, feedback.id); });
                                    try {
                                        var repOwnerId = getOwnerId(rep);
                                        if (repOwnerId && String(repOwnerId) === String(currentEmployeeId)) {
                                            var editRepWrapper = document.createElement('span');
                                            editRepWrapper.className = 'd-flex align-items-center';
                                            editRepWrapper.style.cssText = 'cursor:pointer; color:#555; font-size:12px;';
                                            var editRepIcon = document.createElement('span'); editRepIcon.className = 'material-symbols-outlined feedback-edit-trigger'; editRepIcon.style.cssText = 'font-size:18px; line-height:1; margin-right:5px;'; editRepIcon.textContent = 'edit';
                                            var editRepText = document.createElement('span'); editRepText.textContent = 'Edit';
                                            editRepWrapper.appendChild(editRepIcon); editRepWrapper.appendChild(editRepText);
                                            editRepWrapper.addEventListener('click', function(){ showEditFeedbackForm(projectId, rep, true); });
                                            // append edit first then reply so Edit is left
                                            replyActionsDiv.appendChild(editRepWrapper);
                                            replyActionsDiv.appendChild(replyReplyWrapper);
                                        } else {
                                            replyActionsDiv.appendChild(replyReplyWrapper);
                                        }
                                    } catch(_) { replyActionsDiv.appendChild(replyReplyWrapper); }
                                    repDiv.appendChild(replyActionsDiv);
                                    repliesContainer.appendChild(repDiv);
                                });
                                repliesWrap.appendChild(toggleBtn); repliesWrap.appendChild(repliesContainer); feedbackItem.appendChild(repliesWrap);
                                toggleBtn.addEventListener('click', function(){ var hidden = repliesContainer.classList.contains('d-none'); if (hidden) { repliesContainer.classList.remove('d-none'); this.textContent = 'Hide replies'; } else { repliesContainer.classList.add('d-none'); this.textContent = 'View all replies (' + feedback.replies.length + ')'; } this.style.textDecoration='none'; this.style.color='#555'; });
                            }

                            modalBody.appendChild(feedbackItem);
                        });

                        // scroll to target if any (kept minimal)
                        try {
                            var pidKey = String(projectId);
                            var target = (window.__projectLatestTarget && window.__projectLatestTarget[pidKey]) || null;
                            if (target) {
                                delete window.__projectLatestTarget[pidKey];
                                var isReply = target.parent_id != null && target.parent_id !== '';
                                if (isReply) {
                                    var parentEl = modalBody.querySelector('.feedback-item[data-feedback-id="' + target.parent_id + '"]');
                                    if (parentEl) {
                                        var container = parentEl.querySelector('.feedback-replies');
                                        var toggle = parentEl.querySelector('.feedback-toggle-replies');
                                        if (container && container.classList.contains('d-none')) { if (toggle) try{ toggle.click(); } catch(_) { container.classList.remove('d-none'); } else container.classList.remove('d-none'); }
                                        var replyEl = parentEl.querySelector('.feedback-reply[data-reply-id="' + target.id + '"]'); if (replyEl) { replyEl.scrollIntoView({behavior:'smooth', block:'center'}); var oldBg = replyEl.style.backgroundColor; replyEl.style.transition = 'background-color 0.6s ease'; replyEl.style.backgroundColor = '#fff9c4'; setTimeout(function(){ replyEl.style.backgroundColor = oldBg || ''; }, 1200); }
                                    }
                                } else {
                                    var topEl = modalBody.querySelector('.feedback-item[data-feedback-id="' + target.id + '"]'); if (topEl) { topEl.scrollIntoView({behavior:'smooth', block:'center'}); var oldBg = topEl.style.backgroundColor; topEl.style.transition = 'background-color 0.6s ease'; topEl.style.backgroundColor = '#fff9c4'; setTimeout(function(){ topEl.style.backgroundColor = oldBg || ''; }, 1200); }
                                }
                            }
                        } catch (_) {}

                    })
                    .catch(function (error) {
                        modalBody.innerHTML = '<div class="text-center text-muted">Failed to load feedback data.</div>';
                        if (typeof window.showFloatingAlert === 'function') window.showFloatingAlert('Error loading feedback data. Please try again.', 'warning', 3500);
                        console.error('Error fetching feedback data:', error);
                    });
            }

            function showAddFeedbackForm(projectId) {
                modalTitle.textContent = 'Add Feedback';
                modalBody.innerHTML = "" +
                    '<form id="addFeedbackForm" enctype="multipart/form-data">' +
                    '<input type="hidden" name="project_id" value="' + projectId + '">' +
                    '<input type="hidden" name="employee_id" value="' + (projectFeedbackModalEl.getAttribute('data-employee-id') || '') + '">' +
                    '<input type="hidden" name="parent_id" value="">' +
                    '<div class="mb-3">' +
                    '<label class="form-label">Upload Image</label>' +
                    '<div class="image-upload-container">' +
                    '<label for="feedback_image" class="custom-image-upload position-relative" id="feedbackImageLabel" style="background-position: center center; background-repeat: no-repeat; background-size: 50%; background-image: url(\'' + getMeta('app-url').replace(/\/$/, '') + '/asset/img/background/add-image.png\'); cursor: pointer;">' +
                    '<input type="file" id="feedback_image" name="feedback_image" accept="image/*" class="d-none">' +
                    '<span class="image-clear-btn d-none" id="feedbackImageClearBtn" title="Remove image">&times;</span>' +
                    '</label>' +
                    '</div>' +
                    '</div>' +
                    '<div class="mb-3 input-custom">' +
                    '<label for="feedback_comment" class="form-label">Feedback Comment</label>' +
                    '<textarea class="form-control" id="feedback_comment" name="feedback_comment" rows="3" required></textarea>' +
                    '</div>' +
                    '<div class="mb-3 input-custom">' +
                    '<label class="form-label">Reference URLs (Optional)</label>' +
                    '<div id="feedback_reference_urls_container" class="d-flex flex-column gap-2">' +
                    '<div class="d-flex gap-2 align-items-center">' +
                    '<input type="url" class="form-control input-text" name="reference_urls[]" placeholder="https://example.com">' +
                    '<button type="button" class="btn btn-submit-black add-ref-url" aria-label="Add URL"><span class="material-symbols-outlined">add</span></button>' +
                    '</div>' +
                    '</div>' +
                    '</div>' +
                    '<div class="mb-3 input-custom">' +
                    '<label for="feedback_reference_files" class="form-label">Reference Files (Optional)</label>' +
                    '<input type="file" class="form-control" id="feedback_reference_files" name="reference_files[]" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip">' +
                    '<div id="feedback_reference_files_preview" class="mt-2"></div>' +
                    '</div>' +
                    '</form>';

                // image preview
                try {
                    var imageInput = modalBody.querySelector('#feedback_image');
                    var imageLabel = modalBody.querySelector('#feedbackImageLabel');
                    var imageClearBtn = modalBody.querySelector('#feedbackImageClearBtn');
                    if (imageInput && imageLabel && imageClearBtn) {
                        imgInput.addEventListener('change', function () {
                            if (this.files && this.files[0]) {
                                var reader = new FileReader();
                                reader.onload = function (e) {
                                    imageLabel.style.backgroundImage = "url('" + e.target.result + "')";
                                    imageLabel.classList.add('has-image');
                                    imageLabel.style.backgroundSize = 'cover';
                                    imageLabel.style.opacity = '1';
                                        imgClearBtn.classList.remove('d-none');
                                        // reset remove flag when user selects a new file
                                        try { var editRemove = modalBody.querySelector('#edit_remove_image'); if (editRemove) editRemove.value = '0'; } catch(_){ }
                                };
                                reader.readAsDataURL(this.files[0]);
                            }
                        });
                        imageClearBtn.addEventListener('click', function (e) {
                            e.preventDefault();
                            imageInput.value = '';
                            imageLabel.style.backgroundImage = "url('" + getMeta('app-url').replace(/\/$/, '') + "/asset/img/background/add-image.png')";
                            imageLabel.style.backgroundPosition = 'center center';
                            imageLabel.style.backgroundRepeat = 'no-repeat';
                            imageLabel.style.backgroundSize = 'cover';
                            imageLabel.classList.remove('has-image');
                            imageLabel.style.opacity = '0.5';
                            imageClearBtn.classList.add('d-none');

                            // tambahan penting
                            var hidden = modalBody.querySelector('#edit_remove_image');
                            if (hidden) hidden.value = '1';
                        });
                    }
                } catch (_) {}

                // file preview list for add form
                (function () {
                    try {
                        window.addFeedbackSelectedFiles = [];
                        var input = modalBody.querySelector('#feedback_reference_files');
                        var preview = modalBody.querySelector('#feedback_reference_files_preview');
                        if (!input || !preview) return;
                        function render() {
                            preview.innerHTML = '';
                            if (!window.addFeedbackSelectedFiles.length) return;
                            var list = document.createElement('div'); list.className = 'selected-files-list mt-2';
                            window.addFeedbackSelectedFiles.forEach(function (file, idx) {
                                var item = document.createElement('div'); item.className = 'selected-file-item d-flex align-items-center justify-content-between mb-2 p-2 bg-light border rounded';
                                var info = document.createElement('div'); info.className = 'd-flex align-items-center flex-grow-1';
                                var icon = document.createElement('span'); icon.className = 'material-symbols-outlined me-2'; icon.textContent = 'description';
                                var name = document.createElement('span'); name.textContent = file.name; name.className = 'file-name';
                                var size = document.createElement('small'); size.className = 'text-muted ms-1'; size.textContent = ' (' + ((file.size/1024/1024).toFixed(2)) + ' MB)';
                                var rm = document.createElement('button'); rm.type = 'button'; rm.className = 'btn btn-sm btn-outline-danger'; rm.innerHTML = '&times;'; rm.onclick = function () { window.addFeedbackSelectedFiles.splice(idx,1); render(); };
                                info.appendChild(icon); info.appendChild(name); info.appendChild(size); item.appendChild(info); item.appendChild(rm); list.appendChild(item);
                            });
                            preview.appendChild(list);
                        }
                        input.addEventListener('change', function () { var files = Array.from(this.files || []); window.addFeedbackSelectedFiles = window.addFeedbackSelectedFiles.concat(files); render(); this.value = ''; });
                    } catch (_) {}
                })();

                // change footer button text to Submit
                try {
                    var addFeedbackButton = document.getElementById('addFeedbackButton');
                    if (addFeedbackButton) addFeedbackButton.textContent = 'Submit';
                    var newButton = addFeedbackButton.cloneNode(true); addFeedbackButton.parentNode.replaceChild(newButton, addFeedbackButton);
                    newButton.addEventListener('click', function (e) { e.preventDefault(); var form = document.getElementById('addFeedbackForm'); if (form) submitFeedbackForm(form, projectId); });
                } catch (_) {}
                // arrange close/submit layout
                (function () {
                    try {
                        var footer = getProjectFeedbackFooter(); if (!footer) return; var submitBtnRef = document.getElementById('addFeedbackButton'); if (!submitBtnRef) return; submitBtnRef.classList.remove('w-100'); submitBtnRef.classList.add('flex-grow-1'); var oldWrapper = footer.querySelector('#feedbackFormButtonsWrapper'); if (oldWrapper) oldWrapper.remove(); var wrap = document.createElement('div'); wrap.id='feedbackFormButtonsWrapper'; wrap.className='d-flex gap-2 w-100'; var closeBtn = document.createElement('button'); closeBtn.id='replyCloseButton'; closeBtn.type='button'; closeBtn.className='btn btn-close-reply flex-grow-1'; closeBtn.textContent='Close'; closeBtn.addEventListener('click', function(){ try { footer.innerHTML=''; var restore = document.createElement('button'); restore.type='button'; restore.className='btn btn-submit-black w-100'; restore.id='addFeedbackButton'; restore.textContent='Add Feedback'; restore.addEventListener('click', function(){ showAddFeedbackForm(projectId); }); footer.appendChild(restore); } catch(_){} loadFeedbackData(projectId); }); wrap.appendChild(closeBtn); wrap.appendChild(submitBtnRef); footer.innerHTML=''; footer.appendChild(wrap);
                    } catch (_) {}
                })();
            }

            function submitFeedbackForm(form, projectId) {
                var submitBtn = document.getElementById('addFeedbackButton');
                var originalBtnText = submitBtn ? submitBtn.innerHTML : '';
                if (submitBtn) { submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Submitting...'; submitBtn.disabled = true; }
                var formData = new FormData(form);
                try { var urlInputs = form.querySelectorAll('input[name="reference_urls[]"]'); var urls = Array.from(urlInputs).map(function(i){ return (i.value||'').trim(); }).filter(Boolean); if (urls.length) formData.set('reference_url', urls[0]); } catch(_){}
                try {
                    if (window.addFeedbackSelectedFiles && window.addFeedbackSelectedFiles.length) {
                        window.addFeedbackSelectedFiles.forEach(function(f){ formData.append('reference_files[]', f); });
                    } else {
                        var rfInput = form.querySelector('#feedback_reference_files'); if (rfInput && rfInput.files && rfInput.files.length) Array.from(rfInput.files).forEach(function(f){ formData.append('reference_files[]', f); });
                    }
                } catch(_){}

                fetch(getMeta('app-url').replace(/\/$/, '') + '/project-feedbacks', {
                    method: 'POST',
                    headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content') },
                    body: formData
                }).then(function (response) { if (!response.ok) return response.json().then(Promise.reject); return response.json(); })
                .then(function (data) {
                    window.showFloatingAlert(data.message || 'Feedback submitted successfully!', 'success', 1500);
                    var card = document.querySelector('[data-project-id="' + projectId + '"]'); if (card) { var fbBadge = card.querySelector('.project-feedback-count'); if (fbBadge) { var current = parseInt(fbBadge.textContent) || 0; fbBadge.textContent = current + 1; } }
                    setTimeout(function () { loadFeedbackData(projectId); form.reset(); var imageLabel = form.querySelector('#feedbackImageLabel'); var imageClearBtn = form.querySelector('#feedbackImageClearBtn'); if (imageLabel) { imageLabel.style.backgroundImage = "url('" + getMeta('app-url').replace(/\/$/, '') + "/asset/img/background/add-image.png')"; imageLabel.style.backgroundSize='50%'; imageLabel.classList.remove('has-image'); imageLabel.style.opacity='0.5'; } if (imageClearBtn) imageClearBtn.classList.add('d-none'); }, 1000);
                }).catch(function (error) {
                    var errMsg = 'Failed to submit feedback. Please try again.';
                    if (error && error.errors) errMsg = Object.values(error.errors).join('<br>'); else if (error && error.message) errMsg = error.message;
                    window.showFloatingAlert(errMsg, 'warning', 4000);
                }).finally(function () { if (submitBtn) { submitBtn.innerHTML = originalBtnText; submitBtn.disabled = false; } });
            }

            function showReplyFeedbackForm(projectId, parentId) {
                modalTitle.textContent = 'Reply Feedback';
                modalBody.innerHTML = '';
                // create form similar to project.js reply form
                // reuse showAddFeedbackForm structure but with parent_id set
                modalBody.innerHTML = '<form id="replyFeedbackForm" enctype="multipart/form-data">' +
                    '<input type="hidden" name="project_id" value="' + projectId + '">' +
                    '<input type="hidden" name="parent_id" value="' + parentId + '">' +
                    '<input type="hidden" name="employee_id" value="' + (projectFeedbackModalEl.getAttribute('data-employee-id') || '') + '">' +
                    '<div class="mb-3 input-custom">' +
                    '<label class="form-label">Upload Image</label>' +
                    '<div class="image-upload-container">' +
                    '<label for="feedback_image" class="custom-image-upload position-relative label-custom" id="feedbackImageLabel" style="background-position: center center; background-repeat: no-repeat; background-size: 50%; background-image: url(\'' + getMeta('app-url').replace(/\/$/, '') + '/asset/img/background/add-image.png\'); cursor: pointer;">' +
                    '<input type="file" id="feedback_image" name="feedback_image" accept="image/*" class="d-none">' +
                    '<span class="image-clear-btn d-none" id="feedbackImageClearBtn" title="Remove image">&times;</span>' +
                    '</label>' +
                    '</div>' +
                    '</div>' +
                    '<div class="mb-3 input-custom">' +
                    '<label for="feedback_comment" class="form-label label-custom">Feedback Comment</label>' +
                    '<textarea class="form-control" id="feedback_comment" name="feedback_comment" rows="3" required></textarea>' +
                    '</div>' +
                    '<div class="mb-3 input-custom">' +
                    '<label class="form-label label-custom">Reference URLs (Optional)</label>' +
                    '<div id="feedback_reference_urls_container" class="d-flex flex-column gap-2">' +
                    '<div class="d-flex gap-2 align-items-center">' +
                    '<input type="url" class="form-control input-text" name="reference_urls[]" placeholder="https://example.com">' +
                    '<button type="button" class="btn btn-submit-black add-ref-url" aria-label="Add URL"><span class="material-symbols-outlined">add</span></button>' +
                    '</div>' +
                    '</div>' +
                    '</div>' +
                    '<div class="mb-3 input-custom">' +
                    '<label for="reply_reference_files" class="form-label label-custom">Reference Files (Optional)</label>' +
                    '<input type="file" class="form-control" id="reply_reference_files" name="reference_files[]" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip">' +
                    '<div id="reply_reference_files_preview" class="mt-2"></div>' +
                    '</div>' +
                    '</form>';

                // image + file preview + submit handler
                (function () {
                    try {
                        window.replyFeedbackSelectedFiles = [];
                        var input = modalBody.querySelector('#reply_reference_files');
                        var preview = modalBody.querySelector('#reply_reference_files_preview');
                        if (input && preview) {
                            function render() { preview.innerHTML = ''; if (!window.replyFeedbackSelectedFiles.length) return; var list = document.createElement('div'); list.className = 'selected-files-list mt-2'; window.replyFeedbackSelectedFiles.forEach(function(file, idx){ var item = document.createElement('div'); item.className='selected-file-item d-flex align-items-center justify-content-between mb-2 p-2 bg-light border rounded'; var info = document.createElement('div'); info.className='d-flex align-items-center flex-grow-1'; var icon = document.createElement('span'); icon.className='material-symbols-outlined me-2'; icon.textContent='description'; var name = document.createElement('span'); name.className='file-name'; name.textContent=file.name; var size = document.createElement('small'); size.className='text-muted ms-1'; size.textContent=' ('+((file.size/1024/1024).toFixed(2))+' MB)'; var rm = document.createElement('button'); rm.type='button'; rm.className='btn btn-sm btn-outline-danger'; rm.innerHTML='&times;'; rm.onclick = function(){ window.replyFeedbackSelectedFiles.splice(idx,1); render(); }; info.appendChild(icon); info.appendChild(name); info.appendChild(size); item.appendChild(info); item.appendChild(rm); list.appendChild(item); }); preview.appendChild(list); }
                            input.addEventListener('change', function(){ var files = Array.from(this.files || []); window.replyFeedbackSelectedFiles = window.replyFeedbackSelectedFiles.concat(files); render(); this.value=''; });
                        }
                    } catch (_) {}
                })();

                    try {
                        var imageInput = modalBody.querySelector('#feedback_image');
                        var imageLabel = modalBody.querySelector('#feedbackImageLabel');
                        var imageClearBtn = modalBody.querySelector('#feedbackImageClearBtn');
                        if (imageInput && imageLabel && imageClearBtn) {
                            imageInput.addEventListener('change', function () {
                                if (this.files && this.files[0]) {
                                    var reader = new FileReader();
                                    reader.onload = function (e) {
                                        imageLabel.style.backgroundImage = "url('" + e.target.result + "')";
                                        imageLabel.classList.add('has-image');
                                        imageLabel.style.backgroundSize = 'cover';
                                        imageLabel.style.opacity = '1';
                                        imageClearBtn.classList.remove('d-none');
                                    };
                                    reader.readAsDataURL(this.files[0]);
                                }
                            });
                            imageClearBtn.addEventListener('click', function (e) {
                                e.preventDefault();
                                imageInput.value = '';
                                imageLabel.style.backgroundImage = "url('" + getMeta('app-url').replace(/\/$/, '') + "/asset/img/background/add-image.png')";
                                imageLabel.style.backgroundPosition = 'center center';
                                imageLabel.style.backgroundRepeat = 'no-repeat';
                                imageLabel.style.backgroundSize = '50%';
                                imageLabel.classList.remove('has-image');
                                imageLabel.style.opacity = '0.5';
                                imageClearBtn.classList.add('d-none');
                            });
                        }
                    } catch (_) {}

                try {
                    var addBtn = document.getElementById('addFeedbackButton'); if (addBtn) { addBtn.textContent = 'Submit'; var fresh = addBtn.cloneNode(true); addBtn.parentNode.replaceChild(fresh, addBtn); fresh.addEventListener('click', function(e){ e.preventDefault(); var form = document.getElementById('replyFeedbackForm'); if (!form) return; var fd = new FormData(form); try { var urlInputs = form.querySelectorAll('input[name="reference_urls[]"]'); var urls = Array.from(urlInputs).map(function(i){return (i.value||'').trim();}).filter(Boolean); if (urls.length) fd.set('reference_url', urls[0]); } catch(_){} try { if (window.replyFeedbackSelectedFiles && window.replyFeedbackSelectedFiles.length) { window.replyFeedbackSelectedFiles.forEach(function(f){ fd.append('reference_files[]', f); }); } else { var rfInput = form.querySelector('#reply_reference_files'); if (rfInput && rfInput.files && rfInput.files.length) Array.from(rfInput.files).forEach(function(f){ fd.append('reference_files[]', f); }); } } catch(_){} fetch(getMeta('app-url').replace(/\/$/, '') + '/project-feedbacks', { method: 'POST', headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content') }, body: fd }).then(function(r){ return r.ok ? r.json() : r.json().then(Promise.reject); }).then(function(res){ window.showFloatingAlert(res.message || 'Reply submitted', 'success', 1500); loadFeedbackData(projectId); }).catch(function(err){ var msg = (err && (err.message || (err.errors && Object.values(err.errors).join('\n')))) || 'Failed to submit reply'; window.showFloatingAlert(msg, 'warning', 3500); }); }); }
                } catch (_) {}

                (function () { try { var footer = getProjectFeedbackFooter(); if (!footer) return; var submitBtnRef = document.getElementById('addFeedbackButton'); if (!submitBtnRef) return; submitBtnRef.classList.remove('w-100'); submitBtnRef.classList.add('flex-grow-1'); var oldWrapper = footer.querySelector('#feedbackFormButtonsWrapper'); if (oldWrapper) oldWrapper.remove(); var wrap = document.createElement('div'); wrap.id='feedbackFormButtonsWrapper'; wrap.className='d-flex gap-2 w-100'; var closeBtn = document.createElement('button'); closeBtn.id='replyCloseButton'; closeBtn.type='button'; closeBtn.className='btn btn-close-reply flex-grow-1'; closeBtn.textContent='Close'; closeBtn.addEventListener('click', function(){ try { footer.innerHTML=''; var restore = document.createElement('button'); restore.type='button'; restore.className='btn btn-submit-black w-100'; restore.id='addFeedbackButton'; restore.textContent='Add Feedback'; restore.addEventListener('click', function(){ showAddFeedbackForm(projectId); }); footer.appendChild(restore); } catch(_){} loadFeedbackData(projectId); }); wrap.appendChild(closeBtn); wrap.appendChild(submitBtnRef); footer.innerHTML=''; footer.appendChild(wrap); } catch(_){} })();
            }

            function showEditFeedbackForm(projectId, data, isReply) {
                modalTitle.textContent = isReply ? 'Edit Reply' : 'Edit Feedback';
                // determine existing image from various possible fields and normalize to full URL
                var existingImgRaw = (data && (data.image || data.image_url || data.image_path || data.imageUrl || data.image_url_full)) || '';
                // detect explicit clear flags coming from server-side (treat as no image)
                var removeFlag = false;
                try {
                    if (data && (data.remove_image === 1 || data.remove_image === '1' || data.remove_image === true)) removeFlag = true;
                    if (data && (data.removeImage === 1 || data.removeImage === '1' || data.removeImage === true)) removeFlag = true;
                } catch (_) { removeFlag = false; }
                function toFullImageUrl(v) {
                    if (!v) return '';
                    try {
                        var s = String(v);
                        if (s.startsWith('http://') || s.startsWith('https://')) return s;
                        if (s.startsWith('/')) return getMeta('app-url').replace(/\/$/, '') + s;
                        return getMeta('app-url').replace(/\/$/, '') + '/file/project/' + s.replace(/^\//, '');
                    } catch (_) { return String(v); }
                }
                var existingImg = toFullImageUrl(existingImgRaw || '');
                var hasExistingImage = existingImg && !removeFlag;
                var bgStyle = hasExistingImage ? "background-image: url('" + existingImg + "'); background-size: cover; opacity: 1;" : "background-image: url('" + getMeta('app-url').replace(/\/$/, '') + "/asset/img/background/add-image.png'); background-size: 50%; opacity: 0.5;";
                var clearClass = hasExistingImage ? '' : 'd-none';
                modalBody.innerHTML = '';
                // include a hidden remove flag so clearing the image signals backend to delete it
                var initialRemoveFlag = removeFlag ? '1' : '0';
                modalBody.innerHTML = '<form id="editFeedbackForm" enctype="multipart/form-data">' + (data.parent_id ? ('<input type="hidden" name="parent_id" value="' + data.parent_id + '">') : '') +
                    '<div class="mb-3 input-custom">' +
                    '<label class="form-label label-custom">Upload Image</label>' +
                    '<div class="image-upload-container">' +
                    '<label for="feedback_image" class="custom-image-upload position-relative" id="editFeedbackImageLabel" style="background-position: center center; background-repeat: no-repeat; ' + bgStyle + ' cursor: pointer;">' +
                    '<input type="file" id="feedback_image" name="feedback_image" accept="image/*" class="d-none">' +
                    // hidden flag used by backend: remove_image=1 means delete existing image
                    '<input type="hidden" id="edit_remove_image" name="remove_image" value="' + initialRemoveFlag + '">' +
                    '<span class="image-clear-btn ' + clearClass + '" id="editFeedbackImageClearBtn" title="Remove image">&times;</span>' +
                    '</label>' +
                    '</div>' +
                    '</div>' +
                    '<div class="mb-3 input-custom">' +
                    '<label for="feedback_comment" class="form-label label-custom">Feedback Comment</label>' +
                    '<textarea class="form-control" id="feedback_comment" name="feedback_comment" rows="3" required>' + (data.feedback_comment || '') + '</textarea>' +
                    '</div>' +
                    '<div class="mb-3 input-custom">' +
                    '<label class="form-label label-custom">Reference URLs (Optional)</label>' +
                    '<div id="feedback_reference_urls_container" class="d-flex flex-column gap-2"></div>' +
                    '</div>' +
                    '<div class="mb-3 input-custom">' +
                    '<label for="edit_reference_files" class="form-label label-custom">Reference Files (Optional)</label>' +
                    '<input type="file" class="form-control" id="edit_reference_files" name="reference_files[]" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip">' +
                    '<input type="hidden" id="existing_feedback_reference_files_input" name="existing_reference_files" value="[]">' +
                    '<div id="existing_feedback_reference_files" class="mt-2 d-flex flex-wrap gap-2"></div>' +
                    '<div id="edit_feedback_reference_files_preview" class="mt-2"></div>' +
                    '</div>' +
                    '</form>';

                // image preview and clear handlers for edit feedback (ensure existing image shows and can be changed/cleared)
                try {
                    var imgInput = modalBody.querySelector('#feedback_image');
                    var imgLabel = modalBody.querySelector('#editFeedbackImageLabel');
                    var imgClearBtn = modalBody.querySelector('#editFeedbackImageClearBtn');
                    if (imgInput && imgLabel && imgClearBtn) {
                        imgInput.addEventListener('change', function () {
                            if (this.files && this.files[0]) {
                                var reader = new FileReader();
                                reader.onload = function (e) {
                                    imgLabel.style.backgroundImage = "url('" + e.target.result + "')";
                                    imgLabel.classList.add('has-image');
                                    imgLabel.style.backgroundSize = 'cover';
                                    imgLabel.style.opacity = '1';
                                    imgClearBtn.classList.remove('d-none');
                                };
                                reader.readAsDataURL(this.files[0]);
                            }
                        });
                        imgClearBtn.addEventListener('click', function (e) {
                            e.preventDefault();
                            try { imgInput.value = ''; } catch(_) {}

                            // ubah preview jadi default
                            imgLabel.style.backgroundImage = "url('" + getMeta('app-url').replace(/\/$/, '') + "/asset/img/background/add-image.png')";
                            imgLabel.style.backgroundPosition = 'center center';
                            imgLabel.style.backgroundRepeat = 'no-repeat';
                            imgLabel.style.backgroundSize = '50%';
                            imgLabel.classList.remove('has-image');
                            imgLabel.style.opacity = '0.5';
                            imgClearBtn.classList.add('d-none');

                            // ini yang penting: flag backend
                            var hidden = modalBody.querySelector('#edit_remove_image');
                            if (hidden) hidden.value = '1';
                        });
                    }
                    var addBtn = document.getElementById('addFeedbackButton');
                    if (addBtn) {
                        addBtn.textContent = 'Update';
                        var fresh = addBtn.cloneNode(true);
                        addBtn.parentNode.replaceChild(fresh, addBtn);
                            fresh.addEventListener('click', function (e) {
                            e.preventDefault();
                            var form = document.getElementById('editFeedbackForm');
                            if (!form) return;
                            var fd = new FormData(form);
                            try { var urlInputs = form.querySelectorAll('input[name="reference_urls[]"]'); var urls = Array.from(urlInputs).map(function(i){ return (i.value||'').trim(); }).filter(Boolean); if (urls.length) fd.set('reference_url', urls[0]); else fd.set('reference_url', ''); } catch(_){}
                            try {
                                var existingHidden = form.querySelector('#existing_feedback_reference_files_input'); var existingList = form.querySelectorAll('#existing_feedback_reference_files .existing-file-item a'); var keep = []; existingList.forEach(function(a){ var name = (a.textContent||'').trim(); if (name) keep.push(name); }); if (existingHidden) existingHidden.value = JSON.stringify(keep);
                            } catch(_){}
                            try {
                                if (window.editFeedbackSelectedFiles && window.editFeedbackSelectedFiles.length) { window.editFeedbackSelectedFiles.forEach(function(f){ fd.append('reference_files[]', f); }); } else { var rfInput = form.querySelector('#edit_reference_files'); if (rfInput && rfInput.files && rfInput.files.length) Array.from(rfInput.files).forEach(function(f){ fd.append('reference_files[]', f); }); }
                            } catch(_){}
                            // ensure remove_image flag (if present) is sent to backend
                            try { var editRemove = form.querySelector('#edit_remove_image'); if (editRemove) fd.set('remove_image', editRemove.value); } catch(_){ }
                            fd.append('_method', 'PUT');
                try { console.debug('[Feedback Edit] sending remove_image=', fd.get('remove_image')); } catch(_){}
                fetch(getMeta('app-url').replace(/\/$/, '') + '/project-feedbacks/' + data.id, { method: 'POST', headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content') }, body: fd }).then(function(r){ return r.ok ? r.json() : r.json().then(Promise.reject); }).then(function(res){ window.showFloatingAlert(res.message || 'Feedback updated', 'success', 1500);
                    // refresh list and ensure modal reflects the updated state (no image if removed)
                    try { loadFeedbackData(projectId); } catch(_){}
                    // small safety: after a short delay re-render again to avoid stale cached content
                    setTimeout(function(){ try { loadFeedbackData(projectId); } catch(_){} }, 700);
                }).catch(function(err){ var msg = (err && (err.message || (err.errors && Object.values(err.errors).join('\n')))) || 'Failed to update feedback'; window.showFloatingAlert(msg, 'warning', 3500); });
                        });
                    }
                } catch (_) {}

                // prefill URLs and existing files
                (function () {
                    try {
                        var container = document.getElementById('feedback_reference_urls_container'); if (!container) return; container.innerHTML = ''; var urls = []; if (Array.isArray(data.reference_urls)) urls = data.reference_urls; else if (typeof data.reference_urls === 'string') { try { var arr = JSON.parse(data.reference_urls); if (Array.isArray(arr)) urls = arr; } catch(_){} } if ((!urls || !urls.length) && data.reference_url) urls = [data.reference_url]; function addRow(value, withAdd) { var row = document.createElement('div'); row.className='d-flex gap-2 align-items-center'; row.innerHTML = '<input type="url" class="form-control input-text" name="reference_urls[]" placeholder="https://example.com">' + (withAdd ? ' <button type="button" class="btn btn-submit-black add-ref-url"><span class="material-symbols-outlined">add</span></button>' : ' <button type="button" class="btn btn-danger remove-ref-url"><span class="material-symbols-outlined">close</span></button>'); container.appendChild(row); var inp = row.querySelector('input[type="url"]'); if (inp && value) inp.value = value; }
                        addRow('', true); (urls || []).forEach(function(u){ addRow(u, false); });
                    } catch (_) {}
                })();

                (function () {
                    try {
                        var container = modalBody.querySelector('#existing_feedback_reference_files'); var hidden = modalBody.querySelector('#existing_feedback_reference_files_input'); if (!container || !hidden) return; var files = []; if (Array.isArray(data.reference_files_urls)) files = data.reference_files_urls.slice(); else if (Array.isArray(data.reference_files)) files = data.reference_files.slice(); else if (data.reference_file_url) files = [data.reference_file_url]; else if (data.reference_file) files = [data.reference_file]; function toUrl(v) { if (!v) return ''; var s = String(v); if (s.startsWith('http://') || s.startsWith('https://')) return s; if (s.startsWith('/')) return getMeta('app-url').replace(/\/$/, '') + s; return getMeta('app-url').replace(/\/$/, '') + '/file/project/' + s; } function toName(u) { if (!u) return ''; var s = String(u); if (s.startsWith('http://') || s.startsWith('https://')) { try { return new URL(s).pathname.split('/').pop(); } catch(_) { return s.split('/').pop(); } } return s.split('/').pop(); }
                        container.innerHTML = '';
                        if ((files || []).length > 0) {
                            var title = document.createElement('div'); title.className='fw-bold mb-2'; title.textContent='Current Files:'; container.appendChild(title);
                            var list = document.createElement('div'); list.className='existing-files-list w-100'; files.forEach(function(f){ var url = toUrl(f); var name = toName(f); if (!name) return; var item = document.createElement('div'); item.className='existing-file-item d-flex align-items-center justify-content-between mb-2 p-2 bg-light border rounded'; var info = document.createElement('div'); info.className='d-flex align-items-center flex-grow-1'; var icon = document.createElement('span'); icon.className='material-symbols-outlined me-2'; icon.textContent='description'; var link = document.createElement('a'); link.href = url; link.textContent = name; link.className = 'text-decoration-none'; link.target = '_blank'; var removeBtn = document.createElement('button'); removeBtn.type='button'; removeBtn.className='btn btn-sm btn-outline-danger'; removeBtn.innerHTML='&times;'; removeBtn.onclick = function(){ item.remove(); try { var anchors = container.querySelectorAll('.existing-file-item a'); var next = Array.from(anchors).map(function(a){ return (a.textContent||'').trim(); }).filter(Boolean); hidden.value = JSON.stringify(next); } catch(_){} }; info.appendChild(icon); info.appendChild(link); item.appendChild(info); item.appendChild(removeBtn); list.appendChild(item); }); container.appendChild(list); }
                        try { var anchors = container.querySelectorAll('.existing-file-item a'); var names = Array.from(anchors).map(function(a){ return (a.textContent||'').trim(); }).filter(Boolean); hidden.value = JSON.stringify(names); } catch(_) { hidden.value = '[]'; }
                    } catch (_) {}
                })();

                (function () { try { var footer = getProjectFeedbackFooter(); if (!footer) return; var submitBtnRef = document.getElementById('addFeedbackButton'); if (!submitBtnRef) return; submitBtnRef.classList.remove('w-100'); submitBtnRef.classList.add('flex-grow-1'); var oldWrapper = footer.querySelector('#feedbackFormButtonsWrapper'); if (oldWrapper) oldWrapper.remove(); var wrap = document.createElement('div'); wrap.id='feedbackFormButtonsWrapper'; wrap.className='d-flex gap-2 w-100'; var closeBtn = document.createElement('button'); closeBtn.id='replyCloseButton'; closeBtn.type='button'; closeBtn.className='btn btn-close-reply flex-grow-1'; closeBtn.textContent='Close'; closeBtn.addEventListener('click', function(){ try { footer.innerHTML=''; var restore = document.createElement('button'); restore.type='button'; restore.className='btn btn-submit-black w-100'; restore.id='addFeedbackButton'; restore.textContent='Add Feedback'; restore.addEventListener('click', function(){ showAddFeedbackForm(projectId); }); footer.appendChild(restore); } catch(_){} loadFeedbackData(projectId); }); wrap.appendChild(closeBtn); wrap.appendChild(submitBtnRef); footer.innerHTML=''; footer.appendChild(wrap); } catch(_){} })();
            }

            function markProjectFeedbacksRead(projectId) {
                return $.ajax({ url: getMeta('app-url').replace(/\/$/, '') + '/project/' + projectId + '/feedbacks/mark-read', type: 'POST', headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content') } }).always(function () { try { var badge = document.querySelector('.unread-badge[data-project-id="' + projectId + '"]'); if (badge) badge.classList.add('d-none'); } catch(_){} });
            }

            // modal show/hide handlers
            projectFeedbackModalEl.addEventListener('show.bs.modal', function () { try { document.body.classList.add('feedback-modal-open'); if (!document.getElementById('feedbackBackdropStyle')) { var style = document.createElement('style'); style.id = 'feedbackBackdropStyle'; style.textContent = '.feedback-modal-open .modal-backdrop.show {opacity:0.18 !important;}'; document.head.appendChild(style); } } catch(_){} });
            projectFeedbackModalEl.addEventListener('hidden.bs.modal', function () { try { modalTitle.textContent = 'Feedback'; modalBody.innerHTML = ''; document.body.classList.remove('feedback-modal-open'); } catch(_){} try { var backdrops = document.querySelectorAll('.modal-backdrop'); backdrops.forEach(function(b){ b.parentNode.removeChild(b); }); } catch(_){} });
            // Expose functions globally so button handlers outside this scope can call them
            try {
                window.loadFeedbackData = loadFeedbackData;
                window.showAddFeedbackForm = showAddFeedbackForm;
                window.showReplyFeedbackForm = showReplyFeedbackForm;
                window.showEditFeedbackForm = showEditFeedbackForm;
                window.markProjectFeedbacksRead = markProjectFeedbacksRead;
            } catch (_) {}
        }

        if (author) container.append(makeEntry(author, "Author"));
        if (Array.isArray(coAuthors))
            coAuthors.forEach(function (c) {
                container.append(makeEntry(c, "Co Author"));
            });
        if (Array.isArray(contributors))
            contributors.forEach(function (c) {
                container.append(makeEntry(c, "Contributor"));
            });
    }

    function createActionButtons(projectId, actionsContainer) {
        actionsContainer.empty();
        var appUrl = getMeta("app-url") || "";
        var editUrl =
            appUrl.replace(/\/$/, "") + "/project/" + projectId + "/edit";
        var $edit = $("<a>")
            .addClass("detail-icon")
            .attr("title", "Edit")
            .attr("href", editUrl)
            .append(
                $("<span>")
                    .addClass("material-symbols-outlined icon-fill me-3")
                    .text("edit")
            );

        // Delete button
        var $delete = $("<button>")
            .addClass("detail-icon btn-delete-project")
            .attr("title", "Delete")
            .append(
                $("<span>")
                    .addClass("material-symbols-outlined icon-fill")
                    .text("delete")
            );

        actionsContainer.append($edit).append($delete);

        // Delete handler: open modal (modal already contains server-rendered project details)
        $delete.on("click", function (e) {
            e.preventDefault();
            var modalEl = document.getElementById("deleteProjectModal");
            if (!modalEl) {
                if (!confirm("Are you sure you want to delete this project?"))
                    return;
                // fallback delete
                var appUrlFb = getMeta("app-url") || "";
                $.ajax({
                    url: appUrlFb.replace(/\/$/, "") + "/project/" + projectId,
                    method: "DELETE",
                    headers: {
                        "X-CSRF-TOKEN": getMeta("csrf-token"),
                        Accept: "application/json",
                    },
                    success: function () {
                        window.location.href =
                            appUrlFb.replace(/\/$/, "") + "/project";
                    },
                    error: function () {
                        alert("Failed to delete");
                    },
                });
                return;
            }
            // ensure confirm button has correct project id (server already set it, but set again for safety)
            $("#confirmDeleteProjectBtn").attr("data-project-id", projectId);
            var bsModal = new bootstrap.Modal(modalEl, {
                backdrop: "static",
                keyboard: false,
            });
            bsModal.show();
        });

        // Confirm delete button handler (delegated in case element created later)
        $(document)
            .off("click", "#confirmDeleteProjectBtn")
            .on("click", "#confirmDeleteProjectBtn", function (e) {
                var $btn = $(this);
                var pid =
                    $btn.attr("data-project-id") || $btn.data("projectId");
                if (!pid) {
                    alert("Project ID tidak ditemukan");
                    return;
                }
                var appUrlLocal = getMeta("app-url") || "";
                var token = getMeta("csrf-token");
                // show loader state on button
                $btn.prop("disabled", true).text("Deleting...");
                $.ajax({
                    url: appUrlLocal.replace(/\/$/, "") + "/project/" + pid,
                    method: "DELETE",
                    headers: {
                        "X-CSRF-TOKEN": token,
                        Accept: "application/json",
                    },
                    success: function (res) {
                        if (res && res.status === "success") {
                            // hide modal and redirect
                            var modalEl =
                                document.getElementById("deleteProjectModal");
                            try {
                                var m = bootstrap.Modal.getInstance(modalEl);
                                if (m) m.hide();
                            } catch (_) {}
                            window.location.href =
                                appUrlLocal.replace(/\/$/, "") + "/project";
                        } else {
                            alert(
                                (res && res.message) ||
                                    "Failed to delete project"
                            );
                            $btn.prop("disabled", false).text("Delete");
                        }
                    },
                    error: function (xhr) {
                        var msg = "Failed to delete project";
                        try {
                            msg =
                                xhr.responseJSON && xhr.responseJSON.message
                                    ? xhr.responseJSON.message
                                    : msg;
                        } catch (e) {}
                        alert(msg);
                        $btn.prop("disabled", false).text("Delete");
                    },
                });
            });
    }

    function populateProject(data) {
        $("#project-title").text(safeText(data.title));
        if (data.image) {
            var imgUrl = data.image;
            // if image is a filename, prefix with /file/project/
            if (!imgUrl.match(/^(https?:)?\/\//)) {
                var appUrl = getMeta("app-url") || "";
                imgUrl =
                    appUrl.replace(/\/$/, "") +
                    "/file/project/" +
                    imgUrl.replace(/^\//, "");
            }
            $("#project-image").attr("src", imgUrl);
        } else {
            // Project has no image: prefer an initials avatar generated from title.
            // Only fall back to the server-provided meta placeholder if we cannot build initials.
            var initials = buildInitials(data.title || '');
            if (initials) {
                var color = getRandomColorFromText(data.title || '');
                var svg = buildInitialsSvg(initials, color);
                $("#project-image").attr("src", svg);
            } else {
                var metaImg = getMeta("project-image");
                if (metaImg) $("#project-image").attr("src", metaImg);
            }
        }
        $("#project-description").html(
            data.description ? data.description.replace(/\n/g, "<br>") : "-"
        );
        if (data.task_counts && typeof data.task_counts.total !== "undefined") {
            $("#project-total-tasks").text(
                data.task_counts.total +
                    " Task" +
                    (data.task_counts.total > 1 ? "s" : "")
            );
        } else {
            var metaTotal = getMeta("project-total-tasks");
            if (metaTotal) {
                $("#project-total-tasks").text(
                    metaTotal + " Task" + (Number(metaTotal) > 1 ? "s" : "")
                );
            }
        }
        $("#project-deadline").text(formatDate(data.due_date));
        $("#project-department").text(safeText(data.department));
        $("#project-division").text(safeText(data.division));
        renderAssignments(
            $("#project-assignments"),
            data.author,
            data.co_authors,
            data.contributors
        );
        createActionButtons(data.id, $("#project-actions"));
    }

    function fetchProject(projectId) {
        if (!projectId) return;
        var appUrl = getMeta("app-url") || "";
        var url = appUrl.replace(/\/$/, "") + "/project/" + projectId;
        $.ajax({
            url: url,
            method: "GET",
            headers: { Accept: "application/json" },
            success: function (res) {
                if (res && res.status === "success" && res.data) {
                    populateProject(res.data);
                } else {
                    console.error("Invalid project payload", res);
                    alert("Gagal mengambil data project");
                }
            },
            error: function (xhr) {
                console.error("Error fetching project", xhr);
                alert("Gagal mengambil data project");
            },
        });
    }

    // Setup global AJAX CSRF for forms if token present
    $(function () {
        var csrf = getMeta("csrf-token");
        if (csrf) {
            $.ajaxSetup({ headers: { "X-CSRF-TOKEN": csrf } });
        }

        var projectId = getMeta("project-id");
        // initialize placeholders from meta if available
        var initialImg = getMeta("project-image");
        if (initialImg) {
            $("#project-image").attr("src", initialImg);
        }
        var initialTotal = getMeta("project-total-tasks");
        if (initialTotal) {
            $("#project-total-tasks").text(
                initialTotal + " Task" + (Number(initialTotal) > 1 ? "s" : "")
            );
        }
        if (projectId) {
            fetchProject(projectId);
        }

        // Ensure edit image input has preview/clear behavior
        try {
            var editImageEl = document.getElementById('edit_image');
            var editImageLabel = document.getElementById('editImageLabel');
            var editImageClearBtn = document.getElementById('editImageClearBtn');
            setupImageInput(editImageEl, editImageLabel, editImageClearBtn);
        } catch (e) {}

        // button references: open Reference Files modal (mirror project.js behavior)
        $("#btn-references").on("click", function (e) {
            e.preventDefault();
            var pid = getMeta('project-id');
            if (pid && window.showProjectFiles) {
                window.showProjectFiles(pid);
                return;
            }
            // fallback: try to open modal directly if element exists
            try {
                var modalEl = document.getElementById('projectFilesModal');
                if (modalEl) {
                    var m = new bootstrap.Modal(modalEl);
                    m.show();
                } else {
                    // fallback to hash navigation
                    window.location.hash = '#references';
                }
            } catch (err) {
                window.location.hash = '#references';
            }
        });
        // Expose showProjectFiles for detail page (same behavior as project.js)
        window.showProjectFiles = function (projectId) {
            var modalEl = document.getElementById('projectFilesModal');
            var listEl = document.getElementById('projectReferenceFilesList');
            if (!modalEl || !listEl) return;

            listEl.innerHTML = '<div class="text-center py-4"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';

            var appBase = getMeta('app-url') ? getMeta('app-url').replace(/\/$/, '') : '';
            $.ajax({
                url: appBase + '/project/' + projectId,
                method: 'GET',
                dataType: 'json',
                success: function (resp) {
                    var data = (resp && resp.data) ? resp.data : resp || {};
                    var files = Array.isArray(data.reference_files) ? data.reference_files : Array.isArray(data.reference_file) ? data.reference_file : data.reference_file ? [data.reference_file] : [];
                    listEl.innerHTML = '';
                    if (files && files.length > 0) {
                        files.forEach(function (fileName) {
                            var a = document.createElement('a');
                            a.href = appBase + '/file/project/' + fileName;
                            a.target = '_blank';
                            a.className = 'd-block text-decoration-none mb-1';
                            a.innerHTML = '<span class="material-symbols-outlined me-1" style="font-size: 16px; vertical-align: middle;">description</span> ' + fileName;
                            listEl.appendChild(a);
                        });
                    } else {
                        listEl.textContent = 'No reference files available.';
                    }
                    try { var m = new bootstrap.Modal(modalEl); m.show(); } catch (e) {}
                },
                error: function () {
                    listEl.innerHTML = '';
                    listEl.textContent = 'Failed to load reference files.';
                    try { var m = new bootstrap.Modal(modalEl); m.show(); } catch (e) {}
                }
            });
        };
        $("#btn-comments").on("click", function (e) {
            e && e.preventDefault && e.preventDefault();
            var pid = getMeta('project-id');
            try {
                if (pid && typeof loadFeedbackData === 'function') {
                    try { if (typeof markProjectFeedbacksRead === 'function') markProjectFeedbacksRead(pid); } catch(_){ }
                    var modalEl = document.getElementById('projectFeedbackModal');
                    if (modalEl) modalEl.setAttribute('data-project-id', pid);
                    loadFeedbackData(pid);
                    if (modalEl) { try { var m = bootstrap && bootstrap.Modal && bootstrap.Modal.getOrCreateInstance ? bootstrap.Modal.getOrCreateInstance(modalEl) : new bootstrap.Modal(modalEl); m.show(); } catch(_){} }
                    return;
                }
            } catch (err) {}
            window.location.hash = "#comments";
        });

        // Delegated handler: add/remove reference URL rows (match project.js behavior)
        document.addEventListener('click', function (e) {
            try {
                var addBtn = e.target.closest('.add-ref-url');
                if (addBtn) {
                    e.preventDefault && e.preventDefault();
                    var container = addBtn.closest('#feedback_reference_urls_container, #project_reference_urls_container, #edit_project_reference_urls_container, #reply_reference_urls_container');
                    if (!container) return;
                    var row = document.createElement('div');
                    row.className = 'd-flex gap-2 align-items-center';
                    row.innerHTML = '<input type="url" class="form-control input-text" name="reference_urls[]" placeholder="https://example.com">' +
                        ' <button type="button" class="btn btn-danger remove-ref-url" aria-label="Remove URL"><span class="material-symbols-outlined">close</span></button>';
                    container.appendChild(row);
                    var input = row.querySelector('input[type="url"]');
                    if (input) try { input.focus(); } catch (_) {}
                    return;
                }

                var removeBtn = e.target.closest('.remove-ref-url');
                if (removeBtn) {
                    e.preventDefault && e.preventDefault();
                    var row = removeBtn.closest('.d-flex');
                    if (row && row.parentNode) row.parentNode.removeChild(row);
                    return;
                }
            } catch (_) {}
        });


        function loadDepartments(callback, targetSelect) {
            targetSelect = targetSelect || document.getElementById("edit_department");
            $.ajax({
                url: getMeta('app-url').replace(/\/$/, '') + "/departments-for-projects",
                type: "GET",
                dataType: "json",
                success: function (data) {
                    var options = '<option value="">Select Department</option>';
                    (data.data || []).forEach(function (dept) {
                        options += '<option value="' + dept.id + '">' + (dept.name_department || dept.name) + '</option>';
                    });
                    try { targetSelect.innerHTML = options; } catch (e) {}
                    if (typeof callback === 'function') callback();
                },
                error: function () {
                    if (typeof callback === 'function') callback();
                }
            });
        }

        function loadDivisions(departmentId, callback, targetSelect) {
            targetSelect = targetSelect || document.getElementById("edit_division");
            if (!departmentId) {
                targetSelect.innerHTML = '<option value="">Select Division</option>';
                if (typeof callback === 'function') callback();
                return;
            }
            $.ajax({
                url: getMeta('app-url').replace(/\/$/, '') + "/divisions-for-projects",
                type: "GET",
                data: { department_id: departmentId },
                dataType: "json",
                success: function (data) {
                    var options = '<option value="">Select Division</option>';
                    (data.data || []).forEach(function (d) {
                        options += '<option value="' + d.id + '">' + (d.name_division || d.name) + '</option>';
                    });
                    try { targetSelect.innerHTML = options; } catch (e) {}
                    if (typeof callback === 'function') callback();
                },
                error: function () {
                    if (typeof callback === 'function') callback();
                }
            });
        }

        function populatePartOfProjectSelects(currentProjectId, currentProjectTitle, selectedPartOfProjectId) {
            $.ajax({
                url: getMeta('app-url').replace(/\/$/, '') + "/project/index?task_scope=all",
                type: "GET",
                dataType: "json",
                success: function (payload) {
                    var arr = Array.isArray(payload) ? payload : Array.isArray(payload.data) ? payload.data : [];
                    var options = '<option value="">Select Project</option>';
                    var foundCurrent = false;
                    arr.forEach(function (p) {
                        if (!p) return;
                        if (String(p.id) === String(currentProjectId)) foundCurrent = true;
                        options += '<option value="' + p.id + '">' + (p.title || p.name || ('Project ' + p.id)) + '</option>';
                    });
                    if (currentProjectId && !foundCurrent) {
                        options += '<option value="' + currentProjectId + '">' + (currentProjectTitle || ('Project ' + currentProjectId)) + '</option>';
                    }
                    try { document.getElementById('edit_part_of_project').innerHTML = options; } catch (e) {}
                    if (selectedPartOfProjectId) {
                        try { $('#edit_part_of_project').val(selectedPartOfProjectId); } catch (e) {}
                    }
                },
                error: function () {
                    // ignore
                }
            });
        }

        // Image input helper for edit modal
        function setupImageInput(inputEl, labelEl, clearBtnEl) {
            if (!inputEl || !labelEl) return;
            inputEl.addEventListener('change', function () {
                var file = this.files && this.files[0];
                if (!file) return;
                var reader = new FileReader();
                reader.onload = function (e) {
                    try {
                        labelEl.style.backgroundImage = 'url(' + e.target.result + ')';
                        labelEl.classList.add('has-image');
                        labelEl.style.backgroundSize = 'cover';
                        labelEl.style.opacity = '1';
                        if (clearBtnEl) clearBtnEl.classList.remove('d-none');
                        // if user selects a new image, ensure remove_image flag is reset
                        try { document.getElementById('edit_remove_image').value = '0'; } catch(_){ }
                    } catch (err) {}
                };
                reader.readAsDataURL(file);
            });

            // Helper: build initials from a title string (first+last char or first two chars)
            function buildInitials(title) {
                try {
                    if (!title) return '';
                    var t = String(title || '').trim();
                    if (!t) return '';
                    var parts = t.split(/\s+/).filter(Boolean);
                    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
                    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
                } catch (e) { return ''; }
            }

            // Helper: deterministic color from text
            function getRandomColorFromText(text) {
                try {
                    var colors = [
                        '#6A5AE0', '#FF8A3C', '#00A881', '#D4526E', '#3E8EDE',
                        '#546E7A', '#8E44AD', '#2E7D32', '#AD1457', '#EF6C00'
                    ];
                    var h = 0;
                    for (var i = 0; i < (text || '').length; i++) {
                        h = text.charCodeAt(i) + ((h << 5) - h);
                    }
                    return colors[Math.abs(h) % colors.length];
                } catch (e) { return '#6A5AE0'; }
            }

            if (clearBtnEl) {
                clearBtnEl.addEventListener('click', function (ev) {
                    ev.preventDefault();
                    try {
                        inputEl.value = '';
                        var placeholder = getMeta('app-url').replace(/\/$/, '') + '/asset/img/background/add-image.png';
                        labelEl.style.backgroundImage = "url('" + placeholder + "')";
                        labelEl.classList.remove('has-image');
                        labelEl.style.opacity = '0.5';
                        clearBtnEl.classList.add('d-none');
                        // mark remove_image so backend deletes existing image
                        try { document.getElementById('edit_remove_image').value = '1'; } catch(_){ }

                        // Note: do not change the project detail image immediately here.
                        // The actual project image on the detail page will be refreshed
                        // after the Update request succeeds (see edit form success handler
                        // which calls fetchProject). We only update modal preview and
                        // set the remove flag so the server knows to delete the image.
                    } catch (err) {}
                });
            }

        } // end setupImageInput

            // Setup searchable co-author input inside edit modal (copied/adapted from project.js)
            function setupCoAuthorInputEdit() {
                const input = document.getElementById("edit_co_author_input");
                const dropdown = document.getElementById("edit_co_author_dropdown");
                const selectedContainer = document.getElementById(
                    "edit_selected_co_authors"
                );
                const hiddenInput = document.getElementById("edit_co_author");

                if (!input || !dropdown || !selectedContainer || !hiddenInput)
                    return;

                let employees = [];
                let filteredEmployees = [];
                let selectedEmployees = [];
                let isDropdownOpen = false;

                function fetchEmployees(query = "") {
                    const currentEmployeeId =
                        document
                            .getElementById("editProjectModal")
                            ?.getAttribute("data-employee-id") || "";
                    $.ajax({
                        url: getMeta("app-url").replace(/\/$/, "") + "/employees-for-projects",
                        type: "GET",
                        data: { query: query, exclude_employee_id: currentEmployeeId },
                        dataType: "json",
                        timeout: 10000,
                        success: function (data) {
                            employees = (data.data || []).map(function (e) {
                                const candidate =
                                    e.profile_picture_url || e.profile_picture || e.user_photo;
                                e.user_photo = candidate;
                                return e;
                            });
                            filteredEmployees = employees;
                            renderDropdown();
                        },
                        error: function () {
                            // fallback empty
                            employees = [];
                            filteredEmployees = [];
                            renderDropdown();
                        },
                    });
                }

                window.__refreshEditProjectEmployees = function () {
                    fetchEmployees(document.getElementById("edit_co_author_input")?.value || "");
                };

                function renderDropdown() {
                    if (filteredEmployees.length === 0) {
                        dropdown.innerHTML = '<div class="dropdown-item disabled">No employees found</div>';
                        dropdown.style.display = isDropdownOpen ? "block" : "none";
                        return;
                    }

                    // Exclude employees already selected as Contributors
                    function getContributorIds() {
                        try {
                            const raw = document.getElementById("edit_contributors")?.value || "[]";
                            const arr = JSON.parse(raw);
                            return Array.isArray(arr) ? arr.map((v) => Number(v)) : [];
                        } catch (_) {
                            return [];
                        }
                    }
                    const contributorIds = getContributorIds();
                    const availableEmployees = filteredEmployees.filter(
                        (emp) => !contributorIds.includes(Number(emp.id))
                    );

                    const html = availableEmployees
                        .map((emp) => {
                            const isChecked = selectedEmployees.some((e) => e.id === emp.id);
                            if (!emp.user_photo) {
                                emp.user_photo = "/asset/img/avatar.png";
                            }
                            let photoUrl;
                            try {
                                if (emp.user_photo.startsWith("http")) photoUrl = emp.user_photo;
                                else if (emp.user_photo.startsWith("/")) photoUrl = getMeta("app-url") + emp.user_photo;
                                else if (emp.user_photo.includes("/")) photoUrl = getMeta("app-url") + "/" + emp.user_photo;
                                else photoUrl = getMeta("app-url") + "/file/profile_picture/" + emp.user_photo;
                            } catch (_) {
                                photoUrl = getMeta("app-url") + "/asset/img/avatar.png";
                            }

                            return `
            <label class="dropdown-item d-flex align-items-center justify-content-between" style="cursor: pointer;">
                <div class="d-flex align-items-center">
                    <img src="${photoUrl}" alt="${emp.name}" class="rounded-circle me-2" style="width: 30px; height: 30px; object-fit: cover;">
                    <span>${emp.name}</span>
                </div>
                <input type="checkbox" class="co-author-checkbox" data-id="${emp.id}" data-name="${emp.name}" ${isChecked ? "checked" : ""}>
            </label>
        `;
                        })
                        .join("");

                    dropdown.innerHTML = html;
                    dropdown.style.display = isDropdownOpen ? "block" : "none";

                    dropdown.querySelectorAll(".co-author-checkbox").forEach((checkbox) => {
                        checkbox.addEventListener("change", function () {
                            const id = parseInt(this.getAttribute("data-id"));
                            const name = this.getAttribute("data-name");
                            const employeeObj = employees.find((emp) => emp.id === id);
                            if (this.checked) {
                                if (!selectedEmployees.some((e) => e.id === id)) {
                                    selectedEmployees.push({ id, name, user_photo: employeeObj ? employeeObj.user_photo : null });
                                }
                            } else {
                                selectedEmployees = selectedEmployees.filter((e) => e.id !== id);
                            }
                            renderSelected();
                            updateHiddenInput();
                            try { window.syncContributorsWithCoAuthors && window.syncContributorsWithCoAuthors(); } catch (_) {}
                        });
                    });
                }

                function renderSelected() {
                    selectedContainer.innerHTML = "";
                    selectedEmployees.forEach((emp) => {
                        const photoUrl = emp.user_photo || getMeta("app-url") + "/asset/img/avatar.png";
                        const badge = document.createElement("span");
                        badge.className = "badge bg-primary d-inline-flex align-items-center me-2 mb-2";

                        const img = document.createElement("img");
                        img.src = photoUrl;
                        img.alt = emp.name;
                        img.className = "rounded-circle me-2";
                        img.style.width = "24px";
                        img.style.height = "24px";
                        img.style.objectFit = "cover";

                        const nameSpan = document.createElement("span");
                        nameSpan.textContent = emp.name;

                        const removeBtn = document.createElement("button");
                        removeBtn.type = "button";
                        removeBtn.className = "btn-close btn-close-white btn-sm ms-2";
                        removeBtn.setAttribute("aria-label", "Remove");
                        removeBtn.addEventListener("click", () => {
                            selectedEmployees = selectedEmployees.filter((e) => e.id !== emp.id);
                            renderSelected();
                            updateHiddenInput();
                            renderDropdown();
                            try { window.syncContributorsWithCoAuthors && window.syncContributorsWithCoAuthors(); } catch (_) {}
                        });

                        badge.appendChild(img);
                        badge.appendChild(nameSpan);
                        badge.appendChild(removeBtn);
                        selectedContainer.appendChild(badge);
                    });
                }

                function updateHiddenInput() {
                    hiddenInput.value = JSON.stringify(selectedEmployees.map((e) => e.id));
                }

                function filterEmployees(value) {
                    const val = value.trim().toLowerCase();
                    if (val === "") filteredEmployees = employees;
                    else filteredEmployees = employees.filter((emp) => emp.name.toLowerCase().includes(val));
                    renderDropdown();
                }

                input.addEventListener("input", function () {
                    isDropdownOpen = true;
                    filterEmployees(this.value);
                });

                input.addEventListener("focus", function () {
                    isDropdownOpen = true;
                    filterEmployees(this.value);
                });

                document.addEventListener("click", function (e) {
                    if (!input.contains(e.target) && !dropdown.contains(e.target)) {
                        isDropdownOpen = false;
                        dropdown.style.display = "none";
                    }
                });

                fetchEmployees();

                window.clearSelectedCoAuthorsEdit = function () {
                    selectedEmployees = [];
                    renderSelected();
                    updateHiddenInput();
                    dropdown.style.display = "none";
                    input.value = "";
                };

                function buildAvatarUrl(raw) {
                    if (!raw) return getMeta("app-url") + "/asset/img/avatar.png";
                    try {
                        raw = String(raw).trim();
                        const trimmed = raw.replace(/^\/+/, "");
                        if (/^https?:\/\//i.test(raw)) return raw;
                        if (/^(file\/|asset\/|storage\/)/.test(trimmed)) return getMeta("app-url") + "/" + trimmed;
                        if (raw.startsWith("/")) return getMeta("app-url") + raw;
                        if (raw.indexOf("/") !== -1) return getMeta("app-url") + "/" + trimmed;
                        return getMeta("app-url") + "/file/profile_picture/" + raw;
                    } catch (_) {
                        return getMeta("app-url") + "/asset/img/avatar.png";
                    }
                }

                window.setSelectedCoAuthorsEdit = function (coAuthors) {
                    let contribIds = [];
                    try {
                        const raw = document.getElementById("edit_contributors")?.value || "[]";
                        const arr = JSON.parse(raw);
                        contribIds = Array.isArray(arr) ? arr.map((v) => Number(v)) : [];
                    } catch (_) { contribIds = []; }

                    selectedEmployees = coAuthors
                        .filter((ca) => !contribIds.includes(Number(ca.id)))
                        .map((ca) => {
                            const candidate = ca.profile_picture_url || ca.profile_picture || ca.user_photo;
                            return { id: ca.id, name: ca.name, user_photo: buildAvatarUrl(candidate) };
                        });
                    renderSelected();
                    updateHiddenInput();
                    try { window.syncContributorsWithCoAuthors && window.syncContributorsWithCoAuthors(); } catch (_) {}
                    renderDropdown();
                };

                window.syncCoAuthorsWithContributors = function () {
                    const contributorIds = (function () {
                        try {
                            const raw = document.getElementById("edit_contributors")?.value || "[]";
                            const arr = JSON.parse(raw);
                            return Array.isArray(arr) ? arr.map((v) => Number(v)) : [];
                        } catch (_) { return []; }
                    })();
                    const before = selectedEmployees.length;
                    selectedEmployees = selectedEmployees.filter((se) => !contributorIds.includes(Number(se.id)));
                    if (selectedEmployees.length !== before) {
                        renderSelected();
                        updateHiddenInput();
                    }
                    renderDropdown();
                };
            }

            // Setup searchable contributors input inside edit modal
            function setupContributorInputEdit() {
                const input = document.getElementById("edit_contributor_input");
                const dropdown = document.getElementById("edit_contributor_dropdown");
                const selectedContainer = document.getElementById("edit_selected_contributors");
                const hiddenInput = document.getElementById("edit_contributors");

                if (!input || !dropdown || !selectedContainer || !hiddenInput) return;

                let employees = [];
                let filteredEmployees = [];
                let selectedEmployees = [];
                let isDropdownOpen = false;

                function fetchEmployees(query = "") {
                    const currentEmployeeId = document.getElementById("editProjectModal")?.getAttribute("data-employee-id") || "";
                    $.ajax({
                        url: getMeta("app-url").replace(/\/$/, "") + "/employees-for-projects",
                        type: "GET",
                        data: { query: query, exclude_employee_id: currentEmployeeId },
                        dataType: "json",
                        timeout: 10000,
                        success: function (data) {
                            employees = (data.data || []).map(function (e) {
                                const candidate = e.profile_picture_url || e.profile_picture || e.user_photo;
                                e.user_photo = candidate;
                                return e;
                            });
                            filteredEmployees = employees;
                            renderDropdown();
                        },
                        error: function () {
                            employees = [];
                            filteredEmployees = [];
                            renderDropdown();
                        },
                    });
                }

                window.__refreshEditProjectEmployees = (function (orig) {
                    return function () {
                        if (typeof orig === "function") orig();
                        fetchEmployees(document.getElementById("edit_contributor_input")?.value || "");
                    };
                })(window.__refreshEditProjectEmployees);

                function renderDropdown() {
                    if (filteredEmployees.length === 0) {
                        dropdown.innerHTML = '<div class="dropdown-item disabled">No employees found</div>';
                        dropdown.style.display = isDropdownOpen ? "block" : "none";
                        return;
                    }

                    // Exclude employees already selected as co-authors
                    function getCoAuthorIds() {
                        try {
                            const raw = document.getElementById("edit_co_author")?.value || "[]";
                            const arr = JSON.parse(raw);
                            return Array.isArray(arr) ? arr.map((v) => Number(v)) : [];
                        } catch (_) { return []; }
                    }
                    const coAuthorIds = getCoAuthorIds();
                    const availableEmployees = filteredEmployees.filter((emp) => !coAuthorIds.includes(Number(emp.id)));

                    const html = availableEmployees
                        .map((emp) => {
                            const isChecked = selectedEmployees.some((e) => e.id === emp.id);
                            if (!emp.user_photo) emp.user_photo = "/asset/img/avatar.png";
                            let photoUrl;
                            try {
                                if (emp.user_photo.startsWith("http")) photoUrl = emp.user_photo;
                                else if (emp.user_photo.startsWith("/")) photoUrl = getMeta("app-url") + emp.user_photo;
                                else if (emp.user_photo.includes("/")) photoUrl = getMeta("app-url") + "/" + emp.user_photo;
                                else photoUrl = getMeta("app-url") + "/file/profile_picture/" + emp.user_photo;
                            } catch (_) { photoUrl = getMeta("app-url") + "/asset/img/avatar.png"; }

                            return `
            <label class="dropdown-item d-flex align-items-center justify-content-between" style="cursor: pointer;">
                <div class="d-flex align-items-center">
                    <img src="${photoUrl}" alt="${emp.name}" class="rounded-circle me-2" style="width: 30px; height: 30px; object-fit: cover;">
                    <span>${emp.name}</span>
                </div>
                <input type="checkbox" class="contributor-checkbox" data-id="${emp.id}" data-name="${emp.name}" ${isChecked ? "checked" : ""}>
            </label>
        `;
                        })
                        .join("");

                    dropdown.innerHTML = html;
                    dropdown.style.display = isDropdownOpen ? "block" : "none";

                    dropdown.querySelectorAll(".contributor-checkbox").forEach((checkbox) => {
                        checkbox.addEventListener("change", function () {
                            const id = parseInt(this.getAttribute("data-id"));
                            const name = this.getAttribute("data-name");
                            const employeeObj = employees.find((emp) => emp.id === id);
                            if (this.checked) {
                                if (!selectedEmployees.some((e) => e.id === id)) {
                                    selectedEmployees.push({ id, name, user_photo: employeeObj ? employeeObj.user_photo : null });
                                }
                            } else {
                                selectedEmployees = selectedEmployees.filter((e) => e.id !== id);
                            }
                            renderSelected();
                            updateHiddenInput();
                            renderDropdown();
                            try { window.syncCoAuthorsWithContributors && window.syncCoAuthorsWithContributors(); } catch (_) {}
                        });
                    });
                }

                function renderSelected() {
                    selectedContainer.innerHTML = "";
                    selectedEmployees.forEach((emp) => {
                        const photoUrl = emp.user_photo || getMeta("app-url") + "/asset/img/avatar.png";
                        const badge = document.createElement("span");
                        badge.className = "badge bg-primary d-inline-flex align-items-center me-2 mb-2";

                        const img = document.createElement("img");
                        img.src = photoUrl;
                        img.alt = emp.name;
                        img.className = "rounded-circle me-2";
                        img.style.width = "24px";
                        img.style.height = "24px";
                        img.style.objectFit = "cover";

                        const nameSpan = document.createElement("span");
                        nameSpan.textContent = emp.name;

                        const removeBtn = document.createElement("button");
                        removeBtn.type = "button";
                        removeBtn.className = "btn-close btn-close-white btn-sm ms-2";
                        removeBtn.setAttribute("aria-label", "Remove");
                        removeBtn.addEventListener("click", () => {
                            selectedEmployees = selectedEmployees.filter((e) => e.id !== emp.id);
                            renderSelected();
                            updateHiddenInput();
                            renderDropdown();
                            try { window.syncCoAuthorsWithContributors && window.syncCoAuthorsWithContributors(); } catch (_) {}
                        });

                        badge.appendChild(img);
                        badge.appendChild(nameSpan);
                        badge.appendChild(removeBtn);
                        selectedContainer.appendChild(badge);
                    });
                }

                function updateHiddenInput() {
                    hiddenInput.value = JSON.stringify(selectedEmployees.map((e) => e.id));
                }

                function filterEmployees(value) {
                    const val = value.trim().toLowerCase();
                    if (val === "") filteredEmployees = employees;
                    else filteredEmployees = employees.filter((emp) => emp.name.toLowerCase().includes(val));
                    renderDropdown();
                }

                input.addEventListener("input", function () {
                    isDropdownOpen = true;
                    filterEmployees(this.value);
                });

                input.addEventListener("focus", function () {
                    isDropdownOpen = true;
                    filterEmployees(this.value);
                });

                document.addEventListener("click", function (e) {
                    if (!input.contains(e.target) && !dropdown.contains(e.target)) {
                        isDropdownOpen = false;
                        dropdown.style.display = "none";
                    }
                });

                fetchEmployees();

                window.clearSelectedContributorsEdit = function () {
                    selectedEmployees = [];
                    renderSelected();
                    updateHiddenInput();
                    dropdown.style.display = "none";
                    input.value = "";
                };

                window.setSelectedContributorsEdit = function (contributors) {
                    let coIds = [];
                    try {
                        const raw = document.getElementById("edit_co_author")?.value || "[]";
                        const arr = JSON.parse(raw);
                        coIds = Array.isArray(arr) ? arr.map((v) => Number(v)) : [];
                    } catch (_) { coIds = []; }

                    selectedEmployees = contributors
                        .filter((c) => !coIds.includes(Number(c.id)))
                        .map((ca) => {
                            const candidate = ca.profile_picture_url || ca.profile_picture || ca.user_photo;
                            return { id: ca.id, name: ca.name, user_photo: buildAvatarUrl(candidate) };
                        });
                    renderSelected();
                    updateHiddenInput();
                    try { window.syncCoAuthorsWithContributors && window.syncCoAuthorsWithContributors(); } catch (_) {}
                };

                window.syncContributorsWithCoAuthors = function () {
                    const coAuthorIds = (function () {
                        try {
                            const raw = document.getElementById("edit_co_author")?.value || "[]";
                            const arr = JSON.parse(raw);
                            return Array.isArray(arr) ? arr.map((v) => Number(v)) : [];
                        } catch (_) { return []; }
                    })();
                    const before = selectedEmployees.length;
                    selectedEmployees = selectedEmployees.filter((se) => !coAuthorIds.includes(Number(se.id)));
                    if (selectedEmployees.length !== before) {
                        renderSelected();
                        updateHiddenInput();
                    }
                    renderDropdown();
                };
            }

            // initialize co-author/contributor dropdowns for edit modal
            try { setupCoAuthorInputEdit(); } catch (_) {}
            try { setupContributorInputEdit(); } catch (_) {}

            // Render selected collaborators badges into edit modal (blue with remove button)
            function renderSelectedBadges(containerId, arr, hiddenInputId) {
                try {
                    var container = document.getElementById(containerId);
                    if (!container) return;
                    container.innerHTML = '';
                    if (!arr || !arr.length) return;

                    // Ensure hidden input exists
                    var hidden = hiddenInputId ? document.getElementById(hiddenInputId) : null;
                    if (hidden && (!hidden.value || hidden.value === '')) {
                        try { hidden.value = JSON.stringify((arr || []).map(function(x){ return x.id; })); } catch(_){}
                    }

                    arr.forEach(function (a) {
                        var id = a.id || a.employee_id || a.user_id || null;
                        var span = document.createElement('span');
                            // Match project.js styling exactly
                            span.className = 'badge bg-primary d-inline-flex align-items-center me-2 mb-2';

                            var img = document.createElement('img');
                            img.src = a.user_photo || a.profile_picture || (getMeta('app-url').replace(/\/$/, '') + '/asset/img/avatar.png');
                            img.className = 'rounded-circle me-2';
                            img.style.width = '24px';
                            img.style.height = '24px';
                            img.style.objectFit = 'cover';

                            var txt = document.createElement('span');
                            txt.textContent = a.name || a.employee_name || a.username || '-';

                        var removeBtn = document.createElement('button');
                        removeBtn.type = 'button';
                        removeBtn.className = 'btn-close btn-close-white btn-sm ms-2';
                        removeBtn.setAttribute('aria-label', 'Remove');
                        removeBtn.addEventListener('click', function () {
                            try {
                                // remove from DOM
                                if (span && span.parentNode) span.parentNode.removeChild(span);
                                // update hidden input JSON by removing this id
                                if (hidden) {
                                    try {
                                        var cur = JSON.parse(hidden.value || '[]');
                                        if (Array.isArray(cur)) {
                                            cur = cur.filter(function(v){ return String(v) !== String(id); });
                                            hidden.value = JSON.stringify(cur);
                                        }
                                    } catch (_) {}
                                }
                            } catch (e) {}
                        });

                        span.appendChild(img);
                        span.appendChild(txt);
                        span.appendChild(removeBtn);
                        container.appendChild(span);
                    });
                } catch (e) {}
            }

            // Intercept edit link clicks created by createActionButtons
            $(document).off('click', '.detail-icon a, .detail-icon').on('click', '.detail-icon a, .detail-icon', function (e) {
                // If it's the edit anchor inside project actions, handle specially
                var $el = $(e.target).closest('a');
                if (!$el || !$el.attr('href')) return; // let other icons behave normally
                var href = $el.attr('href');
                if (!/\/project\/\d+\/edit$/.test(href)) return; // not project edit
                e.preventDefault();
                // extract id
                var m = href.match(/\/project\/(\d+)\/edit$/);
                if (!m) return;
                var projectId = m[1];
                // fetch edit payload
                $.ajax({
                    url: getMeta('app-url').replace(/\/$/, '') + '/project/' + projectId + '/edit',
                    type: 'GET',
                    dataType: 'json',
                    success: function (data) {
                        try {
                            // Populate basic fields
                            $('#edit_project_id').val(data.id);
                            $('#edit_title').val(data.title || '');
                            $('#edit_description').val(data.description || '');
                            $('#edit_start_date').val(data.start_date || '');
                            $('#edit_due_date').val(data.due_date || '');

                            // Reference URLs
                            try {
                                var container = document.getElementById('edit_project_reference_urls_container');
                                container.innerHTML = '';
                                var urls = [];
                                if (Array.isArray(data.reference_urls)) urls = data.reference_urls;
                                else if (typeof data.reference_urls === 'string') {
                                    try { var parsed = JSON.parse(data.reference_urls); if (Array.isArray(parsed)) urls = parsed; } catch(_){}
                                }
                                if ((!urls || !urls.length) && data.reference_url) urls = [data.reference_url];
                                function makeRow(value, withAdd) {
                                    var row = document.createElement('div');
                                    row.className = 'd-flex gap-2 align-items-center';
                                    row.innerHTML = '<input type="url" class="form-control input-text" name="reference_urls[]" placeholder="https://example.com">' + (withAdd ? ' <button type="button" class="btn btn-submit-black add-ref-url" aria-label="Add URL"><span class="material-symbols-outlined">add</span></button>' : ' <button type="button" class="btn btn-danger remove-ref-url" aria-label="Remove URL"><span class="material-symbols-outlined">close</span></button>');
                                    container.appendChild(row);
                                    var inp = row.querySelector('input[type="url"]'); if (inp && value) inp.value = value;
                                }
                                if (urls && urls.length) { urls.forEach(function(u){ makeRow(u, false); }); makeRow('', true); } else { makeRow('', true); }
                            } catch (e) {}

                            // Part of project select
                            populatePartOfProjectSelects(data.id, data.title || '', data.part_of_project || '');

                            // Departments/divisions
                            loadDepartments(function () {
                                try { $('#edit_department').val(data.department_id).trigger('change'); } catch(_){}
                                loadDivisions(data.department_id, function () {
                                    try { $('#edit_division').val(data.division_id); } catch(_){}
                                });
                            });

                            // Image preview
                            if (data.image) {
                                var url = getMeta('app-url').replace(/\/$/, '') + '/file/project/' + data.image.replace(/^\//, '');
                                var label = document.getElementById('editImageLabel');
                                if (label) {
                                    label.style.backgroundImage = 'url(' + url + ')';
                                    label.classList.add('has-image');
                                    label.style.backgroundSize = 'cover';
                                    label.style.opacity = '1';
                                    document.getElementById('editImageClearBtn')?.classList.remove('d-none');
                                }
                            } else {
                                var lbl = document.getElementById('editImageLabel');
                                if (lbl) {
                                    lbl.style.backgroundImage = "url('" + getMeta('app-url').replace(/\/$/, '') + "/asset/img/background/add-image.png')";
                                    lbl.classList.remove('has-image');
                                    lbl.style.opacity = '0.5';
                                    document.getElementById('editImageClearBtn')?.classList.add('d-none');
                                }
                            }

                            // Existing reference files
                            var existingFiles = Array.isArray(data.reference_files) ? data.reference_files.slice() : (data.reference_file ? (Array.isArray(data.reference_file) ? data.reference_file.slice() : [data.reference_file]) : []);
                            try { document.getElementById('existing_reference_files_input').value = JSON.stringify(existingFiles); } catch(_){}
                            try {
                                var existingContainer = document.getElementById('existing_reference_files');
                                if (existingContainer) {
                                    existingContainer.innerHTML = '';
                                    if (existingFiles.length > 0) {
                                        var title = document.createElement('div'); title.className = 'fw-bold mb-2'; title.textContent = 'Current Files:'; existingContainer.appendChild(title);
                                        var list = document.createElement('div'); list.className = 'existing-files-list w-100';
                                        existingFiles.forEach(function(fn){
                                            var item = document.createElement('div'); item.className = 'existing-file-item d-flex align-items-center justify-content-between mb-2 p-2 bg-light border rounded';
                                            var info = document.createElement('div'); info.className = 'd-flex align-items-center flex-grow-1';
                                            var icon = document.createElement('span'); icon.className = 'material-symbols-outlined me-2'; icon.textContent = 'description';
                                            var link = document.createElement('a'); link.href = getMeta('app-url').replace(/\/$/, '') + '/file/project/' + fn; link.textContent = fn; link.target = '_blank'; link.className = 'text-decoration-none';
                                            var removeBtn = document.createElement('button'); removeBtn.type='button'; removeBtn.className='btn btn-sm btn-outline-danger'; removeBtn.innerHTML='&times;'; removeBtn.addEventListener('click', function(){
                                                existingFiles = existingFiles.filter(function(f){ return f !== fn; });
                                                try { document.getElementById('existing_reference_files_input').value = JSON.stringify(existingFiles); } catch(_){}
                                                // re-render
                                                this.parentNode && this.parentNode.parentNode && this.parentNode.parentNode.removeChild(this.parentNode);
                                            });
                                            info.appendChild(icon); info.appendChild(link); item.appendChild(info); item.appendChild(removeBtn); list.appendChild(item);
                                        });
                                        existingContainer.appendChild(list);
                                    }
                                }
                            } catch(_){}

                            // Clear file input for new files
                            try { $('#edit_reference_file').val(''); } catch(_){}

                            // co-authors & contributors: set hidden inputs and render badges for display
                            try {
                                var co = data.co_authors || [];
                                var cont = data.contributors || data.executors || [];
                                try { $('#edit_co_author').val(JSON.stringify((co.map && co.map(function(c){ return c.id; })) || [])); } catch(_){ }
                                try { $('#edit_contributors').val(JSON.stringify((cont.map && cont.map(function(c){ return c.id; })) || [])); } catch(_){ }
                                renderSelectedBadges('edit_selected_co_authors', co, 'edit_co_author');
                                renderSelectedBadges('edit_selected_contributors', cont, 'edit_contributors');
                            } catch(_){}

                            // Show modal
                            var modalEl = document.getElementById('editProjectModal');
                            if (modalEl) {
                                var m = bootstrap && bootstrap.Modal && bootstrap.Modal.getOrCreateInstance ? bootstrap.Modal.getOrCreateInstance(modalEl) : new bootstrap.Modal(modalEl);
                                m.show();
                            }
                        } catch (e) {
                            console.error('Failed to populate edit modal', e);
                        }
                    },
                    error: function (xhr) {
                        alert('Gagal mengambil data untuk edit');
                    }
                });
            });

            // Handle edit project form submission
            var isSubmitting = false;
            $(document).off('submit', '#editProjectForm').on('submit', '#editProjectForm', function (e) {
                e.preventDefault();
                if (isSubmitting) return;
                isSubmitting = true;
                var projectId = $('#edit_project_id').val();
                if (!projectId) { alert('Project ID tidak ditemukan'); isSubmitting = false; return; }
                var formEl = this;
                var formData = new FormData(formEl);
                // map reference_urls[] to single reference_url
                try {
                    var urlInputs = formEl.querySelectorAll('input[name="reference_urls[]"]');
                    var urls = Array.from(urlInputs).map(function(i){ return (i.value || '').trim(); }).filter(Boolean);
                    if (urls.length) formData.set('reference_url', urls[0]); else formData.set('reference_url', '');
                } catch(_){}
                formData.append('_method', 'PUT');
                // attach newly selected files
                try {
                    var newFiles = document.getElementById('edit_reference_file').files || [];
                    Array.from(newFiles).forEach(function(f){ formData.append('reference_file[]', f); });
                } catch(_){}

                $('#editModalLoader').removeClass('d-none');
                var submitBtn = $('#editProjectForm button[type="submit"]');
                submitBtn.prop('disabled', true);

                $.ajax({
                    url: getMeta('app-url').replace(/\/$/, '') + '/project/' + projectId,
                    type: 'POST',
                    data: formData,
                    contentType: false,
                    processData: false,
                    success: function (res) {
                        try { if (res && (res.status === 'success' || res.message)) { var msg = res.message || 'Project updated successfully!'; if (typeof showFloatingAlert === 'function') showFloatingAlert(msg, 'success', 1500); else alert(msg); } } catch(_){}
                        // hide modal and refresh project detail
                        setTimeout(function(){ try { var me = bootstrap.Modal.getInstance(document.getElementById('editProjectModal')); if (me) me.hide(); } catch(_){} fetchProject(getMeta('project-id')); }, 700);
                    },
                    error: function (xhr) {
                        if (xhr.status === 422) {
                            try {
                                var errors = xhr.responseJSON.errors || {};
                                var listHtml = '';
                                Object.keys(errors).forEach(function(k){ var v = errors[k]; if (Array.isArray(v)) v.forEach(function(m){ listHtml += '\n- ' + m; }); else listHtml += '\n- ' + v; });
                                if (typeof showFloatingAlert === 'function') showFloatingAlert(listHtml, 'warning', 5000); else alert(listHtml);
                            } catch (e) { alert('Validation failed'); }
                        } else {
                            alert('Failed to update project');
                        }
                    },
                    complete: function () {
                        $('#editModalLoader').addClass('d-none');
                        submitBtn.prop('disabled', false);
                        isSubmitting = false;
                    }
                });
            });

        }); // end $(function)

    })(jQuery);
