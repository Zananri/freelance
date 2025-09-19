<x-office-layout>
    <x-slot name="menu_active">
        {{ __('task') }}
    </x-slot>
    <x-slot name="head_slot">
        <link rel="stylesheet" href="{{ asset('asset/css/schedule.css?v=' . time()) }}">
        <link rel="stylesheet" href="{{ asset('asset/css/schedule-create.css?v=' . time()) }}">
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
                    <button type="button" class="btn btn-submit-black" id="resetScheduleFilterBtn">Reset</button>
                    <button type="button" class="btn btn-submit-black" id="applyScheduleFilterBtn">Apply</button>
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
                        <button class="page-link" aria-current="page">1</button>
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
                    <h5 class="modal-title" id="scheduleCreateModalLabel">Create Schedule</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>

                <form id="scheduleCreateForm" class="needs-validation" enctype="multipart/form-data" novalidate>
                    <div class="modal-body modal-body-custom">
                        <div class="d-flex flex-column gap-3">

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
                            <div class="custom-form-employee">
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
                            <div class="custom-form-employee d-none" id="schedule_weekly_opts">
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
                            <div class="custom-form-employee d-none" id="schedule_daily_weekdays">
                                <label class="form-label label-custom">Pick weekdays</label>
                                <div class="d-flex flex-wrap gap-2" id="schedule_daily_weekdays_buttons">
                                    <button type="button" class="btn btn-outline-secondary btn-sm weekday-btn" data-day="0">Sunday</button>
                                    <button type="button" class="btn btn-outline-secondary btn-sm weekday-btn" data-day="1">Monday</button>
                                    <button type="button" class="btn btn-outline-secondary btn-sm weekday-btn" data-day="2">Tuesday</button>
                                    <button type="button" class="btn btn-outline-secondary btn-sm weekday-btn" data-day="3">Wednesday</button>
                                    <button type="button" class="btn btn-outline-secondary btn-sm weekday-btn" data-day="4">Thursday</button>
                                    <button type="button" class="btn btn-outline-secondary btn-sm weekday-btn" data-day="5">Friday</button>
                                    <button type="button" class="btn btn-outline-secondary btn-sm weekday-btn" data-day="6">Saturday</button>
                                </div>
                                <input type="hidden" id="schedule_recurrence_days_of_week" name="recurrence_days_of_week" value="[]">
                                <div class="form-text">When Daily recurrence is selected you can pick which weekdays the schedule will generate tasks for. Leave empty to mean every day.</div>
                            </div>

                            <!-- Date options -->
                            <div class="custom-form-employee" id="schedule_date_opts">
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
                            <div class="custom-form-employee">
                                <label for="schedule_point" class="form-label label-custom">Point</label>
                                <input type="number" id="schedule_point" name="point" value="1"
                                    min="1" class="form-control input-text" required>
                                <div class="invalid-feedback">Point required.</div>
                            </div>

                            <!-- Priority -->
                            <div class="custom-form-employee">
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
                            <div class="custom-form-employee">
                                <label for="schedule_due_in_days" class="form-label label-custom">Due In
                                    (days)</label>
                                <input type="number" min="0" id="schedule_due_in_days" name="due_in_days"
                                    class="form-control input-text" placeholder="e.g. 3">
                                <div class="form-text">Due date = Start date + Total days.</div>
                            </div>

                            <!-- Title -->
                            <div class="custom-form-employee">
                                <label for="schedule_title" class="form-label label-custom">Title</label>
                                <input type="text" id="schedule_title" name="title"
                                    class="form-control input-text" required>
                                <div class="invalid-feedback">Title required.</div>
                            </div>

                            <!-- Description -->
                            <div class="custom-form-employee">
                                <label for="schedule_description" class="form-label label-custom">Description</label>
                                <textarea id="schedule_description" name="description" rows="4" class="form-control input-text"></textarea>
                            </div>

                            <!-- Project -->
                            <div class="custom-form-employee">
                                <label for="schedule_project_id" class="form-label label-custom">Project
                                    (optional)</label>
                                <select id="schedule_project_id" name="project_id" class="form-select input-select">
                                    <option value="">No Project</option>
                                </select>
                            </div>

                            <!-- Reference URLs -->
                            <div class="custom-form-employee">
                                <label class="form-label label-custom">Reference URLs</label>
                                <div id="schedule_reference_urls_container" class="d-flex flex-column gap-2">
                                    <div class="d-flex gap-2 align-items-center">
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
                            <div class="custom-form-employee">
                                <label for="schedule_reference_files" class="form-label label-custom">Reference
                                    Files</label>
                                <input type="file" id="schedule_reference_files" name="reference_files[]"
                                    class="form-control input-text" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip"
                                    multiple>
                                <div class="form-text">Multiple files supported.</div>
                                <div id="schedule_reference_files_preview" class="mt-2"></div>
                            </div>

                            <!-- Executors -->
                            <div class="custom-form-employee">
                                <label for="schedule_executor_input" class="form-label label-custom">Executor</label>
                                <input type="text" id="schedule_executor_input" class="form-control input-text"
                                    placeholder="Search employees..." autocomplete="off">
                                <div id="schedule_executor_dropdown" class="dropdown-list mt-1 executor-list"></div>
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
                    <h5 class="modal-title" id="scheduleEditModalLabel">Edit Schedule</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>

                <form id="scheduleEditForm" class="needs-validation" enctype="multipart/form-data" novalidate>
                    <div class="modal-body modal-body-custom">
                        @csrf
                        <input type="hidden" name="_method" value="PUT">
                        <input type="hidden" id="edit_schedule_id">
                        <div class="d-flex flex-column gap-3">

                            <input type="hidden" id="edit_schedule_recurrence_start_date"
                                name="recurrence_start_date" value="{{ now()->toDateString() }}">
                            <input type="hidden" id="edit_schedule_recurrence_end_date" name="recurrence_end_date"
                                value="">

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
                            <div class="custom-form-employee">
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
                            <div class="custom-form-employee d-none" id="edit_schedule_weekly_opts">
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
                            <div class="custom-form-employee d-none" id="edit_schedule_daily_weekdays">
                                <label class="form-label">Pick weekdays</label>
                                <div class="d-flex flex-wrap gap-2" id="edit_schedule_daily_weekdays_buttons">
                                    <button type="button" class="btn btn-outline-secondary btn-sm edit-weekday-btn" data-day="0">Sunday</button>
                                    <button type="button" class="btn btn-outline-secondary btn-sm edit-weekday-btn" data-day="1">Monday</button>
                                    <button type="button" class="btn btn-outline-secondary btn-sm edit-weekday-btn" data-day="2">Tuesday</button>
                                    <button type="button" class="btn btn-outline-secondary btn-sm edit-weekday-btn" data-day="3">Wednesday</button>
                                    <button type="button" class="btn btn-outline-secondary btn-sm edit-weekday-btn" data-day="4">Thursday</button>
                                    <button type="button" class="btn btn-outline-secondary btn-sm edit-weekday-btn" data-day="5">Friday</button>
                                    <button type="button" class="btn btn-outline-secondary btn-sm edit-weekday-btn" data-day="6">Saturday</button>
                                </div>
                                <input type="hidden" id="edit_schedule_recurrence_days_of_week" name="recurrence_days_of_week" value="[]">
                                <div class="form-text">When Daily recurrence is selected you can pick which weekdays the schedule will generate tasks for. Leave empty to mean every day.</div>
                            </div>

                            <!-- Monthly options -->
                            <div class="custom-form-employee" id="edit_schedule_date_opts">
                                <div class="d-flex gap-2">
                                    <!-- Start Date -->
                                    <div class="w-50">
                                        <label for="edit_schedule_start_at" class="form-label label-custom">Start
                                            Date</label>
                                        <input type="date" id="edit_schedule_start_at" name="start_at"
                                            class="form-control input-text">
                                    </div>

                                    <!-- End Date -->
                                    <div class="w-100" id="edit_schedule_end_at_div">
                                        <label for="edit_schedule_end_at" class="form-label label-custom">End Date</label>
                                        <input type="date" id="edit_schedule_end_at" name="end_at"
                                            class="form-control input-text">
                                    </div>
                                </div>
                            </div>

                            <!-- Points -->
                            <div class="custom-form-employee">
                                <label for="edit_schedule_point" class="form-label label-custom">Point</label>
                                <input type="number" id="edit_schedule_point" name="point" value="1"
                                    min="1" class="form-control input-text" required>
                                <div class="invalid-feedback">Point required.</div>
                            </div>

                            <!-- Priority -->
                            <div class="custom-form-employee">
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
                            <div class="custom-form-employee">
                                <label for="edit_schedule_due_in_days" class="form-label label-custom">Due In
                                    (days)</label>
                                <input type="number" min="0" id="edit_schedule_due_in_days"
                                    name="due_in_days" class="form-control input-text" placeholder="e.g. 3">
                                <div class="form-text">Due date = Start date + Total days.</div>
                            </div>

                            <!-- Title -->
                            <div class="custom-form-employee">
                                <label for="edit_schedule_title" class="form-label label-custom">Title</label>
                                <input type="text" id="edit_schedule_title" name="title"
                                    class="form-control input-text" required>
                                <div class="invalid-feedback">Title required.</div>
                            </div>

                            <!-- Description -->
                            <div class="custom-form-employee">
                                <label for="edit_schedule_description"
                                    class="form-label label-custom">Description</label>
                                <textarea id="edit_schedule_description" name="description" rows="4" class="form-control input-text"></textarea>
                            </div>

                            <!-- Project -->
                            <div class="custom-form-employee">
                                <label for="edit_schedule_project_id" class="form-label label-custom">Project
                                    (optional)</label>
                                <select id="edit_schedule_project_id" name="project_id"
                                    class="form-select input-select">
                                    <option value="">No Project</option>
                                </select>
                            </div>

                            <!-- Reference URLs -->
                            <div class="custom-form-employee">
                                <label class="form-label label-custom">Reference URLs</label>
                                <div id="edit_schedule_reference_urls_container" class="d-flex flex-column gap-2">
                                    <div class="d-flex gap-2 align-items-center">
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
                            <div class="custom-form-employee">
                                <label for="edit_schedule_reference_files" class="form-label label-custom">Reference
                                    Files</label>
                                <input type="file" id="edit_schedule_reference_files" name="reference_files[]"
                                    class="form-control input-text" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip"
                                    multiple>
                                <div class="form-text">Multiple files supported.</div>
                                <div id="edit_schedule_reference_files_preview" class="mt-2"></div>
                            </div>

                            <!-- Executors -->
                            <div class="custom-form-employee">
                                <label for="edit_schedule_executor_input"
                                    class="form-label label-custom">Executor</label>
                                <input type="text" id="edit_schedule_executor_input"
                                    class="form-control input-text" placeholder="Search employees..."
                                    autocomplete="off">
                                <div id="edit_schedule_executor_dropdown" class="dropdown-list mt-1 executor-list">
                                </div>
                                <div id="edit_schedule_selected_executors" class="mt-2 d-flex flex-wrap gap-2"></div>
                                <input type="hidden" id="edit_schedule_executors" name="executor_ids"
                                    value="[]">
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer modal-footer-custom">
                        <button type="button" class="btn btn-custom-close" data-bs-dismiss="modal">Cancel</button>
                        <button type="submit" class="btn btn-submit-black">Edit Schedule</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <div class="modal fade" id="deleteScheduleModal" tabindex="-1" aria-labelledby="deleteScheduleModalLabel" aria-hidden="true">
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
        <script src="{{ asset('asset/js/schedule-create.js?v=' . time()) }}"></script>

        <script></script>
    </x-slot>
</x-office-layout>
