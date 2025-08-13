<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Division;
use App\Models\Department;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class DivisionController extends Controller
{
    public function index(Request $request)
    {
        try {
            DB::beginTransaction();

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

            DB::commit();

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => $divisions,
                'message' => 'Success get all divisions'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'code' => 406,
                'status' => "error",
                'data' => [],
                'message'=> $e->getMessage()
            ], 406);
        }
    }

    public function store(Request $request)
    {
        try {
            DB::beginTransaction();

            $validator = Validator::make($request->all(), [
                'department_id' => 'required|exists:departments,id',
                'name_division' => 'required|string|max:255',
                'status' => 'required|string|in:ACTIVE,INACTIVE',
                'description' => 'nullable|string',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            ]);

            if ($validator->fails()) {
                throw new \Exception($validator->errors()->first());
            }

            $validated = $validator->validated();

            $imageName = null;
            if ($request->hasFile('image')) {
                $t = time();
                $imageName = 'DIVISION_' . $t . '.' . $request->image->extension();
                $request->image->move(public_path('file/division'), $imageName);
            }

            $userId = auth()->check() ? auth()->id() : null;

            $division = Division::create([
                'department_id' => $validated['department_id'],
                'name_division' => $validated['name_division'],
                'status' => $validated['status'],
                'description' => $validated['description'] ?? null,
                'images' => $imageName,
                'created_by' => $userId,
                'updated_by' => $userId,
                'deleted_by' => null,
            ]);

            DB::commit();

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => $division,
                'message' => 'Division created successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'code' => 406,
                'status' => "error",
                'data' => [],
                'message'=> $e->getMessage()
            ], 406);
        }
    }

    public function show(string $id)
    {
        try {
            DB::beginTransaction();

            $division = Division::with('department')->find($id);
            
            if (!$division) {
                throw new \Exception('Division not found');
            }

            $data = $division->toArray();
            $data['image_url'] = $division->images ? url('file/division/' . $division->images) : null;

            DB::commit();

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => $data,
                'message' => 'Success get division detail'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'code' => 406,
                'status' => "error",
                'data' => [],
                'message'=> $e->getMessage()
            ], 406);
        }
    }

    public function update(Request $request, string $id)
    {
        try {
            DB::beginTransaction();

            $division = Division::find($id);
            
            if (!$division) {
                throw new \Exception('Division not found');
            }

            $validator = Validator::make($request->all(), [
                'department_id' => 'required|exists:departments,id',
                'name_division' => 'required|string|max:255',
                'status' => 'required|string|in:ACTIVE,INACTIVE',
                'description' => 'nullable|string',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            ]);

            if ($validator->fails()) {
                throw new \Exception($validator->errors()->first());
            }

            $validated = $validator->validated();

            $updateData = [
                'department_id' => $validated['department_id'],
                'name_division' => $validated['name_division'],
                'status' => $validated['status'],
                'description' => $validated['description'] ?? null,
                'updated_by' => auth()->id(),
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

            DB::commit();

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => $division,
                'message' => 'Division updated successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'code' => 406,
                'status' => "error",
                'data' => [],
                'message'=> $e->getMessage()
            ], 406);
        }
    }

    public function destroy(string $id)
    {
        try {
            DB::beginTransaction();

            $division = Division::find($id);
            
            if (!$division) {
                throw new \Exception('Division not found');
            }

            $division->status = 'DELETED';
            $division->deleted_by = auth()->id();
            $division->save();

            DB::commit();

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => [],
                'message' => 'Division deleted successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'code' => 406,
                'status' => "error",
                'data' => [],
                'message'=> $e->getMessage()
            ], 406);
        }
    }

    public function showDivisionPage()
    {
        return view('master/division/division');
    }
}
