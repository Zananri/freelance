<x-office-layout>
    <x-slot name="menu_active">
        {{ __('attendance') }}
    </x-slot>
    <x-slot name="head_slot">
        <link href="{{ asset('asset/css/attendance.css') }}?v={{ time() }}" rel="stylesheet">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="" />
    </x-slot>

    <div class="title-content">
        <h2 class="text-title-content">Attendance</h2>
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
                                                    <span class="text-body me-3">{{$shiftTitle}}</span>
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
                                    <span class="fs-14 text-body">Attendance Log</span>
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
                                        <div class="fs-12 text-secondary">Check In </div>
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
                                        <div class="fs-12 text-secondary">Check Out </div>
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

                <style>
                    .box-off-time{
                        height: 86px;
                        width: 86px;
                        border-radius: 8px;
                        background-color: #EBDEDE;
                        margin-right: 25px;
                        cursor: pointer;
                        transition: all 0.3s;
                    }

                    .box-off-time:hover{
                        background-color: #e7d5d5;
                    }

                    .box-overtime{
                        height: 86px;
                        width: 86px;
                        border-radius: 8px;
                        background-color: #D7E1F0;
                        cursor: pointer;
                        transition: all 0.3s;
                    }

                    .box-overtime:hover{
                        background-color: #cfdff7;
                    }

                    .box-overtime .material-symbols-outlined,
                    .box-off-time .material-symbols-outlined{
                        font-size: 32px;
                    }
                    
                    .box-off-time .material-symbols-outlined,
                    .box-off-time .text-off-time{
                        color:#453636;
                    }

                    .box-off-time:hover .material-symbols-outlined,
                    .box-off-time:hover .text-off-time{
                        color:#291e1e;
                    }

                    .box-overtime .text-overtime,
                    .box-off-time .text-off-time{
                        font-size: 14px;
                        font-weight: 500;
                    }

                    .box-overtime .material-symbols-outlined,
                    .box-overtime .text-overtime{
                        color:#31353B;
                    }

                    .box-overtime:hover .material-symbols-outlined,
                    .box-overtime:hover .text-overtime{
                        color:#1c2129;
                    }

                    



                </style>

                <div class="employee-time-off-overtime rounded-4 bg-card-1 p-4 pe-0">
                    <div class="d-flex">
                        <div>
                            <div class="box-off-time">
                                <div class="d-flex h-100 flex-column justify-content-center align-items-center">
                                    <div>
                                        <div class="icon-off-time">
                                            <span class="material-symbols-outlined">free_cancellation</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div class="text-off-time">
                                            Off Time
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div>
                            <div class="box-overtime">
                                <div class="d-flex h-100 flex-column justify-content-center align-items-center">
                                    <div>
                                        <div class="icon-off-time">
                                            <span class="material-symbols-outlined">more_time</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div class="text-overtime">
                                            Overtime
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
                                    <th>Sun</th>
                                    <th>Mon</th>
                                    <th>Tue</th>
                                    <th>Wed</th>
                                    <th>Thu</th>
                                    <th>Fri</th>
                                    <th>Sat</th>
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

        <!-- Modal for Check In -->
        <div class="modal fade" id="checkInModal" tabindex="-1" aria-labelledby="checkInModalLabel"
            aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content rounded-4" id="modalContent">

                    <!-- Modal Header -->
                    <div class="modal-header border-0 z-1  d-flex justify-content-center">
                        <h5 class="modal-title modal-title-custom border-0 text-center w-100" id="checkInModalLabel">Check
                            In
                        </h5>
                        <button type="button" class="btn-close position-absolute" style="right: 1rem;"
                            data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>

                    <!-- Modal Body -->
                    <div class="modal-body m-0 p-0 z-1 border-0">
                        <div class="box-form">
                            <form id="checkInForm" novalidate enctype="multipart/form-data" >
                                @csrf
                                <!-- Time Display Container -->
                                <div class="text-center mb-4">
                                    <div class="mb-0">
                                        <div class="date-time-display">
                                            <span class="text-clock-digital" id="time_in">
                                                00 : 00 : 00    
                                            </span>
                                            
                                        </div>
                                    </div>
                                    <div class="mb-0">
                                        <div class="date-time-display">
                                            
                                            {{ $todayDate }}
                                
                                        </div>
                                    </div>
                                    <div>
                                        <div class="shift-time-display">
                                            {{ $shiftTime }}
                                        </div>
                                    </div>
                                </div>

                                <!-- Work Outside -->
                                <div class="mb-3">
                                    
                                    <div class="row">
                                        <div class="col-12">
                                            <div class="fs-14 text-secondary">Work Outside</div>
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="col-6">
                                            <input class="form-check-input" type="radio" name="is_work_outside"
                                                id="work_outside_yes" value="1">
                                            <label class="form-check-label w-100 text-center"
                                                for="work_outside_yes">Yes</label>
                                        </div>
                                        <div class="col-6">
                                            <input class="form-check-input" type="radio" name="is_work_outside"
                                                id="work_outside_no" value="0" checked>
                                            <label class="form-check-label w-100 text-center"
                                                for="work_outside_no">No</label>
                                        </div>
                                    </div>
                                    
                                </div>

                                <!-- Map Location Section for Check In -->
                                <div class="mb-3">
                                    <div class="row">
                                        
                                        <div class="col-6 col-photo d-none">
                                            <div class="position-realtive">

                                                <div class="d-none">
                                                    <label for="imageInputCheckIn" class="label-photo-checkin">Label file</label>
                                                    <input type="file" name="photo_checkin" id="imageInputCheckIn" accept="image/*" capture="environment">
                                                </div>

                                                <div class="ratio ratio-1x1">

                                                    <div class="box-photo border rounded-2" id="openCameraCheckIn">
                                                        <div class="d-flex w-100 h-100 justify-content-center align-items-center">
                                                            <div class="text-center">
                                                                <span class="material-symbols-outlined fs-4 opacity-50">photo_camera</span>
                                                                <div>
                                                                    <span class="fs-14 text-secondary">Take Photo</span>
                                                                </div>
                                                            </div>
                                                            <img id="photoResult" class="object-fit-cover d-none w-100 h-100 position-absolute top-0 start-0 rounded-2" src="" alt="">
                                                        </div>

                                                    </div>

                                                </div>
                                                
                                            </div>
                                        </div>
                                        <div class="col-12 col-map">
                                            <div class="">
                                                <div class="ratio ratio-21x9">
                                                    <div id="mapCheckIn" class="rounded-2 border"></div>
                                                </div>
                                                
                                                <input type="hidden" id="latitudeCheckIn" name="latitudeCheckIn">
                                                <input type="hidden" id="longitudeCheckIn" name="longitudeCheckIn">
                                            </div>
                                        </div>
                                        
                                    </div>
                                    
                                </div>


                            </form>
                        </div>
                        

                        <div class="mb-4 box-btn-submit pt-4 ">
                            <button type="submit" class="btn btn-submit-black w-100" id="submitCheckInBtn">
                                Check In
                            </button>
                        </div>
                    </div>


                    <div class="box-camera z-3 rounded-4 bg-black bg-opacity-75 position-absolute top-0 start-0 w-100 h-100">
                        <video id="videoElement" muted playsinline class="z-3 w-100 h-100 position-absolute top-0 start-0 rounded-4 object-fit-cover" ></video>
                        <canvas id="canvasElement" style="display:none;"></canvas>


                        <div class="z-3 position-absolute bottom-0 start-0 w-100 text-center">
                            <div id="captureButton" class="btn-capture-photo">
                                <span class="material-symbols-outlined">photo_camera</span>
                            </div>
                        </div>

                        <div class="z-3 position-absolute h-auto top-0 end-0 text-end">
                            <div id="closeButton" class="btn-close-capture">
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

        <!-- Modal for Check Out -->
        <div class="modal fade" id="checkOutModal" tabindex="-1" aria-labelledby="checkOutModalLabel"
            aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content border-0 rounded-4" id="modalContent">

                    <!-- Modal Header -->
                    <div class="modal-header border-0 z-1  d-flex justify-content-center">
                        <h5 class="modal-title modal-title-custom text-center w-100" id="checkInModalLabel">Check
                            Out
                        </h5>
                        <button type="button" class="btn-close position-absolute" style="right: 1rem;"
                            data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>

                    <!-- Modal Body -->
                    <div class="modal-body m-0 p-0 z-1">
                        <div class="box-form">
                            <form id="checkOutForm" novalidate enctype="multipart/form-data" >
                                @csrf
                                <!-- Time Display Container -->
                                <div class="text-center mb-4">
                                    <div class="mb-0">
                                        <div class="date-time-display">
                                            <span class="text-clock-digital" id="time_out">
                                                00 : 00 : 00    
                                            </span>
                                            
                                        </div>
                                    </div>
                                    <div class="mb-0">
                                        <div class="date-time-display">
                                            
                                            {{ $todayDate }}
                                
                                        </div>
                                    </div>
                                    <div>
                                        <div class="shift-time-display">
                                            {{ $shiftTime }}
                                        </div>
                                    </div>
                                </div>

                                <!-- Work Outside -->
                                <div class="mb-3">
                                    
                                    <div class="row">
                                        <div class="col-12">
                                            <div class="fs-14 text-secondary">Work Outside</div>
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="col-6">
                                            <input class="form-check-input" type="radio" name="is_work_outside"
                                                id="work_outside_yes_checkout" value="1">
                                            <label class="form-check-label w-100 text-center"
                                                for="work_outside_yes_checkout">Yes</label>
                                        </div>
                                        <div class="col-6">
                                            <input class="form-check-input" type="radio" name="is_work_outside"
                                                id="work_outside_no_checkout" value="0" checked>
                                            <label class="form-check-label w-100 text-center"
                                                for="work_outside_no_checkout">No</label>
                                        </div>
                                    </div>
                                    
                                </div>

                                <div class="mb-3">
                                    <div class="row">
                                        
                                        <div class="col-6 col-photo d-none">
                                            <div class="position-realtive">

                                                <div class="d-none">
                                                    <label for="imageInputCheckout" class="label-photo-checkout">Label file</label>
                                                    <input type="file" name="photo_checkout" id="imageInputCheckout" accept="image/*" capture="environment">
                                                </div>

                                                <div class="ratio ratio-1x1">

                                                    <div class="box-photo border rounded-2" id="openCameraCheckout">
                                                        <div class="d-flex w-100 h-100 justify-content-center align-items-center">
                                                            <div class="text-center">
                                                                <span class="material-symbols-outlined fs-4 opacity-50">photo_camera</span>
                                                                <div>
                                                                    <span class="fs-14 text-secondary">Take Photo</span>
                                                                </div>
                                                            </div>
                                                            <img id="photoResultCheckout" class="object-fit-cover d-none w-100 h-100 position-absolute top-0 start-0 rounded-2" src="" alt="">
                                                        </div>

                                                    </div>

                                                </div>
                                                
                                            </div>
                                        </div>
                                        <div class="col-12 col-map">
                                            <div class="">
                                                <div class="ratio ratio-21x9">
                                                    <div id="mapCheckOut" class="rounded-2 border"></div>
                                                </div>
                                                
                                                <input type="hidden" name="latitudeCheckOut">
                                                <input type="hidden" name="longitudeCheckOut">
                                            </div>
                                        </div>
                                        
                                    </div>
                                    
                                </div>
                                
                            </form>
                        </div>
                        

                        <div class="mb-4 box-btn-submit pt-4 ">
                            <button type="submit" class="btn btn-submit-black w-100" id="submitCheckOutBtn">
                                Check Out
                            </button>
                        </div>
                    </div>


                    <div class="box-camera z-3 rounded-4 bg-black bg-opacity-75 position-absolute top-0 start-0 w-100 h-100">
                        <video id="videoElementCheckout" muted playsinline class="z-3 w-100 h-100 position-absolute top-0 start-0 rounded-4 object-fit-cover" ></video>
                        <canvas id="canvasElementCheckout" style="display:none;"></canvas>


                        <div class="z-3 position-absolute bottom-0 start-0 w-100 text-center">
                            <div id="captureButtonCheckout" class="btn-capture-photo">
                                <span class="material-symbols-outlined">photo_camera</span>
                            </div>
                        </div>

                        <div class="z-3 position-absolute h-auto top-0 end-0 text-end">
                            <div id="closeButtonCheckout" class="btn-close-capture">
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

        <!-- Modal for Check In Detail -->
        <div class="modal fade" id="checkInDetailModal" tabindex="-1" role="dialog" aria-labelledby="checkInDetailModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content rounded-4 border-0">
                    <div class="modal-header border-0 py-4">
                        <h5 class="modal-title modal-title-custom text-center w-100" id="checkInDetailModalLabel">Check In</h5>
                        <button type="button" class="btn-close me-2" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body px-5 border-0 ">

                        @if ($atendanceTrackingCheckin)
                            
                            <div class="mb-3">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <div class="fs-14 text-secondary">Date :</div>
                                    <div class="fs-14">{{ date('l, j F Y',strtotime($atendanceTrackingCheckin->date_time)) }}</div>
                                </div>
                            </div>

                            <div class="mb-3">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <div class="fs-14 text-secondary">Time In :</div>
                                    <div class="fs-14">{{ date('H:i',strtotime($atendanceTrackingCheckin->date_time)) }}</div>
                                </div>
                            </div>

                            <div class="mb-3">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <div class="fs-14 text-secondary">Work Outside :</div>
                                    <div class="fs-14">{{ $atendanceTrackingCheckin->is_work_outside ? 'Yes' : 'No' }}</div>
                                </div>
                            </div>

                            <div class="mb-3">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <div class="fs-14 text-secondary">Shift :</div>
                                    <div class="fs-14">{{ $shiftTime }}</div>
                                </div>
                            </div>




                            <div class="mb-5 mt-5">
                                <div class="row">
                                    @php
                                        $checkinImageSrc = '';
                                        $colMap = 'col-12';
                                        if($atendanceTrackingCheckin->image){
                                            $checkinImageSrc = asset($atendanceTrackingCheckin->image[0]);
                                            $colMap = 'col-6';
                                        }
                                    @endphp

                                    <div class="col-6 {{ $checkinImageSrc ? ' ' : 'd-none' }}">
                                        <div class="position-relative">
                                            <div class="ratio ratio-1x1">

                                                <div class="rounded-2">

                                                    <div class="d-flex w-100 h-100 justify-content-center align-items-center">
                                                        <img src="{{ $checkinImageSrc }}" class="object-fit-cover w-100 h-100 position-absolute top-0 start-0 rounded-2"  alt="">
                                                    </div>

                                                </div>

                                            </div>
                                        </div>
                                    </div>

                                    <div class="{{ $colMap }} ">
                                        <div class="position-relative">
                                            <div class="ratio {{ $checkinImageSrc ? 'ratio-1x1' : 'ratio-16x9' }} ">
                                                <div id="detailMapCheckIn" data-location="{{ $atendanceTrackingCheckin->location }}"  class="rounded-3"></div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                </div>
                                
                            </div>
                            
                        @else
                            <div class="p-5 text-center fs-14 text-secondary">
                                No Data Check In
                            </div>
                        @endif

                        <div class="mt-5 mb-3">
                            <button type="button" class="btn btn-close-custom w-100" data-bs-dismiss="modal">Close</button>
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
                        <h5 class="modal-title modal-title-custom text-center w-100" id="checkOutDetailModalLabel">Check Out</h5>
                        <button type="button" class="btn-close me-2" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body px-5 border-0 ">

                        @if ($atendanceTrackingCheckout)
                            
                            <div class="mb-3">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <div class="fs-14 text-secondary">Date :</div>
                                    <div class="fs-14">{{ date('l, j F Y',strtotime($atendanceTrackingCheckout->date_time)) }}</div>
                                </div>
                            </div>

                            <div class="mb-3">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <div class="fs-14 text-secondary">Time Out :</div>
                                    <div class="fs-14">{{ date('H:i',strtotime($atendanceTrackingCheckout->date_time)) }}</div>
                                </div>
                            </div>

                            <div class="mb-3">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <div class="fs-14 text-secondary">Work Outside :</div>
                                    <div class="fs-14">{{ $atendanceTrackingCheckout->is_work_outside ? 'Yes' : 'No' }}</div>
                                </div>
                            </div>

                            <div class="mb-3">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <div class="fs-14 text-secondary">Shift :</div>
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
                                No Data Check Out
                            </div>
                        @endif

                        <div class="mt-5 mb-3">
                            <button type="button" class="btn btn-close-custom w-100" data-bs-dismiss="modal">Close</button>
                        </div>


                    </div>
                </div>
            </div>
        </div>
                    

    </x-slot>


    <x-slot name="script_slot">
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
        <script src="{{ asset('asset/js/attendance.js?v=' . time()) }}"></script>
    </x-slot>
</x-office-layout>
