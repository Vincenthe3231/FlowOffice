<?php

namespace App\Modules\Leave\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\Leave\StoreLeaveTypeRequest;
use App\Http\Requests\Leave\UpdateLeaveTypeRequest;
use App\Models\LeaveBalance;
use App\Models\LeaveType;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

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

        return $this->success($leaveType, 'Leave type created.', 201);
    }

    public function update(UpdateLeaveTypeRequest $request, LeaveType $leaveType): JsonResponse
    {
        $validated = $request->validated();
        $oldQuota = $leaveType->annual_quota;

        $leaveType->update($validated);

        // Always propagate annual_quota to existing balances for current + future years.
        // Idempotent: if balances already match, the UPDATE is a no-op.
        // Past years are intentionally excluded (year >= now) to preserve historical records.
        if (array_key_exists('annual_quota', $validated)) {
            LeaveBalance::where('leave_type_id', $leaveType->id)
                ->where('year', '>=', now()->year)
                ->update(['annual_quota' => $validated['annual_quota']]);
        }

        return $this->success($leaveType, 'Leave type updated.');
    }

    public function destroy(LeaveType $leaveType): JsonResponse
    {
        $leaveType->delete();

        return $this->success(null, 'Leave type deleted.');
    }
}
