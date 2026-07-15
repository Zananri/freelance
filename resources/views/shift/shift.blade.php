<x-office-layout>
    <x-slot name="menu_active">
        {{ __('shift') }}
    </x-slot>
    <x-slot name="head_slot">
        <link href="{{ asset('asset/css/shift.css?v=' . time()) }}" rel="stylesheet">
        <meta name="user-id" content="{{ auth()->id() }}">
    </x-slot>

    <!-- SVG Symbols -->
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

    <div class="title-content d-flex justify-content-between align-items-center mb-3 py-3">
        <h2 class="m-0">Shift</h2>
        <div class="d-flex gap-2">
            <div class="search-input-container">
                <span class="material-symbols-outlined search-icon">search</span>
                <input class="form-control custom-form-filter" type="text" name="search_filter" id="search_filter">
            </div>

            <!-- Tombol trigger -->
            <div class="dropdown-center filter-dropdown">
                <button class="btn btn-icon-toggle filter-shift-btn border-dddd dropdown-toggle" type="button"
                    data-bs-toggle="dropdown" aria-expanded="false">
                    <span class="material-symbols-outlined icon">filter_list</span>
                    <span class="icon-text">Filter</span>
                </button>

                <!-- Isi dropdown -->
                <ul class="dropdown-menu dropdown-filter shadow-sm p-3" style="min-width: 250px;">
                    <!-- Department -->
                    <li class="mb-3 custom-input custom-dropdown-input">
                        <label class="form-label mb-1">Filter by Department</label>
                        <select id="filterDepartment" class="form-select">
                            <option value="">Select Department</option>
                        </select>
                    </li>

                    <!-- Division -->
                    <li class="mb-3 custom-input custom-dropdown-input">
                        <label class="form-label mb-1">Filter by Division</label>
                        <select id="filterDivision" class="form-select" disabled>
                            <option value="">Select Division</option>
                        </select>
                    </li>

                    <!-- Shift -->
                    <li class="mb-3 custom-input custom-dropdown-input">
                        <label class="form-label mb-1">Filter by Shift</label>
                        <select id="filterShift" class="form-select">
                            <option value="">Select Shift</option>
                        </select>
                    </li>

                    <li class="modal-footer-custom d-flex justify-content-between mt-2">
                        <button type="button" class="btn btn-light btn-sm" id="resetFilter">Cancel</button>
                        <button type="button" class="btn btn-light btn-sm" id="applyFilterBtn">Filter</button>
                    </li>
                </ul>
            </div>

            @if (in_array(Auth::user()->user_type, ['SUPERADMIN', 'ADMINISTRATOR']) &&
                    in_array(Auth::user()->user_role, ['ADMINISTRATOR', 'GENERAL_MANAGER', 'HR_MANAGER']))
                <button class="btn btn-icon-toggle config-shift-btn border-dddd" type="button" data-bs-toggle="modal"
                    data-bs-target="#shiftConfigModal">
                    <span class="material-symbols-outlined icon" type="button">settings</span><span
                        class="icon-text">Config</span>
                </button>
            @endif

        </div>
    </div>

    <div class="scrollable-container rounded-4 mb-3 px-4 py-2 shift-container">
        <div class="d-flex justify-content-between align-items-center">
            <div class="d-flex align-items-center gap-2">
                <h4 id="shiftMonthTitle" class="fw-normal mb-0 month-year-title">August 2025</h4>

                <div class="dropstart">
                    <button id="monthDropdownBtn" class="btn btn-light d-flex align-items-center dropdown-btn-custom"
                        type="button" data-bs-toggle="dropdown" aria-expanded="false">
                        <span class="material-symbols-outlined">arrow_drop_down</span>
                    </button>
                    <ul id="monthDropdownMenu" class="dropdown-menu dropdown-menu-start shadow-sm"></ul>
                </div>

                <button id="prevMonthBtn" class="btn btn-pagination-table">
                    <span class="material-symbols-outlined me-1">chevron_left</span>
                </button>
                <button id="nextMonthBtn" class="btn btn-pagination-table">
                    <span class="material-symbols-outlined me-1">chevron_right</span>
                </button>
            </div>

            <button class="btn btn-toggle-table-shift" data-bs-target="#fullscreenTableShift" data-bs-toggle="modal">
                <span class="material-symbols-outlined data-fullscreen">fullscreen</span>
                <span class="material-symbols-outlined data-fullscreen d-none">fullscreen_exit</span>
            </button>
        </div>

        <div class="table-responsive">
            <div class="table-scroll-wrapper">
                <table class="table table-bordered align-middle shift-table">
                    <thead>
                        <tr id="shiftTableHeader"></tr>
                    </thead>
                    <tbody id="shiftTableBody"></tbody>
                </table>
            </div>
        </div>
    </div>

    {{-- Add Shift Modal --}}
    <div class="modal fade" id="addShiftModal" tabindex="-1" aria-labelledby="addShiftModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content modal-content-custom">
                <form id="addShiftForm" method="POST">
                    @csrf
                    @method('POST')

                    <!-- hidden input -->
                    <input type="hidden" id="addShiftId" name="shift_id">
                    <input type="hidden" id="addEmployeeId" name="employee_id">
                    <input type="hidden" id="addDateShift" name="date">
                    <input type="hidden" id="addEmployeeNameInput" name="employee_name">
                    <input type="hidden" id="addTimeStart" name="time_in">
                    <input type="hidden" id="addTimeEnd" name="time_out">

                    <div class="modal-header border-0 position-relative d-flex justify-content-center">
                        <div class="text-center">
                            <img id="addEmployeePicture" src="" class="rounded-circle mb-2" width="70"
                                height="70">
                            <h5 class="fw-normal employee-name mb-0" id="addShiftEmployeeName">Employee fullname
                            </h5>
                            <small id="addEmployeeGrade" class="text-muted">employee grade</small>
                        </div>

                        <button type="button" class="btn-close position-absolute end-0 top-0 me-2 mt-2"
                            data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>

                    <div class="modal-body modal-body-custom text-center">
                        <div class="mt-3 text-start">
                            <div class="d-flex justify-content-between">
                                <p class="mb-1 fw-normal">Shift :</p>
                                <span id="editTitleShiftDisplay"></span>
                            </div>

                            <hr class="border-3 rounded">

                            <div class="d-flex justify-content-between text-shift-display">
                                <p class="text-shift-display">Date : </p>
                                <span id="addDateShiftDisplayText"></span>
                            </div>
                            <div class="d-flex justify-content-between text-shift-display">
                                <p class="text-shift-display">Time In : </p>
                                <span id="addTimeStartDisplay"></span>
                            </div>
                            <div class="d-flex justify-content-between text-shift-display">
                                <p class="text-shift-display">Time Out : </p>
                                <span id="addTimeEndDisplay"></span>
                            </div>
                        </div>
                    </div>

                    <div class="dropdown dropdown-container">
                        <button
                            class="btn btn-light d-flex justify-content-between align-items-center dropdown-btn border-0"
                            type="button" data-bs-toggle="dropdown" data-bs-display="static" aria-expanded="false">
                            Select Shift
                            <span class="material-symbols-outlined">arrow_drop_down</span>
                        </button>
                        <ul class="dropdown-menu dropdown-shift dropdown-menu-end">
                            <li>
                                <button class="dropdown-item d-flex justify-content-between">
                                    <span>Shift Title</span>
                                    <span>09:00 - 18:00</span>
                                </button>
                                <div class="d-flex justify-content-center">
                                    <hr class="border-3 barrier-option rounded">
                                </div>
                            </li>
                        </ul>
                    </div>

                    <div class="modal-footer modal-footer-custom justify-content-evenly">
                        <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button>
                        <button id="saveShiftBtn" type="submit" class="btn btn-submit-black">Submit</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    {{-- Edit Shift Modal --}}
    <div class="modal fade" id="editShiftModal" tabindex="-1" aria-labelledby="editShiftModalLabel"
        aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content modal-content-custom">
                <form id="editShiftForm" method="POST">
                    @csrf
                    @method('PUT')

                    <input type="hidden" id="editShiftId" name="shift_id">
                    <input type="hidden" id="editEmployeeId" name="employee_id">
                    <input type="hidden" id="editDateShift" name="date">
                    <input type="hidden" id="editEmployeeNameInput" name="employee_name">
                    <input type="hidden" id="editTimeStart" name="time_in">
                    <input type="hidden" id="editTimeEnd" name="time_out">

                    <div class="modal-header border-0 position-relative d-flex justify-content-center">
                        <div class="text-center">
                            <img id="editEmployeePicture" src="" class="rounded-circle mb-2" width="70"
                                height="70">
                            <h5 class="fw-normal employee-name mb-0" id="editShiftEmployeeName">Employee fullname
                            </h5>
                            <small id="editEmployeeGrade" class="text-muted">employee grade</small>
                        </div>

                        <button type="button" class="btn-close position-absolute end-0 top-0 me-2 mt-2"
                            data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>

                    <div class="modal-body modal-body-custom text-center">
                        <div class="mt-3 text-start">
                            <div class="d-flex justify-content-between">
                                <p class="mb-1 fw-normal">Shift :</p>
                                <span id="editTitleShiftDisplay"></span>
                            </div>

                            <hr class="border-3 rounded">

                            <div class="d-flex justify-content-between text-shift-display">
                                <p class="mb-3">Date :</p>
                                <span id="editDateShiftDisplayText"></span>
                            </div>

                            <div class="d-flex justify-content-between text-shift-display">
                                <p class="mb-3">Time In :</p>
                                <span id="editTimeStartDisplay"></span>
                            </div>

                            <div class="d-flex justify-content-between text-shift-display">
                                <p class="mb-3">Time Out :</p>
                                <span id="editTimeEndDisplay"></span>
                            </div>

                            <hr class="border-3 rounded">

                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <h6 class="fw-semibold mb-0">
                                    Timeline Checkpoint
                                </h6>

                                <span
                                    id="editCheckpointCount"
                                    class="text-dark fs-8">
                                    0 Point
                                </span>
                            </div>

                            <div
                                id="shiftTimeline"
                                class="timeline-wrapper">
                            </div>

                        </div>
                    </div>

                    <div class="dropdown dropdown-container">
                        <button
                            class="btn btn-light d-flex justify-content-between align-items-center dropdown-btn border-0"
                            type="button" data-bs-toggle="dropdown" data-bs-display="static"
                            id="addDropdownSelected" aria-expanded="false">
                            Select Shift
                            <span class="material-symbols-outlined">arrow_drop_down</span>
                        </button>
                        <ul class="dropdown-menu dropdown-shift">
                            <li class="dropdown-list" id="addDropdownList">
                                <button class="dropdown-item d-flex justify-content-between">
                                    <span>Shift Title</span>
                                    <span>09:00 - 18:00</span>
                                </button>
                                <div class="d-flex justify-content-center">
                                    <hr class="border-3 barrier-option rounded">
                                </div>
                            </li>
                        </ul>
                    </div>

                    <div class="modal-footer modal-footer-custom">
                        <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button>
                        <button type="submit" class="btn btn-submit-black">Update</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    {{-- Edit Employee Modal --}}
    <div class="modal fade" id="editEmployeeModal" tabindex="-1" aria-labelledby="editEmployeeModalLabel"
        aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content modal-content-custom">

                <input type="hidden" id="editShiftId" name="shift_id">
                <input type="hidden" id="editEmployeeId" name="employee_id">
                <input type="hidden" id="editEmployeeNameInput" name="employee_name">
                <input type="hidden" id="editTimeStart" name="time_in">
                <input type="hidden" id="editTimeEnd" name="time_out">

                <div class="modal-header border-0 position-relative d-flex justify-content-center">
                    <div class="text-center">
                        <img id="editEmployeePicture" src="" class="rounded-circle mb-2" width="70"
                            height="70">
                        <h5 class="fw-normal employee-name mb-0" id="editShiftEmployeeName">Employee fullname
                        </h5>
                        <small id="addEmployeeGrade" class="text-muted">employee grade</small>
                    </div>

                    <button type="button" class="btn-close position-absolute end-0 top-0 me-2 mt-2"
                        data-bs-dismiss="modal" aria-label="Close"></button>
                </div>

                <div class="modal-body modal-body-custom text-center">
                    <div class="mt-3 text-start">
                        <div class="d-flex justify-content-between">
                            <p class="mb-1 fw-normal">Shift :</p>
                            <span id="editTitleShiftDisplay"></span>
                        </div>

                        <hr class="border-3 rounded">

                        <div class="d-flex justify-content-between text-shift-display">
                            <p class="mb-3">Time In :</p>
                            <span id="editTimeStartDisplay"></span>
                        </div>

                        <div class="d-flex justify-content-between text-shift-display">
                            <p class="mb-3">Time Out :</p>
                            <span id="editTimeEndDisplay"></span>
                        </div>
                    </div>
                </div>

                <div class="dropdown dropdown-container">
                    <button
                        class="btn btn-light d-flex justify-content-between align-items-center dropdown-btn border-0"
                        type="button" data-bs-toggle="dropdown" data-bs-display="static" id="editDropdownSelected"
                        aria-expanded="false">
                        Select Shift
                        <span class="material-symbols-outlined">arrow_drop_down</span>
                    </button>
                    <ul class="dropdown-menu dropdown-shift" id="editDropdownList">
                        {{-- Shift Employee --}}
                    </ul>
                </div>

                <div class="modal-footer modal-footer-custom w-100">
                    <button type="button" class="btn btn-submit-black w-100" id="saveEmployeeBtn">Update</button>
                </div>

            </div>
        </div>
    </div>

    {{-- Shift Config Modal --}}
    <div class="modal fade" id="shiftConfigModal" tabindex="-1" aria-labelledby="shiftConfigModalLabel"
        aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
            <div class="modal-content modal-content-custom">

                <div class="modal-header d-flex justify-content-between align-items-center">
                    <h5 class="modal-title shift-config-title" id="shiftConfigModalLabel">Shift Config</h5>

                    <div class="d-flex align-items-center gap-2">
                        <button type="button" class="btn btn-dark btn-sm add-shift-button" data-bs-toggle="modal"
                            data-bs-target="#addConfigModal">
                            Add
                        </button>
                    </div>
                </div>

                <div class="modal-body">
                    <div class="table-responsive">
                        <table class="table table-bordered shift-config-table">
                            <colgroup>
                                <col style="width: 20%">
                                <col style="width: 40%">
                                <col style="width: 40%">
                            </colgroup>
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Description</th>
                                    <th>Time In</th>
                                    <th>Time Out</th>
                                    <th>Total Checkpoint</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody id="shiftConfigTableBody">
                                <!-- populated dynamically -->
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="modal-footer modal-footer-custom">
                    <button type="button" class="btn btn-light btn-close-custom"
                        data-bs-dismiss="modal">Close</button>
                </div>
            </div>
        </div>
    </div>

    {{-- Add Config Modal --}}
    <div class="modal fade" id="addConfigModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content modal-content-custom">

                <form id="addShiftConfigForm">

                    <div class="modal-header modal-header-custom">
                        <h5 class="modal-title modal-title-custom">
                            Add Shift
                        </h5>

                        <button type="button" class="btn-close" data-bs-dismiss="modal">
                        </button>
                    </div>

                    <div class="modal-body modal-body-custom">

                        <input type="hidden" id="addShiftId" name="shift_id">
                        <input type="hidden" id="addEmployeeId" name="employee_id">
                        <input type="hidden" id="addDateShift" name="date_shift">

                        <div class="mb-3">
                            <label class="form-label small fw-semibold">
                                Title
                            </label>

                            <input type="text" class="form-control border-0" id="addTitle" name="title"
                                placeholder="Morning Shift">
                        </div>

                        <div class="mb-3">
                            <label class="form-label small fw-semibold">
                                Description
                            </label>

                            <textarea class="form-control border-0" rows="3" id="addDescription" name="description"
                                placeholder="Description"></textarea>
                        </div>

                        <div class="row">

                            <div class="col-md-6 mb-3">
                                <label class="form-label small fw-semibold">
                                    Time In
                                </label>

                                <input type="time" class="form-control border-0" id="addTimeStart"
                                    name="time_start" required>
                            </div>

                            <div class="col-md-6 mb-3">
                                <label class="form-label small fw-semibold">
                                    Time Out
                                </label>

                                <input type="time" class="form-control border-0" id="addTimeEnd" name="time_end"
                                    required>
                            </div>

                            <div class="col-md-12 mb-3">

                                <label class="form-label small fw-semibold">
                                    Time In Checkpoint
                                </label>

                                <div class="d-flex gap-2 mb-3">

                                    <input type="text" class="form-control border-0" placeholder="Add checkpoint"
                                        readonly>

                                    <button type="button" class="btn btn-light px-3" id="addCheckpointBtn">

                                        <span class="material-symbols-outlined">
                                            add
                                        </span>

                                    </button>

                                </div>

                                <div id="checkpointContainer" class="checkpoint-wrapper"></div>

                            </div>

                        </div>

                    </div>

                    <div class="modal-footer modal-footer-custom">
                        <button type="button" class="btn btn-light" data-bs-dismiss="modal">
                            Cancel
                        </button>

                        <button type="button" class="btn btn-submit-black" id="saveShiftConfigBtn">
                            Save
                        </button>
                    </div>

                </form>

            </div>
        </div>
    </div>

    {{-- Edit Config Modal --}}
    <div class="modal fade" id="editConfigModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content modal-content-custom">

                <form id="editShiftConfigForm">

                    <div class="modal-header modal-header-custom">
                        <h5 class="modal-title modal-title-custom">
                            Edit Shift
                        </h5>

                        <button type="button" class="btn-close" data-bs-dismiss="modal">
                        </button>
                    </div>

                    <div class="modal-body modal-body-custom">

                        <input type="hidden" id="editConfigShiftId" name="shift_id">

                        <div class="mb-3">
                            <label class="form-label small fw-semibold">
                                Title
                            </label>

                            <input type="text" class="form-control border-0" id="editTitle" name="title">
                        </div>

                        <div class="mb-3">
                            <label class="form-label small fw-semibold">
                                Description
                            </label>

                            <textarea class="form-control border-0" rows="3" id="editDescription" name="description"></textarea>
                        </div>

                        <div class="row">

                            <div class="col-md-6 mb-3">
                                <label class="form-label small fw-semibold">
                                    Time In
                                </label>

                                <input type="time" class="form-control border-0" id="editTimeStart"
                                    name="time_start">
                            </div>

                            <div class="col-md-6 mb-3">
                                <label class="form-label small fw-semibold">
                                    Time Out
                                </label>

                                <input type="time" class="form-control border-0" id="editTimeEnd"
                                    name="time_end">
                            </div>

                            <div class="col-md-12 mb-3">

                                <label class="form-label small fw-semibold">
                                    Time In Checkpoint
                                </label>

                                <div class="d-flex gap-2 mb-3">

                                    <input type="text" class="form-control border-0" placeholder="Add checkpoint"
                                        readonly>

                                    <button type="button" class="btn btn-light px-3" id="addCheckpointBtn">

                                        <span class="material-symbols-outlined">
                                            add
                                        </span>

                                    </button>

                                </div>

                                <div id="checkpointContainer" class="checkpoint-wrapper"></div>

                            </div>

                        </div>

                    </div>

                    <div class="modal-footer modal-footer-custom">
                        <button type="button" class="btn btn-light" data-bs-dismiss="modal">
                            Cancel
                        </button>

                        <button type="button" class="btn btn-submit-black" id="saveUpdateShiftConfigBtn">
                            Update
                        </button>
                    </div>

                </form>

            </div>
        </div>
    </div>

    {{-- Delete Config Modal --}}
    <div class="modal fade" id="deleteConfigModal" tabindex="-1" aria-labelledby="deleteConfigModalLabel"
        aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content modal-content-custom">
                <div class="modal-header modal-header-custom">
                    <h5 class="modal-title modal-title-custom" id="deleteConfigModalLabel">Delete Shift</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body modal-body-custom text-center">
                    <div class="mb-3">
                        <span class="material-symbols-outlined text-warning" style="font-size: 3rem;">warning</span>
                    </div>
                    <h6 class="mb-3">Are you sure you want to delete this shift?</h6>
                    <div class="mb-3">
                        <strong id="deleteShiftTitle">Shift Title</strong><br>
                        <small id="deleteShiftTime" class="text-muted">Time: 09:00 - 17:00</small>
                    </div>
                    <p class="text-muted small">This action cannot be undone. The shift will be soft deleted.</p>
                    <input type="hidden" id="deleteConfigShiftId" name="shift_id">
                </div>
                <div class="modal-footer modal-footer-custom">
                    <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn submit-employee-btn"
                        id="confirmDeleteShiftConfigBtn">Delete</button>
                </div>
            </div>
        </div>
    </div>

    <x-slot name="script_slot">
        <script src="{{ asset('asset/js/shift.js?v=' . time()) }}"></script>
    </x-slot>
</x-office-layout>
