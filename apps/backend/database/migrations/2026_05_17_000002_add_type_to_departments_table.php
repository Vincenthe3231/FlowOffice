<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("CREATE TYPE department_type AS ENUM ('finance', 'hr', 'general')");

        Schema::table('departments', function (Blueprint $table) {
            $table->string('type')->default('general')->after('short_code');
        });

        DB::statement("ALTER TABLE departments ALTER COLUMN type TYPE department_type USING type::department_type");

        DB::statement("UPDATE departments SET type = 'finance' WHERE short_code = 'FA'");
        DB::statement("UPDATE departments SET type = 'hr' WHERE short_code = 'HR'");
    }

    public function down(): void
    {
        Schema::table('departments', function (Blueprint $table) {
            $table->dropColumn('type');
        });

        DB::statement('DROP TYPE IF EXISTS department_type');
    }
};
