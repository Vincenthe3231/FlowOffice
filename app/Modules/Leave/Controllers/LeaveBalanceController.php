<?php

namespace App\Modules\Leave\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\Leave\StoreOilGrantRequest;
use App\Http\Resources\LeaveBalanceResource;
use App\Modules\Leave\Services\LeaveService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeaveBalanceController extends Controller
{
    use ApiResponse;

    public function __construct(
        private LeaveService $leaveService
    ) {}

    public function myBalance(Request $request): JsonResponse
    {
        $balances = $this->leaveService->getUserBalances($request->user()->id);

        return $this->success(LeaveBalanceResource::collection($balances));
    }

    public function userBalance(Request $request, int $userId): JsonResponse
    {
        $balances = $this->leaveService->getUserBalances($userId);

        return $this->success(LeaveBalanceResource::collection($balances));
    }

    public function grantOil(StoreOilGrantRequest $request): JsonResponse
    {
        try {
            $balance = $this->leaveService->grantOil(
                $request->validated('user_id'),
                $request->validated('days'),
                $request->validated('reason')
            );
        } catch (\InvalidArgumentException $e) {
            return $this->error('OIL_GRANT_FAILED', $e->getMessage(), 422);
        }

        return $this->success(new LeaveBalanceResource($balance), 'OIL days granted.', 201);
    }
}
