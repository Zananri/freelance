<x-office-layout>
    <x-slot name="menu_active">
        {{ __('project') }}
    </x-slot>
    <x-slot name="head_slot">
        <meta name="app-url" content="{{ url('/') }}">
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
                        @php
                            $img = $project->image ?? null;
                            $imgUrl = $img
                                ? asset('file/project/' . ltrim($img, '/'))
                                : asset('asset/img/project-placeholder.png');
                        @endphp
                        <img src="{{ $imgUrl }}" alt="project detail image" class="project-detail-image me-3">
                        <h4 class="project-detail-title m-0 d-flex align-items-center">{{ $project->title ?? '-' }}</h4>
                    </div>
                    <p class="mt-3 description-detail">
                        {!! nl2br(e($project->description ?? '-')) !!}
                    </p>
                    <div class="d-flex justify-content-between">
                        <div class="d-flex">
                            @if (!empty($project->reference_files) || !empty($project->reference_urls))
                                <a href="#references" class="detail-icon" title="References">
                                    <span class="material-symbols-outlined me-3">attach_file</span>
                                </a>
                            @else
                                <button class="detail-icon">
                                    <span class="material-symbols-outlined me-3">attach_file</span>
                                </button>
                            @endif

                            <button class="detail-icon">
                                <span class="material-symbols-outlined me-3">mode_comment</span>
                            </button>
                        </div>
                        <div class="d-flex">
                            <a href="{{ route('project.edit', ['id' => $project->id]) }}" class="detail-icon"
                                title="Edit">
                                <span class="material-symbols-outlined icon-fill me-3">edit</span>
                            </a>
                            <form action="{{ route('project.destroy', ['id' => $project->id]) }}" method="POST"
                                onsubmit="return confirm('Are you sure you want to delete this project?');">
                                @csrf
                                @method('DELETE')
                                <button class="detail-icon" type="submit" title="Delete">
                                    <span class="material-symbols-outlined icon-fill">delete</span>
                                </button>
                            </form>
                        </div>
                    </div>

                    <hr class="task-separator border-3 rounded-4">

                    <div class="d-flex justify-content-between detail-list">
                        <p>Total Task</p>
                        <p>{{ $project->tasks->count() }} Task{{ $project->tasks->count() > 1 ? 's' : '' }}</p>
                    </div>
                    <div class="d-flex justify-content-between detail-list">
                        <p>Deadline</p>
                        <p>{{ $project->due_date ? \Carbon\Carbon::parse($project->due_date)->format('d M Y') : '-' }}
                        </p>
                    </div>
                    <div class="d-flex justify-content-between detail-list">
                        <p>Department</p>
                        <p>{{ $project->department?->name_department ?? ($project->department?->name ?? '-') }}</p>
                    </div>
                    <div class="d-flex justify-content-between detail-list">
                        <p>Division</p>
                        <p>{{ $project->division?->name_division ?? ($project->division?->name ?? '-') }}</p>
                    </div>

                    <div class="d-flex justify-content-start mt-3 flex-wrap gap-3">
                        @php
                            // group assignments
                            $author = null;
                            $coAuthors = [];
                            $contributors = [];
                            foreach ($project->projectAssignments as $assignment) {
                                if (!isset($assignment->employee)) {
                                    continue;
                                }
                                if ($assignment->role === 'author') {
                                    $author = $assignment->employee;
                                } elseif ($assignment->role === 'co_author') {
                                    $coAuthors[] = $assignment->employee;
                                } elseif ($assignment->role === 'contributor') {
                                    $contributors[] = $assignment->employee;
                                }
                            }
                        @endphp

                        <div class="detail-project-bottom">
                            @if ($author)
                                <div class="d-flex align-items-center detail-role me-2 mb-2">
                                    @php
                                        $avatar = asset('asset/img/avatar.png');
                                        if (!empty($author->profile_picture) || !empty($author->photo)) {
                                            $raw = $author->profile_picture ?: $author->photo;
                                            // If absolute URL or protocol-relative, use raw. Otherwise normalize local path.
                                            if (
                                                strpos($raw, 'http://') === 0 ||
                                                strpos($raw, 'https://') === 0 ||
                                                strpos($raw, '//') === 0
                                            ) {
                                                $avatar = $raw;
                                            } else {
                                                $clean = ltrim($raw, '/');
                                                // If already begins with file/, don't prefix again
        if (strpos($clean, 'file/') === 0) {
            $avatar = asset($clean);
        } else {
            $avatar = asset('file/' . $clean);
                                                }
                                            }
                                        }
                                    @endphp
                                    <img src="{{ $avatar }}" alt="user profile" class="user-profile me-2">
                                    <div>
                                        <p class="m-0 fw-normal">{{ $author->name }}</p>
                                        <p class="m-0 text-muted small">Author</p>
                                    </div>
                                </div>
                            @endif

                            @foreach ($coAuthors as $co)
                                <div class="d-flex align-items-center detail-role me-2 mb-2">
                                    @php
                                        $avatar = asset('asset/img/avatar.png');
                                        if (!empty($co->profile_picture) || !empty($co->photo)) {
                                            $raw = $co->profile_picture ?: $co->photo;
                                            if (
                                                strpos($raw, 'http://') === 0 ||
                                                strpos($raw, 'https://') === 0 ||
                                                strpos($raw, '//') === 0
                                            ) {
                                                $avatar = $raw;
                                            } else {
                                                $clean = ltrim($raw, '/');
                                                if (strpos($clean, 'file/') === 0) {
                                                    $avatar = asset($clean);
                                                } else {
                                                    $avatar = asset('file/' . $clean);
                                                }
                                            }
                                        }
                                    @endphp
                                    <img src="{{ $avatar }}" alt="user profile" class="user-profile me-2">
                                    <div>
                                        <p class="m-0 fw-normal">{{ $co->name }}</p>
                                        <p class="m-0 text-muted small">Co Author</p>
                                    </div>
                                </div>
                            @endforeach

                            @if (!empty($contributors))
                                @foreach ($contributors as $con)
                                    <div class="d-flex align-items-center detail-role me-2 mb-2">
                                        @php
                                            $avatar = asset('asset/img/avatar.png');
                                            if (!empty($con->profile_picture) || !empty($con->photo)) {
                                                $raw = $con->profile_picture ?: $con->photo;
                                                if (
                                                    strpos($raw, 'http://') === 0 ||
                                                    strpos($raw, 'https://') === 0 ||
                                                    strpos($raw, '//') === 0
                                                ) {
                                                    $avatar = $raw;
                                                } else {
                                                    $clean = ltrim($raw, '/');
                                                    if (strpos($clean, 'file/') === 0) {
                                                        $avatar = asset($clean);
                                                    } else {
                                                        $avatar = asset('file/' . $clean);
                                                    }
                                                }
                                            }
                                        @endphp
                                        <img src="{{ $avatar }}" alt="user profile" class="user-profile me-2">
                                        <div>
                                            <p class="m-0 fw-normal">{{ $con->name }}</p>
                                            <p class="m-0 text-muted small">Contributor</p>
                                        </div>
                                    </div>
                                @endforeach
                            @endif
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

</x-office-layout>
