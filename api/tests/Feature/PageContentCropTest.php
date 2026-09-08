<?php

namespace Tests\Feature;

use App\Models\PageContent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Page-content crops are stored in a flat key/value text table, so the rect
 * arrives JSON-encoded rather than as a json column. These cover the structural
 * validation that brings them to parity with menu_items.image_crop.
 */
class PageContentCropTest extends TestCase
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

    private function putContent(array $payload)
    {
        return $this->putJson('/api/v1/admin/page-contents/home', $payload);
    }

    public function test_admin_can_save_a_valid_hero_crop(): void
    {
        Sanctum::actingAs($this->makeAdmin());

        $crop = ['x' => 0.1, 'y' => 0.2, 'w' => 0.5, 'h' => 0.5];
        $this->putContent(['hero_image_crop' => json_encode($crop)])->assertOk();

        $this->assertSame(
            $crop,
            json_decode(PageContent::where('page', 'home')->where('key', 'hero_image_crop')->value('value'), true)
        );
    }

    public function test_a_full_frame_crop_is_accepted(): void
    {
        Sanctum::actingAs($this->makeAdmin());

        // Edge case: x+w and y+h land exactly on 1. Must not be rejected by
        // float round-off, so the epsilon tolerance is doing its job here.
        $this->putContent(['hero_image_crop' => json_encode(['x' => 0, 'y' => 0, 'w' => 1, 'h' => 1])])
            ->assertOk();
    }

    public function test_malformed_crop_json_is_rejected(): void
    {
        Sanctum::actingAs($this->makeAdmin());

        $this->putContent(['hero_image_crop' => 'not-json-at-all'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('hero_image_crop');
    }

    public function test_crop_missing_a_field_is_rejected(): void
    {
        Sanctum::actingAs($this->makeAdmin());

        $this->putContent(['hero_image_crop' => json_encode(['x' => 0.1, 'y' => 0.1, 'w' => 0.5])])
            ->assertStatus(422)
            ->assertJsonValidationErrors('hero_image_crop');
    }

    public function test_crop_overrunning_the_right_edge_is_rejected(): void
    {
        Sanctum::actingAs($this->makeAdmin());

        // x + w = 1.3 → past the right edge. Cloudinary would silently clamp this.
        $this->putContent(['hero_image_crop' => json_encode(['x' => 0.8, 'y' => 0, 'w' => 0.5, 'h' => 0.5])])
            ->assertStatus(422)
            ->assertJsonValidationErrors('hero_image_crop');
    }

    public function test_crop_overrunning_the_bottom_edge_is_rejected(): void
    {
        Sanctum::actingAs($this->makeAdmin());

        // y + h = 1.4 → past the bottom edge.
        $this->putContent(['hero_image_crop' => json_encode(['x' => 0, 'y' => 0.9, 'w' => 0.5, 'h' => 0.5])])
            ->assertStatus(422)
            ->assertJsonValidationErrors('hero_image_crop');
    }

    public function test_zero_area_and_negative_origin_crops_are_rejected(): void
    {
        Sanctum::actingAs($this->makeAdmin());

        $this->putContent(['hero_image_crop' => json_encode(['x' => 0, 'y' => 0, 'w' => 0, 'h' => 0.5])])
            ->assertStatus(422)->assertJsonValidationErrors('hero_image_crop');

        $this->putContent(['hero_image_crop' => json_encode(['x' => -0.2, 'y' => 0, 'w' => 0.5, 'h' => 0.5])])
            ->assertStatus(422)->assertJsonValidationErrors('hero_image_crop');
    }

    public function test_clearing_a_crop_with_empty_string_is_valid(): void
    {
        Sanctum::actingAs($this->makeAdmin());

        PageContent::set('home', 'hero_image_crop', json_encode(['x' => 0, 'y' => 0, 'w' => 0.5, 'h' => 0.5]));

        // This is exactly what the admin UI sends when the crop is reset.
        $this->putContent(['hero_image_crop' => ''])->assertOk();

        $this->assertNull(
            PageContent::where('page', 'home')->where('key', 'hero_image_crop')->value('value')
        );
    }

    public function test_null_crop_is_valid(): void
    {
        Sanctum::actingAs($this->makeAdmin());

        $this->putContent(['hero_image_crop' => null])->assertOk();
    }

    public function test_team_photo_crop_keys_are_validated_too(): void
    {
        Sanctum::actingAs($this->makeAdmin());

        // The rules are built from the *_crop suffix, so every slot is covered
        // without naming them individually.
        $this->putContent(['team_member_2_photo_crop' => json_encode(['x' => 0.9, 'y' => 0, 'w' => 0.5, 'h' => 0.5])])
            ->assertStatus(422)
            ->assertJsonValidationErrors('team_member_2_photo_crop');

        $this->putContent(['team_member_2_photo_crop' => json_encode(['x' => 0.1, 'y' => 0.1, 'w' => 0.5, 'h' => 0.5])])
            ->assertOk();
    }

    public function test_non_crop_text_fields_are_unaffected(): void
    {
        Sanctum::actingAs($this->makeAdmin());

        // Regression guard: the dynamic rule building must not disturb ordinary
        // content keys, including ones that merely contain the word "crop".
        $this->putContent(['hero_title' => 'Kai\'s Coffee', 'crop_note' => 'not a rect'])->assertOk();

        $this->assertSame('Kai\'s Coffee', PageContent::where('page', 'home')->where('key', 'hero_title')->value('value'));
        $this->assertSame('not a rect', PageContent::where('page', 'home')->where('key', 'crop_note')->value('value'));
    }

    public function test_non_admin_cannot_update_page_content(): void
    {
        Sanctum::actingAs(User::create([
            'name' => 'Customer', 'email' => 'c@example.test', 'password' => Hash::make('password'),
        ]));

        $this->putContent(['hero_image_crop' => ''])->assertStatus(403);
    }

    public function test_calendar_image_crop_is_validated_and_persisted(): void
    {
        Sanctum::actingAs($this->makeAdmin());

        // The calendar slot is a first-class image key, so its crop gets the
        // same structural validation as hero and team photos.
        $this->putContent(['calendar_image_crop' => json_encode(['x' => 0.9, 'y' => 0, 'w' => 0.5, 'h' => 0.5])])
            ->assertStatus(422)
            ->assertJsonValidationErrors('calendar_image_crop');

        $crop = ['x' => 0.05, 'y' => 0.05, 'w' => 0.9, 'h' => 0.9];
        $this->putContent(['calendar_image_crop' => json_encode($crop)])->assertOk();

        $this->assertSame($crop, json_decode(
            PageContent::where('page', 'home')->where('key', 'calendar_image_crop')->value('value'), true
        ));
    }

    public function test_calendar_image_can_be_uploaded_and_removed(): void
    {
        Sanctum::actingAs($this->makeAdmin());
        Storage::fake('public');

        // Seed a URL + crop directly: the upload path itself calls Cloudinary,
        // which these tests do not exercise. What matters here is that the key
        // is accepted by the whitelist rather than 422'd as an invalid slot.
        PageContent::set('about', 'calendar_image_url', 'https://res.cloudinary.com/demo/image/upload/v1/cal.png');
        PageContent::set('about', 'calendar_image_crop', json_encode(['x' => 0, 'y' => 0, 'w' => 1, 'h' => 1]));

        $res = $this->deleteJson('/api/v1/admin/page-contents/about/images/calendar_image');
        $res->assertOk();

        // Removing clears both the URL and the crop that belonged to it.
        $this->assertNull(PageContent::where('page', 'about')->where('key', 'calendar_image_url')->value('value'));
        $this->assertNull(PageContent::where('page', 'about')->where('key', 'calendar_image_crop')->value('value'));
    }

    public function test_unknown_image_key_is_still_rejected(): void
    {
        Sanctum::actingAs($this->makeAdmin());

        $this->deleteJson('/api/v1/admin/page-contents/about/images/not_a_real_slot')
            ->assertStatus(422);
    }

    public function test_page_content_with_no_calendar_image_is_valid(): void
    {
        // Backwards compatibility: a page that never had a calendar image just
        // has no such keys, and the public endpoint still returns fine.
        $this->getJson('/api/v1/page-contents/about')->assertOk();
    }
}
