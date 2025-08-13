<x-office-layout>
    <x-slot name="menu_active">
        {{ __('dashboard') }}
    </x-slot>
    <x-slot name="head_slot">
        <link href="{{ asset('asset/css/dashboard.css') }}" rel="stylesheet">
    </x-slot>
    <div class="title-content">
        <h2>Dashboard</h2>
    </div>
    <div class="dashboard-wrapper">
        <div class="dashboard-attendance-content">
            <div class="attendance-card">
                <div class="attendance-body">
                    <div class="profile-image-container">
                        <img class="profile-image" src="{{ $photo }}" alt="User Profile">
                    </div>
                    <div class="profile-text mt-4">
                        <p class="user-name">{{ $employee ? $employee->name : 'User Name :' }}</p>
                        <p class="user-division">
                            @if ($employee && $employee->division)
                                {{ $employee->division->name_division }}
                            @else
                                <span style="color:red;">Division not assigned</span>
                            @endif
                        </p>
                    </div>
                    <div class="attendance-actions mt-4 w-100">
                        <button class="btn btn-primary" id="checkInBtn">
                            <span class="material-symbols-outlined">alarm_on</span>
                            Check In
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <div class="dashboard-date-content">
            
        </div>

        {{-- Modal for checkin --}}
        <div class="modal fade" id="checkInModal" tabindex="-1" aria-labelledby="checkInModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content rounded-4">
                    <div class="modal-header modal-header-custom">
                        <h5 class="modal-title modal-title-custom" id="checkInModalLabel">Check In Attendance</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="checkInForm">
                            <!-- employee_id -->
                            <input type="hidden" name="employee_id" id="employee_id"
                                value="{{ $employee ? $employee->id : '' }}">
                            <!-- is_work_outside -->
                            <div class="mb-3">
                                <label for="is_work_outside" class="form-label">Work Outside</label>
                                <div class="work-outside-container">
                                    <div class="form-check">
                                        <input class="form-check-input" type="radio" name="is_work_outside"
                                            id="work_outside_yes" value="1">
                                        <label class="form-check-label" for="work_outside_yes">
                                            Yes
                                        </label>
                                    </div>
                                    <div class="form-check">
                                        <input class="form-check-input" type="radio" name="is_work_outside"
                                            id="work_outside_no" value="0" checked>
                                        <label class="form-check-label" for="work_outside_no">
                                            No
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <!-- date_attendance -->
                            <div class="mb-3">
                                <label for="date_attendance" class="form-label label-custom">Date</label>
                                <div class="date_attendance">
                                    <span id="date_attendance">Loading...</span>
                                </div>
                            </div>

                            <!-- time_in -->
                            <div class="mb-3">
                                <label for="time_in" class="form-label label-custom">Time In</label>
                                <div class="time_in">
                                    <span id="time_in">Loading...</span>
                                </div>
                            </div>

                            <!-- image -->
                            <div class="mb-3" id="imageUploadSection">
                                <label class="form-label">Photo</label>
                                <div class="image-upload-container">
                                    <label for="imageInput" class="image-upload-label camera-label">
                                        <div class="image-upload-icon">
                                            <i class="fas fa-camera fa-2x text-primary"></i>
                                        </div>
                                        <span id="cameraText">Take Photo</span>
                                    </label>
                                    <input type="file" class="form-control d-none" id="imageInput" name="image"
                                        accept="image/*" capture="user">
                                    <input type="hidden" id="existingImageUrl" name="existingImageUrl"
                                        value="{{ $attendance && $attendance->image ? asset($attendance->image) : '' }}">
                                    <video id="cameraVideo" autoplay playsinline class="w-50 rounded mt-2"
                                        style="max-height: 250px; display: none;"></video>
                                    <canvas id="cameraCanvas" class="d-none"></canvas>
                                    <div id="imagePreview" class="image-preview mt-2" style="display: none;">
                                        <img id="previewImg" src="" alt="Preview" class="img-fluid rounded">
                                    </div>
                                    <button type="button" class="image-clear-btn d-none" id="clearImageBtn"
                                        style="display: none;">
                                        &times;
                                    </button>
                                    <!-- Removed retake button as per user request -->
                                </div>
                            </div>

                            <!-- type_attendance -->
                            <input type="hidden" id="type_attendance" name="type_attendance" value="check_in">
                        </form>
                    </div>
                    <div class="modal-footer modal-footer-custom">
                        <button type="submit" class="btn btn-primary" id="submitCheckInBtn">
                            <span class="material-symbols-outlined">
                                alarm_on
                            </span>
                            Check In
                        </button>
                    </div>

                </div>
            </div>
        </div>
    </div>
    </div>
    <x-slot name="script_slot">
        <script src="{{ asset('asset/js/dashboard.js') }}"></script>
    </x-slot>

</x-office-layout>
