<x-office-layout>
    <x-slot name="menu_active">
        {{ __('project') }}
    </x-slot>
    <x-slot name="head_slot">
        <link rel="stylesheet" href="{{ asset('asset/css/project.css') }}">
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
        <button class="btn-add-project" data-bs-toggle="modal" data-bs-target="#addProjectModal">
            Add Project
        </button>
    </div>

    <div class="project-card-container">
        <div class="row">
            <div class="col-md-4">
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
                                        <button class="btn btn-sm" id="nextTimeline">
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
                            <button class="btn btn-icon-toggle btn-filter-custom me-3" type="button"
                                data-label="Filter" id="openProjectFilterBtn">
                                <span class="material-symbols-outlined icon">filter_list</span> <span
                                    class="btn-text-filter">Filter</span>
                            </button>
                            <button class="btn btn-icon-toggle btn-export-custom me-3" type="button"
                                data-label="Export" id="openProjectFilterBtn">
                                <span class="material-symbols-outlined icon">file_export</span> <span
                                    class="btn-text-filter">Export</span>
                            </button>
                            <button class="btn btn-icon-toggle btn-timeline-filter-custom" type="button"
                                data-bs-toggle="modal" data-bs-target="#timelineModal" data-label="TImeline"
                                id="openProjectFilterBtn">
                                <span class="material-symbols-outlined icon">view_timeline</span> <span
                                    class="btn-text-filter">Timeline</span>
                            </button>
                        </div>
                        <div class="dropdown-menu dropdown-filter-menu" id="projectFilterDropdown"
                            style="display: none;">
                            <div class="dropdown-filter-body">
                                <div class="mb-3">
                                    <label for="filterProjectStatus" class="form-label">Filter by Status</label>
                                    <select id="filterProjectStatus" class="form-select">
                                        <option value="">All Status</option>
                                        <option value="ongoing">Not Started</option>
                                        <option value="pending">In Progress</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>
                            </div>
                            <div class="dropdown-filter-footer">
                                <button type="button" class="btn btn-submit-black"
                                    id="resetProjectFilterBtn">Reset</button>
                                <button type="button" class="btn btn-submit-black"
                                    id="applyProjectFilterBtn">Filter</button>
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
                    <div id="project-pagination" class="pagination-pill d-none align-items-center">
                        <button id="prevPageBtn" class="btn-nav" disabled>
                            <span class="material-symbols-outlined">chevron_left</span>
                        </button>

                        <span id="paginationInfo" class="pagination-info">1 OF 1</span>

                        <button id="nextPageBtn" class="btn-nav">
                            <span class="material-symbols-outlined">chevron_right</span>
                        </button>
                    </div>
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
                            <textarea class="form-control input-text" id="description" name="description" rows="3"></textarea>
                        </div>
                        <div class="mb-3 input-custom">
                            <label for="department" class="form-label label-custom">Department</label>
                            <select class="form-select input-select" id="department" name="department" required>
                                <option value="">Select Department</option>
                                <!-- Options to be populated dynamically -->
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
                                <div class="d-flex gap-2 align-items-center">
                                    <input type="url" class="form-control input-text" name="reference_urls[]"
                                        placeholder="https://example.com">
                                    <button type="button" class="btn btn-submit-black add-ref-url"
                                        aria-label="Add URL"><span
                                            class="material-symbols-outlined">add</span></button>
                                </div>
                            </div>
                        </div>
                        <div class="mb-3 input-custom">
                            <label for="reference_file" class="form-label label-custom">Reference Files</label>
                            <input type="file" class="form-control input-text" id="reference_file"
                                name="reference_file[]" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip" multiple>
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
                            <label for="part_of_project" class="form-label label-custom">Part of Project</label>
                            <select class="form-select input-select" id="part_of_project" name="part_of_project">
                                <option value="">Select Project</option>
                                <!-- Options to be populated dynamically -->
                            </select>
                        </div>
                        <div class="mb-3 input-custom">
                            <label for="co_author_input" class="form-label label-custom">Co-Author</label>
                            <input type="text" class="form-control input-text" id="co_author_input"
                                name="co_author_input" autocomplete="off" placeholder="Search employees...">
                            <div id="co_author_dropdown" class="dropdown-list mt-1"
                                style="max-height: 200px; overflow-y: auto; border: 1px solid #ccc; border-radius: 4px; display: none; background: white; position: absolute; z-index: 1000; width: 100%;">
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
                            <div id="contributor_dropdown" class="dropdown-list mt-1"
                                style="max-height: 200px; overflow-y: auto; border: 1px solid #ccc; border-radius: 4px; display: none; background: white; position: absolute; z-index: 1000; width: 100%;">
                            </div>
                            <div id="selected_contributors" class="mt-2 d-flex flex-wrap gap-2">
                                <!-- Selected contributors will appear here -->
                            </div>
                            <input type="hidden" id="contributors" name="contributors" value="">
                        </div>
                    </div>
                    <div class="modal-footer modal-footer-custom">
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
                            <textarea class="form-control input-text" id="edit_description" name="description" rows="3"></textarea>
                        </div>
                        <div class="mb-3 input-custom">
                            <label for="edit_department" class="form-label label-custom">Department</label>
                            <select class="form-select input-select" id="edit_department" name="department" required>
                                <option value="">Select Department</option>
                                <!-- Options to be populated dynamically -->
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
                                <div class="d-flex gap-2 align-items-center">
                                    <input type="url" class="form-control input-text" name="reference_urls[]"
                                        placeholder="https://example.com">
                                    <button type="button" class="btn btn-submit-black add-ref-url"
                                        aria-label="Add URL"><span
                                            class="material-symbols-outlined">add</span></button>
                                </div>
                            </div>
                        </div>
                        <div class="mb-3 input-custom">
                            <label for="edit_reference_file" class="form-label label-custom">Reference Files</label>
                            <input type="file" class="form-control input-text" id="edit_reference_file"
                                name="reference_file[]" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip" multiple>
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
                            <label for="edit_part_of_project" class="form-label label-custom">Part of Project</label>
                            <select class="form-select input-select" id="edit_part_of_project"
                                name="part_of_project">
                                <option value="">Select Project</option>
                                <!-- Options to be populated dynamically -->
                            </select>
                        </div>
                        <div class="mb-3 input-custom">
                            <label for="edit_co_author_input" class="form-label label-custom">Co-Author</label>
                            <input type="text" class="form-control input-text" id="edit_co_author_input"
                                name="edit_co_author_input" autocomplete="off" placeholder="Search employees...">
                            <div id="edit_co_author_dropdown" class="dropdown-list mt-1"
                                style="max-height: 200px; overflow-y: auto; border: 1px solid #ccc; border-radius: 4px; display: none; background: white; position: absolute; z-index: 1000; width: 100%;">
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
                            <div id="edit_contributor_dropdown" class="dropdown-list mt-1"
                                style="max-height: 200px; overflow-y: auto; border: 1px solid #ccc; border-radius: 4px; display: none; background: white; position: absolute; z-index: 1000; width: 100%;">
                            </div>
                            <div id="edit_selected_contributors" class="mt-2 d-flex flex-wrap gap-2">
                                <!-- Selected contributors will appear here -->
                            </div>
                            <input type="hidden" id="edit_contributors" name="contributors" value="">
                        </div>
                    </div>
                    <div class="modal-footer modal-footer-custom">
                        <button type="submit" class="btn-submit-black">
                            Update
                        </button>
                    </div>
                </form>
            </div>
            <div class="alert-container mt-2" style="width: 100%;"></div>
        </div>
    </div>

    <!-- View Project Detail Modal -->
    {{-- <div class="modal fade" id="projectDetailModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" style="max-width:640px;">
            <div class="modal-content border-0 rounded-4 shadow-lg">
                <div class="modal-body p-4">

                    <!-- Tombol close di kanan atas -->
                    <div class="d-flex justify-content-end mb-2">
                        <button type="button" class="btn-close" data-bs-dismiss="modal"
                            aria-label="Close"></button>
                    </div>

                    <!-- Header: avatar + title + more_vert -->
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <div class="d-flex align-items-center">
                            <img id="projectDetailImage" src="" class="rounded-circle me-2"
                                style="width:34px;height:34px;object-fit:cover;"
                                onerror="this.src='/asset/img/avatar.png'">
                            <h6 class="mb-0" style="font-size:14px; font-weight:600;" id="projectDetailTitle"></h6>
                        </div>
                        <div class="dropdown-icon-container-detail">
                            <button
                                class="btn btn-sm border-0 d-flex align-items-center justify-content-center dropdown-icon dropdown-icon-detail"
                                style="background:#E8E9F2; border-radius:50%; width:32px; height:32px;">
                                <span class="material-symbols-outlined" style="font-size:16px; color:#828282;"
                                    tabindex="0">more_vert</span>
                            </button>
                            <div class="dropdown-menu dropdown-action dropdown-action-custom d-none">
                                <div class="dropdown-item">Edit</div>
                                <div class="dropdown-item text-danger delete-project">Delete</div>
                            </div>
                        </div>
                    </div>

                    <!-- Description -->
                    <p id="projectDetailDescription" class="mb-2 small text-muted"
                        style="font-size:12px; line-height:1.4;"></p>

                    <!-- Collaborators -->
                    <div class="collaborators-image d-flex align-items-center mb-2" id="projectDetailCollaborators">
                    </div>

                    <!-- Feedback Snippet (hidden by default, muncul kalau ada data) -->
                    <div class="latest-feedback-snippet d-none align-items-center me-1"
                        id="projectDetailFeedbackSnippet" style="cursor:pointer; max-width: 160px;">
                        <img class="latest-feedback-avatar rounded-circle me-1" src="" alt="avatar"
                            width="20" height="20" style="object-fit:cover;">
                        <span class="latest-feedback-text text-truncate"
                            style="max-width: 130px; font-size: 11px; color:#4B4F5E;"></span>
                    </div>

                    <hr class="my-2 border-3" style="border-top:1px solid #DEDFE7;">

                    <!-- Footer (Collaborators + icons) -->
                    <div class="d-flex justify-content-between align-items-center mt-2">
                        <div class="collaborators-image d-flex align-items-center"
                            id="projectDetailCollaboratorsFooter"></div>
                        <div class="d-flex align-items-center">
                            <button
                                class="btn btn-sm p-0 border-0 bg-transparent me-2 d-flex align-items-center position-relative"
                                title="Comment" id="projectDetailCommentBtn">
                                <span class="material-symbols-outlined"
                                    style="font-size:16px; color:#828282;">mode_comment</span>
                                <span class="project-feedback-count ms-1" id="projectDetailCommentCount"
                                    style="font-size:12px; color:#454545;"></span>
                                <span class="unread-badge position-absolute top-0 start-100 translate-middle d-none"
                                    id="projectDetailUnreadBadge"></span>
                            </button>
                            <button class="btn btn-sm p-0 border-0 bg-transparent d-flex align-items-center"
                                title="Attach File" id="projectDetailAttachBtn">
                                <span class="material-symbols-outlined"
                                    style="font-size:16px; color:#828282;">attach_file</span>
                                <span class="project-file-count ms-1" id="projectDetailFileCount"
                                    style="font-size:12px; color:#454545;"></span>
                            </button>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div class="d-flex justify-content-between align-items-center mt-3">
                        <div>
                            <span class="me-3">
                                <span>Department:</span> <span id="projectDetailDepartment"></span>
                            </span>
                            <span>
                                <span>Division:</span> <span id="projectDetailDivision"></span>
                            </span>
                        </div>
                    </div>

                    <div class="modal-footer modal-footer-custom">
                        <button type="button" class="btn btn-sm btn-outline-secondary"
                            data-bs-dismiss="modal">Close</button>
                    </div>

                </div>
            </div>
        </div>
    </div> --}}

    <div class="modal fade" id="projectDetailModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" style="max-width:640px;">
            <div class="modal-content border-0 rounded-4 shadow-lg">
                <div class="modal-body p-4 position-relative mb-3">

                    <!-- Tombol close -->
                    <div class="d-flex justify-content-end mb-3">
                        <button type="button" class="btn-close" data-bs-dismiss="modal"
                            aria-label="Close"></button>
                    </div>

                    <!-- Container detail (JS inject) -->
                    <div id="projectDetailContent" class="mb-3"></div>

                </div>
            </div>
        </div>
    </div>


    <!-- Project Reference Files Modal (exactly like Task modal) -->
    <div class="modal fade modal-custom" id="projectFilesModal" tabindex="-1"
        aria-labelledby="projectFilesModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content modal-content-custom">
                <div class="modal-header modal-header-custom">
                    <h5 class="modal-title modal-title-custom" id="projectFilesModalLabel">Reference Files</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <hr>
                <div class="modal-body modal-body-custom">
                    <div id="projectReferenceFilesList" class="d-flex flex-column gap-2">
                        <!-- File links will be inserted here -->
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Project Feedback Modal -->
    <div class="modal fade" id="projectFeedbackModal" tabindex="-1" aria-labelledby="projectFeedbackModalLabel"
        aria-hidden="true" data-project-id="{{ $projectId ?? '' }}"
        data-employee-id="{{ auth()->user()->employee->id ?? '' }}">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable feedback-modal-dialog">
            <div class="modal-content feedback-modal-content">
                <div
                    class="modal-header feedback-modal-header d-flex align-items-center position-relative flex-nowrap">
                    <h5 class="modal-title feedback-modal-title flex-grow-1 text-truncate"
                        id="projectFeedbackModalLabel">Project Feedback</h5>
                    <button type="button" class="btn-close ms-3 flex-shrink-0" data-bs-dismiss="modal"
                        aria-label="Close"></button>
                </div>

                <div class="modal-body feedback-modal-body" id="projectFeedbackList">
                </div>
                <div class="modal-footer feedback-modal-footer">
                    <button type="button" class="btn btn-submit-black w-100" id="addFeedbackButton"
                        style="white-space: nowrap;">Add Feedback</button>
                </div>
            </div>
            <div class="alert-container mt-2" style="width: 100%;"></div>
        </div>
    </div>

    <!-- Delete Project Confirmation Modal -->
    <div class="modal fade" id="deleteProjectModal" tabindex="-1" aria-labelledby="deleteProjectModalLabel"
        aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered" style="max-width: 400px;">
            <div class="modal-content modal-content-custom">
                <div class="modal-header modal-header-custom">
                    <h5 class="modal-title modal-title-custom" id="deleteProjectModalLabel">Delete Project</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body modal-body-custom d-flex flex-column align-items-center">
                    <img id="deleteProjectImage" src="" alt="Project Image"
                        style="width: 150px; height: 150px; object-fit: cover; border-radius: 8px; margin-bottom: 1rem;">
                    <p id="deleteProjectTitle" class="fw-bold fs-5 text-center mb-4"></p>
                    <div class="d-flex justify-content-center gap-3 w-100">
                        <button type="button" class="btn btn-danger" id="confirmDeleteProjectBtn">Delete</button>
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
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
    <x-slot name="script_slot">

  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="{{ asset('asset/js/project.js') }}"></script>  {{-- PENTING: project.js dulu --}}
<script>
document.addEventListener('DOMContentLoaded', function () {
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
          try { refreshAllProjectUnreadBadges(); } catch(_) {}
      });
});
</script>


        <script></script>
    </x-slot>
</x-office-layout>
