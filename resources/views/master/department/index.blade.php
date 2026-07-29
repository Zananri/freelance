<x-office-layout>
    <x-slot name="menu_active">
        {{ 'master' }}
    </x-slot>

    <x-slot name="head_slot">
        <link href="{{ asset('asset/css/department.css?v=' . time()) }}" rel="stylesheet">
    </x-slot>

    <div class="title-content d-flex align-items-center gap-2">
        <div class="nav-item d-inline-block">
            <div class="nav-icon-arrow">
                <a href="{{ url('master') }}" class="text-decoration-none text-dark d-flex align-items-center">
                    <span class="material-symbols-outlined">arrow_back</span>
                </a>
            </div>
        </div>
        <div>
            <h2 class="m-0">Department</h2>
            <small class="text-secondary">Data referensi department</small>
        </div>
    </div>

    <div class="body-content scrollable-container rounded-4 px-3 py-3" style="margin-top: 20px; width: 100%;">
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
            <div>
                <h5 class="mb-1 table-title">List Department</h5>
                <small class="text-secondary">Data ini hanya dapat dilihat.</small>
            </div>

            <div class="d-flex gap-1">
                <div class="input-group search-input-container">
                    <input type="text" id="departmentSearchInput" class="form-control input-text border-0"
                        placeholder="Search department" style="height: 40px;">
                </div>
                <div class="dropdown dropdown-filter-container">
                    <button class="btn btn-icon-toggle dropdown-toggle border-0" type="button"
                        data-bs-toggle="dropdown" aria-expanded="false">
                        <span class="material-symbols-outlined icon">filter_list</span>
                        <span class="btn-text">Filter</span>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-filter" style="min-width: 150px;">
                        <li><a class="dropdown-item department-filter active" href="#" data-status="ALL">{{ __('general.all') }}</a></li>
                        <li><a class="dropdown-item department-filter" href="#" data-status="ACTIVE">{{ __('general.active') }}</a></li>
                        <li><a class="dropdown-item department-filter" href="#" data-status="INACTIVE">{{ __('general.inactive') }}</a></li>
                    </ul>
                </div>
            </div>
        </div>

        <div class="table-responsive">
            <div class="table-scroll-wrapper">
                <table class="table table-borderless align-middle table-transparent">
                    <thead>
                        <tr>
                            <th scope="col" style="width: 64px;"></th>
                            <th scope="col">Department Name</th>
                            <th scope="col">Description</th>
                            <th scope="col">Status</th>
                        </tr>
                    </thead>
                    <tbody id="departmentReadonlyTableBody">
                        <tr>
                            <td colspan="4" class="text-center text-secondary py-4">Loading...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <x-slot name="script_slot">
        <script src="{{ asset('asset/js/department-readonly.js?v=' . time()) }}"></script>
    </x-slot>
</x-office-layout>
