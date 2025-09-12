<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::rename('schedules', 'task_schedules');
    }

    public function down(): void
    {
        Schema::rename('task_schedules', 'schedules');
    }
};

