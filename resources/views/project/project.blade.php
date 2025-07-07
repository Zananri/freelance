<x-office-layout>
    <x-slot name="menu_active">
        {{ __('project') }}
    </x-slot>
    <x-slot name="head_slot">
        <link rel="stylesheet" href="{{ asset('asset/css/project.css') }}">
    </x-slot>
    <div class="title-content">
        <h2>Project</h2>
    </div>

    <div class="d-flex justify-content-end mb-3">
        <button class="btn-submit-black">Add data</button>
    </div>

    <div class="container my-4">
        <div class="row">
<div class="col-md-4 mb-4">
    <a href="#" class="card-link">
        <div class="card shadow-sm rounded-4 p-3 position-relative" style="background-color: rgb(240, 241, 248); border:0;">
            <div class="card-body">
                <div class="d-flex">
                    <div class="me-3">
                        <img src="{{ asset('asset/img/background/add-image.png') }}" alt="Project Image"
                            style="width: 70px; height: 70px; object-fit: cover; border-radius: 8px;">
                    </div>
                    <div class="flex-grow-1">
                        <div class="d-flex align-items-center mb-1">
                            <div class="status-circle not-started"></div>
                            <h5 class="mb-0 ms-2">Project now</h5>
                        </div>
                        <div class="d-flex justify-content-start mt-2">
                            <div class="d-flex align-items-center me-3">
                                <span class="material-symbols-outlined icon-format_list_bulleted">format_list_bulleted</span>
                                <span class="icon-number">3</span>
                            </div>
                            <div class="d-flex align-items-center me-3">
                                <span class="material-symbols-outlined icon-av-timer">av_timer</span>
                                <span class="icon-number">3</span>
                            </div>
                            <div class="d-flex align-items-center">
                                <span class="material-symbols-outlined icon-checklist">checklist</span>
                                <span class="icon-number">3</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </a>
</div>
<div class="col-md-4 mb-4">
    <a href="#" class="card-link">
        <div class="card shadow-sm rounded-4 p-3 position-relative" style="background-color: rgb(240, 241, 248); border:0;">
            <div class="card-body">
                <div class="d-flex">
                    <div class="me-3">
                        <img src="{{ asset('asset/img/background/add-image.png') }}" alt="Project Image"
                            style="width: 70px; height: 70px; object-fit: cover; border-radius: 8px;">
                    </div>
                    <div class="flex-grow-1">
                        <div class="d-flex align-items-center mb-1">
                            <div class="status-circle in-progress"></div>
                            <h5 class="mb-0 ms-2">Project now</h5>
                        </div>
                        <div class="d-flex justify-content-start mt-2">
                            <div class="d-flex align-items-center me-3">
                                <span class="material-symbols-outlined icon-format_list_bulleted">format_list_bulleted</span>
                                <span class="icon-number">3</span>
                            </div>
                            <div class="d-flex align-items-center me-3">
                                <span class="material-symbols-outlined icon-av-timer">av_timer</span>
                                <span class="icon-number">3</span>
                            </div>
                            <div class="d-flex align-items-center">
                                <span class="material-symbols-outlined icon-checklist">checklist</span>
                                <span class="icon-number">3</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </a>
</div>
<div class="col-md-4 mb-4">
    <a href="#" class="card-link">
        <div class="card shadow-sm rounded-4 p-3 position-relative" style="background-color: rgb(240, 241, 248); border:0;">
            <div class="card-body">
                <div class="d-flex">
                    <div class="me-3">
                        <img src="{{ asset('asset/img/background/add-image.png') }}" alt="Project Image"
                            style="width: 70px; height: 70px; object-fit: cover; border-radius: 8px;">
                    </div>
                    <div class="flex-grow-1">
                        <div class="d-flex align-items-center mb-1">
                            <div class="status-circle completed"></div>
                            <h5 class="mb-0 ms-2">Project now</h5>
                        </div>
                        <div class="d-flex justify-content-start mt-2">
                            <div class="d-flex align-items-center me-3">
                                <span class="material-symbols-outlined icon-format_list_bulleted">format_list_bulleted</span>
                                <span class="icon-number">3</span>
                            </div>
                            <div class="d-flex align-items-center me-3">
                                <span class="material-symbols-outlined icon-av-timer">av_timer</span>
                                <span class="icon-number">3</span>
                            </div>
                            <div class="d-flex align-items-center">
                                <span class="material-symbols-outlined icon-checklist">checklist</span>
                                <span class="icon-number">3</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </a>
</div>
<div class="col-md-4 mb-4">
    <a href="#" class="card-link">
        <div class="card shadow-sm rounded-4 p-3 position-relative" style="background-color: rgb(240, 241, 248); border:0;">
            <div class="card-body">
                <div class="d-flex">
                    <div class="me-3">
                        <img src="{{ asset('asset/img/background/add-image.png') }}" alt="Project Image"
                            style="width: 70px; height: 70px; object-fit: cover; border-radius: 8px;">
                    </div>
                    <div class="flex-grow-1">
                        <div class="d-flex align-items-center mb-1">
                            <div class="status-circle late"></div>
                            <h5 class="mb-0 ms-2">Project now</h5>
                        </div>
                        <div class="d-flex justify-content-start mt-2">
                            <div class="d-flex align-items-center me-3">
                                <span class="material-symbols-outlined icon-format_list_bulleted">format_list_bulleted</span>
                                <span class="icon-number">3</span>
                            </div>
                            <div class="d-flex align-items-center me-3">
                                <span class="material-symbols-outlined icon-av-timer">av_timer</span>
                                <span class="icon-number">3</span>
                            </div>
                            <div class="d-flex align-items-center">
                                <span class="material-symbols-outlined icon-checklist">checklist</span>
                                <span class="icon-number">3</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </a>
</div>
         
        </div>
</x-office-layout>
