<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Division;
use App\Models\Employee;
use App\Models\Grade;
use App\Models\Job;
use App\Models\Office;
use App\Models\Partner;
use App\Models\Shift;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OfficeBasicSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $actor = User::updateOrCreate(
                ['email' => 'seeder.system@office.local'],
                [
                    'name' => 'Seeder System',
                    'user_type' => 'ADMINISTRATOR',
                    'user_role' => 'ADMINISTRATOR',
                    'password' => 'office_2025',
                    'photo' => 'asset/img/avatar.png',
                ]
            );

            $actorId = (int) $actor->id;
            $defaultOfficeId = Office::query()->orderBy('id')->value('id');
            $defaultGradeId = Grade::query()->orderBy('id')->value('id');
            $defaultShiftId = Shift::query()->orderBy('id')->value('id');

            $department = Department::updateOrCreate(
                ['name_department' => 'SUPERADMIN DEPARTMENT'],
                [
                    'status' => 'ACTIVE',
                    'description' => 'System department for superadmin',
                    'images' => null,
                    'created_by' => $actorId,
                    'updated_by' => $actorId,
                    'deleted_by' => $actorId,
                ]
            );

            $partner = Partner::updateOrCreate(
                [
                    'partner_name' => 'SUPERADMIN PARTNER',
                    'department_id' => $department->id,
                ],
                [
                    'office_id' => $defaultOfficeId,
                    'status' => 'ACTIVE',
                    'description' => 'System partner for superadmin',
                    'images' => null,
                    'created_by' => $actorId,
                    'updated_by' => $actorId,
                    'deleted_by' => $actorId,
                ]
            );

            $division = Division::updateOrCreate(
                [
                    'partner_id' => $partner->id,
                    'name_division' => 'SUPERADMIN DIVISION',
                ],
                [
                    'department_id' => $department->id,
                    'status' => 'ACTIVE',
                    'description' => 'System division for superadmin',
                    'images' => null,
                    'created_by' => $actorId,
                    'updated_by' => $actorId,
                    'deleted_by' => $actorId,
                ]
            );

            $job = Job::updateOrCreate(
                [
                    'division_id' => $division->id,
                    'job_name' => 'SUPERADMIN',
                ],
                [
                    'department_id' => $department->id,
                    'partner_id' => $partner->id,
                    'description' => 'System job for superadmin',
                    'status' => 'ACTIVE',
                    'created_by' => $actorId,
                    'updated_by' => $actorId,
                    'deleted_by' => $actorId,
                ]
            );

            $superadminUser = User::updateOrCreate(
                ['email' => 'superadminsgs@gmail.com'],
                [
                    'name' => 'Superadmin SGS',
                    'user_type' => 'SUPERADMIN',
                    'user_role' => 'ADMINISTRATOR',
                    'password' => 'supsgs_2026',
                    'photo' => 'asset/img/avatar.png',
                ]
            );

            Employee::updateOrCreate(
                ['email' => 'superadminsgs@gmail.com'],
                [
                    'user_id' => $superadminUser->id,
                    'region' => 'DKI JAKARTA',
                    'department_id' => $department->id,
                    'partner_id' => $partner->id,
                    'division_id' => $division->id,
                    'job_id' => $job->id,
                    'shift_id' => $defaultShiftId,
                    'profile_picture' => 'asset/img/logo.png',
                    'name' => 'Superadmin SGS',
                    'email_work' => 'superadminsgs@gmail.com',
                    'phone' => '081234567890',
                    'status' => 'ACTIVE',
                    'address' => 'SUPERADMIN ADDRESS',
                    'photo' => 'asset/img/logo.png',
                    'ktp' => null,
                    'birth_date' => '1990-01-01',
                    'hire_date' => '2024-01-01',
                    'contract_end_date' => '2030-12-31',
                    'resign_date' => null,
                    'grade_id' => $defaultGradeId,
                    'office' => $defaultOfficeId,
                    'created_by' => $actorId,
                    'updated_by' => $actorId,
                    'deleted_by' => $actorId,
                ]
            );

            $otherDepartments = [
                'HSN',
                'KEMENAG',
                'BATANG',
                'SEKWAN JATENG',
                'SEKWAN KENDAL',
                'BPSDM',
                'SEMARANG',
            ];

            foreach ($otherDepartments as $index => $deptName) {
                $dept = Department::updateOrCreate(
                    ['name_department' => $deptName],
                    [
                        'status' => 'ACTIVE',
                        'description' => "System {$deptName} department for superadmin",
                        'images' => null,
                        'created_by' => $actorId,
                        'updated_by' => $actorId,
                        'deleted_by' => $actorId,
                    ]
                );

                $slug = Str::slug($deptName, '_');

                $deptPartner = Partner::updateOrCreate(
                    [
                        'partner_name' => "ADMIN {$deptName} PARTNER",
                        'department_id' => $dept->id,
                    ],
                    [
                        'office_id' => $defaultOfficeId,
                        'status' => 'ACTIVE',
                        'description' => "Admin partner for {$deptName}",
                        'images' => null,
                        'created_by' => $actorId,
                        'updated_by' => $actorId,
                        'deleted_by' => $actorId,
                    ]
                );

                $deptDivision = Division::updateOrCreate(
                    [
                        'partner_id' => $deptPartner->id,
                        'name_division' => "ADMIN {$deptName} DIVISION",
                    ],
                    [
                        'department_id' => $dept->id,
                        'status' => 'ACTIVE',
                        'description' => "Admin division for {$deptName}",
                        'images' => null,
                        'created_by' => $actorId,
                        'updated_by' => $actorId,
                        'deleted_by' => $actorId,
                    ]
                );

                $deptJob = Job::updateOrCreate(
                    [
                        'division_id' => $deptDivision->id,
                        'job_name' => 'ADMIN',
                    ],
                    [
                        'department_id' => $dept->id,
                        'partner_id' => $deptPartner->id,
                        'description' => "Admin job for {$deptName}",
                        'status' => 'ACTIVE',
                        'created_by' => $actorId,
                        'updated_by' => $actorId,
                        'deleted_by' => $actorId,
                    ]
                );

                $adminEmail = "admin.{$slug}@gmail.com";
                $legacyAdminEmail = "admin.{$slug}@office.local";
                $adminPassword = "admin_{$slug}_2026";
                $adminPhone = '0812345' . str_pad((string) ($index + 1), 5, '0', STR_PAD_LEFT);

                $deptAdminUser = User::whereIn('email', [$adminEmail, $legacyAdminEmail])->first() ?? new User();
                $deptAdminUser->fill([
                    'email' => $adminEmail,
                    'name' => "Admin {$deptName}",
                    'user_type' => 'ADMINISTRATOR',
                    'user_role' => 'ADMINISTRATOR',
                    'password' => $adminPassword,
                    'photo' => 'asset/img/avatar.png',
                ])->save();

                Employee::updateOrCreate(
                    ['user_id' => $deptAdminUser->id],
                    [
                        'email' => $adminEmail,
                        'region' => 'DKI JAKARTA',
                        'department_id' => $dept->id,
                        'partner_id' => $deptPartner->id,
                        'division_id' => $deptDivision->id,
                        'job_id' => $deptJob->id,
                        'shift_id' => $defaultShiftId,
                        'profile_picture' => 'asset/img/logo.png',
                        'name' => "Admin {$deptName}",
                        'email_work' => $adminEmail,
                        'phone' => $adminPhone,
                        'status' => 'ACTIVE',
                        'address' => "ADMIN {$deptName} ADDRESS",
                        'photo' => 'asset/img/logo.png',
                        'ktp' => null,
                        'birth_date' => '1990-01-01',
                        'hire_date' => '2024-01-01',
                        'contract_end_date' => '2030-12-31',
                        'resign_date' => null,
                        'grade_id' => $defaultGradeId,
                        'office' => $defaultOfficeId,
                        'created_by' => $actorId,
                        'updated_by' => $actorId,
                        'deleted_by' => $actorId,
                    ]
                );
            }
        });
    }
}
