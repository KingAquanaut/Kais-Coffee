<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Backfill name_es for menu categories that were created before
     * Spanish translations were added to the seeder.
     */
    public function up(): void
    {
        $translations = [
            'Coffee & Lattes'  => 'Café y Lattes',
            'Lemonade'         => 'Limonada',
            'Matcha'           => 'Matcha',
            'Seasonal Drinks'  => 'Bebidas de Temporada',
        ];

        foreach ($translations as $english => $spanish) {
            DB::table('menu_categories')
                ->where('name', $english)
                ->whereNull('name_es')
                ->update(['name_es' => $spanish]);
        }
    }

    public function down(): void
    {
        // No-op: removing translations would be destructive
    }
};
