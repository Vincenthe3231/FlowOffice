<?php

namespace App\Modules\Shift\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserShiftResource extends JsonResource
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
            'shift_id' => $this->shift_id,
            'shift' => $this->when($this->relationLoaded('shift') && $this->shift, fn () => [
                'id' => $this->shift->id,
                'name' => $this->shift->name,
                'start_time' => $this->shift->start_time,
                'end_time' => $this->shift->end_time,
            ]),
            'effective_date' => $this->effective_date?->toDateString(),
            'end_date' => $this->end_date?->toDateString(),
            'notes' => $this->notes,
            'assigned_by' => $this->when($this->relationLoaded('assignedBy') && $this->assignedBy, fn () => [
                'id' => $this->assignedBy->id,
                'name' => $this->assignedBy->name,
            ]),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
