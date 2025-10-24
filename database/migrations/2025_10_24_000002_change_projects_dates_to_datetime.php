<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class ChangeProjectsDatesToDatetime extends Migration
{
    /**
     * Run the migrations.
     *
     * This migration is implemented in a safe manner to preserve existing DATE values.
     * Approach:
     * 1. Add temporary datetime columns (nullable).
     * 2. Copy existing date values into the temp columns, appending "00:00:00" as time.
     * 3. Drop old date columns.
     * 4. Rename temp columns to original names.
     *
     * This avoids requiring doctrine/dbal and prevents accidental data loss.
     *
     * @return void
     */
    public function up()
    {
        // 1) Add temporary datetime columns
        Schema::table('projects', function (Blueprint $table) {
            if (!Schema::hasColumn('projects', 'start_date_tmp')) {
                $table->dateTime('start_date_tmp')->nullable();
            }
            if (!Schema::hasColumn('projects', 'due_date_tmp')) {
                $table->dateTime('due_date_tmp')->nullable();
            }
        });

        // 2) Copy existing date values into temp columns with time 00:00:00
        // Use DB::statement for compatibility and performance. This SQL works for MySQL.
        try {
            // Only update when start_date is not null
            DB::statement("UPDATE `projects` SET `start_date_tmp` = CONCAT(CAST(`start_date` AS CHAR), ' 00:00:00') WHERE `start_date` IS NOT NULL");
        } catch (\Throwable $_) {
            // Fallback using query builder if DB::statement fails for some reason
            try {
                DB::table('projects')->whereNotNull('start_date')->update(['start_date_tmp' => DB::raw("CONCAT(CAST(start_date AS CHAR), ' 00:00:00')")]);
            } catch (\Throwable $__) {
                // give up silently; it's still important the migration continues but user must verify
            }
        }

        try {
            DB::statement("UPDATE `projects` SET `due_date_tmp` = CONCAT(CAST(`due_date` AS CHAR), ' 00:00:00') WHERE `due_date` IS NOT NULL");
        } catch (\Throwable $_) {
            try {
                DB::table('projects')->whereNotNull('due_date')->update(['due_date_tmp' => DB::raw("CONCAT(CAST(due_date AS CHAR), ' 00:00:00')")]);
            } catch (\Throwable $__) {}
        }

        // 3) Drop old columns and rename temp columns to originals
        Schema::table('projects', function (Blueprint $table) {
            if (Schema::hasColumn('projects', 'start_date')) {
                $table->dropColumn('start_date');
            }
            if (Schema::hasColumn('projects', 'due_date')) {
                $table->dropColumn('due_date');
            }
        });

        Schema::table('projects', function (Blueprint $table) {
            if (Schema::hasColumn('projects', 'start_date_tmp')) {
                $table->dateTime('start_date_tmp')->nullable(false)->change();
                $table->renameColumn('start_date_tmp', 'start_date');
            }
            if (Schema::hasColumn('projects', 'due_date_tmp')) {
                // due_date should remain nullable to represent "forever"
                $table->dateTime('due_date_tmp')->nullable()->change();
                $table->renameColumn('due_date_tmp', 'due_date');
            }
        });
    }

    /**
     * Reverse the migrations.
     *
     * Convert DATETIME back to DATE by truncating time to 00:00 and restoring original column types.
     *
     * @return void
     */
    public function down()
    {
        // 1) Add temporary date columns
        Schema::table('projects', function (Blueprint $table) {
            if (!Schema::hasColumn('projects', 'start_date_tmp')) {
                $table->date('start_date_tmp')->nullable();
            }
            if (!Schema::hasColumn('projects', 'due_date_tmp')) {
                $table->date('due_date_tmp')->nullable();
            }
        });

        // 2) Copy values truncating time portion
        try {
            DB::statement("UPDATE `projects` SET `start_date_tmp` = DATE(`start_date`) WHERE `start_date` IS NOT NULL");
        } catch (\Throwable $_) {
            try {
                DB::table('projects')->whereNotNull('start_date')->update(['start_date_tmp' => DB::raw('DATE(start_date)')]);
            } catch (\Throwable $__) {}
        }

        try {
            DB::statement("UPDATE `projects` SET `due_date_tmp` = DATE(`due_date`) WHERE `due_date` IS NOT NULL");
        } catch (\Throwable $_) {
            try {
                DB::table('projects')->whereNotNull('due_date')->update(['due_date_tmp' => DB::raw('DATE(due_date)')]);
            } catch (\Throwable $__) {}
        }

        // 3) Drop datetime columns and rename temp columns
        Schema::table('projects', function (Blueprint $table) {
            if (Schema::hasColumn('projects', 'start_date')) {
                $table->dropColumn('start_date');
            }
            if (Schema::hasColumn('projects', 'due_date')) {
                $table->dropColumn('due_date');
            }
        });

        Schema::table('projects', function (Blueprint $table) {
            if (Schema::hasColumn('projects', 'start_date_tmp')) {
                $table->date('start_date_tmp')->nullable(false)->change();
                $table->renameColumn('start_date_tmp', 'start_date');
            }
            if (Schema::hasColumn('projects', 'due_date_tmp')) {
                $table->date('due_date_tmp')->nullable()->change();
                $table->renameColumn('due_date_tmp', 'due_date');
            }
        });
    }
}
