<x-office-layout>
    <x-slot name="menu_active">
        {{ __('task') }}
    </x-slot>
    <x-slot name="head_slot">
        <link rel="stylesheet" href="{{ asset('asset/css/schedule.css') }}">
    </x-slot>

    <div class="d-flex justify-content-between align-items-center mb-4">
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
                    id="search_filter">
            </div>
            <button class="btn btn-icon-toggle btn-filter-custom me-3" type="button" data-label="Filter"
                id="openProjectFilterBtn">
                <span class="material-symbols-outlined icon">filter_list</span> <span
                    class="btn-text-filter">Filter</span>
            </button>
            <a href="{{ route('schedules.create') }}" class="btn btn-icon-toggle btn-schedule-custom me-3"
                type="button" data-label="Schedule" id="openProjectFilterBtn"> Add Schedule
            </a>
            <div class="d-flex justify-content-between title-filter-container d-none">
                <div class="dropdown-center dropdown-filter-container">
                    <div class="dropdown-menu dropdown-filter-menu" id="projectFilterDropdown" style="display: none;">
                        <div class="dropdown-filter-body">
                            <div class="mb-3">
                                <label for="filterProjectStatus" class="form-label">Filter by</label>
                                <select id="filterProjectStatus" class="form-select">
                                    <option value="">All Status</option>
                                    <option value="">Daily</option>
                                    <option value="">Weekly</option>
                                    <option value="">Monthly</option>
                                </select>
                            </div>
                        </div>
                        <div class="dropdown-filter-footer">
                            <button type="button" class="btn btn-submit-black"
                                id="resetProjectFilterBtn">Reset</button>
                            <button type="button" class="btn btn-submit-black"
                                id="applyProjectFilterBtn">Filter</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="schedule-card-container">
        <div class="project-content">
            <div class="d-flex justify-content-between align-items-center">
                <h4 id="date-title" class="schedule-title fw-normal mb-0"></h4>

                <ul class="pagination mb-0">
                    <li class="page-item active">
                        <a class="page-link" href="#" data-view="daily">Daily</a>
                    </li>
                    <li class="page-item ">
                        <a class="page-link" href="#" data-view="weekly">Weekly</a>
                    </li>
                    <li class="page-item ">
                        <a class="page-link" href="#" data-view="monthly">Monthly</a>
                    </li>
                </ul>
            </div>
            <div id="scheduleContainer" class="d-flex flex-wrap gap-3 mt-5"></div>
        </div>
    </div>

    <x-slot name="script_slot">

        <script src="{{ asset('asset/js/schedule.js?v=' . time()) }}"></script>

        <script></script>
    </x-slot>
</x-office-layout>
