<x-office-layout>
    <x-slot name="menu_active">
        {{ __('employee') }}
    </x-slot>
    <x-slot name="head_slot">
        <link href="{{ asset('asset/css/employee.css') }}?v={{ date('YmdHi') }}" rel="stylesheet">
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
        <h2 class="m-0">Employee</h2>
    </div>

    <div class="body-content scrollable-container rounded-4 px-3 py-3">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h5 class="mb-0 table-title">List Employee</h5>

            <div class="d-flex gap-1">
                <div class="input-group search-input-container">
                    <input type="text" id="searchInput" class="form-control border-dddd height-38"
                        placeholder="Search" />
                </div>
                <!-- Filter Dropdown -->
                <div class="dropdown">
                    <button class="btn btn-icon-toggle border-dddd filter-btn dropdown-toggle" type="button" id="filterDropdownBtn" data-bs-toggle="dropdown" aria-expanded="false">
                        <span class="material-symbols-outlined icon">filter_list</span><span class="text-btn">Filter</span>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end border-0" aria-labelledby="filterDropdownBtn" style="min-width: 300px; padding: 15px;">
                        <form id="filterForm">
                            
                            <div class="mb-3 custom-input">
                                <label for="sortBy" class="form-label small">Sort By</label>
                                <select id="sortBy" class="form-select form-select-sm">
                                    <option value="">Select Sort</option>
                                    <option value="name_asc">Name (A-Z)</option>
                                    <option value="name_desc">Name (Z-A)</option>
                                    <option value="hire_date_newest">Hire Date (Newest)</option>
                                    <option value="hire_date_oldest">Hire Date (Oldest)</option>
                                    <option value="contract_date_newest">Contract Date (Newest)</option>
                                    <option value="contract_date_oldest">Contract Date (Oldest)</option>
                                    <option value="department_asc">Department (A-Z)</option>
                                    <option value="department_desc">Department (Z-A)</option>
                                    <option value="division_asc">Division (A-Z)</option>
                                    <option value="division_desc">Division (Z-A)</option>
                                </select>
                            </div>

                            <div class="mb-3 custom-input">
                                <label for="filterDepartment" class="form-label small">Department</label>
                                <select id="filterDepartment" class="form-select form-select-sm">
                                    <option value="">Select Department</option>
                                </select>
                            </div>

                            <div class="mb-3 custom-input">
                                <label for="filterDivision" class="form-label small">Division</label>
                                <select id="filterDivision" class="form-select form-select-sm" disabled>
                                    <option value="">Select Division</option>
                                </select>
                            </div>
                            <div class="mb-3 custom-input">
                                <label for="filterJob" class="form-label small">Job</label>
                                <select id="filterJob" class="form-select form-select-sm" disabled>
                                    <option value="">Select Job</option>
                                </select>
                            </div>
                            <div class="d-flex gap-2">
                                <button type="button" class="btn btn-submit-black flex-grow-1" id="applyFilterBtn">Apply</button>
                                <button type="button" class="btn btn-custom-close flex-grow-1" id="clearFilterBtn">Clear</button>
                            </div>
                        </form>
                    </ul>
                </div>

                <a href="{{ route('employee.create') }}" id="btnAddData" class="btn btn-icon-toggle border-dddd add-btn">
                    <span class="material-symbols-outlined icon">add</span><span class="text-btn">Add Data</span>
                </a>
                <a href="{{ url('/employee/export-employee-active')}}" target="_blank" class="btn btn-icon-toggle border-dddd add-btn" style="width: auto; min-width: 20px;">
                    <span class="material-symbols-outlined icon">download</span>
                </a>
            </div>
        </div>

        <div class="table-responsive">
            <div class="table-scroll-wrapper">
                <table class="table-employee table table-borderless align-middle table-transparent">
                    <thead>
                        <tr>
                            <th scope="col" style="text-align: left;">Employee</th>
                            <th scope="col" style="text-align: left;">Hire Date</th>
                            <th scope="col" style="text-align: left;">Contract Date</th>
                            <th scope="col" style="text-align: left;">Working Period</th>
                            <th scope="col" style="text-align: left;">Department Name</th>
                            <th scope="col" style="text-align: left;">Division Name</th>
                            <th scope="col" style="text-align: left;">Office</th>
                            <th scope="col" style="text-align: center;">Status</th>
                            <th scope="col" style="text-align: right;"></th>
                        </tr>
                    </thead>
                    <tbody id="employeeTableBody">
                    </tbody>
                </table>
            </div>
        </div>
    </div>


    <div class="alert-delete-container mb-3" style="width: 100%;"></div>

    <!-- Delete Confirmation Modal -->
    <div class="modal fade" id="deleteEmployeeModal" tabindex="-1" aria-labelledby="deleteEmployeeModalLabel"
        aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <form id="deleteEmployeeForm" class="modal-content">
                <div class="modal-header border-0 pb-0">
                    <h5 class="modal-title" id="deleteEmployeeModalLabel">Confirm Delete Employee</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body text-center">
                    <div class="delete-employee-photo mb-3 mt-4 mx-auto"></div>
                    <h5 id="deleteEmployeeName" class="fw-semibold"></h5>
                    <div id="deleteEmployeeEmail" class="text-muted small mb-3"></div>
                    <div class="text-start mx-4">
                        <p class="mb-1"><strong>Department:</strong> <span id="deleteEmployeeDepartment"></span></p>
                        <p class="mb-1"><strong>Division:</strong> <span id="deleteEmployeeDivision"></span></p>
                        <p class="mb-1"><strong>Office:</strong> <span id="deleteEmployeeOffice"></span></p>
                        <p class="mb-1"><strong>Status:</strong> <span id="deleteEmployeeStatus"></span></p>
                    </div>
                </div>
                <div class="modal-footer modal-footer-custom modal-footer-delete">
                    <button type="submit"
                        class="btn-submit-black btn-submit-custom btn-delete-modal btn-delete-small btn-delete-red">Delete</button>
                    <button type="button"
                        class="btn-cancel-delete btn-submit-black btn-submit-custom btn-cancel-small"
                        data-bs-dismiss="modal">Cancel</button>
                </div>
                <div id="deleteModalLoader" class="modal-loading-overlay d-none">
                    <div class="loader-spinner"></div>
                </div>
            </form>
        </div>
    </div>

     <!-- Employee Detail Modal -->
    <div class="modal fade" id="employeeDetailModal" tabindex="-1" aria-labelledby="employeeDetailModalLabel"
        aria-hidden="true">
        <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content">
                <div class="modal-header modal-header-custom">
                    <h5 class="modal-title modal-title-custom" id="employeeDetailModalLabel">Employee Detail</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="employee-detail-modal">
                        <div class="employee-photo-name-email">
                            <img id="detailPhoto" src="" alt="Employee Photo" class="employee-photo">
                            <p class="employee-name" id="detailName"></p>
                            <p class="employee-email" id="detailEmail"></p>
                        </div>
                        <div class="employee-detail-columns">
                            <div class="employee-detail-left">
                                <p><strong>Birth Date:</strong> <span id="detailBirthDate"></span></p>
                                <p><strong>Phone:</strong> <span id="detailPhone"></span></p>
                                <p><strong>Address:</strong> <span id="detailAddress"></span></p>
                            </div>
                            <div class="employee-detail-right">
                                <p><strong>Department:</strong> <span id="detailDepartment"></span></p>
                                <p><strong>Division:</strong> <span id="detailDivision"></span></p>
                                <p><strong>Job:</strong> <span id="detailJob"></span></p>
                                <p><strong>Hire Date:</strong> <span id="detailHireDate"></span></p>
                                <p><strong>Grade:</strong> <span id="detailGrade"></span></p>
                                <p><strong>Office:</strong> <span id="detailOffice"></span></p>
                                <p><strong>Status:</strong> <span id="detailStatus"></span></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <x-slot name="script_slot">

        <script src="{{ asset('asset/js/employee.js') }}"></script>
        <script src="{{ asset('asset/js/date_helper.js') }}"></script>

        <script></script>
    </x-slot>


</x-office-layout>
