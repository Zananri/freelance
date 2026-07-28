<?php

namespace App\Http\Controllers;

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Color;
use PhpOffice\PhpSpreadsheet\Style\Fill;

use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Worksheet\Drawing;

use App\Models\Employee;
use App\Models\EmployeeSalary;
use App\Models\User;
use App\Models\Department;
use App\Models\Division;
use App\Models\Job;
use App\Models\Grade;
use App\Models\Office;
use App\Models\Partner;
use App\Models\EmployeeShift;
use App\Models\Attendance;
use App\Services\EmployeeExcelImportService;
use App\Services\EmployeeDocumentService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class EmployeeController extends Controller
{
    /**
     * Derive HTTP status code from exception, defaulting to 500 for non-HTTP exceptions
     */
    private function deriveHttpStatusFromException(\Throwable $e): int
    {
        $code = $e->getCode();
        if (is_numeric($code)) {
            $int = (int) $code;
            if ($int >= 400 && $int <= 599) {
                return $int;
            }
        }
        return 500;
    }
    /**
     * Determine if a given stored path refers to the shared default avatar.
     */
    private function isDefaultAvatarPath(?string $path): bool
    {
        if (!$path) return false;
        $norm = str_replace('\\', '/', trim($path));
        $norm = ltrim($norm, '/');
        return $norm === 'asset/img/avatar.png';
    }

    private function resolvePartnerContext(?int $partnerId): array
    {
        if (!$partnerId) {
            throw new \Exception('Partner is required');
        }

        $partner = Partner::find($partnerId);
        if (!$partner) {
            throw new \Exception('Partner not found');
        }

        if (!$partner->department_id) {
            throw new \Exception('Selected partner has no department mapping');
        }

        if (!$partner->office_id) {
            throw new \Exception('Selected partner has no wilayah mapping');
        }

        $user = auth()->user();
        if (
            strtoupper((string) ($user?->user_type ?? '')) !== 'SUPERADMIN' &&
            (int) ($user?->employee?->department_id ?? 0) !== (int) $partner->department_id
        ) {
            throw new \Exception('Selected partner is outside your department');
        }

        return [
            'partner_id' => (int) $partner->id,
            'department_id' => (int) $partner->department_id,
            'office_id' => (int) $partner->office_id,
        ];
    }

    private function createEmployeeDocumentStructure(Employee $employee, array $documentSources): void
    {
        app(EmployeeDocumentService::class)->sync(
            $employee,
            (int) auth()->id(),
            $documentSources
        );
    }

    public function showEmployeePage()
    {
        return view('employee.employee');
    }

    public function index(Request $request)
    {
        $user = auth()->user();
        $userId = auth()->user()->id;

        $currentEmployee = Employee::where('user_id', $userId)->first();

        $userType = strtoupper((string) ($user->user_type ?? ''));
        $userRole = strtoupper((string) ($user->user_role ?? ''));

        $query = trim((string) $request->input('query', ''));
        $partnerIds = array_values(array_filter((array) $request->input('department', []), 'is_numeric'));
        $divisionIds = array_values(array_filter((array) $request->input('division', []), 'is_numeric'));
        $jobIds = array_values(array_filter((array) $request->input('job', []), 'is_numeric'));
        $sort = (string) $request->input('sort', '');

        if ($request->wantsJson()) {
            $excludeEmployeeId = $request->input('exclude_employee_id', null);
            $page = max((int) $request->input('page', 1), 1);
            $perPage = (int) $request->input('per_page', 10);
            if (!in_array($perPage, [10, 20, 50, 100], true)) {
                $perPage = 10;
            }

            $employees = Employee::with(['department', 'partner', 'division', 'job', 'user', 'grade', 'officeModel'])
                ->where('status', '!=', 'DELETED');

            if ($userType !== 'SUPERADMIN') {
                $employees->where('department_id', $currentEmployee?->department_id ?? 0);
            }

            $employees = $employees->when($query, function ($q) use ($query) {
                $q->where(function ($q2) use ($query) {
                    $q2->where('name', 'like', '%' . $query . '%')
                        ->orWhere('email', 'like', '%' . $query . '%')
                        ->orWhereHas('officeModel', function ($qOffice) use ($query) {
                            $qOffice->where('name', 'like', '%' . $query . '%');
                        })
                        ->orWhere('email_work', 'like', '%' . $query . '%')
                        ->orWhere('employee_niks', 'like', '%' . $query . '%')
                        ->orWhereHas('partner', function ($q3) use ($query) {
                            $q3->where('partner_name', 'like', '%' . $query . '%');
                        })
                        ->orWhereHas('division', function ($q4) use ($query) {
                            $q4->where('name_division', 'like', '%' . $query . '%');
                        })
                        ->orWhereHas('job', function ($q5) use ($query) {
                            $q5->where('job_name', 'like', '%' . $query . '%');
                        });
                });
            })
                ->when(!empty($partnerIds), function ($q) use ($partnerIds) {
                    $q->whereIn('partner_id', $partnerIds);
                })
                ->when(!empty($divisionIds), function ($q) use ($divisionIds) {
                    $q->whereIn('division_id', $divisionIds);
                })
                ->when(!empty($jobIds), function ($q) use ($jobIds) {
                    $q->whereIn('job_id', $jobIds);
                })
                ->when($excludeEmployeeId, function ($q) use ($excludeEmployeeId) {
                    $q->where('id', '!=', $excludeEmployeeId);
                })
                ->whereHas('user', function ($q) {
                    $q->where('user_type', '!=', 'ADMINISTRATOR')
                        ->whereNotIn('user_role', ['ADMINISTRATOR']);
                });

            switch ($sort) {
                case 'name_asc':
                    $employees->orderBy('name', 'asc');
                    break;
                case 'name_desc':
                    $employees->orderBy('name', 'desc');
                    break;
                case 'hire_date_newest':
                    $employees->orderBy('hire_date', 'desc');
                    break;
                case 'hire_date_oldest':
                    $employees->orderBy('hire_date', 'asc');
                    break;
                case 'contract_date_newest':
                    $employees->orderBy('contract_end_date', 'desc');
                    break;
                case 'contract_date_oldest':
                    $employees->orderBy('contract_end_date', 'asc');
                    break;
                case 'department_asc':
                    $employees->orderBy(
                        Partner::select('partner_name')
                            ->whereColumn('partners.id', 'employees.partner_id')
                            ->limit(1),
                        'asc'
                    );
                    break;
                case 'department_desc':
                    $employees->orderBy(
                        Partner::select('partner_name')
                            ->whereColumn('partners.id', 'employees.partner_id')
                            ->limit(1),
                        'desc'
                    );
                    break;
                case 'division_asc':
                    $employees->orderBy(
                        Division::select('name_division')
                            ->whereColumn('divisions.id', 'employees.division_id')
                            ->limit(1),
                        'asc'
                    );
                    break;
                case 'division_desc':
                    $employees->orderBy(
                        Division::select('name_division')
                            ->whereColumn('divisions.id', 'employees.division_id')
                            ->limit(1),
                        'desc'
                    );
                    break;
                default:
                    $employees->orderBy('id', 'desc');
                    break;
            }

            $paginatedEmployees = $employees->paginate($perPage, ['*'], 'page', $page);

            $paginatedEmployees->getCollection()->transform(function ($employee) {
                $employee->user_photo = $employee->user && $employee->user->photo ? asset($employee->user->photo) : null;
                $employee->hire_date = $employee->hire_date ? Carbon::parse($employee->hire_date)->toDateString() : null;
                $employee->contract_end_date = $employee->contract_end_date ? Carbon::parse($employee->contract_end_date)->toDateString() : null;
                $employee->profile_picture_url = $employee->profile_picture ? asset($employee->profile_picture) : null;
                $employee->first_name = $employee->first_name;
                $employee->last_name = $employee->last_name;

                // Extract values before unsetting relations
                $officeName = $employee->officeModel ? $employee->officeModel->name : null;
                $gradeTitle = $employee->grade ? $employee->grade->title : null;

                // Unset the relations to prevent nested objects in JSON
                unset($employee->officeModel);
                unset($employee->grade);

                // Set as flat properties
                $employee->office = $officeName;
                $employee->grade = $gradeTitle;

                $status = strtoupper((string)($employee->status ?? ''));
                if ($status === 'INACTIVE') {
                    $status = 'RESIGN';
                }
                $employee->status = $status ?: null;
                return $employee;
            });

            return response()->json([
                'data' => $paginatedEmployees->items(),
                'pagination' => [
                    'current_page' => $paginatedEmployees->currentPage(),
                    'last_page' => $paginatedEmployees->lastPage(),
                    'per_page' => $paginatedEmployees->perPage(),
                    'total' => $paginatedEmployees->total(),
                    'from' => $paginatedEmployees->firstItem(),
                    'to' => $paginatedEmployees->lastItem(),
                ],
            ]);
        }


        $employees = Employee::with(['department', 'division', 'job'])
            ->where('status', '!=', 'DELETED');

        if ($userType !== 'SUPERADMIN') {
            $employees->where('department_id', $currentEmployee?->department_id ?? 0);
        }

        $employees = $employees->whereHas('user', function ($q) {
            $q->where('user_type', '!=', 'ADMINISTRATOR')
                ->whereNotIn('user_role', ['ADMINISTRATOR']);
        })
            ->get();
    }

    public function show($id)
    {
        $employee = Employee::with(['department', 'division', 'job', 'grade', 'officeModel', 'user'])->find($id);

        if (!$employee) {
            return response()->json(['message' => 'Employee not found'], 404);
        }

        // Extract grade title before unsetting the relation
        $gradeTitle = $employee->grade ? $employee->grade->title : null;
        $officeName = $employee->officeModel ? $employee->officeModel->name : null;

        // Unset the relations to prevent them from being serialized as nested objects
        unset($employee->grade);
        unset($employee->officeModel);

        // Map office and grade to display values for UI compatibility
        $employee->office = $officeName;
        $employee->grade = $gradeTitle;
        $employee->user_photo = $employee->user && $employee->user->photo ? asset($employee->user->photo) : null;
        $employee->profile_picture_url = $employee->profile_picture ? asset($employee->profile_picture) : null;
        // Normalize status for response (uppercase, map legacy INACTIVE to RESIGN)
        $status = strtoupper((string)($employee->status ?? ''));
        if ($status === 'INACTIVE') {
            $status = 'RESIGN';
        }
        $employee->status = $status ?: null;
        return response()->json($employee);
    }

    public function create()
    {
        $grades = Grade::orderByRaw(
            "FIELD(title, 'Manager','Analyst','Senior Analyst','Associate','Junior Manager','Junior Analyst','Junior Associate')"
        )->get();

        $offices = Office::orderByRaw(
            "FIELD(name, 'Office 1', 'Office 2')"
        )
            ->orderBy('name')
            ->get();

        $employeeSalaries = new EmployeeSalary();

        return view('employee.create', compact(
            'grades',
            'offices',
            'employeeSalaries'
        ));
    }

    public function getRegions(Request $request)
    {
        $request->validate([
            'business_department_id' => 'required|integer',
        ]);

        $user = auth()->user();

        $currentEmployee = Employee::where(
            'user_id',
            $user->id
        )->first();

        $userType = strtoupper(
            (string) ($user->user_type ?? '')
        );

        $departmentId = $request->business_department_id;

        if (
            $userType === 'ADMINISTRATOR' &&
            $currentEmployee
        ) {
            $departmentId = $currentEmployee->department_id;
        }

        $regions = Employee::query()
            ->where('department_id', $departmentId)
            ->where('status', '!=', 'DELETED')
            ->whereNotNull('region')
            ->where('region', '!=', '')
            ->distinct()
            ->orderBy('region')
            ->pluck('region')
            ->values();

        return response()->json([
            'data' => $regions,
        ]);
    }

    public function store(Request $request)
    {
        try {
            DB::beginTransaction();

            $userRole = auth()->user()->user_role;

            if (!in_array($userRole, ['ADMINISTRATOR', 'HR_MANAGER'])) {
                throw new \Exception('Only HR Manager can add employee');
            }

            $validator = Validator::make($request->all(), [
                'partner_id' => 'nullable|exists:partners,id',
                'department_id' => 'nullable|exists:partners,id',
                'division_id' => 'required|exists:divisions,id',
                'job_id' => [
                    'required',
                    Rule::exists('job_list', 'id'),
                ],
                'shift_id' => 'required|exists:shifts,id',
                'employee_niks' => 'nullable|string|max:255',
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:employees,email',
                'email_work' => [
                    'nullable',
                    'email',
                    Rule::unique('employees', 'email_work'),
                    Rule::unique('users', 'email'),
                ],
                'phone' => 'required|string|max:14|regex:/^[0-9]+$/|unique:employees,phone',
                'no_bpjs' => 'nullable|integer',
                'no_bpjstk' => 'nullable|integer',
                'address' => 'required|string',
                'photo' => 'nullable|file|image|max:10240',
                'ktp' => 'nullable|file|image|max:10240',
                'cv' => 'nullable|file|max:10240|mimes:pdf,doc,docx,jpg,jpeg,png',
                'pkwt' => 'nullable|file|max:10240|mimes:pdf,doc,docx,jpg,jpeg,png',
                'birth_date' => 'required|date',
                'hire_date' => 'required|date',
                'contract_end_date' => 'required|date',
                'resign_date' => 'nullable|date',
                'grade_id' => 'required|exists:grades,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'code' => 422,
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // Generate unique email_work from full name by replacing spaces with underscores and adding timestamp if email_work is empty
            $emailWork = $request->input('email_work');
            if (empty($emailWork)) {
                $emailWork = str_replace(' ', '_', trim($request->name)) . '_' . time();
            }

            // Ensure email_work is unique
            $counter = 1;
            $originalEmailWork = $emailWork;
            while (User::where('email', $emailWork)->exists()) {
                $emailWork = $originalEmailWork . '_' . $counter;
                $counter++;
            }

            // At this point $emailWork is ensured unique by loop; no need to throw exception on dup.

            $partnerContext = $this->resolvePartnerContext((int) $request->input('partner_id', $request->input('department_id')));
            $division = Division::find($request->division_id);
            if (!$division || (int) $division->partner_id !== $partnerContext['partner_id']) {
                throw new \Exception('Site does not belong to selected partner');
            }

            $job = Job::find($request->job_id);
            if (!$job || (int) $job->division_id !== (int) $division->id) {
                throw new \Exception('Job does not belong to selected site');
            }

            $photoPath = null;
            $ktpPath = null;
            $cvPath = null;
            $pkwtPath = null;
            $profilePicturePath = null;
            $documentSources = [];

            if ($request->hasFile('photo')) {
                $file = $request->file('photo');
                $photoOriginalName = $file->getClientOriginalName();
                $photoMimeType = $file->getClientMimeType();
                $photoFileSize = $file->getSize();
                $photoFilename = 'PHOTO_' . time() . '.' . $file->getClientOriginalExtension();
                $profilePictureFilename = 'PROFILE_PICTURE_' . time() . '.' . $file->getClientOriginalExtension();
                $photoDestination = public_path('file/photo');
                $profilePictureDestination = public_path('file/profile_picture');
                if (!file_exists($photoDestination)) mkdir($photoDestination, 0777, true);
                if (!file_exists($profilePictureDestination)) mkdir($profilePictureDestination, 0777, true);
                $file->move($photoDestination, $photoFilename);
                $photoPath = 'file/photo/' . $photoFilename;
                // Copy photo file to profile_picture with different name
                copy($photoDestination . '/' . $photoFilename, $profilePictureDestination . '/' . $profilePictureFilename);
                $profilePicturePath = 'file/profile_picture/' . $profilePictureFilename;
                $documentSources['profile'] = [
                    'source_path' => $profilePictureDestination . '/' . $profilePictureFilename,
                    'original_name' => $photoOriginalName,
                    'mime_type' => $photoMimeType,
                    'file_size' => $photoFileSize,
                ];
            }

            if ($request->hasFile('ktp')) {
                $file = $request->file('ktp');
                $ktpOriginalName = $file->getClientOriginalName();
                $ktpMimeType = $file->getClientMimeType();
                $ktpFileSize = $file->getSize();
                $employeeName = preg_replace('/[^A-Za-z0-9_\-]/', '_', $request->name);
                $filename = 'KTP_' . $employeeName . '.' . $file->getClientOriginalExtension();
                $destination = public_path('file/ktp');
                if (!file_exists($destination)) mkdir($destination, 0777, true);
                $file->move($destination, $filename);
                $ktpPath = 'file/ktp/' . $filename;
                $documentSources['ktp'] = [
                    'source_path' => $destination . '/' . $filename,
                    'original_name' => $ktpOriginalName,
                    'mime_type' => $ktpMimeType,
                    'file_size' => $ktpFileSize,
                ];
            }

            if ($request->hasFile('cv')) {
                $file = $request->file('cv');
                $cvOriginalName = $file->getClientOriginalName();
                $cvMimeType = $file->getClientMimeType();
                $cvFileSize = $file->getSize();
                $employeeName = preg_replace('/[^A-Za-z0-9_\-]/', '_', $request->name);
                $filename = 'CV_' . $employeeName . '.' . $file->getClientOriginalExtension();
                $destination = public_path('file/cv');
                if (!file_exists($destination)) mkdir($destination, 0777, true);
                $file->move($destination, $filename);
                $cvPath = 'file/cv/' . $filename;
                $documentSources['cv'] = [
                    'source_path' => $destination . '/' . $filename,
                    'original_name' => $cvOriginalName,
                    'mime_type' => $cvMimeType,
                    'file_size' => $cvFileSize,
                ];
            }

            if ($request->hasFile('pkwt')) {
                $file = $request->file('pkwt');
                $pkwtOriginalName = $file->getClientOriginalName();
                $pkwtMimeType = $file->getClientMimeType();
                $pkwtFileSize = $file->getSize();
                $employeeName = preg_replace('/[^A-Za-z0-9_\-]/', '_', $request->name);
                $filename = 'PKWT_' . $employeeName . '.' . $file->getClientOriginalExtension();
                $destination = public_path('file/pkwt');
                if (!file_exists($destination)) mkdir($destination, 0777, true);
                $file->move($destination, $filename);
                $pkwtPath = 'file/pkwt/' . $filename;
                $documentSources['pkwt'] = [
                    'source_path' => $destination . '/' . $filename,
                    'original_name' => $pkwtOriginalName,
                    'mime_type' => $pkwtMimeType,
                    'file_size' => $pkwtFileSize,
                ];
            }

            $user = new User();
            $user->user_type = 'REGULAR';
            $user->user_role = 'EMPLOYEE';
            $user->photo = $photoPath;
            $user->name = $request->name;
            $user->email = $emailWork;
            $user->email_verified_at = now();
            $user->password = bcrypt('office_2025');
            $user->save();

            $employee = Employee::create([
                'user_id' => $user->id,
                'department_id' => $partnerContext['department_id'],
                'partner_id' => $partnerContext['partner_id'],
                'division_id' => $request->division_id,
                'job_id' => $request->job_id,
                'shift_id' => $request->shift_id,
                'profile_picture' => $profilePicturePath ?? null,
                'name' => $request->name,
                'employee_niks' => $request->employee_niks,
                'email' => $request->email,
                'email_work' => $emailWork,
                'phone' => $request->phone,
                'status' => 'ACTIVE',
                'basic_salary' => $request->basic_salary,
                'positional_allowance' => $request->positional_allowance,
                'bpjs_allowance' => $request->bpjs_allowance,
                'no_bpjs' => $request->no_bpjs,
                'no_bpjstk' => $request->no_bpjstk,
                'bpjs_tenaga_kerja_allowance' => $request->bpjs_tenaga_kerja_allowance,
                'pension_allowance' => $request->pension_allowance,
                'address' => $request->address,
                'photo' => $photoPath,
                'ktp' => $ktpPath,
                'cv' => $cvPath,
                'pkwt' => $pkwtPath,
                'birth_date' => $request->birth_date,
                'hire_date' => $request->hire_date,
                'contract_end_date' => $request->contract_end_date,
                'resign_date' => $request->resign_date,
                'grade_id' => $request->grade_id,
                'office' => $partnerContext['office_id'],
                'created_by' => auth()->id(),
                'updated_by' => auth()->id(),
                'deleted_by' => null,
            ]);

            $salaryData['take_home_pay'] = $request->basic_salary + $request->positional_allowance + $request->bpjs_allowance + $request->bpjs_tenaga_kerja_allowance + $request->pension_allowance;
            $salaryData['basic_salary'] = $request->basic_salary;
            $salaryData['positional_allowance'] = $request->positional_allowance;
            $salaryData['bpjs_allowance'] = $request->bpjs_allowance;
            $salaryData['bpjs_tenaga_kerja_allowance'] = $request->bpjs_tenaga_kerja_allowance;
            $salaryData['pension_allowance'] = $request->pension_allowance;
            $salaryData['updated_by'] = auth()->id();

            $salaryData['bank_name'] = $request->bank_name;
            $salaryData['bank_account_number'] = $request->bank_account_number;

            EmployeeSalary::updateOrCreate(
                [
                    'employee_id' => $employee->id,
                ],
                $salaryData
            );

            $this->createEmployeeDocumentStructure($employee, $documentSources);

            DB::commit();

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => $employee,
                'message' => 'Employee created successfully',
                'redirect_url' => route('employee')
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            $status = $this->deriveHttpStatusFromException($e);
            return response()->json([
                'code' => $status,
                'status' => 'error',
                'data' => [],
                'message' => $e->getMessage()
            ], $status);
        }
    }

    public function edit($id)
    {
        $user = auth()->user();
        $userId = auth()->user()->id;

        $currentEmployee = Employee::where('user_id', $userId)->first();

        $userType = strtoupper((string) ($user->user_type ?? ''));
        $userRole = strtoupper((string) ($user->user_role ?? ''));

        $employee = Employee::find($id);

        if ($userType !== 'SUPERADMIN') {
            $employee = Employee::where('department_id', $currentEmployee?->department_id ?? 0)->find($id);
        }

        if (!$employee) {
            abort(404, 'Employee not found');
        }

        $employeeSalaries = EmployeeSalary::where('employee_id', $employee->id)->first();

        $departments = Partner::where('status', '!=', 'DELETED')
            ->when($userType !== 'SUPERADMIN', fn ($query) => $query->where('department_id', $currentEmployee?->department_id ?? 0))
            ->get();
        $divisions = Division::where('status', '!=', 'DELETED')
            ->when($userType !== 'SUPERADMIN', fn ($query) => $query->where('department_id', $currentEmployee?->department_id ?? 0))
            ->get();

        $jobs = Job::where('status', '!=', 'DELETED');
        if ($employee->partner_id) {
            $jobs = $jobs->where('partner_id', $employee->partner_id);
        }
        if ($employee->division_id) {
            $jobs = $jobs->where('division_id', $employee->division_id);
        }
        $jobs = $jobs->get();

        $grades = Grade::orderByRaw(
            "FIELD(title, 'Manager','Analyst','Senior Analyst','Associate','Junior Manager','Junior Analyst','Junior Associate')"
        )->get();
        $offices = Office::orderByRaw(
            "FIELD(name, 'Office 1', 'Office 2')"
        )->orderBy('name')->get();

        return view('employee.edit', compact('employee', 'employeeSalaries', 'departments', 'divisions', 'jobs', 'grades', 'offices'));
    }

    public function update(Request $request, $id)
    {
        try {
            DB::beginTransaction();
            $userRole = auth()->user()->user_role;

            if (!in_array($userRole, ['ADMINISTRATOR', 'HR_MANAGER'])) {
                throw new \Exception('Only HR Manager can update employee');
            }

            $employee = Employee::find($id);
            if (!$employee) {
                throw new \Exception('Employee not found');
            }

            // Normalize and map status before validation (accept mixed case, map legacy INACTIVE->RESIGN)
            if ($request->has('status')) {
                $incomingStatus = strtoupper((string)$request->input('status'));
                if ($incomingStatus === 'INACTIVE') {
                    $incomingStatus = 'RESIGN';
                }
                $request->merge(['status' => $incomingStatus]);
            }

            // Build dynamic rules to allow ignoring current employee/user for unique checks
            $validator = Validator::make($request->all(), [
                'partner_id' => 'nullable|exists:partners,id',
                'department_id' => 'nullable|exists:partners,id',
                'division_id' => 'sometimes|exists:divisions,id',
                'job_id' => 'sometimes|exists:job_list,id',
                'shift_id' => 'sometimes|exists:shifts,id',
                'employee_niks' => 'nullable|string|max:255',
                // 10 MB max for images
                'profile_picture' => 'nullable|file|image|max:10240',
                'name' => 'sometimes|string|max:255',
                'email' => ['sometimes', 'email', Rule::unique('employees', 'email')->ignore($id)],
                'email_work' => [
                    'nullable',
                    'email',
                    Rule::unique('employees', 'email_work')->ignore($id),
                    Rule::unique('users', 'email')->ignore($employee->user_id)
                ],
                'phone' => [
                    'sometimes',
                    'regex:/^[0-9]+$/',
                    'max:14',
                    Rule::unique('employees', 'phone')->ignore($id)
                ],
                'no_bpjs' => 'nullable|integer',
                'no_bpjstk' => 'nullable|integer',
                'status' => [
                    'sometimes',
                    Rule::in(['ACTIVE', 'RESIGN', 'CANDIDATE', 'DELETED'])
                ],
                'address' => 'sometimes|string',
                'photo' => 'nullable|file|image|max:10240',
                'ktp' => 'nullable|file|image|max:10240',
                'cv' => 'nullable|file|max:10240|mimes:pdf,doc,docx,jpg,jpeg,png',
                'pkwt' => 'nullable|file|max:10240|mimes:pdf,doc,docx,jpg,jpeg,png',
                'birth_date' => 'sometimes|date',
                'hire_date' => 'sometimes|date',
                'contract_end_date' => 'sometimes|date',
                'resign_date' => 'nullable|date',
                'grade_id' => 'sometimes|exists:grades,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'code' => 422,
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $updateData = $request->only([
                'partner_id',
                'division_id',
                'job_id',
                'shift_id',
                'name',
                'employee_niks',
                'email',
                'email_work',
                'phone',
                'no_bpjs',
                'no_bpjstk',
                'status',
                'address',
                'address',
                'birth_date',
                'hire_date',
                'contract_end_date',
                'resign_date',
                'grade_id'
            ]);

            if ($request->hasAny(['partner_id', 'department_id'])) {
                $partnerContext = $this->resolvePartnerContext((int) $request->input('partner_id', $request->input('department_id')));
                $updateData['partner_id'] = $partnerContext['partner_id'];
                $updateData['department_id'] = $partnerContext['department_id'];
                $updateData['office'] = $partnerContext['office_id'];
            }

            if (isset($updateData['partner_id']) && $request->filled('division_id')) {
                $division = Division::find($request->division_id);
                if (!$division || (int) $division->partner_id !== (int) $updateData['partner_id']) {
                    throw new \Exception('Site does not belong to selected partner');
                }
            }

            if ($request->filled('job_id')) {
                $job = Job::find($request->job_id);
                $divisionId = (int) ($request->input('division_id', $employee->division_id));
                if (!$job || (int) $job->division_id !== $divisionId) {
                    throw new \Exception('Job does not belong to selected site');
                }
            }

            // Ensure status remains uppercase in DB and map legacy value just in case
            if (isset($updateData['status']) && $updateData['status']) {
                $updateData['status'] = strtoupper($updateData['status']);
                if ($updateData['status'] === 'INACTIVE') {
                    $updateData['status'] = 'RESIGN';
                }
            }

            if ($request->hasFile('photo')) {
                $file = $request->file('photo');
                $photoFilename = 'PHOTO_' . time() . '.' . $file->getClientOriginalExtension();
                $photoDestination = public_path('file/photo');
                if (!file_exists($photoDestination)) mkdir($photoDestination, 0777, true);
                $file->move($photoDestination, $photoFilename);
                $updateData['photo'] = 'file/photo/' . $photoFilename;
            }

            // Handle dedicated profile_picture (kept independent from user->photo after creation)
            if ($request->hasFile('profile_picture')) {
                $pf = $request->file('profile_picture');
                $profileFilename = 'PROFILE_PICTURE_' . time() . '.' . $pf->getClientOriginalExtension();
                $profileDest = public_path('file/profile_picture');
                if (!file_exists($profileDest)) mkdir($profileDest, 0777, true);
                // Delete old profile_picture file if exists
                if ($employee->profile_picture && !$this->isDefaultAvatarPath($employee->profile_picture)) {
                    $old = public_path(ltrim($employee->profile_picture, '/'));
                    if (file_exists($old)) {
                        @unlink($old);
                    }
                }
                $pf->move($profileDest, $profileFilename);
                $updateData['profile_picture'] = 'file/profile_picture/' . $profileFilename;
            }

            if ($request->hasFile('ktp')) {
                // Delete old ktp file if exists
                if ($employee->ktp && file_exists(public_path($employee->ktp))) {
                    unlink(public_path($employee->ktp));
                }
                $file = $request->file('ktp');
                $employeeName = preg_replace('/[^A-Za-z0-9_\-]/', '_', $request->name ?? $employee->name);
                $filename = 'KTP_' . $employeeName . '.' . $file->getClientOriginalExtension();
                $destination = public_path('file/ktp');
                if (!file_exists($destination)) mkdir($destination, 0777, true);
                $file->move($destination, $filename);
                $updateData['ktp'] = 'file/ktp/' . $filename;
            }

            if ($request->hasFile('cv')) {
                if ($employee->cv && file_exists(public_path($employee->cv))) {
                    unlink(public_path($employee->cv));
                }
                $file = $request->file('cv');
                $employeeName = preg_replace('/[^A-Za-z0-9_\-]/', '_', $request->name ?? $employee->name);
                $filename = 'CV_' . $employeeName . '.' . $file->getClientOriginalExtension();
                $destination = public_path('file/cv');
                if (!file_exists($destination)) mkdir($destination, 0777, true);
                $file->move($destination, $filename);
                $updateData['cv'] = 'file/cv/' . $filename;
            }

            if ($request->hasFile('pkwt')) {
                if ($employee->pkwt && file_exists(public_path($employee->pkwt))) {
                    unlink(public_path($employee->pkwt));
                }
                $file = $request->file('pkwt');
                $employeeName = preg_replace('/[^A-Za-z0-9_\-]/', '_', $request->name ?? $employee->name);
                $filename = 'PKWT_' . $employeeName . '.' . $file->getClientOriginalExtension();
                $destination = public_path('file/pkwt');
                if (!file_exists($destination)) mkdir($destination, 0777, true);
                $file->move($destination, $filename);
                $updateData['pkwt'] = 'file/pkwt/' . $filename;
            }

            $updateData['updated_by'] = auth()->id();

            // Track old shift_id to detect changes
            $oldShiftId = $employee->shift_id;

            $employee->update($updateData);

            // If shift_id changed, also sync today's per-date EmployeeShift when safe
            if (array_key_exists('shift_id', $updateData) && $updateData['shift_id'] && (int)$updateData['shift_id'] !== (int)$oldShiftId) {
                $today = Carbon::today()->toDateString();

                // Only upsert if there is no attendance record yet for today (to avoid altering an ongoing/recorded shift)
                $hasTodayAttendance = Attendance::where('employee_id', $employee->id)
                    ->where('date_attendance', $today)
                    ->exists();

                if (!$hasTodayAttendance) {
                    EmployeeShift::updateOrCreate(
                        [
                            'employee_id' => $employee->id,
                            'date_shift' => $today,
                        ],
                        [
                            'shift_id' => $updateData['shift_id'],
                        ]
                    );
                }

                // Recalculate lateness for today's existing check-in records using the new base shift
                $empWithShift = Employee::with('shift')->find($employee->id);
                if ($empWithShift && $empWithShift->shift) {
                    $rawStart = $empWithShift->shift->getRawOriginal('time_start') ?? $empWithShift->shift->time_start;
                    if ($rawStart) {
                        $newShiftStart = Carbon::parse($today . ' ' . $rawStart);
                        $todaysCheckins = Attendance::where('employee_id', $employee->id)
                            ->where('date_attendance', $today)
                            ->whereNotNull('time_in')
                            ->get();

                        foreach ($todaysCheckins as $att) {
                            try {
                                $checkInAt = Carbon::parse($att->date_attendance . ' ' . $att->time_in);
                                if ($checkInAt->gt($newShiftStart)) {
                                    $diffSeconds = $newShiftStart->diffInSeconds($checkInAt);
                                    $hours = floor($diffSeconds / 3600);
                                    $minutes = floor(($diffSeconds % 3600) / 60);
                                    $seconds = $diffSeconds % 60;
                                    $att->time_late = sprintf('%02d:%02d:%02d', $hours, $minutes, $seconds);
                                } else {
                                    $att->time_late = null;
                                }
                                $att->save();
                            } catch (\Exception $e) {
                                // Ignore calculation errors per record
                            }
                        }
                    }
                }
            }


            $salaryData['take_home_pay'] = $request->basic_salary + $request->positional_allowance + $request->bpjs_allowance + $request->bpjs_tenaga_kerja_allowance + $request->pension_allowance;
            $salaryData['basic_salary'] = $request->basic_salary;
            $salaryData['positional_allowance'] = $request->positional_allowance;
            $salaryData['bpjs_allowance'] = $request->bpjs_allowance;
            $salaryData['bpjs_tenaga_kerja_allowance'] = $request->bpjs_tenaga_kerja_allowance;
            $salaryData['pension_allowance'] = $request->pension_allowance;

            $salaryData['bank_name'] = $request->bank_name;
            $salaryData['bank_account_number'] = $request->bank_account_number;

            $salaryData['updated_by'] = auth()->id();

            EmployeeSalary::updateOrCreate(
                [
                    'employee_id' => $employee->id,
                ],
                $salaryData
            );

            // Update corresponding user record (only name/email, NOT photo for independence)
            $user = User::find($employee->user_id);
            if ($user) {
                $user->name = $employee->name;
                $user->email = $employee->email_work;
                $user->save();
            }

            DB::commit();

            $updatedPhotoUrl = $employee->photo ? asset($employee->photo) : null;

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => $employee,
                'message' => 'Employee updated successfully',
                'profile_picture_url' => $employee->profile_picture ? asset($employee->profile_picture) : null,
                'updatedPhotoUrl' => $updatedPhotoUrl,
                'employeeId' => $employee->id,
                'redirect_url' => route('employee')
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            $status = $this->deriveHttpStatusFromException($e);
            return response()->json([
                'code' => $status,
                'status' => 'error',
                'data' => [],
                'message' => $e->getMessage()
            ], $status);
        }
    }

    public function destroy($id)
    {
        try {
            DB::beginTransaction();

            $userRole = auth()->user()->user_role;

            if (!in_array($userRole, ['ADMINISTRATOR', 'HR_MANAGER'])) {
                throw new \Exception('Only HR Manager can delete employee');
            }

            $employee = Employee::find($id);
            if (!$employee) {
                throw new \Exception('Employee not found');
            }

            $employee->status = 'DELETED';
            $employee->deleted_by = auth()->id();
            $employee->save();

            DB::commit();

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => [],
                'message' => 'Employee deleted successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            $status = $this->deriveHttpStatusFromException($e);
            return response()->json([
                'code' => $status,
                'status' => 'error',
                'data' => [],
                'message' => $e->getMessage()
            ], $status);
        }
    }


    /**
     * Get employees for project assignments (accessible to all authenticated users)
     */
    public function getEmployeesForProjects(Request $request)
    {
        try {
            $query = $request->input('query', '');
            $excludeEmployeeId = $request->input('exclude_employee_id', null);
            $user = auth()->user();
            $currentEmployee = $user?->employee;
            $isSuperadmin = strtoupper((string) ($user?->user_type ?? '')) === 'SUPERADMIN';

            $employees = Employee::with(['department', 'division', 'user'])
                ->where('status', 'ACTIVE')
                ->when(!$isSuperadmin, fn ($q) => $q->where('department_id', $currentEmployee?->department_id ?? 0))
                ->whereHas('user', function ($q) use ($request) {
                    // Back-compat behaviour: exclude top-level managers and administrators when not explicitly requesting executor-only list
                    $q->whereNotIn('user_role', ["ADMINISTRATOR"]);
                    if (auth()->user() && in_array(auth()->user()->user_role, ['ADMINISTRATOR'])) {
                        $q->whereNotIn('user_type', ["ADMINISTRATOR"]);
                    }
                })
                ->when($query, function ($q) use ($query) {
                    $q->where(function ($q2) use ($query) {
                        $q2->where('name', 'like', '%' . $query . '%')
                            ->orWhere('email', 'like', '%' . $query . '%');
                    });
                })
                ->when($excludeEmployeeId, function ($q) use ($excludeEmployeeId) {
                    $q->where('id', '!=', $excludeEmployeeId);
                })
                ->orderBy('name')
                ->get()
                ->map(function ($employee) {
                    $raw = $employee->profile_picture ?: ($employee->photo ?: ($employee->user?->photo ?? null));
                    if ($raw) {
                        $raw = str_replace('\\', '/', $raw);
                        $relative = ltrim($raw, '/');
                        $avatar = preg_match('/^https?:\/\//i', $raw) ? $raw : asset($relative);
                    } else {
                        $avatar = asset('asset/img/avatar.png');
                    }

                    $status = strtoupper((string)($employee->status ?? ''));
                    if ($status === 'INACTIVE') {
                        $status = 'RESIGN';
                    }

                    return [
                        'id' => $employee->id,
                        'name' => $employee->name,
                        'email' => $employee->email,
                        'user_photo' => $avatar,
                        'profile_picture' => $avatar,
                        'profile_picture_url' => $avatar,
                        'department' => $employee->department?->name_department,
                        'division' => $employee->division?->name_division,
                        'status' => $status,
                        'user_type' => $employee->user?->user_type,
                    ];
                });

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => $employees
            ]);
        } catch (\Exception $e) {
            $status = $this->deriveHttpStatusFromException($e);
            return response()->json([
                'code' => $status,
                'status' => 'error',
                'message' => 'Failed to fetch employees: ' . $e->getMessage()
            ], $status);
        }
    }

    public function import(Request $request, EmployeeExcelImportService $importService)
    {
        try {
            $isJsonRequest = $request->expectsJson() || $request->ajax();

            if (function_exists('set_time_limit')) {
                @set_time_limit(0);
            }
            @ini_set('max_execution_time', '0');
            @ini_set('memory_limit', '1024M');

            DB::connection()->disableQueryLog();

            $userRole = auth()->user()->user_role;

            if (!in_array($userRole, ['ADMINISTRATOR', 'HR_MANAGER'])) {
                throw new \Exception('Only HR Manager can import employee');
            }

            $validator = Validator::make($request->all(), [
                'employee_file' => 'required|file|mimes:xlsx,xls|max:20480',
            ]);

            if ($validator->fails()) {
                if ($isJsonRequest) {
                    return response()->json([
                        'code' => 422,
                        'status' => 'error',
                        'message' => $validator->errors()->first('employee_file'),
                        'errors' => $validator->errors(),
                    ], 422);
                }

                return redirect()->route('employee')
                    ->with('employee_import_status', 'danger')
                    ->with('employee_import_message', $validator->errors()->first('employee_file'));
            }

            $summary = $importService->importFromPath(
                $request->file('employee_file')->getRealPath(),
                (int) auth()->id()
            );

            $status = 'success';
            if ($summary['created'] === 0 && $summary['updated'] === 0) {
                $status = 'warning';
            }

            $message = 'Import selesai. Created: ' . $summary['created']
                . ', Updated: ' . $summary['updated']
                . ', Skipped: ' . $summary['skipped']
                . ', Blank rows: ' . ($summary['blank'] ?? 0) . '.';

            if (!empty($summary['errors'])) {
                $status = 'warning';
                $message .= ' Issues: ' . implode(' | ', array_slice($summary['errors'], 0, 20));
            }

            if ($isJsonRequest) {
                return response()->json([
                    'code' => 200,
                    'status' => $status,
                    'message' => $message,
                    'data' => $summary,
                ]);
            }

            return redirect()->route('employee')
                ->with('employee_import_status', $status)
                ->with('employee_import_message', $message);
        } catch (\Throwable $e) {
            if (($request->expectsJson() || $request->ajax())) {
                return response()->json([
                    'code' => 500,
                    'status' => 'error',
                    'message' => 'Import gagal: ' . $e->getMessage(),
                ], 500);
            }

            return redirect()->route('employee')
                ->with('employee_import_status', 'danger')
                ->with('employee_import_message', 'Import gagal: ' . $e->getMessage());
        }
    }


    private function exportEmployeeActiveLegacy()
    {


        $user = auth()->user();
        $userId = auth()->user()->id;

        $currentEmployee = Employee::where('user_id', $userId)->first();

        $userType = strtoupper((string) ($user->user_type ?? ''));
        $userRole = strtoupper((string) ($user->user_role ?? ''));


        $userRole = auth()->user()->user_role;

        // if(!in_array($userRole,['ADMINISTRATOR','HR_MANAGER','CEO','GENERAL_MANAGER'])){
        //     return redirect('/employee');
        // }

        $employee = Employee::select('employees.id')
            ->join('users', 'employees.user_id', '=', 'users.id')
            ->where('employees.status', "ACTIVE");

        if ($userType !== 'SUPERADMIN') {

            if (!$currentEmployee || $currentEmployee->department_id == 1) {
                return redirect('/employee');
            }

            $employee = $employee->where('employees.department_id', $currentEmployee->department_id);
        }

        $employee = $employee->whereNotIn('users.user_role', ["GENERAL_MANAGER", "CEO", "ADMINISTRATOR", "SUPERADMIN"])
            ->whereNotIn('users.user_type', ["ADMINISTRATOR", "SUPERADMIN"])
            ->get();

        $employeeIds = $employee->pluck('id');

        $allEmployeeActive = Employee::with('department', 'division', 'job', 'grade', 'shift')
            ->whereIn('employees.id', $employeeIds)
            ->orderBy('employees.division_id', 'asc')
            ->get();

        $spreadsheet = new Spreadsheet();
        $activeWorksheet = $spreadsheet->getActiveSheet();

        // Get current month and year
        $currentDate = Carbon::now();
        $monthName = $currentDate->translatedFormat('F'); // Full month name in Indonesian if locale set
        $year = $currentDate->year;
        $title = "Data Karyawan {$monthName} {$year}";

        $activeWorksheet->mergeCells('A1:T1');

        $activeWorksheet->getStyle('A1')->getFont()->setBold(true)->setSize(34);
        $activeWorksheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $activeWorksheet->setCellValue('A1', $title);

        //No	PHOTO	NAMA KARYAWAN	EMAIL	NSAID	Department	Division	Job Position	Grade/Rank	Join Date	Selesai Kontrak	Status	Alamat	THP Take Home Pay	Gaji Pokok	Tunjangan Jabatan	Tunjangan Transportasi	Tunjangan Makan	Tunjangan Internet

        $activeWorksheet->setCellValue('A2', 'No');
        $activeWorksheet->setCellValue('B2', 'PHOTO');
        $activeWorksheet->setCellValue('C2', 'NAMA KARYAWAN');
        $activeWorksheet->setCellValue('D2', 'EMAIL');
        $activeWorksheet->setCellValue('E2', 'NSAID');
        $activeWorksheet->setCellValue('F2', 'Department');
        $activeWorksheet->setCellValue('G2', 'Division');
        $activeWorksheet->setCellValue('H2', 'Job Position');
        $activeWorksheet->setCellValue('I2', 'Grade/Rank');
        $activeWorksheet->setCellValue('J2', 'Join Date');
        $activeWorksheet->setCellValue('K2', 'Selesai Kontrak');
        $activeWorksheet->setCellValue('L2', 'Periode Kerja');
        $activeWorksheet->setCellValue('M2', 'Status');
        $activeWorksheet->setCellValue('N2', 'Alamat');
        $activeWorksheet->setCellValue('O2', 'THP Take Home Pay');
        $activeWorksheet->setCellValue('P2', 'Gaji Pokok');
        $activeWorksheet->setCellValue('Q2', 'Tunjangan Jabatan');
        $activeWorksheet->setCellValue('R2', 'Tunjangan Transportasi');
        $activeWorksheet->setCellValue('S2', 'Tunjangan Makan');
        $activeWorksheet->setCellValue('T2', 'Tunjangan Internet');


        // add border 
        $headerStyle = [
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                ],
            ],
        ];


        $activeWorksheet->getStyle('A2:T2')->applyFromArray($headerStyle)->getFont()->setBold(true)->setSize(10);

        $activeWorksheet->getStyle('A2:T2')
            ->getAlignment()
            ->setWrapText(true)
            ->setHorizontal(Alignment::HORIZONTAL_CENTER)
            ->setVertical(Alignment::VERTICAL_CENTER);

        // Set column width for photo column
        $activeWorksheet->getColumnDimension('B')->setWidth(20);



        // Menulis data dari database ke sheet
        $row = 3; // Mulai dari baris ketiga
        $no = 1;

        foreach ($allEmployeeActive as $employeeItem) {

            $employeeSalary = EmployeeSalary::where('employee_id', $employeeItem->id)->first();


            $thp = 0;
            $basicSalary = 0;
            $positionalAllowance = 0;
            $transportationAllowance = 0;
            $mealAllowance = 0;
            $internetPhoneAllowance = 0;

            if ($employeeSalary) {

                $basicSalary = $employeeSalary->basic_salary;
                $positionalAllowance = $employeeSalary->positional_allowance;
                $transportationAllowance = $employeeSalary->bpjs_allowance;
                $mealAllowance = $employeeSalary->bpjs_tenaga_kerja_allowance;
                $internetPhoneAllowance = $employeeSalary->pension_allowance;
            }
            $thp = $basicSalary + $positionalAllowance + $transportationAllowance + $mealAllowance + $internetPhoneAllowance;

            // Set row height for photo (200px ≈ 150 points in Excel)
            $activeWorksheet->getRowDimension($row)->setRowHeight(150);

            $activeWorksheet->setCellValue('A' . $row, $no);

            // Insert photo in column B
            if ($employeeItem->photo) {
                $photoPath = public_path($employeeItem->photo);

                // Check if photo file exists
                if (file_exists($photoPath)) {
                    $drawing = new Drawing();
                    $drawing->setName('Employee Photo');
                    $drawing->setDescription('Photo of ' . $employeeItem->name);
                    $drawing->setPath($photoPath);
                    $drawing->setCoordinates('B' . $row);

                    // Set image size: width 150px (≈ 113 points), height 200px (≈ 150 points)
                    $drawing->setWidth(113);
                    $drawing->setHeight(150);

                    // Offset to center the image in the cell
                    $drawing->setOffsetX(10);
                    $drawing->setOffsetY(5);

                    $drawing->setWorksheet($activeWorksheet);
                }
            }

            $activeWorksheet->setCellValue('C' . $row, $employeeItem->name);
            $activeWorksheet->setCellValue('D' . $row, $employeeItem->email_work);
            $activeWorksheet->setCellValue('E' . $row, $employeeItem->employee_niks);
            $activeWorksheet->setCellValue('F' . $row, $employeeItem->department->name_department); //'Department'
            $activeWorksheet->setCellValue('G' . $row, $employeeItem->division->name_division); //'Division'
            $activeWorksheet->setCellValue('H' . $row, $employeeItem->job->job_name); //'Job Position'
            $activeWorksheet->setCellValue('I' . $row, $employeeItem->grade->title); //'Grade/Rank'
            $activeWorksheet->setCellValue('J' . $row, $employeeItem->hire_date); //'Join Date'
            $activeWorksheet->setCellValue('K' . $row, $employeeItem->contract_end_date); //'Kontrak'

            // Calculate work period
            $workPeriod = '-';
            if ($employeeItem->hire_date) {
                try {
                    $hireDate = Carbon::parse($employeeItem->hire_date);
                    $now = Carbon::now();
                    $diffInMonths = $hireDate->diffInMonths($now);
                    $years = floor($diffInMonths / 12);
                    $months = $diffInMonths % 12;
                    $workPeriod = "{$years} year {$months} month";
                } catch (\Exception $e) {
                    $workPeriod = '-';
                }
            }
            $activeWorksheet->setCellValue('L' . $row, $workPeriod); //'Periode Kerja'

            $activeWorksheet->setCellValue('M' . $row, $employeeItem->status); //'Status'
            $activeWorksheet->setCellValue('N' . $row, $employeeItem->address); //'Alamat'
            $activeWorksheet->setCellValue('O' . $row, $thp); //'Take Home Pay'
            $activeWorksheet->setCellValue('P' . $row, $basicSalary); //'Gaji Pokok'
            $activeWorksheet->setCellValue('Q' . $row, $positionalAllowance); //'Tunjangan Jabatan'
            $activeWorksheet->setCellValue('R' . $row, $transportationAllowance); //'Tunjangan Transportasi'
            $activeWorksheet->setCellValue('S' . $row, $mealAllowance); //'Tunjangan Makan'
            $activeWorksheet->setCellValue('T' . $row, $internetPhoneAllowance); //'Tunjangan Internet'



            $row++;
            $no++;
        }

        $dataStyle = [
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                ],
            ],
        ];

        $activeWorksheet->getStyle('A2:T' . ($row - 1))->applyFromArray($dataStyle);

        $activeWorksheet->getStyle('A2:T' . ($row - 1))
            ->getAlignment()
            ->setHorizontal(Alignment::HORIZONTAL_CENTER)
            ->setVertical(Alignment::VERTICAL_CENTER);

        $activeWorksheet->getStyle('C3:D' . ($row - 1))
            ->getAlignment()
            ->setHorizontal(Alignment::HORIZONTAL_LEFT)
            ->setVertical(Alignment::VERTICAL_CENTER);


        // $activeWorksheet->getStyle('W4:'.$lastColumn.($row-1))
        //     ->getAlignment()
        //     ->setWrapText(true)
        //     ->setHorizontal(Alignment::HORIZONTAL_CENTER)
        // ->setVertical(Alignment::VERTICAL_CENTER);

        // Mengatur lebar kolom agar otomatis (skip column B because it's for photo)
        foreach (range('A', 'A') as $column) {
            $activeWorksheet->getColumnDimension($column)->setAutoSize(true);
        }

        foreach (range('C', 'M') as $column) {
            $activeWorksheet->getColumnDimension($column)->setAutoSize(true);
        }

        foreach (range('O', 'T') as $column) {
            $activeWorksheet->getColumnDimension($column)->setAutoSize(true);
        }

        $fileName = "Data Karyawan {$monthName} {$year}.xlsx";
        $tempFileName = tempnam(sys_get_temp_dir(), $fileName);

        $writer = new Xlsx($spreadsheet);
        $writer->save($tempFileName);

        return response()->download($tempFileName, $fileName)->deleteFileAfterSend(true);
    }

    public function exportEmployeeActive()
    {
        $user = auth()->user();
        $currentEmployee = Employee::where('user_id', $user->id)->first();
        $userType = strtoupper(trim((string) ($user->user_type ?? '')));

        $employees = Employee::with(['department', 'partner', 'division', 'job'])
            ->join('users', 'employees.user_id', '=', 'users.id')
            ->select('employees.*')
            ->where('employees.status', 'ACTIVE')
            ->whereNotIn(DB::raw("UPPER(TRIM(COALESCE(users.user_type, '')))"), ['ADMIN', 'ADMINISTRATOR', 'SUPERADMIN'])
            ->whereNotIn(DB::raw("UPPER(TRIM(COALESCE(users.user_role, '')))"), ['ADMIN', 'ADMINISTRATOR', 'SUPERADMIN', 'GENERAL_MANAGER', 'CEO']);

        if ($userType !== 'SUPERADMIN') {
            if (!$currentEmployee || $currentEmployee->department_id == 1) {
                return redirect('/employee');
            }

            $employees->where('employees.department_id', $currentEmployee->department_id);
        }

        $employees = $employees
            ->orderBy('employees.department_id')
            ->orderBy('employees.name')
            ->get();

        $salaries = EmployeeSalary::whereIn('employee_id', $employees->pluck('id'))
            ->get()
            ->keyBy('employee_id');

        $headers = [
            'ID_KARYAWAN',
            'NAMA',
            'EMAIL',
            'EMAIL_KERJA',
            'NO_HP',
            'WILAYAH',
            'PARTNER',
            'SITE',
            'POSISI',
            'STATUS',
            'TANGGAL_LAHIR',
            'TANGGAL_DITERIMA',
            'TANGGAL_KONTRAK_BERAKHIR',
            'HARI_LIBUR',
            'GAJI_POKOK',
            'TUNJ_POSISI',
            'TUNJ_PENSIUN',
            'TUNJ_BPJS_TK',
            'TUNJ_BPJS',
            'NO_BPJS',
            'NO_BPJSTK',
            'ALAMAT',
            'CV',
            'PKWT',
            'PAS_FOTO',
            'KTP',
        ];

        $spreadsheet = new Spreadsheet();
        $lastColumn = Coordinate::stringFromColumnIndex(count($headers));
        $groups = $employees->groupBy(fn (Employee $employee) => (string) ($employee->department->name_department ?? 'EMPLOYEE'));

        if ($groups->isEmpty()) {
            $groups = collect(['EMPLOYEE' => collect()]);
        }

        foreach ($groups as $departmentName => $departmentEmployees) {
            $worksheet = $spreadsheet->getSheetCount() === 1 && $spreadsheet->getActiveSheet()->getCell('A1')->getValue() === null
                ? $spreadsheet->getActiveSheet()
                : $spreadsheet->createSheet();
            $sheetTitle = mb_substr(preg_replace('/[\\\\\\/\\?\\*\\[\\]:]/', ' ', $departmentName), 0, 31);
            $worksheet->setTitle($sheetTitle ?: 'EMPLOYEE');
            $worksheet->fromArray($headers, null, 'A1');
            $worksheet->getStyle("A1:{$lastColumn}1")->applyFromArray([
                'font' => [
                    'bold' => true,
                    'color' => ['rgb' => 'FFFFFF'],
                ],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '4472C4'],
                ],
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                    ],
                ],
                'alignment' => [
                    'horizontal' => Alignment::HORIZONTAL_CENTER,
                    'vertical' => Alignment::VERTICAL_CENTER,
                    'wrapText' => true,
                ],
            ]);
            $worksheet->freezePane('A2');
            $worksheet->setAutoFilter("A1:{$lastColumn}1");

            $row = 2;
            foreach ($departmentEmployees as $employee) {
                $salary = $salaries->get($employee->id);
                $worksheet->fromArray([
                    $employee->employee_niks,
                    $employee->name,
                    $employee->email,
                    $employee->email_work,
                    $employee->phone,
                    $employee->region,
                    $employee->partner->partner_name ?? null,
                    $employee->division->name_division ?? null,
                    $employee->job->job_name ?? null,
                    $employee->status,
                    $employee->birth_date ? Carbon::parse($employee->birth_date)->format('Y-m-d') : null,
                    $employee->hire_date ? Carbon::parse($employee->hire_date)->format('Y-m-d') : null,
                    $employee->contract_end_date ? Carbon::parse($employee->contract_end_date)->format('Y-m-d') : null,
                    $employee->weekday_off,
                    $employee->basic_salary ?? $salary?->basic_salary ?? 0,
                    $employee->positional_allowance ?? $salary?->positional_allowance ?? 0,
                    $employee->pension_allowance ?? $salary?->pension_allowance ?? 0,
                    $employee->bpjs_tenaga_kerja_allowance ?? $salary?->bpjs_tenaga_kerja_allowance ?? 0,
                    $employee->bpjs_allowance ?? $salary?->bpjs_allowance ?? 0,
                    $employee->no_bpjs,
                    $employee->no_bpjstk,
                    $employee->address,
                    $employee->cv,
                    $employee->pkwt,
                    $employee->photo,
                    $employee->ktp,
                ], null, "A{$row}");
                $row++;
            }

            foreach (range(1, count($headers)) as $columnIndex) {
                $worksheet->getColumnDimension(Coordinate::stringFromColumnIndex($columnIndex))->setAutoSize(true);
            }
        }

        $spreadsheet->setActiveSheetIndex(0);
        $fileName = 'employee_export_' . now()->format('Ymd_His') . '.xlsx';
        $tempFileName = tempnam(sys_get_temp_dir(), 'employee_export_');
        (new Xlsx($spreadsheet))->save($tempFileName);

        return response()->download($tempFileName, $fileName)->deleteFileAfterSend(true);
    }

    public function downloadTemplate()
    {
        $path = public_path('file/employee-template/employee_import_template.xlsx');

        if (is_file($path) && is_readable($path)) {
            return response()->download(
                $path,
                'employee_import_template.xlsx',
                ['Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
            );
        }

        $headers = [
            'ID_KARYAWAN', 'NAMA', 'EMAIL', 'EMAIL_KERJA', 'NO_HP',
            'WILAYAH', 'PARTNER', 'SITE', 'POSISI', 'STATUS', 'TANGGAL_LAHIR',
            'TANGGAL_DITERIMA', 'TANGGAL_KONTRAK_BERAKHIR', 'HARI_LIBUR',
            'GAJI_POKOK', 'TUNJ_POSISI', 'TUNJ_PENSIUN', 'TUNJ_BPJS_TK',
            'TUNJ_BPJS', 'NO_BPJS', 'NO_BPJSTK', 'ALAMAT', 'CV', 'PKWT',
            'PAS_FOTO', 'KTP',
        ];

        $spreadsheet = new Spreadsheet();
        $worksheet = $spreadsheet->getActiveSheet();
        $worksheet->setTitle('EMPLOYEE');
        $worksheet->fromArray($headers, null, 'A1');
        $worksheet->getStyle('A1:Z1')->getFont()->setBold(true);
        $worksheet->freezePane('A2');
        $worksheet->setAutoFilter('A1:Z1');

        $tempFileName = tempnam(sys_get_temp_dir(), 'employee_template_');
        (new Xlsx($spreadsheet))->save($tempFileName);

        return response()->download(
            $tempFileName,
            'employee_import_template.xlsx',
            ['Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
        )->deleteFileAfterSend(true);
    }
}
