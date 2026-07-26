<x-office-layout>
    <x-slot name="menu_active">
        {{ 'attendance_tracking' }}
    </x-slot>
    <x-slot name="head_stitle_slot">
        {{ __('attendance_tracking.title') }}
    </x-slot>
    <x-slot name="head_slot">
        <link href="{{ asset('asset/css/attendance_tracking.css')}}?v{{ time()}}" rel="stylesheet">
    </x-slot>

    <div class="title-content">
        <div class="row">
            <div class="col-12 col-md-9">
                <h2 class="text-title-content mb-3">{{ __('attendance_tracking.title') }}</h2>
            </div>
            <div class="col-12 col-md-3">
                <div class="d-flex gap-2 justify-content-end align-items-center">
                    <div>
                        <input type="text" class="input-search-query w-100"
                            placeholder="{{ __('attendance_tracking.search_employee') }}">
                    </div>
                    <div>
                        <button class="btn btn-default" type="button" id="btn-download-xlsx"
                            title="{{ __('attendance_tracking.download_excel') }}">
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
                                            <span class="calendar-month">{{ now()->locale(app()->getLocale())->translatedFormat('F') }}</span>
                                            <span class="calendar-year">{{ date('Y') }}</span>
                                        </div>

                                    </div>

                                    <ul class="dropdown-menu border-0 shadow-sm bg-default-1 rounded-3">
                                        @for ($monthNum = 1; $monthNum <= 12; $monthNum++) 
                                            <li data-month="{{ $monthNum }}" class="dropdown-item month-item fs-14">
                                                <div class="dropdown-item fs-14">
                                                    {{ \Carbon\Carbon::create()->month($monthNum)->locale(app()->getLocale())->translatedFormat('F') }}
                                                </div>
                                            </li>
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
                            <table class="table-attendance" id="attendance-tracking-table">
                                <thead>
                                    <tr>
                                        <th>{{ __('attendance_tracking.employee') }}</th>
                                        @for ($i = 1; $i <= 31 ; $i++)
                                            <th class="col-day" data-day="{{ $i }}">
                                                <div class="calendar-week-short"></div>
                                                <div>{{ $i }}</div>
                                                <div class="calendar-month-short">{{ now()->locale(app()->getLocale())->translatedFormat('M') }}</div>
                                            </th>
                                        @endfor
                                    </tr>
                                </thead>
                                <tbody id="attendance-tracking-tbody">
                                    @foreach ($employee as $itemEmployee)
                                        <tr class="employee-row" data-employee-name="{{ $itemEmployee->name }}" data-employee-photo="{{ asset($itemEmployee->photo) }}"  data-employee-id="{{ $itemEmployee->id }}" data-weekday-off="{{ $itemEmployee->weekday_off }}" data-division="{{ $itemEmployee->division_id }}" data-department="{{ $itemEmployee->department_id }}"  >
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
                                                        <div class="box-leave">
                                                            <div class="d-flex h-100 w-100 align-items-center justify-content-center">
                                                                <div class="description-leave"></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            @endfor
                                        </tr>
                                    @endforeach
                                </tbody>
                            </table>
                        </div>
                        <div class="d-flex justify-content-between align-items-center mt-2 px-3 pb-3 flex-wrap gap-2">
                            <div class="pagination-summary" id="trackingPaginationInfo"></div>
                            <div class="pagination-controls" id="trackingPagination"></div>
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
                                    <span class="fw-light fs-24">{{ __('attendance_tracking.attendance') }}</span>
                            </div>
                            <div class="mb-4 text-center">
                                <span class="fw-normal fs-14 text-secondary attendance-date"></span>
                            </div>

                            <div class="mb-3 pb-2 border-bottom border-3">
                                <div class="d-flex mb-2 justify-content-between align-items-center w-100">
                                    <div>
                                        <div class="fs-14 text-secondary fw-normal">{{ __('attendance_tracking.employee') }}</div>
                                    </div>
                                    <div>
                                        <div class="employee-name fw-medium fs-14"></div>
                                    </div>
                                </div>
                                
                                <div class="mb-2">
                                    <div class="d-flex justify-content-between align-items-center w-100">
                                        <div>
                                            <div class="fs-14 text-secondary fw-normal">{{ __('attendance_tracking.shift') }}</div>
                                        </div>
                                        <div>
                                            <div class="employee-shift fs-14 fw-normal"></div>
                                        </div>
                                    </div>
                                </div>

                                <div class="mb-2">
                                    <div class="d-flex justify-content-between align-items-center w-100">
                                        <div>
                                            <div class="fs-14 text-secondary fw-normal">{{ __('attendance_tracking.status') }}</div>
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
                                            <div class="fs-14 text-secondary fw-normal">{{ __('attendance_tracking.late') }}</div>
                                        </div>
                                        <div>
                                            <div class="attendance-late  fs-14 fw-normal"></div>
                                        </div>
                                    </div>
                                </div>

                                <div class="mb-2">
                                    <div class="d-flex justify-content-between align-items-center w-100">
                                        <div>
                                            <div class="fs-14 text-secondary fw-normal">{{ __('attendance_tracking.check_in') }}</div>
                                        </div>
                                        <div>
                                            <div class="attendance-checkin  fs-14 fw-normal"></div>
                                        </div>
                                    </div>
                                </div>

                                <div class="mb-2">
                                    <div class="d-flex justify-content-between align-items-center w-100">
                                        <div>
                                            <div class="fs-14 text-secondary fw-normal">{{ __('attendance_tracking.check_out') }}</div>
                                        </div>
                                        <div>
                                            <div class="attendance-checkout  fs-14 fw-normal"></div>
                                        </div>
                                    </div>
                                </div>

                                <div class="mb-3">
                                    <div class="d-flex justify-content-between align-items-center w-100">
                                        <div>
                                            <div class="fs-14 text-secondary fw-normal">{{ __('attendance_tracking.work_duration') }}</div>
                                        </div>
                                        <div>
                                            <div class="attendance-work-duration  fs-14 fw-normal">00 : 00</div>
                                        </div>
                                    </div>
                                </div>

                            

                                <div class="mb-3">
                                    <div class="d-flex justify-content-between gap-3 align-items-center w-100">
                                        <div>
                                            <div class="fs-14 text-secondary fw-normal">{{ __('attendance_tracking.note') }}</div>
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
                                        <div class="btn btn-default-modal border-0 w-100 p-2" data-bs-dismiss="modal">{{ __('attendance_tracking.close') }}</div>
                                    </div>
                                    <div class="col-6">
                                        <div class="btn btn-default-dark-modal border-0 w-100 p-2 btn-edit-attendance">{{ __('attendance_tracking.edit') }}</div>
                                    </div>
                                </div>
                            </div>

                            <div class="loader d-none" >
                                <div class="box-loader rounded-20" >
                                    <div class="text-center">
                                        <div class="spinner-border text-secondary" role="status">
                                            <span class="visually-hidden">{{ __('attendance_tracking.loading') }}</span>
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
                                    <span class="fw-light fs-24">{{ __('attendance_tracking.attendance') }}</span>
                            </div>
                            <div class="mb-4 text-center">
                                <span class="fw-normal fs-14 text-secondary attendance-date"></span>
                            </div>

                            <div class="mb-3 pb-2 border-bottom border-3">

                                <div class="d-flex mb-2 justify-content-between align-items-center w-100">
                                    <div>
                                        <div class="fs-14 text-secondary fw-normal">{{ __('attendance_tracking.employee') }}</div>
                                    </div>
                                    <div>
                                        <div class="employee-name fw-medium fs-14"></div>
                                    </div>
                                </div>
                                
                                <div class="mb-2">
                                    <div class="d-flex justify-content-between align-items-center w-100">
                                        <div>
                                            <div class="fs-14 text-secondary fw-normal">{{ __('attendance_tracking.shift') }}</div>
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
                                            {{ __('attendance_tracking.status') }}
                                        </label>
                                    </div>
                                    <div class="col-6">
                                        <select class="form-select border-0 fs-14" name="attendance_status" id="attendance_status">
                                            <option value="PRESENT">{{ __('attendance_tracking.present') }}</option>
                                            <option value="ABSENT">{{ __('attendance_tracking.absent') }}</option>
                                        </select>
                                    </div>
                                </div>
                                
                            </div>

                            <div class="form-block-present">

                                <div class="mb-2">

                                    <div class="row">
                                        <div class="col-6">
                                            <label for="attendance_time_in" class="fs-14 text-secondary fw-normal">
                                                {{ __('attendance_tracking.check_in') }}
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
                                                {{ __('attendance_tracking.check_out') }}
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
                                                {{ __('attendance_tracking.note') }}
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
                                        <div class="btn btn-default-modal border-0 w-100 p-2 btn-close-modal-edit">{{ __('attendance_tracking.cancel') }}</div>
                                    </div>
                                    <div class="col-6">
                                        <div class="btn btn-default-dark-modal border-0 w-100 p-2 btn-submit-attendance">{{ __('attendance_tracking.submit') }}</div>
                                    </div>
                                </div>
                            </div>

                            
                        </form>

                        <div class="box-loader z-3 rounded-4 bg-body bg-opacity-25 position-absolute top-0 start-0 w-100 h-100">

                            <div class="w-100 h-100 d-flex justify-content-center align-items-center">
                                <div>
                                    <div class="spinner-border" style="width: 3rem; height: 3rem;" role="status">
                                        <span class="visually-hidden">{{ __('attendance_tracking.loading') }}</span>
                                    </div>
                                    <div class="fs-14">{{ __('attendance_tracking.loading') }}</div>
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
                                    <div class="btn btn-default-modal border-0 w-100 p-2 btn-close-modal-leave">{{ __('attendance_tracking.close') }}</div>
                                </div>
                            </div>
                        </div>



                        <div class="box-loader z-3 rounded-4 bg-body bg-opacity-25 position-absolute top-0 start-0 w-100 h-100">

                            <div class="w-100 h-100 d-flex justify-content-center align-items-center">
                                <div>
                                    <div class="spinner-border" style="width: 3rem; height: 3rem;" role="status">
                                        <span class="visually-hidden">{{ __('attendance_tracking.loading') }}</span>
                                    </div>
                                    <div class="fs-14">{{ __('attendance_tracking.loading') }}</div>
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
        @php
            $attendanceTrackingI18n = [
                'locale' => str_starts_with(app()->getLocale(), 'id')
                    ? 'id-ID'
                    : 'en-US',
                'text' => trans('attendance_tracking.js'),
            ];
        @endphp

        <script>
            window.attendanceTrackingI18n = @js($attendanceTrackingI18n);
        </script>
        <script src="{{ asset('asset/js/attendance_tracking.js')}}?v={{ time() }}"></script>
    </x-slot>

</x-office-layout>