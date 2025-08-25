<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use \Illuminate\Validation\ValidationException;
use App\Models\Employee;
use App\Models\EmployeeShift;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ShiftController extends Controller
{
    public function showShiftPage()
    {
        return view('shift/shift');
    }

    /**
     * Get employees with their shift data from employee_shifts table
     */
    public function getEmployeesBasic(Request $request)
    {
        $month = $request->input('month', date('m'));
        $year = $request->input('year', date('Y'));

        // Calculate start and end dates for the selected month
        $startDate = Carbon::create($year, $month, 1)->startOfMonth();
        $endDate = Carbon::create($year, $month, 1)->endOfMonth();

        // Get all employees with their shift data for the selected month
        $employees = Employee::select('employees.id', 'employees.name', 'employees.email', 'employees.profile_picture')
            ->leftJoin('employee_shifts', function($join) use ($startDate, $endDate) {
                $join->on('employees.id', '=', 'employee_shifts.employee_id')
                     ->whereBetween('employee_shifts.date_shift', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')]);
            })
            ->select(
                'employees.id',
                'employees.name',
                'employees.email',
                'employees.profile_picture',
                'employee_shifts.id as shift_id',
                'employee_shifts.time_start',
                'employee_shifts.time_end',
                'employee_shifts.date_shift'
            )
            ->where('employees.status', 'active')
            ->orderBy('employees.name')
            ->orderBy('employee_shifts.date_shift', 'asc')
            ->get()
            ->groupBy('id');

        $employeeData = [];

        foreach ($employees as $employeeId => $shifts) {
            $employee = $shifts->first();
            $shiftDetails = [];

            foreach ($shifts as $shift) {
                if ($shift->date_shift) {
                    $shiftDetails[] = [
                        'shift_id' => $shift->shift_id,
                        'date_shift' => Carbon::parse($shift->date_shift)->format('Y-m-d'),
                        'time_start' => $shift->time_start ? Carbon::parse($shift->time_start)->format('H:i') : null,
                        'time_end' => $shift->time_end ? Carbon::parse($shift->time_end)->format('H:i') : null
                    ];
                }
            }

            $employeeData[] = [
                'id' => $employee->id,
                'name' => $employee->name,
                'email' => $employee->email,
                'profile_picture' => $employee->profile_picture ?? '/asset/img/default-profile.png',
                'shifts' => $shiftDetails // Array of shift details for the selected month
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $employeeData,
            'month' => (int)$month,
            'year' => (int)$year
        ]);
    }

    public function index()
    {
        //
    }

    public function create()
    {
        //
    }

    public function store(Request $request)
    {
        //
    }

    public function show(string $id)
    {
        //
    }

    public function edit(string $id)
    {
        //
    }

    public function update(Request $request, string $id)
    {
        try {
            DB::beginTransaction();

            // Validasi input
           $validated = $request->validate([
    'employee_id' => 'required|exists:employees,id',
    'date_shifts' => 'required|array',
    'date_shifts.*' => 'required|date_format:Y-m-d',
    'time_start' => 'required|date_format:H:i',
    'time_end' => 'required|date_format:H:i',
]);

$start = Carbon::createFromFormat('H:i', $validated['time_start']);
$end = Carbon::createFromFormat('H:i', $validated['time_end']);

// Allow overnight shift: if end < start, assume it's next day
if ($end->lessThanOrEqualTo($start)) {
    $end->addDay();
}

$totalHour = $end->diffInHours($start);


            $employeeId = $validated['employee_id'];

            // Delete existing shifts for this employee
            EmployeeShift::where('employee_id', $employeeId)->delete();

            // Create new shifts for each date
          foreach ($validated['date_shifts'] as $date) {
    $formattedDate = Carbon::parse($date)->format('Y-m-d');

    EmployeeShift::create([
        'employee_id' => $employeeId,
        'date_shift' => $formattedDate,
        'time_start' => $validated['time_start'],
        'time_end' => $validated['time_end'],
        'total_hour' => $totalHour
    ]);
}

            DB::commit();
            return response()->json([
                'success' => true,
                'message' => 'Shift updated successfully'
            ]);

        } catch (ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Validation error: ' . $e->getMessage(),
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to update shift: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy(string $id)
    {
        //
    }
}
