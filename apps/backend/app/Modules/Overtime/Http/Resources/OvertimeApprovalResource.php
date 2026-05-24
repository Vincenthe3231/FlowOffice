<?php

namespace App\Modules\Overtime\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OvertimeApprovalResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $eligibleApprovers = [];
        if (! empty($this->eligible_approver_ids)) {
            $eligibleApprovers = User::whereIn('id', $this->eligible_approver_ids)
                ->select('id', 'name')
                ->get()
                ->map(fn ($u) => ['id' => $u->id, 'name' => $u->name])
                ->values()
                ->all();
        }

        return [
            'id' => $this->id,
            'level' => $this->level,
            'step_kind' => $this->step_kind,
            'status' => $this->status,
            'approver' => $this->when($this->relationLoaded('approver') && $this->approver, fn () => [
                'id' => $this->approver->id,
                'name' => $this->approver->name,
            ]),
            'eligible_approvers' => $eligibleApprovers,
            'rejection_reason' => $this->rejection_reason,
            'decided_at' => $this->decided_at?->toIso8601String(),
        ];
    }
}
