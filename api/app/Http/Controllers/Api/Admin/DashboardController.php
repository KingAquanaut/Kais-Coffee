<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\MenuItem;
use App\Models\Purchase;
use App\Models\RewardAccount;
use App\Models\RewardTransaction;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $purchasesEnabled = (bool) config('app.features.purchases_enabled');
        $now = now();
        $threshold = (int) Setting::get('points_for_reward', 8);

        $rewardReady = RewardAccount::where('points_balance', '>=', $threshold)->count();
        $redemptionsMonth = RewardTransaction::where('type', 'redeem')
            ->whereMonth('created_at', $now->month)
            ->whereYear('created_at', $now->year)
            ->count();

        $recentRewards = RewardTransaction::with(['rewardAccount.user:id,name'])
            ->latest()
            ->limit(8)
            ->get()
            ->map(function ($tx) {
                return [
                    'id'          => $tx->id,
                    'type'        => $tx->type,
                    'points'      => $tx->points,
                    'description' => $tx->description,
                    'created_at'  => $tx->created_at,
                    'user_name'   => optional(optional($tx->rewardAccount)->user)->name,
                    'user_id'     => optional(optional($tx->rewardAccount)->user)->id,
                ];
            });

        $stats = [
            'total_users'     => User::where('is_admin', false)->count(),
            'active_items'    => MenuItem::where('is_active', true)->count(),
            'reward_ready'    => $rewardReady,
            'redemptions_mo'  => $redemptionsMonth,
            'reward_threshold' => $threshold,
        ];

        $recentPurchases = [];
        $topItems        = [];

        if ($purchasesEnabled) {
            $monthRevenue = Purchase::where('status', 'completed')
                ->whereMonth('created_at', $now->month)
                ->whereYear('created_at', $now->year)
                ->sum('total');

            $stats['total_purchases'] = Purchase::where('status', 'completed')->count();
            $stats['month_revenue']   = number_format((float) $monthRevenue, 2, '.', '');

            $recentPurchases = Purchase::with(['user:id,name,email', 'items'])
                ->latest()
                ->limit(10)
                ->get();

            $topItems = DB::table('purchase_items')
                ->join('purchases', 'purchases.id', '=', 'purchase_items.purchase_id')
                ->where('purchases.status', 'completed')
                ->whereMonth('purchases.created_at', $now->month)
                ->whereYear('purchases.created_at', $now->year)
                ->select('purchase_items.name', DB::raw('SUM(purchase_items.quantity) as qty_sold'))
                ->groupBy('purchase_items.name')
                ->orderByDesc('qty_sold')
                ->limit(5)
                ->get();
        }

        return response()->json([
            'stats'              => $stats,
            'recent_purchases'   => $recentPurchases,
            'top_items'          => $topItems,
            'recent_rewards'     => $recentRewards,
            'purchases_enabled'  => $purchasesEnabled,
        ]);
    }
}
