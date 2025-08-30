<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Grade;

class GradeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {

        // 1	Manager
        // 2	Analyst
        // 3	Senior Analyst
        // 4	Associate
        // 5	Junior Manager
        // 6	Junior Analyst
        // 7	Junior Associate

        $grade = Grade::updateOrCreate([
                    'title' => 'Manager',
                    'status' =>  'ACTIVE',
                    'created_by' =>  1,
                    'updated_by' =>  1
        ]);

        $grade2 = Grade::updateOrCreate([
                    'title' => 'Analyst',
                    'status' =>  'ACTIVE',
                    'created_by' =>  1,
                    'updated_by' =>  1
        ]);

        $grade3 = Grade::updateOrCreate([
                    'title' => 'Senior Analyst',
                    'status' =>  'ACTIVE',
                    'created_by' =>  1,
                    'updated_by' =>  1
        ]);

        $grade4 = Grade::updateOrCreate([
                    'title' => 'Associate',
                    'status' =>  'ACTIVE',
                    'created_by' =>  1,
                    'updated_by' =>  1
        ]);

        $grade5 = Grade::updateOrCreate([
                    'title' => 'Junior Manager',
                    'status' =>  'ACTIVE',
                    'created_by' =>  1,
                    'updated_by' =>  1
        ]);

        $grade6 = Grade::updateOrCreate([
                    'title' => 'Junior Analyst',
                    'status' =>  'ACTIVE',
                    'created_by' =>  1,
                    'updated_by' =>  1
        ]);

        $grade6 = Grade::updateOrCreate([
                    'title' => 'Junior Associate',
                    'status' =>  'ACTIVE',
                    'created_by' =>  1,
                    'updated_by' =>  1
        ]);

    }
}
