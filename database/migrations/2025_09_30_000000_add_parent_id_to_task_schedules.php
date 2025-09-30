<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class() extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds a nullable parent_id column to task_schedules referencing tasks.id.
     */
    public function up(): void
    {
        Schema::table('task_schedules', function (Blueprint $table) {
            if (!Schema::hasColumn('task_schedules', 'parent_id')) {
                $table->unsignedBigInteger('parent_id')->nullable()->after('project_id');
                $table->foreign('parent_id')->references('id')->on('tasks')->onDelete('set null');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('task_schedules', function (Blueprint $table) {
            if (Schema::hasColumn('task_schedules', 'parent_id')) {
                // Drop foreign first (guarded)
                try {
                    $table->dropForeign(['parent_id']);
                } catch (\Throwable $_) {
                    // ignore if constraint name differs
                }
                $table->dropColumn('parent_id');
            }
        });
    }
};
