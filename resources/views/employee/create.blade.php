<x-office-layout>
    <x-slot name="head_slot">
        <link href="{{ asset('asset/css/employee-create.css') }}" rel="stylesheet">
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
        <h2 class="m-0">Employee Create</h2>
    </div>

    <div class="body-content scrollable-container rounded-4 px-3 py-3" style="margin-top: 20px; width: 100%;">
        <form>
            <div class="row">
                <!-- Left Section -->
                <div class="col-md-4 d-flex flex-column gap-3">
                    <div>
                        <label for="department_id" class="form-label">Select Department</label>
                        <select id="department_id" name="department_id" class="form-select" required>
                            <option value="" disabled selected>Select Department</option>
                        </select>
                    </div>
                    <div>
                        <label for="division_id" class="form-label">Select Division</label>
                        <select id="division_id" name="division_id" class="form-select" required>
                            <option value="" disabled selected>Select Division</option>
                        </select>
                    </div>
                    <div>
                        <label for="job_id" class="form-label">Select Job</label>
                        <select id="job_id" name="job_id" class="form-select" required>
                            <option value="" disabled selected>Select Job</option>
                        </select>
                    </div>
                    <div>
                        <label for="employee_name" class="form-label">Employee Name</label>
                        <input type="text" id="employee_name" name="employee_name" class="form-control" placeholder="Input Employee Name" required />
                    </div>
                    <div>
                        <label for="employee_email" class="form-label">Employee Email</label>
                        <input type="email" id="employee_email" name="employee_email" class="form-control" placeholder="Input Employee Email" required />
                    </div>
                    <div>
                        <label for="employee_phone" class="form-label">Employee Phone</label>
                        <input type="number" id="employee_phone" name="employee_phone" class="form-control" placeholder="Inpuet Employee Phone" required />
                    </div>
                </div>

                <!-- Middle Section -->
                <div class="col-md-3 d-flex flex-column gap-3">
                    <div>
                        <label for="address" class="form-label">Address</label>
                        <input type="text" id="address" name="address" class="form-control" required />
                    </div>
                    <div>
                        <label for="photo" class="form-label">Upload Photo</label>
                        <input type="file" id="photo" name="photo" class="form-control" accept="image/*" />
                    </div>
                    <div>
                        <label for="ktp" class="form-label">Upload KTP</label>
                        <input type="file" id="ktp" name="ktp" class="form-control" accept="image/*" />
                    </div>
                    <div>
                        <label for="birth_date" class="form-label">Birth Date</label>
                        <input type="date" id="birth_date" name="birth_date" class="form-control" required />
                    </div>
                    <div>
                        <label for="grade" class="form-label">Grade</label>
                        <select id="grade" name="grade" class="form-select" required>
                            <option value="" disabled selected>Select Grade</option>
                            <option value="General Manager">General Manager</option>
                            <option value="Manager">Manager</option>
                            <option value="Leader">Leader</option>
                            <option value="Employee">Employee</option>
                        </select>
                    </div>
                    <div>
                        <label for="office" class="form-label">Office</label>
                        <select id="office" name="office" class="form-select" required>
                            <option value="" disabled selected>Select Office</option>
                            <option value="NSA Performance">NSA Performance</option>
                            <option value="Gudang SEHA">Gudang SEHA</option>
                        </select>
                    </div>
                </div>

                <!-- Right Section -->
                <div class="col-md-4 d-flex flex-column align-items-start gap-3">
                    <div>
                        <label for="status" class="form-label">Status</label>
                        <select id="status" name="status" class="form-select" required>
                            <option value="" disabled selected>Select Status</option>
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                        </select>
                    </div>
                    <div>
                        <div class="title-label-image">
                            <span>Upload Profile Picture</span>
                        </div>
                        <label for="profile_picture" class="custom-image-upload position-relative profile-picture-upload">
                            <input type="file" id="profile_picture" name="profile_picture" accept="image/*" class="profile-picture-input" hidden/>
                            <span class="image-clear-btn d-none" id="profilePictureClearBtn" title="Remove image">&times;</span>
                        </label>
                    </div>
                </div>
            </div>
        </form>
    </div>

    <x-slot name="script_slot">
        <script src="{{ asset('asset/js/employee-create.js') }}"></script>
    </x-slot>
</x-office-layout>
</create_file>
