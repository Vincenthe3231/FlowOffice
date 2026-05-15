<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LeaveType extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'key',
        'description',
        'annual_quota',
        'requires_attachment',
        'approval_chain',
        'duration_threshold',
        'duration_threshold_role',
    ];

    protected $casts = [
        'annual_quota' => 'integer',
        'requires_attachment' => 'boolean',
        'approval_chain' => 'array',
        'duration_threshold' => 'integer',
    ];

    public function leaves(): HasMany
    {
        return $this->hasMany(Leave::class);
    }

    public function balances(): HasMany
    {
        return $this->hasMany(LeaveBalance::class);
    }
}
