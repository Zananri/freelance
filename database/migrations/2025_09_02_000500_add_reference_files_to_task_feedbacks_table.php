<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('task_feedbacks') && !Schema::hasColumn('task_feedbacks', 'reference_files')) {
            Schema::table('task_feedbacks', function (Blueprint $table) {
                $table->text('reference_files')->nullable()->after('reference_url');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('task_feedbacks') && Schema::hasColumn('task_feedbacks', 'reference_files')) {
            Schema::table('task_feedbacks', function (Blueprint $table) {
                $table->dropColumn('reference_files');
            });
        }
    }
};
