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
        Schema::create('employee_salaries', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('employee_id');
            $table->double('take_home_pay')->default(0);
            $table->double('basic_salary')->default(0);
            $table->double('positional_allowance')->default(0);
            $table->double('internet_phone_allowance')->default(0);
            $table->double('meal_allowance')->default(0);
            $table->double('transportation_allowance')->default(0);
            $table->string('bank_name')->nullable();
            $table->string('bank_account_number')->nullable();
            $table->string('bank_account_name')->nullable();

            $table->string('status')->default('ACTIVE');
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
        Schema::dropIfExists('employee_salaries');
    }
};
