<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\PageContent;
use App\Rules\ValidCropRect;
use App\Services\UploadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PageContentController extends Controller
{
    /**
     * Named image slots that may be uploaded through uploadImageByKey().
     * Each slot stores its URL at "{key}_url" and its crop at "{key}_crop".
     * Kept as one list so the upload and remove endpoints cannot drift apart.
     */
    private const IMAGE_KEYS = [
        'team_member_1_photo',
        'team_member_2_photo',
        'team_member_3_photo',
        // Schedule / calendar graphic shown in the "Where to find us" section.
        'calendar_image',
    ];

    public function __construct(private UploadService $uploads) {}

    /**
     * Return all content fields for a page (admin read).
     */
    public function show(string $page): JsonResponse
    {
        return response()->json(PageContent::forPage($page));
    }

    /**
     * Bulk-upsert text content fields for a page.
     * Image fields are handled separately via uploadImage().
     */
    public function update(Request $request, string $page): JsonResponse
    {
        // Crop rectangles ride through this key/value endpoint as JSON strings
        // (page_contents is a flat text store), so they need the same structural
        // validation menu_items.image_crop gets from its json column. Keys are
        // dynamic, so the rules are built per request from the *_crop suffix.
        $rules = ['*' => ['nullable', 'string', 'max:5000']];
        foreach (array_keys($request->all()) as $key) {
            if (str_ends_with($key, '_crop')) {
                $rules[$key] = ['nullable', 'string', 'max:5000', new ValidCropRect];
            }
        }

        $data = $request->validate($rules);

        // Prevent overwriting image URLs via this endpoint — use uploadImage instead
        foreach (array_keys($data) as $key) {
            if (str_ends_with($key, '_url')) {
                unset($data[$key]);
            }
        }

        PageContent::setMany($page, $data);

        return response()->json(PageContent::forPage($page));
    }

    /**
     * Upload (or replace) the hero image for a page.
     */
    public function uploadImage(Request $request, string $page): JsonResponse
    {
        $request->validate([
            'image' => ['required', 'file', 'image', 'max:20480', 'mimes:jpeg,png,gif,webp'],
        ]);

        $existing = PageContent::where('page', $page)->where('key', 'hero_image_url')->value('value');
        if ($existing) {
            $this->uploads->delete($existing);
        }

        $imageUrl = $this->uploads->store($request->file('image'), "pages/{$page}");

        PageContent::set($page, 'hero_image_url', $imageUrl);
        // A fresh image invalidates any crop saved against the previous one.
        PageContent::set($page, 'hero_image_crop', null);

        return response()->json(PageContent::forPage($page));
    }

    /**
     * Remove the hero image for a page.
     */
    public function removeImage(string $page): JsonResponse
    {
        $existing = PageContent::where('page', $page)->where('key', 'hero_image_url')->value('value');
        if ($existing) {
            $this->uploads->delete($existing);
        }

        PageContent::set($page, 'hero_image_url', null);
        PageContent::set($page, 'hero_image_crop', null);

        return response()->json(PageContent::forPage($page));
    }

    /**
     * Upload (or replace) a named image field for a page.
     * The stored key is {imageKey}_url (e.g. team_member_1_photo_url).
     */
    public function uploadImageByKey(Request $request, string $page, string $imageKey): JsonResponse
    {
        if (!in_array($imageKey, self::IMAGE_KEYS, true)) {
            return response()->json(['message' => 'Invalid image key.'], 422);
        }

        $request->validate([
            'image' => ['required', 'file', 'image', 'max:20480', 'mimes:jpeg,png,gif,webp'],
        ]);

        $field    = $imageKey . '_url';
        $existing = PageContent::where('page', $page)->where('key', $field)->value('value');
        if ($existing) {
            $this->uploads->delete($existing);
        }

        $imageUrl = $this->uploads->store($request->file('image'), "pages/{$page}/{$imageKey}");

        PageContent::set($page, $field, $imageUrl);
        // A fresh image invalidates any crop saved against the previous one.
        PageContent::set($page, $imageKey . '_crop', null);

        return response()->json(PageContent::forPage($page));
    }

    /**
     * Remove a named image field for a page.
     */
    public function removeImageByKey(string $page, string $imageKey): JsonResponse
    {
        if (!in_array($imageKey, self::IMAGE_KEYS, true)) {
            return response()->json(['message' => 'Invalid image key.'], 422);
        }

        $field    = $imageKey . '_url';
        $existing = PageContent::where('page', $page)->where('key', $field)->value('value');
        if ($existing) {
            $this->uploads->delete($existing);
        }

        PageContent::set($page, $field, null);
        PageContent::set($page, $imageKey . '_crop', null);

        return response()->json(PageContent::forPage($page));
    }
}
