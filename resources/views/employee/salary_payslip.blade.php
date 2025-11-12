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

    <div class="calendar-container">
        <div class="row">

            <di class="col-12 col-md-12 col-calendar"> 

                <div class="card-content">
                    <div class="header-calendar">

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
                                            <div class="white-space-nowrap">Trasnportasi</div>
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
                                            <div>Potongan</div>
                                        </th>

                                        <th>
                                            <div>Lembur</div>
                                        </th>

                                    </tr>
                                </thead>
                                <tbody>

                                    @foreach ($employee as $itemEmployee)
                                        
                                        <tr class="employee-row basic-row" data-employee-name="{{ $itemEmployee->name }}" data-employee-photo="{{ asset($itemEmployee->photo) }}"  data-employee-id="{{ $itemEmployee->id }}" data-division="{{ $itemEmployee->division_id }}" data-department="{{ $itemEmployee->department_id }}"  >
                                            <td rowspan="2">
                                                <div class="box-employee">
                                                    <div class="d-flex align-items-center">
                                                        <div class="col-photo">
                                                            <div class="employee-photo">
                                                                <img src="{{ asset($itemEmployee->photo) }}" class="rounded-circle w-100 h-100 object-fit-cover" alt="">
                                                            </div>
                                                        </div>
                                                        <div class="col-name w-100">
                                                            <div class="employee-name">
                                                                {{ $itemEmployee->name }}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td rowspan="2" class="gaji p-1 text-center fw-medium"></td>
                                            <td class="hari-bln p-1"></td>
                                            <td class="hari-kerja p-1"></td>
                                            <td class="hari-um p-1"></td>
                                            <td class="gaji-pokok p-1"></td>
                                            <td class="uang-makan p-1"></td>
                                            <td class="transportasi p-1"></td>
                                            <td class="pulsa-internet p-1"></td>
                                            <td class="jabatan p-1"></td>
                                            <td class="bonus p-1"></td>
                                            <td class="potongan p-1"></td>
                                            <td class="lembur p-1"></td>
                                        </tr>

                                        <tr class="employee-row set-row" data-employee-name="{{ $itemEmployee->name }}" data-employee-photo="{{ asset($itemEmployee->photo) }}"  data-employee-id="{{ $itemEmployee->id }}" data-division="{{ $itemEmployee->division_id }}" data-department="{{ $itemEmployee->department_id }}"  >
                                            
                                            <td colspan="3" class="text-center z-0">
                                                <div class="text-center">
                                                    Perhitungan Gaji
                                                </div>
                                            </td>
                                            <td class="gaji-pokok p-1"></td>
                                            <td class="uang-makan p-1"></td>
                                            <td class="transportasi p-1"></td>
                                            <td class="pulsa-internet p-1"></td>
                                            <td class="jabatan p-1"></td>
                                            <td class="bonus p-1"></td>
                                            <td class="potongan p-1"></td>
                                            <td class="lembur p-1"></td>
                                        </tr>

                                    @endforeach
                                    
                                    
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>

            </di>


        </div>
    </div>
 
    

    <x-slot name="body_end_slot"> 
        
        <!-- Modal -->
        
        
    </x-slot>


    <x-slot name="script_slot"> 
        <script src="{{ asset('asset/js/date_helper.js')}}?v={{ time() }}"></script>
        <script src="{{ asset('asset/js/salary_payslip.js')}}?v={{ time() }}"></script>
    </x-slot>

</x-office-layout>
