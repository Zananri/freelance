<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class EmployeeController extends Controller
{
    public function showEmployeePage()
    {
        return view('employee/employee');
    }
    public function index(Request $request)
    {
        $query = $request->input('query', '');
        $departmentIds = $request->input('department', []);
        $divisionIds = $request->input('division', []);
        $jobIds = $request->input('job', []);

        // Return JSON for API
        if ($request->wantsJson()) {
            $employees = Employee::with(['department', 'division', 'job'])
                ->where('status', '!=', 'DELETED')
                ->when($query, function ($q) use ($query) {
                    $q->where(function ($q2) use ($query) {
                        $q2->where('name', 'like', '%' . $query . '%')
                          ->orWhere('email', 'like', '%' . $query . '%')
                          ->orWhere('office', 'like', '%' . $query . '%')
                          ->orWhereHas('department', function ($q3) use ($query) {
                              $q3->where('name_department', 'like', '%' . $query . '%');
                          })
                          ->orWhereHas('division', function ($q4) use ($query) {
                              $q4->where('name_division', 'like', '%' . $query . '%');
                          });
                    });
                })
                ->when(!empty($departmentIds), function ($q) use ($departmentIds, $divisionIds, $jobIds) {
                    $q->whereIn('department_id', $departmentIds);

                    // Apply division filter only if department filter is present
                    if (!empty($divisionIds)) {
                        $q->whereIn('division_id', $divisionIds);
                    }

                    // Apply job filter only if both department and division filters are present
                    if (!empty($divisionIds) && !empty($jobIds)) {
                        $q->whereIn('job_id', $jobIds);
                    }
                })
                // If department filter is empty, do not apply division or job filters
                ->get();
            return response()->json(['data' => $employees]);
        }
        // Return view for listing page with employees data
        $employees = Employee::with(['department', 'division', 'job'])
            ->where('status', '!=', 'DELETED')
            ->get();
    }

    public function show($id)
    {
        $employee = Employee::with(['department', 'division', 'job'])->find($id);
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
            'job_id' => [
                'required',
                Rule::exists('job_list', 'id'),
            ],
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:employees,email',
            'email_work' => 'nullable|email|unique:employees,email_work',
            'phone' => 'required|string|max:14|regex:/^[0-9]+$/|unique:employees,phone',
            'address' => 'required|string',
            'photo' => 'nullable|file|image',
            'ktp' => 'nullable|file|image',
            'birth_date' => 'required|date',
            'hire_date' => 'required|date',
            'resign_date' => 'nullable|date',
            'grade' => 'required|string',
            'office' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }


        DB::beginTransaction();

        try {

            $photoPath = null;
            $ktpPath = null;

            if ($request->hasFile('photo')) {
                $file = $request->file('photo');
                $photoFilename = 'PHOTO_' . time() . '.' . $file->getClientOriginalExtension();
                $profilePictureFilename = 'PROFILE_PICTURE_' . time() . '.' . $file->getClientOriginalExtension();
                $photoDestination = public_path('file/photo');
                $profilePictureDestination = public_path('file/profile_picture');
                if (!file_exists($photoDestination)) mkdir($photoDestination, 0777, true);
                if (!file_exists($profilePictureDestination)) mkdir($profilePictureDestination, 0777, true);
                $file->move($photoDestination, $photoFilename);
                $photoPath = 'file/photo/' . $photoFilename;
                // Copy photo file to profile_picture with different name
                copy($photoDestination . '/' . $photoFilename, $profilePictureDestination . '/' . $profilePictureFilename);
                $profilePicturePath = 'file/profile_picture/' . $profilePictureFilename;
            }

            if ($request->hasFile('ktp')) {
                $file = $request->file('ktp');
                $employeeName = preg_replace('/[^A-Za-z0-9_\-]/', '_', $request->name);
                $filename = 'KTP_' . $employeeName . '.' . $file->getClientOriginalExtension();
                $destination = public_path('file/ktp');
                if (!file_exists($destination)) mkdir($destination, 0777, true);
                $file->move($destination, $filename);
                $ktpPath = 'file/ktp/' . $filename;
            }
            $existingUser = User::where('email', $request->email_work)->first();

            if ($existingUser) {
                throw new \Exception('User with this email_work already exists');
                return response()->json(['error' => 'User with this email_work already exists'], 422);
            }

            $user = new User();
            $user->user_type = 'REGULAR';
            $user->user_role = 'EMPLOYEE';
            $user->photo = $photoPath;
            $user->name = $request->name;
            $user->email = $request->email_work;
            $user->email_verified_at = now();
            $user->password = bcrypt('NSA_2025');
            $user->save();

            $employee = Employee::create([
                'user_id' => $user->id,
                'department_id' => $request->department_id,
                'division_id' => $request->division_id,
                'job_id' => $request->job_id,
                'profile_picture' => $profilePicturePath ?? null,
                'name' => $request->name,
                'email' => $request->email,
                'email_work' => $request->email_work,
                'phone' => $request->phone,
                'status' => 'ACTIVE',
                'address' => $request->address,
                'photo' => $photoPath,
                'ktp' => $ktpPath,
                'birth_date' => $request->birth_date,
                'hire_date' => $request->hire_date,
                'resign_date' => $request->resign_date,
                'grade' => $request->grade,
                'office' => $request->office,
                'created_by' => '1',
                'updated_by' => '1',
                'deleted_by' => '1',
            ]);

            DB::commit();

            return response()->json(['message' => 'Employee and user created successfully', 'data' => $employee]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed to create employee and user', 'details' => $e->getMessage()], 500);
        }
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
            'job_id' => 'sometimes|exists:job_list,id',
            'profile_picture' => 'nullable|file|image',
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:employees,email,' . $id,
            'email_work' => 'nullable|email|unique:employees,email_work,' . $id,
            'phone' => 'sometimes|string|unique:employees,phone,' . $id,
            'status' => 'sometimes|string',
            'address' => 'sometimes|string',
            'photo' => 'nullable|file|image',
            'ktp' => 'nullable|file|image',
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
            'department_id', 'division_id', 'job_id', 'name', 'email', 'email_work', 'phone', 'status', 'address',
            'address', 'birth_date', 'hire_date', 'resign_date', 'grade', 'office'
        ]);

        // Removed profile_picture update handling to keep it unchanged on edit

        if ($request->hasFile('photo')) {
            // Delete old photo file if exists
            if ($employee->photo && file_exists(public_path($employee->photo))) {
                unlink(public_path($employee->photo));
            }
            $file = $request->file('photo');
            $filename = 'PHOTO_' . time() . '.' . $file->getClientOriginalExtension();
            $destination = public_path('file/photo');
            if (!file_exists($destination)) mkdir($destination, 0777, true);
            $file->move($destination, $filename);
            $updateData['photo'] = 'file/photo/' . $filename;
        }

        if ($request->hasFile('ktp')) {
            // Delete old ktp file if exists
            if ($employee->ktp && file_exists(public_path($employee->ktp))) {
                unlink(public_path($employee->ktp));
            }
            $file = $request->file('ktp');
            $employeeName = preg_replace('/[^A-Za-z0-9_\-]/', '_', $request->name ?? $employee->name);
            $filename = 'KTP_' . $employeeName . '.' . $file->getClientOriginalExtension();
            $destination = public_path('file/ktp');
            if (!file_exists($destination)) mkdir($destination, 0777, true);
            $file->move($destination, $filename);
            $updateData['ktp'] = 'file/ktp/' . $filename;
        }

        $updateData['updated_by'] = 1;

        $oldUserId = $employee->user_id;

        $employee->update($updateData);

        // Update corresponding user record
        $user = User::find($oldUserId);
        if ($user) {
            $user->name = $employee->name;
            $user->photo = $employee->photo;
            $user->email = $employee->email_work;
            $user->save();
        }

        return response()->json(['message' => 'Employee updated successfully', 'data' => $employee]);
    }

    public function destroy($id)
    {
        $employee = Employee::find($id);
        if (!$employee) {
            return response()->json(['message' => 'Employee not found'], 404);
        }

        $employee->status = 'DELETED';
        $employee->deleted_by = 1;
        $employee->save();

        return response()->json(['message' => 'Employee deleted successfully']);
    }

    public function edit($id)
    {
        $employee = Employee::find($id);
        if (!$employee) {
            abort(404, 'Employee not found');
        }
        $departments = \App\Models\Department::all();
        $divisions = \App\Models\Division::all();
        $jobs = \App\Models\Job::all();
        return view('employee.edit', compact('employee', 'departments', 'divisions', 'jobs'));
    }
}
