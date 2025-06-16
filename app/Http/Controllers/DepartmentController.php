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
            'nama_departmen' => 'required|string|max:255',
            'manager' => 'required|string|max:255',
            'auth_provider' => 'nullable|string|max:255',
            'auth_provider_id' => 'nullable|string|max:255',
            'remember_token' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $department = Department::create([
            'nama_departmen' => $request->nama_departmen,
            'manager' => $request->manager,
            'auth_provider' => $request->auth_provider,
            'auth_provider_id' => $request->auth_provider_id,
            'remember_token' => $request->remember_token,
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
            'nama_departmen' => 'required|string|max:255',
            'manager' => 'required|string|max:255',
            'auth_provider' => 'nullable|string|max:255',
            'auth_provider_id' => 'nullable|string|max:255',
            'remember_token' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $department->update([
            'nama_departmen' => $request->nama_departmen,
            'manager' => $request->manager,
            'auth_provider' => $request->auth_provider,
            'auth_provider_id' => $request->auth_provider_id,
            'remember_token' => $request->remember_token,
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
