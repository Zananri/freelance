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
                            <div class="month-year w-100">

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
                            <table class="table-attendance">
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
                                            <div>Hari Bln</div>
                                            <div class="">
                                                <span class="calendar-month fs-10 fw-normal white-space-nowrap">{{ date('F') }}</span>
                                            </div>
                                        </th>

                                        <th>
                                            <div class="white-space-nowrap">Hari Kerja</div>
                                        </th>

                                        <th>
                                            <div class="white-space-nowrap">Hari UM</div>
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
                                            
                                        
                                        <tr class="employee-row" data-employee-name="{{ $itemEmployee->name }}" data-employee-photo="{{ asset($itemEmployee->photo) }}"  data-employee-id="{{ $itemEmployee->id }}" data-weekday-off="{{ $itemEmployee->weekday_off }}" data-division="{{ $itemEmployee->division_id }}" data-department="{{ $itemEmployee->department_id }}"  >
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

                                            <td rowspan="2">
                                                Salary
                                            </td>
                                            <td>
                                                Hari bln
                                            </td>
                                            <td>
                                                Hari Kerja
                                            </td>
                                            <td>
                                                Hari UM
                                            </td>
                                            <td>
                                                Gaji Pokok
                                            </td>
                                            <td>
                                                Uang Makan
                                            </td>
                                            <td>
                                                Trasnportasi
                                            </td>
                                            <td>
                                                Pulsa & Internet
                                            </td>
                                            <td>
                                                Bonus
                                            </td>
                                            <td>
                                                Potongan
                                            </td>
                                            <td>
                                                Lembur
                                            </td>
                                        </tr>

                                        <tr class="employee-row" data-employee-name="{{ $itemEmployee->name }}" data-employee-photo="{{ asset($itemEmployee->photo) }}"  data-employee-id="{{ $itemEmployee->id }}" data-weekday-off="{{ $itemEmployee->weekday_off }}" data-division="{{ $itemEmployee->division_id }}" data-department="{{ $itemEmployee->department_id }}"  >
                                            
                                            <td colspan="3" class="text-center z-0">
                                                Perhitungan Gaji
                                            </td>
                                            <td>
                                                {{-- Gaji Pokok --}}
                                            </td>
                                            <td>
                                                {{-- Uang Makan --}}
                                            </td>
                                            <td>
                                                {{-- Trasnportasi --}}
                                            </td>
                                            <td>
                                                {{-- Pulsa & Internet --}}
                                            </td>
                                            <td>
                                                {{-- Bonus --}}
                                            </td>
                                            <td>
                                                {{-- Potongan --}}
                                            </td>
                                            <td>
                                                {{-- Lembur --}}
                                            </td>
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
        <div class="modal fade" id="modalAttendance" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="modalAttendanceLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">

                    <div class="modal-body p-4 position-relative">
                        <form action="" novalidate="" method="POST">
                            @csrf
                            <input type="hidden" name="employee_id" value="">
                            <input type="hidden" name="attendance_date" value="">
                            <input type="hidden" name="attendance_id" value="">
                        

                            <div class="text-center">
                                    <span class="fw-light fs-24">Attendance</span>
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
                                            <div class="fs-14 text-secondary fw-normal">Shift</div>
                                        </div>
                                        <div>
                                            <div class="employee-shift fs-14 fw-normal"></div>
                                        </div>
                                    </div>
                                </div>

                                <div class="mb-2">
                                    <div class="d-flex justify-content-between align-items-center w-100">
                                        <div>
                                            <div class="fs-14 text-secondary fw-normal">Status</div>
                                        </div>
                                        <div>
                                            <div class="attendance-status  fs-14 fw-normal"></div>
                                        </div>
                                    </div>
                                </div>


                            </div>

                            <div class="attendance-box">
                            
                                <div class="mb-2">
                                    <div class="d-flex justify-content-between align-items-center w-100">
                                        <div>
                                            <div class="fs-14 text-secondary fw-normal">Late</div>
                                        </div>
                                        <div>
                                            <div class="attendance-late  fs-14 fw-normal"></div>
                                        </div>
                                    </div>
                                </div>

                                <div class="mb-2">
                                    <div class="d-flex justify-content-between align-items-center w-100">
                                        <div>
                                            <div class="fs-14 text-secondary fw-normal">Check In</div>
                                        </div>
                                        <div>
                                            <div class="attendance-checkin  fs-14 fw-normal"></div>
                                        </div>
                                    </div>
                                </div>

                                <div class="mb-2">
                                    <div class="d-flex justify-content-between align-items-center w-100">
                                        <div>
                                            <div class="fs-14 text-secondary fw-normal">Check Out</div>
                                        </div>
                                        <div>
                                            <div class="attendance-checkout  fs-14 fw-normal"></div>
                                        </div>
                                    </div>
                                </div>

                                <div class="mb-3">
                                    <div class="d-flex justify-content-between align-items-center w-100">
                                        <div>
                                            <div class="fs-14 text-secondary fw-normal">Work Duration</div>
                                        </div>
                                        <div>
                                            <div class="attendance-work-duration  fs-14 fw-normal">00 : 00</div>
                                        </div>
                                    </div>
                                </div>

                            

                                <div class="mb-3">
                                    <div class="d-flex justify-content-between gap-3 align-items-center w-100">
                                        <div>
                                            <div class="fs-14 text-secondary fw-normal">Note</div>
                                        </div>
                                        <div>
                                            <div class="attendance-note  fs-14 fw-normal">-</div>
                                        </div>
                                    </div>
                                </div>

                            </div>

                            
                            
                            
                            
                            <div class="mt-5">
                                <div class="row">
                                    <div class="col-6">
                                        <div class="btn btn-default-modal border-0 w-100 p-2" data-bs-dismiss="modal">Close</div>
                                    </div>
                                    <div class="col-6">
                                        <div class="btn btn-default-dark-modal border-0 w-100 p-2 btn-edit-attendance">Edit</div>
                                    </div>
                                </div>
                            </div>

                            <div class="loader d-none" >
                                <div class="box-loader rounded-20" >
                                    <div class="text-center">
                                        <div class="spinner-border text-secondary" role="status">
                                            <span class="visually-hidden">Loading...</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </form>

                    </div> 

                </div>
            </div>
        </div>

        <!-- Modal Edit -->
        <div class="modal fade" id="modalAttendanceEdit" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="modalAttendanceEditLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">

                    <div class="modal-body p-4 position-relative">
                        <form id="form-edit-attendance" action="" novalidate="" method="POST">
                            @csrf
                            <input type="hidden" name="employee_id" value="">
                            <input type="hidden" name="attendance_date" value="">
                            <input type="hidden" name="attendance_id" value="">
                        

                            <div class="text-center">
                                    <span class="fw-light fs-24">Attendance</span>
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
                                            <div class="fs-14 text-secondary fw-normal">Shift</div>
                                        </div>
                                        <div>
                                            <div class="employee-shift fs-14 fw-normal"></div>
                                        </div>
                                    </div>
                                </div>

                            </div>

                            <div class="mb-2">

                                <div class="row">
                                    <div class="col-6">
                                        <label for="attendance_status" class="fs-14 text-secondary fw-normal">
                                            Status
                                        </label>
                                    </div>
                                    <div class="col-6">
                                        <select class="form-select border-0 fs-14" name="attendance_status" id="attendance_status">
                                            <option value="PRESENT">Present</option>
                                            <option value="ABSENT">Absent</option>
                                        </select>
                                    </div>
                                </div>
                                
                            </div>

                            <div class="form-block-present">

                                <div class="mb-2">

                                    <div class="row">
                                        <div class="col-6">
                                            <label for="attendance_time_in" class="fs-14 text-secondary fw-normal">
                                                Check In
                                            </label>
                                        </div>
                                        <div class="col-6">
                                            <input type="time" class="form-control  border-0 fs-14" name="attendance_time_in" id="attendance_time_in">
                                        </div>
                                    </div>
                                    
                                </div>

                                <div class="mb-2">

                                    <div class="row">
                                        <div class="col-6">
                                            <label for="attendance_time_out" class="fs-14 text-secondary fw-normal">
                                                Check Out
                                            </label>
                                        </div>
                                        <div class="col-6">
                                            <input type="time" class="form-control border-0 fs-14" name="attendance_time_out" id="attendance_time_out">
                                        </div>
                                    </div>
                                    
                                </div>

                                <div class="mb-2">

                                    <div class="row">
                                        <div class="col-12  col-md-6">
                                            <label for="attendance_note" class="fs-14 text-secondary fw-normal">
                                                Note
                                            </label>
                                        </div>
                                        <div class="col-12  col-md-6">
                                            <textarea class="form-control border-0" name="attendance_note" id="attendance_note" cols="3" rows="3"></textarea>
                                        
                                        </div>
                                    </div>
                                    
                                </div>

                            </div>
                            
                            <div class="mt-5">
                                <div class="row">
                                    <div class="col-6">
                                        <div class="btn btn-default-modal border-0 w-100 p-2 btn-close-modal-edit">Cancel</div>
                                    </div>
                                    <div class="col-6">
                                        <div class="btn btn-default-dark-modal border-0 w-100 p-2 btn-submit-attendance">Submit</div>
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
        <!-- Modal Edit -->
        <div class="modal fade" id="modalLeave" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="modalLeaveLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">

                    <div class="modal-body p-4 position-relative">
                        
                        <div class="box-data-leave"></div>

                        <div class="mt-5">
                            <div class="row">
                                <div class="col-12">
                                    <div class="btn btn-default-modal border-0 w-100 p-2 btn-close-modal-leave">Close</div>
                                </div>
                            </div>
                        </div>



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
