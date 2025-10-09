<x-office-layout>
    <x-slot name="menu_active">
        {{ __('project') }}
    </x-slot>
    <x-slot name="head_slot">
        <link rel="stylesheet" href="{{ asset('asset/css/project.css') }}?v={{ time() }}">
        <link rel="stylesheet" href="{{ asset('asset/css/project-tree.css') }}?v={{ time() }}">
        <!-- Quill editor styles (only for Project page) -->
        <link href="https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.snow.css" rel="stylesheet">
    </x-slot>
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
    <div class="d-flex justify-content-between align-items-center mb-4">
        <div class="title-content">
            <h2>Project</h2>
        </div>
        <div class="d-flex justify-content-end">
            <button class="btn btn-contributor-custom me-2" data-bs-target="#projectTreeModal" data-bs-toggle="modal" title="Flowchart">
                <span class="material-symbols-outlined">flowchart</span>
            </button>
            <button class="btn btn-contributor-custom me-2" id="openContributionsModalBtn">
                <span class="material-symbols-outlined">grid_view</span>
            </button>
            <button class="btn-add-project" data-bs-toggle="modal" data-bs-target="#addProjectModal">
                Add Project
            </button>
        </div>
    </div>

    {{-- Hidden fields for Contributions modal JS --}}
    <input type="hidden" name="employee_id" value="{{ auth()->user()->employee->id ?? '' }}">
    <input type="hidden" id="contrib-endpoint"
        value="{{ route('employees.contributions', ['id' => auth()->user()->employee->id ?? 0]) }}">

    <div class="project-card-container">
        <div class="row">
            <div class="col-md-4 above-content">
                {{-- project chart --}}
                <div class="body-content chart-section p-4">
                    <div class="mobile-icon-project d-flex justify-content-end align-items-center mb-3">
                        <button class="btn btn-sm toggle-timeline timeline-toggle-btn" data-bs-toggle="modal"
                            data-bs-target="#timelineModal">
                            <span class="material-symbols-outlined"
                                style="font-size: 18px; color: #4C5060;">calendar_month</span>
                        </button>
                    </div>
                    <div class="chart-container">
                        <canvas id="projectChart"></canvas>
                    </div>
                    <div class="chart-labels d-flex justify-content-evenly align-items-center mt-3">
                        <div class="text-center">
                            <span style="font-weight: bold; color: #222;">0</span><br>
                            <span style="color: #828282; font-size: 12px;">Total</span>
                        </div>
                        <div class="text-center">
                            <span style="font-weight: bold; color: #4fc97a;">0</span><br>
                            <span style="color: #828282; font-size: 12px;">Complete</span>
                        </div>
                        <div class="text-center">
                            <span style="font-weight: bold; color: #5a9be6;">0</span><br>
                            <span style="color: #828282; font-size: 12px;">On Progress</span>
                        </div>
                        <div class="text-center">
                            <span style="font-weight: bold; color: #ff6b6b;">0</span><br>
                            <span style="color: #828282; font-size: 12px;">Late</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-8">
                {{-- timeline project --}}
                <div class="timeline-card">
                    <div class="body-content timeline-section p-4">
                        <div class="project-timeline-card">
                            <div class="timeline-card h-100">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <h5 id="timelineTitle" class="fw-semibold" style="font-size: 16px; color: #454545;">
                                        Aug week 1
                                    </h5>
                                    <div>
                                        <button class="btn btn-sm me-2" id="prevTimeline">
                                            <span class="material-symbols-outlined">chevron_left</span>
                                        </button>
                                        <button class="btn btn-sm me-2" id="nextTimeline">
                                            <span class="material-symbols-outlined">chevron_right</span>
                                        </button>
                                        <button data-bs-toggle="modal" data-bs-target="#timelineModal"
                                            class="btn btn-sm border-0 bg-transparent">
                                            <span id="timelineFullscreenIcon"
                                                class="material-symbols-outlined">fullscreen</span>
                                        </button>
                                    </div>
                                </div>

                                <!-- Timeline pakai table -->
                                <div class="timeline-wrapper">
                                    <table class="timeline-table">
                                        <thead>
                                            <tr id="timelineHeader"></tr>
                                        </thead>
                                        <tbody id="timelineRows"></tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {{-- Modal Timeline --}}
            <div class="modal fade timeline-modal-overlay" id="timelineModal" data-bs-backdrop="static"
                data-bs-keyboard="false" tabindex="-1" aria-labelledby="timelineModalTitle" aria-hidden="true">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content timeline-modal">

                        <!-- Header -->
                        <div class="modal-header d-flex justify-content-between align-items-center">
                            <h5 class="modal-title fw-normal mb-0" id="timelineModalTitle">Timeline</h5>
                            <div class="d-flex align-items-center gap-2">
                                <button class="btn btn-sm" id="prevTimelineModal">
                                    <span class="material-symbols-outlined">chevron_left</span>
                                </button>
                                <button class="btn btn-sm me-3" id="nextTimelineModal">
                                    <span class="material-symbols-outlined">chevron_right</span>
                                </button>
                                <button class="exit-fullscreen-btn" type="button" data-bs-dismiss="modal">
                                    <span class="material-symbols-outlined">fullscreen_exit</span>
                                </button>
                            </div>
                        </div>

                        <!-- Body -->
                        <div class="modal-body p-0">

                            <div class="timeline-wrapper">
                                <table class="timeline-table w-100">
                                    <thead>
                                        <tr id="timelineHeaderModal"></tr>
                                    </thead>
                                    <tbody id="timelineRowsModal"></tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bottom-project-content mt-5">
                <div class="d-flex justify-content-between title-filter-container">
                    <div class="d-flex justify-content-between title-filter-container align-items-center">
                        <h6 class="mb-4 all-projects-title">All Project</h6>
                    </div>
                    <div class="dropdown-center dropdown-filter-container">
                        <div class="btn-filter-container mb-3">
                            <div class="search-input-container position-relative me-3">
                                <span class="material-symbols-outlined search-icon">search</span>
                                <input class="form-control custom-form-filter ps-5" type="text"
                                    name="search_filter" id="search_filter">
                            </div>
                            <button class="btn btn-filter-custom me-3" type="button" data-label="Filter"
                                id="openProjectFilterBtn">
                                <span class="material-symbols-outlined icon">filter_list</span> <span
                                    class="btn-text-filter">Filter</span>
                            </button>
                            <button class="btn btn-export-custom me-3" type="button" data-label="Export"
                                id="openProjectFilterBtn">
                                <span class="material-symbols-outlined icon">file_export</span> <span
                                    class="btn-text-filter">Export</span>
                            </button>
                            <button class="btn btn-timeline-filter-custom" type="button" data-bs-toggle="modal"
                                data-bs-target="#timelineModal" data-label="TImeline" id="openProjectFilterBtn">
                                <span class="material-symbols-outlined icon">view_timeline</span> <span
                                    class="btn-text-filter">Timeline</span>
                            </button>
                        </div>
                        <div class="dropdown-menu dropdown-filter-menu" id="projectFilterDropdown">
                            <div class="dropdown-filter-body">
                                <div class="mb-2">
                                    <label for="filterProjectStatus" class="form-label label-custom-filter">Filter by
                                        Status</label>
                                    <select id="filterProjectStatus" class="form-select label-custom-filter">
                                        <option value="">All Status</option>
                                        <option value="ongoing">Not Started</option>
                                        <option value="pending">In Progress</option>
                                        <option value="completed">Completed</option>
                                        <option value="late">Late</option>
                                    </select>
                                </div>

                                <div class="mb-3">
                                    <label for="filterSortBy" class="form-label label-custom-filter">Sort By</label>
                                    <select id="filterSortBy" class="form-select label-custom-filter">
                                        <option value="title_asc">Title A-Z</option>
                                        <option value="title_desc">Title Z-A</option>
                                        <option value="date_desc">Newest ↑</option>
                                        <option value="date_asc">Oldest ↓</option>
                                    </select>
                                </div>
                            </div>
                            <div class="dropdown-filter-footer">
                                <button type="button" class="btn btn-submit-black"
                                    id="applyProjectFilterBtn">Apply</button>
                                <button type="button" class="btn btn-submit-black"
                                    id="resetProjectFilterBtn">Reset</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="all-cards-container">
                    {{-- Content Card --}}
                </div>
                <div class="loader">
                    <div class="box-loader">
                        <div class="text-center">
                            <div class="spinner-border text-secondary" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="d-flex justify-content-center mt-3">
                    <nav aria-label="...">
                        <ul class="pagination pagination-sm justify-content-center">
                            <li class="page-item active">
                                {{-- pagination rendered with js --}}
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>
        </div>
        <div class="timeline-overlay"></div>
    </div>

    <!-- Add Project Modal -->
    <div class="modal fade modal-custom" id="addProjectModal" data-bs-backdrop="static" data-bs-keyboard="false"
        tabindex="-1" aria-labelledby="addProjectModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content modal-content-custom">
                <div class="modal-loading-overlay d-none" id="addModalLoader">
                    <div class="loader-spinner"></div>
                </div>
                <div class="modal-header modal-header-custom">
                    <h5 class="modal-title modal-title-custom" id="addProjectModalLabel">Add Project</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <form id="addProjectForm" enctype="multipart/form-data">
                    <div class="modal-body modal-body-custom">
                        <div id="addProjectAlert" class="alert alert-success d-none" role="alert"
                            style="margin-bottom: 1rem; display:none;">
                            Project added successfully!
                        </div>
                        <div class="mb-3">
                            <div class="title-label-image">
                                <span>Upload image</span>
                            </div>
                            <label for="image" class="custom-image-upload position-relative" id="imageLabel"
                                style=" background-position: center center; background-repeat: no-repeat; background-size: 50%;  background-image: url('{!! asset('asset/img/background/add-image.png') !!}');">
                                <input type="file" class="input-image" id="image" name="image"
                                    accept="image/*" hidden>
                                <span class="image-clear-btn d-none" id="imageClearBtn"
                                    title="Remove image">&times;</span>
                            </label>
                            <div class="invalid-feedback">
                                Please select an image file.
                            </div>
                        </div>
                        <div class="mb-3 input-custom">
                            <label for="title" class="form-label label-custom">Title</label>
                            <input type="text" class="form-control input-text" id="title" name="title"
                                required>
                        </div>
                        <div class="mb-3 input-custom">
                            <label for="description" class="form-label label-custom">Description</label>
                            <div id="add_description_editor"
                                style="min-height:120px; background:#fff; border: none; border-radius:6px;">
                            </div>
                            <!-- Keep original textarea as canonical form field but hidden; will be synced with Quill HTML before submit -->
                            <textarea class="form-control input-text d-none" id="description" name="description" rows="3"
                                style="display:none;"></textarea>
                        </div>
                        @php
                            $__emp = auth()->user()->employee ?? null;
                            $__deptId = $__emp ? $__emp->department_id : '';
                            $__deptName =
                                $__emp && $__emp->department
                                    ? $__emp->department->name_department ?? ($__emp->department->name ?? '')
                                    : '';
                        @endphp

                        {{-- Department is fixed to the logged-in employee's department and hidden from selection --}}
                        <div class="mb-3 input-custom" style="display:none;">
                            <label for="department" class="form-label label-custom">Department</label>
                            <select class="form-select input-select" id="department" name="department">
                                <option value="{{ $__deptId }}" selected>{{ $__deptName }}</option>
                            </select>
                        </div>
                        <div class="mb-3 input-custom">
                            <label for="division" class="form-label label-custom">Division</label>
                            <select class="form-select input-select" id="division" name="division" required>
                                <option value="">Select Division</option>
                                <!-- Options to be populated dynamically -->
                            </select>
                        </div>
                        <div class="mb-3 input-custom">
                            <label class="form-label label-custom">Reference URLs</label>
                            <div id="project_reference_urls_container" class="d-flex flex-column gap-2">
                                <div class="input-group">
                                    <input type="url" class="form-control input-text" name="reference_urls[]"
                                        placeholder="https://example.com">
                                    <button type="button" class="btn btn-submit-black add-ref-url"
                                        aria-label="Add URL"><span class="material-symbols-outlined">add</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="mb-3 input-custom">
                            <label for="reference_file" class="form-label label-custom">Reference Files</label>
                            <input type="file" class="form-control input-text" id="reference_file"
                                name="reference_file[]" accept="image/*,.csv,.pdf,.doc,.docx,.xls,.xlsx,.zip"
                                multiple>
                            <div class="form-text">Multiple files supported.
                            </div>
                            <div id="reference_files_preview" class="mt-2"></div>
                        </div>
                        <div class="mb-3 d-flex justify-content-between">
                            <div style="width: 48%;" class="input-custom">
                                <label for="start_date" class="form-label label-custom">Start Date</label>
                                <input type="date" class="form-control input-text" id="start_date"
                                    name="start_date" required>
                            </div>
                            <div style="width: 48%;" class="input-custom">
                                <label for="due_date" class="form-label label-custom">Due Date</label>
                                <input type="date" class="form-control input-text" id="due_date" name="due_date"
                                    required>
                            </div>
                        </div>
                        <div class="mb-3 input-custom">
                            <label class="form-label label-custom">Part of Project</label>
                            <input type="text" class="form-control input-text" id="add_part_of_project_input"
                                autocomplete="off" placeholder="Search project...">
                            <div id="add_part_of_project_dropdown" class="dropdown-list mt-1"></div>
                            <div id="add_selected_project" class="mt-2"></div>
                            <input type="hidden" id="add_part_of_project" name="part_of_project" value="">
                        </div>
                        <div class="mb-3 input-custom">
                            <label for="co_author_input" class="form-label label-custom">Co-Author</label>
                            <input type="text" class="form-control input-text" id="co_author_input"
                                name="co_author_input" autocomplete="off" placeholder="Search employees...">
                            <div id="co_author_dropdown" class="dropdown-list mt-1 dropup">
                            </div>
                            <div id="selected_co_authors" class="mt-2 d-flex flex-wrap gap-2">
                                <!-- Selected co-authors will appear here -->
                            </div>
                            <input type="hidden" id="co_author" name="co_author" value="">
                        </div>
                        <div class="mb-3 input-custom">
                            <label for="contributor_input" class="form-label label-custom">Contributor</label>
                            <input type="text" class="form-control input-text" id="contributor_input"
                                name="contributor_input" autocomplete="off" placeholder="Search employees...">
                            <div id="contributor_dropdown" class="dropdown-list mt-1 dropup">
                            </div>
                            <div id="selected_contributors" class="mt-2 d-flex flex-wrap gap-2">
                                <!-- Selected contributors will appear here -->
                            </div>
                            <input type="hidden" id="contributors" name="contributors" value="">
                        </div>
                    </div>
                    <div class="modal-footer modal-footer-custom">
                        <button type="button" class="btn btn-custom-close" data-bs-dismiss="modal"
                            aria-label="Close">
                            Close
                        </button>
                        <button type="submit" class="btn-submit-black">
                            Submit
                        </button>
                    </div>
                </form>
            </div>
            <div class="alert-container mt-2" style="width: 100%;"></div>
        </div>
    </div>

    <!-- Edit Project Modal -->
    <div class="modal fade modal-custom" id="editProjectModal" data-bs-backdrop="static" data-bs-keyboard="false"
        tabindex="-1" aria-labelledby="editProjectModalLabel" aria-hidden="true"
        data-employee-id="{{ auth()->user()->employee->id ?? '' }}">
        <div class="modal-dialog">
            <div class="modal-content modal-content-custom">
                <div class="modal-loading-overlay d-none" id="editModalLoader">
                    <div class="loader-spinner"></div>
                </div>
                <div class="modal-header modal-header-custom">
                    <h5 class="modal-title modal-title-custom" id="editProjectModalLabel">Edit Project</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <form id="editProjectForm" enctype="multipart/form-data">
                    <input type="hidden" id="edit_project_id" name="id" value="">
                    <div class="modal-body modal-body-custom">
                        <div id="editProjectAlert" class="alert alert-success d-none" role="alert"
                            style="margin-bottom: 1rem; display:none;">
                            Project updated successfully!
                        </div>
                        <div class="mb-3 input-custom">
                            <div class="title-label-image">
                                <span>Upload image</span>
                            </div>
                            <label for="edit_image" class="custom-image-upload position-relative" id="editImageLabel"
                                style=" background-position: center center; background-repeat: no-repeat; background-size: 50%;  background-image: url('{!! asset('asset/img/background/add-image.png') !!}');">
                                <input type="file" class="input-image" id="edit_image" name="image"
                                    accept="image/*" hidden>
                                <span class="image-clear-btn d-none" id="editImageClearBtn"
                                    title="Remove image">&times;</span>
                            </label>
                            <div class="invalid-feedback">
                                Please select an image file.
                            </div>
                        </div>
                        <div class="mb-3 input-custom">
                            <label for="edit_title" class="form-label label-custom">Title</label>
                            <input type="text" class="form-control input-text" id="edit_title" name="title"
                                required>
                        </div>
                        <div class="mb-3 input-custom">
                            <label for="edit_description" class="form-label label-custom">Description</label>
                            <div id="edit_description_editor"
                                style="min-height:120px; background:#fff; border: none; border-radius:6px;">
                            </div>
                            <!-- Keep original textarea as canonical form field but hidden; will be synced with Quill HTML before submit -->
                            <textarea class="form-control input-text d-none" id="edit_description" name="description" rows="3"
                                style="display:none;"></textarea>
                        </div>
                        @php
                            $__emp = auth()->user()->employee ?? null;
                            $__deptId = $__emp ? $__emp->department_id : '';
                            $__deptName =
                                $__emp && $__emp->department
                                    ? $__emp->department->name_department ?? ($__emp->department->name ?? '')
                                    : '';
                        @endphp

                        {{-- Department is fixed to the logged-in employee's department and hidden from selection --}}
                        <div class="mb-3 input-custom" style="display:none;">
                            <label for="edit_department" class="form-label label-custom">Department</label>
                            <select class="form-select input-select" id="edit_department" name="department">
                                <option value="{{ $__deptId }}" selected>{{ $__deptName }}</option>
                            </select>
                        </div>
                        <div class="mb-3 input-custom">
                            <label for="edit_division" class="form-label label-custom">Division</label>
                            <select class="form-select input-select" id="edit_division" name="division" required>
                                <option value="">Select Division</option>
                                <!-- Options to be populated dynamically -->
                            </select>
                        </div>
                        <div class="mb-3 input-custom">
                            <label class="form-label label-custom">Reference URLs</label>
                            <div id="edit_project_reference_urls_container" class="d-flex flex-column gap-2">
                                <div class="input-group">
                                    <input type="url" class="form-control input-text" name="reference_urls[]"
                                        placeholder="https://example.com">
                                    <button type="button" class="btn btn-submit-black add-ref-url"
                                        aria-label="Add URL">
                                        <span class="material-symbols-outlined">add</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="mb-3 input-custom">
                            <label for="edit_reference_file" class="form-label label-custom">Reference Files</label>
                            <input type="file" class="form-control input-text" id="edit_reference_file"
                                name="reference_file[]" accept="image/*,.csv,.pdf,.doc,.docx,.xls,.xlsx,.zip"
                                multiple>
                            <div id="edit_reference_files_preview" class="mt-2"></div>
                            <div id="existing_reference_files" class="mt-2"></div>
                            <input type="hidden" id="existing_reference_files_input" name="existing_reference_files"
                                value="[]">
                        </div>
                        <div class="mb-3 input-custom d-flex justify-content-between">
                            <div style="width: 48%;">
                                <label for="edit_start_date" class="form-label label-custom">Start Date</label>
                                <input type="date" class="form-control input-text" id="edit_start_date"
                                    name="start_date" required>
                            </div>
                            <div style="width: 48%;">
                                <label for="edit_due_date" class="form-label label-custom">Due Date</label>
                                <input type="date" class="form-control input-text" id="edit_due_date"
                                    name="due_date" required>
                            </div>
                        </div>
                        <div class="mb-3 input-custom">
                            <label class="form-label label-custom">Part of Project</label>
                            <input type="text" class="form-control input-text" id="edit_part_of_project_input"
                                autocomplete="off" placeholder="Search project...">
                            <div id="edit_part_of_project_dropdown" class="dropdown-list mt-1"></div>
                            <div id="edit_selected_project" class="mt-2"></div>
                            <input type="hidden" id="edit_part_of_project" name="part_of_project" value="">
                        </div>

                        <div class="mb-3 input-custom">
                            <label for="edit_co_author_input" class="form-label label-custom">Co-Author</label>
                            <input type="text" class="form-control input-text" id="edit_co_author_input"
                                name="edit_co_author_input" autocomplete="off" placeholder="Search employees...">
                            <div id="edit_co_author_dropdown" class="dropdown-list mt-1 dropup">
                            </div>
                            <div id="edit_selected_co_authors" class="mt-2 d-flex flex-wrap gap-2">
                                <!-- Selected co-authors will appear here -->
                            </div>
                            <input type="hidden" id="edit_co_author" name="co_author" value="">
                        </div>
                        <div class="mb-3 input-custom">
                            <label for="edit_contributor_input" class="form-label label-custom">Contributor</label>
                            <input type="text" class="form-control input-text" id="edit_contributor_input"
                                name="edit_contributor_input" autocomplete="off" placeholder="Search employees...">
                            <div id="edit_contributor_dropdown" class="dropdown-list mt-1 dropup">
                            </div>
                            <div id="edit_selected_contributors" class="mt-2 d-flex flex-wrap gap-2">
                                <!-- Selected contributors will appear here -->
                            </div>
                            <input type="hidden" id="edit_contributors" name="contributors" value="">
                        </div>
                    </div>
                    <div class="modal-footer modal-footer-custom">
                        <button type="button" class="btn-custom-close" data-bs-dismiss="modal" aria-label="Close">
                            Close
                        </button>
                        <button type="submit" class="btn-submit-black">
                            Update
                        </button>
                    </div>
                </form>
            </div>
            <div class="alert-container mt-2" style="width: 100%;"></div>
        </div>
    </div>

    <div class="modal fade" id="projectDetailModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content modal-content-custom">
                <div class="modal-body modal-body-custom position-relative">
                    <div id="projectDetailContent"></div>
                </div>
                <div class="modal-footer modal-footer-custom">
                    <button type="button" class="btn btn-custom-close" data-bs-dismiss="modal">Close</button>
                    <button type="button" class="btn btn-submit-black" id="projectDetailDeleteBtn">Delete</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Project Reference Files Modal (exactly like Task modal) -->
    <div class="modal fade modal-custom" id="projectFilesModal" tabindex="-1"
        aria-labelledby="projectFilesModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content modal-content-custom">
                <div class="modal-header modal-header-custom d-flex align-items-center justify-content-between">
                    <div>
                        <h5 class="modal-title modal-title-custom" id="projectFilesModalLabel">Reference Files</h5>
                    </div>
                    <div>
                        <button type="button" class="btn-close ms-2" data-bs-dismiss="modal"
                            aria-label="Close"></button>
                    </div>
                </div>
                <hr>
                <div class="modal-body modal-body-custom">
                    <div id="projectReferenceFilesList" class="d-flex flex-column gap-2">
                        <!-- File links will be inserted here -->
                    </div>
                </div>
                <div class="modal-footer modal-footer-custom">
                    <button type="button" id="openAddProjectReferenceFilesBtn"
                        class="btn btn-sm btn-submit-black">Add Files</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Add Project Reference Files Modal -->
    <div class="modal fade" id="addProjectReferenceFilesModal" tabindex="-1"
        aria-labelledby="addProjectReferenceFilesModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content modal-content-custom">
                <div class="modal-header modal-header-custom">
                    <h5 class="modal-title modal-title-custom fs-5 fw-normal" id="addProjectReferenceFilesModalLabel">
                        Add Files</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body modal-body-custom">
                    <form id="addProjectReferenceFilesForm" enctype="multipart/form-data">
                        <input type="hidden" name="project_id" id="addRefProjectId" value="">
                        <div class="mb-3">
                            <label for="add_project_reference_files" class="form-label label-custom">Select
                                files</label>
                            <input type="file" class="form-control border-0 input-text"
                                id="add_project_reference_files" name="reference_files[]"
                                accept="image/*,.csv,.pdf,.doc,.docx,.xls,.xlsx,.zip" multiple>
                        </div>

                        <div id="add_project_reference_files_preview" class="mt-2"></div>
                    </form>
                </div>
                <div class="modal-footer modal-footer-custom">
                    <button type="button" class="btn btn-custom-close" data-bs-dismiss="modal">Close</button>
                    <button type="button" id="submitAddProjectReferenceFiles"
                        class="btn btn-submit-black">Upload</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Project Feedback Modal -->
    <div class="modal fade" id="projectFeedbackModal" tabindex="-1" aria-labelledby="projectFeedbackModalLabel"
        aria-hidden="true" data-project-id="{{ $projectId ?? '' }}"
        data-employee-id="{{ auth()->user()->employee->id ?? '' }}">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable feedback-modal-dialog">
            <div class="modal-content modal-content-custom">
                <div class="modal-header modal-header-custom d-flex align-items-center position-relative flex-nowrap">
                    <h5 class="modal-title feedback-modal-title flex-grow-1 text-truncate fs-5 fw-normal"
                        id="projectFeedbackModalLabel">Project Feedback</h5>
                    <button type="button" class="btn-close ms-3 flex-shrink-0" data-bs-dismiss="modal"
                        aria-label="Close"></button>
                </div>

                <div class="modal-body feedback-modal-body" id="projectFeedbackList">
                </div>
                <div class="modal-footer modal-footer-custom">
                    <button type="button" class="btn btn-submit-black" id="addFeedbackButton"
                        style="white-space: nowrap;">Add Feedback</button>
                </div>
            </div>
            <div class="alert-container mt-2" style="width: 100%;"></div>
        </div>
    </div>

    <!-- Delete Project Confirmation Modal (match Task modal exactly) -->
    <div class="modal fade" id="deleteProjectModal" tabindex="-1" aria-labelledby="deleteProjectModalLabel"
        aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered" style="max-width: 500px;">
            <div class="modal-content modal-content-custom">
                <div class="modal-body modal-body-custom">
                    <div id="deleteProjectContent"></div>
                </div>
                <div class="modal-footer modal-footer-custom">
                    <button type="button" class="btn btn-custom-close" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-submit-black" id="confirmDeleteProjectBtn">Delete</button>
                </div>
            </div>
        </div>
    </div>

    {{-- Contributions Modal --}}
    <div class="modal fade" id="contributionsModal" tabindex="-1" aria-labelledby="contributionsModalLabel"
        aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content rounded-4 border-0">
                <div class="modal-header border-0">
                    <h5 class="modal-title modal-title-custom" id="contributionsModalLabel">My Contributions</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body modal-body-custom">
                    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                        <div class="sub-title-contrib text-muted mt-2">Completed tasks per day (past year)</div>
                        <div class="contrib-legend">
                            <span>Less</span>
                            <div class="d-inline-flex align-items-center gap-1">
                                <span class="legend-swatch level-0"></span>
                                <span class="legend-swatch level-1"></span>
                                <span class="legend-swatch level-2"></span>
                                <span class="legend-swatch level-3"></span>
                                <span class="legend-swatch level-4"></span>
                            </div>
                            <span>More</span>
                        </div>
                    </div>
                    <div class="contrib-grid-container p-2">
                        <div class="contrib-layout">
                            <div class="contrib-weekdays" id="contribWeekdays"></div>
                            <div class="contrib-chart">
                                <div class="contrib-months" id="contribMonths"></div>
                                <div id="contributionsGrid" class="contrib-grid"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Task Modal -->
    <div class="modal fade" id="taskModal" tabindex="-1" aria-labelledby="taskModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content modal-content-custom">
                <div class="modal-header modal-header-custom mb-2 border-bottom">
                    <h5 class="modal-title modal-title-custom" id="taskModalLabel">Project Tasks</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body modal-body-custom mt-2">
                    <div id="taskListContainer">
                        <div class="text-center py-4">
                            <div class="spinner-border" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    {{-- Project Tree Modal --}}
    <div class="modal fade" id="projectTreeModal" tabindex="-1" aria-labelledby="projectTreeModal" aria-hidden="true">
        <div class="modal-dialog modal-fullscreen">
            <div class="modal-content modal-content-custom">
                <div class="modal-header modal-header-custom mb-2 border-bottom">
                    <h5 class="modal-title modal-title-custom" id="projectTreeModal">Project Tree</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body modal-body-custom mt-2">
                    <div class="task-tree-wrapper">
                        <div id="task-tree">

                        </div>
                    </div>

                    <div id="task-legend" class="d-flex justify-content-start gap-3">
                        <div class="legend-item d-flex align-items-start">
                            <span class="not-started" data-bs-toggle="tooltip" data-bs-title="Not Started"><span
                                    class="text-legend">Not Started</span></span>
                        </div>
                        <div class="legend-item d-flex align-items-start">
                            <span class="in-progress" data-bs-toggle="tooltip" data-bs-title="In Progress"><span
                                    class="text-legend">In Progress</span></span>
                        </div>
                        <div class="legend-item d-flex align-items-start">
                            <span class="late" data-bs-toggle="tooltip" data-bs-title="Late"><span
                                    class="text-legend">Late</span></span>
                        </div>
                        <div class="legend-item d-flex align-items-start">
                            <span class="complete" data-bs-toggle="tooltip" data-bs-title="Complete"><span
                                    class="text-legend">Complete</span></span>
                        </div>
                    </div>

                    <div id="task-template" class="d-none task-item">
                        <div class="task-box">
                            <div class="task-header">
                                <span class="task-name"></span>
                            </div>
                            <div class="task-date"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <x-slot name="script_slot">

        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/jsplumb@2.15.6/dist/js/jsplumb.min.js"></script>
        <script src="{{ asset('asset/js/project_tree_plumb.js') }}?v={{ time() }}"></script>
        <script src="{{ asset('asset/js/project.js') }}?v={{ time() }}"></script>
        <script src="{{ asset('asset/js/contributions_project.js') }}?v={{ time() }}"></script>
        <script src="{{ asset('asset/js/project_tree.js') }}?v={{ time() }}"></script>
        <script src="https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.js"></script>

        <script>
            (function() {
                // Defer initialization until DOM and project.js are ready
                document.addEventListener('DOMContentLoaded', function() {
                    // Guard: only run on pages that have the add/edit editors
                    if (!document.getElementById('add_description_editor') && !document.getElementById(
                            'edit_description_editor')) return;

                    // Create Quill instances
                    try {
                        window.__quillAdd = new Quill('#add_description_editor', {
                            modules: {
                                toolbar: '#add_description_toolbar',
                                clipboard: {
                                    matchVisual: false
                                }
                            },
                            theme: 'snow',
                            placeholder: 'Write description...'
                        });
                    } catch (e) {
                        console.warn('Quill init add failed', e);
                    }

                    try {
                        window.__quillEdit = new Quill('#edit_description_editor', {
                            modules: {
                                toolbar: '#edit_description_toolbar',
                                clipboard: {
                                    matchVisual: false
                                }
                            },
                            theme: 'snow',
                            placeholder: 'Write description...'
                        });
                    } catch (e) {
                        console.warn('Quill init edit failed', e);
                    }

                    // Harden: ensure pasted/dropped images are not inserted (defense-in-depth)
                    try {
                        var Delta = Quill.import && Quill.import('delta');

                        if (window.__quillAdd && window.__quillAdd.clipboard && typeof window.__quillAdd.clipboard
                            .addMatcher === 'function') {
                            window.__quillAdd.clipboard.addMatcher('IMG', function(node, delta) {
                                try {
                                    return new Delta();
                                } catch (_) {
                                    return delta;
                                }
                            });
                        }
                        if (window.__quillAdd && typeof window.__quillAdd.on === 'function') {
                            window.__quillAdd.on('text-change', function() {
                                try {
                                    var imgs = window.__quillAdd.root.querySelectorAll('img');
                                    imgs.forEach(function(i) {
                                        i.remove();
                                    });
                                } catch (_) {}
                            });
                        }

                        if (window.__quillEdit && window.__quillEdit.clipboard && typeof window.__quillEdit
                            .clipboard.addMatcher === 'function') {
                            window.__quillEdit.clipboard.addMatcher('IMG', function(node, delta) {
                                try {
                                    return new Delta();
                                } catch (_) {
                                    return delta;
                                }
                            });
                        }
                        if (window.__quillEdit && typeof window.__quillEdit.on === 'function') {
                            window.__quillEdit.on('text-change', function() {
                                try {
                                    var imgs = window.__quillEdit.root.querySelectorAll('img');
                                    imgs.forEach(function(i) {
                                        i.remove();
                                    });
                                } catch (_) {}
                            });
                        }
                    } catch (_) {}

                    // Helper: install capture-phase listeners on the editor container to block image drag/drop and paste
                    function preventImageDropAndPaste(quill, editorSelector) {
                        try {
                            var editor = document.querySelector(editorSelector);
                            if (!editor || !quill) return;

                            // Use capture-phase listeners to intercept before Quill handlers run
                            editor.addEventListener('dragover', function(ev) {
                                try {
                                    var dt = ev.dataTransfer || ev.clipboardData;
                                    var types = dt && dt.types ? Array.from(dt.types || []) : [];
                                    if (types.indexOf && types.indexOf('Files') !== -1) {
                                        ev.preventDefault();
                                        ev.stopImmediatePropagation();
                                        return;
                                    }
                                } catch (_) {}
                            }, true);

                            editor.addEventListener('drop', function(ev) {
                                try {
                                    var dt = ev.dataTransfer;
                                    if (dt && dt.files && dt.files.length) {
                                        for (var i = 0; i < dt.files.length; i++) {
                                            var f = dt.files[i];
                                            if (f && f.type && f.type.indexOf('image') === 0) {
                                                ev.preventDefault();
                                                ev.stopImmediatePropagation();
                                                return;
                                            }
                                        }
                                    }
                                } catch (_) {}
                            }, true);

                            editor.addEventListener('paste', function(ev) {
                                try {
                                    var cb = ev.clipboardData || window.clipboardData;
                                    if (!cb) return;
                                    // If clipboard contains image items, block immediately
                                    if (cb.items && cb.items.length) {
                                        for (var j = 0; j < cb.items.length; j++) {
                                            var it = cb.items[j];
                                            if (it && it.type && it.type.indexOf && it.type.indexOf(
                                                    'image') !== -1) {
                                                ev.preventDefault();
                                                ev.stopImmediatePropagation();
                                                return;
                                            }
                                        }
                                    }
                                    // If HTML contains <img>, block
                                    try {
                                        var html = cb.getData && cb.getData('text/html');
                                        if (html && /<img\s+/i.test(html)) {
                                            ev.preventDefault();
                                            ev.stopImmediatePropagation();
                                            return;
                                        }
                                    } catch (_) {}
                                } catch (_) {}
                            }, true);
                        } catch (_) {}
                    }

                    function syncQuillToTextarea(quill, textareaId) {
                        try {
                            const ta = document.getElementById(textareaId);
                            if (!ta) return;
                            // Use innerHTML of editor root as HTML value
                            ta.value = (quill && quill.root) ? quill.root.innerHTML.trim() : '';
                        } catch (e) {
                            console.warn('syncQuillToTextarea error', e);
                        }
                    }

                    // On add form submit, sync content before FormData is built in project.js
                    const addForm = document.getElementById('addProjectForm');
                    if (addForm) {
                        addForm.addEventListener('submit', function(e) {
                            if (window.__quillAdd) syncQuillToTextarea(window.__quillAdd, 'description');
                            // Basic client-side validation: ensure description contains text
                            try {
                                const ta = document.getElementById('description');
                                const html = ta ? ta.value || '' : '';
                                const tmp = document.createElement('div');
                                tmp.innerHTML = html;
                                const text = (tmp.textContent || tmp.innerText || '').trim();
                                if (!text) {
                                    // prevent submission and notify user
                                    e.preventDefault();
                                    e.stopImmediatePropagation();
                                    try {
                                        if (typeof showFloatingAlert === 'function') {
                                            showFloatingAlert('Deskripsi tidak boleh kosong.', 'warning',
                                                3500);
                                        } else {
                                            alert('Deskripsi tidak boleh kosong.');
                                        }
                                    } catch (_) {}
                                    try {
                                        window.__quillAdd && window.__quillAdd.focus();
                                    } catch (_) {}
                                    return false;
                                }
                            } catch (e) {
                                /* ignore validation errors */
                            }
                        }, true); // capture so it runs before other listeners
                    }

                    // On edit form submit, sync edit quill
                    const editForm = document.getElementById('editProjectForm');
                    if (editForm) {
                        editForm.addEventListener('submit', function(e) {
                            if (window.__quillEdit) syncQuillToTextarea(window.__quillEdit,
                                'edit_description');
                            // Basic client-side validation: ensure description contains text
                            try {
                                const ta = document.getElementById('edit_description');
                                const html = ta ? ta.value || '' : '';
                                const tmp = document.createElement('div');
                                tmp.innerHTML = html;
                                const text = (tmp.textContent || tmp.innerText || '').trim();
                                if (!text) {
                                    e.preventDefault();
                                    e.stopImmediatePropagation();
                                    try {
                                        if (typeof showFloatingAlert === 'function') {
                                            showFloatingAlert('Deskripsi tidak boleh kosong.', 'warning',
                                                3500);
                                        } else {
                                            alert('Deskripsi tidak boleh kosong.');
                                        }
                                    } catch (_) {}
                                    try {
                                        window.__quillEdit && window.__quillEdit.focus();
                                    } catch (_) {}
                                    return false;
                                }
                            } catch (e) {
                                /* ignore validation errors */
                            }
                        }, true);
                    }

                    // When edit modal is shown via project.js, project.js sets #edit_description textarea value.
                    // Observe changes on that textarea and mirror into Quill so both stay in sync.
                    const editTextarea = document.getElementById('edit_description');
                    if (editTextarea && window.__quillEdit) {
                        // Use MutationObserver on value attribute by intercepting property set via polling fallback
                        const origSet = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')
                            ?.set;
                        if (origSet) {
                            // When external code sets textarea.value, also update Quill
                            const ta = editTextarea;
                            const observer = new MutationObserver(function() {
                                try {
                                    const html = ta.value || '';
                                    // set only if different
                                    if ((window.__quillEdit && window.__quillEdit.root && (window
                                            .__quillEdit.root.innerHTML || '')) !== html) {
                                        window.__quillEdit.root.innerHTML = html;
                                    }
                                } catch (_) {}
                            });
                            observer.observe(ta, {
                                attributes: true,
                                attributeFilter: ['value']
                            });
                            // Also patch programmatic assignments via polling (safe fallback)
                            let lastVal = ta.value;
                            setInterval(function() {
                                try {
                                    if (ta.value !== lastVal) {
                                        lastVal = ta.value;
                                        const html = ta.value || '';
                                        if (window.__quillEdit && window.__quillEdit.root) window
                                            .__quillEdit.root.innerHTML = html;
                                    }
                                } catch (_) {}
                            }, 300);
                        }
                    }

                    // Also when the edit modal is hidden, clear transient file lists and keep the editor content in sync with hidden textarea
                    const editModalEl = document.getElementById('editProjectModal');
                    if (editModalEl && window.__quillEdit) {
                        editModalEl.addEventListener('hidden.bs.modal', function() {
                            try {
                                window.__quillEdit.root.innerHTML = '';
                            } catch (_) {}
                            try {
                                document.getElementById('edit_description').value = '';
                            } catch (_) {}
                        });
                    }

                    // When the add modal is hidden, reset the add editor
                    const addModalEl = document.getElementById('addProjectModal');
                    if (addModalEl && window.__quillAdd) {
                        addModalEl.addEventListener('hidden.bs.modal', function() {
                            try {
                                window.__quillAdd.root.innerHTML = '';
                            } catch (_) {}
                            try {
                                document.getElementById('description').value = '';
                            } catch (_) {}
                            // Also reset selected files array if any (projectSelectedFiles)
                            try {
                                projectSelectedFiles = [];
                                displayProjectSelectedFiles();
                            } catch (_) {}
                        });
                        try {
                            preventImageDropAndPaste(window.__quillAdd, '#add_description_editor');
                        } catch (_) {}
                    }
                    try {
                        preventImageDropAndPaste(window.__quillEdit, '#edit_description_editor');
                    } catch (_) {}
                });
            })();
        </script>
        <script>
            document.addEventListener('DOMContentLoaded', function() {
                window.__projectUnread = {};
                fetch("{{ route('project-feedbacks.unread-counts') }}")
                    .then(res => res.json())
                    .then(json => {
                        window.__projectUnread = (json && json.data) ? json.data : {};
                        if (typeof refreshAllProjectUnreadBadges === 'function') {
                            refreshAllProjectUnreadBadges();
                        } else {
                            console.warn('refreshAllProjectUnreadBadges belum terdefinisi');
                        }
                        if (typeof refreshAllProjectLatestFeedbackSnippets === 'function') {
                            refreshAllProjectLatestFeedbackSnippets();
                        }
                    })
                    .catch(err => {
                        console.error('Fetch unread counts error:', err);
                        window.__projectUnread = {};
                        try {
                            refreshAllProjectUnreadBadges();
                        } catch (_) {}
                    });
            });
        </script>


        <script></script>
    </x-slot>
</x-office-layout>
