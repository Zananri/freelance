<x-office-layout>
    <x-slot name="menu_active">
        {{ __('overtime') }}
    </x-slot>
    <x-slot name="head_stitle_slot">
        {{ __('Overtime') }}
    </x-slot>
    <x-slot name="head_slot">
        <link href="{{ asset('asset/css/overtime.css')}}?v={{ time() }}" rel="stylesheet">
    </x-slot>

    <div class="title-content">
        <div class="row">
            <div class="col-12 col-md-9">
                <h2 class="text-title-content mb-3" >Overtime</h2>
            </div>
            <div class="col-12 col-md-3">
                
            </div>
        </div>
       
        
    </div>

    <div class="overtime-container">
        <div class="row">

            <div class="col-12 col-md-6 col-overtime-request mb-4 p-0"> 

                <div class="card-content">

                    <div class="header-leave">

                        <div class="d-flex align-items-center">
                            <div class="w-100">
                                <div class="fs-16 p-2 ps-4">Overtime Request</div>
                            </div>
                            <div class="me-3">
                                <input type="text" class="input-search-overtime-request w-100">
                            </div>
                            
                        </div>
                    </div>

                    <div class="box-data p-4 pt-0 scrollbar-transparent">
                                              
                    </div>

                </div>

            </div>

            <div class="col-12 col-md-6 col-leave mb-4"> 

                <div class="card-content">
                    <div class="header-leave">

                        <div class="d-flex align-items-center">
                            <div class="year w-100">

                                <div class="dropdown dropdown-year"> 
                                    <div class="dropdown-toggle btn btn-dropdown-year ps-0" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                        
                                        <div class="d-inline-flex align-items-center">
                                            <span class="text-month ms-2" data-month="{{ date('M') }}">{{ date('F') }}</span> <span class="text-year">{{ date('Y') }}</span>
                                        </div>

                                    </div>

                                    <ul class="dropdown-menu border-0 shadow-sm bg-default-1 rounded-3">

                                        @for ($i = 1; $i < 12; $i++)
                                            <li data-month="{{ $i }}" data-year="{{ date('Y') }}" class="dropdown-item month-item fs-14">
                                                <div class="dropdown-item fs-14">{{ date('F', mktime(0, 0, 0, $i, 1))}}</div>
                                            </li> 
                                        @endfor
                                        
                                    </ul>

                                </div>

                                
                            </div>
                            <div class="me-2">
                                <input type="text" class="input-search-total-overtime w-100 me-2">
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
                                        <th>Total Days</th>
                                        <th>Total Hours</th>
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

                                                <div class="box-action h-100 top-0 end-0 position-absolute">
                                                    <div class="d-flex h-100 flex-column justify-content-center align-items-center">
                                                        <div>
                                                            <span class="material-symbols-outlined fill fs-14 px-2">visibility</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td class="text-center position-relative">
                                                <span class="col-total-days"></span>
                                                
                                            </td>
                                            <td class="col-total-hours  text-center">
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
        
        <!-- Modal Approve Overtime -->
        <div class="modal fade" id="overtimeApproveModal" tabindex="-1" role="dialog" aria-labelledby="overtimeApproveModalLabel" aria-hidden="true"  data-bs-backdrop="static" data-bs-keyboard="false">
            <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content rounded-4 border-0">
                    
                    <div class="modal-header border-0 py-4 pt-3">
                        <h5 class="modal-title fs-18 fw-light">Approve Overtime</h5>
                    </div>

                    <div class="modal-body p-0 border-0 ">


                        <div class="wrapper-form px-4 scrollbar-transparent">

                            <form action="" id="form-approve-overtime" class="needs-validation" novalidate enctype="multipart/form-data"  >

                                @csrf

                                <input type="hidden" name="overtime_id" value="">
                                <input type="hidden" name="employee_id" value="">

                                
                                <div class="mb-3">

                                    <div class="item-overtime mb-3" data-overtime="6">
                                        <div class="item-header mb-2">
                                            <div class="mb-0">
                                                <div class="d-flex align-items-center justify-content-between">
                                                    <div class="col-employee">
                                                        <div class="box-employee">
                                                            <div class="d-flex align-items-center">
                                                                <div class="col-photo">
                                                                    <div class="employee-photo">
                                                                        <img src="" class="img-employee-photo rounded-circle w-100 h-100 object-fit-cover" alt="">
                                                                    </div>
                                                                </div>
                                                                <div class="col-name w-100">
                                                                    <div class="employee-name"></div>
                                                                    <div class="item-date"></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="col-time-overtime">
                                                        <div class="total-overtime"></div>
                                                        <div class="item-hour-range"></div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div class="h-line my-2"></div>
                                            
                                            <div class="mb-3">
                                                <div class="d-flex align-items-start justify-content-between gap-3">
                                                    <div class="col-desciption w-100">
                                                        <div class="item-description"></div>
                                                    </div>
                                                    <div class="col-status">
                                                        <div class="item-status"></div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                        </div>
                                        <div class="item-footer ">
                                            <div class="row mb-2">

                                                <div class="col-6 col-photo-start">
                                                    <div>
                                                        <div class="ratio ratio-1x1">
                                                            <img src="" class="rounded-2 photo-start object-fit-cover" alt="">
                                                        </div>
                                                    </div>
                                                </div>

                                                <div class="col-6 col-photo-end d-none">
                                                    <div>
                                                        <div class="ratio ratio-1x1">
                                                            <img src="" class="rounded-2 photo-end object-fit-cover" alt="">
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                        </div>
                                    </div>
                                    
                                </div>

                                <div class="mb-3">
                                    <label for="overtime-description-start" class="form-label fs-14">Note</label>
                                    <textarea class="form-control" name="note" id="overtime-description-start" rows="3" attr-validation="required"></textarea>
                                    <div class="invalid-feedback fs-12">Please input a description</div>
                                </div>

                            </form>

                        </div>

                        <div class="p-4">

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
                                <div class="spinner-border" style="width: 3rem; height: 3rem;" role="status">
                                    <span class="visually-hidden">Loading...</span>
                                </div>
                                <div class="fs-14">Loading...</div>
                            </div>
                            
                        </div>
                        
                    </div> 

                    <div class="box-img-view z-3 rounded-4 position-absolute top-0 start-0 w-100 h-100 overflow-hidden">
                        <img src="" alt="" class="img-viewer z-3  position-absolute top-0 start-0 w-100 h-100 ">
                        
                        <div class="z-3  position-absolute bottom-0 start-0 w-100 ">
                            <div class="text-center pb-3">
                                <div class="btn btn-close-img-viewer w-50">
                                    Close
                                </div>
                            </div>
                        </div>
                        
                        
                    </div>

                </div>
            </div>
        </div>

        <!-- Modal Reject Overtime -->
        <div class="modal fade" id="overtimeRejectModal" tabindex="-1" role="dialog" aria-labelledby="overtimeRejectModalLabel" aria-hidden="true"  data-bs-backdrop="static" data-bs-keyboard="false">
            <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content rounded-4 border-0">
                    
                    <div class="modal-header border-0 py-4 pt-3">
                        <h5 class="modal-title fs-18 fw-light">Reject Overtime</h5>
                    </div>

                    <div class="modal-body p-0 border-0 ">


                        <div class="wrapper-form px-4 scrollbar-transparent">

                            <form action="" id="form-reject-overtime" class="needs-validation" novalidate enctype="multipart/form-data"  >

                                @csrf

                                <input type="hidden" name="overtime_id" value="">
                                <input type="hidden" name="employee_id" value="">

                                
                                <div class="mb-3">

                                    <div class="item-overtime mb-3" data-overtime="6">
                                        <div class="item-header mb-2">
                                            <div class="mb-0">
                                                <div class="d-flex align-items-center justify-content-between">
                                                    <div class="col-employee">
                                                        <div class="box-employee">
                                                            <div class="d-flex align-items-center">
                                                                <div class="col-photo">
                                                                    <div class="employee-photo">
                                                                        <img src="" class="img-employee-photo rounded-circle w-100 h-100 object-fit-cover" alt="">
                                                                    </div>
                                                                </div>
                                                                <div class="col-name w-100">
                                                                    <div class="employee-name">
                                                                    </div>
                                                                    <div class="item-date">
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="col-time-overtime">
                                                        <div class="total-overtime"></div>
                                                        <div class="item-hour-range"></div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div class="h-line my-2"></div>
                                            
                                            <div class="mb-3">
                                                <div class="d-flex align-items-start justify-content-between gap-3">
                                                    <div class="col-desciption w-100">
                                                        <div class="item-description"></div>
                                                    </div>
                                                    <div class="col-status">
                                                        <div class="item-status"></div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                        </div>
                                        <div class="item-footer ">
                                            <div class="row mb-2">

                                                <div class="col-6 col-photo-start">
                                                    <div>
                                                        <div class="ratio ratio-1x1">
                                                            <img src="" class="rounded-2 photo-start object-fit-cover" alt="">
                                                        </div>
                                                    </div>
                                                </div>

                                                <div class="col-6 col-photo-end d-none">
                                                    <div>
                                                        <div class="ratio ratio-1x1">
                                                            <img src="" class="rounded-2 photo-end object-fit-cover" alt="">
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                        </div>
                                    </div>
                                    
                                </div>

                                <div class="mb-3">
                                    <label for="overtime-description-start" class="form-label fs-14">Note</label>
                                    <textarea class="form-control" name="note" id="overtime-description-start" rows="3" attr-validation="required"></textarea>
                                    <div class="invalid-feedback fs-12">Please input a description</div>
                                </div>

                                <div class="mb-3">
                                    <p class="fs-14">
                                        Are You sure to reject this overtime request ?
                                    </p>
                                </div>

                            </form>

                        </div>

                        <div class="p-4">

                            <div class="row">
                                <div class="col-6">
                                    <button type="button" class="btn btn-close-modal w-100">Cancel</button>
                                </div>
                                <div class="col-6">
                                    <button type="button" class="btn btn-submit-modal w-100" >Reject</button>
                                </div>
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

                    <div class="box-img-view z-3 rounded-4 position-absolute top-0 start-0 w-100 h-100 overflow-hidden">
                        <img src="" alt="" class="img-viewer z-3  position-absolute top-0 start-0 w-100 h-100 ">
                        
                        <div class="z-3  position-absolute bottom-0 start-0 w-100 ">
                            <div class="text-center pb-3">
                                <div class="btn btn-close-img-viewer w-50">
                                    Close
                                </div>
                            </div>
                        </div>
                        
                        
                    </div>

                </div>
            </div>
        </div>

        <!-- Modal Photo Overtime -->
        <div class="modal fade" id="overtimePhotoModal" tabindex="-1" role="dialog" aria-labelledby="overtimePhotoModalLabel" aria-hidden="true"  data-bs-backdrop="static" data-bs-keyboard="false">
            <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content rounded-4 border-0">
                    
                    <div class="modal-body p-0 border-0 bg-transparent ">
                        <div>
                            <div class="ratio ratio-3x4">
                                <img src="" alt="" class="img-viewer z-3 w-100 rounded-4">
                            </div>
                        </div>
                        
                        
                        <div class="z-3  position-absolute bottom-0 start-0 w-100 ">
                            <div class="text-center pb-3">
                                <div class="btn btn-close-img-viewer w-50">
                                    Close
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
        <script src="{{ asset('asset/js/overtime.js')}}?v={{ time() }}"></script>
    </x-slot>

</x-office-layout>
