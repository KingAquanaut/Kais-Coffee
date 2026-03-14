<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\MenuItem;
use App\Models\Purchase;
use App\Models\RewardAccount;
use App\Models\RewardTransaction;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PurchaseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Purchase::with(['user:id,name,email', 'staff:id,name', 'items'])->latest();

        if ($request->filled('status'))  { $query->where('status', $request->status); }
        if ($request->filled('user_id')) { $query->where('user_id', $request->user_id); }

        return response()->json($query->paginate(25));
    }

    public function show(Purchase $purchase): JsonResponse
    {
        return response()->json($purchase->load(['user:id,name,email', 'staff:id,name', 'items']));
    }

    /**
     * Record a new purchase and award a digital stamp.
     * Rule: earn 1 stamp when the purchase total is >= stamp_min_purchase ($6 default).
     * After stamp_for_reward (8) stamps, the customer can redeem a free coffee.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'user_id'              => ['required', 'exists:users,id'],
            'items'                => ['required', 'array', 'min:1'],
            'items.*.menu_item_id' => ['required', 'exists:menu_items,id'],
            'items.*.quantity'     => ['required', 'integer', 'min:1'],
            'redeem_reward'        => ['nullable', 'boolean'],
            'notes'                => ['nullable', 'string', 'max:500'],
        ]);

        $threshold        = (int)   Setting::get('points_for_reward',  8);
        $stampMinPurchase = (float) Setting::get('stamp_min_purchase', 6.00);

        $purchase = DB::transaction(function () use ($data, $request, $threshold, $stampMinPurchase) {
            $subtotal      = 0;
            $purchaseItems = [];

            foreach ($data['items'] as $line) {
                $menuItem  = MenuItem::findOrFail($line['menu_item_id']);
                $qty       = (int) $line['quantity'];
                $lineTotal = round((float) $menuItem->price * $qty, 2);
                $subtotal += $lineTotal;

                $purchaseItems[] = [
                    'menu_item_id' => $menuItem->id,
                    'name'         => $menuItem->name,
                    'unit_price'   => $menuItem->price,
                    'quantity'     => $qty,
                    'subtotal'     => $lineTotal,
                ];
            }

            $redeemReward   = $data['redeem_reward'] ?? false;
            $stampsRedeemed = 0;
            $discount       = 0;

            $rewardAccount = RewardAccount::firstOrCreate(
                ['user_id' => $data['user_id']],
                ['points_balance' => 0, 'lifetime_points' => 0]
            );

            if ($redeemReward && $rewardAccount->canRedeem($threshold)) {
                $stampsRedeemed = $threshold;
                $minPrice       = collect($purchaseItems)->min('unit_price');
                $discount       = round(min((float) $minPrice, $subtotal), 2);
            }

            $total = max(0, round($subtotal - $discount, 2));

            // Award 1 stamp when the purchase total meets the minimum threshold
            $stampsEarned = ($total >= $stampMinPurchase) ? 1 : 0;

            $purchase = Purchase::create([
                'user_id'         => $data['user_id'],
                'staff_id'        => $request->user()->id,
                'subtotal'        => $subtotal,
                'discount'        => $discount,
                'total'           => $total,
                'points_earned'   => $stampsEarned,
                'points_redeemed' => $stampsRedeemed,
                'notes'           => $data['notes'] ?? null,
                'status'          => 'completed',
            ]);

            $purchase->items()->createMany($purchaseItems);

            if ($stampsEarned > 0) {
                $rewardAccount->increment('points_balance',  $stampsEarned);
                $rewardAccount->increment('lifetime_points', $stampsEarned);

                RewardTransaction::create([
                    'reward_account_id' => $rewardAccount->id,
                    'purchase_id'       => $purchase->id,
                    'type'              => 'earn',
                    'points'            => $stampsEarned,
                    'description'       => "Earned 1 stamp — purchase #{$purchase->id}",
                ]);
            }

            if ($stampsRedeemed > 0) {
                $rewardAccount->decrement('points_balance', $stampsRedeemed);

                RewardTransaction::create([
                    'reward_account_id' => $rewardAccount->id,
                    'purchase_id'       => $purchase->id,
                    'type'              => 'redeem',
                    'points'            => -$stampsRedeemed,
                    'description'       => "Redeemed {$stampsRedeemed} stamps for a free coffee",
                ]);
            }

            return $purchase->load(['user:id,name,email', 'items']);
        });

        return response()->json($purchase, 201);
    }

    public function void(Purchase $purchase): JsonResponse
    {
        if ($purchase->status === 'voided') {
            return response()->json(['message' => 'Already voided.'], 422);
        }

        DB::transaction(function () use ($purchase) {
            $purchase->update(['status' => 'voided']);

            if ($purchase->points_earned > 0) {
                $account = RewardAccount::where('user_id', $purchase->user_id)->first();
                if ($account) {
                    $deduct = min($purchase->points_earned, $account->points_balance);
                    $account->decrement('points_balance', $deduct);
                    $account->decrement('lifetime_points', $purchase->points_earned);

                    RewardTransaction::create([
                        'reward_account_id' => $account->id,
                        'purchase_id'       => $purchase->id,
                        'type'              => 'adjust',
                        'points'            => -$purchase->points_earned,
                        'description'       => "Stamp reversed — purchase #{$purchase->id} voided",
                    ]);
                }
            }
        });

        return response()->json(['message' => 'Purchase voided.']);
    }
}
