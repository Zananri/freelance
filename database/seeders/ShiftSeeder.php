<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Shift;
class ShiftSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $shift = Shift::updateOrCreate([
                    'title' => 'Morning Shift',
                    'time_start' => '09:00:00',
                    'time_end' => '18:00:00',
                    'total_checkpoint' => '1',
                    'total_hour' => 9,
                    'status' => 'ACTIVE',
                    'created_by' =>  1,
                    'updated_by' =>  1,
                    'deleted_by' =>  1
        ]);
    }
}
