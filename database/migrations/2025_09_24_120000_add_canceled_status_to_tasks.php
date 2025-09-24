<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
   
    public function up()
    {
        DB::statement("ALTER TABLE tasks MODIFY COLUMN status ENUM('new_request','in_progress','completed','rejected','DELETED','CANCELED') NOT NULL DEFAULT 'new_request'");

        DB::table('tasks')->whereRaw("LOWER(status) = ?", ['deleted'])->update(['status' => 'CANCELED']);

        DB::statement("ALTER TABLE tasks MODIFY COLUMN status ENUM('new_request','in_progress','completed','rejected','CANCELED') NOT NULL DEFAULT 'new_request'");
    }

   
    public function down()
    {
        DB::statement("ALTER TABLE tasks MODIFY COLUMN status ENUM('new_request','in_progress','completed','rejected','DELETED','CANCELED') NOT NULL DEFAULT 'new_request'");

        DB::table('tasks')->where('status', 'CANCELED')->whereNotNull('deleted_by')->update(['status' => 'DELETED']);

        DB::statement("ALTER TABLE tasks MODIFY COLUMN status ENUM('new_request','in_progress','completed','rejected','DELETED') NOT NULL DEFAULT 'new_request'");
    }
};
