<x-office-layout>
    <x-slot name="menu_active">
        {{ __('monitoring') }}
    </x-slot>
    <x-slot name="head_slot">
        <link href="{{ asset('asset/css/monitoring.css') }}?v={{ date('YmdHi') }}" rel="stylesheet">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css" />
        <link rel="stylesheet" href=" {{ asset('asset/plugin/leaflet/leaflet.css') }}" />
        <link href="https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.snow.css" rel="stylesheet">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
    </x-slot>

    <!-- SVG Symbols -->
    <svg xmlns="http://www.w3.org/2000/svg" style="display: none;">
        <symbol id="check-circle-fill" fill="currentColor" viewBox="0 0 16 16">
            <path
                d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
        </symbol>
        <symbol id="info-fill" fill="currentColor" viewBox="0 0 16 16">
            <path
                d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
        </symbol>
        <symbol id="exclamation-triangle-fill" fill="currentColor" viewBox="0 0 16 16">
            <path
                d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
        </symbol>
    </svg>

    <div class="title-content mb-3">
        <div class="d-flex align-items-center">
            <div class="w-100">
                <h2 class="text-title-content">Monitoring</h2>
            </div>
        </div>
    </div>

    <div class="monitoring-wrapper" data-monitoring-url="{{ route('monitoring.data') }}">

        <!-- LEFT PANEL -->
        <div class="monitoring-sidebar">

            <!-- Division -->
            <div class="card monitoring-card">

                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="mb-0 fw-semibold">
                        Division List
                    </h6>

                    <select class="form-select form-select-sm division-filter">
                        <option value="all">All Division</option>
                    </select>
                </div>

                <div class="input-group mb-3">
                    <span class="input-group-text bg-white border-end-0">
                        <span class="material-symbols-outlined fs-6">
                            search
                        </span>
                    </span>

                    <input type="text" class="form-control border-0 division-search">
                </div>

                <div id="divisionList"></div>

            </div>


            <!-- Employee -->

            <div class="card monitoring-card mt-4">

                <h6 class="fw-semibold mb-3">
                    Employee List
                </h6>

                <div class="input-group mb-3">

                    <span class="input-group-text bg-white border-end-0">
                        <span class="material-symbols-outlined fs-6">
                            search
                        </span>
                    </span>

                    <input class="form-control border-0 employee-search">

                </div>

                <div id="employeeList"></div>

            </div>

        </div>

        <!-- RIGHT PANEL -->

        <div class="monitoring-map-container">
            <div class="card monitoring-card monitoring-map-card">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="mb-0 fw-semibold">
                        Map View
                    </h6>
                </div>

                <div id="monitoringMap"></div>
            </div>
        </div>

    </div>

    <div class="alert-delete-container mb-3" style="width: 100%;"></div>

    <x-slot name="script_slot">

        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script src="{{ asset('asset/plugin/leaflet/leaflet.js') }}" crossorigin=""></script>
        <script src="{{ asset('asset/js/monitoring.js') }}?v={{ time() }}"></script>
        <script src="{{ asset('asset/js/date_helper.js') }}"></script>

        <script></script>
    </x-slot>


</x-office-layout>
