<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Leave extends Model
{
    use HasFactory;

    public const DAY_TYPE_FULL = 'full';

    public const DAY_TYPE_AM = 'am';

    public const DAY_TYPE_PM = 'pm';

    public const STATUS_PENDING = 'pending';

    public const STATUS_PENDING_L1 = 'pending_l1';

    public const STATUS_PENDING_L2 = 'pending_l2';

    public const STATUS_PENDING_L3 = 'pending_l3';

    public const STATUS_APPROVED = 'approved';

    public const STATUS_REJECTED = 'rejected';

    public const STATUS_CANCELLED = 'cancelled';

    /**
     * @return list<string>
     */
    public static function pendingPipelineStatuses(): array
    {
        return [
            self::STATUS_PENDING,
            self::STATUS_PENDING_L1,
            self::STATUS_PENDING_L2,
            self::STATUS_PENDING_L3,
        ];
    }

    protected $fillable = [
        'user_id',
        'leave_type_id',
        'start_date',
        'end_date',
        'day_type',
        'reason',
        'status',
        'metadata',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'metadata' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function leaveType(): BelongsTo
    {
        return $this->belongsTo(LeaveType::class);
    }

    /**
     * @return HasMany<LeaveApproval, $this>
     */
    public function leaveApprovals(): HasMany
    {
        return $this->hasMany(LeaveApproval::class)->orderBy('level');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(LeaveAttachment::class);
    }

    public function durationDays(): float
    {
        $days = $this->start_date->diffInDays($this->end_date) + 1;

        if ($this->day_type !== self::DAY_TYPE_FULL) {
            return $days * 0.5;
        }

        return (float) $days;
    }
}
