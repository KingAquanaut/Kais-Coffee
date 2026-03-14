<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PageContent extends Model
{
    protected $fillable = ['page', 'key', 'value'];

    /**
     * Return all key→value pairs for a given page as a flat associative array.
     */
    public static function forPage(string $page): array
    {
        return static::where('page', $page)->pluck('value', 'key')->toArray();
    }

    /**
     * Upsert a single key for a page.
     */
    public static function set(string $page, string $key, ?string $value): void
    {
        static::updateOrCreate(
            ['page' => $page, 'key' => $key],
            ['value' => $value]
        );
    }

    /**
     * Upsert multiple key→value pairs for a page at once.
     *
     * @param  array<string, string|null>  $data
     */
    public static function setMany(string $page, array $data): void
    {
        foreach ($data as $key => $value) {
            static::set($page, $key, $value === '' ? null : $value);
        }
    }
}
