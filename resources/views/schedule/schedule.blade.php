<x-office-layout>
    <x-slot name="menu_active">
        {{ __('task') }}
    </x-slot>
    <x-slot name="head_slot">
        <link rel="stylesheet" href="{{ asset('asset/css/schedule.css?v=' . time()) }}">
        <link rel="stylesheet" href="{{ asset('asset/css/schedule-create.css?v=' . time()) }}">
        <!-- Quill editor styles (only for Schedule page) -->
        <link href="https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.snow.css" rel="stylesheet">
    </x-slot>

    <div class="d-flex justify-content-between align-items-center mb-4 schedule-header">
        <div class="title-content d-flex align-items-center gap-2 mb-3">
            <div class="nav-item d-inline-block">
                <div class="nav-icon-arrow">
                    <a href="{{ url('task') }}" class="text-decoration-none text-dark d-flex align-items-center">
                        <span class="material-symbols-outlined">arrow_back</span>
                    </a>
                </div>
            </div>
            <h2 class="m-0">Schedule</h2>
        </div>
        <div class="btn-filter-container mb-3">
            <div class="search-input-container position-relative me-3">
                <span class="material-symbols-outlined search-icon">search</span>
                <input class="form-control custom-form-filter ps-5" type="text" name="search_filter"
                    autocomplete="off" id="search_filter">
            </div>
            <button class="btn btn-icon-toggle btn-filter-custom me-3" type="button" id="openProjectFilterBtn"
                data-bs-toggle="dropdown" aria-expanded="false">
                <span class="material-symbols-outlined icon">filter_list</span>
                <span class="text-btn">Filter</span>
            </button>
            <button data-bs-target="#scheduleCreateModal" data-bs-toggle="modal"
                class="btn btn-icon-toggle btn-schedule-custom">Add <span class="text-btn">Schedule</span>
            </button>
            <div class="dropdown-menu dropdown-filter-menu" aria-labelledby="openProjectFilterBtn">
                <div class="dropdown-filter-body">
                    <div class="mb-3">
                        <label for="filterScheduleRecurrence" class="form-label label-custom">Filter by
                            Recurrence</label>
                        <select id="filterScheduleRecurrence" class="form-select">
                            <option value="">All Types</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                        </select>
                    </div>
                </div>
                <div class="dropdown-filter-footer">
                    <button type="button" class="btn btn-submit-black" id="applyScheduleFilterBtn">Apply</button>
                    <button type="button" class="btn btn-submit-black" id="resetScheduleFilterBtn">Reset</button>
                </div>
            </div>
        </div>
    </div>

    <div class="schedule-card-container">
        <div class="project-content">
            <div id="scheduleContainer" class="row g-3 schedule-container"></div>
            <nav aria-label="...">
                <ul class="pagination pagination-sm justify-content-center">
                    <li class="page-item active">
                    </li>
                </ul>
            </nav>
        </div>
    </div>

    {{-- Create Schedule modal --}}
    <div class="modal fade" id="scheduleCreateModal" tabindex="-1" aria-labelledby="scheduleCreateModalLabel"
        aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content modal-content-custom">
                <div class="modal-loading-overlay d-none" id="editTaskModalLoader">
                    <div class="loader-spinner"></div>
                </div>
                <div class="modal-header modal-header-custom">
                    <h5 class="modal-title modal-title-custom" id="scheduleCreateModalLabel">Create Schedule</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>

                <form id="scheduleCreateForm" class="needs-validation" enctype="multipart/form-data" novalidate>
                    <div class="modal-body modal-body-custom">
                        <div class="d-flex flex-column">

                            <input type="hidden" id="schedule_recurrence_start_date" name="recurrence_start_date"
                                value="{{ now()->toDateString() }}">
                            <input type="hidden" id="schedule_recurrence_end_date" name="recurrence_end_date"
                                value="">

                            <!-- Upload Image -->
                            <div class="mb-3">
                                <div class="title-label-image label-custom">Upload Image</div>
                                <label for="schedule_image"
                                    class="custom-image-upload-photo position-relative photo-upload"
                                    id="scheduleImageLabel">
                                    <input type="file" id="schedule_image" name="image" accept="image/*" hidden>
                                    <span class="image-clear-btn d-none" id="scheduleImageClearBtn">&times;</span>
                                </label>
                            </div>

                            <!-- Recurrence Type -->
                            <div class="mb-3 custom-form-employee">
                                <label for="schedule_recurrence_type" class="form-label label-custom">Repeat</label>
                                <select id="schedule_recurrence_type" name="recurrence_type"
                                    class="form-select input-select" required>
                                    <option value="" selected>Select Option Schedule</option>
                                    <option value="daily">Every Day</option>
                                    <option value="weekly">Every Week</option>
                                    <option value="monthly">Every Month</option>
                                </select>
                                <div class="invalid-feedback">Please select recurrence type.</div>
                            </div>
                            <!-- include_weekend removed -->

                            <!-- Weekly options -->
                            <div class="mb-3 custom-form-employee d-none" id="schedule_weekly_opts">
                                <label for="schedule_recurrence_day_of_week" class="form-label label-custom">Day of
                                    Week</label>
                                <select class="form-select input-select" id="schedule_recurrence_day_of_week"
                                    name="recurrence_day_of_week">
                                    <option value="0">Sunday</option>
                                    <option value="1">Monday</option>
                                    <option value="2">Tuesday</option>
                                    <option value="3">Wednesday</option>
                                    <option value="4">Thursday</option>
                                    <option value="5">Friday</option>
                                    <option value="6">Saturday</option>
                                </select>
                            </div>

                            <!-- Weekday picker for Daily: allow selecting multiple weekdays instead of a single date -->
                            <div class="mb-3 custom-form-employee d-none" id="schedule_daily_weekdays">
                                <label class="form-label label-custom">Pick weekdays</label>
                                <div class="d-flex flex-wrap gap-2" id="schedule_daily_weekdays_buttons">
                                    <button type="button" class="btn btn-outline-secondary btn-sm weekday-btn"
                                        data-day="0">Sunday</button>
                                    <button type="button" class="btn btn-outline-secondary btn-sm weekday-btn"
                                        data-day="1">Monday</button>
                                    <button type="button" class="btn btn-outline-secondary btn-sm weekday-btn"
                                        data-day="2">Tuesday</button>
                                    <button type="button" class="btn btn-outline-secondary btn-sm weekday-btn"
                                        data-day="3">Wednesday</button>
                                    <button type="button" class="btn btn-outline-secondary btn-sm weekday-btn"
                                        data-day="4">Thursday</button>
                                    <button type="button" class="btn btn-outline-secondary btn-sm weekday-btn"
                                        data-day="5">Friday</button>
                                    <button type="button" class="btn btn-outline-secondary btn-sm weekday-btn"
                                        data-day="6">Saturday</button>
                                </div>
                                <input type="hidden" id="schedule_recurrence_days_of_week"
                                    name="recurrence_days_of_week" value="[]">
                            </div>

                            <!-- Date options -->
                            <div class="mb-3 custom-form-employee" id="schedule_date_opts">
                                <div class="d-flex gap-2">
                                    <!-- Start Date -->
                                    <div class="w-50" id="schedule_start_at_div">
                                        <label for="schedule_start_at" class="form-label label-custom">Start
                                            At</label>
                                        <input type="date" id="schedule_start_at" name="start_at"
                                            class="form-control input-text" required>
                                        <div class="invalid-feedback">Start date is required.</div>
                                    </div>
                                    <!-- End Date -->
                                    <div class="w-50" id="schedule_end_at_div">
                                        <label for="schedule_end_at" class="form-label label-custom">End At</label>
                                        <input type="date" id="schedule_end_at" name="end_at"
                                            class="form-control input-text">
                                    </div>
                                </div>
                            </div>

                            <!-- Points -->
                            <div class="mb-3 custom-form-employee">
                                <label for="schedule_point" class="form-label label-custom">Point</label>
                                <input type="number" id="schedule_point" name="point" value="1"
                                    min="1" class="form-control input-text" required>
                                <div class="invalid-feedback">Point required.</div>
                            </div>

                            <!-- Priority -->
                            <div class="mb-3 custom-form-employee">
                                <label for="schedule_priority" class="form-label label-custom">Priority</label>
                                <select id="schedule_priority" name="priority" class="form-select input-select"
                                    required>
                                    <option value="">Select Priority</option>
                                    <option value="HIGH">HIGH</option>
                                    <option value="MEDIUM">MEDIUM</option>
                                    <option value="LOW">LOW</option>
                                </select>
                                <div class="invalid-feedback">Priority required.</div>
                            </div>

                            <!-- Due in days -->
                            <div class="mb-3 custom-form-employee">
                                <label for="schedule_due_in_days" class="form-label label-custom">Due date
                                    (days)</label>
                                <input type="number" min="0" id="schedule_due_in_days" name="due_in_days"
                                    class="form-control input-text" placeholder="e.g. 3">
                                <div class="form-text">Due date = Start date + Total days.</div>
                            </div>

                            <!-- Title -->
                            <div class="mb-3 custom-form-employee">
                                <label for="schedule_title" class="form-label label-custom">Title</label>
                                <input type="text" id="schedule_title" name="title"
                                    class="form-control input-text" required>
                                <div class="invalid-feedback">Title required.</div>
                            </div>

                            <!-- Description (Quill) -->
                            <div class="mb-3 custom-form-employee">
                                <label for="schedule_description" class="form-label label-custom">Description</label>
                                <div id="schedule_description_toolbar">
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
                                </div>
                                <div id="schedule_description_editor" style="min-height:120px; background:#fff; border:1px solid #e3e6ee; border-radius:6px;"></div>
                                <!-- Keep original textarea as canonical form field but hidden; will be synced with Quill HTML before submit -->
                                <textarea class="form-control input-text d-none" id="schedule_description" name="description" rows="6" style="display:none;"></textarea>
                            </div>

                            <!-- Project -->
                            {{-- <div class="mb-3 custom-form-employee">
                                <label for="schedule_project_id" class="form-label label-custom">Project <span class="text-danger">*</span></label>
                                <!-- Hidden field to indicate modal opened from a project context -->
                                <input type="hidden" id="schedule_project_context_id" name="project_context_id"
                                    value="">
                                <select id="schedule_project_id" name="project_id" class="form-select input-select"
                                    required>
                                    <option value="">No Project</option>
                                </select>
                                <div class="invalid-feedback">Please select a project.</div>
                            </div> --}}
                            <div class="mb-3 custom-form-employee">
                                <label class="form-label label-custom">Project <span class="text-danger">*</span></label>
                                <input type="text" class="form-control input-text"
                                    id="schedule_project_context_id" autocomplete="off"
                                    placeholder="Search project..." required>
                                <div id="schedule_project_dropdown" class="dropdown-list mt-1"></div>
                                <div id="schedule_selected_project" class="mt-2"></div>
                                <input type="hidden" id="schedule_project_id" name="project_id" value="" required>
                            </div>

                            <!-- Parent Task selector -->
                            <div class="mb-3 custom-form-employee">
                                <label class="form-label label-custom">Related to Task (optional)</label>
                                <input type="text" class="form-control input-text" id="schedule_parent_input" autocomplete="off" placeholder="Search existing task...">
                                <div id="schedule_parent_dropdown" class="dropdown-list mt-1"></div>
                                <div id="schedule_selected_parent" class="mt-2"></div>
                                <input type="hidden" id="schedule_parent_id" name="parent_id" value="">
                            </div>

                            <!-- Reference URLs -->
                            <div class="mb-3 custom-form-employee">
                                <label class="form-label label-custom">Reference URLs</label>
                                <div id="schedule_reference_urls_container" class="d-flex flex-column gap-2">
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

                            <!-- Reference Files -->
                            <div class="mb-3 custom-form-employee">
                                <label for="schedule_reference_files" class="form-label label-custom">Reference
                                    Files</label>
                                <input type="file" id="schedule_reference_files" name="reference_files[]"
                                    class="form-control input-text" accept="image/*,.csv,.pdf,.doc,.docx,.xls,.xlsx,.zip"
                                    multiple>
                                <div class="form-text">Multiple files supported.</div>
                                <div id="schedule_reference_files_preview" class="mt-2"></div>
                            </div>
                            <div class="mb-1 custom-form-employee position-relative">
                                <label for="schedule_executor_input" class="form-label label-custom">Executor <span class="text-danger">*</span></label>

                                <select aria-label="Division (optional)"
                                    class="form-select input-select position-absolute" id="schedule_division_id"
                                    name="division_id">
                                    <option value="">Select Division</option>
                                </select>

                                <div id="schedule_division_activator" class="division-activator position-absolute"
                                    aria-hidden="true"></div>
                                <div id="schedule_division_dropdown" class="dropdown-list mt-1 division-list"></div>
                                <div id="schedule_executor_dropdown" class="dropdown-list mt-1 executor-list dropup">
                                </div>
                            </div>

                            <div class="mb-3 custom-form-employee position-relative">
                                <input type="text" id="schedule_executor_input" class="form-control input-text"
                                    placeholder="Search employees..." autocomplete="off">
                                <div id="schedule_selected_executors" class="mt-2 d-flex flex-wrap gap-2"></div>
                                <input type="hidden" id="schedule_executors" name="executor_ids" value="[]">
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer modal-footer-custom">
                        <button type="button" class="btn btn-custom-close" data-bs-dismiss="modal">Cancel</button>
                        <button type="submit" class="btn btn-submit-black">Create Schedule</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    {{-- Detail Schedule modal --}}
    <div class="modal fade" id="scheduleDetailModal" tabindex="-1" aria-labelledby="scheduleDetailModalLabel"
        aria-hidden="true">
        <div class="modal-dialog modal-xl">
            <div class="modal-content modal-content-custom">
                <div class="modal-loading-overlay d-none" id="detailScheduleModalLoader">
                    <div class="loader-spinner"></div>
                </div>
                <div class="modal-header modal-header-custom">
                    <h5 class="modal-title" id="scheduleDetailModalLabel">Schedule Detail</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>

                <div class="modal-body modal-body-custom">
                    <div class="d-flex flex-column gap-3">
                        <!-- Schedule Card -->
                        <div id="scheduleDetailCard" class="mb-4">
                            <!-- Card content will be populated by JavaScript -->
                        </div>

                        <!-- Executors Section -->
                        <div class="card p-3">
                            <h6 class="mb-3">Executors</h6>
                            <div id="scheduleDetailExecutors" class="d-flex flex-wrap gap-2">
                                <!-- Executor details will be populated by JavaScript -->
                            </div>
                        </div>

                        <!-- Departments and Divisions Section -->
                        <div class="card p-3">
                            <h6 class="mb-3">Departments and Divisions</h6>
                            <div id="scheduleDetailDepartmentsDivisions" class="d-flex flex-wrap gap-2">
                                <!-- Department and division details will be populated by JavaScript -->
                            </div>
                        </div>
                    </div>
                </div>

                <div class="modal-footer modal-footer-custom">
                    <button type="button" class="btn btn-custom-close" data-bs-dismiss="modal">Close</button>
                </div>
            </div>
        </div>
    </div>

    {{-- Edit Schedule modal --}}
    <div class="modal fade" id="scheduleEditModal" tabindex="-1" aria-labelledby="scheduleEditModalLabel"
        aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content modal-content-custom">
                <div class="modal-loading-overlay d-none" id="editScheduleModalLoader">
                    <div class="loader-spinner"></div>
                </div>
                <div class="modal-header modal-header-custom">
                    <h5 class="modal-title modal-title-custom" id="scheduleEditModalLabel">Edit Schedule</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>

                <form id="scheduleEditForm" class="needs-validation" enctype="multipart/form-data" novalidate>
                    <div class="modal-body modal-body-custom">
                        @csrf
                        <input type="hidden" name="_method" value="PUT">
                        <input type="hidden" id="edit_schedule_id">
                        <div class="d-flex flex-column">

                            <input type="hidden" id="edit_schedule_recurrence_start_date"
                                name="recurrence_start_date" value="{{ now()->toDateString() }}">
                            <input type="hidden" id="edit_schedule_recurrence_end_date" name="recurrence_end_date"
                                value="">
                            <input type="hidden" id="edit_schedule_next_run_at" name="next_run_at" value="">

                            <!-- Upload Image -->
                            <div class="mb-3">
                                <div class="title-label-image label-custom">Upload Image</div>
                                <label for="edit_schedule_image"
                                    class="custom-image-upload-photo position-relative photo-upload"
                                    id="editScheduleImageLabel">
                                    <img id="edit_schedule_current_image_display" src="" alt="Current Image"
                                        style="display:none; width:100%; height:100%; object-fit:cover; border-radius:10px;">
                                    <input type="file" id="edit_schedule_image" name="image" accept="image/*"
                                        hidden>
                                    <span class="image-clear-btn d-none" id="editScheduleImageClearBtn">&times;</span>
                                </label>
                                <input type="hidden" id="edit_schedule_current_image" name="current_image"
                                    value="">
                            </div>

                            <!-- Recurrence Type -->
                            <div class="mb-3 custom-form-employee">
                                <label for="edit_schedule_recurrence_type"
                                    class="form-label label-custom">Repeat</label>
                                <select id="edit_schedule_recurrence_type" name="recurrence_type"
                                    class="form-select input-select" required>
                                    <option value="" selected>Select Option Schedule</option>
                                    <option value="daily">Every Day</option>
                                    <option value="weekly">Every Week</option>
                                    <option value="monthly">Every Month</option>
                                </select>
                                <div class="invalid-feedback">Please select recurrence type.</div>
                            </div>
                            <!-- include_weekend removed -->

                            <!-- Weekly options -->
                            <div class="mb-3 custom-form-employee d-none" id="edit_schedule_weekly_opts">
                                <label for="edit_schedule_recurrence_day_of_week" class="form-label label-custom">Day
                                    of
                                    Week</label>
                                <select class="form-select input-select" id="edit_schedule_recurrence_day_of_week"
                                    name="recurrence_day_of_week">
                                    <option value="0">Sunday</option>
                                    <option value="1">Monday</option>
                                    <option value="2">Tuesday</option>
                                    <option value="3">Wednesday</option>
                                    <option value="4">Thursday</option>
                                    <option value="5">Friday</option>
                                    <option value="6">Saturday</option>
                                </select>
                            </div>

                            <!-- Weekday picker for Daily in edit modal -->
                            <div class="mb-3 custom-form-employee d-none" id="edit_schedule_daily_weekdays">
                                <label class="form-label">Pick weekdays</label>
                                <div class="d-flex flex-wrap gap-2" id="edit_schedule_daily_weekdays_buttons">
                                    <button type="button" class="btn btn-outline-secondary btn-sm edit-weekday-btn"
                                        data-day="0">Sunday</button>
                                    <button type="button" class="btn btn-outline-secondary btn-sm edit-weekday-btn"
                                        data-day="1">Monday</button>
                                    <button type="button" class="btn btn-outline-secondary btn-sm edit-weekday-btn"
                                        data-day="2">Tuesday</button>
                                    <button type="button" class="btn btn-outline-secondary btn-sm edit-weekday-btn"
                                        data-day="3">Wednesday</button>
                                    <button type="button" class="btn btn-outline-secondary btn-sm edit-weekday-btn"
                                        data-day="4">Thursday</button>
                                    <button type="button" class="btn btn-outline-secondary btn-sm edit-weekday-btn"
                                        data-day="5">Friday</button>
                                    <button type="button" class="btn btn-outline-secondary btn-sm edit-weekday-btn"
                                        data-day="6">Saturday</button>
                                </div>
                                <input type="hidden" id="edit_schedule_recurrence_days_of_week"
                                    name="recurrence_days_of_week" value="[]">
                            </div>

                            <!-- Monthly options -->
                            <div class="mb-3 custom-form-employee" id="edit_schedule_date_opts">
                                <div class="d-flex gap-2">
                                    <!-- Start Date -->
                                    <div class="w-50">
                                        <label for="edit_schedule_start_at" class="form-label label-custom">Start
                                            At</label>
                                        <input type="date" id="edit_schedule_start_at" name="start_at"
                                            class="form-control input-text">
                                    </div>

                                    <!-- End Date -->
                                    <div class="w-100" id="edit_schedule_end_at_div">
                                        <label for="edit_schedule_end_at" class="form-label label-custom">End
                                            At</label>
                                        <input type="date" id="edit_schedule_end_at" name="end_at"
                                            class="form-control input-text">
                                    </div>
                                </div>
                            </div>

                            <!-- Monthly options hidden helpers expected by JS -->
                            <div class="d-none" id="edit_schedule_monthly_opts">
                                <input type="hidden" id="edit_schedule_recurrence_day_of_month"
                                    name="recurrence_day_of_month" value="">
                                <input type="hidden" id="edit_schedule_monthly_date" name="recurrence_monthly_date"
                                    value="">
                            </div>

                            <!-- Points -->
                            <div class="mb-3 custom-form-employee">
                                <label for="edit_schedule_point" class="form-label label-custom">Point</label>
                                <input type="number" id="edit_schedule_point" name="point" value="1"
                                    min="1" class="form-control input-text" required>
                                <div class="invalid-feedback">Point required.</div>
                            </div>

                            <!-- Priority -->
                            <div class="mb-3 custom-form-employee">
                                <label for="edit_schedule_priority" class="form-label label-custom">Priority</label>
                                <select id="edit_schedule_priority" name="priority" class="form-select input-select"
                                    required>
                                    <option value="">Select Priority</option>
                                    <option value="HIGH">HIGH</option>
                                    <option value="MEDIUM">MEDIUM</option>
                                    <option value="LOW">LOW</option>
                                </select>
                                <div class="invalid-feedback">Priority required.</div>
                            </div>

                            <!-- Due in days -->
                            <div class="mb-3 custom-form-employee">
                                <label for="edit_schedule_due_in_days" class="form-label label-custom">Due date
                                    (days)</label>
                                <input type="number" min="0" id="edit_schedule_due_in_days"
                                    name="due_in_days" class="form-control input-text" placeholder="e.g. 3">
                                <div class="form-text">Due date = Start date + Total days.</div>
                            </div>

                            <!-- Title -->
                            <div class="mb-3 custom-form-employee">
                                <label for="edit_schedule_title" class="form-label label-custom">Title</label>
                                <input type="text" id="edit_schedule_title" name="title"
                                    class="form-control input-text" required>
                                <div class="invalid-feedback">Title required.</div>
                            </div>

                            <!-- Description (Quill) -->
                            <div class="mb-3 custom-form-employee">
                                <label for="edit_schedule_description" class="form-label label-custom">Description</label>
                                <div id="edit_schedule_description_toolbar">
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
                                </div>
                                <div id="edit_schedule_description_editor" style="min-height:120px; background:#fff; border:1px solid #e3e6ee; border-radius:6px;"></div>
                                <!-- Keep original textarea as canonical form field but hidden; will be synced with Quill HTML before submit -->
                                <textarea class="form-control input-text d-none" id="edit_schedule_description" name="description" rows="6" style="display:none;"></textarea>
                            </div>

                            <div class="mb-3 custom-form-employee">
                                <label for="edit_schedule_project_id" class="form-label label-custom">Project <span class="text-danger">*</span></label>
                                <input type="text" class="form-control input-text" id="edit_schedule_project_search"
                                    autocomplete="off" placeholder="Search project..." required>

                                <div id="edit_schedule_project_dropdown" class="dropdown-list mt-1"></div>
                                <div id="edit_schedule_selected_project" class="mt-2"></div>

                                <input type="hidden" id="edit_schedule_project_id" name="project_id" value="" required>
                            </div>

                            <!-- Parent Task selector (edit) -->
                            <div class="mb-3 custom-form-employee">
                                <label class="form-label label-custom">Related to Task (optional)</label>
                                <input type="text" class="form-control input-text" id="edit_schedule_parent_input" autocomplete="off" placeholder="Search existing task...">
                                <div id="edit_schedule_parent_dropdown" class="dropdown-list mt-1"></div>
                                <div id="edit_schedule_selected_parent" class="mt-2"></div>
                                <input type="hidden" id="edit_schedule_parent_id" name="parent_id" value="">
                            </div>

                            <!-- Reference URLs -->
                            <div class="mb-3 custom-form-employee">
                                <label class="form-label label-custom">Reference URLs</label>
                                <div id="edit_schedule_reference_urls_container" class="d-flex flex-column gap-2">
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

                            <!-- Reference Files -->
                            <div class="mb-3 custom-form-employee">
                                <label for="edit_schedule_reference_files" class="form-label label-custom">Reference
                                    Files</label>
                                <input type="file" id="edit_schedule_reference_files" name="reference_files[]"
                                    class="form-control input-text" accept="image/*,.csv,.pdf,.doc,.docx,.xls,.xlsx,.zip"
                                    multiple>
                                <div class="form-text">Multiple files supported.</div>
                                <div id="edit_schedule_reference_files_preview" class="mt-2"></div>
                            </div>

                            <!-- Executors -->
                            <div class="mb-1 custom-form-employee">
                                <label for="edit_schedule_executor_input"
                                    class="form-label label-custom">Executor <span class="text-danger">*</span></label>
                                <!-- Division (optional) - same behavior as edit task modal -->
                                <select aria-label="Division (optional)"
                                    class="form-select input-select position-absolute" id="edit_schedule_division_id"
                                    name="division_id">
                                    <option value="">Select Division</option>
                                </select>
                                <div id="edit_schedule_division_activator"
                                    class="division-activator position-absolute" aria-hidden="true"></div>
                                <div id="edit_schedule_division_dropdown" class="dropdown-list mt-1 division-list">
                                </div>
                                <div id="edit_schedule_executor_dropdown"
                                    class="dropdown-list mt-1 executor-list dropup">
                                </div>

                            </div>
                            <div class="mb-3 custom-form-employee position-relative">
                                <input type="text" id="edit_schedule_executor_input"
                                    class="form-control input-text" placeholder="Search employees..."
                                    autocomplete="off">
                                <div id="edit_schedule_selected_executors" class="mt-2 d-flex flex-wrap gap-2"></div>
                                <input type="hidden" id="edit_schedule_executors" name="executor_ids"
                                    value="[]">
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer modal-footer-custom">
                        <button type="button" class="btn btn-custom-close" data-bs-dismiss="modal">Cancel</button>
                        <button type="submit" class="btn btn-submit-black">Update Schedule</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <div class="modal fade" id="deleteScheduleModal" tabindex="-1" aria-labelledby="deleteScheduleModalLabel"
        aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered" style="max-width: 500px;">
            <div class="modal-content modal-content-custom">
                <div class="modal-body modal-body-custom">
                    <div id="deleteScheduleContent"></div>
                </div>
                <div class="modal-footer modal-footer-custom">
                    <button type="button" class="btn btn-custom-close" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-submit-black" id="confirmDeleteBtn">Delete</button>
                </div>
            </div>
        </div>
    </div>

    <x-slot name="script_slot">

        <script src="{{ asset('asset/js/schedule.js?v=' . time()) }}"></script>
    <script src="{{ asset('asset/js/task.js?v=' . time()) }}"></script>
    <script src="{{ asset('asset/js/schedule-create.js?v=' . time()) }}"></script>

        <!-- Quill JS and initializer for Schedule page -->
        <script src="https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.min.js"></script>
        <script>
            document.addEventListener('DOMContentLoaded', function(){
                try {
                    if (document.getElementById('schedule_description_editor')) {
                        window.__quillScheduleCreate = new Quill('#schedule_description_editor', { modules: { toolbar: '#schedule_description_toolbar' }, theme: 'snow' });
                    }
                    if (document.getElementById('edit_schedule_description_editor')) {
                        window.__quillScheduleEdit = new Quill('#edit_schedule_description_editor', { modules: { toolbar: '#edit_schedule_description_toolbar' }, theme: 'snow' });
                    }
                } catch(_) {}

                // Harden: ensure pasted/dropped images are not inserted (defense-in-depth)
                try {
                    var Delta = Quill.import && Quill.import('delta');

                    if (window.__quillScheduleCreate && window.__quillScheduleCreate.clipboard && typeof window.__quillScheduleCreate.clipboard.addMatcher === 'function') {
                        window.__quillScheduleCreate.clipboard.addMatcher('IMG', function(node, delta){ try { return new Delta(); } catch(_) { return delta; } });
                    }
                    if (window.__quillScheduleCreate && typeof window.__quillScheduleCreate.on === 'function') {
                        window.__quillScheduleCreate.on('text-change', function(){ try { var imgs = window.__quillScheduleCreate.root.querySelectorAll('img'); imgs.forEach(function(i){ i.remove(); }); } catch(_){} });
                    }
                    try { preventImageDropAndPaste(window.__quillScheduleCreate, '#schedule_description_editor'); } catch(_) {}

                    if (window.__quillScheduleEdit && window.__quillScheduleEdit.clipboard && typeof window.__quillScheduleEdit.clipboard.addMatcher === 'function') {
                        window.__quillScheduleEdit.clipboard.addMatcher('IMG', function(node, delta){ try { return new Delta(); } catch(_) { return delta; } });
                    }
                    if (window.__quillScheduleEdit && typeof window.__quillScheduleEdit.on === 'function') {
                        window.__quillScheduleEdit.on('text-change', function(){ try { var imgs = window.__quillScheduleEdit.root.querySelectorAll('img'); imgs.forEach(function(i){ i.remove(); }); } catch(_){} });
                    }
                    try { preventImageDropAndPaste(window.__quillScheduleEdit, '#edit_schedule_description_editor'); } catch(_) {}
                } catch(_) {}

                function syncQuillToTextarea(quill, textareaId){
                    try { const ta = document.getElementById(textareaId); if(!ta) return; ta.value = (quill && quill.root && typeof quill.root.innerHTML === 'string') ? quill.root.innerHTML : ''; } catch(_) {}
                }

                // Helper: install capture-phase listeners on the editor container to block image drag/drop and paste
                function preventImageDropAndPaste(quill, editorSelector){
                    try {
                        var editor = document.querySelector(editorSelector);
                        if (!editor || !quill) return;

                        // Use capture-phase listeners to intercept before Quill handlers run
                        editor.addEventListener('dragover', function(ev){
                            try {
                                var dt = ev.dataTransfer || ev.clipboardData;
                                var types = dt && dt.types ? Array.from(dt.types || []) : [];
                                if (types.indexOf && types.indexOf('Files') !== -1) { ev.preventDefault(); ev.stopImmediatePropagation(); return; }
                            } catch(_){}
                        }, true);

                        editor.addEventListener('drop', function(ev){
                            try {
                                var dt = ev.dataTransfer;
                                if (dt && dt.files && dt.files.length) {
                                    for (var i=0;i<dt.files.length;i++){
                                        var f = dt.files[i];
                                        if (f && f.type && f.type.indexOf('image') === 0) { ev.preventDefault(); ev.stopImmediatePropagation(); return; }
                                    }
                                }
                            } catch(_){}
                        }, true);

                        editor.addEventListener('paste', function(ev){
                            try {
                                var cb = ev.clipboardData || window.clipboardData;
                                if (!cb) return;
                                // If clipboard contains image items, block immediately
                                if (cb.items && cb.items.length) {
                                    for (var j=0;j<cb.items.length;j++){
                                        var it = cb.items[j];
                                        if (it && it.type && it.type.indexOf && it.type.indexOf('image') !== -1) { ev.preventDefault(); ev.stopImmediatePropagation(); return; }
                                    }
                                }
                                // If HTML contains <img>, block
                                try { var html = cb.getData && cb.getData('text/html'); if (html && /<img\s+/i.test(html)) { ev.preventDefault(); ev.stopImmediatePropagation(); return; } } catch(_){ }
                            } catch(_){}
                        }, true);
                    } catch(_){}
                }

                // Ensure create form syncs before submit (schedule-create.js attaches submit handler so use capture phase)
                const createForm = document.getElementById('scheduleCreateForm');
                if (createForm) {
                    createForm.addEventListener('submit', function(e){
                        try { if (window.__quillScheduleCreate) syncQuillToTextarea(window.__quillScheduleCreate, 'schedule_description');
                            const plain = (window.__quillScheduleCreate && typeof window.__quillScheduleCreate.getText === 'function') ? window.__quillScheduleCreate.getText().trim() : '';
                            // allow empty description but keep textarea synced; do not block submit here
                        } catch(_) {}
                    }, true);
                }

                const editForm = document.getElementById('scheduleEditForm');
                if (editForm) {
                    editForm.addEventListener('submit', function(e){
                        try { if (window.__quillScheduleEdit) syncQuillToTextarea(window.__quillScheduleEdit, 'edit_schedule_description'); } catch(_) {}
                    }, true);
                }

                // Clear editors on modal hide
                try {
                    $('#scheduleCreateModal').on('hidden.bs.modal', function(){ try{ if(window.__quillScheduleCreate && window.__quillScheduleCreate.root) window.__quillScheduleCreate.root.innerHTML = ''; }catch(_){}; try{ const ta = document.getElementById('schedule_description'); if(ta) ta.value=''; }catch(_){} });
                    $('#scheduleEditModal').on('hidden.bs.modal', function(){ try{ if(window.__quillScheduleEdit && window.__quillScheduleEdit.root) window.__quillScheduleEdit.root.innerHTML = ''; }catch(_){}; try{ const ta = document.getElementById('edit_schedule_description'); if(ta) ta.value=''; }catch(_){} });
                } catch(_) {}
            });
        </script>

        <script>
            (function() {
                // When opening create modal, allow passing project id via data attribute
                var scheduleCreateModal = document.getElementById('scheduleCreateModal');
                if (!scheduleCreateModal) return;

                var projectSelect = document.getElementById('schedule_project_id');
                var projectContextInput = document.getElementById('schedule_project_context_id');

                function updateProjectValidationState() {
                    if (!projectSelect) return;
                    // Only enforce validation classes when the field is required
                    if (projectSelect.required) {
                        if (!projectSelect.value || projectSelect.value === '') {
                            projectSelect.classList.remove('is-valid');
                            projectSelect.classList.add('is-invalid');
                        } else {
                            projectSelect.classList.remove('is-invalid');
                            projectSelect.classList.add('is-valid');
                        }
                    } else {
                        projectSelect.classList.remove('is-invalid');
                        projectSelect.classList.remove('is-valid');
                    }
                }

                scheduleCreateModal.addEventListener('show.bs.modal', function(event) {
                    // triggering element (button) may have data-project-id attribute
                    var trigger = event.relatedTarget || document.activeElement;
                    var projectId = null;
                    if (trigger && trigger.getAttribute) {
                        projectId = trigger.getAttribute('data-project-id') || (trigger.dataset && trigger.dataset
                            .projectId) || null;
                    }

                    // clear previous state
                    if (projectContextInput) projectContextInput.value = '';

                    if (projectSelect) {
                        // Reset any previous temporary validation classes first
                        projectSelect.classList.remove('is-valid');
                        projectSelect.classList.remove('is-invalid');

                        if (projectId) {
                            // set hidden context id
                            projectContextInput.value = projectId;
                            // if option exists, select it; otherwise add a temporary option then select
                            var opt = projectSelect.querySelector('option[value="' + projectId + '"]');
                            if (!opt) {
                                opt = document.createElement('option');
                                opt.value = projectId;
                                // use a friendly label if possible; fallback to id
                                opt.text = 'Project #' + projectId;
                                projectSelect.appendChild(opt);
                            }
                            projectSelect.value = projectId;
                            // Keep the project select required by default so its validation
                            // visuals match other required fields (e.g., Title).
                            projectSelect.required = true;
                        }

                        // Do not force validation state when opening the modal so the
                        // project select doesn't show as invalid immediately.
                        // Validation will run on submit via the form submit handler.
                    }
                });

                // update validation state when user changes selection
                if (projectSelect) {
                    projectSelect.addEventListener('change', function() {
                        updateProjectValidationState();
                    });
                }

                // Reset state when modal hidden
                scheduleCreateModal.addEventListener('hidden.bs.modal', function() {
                    if (projectSelect) {
                        projectSelect.classList.remove('is-invalid');
                        projectSelect.classList.remove('is-valid');
                        // keep required true so validation matches other required fields
                    }
                    if (projectContextInput) projectContextInput.value = '';
                    var form = document.getElementById('scheduleCreateForm');
                    if (form) {
                        form.classList.remove('was-validated');
                        // reset form if desired: do not clear user input automatically to avoid data loss; only remove validation
                    }
                });

                // Basic bootstrap validation on submit (also respects required attributes set above)
                var form = document.getElementById('scheduleCreateForm');
                if (form) {
                    form.addEventListener('submit', function(e) {
                        // ensure project validation reflects current value before checkValidity
                        updateProjectValidationState();

                        if (!form.checkValidity()) {
                            e.preventDefault();
                            e.stopPropagation();
                        }
                        form.classList.add('was-validated');
                    });
                }
            })();
        </script>
    </x-slot>
</x-office-layout>
