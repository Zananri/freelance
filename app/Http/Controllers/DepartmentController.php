<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Models\Department;

class DepartmentController extends Controller
{
    // Display a listing of the departments
    public function index(Request $request)
    {
        $query = $request->input('query');
        $status = $request->input('status');

        $departmentsQuery = Department::query();

        if ($query) {
            $departmentsQuery->where('name_department', 'like', '%' . $query . '%');
        }

        if ($status && $status !== 'ALL') {
            $departmentsQuery->where('status', $status);
        }

        $departments = $departmentsQuery->get();

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
            'status' => 'required|string|in:ACTIVE,INACTIVE,DELETED',
            
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $department = Department::create([
            'name_department' => $request->name_department,
            'status' => $request->status,
            'created_by' => 1,
            'updated_by' => 1,
            'deleted_by' => 1,
          
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
            'name_department' => 'sometimes|string|max:255',
            'status' => 'sometimes|string|in:ACTIVE,INACTIVE,DELETED',
           
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $updateData = [];
        if ($request->has('name_department')) {
            $updateData['name_department'] = $request->name_department;
        }
        if ($request->has('status')) {
            $updateData['status'] = $request->status;
        }
        
        
       
            $updateData['updated_by'] = 1;

        $department->update($updateData);

        return response()->json(['message' => 'Department updated successfully', 'department' => $department]);
    }

    // Remove the specified department
    public function destroy($id)
    {
        $department = Department::find($id);
        if (!$department) {
            return response()->json(['message' => 'Department not found'], 404);
        }

        // Instead of deleting, update status to DELETED
        $department->status = 'DELETED';
        $department->deleted_by = 1;
        $department->save();

        return response()->json(['message' => 'Department deleted successfully']);
    }
}
