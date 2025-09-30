<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Task;

$projectId = 2;
$tasks = Task::with(['assignments.employee.user','project','parent'])
    ->where('project_id', $projectId)
    ->whereRaw('LOWER(status) <> ?', ['canceled'])
    ->orderBy('created_at','desc')
    ->get();

foreach ($tasks as $t) {
    echo "ID: {$t->id} | parent_id: {$t->parent_id} | title: {$t->title}\n";
}

echo "Total: " . $tasks->count() . "\n";
