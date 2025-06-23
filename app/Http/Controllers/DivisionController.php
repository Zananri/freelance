<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Division;
use App\Models\Department;
use Illuminate\Support\Facades\Log;

class DivisionController extends Controller
{
  
public function index(Request $request)
{
    $query = $request->input('query', '');
    $status = $request->input('status', 'ALL');
    $departmentId = $request->input('department_id', null);

    $divisions = Division::with('department')
        ->when($query, function ($q) use ($query) {
            $q->where('name_division', 'like', '%' . $query . '%')
              ->orWhereHas('department', function ($q2) use ($query) {
                  $q2->where('name_department', 'like', '%' . $query . '%');
              });
        })
        ->when($status === 'ALL', function ($q) {
            $q->where('status', '!=', 'DELETED');
        }, function ($q) use ($status) {
            $q->where('status', $status);
        })
        ->when($departmentId, function ($q) use ($departmentId) {
            $q->where('department_id', $departmentId);
        })
        ->get();

    $divisions = $divisions->map(function ($division) {
        $division->image_url = $division->images
            ? url('file/division/' . $division->images)
            : null;
        return $division;
    });

    return response()->json($divisions);
}

    
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'department_id' => 'required|exists:departments,id',
                'name_division' => 'required|string|max:255',
                'status' => 'required|string|in:ACTIVE,INACTIVE',
                'description' => 'nullable|string',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            ]);

            $imageName = null;
            if ($request->hasFile('image')) {
                $t = time();
                $imageName = 'DIVISION_' . $t . '.' . $request->image->extension();
                $request->image->move(public_path('file/division'), $imageName);
            }

            $division = Division::create([
                'department_id' => $validated['department_id'],
                'name_division' => $validated['name_division'],
                'status' => $validated['status'],
                'description' => $validated['description'] ?? null,
                'images' => $imageName,
                'created_by' => 1,
                'updated_by' => 1,
                'deleted_by' => 1,
            ]);

            return response()->json(['message' => 'Division created successfully', 'division' => $division]);
        } catch (\Exception $e) {
            \Log::error('Error creating division: ' . $e->getMessage());
            return response()->json(['message' => 'Error creating division', 'error' => $e->getMessage()], 500);
        }
    }

   
public function show(string $id)
{
    $division = Division::with('department')->findOrFail($id);
    $data = $division->toArray();
    $data['image_url'] = $division->images ? url('file/division/' . $division->images) : null;
    return response()->json($data);
}

   
    public function update(Request $request, string $id)
    {
        try {
            $division = Division::findOrFail($id);

            $validated = $request->validate([
                'department_id' => 'required|exists:departments,id',
                'name_division' => 'required|string|max:255',
                'status' => 'required|string|in:ACTIVE,INACTIVE',
                'description' => 'nullable|string',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            ]);

            $updateData = [
                'department_id' => $validated['department_id'],
                'name_division' => $validated['name_division'],
                'status' => $validated['status'],
                'description' => $validated['description'] ?? null,
                'updated_by' => 1,
            ];

            if ($request->input('remove_image') == "1") {
                if ($division->images && file_exists(public_path('file/division/' . $division->images))) {
                    @unlink(public_path('file/division/' . $division->images));
                }
                $updateData['images'] = null;
            }

            if ($request->hasFile('image')) {
                $t = time();
                $imageName = 'DIVISION_' . $t . '.' . $request->image->extension();
                $request->image->move(public_path('file/division'), $imageName);
                $updateData['images'] = $imageName;
            }

            $division->update($updateData);

            return response()->json(['message' => 'Division updated successfully', 'division' => $division]);
        } catch (\Exception $e) {
            \Log::error('Error updating division: ' . $e->getMessage());
            return response()->json(['message' => 'Error updating division', 'error' => $e->getMessage()], 500);
        }
    }

   
    public function destroy(string $id)
    {
        try {
            $division = Division::findOrFail($id);
            $division->status = 'DELETED';
            $division->deleted_by = 1;
            $division->save();

            return response()->json(['message' => 'Division deleted successfully']);
        } catch (\Exception $e) {
            \Log::error('Error deleting division: ' . $e->getMessage());
            return response()->json(['message' => 'Error deleting division', 'error' => $e->getMessage()], 500);
        }
    }
}
