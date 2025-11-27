<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Helpers\ActivityHelper;
use App\Models\Employee;
use App\Models\Division;
use App\Models\Task;
use App\Models\TaskAssignment;
use App\Models\Project;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class HubDivisionController extends Controller
{
    public function showHubDivisionPage()
    {
        $userId = auth()->user()->id;
        $user = auth()->user();

        $canSeeAll = false;

        try {
            $userType = strtoupper((string) ($user->user_type ?? ''));
            $userRole = strtoupper((string) ($user->user_role ?? ''));

            if ($userType === 'MANAGEMENT' && in_array($userRole, ['GENERAL_MANAGER', 'CEO'])) {
                $canSeeAll = true;
            }
            if ($userType === 'ADMINISTRATOR' && $userRole === 'ADMINISTRATOR') {
                $canSeeAll = true;
            }
            if ($userType === 'REGULAR' && $userRole === 'PERSONAL_ASSISTANT') {
                $canSeeAll = true;
            }
        } catch (\Throwable $_) {
            $canSeeAll = false;
        }

        $currentEmployee = Employee::with('division')->where('user_id', $userId)->first();

        $tasksCountSub = DB::raw("(SELECT COUNT(ta.id)
            FROM task_assignments ta
            JOIN tasks t ON ta.task_id = t.id
            WHERE ta.employee_id = employees.id
            AND LOWER(t.status) NOT IN ('canceled','deleted')
        ) as tasks_count");

        if ($canSeeAll) {
            $employeeQuery = Employee::select(
                    'employees.id',
                    'employees.department_id',
                    'employees.division_id',
                    'employees.name',
                    'employees.status',
                    'employees.user_id',
                    'employees.photo',
                    'employees.profile_picture',
                    'users.photo as user_photo',
                    'job_list.job_name',
                    'divisions.name_division',
                    $tasksCountSub
                )
                ->join('job_list', 'employees.job_id', '=', 'job_list.id')
                ->join('users', 'employees.user_id', '=', 'users.id')
                ->join('divisions', 'employees.division_id', '=', 'divisions.id')
                ->where('employees.status', "ACTIVE")
                ->where('users.user_type', '<>', "ADMINISTRATOR")
                ->where('employees.department_id', $currentEmployee->department_id)
                ->orderBy('employees.name', 'asc');

            $employee = $employeeQuery->get();

            $divisionsQuery = Division::select(
                    'divisions.id',
                    'divisions.name_division',
                    'divisions.department_id'
                )
                ->where('divisions.department_id', $currentEmployee->department_id)
                ->where('divisions.status', 'ACTIVE')
                ->orderBy('divisions.name_division', 'asc');

            $divisions = $divisionsQuery->get();
        } else {
            $employeeQuery = Employee::select(
                    'employees.id',
                    'employees.department_id',
                    'employees.division_id',
                    'employees.name',
                    'employees.status',
                    'employees.user_id',
                    'employees.photo',
                    'employees.profile_picture',
                    'users.photo as user_photo',
                    'job_list.job_name',
                    'divisions.name_division',
                    $tasksCountSub
                )
                ->join('job_list', 'employees.job_id', '=', 'job_list.id')
                ->join('users', 'employees.user_id', '=', 'users.id')
                ->join('divisions', 'employees.division_id', '=', 'divisions.id')
                ->where('employees.status', "ACTIVE")
                ->where('users.user_type', '<>', "ADMINISTRATOR")
                ->where('employees.department_id', $currentEmployee->department_id)
                ->where('employees.division_id', $currentEmployee->division_id)
                ->orderBy('employees.name', 'asc');

            $employee = $employeeQuery->get();

            $divisionsQuery = Division::select(
                    'divisions.id',
                    'divisions.name_division',
                    'divisions.department_id'
                )
                ->where('divisions.department_id', $currentEmployee->department_id)
                ->where('divisions.id', $currentEmployee->division_id)
                ->where('divisions.status', 'ACTIVE');

            $divisions = $divisionsQuery->get();
        }

        // Calculate total projects and tasks for the initial view
        $totalProjects = 0;
        $totalTasks = 0;

        if ($canSeeAll) {
            // For users who can see all divisions in their department
            $totalProjects = Project::where('department_id', $currentEmployee->department_id)
                ->whereNotIn(DB::raw('LOWER(status)'), ['canceled', 'deleted'])
                ->count();

            $totalTasks = Task::whereIn('project_id', function($query) use ($currentEmployee) {
                $query->select('id')
                    ->from('projects')
                    ->where('department_id', $currentEmployee->department_id)
                    ->whereNotIn(DB::raw('LOWER(status)'), ['canceled', 'deleted']);
            })
            ->whereNotIn(DB::raw('LOWER(status)'), ['canceled', 'deleted'])
            ->count();
        } else {
            // For regular users, show only their division
            $totalProjects = Project::where('department_id', $currentEmployee->department_id)
                ->where('division_id', $currentEmployee->division_id)
                ->whereNotIn(DB::raw('LOWER(status)'), ['canceled', 'deleted'])
                ->count();

            $totalTasks = Task::whereIn('project_id', function($query) use ($currentEmployee) {
                $query->select('id')
                    ->from('projects')
                    ->where('department_id', $currentEmployee->department_id)
                    ->where('division_id', $currentEmployee->division_id)
                    ->whereNotIn(DB::raw('LOWER(status)'), ['canceled', 'deleted']);
            })
            ->whereNotIn(DB::raw('LOWER(status)'), ['canceled', 'deleted'])
            ->count();
        }

        return view(
            'hub_division.hub_division',
            [
                'employee' => $employee,
                'current_employee' => $currentEmployee,
                'divisions' => $divisions,
                'canSeeAll' => $canSeeAll,
                'totalProjects' => $totalProjects,
                'totalTasks' => $totalTasks
            ]
        );
    }

    public function getEmployeeTasksByMonth(Request $request)
    {
        try {
            $employeeId = $request->input('employee_id');
            $year = $request->input('year');
            $month = $request->input('month');
            $query = trim($request->input('query', ''));

            if (!$employeeId || !$year || !$month) {
                return response()->json([
                    'success' => false,
                    'message' => 'Missing required parameters'
                ], 400);
            }

            $firstDay = sprintf('%04d-%02d-01', $year, $month);
            $lastDay = date('Y-m-t', strtotime($firstDay));

            $taskAssignments = TaskAssignment::where('employee_id', $employeeId)
                ->pluck('task_id');

            $baseQuery = Task::whereIn('tasks.id', $taskAssignments)
                ->whereNotIn(DB::raw('LOWER(status)'), ['canceled', 'deleted'])
                ->where(function ($q) use ($query) {
                    if ($query !== '') {
                        $q->where('tasks.title', 'LIKE', "%{$query}%")
                        ->orWhere('tasks.description', 'LIKE', "%{$query}%");
                    }
                });

            $tasks = $baseQuery->select(
                    'tasks.id',
                    'tasks.title',
                    'tasks.status',
                    'tasks.start_date',
                    'tasks.due_date',
                    'tasks.priority'
                )
                ->where(function ($q) use ($firstDay, $lastDay) {
                    $q->whereBetween('tasks.start_date', [$firstDay.' 00:00:00', $lastDay.' 23:59:59'])
                    ->orWhereBetween('tasks.due_date', [$firstDay.' 00:00:00', $lastDay.' 23:59:59']);
                })
                ->orderBy('tasks.start_date', 'asc')
                ->get();

            $inProgress = (clone $baseQuery)
                ->where(function ($q) use ($firstDay, $lastDay) {
                    $q->whereBetween('start_date', [$firstDay.' 00:00:00', $lastDay.' 23:59:59'])
                    ->orWhereBetween('due_date', [$firstDay.' 00:00:00', $lastDay.' 23:59:59']);
                })
                ->whereRaw('LOWER(status) = ?', ['in_progress'])
                ->count();

            $start = (clone $baseQuery)
                ->where(function ($q) use ($firstDay, $lastDay) {
                    $q->whereBetween('start_date', [$firstDay.' 00:00:00', $lastDay.' 23:59:59'])
                    ->orWhereBetween('due_date', [$firstDay.' 00:00:00', $lastDay.' 23:59:59']);
                })
                ->whereRaw('LOWER(status) = ?', ['not_started'])
                ->count();

            $complete = (clone $baseQuery)
                ->where(function ($q) use ($firstDay, $lastDay) {
                    $q->whereBetween('start_date', [$firstDay.' 00:00:00', $lastDay.' 23:59:59'])
                    ->orWhereBetween('due_date', [$firstDay.' 00:00:00', $lastDay.' 23:59:59']);
                })
                ->whereRaw('LOWER(status) = ?', ['completed'])
                ->count();

            $finished = (clone $baseQuery)
                ->where(function ($q) use ($firstDay, $lastDay) {
                    $q->whereBetween('start_date', [$firstDay.' 00:00:00', $lastDay.' 23:59:59'])
                    ->orWhereBetween('due_date', [$firstDay.' 00:00:00', $lastDay.' 23:59:59']);
                })
                ->whereRaw('LOWER(status) = ?', ['finished'])
                ->count();

            $late = (clone $baseQuery)
                ->where(function ($q) use ($firstDay, $lastDay) {
                    $q->whereBetween('start_date', [$firstDay.' 00:00:00', $lastDay.' 23:59:59'])
                    ->orWhereBetween('due_date', [$firstDay.' 00:00:00', $lastDay.' 23:59:59']);
                })
                ->whereNotIn(DB::raw('LOWER(status)'), ['completed', 'finished'])
                ->whereNotNull('due_date')
                ->where('due_date', '<', now())
                ->count();

            return response()->json([
                'success' => true,
                'total_tasks' => $tasks->count(),
                'total_start' => $start,
                'total_in_progress' => $inProgress,
                'total_complete' => $complete,
                'total_finished' => $finished,
                'total_late' => $late,
                'data' => $tasks
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching tasks: ' . $e->getMessage(),
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getEmployeeTasksByDate(Request $request)
    {
        try {
            $employeeId = $request->input('employee_id');
            $date = $request->input('date');

            if (!$employeeId || !$date) {
                return response()->json([
                    'success' => false,
                    'message' => 'Missing required parameters'
                ], 400);
            }

            $taskAssignments = TaskAssignment::where('employee_id', $employeeId)
                ->pluck('task_id');

            $baseQuery = Task::whereIn('tasks.id', $taskAssignments)
                ->whereNotIn(DB::raw('LOWER(status)'), ['canceled', 'deleted']);

            $tasks = $baseQuery->select(
                    'tasks.id',
                    'tasks.title',
                    'tasks.description',
                    'tasks.status',
                    'tasks.start_date',
                    'tasks.due_date',
                    'tasks.priority',
                    'tasks.project_id'
                )
                ->with([
                    'project:id,title,department_id,division_id',
                    'project.department:id,name_department',
                    'project.division:id,name_division'
                ])
                ->whereDate('tasks.start_date', '<=', $date)
                ->whereDate('tasks.due_date', '>=', $date)
                ->orderBy('tasks.priority', 'desc')
                ->orderBy('tasks.start_date', 'asc')
                ->get();

            $start = (clone $baseQuery)
                ->whereDate('start_date', '<=', $date)
                ->whereDate('due_date', '>=', $date)
                ->whereRaw('LOWER(status) = ?', ['not_started'])
                ->count();

            $inProgress = (clone $baseQuery)
                ->whereDate('start_date', '<=', $date)
                ->whereDate('due_date', '>=', $date)
                ->whereRaw('LOWER(status) = ?', ['in_progress'])
                ->count();

            $complete = (clone $baseQuery)
                ->whereDate('start_date', '<=', $date)
                ->whereDate('due_date', '>=', $date)
                ->whereRaw('LOWER(status) = ?', ['completed'])
                ->count();

            $finished = (clone $baseQuery)
                ->whereDate('start_date', '<=', $date)
                ->whereDate('due_date', '>=', $date)
                ->whereRaw('LOWER(status) = ?', ['finished'])
                ->count();

            $late = (clone $baseQuery)
                ->whereDate('start_date', '<=', $date)
                ->whereDate('due_date', '>=', $date)
                ->whereNotIn(DB::raw('LOWER(status)'), ['completed', 'finished'])
                ->whereNotNull('due_date')
                ->where('due_date', '<', now())
                ->count();

            return response()->json([
                'success' => true,
                'total_tasks' => $tasks->count(),
                'total_start' => $start,
                'total_in_progress' => $inProgress,
                'total_finished' => $finished,
                'total_complete' => $complete,
                'total_late' => $late,
                'data' => $tasks
            ]);

        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'message' => 'Error fetching tasks: ' . $e->getMessage(),
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getDivisionStats(Request $request)
    {
        try {
            $divisionId = $request->input('division_id');
            $userId = auth()->user()->id;
            $currentEmployee = Employee::where('user_id', $userId)->first();

            if (!$currentEmployee) {
                return response()->json([
                    'success' => false,
                    'message' => 'Employee not found'
                ], 404);
            }

            $totalProjects = 0;
            $totalTasks = 0;

            if ($divisionId === 'all') {
                // Count all projects and tasks in the department
                $totalProjects = Project::where('department_id', $currentEmployee->department_id)
                    ->whereNotIn(DB::raw('LOWER(status)'), ['canceled', 'deleted'])
                    ->count();

                $totalTasks = Task::whereIn('project_id', function($query) use ($currentEmployee) {
                    $query->select('id')
                        ->from('projects')
                        ->where('department_id', $currentEmployee->department_id)
                        ->whereNotIn(DB::raw('LOWER(status)'), ['canceled', 'deleted']);
                })
                ->whereNotIn(DB::raw('LOWER(status)'), ['canceled', 'deleted'])
                ->count();
            } else {
                // Count projects and tasks for specific division
                $totalProjects = Project::where('department_id', $currentEmployee->department_id)
                    ->where('division_id', $divisionId)
                    ->whereNotIn(DB::raw('LOWER(status)'), ['canceled', 'deleted'])
                    ->count();

                $totalTasks = Task::whereIn('project_id', function($query) use ($currentEmployee, $divisionId) {
                    $query->select('id')
                        ->from('projects')
                        ->where('department_id', $currentEmployee->department_id)
                        ->where('division_id', $divisionId)
                        ->whereNotIn(DB::raw('LOWER(status)'), ['canceled', 'deleted']);
                })
                ->whereNotIn(DB::raw('LOWER(status)'), ['canceled', 'deleted'])
                ->count();
            }

            return response()->json([
                'success' => true,
                'total_projects' => $totalProjects,
                'total_tasks' => $totalTasks
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching division stats: ' . $e->getMessage(),
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
