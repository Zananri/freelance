<x-office-layout>
    <x-slot name="menu_active">
        {{ __('employee') }}
    </x-slot>
    <x-slot name="head_slot">
        <link href="{{ asset('asset/css/edit-employee.css') }}" rel="stylesheet">
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
        <h2 class="m-0">Employee Edit</h2>
    </div>

    <div class="body-content scrollable-container rounded-4 edit-employee-container">
        <div class="modal-loading-overlay d-none" id="employeeEditLoader">
            <div class="loader-spinner"></div>
        </div>

        <form id="employeeEditForm" class="needs-validation" enctype="multipart/form-data" novalidate
            action="{{ url('employee/' . $employee->id) }}" method="POST">
            <div class="form-container flex-grow-1 overflow-auto py-3 px-3">
                @csrf
                @method('PUT')
                <div class="px-3 py-3" style="">
                    <div class="row">
                        <!-- Left Section -->
                        <div class="col-md-4">
                            <div class="custom-form-employee">
                                <label for="employee_name" class="form-label">Employee Name</label>
                                <input type="text" id="employee_name" name="employee_name"
                                    class="form-control input-text" value="{{ $employee->name }}" required />
                                <div class="invalid-feedback">
                                    Please enter the employee name.
                                </div>
                            </div>
                            <div class="custom-form-employee">
                                <label for="employee_niks" class="form-label">Employee ID</label>
                                <input type="text" id="employee_niks" name="employee_niks"
                                    class="form-control input-text" value="{{ $employee->employee_niks }}" />
                                <div class="invalid-feedback">
                                    Please enter the employee NIKS.
                                </div>
                            </div>
                            <div class="custom-form-employee">
                                <label for="employee_email" class="form-label">Employee Email</label>
                                <input type="email" id="employee_email" name="employee_email"
                                    class="form-control input-text" value="{{ $employee->email }}" required />
                                <div class="invalid-feedback">
                                    Please enter a valid email.
                                </div>
                            </div>
                            <div class="custom-form-employee">
                                <label for="employee_email_work" class="form-label">Email Work</label>
                                <input type="email" id="employee_email_work" name="employee_email_work"
                                    class="form-control input-text" value="{{ $employee->email_work }}" />
                                <div class="invalid-feedback">
                                    Please enter a valid email work.
                                </div>
                            </div>
                            <div class="custom-form-employee">
                                <label for="employee_phone" class="form-label">Employee Phone</label>
                                <input type="number" id="employee_phone" name="employee_phone"
                                    class="form-control input-text" value="{{ $employee->phone }}" required />
                                <div class="invalid-feedback">
                                    Please enter the employee phone.
                                </div>
                            </div>
                            <div class="custom-form-employee">
                                <label for="address" class="form-label">Address</label>
                                <textarea id="address" name="address" class="form-control input-text" required>{{ $employee->address }}</textarea>
                                <div class="invalid-feedback">
                                    Please enter the address.
                                </div>
                            </div>
                            <div class="custom-form-employee">
                                <label for="birth_date" class="form-label">Birth Date</label>
                                <input type="date" id="birth_date" name="birth_date" class="form-control input-text"
                                    value="{{ $employee->birth_date }}" required />
                                <div class="invalid-feedback">
                                    Please enter the birth date.
                                </div>
                            </div>

                            <div>
                                <div class="title-label-image-ktp" style="font-size: 14px; color: #555;">
                                    <span>Upload KTP</span>
                                </div>
                                <label for="ktp"
                                    class="custom-image-upload-ktp position-relative ktp-upload {{ $employee->ktp ? 'has-image' : '' }}"
                                    style="background-image: url('{{ $employee->ktp ? asset($employee->ktp) : '' }}'); opacity: {{ $employee->ktp ? '1' : '0.5' }};">
                                    <input type="file" id="ktp" name="ktp" accept="image/*"
                                        class="ktp-input" hidden />
                                    <div class="invalid-feedback" style="position: absolute; bottom: -20px; left: 0;">
                                        Please upload a photo.
                                    </div>
                                    <span class="image-clear-btn {{ $employee->ktp ? '' : 'd-none' }}"
                                        id="ktpClearBtn" title="Remove image">&times;</span>
                                </label>
                            </div>
                            
                            <div class="mb-3">
                                <div class="title-label-image-photo" style="font-size: 14px; color: #555;">
                                    <span>Upload Photo</span>
                                </div>
                                <label for="photo"
                                    class="custom-image-upload-photo position-relative photo-upload {{ $employee->photo ? 'has-image' : '' }}"
                                    style="background-image: url('{{ $employee->photo ? asset($employee->photo) : '' }}'); opacity: {{ $employee->photo ? '1' : '0.5' }}; background-size: cover;">
                                    <input type="file" id="photo" name="photo" accept="image/*"
                                        class="photo-input" hidden />
                                    <div class="invalid-feedback" style="position: absolute; bottom: -20px; left: 0;">
                                        Please upload a photo.
                                    </div>
                                    <span class="image-clear-btn {{ $employee->photo ? '' : 'd-none' }}"
                                        id="photoClearBtn" title="Remove image">&times;</span>
                                </label>
                            </div>


                        </div>

                        <!-- Middle Section -->
                        <div class="col-md-4">

                            <div class="custom-form-employee">
                                <label for="hire_date" class="form-label">Join Date</label>
                                <input type="date" id="hire_date" name="hire_date"
                                    class="form-control input-text" value="{{ $employee->hire_date }}" required />
                                <div class="invalid-feedback">
                                    Please enter the Join date.
                                </div>
                            </div>
                            <div class="custom-form-employee">
                                <label for="contract_end_date" class="form-label">Contract End Date</label>
                                <input type="date" id="contract_end_date" value="{{ $employee->contract_end_date }}" name="contract_end_date" class="form-control input-text"
                                    required />
                                <div class="invalid-feedback">
                                    Please enter the contract end date.
                                </div>
                            </div>

                            <div class="custom-form-employee">
                                <label for="no_bpjs" class="form-label">No BPJS</label>
                                <input type="number" id="no_bpjs" name="no_bpjs" class="form-control input-text"
                                    value="{{ $employee->no_bpjs }}" />
                            </div>

                            <div class="custom-form-employee">
                                <label for="no_bpjstk" class="form-label">No BPJSTK</label>
                                <input type="number" id="no_bpjstk" name="no_bpjstk" class="form-control input-text"
                                    value="{{ $employee->no_bpjstk }}" />
                            </div>

                            <div class="custom-form-employee">
                                <label for="department_id" class="form-label">Partner Name</label>
                                <select id="department_id" name="department_id" class="form-select input-select"
                                    required data-current="{{ $employee->department_id }}" data-current-dept="{{ $employee->department_id }}">
                                    <option value="" disabled>Select Partner</option>
                                    @foreach ($departments as $department)
                                        <option value="{{ $department->id }}"
                                            {{ $employee->department_id == $department->id ? 'selected' : '' }}>
                                            {{ $department->name_department ?? $department->name }}
                                        </option>
                                    @endforeach
                                </select>
                                <div class="invalid-feedback">
                                    Please select a partner.
                                </div>
                            </div>
                            <div class="custom-form-employee">
                                <label for="division_id" class="form-label">Site Name</label>
                                <select id="division_id" name="division_id" class="form-select input-select" required
                                    data-current="{{ $employee->division_id }}">
                                    <option value="" disabled>Select Site</option>
                                    @foreach ($divisions as $division)
                                        <option value="{{ $division->id }}"
                                            {{ $employee->division_id == $division->id ? 'selected' : '' }}>
                                            {{ $division->name_division ?? $division->name }}
                                        </option>
                                    @endforeach
                                </select>
                                <div class="invalid-feedback">
                                    Please select a site.
                                </div>
                            </div>
                            <div class="custom-form-employee">
                                <label for="job_id" class="form-label">Job Name</label>
                                <select id="job_id" name="job_id" class="form-select input-select" required
                                    data-current="{{ $employee->job_id }}">
                                    <option value="" disabled>Select Job</option>
                                    @foreach ($jobs as $job)
                                        <option value="{{ $job->id }}"
                                            {{ $employee->job_id == $job->id ? 'selected' : '' }}>
                                            {{ $job->job_name ?? $job->name }}
                                        </option>
                                    @endforeach
                                </select>
                                <div class="invalid-feedback">
                                    Please select a job.
                                </div>
                            </div>
                            <div class="custom-form-employee">
                                <label for="grade_id" class="form-label">Grade</label>
                                <select id="grade_id" name="grade_id" class="form-select input-select" required>
                                    <option value="" disabled>Select Grade</option>
                                    @foreach ($grades ?? [] as $g)
                                        <option value="{{ $g->id }}"
                                            {{ (int) $employee->grade_id === (int) $g->id ? 'selected' : '' }}>
                                            {{ $g->title }}</option>
                                    @endforeach
                                </select>
                                <div class="invalid-feedback">
                                    Please select a grade.
                                </div>
                            </div>
                            <div class="custom-form-employee">
                                <label for="office" class="form-label">Office</label>
                                <select id="office" name="office" class="form-select input-select" required>
                                    <option value="" disabled>Select Office</option>
                                    @foreach ($offices ?? [] as $o)
                                        <option value="{{ $o->id }}"
                                            {{ (int) $employee->office === (int) $o->id ? 'selected' : '' }}>
                                            {{ $o->name }}</option>
                                    @endforeach
                                </select>
                                <div class="invalid-feedback">
                                    Please select an office.
                                </div>
                            </div>

                            <!-- Status selection -->
                            @php
                                $currentStatus = strtoupper($employee->status ?? 'ACTIVE');
                                if ($currentStatus === 'INACTIVE') { $currentStatus = 'RESIGN'; }
                            @endphp
                            <div class="custom-form-employee">
                                <label for="status" class="form-label">Status</label>
                                <select id="status" name="status" class="form-select input-select" required>
                                    <option value="ACTIVE" {{ $currentStatus === 'ACTIVE' ? 'selected' : '' }}>ACTIVE</option>
                                    <option value="RESIGN" {{ $currentStatus === 'RESIGN' ? 'selected' : '' }}>RESIGN</option>
                                    <option value="CANDIDATE" {{ $currentStatus === 'CANDIDATE' ? 'selected' : '' }}>CANDIDATE</option>
                                </select>
                                <div class="invalid-feedback">
                                    Please select a status.
                                </div>
                            </div>

                            <!-- Shift selection (from shifts table) -->
                            <div class="custom-form-employee">
                                <label for="shift_id" class="form-label">Shift</label>
                                <select id="shift_id" name="shift_id" class="form-select input-select" required
                                    data-current="{{ $employee->shift_id }}"
                                    data-fetch-url="{{ route('shift.list') }}">
                                    <option value="" disabled>Select Shift</option>
                                </select>
                                <div class="invalid-feedback">
                                    Please select a shift.
                                </div>
                            </div>

                        </div>

                        <!-- Right Section -->
                        <div class="col-md-3">

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
                                <input type="text" id="basic_salary" class="form-control input-text" value="{{ $employeeSalaries->basic_salary }}" required />
                                <input type="number" name="basic_salary" class="d-none" value="{{ $employeeSalaries->basic_salary }}" required />
                                <div class="invalid-feedback">
                                    Please enter the basic salary.
                                </div>
                            </div>

                            <div class="custom-form-employee mb-3">
                                <label for="positional_allowance" class="form-label">Positional allowance</label>
                                <input type="text" id="positional_allowance" class="form-control input-text" value="{{ $employeeSalaries->positional_allowance }}" required />
                                <input type="number" name="positional_allowance" class="d-none" value="{{ $employeeSalaries->positional_allowance }}" required />
                                <div class="invalid-feedback">
                                    Please enter the Positional allowance
                                </div>
                            </div>

                            <div class="custom-form-employee mb-3"> 
                                <label for="bpjs_allowance" class="form-label">BPJS allowance</label>
                                <input type="text" id="bpjs_allowance" class="form-control input-text" value="{{ $employeeSalaries->bpjs_allowance }}" required />
                                <input type="number" name="bpjs_allowance" class="d-none" value="{{ $employeeSalaries->bpjs_allowance }}" required />
                                <div class="invalid-feedback">
                                    Please enter the BPJS allowance
                                </div>
                            </div>

                            <div class="custom-form-employee mb-3">
                                <label for="bpjs_tenaga_kerja_allowance" class="form-label">BPJS Tenaga Kerja Allowance</label>
                                <input type="text" id="bpjs_tenaga_kerja_allowance" class="form-control input-text" value="{{ $employeeSalaries->bpjs_tenaga_kerja_allowance }}" required />
                                <input type="number" name="bpjs_tenaga_kerja_allowance" class="d-none" value="{{ $employeeSalaries->bpjs_tenaga_kerja_allowance }}" required />
                                <div class="invalid-feedback">
                                    Please enter the BPJS Tenaga Kerja Allowance
                                </div>
                            </div>

                            <div class="custom-form-employee mb-3">
                                <label for="pension_allowance" class="form-label">Pension Allowance</label>
                                <input type="text" id="pension_allowance" class="form-control input-text" value="{{ $employeeSalaries->pension_allowance }}" required />
                                <input type="number" name="pension_allowance" class="d-none" value="{{ $employeeSalaries->pension_allowance }}" required />
                                <div class="invalid-feedback">
                                    Please enter the Pension allowance
                                </div>
                            </div>

                            <div class="custom-form-employee mb-3">
                                <label for="bank_name" class="form-label">Bank Name</label>
                                <select name="bank_name" id="bank_name" class="form-select input-text">

                                    <option value="BCA" {{ $employeeSalaries->bank_name === 'BCA' ? 'selected' : ''}} >BCA</option>
                                    <option value="BNI" {{ $employeeSalaries->bank_name === 'BNI' ? 'selected' : ''}} >BNI</option>
                                    <option value="BRI" {{ $employeeSalaries->bank_name === 'BRI' ? 'selected' : ''}} >BRI</option>
                                    <option value="Mandiri" {{ $employeeSalaries->bank_name === 'Mandiri' ? 'selected' : ''}} >Mandiri</option>
                                </select>
                                <div class="invalid-feedback">
                                    Please select the Bank Name
                                </div>
                            </div>

                            <div class="custom-form-employee mb-3">
                                <label for="bank_account_number" class="form-label">Bank Account Number</label>
                                <input type="text" id="bank_account_number" name="bank_account_number" value="{{ $employeeSalaries->bank_account_number }}" class="form-control input-text" required />
                                <div class="invalid-feedback">
                                    Please enter the Bank Account Number
                                </div>
                            </div>

                            <div class="custom-form-employee mb-3">
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

                            <div class="custom-form-employee mb-5">
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
                <button type="submit" class="btn-submit-black">Update Employee</button>
            </div>
        </form>
    </div>

    <div id="formAlert" class="mt-3"></div>

    <div id="floatingAlert" class="alert alert-success d-none d-flex align-items-center" role="alert"
        style="position: fixed; bottom: 20px; right: 20px; z-index: 9999; min-width: 300px; border-radius: 8px; padding: 10px 20px;">
        <svg class="bi flex-shrink-0 me-2" width="24" height="24" role="img" aria-label="Success:">
            <use xlink:href="#check-circle-fill" />
        </svg>
        <div>
            Employee updated successfully.
        </div>
    </div>



    <x-slot name="script_slot">
        <script src="{{ asset('asset/js/jquery.mask.min.js') }}"></script>
        <script src="{{ asset('asset/js/edit-employee.js') }}?v={{ time() }}"></script>
    </x-slot>
</x-office-layout>
