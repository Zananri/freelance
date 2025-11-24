<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Helpers\ActivityHelper;
use App\Models\Employee;
use App\Models\Task;
use App\Models\TaskAssignment;
use Illuminate\Support\Facades\DB;

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

            $divisions = \App\Models\Division::select(
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
                ->where('employees.department_id', $currentEmployee->department_id)
                ->orderBy('divisions.name_division', 'asc')
                ->orderBy('employees.name', 'asc')
                ->get();

            $divisions = \App\Models\Division::select(
                'divisions.id',
                'divisions.name_division',
                'divisions.department_id'
            )
                ->where('divisions.department_id', $currentEmployee->department_id)
                ->where('divisions.status', 'ACTIVE')
                ->orderBy('divisions.name_division', 'asc')
                ->get();
        }

        return view(
            'hub_division.hub_division',
            [
                'employee' => $employee,
                'current_employee' => $currentEmployee,
                'divisions' => $divisions
            ]
        );
    }

    public function getEmployeeTasksByMonth(Request $request)
    {
        try {
            $employeeId = $request->input('employee_id');
            $year = $request->input('year');
            $month = $request->input('month');

            \Log::info('Hub Division - Get Tasks Request', [
                'employee_id' => $employeeId,
                'year' => $year,
                'month' => $month
            ]);

            if (!$employeeId || !$year || !$month) {
                return response()->json([
                    'success' => false,
                    'message' => 'Missing required parameters'
                ], 400);
            }

            // Get first and last day of the month
            $firstDay = sprintf('%04d-%02d-01', $year, $month);
            $lastDay = date('Y-m-t', strtotime($firstDay));

            \Log::info('Date range', ['firstDay' => $firstDay, 'lastDay' => $lastDay]);

            // Get all tasks assigned to this employee
            $taskAssignments = TaskAssignment::where('employee_id', $employeeId)
                ->pluck('task_id');

            \Log::info('Task assignments found', ['count' => $taskAssignments->count()]);

            // Get tasks for the specified month
            $tasks = Task::select(
                'tasks.id',
                'tasks.title',
                'tasks.status',
                'tasks.start_date',
                'tasks.due_date',
                'tasks.priority'
            )
                ->whereIn('tasks.id', $taskAssignments)
                ->where(function ($query) use ($firstDay, $lastDay) {
                    $query->where(function ($q) use ($firstDay, $lastDay) {
                        $q->whereBetween('tasks.start_date', [$firstDay . ' 00:00:00', $lastDay . ' 23:59:59'])
                            ->whereNotNull('tasks.start_date');
                    })
                        ->orWhere(function ($q) use ($firstDay, $lastDay) {
                            $q->whereBetween('tasks.due_date', [$firstDay . ' 00:00:00', $lastDay . ' 23:59:59'])
                                ->whereNotNull('tasks.due_date');
                        });
                })
                ->whereNotIn(DB::raw('LOWER(status)'), ['canceled', 'deleted'])
                ->orderBy('tasks.start_date', 'asc')
                ->get();

            \Log::info('Tasks found', ['count' => $tasks->count()]);

            return response()->json([
                'success' => true,
                'total_tasks' => $tasks->count(),
                'data' => $tasks
            ]);
        } catch (\Exception $e) {
            \Log::error('Hub Division - Get Tasks Error', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

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

            \Log::info('Hub Division - Get Tasks By Date Request', [
                'employee_id' => $employeeId,
                'date' => $date
            ]);

            if (!$employeeId || !$date) {
                return response()->json([
                    'success' => false,
                    'message' => 'Missing required parameters'
                ], 400);
            }

            // Parse date
            $dateStart = $date . ' 00:00:00';
            $dateEnd = $date . ' 23:59:59';

            // Get all tasks assigned to this employee
            $taskAssignments = TaskAssignment::where('employee_id', $employeeId)
                ->pluck('task_id');

            // Get tasks for the specified date
            $tasks = Task::select(
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
                    'project' => function($query) {
                        $query->select('projects.id', 'projects.title', 'projects.department_id', 'projects.division_id');
                    },
                    'project.department:id,name_department',
                    'project.division:id,name_division'
                ])
                ->whereIn('tasks.id', $taskAssignments)
                ->where(function ($query) use ($dateStart, $dateEnd) {
                    $query->where(function ($q) use ($dateStart, $dateEnd) {
                        $q->whereBetween('tasks.start_date', [$dateStart, $dateEnd])
                            ->whereNotNull('tasks.start_date');
                    })
                        ->orWhere(function ($q) use ($dateStart, $dateEnd) {
                            $q->whereBetween('tasks.due_date', [$dateStart, $dateEnd])
                                ->whereNotNull('tasks.due_date');
                        });
                })
                ->whereNotIn(DB::raw('LOWER(status)'), ['canceled', 'deleted'])
                ->orderBy('tasks.priority', 'desc')
                ->orderBy('tasks.start_date', 'asc')
                ->get();

            \Log::info('Tasks found for date', ['count' => $tasks->count()]);

            return response()->json([
                'success' => true,
                'total_tasks' => $tasks->count(),
                'data' => $tasks
            ]);
        } catch (\Exception $e) {
            \Log::error('Hub Division - Get Tasks By Date Error', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error fetching tasks: ' . $e->getMessage(),
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
