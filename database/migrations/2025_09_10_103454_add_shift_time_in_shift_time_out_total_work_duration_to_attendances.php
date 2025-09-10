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
        Schema::table('attendances', function (Blueprint $table) {
            $table->time('total_work_duration')->nullable()->after('type_attendance');
            $table->time('shift_time_start')->nullable()->after('total_work_duration');
            $table->time('shift_time_end')->nullable()->after('shift_time_start');
            
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropColumn(['total_work_duration','shift_time_start','shift_time_end']);
        });
    }
};
