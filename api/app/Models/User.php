<?php

namespace App\Models;

use App\Mail\ResetPasswordMail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'language_preference',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_admin' => 'boolean',
        ];
    }

    public function rewardAccount(): HasOne
    {
        return $this->hasOne(RewardAccount::class);
    }

    public function purchases(): HasMany
    {
        return $this->hasMany(Purchase::class);
    }

    public function staffPurchases(): HasMany
    {
        return $this->hasMany(Purchase::class, 'staff_id');
    }

    /**
     * Send the password reset notification with a link to the frontend app.
     */
    public function sendPasswordResetNotification($token): void
    {
        $url = config('app.frontend_url')
            . '/auth/reset-password?token=' . $token
            . '&email=' . urlencode($this->email);

        Mail::to($this->email)->send(new ResetPasswordMail(
            resetUrl: $url,
            userName: $this->name,
        ));
    }
}
