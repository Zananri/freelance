<x-office-layout>
    <x-slot name="menu_active">
        {{ __('weekday_off') }}
    </x-slot>
    <x-slot name="head_stitle_slot">
        {{ __('Weekday Off') }}
    </x-slot>
    <x-slot name="head_slot">
        <link href="{{ asset('asset/css/weekday_off.css')}}?v{{ time() }}" rel="stylesheet">
    </x-slot>

    <div class="title-content">
        <div class="row">
            <div class="col-12 col-md-9">
                <h2 class="text-title-content mb-3" >Weekday Off</h2>
            </div>
            <div class="col-12 col-md-3">
                <div class="d-flex gap-2 justify-content-end align-items-center">
                    <div class="w-100">
                        <input type="text" class="input-search-query w-100">
                    </div>
                    <div>
                        <button class="btn btn-default-dark fs-14" id="btn-save-weekday-off" type="button">
                            Save
                        </button>
                    </div>
                </div>
                
            </div>
        </div>
       
        
    </div>

    <div class="weekday-off-container">
        <div class="row">

            <di class="col-12 col-md-12 col-weekday-off"> 

                <div class="card-content overflow-hidden position-relative">
                    <div class="header-calendar">

                        <div class="d-flex align-items-center">
                            <div class="w-100">
                                <div class="d-flex"> 
                                    <div class="col-dropdown-department" data-department-id="1">
                                        <div class="dropdown dropdown-select">
                                            <div class="dropdown-toggle btn btn-dropdown-table ps-0" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                                
                                                <div class="d-inline-flex align-items-center">
                                                    <span class="title-dropdown"></span>
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
                                                    <li data-department="0" data-division-id="0" data-division-name="All Division" class="dropdown-item division-item fs-14">
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
                            <div class="box-view-control white-space-nowrap" >
                                <span class="material-symbols-outlined data-fullscreen">fullscreen</span>
                                <span class="material-symbols-outlined data-fullscreen d-none">fullscreen_exit</span>
                            </div>
                        </div>
                    </div>

                    <div class="box-data">
                        <div class="table-container">
                            <table class="table-weekday-off">
                                <thead>
                                    <tr>
                                        <th>Employee</th>
                                        <th class="col-day" data-weekday="1">
                                            <div class="calendar-weekday">
                                                <span class="d-none d-md-inline">Monday</span>
                                                <span class="d-inline d-md-none">M</span>
                                            </div>
                                        </th>
                                        <th class="col-day" data-weekday="2">
                                            <span class="d-none d-md-inline">Tuesday</span>
                                            <span class="d-inline d-md-none">T</span>
                                        </th>
                                        <th class="col-day" data-weekday="3">
                                            <span class="d-none d-md-inline">Wednesday</span>
                                            <span class="d-inline d-md-none">W</span>
                                        </th>
                                        <th class="col-day" data-weekday="4">
                                            <span class="d-none d-md-inline">Thursday</span>
                                            <span class="d-inline d-md-none">T</span>  
                                        </th>
                                        <th class="col-day" data-weekday="5">
                                            <span class="d-none d-md-inline">FridayTuesday</span>
                                            <span class="d-inline d-md-none">F</span>
                                        </th>
                                        <th class="col-day" data-weekday="6">
                                            <span class="d-none d-md-inline">Saturday</span>
                                            <span class="d-inline d-md-none">S</span>
                                        </th>
                                        <th class="col-day" data-weekday="7">
                                            <span class="d-none d-md-inline">Sunday</span>
                                            <span class="d-inline d-md-none">S</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>

                                    @foreach ($employee as $itemEmployee)
                                            
                                        
                                        <tr class="employee-row d-none" data-employee-id="{{ $itemEmployee->id }}" data-division="{{ $itemEmployee->division_id }}"  data-department="{{ $itemEmployee->department_id }}"  >
                                            <td>
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

                                             @for ($j = 1; $j <= 7 ; $j++)

                                                @php
                                                    $dayOff = '';
                                                    $employeeWeekday = explode(',',$itemEmployee->weekday_off);
                                                    if(in_array($j, $employeeWeekday)){
                                                        $dayOff = 'day-off';
                                                    }
                                                @endphp

                                                <td class="col-day {{ $dayOff }}" data-weekday="{{ $j }}">
                                                    <div class="box-weekday">
                                                    </div>
                                                </td>
                                            @endfor
                                        </tr>

                                    @endforeach
                                    <!-- Contoh data (lebih banyak data bisa ditambahkan untuk melihat efek sticky) -->
                                    
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="loader" >
                        <div class="box-loader rounded-20" >
                            <div class="text-center">
                                <div class="spinner-border text-secondary" role="status">
                                    <span class="visually-hidden">Loading...</span>
                                </div>
                            </div>
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
                        <div class="text-center">
                                <span class="fw-light fs-24">Attendance</span>
                        </div>
                        <div class="mb-4 text-center">
                            <span class="fw-normal fs-14 text-secondary attendance-date">8 September 2025</span>
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

                        

                        

                        
                        
                        <div class="config-footer">
                            <div class="row">
                                <div class="col-12">
                                    <div class="btn btn-default-modal border-0 w-100 p-2" data-bs-dismiss="modal">Close</div>
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

                    </div> 

                </div>
            </div>
        </div>
        
 
    </x-slot>


    <x-slot name="script_slot"> 
        <script src="{{ asset('asset/js/weekday_off.js')}}?v={{ time() }}"></script>
    </x-slot>

</x-office-layout>
