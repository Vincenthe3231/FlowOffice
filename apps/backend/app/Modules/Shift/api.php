<?php

use App\Modules\Shift\Http\Controllers\ShiftAssignmentController;
use App\Modules\Shift\Http\Controllers\ShiftController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'check.account_status', 'check.account_locked'])->group(function () {
    Route::get('/shifts/my', [ShiftController::class, 'myShift']);
    Route::get('/shifts', [ShiftController::class, 'index']);

    Route::middleware('role:hr_admin|top_management')->group(function () {
        Route::post('/shifts', [ShiftController::class, 'store']);
        Route::patch('/shifts/{shift}', [ShiftController::class, 'update']);
        Route::delete('/shifts/{shift}', [ShiftController::class, 'destroy']);
    });

    Route::get('/shifts/{shift}', [ShiftController::class, 'show']);

    Route::get('/shifts/{shift}/assignments', [ShiftAssignmentController::class, 'index'])
        ->middleware('role:hod|hr_admin|top_management');

    Route::middleware('role:hr_admin|top_management')->group(function () {
        Route::post('/shifts/{shift}/assignments', [ShiftAssignmentController::class, 'store']);
        Route::delete('/shifts/assignments/{assignment}', [ShiftAssignmentController::class, 'destroy']);
    });
});
