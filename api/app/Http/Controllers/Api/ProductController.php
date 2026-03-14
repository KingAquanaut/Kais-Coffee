<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    /** Public: list active products for the menu. */
    public function index(): JsonResponse
    {
        $products = Product::where('is_active', true)
            ->orderBy('category')
            ->orderBy('sort_order')
            ->get();

        return response()->json($products);
    }

    public function show(Product $product): JsonResponse
    {
        return response()->json($product);
    }

    // Admin CRUD stubs — implemented in a future sprint
    public function store(Request $request): JsonResponse
    {
        // TODO: implement
        return response()->json(['message' => 'Not implemented'], 501);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        // TODO: implement
        return response()->json(['message' => 'Not implemented'], 501);
    }

    public function destroy(Product $product): JsonResponse
    {
        // TODO: implement
        return response()->json(['message' => 'Not implemented'], 501);
    }
}
