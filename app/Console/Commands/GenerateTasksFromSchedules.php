<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\TaskSchedule;
use App\Models\Task;
use App\Models\TaskAssignment;
use App\Models\Employee;
use App\Models\Notification;
use Carbon\Carbon;

class GenerateTasksFromSchedules extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'schedules:generate {--dry-run : Only show what would be generated} {--type= : Limit to recurrence type: daily, weekly, or monthly} {--lead-days=0 : Look ahead N days and generate schedules up to now + N days} {--to-end-of-month : Look ahead until the end of current month}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate Task records from active Schedules that are due, then advance their next run time.';

    public function handle()
    {
    $now = Carbon::now();
    $dryRun = (bool) $this->option('dry-run');
        $leadDays = max(0, (int) $this->option('lead-days'));
        $toEndOfMonth = (bool) $this->option('to-end-of-month');

        if ($toEndOfMonth) {
            // look ahead to the end of current month
            $windowEnd = $now->copy()->endOfMonth()->startOfDay();
        } else {
            $windowEnd = $now->copy()->addDays($leadDays);
        }
        $type = $this->option('type');
        if ($type !== null) {
            $type = strtolower(trim($type));
            if (!in_array($type, ['daily', 'weekly', 'monthly'], true)) {
                $this->error("Invalid --type value. Allowed: daily, weekly, monthly.");
                return Command::INVALID;
            }
        }

        // Fetch active schedules where next_run_at is due OR within lookahead window OR needs initialization
        $schedulesQuery = TaskSchedule::query()
            ->where('is_active', true)
            ->where(function ($q) use ($now, $windowEnd) {
                $q->whereNull('next_run_at')
                    ->orWhere('next_run_at', '<=', $windowEnd);
            })
            ->where(function ($q) {
                $q->whereNull('status')->orWhere('status', '!=', 'DELETED');
            });

        if ($type) {
            $schedulesQuery->where('recurrence_type', $type);
        }

        $schedules = $schedulesQuery->get();

        if ($schedules->isEmpty()) {
            $this->info('No schedules due.');
            return Command::SUCCESS;
        }

        $this->info('Processing ' . $schedules->count() . ' schedule(s)...');

        foreach ($schedules as $schedule) {
            \Log::info('[schedules:generate] Processing schedule', [
                'id' => $schedule->id,
                'next_run_at' => $schedule->next_run_at,
                'recurrence_type' => $schedule->recurrence_type,
            ]);
            try {
                DB::beginTransaction();

                // Determine the run time to use (initialize from recurrence_start_date if next_run_at is null and start_date is in the past or today)
                $runAt = $schedule->next_run_at ? Carbon::parse($schedule->next_run_at) : $this->calculateInitialRunAt($schedule, $now);

                if (!$runAt) {
                    \Log::info('[schedules:generate] Skip (no runAt)', ['id' => $schedule->id]);
                    DB::rollBack();
                    continue;
                }

                // Respect end date (treat recurrence_end_date as exclusive: when runAt >= end, do not run)
                if ($schedule->recurrence_end_date) {
                    $end = Carbon::parse($schedule->recurrence_end_date)->startOfDay();
                    if ($runAt->greaterThanOrEqualTo($end)) {
                        // At or past end (exclusive) -> deactivate
                        $schedule->is_active = false;
                        $schedule->save();
                        \Log::info('[schedules:generate] Deactivated at/after end date (exclusive)', ['id' => $schedule->id]);
                        DB::commit();
                        continue;
                    }
                }

                // Iterate occurrences up to window end (handles multiple occurrences inside lookahead)
                $firstPostWindow = null;
                while ($runAt && $runAt->lessThanOrEqualTo($windowEnd)) {
                    // If occurrence is in the future/past relative to now, it's still allowed (we're generating up to window end)
                    if ($dryRun) {
                        $this->line("[DRY] Would create task from schedule #{$schedule->id} for runAt {$runAt}");
                        \Log::info('[schedules:generate] DRY create', ['id' => $schedule->id, 'runAt' => $runAt]);
                    } else {
                        // Basic idempotency: skip if a task already exists for this schedule and start_date
                        $exists = Task::where('start_date', $runAt->toDateString())
                            ->where('title', $schedule->title)
                            ->exists();
                        if ($exists) {
                            \Log::info('[schedules:generate] Skip create - task exists', ['schedule_id' => $schedule->id, 'runAt' => $runAt]);
                        } else {
                            $task = $this->createTaskFromSchedule($schedule, $runAt);
                            $this->line("Created task #{$task->id} from schedule #{$schedule->id} for {$runAt->toDateString()}");
                            \Log::info('[schedules:generate] Created task', ['schedule_id' => $schedule->id, 'task_id' => $task->id]);
                        }
                    }

                    // compute next occurrence
                    $next = $this->calculateNextRunAt($schedule, $runAt);

                    // If we have an end date, and the computed next is at-or-after the end (exclusive), then deactivate instead of scheduling further runs
                    if ($schedule->recurrence_end_date && $next->greaterThanOrEqualTo(Carbon::parse($schedule->recurrence_end_date)->startOfDay())) {
                        $schedule->last_generated_at = $now;
                        $schedule->next_run_at = null;
                        $schedule->is_active = false;
                        $schedule->save();
                        \Log::info('[schedules:generate] Deactivated because next run reaches/exceeds end date', [
                            'id' => $schedule->id,
                            'next_run_at' => $schedule->next_run_at,
                            'last_generated_at' => $schedule->last_generated_at,
                        ]);
                        DB::commit();
                        continue 2; // move to next schedule
                    }

                    // move to next occurrence
                    $runAt = $next;
                    // remember the first occurrence after window to set as next_run_at later
                    if ($runAt && $runAt->greaterThan($windowEnd) && !$firstPostWindow) {
                        $firstPostWindow = $runAt->copy();
                    }
                }

                // If we've exited loop, set next_run_at to first occurrence after windowEnd (or keep existing behavior)
                if ($firstPostWindow) {
                    $schedule->last_generated_at = $now;
                    $schedule->next_run_at = $firstPostWindow->startOfDay();
                    $schedule->save();
                    \Log::info('[schedules:generate] Advanced schedule', [
                        'id' => $schedule->id,
                        'next_run_at' => $schedule->next_run_at,
                        'last_generated_at' => $schedule->last_generated_at,
                    ]);
                }

                DB::commit();
            } catch (\Throwable $e) {
                DB::rollBack();
                $this->error("Failed processing schedule #{$schedule->id}: " . $e->getMessage());
                \Log::error('[schedules:generate] Exception', [
                    'id' => $schedule->id,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
            }
        }

        return Command::SUCCESS;
    }

    private function calculateInitialRunAt(TaskSchedule $s, Carbon $now): ?Carbon
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
                // Candidate is the nearest occurrence on or after base: try this month first
                $candidate = $this->safeMonthlyDate($base->year, $base->month, $dom, $base);
                if ($candidate->lt($now->copy()->startOfDay())) {
                    // move to next month
                    $nextMonth = $base->copy()->addMonthNoOverflow();
                    $candidate = $this->safeMonthlyDate($nextMonth->year, $nextMonth->month, $dom, $base);
                }
                return $candidate->startOfDay();
            case 'daily':
            default:
                // Start from provided start or tomorrow
                $candidate = $start ? $start->startOfDay() : $now->copy()->addDay()->startOfDay();
                if ($candidate->lte($now->copy()->startOfDay())) {
                    $candidate = $now->copy()->addDay()->startOfDay();
                }
                // If schedule disables weekends and candidate falls on weekend, advance to next non-weekend
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

    private function calculateNextRunAt(TaskSchedule $s, Carbon $current): Carbon
    {
        $interval = max((int) $s->recurrence_interval, 1);
        $next = $current->copy();

        switch ($s->recurrence_type) {
            case 'weekly':
                // Add N weeks and align to selected DOW
                $next->addWeeks($interval);
                $dow = (int) ($s->recurrence_day_of_week ?? $next->dayOfWeek);
                // Ensure day of week matches after adding weeks
                while ((int) $next->dayOfWeek !== $dow) {
                    $next->addDay();
                }
                return $next->startOfDay();
        case 'monthly':
            // Add N months and clamp to chosen DOM. Keep the same day of month (or clamp to last day if month too short).
            $dom = (int) ($s->recurrence_day_of_month ?? $current->day);
            $next->addMonthsNoOverflow($interval);
            return $this->safeMonthlyDate($next->year, $next->month, $dom, $next)->startOfDay();
            case 'daily':
            default:
                // move forward by interval days, but respect allowed weekdays if provided
                $candidate = $next->copy();
                $tries = 0;
                do {
                    $candidate->addDay();
                    $tries++;
                } while ($tries < 366 && $candidate->diffInDays($next, false) < $interval);

                // After moving at least interval days forward, ensure weekday is allowed and weekends respected
                $allowed = null;
                if (!empty($s->recurrence_days_of_week) && is_array($s->recurrence_days_of_week)) {
                    $allowed = array_map('intval', $s->recurrence_days_of_week);
                }
                $safety = 0;
                while (true) {
                    $dow = (int)$candidate->dayOfWeek;
                    if (!is_null($allowed) && !in_array($dow, $allowed, true)) {
                        $candidate->addDay();
                    } else {
                        break;
                    }
                    $safety++; if ($safety > 366) break;
                }
                return $candidate->startOfDay();
        }
    }

    private function safeMonthlyDate(int $year, int $month, int $dom, Carbon $fallback): Carbon
    {
        // If the month has fewer days than DOM (e.g., Feb 30), clamp to the last day of month
        $lastDay = Carbon::createFromDate($year, $month, 1)->endOfMonth()->day;
        $day = min(max($dom, 1), $lastDay);
        return Carbon::create($year, $month, $day, 0, 0, 0);
    }

    private function createTaskFromSchedule(TaskSchedule $s, Carbon $runAt = null): Task
    {
        // Copy image to task directory if present
        $taskImage = null;
        if (!empty($s->image)) {
            $src = public_path('file/schedule/' . $s->image);
            if (is_file($src)) {
                $ext = pathinfo($s->image, PATHINFO_EXTENSION);
                $new = 'TASK_FROM_SCHEDULE_' . time() . '.' . $ext;
                $dest = public_path('file/task/' . $new);
                @copy($src, $dest);
                $taskImage = $new;
            }
        }

        // Copy reference files into task directory if present
        $taskRefFiles = [];
        $srcFiles = is_array($s->reference_files) ? $s->reference_files : [];
        foreach ($srcFiles as $idx => $fname) {
            $src = public_path('file/schedule_reference_files/' . $fname);
            if (is_file($src)) {
                $ext = pathinfo($fname, PATHINFO_EXTENSION);
                $new = 'TASK_FROM_SCHEDULE_' . time() . '_' . $idx . '.' . $ext;
                $dest = public_path('file/task_refe rence_files/' . $new);
                @copy($src, $dest);
                $taskRefFiles[] = $new;
            }
        }

        // Compute dates: start = run day (the $runAt passed from generator);
        // due = start + due_in_days if provided; else try to compute offset from configured recurrence_start_date->due_date mapping; fallback to run day.
        $runDay = $runAt ? $runAt->toDateString() : Carbon::now()->toDateString();
        $startDate = $runDay;
        if (!is_null($s->due_in_days)) {
            $dueDate = Carbon::parse($runDay)->addDays((int) $s->due_in_days)->toDateString();
        } else if ($s->recurrence_type === 'daily' && $s->due_date && $s->recurrence_start_date) {
            try {
                $base = Carbon::parse($s->recurrence_start_date)->startOfDay();
                $configuredDue = Carbon::parse($s->due_date)->startOfDay();
                $offsetDays = $base->diffInDays($configuredDue, false);
                $dueDate = Carbon::parse($runDay)->addDays(max(0, $offsetDays))->toDateString();
            } catch (\Throwable $e) {
                $dueDate = $runDay;
            }
        } else {
            $dueDate = $s->due_date ?: $runDay;
        }

        // Build task payload mirroring relevant fields
        $data = [
            'project_id' => $s->project_id, // may be null
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
        ];

    $task = Task::create($data);

        // Create PIC assignment from schedule creator if has employee (auto-accept like Add Task modal)
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

        // Create EXECUTOR assignments from schedule.executor_ids
        $executors = is_array($s->executor_ids) ? $s->executor_ids : [];
        foreach ($executors as $eid) {
            // skip if same as PIC
            if ($picEmployee && (int) $eid === (int) $picEmployee->id) {
                continue;
            }
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

            // Notify executor about the new assignment (same semantics as manual task creation)
            try {
                $creatorEmployeeId = $picEmployee ? $picEmployee->id : null; // Notification.created_by expects employee_id
                $title = 'New Task Assignment';
                $message = 'You have been assigned to task "' . ($s->title ?? 'Task') . '"';
                // Keep Task ID trace for mark-as-read filter compatibility
                $messageWithId = $message . ' [Task ID: ' . $task->id . ']';
                Notification::create([
                    'employee_id' => $eid,
                    'type' => 'task_assignment',
                    'title' => $title,
                    'message' => $messageWithId,
                    'sent_at' => now(),
                    'is_read' => false,
                    'created_by' => $creatorEmployeeId,
                    'updated_by' => $creatorEmployeeId,
                ]);
            } catch (\Throwable $e) {
                // Log but don't fail the task creation
                \Log::warning('Failed to create notification for executor ' . $eid . ' of task #' . $task->id . ': ' . $e->getMessage());
            }
        }

        // Note: Do not notify PIC/creator; only executors receive assignment notifications

        return $task;
    }
}
