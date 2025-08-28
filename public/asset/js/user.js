var appUrl = document.querySelector('meta[name="app-url"]').getAttribute("content");

// Unified alert: use Settings-style white alert (from office.js)
function showFloatingAlert(message, type = 'success', delayMs = 2500) {
    try {
        if (typeof window.showAlertMsg === 'function') {
            window.showAlertMsg(message, 'light', delayMs);
            return;
        }
        const box = document.querySelector('.box-alert-messages .box-message');
        if (box && box.parentElement) {
            box.parentElement.style.display = 'block';
            box.classList.remove('success','warning','error','light');
            box.classList.add('light');
            box.innerHTML = message;
            setTimeout(() => {
                if (typeof window.hideAlertMsg === 'function') { window.hideAlertMsg(); }
                else { box.parentElement.style.display = 'none'; }
            }, delayMs);
            return;
        }
    } catch (e) { /* no-op */ }
    try { alert(typeof message === 'string' ? message.replace(/<[^>]+>/g, '') : String(message)); } catch(e) {}
}

document.addEventListener("DOMContentLoaded", function () {
    const tableBody = document.getElementById("userTableBody");
    const userDetailModalEl = document.getElementById("userDetailModal");
    const userDetailModal = new bootstrap.Modal(userDetailModalEl);
    let currentUserId = null;

    function fetchUsers() {
        $.ajax({
            url: appUrl + "/user/index",
            type: "GET",
            dataType: "json",
            success: function (response) {
                renderUsers(response.data);
            },
            error: function () {
                tableBody.innerHTML =
                    '<tr><td colspan="5">Failed to load user data.</td></tr>';
                showFloatingAlert('Failed to load users.', 'warning', 3500);
            },
        });
    }

    function renderUsers(users) {
        if (!users.length) {
            tableBody.innerHTML =
                '<tr class="no-data-row"><td colspan="5" class="text-center">No users found.</td></tr>';
            return;
        }

        let rows = "";
        users.forEach((user) => {
            const photo = user.photo ? user.photo : appUrl + "/asset/img/default-profile.png";

            rows += `
                <tr data-id="${user.id}">
                    <td>
                        <div class="d-flex align-items-center gap-3">
                            <img src="${photo}" alt="Profile Picture" class="table-image rounded-circle" width="40" height="40" />
                            <div>
                                <div class="fw-semibold" style="font-size: 14px;">${user.name}</div>
                                <div style="font-size: 10px; color: #6c757d;">${user.email}</div>
                            </div>
                        </div>
                    </td>
                    <td>${user.user_type}</td>
                    <td>${user.user_role}</td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-reset btn-detail" data-id="${user.id}" title="View Detail">
                            <span class="material-symbols-outlined">visibility</span> View Detail
                        </button>
                    </td>
                </tr>
            `;
        });
        tableBody.innerHTML = rows;
    }

    $(document).on("click", ".btn-detail", function () {
        const id = $(this).data("id");
        currentUserId = id;
        $.ajax({
            url: appUrl + `/user/${id}`,
            method: "GET",
            dataType: "json",
            success: function (user) {
                $("#detailUserName").text(user.name);
                $("#detailUserEmail").text(user.email);

                const photoUrl = user.photo ? user.photo : appUrl + "/asset/img/default-profile.png";
                $("#detailUserPhoto").attr("src", photoUrl);

                if (user.employee && user.employee.division) {
                    $("#detailEmployeeDivision").text(user.employee.division.name_division);
                } else {
                    $("#detailEmployeeDivision").text("No Division");
                }

                userDetailModal.show();
            },
            error: function () {
                showFloatingAlert("Failed to fetch user details.", 'warning', 3000);
            },
        });
    });

    function showResetPasswordAlert(message) {
        showFloatingAlert(message, 'success', 1500);
        setTimeout(() => {
            location.reload();
        }, 1500);
    }

    $("#btnResetPassword").on("click", function () {
        if (!currentUserId) {
            showFloatingAlert("User ID not found.", 'warning', 2500);
            return;
        }

        const $btn = $(this);
        $btn.prop("disabled", true);
        const originalHtml = $btn.html();
        $btn.html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Resetting...');

        $.ajax({
            url: appUrl + `/user/${currentUserId}/reset-password`,
            method: "POST",
            headers: {
                "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
            },
            success: function (response) {
                showResetPasswordAlert(response.message || "Password has been reset successfully.");
            },
            error: function (xhr) {
                const errorMsg = xhr.responseJSON?.error || "Failed to reset password. Please try again.";
                showFloatingAlert(errorMsg, 'warning', 3500);
            },
            complete: function () {
                $btn.prop("disabled", false);
                $btn.html(originalHtml);
            },
        });
    });

    fetchUsers();
});
