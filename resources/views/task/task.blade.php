<x-office-layout>
    <x-slot name="menu_active">
        {{ __('task') }}
    </x-slot>
    <x-slot name="head_slot">
        <link rel="stylesheet" href="{{ asset('asset/css/task.css?v=' . time()) }}">
        <!-- Quill editor styles (only for Task page) -->
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

    <div class="d-flex justify-content-between align-items-center mb-4 mt-1 header-task-container">
        <div class="d-flex align-items-center gap-3 left-header-content">
            <div class="title-content">
                <h2>Task</h2>
            </div>
        </div>

        <div class="d-flex align-items-center gap-2">
            <div class="dropdown-filter-container">
                <div class="search-input-container">
                    <span class="material-symbols-outlined search-icon">search</span>
                    <input class="form-control custom-form-filter" type="text" name="search_filter"
                    id="search_filter">
                </div>
                <button class="btn btn-sm toggle-grid d-none" id="gridViewTask" data-bs-toggle="tooltip" title="Grid View">
                    <span class="material-symbols-outlined">grid_view</span>
                </button>
                <button class="btn btn-sm toggle-list" id="listViewTask" data-bs-toggle="tooltip" title="List View">
                    <span class="material-symbols-outlined">list</span>
                </button>
                <button class="btn btn-sm toggle-timeline timeline-toggle-btn" data-bs-toggle="modal"
                    data-bs-target="#timelineModal">
                    <span class="material-symbols-outlined">calendar_month</span>
                </button>

                <button class="btn btn-sm toggle-archieve" data-bs-toggle="modal" data-bs-target="#archieveModal">
                    <span class="material-symbols-outlined">box</span>
                </button>

                <button class="btn btn-icon-toggle toggle-filter align-items-center" type="button" id="openTaskFilterBtn">
                    <span class="material-symbols-outlined icon">filter_list</span> <span
                        class="btn-text-filter">Filter</span>
                </button>

                <div class="dropdown-filter-menu" id="taskFilterDropdown" style="display: none;">
                    <div class="dropdown-filter-body">
                        <div class="d-flex mb-3 w-100">
                            <div class="me-2 w-50">
                                <label for="filterTaskProject" class="form-label label-custom">Project</label>
                                <select id="filterTaskProject" class="form-select">
                                    <option value="">All Projects</option>
                                </select>
                            </div>
                            <div class="w-50">
                                <label for="filterTaskStatus" class="form-label label-custom">Status</label>
                                <select id="filterTaskStatus" class="form-select">
                                    <option value="">All Status</option>
                                    <option value="new_request">New Request</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                    <option value="finished">Finished</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            </div>
                        </div>
                        <div class="d-flex mb-3 w-100">
                            <div class="me-2 w-50">
                                <label for="filterTaskPriority" class="form-label label-custom">Priority</label>
                                <select id="filterTaskPriority" class="form-select">
                                    <option value="">All Priority</option>
                                    <option value="LOW">Low</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HIGH">High</option>
                                </select>
                            </div>
                            <div class="w-50">
                                <label for="filterByDate" class="form-label label-custom">By Date</label>
                                <input class="form-select border-0" type="date" name="filter_by_date"
                                    id="filterByDate">
                            </div>
                        </div>
                    </div>
                    <div class="dropdown-filter-footer">
                        <button type="button" class="btn btn-submit-black" id="resetTaskFilterBtn">Reset</button>
                        <button type="button" class="btn btn-submit-black" id="applyTaskFilterBtn">Apply</button>
                    </div>
                </div>
            </div>

            <a href="{{ route('schedules') }}" class="btn btn-schedule-custom">Schedule</a>
            <button class="btn btn-add-custom" data-bs-toggle="modal" data-bs-target="#addTaskModal">
                <span class="btn-text-add d-none d-md-inline">Add Task</span>
                <span class="material-symbols-outlined btn-mobile-add d-inline d-md-none">add</span>
            </button>
        </div>
    </div>

    <div id="task-cards-container" class="task-container container">
        <div class="row">
            <div class="col-md-3 new-request-container">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <h4 class="task-section-title mb-0">New</h4>
                    <div class="d-flex align-items-center gap-2">
                        <button type="button" id="taskNewBulkAction" class="task-bulk-icon"
                            aria-label="Confirm accept selected tasks">
                            <span class="material-symbols-outlined">done_all</span>
                        </button>
                        <button type="button" id="taskNewBulkProgress" class="task-bulk-icon"
                            aria-label="Move selected tasks to In Progress">
                            <span class="material-symbols-outlined">arrow_right_alt</span>
                        </button>
                        <label for="taskNewAcceptAll" class="task-selectall-toggle">
                            <input class="task-selectall-input" type="checkbox" id="taskNewAcceptAll"
                                aria-label="Select all pending new tasks" />
                        </label>
                    </div>
                </div>
                <div id="newTaskLoading" class="d-flex justify-content-center mt-3 d-none">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
                <div id="new-request-tasks" class="task-list"></div>
            </div>
            <div class="col-md-3 in-progress-container">
                <h4 class="task-section-title">In Progress</h4>
                <div id="progressTaskLoading" class="d-flex justify-content-center mt-3 d-none">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
                <div id="in-progress-tasks" class="task-list"></div>
            </div>
            <div class="col-md-3 completed-container">
                <h4 class="task-section-title">Completed</h4>
                <div id="completedTaskLoading" class="d-flex justify-content-center mt-3 d-none">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
                <div id="completed-tasks" class="task-list"></div>
            </div>
            <div class="col-md-3 finished-container">
                <h4 class="task-section-title">Finish</h4>
                <div id="finishedTaskLoading" class="d-flex justify-content-center mt-3 d-none">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
                <div id="finished-tasks" class="task-list"></div>
            </div>
        </div>
    </div>

    <div id="task-table-section" class="task-table-section d-none">
        <div class="body-content table-container rounded-4 px-4 py-3">
            <table class="table table-borderless align-middle table-transparent">
                <thead>
                    <tr>
                        <th scope="col">Task</th>
                        <th scope="col">PIC</th>
                        <th scope="col">Executors</th>
                        <th scope="col">Start Date</th>
                        <th scope="col">Due Date</th>
                        <th scope="col">Status</th>

                    </tr>
                </thead>
                <tbody>
                    <tr></tr>
                </tbody>
            </table>
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
                    <input type="hidden" id="edit_task_remove_image" name="remove_image" value="0">
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
                            <div id="edit_task_description_editor"
                                style="min-height:120px; background:#fff; border: none; border-radius:6px;">
                            </div>
                            <!-- Keep original textarea as canonical form field but hidden; will be synced with Quill HTML before submit -->
                            <textarea class="form-control input-text d-none" id="edit_task_description" name="description" rows="6"
                                style="display:none;"></textarea>
                        </div>
                        <div class="mb-3 custom-input">
                            <label for="edit_task_project_input" class="form-label label-custom">Project</label>
                            <input type="text" class="form-control input-text" id="edit_task_project_input"
                                autocomplete="off" placeholder="Search project..." required>
                            <div id="edit_task_project_dropdown" class="dropdown-list mt-1"></div>
                            <div id="edit_task_selected_project" class="mt-2"></div>
                            <input type="hidden" id="edit_task_project_id" name="project_id" value="">
                        </div>

                        <div class="mb-3 custom-input">
                            <label for="edit_task_parent_input" class="form-label label-custom">Related to Task
                                (optional)</label>
                            <input type="text" class="form-control input-text" id="edit_task_parent_input"
                                autocomplete="off" placeholder="Search task...">
                            <div id="edit_task_parent_dropdown" class="dropdown-list mt-1"></div>
                            <div id="edit_task_selected_parent" class="mt-2"></div>
                            <input type="hidden" id="edit_task_parent_id" name="parent_id" value="">
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
                                <div class="input-group">
                                    <input type="url" class="form-control input-text" name="reference_urls[]"
                                        placeholder="https://example.com">
                                    <button type="button" class="btn btn-submit-black add-ref-url aria-label="Add
                                        URL">
                                        <span class="material-symbols-outlined">add</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="mb-3 custom-input">
                            <label class="form-label label-custom">Reference Files</label>
                            <div id="edit_task_reference_files_container" class="d-flex flex-column gap-2">
                                <div class="input-group">
                                    <input type="file" class="form-control input-text" name="reference_files[]"
                                        accept="image/*,.csv,.pdf,.doc,.docx,.xls,.xlsx,.zip">
                                    <button type="button" class="btn btn-submit-black add-ref-file"
                                        aria-label="Add File"><span class="material-symbols-outlined">add</span>
                                    </button>
                                </div>
                            </div>
                            <div id="task_existing_reference_files" class="mt-2"></div>
                            <input type="hidden" id="task_existing_reference_files_input" name="existing_reference_files"
                                value="[]">
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
                        <div class="mb-1 custom-input position-relative">
                            <label for="edit_executor_input" class="form-label label-custom">Executor</label>

                            <select aria-label="Division (optional)"
                                class="form-select input-select position-absolute" id="edit_task_division_id"
                                name="division_id">
                                <option value="">Select Division</option>
                            </select>

                            <div id="edit_task_division_activator" class="division-activator position-absolute"
                                aria-hidden="true"></div>
                            <div id="edit_task_division_dropdown" class="dropdown-list mt-1 division-list"></div>
                            <div id="edit_executor_dropdown" class="dropdown-list mt-1 executor-list"></div>
                        </div>
                        <div class="mb-3 custom-input position-relative">
                            <input type="text" class="form-control input-text" id="edit_executor_input"
                                name="executor_input" autocomplete="off" placeholder="Search employees...">

                            <div id="edit_selected_executors" class="mt-2 d-flex flex-wrap gap-2"></div>
                            <input type="hidden" id="edit_executors" name="executors" value="">
                        </div>
                    </div>
                    <div class="modal-footer modal-footer-custom">
                        <button type="button" class="btn-custom-close" data-bs-dismiss="modal">
                            Close
                        </button>
                        <button type="submit" class="btn-submit-custom">
                            Submit
                        </button>
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
                    <div class="d-flex align-items-center gap-2">
                        <span class="timeline-text fw-normal fs-5">Timeline</span>
                        <h5 class="modal-title fw-normal mb-0 fs-5" id="timelineModalTitle"></h5>
                    </div>

                    <div class="d-flex align-items-center gap-2">
                        <button class="btn btn-sm" id="prevTimelineModal">
                            <span class="material-symbols-outlined">chevron_left</span>
                        </button>
                        <button class="btn btn-sm" id="nextTimelineModal">
                            <span class="material-symbols-outlined">chevron_right</span>
                        </button>
                        <button class="btn btn-sm exit-fullscreen-btn" type="button" data-bs-dismiss="modal">
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
    <div class="modal fade" id="addTaskModal" data-bs-keyboard="false" tabindex="-1"
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
                            <!-- Quill editor container for Add Task -->
                            {{-- <div id="task_description_toolbar">
                                <span class="ql-formats">
                                    <button class="ql-bold"></button>
                                    <button class="ql-italic"></button>
                                    <button class="ql-underline"></button>
                                </span>
                                <span class="ql-formats">
                                    <button class="ql-list" value="ordered"></button>
                                    <button class="ql-list" value="bullet"></button>
                                </span>
                                <span class="ql-formats">
                                    <button class="ql-link"></button>
                                </span>
                            </div> --}}
                            <div id="task_description_editor"
                                style="min-height:120px; background:#fff; border: none; border-radius:6px;">
                            </div>
                            <!-- Keep original textarea as canonical form field but hidden; will be synced with Quill HTML before submit -->
                            <textarea class="form-control input-text d-none" id="task_description" name="description" rows="6"
                                style="display:none;"></textarea>
                        </div>
                        <div class="mb-3 custom-input">
                            <label class="form-label label-custom">Project</label>
                            <input type="text" class="form-control input-text" id="task_project_input"
                                autocomplete="off" placeholder="Search project..." required>
                            <div id="task_project_dropdown" class="dropdown-list mt-1"></div>
                            <div id="task_selected_project" class="mt-2"></div>
                            <input type="hidden" id="task_project_id" name="project_id" value="">
                        </div>

                        <div class="mb-3 custom-input">
                            <label class="form-label label-custom">Related to Task (optional)</label>
                            <input type="text" class="form-control input-text" id="task_parent_input"
                                autocomplete="off" placeholder="Search task...">
                            <div id="task_parent_dropdown" class="dropdown-list mt-1"></div>
                            <div id="task_selected_parent" class="mt-2"></div>
                            <input type="hidden" id="task_parent_id" name="parent_id" value="">
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
                        <div class="mb-3 custom-input">
                            <label class="form-label label-custom">Reference Files</label>
                            <div id="task_reference_files_container" class="d-flex flex-column gap-2">
                                <div class="input-group">
                                    <input type="file" class="form-control input-text" name="reference_files[]"
                                        accept="image/*,.csv,.pdf,.doc,.docx,.xls,.xlsx,.zip">
                                    <button type="button" class="btn btn-submit-black add-ref-file"
                                        aria-label="Add File"><span class="material-symbols-outlined">add</span>
                                    </button>
                                </div>
                            </div>
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
                        <div class="mb-1 custom-input position-relative">
                            <label for="executor_input" class="form-label label-custom">Executor</label>

                            <select aria-label="Division (optional)"
                                class="form-select input-select position-absolute" id="task_division_id"
                                name="division_id">
                                <option value="">Select Division</option>
                            </select>
                            <div id="task_division_activator" class="division-activator position-absolute"
                                aria-hidden="true"></div>
                            <div id="task_division_dropdown" class="dropdown-list mt-1 division-list"></div>
                            <div id="executor_dropdown" class="dropdown-list mt-1 executor-list">
                            </div>
                        </div>
                        <div class="mb-3 custom-input position-relative">
                            <input type="text" class="form-control input-text" id="executor_input"
                                name="executor_input" autocomplete="off" placeholder="Search employees...">

                            <div id="selected_executors" class="mt-2 d-flex flex-wrap gap-2">
                            </div>
                            <input type="hidden" id="executors" name="executors" value="">
                        </div>
                    </div>
                    <div class="modal-footer modal-footer-custom">
                        <button type="button" class="btn-custom-close" data-bs-dismiss="modal">
                            Close
                        </button>
                        <button type="submit" class="btn-submit-custom">
                            Submit
                        </button>
                    </div>
                </form>
            </div>
            <div class="alert-container mt-2"></div>
        </div>
    </div>

    <!-- Schedule modal removed; now using separate create page -->

    <!-- Task Detail Modal -->
    <div class="modal fade" id="taskDetailModal" tabindex="-1" aria-labelledby="taskDetailModalLabel"
        aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content modal-content-custom">
                <div class="modal-body modal-body-custom">
                    <div id="taskDetailContent"></div>
                </div>
                <div class="modal-footer modal-footer-custom mt-3">
                    <button type="button" class="btn btn-custom-close" data-bs-dismiss="modal">Close</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Delete Task Confirmation Modal -->
    <div class="modal fade" id="deleteTaskModal" tabindex="-1" aria-labelledby="deleteTaskModalLabel"
        aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered" style="max-width: 500px;">
            <div class="modal-content modal-content-custom">
                <div class="modal-body modal-body-custom">
                    <div id="deleteTaskContent"></div>
                </div>
                <div class="modal-footer modal-footer-custom">
                    <button type="button" class="btn btn-custom-close" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-submit-black" id="confirmDeleteTaskBtn">Delete</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Confirmation Task Modal -->
    <div class="modal fade" id="statusConfirmModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content modal-content-custom">
                <div class="modal-body modal-body-custom">

                    <div class="d-flex mb-3">
                        <div id="statusModalAvatar" class="me-3">

                        </div>

                        <div class="custom-card p-0 m-0 border-0">
                            <small class="text-muted" style="font-size: 10px" id="statusModalPartofProject"></small>
                            <h5 class="fw-bold" id="statusModalTitle" style="font-size: 16px">Task Title</h5>
                            <div class="task-description-container flex-grow-1">
                                <p class="task-description" id="statusModalDescription">
                                    Task short description
                                </p>
                            </div>
                        </div>
                    </div>

                    <hr class="my-3">

                    <p class="fw-normal fs-6 text-center mb-4" id="statusModalConfirmText">
                        Are you sure want to move the task to progress?
                    </p>

                    <div class="modal-footer modal-footer-custom">
                        <button type="button" class="btn btn-custom-close" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-submit-black"
                            id="statusModalConfirmBtn">Confirm</button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    {{-- Completed Modal --}}
    <div class="modal fade" id="completedModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content modal-content-custom">
                <div class="modal-body modal-body-custom">

                    <div class="d-flex align-items-center mb-2" style="flex-direction: row; justify-content: flex-start; text-align: left;">
                        <img id="completed_task_image" src="" alt="Project Image"
                            class="rounded-circle me-2" width="34" height="34">
                        <div class="d-flex flex-column">
                            <h6 id="completed_project_title" class="mb-1 text-muted" style="font-size:10px;"></h6>
                            <h6 id="completed_task_title" class="mb-0 fw-normal" style="font-size:16px;"></h6>
                        </div>
                    </div>

                    <div class="mb-4 task-description-container">
                        <div id="completed_task_note" class="text-muted task-description"></div>
                    </div>

                    <div class="row mb-4 link-file-task">
                        <div class="col-6 d-flex align-items-center">
                            <label class="fw-normal text-muted me-2 mb-0">Priority:</label>
                            <span id="completed_priority"></span>
                        </div>
                        <div class="col-6 d-flex align-items-center">
                            <label class="fw-normal text-muted me-2 mb-0">Complete Date:</label>
                            <span id="completed_date"></span>
                        </div>
                        <div class="col-12">
                            <label class="fw-normal text-muted d-block mb-1">Links:</label>
                            <div id="completed_task_urls"></div>
                        </div>
                        <div class="col-12">
                            <label class="fw-normal text-muted d-block mb-1">Files:</label>
                            <div id="completed_task_files"></div>
                        </div>

                    </div>

                    <div class="modal-footer modal-footer-custom">
                        <button type="button" class="btn btn-custom-close" data-bs-dismiss="modal">Close</button>
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
                <div class="modal-header modal-header-custom d-flex align-items-center justify-content-between">
                    <div>
                        <h5 class="modal-title modal-title-custom fs-5 fw-normal" id="referenceFilesModalLabel">
                            Reference
                            Files</h5>
                    </div>
                    <div>
                        <button type="button" class="btn-close ms-2" data-bs-dismiss="modal"
                            aria-label="Close"></button>
                    </div>
                </div>
                <hr>
                <div class="modal-body modal-body-custom">
                    <div id="referenceFilesList" class="d-flex flex-column gap-2">
                        <!-- Reference files links will be inserted here -->
                    </div>
                </div>
                <div class="modal-footer modal-footer-custom">
                    <button type="button" id="openAddReferenceFilesBtn" class="btn btn-sm btn-submit-black">Add
                        Files</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Add Reference Files Modal -->
    <div class="modal fade" id="addReferenceFilesModal" tabindex="-1" aria-labelledby="addReferenceFilesModalLabel"
        aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content modal-content-custom">
                <div class="modal-header modal-header-custom">
                    <h5 class="modal-title modal-title-custom fs-5 fw-normal" id="addReferenceFilesModalLabel">Add
                        Files</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body modal-body-custom">
                    <form id="addReferenceFilesForm" enctype="multipart/form-data">
                        <input type="hidden" name="task_id" id="addRefTaskId" value="">
                        <div class="mb-3">
                            <label for="add_reference_files" class="form-label">Select files</label>
                            <input type="file" class="form-control" id="add_reference_files"
                                name="reference_files[]" accept="image/*,.csv,.pdf,.doc,.docx,.xls,.xlsx,.zip"
                                multiple>
                        </div>

                        <div id="add_reference_files_preview" class="mt-2"></div>
                    </form>
                </div>
                <div class="modal-footer modal-footer-custom">
                    <button type="button" class="btn btn-custom-close" data-bs-dismiss="modal">Close</button>
                    <button type="button" id="submitAddReferenceFiles" class="btn btn-submit-black">Upload</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Task Feedback Modal -->
    <div class="modal fade" id="taskFeedbackModal" tabindex="-1" aria-labelledby="taskFeedbackModalLabel"
        aria-hidden="true" data-task-id="{{ $taskId ?? '' }}"
        data-employee-id="{{ auth()->user()->employee->id ?? '' }}"
        data-employee-department-id="{{ auth()->user()->employee->department_id ?? '' }}">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable feedback-modal-dialog">
            <div class="modal-content modal-content-custom">
                <div class="modal-header modal-header-custom d-flex align-items-center position-relative flex-nowrap">
                    <h5 class="modal-title feedback-modal-title flex-grow-1 fs-5 fw-normal"
                        id="taskFeedbackModalLabel">Task Feedback</h5>
                    <button type="button" class="btn-close ms-3 flex-shrink-0" data-bs-dismiss="modal"
                        aria-label="Close"></button>
                </div>

                <div class="modal-body feedback-modal-body" id="taskFeedbackList">
                </div>
                <div class="modal-footer modal-footer-custom">
                    <div class="feedback-form w-100">
                        <div id="inline_feedback_editor" class="border-0 ql-container ql-snow"><div class="ql-editor ql-blank" contenteditable="true" data-placeholder="Write feedback..."><p><br></p></div></div>

                        <textarea id="inline_feedback_comment" name="feedback_comment" class="d-none" style="display:none;"></textarea>

                        <div class="d-flex justify-content-between btn-actions-feedback mt-2">
                            <div class="d-flex-justify-content-start">
                                <button type="button" class="btn btn-sm border-0" id="inlineFeedbackPhotoBtn" title="Upload photo">
                                    <span class="material-symbols-outlined feedback-photo-icon">photo</span>
                                </button>
                                <button type="button" class="btn btn-sm border-0" id="inlineFeedbackFileBtn" title="Attach file">
                                    <span class="material-symbols-outlined feedback-file-icon">attach_file</span>
                                </button>
                                <input type="file" id="inline_feedback_image_input" name="feedback_image" accept="image/*" class="d-none">
                                <input type="file" id="inline_feedback_files_input" name="reference_files[]" multiple accept="image/*,.csv,.pdf,.doc,.docx,.xls,.xlsx,.zip,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" class="d-none">
                                <input type="text" id="inline_edit_feedback_input" name="edit_feedback" class="d-none">
                            </div>
                            <div class="d-flex justify-content-end submit-feedback">
                                <button type="button" class="btn btn-submit-black" id="inlineFeedbackSendBtn">
                                    <span class="material-symbols-outlined">send</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="alert-container mt-2"></div>
        </div>
    </div>

    {{-- Archieve Modal --}}
    <div class="modal fade" id="archieveModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable archieve-modal-dialog">
            <div class="modal-content modal-content-custom">
                <div class="modal-header modal-header-custom d-flex align-items-center position-relative flex-nowrap">
                    <h5 class="modal-title feedback-modal-title flex-grow-1 fs-5 fw-normal"
                        id="taskFeedbackModalLabel">Archieve</h5>
                </div>
                <div class="modal-body modal-body-custom">

                </div>
                <div class="modal-footer modal-footer-custom">
                    <button type="button" class="btn btn-custom-close" data-bs-dismiss="modal">Close</button>
                </div>
            </div>
        </div>
    </div>

    <x-slot name="script_slot">

        <script src="https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.min.js"></script>
        <script src="{{ asset('asset/js/date_helper.js?v=' . time()) }}"></script>
        <script src="{{ asset('asset/js/task.js?v=' . time()) }}"></script>

        <!-- Quill editor script and initialization for Task page -->
        <script>
            document.addEventListener('DOMContentLoaded', function() {
                try {
                    // Initialize Quill instances for Add and Edit task modals
                    if (document.getElementById('task_description_editor')) {

                        var addToolbarEl = document.getElementById('task_description_toolbar');
                        var addToolbarConfig = addToolbarEl ? '#task_description_toolbar' : false;
                        window.__quillTaskAdd = new Quill('#task_description_editor', {
                            modules: {
                                toolbar: addToolbarConfig
                            },
                            theme: 'snow'
                        });
                        // Ensure pasted <img> nodes are stripped by Quill's clipboard before insertion
                        try {
                            var Delta = Quill.import && Quill.import('delta');
                            if (window.__quillTaskAdd && window.__quillTaskAdd.clipboard && typeof window.__quillTaskAdd
                                .clipboard.addMatcher === 'function') {
                                window.__quillTaskAdd.clipboard.addMatcher('IMG', function(node, delta) {
                                    try {
                                        return new Delta();
                                    } catch (_) {
                                        return delta;
                                    }
                                });
                            }
                            // Safety: remove any <img> elements after any text-change (Edge may still insert blobs)
                            try {
                                window.__quillTaskAdd.on && window.__quillTaskAdd.on('text-change', function(delta,
                                    oldDelta, source) {
                                    try {
                                        setTimeout(function() {
                                            try {
                                                var imgs = window.__quillTaskAdd.root.querySelectorAll(
                                                    'img');
                                                imgs.forEach(function(i) {
                                                    i.remove();
                                                });
                                            } catch (_) {}
                                        }, 0);
                                    } catch (_) {}
                                });
                            } catch (_) {}
                        } catch (_) {}
                        // prevent images via drop/paste
                        try {
                            preventImageDropAndPaste(window.__quillTaskAdd, '#task_description_editor');
                        } catch (_) {}
                    }
                    if (document.getElementById('edit_task_description_editor')) {
                        // Only attach a toolbar if the toolbar element exists in the DOM.
                        var editToolbarEl = document.getElementById('edit_task_description_toolbar');
                        var editToolbarConfig = editToolbarEl ? '#edit_task_description_toolbar' : false;
                        window.__quillTaskEdit = new Quill('#edit_task_description_editor', {
                            modules: {
                                toolbar: editToolbarConfig
                            },
                            theme: 'snow'
                        });
                        try {
                            var Delta = Quill.import && Quill.import('delta');
                            if (window.__quillTaskEdit && window.__quillTaskEdit.clipboard && typeof window
                                .__quillTaskEdit.clipboard.addMatcher === 'function') {
                                window.__quillTaskEdit.clipboard.addMatcher('IMG', function(node, delta) {
                                    try {
                                        return new Delta();
                                    } catch (_) {
                                        return delta;
                                    }
                                });
                            }
                            try {
                                window.__quillTaskEdit.on && window.__quillTaskEdit.on('text-change', function(delta,
                                    oldDelta, source) {
                                    try {
                                        setTimeout(function() {
                                            try {
                                                var imgs = window.__quillTaskEdit.root.querySelectorAll(
                                                    'img');
                                                imgs.forEach(function(i) {
                                                    i.remove();
                                                });
                                            } catch (_) {}
                                        }, 0);
                                    } catch (_) {}
                                });
                            } catch (_) {}
                        } catch (_) {}
                        try {
                            preventImageDropAndPaste(window.__quillTaskEdit, '#edit_task_description_editor');
                        } catch (_) {}
                    }
                } catch (_) {
                    /* noop if Quill not available */
                }

                // Prevent images from being inserted via drag/drop or paste
                function preventImageDropAndPaste(quill, editorSelector) {
                    try {
                        var editor = document.querySelector(editorSelector);
                        if (!editor || !quill) return;

                        // Use capture-phase listeners to intercept before Quill's handlers run
                        try {
                            editor.addEventListener('dragover', function(e) {
                                try {
                                    e.preventDefault();
                                    e.stopImmediatePropagation();
                                } catch (_) {}
                            }, true);
                        } catch (_) {}

                        // drop: block files (including images) and HTML that contains <img>
                        try {
                            editor.addEventListener('drop', function(e) {
                                try {
                                    if (!e.dataTransfer) return;
                                    var hasFiles = e.dataTransfer.files && e.dataTransfer.files.length > 0;
                                    var html = '';
                                    try {
                                        html = e.dataTransfer.getData && e.dataTransfer.getData('text/html') ||
                                            '';
                                    } catch (_) {}
                                    if (hasFiles || /<img\s*/i.test(html)) {
                                        e.preventDefault();
                                        e.stopImmediatePropagation();
                                        return; // do nothing
                                    }
                                } catch (_) {}
                            }, true);
                        } catch (_) {}

                        // paste: if clipboard contains image items or HTML with <img>, prevent entirely (no insert)
                        try {
                            editor.addEventListener('paste', function(e) {
                                try {
                                    var clipboard = (e.clipboardData || window.clipboardData);
                                    if (!clipboard) return;

                                    var items = clipboard.items || [];
                                    var hasImage = false;
                                    for (var i = 0; i < items.length; i++) {
                                        var t = items[i].type || '';
                                        if (t.indexOf && t.indexOf('image') === 0) {
                                            hasImage = true;
                                            break;
                                        }
                                    }

                                    var html = '';
                                    try {
                                        html = clipboard.getData && clipboard.getData('text/html') || '';
                                    } catch (_) {}

                                    if (hasImage || /<img\s*/i.test(html)) {
                                        // block default paste which would insert the image or any html containing images
                                        e.preventDefault();
                                        e.stopImmediatePropagation();
                                        return; // do not insert anything (no blink)
                                    }
                                    // Otherwise allow normal paste (text or non-image html)
                                } catch (_) {}
                            }, true);
                        } catch (_) {}
                    } catch (_) {}
                }

                function syncQuillToTextarea(quill, textareaId) {
                    try {
                        const ta = document.getElementById(textareaId);
                        if (!ta) return;
                        const html = (quill && quill.root && typeof quill.root.innerHTML === 'string') ? quill.root
                            .innerHTML : '';
                        ta.value = html;
                    } catch (_) {}
                }

                // Use capture-phase submit listener to ensure sync runs before any other submit handlers
                const addForm = document.getElementById('addTaskForm');
                if (addForm) {
                    addForm.addEventListener('submit', function(e) {
                        try {
                            if (window.__quillTaskAdd) syncQuillToTextarea(window.__quillTaskAdd,
                                'task_description');
                            // Basic non-empty validation (strip whitespace)
                            const plain = (window.__quillTaskAdd && typeof window.__quillTaskAdd.getText ===
                                'function') ? window.__quillTaskAdd.getText().trim() : '';
                            if (!plain) {
                                e.preventDefault();
                                e.stopImmediatePropagation();
                                try {
                                    window.__quillTaskAdd.focus();
                                } catch (_) {}
                                return false;
                            }
                        } catch (_) {}
                    }, true);
                }

                const editForm = document.getElementById('editTaskForm');
                if (editForm) {
                    editForm.addEventListener('submit', function(e) {
                        try {
                            if (window.__quillTaskEdit) syncQuillToTextarea(window.__quillTaskEdit,
                                'edit_task_description');
                            const plain = (window.__quillTaskEdit && typeof window.__quillTaskEdit.getText ===
                                'function') ? window.__quillTaskEdit.getText().trim() : '';
                            if (!plain) {
                                e.preventDefault();
                                e.stopImmediatePropagation();
                                try {
                                    window.__quillTaskEdit.focus();
                                } catch (_) {}
                                return false;
                            }
                        } catch (_) {}
                    }, true);
                }

                // Clear editors when modals hide (keep canonical textareas in sync)
                try {
                    $('#addTaskModal').on('hidden.bs.modal', function() {
                        try {
                            if (window.__quillTaskAdd && window.__quillTaskAdd.root) window.__quillTaskAdd.root
                                .innerHTML = '';
                        } catch (_) {}
                        try {
                            const ta = document.getElementById('task_description');
                            if (ta) ta.value = '';
                        } catch (_) {}
                    });
                    $('#editTaskModal').on('hidden.bs.modal', function() {
                        try {
                            if (window.__quillTaskEdit && window.__quillTaskEdit.root) window.__quillTaskEdit
                                .root.innerHTML = '';
                        } catch (_) {}
                        try {
                            const ta = document.getElementById('edit_task_description');
                            if (ta) ta.value = '';
                        } catch (_) {}
                    });
                } catch (_) {}

                // Polling fallback: if edit textarea is updated programmatically (task.js), mirror into Quill
                try {
                    let lastEditTa = document.getElementById('edit_task_description')?.value || '';
                    setInterval(function() {
                        try {
                            const ta = document.getElementById('edit_task_description');
                            if (!ta || !window.__quillTaskEdit || !window.__quillTaskEdit.root) return;
                            if (ta.value !== lastEditTa) {
                                lastEditTa = ta.value;
                                window.__quillTaskEdit.root.innerHTML = ta.value || '';
                            }
                        } catch (_) {}
                    }, 300);
                } catch (_) {}
            });
        </script>
    </x-slot>
</x-office-layout>
