<?php

namespace App\Console\Commands;

use App\Helpers\ActivityHelper;
use App\Models\Attendance;
use App\Models\AttendanceTracking;
use App\Models\EmployeeShift;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class AutoCheckoutEmployees extends Command
{
    private const DEPARTMENTS = [
        'BPSDM',
        'KEMENAG',
        'SEMARANG',
        'SEKWAN JATENG',
        'SEKWAN KENDAL',
    ];

    protected $signature = 'attendance:auto-checkout';

    protected $description = 'Automatically check out selected departments when their shift ends';

    public function handle(): int
    {
        $now = Carbon::now();
        $checkedOut = 0;

        Attendance::query()
            ->with(['employee.department', 'employee.shift'])
            ->whereNotNull('time_in')
            ->whereNull('time_out')
            ->whereHas('employee.department', function ($query) {
                $query->whereIn(DB::raw('UPPER(TRIM(name_department))'), self::DEPARTMENTS);
            })
            ->chunkById(100, function ($attendances) use ($now, &$checkedOut) {
                foreach ($attendances as $attendance) {
                    $shiftEnd = $this->resolveShiftEnd($attendance);

                    if ($shiftEnd === null || $now->lt($shiftEnd)) {
                        continue;
                    }

                    if ($this->checkout($attendance->id, $shiftEnd)) {
                        $checkedOut++;
                    }
                }
            });

        $this->info("Automatically checked out {$checkedOut} employee(s).");

        return self::SUCCESS;
    }

    private function resolveShiftEnd(Attendance $attendance): ?Carbon
    {
        $shiftStartTime = $attendance->shift_time_start;
        $shiftEndTime = $attendance->shift_time_end;

        if (!$shiftStartTime || !$shiftEndTime) {
            $employeeShift = EmployeeShift::with('shift')
                ->where('employee_id', $attendance->employee_id)
                ->whereDate('date_shift', $attendance->date_attendance)
                ->first();
            $shift = $employeeShift?->shift ?? $attendance->employee?->shift;
            $shiftStartTime = $shift?->time_start;
            $shiftEndTime = $shift?->time_end;
        }

        if (!$shiftStartTime || !$shiftEndTime) {
            return null;
        }

        $shiftStart = Carbon::parse($attendance->date_attendance . ' ' . $shiftStartTime);
        $shiftEnd = Carbon::parse($attendance->date_attendance . ' ' . $shiftEndTime);

        if ($shiftEnd->lte($shiftStart)) {
            $shiftEnd->addDay();
        }

        return $shiftEnd;
    }

    private function checkout(int $attendanceId, Carbon $shiftEnd): bool
    {
        return DB::transaction(function () use ($attendanceId, $shiftEnd) {
            $attendance = Attendance::with('employee')
                ->lockForUpdate()
                ->find($attendanceId);

            if (!$attendance || $attendance->time_out !== null) {
                return false;
            }

            $actorId = $attendance->employee?->user_id;
            $firstCheckin = AttendanceTracking::where('attendance_id', $attendance->id)
                ->where('type', 'check_in')
                ->orderBy('date_time')
                ->first();

            $totalWorkDuration = null;
            if ($firstCheckin) {
                $workedSeconds = (int) max(
                    0,
                    Carbon::parse($firstCheckin->date_time)->diffInSeconds($shiftEnd, false)
                );
                $totalWorkDuration = sprintf(
                    '%02d:%02d:%02d',
                    intdiv($workedSeconds, 3600),
                    intdiv($workedSeconds % 3600, 60),
                    $workedSeconds % 60
                );
            }

            $attendance->update([
                'time_out' => $shiftEnd->format('H:i'),
                'total_work_duration' => $totalWorkDuration,
                'status' => 'PRESENT',
                'updated_by' => $actorId,
            ]);

            AttendanceTracking::firstOrCreate(
                [
                    'attendance_id' => $attendance->id,
                    'type' => 'check_out',
                ],
                [
                    'location' => null,
                    'image' => [],
                    'date_time' => $shiftEnd,
                    'device' => 'SYSTEM_AUTO_CHECKOUT',
                    'created_by' => $actorId,
                    'updated_by' => $actorId,
                ]
            );

            ActivityHelper::record([
                'employee_id' => $attendance->employee_id,
                'menu' => 'ATTENDANCE',
                'activity' => 'CHECK_OUT',
                'description' => ($attendance->employee?->name ?? 'Unknown') . ' automatically checked out',
                'date_time_activity' => $shiftEnd,
            ]);

            return true;
        });
    }
}
