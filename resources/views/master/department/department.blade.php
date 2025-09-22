<x-office-layout>
    <x-slot name="menu_active">
        {{ __('master') }}
    </x-slot>
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

            <div class="d-flex gap-1">
                <div class="input-group search-input-container">
                    <input type="text" id="searchInput" class="form-control input-text border-0" placeholder="Search" style="height: 40px;" />
                </div>
                <div class="dropdown dropdown-filter-container">
                    <button class="btn btn-icon-toggle dropdown-toggle border-0"
                        type="button" id="filterDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                        <span class="material-symbols-outlined icon">filter_list</span> <span class="btn-text">Filter</span>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-filter" aria-labelledby="filterDropdown" style="min-width: 150px;">
                        <li><a class="dropdown-item filter-option active" href="#" data-status="ALL">All</a></li>
                        <li><a class="dropdown-item filter-option" href="#" data-status="ACTIVE">Active</a></li>
                        <li><a class="dropdown-item filter-option" href="#" data-status="INACTIVE">Inactive</a>
                        </li>
                    </ul>
                </div>

                <button id="btnAddData" class="btn btn-icon-toggle btn-add-container border-0"
                    data-bs-toggle="modal" data-bs-target="#addDepartmentModal">
                    <span class="material-symbols-outlined icon">add</span><span class="btn-text">Add Data</span>
                </button>
            </div>
        </div>

        <div class="table-responsive">
            <div class="table-scroll-wrapper">
                <table class="table table-borderless align-middle table-transparent">
                    <thead>
                        <tr>
                            <th scope="col"></th>
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
    <div class="modal fade" id="addDepartmentModal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1"
        aria-labelledby="addDepartmentModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content modal-content-custom">
                <div class="modal-loading-overlay d-none" id="addModalLoader">
                    <div class="loader-spinner"></div>
                </div>
                <div class="modal-header modal-header-custom">
                    <h5 class="modal-title modal-title-custom" id="addDepartmentModalLabel">Add Department</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <form id="addDepartmentForm" class="form-custom needs-validation" novalidate
                    enctype="multipart/form-data">
                    <div class="modal-body modal-body-custom">
                        <div class="mb-3 mt-4 custom-input">
                            <label for="name_department" class="form-label label-custom">Name</label>
                            <input type="text" class="form-control input-text" id="name_department"
                                name="name_department" placeholder="Input Department Name" required>
                            <div class="invalid-feedback">
                                Please enter the department name.
                            </div>
                        </div>
                        <div class="mb-3 custom-input">
                            <label for="status" class="form-label label-custom">Status</label>
                            <select class="form-select input-select" id="status" name="status" required>
                                <option value="" disabled selected>Select Status</option>
                                <option value="ACTIVE">Active</option>
                                <option value="INACTIVE">Inactive</option>
                            </select>
                            <div class="invalid-feedback">
                                Please select a status.
                            </div>
                        </div>
                        <div class="mb-3 custom-input">
                            <label for="description" class="form-label label-custom">Description</label>
                            <textarea class="form-control input-text" id="description" name="description" placeholder="Input Description"></textarea>
                            <div class="invalid-feedback">
                                Please enter a description.
                            </div>
                        </div>
                        <div class="mb-3">
                            <div class="title-label-image">
                                <span>Upload image</span>
                            </div>
                            <label for="image" class="custom-image-upload position-relative" id="imageLabel"
                                style=" background-position: center center; background-repeat: no-repeat; background-size: 50%;  background-image: url('{!! asset('asset/img/background/add-image.png') !!}');">
                                <input type="file" class="input-image" id="image" name="image"
                                    accept="image/*">
                                <span class="image-clear-btn d-none" id="imageClearBtn"
                                    title="Remove image">&times;</span>
                            </label>
                            <div class="invalid-feedback">
                                Please select an image file.
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer modal-footer-custom">
                        <button type="submit" class="btn-submit-black">Submit</button>
                    </div>
                </form>
            </div>
            <div class="alert-container mt-2" style="width: 100%;"></div>
        </div>
    </div>

    <!-- Edit Department Modal -->
    <div class="modal fade" id="editDepartmentModal" data-bs-backdrop="static" data-bs-keyboard="false"
        tabindex="-1" aria-labelledby="editDepartmentModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content modal-content-custom">
                <div class="modal-loading-overlay d-none" id="editModalLoader">
                    <div class="loader-spinner"></div>
                </div>
                <div class="modal-header modal-header-custom">
                    <h5 class="modal-title modal-title-custom" id="editDepartmentModalLabel">Edit Department</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <form id="editDepartmentForm" class="form-custom needs-validation" novalidate
                    enctype="multipart/form-data">
                    <div class="modal-body modal-body-custom">
                        <div class="mb-3 mt-4 custom-input">
                            <label for="edit_name_department" class="form-label label-custom">Name</label>
                            <input type="text" class="form-control input-text" id="edit_name_department"
                                name="name_department" placeholder="Input Department Name" required>
                            <div class="invalid-feedback">
                                Please enter the department name.
                            </div>
                        </div>
                        <div class="mb-3 custom-input">
                            <label for="edit_status" class="form-label label-custom">Status</label>
                            <select class="form-select input-select" id="edit_status" name="status" required>
                                <option value="ACTIVE">Active</option>
                                <option value="INACTIVE">Inactive</option>
                            </select>
                            <div class="invalid-feedback">
                                Please select a status.
                            </div>
                        </div>
                        <div class="mb-3 custom-input">
                            <label for="edit_description" class="form-label label-custom">Description</label>
                            <textarea class="form-control input-text" id="edit_description" name="description" placeholder="Input Description"></textarea>
                            <div class="invalid-feedback">
                                Please enter a description.
                            </div>
                        </div>
                        <div class="mb-3">
                            <div class="title-label-image">
                                <span>Upload image</span>
                            </div>
                            <label for="edit_image" class="custom-image-upload position-relative" id="editImageLabel"
                                style="background-image: url('{!! asset('asset/img/background/add-image.png') !!}');">
                                <input type="file" class="input-image" id="edit_image" name="image"
                                    accept="image/*">
                                <span class="image-clear-btn d-none" id="editImageClearBtn"
                                    title="Remove image">&times;</span>
                            </label>
                            <div class="invalid-feedback">
                                Please select an image file.
                            </div>
                            <div id="edit_image_preview" class="mt-2" style="display:none;">
                                <img src="" alt="Current Image"
                                    style="max-width: 100%; max-height: 150px; border-radius: 4px;" />
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer modal-footer-custom">
                        <button type="submit" class="btn-submit-black">Update</button>
                    </div>
                </form>
            </div>
            <div class="alert-container mt-2" style="width: 100%;"></div>
        </div>
    </div>

    <!-- Delete Department Modal -->
    <div class="modal fade" id="deleteDepartmentModal" data-bs-backdrop="static" data-bs-keyboard="false"
        tabindex="-1" aria-labelledby="deleteDepartmentModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content modal-content-custom">
                <div class="modal-loading-overlay d-none" id="deleteModalLoader">
                    <div class="loader-spinner"></div>
                </div>
                <div class="modal-header modal-header-custom">
                    <h5 class="modal-title modal-title-custom mb-3" id="deleteDepartmentModalLabel">Delete Department
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <form id="deleteDepartmentForm" class="form-custom">
                    <div class="modal-body modal-body-custom">
                        <div class="mb-3 mt-4 custom-input">
                            <label for="delete_name_department" class="form-label label-custom">Name</label>
                            <input type="text" class="form-control input-text" id="delete_name_department"
                                name="name_department" readonly disabled />
                        </div>
                        <div class="mb-3 custom-input">
                            <label for="delete_status" class="form-label label-custom">Status</label>
                            <input type="text" class="form-control input-text" id="delete_status" name="status"
                                readonly disabled />
                        </div>
                        <div class="mb-3 custom-input">
                            <label for="delete_description" class="form-label label-custom">Description</label>
                            <textarea class="form-control input-text" id="delete_description" name="description" rows="3" readonly
                                disabled></textarea>
                        </div>
                        <span>Image</span>
                        <div class="mb-3">
                            <label for="delete_image" class="custom-image-upload position-relative"
                                id="deleteImageLabel"></label>
                        </div>
                        <div class="mt-3 text-center">
                            <p class="mb-3" style="font-weight: 300; font-size: 16px;">Are you sure you want to
                                delete this data?</p>
                        </div>
                    </div>
                    <div class="modal-footer modal-footer-custom">
                        <button type="submit" class="btn btn-submit-black">Delete</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
    <x-slot name="script_slot">

        <script src="{{ asset('asset/js/department.js') }}"></script>

        <script></script>
    </x-slot>
</x-office-layout>
