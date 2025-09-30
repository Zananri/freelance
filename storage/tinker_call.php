<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$controller = new App\Http\Controllers\TaskController();
$res = $controller->getTasksByProjectForTree(2);
if ($res instanceof Illuminate\Http\JsonResponse) {
    echo $res->getContent();
} else {
    var_export($res);
}
