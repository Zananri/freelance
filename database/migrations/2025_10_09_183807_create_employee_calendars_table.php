<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * employee_calendars : 
     * employee_id share_to status title_event description date_event end_date_event start_time end_time color_event
     * image file_1 file_2 file_3 file_4 file_5 created_by updated_by created_at updated_at
     */
    public function up(): void
    {
        Schema::create('employee_calendars', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('employee_id');
            $table->string('share_to')->default('PRIVATE');
            $table->string('status')->default('ACTIVE');
            $table->text('title_event');
            $table->text('description')->nullable();
            $table->date('date_event');
            $table->date('end_date_event')->nullable();
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            
            $table->string('color_event')->nullable();
            $table->string('image')->nullable();
            $table->string('file_1')->nullable();
            $table->string('file_2')->nullable();
            $table->string('file_3')->nullable();
            $table->string('file_4')->nullable();
            $table->string('file_5')->nullable();

            $table->bigInteger('created_by')->default(0);
            $table->bigInteger('updated_by')->default(0);

            $table->timestamps();

            // Foreign key constraint
            $table->foreign('employee_id')->references('id')->on('employees')->onDelete('no action');
            
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_calendars');
    }
};
