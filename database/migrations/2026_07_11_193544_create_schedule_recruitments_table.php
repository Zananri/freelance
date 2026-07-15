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
        Schema::create('schedule_recruitments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('candidate_id')
                ->constrained('candidates')
                ->cascadeOnDelete();
            $table->enum('schedule_type', [
                'interview',
                'tech_test',
                'offering',
                'other'
            ]);
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('location', [
                'online',
                'onsite'
            ])->default('online');
            $table->dateTime('time_start');
            $table->dateTime('time_end');
            $table->string('meeting_link')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schedule_recruitments');
    }
};
