<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use App\Models\TaskSchedule;
use App\Models\Task;
use App\Models\TaskAssignment;
use App\Models\Employee;
use App\Models\Notification;
use App\Models\Department;
use App\Models\Division;
use Carbon\Carbon;

// Internal helpers for immediate generation
trait ScheduleImmediateGeneration
{
    public function showSchedulePage()
    {
        return view('schedule/schedule');
    }

    private function maybeGenerateNow(TaskSchedule $s): void
    {
        // Do not generate for schedules that were marked deleted
    if (strtoupper(trim((string)($s->status ?? ''))) === 'DELETED') {
            return;
        }
        $now = Carbon::now();
        $today = $now->copy()->startOfDay();

        // Determine recurrence_start base (prefer recurrence_start_date which is set from start_at during creation)
        $base = $s->recurrence_start_date ? Carbon::parse($s->recurrence_start_date)->startOfDay() : null;

        // If recurrence_start_date is in the future, initialize next_run_at to the initial and return
        if ($base && $today->lt($base)) {
            $s->next_run_at = $this->calcInitialRunAt($s, $now);
            $s->save();
            return;
        }

        // Determine if today is a due date
        $dueToday = false;
        switch ($s->recurrence_type) {
            case 'weekly':
                $dow = (int) ($s->recurrence_day_of_week ?? ($base?->dayOfWeek ?? $today->dayOfWeek));
                // due if today matches DOW and today >= base (if base set)
                $dueToday = ((int) $today->dayOfWeek === $dow) && (!$base || $today->gte($base));
                break;
            case 'monthly':
                $dom = (int) ($s->recurrence_day_of_month ?? ($base?->day ?? $today->day));
                // due if day of month matches and today >= base (if base set)
                $dueToday = ($today->day === $dom) && (!$base || $today->gte($base));
                break;
            case 'daily':
            default:
                // daily: due if today >= base and ((today - base) % interval) == 0
                if (!$base) {
                    // if no base, use tomorrow as start so today is not due
                    $dueToday = false;
                } else {
                    $diff = $base->diffInDays($today, false);
                    $interval = max((int) $s->recurrence_interval, 1);
                    $dueToday = ($diff >= 0) && (($diff % $interval) === 0);
                }
        }

            // include_weekend removed: weekend exclusion handled via recurrence_days_of_week if needed

        if (!$dueToday) {
            // Not due; initialize next_run_at so the scheduler can pick it up
            $s->next_run_at = $this->calcInitialRunAt($s, $now);
            $s->save();
            return;
        }

        // Create the task now using today's occurrence (start date derived from today)
        $task = $this->createTaskFromScheduleNow($s);

        // Advance next run
        $s->last_generated_at = $now;
        $s->next_run_at = $this->calcNextRunAt($s, $today);
        $s->save();
    }

    private function calcInitialRunAt(TaskSchedule $s, Carbon $now): Carbon
    {
        // Use recurrence_start_date (which should reflect start_at if provided by user)
        $start = $s->recurrence_start_date ? Carbon::parse($s->recurrence_start_date)->startOfDay() : null;

        switch ($s->recurrence_type) {
            case 'weekly':
                // If start not provided, fallback to today
                $base = $start ?? $now->copy()->startOfDay();
                $dow = is_null($s->recurrence_day_of_week) ? (int) $base->dayOfWeek : (int) $s->recurrence_day_of_week; // 0=Sun
                $candidate = $base->copy();
                // If base is before today, start from today
                if ($candidate->lt($now->copy()->startOfDay())) {
                    $candidate = $now->copy()->startOfDay();
                }
                // Move forward to the next matching DOW (including today if matches)
                while ((int) $candidate->dayOfWeek !== $dow) {
                    $candidate->addDay();
                }
                return $candidate->startOfDay();
            case 'monthly':
                // Prefer explicit start_at chosen in modal; fall back to recurrence_start_date or today
                $base = $s->start_at ? Carbon::parse($s->start_at)->startOfDay() : ($start ?? $now->copy()->startOfDay());
                // day of month to use: explicit recurrence_day_of_month if set, otherwise day of start_at/base
                $dom = (int) ($s->recurrence_day_of_month ?: $base->day);
                // Determine a reference date: prefer the provided base, but if base is in the past
                // relative to now, use today as the reference. This ensures we find the next
                // occurrence on or after the user's intended start (or today when start is past).
                $ref = $base->copy();
                if ($ref->lt($now->copy()->startOfDay())) {
                    $ref = $now->copy()->startOfDay();
                }
                // Candidate is the day-of-month in the reference month
                $candidate = $this->safeMonthly($ref->year, $ref->month, $dom);
                // If that candidate is before the reference (e.g. user chose day 25 but base is day 5),
                // advance to next month
                if ($candidate->lt($ref)) {
                    $nextMonth = $ref->copy()->addMonthNoOverflow();
                    $candidate = $this->safeMonthly($nextMonth->year, $nextMonth->month, $dom);
                }
                return $candidate->startOfDay();
            case 'daily':
            default:
                // Start from provided start or tomorrow
                $candidate = $start ? $start->startOfDay() : $now->copy()->addDay()->startOfDay();
                if ($candidate->lte($now->copy()->startOfDay())) {
                    $candidate = $now->copy()->addDay()->startOfDay();
                }
                // If recurrence_days_of_week is provided, ensure the initial candidate falls on one of them.
                $allowed = null;
                if (!empty($s->recurrence_days_of_week) && is_array($s->recurrence_days_of_week)) {
                    $allowed = array_map('intval', $s->recurrence_days_of_week);
                }
                $tries = 0;
                while (true) {
                    $dow = (int)$candidate->dayOfWeek;
                    if (is_null($allowed) || in_array($dow, $allowed, true)) {
                        break;
                    }
                    $candidate->addDay();
                    $tries++; if ($tries > 366) break; // safety
                }
                return $candidate;
        }
    }

    private function calcNextRunAt(TaskSchedule $s, Carbon $current): Carbon
    {
        $interval = max((int) $s->recurrence_interval, 1);
        $next = $current->copy();
        switch ($s->recurrence_type) {
            case 'weekly':
                $next->addWeeks($interval);
                $dow = (int) ($s->recurrence_day_of_week ?? $next->dayOfWeek);
                while ((int) $next->dayOfWeek !== $dow) {
                    $next->addDay();
                }
                return $next->startOfDay();
            case 'monthly':
                $dom = (int) ($s->recurrence_day_of_month ?? $current->day);
                $next->addMonthsNoOverflow($interval);
                return $this->safeMonthly($next->year, $next->month, $dom)->startOfDay();
            case 'daily':
            default:
                return $next->addDays($interval)->startOfDay();
        }
    }

    private function safeMonthly(int $year, int $month, int $dom): Carbon
    {
        $last = Carbon::create($year, $month, 1)->endOfMonth()->day;
        $day = min(max($dom, 1), $last);
        return Carbon::create($year, $month, $day, 0, 0, 0);
    }

    private function createTaskFromScheduleNow(TaskSchedule $s): Task
    {
        // Idempotency guard: if a task with same title/creator/project already exists for today, reuse it
        $today = Carbon::now()->toDateString();
        if ($s->created_by) {
            $existing = Task::query()
                ->where('title', $s->title)
                ->where('created_by', $s->created_by)
                ->when($s->project_id, function ($q) use ($s) { $q->where('project_id', $s->project_id); })
                ->whereDate('start_date', $today)
                ->orderByDesc('id')
                ->first();
            if ($existing) {
                return $existing;
            }
        }

        // Copy image
        $taskImage = null;
        if (!empty($s->image)) {
            $src = public_path('file/schedule/' . $s->image);
            if (is_file($src)) {
                $ext = pathinfo($s->image, PATHINFO_EXTENSION);
                $new = 'TASK_FROM_SCHEDULE_' . time() . '.' . $ext;
                @copy($src, public_path('file/task/' . $new));
                $taskImage = $new;
            }
        }

        // Copy reference files
        $taskRefFiles = [];
        $srcFiles = is_array($s->reference_files) ? $s->reference_files : [];
        foreach ($srcFiles as $idx => $fname) {
            $src = public_path('file/schedule_reference_files/' . $fname);
            if (is_file($src)) {
                $ext = pathinfo($fname, PATHINFO_EXTENSION);
                $new = 'TASK_FROM_SCHEDULE_' . time() . '_' . $idx . '.' . $ext;
                @copy($src, public_path('file/task_reference_files/' . $new));
                $taskRefFiles[] = $new;
            }
        }

        // Determine task start date: prefer the schedule's recurrence_start_date when present
        $startDate = $s->recurrence_start_date ? Carbon::parse($s->recurrence_start_date)->toDateString() : $today;
        // Compute due date: prefer due_in_days if provided; else fall back to legacy rules
        if (!is_null($s->due_in_days)) {
            $dueDate = Carbon::parse($startDate)->addDays((int) $s->due_in_days)->toDateString();
        } else if ($s->recurrence_type === 'daily' && $s->due_date && $s->recurrence_start_date) {
            try {
                $base = Carbon::parse($s->recurrence_start_date)->startOfDay();
                $configuredDue = Carbon::parse($s->due_date)->startOfDay();
                $offsetDays = $base->diffInDays($configuredDue, false); // can be 0 or positive
                $dueDate = Carbon::parse($startDate)->addDays(max(0, $offsetDays))->toDateString();
            } catch (\Throwable $e) {
                $dueDate = $startDate; // fallback
            }
        } else {
            $dueDate = $s->due_date ?: $startDate;
        }

        $task = Task::create([
            'project_id' => $s->project_id,
            'point' => $s->point,
            'title' => $s->title,
            'description' => $s->description,
            'image' => $taskImage,
            'priority' => $s->priority,
            'status' => 'new_request',
            'reference_url' => $s->reference_url,
            'reference_urls' => $s->reference_urls ?? [],
            'reference_files' => $taskRefFiles,
            'start_date' => $startDate,
            'due_date' => $dueDate,
            'end_at' => $s->end_at,
            'start_at' => $s->start_at,
            'complete_date' => null,
            'created_by' => $s->created_by,
            'updated_by' => $s->updated_by,
            'deleted_by' => null,
        ]);

        // PIC assignment (from schedule): auto-accept PIC like Add Task modal
        $picUserId = $s->created_by;
        $picEmployee = $picUserId ? Employee::where('user_id', $picUserId)->first() : null;
        if ($picEmployee) {
            TaskAssignment::create([
                'task_id' => $task->id,
                'employee_id' => $picEmployee->id,
                'role' => 'PIC',
                'is_receive' => true,
                'date_receive' => now(),
                'created_by' => $picUserId,
                'updated_by' => $picUserId,
                'deleted_by' => null,
            ]);
        }

        // Executors + notifications
        $executors = is_array($s->executor_ids) ? $s->executor_ids : [];
        foreach ($executors as $eid) {
            if ($picEmployee && (int) $eid === (int) $picEmployee->id)
                continue;
            TaskAssignment::create([
                'task_id' => $task->id,
                'employee_id' => $eid,
                'role' => 'EXECUTOR',
                'is_receive' => false,
                'date_receive' => null,
                'created_by' => $picUserId,
                'updated_by' => $picUserId,
                'deleted_by' => null,
            ]);
            try {
                Notification::create([
                    'employee_id' => $eid,
                    'type' => 'task_assignment',
                    'title' => 'New Task Assignment',
                    'message' => 'You have been assigned to task "' . ($s->title ?? 'Task') . '" [Task ID: ' . $task->id . ']',
                    'sent_at' => now(),
                    'is_read' => false,
                    'created_by' => $picEmployee?->id,
                    'updated_by' => $picEmployee?->id,
                ]);
            } catch (\Throwable $e) { /* ignore */
            }
        }

        // Note: Do not notify PIC/creator; only executors receive assignment notifications

        return $task;
    }
}

class ScheduleController extends Controller
{
    use ScheduleImmediateGeneration;
    /**
     * Safely derive a proper HTTP status code from an exception.
     * Falls back to 500 when the exception code is non-numeric or out of valid HTTP range.
     */
    private function deriveHttpStatusFromException(\Throwable $e): int
    {
        $raw = $e->getCode();
        if (is_numeric($raw)) {
            $code = (int)$raw;
            if ($code >= 100 && $code <= 599) {
                return $code;
            }
        }
        return 500;
    }
    public function index(Request $request)
    {
        // Exclude schedules that have been soft-deleted via status="DELETED"
        $query = TaskSchedule::with('project')
                ->where(function ($q) {
                    $q->whereNull('status')->orWhere('status', '!=', 'DELETED');
                })
            ->orderByDesc('created_at');

        // Only show schedules where current user is PIC (creator) or is listed as an executor
        $currentUser = $request->user();
        $currentUserId = $currentUser?->id;
        $currentEmployeeId = $currentUser?->employee?->id;
        $query->where(function ($q) use ($currentUserId, $currentEmployeeId) {
            if ($currentUserId) {
                $q->where('created_by', $currentUserId);
            }
            if ($currentEmployeeId) {
                $q->orWhereJsonContains('executor_ids', (int) $currentEmployeeId);
            }
        });

    // Show all schedules (including newly created ones). Tasks for monthly schedules
    // are still only created by the scheduled generator, so no task card will appear
    // until generation runs.

        // Apply recurrence_type filter if provided
        $recurrenceType = $request->input('recurrence_type');
        if (!empty($recurrenceType)) {
            $query->where('recurrence_type', $recurrenceType);
        }

        // Apply search filter if provided
        $search = $request->input('search');
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', '%' . $search . '%')
                  ->orWhere('description', 'like', '%' . $search . '%');
            });
        }

        $schedules = $query->paginate(9);
        return response()->json([
            'code' => 200,
            'status' => 'success',
            'data' => $schedules,
        ]);
    }

    public function show(Request $request, $id)
    {
        try {
            $schedule = TaskSchedule::with([
                'project.department',
                'project.division'
            ])->findOrFail($id);

                if (strtoupper(trim((string)($schedule->status ?? ''))) === 'DELETED') {
                return response()->json([
                    'code' => 404,
                    'status' => 'error',
                    'message' => 'Schedule not found',
                ], 404);
            }

            $executors = [];
            if (!empty($schedule->executor_ids)) {
                $executors = Employee::whereIn('id', $schedule->executor_ids)
                    ->with(['user'])
                    ->get()
                    ->map(function ($employee) {
                        return [
                            'id' => $employee->id,
                            'name' => $employee->name,
                            'nik' => $employee->nik,
                        ];
                    });
            }

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'message' => 'Schedule details fetched successfully',
                'data' => [
                    'schedule' => $schedule,
                    'executors' => $executors,
                    'department' => $schedule->project && $schedule->project->department
                        ? $schedule->project->department->name_department
                        : null,
                    'division' => $schedule->project && $schedule->project->division
                        ? $schedule->project->division->name_division
                        : null,
                ],
            ]);
        } catch (\Exception $e) {
            $rawCode = $e->getCode();
            $status = is_numeric($rawCode) ? (int) $rawCode : 0;
            if ($status < 100 || $status > 599) {
                $status = 500;
            }
            return response()->json([
                'code' => $status,
                'status' => 'error',
                'message' => $e->getMessage(),
            ], $status);
        }
    }

    public function create(Request $request)
    {

    }

    public function store(Request $request)
    {
        DB::beginTransaction();
        try {
            $validator = \Validator::make($request->all(), [
                'project_id' => 'required|exists:projects,id',
                'point' => 'required|integer|min:1',
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:10240',
                'priority' => 'required|in:HIGH,MEDIUM,LOW',
                'reference_url' => 'nullable|url|max:255',
                'reference_urls' => 'nullable|array',
                'reference_urls.*' => 'nullable|url|max:255',
                'reference_files' => 'nullable|array',
                'reference_files.*' => [
                    'file',
                    'max:102400',
                    function ($attribute, $value, $fail) {
                        // Allow common extensions OR a short whitelist of MIME types to handle
                        // clients/servers that report Excel files inconsistently.
                        $allowedExt = ['jpeg','png','jpg','gif','svg','webp','pdf','doc','docx','xls','xlsx','zip','csv'];
                        $allowedMime = [
                            'application/vnd.ms-excel',
                            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                            'text/csv',
                            'application/csv',
                            'application/octet-stream',
                        ];
                        try {
                            $ext = strtolower((string) ($value->getClientOriginalExtension() ?? ''));
                            if (in_array($ext, $allowedExt, true)) {
                                return;
                            }
                            $mime = strtolower((string) ($value->getClientMimeType() ?? ''));
                            if (in_array($mime, $allowedMime, true)) {
                                return;
                            }
                        } catch (\Throwable $_) {
                            // fallthrough to fail message
                        }
                        $fail('The ' . $attribute . ' must be a supported file type (images, pdf, doc/docx, xls/xlsx, csv or zip).');
                    }
                ],
                'start_date' => 'nullable|date',
                'due_date' => 'nullable|date|after_or_equal:recurrence_start_date',
                'start_at' => 'required_unless:recurrence_type,daily|nullable|date',
                'end_at' => 'date|after_or_equal:start_at',
                'due_in_days' => 'nullable|integer|min:0|max:3650',
                'complete_date' => 'nullable|date|after_or_equal:start_date',
                'recurrence_type' => 'required|in:daily,weekly,monthly',
                'recurrence_interval' => 'nullable|integer|min:1',
                'recurrence_day_of_week' => 'required_if:recurrence_type,weekly|nullable|integer|min:0|max:6',
                'recurrence_days_of_week' => 'nullable',
                'recurrence_day_of_month' => 'nullable|integer|min:1|max:31',
                'recurrence_days_of_week' => 'nullable',
                'recurrence_start_date' => 'nullable|date',
                'recurrence_end_date' => 'nullable|date|after_or_equal:recurrence_start_date',
                'executor_ids' => 'nullable',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'code' => 422,
                    'status' => 'error',
                    'message' => 'Validation errors',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $data = $validator->validated();

            // Set creator metadata
            if ($request->user()) {
                $data['created_by'] = $request->user()->id;
                $data['updated_by'] = $request->user()->id;
            }

            // Normalize reference URLs
            $refUrls = [];
            if (!empty($data['reference_urls']) && is_array($data['reference_urls'])) {
                $refUrls = array_values(array_filter($data['reference_urls']));
            } elseif (!empty($data['reference_url'])) {
                $refUrls = [$data['reference_url']];
            }
            $data['reference_urls'] = $refUrls;

            // Handle image
            if ($request->hasFile('image')) {
                $img = $request->file('image');
                $name = 'SCHEDULE_' . time() . '.' . $img->getClientOriginalExtension();
                $img->move(public_path('file/schedule'), $name);
                $data['image'] = $name;
            }

            // Handle reference files
            $refFiles = [];
            if ($request->hasFile('reference_files')) {
                foreach ($request->file('reference_files') as $idx => $file) {
                    $name = 'SCHEDULE_' . time() . '_' . $idx . '.' . $file->getClientOriginalExtension();
                    $file->move(public_path('file/schedule_reference_files'), $name);
                    $refFiles[] = $name;
                }
            }
            $data['reference_files'] = $refFiles;

            // Updated by
            if ($request->user()) {
                $data['updated_by'] = $request->user()->id;
            }

            // include_weekend removed

            // Normalize executor_ids
            $execIds = $request->input('executor_ids');
            if (is_string($execIds)) {
                $decoded = json_decode($execIds, true);
                if (is_array($decoded)) {
                    $data['executor_ids'] = array_values($decoded);
                }
            } elseif (is_array($execIds)) {
                $data['executor_ids'] = array_values($execIds);
            }

            // Normalize recurrence_days_of_week (may be JSON string)
            $daysInput = $request->input('recurrence_days_of_week');
            if (is_string($daysInput)) {
                $decoded = json_decode($daysInput, true);
                if (is_array($decoded)) {
                    $vals = array_map('intval', $decoded);
                    $vals = array_values(array_unique($vals));
                    sort($vals, SORT_NUMERIC);
                    $data['recurrence_days_of_week'] = array_values($vals);
                }
            } elseif (is_array($daysInput)) {
                $vals = array_map('intval', $daysInput);
                $vals = array_values(array_unique($vals));
                sort($vals, SORT_NUMERIC);
                $data['recurrence_days_of_week'] = array_values($vals);
            }

            // For daily recurrence we prefer to derive schedule start_date from start_at (user intent)
            if (($data['recurrence_type'] ?? '') === 'daily') {
                if (!empty($data['start_at'])) {
                    try {
                        // Use only the date portion of start_at as the recurrence start_date
                        $data['recurrence_start_date'] = Carbon::parse($data['start_at'])->toDateString();
                        // Also set schedule-level start_date to match start_at date so created tasks pick same start_date
                        $data['start_date'] = Carbon::parse($data['start_at'])->toDateString();
                    } catch (\Throwable $e) {
                        $data['recurrence_start_date'] = Carbon::today()->toDateString();
                        $data['start_date'] = Carbon::today()->toDateString();
                    }
                } else {
                    // fallback to today
                    if (empty($data['recurrence_start_date'])) {
                        $data['recurrence_start_date'] = Carbon::today()->toDateString();
                    }
                    if (empty($data['start_date'])) {
                        $data['start_date'] = Carbon::today()->toDateString();
                    }
                }

                // If due_in_days provided, compute due_date from the start_date derived above
                if (array_key_exists('due_in_days', $data) && $data['due_in_days'] !== null) {
                    try {
                        $start = Carbon::parse($data['start_date'])->startOfDay();
                        $data['due_date'] = $start->copy()->addDays((int) $data['due_in_days'])->toDateString();
                    } catch (\Throwable $e) {
                        $data['due_date'] = null;
                    }
                }
            } else {
                // Default start_date ke today kalau kosong for non-daily
                if (empty($data['start_date'])) {
                    $data['start_date'] = Carbon::today()->toDateString();
                }

                // Hitung due_date dari start_date + due_in_days for non-daily
                if (!empty($data['due_in_days'])) {
                    try {
                        $start = Carbon::parse($data['start_date'])->startOfDay();
                        $data['due_date'] = $start->copy()->addDays((int) $data['due_in_days'])->toDateString();
                    } catch (\Throwable $e) {
                        $data['due_date'] = null; // fallback
                    }
                }
            }
            // For monthly recurrence, ensure schedule.start_date follows the chosen start_at (recurrence_start_date)
            if (($data['recurrence_type'] ?? '') === 'monthly') {
                $data['start_date'] = $data['recurrence_start_date'] ?? Carbon::today()->toDateString();
                if (array_key_exists('due_in_days', $data) && $data['due_in_days'] !== null) {
                    try {
                        $start = Carbon::parse($data['start_date'])->startOfDay();
                        $data['due_date'] = $start->copy()->addDays((int) $data['due_in_days'])->toDateString();
                    } catch (\Throwable $e) {
                        $data['due_date'] = null;
                    }
                }
            }

            // Prepare recurrence defaults
            // If start_at provided, prefer it as recurrence_start_date (user intent)
            if (!empty($data['start_at'])) {
                try {
                    $data['recurrence_start_date'] = Carbon::parse($data['start_at'])->toDateString();
                } catch (\Throwable $e) {
                    $data['recurrence_start_date'] = Carbon::today()->toDateString();
                }
            } else {
                if (empty($data['recurrence_start_date'])) {
                    $data['recurrence_start_date'] = Carbon::today()->toDateString();
                }
            }
            // For weekly recurrence, use recurrence_start_date as the schedule's start_date
            if (($data['recurrence_type'] ?? '') === 'weekly') {
                $data['start_date'] = $data['recurrence_start_date'] ?? Carbon::today()->toDateString();
                if (array_key_exists('due_in_days', $data) && $data['due_in_days'] !== null) {
                    try {
                        $start = Carbon::parse($data['start_date'])->startOfDay();
                        $data['due_date'] = $start->copy()->addDays((int) $data['due_in_days'])->toDateString();
                    } catch (\Throwable $e) {
                        $data['due_date'] = null;
                    }
                }
            }
            $data['recurrence_interval'] = (int)($data['recurrence_interval'] ?? 1) ?: 1;
            if (($data['recurrence_type'] ?? '') !== 'weekly') {
                $data['recurrence_day_of_week'] = null;
            }
            // If daily recurrence was provided with recurrence_days_of_week, keep it and clear single-day field
            if (!empty($data['recurrence_days_of_week'])) {
                $data['recurrence_day_of_week'] = null;
            }
            if (($data['recurrence_type'] ?? '') !== 'monthly') {
                $data['recurrence_day_of_month'] = null;
            } else {
                try {
                    $base = Carbon::parse($data['recurrence_start_date']);
                    $data['recurrence_day_of_month'] = (int) (($data['recurrence_day_of_month'] ?? null) ?: $base->day);
                } catch (\Throwable $e) {
                    $dom = (int) (($data['recurrence_day_of_month'] ?? null) ?: Carbon::today()->day);
                    $data['recurrence_day_of_month'] = max(1, min(31, $dom));
                }
            }
            $data['recurrence_end_date'] = null;
            $data['is_active'] = true;
            $data['next_run_at'] = null; // will be initialized in maybeGenerateNow

            // For daily schedules, auto-set start_at to tomorrow if not provided
            if ($data['recurrence_type'] === 'daily') {
                if (empty($data['start_at'])) {
                    $data['start_at'] = Carbon::tomorrow()->toDateString();
                }
            }

            $schedule = TaskSchedule::create($data);

            // Ensure monthly schedules have their start/due/next fields initialized but do NOT
            // create tasks immediately. The scheduled generator is responsible for creating tasks.
            if (($data['recurrence_type'] ?? '') === 'monthly') {
                // Ensure start_date follows recurrence_start_date
                try {
                    $schedule->start_date = $schedule->recurrence_start_date ? Carbon::parse($schedule->recurrence_start_date)->toDateString() : $schedule->start_date;
                } catch (\Throwable $e) {
                    $schedule->start_date = $schedule->start_date ?? Carbon::today()->toDateString();
                }

                // Recompute due_date from start_date + due_in_days when applicable
                if (!is_null($schedule->due_in_days)) {
                    try {
                        $sdate = Carbon::parse($schedule->start_date)->startOfDay();
                        $schedule->due_date = $sdate->copy()->addDays((int) $schedule->due_in_days)->toDateString();
                    } catch (\Throwable $e) {
                        // ignore, leave due_date as is
                    }
                }

                // Initialize next_run_at to the first occurrence (calculated by helper) so
                // the scheduler command can pick it up. Do NOT call maybeGenerateNow to avoid
                // creating a Task immediately on creation.
                try {
                    $schedule->next_run_at = $this->calcInitialRunAt($schedule, Carbon::now());
                } catch (\Throwable $e) {
                    $schedule->next_run_at = $schedule->recurrence_start_date ? Carbon::parse($schedule->recurrence_start_date)->startOfDay() : null;
                }
                $schedule->save();
            } else {
                // For non-monthly schedules we MUST NOT create a Task immediately even if
                // the recurrence falls on today. Instead initialize `next_run_at` so the
                // background generator/command will create the Task when it runs.
                try {
                    $schedule->next_run_at = $this->calcInitialRunAt($schedule, Carbon::now());
                } catch (\Throwable $e) {
                    $schedule->next_run_at = $schedule->recurrence_start_date ? Carbon::parse($schedule->recurrence_start_date)->startOfDay() : null;
                }
                $schedule->save();
            }

            DB::commit();

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'message' => 'Schedule created successfully',
                'data' => $schedule,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            $status = $this->deriveHttpStatusFromException($e);
            return response()->json([
                'code' => $status,
                'status' => 'error',
                'message' => $e->getMessage(),
            ], $status);
        }
    }

    public function edit($id)
    {
        try {
            $schedule = TaskSchedule::findOrFail($id);

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'message' => 'Schedule fetched successfully',
                'data' => $schedule,
            ]);
        } catch (\Exception $e) {
            $status = $this->deriveHttpStatusFromException($e);
            return response()->json([
                'code' => $status,
                'status' => 'error',
                'message' => $e->getMessage(),
            ], $status);
        }
    }

    public function update(Request $request, $id)
    {
        DB::beginTransaction();
        try {
            $schedule = TaskSchedule::findOrFail($id);

            $validator = \Validator::make($request->all(), [
                'project_id' => 'nullable|exists:projects,id',
                'point' => 'nullable|integer|min:1',
                'title' => 'nullable|string|max:255',
                'description' => 'nullable|string',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:10240',
                'priority' => 'nullable|in:HIGH,MEDIUM,LOW',
                'reference_url' => 'nullable|url|max:255',
                'reference_urls' => 'nullable|array',
                'reference_urls.*' => 'nullable|url|max:255',
                'reference_files' => 'nullable|array',
                'reference_files.*' => [
                    'file',
                    'max:102400',
                    function ($attribute, $value, $fail) {
                        $allowedExt = ['jpeg','png','jpg','gif','svg','webp','pdf','doc','docx','xls','xlsx','zip','csv'];
                        $allowedMime = [
                            'application/vnd.ms-excel',
                            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                            'text/csv',
                            'application/csv',
                            'application/octet-stream',
                        ];
                        try {
                            $ext = strtolower((string) ($value->getClientOriginalExtension() ?? ''));
                            if (in_array($ext, $allowedExt, true)) {
                                return;
                            }
                            $mime = strtolower((string) ($value->getClientMimeType() ?? ''));
                            if (in_array($mime, $allowedMime, true)) {
                                return;
                            }
                        } catch (\Throwable $_) {
                            // fallthrough
                        }
                        $fail('The ' . $attribute . ' must be a supported file type (images, pdf, doc/docx, xls/xlsx, csv or zip).');
                    }
                ],
                'start_date' => 'nullable|date',
                'due_date' => 'nullable|date|after_or_equal:recurrence_start_date',
                'start_at' => 'required_unless:recurrence_type,daily|nullable|date',
                'end_at' => 'nullable|date|after_or_equal:start_at',
                'due_in_days' => 'nullable|integer|min:0|max:3650',
                'complete_date' => 'nullable|date|after_or_equal:start_date',
                'recurrence_type' => 'nullable|in:daily,weekly,monthly',
                'recurrence_interval' => 'nullable|integer|min:1',
                'recurrence_day_of_week' => 'nullable|integer|min:0|max:6',
                'recurrence_day_of_month' => 'nullable|integer|min:1|max:31',
                'recurrence_start_date' => 'nullable|date',
                'recurrence_end_date' => 'nullable|date|after_or_equal:recurrence_start_date',
                'executor_ids' => 'nullable',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'code' => 422,
                    'status' => 'error',
                    'message' => 'Validation errors',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $data = $validator->validated();

            // Set updated_by
            if ($request->user()) {
                $data['updated_by'] = $request->user()->id;
            }

            // Normalize reference URLs
            $refUrls = [];
            if (!empty($data['reference_urls']) && is_array($data['reference_urls'])) {
                $refUrls = array_values(array_filter($data['reference_urls']));
            } elseif (!empty($data['reference_url'])) {
                $refUrls = [$data['reference_url']];
            }
            if (!empty($refUrls)) {
                $data['reference_urls'] = $refUrls;
            }

            // Handle image
            if ($request->hasFile('image')) {
                $img = $request->file('image');
                $name = 'SCHEDULE_' . time() . '.' . $img->getClientOriginalExtension();
                $img->move(public_path('file/schedule'), $name);

                // hapus file lama
                if ($schedule->image && file_exists(public_path('file/schedule/' . $schedule->image))) {
                    @unlink(public_path('file/schedule/' . $schedule->image));
                }

                $data['image'] = $name;
            }

            // Handle reference files (replace full)
            if ($request->hasFile('reference_files')) {
                $refFiles = [];
                foreach ($request->file('reference_files') as $idx => $file) {
                    $name = 'SCHEDULE_' . time() . '_' . $idx . '.' . $file->getClientOriginalExtension();
                    $file->move(public_path('file/schedule_reference_files'), $name);
                    $refFiles[] = $name;
                }
                $data['reference_files'] = $refFiles;
            }

            // Normalize executor_ids
            $execIds = $request->input('executor_ids');
            if (is_string($execIds)) {
                $decoded = json_decode($execIds, true);
                if (is_array($decoded)) {
                    $data['executor_ids'] = array_values($decoded);
                }
            }

            // Recurrence-aware start_date/due_date handling on update
            if (!empty($data['recurrence_type']) && $data['recurrence_type'] === 'daily') {
                // If start_at provided in update, set recurrence_start_date and start_date to its date
                if (array_key_exists('start_at', $data) && !empty($data['start_at'])) {
                    try {
                        $data['recurrence_start_date'] = Carbon::parse($data['start_at'])->toDateString();
                        $data['start_date'] = Carbon::parse($data['start_at'])->toDateString();
                    } catch (\Throwable $e) {
                        $data['recurrence_start_date'] = $schedule->recurrence_start_date ?? Carbon::today()->toDateString();
                        $data['start_date'] = $schedule->start_date ?? Carbon::today()->toDateString();
                    }
                } else {
                    if (empty($data['recurrence_start_date'])) {
                        $data['recurrence_start_date'] = $schedule->recurrence_start_date ?? Carbon::today()->toDateString();
                    }
                    if (empty($data['start_date'])) {
                        $data['start_date'] = $schedule->start_date ?? Carbon::today()->toDateString();
                    }
                }

                // Recompute due_date from start_date + due_in_days when due_in_days is provided in payload
                if (array_key_exists('due_in_days', $data) && $data['due_in_days'] !== null) {
                    try {
                        $start = Carbon::parse($data['start_date'])->startOfDay();
                        $data['due_date'] = $start->copy()->addDays((int) $data['due_in_days'])->toDateString();
                    } catch (\Throwable $e) {
                        $data['due_date'] = null;
                    }
                }
            } else {
                // Default start_date kalau kosong
                if (empty($data['start_date']) && !$schedule->start_date) {
                    $data['start_date'] = Carbon::today()->toDateString();
                }

                // Hitung due_date dari start_date + due_in_days
                if (array_key_exists('due_in_days', $data) && $data['due_in_days'] !== null) {
                    try {
                        $start = Carbon::parse($data['start_date'] ?? $schedule->start_date)->startOfDay();
                        $data['due_date'] = $start->copy()->addDays((int) $data['due_in_days'])->toDateString();
                    } catch (\Throwable $e) {
                        $data['due_date'] = null;
                    }
                }
            }

            // Recurrence handling
            if (!empty($data['recurrence_type'])) {
                if (empty($data['recurrence_start_date'])) {
                    $data['recurrence_start_date'] = Carbon::today()->toDateString();
                }
                $data['recurrence_interval'] = 1;

                if ($data['recurrence_type'] !== 'weekly') {
                    $data['recurrence_day_of_week'] = null;
                }
                if ($data['recurrence_type'] !== 'monthly') {
                    $data['recurrence_day_of_month'] = null;
                } else {
                    try {
                        $base = Carbon::parse($data['recurrence_start_date']);
                        $data['recurrence_day_of_month'] = (int) (($data['recurrence_day_of_month'] ?? null) ?: $base->day);
                    } catch (\Throwable $e) {
                        $dom = (int) (($data['recurrence_day_of_month'] ?? null) ?: Carbon::today()->day);
                        $data['recurrence_day_of_month'] = max(1, min(31, $dom));
                    }
                }
                $data['recurrence_end_date'] = null;
            }

            // Normalize recurrence_days_of_week input for update: integers, unique, sorted
            $daysInput = $request->input('recurrence_days_of_week');
            if (is_string($daysInput)) {
                $decoded = json_decode($daysInput, true);
                if (is_array($decoded)) {
                    $vals = array_map('intval', $decoded);
                    $vals = array_values(array_unique($vals));
                    sort($vals, SORT_NUMERIC);
                    $data['recurrence_days_of_week'] = array_values($vals);
                }
            } elseif (is_array($daysInput)) {
                $vals = array_map('intval', $daysInput);
                $vals = array_values(array_unique($vals));
                sort($vals, SORT_NUMERIC);
                $data['recurrence_days_of_week'] = array_values($vals);
            }

            if (!empty($data['recurrence_days_of_week'])) {
                $data['recurrence_day_of_week'] = null;
            }

            // include_weekend removed

            // Update schedule
            if (!empty($data)) {
                $schedule->update($data);
            }
            $schedule->refresh();

            // Ensure start_date and due_date are recomputed to follow any changed start_at
            // or due_in_days. This applies for daily, weekly and monthly schedules.
            try {
                // If the payload provided a start_at or start_date, normalize start_date
                if (array_key_exists('start_at', $data) && !empty($data['start_at'])) {
                    $sdate = Carbon::parse($data['start_at'])->toDateString();
                    $schedule->start_date = $sdate;
                    // If recurrence exists, also sync recurrence_start_date for user intent
                    if (!empty($schedule->recurrence_type)) {
                        $schedule->recurrence_start_date = $sdate;
                    }
                } elseif (array_key_exists('start_date', $data) && !empty($data['start_date'])) {
                    $schedule->start_date = Carbon::parse($data['start_date'])->toDateString();
                }

                // If due_in_days provided in payload or schedule already has it, recompute due_date
                if (array_key_exists('due_in_days', $data) && $data['due_in_days'] !== null) {
                    $base = Carbon::parse($schedule->start_date ?? Carbon::today()->toDateString())->startOfDay();
                    $schedule->due_date = $base->copy()->addDays((int)$data['due_in_days'])->toDateString();
                } elseif (!is_null($schedule->due_in_days)) {
                    // ensure existing due_in_days remains honored if start_date changed
                    $base = Carbon::parse($schedule->start_date ?? Carbon::today()->toDateString())->startOfDay();
                    $schedule->due_date = $base->copy()->addDays((int)$schedule->due_in_days)->toDateString();
                }
            } catch (\Throwable $e) {
                // ignore and keep existing values
            }
            // Persist intermediate changes before recurrence-specific adjustments below
            $schedule->save();

            // If updated schedule is monthly, ensure its start_date/due_date/next_run_at
            // are consistent with recurrence_start_date and due_in_days.
            if ($schedule->recurrence_type === 'monthly') {
                try {
                    $schedule->start_date = $schedule->recurrence_start_date ? Carbon::parse($schedule->recurrence_start_date)->toDateString() : $schedule->start_date;
                } catch (\Throwable $e) {
                    // ignore
                }
                if (!is_null($schedule->due_in_days)) {
                    try {
                        $sdate = Carbon::parse($schedule->start_date)->startOfDay();
                        $schedule->due_date = $sdate->copy()->addDays((int) $schedule->due_in_days)->toDateString();
                    } catch (\Throwable $e) {
                        // ignore
                    }
                }
                try {
                    // If the user changed start_at/start_date, prefer to sync recurrence_day_of_month
                    // to the chosen start date so next_run_at follows user intent.
                    if ($schedule->start_date) {
                        try {
                            $sdt = Carbon::parse($schedule->start_date)->startOfDay();
                            $schedule->recurrence_day_of_month = (int) $sdt->day;
                        } catch (\Throwable $e) {
                            // ignore parsing errors
                        }
                    }

                    // For monthly schedules, next_run_at should be the same day-of-month in the next month
                    $start = $schedule->start_date ? Carbon::parse($schedule->start_date)->startOfDay() : Carbon::now()->startOfDay();
                    $nextMonth = $start->copy()->addMonthNoOverflow();
                    $dom = (int) ($schedule->recurrence_day_of_month ?: $start->day);
                    $candidate = $this->safeMonthly($nextMonth->year, $nextMonth->month, $dom);
                    $schedule->next_run_at = $candidate->startOfDay();
                } catch (\Throwable $e) {
                    // fallback: compute initial run normally
                    try {
                        $schedule->next_run_at = $this->calcInitialRunAt($schedule, Carbon::now());
                    } catch (\Throwable $e) {
                        // leave as-is
                    }
                }
                $schedule->save();
            }
            // For weekly schedules, ensure recurrence_start_date/start_date follow start_at
            // and compute next_run_at using the same logic as creation (calcInitialRunAt)
            if ($schedule->recurrence_type === 'weekly') {
                try {
                    // If start_at was provided/updated, use it as recurrence_start_date and start_date
                    if ($schedule->start_at) {
                        try {
                            $rdate = Carbon::parse($schedule->start_at)->toDateString();
                            $schedule->recurrence_start_date = $rdate;
                            $schedule->start_date = $rdate;
                        } catch (\Throwable $e) {
                            // ignore
                        }
                    }

                    // If start_date present, sync recurrence_day_of_week from it (user intent)
                    if ($schedule->start_date) {
                        try {
                            $sdt = Carbon::parse($schedule->start_date)->startOfDay();
                            $schedule->recurrence_day_of_week = (int) $sdt->dayOfWeek;
                        } catch (\Throwable $e) { /* ignore */ }
                    }

                    // Compute next_run_at consistently with creation logic
                    $schedule->next_run_at = $this->calcInitialRunAt($schedule, Carbon::now());
                } catch (\Throwable $e) {
                    // fallback: leave next_run_at as-is
                }
                $schedule->save();
            }

            DB::commit();

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'message' => 'Schedule updated successfully',
                'data' => $schedule,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            $status = $this->deriveHttpStatusFromException($e);
            return response()->json([
                'code' => $status,
                'status' => 'error',
                'message' => $e->getMessage(),
            ], $status);
        }
    }

    public function destroy(Request $request, $id)
    {
        DB::beginTransaction();
        try {
            $schedule = TaskSchedule::findOrFail($id);

            // Mark schedule as deleted instead of removing DB row
            $schedule->status = 'DELETED';
            $schedule->is_active = false;
            $schedule->next_run_at = null; // ensure scheduler won't pick it up
            if ($request->user()) {
                $schedule->deleted_by = $request->user()->id;
            }
            $schedule->save();

            DB::commit();

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'message' => 'Schedule and related tasks deleted successfully',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            $rawCode = $e->getCode();
            $status = is_numeric($rawCode) ? (int) $rawCode : 0;
            if ($status < 100 || $status > 599) {
                $status = 500;
            }
            return response()->json([
                'code' => $status,
                'status' => 'error',
                'message' => $e->getMessage(),
            ], $status);
        }
    }
}
