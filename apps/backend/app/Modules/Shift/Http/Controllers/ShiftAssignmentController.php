<?php

namespace App\Modules\Shift\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Shift;
use App\Models\UserShift;
use App\Modules\Shift\Http\Resources\UserShiftResource;
use App\Modules\Shift\Services\ShiftService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShiftAssignmentController extends Controller
{
    use ApiResponse;

    public function __construct(
        private ShiftService $shiftService
    ) {}

    public function index(Request $request, Shift $shift): JsonResponse
    {
        $filters = [
            'user_id' => $request->query('user_id'),
            'per_page' => $request->query('per_page'),
        ];

        $paginator = $this->shiftService->getAssignments($shift, $request->user(), $filters);

        return $this->success(UserShiftResource::collection($paginator));
    }

    public function store(Request $request, Shift $shift): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'effective_date' => ['required', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:effective_date'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $validated['shift_id'] = $shift->id;

        $assignment = $this->shiftService->assignUser($validated, $request->user());

        return $this->success(new UserShiftResource($assignment), 'User assigned to shift.', 201);
    }

    public function destroy(Request $request, UserShift $assignment): JsonResponse
    {
        $this->shiftService->removeAssignment($assignment, $request->user());

        return $this->success(null, 'Assignment removed.');
    }
}
