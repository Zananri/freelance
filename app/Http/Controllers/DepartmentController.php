<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Models\Department;
use Illuminate\Support\Facades\Storage;

class DepartmentController extends Controller
{
   

public function showDepartmentPage()
{
        return view('master/department/department');
}


public function index(Request $request)
{
    $query = $request->input('query');
    $status = $request->input('status');

    $departmentsQuery = Department::query();

    if ($query) {
        $departmentsQuery->where('name_department', 'like', '%' . $query . '%');
    }

    if ($status) {
        if ($status === 'ALL') {
            $departmentsQuery->where('status', '!=', 'DELETED');
        } else {
            $departmentsQuery->where('status', $status);
        }
    } else {
        $departmentsQuery->where('status', '!=', 'DELETED');
    }

    $departments = $departmentsQuery->get();

    $departments = $departments->map(function ($department) {
        $department->image_url = $department->images
            ? url('file/department/' . $department->images)
            : null;
        return $department;
    });

    return response()->json(['data' => $departments]);
}

    public function show($id)
    {
        $department = Department::find($id);
        if (!$department) {
            return response()->json(['message' => 'Department not found'], 404);
        }
        $data = $department->toArray();
        $data['image_url'] = $department->images ? url('file/department/' . $department->images) : null;
        return response()->json($data);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name_department' => 'required|string|max:255',
            'status' => 'required|string|in:ACTIVE,INACTIVE,DELETED',
            'description' => 'nullable|string',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $imageName = null;
        if ($request->hasFile('image')) {
            $t = time();
            $imageName = 'DEPARTMENT_' . $t . '.' . $request->image->extension();
            $request->image->move(public_path('file/department'), $imageName);
        }

            $department = Department::create([
                'name_department' => $request->name_department,
                'status' => $request->status,
                'description' => $request->description,
                'images' => $imageName,
                'created_by' => auth()->id(),
                'updated_by' => auth()->id(),
                'deleted_by' => auth()->id(),
            ]);

        return response()->json(['message' => 'Department added successfully', 'department' => $department]);
    }

    public function update(Request $request, $id)
    {
        $department = Department::find($id);
        if (!$department) {
            return response()->json(['message' => 'Department not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name_department' => 'sometimes|string|max:255',
            'status' => 'sometimes|string|in:ACTIVE,INACTIVE,DELETED',
            'description' => 'nullable|string',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
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
        if ($request->has('description')) {
            $updateData['description'] = $request->description;
        }

        if ($request->input('remove_image') == "1") {
            if ($department->images && file_exists(public_path('file/department/' . $department->images))) {
                @unlink(public_path('file/department/' . $department->images));
            }
            $updateData['images'] = null;
        }

        if ($request->hasFile('image')) {
            $t = time();
            $imageName = 'DEPARTMENT_' . $t . '.' . $request->image->extension();
            $request->image->move(public_path('file/department'), $imageName);
            $updateData['images'] = $imageName;
        }

        $updateData['updated_by'] = 1;

        $updateData['updated_by'] = auth()->id();

        $department->update($updateData);

        return response()->json(['message' => 'Department updated successfully', 'department' => $department]);
    }

    public function destroy($id)
    {
        $department = Department::find($id);
        if (!$department) {
            return response()->json(['message' => 'Department not found'], 404);
        }

        $department->status = 'DELETED';
        $department->deleted_by = 1;

        $department->deleted_by = auth()->id();

        $department->save();

        return response()->json(['message' => 'Department deleted successfully']);
    }

   
}
