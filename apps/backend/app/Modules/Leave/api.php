<?php

use App\Modules\Leave\Controllers\LeaveApprovalController;
use App\Modules\Leave\Controllers\LeaveAttachmentController;
use App\Modules\Leave\Controllers\LeaveBalanceController;
use App\Modules\Leave\Controllers\LeaveController;
use App\Modules\Leave\Controllers\LeaveTypeController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'check.account_status', 'check.account_locked'])->group(function () {
    // Leave types: read for all, CUD for admin only
    Route::get('/leave-types', [LeaveTypeController::class, 'index']);
    Route::middleware('role:hr_admin|top_management')->group(function () {
        Route::post('/leave-types', [LeaveTypeController::class, 'store']);
        Route::get('/leave-types/{leaveType}', [LeaveTypeController::class, 'show']);
        Route::patch('/leave-types/{leaveType}', [LeaveTypeController::class, 'update']);
        Route::delete('/leave-types/{leaveType}', [LeaveTypeController::class, 'destroy']);
    });

    // Static routes first (before /leave/{leave})
    Route::get('/leave/balance', [LeaveBalanceController::class, 'myBalance']);
    Route::get('/leave/pending-approvals', [LeaveApprovalController::class, 'pendingApprovals']);
    Route::get('/leave/all', [LeaveApprovalController::class, 'all'])
        ->middleware('role:hod|hr_admin|top_management');
    Route::middleware('role:hr_admin|top_management')->group(function () {
        Route::get('/leave/balance/{userId}', [LeaveBalanceController::class, 'userBalance']);
        Route::post('/leave/oil-grant', [LeaveBalanceController::class, 'grantOil']);
    });

    // Leave CRUD
    Route::get('/leave', [LeaveController::class, 'index']);
    Route::post('/leave', [LeaveController::class, 'store']);
    Route::get('/leave/{leave}', [LeaveController::class, 'show']);
    Route::patch('/leave/{leave}/cancel', [LeaveController::class, 'cancel']);

    // Leave attachments
    Route::post('/leave/{leave}/attachments', [LeaveAttachmentController::class, 'store']);
    Route::delete('/leave/{leave}/attachments/{attachment}', [LeaveAttachmentController::class, 'destroy']);

    // Leave approvals
    Route::get('/leave/{leave}/approvals', [LeaveApprovalController::class, 'approvals']);
    Route::patch('/leave/{leave}/approve', [LeaveApprovalController::class, 'approve'])
        ->middleware('role:hod|hr_admin|top_management');
    Route::post('/leave/{leave}/reject', [LeaveApprovalController::class, 'reject'])
        ->middleware('role:hod|hr_admin|top_management');
});
