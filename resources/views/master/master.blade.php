<x-office-layout>
    <x-slot name="menu_active">
        {{ 'master' }}
    </x-slot>
    <x-slot name="head_slot">
    <meta name="app-url" content="{{ url('/') }}">
    </x-slot>

    <div class="title-content">
        <h2>Master Data</h2>
    </div>

    <div class="row g-3 mt-3">
        <div class="col-6 col-sm-6 col-lg-3">
            <div class="body-content rounded-4 p-5 d-flex justify-content-center align-items-center h-100 position-relative" style="min-height: 180px;">
                <a href="{{ url('department') }}" class="text-decoration-none text-dark d-flex flex-column align-items-center stretched-link">
                    <h5 class="mb-0">Department</h5>
                    <small class="text-secondary mt-2">View Data</small>
                </a>
            </div>
        </div>
        <div class="col-6 col-sm-6 col-lg-3">
            <div class="body-content rounded-4 p-5 d-flex justify-content-center align-items-center h-100 position-relative" style="min-height: 180px;">
                <a href="{{ url('partner') }}" class="text-decoration-none text-dark d-flex flex-column align-items-center stretched-link">
                    <h5 class="mb-0">Partner</h5>
                </a>
            </div>
        </div>
        <div class="col-6 col-sm-6 col-lg-3">
            <div class="body-content rounded-4 p-5 d-flex justify-content-center align-items-center h-100 position-relative" style="min-height: 180px;">
                <a href="{{ url('division') }}" class="text-decoration-none text-dark d-flex flex-column align-items-center stretched-link">
                    <h5 class="mb-0">Site</h5>
                </a>
            </div>
        </div>
        <div class="col-6 col-sm-6 col-lg-3">
            <div class="body-content rounded-4 p-5 d-flex justify-content-center align-items-center h-100 position-relative" style="min-height: 180px;">
                <a href="{{ url('job') }}" class="text-decoration-none text-dark d-flex flex-column align-items-center stretched-link">
                    <h5 class="mb-0">Job</h5>
                </a>
            </div>
        </div>
        <div class="col-6 col-sm-6 col-lg-3">
            <div class="body-content rounded-4 p-5 d-flex justify-content-center align-items-center h-100 position-relative" style="min-height: 180px;">
                <a href="{{ url('user') }}" class="text-decoration-none text-dark d-flex flex-column align-items-center stretched-link">
                    <h5 class="mb-0">User</h5>
                </a>
            </div>
        </div>
    </div>
</x-office-layout>
