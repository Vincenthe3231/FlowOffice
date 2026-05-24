<?php

namespace App\Modules\Overtime\Services;

use App\Models\OvertimeApproval;
use App\Models\OvertimeRequest;
use App\Models\User;

class OvertimeApprovalChainResolver
{
    /**
     * Build approval steps for an overtime request.
     *
     * Normal (is_urgent=false): HOD → HR Admin (2 levels)
     * Urgent (is_urgent=true): HOD only (1 level, fast-track)
     *
     * @return list<array{level: int, step_kind: string, eligible_approver_ids: list<int>}>
     */
    public function buildSteps(User $submitter, bool $isUrgent): array
    {
        $submitter->loadMissing('roles', 'department');

        $chain = $isUrgent
            ? [['role' => 'hod']]
            : [['role' => 'hod'], ['role' => 'hr_admin']];

        $steps = [];
        foreach ($chain as $entry) {
            $role = $entry['role'];
            $steps[] = [
                'step_kind' => $this->roleToStepKind($role),
                'eligible_approver_ids' => $this->resolveApproverIds($role, $submitter),
            ];
        }

        return $this->wrapLevels($steps);
    }

    public function currentLevelFromStatus(string $status): ?int
    {
        return match ($status) {
            OvertimeRequest::STATUS_PENDING_L1 => 1,
            OvertimeRequest::STATUS_PENDING_L2 => 2,
            default => null,
        };
    }

    public function pendingStatusForLevel(int $level): string
    {
        return match ($level) {
            1 => OvertimeRequest::STATUS_PENDING_L1,
            2 => OvertimeRequest::STATUS_PENDING_L2,
            default => OvertimeRequest::STATUS_PENDING_L1,
        };
    }

    private function roleToStepKind(string $role): string
    {
        return match ($role) {
            'hod' => OvertimeApproval::STEP_DEPT_HOD,
            'hr_admin' => OvertimeApproval::STEP_HR_ADMIN,
            'top_management' => OvertimeApproval::STEP_TOP_MANAGEMENT,
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

    /**
     * @return list<int>
     */
    private function departmentHodIds(?int $deptId): array
    {
        if ($deptId === null) {
            return [];
        }

        return User::query()
            ->where('department_id', $deptId)
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
            ->pluck('id')
            ->all();
    }
}
