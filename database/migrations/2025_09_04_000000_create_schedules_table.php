<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateSchedulesTable extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('schedules', function (Blueprint $table) {
            $table->id();

            // Optional relation to projects (can be null when creating a schedule)
            $table->unsignedBigInteger('project_id')->nullable();

            // Core task-like fields
            $table->integer('point')->default(1);
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('image')->nullable();
            $table->enum('priority', ['HIGH', 'MEDIUM', 'LOW']);
            $table->enum('status', ['new_request', 'in_progress', 'completed', 'rejected'])->default('new_request');
            $table->string('reference_url')->nullable();
            $table->json('reference_urls')->nullable();
            $table->json('reference_files')->nullable();
            $table->json('read_markers')->nullable();

            // These represent the default dates that will be applied to generated tasks
            $table->date('start_date');
            $table->date('due_date');
            $table->date('complete_date')->nullable();

            // Audit columns (aligned with latest tasks change to bigInteger)
            $table->bigInteger('created_by')->nullable();
            $table->bigInteger('updated_by')->nullable();
            $table->bigInteger('deleted_by')->nullable();

            // Target executors to assign when generating tasks (PIC assumed to be creator)
            $table->json('executor_ids')->nullable();

            // Recurrence settings for automatic task generation
            $table->enum('recurrence_type', ['daily', 'weekly', 'monthly'])->default('daily');
            $table->unsignedInteger('recurrence_interval')->default(1);
            // For weekly recurrence: 0=Sunday .. 6=Saturday
            $table->unsignedTinyInteger('recurrence_day_of_week')->nullable();
            // For monthly recurrence: 1..31
            $table->unsignedTinyInteger('recurrence_day_of_month')->nullable();
            // When to start/stop generating tasks
            $table->date('recurrence_start_date')->nullable();
            $table->date('recurrence_end_date')->nullable();
            // Operational helpers
            $table->dateTime('next_run_at')->nullable();
            $table->dateTime('last_generated_at')->nullable();
            $table->boolean('is_active')->default(true);

            $table->timestamps();

            $table->foreign('project_id')
                ->references('id')->on('projects')
                ->nullOnDelete();

            $table->index(['is_active']);
            $table->index(['recurrence_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schedules');
    }
}
