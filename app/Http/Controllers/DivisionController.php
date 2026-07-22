<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Division;
use App\Models\Partner;
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
            $partnerId = $request->input('partner_id', $request->input('department_id'));

            $divisions = Division::with('department')
                ->when($query, function ($q) use ($query) {
                    $q->where('name_division', 'like', '%' . $query . '%')
                      ->orWhereHas('department', function ($q2) use ($query) {
                          $q2->where('partner_name', 'like', '%' . $query . '%');
                      });
                })
                ->when($status === 'ALL', function ($q) {
                    $q->where('status', '!=', 'DELETED');
                }, function ($q) use ($status) {
                    $q->where('status', $status);
                })
                ->when($partnerId, function ($q) use ($partnerId) {
                    $q->where('partner_id', $partnerId);
                })
                ->get();

            $divisions = $divisions->map(function ($division) {
                $division->image_url = $division->images
                    ? url('file/division/' . $division->images)
                    : null;
                $division->business_department_id = $division->department_id;
                $division->department_id = $division->partner_id;
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
                'partner_id' => 'nullable|exists:partners,id',
                'department_id' => 'nullable|exists:partners,id',
                'name_division' => 'required|string|max:255',
                'status' => 'required|string|in:ACTIVE,INACTIVE',
                'description' => 'nullable|string',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            ]);

            if ($validator->fails()) {
                throw new \Exception($validator->errors()->first());
            }

            $validated = $validator->validated();
            $partnerId = $validated['partner_id'] ?? $validated['department_id'] ?? null;
            if (!$partnerId) {
                throw new \Exception('Partner is required');
            }
            $partner = Partner::find($partnerId);
            if (!$partner) {
                throw new \Exception('Partner not found');
            }

            $imageName = null;
            if ($request->hasFile('image')) {
                $t = time();
                $imageName = 'DIVISION_' . $t . '.' . $request->image->extension();
                $request->image->move(public_path('file/division'), $imageName);
            }

            $userId = auth()->check() ? auth()->id() : null;

            $division = Division::create([
                'department_id' => $partner->department_id,
                'partner_id' => $partner->id,
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
            $data['business_department_id'] = $division->department_id;
            $data['department_id'] = $division->partner_id;

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
                'partner_id' => 'nullable|exists:partners,id',
                'department_id' => 'nullable|exists:partners,id',
                'name_division' => 'required|string|max:255',
                'status' => 'required|string|in:ACTIVE,INACTIVE',
                'description' => 'nullable|string',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            ]);

            if ($validator->fails()) {
                throw new \Exception($validator->errors()->first());
            }

            $validated = $validator->validated();
            $partnerId = $validated['partner_id'] ?? $validated['department_id'] ?? null;
            if (!$partnerId) {
                throw new \Exception('Partner is required');
            }
            $partner = Partner::find($partnerId);
            if (!$partner) {
                throw new \Exception('Partner not found');
            }

            $updateData = [
                'department_id' => $partner->department_id,
                'partner_id' => $partner->id,
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

    /**
     * Get divisions for project assignments (accessible to all authenticated users)
     */
    public function getDivisionsForProjects(Request $request)
    {
        try {
            $user = auth()->user();
            $employee = $user ? $user->employee : null;
            $partnerId = $request->input('partner_id', $request->input('department_id', $employee?->partner_id));

            if (!$partnerId) {
                return response()->json([
                    'code' => 404,
                    'status' => 'error',
                    'message' => 'Partner not found.'
                ], 404);
            }

            $divisions = Division::where('status', 'ACTIVE')
                ->where('partner_id', $partnerId)
                ->orderBy('name_division')
                ->get(['id', 'name_division', 'partner_id', 'description']);

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => $divisions
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'code' => 500,
                'status' => 'error',
                'message' => 'Failed to fetch divisions: ' . $e->getMessage()
            ], 500);
        }
    }

}
