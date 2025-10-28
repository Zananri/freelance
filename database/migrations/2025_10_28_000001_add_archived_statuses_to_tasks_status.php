<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class AddArchivedStatusesToTasksStatus extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        
    DB::statement("ALTER TABLE `tasks` MODIFY `status` ENUM('new_request','in_progress','completed','rejected','finished','deleted','canceled') DEFAULT 'new_request'");
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
    DB::statement("ALTER TABLE `tasks` MODIFY `status` ENUM('new_request','in_progress','completed','rejected') DEFAULT 'new_request'");
    }
}
