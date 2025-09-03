<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Employee;
use App\Models\User;

class EmployeeUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $user0 = User::updateOrCreate(
            [   'email' => 'user@nsaperformance.id', 'name' => 'User', 'user_type' => 'ADMINISTRATOR','user_role' => 'GENERAL_MANAGER',
                'password' => 'NSA_2025',
                'photo' => 'asset/img/avatar.png',
            ]
        );

        Employee::updateOrCreate([
                'user_id' => $user0->id, 'department_id' => 8, 'division_id' => 21, 'job_id' => 38, 'shift_id' => 1,
                'profile_picture' => 'asset/img/avatar.png', 'employee_niks' => 'NSAID-001', 'name' => 'Admin', 
                'email' => 'user@nsaperformance.id', 'email_work' => 'user@nsaperformance.id', 'phone' => '00000000000', 'status' => 'ACTIVE', 'address' => '',
                'photo' => 'asset/img/avatar.png', 'ktp' => '', 'birth_date' => '1990-01-01', 'hire_date' => '2024-01-01',
                'resign_date' => null, 'grade_id' => 1, 'office' => 1,
                'created_by' => 1, 'updated_by' => 1,'deleted_by' => null,
        ]);


    }
}
