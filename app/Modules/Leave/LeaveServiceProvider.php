<?php

namespace App\Modules\Leave;

use App\Modules\Leave\Services\LeaveService;
use App\Modules\Shared\Contracts\LeaveServiceInterface;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class LeaveServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(
            LeaveServiceInterface::class,
            LeaveService::class
        );
    }

    public function boot(): void
    {
        if (file_exists(__DIR__.'/api.php')) {
            Route::prefix('api')->middleware('api')->group(__DIR__.'/api.php');
        }

        if (is_dir(__DIR__.'/Migrations')) {
            $this->loadMigrationsFrom(__DIR__.'/Migrations');
        }
    }
}
