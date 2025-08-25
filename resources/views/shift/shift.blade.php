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
            <button class="btn btn-icon-toggle config-shift-btn border-dddd" type="button" data-bs-toggle="modal"
                data-bs-target="#filterModal">
                <span class="material-symbols-outlined icon">settings</span><span class="icon-text">Config</span>
            </button>
        </div>
    </div>

    <div class="body-content scrollable-container rounded-4 px-3 p-5">
        <div class="d-flex justify-content-start align-items-center mb-3 gap-2">
            <h4 id="shiftMonthTitle" class="fw-normal mb-0">August 2025</h4>

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

        {{-- Edit Modal --}}
        <div class="modal fade" id="editShiftModal" tabindex="-1" aria-labelledby="editShiftModalLabel"
            aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content modal-content-custom">
                    <div class="modal-header modal-header-custom">
                        <h5 class="modal-title modal-title-custom" id="editShiftModalLabel">Edit Employee Shift</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body modal-body-custom">
                        <form id="editShiftForm">
                            <input type="hidden" id="editShiftId" name="shift_id">
                            <input type="hidden" id="editEmployeeId" name="employee_id">

                            <div class="mb-3">
                                <label for="editEmployeeName" class="form-label label-custom">Employee Name</label>
                                <input type="text" class="form-control input-text" id="editEmployeeName" readonly>
                            </div>

                            <div class="mb-3">
                                <label for="editDateShiftDisplay" class="form-label label-custom">Date Shift</label>
                                <input type="text" id="editDateShiftDisplay" class="form-control input-text"
                                    placeholder="Click calendar to select dates" readonly />
                                <input type="hidden" id="editDateShift" name="date_shift" />
                                <small class="text-muted">Click calendar icon to select multiple dates</small>
                            </div>

                            <div class="mb-3">
                                <label for="editTimeStart" class="form-label label-custom">Start Time</label>
                                <input type="time" class="form-control input-text" id="editTimeStart"
                                    name="time_start" required>
                            </div>

                            <div class="mb-3">
                                <label for="editTimeEnd" class="form-label label-custom">End Time</label>
                                <input type="time" class="form-control input-text" id="editTimeEnd"
                                    name="time_end" required>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer modal-footer-custom">
                        <button type="button" class="btn btn-submit-black" id="saveShiftBtn">Save Changes</button>
                    </div>
                </div>
            </div>
        </div>

        <x-slot name="script_slot">
            <script src="{{ asset('asset/js/shift.js') }}"></script>
        </x-slot>
</x-office-layout>
