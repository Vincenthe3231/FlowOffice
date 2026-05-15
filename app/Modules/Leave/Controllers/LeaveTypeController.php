<?php

namespace App\Modules\Leave\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\Leave\StoreLeaveTypeRequest;
use App\Http\Requests\Leave\UpdateLeaveTypeRequest;
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
        $leaveType->update($request->validated());

        return $this->success($leaveType, 'Leave type updated.');
    }

    public function destroy(LeaveType $leaveType): JsonResponse
    {
        $leaveType->delete();

        return $this->success(null, 'Leave type deleted.');
    }
}
