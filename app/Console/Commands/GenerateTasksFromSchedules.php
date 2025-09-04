<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\Schedule;
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
    protected $signature = 'schedules:generate {--dry-run : Only show what would be generated}';

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

        // Fetch active schedules where next_run_at is due OR needs initialization
        $schedules = Schedule::query()
            ->where('is_active', true)
            ->where(function ($q) use ($now) {
                $q->whereNull('next_run_at')
                  ->orWhere('next_run_at', '<=', $now);
            })
            ->get();

        if ($schedules->isEmpty()) {
            $this->info('No schedules due.');
            return Command::SUCCESS;
        }

        $this->info('Processing ' . $schedules->count() . ' schedule(s)...');

        foreach ($schedules as $schedule) {
            try {
                DB::beginTransaction();

                // Determine the run time to use (initialize from recurrence_start_date if next_run_at is null and start_date is in the past or today)
                $runAt = $schedule->next_run_at ? Carbon::parse($schedule->next_run_at) : null;
                if (!$runAt) {
                    // Initialize based on recurrence settings
                    $runAt = $this->calculateInitialRunAt($schedule, $now);
                }

                if (!$runAt) {
                    // Nothing to run yet
                    DB::rollBack();
                    continue;
                }

                // Respect end date
                if ($schedule->recurrence_end_date) {
                    $end = Carbon::parse($schedule->recurrence_end_date)->endOfDay();
                    if ($runAt->greaterThan($end)) {
                        // Past end; deactivate
                        $schedule->is_active = false;
                        $schedule->save();
                        DB::commit();
                        continue;
                    }
                }

                // If due now or in the past, generate the task
                if ($runAt->lessThanOrEqualTo($now)) {
                    if ($dryRun) {
                        $this->line("[DRY] Would create task from schedule #{$schedule->id} for runAt {$runAt}");
                    } else {
                        $task = $this->createTaskFromSchedule($schedule);
                        $this->line("Created task #{$task->id} from schedule #{$schedule->id}");
                    }

                    // Advance next_run_at
                    $next = $this->calculateNextRunAt($schedule, $runAt);
                    $schedule->last_generated_at = $now;
                    $schedule->next_run_at = $next;
                    $schedule->save();
                }

                DB::commit();
            } catch (\Throwable $e) {
                DB::rollBack();
                $this->error("Failed processing schedule #{$schedule->id}: " . $e->getMessage());
            }
        }

        return Command::SUCCESS;
    }

    private function calculateInitialRunAt(Schedule $s, Carbon $now): ?Carbon
    {
        // Default to start date if set and in the future or today; otherwise bring it forward to the next valid occurrence
        $start = $s->recurrence_start_date ? Carbon::parse($s->recurrence_start_date)->startOfDay() : $now->copy()->startOfDay();

        switch ($s->recurrence_type) {
            case 'weekly':
                $dow = is_null($s->recurrence_day_of_week) ? (int) $start->dayOfWeek : (int) $s->recurrence_day_of_week; // 0=Sun
                $candidate = $start->copy();
                // Move to the next matching DOW
                while ((int) $candidate->dayOfWeek !== $dow) {
                    $candidate->addDay();
                }
                return $candidate;
            case 'monthly':
                $dom = (int) ($s->recurrence_day_of_month ?: $start->day);
                return $this->safeMonthlyDate($start->year, $start->month, $dom, $start);
            case 'daily':
            default:
                return $start;
        }
    }

    private function calculateNextRunAt(Schedule $s, Carbon $current): Carbon
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
                // Add N months and clamp to chosen DOM
                $dom = (int) ($s->recurrence_day_of_month ?? $current->day);
                $next->addMonthsNoOverflow($interval);
                return $this->safeMonthlyDate($next->year, $next->month, $dom, $next);
            case 'daily':
            default:
                return $next->addDays($interval)->startOfDay();
        }
    }

    private function safeMonthlyDate(int $year, int $month, int $dom, Carbon $fallback): Carbon
    {
        // If the month has fewer days than DOM (e.g., Feb 30), clamp to the last day of month
        $lastDay = Carbon::createFromDate($year, $month, 1)->endOfMonth()->day;
        $day = min(max($dom, 1), $lastDay);
        return Carbon::create($year, $month, $day, 0, 0, 0);
    }

    private function createTaskFromSchedule(Schedule $s): Task
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
                $dest = public_path('file/task_reference_files/' . $new);
                @copy($src, $dest);
                $taskRefFiles[] = $new;
            }
        }

        // Compute dates: for daily schedules, start/due = run day; for others, use defaults
        $today = Carbon::now()->toDateString();
        $isDaily = ($s->recurrence_type === 'daily');
        $startDate = $isDaily ? $today : $s->start_date;
        $dueDate = $isDaily ? $today : $s->due_date;

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

        // Create PIC assignment from schedule creator if has employee
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

        return $task;
    }
}
