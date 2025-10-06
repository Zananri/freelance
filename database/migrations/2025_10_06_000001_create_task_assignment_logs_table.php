<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateTaskAssignmentLogsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('task_assignment_logs', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('task_id')->index();
            $table->unsignedBigInteger('employee_id')->nullable()->index();
            $table->unsignedBigInteger('creator_task')->nullable()->index();
            $table->string('action', 20)->default('PENDING')->index();
            $table->string('status', 20)->default('ACTIVE')->index();
            $table->unsignedBigInteger('created_by')->nullable()->index();
            $table->unsignedBigInteger('updated_by')->nullable()->index();
            $table->unsignedBigInteger('deleted_by')->nullable()->index();

            $table->timestamps();
            $table->foreign('task_id')->references('id')->on('tasks')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('task_assignment_logs');
    }
}
