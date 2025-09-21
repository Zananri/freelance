<x-office-layout>
    <x-slot name="menu_active">
        {{ __('attendance_tracking') }}
    </x-slot>
    <x-slot name="head_stitle_slot">
        {{ __('Attendance Tracking') }}
    </x-slot>
    <x-slot name="head_slot">
        <link href="{{ asset('asset/css/attendance_tracking.css?v'.time()) }}" rel="stylesheet">
    </x-slot>

    <div class="title-content">
        <div class="row">
            <div class="col-12 col-md-9">
                <h2 class="text-title-content mb-3" >Attendance Tracking</h2>
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

                <div class="card-content overflow-hidden">
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
                                        @for ($i = 1; $i <= 31 ; $i++)
                                            <th class="col-day" data-day="{{ $i }}">
                                                
                                                <div>{{ $i }}</div>
                                                <div class="calendar-month-short">{{ date('M') }}</div>
                                            </th>
                                        @endfor
                                    </tr>
                                </thead>
                                <tbody>

                                    @foreach ($employee as $itemEmployee)
                                            
                                        
                                        <tr class="employee-row" data-employee-id="{{ $itemEmployee->id }}" data-division="{{ $itemEmployee->division_id }}" data-department="{{ $itemEmployee->department_id }}"  >
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

                                             @for ($j = 1; $j <= 31 ; $j++)
                                                <td class="col-day" data-day="{{ $j }}">
                                                    <div class="box-attendance">
                                                        <div class="box-time d-flex h-100 w-100 align-items-center justify-content-center">
                                                            <div>
                                                                <div class="time-in"></div>
                                                                <div class="time-out"></div>
                                                            </div>
                                                        </div>
                                                        
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
        

        <style>
            .wrapper-export-data{
                position: absolute;
                top:150px;
                left: 0px;
                width: 100%;
                height: calc(100vh - 170px);
                z-index: 1000;
            }

            .table-export-container{
                width: 100%;
                height: 100%;
                overflow: auto;
            }

            .table-export-container::-webkit-scrollbar {
                width: 5px;
                height: 5px;
                background-color: #9ca3af19;
            }

            .table-export-container::-webkit-scrollbar-thumb {
                background-color:  #9ca3af75;
                border-radius: 4px;
            }

        </style>
        <div class="wrapper-export-data p-3 bg-body rounded-4 d-none">
            <div class="table-export-container">
                <table class="table-attendance" id="table-attendance-xlsx">
                    <thead>
                        <tr>
                            <th>Employee</th>
                            @for ($i = 1; $i <= 31 ; $i++)
                                <th class="col-day" data-day="{{ $i }}">
                                    
                                    {{ $i }} <div class="calendar-month-short">{{ date('M') }}</div>
                                </th>
                            @endfor
                        </tr>
                    </thead>
                    <tbody>

                        @foreach ($employee as $itemEmployee)
                                
                            
                            <tr class="employee-row" data-employee-id="{{ $itemEmployee->id }}" data-division="{{ $itemEmployee->division_id }}" data-department="{{ $itemEmployee->department_id }}"  >
                                <td>
                                    <div class="employee-name fs-12 py-2 px-1">
                                        {{ $itemEmployee->name }}
                                    </div>
                                </td>

                                    @for ($j = 1; $j <= 31 ; $j++)
                                    <td class="col-day" data-day="{{ $j }}">
                                        <div class="box-attendance">
                                            <div class="box-time d-flex h-100 w-100 align-items-center justify-content-center">
                                                <div>
                                                    <div class="time-in"></div>
                                                    <div class="time-out"></div>
                                                </div>
                                            </div>
                                            
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
    </x-slot>


    <x-slot name="script_slot"> 
        <script src="https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js"></script>

        <script src="{{ asset('asset/js/attendance_tracking.js')}}?v={{ time() }}"></script>
    </x-slot>

</x-office-layout>
