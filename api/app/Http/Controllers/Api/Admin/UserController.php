<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\RewardAccount;
use App\Models\RewardTransaction;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::with('rewardAccount')->where('is_admin', false);

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('name', 'ilike', "%{$s}%")
                  ->orWhere('email', 'ilike', "%{$s}%");
            });
        }

        return response()->json($query->latest()->paginate(25));
    }

    public function show(User $user): JsonResponse
    {
        $threshold = (int) Setting::get('points_for_reward', 8);
        $account   = $user->rewardAccount;

        return response()->json([
            'user' => $user->load([
                'rewardAccount',
                'purchases' => fn ($q) => $q->with('items')->latest()->limit(10),
            ]),
            'reward_summary' => [
                'points_balance'  => $account?->points_balance ?? 0,
                'lifetime_points' => $account?->lifetime_points ?? 0,
                'threshold'       => $threshold,
                'can_redeem'      => $account?->canRedeem($threshold) ?? false,
            ],
        ]);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'name'                => ['sometimes', 'string', 'max:255'],
            'email'               => ['sometimes', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'phone'               => ['nullable', 'string', 'max:30'],
            'language_preference' => ['nullable', 'string', 'in:en,es'],
        ]);

        $user->update($data);

        return response()->json(
            $user->fresh()->load('rewardAccount')
        );
    }

    /**
     * Adjust a customer's stamp balance (admin manual adjustment).
     */
    public function adjustStamps(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'amount' => ['required', 'integer', 'between:-100,100', 'not_in:0'],
            'reason' => ['required', 'string', 'max:500'],
        ]);

        $amount = (int) $data['amount'];

        // Ensure account exists before entering the locked transaction
        $account = RewardAccount::firstOrCreate(
            ['user_id' => $user->id],
            ['points_balance' => 0, 'lifetime_points' => 0]
        );

        $result = DB::transaction(function () use ($account, $amount, $data) {
            $locked = RewardAccount::lockForUpdate()->find($account->id);

            // Prevent negative balance (checked under lock)
            if ($amount < 0 && $locked->points_balance + $amount < 0) {
                return ['error' => 'Cannot reduce stamps below 0. Current balance: ' . $locked->points_balance];
            }

            $locked->increment('points_balance', $amount);
            if ($amount > 0) {
                $locked->increment('lifetime_points', $amount);
            }

            RewardTransaction::create([
                'reward_account_id' => $locked->id,
                'type'              => 'adjust',
                'points'            => $amount,
                'description'       => "Admin adjustment: {$data['reason']}",
            ]);

            return $locked->fresh();
        });

        // Handle the negative-balance error case
        if (is_array($result) && isset($result['error'])) {
            return response()->json(['message' => $result['error']], 422);
        }

        $threshold = (int) Setting::get('points_for_reward', 8);

        return response()->json([
            'message'         => "Stamps adjusted by {$amount}.",
            'points_balance'  => $result->points_balance,
            'lifetime_points' => $result->lifetime_points,
            'can_redeem'      => $result->canRedeem($threshold),
        ]);
    }

    /**
     * Redeem a reward on behalf of a customer (barista/admin action).
     */
    public function redeemReward(Request $request, User $user): JsonResponse
    {
        $threshold = (int) Setting::get('points_for_reward', 8);
        $account   = $user->rewardAccount;

        if (! $account || ! $account->canRedeem($threshold)) {
            return response()->json([
                'message' => "Customer does not have enough stamps. Need {$threshold}, have " . ($account?->points_balance ?? 0) . ".",
            ], 422);
        }

        // Use DB transaction with lock to prevent double redemption
        $result = DB::transaction(function () use ($account, $threshold, $request) {
            $locked = RewardAccount::lockForUpdate()->find($account->id);

            if (! $locked || $locked->points_balance < $threshold) {
                return null; // concurrent redemption already happened
            }

            $locked->decrement('points_balance', $threshold);

            RewardTransaction::create([
                'reward_account_id' => $locked->id,
                'type'              => 'redeem',
                'points'            => -$threshold,
                'description'       => "Free coffee redeemed by admin ({$request->user()->name})",
            ]);

            return $locked->fresh();
        });

        if (! $result) {
            return response()->json([
                'message' => 'Reward already redeemed or insufficient stamps.',
            ], 409);
        }

        return response()->json([
            'message'         => 'Free coffee redeemed successfully!',
            'points_balance'  => $result->points_balance,
            'lifetime_points' => $result->lifetime_points,
            'can_redeem'      => $result->canRedeem($threshold),
        ]);
    }
}
