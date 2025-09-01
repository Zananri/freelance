<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Employee; 

class UpdateEmployeeGradeOfficeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Employee::where('id','>',0)->update(
            [
                'grade_id' => 1,
                'office' => 1
            ]
        );
    }
}
