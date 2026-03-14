<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\MenuItem;
use App\Models\Purchase;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $now = now();

        $monthRevenue = Purchase::where('status', 'completed')
            ->whereMonth('created_at', $now->month)
            ->whereYear('created_at', $now->year)
            ->sum('total');

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

        return response()->json([
            'stats' => [
                'total_users'     => User::where('is_admin', false)->count(),
                'total_purchases' => Purchase::where('status', 'completed')->count(),
                'month_revenue'   => number_format((float) $monthRevenue, 2, '.', ''),
                'active_items'    => MenuItem::where('is_active', true)->count(),
            ],
            'recent_purchases' => $recentPurchases,
            'top_items'        => $topItems,
        ]);
    }
}
