<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Helpers\ActivityHelper;
use App\Models\Employee;
use App\Models\Division;
use App\Models\Task;
use App\Models\TaskAssignment;
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

        $baseQuery = Task::whereNotIn(DB::raw('LOWER(status)'), ['canceled', 'deleted']);
        $employeeId = $user && $user->employee ? $user->employee->id : null;

        if (!$canSeeAll) {
            if ($employeeId) {
                $baseQuery->whereHas('assignments', function ($q) use ($employeeId) {
                    $q->where('employee_id', $employeeId)
                        ->where(function ($r) {
                            $r->where('role', 'PIC')->orWhere('role', 'EXECUTOR');
                        });
                });
            } else {
                $baseQuery->whereRaw('1 = 0');
            }
        }

        $currentEmployee = Employee::where('user_id', $userId)->first();

        $tasksCountSub = DB::raw("(SELECT COUNT(ta.id)
            FROM task_assignments ta
            JOIN tasks t ON ta.task_id = t.id
            WHERE ta.employee_id = employees.id
            AND LOWER(t.status) NOT IN ('canceled','deleted')
        ) as tasks_count");

        if ($canSeeAll) {
            $employee = Employee::select(
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
                ->orderBy('divisions.name_division', 'asc')
                ->orderBy('employees.name', 'asc')
                ->get();

            $divisions = Division::select(
                'divisions.id',
                'divisions.name_division',
                'divisions.department_id'
            )
                ->where('divisions.status', 'ACTIVE')
                ->orderBy('divisions.name_division', 'asc')
                ->get();

        } else {

            $employee = Employee::select(
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
                ->where('employees.division_id', $currentEmployee->division_id)
                ->orderBy('divisions.name_division', 'asc')
                ->orderBy('employees.name', 'asc')
                ->get();

            $divisions = Division::select(
                'divisions.id',
                'divisions.name_division',
                'divisions.department_id'
            )
                ->where('divisions.id', $currentEmployee->division_id)
                ->where('divisions.status', 'ACTIVE')
                ->get();
        }

        return view(
            'hub_division.hub_division',
            [
                'employee' => $employee,
                'current_employee' => $currentEmployee,
                'divisions' => $divisions,
                'canSeeAll' => $canSeeAll
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
                'total_in_progress' => $inProgress,
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

            $inProgress = (clone $baseQuery)
                ->whereDate('start_date', '<=', $date)
                ->whereDate('due_date', '>=', $date)
                ->whereRaw('LOWER(status) = ?', ['in_progress'])
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
                'total_in_progress' => $inProgress,
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
}
