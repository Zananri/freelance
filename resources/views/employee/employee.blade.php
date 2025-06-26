<x-office-layout>
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

    <x-slot name="script_slot">

        <script src="{{ asset('asset/js/employee.js') }}"></script>

        <script></script>
    </x-slot>
</x-office-layout>
