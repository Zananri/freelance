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
    <div class="d-flex justify-content-between align-items-center mb-4 mt-1 header-task-container">
        <div class="title-content">
            <h2>Task</h2>
        </div>

        <div class="d-flex align-items-center gap-2">
            <div class="dropdown-filter-container">
                <div class="search-input-container">
                    <span class="material-symbols-outlined search-icon">search</span>
                    <input class="form-control custom-form-filter" type="text" name="search_filter"
                        id="search_filter">
                </div>

                <button class="btn btn-sm toggle-timeline timeline-toggle-btn" data-bs-toggle="modal"
                    data-bs-target="#timelineModal">
                    <span class="material-symbols-outlined">calendar_month</span>
                </button>

                <button class="btn btn-icon-toggle toggle-filter" type="button" id="openTaskFilterBtn">
                    <span class="material-symbols-outlined icon">filter_list</span> <span
                        class="btn-text-filter">Filter</span>
                </button>

                <div class="dropdown-filter-menu" id="taskFilterDropdown" style="display: none;">
                    <div class="dropdown-filter-body">
                        <div class="mb-3">
                            <label for="filterTaskProject" class="form-label">Project</label>
                            <select id="filterTaskProject" class="form-select">
                                <option value="">All Projects</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label for="filterTaskStatus" class="form-label">Status</label>
                            <select id="filterTaskStatus" class="form-select">
                                <option value="">All Status</option>
                                <option value="new_request">New Request</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>
                    </div>
                    <div class="dropdown-filter-footer">
                        <button type="button" class="btn btn-submit-filter" id="applyTaskFilterBtn">Filter</button>
                    </div>
                </div>
            </div>

            <a href="{{ route('schedules.create') }}" class="btn btn-schedule-custom">Schedule</a>
            <button class="btn btn-add-custom" data-bs-toggle="modal" data-bs-target="#addTaskModal">Add <span
                    class="btn-text-add">Task</span></button>
        </div>
    </div>

    <div id="task-cards-container" class="task-container container">
        <div class="row">
            <div class="col-md-4 new-request-container">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <h4 class="task-section-title mb-0">New</h4>
                    <div class="d-flex align-items-center gap-2">
                        <button type="button" id="taskNewBulkAction" class="task-bulk-icon" aria-label="Confirm accept selected tasks">
                            <span class="material-symbols-outlined">done_all</span>
                        </button>
                        <button type="button" id="taskNewBulkProgress" class="task-bulk-icon" aria-label="Move selected tasks to In Progress">
                            <span class="material-symbols-outlined">arrow_right_alt</span>
                        </button>
                        <label for="taskNewAcceptAll" class="task-selectall-toggle">
                            <input class="task-selectall-input" type="checkbox" id="taskNewAcceptAll" aria-label="Select all pending new tasks" />
                        </label>
                    </div>
                </div>
                <div id="new-request-tasks" class="task-list"></div>
                <div id="newTaskLoading" class="d-flex justify-content-center mt-3 d-none">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
            <div class="col-md-4 in-progress-container">
                <h4 class="task-section-title">In Progress</h4>
                <div id="in-progress-tasks" class="task-list"></div>
                <div id="progressTaskLoading" class="d-flex justify-content-center mt-3 d-none">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
            <div class="col-md-4 completed-container">
                <h4 class="task-section-title">Completed</h4>
                <div id="completed-tasks" class="task-list"></div>
                <div id="completedTaskLoading" class="d-flex justify-content-center mt-3 d-none">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
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
                    <input type="hidden" id="edit_task_id" name="task_id" value="">
                    <div class="modal-body modal-body-custom">
                        <div id="editTaskAlert" class="alert alert-success d-none" role="alert"
                            style="display:none;">
                            Task updated successfully!
                        </div>

                        <div class="mb-3">
                            <div class="title-label-image">
                                <span>Upload image</span>
                            </div>
                            <label for="edit_task_image" class="custom-image-upload position-relative"
                                id="editTaskImageLabel" style="background-image: url('{!! asset('asset/img/background/add-image.png') !!}');">
                                <input type="file" class="input-image" id="edit_task_image" name="image"
                                    accept="image/*" hidden>
                                <span class="image-clear-btn d-none" id="editTaskImageClearBtn"
                                    title="Remove image">&times;</span>
                            </label>
                            <div class="invalid-feedback">
                                Please select an image file.
                            </div>
                        </div>

                        <div class="mb-3 custom-input">
                            <label for="edit_task_title" class="form-label label-custom">Title</label>
                            <input type="text" class="form-control input-text" id="edit_task_title"
                                name="title" required>
                        </div>
                        <div class="mb-3 custom-input">
                            <label for="edit_task_description" class="form-label label-custom">Description</label>
                            <textarea class="form-control input-text" id="edit_task_description" name="description" rows="6"></textarea>
                        </div>
                        <div class="mb-3 custom-input">
                            <label for="edit_task_project_id" class="form-label label-custom">Project (optional)</label>
                            <select class="form-select input-select" id="edit_task_project_id" name="project_id">
                                <option value="">No Project</option>
                            </select>
                        </div>
                        <div class="mb-3 custom-input">
                            <label for="edit_task_point" class="form-label label-custom">Point</label>
                            <input type="number" class="form-control input-text" id="edit_task_point"
                                name="point" value="1" min="1" required>
                        </div>
                        <div class="mb-3 custom-input">
                            <label for="edit_task_priority" class="form-label label-custom">Priority</label>
                            <select class="form-select input-select" id="edit_task_priority" name="priority"
                                required>
                                <option value="">Select Priority</option>
                                <option value="HIGH">HIGH</option>
                                <option value="MEDIUM">MEDIUM</option>
                                <option value="LOW">LOW</option>
                            </select>
                        </div>
                        <div class="mb-3 custom-input">
                            <label class="form-label label-custom">Reference URLs</label>
                            <div id="edit_task_reference_urls_container" class="d-flex flex-column gap-2">
                                <div class="d-flex gap-2 align-items-center">
                                    <input type="url" class="form-control input-text" name="reference_urls[]"
                                        placeholder="https://example.com">
                                    <button type="button" class="btn btn-submit-black add-ref-url"
                                        aria-label="Add URL"><span
                                            class="material-symbols-outlined">add</span></button>
                                </div>
                            </div>
                        </div>
                        <div class="mb-3 custom-input">
                            <label for="edit_task_reference_files" class="form-label label-custom">Reference
                                Files</label>
                            <input type="file" class="form-control input-text" id="edit_task_reference_files"
                                name="reference_files[]" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip" multiple>
                            <div class="form-text">Multiple files supported.</div>
                            <div id="existing_reference_files" class="mt-2"></div>
                            <div id="edit_reference_files_preview" class="mt-2"></div>
                        </div>
                        <div class="mb-3 custom-input d-flex justify-content-between">
                            <div class="date-form">
                                <label for="edit_task_start_date" class="form-label label-custom">Start Date</label>
                                <input type="date" class="form-control input-text" id="edit_task_start_date"
                                    name="start_date" required>
                            </div>
                            <div class="date-form">
                                <label for="edit_task_due_date" class="form-label label-custom">Due Date</label>
                                <input type="date" class="form-control input-text" id="edit_task_due_date"
                                    name="due_date" required>
                            </div>
                        </div>
                        <div class="mb-3 custom-input">
                            <label for="edit_executor_input" class="form-label label-custom">Executor</label>
                            <input type="text" class="form-control input-text" id="edit_executor_input"
                                name="edit_executor_input" autocomplete="off" placeholder="Search employees...">
                            <div id="edit_executor_dropdown" class="dropdown-list mt-1 executor-list"></div>
                            <div id="edit_selected_executors" class="mt-2 d-flex flex-wrap gap-2"></div>
                            <input type="hidden" id="edit_executors" name="executors" value="">
                        </div>
                    </div>
                    <div class="modal-footer modal-footer-custom">
                        <button type="submit">Submit</button>
                    </div>
                </form>
            </div>
            <div class="alert-container mt-2"></div>
        </div>
    </div>

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
                            style="display:none;">
                            Task added successfully!
                        </div>
                        <div class="mb-3">
                            <div class="title-label-image">
                                <span>Upload image</span>
                            </div>
                            <label for="task_image" class="custom-image-upload position-relative" id="taskImageLabel"
                                style="background-image: url('{!! asset('asset/img/background/add-image.png') !!}');">
                                <input type="file" class="input-image" id="task_image" name="image"
                                    accept="image/*" hidden>
                                <span class="image-clear-btn d-none" id="taskImageClearBtn"
                                    title="Remove image">&times;</span>
                            </label>
                            <div class="invalid-feedback">
                                Please select an image file.
                            </div>
                        </div>
                        <div class="mb-3 custom-input">
                            <label for="task_title" class="form-label label-custom">Title</label>
                            <input type="text" class="form-control input-text" id="task_title" name="title"
                                required>
                        </div>
                        <div class="mb-3 custom-input">
                            <label for="task_description" class="form-label label-custom">Description</label>
                            <textarea class="form-control input-text" id="task_description" name="description" rows="6"></textarea>
                        </div>
                        <div class="mb-3 custom-input">
                            <label for="task_project_id" class="form-label label-custom">Project</label>
                            <select class="form-select input-select" id="task_project_id" name="project_id" required>
                                <option value="">Select Project</option>
                                <!-- Options to be populated dynamically -->
                            </select>
                        </div>
                        <div class="mb-3 custom-input">
                            <label for="task_point" class="form-label label-custom">Point</label>
                            <input type="number" class="form-control input-text" id="task_point" name="point"
                                value="1" min="1" required>
                        </div>
                        <div class="mb-3 custom-input">
                            <label for="task_priority" class="form-label label-custom">Priority</label>
                            <select class="form-select input-select" id="task_priority" name="priority" required>
                                <option value="">Select Priority</option>
                                <option value="HIGH">HIGH</option>
                                <option value="MEDIUM">MEDIUM</option>
                                <option value="LOW">LOW</option>
                            </select>
                        </div>
                        <div class="mb-3 custom-input">
                            <label class="form-label label-custom">Reference URLs</label>
                            <div id="task_reference_urls_container" class="d-flex flex-column gap-2">
                                <div class="d-flex gap-2 align-items-center">
                                    <input type="url" class="form-control input-text" name="reference_urls[]"
                                        placeholder="https://example.com">
                                    <button type="button" class="btn btn-submit-black add-ref-url"
                                        aria-label="Add URL"><span
                                            class="material-symbols-outlined">add</span></button>
                                </div>
                            </div>
                        </div>
                        <div class="mb-3 custom-input">
                            <label for="task_reference_files" class="form-label label-custom">Reference Files</label>
                            <input type="file" class="form-control input-text" id="task_reference_files"
                                name="reference_files[]" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip" multiple>
                            <div class="form-text">Multiple files supported.</div>
                            <div id="reference_files_preview" class="mt-2"></div>
                        </div>
                        <div class="mb-3 custom-input d-flex justify-content-between">
                            <div class="date-form">
                                <label for="task_start_date" class="form-label label-custom">Start Date</label>
                                <input type="date" class="form-control input-text" id="task_start_date"
                                    name="start_date" required>
                            </div>
                            <div class="date-form">
                                <label for="task_due_date" class="form-label label-custom">Due Date</label>
                                <input type="date" class="form-control input-text" id="task_due_date"
                                    name="due_date" required>
                            </div>
                        </div>
                        <div class="mb-3 custom-input">
                            <label for="executor_input" class="form-label label-custom">Executor</label>
                            <input type="text" class="form-control input-text" id="executor_input"
                                name="executor_input" autocomplete="off" placeholder="Search employees...">
                            <div id="executor_dropdown" class="dropdown-list mt-1 executor-list">
                            </div>
                            <div id="selected_executors" class="mt-2 d-flex flex-wrap gap-2">
                                <!-- Selected executors will appear here -->
                            </div>
                            <input type="hidden" id="executors" name="executors" value="">
                        </div>
                    </div>
                    <div class="modal-footer modal-footer-custom">
                        <button type="submit">
                            Submit
                        </button>
                    </div>
                </form>
            </div>
            <div class="alert-container mt-2"></div>
        </div>
    </div>

    <!-- Schedule modal removed; now using separate create page -->

    <!-- Edit Task Modal -->
    <div class="modal fade" id="timelineModal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1"
        aria-labelledby="timelineModalTitle" aria-hidden="true">
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

    <!-- Task Detail Modal -->
    <div class="modal fade" id="taskDetailModal" tabindex="-1" aria-labelledby="taskDetailModalLabel"
        aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content modal-content-custom">
                <div class="modal-body modal-body-custom">
                    <button type="button" class="btn-close float-end" data-bs-dismiss="modal"
                        aria-label="Close"></button>
                    <div class="task-detail-modal">
                        <div class="task-photo-title-author">
                            <img id="taskDetailImage" src="" alt="Task Image" class="task-photo">
                            <h2 class="task-title" id="taskDetailTitle"></h2>
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
                                <p><strong>Reference URLs:</strong> <span id="taskDetailReferenceUrls"></span></p>
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
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content modal-content-custom">
                <div class="modal-header modal-header-custom">
                    <h5 class="modal-title modal-title-custom" id="deleteTaskModalLabel">Delete Task</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body modal-body-custom d-flex flex-column align-items-center">
                    <img id="deleteTaskImage" src="" alt="Task Image" class="delete-image-confim">
                    <p id="deleteTaskTitle" class="fw-bold fs-5 text-center mb-4"></p>
                    <div class="d-flex justify-content-center gap-3 w-100">
                        <button type="button" class="btn btn-danger" id="confirmDeleteTaskBtn">Delete</button>
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Back to Request Status Modal -->
    <div class="modal fade" id="progressStatusModal" tabindex="-1" aria-labelledby="progressStatusModalLabel"
        aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content modal-content-custom">
                <div class="modal-header modal-header-custom">
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body modal-body-custom d-flex flex-column align-items-center">
                    <h4 class="fw-bold text-center mb-2" id="progressStatusTitle">In Progress</h4>
                    <p class="text-center mb-4 modal-description" id="progressStatusDescription">
                        Task is being worked on
                    </p>
                    <p class="fw-bold fs-5 text-center mb-4">Are you sure want to go back to Request?</p>
                    <div class="d-flex justify-content-center gap-3 w-100">
                        <button type="button" class="btn btn-submit-black"
                            id="confirmProgressStatusBtn">Confirm</button>
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Complete Status Modal -->
    <div class="modal fade" id="completeStatusModal" tabindex="-1" aria-labelledby="completeStatusModalLabel"
        aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content modal-content-custom">
                <div class="modal-header modal-header-custom">
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body modal-body-custom d-flex flex-column align-items-center">
                    <h4 class="fw-bold text-center mb-2" id="completeStatusTitle">Completed</h4>
                    <p class="text-center mb-4 modal-description" id="completeStatusDescription">
                        Task has been finished
                    </p>
                    <p class="fw-bold fs-5 text-center mb-4">Are you sure want to Complete?</p>
                    <div class="d-flex justify-content-center gap-3 w-100">
                        <button type="button" class="btn btn-submit-black"
                            id="confirmCompleteStatusBtn">Confirm</button>
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Reject Status Modal -->
    <div class="modal fade" id="rejectStatusModal" tabindex="-1" aria-labelledby="rejectStatusModalLabel"
        aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content modal-content-custom">
                <div class="modal-header modal-header-custom">
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body modal-body-custom d-flex flex-column align-items-center">
                    <h4 class="fw-bold text-center mb-2" id="rejectStatusTitle">Rejected</h4>
                    <p class="text-center mb-4 modal-description" id="rejectStatusDescription">
                        Task has been rejected
                    </p>
                    <p class="fw-bold fs-5 text-center mb-4">Are you sure want to Reject?</p>
                    <div class="d-flex justify-content-center gap-3 w-100">
                        <button type="button" class="btn btn-submit-black"
                            id="confirmRejectStatusBtn">Confirm</button>
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Reference Files Modal -->
    <div class="modal fade" id="referenceFilesModal" tabindex="-1" aria-labelledby="referenceFilesModalLabel"
        aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content modal-content-custom">
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
                    <button type="button" class="btn btn-submit-black" id="addFeedbackButton">
                        Add Feedback
                    </button>
                </div>
            </div>
            <div class="alert-container mt-2"></div>
        </div>
    </div>

    <x-slot name="script_slot">

        <script src="{{ asset('asset/js/task.js') }}?v={{ filemtime(public_path('asset/js/task.js')) }}"></script>

        <script></script>
    </x-slot>
</x-office-layout>
