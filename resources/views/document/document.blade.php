<x-office-layout>
    <x-slot name="menu_active">
        {{ __('document.documents') }}
    </x-slot>
    <x-slot name="head_slot">
        <link href="{{ asset('asset/css/document.css') }}?v={{ date('YmdHi') }}" rel="stylesheet">
        @php
            $currentUser = auth()->user();
            $currentEmployee = $currentUser?->employee;
            $currentUserType = strtoupper($currentUser->user_type ?? '');
            $currentUserRole = strtoupper($currentUser->user_role ?? '');
        @endphp
        <meta name="current-user-id" content="{{ auth()->id() }}">
        <meta name="current-user-type" content="{{ $currentUserType }}">
        <meta name="current-user-role" content="{{ $currentUserRole }}">
        <meta name="current-employee-id" content="{{ $currentEmployee?->id ?? '' }}">
        <meta name="current-employee-department-id" content="{{ $currentEmployee?->department_id ?? '' }}">
        <meta name="current-employee-department-name"
            content="{{ $currentEmployee?->department?->name_department ?? '' }}">
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
        <div class="document-header d-flex align-items-center">
            <div class="document-title w-100">
                <h2 id="breadcrumbDocument" class="text-title-content" data-documents-label="{{ __('document.documents') }}"></h2>
            </div>
            <div class="document-toolbar">
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
                <button class="btn btn-filter-document d-flex align-items-center dropdown-toggle no-caret"
                    data-bs-toggle="dropdown">
                    <span class="material-symbols-outlined">filter_list</span>
                    <span class="ms-2">{{ __('document.filter') }}</span>
                </button>
                <div class="dropdown-menu filter-dropdown filter-dropdown-panel p-3">
                    <div class="d-flex align-items-start justify-content-between gap-3 mb-3">
                        <div>
                            <div class="filter-panel-title">{{ __('document.quick_filters') }}</div>
                            <div class="filter-panel-subtitle">{{ __('document.refine_documents') }}</div>
                        </div>
                        <button type="button" class="btn btn-link p-0 filter-reset-btn"
                            id="btnResetDocumentFilters">{{ __('document.reset') }}</button>
                    </div>
                    <div class="filter-section mb-3">
                        <div class="filter-section-title">{{ __('document.access') }}</div>
                        @if ($currentUserType === 'SUPERADMIN')
                            <div class="mb-2">
                                <label class="form-label label-custom mb-1" for="filter_department">{{ __('document.partner') }}</label>
                                <select id="filter_department" class="form-select form-select-sm border-0"></select>
                            </div>
                        @elseif ($currentUserType === 'ADMINISTRATOR')
                            <div class="filter-fixed-chip mb-2">
                                {{ __('document.partner') }}: {{ $currentEmployee?->department?->name_department ?? '-' }}
                            </div>
                        @endif
                        <div class="mb-2">
                            <label class="form-label label-custom mb-1" for="filter_site">{{ __('document.site') }}</label>
                            <select id="filter_site" class="form-select form-select-sm border-0"></select>
                        </div>
                        <div class="mb-2">
                            <label class="form-label label-custom mb-1" for="filter_job">{{ __('document.job') }}</label>
                            <select id="filter_job" class="form-select form-select-sm border-0"></select>
                        </div>
                    </div>
                    <div class="filter-section">
                        <div class="filter-section-title">{{ __('document.content') }}</div>
                        <div class="mb-2">
                            <label class="form-label label-custom mb-1" for="filter_type">{{ __('document.item_type') }}</label>
                            <select id="filter_type" class="form-select form-select-sm border-0">
                                <option value="all">{{ __('document.all') }}</option>
                                <option value="folder">{{ __('document.folder') }}</option>
                                <option value="file">{{ __('document.file') }}</option>
                            </select>
                        </div>
                        <div class="mb-2">
                            <label class="form-label label-custom mb-1" for="filter_extension">{{ __('document.file_type') }}</label>
                            <select id="filter_extension" class="form-select form-select-sm border-0">
                                <option value="all">{{ __('document.all') }}</option>
                                <option value="pdf">PDF</option>
                                <option value="doc">DOC</option>
                                <option value="docx">DOCX</option>
                                <option value="xls">XLS</option>
                                <option value="xlsx">XLSX</option>
                                <option value="mp3">MP3</option>
                                <option value="mp4">MP4</option>
                                <option value="png">PNG</option>
                                <option value="jpg">JPG</option>
                                <option value="jpeg">JPEG</option>
                            </select>
                        </div>
                        <div class="mb-0">
                            <label class="form-label label-custom mb-1" for="filter_updated">{{ __('document.last_update') }}</label>
                            <select id="filter_updated" class="form-select form-select-sm border-0">
                                <option value="all">{{ __('document.all') }}</option>
                                <option value="7">{{ __('document.last_7_days') }}</option>
                                <option value="30">{{ __('document.last_30_days') }}</option>
                                <option value="365">{{ __('document.last_year') }}</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
            <div class="dropdown">
                <button class="btn btn-add-document px-3 py-2 dropdown-toggle no-caret" data-bs-toggle="dropdown">
                    <span class="material-symbols-outlined">add</span>
                </button>
                <div class="dropdown-menu">
                    <div class="dropdown-item add-doc add-folder">{{ __('document.add_folder') }}</div>
                    <div class="dropdown-item add-doc add-files">{{ __('document.add_files') }}</div>
                </div>
            </div>
            </div>
        </div>
    </div>

    {{-- Table View --}}
    <div class="body-content scrollable-container table-view rounded-4 p-3 position-relative">
        <div id="tableLoader" class="loader">
            <div class="box-loader rounded-4 bg-body bg-opacity-75 position-absolute top-0 start-0 w-100 h-100">
                <div class="spinner-border text-secondary" style="width: 3rem; height: 3rem;" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        </div>
        <div class="d-flex justify-content-between align-items-center mb-4">
            <table class="document-table">
                <thead>
                    <tr>
                        <th class="sortable" data-sort="folder_name">
                            Name
                            <span class="material-symbols-outlined">swap_vert</span>
                        </th>
                        <th class="sortable" data-sort="owner">
                            Owner
                            <span class="material-symbols-outlined">swap_vert</span>
                        </th>
                        <th>
                            File Size
                            <span class="material-symbols-outlined">swap_vert</span>
                        </th>
                        <th class="sortable" data-sort="updated_at">
                            Last Update
                            <span class="material-symbols-outlined">swap_vert</span>
                        </th>
                        <th></th>
                    </tr>
                </thead>
                <tbody id="tableFolderBody">
                    @foreach ($initialDocuments['folders'] as $folder)
                        <tr class="folder-row" data-id="{{ $folder['id'] }}"
                            data-folder-name="{{ $folder['folder_name'] }}">
                            <td>
                                <div class="d-flex align-items-center">
                                    <span class="material-symbols-outlined me-2">folder</span>
                                    {{ $folder['folder_name'] }}
                                </div>
                            </td>
                            <td>{{ data_get($folder, 'creator.name', 'Unknown') }}</td>
                            <td>-</td>
                            <td>{{ \Carbon\Carbon::parse($folder['updated_at'])->format('d/m/Y') }}</td>
                            <td></td>
                        </tr>
                    @endforeach
                    @foreach ($initialDocuments['files'] as $file)
                        <tr class="file-row" data-file-id="{{ $file['id'] }}"
                            data-file-name="{{ $file['file_name'] }}"
                            data-file-url="{{ asset($file['file_path']) }}">
                            <td>
                                <div class="d-flex align-items-center">
                                    <span class="material-symbols-outlined me-2">insert_drive_file</span>
                                    {{ $file['file_name'] }}
                                </div>
                            </td>
                            <td>{{ data_get($file, 'employee.name', 'Unknown') }}</td>
                            <td>{{ number_format(((int) $file['file_size']) / 1024, 2) }} KB</td>
                            <td>{{ \Carbon\Carbon::parse($file['updated_at'])->format('d/m/Y') }}</td>
                            <td></td>
                        </tr>
                    @endforeach
                    @if (empty($initialDocuments['folders']) && empty($initialDocuments['files']))
                        <tr>
                            <td colspan="5" class="text-center text-muted py-5">
                                Nothing documents found
                            </td>
                        </tr>
                    @endif
                </tbody>
            </table>
        </div>
    </div>

    {{-- Grid View --}}
    <div class="grid-view d-none mt-5 position-relative" id="gridFolderBody">
        <div id="gridLoader" class="loader">
            <div class="box-loader rounded-4 bg-body bg-opacity-75 position-absolute top-0 start-0 w-100 h-100">
                <div class="spinner-border text-secondary" style="width: 3rem; height: 3rem;" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        </div>
        <div class="folder-wrapper">
            <div class="folder-shadow-tab"></div>
            <div class="folder-shadow"></div>
            <div class="folder-tab"></div>
            <div class="folder-body">
                <p class="folder-name"></p>
                <p class="folder-role"></p>
                <hr class="folder-divider">
                <div class="folder-footer">
                    <div class="folder-avatar"></div>
                    <span class="folder-items"></span>
                </div>
            </div>
        </div>
    </div>

    <div class="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2" id="documentPaginationWrap">
        <div class="document-pagination-info" id="documentPaginationInfo"></div>
        <div class="document-pagination" id="documentPagination"></div>
    </div>

    <div class="modal fade" id="modalCreateFolder" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content modal-content-custom">

                <form id="formCreateFolder">

                    @csrf

                    <div class="modal-header border-0 position-relative d-flex justofy-content-center">
                        <h5 class="modal-title modal-title-custom">
                            Create Folder
                        </h5>

                        <button type="button" class="btn-close" data-bs-dismiss="modal">
                        </button>
                    </div>

                    <div class="modal-body modal-footer-custom">

                        <input type="hidden" id="parent_folder_id" name="parent_folder_id">

                        <div class="mb-3">

                            <label class="form-label label-custom">
                                Folder Name
                            </label>

                            <input type="text" class="form-control input-text border-0" id="folder_name"
                                name="folder_name" placeholder="Enter folder name">

                        </div>

                    </div>

                    <div class="modal-footer modal-footer-custom">

                        <button type="button" class="btn btn-light" data-bs-dismiss="modal">
                            Cancel
                        </button>

                        <button type="submit" class="btn btn-submit-black">
                            Create
                        </button>

                    </div>

                </form>

            </div>
        </div>
    </div>

    <div class="modal fade" id="modalUploadFiles" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content modal-content-custom">
                <div class="modal-header border-0 position-relative d-flex justofy-content-center">
                    <h5 class="modal-title modal-title-custom">
                        Upload Files
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body modal-footer-custom">
                    <div class="mb-3">
                        <label class="form-label label-custom">Select files</label>
                        <button type="button" class="btn btn-outline-dark w-100" id="openFileExplorer">
                            Choose files
                        </button>
                        <input type="file" class="d-none" id="documentFilesInput" name="files[]" multiple>
                    </div>
                    <div id="uploadPreviewList" class="d-flex flex-column gap-2"></div>
                </div>
                <div class="modal-footer modal-footer-custom">
                    <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-submit-black" id="uploadSelectedFiles">Upload</button>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade" id="modalEditFolder" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content modal-content-custom">

                <form id="formEditFolder">

                    @csrf

                    <div class="modal-header border-0 position-relative d-flex justofy-content-center">
                        <h5 class="modal-title modal-title-custom">
                            Rename Folder
                        </h5>

                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>

                    <div class="modal-body modal-footer-custom">

                        <input type="hidden" id="edit_folder_id" name="folder_id">

                        <div class="mb-3">

                            <label class="form-label label-custom">
                                Folder Name
                            </label>

                            <input type="text" class="form-control input-text border-0" id="edit_folder_name"
                                name="folder_name" placeholder="Enter folder name">

                        </div>

                    </div>

                    <div class="modal-footer modal-footer-custom">

                        <button type="button" class="btn btn-light" data-bs-dismiss="modal">
                            Cancel
                        </button>

                        <button type="submit" class="btn btn-submit-black">
                            Save
                        </button>

                    </div>

                </form>

            </div>
        </div>
    </div>

    <div class="modal fade" id="modalDeleteFolder" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content modal-content-custom">

                <div class="modal-header border-0 position-relative d-flex justofy-content-center">
                    <h5 class="modal-title modal-title-custom">
                        Confirm Delete
                    </h5>

                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>

                <div class="modal-body modal-footer-custom text-center">
                    <p>Are you sure you want to delete this folder and all its child folders?</p>
                </div>

                <div class="modal-footer modal-footer-custom">
                    <button type="button" class="btn btn-light" data-bs-dismiss="modal">
                        No
                    </button>
                    <button type="button" class="btn btn-submit-black" id="confirmDeleteFolder">
                        Yes
                    </button>
                </div>

            </div>
        </div>
    </div>

    <div class="modal fade" id="modalEditFile" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content modal-content-custom">
                <form id="formEditFile">
                    @csrf
                    <div class="modal-header border-0 position-relative d-flex justofy-content-center">
                        <h5 class="modal-title modal-title-custom">Change File Name</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body modal-footer-custom">
                        <input type="hidden" id="edit_file_id" name="file_id">
                        <div class="mb-3">
                            <label class="form-label label-custom">File Name</label>
                            <input type="text" class="form-control input-text border-0" id="edit_file_name"
                                name="file_name" placeholder="Enter file name">
                        </div>
                    </div>
                    <div class="modal-footer modal-footer-custom">
                        <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button>
                        <button type="submit" class="btn btn-submit-black">Save</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <div class="modal fade" id="modalDeleteFile" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content modal-content-custom">
                <div class="modal-header border-0 position-relative d-flex justofy-content-center">
                    <h5 class="modal-title modal-title-custom">Confirm Delete</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body modal-footer-custom text-center">
                    <p>Are you sure you want to delete this file?</p>
                </div>
                <div class="modal-footer modal-footer-custom">
                    <button type="button" class="btn btn-light" data-bs-dismiss="modal">No</button>
                    <button type="button" class="btn btn-submit-black" id="confirmDeleteFile">Yes</button>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade" id="modalFileDetail" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content modal-content-custom">
                <div class="modal-header border-0 position-relative d-flex justofy-content-center">
                    <h5 class="modal-title modal-title-custom">File Detail</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body modal-footer-custom" id="fileDetailContent">
                </div>
                <div class="modal-footer modal-footer-custom">
                    <button type="button" class="btn btn-light" data-bs-dismiss="modal">Close</button>
                </div>
            </div>
        </div>
    </div>

    <div class="alert-delete-container mb-3" style="width: 100%;"></div>

    <x-slot name="script_slot">
        <script>
            window.documentTranslations = {
                documents: @json(__('document.documents')),
            };
            window.documentRoutes = {
                getAllFolder: @json(route('document.getAllFolder')),
            };
            window.initialDocumentData = @json($initialDocuments);
        </script>
        <script src="{{ asset('asset/js/document.js') }}?v={{ filemtime(public_path('asset/js/document.js')) }}"></script>
        <script src="{{ asset('asset/js/date_helper.js') }}"></script>

        <script></script>
    </x-slot>


</x-office-layout>
