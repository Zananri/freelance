<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('project_feedbacks') && !Schema::hasColumn('project_feedbacks', 'parent_id')) {
            Schema::table('project_feedbacks', function (Blueprint $table) {
                $table->unsignedBigInteger('parent_id')->nullable()->after('project_id');
                $table->index('parent_id');
                // Self reference (no FK to avoid legacy data issues)
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('project_feedbacks') && Schema::hasColumn('project_feedbacks', 'parent_id')) {
            Schema::table('project_feedbacks', function (Blueprint $table) {
                $table->dropIndex(['parent_id']);
                $table->dropColumn('parent_id');
            });
        }
    }
};
