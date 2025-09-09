<x-office-layout>
    <x-slot name="menu_active">
        {{ __('profile') }}
    </x-slot>
    <x-slot name="head_slot">
        <link href="{{ asset('asset/css/profile.css?v=' . time()) }}" rel="stylesheet">
    </x-slot>

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

    <div class="title-content d-flex align-items-center">
        <h2 class="m-0">Profile</h2>
    </div>

    <div class="scrollable rounded-4">
        <form id="profileForm" class="needs-validation position-relative" enctype="multipart/form-data" novalidate
            method="POST" action="{{ route('profile.update', ['id' => $id]) }}">
            @csrf

            <!-- Alert container for Bootstrap alerts -->
            <div id="formAlert" class="mb-3"></div>

            <!-- Loader overlay -->
            <div id="profileLoaderOverlay" class="modal-loading-overlay d-none">
                <div class="loader-spinner"></div>
            </div>

            <div class="row profile-card-wrapper">
                <div class="col-md-4 d-flex flex-column gap-3">
                    <div class="body-content profile-section p-5 pt-4 text-center">
                        <!-- Profile Picture Wrapper -->
                        <label for="profile_photo_input" id="profileImageLabel" class="custom-image-upload position-relative {{ ($profilePhotoUrl ?? null) ? 'has-image' : '' }}" style="background-position:center; background-repeat:no-repeat; background-size:55%;">
                            <input type="file" id="profile_photo_input" name="profile_photo" accept="image/*" hidden />
                            <img id="profilePreview" src="{{ $profilePhotoUrl ?? '' }}" alt="" style="{{ ($profilePhotoUrl ?? null) ? '' : 'display:none;' }}">
                            <button type="button" id="clearProfilePhotoBtn" style="display: {{ ($profilePhotoUrl ?? null) ? 'flex' : 'none' }}; align-items:center; justify-content:center;" title="Clear Image">&times;</button>
                        </label>
                        <!-- Placeholder to force empty removal flag -->
                        <input type="hidden" name="remove_profile_photo" id="remove_profile_photo" value="0" />

                        <!-- User Info -->
                        <h5 class="text-employee-name mt-3 mb-2">{{ $employee->name }}</h5>
                        <p class="text-division mb-4">{{  $employee->grade->title }}</p>

                        <!-- Current Password -->
                        <div class="mb-3 text-start">
                            <input type="password" id="current_password" name="current_password"
                                placeholder="Current password"
                                class="current custom-password-btn form-control input-text" required />
                            <div class="valid-feedback">Current password is correct.</div>
                            <div class="invalid-feedback">Current password is incorrect.</div>
                        </div>

                        <!-- New Password -->
                        <div class="mb-3 text-start">
                            <input type="password" id="new_password" name="password" placeholder="New password"
                                class="current custom-password-btn form-control input-text" required />
                            <div class="invalid-feedback">Please enter a new password.</div>
                        </div>

                        <!-- Change Password Button -->
                        <div class="mb-3 text-center">
                            <button type="submit" class="btn-submit custom-submit" disabled>
                                Change Password
                            </button>
                        </div>

                        <!-- Upload Profile Picture Submit (separate action) -->
                        <div class="mb-3 text-center">
                            <button type="button" id="uploadProfilePhotoBtn" class="btn-submit custom-submit">Upload Profile Picture</button>
                        </div>
                    </div>
                </div>

                <!-- Middle Section: originally left section fields -->
                <div class="col-md-4 d-flex flex-column gap-3">
                    <div class="body-content personal-info p-5 pe-3">
                        <h5 class="fw-normal mb-4" style="font-size: 24px;">Personal Info</h5>

                        <div class="info-item d-flex align-items-center gap-3 mb-4">
                            <div class="icon-circle email">
                                <span class="material-symbols-outlined">mail</span>
                            </div>
                            <div>
                                <div class="label">Email</div>
                                <div class="value">{{ $employee->email_work }}</div>
                            </div>
                        </div>

                        <div class="info-item d-flex align-items-start gap-3 mb-4">
                            <div class="icon-circle phone">
                                <span class="material-symbols-outlined">call</span>
                            </div>
                            <div>
                                <p class="label">Phone Number</p>
                                <div class="value">{{ $employee->phone }}</div>
                            </div>
                        </div>

                        <div class="info-item d-flex align-items-start gap-3 mb-4">
                            <div class="icon-circle department">
                                <span class="material-symbols-outlined">work</span>
                            </div>
                            <div>
                                <p class="label">Department & Division</p>
                                <div class="value">
                                    @if ($employee && $employee->department)
                                        {{ $employee->department->name_department }}
                                    @else
                                        <span style="color:red;">Department not assigned</span>
                                    @endif
                                    <span>/</span>
                                    @if ($employee && $employee->division)
                                        {{ $employee->division->name_division }}
                                    @else
                                        <span style="color:red;">Division not assigned</span>
                                    @endif
                                </div>

                            </div>
                        </div>

                        <div class="info-item d-flex align-items-start gap-3 mb-4">
                            <div class="icon-circle job">
                                <span class="material-symbols-outlined">assignment</span>
                            </div>
                            <div>
                                <p class="label">Job</p>
                                <div class="value">
                                    @if ($employee && $employee->job)
                                        {{ $employee->job->job_name }}
                                    @else
                                        <span style="color:red;">Division not assigned</span>
                                    @endif
                                </div>
                            </div>
                        </div>

                        <div class="info-item d-flex align-items-start gap-3">
                            <div class="icon-circle address">
                                <span class="material-symbols-outlined">location_on</span>
                            </div>
                            <div>
                                <p class="label">Address</p>
                                <div class="value">{{ $employee->address }}</div>
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
