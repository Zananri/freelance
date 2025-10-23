<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('projects') && ! Schema::hasColumn('projects', 'part_of_project')) {
            Schema::table('projects', function (Blueprint $table) {
                $table->unsignedBigInteger('part_of_project')->nullable()->after('division_id');
                $table->foreign('part_of_project')->references('id')->on('projects')->onDelete('set null');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('projects') && Schema::hasColumn('projects', 'part_of_project')) {
            Schema::table('projects', function (Blueprint $table) {
                $table->dropForeign(['part_of_project']);
                $table->dropColumn('part_of_project');
            });
        }
    }
};
