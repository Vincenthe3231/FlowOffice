<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LeaveBalanceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'leave_type_id' => $this->leave_type_id,
            'leave_type_name' => $this->when($this->relationLoaded('leaveType') && $this->leaveType, fn () => $this->leaveType->name),
            'annual_quota' => $this->annual_quota,
            'used' => (float) $this->used,
            'pending' => (float) $this->pending,
            'remaining' => $this->remaining,
        ];
    }
}
