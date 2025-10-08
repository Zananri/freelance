<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            // JSON column to store multiple parent task ids
            if (!Schema::hasColumn('tasks', 'parent_ids')) {
                $table->json('parent_ids')->nullable()->after('parent_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            if (Schema::hasColumn('tasks', 'parent_ids')) {
                $table->dropColumn('parent_ids');
            }
        });
    }
};
