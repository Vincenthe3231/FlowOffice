<?php

namespace App\Http\Requests\Leave;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreLeaveTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasAnyRole(['hr_admin', 'top_management']) ?? false;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'key' => ['required', 'string', 'max:50', Rule::unique('leave_types', 'key')->whereNull('deleted_at')],
            'description' => ['nullable', 'string', 'max:500'],
            'annual_quota' => ['nullable', 'integer', 'min:0', 'max:365'],
            'requires_attachment' => ['nullable', 'boolean'],
            'approval_chain' => ['required', 'array', 'min:1'],
            'approval_chain.*.level' => ['required', 'integer', 'min:1'],
            'approval_chain.*.role' => ['required', 'string'],
            'duration_threshold' => ['nullable', 'integer', 'min:1'],
            'duration_threshold_role' => ['nullable', 'string'],
        ];
    }
}
