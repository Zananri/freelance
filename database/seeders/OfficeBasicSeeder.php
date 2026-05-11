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
            $department = Department::updateOrCreate(
                ['name_department' => 'Technology'],
                [
                    'status' => 'Active',
                    'description' => 'Technology department handling systems and product engineering.',
                    'images' => 'asset/img/logo/google.png',
                    'created_by' => 1,
                    'updated_by' => 1,
                    'deleted_by' => 1,
                ]
            );

            // Create Division
            $division = Division::updateOrCreate(
                [
                    'department_id' => $department->id,
                    'name_division' => 'Engineering',
                ],
                [
                    'status' => 'Active',
                    'description' => 'Application engineering division.',
                    'images' => 'asset/img/logo/google.png',
                    'created_by' => 1,
                    'updated_by' => 1,
                    'deleted_by' => 1,
                ]
            );

            // Create Job
            $job = Job::updateOrCreate(
                [
                    'department_id' => $department->id,
                    'division_id' => $division->id,
                    'job_name' => 'Software Engineer',
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
                ['email' => 'john.doe@example.com'],
                [
                    'name' => 'John Doe',
                    'user_type' => 'EMPLOYEE',
                    'user_role' => 'employee',
                    'password' => 'password',
                    'photo' => 'asset/img/logo/google.png',
                ]
            );

            // Create Employee
            Employee::updateOrCreate(
                [
                    'email' => 'john.doe@example.com',
                ],
                [
                    'user_id' => $user->id,
                    'department_id' => $department->id,
                    'division_id' => $division->id,
                    'job_id' => $job->id,
                    'profile_picture' => null,
                    'name' => 'John Doe',
                    'email_work' => 'john.doe@company.com',
                    'phone' => '081234567890',
                    'status' => 'Active',
                    'address' => 'Jl. Contoh No. 123, Jakarta',
                    'photo' => 'asset/img/logo/google.png',
                    'ktp' => 'asset/img/logo/google.png',
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
                ['email' => 'admin@example.com'],
                [
                    'name' => 'Admin User',
                    'user_type' => 'ADMINISTRATOR',
                    'user_role' => 'ADMINISTRATOR',
                    'password' => 'password',
                    'photo' => 'asset/img/logo/google.png',
                ]
            );

            Employee::updateOrCreate(
                [
                    'email' => 'admin@example.com',
                ],
                [
                    'user_id' => $user->id,
                    'department_id' => $department->id,
                    'division_id' => $division->id,
                    'job_id' => $job->id,
                    'profile_picture' => null,
                    'name' => 'Admin User',
                    'email_work' => 'admin@office.id',
                    'phone' => '087676512376',
                    'status' => 'Active',
                    'address' => 'Jl. Contoh No. 123, Jakarta',
                    'photo' => 'asset/img/logo/google.png',
                    'ktp' => 'asset/img/logo/google.png',
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
