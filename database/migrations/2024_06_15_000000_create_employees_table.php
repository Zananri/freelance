<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateEmployeesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('department_id');
            $table->unsignedBigInteger('division_id');
            $table->unsignedBigInteger('job_id');
            $table->string('profile_picture')->nullable();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('email_work')->unique();
            $table->string('phone', 20)->unique();
            $table->string('status');
            $table->text('address');
            $table->string('photo')->nullable();
            $table->string('ktp')->nullable();
            $table->date('birth_date');
            $table->date('hire_date');
            $table->date('resign_date')->nullable();
            $table->string('grade');
            $table->string('office');
            $table->bigInteger('created_by')->nullable();
            $table->bigInteger('deleted_by')->nullable();
            $table->bigInteger('updated_by')->nullable();
            $table->timestamps();

            $table->foreign('department_id')->references('id')->on('departments')->onDelete('restrict');
            $table->foreign('division_id')->references('id')->on('divisions')->onDelete('restrict');
            $table->foreign('job_id')->references('id')->on('job_list')->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('employees');
    }
}
