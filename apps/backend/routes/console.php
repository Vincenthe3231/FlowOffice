<?php

use App\Jobs\CheckEmergencyLeaveSla;
use App\Jobs\CheckOvertimeSla;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// SLA escalation jobs — run every 15 minutes
Schedule::job(new CheckOvertimeSla())->everyFifteenMinutes()->name('check-overtime-sla')->withoutOverlapping();
Schedule::job(new CheckEmergencyLeaveSla())->everyFifteenMinutes()->name('check-emergency-leave-sla')->withoutOverlapping();
