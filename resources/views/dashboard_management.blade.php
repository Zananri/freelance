<x-office-layout>
    <x-slot name="menu_active">
        {{ __('dashboard') }}
    </x-slot>
    <x-slot name="head_slot">
        <link href="{{ asset('asset/css/dashboard_management.css') }}?v={{ time() }}" rel="stylesheet">
        <link rel="stylesheet" href=" {{ asset('asset/plugin/leaflet/leaflet.css') }}" />
        <link href="https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.snow.css" rel="stylesheet">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
        <meta name="current-user-type" content="{{ auth()->user()->user_type }}">
    </x-slot>

    <div class="title-content">
        <h2>Dashboard</h2>
    </div>

    <div class="content-container scrollbar-transparent pe-3">

        <div class="row">

            <div class="col-md-9 pb-4">
                <div class="card-content p-3 dashboard-widget-card">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h3 class="fs-18 fw-normal text-body text-opacity-75 mb-0">Monitoring</h3>
                        <a href="{{ url('/monitoring') }}" class="widget-link">
                            View All
                            <span class="material-symbols-outlined">chevron_right</span>
                        </a>
                    </div>

                    <div class="d-flex gap-2 mb-3">
                        <select class="form-select form-select-sm widget-filter border-0" id="widgetDepartmentFilter">
                            <option value="all">All Department</option>
                            @foreach ($widget_departments as $department)
                                <option value="{{ $department->id }}">{{ $department->name_department }}</option>
                            @endforeach
                        </select>

                        <select class="form-select form-select-sm widget-filter border-0" id="widgetDivisionFilter">
                            <option value="all">All Site</option>
                            @foreach ($widget_divisions as $division)
                                <option value="{{ $division->id }}" data-department-id="{{ $division->department_id }}">
                                    {{ $division->name_division }}
                                </option>
                            @endforeach
                        </select>
                    </div>

                    <div id="widgetMonitoringMap" style="height:260px;"></div>
                    <div id="widgetMonitoringLegend" class="widget-monitoring-legend mt-2"></div>
                </div>
            </div>

            <div class="col-md-3 pb-4">
                <div class="card-content p-3 dashboard-widget-card">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h3 class="fs-18 fw-normal text-body text-opacity-75 mb-0">Document</h3>
                        <a href="{{ url('/document') }}" class="widget-link">
                            View All
                            <span class="material-symbols-outlined">chevron_right</span>
                        </a>
                    </div>

                    <div class="widget-search-container mb-2">
                        <span class="material-symbols-outlined widget-search-icon">search</span>
                        <input type="text" class="form-control widget-search-input border-0"
                            id="widgetDocumentSearch" placeholder="Search document">
                    </div>

                    <button type="button" id="widgetDocumentBack" class="widget-back-btn mb-3">
                        <span class="material-symbols-outlined">arrow_back</span>
                        Back
                    </button>

                    <div id="widgetDocumentGrid" class="widget-document-grid">
                        <div class="text-body text-opacity-50 fs-12 text-center py-4">Loading...</div>
                    </div>
                </div>
            </div>

        </div>

    </div>

    <x-slot name="script_slot">
        <script src="{{ asset('asset/plugin/leaflet/leaflet.js') }}" crossorigin=""></script>
        <script src="{{ asset('asset/js/date_helper.js?=' . time()) }}"></script>
        <script src="{{ asset('asset/js/dashboard_management.js') }}?v={{ time() }}"></script>
    </x-slot>

</x-office-layout>