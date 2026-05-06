<?php

namespace Tests\Feature;

use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MenuVariantsTest extends TestCase
{
    use RefreshDatabase;

    private function makeAdmin(): User
    {
        $user = User::create([
            'name'     => 'Admin',
            'email'    => 'admin@example.test',
            'password' => Hash::make('password'),
        ]);
        $user->is_admin = true;
        $user->save();
        return $user;
    }

    private function category(): MenuCategory
    {
        return MenuCategory::create([
            'name' => 'Coffee', 'slug' => 'coffee',
            'sort_order' => 1, 'is_active' => true,
        ]);
    }

    public function test_admin_can_create_item_with_size_variants(): void
    {
        Sanctum::actingAs($this->makeAdmin());
        $cat = $this->category();

        $res = $this->postJson('/api/v1/admin/menu/items', [
            'menu_category_id' => $cat->id,
            'name'  => 'Latte',
            'price' => 6.00,
            'variants' => [
                ['size_label' => '12 oz', 'price' => 6.00, 'sort_order' => 0, 'is_active' => true],
                ['size_label' => '16 oz', 'price' => 7.00, 'sort_order' => 1, 'is_active' => true],
            ],
        ]);

        $res->assertStatus(201);
        $res->assertJsonCount(2, 'variants');
        $res->assertJsonPath('variants.0.size_label', '12 oz');
        $res->assertJsonPath('variants.1.size_label', '16 oz');
    }

    public function test_admin_can_sync_variants_on_update_replacing_old_set(): void
    {
        $admin = $this->makeAdmin();
        Sanctum::actingAs($admin);
        $cat = $this->category();

        $item = MenuItem::create([
            'menu_category_id' => $cat->id,
            'name'  => 'Tea', 'slug' => 'tea-' . uniqid(),
            'price' => 4.00, 'is_active' => true,
        ]);
        $item->variants()->create(['size_label' => '12 oz', 'price' => 4, 'sort_order' => 0, 'is_active' => true]);

        $existing = $item->variants()->first();

        $res = $this->putJson("/api/v1/admin/menu/items/{$item->id}", [
            'variants' => [
                // Update existing
                ['id' => $existing->id, 'size_label' => '12 oz', 'price' => 4.50, 'sort_order' => 0, 'is_active' => true],
                // New row
                ['size_label' => '16 oz', 'price' => 5.50, 'sort_order' => 1, 'is_active' => true],
            ],
        ]);

        $res->assertOk();
        $res->assertJsonCount(2, 'variants');
        $this->assertEquals('4.50', $item->variants()->find($existing->id)->price);
    }

    public function test_admin_can_change_category_on_existing_item(): void
    {
        Sanctum::actingAs($this->makeAdmin());

        $catA = $this->category();
        $catB = MenuCategory::create([
            'name' => 'Tea', 'slug' => 'tea-cat',
            'sort_order' => 2, 'is_active' => true,
        ]);
        $item = MenuItem::create([
            'menu_category_id' => $catA->id,
            'name'  => 'Earl Grey', 'slug' => 'earl-grey-' . uniqid(),
            'price' => 3.50, 'is_active' => true,
        ]);

        $res = $this->putJson("/api/v1/admin/menu/items/{$item->id}", [
            'menu_category_id' => $catB->id,
        ]);

        $res->assertOk();
        $this->assertEquals($catB->id, $item->fresh()->menu_category_id);
    }

    public function test_public_promotional_endpoint_returns_configured_item(): void
    {
        $cat = $this->category();
        $item = MenuItem::create([
            'menu_category_id' => $cat->id,
            'name' => 'Spotlight Coffee', 'slug' => 'spotlight-' . uniqid(),
            'price' => 5.00, 'is_active' => true,
        ]);

        Setting::updateOrCreate(['key' => 'featured_menu_item_id'], ['value' => (string) $item->id, 'cast' => 'int']);

        $res = $this->getJson('/api/v1/menu/promotional');
        $res->assertOk();
        $res->assertJsonPath('id', $item->id);
        $res->assertJsonPath('name', 'Spotlight Coffee');
    }

    public function test_public_promotional_endpoint_returns_null_when_unset(): void
    {
        $res = $this->getJson('/api/v1/menu/promotional');
        $res->assertOk();
        $this->assertNull($res->json());
    }

    public function test_admin_can_set_and_clear_featured_drink(): void
    {
        Sanctum::actingAs($this->makeAdmin());
        $cat = $this->category();
        $item = MenuItem::create([
            'menu_category_id' => $cat->id,
            'name' => 'Latte', 'slug' => 'latte-' . uniqid(),
            'price' => 5.00, 'is_active' => true,
        ]);

        // Set
        $set = $this->putJson('/api/v1/admin/menu/featured-drink', ['menu_item_id' => $item->id]);
        $set->assertOk();
        $set->assertJsonPath('menu_item_id', $item->id);

        // Clear
        $clear = $this->putJson('/api/v1/admin/menu/featured-drink', ['menu_item_id' => null]);
        $clear->assertOk();
        $clear->assertJsonPath('menu_item_id', null);
    }
}
