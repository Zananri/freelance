<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasColumn('task_schedules', 'include_weekend')) {
            Schema::table('task_schedules', function (Blueprint $table) {
                $table->dropColumn('include_weekend');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasColumn('task_schedules', 'include_weekend')) {
            Schema::table('task_schedules', function (Blueprint $table) {
                $table->boolean('include_weekend')->default(false)->after('recurrence_end_date');
            });
        }
    }
};
