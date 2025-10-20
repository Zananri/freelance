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
        Schema::create('user_auth_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->unsignedBigInteger('employee_id')->nullable();
            $table->enum('auth_type', ['LOGIN', 'LOGOUT']);
            $table->dateTime('date_time_auth')->nullable();
            $table->string('device_info')->nullable();
            $table->string('ip_address')->nullable();
            $table->string('status')->nullable();
            $table->timestamps();

            $table->index('user_id');
            $table->index('employee_id');
            $table->index('auth_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_auth_logs');
    }
};
