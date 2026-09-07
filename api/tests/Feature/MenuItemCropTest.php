<?php

namespace Tests\Feature;

use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MenuItemCropTest extends TestCase
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

    public function test_admin_can_store_item_with_crop_metadata(): void
    {
        Sanctum::actingAs($this->makeAdmin());
        $cat = $this->category();

        $res = $this->postJson('/api/v1/admin/menu/items', [
            'menu_category_id' => $cat->id,
            'name'  => 'Latte',
            'price' => 6.00,
            'image_crop' => ['x' => 0.1, 'y' => 0.2, 'w' => 0.5, 'h' => 0.5],
        ]);

        $res->assertStatus(201);
        $res->assertJsonPath('image_crop.x', 0.1);
        $res->assertJsonPath('image_crop.w', 0.5);

        // Persisted as JSON on the row.
        $item = MenuItem::firstWhere('name', 'Latte');
        $this->assertSame(['x' => 0.1, 'y' => 0.2, 'w' => 0.5, 'h' => 0.5], $item->image_crop);
    }

    public function test_admin_can_update_and_clear_crop_metadata(): void
    {
        Sanctum::actingAs($this->makeAdmin());
        $cat = $this->category();
        $item = MenuItem::create([
            'menu_category_id' => $cat->id,
            'name' => 'Mocha', 'slug' => 'mocha-x', 'price' => 5.00, 'is_active' => true,
        ]);

        // Set a crop.
        $this->putJson("/api/v1/admin/menu/items/{$item->id}", [
            'image_crop' => ['x' => 0, 'y' => 0, 'w' => 0.8, 'h' => 0.8],
        ])->assertOk();
        $this->assertNotNull($item->fresh()->image_crop);

        // Clear it with null.
        $this->putJson("/api/v1/admin/menu/items/{$item->id}", [
            'image_crop' => null,
        ])->assertOk();
        $this->assertNull($item->fresh()->image_crop);
    }

    public function test_crop_fractions_must_be_between_0_and_1(): void
    {
        Sanctum::actingAs($this->makeAdmin());
        $cat = $this->category();

        $res = $this->postJson('/api/v1/admin/menu/items', [
            'menu_category_id' => $cat->id,
            'name'  => 'Bad Crop',
            'price' => 4.00,
            'image_crop' => ['x' => 1.5, 'y' => 0, 'w' => 0.5, 'h' => 0.5],
        ]);

        $res->assertStatus(422);
        $res->assertJsonValidationErrors('image_crop.x');
    }

    public function test_partial_crop_is_rejected(): void
    {
        Sanctum::actingAs($this->makeAdmin());
        $cat = $this->category();

        // Missing w and h → required_with should fail.
        $res = $this->postJson('/api/v1/admin/menu/items', [
            'menu_category_id' => $cat->id,
            'name'  => 'Half Crop',
            'price' => 4.00,
            'image_crop' => ['x' => 0.1, 'y' => 0.1],
        ]);

        $res->assertStatus(422);
    }

    public function test_crop_overrunning_image_edges_is_rejected(): void
    {
        Sanctum::actingAs($this->makeAdmin());
        $cat = $this->category();

        // Each fraction is individually within 0..1, so only a whole-rectangle
        // check catches these. x+w = 1.3 and y+h = 1.4 respectively.
        $right = $this->postJson('/api/v1/admin/menu/items', [
            'menu_category_id' => $cat->id, 'name' => 'Overrun Right', 'price' => 4.00,
            'image_crop' => ['x' => 0.8, 'y' => 0, 'w' => 0.5, 'h' => 0.5],
        ]);
        $right->assertStatus(422)->assertJsonValidationErrors('image_crop');

        $bottom = $this->postJson('/api/v1/admin/menu/items', [
            'menu_category_id' => $cat->id, 'name' => 'Overrun Bottom', 'price' => 4.00,
            'image_crop' => ['x' => 0, 'y' => 0.9, 'w' => 0.5, 'h' => 0.5],
        ]);
        $bottom->assertStatus(422)->assertJsonValidationErrors('image_crop');

        $this->assertDatabaseMissing('menu_items', ['name' => 'Overrun Right']);
        $this->assertDatabaseMissing('menu_items', ['name' => 'Overrun Bottom']);
    }

    public function test_zero_area_crop_is_rejected(): void
    {
        Sanctum::actingAs($this->makeAdmin());
        $cat = $this->category();

        // w = 0 would render an empty image rather than failing loudly.
        $this->postJson('/api/v1/admin/menu/items', [
            'menu_category_id' => $cat->id, 'name' => 'Zero Area', 'price' => 4.00,
            'image_crop' => ['x' => 0.2, 'y' => 0.2, 'w' => 0, 'h' => 0.5],
        ])->assertStatus(422)->assertJsonValidationErrors('image_crop');
    }

    public function test_full_frame_crop_is_accepted(): void
    {
        Sanctum::actingAs($this->makeAdmin());
        $cat = $this->category();

        // x+w and y+h land exactly on 1 — must survive float round-off.
        $this->postJson('/api/v1/admin/menu/items', [
            'menu_category_id' => $cat->id, 'name' => 'Full Frame', 'price' => 4.00,
            'image_crop' => ['x' => 0, 'y' => 0, 'w' => 1, 'h' => 1],
        ])->assertStatus(201);
    }

    public function test_existing_items_without_crop_remain_valid(): void
    {
        Sanctum::actingAs($this->makeAdmin());
        $cat = $this->category();

        // Backwards compatibility: rows saved before crop support have a null
        // image_crop and must still be updatable without supplying one.
        $item = MenuItem::create([
            'menu_category_id' => $cat->id,
            'name' => 'Legacy', 'slug' => 'legacy-x', 'price' => 3.50, 'is_active' => true,
            'image_url' => 'https://res.cloudinary.com/demo/image/upload/v1/legacy.jpg',
        ]);

        $this->putJson("/api/v1/admin/menu/items/{$item->id}", ['name' => 'Legacy Renamed'])
            ->assertOk();

        $this->assertNull($item->fresh()->image_crop);
        $this->assertSame('Legacy Renamed', $item->fresh()->name);
    }

    public function test_public_menu_exposes_crop_metadata(): void
    {
        $cat = $this->category();
        MenuItem::create([
            'menu_category_id' => $cat->id,
            'name' => 'Cortado', 'slug' => 'cortado-x', 'price' => 4.50, 'is_active' => true,
            'image_url' => 'https://res.cloudinary.com/demo/image/upload/v1/x.jpg',
            'image_crop' => ['x' => 0.05, 'y' => 0.05, 'w' => 0.9, 'h' => 0.9],
        ]);

        $res = $this->getJson('/api/v1/menu/items');
        $res->assertOk();
        $res->assertJsonPath('0.image_crop.w', 0.9);
    }
}
