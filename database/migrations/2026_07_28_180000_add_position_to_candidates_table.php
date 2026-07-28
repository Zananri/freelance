<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('candidates', function (Blueprint $table) {
            $table->string('position')->nullable()->after('job_id');
            $table->foreignId('job_id')->nullable()->change();
        });

        DB::table('candidates')
            ->join('job_list', 'candidates.job_id', '=', 'job_list.id')
            ->whereNull('candidates.position')
            ->update(['candidates.position' => DB::raw('job_list.job_name')]);
    }

    public function down(): void
    {
        Schema::table('candidates', function (Blueprint $table) {
            $table->dropColumn('position');
        });

        if (! DB::table('candidates')->whereNull('job_id')->exists()) {
            Schema::table('candidates', function (Blueprint $table) {
                $table->foreignId('job_id')->nullable(false)->change();
            });
        }
    }
};
