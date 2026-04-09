<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\RedemptionToken;
use App\Models\RewardAccount;
use App\Models\RewardTransaction;
use App\Models\Setting;
use App\Models\StampToken;
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

    /**
     * Verify a scanned QR token and atomically redeem the reward.
     */
    public function scanRedeem(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => ['required', 'string', 'size:64'],
        ]);

        $redemption = RedemptionToken::findByRaw($data['token']);

        if (! $redemption) {
            return response()->json(['message' => 'Invalid redemption code.'], 404);
        }

        if ($redemption->isUsed()) {
            return response()->json(['message' => 'This code has already been used.'], 409);
        }

        if ($redemption->isExpired()) {
            return response()->json(['message' => 'This code has expired. Ask the customer to generate a new one.'], 410);
        }

        $threshold = (int) Setting::get('points_for_reward', 8);
        $user      = $redemption->user;
        $account   = $user->rewardAccount;

        if (! $account || ! $account->canRedeem($threshold)) {
            return response()->json([
                'message' => "Customer does not have enough stamps. Need {$threshold}, have " . ($account?->points_balance ?? 0) . ".",
            ], 422);
        }

        // Atomic: lock account, redeem, mark token used
        $result = DB::transaction(function () use ($account, $threshold, $request, $redemption) {
            $locked = RewardAccount::lockForUpdate()->find($account->id);

            if (! $locked || $locked->points_balance < $threshold) {
                return null;
            }

            // Mark token used (inside transaction for atomicity)
            $redemption->update(['used_at' => now()]);

            $locked->decrement('points_balance', $threshold);

            RewardTransaction::create([
                'reward_account_id' => $locked->id,
                'type'              => 'redeem',
                'points'            => -$threshold,
                'description'       => "QR redemption by {$request->user()->name}",
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
            'customer'        => [
                'id'   => $user->id,
                'name' => $user->name,
            ],
            'points_balance'  => $result->points_balance,
            'lifetime_points' => $result->lifetime_points,
            'can_redeem'      => $result->canRedeem($threshold),
        ]);
    }

    /**
     * Verify a scanned stamp QR token and atomically award 1 stamp.
     */
    public function scanStamp(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => ['required', 'string', 'size:64'],
        ]);

        $stampToken = StampToken::findByRaw($data['token']);

        if (! $stampToken) {
            return response()->json(['message' => 'Invalid stamp code.'], 404);
        }

        if ($stampToken->isUsed()) {
            return response()->json(['message' => 'This code has already been used.'], 409);
        }

        if ($stampToken->isExpired()) {
            return response()->json(['message' => 'This code has expired. Ask the customer to generate a new one.'], 410);
        }

        $user    = $stampToken->user;
        $threshold = (int) Setting::get('points_for_reward', 8);

        // Atomic: lock account, award stamp, mark token used
        $result = DB::transaction(function () use ($user, $stampToken, $request) {
            $account = RewardAccount::firstOrCreate(
                ['user_id' => $user->id],
                ['points_balance' => 0, 'lifetime_points' => 0]
            );

            $locked = RewardAccount::lockForUpdate()->find($account->id);

            // Mark token used (inside transaction for atomicity)
            $stampToken->update(['used_at' => now()]);

            $locked->increment('points_balance', 1);
            $locked->increment('lifetime_points', 1);

            RewardTransaction::create([
                'reward_account_id' => $locked->id,
                'type'              => 'earn',
                'points'            => 1,
                'description'       => "QR stamp by {$request->user()->name}",
            ]);

            return $locked->fresh();
        });

        return response()->json([
            'message'         => 'Stamp added!',
            'customer'        => [
                'id'   => $user->id,
                'name' => $user->name,
            ],
            'points_balance'  => $result->points_balance,
            'lifetime_points' => $result->lifetime_points,
            'can_redeem'      => $result->canRedeem($threshold),
        ]);
    }
}
