<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RewardTransaction extends Model
{
    protected $fillable = [
        'reward_account_id',
        'purchase_id',
        'type',
        'points',
        'description',
    ];

    public function rewardAccount(): BelongsTo
    {
        return $this->belongsTo(RewardAccount::class);
    }

    public function purchase(): BelongsTo
    {
        return $this->belongsTo(Purchase::class);
    }
}
