<?php

namespace App\Jobs;

use App\Models\Leave;
use App\Models\LeaveApproval;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class CheckEmergencyLeaveSla implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        // Find emergency leave requests that are still pending and past their SLA deadline
        $overdue = Leave::query()
            ->whereIn('status', Leave::pendingPipelineStatuses())
            ->whereHas('leaveType', fn ($q) => $q->where('key', 'emergency'))
            ->whereNotNull('metadata->sla_deadline')
            ->get()
            ->filter(function (Leave $leave) {
                $deadline = data_get($leave->metadata, 'sla_deadline');
                return $deadline && Carbon::parse($deadline)->isPast();
            });

        foreach ($overdue as $leave) {
            $this->escalate($leave);
        }
    }

    private function escalate(Leave $leave): void
    {
        // Already escalated — skip if escalated_at is set in metadata
        if (data_get($leave->metadata, 'escalated_at')) {
            return;
        }

        // Find the pending approval step
        $leave->load('leaveApprovals');
        $pendingStep = $leave->leaveApprovals->firstWhere('status', LeaveApproval::STATUS_PENDING);
        if (! $pendingStep) {
            return;
        }

        // Add all top_management users to eligible_approver_ids
        $topManagementIds = User::role('top_management')->pluck('id')->toArray();
        $existing = $pendingStep->eligible_approver_ids ?? [];
        $merged = array_values(array_unique(array_merge($existing, $topManagementIds)));
        $pendingStep->update(['eligible_approver_ids' => $merged]);

        // Mark escalated_at in metadata
        $metadata = $leave->metadata ?? [];
        $metadata['escalated_at'] = now()->toIso8601String();
        $leave->update(['metadata' => $metadata]);

        activity('leave')
            ->event('emergency_sla_breached')
            ->performedOn($leave)
            ->withProperties([
                'attributes' => [
                    'leave_id' => $leave->id,
                    'sla_deadline' => data_get($leave->metadata, 'sla_deadline'),
                    'escalated_at' => $metadata['escalated_at'],
                    'top_management_added' => $topManagementIds,
                ],
                'module' => 'leave',
            ])
            ->log("Emergency leave SLA breached — escalated to top management: leave #{$leave->id}");

        Log::warning("Emergency leave SLA breached", [
            'leave_id' => $leave->id,
            'user_id' => $leave->user_id,
            'sla_deadline' => data_get($leave->metadata, 'sla_deadline'),
        ]);
    }
}
