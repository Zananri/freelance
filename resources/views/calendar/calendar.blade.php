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
                <div>
                    <button id="btn-show-config" class=" btn btn-default d-inline-flex align-items-center" type="button">
                        <span class="material-symbols-outlined icon" type="button">settings</span>
                        <span class="text-button">Config</span>
                    </button>
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
        <div class="modal fade" id="modalConfig" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="modalConfigLabel" aria-hidden="true">
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
        
    </x-slot>


    <x-slot name="script_slot"> 
        <script src="{{ asset('asset/js/calendar.js?='.time()) }}"></script>
    </x-slot>

</x-office-layout>
