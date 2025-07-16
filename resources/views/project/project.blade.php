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
    <div class="title-content">
        <h2>Project</h2>
    </div>

    <div class="d-flex justify-content-end mb-3">
        <button class="btn-submit-black" data-bs-toggle="modal" data-bs-target="#addProjectModal">Add Project</button>
    </div>
    <div id="project-cards-container" class="container my-4">
        <!-- Project cards will be dynamically generated here -->
    </div>

    <!-- Add Project Modal -->
    <div class="modal fade" id="addProjectModal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1"
        aria-labelledby="addProjectModalLabel" aria-hidden="true">
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
                                <input type="file" class="input-image" id="image" name="image" accept="image/*"
                                    hidden>
                                <span class="image-clear-btn d-none" id="imageClearBtn"
                                    title="Remove image">&times;</span>
                            </label>
                            <div class="invalid-feedback">
                                Please select an image file.
                            </div>
                        </div>
                        <div class="mb-3">
                            <label for="title" class="form-label label-custom">Title</label>
                            <input type="text" class="form-control input-text" id="title" name="title"
                                required>
                        </div>
                        <div class="mb-3">
                            <label for="description" class="form-label label-custom">Description</label>
                            <textarea class="form-control input-text" id="description" name="description" rows="3"></textarea>
                        </div>
                        <div class="mb-3">
                            <label for="department" class="form-label label-custom">Department</label>
                            <select class="form-select input-select" id="department" name="department" required>
                                <option value="">Select Department</option>
                                <!-- Options to be populated dynamically -->
                            </select>
                        </div>
                        <div class="mb-3">
                            <label for="division" class="form-label label-custom">Division</label>
                            <select class="form-select input-select" id="division" name="division" required>
                                <option value="">Select Division</option>
                                <!-- Options to be populated dynamically -->
                            </select>
                        </div>
                        <div class="mb-3">
                            <label for="reference_url" class="form-label label-custom">Reference URL</label>
                            <input type="text" class="form-control input-text" id="reference_url"
                                name="reference_url">
                        </div>
                        <div class="mb-3">
                            <label for="reference_file" class="form-label label-custom">Reference File</label>
                            <input type="file" class="form-control input-text" id="reference_file"
                                name="reference_file" accept=".pdf,.doc,.docx">
                        </div>
                        <div class="mb-3 d-flex justify-content-between">
                            <div style="width: 48%;">
                                <label for="start_date" class="form-label label-custom">Start Date</label>
                                <input type="date" class="form-control input-text" id="start_date"
                                    name="start_date" required>
                            </div>
                            <div style="width: 48%;">
                                <label for="due_date" class="form-label label-custom">Due Date</label>
                                <input type="date" class="form-control input-text" id="due_date" name="due_date"
                                    required>
                            </div>
                        </div>
                        <div class="mb-3">
                            <label for="part_of_project" class="form-label label-custom">Part of Project</label>
                            <select class="form-select input-select" id="part_of_project" name="part_of_project">
                                <option value="">Select Project</option>
                                <!-- Options to be populated dynamically -->
                            </select>
                        </div>
                        <div class="mb-3">
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
                        <div class="mb-3">
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
                        <button type="submit" class="btn-submit-black btn-submit-custom">
                            Submit
                        </button>
                    </div>
                </form>
            </div>
            <div class="alert-container mt-2" style="width: 100%;"></div>
        </div>
    </div>

    <!-- Edit Project Modal -->
    <div class="modal fade" id="editProjectModal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1"
        aria-labelledby="editProjectModalLabel" aria-hidden="true"
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
                        <div class="mb-3">
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
                        <div class="mb-3">
                            <label for="edit_title" class="form-label label-custom">Title</label>
                            <input type="text" class="form-control input-text" id="edit_title" name="title"
                                required>
                        </div>
                        <div class="mb-3">
                            <label for="edit_description" class="form-label label-custom">Description</label>
                            <textarea class="form-control input-text" id="edit_description" name="description" rows="3"></textarea>
                        </div>
                        <div class="mb-3">
                            <label for="edit_department" class="form-label label-custom">Department</label>
                            <select class="form-select input-select" id="edit_department" name="department" required>
                                <option value="">Select Department</option>
                                <!-- Options to be populated dynamically -->
                            </select>
                        </div>
                        <div class="mb-3">
                            <label for="edit_division" class="form-label label-custom">Division</label>
                            <select class="form-select input-select" id="edit_division" name="division" required>
                                <option value="">Select Division</option>
                                <!-- Options to be populated dynamically -->
                            </select>
                        </div>
                        <div class="mb-3">
                            <label for="edit_reference_url" class="form-label label-custom">Reference URL</label>
                            <input type="text" class="form-control input-text" id="edit_reference_url"
                                name="reference_url">
                        </div>
                        <div class="mb-3">
                            <label for="edit_reference_file" class="form-label label-custom">Reference File</label>
                            <input type="file" class="form-control input-text" id="edit_reference_file"
                                name="reference_file" accept=".pdf,.doc,.docx">
                        </div>
                        <div class="mb-3 d-flex justify-content-between">
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
                        <div class="mb-3">
                            <label for="edit_part_of_project" class="form-label label-custom">Part of Project</label>
                            <select class="form-select input-select" id="edit_part_of_project"
                                name="part_of_project">
                                <option value="">Select Project</option>
                                <!-- Options to be populated dynamically -->
                            </select>
                        </div>
                        <div class="mb-3">
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
                        <div class="mb-3">
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
                        <button type="submit" class="btn-submit-black btn-submit-custom">
                            Update
                        </button>
                    </div>
                </form>
            </div>
            <div class="alert-container mt-2" style="width: 100%;"></div>
        </div>
    </div>



    <!-- View Project Detail Modal -->
    <div class="modal fade" id="projectDetailModal" tabindex="-1" aria-labelledby="projectDetailModalLabel"
        aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" style="max-width: 480px;">
            <div class="modal-content modal-content-custom" style="box-shadow: none;">
                <div class="modal-body modal-body-custom">
                    <button type="button" class="btn-close float-end" data-bs-dismiss="modal"
                        aria-label="Close"></button>
                    <div class="project-detail-modal">
                        <div class="project-photo-title-author">
                            <img id="projectDetailImage" src="" alt="Project Image" class="project-photo"
                                style="border-radius: 8px;">
                            <h2 class="project-title" id="projectDetailTitle" style="text-align: justify;"></h2>
                            <p class="project-description" id="projectDetailDescription"></p>

                        </div>
                        <div class="project-detail-columns">
                            <div class="project-detail-left">
                                <p><strong>Department:</strong> <span id="projectDetailDepartment"></span></p>
                                <p><strong>Division:</strong> <span id="projectDetailDivision"></span></p>
                                <p><strong>Author:</strong> <span id="projectDetailAuthor"></span></p>
                                <p><strong>Co-Authors:</strong> <span id="projectDetailCoAuthors"></span></p>
                                <p><strong>Contributors:</strong> <span id="projectDetailContributors"></span></p>
                            </div>
                            <div class="project-detail-right">
                                <p><strong>Reference URL:</strong> <a href="#" target="_blank"
                                        id="projectDetailReferenceUrl"></a></p>
                                <p><strong>Reference File:</strong> <a href="#" id="projectDetailReferenceFile"
                                        download>Download</a></p>
                                <p><strong>Start Date:</strong> <span id="projectDetailStartDate"></span></p>
                                <p><strong>Due Date:</strong> <span id="projectDetailDueDate"></span></p>
                            </div>
                        </div>
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
                    <button type="button" class="btn btn-submit-black btn-submit-custom" id="addFeedbackButton"
                        style="width: 120px; white-space: nowrap;">Add Feedback</button>
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
    <x-slot name="script_slot">

        <script src="{{ asset('asset/js/project.js') }}"></script>

        <script></script>
    </x-slot>
</x-office-layout>
