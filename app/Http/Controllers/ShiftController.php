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
        // Get all employees with their most recent shift data
        $employees = Employee::select('employees.id', 'employees.name', 'employees.email', 'employees.profile_picture')
            ->leftJoin('employee_shifts', 'employees.id', '=', 'employee_shifts.employee_id')
            ->select(
                'employees.id',
                'employees.name',
                'employees.email',
                'employees.profile_picture',
                'employee_shifts.time_start',
                'employee_shifts.time_end',
                'employee_shifts.date_shift'
            )
            ->where('employees.status', 'active')
            ->orderBy('employee_shifts.date_shift', 'desc')
            ->get()
            ->groupBy('id')
            ->map(function ($shifts) {
                // Get the most recent shift for each employee
                return $shifts->first();
            });

        $employeeData = [];
        
        foreach ($employees as $employee) {
            $employeeData[] = [
                'id' => $employee->id,
                'name' => $employee->name,
                'email' => $employee->email,
                'profile_picture' => $employee->profile_picture ?? '/asset/img/default-profile.png',
                'start_time' => $employee->time_start ? Carbon::parse($employee->time_start)->format('H:i') : null,
                'end_time' => $employee->time_end ? Carbon::parse($employee->time_end)->format('H:i') : null,
                'date_shift' => $employee->date_shift ? Carbon::parse($employee->date_shift)->format('Y-m-d') : null
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
                'date_shift' => 'required|date',
                'time_start' => 'required|date_format:H:i',
                'time_end' => 'required|date_format:H:i|after:time_start',
            ]);

            $shift = EmployeeShift::findOrFail($id);
            
            $shift->update([
                'date_shift' => $request->date_shift,
                'time_start' => $request->time_start,
                'time_end' => $request->time_end,
                'total_hour' => Carbon::parse($request->time_end)->diffInHours(Carbon::parse($request->time_start))
            ]);

            DB::commit();
            return response()->json([
                'success' => true,
                'message' => 'Shift updated successfully',
                'data' => $shift
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
