<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->string('no_bpjs', 25)->nullable()->change();
            $table->string('no_bpjstk', 25)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->integer('no_bpjs')->nullable()->change();
            $table->integer('no_bpjstk')->nullable()->change();
        });
    }
};
