<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Employee;
use App\Models\EmployeeShift;
use Carbon\Carbon;

class ShiftController extends Controller
{
    public function showShiftPage()
    {
        return view('shift/shift');
    }

    /**
     * Get employees with their shift data from employee_shifts table
     */
    public function getEmployeesBasic()
    {
        // Get all employees with ALL their shift data
        $employees = Employee::select('employees.id', 'employees.name', 'employees.email', 'employees.profile_picture')
            ->leftJoin('employee_shifts', 'employees.id', '=', 'employee_shifts.employee_id')
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
            $dateShifts = [];
            $shiftDetails = [];
            
            foreach ($shifts as $shift) {
                if ($shift->date_shift) {
                    $dateShifts[] = Carbon::parse($shift->date_shift)->format('Y-m-d');
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
                'start_time' => $shifts->first()->time_start ? Carbon::parse($shifts->first()->time_start)->format('H:i') : null,
                'end_time' => $shifts->first()->time_end ? Carbon::parse($shifts->first()->time_end)->format('H:i') : null,
                'date_shift' => $dateShifts, // Array of all dates
                'shifts' => $shiftDetails // Array of all shift details
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $employeeData
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
            
            $request->validate([
                'date_shifts' => 'required|array',
                'date_shifts.*' => 'required|date',
                'time_start' => 'required|date_format:H:i',
                'time_end' => 'required|date_format:H:i|after:time_start',
            ]);

            $employeeId = $request->employee_id;
            
            // Delete existing shifts for this employee
            EmployeeShift::where('employee_id', $employeeId)->delete();
            
            // Create new shifts for each date
            foreach ($request->date_shifts as $date) {
                EmployeeShift::create([
                    'employee_id' => $employeeId,
                    'date_shift' => $date,
                    'time_start' => $request->time_start,
                    'time_end' => $request->time_end,
                    'total_hour' => Carbon::parse($request->time_end)->diffInHours(Carbon::parse($request->time_start))
                ]);
            }

            DB::commit();
            return response()->json([
                'success' => true,
                'message' => 'Shift updated successfully'
            ]);

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
