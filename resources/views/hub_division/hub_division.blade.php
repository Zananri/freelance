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
                        <button class="dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                            <span class="selected-division-text">All Division</span>
                        </button>

                        <ul class="dropdown-menu border-0 shadow-sm bg-default-1 rounded-3">
                            <li class="dropdown-item division-item" data-division-id="all">
                                All Division
                            </li>
                            @foreach ($divisions as $division)
                                <li class="dropdown-item division-item" data-division-id="{{ $division->id }}">
                                    {{ $division->name_division }}
                                </li>
                            @endforeach
                        </ul>
                    </div>
                </div>
                <div class="header-barier"></div>
                <div class="employee-list">
                    @foreach ($employee as $emp)
                        @php
                            // hitung photo url dan task count sederhana (fallback 0)
                            $photoUrl = asset('asset/img/avatar.png');
                            if ($emp->profile_picture) {
                                $photoUrl = asset($emp->profile_picture);
                            } elseif ($emp->photo) {
                                $photoUrl = asset($emp->photo);
                            } elseif ($emp->user_photo) {
                                $photoUrl = asset($emp->user_photo);
                            }
                            $taskCount = $emp->tasks_count ?? 0;
                        @endphp

                        <div class="employee-item" data-employee-division="{{ $emp->division_id }}"
                            data-employee-id="{{ $emp->id }}" data-employee-photo="{{ $photoUrl }}"
                            data-total-task="{{ $taskCount }}">
                            <div class="employee-photo">
                                <img src="{{ $photoUrl }}" alt="{{ $emp->name }}">
                            </div>
                            <div class="employee-info">
                                <div class="    ">{{ $emp->name }}</div>
                                <div class="employee-job">{{ $emp->job_name }}</div>
                            </div>
                        </div>
                    @endforeach
                </div>
            </div>

            <div class="calendar-card-content overflow-hidden">
                <div class="header-calendar">
                    <div class="d-flex align-items-center justify-content-between mb-2">
                        <div class="selected-employee-info d-flex align-items-center gap-2">
                            <img src="" class="selected-employee-photo d-none me-2">

                            <div class="d-flex flex-column">
                                <span class="selected-employee-name"></span>
                                <small class="selected-employee-task"></small>
                            </div>
                        </div>
                        <div class="d-flex justify-content-end align-items-center">
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
                                            <li data-month="{{ $monthNum }}"
                                                class="dropdown-item month-item fs-14">
                                                <div class="dropdown-item fs-14">
                                                    {{ date('F', mktime(0, 0, 0, $monthNum, 1)) }}</div>
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
                </div>

                <div class="box-table-calendar">

                    <div class="calendar-placeholder text-center py-5" style="color: #797E91;">
                        <span class="material-symbols-outlined"
                            style="font-size: 48px; opacity: 0.3;">person_search</span>
                        <p class="mt-2" style="font-size: 14px;">Select an employee to view their tasks</p>
                    </div>

                    <table class="table-calendar" style="display: none;">
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
        <div class="modal fade" id="taskDetailModal" tabindex="-1" aria-labelledby="taskDetailModalLabel"
            aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content modal-content-custom">
                    <div class="modal-body modal-body-custom">
                        <div id="taskDetailContent"></div>
                    </div>
                    <div class="modal-footer modal-footer-custom mt-3">
                        <button type="button" class="btn btn-custom-close" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    </x-slot>


    <x-slot name="script_slot">
        <script>
            const appUrl = "{{ url('') }}";
        </script>
        <script src="{{ asset('asset/js/hub_division.js?=' . time()) }}"></script>
        <script src="{{ asset('asset/js/date_helper.js?=' . time()) }}"></script>

        <script>
            // Initialize - calendar will render when employee is selected
            $(document).ready(function() {
                // Set initial month/year display
                const monthNames = ["January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"
                ];
                $('.calendar-month').text(monthNames[currentDate.getMonth()]);
                $('.calendar-year').text(currentDate.getFullYear());

                // Handler: show selected-employee-info when an employee-item is clicked
                $(document).on('click', '.employee-item', function() {
                    const $this = $(this);
                    const name = $this.find('.employee-info > div').first().text().trim();
                    const photo = $this.data('employee-photo') || '';
                    const totalTask = $this.data('total-task') ?? 0;

                    $('.selected-employee-name').text(name);
                    $('.selected-employee-task').text('Total task: ' + totalTask);

                    if (photo) {
                        $('.selected-employee-photo').attr('src', photo).removeClass('d-none');
                    } else {
                        $('.selected-employee-photo').addClass('d-none');
                    }

                    $('.selected-employee-info').removeClass('d-none');
                });
            });
        </script>
    </x-slot>

</x-office-layout>
