<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DepartmentSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $departments = [
            ['name' => 'Human Resource', 'short_code' => 'HR', 'type' => 'hr'],
            ['name' => 'Marketing', 'short_code' => 'Mar', 'type' => 'general'],
            ['name' => 'Software & IT', 'short_code' => 'IT', 'type' => 'general'],
            ['name' => 'Finance & Account', 'short_code' => 'FA', 'type' => 'finance'],
            ['name' => 'Indoor Sales', 'short_code' => 'IS', 'type' => 'general'],
            ['name' => 'Outdoor Sales', 'short_code' => 'OS', 'type' => 'general'],
            ['name' => 'Customer Service', 'short_code' => 'CS', 'type' => 'general'],
            ['name' => 'Business Development', 'short_code' => 'BD', 'type' => 'general'],
        ];

        foreach ($departments as $row) {
            DB::table('departments')->insertOrIgnore([
                'name' => $row['name'],
                'short_code' => $row['short_code'],
                'type' => $row['type'],
                'status' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }
}
