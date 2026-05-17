<?php

namespace App\Providers;

use App\Models\Claim;
use App\Models\Department;
use App\Models\Leave;
use App\Models\LeaveType;
use App\Models\User;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        if (class_exists(\Laravel\Telescope\TelescopeApplicationServiceProvider::class)) {
            $this->app->register(TelescopeServiceProvider::class);
        }
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureRateLimiting();
        $this->configureMorphMap();
    }

    /**
     * Authenticated users: 100 req/min by user ID.
     * Unauthenticated: 20 req/min by IP.
     */
    private function configureRateLimiting(): void
    {
        RateLimiter::for('api', function (Request $request) {
            return $request->user()
                ? Limit::perMinute(100)->by($request->user()->id)
                : Limit::perMinute(20)->by($request->ip());
        });
    }

    /**
     * Enforce morph map so activity log stores short aliases, not full class names.
     */
    private function configureMorphMap(): void
    {
        Relation::enforceMorphMap([
            'user' => User::class,
            'department' => Department::class,
            'claim' => Claim::class,
            'leave' => Leave::class,
            'leave_type' => LeaveType::class,
        ]);
    }
}
