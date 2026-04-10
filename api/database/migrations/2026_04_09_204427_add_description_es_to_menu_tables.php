<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('menu_items', function (Blueprint $table) {
            $table->text('description_es')->nullable()->after('description');
        });

        Schema::table('menu_categories', function (Blueprint $table) {
            $table->text('description_es')->nullable()->after('description');
        });
    }

    public function down(): void
    {
        Schema::table('menu_items', function (Blueprint $table) {
            $table->dropColumn('description_es');
        });

        Schema::table('menu_categories', function (Blueprint $table) {
            $table->dropColumn('description_es');
        });
    }
};
