<x-office-layout>
    <x-slot name="menu_active">
        {{ __('settings') }}
    </x-slot>
    <x-slot name="head_stitle_slot">
        {{ __('Settings') }}
    </x-slot>
    <x-slot name="head_slot">
        <link href="{{ asset('asset/css/settings.css?v'.time()) }}" rel="stylesheet">
    </x-slot>

    <div class="title-content">
        <h2 class="text-title-content" >Settings</h2>
    </div>

    <div class="settings-container">
        <div class="row">

            <di class="col-12 col-md-8 col-user-management"> 

                <div class="card-content  ">

                    <div class="header-card-content">
                        <div class="box-header-card-content">
                            <div class="col-action">
                                <h3 class="text-card-title">User Management</h3>
                            </div>
                            <div class="col-action">
                                <div class="box-input">
                                    <input type="text" class="input-card-action search-query">
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="box-card-table position-relative">

                        <table id="table-user-management" class="table table-striped table-hover">
                            <thead>
                                <tr>
                                    <th scope="col" class="ps-4">User</th>
                                    <th scope="col" class="d-none d-md-table-cell">Role</th>
                                    <th scope="col"></th>
                                </tr>
                            </thead>
                            <tbody >

                                <tr>
                                    <td colspan="3 p-5">
                                        <div class="p-5"></div>
                                    </td>
                                </tr>

                                <tr class="d-none">
                                    <td>
                                        <div>
                                            <div class="d-flex align-items-center">
                                                <div class="employee-image">
                                                </div>
                                                <div class="employee-name">
                                                    Employee Name
                                                    <div class="user-role d-table-cell d-md-none " >
                                                        User type & User Role
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="d-none d-md-table-cell">User type & User Role</td>
                                    <td class="text-end">
                                        <div class="btn-action btn-edit-role">
                                            <span class="material-symbols-outlined">edit</span>
                                        </div>
                                    </td>
                                </tr>

                                


                            </tbody>
                        </table>

                        <div class="loader" >
                            <div class="box-loader" >
                                <div class="text-center">
                                    <div class="spinner-border text-secondary" role="status">
                                        <span class="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                    </div>

                    <div id="box-pagination"></div>

                </div>
            </di>

            <div class="col-12 col-md-4 col-configuration">
  
            </div>

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
                                        <option value="ADMINISTRATOR">ADMINISTRATOR</option>
                                        <option value="CEO">CEO</option>
                                        <option value="GENERAL_MANAGER">GENERAL MANAGER</option>
                                        <option value="MANAGER">MANAGER</option>
                                        <option value="LEADER">LEADER</option>
                                        <option value="HR_MANAGER">HR MANAGER</option>
                                        <option value="FINANCE_MANAGER">FINANCE MANAGER</option>
                                        <option value="PERSONAL_ASSISTANT">PERSONAL ASSISTANT</option>
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
        <script src="{{ asset('asset/js/settings.js?='.time()) }}"></script>
    </x-slot>

</x-office-layout>
