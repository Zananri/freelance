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
        <button class="btn-submit-black" data-bs-toggle="modal" data-bs-target="#addProjectModal">Add Project</button>
    </div>

    <!-- Add Project Modal -->
    <div class="modal fade" id="addProjectModal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1"
        aria-labelledby="addProjectModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content modal-content-custom">
                <div class="modal-header modal-header-custom">
                    <h5 class="modal-title modal-title-custom" id="addProjectModalLabel">Add Project</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <form id="addProjectForm" enctype="multipart/form-data">
                    <div class="modal-body modal-body-custom">
                        <div class="mb-3">
                            <div class="title-label-image">
                                <span>Upload image</span>
                            </div>
                            <label for="image" class="custom-image-upload position-relative" id="imageLabel"
                                style=" background-position: center center; background-repeat: no-repeat; background-size: 50%;  background-image: url('{!! asset('asset/img/background/add-image.png') !!}');">
                                <input type="file" class="input-image" id="image" name="image" accept="image/*"
                                hidden>
                                <span class="image-clear-btn d-none" id="imageClearBtn"
                                    title="Remove image">&times;</span>
                            </label>
                            <div class="invalid-feedback">
                                Please select an image file.
                            </div>
                        </div>
                        <div class="mb-3">
                            <label for="title" class="form-label">Title</label>
                            <input type="text" class="form-control input-text" id="title" name="title"
                                required>
                        </div>
                        <div class="mb-3">
                            <label for="description" class="form-label">Description</label>
                            <textarea class="form-control input-text" id="description" name="description" rows="3"></textarea>
                        </div>
                        <div class="mb-3">
                            <label for="department" class="form-label">Department</label>
                            <select class="form-select input-select" id="department" name="department" required>
                                <option value="">Select Department</option>
                                <!-- Options to be populated dynamically -->
                            </select>
                        </div>
                        <div class="mb-3">
                            <label for="division" class="form-label">Division</label>
                            <select class="form-select input-select" id="division" name="division" required>
                                <option value="">Select Division</option>
                                <!-- Options to be populated dynamically -->
                            </select>
                        </div>
                        <div class="mb-3">
                            <label for="reference_url" class="form-label">Reference URL</label>
                            <input type="text" class="form-control input-text" id="reference_url"
                                name="reference_url">
                        </div>
                        <div class="mb-3">
                            <label for="reference_file" class="form-label">Reference File</label>
                            <input type="file" class="form-control input-text" id="reference_file"
                                name="reference_file" accept=".pdf,.doc,.docx">
                        </div>
                        <div class="mb-3 d-flex justify-content-between">
                            <div style="width: 48%;">
                                <label for="start_date" class="form-label">Start Date</label>
                                <input type="date" class="form-control input-text" id="start_date" name="start_date"
                                    required>
                            </div>
                            <div style="width: 48%;">
                                <label for="due_date" class="form-label">Due Date</label>
                                <input type="date" class="form-control input-text" id="due_date" name="due_date"
                                    required>
                            </div>
                        </div>
                        <div class="mb-3">
                            <label for="part_of_project" class="form-label">Part of Project</label>
                            <select class="form-select input-select" id="part_of_project" name="part_of_project">
                                <option value="">Select Project</option>
                                <!-- Options to be populated dynamically -->
                            </select>
                        </div>
                    </div>
                    <div class="modal-footer modal-footer-custom">
                        <button type="submit" class="btn-submit-black btn-submit-custom">Submit</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <div class="container my-4">
        <div class="row">
            <div class="col-md-4 mb-4">
                <a href="#" class="card-link">
                    <div class="card shadow-sm rounded-4 p-3 position-relative"
                        style="background-color: rgb(240, 241, 248); border:0;">
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
                                            <span
                                                class="material-symbols-outlined icon-format_list_bulleted">format_list_bulleted</span>
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
                    <div class="card shadow-sm rounded-4 p-3 position-relative"
                        style="background-color: rgb(240, 241, 248); border:0;">
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
                                            <span
                                                class="material-symbols-outlined icon-format_list_bulleted">format_list_bulleted</span>
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
                    <div class="card shadow-sm rounded-4 p-3 position-relative"
                        style="background-color: rgb(240, 241, 248); border:0;">
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
                                            <span
                                                class="material-symbols-outlined icon-format_list_bulleted">format_list_bulleted</span>
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
                    <div class="card shadow-sm rounded-4 p-3 position-relative"
                        style="background-color: rgb(240, 241, 248); border:0;">
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
                                            <span
                                                class="material-symbols-outlined icon-format_list_bulleted">format_list_bulleted</span>
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

        <x-slot name="script_slot">

            <script src="{{ asset('asset/js/project.js') }}"></script>

            <script></script>
        </x-slot>
</x-office-layout>
