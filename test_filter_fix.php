<?php

require_once 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Project;
use Illuminate\Http\Request;

echo "Testing project filter alignment:\n";
echo "================================\n\n";

try {
    // Simulate the filter requests for testing
    $filters = ['not_started', 'late'];
    
    foreach ($filters as $filter) {
        echo "Filter: {$filter}\n";
        echo "----------------\n";
        
        // Simulate the query logic from getAllProjects
        $query = Project::where('status', '!=', 'DELETED');
        
        if ($filter === 'not_started') {
            // New Request: Project tanpa task ATAU semua task berstatus new_request
            // BUT exclude projects that are past due date (those should be "late")
            $query->where(function ($q) {
                $q->whereDoesntHave('tasks')
                    ->orWhereIn('projects.id', function ($subquery) {
                        $subquery->from('tasks')
                            ->selectRaw('project_id')
                            ->groupBy('project_id')
                            ->havingRaw('COUNT(*) = SUM(CASE WHEN status = "new_request" THEN 1 ELSE 0 END)');
                    });
            })
            // Exclude projects that are past their due date
            ->where(function ($q) {
                $q->whereNull('due_date')
                    ->orWhere('due_date', '>=', now()->toDateString());
            });
        } elseif ($filter === 'late') {
            // Late: Projects that have late tasks OR are past their due date (and not completed)
            $query->where(function ($q) {
                // Projects with late tasks
                $q->whereHas('tasks', function ($taskQuery) {
                    $taskQuery->whereRaw('LOWER(status) <> ?', ['completed'])
                              ->whereNotNull('due_date')
                              ->where('due_date', '<', now());
                })
                // OR projects past their due date (and not all tasks completed)
                ->orWhere(function ($projectQuery) {
                    $projectQuery->whereNotNull('due_date')
                                ->where('due_date', '<', now()->toDateString())
                                ->whereNotIn('projects.id', function ($subquery) {
                                    // Exclude projects where ALL tasks are completed
                                    $subquery->from('tasks')
                                        ->selectRaw('project_id')
                                        ->groupBy('project_id')
                                        ->havingRaw('COUNT(*) = SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END)')
                                        ->havingRaw('COUNT(*) > 0'); // Must have tasks
                                });
                });
            });
        }
        
        $projects = $query->get(['id', 'title', 'due_date']);
        
        foreach ($projects as $project) {
            $pastDue = $project->due_date && (now()->toDateString() > $project->due_date);
            echo "  - {$project->title} (Due: " . ($project->due_date ?? 'None') . ")" . ($pastDue ? " [PAST DUE]" : "") . "\n";
        }
        
        echo "  Total: " . $projects->count() . " projects\n\n";
    }
    
    echo "Current date: " . now()->toDateString() . "\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}