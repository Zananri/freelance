<x-office-layout>
    <x-slot name="menu_active">
        {{ __('employee') }}
    </x-slot>
    <x-slot name="head_slot">
        <link href="{{ asset('asset/css/employee-create.css') }}" rel="stylesheet">
    </x-slot>

      <!-- SVG Symbols -->
    <svg xmlns="http://www.w3.org/2000/svg" style="display: none;">
        <symbol id="check-circle-fill" fill="currentColor" viewBox="0 0 16 16">
            <path
                d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
        </symbol>
        <symbol id="info-fill" fill="currentColor" viewBox="0 0 16 16">
            <path
                d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
        </symbol>
        <symbol id="exclamation-triangle-fill" fill="currentColor" viewBox="0 0 16 16">
            <path
                d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
        </symbol>
    </svg>

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
            action="{{ url('employee/' . $employee->id) }}" method="POST">
            @csrf
            @method('PUT')
            <div class="px-3 py-3" style="">
                <div class="row">
                    <!-- Left Section -->
                    <div class="col-md-4 d-flex flex-column gap-3">
                        <div>
                            <label for="employee_name" class="form-label">Employee Name</label>
                            <input type="text" id="employee_name" name="employee_name"
                                class="form-control input-text" value="{{ $employee->name }}" required />
                            <div class="invalid-feedback">
                                Please enter the employee name.
                            </div>
                        </div>
                        <div>
                            <label for="employee_niks" class="form-label">Employee ID</label>
                            <input type="text" id="employee_niks" name="employee_niks"
                                class="form-control input-text" value="{{ $employee->employee_niks }}" />
                            <div class="invalid-feedback">
                                Please enter the employee NIKS.
                            </div>
                        </div>
                        <div>
                            <label for="employee_email" class="form-label">Employee Email</label>
                            <input type="email" id="employee_email" name="employee_email"
                                class="form-control input-text" value="{{ $employee->email }}" required />
                            <div class="invalid-feedback">
                                Please enter a valid email.
                            </div>
                        </div>
                        <div>
                            <label for="employee_email_work" class="form-label">Email Work</label>
                            <input type="email" id="employee_email_work" name="employee_email_work"
                                class="form-control input-text" value="{{ $employee->email_work }}" />
                            <div class="invalid-feedback">
                                Please enter a valid email work.
                            </div>
                        </div>
                        <div>
                            <label for="employee_phone" class="form-label">Employee Phone</label>
                            <input type="number" id="employee_phone" name="employee_phone"
                                class="form-control input-text" value="{{ $employee->phone }}" required />
                            <div class="invalid-feedback">
                                Please enter the employee phone.
                            </div>
                        </div>
                        <div>
                            <label for="address" class="form-label">Address</label>
                            <textarea id="address" name="address" class="form-control input-text" required>{{ $employee->address }}</textarea>
                            <div class="invalid-feedback">
                                Please enter the address.
                            </div>
                        </div>
                        <div>
                            <label for="birth_date" class="form-label">Birth Date</label>
                            <input type="date" id="birth_date" name="birth_date" class="form-control input-text"
                                value="{{ $employee->birth_date }}" required />
                            <div class="invalid-feedback">
                                Please enter the birth date.
                            </div>
                        </div>
                        <div>
                            <label for="hire_date" class="form-label">Hire Date</label>
                            <input type="date" id="hire_date" name="hire_date" class="form-control input-text"
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
                            <select id="department_id" name="department_id" class="form-select input-select" required
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
                            <select id="division_id" name="division_id" class="form-select input-select" required
                                data-current="{{ $employee->division_id }}">
                                <option value="" disabled>Select Division</option>
                                @foreach ($divisions as $division)
                                    <option value="{{ $division->id }}"
                                        {{ $employee->division_id == $division->id ? 'selected' : '' }}>
                                        {{ $division->name_division ?? $division->name }}
                                    </option>
                                @endforeach
                            </select>
                            <div class="invalid-feedback">
                                Please select a division.
                            </div>
                        </div>
                        <div>
                            <label for="job_id" class="form-label">Job Name</label>
                            <select id="job_id" name="job_id" class="form-select input-select" required
                                data-current="{{ $employee->job_id }}">
                                <option value="" disabled>Select Job</option>
                                @foreach ($jobs as $job)
                                    <option value="{{ $job->id }}"
                                        {{ $employee->job_id == $job->id ? 'selected' : '' }}>
                                        {{ $job->job_name ?? $job->name }}
                                    </option>
                                @endforeach
                            </select>
                            <div class="invalid-feedback">
                                Please select a job.
                            </div>
                        </div>
                        <div>
                            <label for="grade" class="form-label">Grade</label>
                            <select id="grade" name="grade" class="form-select input-select" required>
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
                            <select id="office" name="office" class="form-select input-select" required>
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

                        <!-- Shift selection (from shifts table) -->
                        <div>
                            <label for="shift_id" class="form-label">Shift</label>
                            <select id="shift_id" name="shift_id" class="form-select input-select" required data-current="{{ $employee->shift_id }}" data-fetch-url="{{ route('shift.list') }}">
                                <option value="" disabled>Select Shift</option>
                            </select>
                            <div class="invalid-feedback">
                                Please select a shift.
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
                                class="custom-image-upload-photo position-relative photo-upload {{ $employee->photo ? 'has-image' : '' }}"
                                style="background-image: url('{{ $employee->photo ? asset($employee->photo) : '' }}'); opacity: {{ $employee->photo ? '1' : '0.5' }}; background-size: cover;">
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
                    <button type="submit" class="btn-submit-black" style="font-size: 14px;">Update
                        Employee</button>
                </div>
        </form>
    </div>

    <div id="formAlert" class="mt-3"></div>

    <div id="floatingAlert" class="alert alert-success d-none d-flex align-items-center" role="alert" style="position: fixed; bottom: 20px; right: 20px; z-index: 9999; min-width: 300px; border-radius: 8px; padding: 10px 20px;">
        <svg class="bi flex-shrink-0 me-2" width="24" height="24" role="img" aria-label="Success:">
            <use xlink:href="#check-circle-fill"/>
        </svg>
        <div>
            Employee updated successfully.
        </div>
    </div>

  

    <x-slot name="script_slot">
    <script src="{{ asset('asset/js/edit-employee.js') }}?v={{ time() }}"></script>
    </x-slot>
</x-office-layout>
