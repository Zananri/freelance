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
        Schema::table('tasks', function (Blueprint $table) {
            $table->integer('position_x')->nullable()->after('reference_files');
            $table->integer('position_y')->nullable()->after('position_x');
            $table->boolean('free_positioned')->default(false)->after('position_y');
            
            // Index for better performance on positioning queries
            $table->index(['free_positioned', 'position_x', 'position_y']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropIndex(['free_positioned', 'position_x', 'position_y']);
            $table->dropColumn(['position_x', 'position_y', 'free_positioned']);
        });
    }
};