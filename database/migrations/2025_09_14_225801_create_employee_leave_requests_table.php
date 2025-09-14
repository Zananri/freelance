<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations. employee_id leave_type reason start_date end_date day_amount photo_1 photo_2 file_1 file_2 reject_reason status
     */
    public function up(): void
    {
        Schema::create('employee_leave_requests', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('employee_id');
            $table->string('leave_type');

            $table->text('reason');

            $table->date('start_date');
            $table->date('end_date');

            $table->tinyInteger('day_amount');

            $table->string('photo_1')->nullable();
            $table->string('photo_2')->nullable();
            $table->string('file_1')->nullable();
            $table->string('file_2')->nullable();

            $table->text('reject_reason')->nullable();
            $table->string('status')->default('REQUEST');

            $table->bigInteger('created_by')->default(0);
            $table->bigInteger('updated_by')->default(0);
            $table->bigInteger('deleted_by')->default(0);
            $table->timestamps();

            $table->foreign('employee_id')->references('id')->on('employees')->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_leave_requests');
    }
};
