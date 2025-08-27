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
                    <div class="user-info mt-2">
                        <h3 class="user-name">{{ $employee ? $employee->name : 'User Name' }}</h3>
                        <div id="clock" class="digital-clock fw-bold fw-700 mt-3 mb-3"
                            style="color: #303030; font-size: 24px;"></div>
                        <div id="date" class="digital-date fw-light text-secondary" style="font-size: 12px;">
                        </div>
                    </div>

                    <div class="attendance-actions mt-4 w-100 d-flex justify-content-between">
                        <button class="btn btn-check-in btn-custom-check w-25 m-2 p-2 fw-normal" data-check-active="checkIn"
                            id="checkInBtn" data-status="{{ $attendanceStatus['check_in'] ?? 'pending' }}">
                            <span class="material-symbols-outlined check-icon"
                                style="display: {{ $attendanceStatus['check_in'] === 'completed' ? 'inline' : 'none' }};">check</span>
                            Check In
                        </button>
                        <button class="btn btn-check-out btn-custom-check w-25 m-2 p-2 fw-normal" data-check-active="checkOut"
                            id="checkOutBtn" data-status="{{ $attendanceStatus['check_out'] ?? 'pending' }}">
                            <span class="material-symbols-outlined done-all-icon"
                                style="display: {{ $attendanceStatus['check_out'] === 'completed' ? 'inline' : 'none' }};">done_all</span>
                            Check Out
                        </button>
                    </div>
                     <div class="attendance-logs">
                                <div class="justify-content-start mt-3">
                                    <h6 class="fw-bold" style="font-size: 16px;">Attendance Logs</h6>
                                </div>
                                <div class="chevron-icon-attendance d-flex justify-content-between align-items-center my-2"
                                    style="font-size: 12px;">
                                    <p class="mb-0 flex-grow-1" style="color: #757575;">Check In</p>
                                    <div class="d-flex align-items-center justify-content-center">
                                        <div class="time_in time-detail-btn" data-type="in" style="color: {{ $isLate ? 'red' : 'inherit' }}; cursor: pointer;">
                                            <span id="time_in_display">{{ $timeIn }}</span>
                                        </div>
                                        <button class="btn p-0 ms-1 chevron-detail-btn" data-type="in" style="line-height: 1;">
                                            <span class="material-symbols-outlined rounded-1"
                                                style="font-size: 16px; color: #B3B3B3;">chevron_right</span>
                                        </button>
                                    </div>
                                </div>

                                <div class="chevron-icon-attendance d-flex justify-content-between align-items-center" style="font-size: 12px;">
                                    <p class="mb-0 flex-grow-1" style="color: #757575;">Check Out</p>
                                    <div class="d-flex align-items-center justify-content-center">
                                        <div class="time_out time-detail-btn" data-type="out" style="cursor: pointer;">
                                            <span id="time_out_display"></span>
                                        </div>
                                        <button class="btn p-0 ms-1 chevron-detail-btn" data-type="out" style="line-height: 1;">
                                            <span class="material-symbols-outlined rounded-1"
                                                style="font-size: 16px; color: #B3B3B3;">chevron_right</span>
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
                <div class="modal-header modal-header-custom d-flex justify-content-center">
                    <h5 class="modal-title modal-title-custom text-center w-100" id="checkInModalLabel">Check In
                    </h5>
                    <button type="button" class="btn-close position-absolute" style="right: 1rem;"
                        data-bs-dismiss="modal" aria-label="Close"></button>
                </div>

                <!-- Modal Body -->
                <div class="modal-body">
                    <form id="checkInForm">
                        <input type="hidden" name="employee_id" id="employee_id"
                            value="{{ $employee ? $employee->id : '' }}">

                        <!-- Time Display Container -->
                        <div class="text-center mb-4">
                            <div class="mb-0">
                                <div class="date-time-display" id="time_in">
                                    Loading...
                                </div>
                            </div>
                            <div class="mb-0">
                                <div class="date-time-display" id="date_attendance">
                                    Loading...
                                </div>
                            </div>
                            <div>
                                <div class="shift-time-display" id="shift_time_checkin">
                                    Loading...
                                </div>
                            </div>
                        </div>

                        <!-- Work Outside -->
                        <div class="mb-3">
                            <label for="is_work_outside" class="form-label">Work Outside</label>
                            <div class="work-outside-container d-flex justify-content-center gap-3">
                                <div class="form-check" style="width: 45%;">
                                    <input class="form-check-input" type="radio" name="is_work_outside"
                                        id="work_outside_yes" value="1">
                                    <label class="form-check-label w-100 text-center"
                                        for="work_outside_yes">Yes</label>
                                </div>
                                <div class="form-check" style="width: 45%;">
                                    <input class="form-check-input" type="radio" name="is_work_outside"
                                        id="work_outside_no" value="0" checked>
                                    <label class="form-check-label w-100 text-center" for="work_outside_no">No</label>
                                </div>
                            </div>
                        </div>

                        <!-- Map Location Section for Check In -->
                        <div class="mb-3">
                            <div id="mapCheckIn" style="height: 200px; width: 90%; display: block; margin: 0 auto;"
                                class="rounded border"></div>
                            <input type="hidden" id="latitudeCheckIn" name="latitudeCheckIn">
                            <input type="hidden" id="longitudeCheckIn" name="longitudeCheckIn">
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
                    </form>
                </div>

                <!-- Modal Footer -->
                <div class="modal-footer modal-footer-custom">
                    <button type="submit" class="btn btn-submit-black" id="submitCheckInBtn">
                        Check In
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
                <div class="modal-header modal-header-custom d-flex justify-content-center">
                    <h5 class="modal-title modal-title-custom text-center w-100" id="checkOutModalLabel">Check Out
                    </h5>
                    <button type="button" class="btn-close position-absolute" style="right: 1rem;"
                        data-bs-dismiss="modal" aria-label="Close"></button>
                </div>

                <!-- Time Display Container -->
                <div class="text-center mb-4">
                    <div class="mb-0">
                        <div class="date-time-display" id="time_out">
                            Loading...
                        </div>
                    </div>
                    <div class="mb-0">
                        <div class="date-time-display" id="date_attendance_checkout">
                            Loading...
                        </div>
                    </div>
                    <div>
                        <div class="shift-time-display" id="shift_time_checkout">
                            Loading...
                        </div>
                    </div>
                </div>

                <div class="modal-body">
                    <form id="checkOutForm">
                        <!-- Hidden fields -->
                        <input type="hidden" name="employee_id" id="employee_id"
                            value="{{ $employee ? $employee->id : '' }}">
                        <input type="hidden" name="date_attendance" id="date_attendance_hidden">
                        <input type="hidden" name="time_out" id="time_out_hidden">
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

                        <!-- Hidden Time Display Container - Removed as it's now above -->
                        <div class="date-time-container d-flex justify-content-between mb-3"
                            style="display: none !important;">
                            <!-- Time In Display -->
                            <div class="mb-3" hidden>
                                <label class="form-label label-custom">Time In</label>
                                <div class="date-time-display-checkout" id="">
                                    Loading...
                                </div>
                            </div>

                            <!-- Time Out Display -->
                            <div class="mb-3">
                                <label class="form-label label-custom">Time Out</label>
                                <div class="date-time-display-checkout" id="">
                                    Loading...
                                </div>
                            </div>

                            <!-- Total Work Duration -->
                            <div class="mb-3" hidden>
                                <label class="form-label label-custom">Total Work Duration</label>
                                <div class="date-time-display" id="total_work_duration">
                                    Loading...
                                </div>
                            </div>
                        </div>


                        <!-- Map Location Section for Check Out -->
                        <div class="mb-3">
                            <div id="mapCheckOut" style="height: 200px; width: 90%; margin: 0 auto;"
                                class="rounded border"></div>
                            <input type="hidden" id="latitudeCheckOut" name="latitudeCheckOut">
                            <input type="hidden" id="longitudeCheckOut" name="longitudeCheckOut">
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

                    </form>
                </div>
                <div class="modal-footer modal-footer-custom">
                    <button type="button" class="btn btn-secondary" id="submitCheckOutBtn">
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
        <script src="{{ asset('asset/js/attendance.js?v=' . time()) }}"></script>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
    </x-slot>
</x-office-layout>
