<x-office-layout :photo="$photo">
    <x-slot name="menu_active">
        {{ __('employee') }}
    </x-slot>
    <x-slot name="head_slot">
        <link href="{{ asset('asset/css/employee.css') }}" rel="stylesheet">
    </x-slot>

    <div class="title-content d-flex align-items-center gap-2">
        <h2 class="m-0">Employee</h2>
    </div>

    <div class="body-content scrollable-container rounded-4 px-3 py-3">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h5 class="mb-0 table-title">List Employee</h5>

            <div class="d-flex gap-1 ml-neg-5">
                <div class="input-group min-width-200 height-38">
                    <input type="text" id="searchInput" class="form-control input-soft border-dddd height-38"
                        placeholder="Search" />
                </div>
                <!-- Replace dropdown filter with button to open modal -->
                <button class="btn btn-icon-toggle border-dddd" type="button" id="openFilterModalBtn">
                    <span class="material-symbols-outlined icon">filter_list</span> Filter
                </button>

                <!-- Filter Modal -->
                <div class="modal fade" id="filterModal" tabindex="-1" aria-labelledby="filterModalLabel"
                    aria-hidden="true">
                    <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="filterModalLabel">Filter Employees</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"
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
                                        <label for="filterJob" class="form-label">Filter by Job</label>
                                        <select id="filterJob" class="form-select" disabled>
                                            <option value="">Select Job</option>
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

                <a href="{{ route('employees.create') }}" id="btnAddData" class="btn btn-icon-toggle border-dddd">
                    <span class="material-symbols-outlined icon">add</span> Add Data
                </a>
            </div>
        </div>

        <div class="table-responsive">
            <div class="table-scroll-wrapper">
                <table class="table table-borderless align-middle table-transparent">
                    <thead>
                        <tr>
                            <th scope="col">Employee</th>
                            <th scope="col">Department Name</th>
                            <th scope="col">Division Name</th>
                            <th scope="col">Office</th>
                            <th scope="col">Status</th>
                            <th scope="col"></th>
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
                    <div class="delete-employee-photo mb-3 mx-auto"></div>
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

    <x-slot name="script_slot">

        <script src="{{ asset('asset/js/employee.js') }}"></script>

        <script></script>
    </x-slot>

    <!-- Employee Detail Modal -->
    <div class="modal fade" id="employeeDetailModal" tabindex="-1" aria-labelledby="employeeDetailModalLabel"
        aria-hidden="true">
        <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="employeeDetailModalLabel">Employee Detail</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="detail-left">
                        <p data-label="Name"><span id="detailName"></span></p>
                        <p data-label="Birth Date"><span id="detailBirthDate"></span></p>
                        <p data-label="Email"><span id="detailEmail"></span></p>
                        <p data-label="Phone"><span id="detailPhone"></span></p>
                        <p data-label="Address"><span id="detailAddress"></span></p>
                    </div>
                    <div class="detail-middle">
                        <p data-label="Department"><span id="detailDepartment"></span></p>
                        <p data-label="Division"><span id="detailDivision"></span></p>
                        <p data-label="Job"><span id="detailJob"></span></p>
                        <p data-label="Hire Date"><span id="detailHireDate"></span></p>
                        <p data-label="Grade"><span id="detailGrade"></span></p>
                        <p data-label="Office"><span id="detailOffice"></span></p>
                        <p data-label="Status"><span id="detailStatus"></span></p>
                    </div>
                    <div class="detail-right">
                        <img id="detailPhoto" src="" alt="Employee Photo">
                    </div>
                </div>
            </div>
        </div>
    </div>
</x-office-layout>
