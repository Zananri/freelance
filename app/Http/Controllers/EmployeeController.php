<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\User;
use App\Models\Department;
use App\Models\Division;
use App\Models\Job;
use App\Models\EmployeeShift;
use App\Models\Attendance;
use Carbon\Carbon;
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
            $excludeEmployeeId = $request->input('exclude_employee_id', null);

            $employees = Employee::with(['department', 'division', 'job', 'user'])
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
                ->when($excludeEmployeeId, function ($q) use ($excludeEmployeeId) {
                    $q->where('id', '!=', $excludeEmployeeId);
                })
                ->get();

            // Append user photo and first_name, last_name to each employee
            $employees->transform(function ($employee) {
                $employee->user_photo = $employee->user && $employee->user->photo
                    ? $employee->user->photo
                    : null;
                $employee->first_name = $employee->first_name;
                $employee->last_name = $employee->last_name;
                return $employee;
            });

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
        try {
            DB::beginTransaction();

            $validator = Validator::make($request->all(), [
                'department_id' => 'required|exists:departments,id',
                'division_id' => 'required|exists:divisions,id',
                'job_id' => [
                    'required',
                    Rule::exists('job_list', 'id'),
                ],
                'shift_id' => 'required|exists:shifts,id',
                'employee_niks' => 'nullable|string|max:255',
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:employees,email',
                'email_work' => 'nullable|email|unique:employees,email_work',
                'phone' => 'required|string|max:14|regex:/^[0-9]+$/|unique:employees,phone',
                'address' => 'required|string',
                'photo' => 'nullable|file|image|max:2048',
                'ktp' => 'nullable|file|image|max:2048',
                'birth_date' => 'required|date',
                'hire_date' => 'required|date',
                'resign_date' => 'nullable|date',
                'grade' => 'required|string',
                'office' => 'required|string',
            ]);

            if ($validator->fails()) {
                throw new \Exception($validator->errors()->first());
            }

            // Generate unique email_work from full name by replacing spaces with underscores and adding timestamp if email_work is empty
            $emailWork = $request->input('email_work');
            if (empty($emailWork)) {
                $emailWork = str_replace(' ', '_', trim($request->name)) . '_' . time();
            }
            
            // Ensure email_work is unique
            $counter = 1;
            $originalEmailWork = $emailWork;
            while (User::where('email', $emailWork)->exists()) {
                $emailWork = $originalEmailWork . '_' . $counter;
                $counter++;
            }

            $existingUser = User::where('email', $emailWork)->first();
            if ($existingUser) {
                throw new \Exception('User with this email already exists');
            }

            $photoPath = null;
            $ktpPath = null;
            $profilePicturePath = null;

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

            $user = new User();
            $user->user_type = 'REGULAR';
            $user->user_role = 'EMPLOYEE';
            $user->photo = $photoPath;
            $user->name = $request->name;
            $user->email = $emailWork;
            $user->email_verified_at = now();
            $user->password = bcrypt('NSA_2025');
            $user->save();

            $employee = Employee::create([
                'user_id' => $user->id,
                'department_id' => $request->department_id,
                'division_id' => $request->division_id,
                'job_id' => $request->job_id,
                'shift_id' => $request->shift_id,
                'profile_picture' => $profilePicturePath ?? null,
                'name' => $request->name,
                'employee_niks' => $request->employee_niks,
                'email' => $request->email,
                'email_work' => $emailWork,
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
                'created_by' => auth()->id(),
                'updated_by' => auth()->id(),
                'deleted_by' => null,
            ]);

            DB::commit();

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => $employee,
                'message' => 'Employee created successfully',
                'redirect_url' => route('employee')
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'code' => 406,
                'status' => 'error',
                'data' => [],
                'message' => $e->getMessage()
            ], 406);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            DB::beginTransaction();

            $employee = Employee::find($id);
            if (!$employee) {
                throw new \Exception('Employee not found');
            }

            $validator = Validator::make($request->all(), [
                'department_id' => 'sometimes|exists:departments,id',
                'division_id' => 'sometimes|exists:divisions,id',
                'job_id' => 'sometimes|exists:job_list,id',
                'shift_id' => 'sometimes|exists:shifts,id',
                'employee_niks' => 'nullable|string|max:255',
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
                throw new \Exception($validator->errors()->first());
            }

            $updateData = $request->only([
                'department_id', 'division_id', 'job_id', 'shift_id', 'name', 'employee_niks', 'email', 'email_work', 'phone', 'status', 'address',
                'address', 'birth_date', 'hire_date', 'resign_date', 'grade', 'office'
            ]);

            if ($request->hasFile('photo')) {
                $file = $request->file('photo');
                $photoFilename = 'PHOTO_' . time() . '.' . $file->getClientOriginalExtension();
                $photoDestination = public_path('file/photo');
                if (!file_exists($photoDestination)) mkdir($photoDestination, 0777, true);
                $file->move($photoDestination, $photoFilename);
                $updateData['photo'] = 'file/photo/' . $photoFilename;
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

            $updateData['updated_by'] = auth()->id();

            // Track old shift_id to detect changes
            $oldShiftId = $employee->shift_id;

            $employee->update($updateData);

            // If shift_id changed, also sync today's per-date EmployeeShift when safe
            if (array_key_exists('shift_id', $updateData) && $updateData['shift_id'] && (int)$updateData['shift_id'] !== (int)$oldShiftId) {
                $today = Carbon::today()->toDateString();

                // Only upsert if there is no attendance record yet for today (to avoid altering an ongoing/recorded shift)
                $hasTodayAttendance = Attendance::where('employee_id', $employee->id)
                    ->where('date_attendance', $today)
                    ->exists();

                if (!$hasTodayAttendance) {
                    EmployeeShift::updateOrCreate(
                        [
                            'employee_id' => $employee->id,
                            'date_shift' => $today,
                        ],
                        [
                            'shift_id' => $updateData['shift_id'],
                        ]
                    );
                }

                // Recalculate lateness for today's existing check-in records using the new base shift
                $empWithShift = Employee::with('shift')->find($employee->id);
                if ($empWithShift && $empWithShift->shift) {
                    $rawStart = $empWithShift->shift->getRawOriginal('time_start') ?? $empWithShift->shift->time_start;
                    if ($rawStart) {
                        $newShiftStart = Carbon::parse($today . ' ' . $rawStart);
                        $todaysCheckins = Attendance::where('employee_id', $employee->id)
                            ->where('date_attendance', $today)
                            ->whereNotNull('time_in')
                            ->get();

                        foreach ($todaysCheckins as $att) {
                            try {
                                $checkInAt = Carbon::parse($att->date_attendance . ' ' . $att->time_in);
                                if ($checkInAt->gt($newShiftStart)) {
                                    $diffSeconds = $newShiftStart->diffInSeconds($checkInAt);
                                    $hours = floor($diffSeconds / 3600);
                                    $minutes = floor(($diffSeconds % 3600) / 60);
                                    $seconds = $diffSeconds % 60;
                                    $att->time_late = sprintf('%02d:%02d:%02d', $hours, $minutes, $seconds);
                                } else {
                                    $att->time_late = null;
                                }
                                $att->save();
                            } catch (\Exception $e) {
                                // Ignore calculation errors per record
                            }
                        }
                    }
                }
            }

            // Update corresponding user record
            $user = User::find($employee->user_id);
            if ($user) {
                $user->name = $employee->name;
                $user->email = $employee->email_work;
                $user->save();
            }

            DB::commit();

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => $employee,
                'message' => 'Employee updated successfully',
                'redirect_url' => route('employee')
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'code' => 406,
                'status' => 'error',
                'data' => [],
                'message' => $e->getMessage()
            ], 406);
        }
    }

    public function destroy($id)
    {
        try {
            DB::beginTransaction();

            $employee = Employee::find($id);
            if (!$employee) {
                throw new \Exception('Employee not found');
            }

            $employee->status = 'DELETED';
            $employee->deleted_by = auth()->id();
            $employee->save();

            DB::commit();

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => [],
                'message' => 'Employee deleted successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'code' => 406,
                'status' => 'error',
                'data' => [],
                'message' => $e->getMessage()
            ], 406);
        }
    }

    public function edit($id)
    {
        $employee = Employee::find($id);
        if (!$employee) {
            abort(404, 'Employee not found');
        }
        $departments = Department::all();
        $divisions = Division::all();
        $jobs = Job::all();
        return view('employee.edit', compact('employee', 'departments', 'divisions', 'jobs'));
    }

    /**
     * Get employees for project assignments (accessible to all authenticated users)
     */
    public function getEmployeesForProjects(Request $request)
    {
        try {
            $query = $request->input('query', '');
            $excludeEmployeeId = $request->input('exclude_employee_id', null);

            $employees = Employee::with(['department', 'division', 'user'])
                ->where('status', '!=', 'DELETED')
                ->when($query, function ($q) use ($query) {
                    $q->where(function ($q2) use ($query) {
                        $q2->where('name', 'like', '%' . $query . '%')
                          ->orWhere('email', 'like', '%' . $query . '%');
                    });
                })
                ->when($excludeEmployeeId, function ($q) use ($excludeEmployeeId) {
                    $q->where('id', '!=', $excludeEmployeeId);
                })
                ->orderBy('name')
                ->get()
                ->map(function ($employee) {
                    return [
                        'id' => $employee->id,
                        'name' => $employee->name,
                        'email' => $employee->email,
                        'user_photo' => $employee->user->photo ?? null,
                        'department' => $employee->department ? $employee->department->name_department : null,
                        'division' => $employee->division ? $employee->division->name_division : null,
                    ];
                });

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => $employees
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'code' => 500,
                'status' => 'error',
                'message' => 'Failed to fetch employees: ' . $e->getMessage()
            ], 500);
        }
    }
}
