<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('shifts')) {
            Schema::create('shifts', function (Blueprint $table) {
                $table->id();
                $table->string('title');
                $table->text('description')->nullable();
                $table->time('time_start');
                $table->time('time_end');
                $table->decimal('total_hour', 4, 2)->default(0.00);
                $table->enum('status', ['ACTIVE', 'DELETED'])->default('ACTIVE');
                $table->bigInteger('created_by')->nullable();
                $table->bigInteger('updated_by')->nullable();
                $table->bigInteger('deleted_by')->nullable();
                $table->timestamps();

                // Check if the index already exists before creating it
                if (!Schema::hasIndex('shifts', 'shifts_title_index')) {
                    $table->index('title', 'shifts_title_index');
                }
            });
        } else {
            Schema::table('shifts', function (Blueprint $table) {
                if (!Schema::hasColumn('shifts', 'title')) {
                    $table->string('title');
                }
                if (!Schema::hasColumn('shifts', 'description')) {
                    $table->text('description')->nullable();
                }
                if (!Schema::hasColumn('shifts', 'time_start')) {
                    $table->time('time_start');
                }
                if (!Schema::hasColumn('shifts', 'time_end')) {
                    $table->time('time_end');
                }
                if (!Schema::hasColumn('shifts', 'total_hour')) {
                    $table->decimal('total_hour', 4, 2)->default(0.00);
                }
                if (!Schema::hasColumn('shifts', 'created_by')) {
                    $table->bigInteger('created_by')->nullable();
                }
                if (!Schema::hasColumn('shifts', 'updated_by')) {
                    $table->bigInteger('updated_by')->nullable();
                }
                if (!Schema::hasColumn('shifts', 'status')) {
                    $table->enum('status', ['ACTIVE', 'DELETED'])->default('ACTIVE');
                }
                if (!Schema::hasColumn('shifts', 'deleted_by')) {
                    $table->bigInteger('deleted_by')->nullable();
                }
                if (!Schema::hasColumn('shifts', 'created_at')) {
                    $table->timestamp('created_at')->nullable();
                }
                if (!Schema::hasColumn('shifts', 'updated_at')) {
                    $table->timestamp('updated_at')->nullable();
                }

                // Ensure index on title exists
                if (!Schema::hasIndex('shifts', 'shifts_title_index')) {
                    $table->index('title', 'shifts_title_index');
                }
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('shifts');
    }
};
