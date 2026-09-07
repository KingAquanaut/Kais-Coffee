<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Non-destructive crop metadata for a menu item's image. Stored as a
     * normalized rectangle { x, y, w, h } in 0..1 fractions of the original
     * image, applied at render time via a Cloudinary c_crop transform. Null
     * means "no crop" → existing images render exactly as before (c_fill).
     */
    public function up(): void
    {
        Schema::table('menu_items', function (Blueprint $table) {
            $table->json('image_crop')->nullable()->after('image_url');
        });
    }

    public function down(): void
    {
        Schema::table('menu_items', function (Blueprint $table) {
            $table->dropColumn('image_crop');
        });
    }
};
