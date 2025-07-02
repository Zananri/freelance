var appUrl = document.querySelector('meta[name="app-url"]').getAttribute("content");

document.addEventListener("DOMContentLoaded", function () {
    const tableBody = document.getElementById("userTableBody");

    function fetchUsers() {
        $.ajax({
            url: appUrl + "/users",
            type: "GET",
            dataType: "json",
            success: function (response) {
                renderUsers(response.data);
            },
            error: function () {
                tableBody.innerHTML =
                    '<tr><td colspan="4">Failed to load user data.</td></tr>';
            },
        });
    }

    function renderUsers(users) {
        if (!users.length) {
            tableBody.innerHTML =
                '<tr class="no-data-row"><td colspan="4" class="text-center">No users found.</td></tr>';
            return;
        }

        let rows = "";
        users.forEach((user) => {
            const photo = user.photo ? user.photo : "asset/img/default-profile.png";

            rows += `
                <tr data-id="${user.id}">
                    <td>
                        <div class="d-flex align-items-center gap-3">
                            <img src="/${photo}" alt="Profile Picture" class="table-image rounded-circle" width="40" height="40" />
                            <div>
                                <div class="fw-semibold" style="font-size: 14px;">${user.name}</div>
                                <div style="font-size: 10px; color: #6c757d;">${user.email}</div>
                            </div>
                        </div>
                    </td>
                    <td>${user.user_type}</td>
                    <td>${user.user_role}</td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-reset" data-user-id="${user.id}" title="Reset Password">
                            <span class="material-symbols-outlined">autorenew</span> Reset Password
                        </button>
                    </td>
                </tr>
            `;
        });
        tableBody.innerHTML = rows;
    }

    fetchUsers();
});
