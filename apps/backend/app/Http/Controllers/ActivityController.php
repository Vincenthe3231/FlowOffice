<?php

namespace App\Http\Controllers;

use App\Http\Resources\ActivityLogResource;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Activitylog\Models\Activity;

class ActivityController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $perPage = min(max((int) ($request->input('per_page', 25)), 1), 100);

        $activities = Activity::query()
            ->with('causer:id,name,email')
            ->when($request->input('module'), fn ($q) => $q->where('log_name', $request->input('module')))
            ->when($request->input('event'), fn ($q) => $q->where('event', $request->input('event')))
            ->when($request->input('user_id'), fn ($q) => $q->where('causer_id', $request->input('user_id'))
                ->where('causer_type', \App\Models\User::class))
            ->when($request->input('from'), fn ($q) => $q->whereDate('created_at', '>=', $request->input('from')))
            ->when($request->input('to'), fn ($q) => $q->whereDate('created_at', '<=', $request->input('to')))
            ->orderByDesc('created_at')
            ->paginate($perPage);

        return $this->success(
            ActivityLogResource::collection($activities),
            'Audit trail retrieved successfully.'
        );
    }
}
