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
            $totalTasks = $project->tasks ? $project->tasks->count() : 0;
        @endphp
        <meta name="project-image" content="{{ $imgUrl }}">
        <meta name="project-total-tasks" content="{{ $totalTasks }}">
        <link rel="stylesheet" href="{{ asset('asset/css/project-detail.css') }}">
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
        <button class="btn-submit-black">
            <span class="material-symbols-outlined me-2">download</span>Report
        </button>
    </div>

    <div class="detail-project-container">
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

                            <button id="btn-comments" class="detail-icon" title="Comments">
                                <span class="material-symbols-outlined me-3">mode_comment</span>
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
                <div class="body-content rounded-4 p-3">

                </div>
            </div>
        </div>


        {{-- Bottom Content --}}
        <div class="col-md-12 mb-3 timeline-detail-project">
            <div class="body-content rounded-4 p-3">

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
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
            '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
            '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
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
                                @if($projImg)
                                    <img src="{{ $projImgUrl }}" alt="Project Image" class="rounded-circle me-3"
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
                                <p class="description-detail" style="font-size:14px;">{{ $projDesc }}</p>
                            </div>
                            <hr class="task-separator border-3 rounded-4">

                            <div id="project-{{ $project->id ?? '0' }}" class="d-flex justify-content-between mb-1"
                                style="font-size:12px;">
                                <span>Total Task: </span>
                                <span id="project-total-tasks">{{ $totalTasks }} Tasks</span>
                            </div>

                            <div id="project-{{ $project->id ?? '0' }}" class="d-flex justify-content-between mb-1"
                                style="font-size:12px;">
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
    <div class="modal fade modal-custom" id="editProjectModal" data-bs-backdrop="static" data-bs-keyboard="false"
        tabindex="-1" aria-labelledby="editProjectModalLabel" aria-hidden="true"
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
                        <div class="mb-3 input-custom">
                            <div class="title-label-image">
                                <span>Upload image</span>
                            </div>
                            <label for="edit_image" class="custom-image-upload position-relative" id="editImageLabel"
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
                            <textarea class="form-control input-text" id="edit_description" name="description" required rows="3"></textarea>
                        </div>
                        <div class="mb-3 input-custom">
                            <label for="edit_department" class="form-label label-custom">Department</label>
                            <select class="form-select input-select" id="edit_department" name="department" required>
                                <option value="">Select Department</option>
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
                                <div class="d-flex gap-2 align-items-center">
                                    <input type="url" class="form-control input-text" name="reference_urls[]"
                                        placeholder="https://example.com">
                                    <button type="button" class="btn btn-submit-black add-ref-url"
                                        aria-label="Add URL"><span
                                            class="material-symbols-outlined">add</span></button>
                                </div>
                            </div>
                        </div>
                        <div class="mb-3 input-custom">
                            <label for="edit_reference_file" class="form-label label-custom">Reference Files</label>
                            <input type="file" class="form-control input-text" id="edit_reference_file"
                                name="reference_file[]" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip" multiple>
                            <div id="edit_reference_files_preview" class="mt-2"></div>
                            <div id="existing_reference_files" class="mt-2"></div>
                            <input type="hidden" id="existing_reference_files_input" name="existing_reference_files"
                                value="[]">
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
                            <label for="edit_part_of_project" class="form-label label-custom">Part of Project</label>
                            <select class="form-select input-select" id="edit_part_of_project"
                                name="part_of_project">
                                <option value="">Select Project</option>
                            </select>
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
                            <label for="edit_contributor_input" class="form-label label-custom">Contributor</label>
                            <input type="text" class="form-control input-text" id="edit_contributor_input"
                                name="edit_contributor_input" autocomplete="off" placeholder="Search employees...">
                            <div id="edit_contributor_dropdown" class="dropdown-list mt-1"
                                style="max-height: 200px; overflow-y: auto; border: 1px solid #ccc; border-radius: 4px; display: none; background: white; position: absolute; z-index: 1000; width: 100%;">
                            </div>
                            <div id="edit_selected_contributors" class="mt-2 d-flex flex-wrap gap-2">
                            </div>
                            <input type="hidden" id="edit_contributors" name="contributors" value="">
                        </div>
                    </div>
                    <div class="modal-footer modal-footer-custom">
                        <button type="submit" class="btn-submit-black">
                            Update
                        </button>
                    </div>
                </form>
            </div>
            <div class="alert-container mt-2" style="width: 100%;"></div>
        </div>
    </div>
    <div class="modal fade modal-custom" id="projectFilesModal" tabindex="-1"
        aria-labelledby="projectFilesModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content modal-content-custom">
                <div class="modal-header modal-header-custom">
                    <h5 class="modal-title modal-title-custom" id="projectFilesModalLabel">Reference Files</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <hr>
                <div class="modal-body modal-body-custom">
                    <div id="projectReferenceFilesList" class="d-flex flex-column gap-2">
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade" id="projectFeedbackModal" tabindex="-1" aria-labelledby="projectFeedbackModalLabel"
        aria-hidden="true" data-project-id="{{ $project->id ?? '' }}"
        data-employee-id="{{ auth()->user()->employee->id ?? '' }}">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable feedback-modal-dialog">
            <div class="modal-content modal-content-custom">
                <div class="modal-header modal-header-custom d-flex align-items-center position-relative flex-nowrap">
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
        <script src="{{ asset('asset/js/project-detail.js') }}?v={{ time() }}"></script>
    </x-slot>
</x-office-layout>
