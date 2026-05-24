<?php

use App\Modules\Overtime\Http\Controllers\OvertimeApprovalController;
use App\Modules\Overtime\Http\Controllers\OvertimeRequestController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'check.account_status', 'check.account_locked'])->group(function () {
    Route::get('/overtime/pending-approvals', [OvertimeApprovalController::class, 'pendingApprovals']);
    Route::get('/overtime/all', [OvertimeApprovalController::class, 'all'])->middleware('role:hod|hr_admin|top_management');
    Route::get('/overtime', [OvertimeRequestController::class, 'index']);
    Route::post('/overtime', [OvertimeRequestController::class, 'store']);
    Route::get('/overtime/{overtimeRequest}', [OvertimeRequestController::class, 'show']);
    Route::patch('/overtime/{overtimeRequest}/cancel', [OvertimeRequestController::class, 'cancel']);
    Route::get('/overtime/{overtimeRequest}/approvals', [OvertimeApprovalController::class, 'approvals']);
    Route::patch('/overtime/{overtimeRequest}/approve', [OvertimeApprovalController::class, 'approve'])->middleware('role:hod|hr_admin|top_management');
    Route::post('/overtime/{overtimeRequest}/reject', [OvertimeApprovalController::class, 'reject'])->middleware('role:hod|hr_admin|top_management');
});
