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
        Schema::table('employee_shifts', function (Blueprint $table) {
            if (Schema::hasColumn('employee_shifts', 'shift_id')) {
                $table->foreign('shift_id')
                    ->references('id')->on('shifts')
                    ->onDelete('restrict');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employee_shifts', function (Blueprint $table) {
            if (Schema::hasColumn('employee_shifts', 'shift_id')) {
                $table->dropForeign(['shift_id']);
            }
        });
    }
};
