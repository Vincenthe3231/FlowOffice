<?php

namespace Database\Seeders;

use App\Models\AttendanceLog;
use App\Models\Claim;
use App\Models\ClaimApproval;
use App\Models\ClaimCategory;
use App\Models\ClaimType;
use App\Models\Department;
use App\Models\Leave;
use App\Models\LeaveApproval;
use App\Models\LeaveBalance;
use App\Models\LeaveType;
use App\Models\Office;
use App\Models\SubclaimType;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedOffices();
        $this->seedLeaveTypes();
        $this->seedClaimCategories();

        $users = $this->getUsers();
        $year = now()->year;

        $this->seedLeaveBalances($users, $year);
        $this->seedAttendanceLogs($users);
        $this->seedLeaveRequests($users);
        $this->seedClaims($users);
    }

    private function seedOffices(): void
    {
        $offices = [
            [
                'name' => 'HQ — Kuala Lumpur',
                'address' => 'Level 12, Menara Example, Jalan Ampang, 50450 Kuala Lumpur',
                'latitude' => 3.1569,
                'longitude' => 101.7123,
                'radius_meters' => 200,
                'is_active' => true,
                'timezone' => 'Asia/Kuala_Lumpur',
            ],
            [
                'name' => 'Branch — Penang',
                'address' => '88, Jalan Sultan Ahmad Shah, 10050 George Town, Penang',
                'latitude' => 5.4285,
                'longitude' => 100.3147,
                'radius_meters' => 150,
                'is_active' => true,
                'timezone' => 'Asia/Kuala_Lumpur',
            ],
        ];

        foreach ($offices as $office) {
            Office::firstOrCreate(['name' => $office['name']], $office);
        }
    }

    private function seedLeaveTypes(): void
    {
        $types = [
            [
                'name' => 'Annual Leave',
                'key' => 'annual',
                'description' => 'Paid annual leave entitlement',
                'annual_quota' => 16,
                'requires_attachment' => false,
                'approval_chain' => [['role' => 'hod'], ['role' => 'hr_admin']],
            ],
            [
                'name' => 'Medical Leave',
                'key' => 'medical',
                'description' => 'Sick leave with medical certificate',
                'annual_quota' => 14,
                'requires_attachment' => true,
                'approval_chain' => [['role' => 'hod']],
            ],
            [
                'name' => 'Unpaid Leave',
                'key' => 'unpaid',
                'description' => 'Leave without pay',
                'annual_quota' => null,
                'requires_attachment' => false,
                'approval_chain' => [['role' => 'hod'], ['role' => 'hr_admin'], ['role' => 'top_management']],
            ],
        ];

        foreach ($types as $type) {
            LeaveType::firstOrCreate(['key' => $type['key']], $type);
        }
    }

    private function seedClaimCategories(): void
    {
        $categories = [
            ['name' => 'Transport & Travel', 'budget' => 5000.00, 'spent' => 0, 'period_start' => now()->startOfYear(), 'period_end' => now()->endOfYear()],
            ['name' => 'Meals & Entertainment', 'budget' => 3000.00, 'spent' => 0, 'period_start' => now()->startOfYear(), 'period_end' => now()->endOfYear()],
            ['name' => 'Office Supplies', 'budget' => 2000.00, 'spent' => 0, 'period_start' => now()->startOfYear(), 'period_end' => now()->endOfYear()],
        ];

        foreach ($categories as $cat) {
            ClaimCategory::firstOrCreate(['name' => $cat['name']], $cat);
        }

        $claimTypes = [
            ['key' => 'receipt', 'label' => 'Receipt Claim', 'description' => 'Standard receipt-based reimbursement', 'icon' => 'receipt', 'color' => '#3B82F6', 'sort_order' => 1, 'is_active' => true],
            ['key' => 'mileage', 'label' => 'Mileage Claim', 'description' => 'Vehicle mileage reimbursement', 'icon' => 'car', 'color' => '#10B981', 'sort_order' => 2, 'is_active' => true],
            ['key' => 'business-travel', 'label' => 'Business Travel', 'description' => 'Outstation and business trips', 'icon' => 'plane', 'color' => '#8B5CF6', 'sort_order' => 3, 'is_active' => true],
        ];

        foreach ($claimTypes as $ct) {
            ClaimType::firstOrCreate(['key' => $ct['key']], $ct);
        }
    }

    private function getUsers(): array
    {
        return [
            'top_mgmt' => User::where('email', 'topm@gmail.com')->first(),
            'hr' => User::where('email', 'hr@gmail.com')->first(),
            'finance_hod' => User::where('email', 'finance@gmail.com')->first(),
            'it_hod' => User::where('email', 'hod@gmail.com')->first(),
            'alice' => User::where('email', 'alice@gmail.com')->first(),
            'bob' => User::where('email', 'bob@gmail.com')->first(),
        ];
    }

    private function seedLeaveBalances(array $users, int $year): void
    {
        $leaveTypes = LeaveType::whereNotNull('annual_quota')->get();

        foreach ($users as $user) {
            if (!$user) continue;
            foreach ($leaveTypes as $lt) {
                LeaveBalance::firstOrCreate(
                    ['user_id' => $user->id, 'leave_type_id' => $lt->id, 'year' => $year],
                    ['annual_quota' => $lt->annual_quota, 'used' => 0, 'pending' => 0, 'adjustment' => 0]
                );
            }
        }
    }

    private function seedAttendanceLogs(array $users): void
    {
        if (AttendanceLog::where('notes', 'demo-seed')->exists()) return;

        $office = Office::first();
        if (!$office) return;

        $staffUsers = array_filter([$users['alice'], $users['bob'], $users['it_hod'], $users['finance_hod']]);
        $today = now()->startOfDay();

        foreach ($staffUsers as $user) {
            for ($i = 30; $i >= 1; $i--) {
                $day = $today->copy()->subDays($i);
                if ($day->isWeekend()) continue;

                $clockIn = $day->copy()->setTime(rand(8, 9), rand(0, 45));
                $clockOut = $day->copy()->setTime(rand(17, 18), rand(0, 30));

                AttendanceLog::create([
                    'user_id' => $user->id,
                    'office_id' => $office->id,
                    'type' => 'clock_in',
                    'status' => 'completed',
                    'timestamp' => $clockIn,
                    'latitude' => $office->latitude + (rand(-10, 10) / 10000),
                    'longitude' => $office->longitude + (rand(-10, 10) / 10000),
                    'distance_meters' => rand(5, 150),
                    'notes' => 'demo-seed',
                ]);

                AttendanceLog::create([
                    'user_id' => $user->id,
                    'office_id' => $office->id,
                    'type' => 'clock_out',
                    'status' => 'completed',
                    'timestamp' => $clockOut,
                    'latitude' => $office->latitude + (rand(-10, 10) / 10000),
                    'longitude' => $office->longitude + (rand(-10, 10) / 10000),
                    'distance_meters' => rand(5, 150),
                    'notes' => 'demo-seed',
                ]);
            }
        }
    }

    private function seedLeaveRequests(array $users): void
    {
        if (Leave::where('reason', 'LIKE', '%[demo]%')->exists()) return;

        $annual = LeaveType::where('key', 'annual')->first();
        $medical = LeaveType::where('key', 'medical')->first();
        if (!$annual || !$medical) return;

        $alice = $users['alice'];
        $bob = $users['bob'];
        $itHod = $users['it_hod'];
        $hr = $users['hr'];

        if (!$alice || !$bob) return;

        $leaves = [
            // Approved annual leave — Alice
            [
                'user' => $alice,
                'leave_type_id' => $annual->id,
                'start_date' => now()->subDays(20),
                'end_date' => now()->subDays(18),
                'day_type' => 'full',
                'reason' => 'Family vacation [demo]',
                'status' => Leave::STATUS_APPROVED,
                'approvals' => [
                    ['level' => 1, 'step_kind' => 'dept_hod', 'status' => 'approved', 'approver' => $itHod],
                    ['level' => 2, 'step_kind' => 'hr_admin', 'status' => 'approved', 'approver' => $hr],
                ],
            ],
            // Pending L1 annual leave — Bob
            [
                'user' => $bob,
                'leave_type_id' => $annual->id,
                'start_date' => now()->addDays(5),
                'end_date' => now()->addDays(7),
                'day_type' => 'full',
                'reason' => 'Personal matters [demo]',
                'status' => Leave::STATUS_PENDING_L1,
                'approvals' => [
                    ['level' => 1, 'step_kind' => 'dept_hod', 'status' => 'pending', 'approver' => null],
                    ['level' => 2, 'step_kind' => 'hr_admin', 'status' => 'pending', 'approver' => null],
                ],
            ],
            // Pending L2 — Alice (HOD approved, waiting HR)
            [
                'user' => $alice,
                'leave_type_id' => $annual->id,
                'start_date' => now()->addDays(10),
                'end_date' => now()->addDays(11),
                'day_type' => 'full',
                'reason' => 'Wedding ceremony [demo]',
                'status' => Leave::STATUS_PENDING_L2,
                'approvals' => [
                    ['level' => 1, 'step_kind' => 'dept_hod', 'status' => 'approved', 'approver' => $itHod],
                    ['level' => 2, 'step_kind' => 'hr_admin', 'status' => 'pending', 'approver' => null],
                ],
            ],
            // Rejected — Bob
            [
                'user' => $bob,
                'leave_type_id' => $annual->id,
                'start_date' => now()->subDays(5),
                'end_date' => now()->subDays(4),
                'day_type' => 'full',
                'reason' => 'Short trip [demo]',
                'status' => Leave::STATUS_REJECTED,
                'approvals' => [
                    ['level' => 1, 'step_kind' => 'dept_hod', 'status' => 'rejected', 'approver' => $itHod, 'rejection_reason' => 'Team deadline conflict'],
                ],
            ],
            // Approved medical — Alice (half day)
            [
                'user' => $alice,
                'leave_type_id' => $medical->id,
                'start_date' => now()->subDays(10),
                'end_date' => now()->subDays(10),
                'day_type' => 'am',
                'reason' => 'Dental appointment [demo]',
                'status' => Leave::STATUS_APPROVED,
                'approvals' => [
                    ['level' => 1, 'step_kind' => 'dept_hod', 'status' => 'approved', 'approver' => $itHod],
                ],
            ],
            // Pending medical — Bob
            [
                'user' => $bob,
                'leave_type_id' => $medical->id,
                'start_date' => now()->addDays(2),
                'end_date' => now()->addDays(2),
                'day_type' => 'full',
                'reason' => 'Health checkup [demo]',
                'status' => Leave::STATUS_PENDING_L1,
                'approvals' => [
                    ['level' => 1, 'step_kind' => 'dept_hod', 'status' => 'pending', 'approver' => null],
                ],
            ],
            // Cancelled — Alice
            [
                'user' => $alice,
                'leave_type_id' => $annual->id,
                'start_date' => now()->addDays(15),
                'end_date' => now()->addDays(16),
                'day_type' => 'full',
                'reason' => 'Plans changed [demo]',
                'status' => Leave::STATUS_CANCELLED,
                'approvals' => [],
            ],
            // Approved annual — Bob (past)
            [
                'user' => $bob,
                'leave_type_id' => $annual->id,
                'start_date' => now()->subDays(30),
                'end_date' => now()->subDays(28),
                'day_type' => 'full',
                'reason' => 'Hari Raya celebration [demo]',
                'status' => Leave::STATUS_APPROVED,
                'approvals' => [
                    ['level' => 1, 'step_kind' => 'dept_hod', 'status' => 'approved', 'approver' => $itHod],
                    ['level' => 2, 'step_kind' => 'hr_admin', 'status' => 'approved', 'approver' => $hr],
                ],
            ],
        ];

        foreach ($leaves as $data) {
            $leave = Leave::create([
                'user_id' => $data['user']->id,
                'leave_type_id' => $data['leave_type_id'],
                'start_date' => $data['start_date'],
                'end_date' => $data['end_date'],
                'day_type' => $data['day_type'],
                'reason' => $data['reason'],
                'status' => $data['status'],
            ]);

            foreach ($data['approvals'] as $approval) {
                LeaveApproval::create([
                    'leave_id' => $leave->id,
                    'level' => $approval['level'],
                    'step_kind' => $approval['step_kind'],
                    'status' => $approval['status'],
                    'eligible_approver_ids' => $approval['approver'] ? [$approval['approver']->id] : ($itHod ? [$itHod->id] : []),
                    'approver_id' => $approval['approver']?->id,
                    'decided_at' => $approval['approver'] ? now()->subDays(rand(1, 5)) : null,
                    'rejection_reason' => $approval['rejection_reason'] ?? null,
                ]);
            }
        }

        // Update leave balances for approved leaves
        if ($alice) {
            LeaveBalance::where('user_id', $alice->id)
                ->where('leave_type_id', $annual->id)
                ->where('year', now()->year)
                ->update(['used' => 3.5, 'pending' => 2]);
        }
        if ($bob) {
            LeaveBalance::where('user_id', $bob->id)
                ->where('leave_type_id', $annual->id)
                ->where('year', now()->year)
                ->update(['used' => 3, 'pending' => 3]);
        }
    }

    private function seedClaims(array $users): void
    {
        if (Claim::where('title', 'LIKE', '%[demo]%')->exists()) return;

        $alice = $users['alice'];
        $bob = $users['bob'];
        $itHod = $users['it_hod'];
        $hr = $users['hr'];
        $financeHod = $users['finance_hod'];

        if (!$alice || !$bob) return;

        $transportCat = ClaimCategory::where('name', 'Transport & Travel')->first();
        $mealsCat = ClaimCategory::where('name', 'Meals & Entertainment')->first();
        $officeCat = ClaimCategory::where('name', 'Office Supplies')->first();

        $receiptType = ClaimType::where('key', 'receipt')->first();
        $mileageType = ClaimType::where('key', 'mileage')->first();

        if (!$transportCat || !$receiptType) return;

        $claims = [
            // Draft — Alice
            ['user' => $alice, 'category' => $mealsCat, 'claim_type' => $receiptType, 'type' => 'receipt', 'title' => 'Client lunch [demo]', 'amount' => 85.50, 'status' => Claim::STATUS_DRAFT, 'current_level' => null, 'days_ago' => 1, 'approvals' => []],
            // Pending L1 — Bob
            ['user' => $bob, 'category' => $transportCat, 'claim_type' => $receiptType, 'type' => 'receipt', 'title' => 'Grab to client site [demo]', 'amount' => 45.00, 'status' => Claim::STATUS_PENDING_L1, 'current_level' => 1, 'days_ago' => 3, 'approvals' => [
                ['level' => 1, 'step_kind' => 'dept_hod', 'status' => 'pending'],
                ['level' => 2, 'step_kind' => 'hr_hod', 'status' => 'pending'],
            ]],
            // Pending L2 — Alice (HOD approved)
            ['user' => $alice, 'category' => $transportCat, 'claim_type' => $mileageType, 'type' => 'mileage', 'title' => 'Site visit mileage [demo]', 'amount' => 126.00, 'status' => Claim::STATUS_PENDING_L2, 'current_level' => 2, 'days_ago' => 7, 'approvals' => [
                ['level' => 1, 'step_kind' => 'dept_hod', 'status' => 'approved', 'approver' => $itHod],
                ['level' => 2, 'step_kind' => 'hr_hod', 'status' => 'pending'],
            ]],
            // Pending L3 — Bob (HOD + HR approved)
            ['user' => $bob, 'category' => $mealsCat, 'claim_type' => $receiptType, 'type' => 'receipt', 'title' => 'Team dinner [demo]', 'amount' => 350.00, 'status' => Claim::STATUS_PENDING_L3, 'current_level' => 3, 'days_ago' => 10, 'approvals' => [
                ['level' => 1, 'step_kind' => 'dept_hod', 'status' => 'approved', 'approver' => $itHod],
                ['level' => 2, 'step_kind' => 'hr_hod', 'status' => 'approved', 'approver' => $hr],
                ['level' => 3, 'step_kind' => 'top_management', 'status' => 'pending'],
            ]],
            // Approved — Alice
            ['user' => $alice, 'category' => $officeCat, 'claim_type' => $receiptType, 'type' => 'receipt', 'title' => 'Monitor stand purchase [demo]', 'amount' => 189.90, 'status' => Claim::STATUS_APPROVED, 'current_level' => null, 'days_ago' => 15, 'approvals' => [
                ['level' => 1, 'step_kind' => 'dept_hod', 'status' => 'approved', 'approver' => $itHod],
                ['level' => 2, 'step_kind' => 'hr_hod', 'status' => 'approved', 'approver' => $hr],
            ]],
            // Approved — Bob
            ['user' => $bob, 'category' => $transportCat, 'claim_type' => $receiptType, 'type' => 'receipt', 'title' => 'Parking fees [demo]', 'amount' => 30.00, 'status' => Claim::STATUS_APPROVED, 'current_level' => null, 'days_ago' => 20, 'approvals' => [
                ['level' => 1, 'step_kind' => 'dept_hod', 'status' => 'approved', 'approver' => $itHod],
                ['level' => 2, 'step_kind' => 'hr_hod', 'status' => 'approved', 'approver' => $hr],
            ]],
            // Rejected — Alice
            ['user' => $alice, 'category' => $mealsCat, 'claim_type' => $receiptType, 'type' => 'receipt', 'title' => 'Personal lunch [demo]', 'amount' => 25.00, 'status' => Claim::STATUS_REJECTED, 'current_level' => null, 'days_ago' => 12, 'approvals' => [
                ['level' => 1, 'step_kind' => 'dept_hod', 'status' => 'rejected', 'approver' => $itHod, 'rejection_reason' => 'Not a business expense'],
            ]],
            // Paid — Bob
            ['user' => $bob, 'category' => $transportCat, 'claim_type' => $mileageType, 'type' => 'mileage', 'title' => 'Client visit KL-Putrajaya [demo]', 'amount' => 52.50, 'status' => Claim::STATUS_PAID, 'current_level' => null, 'days_ago' => 25, 'approvals' => [
                ['level' => 1, 'step_kind' => 'dept_hod', 'status' => 'approved', 'approver' => $itHod],
                ['level' => 2, 'step_kind' => 'hr_hod', 'status' => 'approved', 'approver' => $hr],
                ['level' => 3, 'step_kind' => 'finance_hod', 'status' => 'approved', 'approver' => $financeHod],
            ]],
            // Pending L1 — Alice (recent)
            ['user' => $alice, 'category' => $transportCat, 'claim_type' => $receiptType, 'type' => 'receipt', 'title' => 'Toll charges [demo]', 'amount' => 18.60, 'status' => Claim::STATUS_PENDING_L1, 'current_level' => 1, 'days_ago' => 2, 'approvals' => [
                ['level' => 1, 'step_kind' => 'dept_hod', 'status' => 'pending'],
                ['level' => 2, 'step_kind' => 'hr_hod', 'status' => 'pending'],
            ]],
            // Approved mileage — Alice
            ['user' => $alice, 'category' => $transportCat, 'claim_type' => $mileageType, 'type' => 'mileage', 'title' => 'Office to warehouse [demo]', 'amount' => 35.00, 'status' => Claim::STATUS_APPROVED, 'current_level' => null, 'days_ago' => 18, 'approvals' => [
                ['level' => 1, 'step_kind' => 'dept_hod', 'status' => 'approved', 'approver' => $itHod],
                ['level' => 2, 'step_kind' => 'hr_hod', 'status' => 'approved', 'approver' => $hr],
            ]],
        ];

        foreach ($claims as $data) {
            $claim = Claim::create([
                'user_id' => $data['user']->id,
                'category_id' => $data['category']?->id,
                'claim_type_id' => $data['claim_type']?->id,
                'type' => $data['type'],
                'title' => $data['title'],
                'amount' => $data['amount'],
                'claim_date' => now()->subDays($data['days_ago']),
                'status' => $data['status'],
                'current_level' => $data['current_level'],
                'paid_at' => $data['status'] === Claim::STATUS_PAID ? now()->subDays($data['days_ago'] - 2) : null,
            ]);

            foreach ($data['approvals'] as $approval) {
                $approver = $approval['approver'] ?? null;
                ClaimApproval::create([
                    'claim_id' => $claim->id,
                    'level' => $approval['level'],
                    'step_kind' => $approval['step_kind'],
                    'status' => $approval['status'],
                    'eligible_approver_ids' => $this->getEligibleApproverIds($approval['step_kind'], $users),
                    'approver_id' => $approver?->id,
                    'decided_at' => $approver ? now()->subDays(rand(1, 5)) : null,
                    'rejection_reason' => $approval['rejection_reason'] ?? null,
                ]);
            }
        }

        // Update category spent amounts
        $transportCat?->update(['spent' => Claim::where('category_id', $transportCat->id)->whereIn('status', ['approved', 'paid'])->sum('amount')]);
        $mealsCat?->update(['spent' => Claim::where('category_id', $mealsCat->id)->whereIn('status', ['approved', 'paid'])->sum('amount')]);
        $officeCat?->update(['spent' => Claim::where('category_id', $officeCat->id)->whereIn('status', ['approved', 'paid'])->sum('amount')]);
    }

    private function getEligibleApproverIds(string $stepKind, array $users): array
    {
        return match ($stepKind) {
            'dept_hod' => array_filter([$users['it_hod']?->id]),
            'hr_hod', 'hr_admin' => array_filter([$users['hr']?->id]),
            'top_management' => array_filter([$users['top_mgmt']?->id]),
            'finance_hod' => array_filter([$users['finance_hod']?->id]),
            default => [],
        };
    }
}
