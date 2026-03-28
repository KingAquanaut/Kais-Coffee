<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Ensures the primary admin account exists.
 *
 * Safe to run repeatedly — uses updateOrCreate so it never duplicates
 * and never overwrites the password if the account already exists
 * (unless DEFAULT_ADMIN_PASSWORD is explicitly set in the environment).
 *
 * Production usage:
 *   php artisan db:seed --class=AdminUserSeeder --force
 */
class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $password = env('DEFAULT_ADMIN_PASSWORD', 'password');

        $attributes = [
            'name'     => 'Admin',
            'is_admin' => true,
        ];

        // Only set/overwrite the password when creating a new account
        // or when DEFAULT_ADMIN_PASSWORD is explicitly set in the environment.
        $existing = User::where('email', 'admin@kaiscoffee.com')->first();

        if (!$existing || env('DEFAULT_ADMIN_PASSWORD') !== null) {
            $attributes['password'] = Hash::make($password);
        }

        $user = User::updateOrCreate(
            ['email' => 'admin@kaiscoffee.com'],
            $attributes,
        );

        // Ensure the admin has a reward account (required by dashboard).
        $user->rewardAccount()->firstOrCreate([], [
            'points_balance'  => 0,
            'lifetime_points' => 0,
        ]);

        $this->command?->info("Admin user ensured: {$user->email} (id={$user->id})");
    }
}
