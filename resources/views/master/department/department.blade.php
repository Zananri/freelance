<x-office-layout>
    <x-slot name="head_slot">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <link href="{{ asset('asset/css/department.css') }}" rel="stylesheet">
    </x-slot>



    <div class="title-content d-flex align-items-center gap-2">
        <div class="nav-item d-inline-block">
            <div class="nav-icon-arrow">
                <a href="{{ url('master') }}" class="text-decoration-none text-dark d-flex align-items-center">
                    <div class="d-flex">
                        <span class="material-symbols-outlined">arrow_back</span>
                    </div>
                </a>
            </div>
        </div>
        <h2 class="m-0">Department</h2>
    </div>

    <div class="body-content scrollable-container rounded-4 px-3 py-3" style="margin-top: 20px; width: 100%;">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h5 class="mb-0 table-title">List Department</h5>

           <div class="d-flex gap-1" style="margin-left: -5px;">
               <div class="input-group" style="min-width: 200px; height: 38px;">
                   <input type="text" id="searchInput" class="form-control input-soft" placeholder="Search Department" style="border: 1px solid #DDDDDD; height: 38px;" />
               </div>
    <button class="btn btn-icon-toggle" style="border: 1px solid #DDDDDD;">
        <span class="material-symbols-outlined icon">filter_list</span> Filter
    </button>


    <button id="btnAddData" class="btn btn-icon-toggle" style="border: 1px solid #DDDDDD; min-width: 140px; padding-left: 20px; padding-right: 20px;">
        <span class="material-symbols-outlined icon">add</span> Add Data
    </button>
</div>
        </div>

        <div class="table-responsive">
            <table class="table table-borderless align-middle table-transparent">
                <thead>
                    <tr>
                        <th scope="col">Department Name</th>
                        <th scope="col">Status</th>
                        <th scope="col"></th>
                    </tr>
                </thead>
                <tbody id="departmentTableBody">

                </tbody>
            </table>
        </div>
    </div>
    <div class="alert-delete-container mb-3" style="width: 100%;"></div>

        <!-- Add Department Modal -->
        <div class="modal fade" id="addDepartmentModal" tabindex="-1" aria-labelledby="addDepartmentModalLabel" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content modal-content-custom">
                    <div class="modal-header modal-header-custom">
                        <h5 class="modal-title modal-title-custom" id="addDepartmentModalLabel">Add Department</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <form id="addDepartmentForm" class="form-custom">
                        <div class="modal-body modal-body-custom">
                            <div class="mb-3 mt-4">
                                <label for="name_department" class="form-label label-custom">Name</label>
                                <input type="text" class="form-control input-soft" id="name_department" name="name_department" placeholder="Input Department Name" required>
                            </div>
                            <div class="mb-3">
                                <label for="status" class="form-label label-custom">Status</label>
                                <select class="form-select input-soft" id="status" name="status" required>
                                    <option value="ACTIVE">Active</option>
                                    <option value="INACTIVE">Inactive</option>
                                </select>
                            </div>
                        </div>
                        <div class="modal-footer modal-footer-custom">
                            <button type="submit" class="btn-submit-black btn-submit-custom">Submit</button>
                        </div>
                    </form>
                </div>
                <div class="alert-container mt-2" style="width: 100%;"></div>
            </div>
        </div>

        <!-- Edit Department Modal -->
        <div class="modal fade" id="editDepartmentModal" tabindex="-1" aria-labelledby="editDepartmentModalLabel" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content modal-content-custom">
                    <div class="modal-header modal-header-custom">
                        <h5 class="modal-title modal-title-custom" id="editDepartmentModalLabel">Edit Department</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <form id="editDepartmentForm" class="form-custom">
                        <div class="modal-body modal-body-custom">
                            <div class="mb-3 mt-4">
                                <label for="edit_name_department" class="form-label label-custom">Name</label>
                                <input type="text" class="form-control input-soft" id="edit_name_department" name="name_department" placeholder="Input Department Name" required>
                            </div>
                        <div class="mb-3">
                            <label for="edit_status" class="form-label label-custom">Status</label>
                            <select class="form-select input-soft" id="edit_status" name="status" required>
                                <option value="ACTIVE">Active</option>
                                <option value="INACTIVE">Inactive</option>
                            </select>
                        </div>
                        </div>
                        <div class="modal-footer modal-footer-custom">
                            <button type="submit" class="btn-submit-black btn-submit-custom">Update</button>
                        </div>
                    </form>
                </div>
                <div class="alert-container mt-2" style="width: 100%;"></div>
            </div>
        </div>
        
        <!-- Delete Department Modal -->
        <div class="modal fade" id="deleteDepartmentModal" tabindex="-1" aria-labelledby="deleteDepartmentModalLabel" aria-hidden="true">
         <div class="modal-dialog">
             <div class="modal-content modal-content-custom">
                <div class="modal-header modal-header-custom">
         <h5 class="modal-title modal-title-custom mb-3" id="deleteDepartmentModalLabel">Delete Department</h5>
         <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <form id="deleteDepartmentForm" class="form-custom">
         <div class="modal-body modal-body-custom">

             <div class="mb-3 mt-4">
                <label for="delete_name_department" class="form-label label-custom">Name</label>
                <input type="text" class="form-control input-soft" id="delete_name_department" name="name_department" readonly disabled />
             </div>
             <div class="mt-5 text-center">
                <p class="mb-3" style="font-weight: 300; font-size: 16px;">Are you sure you want to delete this data?</p>
             </div>
         </div>
                     <div class="modal-footer modal-footer-custom">
                         <button type="submit" class="btn-submit-black btn-submit-custom" style="background-color: #dc3545;">Delete</button>
                     </div>
                 </form>
             </div>
         </div>
        </div>
    <x-slot name="script_slot">

        <script>
            var appUrl = $('meta[name="app-url"]').attr('content');

            $(document).ready(function() {
                var addDepartmentModal = new bootstrap.Modal(document.getElementById('addDepartmentModal'));
                var editDepartmentModal = new bootstrap.Modal(document.getElementById('editDepartmentModal'));

                // Reload page when alert is fully closed
                $(document).on('closed.bs.alert', '#addDepartmentModal .alert-container .alert, #editDepartmentModal .alert-container .alert', function() {
                    location.reload();
                });

                $('#btnAddData').click(function() {
                    // Clear any existing alert when opening add modal
                    $('#addDepartmentModal .alert-container').empty();
                    addDepartmentModal.show();
                });
                
                // Clear any existing alert when opening edit modal
                $('#editDepartmentModal').on('show.bs.modal', function () {
                    $('#editDepartmentModal .alert-container').empty();
                });

                $('#addDepartmentForm').submit(function(e) {
                    e.preventDefault();

                    var formData = {
                        name_department: $('#name_department').val(),
                        status: $('#status').val(),
                    };

                    $.ajax({
                        url: appUrl+'/departments',
                        type: "POST",
                        data: JSON.stringify(formData),
                        contentType: "application/json",
                        headers: {
                            'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
                        },
                            success: function(response) {
                                console.log('Add Department Success:', response);
                                $('#addDepartmentModal .alert-container').empty();
                                var alertHtml = '<div class="alert alert-success alert-dismissible fade show d-flex justify-content-between align-items-center" role="alert" style="margin-bottom:0;">' +
                                    '<div>' + response.message + '</div>' +
                                    '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>' +
                                    '</div>';
                                $('#addDepartmentModal .alert-container').append(alertHtml);
                                $('#addDepartmentModal .alert-container').show();
                                loadDepartments();
                            },
                        error: function(xhr) {
                            console.log('Add Department Error:', xhr);
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
                            url: appUrl+'/departments/' + id,
                            type: 'GET',
                            success: function(department) {
                                $('#edit_name_department').val(department.name_department);
                                $('#edit_status').val(department.status);
                                $('#editDepartmentForm').data('id', id);
                                editDepartmentModal.show();
                            },
                            error: function() {
                                alert('Failed to fetch department data.');
                            }
                        });
                    });

                $('#editDepartmentForm').submit(function(e) {
                    e.preventDefault();
                    var id = $(this).data('id');
                    var formData = {
                        name_department: $('#edit_name_department').val(),
                        status: $('#edit_status').val(),
                    };

                    
                    
                    $.ajax({
                        url: appUrl+'/departments/' + id,
                        type: 'PUT',
                        data: formData,
                        headers: {
                            'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
                        },
                            success: function(response) {
                                $('#editDepartmentModal .alert-container').empty();
                                var alertHtml = '<div class="alert alert-success alert-dismissible fade show d-flex justify-content-between align-items-center" role="alert" style="margin-bottom:0;">' +
                                    '<div>' + response.message + '</div>' +
                                    '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>' +
                                    '</div>';
                                $('#editDepartmentModal .alert-container').append(alertHtml);
                                $('#editDepartmentModal .alert-container').show();
                                loadDepartments();
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
                        }
                    });
                });

                $(document).on('click', '.btn-delete', function() {
                    var id = $(this).data('id');
                    // Fetch department data to show in delete modal
                    $.ajax({
                        url: appUrl+'/departments/' + id,
                        type: 'GET',
                        success: function(department) {
                        $('#delete_name_department').val(department.name_department);
                        $('#deleteDepartmentForm').data('id', id);
                        var deleteDepartmentModal = new bootstrap.Modal(document.getElementById('deleteDepartmentModal'));
                        deleteDepartmentModal.show();
                        },
                        error: function() {
                            alert('Failed to fetch department data.');
                        }
                    });
                });

                $('#deleteDepartmentForm').submit(function(e) {
                    e.preventDefault();
                    var id = $(this).data('id');
                    $.ajax({
                        url: appUrl+'/departments/' + id,
                        type: 'DELETE',
                        headers: {
                            'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
                        },
                        success: function(response) {
                            $('.alert-delete-container').empty();
                            var alertHtml = '<div class="alert alert-success alert-dismissible fade show d-flex justify-content-between align-items-center" role="alert" style="margin-bottom:0;">' +
                                '<div>' + response.message + '</div>' +
                                '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>' +
                                '</div>';
                            $('.alert-delete-container').append(alertHtml);
                            $('.alert-delete-container').show();
                            setTimeout(function() {
                                $('.alert-delete-container .alert').alert('close');
                            }, 2000);
                            loadDepartments();
                            var deleteDepartmentModalEl = document.getElementById('deleteDepartmentModal');
                            var deleteDepartmentModal = bootstrap.Modal.getInstance(deleteDepartmentModalEl);
                            deleteDepartmentModal.hide();
                        },
                        error: function() {
                            alert('Failed to delete department.');
                        }
                    });
                });
            });

    function loadDepartments(query = '') {
                $.ajax({
                    url:appUrl+'/departments',
                    type: "GET",
                    data: { query: query },
                    success: function(departments) {
                        
                        var rowHtml = '';
                        $.each(departments, function(index, department) {
                            var statusText = department.status === 'ACTIVE' ? 'ACTIVE' : department.status;
                            var statusClass = department.status === 'ACTIVE' ? 'status-ACTIVE' : 'status-INACTIVE';
                            if(department.status === 'DELETED') {
                                statusText = 'DELETED';
                                statusClass = 'status-DELETED';
                            }
                            rowHtml += '<tr>' +
                                '<td>' + department.name_department + '</td>' +
                                '<td><span class="' + statusClass + '">' + statusText + '</span></td>' +
                                '<td style="text-align: right;">' +
                                '<button class="btn-icon-toggle btn-edit" data-id="' + department.id + '"><span class="material-symbols-outlined icon">edit</span></button> ' +
                                '<button class="btn-icon-toggle btn-delete" data-id="' + department.id + '"><span class="material-symbols-outlined icon">delete</span></button>' +
                                '</td>' +
                                '</tr>';
                                
                        });

                        $('#departmentTableBody').html(rowHtml);
                    },
                    error: function() {
                        alert('Failed to load departments.');
                    }
                });
                }
                // Trigger search dynamically as user types
                $('#searchInput').on('input', function() {
                    var query = $(this).val();
                    loadDepartments(query);
                });

                loadDepartments();
        </script>
    </x-slot>


</x-office-layout>
