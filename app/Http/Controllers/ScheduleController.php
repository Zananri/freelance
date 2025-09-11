<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use App\Models\Schedule;
use App\Models\Task;
use App\Models\TaskAssignment;
use App\Models\Employee;
use App\Models\Notification;
use Carbon\Carbon;

// Internal helpers for immediate generation
trait ScheduleImmediateGeneration
{
    public function showSchedulePage() {
        return view('schedule/schedule');
    }

    private function maybeGenerateNow(Schedule $s): void
    {
        $now = Carbon::now();
        $start = $s->recurrence_start_date ? Carbon::parse($s->recurrence_start_date)->startOfDay() : $now->copy()->startOfDay();
        if ($now->lt($start)) {
            // Initialize next_run_at to first occurrence in the future
            $s->next_run_at = $this->calcInitialRunAt($s, $now);
            $s->save();
            return;
        }

        // Determine if today is a due date
        $today = $now->copy()->startOfDay();
        $dueToday = false;
        switch ($s->recurrence_type) {
            case 'weekly':
                $dow = (int) ($s->recurrence_day_of_week ?? $today->dayOfWeek);
                $dueToday = ((int)$today->dayOfWeek === $dow);
                break;
            case 'monthly':
                $dom = (int) ($s->recurrence_day_of_month ?? $today->day);
                $dueToday = ((int)$today->day === $dom);
                break;
            case 'daily':
            default:
                $dueToday = true;
        }

        if (!$dueToday) {
            // Not due; initialize next_run_at so the scheduler can pick it up
            $s->next_run_at = $this->calcInitialRunAt($s, $now);
            $s->save();
            return;
        }

        // Create the task now
        $task = $this->createTaskFromScheduleNow($s);

        // Advance next run
        $s->last_generated_at = $now;
        $s->next_run_at = $this->calcNextRunAt($s, $today);
        $s->save();
    }

    private function calcInitialRunAt(Schedule $s, Carbon $now): Carbon
    {
        $start = $s->recurrence_start_date ? Carbon::parse($s->recurrence_start_date)->startOfDay() : $now->copy()->startOfDay();
        switch ($s->recurrence_type) {
            case 'weekly':
                $dow = (int) ($s->recurrence_day_of_week ?? $start->dayOfWeek);
                $c = $start->copy();
                while ((int)$c->dayOfWeek !== $dow) { $c->addDay(); }
                return $c;
            case 'monthly':
                $dom = (int) ($s->recurrence_day_of_month ?? $start->day);
                // If Start From is on or before today, first run is the month matching Start From date
                return $this->safeMonthly($start->year, $start->month, $dom);
            case 'daily':
            default:
                return $start;
        }
    }

    private function calcNextRunAt(Schedule $s, Carbon $current): Carbon
    {
        $interval = max((int) $s->recurrence_interval, 1);
        $next = $current->copy();
        switch ($s->recurrence_type) {
            case 'weekly':
                $next->addWeeks($interval);
                $dow = (int) ($s->recurrence_day_of_week ?? $next->dayOfWeek);
                while ((int)$next->dayOfWeek !== $dow) { $next->addDay(); }
                return $next->startOfDay();
            case 'monthly':
                $dom = (int) ($s->recurrence_day_of_month ?? $current->day);
                $next->addMonthsNoOverflow($interval);
                return $this->safeMonthly($next->year, $next->month, $dom);
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

    private function createTaskFromScheduleNow(Schedule $s): \App\Models\Task
    {
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

        $today = Carbon::now()->toDateString();
        // Start date is always the run day for tasks generated from schedules
        $startDate = $today;
        // Compute due date preference: due_in_days if provided; else legacy due_date rules
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
            'complete_date' => null,
            'created_by' => $s->created_by,
            'updated_by' => $s->updated_by,
            'deleted_by' => null,
        ]);

        // PIC assignment
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
            if ($picEmployee && (int)$eid === (int)$picEmployee->id) continue;
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
            } catch (\Throwable $e) { /* ignore */ }
        }

    // Note: Do not notify PIC/creator; only executors receive assignment notifications

        return $task;
    }
}

class ScheduleController extends Controller
{
    use ScheduleImmediateGeneration;
    public function index(Request $request)
    {
        $schedules = Schedule::orderByDesc('created_at')->paginate(10);
        return response()->json([
            'code' => 200,
            'status' => 'success',
            'data' => $schedules,
        ]);
    }

    public function create(Request $request)
    {
        // Provide any data needed by form (e.g. projects) via AJAX later; just serve view
        return view('schedule.create');
    }

    public function store(Request $request)
    {
        DB::beginTransaction();
        try {
            $validator = \Validator::make($request->all(), [
                'project_id' => 'nullable|exists:projects,id',
                'point' => 'required|integer|min:1',
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:2048',
                'priority' => 'required|in:HIGH,MEDIUM,LOW',
                'reference_url' => 'nullable|url|max:255',
                'reference_urls' => 'nullable|array',
                'reference_urls.*' => 'nullable|url|max:255',
                'reference_files' => 'nullable|array',
                'reference_files.*' => 'file|mimes:jpeg,png,jpg,gif,svg,webp,pdf,doc,docx,xls,xlsx,zip|max:5120',
                // Default dates: start_date optional and ignored for all recurrence types; legacy due_date optional; new due_in_days optional
                'start_date' => 'nullable|date',
                'due_date' => 'nullable|date|after_or_equal:recurrence_start_date',
                'due_in_days' => 'nullable|integer|min:0|max:3650',
                'complete_date' => 'nullable|date|after_or_equal:start_date',
                // Recurrence
                'recurrence_type' => 'required|in:daily,weekly,monthly',
                'recurrence_interval' => 'nullable|integer|min:1',
                'recurrence_day_of_week' => 'required_if:recurrence_type,weekly|nullable|integer|min:0|max:6',
                // Monthly date will default to day-of-month of Start From; no need to require client-side
                'recurrence_day_of_month' => 'nullable|integer|min:1|max:31',
                'recurrence_start_date' => 'nullable|date',
                'recurrence_end_date' => 'nullable|date|after_or_equal:recurrence_start_date',
                'executor_ids' => 'nullable', // JSON array of IDs as string
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

            // Created by
            if ($request->user()) {
                $data['created_by'] = $request->user()->id;
            }

            // Normalize executor_ids (stringified JSON to array) and store into column
            $execIds = $request->input('executor_ids');
            if (is_string($execIds)) {
                $decoded = json_decode($execIds, true);
                if (is_array($decoded)) $data['executor_ids'] = array_values($decoded);
            }

            // Prepare recurrence defaults
            // Default start date to today if not provided (schedule valid indefinitely)
            if (empty($data['recurrence_start_date'])) {
                $data['recurrence_start_date'] = Carbon::today()->toDateString();
            }
            // Interval fixed 1
            $data['recurrence_interval'] = 1;
            if (($data['recurrence_type'] ?? '') !== 'weekly') {
                $data['recurrence_day_of_week'] = null;
            }
            if (($data['recurrence_type'] ?? '') !== 'monthly') {
                $data['recurrence_day_of_month'] = null;
            } else {
                // Monthly: derive day-of-month from provided value or from (now/today) if missing
                try {
                    $base = Carbon::parse($data['recurrence_start_date']);
                    $data['recurrence_day_of_month'] = (int) ($data['recurrence_day_of_month'] ?: $base->day);
                } catch(\Throwable $e) {
                    $dom = (int) ($data['recurrence_day_of_month'] ?: Carbon::today()->day);
                    $data['recurrence_day_of_month'] = max(1, min(31, $dom));
                }
            }
            // Ignore recurrence_end_date (leave null) to mean indefinitely active
            $data['recurrence_end_date'] = null;

            // For all recurrence types, ignore default start_date (task start will be the render day)
            $data['start_date'] = null;
            // If using due_in_days, drop legacy due_date to avoid ambiguity
            if (array_key_exists('due_in_days', $data) && $data['due_in_days'] !== null) {
                $data['due_date'] = null;
            } else {
                // Back-compat: ensure daily due_date is not before Start From date
                if (($data['recurrence_type'] ?? 'daily') === 'daily') {
                    if (!empty($data['due_date']) && !empty($data['recurrence_start_date'])) {
                        $recStart = \Carbon\Carbon::parse($data['recurrence_start_date'])->startOfDay();
                        $dueBase = \Carbon\Carbon::parse($data['due_date'])->startOfDay();
                        if ($dueBase->lt($recStart)) {
                            return response()->json([
                                'code' => 422,
                                'status' => 'error',
                                'message' => 'For daily schedules, due date cannot be before Start From date.',
                                'errors' => ['due_date' => ['Due date must be on or after Start From']],
                            ], 422);
                        }
                    }
                }
            }

            $schedule = Schedule::create($data);

            // Immediately generate today's task if the schedule is due now
            $this->maybeGenerateNow($schedule);

            DB::commit();

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'message' => 'Schedule created successfully',
                'data' => $schedule,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'code' => $e->getCode() ?: 500,
                'status' => 'error',
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }
}
