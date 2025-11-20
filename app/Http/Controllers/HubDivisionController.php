<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Helpers\ActivityHelper;
use App\Models\Employee;
use App\Models\Task;
use App\Models\TaskAssignment;

class HubDivisionController extends Controller
{
    public function showHubDivisionPage()
    {
        $userId = auth()->user()->id;

        $currentEmployee = Employee::where('user_id', $userId)->first();

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
            'divisions.name_division'
        )
        ->join('job_list','employees.job_id','=','job_list.id')
        ->join('users','employees.user_id','=','users.id')
        ->join('divisions','employees.division_id','=','divisions.id')
        ->where('employees.status',"ACTIVE")
        ->where('users.user_type','<>',"ADMINISTRATOR")
        ->where('employees.department_id',$currentEmployee->department_id)
        ->get();

        // Get all divisions in the same department as the current employee
        $divisions = \App\Models\Division::select(
            'divisions.id',
            'divisions.name_division',
            'divisions.department_id'
        )
        ->where('divisions.department_id', $currentEmployee->department_id)
        ->where('divisions.status', 'ACTIVE')
        ->orderBy('divisions.name_division', 'asc')
        ->get();
        
        return view('hub_division.hub_division',
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
            ->where(function($query) use ($firstDay, $lastDay) {
                $query->where(function($q) use ($firstDay, $lastDay) {
                    $q->whereBetween('tasks.start_date', [$firstDay . ' 00:00:00', $lastDay . ' 23:59:59'])
                      ->whereNotNull('tasks.start_date');
                })
                ->orWhere(function($q) use ($firstDay, $lastDay) {
                    $q->whereBetween('tasks.due_date', [$firstDay . ' 00:00:00', $lastDay . ' 23:59:59'])
                      ->whereNotNull('tasks.due_date');
                });
            })
            ->orderBy('tasks.start_date', 'asc')
            ->get();

            \Log::info('Tasks found', ['count' => $tasks->count()]);

            return response()->json([
                'success' => true,
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
}
