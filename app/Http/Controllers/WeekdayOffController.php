<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Carbon\Carbon;

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Color;
use PhpOffice\PhpSpreadsheet\Style\Fill;

use PhpOffice\PhpSpreadsheet\Cell\Coordinate;

use App\Models\User;
use App\Models\Attendance;
use App\Models\AttendanceTracking;
use App\Models\Employee;
use App\Models\Department;
use App\Models\Division;

class WeekdayOffController extends Controller
{
    public function showWeekdayOffPage()
    {
        $user = auth()->user();
        $userId = auth()->user()->id;

        $currentEmployee = Employee::where('user_id', $userId)->first();

        $userType = strtoupper((string) ($user->user_type ?? ''));
        $userRole = strtoupper((string) ($user->user_role ?? ''));

        $activeEmployeeDeptIds = Employee::join('users', 'employees.user_id', '=', 'users.id')
            ->where('employees.status', 'ACTIVE')
            ->where('users.user_role', 'EMPLOYEE')
            ->whereNotIn('users.user_type', ['ADMINISTRATOR', 'SUPERADMIN'])
            ->whereNotNull('employees.department_id')
            ->distinct()
            ->pluck('employees.department_id');

        $activeEmployeeDivIds = Employee::join('users', 'employees.user_id', '=', 'users.id')
            ->where('employees.status', 'ACTIVE')
            ->where('users.user_role', 'EMPLOYEE')
            ->whereNotIn('users.user_type', ['ADMINISTRATOR', 'SUPERADMIN'])
            ->whereNotNull('employees.division_id')
            ->distinct()
            ->pluck('employees.division_id');

        if ($userType === 'SUPERADMIN') {
            $department = Department::where('status', 'ACTIVE')
                ->whereIn('id', $activeEmployeeDeptIds)
                ->get();
            $division = Division::where('status', 'ACTIVE')
                ->whereIn('id', $activeEmployeeDivIds)
                ->get();
        } else {
            $department = Department::where('status', 'ACTIVE')
                ->where('id', $currentEmployee?->department_id ?? 0)
                ->whereIn('id', $activeEmployeeDeptIds)
                ->get();
            $division = Division::where('status', 'ACTIVE')
                ->where('department_id', $currentEmployee?->department_id ?? 0)
                ->whereIn('id', $activeEmployeeDivIds)
                ->get();
        }

        return view('weekday_off.weekday_off', [
            'department' => $department,
            'division' => $division
        ]);
    }

    public function getEmployeeWeekdayOff(Request $request)
    {
        $user = auth()->user();
        $userId = auth()->user()->id;

        $currentEmployee = Employee::where('user_id', $userId)->first();

        $userType = strtoupper((string) ($user->user_type ?? ''));
        $userRole = strtoupper((string) ($user->user_role ?? ''));

        $departmentId = $request->DEPARTMENT_ID ?? null;
        $divisionId = $request->DIVISION_ID ?? null;
        $searchQuery = $request->SEARCH_QUERY ?? '';
        $perPage = (int) ($request->PER_PAGE ?? 10);
        $page = (int) ($request->PAGE ?? 1);

        $employeeQuery = Employee::select(
            'employees.id',
            'employees.user_id',
            'employees.department_id',
            'employees.division_id',
            'employees.name',
            'employees.status',
            'employees.photo',
            'employees.weekday_off'
        )
            ->join('job_list', 'employees.job_id', '=', 'job_list.id')
            ->join('users', 'employees.user_id', '=', 'users.id')
            ->where('employees.status', 'ACTIVE')
            ->where('users.user_role', 'EMPLOYEE')
            ->whereNotIn('users.user_type', ['ADMINISTRATOR', 'SUPERADMIN']);

        if ($userType !== 'SUPERADMIN') {
            $employeeQuery->where('employees.department_id', $currentEmployee?->department_id ?? 0);
        }

        if ($departmentId) {
            $employeeQuery->where('employees.department_id', $departmentId);
        }

        if ($divisionId) {
            $employeeQuery->where('employees.division_id', $divisionId);
        }

        if ($searchQuery !== '') {
            $employeeQuery->where('employees.name', 'like', '%' . $searchQuery . '%');
        }

        $paginated = $employeeQuery->orderBy('employees.name')->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'code' => 200,
            'status' => 'success',
            'data' => $paginated->items(),
            'pagination' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'from' => $paginated->firstItem(),
                'to' => $paginated->lastItem(),
                'total' => $paginated->total(),
            ],
            'message' => 'Get employee weekday off successfully'
        ]);
    }

    public function saveEmployeeWeekdayoff(Request $request)
    {
        try {
            $request->validate([
                'json_weekday_off' => 'required|json',
            ]);

            $jsonWeekdayOff = json_decode($request->json_weekday_off);

            foreach ($jsonWeekdayOff as $item) {
                $employeeId = $item[0];
                $divisionId = $item[1];
                $weekDay = $item[2];

                Employee::where('id', $employeeId)->where('division_id', $divisionId)
                    ->update([
                        'weekday_off' => $weekDay
                    ]);
            }

            $successMsg = 'Save weekday off successfully';

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'message' => $successMsg
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'code' => 406,
                'status' => 'error',
                'message' => $e->getMessage()
            ], 406);
        }
    }
}
