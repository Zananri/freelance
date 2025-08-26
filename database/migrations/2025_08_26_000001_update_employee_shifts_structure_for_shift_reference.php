<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employee_shifts', function (Blueprint $table) {
            // Add new shift_id column if it doesn't exist yet
            if (!Schema::hasColumn('employee_shifts', 'shift_id')) {
                $table->unsignedBigInteger('shift_id')->nullable()->after('employee_id');
                $table->index('shift_id');
            }

            // Collect columns to drop to match the new schema
            $columnsToDrop = [];
            foreach (['time_start', 'time_end', 'total_hour'] as $col) {
                if (Schema::hasColumn('employee_shifts', $col)) {
                    $columnsToDrop[] = $col;
                }
            }
            if (!empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }

    public function down(): void
    {
        Schema::table('employee_shifts', function (Blueprint $table) {
            // Recreate previously dropped columns (best-effort for rollback)
            if (!Schema::hasColumn('employee_shifts', 'time_start')) {
                $table->time('time_start')->nullable();
            }
            if (!Schema::hasColumn('employee_shifts', 'time_end')) {
                $table->time('time_end')->nullable();
            }
            if (!Schema::hasColumn('employee_shifts', 'total_hour')) {
                $table->decimal('total_hour', 4, 2)->default(0.00);
            }

            // Drop shift_id and its index if present
            if (Schema::hasColumn('employee_shifts', 'shift_id')) {
                $table->dropIndex(['shift_id']);
                $table->dropColumn('shift_id');
            }
        });
    }
};
