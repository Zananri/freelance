<x-office-layout>
    <x-slot name="menu_active">
        {{ __('employee') }}
    </x-slot>
    <x-slot name="head_slot">
        <link href="{{ asset('asset/css/employee-create.css') }}" rel="stylesheet">
    </x-slot>

    <div class="title-content d-flex align-items-center gap-2">
        <div class="nav-item d-inline-block">
            <div class="nav-icon-arrow">
                <a href="{{ url('employee') }}" class="text-decoration-none text-dark d-flex align-items-center">
                    <div class="d-flex">
                        <span class="material-symbols-outlined">arrow_back</span>
                    </div>
                </a>
            </div>
        </div>
        <h2 class="m-0">Employee Create</h2>
    </div>

    <div class="body-content scrollable-container rounded-4 create-employee-container">
        <div class="modal-loading-overlay d-none" id="employeeCreateLoader">
            <div class="loader-spinner"></div>
        </div>

        <form id="employeeCreateForm" class="needs-validation" enctype="multipart/form-data" novalidate>
            <div class="form-container flex-grow-1 overflow-auto py-3 px-3">
                <div class="px-3 py-3" style="">
                    <div class="row">
                        <!-- Left Section -->
                        <div class="col-md-4 d-flex flex-column gap-3">

                            <div class="custom-form-employee">
                                <label for="employee_name" class="form-label">Employee Name</label>
                                <input type="text" id="employee_name" name="employee_name"
                                    class="form-control input-text" required />
                                <div class="invalid-feedback">
                                    Please enter the employee name.
                                </div>
                            </div>

                            <div class="custom-form-employee">
                                <label for="employee_niks" class="form-label">Employee ID</label>
                                <input type="text" id="employee_niks" name="employee_niks"
                                    class="form-control input-text" />
                                <div class="invalid-feedback">
                                    Please enter the employee ID.
                                </div>
                            </div>

                            <div class="custom-form-employee">
                                <label for="employee_email" class="form-label">Email</label>
                                <input type="email" id="employee_email" name="employee_email"
                                    class="form-control input-text" required />
                                <div class="invalid-feedback">
                                    Please enter a valid email.
                                </div>
                            </div>

                            <div class="custom-form-employee">
                                <label for="employee_email_work" class="form-label">Email Work</label>
                                <input type="email" id="employee_email_work" name="employee_email_work"
                                    class="form-control input-text" required />
                                <div class="invalid-feedback">
                                    Please enter a valid work email.
                                </div>
                            </div>

                            <div class="custom-form-employee">
                                <label for="employee_phone" class="form-label">Phone</label>
                                <input type="number" id="employee_phone" name="employee_phone"
                                    class="form-control input-text" required />
                                <div class="invalid-feedback">
                                    Please enter the employee phone.
                                </div>
                            </div>

                            <div class="custom-form-employee">
                                <label for="address" class="form-label">Address</label>
                                <textarea id="address" name="address" class="form-control input-text" required></textarea>
                                <div class="invalid-feedback">
                                    Please enter the address.
                                </div>
                            </div>

                            <div class="custom-form-employee">
                                <label for="birth_date" class="form-label">Birth Date</label>
                                <input type="date" id="birth_date" name="birth_date" class="form-control input-text"
                                    required />
                                <div class="invalid-feedback">
                                    Please enter the birth date.
                                </div>
                            </div>

                            <div>
                                <div class="title-label-image-ktp" style="font-size:14px;color:#555;">
                                    <span>Upload KTP</span>
                                </div>

                                <label for="ktp" class="custom-image-upload-ktp position-relative ktp-upload">
                                    <input type="file" id="ktp" name="ktp" accept="image/*,.pdf"
                                        class="ktp-input" hidden required />

                                    <div class="invalid-feedback" style="position:absolute;bottom:-20px;left:0;">
                                        Please upload KTP.
                                    </div>

                                    <span class="image-clear-btn d-none" id="ktpClearBtn" title="Remove image">
                                        &times;
                                    </span>
                                </label>
                            </div>

                            <div>
                                <div class="title-label-image-photo" style="font-size:14px;color:#555;">
                                    <span>Upload Photo</span>
                                </div>

                                <label for="photo" class="custom-image-upload-photo position-relative photo-upload">
                                    <input type="file" id="photo" name="photo" accept="image/*"
                                        class="photo-input" hidden required />

                                    <div class="invalid-feedback" style="position:absolute;bottom:-20px;left:0;">
                                        Please upload a photo.
                                    </div>

                                    <span class="image-clear-btn d-none" id="photoClearBtn" title="Remove image">
                                        &times;
                                    </span>
                                </label>
                            </div>

                        </div>

                        <!-- Middle Section -->
                        <div class="col-md-4 d-flex flex-column gap-3">

                            <div class="custom-form-employee">
                                <label for="hire_date" class="form-label">Join Date</label>
                                <input type="date" id="hire_date" name="hire_date"
                                    class="form-control input-text" required />
                                <div class="invalid-feedback">
                                    Please enter the join date.
                                </div>
                            </div>

                            <div class="custom-form-employee">
                                <label for="contract_end_date" class="form-label">Contract End Date</label>
                                <input type="date" id="contract_end_date" name="contract_end_date"
                                    class="form-control input-text" />
                            </div>

                            <div class="custom-form-employee">
                                <label for="no_bpjs" class="form-label">No BPJS</label>
                                <input type="number" id="no_bpjs" name="no_bpjs" class="form-control input-text" />
                            </div>

                            <div class="custom-form-employee">
                                <label for="no_bpjstk" class="form-label">No BPJSTK</label>
                                <input type="number" id="no_bpjstk" name="no_bpjstk"
                                    class="form-control input-text" />
                            </div>

                            <div class="custom-form-employee">
                                <label for="department_id" class="form-label">Partner</label>
                                <select id="department_id" name="department_id" class="form-select input-select"
                                    required>
                                    <option value="" disabled selected>Select Partner</option>
                                </select>
                                <div class="invalid-feedback">
                                    Please select a partner.
                                </div>
                            </div>

                            <div class="custom-form-employee">
                                <label for="division_id" class="form-label">Site</label>
                                <select id="division_id" name="division_id" class="form-select input-select"
                                    required>
                                    <option value="" disabled selected>Select Site</option>
                                </select>
                                <div class="invalid-feedback">
                                    Please select a site.
                                </div>
                            </div>

                            <div class="custom-form-employee">
                                <label for="job_id" class="form-label">Job</label>
                                <select id="job_id" name="job_id" class="form-select input-select" required>
                                    <option value="" disabled selected>Select Job</option>
                                </select>
                                <div class="invalid-feedback">
                                    Please select a job.
                                </div>
                            </div>

                            <div class="custom-form-employee">
                                <label for="grade_id" class="form-label">Grade</label>
                                <select id="grade_id" name="grade_id" class="form-select input-select" required>

                                    <option value="" disabled selected>Select Grade</option>

                                    @php
                                        $gradeOptions = $grades ?? [];
                                    @endphp

                                    @foreach ($gradeOptions as $grade)
                                        @php $grade = (object) $grade; @endphp
                                        <option value="{{ $grade->id }}">
                                            {{ $grade->title }}
                                        </option>
                                    @endforeach

                                </select>

                                <div class="invalid-feedback">
                                    Please select a grade.
                                </div>
                            </div>

                            <div class="custom-form-employee">
                                <label for="office" class="form-label">Office</label>
                                <select id="office" name="office" class="form-select input-select" required>

                                    <option value="" disabled selected>Select Office</option>

                                    @php
                                        $officeOptions = $offices ?? [];
                                    @endphp

                                    @foreach ($officeOptions as $office)
                                        @php $office = (object) $office; @endphp
                                        <option value="{{ $office->id }}">
                                            {{ $office->name }}
                                        </option>
                                    @endforeach

                                </select>

                                <div class="invalid-feedback">
                                    Please select an office.
                                </div>
                            </div>

                            <div class="custom-form-employee">
                                <label for="shift_id" class="form-label">Shift</label>

                                <select id="shift_id" name="shift_id" class="form-select input-select"
                                    data-fetch-url="{{ route('shift.list') }}" required>

                                    <option value="" disabled selected>
                                        Select Shift
                                    </option>

                                </select>

                                <div class="invalid-feedback">
                                    Please select a shift.
                                </div>
                            </div>

                        </div>

                        <!-- Right Section -->
                        <div class="col-md-4 d-flex flex-column gap-3">

                            <div class="custom-form-employee mb-3">
                                @php
                                    $thp = $employeeSalaries->basic_salary + $employeeSalaries->positional_allowance + $employeeSalaries->bpjs_allowance+ $employeeSalaries->bpjs_tenaga_kerja_allowance + $employeeSalaries->pension_allowance;                               
                                @endphp
                                <div class="form-label">Take Home Pay THP</div>
                                <div class="fs-14 text-thp">{{$thp}}</div>

                                <input type="text" value="{{ $thp }}" name="hid_thp" class="d-none" >
                            </div>

                            <div class="custom-form-employee mb-3">
                                <label for="basic_salary" class="form-label">Basic Salary</label>
                                <input type="text" id="basic_salary" class="form-control input-text" value="0" required />
                                <input type="number" name="basic_salary" class="d-none" value="0" required />
                                <div class="invalid-feedback">
                                    Please enter the basic salary.
                                </div>
                            </div>

                            <div class="custom-form-employee mb-3">
                                <label for="positional_allowance" class="form-label">Positional allowance</label>
                                <input type="text" id="positional_allowance" class="form-control input-text" value="0" required />
                                <input type="number" name="positional_allowance" class="d-none" value="0" required />
                                <div class="invalid-feedback">
                                    Please enter the Positional allowance
                                </div>
                            </div>

                            <div class="custom-form-employee mb-3">
                                <label for="bpjs_allowance" class="form-label">BPJS Allowance</label>
                                <input type="text" id="bpjs_allowance" class="form-control input-text" value="0" required />
                                <input type="number" name="bpjs_allowance" class="d-none" value="0" required />
                            </div>

                            <div class="custom-form-employee mb-3">
                                <label for="bpjs_tenaga_kerja_allowance" class="form-label">BPJS Tenaga Kerja
                                    Allowance</label>
                                <input type="text" id="bpjs_tenaga_kerja_allowance" class="form-control input-text" value="0" required />
                                <input type="number" name="bpjs_tenaga_kerja_allowance" class="d-none" value="0" />
                            </div>

                            <div class="custom-form-employee mb-3">
                                <label for="pension_allowance" class="form-label">Pension Allowance</label>
                                <input type="text" id="pension_allowance" class="form-control input-text" value="0" required />
                                <input type="number" name="pension_allowance" class="d-none" value="0" required />
                            </div>

                            <div class="custom-form-employee mb-3">
                                <label for="bank_name" class="form-label">Bank Name</label>
                                <select name="bank_name" id="bank_name" class="form-select input-text">
                                    <option value="BCA">BCA</option>
                                    <option value="BNI">BNI</option>
                                    <option value="BRI">BRI</option>
                                    <option value="Mandiri">Mandiri</option>
                                </select>
                                <div class="invalid-feedback">
                                    Please enter the Bank Name
                                </div>
                            </div>

                            <div class="custom-form-employee mb-3">
                                <label for="bank_account_number" class="form-label">Bank Account Number</label>
                                <input type="text" id="bank_account_number" name="bank_account_number" class="form-control input-text" required />
                                <div class="invalid-feedback">
                                    Please enter the Bank Name
                                </div>
                            </div>

                            <div class="custom-form-employee">
                                <label for="cv" class="form-label">CV</label>

                                <input type="file" id="cv" name="cv"
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" hidden>

                                <div class="input-group">
                                    <input type="text" id="cvFileName" class="form-control input-text"
                                        placeholder="No file selected" readonly>

                                    <button type="button" class="btn btn-submit-black"
                                        onclick="document.getElementById('cv').click()">
                                        Upload
                                    </button>
                                </div>
                            </div>

                            <div class="custom-form-employee">
                                <label for="pkwt" class="form-label">PKWT</label>

                                <input type="file" id="pkwt" name="pkwt"
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" hidden>

                                <div class="input-group">
                                    <input type="text" id="pkwtFileName" class="form-control input-text"
                                        placeholder="No file selected" readonly>

                                    <button type="button" class="btn btn-submit-black"
                                        onclick="document.getElementById('pkwt').click()">
                                        Upload
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="form-footer text-center px-2 py-3">
                <button type="submit" class="btn-submit-black">Create Employee</button>
            </div>
        </form>
    </div>
    <div id="formAlert" class="mt-3"></div>

    <div id="formAlert" class="alert alert-success d-none d-flex align-items-center" role="alert"
        style="position: fixed; bottom: 20px; right: 20px; z-index: 9999; min-width: 300px; border-radius: 8px; padding: 10px 20px;">
        <svg class="bi flex-shrink-0 me-2" width="24" height="24" role="img" aria-label="Success:">
            <use xlink:href="#check-circle-fill" />
        </svg>
        <div>
            Employee created successfully!
        </div>
    </div>

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

    <x-slot name="script_slot">
        <script src="{{ asset('asset/js/jquery.mask.min.js') }}"></script>
        <script src="{{ asset('asset/js/employee-create.js?v=' . time()) }}"></script>
    </x-slot>
</x-office-layout>
</create_file>
