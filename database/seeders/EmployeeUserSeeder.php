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
            [   'email' => 'user@office.id', 'name' => 'User', 'user_type' => 'ADMINISTRATOR','user_role' => 'ADMINISTRATOR',
                'password' => 'office_2025',
                'photo' => 'asset/img/avatar.png',
            ]
        );

    Employee::updateOrCreate([
        'user_id' => $user0->id, 'department_id' => 8, 'division_id' => 21, 'job_id' => 38, 'shift_id' => 1,
        // Keep profile_picture null initially; UI will fall back to default avatar.png
        'profile_picture' => null, 'employee_niks' => 'ID-001', 'name' => 'Admin', 
        'email' => 'user@office.id', 'email_work' => 'user@office.id', 'phone' => '00000000000', 'status' => 'ACTIVE', 'address' => '',
        // Keep legacy photo referencing default if desired, but it's safer to null it as well to avoid accidental deletions
        'photo' => 'asset/img/avatar.png', 'ktp' => '', 'birth_date' => '1990-01-01', 'hire_date' => '2024-01-01',
        'resign_date' => null, 'grade_id' => 1, 'office' => 1,
        'created_by' => 1, 'updated_by' => 1,'deleted_by' => null,
    ]);


    }
}
