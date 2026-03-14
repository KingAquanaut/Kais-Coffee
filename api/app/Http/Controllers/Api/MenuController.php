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
            ->with(['activeItems'])
            ->orderBy('sort_order')
            ->get();

        return response()->json($categories);
    }

    public function items(): JsonResponse
    {
        $items = MenuItem::where('is_active', true)
            ->with('category:id,name,slug')
            ->orderBy('sort_order')
            ->get();

        return response()->json($items);
    }

    public function show(MenuItem $item): JsonResponse
    {
        abort_unless($item->is_active, 404);
        return response()->json($item->load('category:id,name,slug'));
    }

    public function featured(): JsonResponse
    {
        $items = MenuItem::where('is_active', true)
            ->where('is_featured', true)
            ->with('category:id,name,slug')
            ->orderBy('sort_order')
            ->limit(8)
            ->get();

        return response()->json($items);
    }
}
