<x-office-layout>
    <x-slot name="menu_active">
        {{ __('project') }}
    </x-slot>
    <x-slot name="head_slot">
        <meta name="app-url" content="{{ url('/') }}">
        <link rel="stylesheet" href="{{ asset('asset/css/project-detail.css') }}">
    </x-slot>

    <div class="d-flex justify-content-between align-items-center mb-4">
        <div class="title-content">
            <h2>Detail Project</h2>
        </div>
        <button class="btn-submit-black">
            <span class="material-symbols-outlined me-2">download</span>Report
        </button>
    </div>

    {{-- Above Content --}}
    {{-- Left Above Content --}}
    <div class="row mb-3">
        <div class="col-md-3 detail-project-card">
            <div class="body-content rounded-4 p-3">
                <div class="d-flex">
                    <img src="" alt="project detail image" class="project-detail-image me-2">
                    <p class="project-detail-title">Project Title</p>
                </div>
                <p class="mt-3 description-detail">
                    Lorem ipsum dolor sit amet consectetur adipisicing elit. Iure doloribus optio necessitatibus!
                </p>
                <div class="d-flex justify-content-between">
                    <div class="d-flex">
                        <button class="detail-icon">
                            <span class="material-symbols-outlined me-3">attach_file</span>
                        </button>
                        <button class="detail-icon">
                            <span class="material-symbols-outlined me-3">mode_comment</span>
                        </button>
                    </div>
                    <div class="d-flex">
                        <button class="detail-icon">
                            <span class="material-symbols-outlined icon-fill me-3">edit</span>
                        </button>
                        <button class="detail-icon">
                            <span class="material-symbols-outlined icon-fill">delete</span>
                        </button>
                    </div>
                </div>

                <hr class="task-separator border-3 rounded-4">

                <div class="d-flex justify-content-between detail-list">
                    <p>Total Task</p>
                    <p>30 Task</p>
                </div>
                <div class="d-flex justify-content-between detail-list">
                    <p>Deadline</p>
                    <p>20 Sep 2025</p>
                </div>
                <div class="d-flex justify-content-between detail-list">
                    <p>Department</p>
                    <p>Department name</p>
                </div>
                <div class="d-flex justify-content-between detail-list">
                    <p>Division</p>
                    <p>Division Name</p>
                </div>

                <div class="d-flex justify-content-evenly mt-3">
                    <div class="d-flex align-items-center detail-role">
                        <img src="" alt="user profile" class="rounded-circle me-2"
                            width="40" height="40">
                        <div>
                            <p class="m-0 fw-normal">Employee Name</p>
                            <p class="m-0 text-muted small">Co Author</p>
                        </div>
                    </div>

                    <div class="d-flex align-items-center detail-role">
                        <img src="" alt="user profile" class="rounded-circle me-2"
                            width="40" height="40">
                        <div>
                            <p class="m-0 fw-normal">Employee Name</p>
                            <p class="m-0 text-muted small">Author</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {{-- Right Above Content --}}
        <div class="col-md-9 structure-detail">
            <div class="body-content rounded-4 p-3">

            </div>
        </div>
    </div>

    {{-- Bottom Content --}}
    <div class="col-md-12 mb-3 timeline-detail-project">
        <div class="body-content rounded-4 p-3">

        </div>
    </div>

</x-office-layout>
