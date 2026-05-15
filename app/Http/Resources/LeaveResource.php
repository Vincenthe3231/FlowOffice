<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LeaveResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'leave_type_id' => $this->leave_type_id,
            'leave_type' => $this->when($this->relationLoaded('leaveType') && $this->leaveType, fn () => [
                'id' => $this->leaveType->id,
                'name' => $this->leaveType->name,
                'key' => $this->leaveType->key,
            ]),
            'user' => $this->when($this->relationLoaded('user') && $this->user, fn () => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
            ]),
            'start_date' => $this->start_date?->toDateString(),
            'end_date' => $this->end_date?->toDateString(),
            'day_type' => $this->day_type,
            'reason' => $this->reason,
            'status' => $this->status,
            'metadata' => $this->metadata,
            'attachments' => LeaveAttachmentResource::collection($this->whenLoaded('attachments')),
            'leave_approvals' => $this->when(
                $this->relationLoaded('leaveApprovals'),
                fn () => LeaveApprovalResourceCollection::make($this->leaveApprovals),
            ),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
