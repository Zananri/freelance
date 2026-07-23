<?php

namespace App\Services;

use App\Models\Department;
use App\Models\DocumentFolders;
use App\Models\Division;
use App\Models\Employee;
use App\Models\EmployeeSalary;
use App\Models\Grade;
use App\Models\Job;
use App\Models\Office;
use App\Models\Partner;
use App\Models\Shift;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class EmployeeExcelImportService
{
    private const REGION_ALLOWLIST = [
        'JAWA TENGAH',
        'DKI JAKARTA',
        'DAERAH ISTIMEWA YOGYAKARTA',
    ];

    private int $actorId;
    private ?int $defaultGradeId;
    private ?int $defaultOfficeId;
    private ?int $defaultShiftId;

    private array $departmentCache = [];
    private array $partnerCache = [];
    private array $divisionCache = [];
    private array $jobCache = [];
    private array $userEmailIndex = [];
    private array $phoneOwnerIndex = [];

    public function importFromPath(string $filePath, int $actorId): array
    {
        if (function_exists('set_time_limit')) {
            @set_time_limit(0);
        }

        $this->actorId = $actorId;
        $this->bootstrapContext();

        $summary = [
            'created' => 0,
            'updated' => 0,
            'skipped' => 0,
            'blank' => 0,
            'errors' => [],
        ];

        $spreadsheet = IOFactory::load($filePath);

        foreach ($spreadsheet->getAllSheets() as $sheet) {
            try {
                $sheetResult = $this->importSheet($sheet);
                $summary['created'] += $sheetResult['created'];
                $summary['updated'] += $sheetResult['updated'];
                $summary['skipped'] += $sheetResult['skipped'];
                $summary['blank'] += $sheetResult['blank'];
                $summary['errors'] = array_merge($summary['errors'], $sheetResult['errors']);
            } catch (\Throwable $e) {
                $summary['errors'][] = 'Sheet "' . $sheet->getTitle() . '" gagal diproses: ' . $e->getMessage();
            }
        }

        return $summary;
    }

    private function bootstrapContext(): void
    {
        $this->defaultGradeId = Grade::query()->orderBy('id')->value('id');
        $this->defaultOfficeId = Office::query()->orderBy('id')->value('id');
        $this->defaultShiftId = Shift::query()->orderBy('id')->value('id');

        $this->departmentCache = Department::query()
            ->get(['id', 'name_department'])
            ->mapWithKeys(fn (Department $department) => [
                $this->key((string) $department->name_department) => (int) $department->id,
            ])
            ->toArray();

        $this->userEmailIndex = User::query()
            ->get(['id', 'email'])
            ->mapWithKeys(fn (User $user) => [strtolower((string) $user->email) => (int) $user->id])
            ->toArray();

        $this->phoneOwnerIndex = Employee::query()
            ->whereNotNull('phone')
            ->where('phone', '!=', '')
            ->get(['email', 'phone'])
            ->mapWithKeys(fn (Employee $employee) => [(string) $employee->phone => strtolower((string) $employee->email)])
            ->toArray();
    }

    private function importSheet(Worksheet $sheet): array
    {
        $summary = [
            'created' => 0,
            'updated' => 0,
            'skipped' => 0,
            'blank' => 0,
            'errors' => [],
        ];

        $departmentName = $this->cleanText($sheet->getTitle());
        if ($departmentName === null) {
            return $summary;
        }

        try {
            $header = $this->resolveHeader($sheet);
        } catch (\Throwable $e) {
            $summary['errors'][] = $sheet->getTitle() . ': ' . $e->getMessage();
            return $summary;
        }

        $departmentId = $this->resolveDepartmentId($departmentName);

        for ($row = $header['row'] + 1; $row <= $sheet->getHighestRow(); $row++) {
            try {
                $record = $this->extractRecord($sheet, $row, $header['map']);
                if ($record === null) {
                    $summary['blank']++;
                    continue;
                }

                if ($record['name'] === null || $record['partner'] === null || $record['division'] === null) {
                    $summary['skipped']++;
                    $summary['errors'][] = $sheet->getTitle() . ' row ' . $row . ': missing required name/partner/division';
                    continue;
                }

                $employeeEmail = $record['email']
                    ?? $this->buildSyntheticEmployeeEmail($departmentName, $record['employee_niks'], $record['name'], $row);

                $partnerId = $this->resolvePartnerId($record['partner'], $departmentId);
                $divisionId = $this->resolveDivisionId($record['division'], $departmentId, $partnerId);
                $jobId = $this->resolveJobId($record['job'], $departmentId, $partnerId, $divisionId);

                $workEmail = $this->resolveWorkEmail($record['email_work'], $employeeEmail, $record['employee_niks'], $record['name']);
                $resolvedPhone = $this->resolveEmployeePhone($record['phone'], $employeeEmail);
                $hireDate = $record['hire_date'] ?? now()->toDateString();
                $birthDate = $record['birth_date'] ?? $hireDate;

                $user = $this->upsertUser($workEmail, $record['name']);

                $existingEmployee = Employee::where('email', $employeeEmail)->first();
                $employee = Employee::updateOrCreate(
                    ['email' => $employeeEmail],
                    [
                        'user_id' => $user->id,
                        'region' => $record['region'],
                        'department_id' => $departmentId,
                        'partner_id' => $partnerId,
                        'division_id' => $divisionId,
                        'job_id' => $jobId,
                        'shift_id' => $this->defaultShiftId,
                        'weekday_off' => $record['weekday_off'],
                        'name' => $record['name'],
                        'employee_niks' => $record['employee_niks'],
                        'email_work' => $workEmail,
                        'phone' => $resolvedPhone,
                        'status' => $record['status'],
                        'bpjs_allowance' => $record['bpjs_allowance'],
                        'no_bpjs' => $record['no_bpjs'],
                        'no_bpjstk' => $record['no_bpjstk'],
                        'bpjs_tenaga_kerja_allowance' => $record['bpjs_tk_allowance'],
                        'pension_allowance' => $record['pension_allowance'],
                        'positional_allowance' => $record['positional_allowance'],
                        'basic_salary' => $record['basic_salary'],
                        'address' => $record['address'],
                        'photo' => $record['photo'],
                        'ktp' => $record['ktp'],
                        'cv' => $record['cv'],
                        'pkwt' => $record['pkwt'],
                        'birth_date' => $birthDate,
                        'hire_date' => $hireDate,
                        'contract_end_date' => $record['contract_end_date'],
                        'grade_id' => $this->defaultGradeId,
                        'office' => $this->defaultOfficeId,
                        'created_by' => $this->actorId,
                        'updated_by' => $this->actorId,
                    ]
                );

                if ($existingEmployee) {
                    $summary['updated']++;
                } else {
                    $summary['created']++;
                }

                $this->ensureEmployeeDefaultFolders($employee);

                EmployeeSalary::updateOrCreate(
                    ['employee_id' => $employee->id],
                    [
                        'take_home_pay' => $record['basic_salary'] + $record['positional_allowance'] + $record['pension_allowance'] + $record['bpjs_tk_allowance'] + $record['bpjs_allowance'],
                        'basic_salary' => $record['basic_salary'],
                        'positional_allowance' => $record['positional_allowance'],
                        'bpjs_allowance' => $record['bpjs_allowance'],
                        'bpjs_tenaga_kerja_allowance' => $record['bpjs_tk_allowance'],
                        'pension_allowance' => $record['pension_allowance'],
                        'created_by' => $this->actorId,
                        'updated_by' => $this->actorId,
                    ]
                );
            } catch (\Throwable $e) {
                $summary['skipped']++;
                $summary['errors'][] = $sheet->getTitle() . ' row ' . $row . ': ' . $e->getMessage();
            }
        }

        return $summary;
    }

    private function resolveHeader(Worksheet $sheet): array
    {
        $aliases = [
            'employee_niks' => ['ID_KARYAWAN'],
            'name' => ['NAMA'],
            'email' => ['EMAIL'],
            'email_work' => ['EMAIL_KERJA'],
            'phone' => ['NO_HP'],
            'region' => ['WILAYAH'],
            'partner' => ['PARTNER'],
            'division' => ['SITE'],
            'job' => ['POSISI'],
            'status' => ['STATUS'],
            'birth_date' => ['TANGGAL_LAHIR'],
            'hire_date' => ['TANGGAL_DITERIMA'],
            'contract_end_date' => ['TANGGAL_KONTRAK_BERAKHIR'],
            'weekday_off' => ['HARI_LIBUR'],
            'basic_salary' => ['GAJI_POKOK'],
            'positional_allowance' => ['TUNJ_POSISI'],
            'pension_allowance' => ['TUNJ_PENSIUN'],
            'bpjs_tk_allowance' => ['TUNJ_BPJS_TK'],
            'bpjs_allowance' => ['TUNJ_BPJS'],
            'no_bpjs' => ['NO_BPJS'],
            'no_bpjstk' => ['NO_BPJSTK'],
            'address' => ['ALAMAT'],
            'cv' => ['CV'],
            'pkwt' => ['PKWT'],
            'photo' => ['PAS_FOTO'],
            'ktp' => ['KTP'],
        ];

        $maxRow = min(15, $sheet->getHighestRow());
        $maxCol = Coordinate::columnIndexFromString($sheet->getHighestColumn());

        for ($row = 1; $row <= $maxRow; $row++) {
            $columns = [];
            for ($col = 1; $col <= $maxCol; $col++) {
                $letter = Coordinate::stringFromColumnIndex($col);
                $key = $this->normalizeHeader((string) $sheet->getCell($letter . $row)->getValue());
                if ($key !== '') {
                    $columns[$key] = $letter;
                }
            }

            $map = [];
            foreach ($aliases as $target => $keys) {
                foreach ($keys as $key) {
                    if (isset($columns[$key])) {
                        $map[$target] = $columns[$key];
                        break;
                    }
                }
            }

            if (isset($map['name'], $map['email'], $map['partner'], $map['division'])) {
                return ['row' => $row, 'map' => $map];
            }
        }

        throw new \RuntimeException('Header row not found in sheet: ' . $sheet->getTitle());
    }

    private function resolveEmployeePhone(?string $phone, string $employeeEmail): ?string
    {
        if ($phone === null || $phone === '') {
            return null;
        }

        $normalizedEmail = strtolower($employeeEmail);
        $owner = $this->phoneOwnerIndex[$phone] ?? null;

        if ($owner === null || $owner === $normalizedEmail) {
            $this->phoneOwnerIndex[$phone] = $normalizedEmail;
            return $phone;
        }

        return null;
    }

    private function buildSyntheticEmployeeEmail(string $departmentName, ?string $nik, string $name, int $row): string
    {
        $deptSlug = Str::slug($departmentName, '.');
        if ($deptSlug === '') {
            $deptSlug = 'department';
        }

        $identity = $nik ? Str::slug($nik, '.') : Str::slug($name, '.');
        if ($identity === '') {
            $identity = 'row.' . $row;
        }

        return strtolower('seed.' . $deptSlug . '.' . $identity . '@office.local');
    }

    private function extractRecord(Worksheet $sheet, int $row, array $map): ?array
    {
        $text = fn (string $key): ?string => $this->getTextValue($sheet, $row, $map[$key] ?? null);
        $raw = fn (string $key): mixed => $this->getRawValue($sheet, $row, $map[$key] ?? null);

        $name = $text('name');
        $email = $this->normalizeEmail($text('email'));
        $partner = $text('partner');
        $division = $text('division');
        $job = $text('job');

        if ($name === null && $email === null && $partner === null && $division === null && $job === null) {
            return null;
        }

        return [
            'employee_niks' => $text('employee_niks'),
            'name' => $name,
            'email' => $email,
            'email_work' => $this->normalizeEmail($text('email_work')),
            'phone' => $this->normalizePhone($text('phone')),
            'region' => $this->normalizeRegion($text('region')),
            'partner' => $partner,
            'division' => $division,
            'job' => $job,
            'status' => $this->normalizeStatus($text('status')),
            'birth_date' => $this->parseDateValue($raw('birth_date')),
            'hire_date' => $this->parseDateValue($raw('hire_date')),
            'contract_end_date' => $this->parseDateValue($raw('contract_end_date')),
            'weekday_off' => $text('weekday_off'),
            'basic_salary' => $this->toNumber($raw('basic_salary')),
            'positional_allowance' => $this->toNumber($raw('positional_allowance')),
            'pension_allowance' => $this->toNumber($raw('pension_allowance')),
            'bpjs_tk_allowance' => $this->toNumber($raw('bpjs_tk_allowance')),
            'bpjs_allowance' => $this->toNumber($raw('bpjs_allowance')),
            'no_bpjs' => $this->toInt32($raw('no_bpjs')),
            'no_bpjstk' => $this->toInt32($raw('no_bpjstk')),
            'address' => $text('address'),
            'cv' => $text('cv'),
            'pkwt' => $text('pkwt'),
            'photo' => $text('photo'),
            'ktp' => $text('ktp'),
        ];
    }

    private function ensureEmployeeDefaultFolders(Employee $employee): void
    {
        $employeeFolder = DocumentFolders::firstOrCreate(
            [
                'employee_id' => $employee->id,
                'parent_folder_id' => null,
                'folder_name' => $employee->name,
            ],
            [
                'created_by' => $this->actorId,
            ]
        );

        foreach (['CV', 'PKWT', 'DAN LAINNYA'] as $folderName) {
            DocumentFolders::firstOrCreate(
                [
                    'employee_id' => $employee->id,
                    'parent_folder_id' => $employeeFolder->id,
                    'folder_name' => $folderName,
                ],
                [
                    'created_by' => $this->actorId,
                ]
            );
        }
    }

    private function resolveDepartmentId(string $name): int
    {
        $key = $this->key($name);

        if (isset($this->departmentCache[$key])) {
            return $this->departmentCache[$key];
        }

        throw new \RuntimeException(sprintf(
            'Department "%s" tidak ditemukan. Pastikan nama sheet sama persis dengan department yang sudah dibuat lewat seeder (department tersedia: %s).',
            $name,
            implode(', ', array_keys($this->departmentCache)) ?: '-'
        ));
    }

    private function resolvePartnerId(string $name, int $departmentId): int
    {
        $key = $departmentId . '|' . $this->key($name);
        if (isset($this->partnerCache[$key])) {
            return $this->partnerCache[$key];
        }

        $partner = Partner::updateOrCreate(
            ['partner_name' => $name, 'department_id' => $departmentId],
            [
                'office_id' => $this->defaultOfficeId,
                'status' => 'ACTIVE',
                'description' => null,
                'images' => null,
                'created_by' => $this->actorId,
                'updated_by' => $this->actorId,
                'deleted_by' => $this->actorId,
            ]
        );

        $this->partnerCache[$key] = (int) $partner->id;
        return $this->partnerCache[$key];
    }

    private function resolveDivisionId(string $name, int $departmentId, int $partnerId): int
    {
        $key = $partnerId . '|' . $this->key($name);
        if (isset($this->divisionCache[$key])) {
            return $this->divisionCache[$key];
        }

        $division = Division::updateOrCreate(
            ['partner_id' => $partnerId, 'name_division' => $name],
            [
                'department_id' => $departmentId,
                'status' => 'ACTIVE',
                'description' => null,
                'images' => null,
                'created_by' => $this->actorId,
                'updated_by' => $this->actorId,
                'deleted_by' => $this->actorId,
            ]
        );

        $this->divisionCache[$key] = (int) $division->id;
        return $this->divisionCache[$key];
    }

    private function resolveJobId(?string $name, int $departmentId, int $partnerId, int $divisionId): ?int
    {
        $jobName = $name;
        if ($jobName === null || trim($jobName) === '') {
            $jobName = 'UNASSIGNED';
        }

        $key = $divisionId . '|' . $this->key($jobName);
        if (isset($this->jobCache[$key])) {
            return $this->jobCache[$key];
        }

        $job = Job::updateOrCreate(
            ['division_id' => $divisionId, 'job_name' => $jobName],
            [
                'department_id' => $departmentId,
                'partner_id' => $partnerId,
                'status' => 'ACTIVE',
                'description' => null,
                'created_by' => $this->actorId,
                'updated_by' => $this->actorId,
                'deleted_by' => $this->actorId,
            ]
        );

        $this->jobCache[$key] = (int) $job->id;
        return $this->jobCache[$key];
    }

    private function resolveWorkEmail(?string $preferred, string $fallbackEmail, ?string $nik, string $name): string
    {
        if ($preferred !== null && isset($this->userEmailIndex[strtolower($preferred)])) {
            return $preferred;
        }

        if ($preferred !== null && !isset($this->userEmailIndex[strtolower($preferred)])) {
            return $this->reserveEmail($preferred);
        }

        $localBase = $nik !== null ? Str::lower(Str::slug($nik, '.')) : Str::lower(Str::slug($name, '.'));
        $localBase = trim($localBase, '.');
        if ($localBase === '') {
            $localBase = 'employee';
        }

        $candidate = $localBase . '@office.local';
        if (strtolower($candidate) === strtolower($fallbackEmail)) {
            $candidate = $localBase . '.work@office.local';
        }

        return $this->reserveEmail($candidate);
    }

    private function upsertUser(string $email, string $name): User
    {
        $user = User::whereRaw('LOWER(email) = ?', [strtolower($email)])->first();

        if ($user) {
            $user->name = $name;
            $user->user_type = 'REGULAR';
            $user->user_role = 'EMPLOYEE';
            $user->photo = $user->photo ?: 'asset/img/avatar.png';
            $user->save();
            return $user;
        }

        $newUser = User::create([
            'name' => $name,
            'email' => $email,
            'user_type' => 'REGULAR',
            'user_role' => 'EMPLOYEE',
            'photo' => 'asset/img/avatar.png',
            'password' => 'office_2025',
        ]);

        $this->userEmailIndex[strtolower($email)] = (int) $newUser->id;

        return $newUser;
    }

    private function reserveEmail(string $email): string
    {
        $email = strtolower($email);
        if (filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
            $email = Str::slug($email, '.') . '@office.local';
        }

        if (!isset($this->userEmailIndex[$email])) {
            $this->userEmailIndex[$email] = 0;
            return $email;
        }

        [$local, $domain] = explode('@', $email, 2);
        $i = 1;
        do {
            $candidate = $local . '.' . $i . '@' . $domain;
            $i++;
        } while (isset($this->userEmailIndex[$candidate]));

        $this->userEmailIndex[$candidate] = 0;
        return $candidate;
    }

    private function normalizeHeader(string $header): string
    {
        $header = strtoupper(trim($header));
        $header = preg_replace('/[^A-Z0-9]+/', '_', $header);
        return trim((string) $header, '_');
    }

    private function key(string $value): string
    {
        return strtoupper(trim((string) preg_replace('/\s+/', ' ', $value)));
    }

    private function cleanText(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $value = trim((string) preg_replace('/\s+/', ' ', $value));
        if ($value === '' || $value === '-') {
            return null;
        }

        return $value;
    }

    private function getTextValue(Worksheet $sheet, int $row, ?string $column): ?string
    {
        if ($column === null) {
            return null;
        }

        $value = $sheet->getCell($column . $row)->getValue();
        return $this->cleanText((string) $value);
    }

    private function getRawValue(Worksheet $sheet, int $row, ?string $column): mixed
    {
        if ($column === null) {
            return null;
        }

        return $sheet->getCell($column . $row)->getValue();
    }

    private function normalizeEmail(?string $email): ?string
    {
        if ($email === null) {
            return null;
        }

        $email = strtolower(trim($email));
        if ($email === '' || $email === '-') {
            return null;
        }

        return filter_var($email, FILTER_VALIDATE_EMAIL) ? $email : null;
    }

    private function normalizePhone(?string $phone): ?string
    {
        if ($phone === null) {
            return null;
        }

        $digits = (string) preg_replace('/\D+/', '', $phone);
        if ($digits === '') {
            return null;
        }

        if (strlen($digits) > 20) {
            return substr($digits, 0, 20);
        }

        return $digits;
    }

    private function normalizeRegion(?string $region): ?string
    {
        if ($region === null) {
            return null;
        }

        $normalized = strtoupper(trim($region));
        if ($normalized === 'DI YOGYAKARTA') {
            $normalized = 'DAERAH ISTIMEWA YOGYAKARTA';
        }

        return in_array($normalized, self::REGION_ALLOWLIST, true) ? $normalized : null;
    }

    private function normalizeStatus(?string $status): string
    {
        if ($status === null) {
            return 'ACTIVE';
        }

        $normalized = strtoupper(trim($status));
        return in_array($normalized, ['ACTIVE', 'RESIGN', 'CANDIDATE', 'DELETED'], true) ? $normalized : 'ACTIVE';
    }

    private function parseDateValue(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        try {
            if (is_numeric($value)) {
                return ExcelDate::excelToDateTimeObject((float) $value)->format('Y-m-d');
            }

            return Carbon::parse((string) $value)->format('Y-m-d');
        } catch (\Throwable $e) {
            return null;
        }
    }

    private function toNumber(mixed $value): float
    {
        if ($value === null || $value === '') {
            return 0;
        }

        if (is_numeric($value)) {
            return (float) $value;
        }

        $clean = (string) preg_replace('/[^0-9,.-]/', '', (string) $value);
        if ($clean === '') {
            return 0;
        }

        if (str_contains($clean, ',') && str_contains($clean, '.')) {
            $clean = str_replace('.', '', $clean);
            $clean = str_replace(',', '.', $clean);
        } elseif (str_contains($clean, ',')) {
            $clean = str_replace(',', '.', $clean);
        }

        return is_numeric($clean) ? (float) $clean : 0;
    }

    private function toInt32(mixed $value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }

        $digits = (string) preg_replace('/\D+/', '', (string) $value);
        if ($digits === '') {
            return null;
        }

        $number = (int) $digits;
        return $number <= 2147483647 ? $number : null;
    }
}