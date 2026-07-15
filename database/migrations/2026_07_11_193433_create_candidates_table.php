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
        Schema::create('candidates', function (Blueprint $table) {
            $table->id();
            $table->string('candidates_name');
            $table->string('candidates_email');
            $table->string('candidates_phone', 20)->nullable();
            $table->string('candidates_address')->nullable();
            $table->foreignId('job_id')
                ->constrained('job_list')
                ->cascadeOnDelete();
            $table->enum('gender', ['male', 'female'])->default('male');
            $table->date('candidates_birthdate')->nullable();
            $table->string('last_education')->nullable();
            $table->unsignedInteger('experience_years')->default(0);
            $table->string('cv_file')->nullable();
            $table->decimal('expected_salary', 15, 2)->nullable();
            $table->string('photo')->nullable();
            $table->string('source')->nullable();
            $table->enum('status', [
                'applied',
                'screening',
                'interview',
                'tech_test',
                'hired',
                'rejected'
            ])->default('applied');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('candidates');
    }
};
