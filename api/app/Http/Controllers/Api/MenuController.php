<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MenuCategory;
use App\Models\MenuItem;
use Illuminate\Http\JsonResponse;

class MenuController extends Controller
{
    public function categories(): JsonResponse
    {
        $categories = MenuCategory::where('is_active', true)
            ->with(['active_items'])
            ->orderBy('sort_order')
            ->get();

        return response()->json($categories);
    }

    public function items(): JsonResponse
    {
        $items = MenuItem::where('is_active', true)
            ->with(['category:id,name,slug', 'activeVariants'])
            ->orderBy('sort_order')
            ->get();

        return response()->json($items);
    }

    public function show(MenuItem $item): JsonResponse
    {
        abort_unless($item->is_active, 404);
        return response()->json($item->load(['category:id,name,slug', 'activeVariants']));
    }

    public function featured(): JsonResponse
    {
        $items = MenuItem::where('is_active', true)
            ->where('is_featured', true)
            ->with(['category:id,name,slug', 'activeVariants'])
            ->orderBy('sort_order')
            ->limit(8)
            ->get();

        return response()->json($items);
    }

    public function seasonal(): JsonResponse
    {
        $items = MenuItem::where('is_active', true)
            ->where('is_seasonal', true)
            ->with(['category:id,name,slug', 'activeVariants'])
            ->orderBy('sort_order')
            ->limit(2)
            ->get();

        return response()->json($items);
    }

    /**
     * Single hand-picked promotional drink for the home-page hero spotlight.
     * Returns null when no featured drink is set or the configured item is gone/hidden.
     */
    public function promotional(): JsonResponse
    {
        $id = \App\Models\Setting::get('featured_menu_item_id');
        if (! $id) {
            return response()->json(null);
        }

        $item = MenuItem::where('id', $id)
            ->where('is_active', true)
            ->with(['category:id,name,slug', 'activeVariants'])
            ->first();

        return response()->json($item);
    }
}
