<x-office-layout>
    <style>
        .btn.rounded-5 {
            background-color: white;
            color: black;
            border: 1px solid #DDDDDD;
            transition: all 0.3s ease;
        }
        .btn.rounded-5:hover {
            background-color: black;
            color: white;
            border-color: white;
        }
    </style>
    <div class="title-content d-flex align-items-center gap-3">
        <a href="/master" class="text-decoration-none text-dark">
            
            <button class="btn rounded-5" style="border: 1px solid #DDDDDD;">
                <i class="bi bi-arrow-left"></i>
            </button>
        </a>
        <h2>Department</h2>
    </div>

    <div class="body-content scrollable-container rounded-4 p-5" style="margin-top: 20px; width: 100%;">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h5 class="mb-0">List Department</h5>

            <div class="d-flex gap-2">
                <button class="btn rounded-5" style="border: 1px solid #DDDDDD;">
                    <i class="bi bi-funnel"></i> Filter
                </button>

                <button class="btn rounded-5" style="border: 1px solid #DDDDDD;">
                    <i class="bi bi-search"></i> Search
                </button>

                <button class="btn rounded-5" style="border: 1px solid #DDDDDD;">
                    <i class="bi bi-plus"></i> Add Data
                </button>
            </div>
        </div>

        <div class="table-responsive">
            <table class="table table-borderless align-middle">
                <thead>
                    <tr>
                        <th scope="col" style="background-color :rgba(248, 248, 249, 0); ">#</th>
                        <th scope="col" style="background-color :rgba(248, 248, 249, 0); ">Department Name</th>
                        <th scope="col" style="background-color :rgba(248, 248, 249, 0); ">Manager</th>
                        <th scope="col" style="background-color :rgba(248, 248, 249, 0); ">Status</th>
                        <th scope="col" style="background-color :rgba(248, 248, 249, 0); ">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <th scope="row" style="background-color :rgba(248, 248, 249, 0); ">1</th>
                        <td style="background-color :rgba(248, 248, 249, 0); ">IT Department</td>
                        <td style="background-color :rgba(248, 248, 249, 0); ">John Doe</td>
                        <td style="background-color :rgba(248, 248, 249, 0); "><span class="badge bg-success">Active</span></td>
                        <td style="background-color :rgba(248, 248, 249, 0); ">
                            <button class="btn btn-sm btn-outline-primary">Edit</button>
                            <button class="btn btn-sm btn-outline-danger">Delete</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</x-office-layout>
