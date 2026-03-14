<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RewardAccount extends Model
{
    protected $fillable = [
        'user_id',
        'points_balance',
        'lifetime_points',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(RewardTransaction::class);
    }

    /** Points needed to reach the next free coffee (50 pt threshold). */
    public function pointsToNextReward(int $threshold = 50): int
    {
        return max(0, $threshold - ($this->points_balance % $threshold));
    }

    public function canRedeem(int $threshold = 50): bool
    {
        return $this->points_balance >= $threshold;
    }
}
