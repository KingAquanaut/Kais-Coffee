<?php

namespace Tests\Feature;

use App\Models\MenuCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MenuCategoryTest extends TestCase
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

    private function makeCustomer(): User
    {
        return User::create([
            'name'     => 'Customer',
            'email'    => 'customer@example.test',
            'password' => Hash::make('password'),
        ]);
    }

    public function test_admin_can_create_category_with_bilingual_fields(): void
    {
        Sanctum::actingAs($this->makeAdmin());

        $res = $this->postJson('/api/v1/admin/menu/categories', [
            'name'           => 'Cold Brew',
            'name_es'        => 'Café Frío',
            'description'    => 'Slow-steeped iced coffee',
            'description_es' => 'Café helado de infusión lenta',
            'sort_order'     => 3,
            'is_active'      => true,
        ]);

        $res->assertStatus(201);
        $res->assertJsonPath('name', 'Cold Brew');
        $res->assertJsonPath('name_es', 'Café Frío');
        $res->assertJsonPath('slug', 'cold-brew');

        // DB-level: the row is actually persisted with all fields.
        $this->assertDatabaseHas('menu_categories', [
            'name'       => 'Cold Brew',
            'name_es'    => 'Café Frío',
            'slug'       => 'cold-brew',
            'sort_order' => 3,
            'is_active'  => true,
        ]);
    }

    public function test_create_category_requires_a_name(): void
    {
        Sanctum::actingAs($this->makeAdmin());

        $res = $this->postJson('/api/v1/admin/menu/categories', [
            'name_es' => 'Sin nombre',
        ]);

        $res->assertStatus(422);
        $res->assertJsonValidationErrors('name');
        $this->assertDatabaseCount('menu_categories', 0);
    }

    public function test_create_category_generates_unique_slug_on_duplicate_name(): void
    {
        Sanctum::actingAs($this->makeAdmin());

        MenuCategory::create([
            'name' => 'Specials', 'slug' => 'specials',
            'sort_order' => 0, 'is_active' => true,
        ]);

        $res = $this->postJson('/api/v1/admin/menu/categories', [
            'name' => 'Specials',
        ]);

        // Must not 500 on the unique slug index — controller suffixes it.
        $res->assertStatus(201);
        $res->assertJsonPath('slug', 'specials-2');
        $this->assertDatabaseHas('menu_categories', ['slug' => 'specials-2']);
    }

    public function test_non_admin_cannot_create_category(): void
    {
        Sanctum::actingAs($this->makeCustomer());

        $res = $this->postJson('/api/v1/admin/menu/categories', [
            'name' => 'Forbidden',
        ]);

        $res->assertStatus(403);
        $this->assertDatabaseCount('menu_categories', 0);
    }

    public function test_guest_cannot_create_category(): void
    {
        $res = $this->postJson('/api/v1/admin/menu/categories', [
            'name' => 'Anonymous',
        ]);

        $res->assertStatus(401);
        $this->assertDatabaseCount('menu_categories', 0);
    }

    public function test_created_category_is_immediately_usable_for_a_menu_item(): void
    {
        Sanctum::actingAs($this->makeAdmin());

        $catRes = $this->postJson('/api/v1/admin/menu/categories', ['name' => 'Tea']);
        $catRes->assertStatus(201);
        $catId = $catRes->json('id');

        // The brand-new category id passes the exists: validation on item create.
        $itemRes = $this->postJson('/api/v1/admin/menu/items', [
            'menu_category_id' => $catId,
            'name'  => 'Green Tea',
            'price' => 4.00,
        ]);

        $itemRes->assertStatus(201);
        $this->assertDatabaseHas('menu_items', [
            'menu_category_id' => $catId, 'name' => 'Green Tea',
        ]);
    }
}
