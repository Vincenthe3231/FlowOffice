<?php

use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\Auth\LarkAuthController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\GeocodeController;
use App\Http\Controllers\InAppNotificationController;
use App\Http\Controllers\MapsConfigController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReverseGeocodeController;
use Illuminate\Support\Facades\Route;

// Public auth routes
Route::post('/auth/lark/callback', [LarkAuthController::class, 'callback'])
    ->middleware('throttle:30,1');
Route::post('/auth/login', [LarkAuthController::class, 'login'])
    ->middleware('throttle:5,1');

// OAuth scaffolds (501 until backend implemented)
Route::post('/auth/google/callback', function () {
    return response()->json([
        'error' => 'NOT_IMPLEMENTED',
        'message' => 'Google OAuth not yet implemented.',
        'status' => 501,
    ], 501);
})->middleware('throttle:10,1');
Route::post('/auth/microsoft/callback', function () {
    return response()->json([
        'error' => 'NOT_IMPLEMENTED',
        'message' => 'Microsoft OAuth not yet implemented.',
        'status' => 501,
    ], 501);
})->middleware('throttle:10,1');

// Protected auth routes (require authentication)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [LarkAuthController::class, 'logout'])
        ->middleware('throttle:10,1');

    Route::post('/auth/resubmit', [LarkAuthController::class, 'resubmit'])
        ->middleware('throttle:3,5');

    Route::get('/user', [LarkAuthController::class, 'me']);
    Route::get('/auth/my-roles', [LarkAuthController::class, 'myRoles']);

    Route::middleware(['check.account_status', 'check.account_locked'])->group(function () {
        // Profile
        Route::get('/profile/me', [ProfileController::class, 'me']);
        Route::put('/profile/me', [ProfileController::class, 'updateMe']);
        Route::post('/profile/face-photo', [ProfileController::class, 'uploadFacePhoto']);
        Route::post('/profile/avatar', [ProfileController::class, 'uploadAvatar']);

        // Geocode (Google Geocoding API, server-side)
        Route::post('/geocode', [GeocodeController::class, 'geocode']);
        Route::post('/reverse-geocode', [ReverseGeocodeController::class, 'reverseGeocode']);
        Route::get('/maps-config', [MapsConfigController::class, 'index']);

        Route::get('/notifications', [InAppNotificationController::class, 'index'])->middleware('throttle:60,1');
        Route::patch('/notifications/read-all', [InAppNotificationController::class, 'markAllRead'])
            ->middleware('throttle:60,1');
        Route::patch('/notifications/{inAppNotification}/read', [InAppNotificationController::class, 'markRead'])
            ->middleware('throttle:60,1');

        // User Management directory (top_management, hr_admin: all users; hod: same department only)
        Route::middleware(['role:top_management|hr_admin|hod', 'throttle:60,1'])->group(function () {
            Route::get('/admin/users', [AdminUserController::class, 'index']);
            Route::get('/admin/users/{user:uuid}', [AdminUserController::class, 'show']);
        });

        Route::middleware(['check.top_management', 'throttle:60,1'])->group(function () {
            Route::patch('/admin/users/{user:uuid}', [AdminUserController::class, 'updateDepartment']);
            Route::patch('/admin/users/{user:uuid}/role', [AdminUserController::class, 'updateRole']);
        });

        // Departments: read top_management|hr_admin|hod; create/update (incl. status) top_management only — no delete
        Route::middleware(['role:top_management|hr_admin|hod', 'throttle:60,1'])->group(function () {
            Route::get('/departments', [DepartmentController::class, 'index']);
            Route::get('/departments/{department}', [DepartmentController::class, 'show']);
        });
        Route::middleware(['check.top_management', 'throttle:60,1'])->group(function () {
            Route::post('/departments', [DepartmentController::class, 'store']);
            Route::put('/departments/{department}', [DepartmentController::class, 'update']);
            Route::patch('/departments/{department}', [DepartmentController::class, 'update']);
        });

        // Analytics (top_management + hr_admin)
        Route::middleware(['role:top_management|hr_admin', 'throttle:60,1'])->group(function () {
            Route::get('/admin/analytics/overview', [AnalyticsController::class, 'overview']);
            Route::get('/admin/analytics/attendance', [AnalyticsController::class, 'attendance']);
            Route::get('/admin/analytics/leave', [AnalyticsController::class, 'leave']);
            Route::get('/admin/analytics/claims', [AnalyticsController::class, 'claims']);
        });

        // Onboarding (Top Management only)
        Route::middleware('check.top_management')->group(function () {
            Route::get('/onboarding/approval-roles', [OnboardingController::class, 'approvalRoles']);
            Route::get('/onboarding', [OnboardingController::class, 'index']);
            Route::post('/onboarding/{userOnboarding}/approval', [OnboardingController::class, 'approval']);
            Route::post('/onboarding/{userOnboarding}/rejection', [OnboardingController::class, 'rejection']);
        });
    });
});
