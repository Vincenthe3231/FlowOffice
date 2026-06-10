<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class OrganizationSettingsSeeder extends Seeder
{
    public function run(): void
    {
        if (DB::table('organization_settings')->exists()) {
            return;
        }

        DB::table('organization_settings')->insert([
            'name'       => env('ORG_NAME', 'My Company'),
            'logo_path'  => env('ORG_LOGO_PATH'),
            'timezone'   => env('APP_TIMEZONE', 'UTC'),
            'support_url' => env('ORG_SUPPORT_URL'),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
