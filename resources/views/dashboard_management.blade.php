<x-office-layout>
    <x-slot name="menu_active">
        {{ __('dashboard') }}
    </x-slot>
    <x-slot name="head_slot">
        <link href="{{ asset('asset/css/dashboard_management.css')}}?v={{time()}}" rel="stylesheet">
    </x-slot>

    <div class="title-content">
        <h2>Dashboard</h2>
    </div>

    <div class="content-container scrollbar-transparent pe-3">
        
        <div>
            <div class="row">
                <div class="col-md-6 pb-4">
                    <div class="row mb-3">
                        <div class="col-12 col-md-4 mb-3">
                            <div class="card-content p-3">
                                <h3 class="fs-4  fw-light text-body text-opacity-75">Total</h3>
                                <div class="text-end">
                                    <h1 class="display-5">{{$total_employee}}</h1>
                                    <div class="fs-12 text-body text-opacity-50">employee</div>
                                </div>
                            </div>
                        </div>

                        <div class="col-12 col-md-8 mb-3 scrollbar-transparent col-division-total">
                            <div class="row">

                                @foreach ($division_total as $itemDivision)
                                    
                                    <div class="col-6 mb-3">
                                        <div class="bg-default-1  rounded-3 p-2 pt-2 pb-0">
                                            <div class="d-flex justify-content-between">
                                                <div>
                                                    <h3 class="fs-12  fw-normal text-body text-opacity-75">
                                                        {{ $itemDivision->name_division }}
                                                    </h3>
                                                </div>
                                                <div class="text-end">
                                                    <h4 class="p-0 m-0 fs-14 fw-normal">{{ $itemDivision->total_employee }}</h4>
                                                    <div class="fs-10 text-body text-opacity-50">employee</div>
                                                </div>

                                            </div>
                                            
                                            
                                        </div>
                                    </div>

                                @endforeach
                                
                            </div>

                        </div>
                        
                        
                    </div>
                    <div class="row">
                        <div class="col-12 pe-0 pb-0">
                            <div>
                                <h2 class="fw-normal fs-18 text-body text-opacity-75">Project</h2>
                            </div>
                            <style>

                                .box-project{
                                    max-height: calc(100vh - 415px);
                                }

                                .item-project .image-project{
                                    height: 32px;
                                    width: 32px;
                                }

                                .item-project .title-project{
                                    cursor: pointer;
                                }

                                .item-project .image-project-assign{
                                    height: 24px;
                                    width: 24px;
                                    margin-right: -10px;
                                    border:2px solid #F0F1F8;
                                    position: relative;
                                    z-index: 1;
                                    cursor: pointer;
                                }
                                
                                .item-project .description-project{
                                    max-height: 55px;
                                }

                                .item-project .image-project-assign:hover{
                                    z-index: 2;
                                }

                            </style>
                            <div class="box-project pe-3 pb-3 scrollbar-transparent overflow-auto">
                                <div class="row">

                                    @foreach ($project as $itemProject)
                                        
                                        <div class="col-12 col-md-6 col-project-item mb-3" data-project="{{ $itemProject->id }}">
                                            <div class="card-content p-3 pb-2 item-project">
                                                <div class="item-header mb-2">
                                                    <div class="d-flex align-items-start gap-2">
                                                        @if ($itemProject->image)
                                                            <div>
                                                                <img class="image-project rounded-circle object-fit-cover me-1" src="{{ asset('file/project/'.$itemProject->image) }}" alt="">
                                                            </div>
                                                        @endif
                                                        
                                                        <div>
                                                            <h2 class="title-project fs-14 fw-normal text-body">
                                                                {{ $itemProject->title }}
                                                            </h2>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="item-body border-bottom border-opacity-50 mb-2 pb-2">
                                                    <div class="description-project fs-12 fw-normal text-body text-opacity-75 scrollbar-transparent overflow-auto">
                                                        {{ strip_tags($itemProject->description) }}
                                                    </div>
                                                </div>
                                                <div class="item-footer">
                                                    <div class="d-flex align-items-center justify-content-between">
                                                        <div>
                                                            {{-- @php
                                                                $projectAassignment = json_decode($itemProject->project_assignment);
                                                            @endphp --}}

                                                            {{-- @for ($i = 0; $i < count($projectAassignment); $i++)
                                                                <img class="image-project-assign rounded-circle object-fit-cover" src="http://localhost/nsa-office/public/file/project/PROJECT_1752641369.jpg" alt="" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="{{ $projectAassignment[$i]->role }}">   
                                                            @endfor
                                                            @foreach ($projectAassignment as $itemProjectAssignment)
                                                                <img class="image-project-assign rounded-circle object-fit-cover" src="http://localhost/nsa-office/public/file/project/PROJECT_1752641369.jpg" alt="" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="{{ $itemProjectAssignment }}">   
                                                            @endforeach --}}
                                                            {{-- <img class="image-project-assign rounded-circle object-fit-cover" src="http://localhost/nsa-office/public/file/project/PROJECT_1752641369.jpg" alt="" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Co Author">
                                                            <img class="image-project-assign rounded-circle object-fit-cover" src="http://localhost/nsa-office/public/file/project/PROJECT_1752641369.jpg" alt="" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Contributor">
                                                             --}}
                                                        </div>
                                                        <div class="">
                                                            <div class="fs-10 text-body text-opacity-50">
                                                                {{ $itemProject->total_task }} Task
                                                                
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                    @endforeach

                                    
                                </div>
                                

                            </div>
                            
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card-content">
                        <input type="hidden" name="current_employee" value="{{ $current_employee->id }}">
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
                                    
                                    <span class="material-symbols-outlined calendar-prev-month">chevron_left</span>
                                    <span class="material-symbols-outlined calendar-next-month">chevron_right</span>
                                    <span class="material-symbols-outlined calendar-event-list ms-4">lists</span>
                                </div>
                            </div>
                        </div>

                        <div class="box-table-calendar rounded-bottom-4 overflow-hidden">

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
                </div>
            </div>
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

        <!-- Modal Calendar All -->
        <div class="modal fade" id="calendarAllModal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="calendarAllModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content p-0">

                    <div class="modal-body position-relative p-0">
                        <div class="p-4">
                            <div class="d-flex gap-3 align-items-center">
                                <div class="fs-16 fw-light white-space-nowrap">
                                    <span class="calendar-month"></span>
                                    <span class="calendar-year"></span>
                                </div>
                                <div class="w-100 ps-5">
                                    <input type="text" class="form-control input-search-event-day" id="search-event-all">
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
                                
                                <div class="col-12">
                                    <button type="button" class="btn btn-close-modal w-100" data-bs-dismiss="modal">Close</button>
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
        </div>


        <!-- Modal Calendar Day -->
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
                                
                                <div class="col-12">
                                    <button type="button" class="btn btn-close-modal w-100" data-bs-dismiss="modal">Close</button>
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
        </div>

        <!-- Modal Event Detail -->
        <div class="modal fade" id="eventDetailModal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="eventDetailModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content p-0">

                    <div class="modal-body position-relative p-0">
                        <div class="box-header-event rounded-top-4">
                            <div class="p-4 pb-3 bg-white bg-opacity-40  rounded-top-4">
                                
                                <div class="d-flex gap-3 align-items-center justify-content-between w-100">
                                    <div class="w-100">
                                        <span class="text-event-title fs-16 fw-medium" ></span>
                                    </div>
                                    <div class="">
                                        <div class="white-space-nowrap fs-12">
                                        </div>
                                    </div>
                                    
                                </div>  

                                <div class="d-flex gap-3 align-items-center justify-content-between w-100">
                                    <div class="text-event-date fs-10 fw-normal  "></div>
                                    <div class="text-event-time fs-10 fw-normal  "></div>
                                    
                                </div>                            
                            </div>
                        </div>
                        
                        <div class="p-4 pt-3">
                            <div class="text-event-description fs-14 fw-normal"></div>
                        </div>

                        <div class="p-4 pb-1">
                            <div class="event-log">
                                <div class="d-flex gap-3 align-items-center w-100">
                                    <div class="event-by fs-10 fw-normal text-body text-opacity-50"></div>
                                    <div class="event-at fs-10 fw-normal text-body text-opacity-50"></div>
                                </div>
                            </div>
                        </div>
 

                        <div class="p-4 pt-1">
                            <div class="row">
                                
                                <div class="col-12">
                                    <button type="button" class="btn btn-close-modal w-100" >Close</button>
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
        </div>
        

    </x-slot>
    
    <x-slot name="script_slot">
        <script src="{{ asset('asset/js/date_helper.js?='.time()) }}"></script>
        <script src="{{ asset('asset/js/dashboard_management.js') }}?v={{ time() }}"></script>

    </x-slot>

</x-office-layout>
