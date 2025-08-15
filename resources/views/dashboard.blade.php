<x-office-layout>
    <x-slot name="menu_active">
        {{ __('dashboard') }}
    </x-slot>
    <x-slot name="head_slot">
        <link href="{{ asset('asset/css/dashboard.css') }}" rel="stylesheet">
        <link href="{{ asset('asset/css/calendar-dashboard.css') }}" rel="stylesheet">
        <link href="{{ asset('asset/css/mobile-dashboard.css') }}" rel="stylesheet">
    </x-slot>

    <div class="title-content">
        <h2>Dashboard</h2>
    </div>

    <div class="dashboard-container">
        <div class="row">
            {{-- KIRI --}}
            <div class="col-md-8 d-flex flex-column">
                <div class="row flex-grow-1" style="flex: 1;">
                    {{-- Profile --}}
                    <div class="col-md-6 my-3">
                        <div class="rounded-4 p-4 px-5 body-content h-100">
                            <div class="profile-image-container">
                                <img class="profile-image" src="{{ $photo }}" alt="User Profile">
                            </div>
                            <div class="profile-text mt-2">
                                <p class="user-name fw-light text-secondary">
                                    {{ $employee ? $employee->name : 'User Name :' }}</p>
                                <div id="clock" class="digital-clock fw-bold fw-700"></div>
                                <div id="date" class="digital-date mb-4 fw-light text-secondary"></div>
                            </div>
                            <div class="attendance-actions mt-2 w-100 d-flex justify-content-evenly">
                                <button class="btn btn-custom-check-in w-25 m-2 p-2 fw-normal">Check In</button>
                                <button class="btn btn-custom-check-out w-25 m-2 p-2 fw-normal">Check Out</button>
                            </div>
                            <div class="justify-content-start mt-4">
                                <h6 class="fw-bold" style="font-size: 16px;">Attendance Logs</h6>
                            </div>
                            <div class="d-flex justify-content-between align-items-center" style="font-size: 12px;">
                                <p class="mb-0 flex-grow-1">Check In</p>
                                <div class="d-flex align-items-center">
                                    <div class="time_out">
                                        <span id="time_in_display"></span>
                                    </div>
                                    <button class="btn p-0 ms-1"
                                        style="line-height: 1; background: none; border: none;">
                                        <span class="material-symbols-outlined text-secondary"
                                            style="font-size: 16px;">chevron_right</span>
                                    </button>
                                </div>
                            </div>

                            <div class="d-flex justify-content-between align-items-center" style="font-size: 12px;">
                                <p class="mb-0 flex-grow-1">Check Out</p>
                                <div class="d-flex align-items-center">
                                    <div class="time_in">
                                        <span id="time_in_display"></span>
                                    </div>
                                    <button class="btn p-0 ms-1"
                                        style="line-height: 1; background: none; border: none;">
                                        <span class="material-symbols-outlined text-secondary"
                                            style="font-size: 16px;">chevron_right</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {{-- Calendar --}}
                    <div class="col-md-6 my-3">
                        <div class="rounded-4 body-content calendar-container h-100">
                            <div class="calendar-header">
                                <button class="btn btn-sm" id="prevMonth"><i class="fas fa-chevron-left"></i></button>
                                <h4 id="currentMonthYear">July 2024</h4>
                                <button class="btn btn-sm" id="nextMonth"><i class="fas fa-chevron-right"></i></button>
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
                            <div class="calendar-days" id="calendarDays"></div>
                        </div>
                    </div>
                </div>

                {{-- Project Card --}}
                <div class="row" style="flex: 1;">
                    <div class="col-12 card-fill">
                        <div class="rounded-4 p-4 body-content">
                            <div class="row g-3 row-cols-1 row-cols-md-3">
                                <div class="col">
                                    <div class="p-4 text-center rounded-3" style="background-color: #FFFAE6;">
                                        <p class="fw-semibold" style="font-size: 36px;">7</p>
                                        <p class="text-secondary fw-normal">In Progress</p>
                                    </div>
                                </div>
                                <div class="col">
                                    <div class="p-4 text-center rounded-3" style="background-color: #DBF8E2;">
                                        <p class="fw-semibold" style="font-size: 36px;">3</p>
                                        <p class="text-secondary fw-normal">Complete</p>
                                    </div>
                                </div>
                                <div class="col">
                                    <div class="p-4 text-center rounded-3" style="background-color: #EAECF5;">
                                        <p class="fw-semibold" style="font-size: 36px;">10</p>
                                        <p class="text-secondary fw-normal">Total Project</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {{-- Task Group --}}
            <div class="col-md-4 my-3">
                <div class="rounded-4 p-4 body-content d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h5 class="fw-semibold">My Task</h5>
                        <button class="btn btn-link p-0">
                            <span class="material-symbols-outlined text-secondary">chevron_right</span>
                        </button>
                    </div>

                    <!-- Tabs -->
                    <div class="d-flex justify-between align-items-center w-100 mb-3">
                        <button class="btn btn-light flex-fill mx-2 rounded-md-4 active">Today</button>
                        <button class="btn btn-outline-secondary flex-fill rounded-md-4">Tomorrow</button>
                    </div>

                    <!-- Task List -->
                    <div class="task-list flex-grow-1 overflow-auto">
                        {{-- Task Content --}}
                        <div class="task-card p-3 mb-3 rounded" style="background-color: #FFFAE6;">
                            <div class="d-flex align-items-center mb-2">
                                <img src="https://picsum.photos/200" class="rounded-circle me-2">
                                <h6 class="mb-0" style="font-size: 14px">Lorem Ipsum is simply dummy</h6>
                            </div>
                            <p class="mb-2 small text-secondary">
                                Description It is a long established fact that a reader will be distracted by the
                                readable
                                content...
                            </p>
                            <div class="d-flex justify-content-between align-items-center small mt-3"
                                style="font-size: 10px;">
                                <div>
                                    <span class="text-danger">Priority:</span><span class="mx-2">High</span>
                                    <span class="text-secondary">Deadline:</span><span class="mx-2">17 Aug
                                        2025</span>
                                </div>
                                <div class="d-flex">
                                    <button class="btn btn-sm p-0 border-0 bg-transparent" title="Attach File">
                                        <span class="material-symbols-outlined"
                                            style="font-size: 14px;">attach_file</span>
                                    </button>
                                    <button class="btn btn-sm p-0 border-0 bg-transparent ms-2" title="Comment">
                                        <span class="material-symbols-outlined"
                                            style="font-size: 14px;">mode_comment</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div class="task-card p-3 mb-3 rounded" style="background-color: #F1F7FF;">
                            <div class="d-flex align-items-center mb-2">
                                <img src="https://picsum.photos/200" class="rounded-circle me-2">
                                <h6 class="mb-0">Lorem Ipsum is simply dummy</h6>
                            </div>
                            <p class="mb-2 small text-secondary">
                                Description It is a long established fact that a reader will be distracted by the
                                readable
                                content...
                            </p>
                            <div class="d-flex justify-content-between align-items-center small mt-3"
                                style="font-size: 10px;">
                                <div>
                                    <span class="text-danger">Priority:</span><span class="mx-2">High</span>
                                    <span class="text-secondary">Deadline:</span><span class="mx-2">17 Aug
                                        2025</span>
                                </div>
                                <div class="d-flex">
                                    <button class="btn btn-sm p-0 border-0 bg-transparent" title="Attach File">
                                        <span class="material-symbols-outlined"
                                            style="font-size: 14px;">attach_file</span>
                                    </button>
                                    <button class="btn btn-sm p-0 border-0 bg-transparent ms-2" title="Comment">
                                        <span class="material-symbols-outlined"
                                            style="font-size: 14px;">mode_comment</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div class="task-card p-3 mb-3 rounded" style="background-color: #EDFFFA;">
                            <div class="d-flex align-items-center mb-2">
                                <img src="https://picsum.photos/200" class="rounded-circle me-2">
                                <h6 class="mb-0">Lorem Ipsum is simply dummy</h6>
                            </div>
                            <p class="mb-2 small text-secondary">
                                Description It is a long established fact that a reader will be distracted by the
                                readable
                                content...
                            </p>
                            <div class="d-flex justify-content-between align-items-center small mt-3"
                                style="font-size: 10px;">
                                <div>
                                    <span class="text-danger">Priority:</span><span class="mx-2">High</span>
                                    <span class="text-secondary">Deadline:</span><span class="mx-2">17 Aug
                                        2025</span>
                                </div>
                                <div class="d-flex">
                                    <button class="btn btn-sm p-0 border-0 bg-transparent" title="Attach File">
                                        <span class="material-symbols-outlined"
                                            style="font-size: 14px;">attach_file</span>
                                    </button>
                                    <button class="btn btn-sm p-0 border-0 bg-transparent ms-2" title="Comment">
                                        <span class="material-symbols-outlined"
                                            style="font-size: 14px;">mode_comment</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            {{-- Modal for checkin --}}
            <div class="modal fade" id="checkInModal" tabindex="-1" aria-labelledby="checkInModalLabel"
                aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content rounded-4">
                        <div class="modal-header modal-header-custom">
                            <h5 class="modal-title modal-title-custom" id="checkInModalLabel">Check In Attendance</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"
                                aria-label="Close"></button>
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
                                        <input type="file" class="form-control d-none" id="imageInput"
                                            name="image" accept="image/*" capture="user">
                                        <input type="hidden" id="existingImageUrl" name="existingImageUrl"
                                            value="{{ $attendance && $attendance->image ? asset($attendance->image) : '' }}">
                                        <video id="cameraVideo" autoplay playsinline class="w-50 rounded mt-2"
                                            style="max-height: 250px; display: none;"></video>
                                        <canvas id="cameraCanvas" class="d-none"></canvas>
                                        <div id="imagePreview" class="image-preview mt-2" style="display: none;">
                                            <img id="previewImg" src="" alt="Preview"
                                                class="img-fluid rounded">
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

            <!-- Modal for Checkout -->
            <div class="modal fade" id="checkOutModal" tabindex="-1" aria-labelledby="checkOutModalLabel"
                aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content rounded-4">
                        <div class="modal-header modal-header-custom">
                            <h5 class="modal-title modal-title-custom" id="checkOutModalLabel">Check Out Attendance
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"
                                aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <form id="checkOutForm">
                                <!-- Hidden fields -->
                                <input type="hidden" name="employee_id" id="employee_id"
                                    value="{{ $employee ? $employee->id : '' }}">
                                <input type="hidden" name="date_attendance" id="date_attendance">
                                <input type="hidden" name="time_out" id="time_out">
                                <input type="hidden" name="type_attendance" value="check_out">

                                <!-- Work Outside Display -->
                                <div class="mb-3">
                                    <label class="form-label label-custom">Work Outside Status</label>
                                    <div class="work-outside-display">
                                        <span id="workOutsideStatusText">Loading...</span>
                                    </div>
                                </div>

                                <!-- Time In Display -->
                                <div class="mb-3">
                                    <label class="form-label label-custom">Time In</label>
                                    <div class="time_in">
                                        <span id="time_in_display">Loading...</span>
                                    </div>
                                </div>

                                <!-- Time Out Display -->
                                <div class="mb-3">
                                    <label class="form-label label-custom">Time Out</label>
                                    <div class="time_out">
                                        <span id="time_out_display">Loading...</span>
                                    </div>
                                </div>

                                <!-- Total Work Duration -->
                                <div class="mb-3">
                                    <label class="form-label label-custom">Total Work Duration</label>
                                    <div class="total_work_duration">
                                        <span id="total_work_duration">Loading...</span>
                                    </div>
                                </div>

                                <!-- Image Upload Section -->
                                <div class="mb-3" id="imageUploadSection" style="display: none;">
                                    <label class="form-label">Photo (Optional)</label>
                                    <div class="image-upload-container">
                                        <label for="imageInput" class="image-upload-label camera-label">
                                            <div class="image-upload-icon">
                                                <i class="fas fa-camera fa-2x text-primary"></i>
                                            </div>
                                            <span>Take Photo</span>
                                        </label>
                                        <input type="file" class="form-control d-none" id="imageInput"
                                            name="image" accept="image/*" capture="user">
                                        <div id="imagePreview" class="image-preview mt-2" style="display: none;">
                                            <img id="previewImg" src="" alt="Preview"
                                                class="img-fluid rounded">
                                        </div>
                                    </div>
                                </div>

                            </form>
                        </div>
                        <div class="modal-footer modal-footer-custom">
                            <button type="button" class="btn btn-secondary" id="submitCheckOutBtn">
                                <span class="material-symbols-outlined">alarm_off</span>
                                Check Out
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
