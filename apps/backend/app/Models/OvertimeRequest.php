<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class OvertimeRequest extends Model
{
    use SoftDeletes;

    public const STATUS_PENDING_L1 = 'pending_l1';
    public const STATUS_PENDING_L2 = 'pending_l2';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_REJECTED = 'rejected';
    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'user_id',
        'date',
        'start_time',
        'end_time',
        'reason',
        'is_urgent',
        'urgency_reason',
        'status',
        'metadata',
        'approved_by',
        'decided_at',
    ];

    protected $casts = [
        'date' => 'date',
        'is_urgent' => 'boolean',
        'metadata' => 'array',
        'decided_at' => 'datetime',
    ];

    public static function pendingPipelineStatuses(): array
    {
        return [
            self::STATUS_PENDING_L1,
            self::STATUS_PENDING_L2,
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function overtimeApprovals(): HasMany
    {
        return $this->hasMany(OvertimeApproval::class)->orderBy('level');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function durationHours(): float
    {
        $start = Carbon::parse($this->start_time);
        $end = Carbon::parse($this->end_time);

        return round($start->diffInMinutes($end) / 60, 2);
    }
}
