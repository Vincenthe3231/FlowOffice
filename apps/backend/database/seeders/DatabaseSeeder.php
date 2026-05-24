<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(DepartmentSeeder::class);
        $this->call(RolesAndPermissionsSeeder::class);
        $this->call(EmergencyLeaveTypeSeeder::class);

        if (env('SEED_DEMO_DATA', false)) {
            $this->call(DemoSeeder::class);
        }
    }
}
