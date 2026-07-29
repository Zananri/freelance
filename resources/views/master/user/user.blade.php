<x-office-layout>
    <x-slot name="menu_active">
        {{ __('user') }}
    </x-slot>
    <x-slot name="head_slot">
        <link href="{{ asset('asset/css/user.css?v=' . time()) }}" rel="stylesheet">
    </x-slot>

    <div class="title-content d-flex align-items-center gap-2">
        <div class="nav-item d-inline-block">
            <div class="nav-icon-arrow">
                <a href="{{ url('master') }}" class="text-decoration-none text-dark d-flex align-items-center">
                    <div class="d-flex">
                        <span class="material-symbols-outlined">arrow_back</span>
                    </div>
                </a>
            </div>
        </div>
        <h2 class="m-0">User</h2>
    </div>

    <div class="body-content scrollable-container rounded-4 px-3 py-3 mb-3">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h5 class="mb-0 table-title">List User</h5>
            <div class="search-input-container position-relative me-3">
                <span class="material-symbols-outlined search-icon">search</span>
                <input class="form-control custom-form-filter ps-5" type="text" name="search_filter"
                    id="search_filter">
            </div>
        </div>

        <div class="table-responsive user-list-table-wrapper">
            <table class="table table-borderless align-middle table-transparent">
                <thead>
                    <tr>
                        <th scope="col">User</th>
                        <th scope="col">User Type</th>
                        <th scope="col">User Role</th>
                        <th scope="col">Can Attendance</th>
                        <th scope="col"></th>
                    </tr>
                </thead>
                <tbody id="userTableBody">
                    <!-- Data will be populated by AJAX -->
                </tbody>
            </table>
        </div>

        <div class="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2"
            id="userPaginationWrap">
            <div class="user-pagination-info" id="userPaginationInfo"></div>
            <div class="user-pagination" id="userPagination"></div>
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
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Change Password Modal -->
        <div class="modal fade" id="changePasswordModal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1"
            aria-labelledby="changePasswordModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content modal-content-custom">
                    <div class="modal-header modal-header-custom">
                        <h5 class="modal-title modal-title-custom"
                            id="changePasswordModalLabel">{{ __('profile.change_password') }}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <form id="changePasswordForm" class="form-custom needs-validation" novalidate>
                        @csrf
                        <input type="hidden" id="changePasswordUserId">
                        <div class="modal-body modal-body-custom">
                            <div class="change-password-user-card">
                                <div class="change-password-user-icon">
                                    <span class="material-symbols-outlined">person</span>
                                </div>
                                <div class="change-password-user-info">
                                    <span class="change-password-user-label">User</span>
                                    <p class="change-password-user mb-0" id="changePasswordUserName"></p>
                                </div>
                            </div>
                            <div class="mb-3 custom-input">
                                <label for="changePasswordNew"
                                    class="form-label label-custom">{{ __('profile.new_password') }}</label>
                                <input type="password" class="form-control input-text" id="changePasswordNew"
                                    name="new_password" minlength="7" required autocomplete="new-password">
                                <div class="invalid-feedback">{{ __('profile.enter_new_password') }}</div>
                            </div>
                            <div class="mb-4 custom-input">
                                <label for="changePasswordConfirmation"
                                    class="form-label label-custom">{{ __('profile.confirm_password') }}</label>
                                <input type="password" class="form-control input-text" id="changePasswordConfirmation"
                                    name="new_password_confirmation" minlength="7" required
                                    autocomplete="new-password">
                                <div class="invalid-feedback"
                                    id="changePasswordFeedback"
                                    data-mismatch-message="{{ __('profile.password_not_match') }}">{{ __('profile.password_not_match') }}</div>
                            </div>
                        </div>
                        <div class="modal-footer modal-footer-custom">
                            <button type="button" class="btn-cancel-password"
                                data-bs-dismiss="modal">{{ __('general.cancel') }}</button>
                            <button type="submit" class="btn-submit-black" id="submitChangePassword">
                                {{ __('profile.change_password') }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <x-slot name="script_slot">
        <script src="{{ asset('asset/js/user.js?v=' . time()) }}"></script>
    </x-slot>
</x-office-layout>
