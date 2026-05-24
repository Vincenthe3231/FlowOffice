<?php

namespace App\Modules\Shift;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class ShiftServiceProvider extends ServiceProvider
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
