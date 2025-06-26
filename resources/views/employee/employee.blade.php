<x-office-layout>
    <x-slot name="menu_active">
        {{ __('employee') }}
    </x-slot>
    <x-slot name="head_slot">
        <link href="{{ asset('asset/css/employee.css') }}" rel="stylesheet">
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
        <h2 class="m-0">Employee</h2>
    </div>

    <div class="body-content scrollable-container rounded-4 px-3 py-3" style="margin-top: 20px; width: 100%;">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h5 class="mb-0 table-title">List Employee</h5>

            <div class="d-flex gap-1" style="margin-left: -5px;">
                <div class="input-group" style="min-width: 200px; height: 38px;">
                    <input type="text" id="searchInput" class="form-control input-soft" placeholder="Search Division"
                        style="border: 1px solid #DDDDDD; height: 38px;" />
                </div>
                <div class="dropdown">
                    <button class="btn btn-icon-toggle dropdown-toggle" style="border: 1px solid #DDDDDD;"
                        type="button" id="filterDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                        <span class="material-symbols-outlined icon">filter_list</span> Filter
                    </button>
                    <ul class="dropdown-menu p-2" aria-labelledby="filterDropdown"
                        style="min-width: 220px; max-height: 300px; overflow-y: auto;">
                        <li class="mb-2">
                            <select class="form-select form-select-sm" id="filterTypeSelect"
                                aria-label="Select filter type">
                                <option value="" disabled selected>Select Filter Option</option>
                                <option value="status">Filter by Status</option>
                                <option value="department">Filter by Department</option>
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
                    </ul>
                </div>


                <a href="{{ route('employees.create') }}" id="btnAddData" class="btn btn-icon-toggle"
                    style="border: 1px solid #DDDDDD;">
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
                    <tbody id="divisionTableBody">
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    <div class="alert-delete-container mb-3" style="width: 100%;"></div>

    <!-- Delete Confirmation Modal -->
    <div class="modal fade" id="deleteEmployeeModal" tabindex="-1" aria-labelledby="deleteEmployeeModalLabel" aria-hidden="true">
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
</x-office-layout>
