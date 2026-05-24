<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OvertimeApproval extends Model
{
    public const STATUS_PENDING = 'pending';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_REJECTED = 'rejected';

    public const STEP_DEPT_HOD = 'dept_hod';
    public const STEP_HR_ADMIN = 'hr_admin';
    public const STEP_TOP_MANAGEMENT = 'top_management';

    protected $fillable = [
        'overtime_request_id',
        'level',
        'step_kind',
        'status',
        'eligible_approver_ids',
        'approver_id',
        'decided_at',
        'rejection_reason',
    ];

    protected $casts = [
        'eligible_approver_ids' => 'array',
        'decided_at' => 'datetime',
    ];

    public function overtimeRequest(): BelongsTo
    {
        return $this->belongsTo(OvertimeRequest::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approver_id');
    }
}
