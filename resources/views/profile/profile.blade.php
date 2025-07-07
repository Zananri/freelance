<x-office-layout>
    <x-slot name="menu_active">
        {{ __('profile') }}
    </x-slot>
    <x-slot name="head_slot">
        <link href="{{ asset('asset/css/profile.css') }}" rel="stylesheet">
    </x-slot>

    <div class="title-content d-flex align-items-center gap-2">
        <h2 class="m-0">Profile</h2>
    </div>

    <div class="body-content scrollable-container rounded-4" style="margin-top: 20px; width: 100%; font-size:14px;">
        <form id="profileForm" class="needs-validation position-relative" enctype="multipart/form-data" novalidate method="POST"
            action="{{ route('profile.update') }}">
            @csrf

            <!-- Alert container for Bootstrap alerts -->
            <div id="formAlert" class="mb-3"></div>

            <!-- Loader overlay -->
            <div id="profileLoaderOverlay" class="modal-loading-overlay d-none">
                <div class="loader-spinner"></div>
            </div>

            <div class="px-3 py-3">
                <div class="row">
                    <!-- Left Section: Profile Image -->
                    <div class="col-md-3 d-flex flex-column align-items-center gap-3">
                        <div class="title-label-image-photo" style="font-size: 14px; color: #555;">
                            <span>Profile Photo</span>
                        </div>
                        <label for="profile_photo"
                            class="custom-image-upload-photo position-relative profile-photo-upload"
                            style="background-image: url('{{ asset(Auth::user()->photo ?? "asset/img/image.png") }}');">
                            <input type="file" id="profile_photo" name="profile_photo" accept="image/*"
                                class="photo-input" hidden />
                            <span class="image-clear-btn d-none" id="profilePhotoClearBtn"
                                title="Remove image">&times;</span>
                        </label>
                        <div>
                            <label for="current_password" class="form-label">Current Password</label>
                            <input type="password" id="current_password" name="current_password" class="form-control input-text" required />
                            <div class="valid-feedback">
                                Current password is correct.
                            </div>
                            <div class="invalid-feedback">
                                Current password is incorrect.
                            </div>
                        </div>
                        <div>
                            <label for="new_password" class="form-label">New Password</label>
                            <input type="password" id="new_password" name="password" class="form-control input-text" required disabled />
                            <div class="invalid-feedback">
                                Please enter a new password.
                            </div>
                        </div>
                        <div class="text-center px-2 py-3">
                            <button type="submit" class="btn-submit-black btn-submit-custom" style="font-size: 14px;" disabled>Update</button>
                        </div>
                    </div>

                    <!-- Middle Section: originally left section fields -->
                    <div class="col-md-4 d-flex flex-column gap-3">
                        <div>
                            <label for="employee_name" class="form-label">Employee Name</label>
                            <input type="text" id="employee_name" name="employee_name" class="form-control input-text" required
                                readonly disabled />
                            <div class="invalid-feedback">
                                Please enter the employee name.
                            </div>
                        </div>
                        <div>
                            <label for="employee_email" class="form-label">Employee Email</label>
                            <input type="email" id="employee_email" name="employee_email" class="form-control input-text"
                                required readonly disabled />
                            <div class="invalid-feedback">
                                Please enter a valid email.
                            </div>
                        </div>
                        <div>
                            <label for="employee_email_work" class="form-label">Email Work</label>
                            <input type="email" id="employee_email_work" name="employee_email_work"
                                class="form-control input-text" readonly disabled />
                            <div class="invalid-feedback">
                                Please enter a valid email work.
                            </div>
                        </div>
                        <div>
                            <label for="employee_phone" class="form-label">Employee Phone</label>
                            <input type="number" id="employee_phone" name="employee_phone" class="form-control input-text"
                                required readonly disabled />
                            <div class="invalid-feedback">
                                Please enter the employee phone.
                            </div>
                        </div>
                        <div>
                            <label for="address" class="form-label">Address</label>
                            <textarea id="address" name="address" class="form-control input-text" required readonly disabled></textarea>
                            <div class="invalid-feedback">
                                Please enter the address.
                            </div>
                        </div>
                        <div>
                            <label for="birth_date" class="form-label">Birth Date</label>
                            <input type="date" id="birth_date" name="birth_date" class="form-control input-text" required
                                readonly disabled />
                            <div class="invalid-feedback">
                                Please enter the birth date.
                            </div>
                        </div>

                    </div>

                    <!-- Right Section: originally middle section fields -->
                    <div class="col-md-4 d-flex flex-column gap-3">
                        <div>
                            <label for="department_id" class="form-label">Department Name</label>
                            <input type="text" id="department_id" name="department_id" class="form-control input-text" required
                                readonly disabled />
                            <div class="invalid-feedback">
                                Please select a department.
                            </div>
                        </div>
                        <div>
                            <label for="division_id" class="form-label">Division Name</label>
                            <input type="text" id="division_id" name="division_id" class="form-control input-text" required
                                readonly disabled />
                            <div class="invalid-feedback">
                                Please select a division.
                            </div>
                        </div>
                        <div>
                            <label for="job_id" class="form-label">Job Name</label>
                            <input type="text" id="job_id" name="job_id" class="form-control input-text" required
                                readonly disabled />
                            <div class="invalid-feedback">
                                Please select a job.
                            </div>
                        </div>
                        <div>
                            <label for="grade" class="form-label">Grade</label>
                            <input type="text" id="grade" name="grade" class="form-control input-text" required
                                readonly disabled />
                            <div class="invalid-feedback">
                                Please select a grade.
                            </div>
                        </div>
                        <div>
                            <label for="office" class="form-label">Office</label>
                            <input type="text" id="office" name="office" class="form-control input-text" required
                                readonly disabled />
                            <div class="invalid-feedback">
                                Please select an office.
                            </div>
                        </div>
                        <div>
                            <label for="hire_date" class="form-label">Hire Date</label>
                            <input type="date" id="hire_date" name="hire_date" class="form-control input-text" required
                                readonly disabled />
                            <div class="invalid-feedback">
                                Please enter the hire date.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
    </div>
    </form>
    </div>

    <x-slot name="script_slot">
        <script src="{{ asset('asset/js/profile.js') }}"></script>
    </x-slot>
</x-office-layout>
