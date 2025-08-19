<x-office-layout>
    <x-slot name="menu_active">
        {{ __('attendance') }}
    </x-slot>
    <x-slot name="head_slot">
        <link href="{{ asset('asset/css/attendance.css') }}" rel="stylesheet">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="" />
    </x-slot>

    <div class="title-content">
        <h2>Attendance</h2>
    </div>

    <!-- Container untuk 2 body-content kiri dan kanan -->
    <div class="attendance-wrapper">
        <!-- Body Content 1 - User Profile Section (Kiri) -->
        <div class="body-content scrollable-container rounded-4 p-4 attendance-left-content">
            <div class="attendance-profile-container">
                <div class="profile-section">
                    <div class="profile-image-container">
                        <img src="{{ $employee && $employee->profile_picture ? asset($employee->profile_picture) : asset('asset/img/default-profile.png') }}"
                            alt="User Profile" class="profile-image">
                    </div>
                    <div class="user-info">
                        <h3 class="user-name">{{ $employee ? $employee->name : 'User Name' }}</h3>
                        <p class="user-email">{{ $employee ? $employee->email_work : 'user@example.com' }}</p>
                        <p class="user-division">
                            @if ($employee && $employee->division)
                                {{ $employee->division->name_division }}
                            @else
                                <span style="color:red;">Division not assigned</span>
                            @endif
                        </p>
                    </div>
                    <div id="clock" class="digital-clock fw-bold fw-700 mt-3"
                        style="color: #303030; font-size: 24px;"></div>
                    <div id="date" class="digital-date mb-3 fw-light text-secondary" style="font-size: 12px;">
                    </div>

                    <div class="attendance-actions-left mt-4 w-100 d-flex justify-content-center">
                        <button class="btn btn-check-in btn-custom-check w-25 m-2 p-2" id="checkInBtn">
                            <span class="material-symbols-outlined" style="display: none;">check</span>
                            Check In
                        </button>
                        <button class="btn btn-check-out btn-custom-check w-25 m-2 p-2" id="checkOutBtn">
                            <span class="material-symbols-outlined" style="display: none;">done_all</span>
                            Check Out
                        </button>
                        <input type="hidden" id="checkInTime" name="checkInTime" value="">
                        <input type="hidden" id="checkOutTime" name="checkOutTime" value="">
                    </div>
                    <div class="attendance-logs">
                        <h6 class="fw-bold">Attendance Logs</h6>

                        <!-- Check In -->
                        <div class="log-row d-flex justify-content-between align-items-center my-2">
                            <p class="mb-0">Check In</p>
                            <div class="d-flex align-items-center">
                                <span id="time_in_display" class="me-2"></span>
                                <button class="btn p-0">
                                    <span class="material-symbols-outlined"
                                        style="font-size:16px; color:#B3B3B3;">chevron_right</span>
                                </button>
                            </div>
                        </div>

                        <!-- Check Out -->
                        <div class="log-row d-flex justify-content-between align-items-center my-2">
                            <p class="mb-0">Check Out</p>
                            <div class="d-flex align-items-center">
                                <span id="time_out_display" class="me-2"></span>
                                <button class="btn p-0">
                                    <span class="material-symbols-outlined"
                                        style="font-size:16px; color:#B3B3B3;">chevron_right</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Body Content 2 - Calendar Section (Kanan) -->
        <div class="body-content scrollable-container rounded-4 p-4 attendance-right-content">
            <div class="attendance-calendar-container">
                <div class="calendar-section">
                    <div class="calendar-container">
                        <div class="calendar-header">
                            <button class="btn btn-sm" id="prevMonth">
                                <i class="fas fa-chevron-left"></i>
                            </button>
                            <h4 id="currentMonthYear">July 2024</h4>
                            <button class="btn btn-sm" id="nextMonth">
                                <i class="fas fa-chevron-right"></i>
                            </button>
                        </div>

                        <div class="calendar-weekdays">
                            <div>Sun</div>
                            <div>Mon</div>
                            <div>Tue</div>
                            <div>Wed</div>
                            <div>Thu</div>
                            <div>Fri</div>
                            <div>Sat</div>
                        </div>

                        <input type="hidden" id="currentDate" name="currentDate" value="">
                        <div class="calendar-days" id="calendarDays">
                            <!-- Calendar days will be generated by JavaScript -->
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal for Check In -->
    <div class="modal fade" id="checkInModal" tabindex="-1" aria-labelledby="checkInModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content rounded-4" id="modalContent">

                <!-- Modal Header -->
                <div class="modal-header modal-header-custom">
                    <h5 class="modal-title modal-title-custom" id="checkInModalLabel">Check In Attendance</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>

                <!-- Modal Body -->
                <div class="modal-body">
                    <form id="checkInForm">
                        <input type="hidden" name="employee_id" id="employee_id"
                            value="{{ $employee ? $employee->id : '' }}">

                        <!-- Work Outside -->
                        <div class="mb-3">
                            <label for="is_work_outside" class="form-label">Work Outside</label>
                            <div class="work-outside-container">
                                <div class="form-check">
                                    <input class="form-check-input" type="radio" name="is_work_outside"
                                        id="work_outside_yes" value="1">
                                    <label class="form-check-label" for="work_outside_yes">Yes</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="radio" name="is_work_outside"
                                        id="work_outside_no" value="0" checked>
                                    <label class="form-check-label" for="work_outside_no">No</label>
                                </div>
                            </div>
                        </div>

                        <!-- Date and Time Container -->
                        <div class="date-time-container">
                            <!-- Date Attendance -->
                            <div class="mb-3">
                                <label for="date_attendance" class="form-label label-custom"
                                    style="margin-bottom: 0">Date</label>
                                <div class="date-time-display" id="date_attendance">
                                    Loading...
                                </div>
                            </div>

                            <!-- Time In -->
                            <div class="mb-3">
                                <label for="time_in" class="form-label label-custom" style="margin-bottom: 0">Time
                                    In</label>
                                <div class="date-time-display" id="time_in">
                                    Loading...
                                </div>
                            </div>
                        </div>

                        <!-- Image Upload Section -->
                        <div class="mb-3" id="imageUploadSection">
                            <label class="form-label">Photo</label>
                            <div class="image-upload-container">
                                <!-- Label untuk trigger kamera -->
                                <label for="imageInput" class="image-upload-label camera-label">
                                    <div class="image-upload-icon">
                                        <i class="fas fa-camera fa-2x text-primary"></i>
                                    </div>
                                    <span id="cameraText">Take Photo</span>
                                </label>

                                <!-- Input file untuk mobile -->
                                <input type="file" class="form-control d-none" id="imageInput" name="image[]"
                                    accept="image/*" capture="environment">

                                <!-- Hidden existing image URLs -->
                                @if ($attendance && $attendance->image)
                                    @foreach ($attendance->image as $image)
                                        <input type="hidden" name="existingImageUrls[]" value="{{ asset($image) }}">
                                    @endforeach
                                @endif

                                <!-- Image preview -->
                                <div id="imagePreview" class="image-preview mt-2" style="display:none;">
                                    <img id="previewImg" src="" alt="Preview" class="img-fluid rounded">
                                </div>

                                <!-- Clear button -->
                                <button type="button" class="image-clear-btn d-none btn btn-danger mt-2"
                                    id="clearImageBtn">&times;</button>
                            </div>
                        </div>

                        <!-- Map Location Section for Check In -->
                        <div class="mb-3">
                            <label class="form-label">Location</label>
                            <div id="mapCheckIn" style="height: 300px;" class="rounded border"></div>
                            <input type="hidden" id="latitudeCheckIn" name="latitudeCheckIn">
                            <input type="hidden" id="longitudeCheckIn" name="longitudeCheckIn">
                        </div>
                    </form>
                </div>

                <!-- Modal Footer -->
                <div class="modal-footer modal-footer-custom">
                    <button type="submit" class="btn btn-primary" id="submitCheckInBtn">
                        <span class="material-symbols-outlined">alarm_on</span> Check In
                    </button>
                </div>

                <div id="cameraWrapper" class="d-none position-relative text-center">
                    <!-- Video Stream -->
                    <video id="cameraVideo" autoplay playsinline class="w-100 rounded"
                        style="height: 100vh; object-fit: cover;"></video>

                    <!-- Capture Button Overlay -->
                    <button type="button"
                        class="btn btn-primary position-absolute bottom-0 start-50 translate-middle-x mb-4 px-4 py-2"
                        id="captureBtn">
                        <i class="fas fa-camera"></i> Capture Photo
                    </button>

                    <!-- Hidden Canvas for Capturing -->
                    <canvas id="cameraCanvas" class="d-none"></canvas>
                </div>

            </div>
        </div>
    </div>


    <!-- Modal for Check Out -->
    <div class="modal fade" id="checkOutModal" tabindex="-1" aria-labelledby="checkOutModalLabel"
        aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content rounded-4" id="checkOutModalContent">
                <div class="modal-header modal-header-custom">
                    <h5 class="modal-title modal-title-custom" id="checkOutModalLabel">Check Out Attendance</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="checkOutForm">
                        <!-- Hidden fields -->
                        <input type="hidden" name="employee_id" id="employee_id"
                            value="{{ $employee ? $employee->id : '' }}">
                        <input type="hidden" name="date_attendance" id="date_attendance">
                        <input type="hidden" name="time_out" id="time_out">
                        <input type="hidden" name="type_attendance" value="check_out">
                        <input type="hidden" name="is_work_outside_checkout" id="is_work_outside_checkout"
                            value="0">

                        <!-- Work Outside Display -->
                        <div class="mb-3">
                            <label class="form-label label-custom">Work Outside Status</label>
                            <div class="work-outside-display">
                                <span id="workOutsideStatusText">Loading...</span>
                            </div>
                        </div>

                        <!-- Time Display Container -->
                        <div class="date-time-container">
                            <!-- Time In Display -->
                            <div class="mb-3">
                                <label class="form-label label-custom">Time In</label>
                                <div class="date-time-display" id="time_in_display">
                                    Loading...
                                </div>
                            </div>

                            <!-- Time Out Display -->
                            <div class="mb-3">
                                <label class="form-label label-custom">Time Out</label>
                                <div class="date-time-display" id="time_out_display">
                                    Loading...
                                </div>
                            </div>

                            <!-- Total Work Duration -->
                            <div class="mb-3">
                                <label class="form-label label-custom">Total Work Duration</label>
                                <div class="date-time-display" id="total_work_duration">
                                    Loading...
                                </div>
                            </div>
                        </div>

                        <!-- Image Upload Section for Checkout -->
                        <div class="mb-3" id="imageUploadSectionCheckout" style="display: none;">
                            <label class="form-label">Photo</label>
                            <div class="image-upload-container">
                                <label for="imageInputCheckout" class="image-upload-label camera-label">
                                    <div class="image-upload-icon">
                                        <i class="fas fa-camera fa-2x text-primary"></i>
                                    </div>
                                    <span id="cameraTextCheckout">Take Photo</span>
                                </label>
                                <input type="file" class="form-control d-none" id="imageInputCheckout"
                                    name="image[]" accept="image/*" capture="environment">
                                <div id="imagePreviewCheckout" class="image-preview mt-2" style="display: none;">
                                    <img id="previewImgCheckout" src="" alt="Preview"
                                        class="img-fluid rounded">
                                </div>
                                <button type="button" class="image-clear-btn d-none btn btn-danger mt-2"
                                    id="clearImageBtnCheckout">&times;</button>
                            </div>
                        </div>

                        <!-- Map Location Section for Check Out -->
                        <div class="mb-3">
                            <label class="form-label">Location</label>
                            <div id="mapCheckOut" style="height: 300px;" class="rounded border"></div>
                            <input type="hidden" id="latitudeCheckOut" name="latitudeCheckOut">
                            <input type="hidden" id="longitudeCheckOut" name="longitudeCheckOut">
                        </div>

                    </form>
                </div>
                <div class="modal-footer modal-footer-custom">
                    <button type="button" class="btn btn-secondary" id="submitCheckOutBtn">
                        <span class="material-symbols-outlined">alarm_off</span>
                        Check Out
                    </button>
                </div>

                <div id="cameraWrapperCheckout" class="d-none position-relative text-center">
                    <!-- Video Stream -->
                    <video id="cameraVideoCheckout" autoplay playsinline class="w-100 rounded"
                        style="height: 100vh; object-fit: cover;"></video>

                    <!-- Capture Button Overlay -->
                    <button type="button"
                        class="btn btn-primary position-absolute bottom-0 start-50 translate-middle-x mb-4 px-4 py-2"
                        id="captureBtnCheckout">
                        <i class="fas fa-camera"></i> Capture Photo
                    </button>

                    <!-- Hidden Canvas for Capturing -->
                    <canvas id="cameraCanvasCheckout" class="d-none"></canvas>
                </div>
            </div>
        </div>
    </div>
    <x-slot name="script_slot">
        <script src="{{ asset('asset/js/attendance.js') }}"></script>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
    </x-slot>
</x-office-layout>
