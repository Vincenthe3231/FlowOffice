<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('claims', function (Blueprint $table) {
            $table->smallInteger('current_level')->nullable()->after('status');
        });

        DB::statement("UPDATE claims SET current_level = 1 WHERE status IN ('pending', 'pending_l1')");
        DB::statement("UPDATE claims SET current_level = 2 WHERE status = 'pending_l2'");
        DB::statement("UPDATE claims SET current_level = 3 WHERE status = 'pending_l3'");
        DB::statement("UPDATE claims SET current_level = 4 WHERE status = 'pending_l4'");
    }

    public function down(): void
    {
        Schema::table('claims', function (Blueprint $table) {
            $table->dropColumn('current_level');
        });
    }
};
