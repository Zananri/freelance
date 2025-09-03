<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('project_feedbacks') && !Schema::hasColumn('project_feedbacks', 'reference_files')) {
            Schema::table('project_feedbacks', function (Blueprint $table) {
                // Use text to store JSON array for compatibility (mirrors task_feedbacks migration style)
                $table->text('reference_files')->nullable()->after('reference_url');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('project_feedbacks') && Schema::hasColumn('project_feedbacks', 'reference_files')) {
            Schema::table('project_feedbacks', function (Blueprint $table) {
                $table->dropColumn('reference_files');
            });
        }
    }
};
