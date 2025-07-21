<x-office-layout>
    <x-slot name="menu_active">
        {{ __('task') }}
    </x-slot>
    <x-slot name="head_slot">
        <link rel="stylesheet" href="{{ asset('asset/css/task.css') }}">
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
        <h2>Task</h2>
    </div>

    <div class="d-flex justify-content-end mb-3">
        <button class="btn-submit-black" data-bs-toggle="modal" data-bs-target="#addTaskModal">Add Task</button>
    </div>

    <div id="task-cards-container" class="container my-4">
        <div class="row">
            <!-- New Request Section -->
            <div class="col-md-4">
                <h4 class="task-section-title">New Request</h4>
                <div id="new-request-tasks" class="task-list"></div>
            </div>

            <!-- In Progress Section -->
            <div class="col-md-4">
                <h4 class="task-section-title">In Progress</h4>
                <div id="in-progress-tasks" class="task-list"></div>
            </div>

            <!-- Completed Section -->
            <div class="col-md-4">
                <h4 class="task-section-title">Completed</h4>
                <div id="completed-tasks" class="task-list"></div>
            </div>
        </div>
    </div>

    <!-- Add Task Modal -->
    <div class="modal fade" id="addTaskModal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1"
        aria-labelledby="addTaskModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content modal-content-custom">
                <div class="modal-loading-overlay d-none" id="addTaskModalLoader">
                    <div class="loader-spinner"></div>
                </div>
                <div class="modal-header modal-header-custom">
                    <h5 class="modal-title modal-title-custom" id="addTaskModalLabel">Add Task</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <form id="addTaskForm" enctype="multipart/form-data">
                    <div class="modal-body modal-body-custom">
                        <div id="addTaskAlert" class="alert alert-success d-none" role="alert"
                            style="margin-bottom: 1rem; display:none;">
                            Task added successfully!
                        </div>
                        <div class="mb-3">
                            <div class="title-label-image">
                                <span>Upload image</span>
                            </div>
                            <label for="task_image" class="custom-image-upload position-relative" id="taskImageLabel"
                                style=" background-position: center center; background-repeat: no-repeat; background-size: 50%;  background-image: url('{!! asset('asset/img/background/add-image.png') !!}');">
                                <input type="file" class="input-image" id="task_image" name="image"
                                    accept="image/*" hidden>
                                <span class="image-clear-btn d-none" id="taskImageClearBtn"
                                    title="Remove image">&times;</span>
                            </label>
                            <div class="invalid-feedback">
                                Please select an image file.
                            </div>
                        </div>
                        <div class="mb-3">
                            <label for="task_title" class="form-label label-custom">Title</label>
                            <input type="text" class="form-control input-text" id="task_title" name="title"
                                required>
                        </div>
                        <div class="mb-3">
                            <label for="task_description" class="form-label label-custom">Description</label>
                            <textarea class="form-control input-text" id="task_description" name="description" rows="6"></textarea>
                        </div>
                        <div class="mb-3">
                            <label for="task_project_id" class="form-label label-custom">Project</label>
                            <select class="form-select input-select" id="task_project_id" name="project_id" required>
                                <option value="">Select Project</option>
                                <!-- Options to be populated dynamically -->
                            </select>
                        </div>
                        <div class="mb-3">
                            <label for="task_point" class="form-label label-custom">Point</label>
                            <input type="number" class="form-control input-text" id="task_point" name="point"
                                value="1" min="1" required>
                        </div>
                        <div class="mb-3">
                            <label for="task_priority" class="form-label label-custom">Priority</label>
                            <select class="form-select input-select" id="task_priority" name="priority" required>
                                <option value="">Select Priority</option>
                                <option value="HIGH">HIGH</option>
                                <option value="MEDIUM">MEDIUM</option>
                                <option value="LOW">LOW</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label for="task_reference_url" class="form-label label-custom">Reference URL</label>
                            <input type="text" class="form-control input-text" id="task_reference_url"
                                name="reference_url">
                        </div>
                        <div class="mb-3">
                            <label for="task_reference_files" class="form-label label-custom">Reference Files</label>
                            <input type="file" class="form-control input-text" id="task_reference_files"
                                name="reference_files[]" accept=".pdf,.doc,.docx" multiple>
                            <div class="form-text">You can select multiple files (PDF, DOC, DOCX)</div>
                            <div id="reference_files_preview" class="mt-2"></div>
                        </div>
                        <div class="mb-3 d-flex justify-content-between">
                            <div style="width: 48%;">
                                <label for="task_start_date" class="form-label label-custom">Start Date</label>
                                <input type="date" class="form-control input-text" id="task_start_date"
                                    name="start_date" required>
                            </div>
                            <div style="width: 48%;">
                                <label for="task_due_date" class="form-label label-custom">Due Date</label>
                                <input type="date" class="form-control input-text" id="task_due_date"
                                    name="due_date" required>
                            </div>
                        </div>
                        <div class="mb-3">
                            <label for="executor_input" class="form-label label-custom">Executor</label>
                            <input type="text" class="form-control input-text" id="executor_input"
                                name="executor_input" autocomplete="off" placeholder="Search employees...">
                            <div id="executor_dropdown" class="dropdown-list mt-1"
                                style="max-height: 200px; overflow-y: auto; border: 1px solid #ccc; border-radius: 4px; display: none; background: white; position: absolute; z-index: 1000; width: 100%;">
                            </div>
                            <div id="selected_executors" class="mt-2 d-flex flex-wrap gap-2">
                                <!-- Selected executors will appear here -->
                            </div>
                            <input type="hidden" id="executors" name="executors" value="">
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

    <!-- Edit Task Modal -->
    <div class="modal fade" id="editTaskModal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1"
        aria-labelledby="editTaskModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content modal-content-custom">
                <div class="modal-loading-overlay d-none" id="editTaskModalLoader">
                    <div class="loader-spinner"></div>
                </div>
                <div class="modal-header modal-header-custom">
                    <h5 class="modal-title modal-title-custom" id="editTaskModalLabel">Edit Task</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <form id="editTaskForm" enctype="multipart/form-data">
                    <input type="hidden" id="edit_task_id" name="id" value="">
                    <div class="modal-body modal-body-custom">
                        <div class="mb-3">
                            <div class="title-label-image">
                                <span>Upload image</span>
                            </div>
                            <label for="edit_task_image" class="custom-image-upload position-relative" id="editTaskImageLabel"
                                style=" background-position: center center; background-repeat: no-repeat; background-size: 50%;  background-image: url('{!! asset('asset/img/background/add-image.png') !!}');">
                                <input type="file" class="input-image" id="edit_task_image" name="image"
                                    accept="image/*" hidden>
                                <span class="image-clear-btn d-none" id="editTaskImageClearBtn"
                                    title="Remove image">&times;</span>
                            </label>
                            <div class="invalid-feedback">
                                Please select an image file.
                            </div>
                        </div>
                        <div class="mb-3">
                            <label for="edit_task_title" class="form-label label-custom">Title</label>
                            <input type="text" class="form-control input-text" id="edit_task_title" name="title"
                                required>
                        </div>
                        <div class="mb-3">
                            <label for="edit_task_description" class="form-label label-custom">Description</label>
                            <textarea class="form-control input-text" id="edit_task_description" name="description" rows="6"></textarea>
                        </div>
                        <div class="mb-3">
                            <label for="edit_task_project_id" class="form-label label-custom">Project</label>
                            <select class="form-select input-select" id="edit_task_project_id" name="project_id" required>
                                <option value="">Select Project</option>
                                <!-- Options to be populated dynamically -->
                            </select>
                        </div>
                        <div class="mb-3">
                            <label for="edit_task_point" class="form-label label-custom">Point</label>
                            <input type="number" class="form-control input-text" id="edit_task_point" name="point"
                                value="1" min="1" required>
                        </div>
                        <div class="mb-3">
                            <label for="edit_task_priority" class="form-label label-custom">Priority</label>
                            <select class="form-select input-select" id="edit_task_priority" name="priority" required>
                                <option value="">Select Priority</option>
                                <option value="HIGH">HIGH</option>
                                <option value="MEDIUM">MEDIUM</option>
                                <option value="LOW">LOW</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label for="edit_task_reference_url" class="form-label label-custom">Reference URL</label>
                            <input type="text" class="form-control input-text" id="edit_task_reference_url"
                                name="reference_url">
                        </div>
                        <div class="mb-3">
                            <label for="edit_task_reference_files" class="form-label label-custom">Reference Files</label>
                        <input type="file" class="form-control input-text" id="edit_task_reference_files"
                            name="reference_files[]" accept=".pdf,.doc,.docx" multiple>
                        <div class="form-text">You can select multiple files (PDF, DOC, DOCX)</div>
                        <div id="edit_reference_files_preview" class="mt-2"></div>
                        <div id="existing_reference_files" class="mt-2"></div>
                        <input type="hidden" id="existing_reference_files_input" name="existing_reference_files" value="">
                    </div>

                        <div class="mb-3 d-flex justify-content-between">
                            <div style="width: 48%;">
                                <label for="edit_task_start_date" class="form-label label-custom">Start Date</label>
                                <input type="date" class="form-control input-text" id="edit_task_start_date"
                                    name="start_date" required>
                            </div>
                            <div style="width: 48%;">
                                <label for="edit_task_due_date" class="form-label label-custom">Due Date</label>
                                <input type="date" class="form-control input-text" id="edit_task_due_date"
                                    name="due_date" required>
                            </div>
                        </div>
                        <div class="mb-3">
                            <label for="edit_executor_input" class="form-label label-custom">Executor</label>
                            <input type="text" class="form-control input-text" id="edit_executor_input"
                                name="edit_executor_input" autocomplete="off" placeholder="Search employees...">
                            <div id="edit_executor_dropdown" class="dropdown-list mt-1"
                                style="max-height: 200px; overflow-y: auto; border: 1px solid #ccc; border-radius: 4px; display: none; background: white; position: absolute; z-index: 1000; width: 100%;">
                            </div>
                            <div id="edit_selected_executors" class="mt-2 d-flex flex-wrap gap-2">
                                <!-- Selected executors will appear here -->
                            </div>
                            <input type="hidden" id="edit_executors" name="executors" value="">
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

    <!-- Task Detail Modal -->
    <div class="modal fade" id="taskDetailModal" tabindex="-1" aria-labelledby="taskDetailModalLabel"
        aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" style="max-width: 480px;">
            <div class="modal-content modal-content-custom" style="box-shadow: none;">
                <div class="modal-body modal-body-custom">
                    <button type="button" class="btn-close float-end" data-bs-dismiss="modal"
                        aria-label="Close"></button>
                    <div class="task-detail-modal">
                        <div class="task-photo-title-author">
                            <img id="taskDetailImage" src="" alt="Task Image" class="task-photo"
                                style="border-radius: 8px;">
                            <h2 class="task-title" id="taskDetailTitle" style="text-align: justify;"></h2>
                            <p class="task-description" id="taskDetailDescription"></p>
                        </div>
                        <div class="task-detail-columns">
                            <div class="task-detail-left">
                                <p><strong>Department:</strong> <span id="taskDetailDepartment"></span></p>
                                <p><strong>Division:</strong> <span id="taskDetailDivision"></span></p>
                                <p><strong>Project:</strong> <span id="taskDetailProject"></span></p>
                                <p><strong>PIC:</strong> <span id="taskDetailPIC"></span></p>
                                <p><strong>Executors:</strong> <span id="taskDetailExecutors"></span></p>
                            </div>
                            <div class="task-detail-right">
                                <p><strong>Reference URL:</strong> <a href="#" target="_blank"
                                        id="taskDetailReferenceUrl"></a></p>
                                <p><strong>Reference Files:</strong> <span id="taskDetailReferenceFiles"></span></p>
                                <p><strong>Point:</strong> <span id="taskDetailPoint"></span></p>
                                <p><strong>Priority:</strong> <span id="taskDetailPriority"></span></p>
                                <p><strong>Start Date:</strong> <span id="taskDetailStartDate"></span></p>
                                <p><strong>Due Date:</strong> <span id="taskDetailDueDate"></span></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Delete Task Confirmation Modal -->
    <div class="modal fade" id="deleteTaskModal" tabindex="-1" aria-labelledby="deleteTaskModalLabel"
        aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered" style="max-width: 400px;">
            <div class="modal-content modal-content-custom">
                <div class="modal-header modal-header-custom">
                    <h5 class="modal-title modal-title-custom" id="deleteTaskModalLabel">Delete Task</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body modal-body-custom d-flex flex-column align-items-center">
                    <img id="deleteTaskImage" src="" alt="Task Image"
                        style="width: 150px; height: 150px; object-fit: cover; border-radius: 8px; margin-bottom: 1rem;">
                    <p id="deleteTaskTitle" class="fw-bold fs-5 text-center mb-4"></p>
                    <div class="d-flex justify-content-center gap-3 w-100">
                        <button type="button" class="btn btn-danger" id="confirmDeleteTaskBtn">Delete</button>
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Reference Files Modal -->
    <div class="modal fade" id="referenceFilesModal" tabindex="-1" aria-labelledby="referenceFilesModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" style="max-width: 480px;">
            <div class="modal-content modal-content-custom" style="box-shadow: none;">
                <div class="modal-header modal-header-custom">
                    <h5 class="modal-title modal-title-custom" id="referenceFilesModalLabel">Reference Files</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <hr>
                <div class="modal-body modal-body-custom">
                    <div id="referenceFilesList" class="d-flex flex-column gap-2">
                        <!-- Reference files links will be inserted here -->
                    </div>
                </div>
            </div>
        </div>
    </div>

     <!-- Task Feedback Modal -->
    <div class="modal fade" id="taskFeedbackModal" tabindex="-1" aria-labelledby="taskFeedbackModalLabel"
        aria-hidden="true" data-task-id="{{ $taskId ?? '' }}"
        data-employee-id="{{ auth()->user()->employee->id ?? '' }}">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable feedback-modal-dialog">
            <div class="modal-content feedback-modal-content">
                <div
                    class="modal-header feedback-modal-header d-flex align-items-center position-relative flex-nowrap">
                    <h5 class="modal-title feedback-modal-title flex-grow-1 text-truncate"
                        id="taskFeedbackModalLabel">Task Feedback</h5>
                    <button type="button" class="btn-close ms-3 flex-shrink-0" data-bs-dismiss="modal"
                        aria-label="Close"></button>
                </div>

                <div class="modal-body feedback-modal-body" id="taskFeedbackList">
                </div>
                <div class="modal-footer feedback-modal-footer">
                    <button type="button" class="btn btn-submit-black btn-submit-custom" id="addFeedbackButton"
                        style="width: 120px; white-space: nowrap;">Add Feedback</button>
                </div>
            </div>
            <div class="alert-container mt-2" style="width: 100%;"></div>
        </div>
    </div>

    <x-slot name="script_slot">

        <script src="{{ asset('asset/js/task.js') }}"></script>

        <script></script>
    </x-slot>
</x-office-layout>
