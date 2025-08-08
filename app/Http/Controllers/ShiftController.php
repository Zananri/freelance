<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Employee;
use App\Models\Shift;

class ShiftController extends Controller
{
    /**
     * Display a listing of the resource.
     */

    public function showShiftPage()
    {
        return view('shift/shift');
    }

    /**
     * Get all employees with shift data
     */
    public function getEmployeesWithShifts()
    {
        // For now, get all employees and create dummy shift data
        // In real implementation, this should fetch actual shift data
        $employees = Employee::with(['department', 'division', 'job'])
            ->select('id', 'first_name', 'last_name', 'email', 'profile_picture', 'department_id', 'division_id', 'job_id', 'status')
            ->where('status', 'active')
            ->get();

        $shifts = [];
        
        foreach ($employees as $employee) {
            $shifts[] = [
                'id' => $employee->id,
                'employee' => [
                    'first_name' => $employee->first_name,
                    'last_name' => $employee->last_name,
                    'email' => $employee->email,
                    'profile_picture' => $employee->profile_picture ?? '/asset/img/default-profile.png'
                ],
                'shift_name' => 'Morning Shift', // Dummy data
                'start_time' => '08:00', // Dummy data
                'end_time' => '16:00', // Dummy data
                'date' => now()->format('Y-m-d'), // Dummy data
                'status' => 'Active' // Dummy data
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $shifts
        ]);
    }

    /**
     * Get simplified employee data for shift display
     */
    public function getEmployeesBasic()
    {
        $employees = Employee::select('id', 'name', 'email', 'profile_picture')
            ->where('status', 'active')
            ->get();

        $employeeData = [];
        
        foreach ($employees as $employee) {
            $employeeData[] = [
                'id' => $employee->id,
                'name' => $employee->name,
                'email' => $employee->email,
                'profile_picture' => $employee->profile_picture ?? '/asset/img/default-profile.png',
                'employee_id' => $employee->id // Use id as employee_id since there's no separate employee_id column
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

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
