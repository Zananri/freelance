<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Add a new JSON column reference_files (match Task style)
        Schema::table('projects', function (Blueprint $table) {
            if (!Schema::hasColumn('projects', 'reference_files')) {
                $table->json('reference_files')->nullable()->after('reference_url');
            }
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            if (Schema::hasColumn('projects', 'reference_files')) {
                $table->dropColumn('reference_files');
            }
        });
    }
};
