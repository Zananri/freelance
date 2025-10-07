<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        // Ensure both DELETED and CANCELED are valid enum values for tasks.status
        DB::statement("ALTER TABLE tasks MODIFY COLUMN status ENUM('new_request','in_progress','completed','rejected','DELETED','CANCELED') NOT NULL DEFAULT 'new_request'");
    }

    public function down()
    {
        // Revert to CANCELED-only archived value (matches previous migration state)
        DB::statement("ALTER TABLE tasks MODIFY COLUMN status ENUM('new_request','in_progress','completed','rejected','CANCELED') NOT NULL DEFAULT 'new_request'");
    }
};
