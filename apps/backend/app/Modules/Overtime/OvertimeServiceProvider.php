<?php

namespace App\Modules\Overtime;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class OvertimeServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        if (file_exists(__DIR__.'/api.php')) {
            Route::prefix('api')->middleware('api')->group(__DIR__.'/api.php');
        }
    }
}
