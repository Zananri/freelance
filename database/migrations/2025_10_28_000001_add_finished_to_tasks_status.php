<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class AddFinishedToTasksStatus extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // Alter the tasks.status enum to include 'finished'
        // Use raw statement to avoid dependency on doctrine/dbal
    // Include existing legacy values 'deleted' and 'canceled' so ALTER does not fail if rows contain them
    DB::statement("ALTER TABLE `tasks` MODIFY `status` ENUM('new_request','in_progress','completed','rejected','finished','deleted','canceled') NOT NULL DEFAULT 'new_request'");
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        // Revert back to previous enum values (remove 'finished')
    // Revert to previous set but keep legacy 'deleted'/'canceled' to avoid data loss
    DB::statement("ALTER TABLE `tasks` MODIFY `status` ENUM('new_request','in_progress','completed','rejected','deleted','canceled') NOT NULL DEFAULT 'new_request'");
    }
}
