<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * employee_calendar_shares :
     * id employee_calendar_id employee_id role created_by updated_by
     */
    public function up(): void
    {
        Schema::create('employee_calendar_shares', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('employee_calendar_id');
            $table->unsignedBigInteger('employee_id');
            $table->string('role')->default('VIEWER');
            $table->bigInteger('created_by')->default(0);
            $table->bigInteger('updated_by')->default(0);

            $table->timestamps();
            // Foreign key constraint
            $table->foreign('employee_id')->references('id')->on('employees')->onDelete('no action');
            $table->foreign('employee_calendar_id')->references('id')->on('employee_calendars')->onDelete('no action');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_calendar_shares');
    }
};
