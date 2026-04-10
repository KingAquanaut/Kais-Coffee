<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\MenuCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class MenuCategoryController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            MenuCategory::withCount('items')->orderBy('sort_order')->get()
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'           => ['required', 'string', 'max:100'],
            'name_es'        => ['nullable', 'string', 'max:100'],
            'description'    => ['nullable', 'string'],
            'description_es' => ['nullable', 'string'],
            'image_url'      => ['nullable', 'url'],
            'sort_order'     => ['nullable', 'integer'],
            'is_active'      => ['nullable', 'boolean'],
        ]);

        $data['slug'] = Str::slug($data['name']);

        return response()->json(MenuCategory::create($data), 201);
    }

    public function show(MenuCategory $menuCategory): JsonResponse
    {
        return response()->json($menuCategory->load('items'));
    }

    public function update(Request $request, MenuCategory $menuCategory): JsonResponse
    {
        $data = $request->validate([
            'name'           => ['sometimes', 'string', 'max:100'],
            'name_es'        => ['nullable', 'string', 'max:100'],
            'description'    => ['nullable', 'string'],
            'description_es' => ['nullable', 'string'],
            'image_url'      => ['nullable', 'url'],
            'sort_order'     => ['nullable', 'integer'],
            'is_active'      => ['nullable', 'boolean'],
        ]);

        if (isset($data['name'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        $menuCategory->update($data);

        return response()->json($menuCategory->fresh());
    }

    public function destroy(MenuCategory $menuCategory): JsonResponse
    {
        $menuCategory->delete();

        return response()->json(['message' => 'Category deleted.']);
    }
}
