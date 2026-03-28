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
        $password = env('DEFAULT_ADMIN_PASSWORD');

        $attributes = [
            'name'     => 'Admin',
            'is_admin' => true,
        ];

        // Only set/overwrite the password when the env var is present.
        // This means:
        //   - First run with env var set: creates the account with that password.
        //   - Subsequent runs without env var: updates name/is_admin but leaves
        //     the existing password untouched.
        //   - Subsequent runs WITH env var: resets the password (useful if you
        //     need to rotate it after a compromise).
        if ($password !== null) {
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
