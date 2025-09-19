<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('task_schedules', function (Blueprint $table) {
            if (!Schema::hasColumn('task_schedules', 'recurrence_days_of_week')) {
                $table->json('recurrence_days_of_week')->nullable()->after('recurrence_day_of_week');
            }
        });
    }

    public function down()
    {
        Schema::table('task_schedules', function (Blueprint $table) {
            if (Schema::hasColumn('task_schedules', 'recurrence_days_of_week')) {
                $table->dropColumn('recurrence_days_of_week');
            }
        });
    }
};
