<x-office-layout>
    <x-slot name="menu_active">
        {{ __('document') }}
    </x-slot>
    <x-slot name="head_slot">
        <link href="{{ asset('asset/css/document.css') }}?v={{ date('YmdHi') }}" rel="stylesheet">
    </x-slot>

    <!-- SVG Symbols -->
    <svg xmlns="http://www.w3.org/2000/svg" style="display: none;">
        <symbol id="check-circle-fill" fill="currentColor" viewBox="0 0 16 16">
            <path
                d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
        </symbol>
        <symbol id="info-fill" fill="currentColor" viewBox="0 0 16 16">
            <path
                d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
        </symbol>
        <symbol id="exclamation-triangle-fill" fill="currentColor" viewBox="0 0 16 16">
            <path
                d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
        </symbol>
    </svg>

    <div class="title-content mb-3">
        <div class="d-flex align-items-center">
            <div class="w-100">
                <h2 class="text-title-content">Documents</h2>
            </div>
            <div class="view-switcher me-2">
                <div class="switch-indicator"></div>

                <button class="switch-btn active" data-view="table">
                    <span class="material-symbols-outlined">table_rows</span>
                </button>

                <button class="switch-btn" data-view="grid">
                    <span class="material-symbols-outlined">grid_view</span>
                </button>
            </div>
            <div class="search-input-container">
                <span class="material-symbols-outlined search-icon">search</span>
                <input class="form-control custom-form-filter" type="text" name="search_filter" id="search_filter">
            </div>
            <div class="dropdown mx-2">
                <button class="btn btn-filter-document d-flex align-items-center dropdown-toggle no-caret" data-bs-toggle="dropdown">
                    <span class="material-symbols-outlined">filter_list</span>
                    <span class="ms-2">Filter</span>
                </button>
                <div class="dropdown-menu">
                    <div class="filter-item mb-1 px-1">
                        <label class="mb-1" for="">Owner</label>
                        <input type="text" class="form-control border-0">
                    </div>
                </div>
            </div>
            <div class="dropdown">
                <button class="btn btn-add-document px-3 py-2 dropdown-toggle no-caret" data-bs-toggle="dropdown">
                    <span class="material-symbols-outlined">add</span>
                </button>
                <div class="dropdown-menu">
                    <div class="dropdown-item add-doc">Add Folder</div>
                    <div class="dropdown-item add-doc">Add Files</div>
                </div>
            </div>
        </div>
    </div>

    {{-- Table View --}}
    <div class="body-content scrollable-container table-view rounded-4 p-3">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <table class="document-table">
                <thead>
                    <tr>
                        <th>
                            Name
                            <span class="material-symbols-outlined">swap_vert</span>
                        </th>
                        <th>
                            Owner
                            <span class="material-symbols-outlined">swap_vert</span>
                        </th>
                        <th>
                            File Size
                            <span class="material-symbols-outlined">swap_vert</span>
                        </th>
                        <th>
                            Last Update
                            <span class="material-symbols-outlined">swap_vert</span>
                        </th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td class="d-flex align-items-center">
                            <span class="material-symbols-outlined me-2">folder</span>
                            Payslip
                        </td>
                        <td>John Doe</td>
                        <td>-</td>
                        <td>20 June 2026</td>
                        <td></td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    {{-- Grid View --}}
    <div class="grid-view d-none mt-5">
        <div class="folder-wrapper">
            <div class="folder-shadow-tab"></div>
            <div class="folder-shadow"></div>
            <div class="folder-tab"></div>
            <div class="folder-body">
                <p class="folder-name">John Doe</p>
                <p class="folder-role">Data Analyst</p>
                <hr class="folder-divider">
                <div class="folder-footer">
                    <div class="folder-avatar"></div>
                    <span class="folder-items">4 Items</span>
                </div>
            </div>
        </div>

        <div class="folder-wrapper">
            <div class="folder-shadow-tab"></div>
            <div class="folder-shadow"></div>
            <div class="folder-tab"></div>
            <div class="folder-body">
                <p class="folder-name">Jane Smith</p>
                <p class="folder-role">UI Designer</p>
                <hr class="folder-divider">
                <div class="folder-footer">
                    <div class="folder-avatar"></div>
                    <span class="folder-items">7 Items</span>
                </div>
            </div>
        </div>
    </div>

    <div class="alert-delete-container mb-3" style="width: 100%;"></div>

    <x-slot name="script_slot">

        <script src="{{ asset('asset/js/document.js') }}?v={{ time() }}"></script>
        <script src="{{ asset('asset/js/date_helper.js') }}"></script>

        <script></script>
    </x-slot>


</x-office-layout>
