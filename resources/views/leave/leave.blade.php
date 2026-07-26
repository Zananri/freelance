<x-office-layout>
    <x-slot name="menu_active">
        {{ 'leave' }}
    </x-slot>
    <x-slot name="head_stitle_slot">
        {{ 'Leave' }}
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
                                <div class="fs-16 p-2 ps-4">Leave Request</div>
                            </div>
                            <div class="me-3">
                                <input type="text" class="input-search-query-request w-100">
                            </div>
                            {{-- <div class="box-view-control white-space-nowrap" >
                                <span class="material-symbols-outlined data-fullscreen-request">fullscreen</span>
                                <span class="material-symbols-outlined data-fullscreen-request d-none">fullscreen_exit</span>
                            </div> --}}
                        </div>
                    </div>

                    <div class="box-data p-4 pt-0 scrollbar-transparent">
                        
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

                                        @for ($yearNum = (2025); $yearNum <= (date('Y')+2); $yearNum++) 
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
                            {{-- <div class="box-view-control white-space-nowrap" >
                                <span class="material-symbols-outlined data-fullscreen">fullscreen</span>
                                <span class="material-symbols-outlined data-fullscreen d-none">fullscreen_exit</span>
                            </div> --}}
                        </div>
                    </div>

                    <div class="box-data">
                        <div class="table-container"> 
                            <table class="table-leave-employee">
                                <thead>
                                    <tr>
                                        <th>Employee</th>
                                        <th>Annual Leave</th>
                                        <th>Use Annual Leave</th>
                                        <th>Sick</th>
                                    </tr>
                                </thead>
                                <tbody>

                                    @foreach ($employee as $itemEmployee)
                                            
                                        
                                        <tr class="employee-row" data-employee-id="{{ $itemEmployee->id }}" data-employee-name="{{ $itemEmployee->name }}" data-employee-photo="{{$itemEmployee->photo}}" data-division="{{ $itemEmployee->division_id }}" data-department="{{ $itemEmployee->department_id }}"  >
                                            
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

                                            <td class="text-center position-relative">
                                                <span class="col-annual-leave"></span>
                                                <div class="box-action h-100 top-0 end-0 position-absolute">
                                                    <div class="d-flex h-100 flex-column justify-content-center align-items-center">
                                                        <div>
                                                            <span class="material-symbols-outlined fill fs-14 px-2">edit</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td class="col-use-annual-leave  text-center">
                                            </td>

                                            <td class="col-sick text-center">
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
         
        <!-- Modal approve Leave Request -->
        <div class="modal fade" id="approveLeaveRequestModal" tabindex="-1" role="dialog" aria-labelledby="approveLeaveRequestModalLabel" aria-hidden="true"  data-bs-backdrop="static" data-bs-keyboard="false">
            <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content rounded-4 border-0">
                    
                    <div class="modal-body px-4 border-0 ">
                        
                        <div class="form-header mb-4">
                            <h5 class="modal-title fs-18 fw-light">Approve Leave Request</h5>
                        </div>

                        <div class="mb-2">
                            <form action="" id="form-approve-leave-request" class="needs-validation" novalidate >
                                @csrf

                                <input type="hidden" name="id_leave_request" value="">
                                <input type="hidden" name="id_employee" value="">

                                <div class="box-data">

                                </div>


                            </form>
                        </div>

                        <div class="mb-3 fs-14 fw-normal">
                            Are you sure to approve this leave request ?
                        </div>

                        <div class="mt-4 mb-2">

                            <div class="row">
                                <div class="col-6">
                                    <button type="button" class="btn btn-close-modal w-100">Cancel</button>
                                </div>
                                <div class="col-6">
                                    <button type="button" class="btn btn-submit-modal w-100" >Approve</button>
                                </div>
                            </div>
                            
                        </div>


                    </div>

                    <div class="box-loader z-3 rounded-4 bg-body bg-opacity-25 position-absolute top-0 start-0 w-100 h-100">

                        <div class="w-100 h-100 d-flex justify-content-center align-items-center">
                            <div>
                                <div class="spinner-border opacity-50" style="width: 3rem; height: 3rem;" role="status">
                                    <span class="visually-hidden">Loading...</span>
                                </div>
                                <div class="fs-10">Loading...</div>
                            </div>
                            
                        </div>
                        
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Modal reject Leave Request -->
        <div class="modal fade" id="rejectLeaveRequestModal" tabindex="-1" role="dialog" aria-labelledby="rejectLeaveRequestModalLabel" aria-hidden="true"  data-bs-backdrop="static" data-bs-keyboard="false">
            <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content rounded-4 border-0">
                    
                    <div class="modal-body px-4 border-0 ">
                        
                        <div class="form-header mb-4">
                            <h5 class="modal-title fs-18 fw-light">Reject Leave Request</h5>
                        </div>

                        <div class="mb-2">
                            <form action="" id="form-reject-leave-request" class="needs-validation" novalidate >
                                @csrf

                                <input type="hidden" name="id_leave_request" value="">
                                <input type="hidden" name="id_employee" value="">

                                <div class="box-data">

                                </div>

                                <div class="input-reason">
                                    <label for="reason-reject" class="form-label fs-14 fw-normal">Reject Reason</label>
                                    <textarea class="form-control" id="reason-reject" rows="3" name="reject_reason" attr-validation="required"></textarea>
                                    <div class="invalid-feedback fs-12">Please input a reason</div>
                                </div>


                            </form>
                        </div>

                        <div class="mb-3 fs-14 fw-normal">
                            Are you sure to reject this leave request ?
                        </div>

                        <div class="mt-4 mb-2">

                            <div class="row">
                                <div class="col-6">
                                    <button type="button" class="btn btn-close-modal w-100">Cancel</button>
                                </div>
                                <div class="col-6">
                                    <button type="button" class="btn btn-submit-modal  w-100" >Reject</button>
                                </div>
                            </div>
                            
                        </div>


                    </div>

                    <div class="box-loader z-3 rounded-4 bg-body bg-opacity-25 position-absolute top-0 start-0 w-100 h-100">

                        <div class="w-100 h-100 d-flex justify-content-center align-items-center">
                            <div>
                                <div class="spinner-border opacity-50" style="width: 3rem; height: 3rem;" role="status">
                                    <span class="visually-hidden">Loading...</span>
                                </div>
                                <div class="fs-10">Loading...</div>
                            </div>
                            
                        </div>
                        
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal Employee Leave Request -->
        <div class="modal fade" id="employeeLeaveModal" tabindex="-1" role="dialog" aria-labelledby="employeeLeaveModalLabel" aria-hidden="true"  data-bs-backdrop="static" data-bs-keyboard="false">
            <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content rounded-4 border-0">
                    
                    <div class="modal-body px-4 border-0 ">
                         
                        <div class="box-employee mb-3">
                            <div class="d-flex align-items-center">
                                <div class="col-photo">
                                    <div class="employee-photo">
                                        <img src="" class="rounded-circle w-100 h-100 object-fit-cover" alt="">
                                    </div>
                                </div>
                                <div class="col-name w-100">
                                    <div class="employee-name"></div>
                                </div>
                            </div>
                        </div>

                        <div class="mb-2">
                            <form action="" id="form-edit-employee-leave" class="needs-validation" novalidate >
                                @csrf

                                <input type="hidden" name="year" value="">
                                <input type="hidden" name="id_employee" value="">

                                <div class="box-data">

                                </div>

                                <div class="input-annual-leave">
                                    <label for="edit-annual-leaves" class="form-label fs-14 fw-normal">
                                        Annual Leave <strong class="year-leave"></strong>
                                    </label>
                                    <input type="number" name="annual_leave" id="edit-annual-leaves" class="form-control" min="0" attr-validation="required">
                                    <div class="invalid-feedback fs-12">Please input quota annual leave</div>
                                </div>


                            </form>
                        </div>
 

                        <div class="mt-4 mb-2">

                            <div class="row">
                                <div class="col-6">
                                    <button type="button" class="btn btn-close-modal w-100">Close</button>
                                </div>
                                <div class="col-6">
                                    <button type="button" class="btn btn-submit-modal  w-100" >Submit</button>
                                </div>
                            </div>
                            
                        </div>


                    </div>

                    <div class="box-loader z-3 rounded-4 bg-body bg-opacity-25 position-absolute top-0 start-0 w-100 h-100">

                        <div class="w-100 h-100 d-flex justify-content-center align-items-center">
                            <div>
                                <div class="spinner-border opacity-50" style="width: 3rem; height: 3rem;" role="status">
                                    <span class="visually-hidden">Loading...</span>
                                </div>
                                <div class="fs-10">Loading...</div>
                            </div>
                            
                        </div>
                        
                    </div>
                </div>
            </div>
        </div>


    </x-slot>


    <x-slot name="script_slot"> 
        <script src="{{ asset('asset/js/date_helper.js')}}?v={{ time() }}"></script>
        <script src="{{ asset('asset/js/leave.js')}}?v={{ time() }}"></script>
    </x-slot>

</x-office-layout>
