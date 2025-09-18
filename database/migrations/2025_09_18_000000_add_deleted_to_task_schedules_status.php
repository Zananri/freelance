<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add 'DELETED' to the enum definition for the status column on task_schedules
        // Note: MySQL doesn't support altering enum values easily via Blueprint; we'll use raw SQL that works on MySQL/MariaDB.
        if (Schema::hasTable('task_schedules')) {
            // Determine current enum values and append DELETED if missing
            DB::statement("ALTER TABLE `task_schedules` CHANGE `status` `status` ENUM('new_request','in_progress','completed','rejected','DELETED') NOT NULL DEFAULT 'new_request'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('task_schedules')) {
            // Revert to original enum values (remove DELETED)
            DB::statement("ALTER TABLE `task_schedules` CHANGE `status` `status` ENUM('new_request','in_progress','completed','rejected') NOT NULL DEFAULT 'new_request'");
        }
    }
};
