<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$controller = new App\Http\Controllers\TaskController();
$projectId = 2;
for ($level = 0; $level <= 4; $level++) {
    $ids = $controller->taskParentRelation($projectId, $level, [], $count = 0);
    echo "Level: $level -> count: " . (is_array($ids) ? count($ids) : ($ids instanceof \Illuminate\Support\Collection ? $ids->count() : 0)) . "\n";
    if ($ids instanceof \Illuminate\Support\Collection) {
        echo implode(', ', $ids->toArray()) . "\n";
    } elseif (is_array($ids)) {
        echo implode(', ', $ids) . "\n";
    }
    echo "----\n";
}
