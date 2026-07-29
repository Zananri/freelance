<x-office-layout>
    <x-slot name="menu_active">
        {{ 'master' }}
    </x-slot>
    <x-slot name="head_slot">
        <link href="{{ asset('asset/css/division.css') }}" rel="stylesheet">
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
        <h2 class="m-0">Site</h2>
    </div>

    <div class="body-content scrollable-container rounded-4 px-3 py-3" style="margin-top: 20px; width: 100%;">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h5 class="mb-0 table-title">List Site</h5>

            <div class="d-flex gap-1" style="margin-left: -5px;">
                <div class="input-group search-input-container">
                    <input type="text" id="searchInput" class="form-control input-text" placeholder="Search"/>
                </div>
                <div class="dropdown dropdown-filter-container">
                    <button class="btn btn-icon-toggle dropdown-toggle"
                        type="button" id="filterDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                        <span class="material-symbols-outlined icon">filter_list</span><span class="btn-text">Filter</span>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-filter p-2" aria-labelledby="filterDropdown">
                        <li class="mb-3">
                            <select class="form-select form-select-sm" id="filterTypeSelect"
                                aria-label="Select filter type">
                                <option value="" disabled selected>{{ __('general.select_filter_option') }}</option>
                                <option value="status">{{ __('general.filter_by_status') }}</option>
                                <option value="department">{{ __('general.filter_by_partner') }}</option>
                            </select>
                        </li>
                        <li id="statusFilterOptions" class="d-none">
                            <a class="dropdown-item filter-option" href="#" data-status="ALL">{{ __('general.all') }}</a>
                            <a class="dropdown-item filter-option" href="#" data-status="ACTIVE">{{ __('general.active') }}</a>
                            <a class="dropdown-item filter-option" href="#" data-status="INACTIVE">{{ __('general.inactive') }}</a>
                        </li>
                        <li id="departmentFilterOptions" class="d-none">
                            <span class="dropdown-item text-muted">{{ __('general.loading_partners') }}</span>
                        </li>
                    </ul>
                </div>


                <button id="btnAddData" class="btn btn-icon-toggle btn-add-custom"
                    data-bs-toggle="modal" data-bs-target="#addDivisionModal">
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
                            <th scope="col">Site Name</th>
                            <th scope="col">Partner Name</th>
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

    <!-- Add Division Modal -->
    <div class="modal fade" id="addDivisionModal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1"
        aria-labelledby="addDivisionModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content modal-content-custom">
                <div class="modal-loading-overlay d-none" id="addModalLoader">
                    <div class="loader-spinner"></div>
                </div>
                <div class="modal-header modal-header-custom">
                    <h5 class="modal-title modal-title-custom" id="addDivisionModalLabel">Add Site</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <form id="addDivisionForm" class="form-custom needs-validation" novalidate
                    enctype="multipart/form-data">
                    <div class="modal-body modal-body-custom">
                        <div class="mb-3 mt-4 custom-input">
                            <label for="department_id" class="form-label label-custom">Partner</label>
                            <select class="form-select input-select" id="department_id" name="department_id"
                                required>
                                <option value="" disabled selected>{{ __('general.select_partner') }}</option>
                            </select>
                            <div class="invalid-feedback">
                                Please select a partner.
                            </div>
                        </div>
                        <div class="mb-3 custom-input">
                            <label for="name_division" class="form-label label-custom">Site Name</label>
                            <input type="text" class="form-control input-text" id="name_division"
                                name="name_division" placeholder="Input Site Name" required>
                            <div class="invalid-feedback">
                                Please enter the site name.
                            </div>
                        </div>
                        <div class="mb-3 custom-input">
                            <label for="status" class="form-label label-custom">Status</label>
                            <select class="form-select input-select" id="status" name="status" required>
                                <option value="" disabled selected>{{ __('general.select_status') }}</option>
                                <option value="ACTIVE">{{ __('general.active') }}</option>
                                <option value="INACTIVE">{{ __('general.inactive') }}</option>
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
                                style="background-position: center center; background-repeat: no-repeat; background-size: 50%; background-image: url('{!! asset('asset/img/background/add-image.png') !!}'); opacity: 0.5;">
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
                        <button type="submit" class="btn-submit-black btn-submit-black">Submit</button>
                    </div>
                </form>
            </div>
            <div class="alert-container mt-2" style="width: 100%;"></div>
        </div>
    </div>

    <!-- Edit Division Modal -->
    <div class="modal fade" id="editDivisionModal" data-bs-backdrop="static" data-bs-keyboard="false"
        tabindex="-1" aria-labelledby="editDivisionModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content modal-content-custom">
                <div class="modal-loading-overlay d-none" id="editModalLoader">
                    <div class="loader-spinner"></div>
                </div>
                <div class="modal-header modal-header-custom">
                    <h5 class="modal-title modal-title-custom" id="editDivisionModalLabel">Edit Site</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <form id="editDivisionForm" class="form-custom needs-validation" novalidate
                    enctype="multipart/form-data">
                    <div class="modal-body modal-body-custom">
                        <input type="hidden" id="edit_division_id" name="division_id">
                        <div class="mb-3 mt-4 custom-input">
                            <label for="edit_department_id" class="form-label label-custom">Partner</label>
                            <select class="form-select input-select" id="edit_department_id" name="department_id"
                                required>
                                <option value="" disabled selected>{{ __('general.select_partner') }}</option>
                            </select>
                            <div class="invalid-feedback">
                                Please select a partner.
                            </div>
                        </div>
                        <div class="mb-3 custom-input">
                            <label for="edit_name_division" class="form-label label-custom">Site Name</label>
                            <input type="text" class="form-control input-text" id="edit_name_division"
                                name="name_division" placeholder="Input Site Name" required>
                            <div class="invalid-feedback">
                                Please enter the site name.
                            </div>
                        </div>
                        <div class="mb-3 custom-input">
                            <label for="edit_status" class="form-label label-custom">Status</label>
                            <select class="form-select input-select" id="edit_status" name="status" required>
                                <option value="ACTIVE">{{ __('general.active') }}</option>
                                <option value="INACTIVE">{{ __('general.inactive') }}</option>
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
                        <button type="submit" class="btn-submit-black btn-submit-custom">Update</button>
                    </div>
                </form>
            </div>
            <div class="alert-container mt-2" style="width: 100%;"></div>
        </div>
    </div>

    <!-- Delete Division Modal -->
    <div class="modal fade" id="deleteDivisionModal" data-bs-backdrop="static" data-bs-keyboard="false"
        tabindex="-1" aria-labelledby="deleteDivisionModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content modal-content-custom">
                <div class="modal-loading-overlay d-none" id="deleteModalLoader">
                    <div class="loader-spinner"></div>
                </div>
                <div class="modal-header modal-header-custom">
                    <h5 class="modal-title modal-title-custom mb-3" id="deleteDivisionModalLabel">Delete {{ __('general.site') }}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <form id="deleteDivisionForm" class="form-custom">
                    <div class="modal-body modal-body-custom">

                        <div class="mb-3 mt-4 custom-input">
                            <label for="delete_department_name" class="form-label label-custom">Department
                                Name</label>
                            <input type="text" class="form-control input-text" id="delete_department_name"
                                name="department_name" readonly disabled />
                        </div>
                        <div class="mb-3 custom-input">
                            <label for="delete_name_division" class="form-label label-custom">{{ __('general.site') }}</label>
                            <input type="text" class="form-control input-text" id="delete_name_division"
                                name="name_division" readonly disabled />
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

        <script src="{{ asset('asset/js/division.js') }}"></script>

        <script></script>
    </x-slot>
</x-office-layout>
