<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * internet_phone_allowance meal_allowance transportation_allowance positional_allowance basic_salary
     */
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->double('internet_phone_allowance')->default(0)->after('status');
            $table->double('meal_allowance')->default(0)->after('status');
            $table->double('transportation_allowance')->default(0)->after('status');
            $table->double('positional_allowance')->default(0)->after('status');
            $table->double('basic_salary')->default(0)->after('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            if(Schema::hasColumn('employees', 'basic_salary')) {
                $table->dropColumn('basic_salary');
            }
            if(Schema::hasColumn('employees', 'positional_allowance')) {
                $table->dropColumn('positional_allowance');
            }
            if(Schema::hasColumn('employees', 'transportation_allowance')) {
                $table->dropColumn('transportation_allowance');
            }
            if(Schema::hasColumn('employees', 'meal_allowance')) {
                $table->dropColumn('meal_allowance');
            }
            if(Schema::hasColumn('employees', 'internet_phone_allowance')) {
                $table->dropColumn('internet_phone_allowance');
            } 
        });
    }
};
