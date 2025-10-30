<x-office-layout>
    <x-slot name="menu_active">
        {{ __('profile') }}
    </x-slot>
    <x-slot name="head_slot">
        <link href="{{ asset('asset/css/profile.css?v='.time()) }}" rel="stylesheet">
    </x-slot>

    <div class="title-content d-flex align-items-center mb-4">
        <h2 class="m-0">Profile</h2>
    </div>

    <div class="scrollable rounded-4">        

            <div class="row profile-card-wrapper">

                <div class="col-md-4  mb-4 col-photo-password">

                    <div class=" bg-card-1 rounded-4 p-5 pt-4 text-center position-relative">

                        
                        @if (in_array(Auth::user()->user_type,['ADMINISTRATOR','MANAGEMENT']) && in_array(Auth::user()->user_role,['ADMINISTRATOR','GENERAL_MANAGER']))
                        
                        @php
                            $data_to_encrypt = Auth::user()->id.','.Auth::user()->email; // The string you want to encrypt
                            $cipher_method = "aes-256-cbc"; // Choose a strong cipher method '37,gio.ginanjar@nsaperformance.id'; //
                            $key = env('APP_KEY'); // A strong, securely generated key
                            $iv_length = openssl_cipher_iv_length($cipher_method);
                            $iv = openssl_random_pseudo_bytes($iv_length); // Generate a random IV

                            $encrypted_data = openssl_encrypt($data_to_encrypt, $cipher_method, $key, 0, $iv);

                            // Encode the IV and encrypted data for URL safety
                            $encoded_iv = urlencode(base64_encode($iv));
                            $encoded_encrypted_data = urlencode(base64_encode($encrypted_data));

                            $encrypted_url_string = "auth_url?token_data=" . $encoded_encrypted_data . "&iv=" . $encoded_iv;
                            $linkCopied = url($encrypted_url_string);
                            
                        @endphp
                        
                        <div class="btn-copy-link-auth z-3" data-copied-link="{{ $linkCopied }}" data-bs-toggle="tooltip" data-bs-trigger="focus" data-bs-title="Link Copied !">
                            <div>
                                <span class="material-symbols-outlined fs-14 cursor-pointer">content_copy</span>
                            </div>
                            <div class="fs-10">
                                Link Auth
                            </div>
                        </div>  
                                               
                        @endif

                        <input type="hidden" class="d-none" id="old_profile_photo" value="{{ asset($employee->profile_picture) }}" />

                        <form id="formPhotoProfile" class="needs-validation position-relative" enctype="multipart/form-data" novalidate>
                            @csrf

                            <div>
                                <!-- Profile Picture Wrapper -->
                                <label for="profile_photo_input" id="profileImageLabel" class="custom-image-upload position-relative">
                                    <input type="file" class="d-none" id="profile_photo_input" value="{{ asset($employee->profile_picture) }}" name="profile_photo" accept="image/*" />
                                    <img id="profilePreview" src="{{ asset($employee->profile_picture) }}" alt="" class="rounded-circle object-fit-cover" style="width: 70px; height: 70px;" class="rounded-circle">
                                    <div class="icon-change">
                                        <span class="material-symbols-outlined">edit</span>
                                    </div>
                                </label>
                                <!-- Placeholder to force empty removal flag -->
                                <input type="hidden" name="remove_profile_photo" id="remove_profile_photo" value="0" />
                            </div>
                        </form>
                        
                        <div class="box-btn-change-photo-profil mt-3 mb-5">
                            <div class="row">
                                <div class="col-6">
                                    <div class="btn-cancel w-100">Cancel</div>
                                </div>
                                <div class="col-6">
                                    <div class="btn-save w-100">Save</div>
                                </div>
                            </div>
                        </div>

                        <!-- User Info -->
                        <h5 class="text-employee-name mt-3 mb-2">{{ $employee->name }}</h5>
                        <p class="text-division mb-5">{{  $employee->grade->title }}</p>

                        <form id="formEditPassword" class="needs-validation position-relative" novalidate >
                            @csrf
    
                            <div>

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
                                    <input type="password" id="new_password" name="new_password" placeholder="New password" class="current custom-password-btn form-control input-text" required />
                                    <div class="invalid-feedback">Please enter a new password.</div>
                                </div>

                                <div class="mb-3 text-start">
                                    <input type="password" id="new_password_confirmation" name="new_password_confirmation" placeholder="Confirm password" class="current custom-password-btn form-control input-text" required />
                                    <div class="invalid-feedback">Password does not match.</div>
                                </div>

                                <!-- Change Password Button -->
                                <div class="mb-3 text-center">
                                    <div class="custom-submit" id="btnChangePassword">
                                        Change Password
                                    </div>
                                </div>

                            </div>
                        </form>
                        
                        


                        <div class="loader" >
                            <div class="box-loader rounded-20" >
                                <div class="text-center">
                                    <div class="spinner-border text-secondary" role="status">
                                        <span class="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                    </div>
                </div>

                <!-- Middle Section: originally left section fields -->
                <div class="col-md-4  mb-5">
                    <div class="personal-info bg-card-1 rounded-4 p-5 pt-4 pe-3">

                        <h5 class="fw-light fs-24 mb-4">Personal Info</h5>

                        

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
    
    </div>

    <x-slot name="script_slot">
        <script src="{{ asset('asset/js/profile.js') }}?v={{ time() }}"></script>
    </x-slot>
</x-office-layout>
