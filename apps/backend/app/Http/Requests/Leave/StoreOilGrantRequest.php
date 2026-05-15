<?php

namespace App\Http\Requests\Leave;

use Illuminate\Foundation\Http\FormRequest;

class StoreOilGrantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasAnyRole(['hr_admin', 'top_management']) ?? false;
    }

    public function rules(): array
    {
        return [
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'days' => ['required', 'numeric', 'min:0.5', 'max:30'],
            'reason' => ['required', 'string', 'max:500'],
        ];
    }
}
