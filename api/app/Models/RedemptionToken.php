<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RedemptionToken extends Model
{
    protected $fillable = [
        'user_id',
        'token_hash',
        'expires_at',
        'used_at',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'used_at'    => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    public function isUsed(): bool
    {
        return $this->used_at !== null;
    }

    /**
     * Generate a secure random token, store its hash, and return the raw token.
     * Invalidates any existing unused tokens for this user.
     */
    public static function issue(int $userId, int $ttlSeconds = 60): array
    {
        // Invalidate existing unused tokens for this user
        static::where('user_id', $userId)
            ->whereNull('used_at')
            ->delete();

        $raw  = bin2hex(random_bytes(32)); // 64 hex chars
        $hash = hash('sha256', $raw);

        $token = static::create([
            'user_id'    => $userId,
            'token_hash' => $hash,
            'expires_at' => now()->addSeconds($ttlSeconds),
        ]);

        return [
            'token'      => $raw,
            'expires_at' => $token->expires_at->toIso8601String(),
            'ttl'        => $ttlSeconds,
        ];
    }

    /**
     * Find a valid (unexpired, unused) token by its raw value.
     */
    public static function findByRaw(string $raw): ?static
    {
        $hash = hash('sha256', $raw);

        return static::where('token_hash', $hash)->first();
    }
}
