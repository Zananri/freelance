<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('part_of_project') && Schema::hasColumn('part_of_project', 'parent_project_id')) {
            try {
                $driver = DB::getDriverName();
                if ($driver === 'mysql') {
                    DB::statement('ALTER TABLE `part_of_project` MODIFY `parent_project_id` BIGINT UNSIGNED NULL');
                } elseif ($driver === 'pgsql') {
                    DB::statement('ALTER TABLE part_of_project ALTER COLUMN parent_project_id DROP NOT NULL');
                } else {
                    Schema::table('part_of_project', function (Blueprint $table) {
                        $table->unsignedBigInteger('parent_project_id')->nullable()->change();
                    });
                }
            } catch (\Throwable $_) {
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('part_of_project') && Schema::hasColumn('part_of_project', 'parent_project_id')) {
            try {
                $driver = DB::getDriverName();
                if ($driver === 'mysql') {
                    // Remove rows where parent_project_id is NULL to avoid FK/constraint issues, then make column NOT NULL
                    DB::table('part_of_project')->whereNull('parent_project_id')->delete();
                    DB::statement('ALTER TABLE `part_of_project` MODIFY `parent_project_id` BIGINT UNSIGNED NOT NULL');
                } elseif ($driver === 'pgsql') {
                    DB::table('part_of_project')->whereNull('parent_project_id')->delete();
                    DB::statement('ALTER TABLE part_of_project ALTER COLUMN parent_project_id SET NOT NULL');
                } else {
                    Schema::table('part_of_project', function (Blueprint $table) {
                        // Remove rows with NULL parent_project_id first
                        DB::table('part_of_project')->whereNull('parent_project_id')->delete();
                        $table->unsignedBigInteger('parent_project_id')->nullable(false)->change();
                    });
                }
            } catch (\Throwable $_) {
            }
        }
    }
};
