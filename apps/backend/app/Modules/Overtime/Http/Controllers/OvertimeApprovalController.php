<?php

namespace App\Modules\Overtime\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\OvertimeRequest;
use App\Modules\Overtime\Http\Resources\OvertimeApprovalResource;
use App\Modules\Overtime\Http\Resources\OvertimeRequestResource;
use App\Modules\Overtime\Services\OvertimeService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OvertimeApprovalController extends Controller
{
    use ApiResponse;

    public function __construct(
        private OvertimeService $overtimeService
    ) {}

    public function pendingApprovals(Request $request): JsonResponse
    {
        $paginator = $this->overtimeService->pendingApprovals($request->user());

        return $this->success(OvertimeRequestResource::collection($paginator));
    }

    public function all(Request $request): JsonResponse
    {
        $filters = [
            'status' => $request->query('status'),
            'user_id' => $request->query('user_id'),
            'per_page' => $request->query('per_page'),
        ];

        $paginator = $this->overtimeService->allRequests($request->user(), $filters);

        return $this->success(OvertimeRequestResource::collection($paginator));
    }

    public function approvals(Request $request, OvertimeRequest $overtimeRequest): JsonResponse
    {
        $rows = $overtimeRequest->overtimeApprovals()
            ->with(['approver:id,name,email'])
            ->orderBy('level')
            ->get();

        return $this->success(
            OvertimeApprovalResource::collection($rows),
            'Overtime approvals retrieved.'
        );
    }

    public function approve(Request $request, OvertimeRequest $overtimeRequest): JsonResponse
    {
        try {
            $overtimeRequest = $this->overtimeService->approve($request->user(), $overtimeRequest);
        } catch (\InvalidArgumentException $e) {
            return $this->error('INVALID_STATUS_TRANSITION', $e->getMessage(), 422);
        }

        return $this->success(new OvertimeRequestResource($overtimeRequest), 'Overtime request approved.');
    }

    public function reject(Request $request, OvertimeRequest $overtimeRequest): JsonResponse
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:1000'],
        ]);

        try {
            $overtimeRequest = $this->overtimeService->reject(
                $request->user(),
                $overtimeRequest,
                $validated['reason']
            );
        } catch (\InvalidArgumentException $e) {
            return $this->error('INVALID_STATUS_TRANSITION', $e->getMessage(), 422);
        }

        return $this->success(new OvertimeRequestResource($overtimeRequest), 'Overtime request rejected.');
    }
}
