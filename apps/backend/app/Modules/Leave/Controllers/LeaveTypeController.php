<?php

namespace App\Modules\Leave\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\Leave\StoreLeaveTypeRequest;
use App\Http\Requests\Leave\UpdateLeaveTypeRequest;
use App\Models\LeaveBalance;
use App\Models\LeaveType;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeaveTypeController extends Controller
{
    use ApiResponse;

    public function index(): JsonResponse
    {
        $types = LeaveType::all();

        return $this->success($types);
    }

    public function show(LeaveType $leaveType): JsonResponse
    {
        return $this->success($leaveType);
    }

    public function store(StoreLeaveTypeRequest $request): JsonResponse
    {
        $leaveType = LeaveType::create($request->validated());

        activity('leave_type')
            ->causedBy($request->user())
            ->performedOn($leaveType)
            ->withProperties([
                'attributes' => $leaveType->toArray(),
                'module' => 'leave_type',
                'ip' => $request->ip(),
            ])
            ->event('created')
            ->log('Leave type created: ' . $leaveType->name);

        return $this->success($leaveType, 'Leave type created.', 201);
    }

    public function update(UpdateLeaveTypeRequest $request, LeaveType $leaveType): JsonResponse
    {
        $validated = $request->validated();
        $oldAttributes = $leaveType->only(array_keys($validated));

        $leaveType->update($validated);

        // Always propagate annual_quota to existing balances for current + future years.
        // Idempotent: if balances already match, the UPDATE is a no-op.
        // Past years are intentionally excluded (year >= now) to preserve historical records.
        if (array_key_exists('annual_quota', $validated)) {
            LeaveBalance::where('leave_type_id', $leaveType->id)
                ->where('year', '>=', now()->year)
                ->update(['annual_quota' => $validated['annual_quota']]);
        }

        activity('leave_type')
            ->causedBy($request->user())
            ->performedOn($leaveType)
            ->withProperties([
                'old' => $oldAttributes,
                'attributes' => $leaveType->only(array_keys($validated)),
                'module' => 'leave_type',
                'ip' => $request->ip(),
            ])
            ->event('updated')
            ->log('Leave type updated: ' . $leaveType->name);

        return $this->success($leaveType, 'Leave type updated.');
    }

    public function destroy(Request $request, LeaveType $leaveType): JsonResponse
    {
        $snapshot = $leaveType->toArray();
        $leaveType->delete();

        activity('leave_type')
            ->causedBy($request->user())
            ->withProperties([
                'old' => $snapshot,
                'module' => 'leave_type',
                'ip' => $request->ip(),
            ])
            ->event('deleted')
            ->log('Leave type deleted: ' . $snapshot['name']);

        return $this->success(null, 'Leave type deleted.');
    }
}
