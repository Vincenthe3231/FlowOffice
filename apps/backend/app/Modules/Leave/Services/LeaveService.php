<?php

namespace App\Modules\Leave\Services;

use App\Models\Leave;
use App\Models\LeaveApproval;
use App\Models\LeaveBalance;
use App\Models\LeaveType;
use App\Models\User;
use App\Modules\Shared\Contracts\LeaveServiceInterface;
use App\Modules\Shared\Events\EmergencyLeaveSubmitted;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class LeaveService implements LeaveServiceInterface
{
    public function __construct(
        private LeaveApprovalChainResolver $chainResolver
    ) {}

    public function index(User $user, array $filters = []): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 15);
        $perPage = $perPage >= 1 && $perPage <= 100 ? $perPage : 15;

        $query = Leave::query()
            ->where('user_id', $user->id)
            ->with(['leaveType', 'attachments', 'user:id,name,email'])
            ->orderByDesc('created_at');

        if (! empty($filters['status'])) {
            $pendingGroup = [Leave::STATUS_PENDING, Leave::STATUS_PENDING_L1, Leave::STATUS_PENDING_L2, Leave::STATUS_PENDING_L3];
            if ($filters['status'] === Leave::STATUS_PENDING) {
                $query->whereIn('status', $pendingGroup);
            } else {
                $query->where('status', $filters['status']);
            }
        }
        if (! empty($filters['leave_type_id'])) {
            $query->where('leave_type_id', $filters['leave_type_id']);
        }

        return $query->paginate($perPage);
    }

    public function store(User $user, array $data): Leave
    {
        $leaveType = LeaveType::findOrFail($data['leave_type_id']);

        $isEmergency = $leaveType->key === 'emergency';

        return DB::transaction(function () use ($user, $data, $leaveType, $isEmergency) {
            // For emergency leave, store an SLA deadline in metadata (1-hour SLA)
            $metadata = null;
            if ($isEmergency) {
                $slaDeadline = now()->addHour()->toIso8601String();
                $metadata = ['sla_deadline' => $slaDeadline];
            }

            $leave = Leave::create([
                'user_id' => $user->id,
                'leave_type_id' => $data['leave_type_id'],
                'start_date' => $data['start_date'],
                'end_date' => $data['end_date'] ?? $data['start_date'],
                'day_type' => $data['day_type'] ?? 'full',
                'reason' => $data['reason'],
                'status' => Leave::STATUS_PENDING_L1,
                'metadata' => $metadata,
            ]);

            $duration = $leave->durationDays();

            $this->adjustBalance($user->id, $leaveType->id, 'pending', $duration);

            $steps = $this->chainResolver->buildSteps($user, $leaveType, $duration);
            foreach ($steps as $step) {
                LeaveApproval::create([
                    'leave_id' => $leave->id,
                    'level' => $step['level'],
                    'step_kind' => $step['step_kind'],
                    'status' => LeaveApproval::STATUS_PENDING,
                    'eligible_approver_ids' => $step['eligible_approver_ids'],
                ]);
            }

            $eventName = $isEmergency ? 'emergency_submitted' : 'submitted';
            $logMessage = $isEmergency
                ? "Emergency leave submitted: {$leaveType->name} ({$data['start_date']})"
                : "Leave submitted: {$leaveType->name} ({$data['start_date']} – {$data['end_date']})";

            $activityProps = [
                'attributes' => [
                    'status' => Leave::STATUS_PENDING_L1,
                    'leave_type' => $leaveType->name,
                    'start_date' => $data['start_date'],
                    'end_date' => $data['end_date'] ?? $data['start_date'],
                    'duration' => $duration,
                    'is_emergency' => $isEmergency,
                ],
                'module' => 'leave',
                'ip' => request()->ip(),
            ];

            if ($isEmergency && $metadata) {
                $activityProps['attributes']['sla_deadline'] = $metadata['sla_deadline'];
            }

            activity('leave')
                ->event($eventName)
                ->performedOn($leave)
                ->causedBy($user)
                ->withProperties($activityProps)
                ->log($logMessage);

            // Fire domain event so HR listeners can send read-only notifications
            if ($isEmergency && $metadata) {
                EmergencyLeaveSubmitted::dispatch(
                    $leave->id,
                    $user->id,
                    $data['start_date'],
                    $metadata['sla_deadline']
                );
            }

            return $leave->load(['leaveType', 'attachments', 'leaveApprovals']);
        });
    }

    public function show(Leave $leave): Leave
    {
        return $leave->load([
            'leaveType',
            'attachments',
            'leaveApprovals.approver',
            'user:id,name,email',
        ]);
    }

    public function cancel(Leave $leave, User $user): Leave
    {
        if (! in_array($leave->status, Leave::pendingPipelineStatuses(), true)) {
            throw new \InvalidArgumentException('Only pending leave requests can be cancelled.');
        }

        return DB::transaction(function () use ($leave) {
            $duration = $leave->durationDays();
            $leave->update(['status' => Leave::STATUS_CANCELLED]);

            $this->adjustBalance($leave->user_id, $leave->leave_type_id, 'pending', -$duration);

            return $leave->fresh(['leaveType', 'attachments', 'leaveApprovals']);
        });
    }

    public function approve(User $approver, Leave $leave, ?int $level = null): Leave
    {
        $leave->load('leaveApprovals');

        $totalLevels = $leave->leaveApprovals->count();
        $currentLevel = $level ?? $this->chainResolver->currentLevelFromStatus($leave->status);

        if ($currentLevel === null) {
            throw new \InvalidArgumentException('Leave is not in a pending approval state.');
        }

        $row = $leave->leaveApprovals->firstWhere('level', $currentLevel);
        if ($row === null || $row->status !== LeaveApproval::STATUS_PENDING) {
            throw new \InvalidArgumentException('This approval step is not pending.');
        }

        return DB::transaction(function () use ($approver, $leave, $row, $currentLevel, $totalLevels) {
            $row->update([
                'status' => LeaveApproval::STATUS_APPROVED,
                'approver_id' => $approver->id,
                'decided_at' => now(),
            ]);

            $fromStatus = $leave->status;

            if ($currentLevel >= $totalLevels) {
                $duration = $leave->durationDays();
                $leave->update(['status' => Leave::STATUS_APPROVED]);

                $this->adjustBalance($leave->user_id, $leave->leave_type_id, 'pending', -$duration);
                $this->adjustBalance($leave->user_id, $leave->leave_type_id, 'used', $duration);

                activity('leave')
                    ->event('approved')
                    ->performedOn($leave)
                    ->causedBy($approver)
                    ->withProperties([
                        'old' => ['status' => $fromStatus],
                        'attributes' => ['status' => Leave::STATUS_APPROVED, 'level' => $currentLevel],
                        'module' => 'leave',
                        'ip' => request()->ip(),
                    ])
                    ->log("Leave approved: {$leave->leaveType?->name}");
            } else {
                $next = $this->chainResolver->pendingStatusForLevel($currentLevel + 1);
                $leave->update(['status' => $next]);

                activity('leave')
                    ->event('approved')
                    ->performedOn($leave)
                    ->causedBy($approver)
                    ->withProperties([
                        'old' => ['status' => $fromStatus],
                        'attributes' => ['status' => $next, 'level' => $currentLevel],
                        'module' => 'leave',
                        'ip' => request()->ip(),
                    ])
                    ->log("Leave approved at level {$currentLevel}: {$leave->leaveType?->name}");
            }

            return $leave->fresh(['leaveType', 'attachments', 'leaveApprovals.approver']);
        });
    }

    public function reject(User $rejector, Leave $leave, string $reason, ?int $level = null): Leave
    {
        $leave->load('leaveApprovals');

        $currentLevel = $level ?? $this->chainResolver->currentLevelFromStatus($leave->status);
        if ($currentLevel === null) {
            throw new \InvalidArgumentException('Leave is not in a pending approval state.');
        }

        $row = $leave->leaveApprovals->firstWhere('level', $currentLevel);
        if ($row === null || $row->status !== LeaveApproval::STATUS_PENDING) {
            throw new \InvalidArgumentException('This approval step is not pending.');
        }

        return DB::transaction(function () use ($rejector, $leave, $reason, $row) {
            $fromStatus = $leave->status;
            $duration = $leave->durationDays();
            $row->update([
                'status' => LeaveApproval::STATUS_REJECTED,
                'approver_id' => $rejector->id,
                'decided_at' => now(),
                'rejection_reason' => $reason,
            ]);

            $leave->update(['status' => Leave::STATUS_REJECTED]);

            $this->adjustBalance($leave->user_id, $leave->leave_type_id, 'pending', -$duration);

            activity('leave')
                ->event('rejected')
                ->performedOn($leave)
                ->causedBy($rejector)
                ->withProperties([
                    'old' => ['status' => $fromStatus],
                    'attributes' => ['status' => Leave::STATUS_REJECTED, 'reason' => $reason],
                    'module' => 'leave',
                    'ip' => request()->ip(),
                ])
                ->log("Leave rejected: {$leave->leaveType?->name}");

            return $leave->fresh(['leaveType', 'attachments', 'leaveApprovals.approver']);
        });
    }

    public function allLeaves(User $requestingUser, array $filters = []): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 15);
        $perPage = $perPage >= 1 && $perPage <= 200 ? $perPage : 15;

        $query = Leave::query()
            ->with(['leaveType', 'attachments', 'user:id,name,email', 'leaveApprovals'])
            ->orderByDesc('created_at');

        if (! empty($filters['status'])) {
            $pendingGroup = [Leave::STATUS_PENDING, Leave::STATUS_PENDING_L1, Leave::STATUS_PENDING_L2, Leave::STATUS_PENDING_L3];
            if ($filters['status'] === Leave::STATUS_PENDING) {
                $query->whereIn('status', $pendingGroup);
            } else {
                $query->where('status', $filters['status']);
            }
        }

        return $query->paginate($perPage);
    }

    public function pendingApprovals(User $user): LengthAwarePaginator
    {
        $user->loadMissing('roles', 'department');

        $query = Leave::query()
            ->whereIn('status', Leave::pendingPipelineStatuses())
            ->with(['leaveType', 'user:id,name,email', 'leaveApprovals'])
            ->whereHas('leaveApprovals', function (Builder $q) use ($user) {
                $q->where('status', LeaveApproval::STATUS_PENDING);

                $q->where(function (Builder $inner) use ($user) {
                    $inner->whereJsonContains('eligible_approver_ids', $user->id);

                    if ($user->hasRole('top_management')) {
                        $inner->orWhere('step_kind', LeaveApproval::STEP_TOP_MANAGEMENT);
                    }
                    if ($user->hasRole('hr_admin')) {
                        $inner->orWhere('step_kind', LeaveApproval::STEP_HR_ADMIN);
                    }
                    if ($user->hasRole('hod') && $user->department_id !== null) {
                        $inner->orWhere(function (Builder $hodQ) use ($user) {
                            $hodQ->where('step_kind', LeaveApproval::STEP_DEPT_HOD)
                                ->whereHas('leave.user', fn ($uq) => $uq->where('department_id', $user->department_id));
                        });
                    }
                });
            })
            ->orderByDesc('created_at');

        return $query->paginate(50);
    }

    public function getBalance(int $userId, string $leaveType): int
    {
        $type = LeaveType::where('key', $leaveType)->first();
        if (! $type) {
            return 0;
        }

        $balance = LeaveBalance::where('user_id', $userId)
            ->where('leave_type_id', $type->id)
            ->where('year', now()->year)
            ->first();

        return $balance ? (int) $balance->remaining : $type->annual_quota;
    }

    public function hasSufficientBalance(int $userId, string $leaveType, int $days): bool
    {
        return $this->getBalance($userId, $leaveType) >= $days;
    }

    public function getUserBalances(int $userId): array
    {
        $year = now()->year;
        $types = LeaveType::all();
        $balances = LeaveBalance::where('user_id', $userId)
            ->where('year', $year)
            ->with('leaveType')
            ->get()
            ->keyBy('leave_type_id');

        return $types->map(function (LeaveType $type) use ($userId, $balances) {
            $balance = $balances->get($type->id);
            if (! $balance) {
                $balance = $this->getOrCreateBalance($userId, $type->id);
            }

            return $balance;
        })->values()->all();
    }

    public function grantOil(int $userId, float $days, string $reason): LeaveBalance
    {
        $oilType = LeaveType::where('key', 'oil')->first();
        if (! $oilType) {
            throw new \InvalidArgumentException('OIL leave type not configured.');
        }

        $balance = $this->getOrCreateBalance($userId, $oilType->id);
        $balance->increment('adjustment', $days);

        return $balance->fresh('leaveType');
    }

    private function adjustBalance(int $userId, int $leaveTypeId, string $column, float $amount): void
    {
        $balance = $this->getOrCreateBalance($userId, $leaveTypeId);

        if ($amount >= 0) {
            $balance->increment($column, $amount);
        } else {
            $balance->decrement($column, abs($amount));
        }
    }

    private function getOrCreateBalance(int $userId, int $leaveTypeId): LeaveBalance
    {
        $year = now()->year;
        $type = LeaveType::find($leaveTypeId);

        return LeaveBalance::firstOrCreate(
            ['user_id' => $userId, 'leave_type_id' => $leaveTypeId, 'year' => $year],
            ['annual_quota' => $type?->annual_quota ?? 0, 'used' => 0, 'pending' => 0, 'adjustment' => 0]
        );
    }
}
