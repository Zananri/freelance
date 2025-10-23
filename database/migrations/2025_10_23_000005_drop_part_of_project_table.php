<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('part_of_project')) {
            Schema::dropIfExists('part_of_project');
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('part_of_project')) {
            Schema::create('part_of_project', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('project_id');
                $table->unsignedBigInteger('parent_project_id')->nullable();
                $table->boolean('is_primary')->default(false);
                $table->timestamps();

                $table->foreign('project_id')->references('id')->on('projects')->onDelete('cascade');
                $table->foreign('parent_project_id')->references('id')->on('projects')->onDelete('set null');
                $table->unique(['project_id', 'parent_project_id'], 'part_of_project_unique');
            });
        }
    }
};
