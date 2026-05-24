<?php

namespace App\Modules\Shift\Services;

use App\Models\Shift;
use App\Models\User;
use App\Models\UserShift;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class ShiftService
{
    public function index(User $user, array $filters = []): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 15);
        $perPage = $perPage >= 1 && $perPage <= 100 ? $perPage : 15;

        $query = Shift::query()->with(['createdBy:id,name'])->orderBy('name');

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if ($user->hasRole('top_management') || $user->hasRole('hr_admin')) {
            // See all shifts
        } elseif ($user->hasRole('hod') && $user->department_id !== null) {
            // HOD sees shifts assigned to their department's users
            $query->whereHas('userShifts.user', fn ($q) => $q->where('department_id', $user->department_id));
        } else {
            // Staff sees only shifts they are assigned to
            $query->whereHas('userShifts', fn ($q) => $q->where('user_id', $user->id));
        }

        return $query->paginate($perPage);
    }

    public function store(array $data, User $creator): Shift
    {
        $shift = Shift::create([
            'name' => $data['name'],
            'code' => $data['code'],
            'start_time' => $data['start_time'],
            'end_time' => $data['end_time'],
            'color' => $data['color'] ?? null,
            'status' => Shift::STATUS_ACTIVE,
            'created_by' => $creator->id,
        ]);

        activity('shift')
            ->event('shift.created')
            ->performedOn($shift)
            ->causedBy($creator)
            ->withProperties([
                'attributes' => [
                    'name' => $shift->name,
                    'code' => $shift->code,
                    'start_time' => $shift->start_time,
                    'end_time' => $shift->end_time,
                ],
                'module' => 'shift',
                'ip' => request()->ip(),
            ])
            ->log("Shift created: {$shift->name} ({$shift->code})");

        return $shift->load('createdBy:id,name');
    }

    public function update(Shift $shift, array $data): Shift
    {
        $old = $shift->only(['name', 'code', 'start_time', 'end_time', 'color', 'status']);
        $shift->update($data);

        activity('shift')
            ->event('shift.updated')
            ->performedOn($shift)
            ->withProperties([
                'old' => $old,
                'input' => $data,
                'module' => 'shift',
                'ip' => request()->ip(),
            ])
            ->log("Shift updated: {$shift->name} ({$shift->code})");

        return $shift->fresh('createdBy:id,name');
    }

    public function deactivate(Shift $shift, User $actor): Shift
    {
        $shift->update(['status' => Shift::STATUS_INACTIVE]);

        activity('shift')
            ->event('shift.deactivated')
            ->performedOn($shift)
            ->causedBy($actor)
            ->withProperties([
                'attributes' => ['status' => Shift::STATUS_INACTIVE],
                'module' => 'shift',
                'ip' => request()->ip(),
            ])
            ->log("Shift deactivated: {$shift->name}");

        return $shift;
    }

    public function delete(Shift $shift, User $actor): void
    {
        activity('shift')
            ->event('shift.deleted')
            ->performedOn($shift)
            ->causedBy($actor)
            ->withProperties([
                'attributes' => ['name' => $shift->name, 'code' => $shift->code],
                'module' => 'shift',
                'ip' => request()->ip(),
            ])
            ->log("Shift deleted: {$shift->name}");

        $shift->delete();
    }

    public function getAssignments(Shift $shift, User $requestingUser, array $filters = []): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 15);
        $perPage = $perPage >= 1 && $perPage <= 100 ? $perPage : 15;

        $query = UserShift::query()
            ->where('shift_id', $shift->id)
            ->with(['user:id,name,email', 'assignedBy:id,name'])
            ->orderByDesc('effective_date');

        if (! empty($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        return $query->paginate($perPage);
    }

    public function assignUser(array $data, User $assigner): UserShift
    {
        $assignment = UserShift::create([
            'user_id' => $data['user_id'],
            'shift_id' => $data['shift_id'],
            'effective_date' => $data['effective_date'],
            'end_date' => $data['end_date'] ?? null,
            'assigned_by' => $assigner->id,
            'notes' => $data['notes'] ?? null,
        ]);

        activity('shift')
            ->event('shift.user_assigned')
            ->performedOn($assignment->shift)
            ->causedBy($assigner)
            ->withProperties([
                'attributes' => [
                    'user_id' => $data['user_id'],
                    'shift_id' => $data['shift_id'],
                    'effective_date' => $data['effective_date'],
                    'end_date' => $data['end_date'] ?? null,
                ],
                'module' => 'shift',
                'ip' => request()->ip(),
            ])
            ->log("User {$data['user_id']} assigned to shift {$data['shift_id']}");

        return $assignment->load(['user:id,name,email', 'shift', 'assignedBy:id,name']);
    }

    public function removeAssignment(UserShift $assignment, User $actor): void
    {
        activity('shift')
            ->event('shift.user_removed')
            ->performedOn($assignment->shift)
            ->causedBy($actor)
            ->withProperties([
                'attributes' => [
                    'user_id' => $assignment->user_id,
                    'shift_id' => $assignment->shift_id,
                ],
                'module' => 'shift',
                'ip' => request()->ip(),
            ])
            ->log("User {$assignment->user_id} removed from shift {$assignment->shift_id}");

        $assignment->delete();
    }

    public function myCurrentShift(User $user): ?UserShift
    {
        return UserShift::query()
            ->where('user_id', $user->id)
            ->where('effective_date', '<=', now()->toDateString())
            ->where(function ($q) {
                $q->whereNull('end_date')
                    ->orWhere('end_date', '>=', now()->toDateString());
            })
            ->with(['shift', 'assignedBy:id,name'])
            ->orderByDesc('effective_date')
            ->first();
    }
}
