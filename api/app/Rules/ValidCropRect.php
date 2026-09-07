<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validates a non-destructive image crop rectangle.
 *
 * A crop is a normalized { x, y, w, h } in 0..1 fractions of the original
 * image. This rule accepts both shapes the app persists:
 *
 *   - array  — menu_items.image_crop (a real json column, cast to array)
 *   - string — page_contents values, which are a flat key/value text store,
 *              so the rect arrives JSON-encoded (e.g. hero_image_crop)
 *
 * Null / empty string are treated as "no crop" and pass, so clearing a crop
 * and every image saved before crop support existed both remain valid.
 *
 * Beyond per-field bounds this enforces that the rectangle is mathematically
 * inside the image: w and h must be positive (a zero-area crop would render
 * an empty image) and x+w / y+h must not run past the right/bottom edge.
 * Cloudinary silently clamps an out-of-range c_crop, so without this an admin
 * would save a crop that previews one way and renders another.
 */
class ValidCropRect implements ValidationRule
{
    /**
     * Tolerance for float round-off. The client rounds fractions to 4 decimals,
     * so a full-frame crop can arrive as 0.9999 + 0.0001 and must not be
     * rejected for overrunning the edge by a millionth of a pixel.
     */
    private const EPS = 1e-6;

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        // "No crop" — backwards compatible with pre-crop images and clearing.
        if ($value === null || $value === '') {
            return;
        }

        if (is_string($value)) {
            $decoded = json_decode($value, true);
            if (json_last_error() !== JSON_ERROR_NONE || !is_array($decoded)) {
                $fail('The :attribute must be a valid JSON crop rectangle.');
                return;
            }
            $value = $decoded;
        }

        if (!is_array($value)) {
            $fail('The :attribute must be a crop rectangle object.');
            return;
        }

        $rect = [];
        foreach (['x', 'y', 'w', 'h'] as $key) {
            if (!array_key_exists($key, $value)) {
                $fail("The :attribute is missing the \"{$key}\" value.");
                return;
            }
            if (!is_numeric($value[$key])) {
                $fail("The :attribute \"{$key}\" value must be numeric.");
                return;
            }
            $rect[$key] = (float) $value[$key];
        }

        if ($rect['x'] < 0 || $rect['y'] < 0) {
            $fail('The :attribute origin must not be negative.');
            return;
        }

        if ($rect['w'] <= 0 || $rect['h'] <= 0) {
            $fail('The :attribute width and height must be greater than zero.');
            return;
        }

        if ($rect['x'] + $rect['w'] > 1 + self::EPS) {
            $fail('The :attribute extends past the right edge of the image.');
            return;
        }

        if ($rect['y'] + $rect['h'] > 1 + self::EPS) {
            $fail('The :attribute extends past the bottom edge of the image.');
        }
    }
}
