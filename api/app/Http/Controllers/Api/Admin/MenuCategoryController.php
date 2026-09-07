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

        $data['slug'] = $this->uniqueSlug($data['name']);

        return response()->json(MenuCategory::create($data), 201);
    }

    /**
     * Build a URL-safe slug that is unique across menu_categories. Appends an
     * incrementing suffix ("cold-brew-2") when the base slug is already taken so
     * two categories with the same/similar name never collide on the unique index.
     */
    private function uniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name) ?: 'category';
        $slug = $base;
        $n = 1;

        while (
            MenuCategory::where('slug', $slug)
                ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $slug = $base . '-' . (++$n);
        }

        return $slug;
    }

    // Route-bound parameter is named $category because the apiResource route is
    // /admin/menu/categories/{category}. Laravel's implicit binding matches by
    // parameter name; using $menuCategory here would skip the binding and inject
    // a fresh empty model instead of the bound row.
    public function show(MenuCategory $category): JsonResponse
    {
        return response()->json($category->load('items'));
    }

    public function update(Request $request, MenuCategory $category): JsonResponse
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
            $data['slug'] = $this->uniqueSlug($data['name'], $category->id);
        }

        $category->update($data);

        return response()->json($category->fresh());
    }

    public function destroy(MenuCategory $category): JsonResponse
    {
        $category->delete();

        return response()->json(['message' => 'Category deleted.']);
    }
}
