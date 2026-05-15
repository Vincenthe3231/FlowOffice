<?php

namespace App\Http\Requests\Leave;

use Illuminate\Foundation\Http\FormRequest;

class RejectLeaveRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasAnyRole(['hod', 'hr_admin', 'top_management']) ?? false;
    }

    public function rules(): array
    {
        return [
            'level' => ['sometimes', 'integer', 'min:1', 'max:10'],
            'reason' => ['required', 'string', 'max:1000'],
        ];
    }
}
