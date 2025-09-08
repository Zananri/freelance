<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('task_feedbacks')) {
            Schema::table('task_feedbacks', function (Blueprint $table) {
                // Drop existing FK if any
                try { $table->dropForeign(['project_id']); } catch (\Throwable $e) {}
            });
            Schema::table('task_feedbacks', function (Blueprint $table) {
                // Make nullable
                try { $table->unsignedBigInteger('project_id')->nullable()->change(); } catch (\Throwable $e) {}
                // Recreate FK allowing null (set null on delete)
                $table->foreign('project_id')->references('id')->on('projects')->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('task_feedbacks')) {
            Schema::table('task_feedbacks', function (Blueprint $table) {
                try { $table->dropForeign(['project_id']); } catch (\Throwable $e) {}
            });
            Schema::table('task_feedbacks', function (Blueprint $table) {
                try { $table->unsignedBigInteger('project_id')->nullable(false)->change(); } catch (\Throwable $e) {}
                $table->foreign('project_id')->references('id')->on('projects')->onDelete('cascade');
            });
        }
    }
};
