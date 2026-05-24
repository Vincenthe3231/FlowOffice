<?php

namespace App\Modules\Shift\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Shift;
use App\Modules\Shift\Http\Resources\ShiftResource;
use App\Modules\Shift\Http\Resources\UserShiftResource;
use App\Modules\Shift\Services\ShiftService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShiftController extends Controller
{
    use ApiResponse;

    public function __construct(
        private ShiftService $shiftService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $filters = [
            'status' => $request->query('status'),
            'per_page' => $request->query('per_page'),
        ];

        $paginator = $this->shiftService->index($request->user(), $filters);

        return $this->success(ShiftResource::collection($paginator));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'code' => ['required', 'string', 'max:20', 'unique:shifts,code'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i'],
            'color' => ['nullable', 'string', 'max:10'],
        ]);

        $shift = $this->shiftService->store($validated, $request->user());

        return $this->success(new ShiftResource($shift), 'Shift created.', 201);
    }

    public function show(Shift $shift): JsonResponse
    {
        $shift->load('createdBy:id,name');

        return $this->success(new ShiftResource($shift));
    }

    public function update(Request $request, Shift $shift): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:100'],
            'code' => ['sometimes', 'string', 'max:20', "unique:shifts,code,{$shift->id}"],
            'start_time' => ['sometimes', 'date_format:H:i'],
            'end_time' => ['sometimes', 'date_format:H:i'],
            'color' => ['nullable', 'string', 'max:10'],
            'status' => ['sometimes', 'in:active,inactive'],
        ]);

        $shift = $this->shiftService->update($shift, $validated);

        return $this->success(new ShiftResource($shift), 'Shift updated.');
    }

    public function destroy(Request $request, Shift $shift): JsonResponse
    {
        $this->shiftService->delete($shift, $request->user());

        return $this->success(null, 'Shift deleted.');
    }

    public function myShift(Request $request): JsonResponse
    {
        $assignment = $this->shiftService->myCurrentShift($request->user());

        if ($assignment === null) {
            return $this->success(null, 'No current shift assignment found.');
        }

        return $this->success(new UserShiftResource($assignment));
    }
}
