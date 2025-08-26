<x-office-layout>
    <x-slot name="menu_active">
        {{ __('shift') }}
    </x-slot>
    <x-slot name="head_slot">
        <link href="{{ asset('asset/css/shift.css') }}" rel="stylesheet">
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

            <button class="btn btn-icon-toggle filter-shift-btn border-dddd" type="button" data-bs-toggle="modal"
                data-bs-target="#filterModal">
                <span class="material-symbols-outlined icon">filter_list</span><span class="icon-text">Filter</span>
            </button>
            <div class="modal fade" id="filterModal" tabindex="-1" aria-labelledby="filterModalLabel"
                aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="filterModalLabel">Filter Employee Shifts</h5>
                            <button type="button" class="btn-close mt-1" data-bs-dismiss="modal"
                                aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <form id="filterForm">
                                <div class="mb-3">
                                    <label for="filterDepartment" class="form-label">Filter by Department</label>
                                    <select id="filterDepartment" class="form-select">
                                        <option value="">Select Department</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label for="filterDivision" class="form-label">Filter by Division</label>
                                    <select id="filterDivision" class="form-select" disabled>
                                        <option value="">Select Division</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label for="filterShift" class="form-label">Filter by Shift</label>
                                    <select id="filterShift" class="form-select">
                                        <option value="">Select Shift</option>
                                        <option value="Morning">Morning</option>
                                        <option value="Afternoon">Afternoon</option>
                                        <option value="Night">Night</option>
                                    </select>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer modal-footer-custom">
                            <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button>
                            <button type="submit" class="btn btn-submit-black" id="applyFilterBtn">Filter</button>
                        </div>
                    </div>
                </div>
            </div>
            <button class="btn btn-icon-toggle config-shift-btn border-dddd" type="button" data-bs-toggle="modal"
                data-bs-target="#shiftConfigModal">
                <span class="material-symbols-outlined icon" type="button">settings</span><span
                    class="icon-text">Config</span>
            </button>
        </div>
    </div>

    <div class="body-content scrollable-container rounded-4 px-3 p-3">
        <div class="d-flex justify-content-start align-items-center mb-3 gap-2">
            <h4 id="shiftMonthTitle" class="fw-normal mb-0 month-year-title">August 2025</h4>

            <div class="year-dropdown-wrapper">
                <select id="yearSelect"></select>
            </div>

            <button id="prevMonthBtn" class="btn btn-pagination-table">
                <span class="material-symbols-outlined me-1">chevron_left</span>
            </button>
            <button id="nextMonthBtn" class="btn btn-pagination-table">
                <span class="material-symbols-outlined me-1">chevron_right</span>
            </button>
        </div>

        <div class="table-responsive">
            <div class="table-scroll-wrapper">
                <table class="table table-bordered align-middle shift-table">
                    <thead>
                        <thead>
                            <tr id="shiftTableHeader"></tr>
                        </thead>
                    <tbody id="shiftTableBody"></tbody>

                </table>
            </div>
        </div>

        {{-- Add Shift Modal --}}
        <div class="modal fade" id="addShiftModal" tabindex="-1" aria-labelledby="addShiftModalLabel"
            aria-hidden="true">
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

                        <div class="modal-header modal-header-custom">
                            <button type="button" class="btn-close" data-bs-dismiss="modal"
                                aria-label="Close"></button>
                        </div>

                        <div class="modal-body modal-body-custom text-center">
                            <img id="addEmployeePicture" src="" class="rounded-circle mb-2" width="70"
                                height="70">
                            <h5 id="addShiftEmployeeName"></h5>
                            <small id="addEmployeeGrade" class="text-muted">employee grade</small>

                            <div class="mt-3 text-start">
                                <div class="d-flex justify-content-between">
                                    <p>Shift : </p>
                                    <span id="addTitleShiftDisplay"></span>
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

                        <!-- Dropdown pilih shift -->
                        <div class="dropdown-container">
                            <div class="dropdown-selected" id="addDropdownSelected">
                                Select shift
                                <span class="material-symbols-outlined">arrow_drop_down</span>
                            </div>
                            <div class="dropdown-list" id="addDropdownList">
                                <div class="dropdown-item">
                                    <span class="title">Shift Title</span>
                                    <span class="time">09:00 - 18:00</span>
                                </div>
                                <div class="dropdown-item">
                                    <span class="title">Shift Title</span>
                                    <span class="time">13:00 - 22:00</span>
                                </div>
                                <div class="dropdown-item">
                                    <span class="title">Shift Title</span>
                                    <span class="time">22:00 - 07:00</span>
                                </div>
                                <div class="dropdown-item">
                                    <span class="title">Shift Title</span>
                                    <span class="time">07:00 - 16:00</span>
                                </div>
                                <div class="dropdown-item">
                                    <span class="title">Shift Title</span>
                                    <span class="time">10:00 - 19:00</span>
                                </div>
                            </div>
                        </div>

                        <div class="modal-footer modal-footer-custom">
                            <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button>
                            <button type="submit" class="btn btn-submit-black">Submit</button>
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

                        <!-- hidden input (buat dikirim ke backend) -->
                        <input type="hidden" id="editShiftId" name="shift_id">
                        <input type="hidden" id="editEmployeeId" name="employee_id">
                        <input type="hidden" id="editDateShift" name="date">
                        <input type="hidden" id="editEmployeeNameInput" name="employee_name">
                        <input type="hidden" id="editTimeStart" name="time_in">
                        <input type="hidden" id="editTimeEnd" name="time_out">

                        <div class="modal-header modal-header-custom">
                            <button type="button" class="btn-close" data-bs-dismiss="modal"
                                aria-label="Close"></button>
                        </div>

                        <div class="modal-body modal-body-custom text-center">
                            <img id="editEmployeePicture" src="" class="rounded-circle mb-2" width="70"
                                height="70">
                            <h5 id="editShiftEmployeeName"></h5>
                            <small id="editEmployeeGrade" class="text-muted">employee grade</small>

                            <div class="mt-3 text-start">
                                <div class="d-flex justify-content-between">
                                    <p class="mb-1 fw-semibold">Shift :</p>
                                    <span id="editTitleShiftDisplay"></span>
                                </div>

                                <hr class="border-3 rounded">

                                <div class="d-flex justify-content-between text-shift-display">
                                    <p class="mb-1">Date :</p>
                                    <span id="editDateShiftDisplayText"></span>
                                </div>

                                <div class="d-flex justify-content-between text-shift-display">
                                    <p class="mb-1">Time In :</p>
                                    <span id="editTimeStartDisplay"></span>
                                </div>

                                <div class="d-flex justify-content-between text-shift-display">
                                    <p class="mb-1">Time Out :</p>
                                    <span id="editTimeEndDisplay"></span>
                                </div>
                            </div>
                        </div>

                        <div class="dropdown-container">
                            <div class="dropdown-selected" id="dropdownSelected">
                                Select shift
                                <span class="material-symbols-outlined">arrow_drop_down</span>
                            </div>
                            <div class="dropdown-list" id="dropdownList">
                                <div class="dropdown-item">
                                    <span class="title">Shift Title</span>
                                    <span class="time">09:00 - 18:00</span>
                                </div>
                                <div class="dropdown-item">
                                    <span class="title">Shift Title</span>
                                    <span class="time">13:00 - 22:00</span>
                                </div>
                                <div class="dropdown-item">
                                    <span class="title">Shift Title</span>
                                    <span class="time">22:00 - 07:00</span>
                                </div>
                                <div class="dropdown-item">
                                    <span class="title">Shift Title</span>
                                    <span class="time">07:00 - 16:00</span>
                                </div>
                                <div class="dropdown-item">
                                    <span class="title">Shift Title</span>
                                    <span class="time">10:00 - 19:00</span>
                                </div>
                            </div>
                        </div>

                        <div class="modal-footer modal-footer-custom">
                            <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button>
                            <button type="submit" class="btn btn-submit-black">Update</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        {{-- Shift Config Modal --}}
        <div class="modal fade" id="shiftConfigModal" tabindex="-1" aria-labelledby="shiftConfigModalLabel"
            aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered modal-md modal-dialog-scrollable">
                <div class="modal-content modal-content-custom">

                    <div class="modal-header d-flex justify-content-between align-items-center">
                        <h5 class="modal-title shift-config-title" id="shiftConfigModalLabel">Shift Config</h5>

                        <div class="d-flex align-items-center gap-2">
                            <button type="button" class="btn btn-dark btn-sm add-shift-button"
                                data-bs-toggle="modal" data-bs-target="#addShiftModal">
                                Add
                            </button>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"
                                aria-label="Close"></button>
                        </div>
                    </div>

                    <div class="modal-body">
                        <div class="table-responsive shift-config-table">
                            <table class="table table-bordered align-middle">
                                <thead>
                                    <tr>
                                        <th>Title</th>
                                        <th>Time In & Out</th>
                                        <th class="text-center" style="width: 100px;">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td data-field="title">Shift title</td>
                                        <td data-field="time">09:00 - 18:00</td>
                                        <td class="text-center">
                                            <button class="btn btn-sm edit-btn"><i class="bi bi-pencil"></i></button>
                                            <button class="btn btn-sm save-btn d-none"><i
                                                    class="bi bi-check"></i></button>
                                            <button class="btn btn-sm"><i class="bi bi-trash"></i></button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {{-- Edit Employee Modal --}}
        <div class="modal fade" id="editEmployeeModal" tabindex="-1" aria-labelledby="editEmployeeModalLabel"
            aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content modal-content-custom">

                    <div class="modal-header">
                        <button type="button" class="btn-close" data-bs-dismiss="modal"
                            aria-label="Close"></button>
                    </div>

                    <div class="modal-body">
                        <form id="editEmployeeForm">
                            <input type="hidden" id="editShiftId" name="shift_id">
                            <input type="hidden" id="editEmployeeId" name="employee_id">

                            <div class="mb-3 text-center">
                                <img id="editEmployeePicture" src="" alt="Employee Picture"
                                    class="rounded-circle border" width="70" height="70">
                            </div>

                            <div class="mb-3">
                                <label for="editEmployeeName" class="form-label">Employee Name</label>
                                <input type="text" class="form-control" id="editEmployeeName">
                            </div>

                        </form>
                    </div>

                    <div class="modal-footer modal-footer-custom">
                        <button type="button" class="btn btn-dark" id="saveEmployeeBtn">Update</button>
                    </div>

                </div>
            </div>
        </div>

        <x-slot name="script_slot">
            <script src="{{ asset('asset/js/shift.js') }}"></script>
        </x-slot>
</x-office-layout>
