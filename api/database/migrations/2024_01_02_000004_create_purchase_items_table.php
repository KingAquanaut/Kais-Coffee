<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_id')->constrained()->cascadeOnDelete();
            $table->foreignId('menu_item_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');          // snapshot of item name at time of purchase
            $table->decimal('unit_price', 8, 2);
            $table->integer('quantity');
            $table->decimal('subtotal', 8, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_items');
    }
};
