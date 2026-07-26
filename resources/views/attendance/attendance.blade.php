<x-office-layout>
<x-slot name="menu_active">
        {{ __('attendance.attendance') }}
    </x-slot>
    <x-slot name="head_stitle_slot">
        {{ __('attendance.attendance') }}
    </x-slot>
    <x-slot name="head_slot">
        <link href="{{ asset('asset/css/attendance.css') }}?v={{ time() }}" rel="stylesheet">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="" />
    </x-slot>

    <div class="title-content">
        <h2 class="text-title-content">{{ __('attendance.attendance') }}</h2>
        <input type="hidden" name="employee_id" value="{{ $employee->id }}">
        <input type="hidden" name="employee_office" value="{{$office->location}}">
                               
        @php
            $profilePicture = $employee->profile_picture;

            if (!$profilePicture) {
                $profilePicture = asset('asset/img/avatar.png');
            }
            
            $shiftTime = substr($employee->shift->time_start, 0, 5).' - '.substr($employee->shift->time_end, 0, 5);

            if($employeeShift){
                $shiftTime = substr($employeeShift->shift->time_start, 0, 5).' - '.substr($employeeShift->shift->time_end, 0, 5);
            }
        @endphp
    </div>

    <div class="attendance-wrapper">
        <div class="row">
            <div class="col-md-4 mb-3">
                <div class="employee-attendance rounded-4 bg-card-1 p-4 mb-3">

                    <div class="employee-name-shift mb-3">
                        <div class="d-flex align-items-center">
                            <div class="employee-photo">
                                <div class="box-employee-photo" >
                                    <div class="ratio ratio-1x1">
                                        <img src="{{ $profilePicture }}" class="object-fit-cover w-100 h-100 rounded-circle" alt="">
                                    </div>
                                </div>
                            </div>
                            <div class="name-and-shift w-100">
                                <div class="ps-3">
                                    <div class="employee-name mb-1">
                                        <span class="fs-16 text-body">{{ $employee->name }}</span>
                                    </div>
                                    <div class="employee-shift">
                                        <div class="d-flex justify-content-between align-items-top">
                                            <div class="date-and-shift fs-12 text-secondary">
                                                <div>
                                                    <span>{{ $timeStart }} - {{ $timeEnd }}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                            </div>
                        </div>
                    </div>

                    <div class="attendance-log">
                        <div class="attendance-log-title mb-2">
                            <div class="d-flex align-items-center justify-content-between">
                                <div>
                                    <span class="fs-14 text-body">{{ __('attendance.attendance_log') }}</span>
                                </div>
                                <div>
                                    <span class="fs-14 text-body">{{$todayDate}}</span>
                                </div>
                            </div>
                            
                        </div>
                        <div class="attendance-log-detail">
                            <div class="row-checkin mb-1">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <div class="fs-12 text-secondary">{{ __('general.check_in') }} </div>
                                    </div>
                                    <div>
                                        <div class="d-flex align-items-center time-log time-in {{ $isLate }}">
                                            @if ($timeIn)
                                                <div class="text-time-in">{{ $timeIn }}</div>
                                                <div class="material-symbols-outlined rounded-1" >chevron_right</div>
                                            @endif
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="row-checkout">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <div class="fs-12 text-secondary">{{ __('general.check_out') }} </div>
                                    </div>
                                    <div>
                                        <div class="d-flex align-items-center time-log time-out">
                                            @if ($timeOut)
                                                <span class="text-time-out">{{ $timeOut }}</span>
                                                <span class="material-symbols-outlined rounded-1" >chevron_right</span>
                                            @endif
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
 

                <div class="employee-time-off-overtime rounded-4 bg-card-1 p-4 pe-0">
                    <div class="d-flex">
                        <div>
                            <div class="box-off-time" data-bs-toggle="modal" data-bs-target="#timeOffModal">
                                <div class="d-flex h-100 flex-column justify-content-center align-items-center">
                                    <div>
                                        <div class="icon-off-time">
                                            <span class="material-symbols-outlined">free_cancellation</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div class="text-off-time">
                                            {{ __('attendance.time_off') }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div>
                            <div class="box-overtime" data-bs-toggle="modal" data-bs-target="#overtimeModal">
                                <div class="d-flex h-100 flex-column justify-content-center align-items-center">
                                    <div>
                                        <div class="icon-off-time">
                                            <span class="material-symbols-outlined">more_time</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div class="text-overtime">
                                            {{ __('attendance.overtime') }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-md-8 mb-5 pb-5">
                <div class="calendar-attendance rounded-4 bg-card-1 position-relative">

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
                            </div>
                        </div>
                    </div>

                    <div class="box-table-calendar">

                        <table class="table-calendar">
                            <thead>
                                <tr>
<th>{{ __('general.sun') }}</th>
                                    <th>{{ __('general.mon') }}</th>
                                    <th>{{ __('general.tue') }}</th>
                                    <th>{{ __('general.wed') }}</th>
                                    <th>{{ __('general.thu') }}</th>
                                    <th>{{ __('general.fri') }}</th>
                                    <th>{{ __('general.sat') }}</th>
                                </tr>
                            </thead>
                            <tbody>
                                @for ($i = 0; $i < 7; $i++)

                                    <tr>
                                        @for ($j = 0; $j < 7; $j++)
                                            <td class="text-center">
                                                </td>
                                        @endfor
                                    </tr>

                                @endfor
                            </tbody>
                        </table>

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
            </div>
        </div>
    </div>


    
    <x-slot name="body_end_slot">
 
        <!-- Modal for Check In Detail -->
        <div class="modal fade" id="checkInDetailModal" tabindex="-1" role="dialog" aria-labelledby="checkInDetailModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content rounded-4 border-0">
                    <div class="modal-header border-0 py-4">
                        <h5 class="modal-title modal-title-custom text-center w-100" id="checkInDetailModalLabel">{{ __('general.check_in') }}</h5>
                        <button type="button" class="btn-close me-2" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body px-5 border-0">

                        @php
                            $firstCheckin = $atendanceTrackingCheckin->first();
                        @endphp

                        @if ($firstCheckin)

                            <div class="mb-3">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <div class="fs-14 text-secondary">{{ __('general.date_colon') }}</div>
                                    <div class="fs-14">{{ date('l, j F Y', strtotime($firstCheckin->date_time)) }}</div>
                                </div>
                            </div>

                            <div class="mb-3">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <div class="fs-14 text-secondary">{{ __('general.time_in_colon') }}</div>
                                    <div class="fs-14">{{ date('H:i', strtotime($firstCheckin->date_time)) }}</div>
                                </div>
                            </div>

                            <div class="mb-3">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <div class="fs-14 text-secondary">{{ __('general.shift_colon') }}</div>
                                    <div class="fs-14">{{ $shiftTime }}</div>
                                </div>
                            </div>

                            <div class="mb-5 mt-5">
                                <div class="row">

                                    @php
                                        $checkinImageSrc = '';
                                        $colMap = 'col-12';

                                        if (!empty($firstCheckin->image) && isset($firstCheckin->image[0])) {
                                            $checkinImageSrc = asset($firstCheckin->image[0]);
                                            $colMap = 'col-6';
                                        }
                                    @endphp

                                    <div class="col-6 {{ $checkinImageSrc ? '' : 'd-none' }}">
                                        <div class="position-relative">
                                            <div class="ratio ratio-1x1">
                                                <div class="rounded-2">
                                                    <div class="d-flex w-100 h-100 justify-content-center align-items-center">
                                                        <img
                                                            src="{{ $checkinImageSrc }}"
                                                            class="object-fit-cover w-100 h-100 position-absolute top-0 start-0 rounded-2"
                                                            alt="">
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="{{ $colMap }}">
                                        <div class="position-relative">
                                            <div class="ratio {{ $checkinImageSrc ? 'ratio-1x1' : 'ratio-16x9' }}">
                                                <div
                                                    id="detailMapCheckIn"
                                                    class="rounded-3"
                                                    data-location='@json(
                                                        $atendanceTrackingCheckin->map(function ($item) {
                                                            return [
                                                                "location" => $item->location,
                                                                "date_time" => $item->date_time,
                                                            ];
                                                        })->values()
                                                    )'>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>

                        @else

                            <div class="p-5 text-center fs-14 text-secondary">
                                {{ __('general.no_data_check_in') }}
                            </div>

                        @endif

                        <div class="mt-5 mb-3">
                        <button type="button" class="btn btn-close-custom w-100" data-bs-dismiss="modal">
                                {{ __('general.close') }}
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>

        <!-- Modal for Check Out Detail -->
        <div class="modal fade" id="checkOutDetailModal" tabindex="-1" role="dialog" aria-labelledby="checkOutDetailModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content rounded-4 border-0">
                    <div class="modal-header border-0 py-4">
                        <h5 class="modal-title modal-title-custom text-center w-100" id="checkOutDetailModalLabel">{{ __('general.check_out') }}</h5>
                        <button type="button" class="btn-close me-2" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body px-5 border-0 ">

                        @if ($atendanceTrackingCheckout)
                            
                            <div class="mb-3">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <div class="fs-14 text-secondary">{{ __('general.date_colon') }}</div>
                                    <div class="fs-14">{{ date('l, j F Y',strtotime($atendanceTrackingCheckout->date_time)) }}</div>
                                </div>
                            </div>

                            <div class="mb-3">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <div class="fs-14 text-secondary">{{ __('general.time_out_colon') }}</div>
                                    <div class="fs-14">{{ date('H:i',strtotime($atendanceTrackingCheckout->date_time)) }}</div>
                                </div>
                            </div>

                            <div class="mb-3">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <div class="fs-14 text-secondary">{{ __('general.shift_colon') }}</div>
                                    <div class="fs-14">{{ $shiftTime }}</div>
                                </div>
                            </div>

                            <div class="mb-5 mt-5">
                                <div class="row">
                                    @php
                                        $checkoutImageSrc = '';
                                        $colMapCheckout = 'col-12';
                                        if($atendanceTrackingCheckout->image){
                                            $checkoutImageSrc = asset($atendanceTrackingCheckout->image[0]);
                                            $colMapCheckout = 'col-6';
                                        }
                                    @endphp

                                    <div class="col-6 {{ $checkoutImageSrc ? ' ' : 'd-none' }}">
                                        <div class="position-relative">
                                            <div class="ratio ratio-1x1">

                                                <div class="rounded-2">

                                                    <div class="d-flex w-100 h-100 justify-content-center align-items-center">
                                                        <img src="{{ $checkoutImageSrc }}" class="object-fit-cover w-100 h-100 position-absolute top-0 start-0 rounded-2"  alt="">
                                                    </div>

                                                </div>

                                            </div>
                                        </div>
                                    </div>

                                    <div class="{{ $colMapCheckout }} ">
                                        <div class="position-relative">
                                            <div class="ratio {{ $checkoutImageSrc ? 'ratio-1x1' : 'ratio-16x9' }} ">
                                                <div id="detailMapCheckOut" data-location="{{ $atendanceTrackingCheckout->location }}"  class="rounded-3"></div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                </div>
                                
                            </div>
                            
                        @else
<div class="p-5 text-center fs-14 text-secondary">
                                {{ __('general.no_data_check_out') }}
                            </div>
                        @endif

<div class="mt-5 mb-3">
                            <button type="button" class="btn btn-close-custom w-100" data-bs-dismiss="modal">{{ __('general.close') }}</button>
                        </div>


                    </div>
                </div>
            </div>
        </div>

        <!-- Modal for Time Off -->
        <div class="modal fade" id="timeOffModal" tabindex="-1" role="dialog" aria-labelledby="timeOffModalLabel" aria-hidden="true"  data-bs-backdrop="static" data-bs-keyboard="false">
            <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content rounded-4 border-0">
                    <div class="modal-header border-0 py-4">
<h5 class="modal-title modal-title-custom text-center w-100" id="timeOffModalLabel">{{ __('attendance.time_off') }}</h5>
                        <button type="button" class="btn-close me-2" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body px-4 border-0 ">
 
                        
                        <div class="wrapper-leave-sick mb-4">
                            <div class="d-flex align-items-start">

                                @php
                                    
                                    $remainingLeave = 0;
                                    $remainingSick = 0; 
 
                                    if($employeeLeave){
                                        $remainingLeave = $employeeLeave->remaining_annual_leave;
                                        $remainingSick = $employeeLeave->sick;
                                    }

                                @endphp
                                <div class="col-leave">
                                    <div class="box-leave">
                                        <div class="title">{{ __('attendance.leave') }}</div>
                                        <div class="day-remaining">{{ $remainingLeave }}</div>
                                        <div class="text-days-remaining">{{ __('attendance.days_remaining') }}</div>
                                    </div>
                                </div>

                                <div class="col-sick">
                                    <div class="box-sick">
                                        <div class="title">{{ __('attendance.sick') }}</div>
                                        <div class="day-remaining">{{ $remainingSick }}</div>
                                        <div class="text-days-remaining">{{ __('general.days') }}</div>
                                    </div>
                                </div>
                                

                            </div>
                        </div>
                             
  
                        
                        <div class="wrapper-data-time-off">

                            <div class="box-data scrollbar-transparent pe-1">
                                {{--                                 
                                <div class="item-time-off">
                                    <div class="item-header mb-2">
                                        <div class="mb-0">
                                            <div class="d-flex align-items-center justify-content-between">
                                                <div class="col-title">
                                                    <div class="item-title me-2">Leave</div>
                                                </div>
                                                <div class="col-day-status">
                                                    <div class="item-day">7 Day</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <div class="d-flex align-items-center justify-content-between">
                                                <div class="col-date"> 
                                                    <div class="item-date">
                                                        1 Aug 2025 - 8 Aug 2025
                                                    </div>
                                                </div>
                                                <div class="col-status">
                                                    <div class="item-status">Request</div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                    </div>
                                    <div class="item-body mb-2">
                                        <div class="d-flex align-items-center justify-content-between">
                                            <div class="col-description">
                                                <div class="item-description">
                                                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                                                </div>
                                            </div> 
                                        </div>
                                    </div>
                                    <div class="item-footer">
                                        <div class="d-flex align-items-center justify-content-between">
                                            
                                            <div class="">

                                            </div>
                                            
                                            <div class="col-item-action">
                                                <div class="item-action">
                                                    <div class="btn-action">
                                                        <span class="material-symbols-outlined">attach_file</span>
                                                    </div>
                                                    <div class="btn-action">
                                                        <span class="material-symbols-outlined">photo</span>
                                                    </div>
                                                    <div class="btn-action">
                                                        <span class="material-symbols-outlined">edit</span>
                                                    </div>
                                                    <div class="btn-action">
                                                        <span class="material-symbols-outlined">delete</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>  
                                --}}

                            </div>

                        </div>

                        <div class="mt-5 mb-2">
                            <div class="row">
                                <div class="col-6">
<button type="button" class="btn btn-close-modal w-100" data-bs-dismiss="modal">{{ __('general.close') }}</button>
                                </div>
                                <div class="col-6">
                                    <button type="button" class="btn btn-submit-modal w-100" >{{ __('attendance.request_time_off') }}</button>
                                </div>
                            </div>
                            
                        </div>


                    </div>
                </div>
            </div>
        </div>

        <!-- Modal request Time Off -->
        <div class="modal fade" id="requestTimeOffModal" tabindex="-1" role="dialog" aria-labelledby="requestTimeOffModalLabel" aria-hidden="true"  data-bs-backdrop="static" data-bs-keyboard="false">
            <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content rounded-4 border-0">
                    
                    <div class="modal-body p-0 border-0 ">

                        <div class="form-header p-4">
<h5 class="modal-title fs-18">{{ __('attendance.request_time_off') }}</h5>
                        </div>

                        <div class="wrapper-form px-4 scrollbar-transparent">

                            <form action="" id="form-request-time-off" class="needs-validation" novalidate enctype="multipart/form-data"  >

                                @csrf

                                <div class="mb-3">
<label for="select-type" class="form-label">{{ __('attendance.leave_type') }}</label>
                                    <select class="form-select" name="leave_type" id="select-type" attr-validation="required">
                                        <option value="ANNUAL_LEAVE">{{ __('attendance.annual_leave') }}</option>
                                        <option value="SICK">{{ __('attendance.sick') }}</option>
                                    </select>
                                    <div class="invalid-feedback fs-12">{{ __('attendance.please_input_reason') }}</div>
                                </div>

                                <div class="mb-3">
                                    <div class="row">
                                        <div class="col-6">
<label for="start-date" class="form-label">{{ __('attendance.start_date') }}</label>
                                            <input class="form-control" type="date" name="start_date" id="start-date" attr-validation="required">
                                            <div class="invalid-feedback fs-12">Please choose a start date</div>
                                        </div>
                                        <div class="col-6">
                                            <label for="end-date" class="form-label" >{{ __('attendance.end_date') }}</label>
                                            <input class="form-control" type="date" name="end_date" id="end-date" attr-validation="required">
                                            <div class="invalid-feedback fs-12">Please choose a end date</div>
                                        </div>
                                    </div>
                                </div>

                                <div class="mb-3">
                                    <label for="description" class="form-label">{{ __('attendance.description') }}</label>
                                    <textarea class="form-control" name="description" id="description" rows="3" attr-validation="required"></textarea>
                                    <div class="invalid-feedback fs-12">Please input a description</div>
                                </div>

                                <div class="mb-3">
                                    <label for="file-1" class="form-label">{{ __('attendance.file_1') }}</label>
                                    <input class="form-control" type="file" name="file_1" id="file-1" attr-validation="required"  accept="image/*,.pdf">
                                    <div class="invalid-feedback fs-12">Please add a file</div>
                                </div>

                                <div class="mb-3">
                                    <label for="file-2" class="form-label">{{ __('attendance.file_2') }}</label>
                                    <input class="form-control" type="file" name="file_2" id="file-2"  accept="image/*,.pdf">
                                    <div class="invalid-feedback fs-12">Please add a file</div>
                                </div>


                            </form>

                        </div>

                        <div class="p-4">

                            <div class="row">
                                <div class="col-6">
                                    <button type="button" class="btn btn-close-modal w-100">Cancel</button>
                                </div>
                                <div class="col-6">
                                    <button type="button" class="btn btn-submit-modal w-100" >Submit</button>
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
                </div>
            </div>
        </div>

        <!-- Modal edit Time Off -->
        <div class="modal fade" id="editTimeOffModal" tabindex="-1" role="dialog" aria-labelledby="editTimeOffModalLabel" aria-hidden="true"  data-bs-backdrop="static" data-bs-keyboard="false">
            <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content rounded-4 border-0">
                    
                    <div class="modal-body p-0 border-0 ">
                        
                        <div class="form-header p-4">
                            <h5 class="modal-title fs-18">Edit Time Off</h5>
                        </div>

                        <div class="wrapper-form px-4 scrollbar-transparent">

                            <form action="" id="form-edit-time-off" class="needs-validation" novalidate enctype="multipart/form-data"  >
                                @csrf

                                <input type="hidden" name="id_time_off" value="">
                                <input type="hidden" name="old_file_1" value="">
                                <input type="hidden" name="old_file_2" value="">

                                <div class="mb-3">
                                    <label for="select-type-edit" class="form-label">Leave Type</label>
                                    <select class="form-select" name="leave_type" id="select-type-edit" attr-validation="required">
                                        <option value="ANNUAL_LEAVE">Annual Leave</option>
                                        <option value="SICK">Sick</option>
                                    </select>
                                    <div class="invalid-feedback fs-12">Please select a leave type</div>
                                </div>

                                <div class="mb-3">
                                    <div class="row">
                                        <div class="col-6">
                                            <label for="start-date-edit" class="form-label">Start Date</label>
                                            <input class="form-control" type="date" name="start_date" id="start-date-edit" attr-validation="required">
                                            <div class="invalid-feedback fs-12">Please choose a start date</div>
                                        </div>
                                        <div class="col-6">
                                            <label for="end-date-edit" class="form-label" >End Date</label>
                                            <input class="form-control" type="date" name="end_date" id="end-date-edit" attr-validation="required">
                                            <div class="invalid-feedback fs-12">Please choose a end date</div>
                                        </div>
                                    </div>
                                </div>

                                <div class="mb-3">
                                    <label for="description-edit" class="form-label">Description</label>
                                    <textarea class="form-control" name="description" id="description-edit" rows="3" attr-validation="required"></textarea>
                                    <div class="invalid-feedback fs-12">Please input a description</div>
                                </div>

                                <div class="mb-3">
                                    <label for="file-1" class="form-label-edit">File 1</label>

                                    <div class="pill-file-1 d-none d-inline-flex rounded-pill bg-light align-items-center px-2 p-1 float-end">
                                        <a href="#" target="_blank" class="old_file_1_name fs-10"></a>
                                        <span class="material-symbols-outlined fs-12 ms-2 cursor-pointer remove-file-1" data-bs-toggle="tooltip" data-bs-title="Remove File">close</span>
                                    </div>
                                    
                                    <input class="form-control" type="file" name="file_1" id="file-1-edit"  accept="image/*,.pdf">
                                    <div class="invalid-feedback fs-12 ">Please add a file</div>
                                </div>

                                <div class="mb-3">
                                    <label for="file-2" class="form-label-edit">File 2</label>

                                    <div class="pill-file-2 d-none d-inline-flex rounded-pill bg-light align-items-center px-2 p-1 float-end">
                                        <a href="#" target="_blank" class="old_file_2_name fs-10"></a>
                                        <span class="material-symbols-outlined fs-12 ms-2 cursor-pointer remove-file-2" data-bs-toggle="tooltip" data-bs-title="Remove File">close</span>
                                    </div>

                                    <input class="form-control" type="file" name="file_2" id="file-2-edit"  accept="image/*,.pdf">
                                    <div class="invalid-feedback fs-12">Please add a file</div>
                                </div>


                            </form>

                        </div>

                        <div class="p-4">

                            <div class="row">
                                <div class="col-6">
                                    <button type="button" class="btn btn-close-modal w-100">Cancel</button>
                                </div>
                                <div class="col-6">
                                    <button type="button" class="btn btn-submit-modal w-100" >Save</button>
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
                </div>
            </div>
        </div>

        <!-- Modal delete Time Off -->
        <div class="modal fade" id="deleteTimeOffModal" tabindex="-1" role="dialog" aria-labelledby="deleteTimeOffModalLabel" aria-hidden="true"  data-bs-backdrop="static" data-bs-keyboard="false">
            <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content rounded-4 border-0">
                    
                    <div class="modal-body px-4 border-0 ">
                        
                        <div class="form-header mb-4">
                            <h5 class="modal-title fs-18">Delete Time Off</h5>
                        </div>

                        <div class="mb-2">
                            <form action="" id="form-delete-time-off" class="needs-validation" novalidate >
                                @csrf

                                <input type="hidden" name="id_time_off" value="">
                                <div class="box-data">

                                </div>


                            </form>
                        </div>

                        <div class="mb-3 fs-14 fw-normal">
                            Are you sure to delete this time off?
                        </div>

                        <div class="mt-4 mb-2">

                            <div class="row">
                                <div class="col-6">
                                    <button type="button" class="btn btn-close-modal w-100">Cancel</button>
                                </div>
                                <div class="col-6">
                                    <button type="button" class="btn btn-submit-modal w-100" >Delete</button>
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
                </div>
            </div>
        </div>            


        <!-- Modal Overtime -->
        <div class="modal fade" id="overtimeModal" tabindex="-1" role="dialog" aria-labelledby="overtimeModalLabel" aria-hidden="true"  data-bs-backdrop="static" data-bs-keyboard="false">
            <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content rounded-4 border-0 position-relative">
                    <div class="modal-header border-0 py-4">
                        <h5 class="modal-title modal-title-custom text-center w-100" id="overtimeModalLabel">Overtime</h5>
                        <button type="button" class="btn-close me-2" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body px-4 border-0 ">
                        
                        <div class="wrapper-overitme mb-4">
                            <div class="d-flex align-items-start">
                                <div class="col-total-day">
                                    <div class="box-total-day">
                                        <div class="title">Total Day</div>
                                        <div class="day-over">{{$overtimeTotalDays}}</div>
                                        <div class="text-day-over">Day</div>
                                    </div>
                                </div>

                                <div class="col-total-hour">
                                    <div class="box-total-hour">
                                        <div class="title">Total Hour</div>
                                        <div class="hour-over">
                                            {{ intval($overtimeTotalHours/3600) }}h 
                                            
                                        </div>
                                        <div class="text-hour-over">
                                            {{ intval($overtimeTotalHours % 3600 / 60) }}m 
                                        </div>
                                    </div>
                                </div>
                                

                            </div>
                        </div>
                             
  
                        <div class="wrapper-filter-search">
                            <div class="d-flex align-items-center justify-content-between">
                                <div class="">
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
                                <div>
                                    <input type="text" class="input-search-query sm-input w-100" id="input-search-overtime">
                                </div>
                            </div>
                        </div>

                        <div class="wrapper-data-overtime">

                            <div class="box-data scrollbar-transparent pe-1 pt-2">
                                {{-- 
                                <div class="item-overtime">
                                    <div class="item-header mb-2">
                                        <div class="mb-0">
                                            <div class="d-flex align-items-center justify-content-between">
                                                <div class="col-title">
                                                    <div class="item-title me-2">Wed, 2 Oct 2025</div>
                                                </div>
                                                <div class="col-hour-minute">
                                                    <div class="item-hour-minute">1h 30m</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <div class="d-flex align-items-center justify-content-between">
                                                <div class="col-hour-start-end"> 
                                                    <div class="item-hour-start-end">
                                                        18 : 00 - 21 : 00
                                                    </div>
                                                </div>
                                                <div class="col-status">
                                                    <div class="item-status">Request</div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                    </div>
                                    <div class="item-body mb-2">
                                        <div class="d-flex align-items-center justify-content-between">
                                            <div class="col-description">
                                                <div class="item-description">
                                                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                                                </div>
                                            </div> 
                                        </div>
                                    </div>
                                    <div class="item-footer mb-1">
                                        <div class="d-flex align-items-center justify-content-between">
                                            
                                            <div class="">
                                                <img src="{{ asset('asset/img/logo.png') }}" class="img-stamp" alt="">
                                                <img src="{{ asset('asset/img/logo.png') }}" class="img-stamp" alt="">
                                            </div>
                                            
                                            <div class="col-item-action">
                                                <div class="item-action item-action d-flex gap-2">
                                                    <div class="btn-action">
                                                        <span class="material-symbols-outlined">edit</span>
                                                    </div>
                                                    <div class="btn-action">
                                                        <span class="material-symbols-outlined">delete</span>
                                                    </div>
                                                    <div class="btn-stop">
                                                        Stop
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                 --}}

                            </div>

                        </div>

                        <div class="mt-5 mb-2">
                            <div class="row">
                                <div class="col-6">
                                    <button type="button" class="btn btn-close-modal w-100" data-bs-dismiss="modal">Close</button>
                                </div>
                                <div class="col-6">
                                    <button type="button" class="btn btn-submit-modal w-100 btn-new-overtime" >New Overtime</button>
                                </div>
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

        <!-- Modal New Overtime -->
        <div class="modal fade" id="overtimeNewModal" tabindex="-1" role="dialog" aria-labelledby="overtimeNewModalLabel" aria-hidden="true"  data-bs-backdrop="static" data-bs-keyboard="false">
            <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content rounded-4 border-0">
                    
                    <div class="modal-body p-0 border-0 ">

                        <div class="form-header p-4">
                            <h5 class="modal-title fs-18">New Overtime</h5>
                        </div>

                        <div class="wrapper-form px-4 scrollbar-transparent">

                            <form action="" id="form-new-overtime" class="needs-validation" novalidate enctype="multipart/form-data"  >

                                @csrf

                                <div class="mb-3">
                                    <div class="d-flex w-100 justify-content-between">
                                        <div>
                                            {{ date('D j M Y') }}
                                        </div>
                                        <div>
                                            <span class="text-clock-digital">{{ date('H : i : s') }}</span>
                                        </div>
                                    </div>
                                </div>
 
                                <div class="mb-3">

                                    <div class="row">
                                        <div class="col-6 col-photo">
                                            <div class="position-realtive">

                                                <div class="d-none">
                                                    <label for="imageInputOvertimeStart" class="label-photo-overtime-start">Label file</label>
                                                    <input type="file" name="overtime_photo_start" id="imageInputOvertimeStart" accept="image/*" capture="environment">
                                                </div>

                                                <div class="ratio ratio-1x1">

                                                    <div class="box-photo rounded-2" id="openCameraOvertimeStart">
                                                        <div class="d-flex w-100 h-100 justify-content-center align-items-center">
                                                            <div class="text-center">
                                                                <span class="material-symbols-outlined fs-4 opacity-50">photo_camera</span>
                                                                <div>
                                                                    <span class="fs-14 text-secondary">Take Photo</span>
                                                                </div>
                                                            </div>
                                                            <img id="overtimePhotoResultStart" class="object-fit-cover d-none w-100 h-100 position-absolute top-0 start-0 rounded-2" src="" alt="">
                                                        </div>

                                                    </div>

                                                </div>
                                                
                                            </div>
                                        </div>
                                    </div>
                                    
                                </div>

                                <div class="mb-3">
                                    <label for="overtime-description-start" class="form-label">Description</label>
                                    <textarea class="form-control" name="description" id="overtime-description-start" rows="3" attr-validation="required"></textarea>
                                    <div class="invalid-feedback fs-12">Please input a description</div>
                                </div>

                                {{-- <div class="mb-3">
                                    <label for="file-2" class="form-label">File 2</label>
                                    <input class="form-control" type="file" name="file_2" id="file-2"  accept="image/*,.pdf">
                                    <div class="invalid-feedback fs-12">Please add a file</div>
                                </div> --}}


                            </form>

                        </div>

                        <div class="p-4">

                            <div class="row mb-3">
                                <div class="col-6">
                                    <button type="button" class="btn btn-close-modal w-100">Cancel</button>
                                </div>
                                <div class="col-6">
                                    <button type="button" class="btn btn-submit-modal w-100" >Submit</button>
                                </div>
                            </div>
                            
                        </div>
                    </div>

                    <div class="box-camera z-3 rounded-4 bg-black bg-opacity-75 position-absolute top-0 start-0 w-100 h-100">
                        <video id="overtimeVideoElement" muted playsinline class="z-3 w-100 h-100 position-absolute top-0 start-0 rounded-4 object-fit-cover" ></video>
                        <canvas id="overtimeCanvasElement" style="display:none;"></canvas>


                        <div class="z-3 position-absolute bottom-0 start-0 w-100 text-center">
                            <div id="overtimeCaptureButton" class="btn-capture-photo">
                                <span class="material-symbols-outlined">photo_camera</span>
                            </div>
                        </div>

                        <div class="z-3 position-absolute h-auto top-0 end-0 text-end">
                            <div id="overtimeCloseButton" class="btn-close-capture">
                                <span class="material-symbols-outlined">close</span>
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

        <!-- Modal Stop Overtime -->
        <div class="modal fade" id="overtimeStopModal" tabindex="-1" role="dialog" aria-labelledby="overtimeStopModalLabel" aria-hidden="true"  data-bs-backdrop="static" data-bs-keyboard="false">
            <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content rounded-4 border-0">
                    
                    <div class="modal-body p-0 border-0 ">

                        <div class="form-header p-4">
                            <h5 class="modal-title fs-18">Stop Overtime</h5>
                        </div>

                        <div class="wrapper-form px-4 scrollbar-transparent">

                            <form action="" id="form-stop-overtime" class="needs-validation" novalidate enctype="multipart/form-data"  >

                                @csrf

                                <input type="hidden" name="overtime_id" value="">

                                <div class="mb-3">
                                    <div class="d-flex w-100 justify-content-between">
                                        <div>
                                            {{ date('D j M Y') }}
                                        </div>
                                        <div>
                                            <span class="text-clock-overtime"></span>
                                        </div>
                                    </div>
                                </div>
 

                                <div class="mb-3">

                                    <div class="row">
                                        <div class="col-6 col-photo">
                                            <div class="position-realtive">

                                                <div class="ratio ratio-1x1">

                                                    <div class="box-photo rounded-2">
                                                        <div class="d-flex w-100 h-100 justify-content-center align-items-center">
                                                            <img id="overtimePhotoStart" class="object-fit-cover w-100 h-100 position-absolute top-0 start-0 rounded-2" src="" alt="">
                                                        </div>

                                                    </div>

                                                </div>
                                                
                                            </div>
                                        </div>

                                        <div class="col-6 col-photo">
                                            <div class="position-realtive">

                                                <div class="d-none">
                                                    <label for="imageInputOvertimeStop" class="label-photo-overtime-stop">Label file</label>
                                                    <input type="file" name="overtime_photo_stop" id="imageInputOvertimeStop" accept="image/*" capture="environment">
                                                </div>

                                                <div class="ratio ratio-1x1">

                                                    <div class="box-photo rounded-2" id="openCameraOvertimeStop">
                                                        <div class="d-flex w-100 h-100 justify-content-center align-items-center">
                                                            <div class="text-center">
                                                                <span class="material-symbols-outlined fs-4 opacity-50">photo_camera</span>
                                                                <div>
                                                                    <span class="fs-14 text-secondary">Take Photo</span>
                                                                </div>
                                                            </div>
                                                            <img id="overtimePhotoResultStop" class="object-fit-cover d-none w-100 h-100 position-absolute top-0 start-0 rounded-2" src="" alt="">
                                                        </div>

                                                    </div>

                                                </div>
                                                
                                            </div>
                                        </div>
                                    </div>
                                    
                                </div>


                            </form>

                        </div>

                        <div class="p-4">

                            <div class="row">
                                <div class="col-6">
                                    <button type="button" class="btn btn-close-modal w-100">Cancel</button>
                                </div>
                                <div class="col-6">
                                    <button type="button" class="btn btn-submit-modal w-100" >Submit</button>
                                </div>
                            </div>
                            
                        </div>
                    </div>

                    <div class="box-camera z-3 rounded-4 bg-black bg-opacity-75 position-absolute top-0 start-0 w-100 h-100">
                        <video id="stopOvertimeVideoElement" muted playsinline class="z-3 w-100 h-100 position-absolute top-0 start-0 rounded-4 object-fit-cover" ></video>
                        <canvas id="stopOvertimeCanvasElement" style="display:none;"></canvas>


                        <div class="z-3 position-absolute bottom-0 start-0 w-100 text-center">
                            <div id="stopOvertimeCaptureButton" class="btn-capture-photo">
                                <span class="material-symbols-outlined">photo_camera</span>
                            </div>
                        </div>

                        <div class="z-3 position-absolute h-auto top-0 end-0 text-end">
                            <div id="stopOvertimeCloseButton" class="btn-close-capture">
                                <span class="material-symbols-outlined">close</span>
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

        <!-- Modal Edit Overtime -->
        <div class="modal fade" id="overtimeEditModal" tabindex="-1" role="dialog" aria-labelledby="overtimeEditModalLabel" aria-hidden="true"  data-bs-backdrop="static" data-bs-keyboard="false">
            <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content rounded-4 border-0">
                    
                    <div class="modal-header border-0 py-4">
                        <h5 class="modal-title modal-title-custom text-center w-100" id="overtimeEditModalLabel">Edit Overtime</h5>
                    </div>

                    <div class="modal-body p-0 border-0 ">

                        <div class="wrapper-form px-4 scrollbar-transparent">

                            <form action="" id="form-edit-overtime" class="needs-validation" novalidate enctype="multipart/form-data"  >

                                @csrf

                                <input type="hidden" name="overtime_id" value="">

                                <div class="mb-3">
                                    <div class="d-flex w-100 justify-content-between">
                                        <div class="overtime-date">
                                            {{ date('D j M Y') }}
                                        </div>
                                        <div>
                                            <span class="overtime-total-hour"></span>
                                        </div>
                                    </div>
                                </div>
 

                                <div class="mb-3">

                                    <div class="row">
                                        <div class="col-6 col-photo-start">
                                            <div class="position-realtive">
                                                <div class="ratio ratio-1x1">

                                                    <div class="box-photo rounded-2">
                                                        <div class="d-flex w-100 h-100 justify-content-center align-items-center">
                                                            <img class="photo-start object-fit-cover w-100 h-100 position-absolute top-0 start-0 rounded-2" src="" alt="">
                                                        </div>

                                                    </div>

                                                </div>
                                            </div>
                                            <div class="fs-12">
                                                <span>Start : </span>
                                                <span class="overtime-time-start"></span>
                                            </div>
                                        </div>

                                        <div class="col-6 col-photo-end d-none">
                                            <div class="position-realtive">

                                                <div class="ratio ratio-1x1">

                                                    <div class="box-photo rounded-2" >
                                                        <div class="d-flex w-100 h-100 justify-content-center align-items-center">
                                                            <img  class="photo-end object-fit-cover w-100 h-100 position-absolute top-0 start-0 rounded-2" src="" alt="">
                                                        </div>

                                                    </div>

                                                </div>
                                                
                                            </div>
                                            <div class="fs-12">
                                                <span>End : </span>
                                                <span class="overtime-time-end"></span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                </div>

                                <div class="mb-3">
                                    <label for="overtime-description-start" class="form-label">Description</label>
                                    <textarea class="form-control" name="description" id="overtime-description-start" rows="3" attr-validation="required"></textarea>
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
                                    <button type="button" class="btn btn-submit-modal w-100" >Save</button>
                                </div>
                            </div>
                            
                        </div>
                    </div>

                    <div class="box-camera z-3 rounded-4 bg-black bg-opacity-75 position-absolute top-0 start-0 w-100 h-100">
                        <video id="stopOvertimeVideoElement" muted playsinline class="z-3 w-100 h-100 position-absolute top-0 start-0 rounded-4 object-fit-cover" ></video>
                        <canvas id="stopOvertimeCanvasElement" style="display:none;"></canvas>


                        <div class="z-3 position-absolute bottom-0 start-0 w-100 text-center">
                            <div id="stopOvertimeCaptureButton" class="btn-capture-photo">
                                <span class="material-symbols-outlined">photo_camera</span>
                            </div>
                        </div>

                        <div class="z-3 position-absolute h-auto top-0 end-0 text-end">
                            <div id="stopOvertimeCloseButton" class="btn-close-capture">
                                <span class="material-symbols-outlined">close</span>
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

        <!-- Modal Delete Overtime -->
        <div class="modal fade" id="overtimeDeleteModal" tabindex="-1" role="dialog" aria-labelledby="overtimeDeleteModalLabel" aria-hidden="true"  data-bs-backdrop="static" data-bs-keyboard="false">
            <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content rounded-4 border-0">
                    
                    <div class="modal-header border-0 py-4">
                        <h5 class="modal-title modal-title-custom text-center w-100" id="overtimeDeleteModalLabel">Delete Overtime</h5>
                    </div>

                    <div class="modal-body p-0 border-0 ">

                        <div class="wrapper-form px-4 scrollbar-transparent">

                            <form action="" id="form-delete-overtime" class="needs-validation" novalidate enctype="multipart/form-data"  >

                                @csrf

                                <input type="hidden" name="overtime_id" value="">

                                <div class="mb-3">
                                    <div class="d-flex w-100 justify-content-between">
                                        <div class="overtime-date">
                                            {{ date('D j M Y') }}
                                        </div>
                                        <div>
                                            <span class="overtime-total-hour"></span>
                                        </div>
                                    </div>
                                </div>

                                <div class="mb-0">
                                    <span class="overtime-description fs-14"></span>
                                </div>
 

                                <div class="mb-5">

                                    <div class="row">
                                        <div class="col-6 col-photo-start">
                                            <div class="position-realtive">
                                                <div class="ratio ratio-1x1">

                                                    <div class="box-photo rounded-2">
                                                        <div class="d-flex w-100 h-100 justify-content-center align-items-center">
                                                            <img class="photo-start object-fit-cover w-100 h-100 position-absolute top-0 start-0 rounded-2" src="" alt="">
                                                        </div>

                                                    </div>

                                                </div>
                                            </div>
                                            <div class="fs-12">
                                                <span>Start : </span>
                                                <span class="overtime-time-start"></span>
                                            </div>
                                        </div>

                                        <div class="col-6 col-photo-end d-none">
                                            <div class="position-realtive">

                                                <div class="ratio ratio-1x1">

                                                    <div class="box-photo rounded-2" >
                                                        <div class="d-flex w-100 h-100 justify-content-center align-items-center">
                                                            <img  class="photo-end object-fit-cover w-100 h-100 position-absolute top-0 start-0 rounded-2" src="" alt="">
                                                        </div>

                                                    </div>

                                                </div>
                                                
                                            </div>
                                            <div class="fs-12">
                                                <span>End : </span>
                                                <span class="overtime-time-end"></span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                </div>

                                <div class="mb-0">
                                    <span class="fs-14">
                                        Are you sure you want to delete this overtime ?
                                    </span>
                                </div>

                            </form>

                        </div>

                        <div class="p-4">

                            <div class="row">
                                <div class="col-6">
                                    <button type="button" class="btn btn-close-modal w-100">Cancel</button>
                                </div>
                                <div class="col-6">
                                    <button type="button" class="btn btn-submit-modal w-100" >Delete</button>
                                </div>
                            </div>
                            
                        </div>
                    </div>

                    <div class="box-camera z-3 rounded-4 bg-black bg-opacity-75 position-absolute top-0 start-0 w-100 h-100">
                        <video id="stopOvertimeVideoElement" muted playsinline class="z-3 w-100 h-100 position-absolute top-0 start-0 rounded-4 object-fit-cover" ></video>
                        <canvas id="stopOvertimeCanvasElement" style="display:none;"></canvas>


                        <div class="z-3 position-absolute bottom-0 start-0 w-100 text-center">
                            <div id="stopOvertimeCaptureButton" class="btn-capture-photo">
                                <span class="material-symbols-outlined">photo_camera</span>
                            </div>
                        </div>

                        <div class="z-3 position-absolute h-auto top-0 end-0 text-end">
                            <div id="stopOvertimeCloseButton" class="btn-close-capture">
                                <span class="material-symbols-outlined">close</span>
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

    </x-slot>


    <x-slot name="script_slot">

        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
        <script src="{{ asset('asset/js/attendance.js?v=' . time()) }}"></script>
        <script src="{{ asset('asset/js/attendance_time_off.js?v=' . time()) }}"></script>
        <script src="{{ asset('asset/js/attendance_overtime.js?v=' . time()) }}"></script>
    
    </x-slot>

</x-office-layout>
