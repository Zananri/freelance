<x-office-layout>
    <x-slot name="menu_active">
        {{ __('menu.salary_payslip') }}
    </x-slot>
    <x-slot name="head_stitle_slot">
        {{ __('menu.salary_payslip') }}
    </x-slot>
    <x-slot name="head_slot">
        <link href="{{ asset('asset/css/salary_payslip.css') }}?v{{ time() }}" rel="stylesheet">
    </x-slot>

    <div class="title-content">
        @php
            $selectedDepartmentId = $selectedDepartmentId ?? 'all';
            $selectedDivisionId = $selectedDivisionId ?? 'all';
            $searchQuery = $searchQuery ?? '';
            $selectedDepartmentName = __('general.all_department');
            $selectedDivisionName = __('general.all_site');

            if ($selectedDepartmentId !== 'all' && $selectedDepartmentId !== '0' && $selectedDepartmentId !== 0) {
                $selectedDepartment = $department->firstWhere('id', (int) $selectedDepartmentId);
                $selectedDepartmentName = $selectedDepartment?->name_department ?? $selectedDepartmentName;
            }

            if ($selectedDivisionId !== 'all' && $selectedDivisionId !== '0' && $selectedDivisionId !== 0) {
                $selectedDivision = $division->firstWhere('id', (int) $selectedDivisionId);
                $selectedDivisionName = $selectedDivision?->name_division ?? $selectedDivisionName;
            }
        @endphp

        <div class="row">
            <div class="col-12 col-md-7">
                <h2 class="text-title-content mb-3">{{ __('menu.salary_payslip') }}</h2>
            </div>
            <div class="col-12 col-md-5">
                <div class="salary-title-actions d-flex gap-2 justify-content-end align-items-center flex-wrap">
                    @php
                        $salaryManagerRoles = [
                            strtoupper((string) (auth()->user()->user_type ?? '')),
                            strtoupper((string) (auth()->user()->user_role ?? '')),
                        ];
                    @endphp
                    @if (count(array_intersect($salaryManagerRoles, ['SUPERADMIN', 'ADMIN', 'ADMINISTRATOR'])) > 0)
                        <button type="button" class="btn btn-default btn-send-all-payslips white-space-nowrap">
                            {{ __('salary.send_all_payslips') }}
                            <span class="material-symbols-outlined align-middle fs-18">send</span>
                        </button>
                        <button type="button" class="btn btn-default btn-download-all-payslips white-space-nowrap">
                            {{-- {{ __('salary.download_all_payslips') }} --}}
                            <span class="material-symbols-outlined align-middle fs-18">download</span>
                        </button>
                    @endif
                    <div>
                        <input type="text" class="input-search-query w-100" value="{{ $searchQuery }}">
                    </div>
                </div>

            </div>
        </div>


    </div>

    <div class="data-container">
        <div class="row">

            <di class="col-12 col-md-12">

                <div class="card-content scrollbar-transparent position-relative">
                    <div class="header-calendar">
                        <div class="">


                            <div class="d-flex align-items-center">
                                <div class="department-division w-100">
                                    <div class="d-flex">

                                        @php
                                            $isSuperadmin = auth()->user()->user_type === 'SUPERADMIN';
                                            $hideDepartment = $isSuperadmin ? '' : 'd-none';
                                        @endphp

                                        <div class="col-dropdown-department {{ $hideDepartment }}"
                                            data-department-id="{{ $isSuperadmin ? $selectedDepartmentId : auth()->user()->employee->department_id }}">

                                            <div class="dropdown dropdown-select">

                                                <div class="dropdown-toggle btn btn-dropdown-table ps-0" type="button"
                                                    data-bs-toggle="dropdown" aria-expanded="false">

                                                    <div class="d-inline-flex align-items-center">
                                                        <span class="title-dropdown">
                                                            {{ $isSuperadmin ? $selectedDepartmentName : auth()->user()->employee->department->name_department }}
                                                        </span>
                                                    </div>

                                                </div>

                                                <ul class="dropdown-menu border-0 shadow-sm bg-default-1 rounded-3">

                                                    @if ($isSuperadmin)
                                                        <li class="dropdown-item department-item" data-department-id="0"
                                                            data-department-name="All Department">
                                                            <div class="dropdown-item fs-14">
                                                                {{ __('general.all_department') }}</div>
                                                        </li>
                                                    @endif

                                                    @foreach ($department as $itemDepartment)
                                                        <li class="dropdown-item department-item fs-14"
                                                            data-department-id="{{ $itemDepartment->id }}"
                                                            data-department-name="{{ $itemDepartment->name_department }}">
                                                            <div class="dropdown-item fs-14">
                                                                {{ $itemDepartment->name_department }}
                                                            </div>
                                                        </li>
                                                    @endforeach

                                                </ul>

                                            </div>
                                        </div>
                                        <div class="col-dropdown-division">
                                            <div class="dropdown dropdown-select">
                                                <div class="dropdown-toggle btn btn-dropdown-table ps-0" type="button"
                                                    data-bs-toggle="dropdown" aria-expanded="false">

                                                    <div class="d-inline-flex align-items-center">
                                                        <span class="title-dropdown">{{ $selectedDivisionName }}</span>
                                                    </div>

                                                </div>

                                                <ul class="dropdown-menu border-0 shadow-sm bg-default-1 rounded-3">
                                                    <li data-department-id="0" data-division-id="0"
                                                        data-division-name="All Site"
                                                        class="dropdown-item division-item fs-14">
                                                        <div class="dropdown-item fs-14">{{ __('general.all_site') }}
                                                        </div>
                                                    </li>
                                                    @foreach ($division as $itemDivision)
                                                        <li data-department-id="{{ $itemDivision->department_id }}"
                                                            data-division-id="{{ $itemDivision->id }}"
                                                            data-division-name="{{ $itemDivision->name_division }}"
                                                            class="dropdown-item division-item fs-14">
                                                            <div class="dropdown-item fs-14">
                                                                {{ $itemDivision->name_division }}</div>
                                                        </li>
                                                    @endforeach
                                                </ul>

                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="month-year">

                                    <div class="dropdown dropdown-month">
                                        <div class="dropdown-toggle btn btn-dropdown-month ps-0" type="button"
                                            data-bs-toggle="dropdown" aria-expanded="false">

                                            <div class="d-inline-flex align-items-center">
                                                <span
                                                    class="calendar-month">{{ now()->locale(app()->getLocale())->translatedFormat('F') }}</span>
                                                <span class="calendar-year">{{ date('Y') }}</span>
                                            </div>

                                        </div>

                                        <ul class="dropdown-menu border-0 shadow-sm bg-default-1 rounded-3">
                                            @for ($monthNum = 1; $monthNum <= 12; $monthNum++)
                                                <li data-month="{{ $monthNum }}"
                                                    class="dropdown-item month-item fs-14">
                                                    <div class="dropdown-item fs-14">
                                                        {{ \Carbon\Carbon::create()->month($monthNum)->locale(app()->getLocale())->translatedFormat('F') }}
                                                    </div>
                                                </li>
                                            @endfor

                                        </ul>
                                    </div>


                                </div>
                                <div class="box-view-control white-space-nowrap">
                                    <span class="material-symbols-outlined calendar-prev-month ms-4">chevron_left</span>
                                    <span class="material-symbols-outlined calendar-next-month">chevron_right</span>
                                    <span class="material-symbols-outlined data-fullscreen">fullscreen</span>
                                    <span
                                        class="material-symbols-outlined data-fullscreen d-none">fullscreen_exit</span>
                                </div>
                            </div>

                        </div>
                    </div>

                    <div class="box-data">
                        <div class="table-container">
                            <table class="table-data">
                                <thead>
                                    <tr>
                                        <th>{{ __('general.employee') }}</th>
                                        <th>
                                            <div>{{ __('general.salary') }}</div>
                                            <div class="fs-10 fw-normal white-space-nowrap">
                                                {{ __('general.take_home_pay') }}
                                            </div>

                                        </th>
                                        <th>
                                            <div class="white-space-nowrap">{{ __('salary.active_day_short') }}</div>
                                            <div class="">
                                                <span
                                                    class="calendar-month fs-10 fw-normal white-space-nowrap">{{ now()->locale(app()->getLocale())->translatedFormat('F') }}</span>
                                            </div>
                                        </th>

                                        <th>
                                            <div class="white-space-nowrap">{{ __('salary.working_day_short') }}</div>
                                            <span
                                                class="calendar-month fs-10 fw-normal white-space-nowrap">{{ now()->locale(app()->getLocale())->translatedFormat('F') }}</span>
                                        </th>

                                        <th>
                                            <div class="white-space-nowrap">{{ __('salary.meal_day_short') }}</div>
                                            <span
                                                class="calendar-month fs-10 fw-normal white-space-nowrap">{{ now()->locale(app()->getLocale())->translatedFormat('F') }}</span>
                                        </th>

                                        <th>
                                            <div class="white-space-nowrap">{{ __('salary.gaji_pokok') }}</div>
                                        </th>

                                        <th>
                                            <div class="white-space-nowrap">{{ __('salary.jabatan') }}</div>
                                        </th>

                                        <th>
                                            <div class="white-space-nowrap">{{ __('salary.tunj_bpjs_kesehatan') }}
                                            </div>
                                        </th>

                                        <th>
                                            <div class="white-space-nowrap">
                                                {{ __('salary.tunj_bpjs_ketenagakerjaan') }}</div>
                                        </th>

                                        <th>
                                            <div class="white-space-nowrap">{{ __('salary.tunj_dana_pensiun') }}</div>
                                        </th>

                                        <th>
                                            <div class="white-space-nowrap">{{ __('salary.kompensasi_pkwt_table') }}
                                            </div>
                                        </th>

                                        <th>
                                            <div>THR</div>
                                        </th>

                                        <th>
                                            <div>{{ __('salary.potongan') }}</div>
                                        </th>

                                    </tr>
                                </thead>
                                <tbody>

                                    <style>
                                        /* Show the checkmark when checked */
                                        .employee-photo input:checked~.checkmark {
                                            display: block;
                                        }

                                        .employee-photo .checkmark {
                                            position: absolute;
                                            top: 0;
                                            left: 0;
                                            width: 100%;
                                            height: 100%;
                                        }
                                    </style>
                                    @foreach ($employee as $itemEmployee)
                                        <tr class="employee-row basic-row"
                                            data-employee-name="{{ $itemEmployee->name }}"
                                            data-employee-photo="{{ asset($itemEmployee->photo) }}"
                                            data-employee-id="{{ $itemEmployee->id }}"
                                            data-division="{{ $itemEmployee->division_id }}"
                                            data-department="{{ $itemEmployee->department_id }}">
                                            <td rowspan="2">
                                                <div class="box-employee">
                                                    <div class="d-flex align-items-center">
                                                        <div class="col-photo">
                                                            <label class="employee-photo">
                                                                <img src="{{ asset($itemEmployee->photo) }}"
                                                                    class="rounded-circle w-100 h-100 object-fit-cover"
                                                                    alt="">
                                                                <div class="checkmark"></div>
                                                                <input type="checkbox" class="d-none employee-item"
                                                                    id="employee-{{ asset($itemEmployee->id) }}"
                                                                    data-employee-id="{{ $itemEmployee->id }}">
                                                            </label>
                                                        </div>
                                                        <div class="col-name w-100">
                                                            <div class="employee-name">
                                                                {{ $itemEmployee->name }}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td rowspan="2" class="">
                                                <div class="gaji pt-2 pb-1 text-center fw-bold">
                                                </div>
                                                <div class="text-center">
                                                    <div class="payslip-sent text-center d-none"
                                                        data-bs-toggle="tooltip" data-bs-placement="top"
                                                        data-bs-title="Terkirim :">
                                                        {{ __('salary.payslip_sent') }}
                                                    </div>
                                                </div>

                                            </td>
                                            <td class="hari-bln p-1"></td>
                                            <td class="hari-kerja p-1"></td>
                                            <td class="hari-um p-1"></td>
                                            <td class="gaji-pokok p-1"></td>
                                            <td class="jabatan p-1"></td>
                                            <td class="bpjs-allowance p-1"></td>
                                            <td class="bpjs-tenaga-kerja-allowance p-1"></td>
                                            <td class="pension-allowance p-1"></td>
                                            <td class="kompensasi-pkwt p-1">0</td>
                                            <td class="thr p-1">0</td>
                                            <td class="potongan p-1">0</td>
                                        </tr>

                                        <tr class="employee-row set-row"
                                            data-employee-name="{{ $itemEmployee->name }}"
                                            data-employee-photo="{{ asset($itemEmployee->photo) }}"
                                            data-employee-id="{{ $itemEmployee->id }}"
                                            data-division="{{ $itemEmployee->division_id }}"
                                            data-department="{{ $itemEmployee->department_id }}">

                                            <td colspan="3" class="text-center z-0">

                                                <div class="">
                                                    <div class="d-flex align-items-center justify-content-between ">
                                                        <div class=" w-100">
                                                            {{ __('salary.perhitungan') }}
                                                        </div>
                                                        <div>
                                                            <div class="d-flex">

                                                                <div>
                                                                    <div class="btn-icon recalled d-none"
                                                                        data-bs-toggle="tooltip"
                                                                        data-bs-placement="top"
                                                                        data-bs-title="Recalled payslip">
                                                                        <span
                                                                            class="material-symbols-outlined icon-action">reset_iso</span>
                                                                    </div>
                                                                </div>

                                                                <div>
                                                                    <div class="btn-icon send d-none"
                                                                        data-bs-toggle="tooltip"
                                                                        data-bs-placement="top"
                                                                        data-bs-title="Send to employee">
                                                                        <span
                                                                            class="material-symbols-outlined icon-action">upload_2</span>
                                                                    </div>
                                                                </div>

                                                                <div>
                                                                    <div class="btn-icon payslip d-none"
                                                                        data-bs-toggle="tooltip"
                                                                        data-bs-placement="top"
                                                                        data-bs-title="Payslip">
                                                                        <span
                                                                            class="material-symbols-outlined icon-action">docs</span>
                                                                    </div>
                                                                </div>

                                                                <div>
                                                                    <div class="btn-icon edit-data"
                                                                        data-bs-toggle="tooltip"
                                                                        data-bs-placement="top" data-bs-title="Edit">
                                                                        <span
                                                                            class="material-symbols-outlined icon-action">edit</span>
                                                                    </div>
                                                                </div>


                                                            </div>


                                                        </div>


                                                    </div>
                                                </div>
                                            </td>
                                            <td class="gaji-pokok p-1"></td>
                                            <td class="jabatan p-1"></td>
                                            <td class="bpjs-allowance p-1"></td>
                                            <td class="bpjs-tenaga-kerja-allowance p-1"></td>
                                            <td class="pension-allowance p-1"></td>
                                            <td class="kompensasi-pkwt p-1">0</td>
                                            <td class="thr p-1">0</td>
                                            <td class="potongan p-1">0</td>
                                        </tr>
                                    @endforeach


                                </tbody>
                            </table>
                        </div>
                        <div class="salary-payslip-pagination mt-3">
                            <div class="salary-payslip-pagination-inner">
                                {{ $employee->onEachSide(1)->links('pagination::bootstrap-5') }}
                            </div>

                            <div class="salary-payslip-pagination-summary">
                                Showing {{ $employee->firstItem() ?? 0 }} - {{ $employee->lastItem() ?? 0 }} of
                                {{ $employee->total() }}
                            </div>
                        </div>
                    </div>

                    <div
                        class="box-loader z-3 rounded-4 bg-body bg-opacity-25 position-absolute top-0 start-0 w-100 h-100">

                        <div class="w-100 h-100 d-flex justify-content-center align-items-center">
                            <div>
                                <div class="spinner-border opacity-50" style="width: 2.5rem; height: 2.5rem;"
                                    role="status">
                                    <span class="visually-hidden">{{ __('general.loading') }}</span>
                                </div>
                                <div class="fs-10">{{ __('general.loading') }}</div>
                            </div>

                        </div>

                    </div>
                </div>

            </di>


        </div>
    </div>



    <x-slot name="body_end_slot">

        <!-- Modal Edit -->
        <div class="modal fade scrollbar-transparent" id="modalSalaryEdit" data-bs-backdrop="static"
            data-bs-keyboard="false" tabindex="-1" aria-labelledby="modalAttendanceEditLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered scrollbar-transparent">
                <div class="modal-content scrollbar-transparent">

                    <div class="modal-body p-0 position-relative">
                        <form id="form-edit-salary" action="" novalidate="" method="POST">
                            @csrf

                            <input type="hidden" name="employee_id" value="">
                            <input type="hidden" name="year" value="">
                            <input type="hidden" name="month" value="">
                            <div class="p-4 pb-0">
                                <div class="text-center">
                                    <div class="fw-light fs-24">{{ __('salary.salary_title') }}</div>
                                    <span
                                        class="fw-normal fs-14 calendar-month">{{ now()->locale(app()->getLocale())->translatedFormat('F') }}</span>
                                    <span class="fw-normal fs-14 calendar-year">{{ date('Y') }}</span>
                                </div>
                                <div class="mb-4 text-center">
                                    <span class="fw-normal fs-14 text-secondary attendance-date"></span>
                                </div>

                                <div class="mb-3 pb-2 border-bottom border-3">

                                    <div class="d-flex mb-2 justify-content-between align-items-center w-100">
                                        <div>
                                            <div class="fs-14 text-secondary fw-normal">{{ __('salary.employee') }}
                                            </div>
                                        </div>
                                        <div>
                                            <div class="employee-name fw-medium fs-14"></div>
                                        </div>
                                    </div>

                                    <div class="mb-2">
                                        <div class="d-flex justify-content-between align-items-center w-100">
                                            <div>
                                                <div class="fs-14 text-secondary fw-normal">{{ __('salary.site') }}
                                                </div>
                                            </div>
                                            <div>
                                                <div class="employee-division fs-14 fw-normal"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="mb-2">
                                        <div class="d-flex justify-content-between align-items-start w-100">
                                            <div>
                                                <div class="fs-14 text-secondary fw-normal">{{ __('salary.salary') }}
                                                </div>
                                                <div class="fs-8 text-secondary fw-normal">
                                                    ({{ __('salary.take_home_pay') }})</div>
                                            </div>
                                            <div>
                                                <div class="employee-salary-thp fs-14 fw-normal"></div>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>


                            <div class="form-block-salary scrollbar-transparent pt-1 p-4">

                                <div class="mb-3">

                                    <div class="row">
                                        <div class="col-4">
                                            <label for="active_day" class="fs-14 text-secondary fw-normal">
                                                {{ __('salary.hari_aktif') }}
                                            </label>
                                            <input type="number" class="form-control  border-0 fs-14"
                                                name="active_day" id="active_day">
                                        </div>
                                        <div class="col-4">
                                            <label for="working_day" class="fs-14 text-secondary fw-normal">
                                                {{ __('salary.hari_kerja') }}
                                            </label>
                                            <span class="fs-12 ms-2 info_working_day" data-bs-toggle="tooltip"
                                                data-bs-html="true" data-bs-placement="top" data-bs-title="0">
                                                <i class="bi bi-info-circle"></i>
                                            </span>
                                            <input type="number" class="form-control border-0 fs-14"
                                                name="working_day" id="working_day">
                                        </div>
                                        <div class="col-4">
                                            <label for="meal_day" class="fs-14 text-secondary fw-normal">
                                                {{ __('salary.hari_um') }}
                                            </label>
                                            <input type="number" class="form-control  border-0 fs-14"
                                                name="meal_day" id="meal_day">
                                        </div>
                                    </div>

                                </div>

                                <div class="mb-3">

                                    <div class="row">
                                        <div class="col-6">
                                            <label for="basic_salary" class="fs-14 text-secondary fw-normal">
                                                {{ __('salary.gaji_pokok') }}
                                            </label>

                                            <span class="fs-12 ms-2 info_basic_salary" data-bs-toggle="tooltip"
                                                data-bs-placement="top" data-bs-title="0">
                                                <i class="bi bi-info-circle"></i>
                                            </span>

                                            <input type="text" class="form-control border-0 fs-14"
                                                name="basic_salary" id="basic_salary">
                                        </div>

                                        <div class="col-6">
                                            <label for="attendance_not_complete" class="fs-14 text-secondary fw-normal">
                                                {{ __('salary.absensi_terlambat') }}
                                            </label>

                                            <input type="number" class="form-control border-0 fs-14"
                                                name="attendance_not_complete"
                                                id="attendance_not_complete"
                                                min="0"
                                                value="">
                                        </div>


                                    </div>

                                </div>


                                <div class="mb-3">

                                    <div class="row">
                                        <div class="col-6">
                                            <label for="positional_allowance" class="fs-14 text-secondary fw-normal">
                                                {{ __('salary.jabatan') }}
                                            </label>

                                            <span class="fs-12 ms-2 info_positional_allowance"
                                                data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="0">
                                                <i class="bi bi-info-circle"></i>
                                            </span>

                                            <input type="text" class="form-control border-0 fs-14"
                                                name="positional_allowance" id="positional_allowance">
                                        </div>

                                        <div class="col-6">
                                            <label for="bpjs_allowance" class="fs-14 text-secondary fw-normal">
                                                {{ __('salary.tunj_bpjs_kesehatan') }}
                                            </label>

                                            <span class="fs-12 ms-2 info_bpjs_allowance" data-bs-toggle="tooltip"
                                                data-bs-placement="top" data-bs-title="0">
                                                <i class="bi bi-info-circle"></i>
                                            </span>

                                            <input type="text" class="form-control border-0 fs-14"
                                                name="bpjs_allowance" id="bpjs_allowance">
                                        </div>

                                    </div>

                                </div>

                                <div class="mb-3">

                                    <div class="row">

                                        <div class="col-6">
                                            <label for="bpjs_tenaga_kerja_allowance"
                                                class="fs-14 text-secondary fw-normal">
                                                {{ __('salary.tunj_bpjs_ketenagakerjaan') }}
                                            </label>
                                            <span class="fs-12 ms-2 info_bpjs_tenaga_kerja_allowance"
                                                data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="0">
                                                <i class="bi bi-info-circle"></i>
                                            </span>
                                            <input type="text" class="form-control border-0 fs-14"
                                                name="bpjs_tenaga_kerja_allowance" id="bpjs_tenaga_kerja_allowance">
                                        </div>

                                        <div class="col-6">
                                            <label for="pension_allowance" class="fs-14 text-secondary fw-normal">
                                                {{ __('salary.tunj_dana_pensiun') }}
                                            </label>
                                            <span class="fs-12 ms-2 info_pension_allowance" data-bs-toggle="tooltip"
                                                data-bs-placement="top" data-bs-title="0">
                                                <i class="bi bi-info-circle"></i>
                                            </span>
                                            <input type="text" class="form-control border-0 fs-14"
                                                name="pension_allowance" id="pension_allowance">
                                        </div>

                                    </div>

                                </div>

                                <div class="mb-3">

                                    <div class="row mb-3">
                                        <div class="col-6">
                                            <label for="kompensasi_pkwt" class="fs-14 text-secondary fw-normal">
                                                {{ __('salary.kompensasi_pkwt') }}
                                            </label>
                                            <input type="text" class="form-control border-0 fs-14"
                                                name="kompensasi_pkwt" id="kompensasi_pkwt" value="0">
                                        </div>

                                        <div class="col-6">
                                            <label for="thr" class="fs-14 text-secondary fw-normal">
                                                {{ __('salary.thr') }}
                                            </label>
                                            <input type="text" class="form-control border-0 fs-14" name="thr"
                                                id="thr" value="0">
                                        </div>
                                    </div>

                                    <div class="mb-2">
                                        <div class="fs-14 text-secondary fw-normal">
                                            {{ __('salary.rincian_potongan') }}</div>
                                    </div>

                                    <div class="row mb-3">
                                        <div class="col-6">
                                            <label for="deduction_absent" class="fs-12 text-secondary fw-normal">
                                                {{ __('salary.deduction_absent') }}
                                            </label>
                                            <input type="text" class="form-control border-0 fs-14"
                                                name="deduction_absent" id="deduction_absent" value="0">
                                        </div>
                                        <div class="col-6">
                                            <label for="deduction_late" class="fs-12 text-secondary fw-normal">
                                                {{ __('salary.deduction_late') }}
                                            </label>
                                            <input type="text" class="form-control border-0 fs-14"
                                                name="deduction_late" id="deduction_late" value="0">
                                        </div>
                                    </div>

                                    <div class="row mb-3">
                                        <div class="col-6">
                                            <label for="deduction_bpjs_kesehatan"
                                                class="fs-12 text-secondary fw-normal">
                                                {{ __('salary.deduction_bpjs_kesehatan') }}
                                            </label>
                                            <input type="text" class="form-control border-0 fs-14"
                                                name="deduction_bpjs_kesehatan" id="deduction_bpjs_kesehatan"
                                                value="0">
                                        </div>
                                        <div class="col-6">
                                            <label for="deduction_bpjs_tenaga_kerja"
                                                class="fs-12 text-secondary fw-normal">
                                                {{ __('salary.deduction_bpjs_tenaga_kerja') }}
                                            </label>
                                            <input type="text" class="form-control border-0 fs-14"
                                                name="deduction_bpjs_tenaga_kerja" id="deduction_bpjs_tenaga_kerja"
                                                value="0">
                                        </div>
                                    </div>

                                    <div class="row mb-3">
                                        <div class="col-6">
                                            <label for="deduction_bpjs_dana_pensiun"
                                                class="fs-12 text-secondary fw-normal">
                                                {{ __('salary.deduction_bpjs_dana_pensiun') }}
                                            </label>
                                            <input type="text" class="form-control border-0 fs-14"
                                                name="deduction_bpjs_dana_pensiun" id="deduction_bpjs_dana_pensiun"
                                                value="0">
                                        </div>
                                        <div class="col-6">
                                            <label for="deduction_pph21" class="fs-12 text-secondary fw-normal">
                                                {{ __('salary.deduction_pph21') }}
                                            </label>
                                            <input type="text" class="form-control border-0 fs-14"
                                                name="deduction_pph21" id="deduction_pph21" value="0">
                                        </div>
                                    </div>

                                    <div class="row mb-3">
                                        <div class="col-6">
                                            <label for="deduction_cooperative" class="fs-12 text-secondary fw-normal">
                                                {{ __('salary.deduction_cooperative') }}
                                            </label>
                                            <input type="text" class="form-control border-0 fs-14"
                                                name="deduction_cooperative" id="deduction_cooperative"
                                                value="0">
                                        </div>
                                        <div class="col-6">
                                            <label for="deduction_other" class="fs-12 text-secondary fw-normal">
                                                {{ __('salary.deduction_other') }}
                                            </label>
                                            <input type="text" class="form-control border-0 fs-14"
                                                name="deduction_other" id="deduction_other" value="0">
                                        </div>
                                    </div>

                                    <div class="row">
                                        <div class="col-12">
                                            <label for="note" class="fs-14 text-secondary fw-normal">
                                                {{ __('salary.note') }}
                                            </label>
                                            <textarea name="note" id="note" cols="3" rows="3" class="form-control border-0 fs-14"></textarea>
                                        </div>

                                    </div>

                                </div>

                            </div>

                            <div class="p-4 pt-2">
                                <div class="row">
                                    <div class="col-6">
                                        <div class="btn btn-default-modal border-0 w-100 p-2 btn-close-modal-edit">
                                            {{ __('salary.cancel') }}</div>
                                    </div>
                                    <div class="col-6">
                                        <div class="btn btn-default-dark-modal border-0 w-100 p-2 btn-save-salary">
                                            {{ __('salary.save') }}</div>
                                    </div>
                                </div>
                            </div>


                        </form>

                        <div
                            class="box-loader z-3 rounded-4 bg-body bg-opacity-25 position-absolute top-0 start-0 w-100 h-100">

                            <div class="w-100 h-100 d-flex justify-content-center align-items-center">
                                <div>
                                    <div class="spinner-border" style="width: 3rem; height: 3rem;" role="status">
                                        <span class="visually-hidden">{{ __('general.loading') }}</span>
                                    </div>
                                    <div class="fs-14">{{ __('general.loading') }}</div>
                                </div>

                            </div>

                        </div>
                    </div>

                </div>
            </div>
        </div>

        <!-- Modal Send All Payslips -->
        <div class="modal fade scrollbar-transparent" id="modalAllPayslipSend" data-bs-backdrop="static"
            data-bs-keyboard="false" tabindex="-1" aria-labelledby="modalAllPayslipSendLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered scrollbar-transparent">
                <div class="modal-content scrollbar-transparent">
                    <div class="modal-body p-0 position-relative">
                        <div class="p-4 pb-0">
                            <div class="text-center">
                                <div class="fw-light fs-24">{{ __('salary.send_all_payslips') }}</div>
                                <span
                                    class="fw-normal fs-14 calendar-month">{{ now()->locale(app()->getLocale())->translatedFormat('F') }}</span>
                                <span class="fw-normal fs-14 calendar-year">{{ date('Y') }}</span>
                            </div>

                            <div class="my-4 pb-3 border-bottom border-3">
                                <div class="d-flex justify-content-between align-items-center gap-3">
                                    <div class="fs-14 text-secondary fw-normal">{{ __('salary.recipient_scope') }}
                                    </div>
                                    <div class="fs-14 fw-medium text-end">
                                        @if (strtoupper((string) (auth()->user()->user_type ?? '')) === 'SUPERADMIN')
                                            {{ __('salary.all_employees') }}
                                        @else
                                            {{ auth()->user()->employee?->department?->name_department ?? __('salary.same_department') }}
                                        @endif
                                    </div>
                                </div>
                            </div>

                            <div class="fs-12 text-body text-opacity-50">
                                {{ __('salary.confirm_send_payslip') }}
                            </div>
                            <div class="fw-bold fs-12 mt-3">
                                {{ __('salary.confirm_send_all_payslips') }}
                            </div>
                        </div>

                        <div class="p-4 pt-3">
                            <div class="row">
                                <div class="col-6">
                                    <button type="button"
                                        class="btn btn-default-modal border-0 w-100 p-2 btn-close-all-payslips">
                                        {{ __('salary.cancel') }}
                                    </button>
                                </div>
                                <div class="col-6">
                                    <button type="button"
                                        class="btn btn-default-dark-modal border-0 w-100 p-2 btn-confirm-send-all-payslips">
                                        {{ __('salary.send') }}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div
                            class="box-loader z-3 rounded-4 bg-body bg-opacity-25 position-absolute top-0 start-0 w-100 h-100">
                            <div class="w-100 h-100 d-flex justify-content-center align-items-center">
                                <div>
                                    <div class="spinner-border" style="width: 3rem; height: 3rem;" role="status">
                                        <span class="visually-hidden">{{ __('general.loading') }}</span>
                                    </div>
                                    <div class="fs-14">{{ __('general.loading') }}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal Sent -->
        <div class="modal fade scrollbar-transparent" id="modalPayslipSend" data-bs-backdrop="static"
            data-bs-keyboard="false" tabindex="-1" aria-labelledby="modalPayslipSendLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered scrollbar-transparent">
                <div class="modal-content scrollbar-transparent">

                    <div class="modal-body p-0 position-relative">
                        <form id="form-send-payslip" action="" novalidate="" method="POST">
                            @csrf

                            <input type="hidden" name="employee_id" value="">
                            <input type="hidden" name="year" value="">
                            <input type="hidden" name="month" value="">


                            <div class="p-4 pb-0">
                                <div class="text-center">
                                    <div class="fw-light fs-24">{{ __('salary.payslip') }}</div>
                                    <span
                                        class="fw-normal fs-14 calendar-month">{{ now()->locale(app()->getLocale())->translatedFormat('F') }}</span>
                                    <span class="fw-normal fs-14 calendar-year">{{ date('Y') }}</span>
                                </div>
                                <div class="mb-4 text-center">
                                    <span class="fw-normal fs-14 text-secondary attendance-date"></span>
                                </div>

                                <div class="mb-3 pb-2 border-bottom border-3">

                                    <div class="d-flex mb-2 justify-content-between align-items-center w-100">
                                        <div>
                                            <div class="fs-14 text-secondary fw-normal">{{ __('salary.employee') }}
                                            </div>
                                        </div>
                                        <div>
                                            <div class="employee-name fw-medium fs-14"></div>
                                        </div>
                                    </div>

                                    <div class="mb-2">
                                        <div class="d-flex justify-content-between align-items-center w-100">
                                            <div>
                                                <div class="fs-14 text-secondary fw-normal">{{ __('salary.site') }}
                                                </div>
                                            </div>
                                            <div>
                                                <div class="employee-division fs-14 fw-normal"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="mb-2">
                                        <div class="d-flex justify-content-between align-items-start w-100">
                                            <div>
                                                <div class="fs-14 text-secondary fw-normal">{{ __('salary.salary') }}
                                                </div>
                                                <div class="fs-8 text-secondary fw-normal">
                                                    ({{ __('salary.take_home_pay') }})</div>
                                            </div>
                                            <div>
                                                <div class="employee-salary-thp fs-14 fw-normal"></div>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>

                            <div class="p-4 pt-0">
                                <div class="fs-12 tex-body text-opacity-50">
                                    {{ __('salary.confirm_send_payslip') }}
                                </div>
                                <div class="fw-bold fs-12 mt-3">
                                    {{ __('salary.confirm_send_payslip_question') }}
                                </div>
                            </div>


                            <div>

                            </div>


                            <div class="p-4 pt-2">
                                <div class="row">
                                    <div class="col-6">
                                        <div class="btn btn-default-modal border-0 w-100 p-2 btn-close-modal-edit">
                                            {{ __('salary.cancel') }}</div>
                                    </div>
                                    <div class="col-6">
                                        <div class="btn btn-default-dark-modal border-0 w-100 p-2 btn-send-payslip">
                                            {{ __('salary.send') }}</div>
                                    </div>
                                </div>
                            </div>


                        </form>

                        <div
                            class="box-loader z-3 rounded-4 bg-body bg-opacity-25 position-absolute top-0 start-0 w-100 h-100">

                            <div class="w-100 h-100 d-flex justify-content-center align-items-center">
                                <div>
                                    <div class="spinner-border" style="width: 3rem; height: 3rem;" role="status">
                                        <span class="visually-hidden">{{ __('general.loading') }}</span>
                                    </div>
                                    <div class="fs-14">{{ __('general.loading') }}</div>
                                </div>

                            </div>

                        </div>
                    </div>

                </div>
            </div>
        </div>

        <!-- Modal Sent -->
        <div class="modal fade scrollbar-transparent" id="modalPayslipRecalled" data-bs-backdrop="static"
            data-bs-keyboard="false" tabindex="-1" aria-labelledby="modalPayslipRecalledLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered scrollbar-transparent">
                <div class="modal-content scrollbar-transparent">

                    <div class="modal-body p-0 position-relative">
                        <form id="form-recalled-payslip" action="" novalidate="" method="POST">
                            @csrf

                            <input type="hidden" name="employee_id" value="">
                            <input type="hidden" name="year" value="">
                            <input type="hidden" name="month" value="">


                            <div class="p-4 pb-0">
                                <div class="text-center">
                                    <div class="fw-light fs-24">{{ __('salary.payslip') }}</div>
                                    <span
                                        class="fw-normal fs-14 calendar-month">{{ now()->locale(app()->getLocale())->translatedFormat('F') }}</span>
                                    <span class="fw-normal fs-14 calendar-year">{{ date('Y') }}</span>
                                </div>
                                <div class="mb-4 text-center">
                                    <span class="fw-normal fs-14 text-secondary attendance-date"></span>
                                </div>

                                <div class="mb-3 pb-2 border-bottom border-3">

                                    <div class="d-flex mb-2 justify-content-between align-items-center w-100">
                                        <div>
                                            <div class="fs-14 text-secondary fw-normal">{{ __('salary.employee') }}
                                            </div>
                                        </div>
                                        <div>
                                            <div class="employee-name fw-medium fs-14"></div>
                                        </div>
                                    </div>

                                    <div class="mb-2">
                                        <div class="d-flex justify-content-between align-items-center w-100">
                                            <div>
                                                <div class="fs-14 text-secondary fw-normal">{{ __('salary.site') }}
                                                </div>
                                            </div>
                                            <div>
                                                <div class="employee-division fs-14 fw-normal"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="mb-2">
                                        <div class="d-flex justify-content-between align-items-start w-100">
                                            <div>
                                                <div class="fs-14 text-secondary fw-normal">{{ __('salary.salary') }}
                                                </div>
                                                <div class="fs-8 text-secondary fw-normal">
                                                    ({{ __('salary.take_home_pay') }})</div>
                                            </div>
                                            <div>
                                                <div class="employee-salary-thp fs-14 fw-normal"></div>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>

                            <div class="p-4 pt-0">

                                <div class="fw-bold fs-12 mt-3">
                                    {{ __('salary.confirm_recall_payslip') }}
                                </div>
                            </div>


                            <div>

                            </div>


                            <div class="p-4 pt-2">
                                <div class="row">
                                    <div class="col-6">
                                        <div class="btn btn-default-modal border-0 w-100 p-2 btn-close-modal-edit">
                                            {{ __('salary.cancel') }}</div>
                                    </div>
                                    <div class="col-6">
                                        <div
                                            class="btn btn-default-dark-modal border-0 w-100 p-2 btn-recalled-payslip">
                                            {{ __('salary.recall') }}</div>
                                    </div>
                                </div>
                            </div>


                        </form>

                        <div
                            class="box-loader z-3 rounded-4 bg-body bg-opacity-25 position-absolute top-0 start-0 w-100 h-100">

                            <div class="w-100 h-100 d-flex justify-content-center align-items-center">
                                <div>
                                    <div class="spinner-border" style="width: 3rem; height: 3rem;" role="status">
                                        <span class="visually-hidden">Loading...</span>
                                    </div>
                                    <div class="fs-14">Loading...</div>
                                </div>

                            </div>

                        </div>
                    </div>

                </div>
            </div>
        </div>

    </x-slot>


    <x-slot name="script_slot">
        <script>
            window.salaryTranslations = @json(__('salary'));
        </script>
        <script src="{{ asset('asset/js/date_helper.js') }}?v={{ time() }}"></script>
        <script src="{{ asset('asset/js/salary_payslip.js') }}?v={{ time() }}"></script>
    </x-slot>

</x-office-layout>
