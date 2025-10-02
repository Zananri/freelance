(function ($) {
    "use strict";

    function getMeta(name) {
        return $('meta[name="' + name + '"]').attr("content") || "";
    }

    var appUrl = (
        document
            .querySelector('meta[name="app-url"]')
            ?.getAttribute("content") || ""
    ).replace(/\/$/, "");

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

    function showFloatingAlert(message, type = "success", delayMs = 2500) {
        try {
            if (typeof window.showAlertMsg === "function") {
                window.showAlertMsg(message, "light", delayMs);
                                    try { 
                                        // clear native inputs
                                        var imgInp = document.getElementById('inline_feedback_image_input'); if (imgInp) imgInp.value = '';
                                        var filesInp = document.getElementById('inline_feedback_files_input'); if (filesInp) filesInp.value = '';
                                        // clear image preview
                                        window.__inlineFeedbackImageFile = null;
                                        var previewContainer = document.getElementById('inline_feedback_image_preview');
                                        if (previewContainer && previewContainer.parentNode) {
                                            previewContainer.parentNode.removeChild(previewContainer);
                                        }
                                    }catch(_){ }
                                    try { 
                                        // clear selected files array and remove preview node(s)
                                        window.inlineFeedbackSelectedFiles = [];
                                        if (typeof renderInlineFilesPreview === 'function') renderInlineFilesPreview();
                                        var pNode = document.getElementById('inline_feedback_files_preview'); if (pNode && pNode.parentNode) pNode.parentNode.removeChild(pNode);
                                        // also clear any template preview if present
                                        var alt = document.getElementById('add_project_reference_files_preview'); if (alt) alt.innerHTML = '';
                                    }catch(_){ }
                                    try {
                                        // clear hidden textarea fallback
                                        var tx = document.getElementById('inline_feedback_comment'); if (tx) tx.value = '';
                                    } catch(_) {}
                                    try {
                                        // clear Quill editor content and selection safely
                                        if (window.__quillProjectFeedbackInline && window.__quillProjectFeedbackInline.root) {
                                            try { window.__quillProjectFeedbackInline.root.innerHTML = ''; window.__quillProjectFeedbackInline.setSelection && window.__quillProjectFeedbackInline.setSelection(0); } catch(_){}
                                        }
                                    } catch(_){}
                                    try {
                                        // force re-init of Quill instance (if needed)
                                        window.__quillProjectFeedbackInline = null;
                                        initInlineFeedback && initInlineFeedback();
                                    } catch(_){}
            }
        } catch (e) {
            /* no-op */
        }
        // No blocking native alert fallback; prefer console log to avoid modal dialogs.
        try {
            console.log(
                "[floatingAlert]",
                typeof message === "string"
                    ? message.replace(/<[^>]+>/g, "")
                    : String(message)
            );
        } catch (e) {
            /* no-op */
        }
        try {
            // Fallback: create a lightweight in-page toast so we never trigger browser native alert()
            var tmsg =
                typeof message === "string"
                    ? message.replace(/<[^>]+>/g, "")
                    : String(message);
            try {
                var tmpId = "tmp-floating-alert";
                var existing = document.getElementById(tmpId);
                if (existing) {
                    // update text and reset timer
                    existing.textContent = tmsg;
                    existing.className =
                        "tmp-floating-alert show " + (type || "");
                    clearTimeout(existing._tmpTimeout);
                    existing._tmpTimeout = setTimeout(function () {
                        try {
                            existing.remove();
                        } catch (_) {}
                    }, delayMs || 2500);
                } else {
                    var div = document.createElement("div");
                    div.id = tmpId;
                    div.textContent = tmsg;
                    div.className = "tmp-floating-alert show " + (type || "");
                    var s = div.style;
                    s.position = "fixed";
                    s.right = "18px";
                    s.top = "18px";
                    s.zIndex = 1060;
                    s.background = "rgba(0,0,0,0.8)";
                    s.color = "#fff";
                    s.padding = "10px 14px";
                    s.borderRadius = "6px";
                    s.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
                    s.maxWidth = "320px";
                    s.fontSize = "13px";
                    document.body.appendChild(div);
                    div._tmpTimeout = setTimeout(function () {
                        try {
                            div.remove();
                        } catch (_) {}
                    }, delayMs || 2500);
                }
            } catch (e) {
                // as an absolute last resort, log to console (do not use native alert)
                try {
                    console.log(tmsg);
                } catch (_) {}
            }
        } catch (e) {}
    }

    // Build 1-2 character initials from a title/name
    // Fallback helper: human-friendly relative time formatter (used in feedback rendering)
    function timeAgo(createdAt) {
        try {
            var time = new Date(createdAt);
            if (isNaN(time.getTime())) return "";
            var now = new Date();
            var diff = (now.getTime() - time.getTime()) / 1000;

            if (diff < 60) {
                return "just now";
            } else if (diff < 3600) {
                return Math.round(diff / 60) + " minute ago";
            } else if (diff < 86400) {
                return Math.round(diff / 3600) + " hour ago";
            } else if (diff < 604800) {
                return Math.round(diff / 86400) + " day ago";
            } else if (diff < 2592000) {
                return Math.round(diff / 604800) + " week ago";
            } else if (diff < 31526000) {
                return Math.round(diff / 2592000) + " month ago";
            } else if (diff < 630720000) {
                return Math.round(diff / 31526000) + " year ago";
            }

            return time.toDateString();
        } catch (e) {
            return "";
        }
    }

    // Fallback helper: normalize avatar URL or return default avatar
    function resolveAvatar(raw) {
        try {
            if (!raw) return getMeta('app-url').replace(/\/$/, '') + '/asset/img/avatar.png';
            var s = String(raw || '');
            if (s.indexOf('http://') === 0 || s.indexOf('https://') === 0) return s;
            if (s.indexOf('/') === 0) return getMeta('app-url').replace(/\/$/, '') + s;
            // assume stored filename
            return getMeta('app-url').replace(/\/$/, '') + '/file/profile_picture/' + s;
        } catch (e) {
            return getMeta('app-url').replace(/\/$/, '') + '/asset/img/avatar.png';
        }
    }

    function buildInitials(title) {
        try {
            if (!title) return "";
            var t = String(title || "").trim();
            if (!t) return "";
            var parts = t.split(/\s+/).filter(Boolean);
            if (parts.length === 1)
                return parts[0].substring(0, 2).toUpperCase();
            return (
                parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
            ).toUpperCase();
        } catch (e) {
            return "";
        }
    }

    // Basic sanitizer: allow a small whitelist of tags (p, br, strong, em, b, i, ul, ol, li, a)
    function sanitizeHtml(input) {
        try {
            if (!input) return "";
            var allowed = ['p','br','strong','em','b','i','ul','ol','li','a'];
            // Decode HTML entities first (handle cases where server stored escaped HTML like &lt;p&gt;)
            var decoder = document.createElement('textarea');
            decoder.innerHTML = String(input);
            var decoded = decoder.value || decoder.textContent || String(input);
            // Create a template element to parse HTML
            var template = document.createElement('template');
            template.innerHTML = decoded;
            var walker = document.createTreeWalker(template.content, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, null, false);
            var node;
            var removeStack = [];
            while ((node = walker.nextNode())) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    var tag = node.tagName.toLowerCase();
                    if (allowed.indexOf(tag) === -1) {
                        // replace disallowed element with its text content
                        var txt = document.createTextNode(node.textContent || '');
                        node.parentNode.replaceChild(txt, node);
                        // reposition walker safely by starting over
                        walker = document.createTreeWalker(template.content, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, null, false);
                    } else {
                        // sanitize attributes: only allow href on <a>
                        if (tag === 'a') {
                            var href = node.getAttribute('href') || '';
                            if (!href || (!href.match(/^https?:\/\//) && href.indexOf('/') !== 0 && href.indexOf('#') !== 0)) {
                                node.removeAttribute('href');
                            }
                        } else {
                            // remove all attributes on allowed tags except href on a
                            var attrs = Array.from(node.attributes || []);
                            attrs.forEach(function(a){ if (a.name !== 'href') node.removeAttribute(a.name); });
                        }
                    }
                }
            }
            return template.innerHTML;
        } catch (e) {
            return String(input).replace(/</g,'&lt;').replace(/>/g,'&gt;');
        }
    }

    // Deterministic color pick from text
    function getRandomColorFromText(text) {
        try {
            var colors = [
                "#6A5AE0",
                "#FF8A3C",
                "#00A881",
                "#D4526E",
                "#3E8EDE",
                "#546E7A",
                "#8E44AD",
                "#2E7D32",
                "#AD1457",
                "#EF6C00",
            ];
            var h = 0;
            for (var i = 0; i < (text || "").length; i++) {
                h = text.charCodeAt(i) + ((h << 5) - h);
            }
            return colors[Math.abs(h) % colors.length];
        } catch (e) {
            return "#6A5AE0";
        }
    }

    // Build a simple SVG data URI with initials centered
    function buildInitialsSvg(initials, bgColor) {
        try {
            var w = 256,
                h = 256; // canvas size for crisp output
            var text = (initials || "").toUpperCase();
            // font size relative to canvas width for consistent scaling
            var fontSize = Math.round(w * 0.44);
            // Use viewBox so SVG scales nicely; center text with dominant-baseline & text-anchor
            var svg = "";
            svg +=
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' +
                w +
                " " +
                h +
                '" width="' +
                w +
                '" height="' +
                h +
                '">';
            svg +=
                '<rect width="100%" height="100%" fill="' +
                (bgColor || "#6A5AE0") +
                '"/>';
            svg +=
                '<text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" fill="#ffffff" font-family="Inter, Arial, Helvetica, sans-serif" font-weight="700" font-size="' +
                fontSize +
                '">' +
                (text || "") +
                "</text>";
            svg += "</svg>";
            return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
        } catch (e) {
            return "/asset/img/avatar.png";
        }
    }

    // Minimal delete confirmation modal helper (for feedback/reply) used inside project detail
    function showDeleteConfirmModal(opts) {
        try {
            var id = opts.id;
            var type = opts.type || "feedback";
            var content = opts.content || "";
            var modalId =
                "deleteConfirmModal_detail_" +
                (type || "f") +
                "_" +
                id +
                "_" +
                Date.now();
            var html = "";
            html +=
                '<div class="modal fade" id="' +
                modalId +
                '" tabindex="-1" aria-modal="true" role="dialog">';
            html += '<div class="modal-dialog modal-dialog-centered">';
            html += '<div class="modal-content modal-content-custom">';
            html += '<div class="modal-body modal-body-custom">';
            html += '<div class="text-center mb-2">';
            html += '<div class="task-description-container">';
            html +=
                '<p class="task-description mb-0">' +
                String(content || "")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;") +
                "</p>";
            html += '</div></div><hr class="my-2">';
            html +=
                '<p class="fw-normal fs-6 text-center mb-4">Are you sure you want to delete this ' +
                (type === "reply" ? "reply" : "feedback") +
                "?</p>";
            html += '<div class="modal-footer modal-footer-custom">';
            html +=
                '<button type="button" class="btn btn-custom-close" data-bs-dismiss="modal">Cancel</button>';
            html +=
                '<button type="button" class="btn btn-submit-black" id="' +
                modalId +
                '_confirmBtn">Delete</button>';
            html += "</div></div></div></div></div>";

            var parentModalEl = document.getElementById("projectFeedbackModal");
            var parentWasOpen = false;
            var parentInst = null;
            try {
                if (parentModalEl && parentModalEl.classList.contains("show")) {
                    parentWasOpen = true;
                    parentInst =
                        bootstrap.Modal.getInstance(parentModalEl) ||
                        new bootstrap.Modal(parentModalEl);
                }
            } catch (_) {}

            // create and show delete modal only after parent has been hidden (if it was open)
            function createAndShowDeleteModal() {
                // insert modal HTML
                document.body.insertAdjacentHTML("beforeend", html);
                var modalEl = document.getElementById(modalId);
                if (!modalEl) return;
                var inst = null;
                try {
                    inst = new bootstrap.Modal(modalEl, { backdrop: "static" });
                } catch (_) {
                    inst = null;
                }

                // when delete modal hides, clean it up and restore parent if needed
                var hiddenHandler = function () {
                    try {
                        if (inst && typeof inst.dispose === "function")
                            inst.dispose();
                    } catch (_) {}
                    try {
                        modalEl.remove();
                    } catch (_) {}
                    try {
                        modalEl.removeEventListener(
                            "hidden.bs.modal",
                            hiddenHandler
                        );
                    } catch (_) {}
                    if (parentWasOpen && parentInst) {
                        setTimeout(function () {
                            try {
                                parentInst.show();
                            } catch (_) {}
                        }, 120);
                    }
                };
                modalEl.addEventListener("hidden.bs.modal", hiddenHandler);

                var btn = document.getElementById(modalId + "_confirmBtn");
                if (btn) {
                    btn.addEventListener("click", function () {
                        try {
                            btn.disabled = true;
                            btn.innerHTML =
                                '<span class="spinner-border spinner-border-sm me-1"></span>Deleting...';
                        } catch (_) {}
                        if (typeof opts.onConfirm === "function") {
                            try {
                                opts.onConfirm(function (done) {
                                    if (done === false) {
                                        btn.disabled = false;
                                        btn.innerHTML = "Delete";
                                        return;
                                    }
                                    try {
                                        inst && inst.hide();
                                    } catch (_) {}
                                });
                            } catch (e) {
                                btn.disabled = false;
                                btn.innerHTML = "Delete";
                            }
                        } else {
                            try {
                                inst && inst.hide();
                            } catch (_) {}
                        }
                    });
                }

                try {
                    inst && inst.show();
                } catch (_) {}
            }

            if (parentWasOpen && parentInst) {
                // attach one-time listener and then hide parent
                var once = function () {
                    try {
                        parentModalEl.removeEventListener(
                            "hidden.bs.modal",
                            once
                        );
                    } catch (_) {}
                    createAndShowDeleteModal();
                };
                parentModalEl.addEventListener("hidden.bs.modal", once);
                try {
                    parentModalEl._suppressFeedbackClear = true;
                    parentInst.hide();
                } catch (_) {}
            } else {
                createAndShowDeleteModal();
            }
        } catch (e) {
            console.warn("showDeleteConfirmModal error", e);
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
        var projectFeedbackModalEl = document.querySelector(
            ".feedback-detail-project"
        );
        if (projectFeedbackModalEl) {
            var modalTitle = projectFeedbackModalEl.querySelector(
                ".feedback-modal-title"
            );
            var modalBody =
                projectFeedbackModalEl.querySelector(".feedback-content");

            function getProjectFeedbackFooter() {
                try {
                    return (
                        projectFeedbackModalEl.querySelector(
                            ".feedback-modal-footer"
                        ) ||
                        projectFeedbackModalEl.querySelector(".modal-footer") ||
                        projectFeedbackModalEl.querySelector(
                            ".modal-footer-custom"
                        )
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
                            const projectId =
                                projectFeedbackModalEl.getAttribute(
                                    "data-project-id"
                                );
                            if (projectId) showAddFeedbackForm(projectId);
                        });
                        footer.appendChild(addBtn);
                    } catch (_) {}
                } else {
                    try {
                        const addFeedbackButton =
                            document.getElementById("addFeedbackButton");
                        if (addFeedbackButton) {
                            addFeedbackButton.textContent = "Add Feedback";
                            addFeedbackButton.classList.add("w-100");
                            const fresh = addFeedbackButton.cloneNode(true);
                            addFeedbackButton.parentNode.replaceChild(
                                fresh,
                                addFeedbackButton
                            );
                            fresh.addEventListener("click", function () {
                                const projectId =
                                    projectFeedbackModalEl.getAttribute(
                                        "data-project-id"
                                    );
                                if (projectId) showAddFeedbackForm(projectId);
                            });
                        }
                    } catch (_) {}
                }
            }

            try {
                if (typeof window.showFloatingAlert !== "function") {
                    window.showFloatingAlert = showFloatingAlert;
                }
            } catch (_) {}

            function showImageModal(imageSrc) {
                window.open(imageSrc, "_blank");
            }

            function loadFeedbackData(projectId) {
                const feedbackListEl = document.getElementById(
                    "projectFeedbackList"
                );
                if (feedbackListEl)
                    feedbackListEl.innerHTML =
                        '<div class="text-center my-4"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';

                fetch(
                    getMeta("app-url").replace(/\/$/, "") +
                        "/project-feedbacks/" +
                        projectId
                )
                    .then(function (response) {
                        if (!response.ok)
                            throw new Error("Failed to fetch feedback data");
                        return response.json();
                    })
                    .then(function (data) {
                        if (!data.data || data.data.length === 0) {
                            feedbackListEl.innerHTML =
                                '<p class="text-center text-muted">No feedback available for this project.</p>';
                            return;
                        }

                        // Bersihkan container
                        feedbackListEl.innerHTML = "";

                        data.data.forEach(function (feedback) {
                            var feedbackItem = document.createElement("div");
                            feedbackItem.className = "feedback-item mb-3 p-3";

                            // Header Feedback
                            var headerDiv = document.createElement("div");
                            headerDiv.className =
                                "d-flex align-items-center mb-2";

                            var img = document.createElement("img");
                            var emp = feedback.employee || {};
                            var raw =
                                emp.user_photo ||
                                emp.profile_picture ||
                                emp.photo ||
                                feedback.employee_photo ||
                                "";
                            var url =
                                getMeta("app-url") + "/asset/img/avatar.png";
                            if (raw) {
                                if (String(raw).startsWith("http")) url = raw;
                                else if (String(raw).startsWith("/"))
                                    url = getMeta("app-url") + raw;
                                else
                                    url =
                                        getMeta("app-url") +
                                        "/file/profile_picture/" +
                                        raw;
                            }
                            img.src = url;
                            img.alt = "Employee Photo";
                            img.className = "rounded-circle me-2";
                            img.style.width = "25px";
                            img.style.height = "25px";

                            var infoDiv = document.createElement("div");
                            var empName = document.createElement("p");
                            empName.style.fontSize = "10px";
                            empName.style.marginBottom = "0";
                            empName.textContent =
                                (feedback.employee && feedback.employee.name) ||
                                feedback.employee_name ||
                                "Unknown";
                            const dateDiv = document.createElement("div");
                            dateDiv.className = "text-muted small";
                            dateDiv.style.fontSize = "8px";
                            dateDiv.style.color = "#74777F";
                            if (feedback.created_at) {
                                dateDiv.textContent = timeAgo(
                                    feedback.created_at
                                );
                            } else {
                                dateDiv.textContent = "";
                            }

                            infoDiv.appendChild(empName);
                            infoDiv.appendChild(dateDiv);

                            headerDiv.appendChild(img);
                            headerDiv.appendChild(infoDiv);

                            // Comment
                            var commentDiv = document.createElement("div");
                            commentDiv.className = "feedback-comment";
                            commentDiv.style.fontSize = "10px";
                            // allow a small whitelist of HTML (p, br, a, strong, em, ul/ol/li)
                            try {
                                commentDiv.innerHTML = sanitizeHtml(feedback.feedback_comment || "");
                            } catch (_) {
                                commentDiv.textContent = feedback.feedback_comment || "";
                            }

                            feedbackItem.appendChild(headerDiv);
                            feedbackItem.appendChild(commentDiv);

                            // Normalize top-level image URL (accept absolute, /file/* or relative filename)
                            try {
                                var topImageUrl = feedback.image || "";
                                if (topImageUrl) {
                                    var isAbs = typeof topImageUrl === 'string' && (topImageUrl.indexOf('http://') === 0 || topImageUrl.indexOf('https://') === 0);
                                    var isFilePath = typeof topImageUrl === 'string' && (topImageUrl.indexOf('/file/') === 0 || topImageUrl.indexOf('file/') === 0);
                                    var isStorage = typeof topImageUrl === 'string' && (topImageUrl.indexOf('/storage/') === 0 || topImageUrl.indexOf('storage/') === 0);
                                    if (!isAbs && !isFilePath && !isStorage) {
                                        topImageUrl = getMeta('app-url').replace(/\/$/, '') + '/file/project_feedback/' + topImageUrl;
                                    } else if (!isAbs && (isFilePath || isStorage)) {
                                        topImageUrl = topImageUrl.indexOf('/') === 0 ? (getMeta('app-url').replace(/\/$/, '') + topImageUrl) : (getMeta('app-url').replace(/\/$/, '') + '/' + topImageUrl);
                                    }
                                }
                            } catch (e) {
                                topImageUrl = feedback.image || '';
                            }

                            // Reference files normalization (array-first, fallback single)
                            var topRefFiles = [];
                            try {
                                var topRfVal = feedback.reference_files;
                                if (!Array.isArray(topRfVal) && typeof topRfVal === 'string') {
                                    try { var parsed = JSON.parse(topRfVal); if (Array.isArray(parsed)) topRfVal = parsed; } catch(_) {}
                                }
                                if (Array.isArray(topRfVal) && topRfVal.length > 0) {
                                    topRefFiles = topRfVal.map(function(f){
                                        if (!f) return null;
                                        var isAbs = typeof f === 'string' && (f.indexOf('http://') === 0 || f.indexOf('https://') === 0);
                                        var isRefPath = typeof f === 'string' && (f.indexOf('/file/project_reference_files/') === 0 || f.indexOf('file/project_reference_files/') === 0 || f.indexOf('/file/') === 0);
                                        if (!isAbs && !isRefPath) return getMeta('app-url').replace(/\/$/, '') + '/file/project_reference_files/' + f;
                                        if (!isAbs && isRefPath) return f.indexOf('/') === 0 ? (getMeta('app-url').replace(/\/$/, '') + f) : (getMeta('app-url').replace(/\/$/, '') + '/' + f);
                                        return f;
                                    }).filter(Boolean);
                                } else {
                                    var singleTop = feedback.reference_file || '';
                                    if (singleTop) {
                                        var isAbs2 = typeof singleTop === 'string' && (singleTop.indexOf('http://') === 0 || singleTop.indexOf('https://') === 0);
                                        var isRefPath2 = typeof singleTop === 'string' && (singleTop.indexOf('/file/project_reference_files/') === 0 || singleTop.indexOf('file/project_reference_files/') === 0 || singleTop.indexOf('/file/') === 0);
                                        if (!isAbs2 && !isRefPath2) singleTop = getMeta('app-url').replace(/\/$/, '') + '/file/project_reference_files/' + singleTop;
                                        else if (!isAbs2 && isRefPath2) singleTop = singleTop.indexOf('/') === 0 ? (getMeta('app-url').replace(/\/$/, '') + singleTop) : (getMeta('app-url').replace(/\/$/, '') + '/' + singleTop);
                                        topRefFiles = [singleTop];
                                    }
                                }
                            } catch(_) { topRefFiles = []; }

                            // Reference URLs normalization
                            var topRefUrls = [];
                            try {
                                var topRuVal = feedback.reference_urls;
                                if (!Array.isArray(topRuVal) && typeof topRuVal === 'string') {
                                    try { var parsed2 = JSON.parse(topRuVal); if (Array.isArray(parsed2)) topRuVal = parsed2; } catch(_) {}
                                }
                                if (Array.isArray(topRuVal) && topRuVal.length > 0) {
                                    topRefUrls = topRuVal.filter(function(u){ return typeof u === 'string' && u.trim() !== ''; });
                                } else if (feedback.reference_url) {
                                    topRefUrls = [feedback.reference_url];
                                }
                            } catch(_) { topRefUrls = []; }

                            // Render reference URLs / files if any
                            if ((Array.isArray(topRefUrls) && topRefUrls.length > 0) || (Array.isArray(topRefFiles) && topRefFiles.length > 0)) {
                                var refWrap = document.createElement('div');
                                refWrap.className = 'feedback-reference-container mb-2';
                                if (Array.isArray(topRefUrls) && topRefUrls.length > 0) {
                                    topRefUrls.forEach(function(u, idx){
                                        try {
                                            var a = document.createElement('a');
                                            a.href = u;
                                            a.target = '_blank';
                                            a.className = 'feedback-reference-url me-2';
                                            a.innerHTML = '<span class="material-symbols-outlined">link</span> Link ' + (idx+1);
                                            refWrap.appendChild(a);
                                        } catch(_) {}
                                    });
                                }
                                if (Array.isArray(topRefFiles) && topRefFiles.length > 0) {
                                    topRefFiles.forEach(function(f, idx){
                                        try {
                                            var af = document.createElement('a');
                                            af.href = f;
                                            af.download = '';
                                            af.className = 'feedback-reference-file ms-2';
                                            af.innerHTML = '<span class="material-symbols-outlined">draft</span> FILE ' + (idx+1);
                                            refWrap.appendChild(af);
                                        } catch(_) {}
                                    });
                                }
                                feedbackItem.appendChild(refWrap);
                            }

                            // Render top image if present
                            if (topImageUrl) {
                                try {
                                    var imgEl = document.createElement('img');
                                    imgEl.src = topImageUrl;
                                    imgEl.className = 'img-fluid rounded mb-2 feedback-image';
                                    imgEl.style.width = '100%';
                                    imgEl.style.maxWidth = '260px';
                                    imgEl.style.height = 'auto';
                                    imgEl.style.borderRadius = '8px';
                                    imgEl.style.cursor = 'pointer';
                                    imgEl.addEventListener('click', function(){ try { showImageModal(topImageUrl); } catch(_) { window.open(topImageUrl, '_blank'); } });
                                    feedbackItem.appendChild(imgEl);
                                } catch(_) {}
                            }

                            // Actions: Reply always; Edit/Delete only if this feedback belongs to current user
                            try {
                                var actionsDiv = document.createElement('div');
                                actionsDiv.className = 'feedback-actions mt-2 d-flex gap-3 align-items-center';
                                // make actions occupy full width and align to right
                                actionsDiv.style.width = '100%';
                                actionsDiv.style.justifyContent = 'flex-end';

                                // Reply (icon + text) — same markup as project.js
                                try {
                                    var replyRep = document.createElement('span');
                                    replyRep.className = 'd-flex align-items-center feedback-reply-trigger';
                                    replyRep.style.cssText = 'cursor:pointer; color:#555; font-size:10px;';
                                    replyRep.setAttribute('data-feedback-id', String(feedback.id));
                                    replyRep.setAttribute('data-project-id', String(getMeta('project-id')));
                                    var replyIcon = document.createElement('span');
                                    replyIcon.className = 'material-symbols-outlined';
                                    replyIcon.style.cssText = 'font-size:14px; line-height:1; margin-right:5px;';
                                    replyIcon.textContent = 'reply';
                                    var replyText = document.createElement('span');
                                    replyText.textContent = 'Reply';
                                    replyRep.appendChild(replyIcon);
                                    replyRep.appendChild(replyText);
                                    replyRep.addEventListener('click', function(){ try { showReplyFeedbackForm && showReplyFeedbackForm(getMeta('project-id'), feedback.id); } catch(_){} });
                                    actionsDiv.appendChild(replyRep);
                                } catch(_){}

                                // current user id
                                var currentEmployeeId = null;
                                try { currentEmployeeId = document.getElementById('projectFeedbackModal')?.getAttribute('data-employee-id') || getMeta('employee-id') || null; } catch(_){}
                                var fbEmployeeId = (feedback.employee && (feedback.employee.id || feedback.employee.employee_id)) || feedback.employee_id || (feedback.employee && feedback.employee.employee_id) || null;

                                var isOwner = false;
                                try { if (fbEmployeeId && currentEmployeeId && String(fbEmployeeId) === String(currentEmployeeId)) isOwner = true; } catch(_){}

                                if (isOwner) {
                                    // Edit (icon + text) — match project.js
                                    try {
                                        var editRep = document.createElement('span');
                                        editRep.className = 'd-flex align-items-center reply-edit-trigger';
                                        editRep.style.cssText = 'cursor:pointer; color:#555; font-size:10px;';
                                        editRep.setAttribute('data-feedback-id', String(feedback.id));
                                        var editIcon = document.createElement('span');
                                        editIcon.className = 'material-symbols-outlined';
                                        editIcon.style.cssText = 'font-size:14px; line-height:1; margin-right:5px;';
                                        editIcon.textContent = 'edit';
                                        var editText = document.createElement('span');
                                        editText.textContent = 'Edit';
                                        editRep.appendChild(editIcon);
                                        editRep.appendChild(editText);
                                        editRep.addEventListener('click', function(){ try { showEditFeedbackForm && showEditFeedbackForm(getMeta('project-id'), feedback.id, feedback); } catch(_){} });
                                        actionsDiv.appendChild(editRep);
                                    } catch(_){}

                                    // Delete (icon + text) — match project.js style
                                    try {
                                        var delRep = document.createElement('span');
                                        delRep.className = 'd-flex align-items-center reply-delete-trigger';
                                        delRep.style.cssText = 'cursor:pointer; color:#555; font-size:10px;';
                                        delRep.setAttribute('data-feedback-id', String(feedback.id));
                                        var delIcon = document.createElement('span');
                                        delIcon.className = 'material-symbols-outlined';
                                        delIcon.style.cssText = 'font-size:14px; line-height:1; margin-right:5px;';
                                        delIcon.textContent = 'delete';
                                        var delText = document.createElement('span');
                                        delText.textContent = 'Delete';
                                        delRep.appendChild(delIcon);
                                        delRep.appendChild(delText);
                                        delRep.addEventListener('click', function(){ try { showDeleteConfirmModal && showDeleteConfirmModal({ id: feedback.id, type: 'feedback', content: feedback.feedback_comment||'' }); } catch(_){} });
                                        actionsDiv.appendChild(delRep);
                                    } catch(_){}
                                }

                                feedbackItem.appendChild(actionsDiv);
                            } catch(_){}

                            feedbackListEl.appendChild(feedbackItem);
                        });
                    })
                    .catch(function (error) {
                        console.error(error);
                        if (feedbackListEl)
                            feedbackListEl.innerHTML =
                                '<p class="text-center text-danger">Error loading feedback.</p>';
                    });
            }

            loadFeedbackData(projectId);

            // Initialize Quill editors for feedback forms when modal content changes
            function initFeedbackQuillEditors(containerEl) {
                try {
                    // helper to prevent image paste/drop
                    function preventImageDropAndPaste(quill, selector) {
                        try {
                            var editor = document.querySelector(selector);
                            if (!editor || !quill) return;
                            editor.addEventListener('dragover', function(e){ try{ e.preventDefault(); }catch(_){} }, true);
                            editor.addEventListener('drop', function(e){ try{ if (!e.dataTransfer) return; var hasFiles = e.dataTransfer.files && e.dataTransfer.files.length>0; var html = e.dataTransfer.getData && e.dataTransfer.getData('text/html') || ''; if (hasFiles || /<img\s*/i.test(html)){ e.preventDefault(); e.stopImmediatePropagation(); return; } }catch(_){} }, true);
                            editor.addEventListener('paste', function(e){ try{ var clipboard = (e.clipboardData || window.clipboardData); if (!clipboard) return; var items = clipboard.items || []; for (var i=0;i<items.length;i++){ var t = items[i].type||''; if (t.indexOf && t.indexOf('image')===0){ e.preventDefault(); e.stopImmediatePropagation(); return; } } var html = clipboard.getData && clipboard.getData('text/html') || ''; if (/<img\s*/i.test(html)){ e.preventDefault(); e.stopImmediatePropagation(); return; } }catch(_){} }, true);
                        } catch(_){}
                    }

                    // safe create quill if container exists and not already created
                    function createQuillIfNeeded(editorSelector, toolbarSelector, globalName) {
                        try {
                            if (!document.querySelector(editorSelector)) return null;
                            if (window[globalName]) return window[globalName];
                            var q = new Quill(editorSelector, {
                                modules: { toolbar: toolbarSelector, clipboard: { matchVisual: false } },
                                theme: 'snow'
                            });
                            // remove any images inserted
                            try { var Delta = Quill.import && Quill.import('delta'); if (q && q.clipboard && typeof q.clipboard.addMatcher === 'function') { try{ q.clipboard.addMatcher('IMG', function(node, delta){ try{ return new Delta(); }catch(_){ return delta; } }); }catch(_){} } }catch(_){}
                            try { q.on && q.on('text-change', function(){ try{ var imgs = q.root.querySelectorAll('img'); imgs.forEach(function(i){ i.remove(); }); }catch(_){} }); }catch(_){}
                            try { preventImageDropAndPaste(q, editorSelector); }catch(_){}
                            window[globalName] = q;
                            return q;
                        } catch (e) { return null; }
                    }

                    // initialize any editors present inside modal body
                    try {
                        createQuillIfNeeded('#feedback_editor', '#feedback_toolbar', '__quillProjectFeedbackAdd');
                        createQuillIfNeeded('#reply_feedback_editor', '#reply_feedback_toolbar', '__quillProjectFeedbackReply');
                        createQuillIfNeeded('#edit_feedback_editor', '#edit_feedback_toolbar', '__quillProjectFeedbackEdit');
                    } catch (_) {}
                } catch (_) {}
            }

            // Call init on initial load and whenever modal body is reassigned
            try { initFeedbackQuillEditors(document.getElementById('projectFeedbackList')); } catch(_){}

            // Ensure Quill content is synced to hidden textarea before forms are submitted
            function syncAllFeedbackQuills() {
                try {
                    try { if (window.__quillProjectFeedbackAdd) { var ta = document.querySelector('#addFeedbackForm #feedback_comment'); if (ta) ta.value = window.__quillProjectFeedbackAdd.root.innerHTML || ''; } } catch(_){}
                    try { if (window.__quillProjectFeedbackReply) { var ta2 = document.querySelector('#replyFeedbackForm #feedback_comment'); if (ta2) ta2.value = window.__quillProjectFeedbackReply.root.innerHTML || ''; } } catch(_){}
                    try { if (window.__quillProjectFeedbackEdit) { var ta3 = document.querySelector('#editFeedbackForm #feedback_comment'); if (ta3) ta3.value = window.__quillProjectFeedbackEdit.root.innerHTML || ''; } } catch(_){}
                } catch(_){}
            }

            // Hook capture-phase submit on modal to ensure sync
            try {
                document.addEventListener('submit', function(ev){
                    try { var form = ev.target || null; if (!form) return; if (form.id === 'addFeedbackForm' || form.id === 'replyFeedbackForm' || form.id === 'editFeedbackForm') { syncAllFeedbackQuills(); // basic validation
                            try {
                                var tmp = (form.querySelector('#feedback_comment') || {}).value || '';
                                if (!tmp || String(tmp).replace(/<[^>]+>/g,'').trim() === '') {
                                    ev.preventDefault();
                                    window.showFloatingAlert && window.showFloatingAlert('Feedback is required','warning',3000);
                                    return false;
                                }
                            } catch(_){}
                        }
                    } catch(_){}
                }, true);
            } catch(_){}

            // Clean up Quill instances when modal hidden to avoid stale instances
            try {
                var pfModal = document.getElementById('projectFeedbackModal');
                if (pfModal) {
                    pfModal.addEventListener('hidden.bs.modal', function(){
                        try { if (window.__quillProjectFeedbackAdd) { window.__quillProjectFeedbackAdd = null; } } catch(_){}
                        try { if (window.__quillProjectFeedbackReply) { window.__quillProjectFeedbackReply = null; } } catch(_){}
                        try { if (window.__quillProjectFeedbackEdit) { window.__quillProjectFeedbackEdit = null; } } catch(_){}
                        // also clear editors' DOM if forms are present and were inserted
                        try { var ed = document.querySelector('#feedback_editor'); if (ed) ed.innerHTML = ''; } catch(_){}
                        try { var ed2 = document.querySelector('#reply_feedback_editor'); if (ed2) ed2.innerHTML = ''; } catch(_){}
                        try { var ed3 = document.querySelector('#edit_feedback_editor'); if (ed3) ed3.innerHTML = ''; } catch(_){}
                    });
                }
            } catch(_){}

            // --- Inline quick feedback editor (on project detail panel) ---
            try {
                // Initialize inline Quill when DOM ready
                function initInlineFeedback() {
                    try {
                        if (typeof Quill === 'undefined') return;
                        if (window.__quillProjectFeedbackInline) return window.__quillProjectFeedbackInline;
                        var editorEl = document.getElementById('inline_feedback_editor');
                        if (!editorEl) return null;

                        // create Quill with minimal toolbar (toolbar hidden by default)
                        var q = new Quill('#inline_feedback_editor', {
                            modules: { toolbar: '#inline_feedback_toolbar', clipboard: { matchVisual: false } },
                            theme: 'snow',
                            placeholder: 'Write feedback...'
                        });

                        // Remove images if pasted
                        try { var Delta = Quill.import && Quill.import('delta'); if (q && q.clipboard && typeof q.clipboard.addMatcher === 'function') { try{ q.clipboard.addMatcher('IMG', function(node, delta){ try{ return new Delta(); }catch(_){ return delta; } }); }catch(_){} } }catch(_){}

                        // prevent image drag/drop and paste at capture phase (like other Quill instances)
                        try {
                            var editorContainer = document.querySelector('#inline_feedback_editor');
                            if (editorContainer) {
                                editorContainer.addEventListener('dragover', function(e){ try{ e.preventDefault(); }catch(_){} }, true);
                                editorContainer.addEventListener('drop', function(e){
                                    try {
                                        if (!e.dataTransfer) return;
                                        var hasFiles = e.dataTransfer.files && e.dataTransfer.files.length > 0;
                                        var html = '';
                                        try { html = e.dataTransfer.getData && e.dataTransfer.getData('text/html') || ''; } catch(_) { html = ''; }
                                        if (hasFiles || /<img\s*/i.test(html)) {
                                            e.preventDefault();
                                            e.stopImmediatePropagation();
                                            return;
                                        }
                                    } catch(_){}
                                }, true);

                                editorContainer.addEventListener('paste', function(e){
                                    try {
                                        var clipboard = (e.clipboardData || window.clipboardData);
                                        if (!clipboard) return;
                                        var items = clipboard.items || [];
                                        for (var i = 0; i < items.length; i++) {
                                            var t = items[i].type || '';
                                            if (t.indexOf && t.indexOf('image') === 0) {
                                                e.preventDefault();
                                                e.stopImmediatePropagation();
                                                return;
                                            }
                                        }
                                        var html = '';
                                        try { html = clipboard.getData && clipboard.getData('text/html') || ''; } catch(_) { html = ''; }
                                        if (/<img\s*/i.test(html)) {
                                            e.preventDefault();
                                            e.stopImmediatePropagation();
                                            return;
                                        }
                                    } catch(_){}
                                }, true);
                            }
                        } catch(_){}

                        // rely on Quill's built-in placeholder option

                        window.__quillProjectFeedbackInline = q;
                        return q;
                    } catch (e) { return null; }
                }

                var inlineQ = initInlineFeedback();

                // Photo/file button handlers
                try {
                    var photoBtn = document.getElementById('inlineFeedbackPhotoBtn');
                    var fileBtn = document.getElementById('inlineFeedbackFileBtn');
                    var photoInput = document.getElementById('inline_feedback_image_input');
                    var filesInput = document.getElementById('inline_feedback_files_input');

                    // maintain an array of selected files for inline preview & upload
                    window.inlineFeedbackSelectedFiles = window.inlineFeedbackSelectedFiles || [];

                    if (photoBtn && photoInput) photoBtn.addEventListener('click', function(){ photoInput.click(); });
                    if (fileBtn && filesInput) fileBtn.addEventListener('click', function(){ filesInput.click(); });
                    // handle file (non-image) attachments preview
                    if (filesInput) {
                        filesInput.addEventListener('change', function(ev){
                            try {
                                var files = Array.from(this.files || []);
                                if (!files.length) return;
                                // append to selected array
                                window.inlineFeedbackSelectedFiles = (window.inlineFeedbackSelectedFiles || []).concat(files);
                                renderInlineFilesPreview();
                                // clear native input so user can reselect same file later if needed
                                try { this.value = ''; } catch(_){}
                            } catch(_){}
                        });
                    }

                    // show small image preview next to attach file icon when a photo is selected
                    if (photoInput) {
                        photoInput.addEventListener('change', function(ev){
                            try {
                                var f = (this.files && this.files[0]) || null;
                                if (!f) return;
                                if (!f.type || f.type.indexOf('image/') !== 0) return;

                                var reader = new FileReader();
                                reader.onload = function(e){
                                    try {
                                        showInlineImagePreviewSmall(f, e.target.result);
                                    } catch(_){ }
                                };
                                reader.readAsDataURL(f);
                            } catch(_){ }
                        });
                    }

                    // render inline files preview container (insert before editor)
                    function renderInlineFilesPreview() {
                        try {
                            var editorEl = document.getElementById('inline_feedback_editor');
                            if (!editorEl) return;
                            var parent = editorEl.parentNode;
                            if (!parent) return;
                            var previewId = 'inline_feedback_files_preview';
                            var preview = document.getElementById(previewId);
                            var sel = (window.inlineFeedbackSelectedFiles || []);

                            // if no files selected, remove preview container if exists
                            if (!sel.length) {
                                try { if (preview && preview.parentNode) preview.parentNode.removeChild(preview); } catch(_){}
                                return;
                            }

                            if (!preview) {
                                preview = document.createElement('div');
                                preview.id = previewId;
                                preview.className = 'mt-2';
                                parent.insertBefore(preview, editorEl);
                            }
                            // build list
                            preview.innerHTML = '';
                            var listWrap = document.createElement('div');
                            listWrap.className = 'selected-files-list mt-2';
                            sel.forEach(function(f, idx){
                                try {
                                    var item = document.createElement('div');
                                    item.className = 'd-flex align-items-center gap-2 p-2 rounded bg-light selected-task mb-2';
                                    var iconWrap = document.createElement('div');
                                    // small file icon placeholder
                                    iconWrap.innerHTML = '<span class="material-symbols-outlined">description</span>';
                                    iconWrap.style.minWidth = '28px';
                                    iconWrap.style.textAlign = 'center';

                                    var name = document.createElement('span');
                                    name.className = 'flex-grow-1';
                                    var sizeMb = (f.size || 0) / 1024 / 1024;
                                    name.textContent = (f.name || '') + (isFinite(sizeMb) ? ' (' + sizeMb.toFixed(2) + ' MB)' : '');

                                    var rm = document.createElement('button');
                                    rm.type = 'button';
                                    rm.className = 'btn btn-sm btn-remove-task remove-task';
                                    rm.style.lineHeight = '1';
                                    rm.innerHTML = '<span class="material-symbols-outlined">close</span>';
                                    rm.addEventListener('click', function(){
                                        try {
                                            window.inlineFeedbackSelectedFiles.splice(idx, 1);
                                            renderInlineFilesPreview();
                                        } catch(_){}
                                    });

                                    item.appendChild(iconWrap);
                                    item.appendChild(name);
                                    item.appendChild(rm);
                                    listWrap.appendChild(item);
                                } catch(_){}
                            });
                            preview.appendChild(listWrap);
                        } catch(e){ }
                    }
                } catch(_){}

                // Send button: collect quill content + files and POST to /project-feedbacks
                try {
                    var sendBtn = document.getElementById('inlineFeedbackSendBtn');
                    if (sendBtn) {
                        sendBtn.addEventListener('click', function(){
                            try {
                                var q = window.__quillProjectFeedbackInline;
                                // prefer Quill content, fallback to hidden textarea
                                var html = '';
                                try {
                                    if (q && q.root) html = q.root.innerHTML || '';
                                } catch(_) { html = ''; }
                                try {
                                    if ((!html || String(html).replace(/<[^>]+>/g,'').trim() === '') && document.getElementById('inline_feedback_comment')) {
                                        var ta = document.getElementById('inline_feedback_comment'); if (ta) html = ta.value || html;
                                    }
                                } catch(_) {}

                                // allow empty comment only if at least one file is attached (image or reference)
                                var hasImage = false, hasRefFiles = false;
                                try { 
                                    if (window.__inlineFeedbackImageFile) {
                                        hasImage = true;
                                    } else {
                                        var pi = document.getElementById('inline_feedback_image_input'); 
                                        if (pi && pi.files && pi.files.length) hasImage = true; 
                                    }
                                } catch(_){}
                                try { if (window.inlineFeedbackSelectedFiles && window.inlineFeedbackSelectedFiles.length) hasRefFiles = true; else { var fi = document.getElementById('inline_feedback_files_input'); if (fi && fi.files && fi.files.length) hasRefFiles = true; } } catch(_){}
                                var plainText = String(html || '').replace(/<[^>]+>/g,'').trim();
                                if (!plainText && !hasImage && !hasRefFiles) { window.showFloatingAlert && window.showFloatingAlert('Please write feedback or attach a file','warning'); return; }

                                var fd = new FormData();
                                fd.append('feedback_comment', html);
                                fd.append('project_id', getMeta('project-id') || '');
                                fd.append('employee_id', document.getElementById('projectFeedbackModal')?.getAttribute('data-employee-id') || '');

                                // attach image from preview (if available) or file input
                                try { 
                                    if (window.__inlineFeedbackImageFile) {
                                        fd.append('feedback_image', window.__inlineFeedbackImageFile);
                                    } else {
                                        var pi = document.getElementById('inline_feedback_image_input'); 
                                        if (pi && pi.files && pi.files.length) fd.append('feedback_image', pi.files[0]); 
                                    }
                                }catch(_){ }
                                try {
                                    // prefer selected files tracked in inlineFeedbackSelectedFiles
                                    if (window.inlineFeedbackSelectedFiles && window.inlineFeedbackSelectedFiles.length) {
                                        window.inlineFeedbackSelectedFiles.forEach(function(f){ fd.append('reference_files[]', f); });
                                    } else {
                                        var fi = document.getElementById('inline_feedback_files_input'); if (fi && fi.files && fi.files.length) { Array.from(fi.files).forEach(function(f){ fd.append('reference_files[]', f); }); }
                                    }
                                } catch(_){ }

                                // basic UI feedback
                                var original = sendBtn.innerHTML;
                                sendBtn.disabled = true;
                                sendBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Sending...';

                                // Optimistic UI: hide preview immediately, but keep a backup to restore on failure
                                var _backupSelectedFiles = (window.inlineFeedbackSelectedFiles || []).slice();
                                try { window.inlineFeedbackSelectedFiles = []; renderInlineFilesPreview && renderInlineFilesPreview(); } catch(_) {}

                                fetch(getMeta('app-url').replace(/\/$/, '') + '/project-feedbacks', {
                                    method: 'POST',
                                    headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content') },
                                    body: fd
                                }).then(function(res){
                                    if (!res.ok) return res.json().then(function(j){ return Promise.reject(j); });
                                    return res.json();
                                }).then(function(data){
                                    window.showFloatingAlert && window.showFloatingAlert('Feedback submitted','success',2000);
                                    // reload feedback list
                                    try { loadFeedbackData(getMeta('project-id')); } catch(_){}
                                    // clear editor and inputs
                                    try { 
                                        // clear image input and preview
                                        if (document.getElementById('inline_feedback_image_input')) document.getElementById('inline_feedback_image_input').value = '';
                                        window.__inlineFeedbackImageFile = null;
                                        var previewContainer = document.getElementById('inline_feedback_image_preview');
                                        if (previewContainer && previewContainer.parentNode) {
                                            previewContainer.parentNode.removeChild(previewContainer);
                                        }
                                    }catch(_){ }
                                    try { 
                                        if (document.getElementById('inline_feedback_files_input')) document.getElementById('inline_feedback_files_input').value = ''; 
                                    }catch(_){ }
                                    try { 
                                        // clear selected files and preview
                                        window.inlineFeedbackSelectedFiles = []; renderInlineFilesPreview && renderInlineFilesPreview(); 
                                    }catch(_){ }
                                    try {
                                        // fully reset Quill editor instance: dispose and re-initialize
                                        if (window.__quillProjectFeedbackInline && typeof window.__quillProjectFeedbackInline === 'object') {
                                            try { window.__quillProjectFeedbackInline = null; } catch(_){}
                                        }
                                    } catch(_){} 
                                    try { initInlineFeedback && initInlineFeedback(); } catch(_){}
                                }).catch(function(err){
                                    // restore preview from backup
                                    try { window.inlineFeedbackSelectedFiles = _backupSelectedFiles || []; renderInlineFilesPreview && renderInlineFilesPreview(); } catch(_) {}
                                    var msg = 'Failed to submit feedback';
                                    try { if (err && err.errors) msg = Object.values(err.errors).join('\n'); else if (err && err.message) msg = err.message; } catch(_){ }
                                    window.showFloatingAlert && window.showFloatingAlert(msg,'warning',4000);
                                }).finally(function(){ sendBtn.disabled = false; sendBtn.innerHTML = original; });
                            } catch (e) { try { window.showFloatingAlert && window.showFloatingAlert('Failed to submit feedback','warning'); } catch(_){} }
                        });
                    }
                } catch(_){}
            } catch(_){ }

            // show small inline image preview next to attach file icon
            function showInlineImagePreviewSmall(fileObj, dataUrl) {
                try {
                    // Create or get the preview container
                    var previewContainer = document.getElementById('inline_feedback_image_preview');
                    if (!previewContainer) {
                        previewContainer = document.createElement('div');
                        previewContainer.id = 'inline_feedback_image_preview';
                        // ensure container and its children are fully opaque and do not inherit any translucent styles
                        previewContainer.style.cssText = 'display: inline-flex; align-items: center; margin-left: 8px; opacity: 1; background: transparent;';
                        
                        // Insert after the file button
                        var fileBtn = document.getElementById('inlineFeedbackFileBtn');
                        if (fileBtn && fileBtn.parentNode) {
                            fileBtn.parentNode.insertBefore(previewContainer, fileBtn.nextSibling);
                        }
                    }

                    // Create the image preview similar to modal add project style
                    previewContainer.innerHTML = '';
                    
                    var imageLabel = document.createElement('div');
                    imageLabel.className = 'custom-image-upload position-relative';
                    // apply explicit opaque styles so the preview doesn't look translucent
                    imageLabel.style.cssText = '' +
                        'width: 32px; ' +
                        'height: 32px; ' +
                        "background-image: url('" + dataUrl + "'); " +
                        'background-size: cover; ' +
                        'background-position: center center; ' +
                        'background-repeat: no-repeat; ' +
                        'border-radius: 6px; ' +
                        'cursor: pointer; ' +
                        'border: 1px solid #ddd; ' +
                        'margin-right: 4px; ' +
                        'opacity: 1; ' +
                        'background-color: #ffffff; ' +
                        'box-shadow: 0 1px 3px rgba(0,0,0,0.12); ' +
                        'overflow: visible; ';
                    
                    var clearBtn = document.createElement('span');
                    clearBtn.className = 'image-clear-btn';
                    clearBtn.innerHTML = '&times;';
                    clearBtn.title = 'Remove image';
                    // make the clear button visually prominent and above other elements
                    clearBtn.style.cssText = '' +
                        'position: absolute; ' +
                        'top: -6px; ' +
                        'right: -6px; ' +
                        'background: #ff4444; ' +
                        'color: #ffffff; ' +
                        'border-radius: 50%; ' +
                        'width: 16px; ' +
                        'height: 16px; ' +
                        'font-size: 12px; ' +
                        'line-height: 16px; ' +
                        'text-align: center; ' +
                        'cursor: pointer; ' +
                        'font-weight: 700; ' +
                        'border: none; ' +
                        'box-shadow: 0 2px 6px rgba(0,0,0,0.25); ' +
                        'z-index: 30; ' +
                        'opacity: 1; ';
                    
                    // Store the file object for later use
                    window.__inlineFeedbackImageFile = fileObj;
                    
                    clearBtn.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        try {
                            // Clear the file input
                            var inp = document.getElementById('inline_feedback_image_input'); 
                            if (inp) inp.value = '';
                            // Clear the stored file
                            window.__inlineFeedbackImageFile = null;
                            // Remove the preview container
                            if (previewContainer && previewContainer.parentNode) {
                                previewContainer.parentNode.removeChild(previewContainer);
                            }
                        } catch(_){}
                    });
                    
                    // Add click to preview (optional - could open larger view)
                    imageLabel.addEventListener('click', function(e) {
                        e.preventDefault();
                        // Optional: show larger preview or do nothing
                        try {
                            showInlineImagePreview(fileObj, dataUrl);
                        } catch(_) {}
                    });
                    
                    imageLabel.appendChild(clearBtn);
                    previewContainer.appendChild(imageLabel);
                    
                } catch(e) {
                    console.warn('Failed to show image preview:', e);
                }
            }

            // show inline image preview overlay (WhatsApp-like)
            function showInlineImagePreview(fileObj, dataUrl) {
                try {
                    // avoid duplicate overlays
                    if (document.getElementById('inlineImagePreviewOverlay')) return;

                    var overlay = document.createElement('div');
                    overlay.id = 'inlineImagePreviewOverlay';
                    overlay.style.position = 'fixed';
                    overlay.style.inset = '0';
                    overlay.style.zIndex = '9999';
                    overlay.style.background = 'rgba(0,0,0,0.6)';
                    overlay.style.display = 'flex';
                    overlay.style.alignItems = 'center';
                    overlay.style.justifyContent = 'center';

                    var box = document.createElement('div');
                    box.style.background = '#fff';
                    box.style.padding = '12px';
                    box.style.borderRadius = '8px';
                    box.style.maxWidth = '720px';
                    box.style.width = '90%';
                    box.style.maxHeight = '90%';
                    box.style.overflow = 'auto';
                    box.style.boxShadow = '0 8px 30px rgba(0,0,0,0.4)';

                    // image
                    var imgWrap = document.createElement('div');
                    imgWrap.style.textAlign = 'center';
                    imgWrap.style.marginBottom = '8px';
                    var img = document.createElement('img');
                    img.src = dataUrl;
                    img.style.maxWidth = '100%';
                    img.style.maxHeight = '60vh';
                    img.style.borderRadius = '6px';
                    imgWrap.appendChild(img);

                    // caption input (single-line-ish)
                    var caption = document.createElement('textarea');
                    caption.placeholder = 'Add a caption...';
                    caption.style.width = '100%';
                    caption.style.minHeight = '56px';
                    caption.style.resize = 'vertical';
                    caption.style.marginTop = '8px';
                    caption.style.padding = '8px';
                    caption.style.border = '1px solid #ddd';
                    caption.style.borderRadius = '6px';

                    // buttons wrapper
                    var actions = document.createElement('div');
                    actions.style.display = 'flex';
                    actions.style.justifyContent = 'flex-end';
                    actions.style.gap = '8px';
                    actions.style.marginTop = '10px';

                    var cancelBtn = document.createElement('button');
                    cancelBtn.type = 'button';
                    // use existing project Cancel style
                    cancelBtn.className = 'btn btn-custom-close';
                    cancelBtn.textContent = 'Cancel';
                    // match modal footer .btn-custom-close appearance (inline because overlay isn't inside modal footer)
                    cancelBtn.style.backgroundColor = '#e3e4ee';
                    cancelBtn.style.color = '#444444';
                    cancelBtn.style.fontSize = '12px';
                    cancelBtn.style.padding = '10px';
                    cancelBtn.style.height = '45px';
                    cancelBtn.style.border = 'none';
                    cancelBtn.style.borderRadius = '10px';
                    cancelBtn.style.minWidth = '120px';

                    var sendBtn = document.createElement('button');
                    sendBtn.type = 'button';
                    // use existing project Send style (black submit button)
                    sendBtn.className = 'btn btn-submit-black';
                    // use material icon as requested
                    sendBtn.innerHTML = '<span class="material-symbols-outlined">send</span>';
                    sendBtn.setAttribute('aria-label','Send');
                    sendBtn.style.padding = '6px 12px';
                    sendBtn.style.fontSize = '13px';

                    actions.appendChild(cancelBtn);
                    actions.appendChild(sendBtn);

                    box.appendChild(imgWrap);
                    box.appendChild(caption);
                    box.appendChild(actions);
                    overlay.appendChild(box);
                    document.body.appendChild(overlay);

                    // focus caption
                    try { caption.focus(); } catch(_){}

                    function cleanup() {
                        try { var inp = document.getElementById('inline_feedback_image_input'); if (inp) inp.value = ''; } catch(_){ }
                        try { if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay); } catch(_){}
                    }

                    cancelBtn.addEventListener('click', function(){ try{ cleanup(); }catch(_){}});

                    sendBtn.addEventListener('click', function(){
                        try {
                            var cap = (caption.value || '').trim();
                            var fd = new FormData();
                            fd.append('feedback_comment', cap || '');
                            fd.append('project_id', getMeta('project-id') || '');
                            fd.append('employee_id', document.getElementById('projectFeedbackModal')?.getAttribute('data-employee-id') || '');
                            
                            // Use the file from small preview if available, otherwise use the provided fileObj
                            var imageFileToUse = window.__inlineFeedbackImageFile || fileObj;
                            if (imageFileToUse) fd.append('feedback_image', imageFileToUse);

                            // UI feedback
                            var origText = sendBtn.innerHTML;
                            sendBtn.disabled = true;
                            sendBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Sending...';

                            fetch(getMeta('app-url').replace(/\/$/, '') + '/project-feedbacks', {
                                method: 'POST',
                                headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content') },
                                body: fd
                            }).then(function(res){
                                if (!res.ok) return res.json().then(function(j){ return Promise.reject(j); });
                                return res.json();
                            }).then(function(data){
                                window.showFloatingAlert && window.showFloatingAlert('Feedback submitted','success',2000);
                                try { loadFeedbackData(getMeta('project-id')); } catch(_){ }
                                cleanup();
                                try { if (window.__quillProjectFeedbackInline) window.__quillProjectFeedbackInline.root.innerHTML = ''; }catch(_){ }
                                // Clear small image preview
                                try {
                                    window.__inlineFeedbackImageFile = null;
                                    var previewContainer = document.getElementById('inline_feedback_image_preview');
                                    if (previewContainer && previewContainer.parentNode) {
                                        previewContainer.parentNode.removeChild(previewContainer);
                                    }
                                } catch(_){};
                            }).catch(function(err){
                                var msg = 'Failed to submit feedback';
                                try { if (err && err.errors) msg = Object.values(err.errors).join('\n'); else if (err && err.message) msg = err.message; } catch(_){ }
                                window.showFloatingAlert && window.showFloatingAlert(msg,'warning',4000);
                            }).finally(function(){ sendBtn.disabled = false; sendBtn.innerHTML = origText; });
                        } catch(_){}
                    });
                } catch(_){}
            }

            // function showAddFeedbackForm(projectId) {
            //     modalTitle.textContent = "Add Feedback";
            //     modalBody.innerHTML = "";
            //     var tpl = document.getElementById("template-add-feedback");
            //     if (tpl) {
            //         var node =
            //             tpl.tagName && tpl.tagName.toLowerCase() === "template"
            //                 ? tpl.content.cloneNode(true)
            //                 : tpl.cloneNode(true);
            //         modalBody.appendChild(node);
            //         // set hidden values inserted by template
            //         try {
            //             var inProject = modalBody.querySelector(
            //                 'input[name="project_id"]'
            //             );
            //             if (inProject) inProject.value = projectId;
            //         } catch (_) {}
            //         try {
            //             var inEmployee = modalBody.querySelector(
            //                 'input[name="employee_id"]'
            //             );
            //             if (inEmployee)
            //                 inEmployee.value =
            //                     projectFeedbackModalEl.getAttribute(
            //                         "data-employee-id"
            //                     ) || "";
            //         } catch (_) {}
            //         try {
            //             var inParent = modalBody.querySelector(
            //                 'input[name="parent_id"]'
            //             );
            //             if (inParent) inParent.value = "";
            //         } catch (_) {}
            //     } else {
            //         var existingForm =
            //             modalBody.querySelector("#addFeedbackForm");
            //         if (existingForm) {
            //             try {
            //                 var p = existingForm.querySelector(
            //                     'input[name="project_id"]'
            //                 );
            //                 if (p) p.value = projectId;
            //             } catch (_) {}
            //             try {
            //                 var e = existingForm.querySelector(
            //                     'input[name="employee_id"]'
            //                 );
            //                 if (e)
            //                     e.value =
            //                         projectFeedbackModalEl.getAttribute(
            //                             "data-employee-id"
            //                         ) || "";
            //             } catch (_) {}
            //             try {
            //                 var pa = existingForm.querySelector(
            //                     'input[name="parent_id"]'
            //                 );
            //                 if (pa) pa.value = "";
            //             } catch (_) {}
            //         } else {
            //             console.error(
            //                 "Add Feedback template/form not found. Provide #template-add-feedback or an element #addFeedbackForm in the Blade view."
            //             );
            //             return;
            //         }
            //     }

            //     // image preview
            //     try {
            //         var imageInput = modalBody.querySelector("#feedback_image");
            //         var imageLabel = modalBody.querySelector(
            //             "#feedbackImageLabel"
            //         );
            //         var imageClearBtn = modalBody.querySelector(
            //             "#feedbackImageClearBtn"
            //         );
            //         if (imageInput && imageLabel && imageClearBtn) {
            //             imgInput.addEventListener("change", function () {
            //                 if (this.files && this.files[0]) {
            //                     var reader = new FileReader();
            //                     reader.onload = function (e) {
            //                         imageLabel.style.backgroundImage =
            //                             "url('" + e.target.result + "')";
            //                         imageLabel.classList.add("has-image");
            //                         imageLabel.style.backgroundSize = "cover";
            //                         imageLabel.style.opacity = "1";
            //                         imgClearBtn.classList.remove("d-none");
            //                         // reset remove flag when user selects a new file
            //                         try {
            //                             var editRemove =
            //                                 modalBody.querySelector(
            //                                     "#edit_remove_image"
            //                                 );
            //                             if (editRemove) editRemove.value = "0";
            //                         } catch (_) {}
            //                     };
            //                     reader.readAsDataURL(this.files[0]);
            //                 }
            //             });
            //             imageClearBtn.addEventListener("click", function (e) {
            //                 e.preventDefault();
            //                 imageInput.value = "";
            //                 imageLabel.style.backgroundImage =
            //                     "url('" +
            //                     getMeta("app-url").replace(/\/$/, "") +
            //                     "/asset/img/background/add-image.png')";
            //                 imageLabel.style.backgroundPosition =
            //                     "center center";
            //                 imageLabel.style.backgroundRepeat = "no-repeat";
            //                 imageLabel.style.backgroundSize = "cover";
            //                 imageLabel.classList.remove("has-image");
            //                 imageLabel.style.opacity = "0.5";
            //                 imageClearBtn.classList.add("d-none");

            //                 // tambahan penting
            //                 var hidden =
            //                     modalBody.querySelector("#edit_remove_image");
            //                 if (hidden) hidden.value = "1";
            //             });
            //         }
            //     } catch (_) {}

            //     // file preview list for add form
            //     (function () {
            //         try {
            //             window.addFeedbackSelectedFiles = [];
            //             var input = modalBody.querySelector(
            //                 "#feedback_reference_files"
            //             );
            //             var preview = modalBody.querySelector(
            //                 "#feedback_reference_files_preview"
            //             );
            //             if (!input || !preview) return;
            //             function render() {
            //                 preview.innerHTML = "";
            //                 if (!window.addFeedbackSelectedFiles.length) return;
            //                 var list = document.createElement("div");
            //                 list.className = "selected-files-list mt-2";
            //                 window.addFeedbackSelectedFiles.forEach(function (
            //                     file,
            //                     idx
            //                 ) {
            //                     var item = document.createElement("div");
            //                     item.className =
            //                         "selected-file-item d-flex align-items-center justify-content-between mb-2 p-2 bg-light border rounded";
            //                     var info = document.createElement("div");
            //                     info.className =
            //                         "d-flex align-items-center flex-grow-1";
            //                     var icon = document.createElement("span");
            //                     icon.className =
            //                         "material-symbols-outlined me-2";
            //                     icon.textContent = "description";
            //                     var name = document.createElement("span");
            //                     name.textContent = file.name;
            //                     name.className = "file-name";
            //                     var size = document.createElement("small");
            //                     size.className = "text-muted ms-1";
            //                     size.textContent =
            //                         " (" +
            //                         (file.size / 1024 / 1024).toFixed(2) +
            //                         " MB)";
            //                     var rm = document.createElement("button");
            //                     rm.type = "button";
            //                     rm.className = "btn btn-sm btn-outline-danger";
            //                     rm.innerHTML = "&times;";
            //                     rm.onclick = function () {
            //                         window.addFeedbackSelectedFiles.splice(
            //                             idx,
            //                             1
            //                         );
            //                         render();
            //                     };
            //                     info.appendChild(icon);
            //                     info.appendChild(name);
            //                     info.appendChild(size);
            //                     item.appendChild(info);
            //                     item.appendChild(rm);
            //                     list.appendChild(item);
            //                 });
            //                 preview.appendChild(list);
            //             }
            //             input.addEventListener("change", function () {
            //                 var files = Array.from(this.files || []);
            //                 window.addFeedbackSelectedFiles =
            //                     window.addFeedbackSelectedFiles.concat(files);
            //                 render();
            //                 this.value = "";
            //             });
            //         } catch (_) {}
            //     })();

            //     // change footer button text to Submit
            //     try {
            //         var addFeedbackButton =
            //             document.getElementById("addFeedbackButton");
            //         if (addFeedbackButton)
            //             addFeedbackButton.textContent = "Submit";
            //         var newButton = addFeedbackButton.cloneNode(true);
            //         addFeedbackButton.parentNode.replaceChild(
            //             newButton,
            //             addFeedbackButton
            //         );
            //         newButton.addEventListener("click", function (e) {
            //             e.preventDefault();
            //             var form = document.getElementById("addFeedbackForm");
            //             if (form) submitFeedbackForm(form, projectId);
            //         });
            //     } catch (_) {}
            //     // arrange close/submit layout
            //     (function () {
            //         try {
            //             var footer = getProjectFeedbackFooter();
            //             if (!footer) return;
            //             var submitBtnRef =
            //                 document.getElementById("addFeedbackButton");
            //             if (!submitBtnRef) return;
            //             submitBtnRef.classList.remove("w-100");
            //             submitBtnRef.classList.add("flex-grow-1");
            //             var oldWrapper = footer.querySelector(
            //                 "#feedbackFormButtonsWrapper"
            //             );
            //             if (oldWrapper) oldWrapper.remove();
            //             var wrap = document.createElement("div");
            //             wrap.id = "feedbackFormButtonsWrapper";
            //             wrap.className = "d-flex gap-2 w-100";
            //             var closeBtn = document.createElement("button");
            //             closeBtn.id = "replyCloseButton";
            //             closeBtn.type = "button";
            //             closeBtn.className = "btn btn-close-reply flex-grow-1";
            //             closeBtn.textContent = "Close";
            //             closeBtn.addEventListener("click", function () {
            //                 try {
            //                     footer.innerHTML = "";
            //                     var restore = document.createElement("button");
            //                     restore.type = "button";
            //                     restore.className =
            //                         "btn btn-submit-black w-100";
            //                     restore.id = "addFeedbackButton";
            //                     restore.textContent = "Add Feedback";
            //                     restore.addEventListener("click", function () {
            //                         showAddFeedbackForm(projectId);
            //                     });
            //                     footer.appendChild(restore);
            //                 } catch (_) {}
            //                 loadFeedbackData(projectId);
            //             });
            //             wrap.appendChild(closeBtn);
            //             wrap.appendChild(submitBtnRef);
            //             footer.innerHTML = "";
            //             footer.appendChild(wrap);
            //         } catch (_) {}
            //     })();
            // }

            // function submitFeedbackForm(form, projectId) {
            //     var submitBtn = document.getElementById("addFeedbackButton");
            //     var originalBtnText = submitBtn ? submitBtn.innerHTML : "";
            //     if (submitBtn) {
            //         submitBtn.innerHTML =
            //             '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Submitting...';
            //         submitBtn.disabled = true;
            //     }
            //     var formData = new FormData(form);
            //     try {
            //         var urlInputs = form.querySelectorAll(
            //             'input[name="reference_urls[]"]'
            //         );
            //         var urls = Array.from(urlInputs)
            //             .map(function (i) {
            //                 return (i.value || "").trim();
            //             })
            //             .filter(Boolean);
            //         if (urls.length) formData.set("reference_url", urls[0]);
            //     } catch (_) {}
            //     try {
            //         if (
            //             window.addFeedbackSelectedFiles &&
            //             window.addFeedbackSelectedFiles.length
            //         ) {
            //             window.addFeedbackSelectedFiles.forEach(function (f) {
            //                 formData.append("reference_files[]", f);
            //             });
            //         } else {
            //             var rfInput = form.querySelector(
            //                 "#feedback_reference_files"
            //             );
            //             if (rfInput && rfInput.files && rfInput.files.length)
            //                 Array.from(rfInput.files).forEach(function (f) {
            //                     formData.append("reference_files[]", f);
            //                 });
            //         }
            //     } catch (_) {}

            //     fetch(
            //         getMeta("app-url").replace(/\/$/, "") +
            //             "/project-feedbacks",
            //         {
            //             method: "POST",
            //             headers: {
            //                 "X-CSRF-TOKEN": document
            //                     .querySelector('meta[name="csrf-token"]')
            //                     .getAttribute("content"),
            //             },
            //             body: formData,
            //         }
            //     )
            //         .then(function (response) {
            //             if (!response.ok)
            //                 return response.json().then(Promise.reject);
            //             return response.json();
            //         })
            //         .then(function (data) {
            //             var card = document.querySelector(
            //                 '[data-project-id="' + projectId + '"]'
            //             );
            //             if (card) {
            //                 var fbBadge = card.querySelector(
            //                     ".project-feedback-count"
            //                 );
            //                 if (fbBadge) {
            //                     var current =
            //                         parseInt(fbBadge.textContent) || 0;
            //                     fbBadge.textContent = current + 1;
            //                 }
            //             }
            //             setTimeout(function () {
            //                 loadFeedbackData(projectId);
            //                 form.reset();
            //                 var imageLabel = form.querySelector(
            //                     "#feedbackImageLabel"
            //                 );
            //                 var imageClearBtn = form.querySelector(
            //                     "#feedbackImageClearBtn"
            //                 );
            //                 if (imageLabel) {
            //                     imageLabel.style.backgroundImage =
            //                         "url('" +
            //                         getMeta("app-url").replace(/\/$/, "") +
            //                         "/asset/img/background/add-image.png')";
            //                     imageLabel.style.backgroundSize = "50%";
            //                     imageLabel.classList.remove("has-image");
            //                     imageLabel.style.opacity = "0.5";
            //                 }
            //                 if (imageClearBtn)
            //                     imageClearBtn.classList.add("d-none");
            //             }, 1000);
            //         })
            //         .catch(function (error) {
            //             var errMsg =
            //                 "Failed to submit feedback. Please try again.";
            //             if (error && error.errors)
            //                 errMsg = Object.values(error.errors).join("<br>");
            //             else if (error && error.message) errMsg = error.message;
            //             window.showFloatingAlert(errMsg, "warning", 4000);
            //         })
            //         .finally(function () {
            //             if (submitBtn) {
            //                 submitBtn.innerHTML = originalBtnText;
            //                 submitBtn.disabled = false;
            //             }
            //         });
            // }

            // function showReplyFeedbackForm(projectId, parentId) {
            //     // Reply form should be provided by blade as #template-reply-feedback
            //     modalTitle.textContent = "Reply Feedback";
            //     modalBody.innerHTML = "";
            //     var tplReply = document.getElementById(
            //         "template-reply-feedback"
            //     );
            //     if (tplReply) {
            //         var nodeR =
            //             tplReply.tagName &&
            //             tplReply.tagName.toLowerCase() === "template"
            //                 ? tplReply.content.cloneNode(true)
            //                 : tplReply.cloneNode(true);
            //         modalBody.appendChild(nodeR);
            //         try {
            //             var inProjectR = modalBody.querySelector(
            //                 'input[name="project_id"]'
            //             );
            //             if (inProjectR) inProjectR.value = projectId;
            //         } catch (_) {}
            //         try {
            //             var inParentR = modalBody.querySelector(
            //                 'input[name="parent_id"]'
            //             );
            //             if (inParentR) inParentR.value = parentId;
            //         } catch (_) {}
            //         try {
            //             var inEmployeeR = modalBody.querySelector(
            //                 'input[name="employee_id"]'
            //             );
            //             if (inEmployeeR)
            //                 inEmployeeR.value =
            //                     projectFeedbackModalEl.getAttribute(
            //                         "data-employee-id"
            //                     ) || "";
            //         } catch (_) {}
            //     } else {
            //         var existingReplyForm =
            //             modalBody.querySelector("#replyFeedbackForm");
            //         if (existingReplyForm) {
            //             try {
            //                 var p = existingReplyForm.querySelector(
            //                     'input[name="project_id"]'
            //                 );
            //                 if (p) p.value = projectId;
            //             } catch (_) {}
            //             try {
            //                 var pr = existingReplyForm.querySelector(
            //                     'input[name="parent_id"]'
            //                 );
            //                 if (pr) pr.value = parentId;
            //             } catch (_) {}
            //             try {
            //                 var e = existingReplyForm.querySelector(
            //                     'input[name="employee_id"]'
            //                 );
            //                 if (e)
            //                     e.value =
            //                         projectFeedbackModalEl.getAttribute(
            //                             "data-employee-id"
            //                         ) || "";
            //             } catch (_) {}
            //         } else {
            //             console.error(
            //                 "Reply Feedback template/form not found. Provide #template-reply-feedback or an element #replyFeedbackForm in the Blade view."
            //             );
            //             return;
            //         }
            //     }

            //     // image + file preview + submit handler
            //     (function () {
            //         try {
            //             window.replyFeedbackSelectedFiles = [];
            //             var input = modalBody.querySelector(
            //                 "#reply_reference_files"
            //             );
            //             var preview = modalBody.querySelector(
            //                 "#reply_reference_files_preview"
            //             );
            //             if (input && preview) {
            //                 function render() {
            //                     preview.innerHTML = "";
            //                     if (!window.replyFeedbackSelectedFiles.length)
            //                         return;
            //                     var list = document.createElement("div");
            //                     list.className = "selected-files-list mt-2";
            //                     window.replyFeedbackSelectedFiles.forEach(
            //                         function (file, idx) {
            //                             var item =
            //                                 document.createElement("div");
            //                             item.className =
            //                                 "selected-file-item d-flex align-items-center justify-content-between mb-2 p-2 bg-light border rounded";
            //                             var info =
            //                                 document.createElement("div");
            //                             info.className =
            //                                 "d-flex align-items-center flex-grow-1";
            //                             var icon =
            //                                 document.createElement("span");
            //                             icon.className =
            //                                 "material-symbols-outlined me-2";
            //                             icon.textContent = "description";
            //                             var name =
            //                                 document.createElement("span");
            //                             name.className = "file-name";
            //                             name.textContent = file.name;
            //                             var size =
            //                                 document.createElement("small");
            //                             size.className = "text-muted ms-1";
            //                             size.textContent =
            //                                 " (" +
            //                                 (file.size / 1024 / 1024).toFixed(
            //                                     2
            //                                 ) +
            //                                 " MB)";
            //                             var rm =
            //                                 document.createElement("button");
            //                             rm.type = "button";
            //                             rm.className =
            //                                 "btn btn-sm btn-outline-danger";
            //                             rm.innerHTML = "&times;";
            //                             rm.onclick = function () {
            //                                 window.replyFeedbackSelectedFiles.splice(
            //                                     idx,
            //                                     1
            //                                 );
            //                                 render();
            //                             };
            //                             info.appendChild(icon);
            //                             info.appendChild(name);
            //                             info.appendChild(size);
            //                             item.appendChild(info);
            //                             item.appendChild(rm);
            //                             list.appendChild(item);
            //                         }
            //                     );
            //                     preview.appendChild(list);
            //                 }
            //                 input.addEventListener("change", function () {
            //                     var files = Array.from(this.files || []);
            //                     window.replyFeedbackSelectedFiles =
            //                         window.replyFeedbackSelectedFiles.concat(
            //                             files
            //                         );
            //                     render();
            //                     this.value = "";
            //                 });
            //             }
            //         } catch (_) {}
            //     })();

            //     try {
            //         var imageInput = modalBody.querySelector("#feedback_image");
            //         var imageLabel = modalBody.querySelector(
            //             "#feedbackImageLabel"
            //         );
            //         var imageClearBtn = modalBody.querySelector(
            //             "#feedbackImageClearBtn"
            //         );
            //         if (imageInput && imageLabel && imageClearBtn) {
            //             imageInput.addEventListener("change", function () {
            //                 if (this.files && this.files[0]) {
            //                     var reader = new FileReader();
            //                     reader.onload = function (e) {
            //                         imageLabel.style.backgroundImage =
            //                             "url('" + e.target.result + "')";
            //                         imageLabel.classList.add("has-image");
            //                         imageLabel.style.backgroundSize = "cover";
            //                         imageLabel.style.opacity = "1";
            //                         imageClearBtn.classList.remove("d-none");
            //                     };
            //                     reader.readAsDataURL(this.files[0]);
            //                 }
            //             });
            //             imageClearBtn.addEventListener("click", function (e) {
            //                 e.preventDefault();
            //                 imageInput.value = "";
            //                 imageLabel.style.backgroundImage =
            //                     "url('" +
            //                     getMeta("app-url").replace(/\/$/, "") +
            //                     "/asset/img/background/add-image.png')";
            //                 imageLabel.style.backgroundPosition =
            //                     "center center";
            //                 imageLabel.style.backgroundRepeat = "no-repeat";
            //                 imageLabel.style.backgroundSize = "50%";
            //                 imageLabel.classList.remove("has-image");
            //                 imageLabel.style.opacity = "0.5";
            //                 imageClearBtn.classList.add("d-none");
            //             });
            //         }
            //     } catch (_) {}

            //     try {
            //         var addBtn = document.getElementById("addFeedbackButton");
            //         if (addBtn) {
            //             addBtn.textContent = "Submit";
            //             var fresh = addBtn.cloneNode(true);
            //             addBtn.parentNode.replaceChild(fresh, addBtn);
            //             fresh.addEventListener("click", function (e) {
            //                 e.preventDefault();
            //                 var form =
            //                     document.getElementById("replyFeedbackForm");
            //                 if (!form) return;
            //                 var fd = new FormData(form);
            //                 try {
            //                     var urlInputs = form.querySelectorAll(
            //                         'input[name="reference_urls[]"]'
            //                     );
            //                     var urls = Array.from(urlInputs)
            //                         .map(function (i) {
            //                             return (i.value || "").trim();
            //                         })
            //                         .filter(Boolean);
            //                     if (urls.length)
            //                         fd.set("reference_url", urls[0]);
            //                 } catch (_) {}
            //                 try {
            //                     if (
            //                         window.replyFeedbackSelectedFiles &&
            //                         window.replyFeedbackSelectedFiles.length
            //                     ) {
            //                         window.replyFeedbackSelectedFiles.forEach(
            //                             function (f) {
            //                                 fd.append("reference_files[]", f);
            //                             }
            //                         );
            //                     } else {
            //                         var rfInput = form.querySelector(
            //                             "#reply_reference_files"
            //                         );
            //                         if (
            //                             rfInput &&
            //                             rfInput.files &&
            //                             rfInput.files.length
            //                         )
            //                             Array.from(rfInput.files).forEach(
            //                                 function (f) {
            //                                     fd.append(
            //                                         "reference_files[]",
            //                                         f
            //                                     );
            //                                 }
            //                             );
            //                     }
            //                 } catch (_) {}
            //                 fetch(
            //                     getMeta("app-url").replace(/\/$/, "") +
            //                         "/project-feedbacks",
            //                     {
            //                         method: "POST",
            //                         headers: {
            //                             "X-CSRF-TOKEN": document
            //                                 .querySelector(
            //                                     'meta[name="csrf-token"]'
            //                                 )
            //                                 .getAttribute("content"),
            //                         },
            //                         body: fd,
            //                     }
            //                 )
            //                     .then(function (r) {
            //                         return r.ok
            //                             ? r.json()
            //                             : r.json().then(Promise.reject);
            //                     })
            //                     .then(function (res) {
            //                         window.showFloatingAlert(
            //                             res.message || "Reply submitted",
            //                             "success",
            //                             1500
            //                         );
            //                         loadFeedbackData(projectId);
            //                     })
            //                     .catch(function (err) {
            //                         var msg =
            //                             (err &&
            //                                 (err.message ||
            //                                     (err.errors &&
            //                                         Object.values(
            //                                             err.errors
            //                                         ).join("\n")))) ||
            //                             "Failed to submit reply";
            //                         window.showFloatingAlert(
            //                             msg,
            //                             "warning",
            //                             3500
            //                         );
            //                     });
            //             });
            //         }
            //     } catch (_) {}

            //     (function () {
            //         try {
            //             var footer = getProjectFeedbackFooter();
            //             if (!footer) return;
            //             var submitBtnRef =
            //                 document.getElementById("addFeedbackButton");
            //             if (!submitBtnRef) return;
            //             submitBtnRef.classList.remove("w-100");
            //             submitBtnRef.classList.add("flex-grow-1");
            //             var oldWrapper = footer.querySelector(
            //                 "#feedbackFormButtonsWrapper"
            //             );
            //             if (oldWrapper) oldWrapper.remove();
            //             var wrap = document.createElement("div");
            //             wrap.id = "feedbackFormButtonsWrapper";
            //             wrap.className = "d-flex gap-2 w-100";
            //             var closeBtn = document.createElement("button");
            //             closeBtn.id = "replyCloseButton";
            //             closeBtn.type = "button";
            //             closeBtn.className = "btn btn-close-reply flex-grow-1";
            //             closeBtn.textContent = "Close";
            //             closeBtn.addEventListener("click", function () {
            //                 try {
            //                     footer.innerHTML = "";
            //                     var restore = document.createElement("button");
            //                     restore.type = "button";
            //                     restore.className =
            //                         "btn btn-submit-black w-100";
            //                     restore.id = "addFeedbackButton";
            //                     restore.textContent = "Add Feedback";
            //                     restore.addEventListener("click", function () {
            //                         showAddFeedbackForm(projectId);
            //                     });
            //                     footer.appendChild(restore);
            //                 } catch (_) {}
            //                 loadFeedbackData(projectId);
            //             });
            //             wrap.appendChild(closeBtn);
            //             wrap.appendChild(submitBtnRef);
            //             footer.innerHTML = "";
            //             footer.appendChild(wrap);
            //         } catch (_) {}
            //     })();
            // }

            // function showEditFeedbackForm(projectId, data, isReply) {
            //     modalTitle.textContent = isReply
            //         ? "Edit Reply"
            //         : "Edit Feedback";
            //     // determine existing image from various possible fields and normalize to full URL
            //     var existingImgRaw =
            //         (data &&
            //             (data.image ||
            //                 data.image_url ||
            //                 data.image_path ||
            //                 data.imageUrl ||
            //                 data.image_url_full)) ||
            //         "";
            //     // detect explicit clear flags coming from server-side (treat as no image)
            //     var removeFlag = false;
            //     try {
            //         if (
            //             data &&
            //             (data.remove_image === 1 ||
            //                 data.remove_image === "1" ||
            //                 data.remove_image === true)
            //         )
            //             removeFlag = true;
            //         if (
            //             data &&
            //             (data.removeImage === 1 ||
            //                 data.removeImage === "1" ||
            //                 data.removeImage === true)
            //         )
            //             removeFlag = true;
            //     } catch (_) {
            //         removeFlag = false;
            //     }
            //     function toFullImageUrl(v) {
            //         if (!v) return "";
            //         try {
            //             var s = String(v);
            //             if (s.startsWith("http://") || s.startsWith("https://"))
            //                 return s;
            //             if (s.startsWith("/"))
            //                 return getMeta("app-url").replace(/\/$/, "") + s;
            //             return (
            //                 getMeta("app-url").replace(/\/$/, "") +
            //                 "/file/project/" +
            //                 s.replace(/^\//, "")
            //             );
            //         } catch (_) {
            //             return String(v);
            //         }
            //     }
            //     var existingImg = toFullImageUrl(existingImgRaw || "");
            //     var hasExistingImage = existingImg && !removeFlag;
            //     var bgStyle = hasExistingImage
            //         ? "background-image: url('" +
            //           existingImg +
            //           "'); background-size: cover; opacity: 1;"
            //         : "background-image: url('" +
            //           getMeta("app-url").replace(/\/$/, "") +
            //           "/asset/img/background/add-image.png'); background-size: 50%; opacity: 0.5;";
            //     var clearClass = hasExistingImage ? "" : "d-none";
            //     // Edit form markup should be provided by blade in #template-edit-feedback
            //     modalBody.innerHTML = "";
            //     var tplEdit = document.getElementById("template-edit-feedback");
            //     if (tplEdit) {
            //         var nodeE =
            //             tplEdit.tagName &&
            //             tplEdit.tagName.toLowerCase() === "template"
            //                 ? tplEdit.content.cloneNode(true)
            //                 : tplEdit.cloneNode(true);
            //         modalBody.appendChild(nodeE);
            //         // Set remove flag and textarea value after cloning
            //         var initialRemoveFlag = removeFlag ? "1" : "0";
            //         try {
            //             var hid = modalBody.querySelector("#edit_remove_image");
            //             if (hid) hid.value = initialRemoveFlag;
            //         } catch (_) {}
            //         try {
            //             var comment =
            //                 modalBody.querySelector("#feedback_comment");
            //             if (comment)
            //                 comment.value = data.feedback_comment || "";
            //         } catch (_) {}
            //         // Set image preview/background according to existing image
            //         try {
            //             var labelEl = modalBody.querySelector(
            //                 "#editFeedbackImageLabel"
            //             );
            //             if (labelEl) {
            //                 if (hasExistingImage) {
            //                     labelEl.style.backgroundImage =
            //                         "url('" + existingImg + "')";
            //                     labelEl.style.backgroundSize = "cover";
            //                     labelEl.style.opacity = "1";
            //                 } else {
            //                     labelEl.style.backgroundImage =
            //                         "url('" +
            //                         getMeta("app-url").replace(/\/$/, "") +
            //                         "/asset/img/background/add-image.png')";
            //                     labelEl.style.backgroundSize = "50%";
            //                     labelEl.style.opacity = "0.5";
            //                 }
            //             }
            //         } catch (_) {}
            //     } else {
            //         var existingEditForm =
            //             modalBody.querySelector("#editFeedbackForm");
            //         if (existingEditForm) {
            //             try {
            //                 var hid =
            //                     existingEditForm.querySelector(
            //                         "#edit_remove_image"
            //                     );
            //                 if (hid) hid.value = removeFlag ? "1" : "0";
            //             } catch (_) {}
            //             try {
            //                 var comment2 =
            //                     existingEditForm.querySelector(
            //                         "#feedback_comment"
            //                     );
            //                 if (comment2)
            //                     comment2.value = data.feedback_comment || "";
            //             } catch (_) {}
            //             try {
            //                 var labelEl2 = existingEditForm.querySelector(
            //                     "#editFeedbackImageLabel"
            //                 );
            //                 if (labelEl2) {
            //                     if (hasExistingImage) {
            //                         labelEl2.style.backgroundImage =
            //                             "url('" + existingImg + "')";
            //                         labelEl2.style.backgroundSize = "cover";
            //                         labelEl2.style.opacity = "1";
            //                     } else {
            //                         labelEl2.style.backgroundImage =
            //                             "url('" +
            //                             getMeta("app-url").replace(/\/$/, "") +
            //                             "/asset/img/background/add-image.png')";
            //                         labelEl2.style.backgroundSize = "50%";
            //                         labelEl2.style.opacity = "0.5";
            //                     }
            //                 }
            //             } catch (_) {}
            //         } else {
            //             console.error(
            //                 "Edit Feedback template/form not found. Provide #template-edit-feedback or an element #editFeedbackForm in the Blade view."
            //             );
            //             return;
            //         }
            //     }

            //     // image preview and clear handlers for edit feedback (ensure existing image shows and can be changed/cleared)
            //     try {
            //         var imgInput = modalBody.querySelector("#feedback_image");
            //         var imgLabel = modalBody.querySelector(
            //             "#editFeedbackImageLabel"
            //         );
            //         var imgClearBtn = modalBody.querySelector(
            //             "#editFeedbackImageClearBtn"
            //         );
            //         if (imgInput && imgLabel && imgClearBtn) {
            //             imgInput.addEventListener("change", function () {
            //                 if (this.files && this.files[0]) {
            //                     var reader = new FileReader();
            //                     reader.onload = function (e) {
            //                         imgLabel.style.backgroundImage =
            //                             "url('" + e.target.result + "')";
            //                         imgLabel.classList.add("has-image");
            //                         imgLabel.style.backgroundSize = "cover";
            //                         imgLabel.style.opacity = "1";
            //                         imgClearBtn.classList.remove("d-none");
            //                     };
            //                     reader.readAsDataURL(this.files[0]);
            //                 }
            //             });
            //             imgClearBtn.addEventListener("click", function (e) {
            //                 e.preventDefault();
            //                 try {
            //                     imgInput.value = "";
            //                 } catch (_) {}

            //                 // ubah preview jadi default
            //                 imgLabel.style.backgroundImage =
            //                     "url('" +
            //                     getMeta("app-url").replace(/\/$/, "") +
            //                     "/asset/img/background/add-image.png')";
            //                 imgLabel.style.backgroundPosition = "center center";
            //                 imgLabel.style.backgroundRepeat = "no-repeat";
            //                 imgLabel.style.backgroundSize = "50%";
            //                 imgLabel.classList.remove("has-image");
            //                 imgLabel.style.opacity = "0.5";
            //                 imgClearBtn.classList.add("d-none");

            //                 // ini yang penting: flag backend
            //                 var hidden =
            //                     modalBody.querySelector("#edit_remove_image");
            //                 if (hidden) hidden.value = "1";
            //             });
            //         }
            //         var addBtn = document.getElementById("addFeedbackButton");
            //         if (addBtn) {
            //             addBtn.textContent = "Update";
            //             var fresh = addBtn.cloneNode(true);
            //             addBtn.parentNode.replaceChild(fresh, addBtn);
            //             fresh.addEventListener("click", function (e) {
            //                 e.preventDefault();
            //                 var form =
            //                     document.getElementById("editFeedbackForm");
            //                 if (!form) return;
            //                 var fd = new FormData(form);
            //                 try {
            //                     var urlInputs = form.querySelectorAll(
            //                         'input[name="reference_urls[]"]'
            //                     );
            //                     var urls = Array.from(urlInputs)
            //                         .map(function (i) {
            //                             return (i.value || "").trim();
            //                         })
            //                         .filter(Boolean);
            //                     if (urls.length)
            //                         fd.set("reference_url", urls[0]);
            //                     else fd.set("reference_url", "");
            //                 } catch (_) {}
            //                 try {
            //                     var existingHidden = form.querySelector(
            //                         "#existing_feedback_reference_files_input"
            //                     );
            //                     var existingList = form.querySelectorAll(
            //                         "#existing_feedback_reference_files .existing-file-item a"
            //                     );
            //                     var keep = [];
            //                     existingList.forEach(function (a) {
            //                         var name = (a.textContent || "").trim();
            //                         if (name) keep.push(name);
            //                     });
            //                     if (existingHidden)
            //                         existingHidden.value = JSON.stringify(keep);
            //                 } catch (_) {}
            //                 try {
            //                     if (
            //                         window.editFeedbackSelectedFiles &&
            //                         window.editFeedbackSelectedFiles.length
            //                     ) {
            //                         window.editFeedbackSelectedFiles.forEach(
            //                             function (f) {
            //                                 fd.append("reference_files[]", f);
            //                             }
            //                         );
            //                     } else {
            //                         var rfInput = form.querySelector(
            //                             "#edit_reference_files"
            //                         );
            //                         if (
            //                             rfInput &&
            //                             rfInput.files &&
            //                             rfInput.files.length
            //                         )
            //                             Array.from(rfInput.files).forEach(
            //                                 function (f) {
            //                                     fd.append(
            //                                         "reference_files[]",
            //                                         f
            //                                     );
            //                                 }
            //                             );
            //                     }
            //                 } catch (_) {}
            //                 // ensure remove_image flag (if present) is sent to backend
            //                 try {
            //                     var editRemove =
            //                         form.querySelector("#edit_remove_image");
            //                     if (editRemove)
            //                         fd.set("remove_image", editRemove.value);
            //                 } catch (_) {}
            //                 fd.append("_method", "PUT");
            //                 fetch(
            //                     getMeta("app-url").replace(/\/$/, "") +
            //                         "/project-feedbacks/" +
            //                         data.id,
            //                     {
            //                         method: "POST",
            //                         headers: {
            //                             "X-CSRF-TOKEN": document
            //                                 .querySelector(
            //                                     'meta[name="csrf-token"]'
            //                                 )
            //                                 .getAttribute("content"),
            //                         },
            //                         body: fd,
            //                     }
            //                 )
            //                     .then(function (r) {
            //                         return r.ok
            //                             ? r.json()
            //                             : r.json().then(Promise.reject);
            //                     })
            //                     .then(function (res) {
            //                         // refresh list and ensure modal reflects the updated state (no image if removed)
            //                         try {
            //                             loadFeedbackData(projectId);
            //                         } catch (_) {}
            //                         // small safety: after a short delay re-render again to avoid stale cached content
            //                         setTimeout(function () {
            //                             try {
            //                                 loadFeedbackData(projectId);
            //                             } catch (_) {}
            //                         }, 700);
            //                     })
            //                     .catch(function (err) {
            //                         var msg =
            //                             (err &&
            //                                 (err.message ||
            //                                     (err.errors &&
            //                                         Object.values(
            //                                             err.errors
            //                                         ).join("\n")))) ||
            //                             "Failed to update feedback";
            //                         window.showFloatingAlert(
            //                             msg,
            //                             "warning",
            //                             3500
            //                         );
            //                     });
            //             });
            //         }
            //     } catch (_) {}

            //     // prefill URLs and existing files
            //     (function () {
            //         try {
            //             var container = document.getElementById(
            //                 "feedback_reference_urls_container"
            //             );
            //             if (!container) return;
            //             container.innerHTML = "";
            //             var urls = [];
            //             if (Array.isArray(data.reference_urls))
            //                 urls = data.reference_urls;
            //             else if (typeof data.reference_urls === "string") {
            //                 try {
            //                     var arr = JSON.parse(data.reference_urls);
            //                     if (Array.isArray(arr)) urls = arr;
            //                 } catch (_) {}
            //             }
            //             if ((!urls || !urls.length) && data.reference_url)
            //                 urls = [data.reference_url];
            //             function addRow(value, withAdd) {
            //                 var row = document.createElement("div");
            //                 row.className = "d-flex gap-2 align-items-center";
            //                 row.innerHTML =
            //                     '<input type="url" class="form-control input-text" name="reference_urls[]" placeholder="https://example.com">' +
            //                     (withAdd
            //                         ? ' <button type="button" class="btn btn-submit-black add-ref-url"><span class="material-symbols-outlined">add</span></button>'
            //                         : ' <button type="button" class="btn btn-remove-url remove-ref-url"><span class="material-symbols-outlined">close</span></button>');
            //                 container.appendChild(row);
            //                 var inp = row.querySelector('input[type="url"]');
            //                 if (inp && value) inp.value = value;
            //             }
            //             addRow("", true);
            //             (urls || []).forEach(function (u) {
            //                 addRow(u, false);
            //             });
            //         } catch (_) {}
            //     })();

            //     (function () {
            //         try {
            //             var container = modalBody.querySelector(
            //                 "#existing_feedback_reference_files"
            //             );
            //             var hidden = modalBody.querySelector(
            //                 "#existing_feedback_reference_files_input"
            //             );
            //             if (!container || !hidden) return;
            //             var files = [];
            //             if (Array.isArray(data.reference_files_urls))
            //                 files = data.reference_files_urls.slice();
            //             else if (Array.isArray(data.reference_files))
            //                 files = data.reference_files.slice();
            //             else if (data.reference_file_url)
            //                 files = [data.reference_file_url];
            //             else if (data.reference_file)
            //                 files = [data.reference_file];
            //             function toUrl(v) {
            //                 if (!v) return "";
            //                 var s = String(v);
            //                 if (
            //                     s.startsWith("http://") ||
            //                     s.startsWith("https://")
            //                 )
            //                     return s;
            //                 if (s.startsWith("/"))
            //                     return (
            //                         getMeta("app-url").replace(/\/$/, "") + s
            //                     );
            //                 return (
            //                     getMeta("app-url").replace(/\/$/, "") +
            //                     "/file/project/" +
            //                     s
            //                 );
            //             }
            //             function toName(u) {
            //                 if (!u) return "";
            //                 var s = String(u);
            //                 if (
            //                     s.startsWith("http://") ||
            //                     s.startsWith("https://")
            //                 ) {
            //                     try {
            //                         return new URL(s).pathname.split("/").pop();
            //                     } catch (_) {
            //                         return s.split("/").pop();
            //                     }
            //                 }
            //                 return s.split("/").pop();
            //             }
            //             container.innerHTML = "";
            //             if ((files || []).length > 0) {
            //                 // var title = document.createElement('div'); title.className='fw-bold mb-2'; title.textContent='Current Files:'; container.appendChild(title);
            //                 var list = document.createElement("div");
            //                 list.className = "existing-files-list w-100";
            //                 files.forEach(function (f) {
            //                     var url = toUrl(f);
            //                     var name = toName(f);
            //                     if (!name) return;
            //                     var item = document.createElement("div");
            //                     item.className =
            //                         "existing-file-item d-flex align-items-center justify-content-between mb-2 p-2 bg-light border rounded";
            //                     var info = document.createElement("div");
            //                     info.className =
            //                         "d-flex align-items-center flex-grow-1";
            //                     var icon = document.createElement("span");
            //                     icon.className =
            //                         "material-symbols-outlined me-2";
            //                     icon.textContent = "description";
            //                     var link = document.createElement("a");
            //                     link.href = url;
            //                     link.textContent = name;
            //                     link.className = "text-decoration-none";
            //                     link.target = "_blank";
            //                     var removeBtn =
            //                         document.createElement("button");
            //                     removeBtn.type = "button";
            //                     removeBtn.className =
            //                         "btn btn-sm btn-outline-danger";
            //                     removeBtn.innerHTML = "&times;";
            //                     removeBtn.onclick = function () {
            //                         item.remove();
            //                         try {
            //                             var anchors =
            //                                 container.querySelectorAll(
            //                                     ".existing-file-item a"
            //                                 );
            //                             var next = Array.from(anchors)
            //                                 .map(function (a) {
            //                                     return (
            //                                         a.textContent || ""
            //                                     ).trim();
            //                                 })
            //                                 .filter(Boolean);
            //                             hidden.value = JSON.stringify(next);
            //                         } catch (_) {}
            //                     };
            //                     info.appendChild(icon);
            //                     info.appendChild(link);
            //                     item.appendChild(info);
            //                     item.appendChild(removeBtn);
            //                     list.appendChild(item);
            //                 });
            //                 container.appendChild(list);
            //             }
            //             try {
            //                 var anchors = container.querySelectorAll(
            //                     ".existing-file-item a"
            //                 );
            //                 var names = Array.from(anchors)
            //                     .map(function (a) {
            //                         return (a.textContent || "").trim();
            //                     })
            //                     .filter(Boolean);
            //                 hidden.value = JSON.stringify(names);
            //             } catch (_) {
            //                 hidden.value = "[]";
            //             }
            //         } catch (_) {}
            //     })();

            //     (function () {
            //         try {
            //             var footer = getProjectFeedbackFooter();
            //             if (!footer) return;
            //             var submitBtnRef =
            //                 document.getElementById("addFeedbackButton");
            //             if (!submitBtnRef) return;
            //             submitBtnRef.classList.remove("w-100");
            //             submitBtnRef.classList.add("flex-grow-1");
            //             var oldWrapper = footer.querySelector(
            //                 "#feedbackFormButtonsWrapper"
            //             );
            //             if (oldWrapper) oldWrapper.remove();
            //             var wrap = document.createElement("div");
            //             wrap.id = "feedbackFormButtonsWrapper";
            //             wrap.className = "d-flex gap-2 w-100";
            //             var closeBtn = document.createElement("button");
            //             closeBtn.id = "replyCloseButton";
            //             closeBtn.type = "button";
            //             closeBtn.className = "btn btn-close-reply flex-grow-1";
            //             closeBtn.textContent = "Close";
            //             closeBtn.addEventListener("click", function () {
            //                 try {
            //                     footer.innerHTML = "";
            //                     var restore = document.createElement("button");
            //                     restore.type = "button";
            //                     restore.className =
            //                         "btn btn-submit-black w-100";
            //                     restore.id = "addFeedbackButton";
            //                     restore.textContent = "Add Feedback";
            //                     restore.addEventListener("click", function () {
            //                         showAddFeedbackForm(projectId);
            //                     });
            //                     footer.appendChild(restore);
            //                 } catch (_) {}
            //                 loadFeedbackData(projectId);
            //             });
            //             wrap.appendChild(closeBtn);
            //             wrap.appendChild(submitBtnRef);
            //             footer.innerHTML = "";
            //             footer.appendChild(wrap);
            //         } catch (_) {}
            //     })();
            // }

            // function markProjectFeedbacksRead(projectId) {
            //     return $.ajax({
            //         url:
            //             getMeta("app-url").replace(/\/$/, "") +
            //             "/project/" +
            //             projectId +
            //             "/feedbacks/mark-read",
            //         type: "POST",
            //         headers: {
            //             "X-CSRF-TOKEN": document
            //                 .querySelector('meta[name="csrf-token"]')
            //                 .getAttribute("content"),
            //         },
            //     }).always(function () {
            //         try {
            //             var badge = document.querySelector(
            //                 '.unread-badge[data-project-id="' + projectId + '"]'
            //             );
            //             if (badge) badge.classList.add("d-none");
            //         } catch (_) {}
            //     });
            // }

            // modal show/hide handlers
            projectFeedbackModalEl.addEventListener(
                "show.bs.modal",
                function () {
                    try {
                        document.body.classList.add("feedback-modal-open");
                        if (!document.getElementById("feedbackBackdropStyle")) {
                            var style = document.createElement("style");
                            style.id = "feedbackBackdropStyle";
                            style.textContent =
                                ".feedback-modal-open .modal-backdrop.show {opacity:0.18 !important;}";
                            document.head.appendChild(style);
                        }
                    } catch (_) {}
                }
            );
            projectFeedbackModalEl.addEventListener(
                "hidden.bs.modal",
                function () {
                    try {
                        // If suppression flag is set, this hidden event is from a temporary hide
                        // (for example when showing the delete confirmation). In that case,
                        // do not clear the modal content; just unset the flag and return.
                        if (projectFeedbackModalEl._suppressFeedbackClear) {
                            projectFeedbackModalEl._suppressFeedbackClear = false;
                            return;
                        }
                        modalTitle.textContent = "Feedback";
                        modalBody.innerHTML = "";
                        document.body.classList.remove("feedback-modal-open");
                    } catch (_) {}
                    try {
                        var backdrops =
                            document.querySelectorAll(".modal-backdrop");
                        backdrops.forEach(function (b) {
                            b.parentNode.removeChild(b);
                        });
                    } catch (_) {}
                }
            );
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
                        if (typeof window.showFloatingAlert === "function")
                            window.showFloatingAlert(
                                "Failed to delete",
                                "warning",
                                3500
                            );
                        else alert("Failed to delete");
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
                    if (typeof window.showFloatingAlert === "function")
                        window.showFloatingAlert(
                            "Project ID tidak ditemukan",
                            "warning",
                            3500
                        );
                    else alert("Project ID tidak ditemukan");
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
                            var failMsg =
                                (res && res.message) ||
                                "Failed to delete project";
                            if (typeof window.showFloatingAlert === "function")
                                window.showFloatingAlert(
                                    failMsg,
                                    "warning",
                                    3500
                                );
                            else alert(failMsg);
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
                        if (typeof window.showFloatingAlert === "function")
                            window.showFloatingAlert(msg, "warning", 3500);
                        else alert(msg);
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
            var initials = buildInitials(data.title || "");
            if (initials) {
                var color = getRandomColorFromText(data.title || "");
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
                    if (typeof window.showFloatingAlert === "function")
                        window.showFloatingAlert(
                            "Gagal mengambil data project",
                            "warning",
                            3500
                        );
                    else alert("Gagal mengambil data project");
                }
            },
            error: function (xhr) {
                console.error("Error fetching project", xhr);
                if (typeof window.showFloatingAlert === "function")
                    window.showFloatingAlert(
                        "Gagal mengambil data project",
                        "warning",
                        3500
                    );
                else alert("Gagal mengambil data project");
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
            var editImageEl = document.getElementById("edit_image");
            var editImageLabel = document.getElementById("editImageLabel");
            var editImageClearBtn =
                document.getElementById("editImageClearBtn");
            setupImageInput(editImageEl, editImageLabel, editImageClearBtn);
        } catch (e) {}

        // button references: open Reference Files modal (mirror project.js behavior)
        $("#btn-references").on("click", function (e) {
            e.preventDefault();
            var pid = getMeta("project-id");
            if (pid && window.showProjectFiles) {
                window.showProjectFiles(pid);
                return;
            }
            // fallback: try to open modal directly if element exists
            try {
                var modalEl = document.getElementById("projectFilesModal");
                if (modalEl) {
                    var m = new bootstrap.Modal(modalEl);
                    m.show();
                } else {
                    // fallback to hash navigation
                    window.location.hash = "#references";
                }
            } catch (err) {
                window.location.hash = "#references";
            }
        });
        // Expose showProjectFiles for detail page (same behavior as project.js)
        window.showProjectFiles = function (projectId) {
            const modalEl = document.getElementById("projectFilesModal");
            const listEl = document.getElementById("projectReferenceFilesList");
            if (!modalEl || !listEl) return;

            listEl.innerHTML =
                '<div class="text-center py-4"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';

            const appBase = getMeta("app-url")
                ? getMeta("app-url").replace(/\/$/, "")
                : "";

            $.ajax({
                url: appBase + "/project/" + projectId,
                method: "GET",
                dataType: "json",
                success: function (resp) {
                    const data = resp && resp.data ? resp.data : resp || {};
                    const files = Array.isArray(data.reference_files)
                        ? data.reference_files
                        : Array.isArray(data.reference_file)
                        ? data.reference_file
                        : data.reference_file
                        ? [data.reference_file]
                        : [];

                    listEl.innerHTML = "";

                    if (files && files.length > 0) {
                        files.forEach((fileName) => {
                            if (!fileName) return;

                            let fileUrl = String(fileName || "");
                            const isAbs =
                                fileUrl.startsWith("http://") ||
                                fileUrl.startsWith("https://");
                            const isRefPath =
                                fileUrl.startsWith("/file/project/") ||
                                fileUrl.startsWith("file/project/") ||
                                fileUrl.startsWith("/file/") ||
                                fileUrl.startsWith("file/");
                            if (!isAbs && !isRefPath) {
                                fileUrl = appBase + "/file/project/" + fileUrl;
                            } else if (!isAbs && fileUrl.startsWith("/")) {
                                fileUrl = appBase + fileUrl;
                            }

                            const item = document.createElement("div");
                            item.className =
                                "reference-files-list d-flex align-items-center gap-2 p-2 rounded bg-light selected-task mb-2";

                            const lower = String(fileName || "").toLowerCase();
                            const isImage =
                                /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(
                                    lower
                                ) ||
                                fileUrl.match(
                                    /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i
                                );

                            if (isImage) {
                                const img = document.createElement("img");
                                img.src = fileUrl;
                                img.width = 28;
                                img.height = 28;
                                img.style.objectFit = "cover";
                                img.style.borderRadius = "50%";
                                img.alt = fileName;
                                item.appendChild(img);
                            }

                            const title = document.createElement("a");
                            title.className =
                                "reference-files-list flex-grow-1 text-decoration-none text-truncate";
                            title.href = fileUrl;
                            title.target = "_blank";
                            title.textContent = fileName;
                            item.appendChild(title);

                            // Download button
                            const dlBtn = document.createElement("button");
                            dlBtn.type = "button";
                            dlBtn.className = "btn btn-sm btn-link p-0 ms-2";
                            dlBtn.title = "Download";
                            dlBtn.innerHTML =
                                '<span class="material-symbols-outlined">download</span>';
                            dlBtn.addEventListener("click", function (ev) {
                                try {
                                    ev.preventDefault();
                                    ev.stopPropagation();
                                    const a = document.createElement("a");
                                    a.style.display = "none";
                                    a.href = fileUrl;
                                    try {
                                        a.download = String(fileName || "")
                                            .split("/")
                                            .pop();
                                    } catch (_) {}
                                    a.target = "_blank";
                                    document.body.appendChild(a);
                                    a.click();
                                    setTimeout(() => {
                                        try {
                                            document.body.removeChild(a);
                                        } catch (_) {}
                                    }, 100);
                                } catch (e) {
                                    window.open(fileUrl, "_blank");
                                }
                            });
                            item.appendChild(dlBtn);

                            // Delete button
                            const delBtn = document.createElement("button");
                            delBtn.type = "button";
                            delBtn.className =
                                "btn btn-sm btn-link p-0 ms-1 text-danger";
                            delBtn.title = "Delete";
                            delBtn.innerHTML =
                                '<span class="material-symbols-outlined">delete</span>';

                            delBtn.addEventListener("click", function (ev) {
                                ev.preventDefault();
                                ev.stopPropagation();

                                const deleteModalEl =
                                    document.getElementById("deleteFileModal");
                                const deleteFileNameEl =
                                    document.getElementById("deleteFileName");
                                const confirmDeleteBtn =
                                    document.getElementById("confirmDeleteBtn");

                                if (
                                    !deleteModalEl ||
                                    !deleteFileNameEl ||
                                    !confirmDeleteBtn
                                )
                                    return;

                                // Simpan instance modal reference files
                                const refModalInstance =
                                    bootstrap.Modal.getInstance(
                                        document.getElementById(
                                            "projectFilesModal"
                                        )
                                    );
                                if (refModalInstance) refModalInstance.hide(); // tutup modal utama

                                deleteFileNameEl.textContent = fileName;

                                const deleteModalInstance = new bootstrap.Modal(
                                    deleteModalEl
                                );
                                deleteModalInstance.show();

                                // Hapus event listener lama supaya ga numpuk
                                confirmDeleteBtn.onclick = function () {
                                    $.ajax({
                                        url:
                                            appBase +
                                            "/project/" +
                                            projectId +
                                            "/reference-file",
                                        method: "DELETE",
                                        // backend expects key 'filename' (lowercase)
                                        data: { filename: fileName },
                                        success: function () {
                                            item.remove();
                                            deleteModalInstance.hide();
                                        },
                                        error: function () {
                                            alert("Failed to delete file.");
                                            deleteModalInstance.hide();
                                        },
                                    });
                                };

                                // Kalau modal delete ditutup tanpa delete (cancel)
                                deleteModalEl.addEventListener(
                                    "hidden.bs.modal",
                                    function () {
                                        if (refModalInstance)
                                            refModalInstance.show(); // buka kembali modal reference files
                                    },
                                    { once: true }
                                );
                            });

                            item.appendChild(delBtn);

                            listEl.appendChild(item);
                        });
                    } else {
                        listEl.textContent = "No reference files available.";
                    }

                    try {
                        new bootstrap.Modal(modalEl).show();
                    } catch (_) {}
                },
                error: function () {
                    listEl.innerHTML = "";
                    listEl.textContent = "Failed to load reference files.";
                    try {
                        new bootstrap.Modal(modalEl).show();
                    } catch (_) {}
                },
            });
        };

        // Delegated handler: add/remove reference URL rows (match project.js behavior)
        document.addEventListener("click", function (e) {
            try {
                var addBtn = e.target.closest(".add-ref-url");
                if (addBtn) {
                    e.preventDefault && e.preventDefault();
                    var container = addBtn.closest(
                        "#feedback_reference_urls_container, #project_reference_urls_container, #edit_project_reference_urls_container, #reply_reference_urls_container"
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

                const removeBtn = e.target.closest(".remove-ref-url");
                if (removeBtn) {
                    e.preventDefault();
                    const row = removeBtn.closest(".input-group");
                    if (row && row.parentNode) {
                        row.parentNode.removeChild(row);
                    }
                }
            } catch (_) {}
        });

        function loadDepartments(callback, targetSelect) {
            targetSelect =
                targetSelect || document.getElementById("edit_department");
            $.ajax({
                url:
                    getMeta("app-url").replace(/\/$/, "") +
                    "/departments-for-projects",
                type: "GET",
                dataType: "json",
                success: function (data) {
                    var options = '<option value="">Select Department</option>';
                    (data.data || []).forEach(function (dept) {
                        options +=
                            '<option value="' +
                            dept.id +
                            '">' +
                            (dept.name_department || dept.name) +
                            "</option>";
                    });
                    try {
                        targetSelect.innerHTML = options;
                    } catch (e) {}
                    if (typeof callback === "function") callback();
                },
                error: function () {
                    if (typeof callback === "function") callback();
                },
            });
        }

        function loadDivisions(departmentId, callback, targetSelect) {
            targetSelect =
                targetSelect || document.getElementById("edit_division");
            if (!departmentId) {
                targetSelect.innerHTML =
                    '<option value="">Select Division</option>';
                if (typeof callback === "function") callback();
                return;
            }
            $.ajax({
                url:
                    getMeta("app-url").replace(/\/$/, "") +
                    "/divisions-for-projects",
                type: "GET",
                data: { department_id: departmentId },
                dataType: "json",
                success: function (data) {
                    var options = '<option value="">Select Division</option>';
                    (data.data || []).forEach(function (d) {
                        options +=
                            '<option value="' +
                            d.id +
                            '">' +
                            (d.name_division || d.name) +
                            "</option>";
                    });
                    try {
                        targetSelect.innerHTML = options;
                    } catch (e) {}
                    if (typeof callback === "function") callback();
                },
                error: function () {
                    if (typeof callback === "function") callback();
                },
            });
        }

        function populatePartOfProjectSelects(
            currentProjectId = null,
            currentProjectTitle = "",
            currentPartOfProjectId = null,
            currentPartOfProjectTitle = ""
        ) {
            const input = document.getElementById("edit_part_of_project_input");
            const dropdown = document.getElementById(
                "edit_part_of_project_dropdown"
            );
            const hiddenInput = document.getElementById("edit_part_of_project");
            const selectedContainer = document.getElementById(
                "edit_selected_project"
            );

            if (!input || !dropdown || !hiddenInput || !selectedContainer) {
                console.warn(
                    "[populatePartOfProjectSelects] Elements not found for edit"
                );
                return;
            }

            let projects = [];

            function getInitialAvatar(name) {
                const colors = [
                    "#F44336",
                    "#E91E63",
                    "#9C27B0",
                    "#673AB7",
                    "#3F51B5",
                    "#2196F3",
                    "#03A9F4",
                    "#00BCD4",
                    "#009688",
                    "#4CAF50",
                    "#8BC34A",
                    "#FFC107",
                    "#FF9800",
                    "#FF5722",
                    "#795548",
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

            function showSelectedProject(p) {
                let avatarHtml;
                if (p.image && p.image.trim() !== "") {
                    avatarHtml = `<img src="${appUrl}/file/project/${p.image}"
                                    width="28" height="28" style="object-fit:cover;border-radius:50%;">`;
                } else {
                    avatarHtml = getInitialAvatar(p.title);
                }

                selectedContainer.innerHTML = `
                    <div class="d-flex align-items-center gap-2 p-2 rounded bg-light selected-project">
                        ${avatarHtml}
                        <span class="flex-grow-1">${p.title}</span>
                        <button type="button" class="btn btn-sm btn-remove-project remove-project" style="line-height:1">
                            <span class="material-symbols-outlined">close</span>
                        </button>
                    </div>
                `;

                const removeBtn =
                    selectedContainer.querySelector(".remove-project");
                removeBtn.addEventListener("click", () => {
                    hiddenInput.value = "";
                    input.value = "";
                    selectedContainer.innerHTML = "";
                });
            }

            function renderDropdown(filter = "") {
                dropdown.innerHTML = "";
                let filtered = projects.filter((p) =>
                    p.title.toLowerCase().includes(filter.toLowerCase())
                );

                // Exclude current project
                if (currentProjectId) {
                    filtered = filtered.filter(
                        (p) => String(p.id) !== String(currentProjectId)
                    );
                }

                filtered.forEach((p) => {
                    let avatarHtml;
                    if (p.image && p.image.trim() !== "") {
                        avatarHtml = `<img src="${appUrl}/file/project/${p.image}"
                                        width="24" height="24" style="object-fit:cover;border-radius:50%;">`;
                    } else {
                        avatarHtml = getInitialAvatar(p.title);
                    }

                    const item = document.createElement("div");
                    item.className =
                        "dropdown-item d-flex align-items-center gap-2";
                    item.innerHTML = `${avatarHtml}<span>${p.title}</span>`;
                    item.addEventListener("click", () => {
                        hiddenInput.value = p.id;
                        input.value = p.title;
                        dropdown.style.display = "none";
                        showSelectedProject(p);
                    });
                    dropdown.appendChild(item);
                });

                dropdown.style.display = filtered.length ? "block" : "none";
            }

            // Fetch projects
            fetch(appUrl + "/project/index?task_scope=all")
                .then((res) => res.json())
                .then((payload) => {
                    projects =
                        (Array.isArray(payload) ? payload : payload.data) || [];
                    projects = projects.map((p) => ({
                        id: p.id,
                        title: p.title || p.name || "Project " + p.id,
                        image: p.image || "",
                    }));

                    // Preselect part_of_project kalau ada
                    if (currentPartOfProjectId) {
                        const found = projects.find(
                            (p) =>
                                String(p.id) === String(currentPartOfProjectId)
                        );
                        if (found) {
                            hiddenInput.value = found.id;
                            input.value = found.title;
                            showSelectedProject(found);
                        } else if (currentPartOfProjectTitle) {
                            hiddenInput.value = currentPartOfProjectId;
                            input.value = currentPartOfProjectTitle;
                            showSelectedProject({
                                id: currentPartOfProjectId,
                                title: currentPartOfProjectTitle,
                                image: "",
                            });
                        }
                    }
                });

            input.addEventListener("input", () => renderDropdown(input.value));
            input.addEventListener("focus", () => renderDropdown(input.value));

            document.addEventListener("click", (e) => {
                if (!dropdown.contains(e.target) && e.target !== input) {
                    dropdown.style.display = "none";
                }
            });
        }

        // Image input helper for edit modal
        function setupImageInput(inputEl, labelEl, clearBtnEl) {
            if (!inputEl || !labelEl) return;
            inputEl.addEventListener("change", function () {
                var file = this.files && this.files[0];
                if (!file) return;
                var reader = new FileReader();
                reader.onload = function (e) {
                    try {
                        labelEl.style.backgroundImage =
                            "url(" + e.target.result + ")";
                        labelEl.classList.add("has-image");
                        labelEl.style.backgroundSize = "cover";
                        labelEl.style.opacity = "1";
                        if (clearBtnEl) clearBtnEl.classList.remove("d-none");
                        // if user selects a new image, ensure remove_image flag is reset
                        try {
                            document.getElementById("edit_remove_image").value =
                                "0";
                        } catch (_) {}
                    } catch (err) {}
                };
                reader.readAsDataURL(file);
            });

            // Helper: build initials from a title string (first+last char or first two chars)
            function buildInitials(title) {
                try {
                    if (!title) return "";
                    var t = String(title || "").trim();
                    if (!t) return "";
                    var parts = t.split(/\s+/).filter(Boolean);
                    if (parts.length === 1)
                        return parts[0].substring(0, 2).toUpperCase();
                    return (
                        parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
                    ).toUpperCase();
                } catch (e) {
                    return "";
                }
            }

            // Helper: deterministic color from text
            function getRandomColorFromText(text) {
                try {
                    var colors = [
                        "#6A5AE0",
                        "#FF8A3C",
                        "#00A881",
                        "#D4526E",
                        "#3E8EDE",
                        "#546E7A",
                        "#8E44AD",
                        "#2E7D32",
                        "#AD1457",
                        "#EF6C00",
                    ];
                    var h = 0;
                    for (var i = 0; i < (text || "").length; i++) {
                        h = text.charCodeAt(i) + ((h << 5) - h);
                    }
                    return colors[Math.abs(h) % colors.length];
                } catch (e) {
                    return "#6A5AE0";
                }
            }

            if (clearBtnEl) {
                clearBtnEl.addEventListener("click", function (ev) {
                    ev.preventDefault();
                    try {
                        inputEl.value = "";
                        var placeholder =
                            getMeta("app-url").replace(/\/$/, "") +
                            "/asset/img/background/add-image.png";
                        labelEl.style.backgroundImage =
                            "url('" + placeholder + "')";
                        labelEl.classList.remove("has-image");
                        labelEl.style.opacity = "0.5";
                        clearBtnEl.classList.add("d-none");
                        // mark remove_image so backend deletes existing image
                        try {
                            document.getElementById("edit_remove_image").value =
                                "1";
                        } catch (_) {}
                    } catch (err) {}
                });
            }
        } // end setupImageInput

        if (typeof window.setupCoAuthorInputEdit !== "function") {
            window.setupCoAuthorInputEdit = function setupCoAuthorInputEdit() {
                const input = document.getElementById("edit_co_author_input");
                const dropdown = document.getElementById(
                    "edit_co_author_dropdown"
                );
                const selectedContainer = document.getElementById(
                    "edit_selected_co_authors"
                );
                const hiddenInput = document.getElementById("edit_co_author");

                if (!input || !dropdown || !selectedContainer || !hiddenInput)
                    return;

                let employees = [];
                let filteredEmployees = [];
                // store selected contributors as a map id -> object to avoid losing previous selections
                let selectedEmployees = [];
                let selectedMap = {};
                let isDropdownOpen = false;

                function fetchEmployees(query = "") {
                    const currentEmployeeId =
                        document
                            .getElementById("editProjectModal")
                            ?.getAttribute("data-employee-id") || "";
                    $.ajax({
                        url:
                            getMeta("app-url").replace(/\/$/, "") +
                            "/employees-for-projects",
                        type: "GET",
                        data: {
                            query: query,
                            exclude_employee_id: currentEmployeeId,
                        },
                        dataType: "json",
                        timeout: 10000,
                        success: function (data) {
                            employees = (data.data || []).map(function (e) {
                                const candidate =
                                    e.profile_picture_url ||
                                    e.profile_picture ||
                                    e.user_photo;
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
                    fetchEmployees(
                        document.getElementById("edit_co_author_input")
                            ?.value || ""
                    );
                };

                function getDivision(emp) {
                    try {
                        if (!emp) return "";
                        return (
                            emp?.division_name ||
                            emp?.division ||
                            emp?.division_title ||
                            (typeof emp?.division === "object" &&
                                (emp.division?.name || emp.division?.title)) ||
                            emp?.employee_division ||
                            (emp?.employee &&
                                (emp.employee.division_name ||
                                    (emp.employee.division &&
                                        (emp.employee.division.name ||
                                            emp.employee.division.title)))) ||
                            ""
                        );
                    } catch (_) {
                        return "";
                    }
                }

                function renderDropdown() {
                    if (filteredEmployees.length === 0) {
                        dropdown.innerHTML =
                            '<div class="dropdown-item disabled">No employees found</div>';
                        dropdown.style.display = isDropdownOpen
                            ? "block"
                            : "none";
                        return;
                    }

                    // Exclude employees already selected as Contributors
                    function getContributorIds() {
                        try {
                            const raw =
                                document.getElementById("edit_contributors")
                                    ?.value || "[]";
                            const arr = JSON.parse(raw);
                            return Array.isArray(arr)
                                ? arr.map((v) => Number(v))
                                : [];
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
                            const isChecked = selectedEmployees.some(
                                (e) => e.id === emp.id
                            );
                            if (!emp.user_photo) {
                                emp.user_photo = "/asset/img/avatar.png";
                            }
                            let photoUrl;
                            try {
                                if (emp.user_photo.startsWith("http"))
                                    photoUrl = emp.user_photo;
                                else if (emp.user_photo.startsWith("/"))
                                    photoUrl =
                                        getMeta("app-url") + emp.user_photo;
                                else if (emp.user_photo.includes("/"))
                                    photoUrl =
                                        getMeta("app-url") +
                                        "/" +
                                        emp.user_photo;
                                else
                                    photoUrl =
                                        getMeta("app-url") +
                                        "/file/profile_picture/" +
                                        emp.user_photo;
                            } catch (_) {
                                photoUrl =
                                    getMeta("app-url") +
                                    "/asset/img/avatar.png";
                            }

                            const divName = getDivision(emp);
                            return `
            <label class="dropdown-item d-flex align-items-center justify-content-between" style="cursor: pointer;">
                <div class="d-flex align-items-center">
                    <img src="${photoUrl}" alt="${
                                emp.name
                            }" class="rounded-circle me-2" style="width: 30px; height: 30px; object-fit: cover;">
                    <div class="d-flex flex-column">
                        <span>${emp.name}</span>
                        <small class="text-muted" style="font-size:10px;">${
                            divName || ""
                        }</small>
                    </div>
                </div>
                <input type="checkbox" class="co-author-checkbox" data-id="${
                    emp.id
                }" data-name="${emp.name}" ${isChecked ? "checked" : ""}>
            </label>
        `;
                        })
                        .join("");

                    dropdown.innerHTML = html;
                    dropdown.style.display = isDropdownOpen ? "block" : "none";

                    dropdown
                        .querySelectorAll(".co-author-checkbox")
                        .forEach((checkbox) => {
                            checkbox.addEventListener("change", function () {
                                const id = parseInt(
                                    this.getAttribute("data-id")
                                );
                                const name = this.getAttribute("data-name");
                                // use hidden input as source of truth to avoid replacements
                                let cur = [];
                                try {
                                    cur = JSON.parse(
                                        (hiddenInput && hiddenInput.value) ||
                                            "[]"
                                    );
                                    if (!Array.isArray(cur)) cur = [];
                                } catch (_) {
                                    cur = [];
                                }

                                if (this.checked) {
                                    if (!cur.includes(id)) cur.push(id);
                                    const empObj = employees.find(
                                        (emp) => Number(emp.id) === Number(id)
                                    ) || { id: id, name: name };
                                    selectedMap[String(id)] = {
                                        id: Number(id),
                                        name: empObj.name || name || "",
                                        user_photo: empObj.user_photo || null,
                                        division: getDivision(empObj),
                                    };
                                } else {
                                    cur = cur.filter(
                                        (v) => Number(v) !== Number(id)
                                    );
                                    delete selectedMap[String(id)];
                                }

                                try {
                                    if (hiddenInput)
                                        hiddenInput.value = JSON.stringify(cur);
                                } catch (_) {}

                                selectedEmployees = Object.keys(
                                    selectedMap
                                ).map(function (k) {
                                    return selectedMap[k];
                                });
                                renderSelected();
                                renderDropdown();
                                try {
                                    window.syncContributorsWithCoAuthors &&
                                        window.syncContributorsWithCoAuthors();
                                } catch (_) {}
                            });
                        });
                }

                function renderSelected() {
                    selectedContainer.innerHTML = "";
                    selectedEmployees.forEach((emp) => {
                        const photoUrl =
                            emp.user_photo ||
                            getMeta("app-url") + "/asset/img/avatar.png";
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

                        const nameWrapper = document.createElement("div");
                        nameWrapper.className = "d-flex flex-column";
                        const nameSpan = document.createElement("span");
                        nameSpan.textContent = emp.name;
                        nameSpan.style.lineHeight = "1";
                        const divSpan = document.createElement("small");
                        divSpan.className = "text-muted";
                        divSpan.style.lineHeight = "1";
                        divSpan.textContent = emp.division || "";
                        nameWrapper.appendChild(nameSpan);
                        nameWrapper.appendChild(divSpan);

                        const removeBtn = document.createElement("button");
                        removeBtn.type = "button";
                        removeBtn.className = "btn-close btn-sm ms-2";
                        removeBtn.setAttribute("aria-label", "Remove");
                        removeBtn.addEventListener("click", () => {
                            // remove from hidden input (source of truth) and from selectedMap
                            try {
                                let cur = JSON.parse(
                                    (hiddenInput && hiddenInput.value) || "[]"
                                );
                                if (!Array.isArray(cur)) cur = [];
                                cur = cur.filter(function (v) {
                                    return Number(v) !== Number(emp.id);
                                });
                                if (hiddenInput)
                                    hiddenInput.value = JSON.stringify(cur);
                                delete selectedMap[String(emp.id)];
                                selectedEmployees = Object.keys(
                                    selectedMap
                                ).map(function (k) {
                                    return selectedMap[k];
                                });
                            } catch (_) {
                                delete selectedMap[String(emp.id)];
                                selectedEmployees = Object.keys(
                                    selectedMap
                                ).map(function (k) {
                                    return selectedMap[k];
                                });
                            }
                            renderSelected();
                            renderDropdown();
                            try {
                                window.syncContributorsWithCoAuthors &&
                                    window.syncContributorsWithCoAuthors();
                            } catch (_) {}
                        });

                        badge.appendChild(img);
                        badge.appendChild(nameWrapper);
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
                    if (val === "") filteredEmployees = employees;
                    else
                        filteredEmployees = employees.filter((emp) =>
                            emp.name.toLowerCase().includes(val)
                        );
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
                    if (
                        !input.contains(e.target) &&
                        !dropdown.contains(e.target)
                    ) {
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
                    if (!raw)
                        return getMeta("app-url") + "/asset/img/avatar.png";
                    try {
                        raw = String(raw).trim();
                        const trimmed = raw.replace(/^\/+/, "");
                        if (/^https?:\/\//i.test(raw)) return raw;
                        if (/^(file\/|asset\/|storage\/)/.test(trimmed))
                            return getMeta("app-url") + "/" + trimmed;
                        if (raw.startsWith("/"))
                            return getMeta("app-url") + raw;
                        if (raw.indexOf("/") !== -1)
                            return getMeta("app-url") + "/" + trimmed;
                        return (
                            getMeta("app-url") + "/file/profile_picture/" + raw
                        );
                    } catch (_) {
                        return getMeta("app-url") + "/asset/img/avatar.png";
                    }
                }

                window.setSelectedCoAuthorsEdit = function (coAuthors) {
                    let contribIds = [];
                    try {
                        const raw =
                            document.getElementById("edit_contributors")
                                ?.value || "[]";
                        const arr = JSON.parse(raw);
                        contribIds = Array.isArray(arr)
                            ? arr.map((v) => Number(v))
                            : [];
                    } catch (_) {
                        contribIds = [];
                    }

                    // Merge incoming coAuthors with existing hidden input (do not replace)
                    let existing = [];
                    try {
                        existing = JSON.parse(
                            document.getElementById("edit_co_author")?.value ||
                                "[]"
                        );
                        if (!Array.isArray(existing)) existing = [];
                    } catch (_) {
                        existing = [];
                    }

                    const incoming = Array.isArray(coAuthors)
                        ? coAuthors.map((c) => Number(c.id))
                        : [];
                    const unionIds = Array.from(
                        new Set([].concat(existing, incoming))
                    ).filter((id) => !contribIds.includes(Number(id)));

                    try {
                        selectedMap = {};
                        selectedEmployees = unionIds.map(function (sid) {
                            const emp =
                                employees.find(function (ee) {
                                    return Number(ee.id) === Number(sid);
                                }) || {};
                            const foundIncoming =
                                (coAuthors || []).find(function (c) {
                                    return Number(c.id) === Number(sid);
                                }) || {};
                            const obj = {
                                id: Number(sid),
                                name: emp.name || foundIncoming.name || "",
                                user_photo:
                                    emp.user_photo ||
                                    buildAvatarUrl(
                                        foundIncoming.profile_picture ||
                                            foundIncoming.user_photo ||
                                            ""
                                    ),
                                division:
                                    getDivision(emp) ||
                                    getDivision(foundIncoming) ||
                                    "",
                            };
                            selectedMap[String(obj.id)] = obj;
                            return obj;
                        });
                    } catch (_) {
                        selectedMap = {};
                        selectedEmployees = unionIds.map(function (sid) {
                            var o = {
                                id: Number(sid),
                                name: "",
                                user_photo: null,
                                division: "",
                            };
                            selectedMap[String(sid)] = o;
                            return o;
                        });
                    }

                    // write back hidden input
                    try {
                        document.getElementById("edit_co_author").value =
                            JSON.stringify(
                                selectedEmployees.map(function (e) {
                                    return e.id;
                                })
                            );
                    } catch (_) {}

                    renderSelected();
                    try {
                        window.syncContributorsWithCoAuthors &&
                            window.syncContributorsWithCoAuthors();
                    } catch (_) {}
                    renderDropdown();
                };

                window.syncCoAuthorsWithContributors = function () {
                    const contributorIds = (function () {
                        try {
                            const raw =
                                document.getElementById("edit_contributors")
                                    ?.value || "[]";
                            const arr = JSON.parse(raw);
                            return Array.isArray(arr)
                                ? arr.map((v) => Number(v))
                                : [];
                        } catch (_) {
                            return [];
                        }
                    })();
                    const before = selectedEmployees.length;
                    selectedEmployees = selectedEmployees.filter(
                        (se) => !contributorIds.includes(Number(se.id))
                    );
                    if (selectedEmployees.length !== before) {
                        renderSelected();
                        updateHiddenInput();
                    }
                    renderDropdown();
                };
            }; // end setupCoAuthorInputEdit
        }

        // Setup searchable contributors input inside edit modal
        // Define setupContributorInputEdit only if not provided by shared project.js
        if (typeof window.setupContributorInputEdit !== "function") {
            window.setupContributorInputEdit =
                function setupContributorInputEdit() {
                    const input = document.getElementById(
                        "edit_contributor_input"
                    );
                    const dropdown = document.getElementById(
                        "edit_contributor_dropdown"
                    );
                    const selectedContainer = document.getElementById(
                        "edit_selected_contributors"
                    );
                    const hiddenInput =
                        document.getElementById("edit_contributors");

                    if (
                        !input ||
                        !dropdown ||
                        !selectedContainer ||
                        !hiddenInput
                    )
                        return;

                    let employees = [];
                    let filteredEmployees = [];
                    let selectedEmployees = [];
                    // map of id -> employee object to persist selections
                    let selectedMap = {};
                    let isDropdownOpen = false;

                    function buildAvatarUrl(raw) {
                        if (!raw)
                            return getMeta("app-url") + "/asset/img/avatar.png";
                        try {
                            raw = String(raw).trim();
                            const trimmed = raw.replace(/^\/+/, "");
                            if (/^https?:\/\//i.test(raw)) return raw;
                            if (/^(file\/|asset\/|storage\/)/.test(trimmed))
                                return getMeta("app-url") + "/" + trimmed;
                            if (raw.startsWith("/"))
                                return getMeta("app-url") + raw;
                            if (raw.indexOf("/") !== -1)
                                return getMeta("app-url") + "/" + trimmed;
                            return (
                                getMeta("app-url") +
                                "/file/profile_picture/" +
                                raw
                            );
                        } catch (_) {
                            return getMeta("app-url") + "/asset/img/avatar.png";
                        }
                    }

                    function fetchEmployees(query = "") {
                        const currentEmployeeId =
                            document
                                .getElementById("editProjectModal")
                                ?.getAttribute("data-employee-id") || "";
                        $.ajax({
                            url:
                                getMeta("app-url").replace(/\/$/, "") +
                                "/employees-for-projects",
                            type: "GET",
                            data: {
                                query: query,
                                exclude_employee_id: currentEmployeeId,
                            },
                            dataType: "json",
                            timeout: 10000,
                            success: function (data) {
                                employees = (data.data || []).map(function (e) {
                                    const candidate =
                                        e.profile_picture_url ||
                                        e.profile_picture ||
                                        e.user_photo;
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
                            fetchEmployees(
                                document.getElementById(
                                    "edit_contributor_input"
                                )?.value || ""
                            );
                        };
                    })(window.__refreshEditProjectEmployees);

                    function getDivision(emp) {
                        try {
                            if (!emp) return "";
                            return (
                                emp?.division_name ||
                                emp?.division ||
                                emp?.division_title ||
                                (typeof emp?.division === "object" &&
                                    (emp.division?.name ||
                                        emp.division?.title)) ||
                                emp?.employee_division ||
                                (emp?.employee &&
                                    (emp.employee.division_name ||
                                        (emp.employee.division &&
                                            (emp.employee.division.name ||
                                                emp.employee.division
                                                    .title)))) ||
                                ""
                            );
                        } catch (_) {
                            return "";
                        }
                    }

                    function renderDropdown() {
                        if (filteredEmployees.length === 0) {
                            dropdown.innerHTML =
                                '<div class="dropdown-item disabled">No employees found</div>';
                            dropdown.style.display = isDropdownOpen
                                ? "block"
                                : "none";
                            return;
                        }

                        // Exclude employees already selected as co-authors
                        function getCoAuthorIds() {
                            try {
                                const raw =
                                    document.getElementById("edit_co_author")
                                        ?.value || "[]";
                                const arr = JSON.parse(raw);
                                return Array.isArray(arr)
                                    ? arr.map((v) => Number(v))
                                    : [];
                            } catch (_) {
                                return [];
                            }
                        }
                        const coAuthorIds = getCoAuthorIds();
                        const availableEmployees = filteredEmployees.filter(
                            (emp) => !coAuthorIds.includes(Number(emp.id))
                        );

                        const html = availableEmployees
                            .map((emp) => {
                                const isChecked = selectedEmployees.some(
                                    (e) => e.id === emp.id
                                );
                                if (!emp.user_photo)
                                    emp.user_photo = "/asset/img/avatar.png";
                                let photoUrl;
                                try {
                                    if (emp.user_photo.startsWith("http"))
                                        photoUrl = emp.user_photo;
                                    else if (emp.user_photo.startsWith("/"))
                                        photoUrl =
                                            getMeta("app-url") + emp.user_photo;
                                    else if (emp.user_photo.includes("/"))
                                        photoUrl =
                                            getMeta("app-url") +
                                            "/" +
                                            emp.user_photo;
                                    else
                                        photoUrl =
                                            getMeta("app-url") +
                                            "/file/profile_picture/" +
                                            emp.user_photo;
                                } catch (_) {
                                    photoUrl =
                                        getMeta("app-url") +
                                        "/asset/img/avatar.png";
                                }

                                const divName = getDivision(emp);
                                return `
            <label class="dropdown-item d-flex align-items-center justify-content-between" style="cursor: pointer;">
                <div class="d-flex align-items-center">
                    <img src="${photoUrl}" alt="${
                                    emp.name
                                }" class="rounded-circle me-2" style="width: 30px; height: 30px; object-fit: cover;">
                    <div class="d-flex flex-column">
                        <span>${emp.name}</span>
                        <small class="text-muted" style="font-size:10px;">${
                            divName || ""
                        }</small>
                    </div>
                </div>
                <input type="checkbox" class="contributor-checkbox" data-id="${
                    emp.id
                }" data-name="${emp.name}" ${isChecked ? "checked" : ""}>
            </label>
        `;
                            })
                            .join("");

                        dropdown.innerHTML = html;
                        dropdown.style.display = isDropdownOpen
                            ? "block"
                            : "none";

                        dropdown
                            .querySelectorAll(".contributor-checkbox")
                            .forEach((checkbox) => {
                                checkbox.addEventListener(
                                    "change",
                                    function () {
                                        const id = parseInt(
                                            this.getAttribute("data-id")
                                        );
                                        const name =
                                            this.getAttribute("data-name");
                                        // Use hidden input as source of truth to avoid replaces
                                        let cur = [];
                                        try {
                                            cur = JSON.parse(
                                                (hiddenInput &&
                                                    hiddenInput.value) ||
                                                    "[]"
                                            );
                                            if (!Array.isArray(cur)) cur = [];
                                        } catch (_) {
                                            cur = [];
                                        }

                                        if (this.checked) {
                                            if (!cur.includes(id)) cur.push(id);
                                            // add to selectedMap using employees cache if available
                                            const empObj = employees.find(
                                                (ee) =>
                                                    Number(ee.id) === Number(id)
                                            ) || { id: id, name: name };
                                            selectedMap[String(id)] = {
                                                id: Number(id),
                                                name: empObj.name || name || "",
                                                user_photo:
                                                    empObj.user_photo || null,
                                                division: getDivision(empObj),
                                            };
                                        } else {
                                            cur = cur.filter(
                                                (v) => Number(v) !== Number(id)
                                            );
                                            delete selectedMap[String(id)];
                                        }

                                        // write back hidden input
                                        try {
                                            if (hiddenInput)
                                                hiddenInput.value =
                                                    JSON.stringify(cur);
                                        } catch (_) {}

                                        // rebuild selectedEmployees array from map to keep order stable
                                        selectedEmployees = Object.keys(
                                            selectedMap
                                        ).map(function (k) {
                                            return selectedMap[k];
                                        });

                                        renderSelected();
                                        renderDropdown();
                                        try {
                                            window.syncCoAuthorsWithContributors &&
                                                window.syncCoAuthorsWithContributors();
                                        } catch (_) {}
                                    }
                                );
                            });
                    }

                    function renderSelected() {
                        selectedContainer.innerHTML = "";
                        selectedEmployees.forEach((emp) => {
                            const photoUrl =
                                emp.user_photo ||
                                getMeta("app-url") + "/asset/img/avatar.png";
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

                            const nameWrapper = document.createElement("div");
                            nameWrapper.className = "d-flex flex-column";
                            const nameSpan = document.createElement("span");
                            nameSpan.textContent = emp.name;
                            nameSpan.style.lineHeight = "1";
                            const divSpan = document.createElement("small");
                            divSpan.className = "text-muted";
                            divSpan.style.lineHeight = "1";
                            divSpan.textContent = emp.division || "";
                            nameWrapper.appendChild(nameSpan);
                            nameWrapper.appendChild(divSpan);

                            const removeBtn = document.createElement("button");
                            removeBtn.type = "button";
                            removeBtn.className = "btn-close btn-sm ms-2";
                            removeBtn.setAttribute("aria-label", "Remove");
                            removeBtn.addEventListener("click", () => {
                                // remove from hidden input (source of truth) and from selectedMap
                                try {
                                    let cur = JSON.parse(
                                        (hiddenInput && hiddenInput.value) ||
                                            "[]"
                                    );
                                    if (!Array.isArray(cur)) cur = [];
                                    cur = cur.filter(function (v) {
                                        return Number(v) !== Number(emp.id);
                                    });
                                    if (hiddenInput)
                                        hiddenInput.value = JSON.stringify(cur);
                                    delete selectedMap[String(emp.id)];
                                    selectedEmployees = Object.keys(
                                        selectedMap
                                    ).map(function (k) {
                                        return selectedMap[k];
                                    });
                                } catch (_) {
                                    delete selectedMap[String(emp.id)];
                                    selectedEmployees = Object.keys(
                                        selectedMap
                                    ).map(function (k) {
                                        return selectedMap[k];
                                    });
                                }
                                renderSelected();
                                renderDropdown();
                                try {
                                    window.syncCoAuthorsWithContributors &&
                                        window.syncCoAuthorsWithContributors();
                                } catch (_) {}
                            });

                            badge.appendChild(img);
                            badge.appendChild(nameWrapper);
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
                        if (val === "") filteredEmployees = employees;
                        else
                            filteredEmployees = employees.filter((emp) =>
                                emp.name.toLowerCase().includes(val)
                            );
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
                        if (
                            !input.contains(e.target) &&
                            !dropdown.contains(e.target)
                        ) {
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

                    window.setSelectedContributorsEdit = function (
                        contributors
                    ) {
                        // Merge incoming contributors with existing hidden input (do not replace)
                        let coIds = [];
                        try {
                            const raw =
                                document.getElementById("edit_co_author")
                                    ?.value || "[]";
                            const arr = JSON.parse(raw);
                            coIds = Array.isArray(arr)
                                ? arr.map((v) => Number(v))
                                : [];
                        } catch (_) {
                            coIds = [];
                        }

                        // incoming ids
                        const incoming = Array.isArray(contributors)
                            ? contributors.map((c) => Number(c.id))
                            : [];

                        // existing ids from hidden input
                        let existing = [];
                        try {
                            existing = JSON.parse(
                                document.getElementById("edit_contributors")
                                    ?.value || "[]"
                            );
                            if (!Array.isArray(existing)) existing = [];
                        } catch (_) {
                            existing = [];
                        }

                        // union, then exclude any co-author ids
                        const unionIds = Array.from(
                            new Set([].concat(existing, incoming))
                        ).filter((id) => !coIds.includes(Number(id)));

                        // Build selectedEmployees from unionIds using employees cache when possible
                        try {
                            // populate selectedMap and selectedEmployees
                            selectedMap = {};
                            selectedEmployees = unionIds.map(function (sid) {
                                const emp =
                                    employees.find(function (ee) {
                                        return Number(ee.id) === Number(sid);
                                    }) || {};
                                const foundIncoming =
                                    (contributors || []).find(function (c) {
                                        return Number(c.id) === Number(sid);
                                    }) || {};
                                const obj = {
                                    id: Number(sid),
                                    name: emp.name || foundIncoming.name || "",
                                    user_photo:
                                        emp.user_photo ||
                                        buildAvatarUrl(
                                            foundIncoming.profile_picture ||
                                                foundIncoming.user_photo ||
                                                ""
                                        ),
                                    division:
                                        getDivision(emp) ||
                                        getDivision(foundIncoming) ||
                                        "",
                                };
                                selectedMap[String(obj.id)] = obj;
                                return obj;
                            });
                        } catch (_) {
                            selectedMap = {};
                            selectedEmployees = unionIds.map(function (sid) {
                                var o = {
                                    id: Number(sid),
                                    name: "",
                                    user_photo: null,
                                    division: "",
                                };
                                selectedMap[String(sid)] = o;
                                return o;
                            });
                        }

                        // write back hidden input
                        try {
                            document.getElementById("edit_contributors").value =
                                JSON.stringify(
                                    selectedEmployees.map(function (e) {
                                        return e.id;
                                    })
                                );
                        } catch (_) {}

                        renderSelected();
                        try {
                            window.syncCoAuthorsWithContributors &&
                                window.syncCoAuthorsWithContributors();
                        } catch (_) {}
                    };

                    window.syncContributorsWithCoAuthors = function () {
                        const coAuthorIds = (function () {
                            try {
                                const raw =
                                    document.getElementById("edit_co_author")
                                        ?.value || "[]";
                                const arr = JSON.parse(raw);
                                return Array.isArray(arr)
                                    ? arr.map((v) => Number(v))
                                    : [];
                            } catch (_) {
                                return [];
                            }
                        })();
                        const before = selectedEmployees.length;
                        selectedEmployees = selectedEmployees.filter(
                            (se) => !coAuthorIds.includes(Number(se.id))
                        );
                        if (selectedEmployees.length !== before) {
                            renderSelected();
                            updateHiddenInput();
                        }
                        renderDropdown();
                    };
                }; // end setupContributorInputEdit
        }

        // initialize co-author/contributor dropdowns for edit modal
        try {
            if (typeof window.setupCoAuthorInputEdit === "function")
                window.setupCoAuthorInputEdit();
        } catch (_) {}
        try {
            if (typeof window.setupContributorInputEdit === "function")
                window.setupContributorInputEdit();
        } catch (_) {}

        // Render selected collaborators badges into edit modal (blue with remove button)
        function renderSelectedBadges(containerId, arr, hiddenInputId) {
            try {
                var container = document.getElementById(containerId);
                if (!container) return;
                container.innerHTML = "";
                if (!arr || !arr.length) return;

                // helper to resolve division text
                function getDivisionBadge(item) {
                    try {
                        if (!item) return "";
                        return (
                            item.division ||
                            item.division_name ||
                            item.division_title ||
                            item.employee_division ||
                            (item.employee &&
                                (item.employee.division_name ||
                                    (item.employee.division &&
                                        (item.employee.division.name ||
                                            item.employee.division.title)))) ||
                            ""
                        );
                    } catch (_) {
                        return "";
                    }
                }

                // Ensure hidden input exists and populate if empty
                var hidden = hiddenInputId
                    ? document.getElementById(hiddenInputId)
                    : null;
                if (hidden && (!hidden.value || hidden.value === "")) {
                    try {
                        hidden.value = JSON.stringify(
                            (arr || []).map(function (x) {
                                return x.id;
                            })
                        );
                    } catch (_) {}
                }

                arr.forEach(function (a) {
                    var id = a.id || a.employee_id || a.user_id || null;
                    var span = document.createElement("span");
                    span.className =
                        "badge fw-normal bg-light d-inline-flex align-items-center me-2 mb-2";

                    var img = document.createElement("img");
                    img.src =
                        a.user_photo ||
                        a.profile_picture ||
                        getMeta("app-url").replace(/\/$/, "") +
                            "/asset/img/avatar.png";
                    img.className = "rounded-circle me-2";
                    img.style.width = "24px";
                    img.style.height = "24px";
                    img.style.objectFit = "cover";

                    var nameWrapper = document.createElement("div");
                    nameWrapper.className = "d-flex flex-column text-start";
                    var nameSpan = document.createElement("span");
                    nameSpan.textContent =
                        a.name || a.employee_name || a.username || "-";
                    nameSpan.style.lineHeight = "1";
                    var divSpan = document.createElement("small");
                    divSpan.className = "text-muted";
                    divSpan.style.lineHeight = "1";
                    try {
                        divSpan.textContent = getDivisionBadge(a) || "";
                    } catch (_) {
                        divSpan.textContent =
                            a.division || a.division_name || "";
                    }
                    nameWrapper.appendChild(nameSpan);
                    nameWrapper.appendChild(divSpan);

                    var removeBtn = document.createElement("button");
                    removeBtn.type = "button";
                    removeBtn.className = "btn-close btn-sm ms-2";
                    removeBtn.setAttribute("aria-label", "Remove");
                    removeBtn.addEventListener("click", function () {
                        try {
                            // remove from DOM
                            if (span && span.parentNode)
                                span.parentNode.removeChild(span);
                            // update hidden input JSON by removing this id
                            if (hidden) {
                                try {
                                    var cur = JSON.parse(hidden.value || "[]");
                                    if (Array.isArray(cur)) {
                                        cur = cur.filter(function (v) {
                                            return String(v) !== String(id);
                                        });
                                        hidden.value = JSON.stringify(cur);
                                    }
                                } catch (_) {}
                            }
                        } catch (e) {}
                    });

                    span.appendChild(img);
                    span.appendChild(nameWrapper);
                    span.appendChild(removeBtn);
                    container.appendChild(span);
                });
            } catch (e) {}
        }

        // Intercept edit link clicks created by createActionButtons
        $(document)
            .off("click", ".detail-icon a, .detail-icon")
            .on("click", ".detail-icon a, .detail-icon", function (e) {
                var $el = $(e.target).closest("a");
                if (!$el || !$el.attr("href")) return;
                var href = $el.attr("href");
                if (!/\/project\/\d+\/edit$/.test(href)) return;
                e.preventDefault();
                var m = href.match(/\/project\/(\d+)\/edit$/);
                if (!m) return;
                var projectId = m[1];
                $.ajax({
                    url:
                        getMeta("app-url").replace(/\/$/, "") +
                        "/project/" +
                        projectId +
                        "/edit",
                    type: "GET",
                    dataType: "json",
                    success: function (data) {
                        try {
                            $("#edit_project_id").val(data.id);
                            $("#edit_title").val(data.title || "");
                            $("#edit_description").val(data.description || "");
                            $("#edit_start_date").val(data.start_date || "");
                            $("#edit_due_date").val(data.due_date || "");

                            try {
                                var container = document.getElementById(
                                    "edit_project_reference_urls_container"
                                );
                                container.innerHTML = "";
                                var urls = [];
                                if (Array.isArray(data.reference_urls))
                                    urls = data.reference_urls;
                                else if (
                                    typeof data.reference_urls === "string"
                                ) {
                                    try {
                                        var parsed = JSON.parse(
                                            data.reference_urls
                                        );
                                        if (Array.isArray(parsed))
                                            urls = parsed;
                                    } catch (_) {}
                                }
                                if (
                                    (!urls || !urls.length) &&
                                    data.reference_url
                                )
                                    urls = [data.reference_url];
                                function makeRow(value, withAdd) {
                                    var row = document.createElement("div");
                                    row.className = "input-group mb-2";
                                    row.innerHTML =
                                        '<input type="url" class="form-control input-text" name="reference_urls[]" placeholder="https://example.com">' +
                                        (withAdd
                                            ? ' <button type="button" class="btn btn-submit-black add-ref-url" aria-label="Add URL"><span class="material-symbols-outlined">add</span></button>'
                                            : ' <button type="button" class="border-0 bg-transparent p-1 remove-ref-url" aria-label="Remove URL"><span class="material-symbols-outlined" style="color:#444444;">close</span></button>');
                                    container.appendChild(row);
                                    var inp =
                                        row.querySelector('input[type="url"]');
                                    if (inp && value) inp.value = value;
                                }
                                if (urls && urls.length) {
                                    urls.forEach(function (u) {
                                        makeRow(u, false);
                                    });
                                    makeRow("", true);
                                } else {
                                    makeRow("", true);
                                }
                            } catch (e) {}

                            populatePartOfProjectSelects(
                                data.id,
                                data.title || "",
                                data.part_of_project || ""
                            );

                            try {
                                var presetDeptEl =
                                    document.getElementById("edit_department");
                                var presetDeptVal = presetDeptEl
                                    ? (presetDeptEl.value || "")
                                          .toString()
                                          .trim()
                                    : "";
                                if (presetDeptVal) {
                                    loadDivisions(
                                        presetDeptVal,
                                        function () {
                                            try {
                                                $("#edit_division").val(
                                                    data.division_id
                                                );
                                            } catch (_) {}
                                        },
                                        document.getElementById("edit_division")
                                    );
                                } else {
                                    loadDepartments(function () {
                                        try {
                                            $("#edit_department")
                                                .val(data.department_id)
                                                .trigger("change");
                                        } catch (_) {}
                                        loadDivisions(
                                            data.department_id,
                                            function () {
                                                try {
                                                    $("#edit_division").val(
                                                        data.division_id
                                                    );
                                                } catch (_) {}
                                            },
                                            document.getElementById(
                                                "edit_division"
                                            )
                                        );
                                    }, document.getElementById(
                                        "edit_department"
                                    ));
                                }
                            } catch (e) {
                                try {
                                    loadDivisions(
                                        data.department_id,
                                        function () {
                                            try {
                                                $("#edit_division").val(
                                                    data.division_id
                                                );
                                            } catch (_) {}
                                        },
                                        document.getElementById("edit_division")
                                    );
                                } catch (_) {}
                            }

                            if (data.image) {
                                var url =
                                    getMeta("app-url").replace(/\/$/, "") +
                                    "/file/project/" +
                                    data.image.replace(/^\//, "");
                                var label =
                                    document.getElementById("editImageLabel");
                                if (label) {
                                    label.style.backgroundImage =
                                        "url(" + url + ")";
                                    label.classList.add("has-image");
                                    label.style.backgroundSize = "cover";
                                    label.style.opacity = "1";
                                    document
                                        .getElementById("editImageClearBtn")
                                        ?.classList.remove("d-none");
                                }
                            } else {
                                var lbl =
                                    document.getElementById("editImageLabel");
                                if (lbl) {
                                    lbl.style.backgroundImage =
                                        "url('" +
                                        getMeta("app-url").replace(/\/$/, "") +
                                        "/asset/img/background/add-image.png')";
                                    lbl.classList.remove("has-image");
                                    lbl.style.opacity = "0.5";
                                    document
                                        .getElementById("editImageClearBtn")
                                        ?.classList.add("d-none");
                                }
                            }

                            var existingFiles = Array.isArray(
                                data.reference_files
                            )
                                ? data.reference_files.slice()
                                : data.reference_file
                                ? Array.isArray(data.reference_file)
                                    ? data.reference_file.slice()
                                    : [data.reference_file]
                                : [];
                            try {
                                document.getElementById(
                                    "existing_reference_files_input"
                                ).value = JSON.stringify(existingFiles);
                            } catch (_) {}
                            try {
                                var existingContainer = document.getElementById(
                                    "existing_reference_files"
                                );
                                if (existingContainer) {
                                    existingContainer.innerHTML = "";
                                    if (existingFiles.length > 0) {
                                        // var title = document.createElement('div');
                                        // title.className = 'fw-bold mb-2';
                                        // title.textContent = 'Current Files:';
                                        // existingContainer.appendChild(title);

                                        var list =
                                            document.createElement("div");
                                        list.className =
                                            "existing-files-list w-100";

                                        existingFiwles.forEach(function (fn) {
                                            var item =
                                                document.createElement("div");
                                            item.className =
                                                "existing-file-item d-flex align-items-center justify-content-between mb-2 p-2 bg-light border-0 rounded";

                                            var info =
                                                document.createElement("div");
                                            info.className =
                                                "d-flex align-items-center flex-grow-1";

                                            var ext = fn
                                                .split(".")
                                                .pop()
                                                .toLowerCase();
                                            var isImage = [
                                                "jpg",
                                                "jpeg",
                                                "png",
                                                "gif",
                                                "webp",
                                                "bmp",
                                            ].includes(ext);

                                            if (isImage) {
                                                var img =
                                                    document.createElement(
                                                        "img"
                                                    );
                                                img.src =
                                                    getMeta("app-url").replace(
                                                        /\/$/,
                                                        ""
                                                    ) +
                                                    "/file/project/" +
                                                    fn;
                                                img.alt = fn;
                                                img.style.maxWidth = "28px";
                                                img.style.maxHeight = "28px";
                                                img.className =
                                                    "me-2 rounded border";
                                                info.appendChild(img);
                                            }

                                            var link =
                                                document.createElement("a");
                                            link.href =
                                                getMeta("app-url").replace(
                                                    /\/$/,
                                                    ""
                                                ) +
                                                "/file/project/" +
                                                fn;
                                            link.textContent = fn;
                                            link.target = "_blank";
                                            link.className =
                                                "text-decoration-none";
                                            link.style.color = "#444444";
                                            info.appendChild(link);

                                            var removeBtn =
                                                document.createElement(
                                                    "button"
                                                );
                                            removeBtn.type = "button";
                                            removeBtn.className =
                                                "border-0 bg-transparent p-1";
                                            removeBtn.innerHTML =
                                                '<span class="material-symbols-outlined" style="color:#444444;">close</span>';
                                            removeBtn.addEventListener(
                                                "click",
                                                function () {
                                                    existingFiles =
                                                        existingFiles.filter(
                                                            function (f) {
                                                                return f !== fn;
                                                            }
                                                        );
                                                    try {
                                                        document.getElementById(
                                                            "existing_reference_files_input"
                                                        ).value =
                                                            JSON.stringify(
                                                                existingFiles
                                                            );
                                                    } catch (_) {}
                                                    item.remove();
                                                }
                                            );

                                            item.appendChild(info);
                                            item.appendChild(removeBtn);
                                            list.appendChild(item);
                                        });

                                        existingContainer.appendChild(list);
                                    }
                                }
                            } catch (_) {}

                            try {
                                $("#edit_reference_file").val("");
                            } catch (_) {}

                            try {
                                function normalizePerson(item) {
                                    if (!item) return item;
                                    try {
                                        item.name =
                                            item.name ||
                                            item.employee_name ||
                                            item.username ||
                                            item.full_name ||
                                            (item.employee &&
                                                (item.employee.name ||
                                                    item.employee.full_name)) ||
                                            "-";
                                        item.user_photo =
                                            item.user_photo ||
                                            item.profile_picture ||
                                            item.profile_picture_url ||
                                            item.user_photo_url ||
                                            item.user_photo_path ||
                                            null;
                                        var div = "";
                                        try {
                                            if (item.division) {
                                                if (
                                                    typeof item.division ===
                                                    "string"
                                                )
                                                    div = item.division;
                                                else if (
                                                    typeof item.division ===
                                                    "object"
                                                )
                                                    div =
                                                        item.division.name ||
                                                        item.division.title ||
                                                        "";
                                            }
                                            if (!div && item.division_name)
                                                div = item.division_name;
                                            if (!div && item.division_title)
                                                div = item.division_title;
                                            if (!div && item.employee_division)
                                                div = item.employee_division;
                                            if (!div && item.employee) {
                                                if (item.employee.division_name)
                                                    div =
                                                        item.employee
                                                            .division_name;
                                                else if (
                                                    item.employee.division
                                                ) {
                                                    if (
                                                        typeof item.employee
                                                            .division ===
                                                        "string"
                                                    )
                                                        div =
                                                            item.employee
                                                                .division;
                                                    else if (
                                                        typeof item.employee
                                                            .division ===
                                                        "object"
                                                    )
                                                        div =
                                                            item.employee
                                                                .division
                                                                .name ||
                                                            item.employee
                                                                .division
                                                                .title ||
                                                            "";
                                                }
                                            }
                                        } catch (_) {
                                            div = "";
                                        }
                                        item.division = div || "";
                                    } catch (_) {}
                                    return item;
                                }

                                var co = (
                                    Array.isArray(data.co_authors)
                                        ? data.co_authors
                                        : []
                                ).map(normalizePerson);
                                var cont = (
                                    Array.isArray(data.contributors)
                                        ? data.contributors
                                        : Array.isArray(data.executors)
                                        ? data.executors
                                        : []
                                ).map(normalizePerson);

                                try {
                                    $("#edit_co_author").val(
                                        JSON.stringify(
                                            (co.map &&
                                                co.map(function (c) {
                                                    return c.id;
                                                })) ||
                                                []
                                        )
                                    );
                                } catch (_) {}
                                try {
                                    $("#edit_contributors").val(
                                        JSON.stringify(
                                            (cont.map &&
                                                cont.map(function (c) {
                                                    return c.id;
                                                })) ||
                                                []
                                        )
                                    );
                                } catch (_) {}

                                renderSelectedBadges(
                                    "edit_selected_co_authors",
                                    co,
                                    "edit_co_author"
                                );
                                renderSelectedBadges(
                                    "edit_selected_contributors",
                                    cont,
                                    "edit_contributors"
                                );

                                try {
                                    if (window.setSelectedCoAuthorsEdit)
                                        window.setSelectedCoAuthorsEdit(
                                            co || []
                                        );
                                } catch (_) {}
                                try {
                                    if (window.setSelectedContributorsEdit)
                                        window.setSelectedContributorsEdit(
                                            cont || []
                                        );
                                } catch (_) {}
                            } catch (_) {}

                            var modalEl =
                                document.getElementById("editProjectModal");
                            if (modalEl) {
                                var m =
                                    bootstrap &&
                                    bootstrap.Modal &&
                                    bootstrap.Modal.getOrCreateInstance
                                        ? bootstrap.Modal.getOrCreateInstance(
                                              modalEl
                                          )
                                        : new bootstrap.Modal(modalEl);
                                m.show();
                            }
                        } catch (e) {
                            console.error("Failed to populate edit modal", e);
                        }
                    },
                    error: function (xhr) {
                        if (typeof window.showFloatingAlert === "function")
                            window.showFloatingAlert(
                                "Gagal mengambil data untuk edit",
                                "warning",
                                3500
                            );
                        else alert("Gagal mengambil data untuk edit");
                    },
                });
            });

        document.addEventListener("change", function (e) {
            if (e.target && e.target.id === "edit_reference_file") {
                const previewContainer = document.getElementById(
                    "edit_reference_files_preview"
                );
                const oldFiles = Array.from(e.target.files);
                const newFiles = Array.from(e.target._newFiles || []);
                const allFiles = [...newFiles, ...oldFiles];
                e.target._newFiles = allFiles;

                previewContainer.innerHTML = "";
                allFiles.forEach((file) => {
                    const item = document.createElement("div");
                    item.className =
                        "preview-file-item d-flex align-items-center justify-content-between mb-2 p-2 bg-light border-0 rounded";

                    const info = document.createElement("div");
                    info.className = "d-flex align-items-center flex-grow-1";

                    if (file.type.startsWith("image/")) {
                        const img = document.createElement("img");
                        img.src = URL.createObjectURL(file);
                        img.alt = file.name;
                        img.style.maxWidth = "28px";
                        img.style.maxHeight = "28px";
                        img.className = "me-2 rounded border";
                        info.appendChild(img);
                        const text = document.createElement("span");
                        text.textContent = file.name;
                        info.appendChild(text);
                    } else {
                        const text = document.createElement("span");
                        text.textContent = file.name;
                        info.appendChild(text);
                    }

                    const removeBtn = document.createElement("button");
                    removeBtn.type = "button";
                    removeBtn.className = "border-0 bg-transparent";
                    removeBtn.innerHTML =
                        '<span class="material-symbols-outlined" style="color:#444444;">close</span>';
                    removeBtn.addEventListener("click", function () {
                        item.remove();
                        e.target._newFiles = e.target._newFiles.filter(
                            (f) => f !== file
                        );
                        const dt = new DataTransfer();
                        e.target._newFiles.forEach((f) => dt.items.add(f));
                        e.target.files = dt.files;
                    });

                    item.appendChild(info);
                    item.appendChild(removeBtn);
                    previewContainer.appendChild(item);
                });

                const dt = new DataTransfer();
                allFiles.forEach((f) => dt.items.add(f));
                e.target.files = dt.files;
            }
        });

        // Handle edit project form submission
        var isSubmitting = false;
        $(document)
            .off("submit", "#editProjectForm")
            .on("submit", "#editProjectForm", function (e) {
                e.preventDefault();
                if (isSubmitting) return;
                isSubmitting = true;
                var projectId = $("#edit_project_id").val();
                if (!projectId) {
                    if (typeof window.showFloatingAlert === "function")
                        window.showFloatingAlert(
                            "Project ID tidak ditemukan",
                            "warning",
                            3500
                        );
                    else alert("Project ID tidak ditemukan");
                    isSubmitting = false;
                    return;
                }
                var formEl = this;
                var formData = new FormData(formEl);
                // map reference_urls[] to single reference_url
                try {
                    var urlInputs = formEl.querySelectorAll(
                        'input[name="reference_urls[]"]'
                    );
                    var urls = Array.from(urlInputs)
                        .map(function (i) {
                            return (i.value || "").trim();
                        })
                        .filter(Boolean);
                    if (urls.length) formData.set("reference_url", urls[0]);
                    else formData.set("reference_url", "");
                } catch (_) {}
                formData.append("_method", "PUT");
                // attach newly selected files
                try {
                    var newFiles =
                        document.getElementById("edit_reference_file").files ||
                        [];
                    formData.delete("reference_file[]");
                    Array.from(newFiles).forEach(function (f) {
                        formData.append("reference_file[]", f);
                    });
                } catch (_) {}

                $("#editModalLoader").removeClass("d-none");
                var submitBtn = $('#editProjectForm button[type="submit"]');
                submitBtn.prop("disabled", true);

                $.ajax({
                    url:
                        getMeta("app-url").replace(/\/$/, "") +
                        "/project/" +
                        projectId,
                    type: "POST",
                    data: formData,
                    contentType: false,
                    processData: false,
                    success: function (res) {
                        try {
                            if (
                                res &&
                                (res.status === "success" || res.message)
                            ) {
                                var msg =
                                    res.message ||
                                    "Project updated successfully!";
                                if (typeof showFloatingAlert === "function")
                                    showFloatingAlert(msg, "success", 1500);
                                else alert(msg);
                            }
                        } catch (_) {}
                        // hide modal and refresh project detail
                        setTimeout(function () {
                            try {
                                var me = bootstrap.Modal.getInstance(
                                    document.getElementById("editProjectModal")
                                );
                                if (me) me.hide();
                            } catch (_) {}
                            fetchProject(getMeta("project-id"));
                        }, 700);
                    },
                    error: function (xhr) {
                        if (xhr.status === 422) {
                            try {
                                var errors = xhr.responseJSON.errors || {};
                                var listHtml = "";
                                Object.keys(errors).forEach(function (k) {
                                    var v = errors[k];
                                    if (Array.isArray(v))
                                        v.forEach(function (m) {
                                            listHtml += "\n- " + m;
                                        });
                                    else listHtml += "\n- " + v;
                                });
                                if (typeof showFloatingAlert === "function")
                                    showFloatingAlert(
                                        listHtml,
                                        "warning",
                                        5000
                                    );
                                else if (
                                    typeof window.showFloatingAlert ===
                                    "function"
                                )
                                    window.showFloatingAlert(
                                        listHtml,
                                        "warning",
                                        5000
                                    );
                                else alert(listHtml);
                            } catch (e) {
                                if (
                                    typeof window.showFloatingAlert ===
                                    "function"
                                )
                                    window.showFloatingAlert(
                                        "Validation failed",
                                        "warning",
                                        3500
                                    );
                                else alert("Validation failed");
                            }
                        } else {
                            if (typeof window.showFloatingAlert === "function")
                                window.showFloatingAlert(
                                    "Failed to update project",
                                    "warning",
                                    3500
                                );
                            else alert("Failed to update project");
                        }
                    },
                    complete: function () {
                        $("#editModalLoader").addClass("d-none");
                        submitBtn.prop("disabled", false);
                        isSubmitting = false;
                    },
                });
            });
    }); // end $(function)
})(jQuery);

function initAddProjectReferenceFilesModal() {
    const openBtn = document.getElementById("openAddProjectReferenceFilesBtn");
    const refModalEl = document.getElementById("addProjectReferenceFilesModal");
    const refModal = refModalEl ? new bootstrap.Modal(refModalEl) : null;
    const refForm = document.getElementById("addProjectReferenceFilesForm");
    const fileInput = document.getElementById("add_project_reference_files");
    const preview = document.getElementById(
        "add_project_reference_files_preview"
    );
    const submitBtn = document.getElementById("submitAddProjectReferenceFiles");

    if (
        !openBtn ||
        !refModalEl ||
        !refForm ||
        !fileInput ||
        !preview ||
        !submitBtn
    )
        return;

    openBtn.addEventListener("click", function (e) {
        try {
            const parentModalEl = document.getElementById("projectFilesModal");
            if (parentModalEl) {
                const cm =
                    bootstrap.Modal.getInstance(parentModalEl) ||
                    new bootstrap.Modal(parentModalEl);
                cm.hide();
            }
        } catch (_) {}

        // try to obtain project id from dataset on projectFilesModal or list container
        const projectId =
            document.getElementById("projectFilesModal")?.dataset?.projectId ||
            document.getElementById("projectReferenceFilesList")?.dataset
                ?.projectId ||
            this.dataset?.projectId ||
            "";
        if (!projectId) {
            try {
                showFloatingAlert &&
                    showFloatingAlert(
                        "Project ID not found. Cannot add files.",
                        "danger"
                    );
            } catch (_) {}
            return;
        }
        const hidden = document.getElementById("addRefProjectId");
        if (hidden) hidden.value = projectId || "";
        // reset previous selection
        fileInput.value = "";
        preview.innerHTML = "";
        window.addProjectRefSelectedFiles = [];
        refModal.show();
    });

    fileInput.addEventListener("change", function () {
        const files = Array.from(this.files || []);
        window.addProjectRefSelectedFiles =
            window.addProjectRefSelectedFiles || [];
        window.addProjectRefSelectedFiles =
            window.addProjectRefSelectedFiles.concat(files);
        renderAddProjectRefSelectedFiles();
        this.value = "";
    });

    function renderAddProjectRefSelectedFiles() {
        preview.innerHTML = "";
        const list = document.createElement("div");
        list.className = "selected-files-list mt-2";
        (window.addProjectRefSelectedFiles || []).forEach((file, idx) => {
            const item = document.createElement("div");
            item.className =
                "d-flex align-items-center gap-2 p-2 rounded bg-light selected-task mb-2";

            if (file && file.type && file.type.indexOf("image") === 0) {
                const img = document.createElement("img");
                const url = URL.createObjectURL(file);
                img.src = url;
                img.width = 28;
                img.height = 28;
                img.style.objectFit = "cover";
                img.style.borderRadius = "50%";
                img.alt = file.name;
                img.onload = function () {
                    try {
                        URL.revokeObjectURL(url);
                    } catch (_) {}
                };
                item.appendChild(img);
            } else {
                const badge = document.createElement("div");
                item.appendChild(badge);
            }

            const title = document.createElement("span");
            title.className = "flex-grow-1";
            title.textContent = file.name;
            item.appendChild(title);

            const removeBtn = document.createElement("button");
            removeBtn.type = "button";
            removeBtn.className = "btn btn-sm btn-remove-task remove-task";
            removeBtn.style.lineHeight = "1";
            removeBtn.innerHTML =
                '<span class="material-symbols-outlined">close</span>';
            removeBtn.addEventListener("click", function () {
                window.addProjectRefSelectedFiles.splice(idx, 1);
                renderAddProjectRefSelectedFiles();
            });
            item.appendChild(removeBtn);

            list.appendChild(item);
        });

        preview.appendChild(list);
    }

    submitBtn.addEventListener("click", function (e) {
        e.preventDefault();
        const projectId = document.getElementById("addRefProjectId")?.value;
        if (!projectId) {
            showFloatingAlert &&
                showFloatingAlert("Project ID not found.", "danger");
            return;
        }

        const files = window.addProjectRefSelectedFiles || [];
        if (!files.length) {
            showFloatingAlert &&
                showFloatingAlert(
                    "Please select at least one file to upload.",
                    "warning"
                );
            return;
        }

        const fd = new FormData();
        files.forEach((f) => fd.append("reference_files[]", f));

        submitBtn.disabled = true;
        submitBtn.innerHTML =
            '<span class="spinner-border spinner-border-sm"></span>';

        fetch(
            appUrl +
                "/project/" +
                encodeURIComponent(projectId) +
                "/reference-file",
            {
                method: "POST",
                headers: {
                    "X-CSRF-TOKEN": document
                        .querySelector('meta[name="csrf-token"]')
                        .getAttribute("content"),
                },
                body: fd,
            }
        )
            .then((res) =>
                res.ok ? res.json() : res.json().then(Promise.reject)
            )
            .then((payload) => {
                showFloatingAlert &&
                    showFloatingAlert(
                        payload.message || "Files uploaded",
                        "success",
                        2000
                    );
                refModal.hide();
                window.addProjectRefSelectedFiles = [];
                renderAddProjectRefSelectedFiles();

                // Update project file count badges immediately and robustly
                try {
                    var count = 0;
                    if (Array.isArray(payload.reference_files)) {
                        count = payload.reference_files.length;
                    } else if (typeof payload.reference_files === "number") {
                        count = payload.reference_files;
                    } else {
                        // fallback: use uploaded files length if server didn't return the list
                        try {
                            count =
                                window.addProjectRefSelectedFiles &&
                                Array.isArray(window.addProjectRefSelectedFiles)
                                    ? window.addProjectRefSelectedFiles.length
                                    : 0;
                        } catch (_) {
                            count = 0;
                        }
                    }

                    // Update every .project-file-count that matches this projectId
                    document
                        .querySelectorAll(
                            '.project-file-count[data-project-id="' +
                                projectId +
                                '"]'
                        )
                        .forEach(function (el) {
                            try {
                                el.textContent = String(count || 0);
                                el.style.display = count > 0 ? "" : "none";
                            } catch (_) {}
                        });

                    // Also handle any attach button that may contain a badge without data attribute
                    document
                        .querySelectorAll(
                            '.project-attach-file[data-project-id="' +
                                projectId +
                                '"]'
                        )
                        .forEach(function (btn) {
                            try {
                                var inner = btn.querySelector(
                                    ".project-file-count"
                                );
                                if (inner) {
                                    inner.textContent = String(count || 0);
                                    inner.style.display =
                                        count > 0 ? "" : "none";
                                }
                            } catch (_) {}
                        });
                } catch (_) {}

                // Reopen project files modal to show the refreshed list
                try {
                    setTimeout(function () {
                        window.showProjectFiles &&
                            window.showProjectFiles(projectId);
                    }, 220);
                } catch (_) {}
            })
            .catch((err) => {
                console.error("Upload failed", err);
                try {
                    const msg =
                        (err &&
                            (err.message ||
                                err.error ||
                                (err.errors && err.errors[0]))) ||
                        "Upload failed";
                    showFloatingAlert && showFloatingAlert(msg, "danger");
                } catch (_) {}
            })
            .finally(() => {
                submitBtn.disabled = false;
                submitBtn.innerHTML = "Upload";
            });
    });
}
