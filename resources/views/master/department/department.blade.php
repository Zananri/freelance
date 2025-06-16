<x-office-layout>
    <style>
        .table-transparent th,
        .table-transparent td {
            background-color: rgba(248, 248, 249, 0) !important;
        }

        .nav-icon-arrow {
            display: inline-block;
            color: #717375;
            margin-top: 3px; 
            margin-right: 10px;
            height: 40px; width:40px;
            border-radius: 50%;
            --bs-bg-opacity:0.3;
            background-color: rgba(var(--bs-white-rgb), var(--bs-bg-opacity)) !important;
            transition: all 0.15s ease-in-out;
        }

        .nav-icon-arrow:hover{
            cursor: pointer;
            --bs-bg-opacity:0.7;
        }

        .nav-icon-arrow .material-symbols-outlined {
            color: #808489;
            font-size: 20px;
            font-variation-settings: 'FILL' 0,'wght' 400;
            transition: all 0.15s ease-in-out;
        }

        .nav-icon-arrow:hover .material-symbols-outlined {
            color: #111;
            font-variation-settings: 'FILL' 1,'wght' 400; 
        }

        .nav-icon-arrow .d-flex{
            height: 100%;
            justify-content: center;
            align-items: center;
        }

        .title-content a {
            text-decoration: none !important;
            color: inherit !important;
        }

        .btn-icon-toggle {
            position: relative;
            background-color: transparent;
            color: inherit;
            border: 1px solid #DDDDDD;
            padding: 0.375rem 0.75rem;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            cursor: pointer;
            transition: background-color 0.3s ease;
            box-sizing: border-box;
            height: 38px;
            min-width: 90px;
        }

        .btn-icon-toggle .icon {
            color: inherit;
            transition: color 0.3s ease;
        }

        .btn-icon-toggle:hover {
            background-color: white;
        }

        .btn-icon-toggle:hover .icon {
            color: black;
        }
    </style>

    <div class="title-content d-flex align-items-center gap-3">
        <div class="nav-item d-inline-block me-3">
            <div class="nav-icon-arrow">
                <a href="/master" class="text-decoration-none text-dark d-flex align-items-center">
                    <div class="d-flex">
                        <span class="material-symbols-outlined">arrow_back</span>
                    </div>
                </a>
            </div>
        </div>
        <h2>Department</h2>
    </div>

    <div class="body-content scrollable-container rounded-4 p-5" style="margin-top: 20px; width: 100%;">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h5 class="mb-0">List Department</h5>

            <div class="d-flex gap-2">
                <button class="btn btn-icon-toggle" style="border: 1px solid #DDDDDD;">
                    <span class="material-symbols-outlined icon">filter_list</span> Filter
                </button>

                <button class="btn btn-icon-toggle btn-icon-search" style="border: 1px solid #DDDDDD;">
                    <span class="material-symbols-outlined icon">search</span> Search
                </button>

                <button class="btn btn-icon-toggle" style="border: 1px solid #DDDDDD;">
                    <span class="material-symbols-outlined icon">add</span> Add Data
                </button>
            </div>
        </div>

        <div class="table-responsive">
            <table class="table table-borderless align-middle table-transparent">
                <thead>
                    <tr>
                        <th scope="col">#</th>
                        <th scope="col">Department Name</th>
                        <th scope="col">Manager</th>
                        <th scope="col">Status</th>
                        <th scope="col">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <th scope="row">1</th>
                        <td>IT Department</td>
                        <td>John Doe</td>
                        <td><span class="badge bg-success">Active</span></td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary">Edit</button>
                            <button class="btn btn-sm btn-outline-danger">Delete</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</x-office-layout>
