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
    <link href="{{ asset('asset/css/app.css') }}" rel="stylesheet">
    <link href="{{ asset('asset/css/office.css') }}" rel="stylesheet">

    <style>
        body {
            box-sizing: border-box;
            /* Pastikan padding tidak menambah ukuran total */
            background-image: url('{{ asset('asset/img/background/light-1.jpg') }}');
        }




        .sidebar {
            width: 225px;
            /* Sesuaikan sesuai kebutuhan */
            padding: 20px 0;
            /* Sesuaikan untuk sudut membulat */
            /* Tambahkan sedikit margin di sekitar sidebar */
        }



        .sidebar-menu {
            list-style: none;
            padding: 0;
            margin: 0;
        }

        .sidebar-menu li {
            margin-bottom: 5px;
            /* Spasi antar item menu utama */
        }

        .sidebar-menu li a {
            display: flex;
            align-items: center;
            padding: 12px 20px;
            font-size: 14px;
            color: #777;
            text-decoration: none;
            transition: background-color 0.3s ease;
            border-radius: 25px;
            /* Sudut sedikit membulat untuk item menu */
            margin: 0 8px;
            /* Agar warna latar belakang tidak memenuhi lebar penuh */
        }

        .sidebar-menu li a.active {
            background-color: #fff;
        }

        .sidebar-menu li a.active .material-symbols-outlined {
            color: #000;
            font-variation-settings: 'FILL' 1;
        }

        .sidebar-menu li a .text-menu {
            margin-left: 5px;
        }



        .sidebar-menu li a:hover {
            background-color: #f8f8f9;
            color: #000;
            /* Warna highlight saat di-hover */
        }


        /* Styling untuk ikon Material Icons dalam menu */
        .sidebar-menu li a .material-symbols-outlined {
            margin-right: 10px;
            font-size: 1.6em;
            /* Sesuaikan ukuran ikon */
            transition: all 0.2s ease-in-out;
        }

        .sidebar-menu li a .arrow {
            margin-left: auto;
            /* Mendorong panah ke kanan */
            font-size: 1em;
            /* Ukuran panah material icons */
        }

        /* Submenu styling untuk Projects */
        .sidebar-menu .has-submenu .submenu {
            list-style: none;
            padding: 0;
            margin-left: 45px;
            /* Indentasi item submenu */
            padding-left: 10px;
            border-left: 2px solid #ddd;
            /* Garis vertikal */
        }

        .has-submenu [aria-expanded="true"] .arrow-more {
            display: inline;
        }

        .has-submenu [aria-expanded="true"] .arrow-hide {
            display: none;
        }

        .has-submenu [aria-expanded="false"] .arrow-more {
            display: none;
        }

        .has-submenu [aria-expanded="false"] .arrow-hide {
            display: inline;
        }

        .sidebar-menu .has-submenu .submenu li a {
            padding: 8px 0;
            font-size: 0.9em;
            color: #555;
            margin: 0;
            /* Hapus margin horizontal untuk item submenu */
        }

        .sidebar-menu .has-submenu .submenu li a:hover {
            background-color: transparent;
            /* Tanpa latar belakang saat di-hover untuk item submenu */
            color: #4A63F8;
        }

        .status-indicator {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            margin-right: 8px;
        }

        .active-project {
            background-color: #4CAF50;
            /* Hijau */
        }

        .project-done {
            background-color: #2196F3;
            /* Biru */
        }

        .project-on-hold {
            background-color: #F44336;
            /* Merah */
        }

        /* Lencana Notifikasi */
        .notification-badge {
            background-color: #FF4D4D;
            /* Merah */
            color: white;
            font-size: 0.7em;
            padding: 3px 7px;
            border-radius: 10px;
            margin-left: auto;
            /* Mendorong lencana ke kanan */
        }

        .small-sidebar .left-nav {
            min-width: 77px;
            width: 77px;
            /* background-color: rgba(255, 255, 255, 0); */
        }

        .small-sidebar .left-nav:hover {
            background-color: #f7f8f9;
        }

        .small-sidebar .left-nav:hover .scrollable-container {
            width: 250px;
        }

        /* Hide scrollbar for Chrome, Safari and Opera */
        .small-sidebar .scrollable-container::-webkit-scrollbar {
            display: none;
        }

        /* Hide scrollbar for IE, Edge and Firefox */
        .small-sidebar .scrollable-container {
            -ms-overflow-style: none;
            /* IE and Edge */
            scrollbar-width: none;
            /* Firefox */
        }

        .small-sidebar .sidebar:hover {
            width: 250px;
        }

        .small-sidebar .sidebar-menu li a {
            padding: 0px 20px;
            width: 55px;
            overflow: hidden;
            word-wrap: none;
            white-space: nowrap;
        }

        .small-sidebar .sidebar a .text-menu {
            color: rgba(51, 51, 51, 0);
            word-wrap: none;
        }

        .small-sidebar .sidebar a .arrow {
            display: none;
        }

        .small-sidebar .sidebar-menu li a.active {
            background-color: rgba(255, 255, 255, 0);
            color: #000000;
        }

        .small-sidebar .sidebar-menu li a:hover {
            width: 220px;
        }

        .small-sidebar a:hover .text-menu {
            color: #000000;
        }

        .small-sidebar .sidebar-menu li a:hover {
            background-color: rgba(248, 248, 249, 0);
            color: #000000;
            /* Warna highlight saat di-hover */
        }

        .sidebar-menu li a:hover .material-symbols-outlined {
            color: #000;
            font-variation-settings: 'FILL' 1;
        }

        .small-sidebar .text-menu {
            margin-left: 10px;
            padding: 10px 15px 10px 0px;
            border-bottom: 3px solid #e3e8ee;
            border-right: 3px solid #e3e8ee;
            background-color: #f7f8f9;
            border-top-right-radius: 20px;
            border-bottom-right-radius: 20px;
            color: #000;
        }

        .small-sidebar .main-content {
            padding-left: 130px;
        }


        .small-sidebar .has-submenu:hover a {
            width: 220px;
        }

        .small-sidebar .has-submenu:hover .text-menu {
            color: #000;
        }

        .small-sidebar .submenu {
            background-color: #f7f8f9;
        }
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
                    <div class="d-flex">
                        <span class="material-symbols-outlined">notifications</span>
                    </div>
                </div>
            </div>

            <div class="nav-item img-avatar rounded-circle d-inline-block p-3 bg-black me-2" style="">

            </div>

            <div class="nav-item d-inline-block pt-1" style="">
                <div class="fs-14 fw-medium">User Name</div>
                <div class="fs-12 fw-normal text-body text-opacity-75">Marketplace</div>
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
                        <a href="#" class="active">
                            <span class="material-symbols-outlined">home</span>
                            <span class="text-menu">Dashboard</span>
                        </a>
                    </li>
                    <li>
                        <a href="#" class="">
                            <span class="material-symbols-outlined">today</span>
                            <span class="text-menu">Attendance</span>
                        </a>
                    </li>
                    <li>
                        <a href="#" class="">
                            <span class="material-symbols-outlined">task</span>
                            <span class="text-menu">Task</span>
                        </a>
                    </li>
                    <li>
                        <a href="#" class="">
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
                        <a href="#">
                            <span class="material-symbols-outlined">account_circle</span>
                            <span class="text-menu">Profile</span>
                        </a>
                    </li>
                    <li>
                        <a href="{{ route('master') }}"
                            class="{{ request()->routeIs('master') || request()->routeIs('department') ? 'active' : '' }}">
                            <span class="material-symbols-outlined">database</span>
                            <span class="text-menu">Master</span>
                        </a>
                    </li>
                    <li>
<a href="{{ route('employee.page') }}"
    class="{{ request()->routeIs('employee.page') || request()->routeIs('department') ? 'active' : '' }}">
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

    <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.8/dist/umd/popper.min.js"
        integrity="sha384-I7E8VVD/ismYTF4hNIPjVp/Zjvgyol6VFvRkX/vR+Vc4jQkC+hVqc2pM8ODewa9r" crossorigin="anonymous">
    </script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.6/dist/js/bootstrap.min.js"
        integrity="sha384-RuyvpeZCxMJCqVUGFI0Do1mQrods/hhxYlcVfGPOfQtPJh0JCw12tUAZ/Mv10S7D" crossorigin="anonymous">
    </script>

    <script src="{{ asset('asset/js/jquery-3.7.1.min.js') }}"></script>

    <script>
        $('#sidebar-control').on('click', function() {
            $("body").toggleClass("small-sidebar");
        });
    </script>

    @isset($script_slot)
        {{ $script_slot }}
    @endisset
</body>

</html>
