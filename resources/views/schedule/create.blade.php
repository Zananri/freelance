<x-office-layout>
    <x-slot name="menu_active">{{ __('task') }}</x-slot>
    <x-slot name="head_slot">
    <link rel="stylesheet" href="{{ asset('asset/css/schedule-create.css') }}">
    </x-slot>

    <div class="title-content d-flex align-items-center gap-2 mb-3">
        <div class="nav-item d-inline-block">
            <div class="nav-icon-arrow">
                <a href="{{ url('schedules') }}" class="text-decoration-none text-dark d-flex align-items-center">
                    <span class="material-symbols-outlined">arrow_back</span>
                </a>
            </div>
        </div>
        <h2 class="m-0">Create Schedule</h2>
    </div>

    <div class="body-content scrollable-container rounded-4 create-employee-container create-schedule-container">
        <div class="modal-loading-overlay d-none" id="scheduleCreateLoader">
            <div class="loader-spinner"></div>
        </div>
        <form id="scheduleCreateForm" class="needs-validation" enctype="multipart/form-data" novalidate>
            <div class="form-container">
                <div class="px-3 py-3">
                    <div class="row">
                        <!-- Left Column (Recurrence + Basic) -->
                        <div class="col-md-4 d-flex flex-column gap-3">
                            <input type="hidden" id="schedule_recurrence_start_date" name="recurrence_start_date" value="{{ now()->toDateString() }}">
                            <input type="hidden" id="schedule_recurrence_end_date" name="recurrence_end_date" value="">
                            <div class="custom-form-employee" hidden>
                                <label class="form-label">Recurrence Start</label>
                                <div class="form-text" style="margin-top:0; padding-top:0;">Automatically today ({{ now()->toDateString() }}), schedule repeats forever.</div>
                            </div>
                            <div class="custom-form-employee">
                                <label for="schedule_recurrence_type" class="form-label">Repeat</label>
                                <select id="schedule_recurrence_type" name="recurrence_type" class="form-select input-select" required>
                                    <option value="" selected>Select Option Schedule</option>
                                    <option value="daily">Every Day</option>
                                    <option value="weekly">Every Week</option>
                                    <option value="monthly">Every Month</option>
                                </select>
                                <div class="invalid-feedback">Please select recurrence type.</div>
                            </div>
                            <div class="custom-form-employee d-none" id="schedule_weekly_opts">
                                <label for="schedule_recurrence_day_of_week" class="form-label">Day of Week</label>
                                <select class="form-select input-select" id="schedule_recurrence_day_of_week" name="recurrence_day_of_week">
                                    <option value="0">Sunday</option>
                                    <option value="1">Monday</option>
                                    <option value="2">Tuesday</option>
                                    <option value="3">Wednesday</option>
                                    <option value="4">Thursday</option>
                                    <option value="5">Friday</option>
                                    <option value="6">Saturday</option>
                                </select>
                            </div>
                            @php
                                $now = now();
                                $monthlyDisplay = $now->translatedFormat('l, j F Y');
                            @endphp
                            <div class="custom-form-employee d-none" id="schedule_monthly_opts">
                                <label for="schedule_monthly_date" class="form-label">Start date</label>
                                <input type="text" id="schedule_monthly_date" class="form-control input-text" readonly value="{{ $monthlyDisplay }}" data-initial-display="{{ $monthlyDisplay }}">
                                <input type="hidden" id="schedule_recurrence_day_of_month" name="recurrence_day_of_month" value="{{ $now->day }}">
                            </div>
                            <div class="custom-form-employee">
                                <label for="schedule_point" class="form-label">Point</label>
                                <input type="number" id="schedule_point" name="point" value="1" min="1" class="form-control input-text" required>
                                <div class="invalid-feedback">Point required.</div>
                            </div>
                            <div class="custom-form-employee">
                                <label for="schedule_priority" class="form-label">Priority</label>
                                <select id="schedule_priority" name="priority" class="form-select input-select" required>
                                    <option value="">Select Priority</option>
                                    <option value="HIGH">HIGH</option>
                                    <option value="MEDIUM">MEDIUM</option>
                                    <option value="LOW">LOW</option>
                                </select>
                                <div class="invalid-feedback">Priority required.</div>
                            </div>
                            <div class="custom-form-employee">
                                <label for="schedule_due_in_days" class="form-label">Due In (days)</label>
                                <input type="number" min="0" id="schedule_due_in_days" name="due_in_days" class="form-control input-text" placeholder="e.g. 3">
                                <div class="form-text">Due date = Start date + Total days.</div>
                            </div>
                            <div class="custom-form-employee">
                                <label for="schedule_title" class="form-label">Title</label>
                                <input type="text" id="schedule_title" name="title" class="form-control input-text" required>
                                <div class="invalid-feedback">Title required.</div>
                            </div>
                        </div>

                        <!-- Middle Column (Template Text Fields) -->
                        <div class="col-md-4 d-flex flex-column gap-3">
                            <div class="custom-form-employee">
                                <label for="schedule_description" class="form-label">Description</label>
                                <textarea id="schedule_description" name="description" rows="6" class="form-control input-text"></textarea>
                            </div>
                            <div class="custom-form-employee">
                                <label for="schedule_project_id" class="form-label">Project (optional)</label>
                                <select id="schedule_project_id" name="project_id" class="form-select input-select">
                                    <option value="">No Project</option>
                                </select>
                            </div>
                            <div class="custom-form-employee">
                                <label class="form-label">Reference URLs</label>
                                <div id="schedule_reference_urls_container" class="d-flex flex-column gap-2">
                                    <div class="d-flex gap-2 align-items-center">
                                        <input type="url" class="form-control input-text" name="reference_urls[]" placeholder="https://example.com">
                                        <button type="button" class="btn btn-submit-black add-ref-url" aria-label="Add URL"><span class="material-symbols-outlined">add</span></button>
                                    </div>
                                </div>
                            </div>
                            <div class="custom-form-employee">
                                <label for="schedule_reference_files" class="form-label">Reference Files</label>
                                <input type="file" id="schedule_reference_files" name="reference_files[]" class="form-control input-text" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip" multiple>
                                <div class="form-text">Multiple files supported.</div>
                                <div id="schedule_reference_files_preview" class="mt-2"></div>
                            </div>
                        </div>

                        <!-- Right Column (Image + Executors) -->
                        <div class="col-md-3 d-flex flex-column gap-3">
                            <div class="mb-2">
                                <div class="title-label-image">Upload Image</div>
                                <label for="schedule_image" class="custom-image-upload-photo position-relative photo-upload" id="scheduleImageLabel">
                                    <input type="file" id="schedule_image" name="image" accept="image/*" hidden>
                                    <span class="image-clear-btn d-none" id="scheduleImageClearBtn">&times;</span>
                                </label>
                            </div>
                            <div class="custom-form-employee">
                                <label for="schedule_executor_input" class="form-label">Executor</label>
                                <input type="text" id="schedule_executor_input" class="form-control input-text" placeholder="Search employees..." autocomplete="off">
                                <div id="schedule_executor_dropdown" class="dropdown-list mt-1 executor-list"></div>
                                <div id="schedule_selected_executors" class="mt-2 d-flex flex-wrap gap-2"></div>
                                <input type="hidden" id="schedule_executors" name="executor_ids" value="[]">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="form-footer text-center px-2 py-3">
                <button type="submit" class="btn-submit-black">Create Schedule</button>
            </div>
        </form>
    </div>

    <x-slot name="script_slot">
        <script src="{{ asset('asset/js/schedule-create.js?v=' . time()) }}"></script>
    </x-slot>
</x-office-layout>
