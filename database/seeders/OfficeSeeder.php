<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Office;

class OfficeSeeder extends Seeder
{
    /**
     * Run the database seeds.
    */
    public function run(): void
    {
        $office = Office::updateOrCreate([
                    'name' => 'Office 1',
                    'location' => '-6.164849, 106.809542',
                    'status' =>  'ACTIVE',
                    'created_by' =>  1,
                    'updated_by' =>  1
        ]);

        $office2 = Office::updateOrCreate([
                    'name' => 'Office 2',
                    'location' => '-6.229250, 106.781767',
                    'status' =>  'ACTIVE',
                    'created_by' =>  1,
                    'updated_by' =>  1
        ]);
         
    }
}
