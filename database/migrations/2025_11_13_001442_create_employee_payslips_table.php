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
        Schema::create('employee_payslips', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('employee_id');
            
            $table->date('date_salary');

            $table->dateTime('date_salary_send')->nullable();
            $table->dateTime('date_payslip_send')->nullable();
            $table->string('payslip_path')->nullable();

            $table->integer('total_day_active')->default(0);
            $table->integer('total_working_day')->default(0);
            $table->integer('total_working_day_meal')->default(0);

            $table->double('take_home_pay')->default(0);
            $table->double('basic_salary')->default(0);
            $table->double('positional_allowance')->default(0);
            $table->double('bpjs_allowance')->default(0);
            $table->double('bpjs_tenaga_kerja_allowance')->default(0);
            $table->double('pension_allowance')->default(0);

            $table->double('prorate_basic_salary')->default(0);
            $table->double('prorate_positional_allowance')->default(0);
            $table->double('prorate_bpjs_allowance')->default(0);
            $table->double('prorate_bpjs_tenaga_kerja_allowance')->default(0);
            $table->double('prorate_pension_allowance')->default(0);

            $table->double('thr')->default(0);
            $table->double('kompensasi_pkwt')->default(0);

            $table->double('deduction')->default(0);
            
            $table->double('deduction_absent')->default(0);
            $table->double('deduction_late')->default(0);
            $table->double('deduction_bpjs_kesehatan')->default(0);
            $table->double('deduction_bpjs_tenaga_kerja')->default(0);
            $table->double('deduction_bpjs_dana_pensiun')->default(0);
            $table->double('deduction_pph21')->default(0);
            $table->double('deduction_cooperative')->default(0);
            $table->double('deduction_other')->default(0)->nullable();
            
            $table->string('bank_name')->nullable();
            $table->string('bank_account_number')->nullable();
            $table->string('bank_account_name')->nullable();
            
            $table->string('note')->nullable();

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
        Schema::dropIfExists('employee_payslips');
    }
};
