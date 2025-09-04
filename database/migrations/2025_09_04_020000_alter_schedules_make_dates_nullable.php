<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('schedules', function (Blueprint $table) {
            // Requires doctrine/dbal for change() on existing columns
            $table->date('start_date')->nullable()->change();
            $table->date('due_date')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('schedules', function (Blueprint $table) {
            $table->date('start_date')->nullable(false)->change();
            $table->date('due_date')->nullable(false)->change();
        });
    }
};
