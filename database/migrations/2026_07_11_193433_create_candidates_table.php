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
            $table->unsignedBigInteger('id')->primary();
            $table->string('candidates_name');
            $table->string('candidates_email');
            $table->string('candidates_phone', 20);
            $table->string('candidates_address');
            $table->enum('gender', ['male', 'female'])->default('male');
            $table->date('candidates_birthdate')->nullable();
            $table->string('last_education');
            $table->string('experience_years')->default('0');
            $table->string('cv_file');
            $table->string('expected_salary');
            $table->string('photo')->nullable();
            $table->string('source');
            $table->enum('status', ['applied', 'screening', 'interview', 'tech_test', 'hired', 'rejected'])->default('applied');
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
