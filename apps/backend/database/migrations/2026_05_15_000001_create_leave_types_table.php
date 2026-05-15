<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leave_types', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('key', 50)->unique();
            $table->text('description')->nullable();
            $table->unsignedSmallInteger('annual_quota')->default(0);
            $table->boolean('requires_attachment')->default(false);
            $table->json('approval_chain');
            $table->unsignedSmallInteger('duration_threshold')->nullable();
            $table->string('duration_threshold_role', 50)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leave_types');
    }
};
