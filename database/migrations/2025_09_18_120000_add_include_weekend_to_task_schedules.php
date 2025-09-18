<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        if (Schema::hasTable('task_schedules')) {
            Schema::table('task_schedules', function (Blueprint $table) {
                if (!Schema::hasColumn('task_schedules', 'include_weekend')) {
                    $table->boolean('include_weekend')->default(false)->after('recurrence_end_date');
                }
            });
        }
    }

    public function down()
    {
        if (Schema::hasTable('task_schedules')) {
            Schema::table('task_schedules', function (Blueprint $table) {
                if (Schema::hasColumn('task_schedules', 'include_weekend')) {
                    $table->dropColumn('include_weekend');
                }
            });
        }
    }
};
