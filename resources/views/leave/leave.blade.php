<x-office-layout>
    <x-slot name="menu_active">
        {{ __('leave') }}
    </x-slot>
    <x-slot name="head_stitle_slot">
        {{ __('Leave') }}
    </x-slot>
    <x-slot name="head_slot">
        <link href="{{ asset('asset/css/leave.css')}}?v={{ time() }}" rel="stylesheet">
    </x-slot>

    <div class="title-content">
        <div class="row">
            <div class="col-12 col-md-9">
                <h2 class="text-title-content mb-3" >Leave</h2>
            </div>
            <div class="col-12 col-md-3">
                
            </div>
        </div>
       
        
    </div>

    <div class="leave-container">
        <div class="row">

            <di class="col-12 col-md-6 col-leave-request mb-4 p-0"> 

                <div class="card-content">

                    <div class="header-leave">

                        <div class="d-flex align-items-center">
                            <div class="w-100">
                                <div class="fs-14 p-2">Leave Request</div>
                            </div>
                            <div class="me-2">
                                <input type="text" class="input-search-query-request w-100 me-2">
                            </div>
                            <div class="box-view-control white-space-nowrap" >
                                <span class="material-symbols-outlined data-fullscreen-request">fullscreen</span>
                                <span class="material-symbols-outlined data-fullscreen-request d-none">fullscreen_exit</span>
                            </div>
                        </div>
                    </div>

                    <div class="box-data p-4">
                        
                    </div>

                </div>

            </di>

            <di class="col-12 col-md-6 col-leave mb-4"> 

                <div class="card-content overflow-hidden">
                    <div class="header-leave">

                        <div class="d-flex align-items-center">
                            <div class="year w-100">

                                <div class="dropdown dropdown-year"> 
                                    <div class="dropdown-toggle btn btn-dropdown-year ps-0" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                        
                                        <div class="d-inline-flex align-items-center">
                                            <span class="text-year">{{ date('Y') }}</span>
                                        </div>

                                    </div>

                                    <ul class="dropdown-menu border-0 shadow-sm bg-default-1 rounded-3">

                                        @for ($yearNum = (date('Y')-3); $yearNum <= (date('Y')); $yearNum++) 
                                            <li data-year="{{ $yearNum }}" class="dropdown-item year-item fs-14">
                                                <div class="dropdown-item fs-14">{{$yearNum}}</div>
                                            </li>    
                                        @endfor
                                        
                                    </ul>
                                </div>

                                
                            </div>
                            <div class="me-2">
                                <input type="text" class="input-search-query w-100 me-2">
                            </div>
                            <div class="box-view-control white-space-nowrap" >
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
                                        <th>Annual Leave</th>
                                        <th>Use Annual Leave</th>
                                        <th class="border-end-0">Sick</th>
                                        <th class="border-start-0"></th>
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

                                            <td class="col-annual-leave">
                                            </td>
                                            <td class="col-use-annual-leave">
                                            </td>

                                            <td class="col-sick border-end-0">
                                            </td>

                                            <td class="col-action border-start-0">
                                            </td>

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
        
    </x-slot>


    <x-slot name="script_slot"> 
        <script src="{{ asset('asset/js/leave.js')}}?v={{ time() }}"></script>
    </x-slot>

</x-office-layout>
