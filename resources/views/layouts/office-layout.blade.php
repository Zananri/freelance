<!DOCTYPE html>
<html lang="en">

<head>

    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Office NSA Performance</title>

    <meta name="description" content="Office NSA Performance">
    <meta name="keywords" content="nsaperformance, nsa performance">
    <meta name="author" content="nsaperformance.id">
    <meta name="robots" content="index, nofollow">

    <meta name="app-url" content="{{ url('/') }}">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <link rel="icon" href="{{ asset('asset/img/favicon.ico') }}" type="image/x-icon">
    <link rel="shortcut icon" href="{{ asset('asset/img/favicon.ico') }}" type="image/x-icon">

    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700&display=swap"
        rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet"
        integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
    {{-- <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" /> --}}


    <link rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=groups" />
    <style>
        .material-symbols-outlined {
            font-variation-settings:
                'FILL' 0,
                'wght' 400,
                'GRAD' 0,
                'opsz' 24
        }
    </style>
    <link href="{{ asset('asset/css/MaterialSymbolsOutlined.css') }}" rel="stylesheet">
    <link href="{{ asset('asset/css/app.css?v='.time()) }}" rel="stylesheet">
    <link href="{{ asset('asset/css/office.css?v='.time()) }}" rel="stylesheet">
    <link href="{{ asset('asset/css/sidebar.css?v='.time()) }}" rel="stylesheet">

    <style>
        
    </style>

    @isset($head_slot)
        {{ $head_slot }}
    @endisset
</head>

<body class="">
    <header>

        <div class="box-nav-top-left d-inline-block ps-4 pt-4 float-start align-middle">
            <div class="d-inline-block align-middle" id="sidebar-control">
                <span class="material-symbols-outlined">menu</span>
            </div>
            <img src="{{ asset('asset/img/logo.png') }}" class="align-middle" width="50" alt="LOGO NSA Performance">
        </div>

        <div class="box-user-nav d-inline-block pt-4 pe-4 float-end" style="">

            <div class="nav-item d-inline-block me-3" style="">
                <div class="nav-icon">
                    <div class="d-flex position-relative">
                        <span class="material-symbols-outlined" style="cursor: pointer;" data-bs-toggle="modal" data-bs-target="#notificationModal">notifications</span>
                        <span id="notificationBadge" class="notification-badge position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style="display: none;">
                            <span id="notificationCount">0</span>
                        </span>
                    </div>
                </div>
            </div>

            <div class="nav-item img-avatar rounded-circle d-inline-block me-2 position-relative" style="width: 40px; height: 40px; overflow: visible;" id="avatarDropdownToggle">

                @if (Auth::check())
                    <img src="{{ asset(Auth::user()->photo) }}" alt="User Avatar" class="rounded-circle"
                        style="width: 40px; height: 40px; object-fit: cover; cursor: pointer;">
                @else
                    <div class="d-inline-block rounded-circle bg-secondary opacity-50"
                        style="width: 40px; height: 40px;"></div>
                @endif

                <div id="avatarDropdownCard" class="card shadow-sm rounded-5" style="display: none;">
                    <button type="button" class="btn-close position-absolute top-0 end-0 m-3" id="closeAvatarDropdown"
                        aria-label="Close"></button>
                    <div class="card-body p-3 text-center d-flex flex-column justify-content-center align-items-center"
                        style="min-height: 220px;">
                        <div class="mb-3 mt-3">
                            @if (Auth::check())
                                <img src="{{ asset(Auth::user()->photo) }}" alt="User Avatar" class="rounded-circle"
                                    style="width: 70px; height: 70px; object-fit: cover; ">
                            @else
                                <div class="d-inline-block rounded-circle bg-secondary opacity-50"
                                    style="width: 70px; height: 70px;"></div>
                            @endif
                        </div>
                        <div class="fw-semibold text-body mb-1" >{{ Auth::check() ? Auth::user()->name : 'Guest' }}
                        </div>
                        <div class="mb-1 text-body-secondary fs-12">
                            {{ Auth::check() ? Auth::user()->email : '' }}
                        </div>
                        <div class="mb-4 text-body-secondary fs-12">
                            {{ Auth::check() ? optional(auth()->user()->employee->division)->name_division ?? 'No Division' : '' }}
                        </div>

                        <div class="d-flex flex-row align-items-center" style="width: 85%;">
                            <button type="button" class="btn btn-detail btn-sidebar-style btn-profile-left"
                                style="font-size: 16px; min-height: 44px; flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; background-color: #ffffff; border-right: 1px solid #ccc;"
                                onclick="window.location.href='{{ route('profile') }}'">
                                <span class="material-symbols-outlined" style="font-size: 25px;">account_circle</span>
                                Profile
                            </button>
                            <form method="POST" action="{{ route('logout') }}" style="flex: 1; margin: 0;">
                                @csrf
                                <button type="submit" class="btn btn-detail btn-sidebar-style btn-logout-right"
                                    style="font-size: 16px; min-height: 44px; width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px; background-color: #ffffff;">
                                    <span class="material-symbols-outlined" style="font-size: 25px;">logout</span>
                                    Logout
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            <div class="nav-item d-none d-sm-inline-block pt-1" style="">
                @if (Auth::check())
                    <div class="fs-14 fw-medium">Welcome, {{ auth()->user()->name }}</div>
                    <div class="fs-12 fw-normal text-body text-opacity-75">
                        {{ optional(auth()->user()->employee->division)->name_division ?? 'No Division' }}
                    </div>
                @else
                    <div class="fs-14 fw-medium">Welcome, Guest</div>
                    <div class="fs-12 fw-normal text-body text-opacity-75">
                        No Division
                    </div>
                @endif
            </div>

        </div>

    </header>

    <section class="main-content" style="">
        {{ $slot }}
    </section>


    <aside class="left-nav rounded-4">
        <div class="scrollable-container" style="max-height: calc(100vh - 120px)">

            <div class="sidebar">

                <ul class="sidebar-menu">
                    <li>
                        <a href="{{ url('dashboard') }}" class="{{ $menu_active == 'dashboard' ? 'active' : '' }}">
                            <span class="material-symbols-outlined">home</span>
                            <span class="text-menu">Dashboard</span>
                        </a>
                    </li>
                    <li>
                        <a href="{{ url('attendance') }}"
                            class="{{ $menu_active == 'attendance' ? 'active' : '' }}">
                            <span class="material-symbols-outlined">today</span>
                            <span class="text-menu">Attendance</span>
                        </a>
                    </li>
                    <li>
                        <a href="{{ url('task') }}" class="{{ $menu_active == 'task' ? 'active' : '' }}">
                            <span class="material-symbols-outlined">task</span>
                            <span class="text-menu">Task</span>
                        </a>
                    </li>
                    <li>
                        <a href="{{ url('project') }}" class="{{ $menu_active == 'project' ? 'active' : '' }}">
                            <span class="material-symbols-outlined">rocket_launch</span>
                            <span class="text-menu">Project</span>
                        </a>
                    </li>

                    {{-- <li class="has-submenu">
                        <a href="#" data-bs-toggle="collapse" data-bs-toggle="collapse" data-bs-target="#sub-project" aria-expanded="false" aria-controls="sub-project">
                            <span class="material-symbols-outlined">corporate_fare</span>
                            <span class="text-menu">Master</span>
                            <span class="material-symbols-outlined arrow arrow-more">expand_more</span>
                            <span class="material-symbols-outlined arrow arrow-hide">chevron_right</span>
                        </a>
                        <ul class="submenu collapse" id="sub-project">
                            <li><a href="#"><span class="status-indicator active-project"></span> Attendance</a></li>
                            <li><a href="#"><span class="status-indicator active-project"></span> Employee</a></li>
                            <li><a href="#"><span class="status-indicator active-project"></span> Project</a></li>
                            <li><a href="#"><span class="status-indicator active-project"></span> Task</a></li>
                            <li><a href="#"><span class="status-indicator active-project"></span> Department</a></li>
                            <li><a href="#"><span class="status-indicator project-done"></span> Division</a></li>
                            <li><a href="#"><span class="status-indicator project-on-hold"></span> Grade</a></li>
                        </ul>
                    </li> --}}
                    <li>
                        <a href="{{ route('profile') }}" class="{{ $menu_active == 'profile' ? 'active' : '' }}">
                            <span class="material-symbols-outlined">account_circle</span>
                            <span class="text-menu">Profile</span>
                        </a>
                    </li>
                    <li>
                        <a href="{{ route('master') }}" class="{{ $menu_active == 'master' ? 'active' : '' }}">
                            <span class="material-symbols-outlined">database</span>
                            <span class="text-menu">Master</span>
                        </a>
                    </li>
                    <li>
                        <a href="{{ route('employee') }}" class="{{ $menu_active == 'employee' ? 'active' : '' }}">
                            <span class="material-symbols-outlined">groups</span>
                            <span class="text-menu">Employee</span>
                        </a>
                    </li>
                    <li>
                        {{-- <a href="#">
                            <span class="material-symbols-outlined">notifications</span> Notification
                            <span class="notification-badge">4</span>
                        </a> --}}
                    </li>
                    <li>
                        <a href="#">
                            <span class="material-symbols-outlined">settings</span>
                            <span class="text-menu">Settings</span>
                        </a>
                    </li>
                </ul>
            </div>

        </div>

    </aside>

    <footer>

    </footer>

    <script src="{{ asset('asset/js/jquery-3.7.1.min.js') }}"></script>

    <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.8/dist/umd/popper.min.js"
        integrity="sha384-I7E8VVD/ismYTF4hNIPjVp/Zjvgyol6VFvRkX/vR+Vc4jQkC+hVqc2pM8ODewa9r" crossorigin="anonymous">
    </script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.6/dist/js/bootstrap.min.js"
        integrity="sha384-RuyvpeZCxMJCqVUGFI0Do1mQrods/hhxYlcVfGPOfQtPJh0JCw12tUAZ/Mv10S7D" crossorigin="anonymous">
    </script>

    <script src="{{ asset('asset/js/app.js?v='.time()) }}"></script>
    <script src="{{ asset('asset/js/office.js?v='.time()) }}"></script>

    @isset($script_slot)
        {{ $script_slot }}
    @endisset

    <!-- Notification Modal -->
    <div class="modal fade" id="notificationModal" tabindex="-1" aria-labelledby="notificationModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content rounded-4 shadow-lg">
                <div class="modal-header border-0 pb-2">
                    <h5 class="modal-title fw-semibold" id="notificationModalLabel">
                        <span class="material-symbols-outlined me-2 align-middle">notifications</span>
                        Notifications
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body pt-0">
                    <div class="notification-list" id="notificationList">
                        <!-- Notifications will be loaded dynamically -->
                        <div class="text-center py-4">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

</body>

</html>
