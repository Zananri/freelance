<x-office-layout>
    <x-slot name="menu_active">
        {{ __('recruitment') }}
    </x-slot>
    <x-slot name="head_slot">
        <link href="{{ asset('asset/css/recruitment.css') }}?v={{ date('YmdHi') }}" rel="stylesheet">
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
                <h2 class="text-title-content">Recruitment</h2>
            </div>
        </div>
    </div>

    <div class="row g-3 mb-3">
        <div class="col-lg-3 col-md-6">
            <div class="body-content rounded-4 p-4 h-100">

                <div class="row align-items-center">

                    <div class="col-auto">
                        <div class="employee-icon d-flex justify-content-center align-items-center">
                            <span class="material-symbols-outlined text-white">
                                groups
                            </span>
                        </div>
                    </div>

                    <div class="col">
                        <div class="title-total-employees fw-semibold ">
                            Total Employees
                        </div>

                        <div class="total-employees fw-bold display-4 mt-2">
                            248
                        </div>
                    </div>

                </div>

                <div class="d-flex align-items-center mt-4">

                    <div class="tranding-up-chart d-flex align-items-center fw-bold">
                        <span class="material-symbols-outlined me-1">
                            trending_up
                        </span>

                        <span>12.5%</span>
                    </div>

                    <span class="text-chart ms-4">
                        vs last month
                    </span>

                </div>

                <div class="mt-4" style="height:100px;">
                    <canvas id="employeeChart"></canvas>
                </div>

            </div>
        </div>

        <div class="col-lg-3 col-md-6">
            <div class="body-content rounded-4 p-4 h-100">

                <div class="row align-items-center">

                    <div class="col-auto">
                        <div class="position-icon d-flex justify-content-center align-items-center">
                            <span class="material-symbols-outlined text-white">
                                groups
                            </span>
                        </div>
                    </div>

                    <div class="col">
                        <div class="title-total-employees fw-semibold ">
                            Open Positions
                        </div>

                        <div class="total-employees fw-bold display-4 mt-2">
                            2
                        </div>
                    </div>

                </div>

                <div class="d-flex align-items-center mt-4">

                    <div class="tranding-down-chart d-flex align-items-center fw-bold">
                        <span class="material-symbols-outlined me-1">
                            trending_down
                        </span>

                        <span>32.3%</span>
                    </div>

                    <span class="text-chart ms-4">
                        vs last month
                    </span>

                </div>

                <div class="mt-4" style="height:100px;">
                    <canvas id="positionChart"></canvas>
                </div>

            </div>
        </div>

        <div class="col-lg-3 col-md-6">
            <div class="body-content rounded-4 p-4 h-100">

                <div class="row align-items-center">

                    <div class="col-auto">
                        <div class="applicants-icon d-flex justify-content-center align-items-center">
                            <span class="material-symbols-outlined text-white">
                                groups
                            </span>
                        </div>
                    </div>

                    <div class="col">
                        <div class="title-total-employees fw-semibold ">
                            New Applicants
                        </div>

                        <div class="total-employees fw-bold display-4 mt-2">
                            10
                        </div>
                    </div>

                </div>

                <div class="d-flex align-items-center mt-4">

                    <div class="tranding-up-chart d-flex align-items-center fw-bold">
                        <span class="material-symbols-outlined me-1">
                            trending_up
                        </span>

                        <span>56.4%</span>
                    </div>

                    <span class="text-chart ms-4">
                        vs last month
                    </span>

                </div>

                <div class="mt-4" style="height:100px;">
                    <canvas id="applicantsChart"></canvas>
                </div>

            </div>
        </div>

        <div class="col-lg-3 col-md-6">
            <div class="body-content rounded-4 p-4 h-100">

                <div class="row align-items-center">

                    <div class="col-auto">
                        <div class="schedule-icon d-flex justify-content-center align-items-center">
                            <span class="material-symbols-outlined text-white">
                                groups
                            </span>
                        </div>
                    </div>

                    <div class="col">
                        <div class="title-total-employees fw-semibold ">
                            Interview Scheduled
                        </div>

                        <div class="total-employees fw-bold display-4 mt-2">
                            8
                        </div>
                    </div>

                </div>

                <div class="d-flex align-items-center mt-4">

                    <div class="tranding-up-chart d-flex align-items-center fw-bold">
                        <span class="material-symbols-outlined me-1">
                            trending_up
                        </span>

                        <span>39.5%</span>
                    </div>

                    <span class="text-chart ms-4">
                        vs last month
                    </span>

                </div>

                <div class="mt-4" style="height:100px;">
                    <canvas id="scheduleChart"></canvas>
                </div>

            </div>
        </div>
    </div>

    <div class="row g-3 mb-3">
        <div class="col-12">
            <div class="body-content rounded-4 p-4">

                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h5 class="mb-0 fw-bold">Recruitment Pipeline</h5>
                </div>

                <div class="pipeline-wrapper">

                    @php
                        $statuses = [
                            ['Applied', '#4A8CFF', '#EAF3FF'],
                            ['Screening', '#8B5CF6', '#F2ECFF'],
                            ['Interview', '#FF7A00', '#FFF2E7'],
                            ['Tech Test', '#F6B100', '#FFF9DF'],
                            ['Hired', '#23C16B', '#ECFFF5'],
                            ['Rejected', '#F44336', '#FFF0F0'],
                        ];
                    @endphp

                    @foreach($statuses as $status)

                    <div class="pipeline-column">

                        <div class="pipeline-card">

                            <div class="pipeline-header"
                                style="background: {{ $status[2] }}">

                                <div class="d-flex justify-content-between">
                                    <span class="fw-semibold"
                                        style="color: {{ $status[1] }}">
                                        {{ $status[0] }}
                                    </span>

                                    <small style="color: {{ $status[1] }}">
                                        129
                                    </small>
                                </div>

                            </div>

                            <div class="pipeline-body">

                                @for($i=0;$i<20;$i++)

                                <div class="candidate-card">

                                    <div class="candidate-avatar"></div>

                                    <div class="candidate-info">
                                        <div class="candidate-name">
                                            John Doe
                                        </div>

                                        <div class="candidate-position">
                                            Data Analyst
                                        </div>
                                    </div>

                                </div>

                                @endfor

                            </div>

                        </div>

                    </div>

                    @endforeach

                </div>

            </div>
        </div>
    </div>

    <div class="row g-3">
        <div class="col-lg-9">
            <div class="body-content rounded-4 p-4">

                <h5 class="fw-semibold mb-3">
                    Candidates Overview
                </h5>

                <div style="height: 250px;">
                    <canvas id="candidateOverview"></canvas>
                </div>

            </div>
        </div>

        <div class="col-lg-3">
            <div class="body-content rounded-4 p-3 h-100 d-flex flex-column">
                <h5 class="fw-semibold mb-3">
                    Quick Actions
                </h5>

                <div class="flex-grow-1 d-flex align-items-center">
                    <div class="row g-2 w-100">
    
                        <div class="col-6">
                            <button class="btn quick-btn-action w-100 d-flex flex-row align-items-center justify-content-center py-3">
                                <span class="material-symbols-outlined mb-1 me-2">
                                    person_add
                                </span>
                                <small>Add Candidate</small>
                            </button>
                        </div>
    
                        <div class="col-6">
                            <button class="btn quick-btn-action w-100 d-flex flex-row align-items-center justify-content-center py-3">
                                <span class="material-symbols-outlined mb-1 me-2">
                                    groups
                                </span>
                                <small>Add Position</small>
                            </button>
                        </div>
    
                        <div class="col-6">
                            <button class="btn quick-btn-action w-100 d-flex flex-row align-items-center justify-content-center py-3">
                                <span class="material-symbols-outlined mb-1 me-2">
                                    calendar_month
                                </span>
                                <small>Schedule Interview</small>
                            </button>
                        </div>
    
                        <div class="col-6">
                            <button class="btn quick-btn-action w-100 d-flex flex-row align-items-center justify-content-center py-3">
                                <span class="material-symbols-outlined mb-1 me-2">
                                    description
                                </span>
                                <small>Generate Report</small>
                            </button>
                        </div>
    
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="alert-delete-container mb-3" style="width: 100%;"></div>

    <x-slot name="script_slot">
        
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script src="{{ asset('asset/js/recruitment.js') }}?v={{ time() }}"></script>
        <script src="{{ asset('asset/js/recruitment_chart.js') }}?v={{ time() }}"></script>
        <script src="{{ asset('asset/js/date_helper.js') }}"></script>

        <script></script>
    </x-slot>


</x-office-layout>
