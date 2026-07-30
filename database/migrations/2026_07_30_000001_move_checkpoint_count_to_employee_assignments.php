<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->unsignedTinyInteger('total_checkpoint')->default(1)->after('shift_id');
        });

        Schema::table('employee_shifts', function (Blueprint $table) {
            $table->unsignedTinyInteger('total_checkpoint')->default(1)->after('shift_id');
        });

        Schema::table('shifts', function (Blueprint $table) {
            $table->dropColumn('checkpoint_times');
        });
    }

    public function down(): void
    {
        Schema::table('shifts', function (Blueprint $table) {
            $table->json('checkpoint_times')->nullable()->after('total_checkpoint');
        });

        Schema::table('employee_shifts', function (Blueprint $table) {
            $table->dropColumn('total_checkpoint');
        });

        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn('total_checkpoint');
        });
    }
};
