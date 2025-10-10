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
            <link rel="stylesheet" href="{{ asset('asset/css/project.css') }}?v={{ time() }}">
            <link rel="stylesheet" href="{{ asset('asset/css/project-detail.css?v=') . time() }}">
        </x-slot>

        <div class="d-flex justify-content-between align-items-center mb-4">
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
            <div class="d-flex align-items-center">
                <button class="btn btn-contributor-custom me-2" id="openContributionsModalBtn" title="My Contributions">
                    <span class="material-symbols-outlined">grid_view</span>
                </button>
                <button class="btn-submit-black" id="exportProjectReportBtn" data-project-id="{{ $project->id ?? '' }}">
                    <span class="material-symbols-outlined me-2">download</span>Report
                </button>
            </div>
        </div>

        <div class="detail-project-container">
            {{-- Hidden fields for Contributions modal JS (scope to this project) --}}
            <input type="hidden" name="employee_id" value="{{ auth()->user()->employee->id ?? '' }}">
            <input type="hidden" id="contrib-endpoint" value="{{ route('employees.contributions', ['id' => auth()->user()->employee->id ?? 0]) }}">
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
                        <div class="d-flex justify-content-between">
                            <div class="d-flex">
                                <button id="btn-references" class="detail-icon" title="References">
                                    <span class="material-symbols-outlined me-3">attach_file</span>
                                </button>
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
                        <div class="d-flex justify-content-end">
                            <button class="btn btn-sm border-0" id="fullscreen-tree-btn">
                                <span class="material-symbols-outlined">fullscreen</span>
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
                                        multiple accept="image/*,.csv,.pdf,.doc,.docx,.xls,.xlsx,.zip" class="d-none">
                                    <input type="text" id="inline_edit_feedback_input" name="edit_feedback"
                                        class="d-none">
                                </div>
                                <div class="d-flex justify-content-end submit-feedback">
                                    <button type="button" class="btn btn-submit-black" id="inlineFeedbackSendBtn">
                                        Send
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

        {{-- Contributions Modal (same UI as Project page) --}}
        <div class="modal fade" id="contributionsModal" tabindex="-1" aria-labelledby="contributionsModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered modal-lg">
                <div class="modal-content rounded-4 border-0">
                    <div class="modal-header border-0">
                        <h5 class="modal-title modal-title-custom" id="contributionsModalLabel">My Contributions</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
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

                                <div id="edit_description_editor"
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
                                    name="reference_file[]" accept="image/*,.csv,.pdf,.doc,.docx,.xls,.xlsx,.zip"
                                    multiple>
                                <div id="edit_reference_files_preview" class="mt-2"></div>
                                <div id="existing_reference_files" class="mt-2"></div>
                                <input type="hidden" id="existing_reference_files_input"
                                    name="existing_reference_files" value="[]">
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
                                <label class="form-label label-custom">Part of Project</label>
                                <input type="text" class="form-control input-text" id="edit_part_of_project_input"
                                    autocomplete="off" placeholder="Search project...">
                                <div id="edit_part_of_project_dropdown" class="dropdown-list mt-1"></div>
                                <div id="edit_selected_project" class="mt-2"></div>
                                <input type="hidden" id="edit_part_of_project" name="part_of_project"
                                    value="">
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

        {{-- Reference Files Modal --}}
        <div class="modal fade modal-custom" id="projectFilesModal" tabindex="-1"
            aria-labelledby="projectFilesModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                <div class="modal-content modal-content-custom">
                    <div class="modal-header modal-header-custom d-flex justify-content-between">
                        <div>
                            <h5 class="modal-title modal-title-custom fs-5 fw-normal" id="projectFilesModalLabel">
                                Reference Files
                            </h5>
                        </div>
                        <div>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"
                                aria-label="Close"></button>
                        </div>
                    </div>
                    <hr>
                    <div class="modal-body modal-body-custom">
                        <div id="projectReferenceFilesList" class="d-flex flex-column gap-2">
                        </div>
                    </div>
                    <div class="modal-footer modal-footer-custom">
                        <button type="button" data-bs-toggle="modal" data-bs-target="#addProjectReferenceFilesModal"
                            class="btn btn-submit-black">Add
                            Files</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Add Project Reference Files Modal -->
        <div class="modal fade" id="addProjectReferenceFilesModal" tabindex="-1"
            aria-labelledby="addProjectReferenceFilesModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                <div class="modal-content modal-content-custom">
                    <div class="modal-header modal-header-custom">
                        <h5 class="modal-title modal-title-custom fs-5 fw-normal"
                            id="addProjectReferenceFilesModalLabel">Add Files</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"
                            aria-label="Close"></button>
                    </div>
                    <div class="modal-body modal-body-custom">
                        <form id="addProjectReferenceFilesForm" enctype="multipart/form-data">
                            <input type="hidden" name="project_id" id="addRefProjectId" value="">
                            <div class="mb-3">
                                <label for="add_project_reference_files" class="form-label label-custom">Select
                                    files</label>
                                <input type="file" class="form-control input-text"
                                    id="add_project_reference_files" name="reference_files[]"
                                    accept="image/*,.csv,.pdf,.doc,.docx,.xls,.xlsx,.zip" multiple>
                            </div>

                            <div id="add_project_reference_files_preview" class="mt-2"></div>
                        </form>
                    </div>
                    <div class="modal-footer modal-footer-custom">
                        <button type="button" class="btn btn-custom-close" data-bs-dismiss="modal">Close</button>
                        <button type="button" id="submitAddProjectReferenceFiles"
                            class="btn btn-submit-black">Upload</button>
                    </div>
                </div>
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

        {{-- Modal Detail Task --}}
        <div class="modal fade" id="taskDetailModal" tabindex="-1" aria-labelledby="taskDetailModalLabel"
            aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content modal-content-custom">
                    <div class="modal-body modal-body-custom">
                        <div class="task-detail-wrapper">

                            <!-- Header -->
                            <div class="task-header d-flex justify-content-between align-items-start mb-2">
                                <div class="d-flex align-items-center">
                                    <div id="taskProjectAvatar" class="me-3"></div>
                                    <div>
                                        <small class="text-muted" style="font-size: 11px;" id="taskProjectTitle"></small>
                                        <h5 class="mb-0" id="taskTitle" style="font-size:16px;font-weight:600;">-
                                        </h5>
                                    </div>
                                </div>
                            </div>

                            <!-- Description -->
                            <div class="description-container">
                                <div id="taskDescription" class="description-detail text-muted">No description</div>
                            </div>

                            <hr>

                            <!-- Meta Info -->
                            <div class="d-flex justify-content-between mb-2" style="font-size:12px;">
                                <div><span class="text-muted">Priority:</span> <span id="taskPriority">-</span></div>
                                <div><span class="text-muted">Deadline:</span> <span id="taskDeadline">-</span></div>
                            </div>

                            <div class="d-flex justify-content-between mb-1" style="font-size:12px;">
                                <span class="text-muted">Department:</span>
                                <span id="taskDepartment">-</span>
                            </div>

                            <div class="d-flex justify-content-between mb-2" style="font-size:12px;">
                                <span class="text-muted">Division:</span>
                                <span id="taskDivision">-</span>
                            </div>

                            <!-- Collaborators -->
                            <div class="collab-section mt-3">
                                <div id="taskCollaborators"></div>
                            </div>

                            <!-- Status Changes -->
                            <div id="taskStatusChanges" class="mt-3"></div>

                        </div>
                    </div>

                    <div class="modal-footer modal-footer-custom mt-3">
                        <button type="button" class="btn btn-custom-close" data-bs-dismiss="modal">Close</button>
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
                        name="reference_files[]" multiple accept="image/*,.csv,.pdf,.doc,.docx,.xls,.xlsx,.zip">
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
                    <input type="file" class="form-control" id="reply_reference_files" name="reference_files[]"
                        multiple accept="image/*,.csv,.pdf,.doc,.docx,.xls,.xlsx,.zip">
                    <div id="reply_reference_files_preview" class="mt-2"></div>
                </div>
            </form>
        </template>

        <!-- Quill assets and inline initializer for Project Detail edit modal -->
        <link href="https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.snow.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.min.js"></script>
        <script>
            (function() {
                // guard: only initialize if editor container exists
                if (!document.getElementById('edit_description_editor')) return;

                // helper to block image drag/drop and paste at capture phase (prevents transient insertions)
                function preventImageDropAndPaste(quill, editorSelector) {
                    try {
                        var editor = document.querySelector(editorSelector);
                        if (!editor || !quill) return;
                        // capture-phase listeners to stop native insertions before Quill handlers run
                        editor.addEventListener('dragover', function(e) {
                            try {
                                e.preventDefault();
                            } catch (_) {}
                        }, true);
                        editor.addEventListener('drop', function(e) {
                            try {
                                if (!e.dataTransfer) return;
                                var hasFiles = e.dataTransfer.files && e.dataTransfer.files.length > 0;
                                var html = '';
                                try {
                                    html = e.dataTransfer.getData && e.dataTransfer.getData('text/html') || '';
                                } catch (_) {}
                                if (hasFiles || /<img\s*/i.test(html)) {
                                    e.preventDefault();
                                    e.stopImmediatePropagation();
                                    return;
                                }
                            } catch (_) {}
                        }, true);
                        editor.addEventListener('paste', function(e) {
                            try {
                                var clipboard = (e.clipboardData || window.clipboardData);
                                if (!clipboard) return;
                                var items = clipboard.items || [];
                                for (var i = 0; i < items.length; i++) {
                                    var t = items[i].type || '';
                                    if (t.indexOf && t.indexOf('image') === 0) {
                                        e.preventDefault();
                                        e.stopImmediatePropagation();
                                        return;
                                    }
                                }
                                var html = '';
                                try {
                                    html = clipboard.getData && clipboard.getData('text/html') || '';
                                } catch (_) {}
                                if (/<img\s*/i.test(html)) {
                                    e.preventDefault();
                                    e.stopImmediatePropagation();
                                    return;
                                }
                            } catch (_) {}
                        }, true);
                    } catch (_) {}
                }

                function syncQuillToTextarea(quill, textareaId) {
                    try {
                        var ta = document.getElementById(textareaId);
                        if (!ta) return;
                        ta.value = quill.root.innerHTML || '';
                    } catch (e) {}
                }

                // create Quill instance for edit modal
                try {
                    window.__quillProjectDetailEdit = new Quill('#edit_description_editor', {
                        modules: {
                            toolbar: '#edit_description_toolbar',
                            clipboard: {
                                matchVisual: false
                            }
                        },
                        theme: 'snow'
                    });

                    // Add clipboard matcher to drop IMG nodes early in Quill pipeline
                    try {
                        var Delta = Quill.import && Quill.import('delta');
                        if (window.__quillProjectDetailEdit && window.__quillProjectDetailEdit.clipboard && typeof window
                            .__quillProjectDetailEdit.clipboard.addMatcher === 'function') {
                            try {
                                window.__quillProjectDetailEdit.clipboard.addMatcher('IMG', function(node, delta) {
                                    try {
                                        return new Delta();
                                    } catch (_) {
                                        return delta;
                                    }
                                });
                            } catch (_) {}
                        }
                    } catch (_) {}

                    // safety-net: remove any img elements if they somehow appear
                    try {
                        if (window.__quillProjectDetailEdit && typeof window.__quillProjectDetailEdit.on === 'function') {
                            window.__quillProjectDetailEdit.on('text-change', function() {
                                try {
                                    var imgs = window.__quillProjectDetailEdit.root.querySelectorAll('img');
                                    imgs.forEach(function(i) {
                                        i.remove();
                                    });
                                } catch (_) {}
                            });
                        }
                    } catch (_) {}

                    try {
                        preventImageDropAndPaste(window.__quillProjectDetailEdit, '#edit_description_editor');
                    } catch (_) {}
                } catch (e) {
                    console.error('Quill init failed', e);
                }

                // ensure we sync before any normal submit handlers run
                document.getElementById('editProjectForm').addEventListener('submit', function(ev) {
                    if (window.__quillProjectDetailEdit) syncQuillToTextarea(window.__quillProjectDetailEdit,
                        'edit_description');
                    // basic required validation if needed
                    try {
                        var text = window.__quillProjectDetailEdit.getText().trim();
                        if (!text) {
                            ev.preventDefault();
                            alert('Description is required');
                            return false;
                        }
                    } catch (e) {}
                }, true); // capture phase

                // When project_detail JS fills #edit_description textarea, copy into Quill on modal show
                var editModalEl = document.getElementById('editProjectModal');
                if (editModalEl) {
                    editModalEl.addEventListener('shown.bs.modal', function() {
                        try {
                            var ta = document.getElementById('edit_description');
                            if (ta && window.__quillProjectDetailEdit) {
                                window.__quillProjectDetailEdit.root.innerHTML = ta.value || '';
                            }
                        } catch (e) {
                            /* no-op */
                        }
                    });

                    editModalEl.addEventListener('hidden.bs.modal', function() {
                        try {
                            if (window.__quillProjectDetailEdit) window.__quillProjectDetailEdit.root.innerHTML =
                                '';
                        } catch (_) {}
                        try {
                            document.getElementById('edit_description').value = '';
                        } catch (_) {}
                    });
                }
            })();
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
                    <input type="file" class="form-control" id="edit_reference_files" name="reference_files[]"
                        multiple accept="image/*,.csv,.pdf,.doc,.docx,.xls,.xlsx,.zip">
                    <input type="hidden" id="existing_feedback_reference_files_input"
                        name="existing_reference_files" value="[]">
                    <div id="existing_feedback_reference_files" class="mt-2 d-flex flex-wrap gap-2"></div>
                    <div id="edit_feedback_reference_files_preview" class="mt-2"></div>
                </div>
            </form>
        </template>

        <div class="modal fade" id="projectFeedbackModal" tabindex="-1" aria-labelledby="projectFeedbackModalLabel"
            aria-hidden="true" data-project-id="{{ $project->id ?? '' }}"
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

        <x-slot name="script_slot">
            <script src="https://cdn.jsdelivr.net/npm/jsplumb@2.15.6/dist/js/jsplumb.min.js"></script>
            <script src="{{ asset('asset/js/project_detail.js') }}?v={{ time() }}"></script>
            <script src="{{ asset('asset/js/project_detail_timeline.js') }}?v={{ time() }}"></script>
            <script src="{{ asset('asset/js/task.js') }}?v={{ time() }}"></script>
            <script src="{{ asset('asset/js/project_detail_depedencies.js') }}?v={{ time() }}"></script>
            <script src="{{ asset('asset/js/date_helper.js') }}?v={{ time() }}"></script>
            <script src="{{ asset('asset/js/project_detail_plumb.js') }}?v={{ time() }}"></script>
            <script>
                window.APP_URL = document.querySelector('meta[name="app-url"]').getAttribute('content');
            </script>
            <script src="{{ asset('asset/js/contributions_project.js') }}?v={{ time() }}"></script>
        </x-slot>
    </x-office-layout>
