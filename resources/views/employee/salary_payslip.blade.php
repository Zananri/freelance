<x-office-layout>
    <x-slot name="menu_active">
        {{ __('salary_payslip') }}
    </x-slot>
    <x-slot name="head_stitle_slot">
        {{ __('Salary Payslip') }}
    </x-slot>
    <x-slot name="head_slot">
        <link href="{{ asset('asset/css/salary_payslip.css')}}?v{{ time() }}" rel="stylesheet">
    </x-slot>

    <div class="title-content">

        <div class="row">
            <div class="col-12 col-md-9">
                <h2 class="text-title-content mb-3" >Salary & Payslip</h2>
            </div>
            <div class="col-12 col-md-3">
                <div class="d-flex gap-2 justify-content-end align-items-center">
                    <div>
                        <input type="text" class="input-search-query w-100">
                    </div>
                    <div>
                        <button class="btn btn-default" type="button" id="btn-download-xlsx">
                            <span class="material-symbols-outlined icon download" type="button">download</span>
                        </button>
                    </div>
                </div>
                
            </div>
        </div>
       
        
    </div>

    <div class="data-container">
        <div class="row">

            <di class="col-12 col-md-12"> 

                <div class="card-content scrollbar-transparent overflow-auto position-relative">
                    <div class="header-calendar">
                        <div class="">

                        
                        <div class="d-flex align-items-center">
                            <div class="department-division w-100">
                                <div class="d-flex"> 

                                    @php
                                        $hideDeparment = ' ';
                                        if(auth()->user()->employee->department_id != 1){
                                            $hideDeparment = 'd-none';
                                        }
                                    @endphp

                                    <div class="col-dropdown-department {{ $hideDeparment }}" data-department-id="{{ auth()->user()->employee->department_id }}">
                                        <div class="dropdown dropdown-select">

                                            <div class="dropdown-toggle btn btn-dropdown-table ps-0" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                                
                                                <div class="d-inline-flex align-items-center">
                                                    <span class="title-dropdown">All Department</span>
                                                </div>

                                            </div>

                                            <ul class="dropdown-menu border-0 shadow-sm bg-default-1 rounded-3">
                                                
                                                @foreach ($department as $itemDepartment)
                                                    <li data-department-id="{{ $itemDepartment->id }}" data-department-name="{{ $itemDepartment->name_department }}"  class="dropdown-item department-item fs-14">
                                                        <div class="dropdown-item fs-14">{{ $itemDepartment->name_department }}</div>
                                                    </li>     
                                                @endforeach
                                            </ul>

                                        </div>
                                    </div>
                                    <div class="col-dropdown-division">
                                        <div class="dropdown dropdown-select">
                                            <div class="dropdown-toggle btn btn-dropdown-table ps-0" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                                
                                                <div class="d-inline-flex align-items-center">
                                                    <span class="title-dropdown">All Division</span>
                                                </div>

                                            </div>

                                            <ul class="dropdown-menu border-0 shadow-sm bg-default-1 rounded-3">
                                                <li data-department-id="0" data-division-id="0" data-division-name="All Division" class="dropdown-item division-item fs-14">
                                                    <div class="dropdown-item fs-14">All Division</div>
                                                </li>
                                                @foreach ($division as $itemDivision)
                                                    <li data-department-id="{{ $itemDivision->department_id }}" data-division-id="{{ $itemDivision->id }}" data-division-name="{{ $itemDivision->name_division }}" class="dropdown-item division-item fs-14">
                                                        <div class="dropdown-item fs-14">{{ $itemDivision->name_division }}</div>
                                                    </li>     
                                                @endforeach
                                            </ul>

                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="month-year">

                                <div class="dropdown dropdown-month">
                                    <div class="dropdown-toggle btn btn-dropdown-month ps-0" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                        
                                        <div class="d-inline-flex align-items-center">
                                            <span class="calendar-month">{{ date('F') }}</span>
                                            <span class="calendar-year">{{ date('Y') }}</span>
                                        </div>

                                    </div>

                                    <ul class="dropdown-menu border-0 shadow-sm bg-default-1 rounded-3">
                                        @for ($monthNum = 1; $monthNum <= 12; $monthNum++) 
                                            <li data-month="{{ $monthNum }}" class="dropdown-item month-item fs-14"><div class="dropdown-item fs-14">{{date("F", mktime(0, 0, 0, $monthNum, 1))}}</div></li>    
                                        @endfor
                                        
                                    </ul>
                                </div>

                                
                            </div>
                            <div class="box-view-control white-space-nowrap" >
                                <span class="material-symbols-outlined calendar-prev-month ms-4">chevron_left</span>
                                <span class="material-symbols-outlined calendar-next-month">chevron_right</span>
                                <span class="material-symbols-outlined data-fullscreen">fullscreen</span>
                                <span class="material-symbols-outlined data-fullscreen d-none">fullscreen_exit</span>
                            </div>
                        </div>

                        </div>
                    </div>

                    <div class="box-data">
                        <div class="table-container">
                            <table class="table-data">
                                <thead>
                                    <tr>
                                        <th>Employee</th>
                                        <th>
                                            <div>Salary</div>
                                            <div class="fs-10 fw-normal white-space-nowrap">
                                                Take Home Pay
                                            </div>

                                        </th>
                                        <th>
                                            <div class="white-space-nowrap">Hari Bln</div>
                                            <div class="">
                                                <span class="calendar-month fs-10 fw-normal white-space-nowrap">{{ date('F') }}</span>
                                            </div>
                                        </th>

                                        <th>
                                            <div class="white-space-nowrap">Hari Kerja</div>
                                            <span class="calendar-month fs-10 fw-normal white-space-nowrap">{{ date('F') }}</span>
                                        </th>

                                        <th>
                                            <div class="white-space-nowrap">Hari UM</div>
                                            <span class="calendar-month fs-10 fw-normal white-space-nowrap">{{ date('F') }}</span>
                                        </th>

                                        <th>
                                            <div class="white-space-nowrap">Gaji Pokok</div>
                                        </th>

                                        <th>
                                            <div class="white-space-nowrap">Uang Makan</div>
                                        </th>

                                        <th>
                                            <div class="white-space-nowrap">Transportasi</div>
                                        </th>

                                        

                                        <th>
                                            <div class="white-space-nowrap">Pulsa &amp; Internet</div>
                                        </th>

                                        <th>
                                            <div class="white-space-nowrap">Jabatan</div>
                                        </th>

                                        <th>
                                            <div>Bonus</div>
                                        </th>                                       

                                        <th>
                                            <div>Lembur</div>
                                        </th>

                                        <th>
                                            <div>THR</div>
                                        </th>

                                        <th>
                                            <div>Potongan</div>
                                        </th>

                                    </tr>
                                </thead>
                                <tbody>

                                    <style>
                                        

                                        /* Show the checkmark when checked */
                                        .employee-photo input:checked ~ .checkmark {
                                            display: block;
                                        }

                                        .employee-photo .checkmark{
                                            position: absolute;
                                            top: 0;
                                            left: 0;
                                            width: 100%;
                                            height: 100%;
                                        }

                                    </style>
                                    @foreach ($employee as $itemEmployee)
                                        
                                        <tr class="employee-row basic-row" data-employee-name="{{ $itemEmployee->name }}" data-employee-photo="{{ asset($itemEmployee->photo) }}"  data-employee-id="{{ $itemEmployee->id }}" data-division="{{ $itemEmployee->division_id }}" data-department="{{ $itemEmployee->department_id }}"  >
                                            <td rowspan="2">
                                                <div class="box-employee">
                                                    <div class="d-flex align-items-center">
                                                        <div class="col-photo">
                                                            <label class="employee-photo">
                                                                <img src="{{ asset($itemEmployee->photo) }}" class="rounded-circle w-100 h-100 object-fit-cover" alt="">
                                                                <div class="checkmark"></div>
                                                                <input type="checkbox" class="d-none employee-item" id="employee-{{ asset($itemEmployee->id) }}" data-employee-id="{{ $itemEmployee->id }}">
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
                                                <div class="fs-8 text-center d-none">
                                                    Payslip terkirim
                                                </div>
                                            </td>
                                            <td class="hari-bln p-1"></td>
                                            <td class="hari-kerja p-1"></td>
                                            <td class="hari-um p-1"></td>
                                            <td class="gaji-pokok p-1"></td>
                                            <td class="uang-makan p-1"></td>
                                            <td class="transportasi p-1"></td>
                                            <td class="pulsa-internet p-1"></td>
                                            <td class="jabatan p-1"></td>
                                            <td class="bonus p-1">0</td>
                                            <td class="lembur p-1">0</td>
                                            <td class="thr p-1">0</td>
                                            <td class="potongan p-1">0</td>
                                        </tr>

                                        <tr class="employee-row set-row" data-employee-name="{{ $itemEmployee->name }}" data-employee-photo="{{ asset($itemEmployee->photo) }}"  data-employee-id="{{ $itemEmployee->id }}" data-division="{{ $itemEmployee->division_id }}" data-department="{{ $itemEmployee->department_id }}"  >
                                            
                                            <td colspan="3" class="text-center z-0">

                                                <div class="">
                                                    <div class="d-flex align-items-center justify-content-between ">
                                                        <div class=" w-100">
                                                            Perhitungan
                                                        </div>
                                                        <div>
                                                            <div class="d-flex">
                                                                
                                                                <div>
                                                                    <div class="btn-icon send d-none" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Send to employee">
                                                                        <span class="material-symbols-outlined icon-action">upload_2</span>
                                                                    </div>
                                                                </div>
                                                                
                                                                <div>
                                                                    <div class="btn-icon payslip d-none" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Payslip">
                                                                        <span class="material-symbols-outlined icon-action">docs</span>
                                                                    </div>
                                                                </div>
                                                                
                                                                <div>   
                                                                    <div class="btn-icon edit-data" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Edit">
                                                                        <span class="material-symbols-outlined icon-action">edit</span>
                                                                    </div>
                                                                </div>
                                                                
                                                                
                                                            </div>
                                                            
                                                            
                                                        </div>


                                                    </div>
                                                </div>
                                            </td>
                                            <td class="gaji-pokok p-1"></td>
                                            <td class="uang-makan p-1"></td>
                                            <td class="transportasi p-1"></td>
                                            <td class="pulsa-internet p-1"></td>
                                            <td class="jabatan p-1"></td>
                                            <td class="bonus p-1">0</td>
                                            <td class="lembur p-1">0</td>
                                            <td class="thr p-1">0</td>
                                            <td class="potongan p-1">0</td>
                                        </tr>

                                    @endforeach
                                    
                                    
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="box-loader z-3 rounded-4 bg-body bg-opacity-25 position-absolute top-0 start-0 w-100 h-100">

                        <div class="w-100 h-100 d-flex justify-content-center align-items-center">
                            <div>
                                <div class="spinner-border opacity-50" style="width: 2.5rem; height: 2.5rem;" role="status">
                                    <span class="visually-hidden">Loading...</span>
                                </div>
                                <div class="fs-10">Loading...</div>
                            </div>
                            
                        </div>
                        
                    </div>
                </div>

            </di>


        </div>
    </div>
 
    

    <x-slot name="body_end_slot"> 
        
        <!-- Modal Edit -->
        <div class="modal fade scrollbar-transparent" id="modalSalaryEdit" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="modalAttendanceEditLabel" aria-hidden="true">
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
                                        <div class="fw-light fs-24">Salary</div>
                                        <span class="fw-normal fs-14 calendar-month">{{ date('F') }}</span>
                                        <span class="fw-normal fs-14 calendar-year">{{ date('Y') }}</span>
                                </div>
                                <div class="mb-4 text-center">
                                    <span class="fw-normal fs-14 text-secondary attendance-date"></span>
                                </div>

                                <div class="mb-3 pb-2 border-bottom border-3">

                                    <div class="d-flex mb-2 justify-content-between align-items-center w-100">
                                        <div>
                                            <div class="fs-14 text-secondary fw-normal">Employee</div>
                                        </div>
                                        <div>
                                            <div class="employee-name fw-medium fs-14"></div>
                                        </div>
                                    </div>
                                    
                                    <div class="mb-2">
                                        <div class="d-flex justify-content-between align-items-center w-100">
                                            <div>
                                                <div class="fs-14 text-secondary fw-normal">Division</div>
                                            </div>
                                            <div>
                                                <div class="employee-division fs-14 fw-normal"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="mb-2">
                                        <div class="d-flex justify-content-between align-items-start w-100">
                                            <div>
                                                <div class="fs-14 text-secondary fw-normal">Salary</div>
                                                <div class="fs-8 text-secondary fw-normal">(Take Home Pay)</div>
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
                                                Hari Aktif
                                            </label>
                                            <input type="number" class="form-control  border-0 fs-14" name="active_day" id="active_day">
                                        </div>
                                        <div class="col-4">
                                            <label for="working_day" class="fs-14 text-secondary fw-normal">
                                                Hari Kerja
                                            </label>
                                            <span class="fs-12 ms-2 info_working_day" data-bs-toggle="tooltip" data-bs-html="true" data-bs-placement="top" data-bs-title="0">
                                                <i class="bi bi-info-circle"></i>
                                            </span>
                                            <input type="number" class="form-control  border-0 fs-14" name="working_day" id="working_day">
                                        </div>
                                        <div class="col-4">
                                            <label for="meal_day" class="fs-14 text-secondary fw-normal">
                                                Hari UM
                                            </label>
                                            <input type="number" class="form-control  border-0 fs-14" name="meal_day" id="meal_day">
                                        </div>
                                    </div>
                                    
                                </div>

                                <div class="mb-3">

                                    <div class="row">
                                        <div class="col-6">
                                            <label for="basic_salary" class="fs-14 text-secondary fw-normal">
                                                Gaji Pokok
                                            </label>

                                            <span class="fs-12 ms-2 info_basic_salary" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="0">
                                                <i class="bi bi-info-circle"></i>
                                            </span>
                                            
                                            <input type="number" class="form-control border-0 fs-14" name="basic_salary" id="basic_salary">
                                        </div>
                                        
                                        <div class="col-6">
                                            <label for="basic_salary" class="fs-14 text-secondary fw-normal">
                                                Absensi Tidak Lengkap 
                                                <span class="jumlah_absensi_tidak_lengkap"></span>
                                            </label>
                                            
                                            <div class="">
                                                <span class="hitungan_absensi_tidak_lengkap fs-14"></span>
                                                <span class="fs-12 ms-2 info_absensi_tidak_lengkap" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="hari * 50.000">
                                                <i class="bi bi-info-circle"></i>
                                            </span>
                                            </div>
                                        </div>
                                        
                                        
                                    </div>
                                    
                                </div>
                                

                                <div class="mb-3">

                                    <div class="row">
                                        <div class="col-6">
                                            <label for="positional_allowance" class="fs-14 text-secondary fw-normal">
                                                Tunjangan Jabatan
                                            </label>

                                            <span class="fs-12 ms-2 info_positional_allowance" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="0">
                                                <i class="bi bi-info-circle"></i>
                                            </span>

                                            <input type="number" class="form-control border-0 fs-14" name="positional_allowance" id="positional_allowance">
                                        </div>

                                        <div class="col-6">
                                            <label for="meal_allowance" class="fs-14 text-secondary fw-normal">
                                                Uang Makan
                                            </label>

                                            <span class="fs-12 ms-2 info_meal_allowance" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="0">
                                                <i class="bi bi-info-circle"></i>
                                            </span>

                                            <input type="number" class="form-control border-0 fs-14" name="meal_allowance" id="meal_allowance">
                                        </div>
                                        
                                    </div>
                                    
                                </div>

                                <div class="mb-3">

                                    <div class="row">
                                        
                                        <div class="col-6">
                                            <label for="transportation_allowance" class="fs-14 text-secondary fw-normal">
                                                Transportasi
                                            </label>
                                            <span class="fs-12 ms-2 info_transportation_allowance" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="0">
                                                <i class="bi bi-info-circle"></i>
                                            </span>
                                            <input type="number" class="form-control border-0 fs-14" name="transportation_allowance" id="transportation_allowance">
                                        </div>

                                        <div class="col-6">
                                            <label for="internet_phone_allowance" class="fs-14 text-secondary fw-normal">
                                                Pulsa dan Internet
                                            </label>
                                            <span class="fs-12 ms-2 info_internet_phone_allowance" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="0">
                                                <i class="bi bi-info-circle"></i>
                                            </span>
                                            <input type="number" class="form-control border-0 fs-14" name="internet_phone_allowance" id="internet_phone_allowance">
                                        </div>
                                        
                                    </div>
                                    
                                </div>
                                
                                <div class="mb-3">

                                    <div class="row mb-3">
                                        <div class="col-6">
                                            <label for="bonus" class="fs-14 text-secondary fw-normal">
                                                Bonus
                                            </label>
                                            <input type="number" class="form-control border-0 fs-14" name="bonus" id="bonus">
                                        </div>
                                        
                                        <div class="col-6">
                                            <label for="overtime" class="fs-14 text-secondary fw-normal">
                                                Lembur
                                            </label>
                                            <input type="number" class="form-control border-0 fs-14" name="overtime" id="overtime">
                                        </div>
                                    </div>

                                    <div class="row">
                                        <div class="col-6">
                                            <label for="thr" class="fs-14 text-secondary fw-normal">
                                                THR
                                            </label>
                                            <input type="number" class="form-control border-0 fs-14" name="thr" id="thr" value="0">
                                        </div>
                                        
                                    </div>
                                    
                                </div>

                            </div>
                            
                            <div class="p-4 pt-2">
                                <div class="row">
                                    <div class="col-6">
                                        <div class="btn btn-default-modal border-0 w-100 p-2 btn-close-modal-edit">Cancel</div>
                                    </div>
                                    <div class="col-6">
                                        <div class="btn btn-default-dark-modal border-0 w-100 p-2 btn-save-salary">Save</div>
                                    </div>
                                </div>
                            </div>

                            
                        </form>

                        <div class="box-loader z-3 rounded-4 bg-body bg-opacity-25 position-absolute top-0 start-0 w-100 h-100">

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
        <script src="{{ asset('asset/js/date_helper.js')}}?v={{ time() }}"></script>
        <script src="{{ asset('asset/js/salary_payslip.js')}}?v={{ time() }}"></script>
    </x-slot>

</x-office-layout>
