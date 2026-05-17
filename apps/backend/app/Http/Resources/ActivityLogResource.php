<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ActivityLogResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $properties = $this->properties ?? [];
        if ($properties instanceof \Illuminate\Support\Collection) {
            $properties = $properties->toArray();
        }

        return [
            'id' => $this->id,
            'module' => $this->log_name,
            'event' => $this->event,
            'description' => $this->description,
            'causer' => $this->causer ? [
                'id' => $this->causer->id,
                'name' => $this->causer->name,
                'email' => $this->causer->email,
            ] : null,
            'subjectType' => $this->subject_type,
            'subjectId' => $this->subject_id,
            'properties' => [
                'old' => $properties['old'] ?? null,
                'attributes' => $properties['attributes'] ?? null,
                'ip' => $properties['ip'] ?? null,
            ],
            'createdAt' => $this->created_at?->toIso8601String(),
        ];
    }
}
