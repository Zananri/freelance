<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Division;
use App\Models\Department;
use Illuminate\Support\Facades\Log;

class DivisionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
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
            ->when($status !== 'ALL', function ($q) use ($status) {
                $q->where('status', $status);
            })
            ->when($departmentId, function ($q) use ($departmentId) {
                $q->where('department_id', $departmentId);
            })
            ->get();

        return response()->json($divisions);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'department_id' => 'required|exists:departments,id',
                'name_division' => 'required|string|max:255',
                'status' => 'required|string|in:ACTIVE,INACTIVE',
            ]);

            $division = Division::create([
                'department_id' => $validated['department_id'],
                'name_division' => $validated['name_division'],
                'status' => $validated['status'],
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

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $division = Division::with('department')->findOrFail($id);
        return response()->json($division);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        try {
            $division = Division::findOrFail($id);

            $validated = $request->validate([
                'department_id' => 'required|exists:departments,id',
                'name_division' => 'required|string|max:255',
                'status' => 'required|string|in:ACTIVE,INACTIVE',
            ]);

            $validated['updated_by'] = 1;

            $division->update($validated);

            return response()->json(['message' => 'Division updated successfully', 'division' => $division]);
        } catch (\Exception $e) {
            \Log::error('Error updating division: ' . $e->getMessage());
            return response()->json(['message' => 'Error updating division', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
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
