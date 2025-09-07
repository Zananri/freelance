<x-office-layout>
    <x-slot name="menu_active">
        {{ __('teams') }}
    </x-slot>
    <x-slot name="head_stitle_slot">
        {{ __('Teams') }}
    </x-slot>
    <x-slot name="head_slot">
        <link href="{{ asset('asset/css/teams.css?v'.time()) }}" rel="stylesheet">
    </x-slot>

    <div class="title-content">
        <div class="d-flex align-items-center">
            <div class="w-100">
                <h2 class="text-title-content" >Teams</h2>
            </div>
            <div>
                <input type="text" class="input-card-action search-query">
            </div>
        </div>
        

    </div>

    <div class="teams-container">

        @foreach ($department as $rowDepartment)
            <div class="card-department" data-department="{{ $rowDepartment->name_department }}">
                <div class="box-card-title">
                    <h3 class="text-card-title">{{ $rowDepartment->name_department }}</h3>
                </div>

                <div class="box-employee">
                    <div class="row">
                        
                        @foreach ($employee as $rowEmmployee)
                        
                            @if ($rowEmmployee->department_id == $rowDepartment->id)

                                <div class="col-12 col-md-4 col-employee">

                                    <div class="card-employee" data-emplpoyee="{{ $rowEmmployee->id }}">
                                        <div class="d-flex align-items-center">
                                            <div>
                                                <img class="employee-photo rounded-circle" src="{{ url($rowEmmployee->photo) }}" alt="{{ url($rowEmmployee->photo) }}">
                                            </div>
                                            <div class="w-100">
                                                <h4 class="employee-name">{{ $rowEmmployee->name }}</h4>
                                                <div class="employee-job">
                                                    {{ $rowEmmployee->job_name }}
                                                </div>
                                            </div>
                                            <div>
                                                <div class="btn-action">
                                                    <span class="material-symbols-outlined">
                                                        chevron_forward
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                </div>

                            @endif

                        @endforeach
                        
                    </div>
                </div>

            </div>
        @endforeach

        
    </div>
 
    

    <x-slot name="body_end_slot"> 
        
        <!-- Modal -->
        <div class="modal fade" id="modalView" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="modalViewLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">

                    <div class="modal-body position-relative">

                        <div class="text-center mb-3">
                            <button type="button" class="btn-close btn-sm float-end mt-2 me-1" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="mb-4 p-4 pt-0">

                            <div class="box-user-photo text-center mb-3">
                                <img class="employee-photo rounded-circle" src="" alt="" width="70" height="70" class="rounded-circle">
                            </div>

                            <div class="text-center mb-4">
                                <h3 class="employee-name">Employee Name</h3>
                                <div class="employee-grade">Analist</div>
                            </div>

                            <div class="personal-info">

                                <div class="info-item d-flex align-items-center gap-3 mb-4">
                                    <div class="icon-circle email">
                                        <span class="material-symbols-outlined">mail</span>
                                    </div>
                                    <div class="col-label-value">
                                        <div class="label">Email</div>
                                        <div class="value employee-email"></div>
                                    </div>
                                </div>

                                <div class="info-item d-flex align-items-start gap-3 mb-4">
                                    <div class="icon-circle phone">
                                        <span class="material-symbols-outlined">call</span>
                                    </div>
                                    <div class="col-label-value">
                                        <p class="label">Phone Number</p>
                                        <div class="value employee-phone"></div>
                                    </div>
                                </div>

                                <div class="info-item d-flex align-items-start gap-3 mb-4">
                                    <div class="icon-circle department">
                                        <span class="material-symbols-outlined">work</span>
                                    </div>
                                    <div class="col-label-value">
                                        <p class="label">Department & Division</p>
                                        <div class="value">
                                            <span class="employee-department"></span>
                                            <span>/</span>
                                            <span class="employee-division"></span>
                                        </div>

                                    </div>
                                </div>

                                <div class="info-item d-flex align-items-start gap-3 mb-4">
                                    <div class="icon-circle job">
                                        <span class="material-symbols-outlined">assignment</span>
                                    </div>
                                    <div class="col-label-value">
                                        <p class="label">Job</p>
                                        <div class="value employee-job"></div>
                                    </div>
                                </div>

                            </div>
                            

                        </div>
                        <div class="p-3">
                            <div class="row">
                                <div class="col-12">
                                    <div class="btn border-0 btn-default w-100 p-2" data-bs-dismiss="modal">Close</div>
                                </div>
                            </div>
                        </div>

                    </div> 

                </div>
            </div>
        </div>
        
    </x-slot>


    <x-slot name="script_slot"> 
        <script src="{{ asset('asset/js/teams.js?='.time()) }}"></script>
    </x-slot>

</x-office-layout>
