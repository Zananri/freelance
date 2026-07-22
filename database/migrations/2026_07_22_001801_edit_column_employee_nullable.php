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
        Schema::table('employees', function (Blueprint $table) {
            $table->string('name')->nullable()->change();
            $table->string('email')->nullable()->change();
            $table->string('email_work')->nullable()->change();
            $table->string('phone')->nullable()->change();
            $table->string('status')->nullable()->change();
            $table->string('weekday_off')->nullable()->change();
            $table->string('basic_salary')->nullable()->change();
            $table->string('positional_allowance')->nullable()->change();
            $table->string('pension_allowance')->nullable()->change();
            $table->string('bpjs_tenaga_kerja_allowance')->nullable()->change();
            $table->string('bpjs_allowance')->nullable()->change();
            $table->string('address')->nullable()->change();
            $table->string('grade_id')->nullable()->change();
            $table->string('office')->nullable()->change();
            $table->foreignId('job_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
