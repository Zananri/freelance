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
                    <button class="btn btn-default d-inline-flex align-items-center" type="button">
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
                                <div class="d-inline-flex align-items-center">
                                    <span class="calendar-month">{{ date('F') }}</span>
                                    <span class="calendar-year">{{ date('Y') }}</span>
                                    <span class="material-symbols-outlined calendar-prev-month ms-4">chevron_left</span>
                                    <span class="material-symbols-outlined calendar-next-month">chevron_right</span>
                                </div>
                            </div>
                            <div class="box-view-control">
                                {{-- <div>
                                    <div class="dropdown">
                                        <button class="btn btn-default-dropdown fs-14 dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                            Month
                                        </button>
                                        <ul class="dropdown-menu border-0 shadow-sm bg-default-1">
                                            <li><a class="dropdown-item fs-14" href="#">Action</a></li>
                                            <li><a class="dropdown-item fs-14" href="#">Another action</a></li>
                                            <li><a class="dropdown-item fs-14" href="#">Something else here</a></li>
                                        </ul>
                                    </div>
                                </div> --}}
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
        <div class="modal fade" id="modalEdit" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="modalEditLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">

                    <div class="modal-body position-relative">

                        <div class="text-center mb-3">
                            <button type="button" class="btn-close btn-sm float-end mt-2" data-bs-dismiss="modal" aria-label="Close"></button>
                            <h1 class="modal-title" id="modalEditLabel">User Management</h1>
                        </div>
                        <div class="mb-4 p-3">

                            <div class="box-user-photo text-center mb-3">
                                <img class="employee-photo rounded-circle" src="" class="rounded-circle">
                            </div>

                            <div class="text-center mb-4">
                                <h3 class="employee-name">Employee Name</h3>
                            </div>

                            <form id="form-edit-user" action="" novalidate="" method="POST">
                                @csrf
                                <input type="hidden" name="employee_id" value="">
                                <input type="hidden" name="user_id" value="">
                               
                                <div class="select-user-type mb-3"> 
                                    <label for="user-type" class="form-label">User Type</label>
                                    <select id="user-type" name="user_type" class="form-select">
                                        <option value="ADMINISTRATOR">ADMINISTRATOR</option>
                                        <option value="REGULAR">REGULAR</option>
                                        <option value="MANAGEMENT">MANAGEMENT</option>
                                    </select>
                                </div>

                                <div class="select-user-role mb-4">
                                    <label for="user-role" class="form-label">User Role</label>
                                    <select id="user-role" name="user_role" class="form-select">
                                        <option value="GENERAL_MANAGER">GENERAL MANAGER</option>
                                        <option value="MANAGER">MANAGER</option>
                                        <option value="LEADER">LEADER</option>
                                        <option value="HR_MANAGER">HR MANAGER</option>
                                        <option value="FINANCE_MANAGER">FINANCE MANAGER</option>
                                        <option value="EMPLOYEE">EMPLOYEE</option>
                                    </select>
                                </div>

                            </form>

                        </div>
                        <div class="p-3">
                            <div class="row">
                                <div class="col-6">
                                    <div class="btn btn-default border-0 w-100 p-2" data-bs-dismiss="modal">Close</div>
                                </div>
                                <div class="col-6">
                                    <button type="submit" class="btn border-0 btn-submit w-100 p-2">Save</button>
                                </div>
                            </div>
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
        
    </x-slot>


    <x-slot name="script_slot"> 
        <script src="{{ asset('asset/js/calendar.js?='.time()) }}"></script>
    </x-slot>

</x-office-layout>
