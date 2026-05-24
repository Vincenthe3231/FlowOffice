<?php

namespace Database\Seeders;

use App\Models\LeaveType;
use Illuminate\Database\Seeder;

class EmergencyLeaveTypeSeeder extends Seeder
{
    public function run(): void
    {
        LeaveType::firstOrCreate(
            ['key' => 'emergency'],
            [
                'name'                 => 'Emergency Leave',
                'description'          => 'Unplanned leave for urgent personal or family emergencies. HOD approval only; HR is notified but not an approval gate.',
                'annual_quota'         => null,
                'requires_attachment'  => false,
                'approval_chain'       => [['role' => 'hod']],
                'duration_threshold'   => null,
                'duration_threshold_role' => null,
            ]
        );
    }
}
