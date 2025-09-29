<!DOCTYPE html>
<html lang="en">

<head>

    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">


    @php
        $head_stitle = 'Office NSA Performance';

        if (isset($head_stitle_slot)) {
            $head_stitle = $head_stitle_slot;
        }

    @endphp
    <title>{{ $head_stitle }}</title>

    <meta name="description" content="Office NSA Performance">
    <meta name="keywords" content="nsaperformance, nsa performance">
    <meta name="author" content="office.nsaperformance.id">
    <meta name="robots" content="noindex, nofollow">

    <meta name="app-url" content="{{ url('/') }}">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <script src="{{ asset('asset/js/office_nav.js?v=' . time()) }}"></script>

    <link rel="icon" href="{{ asset('asset/img/favicon.ico') }}" type="image/x-icon">
    <link rel="shortcut icon" href="{{ asset('asset/img/favicon.ico') }}" type="image/x-icon">

    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700&display=swap" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
    {{-- <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" /> --}}


    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=groups" />
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
    <link href="{{ asset('asset/css/app.css?v=' . time()) }}" rel="stylesheet">
    <link href="{{ asset('asset/css/office.css?v=' . time()) }}" rel="stylesheet">
    <link href="{{ asset('asset/css/sidebar.css?v=' . time()) }}" rel="stylesheet">

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
                    <div class="d-flex position-relative" style="cursor: pointer;" id="notificationDropdownToggle">
                        <span class="material-symbols-outlined" style="cursor: pointer;"
                            id="notificationDropdownToggle">notifications</span>
                        <span id="notificationBadge"
                            class="notification-badge position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                            style="display: none;">
                            <span id="notificationCount">0</span>
                        </span>
                    </div>
                </div>
            </div>

            <div class="nav-item img-avatar rounded-circle d-inline-block me-2 position-relative"
                style="width: 40px; height: 40px; overflow: visible;" id="avatarDropdownToggle">

                @php
                    $avatarUrl = null;
                    if (Auth::check()) {
                        $emp = Auth::user()->employee ?? null;
                        $raw = null;
                        if ($emp) {
                            $raw = $emp->profile_picture ?: ($emp->photo ?: null);
                        }
                        if (!$raw) {
                            $raw = Auth::user()->photo ?: null; // legacy fallback
                        }
                        if ($raw) {
                            if (preg_match('/^(https?:)?\/\//i', $raw)) {
                                $avatarUrl = $raw; // absolute external / protocol-relative
                            } else {
                                $normalized = ltrim($raw, '/');
                                // Cek file fisik ada, kalau tidak fallback default
                                if (!file_exists(public_path($normalized))) {
                                    $avatarUrl = asset('asset/img/avatar.png');
                                } else {
                                    $avatarUrl = asset($normalized);
                                }
                            }
                        }
                    }
                    if (!$avatarUrl) {
                        $avatarUrl = asset('asset/img/avatar.png');
                    }
                @endphp

                @if (Auth::check())
                    <img src="{{ $avatarUrl }}" alt="User Avatar" class="rounded-circle" data-global-avatar="" data-default="{{ asset('asset/img/avatar.png') }}"
                        style="width: 40px; height: 40px; object-fit: cover; cursor: pointer;" onerror="this.onerror=null;this.src='{{ asset('asset/img/avatar.png') }}';">
                @else
                    <div class="d-inline-block rounded-circle bg-secondary opacity-50"
                        style="width: 40px; height: 40px; cursor: pointer;"></div>
                @endif

                <div id="avatarDropdownCard" class="card shadow-sm rounded-5" style="display: none;">
                    <button type="button" class="btn-close position-absolute top-0 end-0 m-3 p-2" id="closeAvatarDropdown"
                        aria-label="Close"></button>
                    <div class="card-body p-3 pt-2 text-center d-flex flex-column justify-content-center align-items-center"
                        style="min-height: 220px;">
                        <div class="mb-3 mt-3">
                            @if (Auth::check())
                                <img src="{{ $avatarUrl }}" alt="User Avatar" class="rounded-circle" data-global-avatar="" data-default="{{ asset('asset/img/avatar.png') }}"
                                    style="width: 70px; height: 70px; object-fit: cover; " onerror="this.onerror=null;this.src='{{ asset('asset/img/avatar.png') }}';">
                            @else
                                <div class="d-inline-block rounded-circle bg-secondary opacity-50"
                                    style="width: 70px; height: 70px;"></div>
                            @endif
                        </div>
                        <div class="fw-semibold text-body mb-1">{{ Auth::check() ? Auth::user()->name : 'Guest' }}
                        </div>
                        <div class="mb-1 text-body-secondary fs-12">
                            {{ Auth::check() ? Auth::user()->email : '' }}
                        </div>
                        <div class="mb-4 text-body-secondary fs-12">
                            {{ Auth::check() ? optional(auth()->user()->employee->division)->name_division ?? 'No Division' : '' }}
                        </div>

                        <div class="w-100 p-3">
                            <form method="POST" action="{{ route('logout') }}"  >
                                 @csrf
                                 <div class="d-flex justify-content-center   align-items-center w-100" >
                                        <a  class="btn btn-profile-left w-100" href="{{ route('profile') }}">
                                            <span class="material-symbols-outlined">account_circle</span>
                                            Profile
                                        </a>


                                        <button type="submit" class="btn btn-logout-right w-100" >
                                            <span class="material-symbols-outlined">logout</span>
                                            Logout
                                        </button>

                                </div>

                            </form>
                        </div>

                    </div>
                </div>
            </div>

            <div class="nav-item d-none d-sm-inline-block pt-1" style="">
                @if (Auth::check())
                    <div class="fs-14 fw-medium">{{ auth()->user()->name }}</div>
                    <div class="fs-12 fw-normal text-body text-opacity-75">
                        {{ optional(auth()->user()->employee->division)->name_division ?? 'No Division' }}
                    </div>
                @else
                    <div class="fs-14 fw-medium">Guest</div>
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

    <script>
        // Listener untuk pembaruan foto profil universal
        window.addEventListener('profilePictureUpdated', function(e){
            var newUrl = e.detail && e.detail.url; // bisa null (clear)
            document.querySelectorAll('img[data-global-avatar], img[data-avatar-universal]').forEach(function(img){
                var fallback = img.getAttribute('data-default');
                if (newUrl) {
                    img.src = newUrl.indexOf('?t=') !== -1 ? newUrl : (newUrl + '?t=' + Date.now());
                } else if (fallback) {
                    img.src = fallback + '?t=' + Date.now();
                }
            });
        });
    </script>


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
                    <li>
                        <a href="{{ route('teams') }}" class="{{ $menu_active == 'teams' ? 'active' : '' }}">
                            <span class="material-symbols-outlined">group</span>
                            <span class="text-menu">Teams</span>
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
                        <a href="{{ route('calendar') }}" class="{{ $menu_active == 'calendar' ? 'active' : '' }}">
                            <span class="material-symbols-outlined">calendar_month</span>
                            <span class="text-menu">Calendar</span>
                        </a>
                    </li>

                    @if (in_array(Auth::user()->user_type,['ADMINISTRATOR','MANAGEMENT']))



                    <li>
                        <a href="{{ route('master') }}" class="{{ $menu_active == 'master' ? 'active' : '' }}">
                            <span class="material-symbols-outlined">database</span>
                            <span class="text-menu">Master</span>
                        </a>
                    </li>

                    <li>
                        <a href="{{ route('shift') }}" class="{{ $menu_active == 'shift' ? 'active' : '' }}">
                            <span class="material-symbols-outlined">schedule</span>
                            <span class="text-menu">Shift</span>
                        </a>
                    </li>
                    <li>
                        <a href="{{ route('weekday_off') }}" class="{{ $menu_active == 'weekday_off' ? 'active' : '' }}">
                            <span class="material-symbols-outlined">date_range</span>
                            <span class="text-menu">Weekday Off</span>
                        </a>
                    </li>
                    <li>
                        <a href="{{ route('employee') }}" class="{{ $menu_active == 'employee' ? 'active' : '' }}">
                            <span class="material-symbols-outlined">groups</span>
                            <span class="text-menu">Employee</span>
                        </a>
                    </li>
                    <li>
                        <a href="{{ route('attendance_tracking') }}" class="{{ $menu_active == 'attendance_tracking' ? 'active' : '' }}">
                            <span class="material-symbols-outlined">calendar_clock</span>
                            <span class="text-menu">Attendance Tracking</span>
                        </a>
                    </li>
                    <li>
                        <a href="{{ route('leave') }}" class="{{ $menu_active == 'leave' ? 'active' : '' }}">
                            <span class="material-symbols-outlined">free_cancellation</span>
                            <span class="text-menu">Leave</span>
                        </a>
                    </li>
                    
                    {{-- <li>
                        <a href="#">
                            <span class="material-symbols-outlined">notifications</span> Notification
                            <span class="notification-badge">4</span>
                        </a>
                    </li> --}}
                    <li>
                        <a href="{{ route('settings') }}" class="{{ $menu_active == 'settings' ? 'active' : '' }}">
                            <span class="material-symbols-outlined">settings</span>
                            <span class="text-menu">Settings</span>
                        </a>
                    </li>

                    @endif
                </ul>
            </div>

        </div>

    </aside>

    <footer>

    </footer>

    @isset($body_end_slot)
        {{ $body_end_slot }}
    @endisset

    <div class="box-alert-messages">
        <div class="box-message" role="">
            <div class="message-content fs-14">Cek</div>
            <div class="btn-close-alert-messages"></div>
        </div>
    </div>

    <!-- Notification Dropdown Card -->
    <div id="notificationDropdownCard" class="card shadow-sm rounded-5" style="display: none;">
        

        <div class="position-absolute top-0 end-0" id="closeNotificationDropdown">
            <span class="material-symbols-outlined">
            close
            </span>
        </div>
        
        <div class="card-body p-0">
            <div class="p-3 border-bottom">
                <div class="d-flex w-100 align-items-center">
                    <div class="icon-notification">
                        <span class="material-symbols-outlined me-2 align-middle fs-18 text-secondary">notifications</span>
                    </div>
                    <div class="text-notification">
                        <span class="fs-14 fw-medium">
                            Notification
                        </span>
                    </div>
                </div>
            </div>
            <div class="px-3 pt-2 pb-2 border-bottom">
                <label for="notificationSelectAll" class="nsa-selectall-chip">
                    <input class="form-check-input me-2" type="checkbox" value="1" id="notificationSelectAll" />
                    <span>Accept all</span>
                </label>
            </div>
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

    <svg xmlns="http://www.w3.org/2000/svg" style="display: none;">
        <symbol id="check-circle-fill" viewBox="0 0 16 16">
            <path
                d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
        </symbol>
        <symbol id="exclamation-triangle-fill" viewBox="0 0 16 16">
            <path
                d="M8.982 1.566a.75.75 0 0 0-1.132 0L1.75 13.5A.75.75 0 0 0 2.482 15h11.036a.75.75 0 0 0 .732-1.5L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
        </symbol>
    </svg>


    
    <script src="{{ asset('asset/js/jquery-3.7.1.min.js') }}"></script>

    <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.8/dist/umd/popper.min.js"
        integrity="sha384-I7E8VVD/ismYTF4hNIPjVp/Zjvgyol6VFvRkX/vR+Vc4jQkC+hVqc2pM8ODewa9r" crossorigin="anonymous">
    </script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.6/dist/js/bootstrap.min.js"
        integrity="sha384-RuyvpeZCxMJCqVUGFI0Do1mQrods/hhxYlcVfGPOfQtPJh0JCw12tUAZ/Mv10S7D" crossorigin="anonymous">
    </script>

    <script src="{{ asset('asset/js/app.js?v=' . time()) }}"></script>
    <script src="{{ asset('asset/js/office.js?v=' . time()) }}"></script>

    @isset($script_slot)
    {{ $script_slot }}
    @endisset




</body>

</html>
