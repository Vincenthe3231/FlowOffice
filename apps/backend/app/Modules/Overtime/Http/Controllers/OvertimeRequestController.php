<?php

namespace App\Modules\Overtime\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\OvertimeRequest;
use App\Modules\Overtime\Http\Resources\OvertimeRequestResource;
use App\Modules\Overtime\Services\OvertimeService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OvertimeRequestController extends Controller
{
    use ApiResponse;

    public function __construct(
        private OvertimeService $overtimeService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $filters = [
            'status' => $request->query('status'),
            'user_id' => $request->query('user_id'),
            'per_page' => $request->query('per_page'),
        ];

        $paginator = $this->overtimeService->index($request->user(), $filters);

        return $this->success(OvertimeRequestResource::collection($paginator));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'date' => ['required', 'date'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'reason' => ['required', 'string', 'max:2000'],
            'is_urgent' => ['sometimes', 'boolean'],
            'urgency_reason' => ['nullable', 'string', 'max:2000', 'required_if:is_urgent,true'],
        ]);

        $overtimeRequest = $this->overtimeService->store($request->user(), $validated);

        return $this->success(new OvertimeRequestResource($overtimeRequest), 'Overtime request submitted.', 201);
    }

    public function show(Request $request, OvertimeRequest $overtimeRequest): JsonResponse
    {
        $user = $request->user();

        if (
            $overtimeRequest->user_id !== $user->id
            && ! $user->hasAnyRole(['hod', 'hr_admin', 'top_management'])
        ) {
            return $this->error('FORBIDDEN', 'You do not have permission to view this overtime request.', 403);
        }

        $overtimeRequest = $this->overtimeService->show($overtimeRequest);

        return $this->success(new OvertimeRequestResource($overtimeRequest));
    }

    public function cancel(Request $request, OvertimeRequest $overtimeRequest): JsonResponse
    {
        if ($overtimeRequest->user_id !== $request->user()->id) {
            return $this->error('FORBIDDEN', 'You can only cancel your own overtime requests.', 403);
        }

        try {
            $overtimeRequest = $this->overtimeService->cancel($overtimeRequest, $request->user());
        } catch (\InvalidArgumentException $e) {
            return $this->error('INVALID_STATUS', $e->getMessage(), 422);
        }

        return $this->success(new OvertimeRequestResource($overtimeRequest), 'Overtime request cancelled.');
    }
}
