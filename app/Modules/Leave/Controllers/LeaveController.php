<?php

namespace App\Modules\Leave\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\Leave\StoreLeaveRequest;
use App\Http\Resources\LeaveResource;
use App\Models\Leave;
use App\Modules\Leave\Services\LeaveAttachmentService;
use App\Modules\Leave\Services\LeaveService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeaveController extends Controller
{
    use ApiResponse;

    public function __construct(
        private LeaveService $leaveService,
        private LeaveAttachmentService $attachmentService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Leave::class);
        $filters = [
            'status' => $request->query('status'),
            'leave_type_id' => $request->query('leave_type_id'),
            'per_page' => $request->query('per_page'),
        ];
        $paginator = $this->leaveService->index($request->user(), $filters);

        return $this->success(LeaveResource::collection($paginator));
    }

    public function store(StoreLeaveRequest $request): JsonResponse
    {
        $leave = $this->leaveService->store($request->user(), $request->validated());

        return $this->success(new LeaveResource($leave), 'Leave request created.', 201);
    }

    public function show(Request $request, Leave $leave): JsonResponse
    {
        $this->authorize('view', $leave);
        $leave = $this->leaveService->show($leave);

        return $this->success(new LeaveResource($leave));
    }

    public function cancel(Request $request, Leave $leave): JsonResponse
    {
        $this->authorize('view', $leave);

        if ($leave->user_id !== $request->user()->id) {
            return $this->error('FORBIDDEN', 'You can only cancel your own leave requests.', 403);
        }

        try {
            $leave = $this->leaveService->cancel($leave, $request->user());
        } catch (\InvalidArgumentException $e) {
            return $this->error('INVALID_STATUS', $e->getMessage(), 422);
        }

        return $this->success(new LeaveResource($leave), 'Leave request cancelled.');
    }
}
