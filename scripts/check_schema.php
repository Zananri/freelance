<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';

// Boot the kernel to access the container
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

$status = [];

$status['has_table_part_of_project'] = Schema::hasTable('part_of_project');
$status['has_table_project_parents'] = Schema::hasTable('project_parents');
$status['projects_has_column_part_of_project'] = Schema::hasColumn('projects', 'part_of_project');

// counts (best-effort)
try {
    if ($status['has_table_part_of_project']) {
        $status['part_of_project_count'] = DB::table('part_of_project')->count();
        $status['part_of_project_null_parent_count'] = DB::table('part_of_project')->whereNull('parent_project_id')->count();
    }
} catch (Throwable $e) {
    $status['part_of_project_count_error'] = $e->getMessage();
}

try {
    if ($status['has_table_project_parents']) {
        $status['project_parents_count'] = DB::table('project_parents')->count();
    }
} catch (Throwable $e) {
    $status['project_parents_count_error'] = $e->getMessage();
}

try {
    $status['projects_with_legacy_part_of_project_notnull'] = DB::table('projects')->whereNotNull('part_of_project')->count();
} catch (Throwable $e) {
    $status['projects_legacy_column_error'] = $e->getMessage();
}

echo json_encode($status, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;
