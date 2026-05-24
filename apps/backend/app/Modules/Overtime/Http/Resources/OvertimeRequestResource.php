<?php

namespace App\Modules\Overtime\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OvertimeRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'user' => $this->when($this->relationLoaded('user') && $this->user, fn () => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
            ]),
            'date' => $this->date?->toDateString(),
            'start_time' => $this->start_time,
            'end_time' => $this->end_time,
            'reason' => $this->reason,
            'is_urgent' => $this->is_urgent,
            'urgency_reason' => $this->urgency_reason,
            'status' => $this->status,
            'metadata' => $this->metadata,
            'duration_hours' => $this->durationHours(),
            'overtime_approvals' => $this->when(
                $this->relationLoaded('overtimeApprovals'),
                fn () => OvertimeApprovalResource::collection($this->overtimeApprovals)
            ),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
