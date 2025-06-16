<x-office-layout>
    <x-slot name="head_slot">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <link href="{{ asset('asset/css/department.css') }}" rel="stylesheet">

        <style>

            .mb-0 {
                font-size: 20px;
            }

            .table-transparent th,
            .table-transparent td {
                background-color: rgba(248, 248, 249, 0) !important;
            }

            .nav-icon-arrow {
                display: inline-block;
                color: #717375;
                margin-top: 3px; 
                margin-right: 10px;
                height: 40px; width:40px;
                border-radius: 50%;
                --bs-bg-opacity:0.3;
                background-color: rgba(var(--bs-white-rgb), var(--bs-bg-opacity)) !important;
                transition: all 0.15s ease-in-out;
            }

            .nav-icon-arrow:hover{
                cursor: pointer;
                --bs-bg-opacity:0.7;
            }

            .nav-icon-arrow .material-symbols-outlined {
                color: #808489;
                font-size: 20px;
                font-variation-settings: 'FILL' 0,'wght' 400;
                transition: all 0.15s ease-in-out;
            }

            .nav-icon-arrow:hover .material-symbols-outlined {
                color: #111;
                font-variation-settings: 'FILL' 1,'wght' 400; 
            }

            .nav-icon-arrow .d-flex{
                height: 100%;
                justify-content: center;
                align-items: center;
            }

            .title-content a {
                text-decoration: none !important;
                color: inherit !important;
            }

            .btn-icon-toggle {
                position: relative;
                background-color: transparent;
                color: inherit;
                border: 1px solid #DDDDDD;
                padding: 0.375rem 0.75rem;
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                cursor: pointer;
                transition: background-color 0.3s ease;
                box-sizing: border-box;
                height: 38px;
                min-width: 90px;
                font-size: 14px;
            }

            .btn-icon-toggle .icon {
                color: inherit;
                transition: color 0.3s ease;
            }

            .btn-icon-toggle:hover {
                background-color: white;
            }

            .btn-icon-toggle:hover .icon {
                color: black;
            }

            .input-soft {
                background-color: #f2f2f2;
                border: none;
                border-radius: 8px;
                padding: 12px 16px;
                font-size: 14px;
                box-shadow: inset 0 1px 3px rgba(0,0,0,0.05);
            }

            .input-soft:focus {
                outline: none;
                border: 1px solid #ccc;
                background-color: #fff;
            }

            .btn-submit-black {
                background-color: black;
                color: white;
                border: none;
                padding: 10px 24px;
                border-radius: 8px;
                font-weight: 500;
                transition: background-color 0.3s ease;
            }

            .btn-submit-black:hover {
                background-color: #333;
            }

            .modal-content-custom {
                border-radius: 16px;
                padding: 24px;
                background: #f7f7f8;
                box-shadow: 0 8px 24px rgba(0,0,0,0.15);
                border: none;
            }
            .modal-header-custom {
                border: 0;
            }
            .modal-title-custom {
                font-weight: 300;
                font-size: 28px;
                position: absolute;
                top: 24px;
                left: 24px;
                color: rgb(103, 111, 122);
            }
            .form-custom {
                margin-top: -12px;
            }
            .modal-body-custom {
                padding: 0;
            }
            .label-custom-name {
                font-weight: 300;
                margin-top: 40px;
            }
            .label-custom {
                font-weight: 300;
            }
            .modal-footer-custom {
                border: 0;
                justify-content: center;
            }
            .btn-submit-custom {
                width: 80%;
            }

        </style>
    </x-slot>



    <div class="title-content d-flex align-items-center gap-2">
        <div class="nav-item d-inline-block">
            <div class="nav-icon-arrow">
                <a href="/master" class="text-decoration-none text-dark d-flex align-items-center">
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

            <div class="d-flex gap-2">
                <button class="btn btn-icon-toggle" style="border: 1px solid #DDDDDD;">
                    <span class="material-symbols-outlined icon">filter_list</span> Filter
                </button>

                <button class="btn btn-icon-toggle btn-icon-search" style="border: 1px solid #DDDDDD;">
                    <span class="material-symbols-outlined icon">search</span> Search
                </button>

                <button id="btnAddData" class="btn btn-icon-toggle" style="border: 1px solid #DDDDDD;">
                    <span class="material-symbols-outlined icon">add</span> Add Data
                </button>
            </div>
        </div>

        <div class="table-responsive">
            <table class="table table-borderless align-middle table-transparent">
                <thead>
                    <tr>
                        <th scope="col">Department Name</th>
                        <th scope="col">Manager</th>
                        <th scope="col">Actions</th>
                    </tr>
                </thead>
                <tbody id="departmentTableBody">
                    <!-- Department rows will be dynamically inserted here -->
                </tbody>
            </table>
        </div>
    </div>

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
                            <div class="mb-2">
                                <label for="nama_departmen" class="form-label label-custom-name">Name</label>
                                <input type="text" class="form-control input-soft" id="nama_departmen" name="nama_departmen" placeholder="Input Department Name" required>
                            </div>
                            <div class="mb-3">
                                <label for="manager" class="form-label label-custom">Manager</label>
                                <input type="text" class="form-control input-soft" id="manager" name="manager" placeholder="Input Manager Name" required>
                            </div>
                        </div>
                        <div class="modal-footer modal-footer-custom">
                            <button type="submit" class="btn-submit-black btn-submit-custom">Submit</button>
                        </div>
                    </form>
                </div>
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
                            <div class="mb-2">
                                <label for="edit_nama_departmen" class="form-label label-custom-name">Name</label>
                                <input type="text" class="form-control input-soft" id="edit_nama_departmen" name="nama_departmen" placeholder="Input Department Name" required>
                            </div>
                            <div class="mb-3">
                                <label for="edit_manager" class="form-label label-custom">Manager</label>
                                <input type="text" class="form-control input-soft" id="edit_manager" name="manager" placeholder="Input Manager Name" required>
                            </div>
                        </div>
                        <div class="modal-footer modal-footer-custom">
                            <button type="submit" class="btn-submit-black btn-submit-custom">Update</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

    <x-slot name="script_slot">

        <script>
            $(document).ready(function() {
                $('#btnAddData').click(function() {
                    $('#addDepartmentModal').modal('show');
                });

                $('#addDepartmentForm').submit(function(e) {
                    e.preventDefault();

                    var formData = {
                        nama_departmen: $('#nama_departmen').val(),
                        manager: $('#manager').val(),
                    };

                    $.ajax({
                        url: "{{ route('departments.store') }}",
                        type: "POST",
                        data: formData,
                        headers: {
                            'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
                        },
                        success: function(response) {
                            alert(response.message);
                            $('#addDepartmentModal').modal('hide');
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

                $(document).on('click', '.btn-edit', function() {
                    var id = $(this).data('id');
                    $.ajax({
                        url: '/api/departments/' + id,
                        type: 'GET',
                        success: function(department) {
                            $('#edit_nama_departmen').val(department.nama_departmen);
                            $('#edit_manager').val(department.manager);
                            $('#editDepartmentForm').data('id', id);
                            $('#editDepartmentModal').modal('show');
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
                        nama_departmen: $('#edit_nama_departmen').val(),
                        manager: $('#edit_manager').val(),
                    };

                    $.ajax({
                        url: '/api/departments/' + id,
                        type: 'PUT',
                        data: formData,
                        headers: {
                            'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
                        },
                        success: function(response) {
                            alert(response.message);
                            $('#editDepartmentModal').modal('hide');
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
                    if (!confirm('Are you sure you want to delete this department?')) {
                        return;
                    }
                    var id = $(this).data('id');
                    $.ajax({
                        url: '/api/departments/' + id,
                        type: 'DELETE',
                        headers: {
                            'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
                        },
                        success: function(response) {
                            alert(response.message);
                            loadDepartments();
                        },
                        error: function() {
                            alert('Failed to delete department.');
                        }
                    });
                });
            });

            function loadDepartments() {
                $.ajax({
                    url: "{{ route('departments.index') }}",
                    type: "GET",
                    success: function(departments) {
                        var tbody = $('#departmentTableBody');
                        tbody.empty();
                        $.each(departments, function(index, department) {
                            var row = '<tr>' +
                                '<td>' + department.nama_departmen + '</td>' +
                                '<td>' + department.manager + '</td>' +
                                '<td>' +
                                '<button class="btn btn-sm btn-outline-warning btn-detail" data-id="' + department.id + '">Detail</button> ' +
                                '<button class="btn btn-sm btn-outline-primary btn-edit" data-id="' + department.id + '">Edit</button> ' +
                                '<button class="btn btn-sm btn-outline-danger btn-delete" data-id="' + department.id + '">Delete</button>' +
                                '</td>' +
                                '</tr>';
                            tbody.append(row);
                        });
                    },
                    error: function() {
                        alert('Failed to load departments.');
                    }
                });
            }

            loadDepartments();
        </script>
    </x-slot>

</x-office-layout>
