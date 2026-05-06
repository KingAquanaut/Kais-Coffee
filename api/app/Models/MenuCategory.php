<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MenuCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'name_es',
        'slug',
        'description',
        'description_es',
        'image_url',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function items(): HasMany
    {
        return $this->hasMany(MenuItem::class);
    }

    public function active_items(): HasMany
    {
        return $this->hasMany(MenuItem::class)
            ->where('is_active', true)
            ->with(['activeVariants'])
            ->orderBy('sort_order');
    }
}
