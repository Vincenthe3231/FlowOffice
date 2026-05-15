<?php

namespace App\Http\Requests\Leave;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLeaveTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasAnyRole(['hr_admin', 'top_management']) ?? false;
    }

    public function rules(): array
    {
        $leaveTypeId = $this->route('leaveType')?->id;

        return [
            'name' => ['sometimes', 'string', 'max:100'],
            'key' => ['sometimes', 'string', 'max:50', 'unique:leave_types,key,'.$leaveTypeId],
            'description' => ['nullable', 'string', 'max:500'],
            'annual_quota' => ['sometimes', 'integer', 'min:0', 'max:365'],
            'requires_attachment' => ['sometimes', 'boolean'],
            'approval_chain' => ['sometimes', 'array', 'min:1'],
            'approval_chain.*.level' => ['required_with:approval_chain', 'integer', 'min:1'],
            'approval_chain.*.role' => ['required_with:approval_chain', 'string'],
            'duration_threshold' => ['nullable', 'integer', 'min:1'],
            'duration_threshold_role' => ['nullable', 'string'],
        ];
    }
}
