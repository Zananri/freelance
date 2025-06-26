document.addEventListener('DOMContentLoaded', function () {
    const tableBody = document.getElementById('divisionTableBody');

    function fetchEmployees() {
        $.ajax({
            url: '/employees',
            method: 'GET',
            dataType: 'json',
            headers: {
                'Accept': 'application/json'
            },
            success: function (data) {
                renderEmployees(data.data);
            },
            error: function () {
                $('#divisionTableBody').html('<tr><td colspan="6">Failed to load employee data.</td></tr>');
            }
        });
    }

    function renderEmployees(employees) {
        if (!employees.length) {
            tableBody.innerHTML = '<tr><td colspan="6">No employees found.</td></tr>';
            return;
        }

        let rows = '';
        employees.forEach(employee => {
            const profilePicture = employee.profile_picture ? employee.profile_picture : 'asset/img/default-profile.png';
            const departmentName = employee.department ? employee.department.name_department : '-';
            const divisionName = employee.division ? employee.division.name_division : '-';
            const office = employee.office ? employee.office : '-';
            const status = employee.status ? employee.status : '-';

            const statusClass = status === 'ACTIVE' ? 'status-ACTIVE' : 'status-INACTIVE';

            rows += `
                <tr>
                    <td>
                        <div class="d-flex align-items-center gap-3">
                            <img src="/${profilePicture}" alt="Profile Picture" class="table-image rounded-circle" width="40" height="40" />
                            <div>
                                <div class="fw-semibold" style="font-size: 14px;">${employee.name}</div>
                                <div style="font-size: 10px; color: #6c757d;">${employee.email}</div>
                            </div>
                        </div>
                    </td>
                    <td>${departmentName}</td>
                    <td>${divisionName}</td>
                    <td>${office}</td>
                    <td><span class="${statusClass}">${status}</span></td>
                    <td class="text-end">
                        <button class="btn-detail" title="Detail" data-id="${employee.id}">
                            <span class="material-symbols-outlined icon">visibility</span>
                        </button>
                        <button class="btn-edit" title="Edit" data-id="${employee.id}" onclick="window.location.href='/employees/${employee.id}/edit'">
                            <span class="material-symbols-outlined icon">edit</span>
                        </button>
                        <button class="btn-delete" title="Delete" data-id="${employee.id}">
                            <span class="material-symbols-outlined icon">delete</span>
                        </button>
                    </td>
                </tr>
            `;
        });

        tableBody.innerHTML = rows;
    }

    fetchEmployees();
});
