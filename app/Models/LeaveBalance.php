<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeaveBalance extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'leave_type_id',
        'year',
        'annual_quota',
        'used',
        'pending',
        'adjustment',
    ];

    protected $casts = [
        'year' => 'integer',
        'annual_quota' => 'integer',
        'used' => 'decimal:1',
        'pending' => 'decimal:1',
        'adjustment' => 'decimal:1',
    ];

    protected $appends = ['remaining'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function leaveType(): BelongsTo
    {
        return $this->belongsTo(LeaveType::class);
    }

    public function getRemainingAttribute(): float
    {
        return (float) ($this->annual_quota + $this->adjustment - $this->used - $this->pending);
    }
}
