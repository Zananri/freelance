<x-office-layout>
    <x-slot name="head_slot">
        <link href="{{ asset('asset/css/edit-employee.css') }}" rel="stylesheet">
    </x-slot>

    <div class="title-content d-flex align-items-center gap-2">
        <div class="nav-item d-inline-block">
            <div class="nav-icon-arrow">
                <a href="{{ url('employee-page') }}" class="text-decoration-none text-dark d-flex align-items-center">
                    <div class="d-flex">
                        <span class="material-symbols-outlined">arrow_back</span>
                    </div>
                </a>
            </div>
        </div>
        <h2 class="m-0">Edit Employee</h2>
    </div>

    <div class="body-content scrollable-container rounded-4 px-3 py-3"
        style="margin-top: 20px; width: 100%; font-size:14px;">
        <div class="modal-loading-overlay d-none" id="employeeEditLoader">
            <div class="loader-spinner"></div>
        </div>
        <form id="employeeEditForm" method="POST" action="{{ route('employees.update', $employee->id) }}"
            enctype="multipart/form-data" novalidate>
            @csrf
            @method('PUT')
            <div class="row">
                <!-- Left Section -->
                <div class="col-md-4 d-flex flex-column gap-3">
                    <div>
                        <label for="department_id" class="form-label">Department Name</label>
                        <select id="department_id" name="department_id" class="form-select" required>
                            <option value="" disabled>Select Department</option>
                            @foreach ($departments as $department)
                                <option value="{{ $department->id }}"
                                    {{ old('department_id', $employee->department_id) == $department->id ? 'selected' : '' }}>
                                    {{ $department->name_department }}
                                </option>
                            @endforeach
                        </select>
                    </div>
                    <div>
                        <label for="division_id" class="form-label">Division Name</label>
                        <select id="division_id" name="division_id" class="form-select" required>
                            <option value="" disabled>Select Division</option>
                            @foreach ($divisions as $division)
                                <option value="{{ $division->id }}"
                                    {{ old('division_id', $employee->division_id) == $division->id ? 'selected' : '' }}>
                                    {{ $division->name_division }}
                                </option>
                            @endforeach
                        </select>
                    </div>
                    <div>
                        <label for="job_id" class="form-label">Job Name</label>
                        <select id="job_id" name="job_id" class="form-select" required>
                            <option value="" disabled>Select Job</option>
                            @foreach ($jobs as $job)
                                <option value="{{ $job->id }}"
                                    {{ old('job_id', $employee->job_id) == $job->id ? 'selected' : '' }}>
                                    {{ $job->job_name }}
                                </option>
                            @endforeach
                        </select>
                    </div>
                    <div>
                        <label for="name" class="form-label">Employee Name</label>
                        <input type="text" id="name" name="name" class="form-control"
                            placeholder="Input Employee Name" value="{{ old('name', $employee->name) }}" required />
                    </div>
                    <div>
                        <label for="email" class="form-label">Employee Email</label>
                        <input type="email" id="email" name="email" class="form-control"
                            placeholder="Input Employee Email" value="{{ old('email', $employee->email) }}" required />
                    </div>
                    <div>
                        <label for="phone" class="form-label">Employee Phone</label>
                        <input type="text" id="phone" name="phone" class="form-control"
                            placeholder="Input Employee Phone" value="{{ old('phone', $employee->phone) }}" required />
                    </div>
                </div>

                <!-- Middle Section -->
                <div class="col-md-3 d-flex flex-column gap-3">
                    <div>
                        <label for="address" class="form-label">Address</label>
                        <input type="text" id="address" name="address" class="form-control"
                            placeholder="Input Employee Address" value="{{ old('address', $employee->address) }}"
                            required />
                    </div>
                    <div>
                        <label for="photo" class="form-label">Upload Photo</label>
                        <input type="file" id="photo" name="photo" class="form-control" accept="image/*" />
                        @if ($employee->photo)
                            <div class="small text-muted mt-1">Current file:
                                <span>{{ basename($employee->photo) }}</span></div>
                        @endif
                    </div>
                    <div>
                        <label for="ktp" class="form-label">Upload KTP</label>
                        <input type="file" id="ktp" name="ktp" class="form-control" accept="image/*" />
                        @if ($employee->ktp)
                            <div class="small text-muted mt-1">Current file:
                                <span>{{ basename($employee->ktp) }}</span></div>
                        @endif
                    </div>
                    <div>
                        <label for="birth_date" class="form-label">Birth Date</label>
                        <input type="date" id="birth_date" name="birth_date" class="form-control"
                            value="{{ old('birth_date', $employee->birth_date) }}" required />
                    </div>
                    <div>
                        <label for="grade" class="form-label">Grade</label>
                        <select id="grade" name="grade" class="form-select" required>
                            <option value="" disabled>Select Grade</option>
                            <option value="General Manager"
                                {{ old('grade', $employee->grade) == 'General Manager' ? 'selected' : '' }}>General
                                Manager</option>
                            <option value="Manager"
                                {{ old('grade', $employee->grade) == 'Manager' ? 'selected' : '' }}>Manager</option>
                            <option value="Leader"
                                {{ old('grade', $employee->grade) == 'Leader' ? 'selected' : '' }}>Leader</option>
                            <option value="Employee"
                                {{ old('grade', $employee->grade) == 'Employee' ? 'selected' : '' }}>Employee
                            </option>
                        </select>
                    </div>
                    <div>
                        <label for="office" class="form-label">Office</label>
                        <select id="office" name="office" class="form-select" required>
                            <option value="" disabled>Select Office</option>
                            <option value="NSA Performance"
                                {{ old('office', $employee->office) == 'NSA Performance' ? 'selected' : '' }}>NSA
                                Performance</option>
                            <option value="Gudang SEHA"
                                {{ old('office', $employee->office) == 'Gudang SEHA' ? 'selected' : '' }}>Gudang SEHA
                            </option>
                        </select>
                    </div>
                </div>

                <!-- Right Section -->
                <div class="col-md-4 d-flex flex-column align-items-start gap-3">
                    <div class="d-flex gap-3">
                        <div>
                            <label for="status" class="form-label">Status</label>
                            <select id="status" name="status" class="form-select" required>
                                <option value="ACTIVE"
                                    {{ old('status', $employee->status) == 'ACTIVE' ? 'selected' : '' }}>Active
                                </option>
                                <option value="INACTIVE"
                                    {{ old('status', $employee->status) == 'INACTIVE' ? 'selected' : '' }}>Inactive
                                </option>
                            </select>
                        </div>
                        <div>
                            <label for="hire_date" class="form-label">Hire Date</label>
                            <input type="date" id="hire_date" name="hire_date" class="form-control"
                                value="{{ old('hire_date', $employee->hire_date) }}" required />
                        </div>
                    </div>
                    <div>
                        <div class="title-label-image" style="font-size: 14px;">
                            <span>Upload Profile Picture</span>
                        </div>
                        <label for="profile_picture"
                            class="custom-image-upload position-relative profile-picture-upload {{ $employee->profile_picture ? 'has-image' : '' }}"
                            @if ($employee->profile_picture) style="background-image: url('/{{ $employee->profile_picture }}'); background-size: cover; background-position: center;" @endif>
                            <input type="file" id="profile_picture" name="profile_picture" accept="image/*"
                                class="profile-picture-input" hidden/>
                            <span class="image-clear-btn {{ $employee->profile_picture ? '' : 'd-none' }}"
                                id="profilePictureClearBtn" title="Remove image">&times;</span>
                        </label>
                    </div>
                    <div class="mt-3">
                        <button type="submit" class="btn-submit-black btn-submit-custom" style="font-size: 14px;">Update
                            Employee</button>
                    </div>
                </div>
            </div>

        </form>
    </div>
    <div id="formAlert" class="mt-3"></div>

    <x-slot name="script_slot">
        <script src="{{ asset('asset/js/edit-employee.js') }}"></script>
    </x-slot>
</x-office-layout>
