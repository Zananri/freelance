var appUrl = $('meta[name="app-url"]').attr("content");

document.addEventListener('DOMContentLoaded', function () {
    const tableBody = document.getElementById('divisionTableBody');

    function fetchEmployees() {
        $.ajax({
            url: appUrl + "/employees",
            type: "GET",
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
            tableBody.innerHTML = '<tr class="no-data-row"><td colspan="6" class="text-center">No employees found.</td></tr>';
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
                <tr data-id="${employee.id}">
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

    // Delete modal and logic
    const deleteEmployeeModalEl = document.getElementById('deleteEmployeeModal');
    const deleteEmployeeModal = new bootstrap.Modal(deleteEmployeeModalEl);
    const deleteEmployeeForm = document.getElementById('deleteEmployeeForm');

    // Create loader overlay element similar to department.js and division.js
    let loaderOverlay = document.createElement('div');
    loaderOverlay.id = 'deleteModalLoader';
    loaderOverlay.className = 'modal-loading-overlay d-none';
    loaderOverlay.innerHTML = '<div class="loader-spinner"></div>';
    deleteEmployeeForm.appendChild(loaderOverlay);

    $(document).on('click', '.btn-delete', function () {
        const id = $(this).data('id');
        // Fetch employee details
        $.ajax({
            url: appUrl + `/employees/${id}`,
            method: 'GET',
            dataType: 'json',
            success: function (employee) {
                // Populate modal fields
                const photoUrl = employee.profile_picture ? `/${employee.profile_picture}` : '/asset/img/default-profile.png';
                $('.delete-employee-photo').css({
                    'background-image': `url(${photoUrl})`,
                    'background-size': 'cover',
                    'background-position': 'center center',
                    'background-repeat': 'no-repeat',
                    'width': '100px',
                    'height': '100px',
                    'border-radius': '50%',
                    'margin': '0 auto',
                });
                $('#deleteEmployeeName').text(employee.name);
                $('#deleteEmployeeEmail').text(employee.email);
                $('#deleteEmployeeDepartment').text(employee.department ? employee.department.name_department : '-');
                $('#deleteEmployeeDivision').text(employee.division ? employee.division.name_division : '-');
                $('#deleteEmployeeOffice').text(employee.office || '-');
                $('#deleteEmployeeStatus').text(employee.status || '-');

                // Store id in form data attribute
                $(deleteEmployeeForm).data('id', id);

                // Show modal
                deleteEmployeeModal.show();
            },
            error: function () {
                alert('Failed to fetch employee data.');
            }
        });
    });

    deleteEmployeeForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const id = $(this).data('id');
        // Show loader overlay
        loaderOverlay.classList.remove('d-none');

        $.ajax({
            url: appUrl + `/employees/${id}`,
            method: 'DELETE',
            headers: {
                'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
            },
            success: function (response) {
                // Hide loader overlay
                loaderOverlay.classList.add('d-none');
                // Show success alert
                $('.alert-delete-container').empty();
                const alertHtml = `
                    <div class="alert alert-success alert-dismissible fade show d-flex justify-content-between align-items-center" role="alert" style="margin-bottom:0;">
                        <div>${response.message}</div>
                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                    </div>`;
                $('.alert-delete-container').append(alertHtml).show();
                setTimeout(() => {
                    $('.alert-delete-container .alert').alert('close');
                }, 2000);
                // Hide modal
                deleteEmployeeModal.hide();
                // Reload page to reflect changes
                location.reload();
            },
            error: function () {
                loaderOverlay.classList.add('d-none');
                alert('Failed to delete employee.');
            }
        });
    });

    fetchEmployees();
});
