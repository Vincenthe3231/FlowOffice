<?php

namespace App\Jobs;

use App\Models\OvertimeApproval;
use App\Models\OvertimeRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;

class CheckOvertimeSla implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        // Query urgent overtime requests that have breached SLA and not yet been escalated
        OvertimeRequest::query()
            ->where('is_urgent', true)
            ->whereIn('status', OvertimeRequest::pendingPipelineStatuses())
            ->whereNotNull('metadata->sla_deadline')
            ->whereNull('metadata->escalated_at')
            ->whereRaw("(metadata->>'sla_deadline')::timestamptz < now()")
            ->with('overtimeApprovals')
            ->get()
            ->each(function (OvertimeRequest $request) {
                $this->escalate($request);
            });
    }

    private function escalate(OvertimeRequest $request): void
    {
        DB::transaction(function () use ($request) {
            // Resolve top_management IDs
            $topManagementIds = \App\Models\User::query()
                ->whereHas('roles', fn ($q) => $q->where('name', 'top_management')->where('guard_name', 'sanctum'))
                ->pluck('id')
                ->all();

            // Add top_management IDs to the pending approval row
            $pendingApproval = $request->overtimeApprovals
                ->firstWhere('status', OvertimeApproval::STATUS_PENDING);

            if ($pendingApproval !== null) {
                $existing = $pendingApproval->eligible_approver_ids ?? [];
                $merged = array_values(array_unique(array_merge($existing, $topManagementIds)));

                $pendingApproval->update([
                    'eligible_approver_ids' => $merged,
                ]);
            }

            // Mark escalated in metadata
            $metadata = $request->metadata ?? [];
            $metadata['escalated_at'] = now()->toIso8601String();
            $request->update(['metadata' => $metadata]);

            activity('overtime')
                ->event('sla_breached')
                ->performedOn($request)
                ->withProperties([
                    'attributes' => [
                        'escalated_at' => $metadata['escalated_at'],
                        'sla_deadline' => $metadata['sla_deadline'] ?? null,
                    ],
                    'module' => 'overtime',
                ])
                ->log("Overtime SLA breached and escalated to top management: {$request->date}");
        });
    }
}
