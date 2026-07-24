<x-office-layout>
    <x-slot name="menu_active">
        {{ __('recruitment') }}
    </x-slot>
    <x-slot name="head_slot">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <link href="{{ asset('asset/css/recruitment.css') }}?v={{ date('YmdHi') }}" rel="stylesheet">
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
        <div class="d-flex align-items-center flex-wrap gap-2">
            <div class="me-auto">
                <h2 class="text-title-content mb-0">Recruitment</h2>
            </div>

            <div class="date-filter-wrapper position-relative">
                <button type="button" class="btn date-filter-toggle d-flex align-items-center gap-2"
                    id="dateFilterToggle">

                    <span class="material-symbols-outlined">calendar_month</span>

                    <span id="dateFilterLabel"></span>

                </button>

                <input type="text" id="dateRange"
                    style="position:absolute;opacity:0;pointer-events:none;width:0;height:0;">
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

                        <div id="totalEmployeesValue" class="total-employees fw-bold display-4 mt-2">
                            {{ $totalEmployees ?? 0 }}
                        </div>
                    </div>

                </div>

                @php
                    $trend = $percentages['employees'] ?? ['direction' => 'flat', 'value' => 0];
                @endphp

                <div class="d-flex align-items-center mt-4" id="employeesTrend">
                    @if ($trend['direction'] === 'up')
                        <span class="tranding-up-chart d-flex align-items-center">
                            <span class="material-symbols-outlined me-1" style="font-size:16px;">
                                trending_up
                            </span>
                            {{ $trend['value'] }}%
                        </span>
                    @elseif($trend['direction'] === 'down')
                        <span class="tranding-down-chart d-flex align-items-center">
                            <span class="material-symbols-outlined me-1" style="font-size:16px;">
                                trending_down
                            </span>
                            {{ $trend['value'] }}%
                        </span>
                    @else
                        <span class="tranding-flat-chart d-flex align-items-center">
                            <span class="material-symbols-outlined me-1" style="font-size:16px;">
                                trending_flat
                            </span>
                            0%
                        </span>
                    @endif

                    <small class="tranding-text text-muted ms-2">Compared to last month</small>
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
                                person_check
                            </span>
                        </div>
                    </div>

                    <div class="col">
                        <div class="title-total-employees fw-semibold ">
                            Hired Employee
                        </div>

                        <div class="total-employees fw-bold display-4 mt-2">
                            {{ $pipeline_counts['Hired'] ?? 0 }}
                        </div>
                    </div>

                </div>

                @php
                    $trend = $percentages['hired'] ?? ['direction' => 'flat', 'value' => 0];
                @endphp

                <div class="d-flex align-items-center mt-4" id="hiredTrend">
                    @if ($trend['direction'] === 'up')
                        <span class="tranding-up-chart d-flex align-items-center">
                            <span class="material-symbols-outlined me-1" style="font-size:16px;">
                                trending_up
                            </span>
                            {{ $trend['value'] }}%
                        </span>
                    @elseif($trend['direction'] === 'down')
                        <span class="tranding-down-chart d-flex align-items-center">
                            <span class="material-symbols-outlined me-1" style="font-size:16px;">
                                trending_down
                            </span>
                            {{ $trend['value'] }}%
                        </span>
                    @else
                        <span class="tranding-flat-chart d-flex align-items-center">
                            <span class="material-symbols-outlined me-1" style="font-size:16px;">
                                trending_flat
                            </span>
                            0%
                        </span>
                    @endif

                    <small class="tranding-text text-muted ms-2">Compared to last month</small>
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
                            {{ $total_applicants }}
                        </div>
                    </div>

                </div>

                @php
                    $trend = $percentages['applicants'] ?? ['direction' => 'flat', 'value' => 0];
                @endphp

                <div class="d-flex align-items-center mt-4" id="applicantsTrend">
                    @if ($trend['direction'] === 'up')
                        <span class="tranding-up-chart d-flex align-items-center">
                            <span class="material-symbols-outlined me-1" style="font-size:16px;">
                                trending_up
                            </span>
                            {{ $trend['value'] }}%
                        </span>
                    @elseif($trend['direction'] === 'down')
                        <span class="tranding-down-chart d-flex align-items-center">
                            <span class="material-symbols-outlined me-1" style="font-size:16px;">
                                trending_down
                            </span>
                            {{ $trend['value'] }}%
                        </span>
                    @else
                        <span class="tranding-flat-chart d-flex align-items-center">
                            <span class="material-symbols-outlined me-1" style="font-size:16px;">
                                trending_flat
                            </span>
                            0%
                        </span>
                    @endif

                    <small class="tranding-text text-muted ms-2">Compared to last month</small>
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

                        <div class="total-employees fw-bold display-4 mt-2" id="totalSchedulesValue">
                            0
                        </div>
                    </div>

                </div>

                @php
                    $trend = $percentages['schedules'] ?? ['direction' => 'flat', 'value' => 0];
                @endphp

                <div class="d-flex align-items-center mt-4" id="schedulesTrend">
                    @if ($trend['direction'] === 'up')
                        <span class="tranding-up-chart d-flex align-items-center">
                            <span class="material-symbols-outlined me-1" style="font-size:16px;">
                                trending_up
                            </span>
                            {{ $trend['value'] }}%
                        </span>
                    @elseif($trend['direction'] === 'down')
                        <span class="tranding-down-chart d-flex align-items-center">
                            <span class="material-symbols-outlined me-1" style="font-size:16px;">
                                trending_down
                            </span>
                            {{ $trend['value'] }}%
                        </span>
                    @else
                        <span class="tranding-flat-chart d-flex align-items-center">
                            <span class="material-symbols-outlined me-1" style="font-size:16px;">
                                trending_flat
                            </span>
                            0%
                        </span>
                    @endif

                    <small class="tranding-text text-muted ms-2">Compared to last month</small>
                </div>

                <div class="mt-4" style="height:100px;">
                    <canvas id="scheduleChart"></canvas>
                </div>

            </div>
        </div>
    </div>

    <div class="row g-3 mb-3">
        <div class="col-12">
            <div class="body-content rounded-4 p-4 pipeline-section">

                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h5 class="mb-0 fw-bold">Recruitment Pipeline</h5>
                </div>

                <div class="pipeline-wrapper"></div>

            </div>
        </div>
    </div>

    <div class="row g-3">
        <div class="col-lg-9">
            <div class="body-content rounded-4 p-4">

                <h5 class="dashboard-card-title mb-1">New Candidate Trend</h5>
                <p class="dashboard-card-subtitle text-muted fs-8 mb-0">
                    Daily incoming candidates during the selected period.
                </p>

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
                <div class="flex-grow-1">
                    <div class="d-flex flex-column gap-2">

                        <button type="button" id="addCandidateBtn"
                            class="btn quick-btn-action w-100 d-flex align-items-center py-3">
                            <span class="material-symbols-outlined me-2">
                                person_add
                            </span>
                            <small>Add Candidate</small>
                        </button>

                        <button type="button" id="openScheduleCalendarBtn"
                            class="btn quick-btn-action w-100 d-flex align-items-center py-3">
                            <span class="material-symbols-outlined me-2">
                                calendar_month
                            </span>
                            <small>Recruitment Schedule</small>
                        </button>

                        <button type="button" id="generateReportBtn"
                            class="btn quick-btn-action w-100 d-flex align-items-center py-3">
                            <span class="material-symbols-outlined me-2">
                                description
                            </span>
                            <small>Generate Report</small>
                        </button>

                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="alert-delete-container mb-3" style="width: 100%;"></div>

    <div class="modal fade" id="candidateAddModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content modal-content-custom">
                <form id="candidateAddForm">
                    <div class="modal-header">
                        <h6 class="modal-title modal-title-custom mb-0">Add Candidate</h6>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body modal-body-custom">

                        <div class="row">

                            <div class="col-md-12 mb-3">
                                <label class="form-label small fw-semibold">
                                    Position <span class="text-danger">*</span>
                                </label>

                                <select id="addCandidateJobId" class="form-select border-0" required>

                                    <option value="">Select Position</option>

                                </select>
                            </div>

                            <div class="col-md-6 mb-3">
                                <label class="form-label small fw-semibold">
                                    Full Name <span class="text-danger">*</span>
                                </label>
                                <input type="text" id="addCandidateName" class="form-control border-0"
                                    placeholder="Enter full name" required>
                            </div>

                            <div class="col-md-6 mb-3">
                                <label class="form-label small fw-semibold">
                                    Email <span class="text-danger">*</span>
                                </label>
                                <input type="email" id="addCandidateEmail" class="form-control border-0"
                                    placeholder="example@email.com" required>
                            </div>

                            <div class="col-md-6 mb-3">
                                <label class="form-label small fw-semibold">
                                    Phone Number
                                </label>
                                <input type="text" id="addCandidatePhone" class="form-control border-0"
                                    placeholder="08xxxxxxxxxx">
                            </div>

                            <div class="col-md-6 mb-3">
                                <label class="form-label small fw-semibold">
                                    Gender
                                </label>

                                <select id="addCandidateGender" class="form-select border-0">

                                    <option value="">Select Gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>

                                </select>
                            </div>

                            <div class="col-md-6 mb-3">
                                <label class="form-label small fw-semibold">
                                    Birthdate
                                </label>

                                <input type="date" id="addCandidateBirthdate" class="form-control border-0">
                            </div>

                            <div class="col-md-6 mb-3">
                                <label class="form-label small fw-semibold">
                                    Last Education
                                </label>

                                <input type="text" id="addCandidateEducation" class="form-control border-0"
                                    placeholder="Bachelor Degree">
                            </div>

                            <div class="col-md-6 mb-3">
                                <label class="form-label small fw-semibold">
                                    Experience (Years)
                                </label>

                                <input type="number" id="addCandidateExperience" class="form-control border-0"
                                    placeholder="0">
                            </div>

                            <div class="col-md-6 mb-3">
                                <label class="form-label small fw-semibold">
                                    Expected Salary
                                </label>

                                <input type="number" id="addCandidateSalary" class="form-control border-0"
                                    placeholder="5000000">
                            </div>

                            <div class="col-md-12 mb-3">
                                <label class="form-label small fw-semibold">
                                    Address
                                </label>

                                <textarea id="addCandidateAddress" rows="3" class="form-control border-0" placeholder="Candidate address"></textarea>
                            </div>

                            <div class="col-md-6 mb-3">
                                <label class="form-label small fw-semibold">
                                    Recruitment Source
                                </label>

                                <input type="text" id="addCandidateSource" class="form-control border-0"
                                    placeholder="LinkedIn, Jobstreet, Referral">
                            </div>

                            <div class="col-md-6 mb-3">
                                <label class="form-label small fw-semibold">
                                    Status
                                </label>

                                <select id="addCandidateStatus" class="form-select border-0">

                                    @foreach (\App\Models\Candidate::STATUSES as $status)
                                        <option value="{{ $status }}">
                                            {{ $status }}
                                        </option>
                                    @endforeach

                                </select>
                            </div>

                            <div class="col-md-6 mb-3">
                                <label class="form-label small fw-semibold">
                                    CV
                                </label>

                                <input type="file" id="addCandidateCv" class="form-control border-0"
                                    accept=".pdf,.doc,.docx">
                            </div>

                            <div class="col-md-6 mb-3">
                                <label class="form-label small fw-semibold">
                                    Photo
                                </label>

                                <input type="file" id="addCandidatePhoto" class="form-control border-0"
                                    accept="image/*">
                            </div>

                        </div>

                    </div>
                    <div class="modal-footer modal-footer-custom">
                        <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button>
                        <button type="submit" class="btn submit-candidate-btn">Save</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <div class="modal fade" id="candidateEditModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content modal-content-custom">
                <form id="candidateEditForm">
                    <div class="modal-header">
                        <h6 class="modal-title modal-title-custom mb-0">Edit Candidate</h6>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body modal-body-custom">

                        <div class="row">

                            <div class="col-md-12 mb-3">
                                <label class="form-label small fw-semibold">
                                    Position <span class="text-danger">*</span>
                                </label>

                                <select id="editCandidateJobId" class="form-select border-0" required>

                                    <option value="">Select Position</option>

                                </select>
                            </div>

                            <div class="col-md-6 mb-3">
                                <label class="form-label small fw-semibold">
                                    Full Name <span class="text-danger">*</span>
                                </label>
                                <input type="text" id="editCandidateName" class="form-control border-0"
                                    placeholder="Enter full name" required>
                            </div>

                            <div class="col-md-6 mb-3">
                                <label class="form-label small fw-semibold">
                                    Email <span class="text-danger">*</span>
                                </label>
                                <input type="email" id="editCandidateEmail" class="form-control border-0"
                                    placeholder="example@email.com" required>
                            </div>

                            <div class="col-md-6 mb-3">
                                <label class="form-label small fw-semibold">
                                    Phone Number
                                </label>
                                <input type="text" id="editCandidatePhone" class="form-control border-0"
                                    placeholder="08xxxxxxxxxx">
                            </div>

                            <div class="col-md-6 mb-3">
                                <label class="form-label small fw-semibold">
                                    Gender
                                </label>

                                <select id="editCandidateGender" class="form-select border-0">

                                    <option value="">Select Gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>

                                </select>
                            </div>

                            <div class="col-md-6 mb-3">
                                <label class="form-label small fw-semibold">
                                    Birthdate
                                </label>

                                <input type="date" id="editCandidateBirthdate" class="form-control border-0">
                            </div>

                            <div class="col-md-6 mb-3">
                                <label class="form-label small fw-semibold">
                                    Last Education
                                </label>

                                <input type="text" id="editCandidateEducation" class="form-control border-0"
                                    placeholder="Bachelor Degree">
                            </div>

                            <div class="col-md-6 mb-3">
                                <label class="form-label small fw-semibold">
                                    Experience (Years)
                                </label>

                                <input type="number" id="editCandidateExperience" class="form-control border-0"
                                    placeholder="0">
                            </div>

                            <div class="col-md-6 mb-3">
                                <label class="form-label small fw-semibold">
                                    Expected Salary
                                </label>

                                <input type="number" id="editCandidateSalary" class="form-control border-0"
                                    placeholder="5000000">
                            </div>

                            <div class="col-md-12 mb-3">
                                <label class="form-label small fw-semibold">
                                    Address
                                </label>

                                <textarea id="editCandidateAddress" rows="3" class="form-control border-0" placeholder="Candidate address"></textarea>
                            </div>

                            <div class="col-md-6 mb-3">
                                <label class="form-label small fw-semibold">
                                    Recruitment Source
                                </label>

                                <input type="text" id="editCandidateSource" class="form-control border-0"
                                    placeholder="LinkedIn, Jobstreet, Referral">
                            </div>

                            <div class="col-md-6 mb-3">
                                <label class="form-label small fw-semibold">
                                    Status
                                </label>

                                <select id="editCandidateStatus" class="form-select border-0">

                                    @foreach (\App\Models\Candidate::STATUSES as $status)
                                        <option value="{{ $status }}">
                                            {{ $status }}
                                        </option>
                                    @endforeach

                                </select>
                            </div>

                            <div class="col-md-6 mb-3">
                                <label class="form-label small fw-semibold">
                                    CV
                                </label>

                                <input type="file" id="editCandidateCv" class="form-control border-0"
                                    accept=".pdf,.doc,.docx">
                            </div>

                            <div class="col-md-6 mb-3">
                                <label class="form-label small fw-semibold">
                                    Photo
                                </label>

                                <input type="file" id="editCandidatePhoto" class="form-control border-0"
                                    accept="image/*">
                            </div>

                        </div>

                    </div>
                    <div class="modal-footer modal-footer-custom">
                        <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button>
                        <button type="submit" class="btn submit-candidate-btn">Save</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <div class="modal fade" id="confirmDeleteCandidateModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-sm">
            <div class="modal-content modal-content-custom">
                <div class="modal-body confirm-modal-body">
                    <div class="confirm-modal-icon">
                        <span class="material-symbols-outlined">delete</span>
                    </div>
                    <h6>Delete Candidate?</h6>
                    <p>This action cannot be undone. This candidate and related schedules info will be permanently
                        removed.</p>
                </div>
                <div class="modal-footer modal-footer-custom">
                    <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-danger text-white"
                        id="confirmDeleteCandidateBtn">Delete</button>
                </div>
            </div>
        </div>
    </div>


    <div class="modal fade" id="scheduleCalendarModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content schedule-calendar-modal modal-content-custom">
                <div class="modal-header border-0 pb-0 d-flex justify-content-between align-items-center">

                    <div class="calendar-nav d-flex align-items-center gap-2">
                        <button type="button" class="btn btn-sm calendar-nav-btn bg-0" id="calendarPrevMonth">
                            <span class="material-symbols-outlined">chevron_left</span>
                        </button>

                        <h6 class="mb-0 fw-bold" id="calendarMonthLabel">-</h6>

                        <button type="button" class="btn btn-sm calendar-nav-btn bg-0" id="calendarNextMonth">
                            <span class="material-symbols-outlined">chevron_right</span>
                        </button>
                    </div>

                    <div class="d-flex align-items-center gap-2 ms-auto">
                        <button type="button" class="btn btn-sm calendar-nav-btn bg-0" id="openMonthListBtn"
                            title="View all schedules this month">
                            <span class="material-symbols-outlined">list</span>
                        </button>

                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                        </button>
                    </div>

                </div>
                <div class="modal-body modal-body-custom pt-2">
                    <div class="calendar-weekdays">
                        <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
                    </div>
                    <div class="calendar-grid" id="calendarGrid"></div>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade" id="scheduleDayListModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header schedule-day-header">
                    <h6 class="modal-title fw-bold mb-0" id="scheduleDayListTitle">Schedule</h6>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <ul class="list-group list-group-flush schedule-day-list" id="scheduleDayListBody"></ul>
                </div>
                <div class="modal-footer border-0">
                    <button type="button" class="btn btn-outline-secondary rounded-pill px-4"
                        id="scheduleDayCancelBtn" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-dark rounded-pill px-4" id="scheduleDayAddBtn">+ Add
                        Schedule</button>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade" id="scheduleMonthListModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h6 class="modal-title fw-bold mb-0" id="scheduleMonthListTitle">Schedule List</h6>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="d-flex align-items-center flex-wrap gap-2 mb-3 schedule-search-bar">
                        <div class="btn-group btn-group-sm" role="group" id="scheduleSearchModeGroup">
                            <button type="button" class="btn btn-outline-secondary active"
                                data-mode="monthly">Monthly</button>
                            <button type="button" class="btn btn-outline-secondary" data-mode="daily">Daily</button>
                        </div>
                        <input type="date" class="form-control form-control-sm d-none" id="scheduleSearchDate"
                            style="max-width:170px;">
                        <input type="text" class="form-control form-control-sm flex-grow-1"
                            id="scheduleSearchKeyword" placeholder="Search title / candidate / position...">
                    </div>
                    <ul class="list-group list-group-flush schedule-month-list" id="scheduleMonthListBody"></ul>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade" id="scheduleModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content modal-content-custom">
                <form id="scheduleForm">

                    <div class="modal-header modal-header-custom">
                        <h6 class="modal-title modal-title-custom" id="scheduleModalLabel">
                            Add Schedule
                        </h6>

                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>

                    <div class="modal-body modal-body-custom">

                        <div class="row">

                            <div class="col-md-12 mb-3">
                                <label class="form-label small fw-semibold">
                                    Candidate <span class="text-danger">*</span>
                                </label>

                                <select id="scheduleCandidateId" class="form-select border-0" required>
                                    <option value="">Select Candidate</option>
                                </select>
                            </div>

                            <div class="col-md-6 mb-3">
                                <label class="form-label small fw-semibold">
                                    Schedule Type <span class="text-danger">*</span>
                                </label>

                                <select id="scheduleType" class="form-select border-0" required>
                                    <option value="">Select Type</option>
                                    <option value="interview">Interview</option>
                                    <option value="tech_test">Tech Test</option>
                                    <option value="offering">Offering</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div class="col-md-6 mb-3">
                                <label class="form-label small fw-semibold">
                                    Location <span class="text-danger">*</span>
                                </label>

                                <select id="scheduleLocation" class="form-select border-0" required>
                                    <option value="online">Online</option>
                                    <option value="onsite">Onsite</option>
                                </select>
                            </div>

                            <div class="col-md-12 mb-3">
                                <label class="form-label small fw-semibold">
                                    Title <span class="text-danger">*</span>
                                </label>

                                <input
                                    type="text"
                                    id="scheduleTitle"
                                    class="form-control border-0"
                                    placeholder="Interview with Candidate"
                                    required>
                            </div>

                            <div class="col-md-12 mb-3">
                                <label class="form-label small fw-semibold">
                                    Description
                                </label>

                                <textarea
                                    id="scheduleDescription"
                                    rows="3"
                                    class="form-control border-0"
                                    placeholder="Additional notes"></textarea>
                            </div>

                            <div class="col-md-6 mb-3">
                                <label class="form-label small fw-semibold">
                                    Start Time <span class="text-danger">*</span>
                                </label>

                                <input
                                    type="datetime-local"
                                    id="scheduleTimeStart"
                                    class="form-control border-0"
                                    required>
                            </div>

                            <div class="col-md-6 mb-3">
                                <label class="form-label small fw-semibold">
                                    End Time <span class="text-danger">*</span>
                                </label>

                                <input
                                    type="datetime-local"
                                    id="scheduleTimeEnd"
                                    class="form-control border-0"
                                    required>
                            </div>

                            <div class="col-md-12 mb-1">
                                <label class="form-label small fw-semibold">
                                    Meeting Link
                                </label>

                                <input
                                    type="text"
                                    id="scheduleMeetingLink"
                                    class="form-control border-0"
                                    placeholder="https://meet.google.com/...">
                            </div>

                        </div>

                    </div>

                    <div class="modal-footer modal-footer-custom">
                        <button
                            type="button"
                            id="deleteScheduleBtn"
                            class="btn btn-outline-danger d-none me-auto">
                            Delete
                        </button>

                        <button
                            type="button"
                            class="btn btn-light"
                            data-bs-dismiss="modal">
                            Cancel
                        </button>

                        <button
                            type="submit"
                            class="btn submit-candidate-btn">
                            Save
                        </button>
                    </div>

                </form>
            </div>
        </div>
    </div>

    <x-slot name="script_slot">

        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>
        <script src="{{ asset('asset/js/date_helper.js') }}"></script>
        <script src="{{ asset('asset/js/recruitment_chart.js') }}?v={{ time() }}"></script>
        <script src="{{ asset('asset/js/recruitment.js') }}?v={{ time() }}"></script>

    </x-slot>


</x-office-layout>
