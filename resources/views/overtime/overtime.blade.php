<x-office-layout>
    <x-slot name="menu_active">
        {{ 'overtime' }}
    </x-slot>
    <x-slot name="head_stitle_slot">
        {{ 'Overtime' }}
    </x-slot>
    <x-slot name="head_slot">
        <link href="{{ asset('asset/css/overtime.css')}}?v={{ time() }}" rel="stylesheet">
    </x-slot>

    <div class="title-content">
        <div class="row">
            <div class="col-12 col-md-9">
                <h2 class="text-title-content mb-3" >{{ __('overtime.overtime') }}</h2>
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
                                <div class="fs-16 p-2 ps-4">{{ __('overtime.overtime_request') }}</div>
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

                @php
                    $monthKeys = ['', 'january', 'february', 'march', 'april', 'may_full', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
                    $currentMonthKey = $monthKeys[(int)date('n')];
                @endphp

                <div class="card-content">
                    <div class="header-leave">

                        <div class="d-flex align-items-center">
                            <div class="year w-100">

                                <div class="dropdown dropdown-year"> 
                                    <div class="dropdown-toggle btn btn-dropdown-year ps-0" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                        
                                        <div class="d-inline-flex align-items-center">
                                            <span class="text-month ms-2" data-month="{{ date('M') }}">{{ __("general.{$currentMonthKey}") }}</span> <span class="text-year">{{ date('Y') }}</span>
                                        </div>

                                    </div>

                                    <ul class="dropdown-menu border-0 shadow-sm bg-default-1 rounded-3">
                                        <li data-month="all" data-year="{{ date('Y') }}" class="dropdown-item month-item fs-14">
                                            <div class="dropdown-item fs-14">{{ __('general.all_month') }}</div>
                                        </li>
                                        @for ($i = 1; $i <= 12; $i++)
                                            <li data-month="{{ $i }}" data-year="{{ date('Y') }}" class="dropdown-item month-item fs-14">
                                                <div class="dropdown-item fs-14">{{ __("general.{$monthKeys[$i]}") }}</div>
                                            </li> 
                                        @endfor
                                        
                                    </ul>

                                </div>

                                
                            </div>
                            <div class="me-2">
                                <input type="text" class="input-search-total-overtime w-100 me-2">
                            </div>
                        </div>
                    </div>

                    <div class="box-data">
                        <div class="table-container"> 
                            <table class="table-leave-employee">
                                <thead>
                                    <tr>
                                        <th>{{ __('overtime.employee') }}</th>
                                        <th>{{ __('overtime.total_days') }}</th>
                                        <th>{{ __('overtime.total_hours') }}</th>
                                    </tr>
                                </thead>
                                <tbody id="overtime-employee-tbody">

                                </tbody>
                            </table>
                        </div>
                        <div class="d-flex justify-content-between align-items-center mt-2 px-2 flex-wrap gap-2">
                            <div class="pagination-summary" id="overtimePaginationInfo"></div>
                            <div class="pagination-controls" id="overtimePagination"></div>
                        </div>
                    </div>

                </div>

            </div>

            

        </div>
    </div>
 
    

    <x-slot name="body_end_slot"> 
        
        <!-- Modal Approve Overtime -->
        <div class="modal fade" id="overtimeApproveModal" tabindex="-1" role="dialog" aria-labelledby="overtimeApproveModalLabel" aria-hidden="true"  data-bs-backdrop="static" data-bs-keyboard="false">
            <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content rounded-4 border-0">
                    
                    <div class="modal-header border-0 py-4 pt-3">
                        <h5 class="modal-title fs-18 fw-light">{{ __('overtime.approve_overtime') }}</h5>
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
                                    <label for="overtime-description-start" class="form-label fs-14">{{ __('overtime.note') }}</label>
                                    <textarea class="form-control" name="note" id="overtime-description-start" rows="3" attr-validation="required"></textarea>
                                    <div class="invalid-feedback fs-12">{{ __('overtime.please_input_description') }}</div>
                                </div>

                            </form>

                        </div>

                        <div class="p-4">

                            <div class="row">
                                <div class="col-6">
                                    <button type="button" class="btn btn-close-modal w-100">{{ __('overtime.cancel') }}</button>
                                </div>
                                <div class="col-6">
                                    <button type="button" class="btn btn-submit-modal w-100" >{{ __('overtime.approve') }}</button>
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
                                    {{ __('overtime.close') }}
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
                        <h5 class="modal-title fs-18 fw-light">{{ __('overtime.reject_overtime') }}</h5>
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
                                    <label for="overtime-description-start" class="form-label fs-14">{{ __('overtime.note') }}</label>
                                    <textarea class="form-control" name="note" id="overtime-description-start" rows="3" attr-validation="required"></textarea>
                                    <div class="invalid-feedback fs-12">{{ __('overtime.please_input_description') }}</div>
                                </div>

                                <div class="mb-3">
                                    <p class="fs-14">
                                        {{ __('overtime.are_you_sure_reject') }}
                                    </p>
                                </div>

                            </form>

                        </div>

                        <div class="p-4">

                            <div class="row">
                                <div class="col-6">
                                    <button type="button" class="btn btn-close-modal w-100">{{ __('overtime.cancel') }}</button>
                                </div>
                                <div class="col-6">
                                    <button type="button" class="btn btn-submit-modal w-100" >{{ __('overtime.reject') }}</button>
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
                                    {{ __('overtime.close') }}
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
                                    {{ __('overtime.close') }}
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
