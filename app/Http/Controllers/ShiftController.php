<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use \Illuminate\Validation\ValidationException;
use App\Models\Employee;
use App\Models\EmployeeShift;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ShiftController extends Controller
{
    /**
     * Check-in is the first checkpoint. This limit only applies to additional
     * checkpoint fields, so the maximum total_checkpoint is 9.
     */
    private const MAX_ADDITIONAL_CHECKPOINTS = 8;

    public function showShiftPage(Request $request)
    {
        return view('shift/shift');
    }

    /**
     * Get employees with their shift data from employee_shifts table
     */
    public function getEmployeesBasic(Request $request)
    {
        $user = auth()->user();
        $userId = auth()->user()->id;

        $currentEmployee = Employee::where('user_id', $userId)->first();

        $userType = strtoupper((string) ($user->user_type ?? ''));
        $userRole = strtoupper((string) ($user->user_role ?? ''));

        $month = $request->input('month', date('m'));
        $year = $request->input('year', date('Y'));
        $search = $request->input('search', '');
        $departmentFilter = $request->input('department', '');
        $divisionFilter = $request->input('division', '');
        $shiftFilter = $request->input('shift', '');
        $page = max((int) $request->input('page', 1), 1);
        $perPage = min(max((int) $request->input('per_page', 10), 1), 100);

        $startDate = Carbon::create($year, $month, 1)->startOfMonth();
        $endDate = Carbon::create($year, $month, 1)->endOfMonth();

        $query = Employee::select(
            'employees.id',
            'employees.name',
            'employees.email',
            'employees.photo',
            'employees.profile_picture',
            'employees.department_id',
            'employees.division_id',
            // base shift fields
            'employees.shift_id as base_shift_id',
            'base_shifts.title as base_title',
            'base_shifts.description as base_description',
            'base_shifts.time_start as base_time_start',
            'base_shifts.time_end as base_time_end',
            // per-date shift fields
            'employee_shifts.shift_id as shift_id',
            'employee_shifts.date_shift',
            'shifts.title as title',
            'shifts.description as description',
            'shifts.time_start',
            'shifts.time_end',
            'shifts.total_hour',
            'shifts.total_checkpoint',
            'shifts.checkpoint_times',
            'shifts.created_by as shift_created_by',
            'shifts.updated_by as shift_updated_by',
            'shifts.deleted_by as shift_deleted_by',
            'shifts.created_at as shift_created_at',
            'shifts.updated_at as shift_updated_at'
        )
            ->leftJoin('employee_shifts', function ($join) use ($startDate, $endDate) {
                $join->on('employees.id', '=', 'employee_shifts.employee_id')
                    ->whereBetween('employee_shifts.date_shift', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')]);
            })
            ->leftJoin('shifts', function ($join) {
                $join->on('employee_shifts.shift_id', '=', 'shifts.id')
                    ->whereNull('shifts.deleted_by');
            })
            ->leftJoin('shifts as base_shifts', function ($join) {
                $join->on('employees.shift_id', '=', 'base_shifts.id')
                    ->whereNull('base_shifts.deleted_by');
            });


        if ($userType !== 'SUPERADMIN') {
            $query->where('employees.department_id', $currentEmployee?->department_id ?? 0);
        }

        $query->where('employees.status', 'active')
            ->whereNull('employees.deleted_by');

        if ($currentEmployee) {
            $query->where('employees.id', '!=', $currentEmployee->id);
        }
        
        if ($userType === 'SUPERADMIN') {
            $query->where(function ($q) {
                $q->whereDoesntHave('user')
                    ->orWhereHas('user', function ($uq) {
                        $uq->where('user_type', '!=', 'ADMINISTRATOR');
                    });
            });
        }

        if ($userType === 'ADMINISTRATOR') {
            $query->where(function ($q) {
                $q->whereDoesntHave('user')
                    ->orWhereHas('user', function ($uq) {
                        $uq->whereNotIn('user_type', [
                            'SUPERADMIN',
                            'ADMINISTRATOR',
                        ]);
                    });
            });
        }

        // Add search filter if provided
        if (!empty($search)) {
            $query->where('employees.name', 'like', '%' . $search . '%');
        }

        // Add department filter if provided
        if (!empty($departmentFilter)) {
            $query->where('employees.department_id', $departmentFilter);
        }

        // Add division filter if provided  
        if (!empty($divisionFilter)) {
            $query->where('employees.division_id', $divisionFilter);
        }

        // Add shift filter if provided - check both base shift and specific shift assignments
        if (!empty($shiftFilter)) {
            $query->where(function ($q) use ($shiftFilter) {
                $q->where('employees.shift_id', $shiftFilter)
                    ->orWhere('employee_shifts.shift_id', $shiftFilter);
            });
        }

        $employeePaginator = (clone $query)
            ->reorder('employees.name')
            ->select('employees.id', 'employees.name')
            ->distinct()
            ->paginate($perPage, ['*'], 'page', $page);

        $employees = $query
            ->whereIn('employees.id', $employeePaginator->getCollection()->pluck('id'))
            ->orderBy('employees.name')
            ->orderBy('employee_shifts.date_shift', 'asc')
            ->get()
            ->groupBy('id');

        $employeeData = [];

        foreach ($employees as $employeeId => $shifts) {
            $employee = $shifts->first();
            $shiftDetails = [];

            foreach ($shifts as $shift) {
                if ($shift->date_shift) {
                    $shiftDetails[] = [
                        'shift_id' => $shift->shift_id,
                        'date_shift' => Carbon::parse($shift->date_shift)->format('Y-m-d'),
                        'title' => $shift->title,
                        'description' => $shift->description,
                        'time_start' => $shift->time_start ? Carbon::parse($shift->time_start)->format('H:i') : null,
                        'time_end' => $shift->time_end ? Carbon::parse($shift->time_end)->format('H:i') : null,
                        'total_hour' => $shift->total_hour,
                        'total_checkpoint' => $shift->total_checkpoint,
                        'checkpoint_times' => $shift->checkpoint_times,
                    ];
                }
            }

            $employeeData[] = [
                'id' => $employee->id,
                'name' => $employee->name,
                'email' => $employee->email,
                // Return raw or absolute photo path; frontend normalizes if needed
                'photo' => $employee->photo ?: '/asset/img/avatar.png',
                'profile_picture' => $employee->profile_picture ?? '/asset/img/avatar.png',
                // expose base shift data for prefill in Shift page modal
                'shift_id' => $employee->base_shift_id,
                'shift_title' => $employee->base_title,
                'time_start' => $employee->base_time_start ? Carbon::parse($employee->base_time_start)->format('H:i') : null,
                'time_end' => $employee->base_time_end ? Carbon::parse($employee->base_time_end)->format('H:i') : null,
                'shifts' => $shiftDetails,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $employeeData,
            'month' => (int) $month,
            'year' => (int) $year,
            'pagination' => [
                'current_page' => $employeePaginator->currentPage(),
                'last_page' => $employeePaginator->lastPage(),
                'per_page' => $employeePaginator->perPage(),
                'total' => $employeePaginator->total(),
                'from' => $employeePaginator->firstItem(),
                'to' => $employeePaginator->lastItem(),
            ],
        ]);
    }

    /**
     * Get all available shifts
     */
    public function getShifts()
    {
        try {
            $shifts = \App\Models\Shift::select(
                'id',
                'title',
                'description',
                'time_start',
                'time_end',
                'total_checkpoint',
                'checkpoint_times',
                'total_hour'
            )
                ->whereNull('deleted_by')
                ->orderBy('title')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $shifts
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load shifts: ' . $e->getMessage()
            ], 500);
        }
    }

    public function index()
    {
        //
    }

    public function create()
    {
        //
    }

    public function store(Request $request)
    {

        // dd($request->all());
        try {
            DB::beginTransaction();

            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'time_start' => 'required|date_format:H:i',
                'time_end' => 'required|date_format:H:i',

                'checkpoints' => 'nullable|array|max:' . self::MAX_ADDITIONAL_CHECKPOINTS,
                'checkpoints.*' => 'date_format:H:i',
            ]);

            $start = Carbon::createFromFormat('H:i', $validated['time_start']);
            $end = Carbon::createFromFormat('H:i', $validated['time_end']);

            // Allow overnight shift: if end < start, assume it's next day
            if ($end->lessThanOrEqualTo($start)) {
                $end->addDay();
            }

            $totalHour = $end->diffInHours($start, true); // true for absolute value

            $checkpoints = $validated['checkpoints'] ?? [];

            $shift = \App\Models\Shift::create([
                'title' => $validated['title'],
                'description' => $validated['description'],
                'time_start' => $validated['time_start'],
                'time_end' => $validated['time_end'],
                'total_hour' => $totalHour,
                'total_checkpoint' => 1 + count($checkpoints),
                'checkpoint_times' => $checkpoints,
                'created_by' => auth()->id(),
            ]);

            DB::commit();
            return response()->json([
                'success' => true,
                'message' => 'Shift created successfully',
                'data' => $shift
            ]);
        } catch (ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Validation error: ' . $e->getMessage(),
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create shift: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show(string $id)
    {
        //
    }

    public function edit(string $id)
    {
        //
    }

    public function update(Request $request, string $id)
    {
        try {
            DB::beginTransaction();

            // Validasi input
            $validated = $request->validate([
                'employee_id' => 'required|exists:employees,id',
                'date_shifts' => 'required|array',
                'date_shifts.*' => 'required|date_format:Y-m-d',
                'shift_id' => 'required|exists:shifts,id',
            ]);

            $employeeId = $validated['employee_id'];
            $shiftId = $validated['shift_id'];

            // Delete existing shifts for this employee for the specified dates
            foreach ($validated['date_shifts'] as $date) {
                EmployeeShift::where('employee_id', $employeeId)
                    ->where('date_shift', $date)
                    ->delete();
            }

            // Create new shifts for each date
            foreach ($validated['date_shifts'] as $date) {
                $formattedDate = Carbon::parse($date)->format('Y-m-d');

                EmployeeShift::create([
                    'employee_id' => $employeeId,
                    'shift_id' => $shiftId,
                    'date_shift' => $formattedDate,
                ]);
            }

            DB::commit();
            return response()->json([
                'success' => true,
                'message' => 'Shift updated successfully'
            ]);
        } catch (ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Validation error: ' . $e->getMessage(),
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to update shift: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy(string $id)
    {
        //
    }

    /**
     * Update a shift definition (title, description, time_start, time_end) for Shift Config inline editing
     */
    public function updateConfig(Request $request, string $id)
    {
        try {
            DB::beginTransaction();

            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'time_start' => 'required|date_format:H:i',
                'time_end' => 'required|date_format:H:i',

                'checkpoints' => 'nullable|array|max:' . self::MAX_ADDITIONAL_CHECKPOINTS,
                'checkpoints.*' => 'date_format:H:i',
            ]);

            $start = Carbon::createFromFormat('H:i', $validated['time_start']);
            $end = Carbon::createFromFormat('H:i', $validated['time_end']);

            if ($end->lessThanOrEqualTo($start)) {
                $end = $end->copy()->addDay();
            }
            $totalHour = $end->diffInHours($start, true);
            $checkpoints = $validated['checkpoints'] ?? [];

            $shift = \App\Models\Shift::findOrFail($id);
            $shift->update([
                'title' => $validated['title'],
                'description' => $validated['description'],
                'time_start' => $validated['time_start'],
                'time_end' => $validated['time_end'],
                'total_hour' => $totalHour,
                'total_checkpoint' => 1 + count($checkpoints),
                'checkpoint_times' => $checkpoints,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Shift updated successfully',
                'data' => $shift,
            ]);
        } catch (ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Validation error: ' . $e->getMessage(),
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to update shift: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function softDelete(Request $request, $id)
    {
        $shift = \App\Models\Shift::findOrFail($id);

        $data = $request->json()->all();
        $deletedBy = $data['deleted_by'] ?? auth()->id();

        if (!$deletedBy) {
            return response()->json([
                'success' => false,
                'message' => 'deleted_by missing'
            ], 400);
        }

        $shift->deleted_by = $deletedBy;
        $shift->status = 'DELETED';
        $shift->updated_at = now();
        $shift->save();

        return response()->json(['success' => true]);
    }
}
