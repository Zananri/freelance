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
        Schema::create('employee_leaves', function (Blueprint $table) {

            $table->id();

            $table->unsignedBigInteger('employee_id');
            $table->tinyInteger('annual_leave')->default(0);
            $table->tinyInteger('collective_leave')->default(0);
            $table->tinyInteger('sick')->default(0);
            
            $table->tinyInteger('remaining_annual_leave')->default(0);
            $table->tinyInteger('remaining_collective_leave')->default(0);
            $table->tinyInteger('remaining_sick')->default(0);
            
            $table->tinyInteger('special_leave')->default(0);
            $table->tinyInteger('remaining_special_leave')->default(0);

            $table->string('status')->default('ACTIVE');
            $table->bigInteger('created_by')->nullable();
            $table->bigInteger('updated_by')->nullable();
            $table->bigInteger('deleted_by')->nullable();
            $table->timestamps();

            $table->foreign('employee_id')->references('id')->on('employees')->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_leaves');
    }
};
