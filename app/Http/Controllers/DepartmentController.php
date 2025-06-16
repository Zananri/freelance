<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Models\Department;

class DepartmentController extends Controller
{
    // Display a listing of the departments
    public function index()
    {
        $departments = Department::all();
        return response()->json($departments);
    }

    // Display the specified department
    public function show($id)
    {
        $department = Department::find($id);
        if (!$department) {
            return response()->json(['message' => 'Department not found'], 404);
        }
        return response()->json($department);
    }

    // Store a newly created department
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name_department' => 'required|string|max:255',
            'status' => 'required|string|in:active,inactive',
            'created_by' => 'nullable|integer',
            'deleted_by' => 'nullable|integer',
            'updated_by' => 'nullable|integer',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $department = Department::create([
            'name_department' => $request->name_department,
            'status' => $request->status,
            'created_by' => $request->created_by,
            'deleted_by' => $request->deleted_by,
            'updated_by' => $request->updated_by,
        ]);

        return response()->json(['message' => 'Department added successfully', 'department' => $department]);
    }

    // Update the specified department
    public function update(Request $request, $id)
    {
        $department = Department::find($id);
        if (!$department) {
            return response()->json(['message' => 'Department not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name_department' => 'required|string|max:255',
            'status' => 'required|string|in:active,inactive',
            'created_by' => 'nullable|integer',
            'deleted_by' => 'nullable|integer',
            'updated_by' => 'nullable|integer',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $department->update([
            'name_department' => $request->name_department,
            'status' => $request->status,
            'created_by' => $request->created_by,
            'deleted_by' => $request->deleted_by,
            'updated_by' => $request->updated_by,
        ]);

        return response()->json(['message' => 'Department updated successfully', 'department' => $department]);
    }

    // Remove the specified department
    public function destroy($id)
    {
        $department = Department::find($id);
        if (!$department) {
            return response()->json(['message' => 'Department not found'], 404);
        }

        $department->delete();

        return response()->json(['message' => 'Department deleted successfully']);
    }
}
