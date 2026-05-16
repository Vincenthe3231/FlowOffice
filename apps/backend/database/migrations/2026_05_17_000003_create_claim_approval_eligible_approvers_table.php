<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('claim_approval_eligible_approvers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('claim_approval_id')->constrained('claim_approvals')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['claim_approval_id', 'user_id'], 'caea_approval_user_unique');
            $table->index('user_id', 'idx_caea_user');
        });

        // Backfill from JSON column
        DB::statement("
            INSERT INTO claim_approval_eligible_approvers (claim_approval_id, user_id)
            SELECT ca.id, u.id::bigint
            FROM claim_approvals ca,
                 jsonb_array_elements_text(ca.eligible_approver_ids::jsonb) AS u(id)
            WHERE ca.eligible_approver_ids IS NOT NULL
              AND ca.eligible_approver_ids::text != '[]'
            ON CONFLICT DO NOTHING
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('claim_approval_eligible_approvers');
    }
};
