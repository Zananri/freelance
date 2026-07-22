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
        Schema::table('employees', function (Blueprint $table) {
            $table->enum('region', ['JAWA TENGAH', 'DKI JAKARTA', 'DAERAH ISTIMEWA YOGYAKARTA'])->nullable()->after('user_id');
            $table->integer('no_bpjs')->nullable()->after('bpjs_allowance');
            $table->integer('no_bpjstk')->nullable()->after('no_bpjs');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn('region');
            $table->dropColumn('no_bpjs');
            $table->dropColumn('no_bpjstk');
        });
    }
};
