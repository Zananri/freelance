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
                    'name' => 'HSN',
                    'location' => '-6.140808415355851, 106.8323372601321',
                    'status' =>  'ACTIVE',
                    'created_by' =>  1,
                    'updated_by' =>  1
        ]);

        $office2 = Office::updateOrCreate([
                    'name' => 'SEKWAN KENDAL',
                    'location' => '-6.921550886667005, 110.20588013667556',
                    'status' =>  'ACTIVE',
                    'created_by' =>  1,
                    'updated_by' =>  1
        ]);

        $office3 = Office::updateOrCreate([
                    'name' => 'SEKWAN JATENG',
                    'location' => '-6.993477463646383, 110.42051823270718',
                    'status' =>  'ACTIVE',
                    'created_by' =>  1,
                    'updated_by' =>  1
        ]);

        $office4 = Office::updateOrCreate([
                    'name' => 'SEMARANG',
                    'location' => '-7.013286175464471, 110.41790428708627',
                    'status' =>  'ACTIVE',
                    'created_by' =>  1,
                    'updated_by' =>  1
        ]);

        $office5 = Office::updateOrCreate([
                    'name' => 'KEMENAG',
                    'location' => '-7.149520730405042, 110.40668697553713',
                    'status' =>  'ACTIVE',
                    'created_by' =>  1,
                    'updated_by' =>  1
        ]);

        $office6 = Office::updateOrCreate([
                    'name' => 'BPSDM',
                    'location' => '-7.055916829943457, 110.41223656333612',
                    'status' =>  'ACTIVE',
                    'created_by' =>  1,
                    'updated_by' =>  1
        ]);

        $office7 = Office::updateOrCreate([
                    'name' => 'BATANG',
                    'location' => '-6.976399888951952, 109.79706007062022',
                    'status' =>  'ACTIVE',
                    'created_by' =>  1,
                    'updated_by' =>  1
        ]);
         
    }
}
