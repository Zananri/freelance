<x-office-layout>
    <x-slot name="menu_active">
        {{ __('hub_division') }}
    </x-slot>
    <x-slot name="head_stitle_slot">
        {{ __('Hub Division') }}
    </x-slot>
    <x-slot name="head_slot">
        <link href="{{ asset('asset/css/hub_division.css?v' . time()) }}" rel="stylesheet">
        <link href="https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.snow.min.css" rel="stylesheet">
    </x-slot>

    <div class="title-content">
        <div class="d-flex align-items-center gap-3">
            <div class="w-100">
                <h2 class="text-title-content">Hub Division</h2>
            </div>
        </div>

    </div>

    <div class="calendar-container">
        <div class="row">
            <div class="employee-card-content overflow-hidden">
                <div class="header-employe-card">
                    @if ($canSeeAll)
                        <div class="dropdown dropdown-division">
                            <button class="dropdown-toggle" type="button" data-bs-toggle="dropdown"
                                aria-expanded="false">
                                <span class="selected-division-text">All Division</span>
                            </button>

                            <ul class="dropdown-menu border-0 shadow-sm bg-default-1 rounded-3">
                                <li class="dropdown-item division-item" data-division-id="all">
                                    All Division
                                </li>
                                @foreach ($divisions as $division)
                                    <li class="dropdown-item division-item" data-division-id="{{ $division->id }}">
                                        {{ $division->name_division }}
                                    </li>
                                @endforeach
                            </ul>
                        </div>
                    @else
                        <div class="text-division-user">
                            {{ $current_employee->division->name_division ?? 'Unknown Division' }}
                        </div>
                    @endif

                </div>

                <div class="header-barier"></div>
                <div class="d-flex justify-content-between px-3">
                    <span class="employee-total-task">Total Project : {{ $totalProjects }}</span>
                    <span class="employee-total-project">Total Task : {{ $totalTasks }}</span>
                </div>
                <div class="employee-list scrollbar-transparent">
                    @foreach ($employee as $emp)
                        @php
                            $photoUrl = asset('asset/img/avatar.png');
                            if ($emp->profile_picture) {
                                $photoUrl = asset($emp->profile_picture);
                            } elseif ($emp->photo) {
                                $photoUrl = asset($emp->photo);
                            } elseif ($emp->user_photo) {
                                $photoUrl = asset($emp->user_photo);
                            }
                            $taskCount = $emp->tasks_count ?? 0;
                            $taskStart = $emp->total_start ?? 0;
                            $taskProgress = $emp->total_in_progress ?? 0;
                            $taskLate = $emp->total_late ?? 0;
                            $taskComplete = $emp->total_complete ?? 0;
                            $taskFinish = $emp->total_finished ?? 0;
                        @endphp

                        <div class="employee-item" 
                            data-employee-division="{{ $emp->division->name_division }}"
                            data-employee-division-id="{{ $emp->division_id }}"
                            data-employee-id="{{ $emp->id }}" 
                            data-employee-photo="{{ $photoUrl }}"
                            data-total-task="{{ $taskCount }}" 
                            data-total-progress="{{ $taskProgress }}"
                            data-total-late="{{ $taskLate }}" 
                            data-total-finish="{{ $taskFinish }}" 
                            data-total-start="{{ $taskStart }}" 
                            data-total-complete="{{ $taskComplete }}">
                            <div class="employee-photo">
                                <img src="{{ $photoUrl }}" alt="{{ $emp->name }}">
                            </div>
                            <div class="employee-info">
                                <div class="employee-name">{{ $emp->name }}</div>
                                <div class="employee-job">{{ $emp->job_name }}</div>
                            </div>
                        </div>
                    @endforeach
                </div>
            </div>

            <div id="mobile-outside-calendar-header" class="d-none"></div>
            <div class="calendar-card-content overflow-hidden position-relative">
                <div id="mobile-inside-calendar-header" class="d-none"></div>
                <div class="header-calendar">
                    <div class="d-flex justify-content-between">

                        <div class="selected-employee-info">
                            <div class="d-flex align-items-center gap-2">
                                <div class="selected-employee-photo me-2"></div>
                                <span class="selected-employee-name"></span>
                            </div>

                            <div class="d-flex align-items-center">
                                <div class="dropdown dropdown-month me-3">
                                    <div class="dropdown-toggle btn btn-dropdown-month mt-1 p-0" data-bs-toggle="dropdown">
                                        <div class="d-inline-flex align-items-center">
                                            <span class="calendar-month">{{ date('F') }}</span>
                                            <span class="calendar-year">{{ date('Y') }}</span>
                                        </div>
                                    </div>

                                    <ul class="dropdown-menu border-0 shadow-sm bg-default-1 rounded-3">
                                        @for ($monthNum = 1; $monthNum <= 12; $monthNum++)
                                            <li data-month="{{ $monthNum }}"
                                                class="dropdown-item month-item fs-14">
                                                <div class="dropdown-item fs-14">
                                                    {{ date('F', mktime(0, 0, 0, $monthNum, 1)) }}
                                                </div>
                                            </li>
                                        @endfor
                                    </ul>
                                </div>

                                <div class="box-view-control white-space-nowrap">
                                    <span class="material-symbols-outlined calendar-prev-month">chevron_left</span>
                                    <span class="material-symbols-outlined calendar-next-month">chevron_right</span>
                                </div>
                            </div>
                        </div>

                        <div class="d-flex flex-column position-relative">
                            <div class="search-wrapper ms-auto">
                                <span class="material-symbols-outlined search-icon position-absolute">
                                    search
                                </span>
                                <input type="text" class="search-input-custom" id="search_task" placeholder="search task...">
                            </div>

                            <div class="d-flex justify-content-end gap-4 total-status-task mt-3">
                                <small class="selected-employee-task">Total task :</small>
                                <small class="selected-employee-progress">Progress :</small>
                                <small class="selected-employee-late">Late :</small>
                                <small class="selected-employee-finish">Finish :</small>
                            </div>
                        </div>

                    </div>
                </div>

                <div class="box-table-calendar">
                    <table class="table-calendar scrollbar-transparent">
                        <thead>
                            <tr>
                                <th>Sun</th>
                                <th>Mon</th>
                                <th>Tue</th>
                                <th>Wed</th>
                                <th>Thu</th>
                                <th>Fri</th>
                                <th>Sat</th>
                            </tr>
                        </thead>
                        <tbody>
                            @for ($i = 0; $i < 7; $i++)
                                <tr>
                                    @for ($j = 0; $j < 7; $j++)
                                        <td class="text-center"></td>
                                    @endfor
                                </tr>
                            @endfor
                        </tbody>
                    </table>
                </div>
                <div class="box-loader d-none z-3 rounded-4 bg-white position-absolute top-0 start-0 w-100 h-100" style="background-color: rgba(255, 255, 255, 0.95) !important;">
                    <div class="w-100 h-100 d-flex justify-content-center align-items-center">
                        <div>
                            <div class="spinner-border opacity-50" style="width: 2.5rem; height: 2.5rem;"
                                role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                            <div class="fs-10">Loading...</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <x-slot name="body_end_slot">
        <div class="modal fade" id="taskDetailModal" tabindex="-1" aria-labelledby="taskDetailModalLabel"
            aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content modal-content-custom scrollbar-transparent">
                    <div class="modal-body p-0">
                        <div id="taskDetailContent"></div>
                    </div>
                    <div class="modal-footer modal-footer-custom px-4 py-3">
                        <button type="button" class="btn btn-custom-close" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>

        {{-- Task Feedback Modal --}}
        <div class="modal fade" id="taskFeedbackModal" tabindex="-1" aria-labelledby="taskFeedbackModalLabel"
            aria-hidden="true" data-task-id="{{ $taskId ?? '' }}"
            data-employee-id="{{ auth()->user()->employee->id ?? '' }}"
            data-employee-department-id="{{ auth()->user()->employee->department_id ?? '' }}">
            <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable feedback-modal-dialog">
                <div class="modal-content modal-content-custom">
                    <div
                        class="modal-header modal-header-custom d-flex align-items-center position-relative flex-nowrap">
                        <h5 class="modal-title feedback-modal-title flex-grow-1 fs-5 fw-normal"
                            id="taskFeedbackModalLabel">Task Feedback</h5>
                        <button type="button" class="btn-close ms-3 flex-shrink-0" data-bs-dismiss="modal"
                            aria-label="Close"></button>
                    </div>

                    <div class="modal-body feedback-modal-body scrollbar-transparent" id="taskFeedbackList">
                    </div>
                    <div class="modal-footer modal-footer-custom">
                        <div class="feedback-form w-100">
                            <div id="inline_task_feedback_files_preview"></div>
                            <div id="inline_existing_files_preview"></div>
                            <div id="inline_task_feedback_editor" class="border-0 ql-container ql-snow"
                                style="min-height:40px; max-height:160px; overflow:auto; background:transparent; padding:8px 10px; border-radius:6px;">
                                <div class="ql-editor ql-blank" contenteditable="true"
                                    data-placeholder="Write feedback...">
                                    <p><br></p>
                                </div>
                            </div>

                            <textarea id="inline_task_feedback_comment" name="feedback_comment" class="d-none" style="display:none;"></textarea>
                            <input type="hidden" id="inline_edit_task_feedback_input" value="">
                            <input type="hidden" id="inline_parent_id_input" name="parent_id" value="">

                            <div class="d-flex justify-content-between btn-actions-feedback mt-2">
                                <div class="d-flex-justify-content-start">
                                    <button type="button" class="btn btn-sm border-0"
                                        id="inlineTaskFeedbackPhotoBtn" title="Upload photo">
                                        <span class="material-symbols-outlined feedback-photo-icon">photo</span>
                                    </button>
                                    <button type="button" class="btn btn-sm border-0" id="inlineTaskFeedbackFileBtn"
                                        title="Attach file">
                                        <span class="material-symbols-outlined feedback-file-icon">attach_file</span>
                                    </button>
                                    <input type="file" id="inline_task_feedback_image_input" name="feedback_image"
                                        accept="image/*" class="d-none">
                                    <input type="file" id="inline_task_feedback_files_input"
                                        name="reference_files[]" multiple
                                        accept="image/*,.csv,.pdf,.doc,.docx,.xls,.xlsx,.zip,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                                        class="d-none">
                                </div>
                                <div class="d-flex justify-content-end submit-feedback">
                                    <button type="button" class="btn btn-submit-black"
                                        id="inlineTaskFeedbackSendBtn">
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

        <div class="modal fade" id="taskModalDate" tabindex="-1" aria-labelledby="taskModalDateLabel"
            aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered modal-lg">
                <div class="modal-content modal-content-custom p-0">
                    <div class="modal-header border-0">
                        <div class="w-100">
                            <div class="selected-employee-info d-flex align-items-center gap-3 px-2 rounded-3">
                                <img src="" class="selected-employee-photo rounded-circle d-none">
                                <div class="d-flex flex-column">
                                    <div class="selected-employee-name">
                                    </div>
                                    <small class="selected-employee-task fs-8 text-muted"></small>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="barrier-custom"></div>
                    <div class="modal-body modal-body-custom p-0">
                        <div class="d-flex justify-content-between align-items-center py-3 px-4">
                            <div>
                                <h5 class="selected-task-date mb-0"></h5>
                            </div>
                            <div>
                                <span class="selected-total-task"></span>
                            </div>
                        </div>
                        <div id="taskListByDate" class="scrollbar-transparent px-4"></div>
                    </div>
                    <div class="modal-footer modal-footer-custom px-5 py-3">
                        <button type="button" class="btn btn-custom-close" data-bs-dismiss="modal">Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </x-slot>


    <x-slot name="script_slot">
        <script src="https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.min.js"></script>
        <script src="{{ asset('asset/js/date_helper.js?=' . time()) }}"></script>
        <script src="{{ asset('asset/js/hub_division.js?=' . time()) }}"></script>
    </x-slot>

</x-office-layout>
