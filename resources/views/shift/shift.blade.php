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

    <div class="title-content d-flex align-items-center gap-2">
        <h2 class="m-0 mb-3">Shift</h2>
    </div>

    <div class="body-content scrollable-container rounded-4 px-3 py-3">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h5 class="mb-0 table-title">Employee Shift</h5>

            <div class="d-flex gap-1 ml-neg-5">
                <div class="input-group min-width-200 height-38">
                    <input type="text" id="searchInput" class="form-control input-soft border-dddd height-38"
                        placeholder="Search" />
                </div>
                <!-- Filter button to open modal -->
                <button class="btn btn-icon-toggle border-dddd" type="button" id="openFilterModalBtn">
                    <span class="material-symbols-outlined icon">filter_list</span> Filter
                </button>

                <!-- Filter Modal -->
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
                            <div class="modal-footer">
                                <button type="button" class="btn btn-primary" id="applyFilterBtn">Filter</button>
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="table-responsive">
            <div class="table-scroll-wrapper">
                <table class="table table-borderless align-middle table-transparent">
                    <thead>
                        <tr>
                            <th scope="col">Employee</th>
                            <th scope="col">Shift</th>
                            <th scope="col">Start Time</th>
                            <th scope="col">End Time</th>
                            <th scope="col"></th>
                        </tr>
                    </thead>
                    <tbody id="shiftTableBody">
                        <!-- Data will be loaded here -->
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <x-slot name="script_slot">
        <script src="{{ asset('asset/js/shift.js') }}"></script>
    </x-slot>
</x-office-layout>
