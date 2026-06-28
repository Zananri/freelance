<x-office-layout>
    <x-slot name="menu_active">
        {{ __('dashboard') }}
    </x-slot>
    <x-slot name="head_slot">
        <link href="{{ asset('asset/css/dashboard.css') . '?v=' . time() }}" rel="stylesheet">
        <link href="{{ asset('asset/css/calendar-dashboard.css') }}?v={{ time() }}" rel="stylesheet">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css" />
        <link rel="stylesheet" href=" {{ asset('asset/plugin/leaflet/leaflet.css') }}" />
        <link href="https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.snow.css" rel="stylesheet">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
        {{-- <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/themes/material_blue.css"> --}}
    </x-slot>

    <div class="title-content mx-4">
        <h2>Dashboard</h2>
    </div>

    <div class="dashboard-container justify-content-center align-items-center">
        <div class="row">
            {{-- KIRI --}}
            <div class="col-md-8 above-content d-flex flex-column">
                <div class="row flex-grow-1" style="flex: 1;">
                    {{-- Profile --}}
                    <div class="col-md-6 profile-calendar-card mb-5">
                        <div class="rounded-4 p-4 body-card h-100 position-relative">
                            <div class="position-absolute top-0 end-0 p-3 d-flex align-items-center">
                                <button class="btn btn-sm toggle-calendar calendar-toggle-btn">
                                    <span class="material-symbols-outlined"
                                        style="font-size: 18px; color: #858CA0;">calendar_month</span>
                                </button>
                            </div>

                            <div class="profile-image-container">

                                <input type="hidden" name="employee_id" value="{{ $employee->id }}">
                                <input type="hidden" id="contrib-endpoint"
                                    value="{{ route('employees.contributions', ['id' => $employee->id]) }}">
                                <input type="hidden" name="employee_office" value="{{ $office->location }}">

                                @php
                                    $dashAvatar = $employee->profile_picture ?: $employee->photo ?? null;
                                    if ($dashAvatar) {
                                        if (preg_match('/^(https?:)?\/\//i', $dashAvatar)) {
                                            // absolute URL
                                        } else {
                                            $normalized = ltrim($dashAvatar, '/');
                                            if (!file_exists(public_path($normalized))) {
                                                $dashAvatar = asset('asset/img/avatar.png');
                                            } else {
                                                $dashAvatar = asset($normalized);
                                            }
                                        }
                                    }
                                    if (!$dashAvatar) {
                                        $dashAvatar = asset('asset/img/avatar.png');
                                    }
                                @endphp
                                <img class="profile-image" src="{{ $dashAvatar }}" alt="User Profile"
                                    data-global-avatar="" data-default="{{ asset('asset/img/avatar.png') }}"
                                    onerror="this.onerror=null;this.src='{{ asset('asset/img/avatar.png') }}';">
                            </div>
                            <div class="profile-text mt-2">
                                <p class="user-name fw-light text-secondary">{{ $employee->name }}</p>
                                <div id="clock" class="digital-clock">00 : 00 : 00</div>
                                <div class="text-date-today">
                                    {{ $todayDate }}
                                </div>
                                <div class="text-shift-time">

                                    @php
                                        $shiftTime =
                                            substr($employee->shift->time_start, 0, 5) .
                                            ' - ' .
                                            substr($employee->shift->time_end, 0, 5);
                                        if ($employeeShift) {
                                            $shiftTime =
                                                substr($employeeShift->shift->time_start, 0, 5) .
                                                ' - ' .
                                                substr($employeeShift->shift->time_end, 0, 5);
                                        }
                                    @endphp

                                    {{ $shiftTime }}
                                </div>
                            </div>

                            @php
                                $checkInExist = '';

                                if ($timeIn) {
                                    $checkInExist = 'active';
                                }

                                $checkOUtExist = '';

                                if ($timeOut) {
                                    $checkOUtExist = 'active';
                                }
                            @endphp
                            <div class="attendance-actions">
                                <div class="d-flex w-100 gap-3">
                                    <div class="w-100">
                                        <button class="btn btn-attendance {{ $timeIn != '' ? 'active' : '' }}"
                                            data-check-active="checkIn" id="checkInBtn" data-status="">
                                            <span class="material-symbols-outlined check-icon">check</span>
                                            Check In
                                        </button>
                                    </div>
                                    <div class="w-100">
                                        <button class="btn btn-attendance {{ $timeOut != '' ? 'active' : '' }}"
                                            data-check-active="checkOut" id="checkOutBtn" data-status="">
                                            <span class="material-symbols-outlined check-icon">done_all</span>
                                            Check Out
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div class="attendance-logs">
                                <div class="justify-content-start mt-3">
                                    <h6 class="logs-title">Attendance Logs</h6>
                                </div>

                                <div class="box-time-in">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <div>
                                            <span class="label-check-in-out">Check In</span>
                                        </div>
                                        <div>
                                            <div
                                                class="d-flex align-items-center time-log time-in {{ $isLate }}">
                                                @if ($timeIn)
                                                    <div class="text-time-in">{{ $timeIn }}</div>
                                                    <div class="material-symbols-outlined rounded-1">chevron_right</div>
                                                @endif
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="box-time-out">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <div>
                                            <span class="label-check-in-out">Check Out</span>
                                        </div>
                                        <div>
                                            <div class="d-flex align-items-center time-log time-out">
                                                @if ($timeOut)
                                                    <span class="text-time-out">{{ $timeOut }}</span>
                                                    <span
                                                        class="material-symbols-outlined rounded-1">chevron_right</span>
                                                @endif
                                            </div>

                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>

                    {{-- Calendar --}}

                    <div class="col-md-6 calendar-card-mobile mb-5">
                        <div class="rounded-4 body-card h-100 calendar-attendance position-relative"
                            style="padding-bottom: 0px !important;">
                            <div class="d-flex card-container">
                                <div class="fixed-row">
                                    <div class="header-calendar w-100">
                                        <div class="d-flex align-items-center">
                                            <div class="month-year w-100">

                                                <div class="dropdown dropdown-month">
                                                    <div class="dropdown-toggle btn btn-dropdown-month ps-0"
                                                        type="button" data-bs-toggle="dropdown" aria-expanded="false">

                                                        <div class="d-inline-flex align-items-center">
                                                            <span class="calendar-month">{{ date('F') }}</span>
                                                            <span class="calendar-year">{{ date('Y') }}</span>
                                                        </div>

                                                    </div>

                                                    <ul class="dropdown-menu border-0 shadow-sm bg-default-1 rounded-3">
                                                        @for ($monthNum = 1; $monthNum <= 12; $monthNum++)
                                                            <li data-month="{{ $monthNum }}"
                                                                class="dropdown-item month-item fs-14">
                                                                <div class="dropdown-item fs-14">
                                                                    {{ date('F', mktime(0, 0, 0, $monthNum, 1)) }}
                                                                </div>
                                                            </li>
                                                        @endfor

                                                    </ul>
                                                </div>


                                            </div>
                                            <div class="box-view-control white-space-nowrap">
                                                <span
                                                    class="material-symbols-outlined calendar-prev-month ms-4">chevron_left</span>
                                                <span
                                                    class="material-symbols-outlined calendar-next-month">chevron_right</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="stretch-row">
                                    <div class="box-table-calendar h-100">
                                        <table class="table-calendar h-100">
                                            <thead>
                                                <tr>
                                                    <th>Sun</th>
                                                    <th>Mon</th>
                                                    <th>Tue</th>
                                                    <th>Wed</th>
                                                    <th>Thu</th>
                                                    <th>Fri</th>
                                                    <th>Sat</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                @for ($i = 0; $i < 7; $i++)

                                                    <tr>
                                                        @for ($j = 0; $j < 7; $j++)
                                                            <td class="text-center">
                                                            </td>
                                                        @endfor
                                                    </tr>

                                                @endfor
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {{-- Attendance Summary Card --}}
                <div class="row" style="flex: 1;">
                    <div class="col-12 card-fill">
                        <div class="rounded-4 p-4 body-card">
                            <div class="header-card d-flex justify-content-between mb-3">
                                <h5 class="mb-3 fw-normal" style="color: #454545;">Attendance Summary</h5>
                                <div class="btn dropdown dropdown-toggle-split d-flex align-items-center justify-content-center dropdown-attendance"
                                    data-bs-toggle="dropdown" aria-expanded="false">
                                    June 2026
                                    <span class="material-symbols-outlined mx-2">arrow_drop_down</span>
                                </div>
                                <ul class="dropdown-menu">
                                    <li><a class="dropdown-item" href="#">Action</a></li>
                                    <li><a class="dropdown-item" href="#">Another action</a></li>
                                    <li><a class="dropdown-item" href="#">Something else here</a></li>
                                </ul>
                            </div>

                            <div class="d-flex align-items-center justify-content-between">
                                <div class="legend-container">
                                    <div class="present-container rounded">
                                        <p class="attendance-status">Present</p>
                                        <p class="attendance-status-day">20 Days</p>
                                    </div>
                                    <div class="sick-container rounded">
                                        <p class="attendance-status">Sick</p>
                                        <p class="attendance-status-day">3 Days</p>
                                    </div>
                                    <div class="leave-container rounded">
                                        <p class="attendance-status">Annual Leave</p>
                                        <p class="attendance-status-day">5 Days</p>
                                    </div>
                                    <div class="absent-container rounded">
                                        <p class="attendance-status">Absent</p>
                                        <p class="attendance-status-day">2 Days</p>
                                    </div>
                                </div>
                                <div class="chart-container" style="height: 250px;">
                                    <canvas id="attendanceChart"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="timeline-overlay"></div>
            </div>

            {{-- Document Group --}}
            <div class="col-md-4 mb-3">
                <div class="rounded-4 p-4 body-card d-flex flex-column ">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h5 class="fw-normal" style="color: #454545">My Documents</h5>
                        <a class="btn btn-link p-0" href="{{ route('document') }}">
                            <span class="material-symbols-outlined text-secondary">chevron_right</span>
                        </a>
                    </div>

                    {{-- Filter --}}
                    <div class="d-flex align-items-center gap-2 position-relative mb-3">
                        <div class="search-input-container">
                            <span class="material-symbols-outlined search-icon">search</span>
                            <input class="form-control custom-form-filter" type="text" name="search_filter"
                                id="search_filter">
                        </div>

                        <button class="btn btn-toggle-filter" id="toggleFilterTask">
                            <span class="material-symbols-outlined icon me-2">filter_list</span>
                            <span class="text-icon">Filter</span>
                        </button>

                        <div class="custom-filter-dropdown shadow-sm" id="customFilterDropdown">
                            <div class="p-3">
                                <div class="mb-2 input-custom position-relative">
                                    <label class="form-label label-custom">Date</label>
                                    <input type="text" class="form-control input-text border-0"
                                        id="filterDateRange" placeholder="Select a date range">
                                    <div id="hiddenDateInputs" class="d-none">
                                        <input type="date" id="filterStartDate">
                                        <input type="date" id="filterEndDate">
                                    </div>
                                </div>
                                <div class="mb-2 input-custom">
                                    <label class="form-label label-custom">Division</label>
                                    <select class="form-select input-text border-0">
                                        <option value="">All Divisions</option>
                                    </select>
                                </div>
                                <div class="modal-footer modal-footer-custom">
                                    <button class="btn btn-submit-black" id="btnApplyFilter">Apply</button>
                                    <button class="btn btn-custom-close" id="btnClearFilter">Clear</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Document List -->
                    <div class="grid-wrapper mt-2">

                        <div class="folder-wrapper">
                            <div class="folder-shadow-tab"></div>
                            <div class="folder-shadow"></div>
                            <div class="folder-tab"></div>
                            <div class="folder-body">
                                <p class="folder-name">John Doe</p>
                                <p class="folder-role">Data Analyst</p>
                                <hr class="folder-divider">
                                <div class="folder-footer">
                                    <div class="folder-avatar"></div>
                                    <span class="folder-items">4 Items</span>
                                </div>
                            </div>
                        </div>

                        <div class="folder-wrapper">
                            <div class="folder-shadow-tab"></div>
                            <div class="folder-shadow"></div>
                            <div class="folder-tab"></div>
                            <div class="folder-body">
                                <p class="folder-name">Jane Smith</p>
                                <p class="folder-role">UI Designer</p>
                                <hr class="folder-divider">
                                <div class="folder-footer">
                                    <div class="folder-avatar"></div>
                                    <span class="folder-items">7 Items</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>


    <x-slot name="body_end_slot">

        <!-- Modal for Check In -->
        <div class="modal fade" id="checkInModal" tabindex="-1" aria-labelledby="checkInModalLabel"
            aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content rounded-4" id="modalContent">

                    <!-- Modal Header -->
                    <div class="modal-header border-0 z-1  d-flex justify-content-center">
                        <h5 class="modal-title modal-title-custom border-0 text-center w-100" id="checkInModalLabel">
                            Check
                            In
                        </h5>
                        <button type="button" class="btn-close position-absolute" style="right: 1rem;"
                            data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>

                    <!-- Modal Body -->
                    <div class="modal-body m-0 p-0 z-1 border-0">
                        <div class="box-form">
                            <form id="checkInForm" novalidate enctype="multipart/form-data">
                                @csrf
                                <!-- Time Display Container -->
                                <div class="text-center mb-4">
                                    <div class="mb-0">
                                        <div class="date-time-display">
                                            <span class="text-clock-digital" id="time_in">
                                                00 : 00 : 00
                                            </span>

                                        </div>
                                    </div>
                                    <div class="mb-0">
                                        <div class="date-time-display">

                                            {{ $todayDate }}

                                        </div>
                                    </div>
                                    <div>
                                        <div class="shift-time-display">
                                            {{ $shiftTime }}
                                        </div>
                                    </div>
                                </div>

                                <!-- Map Location Section for Check In -->
                                <div class="mb-3">
                                    <div class="row">

                                        <div class="col-6 col-photo">
                                            <div class="position-realtive">

                                                <div class="d-none">
                                                    <label for="imageInputCheckIn" class="label-photo-checkin">Label
                                                        file</label>
                                                    <input type="file" name="photo_checkin" id="imageInputCheckIn"
                                                        accept="image/*" capture="environment">
                                                </div>

                                                <div class="ratio ratio-1x1">

                                                    <div class="box-photo border rounded-2" id="openCameraCheckIn">
                                                        <div
                                                            class="d-flex w-100 h-100 justify-content-center align-items-center">
                                                            <div class="text-center">
                                                                <span
                                                                    class="material-symbols-outlined fs-4 opacity-50">photo_camera</span>
                                                                <div>
                                                                    <span class="fs-14 text-secondary">Take
                                                                        Photo</span>
                                                                </div>
                                                            </div>
                                                            <img id="photoResult"
                                                                class="object-fit-cover d-none w-100 h-100 position-absolute top-0 start-0 rounded-2"
                                                                src="" alt="">
                                                        </div>

                                                    </div>

                                                </div>

                                            </div>
                                        </div>
                                        <div class="col-6 col-map">
                                            <div class="">
                                                <div class="ratio ratio-1x1">
                                                    <div id="mapCheckIn" class="rounded-2 border"></div>
                                                </div>

                                                <input type="hidden" id="latitudeCheckIn" name="latitudeCheckIn">
                                                <input type="hidden" id="longitudeCheckIn" name="longitudeCheckIn">
                                            </div>
                                        </div>

                                    </div>

                                </div>


                            </form>
                        </div>


                        <div class="mb-4 box-btn-submit pt-4 ">
                            <button type="submit" class="btn btn-submit-black w-100" id="submitCheckInBtn">
                                Check In
                            </button>
                        </div>
                    </div>


                    <div
                        class="box-camera z-3 rounded-4 bg-black bg-opacity-75 position-absolute top-0 start-0 w-100 h-100">
                        <video id="videoElement" muted playsinline
                            class="z-3 w-100 h-100 position-absolute top-0 start-0 rounded-4 object-fit-cover"></video>
                        <canvas id="canvasElement" style="display:none;"></canvas>


                        <div class="z-3 position-absolute bottom-0 start-0 w-100 text-center">
                            <div id="captureButton" class="btn-capture-photo">
                                <span class="material-symbols-outlined">photo_camera</span>
                            </div>
                        </div>

                        <div class="z-3 position-absolute h-auto top-0 end-0 text-end">
                            <div id="closeButton" class="btn-close-capture">
                                <span class="material-symbols-outlined">close</span>
                            </div>
                        </div>

                    </div>

                    <div
                        class="box-loader z-3 rounded-4 bg-body bg-opacity-25 position-absolute top-0 start-0 w-100 h-100">

                        <div class="w-100 h-100 d-flex justify-content-center align-items-center">
                            <div>
                                <div class="spinner-border" style="width: 3rem; height: 3rem;" role="status">
                                    <span class="visually-hidden">Loading...</span>
                                </div>
                                <div class="fs-14">Loading...</div>
                            </div>

                        </div>

                    </div>

                </div>
            </div>
        </div>

        <!-- Modal for Check Out -->
        <div class="modal fade" id="checkOutModal" tabindex="-1" aria-labelledby="checkOutModalLabel"
            aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content border-0 rounded-4" id="modalContent">

                    <!-- Modal Header -->
                    <div class="modal-header border-0 z-1  d-flex justify-content-center">
                        <h5 class="modal-title modal-title-custom text-center w-100" id="checkInModalLabel">Check
                            Out
                        </h5>
                        <button type="button" class="btn-close position-absolute" style="right: 1rem;"
                            data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>

                    <!-- Modal Body -->
                    <div class="modal-body m-0 p-0 z-1">
                        <div class="box-form">
                            <form id="checkOutForm" novalidate enctype="multipart/form-data">
                                @csrf
                                <!-- Time Display Container -->
                                <div class="text-center mb-4">
                                    <div class="mb-0">
                                        <div class="date-time-display">
                                            <span class="text-clock-digital" id="time_out">
                                                00 : 00 : 00
                                            </span>

                                        </div>
                                    </div>
                                    <div class="mb-0">
                                        <div class="date-time-display">

                                            {{ $todayDate }}

                                        </div>
                                    </div>
                                    <div>
                                        <div class="shift-time-display">
                                            {{ $shiftTime }}
                                        </div>
                                    </div>
                                </div>

                                <!-- Work Outside -->
                                <div class="mb-3">

                                    <div class="row">
                                        <div class="col-12">
                                            <div class="fs-14 text-secondary">Work Outside</div>
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="col-6">
                                            <input class="form-check-input" type="radio" name="is_work_outside"
                                                id="work_outside_yes_checkout" value="1">
                                            <label class="form-check-label w-100 text-center"
                                                for="work_outside_yes_checkout">Yes</label>
                                        </div>
                                        <div class="col-6">
                                            <input class="form-check-input" type="radio" name="is_work_outside"
                                                id="work_outside_no_checkout" value="0" checked>
                                            <label class="form-check-label w-100 text-center"
                                                for="work_outside_no_checkout">No</label>
                                        </div>
                                    </div>

                                </div>

                                <div class="mb-3">
                                    <div class="row">

                                        <div class="col-6 col-photo d-none">
                                            <div class="position-realtive">

                                                <div class="d-none">
                                                    <label for="imageInputCheckout" class="label-photo-checkout">Label
                                                        file</label>
                                                    <input type="file" name="photo_checkout"
                                                        id="imageInputCheckout" accept="image/*"
                                                        capture="environment">
                                                </div>

                                                <div class="ratio ratio-1x1">

                                                    <div class="box-photo border rounded-2" id="openCameraCheckout">
                                                        <div
                                                            class="d-flex w-100 h-100 justify-content-center align-items-center">
                                                            <div class="text-center">
                                                                <span
                                                                    class="material-symbols-outlined fs-4 opacity-50">photo_camera</span>
                                                                <div>
                                                                    <span class="fs-14 text-secondary">Take
                                                                        Photo</span>
                                                                </div>
                                                            </div>
                                                            <img id="photoResultCheckout"
                                                                class="object-fit-cover d-none w-100 h-100 position-absolute top-0 start-0 rounded-2"
                                                                src="" alt="">
                                                        </div>

                                                    </div>

                                                </div>

                                            </div>
                                        </div>
                                        <div class="col-12 col-map">
                                            <div class="">
                                                <div class="ratio ratio-21x9">
                                                    <div id="mapCheckOut" class="rounded-2 border"></div>
                                                </div>

                                                <input type="hidden" name="latitudeCheckOut">
                                                <input type="hidden" name="longitudeCheckOut">
                                            </div>
                                        </div>

                                    </div>

                                </div>

                            </form>
                        </div>


                        <div class="mb-4 box-btn-submit pt-4 ">
                            <button type="submit" class="btn btn-submit-black w-100" id="submitCheckOutBtn">
                                Check Out
                            </button>
                        </div>
                    </div>


                    <div
                        class="box-camera z-3 rounded-4 bg-black bg-opacity-75 position-absolute top-0 start-0 w-100 h-100">
                        <video id="videoElementCheckout" muted playsinline
                            class="z-3 w-100 h-100 position-absolute top-0 start-0 rounded-4 object-fit-cover"></video>
                        <canvas id="canvasElementCheckout" style="display:none;"></canvas>


                        <div class="z-3 position-absolute bottom-0 start-0 w-100 text-center">
                            <div id="captureButtonCheckout" class="btn-capture-photo">
                                <span class="material-symbols-outlined">photo_camera</span>
                            </div>
                        </div>

                        <div class="z-3 position-absolute h-auto top-0 end-0 text-end">
                            <div id="closeButtonCheckout" class="btn-close-capture">
                                <span class="material-symbols-outlined">close</span>
                            </div>
                        </div>

                    </div>

                    <div
                        class="box-loader z-3 rounded-4 bg-body bg-opacity-25 position-absolute top-0 start-0 w-100 h-100">

                        <div class="w-100 h-100 d-flex justify-content-center align-items-center">
                            <div>
                                <div class="spinner-border" style="width: 3rem; height: 3rem;" role="status">
                                    <span class="visually-hidden">Loading...</span>
                                </div>
                                <div class="fs-14">Loading...</div>
                            </div>

                        </div>

                    </div>

                </div>
            </div>
        </div>

        <!-- Modal for Check In Detail -->
        <div class="modal fade" id="checkInDetailModal" tabindex="-1" role="dialog"
            aria-labelledby="checkInDetailModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content rounded-4 border-0">
                    <div class="modal-header border-0 py-4">
                        <h5 class="modal-title modal-title-custom text-center w-100" id="checkInDetailModalLabel">
                            Check In</h5>
                        <button type="button" class="btn-close me-2" data-bs-dismiss="modal"
                            aria-label="Close"></button>
                    </div>
                    <div class="modal-body px-5 border-0 ">

                        @if ($atendanceTrackingCheckin)
                            <div class="mb-3">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <div class="fs-14 text-secondary">Date :</div>
                                    <div class="fs-14">
                                        {{ date('l, j F Y', strtotime($atendanceTrackingCheckin->date_time)) }}</div>
                                </div>
                            </div>

                            <div class="mb-3">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <div class="fs-14 text-secondary">Time In :</div>
                                    <div class="fs-14">
                                        {{ date('H:i', strtotime($atendanceTrackingCheckin->date_time)) }}</div>
                                </div>
                            </div>

                            <div class="mb-3">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <div class="fs-14 text-secondary">Work Outside :</div>
                                    <div class="fs-14">
                                        {{ $atendanceTrackingCheckin->is_work_outside ? 'Yes' : 'No' }}</div>
                                </div>
                            </div>

                            <div class="mb-3">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <div class="fs-14 text-secondary">Shift :</div>
                                    <div class="fs-14">{{ $shiftTime }}</div>
                                </div>
                            </div>




                            <div class="mb-5 mt-5">
                                <div class="row">
                                    @php
                                        $checkinImageSrc = '';
                                        $colMap = 'col-12';
                                        if ($atendanceTrackingCheckin->image) {
                                            $checkinImageSrc = asset($atendanceTrackingCheckin->image[0]);
                                            $colMap = 'col-6';
                                        }
                                    @endphp

                                    <div class="col-6 {{ $checkinImageSrc ? ' ' : 'd-none' }}">
                                        <div class="position-relative">
                                            <div class="ratio ratio-1x1">

                                                <div class="rounded-2">

                                                    <div
                                                        class="d-flex w-100 h-100 justify-content-center align-items-center">
                                                        <img src="{{ $checkinImageSrc }}"
                                                            class="object-fit-cover w-100 h-100 position-absolute top-0 start-0 rounded-2"
                                                            alt="">
                                                    </div>

                                                </div>

                                            </div>
                                        </div>
                                    </div>

                                    <div class="{{ $colMap }} ">
                                        <div class="position-relative">
                                            <div class="ratio {{ $checkinImageSrc ? 'ratio-1x1' : 'ratio-16x9' }} ">
                                                <div id="detailMapCheckIn"
                                                    data-location="{{ $atendanceTrackingCheckin->location }}"
                                                    class="rounded-3"></div>
                                            </div>
                                        </div>
                                    </div>

                                </div>

                            </div>
                        @else
                            <div class="p-5 text-center fs-14 text-secondary">
                                No Data Check In
                            </div>
                        @endif

                        <div class="mt-5 mb-3">
                            <button type="button" class="btn btn-close-custom w-100"
                                data-bs-dismiss="modal">Close</button>
                        </div>


                    </div>
                </div>
            </div>
        </div>

        <!-- Modal for Check Out Detail -->
        <div class="modal fade" id="checkOutDetailModal" tabindex="-1" role="dialog"
            aria-labelledby="checkOutDetailModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content rounded-4 border-0">
                    <div class="modal-header border-0 py-4">
                        <h5 class="modal-title modal-title-custom text-center w-100" id="checkOutDetailModalLabel">
                            Check Out</h5>
                        <button type="button" class="btn-close me-2" data-bs-dismiss="modal"
                            aria-label="Close"></button>
                    </div>
                    <div class="modal-body px-5 border-0 ">

                        @if ($atendanceTrackingCheckout)
                            <div class="mb-3">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <div class="fs-14 text-secondary">Date :</div>
                                    <div class="fs-14">
                                        {{ date('l, j F Y', strtotime($atendanceTrackingCheckout->date_time)) }}</div>
                                </div>
                            </div>

                            <div class="mb-3">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <div class="fs-14 text-secondary">Time Out :</div>
                                    <div class="fs-14">
                                        {{ date('H:i', strtotime($atendanceTrackingCheckout->date_time)) }}</div>
                                </div>
                            </div>

                            <div class="mb-3">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <div class="fs-14 text-secondary">Work Outside :</div>
                                    <div class="fs-14">
                                        {{ $atendanceTrackingCheckout->is_work_outside ? 'Yes' : 'No' }}</div>
                                </div>
                            </div>

                            <div class="mb-3">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <div class="fs-14 text-secondary">Shift :</div>
                                    <div class="fs-14">{{ $shiftTime }}</div>
                                </div>
                            </div>




                            <div class="mb-5 mt-5">
                                <div class="row">
                                    @php
                                        $checkoutImageSrc = '';
                                        $colMapCheckout = 'col-12';
                                        if ($atendanceTrackingCheckout->image) {
                                            $checkoutImageSrc = asset($atendanceTrackingCheckout->image[0]);
                                            $colMapCheckout = 'col-6';
                                        }
                                    @endphp

                                    <div class="col-6 {{ $checkoutImageSrc ? ' ' : 'd-none' }}">
                                        <div class="position-relative">
                                            <div class="ratio ratio-1x1">

                                                <div class="rounded-2">

                                                    <div
                                                        class="d-flex w-100 h-100 justify-content-center align-items-center">
                                                        <img src="{{ $checkoutImageSrc }}"
                                                            class="object-fit-cover w-100 h-100 position-absolute top-0 start-0 rounded-2"
                                                            alt="">
                                                    </div>

                                                </div>

                                            </div>
                                        </div>
                                    </div>

                                    <div class="{{ $colMapCheckout }} ">
                                        <div class="position-relative">
                                            <div class="ratio {{ $checkoutImageSrc ? 'ratio-1x1' : 'ratio-16x9' }} ">
                                                <div id="detailMapCheckOut"
                                                    data-location="{{ $atendanceTrackingCheckout->location }}"
                                                    class="rounded-3"></div>
                                            </div>
                                        </div>
                                    </div>

                                </div>

                            </div>
                        @else
                            <div class="p-5 text-center fs-14 text-secondary">
                                No Data Check Out
                            </div>
                        @endif

                        <div class="mt-5 mb-3">
                            <button type="button" class="btn btn-close-custom w-100"
                                data-bs-dismiss="modal">Close</button>
                        </div>


                    </div>
                </div>
            </div>
        </div>

        <!-- Tutorial Overtime Modal -->
        <div class="modal fade" id="announcementModal" tabindex="-1" aria-labelledby="tutorialOvertimeModalLabel">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content border-0 bg-transparent shadow-0">
                    <div class="modal-body bg-transparent">

                        <div id="carouselExample" class="carousel slide">
                            <div class="carousel-inner">
                                <div class="carousel-item active">
                                    <svg aria-label="Placeholder: First slide"
                                        class="bd-placeholder-img bd-placeholder-img-lg d-block w-100" height="400"
                                        preserveAspectRatio="xMidYMid slice" role="img" width="800"
                                        xmlns="http://www.w3.org/2000/svg">
                                        <title>Placeholder</title>
                                        <rect width="100%" height="100%" fill="#777"></rect><text x="50%"
                                            y="50%" fill="#555" dy=".3em">First slide</text>
                                    </svg>
                                </div>
                                <div class="carousel-item">
                                    <svg aria-label="Placeholder: Second slide"
                                        class="bd-placeholder-img bd-placeholder-img-lg d-block w-100" height="400"
                                        preserveAspectRatio="xMidYMid slice" role="img" width="800"
                                        xmlns="http://www.w3.org/2000/svg">
                                        <title>Placeholder</title>
                                        <rect width="100%" height="100%" fill="#666"></rect><text x="50%"
                                            y="50%" fill="#444" dy=".3em">Second slide</text>
                                    </svg>
                                </div>
                                <div class="carousel-item">
                                    <svg aria-label="Placeholder: Third slide"
                                        class="bd-placeholder-img bd-placeholder-img-lg d-block w-100" height="400"
                                        preserveAspectRatio="xMidYMid slice" role="img" width="800"
                                        xmlns="http://www.w3.org/2000/svg">
                                        <title>Placeholder</title>
                                        <rect width="100%" height="100%" fill="#555"></rect><text x="50%"
                                            y="50%" fill="#333" dy=".3em">Third slide</text>
                                    </svg>
                                </div>
                            </div>
                            <button class="carousel-control-prev" type="button" data-bs-target="#carouselExample"
                                data-bs-slide="prev">
                                <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                                <span class="visually-hidden">Previous</span>
                            </button>
                            <button class="carousel-control-next" type="button" data-bs-target="#carouselExample"
                                data-bs-slide="next">
                                <span class="carousel-control-next-icon" aria-hidden="true"></span>
                                <span class="visually-hidden">Next</span>
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>

    </x-slot>

    <x-slot name="script_slot">
        <script src="https://code.jquery.com/jquery-3.7.1.min.js"
            integrity="sha256-/JqT3SQfawRcv/BIHPThkBvs0OEvtFFmqPF/lYI/Cxo=" crossorigin="anonymous"></script>
        <script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js"></script>
        <script src="{{ asset('asset/plugin/leaflet/leaflet.js') }}" crossorigin=""></script>
        <script src="https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.min.js"></script>
        <script src="{{ asset('asset/js/dashboard.js') }}?v={{ time() }}"></script>
        <script src="{{ asset('asset/js/dashboard_announcement.js') }}?v={{ time() }}"></script>
        <script src="{{ asset('asset/js/attendance_dashboard_new.js') }}?v={{ time() }}"></script>
        <script src="{{ asset('asset/js/callendar_dashboard.js') }}?v={{ time() }}"></script>
        <script>
            window.APP_URL = "{{ url('/') }}";
        </script>
    </x-slot>

</x-office-layout>
