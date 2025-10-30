    <x-office-layout>
        <x-slot name="menu_active">
            {{ __('project') }}
        </x-slot>
        <x-slot name="head_slot">
            <meta name="app-url" content="{{ url('/') }}">
            <meta name="project-id" content="{{ $project->id ?? '' }}">
            <meta name="csrf-token" content="{{ csrf_token() }}">
            @php
                $img = $project->image ?? null;
                $imgUrl = $img ? asset('file/project/' . ltrim($img, '/')) : asset('asset/img/image.png');
                // Count tasks excluding canceled and deleted statuses
                $totalTasks = $project
                    ->tasks()
                    ->whereRaw('LOWER(status) NOT IN (?, ?)', ['canceled', 'deleted'])
                    ->count();
            @endphp
            <meta name="project-image" content="{{ $imgUrl }}">
            <meta name="project-total-tasks" content="{{ $totalTasks }}">
            <link href="https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.snow.css" rel="stylesheet">
            <link rel="stylesheet" href="{{ asset('asset/css/project.css') }}?v={{ time() }}">
            <link rel="stylesheet" href="{{ asset('asset/css/project-detail.css?v=') . time() }}">
        </x-slot>

        <div class="d-flex justify-content-between align-items-center mb-3 project-detail-header">
            <div class="title-content d-flex align-items-center gap-2">
                <div class="nav-item d-inline-block">
                    <div class="nav-icon-arrow">
                        <a href="{{ url('project') }}" class="text-decoration-none text-dark d-flex align-items-center">
                            <div class="d-flex">
                                <span class="material-symbols-outlined">arrow_back</span>
                            </div>
                        </a>
                    </div>
                </div>
                <h2 class="m-0">Project Detail</h2>
            </div>
            <div class="d-flex align-items-center button-group">
                <button class="btn btn-sm toggle-grid d-none me-2" id="gridViewTaskDetail" data-bs-toggle="tooltip"
                    title="Grid View">
                    <span class="material-symbols-outlined">grid_view</span>
                </button>
                <button class="btn btn-sm toggle-list me-2" id="listViewTaskDetail" data-bs-toggle="tooltip"
                    title="List View">
                    <span class="material-symbols-outlined">list</span>
                </button>
                <button class="btn btn-contributor-custom me-2" id="openContributionsModalBtn" title="My Contributions">
                    <span class="material-symbols-outlined icon">mist</span>
                </button>
                <button class="btn btn-export-custom-detail" id="exportProjectReportBtn" title="Export Project"
                    data-project-id="{{ $project->id ?? '' }}">
                    <span class="material-symbols-outlined icon">download</span>
                </button>
            </div>
        </div>

        <div class="detail-project-container">
            {{-- Hidden fields for Contributions modal JS (scope to this project) --}}
            <input type="hidden" name="employee_id" value="{{ auth()->user()->employee->id ?? '' }}">
            <input type="hidden" id="contrib-endpoint"
                value="{{ route('employees.contributions', ['id' => auth()->user()->employee->id ?? 0]) }}">
            <input type="hidden" id="contrib-project-id" value="{{ $project->id ?? '' }}">
            {{-- Above Content --}}
            {{-- Left Above Content --}}
            <div class="row mb-3">
                <div class="col-md-4 detail-project-card">
                    <div class="body-content rounded-4 p-3">
                        <div class="d-flex align-items-center mb-1">
                            <img id="project-image" src="{{ asset('asset/img/image.png') }}" alt="project detail image"
                                class="project-detail-image me-3">
                            <h4 id="project-title" class="project-detail-title m-0 d-flex align-items-center">-</h4>
                        </div>
                        <div class="description-container mb-1">
                            <p id="project-description" class="description-detail">-</p>
                        </div>
                        <div class="d-flex justify-content-between align-items-center">
                            <div id="ref-files-container">
                            </div>
                            <div class="d-flex" id="project-actions">
                                <!-- edit / delete buttons will be injected by JS -->
                            </div>
                        </div>

                        <hr class="task-separator border-3 rounded-4">

                        <div class="d-flex justify-content-between detail-list">
                            <p>Total Task</p>
                            <p id="project-total-tasks">-</p>
                        </div>
                        <div class="d-flex justify-content-between detail-list">
                            <p>Deadline</p>
                            <p id="project-deadline">-</p>
                        </div>
                        <div class="d-flex justify-content-between detail-list">
                            <p>Department</p>
                            <p id="project-department">-</p>
                        </div>
                        <div class="d-flex justify-content-between detail-list">
                            <p>Division</p>
                            <p id="project-division">-</p>
                        </div>

                        <div class="d-flex justify-content-center mt-3">
                            <div id="project-assignments" class="detail-project-bottom">
                                <!-- author / co-authors / contributors rendered by JS -->
                            </div>
                        </div>
                    </div>
                </div>

                {{-- Right Above Content --}}
                <div class="col-md-8 structure-detail">
                    <div class="body-content rounded-4 structure-detail-content">
                        <div id="task-loading" class="text-center py-3 d-none">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Loading tasks...</span>
                            </div>
                            <p class="mt-2">Loading tasks...</p>
                        </div>
                        <div id="task-error" class="alert alert-danger d-none" role="alert">
                            Failed to load tasks. Please try again.
                        </div>
                        <div class="d-flex justify-content-end align-items-center">
                            <button class="btn btn-sm border-0" id="fullscreen-tree-btn" title="Toggle Fullscreen">
                                <span class="material-symbols-outlined">fullscreen</span>
                            </button>

                            <button class="btn btn-sm border-0 ms-2" id="add-task-btn"
                                data-bs-target="#addTaskModalProject" data-bs-toggle="modal" title="Add Task">
                                <span class="material-symbols-outlined">add</span>
                            </button>
                        </div>

                        <div class="task-tree-wrapper">
                            <div id="task-tree">
                                
                            </div>
                        </div>

                        <div id="task-legend" class="d-flex justify-content-start">
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
                            <div class="legend-item d-flex align-items-start">
                                <span class="finish" data-bs-toggle="tooltip" data-bs-title="Finish"><span
                                        class="text-legend">Finish</span></span>
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

            <div class="row">
                <div class="col-md-4 mb-3 feedback-detail-project">
                    <div class="body-content rounded-4 p-3 feedback-content-detail">
                        <div class="d-flex justify-content-between">
                            <h5 class="feedback-title">Feedback</h5>
                            <button class="btn btn-sm border-0" id="fullscreen-feedback-btn">
                                <span class="material-symbols-outlined">
                                    fullscreen
                                </span>
                            </button>
                        </div>

                        <div class="feedback-content" id="projectFeedbackList">

                        </div>
                        <div class="feedback-form">
                            <div id="inline_feedback_editor" class="border-0"
                                style="min-height:40px; max-height:160px; overflow:auto; background:transparent; padding:8px 10px; border-radius:6px;">
                            </div>

                            <textarea id="inline_feedback_comment" name="feedback_comment" class="d-none" style="display:none;"></textarea>

                            <div class="d-flex justify-content-between btn-actions-feedback mt-2">
                                <div class="d-flex-justify-content-start">
                                    <button type="button" class="btn btn-sm border-0" id="inlineFeedbackPhotoBtn"
                                        title="Upload photo">
                                        <span class="material-symbols-outlined feedback-photo-icon">photo</span>
                                    </button>
                                    <button type="button" class="btn btn-sm border-0" id="inlineFeedbackFileBtn"
                                        title="Attach file">
                                        <span class="material-symbols-outlined feedback-file-icon">attach_file</span>
                                    </button>
                                    <input type="file" id="inline_feedback_image_input" name="feedback_image"
                                        accept="image/*" class="d-none">
                                    <input type="file" id="inline_feedback_files_input" name="reference_files[]"
                                        multiple
                                        accept="image/*,.csv,.pdf,.doc,.docx,.xls,.xlsx,.zip,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                                        class="d-none">
                                    <input type="text" id="inline_edit_feedback_input" name="edit_feedback"
                                        class="d-none">
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

                <div class="col-md-8 mb-3 timeline-detail-project">
                    <div class="body-content rounded-4 p-3 timeline-content">
                        <div class="d-flex justify-content-between align-items-center">
                            <p class="m-0" id="totalTaskTimeline"></p>
                            <div class="d-flex justify-content-end">
                                <p class="mt-2" id="monthTitleTimeline"></p>
                                <button class="btn btn-sm border-0 ms-3 me-2" id="prevTimelineModal">
                                    <span class="material-symbols-outlined">chevron_left</span>
                                </button>
                                <button class="btn btn-sm border-0 ms-2 me-3" id="nextTimelineModal">
                                    <span class="material-symbols-outlined">chevron_right</span>
                                </button>
                                <button class="btn btn-sm border-0 me-3 exit-fullscreen-btn" type="button"
                                    id="fullscreen-btn">
                                    <span class="material-symbols-outlined">fullscreen</span>
                                </button>
                            </div>
                        </div>
                        <div class="timeline-wrapper">
                            <table class="timeline-table">
                                <thead>
                                    <tr id="timelineHeader"></tr>
                                </thead>
                                <tbody id="timelineRows"></tbody>
                            </table>
                        </div>
                        <div class="timeline-legend d-flex justify-content-start gap-4">
                            <div class="legend-item d-flex align-items-center gap-2">
                                <span class="legend-dot legend-gray"></span>
                                <span class="legend-text" id="newRequestCount">0 Task</span>
                            </div>
                            <div class="legend-item d-flex align-items-center gap-2">
                                <span class="legend-dot legend-yellow"></span>
                                <span class="legend-text" id="inProgressCount">0 Task</span>
                            </div>
                            <div class="legend-item d-flex align-items-center gap-2">
                                <span class="legend-dot legend-red"></span>
                                <span class="legend-text" id="lateCount">0 Task</span>
                            </div>
                            <div class="legend-item d-flex align-items-center gap-2">
                                <span class="legend-dot legend-green"></span>
                                <span class="legend-text" id="completedCount">0 Task</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div id="task-table-section-detail" class="task-table-section d-none">
            <div class="body-content scrollable-container table-container rounded-4 px-4 py-3">
                <table class="table table-borderless align-middle table-transparent">
                    <thead>
                        <tr>
                            <th scope="col">Task</th>
                            <th scope="col">PIC</th>
                            <th scope="col">Executors</th>
                            <th scope="col">Start Date</th>
                            <th scope="col">Due Date</th>
                            <th scope="col">Status</th>
                            <th scope="col"></th>

                        </tr>
                    </thead>
                    <tbody class="task-table-body">
                        <tr></tr>
                    </tbody>
                </table>
            </div>
        </div>

        {{-- Contributions Modal (same UI as Project page) --}}
        <div class="modal fade" id="contributionsModal" tabindex="-1" aria-labelledby="contributionsModalLabel"
            aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered modal-lg">
                <div class="modal-content rounded-4 border-0">
                    <div class="modal-header border-0">
                        <h5 class="modal-title modal-title-custom" id="contributionsModalLabel">My Contributions</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"
                            aria-label="Close"></button>
                    </div>
                    <div class="modal-body modal-body-custom p-3">
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
                        <div class="contrib-grid-container">
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

        @php
            $projImg = $project->image ?? null;
            $projImgUrl = $projImg ? asset('file/project/' . ltrim($projImg, '/')) : asset('asset/img/image.png');
            $projTitle = $project->title ?? '-';
            $projDesc = $project->description ?? '-';
            $projDeadline = $project->due_date ? $project->due_date : '-';
            $projDept = $project->department?->name_department ?? ($project->department?->name ?? '-');
            $projDiv = $project->division?->name_division ?? ($project->division?->name ?? '-');
            $initials = trim($projTitle)
                ? strtoupper(mb_substr(preg_replace('/[^\p{L}\p{N}]/u', '', $projTitle), 0, 2))
                : '';

            $randomColors = [
                '#FF6B6B',
                '#4ECDC4',
                '#45B7D1',
                '#96CEB4',
                '#FFEAA7',
                '#DDA0DD',
                '#98D8C8',
                '#F7DC6F',
                '#BB8FCE',
                '#85C1E9',
                '#F8C471',
                '#82E0AA',
                '#F1948A',
                '#85C1E9',
                '#D7BDE2',
            ];
            $randomBgColor = $randomColors[array_rand($randomColors)];
        @endphp

        {{-- delete Modal --}}
        <div class="modal fade" id="deleteProjectModal" tabindex="-1" aria-labelledby="deleteProjectModalLabel"
            aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content modal-content-custom">
                    <div class="modal-body modal-body-custom">
                        <div id="deleteProjectContent">
                            <div class="custom-card-delete position-relative p-3 border-0">
                                <div class="d-flex align-items-center mb-2">
                                    @if ($projImg)
                                        <img src="{{ $projImgUrl }}" alt="Project Image"
                                            class="rounded-circle me-3"
                                            style="width:34px;height:34px;object-fit:cover;"
                                            onerror="this.onerror=null;var d=document.createElement('div');d.className='rounded-circle d-flex align-items-center justify-content-center me-3';d.style.width='34px';d.style.height='34px';d.style.background='{{ $randomBgColor }}';d.style.color='#fff';d.style.fontWeight='600';d.style.fontSize='11px';d.textContent='{{ $initials }}';this.replaceWith(d);">
                                    @else
                                        <div class="rounded-circle d-flex align-items-center justify-content-center me-3"
                                            style="width:34px;height:34px;background:{{ $randomBgColor }};color:#fff;font-weight:600;font-size:11px;">
                                            {{ $initials }}
                                        </div>
                                    @endif
                                    <div class="d-flex flex-column">
                                        <h5 class="mb-0 project-detail-ti   tle">{{ $projTitle }}</h5>
                                    </div>
                                </div>
                                <div class="description-container mb-2">
                                    <p class="description-detail" id="project-delete-description"></p>
                                </div>
                                <hr class="task-separator border-3 rounded-4">

                                <div id="project-{{ $project->id ?? '0' }}"
                                    class="d-flex justify-content-between mb-1" style="font-size:12px;">
                                    <span>Total Task: </span>
                                    <span id="project-total-tasks">{{ $totalTasks }} Tasks</span>
                                </div>

                                <div id="project-{{ $project->id ?? '0' }}"
                                    class="d-flex justify-content-between mb-1" style="font-size:12px;">
                                    <span>Deadline: </span>
                                    <span id="deadline-{{ $project->id ?? '0' }}">{{ $projDeadline }}</span>
                                </div>

                                <div class="d-flex justify-content-between mb-1" style="font-size:12px;">
                                    <span class="text-muted">Department:</span>
                                    <span>{{ $projDept }}</span>
                                </div>

                                <div class="d-flex justify-content-between mb-2" style="font-size:12px;">
                                    <span class="text-muted">Division:</span>
                                    <span>{{ $projDiv }}</span>
                                </div>

                            </div>
                        </div>
                    </div>
                    <div class="modal-footer modal-footer-custom">
                        <button type="button" class="btn btn-custom-close" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-submit-black" id="confirmDeleteProjectBtn"
                            data-project-id="{{ $project->id ?? '' }}">Delete</button>
                    </div>
                </div>
            </div>
        </div>

        {{-- Edit Modal --}}
        <div class="modal fade modal-custom" id="editProjectModal" data-bs-backdrop="static"
            data-bs-keyboard="false" tabindex="-1" aria-labelledby="editProjectModalLabel" aria-hidden="true"
            data-employee-id="{{ auth()->user()->employee->id ?? '' }}">
            <div class="modal-dialog">
                <div class="modal-content modal-content-custom">
                    <div class="modal-loading-overlay d-none" id="editModalLoader">
                        <div class="loader-spinner"></div>
                    </div>
                    <div class="modal-header modal-header-custom">
                        <h5 class="modal-title modal-title-custom" id="editProjectModalLabel">Edit Project</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"
                            aria-label="Close"></button>
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
                                <label for="edit_image" class="custom-image-upload position-relative"
                                    id="editImageLabel"
                                    style=" background-position: center center; background-repeat: no-repeat; background-size: 50%;  background-image: url('{!! asset('asset/img/background/add-image.png') !!}');">
                                    <input type="file" class="input-image" id="edit_image" name="image"
                                        accept="image/*" hidden>
                                    <span class="image-clear-btn d-none" id="editImageClearBtn"
                                        title="Remove image">&times;</span>
                                    <input type="hidden" id="edit_remove_image" name="remove_image" value="0">
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

                                <div id="project_description_editor"
                                    style="min-height:120px; background:#fff; border: none; border-radius:6px;">
                                </div>

                                <!-- canonical hidden textarea so backend controllers keep receiving same payload -->
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
                                <select class="form-select input-select" id="edit_department" name="department"
                                    required>
                                    <option value="{{ $__deptId }}" selected>{{ $__deptName }}</option>
                                </select>
                            </div>
                            <div class="mb-3 input-custom">
                                <label for="edit_division" class="form-label label-custom">Division</label>
                                <select class="form-select input-select" id="edit_division" name="division" required>
                                    <option value="">Select Division</option>
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
                                <label for="edit_reference_file" class="form-label label-custom">Reference
                                    Files</label>
                                <input type="file" class="form-control input-text" id="edit_reference_file"
                                    name="reference_file[]"
                                    accept="image/*,.csv,.pdf,.doc,.docx,.xls,.xlsx,.zip,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                                    multiple>
                                <div id="edit_reference_files_preview" class="mt-2"></div>
                                <div id="existing_reference_files" class="mt-2"></div>
                                <input type="hidden" id="existing_reference_files_input"
                                    name="existing_reference_files" value="[]">
                            </div>
                            <div class="mb-3 input-custom d-flex justify-content-between">
                                <div style="width: 48%;">
                                    <label for="edit_start_date" class="form-label label-custom">Start Date</label>
                                    <input type="datetime-local" class="form-control input-text" id="edit_start_date"
                                        name="start_date" required>
                                </div>
                                <div style="width: 48%;">
                                    <input class="fs-12 float-end mt-1" type="checkbox" id="edit_due_forever" name="due_forever">
                                    <label class="fs-10 float-end mt-1 me-1" for="edit_due_forever">Forever</label>

                                    <label for="edit_due_date" class="form-label label-custom">Due Date</label>
                                    <input type="datetime-local" class="form-control input-text" id="edit_due_date"
                                        name="due_date">
                                </div>
                            </div>
                            <div class="mb-3 input-custom">
                                <label class="form-label label-custom">Part of Project</label>
                                <input type="text" class="form-control input-text" id="edit_part_of_project_input"
                                    autocomplete="off" placeholder="Search project...">
                                <div id="edit_part_of_project_dropdown" class="dropdown-list mt-1"></div>
                                <div id="edit_selected_project" class="mt-2"></div>
                                <!-- container for parent hidden inputs (multiple) -->
                                <div id="edit_parent_inputs"></div>
                            </div>
                            <div class="mb-3 input-custom">
                                <label for="edit_co_author_input" class="form-label label-custom">Co-Author</label>
                                <input type="text" class="form-control input-text" id="edit_co_author_input"
                                    name="edit_co_author_input" autocomplete="off" placeholder="Search employees...">
                                <div id="edit_co_author_dropdown" class="dropdown-list mt-1"
                                    style="max-height: 200px; overflow-y: auto; border: 1px solid #ccc; border-radius: 4px; display: none; background: white; position: absolute; z-index: 1000; width: 100%;">
                                </div>
                                <div id="edit_selected_co_authors" class="mt-2 d-flex flex-wrap gap-2">
                                </div>
                                <input type="hidden" id="edit_co_author" name="co_author" value="">
                            </div>
                            <div class="mb-3 input-custom">
                                <label for="edit_contributor_input"
                                    class="form-label label-custom">Contributor</label>
                                <input type="text" class="form-control input-text" id="edit_contributor_input"
                                    name="edit_contributor_input" autocomplete="off"
                                    placeholder="Search employees...">
                                <div id="edit_contributor_dropdown" class="dropdown-list mt-1"
                                    style="max-height: 200px; overflow-y: auto; border: 1px solid #ccc; border-radius: 4px; display: none; background: white; position: absolute; z-index: 1000; width: 100%;">
                                </div>
                                <div id="edit_selected_contributors" class="mt-2 d-flex flex-wrap gap-2">
                                </div>
                                <input type="hidden" id="edit_contributors" name="contributors" value="">
                            </div>
                        </div>
                        <div class="modal-footer modal-footer-custom">
                            <button type="button" class="btn-custom-close" aria-label="Close"
                                data-bs-dismiss="modal">
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

        <!-- Modal Delete Confirmation -->
        <div class="modal fade" id="deleteFileModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content modal-content-custom">
                    <div class="modal-body modal-body-custom">
                        <p id="deleteFileName" class="fw-normal text-center"></p>
                        <p class="text-center fs-6">Are you sure you want to delete this file?</p>
                    </div>
                    <div class="modal-footer modal-footer-custom">
                        <button type="button" class="btn btn-custom-close" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-submit-black" id="confirmDeleteBtn">Delete</button>
                    </div>
                </div>
            </div>
        </div>

        <div class="modal fade" id="editProjectTaskModal" data-bs-backdrop="static" data-bs-keyboard="false"
            tabindex="-1" aria-labelledby="editProjectTaskModalLabel" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content modal-content-custom">
                    <div class="modal-loading-overlay d-none" id="editProjectTaskModalLoader">
                        <div class="loader-spinner"></div>
                    </div>
                    <div class="modal-header modal-header-custom">
                        <h5 class="modal-title modal-title-custom" id="editProjectTaskModalLabel">Edit Task</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"
                            aria-label="Close"></button>
                    </div>
                    <form id="editProjectTaskForm" enctype="multipart/form-data">
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

                            <div class="mb-3 input-custom">
                                <label for="edit_task_title" class="form-label label-custom">Title</label>
                                <input type="text" class="form-control input-text" id="edit_task_title"
                                    name="title" required>
                            </div>
                            <div class="mb-3 input-custom">
                                <label for="edit_task_description" class="form-label label-custom">Description</label>
                                <div id="edit_task_description_editor"
                                    style="min-height:120px; background:#fff; border: none; border-radius:6px;">
                                </div>
                                <textarea class="form-control input-text d-none" id="edit_task_description" name="description" rows="6"
                                    style="display:none;"></textarea>
                            </div>
                            <div class="mb-3 input-custom">
                                <label for="edit_task_project_input" class="form-label label-custom">Project</label>
                                <input type="text" class="form-control input-text" id="edit_task_project_input"
                                    autocomplete="off" placeholder="Search project..." required>
                                <div id="edit_task_project_dropdown" class="dropdown-list mt-1 dropup"></div>
                                <div id="edit_task_selected_project" class="mt-2"></div>
                                <input type="hidden" id="edit_task_project_id" name="project_id" value="">
                            </div>

                            <div class="mb-3 input-custom">
                                <label for="edit_task_parent_input" class="form-label label-custom">Related to Task
                                    (optional)</label>
                                <input type="text" class="form-control input-text" id="edit_task_parent_input"
                                    autocomplete="off" placeholder="Search task...">
                                <div id="edit_task_parent_dropdown" class="dropdown-list mt-1"></div>
                                <div id="edit_task_selected_parent" class="mt-2"></div>
                                <input type="hidden" id="edit_task_parent_id" name="parent_id" value="">
                            </div>

                            <div class="mb-3 input-custom">
                                <label for="edit_task_point" class="form-label label-custom">Point</label>
                                <input type="number" class="form-control input-text" id="edit_task_point"
                                    name="point" value="1" min="1" required>
                            </div>
                            <div class="mb-3 input-custom">
                                <label for="edit_task_priority" class="form-label label-custom">Priority</label>
                                <select class="form-select input-select" id="edit_task_priority" name="priority"
                                    required>
                                    <option value="">Select Priority</option>
                                    <option value="HIGH">HIGH</option>
                                    <option value="MEDIUM">MEDIUM</option>
                                    <option value="LOW">LOW</option>
                                </select>
                            </div>
                            <div class="mb-3 input-custom">
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
                            <div class="mb-3 input-custom">
                                <label for="edit_task_reference_files" class="form-label label-custom">Reference
                                    Files</label>
                                <input type="file" class="form-control input-text" id="edit_task_reference_files"
                                    name="reference_files[]" accept="image/*,.csv,.pdf,.doc,.docx,.xls,.xlsx,.zip"
                                    multiple>
                                <div class="form-text">Multiple files supported.</div>
                                <div id="existing_reference_files" class="mt-2"></div>
                                <div id="edit_reference_files_preview" class="mt-2"></div>
                            </div>
                            <div class="mb-3 input-custom d-flex justify-content-between">
                                <div class="date-form">
                                    <label for="edit_task_start_date" class="form-label label-custom">Start
                                        Date</label>
                                    <input type="date" class="form-control input-text" id="edit_task_start_date"
                                        name="start_date" required>
                                </div>
                                <div class="date-form">
                                    <label for="edit_task_due_date" class="form-label label-custom">Due Date</label>
                                    <input type="date" class="form-control input-text" id="edit_task_due_date"
                                        name="due_date" required>
                                </div>
                            </div>
                            <div class="mb-1 input-custom position-relative">
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
                            <div class="mb-3 input-custom position-relative">
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
                            <button type="submit" class="btn-submit-black">
                                Submit
                            </button>
                        </div>
                    </form>
                </div>
                <div class="alert-container mt-2"></div>
            </div>
        </div>

        <div class="modal fade" id="addTaskModalProject" data-bs-keyboard="false" tabindex="-1"
            aria-labelledby="addTaskModalLabel" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content modal-content-custom">
                    <div class="modal-loading-overlay d-none" id="addTaskModalLoader">
                        <div class="loader-spinner"></div>
                    </div>
                    <div class="modal-header modal-header-custom">
                        <h5 class="modal-title modal-title-custom" id="addTaskModalLabel">Add Task</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"
                            aria-label="Close"></button>
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
                                <label for="task_image" class="custom-image-upload position-relative"
                                    id="taskImageLabel" style="background-image: url('{!! asset('asset/img/background/add-image.png') !!}');">
                                    <input type="file" class="input-image" id="task_image" name="image"
                                        accept="image/*" hidden>
                                    <span class="image-clear-btn d-none" id="taskImageClearBtn"
                                        title="Remove image">&times;</span>
                                </label>
                                <div class="invalid-feedback">
                                    Please select an image file.
                                </div>
                            </div>
                            <div class="mb-3 input-custom">
                                <label for="task_title" class="form-label label-custom">Title</label>
                                <input type="text" class="form-control input-text" id="task_title" name="title"
                                    required>
                            </div>
                            <div class="mb-3 input-custom">
                                <label for="task_description" class="form-label label-custom">Description</label>
                                <div id="task_description_editor"
                                    style="min-height:120px; background:#fff; border: none; border-radius:6px;">
                                </div>
                                <textarea class="form-control input-text d-none" id="task_description" name="description" rows="6"
                                    style="display:none;"></textarea>
                            </div>
                            <div class="mb-3 input-custom">
                                <label class="form-label label-custom">Project</label>
                                <input type="text" class="form-control input-text" id="task_project_input"
                                    autocomplete="off" placeholder="Search project..." required>
                                <div id="task_project_dropdown" class="dropdown-list mt-1 dropup"></div>
                                <div id="task_selected_project" class="mt-2" style="display: none;"></div>
                                <input type="hidden" id="task_project_id" name="project_id" value="">
                            </div>

                            <div class="mb-3 input-custom">
                                <label class="form-label label-custom">Related to Task (optional)</label>
                                <input type="text" class="form-control input-text" id="task_parent_input"
                                    autocomplete="off" placeholder="Search task...">
                                <div id="task_parent_dropdown" class="dropdown-list mt-1"></div>
                                <div id="task_selected_parent" class="mt-2"></div>
                                <input type="hidden" id="task_parent_id" name="parent_id" value="">
                            </div>


                            <div class="mb-3 input-custom">
                                <label for="task_point" class="form-label label-custom">Point</label>
                                <input type="number" class="form-control input-text" id="task_point" name="point"
                                    value="1" min="1" required>
                            </div>
                            <div class="mb-3 input-custom">
                                <label for="task_priority" class="form-label label-custom">Priority</label>
                                <select class="form-select input-select" id="task_priority" name="priority" required>
                                    <option value="">Select Priority</option>
                                    <option value="HIGH">HIGH</option>
                                    <option value="MEDIUM">MEDIUM</option>
                                    <option value="LOW">LOW</option>
                                </select>
                            </div>
                            <div class="mb-3 input-custom">
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
                            <div class="mb-3 input-custom">
                                <label for="task_reference_files" class="form-label label-custom">Reference
                                    Files</label>
                                <input type="file" class="form-control input-text" id="task_reference_files"
                                    name="reference_files[]" accept="image/*,.csv,.pdf,.doc,.docx,.xls,.xlsx,.zip"
                                    multiple>
                                <div class="form-text">Multiple files supported.</div>
                                <div id="reference_files_preview" class="mt-2"></div>
                            </div>
                            <div class="mb-3 input-custom d-flex justify-content-between">
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
                            <div class="mb-1 input-custom position-relative">
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
                            <div class="mb-3 input-custom position-relative">
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
                            <button type="submit" class="btn-submit-black">
                                Submit
                            </button>
                        </div>
                    </form>
                </div>
                <div class="alert-container mt-2"></div>
            </div>
        </div>

        <!-- Delete Task Confirmation Modal -->
        <div class="modal fade" id="deleteProjectTaskModal" tabindex="-1" aria-labelledby="deleteTaskModalLabel"
            aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered" style="max-width: 500px;">
                <div class="modal-content modal-content-custom">
                    <div class="modal-body modal-body-custom">
                        <div id="deleteProjectTaskContent"></div>
                    </div>
                    <div class="modal-footer modal-footer-custom">
                        <button type="button" class="btn btn-custom-close" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-submit-black"
                            id="confirmDeleteProjectTaskBtn">Delete</button>
                    </div>
                </div>
            </div>
        </div>

        {{-- Modal Detail Task --}}
        <div class="modal fade" id="projectTaskDetailModal" tabindex="-1"
            aria-labelledby="projectTaskDetailModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content modal-content-custom">
                    <div class="modal-body modal-body-custom">
                        <div class="task-detail-wrapper">

                            <!-- Header -->
                            <div
                                class="task-header d-flex justify-content-between align-items-start mb-2 task-card-header">
                                <div class="d-flex align-items-center">
                                    <div id="projectTaskProjectAvatar" class="me-3"></div>
                                    <div>
                                        <small class="text-muted" style="font-size: 11px;"
                                            id="projectTaskProjectTitle"></small>
                                        <h5 class="mb-0" id="projectTaskTitle"
                                            style="font-size:14px;font-weight:600;">-
                                        </h5>
                                    </div>
                                </div>
                            </div>

                            <!-- Description -->
                            <div class="description-container">
                                <div id="projectTaskDescription" class="description-detail text-muted">No description
                                </div>
                            </div>

                            <hr>

                            <!-- Ref Urls -->
                            <div id="referenceUrlsList" class="d-flex flex-column gap-2 mb-2">

                            </div>

                            <!-- Ref Files -->
                            <div id="referenceFilesList" class="d-flex flex-column gap-2 mb-2">

                            </div>

                            <div class="d-flex justify-content-between align-items-start">
                                <!-- Collaborators -->
                                <div class="collab-section mt-3 mb-3" style="font-size: 12px;">
                                    <div id="projectTaskCollaborators"></div>
                                </div>

                                <!-- Action Icon -->
                                <div class="d-flex justify-content-end">
                                    <button class="btn border-0 playlist-add-check" data-bs-target="#completedModal"
                                        data-bs-toggle="modal">
                                        <span style="font-size: 18px; color: #444;"
                                            class="material-symbols-outlined">playlist_add_check</span>
                                    </button>
                                    <button class="btn border-0 feedback-detail-task" id="projectTaskFeedbackBtn" data-task-id="{{ $taskId ?? '' }}" data-bs-target="#projectTaskFeedbackModal" data-bs-toggle="modal">
                                        <span style="font-size: 18px; color: #444;"
                                            class="material-symbols-outlined">mode_comment</span>
                                    </button>
                                </div>
                            </div>

                            <!-- Meta Info -->
                            <div class="d-flex justify-content-between mb-2" style="font-size:12px;">
                                <div><span class="text-muted">Priority:</span> <span font
                                        id="projectTaskPriority">-</span></div>
                                <div><span class="text-muted">Deadline:</span> <span id="projectTaskDeadline">-</span>
                                </div>
                            </div>

                            <div class="d-flex justify-content-between mb-1" style="font-size:12px;">
                                <span class="text-muted">Department:</span>
                                <span id="projectTaskDepartment">-</span>
                            </div>

                            <div class="d-flex justify-content-between mb-4" style="font-size:12px;">
                                <span class="text-muted">Division:</span>
                                <span id="projectTaskDivision">-</span>
                            </div>

                            <!-- Status Changes -->
                            <div id="projectTaskStatusChanges" class="mt-3"></div>

                        </div>
                    </div>

                    <div class="modal-footer modal-footer-custom mt-3">
                        <button type="button" class="btn btn-custom-close" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>

        <div class="modal fade" id="completedModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content modal-content-custom">
                    <div class="modal-body modal-body-custom">
                        <div class="d-flex align-items-center mb-3">
                            <img id="completed_task_image" src="" alt="Project Image"
                                class="rounded-circle me-2" width="34" height="34">
                            <div>
                                <h6 id="completed_project_title" class="mb-1 text-muted" style="font-size:10px;">
                                </h6>
                                <h6 id="completed_task_title" class="mb-0 fw-normal" style="font-size:16px;"></h6>
                            </div>
                        </div>

                        <div class="mb-4 task-description-container">
                            <div id="completed_task_note" style="font-size: 14px" class="text-muted task-description"><em>No note</em></div>
                        </div>

                        <div class="row mb-4 link-file-task">
                            
                            <div class="col-12 mb-3" style="font-size: 12px;">
                                <label class="fw-normal text-muted d-block mb-1">Links:</label>
                                <div id="completed_task_urls"><em>-</em></div>
                            </div>
                            <div class="col-12 mb-5" style="font-size: 12px;">
                                <label class="fw-normal text-muted d-block mb-1">Files:</label>
                                <div id="completed_task_files"><em>-</em></div>
                            </div>

                            <div class="col-6 d-flex align-items-center" style="font-size: 12px;">
                                <label class="fw-normal text-muted me-2 mb-0">Priority:</label>
                                <span id="completed_priority">-</span>
                            </div>
                            <div class="col-6 d-flex align-items-center" style="font-size: 12px;">
                                <label class="fw-normal text-muted me-2 mb-0">Complete Date:</label>
                                <span id="completed_date">-</span>
                            </div>

                        </div>

                        <div class="modal-footer modal-footer-custom">
                            <button type="button" class="btn btn-custom-close"
                                data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {{-- Feedback form templates (rendered in Blade). JS will clone these into the modal body. --}}
        <template id="template-add-feedback">
            <form id="addFeedbackForm" enctype="multipart/form-data">
                <input type="hidden" name="project_id" value="">
                <input type="hidden" name="employee_id" value="">
                <input type="hidden" name="parent_id" value="">

                <div class="mb-3">
                    <label class="form-label">Upload Image</label>
                    <div class="image-upload-container">
                        <label for="feedback_image" class="custom-image-upload position-relative"
                            id="feedbackImageLabel"
                            style="background-position: center center; background-repeat: no-repeat; background-size: 50%; background-image: url('{{ asset('asset/img/background/add-image.png') }}'); cursor: pointer;">
                            <input type="file" id="feedback_image" name="feedback_image" accept="image/*"
                                class="d-none">
                            <span class="image-clear-btn d-none" id="feedbackImageClearBtn"
                                title="Remove image">&times;</span>
                        </label>
                    </div>
                </div>

                <div class="mb-3 input-custom">
                    <label for="feedback_comment" class="form-label">Feedback Comment</label>

                    <!-- Quill toolbar + editor (visual) -->
                    <div id="feedback_toolbar">
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

                    <div id="feedback_editor"
                        style="min-height:120px; background:#fff; border:1px solid #e3e6ee; border-radius:6px;"></div>

                    <!-- canonical hidden textarea so backend controllers keep receiving same payload -->
                    <textarea class="form-control input-text d-none" id="feedback_comment" name="feedback_comment" rows="3"
                        style="display:none;"></textarea>
                </div>

                <div class="mb-3 input-custom">
                    <label class="form-label">Reference URLs (Optional)</label>
                    <div id="feedback_reference_urls_container" class="d-flex flex-column gap-2">
                        <div class="d-flex gap-2 align-items-center">
                            <input type="url" class="form-control input-text" name="reference_urls[]"
                                placeholder="https://example.com">
                            <button type="button" class="btn btn-submit-black add-ref-url"
                                aria-label="Add URL"><span class="material-symbols-outlined">add</span></button>
                        </div>
                    </div>
                </div>

                <div class="mb-3 input-custom">
                    <label for="feedback_reference_files" class="form-label">Reference Files (Optional)</label>
                    <input type="file" class="form-control" id="feedback_reference_files"
                        name="reference_files[]" multiple
                        accept="image/*,.csv,.pdf,.doc,.docx,.xls,.xlsx,.zip,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel">
                    <div id="feedback_reference_files_preview" class="mt-2"></div>
                </div>
            </form>
        </template>

        <template id="template-reply-feedback">
            <form id="replyFeedbackForm" enctype="multipart/form-data">
                <input type="hidden" name="project_id" value="">
                <input type="hidden" name="parent_id" value="">
                <input type="hidden" name="employee_id" value="">

                <div class="mb-3 input-custom">
                    <label class="form-label">Upload Image</label>
                    <div class="image-upload-container">
                        <label for="feedback_image" class="custom-image-upload position-relative"
                            id="feedbackImageLabel"
                            style="background-position: center center; background-repeat: no-repeat; background-size: 50%; background-image: url('{{ asset('asset/img/background/add-image.png') }}'); cursor: pointer;">
                            <input type="file" id="feedback_image" name="feedback_image" accept="image/*"
                                class="d-none">
                            <span class="image-clear-btn d-none" id="feedbackImageClearBtn"
                                title="Remove image">&times;</span>
                        </label>
                    </div>
                </div>

                <div class="mb-3 input-custom">
                    <label for="feedback_comment" class="form-label">Feedback Comment</label>

                    <!-- Quill toolbar + editor (visual) -->
                    <div id="reply_feedback_toolbar">
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

                    <div id="reply_feedback_editor"
                        style="min-height:120px; background:#fff; border:1px solid #e3e6ee; border-radius:6px;"></div>

                    <!-- canonical hidden textarea so backend controllers keep receiving same payload -->
                    <textarea class="form-control input-text d-none" id="feedback_comment" name="feedback_comment" rows="3"
                        style="display:none;"></textarea>
                </div>

                <div class="mb-3 input-custom">
                    <label class="form-label">Reference URLs (Optional)</label>
                    <div id="feedback_reference_urls_container" class="d-flex flex-column gap-2">
                        <div class="d-flex gap-2 align-items-center">
                            <input type="url" class="form-control input-text" name="reference_urls[]"
                                placeholder="https://example.com">
                            <button type="button" class="btn btn-submit-black add-ref-url"
                                aria-label="Add URL"><span class="material-symbols-outlined">add</span></button>
                        </div>
                    </div>
                </div>

                <div class="mb-3 input-custom">
                    <label for="reply_reference_files" class="form-label">Reference Files (Optional)</label>
                    <input type="file" class="form-control" id="reply_reference_files"
                        name="reference_files[]" multiple
                        accept="image/*,.csv,.pdf,.doc,.docx,.xls,.xlsx,.zip,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel">
                    <div id="reply_reference_files_preview" class="mt-2"></div>
                </div>
            </form>
        </template>

        <!-- Quill assets and inline initializer for Project Detail edit modal -->
        <link href="https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.snow.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.min.js"></script>
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
                            // Only enforce non-empty validation if Quill editor is present.
                            const plain = (window.__quillTaskAdd && typeof window.__quillTaskAdd.getText ===
                                'function') ? window.__quillTaskAdd.getText().trim() : null;
                            if (plain === '') {
                                e.preventDefault();
                                e.stopImmediatePropagation();
                                try {
                                    window.__quillTaskAdd && window.__quillTaskAdd.focus();
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
                            // Only enforce non-empty validation if Quill editor is present.
                            const plain = (window.__quillTaskEdit && typeof window.__quillTaskEdit.getText ===
                                'function') ? window.__quillTaskEdit.getText().trim() : null;
                            if (plain === '') {
                                e.preventDefault();
                                e.stopImmediatePropagation();
                                try {
                                    window.__quillTaskEdit && window.__quillTaskEdit.focus();
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
        <script>
            document.addEventListener('DOMContentLoaded', function() {
                try {
                    if (document.getElementById('project_description_editor')) {

                        var addToolbarEl = document.getElementById('task_description_toolbar');
                        var addToolbarConfig = addToolbarEl ? '#task_description_toolbar' : false;
                        window.__quillTaskAdd = new Quill('#project_description_editor', {
                            modules: {
                                toolbar: addToolbarConfig
                            },
                            theme: 'snow'
                        });
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
                            preventImageDropAndPaste(window.__quillTaskAdd, '#project_description_editor');
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

                const editProjectForm = document.getElementById('editProjectForm');
                if (editProjectForm) {
                    editProjectForm.addEventListener('submit', function(e) {
                        try {
                            if (window.__quillProjectEdit) syncQuillToTextarea(window.__quillProjectEdit,
                                'edit_description');
                            // Only enforce non-empty validation if Quill editor is present.
                            const plain = (window.__quillProjectEdit && typeof window.__quillProjectEdit
                                .getText ===
                                'function') ? window.__quillProjectEdit.getText().trim() : null;
                            if (plain === '') {
                                e.preventDefault();
                                e.stopImmediatePropagation();
                                try {
                                    window.__quillProjectEdit && window.__quillProjectEdit.focus();
                                } catch (_) {}
                                return false;
                            }
                        } catch (_) {}
                    }, true);
                }

                // Clear editors when modals hide (keep canonical textareas in sync)
                try {
                    $('#editProjectModal').on('hidden.bs.modal', function() {
                        try {
                            if (window.__quillProjectEdit && window.__quillProjectEdit.root) window
                                .__quillProjectEdit
                                .root.innerHTML = '';
                        } catch (_) {}
                        try {
                            const ta = document.getElementById('edit_description');
                            if (ta) ta.value = '';
                        } catch (_) {}
                    });
                } catch (_) {}

                // Polling fallback: if edit textarea is updated programmatically (task.js), mirror into Quill
                try {
                    let lastEditProj = document.getElementById('edit_description')?.value || '';
                    setInterval(function() {
                        try {
                            const ta = document.getElementById('edit_description');
                            if (!ta || !window.__quillProjectEdit || !window.__quillProjectEdit.root) return;
                            if (ta.value !== lastEditProj) {
                                lastEditProj = ta.value;
                                window.__quillProjectEdit.root.innerHTML = ta.value || '';
                            }
                        } catch (_) {}
                    }, 300);
                } catch (_) {}
            });
        </script>

        <template id="template-edit-feedback">
            <form id="editFeedbackForm" enctype="multipart/form-data">
                <input type="hidden" name="parent_id" value="">
                <input type="hidden" id="edit_remove_image" name="remove_image" value="0">

                <div class="mb-3 input-custom">
                    <label class="form-label">Upload Image</label>
                    <div class="image-upload-container">
                        <label for="feedback_image" class="custom-image-upload position-relative"
                            id="editFeedbackImageLabel"
                            style="background-position: center center; background-repeat: no-repeat; background-size: 50%; background-image: url('{{ asset('asset/img/background/add-image.png') }}'); cursor: pointer;">
                            <input type="file" id="feedback_image" name="feedback_image" accept="image/*"
                                class="d-none">
                            <span class="image-clear-btn d-none" id="editFeedbackImageClearBtn"
                                title="Remove image">&times;</span>
                        </label>
                    </div>
                </div>

                <div class="mb-3 input-custom">
                    <label for="feedback_comment" class="form-label">Feedback Comment</label>

                    <!-- Quill toolbar + editor (visual) -->
                    <div id="edit_feedback_toolbar">
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

                    <div id="edit_feedback_editor"
                        style="min-height:120px; background:#fff; border:1px solid #e3e6ee; border-radius:6px;"></div>

                    <!-- canonical hidden textarea so backend controllers keep receiving same payload -->
                    <textarea class="form-control input-text d-none" id="feedback_comment" name="feedback_comment" rows="3"
                        style="display:none;"></textarea>
                </div>

                <div class="mb-3 input-custom">
                    <label class="form-label">Reference URLs (Optional)</label>
                    <div id="feedback_reference_urls_container" class="d-flex flex-column gap-2"></div>
                </div>

                <div class="mb-3 input-custom">
                    <label for="edit_reference_files" class="form-label">Reference Files (Optional)</label>
                    <input type="file" class="form-control" id="edit_reference_files"
                        name="reference_files[]" multiple
                        accept="image/*,.csv,.pdf,.doc,.docx,.xls,.xlsx,.zip,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel">
                    <input type="hidden" id="existing_feedback_reference_files_input"
                        name="existing_reference_files" value="[]">
                    <div id="existing_feedback_reference_files" class="mt-2 d-flex flex-wrap gap-2"></div>
                    <div id="edit_feedback_reference_files_preview" class="mt-2"></div>
                </div>
            </form>
        </template>

        <div class="modal fade" id="projectFeedbackModal" tabindex="-1"
            aria-labelledby="projectFeedbackModalLabel" aria-hidden="true"
            data-project-id="{{ $project->id ?? '' }}"
            data-employee-id="{{ auth()->user()->employee->id ?? '' }}">
            <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable feedback-modal-dialog">
                <div class="modal-content modal-content-custom">
                    <div
                        class="modal-header modal-header-custom d-flex align-items-center position-relative flex-nowrap">
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

        <!-- Task Feedback Modal -->
        <div class="modal fade" id="projectTaskFeedbackModal" tabindex="-1" aria-labelledby="projectTaskFeedbackModalLabel"
            aria-hidden="true" data-task-id="{{ $taskId ?? '' }}"
            data-employee-id="{{ auth()->user()->employee->id ?? '' }}"
            data-employee-department-id="{{ auth()->user()->employee->department_id ?? '' }}">
            <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable feedback-modal-dialog">
                <div class="modal-content modal-content-custom">
                    <div class="modal-header modal-header-custom d-flex align-items-center position-relative flex-nowrap">
                        <h5 class="modal-title feedback-modal-title flex-grow-1 fs-5 fw-normal"
                            id="projectTaskFeedbackModalLabel">Task Feedback</h5>
                        <button type="button" class="btn-close ms-3 flex-shrink-0" data-bs-dismiss="modal"
                            aria-label="Close"></button>
                    </div>

                    <div class="modal-body feedback-modal-body" id="projectTaskFeedbackList">
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

        <x-slot name="script_slot">
            <script src="https://cdn.jsdelivr.net/npm/jsplumb@2.15.6/dist/js/jsplumb.min.js"></script>
            <script src="https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.min.js"></script>
            <script src="{{ asset('asset/js/date_helper.js') }}?v={{ time() }}"></script>
            <script src="{{ asset('asset/js/project_detail.js') }}?v={{ time() }}"></script>
            <script src="{{ asset('asset/js/project_detail_timeline.js') }}?v={{ time() }}"></script>
            <script src="{{ asset('asset/js/task.js') }}?v={{ time() }}"></script>
            <script src="{{ asset('asset/js/project_detail_depedencies.js') }}?v={{ time() }}"></script>
            <script src="{{ asset('asset/js/project_detail_plumb.js') }}?v={{ time() }}"></script>
            <script>
                window.APP_URL = document.querySelector('meta[name="app-url"]').getAttribute('content');

                // Setup parent task input to show dropdown when user types
                document.addEventListener('DOMContentLoaded', function() {
                    const taskParentInput = document.getElementById('task_parent_input');
                    const taskParentDropdown = document.getElementById('task_parent_dropdown');

                    if (taskParentInput && taskParentDropdown) {
                        // Show dropdown on focus/click if it has content
                        taskParentInput.addEventListener('focus', function() {
                            if (taskParentDropdown.children.length > 0 && taskParentDropdown.innerHTML.trim() !==
                                '') {
                                taskParentDropdown.style.display = 'block';
                            }
                        });

                        // Hide dropdown when clicking outside
                        document.addEventListener('click', function(e) {
                            if (!taskParentInput.contains(e.target) && !taskParentDropdown.contains(e.target)) {
                                taskParentDropdown.style.display = 'none';
                            }
                        });
                    }
                });
                // Lightweight runtime diagnostics for Edit Project form
                (function() {
                    try {
                        document.addEventListener('DOMContentLoaded', function() {
                            try {
                                console.debug && console.debug('[debug] project show page loaded. APP_URL=', window
                                    .APP_URL);
                                var form = document.getElementById('editProjectForm');
                                console.debug && console.debug('[debug] editProjectForm present:', !!form);
                                if (form) {
                                    var submitBtn = form.querySelector('button[type="submit"]');
                                    console.debug && console.debug('[debug] editProjectForm submit button present:', !!
                                        submitBtn);
                                    if (submitBtn) {
                                        submitBtn.addEventListener('click', function(ev) {
                                            try {
                                                console.debug && console.debug(
                                                    '[debug] editProjectForm submit button clicked');
                                            } catch (_) {}
                                        });
                                    }

                                    // Small check to show whether jQuery has attached a submit handler (best-effort)
                                    try {
                                        if (window.jQuery) {
                                            var ev = jQuery._data && jQuery._data(form, 'events') ? jQuery._data(form,
                                                'events') : null;
                                            console.debug && console.debug('[debug] jQuery events on editProjectForm:',
                                                ev ? Object.keys(ev) : ev);
                                        }
                                    } catch (_) {}
                                }
                            } catch (e) {
                                console.warn('project show debug inner failed', e);
                            }
                        });
                    } catch (e) {
                        console.warn('project show debug failed', e);
                    }
                })();
            </script>
            <script src="{{ asset('asset/js/contributions_project.js') }}?v={{ time() }}"></script>
            <script>
                // Ensure reference URLs modal opens cleanly when triggered from inside another modal
                document.addEventListener('DOMContentLoaded', function() {
                    try {
                        document.querySelectorAll('[data-bs-target="#referenceUrlsModal"]').forEach(function(btn) {
                            btn.addEventListener('click', function(ev) {
                                try {
                                    // If task detail modal is open, hide it first to avoid nested modal backdrop issues
                                    var detailModalEl = document.getElementById('projectTaskDetailModal');
                                    if (detailModalEl && detailModalEl.classList.contains('show')) {
                                        var inst = bootstrap.Modal.getInstance(detailModalEl) || bootstrap
                                            .Modal.getOrCreateInstance(detailModalEl);
                                        try {
                                            inst.hide();
                                        } catch (_) {}
                                    }

                                    // If button is inside a task element that has data-task-id, forward that id to the URL loader helper
                                    var taskId = null;
                                    try {
                                        // look for nearest ancestor with data-task-id or dataset
                                        var el = btn;
                                        while (el) {
                                            if (el.dataset && el.dataset.taskId) {
                                                taskId = el.dataset.taskId;
                                                break;
                                            }
                                            if (el.getAttribute && el.getAttribute('data-task-id')) {
                                                taskId = el.getAttribute('data-task-id');
                                                break;
                                            }
                                            el = el.parentElement;
                                        }
                                    } catch (_) {}

                                    if (taskId && typeof showReferenceUrlsForTask === 'function') {
                                        // slight delay to allow previous modal hide animation to finish
                                        setTimeout(function() {
                                            try {
                                                showReferenceUrlsForTask(taskId);
                                            } catch (_) {}
                                        }, 200);
                                        ev.preventDefault();
                                    }
                                } catch (_) {}
                            });
                        });
                    } catch (_) {}
                });
            </script>
            <script>
                // Fallback project dropdown loader specific to Project Detail page.
                // Purpose: ensure '#edit_task_project_input' and '#task_project_input' get a project list
                // even if other global loaders didn't run or failed. Uses cached fetch to /project/index.
                (function(){
                    function fetchProjectsOnce(){
                        if (window.__projectsForDropdown) return Promise.resolve(window.__projectsForDropdown);
                        return fetch(window.APP_URL + '/project/index', { credentials: 'same-origin' })
                            .then(r => r.ok ? r.json() : Promise.reject(r))
                            .then(payload => {
                                const data = (payload && payload.data) ? payload.data : (payload || []);
                                window.__projectsForDropdown = Array.isArray(data) ? data : [];
                                return window.__projectsForDropdown;
                            })
                            .catch(err => {
                                console.warn('fetchProjectsOnce failed', err);
                                window.__projectsForDropdown = [];
                                return window.__projectsForDropdown;
                            });
                    }

                    function wireProjectInput(prefix){
                        try{
                            const input = document.getElementById(prefix + '_project_input');
                            const dropdown = document.getElementById(prefix + '_project_dropdown');
                            const selected = document.getElementById(prefix + '_selected_project');
                            const hidden = document.getElementById(prefix + '_project_id');
                            if (!input || !dropdown || !selected || !hidden) return;

                            let projects = [];

                            function showSelected(p){
                                try{
                                    hidden.value = p.id || '';
                                    input.value = p.title || p.name || '';
                                    selected.innerHTML = `
                                        <div class="d-flex align-items-center gap-2 p-2 rounded bg-light selected-project">
                                            ${p.image ? `<img src="${window.APP_URL}/file/project/${p.image}" width="28" height="28" style="object-fit:cover;border-radius:50%;">` : `<div class="rounded-circle d-flex align-items-center justify-content-center" style="width:28px;height:28px;background:#6A5AE0;color:#fff;font-size:14px;">${(p.title||p.name||'').charAt(0).toUpperCase()}</div>`}
                                            <span class="flex-grow-1">${p.title || p.name || ''}</span>
                                            <button type="button" class="btn btn-sm btn-remove-project" style="line-height:1">
                                                <span class="material-symbols-outlined">close</span>
                                            </button>
                                        </div>`;
                                    const btn = selected.querySelector('.btn-remove-project');
                                    if (btn) btn.addEventListener('click', function(){ hidden.value=''; input.value=''; selected.innerHTML=''; });
                                }catch(e){console.warn('showSelected error',e);}    
                            }

                            function render(filter, autoShow){
                                dropdown.innerHTML = '';
                                const f = (filter || '').toLowerCase();
                                const list = projects.filter(p => (p.title||p.name||'').toLowerCase().includes(f));
                                list.forEach(p =>{
                                    const item = document.createElement('div');
                                    item.className = 'dropdown-item d-flex align-items-center gap-2';
                                    const avatar = p.image ? `<img src="${window.APP_URL}/file/project/${p.image}" width="24" height="24" style="object-fit:cover;border-radius:50%;"/>` : `<div class="rounded-circle d-flex align-items-center justify-content-center" style="width:24px;height:24px;background:#6A5AE0;color:#fff;font-size:12px;">${(p.title||p.name||'').charAt(0).toUpperCase()}</div>`;
                                    item.innerHTML = avatar + '<span>' + (p.title||p.name||'') + '</span>';
                                    item.addEventListener('click', function(){ showSelected(p); dropdown.style.display='none'; try{ if (typeof loadRelatedTasks === 'function') loadRelatedTasks(p.id, prefix + '_parent_input'); }catch(_){} });
                                    dropdown.appendChild(item);
                                });
                                dropdown.style.display = (list.length && autoShow) ? 'block' : 'none';
                            }

                            input.addEventListener('input', function(){ render(this.value, true); });
                            input.addEventListener('focus', function(){ render(this.value, true); });
                            document.addEventListener('click', function(e){ if (!dropdown.contains(e.target) && e.target !== input) dropdown.style.display='none'; });

                            // Load projects once and cache
                            fetchProjectsOnce().then(res => { projects = res || []; /* if there's already a selected id, preselect */ if (hidden && hidden.value) { const found = projects.find(p => String(p.id) === String(hidden.value)); if (found) showSelected(found); } }).catch(()=>{});
                        }catch(e){console.warn('wireProjectInput failed', e);}                    
                    }

                    // Wire when modals are shown (ensures element present and avoids race conditions)
                    document.addEventListener('DOMContentLoaded', function(){
                        try{
                            ['editTask','editProjectTask','addTaskModalProject','addTaskModal'].forEach(mid => {
                                const modalEl = document.getElementById(mid + 'Modal');
                                if (!modalEl) return;
                                modalEl.addEventListener('shown.bs.modal', function(){
                                    try{
                                        // Map modal ids to prefixes used in inputs
                                        if (mid === 'editTask' || mid === 'editProjectTask') wireProjectInput('edit_task');
                                        if (mid === 'addTaskModalProject' || mid === 'addTaskModal') wireProjectInput('task');
                                    }catch(e){console.warn('modal shown handler failed', e);} 
                                });
                            });
                        }catch(e){console.warn('project dropdown wiring failed', e);} 
                    });
                })();
            </script>
        </x-slot>
    </x-office-layout>
