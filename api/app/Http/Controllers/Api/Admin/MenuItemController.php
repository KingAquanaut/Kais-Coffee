<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\MenuItem;
use App\Services\UploadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str; // used for slug generation

class MenuItemController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = MenuItem::with('category:id,name,slug')->orderBy('sort_order');

        if ($request->filled('category_id')) {
            $query->where('menu_category_id', $request->category_id);
        }

        return response()->json($query->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'menu_category_id' => ['required', 'exists:menu_categories,id'],
            'name'             => ['required', 'string', 'max:200'],
            'name_es'          => ['nullable', 'string', 'max:200'],
            'description'      => ['nullable', 'string'],
            'price'            => ['required', 'numeric', 'min:0'],
            'image_url'        => ['nullable', 'url'],
            'is_active'        => ['nullable', 'boolean'],
            'is_featured'      => ['nullable', 'boolean'],
            'is_seasonal'      => ['nullable', 'boolean'],
            'sort_order'       => ['nullable', 'integer'],
        ]);

        $data['slug'] = Str::slug($data['name']) . '-' . Str::random(4);

        return response()->json(
            MenuItem::create($data)->load('category:id,name,slug'), 201
        );
    }

    public function show(MenuItem $menuItem): JsonResponse
    {
        return response()->json($menuItem->load('category:id,name,slug'));
    }

    public function update(Request $request, MenuItem $menuItem): JsonResponse
    {
        $data = $request->validate([
            'menu_category_id' => ['sometimes', 'exists:menu_categories,id'],
            'name'             => ['sometimes', 'string', 'max:200'],
            'name_es'          => ['nullable', 'string', 'max:200'],
            'description'      => ['nullable', 'string'],
            'price'            => ['sometimes', 'numeric', 'min:0'],
            'image_url'        => ['nullable', 'url'],
            'is_active'        => ['nullable', 'boolean'],
            'is_featured'      => ['nullable', 'boolean'],
            'is_seasonal'      => ['nullable', 'boolean'],
            'sort_order'       => ['nullable', 'integer'],
        ]);

        if (isset($data['name'])) {
            $data['slug'] = Str::slug($data['name']) . '-' . Str::random(4);
        }

        $menuItem->update($data);
        $menuItem->refresh();

        return response()->json($menuItem->load('category:id,name,slug'));
    }

    public function destroy(MenuItem $menuItem): JsonResponse
    {
        $menuItem->update(['is_active' => false]);
        $menuItem->delete();

        return response()->json(['message' => 'Item deleted.']);
    }

    /**
     * Upload (or replace) the image for a menu item.
     */
    public function uploadImage(Request $request, MenuItem $menuItem, UploadService $uploads): JsonResponse
    {
        $request->validate([
            'image' => ['required', 'file', 'image', 'max:20480', 'mimes:jpeg,png,gif,webp'],
        ]);

        if ($menuItem->image_url) {
            $uploads->delete($menuItem->image_url);
        }

        $imageUrl = $uploads->store($request->file('image'), 'menu-items');

        $menuItem->update(['image_url' => $imageUrl]);
        $menuItem->refresh();

        return response()->json($menuItem->load('category:id,name,slug'));
    }
}
