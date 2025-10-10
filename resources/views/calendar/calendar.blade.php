<x-office-layout>
    <x-slot name="menu_active">
        {{ __('calendar') }}
    </x-slot>
    <x-slot name="head_stitle_slot">
        {{ __('Calendar') }}
    </x-slot>
    <x-slot name="head_slot">
        <link href="{{ asset('asset/css/calendar.css?v'.time()) }}" rel="stylesheet">
    </x-slot>

    <div class="title-content">
        <div class="d-flex align-items-center">
            <div class="w-100">
                <h2 class="text-title-content" >Calendar</h2>
            </div>
            <div>
                <button class="btn btn-default-dark fs-14" id="btn-new-event" type="button">
                    New Event
                </button>
            </div>
            {{-- <div>
                <div>
                    <button id="btn-show-config" class=" btn btn-default d-inline-flex align-items-center" type="button">
                        <span class="material-symbols-outlined icon" type="button">settings</span>
                        <span class="text-button">Config</span>
                    </button>
                </div>
                
            </div> --}}
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

                </div>

            </di>


        </div>
    </div>
 
    

    <x-slot name="body_end_slot"> 
        
        <!-- Modal -->
        <div class="modal fade" id="calendarMontModal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="calendarDayModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">

                    <div class="modal-body position-relative">
                        <div class="config-header mb-3">
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
                        <div class="config-body">
                            <div class="p-3 rounded-3 fs-14 bg-light mb-3">
                                17 August 2025 Indonesia independence day
                            </div>
                            <div class="p-3 rounded-3 fs-14 bg-light mb-3">
                                18 August 2025 Colective leave
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

        <!-- Modal -->
        <div class="modal fade" id="calendarDayModal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="calendarDayModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content p-0">

                    <div class="modal-body position-relative p-0">
                        <div class="p-4">
                            <div class="d-flex gap-3 align-items-center">
                                <div class="calendar-date fs-16 fw-light"></div>
                                <div class="w-100 ps-5">
                                    <input type="text" class="form-control input-search-event-day" id="search-event-day">
                                </div>
                            </div>
                            
                        </div>
                        <div class="ps-4">
                            <div class="pe-4 box-data-event scrollbar-transparent">

                                
                                {{-- @for ($i = 0; $i < 10; $i++)
                                    <div class="item-event mb-3">
                                        <div class="d-flex align-items-start">
                                            <div class="col-time pt-3">
                                                <div class="d-flex-inline text-time me-3">09 : 00</div>
                                            </div>
                                            <div class="col-event-title w-100">
                                                <div class="p-3 rounded-3 fs-14 bg-light">
                                                    <span class="text-title-event text-body text-opacity-75">
                                                        17 August 2025 Indonesia independence day
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                @endfor --}}
                                
                                
                            </div>
                            
                        </div>

                        <div class="p-4">
                            <div class="row">
                                
                                <div class="col-6">
                                    <button type="button" class="btn btn-close-modal w-100" data-bs-dismiss="modal">Close</button>
                                </div>

                                <div class="col-6">
                                    <button type="button" class="btn btn-submit-modal w-100 btn-new-event" >New Event</button>
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
        
        
        <!-- Modal New Event -->
        <div class="modal fade" id="newEventModal" tabindex="-1" role="dialog" aria-labelledby="overtimeApproveModalLabel" aria-hidden="true"  data-bs-backdrop="static" data-bs-keyboard="false">
            <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content rounded-4 border-0">
                    
                    <div class="modal-header border-0 py-4 pt-3">
                        <h5 class="modal-title fs-18 fw-light">New Event</h5>
                    </div>

                    <div class="modal-body p-0 border-0 ">


                        <div class="wrapper-form px-4 scrollbar-transparent">

                            <form action="" id="form-new-event" class="needs-validation" novalidate enctype="multipart/form-data"  >

                                @csrf


                                <div class="mb-3">
                                    <div class="row">
                                        <div class="col-9">
                                            <label for="event-title" class="form-label fs-14">Title</label>
                                            <input type="text" class="form-control" name="event_title" id="event-title"  />
                                        </div>
                                        <div class="col-3">
                                            <label for="event-color" class="form-label fs-14">Color</label>
                                            <input type="hidden" name="event_color" id="event-color" value="">

                                            <div class="dropdown dropdown-color"> 
                                                <button class="btn btn-light bg-transparent border-0 dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                                    <div class="bg-custom-1 btn-dot-color p-2 rounded-circle d-inline-block"></div>
                                                </button>
                                                <ul class="dropdown-menu border-0 shadow">
                                                    @for ($i = 1; $i <= 7; $i++)
                                                        <li class="dropdown-item">
                                                            <div class="bg-custom-{{ $i }} dot-color p-2 rounded-circle d-inline-block mx-2"></div>
                                                        </li>
                                                    @endfor
                                                    
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                    
                                </div>

                                <div class="mb-3">
                                    <label for="event-description" class="form-label fs-14">Description</label>
                                    <textarea class="form-control" name="event_description" id="event-description" rows="3"></textarea>
                                </div>

                                <div class="mb-3">
                                    <div class="row">
                                        <div class="col-6">
                                            <label for="start-date" class="form-label fs-14">Start Date</label>
                                            <input type="date" class="form-control" name="start_date" id="start-date"  />
                                        </div>
                                        <div class="col-6">
                                            <label for="end-date" class="form-label fs-14">End Date</label>
                                            <input type="date" class="form-control" name="end_date" id="end-date"  />
                                        </div>
                                    </div>
                                </div>

                                <div class="mb-3">
                                    <div class="row">
                                        <div class="col-6">
                                            <label for="start-time" class="form-label fs-14">Start Time</label>
                                            <input type="time" class="form-control" name="start_time" id="start-time"  />
                                        </div>
                                        <div class="col-6">
                                            <label for="end-time" class="form-label fs-14">End Time</label>
                                            <input type="time" class="form-control" name="end_time" id="end-time"  />
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
        <script src="{{ asset('asset/js/date_helper.js?='.time()) }}"></script>
        <script src="{{ asset('asset/js/calendar.js?='.time()) }}"></script>
    </x-slot>

</x-office-layout>
