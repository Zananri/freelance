<x-office-layout>
    <x-slot name="menu_active">
        {{ __('master') }}
    </x-slot>
    <x-slot name="head_slot">
        <link href="{{ asset('asset/css/job.css') }}" rel="stylesheet">
    </x-slot>

    <div class="title-content d-flex align-items-center gap-2">
        <div class="nav-item d-inline-block">
            <div class="nav-icon-arrow">
                <a href="{{ url('master') }}" class="text-decoration-none text-dark d-flex align-items-center">
                    <div class="d-flex">
                        <span class="material-symbols-outlined">arrow_back</span>
                    </div>
                </a>
            </div>
        </div>
        <h2 class="m-0">Job</h2>
    </div>

    <div class="body-content scrollable-container rounded-4 px-3 py-3" style="margin-top: 20px; width: 100%;">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h5 class="mb-0 table-title">List Job</h5>

            <div class="d-flex gap-1" style="margin-left: -5px;">
                <div class="input-group search-input-container" style="min-width: 200px;">
                    <input type="text" id="searchInput" class="form-control input-text" placeholder="Search"/>
                </div>
                <div class="dropdown dropdown-filter-container">
                    <button class="btn btn-icon-toggle dropdown-toggle"
                        type="button" id="filterDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                        <span class="material-symbols-outlined icon">filter_list</span> Filter
                    </button>
                    <ul class="dropdown-menu dropdown-menu-filter p-2" aria-labelledby="filterDropdown"
                        style="min-width: 220px; max-height: 300px; overflow-y: auto;">
                        <li class="mb-2">
                            <select class="form-select form-select-sm" id="filterTypeSelect"
                                aria-label="Select filter type">
                                <option value="" disabled selected>Select Filter Option</option>
                                <option value="status">Filter by Status</option>
                                <option value="department">Filter by Department</option>
                                <option value="division">Filter by Division</option>
                            </select>
                        </li>
                        <li id="statusFilterOptions" class="d-none">
                            <a class="dropdown-item filter-option" href="#" data-status="ALL">All</a>
                            <a class="dropdown-item filter-option" href="#" data-status="ACTIVE">Active</a>
                            <a class="dropdown-item filter-option" href="#" data-status="INACTIVE">Inactive</a>
                        </li>
                        <li id="departmentFilterOptions" class="d-none">
                            <span class="dropdown-item text-muted">Loading departments...</span>
                        </li>
                        <li id="divisionFilterOptions" class="d-none">
                            <span class="dropdown-item text-muted">Loading divisions...</span>
                        </li>
                    </ul>
                </div>

                <button id="btnAddData" class="btn btn-icon-toggle btn-add-custom"
                    data-bs-toggle="modal" data-bs-target="#addJobModal">
                    <span class="material-symbols-outlined icon">add</span> Add Data
                </button>
            </div>
        </div>

        <div class="table-responsive">
            <div class="table-scroll-wrapper">
                <table class="table table-borderless align-middle table-transparent">
                    <thead>
                        <tr>
                            <th>Job Name</th>
                            <th>Department</th>
                            <th>Division</th>
                            <th>Status</th>
                            <th style="text-align: right;"></th>
                        </tr>
                    </thead>
                    <tbody id="jobTableBody">
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    <div class="alert-delete-container mb-3" style="width: 100%;"></div>

    <!-- Add Job Modal -->
    <div class="modal fade" id="addJobModal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1"
        aria-labelledby="addJobModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content modal-content-custom">
                <div class="modal-loading-overlay d-none" id="addModalLoader">
                    <div class="loader-spinner"></div>
                </div>
                <div class="modal-header modal-header-custom">
                    <h5 class="modal-title modal-title-custom" id="addJobModalLabel">Add Job</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <form id="addJobForm" class="form-custom needs-validation" novalidate>
                    <div class="mb-3 mt-4 custom-input">
                        <label for="department_id" class="form-label label-custom">Department</label>
                        <select id="department_id" name="department_id" class="form-select input-select"
                            required></select>
                    </div>
                    <div class="mb-3 custom-input">
                        <label for="division_id" class="form-label label-custom">Division</label>
                        <select id="division_id" name="division_id" class="form-select input-select"
                            required></select>
                    </div>
                    <div class="mb-3 custom-input">
                        <label for="job_name" class="form-label label-custom">Job Name</label>
                        <input type="text" id="job_name" name="job_name" class="form-control input-text"
                            required>
                    </div>
                    <div class="mb-3 custom-input">
                        <label for="status" class="form-label label-custom">Status</label>
                        <select id="status" name="status" class="form-select input-select" required>
                            <option value="" disabled selected>Select Status</option>
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                        </select>
                    </div>
                    <div class="mb-3 custom-input">
                        <label for="description" class="form-label label-custom">Description</label>
                        <textarea id="description" name="description" class="form-control input-text" rows="2"></textarea>
                    </div>
                    <div class="modal-footer modal-footer-custom">
                        <button type="submit" class="btn-submit-black">Submit</button>
                    </div>
                </form>
            </div>
            <div class="alert-container mt-2" style="width: 100%;"></div>
        </div>
    </div>

    <!-- Edit Job Modal -->
    <div class="modal fade" id="editJobModal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1"
        aria-labelledby="editJobModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content modal-content-custom">
                <div class="modal-loading-overlay d-none" id="editModalLoader">
                    <div class="loader-spinner"></div>
                </div>
                <div class="modal-header modal-header-custom">
                    <h5 class="modal-title modal-title-custom" id="editJobModalLabel">Edit Job</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <form id="editJobForm" class="form-custom needs-validation" novalidate>
                    <input type="hidden" id="edit_job_id" name="edit_job_id">
                    <div class="mb-3 mt-4 custom-input">
                        <label for="edit_department_id" class="form-label label-custom">Department</label>
                        <select id="edit_department_id" name="edit_department_id" class="form-select input-select"
                            required></select>
                    </div>
                    <div class="mb-3 custom-input">
                        <label for="edit_division_id" class="form-label label-custom">Division</label>
                        <select id="edit_division_id" name="edit_division_id" class="form-select input-select"
                            required></select>
                    </div>
                    <div class="mb-3 custom-input">
                        <label for="edit_job_name" class="form-label label-custom">Job Name</label>
                        <input type="text" id="edit_job_name" name="edit_job_name"
                            class="form-control input-text" required>
                    </div>
                    <div class="mb-3 custom-input">
                        <label for="edit_status" class="form-label label-custom">Status</label>
                        <select id="edit_status" name="edit_status" class="form-select input-select" required>
                            <option value="" disabled selected>Select Status</option>
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                        </select>
                    </div>
                    <div class="mb-3 custom-input">
                        <label for="edit_description" class="form-label label-custom">Description</label>
                        <textarea id="edit_description" name="edit_description" class="form-control input-text" rows="2"></textarea>
                    </div>
                    <div class="modal-footer modal-footer-custom">
                        <button type="submit" class="btn-submit-black">Update</button>
                    </div>
                </form>
            </div>
            <div class="alert-container mt-2" style="width: 100%;"></div>
        </div>
    </div>

    <!-- Delete Job Modal -->
    <div class="modal fade" id="deleteJobModal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1"
        aria-labelledby="deleteJobModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content modal-content-custom">
                <div class="modal-loading-overlay d-none" id="deleteModalLoader">
                    <div class="loader-spinner"></div>
                </div>
                <div class="modal-header modal-header-custom">
                    <h5 class="modal-title modal-title-custom mb-3" id="deleteJobModalLabel">Delete Job</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <form id="deleteJobForm" class="form-custom">
                    <div class="modal-body modal-body-custom">
                        <div class="mb-3 mt-3 custom-input">
                            <label class="form-label label-custom">Job Name</label>
                            <input type="text input" id="delete_job_name" class="form-control input-text" readonly>
                        </div>
                        <div class="mb-3 custom-input">
                            <label class="form-label label-custom">Status</label>
                            <input type="text" id="delete_status" class="form-control input-text" readonly>
                        </div>
                        <div class="mb-3 custom-input">
                            <label class="form-label label-custom">Description</label>
                            <textarea id="delete_description" class="form-control input-text" rows="2" readonly></textarea>
                        </div>
                    </div>
                    <div class="modal-footer modal-footer-custom">
                        <button type="button"
                        class="btn btn-custom-cancel"
                        data-bs-dismiss="modal">Cancel</button>
                        <button type="submit"
                            class="btn btn-submit-black">Delete</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <x-slot name="script_slot">
        <script src="{{ asset('asset/js/job.js') }}"></script>
    </x-slot>
</x-office-layout>
