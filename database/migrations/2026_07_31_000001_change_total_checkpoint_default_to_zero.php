<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->unsignedTinyInteger('total_checkpoint')->default(0)->change();
        });

        Schema::table('employee_shifts', function (Blueprint $table) {
            $table->unsignedTinyInteger('total_checkpoint')->default(0)->change();
        });

        Schema::table('shifts', function (Blueprint $table) {
            $table->integer('total_checkpoint')->default(0)->change();
        });
    }

    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->unsignedTinyInteger('total_checkpoint')->default(1)->change();
        });

        Schema::table('employee_shifts', function (Blueprint $table) {
            $table->unsignedTinyInteger('total_checkpoint')->default(1)->change();
        });

        Schema::table('shifts', function (Blueprint $table) {
            $table->integer('total_checkpoint')->default(1)->change();
        });
    }
};
