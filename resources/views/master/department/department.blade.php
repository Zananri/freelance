<x-office-layout>
    <x-slot name="head_slot">
        <link href="{{ asset('asset/css/department.css') }}" rel="stylesheet">
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
        <h2 class="m-0">Department</h2>
    </div>

    <div class="body-content scrollable-container rounded-4 px-3 py-3" style="margin-top: 20px; width: 100%;">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h5 class="mb-0 table-title">List Department</h5>

           <div class="d-flex gap-1" style="margin-left: -5px;">
               <div class="input-group" style="min-width: 200px; height: 38px;">
                   <input type="text" id="searchInput" class="form-control input-soft" placeholder="Search Department" style="border: 1px solid #DDDDDD; height: 38px;" />
               </div>
               <div class="dropdown">
                   <button class="btn btn-icon-toggle dropdown-toggle" style="border: 1px solid #DDDDDD;" type="button" id="filterDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                       <span class="material-symbols-outlined icon">filter_list</span> Filter
                   </button>
                   <ul class="dropdown-menu" aria-labelledby="filterDropdown" style="min-width: 150px;">
                       <li><a class="dropdown-item filter-option active" href="#" data-status="ALL">All</a></li>
                       <li><a class="dropdown-item filter-option" href="#" data-status="ACTIVE">Active</a></li>
                       <li><a class="dropdown-item filter-option" href="#" data-status="INACTIVE">Inactive</a></li>
                       <li><a class="dropdown-item filter-option" href="#" data-status="DELETED">Deleted</a></li>
                   </ul>
               </div>
    </button>


    <button id="btnAddData" class="btn btn-icon-toggle" style="border: 1px solid #DDDDDD; min-width: 140px; padding-left: 20px; padding-right: 20px;">
        <span class="material-symbols-outlined icon">add</span> Add Data
    </button>
</div>
        </div>

        <div class="table-responsive">
            <div class="table-scroll-wrapper">
                <table class="table table-borderless align-middle table-transparent">
                    <thead>
                        <tr>
                            <th scope="col">Department Name</th>
                            <th scope="col">Status</th>
                            <th scope="col"></th>
                        </tr>
                    </thead>
                    <tbody id="departmentTableBody">

                    </tbody>
                </table>
            </div>
        </div>
    </div>
    <div class="alert-delete-container mb-3" style="width: 100%;"></div>

        <!-- Add Department Modal -->
        <div class="modal fade" id="addDepartmentModal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="addDepartmentModalLabel" aria-hidden="true">
            <div class="modal-dialog">
<div class="modal-content modal-content-custom">
    <div class="modal-loading-overlay d-none" id="addModalLoader">
        <div class="loader-spinner"></div>
    </div>
    <div class="modal-header modal-header-custom">
        <h5 class="modal-title modal-title-custom" id="addDepartmentModalLabel">Add Department</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
    </div>
<form id="addDepartmentForm" class="form-custom needs-validation" novalidate>
    <div class="modal-body modal-body-custom">
        <div class="mb-3 mt-4">
            <label for="name_department" class="form-label label-custom">Name</label>
            <input type="text" class="form-control input-soft" id="name_department" name="name_department" placeholder="Input Department Name" required>
            <div class="invalid-feedback">
                Please enter the department name.
            </div>
        </div>
        <div class="mb-3">
            <label for="status" class="form-label label-custom">Status</label>
            <select class="form-select input-soft" id="status" name="status" required>
                <option value="" disabled selected>Select Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
            </select>
            <div class="invalid-feedback">
                Please select a status.
            </div>
        </div>
    </div>
    <div class="modal-footer modal-footer-custom">
        <button type="submit" class="btn-submit-black btn-submit-custom">Submit</button>
    </div>
</form>
                </div>
                <div class="alert-container mt-2" style="width: 100%;"></div>
            </div>
        </div>

        <!-- Edit Department Modal -->
        <div class="modal fade" id="editDepartmentModal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="editDepartmentModalLabel" aria-hidden="true">
            <div class="modal-dialog">
<div class="modal-content modal-content-custom">
    <div class="modal-loading-overlay d-none" id="editModalLoader">
        <div class="loader-spinner"></div>
    </div>
    <div class="modal-header modal-header-custom">
        <h5 class="modal-title modal-title-custom" id="editDepartmentModalLabel">Edit Department</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
    </div>
    <form id="editDepartmentForm" class="form-custom">
        <div class="modal-body modal-body-custom">
            <div class="mb-3 mt-4">
                <label for="edit_name_department" class="form-label label-custom">Name</label>
                <input type="text" class="form-control input-soft" id="edit_name_department" name="name_department" placeholder="Input Department Name" required>
            </div>
        <div class="mb-3">
            <label for="edit_status" class="form-label label-custom">Status</label>
            <select class="form-select input-soft" id="edit_status" name="status" required>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
            </select>
        </div>
        </div>
        <div class="modal-footer modal-footer-custom">
            <button type="submit" class="btn-submit-black btn-submit-custom">Update</button>
        </div>
    </form>
                </div>
                <div class="alert-container mt-2" style="width: 100%;"></div>
            </div>
        </div>
        
        <!-- Delete Department Modal -->
        <div class="modal fade" id="deleteDepartmentModal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="deleteDepartmentModalLabel" aria-hidden="true">
         <div class="modal-dialog">
<div class="modal-content modal-content-custom">
    <div class="modal-loading-overlay d-none" id="deleteModalLoader">
        <div class="loader-spinner"></div>
    </div>
    <div class="modal-header modal-header-custom">
        <h5 class="modal-title modal-title-custom mb-3" id="deleteDepartmentModalLabel">Delete Department</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
    </div>
    <form id="deleteDepartmentForm" class="form-custom">
        <div class="modal-body modal-body-custom">

            <div class="mb-3 mt-4">
                <label for="delete_name_department" class="form-label label-custom">Name</label>
                <input type="text" class="form-control input-soft" id="delete_name_department" name="name_department" readonly disabled />
            </div>
            <div class="mt-5 text-center">
                <p class="mb-3" style="font-weight: 300; font-size: 16px;">Are you sure you want to delete this data?</p>
            </div>
        </div>
<div class="modal-footer modal-footer-custom modal-footer-delete">
<button type="submit" class="btn-submit-black btn-submit-custom btn-delete-modal btn-delete-small btn-delete-red">Delete</button>
    <button type="button" class="btn-cancel-delete btn-submit-black btn-submit-custom btn-cancel-small" data-bs-dismiss="modal">Cancel</button>
</div>
                </form>
            </div>
        </div>
        </div>
        <x-slot name="script_slot">
            
        <script src="{{ asset('asset/js/department.js') }}"></script>

        <script>
           
        </script>
    </x-slot>
</x-office-layout>
