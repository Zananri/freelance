<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('partners', function (Blueprint $table) {
            if (!Schema::hasColumn('partners', 'department_id')) {
                $table->unsignedBigInteger('department_id')->nullable()->after('partner_name');
            }
            if (!Schema::hasColumn('partners', 'office_id')) {
                $table->unsignedBigInteger('office_id')->nullable()->after('department_id');
            }
            if (!Schema::hasColumn('partners', 'status')) {
                $table->string('status')->default('ACTIVE')->after('office_id');
            }
            if (!Schema::hasColumn('partners', 'description')) {
                $table->text('description')->nullable()->after('status');
            }
            if (!Schema::hasColumn('partners', 'images')) {
                $table->string('images')->nullable()->after('description');
            }
            if (!Schema::hasColumn('partners', 'updated_by')) {
                $table->bigInteger('updated_by')->nullable()->after('created_by');
            }
            if (!Schema::hasColumn('partners', 'deleted_by')) {
                $table->bigInteger('deleted_by')->nullable()->after('updated_by');
            }
        });

        Schema::table('partners', function (Blueprint $table) {
            $this->addForeignIfMissing($table, 'partners', 'department_id', 'departments');
            $this->addForeignIfMissing($table, 'partners', 'office_id', 'offices');
        });

        Schema::table('divisions', function (Blueprint $table) {
            if (!Schema::hasColumn('divisions', 'partner_id')) {
                $table->unsignedBigInteger('partner_id')->nullable()->after('department_id');
            }
        });

        DB::table('divisions')->whereNull('partner_id')->update([
            'partner_id' => DB::raw('department_id')
        ]);

        Schema::table('divisions', function (Blueprint $table) {
            $this->addForeignIfMissing($table, 'divisions', 'partner_id', 'partners');
        });

        Schema::table('job_list', function (Blueprint $table) {
            if (!Schema::hasColumn('job_list', 'partner_id')) {
                $table->unsignedBigInteger('partner_id')->nullable()->after('department_id');
            }
        });

        DB::table('job_list')->whereNull('partner_id')->update([
            'partner_id' => DB::raw('department_id')
        ]);

        Schema::table('job_list', function (Blueprint $table) {
            $this->addForeignIfMissing($table, 'job_list', 'partner_id', 'partners');
        });

        Schema::table('employees', function (Blueprint $table) {
            if (!Schema::hasColumn('employees', 'partner_id')) {
                $table->unsignedBigInteger('partner_id')->nullable()->after('department_id');
            }
        });

        DB::table('employees')->whereNull('partner_id')->update([
            'partner_id' => DB::raw('department_id')
        ]);

        Schema::table('employees', function (Blueprint $table) {
            $this->addForeignIfMissing($table, 'employees', 'partner_id', 'partners');
        });
    }

    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $this->dropForeignIfExists($table, 'employees_partner_id_foreign');
            if (Schema::hasColumn('employees', 'partner_id')) {
                $table->dropColumn('partner_id');
            }
        });

        Schema::table('job_list', function (Blueprint $table) {
            $this->dropForeignIfExists($table, 'job_list_partner_id_foreign');
            if (Schema::hasColumn('job_list', 'partner_id')) {
                $table->dropColumn('partner_id');
            }
        });

        Schema::table('divisions', function (Blueprint $table) {
            $this->dropForeignIfExists($table, 'divisions_partner_id_foreign');
            if (Schema::hasColumn('divisions', 'partner_id')) {
                $table->dropColumn('partner_id');
            }
        });

        Schema::table('partners', function (Blueprint $table) {
            $this->dropForeignIfExists($table, 'partners_department_id_foreign');
            $this->dropForeignIfExists($table, 'partners_office_id_foreign');

            $dropColumns = [];
            foreach (['department_id', 'office_id', 'status', 'description', 'images', 'updated_by', 'deleted_by'] as $column) {
                if (Schema::hasColumn('partners', $column)) {
                    $dropColumns[] = $column;
                }
            }

            if (!empty($dropColumns)) {
                $table->dropColumn($dropColumns);
            }
        });
    }

    private function addForeignIfMissing(Blueprint $table, string $tableName, string $column, string $referenceTable): void
    {
        if (!$this->hasForeignKey($tableName, $column)) {
            $table->foreign($column)->references('id')->on($referenceTable)->onDelete('restrict');
        }
    }

    private function hasForeignKey(string $tableName, string $column): bool
    {
        $connection = Schema::getConnection();
        $database = $connection->getDatabaseName();

        $constraint = $connection->table('information_schema.KEY_COLUMN_USAGE')
            ->where('TABLE_SCHEMA', $database)
            ->where('TABLE_NAME', $tableName)
            ->where('COLUMN_NAME', $column)
            ->whereNotNull('REFERENCED_TABLE_NAME')
            ->first();

        return $constraint !== null;
    }

    private function dropForeignIfExists(Blueprint $table, string $foreignName): void
    {
        try {
            $table->dropForeign($foreignName);
        } catch (\Throwable $e) {
        }
    }
};
