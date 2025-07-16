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
            <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable mx-auto" style="">
                    <div class="modal-content">
                        <div class="modal-header custom-modal-header">
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body text-center">
                            <div class="user-photo-name-email">
                                <img id="detailUserPhoto" src="" alt="User Photo" class="rounded-circle"
                                    style="width: 150px; height: 150px; object-fit: cover;">
                                <p class="user-name fw-semibold mt-3 mb-1" id="detailUserName"></p>
                                <p class="user-email text-muted mb-1" id="detailUserEmail"></p>
                            <p class="user-division text-muted" id="detailEmployeeDivision"></p>
                            <button type="button" class="btn btn-reset mt-3" id="btnResetPassword" title="Reset Password">
                                <span class="material-symbols-outlined">autorenew</span> Reset Password
                            </button>
                        </div>
                    </div>
                </div>
        </div>
        </div>
    </div>

    <div id="resetPasswordAlertContainer" class="position-fixed bottom-0 start-50 translate-middle-x mb-3" style="z-index: 1055; width: auto; max-width: 400px; display:none;">
        <!-- Alert will be injected here -->
    </div>

    <x-slot name="script_slot">
        <script src="{{ asset('asset/js/user.js') }}"></script>
    </x-slot>
</x-office-layout>
