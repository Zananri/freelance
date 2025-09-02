<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            if (!Schema::hasColumn('tasks', 'reference_urls')) {
                $table->json('reference_urls')->nullable()->after('reference_url');
            }
        });

        Schema::table('task_feedbacks', function (Blueprint $table) {
            if (!Schema::hasColumn('task_feedbacks', 'reference_urls')) {
                $table->json('reference_urls')->nullable()->after('reference_url');
            }
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            if (Schema::hasColumn('tasks', 'reference_urls')) {
                $table->dropColumn('reference_urls');
            }
        });

        Schema::table('task_feedbacks', function (Blueprint $table) {
            if (Schema::hasColumn('task_feedbacks', 'reference_urls')) {
                $table->dropColumn('reference_urls');
            }
        });
    }
};
