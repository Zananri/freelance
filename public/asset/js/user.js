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
            const photo = user.photo ? user.photo : "url('" + appUrl + "/asset/img/default-profile.png')";

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
                        <button class="btn btn-sm btn-reset btn-detail" data-id="${user.id}" title="View Detail">
                            <span class="material-symbols-outlined">visibility</span> View Detail
                        </button>
                    </td>
                </tr>
            `;
        });
        tableBody.innerHTML = rows;
    }

    // User Detail Modal Logic
    const userDetailModalEl = document.getElementById("userDetailModal");
    const userDetailModal = new bootstrap.Modal(userDetailModalEl);

    $(document).on("click", ".btn-detail", function () {
        const id = $(this).data("id");
        $.ajax({
            url: appUrl + `/users/${id}`,
            method: "GET",
            dataType: "json",
                success: function (user) {
                    $("#detailUserName").text(user.name);
                    $("#detailUserEmail").text(user.email);
                    $("#detailUserType").text(user.user_type);
                    $("#detailUserRole").text(user.user_role);

                    const photoUrl = user.photo ? `/${user.photo}` : "url('" + appUrl + "/asset/img/default-profile.png')";
                    $("#detailUserPhoto").attr("src", photoUrl);

                    if (user.employee) {
                        const birthDate = user.employee.birth_date ? new Date(user.employee.birth_date) : null;
                        const hireDate = user.employee.hire_date ? new Date(user.employee.hire_date) : null;
                        const options = { year: "numeric", month: "long", day: "numeric" };

                        $("#detailBirthDate").text(birthDate ? birthDate.toLocaleDateString("en-GB", options) : "-");
                        $("#detailPhone").text(user.employee.phone || "-");
                        $("#detailAddress").text(user.employee.address || "-");

                        $("#detailEmployeeDepartment").text(user.employee.department ? user.employee.department.name_department : "-");
                        $("#detailEmployeeDivision").text(user.employee.division ? user.employee.division.name_division : "-");
                        $("#detailEmployeeJob").text(user.employee.job ? user.employee.job.job_name : "-");
                        $("#detailHireDate").text(hireDate ? hireDate.toLocaleDateString("en-GB", options) : "-");
                        $("#detailGrade").text(user.employee.grade || "-");
                        $("#detailEmployeeOffice").text(user.employee.office || "-");
                        $("#detailEmployeeStatus").text(user.employee.status || "-");
                    } else {
                        $("#detailBirthDate").text("-");
                        $("#detailPhone").text("-");
                        $("#detailAddress").text("-");
                        $("#detailEmployeeDepartment").text("-");
                        $("#detailEmployeeDivision").text("-");
                        $("#detailEmployeeJob").text("-");
                        $("#detailHireDate").text("-");
                        $("#detailGrade").text("-");
                        $("#detailEmployeeOffice").text("-");
                        $("#detailEmployeeStatus").text("-");
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
