<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('staff_id')->nullable()->constrained('users')->nullOnDelete();
            $table->decimal('subtotal', 8, 2);
            $table->decimal('discount', 8, 2)->default(0);
            $table->decimal('total', 8, 2);
            $table->integer('points_earned')->default(0);
            $table->integer('points_redeemed')->default(0);
            $table->text('notes')->nullable();
            $table->string('status')->default('completed'); // pending|completed|voided
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchases');
    }
};
