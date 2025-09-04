<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            // Make project_id nullable; for existing FK, drop and recreate as nullable
            try {
                $table->dropForeign(['project_id']);
            } catch (\Throwable $e) {
                // ignore if constraint name unknown/not present
            }
            $table->unsignedBigInteger('project_id')->nullable()->change();
            $table->foreign('project_id')->references('id')->on('projects')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            try {
                $table->dropForeign(['project_id']);
            } catch (\Throwable $e) {
                // ignore
            }
            $table->unsignedBigInteger('project_id')->nullable(false)->change();
            $table->foreign('project_id')->references('id')->on('projects')->onDelete('restrict');
        });
    }
};
