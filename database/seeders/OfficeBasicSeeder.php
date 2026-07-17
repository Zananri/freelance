<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Department;
use App\Models\Division;
use App\Models\Job;
use App\Models\Employee;
use App\Models\User;

class OfficeBasicSeeder extends Seeder
{
    /**
     * Seed basic office data: one department, division, job, and one employee.
     */
    public function run(): void
    {
        DB::transaction(function () {
            // Create Department
            $department1 = Department::updateOrCreate(
                ['name_department' => 'Head Office'],
                [
                    'status' => 'Active',
                    'description' => 'Superadmin Only',
                    'images' => 'asset/img/logo/logo.png',
                    'created_by' => 1,
                    'updated_by' => 1,
                    'deleted_by' => 1,
                ]
            );

            $department2 = Department::updateOrCreate(
                ['name_department' => 'Mangga Dua'],
                [
                    'status' => 'Active',
                    'description' => 'Admin Only',
                    'images' => 'asset/img/logo/logo.png',
                    'created_by' => 1,
                    'updated_by' => 1,
                    'deleted_by' => 1,
                ]
            );

            $department3 = Department::updateOrCreate(
                ['name_department' => 'Marunda'],
                [
                    'status' => 'Active',
                    'description' => 'Admin Only',
                    'images' => 'asset/img/logo/logo.png',
                    'created_by' => 1,
                    'updated_by' => 1,
                    'deleted_by' => 1,
                ]
            );

            $department4 = Department::updateOrCreate(
                ['name_department' => 'Semarang'],
                [
                    'status' => 'Active',
                    'description' => 'Admin Only',
                    'images' => 'asset/img/logo/logo.png',
                    'created_by' => 1,
                    'updated_by' => 1,
                    'deleted_by' => 1,
                ]
            );

            // Create Division
            $division1 = Division::updateOrCreate(
                [
                    'department_id' => 1,
                    'name_division' => 'Head Office',
                ],
                [
                    'status' => 'Active',
                    'description' => 'Application engineering division.',
                    'images' => 'asset/img/logo/logo.png',
                    'created_by' => 1,
                    'updated_by' => 1,
                    'deleted_by' => 1,
                ]
            );
            $division2 = Division::updateOrCreate(
                [
                    'department_id' => 2,
                    'name_division' => 'Management',
                ],
                [
                    'status' => 'Active',
                    'description' => 'Application technology division.',
                    'images' => 'asset/img/logo/logo.png',
                    'created_by' => 1,
                    'updated_by' => 1,
                    'deleted_by' => 1,
                ]
            );
            $division3 = Division::updateOrCreate(
                [
                    'department_id' => 3,
                    'name_division' => 'Management',
                ],
                [
                    'status' => 'Active',
                    'description' => 'Application management division.',
                    'images' => 'asset/img/logo/logo.png',
                    'created_by' => 1,
                    'updated_by' => 1,
                    'deleted_by' => 1,
                ]
            );
            $division4 = Division::updateOrCreate(
                [
                    'department_id' => 4,
                    'name_division' => 'Management',
                ],
                [
                    'status' => 'Active',
                    'description' => 'Application production division.',
                    'images' => 'asset/img/logo/logo.png',
                    'created_by' => 1,
                    'updated_by' => 1,
                    'deleted_by' => 1,
                ]
            );

            // Create Job
            $job1 = Job::updateOrCreate(
                [
                    'department_id' => 1,
                    'division_id' => 1,
                    'job_name' => 'Head Office',
                ],
                [
                    'description' => 'Responsible for building and maintaining applications.',
                    'status' => 'Active',
                    'created_by' => 1,
                    'updated_by' => 1,
                    'deleted_by' => 1,
                ]
            );
            $job2 = Job::updateOrCreate(
                [
                    'department_id' => 2,
                    'division_id' => 2,
                    'job_name' => 'Admin',
                ],
                [
                    'description' => 'Responsible for building and maintaining applications.',
                    'status' => 'Active',
                    'created_by' => 1,
                    'updated_by' => 1,
                    'deleted_by' => 1,
                ]
            );
            $job3 = Job::updateOrCreate(
                [
                    'department_id' => 3,
                    'division_id' => 3,
                    'job_name' => 'Admin',
                ],
                [
                    'description' => 'Responsible for building and maintaining applications.',
                    'status' => 'Active',
                    'created_by' => 1,
                    'updated_by' => 1,
                    'deleted_by' => 1,
                ]
            );
            $job4 = Job::updateOrCreate(
                [
                    'department_id' => 4,
                    'division_id' => 4,
                    'job_name' => 'Admin',
                ],
                [
                    'description' => 'Responsible for building and maintaining applications.',
                    'status' => 'Active',
                    'created_by' => 1,
                    'updated_by' => 1,
                    'deleted_by' => 1,
                ]
            );

            // Ensure a user for the employee exists
            $user = User::updateOrCreate(
                ['email' => 'superadminsgs@gmail.com'],
                [
                    'name' => 'Superadmin SGS',
                    'user_type' => 'SUPERADMIN',
                    'user_role' => 'ADMINISTRATOR',
                    'password' => 'supsgs_2026',
                    'photo' => 'asset/img/logo/logo.png',
                ]
            );

            // Create Employee
            Employee::updateOrCreate(
                [
                    'email' => 'superadminsgs@gmail.com',
                ],
                [
                    'user_id' => $user->id,
                    'department_id' => 1,
                    'division_id' => 1,
                    'job_id' => $job1->id,
                    'profile_picture' => 'asset/img/logo/logo.png',
                    'name' => 'Superadmin SGS',
                    'email_work' => 'superadminsgs@gmail.com',
                    'phone' => '081234567890',
                    'status' => 'Active',
                    'address' => 'Jl. Gn. Sahari No.1 RT.12/RW.6, Ancol, Kec. Pademangan, Jkt Utara, DKI Jakarta 14420',
                    'photo' => 'asset/img/logo/logo.png',
                    'ktp' => 'asset/img/logo/logo.png',
                    'birth_date' => '1990-01-01',
                    'hire_date' => '2024-01-01',
                    'resign_date' => null,
                    // Using new integer columns: grade_id and office
                    'grade_id' => 1,
                    'office' => 1,
                    'created_by' => 1,
                    'updated_by' => 1,
                    'deleted_by' => null,
                ]
            );

            $user = User::updateOrCreate(
                ['email' => 'adminsgs@gmail.com'],
                [
                    'name' => 'Admin User',
                    'user_type' => 'ADMINISTRATOR',
                    'user_role' => 'ADMINISTRATOR',
                    'password' => 'adminsgs_2026',
                    'photo' => 'asset/img/logo/logo.png',
                ]
            );

            Employee::updateOrCreate(
                [
                    'email' => 'adminsgs@gmail.com',
                ],
                [
                    'user_id' => $user->id,
                    'department_id' => 2,
                    'division_id' => 2,
                    'job_id' => $job2->id,
                    'profile_picture' => 'asset/img/logo/logo.png',
                    'name' => 'Admin SGS',
                    'email_work' => 'adminsgs@gmail.com',
                    'phone' => '087676512376',
                    'status' => 'Active',
                    'address' => 'Jl. Gn. Sahari No.1 RT.12/RW.6, Ancol, Kec. Pademangan, Jkt Utara, DKI Jakarta 14420',
                    'photo' => 'asset/img/logo/logo.png',
                    'ktp' => 'asset/img/logo/logo.png',
                    'birth_date' => '1990-01-01',
                    'hire_date' => '2024-01-01',
                    'resign_date' => null,
                    // Using new integer columns: grade_id and office
                    'grade_id' => 1,
                    'office' => 1,
                    'created_by' => 1,
                    'updated_by' => 1,
                    'deleted_by' => null,
                ]
            );
        });
    }
}
