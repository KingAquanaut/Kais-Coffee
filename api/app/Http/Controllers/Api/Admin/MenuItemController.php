<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\MenuItem;
use App\Models\Setting;
use App\Services\UploadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str; // used for slug generation

/**
 * Setting key used to store the id of the current home-page promotional drink.
 * Empty string / missing means "no spotlight, fall back to default hero".
 */
const FEATURED_DRINK_SETTING_KEY = 'featured_menu_item_id';

class MenuItemController extends Controller
{
    /**
     * Validation rules for an inline variants array.
     * Variants are size/price options on a drink (e.g. 12oz $6 / 16oz $7).
     */
    private function variantRules(): array
    {
        return [
            'variants'                => ['nullable', 'array'],
            'variants.*.id'           => ['nullable', 'integer'],
            'variants.*.size_label'   => ['required_with:variants', 'string', 'max:50'],
            'variants.*.price'        => ['required_with:variants', 'numeric', 'min:0'],
            'variants.*.sort_order'   => ['nullable', 'integer'],
            'variants.*.is_active'    => ['nullable', 'boolean'],
        ];
    }

    /**
     * Sync variants on the given item: update existing rows by id, create new rows
     * (rows without an id), and delete any existing rows not represented in the array.
     * Called from store() and update() when 'variants' is present in the payload.
     */
    private function syncVariants(MenuItem $menuItem, array $variants): void
    {
        $keepIds = [];
        foreach ($variants as $i => $v) {
            $payload = [
                'size_label' => $v['size_label'],
                'price'      => $v['price'],
                'sort_order' => $v['sort_order'] ?? $i,
                'is_active'  => array_key_exists('is_active', $v) ? (bool) $v['is_active'] : true,
            ];

            if (! empty($v['id'])) {
                $existing = $menuItem->variants()->whereKey($v['id'])->first();
                if ($existing) {
                    $existing->update($payload);
                    $keepIds[] = $existing->id;
                    continue;
                }
            }

            $created = $menuItem->variants()->create($payload);
            $keepIds[] = $created->id;
        }

        $menuItem->variants()->whereNotIn('id', $keepIds)->delete();
    }

    public function index(Request $request): JsonResponse
    {
        $query = MenuItem::with(['category:id,name,slug', 'variants'])->orderBy('sort_order');

        if ($request->filled('category_id')) {
            $query->where('menu_category_id', $request->category_id);
        }

        return response()->json($query->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate(array_merge([
            'menu_category_id' => ['required', 'exists:menu_categories,id'],
            'name'             => ['required', 'string', 'max:200'],
            'name_es'          => ['nullable', 'string', 'max:200'],
            'description'      => ['nullable', 'string'],
            'description_es'   => ['nullable', 'string'],
            'price'            => ['required', 'numeric', 'min:0'],
            'image_url'        => ['nullable', 'url'],
            'is_active'        => ['nullable', 'boolean'],
            'is_featured'      => ['nullable', 'boolean'],
            'is_seasonal'      => ['nullable', 'boolean'],
            'sort_order'       => ['nullable', 'integer'],
        ], $this->variantRules()));

        $variants = $data['variants'] ?? null;
        unset($data['variants']);

        $data['slug'] = Str::slug($data['name']) . '-' . Str::random(4);

        $menuItem = MenuItem::create($data);

        if (is_array($variants)) {
            $this->syncVariants($menuItem, $variants);
        }

        return response()->json(
            $menuItem->load(['category:id,name,slug', 'variants']),
            201
        );
    }

    // Note: route-bound parameter is named $item because the apiResource route is
    // /admin/menu/items/{item}. Laravel's implicit route-model binding matches by
    // parameter NAME, so using $menuItem here would silently inject a fresh empty
    // model instead of the bound row.
    public function show(MenuItem $item): JsonResponse
    {
        return response()->json($item->load(['category:id,name,slug', 'variants']));
    }

    public function update(Request $request, MenuItem $item): JsonResponse
    {
        $data = $request->validate(array_merge([
            'menu_category_id' => ['sometimes', 'exists:menu_categories,id'],
            'name'             => ['sometimes', 'string', 'max:200'],
            'name_es'          => ['nullable', 'string', 'max:200'],
            'description'      => ['nullable', 'string'],
            'description_es'   => ['nullable', 'string'],
            'price'            => ['sometimes', 'numeric', 'min:0'],
            'image_url'        => ['nullable', 'url'],
            'is_active'        => ['sometimes', 'boolean'],
            'is_featured'      => ['sometimes', 'boolean'],
            'is_seasonal'      => ['sometimes', 'boolean'],
            'sort_order'       => ['nullable', 'integer'],
        ], $this->variantRules()));

        $variants = $request->has('variants') ? ($data['variants'] ?? []) : null;
        unset($data['variants']);

        if (isset($data['name'])) {
            $data['slug'] = Str::slug($data['name']) . '-' . Str::random(4);
        }

        // Ensure boolean toggles are explicitly set even when false
        foreach (['is_active', 'is_featured', 'is_seasonal'] as $toggle) {
            if ($request->has($toggle)) {
                $data[$toggle] = (bool) $request->input($toggle);
            }
        }

        $item->update($data);

        if (is_array($variants)) {
            $this->syncVariants($item, $variants);
        }

        $item->refresh();

        return response()->json($item->load(['category:id,name,slug', 'variants']));
    }

    public function destroy(MenuItem $item): JsonResponse
    {
        $item->update(['is_active' => false]);
        $item->delete();

        // If the deleted item was the spotlight, clear the setting.
        if ((int) Setting::get(FEATURED_DRINK_SETTING_KEY) === $item->id) {
            Setting::updateOrCreate(
                ['key' => FEATURED_DRINK_SETTING_KEY],
                ['value' => null],
            );
        }

        return response()->json(['message' => 'Item deleted.']);
    }

    /**
     * Return the currently configured home-page spotlight drink (or null).
     */
    public function featuredShow(): JsonResponse
    {
        $id = Setting::get(FEATURED_DRINK_SETTING_KEY);
        if (! $id) {
            return response()->json(['menu_item_id' => null, 'item' => null]);
        }

        $item = MenuItem::with(['category:id,name,slug', 'variants'])->find($id);
        return response()->json([
            'menu_item_id' => $item?->id,
            'item'         => $item,
        ]);
    }

    /**
     * Set or clear the home-page spotlight drink.
     * Body: { menu_item_id: number|null }
     */
    public function featuredUpdate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'menu_item_id' => ['nullable', 'integer', 'exists:menu_items,id'],
        ]);

        Setting::updateOrCreate(
            ['key' => FEATURED_DRINK_SETTING_KEY],
            [
                'value'       => $data['menu_item_id'] !== null ? (string) $data['menu_item_id'] : null,
                'cast'        => 'int',
                'description' => 'Home-page promotional drink (single spotlight). null = no spotlight.',
            ],
        );

        return $this->featuredShow();
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
