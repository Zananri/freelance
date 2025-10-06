<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Adds `project_type` column with default 'public'. Existing rows will get the default.
     */
    public function up()
    {
        Schema::table('projects', function (Blueprint $table) {
            // Use string to allow possible future values; default to public
            $table->string('project_type')->default('public')->after('title');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::table('projects', function (Blueprint $table) {
            if (Schema::hasColumn('projects', 'project_type')) {
                $table->dropColumn('project_type');
            }
        });
    }
};
