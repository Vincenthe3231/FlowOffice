<?php

namespace App\Policies;

use App\Models\Leave;
use App\Models\User;

class LeavePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('leave.view-own')
            || $user->hasPermissionTo('leave.view-team');
    }

    public function view(User $user, Leave $leave): bool
    {
        if ($leave->user_id === $user->id) {
            return $user->hasPermissionTo('leave.view-own');
        }

        return $user->hasPermissionTo('leave.view-team');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('leave.create');
    }

    public function cancel(User $user, Leave $leave): bool
    {
        return $leave->user_id === $user->id
            && in_array($leave->status, Leave::pendingPipelineStatuses(), true);
    }

    public function approve(User $user, Leave $leave): bool
    {
        return $user->hasPermissionTo('leave.approve');
    }

    public function reject(User $user, Leave $leave): bool
    {
        return $user->hasPermissionTo('leave.reject');
    }
}
