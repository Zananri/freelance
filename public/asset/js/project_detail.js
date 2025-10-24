(function ($) {
    "use strict";

    // Add export project report click handler
    $(document).on('click', '#exportProjectReportBtn', function (e) {
        try {
            e.preventDefault();
        } catch (_) {}
        try {
            var pid = $(this).data('project-id') || $('meta[name="project-id"]').attr('content') || '';
            if (!pid) return;
            var base = (document.querySelector('meta[name="app-url"]')?.getAttribute('content') || '').replace(/\/$/, '');
            var url = base + '/project/' + encodeURIComponent(pid) + '/export-excel';
            // start file download in a new window to avoid blocking
            window.location.href = url;
        } catch (err) {
            try { console.error('Export project report failed', err); } catch (_) {}
        }
    });

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
                    var imgInp = document.getElementById(
                        "inline_feedback_image_input"
                    );
                    if (imgInp) imgInp.value = "";
                    var filesInp = document.getElementById(
                        "inline_feedback_files_input"
                    );
                    if (filesInp) filesInp.value = "";
                    // clear image preview
                    window.__inlineFeedbackImageFile = null;
                    var previewContainer = document.getElementById(
                        "inline_feedback_image_preview"
                    );
                    if (previewContainer && previewContainer.parentNode) {
                        previewContainer.parentNode.removeChild(
                            previewContainer
                        );
                    }
                } catch (_) {}
                try {
                    // clear selected files array and remove preview node(s)
                    window.inlineFeedbackSelectedFiles = [];
                    if (typeof renderInlineFilesPreview === "function")
                        renderInlineFilesPreview();
                    var pNode = document.getElementById(
                        "inline_feedback_files_preview"
                    );
                    if (pNode && pNode.parentNode)
                        pNode.parentNode.removeChild(pNode);
                    // also clear any template preview if present
                    var alt = document.getElementById(
                        "add_project_reference_files_preview"
                    );
                    if (alt) alt.innerHTML = "";
                } catch (_) {}
                try {
                    // clear hidden textarea fallback
                    var tx = document.getElementById("inline_feedback_comment");
                    if (tx) tx.value = "";
                } catch (_) {}
                try {
                    // clear Quill editor content and selection safely
                    if (
                        window.__quillProjectFeedbackInline &&
                        window.__quillProjectFeedbackInline.root
                    ) {
                        try {
                            window.__quillProjectFeedbackInline.root.innerHTML =
                                "";
                            window.__quillProjectFeedbackInline.setSelection &&
                                window.__quillProjectFeedbackInline.setSelection(
                                    0
                                );
                        } catch (_) {}
                    }
                } catch (_) {}
                try {
                    // force re-init of Quill instance (if needed)
                    window.__quillProjectFeedbackInline = null;
                    initInlineFeedback && initInlineFeedback();
                } catch (_) {}
            }
        } catch (e) {
            /* no-op */
        }
                // DEBUG: mark when our handler runs (helps detect cached/other handlers)
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
            if (!raw)
                return (
                    getMeta("app-url").replace(/\/$/, "") +
                    "/asset/img/avatar.png"
                );
            var s = String(raw || "");
            if (s.indexOf("http://") === 0 || s.indexOf("https://") === 0)
                return s;
            if (s.indexOf("/") === 0)
                return getMeta("app-url").replace(/\/$/, "") + s;
            // assume stored filename
            return (
                getMeta("app-url").replace(/\/$/, "") +
                "/file/profile_picture/" +
                s
            );
        } catch (e) {
            return (
                getMeta("app-url").replace(/\/$/, "") + "/asset/img/avatar.png"
            );
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
            var allowed = [
                "p",
                "br",
                "strong",
                "em",
                "b",
                "i",
                "ul",
                "ol",
                "li",
                "a",
            ];
            // Decode HTML entities first (handle cases where server stored escaped HTML like &lt;p&gt;)
            var decoder = document.createElement("textarea");
            decoder.innerHTML = String(input);
            var decoded = decoder.value || decoder.textContent || String(input);
            // Create a template element to parse HTML
            var template = document.createElement("template");
            template.innerHTML = decoded;
            var walker = document.createTreeWalker(
                template.content,
                NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
                null,
                false
            );
            var node;
            var removeStack = [];
            while ((node = walker.nextNode())) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    var tag = node.tagName.toLowerCase();
                    if (allowed.indexOf(tag) === -1) {
                        // replace disallowed element with its text content
                        var txt = document.createTextNode(
                            node.textContent || ""
                        );
                        node.parentNode.replaceChild(txt, node);
                        // reposition walker safely by starting over
                        walker = document.createTreeWalker(
                            template.content,
                            NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
                            null,
                            false
                        );
                    } else {
                        // sanitize attributes: only allow href on <a>
                        if (tag === "a") {
                            var href = node.getAttribute("href") || "";
                            if (
                                !href ||
                                (!href.match(/^https?:\/\//) &&
                                    href.indexOf("/") !== 0 &&
                                    href.indexOf("#") !== 0)
                            ) {
                                node.removeAttribute("href");
                            }
                        } else {
                            // remove all attributes on allowed tags except href on a
                            var attrs = Array.from(node.attributes || []);
                            attrs.forEach(function (a) {
                                if (a.name !== "href")
                                    node.removeAttribute(a.name);
                            });
                        }
                    }
                }
            }
            return template.innerHTML;
        } catch (e) {
            return String(input).replace(/</g, "&lt;").replace(/>/g, "&gt;");
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
            html += '<div class="text-start mb-2">';
            html += '<div class="task-description-container">';

            try {
                var employee = opts.feedbackData?.employee || {};
                var comment = sanitizeHtml(opts.feedbackData?.feedback_comment || "");
                var createdAt = opts.feedbackData?.created_at || "";
                var imgSrc = sanitizeHtml(employee.profile_picture || "default-avatar.png");
                var name = sanitizeHtml(employee.name || "Unknown User");
                var dateText = createdAt ? timeAgo(createdAt) : "";

                var topImageUrl = opts.feedbackData?.image || "";
                try {
                    if (topImageUrl) {
                        var isAbs = typeof topImageUrl === "string" && (topImageUrl.indexOf("http://") === 0 || topImageUrl.indexOf("https://") === 0);
                        var isFilePath = typeof topImageUrl === "string" && (topImageUrl.indexOf("/file/") === 0 || topImageUrl.indexOf("file/") === 0);
                        var isStorage = typeof topImageUrl === "string" && (topImageUrl.indexOf("/storage/") === 0 || topImageUrl.indexOf("storage/") === 0);
                        if (!isAbs && !isFilePath && !isStorage) {
                            topImageUrl = getMeta("app-url").replace(/\/$/, "") + "/file/project_feedback/" + topImageUrl;
                        } else if (!isAbs && (isFilePath || isStorage)) {
                            topImageUrl = topImageUrl.indexOf("/") === 0 ? getMeta("app-url").replace(/\/$/, "") + topImageUrl : getMeta("app-url").replace(/\/$/, "") + "/" + topImageUrl;
                        }
                    }
                } catch (e) {
                    topImageUrl = opts.feedbackData?.image || "";
                }

                var topRefFiles = [];
                try {
                    var topRfVal = opts.feedbackData?.reference_files;
                    if (!Array.isArray(topRfVal) && typeof topRfVal === "string") {
                        try {
                            var parsed = JSON.parse(topRfVal);
                            if (Array.isArray(parsed)) topRfVal = parsed;
                        } catch (_) {}
                    }
                    if (Array.isArray(topRfVal) && topRfVal.length > 0) {
                        topRefFiles = topRfVal.map(function (f) {
                            if (!f) return null;
                            var isAbs = typeof f === "string" && (f.indexOf("http://") === 0 || f.indexOf("https://") === 0);
                            var isRefPath = typeof f === "string" && (f.indexOf("/file/project_reference_files/") === 0 || f.indexOf("file/project_reference_files/") === 0 || f.indexOf("/file/") === 0);
                            if (!isAbs && !isRefPath) return getMeta("app-url").replace(/\/$/, "") + "/file/project_reference_files/" + f;
                            if (!isAbs && isRefPath) return f.indexOf("/") === 0 ? getMeta("app-url").replace(/\/$/, "") + f : getMeta("app-url").replace(/\/$/, "") + "/" + f;
                            return f;
                        }).filter(Boolean);
                    } else {
                        var singleTop = opts.feedbackData?.reference_file || "";
                        if (singleTop) {
                            var isAbs2 = typeof singleTop === "string" && (singleTop.indexOf("http://") === 0 || singleTop.indexOf("https://") === 0);
                            var isRefPath2 = typeof singleTop === "string" && (singleTop.indexOf("/file/project_reference_files/") === 0 || singleTop.indexOf("file/project_reference_files/") === 0 || singleTop.indexOf("/file/") === 0);
                            if (!isAbs2 && !isRefPath2) singleTop = getMeta("app-url").replace(/\/$/, "") + "/file/project_reference_files/" + singleTop;
                            else if (!isAbs2 && isRefPath2) singleTop = singleTop.indexOf("/") === 0 ? getMeta("app-url").replace(/\/$/, "") + singleTop : getMeta("app-url").replace(/\/$/, "") + "/" + singleTop;
                            topRefFiles = [singleTop];
                        }
                    }
                } catch (_) {
                    topRefFiles = [];
                }

                var topRefUrls = [];
                try {
                    var topRuVal = opts.feedbackData?.reference_urls;
                    if (!Array.isArray(topRuVal) && typeof topRuVal === "string") {
                        try {
                            var parsed2 = JSON.parse(topRuVal);
                            if (Array.isArray(parsed2)) topRuVal = parsed2;
                        } catch (_) {}
                    }
                    if (Array.isArray(topRuVal) && topRuVal.length > 0) {
                        topRefUrls = topRuVal.filter(function (u) {
                            return typeof u === "string" && u.trim() !== "";
                        });
                    } else if (opts.feedbackData?.reference_url) {
                        topRefUrls = [opts.feedbackData.reference_url];
                    }
                } catch (_) {
                    topRefUrls = [];
                }

                html += `
                    <div class="d-flex align-items-start mb-2 feedback-preview">
                        <img src="${imgSrc}"
                            alt="${name}"
                            class="rounded-circle me-3"
                            style="width:40px; height:40px; object-fit:cover;">

                        <div class="flex-grow-1">
                            <p class="mb-0 fw-normal">${name}</p>
                            <p class="mb-2 text-muted" style="font-size: 10px;">${dateText}</p>
                            <div class="text-muted comment-content" style="font-size: 13px; line-height: 1.4;">
                                ${sanitizeHtml(comment)}
                            </div>
                        </div>
                    </div>
                `;

                var refWrap = document.createElement("div");
                refWrap.className = "feedback-reference-container mb-2";
                if (topRefUrls.length > 0) {
                    topRefUrls.forEach(function (u, idx) {
                        var a = document.createElement("a");
                        a.href = u;
                        a.target = "_blank";
                        a.className = "feedback-reference-url me-2";
                        a.innerHTML = '<span class="material-symbols-outlined">link</span> Link ' + (idx + 1);
                        refWrap.appendChild(a);
                    });
                }
                if (topRefFiles.length > 0) {
                    topRefFiles.forEach(function (f, idx) {
                        var af = document.createElement("a");
                        af.href = f;
                        af.download = "";
                        af.className = "feedback-reference-file ms-2";
                        af.innerHTML = '<span class="material-symbols-outlined">draft</span> FILE ' + (idx + 1);
                        refWrap.appendChild(af);
                    });
                }
                if (refWrap.children.length > 0) {
                    html += refWrap.outerHTML;
                }

                if (topImageUrl) {
                    var imgEl = document.createElement("img");
                    imgEl.src = topImageUrl;
                    imgEl.className = "img-fluid rounded mb-2 feedback-image";
                    imgEl.style.width = "60%";
                    imgEl.style.height = "60%";
                    imgEl.style.borderRadius = "8px";
                    imgEl.style.cursor = "pointer";
                    imgEl.addEventListener("click", function () {
                        try {
                            showImageModal(topImageUrl);
                        } catch (_) {
                            window.open(topImageUrl, "_blank");
                        }
                    });
                    html += imgEl.outerHTML;
                }

            } catch (err) {
                console.warn("Render feedback preview error:", err);
            }
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

    // expose helper globally so other modules can call window.showDeleteConfirmModal
    try { window.showDeleteConfirmModal = showDeleteConfirmModal; } catch(_) {}

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

            function ensureProjectDetailImagePreviewModalExists() {
                if (document.getElementById('projectDetailImagePreviewModal')) return;
                var html = `
                    <div class="modal fade" id="projectDetailImagePreviewModal" tabindex="-1" aria-hidden="true">
                        <div class="modal-dialog modal-dialog-centered" style="max-width:95vw;">
                            <div class="modal-content modal-content-custom">
                                <div class="modal-body p-0 bg-dark d-flex align-items-center justify-content-center" style="min-height:160px; max-height:80vh; overflow:auto;">
                                    <div style="box-sizing:border-box; padding:12px; width:100%; display:flex; align-items:center; justify-content:center;">
                                        <div style="max-width:100%; width:100%; max-height:calc(80vh - 72px); display:flex; align-items:center; justify-content:center;">
                                            <img id="projectDetailImagePreviewModalImg" src="" alt="Preview image" style="max-width:100%; max-height:100%; width:auto; height:auto; display:block; object-fit:contain;">
                                        </div>
                                    </div>
                                </div>
                                <div class="modal-footer modal-footer-custom">
                                    <button type="button" class="btn btn-custom-close" data-bs-dismiss="modal">Close</button>
                                </div>
                            </div>
                        </div>
                    </div>`;
                try { document.body.insertAdjacentHTML('beforeend', html); } catch(_){}
            }

            function showImageModal(imageSrc) {
                try {
                    ensureProjectDetailImagePreviewModalExists();
                    var modalEl = document.getElementById('projectDetailImagePreviewModal');
                    var imgEl = document.getElementById('projectDetailImagePreviewModalImg');
                    if (imgEl) imgEl.src = imageSrc;

                    // If project feedback modal is open, hide it first and remember to restore later
                    var projectFeedbackModalEl = document.getElementById('projectFeedbackModal');
                    var feedbackWasOpen = false;
                    try {
                        if (projectFeedbackModalEl && projectFeedbackModalEl.classList.contains('show')) {
                            feedbackWasOpen = true;
                            try { projectFeedbackModalEl._suppressFeedbackClear = true; } catch(_){}
                            var fbInst = bootstrap.Modal.getOrCreateInstance(projectFeedbackModalEl) || new bootstrap.Modal(projectFeedbackModalEl);
                            try { fbInst.hide(); } catch(_){ }
                        }
                    } catch(_){ }

                    var inst = bootstrap.Modal.getOrCreateInstance(modalEl) || new bootstrap.Modal(modalEl);
                    var onPreviewHidden = function() {
                        try { modalEl.removeEventListener('hidden.bs.modal', onPreviewHidden); } catch(_){}
                        try {
                            if (feedbackWasOpen) {
                                try { projectFeedbackModalEl._suppressFeedbackClear = false; } catch(_){}
                                var fbInst2 = bootstrap.Modal.getOrCreateInstance(projectFeedbackModalEl) || new bootstrap.Modal(projectFeedbackModalEl);
                                try { fbInst2.show(); } catch(_){ }
                            }
                        } catch(_){ }
                    };
                    try { modalEl.addEventListener('hidden.bs.modal', onPreviewHidden); } catch(_){}
                    inst.show();
                } catch (e) {
                    try { window.open(imageSrc, '_blank'); } catch(_){}
                }
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
                            window.feedbackData = window.feedbackData || {};
                            window.feedbackData[feedback.id] = feedback;
                            var feedbackItem = document.createElement("div");
                            feedbackItem.className = "feedback-item p-3";

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

                            try {
                                commentDiv.innerHTML = sanitizeHtml(feedback.feedback_comment || "");
                            } catch (_) {
                                commentDiv.textContent = feedback.feedback_comment || "";
                            }

                            feedbackItem.appendChild(headerDiv);
                            var commentContent = (feedback.feedback_comment || "").trim();
                            if (!commentContent || commentContent === "<p></p>" || commentContent === "<p><br></p>") {
                                commentDiv.classList.add("d-none");
                            }
                            feedbackItem.appendChild(commentDiv);

                            // Normalize top-level image URL (accept absolute, /file/* or relative filename)
                            try {
                                var topImageUrl = feedback.image || "";
                                if (topImageUrl) {
                                    var isAbs =
                                        typeof topImageUrl === "string" &&
                                        (topImageUrl.indexOf("http://") === 0 ||
                                            topImageUrl.indexOf("https://") ===
                                                0);
                                    var isFilePath =
                                        typeof topImageUrl === "string" &&
                                        (topImageUrl.indexOf("/file/") === 0 ||
                                            topImageUrl.indexOf("file/") === 0);
                                    var isStorage =
                                        typeof topImageUrl === "string" &&
                                        (topImageUrl.indexOf("/storage/") ===
                                            0 ||
                                            topImageUrl.indexOf("storage/") ===
                                                0);
                                    if (!isAbs && !isFilePath && !isStorage) {
                                        topImageUrl =
                                            getMeta("app-url").replace(
                                                /\/$/,
                                                ""
                                            ) +
                                            "/file/project_feedback/" +
                                            topImageUrl;
                                    } else if (
                                        !isAbs &&
                                        (isFilePath || isStorage)
                                    ) {
                                        topImageUrl =
                                            topImageUrl.indexOf("/") === 0
                                                ? getMeta("app-url").replace(
                                                      /\/$/,
                                                      ""
                                                  ) + topImageUrl
                                                : getMeta("app-url").replace(
                                                      /\/$/,
                                                      ""
                                                  ) +
                                                  "/" +
                                                  topImageUrl;
                                    }
                                }
                            } catch (e) {
                                topImageUrl = feedback.image || "";
                            }

                            // Reference files normalization (array-first, fallback single)
                            var topRefFiles = [];
                            try {
                                var topRfVal = feedback.reference_files;
                                if (
                                    !Array.isArray(topRfVal) &&
                                    typeof topRfVal === "string"
                                ) {
                                    try {
                                        var parsed = JSON.parse(topRfVal);
                                        if (Array.isArray(parsed))
                                            topRfVal = parsed;
                                    } catch (_) {}
                                }
                                if (
                                    Array.isArray(topRfVal) &&
                                    topRfVal.length > 0
                                ) {
                                    topRefFiles = topRfVal
                                        .map(function (f) {
                                            if (!f) return null;
                                            var isAbs =
                                                typeof f === "string" &&
                                                (f.indexOf("http://") === 0 ||
                                                    f.indexOf("https://") ===
                                                        0);
                                            var isRefPath =
                                                typeof f === "string" &&
                                                (f.indexOf(
                                                    "/file/project_reference_files/"
                                                ) === 0 ||
                                                    f.indexOf(
                                                        "file/project_reference_files/"
                                                    ) === 0 ||
                                                    f.indexOf("/file/") === 0);
                                            if (!isAbs && !isRefPath)
                                                return (
                                                    getMeta("app-url").replace(
                                                        /\/$/,
                                                        ""
                                                    ) +
                                                    "/file/project_reference_files/" +
                                                    f
                                                );
                                            if (!isAbs && isRefPath)
                                                return f.indexOf("/") === 0
                                                    ? getMeta(
                                                          "app-url"
                                                      ).replace(/\/$/, "") + f
                                                    : getMeta(
                                                          "app-url"
                                                      ).replace(/\/$/, "") +
                                                          "/" +
                                                          f;
                                            return f;
                                        })
                                        .filter(Boolean);
                                } else {
                                    var singleTop =
                                        feedback.reference_file || "";
                                    if (singleTop) {
                                        var isAbs2 =
                                            typeof singleTop === "string" &&
                                            (singleTop.indexOf("http://") ===
                                                0 ||
                                                singleTop.indexOf(
                                                    "https://"
                                                ) === 0);
                                        var isRefPath2 =
                                            typeof singleTop === "string" &&
                                            (singleTop.indexOf(
                                                "/file/project_reference_files/"
                                            ) === 0 ||
                                                singleTop.indexOf(
                                                    "file/project_reference_files/"
                                                ) === 0 ||
                                                singleTop.indexOf("/file/") ===
                                                    0);
                                        if (!isAbs2 && !isRefPath2)
                                            singleTop =
                                                getMeta("app-url").replace(
                                                    /\/$/,
                                                    ""
                                                ) +
                                                "/file/project_reference_files/" +
                                                singleTop;
                                        else if (!isAbs2 && isRefPath2)
                                            singleTop =
                                                singleTop.indexOf("/") === 0
                                                    ? getMeta(
                                                          "app-url"
                                                      ).replace(/\/$/, "") +
                                                      singleTop
                                                    : getMeta(
                                                          "app-url"
                                                      ).replace(/\/$/, "") +
                                                      "/" +
                                                      singleTop;
                                        topRefFiles = [singleTop];
                                    }
                                }
                            } catch (_) {
                                topRefFiles = [];
                            }

                            // Reference URLs normalization
                            var topRefUrls = [];
                            try {
                                var topRuVal = feedback.reference_urls;
                                if (
                                    !Array.isArray(topRuVal) &&
                                    typeof topRuVal === "string"
                                ) {
                                    try {
                                        var parsed2 = JSON.parse(topRuVal);
                                        if (Array.isArray(parsed2))
                                            topRuVal = parsed2;
                                    } catch (_) {}
                                }
                                if (
                                    Array.isArray(topRuVal) &&
                                    topRuVal.length > 0
                                ) {
                                    topRefUrls = topRuVal.filter(function (u) {
                                        return (
                                            typeof u === "string" &&
                                            u.trim() !== ""
                                        );
                                    });
                                } else if (feedback.reference_url) {
                                    topRefUrls = [feedback.reference_url];
                                }
                            } catch (_) {
                                topRefUrls = [];
                            }

                            // Render reference URLs / files if any
                            if (
                                (Array.isArray(topRefUrls) &&
                                    topRefUrls.length > 0) ||
                                (Array.isArray(topRefFiles) &&
                                    topRefFiles.length > 0)
                            ) {
                                var refWrap = document.createElement("div");
                                refWrap.className =
                                    "feedback-reference-container mb-2 row";
                                if (
                                    Array.isArray(topRefUrls) &&
                                    topRefUrls.length > 0
                                ) {
                                    topRefUrls.forEach(function (u, idx) {
                                        try {
                                            var a = document.createElement("a");
                                            a.href = u;
                                            a.target = "_blank";
                                            a.className =
                                                "feedback-reference-url ref-link bg-light rounded-2 ms-2";
                                            const urlObj = new URL(u);
                                            const domain = urlObj.hostname.replace("wwww", "");
                                            a.innerHTML =
                                                '<span class="material-symbols-outlined" style="color: #444444;">link</span>' + domain;
                                            refWrap.appendChild(a);
                                        } catch (_) {}
                                    });
                                }
                                if (
                                    Array.isArray(topRefFiles) &&
                                    topRefFiles.length > 0
                                ) {
                                    topRefFiles.forEach(function (f, idx) {
                                        try {
                                            var af =
                                                document.createElement("a");
                                            af.href = f;
                                            af.download = "";
                                            af.className =
                                                "feedback-reference-file bg-light rounded-2 ms-2";
                                            af.style.width = "60%";
                                            af.style.height = "28px";
                                            af.style.color = "#444444";
                                            const fileName = f.split('/').pop();
                                            af.innerHTML =
                                                '<span class="material-symbols-outlined" style="color: #444444;">draft</span> ' + fileName;
                                            refWrap.appendChild(af);
                                        } catch (_) {}
                                    });
                                }
                                feedbackItem.appendChild(refWrap);
                            }

                            // Render top image if present
                            if (topImageUrl) {
                                try {
                                    var imgEl = document.createElement("img");
                                    imgEl.src = topImageUrl;
                                    imgEl.className =
                                        "img-fluid rounded mb-2 feedback-image";
                                    imgEl.style.width = "60%";
                                    imgEl.style.height = "60%";
                                    imgEl.style.borderRadius = "8px";
                                    imgEl.style.cursor = "pointer";
                                    imgEl.addEventListener(
                                        "click",
                                        function () {
                                            try {
                                                showImageModal(topImageUrl);
                                            } catch (_) {
                                                window.open(
                                                    topImageUrl,
                                                    "_blank"
                                                );
                                            }
                                        }
                                    );
                                    feedbackItem.appendChild(imgEl);
                                } catch (_) {}
                            }

                            // Actions: Reply always; Edit/Delete only if this feedback belongs to current user
                            try {
                                var actionsDiv = document.createElement("div");
                                actionsDiv.className =
                                    "feedback-actions mt-2 d-flex gap-3 align-items-center";
                                // make actions occupy full width and align to right
                                actionsDiv.style.width = "100%";
                                actionsDiv.style.justifyContent = "flex-end";

                                // Reply (icon + text) — same markup as project.js
                                try {
                                    var replyRep =
                                        document.createElement("span");
                                    replyRep.className =
                                        "d-flex align-items-center feedback-reply-trigger";
                                    replyRep.style.cssText =
                                        "cursor:pointer; color:#555; font-size:10px;";
                                    replyRep.setAttribute(
                                        "data-feedback-id",
                                        String(feedback.id)
                                    );
                                    replyRep.setAttribute(
                                        "data-project-id",
                                        String(getMeta("project-id"))
                                    );
                                    var replyIcon =
                                        document.createElement("span");
                                    replyIcon.className =
                                        "material-symbols-outlined";
                                    replyIcon.style.cssText =
                                        "font-size:14px; line-height:1; margin-right:5px;";
                                    replyIcon.textContent = "reply";
                                    var replyText =
                                        document.createElement("span");
                                    replyText.textContent = "Reply";
                                    replyRep.appendChild(replyIcon);
                                    replyRep.appendChild(replyText);
                                    replyRep.addEventListener(
                                        "click",
                                        function () {
                                            try {
                                                showReplyFeedbackForm &&
                                                    showReplyFeedbackForm(
                                                        getMeta("project-id"),
                                                        feedback.id
                                                    );
                                            } catch (_) {}
                                        }
                                    );
                                    actionsDiv.appendChild(replyRep);
                                } catch (_) {}

                                // current user id
                                var currentEmployeeId = null;
                                try {
                                    currentEmployeeId =
                                        document
                                            .getElementById(
                                                "projectFeedbackModal"
                                            )
                                            ?.getAttribute(
                                                "data-employee-id"
                                            ) ||
                                        getMeta("employee-id") ||
                                        null;
                                } catch (_) {}
                                var fbEmployeeId =
                                    (feedback.employee &&
                                        (feedback.employee.id ||
                                            feedback.employee.employee_id)) ||
                                    feedback.employee_id ||
                                    (feedback.employee &&
                                        feedback.employee.employee_id) ||
                                    null;

                                var isOwner = false;
                                try {
                                    if (
                                        fbEmployeeId &&
                                        currentEmployeeId &&
                                        String(fbEmployeeId) ===
                                            String(currentEmployeeId)
                                    )
                                        isOwner = true;
                                } catch (_) {}

                                if (isOwner) {
                                    // Edit (icon + text) — match project.js
                                    try {
                                        var editRep =
                                            document.createElement("span");
                                        editRep.className =
                                            "d-flex align-items-center reply-edit-trigger";
                                        editRep.style.cssText =
                                            "cursor:pointer; color:#555; font-size:10px;";
                                        editRep.setAttribute(
                                            "data-feedback-id",
                                            String(feedback.id)
                                        );
                                        var editIcon =
                                            document.createElement("span");
                                        editIcon.className =
                                            "material-symbols-outlined";
                                        editIcon.style.cssText =
                                            "font-size:14px; line-height:1; margin-right:5px;";
                                        editIcon.textContent = "edit";
                                        var editText =
                                            document.createElement("span");
                                        editText.textContent = "Edit";
                                        editRep.appendChild(editIcon);
                                        editRep.appendChild(editText);
                                        editRep.addEventListener(
                                            "click",
                                            function () {
                                                try {
                                                    // Prefer inline edit in the sidebar panel
                                                    var inlineEditor = document.getElementById("inline_feedback_editor");
                                                    if (inlineEditor && typeof window.startInlineEditFeedback === "function") {
                                                        window.startInlineEditFeedback(feedback);
                                                        try { inlineEditor.scrollIntoView({ behavior: "smooth", block: "center" }); } catch (_) {}
                                                        return;
                                                    }
                                                    // Fallback to modal-based edit if inline not available
                                                    if (typeof window.showEditFeedbackForm === "function") {
                                                        window.showEditFeedbackForm(
                                                            getMeta("project-id"),
                                                            feedback.id,
                                                            feedback
                                                        );
                                                    }
                                                } catch (_) {}
                                            }
                                        );
                                        actionsDiv.appendChild(editRep);
                                    } catch (_) {}

                                    // Delete (icon + text) — match project.js style
                                    try {
                                        var delRep =
                                            document.createElement("span");
                                        delRep.className =
                                            "d-flex align-items-center reply-delete-trigger";
                                        delRep.style.cssText =
                                            "cursor:pointer; color:#555; font-size:10px;";
                                        delRep.setAttribute(
                                            "data-feedback-id",
                                            String(feedback.id)
                                        );
                                        var delIcon =
                                            document.createElement("span");
                                        delIcon.className =
                                            "material-symbols-outlined";
                                        delIcon.style.cssText =
                                            "font-size:14px; line-height:1; margin-right:5px;";
                                        delIcon.textContent = "delete";
                                        var delText =
                                            document.createElement("span");
                                        delText.textContent = "Delete";
                                        delRep.appendChild(delIcon);
                                        delRep.appendChild(delText);
                                        delRep.addEventListener(
                                            "click",
                                            function () {
                                                try {
                                                    if (!showDeleteConfirmModal)
                                                        return;
                                                    showDeleteConfirmModal({
                                                        id: feedback.id,
                                                        type: "feedback",
                                                        feedbackData: feedback,
                                                        onConfirm: function (
                                                            done
                                                        ) {
                                                            try {
                                                                var fbId =
                                                                    feedback.id;
                                                                var url =
                                                                    getMeta(
                                                                        "app-url"
                                                                    ).replace(
                                                                        /\/$/,
                                                                        ""
                                                                    ) +
                                                                    "/project-feedbacks/" +
                                                                    fbId;
                                                                fetch(url, {
                                                                    method: "DELETE",
                                                                    headers: {
                                                                        "X-CSRF-TOKEN":
                                                                            document
                                                                                .querySelector(
                                                                                    'meta[name="csrf-token"]'
                                                                                )
                                                                                .getAttribute(
                                                                                    "content"
                                                                                ),
                                                                        Accept: "application/json",
                                                                    },
                                                                })
                                                                    .then(
                                                                        function (
                                                                            res
                                                                        ) {
                                                                            if (
                                                                                !res.ok
                                                                            )
                                                                                return res
                                                                                    .json()
                                                                                    .then(
                                                                                        function (
                                                                                            j
                                                                                        ) {
                                                                                            return Promise.reject(
                                                                                                j
                                                                                            );
                                                                                        }
                                                                                    );
                                                                            return res.json();
                                                                        }
                                                                    )
                                                                    .then(
                                                                        function (
                                                                            data
                                                                        ) {
                                                                            try {
                                                                                window.showFloatingAlert &&
                                                                                    window.showFloatingAlert(
                                                                                        "Feedback deleted",
                                                                                        "success",
                                                                                        2000
                                                                                    );
                                                                            } catch (_) {}
                                                                            try {
                                                                                loadFeedbackData(
                                                                                    getMeta(
                                                                                        "project-id"
                                                                                    )
                                                                                );
                                                                            } catch (_) {}
                                                                            try {
                                                                                done(
                                                                                    true
                                                                                );
                                                                            } catch (_) {}
                                                                        }
                                                                    )
                                                                    .catch(
                                                                        function (
                                                                            err
                                                                        ) {
                                                                            try {
                                                                                var msg =
                                                                                    "Failed to delete feedback";
                                                                                if (
                                                                                    err &&
                                                                                    err.message
                                                                                )
                                                                                    msg =
                                                                                        err.message;
                                                                                window.showFloatingAlert &&
                                                                                    window.showFloatingAlert(
                                                                                        msg,
                                                                                        "warning",
                                                                                        4000
                                                                                    );
                                                                            } catch (_) {}
                                                                            try {
                                                                                done(
                                                                                    false
                                                                                );
                                                                            } catch (_) {}
                                                                        }
                                                                    );
                                                            } catch (e) {
                                                                try {
                                                                    done(false);
                                                                } catch (_) {}
                                                            }
                                                        },
                                                    });
                                                } catch (_) {}
                                            }
                                        );
                                        actionsDiv.appendChild(delRep);
                                    } catch (_) {}
                                }

                                feedbackItem.appendChild(actionsDiv);

                                // Replies list (hidden by default) with View all / Hide toggle
                                try {
                                    if (Array.isArray(feedback.replies) && feedback.replies.length > 0) {
                                        var repliesCount = feedback.replies.length;
                                        var toggleBtn = document.createElement('button');
                                        toggleBtn.type = 'button';
                                        toggleBtn.className = 'btn btn-link p-0 view-replies-toggle feedback-toggle-replies d-flex align-items-center';
                                        toggleBtn.style.cssText = 'cursor:pointer; color:rgb(85,85,85); font-size:10px; text-decoration: none; display:flex; align-items:center;';
                                        toggleBtn.setAttribute('data-feedback-id', String(feedback.id));
                                        toggleBtn.setAttribute('data-replies-count', String(repliesCount));
                                        toggleBtn.textContent = 'View all (' + String(repliesCount) + ')';
                                        var repliesContainer = document.createElement('div');
                                        repliesContainer.className = 'feedback-replies d-none';

                                        // append toggle into actions row
                                        actionsDiv.appendChild(toggleBtn);

                                        // render replies into container (simple structure matching project.js replies)
                                        feedback.replies.forEach(function (rep) {
                                            try {
                                                var repEmp = rep.employee || {};
                                                var repDiv = document.createElement('div');
                                                // smaller spacing and padding to match top-level feedback
                                                repDiv.className = 'feedback-reply ms-4 mt-1 p-1 rounded';
                                                if (rep && rep.id != null) {
                                                    repDiv.setAttribute('data-reply-id', String(rep.id));
                                                    if (feedback && feedback.id != null) repDiv.setAttribute('data-parent-id', String(feedback.id));
                                                }
                                                // store payload pieces in data-* attributes so delegated handlers can use them
                                                try {
                                                    repDiv.setAttribute('data-comment', encodeURIComponent(rep.feedback_comment || ''));
                                                    repDiv.setAttribute('data-ref-url', encodeURIComponent(rep.reference_url || ''));
                                                    repDiv.setAttribute('data-ref-urls', encodeURIComponent(JSON.stringify(Array.isArray(rep.reference_urls) ? rep.reference_urls : (rep.reference_urls ? (function(){ try{ return JSON.parse(rep.reference_urls); }catch(_){ return []; } })() : []))));
                                                    repDiv.setAttribute('data-ref-file', encodeURIComponent(rep.reference_file || ''));
                                                    repDiv.setAttribute('data-ref-files', encodeURIComponent(JSON.stringify(Array.isArray(rep.reference_files) ? rep.reference_files : (rep.reference_files ? (function(){ try{ return JSON.parse(rep.reference_files); }catch(_){ return []; } })() : []))));
                                                    repDiv.setAttribute('data-image', encodeURIComponent(rep.image || ''));
                                                    repDiv.setAttribute('data-author-name', encodeURIComponent(((rep.employee && (rep.employee.name || '')) || '')));
                                                } catch (_) {}
                                                repDiv.style.background = '#fafafa';

                                                // header
                                                var repHeader = document.createElement('div');
                                                repHeader.className = 'd-flex align-items-start mb-1';
                                                var repImg = document.createElement('img');
                                                (function(){
                                                    var raw = repEmp.user_photo || repEmp.profile_picture || repEmp.photo || '';
                                                    var rurl = getMeta('app-url').replace(/\/$/, '') + '/asset/img/avatar.png';
                                                    try {
                                                        if (raw) {
                                                            if (String(raw).startsWith('http')) rurl = raw;
                                                            else if (String(raw).startsWith('/')) rurl = getMeta('app-url').replace(/\/$/, '') + raw;
                                                            else rurl = getMeta('app-url').replace(/\/$/, '') + '/file/profile_picture/' + raw;
                                                        }
                                                    } catch(_){}
                                                    repImg.src = rurl;
                                                })();
                                                repImg.alt = repEmp.name || 'Employee';
                                                repImg.className = 'rounded-circle me-2';
                                                repImg.style.width = '20px'; repImg.style.height = '20px'; repImg.style.objectFit = 'cover';

                                                var repInfo = document.createElement('div');
                                                repInfo.className = 'flex-grow-1';
                                                // name + time
                                                var repNameWrap = document.createElement('div');
                                                var repNameRow = document.createElement('div');
                                                repNameRow.className = 'd-flex align-items-center';
                                                var repNameStrong = document.createElement('strong');
                                                repNameStrong.style.fontSize = '11px'; repNameStrong.style.fontWeight = '600';
                                                repNameStrong.textContent = repEmp.name || 'Unknown';
                                                repNameRow.appendChild(repNameStrong);
                                                var repDateDiv = document.createElement('div');
                                                repDateDiv.className = 'text-muted small'; repDateDiv.style.fontSize = '10px';
                                                if (rep.created_at) repDateDiv.textContent = timeAgo(rep.created_at);
                                                repNameWrap.appendChild(repNameRow);
                                                repNameWrap.appendChild(repDateDiv);

                                                // content
                                                var repContent = document.createElement('div');
                                                repContent.className = 'mt-2';
                                                var repComment = document.createElement('p');
                                                repComment.className = 'mb-1'; repComment.style.fontSize = '10px'; repComment.style.margin = '0';
                                                try {
                                                    repComment.innerHTML = sanitizeHtml(rep.feedback_comment || '');
                                                } catch (_) {
                                                    try { repComment.textContent = rep.feedback_comment || ''; } catch(_) { repComment.textContent = rep.feedback_comment || ''; }
                                                }
                                                repContent.appendChild(repComment);

                                                // Normalize reply image URL (accept absolute, /file/* or relative filename)
                                                try {
                                                    var repImageUrl = rep.image || "";
                                                    if (repImageUrl) {
                                                        var isAbsR =
                                                            typeof repImageUrl === "string" &&
                                                            (repImageUrl.indexOf("http://") === 0 || repImageUrl.indexOf("https://") === 0);
                                                        var isFilePathR =
                                                            typeof repImageUrl === "string" &&
                                                            (repImageUrl.indexOf("/file/") === 0 || repImageUrl.indexOf("file/") === 0);
                                                        var isStorageR =
                                                            typeof repImageUrl === "string" &&
                                                            (repImageUrl.indexOf("/storage/") === 0 || repImageUrl.indexOf("storage/") === 0);
                                                        if (!isAbsR && !isFilePathR && !isStorageR) {
                                                            repImageUrl = getMeta("app-url").replace(/\/$/, "") + "/file/project_feedback/" + repImageUrl;
                                                        } else if (!isAbsR && (isFilePathR || isStorageR)) {
                                                            repImageUrl = repImageUrl.indexOf("/") === 0 ? getMeta("app-url").replace(/\/$/, "") + repImageUrl : getMeta("app-url").replace(/\/$/, "") + "/" + repImageUrl;
                                                        }
                                                    }
                                                } catch (e) {
                                                    repImageUrl = rep.image || "";
                                                }

                                                // Normalize reply reference files
                                                var repRefFiles = [];
                                                try {
                                                    var rfVal = rep.reference_files;
                                                    if (!Array.isArray(rfVal) && typeof rfVal === "string") {
                                                        try {
                                                            var parsedRf = JSON.parse(rfVal);
                                                            if (Array.isArray(parsedRf)) rfVal = parsedRf;
                                                        } catch (_) {}
                                                    }
                                                    if (Array.isArray(rfVal) && rfVal.length > 0) {
                                                        repRefFiles = rfVal
                                                            .map(function (f) {
                                                                if (!f) return null;
                                                                var isAbsF = typeof f === "string" && (f.indexOf("http://") === 0 || f.indexOf("https://") === 0);
                                                                var isRefPathF = typeof f === "string" && (f.indexOf("/file/project_reference_files/") === 0 || f.indexOf("file/project_reference_files/") === 0 || f.indexOf("/file/") === 0);
                                                                if (!isAbsF && !isRefPathF) return getMeta("app-url").replace(/\/$/, "") + "/file/project_reference_files/" + f;
                                                                if (!isAbsF && isRefPathF) return f.indexOf("/") === 0 ? getMeta("app-url").replace(/\/$/, "") + f : getMeta("app-url").replace(/\/$/, "") + "/" + f;
                                                                return f;
                                                            })
                                                            .filter(Boolean);
                                                    } else {
                                                        var singleRf = rep.reference_file || "";
                                                        if (singleRf) {
                                                            var isAbsSf = typeof singleRf === "string" && (singleRf.indexOf("http://") === 0 || singleRf.indexOf("https://") === 0);
                                                            var isRefPathSf = typeof singleRf === "string" && (singleRf.indexOf("/file/project_reference_files/") === 0 || singleRf.indexOf("file/project_reference_files/") === 0 || singleRf.indexOf("/file/") === 0);
                                                            if (!isAbsSf && !isRefPathSf) singleRf = getMeta("app-url").replace(/\/$/, "") + "/file/project_reference_files/" + singleRf;
                                                            else if (!isAbsSf && isRefPathSf) singleRf = singleRf.indexOf("/") === 0 ? getMeta("app-url").replace(/\/$/, "") + singleRf : getMeta("app-url").replace(/\/$/, "") + "/" + singleRf;
                                                            repRefFiles = [singleRf];
                                                        }
                                                    }
                                                } catch (_) {
                                                    repRefFiles = [];
                                                }

                                                // Normalize reply reference URLs
                                                var repRefUrls = [];
                                                try {
                                                    var ruVal = rep.reference_urls;
                                                    if (!Array.isArray(ruVal) && typeof ruVal === "string") {
                                                        try {
                                                            var parsedRu = JSON.parse(ruVal);
                                                            if (Array.isArray(parsedRu)) ruVal = parsedRu;
                                                        } catch (_) {}
                                                    }
                                                    if (Array.isArray(ruVal) && ruVal.length > 0) {
                                                        repRefUrls = ruVal.filter(function (u) {
                                                            return typeof u === "string" && u.trim() !== "";
                                                        });
                                                    } else if (rep.reference_url) {
                                                        repRefUrls = [rep.reference_url];
                                                    }
                                                } catch (_) {
                                                    repRefUrls = [];
                                                }

                                                // Render reply reference URLs / files if any
                                                if ((Array.isArray(repRefUrls) && repRefUrls.length > 0) || (Array.isArray(repRefFiles) && repRefFiles.length > 0)) {
                                                    var repRefWrap = document.createElement('div');
                                                    repRefWrap.className = 'feedback-reference-container mt-1';
                                                    if (Array.isArray(repRefUrls) && repRefUrls.length > 0) {
                                                        repRefUrls.forEach(function (u, idx) {
                                                            try {
                                                                var a = document.createElement('a');
                                                                a.href = u;
                                                                a.target = '_blank';
                                                                a.className = 'feedback-reference-url me-2';
                                                                a.innerHTML = '<span class="material-symbols-outlined">link</span> Link ' + (idx + 1);
                                                                repRefWrap.appendChild(a);
                                                            } catch (_) {}
                                                        });
                                                    }
                                                    if (Array.isArray(repRefFiles) && repRefFiles.length > 0) {
                                                        repRefFiles.forEach(function (f, idx) {
                                                            try {
                                                                var af = document.createElement('a');
                                                                af.href = f;
                                                                af.download = '';
                                                                af.className = 'feedback-reference-file ms-2';
                                                                af.innerHTML = '<span class="material-symbols-outlined">draft</span> FILE ' + (idx + 1);
                                                                repRefWrap.appendChild(af);
                                                            } catch (_) {}
                                                        });
                                                    }
                                                    try { repContent.appendChild(repRefWrap); } catch(_) {}
                                                }

                                                // Render reply image if present
                                                if (repImageUrl) {
                                                    try {
                                                        var repImgEl = document.createElement('img');
                                                        repImgEl.src = repImageUrl;
                                                        repImgEl.className = 'img-fluid rounded mb-2 feedback-image';
                                                        repImgEl.style.width = '40%';
                                                        repImgEl.style.height = '40%';
                                                        repImgEl.style.borderRadius = '6px';
                                                        repImgEl.style.cursor = 'pointer';
                                                        repImgEl.addEventListener('click', function () {
                                                            try { showImageModal(repImageUrl); } catch (_) { window.open(repImageUrl, '_blank'); }
                                                        });
                                                        repContent.appendChild(repImgEl);
                                                    } catch (_) {}
                                                }

                                                // Reply / Edit / Delete actions (reply always; edit/delete only if owner)
                                                var replyActionsDiv = document.createElement('div');
                                                // Align actions to the right edge of the reply container and make them compact
                                                replyActionsDiv.className = 'feedback-actions mt-1 d-flex gap-2 align-items-center justify-content-end';
                                                replyActionsDiv.style.fontSize = '10px';
                                                replyActionsDiv.style.width = '100%';
                                                replyActionsDiv.style.paddingRight = '0';

                                                // Reply action (always shown)
                                                try {
                                                    var replyRep2 = document.createElement('span');
                                                    replyRep2.className = 'd-flex align-items-center feedback-reply-trigger';
                                                    replyRep2.style.cssText = 'cursor:pointer; color:#555; font-size:10px;';
                                                    replyRep2.setAttribute('data-feedback-id', String(feedback.id));
                                                    replyRep2.setAttribute('data-project-id', String(getMeta('project-id')));
                                                    var replyIcon2 = document.createElement('span'); replyIcon2.className = 'material-symbols-outlined'; replyIcon2.style.cssText = 'font-size:12px; line-height:1; margin-right:4px;'; replyIcon2.textContent = 'reply';
                                                    var replyText2 = document.createElement('span'); replyText2.style.fontSize = '10px'; replyText2.textContent = 'Reply';
                                                    replyRep2.appendChild(replyIcon2); replyRep2.appendChild(replyText2);
                                                    replyRep2.addEventListener('click', function () {
                                                        try { showReplyFeedbackForm && showReplyFeedbackForm(getMeta('project-id'), feedback.id); } catch (_) {}
                                                    });
                                                    replyActionsDiv.appendChild(replyRep2);
                                                } catch (_) {}

                                                // determine if current employee is the reply author
                                                var currentEmployeeId2 = null;
                                                try { currentEmployeeId2 = document.getElementById('projectFeedbackModal')?.getAttribute('data-employee-id') || getMeta('employee-id') || null; } catch(_){}
                                                var repAuthorId = (rep.employee && (rep.employee.id || rep.employee.employee_id)) || rep.employee_id || 0;
                                                var rEdit2 = false;
                                                try { if (repAuthorId && currentEmployeeId2 && String(repAuthorId) === String(currentEmployeeId2)) rEdit2 = true; } catch(_){}

                                                if (rEdit2) {
                                                    try {
                                                        // Edit
                                                        var editRep2 = document.createElement('span');
                                                        editRep2.className = 'd-flex align-items-center reply-edit-trigger';
                                                        editRep2.style.cssText = 'cursor:pointer; color:#555; font-size:10px;';
                                                        editRep2.setAttribute('data-reply-id', String(rep.id));
                                                        editRep2.setAttribute('data-parent-id', String(feedback.id));
                                                        var editIcon2 = document.createElement('span'); editIcon2.className = 'material-symbols-outlined'; editIcon2.style.cssText = 'font-size:12px; line-height:1; margin-right:4px;'; editIcon2.textContent = 'edit';
                                                        var editText2 = document.createElement('span'); editText2.style.fontSize = '10px'; editText2.textContent = 'Edit';
                                                        editRep2.appendChild(editIcon2); editRep2.appendChild(editText2);
                                                        editRep2.addEventListener('click', function () {
                                                            try {
                                                                var payload = { id: rep.id, parent_id: feedback.id, feedback_comment: rep.feedback_comment || '', reference_url: rep.reference_url || '', reference_urls: (function(){ try{ var v = rep.reference_urls; if (!Array.isArray(v) && typeof v === 'string'){ try{ var p = JSON.parse(v); if (Array.isArray(p)) return p; }catch(_){} } return Array.isArray(v)?v:[] }catch(e){ return []; } })(), reference_file_url: rep.reference_file || '', reference_files_urls: (function(){ try{ var rf = rep.reference_files; if (!Array.isArray(rf) && typeof rf === 'string'){ try{ var p2 = JSON.parse(rf); if (Array.isArray(p2)) rf = p2; }catch(_){} } return Array.isArray(rf)?rf:[] }catch(e){ return []; } })(), image_url: (function(){ var img = rep.image || ''; if (!img) return ''; if (String(img).startsWith('http')) return img; if (String(img).startsWith('/')) return getMeta('app-url').replace(/\/$/, '') + img; return getMeta('app-url').replace(/\/$/, '') + '/file/project/' + img; })() };
                                                                // Prefer inline edit on the page if available
                                                                var inlineEditor = document.getElementById('inline_feedback_editor');
                                                                if (inlineEditor && typeof window.startInlineEditFeedback === 'function') {
                                                                    try {
                                                                        window.startInlineEditFeedback(payload);
                                                                        try { inlineEditor.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (_) {}
                                                                    } catch (_) {}
                                                                    return;
                                                                }
                                                                // Fallback to modal-based edit
                                                                if (typeof window.showEditFeedbackForm === 'function') {
                                                                    window.showEditFeedbackForm(getMeta('project-id'), payload, true);
                                                                }
                                                            } catch (_) {}
                                                        });
                                                        replyActionsDiv.appendChild(editRep2);
                                                    } catch(_){}

                                                    try {
                                                        // Delete
                                                        var delRep2 = document.createElement('span');
                                                        delRep2.className = 'd-flex align-items-center reply-delete-trigger';
                                                        delRep2.style.cssText = 'cursor:pointer; color:#555; font-size:10px;';
                                                        delRep2.setAttribute('data-reply-id', String(rep.id));
                                                        delRep2.setAttribute('data-parent-id', String(feedback.id));
                                                        var delIcon2 = document.createElement('span'); delIcon2.className = 'material-symbols-outlined'; delIcon2.style.cssText = 'font-size:12px; line-height:1; margin-right:4px;'; delIcon2.textContent = 'delete';
                                                        var delText2 = document.createElement('span'); delText2.style.fontSize = '10px'; delText2.textContent = 'Delete';
                                                        delRep2.appendChild(delIcon2); delRep2.appendChild(delText2);
                                                        delRep2.addEventListener('click', function(){
                                                            try {
                                                                var rid = String(rep.id);
                                                                var pid = String(feedback.id);
                                                                var authorName = (rep.employee.name || "")
                                                                var content = (rep.feedback_comment || '');
                                                                var avatarUrl = (rep.employee && (rep.employee.user_photo || rep.employee.profile_picture || rep.employee.photo)) || '';
                                                                window.showDeleteConfirmModal({ type: 'reply', id: rid, parentId: pid, authorName: authorName, content: content, avatarUrl: avatarUrl, onConfirm: function(done){
                                                                    try {
                                                                        fetch(getMeta('app-url').replace(/\/$/, '') + '/project-feedbacks/' + rid, {
                                                                            method: 'DELETE',
                                                                            headers: {
                                                                                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                                                                                'Accept': 'application/json'
                                                                            }
                                                                        }).then(function(r){ return r.text().then(function(t){ try{ var j = JSON.parse(t); if (r.ok) return j; return Promise.reject(j); }catch(e){ if (r.ok) return { message: t }; return Promise.reject({ message: t }); } }); }).then(function(res){
                                                                            try {
                                                                                var el = document.querySelector('.feedback-reply[data-reply-id="'+rid+'"]');
                                                                                if (el) el.remove();
                                                                                // update UI if no more replies
                                                                                var parentEl = document.querySelector('.feedback-item[data-feedback-id="'+pid+'"]');
                                                                                if (parentEl) {
                                                                                    var repliesContainer2 = parentEl.querySelector('.feedback-replies');
                                                                                    if (repliesContainer2) {
                                                                                        var children = repliesContainer2.querySelectorAll('.feedback-reply');
                                                                                        if (!children || children.length === 0) {
                                                                                            repliesContainer2.classList.add('d-none');
                                                                                            var toggleEl = parentEl.querySelector('.feedback-toggle-replies');
                                                                                            if (toggleEl) toggleEl.textContent = '';
                                                                                        }
                                                                                    }
                                                                                }
                                                                            } catch(_){}
                                                                            window.showFloatingAlert && window.showFloatingAlert(res.message || 'Reply deleted', 'success', 1500);
                                                                            done(true);
                                                                        }).catch(function(err){
                                                                            var msg = (err && (err.message || (err.errors && Object.values(err.errors).join('\n')))) || 'Failed to delete reply';
                                                                            window.showFloatingAlert && window.showFloatingAlert(msg, 'warning', 3500);
                                                                            done(false);
                                                                        });
                                                                    } catch(e){ try{ done(false); }catch(_){} }
                                                                }});
                                                            } catch(_){}
                                                        });
                                                        replyActionsDiv.appendChild(delRep2);
                                                    } catch(_){}
                                                }

                                                // assemble reply
                                                repInfo.appendChild(repNameWrap);
                                                repInfo.appendChild(repContent);
                                                // place actions inside content so they align under name/time
                                                try { repContent.appendChild(replyActionsDiv); } catch(_){}
                                                repHeader.appendChild(repImg);
                                                repHeader.appendChild(repInfo);
                                                repDiv.appendChild(repHeader);
                                                repliesContainer.appendChild(repDiv);
                                            } catch(_){}
                                        });

                                        feedbackItem.appendChild(repliesContainer);

                                        // toggle behavior: show/hide replies
                                        try {
                                            toggleBtn.addEventListener('click', function () {
                                                try {
                                                    var isHidden = repliesContainer.classList.contains('d-none');
                                                    if (isHidden) {
                                                        repliesContainer.classList.remove('d-none');
                                                        toggleBtn.textContent = 'Hide';
                                                    } else {
                                                        repliesContainer.classList.add('d-none');
                                                        toggleBtn.textContent = 'View all (' + String(repliesCount) + ')';
                                                    }
                                                } catch (_) {}
                                            });
                                        } catch(_){}
                                    }
                                } catch(_){}
                            } catch (_) {}

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
                            "#feedback_editor",
                            "#feedback_toolbar",
                            "__quillProjectFeedbackAdd"
                        );
                        createQuillIfNeeded(
                            "#reply_feedback_editor",
                            "#reply_feedback_toolbar",
                            "__quillProjectFeedbackReply"
                        );
                        createQuillIfNeeded(
                            "#edit_feedback_editor",
                            "#edit_feedback_toolbar",
                            "__quillProjectFeedbackEdit"
                        );
                    } catch (_) {}
                } catch (_) {}
            }

            // Call init on initial load and whenever modal body is reassigned
            try {
                initFeedbackQuillEditors(
                    document.getElementById("projectFeedbackList")
                );
            } catch (_) {}

            // Provide Edit Feedback modal with prefilling for comment, image, urls, and files
            function showEditFeedbackForm(projectId, arg2, arg3) {
                try {
                    // Overloaded args: (projectId, id, data) OR (projectId, data, isReply)
                    var data = null;
                    var isReply = false;
                    var id = null;
                    if (arg2 && typeof arg2 === "object") {
                        data = arg2;
                        id = data.id;
                        isReply = !!arg3;
                    } else {
                        id = arg2;
                        data = arg3 || {};
                        isReply = false;
                    }

                    if (!data) data = {};

                    // Set modal title
                    try {
                        var tEl = projectFeedbackModalEl.querySelector(
                            ".feedback-modal-title"
                        );
                        if (tEl)
                            tEl.textContent = isReply
                                ? "Edit Reply"
                                : "Edit Feedback";
                    } catch (_) {}

                    // Clear modal body and insert template content
                    try {
                        modalBody.innerHTML = "";
                        var tpl = document.getElementById(
                            "template-edit-feedback"
                        );
                        var node = null;
                        if (tpl) {
                            node =
                                tpl.tagName &&
                                tpl.tagName.toLowerCase() === "template"
                                    ? tpl.content.cloneNode(true)
                                    : tpl.cloneNode(true);
                        }
                        if (!node) return;
                        modalBody.appendChild(node);
                        // If this is an edit for a reply, ensure the modal form's hidden parent_id is set
                        try {
                            var parentHidden = modalBody.querySelector('#editFeedbackForm input[name="parent_id"]');
                            if (parentHidden) parentHidden.value = data.parent_id || '';
                        } catch(_) {}
                    } catch (_) {
                        return;
                    }

                    // Prefill comment (textarea will be synced from Quill on submit)
                    try {
                        var ta = modalBody.querySelector(
                            "#editFeedbackForm #feedback_comment"
                        );
                        if (ta) ta.value = data.feedback_comment || "";
                    } catch (_) {}

                    // Setup image preview and clear flag
                    (function () {
                        try {
                            function toFullImageUrl(v) {
                                if (!v) return "";
                                var s = String(v);
                                if (
                                    s.indexOf("http://") === 0 ||
                                    s.indexOf("https://") === 0
                                )
                                    return s;
                                if (s.indexOf("/") === 0)
                                    return appUrl.replace(/\/$/, "") + s;
                                return (
                                    appUrl.replace(/\/$/, "") +
                                    "/file/project/" +
                                    s.replace(/^\//, "")
                                );
                            }
                            var rawImg =
                                data.image_url ||
                                data.image ||
                                data.image_path ||
                                data.imageUrl ||
                                "";
                            var existingImg = toFullImageUrl(rawImg);
                            var hasImg = !!existingImg;
                            var imgInput = modalBody.querySelector(
                                "#feedback_image"
                            );
                            var imgLabel = modalBody.querySelector(
                                "#editFeedbackImageLabel"
                            );
                            var imgClearBtn = modalBody.querySelector(
                                "#editFeedbackImageClearBtn"
                            );
                            var rmHidden = modalBody.querySelector(
                                "#edit_remove_image"
                            );
                            if (imgLabel) {
                                if (hasImg) {
                                    imgLabel.style.backgroundImage =
                                        "url('" + existingImg + "')";
                                    imgLabel.style.backgroundSize = "cover";
                                    imgLabel.style.opacity = "1";
                                } else {
                                    imgLabel.style.backgroundImage =
                                        "url('" +
                                        appUrl.replace(/\/$/, "") +
                                        "/asset/img/background/add-image.png')";
                                    imgLabel.style.backgroundSize = "50%";
                                    imgLabel.style.opacity = "0.5";
                                }
                            }
                            if (imgClearBtn)
                                imgClearBtn.classList.toggle(
                                    "d-none",
                                    !hasImg
                                );
                            if (rmHidden) rmHidden.value = "0";

                            if (imgInput && imgLabel && imgClearBtn) {
                                imgInput.addEventListener("change", function () {
                                    if (this.files && this.files[0]) {
                                        var reader = new FileReader();
                                        reader.onload = function (e) {
                                            try {
                                                imgLabel.style.backgroundImage =
                                                    "url('" + e.target.result + "')";
                                                imgLabel.classList.add(
                                                    "has-image"
                                                );
                                                imgLabel.style.backgroundSize =
                                                    "cover";
                                                imgLabel.style.opacity = "1";
                                                imgClearBtn.classList.remove(
                                                    "d-none"
                                                );
                                                if (rmHidden)
                                                    rmHidden.value = "0";
                                            } catch (_) {}
                                        };
                                        reader.readAsDataURL(this.files[0]);
                                    }
                                });
                                imgClearBtn.addEventListener(
                                    "click",
                                    function (e) {
                                        e.preventDefault();
                                        try {
                                            imgInput.value = "";
                                        } catch (_) {}
                                        imgLabel.style.backgroundImage =
                                            "url('" +
                                            appUrl.replace(/\/$/, "") +
                                            "/asset/img/background/add-image.png')";
                                        imgLabel.style.backgroundPosition =
                                            "center center";
                                        imgLabel.style.backgroundRepeat =
                                            "no-repeat";
                                        imgLabel.style.backgroundSize = "50%";
                                        imgLabel.classList.remove("has-image");
                                        imgLabel.style.opacity = "0.5";
                                        imgClearBtn.classList.add("d-none");
                                        if (rmHidden) rmHidden.value = "1";
                                    }
                                );
                            }
                        } catch (_) {}
                    })();

                    // Prefill reference URLs
                    (function () {
                        try {
                            var container = modalBody.querySelector(
                                "#feedback_reference_urls_container"
                            );
                            if (!container) return;
                            container.innerHTML = "";
                            var urls = [];
                            try {
                                if (Array.isArray(data.reference_urls))
                                    urls = data.reference_urls.slice();
                                else if (
                                    typeof data.reference_urls === "string" &&
                                    data.reference_urls.trim() !== ""
                                ) {
                                    try {
                                        var arr = JSON.parse(
                                            data.reference_urls
                                        );
                                        if (Array.isArray(arr)) urls = arr;
                                    } catch (_) {}
                                }
                                if (
                                    (!urls || !urls.length) &&
                                    data.reference_url
                                )
                                    urls = [data.reference_url];
                            } catch (_) {}
                            function addRow(value, withAdd) {
                                var row = document.createElement("div");
                                row.className = "d-flex gap-2 align-items-center";
                                row.innerHTML =
                                    '<input type="url" class="form-control input-text" name="reference_urls[]" placeholder="https://example.com">' +
                                    (withAdd
                                        ? ' <button type="button" class="btn btn-submit-black add-ref-url"><span class="material-symbols-outlined">add</span></button>'
                                        : ' <button type="button" class="btn btn-remove-url remove-ref-url"><span class="material-symbols-outlined">close</span></button>');
                                container.appendChild(row);
                                var inp = row.querySelector(
                                    'input[type="url"]'
                                );
                                if (inp && value) inp.value = value;
                            }
                            addRow("", true);
                            (urls || []).forEach(function (u) {
                                addRow(u, false);
                            });
                        } catch (_) {}
                    })();

                    // Existing files list + preview for new files
                    (function () {
                        try {
                            var container = modalBody.querySelector(
                                "#existing_feedback_reference_files"
                            );
                            var hidden = modalBody.querySelector(
                                "#existing_feedback_reference_files_input"
                            );
                            var preview = modalBody.querySelector(
                                "#edit_feedback_reference_files_preview"
                            );
                            var input = modalBody.querySelector(
                                "#edit_reference_files"
                            );
                            if (!container || !hidden || !preview || !input)
                                return;

                            // Gather existing files from various shapes
                            var files = [];
                            try {
                                if (
                                    Array.isArray(data.reference_files_urls)
                                )
                                    files = data.reference_files_urls.slice();
                                else if (Array.isArray(data.reference_files))
                                    files = data.reference_files.slice();
                                else if (data.reference_file_url)
                                    files = [data.reference_file_url];
                                else if (data.reference_file)
                                    files = [data.reference_file];
                                else if (
                                    typeof data.reference_files ===
                                        "string" &&
                                    data.reference_files.trim() !== ""
                                ) {
                                    try {
                                        var arr2 = JSON.parse(
                                            data.reference_files
                                        );
                                        if (Array.isArray(arr2)) files = arr2;
                                    } catch (_) {}
                                }
                            } catch (_) {}

                            function toUrl(v) {
                                if (!v) return "";
                                var s = String(v);
                                if (
                                    s.indexOf("http://") === 0 ||
                                    s.indexOf("https://") === 0
                                )
                                    return s;
                                if (s.indexOf("/") === 0)
                                    return appUrl.replace(/\/$/, "") + s;
                                return (
                                    appUrl.replace(/\/$/, "") +
                                    "/file/project/" +
                                    s
                                );
                            }
                            function toName(u) {
                                if (!u) return "";
                                var s = String(u);
                                try {
                                    var last = s.split("/").pop();
                                    return last || s;
                                } catch (_) {
                                    return s;
                                }
                            }

                            container.innerHTML = "";
                            if ((files || []).length > 0) {
                                var list = document.createElement("div");
                                list.className = "existing-files-list w-100";
                                files.forEach(function (f) {
                                    var url = toUrl(f);
                                    var name = toName(f);
                                    if (!name) return;
                                    var item = document.createElement("div");
                                    item.className =
                                        "existing-file-item d-flex align-items-center justify-content-between mb-2 p-2 bg-light border rounded";
                                    var info = document.createElement("div");
                                    info.className =
                                        "d-flex align-items-center flex-grow-1";
                                    var icon = document.createElement("span");
                                    icon.className =
                                        "material-symbols-outlined me-2";
                                    icon.textContent = "description";
                                    var link = document.createElement("a");
                                    link.href = url;
                                    link.textContent = name;
                                    link.className = "text-decoration-none";
                                    link.target = "_blank";
                                    var removeBtn =
                                        document.createElement("button");
                                    removeBtn.type = "button";
                                    removeBtn.className =
                                        "btn btn-sm btn-outline-danger";
                                    removeBtn.innerHTML = "&times;";
                                    removeBtn.onclick = function () {
                                        item.remove();
                                        try {
                                            var anchors =
                                                container.querySelectorAll(
                                                    ".existing-file-item a"
                                                );
                                            var keep = Array.from(anchors)
                                                .map(function (a) {
                                                    return (
                                                        a.textContent || ""
                                                    ).trim();
                                                })
                                                .filter(Boolean);
                                            hidden.value =
                                                JSON.stringify(keep);
                                        } catch (_) {}
                                    };
                                    info.appendChild(icon);
                                    info.appendChild(link);
                                    item.appendChild(info);
                                    item.appendChild(removeBtn);
                                    list.appendChild(item);
                                });
                                container.appendChild(list);
                            }
                            try {
                                var anchors2 = container.querySelectorAll(
                                    ".existing-file-item a"
                                );
                                var names2 = Array.from(anchors2)
                                    .map(function (a) {
                                        return (a.textContent || "").trim();
                                    })
                                    .filter(Boolean);
                                hidden.value = JSON.stringify(names2);
                            } catch (_) {
                                hidden.value = "[]";
                            }

                            // Preview for newly added files
                            try {
                                window.editFeedbackSelectedFiles = [];
                                function renderPreview() {
                                    preview.innerHTML = "";
                                    if (
                                        !window.editFeedbackSelectedFiles ||
                                        !window.editFeedbackSelectedFiles
                                            .length
                                    )
                                        return;
                                    var list = document.createElement("div");
                                    list.className =
                                        "selected-files-list mt-2";
                                    window.editFeedbackSelectedFiles.forEach(
                                        function (file, idx) {
                                            var item =
                                                document.createElement("div");
                                            item.className =
                                                "selected-file-item d-flex align-items-center justify-content-between mb-2 p-2 bg-light border rounded";
                                            var info =
                                                document.createElement("div");
                                            info.className =
                                                "d-flex align-items-center flex-grow-1";
                                            var icon =
                                                document.createElement(
                                                    "span"
                                                );
                                            icon.className =
                                                "material-symbols-outlined me-2";
                                            icon.textContent = "description";
                                            var name =
                                                document.createElement(
                                                    "span"
                                                );
                                            name.className = "file-name";
                                            name.textContent = file.name;
                                            var size =
                                                document.createElement(
                                                    "small"
                                                );
                                            size.className =
                                                "text-muted ms-1";
                                            size.textContent =
                                                " (" +
                                                (
                                                    (file.size || 0) /
                                                    1024 /
                                                    1024
                                                ).toFixed(2) +
                                                " MB)";
                                            var rm =
                                                document.createElement(
                                                    "button"
                                                );
                                            rm.type = "button";
                                            rm.className =
                                                "btn btn-sm btn-outline-danger";
                                            rm.innerHTML = "&times;";
                                            rm.onclick = function () {
                                                try {
                                                    window.editFeedbackSelectedFiles.splice(
                                                        idx,
                                                        1
                                                    );
                                                    renderPreview();
                                                } catch (_) {}
                                            };
                                            info.appendChild(icon);
                                            info.appendChild(name);
                                            info.appendChild(size);
                                            item.appendChild(info);
                                            item.appendChild(rm);
                                            list.appendChild(item);
                                        }
                                    );
                                    preview.appendChild(list);
                                }
                                input.addEventListener("change", function () {
                                    try {
                                        var files = Array.from(
                                            this.files || []
                                        );
                                        window.editFeedbackSelectedFiles = (
                                            window.editFeedbackSelectedFiles ||
                                            []
                                        ).concat(files);
                                        renderPreview();
                                        this.value = "";
                                    } catch (_) {}
                                });
                            } catch (_) {}
                        } catch (_) {}
                    })();

                    // Initialize Quill editor for edit form and set content
                    try {
                        initFeedbackQuillEditors(modalBody);
                        if (
                            window.__quillProjectFeedbackEdit &&
                            window.__quillProjectFeedbackEdit.root
                        ) {
                            window.__quillProjectFeedbackEdit.root.innerHTML =
                                data.feedback_comment || "";
                        }
                    } catch (_) {}

                    // Turn footer primary button into Update and wire submit
                    (function () {
                        try {
                            var footer = (function () {
                                try {
                                    return (
                                        projectFeedbackModalEl.querySelector(
                                            ".feedback-modal-footer"
                                        ) ||
                                        projectFeedbackModalEl.querySelector(
                                            ".modal-footer"
                                        )
                                    );
                                } catch (_) {
                                    return null;
                                }
                            })();
                            var btn = document.getElementById(
                                "addFeedbackButton"
                            );
                            if (!btn) {
                                // Fallback for sidebar (no modal footer/button). Create local buttons.
                                var localWrap = document.createElement("div");
                                localWrap.className =
                                    "d-flex gap-2 w-100 mt-2 justify-content-end";
                                var closeBtn = document.createElement("button");
                                closeBtn.type = "button";
                                closeBtn.className = "btn btn-close-reply";
                                closeBtn.textContent = "Close";
                                closeBtn.addEventListener("click", function () {
                                    try {
                                        loadFeedbackData(projectId);
                                    } catch (_) {}
                                });
                                var updateBtn = document.createElement("button");
                                updateBtn.type = "button";
                                updateBtn.className = "btn btn-submit-black";
                                updateBtn.textContent = "Update";
                                modalBody.appendChild(localWrap);
                                localWrap.appendChild(closeBtn);
                                localWrap.appendChild(updateBtn);
                                btn = updateBtn; // reuse common handler below
                            } else {
                                btn.textContent = "Update";
                                var fresh = btn.cloneNode(true);
                                btn.parentNode.replaceChild(fresh, btn);
                                btn = fresh;
                            }

                            btn.addEventListener("click", function (e) {
                                e.preventDefault();
                                try {
                                    // ensure quill -> textarea sync
                                    try {
                                        if (window.__quillProjectFeedbackEdit) {
                                            var ta = document.querySelector(
                                                "#editFeedbackForm #feedback_comment"
                                            );
                                            if (ta)
                                                ta.value =
                                                    window.__quillProjectFeedbackEdit.root.innerHTML ||
                                                    "";
                                        }
                                    } catch (_) {}
                                    var form = document.getElementById(
                                        "editFeedbackForm"
                                    );
                                    if (!form) return;
                                    var fd = new FormData(form);
                                    // Map first URL to reference_url (backend compatibility)
                                    try {
                                        var urlInputs = form.querySelectorAll(
                                            'input[name="reference_urls[]"]'
                                        );
                                        var urls = Array.from(urlInputs)
                                            .map(function (i) {
                                                return (i.value || "").trim();
                                            })
                                            .filter(Boolean);
                                        fd.set(
                                            "reference_url",
                                            urls.length ? urls[0] : ""
                                        );
                                    } catch (_) {}
                                    // Existing kept files (ensure hidden input is present)
                                    try {
                                        var existingHidden = form.querySelector(
                                            "#existing_feedback_reference_files_input"
                                        );
                                        if (existingHidden && !existingHidden.value)
                                            existingHidden.value = "[]";
                                        // explicitly set into FormData to be safe
                                        if (existingHidden)
                                            fd.set('existing_reference_files', existingHidden.value || '[]');
                                    } catch (_) {}
                                    // Newly added files
                                    try {
                                        if (
                                            window.editFeedbackSelectedFiles &&
                                            window.editFeedbackSelectedFiles
                                                .length
                                        ) {
                                            window.editFeedbackSelectedFiles.forEach(
                                                function (f) {
                                                    fd.append(
                                                        "reference_files[]",
                                                        f
                                                    );
                                                }
                                            );
                                        }
                                    } catch (_) {}
                                    // Ensure parent_id is included (reply edit)
                                    try {
                                        var ph = form.querySelector('input[name="parent_id"]');
                                        if (ph && ph.value) fd.set('parent_id', ph.value);
                                        else if (data && data.parent_id) fd.set('parent_id', data.parent_id);
                                    } catch(_) {}
                                    // PUT method override
                                    fd.append("_method", "PUT");

                                    var submitBtn = btn;
                                    var originalText = submitBtn.innerHTML;
                                    submitBtn.disabled = true;
                                    submitBtn.innerHTML =
                                        '<span class="spinner-border spinner-border-sm me-1"></span>Updating...';

                                    fetch(
                                        appUrl.replace(/\/$/, "") +
                                            "/project-feedbacks/" +
                                            id,
                                        {
                                            method: "POST",
                                            headers: {
                                                "X-CSRF-TOKEN": document
                                                    .querySelector(
                                                        'meta[name="csrf-token"]'
                                                    )
                                                    .getAttribute("content"),
                                            },
                                            body: fd,
                                        }
                                    )
                                        .then(function (r) {
                                            return r.ok
                                                ? r.json()
                                                : r.json().then(
                                                      Promise.reject
                                                  );
                                        })
                                        .then(function (res) {
                                            try {
                                                window.showFloatingAlert &&
                                                    window.showFloatingAlert(
                                                        res.message ||
                                                            "Feedback updated",
                                                        "success",
                                                        1500
                                                    );
                                            } catch (_) {}
                                            try {
                                                loadFeedbackData(projectId);
                                            } catch (_) {}
                                        })
                                        .catch(function (err) {
                                            var msg =
                                                (err &&
                                                    (err.message ||
                                                        (err.errors &&
                                                            Object.values(
                                                                err.errors
                                                            ).join("\n")))) ||
                                                "Failed to update feedback";
                                            try {
                                                window.showFloatingAlert &&
                                                    window.showFloatingAlert(
                                                        msg,
                                                        "warning",
                                                        3500
                                                    );
                                            } catch (_) {}
                                        })
                                        .finally(function () {
                                            submitBtn.disabled = false;
                                            submitBtn.innerHTML = originalText;
                                        });
                                } catch (_) {}
                            });

                            // Arrange Close + Update buttons nicely
                            try {
                                if (!footer) return;
                                var submitRef = document.getElementById(
                                    "addFeedbackButton"
                                );
                                if (!submitRef) return; // sidebar fallback already created
                                submitRef.classList.remove("w-100");
                                submitRef.classList.add("flex-grow-1");
                                var old = footer.querySelector(
                                    "#feedbackFormButtonsWrapper"
                                );
                                if (old) old.remove();
                                var wrap = document.createElement("div");
                                wrap.id = "feedbackFormButtonsWrapper";
                                wrap.className = "d-flex gap-2 w-100";
                                var closeBtn = document.createElement("button");
                                closeBtn.type = "button";
                                closeBtn.className =
                                    "btn btn-close-reply flex-grow-1";
                                closeBtn.textContent = "Close";
                                closeBtn.addEventListener("click", function () {
                                    try {
                                        footer.innerHTML = "";
                                        var restore = document.createElement(
                                            "button"
                                        );
                                        restore.type = "button";
                                        restore.className =
                                            "btn btn-submit-black w-100";
                                        restore.id = "addFeedbackButton";
                                        restore.textContent = "Add Feedback";
                                        restore.addEventListener(
                                            "click",
                                            function () {
                                                try {
                                                    if (typeof showAddFeedbackForm === "function")
                                                        showAddFeedbackForm(projectId);
                                                } catch (_) {}
                                            }
                                        );
                                        footer.appendChild(restore);
                                    } catch (_) {}
                                    try {
                                        loadFeedbackData(projectId);
                                    } catch (_) {}
                                });
                                wrap.appendChild(closeBtn);
                                wrap.appendChild(submitRef);
                                footer.innerHTML = "";
                                footer.appendChild(wrap);
                            } catch (_) {}
                        } catch (_) {}
                    })();
                } catch (e) {
                    console.warn("showEditFeedbackForm error", e);
                }
            }

            // Ensure Quill content is synced to hidden textarea before forms are submitted
            function syncAllFeedbackQuills() {
                try {
                    try {
                        if (window.__quillProjectFeedbackAdd) {
                            var ta = document.querySelector(
                                "#addFeedbackForm #feedback_comment"
                            );
                            if (ta)
                                ta.value =
                                    window.__quillProjectFeedbackAdd.root
                                        .innerHTML || "";
                        }
                    } catch (_) {}
                    // reply-specific Quill instance removed: nothing to sync here (page inline editor handles input)
                    try {
                        if (window.__quillProjectFeedbackEdit) {
                            var ta3 = document.querySelector(
                                "#editFeedbackForm #feedback_comment"
                            );
                            if (ta3)
                                ta3.value =
                                    window.__quillProjectFeedbackEdit.root
                                        .innerHTML || "";
                        }
                    } catch (_) {}
                } catch (_) {}
            }

            // Hook capture-phase submit on modal to ensure sync
            try {
                document.addEventListener(
                    "submit",
                    function (ev) {
                        try {
                            var form = ev.target || null;
                            if (!form) return;
                            if (
                                form.id === "addFeedbackForm" ||
                                form.id === "replyFeedbackForm" ||
                                form.id === "editFeedbackForm"
                            ) {
                                syncAllFeedbackQuills(); // basic validation
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
                                        window.showFloatingAlert &&
                                            window.showFloatingAlert(
                                                "Feedback is required",
                                                "warning",
                                                3000
                                            );
                                        return false;
                                    }
                                } catch (_) {}
                            }
                        } catch (_) {}
                    },
                    true
                );
            } catch (_) {}

            // Clean up Quill instances when modal hidden to avoid stale instances
            try {
                var pfModal = document.getElementById("projectFeedbackModal");
                if (pfModal) {
                    pfModal.addEventListener("hidden.bs.modal", function () {
                        try {
                            if (window.__quillProjectFeedbackAdd) {
                                window.__quillProjectFeedbackAdd = null;
                            }
                        } catch (_) {}
                        try {
                            // no reply-specific quill to cleanup
                        } catch (_) {}
                        try {
                            if (window.__quillProjectFeedbackEdit) {
                                window.__quillProjectFeedbackEdit = null;
                            }
                        } catch (_) {}
                        // also clear editors' DOM if forms are present and were inserted
                        try {
                            var ed = document.querySelector("#feedback_editor");
                            if (ed) ed.innerHTML = "";
                        } catch (_) {}
                        try {
                            var ed2 = document.querySelector(
                                "#reply_feedback_editor"
                            );
                            if (ed2) ed2.innerHTML = "";
                        } catch (_) {}
                        try {
                            var ed3 = document.querySelector(
                                "#edit_feedback_editor"
                            );
                            if (ed3) ed3.innerHTML = "";
                        } catch (_) {}
                    });
                }
            } catch (_) {}

            // --- Inline quick feedback editor (on project detail panel) ---
            try {
                // Initialize inline Quill when DOM ready
                function initInlineFeedback() {
                    try {
                        if (typeof Quill === "undefined") return;
                        if (window.__quillProjectFeedbackInline)
                            return window.__quillProjectFeedbackInline;
                        var editorEl = document.getElementById(
                            "inline_feedback_editor"
                        );
                        if (!editorEl) return null;

                        // create Quill with minimal toolbar (toolbar hidden by default)
                        var q = new Quill("#inline_feedback_editor", {
                            modules: {
                                toolbar: "#inline_feedback_toolbar",
                                clipboard: { matchVisual: false },
                            },
                            theme: "snow",
                            placeholder: "Write feedback...",
                        });

                        // Remove images if pasted
                        try {
                            var Delta = Quill.import && Quill.import("delta");
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

                        // prevent image drag/drop and paste at capture phase (like other Quill instances)
                        try {
                            var editorContainer = document.querySelector(
                                "#inline_feedback_editor"
                            );
                            if (editorContainer) {
                                editorContainer.addEventListener(
                                    "dragover",
                                    function (e) {
                                        try {
                                            e.preventDefault();
                                        } catch (_) {}
                                    },
                                    true
                                );
                                editorContainer.addEventListener(
                                    "drop",
                                    function (e) {
                                        try {
                                            if (!e.dataTransfer) return;
                                            var hasFiles =
                                                e.dataTransfer.files &&
                                                e.dataTransfer.files.length > 0;
                                            var html = "";
                                            try {
                                                html =
                                                    (e.dataTransfer.getData &&
                                                        e.dataTransfer.getData(
                                                            "text/html"
                                                        )) ||
                                                    "";
                                            } catch (_) {
                                                html = "";
                                            }
                                            if (
                                                hasFiles ||
                                                /<img\s*/i.test(html)
                                            ) {
                                                e.preventDefault();
                                                e.stopImmediatePropagation();
                                                return;
                                            }
                                        } catch (_) {}
                                    },
                                    true
                                );

                                editorContainer.addEventListener(
                                    "paste",
                                    function (e) {
                                        try {
                                            var clipboard =
                                                e.clipboardData ||
                                                window.clipboardData;
                                            if (!clipboard) return;
                                            var items = clipboard.items || [];
                                            for (
                                                var i = 0;
                                                i < items.length;
                                                i++
                                            ) {
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
                                            var html = "";
                                            try {
                                                html =
                                                    (clipboard.getData &&
                                                        clipboard.getData(
                                                            "text/html"
                                                        )) ||
                                                    "";
                                            } catch (_) {
                                                html = "";
                                            }
                                            if (/<img\s*/i.test(html)) {
                                                e.preventDefault();
                                                e.stopImmediatePropagation();
                                                return;
                                            }
                                        } catch (_) {}
                                    },
                                    true
                                );
                            }
                        } catch (_) {}

                        // rely on Quill's built-in placeholder option

                        window.__quillProjectFeedbackInline = q;
                        return q;
                    } catch (e) {
                        return null;
                    }
                }

                var inlineQ = initInlineFeedback();

                // Photo/file button handlers
                try {
                    var photoBtn = document.getElementById(
                        "inlineFeedbackPhotoBtn"
                    );
                    var fileBtn = document.getElementById(
                        "inlineFeedbackFileBtn"
                    );
                    var photoInput = document.getElementById(
                        "inline_feedback_image_input"
                    );
                    var filesInput = document.getElementById(
                        "inline_feedback_files_input"
                    );

                    // maintain an array of selected files for inline preview & upload
                    window.inlineFeedbackSelectedFiles =
                        window.inlineFeedbackSelectedFiles || [];

                    if (photoBtn && photoInput)
                        photoBtn.addEventListener("click", function () {
                            photoInput.click();
                        });
                    if (fileBtn && filesInput)
                        fileBtn.addEventListener("click", function () {
                            filesInput.click();
                        });
                    // handle file (non-image) attachments preview
                    if (filesInput) {
                        filesInput.addEventListener("change", function (ev) {
                            try {
                                var files = Array.from(this.files || []);
                                if (!files.length) return;
                                // append to selected array
                                window.inlineFeedbackSelectedFiles = (
                                    window.inlineFeedbackSelectedFiles || []
                                ).concat(files);
                                renderInlineFilesPreview();
                                // clear native input so user can reselect same file later if needed
                                try {
                                    this.value = "";
                                } catch (_) {}
                            } catch (_) {}
                        });
                    }

                    // show small image preview next to attach file icon when a photo is selected
                    if (photoInput) {
                        photoInput.addEventListener("change", function (ev) {
                            try {
                                var f = (this.files && this.files[0]) || null;
                                if (!f) return;
                                if (!f.type || f.type.indexOf("image/") !== 0)
                                    return;

                                var reader = new FileReader();
                                reader.onload = function (e) {
                                    try {
                                        showInlineImagePreviewSmall(
                                            f,
                                            e.target.result
                                        );
                                    } catch (_) {}
                                };
                                reader.readAsDataURL(f);
                            } catch (_) {}
                        });
                    }

                    // render inline files preview container (insert before editor)
                    function renderInlineFilesPreview() {
                        try {
                            var editorEl = document.getElementById(
                                "inline_feedback_editor"
                            );
                            if (!editorEl) return;
                            var parent = editorEl.parentNode;
                            if (!parent) return;
                            var previewId = "inline_feedback_files_preview";
                            var preview = document.getElementById(previewId);
                            var sel = window.inlineFeedbackSelectedFiles || [];

                            // if no files selected, remove preview container if exists
                            if (!sel.length) {
                                try {
                                    if (preview && preview.parentNode)
                                        preview.parentNode.removeChild(preview);
                                } catch (_) {}
                                return;
                            }

                            if (!preview) {
                                preview = document.createElement("div");
                                preview.id = previewId;
                                preview.className = "mt-2";
                                parent.insertBefore(preview, editorEl);
                            }
                            // build list
                            preview.innerHTML = "";
                            var listWrap = document.createElement("div");
                            listWrap.className = "selected-files-list mt-2";
                            sel.forEach(function (f, idx) {
                                try {
                                    var item = document.createElement("div");
                                    // match user's requested styling for selected file item
                                    item.className =
                                        "d-flex align-items-center gap-2 p-2 rounded bg-light selected-task";

                                    var iconWrap = document.createElement("div");
                                    // small file icon placeholder (compact)
                                    iconWrap.innerHTML =
                                        '<span class="material-symbols-outlined">description</span>';
                                    iconWrap.style.fontSize = "10px";
                                    iconWrap.style.textAlign = "center";

                                    var name = document.createElement("span");
                                    name.className = "flex-grow-1";
                                    name.style.fontSize = "10px";
                                    var sizeMb = (f.size || 0) / 1024 / 1024;
                                    name.textContent =
                                        (f.name || "") +
                                        (isFinite(sizeMb)
                                            ? " (" + sizeMb.toFixed(2) + " MB)"
                                            : "");

                                    var rm = document.createElement("button");
                                    rm.type = "button";
                                    rm.className =
                                        "btn btn-sm btn-remove-task remove-task";
                                    // inline styles to match requested snippet
                                    rm.style.lineHeight = "1";
                                    rm.style.fontSize = "10px";
                                    rm.innerHTML =
                                        '<span class="material-symbols-outlined">close</span>';
                                    rm.addEventListener("click", function () {
                                        try {
                                            window.inlineFeedbackSelectedFiles.splice(
                                                idx,
                                                1
                                            );
                                            renderInlineFilesPreview();
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
                } catch (_) {}

                // Inline edit helpers (global) — render existing files, show existing image, enter/exit edit mode
                (function(){
                    // Render existing files (from fetched feedback) with ability to remove/keep
                    window.renderInlineExistingFiles = function(files){
                        try {
                            var editorEl = document.getElementById("inline_feedback_editor");
                            if (!editorEl || !editorEl.parentNode) return;
                            var parent = editorEl.parentNode;
                            var id = "inline_existing_files_preview";
                            var box = document.getElementById(id);
                            var arr = Array.isArray(files) ? files.slice() : [];
                            window.inlineExistingFilesKeep = [];
                            function toUrl(v){
                                if (!v) return "";
                                var s = String(v);
                                if (s.indexOf("http://")===0 || s.indexOf("https://")===0) return s;
                                if (s.indexOf("/")===0) return appUrl.replace(/\/$/, "") + s;
                                return appUrl.replace(/\/$/, "") + "/file/project/" + s;
                            }
                            function toName(u){
                                var s = String(u||"");
                                try { return s.split("/").pop(); } catch(_){ return s; }
                            }
                            if (!arr.length){ if (box && box.parentNode) box.parentNode.removeChild(box); return; }
                            if (!box){ box = document.createElement("div"); box.id = id; box.className = "mt-2"; parent.insertBefore(box, editorEl); }
                            box.innerHTML = "";
                            var list = document.createElement("div"); list.className = "existing-files-list w-100";
                            arr.forEach(function(f){
                                var url = toUrl(f); var name = toName(f); if (!name) return;
                                window.inlineExistingFilesKeep.push(name);
                                // Create item matching requested appearance
                                var item = document.createElement("div");
                                item.className = "d-flex align-items-center gap-2 p-2 rounded bg-light selected-task";

                                var iconWrap = document.createElement("div");
                                iconWrap.style.fontSize = "10px";
                                iconWrap.style.textAlign = "center";
                                iconWrap.innerHTML = '<span class="material-symbols-outlined">description</span>';

                                var link = document.createElement("a");
                                link.href = url;
                                link.target = "_blank";
                                link.className = "flex-grow-1";
                                link.style.fontSize = "10px";
                                // user's request: filename color and no text decoration
                                try { link.style.color = '#444444'; link.style.textDecoration = 'none'; } catch(_) {}
                                link.textContent = name;

                                // remove button styled small
                                var rm = document.createElement("button");
                                rm.type = "button";
                                rm.className = "btn btn-sm btn-remove-task remove-task";
                                rm.style.lineHeight = "1";
                                rm.style.fontSize = "10px";
                                rm.innerHTML = '<span class="material-symbols-outlined">close</span>';
                                rm.addEventListener("click", function(){ try { item.remove(); var idx = window.inlineExistingFilesKeep.indexOf(name); if (idx>-1) window.inlineExistingFilesKeep.splice(idx,1); } catch(_){} });

                                item.appendChild(iconWrap);
                                item.appendChild(link);
                                item.appendChild(rm);
                                list.appendChild(item);
                            });
                            box.appendChild(list);
                        } catch(_){ }
                    };

                    // Show small image preview from an existing URL (not a File)
                    window.showInlineImagePreviewFromUrl = function(url){
                                            try {
                                                var editorEl = document.getElementById("inline_feedback_editor"); if (!editorEl || !editorEl.parentNode) return;
                                                var parent = editorEl.parentNode; var previewContainer = document.getElementById("inline_feedback_image_preview");
                                                if (!previewContainer){ previewContainer = document.createElement("div"); previewContainer.id = "inline_feedback_image_preview"; previewContainer.className = "";
                                                    // Prefer inserting the preview immediately after the attach-file button so it appears to the right of it
                                                    var fileBtn = document.getElementById("inlineFeedbackFileBtn");
                                                    if (fileBtn && fileBtn.parentNode) {
                                                        // ensure the parent lays out children inline so the preview sits to the right
                                                        try {
                                                            var targetParent = fileBtn.parentNode;
                                                            var cs = window.getComputedStyle(targetParent);
                                                            if (cs && cs.display !== 'flex' && cs.display !== 'inline-flex') {
                                                                // only set inline-flex as a non-destructive inline style when necessary
                                                                targetParent.style.display = 'inline-flex';
                                                                targetParent.style.alignItems = 'center';
                                                                // small gap so icon and preview are nicely spaced
                                                                if (!targetParent.style.gap) targetParent.style.gap = '6px';
                                                            }
                                                        } catch (_) {}
                                                        fileBtn.parentNode.insertBefore(previewContainer, fileBtn.nextSibling);
                                                    } else if (editorEl && editorEl.parentNode) {
                                                        editorEl.parentNode.insertBefore(previewContainer, editorEl);
                                                    } else {
                                                        // last resort: append to parent
                                                        parent.appendChild(previewContainer);
                                                    }
                                                }
                                                previewContainer.innerHTML = "";

                                                // Build markup like the user's example
                                                var outer = document.createElement('div');
                                                outer.style.display = 'inline-flex';
                                                outer.style.alignItems = 'center';
                                                outer.style.marginLeft = '8px';
                                                outer.style.opacity = '1';
                                                outer.style.background = 'transparent';

                                                var imageLabel = document.createElement('div');
                                                imageLabel.className = 'custom-image-upload position-relative';
                                                imageLabel.style.cssText = "width: 32px; height: 32px; background-image: url('"+ url.replace(/'/g, "\\'") +"'); background-size: cover; background-position: center center; background-repeat: no-repeat; border-radius: 6px; cursor: pointer; border: 1px solid rgb(221, 221, 221); margin-right: 4px; opacity: 1; background-color: rgb(255, 255, 255); box-shadow: rgba(0, 0, 0, 0.12) 0px 1px 3px; overflow: visible;";

                                                var clearBtn = document.createElement('span');
                                                clearBtn.className = 'image-clear-btn';
                                                clearBtn.title = 'Remove image';
                                                clearBtn.innerHTML = '×';
                                                clearBtn.style.cssText = 'position: absolute; top: -6px; right: -6px; background: rgb(255, 68, 68); color: rgb(255, 255, 255); border-radius: 50%; width: 16px; height: 16px; font-size: 12px; line-height: 16px; text-align: center; cursor: pointer; font-weight: 700; border: none; box-shadow: rgba(0, 0, 0, 0.25) 0px 2px 6px; z-index: 30; opacity: 1;';
                                                clearBtn.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); try { previewContainer.parentNode && previewContainer.parentNode.removeChild(previewContainer); } catch(_){} window.__inlineRemoveImage = true; });

                                                imageLabel.appendChild(clearBtn);
                                                outer.appendChild(imageLabel);
                                                previewContainer.appendChild(outer);
                                                window.__inlineRemoveImage = false;
                                            } catch(_){ }
                                        };

                    // Enter inline EDIT mode: prefill editor, show existing assets, switch Send->Update, add Cancel
                    window.startInlineEditFeedback = function(data){
                        try {
                            var hid = document.getElementById("inline_edit_feedback_input"); if (hid) hid.value = data.id || "";
                            // ensure inline parent_id hidden input exists and set it so inline edit submits with parent_id
                            try {
                                var inlinePid = document.getElementById('inline_parent_id_input');
                                if (!inlinePid) {
                                    var inlineForm = document.querySelector('.feedback-form');
                                    inlinePid = document.createElement('input');
                                    inlinePid.type = 'hidden';
                                    inlinePid.id = 'inline_parent_id_input';
                                    inlinePid.name = 'parent_id';
                                    if (inlineForm && inlineForm.appendChild) inlineForm.appendChild(inlinePid);
                                    else document.body.appendChild(inlinePid);
                                }
                                inlinePid.value = data.parent_id || '';
                            } catch(_) {}
                            if (window.__quillProjectFeedbackInline && window.__quillProjectFeedbackInline.root)
                                window.__quillProjectFeedbackInline.root.innerHTML = data.feedback_comment || "";
                            try { var raw = data.image_url || data.image || ""; if (raw){ var url = raw; if (url.indexOf('http')!==0){ url = (url.indexOf('/')===0? appUrl.replace(/\/$/,"") + url : appUrl.replace(/\/$/,"") + "/file/project/" + url); } window.showInlineImagePreviewFromUrl(url); } } catch(_){ }
                            try { var files = []; if (Array.isArray(data.reference_files_urls)) files = data.reference_files_urls; else if (Array.isArray(data.reference_files)) files = data.reference_files; else if (data.reference_file_url) files = [data.reference_file_url]; else if (data.reference_file) files = [data.reference_file]; window.renderInlineExistingFiles(files); } catch(_){ }
                            var sendBtn = document.getElementById(" ");
                            if (sendBtn){
                                // preserve the full original HTML (may include icons) so we can restore exactly on cancel
                                sendBtn._origHTML = sendBtn._origHTML || sendBtn.innerHTML;
                                try { sendBtn.innerHTML = 'Update'; } catch(_) { sendBtn.textContent = 'Update'; }
                            }
                            var actions = document.querySelector('.btn-actions-feedback .submit-feedback'); if (actions && !document.getElementById('inlineFeedbackCancelBtn')){ var cancel = document.createElement('button'); cancel.type='button'; cancel.id='inlineFeedbackCancelBtn'; cancel.className='btn btn-custom-close me-2'; cancel.textContent='Cancel'; cancel.addEventListener('click', function(){ try { window.cancelInlineEditFeedback(); } catch(_){ } }); actions.insertBefore(cancel, actions.firstChild); }
                        } catch(_){ }
                    };

                    // Exit inline EDIT mode and reset UI
                    window.cancelInlineEditFeedback = function(){
                        try {
                            // clear edit marker
                            var hid = document.getElementById('inline_edit_feedback_input'); if (hid) hid.value = '';

                            // clear any existing-files keep list and remove its preview
                            window.inlineExistingFilesKeep = [];
                            try {
                                var ex = document.getElementById('inline_existing_files_preview');
                                if (ex && ex.parentNode) ex.parentNode.removeChild(ex);
                            } catch(_){}

                            // remove image preview container and clear any stored image file
                            try {
                                var ip = document.getElementById('inline_feedback_image_preview');
                                if (ip && ip.parentNode) ip.parentNode.removeChild(ip);
                            } catch(_){}
                            window.__inlineFeedbackImageFile = null;

                            // clear native file inputs
                            try { var imgInp = document.getElementById('inline_feedback_image_input'); if (imgInp) imgInp.value = ''; } catch(_){}
                            try { var filesInp = document.getElementById('inline_feedback_files_input'); if (filesInp) filesInp.value = ''; } catch(_){}

                            // clear selected files array and file previews
                            try { window.inlineFeedbackSelectedFiles = []; renderInlineFilesPreview && renderInlineFilesPreview(); } catch(_){}

                            // clear Quill and fallback textarea
                            try {
                                if (window.__quillProjectFeedbackInline && window.__quillProjectFeedbackInline.root) {
                                    window.__quillProjectFeedbackInline.root.innerHTML = '';
                                    if (typeof window.__quillProjectFeedbackInline.setSelection === 'function') {
                                        try { window.__quillProjectFeedbackInline.setSelection(0); } catch(_){}
                                    }
                                }
                            } catch(_){}
                            try { var ta = document.getElementById('inline_feedback_comment'); if (ta) ta.value = ''; } catch(_){}

                            // restore send button text
                            try {
                                var sendBtn = document.getElementById('inlineFeedbackSendBtn');
                                if (sendBtn) {
                                    // restore the preserved original innerHTML if available, else fallback to simple text
                                    if (sendBtn._origHTML) {
                                        try { sendBtn.innerHTML = sendBtn._origHTML; } catch(_) { sendBtn.textContent = sendBtn._origHTML; }
                                    } else {
                                        try { sendBtn.innerHTML = 'Send'; } catch(_) { sendBtn.textContent = 'Send'; }
                                    }
                                }
                            } catch(_){ }

                            // remove cancel button
                            try { var cancel = document.getElementById('inlineFeedbackCancelBtn'); if (cancel && cancel.parentNode) cancel.parentNode.removeChild(cancel); } catch(_){}

                            // reset remove-image flag
                            window.__inlineRemoveImage = false;
                        } catch(_){ }
                    };
                })();

                // Send button: collect quill content + files and POST to /project-feedbacks
                try {
                    var sendBtn = document.getElementById(
                        "inlineFeedbackSendBtn"
                    );
                    if (sendBtn) {
                        sendBtn.addEventListener("click", function () {
                            try {
                                var q = window.__quillProjectFeedbackInline;
                                // prefer Quill content, fallback to hidden textarea
                                var html = "";
                                try {
                                    if (q && q.root)
                                        html = q.root.innerHTML || "";
                                } catch (_) {
                                    html = "";
                                }
                                try {
                                    if (
                                        (!html ||
                                            String(html)
                                                .replace(/<[^>]+>/g, "")
                                                .trim() === "") &&
                                        document.getElementById(
                                            "inline_feedback_comment"
                                        )
                                    ) {
                                        var ta = document.getElementById(
                                            "inline_feedback_comment"
                                        );
                                        if (ta) html = ta.value || html;
                                    }
                                } catch (_) {}

                                // allow empty comment only if at least one file is attached (image or reference)
                                var hasImage = false,
                                    hasRefFiles = false;
                                try {
                                    if (window.__inlineFeedbackImageFile) {
                                        hasImage = true;
                                    } else {
                                        var pi = document.getElementById(
                                            "inline_feedback_image_input"
                                        );
                                        if (pi && pi.files && pi.files.length)
                                            hasImage = true;
                                    }
                                } catch (_) {}
                                try {
                                    if (
                                        window.inlineFeedbackSelectedFiles &&
                                        window.inlineFeedbackSelectedFiles
                                            .length
                                    )
                                        hasRefFiles = true;
                                    else {
                                        var fi = document.getElementById(
                                            "inline_feedback_files_input"
                                        );
                                        if (fi && fi.files && fi.files.length)
                                            hasRefFiles = true;
                                    }
                                } catch (_) {}

                                var fd = new FormData();
                                fd.append("feedback_comment", html);
                                // include parent_id if replying via inline form
                                try {
                                    var pid = document.getElementById('inline_parent_id_input');
                                    if (pid && pid.value) fd.append('parent_id', pid.value);
                                } catch(_){}
                                fd.append("project_id", getMeta("project-id") || "");
                                fd.append(
                                    "employee_id",
                                    document.getElementById("projectFeedbackModal")?.getAttribute("data-employee-id") || ""
                                );

                                // attach image from preview (if available) or file input
                                try {
                                    if (window.__inlineFeedbackImageFile) {
                                        fd.append(
                                            "feedback_image",
                                            window.__inlineFeedbackImageFile
                                        );
                                    } else {
                                        var pi = document.getElementById(
                                            "inline_feedback_image_input"
                                        );
                                        if (pi && pi.files && pi.files.length)
                                            fd.append(
                                                "feedback_image",
                                                pi.files[0]
                                            );
                                    }
                                } catch (_) {}
                                try {
                                    // prefer selected files tracked in inlineFeedbackSelectedFiles
                                    if (
                                        window.inlineFeedbackSelectedFiles &&
                                        window.inlineFeedbackSelectedFiles
                                            .length
                                    ) {
                                        window.inlineFeedbackSelectedFiles.forEach(
                                            function (f) {
                                                fd.append(
                                                    "reference_files[]",
                                                    f
                                                );
                                            }
                                        );
                                    } else {
                                        var fi = document.getElementById(
                                            "inline_feedback_files_input"
                                        );
                                        if (fi && fi.files && fi.files.length) {
                                            Array.from(fi.files).forEach(
                                                function (f) {
                                                    fd.append(
                                                        "reference_files[]",
                                                        f
                                                    );
                                                }
                                            );
                                        }
                                    }
                                } catch (_) {}

                                // Detect inline edit mode
                                var editId = (document.getElementById('inline_edit_feedback_input')||{}).value || '';
                                var isEdit = String(editId).trim() !== '';
                                if (isEdit) {
                                    try {
                                        // include keep-list for existing files
                                        var keep = window.inlineExistingFilesKeep || [];
                                        fd.set('existing_reference_files', JSON.stringify(keep));
                                    } catch(_) {}
                                    try {
                                        // include remove_image flag
                                        if (typeof window.__inlineRemoveImage !== 'undefined') {
                                            fd.set('remove_image', window.__inlineRemoveImage ? '1' : '0');
                                        }
                                    } catch(_) {}
                                    // method override
                                    fd.append('_method','PUT');
                                }

                                // basic UI feedback
                                var original = sendBtn.innerHTML;
                                sendBtn.disabled = true;
                                sendBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>' + (isEdit ? 'Updating...' : 'Sending...');

                                // Optimistic UI: hide selected files preview immediately, but keep a backup to restore on failure
                                var _backupSelectedFiles = (window.inlineFeedbackSelectedFiles || []).slice();
                                try { window.inlineFeedbackSelectedFiles = []; renderInlineFilesPreview && renderInlineFilesPreview(); } catch (_) {}

                                var reqUrl = isEdit
                                    ? getMeta('app-url').replace(/\/$/, '') + '/project-feedbacks/' + editId
                                    : getMeta('app-url').replace(/\/$/, '') + '/project-feedbacks';
                                var reqMethod = 'POST';
                                fetch(reqUrl, {
                                    method: reqMethod,
                                    headers: {
                                        "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                                    },
                                    body: fd,
                                })
                                    .then(function (res) {
                                        if (!res.ok)
                                            return res
                                                .json()
                                                .then(function (j) {
                                                    return Promise.reject(j);
                                                });
                                        return res.json();
                                    })
                                    .then(function (data) {
                                        window.showFloatingAlert && window.showFloatingAlert(
                                            isEdit ? "Feedback updated" : "Feedback submitted",
                                            "success",
                                            2000
                                        );
                                        // reload feedback list
                                        try {
                                            loadFeedbackData(
                                                getMeta("project-id")
                                            );
                                        } catch (_) {}
                                        // clear editor and inputs
                                        try {
                                            // clear image input and preview
                                            if (
                                                document.getElementById(
                                                    "inline_feedback_image_input"
                                                )
                                            )
                                                document.getElementById(
                                                    "inline_feedback_image_input"
                                                ).value = "";
                                            window.__inlineFeedbackImageFile =
                                                null;
                                            var previewContainer =
                                                document.getElementById(
                                                    "inline_feedback_image_preview"
                                                );
                                            if (
                                                previewContainer &&
                                                previewContainer.parentNode
                                            ) {
                                                previewContainer.parentNode.removeChild(
                                                    previewContainer
                                                );
                                            }
                                        } catch (_) {}
                                        try {
                                            if (
                                                document.getElementById(
                                                    "inline_feedback_files_input"
                                                )
                                            )
                                                document.getElementById(
                                                    "inline_feedback_files_input"
                                                ).value = "";
                                        } catch (_) {}
                                        try {
                                            // clear selected files and preview
                                            window.inlineFeedbackSelectedFiles =
                                                [];
                                            renderInlineFilesPreview &&
                                                renderInlineFilesPreview();
                                        } catch (_) {}
                                        try {
                                            // fully reset Quill editor instance: dispose and re-initialize
                                            if (
                                                window.__quillProjectFeedbackInline &&
                                                typeof window.__quillProjectFeedbackInline ===
                                                    "object"
                                            ) {
                                                try {
                                                    window.__quillProjectFeedbackInline =
                                                        null;
                                                } catch (_) {}
                                            }
                                        } catch (_) {}
                                        try {
                                            initInlineFeedback &&
                                                initInlineFeedback();
                                        } catch (_) {}
                                        if (isEdit) {
                                            try { window.cancelInlineEditFeedback && window.cancelInlineEditFeedback(); } catch(_) {}
                                        }
                                    })
                                    .catch(function (err) {
                                        // restore preview from backup
                                        try {
                                            window.inlineFeedbackSelectedFiles =
                                                _backupSelectedFiles || [];
                                            renderInlineFilesPreview &&
                                                renderInlineFilesPreview();
                                        } catch (_) {}
                                        var msg = isEdit ? "Failed to update feedback" : "Failed to submit feedback";
                                        try {
                                            if (err && err.errors)
                                                msg = Object.values(
                                                    err.errors
                                                ).join("\n");
                                            else if (err && err.message)
                                                msg = err.message;
                                        } catch (_) {}
                                        window.showFloatingAlert &&
                                            window.showFloatingAlert(
                                                msg,
                                                "warning",
                                                4000
                                            );
                                    })
                                    .finally(function () {
                                        sendBtn.disabled = false;
                                        sendBtn.innerHTML = original;
                                    });
                            } catch (e) {
                                try {
                                    window.showFloatingAlert &&
                                        window.showFloatingAlert(
                                            "Failed to submit feedback",
                                            "warning"
                                        );
                                } catch (_) {}
                            }
                        });
                    }
                } catch (_) {}
            } catch (_) {}

            // show small inline image preview next to attach file icon
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
                    // avoid duplicate overlays
                    if (document.getElementById("inlineImagePreviewOverlay"))
                        return;

                    var overlay = document.createElement("div");
                    overlay.id = "inlineImagePreviewOverlay";
                    overlay.style.position = "fixed";
                    overlay.style.inset = "0";
                    overlay.style.zIndex = "9999";
                    overlay.style.background = "rgba(0,0,0,0.6)";
                    overlay.style.display = "flex";
                    overlay.style.alignItems = "center";
                    overlay.style.justifyContent = "center";

                    var box = document.createElement("div");
                    box.style.background = "#fff";
                    box.style.padding = "12px";
                    box.style.borderRadius = "8px";
                    box.style.maxWidth = "720px";
                    box.style.width = "90%";
                    box.style.maxHeight = "90%";
                    box.style.overflow = "auto";
                    box.style.boxShadow = "0 8px 30px rgba(0,0,0,0.4)";

                    // image
                    var imgWrap = document.createElement("div");
                    imgWrap.style.textAlign = "center";
                    imgWrap.style.marginBottom = "8px";
                    var img = document.createElement("img");
                    img.src = dataUrl;
                    img.style.maxWidth = "100%";
                    img.style.maxHeight = "60vh";
                    img.style.borderRadius = "6px";
                    imgWrap.appendChild(img);

                    // caption input (single-line-ish)
                    var caption = document.createElement("textarea");
                    caption.placeholder = "Add a caption...";
                    caption.style.width = "100%";
                    caption.style.minHeight = "56px";
                    caption.style.resize = "vertical";
                    caption.style.marginTop = "8px";
                    caption.style.padding = "8px";
                    caption.style.border = "1px solid #ddd";
                    caption.style.borderRadius = "6px";

                    // buttons wrapper
                    var actions = document.createElement("div");
                    actions.style.display = "flex";
                    actions.style.justifyContent = "flex-end";
                    actions.style.gap = "8px";
                    actions.style.marginTop = "10px";

                    var cancelBtn = document.createElement("button");
                    cancelBtn.type = "button";
                    // use existing project Cancel style
                    cancelBtn.className = "btn btn-custom-close";
                    cancelBtn.textContent = "Cancel";
                    // match modal footer .btn-custom-close appearance (inline because overlay isn't inside modal footer)
                    cancelBtn.style.backgroundColor = "#e3e4ee";
                    cancelBtn.style.color = "#444444";
                    cancelBtn.style.fontSize = "12px";
                    cancelBtn.style.padding = "10px";
                    cancelBtn.style.height = "45px";
                    cancelBtn.style.border = "none";
                    cancelBtn.style.borderRadius = "10px";
                    cancelBtn.style.minWidth = "120px";

                    var sendBtn = document.createElement("button");
                    sendBtn.type = "button";
                    // use existing project Send style (black submit button)
                    sendBtn.className = "btn btn-submit-black";
                    // use material icon as requested
                    sendBtn.innerHTML =
                        '<span class="material-symbols-outlined">send</span>';
                    sendBtn.setAttribute("aria-label", "Send");
                    sendBtn.style.padding = "6px 12px";
                    sendBtn.style.fontSize = "13px";

                    actions.appendChild(cancelBtn);
                    actions.appendChild(sendBtn);

                    box.appendChild(imgWrap);
                    box.appendChild(caption);
                    box.appendChild(actions);
                    overlay.appendChild(box);
                    document.body.appendChild(overlay);

                    // focus caption
                    try {
                        caption.focus();
                    } catch (_) {}

                    function cleanup() {
                        try {
                            var inp = document.getElementById(
                                "inline_feedback_image_input"
                            );
                            if (inp) inp.value = "";
                        } catch (_) {}
                        try {
                            if (overlay && overlay.parentNode)
                                overlay.parentNode.removeChild(overlay);
                        } catch (_) {}
                    }

                    cancelBtn.addEventListener("click", function () {
                        try {
                            cleanup();
                        } catch (_) {}
                    });

                    sendBtn.addEventListener("click", function () {
                        try {
                            var cap = (caption.value || "").trim();
                            var fd = new FormData();
                            fd.append("feedback_comment", cap || "");
                            fd.append(
                                "project_id",
                                getMeta("project-id") || ""
                            );
                            fd.append(
                                "employee_id",
                                document
                                    .getElementById("projectFeedbackModal")
                                    ?.getAttribute("data-employee-id") || ""
                            );

                            // Use the file from small preview if available, otherwise use the provided fileObj
                            var imageFileToUse =
                                window.__inlineFeedbackImageFile || fileObj;
                            if (imageFileToUse)
                                fd.append("feedback_image", imageFileToUse);

                            // UI feedback
                            var origText = sendBtn.innerHTML;
                            sendBtn.disabled = true;
                            sendBtn.innerHTML =
                                '<span class="spinner-border spinner-border-sm me-1"></span>Sending...';

                            var editId = (document.getElementById('inline_edit_feedback_input')||{}).value || '';
                            var isEdit = String(editId).trim() !== '';
                            if (isEdit) {
                                try {
                                    // include edit extras
                                    // existing files kept
                                    var keep = window.inlineExistingFilesKeep || [];
                                    fd.set('existing_reference_files', JSON.stringify(keep));
                                    // remove_image flag
                                    if (typeof window.__inlineRemoveImage !== 'undefined') {
                                        fd.set('remove_image', window.__inlineRemoveImage ? '1' : '0');
                                    }
                                    // ensure new files appended
                                    if (window.inlineFeedbackSelectedFiles && window.inlineFeedbackSelectedFiles.length){
                                        window.inlineFeedbackSelectedFiles.forEach(function(f){ fd.append('reference_files[]', f); });
                                    }
                                    // method override
                                    fd.append('_method','PUT');
                                } catch(_){}
                            }

                            var reqUrl = isEdit
                                ? getMeta('app-url').replace(/\/$/, '') + '/project-feedbacks/' + editId
                                : getMeta('app-url').replace(/\/$/, '') + '/project-feedbacks';
                            var reqMethod = 'POST';
                            fetch(reqUrl, {
                                method: reqMethod,
                                headers: {
                                    "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                                },
                                body: fd,
                            })
                                .then(function (res) {
                                    if (!res.ok)
                                        return res.json().then(function (j) {
                                            return Promise.reject(j);
                                        });
                                    return res.json();
                                })
                                .then(function (data) {
                                    window.showFloatingAlert && window.showFloatingAlert(
                                        isEdit ? "Feedback updated" : "Feedback submitted",
                                        "success",
                                        2000
                                    );
                                    try {
                                        loadFeedbackData(getMeta("project-id"));
                                    } catch (_) {}
                                    cleanup();
                                    if (isEdit) {
                                        try { cancelInlineEditFeedback(); } catch(_){}
                                    }
                                    try {
                                        if (window.__quillProjectFeedbackInline)
                                            window.__quillProjectFeedbackInline.root.innerHTML =
                                                "";
                                    } catch (_) {}
                                    // Clear small image preview
                                    try {
                                        window.__inlineFeedbackImageFile = null;
                                        var previewContainer =
                                            document.getElementById(
                                                "inline_feedback_image_preview"
                                            );
                                        if (
                                            previewContainer &&
                                            previewContainer.parentNode
                                        ) {
                                            previewContainer.parentNode.removeChild(
                                                previewContainer
                                            );
                                        }
                                    } catch (_) {}
                                })
                                .catch(function (err) {
                                    var msg = "Failed to submit feedback";
                                    try {
                                        if (err && err.errors)
                                            msg = Object.values(
                                                err.errors
                                            ).join("\n");
                                        else if (err && err.message)
                                            msg = err.message;
                                    } catch (_) {}
                                    window.showFloatingAlert &&
                                        window.showFloatingAlert(
                                            msg,
                                            "warning",
                                            4000
                                        );
                                })
                                .finally(function () {
                                    sendBtn.disabled = false;
                                    sendBtn.innerHTML = origText;
                                });
                        } catch (_) {}
                    });
                } catch (_) {}
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

            function showReplyFeedbackForm(projectId, parentId) {
                try {
                    // DEBUG: mark when our handler runs (helps detect cached/other handlers)
                    try { if (modalBody && modalBody.setAttribute) modalBody.setAttribute('data-reply-handler','project_detail.js'); } catch(_){}

                    // If an inline feedback form exists on the page, insert the preview there and set a hidden parent_id.
                    try {
                        var inlineForm = document.querySelector('.feedback-form');
                        if (inlineForm) {
                            // ensure inline editor initialized
                            try { initInlineFeedback && initInlineFeedback(); } catch(_){}

                            // create or update hidden parent id input
                            try {
                                var inlinePid = inlineForm.querySelector('#inline_parent_id_input');
                                if (!inlinePid) {
                                    inlinePid = document.createElement('input');
                                    inlinePid.type = 'hidden';
                                    inlinePid.id = 'inline_parent_id_input';
                                    inlinePid.name = 'parent_id';
                                    inlineForm.appendChild(inlinePid);
                                }
                                inlinePid.value = parentId || '';
                            } catch(_){}

                            // prepare preview container inside inline form (place near files preview)
                            try {
                                var previewContainer = inlineForm.querySelector('#reply_parent_preview_inline');
                                if (!previewContainer) {
                                    previewContainer = document.createElement('div');
                                    previewContainer.id = 'reply_parent_preview_inline';
                                }
                                // default preview while fetching (simple placeholder)
                                previewContainer.innerHTML = '<div class="selected-files-list mt-2"><div class="d-flex align-items-center gap-2 p-2 rounded bg-light selected-task"><div style="width:28px;height:28px;border-radius:50%;overflow:hidden;flex:0 0 28px;display:flex;align-items:center;justify-content:center;"><span class="material-symbols-outlined">person</span></div><div class="flex-grow-1" style="font-size: 10px;"><div style="font-weight:500;font-size:11px">Unknown</div><div style="font-size:10px;color:#6b6b6b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:240px;">&nbsp;</div></div><button type="button" class="btn btn-sm btn-remove-task remove-task" style="line-height: 1; font-size: 10px;"><span class="material-symbols-outlined">close</span></button></div></div>';

                                // fetch project feedback list, then find the specific feedback/reply by parentId
                                try {
                                    fetch(getMeta('app-url').replace(/\/$/, '') + '/project-feedbacks/' + projectId)
                                        .then(function (res) {
                                            if (!res.ok) return res.json().then(Promise.reject);
                                            return res.json();
                                        })
                                        .then(function (json) {
                                            var payload = json && json.data ? json.data : json;
                                            var fb = null;
                                            try {
                                                function findById(node, id) {
                                                    if (!node) return null;
                                                    if (Array.isArray(node)) {
                                                        for (var k = 0; k < node.length; k++) {
                                                            var r = findById(node[k], id);
                                                            if (r) return r;
                                                        }
                                                        return null;
                                                    }
                                                    try {
                                                        if (node && String(node.id) === String(id)) return node;
                                                        if (node && node.replies && Array.isArray(node.replies)) {
                                                            var rr = findById(node.replies, id);
                                                            if (rr) return rr;
                                                        }
                                                    } catch (_ ) { }
                                                    return null;
                                                }
                                                fb = findById(payload, parentId);
                                            } catch (_) { fb = null; }
                                            var title = (fb && fb.employee && (fb.employee.name || fb.employee.fullname)) || (fb && (fb.employee_name || fb.employee_fullname)) || 'Unknown';
                                            var commentRaw = (fb && (fb.feedback_comment || fb.comment || fb.description)) || '';
                                            if (!fb) {
                                                // preview: feedback not found in payload (debug logging removed)
                                            }
                                            try {
                                                var empRaw = (fb && fb.employee) || {};
                                                var avatarRaw = empRaw.user_photo || empRaw.profile_picture || empRaw.photo || fb.employee_photo || '';
                                                var avatarUrl = resolveAvatar(avatarRaw);
                                                var plain = '';
                                                try { plain = (sanitizeHtml(commentRaw || '') || '').replace(/<[^>]+>/g, ''); } catch (_) { plain = (commentRaw || '') + ''; }
                                                if (plain && plain.length > 120) plain = plain.substring(0, 120).trim() + '...';
                                                var html = '';
                                                html += '<div class="selected-files-list mt-2">';
                                                html += '<div class="d-flex align-items-center gap-2 p-2 rounded bg-light selected-task">';
                                                html += '<div style="width:28px;height:28px;border-radius:50%;overflow:hidden;flex:0 0 28px;display:flex;align-items:center;justify-content:center;">';
                                                html += '<img src="' + avatarUrl + '" alt="avatar" style="width:28px;height:28px;object-fit:cover;display:block;">';
                                                html += '</div>';
                                                html += '<div class="flex-grow-1" style="font-size: 10px;">';
                                                html += '<div style="font-weight:500;font-size:11px">' + safeText(title) + '</div>';
                                                html += '<div style="font-size:10px;color:#6b6b6b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:240px;">' + (plain || '') + '</div>';
                                                html += '</div>';
                                                html += '<button type="button" class="btn btn-sm btn-remove-task remove-task" style="line-height: 1; font-size: 10px;"><span class="material-symbols-outlined">close</span></button>';
                                                html += '</div></div>';
                                                previewContainer.innerHTML = html;
                                            } catch (_) { }
                                            try {
                                                var btn = previewContainer.querySelector('.remove-task');
                                                if (btn) btn.addEventListener('click', function () { try { previewContainer.remove(); inlinePid.value = ''; } catch (_) { } });
                                            } catch (_) { }
                                        })
                                        .catch(function () {
                                            try {
                                                var btn = previewContainer.querySelector('.remove-task');
                                                if (btn) btn.addEventListener('click', function () { try { previewContainer.remove(); inlinePid.value = ''; } catch (_) { } });
                                            } catch (_) { }
                                        });
                                } catch (_) { }

                                // insert preview before inline files preview if present
                                try {
                                    var filesPreview = inlineForm.querySelector('#inline_feedback_files_preview');
                                    if (filesPreview && filesPreview.parentNode) filesPreview.parentNode.insertBefore(previewContainer, filesPreview);
                                    else inlineForm.insertBefore(previewContainer, inlineForm.querySelector('#inline_feedback_editor') || inlineForm.firstChild);
                                } catch(_){}
                            } catch(_){}

                            // focus inline editor
                            try { var q = window.__quillProjectFeedbackInline; if (!q) initInlineFeedback && initInlineFeedback(); q = window.__quillProjectFeedbackInline; if (q && typeof q.focus === 'function') q.focus(); } catch(_){}

                            return; // handled via inline form
                        }
                    } catch(_){}
                    // Resolve modal title/body with fallbacks in case DOM structure differs
                    try {
                        modalTitle = projectFeedbackModalEl.querySelector('.feedback-modal-title') || projectFeedbackModalEl.querySelector('.modal-title') || projectFeedbackModalEl.querySelector('[data-feedback-title]') || modalTitle;
                    } catch (_) {}
                    try {
                        modalBody = projectFeedbackModalEl.querySelector('.feedback-content') || projectFeedbackModalEl.querySelector('.modal-body') || projectFeedbackModalEl.querySelector('.modal-body-custom') || modalBody;
                    } catch (_) {}

                    // Title (guarded). Do NOT clear entire modalBody — we must keep feedback list visible.
                    if (modalTitle) modalTitle.textContent = "Reply Feedback";

                    // Always insert a minimal inline reply form + preview (we do not want the heavy server template here)
                    try { var existingReplyForm = modalBody && modalBody.querySelector && modalBody.querySelector('#replyFeedbackForm'); if (existingReplyForm) existingReplyForm.remove(); } catch (_) {}
                    var inlineFormHtml = '';
                    inlineFormHtml += '<form id="replyFeedbackForm" enctype="multipart/form-data">';
                    inlineFormHtml += '<input type="hidden" name="project_id" value="' + (projectId || '') + '">';
                    inlineFormHtml += '<input type="hidden" name="parent_id" value="' + (parentId || '') + '">';
                    inlineFormHtml += '<input type="hidden" name="employee_id" value="' + (projectFeedbackModalEl.getAttribute('data-employee-id') || '') + '">';
                    // only insert preview; the reply editor is not needed here — use the page's inline editor
                    inlineFormHtml += '<div id="reply_parent_preview" class="mt-2"></div>';
                    inlineFormHtml += '</form>';
                    modalBody.appendChild((function(){ var d=document.createElement('div'); d.innerHTML = inlineFormHtml; return d.firstChild; })());
                    // no editor is created here — we'll rely on the existing inline editor on the page
                    // remove any leftover heavy elements to keep UI consistent
                    try {
                        ['#feedback_image','#feedbackImageLabel','.custom-image-upload','#reply_feedback_editor','#reply_feedback_toolbar','#reply_reference_files','#reply_reference_files_preview'].forEach(function(s){ try{ var el=modalBody.querySelector(s); if(el) el.remove(); }catch(_){}});
                    } catch(_){}

                    // Fetch parent feedback and render preview (employee name + comment)
                    (function () {
                        try {
                            // fetch feedback list for the project and locate the target feedback/reply
                            fetch(getMeta("app-url").replace(/\/$/, "") + "/project-feedbacks/" + projectId)
                                .then(function (res) {
                                    if (!res.ok) return res.json().then(Promise.reject);
                                    return res.json();
                                })
                                .then(function (json) {
                                    var payload = json && json.data ? json.data : json;
                                    var fb = null;
                                    try {
                                        function findById(node, id) {
                                            if (!node) return null;
                                            if (Array.isArray(node)) {
                                                for (var k=0;k<node.length;k++){
                                                    var r = findById(node[k], id);
                                                    if (r) return r;
                                                }
                                                return null;
                                            }
                                            try {
                                                if (node && (String(node.id) === String(id))) return node;
                                                if (node && node.replies && Array.isArray(node.replies)) {
                                                    var rr = findById(node.replies, id);
                                                    if (rr) return rr;
                                                }
                                            } catch(_){}
                                            return null;
                                        }
                                        fb = findById(payload, parentId);
                                    } catch(_) { fb = null; }
                                    var title = (fb && fb.employee && (fb.employee.name || fb.employee.fullname)) || (fb && (fb.employee_name || fb.employee_fullname)) || "Unknown";
                                    if (!fb) {
                                        // modal preview: feedback not found in payload (debug logging removed)
                                    }
                                    var comment = (fb && (fb.feedback_comment || fb.comment || fb.description)) || "";
                                    // Insert preview immediately above the reply form so feedback list stays visible
                                    var previewEl = modalBody.querySelector("#reply_parent_preview");
                                    var replyFormEl = modalBody.querySelector('#replyFeedbackForm');
                                    if (!previewEl) {
                                        previewEl = document.createElement("div");
                                        previewEl.id = "reply_parent_preview";
                                        // place preview before form if possible, otherwise append to modalBody
                                        if (replyFormEl && replyFormEl.parentNode) replyFormEl.parentNode.insertBefore(previewEl, replyFormEl);
                                        else modalBody.appendChild(previewEl);
                                    }
                                    previewEl.innerHTML = "";
                                    // build preview using same markup as selected-files-list (small rounded light box)
                                    try {
                                        var plain = "";
                                        try {
                                            plain = (sanitizeHtml(comment || "") || "").replace(/<[^>]+>/g, "");
                                        } catch (_) {
                                            plain = (comment || "") + "";
                                        }
                                        var empRaw = (fb && fb.employee) || {};
                                        var avatarRaw = empRaw.user_photo || empRaw.profile_picture || empRaw.photo || fb.employee_photo || '';
                                        var avatarUrl = resolveAvatar(avatarRaw);
                                        var plain2 = plain || '';
                                        if (plain2 && plain2.length > 120) plain2 = plain2.substring(0,120).trim() + '...';
                                        var html = '';
                                        html += '<div class="selected-files-list mt-2">';
                                        html += '<div class="d-flex align-items-center gap-2 p-2 rounded bg-light selected-task">';
                                        html += '<div style="width:28px;height:28px;border-radius:50%;overflow:hidden;flex:0 0 28px;display:flex;align-items:center;justify-content:center;">';
                                        html += '<img src="'+avatarUrl+'" alt="avatar" style="width:28px;height:28px;object-fit:cover;display:block;">';
                                        html += '</div>';
                                        html += '<div class="flex-grow-1" style="font-size: 10px;">';
                                        html += '<div style="font-weight:500;font-size:11px">'+safeText(title)+'</div>';
                                        html += '<div style="font-size:10px;color:#6b6b6b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:240px;">'+(plain2||'')+'</div>';
                                        html += '</div>';
                                        html += '<button type="button" class="btn btn-sm btn-remove-task remove-task" style="line-height: 1; font-size: 10px;"><span class="material-symbols-outlined">close</span></button>';
                                        html += '</div></div>';
                                        previewEl.innerHTML = html;
                                        // attach close handler
                                        try {
                                            var btn = previewEl.querySelector('.remove-task');
                                            if (btn) btn.addEventListener('click', function () {
                                                try { previewEl.remove(); } catch (_) {}
                                            });
                                        } catch (_) {}
                                    } catch (_) {}
                                })
                                .catch(function () {
                                    // ignore fetch errors for preview
                                });
                        } catch (_) {}
                    })();

                    // File input preview handling
                    (function () {
                        try {
                            window.replyFeedbackSelectedFiles = window.replyFeedbackSelectedFiles || [];
                            var input = modalBody.querySelector("#reply_reference_files");
                            var preview = modalBody.querySelector("#reply_reference_files_preview");
                            if (!preview) {
                                preview = document.createElement("div");
                                preview.id = "reply_reference_files_preview";
                                (modalBody.querySelector('#reply_parent_preview') || modalBody).appendChild(preview);
                            }
                            function render() {
                                preview.innerHTML = "";
                                if (!window.replyFeedbackSelectedFiles || !window.replyFeedbackSelectedFiles.length) return;
                                var list = document.createElement("div");
                                list.className = "selected-files-list mt-2";
                                window.replyFeedbackSelectedFiles.forEach(function (file, idx) {
                                    var item = document.createElement("div");
                                    item.className = "selected-file-item d-flex align-items-center justify-content-between mb-2 p-2 bg-light border rounded";
                                    var info = document.createElement("div");
                                    info.className = "d-flex align-items-center flex-grow-1";
                                    var icon = document.createElement("span");
                                    icon.className = "material-symbols-outlined me-2";
                                    icon.textContent = "description";
                                    var name = document.createElement("span");
                                    name.className = "file-name";
                                    name.textContent = file.name;
                                    var size = document.createElement("small");
                                    size.className = "text-muted ms-1";
                                    size.textContent = " (" + (((file.size || 0) / 1024 / 1024).toFixed(2)) + " MB)";
                                    var rm = document.createElement("button");
                                    rm.type = "button";
                                    rm.className = "btn btn-sm btn-outline-danger";
                                    rm.innerHTML = "&times;";
                                    rm.onclick = function () {
                                        window.replyFeedbackSelectedFiles.splice(idx, 1);
                                        render();
                                    };
                                    info.appendChild(icon);
                                    info.appendChild(name);
                                    info.appendChild(size);
                                    item.appendChild(info);
                                    item.appendChild(rm);
                                    list.appendChild(item);
                                });
                                preview.appendChild(list);
                            }
                            if (input) {
                                input.addEventListener("change", function () {
                                    var files = Array.from(this.files || []);
                                    window.replyFeedbackSelectedFiles = (window.replyFeedbackSelectedFiles || []).concat(files);
                                    render();
                                    this.value = "";
                                });
                            }
                        } catch (_) {}
                    })();

                    // Submit button in footer (use existing footer helper)
                    try {
                        var footer = getProjectFeedbackFooter();
                        if (footer) {
                            footer.innerHTML = "";
                            var submitBtn = document.createElement("button");
                            submitBtn.type = "button";
                            submitBtn.className = "btn btn-submit-black w-100";
                            submitBtn.id = "addFeedbackButton";
                            submitBtn.textContent = "Submit";
                            submitBtn.addEventListener("click", function (e) {
                                e.preventDefault();
                                var form = modalBody.querySelector("#replyFeedbackForm");
                                if (!form) return;
                                // prefer Quill content from the initialized inline editor
                                var html = "";
                                try {
                                    var q = window.__quillProjectFeedbackInline;
                                    if (q && q.root) html = q.root.innerHTML || "";
                                } catch (_) { html = ""; }
                                try {
                                    if ((!html || String(html).replace(/<[^>]+>/g, "").trim() === "") && form.querySelector('#feedback_comment')) {
                                        var ta = form.querySelector('#feedback_comment');
                                        if (ta) html = ta.value || html;
                                    }
                                } catch (_) {}

                                var fd = new FormData(form);
                                // ensure feedback_comment in form data is set to Quill html (override if necessary)
                                try { fd.set('feedback_comment', html); } catch(_){}

                                try {
                                    if (window.replyFeedbackSelectedFiles && window.replyFeedbackSelectedFiles.length) {
                                        window.replyFeedbackSelectedFiles.forEach(function (f) {
                                            fd.append("reference_files[]", f);
                                        });
                                    }
                                } catch (_) {}

                                fetch(getMeta("app-url").replace(/\/$/, "") + "/project-feedbacks", {
                                    method: "POST",
                                    headers: {
                                        "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]').getAttribute("content"),
                                    },
                                    body: fd,
                                })
                                    .then(function (r) {
                                        return r.ok ? r.json() : r.json().then(Promise.reject);
                                    })
                                    .then(function (res) {
                                        try {
                                            window.showFloatingAlert && window.showFloatingAlert(res.message || "Reply submitted", "success", 1500);
                                        } catch (_) {}
                                        try {
                                            loadFeedbackData(projectId);
                                        } catch (_) {}
                                    })
                                    .catch(function (err) {
                                        var msg = (err && (err.message || (err.errors && Object.values(err.errors).join("\n")))) || "Failed to submit reply";
                                        window.showFloatingAlert && window.showFloatingAlert(msg, "warning", 3500);
                                    });
                            });
                            footer.appendChild(submitBtn);
                        }
                    } catch (_) {}
                } catch (e) {
                    console.warn("showReplyFeedbackForm error", e);
                }
            }

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

            // Delegate reply clicks to our handler to avoid conflicts with other scripts
            try {
                document.addEventListener('click', function (ev) {
                    try {
                        var trg = ev.target && ev.target.closest && ev.target.closest('.feedback-reply-trigger');
                        if (!trg) return;
                        ev.preventDefault();
                        var p = trg.getAttribute('data-project-id') || getMeta('project-id');
                        var f = trg.getAttribute('data-feedback-id');
                        if (!f) return;
                        // call our function if available
                        if (typeof showReplyFeedbackForm === 'function') {
                            showReplyFeedbackForm(p, f);
                            return;
                        }
                        if (typeof window.showReplyFeedbackForm === 'function') {
                            window.showReplyFeedbackForm(p, f);
                        }
                    } catch (_) {}
                }, true);
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

        // Edit button - open modal instead of navigation
        var $edit = $("<button>")
            .addClass("detail-icon")
            .attr("title", "Edit")
            .attr("type", "button")
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

        // Edit handler: open edit modal
        $edit.on("click", function (e) {
            e.preventDefault();
            var editUrl = appUrl.replace(/\/$/, "") + "/project/" + projectId + "/edit";

            // Fetch project data for edit modal
            $.ajax({
                url: editUrl,
                method: "GET",
                headers: { Accept: "application/json" },
                success: function (res) {
                    if (res) {
                        // Populate edit modal with project data
                        try {
                            if (window.populateEditProjectModal && typeof window.populateEditProjectModal === 'function') {
                                window.populateEditProjectModal(res);
                            }
                        } catch (err) {
                            console.error("Error populating edit modal:", err);
                        }

                        // Show edit modal
                        var editModalEl = document.getElementById("editProjectModal");
                        if (editModalEl) {
                            var bsModal = new bootstrap.Modal(editModalEl, {
                                backdrop: "static",
                                keyboard: false,
                            });
                            bsModal.show();
                        }
                    }
                },
                error: function (xhr) {
                    console.error("Error fetching project for edit", xhr);
                    if (typeof window.showFloatingAlert === "function")
                        window.showFloatingAlert(
                            "Failed to load project data for editing",
                            "warning",
                            3500
                        );
                    else alert("Failed to load project data for editing");
                },
            });
        });

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
                            "Project ID no found",
                            "warning",
                            3500
                        );
                    else alert("Project ID not found");
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
        $("#project-delete-description").html(
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
                            "Failed to load project data",
                            "warning",
                            3500
                        );
                    else alert("Failed to load project data");
                }
            },
            error: function (xhr) {
                console.error("Error fetching project", xhr);
                if (typeof window.showFloatingAlert === "function")
                    window.showFloatingAlert(
                        "Failed to load project data",
                        "warning",
                        3500
                    );
                else alert("Failed to load project data");
            },
        });
    }

    // Helper function to load divisions for edit modal
    function loadEditDivisions(departmentId, callback) {
        var divisionSelect = document.getElementById("edit_division");
        if (!divisionSelect) {
            if (callback) callback();
            return;
        }

        divisionSelect.innerHTML = '<option value="" disabled selected>Loading...</option>';
        var appUrl = getMeta("app-url") || "";

        $.ajax({
            url: appUrl.replace(/\/$/, "") + "/divisions-for-projects",
            type: "GET",
            data: { department_id: departmentId },
            dataType: "json",
            success: function (response) {
                var options = '<option value="" disabled selected>Select Division</option>';
                var divisions = response.data || [];
                divisions.forEach(function(div) {
                    options += '<option value="' + div.id + '">' + (div.name_division || div.name) + '</option>';
                });
                divisionSelect.innerHTML = options;
                divisionSelect.disabled = false;
                if (callback) callback();
            },
            error: function () {
                divisionSelect.innerHTML = '<option value="" disabled selected>Failed to load divisions</option>';
                if (typeof window.showFloatingAlert === "function") {
                    window.showFloatingAlert("Failed to load divisions", "warning", 3500);
                }
                if (callback) callback();
            },
        });
    }

    // Populate edit project modal with project data
    window.populateEditProjectModal = function(data) {
        try {
            // Set project ID
            $("#edit_project_id").val(data.id);

            // Set title
            $("#edit_title").val(data.title || "");

            // Set description (check if Quill editor exists)
            if (window.__quillProjectEdit && window.__quillProjectEdit.root) {
                window.__quillProjectEdit.root.innerHTML = data.description || "";
            }
            $("#edit_description").val(data.description || "");

            // Set image
            var editImageLabel = document.getElementById("editImageLabel");
            var editImageClearBtn = document.getElementById("editImageClearBtn");
            if (data.image && editImageLabel) {
                var appUrl = getMeta("app-url") || "";
                var imgUrl = data.image;
                if (!imgUrl.match(/^(https?:)?\/\//)) {
                    imgUrl = appUrl.replace(/\/$/, "") + "/file/project/" + imgUrl.replace(/^\//, "");
                }
                editImageLabel.style.backgroundImage = "url('" + imgUrl + "')";
                editImageLabel.style.backgroundSize = "cover";
                if (editImageClearBtn) editImageClearBtn.classList.remove("d-none");
            }

            // Get department from modal data attribute (employee's department)
            var modalEl = document.getElementById("editProjectModal");
            var employeeDeptId = null;
            if (modalEl) {
                // Try to get from hidden department select
                var deptSelect = document.getElementById("edit_department");
                if (deptSelect && deptSelect.options.length > 0) {
                    employeeDeptId = deptSelect.options[0].value;
                }
            }

            // Load divisions first, then set the selected division
            if (employeeDeptId) {
                loadEditDivisions(employeeDeptId, function() {
                    // After divisions loaded, set the selected division if data has it
                    if (data.division && data.division.id) {
                        $("#edit_division").val(data.division.id);
                    }
                });
            } else {
                // Fallback: just try to set division if available
                if (data.division && data.division.id) {
                    $("#edit_division").val(data.division.id);
                }
            }

            // Set dates
            $("#edit_start_date").val(data.start_date || "");
            $("#edit_due_date").val(data.due_date || "");

            // Set reference URLs
            var urlsContainer = $("#edit_project_reference_urls_container");
            if (urlsContainer.length) {
                urlsContainer.empty();
                var urls = data.reference_urls || [];
                if (!Array.isArray(urls) && data.reference_url) {
                    urls = [data.reference_url];
                }
                if (urls.length === 0) urls = [""];

                urls.forEach(function(url, idx) {
                    var inputGroup = $('<div class="input-group mb-2"></div>');
                    var input = $('<input type="url" class="form-control input-text" name="reference_urls[]" placeholder="https://example.com">').val(url);
                    var addBtn = $('<button type="button" class="btn btn-submit-black add-ref-url" aria-label="Add URL"><span class="material-symbols-outlined">add</span></button>');
                    var removeBtn = $('<button type="button" class="btn btn-outline-secondary remove-ref-url" aria-label="Remove URL"><span class="material-symbols-outlined">remove</span></button>');

                    inputGroup.append(input);
                    if (idx === 0) {
                        inputGroup.append(addBtn);
                    } else {
                        inputGroup.append(removeBtn);
                    }
                    urlsContainer.append(inputGroup);
                });
            }

            var existingFilesContainer = $("#existing_reference_files");
            if (existingFilesContainer.length) {
                existingFilesContainer.empty();
                var files = data.reference_files || [];

                if (files && files.length > 0) {
                    // Local helper for formatted display names (1-based index)
                    function formatRefDisplayNameLocal(origName, idx) {
                        try {
                            var ext = (String(origName || "").split('.').pop() || '').toLowerCase();
                            if (!ext || ext === origName) ext = '';
                            var num = Number(idx) + 1;
                            if (ext) return 'PROJECT_REF_FILE_' + num + '.' + ext;
                            return 'PROJECT_REF_FILE_' + num;
                        } catch (e) {
                            return String(origName || '');
                        }
                    }

                    files.forEach(function(fileName, idx) {
                        if (!fileName) return;

                        var isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
                        var fileDisplay = $('<div class="d-flex align-items-center justify-content-between bg-light rounded-2 px-3 py-2 mb-2"></div>')
                            .css({ color: '#444', fontSize: '0.9rem' });

                        var leftSection = $('<div class="d-flex align-items-center"></div>');

                        if (isImage) {
                            var imgPreview = $('<img>')
                                .attr('src', fileName)
                                .addClass('me-2')
                                .css({
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    border: 'none'
                                });
                            leftSection.append(imgPreview);
                        }

                        // Show formatted name but keep original filename in data attribute
                        var displayName = formatRefDisplayNameLocal(fileName, idx);
                        leftSection.append($('<span class="fw-normal text-truncate" style="font-size="16px""></span>').attr('data-filename', fileName).text(displayName));

                        var removeBtn = $('<button type="button" class="btn-close btn-sm ms-2 flex-shrink-0"></button>');
                        removeBtn.on("click", function() {
                            fileDisplay.remove();
                            var remaining = [];
                            existingFilesContainer.find("span.fw-normal").each(function() {
                                var orig = $(this).attr('data-filename') || $(this).text().trim();
                                if (orig) remaining.push(orig);
                            });
                            $("#existing_reference_files_input").val(JSON.stringify(remaining));
                        });

                        fileDisplay.append(leftSection);
                        fileDisplay.append(removeBtn);
                        existingFilesContainer.append(fileDisplay);
                    });

                    // Keep hidden input containing original filenames (for server)
                    $("#existing_reference_files_input").val(JSON.stringify(files));
                }
            }

            // Set co-authors and contributors
            if (window.clearSelectedCoAuthorsEdit) window.clearSelectedCoAuthorsEdit();
            if (window.clearSelectedContributorsEdit) window.clearSelectedContributorsEdit();

            if (data.co_authors && Array.isArray(data.co_authors)) {
                var coAuthors = data.co_authors.map(function(a) {
                    return {
                        id: a.id,
                        name: a.name || a.employee_name || "",
                        user_photo: a.user_photo || a.profile_picture || a.profile_picture_url || null,
                        division: a.division || a.division_name || ""
                    };
                });
                if (window.setSelectedCoAuthorsEdit) window.setSelectedCoAuthorsEdit(coAuthors);
            }

            if (data.contributors && Array.isArray(data.contributors)) {
                var contributors = data.contributors.map(function(c) {
                    return {
                        id: c.id,
                        name: c.name || c.employee_name || "",
                        user_photo: c.user_photo || c.profile_picture || c.profile_picture_url || null,
                        division: c.division || c.division_name || ""
                    };
                });
                if (window.setSelectedContributorsEdit) window.setSelectedContributorsEdit(contributors);
            }

        } catch (err) {
            console.error("Error populating edit project modal:", err);
        }
    };

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

        $(document).ready(function () {
            const pid = getMeta("project-id");
            if (!pid) return;

            const container = document.getElementById("ref-files-container");
            if (!container) return;

            container.innerHTML =
                '<div class="text-center py-3 w-100"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';

            const appBase = getMeta("app-url") ? getMeta("app-url").replace(/\/$/, "") : "";

            $.ajax({
                url: appBase + "/project/" + pid,
                method: "GET",
                dataType: "json",
                success: function (resp) {
                    const data = resp && resp.data ? resp.data : resp || {};

                    const urls = Array.isArray(data.reference_urls)
                        ? data.reference_urls
                        : Array.isArray(data.reference_url)
                        ? data.reference_url
                        : data.reference_url
                        ? [data.reference_url]
                        : [];

                    const files = Array.isArray(data.reference_files)
                        ? data.reference_files
                        : Array.isArray(data.reference_file)
                        ? data.reference_file
                        : data.reference_file
                        ? [data.reference_file]
                        : [];

                    container.innerHTML = "";

                    if (!urls.length && !files.length) {
                        container.innerHTML = '<div style="font-size:8px;color:#666;">No reference data available.</div>';
                        return;
                    }

                    function createRefItem(label, url, showImage, isFile) {
                        const item = document.createElement("div");
                        item.className =
                            "reference-files-list d-flex justify-content-between align-items-center bg-light rounded p-1 mb-1";
                        item.style.fontSize = "10px";

                        const left = document.createElement("div");
                        left.className = "d-flex justify-content-start align-items-center gap-2 me-2";

                        if (showImage) {
                            const img = document.createElement("img");
                            img.src = url;
                            img.width = 14;
                            img.height = 14;
                            img.style.objectFit = "cover";
                            img.style.borderRadius = "50%";
                            img.alt = "ref";
                            left.appendChild(img);
                        }

                        const title = document.createElement("a");
                        title.className = "text-decoration-none text-truncate fs-8";
                        title.href = url;
                        title.target = "_blank";
                        title.style.color = "#444";
                        title.textContent = label;
                        left.appendChild(title);

                        const right = document.createElement("div");
                        right.className = "d-flex justify-content-end align-items-center";

                        if (isFile) {
                            const dlBtn = document.createElement("button");
                            dlBtn.type = "button";
                            dlBtn.className = "btn btn-sm btn-link p-0 text-secondary";
                            dlBtn.title = "Download";
                            dlBtn.innerHTML =
                                '<span class="material-symbols-outlined" style="font-size: 16px;">download</span>';

                            dlBtn.addEventListener("click", function (ev) {
                                ev.preventDefault();
                                ev.stopPropagation();
                                const a = document.createElement("a");
                                a.style.display = "none";
                                a.href = url;
                                try {
                                    a.download = label.replace(/\s+/g, "_");
                                } catch (_) {}
                                a.target = "_blank";
                                document.body.appendChild(a);
                                a.click();
                                setTimeout(() => {
                                    try {
                                        document.body.removeChild(a);
                                    } catch (_) {}
                                }, 100);
                            });

                            right.appendChild(dlBtn);
                        }

                        item.appendChild(left);
                        item.appendChild(right);

                        return item;
                    }

                    urls.forEach((u, idx) => {
                        if (!u) return;
                        const label = "REFERENCE_URL_" + (idx + 1);
                        const item = createRefItem(label, u, false, false);
                        container.appendChild(item);
                    });

                    files.forEach((fileName, fidx) => {
                        if (!fileName) return;
                        let fileUrl = String(fileName || "");
                        const isAbs = fileUrl.startsWith("http://") || fileUrl.startsWith("https://");
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

                        const lower = String(fileName || "").toLowerCase();
                        const isImage =
                            /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(lower) ||
                            fileUrl.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i);

                        const label = "PROJECT_FILE_" + (fidx + 1);
                        const item = createRefItem(label, fileUrl, isImage, true);
                        container.appendChild(item);
                    });
                },
                error: function () {
                    container.innerHTML = "";
                    container.textContent = "Failed to load reference data.";
                },
            });
        });

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

        $(document).ready(function () {

                function populatePartOfProjectSelects(
                    currentProjectId = null,
                    currentProjectTitle = "",
                    currentPartOfProjectId = null,
                    currentPartOfProjectTitle = ""
                ) {
                    const input = document.getElementById(`${currentProjectId ? 'edit' : 'edit'}_part_of_project_input`);
                    const dropdown = document.getElementById(`${currentProjectId ? 'edit' : 'edit'}_part_of_project_dropdown`);
                    const selectedContainer = document.getElementById(`${currentProjectId ? 'edit' : 'edit'}_selected_project`);
                    const parentInputsContainer = document.getElementById(`${currentProjectId ? 'edit' : 'edit'}_parent_inputs`);

                    if (!input || !dropdown || !selectedContainer) {
                        console.warn("[populatePartOfProjectSelects] Elements not found for edit");
                        return;
                    }

                    let projects = [];
                    let selected = [];

                    function getInitialAvatar(name) {
                        const colors = ['#F44336','#E91E63','#9C27B0','#673AB7','#3F51B5','#2196F3','#03A9F4','#00BCD4','#009688','#4CAF50','#8BC34A','#FFC107','#FF9800','#FF5722','#795548'];
                        const color = colors[Math.floor(Math.random() * colors.length)];
                        const initial = (name || '?').charAt(0).toUpperCase();
                        return `<div style="width:28px;height:28px;border-radius:50%;background:${color};color:#fff;font-size:13px;font-weight:bold;display:flex;align-items:center;justify-content:center;">${initial}</div>`;
                    }

                    function renderSelected() {
                        selectedContainer.innerHTML = '';
                        if (!selected.length) return;
                        const frag = document.createDocumentFragment();
                        selected.forEach(p => {
                            const wrapper = document.createElement('div');
                            wrapper.className = 'd-inline-block me-2 mb-2';
                            wrapper.innerHTML = `
                                <div class="d-flex align-items-center gap-2 p-2 rounded bg-light selected-project" data-parent-id="${p.id}">
                                    ${p.image ? `<img src="${appUrl}/file/project/${p.image}" width="28" height="28" style="object-fit:cover;border-radius:50%;">` : getInitialAvatar(p.title)}
                                    <span class="flex-grow-1 text-truncate" style="max-width:160px;">${p.title}</span>
                                    <button type="button" class="btn btn-sm btn-remove-parent" style="line-height:1"><span class="material-symbols-outlined">close</span></button>
                                </div>
                            `;
                            wrapper.querySelector('.btn-remove-parent').addEventListener('click', () => {
                                selected = selected.filter(s => String(s.id) !== String(p.id));
                                updateHiddenInputs();
                                renderSelected();
                            });
                            frag.appendChild(wrapper);
                        });
                        selectedContainer.appendChild(frag);
                    }

                    function updateHiddenInputs() {
                        if (!parentInputsContainer) return;
                        parentInputsContainer.innerHTML = '';
                        selected.forEach(p => {
                            const inp = document.createElement('input'); inp.type='hidden'; inp.name='parent_project_ids[]'; inp.value = String(p.id);
                            parentInputsContainer.appendChild(inp);
                        });
                    }

                    function renderDropdown(filter = '') {
                        dropdown.innerHTML = '';
                        let filtered = projects.filter(p => p.title.toLowerCase().includes(filter.toLowerCase()));
                        if (currentProjectId) filtered = filtered.filter(p => String(p.id) !== String(currentProjectId));
                        filtered = filtered.filter(p => !selected.find(s => String(s.id) === String(p.id)));
                        filtered.forEach(p => {
                            const item = document.createElement('div'); item.className='dropdown-item d-flex align-items-center gap-2'; item.innerHTML = `${p.image ? `<img src="${appUrl}/file/project/${p.image}" width="24" height="24" style="object-fit:cover;border-radius:50%;">` : getInitialAvatar(p.title)}<span>${p.title}</span>`;
                            item.addEventListener('click', () => { selected.push({id:p.id,title:p.title,image:p.image}); updateHiddenInputs(); renderSelected(); input.value=''; dropdown.style.display='none'; });
                            dropdown.appendChild(item);
                        });
                        dropdown.style.display = filtered.length ? 'block' : 'none';
                    }

                    fetch(appUrl + '/project/index?task_scope=all').then(res => res.json()).then(payload => {
                        projects = (Array.isArray(payload) ? payload : payload.data) || [];
                        projects = projects.map(p => ({ id: p.id, title: p.title || p.name || 'Project ' + p.id, image: p.image || '', project_type: p.project_type || 'public' }));

                        if (currentPartOfProjectId) {
                            let arr = [];
                            if (Array.isArray(currentPartOfProjectId)) arr = currentPartOfProjectId.slice();
                            else if (typeof currentPartOfProjectId === 'string' || typeof currentPartOfProjectId === 'number') arr = [currentPartOfProjectId];
                            arr = arr.map(a => String(a));
                            arr.forEach(idStr => { const found = projects.find(p => String(p.id) === String(idStr)); if (found) selected.push({id:found.id,title:found.title,image:found.image}); else if (currentPartOfProjectTitle) selected.push({id:idStr,title:currentPartOfProjectTitle,image:''}); });
                            updateHiddenInputs(); renderSelected();
                        }
                    });

                    input.addEventListener('input', () => renderDropdown(input.value));
                    input.addEventListener('focus', () => renderDropdown(input.value));
                    document.addEventListener('click', (e) => { if (!dropdown.contains(e.target) && e.target !== input) dropdown.style.display = 'none'; });
                }

            $("#editProjectModal").on("shown.bs.modal", function (e) {
                const data = $(e.relatedTarget).data("project") || {};
                populatePartOfProjectSelects(
                    data.id,
                    data.title || "",
                    (typeof data.parent_project_ids !== 'undefined') ? data.parent_project_ids : (data.part_of_project || "")
                );
            });
        });

        // Image input helper for edit modal
        function setupImageInput(inputEl, labelEl, clearBtnEl) {
            if (!inputEl || !labelEl) return;

            // Handle file selection
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

            // Add paste event listener for screenshot
            labelEl.addEventListener("paste", function (e) {
                try {
                    e.preventDefault();
                    var items = (e.clipboardData || e.originalEvent.clipboardData).items;
                    for (var i = 0; i < items.length; i++) {
                        if (items[i].type.indexOf("image") !== -1) {
                            var blob = items[i].getAsFile();

                            // Create a DataTransfer object to simulate file input
                            var dataTransfer = new DataTransfer();
                            dataTransfer.items.add(blob);
                            inputEl.files = dataTransfer.files;

                            // Trigger change event to preview the image
                            var event = new Event('change', { bubbles: true });
                            inputEl.dispatchEvent(event);
                            break;
                        }
                    }
                } catch (err) {
                    console.warn('Paste screenshot failed:', err);
                }
            });

            // Make label focusable for paste
            labelEl.setAttribute("tabindex", "0");
            labelEl.style.cursor = "pointer";

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
                                            : ' <button type="button" class="btn btn-remove-url border-0 p-1 remove-ref-url" aria-label="Remove URL"><span class="material-symbols-outlined" style="color:#444444;">close</span></button>');
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
                                (typeof data.parent_project_ids !== 'undefined') ? data.parent_project_ids : (data.part_of_project || "")
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
                try { console.debug && console.debug('[debug] editProjectForm submit handler invoked'); } catch(_) {}
                e.preventDefault();
                if (isSubmitting) return;
                isSubmitting = true;
                var projectId = $("#edit_project_id").val();
                if (!projectId) {
                    if (typeof window.showFloatingAlert === "function")
                        window.showFloatingAlert(
                            "Project ID not found",
                            "warning",
                            3500
                        );
                    else alert("Project ID not found");
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
    });

    const EMP_CACHE_TTL_MS = 5 * 60 * 1000;
    const __empCache = { map: new Map(), inFlight: new Map() };

    function buildPhotoUrl(userPhoto, profilePicture, profilePictureUrl) {
        try {
            let candidate = profilePictureUrl || profilePicture || userPhoto;
            if (!candidate) return appUrl + '/asset/img/avatar.png';
            if (typeof candidate !== 'string') candidate = String(candidate || '');
            const up = candidate.trim();
            if (up.startsWith('http://') || up.startsWith('https://')) return up;
            if (up.startsWith('/')) return appUrl + up;
            if (up.startsWith('file/') || up.startsWith('asset/')) return appUrl + '/' + up;
            return appUrl + '/file/profile_picture/' + up;
        } catch (e) {
            console.warn('buildPhotoUrl error:', e);
            return appUrl + '/asset/img/avatar.png';
        }
    }

    function fetchEmployeesForExecutorCached(query = "") {
        try {
            const key = String(query || "").trim().toLowerCase();
            const now = Date.now();
            const cached = __empCache.map.get(key);
            if (cached && (now - cached.t) < EMP_CACHE_TTL_MS) {
                const d = $.Deferred();
                d.resolve(cached.v);
                return d.promise();
            }
            const inflight = __empCache.inFlight.get(key);
            if (inflight) return inflight;
            const jqPromise = $.ajax({
                url: appUrl + '/task/employees-for-executor',
                type: 'GET',
                data: { q: key },
                dataType: 'json'
            })
            .then(function (res) {
                __empCache.map.set(key, { v: res, t: Date.now() });
                __empCache.inFlight.delete(key);
                return res;
            })
            .catch(function (err) {
                __empCache.inFlight.delete(key);
                throw err;
            });
            __empCache.inFlight.set(key, jqPromise);
            return jqPromise;
        } catch (e) {
            console.warn('fetchEmployeesForExecutorCached error:', e);
            return $.ajax({
                url: appUrl + '/task/employees-for-executor',
                type: 'GET',
                data: { q: query },
                dataType: 'json'
            });
        }
    }


    function setupEditExecutorInput() {
        const $input = $('#edit_executor_input');
        const $dropdown = $('#edit_executor_dropdown');
        const $selectedContainer = $('#edit_selected_executors');
        const $hiddenInput = $('#edit_executors');

        if (!$input.length || !$dropdown.length || !$selectedContainer.length || !$hiddenInput.length) return;

        let employees = [];
        let filteredEmployees = [];
        let selectedEmployees = [];

        function fetchEmployees(query = "") {
            return fetchEmployeesForExecutorCached(query)
                .then((data) => {
                    employees = (data && (data.data || data)) || [];
                    employees = employees.filter(e => String(e.user_type || '').toUpperCase() !== 'ADMINISTRATOR');
                    filteredEmployees = employees;
                    renderDropdown();
                })
                .catch(() => showFloatingAlert?.("Failed to load employees.", "warning", 3000));
        }

        function renderDropdown() {
            if (!filteredEmployees.length) {
                $dropdown.html('<div class="dropdown-item disabled">No employees found</div>').show();
                return;
            }

            const html = filteredEmployees.map(emp => {
                const checked = selectedEmployees.some(e => e.id === emp.id) ? "checked" : "";
                const photoUrl = buildPhotoUrl(emp.user_photo, emp.profile_picture, emp.profile_picture_url);
                return `
                    <label class="dropdown-item d-flex align-items-center justify-content-between" style="cursor:pointer;">
                        <div class="d-flex align-items-center">
                            <img src="${photoUrl}" alt="${emp.name}" class="rounded-circle me-2" style="width:30px;height:30px;object-fit:cover;">
                            <div class="d-flex flex-column">
                                <span class="executor-name">${emp.name}</span>
                                <small class="text-muted executor-division">${emp.division || emp.division_name || ''}</small>
                            </div>
                        </div>
                        <input type="checkbox" class="executor-checkbox" data-id="${emp.id}" data-name="${emp.name}" ${checked}>
                    </label>
                `;
            }).join('');

            $dropdown.html(html).show();

            $dropdown.find('.executor-checkbox').on('change', function () {
                const id = parseInt($(this).data('id'));
                const name = $(this).data('name');
                const empData = employees.find(e => e.id === id);

                if ($(this).is(':checked')) {
                    if (!selectedEmployees.some(e => e.id === id)) {
                        selectedEmployees.push({
                            id,
                            name,
                            user_photo: empData?.user_photo || null,
                            division: empData?.division || empData?.division_name || ''
                        });
                    }
                } else {
                    selectedEmployees = selectedEmployees.filter(e => e.id !== id);
                }
                renderSelected();
                updateHiddenInput();
            });
        }

        function renderSelected() {
            $selectedContainer.empty();
            selectedEmployees.forEach(emp => {
                const photoUrl = buildPhotoUrl(emp.user_photo, emp.profile_picture, emp.profile_picture_url);
                const $badge = $(`
                    <span class="badge fw-normal bg-light d-inline-flex align-items-center me-2 mb-2">
                        <img src="${photoUrl}" alt="${emp.name}" class="rounded-circle me-2" style="width:24px;height:24px;object-fit:cover;">
                        <div class="d-flex flex-column">
                            <span>${emp.name || ''}</span>
                            <small class="text-muted executor-division">${emp.division || ''}</small>
                        </div>
                        <button type="button" class="btn-close btn-sm ms-2" aria-label="Remove"></button>
                    </span>
                `);

                $badge.find('.btn-close').on('click', () => {
                    selectedEmployees = selectedEmployees.filter(e => e.id !== emp.id);
                    renderSelected();
                    updateHiddenInput();
                    renderDropdown();
                });

                $selectedContainer.append($badge);
            });
        }

        function updateHiddenInput() {
            $hiddenInput.val(JSON.stringify(selectedEmployees.map(e => e.id)));
        }

        function filterEmployees(value) {
            const val = $.trim(value).toLowerCase();
            filteredEmployees = val === "" ? employees : employees.filter(e => e.name.toLowerCase().includes(val));
            renderDropdown();
        }

        $input.on('input focus', function () {
            filterEmployees($(this).val());
        });

        $(document).on('click', function (e) {
            if (!$input.is(e.target) && !$dropdown.is(e.target) && !$dropdown.has(e.target).length) {
                $dropdown.hide();
            }
        });

        fetchEmployees();

        window.clearSelectedExecutorsEdit = function () {
            selectedEmployees = [];
            renderSelected();
            updateHiddenInput();
            $dropdown.hide();
            $input.val('');
        };

        window.setSelectedExecutorsEdit = async function (executors) {
            try {
                const data = await fetchEmployeesForExecutorCached("");
                employees = (data && (data.data || data)) || [];
                employees = employees.filter(e => String(e.user_type || '').toUpperCase() !== 'ADMINISTRATOR');
            } catch (e) {
                console.warn("Gagal ambil data employee:", e);
            }

            selectedEmployees = executors.map(ex => {
                let photoUrl = "";
                const userPhoto = ex.user_photo;
                if (userPhoto) {
                    if (userPhoto.startsWith("http")) photoUrl = userPhoto;
                    else if (userPhoto.startsWith("/file/")) photoUrl = appUrl + userPhoto;
                    else if (userPhoto.startsWith("file/")) photoUrl = appUrl + "/" + userPhoto;
                    else photoUrl = appUrl + "/file/profile_picture/" + userPhoto;
                } else photoUrl = appUrl + "/asset/img/avatar.png";

                const empData = employees.find(e => e.id === ex.id);
                const divisionName = empData ? (empData.division || empData.division_name || "") : "";

                return { id: ex.id, name: ex.name, user_photo: photoUrl, division: divisionName };
            });

            renderSelected();
            updateHiddenInput();
        };
    }

    setupEditExecutorInput();

    try {
        const $editDivisionSel = $('#edit_task_division_id');
        if ($editDivisionSel.length) {
            let empDeptIdEdit = $('#taskFeedbackModal').data('employeeDepartmentId') || null;

            const populateEditDivisions = (d) => {
                if (!d || !d.data) return;
                let opts = '<option value="">Select Division</option>';
                $.each(d.data, function (_, div) {
                    const name = (div.name_division || div.name || '').trim();
                    opts += `<option value="${div.id}" data-name="${name}">${name}</option>`;
                });
                $editDivisionSel.html(opts);
            };

            // Load divisions
            const loadDivisions = (url) => {
                $.getJSON(url, populateEditDivisions)
                    .fail(() => console.warn('Failed to load divisions'));
            };

            if (empDeptIdEdit) {
                $.getJSON(`${appUrl}/divisions-for-projects?department_id=${encodeURIComponent(empDeptIdEdit)}`)
                    .done(populateEditDivisions)
                    .fail(() => loadDivisions(`${appUrl}/divisions-for-projects`));
            } else {
                loadDivisions(`${appUrl}/divisions-for-projects`);
            }

            // On division change
            $editDivisionSel.on('change', function () {
                const val = $(this).val();
                const selectedName = ($(this).find(':selected').data('name') || '').trim();

                if (!val) {
                    try { window.clearSelectedExecutors?.(); } catch (_) {}
                    return;
                }

                $.getJSON(`${appUrl}/employees-for-projects`)
                    .done((res) => {
                        const arr = res?.data || [];
                        const valStr = String(val).toLowerCase();
                        const nameStr = String(selectedName).toLowerCase();

                        let final = arr.filter(emp => String(emp.division_id || '').toLowerCase() === valStr);
                        if (!final.length)
                            final = arr.filter(emp => String(emp.division || '').toLowerCase() === nameStr);

                        if (!final.length)
                            return showFloatingAlert?.('No employees found for selected division.', 'warning', 2500);

                        window.setSelectedExecutorsEdit?.(final);
                    })
                    .fail(() => {
                        showFloatingAlert?.('Failed to load employees for division.', 'warning', 2500);
                    });
            });

            // Custom dropdown
            const $divisionDropdown = $('#edit_task_division_dropdown');
            if ($divisionDropdown.length) {
                const escapeHtml = (str) => String(str || '').replace(/[&<>"']/g, m => ({
                    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
                })[m]);

                const renderDivisionDropup = () => {
                    const opts = $editDivisionSel.find('option');
                    if (!opts.length) {
                        $divisionDropdown.html('<div class="division-item disabled">No divisions</div>').show();
                        return;
                    }

                    const html = opts.map((_, o) =>
                        `<div class="division-item" data-value="${$(o).val()}">${escapeHtml($(o).text())}</div>`
                    ).get().join('');

                    $divisionDropdown.html(html).show();

                    $divisionDropdown.find('.division-item').on('click', function () {
                        const v = $(this).data('value');
                        $editDivisionSel.val(v).trigger('change');
                        $divisionDropdown.hide();
                    });
                };

                const $activator = $('#edit_task_division_activator');

                $editDivisionSel.on('focus', renderDivisionDropup);
                ($activator.length ? $activator : $editDivisionSel).on('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    renderDivisionDropup();
                    $editDivisionSel.trigger('focus');
                });

                $editDivisionSel.on('keydown', (e) => {
                    if ([' ', 'Spacebar', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
                        e.preventDefault();
                        renderDivisionDropup();
                    }
                });

                $(document).on('click', (e) => {
                    if (!$editDivisionSel.is(e.target) && !$divisionDropdown.is(e.target) && !$divisionDropdown.has(e.target).length) {
                        $divisionDropdown.hide();
                    }
                });
            }
        }
    } catch (e) {
        console.warn('Failed to wire edit division->executors (jQuery version)', e);
    }
})(jQuery);

$("#fullscreen-feedback-btn").on("click", function () {
    const $feedbackContent = $(".feedback-detail-project .feedback-content-detail");
    const $icon = $(this).find("span.material-symbols-outlined");
    const $detailCard = $(".detail-project-card");

    if ($feedbackContent.hasClass("fullscreen")) {
        $feedbackContent.removeClass("fullscreen");
        $detailCard.removeClass("invisible");
        $icon.text("fullscreen");
        $("body").css("overflow", "auto");
    } else {
        $feedbackContent.addClass("fullscreen");
        $detailCard.addClass("invisible");
        $icon.text("fullscreen_exit");
        $("body").css("overflow", "hidden");
    }
});

// Global variable to store filtered project tasks
window.projectTasksCache = [];

// Helper functions for project task table rendering
function safeText(v) {
    return v === null || typeof v === "undefined" ? "-" : String(v);
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
    if (s.includes('new')) return '<span class="badge bg-secondary text-dark" style="background:#ecedf5 !important;">New</span>';
    if (s.includes('progress')) return '<span class="badge bg-info text-dark" style="background:#edebdf !important; color:#5b4b00;">In Progress</span>';
    if (s.includes('completed') || s.includes('complete')) return '<span class="badge bg-success text-dark" style="background:#e6f4ea !important; color:#0d5016;">Completed</span>';
    if (s.includes('rejected') || s.includes('reject')) return '<span class="badge bg-danger text-white" style="background:#f28b82 !important;">Rejected</span>';
    if (s.includes('cancelled') || s.includes('cancel')) return '<span class="badge bg-secondary text-white">Cancelled</span>';
    return '<span class="badge bg-light text-dark">' + (statusRaw || 'Unknown') + '</span>';
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

    function loadProjectsForEdit(prefix, selectedProjectId = null, callback) {
        const input = document.getElementById("edit_task_project_input");
                const dropdown = document.getElementById(`${prefix}_part_of_project_dropdown`);
                const selectedContainer = document.getElementById(`${prefix}_selected_project`);
                const parentInputsContainer = document.getElementById(`${prefix}_parent_inputs`);

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

                if (selectedProjectId) {
                    const project = projects.find(p => String(p.id) === String(selectedProjectId));
                    if (project) {
                        hiddenInput.value = project.id;
                        input.value = project.title;
                        showSelectedProject(project);
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

function handleProjectTaskEdit(taskId) {
    const modalEl = document.getElementById("editProjectTaskModal");
    if (!modalEl) {
        if (typeof showFloatingAlert === 'function') showFloatingAlert('Edit modal not found.', 'danger');
        return;
    }

    const detailEl = document.getElementById('taskDetailModal');
    if (detailEl) {
        detailEl.setAttribute('data-child-opened', '1');

        if (detailEl._timelineHiddenHandler) {
            detailEl.removeEventListener('hidden.bs.modal', detailEl._timelineHiddenHandler);
            detailEl._timelineHiddenHandlerBackup = detailEl._timelineHiddenHandler;
            detailEl._timelineHiddenHandler = null;
        }
    }

    const form = document.getElementById("editProjectTaskForm");
    form && form.reset();
    const idInput = document.getElementById("edit_task_id");
    if (idInput) idInput.value = taskId;

    const loader = document.getElementById("editProjectTaskModalLoader");
    if (loader) loader.classList.remove("d-none");

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

            try {
                const earlyParentSel = document.getElementById('edit_task_parent_id');
                if (earlyParentSel && t.parent_id) {
                    ensureParentOption(earlyParentSel, t.parent_id);
                }
            } catch (e) { console.warn('early ensureParentOption failed', e); }

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
                loadRelatedTasks(projectId, "edit_task", t.parent_id, (t.parent && t.parent.title) ? t.parent.title : "");
                ensureParentOption(document.getElementById("edit_task_parent_id"), t.parent_id);
            });

            const pointEl = document.getElementById("edit_task_point");
            if (pointEl) pointEl.value = t.point || 1;
            const prioEl = document.getElementById("edit_task_priority");
            if (prioEl) prioEl.value = (t.priority || '').toUpperCase();

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

                const startEl = document.getElementById("edit_task_start_date");
                const dueEl = document.getElementById("edit_task_due_date");
                if (startEl) startEl.value = (t.start_date || '').slice(0, 10);
                if (dueEl) dueEl.value = (t.due_date || '').slice(0, 10);

                const imgLabel = document.getElementById("editTaskImageLabel");
                const clearBtn = document.getElementById("editTaskImageClearBtn");
                if (imgLabel) {
                    if (t.image) {
                        let imgUrl = t.image;
                        if (typeof imgUrl === 'string') {
                            const isAbsolute = imgUrl.startsWith('http://') || imgUrl.startsWith('https://');
                            const isFileTask = imgUrl.startsWith('/file/task/') || imgUrl.startsWith('file/task/');
                            const isPublicPath = imgUrl.startsWith('/storage/') || imgUrl.startsWith('storage/');
                            if (!isAbsolute && !isFileTask && !isPublicPath) {
                                imgUrl = appUrl + '/file/task/' + imgUrl;
                            } else if (!isAbsolute && (isFileTask || isPublicPath)) {
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

            if (Array.isArray(t.executors) && typeof window.setSelectedExecutorsEdit === 'function') {
                window.setSelectedExecutorsEdit(t.executors.map(e => ({
                    id: e.id,
                    name: e.name,
                    user_photo: e.user_photo || e.photo || e.image || '',
                    division: e.division || e.division_name || ''
                })));
            }

            let refFiles = t.reference_files;
            if (typeof refFiles === 'string') {
                try { refFiles = JSON.parse(refFiles); }
                catch (e) { refFiles = refFiles.split(',').map(s => s.trim()).filter(Boolean); }
            }
            if (typeof window.displayExistingReferenceFiles === 'function') {
                window.displayExistingReferenceFiles(Array.isArray(refFiles) ? refFiles : []);
            }

        },
        error: function () {
            showFloatingAlert('Failed to load task data.', 'danger');
        },
        complete: function () {
            if (loader) loader.classList.add('d-none');
        }
    });
}

function handleProjectTaskDelete(taskId) {
    const $modal = $("#deleteProjectTaskModal");
    const modal = bootstrap.Modal.getOrCreateInstance($modal[0]);
    if (!$modal.length) return;

    $modal.data("taskId", taskId);
    $modal.find(".btn.btn-custom-close[data-bs-dismiss='modal']").text("Cancel");
    $modal.find("#confirmDeleteTaskBtn").text("Delete");

    // Placeholder loader
    const $body = $modal.find("#deleteProjectTaskContent");
    $body.html(`
        <div class="text-center p-3">
            <div class="spinner-border spinner-border-sm"></div>
        </div>
    `);

    modal.show();

    // Load task data
    $.getJSON(`${appUrl}/task/${taskId}`)
        .done(({ data: task = {} }) => {
            const imgUrl = formatTaskImage(task.image, task.title);
            const project = task.project || {};

            $body.html(`
                <div class="d-flex align-items-center mb-2">
                    ${imgUrl}
                    <div class="d-flex flex-column">
                        ${project.id ? `<p class="text-muted mb-1" style="font-size:10px;">${project.title || '-'}</p>` : ""}
                        <h5 class="mb-0 task-title" style="line-height:1.2;">${task.title || 'Untitled Task'}</h5>
                   </div>
                </div>
                <p class="task-description mb-2" style="font-size:14px;">${task.description || ''}</p>
                <hr class="task-separator rounded-4">
                <div class="d-flex justify-content-between mb-2" style="font-size:12px;">
                    <span><span style="color:#797E91;">Priority:</span>
                        <span style="color:${task.priority === 'HIGH' ? 'red' : '#4B4F5E'}">${task.priority || '-'}</span>
                    </span>
                    <span><span style="color:#797E91;">Deadline:</span>
                        <span style="color:#4B4F5E;">${task.due_date || '-'}</span>
                    </span>
                </div>
                <div class="d-flex justify-content-between" style="font-size:12px;">
                    <span class="text-muted">Department:</span>
                    <span>${project.department || '-'}</span>
                </div>
                <div class="d-flex justify-content-between" style="font-size:12px;">
                    <span class="text-muted">Division:</span>
                    <span>${project.division || '-'}</span>
                </div>
            `);
        })
        .fail(() => {
            $body.html(`<p class="text-danger text-center mb-0 p-3">Failed to load task info.</p>`);
        });

    // Confirm delete
    $("#confirmDeleteProjectTaskBtn")
        .off("click")
        .on("click", function () {
            $.ajax({
                url: `${appUrl}/task/${taskId}/soft-delete`,
                type: "PUT",
                headers: {
                    "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
                    "Accept": "application/json",
                },
            })
                .done((res) => {
                    if (typeof window.refreshTaskTreePartial === 'function') {
                        window.refreshTaskTreePartial();
                        $(`[data-task-id="${taskId}"]`).remove();
                        modal.hide();
                    } else {
                        var idStr = String(taskId);
                        (allTasks || []).forEach(function(t){
                            if (String(t.id) === idStr) {
                                t.parent_id = null;
                                t.parent_ids = [];
                            }
                        });
                        renderTaskList(allTasks);
                    }

                    showFloatingAlert?.(res.message || "Task deleted", "success", 1500);
                })
                .fail((xhr) => {
                    const msg = xhr?.responseJSON?.message || "Failed to delete task";
                    showFloatingAlert?.(msg, "danger", 3000);
                });
        });
}

function formatTaskImage(image, title = "") {
    if (!image) {
        const initials = getTaskInitials(title);
        const bg = getRandomColorFromText(title);
        return `
            <div class="rounded-circle d-flex align-items-center justify-content-center me-3"
                style="width:34px;height:34px;background:${bg};color:#fff;font-weight:600;font-size:11px;">
                ${initials}
            </div>
        `;
    }

    let imgUrl = image;
    const isAbs = /^https?:\/\//i.test(imgUrl);
    const isTask = /^\/?file\/task\//i.test(imgUrl);
    const isPublic = /^\/?storage\//i.test(imgUrl);
    if (!isAbs && !isTask && !isPublic) imgUrl = `${appUrl}/file/task/${imgUrl}`;
    else if (!isAbs && (isTask || isPublic)) imgUrl = `${appUrl}/${imgUrl.replace(/^\/?/, "")}`;

    return `
        <img src="${imgUrl}" alt="Task Image"
            class="rounded-circle me-3"
            style="width:34px;height:34px;object-fit:cover;"
            onerror="this.onerror=null;this.src='${appUrl}/asset/img/avatar.png'">
    `;
}

// Wire up Edit Task form behaviors on project detail page (image preview, files preview, submit)
(function(){
    try {
        // Provide local executor picker rendering if shared version not present
        if (typeof window.setSelectedExecutorsEdit !== 'function') {
            (function(){
                const container = document.getElementById('edit_selected_executors');
                const hiddenInput = document.getElementById('edit_executors');
                if (!container || !hiddenInput) { return; }

                let selectedEmployees = [];

                function buildPhotoUrl(raw){
                    try {
                        if (!raw) return appUrl + '/asset/img/avatar.png';
                        const s = String(raw).trim();
                        if (!s) return appUrl + '/asset/img/avatar.png';
                        if (/^https?:\/\//i.test(s)) return s;
                        if (s.startsWith('/')) return appUrl + s;
                        if (s.startsWith('file/photo') || s.startsWith('file/profile_picture')) return appUrl + '/' + s;
                        if (s.includes('/')) return appUrl + '/' + s;
                        return appUrl + '/file/profile_picture/' + s;
                    } catch(_) { return appUrl + '/asset/img/avatar.png'; }
                }

                function updateHidden(){
                    try { hiddenInput.value = JSON.stringify(selectedEmployees.map(e => e.id)); } catch(_) { hiddenInput.value = '[]'; }
                }

                function renderSelected(){
                    container.innerHTML = '';
                    selectedEmployees.forEach((emp, idx) => {
                        const badge = document.createElement('span');
                        badge.className = 'badge fw-normal bg-light d-inline-flex align-items-center me-2 mb-2';
                        const img = document.createElement('img');
                        img.src = buildPhotoUrl(emp.user_photo || emp.profile_picture || emp.profile_picture_url);
                        img.alt = emp.name || '';
                        img.className = 'rounded-circle me-2';
                        img.style.width = '24px';
                        img.style.height = '24px';
                        img.style.objectFit = 'cover';

                        const nameCol = document.createElement('div');
                        nameCol.className = 'd-flex flex-column';
                        const nameText = document.createElement('span');
                        nameText.textContent = emp.name || '';
                        nameText.style.marginBottom = '5px';
                        const divSmall = document.createElement('small');
                        divSmall.className = 'text-muted executor-division';
                        divSmall.textContent = emp.division || emp.division_name || '';
                        nameCol.appendChild(nameText);
                        nameCol.appendChild(divSmall);

                        const removeBtn = document.createElement('button');
                        removeBtn.type = 'button';
                        removeBtn.className = 'btn-close btn-sm ms-2';
                        removeBtn.setAttribute('aria-label','Remove');
                        removeBtn.addEventListener('click', function(){
                            selectedEmployees.splice(idx,1);
                            renderSelected();
                            updateHidden();
                        });

                        badge.appendChild(img);
                        badge.appendChild(nameCol);
                        badge.appendChild(removeBtn);
                        container.appendChild(badge);
                    });
                }

                window.clearSelectedExecutorsEdit = function(){
                    selectedEmployees = [];
                    renderSelected();
                    updateHidden();
                };

                window.setSelectedExecutorsEdit = function(executors){
                    try {
                        selectedEmployees = (executors || []).map(ex => ({
                            id: ex.id,
                            name: ex.name,
                            user_photo: ex.user_photo || ex.photo || ex.image || '',
                            division: ex.division || ex.division_name || ''
                        }));
                        renderSelected();
                        updateHidden();
                    } catch(e) {
                        console.warn('setSelectedExecutorsEdit failed', e);
                    }
                };
            })();
        }

        // Setup image input for edit task modal (reuse setupImageInput if available)
        const imgInput = document.getElementById('edit_task_image');
        const imgLabel = document.getElementById('editTaskImageLabel');
        const imgClear = document.getElementById('editTaskImageClearBtn');
        if (imgInput && imgLabel) {
            if (typeof window.setupImageInput === 'function') {
                try { window.setupImageInput(imgInput, imgLabel, imgClear); } catch(_) {}
            } else {
                // Fallback light preview logic
                imgInput.addEventListener('change', function(){
                    const file = this.files && this.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = function(e){
                            imgLabel.style.backgroundImage = `url('${e.target.result}')`;
                            imgLabel.classList.add('has-image');
                            imgLabel.style.opacity = '1';
                            imgClear && imgClear.classList.remove('d-none');
                        };
                        reader.readAsDataURL(file);
                    } else {
                        imgLabel.style.backgroundImage = `url('${appUrl}/asset/img/background/add-image.png')`;
                        imgLabel.classList.remove('has-image');
                        imgLabel.style.opacity = '0.5';
                        imgClear && imgClear.classList.add('d-none');
                    }
                });
                imgClear && imgClear.addEventListener('click', function(){
                    imgInput.value = '';
                    imgLabel.style.backgroundImage = `url('${appUrl}/asset/img/background/add-image.png')`;
                    imgLabel.classList.remove('has-image');
                    imgLabel.style.opacity = '0.5';
                    imgClear.classList.add('d-none');
                });
            }
        }

        // Preview/edit selected reference files for edit task
        const filesInput = document.getElementById('edit_task_reference_files');
        const filesPreview = document.getElementById('edit_reference_files_preview');
        // Store selected files in a global to reuse on submit
        window.editSelectedFiles = window.editSelectedFiles || [];

        function displayEditSelectedFiles(){
            if (!filesPreview) return;
            const list = window.editSelectedFiles || [];
            filesPreview.innerHTML = '';
            if (!list.length) return;
            list.forEach((file, idx) => {
                const item = document.createElement('div');
                item.className = 'preview-file-item d-flex align-items-center justify-content-between mb-2 p-2 bg-light border-0 rounded';
                const info = document.createElement('div');
                info.className = 'd-flex align-items-center flex-grow-1';
                const icon = document.createElement('span');
                icon.className = 'material-symbols-outlined me-2';
                icon.textContent = (file.type || '').startsWith('image/') ? 'image' : 'attach_file';
                const name = document.createElement('span');
                name.textContent = file.name;
                info.appendChild(icon);
                info.appendChild(name);
                const removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.className = 'border-0 bg-transparent';
                removeBtn.innerHTML = '<span class="material-symbols-outlined" style="color:#444444;">close</span>';
                removeBtn.addEventListener('click', function(){
                    try {
                        window.editSelectedFiles.splice(idx, 1);
                        displayEditSelectedFiles();
                    } catch(_) {}
                });
                item.appendChild(info);
                item.appendChild(removeBtn);
                filesPreview.appendChild(item);
            });
        }

        if (filesInput) {
            filesInput.addEventListener('change', function(){
                const chosen = Array.from(this.files || []);
                window.editSelectedFiles = chosen; // overwrite with latest selection
                displayEditSelectedFiles();
            });
        }

        // Provide minimal existing files renderer if not present
        if (typeof window.displayExistingReferenceFiles !== 'function') {
            window.displayExistingReferenceFiles = function(files){
                try {
                    const container = document.getElementById('existing_reference_files');
                    if (!container) return;
                    container.innerHTML = '';
                    (files || []).forEach((f) => {
                        const div = document.createElement('div');
                        div.className = 'd-flex align-items-center gap-2 mb-1';
                        const icon = document.createElement('span'); icon.className = 'material-symbols-outlined'; icon.textContent = 'insert_drive_file';
                        const a = document.createElement('a'); a.href = (typeof f === 'string') ? (f.startsWith('http') ? f : (appUrl + '/' + f.replace(/^\//,''))) : '#'; a.textContent = (f.name || f.file_name || f) || 'file'; a.target = '_blank';
                        div.appendChild(icon); div.appendChild(a);
                        container.appendChild(div);
                    });
                } catch(_) {}
            };
        }

        // Submit handler for edit task (works on project detail page)
        const editForm = document.getElementById('editProjectTaskForm');
        if (editForm && !editForm._boundSubmitHandler) {
            editForm.addEventListener('submit', function(e){
                e.preventDefault();

                // Sync Quill editor to hidden textarea if present
                try {
                    if (window.__quillTaskEdit && window.__quillTaskEdit.root) {
                        const ta = document.getElementById('edit_task_description');
                        if (ta) ta.value = window.__quillTaskEdit.root.innerHTML;
                    }
                } catch(_) {}

                const taskIdEl = document.getElementById('edit_task_id');
                const taskId = taskIdEl && taskIdEl.value;
                if (!taskId) {
                    try { showFloatingAlert('Task ID is missing.', 'warning', 2500); } catch(_) { alert('Task ID is missing.'); }
                    return;
                }

                if (!editForm.checkValidity()) {
                    editForm.classList.add('was-validated');
                    return;
                }
                editForm.classList.remove('was-validated');

                // Optional: ensure at least one executor selected if widget present
                try {
                    const execHidden = document.getElementById('edit_executors');
                    if (execHidden) {
                        let arr = [];
                        if (execHidden.value) { try { arr = JSON.parse(execHidden.value); } catch(_) { arr = []; } }
                        if (!Array.isArray(arr) || arr.length === 0) {
                            try { showFloatingAlert('Please select at least one executor.', 'warning', 2500); } catch(_) {}
                            return;
                        }
                    }
                } catch(_) {}

                const loader = document.getElementById('editProjectTaskModalLoader');
                loader && loader.classList.remove('d-none');
                const submitBtn = editForm.querySelector("button[type='submit']");
                if (submitBtn) submitBtn.disabled = true;

                const fd = new FormData(editForm);
                fd.append('_method', 'PUT');

                // Append reference files selected in preview
                try {
                    const files = Array.isArray(window.editSelectedFiles) ? window.editSelectedFiles : [];
                    // Clear any existing so we avoid duplicates
                    try { fd.delete('reference_files[]'); } catch(_) {}
                    files.forEach(f => fd.append('reference_files[]', f));
                } catch(_) {}

                $.ajax({
                    url: appUrl + '/task/' + encodeURIComponent(String(taskId)),
                    type: 'POST',
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                        'Accept': 'application/json'
                    },
                    data: fd,
                    processData: false,
                    contentType: false,
                    success: function(res){
                        try { showFloatingAlert(res && (res.message || res.status) ? (res.message || 'Task updated successfully.') : 'Task updated successfully.', 'success', 2500); } catch(_) {}
                        // Close edit modal
                        try {
                            const modalEl = document.getElementById('editProjectTaskModal');
                            const instance = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
                            instance.hide();
                        } catch(_) {}

                        if (typeof window.refreshTaskTreePartial === 'function') {
                            window.refreshTaskTreePartial();
                            $(`[data-task-id="${taskId}"]`).remove();
                            modal.hide();
                        } else {
                            var idStr = String(taskId);
                            (allTasks || []).forEach(function(t){
                                if (String(t.id) === idStr) {
                                    t.parent_id = null;
                                    t.parent_ids = [];
                                }
                            });
                            renderTaskList(allTasks);
                        }
                    },
                    error: function(xhr){
                        let msg = 'Failed to update task.';
                        try {
                            if (xhr.responseJSON && xhr.responseJSON.errors) {
                                msg = Object.values(xhr.responseJSON.errors).flat().join('\n');
                            } else if (xhr.responseJSON && xhr.responseJSON.message) {
                                msg = xhr.responseJSON.message;
                            }
                        } catch(_) {}
                        try { showFloatingAlert(msg, 'danger', 3000); } catch(_) { alert(msg); }
                    },
                    complete: function(){
                        loader && loader.classList.add('d-none');
                        if (submitBtn) submitBtn.disabled = false;
                    }
                });
            });
            // guard against double-binding
            editForm._boundSubmitHandler = true;
        }
    } catch(_) {}
})();

// Function to render project task table with filtered data
function renderProjectTaskTable() {
    try {
        const section = document.getElementById('task-table-section-detail');
        if (!section) return;
        const tbody = section.querySelector('tbody');
        if (!tbody) return;

        const tasks = window.projectTasksCache || [];
        if (!Array.isArray(tasks)) return;

        // Sort by due_date asc, then start_date
        const parseDate = d => {
            try {
                const x = new Date(d);
                return isNaN(x) ? null : x.getTime();
            } catch(_) {
                return null;
            }
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

            // Build project image
            let taskImgHtml = '';
            const titleForInitials = taskTitle || projectTitle || 'NA';
            const initials = (function(text){
                const s = String(text || '').trim();
                if (!s) return 'NA';
                const parts = s.split(/\s+/).filter(Boolean);
                if (parts.length === 1) return parts[0].substring(0,2).toUpperCase();
                return (parts[0][0] + parts[parts.length-1][0]).toUpperCase();
            })(titleForInitials);

            const bgColor = (function(key){
                const colors = ['#6A5AE0','#FF8A3C','#00A881','#D4526E','#3E8EDE','#546E7A','#8E44AD','#2E7D32','#AD1457','#EF6C00'];
                if (!key) return colors[0];
                let hash=0;
                for (let i=0;i<key.length;i++){
                    hash = (hash*31 + key.charCodeAt(i))>>>0;
                }
                return colors[hash % colors.length];
            })(titleForInitials);

            // Resolve project image
            const projectImg = (function() {
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

            if (projectImg) {
                taskImgHtml = `<img src="${projectImg}" alt="Project Image" class="rounded-circle" width="40" height="40" style="object-fit:cover;" onerror="this.onerror=null;this.src='${appUrl}/asset/img/avatar.png'">`;
            } else {
                taskImgHtml = `<div class="rounded-circle d-inline-flex align-items-center justify-content-center" style="width:40px;height:40px;background:${bgColor};color:#fff;font-size:12px;font-weight:600;">${initials}</div>`;
            }

            html += `
                <tr data-task-id="${t.id}">
                    <td>
                        <div class="d-flex align-items-center gap-3">
                            ${taskImgHtml}
                            <div>
                                <div class="task-name-wrapper fw-semibold" style="font-size: 14px; cursor: pointer;" onclick="handleProjectTaskDetail(${t.id})">${taskTitle}</div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div class="d-inline-flex align-items-center gap-2">
                            <span>${picName}</span>
                        </div>
                    </td>
                    <td>${execCell}</td>
                    <td>${startStr || '-'}</td>
                    <td>${dueStr || '-'}</td>
                    <td>${st}</td>
                    <td>
                        <span class="material-symbols-outlined" style="color: #444444; font-size: 20px; cursor: pointer;">
                            more_vert
                        </span>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html || '<tr><td colspan="6" class="text-center text-muted">No tasks found for this project</td></tr>';

        initTaskMoreDropdowns();

        // Re-init tooltips for avatars
        try {
            if (typeof initBootstrapTooltips === 'function') {
                initBootstrapTooltips(section);
            } else {
                // Fallback: initialize tooltips manually
                const tooltipElements = section.querySelectorAll('[data-bs-toggle="tooltip"]');
                tooltipElements.forEach(el => {
                    new bootstrap.Tooltip(el);
                });
            }
        } catch(_) {}

    } catch(e) {
        console.error('Error rendering project task table:', e);
    }
}

function initTaskMoreDropdowns() {
    document.querySelectorAll('#task-table-section-detail .material-symbols-outlined').forEach(icon => {
        icon.removeEventListener('click', icon._dropdownHandler || (()=>{}));

        icon._dropdownHandler = function (e) {
            e.stopPropagation();
            const existing = document.querySelector('.task-dropdown-menu');
            if (existing) existing.remove();

            const tr = icon.closest('tr');
            const taskId = tr?.getAttribute('data-task-id') || '';

            // Buat dropdown element
            const dropdown = document.createElement('div');
            dropdown.className = 'task-dropdown-menu position-absolute shadow bg-white rounded-3 border';
            dropdown.style.minWidth = '150px';
            dropdown.style.zIndex = 9999;
            dropdown.innerHTML = `
                <div class="dropdown-item p-2 px-3" style="cursor:pointer;">Detail</div>
                <div class="dropdown-item p-2 px-3" style="cursor:pointer;">Edit</div>
            `;

            document.body.appendChild(dropdown);

            // Posisi dropdown
            const rect = icon.getBoundingClientRect();
            dropdown.style.top = rect.bottom + 4 + 'px';
            dropdown.style.left = (rect.left - dropdown.offsetWidth + 85) + 'px';

            // Event klik
            const items = dropdown.querySelectorAll('.dropdown-item');
            items[0].addEventListener('click', () => {
                handleProjectTaskDetail(taskId);
                dropdown.remove();
            });
            items[1].addEventListener('click', () => {
                handleProjectTaskEdit(taskId);
                dropdown.remove();
            });

            // Tutup dropdown kalau klik di luar
            document.addEventListener('click', function onDocClick(ev) {
                if (!dropdown.contains(ev.target)) {
                    dropdown.remove();
                    document.removeEventListener('click', onDocClick);
                }
            });
        };

        icon.addEventListener('click', icon._dropdownHandler);
    });
}

// Function to load tasks for current project
function loadProjectTasks() {
    const projectId = document.querySelector('meta[name="project-id"]')?.getAttribute('content') || '';
    if (!projectId) {
        console.error('No project ID found');
        return;
    }

    // Show loading state
    const section = document.getElementById('task-table-section-detail');
    if (section) {
        const tbody = section.querySelector('tbody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center"><div class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden">Loading...</span></div> Loading tasks...</td></tr>';
        }
    }

    $.ajax({
        url: `${appUrl}/projects/${projectId}/tasks`,
        type: "GET",
        dataType: "json",
        success: function(response) {
            if (response.status === "success" && response.data) {
                window.projectTasksCache = response.data;
                renderProjectTaskTable();
            } else {
                window.projectTasksCache = [];
                renderProjectTaskTable();
            }
        },
        error: function(xhr, status, error) {
            console.error('Error loading project tasks:', error);
            window.projectTasksCache = [];
            const section = document.getElementById('task-table-section-detail');
            if (section) {
                const tbody = section.querySelector('tbody');
                if (tbody) {
                    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Failed to load tasks</td></tr>';
                }
            }
        }
    });
}

    $(document).on('click', '#listViewTaskDetail', function() {
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        const $btnList = $('#listViewTaskDetail');
        const $btnGrid = $('#gridViewTaskDetail');

        if (isMobile) {
            $('#task-table-section-detail').addClass('d-none');
            $('.detail-project-container').removeClass('d-none');
        } else {
            $('#task-table-section-detail').removeClass('d-none');
            $('.detail-project-container').addClass('d-none');
        }

        loadProjectTasks();
        $btnList.addClass('d-none');
        $btnGrid.removeClass('d-none');
        $btnGrid.find('span').text('grid_view');
        $btnGrid.attr('title', 'Grid View').tooltip('dispose').tooltip();
    });

    $(document).on('click', '#gridViewTaskDetail', function() {
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        const $btnList = $('#listViewTaskDetail');
        const $btnGrid = $('#gridViewTaskDetail');

        if (isMobile) {
            $('#task-table-section-detail').removeClass('d-none');
            $('.detail-project-container').addClass('d-none');
        } else {
            $('#task-table-section-detail').addClass('d-none');
            $('.detail-project-container').removeClass('d-none');
        }

        loadProjectTasks();
        $btnGrid.addClass('d-none');
        $btnList.removeClass('d-none');
        $btnList.find('span').text('list');
        $btnList.attr('title', 'List View').tooltip('dispose').tooltip();
    });
