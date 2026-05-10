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
                    'name' => 'Acer Customer Service Center Mangga Dua Square',
                    'location' => '-6.140808415355851, 106.8323372601321',
                    'status' =>  'ACTIVE',
                    'created_by' =>  1,
                    'updated_by' =>  1
        ]);

        $office2 = Office::updateOrCreate([
                    'name' => 'Office 2',
                    'location' => '0, 0',
                    'status' =>  'ACTIVE',
                    'created_by' =>  1,
                    'updated_by' =>  1
        ]);
         
    }
}
