<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reward_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reward_account_id')->constrained()->cascadeOnDelete();
            $table->foreignId('purchase_id')->nullable()->constrained()->nullOnDelete();
            $table->string('type');   // earn | redeem | adjust | expire
            $table->integer('points'); // positive = earned, negative = spent
            $table->string('description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reward_transactions');
    }
};
