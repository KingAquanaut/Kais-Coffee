<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RedemptionToken;
use App\Models\RewardAccount;
use App\Models\RewardTransaction;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccountController extends Controller
{
    public function dashboard(Request $request): JsonResponse
    {
        $user    = $request->user()->load('rewardAccount');
        $account = $user->rewardAccount;
        $threshold = (int) Setting::get('points_for_reward', 8);

        $recentPurchases = $user->purchases()
            ->with('items')
            ->latest()
            ->limit(5)
            ->get();

        return response()->json([
            'user'             => $user,
            'points_balance'   => $account?->points_balance ?? 0,
            'lifetime_points'  => $account?->lifetime_points ?? 0,
            'points_threshold' => $threshold,
            'points_to_next'   => $account ? $account->pointsToNextReward($threshold) : $threshold,
            'can_redeem'       => $account?->canRedeem($threshold) ?? false,
            'recent_purchases' => $recentPurchases,
        ]);
    }

    public function purchases(Request $request): JsonResponse
    {
        $purchases = $request->user()
            ->purchases()
            ->with('items')
            ->latest()
            ->paginate(20);

        return response()->json($purchases);
    }

    public function rewardsBalance(Request $request): JsonResponse
    {
        $account   = $request->user()->rewardAccount;
        $threshold = (int) Setting::get('points_for_reward', 8);

        return response()->json([
            'points_balance'   => $account?->points_balance ?? 0,
            'lifetime_points'  => $account?->lifetime_points ?? 0,
            'points_threshold' => $threshold,
            'points_to_next'   => $account ? $account->pointsToNextReward($threshold) : $threshold,
            'can_redeem'       => $account?->canRedeem($threshold) ?? false,
        ]);
    }

    public function rewardsHistory(Request $request): JsonResponse
    {
        $account = $request->user()->rewardAccount;

        if (! $account) {
            return response()->json(['data' => []]);
        }

        return response()->json(
            $account->transactions()
                ->with('purchase:id,total,created_at')
                ->latest()
                ->paginate(30)
        );
    }

    public function redeem(Request $request): JsonResponse
    {
        $threshold = (int) Setting::get('points_for_reward', 8);
        $account   = $request->user()->rewardAccount;

        if (! $account || ! $account->canRedeem($threshold)) {
            return response()->json([
                'message' => "You need {$threshold} stamps to redeem a free coffee.",
            ], 422);
        }

        $account->decrement('points_balance', $threshold);

        RewardTransaction::create([
            'reward_account_id' => $account->id,
            'type'              => 'redeem',
            'points'            => -$threshold,
            'description'       => 'Redeemed 8 stamps for a free coffee',
        ]);

        return response()->json([
            'message'        => 'Redeemed! Enjoy your free coffee.',
            'points_balance' => $account->fresh()->points_balance,
        ]);
    }

    /**
     * Generate a short-lived QR redemption token.
     * Only allowed when customer has a redeemable reward.
     */
    public function generateQrToken(Request $request): JsonResponse
    {
        $threshold = (int) Setting::get('points_for_reward', 8);
        $account   = $request->user()->rewardAccount;

        if (! $account || ! $account->canRedeem($threshold)) {
            return response()->json([
                'message' => "You need {$threshold} stamps to generate a redemption code.",
            ], 422);
        }

        $result = RedemptionToken::issue($request->user()->id, 60);

        return response()->json([
            'token'      => $result['token'],
            'expires_at' => $result['expires_at'],
            'ttl'        => $result['ttl'],
        ]);
    }
}
