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
        Schema::create('employee_overtimes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('employee_id');
            $table->string('status');
            $table->text('description');
            $table->date('date_overtime');
            $table->time('time_start');
            $table->time('time_end')->nullable();
            $table->time('total_overtime')->nullable();
            
            $table->string('photo_start');
            $table->string('photo_end')->nullable();
            $table->string('location_start')->nullable();
            $table->string('location_end')->nullable();

            $table->bigInteger('created_by')->default(0);
            $table->bigInteger('updated_by')->default(0);
            $table->bigInteger('reject_by')->default(0);
            $table->bigInteger('approve_by')->default(0);

            $table->dateTime('approve_at')->nullable();
            $table->dateTime('reject_at')->nullable();

            $table->text('reject_note')->nullable();
            $table->timestamps();

            // Foreign key constraint
            $table->foreign('employee_id')->references('id')->on('employees')->onDelete('no action');
            
            // Index untuk performa query
            $table->index('employee_id');
            $table->index('date_overtime');
            $table->index(['employee_id', 'date_overtime']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_overtimes');
    }
};
