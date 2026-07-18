<?php

namespace App\Console\Commands;

use Carbon\Carbon;
use Illuminate\Console\Command;

use App\Models\Attendance;
use App\Models\Employee;
use App\Models\EmployeeShift;
use App\Models\EmployeeLeaveRequest;
use App\Models\Notification;
use App\Http\Controllers\NotificationController;

class CheckAbsentEmployee extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:check-absent-employee';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Command description';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $today = Carbon::today()->toDateString();
        $now = Carbon::now();

        $employees = Employee::with([
            'shift',
            'division',
            'department'
        ])
            ->where('status', 'ACTIVE')
            ->get();

        foreach ($employees as $employee) {

            $this->processEmployee($employee, $today, $now);
        }

        $this->info('Attendance notification checked.');
    }

    private function processEmployee($employee, $today, $now)
    {
        $employeeShift = EmployeeShift::with('shift')
            ->where('employee_id', $employee->id)
            ->where('date_shift', $today)
            ->first();

        $shift = $employeeShift?->shift ?? $employee->shift;

        if (!$shift) {
            return;
        }

        /**
         * WEEKDAY OFF
         */

        if (!empty($shift->weekday_off)) {

            $weekdayOff = json_decode($shift->weekday_off, true);

            if (in_array(Carbon::today()->dayOfWeekIso, $weekdayOff)) {
                return;
            }
        }

        /**
         * LEAVE
         */

        $leave = EmployeeLeaveRequest::where('employee_id', $employee->id)
            ->where('status', 'APPROVED')
            ->whereDate('start_date', '<=', $today)
            ->whereDate('end_date', '>=', $today)
            ->first();

        dd($leave);

        if ($leave) {

            $this->sendLeaveNotification($employee, $leave, $today);

            return;
        }

        /**
         * SHIFT END
         */

        $timeStart = Carbon::parse($today . ' ' . $shift->time_start);
        $timeEnd = Carbon::parse($today . ' ' . $shift->time_end);

        if ($timeEnd->lt($timeStart)) {
            $timeEnd->addDay();
        }

        if ($now->lt($timeEnd)) {
            return;
        }

        /**
         * ATTENDANCE
         */

        $attendance = Attendance::where('employee_id', $employee->id)
            ->whereDate('date_attendance', $today)
            ->first();

        if ($attendance) {
            return;
        }

        $this->sendAbsentNotification($employee, $today);
    }

    private function sendLeaveNotification($employee, $leave, $today)
    {
        $departmentId = $employee->department_id;

        $type = match ($leave->leave_type) {
            'ANNUAL_LEAVE' => 'Annual Leave',
            'SICK' => 'Sick Leave',
            'PERMISSION' => 'Permission',
            default => $leave->leave_type,
        };

        $recipients = Employee::query()
            ->join('users', 'employees.user_id', '=', 'users.id')
            ->select('employees.*')
            ->where('employees.status', 'ACTIVE')
            ->where(function ($q) use ($departmentId) {

                $q->where(function ($qq) use ($departmentId) {

                    $qq->where('users.user_type', 'ADMINISTRATOR')
                        ->where('employees.department_id', $departmentId);
                })->orWhere('users.user_type', 'SUPERADMIN');
            })
            ->get();

        foreach ($recipients as $recipient) {

            $exist = Notification::where('employee_id', $recipient->id)
                ->where('type', 'attendance_leave')
                ->whereDate('sent_at', $today)
                ->where('message', 'LIKE', '%' . $employee->name . '%')
                ->exists();

            if ($exist) {
                continue;
            }

            NotificationController::createUserNotification(

                $recipient->id,

                'attendance_leave',

                'Employee Leave',

                "Employee : {$employee->name}\n" .
                    "Department : " . $employee->department?->name_department . "\n" .
                    "Division : " . $employee->division?->name_division . "\n" .
                    "Status : {$type}",

                0
            );
        }
    }

    private function sendAbsentNotification($employee, $today)
    {
        $departmentId = $employee->department_id;

        $recipients = Employee::query()
            ->join('users', 'employees.user_id', '=', 'users.id')
            ->select('employees.*')
            ->where('employees.status', 'ACTIVE')
            ->where(function ($q) use ($departmentId) {

                $q->where(function ($qq) use ($departmentId) {

                    $qq->where('users.user_type', 'ADMINISTRATOR')
                        ->where('employees.department_id', $departmentId);
                })->orWhere('users.user_type', 'SUPERADMIN');
            })
            ->get();

        foreach ($recipients as $recipient) {

            $exist = Notification::where('employee_id', $recipient->id)
                ->where('type', 'attendance_absent')
                ->whereDate('sent_at', $today)
                ->where('message', 'LIKE', '%' . $employee->name . '%')
                ->exists();

            if ($exist) {
                continue;
            }

            NotificationController::createUserNotification(

                $recipient->id,

                'attendance_absent',

                'Absent Attendance Alert',

                "Employee : {$employee->name}\n" .
                    "Department : " . $employee->department?->name_department . "\n" .
                    "Division : " . $employee->division?->name_division . "\n" .
                    "Status : Absent",

                0
            );
        }
    }
}
