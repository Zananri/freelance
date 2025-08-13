<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class AddIsReceiveToProjectAssignmentsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // Check if the column already exists
        if (!Schema::hasColumn('project_assignments', 'is_receive')) {
            Schema::table('project_assignments', function (Blueprint $table) {
                $table->boolean('is_receive')->default(false)->after('role');
            });
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        // Check if the column exists before trying to drop it
        if (Schema::hasColumn('project_assignments', 'is_receive')) {
            Schema::table('project_assignments', function (Blueprint $table) {
                $table->dropColumn('is_receive');
            });
        }
    }
}
