<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Department extends Model
{
    public const TYPE_FINANCE = 'finance';

    public const TYPE_HR = 'hr';

    public const TYPE_GENERAL = 'general';

    protected $fillable = [
        'name',
        'short_code',
        'type',
        'color_scheme',
        'status',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => 'boolean',
        ];
    }

    /**
     * @return \Illuminate\Database\Eloquent\Builder<static>
     */
    public function scopeActive($query)
    {
        return $query->where('status', true);
    }

    public function scopeFinance($query)
    {
        return $query->where('type', self::TYPE_FINANCE);
    }

    public function scopeHr($query)
    {
        return $query->where('type', self::TYPE_HR);
    }

    /**
     * @return HasMany<User, $this>
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
}
