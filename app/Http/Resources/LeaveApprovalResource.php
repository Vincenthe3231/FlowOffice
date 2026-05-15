<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LeaveApprovalResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'level' => $this->level,
            'step_kind' => $this->step_kind,
            'status' => $this->status,
            'approver' => $this->when($this->relationLoaded('approver') && $this->approver, fn () => [
                'id' => $this->approver->id,
                'name' => $this->approver->name,
            ]),
            'rejection_reason' => $this->rejection_reason,
            'decided_at' => $this->decided_at?->toIso8601String(),
        ];
    }
}
