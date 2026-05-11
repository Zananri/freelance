<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Database\Seeders\OfficeBasicSeeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Ensure at least one user exists (with required user_type and user_role)
        User::updateOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'user_type' => 'ADMINISTRATOR',
                'user_role' => 'ADMINISTRATOR',
                // Password will be hashed via casts in the User model
                'password' => 'password',
            ]
        );

        $this->call([
            GradeSeeder::class,
            OfficeSeeder::class,
            OfficeBasicSeeder::class,
            UpdateEmployeeGradeOfficeSeeder::class,
        ]);
    }
}
