<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('part_of_project')) {
            Schema::create('part_of_project', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('project_id');
                // parent_project_id is nullable so we can represent "cleared" parents without deleting rows
                $table->unsignedBigInteger('parent_project_id')->nullable();
                $table->boolean('is_primary')->default(false);
                $table->timestamps();

                $table->foreign('project_id')->references('id')->on('projects')->onDelete('cascade');
                // When a parent project is deleted, prefer to set parent_project_id=NULL instead of cascading delete
                $table->foreign('parent_project_id')->references('id')->on('projects')->onDelete('set null');
                $table->unique(['project_id', 'parent_project_id'], 'part_of_project_unique');
            });
        }

        // Migrate from existing project_parents table if present
        try {
            if (Schema::hasTable('project_parents')) {
                $rows = DB::table('project_parents')->get();
                foreach ($rows as $r) {
                    // older structure might have parent_project_id or project_parent_ids JSON
                    if (isset($r->parent_project_id) && $r->parent_project_id) {
                        // one row per parent
                        try {
                            DB::table('part_of_project')->insertOrIgnore([
                                'project_id' => $r->project_id,
                                'parent_project_id' => $r->parent_project_id,
                                'is_primary' => $r->is_primary ?? false,
                                'created_at' => $r->created_at ?? now(),
                                'updated_at' => $r->updated_at ?? now(),
                            ]);
                        } catch (\Throwable $_) {}
                    } elseif (isset($r->project_parent_ids) && $r->project_parent_ids) {
                        $parentIds = json_decode($r->project_parent_ids, true);
                        if (is_array($parentIds)) {
                            foreach ($parentIds as $idx => $pid) {
                                try {
                                    DB::table('part_of_project')->insertOrIgnore([
                                        'project_id' => $r->project_id,
                                        'parent_project_id' => (int)$pid,
                                        'is_primary' => $idx === 0,
                                        'created_at' => $r->created_at ?? now(),
                                        'updated_at' => $r->updated_at ?? now(),
                                    ]);
                                } catch (\Throwable $_) {}
                            }
                        }
                    }
                }
            }
        } catch (\Throwable $_) {
            // best-effort
        }

        // Migrate legacy column projects.part_of_project
        try {
            if (Schema::hasColumn('projects', 'part_of_project')) {
                $rows = DB::table('projects')->whereNotNull('part_of_project')->get(['id', 'part_of_project']);
                foreach ($rows as $r) {
                    try {
                        DB::table('part_of_project')->insertOrIgnore([
                            'project_id' => $r->id,
                            'parent_project_id' => (int)$r->part_of_project,
                            'is_primary' => true,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    } catch (\Throwable $_) {}
                }
            }
        } catch (\Throwable $_) {}

        // NOTE: intentionally NOT dropping legacy column `projects.part_of_project` here.
        // Dropping legacy schema should be a separate, explicit migration after
        // application code and data-migration have been verified in production.
    }

    public function down(): void
    {
        if (Schema::hasTable('part_of_project')) {
            Schema::dropIfExists('part_of_project');
        }
    }
};
