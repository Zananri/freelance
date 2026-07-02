<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendance_trackings', function (Blueprint $table) {
            $table->dropUnique('attendance_trackings_attendance_id_type_unique');
        });
    }

    public function down(): void
    {
        Schema::table('attendance_trackings', function (Blueprint $table) {
            $table->unique(['attendance_id', 'type']);
        });
    }
};