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
    </div>

    <x-slot name="script_slot">
        <script src="{{ asset('asset/js/user.js') }}"></script>
    </x-slot>
</x-office-layout>
