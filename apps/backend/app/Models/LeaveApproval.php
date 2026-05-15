<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeaveApproval extends Model
{
    public const STATUS_PENDING = 'pending';

    public const STATUS_APPROVED = 'approved';

    public const STATUS_REJECTED = 'rejected';

    public const STEP_DEPT_HOD = 'dept_hod';

    public const STEP_HR_ADMIN = 'hr_admin';

    public const STEP_TOP_MANAGEMENT = 'top_management';

    protected $fillable = [
        'leave_id',
        'level',
        'step_kind',
        'status',
        'eligible_approver_ids',
        'approver_id',
        'decided_at',
        'rejection_reason',
    ];

    protected function casts(): array
    {
        return [
            'eligible_approver_ids' => 'array',
            'decided_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Leave, $this>
     */
    public function leave(): BelongsTo
    {
        return $this->belongsTo(Leave::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approver_id');
    }
}
