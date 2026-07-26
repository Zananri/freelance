<x-office-layout>
    <x-slot name="menu_active">
        {{ __('recruitment.recruitment') }}
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
                <h2 class="text-title-content mb-0">{{ __('recruitment.recruitment') }}</h2>
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
                            {{ __('recruitment.total_employees') }}
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

                    <small class="tranding-text text-muted ms-2">{{ __('recruitment.compared_to_last_month') }}</small>
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
                            {{ __('recruitment.hired_employee') }}
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

                    <small class="tranding-text text-muted ms-2">{{ __('recruitment.compared_to_last_month') }}</small>
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
                            {{ __('recruitment.new_applicants') }}
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

                    <small class="tranding-text text-muted ms-2">{{ __('recruitment.compared_to_last_month') }}</small>
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
                            {{ __('recruitment.interview_scheduled') }}
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

                    <small class="tranding-text text-muted ms-2">{{ __('recruitment.compared_to_last_month') }}</small>
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
                    <h5 class="mb-0 fw-bold">{{ __('recruitment.recruitment_pipeline') }}</h5>
                </div>

                <div class="pipeline-wrapper"></div>

            </div>
        </div>
    </div>

    <div class="row g-3">
        <div class="col-lg-9">
            <div class="body-content rounded-4 p-4">

                <h5 class="dashboard-card-title mb-1">{{ __('recruitment.new_candidate_trend') }}</h5>
                <p class="dashboard-card-subtitle text-muted fs-8 mb-0">
                    {{ __('recruitment.daily_incoming_candidates') }}
                </p>

                <div style="height: 250px;">
                    <canvas id="candidateOverview"></canvas>
                </div>

            </div>
        </div>

        <div class="col-lg-3">
            <div class="body-content rounded-4 p-3 h-100 d-flex flex-column">
                <h5 class="fw-semibold mb-3">
                    {{ __('recruitment.quick_actions') }}
                </h5>
                <div class="flex-grow-1">
                    <div class="d-flex flex-column gap-2">

                        <button type="button" id="addCandidateBtn"
                            class="btn quick-btn-action w-100 d-flex align-items-center py-3">
                            <span class="material-symbols-outlined me-2">
                                person_add
                            </span>
                            <small>{{ __('recruitment.add_candidate') }}</small>
                        </button>

                        <button type="button" id="openScheduleCalendarBtn"
                            class="btn quick-btn-action w-100 d-flex align-items-center py-3">
                            <span class="material-symbols-outlined me-2">
                                calendar_month
                            </span>
                            <small>{{ __('recruitment.recruitment_schedule') }}</small>
                        </button>

                        <button type="button" id="generateReportBtn"
                            class="btn quick-btn-action w-100 d-flex align-items-center py-3">
                            <span class="material-symbols-outlined me-2">
                                description
                            </span>
                            <small>{{ __('recruitment.generate_report') }}</small>
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
                        <h6 class="modal-title modal-title-custom mb-0">{{ __('recruitment.add_candidate_title') }}</h6>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body modal-body-custom">

                        <div class="row">

                            <div class="col-md-12 mb-3">
                                <label class="form-label small fw-semibold">
                                    {{ __('recruitment.position') }} <span class="text-danger">*</span>
                                </label>

                                <select id="addCandidateJobId" class="form-select border-0" required>

                                    <option value="">{{ __('recruitment.select_position') }}</option>

                                </select>
                            </div>

                            <div class="col-md-6 mb-3">
                                <label class="form-label small fw-semibold">
                                    {{ __('recruitment.full_name') }} <span class="text-danger">*</span>
                                </label>
                                <input type="text" id="addCandidateName" class="form-control border-0"
                                    placeholder="{{ __('recruitment.enter_full_name') }}" required>
                            </div>

                            <div class="col-md-6 mb-3">
                                <label class="form-label small fw-semibold">
                                    {{ __('recruitment.email') }} <span class="text-danger">*</span>
                                </label>
                                <input type="email" id="addCandidateEmail" class="form-control border-0"
                                    placeholder="example@email.com" required>
                            </div>

                            <div class="col-md-6 mb-3">
                                <label class="form-label small fw-semibold">
                                    {{ __('recruitment.phone_number') }}
                                </label>
                                <input type="text" id="addCandidatePhone" class="form-control border-0"
                                    placeholder="08xxxxxxxxxx">
                            </div>

                            <div class="col-md-6 mb-3">
                                <label class="form-label small fw-semibold">
                                    {{ __('recruitment.gender') }}
                                </label>

                                <select id="addCandidateGender" class="form-select border-0">

                                    <option value="">{{ __('recruitment.select_gender') }}</option>
                                    <option value="male">{{ __('recruitment.male') }}</option>
                                    <option value="female">{{ __('recruitment.female') }}</option>

                                </select>
                            </div>

                            <div class="col-md-6 mb-3">
                                <label class="form-label small fw-semibold">
                                    {{ __('recruitment.birthdate') }}
                                </label>

                                <input type="date" id="addCandidateBirthdate" class="form-control border-0">
                            </div>

                            <div class="col-md-6 mb-3">
                                <label class="form-label small fw-semibold">
                                    {{ __('recruitment.last_education') }}
                                </label>

                                <input type="text" id="addCandidateEducation" class="form-control border-0"
                                    placeholder="{{ __('recruitment.bachelor_degree') }}">
                            </div>

                            <div class="col-md-6 mb-3">
                                <label class="form-label small fw-semibold">
                                    {{ __('recruitment.experience_years') }}
                                </label>

                                <input type="number" id="addCandidateExperience" class="form-control border-0"
                                    placeholder="0">
                            </div>

                            <div class="col-md-6 mb-3">
                                <label class="form-label small fw-semibold">
                                    {{ __('recruitment.expected_salary') }}
                                </label>

                                <input type="number" id="addCandidateSalary" class="form-control border-0"
                                    placeholder="5000000">
                            </div>

                            <div class="col-md-12 mb-3">
                                <label class="form-label small fw-semibold">
                                    {{ __('recruitment.address') }}
                                </label>

                                <textarea id="addCandidateAddress" rows="3" class="form-control border-0" placeholder="{{ __('recruitment.candidate_address') }}"></textarea>
                            </div>

                            <div class="col-md-6 mb-3">
                                <label class="form-label small fw-semibold">
                                    {{ __('recruitment.recruitment_source') }}
                                </label>

                                <input type="text" id="addCandidateSource" class="form-control border-0"
                                    placeholder="{{ __('recruitment.source_placeholder') }}">
                            </div>

                            <div class="col-md-6 mb-3">
                                <label class="form-label small fw-semibold">
                                    {{ __('recruitment.status') }}
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
                                    {{ __('recruitment.cv') }}
                                </label>

                                <input type="file" id="addCandidateCv" class="form-control border-0"
                                    accept=".pdf,.doc,.docx">
                            </div>

                            <div class="col-md-6 mb-3">
                                <label class="form-label small fw-semibold">
                                    {{ __('recruitment.photo') }}
                                </label>

                                <input type="file" id="addCandidatePhoto" class="form-control border-0"
                                    accept="image/*">
                            </div>

                        </div>

                    </div>
                    <div class="modal-footer modal-footer-custom">
                        <button type="button" class="btn btn-light" data-bs-dismiss="modal">{{ __('recruitment.cancel') }}</button>
                        <button type="submit" class="btn submit-candidate-btn">{{ __('recruitment.save') }}</button>
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
                        <h6 class="modal-title modal-title-custom mb-0">{{ __('recruitment.edit_candidate_title') }}</h6>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body modal-body-custom">

                        <div class="row">

                            <div class="col-md-12 mb-3">
                                <label class="form-label small fw-semibold">
                                    {{ __('recruitment.position') }} <span class="text-danger">*</span>
                                </label>

                                <select id="editCandidateJobId" class="form-select border-0" required>

                                    <option value="">{{ __('recruitment.select_position') }}</option>

                                </select>
                            </div>

                            <div class="col-md-6 mb-3">
                                <label class="form-label small fw-semibold">
                                    {{ __('recruitment.full_name') }} <span class="text-danger">*</span>
                                </label>
                                <input type="text" id="editCandidateName" class="form-control border-0"
                                    placeholder="{{ __('recruitment.enter_full_name') }}" required>
                            </div>

                            <div class="col-md-6 mb-3">
                                <label class="form-label small fw-semibold">
                                    {{ __('recruitment.email') }} <span class="text-danger">*</span>
                                </label>
                                <input type="email" id="editCandidateEmail" class="form-control border-0"
                                    placeholder="example@email.com" required>
                            </div>

                            <div class="col-md-6 mb-3">
                                <label class="form-label small fw-semibold">
                                    {{ __('recruitment.phone_number') }}
                                </label>
                                <input type="text" id="editCandidatePhone" class="form-control border-0"
                                    placeholder="08xxxxxxxxxx">
                            </div>

                            <div class="col-md-6 mb-3">
                                <label class="form-label small fw-semibold">
                                    {{ __('recruitment.gender') }}
                                </label>

                                <select id="editCandidateGender" class="form-select border-0">

                                    <option value="">{{ __('recruitment.select_gender') }}</option>
                                    <option value="male">{{ __('recruitment.male') }}</option>
                                    <option value="female">{{ __('recruitment.female') }}</option>

                                </select>
                            </div>

                            <div class="col-md-6 mb-3">
                                <label class="form-label small fw-semibold">
                                    {{ __('recruitment.birthdate') }}
                                </label>

                                <input type="date" id="editCandidateBirthdate" class="form-control border-0">
                            </div>

                            <div class="col-md-6 mb-3">
                                <label class="form-label small fw-semibold">
                                    {{ __('recruitment.last_education') }}
                                </label>

                                <input type="text" id="editCandidateEducation" class="form-control border-0"
                                    placeholder="{{ __('recruitment.bachelor_degree') }}">
                            </div>

                            <div class="col-md-6 mb-3">
                                <label class="form-label small fw-semibold">
                                    {{ __('recruitment.experience_years') }}
                                </label>

                                <input type="number" id="editCandidateExperience" class="form-control border-0"
                                    placeholder="0">
                            </div>

                            <div class="col-md-6 mb-3">
                                <label class="form-label small fw-semibold">
                                    {{ __('recruitment.expected_salary') }}
                                </label>

                                <input type="number" id="editCandidateSalary" class="form-control border-0"
                                    placeholder="5000000">
                            </div>

                            <div class="col-md-12 mb-3">
                                <label class="form-label small fw-semibold">
                                    {{ __('recruitment.address') }}
                                </label>

                                <textarea id="editCandidateAddress" rows="3" class="form-control border-0" placeholder="{{ __('recruitment.candidate_address') }}"></textarea>
                            </div>

                            <div class="col-md-6 mb-3">
                                <label class="form-label small fw-semibold">
                                    {{ __('recruitment.recruitment_source') }}
                                </label>

                                <input type="text" id="editCandidateSource" class="form-control border-0"
                                    placeholder="{{ __('recruitment.source_placeholder') }}">
                            </div>

                            <div class="col-md-6 mb-3">
                                <label class="form-label small fw-semibold">
                                    {{ __('recruitment.status') }}
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
                                    {{ __('recruitment.cv') }}
                                </label>

                                <input type="file" id="editCandidateCv" class="form-control border-0"
                                    accept=".pdf,.doc,.docx">
                            </div>

                            <div class="col-md-6 mb-3">
                                <label class="form-label small fw-semibold">
                                    {{ __('recruitment.photo') }}
                                </label>

                                <input type="file" id="editCandidatePhoto" class="form-control border-0"
                                    accept="image/*">
                            </div>

                        </div>

                    </div>
                    <div class="modal-footer modal-footer-custom">
                        <button type="button" class="btn btn-light" data-bs-dismiss="modal">{{ __('recruitment.cancel') }}</button>
                        <button type="submit" class="btn submit-candidate-btn">{{ __('recruitment.save') }}</button>
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
                    <h6>{{ __('recruitment.delete_candidate') }}</h6>
                    <p>{{ __('recruitment.delete_candidate_confirm') }}</p>
                </div>
                <div class="modal-footer modal-footer-custom">
                    <button type="button" class="btn btn-light" data-bs-dismiss="modal">{{ __('recruitment.cancel') }}</button>
                    <button type="button" class="btn btn-danger text-white"
                        id="confirmDeleteCandidateBtn">{{ __('recruitment.delete') }}</button>
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
                            title="{{ __('recruitment.view_all') }}">
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
                    <h6 class="modal-title fw-bold mb-0" id="scheduleDayListTitle">{{ __('recruitment.schedule_day') }}</h6>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <ul class="list-group list-group-flush schedule-day-list" id="scheduleDayListBody"></ul>
                </div>
                <div class="modal-footer border-0">
                    <button type="button" class="btn btn-outline-secondary rounded-pill px-4"
                        id="scheduleDayCancelBtn" data-bs-dismiss="modal">{{ __('recruitment.cancel') }}</button>
                    <button type="button" class="btn btn-dark rounded-pill px-4" id="scheduleDayAddBtn">{{ __('recruitment.add_schedule') }}</button>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade" id="scheduleMonthListModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h6 class="modal-title fw-bold mb-0" id="scheduleMonthListTitle">{{ __('recruitment.schedule_list') }}</h6>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="d-flex align-items-center flex-wrap gap-2 mb-3 schedule-search-bar">
                        <div class="btn-group btn-group-sm" role="group" id="scheduleSearchModeGroup">
                            <button type="button" class="btn btn-outline-secondary active"
                                data-mode="monthly">{{ __('recruitment.monthly') }}</button>
                            <button type="button" class="btn btn-outline-secondary" data-mode="daily">{{ __('recruitment.daily') }}</button>
                        </div>
                        <input type="date" class="form-control form-control-sm d-none" id="scheduleSearchDate"
                            style="max-width:170px;">
                        <input type="text" class="form-control form-control-sm flex-grow-1"
                            id="scheduleSearchKeyword" placeholder="{{ __('recruitment.search_title_candidate') }}">
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
                            {{ __('recruitment.add_schedule_title') }}
                        </h6>

                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>

                    <div class="modal-body modal-body-custom">

                        <div class="row">

                            <div class="col-md-12 mb-3">
                                <label class="form-label small fw-semibold">
                                    {{ __('recruitment.candidate') }} <span class="text-danger">*</span>
                                </label>

                                <select id="scheduleCandidateId" class="form-select border-0" required>
                                    <option value="">{{ __('recruitment.select_candidate') }}</option>
                                </select>
                            </div>

                            <div class="col-md-6 mb-3">
                                <label class="form-label small fw-semibold">
                                    {{ __('recruitment.schedule_type') }} <span class="text-danger">*</span>
                                </label>

                                <select id="scheduleType" class="form-select border-0" required>
                                    <option value="">{{ __('recruitment.select_type') }}</option>
                                    <option value="interview">{{ __('recruitment.interview') }}</option>
                                    <option value="tech_test">{{ __('recruitment.tech_test') }}</option>
                                    <option value="offering">{{ __('recruitment.offering') }}</option>
                                    <option value="other">{{ __('recruitment.other') }}</option>
                                </select>
                            </div>

                            <div class="col-md-6 mb-3">
                                <label class="form-label small fw-semibold">
                                    {{ __('recruitment.location') }} <span class="text-danger">*</span>
                                </label>

                                <select id="scheduleLocation" class="form-select border-0" required>
                                    <option value="online">{{ __('recruitment.online') }}</option>
                                    <option value="onsite">{{ __('recruitment.onsite') }}</option>
                                </select>
                            </div>

                            <div class="col-md-12 mb-3">
                                <label class="form-label small fw-semibold">
                                    {{ __('recruitment.title') }} <span class="text-danger">*</span>
                                </label>

                                <input
                                    type="text"
                                    id="scheduleTitle"
                                    class="form-control border-0"
                                    placeholder="{{ __('recruitment.interview_title') }}"
                                    required>
                            </div>

                            <div class="col-md-12 mb-3">
                                <label class="form-label small fw-semibold">
                                    {{ __('recruitment.description') }}
                                </label>

                                <textarea
                                    id="scheduleDescription"
                                    rows="3"
                                    class="form-control border-0"
                                    placeholder="{{ __('recruitment.additional_notes') }}"></textarea>
                            </div>

                            <div class="col-md-6 mb-3">
                                <label class="form-label small fw-semibold">
                                    {{ __('recruitment.start_time') }} <span class="text-danger">*</span>
                                </label>

                                <input
                                    type="datetime-local"
                                    id="scheduleTimeStart"
                                    class="form-control border-0"
                                    required>
                            </div>

                            <div class="col-md-6 mb-3">
                                <label class="form-label small fw-semibold">
                                    {{ __('recruitment.end_time') }} <span class="text-danger">*</span>
                                </label>

                                <input
                                    type="datetime-local"
                                    id="scheduleTimeEnd"
                                    class="form-control border-0"
                                    required>
                            </div>

                            <div class="col-md-12 mb-1">
                                <label class="form-label small fw-semibold">
                                    {{ __('recruitment.meeting_link') }}
                                </label>

                                <input
                                    type="text"
                                    id="scheduleMeetingLink"
                                    class="form-control border-0"
                                    placeholder="{{ __('recruitment.meeting_link_placeholder') }}">
                            </div>

                        </div>

                    </div>

                    <div class="modal-footer modal-footer-custom">
                        <button
                            type="button"
                            id="deleteScheduleBtn"
                            class="btn btn-outline-danger d-none me-auto">
                            {{ __('recruitment.delete_schedule') }}
                        </button>

                        <button
                            type="button"
                            class="btn btn-light"
                            data-bs-dismiss="modal">
                            {{ __('recruitment.cancel') }}
                        </button>

                        <button
                            type="submit"
                            class="btn submit-candidate-btn">
                            {{ __('recruitment.save') }}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    </div>

    <x-slot name="script_slot">

        <script>
            window.recruitmentLang = @json(__('recruitment'));
        </script>

        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>
        <script src="{{ asset('asset/js/date_helper.js') }}"></script>
        <script src="{{ asset('asset/js/recruitment_chart.js') }}?v={{ time() }}"></script>
        <script src="{{ asset('asset/js/recruitment.js') }}?v={{ time() }}"></script>

    </x-slot>


</x-office-layout>