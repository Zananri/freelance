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
        Schema::create('attendance_trackings', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('attendance_id');
            $table->boolean('is_work_outside')->default(false);
            $table->enum('type', ['check_in', 'check_out']);
            $table->string('location')->nullable(); // untuk latitude dan longitude
            $table->string('image')->nullable();
            $table->dateTime('date_time');
            $table->string('device')->nullable();
            $table->bigInteger('created_by')->nullable();
            $table->bigInteger('deleted_by')->nullable();
            $table->bigInteger('updated_by')->nullable();
            $table->timestamps();

            // Foreign key constraint
            $table->foreign('attendance_id')->references('id')->on('attendances')->onDelete('cascade');
            
            // Index untuk performa query
            $table->index('attendance_id');
            $table->index('type');
            $table->index('date_time');
            $table->index(['attendance_id', 'type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendance_trackings');
    }
};
