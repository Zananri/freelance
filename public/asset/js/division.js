var appUrl = $('meta[name="app-url"]').attr('content');

$(document).ready(function() {
    var addDivisionModal = new bootstrap.Modal(document.getElementById('addDivisionModal'));
    var editDivisionModal = new bootstrap.Modal(document.getElementById('editDivisionModal'));
    var deleteDivisionModal = new bootstrap.Modal(document.getElementById('deleteDivisionModal'));

    // Reload page when alert is fully closed
    $(document).on('closed.bs.alert', '#addDivisionModal .alert-container .alert, #editDivisionModal .alert-container .alert', function() {
        location.reload();
    });

    // Load departments for dropdowns
    function loadDepartmentsDropdown() {
        $.ajax({
            url: appUrl + '/departments',
            type: 'GET',
            success: function(departments) {
                var options = '<option value="" disabled selected>Select Department</option>';
                $.each(departments, function(index, department) {
                    options += '<option value="' + department.id + '">' + department.name_department + '</option>';
                });
                $('#department_id').html(options);
                $('#edit_department_id').html(options);
            },
            error: function() {
                alert('Failed to load departments.');
            }
        });
    }

    // Load departments for filter dropdown (fixed to populate dropdown menu with <li><a>)
    function loadDepartmentsFilter() {
        $.ajax({
            url: appUrl + '/departments',
            type: 'GET',
            success: function(departments) {
                var menuHtml = '<li><a class="dropdown-item department-filter-option active" href="#" data-department="">All Departments</a></li>';
                $.each(departments, function(index, department) {
                    menuHtml += '<li><a class="dropdown-item department-filter-option" href="#" data-department="' + department.id + '">' + department.name_department + '</a></li>';
                });
                $('#departmentFilterMenu').html(menuHtml);

                // Set up click handler for department filter options
                $('#departmentFilterMenu').off('click').on('click', 'a.department-filter-option', function(e) {
                    e.preventDefault();
                    $('#departmentFilterMenu a.department-filter-option').removeClass('active');
                    $(this).addClass('active');

                    var selectedDepartmentId = $(this).data('department');
                    var selectedDepartmentName = $(this).text();

                    // Update dropdown button text
                    $('#departmentFilterDropdown').html('<span class="material-symbols-outlined icon">apartment</span> ' + selectedDepartmentName);

                    // Reload divisions with selected department filter
                    loadDivisions($('#searchInput').val(), selectedStatus, selectedDepartmentId);
                });
            },
            error: function() {
                alert('Failed to load departments for filter.');
            }
        });
    }

    loadDepartmentsDropdown();
    loadDepartmentsFilter();

    $('#btnAddData').click(function() {
        $('#addDivisionModal .alert-container').empty();
        var form = $('#addDivisionForm')[0];
        form.reset();
        $(form).removeClass('was-validated');
        $('#department_id').removeClass('is-valid is-invalid');
        $('#name_division').removeClass('is-valid is-invalid');
        $('#status').removeClass('is-valid is-invalid');
        addDivisionModal.show();
    });

    // Real-time validation for addDivisionForm inputs
    $('#department_id, #name_division, #status').on('input change', function() {
        var input = $(this)[0];
        if (input.checkValidity()) {
            $(this).removeClass('is-invalid').addClass('is-valid');
        } else {
            $(this).removeClass('is-valid').addClass('is-invalid');
        }
        $('#addDivisionForm').removeClass('was-validated');
    });

    function showLoader(modalType, show = true) {
        const loaderId = {
            add: '#addModalLoader',
            edit: '#editModalLoader',
            delete: '#deleteModalLoader'
        }[modalType];
        if (loaderId) {
            document.querySelector(loaderId).classList.toggle('d-none', !show);
        }
    }

    $('#addDivisionForm').submit(function(e) {
        e.preventDefault();

        var form = this;
        if (!form.checkValidity()) {
            e.stopPropagation();
            $(form).addClass('was-validated');
            return false;
        }
        $(form).removeClass('was-validated');

        showLoader('add', true);

        var formData = {
            department_id: $('#department_id').val(),
            name_division: $('#name_division').val(),
            status: $('#status').val(),
        };

        $.ajax({
            url: appUrl + '/divisions',
            type: "POST",
            data: JSON.stringify(formData),
            contentType: "application/json",
            headers: {
                'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
            },
            success: function(response) {
                showLoader('add', false);
                $('#addDivisionModal .alert-container').empty();
                var alertHtml = '<div class="alert alert-success alert-dismissible fade show d-flex justify-content-between align-items-center" role="alert" style="margin-bottom:0;">' +
                    '<div>' + response.message + '</div>' +
                    '</div>';
                $('#addDivisionModal .alert-container').append(alertHtml);
                $('#addDivisionModal .alert-container').show();
                loadDivisions();
                setTimeout(function() {
                    $('#addDivisionModal .alert-container .alert').alert('close');
                    var addDivisionModalEl = document.getElementById('addDivisionModal');
                    var addDivisionModal = bootstrap.Modal.getInstance(addDivisionModalEl);
                    addDivisionModal.hide();
                }, 1500);
            },
            error: function(xhr) {
                showLoader('add', false);
                if (xhr.status === 422) {
                    var errors = xhr.responseJSON.errors;
                    var errorMessages = '';
                    $.each(errors, function(key, value) {
                        errorMessages += value + '\\n';
                    });
                    alert(errorMessages);
                } else {
                    alert('An error occurred. Please try again.');
                }
            }
        });
    });

    $(document).on('click', '.btn-edit', function() {
        var id = $(this).data('id');
        $.ajax({
            url: appUrl + '/divisions/' + id,
            type: 'GET',
            success: function(division) {
                $('#edit_division_id').val(division.id);
                $('#edit_department_id').val(division.department_id);
                $('#edit_name_division').val(division.name_division);
                $('#edit_status').val(division.status);
                $('#editDivisionForm').data('id', id);
                editDivisionModal.show();
            },
            error: function() {
                alert('Failed to fetch division data.');
            }
        });
    });

    $('#editDivisionForm').submit(function(e) {
        e.preventDefault();
        var id = $('#edit_division_id').val();
        var formData = {
            department_id: $('#edit_department_id').val(),
            name_division: $('#edit_name_division').val(),
            status: $('#edit_status').val(),
        };

        showLoader('edit', true);

        $.ajax({
            url: appUrl + '/divisions/' + id,
            type: 'PUT',
            data: JSON.stringify(formData),
            contentType: "application/json",
            headers: {
                'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
            },
            success: function(response) {
                showLoader('edit', false);
                $('#editDivisionModal .alert-container').empty();
                var alertHtml = '<div class="alert alert-success alert-dismissible fade show d-flex justify-content-between align-items-center" role="alert" style="margin-bottom:0;">' +
                    '<div>' + response.message + '</div>' +
                    '</div>';
                $('#editDivisionModal .alert-container').append(alertHtml);
                $('#editDivisionModal .alert-container').show();
                loadDivisions();
                setTimeout(function() {
                    $('#editDivisionModal .alert-container .alert').alert('close');
                    var editDivisionModalEl = document.getElementById('editDivisionModal');
                    var editDivisionModal = bootstrap.Modal.getInstance(editDivisionModalEl);
                    editDivisionModal.hide();
                }, 1500);
            },
            error: function(xhr) {
                if (xhr.status === 422) {
                    var errors = xhr.responseJSON.errors;
                    var errorMessages = '';
                    $.each(errors, function(key, value) {
                        errorMessages += value + '\\n';
                    });
                    alert(errorMessages);
                } else {
                    alert('An error occurred. Please try again.');
                }
                showLoader('edit', false);
            }
        });
    });

    $(document).on('click', '.btn-delete', function() {
        var id = $(this).data('id');
        $.ajax({
            url: appUrl + '/divisions/' + id,
            type: 'GET',
            success: function(division) {
                $('#delete_name_division').val(division.name_division);
                $('#deleteDivisionForm').data('id', id);
                deleteDivisionModal.show();
            },
            error: function() {
                alert('Failed to fetch division data.');
            }
        });
    });

    $('#deleteDivisionForm').submit(function(e) {
        e.preventDefault();
        var id = $('#deleteDivisionForm').data('id');

        showLoader('delete', true);

        $.ajax({
            url: appUrl + '/divisions/' + id,
            type: 'DELETE',
            headers: {
                'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
            },
            success: function(response) {
                showLoader('delete', false);
                $('.alert-delete-container').empty();
                var alertHtml = '<div class="alert alert-success alert-dismissible fade show d-flex justify-content-between align-items-center" role="alert" style="margin-bottom:0;">' +
                    '<div>' + response.message + '</div>' +
                    '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>' +
                    '</div>';
                $('.alert-delete-container').append(alertHtml);
                $('.alert-delete-container').show();
                setTimeout(function() {
                    $('.alert-delete-container .alert').alert('close');
                }, 1500);
                $('#divisionTableBody tr[data-id="' + id + '"]').remove();
                var deleteDivisionModalEl = document.getElementById('deleteDivisionModal');
                var deleteDivisionModal = bootstrap.Modal.getInstance(deleteDivisionModalEl);
                deleteDivisionModal.hide();
            },
            error: function() {
                showLoader('delete', false);
                alert('Failed to delete division.');
            }
        });
    });

    // Load divisions with optional search and filter
    function loadDivisions(query = '', status = 'ALL', departmentId = '') {
        $.ajax({
            url: appUrl + '/divisions',
            type: "GET",
            data: { query: query, status: status, department_id: departmentId },
            success: function(divisions) {
                var rowHtml = '';
                if (divisions.length === 0) {
                    rowHtml = '<tr><td colspan="4" class="text-center">No Data</td></tr>';
                } else {
                    $.each(divisions, function(index, division) {
                        var statusText = division.status === 'ACTIVE' ? 'ACTIVE' : division.status;
                        var statusClass = division.status === 'ACTIVE' ? 'status-ACTIVE' : 'status-INACTIVE';
                        if(division.status === 'DELETED') {
                            statusText = 'DELETED';
                            statusClass = 'status-DELETED';
                        }
                        rowHtml += '<tr data-id="' + division.id + '">' +
                            '<td>' + (division.department ? division.department.name_department : '') + '</td>' +
                            '<td>' + division.name_division + '</td>' +
                            '<td><span class="' + statusClass + '">' + statusText + '</span></td>' +
                            '<td class="text-end">' +
                            '<button class="btn btn-sm btn-edit" data-id="' + division.id + '"><span class="material-symbols-outlined">edit</span></button> ' +
                            '<button class="btn btn-sm btn-delete" data-id="' + division.id + '"><span class="material-symbols-outlined">delete</span></button>' +
                            '</td>' +
                            '</tr>';
                    });
                }
                $('#divisionTableBody').html(rowHtml);
            },
            error: function() {
                $('#divisionTableBody').html('<tr><td colspan="4" class="text-center">Failed to load data</td></tr>');
            }
        });
    }

    // Trigger search dynamically as user types
    $('#searchInput').on('input', function() {
        var query = $(this).val();
        loadDivisions(query, selectedStatus, $('#departmentFilter').val());
    });

    var selectedStatus = 'ALL';

    // Handle filter option click
    $('.filter-option').click(function(e) {
        e.preventDefault();
        $('.filter-option').removeClass('active');
        $(this).addClass('active');
        selectedStatus = $(this).data('status');
        loadDivisions($('#searchInput').val(), selectedStatus, $('#departmentFilter').val());
    });

    // Initial load
    loadDivisions('', selectedStatus, '');

    // Handle department filter change
    $('#departmentFilter').change(function() {
        var selectedDepartment = $(this).val();
        loadDivisions($('#searchInput').val(), selectedStatus, selectedDepartment);
    });
});
