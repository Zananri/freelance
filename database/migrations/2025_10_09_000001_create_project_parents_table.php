<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('project_parents')) {
            Schema::create('project_parents', function (Blueprint $table) {
                $table->unsignedBigInteger('project_id');
                $table->unsignedBigInteger('parent_project_id');
                $table->boolean('is_primary')->default(false);
                $table->timestamps();

                $table->foreign('project_id')->references('id')->on('projects')->onDelete('cascade');
                $table->foreign('parent_project_id')->references('id')->on('projects')->onDelete('cascade');
                $table->unique(['project_id', 'parent_project_id'], 'project_parent_unique');
            });
        }

        // Migrate existing single parent (projects.part_of_project) to pivot as primary
        if (Schema::hasColumn('projects', 'part_of_project')) {
            try {
                $rows = DB::table('projects')->whereNotNull('part_of_project')->get(['id', 'part_of_project']);
                foreach ($rows as $r) {
                    // Avoid self-parent
                    if ((int)$r->id === (int)$r->part_of_project) continue;
                    $exists = DB::table('project_parents')
                        ->where('project_id', $r->id)
                        ->where('parent_project_id', $r->part_of_project)
                        ->exists();
                    if (!$exists) {
                        DB::table('project_parents')->insert([
                            'project_id' => $r->id,
                            'parent_project_id' => $r->part_of_project,
                            'is_primary' => true,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    } else {
                        DB::table('project_parents')
                            ->where('project_id', $r->id)
                            ->where('parent_project_id', $r->part_of_project)
                            ->update(['is_primary' => true, 'updated_at' => now()]);
                    }
                }
            } catch (\Throwable $e) {
                // best-effort migration; ignore errors to not block deployment
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('project_parents')) {
            Schema::dropIfExists('project_parents');
        }
    }
};
