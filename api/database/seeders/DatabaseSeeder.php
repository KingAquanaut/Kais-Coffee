<?php

namespace Database\Seeders;

use App\Models\Reward;
use App\Models\RewardAccount;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── Users ──────────────────────────────────────────────────────────

        $admin = User::create([
            'name'     => "Kai",
            'email'    => 'admin@kaiscoffee.com',
            'password' => Hash::make('password'),
            'phone'    => '(555) 010-0001',
            'is_admin' => true,
        ]);

        $customers = [
            ['name' => 'Emma Hartwell',  'email' => 'emma@example.com',   'phone' => '(555) 100-0001'],
            ['name' => 'Liam Nakamura',  'email' => 'liam@example.com',   'phone' => '(555) 100-0002'],
            ['name' => 'Sophia Chen',    'email' => 'sophia@example.com', 'phone' => '(555) 100-0003'],
            ['name' => 'Noah Okafor',    'email' => 'noah@example.com',   'phone' => '(555) 100-0004'],
            ['name' => 'Ava Martinez',   'email' => 'ava@example.com',    'phone' => '(555) 100-0005'],
            ['name' => 'demo',           'email' => 'demo@kaiscoffee.com','phone' => null],
        ];

        foreach ($customers as $data) {
            $user = User::create([
                'name'     => $data['name'],
                'email'    => $data['email'],
                'password' => Hash::make('password'),
                'phone'    => $data['phone'],
            ]);

            $pts = fake()->numberBetween(0, 95);

            RewardAccount::create([
                'user_id'        => $user->id,
                'points_balance' => $pts,
                'lifetime_points'=> $pts + fake()->numberBetween(0, 100),
            ]);
        }

        // ── Menu Categories & Items ────────────────────────────────────────
        $this->call(MenuSeeder::class);

        // ── Page Content ───────────────────────────────────────────────────
        $this->call(PageContentSeeder::class);

        // ── Rewards ────────────────────────────────────────────────────────

        Reward::create([
            'name'           => 'Free Coffee',
            'description'    => 'Collect 8 digital stamps to earn any espresso-based drink on us.',
            'points_required'=> 8,
            'type'           => 'free_item',
            'is_active'      => true,
            'sort_order'     => 1,
        ]);

        // ── Settings ───────────────────────────────────────────────────────

        $settings = [
            ['key' => 'shop_name',          'value' => "Kai's Coffee",                      'cast' => 'string', 'description' => 'Shop display name'],
            ['key' => 'shop_tagline',        'value' => 'Artisan Coffee · Crafted with Care', 'cast' => 'string', 'description' => 'Tagline shown in the header'],
            ['key' => 'stamp_min_purchase',  'value' => '6.00',                              'cast' => 'float',  'description' => 'Minimum purchase total ($) to earn a stamp'],
            ['key' => 'points_for_reward',   'value' => '8',                                 'cast' => 'int',    'description' => 'Stamps required to claim a free coffee'],
            ['key' => 'reward_label',        'value' => 'Free Coffee',                       'cast' => 'string', 'description' => 'Label shown in the app for the reward'],
        ];

        foreach ($settings as $setting) {
            Setting::create($setting);
        }
    }
}
