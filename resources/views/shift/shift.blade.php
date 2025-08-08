<x-office-layout>
    <x-slot name="menu_active">
        {{ __('shift') }}
    </x-slot>
    <x-slot name="head_slot">
        <link href="{{ asset('asset/css/shift.css') }}" rel="stylesheet">
    </x-slot>

    <div class="title-content d-flex align-items-center gap-2">
        <h2 class="m-0 mb-3">Shift</h2>
    </div>

    <div class="body-content scrollable-container rounded-4 px-3 py-3">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h5 class="mb-0 table-title">Employee List</h5>
        </div>

        <div class="table-responsive">
            <div class="table-scroll-wrapper">
                 <table class="table table-borderless align-middle table-transparent">
                <thead>
                    <tr>
                        <th scope="col" width="100%">Employee</th>
                    </tr>
                </thead>
                <tbody id="shiftTableBody">
                    <!-- Data will be loaded here -->
                </tbody>
            </table>
        </div>
    </div>

    <x-slot name="script_slot">
        <script src="{{ asset('asset/js/shift.js') }}"></script>
    </x-slot>
</x-office-layout>
