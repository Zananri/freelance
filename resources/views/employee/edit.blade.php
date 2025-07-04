<x-office-layout>
    <x-slot name="menu_active">
        {{ __('employee') }}
    </x-slot>
    <x-slot name="head_slot">
        <link href="{{ asset('asset/css/employee-create.css') }}" rel="stylesheet">
    </x-slot>

    <div class="title-content d-flex align-items-center gap-2">
        <div class="nav-item d-inline-block">
            <div class="nav-icon-arrow">
                <a href="{{ url('employee') }}" class="text-decoration-none text-dark d-flex align-items-center">
                    <div class="d-flex">
                        <span class="material-symbols-outlined">arrow_back</span>
                    </div>
                </a>
            </div>
        </div>
        <h2 class="m-0">Employee Edit</h2>
    </div>

    <div class="body-content scrollable-container rounded-4" style="margin-top: 20px; width: 100%; font-size:14px;">
        <div class="modal-loading-overlay d-none" id="employeeEditLoader">
            <div class="loader-spinner"></div>
        </div>
        <form id="employeeEditForm" class="needs-validation" enctype="multipart/form-data" novalidate
            action="{{ url('employees/' . $employee->id) }}" method="POST">
            @csrf
            @method('PUT')
            <div class="px-3 py-3" style="">
                <div class="row">
                    <!-- Left Section -->
                    <div class="col-md-4 d-flex flex-column gap-3">
                        <div>
                            <label for="employee_name" class="form-label">Employee Name</label>
                            <input type="text" id="employee_name" name="employee_name" class="form-control"
                                value="{{ $employee->name }}" required />
                            <div class="invalid-feedback">
                                Please enter the employee name.
                            </div>
                        </div>
                        <div>
                            <label for="employee_email" class="form-label">Employee Email</label>
                            <input type="email" id="employee_email" name="employee_email" class="form-control"
                                value="{{ $employee->email }}" required />
                            <div class="invalid-feedback">
                                Please enter a valid email.
                            </div>
                        </div>
                        <div>
                            <label for="employee_email_work" class="form-label">Email Work</label>
                            <input type="email" id="employee_email_work" name="employee_email_work"
                                class="form-control" value="{{ $employee->email_work }}" />
                            <div class="invalid-feedback">
                                Please enter a valid email work.
                            </div>
                        </div>
                        <div>
                            <label for="employee_phone" class="form-label">Employee Phone</label>
                            <input type="number" id="employee_phone" name="employee_phone" class="form-control"
                                value="{{ $employee->phone }}" required />
                            <div class="invalid-feedback">
                                Please enter the employee phone.
                            </div>
                        </div>
                        <div>
                            <label for="address" class="form-label">Address</label>
                            <textarea id="address" name="address" class="form-control" required>{{ $employee->address }}</textarea>
                            <div class="invalid-feedback">
                                Please enter the address.
                            </div>
                        </div>
                        <div>
                            <label for="birth_date" class="form-label">Birth Date</label>
                            <input type="date" id="birth_date" name="birth_date" class="form-control"
                                value="{{ $employee->birth_date }}" required />
                            <div class="invalid-feedback">
                                Please enter the birth date.
                            </div>
                        </div>
                        <div>
                            <label for="hire_date" class="form-label">Hire Date</label>
                            <input type="date" id="hire_date" name="hire_date" class="form-control"
                                value="{{ $employee->hire_date }}" required />
                            <div class="invalid-feedback">
                                Please enter the hire date.
                            </div>
                        </div>
                    </div>

                    <!-- Middle Section -->
                    <div class="col-md-4 d-flex flex-column gap-3">
                        <div>
                            <label for="department_id" class="form-label">Department Name</label>
                            <select id="department_id" name="department_id" class="form-select" required
                                data-current="{{ $employee->department_id }}">
                                <option value="" disabled>Select Department</option>
                                @foreach ($departments as $department)
                                    <option value="{{ $department->id }}"
                                        {{ $employee->department_id == $department->id ? 'selected' : '' }}>
                                        {{ $department->name_department ?? $department->name }}
                                    </option>
                                @endforeach
                            </select>
                            <div class="invalid-feedback">
                                Please select a department.
                            </div>
                        </div>
                        <div>
                            <label for="division_id" class="form-label">Division Name</label>
                            <select id="division_id" name="division_id" class="form-select" required
                                data-current="{{ $employee->division_id }}">
                                <option value="" disabled>Select Division</option>
                            </select>
                            <div class="invalid-feedback">
                                Please select a division.
                            </div>
                        </div>
                        <div>
                            <label for="job_id" class="form-label">Job Name</label>
                            <select id="job_id" name="job_id" class="form-select" required
                                data-current="{{ $employee->job_id }}">
                                <option value="" disabled>Select Job</option>
                            </select>
                            <div class="invalid-feedback">
                                Please select a job.
                            </div>
                        </div>
                        <div>
                            <label for="grade" class="form-label">Grade</label>
                            <select id="grade" name="grade" class="form-select" required>
                                <option value="" disabled selected>Select Grade</option>
                                <option value="Manager" {{ $employee->grade == 'Manager' ? 'selected' : '' }}>Manager
                                </option>
                                <option value="Analyst" {{ $employee->grade == 'Analyst' ? 'selected' : '' }}>Analyst
                                </option>
                                <option value="Senior Analyst"
                                    {{ $employee->grade == 'Senior Analyst' ? 'selected' : '' }}>Senior Analyst
                                </option>
                                <option value="Associate" {{ $employee->grade == 'Associate' ? 'selected' : '' }}>
                                    Associate</option>
                                <option value="Junior Manager"
                                    {{ $employee->grade == 'Junior Manager' ? 'selected' : '' }}>Junior Manager
                                </option>
                                <option value="Junior Analyst"
                                    {{ $employee->grade == 'Junior Analyst' ? 'selected' : '' }}>Junior Analyst
                                </option>
                                <option value="Junior Associate"
                                    {{ $employee->grade == 'Junior Associate' ? 'selected' : '' }}>Junior Associate
                                </option>
                            </select>
                            <div class="invalid-feedback">
                                Please select a grade.
                            </div>
                        </div>
                        <div>
                            <label for="office" class="form-label">Office</label>
                            <select id="office" name="office" class="form-select" required>
                                <option value="" disabled>Select Office</option>
                                <option value="NSA Performance"
                                    {{ $employee->office == 'NSA Performance' ? 'selected' : '' }}>NSA Performance
                                </option>
                                <option value="Gudang SEHA"
                                    {{ $employee->office == 'Gudang SEHA' ? 'selected' : '' }}>Gudang SEHA</option>
                            </select>
                            <div class="invalid-feedback">
                                Please select an office.
                            </div>
                        </div>
                      
                    </div>

                    <!-- Right Section -->
                    <div class="col-md-3">
                        <div class="mb-3">
                            <div class="title-label-image-photo" style="font-size: 14px; color: #555;">
                                <span>Upload Photo</span>
                            </div>
                            <label for="photo"
                                class="custom-image-upload-photo position-relative photo-upload {{ $employee->profile_picture ? 'has-image' : '' }}"
                                style="background-image: url('{{ $employee->profile_picture ? asset($employee->profile_picture) : '' }}'); opacity: {{ $employee->profile_picture ? '1' : '0.5' }};">
                                <input type="file" id="photo" name="photo" accept="image/*"
                                    class="photo-input" hidden />
                                <div class="invalid-feedback" style="position: absolute; bottom: -20px; left: 0;">
                                    Please upload a photo.
                                </div>
                                <span class="image-clear-btn {{ $employee->photo ? '' : 'd-none' }}"
                                    id="photoClearBtn" title="Remove image">&times;</span>
                            </label>
                        </div>
                        <div>
                            <div class="title-label-image-ktp" style="font-size: 14px; color: #555;">
                                <span>Upload KTP</span>
                            </div>
                            <label for="ktp"
                                class="custom-image-upload-ktp position-relative ktp-upload {{ $employee->ktp ? 'has-image' : '' }}"
                                style="background-image: url('{{ $employee->ktp ? asset($employee->ktp) : '' }}'); opacity: {{ $employee->ktp ? '1' : '0.5' }};">
                                <input type="file" id="ktp" name="ktp" accept="image/*"
                                    class="ktp-input" hidden />
                                <div class="invalid-feedback" style="position: absolute; bottom: -20px; left: 0;">
                                    Please upload a photo.
                                </div>
                                <span class="image-clear-btn {{ $employee->ktp ? '' : 'd-none' }}" id="ktpClearBtn"
                                    title="Remove image">&times;</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div class="text-center px-2 py-3">
                    <button type="submit" class="btn-submit-black btn-submit-custom" style="font-size: 14px;">Update
                        Employee</button>
                </div>
        </form>
    </div>
    <div id="formAlert" class="mt-3"></div>

    <x-slot name="script_slot">
        <script>
            // Pass current employee IDs to JS
            window.currentEmployeeData = {
                departmentId: "{{ $employee->department_id }}",
                divisionId: "{{ $employee->division_id }}",
                jobId: "{{ $employee->job_id }}"
            };
        </script>
        <script src="{{ asset('asset/js/edit-employee.js') }}"></script>
    </x-slot>
</x-office-layout>
