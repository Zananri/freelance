<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add 'DELETED' to tasks.status enum; keep default as 'new_request'
        // MariaDB/MySQL: alter enum set
        DB::statement("ALTER TABLE tasks MODIFY COLUMN status ENUM('new_request','in_progress','completed','rejected','DELETED') NOT NULL DEFAULT 'new_request'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to original enum without 'DELETED'
        DB::statement("ALTER TABLE tasks MODIFY COLUMN status ENUM('new_request','in_progress','completed','rejected') NOT NULL DEFAULT 'new_request'");
    }
};
