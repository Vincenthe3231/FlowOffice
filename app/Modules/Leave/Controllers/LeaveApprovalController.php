<?php

namespace App\Modules\Leave\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\Leave\RejectLeaveRequest;
use App\Http\Resources\LeaveApprovalResourceCollection;
use App\Http\Resources\LeaveResource;
use App\Models\Leave;
use App\Modules\Leave\Services\LeaveService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeaveApprovalController extends Controller
{
    use ApiResponse;

    public function __construct(
        private LeaveService $leaveService
    ) {}

    public function all(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Leave::class);
        $filters = [
            'status' => $request->query('status'),
            'per_page' => $request->query('per_page'),
        ];
        $paginator = $this->leaveService->allLeaves($request->user(), $filters);

        return $this->success(LeaveResource::collection($paginator));
    }

    public function pendingApprovals(Request $request): JsonResponse
    {
        $paginator = $this->leaveService->pendingApprovals($request->user());

        return $this->success(LeaveResource::collection($paginator));
    }

    public function approvals(Request $request, Leave $leave): JsonResponse
    {
        $this->authorize('view', $leave);

        $rows = $leave->leaveApprovals()
            ->with(['approver'])
            ->orderBy('level')
            ->get();

        return $this->success(
            LeaveApprovalResourceCollection::make($rows),
            'Leave approvals retrieved.'
        );
    }

    public function approve(Request $request, Leave $leave): JsonResponse
    {
        $this->authorize('approve', $leave);
        $validated = $request->validate([
            'level' => ['sometimes', 'integer', 'min:1', 'max:10'],
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);

        try {
            $leave = $this->leaveService->approve(
                $request->user(),
                $leave,
                $validated['level'] ?? null
            );
        } catch (\InvalidArgumentException $e) {
            return $this->error('INVALID_STATUS_TRANSITION', $e->getMessage(), 422);
        }

        return $this->success(new LeaveResource($leave), 'Leave approved.');
    }

    public function reject(RejectLeaveRequest $request, Leave $leave): JsonResponse
    {
        $this->authorize('reject', $leave);

        try {
            $leave = $this->leaveService->reject(
                $request->user(),
                $leave,
                $request->validated('reason'),
                $request->validated('level')
            );
        } catch (\InvalidArgumentException $e) {
            return $this->error('INVALID_STATUS_TRANSITION', $e->getMessage(), 422);
        }

        return $this->success(new LeaveResource($leave), 'Leave rejected.');
    }
}
