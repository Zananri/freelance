<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddCompleteFieldsToTasksTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('tasks', function (Blueprint $table) {
            // store uploaded/attached files related to task completion (as JSON array)
            $table->json('complete_files')->nullable()->after('reference_files');

            // store URLs related to completed task (as JSON array)
            $table->json('complete_urls')->nullable()->after('complete_files');

            // free-form note when a task is completed
            $table->text('complete_note')->nullable()->after('complete_urls');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        // Be defensive: only drop columns if they exist to avoid migration errors
        if (Schema::hasColumn('tasks', 'complete_files')) {
            Schema::table('tasks', function (Blueprint $table) {
                $table->dropColumn('complete_files');
            });
        }

        if (Schema::hasColumn('tasks', 'complete_urls')) {
            Schema::table('tasks', function (Blueprint $table) {
                $table->dropColumn('complete_urls');
            });
        }

        if (Schema::hasColumn('tasks', 'complete_note')) {
            Schema::table('tasks', function (Blueprint $table) {
                $table->dropColumn('complete_note');
            });
        }
    }
}
