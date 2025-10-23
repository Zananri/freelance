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
                $table->unsignedBigInteger('parent_project_id');
                $table->boolean('is_primary')->default(false);
                $table->timestamps();

                $table->foreign('project_id')->references('id')->on('projects')->onDelete('cascade');
                $table->foreign('parent_project_id')->references('id')->on('projects')->onDelete('cascade');
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

        // Optionally drop legacy column to prevent future writes. This is best-effort and will
        // not block migration if DB does not allow dropping or column absent.
        try {
            if (Schema::hasColumn('projects', 'part_of_project')) {
                Schema::table('projects', function (Blueprint $table) {
                    $table->dropForeign(['part_of_project']);
                    $table->dropColumn('part_of_project');
                });
            }
        } catch (\Throwable $_) {
            // ignore failures
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('part_of_project')) {
            Schema::dropIfExists('part_of_project');
        }
    }
};
