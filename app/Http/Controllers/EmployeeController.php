<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class EmployeeController extends Controller
{
    public function index(Request $request)
    {
        $employees = Employee::all();
        return response()->json(['data' => $employees]);
    }

    public function show($id)
    {
        $employee = Employee::find($id);
        if (!$employee) {
            return response()->json(['message' => 'Employee not found'], 404);
        }
        return response()->json($employee);
    }

    public function create()
    {
        return view('employee.create');
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'department_id' => 'required|exists:departments,id',
            'division_id' => 'required|exists:divisions,id',
            'job_id' => 'required|exists:jobs,id',
            'profile_picture' => 'nullable|string',
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:employees,email',
            'phone' => 'required|integer|max:14|unique:employees,phone',
            'status' => 'required|string',
            'address' => 'required|string',
            'photo' => 'nullable|string',
            'ktp' => 'nullable|string',
            'birth_date' => 'required|date',
            'hire_date' => 'required|date',
            'resign_date' => 'nullable|date',
            'grade' => 'required|string',
            'office' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $employee = Employee::create([
            'department_id' => $request->department_id,
            'division_id' => $request->division_id,
            'job_id' => $request->job_id,
            'profile_picture' => $request->profile_picture,
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'status' => $request->status,
            'address' => $request->address,
            'photo' => $request->photo,
            'ktp' => $request->ktp,
            'birth_date' => $request->birth_date,
            'hire_date' => $request->hire_date,
            'resign_date' => $request->resign_date,
            'grade' => $request->grade,
            'office' => $request->office,
            'created_by' => 1,
            'updated_by' => 1,
            'deleted_by' => 1,
        ]);

        return response()->json(['message' => 'Employee created successfully', 'data' => $employee]);
    }

    public function update(Request $request, $id)
    {
        $employee = Employee::find($id);
        if (!$employee) {
            return response()->json(['message' => 'Employee not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'department_id' => 'sometimes|exists:departments,id',
            'division_id' => 'sometimes|exists:divisions,id',
            'job_id' => 'sometimes|exists:jobs,id',
            'profile_picture' => 'nullable|string',
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:employees,email,' . $id,
            'phone' => 'sometimes|string|unique:employees,phone,' . $id,
            'status' => 'sometimes|string',
            'address' => 'sometimes|string',
            'photo' => 'nullable|string',
            'ktp' => 'nullable|string',
            'birth_date' => 'sometimes|date',
            'hire_date' => 'sometimes|date',
            'resign_date' => 'nullable|date',
            'grade' => 'sometimes|string',
            'office' => 'sometimes|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $updateData = $request->only([
            'department_id', 'division_id', 'job_id', 'profile_picture', 'name', 'email', 'phone', 'status',
            'address', 'photo', 'ktp', 'birth_date', 'hire_date', 'resign_date', 'grade', 'office'
        ]);
        $updateData['updated_by'] = 1;

        $employee->update($updateData);

        return response()->json(['message' => 'Employee updated successfully', 'data' => $employee]);
    }

    public function destroy($id)
    {
        $employee = Employee::find($id);
        if (!$employee) {
            return response()->json(['message' => 'Employee not found'], 404);
        }

        $employee->deleted_by = 1;
        $employee->delete();

        return response()->json(['message' => 'Employee deleted successfully']);
    }
}
