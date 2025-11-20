<x-office-layout>
    <x-slot name="menu_active">
        {{ __('hub_division') }}
    </x-slot>
    <x-slot name="head_stitle_slot">
        {{ __('Hub Division') }}
    </x-slot>
    <x-slot name="head_slot">
        <link href="{{ asset('asset/css/hub_division.css?v' . time()) }}" rel="stylesheet">
    </x-slot>

    <div class="title-content">
        <div class="d-flex align-items-center gap-3">
            <div class="w-100">
                <h2 class="text-title-content">Hub Division</h2>
            </div>
        </div>

    </div>

    <div class="calendar-container">
        <div class="row">
            <div class="employee-card-content overflow-hidden">
                <div class="header-employe-card">
                    <div class="dropdown dropdown-division">
                        <div class="dropdown-toggle btn btn-dropdown-division ps-0" type="button"
                            data-bs-toggle="dropdown" aria-expanded="false">

                            <div class="d-inline-flex align-items-center">
                                <span class="selected-division-text">All Division</span>
                            </div>

                        </div>

                        <ul class="dropdown-menu border-0 shadow-sm bg-default-1 rounded-3">
                            <li class="dropdown-item division-item fs-14" data-division-id="all">
                                <div class="dropdown-item fs-14">
                                    All Division
                                </div>
                            </li>
                            @foreach($divisions as $division)
                            <li class="dropdown-item division-item fs-14" data-division-id="{{ $division->id }}">
                                <div class="dropdown-item fs-14">
                                    {{ $division->name_division }}
                                </div>
                            </li>
                            @endforeach
                        </ul>
                    </div>
                </div>
                <div class="employee-list">
                    @foreach($employee as $emp)
                    <div class="employee-item" data-employee-division="{{ $emp->division_id }}" data-employee-id="{{ $emp->id }}">
                        <div class="employee-photo">
                            @if($emp->profile_picture)
                                <img src="{{ asset('storage/' . $emp->profile_picture) }}" alt="{{ $emp->name }}">
                            @elseif($emp->photo)
                                <img src="{{ asset('storage/' . $emp->photo) }}" alt="{{ $emp->name }}">
                            @elseif($emp->user_photo)
                                <img src="{{ asset('storage/' . $emp->user_photo) }}" alt="{{ $emp->name }}">
                            @else
                                <img src="{{ asset('asset/images/default-avatar.png') }}" alt="{{ $emp->name }}">
                            @endif
                        </div>
                        <div class="employee-info">
                            <div class="employee-name">{{ $emp->name }}</div>
                            <div class="employee-job">{{ $emp->job_name }}</div>
                        </div>
                    </div>
                    @endforeach
                </div>
            </div>

            <div class="calendar-card-content overflow-hidden">
                <div class="header-calendar">
                    <div class="d-flex align-items-center">
                        <div class="month-year w-100">

                            <div class="dropdown dropdown-month">
                                <div class="dropdown-toggle btn btn-dropdown-month ps-0" type="button"
                                    data-bs-toggle="dropdown" aria-expanded="false">

                                    <div class="d-inline-flex align-items-center">
                                        <span class="calendar-month">{{ date('F') }}</span>
                                        <span class="calendar-year">{{ date('Y') }}</span>
                                    </div>

                                </div>

                                <ul class="dropdown-menu border-0 shadow-sm bg-default-1 rounded-3">
                                    @for ($monthNum = 1; $monthNum <= 12; $monthNum++)
                                        <li data-month="{{ $monthNum }}" class="dropdown-item month-item fs-14">
                                            <div class="dropdown-item fs-14">
                                                {{ date('F', mktime(0, 0, 0, $monthNum, 1)) 
                                            }}</div>
                                        </li>
                                    @endfor

                                </ul>
                            </div>


                        </div>
                        <div class="box-view-control white-space-nowrap">

                            <span class="material-symbols-outlined calendar-prev-month">chevron_left</span>
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
        </div>
    </div>

    <x-slot name="body_end_slot">

    </x-slot>


    <x-slot name="script_slot">
        <script src="{{ asset('asset/js/hub_division.js?=' . time()) }}"></script>
        <script src="{{ asset('asset/js/date_helper.js?=' . time()) }}"></script>
    </x-slot>

</x-office-layout>
