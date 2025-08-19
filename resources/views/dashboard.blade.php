<x-office-layout>
    <x-slot name="menu_active">
        {{ __('dashboard') }}
    </x-slot>
    <x-slot name="head_slot">
        <link href="{{ asset('asset/css/dashboard.css') }}" rel="stylesheet">
        <link href="{{ asset('asset/css/calendar-dashboard.css') }}" rel="stylesheet">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css" />
    </x-slot>

    <div class="title-content">
        <h2>Dashboard</h2>
    </div>

    <div class="dashboard-container justify-content-center align-items-center">
        <div class="row">
            {{-- KIRI --}}
            <div class="col-md-8 above-content d-flex flex-column">
                <div class="row flex-grow-1" style="flex: 1;">
                    {{-- Profile --}}
                    <div class="col-md-6 my-3 profile-calendar-card">
                        <div class="rounded-4 p-4 body-card h-100">
                            <div class="d-flex justify-content-end align-items-center">
                                <button class="btn btn-sm toggle-calendar calendar-toggle-btn">
                                    <span class="material-symbols-outlined"
                                        style="font-size: 18px;">calendar_month</span>
                                </button>
                            </div>

                            <div class="profile-image-container">
                                <img class="profile-image" src="{{ $photo }}" alt="User Profile">
                            </div>
                            <div class="profile-text mt-2">
                                <p class="user-name fw-light text-secondary">
                                    {{ $employee ? $employee->name : 'User Name :' }}</p>
                                <div id="clock" class="digital-clock fw-bold fw-700 my-3"></div>
                                <div id="date" class="digital-date mb-3 fw-light text-secondary"></div>
                            </div>
                            <div class="attendance-actions w-100 d-flex justify-content-evenly">
                                <button class="btn btn-custom-check w-25 m-2 p-2 fw-normal" data-check-active="checkIn"
                                    id="checkInBtn"><span class="material-symbols-outlined check-icon"
                                        style="display: none;">check</span>Check
                                    In</button>
                                <button class="btn btn-custom-check w-25 m-2 p-2 fw-normal" data-check-active="checkOut"
                                    id="checkOutBtn"><span class="material-symbols-outlined done-all-icon"
                                        style="display: none;">done_all</span>Check
                                    Out</button>
                            </div>
                            <div class="m-3">
                                <div class="justify-content-start mt-3">
                                    <h6 class="fw-bold" style="font-size: 16px;">Attendance Logs</h6>
                                </div>
                                <div class="d-flex justify-content-between align-items-center my-2"
                                    style="font-size: 12px;">
                                    <p class="mb-0 flex-grow-1" style="color: #757575;">Check In</p>
                                    <div class="d-flex align-items-center">
                                        <div class="time_in">
                                            <span id="time_in_display"></span>
                                        </div>
                                        <button class="btn p-0 ms-1" style="line-height: 1; background-color: #EBECF4;">
                                            <span class="material-symbols-outlined rounded-1"
                                                style="font-size: 16px; color: #B3B3B3;">chevron_right</span>
                                        </button>
                                    </div>
                                </div>

                                <div class="d-flex justify-content-between align-items-center" style="font-size: 12px;">
                                    <p class="mb-0 flex-grow-1" style="color: #757575;">Check Out</p>
                                    <div class="d-flex align-items-center">
                                        <div class="time_out">
                                            <span id="time_out_display"></span>
                                        </div>
                                        <button class="btn p-0 ms-1" style="line-height: 1; background-color: #EBECF4;">
                                            <span class="material-symbols-outlined rounded-1"
                                                style="font-size: 16px; color: #B3B3B3;">chevron_right</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {{-- Calendar --}}
                    <div class="col-md-6 my-3 calendar-card-mobile">
                        <div class="rounded-4 body-card calendar-container h-100">
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
                        <div class="rounded-4 p-4 body-card">

                            <!-- Project Card -->
                            <div class="project-card">

                                <!-- Chart Section -->
                                <div class="chart-section">
                                    <div class="d-flex justify-content-between align-items-center mb-3">
                                        <h5 class="mb-0" style="font-size: 24px">Project</h5>
                                        <button class="btn btn-sm toggle-timeline timeline-toggle-btn">
                                            <span class="material-symbols-outlined"
                                                style="font-size: 18px;">calendar_month</span>
                                        </button>
                                    </div>

                                    <div class="chart-container">
                                        <canvas id="doughnutChart"></canvas>
                                    </div>
                                    <div class="chart-labels d-flex justify-content-between align-items-center mt-3">
                                        <div class="text-center">
                                            <span style="font-weight: bold; color: #222;">10</span><br>
                                            <span style="color: #888;">Total</span>
                                        </div>
                                        <div class="text-center">
                                            <span style="font-weight: bold; color: #4fc97a;">3</span><br>
                                            <span style="color: #888;">Complete</span>
                                        </div>
                                        <div class="text-center">
                                            <span style="font-weight: bold; color: #5a9be6;">5</span><br>
                                            <span style="color: #888;">On Progress</span>
                                        </div>
                                        <div class="text-center">
                                            <span style="font-weight: bold; color: #ff6b6b;">2</span><br>
                                            <span style="color: #888;">Late</span>
                                        </div>
                                    </div>
                                </div>

                                <!-- Timeline Section -->
                                <div class="timeline-card-mobile">
                                    <div class="project-timeline-card h-100">
                                        <div class="d-flex justify-content-between align-items-center mb-3">
                                            <h5 id="timelineTitle" class="fw-semibold" style="font-size: 16px">Aug
                                                week 1</h5>
                                            <div>
                                                <button class="btn btn-sm me-2" id="prevTimeline">
                                                    <span class="material-symbols-outlined">chevron_left</span>
                                                </button>
                                                <button class="btn btn-sm" id="nextTimeline">
                                                    <span class="material-symbols-outlined">chevron_right</span>
                                                </button>
                                            </div>
                                        </div>
                                        <div class="timeline-table justify-content-center align-items-center">
                                            <div class="timeline-header d-flex">
                                                <div class="timeline-cell fw-bold">Mo</div>
                                                <div class="timeline-cell fw-bold">Tu</div>
                                                <div class="timeline-cell fw-bold">We</div>
                                                <div class="timeline-cell fw-bold">Th</div>
                                                <div class="timeline-cell fw-bold">Fr</div>
                                                <div class="timeline-cell fw-bold">Sa</div>
                                                <div class="timeline-cell fw-bold">Su</div>
                                            </div>
                                            <div id="timelineRows"></div>
                                        </div>
                                    </div>
                                </div>

                            </div>
                            <!-- /project-card -->

                        </div>
                    </div>
                </div>

                <div class="timeline-overlay"></div>
            </div>

            {{-- Task Group --}}
            <div class="col-md-4 my-3">
                <div class="rounded-4 p-4 body-card d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h5 class="fw-normal" style="color: #454545">My Task</h5>
                        <button class="btn btn-link p-0">
                            <span class="material-symbols-outlined text-secondary">chevron_right</span>
                        </button>
                    </div>

                    <!-- Tabs -->
                    <div class="d-flex justify-between align-items-center w-100 mb-3">
                        <button class="btn-tab-task btn btn-tab-custom flex-fill mx-2 rounded-md-4"
                            data-tab-active="today">Today</button>
                        <button class="btn-tab-task btn btn-tab-custom flex-fill rounded-md-4"
                            data-tab-active="tomorrow">Tomorrow</button>
                    </div>

                    <!-- Task List - Desktop View -->
                    <div class="task-list-desktop flex-grow-1 overflow-auto">
                        {{-- Task Content --}}
                        <div class="task-card p-3 mb-3" style="background: #FFFAE6;">
                            <div class="d-flex align-items-center mb-2">
                                <img src="https://picsum.photos/200" class="rounded-circle me-4">
                                <h6 class="mb-0" style="font-size: 14px">Lorem Ipsum is simply dummy</h6>
                            </div>
                            <p class="mb-2 small" style="font-size: 10px;">
                                Description It is a long established fact that a reader will be distracted by the
                                readable
                                content...
                            </p>
                            <div class="d-flex justify-content-between align-items-center small mt-3"
                                style="font-size: 10px;">
                                <div>
                                    <span style="color: #828282;">Priority:</span><span class="mx-2"
                                        style="color: #E14F4F">High</span>
                                    <span style="color: #828282">Deadline:</span><span class="mx-2"
                                        style="color: #454545">17 Aug
                                        2025</span>
                                </div>
                                <div class="d-flex">
                                    <button class="btn btn-sm p-0 border-0 bg-transparent" title="Attach File">
                                        <span class="material-symbols-outlined"
                                            style="font-size: 14px; color: #828282;">attach_file</span>
                                    </button>
                                    <button class="btn btn-sm p-0 border-0 bg-transparent ms-2" title="Comment">
                                        <span class="material-symbols-outlined"
                                            style="font-size: 14px; color: #828282;">mode_comment</span>
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

        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js"></script>

        <script src="{{ asset('asset/js/dashboard.js') }}"></script>
        <script src="{{ asset('asset/js/attendance_dashboard.js') }}"></script>
        <script src="{{ asset('asset/js/callendar_dashboard.js') }}"></script>
        <script src="{{ asset('asset/js/tasks_dashboard.js') }}"></script>
        <script src="{{ asset('asset/js/project_dashboard.js') }}"></script>

    </x-slot>
</x-office-layout>
