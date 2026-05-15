<?php

namespace App\Modules\Leave\Services;

use App\Models\Leave;
use App\Models\LeaveApproval;
use App\Models\LeaveType;
use App\Models\User;

class LeaveApprovalChainResolver
{
    /**
     * Build approval steps from the leave type's approval_chain JSON config.
     *
     * @return list<array{level: int, step_kind: string, eligible_approver_ids: list<int>}>
     */
    public function buildSteps(User $submitter, LeaveType $leaveType, float $durationDays): array
    {
        $submitter->loadMissing('roles', 'department');

        $chain = $leaveType->approval_chain ?? [];
        $steps = [];

        foreach ($chain as $entry) {
            $role = $entry['role'] ?? 'hod';
            $steps[] = [
                'step_kind' => $this->roleToStepKind($role),
                'eligible_approver_ids' => $this->resolveApproverIds($role, $submitter),
            ];
        }

        if ($leaveType->duration_threshold !== null
            && $durationDays > $leaveType->duration_threshold
            && $leaveType->duration_threshold_role !== null) {
            $role = $leaveType->duration_threshold_role;
            $steps[] = [
                'step_kind' => $this->roleToStepKind($role),
                'eligible_approver_ids' => $this->resolveApproverIds($role, $submitter),
            ];
        }

        return $this->wrapLevels($steps);
    }

    private function roleToStepKind(string $role): string
    {
        return match ($role) {
            'hod' => LeaveApproval::STEP_DEPT_HOD,
            'hr_admin' => LeaveApproval::STEP_HR_ADMIN,
            'top_management' => LeaveApproval::STEP_TOP_MANAGEMENT,
            default => $role,
        };
    }

    /**
     * @return list<int>
     */
    private function resolveApproverIds(string $role, User $submitter): array
    {
        return match ($role) {
            'hod' => $this->departmentHodIds($submitter->department_id),
            'hr_admin' => $this->hrAdminIds(),
            'top_management' => $this->topManagementIds(),
            default => [],
        };
    }

    /**
     * @param  list<array{step_kind: string, eligible_approver_ids: list<int>}>  $steps
     * @return list<array{level: int, step_kind: string, eligible_approver_ids: list<int>}>
     */
    private function wrapLevels(array $steps): array
    {
        $out = [];
        $level = 1;
        foreach ($steps as $step) {
            $out[] = [
                'level' => $level,
                'step_kind' => $step['step_kind'],
                'eligible_approver_ids' => array_values(array_unique($step['eligible_approver_ids'])),
            ];
            $level++;
        }

        return $out;
    }

    public function currentLevelFromStatus(string $status): ?int
    {
        return match ($status) {
            Leave::STATUS_PENDING, Leave::STATUS_PENDING_L1 => 1,
            Leave::STATUS_PENDING_L2 => 2,
            Leave::STATUS_PENDING_L3 => 3,
            default => null,
        };
    }

    public function pendingStatusForLevel(int $level): string
    {
        return match ($level) {
            1 => Leave::STATUS_PENDING_L1,
            2 => Leave::STATUS_PENDING_L2,
            3 => Leave::STATUS_PENDING_L3,
            default => Leave::STATUS_PENDING_L1,
        };
    }

    /**
     * @return list<int>
     */
    private function departmentHodIds(?int $departmentId): array
    {
        if ($departmentId === null) {
            return [];
        }

        return User::query()
            ->where('department_id', $departmentId)
            ->whereHas('roles', fn ($q) => $q->where('name', 'hod')->where('guard_name', 'sanctum'))
            ->pluck('id')
            ->all();
    }

    /**
     * @return list<int>
     */
    private function hrAdminIds(): array
    {
        return User::query()
            ->whereHas('roles', fn ($q) => $q->where('name', 'hr_admin')->where('guard_name', 'sanctum'))
            ->pluck('id')
            ->all();
    }

    /**
     * @return list<int>
     */
    private function topManagementIds(): array
    {
        return User::query()
            ->whereHas('roles', fn ($q) => $q->where('name', 'top_management')->where('guard_name', 'sanctum'))
            ->orderBy('id')
            ->limit(3)
            ->pluck('id')
            ->all();
    }
}
