<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class EmployeeController extends Controller
{
    public function index(Request $request)
    {
        // Return JSON for API
        if ($request->wantsJson()) {
            $employees = Employee::with(['department', 'division'])
                ->where('status', '!=', 'DELETED')
                ->get();
            return response()->json(['data' => $employees]);
        }
        // Return view for listing page with employees data
        $employees = Employee::with(['department', 'division'])
            ->where('status', '!=', 'DELETED')
            ->get();
        return view('employee.employee', compact('employees'));
    }

    public function show($id)
    {
        $employee = Employee::find($id);
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
            'profile_picture' => 'nullable|file|image',
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:employees,email',
            'phone' => 'required|string|max:14|regex:/^[0-9]+$/|unique:employees,phone',
            'status' => 'required|string',
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

        $profilePicturePath = null;
        $photoPath = null;
        $ktpPath = null;

        if ($request->hasFile('profile_picture')) {
            $file = $request->file('profile_picture');
            $filename = 'PROFILE_PICTURE_' . time() . '.' . $file->getClientOriginalExtension();
            $destination = public_path('file/profile_picture');
            if (!file_exists($destination)) mkdir($destination, 0777, true);
            $file->move($destination, $filename);
            $profilePicturePath = 'file/profile_picture/' . $filename;
        }

        if ($request->hasFile('photo')) {
            $file = $request->file('photo');
            $filename = 'PHOTO_' . time() . '.' . $file->getClientOriginalExtension();
            $destination = public_path('file/photo');
            if (!file_exists($destination)) mkdir($destination, 0777, true);
            $file->move($destination, $filename);
            $photoPath = 'file/photo/' . $filename;
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

        $employee = Employee::create([
            'department_id' => $request->department_id,
            'division_id' => $request->division_id,
            'job_id' => $request->job_id,
            'profile_picture' => $profilePicturePath,
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'status' => $request->status,
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

        return response()->json(['message' => 'Employee created successfully', 'data' => $employee]);
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
            'profile_picture' => 'nullable|string',
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:employees,email,' . $id,
            'phone' => 'sometimes|string|unique:employees,phone,' . $id,
            'status' => 'sometimes|string',
            'address' => 'sometimes|string',
            'photo' => 'nullable|string',
            'ktp' => 'nullable|string',
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
            'department_id', 'division_id', 'job_id', 'profile_picture', 'name', 'email', 'phone', 'status',
            'address', 'photo', 'ktp', 'birth_date', 'hire_date', 'resign_date', 'grade', 'office'
        ]);
        $updateData['updated_by'] = 1;

        $employee->update($updateData);

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
        return view('employee.edit', compact('employee'));
    }
}
