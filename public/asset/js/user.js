var appUrl = $('meta[name="app-url"]').attr("content");

function showFloatingAlert(message, type = 'success', delayMs = 2500) {
    try {
        if (typeof window.showAlertMsg === 'function') {
            window.showAlertMsg(message, 'light', delayMs);
            return;
        }
        const box = document.querySelector('.box-alert-messages .box-message');
        if (box && box.parentElement) {
            box.parentElement.style.display = 'block';
            box.classList.remove('success', 'warning', 'error', 'light');
            box.classList.add('light');
            box.innerHTML = message;
            setTimeout(() => {
                if (typeof window.hideAlertMsg === 'function') { window.hideAlertMsg(); }
                else { box.parentElement.style.display = 'none'; }
            }, delayMs);
            return;
        }
    } catch (e) { }
    try { alert(typeof message === 'string' ? message.replace(/<[^>]+>/g, '') : String(message)); } catch (e) { }
}

document.addEventListener("DOMContentLoaded", function () {
    const tableBody = document.getElementById("userTableBody");
    const searchInput = document.getElementById("search_filter");
    const paginationWrap = document.getElementById("userPaginationWrap");
    const paginationInfo = document.getElementById("userPaginationInfo");
    const paginationDiv = document.getElementById("userPagination");

    let currentPage = 1;
    let currentSearch = "";
    const perPage = 10;

    function fetchUsers(search = "", page = 1) {
        $.ajax({
            url: appUrl + "/user/ajax/data",
            type: "GET",
            dataType: "json",
            data: { search: search, page: page, per_page: perPage },
            headers: { Accept: "application/json" },
            success: function (data) {
                const users = data.data || [];
                const pagination = data.pagination || null;
                renderUsers(users);
                renderPagination(pagination);
                currentPage = pagination?.current_page || 1;
            },
            error: function () {
                tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Failed to load user data.</td></tr>';
                renderPagination(null);
            },
        });
    }

    function renderPagination(pagination) {
        if (!paginationWrap || !paginationInfo || !paginationDiv) return;
        if (!pagination || (pagination.total || 0) === 0) {
            paginationWrap.classList.add("d-none");
            paginationInfo.textContent = "";
            paginationDiv.innerHTML = "";
            return;
        }
        paginationWrap.classList.remove("d-none");
        const from = pagination.from || 0;
        const to = pagination.to || 0;
        const total = pagination.total || 0;
        paginationInfo.textContent = `Showing ${from}-${to} of ${total}`;

        const current = pagination.current_page || 1;
        const last = pagination.last_page || 1;
        const buttons = [];
        buttons.push(createPageButton("Prev", Math.max(current - 1, 1), current <= 1));
        const pages = buildPageNumbers(current, last);
        pages.forEach((item) => {
            if (item === "...") {
                buttons.push('<span class="employee-page-btn" style="pointer-events:none;">...</span>');
                return;
            }
            const activeClass = item === current ? " active" : "";
            buttons.push(`<button type="button" class="employee-page-btn${activeClass}" data-page="${item}">${item}</button>`);
        });
        buttons.push(createPageButton("Next", Math.min(current + 1, last), current >= last));
        paginationDiv.innerHTML = buttons.join("");
    }

    function createPageButton(label, page, disabled) {
        return `<button type="button" class="employee-page-btn" data-page="${page}" ${disabled ? "disabled" : ""}>${label}</button>`;
    }

    function buildPageNumbers(current, last) {
        const pages = [];
        if (last <= 7) {
            for (let i = 1; i <= last; i++) pages.push(i);
            return pages;
        }
        pages.push(1);
        if (current > 3) pages.push("...");
        const start = Math.max(2, current - 1);
        const end = Math.min(last - 1, current + 1);
        for (let i = start; i <= end; i++) pages.push(i);
        if (current < last - 2) pages.push("...");
        pages.push(last);
        return pages;
    }

    function normalizeImageUrl(url) {
        let u = url == null ? '' : String(url);
        if (!u || u.toLowerCase() === 'null' || u.toLowerCase() === 'undefined') {
            return `${appUrl}/asset/img/avatar.png`;
        }
        if (/^(https?:)?\/\//i.test(u) || /^data:/i.test(u) || /^blob:/i.test(u)) return u;
        if (u.startsWith(appUrl)) return u;
        return `${appUrl}/${u.replace(/^\//, '')}`;
    }

    function renderUsers(users) {
        if (!users.length) {
            tableBody.innerHTML = '<tr class="no-data-row"><td colspan="5" class="text-center">No users found.</td></tr>';
            return;
        }
        let rows = "";
        users.forEach((user) => {
            let photoUrl = normalizeImageUrl(user.employee?.photo || null);
            const fallback = `${appUrl}/asset/img/avatar.png`;
            const employeeName = user.employee ? user.employee.name : user.name;
            const canAttendance = user.can_attendance;
            const attYes = canAttendance ? 'active' : '';
            const attNo = !canAttendance ? 'active' : '';
            rows += `
                <tr data-id="${user.id}">
                    <td>
                        <div class="d-flex align-items-center gap-3">
                            <img src="${photoUrl}" alt="User Photo" class="rounded-circle" width="40" height="40" onerror="this.onerror=null;this.src='${fallback}';" />
                            <div>
                                <div class="fw-semibold" style="font-size: 14px;">${user.name}</div>
                                <div class="text-muted small">${user.email}</div>
                        </div>
                    </td>
                    <td>${user.user_type}</td>
                    <td>${user.user_role}</td>
                    <td>
                        <div class="attendance-toggle-group" data-user-id="${user.id}">
                            <button type="button" class="attendance-toggle-btn toggle-yes ${attYes}" data-value="1">Yes</button>
                            <button type="button" class="attendance-toggle-btn toggle-no ${attNo}" data-value="0">No</button>
                        </div>
                    </td>
                    <td class="text-end">
                        <button class="btn-icon-toggle btn-detail" data-id="${user.id}" title="Detail">
                            <span class="material-symbols-outlined icon">visibility</span>
                        </button>
                    </td>
                </tr>
            `;
        });
        tableBody.innerHTML = rows;
    }

    if (paginationDiv) {
        paginationDiv.addEventListener("click", (event) => {
            const target = event.target.closest("button[data-page]");
            if (!target || target.disabled) return;
            const page = Number(target.getAttribute("data-page"));
            if (!Number.isFinite(page) || page < 1 || page === currentPage) return;
            currentPage = page;
            fetchUsers(currentSearch, currentPage);
        });
    }

    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener("input", function () {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                currentSearch = this.value.trim();
                currentPage = 1;
                fetchUsers(currentSearch, currentPage);
            }, 300);
        });
    }

    $(document).on("click", ".attendance-toggle-btn", function () {
        const $btn = $(this);
        const $group = $btn.closest(".attendance-toggle-group");
        const userId = $group.data("user-id");
        const value = $btn.data("value");
        const enabled = value === 1;

        const $prevYes = $group.find(".toggle-yes");
        const $prevNo = $group.find(".toggle-no");
        $prevYes.removeClass("active");
        $prevNo.removeClass("active");
        $btn.addClass("active");

        $.ajax({
            url: appUrl + `/user/${userId}/toggle-attendance`,
            type: "POST",
            data: { can_attendance: enabled ? 1 : 0, _token: $('meta[name="csrf-token"]').attr("content") },
            dataType: "json",
            error: function () {
                $prevYes.removeClass("active");
                $prevNo.removeClass("active");
                if (enabled) $prevNo.addClass("active");
                else $prevYes.addClass("active");
                showFloatingAlert("Failed to update attendance permission.", "warning", 3000);
            },
        });
    });

    $(document).on("click", ".btn-detail", function () {
        const id = $(this).data("id");
        $.ajax({
            url: appUrl + `/user/${id}`,
            method: "GET",
            dataType: "json",
            success: function (user) {
                let photoUrl = user.employee?.photo
                    ? normalizeImageUrl(user.employee.photo)
                    : `${appUrl}/asset/img/avatar.png`;
                $("#detailUserPhoto").attr("src", photoUrl);
                $("#detailUserName").text(user.name);
                $("#detailUserEmail").text(user.email);
                let divisionText = "";
                if (user.employee?.division) {
                    divisionText = user.employee.division.name_division || "-";
                }
                $("#detailEmployeeDivision").text(divisionText ? `Division: ${divisionText}` : "");
                $("#btnResetPassword").data("id", user.id);
                $("#userDetailModal").modal("show");
            },
            error: function () {
                showFloatingAlert("Failed to fetch user details.", "warning", 3000);
            },
        });
    });

    $(document).on("click", ".btn-reset-pwd", function () {
        const id = $(this).data("id");
        if (!confirm("Reset password for this user to default?")) return;
        $.ajax({
            url: appUrl + `/user/${id}/reset-password`,
            type: "POST",
            data: { _token: $('meta[name="csrf-token"]').attr("content") },
            dataType: "json",
            success: function (res) {
                showFloatingAlert(res.message || "Password reset successfully.", "success", 3000);
            },
            error: function () {
                showFloatingAlert("Failed to reset password.", "warning", 3000);
            },
        });
    });

    $("#btnResetPassword").on("click", function () {
        const id = $(this).data("id");
        if (!id || !confirm("Reset password for this user to default?")) return;
        $.ajax({
            url: appUrl + `/user/${id}/reset-password`,
            type: "POST",
            data: { _token: $('meta[name="csrf-token"]').attr("content") },
            dataType: "json",
            success: function (res) {
                $("#userDetailModal").modal("hide");
                showFloatingAlert(res.message || "Password reset successfully.", "success", 3000);
            },
            error: function () {
                showFloatingAlert("Failed to reset password.", "warning", 3000);
            },
        });
    });

    fetchUsers(currentSearch, currentPage);
});
