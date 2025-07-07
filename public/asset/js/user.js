var appUrl = document.querySelector('meta[name="app-url"]').getAttribute("content");

document.addEventListener("DOMContentLoaded", function () {
    const tableBody = document.getElementById("userTableBody");
    const userDetailModalEl = document.getElementById("userDetailModal");
    const userDetailModal = new bootstrap.Modal(userDetailModalEl);

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
                    '<tr><td colspan="5">Failed to load user data.</td></tr>';
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
        $.ajax({
            url: appUrl + `/users/${id}`,
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
                alert("Failed to fetch user details.");
            },
        });
    });

    fetchUsers();
});
