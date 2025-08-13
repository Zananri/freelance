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
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('employee_id');
            $table->boolean('is_work_outside')->default(false);
            $table->date('date_attendance');
            $table->time('time_in')->nullable();
            $table->time('time_out')->nullable();
            $table->time('time_late')->nullable();
            $table->enum('type_attendance', ['check_in', 'check_out']);
            $table->text('note')->nullable();
            $table->string('image')->nullable();
            $table->timestamps();

            // Foreign key constraint
            $table->foreign('employee_id')->references('id')->on('employees')->onDelete('restrict');
            
            // Index untuk performa query
            $table->index('employee_id');
            $table->index('date_attendance');
            $table->index(['employee_id', 'date_attendance']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendances');
    }
};
