<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\Department;
use App\Models\Office;
use App\Models\Partner;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class PartnerController extends Controller
{
    public function showPartnerPage()
    {
        return view('master/department/department');
    }

    public function index(Request $request)
    {
        $user = auth()->user();
        $userId = $user?->id;
        $currentEmployee = $userId ? Employee::where('user_id', $userId)->first() : null;

        $userType = strtoupper((string) ($user->user_type ?? ''));
        $userRole = strtoupper((string) ($user->user_role ?? ''));

        $query = $request->input('query');
        $status = $request->input('status');
        $departmentId = $request->input('department_id');
        $officeId = $request->input('office_id');
        $excludeAdministrativePartners = $request->boolean('exclude_administrative_partners');

        $partnersQuery = Partner::with(['department', 'office']);

        if ($query) {
            $partnersQuery->where('partner_name', 'like', '%' . $query . '%');
        }

        if ($status) {
            if ($status === 'ALL') {
                $partnersQuery->where('status', '!=', 'DELETED');
            } else {
                $partnersQuery->where('status', $status);
            }
        } else {
            $partnersQuery->where('status', '!=', 'DELETED');
        }

        if ($departmentId) {
            $partnersQuery->where('department_id', $departmentId);
        }

        if ($officeId) {
            $partnersQuery->where('office_id', $officeId);
        }

        if ($excludeAdministrativePartners) {
            $partnersQuery->whereDoesntHave('employees.user', function ($query) {
                $query->whereIn('user_type', ['SUPERADMIN', 'ADMINISTRATOR', 'ADMIN'])
                    ->orWhereIn('user_role', ['SUPERADMIN', 'ADMINISTRATOR', 'ADMIN']);
            });
        }

        if ($userType !== 'SUPERADMIN') {
            $partnersQuery->where('department_id', $currentEmployee?->department_id ?? 0);
        }

        $partners = $partnersQuery->get()->map(function (Partner $partner) {
            $partner->image_url = $partner->images
                ? url('file/partner/' . $partner->images)
                : null;

            $partner->name_department = $partner->partner_name;

            return $partner;
        });

        return response()->json(['data' => $partners]);
    }

    public function show($id)
    {
        $partner = Partner::with(['department', 'office'])->find($id);

        if (!$partner) {
            return response()->json(['message' => 'Partner not found'], 404);
        }

        $data = $partner->toArray();
        $data['name_department'] = $partner->partner_name;
        $data['image_url'] = $partner->images ? url('file/partner/' . $partner->images) : null;

        return response()->json($data);
    }

    public function store(Request $request)
    {
        try {
            DB::beginTransaction();

            $validator = Validator::make($request->all(), [
                'name_department' => 'nullable|string|max:255',
                'partner_name' => 'nullable|string|max:255',
                'department_id' => 'required|exists:departments,id',
                'office_id' => 'required|exists:offices,id',
                'status' => 'required|string|in:ACTIVE,INACTIVE,DELETED',
                'description' => 'nullable|string',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            ]);

            if ($validator->fails()) {
                throw new \Exception($validator->errors()->first());
            }

            $name = trim((string) ($request->partner_name ?: $request->name_department));
            if ($name === '') {
                throw new \Exception('Partner name is required');
            }

            $imageName = null;
            if ($request->hasFile('image')) {
                $imageName = 'PARTNER_' . time() . '.' . $request->image->extension();
                $request->image->move(public_path('file/partner'), $imageName);
            }

            $userId = auth()->check() ? auth()->id() : 1;

            $partner = Partner::create([
                'partner_name' => $name,
                'department_id' => $request->department_id,
                'office_id' => $request->office_id,
                'status' => $request->status,
                'description' => $request->description,
                'images' => $imageName,
                'created_by' => $userId,
                'updated_by' => $userId,
                'deleted_by' => $userId,
            ]);

            DB::commit();

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => $partner,
                'message' => 'Partner added successfully',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'code' => 406,
                'status' => 'error',
                'data' => [],
                'message' => $e->getMessage(),
            ], 406);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            DB::beginTransaction();

            $partner = Partner::find($id);
            if (!$partner) {
                throw new \Exception('Partner not found');
            }

            $validator = Validator::make($request->all(), [
                'name_department' => 'nullable|string|max:255',
                'partner_name' => 'nullable|string|max:255',
                'department_id' => 'required|exists:departments,id',
                'office_id' => 'required|exists:offices,id',
                'status' => 'required|string|in:ACTIVE,INACTIVE,DELETED',
                'description' => 'nullable|string',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            ]);

            if ($validator->fails()) {
                throw new \Exception($validator->errors()->first());
            }

            $name = trim((string) ($request->partner_name ?: $request->name_department));
            if ($name === '') {
                throw new \Exception('Partner name is required');
            }

            $imageName = $partner->images;
            if ($request->input('remove_image') == '1') {
                if ($imageName && file_exists(public_path('file/partner/' . $imageName))) {
                    @unlink(public_path('file/partner/' . $imageName));
                }
                $imageName = null;
            }

            if ($request->hasFile('image')) {
                if ($imageName && file_exists(public_path('file/partner/' . $imageName))) {
                    @unlink(public_path('file/partner/' . $imageName));
                }
                $imageName = 'PARTNER_' . time() . '.' . $request->image->extension();
                $request->image->move(public_path('file/partner'), $imageName);
            }

            $partner->update([
                'partner_name' => $name,
                'department_id' => $request->department_id,
                'office_id' => $request->office_id,
                'status' => $request->status,
                'description' => $request->description,
                'images' => $imageName,
                'updated_by' => auth()->id(),
            ]);

            DB::commit();

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => $partner,
                'message' => 'Partner updated successfully',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'code' => 406,
                'status' => 'error',
                'data' => [],
                'message' => $e->getMessage(),
            ], 406);
        }
    }

    public function destroy($id)
    {
        try {
            DB::beginTransaction();

            $partner = Partner::find($id);
            if (!$partner) {
                throw new \Exception('Partner not found');
            }

            $partner->status = 'DELETED';
            $partner->deleted_by = auth()->check() ? auth()->id() : 1;
            $partner->save();

            DB::commit();

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => [],
                'message' => 'Partner deleted successfully',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'code' => 406,
                'status' => 'error',
                'data' => [],
                'message' => $e->getMessage(),
            ], 406);
        }
    }

    public function getPartnersForProjects(Request $request)
    {
        try {
            $user = auth()->user();
            $currentEmployee = $user?->employee;

            $partners = Partner::where('status', 'ACTIVE')
                ->when(
                    strtoupper((string) ($user?->user_type ?? '')) !== 'SUPERADMIN',
                    fn ($query) => $query->where('department_id', $currentEmployee?->department_id ?? 0)
                )
                ->orderBy('partner_name')
                ->get(['id', 'partner_name', 'department_id', 'office_id', 'description']);

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => $partners,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'code' => 500,
                'status' => 'error',
                'message' => 'Failed to fetch partners: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function options()
    {
        $user = auth()->user();
        $currentEmployee = $user?->employee;
        $isSuperadmin = strtoupper((string) ($user?->user_type ?? '')) === 'SUPERADMIN';

        $departments = Department::where('status', '!=', 'DELETED')
            ->when(!$isSuperadmin, fn ($query) => $query->where('id', $currentEmployee?->department_id ?? 0))
            ->orderBy('name_department')
            ->get(['id', 'name_department']);

        $offices = Office::where('status', '!=', 'DELETED')
            ->orderBy('name')
            ->get(['id', 'name']);

        return response()->json([
            'code' => 200,
            'status' => 'success',
            'data' => [
                'departments' => $departments,
                'offices' => $offices,
            ],
        ]);
    }
}
