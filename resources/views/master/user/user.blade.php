<x-office-layout>
    <x-slot name="menu_active">
        {{ __('user') }}
    </x-slot>
    <x-slot name="head_slot">
        <link href="{{ asset('asset/css/user.css') }}" rel="stylesheet">
    </x-slot>

    <div class="title-content d-flex align-items-center gap-2">
        <h2 class="m-0">User</h2>
    </div>

    <div class="body-content scrollable-container rounded-4 px-3 py-3">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h5 class="mb-0 table-title">List User</h5>

        </div>

        <div class="table-responsive">
            <table class="table table-borderless align-middle table-transparent">
                <thead>
                    <tr>
                        <th scope="col">User</th>
                        <th scope="col">User Type</th>
                        <th scope="col">User Role</th>
                        <th scope="col"></th>
                    </tr>
                </thead>
                <tbody id="userTableBody">
                    <!-- Data will be populated by AJAX -->
                </tbody>
            </table>
        </div>

        <!-- User Detail Modal -->
        <div class="modal fade" id="userDetailModal" tabindex="-1" aria-labelledby="userDetailModalLabel"
            aria-hidden="true">
            <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                    <div class="modal-content">
                        <div class="modal-loading-overlay d-none" id="resetPasswordLoader">
                            <div class="loader-spinner"></div>
                        </div>
                        <div class="modal-header modal-header-custom">
                            <h5 class="modal-title modal-title-custom" id="userDetailModalLabel">User Detail</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="user-detail-modal">
                                <div class="user-photo-name-email">
                                    <img id="detailUserPhoto" src="" alt="User Photo" class="user-photo">
                                    <p class="user-name" id="detailUserName"></p>
                                    <p class="user-email" id="detailUserEmail"></p>
                                </div>
                                <div class="user-detail-columns">
                                    <div class="user-detail-left">
                                        <p><strong>User Type:</strong> <span id="detailUserType"></span></p>
                                        <p><strong>User Role:</strong> <span id="detailUserRole"></span></p>
                                        <p><strong>Birth Date:</strong> <span id="detailBirthDate"></span></p>
                                        <p><strong>Phone:</strong> <span id="detailPhone"></span></p>
                                        <p><strong>Address:</strong> <span id="detailAddress"></span></p>
                                    </div>
                                    <div class="user-detail-right">
                                        <p><strong>Department:</strong> <span id="detailEmployeeDepartment"></span></p>
                                        <p><strong>Division:</strong> <span id="detailEmployeeDivision"></span></p>
                                        <p><strong>Job:</strong> <span id="detailEmployeeJob"></span></p>
                                        <p><strong>Hire Date:</strong> <span id="detailHireDate"></span></p>
                                        <p><strong>Grade:</strong> <span id="detailGrade"></span></p>
                                        <p><strong>Office:</strong> <span id="detailEmployeeOffice"></span></p>
                                        <p><strong>Status:</strong> <span id="detailEmployeeStatus"></span></p>
                                    </div>
                                </div>
                            </div>
                            <div class="d-flex justify-content-center mt-3 position-relative">
                                <button type="button" class="btn-submit-black btn-submit-custom" id="btnResetPassword">
                                    <span class="material-symbols-outlined">autorenew</span> Reset Password
                                </button>
                            </div>
                        </div>
                        <div class="alert-container mt-2" style="width: 100%;"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <x-slot name="script_slot">
        <script src="{{ asset('asset/js/user.js') }}"></script>
    </x-slot>
</x-office-layout>
