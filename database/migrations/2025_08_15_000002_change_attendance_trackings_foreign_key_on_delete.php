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
        Schema::table('attendance_trackings', function (Blueprint $table) {
            // Drop existing foreign key constraint
            $table->dropForeign(['attendance_id']);
            
            // Add new foreign key constraint with onDelete restrict
            $table->foreign('attendance_id')
                  ->references('id')
                  ->on('attendances')
                  ->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendance_trackings', function (Blueprint $table) {
            // Drop the new foreign key constraint
            $table->dropForeign(['attendance_id']);
            
            // Restore original foreign key constraint with onDelete cascade
            $table->foreign('attendance_id')
                  ->references('id')
                  ->on('attendances')
                  ->onDelete('cascade');
        });
    }
};
