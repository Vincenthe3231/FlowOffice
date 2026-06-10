<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

class FirstRunAdminSeeder extends Seeder
{
    public function run(): void
    {
        $email    = env('ADMIN_EMAIL', 'admin@example.com');
        $name     = env('ADMIN_NAME', 'Administrator');
        $password = env('ADMIN_PASSWORD', 'change-me-immediately');

        $role = Role::firstOrCreate(['name' => 'top_management', 'guard_name' => 'sanctum']);

        $admin = User::firstOrCreate(
            ['email' => $email],
            [
                'uuid'     => (string) Str::uuid(),
                'name'     => $name,
                'password' => Hash::make($password),
                'status'   => 'active',
            ]
        );

        if (empty($admin->uuid)) {
            $admin->forceFill(['uuid' => (string) Str::uuid()])->save();
        }

        $admin->syncRoles($role);
        $admin->forceFill(['status' => 'active'])->save();
    }
}
