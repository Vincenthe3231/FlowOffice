<?php

namespace App\Http\Requests\Leave;

use App\Models\Leave;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreLeaveRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Leave::class) ?? false;
    }

    public function rules(): array
    {
        return [
            'leave_type_id' => ['required', 'integer', 'exists:leave_types,id'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'day_type' => ['required', 'string', Rule::in([Leave::DAY_TYPE_FULL, Leave::DAY_TYPE_AM, Leave::DAY_TYPE_PM])],
            'reason' => ['required', 'string', 'max:1000'],
        ];
    }
}
