<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\Division;

return new class extends Migration
{
    public function up(): void
    {
        Division::query()->update([
            'created_by' => 0,
            'updated_by' => 0,
            'deleted_by' => 0,
        ]);        

        Schema::table('divisions', function (Blueprint $table) {
            $table->bigInteger('created_by')->nullable()->change();
            $table->bigInteger('updated_by')->nullable()->change();
            $table->bigInteger('deleted_by')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('divisions', function (Blueprint $table) {
            $table->bigInteger('created_by')->nullable()->change();
            $table->bigInteger('updated_by')->nullable()->change();
            $table->bigInteger('deleted_by')->nullable()->change();
        });
    }
};
