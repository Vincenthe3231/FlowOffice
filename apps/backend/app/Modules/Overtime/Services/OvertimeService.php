<?php

namespace App\Modules\Overtime\Services;

use App\Models\OvertimeApproval;
use App\Models\OvertimeRequest;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class OvertimeService
{
    public function __construct(
        private OvertimeApprovalChainResolver $chainResolver
    ) {}

    public function index(User $user, array $filters = []): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 15);
        $perPage = $perPage >= 1 && $perPage <= 100 ? $perPage : 15;

        $query = OvertimeRequest::query()->orderByDesc('created_at');

        if ($user->hasRole('top_management') || $user->hasRole('hr_admin')) {
            // See all requests
        } elseif ($user->hasRole('hod') && $user->department_id !== null) {
            // HOD sees their department's requests
            $query->whereHas('user', fn ($q) => $q->where('department_id', $user->department_id));
        } else {
            // Staff see only their own
            $query->where('user_id', $user->id);
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        return $query->with(['user:id,name,email', 'overtimeApprovals'])->paginate($perPage);
    }

    public function store(User $user, array $data): OvertimeRequest
    {
        return DB::transaction(function () use ($user, $data) {
            $isUrgent = (bool) ($data['is_urgent'] ?? false);

            $metadata = null;
            if ($isUrgent) {
                $metadata = ['sla_deadline' => now()->addHours(2)->toIso8601String()];
            }

            $request = OvertimeRequest::create([
                'user_id' => $user->id,
                'date' => $data['date'],
                'start_time' => $data['start_time'],
                'end_time' => $data['end_time'],
                'reason' => $data['reason'],
                'is_urgent' => $isUrgent,
                'urgency_reason' => $data['urgency_reason'] ?? null,
                'status' => OvertimeRequest::STATUS_PENDING_L1,
                'metadata' => $metadata,
            ]);

            $steps = $this->chainResolver->buildSteps($user, $isUrgent);
            foreach ($steps as $step) {
                OvertimeApproval::create([
                    'overtime_request_id' => $request->id,
                    'level' => $step['level'],
                    'step_kind' => $step['step_kind'],
                    'status' => OvertimeApproval::STATUS_PENDING,
                    'eligible_approver_ids' => $step['eligible_approver_ids'],
                ]);
            }

            activity('overtime')
                ->event('submitted')
                ->performedOn($request)
                ->causedBy($user)
                ->withProperties([
                    'attributes' => [
                        'status' => OvertimeRequest::STATUS_PENDING_L1,
                        'date' => $data['date'],
                        'start_time' => $data['start_time'],
                        'end_time' => $data['end_time'],
                        'is_urgent' => $isUrgent,
                        'duration_hours' => $request->durationHours(),
                    ],
                    'module' => 'overtime',
                    'ip' => request()->ip(),
                ])
                ->log("Overtime submitted: {$data['date']} ({$data['start_time']} – {$data['end_time']})");

            return $request->load(['user:id,name,email', 'overtimeApprovals']);
        });
    }

    public function show(OvertimeRequest $request): OvertimeRequest
    {
        return $request->load([
            'user:id,name,email',
            'overtimeApprovals.approver',
            'approvedBy:id,name,email',
        ]);
    }

    public function approve(User $approver, OvertimeRequest $request): OvertimeRequest
    {
        $request->load('overtimeApprovals');

        $totalLevels = $request->overtimeApprovals->count();
        $currentLevel = $this->chainResolver->currentLevelFromStatus($request->status);

        if ($currentLevel === null) {
            throw new \InvalidArgumentException('Overtime request is not in a pending approval state.');
        }

        $row = $request->overtimeApprovals->firstWhere('level', $currentLevel);
        if ($row === null || $row->status !== OvertimeApproval::STATUS_PENDING) {
            throw new \InvalidArgumentException('This approval step is not pending.');
        }

        $eligibleIds = $row->eligible_approver_ids ?? [];
        if (! in_array($approver->id, $eligibleIds, true)) {
            throw new \InvalidArgumentException('You are not an eligible approver for this step.');
        }

        return DB::transaction(function () use ($approver, $request, $row, $currentLevel, $totalLevels) {
            $row->update([
                'status' => OvertimeApproval::STATUS_APPROVED,
                'approver_id' => $approver->id,
                'decided_at' => now(),
            ]);

            $fromStatus = $request->status;

            if ($currentLevel >= $totalLevels) {
                $request->update([
                    'status' => OvertimeRequest::STATUS_APPROVED,
                    'approved_by' => $approver->id,
                    'decided_at' => now(),
                ]);

                activity('overtime')
                    ->event('approved')
                    ->performedOn($request)
                    ->causedBy($approver)
                    ->withProperties([
                        'old' => ['status' => $fromStatus],
                        'attributes' => ['status' => OvertimeRequest::STATUS_APPROVED, 'level' => $currentLevel],
                        'module' => 'overtime',
                        'ip' => request()->ip(),
                    ])
                    ->log("Overtime approved: {$request->date}");
            } else {
                $next = $this->chainResolver->pendingStatusForLevel($currentLevel + 1);
                $request->update(['status' => $next]);

                activity('overtime')
                    ->event('approved')
                    ->performedOn($request)
                    ->causedBy($approver)
                    ->withProperties([
                        'old' => ['status' => $fromStatus],
                        'attributes' => ['status' => $next, 'level' => $currentLevel],
                        'module' => 'overtime',
                        'ip' => request()->ip(),
                    ])
                    ->log("Overtime approved at level {$currentLevel}: {$request->date}");
            }

            return $request->fresh(['user:id,name,email', 'overtimeApprovals.approver']);
        });
    }

    public function reject(User $rejector, OvertimeRequest $request, string $reason): OvertimeRequest
    {
        $request->load('overtimeApprovals');

        $currentLevel = $this->chainResolver->currentLevelFromStatus($request->status);
        if ($currentLevel === null) {
            throw new \InvalidArgumentException('Overtime request is not in a pending approval state.');
        }

        $row = $request->overtimeApprovals->firstWhere('level', $currentLevel);
        if ($row === null || $row->status !== OvertimeApproval::STATUS_PENDING) {
            throw new \InvalidArgumentException('This approval step is not pending.');
        }

        $eligibleIds = $row->eligible_approver_ids ?? [];
        if (! in_array($rejector->id, $eligibleIds, true)) {
            throw new \InvalidArgumentException('You are not an eligible approver for this step.');
        }

        return DB::transaction(function () use ($rejector, $request, $reason, $row) {
            $fromStatus = $request->status;

            $row->update([
                'status' => OvertimeApproval::STATUS_REJECTED,
                'approver_id' => $rejector->id,
                'decided_at' => now(),
                'rejection_reason' => $reason,
            ]);

            $request->update([
                'status' => OvertimeRequest::STATUS_REJECTED,
                'decided_at' => now(),
            ]);

            activity('overtime')
                ->event('rejected')
                ->performedOn($request)
                ->causedBy($rejector)
                ->withProperties([
                    'old' => ['status' => $fromStatus],
                    'attributes' => ['status' => OvertimeRequest::STATUS_REJECTED, 'reason' => $reason],
                    'module' => 'overtime',
                    'ip' => request()->ip(),
                ])
                ->log("Overtime rejected: {$request->date}");

            return $request->fresh(['user:id,name,email', 'overtimeApprovals.approver']);
        });
    }

    public function cancel(OvertimeRequest $request, User $user): OvertimeRequest
    {
        if (! in_array($request->status, OvertimeRequest::pendingPipelineStatuses(), true)) {
            throw new \InvalidArgumentException('Only pending overtime requests can be cancelled.');
        }

        $request->update(['status' => OvertimeRequest::STATUS_CANCELLED]);

        activity('overtime')
            ->event('cancelled')
            ->performedOn($request)
            ->causedBy($user)
            ->withProperties([
                'attributes' => ['status' => OvertimeRequest::STATUS_CANCELLED],
                'module' => 'overtime',
                'ip' => request()->ip(),
            ])
            ->log("Overtime cancelled: {$request->date}");

        return $request->fresh(['user:id,name,email', 'overtimeApprovals']);
    }

    public function allRequests(User $requestingUser, array $filters = []): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 15);
        $perPage = $perPage >= 1 && $perPage <= 200 ? $perPage : 15;

        $query = OvertimeRequest::query()
            ->with(['user:id,name,email', 'overtimeApprovals'])
            ->orderByDesc('created_at');

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        return $query->paginate($perPage);
    }

    public function pendingApprovals(User $user): LengthAwarePaginator
    {
        $user->loadMissing('roles', 'department');

        $query = OvertimeRequest::query()
            ->whereIn('status', OvertimeRequest::pendingPipelineStatuses())
            ->with(['user:id,name,email', 'overtimeApprovals'])
            ->whereHas('overtimeApprovals', function (Builder $q) use ($user) {
                $q->where('status', OvertimeApproval::STATUS_PENDING);

                $q->where(function (Builder $inner) use ($user) {
                    $inner->whereJsonContains('eligible_approver_ids', $user->id);

                    if ($user->hasRole('top_management')) {
                        $inner->orWhere('step_kind', OvertimeApproval::STEP_TOP_MANAGEMENT);
                    }
                    if ($user->hasRole('hr_admin')) {
                        $inner->orWhere('step_kind', OvertimeApproval::STEP_HR_ADMIN);
                    }
                    if ($user->hasRole('hod') && $user->department_id !== null) {
                        $inner->orWhere(function (Builder $hodQ) use ($user) {
                            $hodQ->where('step_kind', OvertimeApproval::STEP_DEPT_HOD)
                                ->whereHas('overtimeRequest.user', fn ($uq) => $uq->where('department_id', $user->department_id));
                        });
                    }
                });
            })
            ->orderByDesc('created_at');

        return $query->paginate(50);
    }
}
