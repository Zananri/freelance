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
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use Carbon\Carbon;

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

            $totalTasks = Task::whereIn('project_id', function ($query) use ($currentEmployee) {
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

            $totalTasks = Task::whereIn('project_id', function ($query) use ($currentEmployee) {
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
                    $q->whereBetween('tasks.start_date', [$firstDay . ' 00:00:00', $lastDay . ' 23:59:59'])
                        ->orWhereBetween('tasks.due_date', [$firstDay . ' 00:00:00', $lastDay . ' 23:59:59']);
                })
                ->orderBy('tasks.start_date', 'asc')
                ->get();

            $inProgress = (clone $baseQuery)
                ->where(function ($q) use ($firstDay, $lastDay) {
                    $q->whereBetween('start_date', [$firstDay . ' 00:00:00', $lastDay . ' 23:59:59'])
                        ->orWhereBetween('due_date', [$firstDay . ' 00:00:00', $lastDay . ' 23:59:59']);
                })
                ->whereRaw('LOWER(status) = ?', ['in_progress'])
                ->count();

            $start = (clone $baseQuery)
                ->where(function ($q) use ($firstDay, $lastDay) {
                    $q->whereBetween('start_date', [$firstDay . ' 00:00:00', $lastDay . ' 23:59:59'])
                        ->orWhereBetween('due_date', [$firstDay . ' 00:00:00', $lastDay . ' 23:59:59']);
                })
                ->whereRaw('LOWER(status) = ?', ['not_started'])
                ->count();

            $complete = (clone $baseQuery)
                ->where(function ($q) use ($firstDay, $lastDay) {
                    $q->whereBetween('start_date', [$firstDay . ' 00:00:00', $lastDay . ' 23:59:59'])
                        ->orWhereBetween('due_date', [$firstDay . ' 00:00:00', $lastDay . ' 23:59:59']);
                })
                ->whereRaw('LOWER(status) = ?', ['completed'])
                ->count();

            $finished = (clone $baseQuery)
                ->where(function ($q) use ($firstDay, $lastDay) {
                    $q->whereBetween('start_date', [$firstDay . ' 00:00:00', $lastDay . ' 23:59:59'])
                        ->orWhereBetween('due_date', [$firstDay . ' 00:00:00', $lastDay . ' 23:59:59']);
                })
                ->whereRaw('LOWER(status) = ?', ['finished'])
                ->count();

            $late = (clone $baseQuery)
                ->where(function ($q) use ($firstDay, $lastDay) {
                    $q->whereBetween('start_date', [$firstDay . ' 00:00:00', $lastDay . ' 23:59:59'])
                        ->orWhereBetween('due_date', [$firstDay . ' 00:00:00', $lastDay . ' 23:59:59']);
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

                $totalTasks = Task::whereIn('project_id', function ($query) use ($currentEmployee) {
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

                $totalTasks = Task::whereIn('project_id', function ($query) use ($currentEmployee, $divisionId) {
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

    public function getEmployeeAttendanceByMonth(Request $request)
    {
        try {
            $employeeId = $request->input('employee_id');
            $year = $request->input('year');
            $month = $request->input('month');

            if (!$employeeId || !$year || !$month) {
                return response()->json([
                    'success' => false,
                    'message' => 'Missing required parameters'
                ], 400);
            }

            $firstDay = sprintf('%04d-%02d-01', $year, $month);
            $lastDay = date('Y-m-t', strtotime($firstDay));

            // Dapatkan tanggal hari ini untuk pengecekan pergantian hari
            $today = Carbon::now()->toDateString();

            $attendances = \App\Models\Attendance::where('employee_id', $employeeId)
                ->whereBetween('date_attendance', [$firstDay, $lastDay])
                ->select('date_attendance', 'time_in', 'time_out', 'status')
                ->get()
                ->keyBy('date_attendance');

            $leaveRequests = \App\Models\EmployeeLeaveRequest::where('employee_id', $employeeId)
                ->where('status', 'APPROVED')
                ->where(function ($query) use ($firstDay, $lastDay) {
                    $query->whereBetween('start_date', [$firstDay, $lastDay])
                        ->orWhereBetween('end_date', [$firstDay, $lastDay])
                        ->orWhere(function ($q) use ($firstDay, $lastDay) {
                            $q->where('start_date', '<=', $firstDay)
                                ->where('end_date', '>=', $lastDay);
                        });
                })
                ->select('start_date', 'end_date', 'leave_type')
                ->get();

            $leaveDates = [];
            foreach ($leaveRequests as $leave) {
                $start = new \DateTime($leave->start_date);
                $end = new \DateTime($leave->end_date);
                $interval = new \DateInterval('P1D');
                $period = new \DatePeriod($start, $interval, $end->modify('+1 day'));

                foreach ($period as $date) {
                    $dateStr = $date->format('Y-m-d');
                    if ($dateStr >= $firstDay && $dateStr <= $lastDay) {
                        $leaveDates[$dateStr] = strtoupper($leave->leave_type);
                    }
                }
            }

            $daysInMonth = date('t', strtotime($firstDay));
            $attendanceData = [];

            for ($day = 1; $day <= $daysInMonth; $day++) {
                $dateStr = sprintf('%04d-%02d-%02d', $year, $month, $day);

                $dayData = [
                    'date' => $dateStr,
                    'type' => null,
                    'time_in' => null,
                    'time_out' => null
                ];

                if (isset($leaveDates[$dateStr])) {
                    $leaveType = $leaveDates[$dateStr];
                    if ($leaveType === 'SICK' || $leaveType === 'SAKIT') {
                        $dayData['type'] = 'sick';
                    } elseif ($leaveType === 'ANNUAL_LEAVE' || $leaveType === 'ANNUAL LEAVE' || $leaveType === 'CUTI' || $leaveType === 'LEAVE') {
                        $dayData['type'] = 'leave';
                    }
                } elseif (isset($attendances[$dateStr])) {
                    $attendance = $attendances[$dateStr];

                    if ($attendance->status === 'ABSENT') {
                        $dayData['type'] = 'absent';
                    } elseif ($attendance->time_in && $attendance->time_out) {
                        // Cek apakah time_out adalah 00:00:00 atau 00:00
                        // Jika iya, anggap sebagai TIDAK CHECKOUT (sama dengan NULL)
                        $timeOutStr = is_string($attendance->time_out) 
                            ? trim($attendance->time_out) 
                            : (string)$attendance->time_out;
                        
                        // Ekstrak hanya bagian waktu (HH:MM:SS atau HH:MM)
                        if (strpos($timeOutStr, ' ') !== false) {
                            // Format: YYYY-MM-DD HH:MM:SS
                            $timeOutStr = explode(' ', $timeOutStr)[1];
                        }
                        
                        // Jika time_out adalah 00:00:00 atau 00:00, anggap sebagai tidak checkout
                        if ($timeOutStr === '00:00:00' || $timeOutStr === '00:00') {
                            $dayData['type'] = 'check_in_only';
                            $dayData['time_in'] = $attendance->time_in;
                            // time_out tetap null, akan ditampilkan sebagai --:-- di frontend
                        } else {
                            // time_out valid (bukan 00:00:00)
                            $dayData['type'] = 'check_in_out';
                            $dayData['time_in'] = $attendance->time_in;
                            $dayData['time_out'] = $attendance->time_out;
                        }
                    } elseif ($attendance->time_in && !$attendance->time_out) {
                        // Jika sudah berganti hari (tanggal attendance < hari ini) dan belum checkout,
                        // maka tetap tampilkan sebagai check_in_only (checkout --:--)
                        // Ini memastikan bahwa setelah jam 00:00, employee yang belum checkout
                        // tidak akan bisa checkout lagi dan akan ditampilkan sebagai tidak checkout
                        $dayData['type'] = 'check_in_only';
                        $dayData['time_in'] = $attendance->time_in;
                        // time_out akan tetap null, yang akan ditampilkan sebagai --:-- di frontend
                    }
                }

                if ($dayData['type'] !== null) {
                    $attendanceData[] = $dayData;
                }
            }

            return response()->json([
                'success' => true,
                'data' => $attendanceData
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching attendance: ' . $e->getMessage(),
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function exportEmployeeTasksByMonth(Request $request)
    {
        try {
            $employeeId = $request->input('employee_id');
            $year = $request->input('year');
            $month = $request->input('month');

            if (!$employeeId || !$year || !$month) {
                return response()->json([
                    'success' => false,
                    'message' => 'Missing required parameters'
                ], 400);
            }

            $employee = Employee::with('division', 'department', 'job')->find($employeeId);

            if (!$employee) {
                return response()->json([
                    'success' => false,
                    'message' => 'Employee not found'
                ], 404);
            }

            $firstDay = sprintf('%04d-%02d-01', $year, $month);
            $lastDay = date('Y-m-t', strtotime($firstDay));

            // Get all task IDs assigned to this employee
            $taskAssignments = TaskAssignment::where('employee_id', $employeeId)->pluck('task_id');

            // Get all projects where employee has tasks assigned
            $projectIds = Task::whereIn('id', $taskAssignments)
                ->whereNotIn(DB::raw('LOWER(status)'), ['canceled', 'deleted'])
                ->distinct()
                ->pluck('project_id');

            // Get all projects with their tasks filtered by month
            $projects = Project::whereIn('id', $projectIds)
                ->whereNotIn(DB::raw('LOWER(status)'), ['canceled', 'deleted'])
                ->with([
                    'tasks' => function ($query) use ($taskAssignments, $firstDay, $lastDay) {
                        $query->whereIn('id', $taskAssignments)
                            ->whereNotIn(DB::raw('LOWER(status)'), ['canceled', 'deleted'])
                            ->where(function ($q) use ($firstDay, $lastDay) {
                                $q->whereBetween('start_date', [$firstDay . ' 00:00:00', $lastDay . ' 23:59:59'])
                                    ->orWhereBetween('due_date', [$firstDay . ' 00:00:00', $lastDay . ' 23:59:59']);
                            })
                            ->orderBy('start_date', 'asc');
                    },
                    'tasks.assignments.employee'
                ])
                ->orderBy('created_at', 'desc')
                ->get();

            // Create spreadsheet
            $spreadsheet = new Spreadsheet();
            $activeWorksheet = $spreadsheet->getActiveSheet();

            $monthName = date('F', mktime(0, 0, 0, $month, 1));
            
            // Set title
            $activeWorksheet->mergeCells('A1:M1');
            $activeWorksheet->setCellValue('A1', "Project Report - {$employee->name} - {$monthName} {$year}");
            $activeWorksheet->getStyle('A1')->getFont()->setBold(true)->setSize(16);
            $activeWorksheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

            // Set headers
            $headers = [
                'A2' => 'No',
                'B2' => 'Project Name',
                'C2' => 'Project Reff URL',
                'D2' => 'Project Reff File',
                'E2' => 'Task',
                'F2' => 'Status',
                'G2' => 'Duration',
                'H2' => 'PIC',
                'I2' => 'Executor',
                'J2' => 'Task Reff File',
                'K2' => 'Task Ref Url',
                'L2' => 'Complete Task',
                'M2' => 'Total Tasks'
            ];

            foreach ($headers as $cell => $value) {
                $activeWorksheet->setCellValue($cell, $value);
            }

            // Style headers
            $headerStyle = [
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                    ],
                ],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => [
                        'argb' => 'FFE0E0E0',
                    ],
                ],
            ];

            $activeWorksheet->getStyle('A2:M2')->applyFromArray($headerStyle)->getFont()->setBold(true)->setSize(10);
            $activeWorksheet->getStyle('A2:M2')
                ->getAlignment()
                ->setWrapText(true)
                ->setHorizontal(Alignment::HORIZONTAL_CENTER)
                ->setVertical(Alignment::VERTICAL_CENTER);

            // Set column widths
            $columnWidths = [
                'A' => 5,   // No
                'B' => 30,  // Project Name
                'C' => 25,  // Project Reff URL
                'D' => 25,  // Project Reff File
                'E' => 35,  // Task
                'F' => 15,  // Status
                'G' => 20,  // Duration
                'H' => 20,  // PIC
                'I' => 20,  // Executor
                'J' => 25,  // Task Reff File
                'K' => 25,  // Task Ref Url
                'L' => 35,  // Complete Task
                'M' => 12   // Total Tasks
            ];

            foreach ($columnWidths as $column => $width) {
                $activeWorksheet->getColumnDimension($column)->setWidth($width);
            }

            // Helper to format duration
            $formatDuration = function ($startRaw, $endRaw) {
                if (empty($startRaw) && empty($endRaw)) return '-';
                try {
                    $start = $startRaw ? Carbon::parse($startRaw) : null;
                } catch (\Throwable $_) {
                    $start = null;
                }
                try {
                    $end = $endRaw ? Carbon::parse($endRaw) : null;
                } catch (\Throwable $_) {
                    $end = null;
                }
                if ($start && !$end) return $start->format('j F Y');
                if (!$start && $end) return $end->format('j F Y');
                if (!$start && !$end) return '-';
                $sY = $start->format('Y');
                $eY = $end->format('Y');
                $sM = $start->format('F');
                $eM = $end->format('F');
                $sD = $start->format('j');
                $eD = $end->format('j');
                if ($sY === $eY) {
                    if ($sM === $eM) {
                        if ($sD === $eD) return "{$sD} {$sM} {$sY}";
                        return "{$sD}-{$eD} {$sM} {$sY}";
                    }
                    return "{$sD} {$sM} - {$eD} {$eM} {$sY}";
                }
                return "{$sD} {$sM} {$sY} - {$eD} {$eM} {$eY}";
            };

            // Helper to get PIC from task (not project)
            $getPIC = function ($task) {
                if (!$task->assignments) return '-';
                $picAssign = $task->assignments->firstWhere('role', 'PIC');
                return $picAssign && $picAssign->employee ? ($picAssign->employee->name ?? '-') : '-';
            };

            // Helper to get Executors from task
            $getExecutors = function ($task) {
                if (!$task->assignments) return '-';
                $executors = $task->assignments->where('role', 'EXECUTOR')
                    ->map(function ($assignment) {
                        return $assignment->employee ? $assignment->employee->name : null;
                    })
                    ->filter()
                    ->unique()
                    ->values();
                return $executors->count() > 0 ? $executors->implode(', ') : '-';
            };

            // Helper to sanitize HTML to plain text (preserve basic line breaks)
            $sanitizeText = function ($text) {
                $t = (string) ($text ?? '');
                if ($t === '') return '';
                $t = preg_replace('/<\s*br\s*\/?>/i', "\n", $t);
                $t = preg_replace('/<\/(p|div|li|h[1-6])>/i', "\n", $t);
                $t = strip_tags($t);
                $t = html_entity_decode($t, ENT_QUOTES | ENT_HTML5, 'UTF-8');
                $t = preg_replace("/[\r\n]+/", "\n", $t);
                return trim($t);
            };

            // Helper to stringify list items (files/urls) robustly
            $stringifyList = function ($items) use ($sanitizeText) {
                $out = [];
                foreach ((array) $items as $item) {
                    if (is_array($item)) {
                        $candidate = $item['name'] ?? $item['filename'] ?? $item['path'] ?? $item['url'] ?? $item['link'] ?? null;
                        if ($candidate !== null) {
                            $out[] = $sanitizeText($candidate);
                        }
                    } elseif (is_object($item)) {
                        try {
                            $candidate = $item->name ?? $item->filename ?? $item->path ?? $item->url ?? $item->link ?? null;
                            if ($candidate !== null) {
                                $out[] = $sanitizeText($candidate);
                            }
                        } catch (\Throwable $_) {}
                    } else {
                        $val = $sanitizeText($item);
                        if ($val !== '') {
                            $out[] = $val;
                        }
                    }
                }
                // unique and non-empty
                $out = array_values(array_unique(array_filter($out, fn($v) => $v !== '')));
                return $out;
            };

            // Fill data
            $row = 3;
            $no = 1;

            foreach ($projects as $project) {
                $baseProjectValues = [
                    'B' => $project->title,
                    'C' => is_array($project->reference_urls) && count($project->reference_urls) > 0 
                        ? implode("\n", array_filter($project->reference_urls)) 
                        : ($project->reference_url ?? '-'),
                    'D' => is_array($project->reference_files) && count($project->reference_files) > 0 
                        ? implode("\n", array_filter($project->reference_files)) 
                        : ($project->reference_file ?? '-'),
                    'L' => $project->tasks->count(),
                ];

                if ($project->tasks->count() > 0) {
                    // Project has tasks in this month
                    $projectStartRow = $row;
                    $projectNo = $no;
                    
                    foreach ($project->tasks as $task) {
                        // Project columns
                        $activeWorksheet->setCellValue('B' . $row, $baseProjectValues['B']);
                        $activeWorksheet->setCellValue('C' . $row, $baseProjectValues['C']);
                        $activeWorksheet->setCellValue('D' . $row, $baseProjectValues['D']);

                        // Task columns
                        $activeWorksheet->setCellValue('E' . $row, $task->title ?? '-');
                        $s = (string) ($task->status ?? '');
                        $s = str_replace('_', ' ', $s);
                        $s = trim($s);
                        $s = $s === '' ? '-' : ucfirst($s);
                        $activeWorksheet->setCellValue('F' . $row, $s);

                        // Duration: use task dates
                        $startRaw = $task->start_date;
                        $endRaw = $task->due_date;
                        $activeWorksheet->setCellValue('G' . $row, $formatDuration($startRaw, $endRaw));

                        // PIC (from task assignments)
                        $activeWorksheet->setCellValue('H' . $row, $getPIC($task));

                        // Executor (from task assignments)
                        $activeWorksheet->setCellValue('I' . $row, $getExecutors($task));

                        // Task Reference Files
                        $taskReffFiles = is_array($task->reference_files) && count($task->reference_files) > 0 
                            ? implode("\n", array_filter($task->reference_files)) 
                            : ($task->reference_file ?? '-');
                        $activeWorksheet->setCellValue('J' . $row, $taskReffFiles);

                        // Task Reference URLs
                        $taskReffUrls = is_array($task->reference_urls) && count($task->reference_urls) > 0 
                            ? implode("\n", array_filter($task->reference_urls)) 
                            : ($task->reference_url ?? '-');
                        $activeWorksheet->setCellValue('K' . $row, $taskReffUrls);

                        // Complete Task (note + files + urls) - sanitized to plain text
                        $completeNote = $sanitizeText($task->complete_note ?? '');
                        $completeFilesArr = $stringifyList($task->complete_files ?? []);
                        $completeUrlsArr = $stringifyList($task->complete_urls ?? []);

                        $completeLines = [];
                        if ($completeNote !== '') {
                            $completeLines[] = 'Description: ' . $completeNote;
                        }
                        if (count($completeFilesArr) > 0) {
                            $completeLines[] = 'Complete Files: ' . implode("\n", $completeFilesArr);
                        }
                        if (count($completeUrlsArr) > 0) {
                            $completeLines[] = 'Complete Urls: ' . implode("\n", $completeUrlsArr);
                        }
                        $completeText = count($completeLines) > 0 ? implode("\n", $completeLines) : '-';
                        $activeWorksheet->setCellValue('L' . $row, $completeText);

                        // Total Tasks
                        $activeWorksheet->setCellValue('M' . $row, $baseProjectValues['L']);

                        $activeWorksheet->getRowDimension($row)->setRowHeight(-1);

                        $row++;
                    }

                    // Merge project columns if multiple tasks
                    $projectEndRow = $row - 1;

                    $activeWorksheet->setCellValue('A' . $projectStartRow, $projectNo);
                    if ($projectEndRow > $projectStartRow) {
                        // Only merge project-level columns (not PIC and Executor which are task-level)
                        $colsToMerge = ['A', 'B', 'C', 'D', 'M'];
                        foreach ($colsToMerge as $col) {
                            $activeWorksheet->mergeCells($col . $projectStartRow . ':' . $col . $projectEndRow);
                            $activeWorksheet->getStyle($col . $projectStartRow . ':' . $col . $projectEndRow)
                                ->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER)
                                ->setVertical(Alignment::VERTICAL_CENTER);
                        }
                    }

                    $no++;
                } else {
                    // Project has no tasks in this month - show with "-"
                    $activeWorksheet->setCellValue('A' . $row, $no);
                    $activeWorksheet->getStyle('A' . $row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER)->setVertical(Alignment::VERTICAL_CENTER);
                    
                    $activeWorksheet->setCellValue('B' . $row, $baseProjectValues['B']);
                    $activeWorksheet->getStyle('B' . $row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER)->setVertical(Alignment::VERTICAL_CENTER);
                    
                    $activeWorksheet->setCellValue('C' . $row, $baseProjectValues['C']);
                    $activeWorksheet->getStyle('C' . $row)->getAlignment()->setWrapText(true)->setVertical(Alignment::VERTICAL_TOP);
                    
                    $activeWorksheet->setCellValue('D' . $row, $baseProjectValues['D']);
                    $activeWorksheet->getStyle('D' . $row)->getAlignment()->setWrapText(true)->setVertical(Alignment::VERTICAL_TOP);
                    
                    $activeWorksheet->setCellValue('E' . $row, '-');
                    $activeWorksheet->setCellValue('F' . $row, '-');
                    $activeWorksheet->setCellValue('G' . $row, '-');
                    $activeWorksheet->getStyle('G' . $row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER)->setVertical(Alignment::VERTICAL_CENTER);
                    
                    $activeWorksheet->setCellValue('H' . $row, '-');
                    $activeWorksheet->setCellValue('I' . $row, '-');
                    $activeWorksheet->setCellValue('J' . $row, '-');
                    $activeWorksheet->setCellValue('K' . $row, '-');
                    
                    $activeWorksheet->setCellValue('L' . $row, '-');
                    $activeWorksheet->setCellValue('M' . $row, $baseProjectValues['L']);
                    $activeWorksheet->getStyle('M' . $row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER)->setVertical(Alignment::VERTICAL_CENTER);
                    
                    $activeWorksheet->getRowDimension($row)->setRowHeight(-1);

                    $row++;
                    $no++;
                }
            }

            // Apply borders to data rows
            $dataStyle = [
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                    ],
                ],
            ];

            if ($row > 3) {
                $activeWorksheet->getStyle('A3:M' . ($row - 1))->applyFromArray($dataStyle);

                // Center align specific columns
                $activeWorksheet->getStyle('A3:A' . ($row - 1))->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $activeWorksheet->getStyle('G3:G' . ($row - 1))->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $activeWorksheet->getStyle('M3:M' . ($row - 1))->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

                // Enable text wrapping for relevant columns
                $activeWorksheet->getStyle('C3:F' . ($row - 1))->getAlignment()->setWrapText(true);
                $activeWorksheet->getStyle('C3:F' . ($row - 1))->getAlignment()->setVertical(Alignment::VERTICAL_TOP);
                
                $activeWorksheet->getStyle('H3:L' . ($row - 1))->getAlignment()->setWrapText(true);
                $activeWorksheet->getStyle('H3:L' . ($row - 1))->getAlignment()->setVertical(Alignment::VERTICAL_TOP);
            }

            // Set sheet name
            $activeWorksheet->setTitle('Project Report');

            // Generate filename
            $employeeNameSlug = preg_replace('/[^A-Za-z0-9_\-]/', '_', $employee->name);
            $filename = "project_report_{$employeeNameSlug}_{$monthName}_{$year}.xlsx";

            // Create writer and download
            $writer = new Xlsx($spreadsheet);

            $tempFile = tempnam(sys_get_temp_dir(), 'project_export');
            $writer->save($tempFile);

            return response()->download($tempFile, $filename, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ])->deleteFileAfterSend(true);

        } catch (\Exception $e) {
            Log::error('Export error: '.$e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error exporting tasks: '.$e->getMessage()
            ], 500);
        }
    }

}
