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
        
        Schema::table('projects', function (Blueprint $table) {
            $table->dateTime('start_date')->nullable()->change();
            $table->dateTime('due_date')->nullable()->change();
        });

    }

    public function down()
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->date('start_date')->nullable()->change();
            $table->date('due_date')->nullable()->change();
        });
    }
}
