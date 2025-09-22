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
            $imgUrl = $img
                ? asset('file/project/' . ltrim($img, '/'))
                : asset('asset/img/image.png');
            $totalTasks = $project->tasks ? $project->tasks->count() : 0;
        @endphp
        <meta name="project-image" content="{{ $imgUrl }}">
        <meta name="project-total-tasks" content="{{ $totalTasks }}">
        <link rel="stylesheet" href="{{ asset('asset/css/project-detail.css') }}">
    </x-slot>

    <div class="d-flex justify-content-between align-items-center mb-4">
        <div class="title-content d-flex align-items-center">
            <div class="nav-item d-inline-block">
                <div class="nav-icon-arrow">
                    <a href="{{ url('project') }}"
                        class="text-decoration-none text-dark d-flex align-items-center me-2">
                        <span class="material-symbols-outlined">arrow_back</span>
                    </a>
                </div>
            </div>
            <h2 class="mb-0">Detail Project</h2>
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
                    <div class="d-flex align-items-center">
                        <img id="project-image" src="{{ asset('asset/img/image.png') }}" alt="project detail image" class="project-detail-image me-3">
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

                    <div class="d-flex justify-content-start mt-3 flex-wrap gap-3">
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
    <x-slot name="script_slot">
        <script src="{{ asset('asset/js/project-detail.js') }}"></script>
    </x-slot>

</x-office-layout>
