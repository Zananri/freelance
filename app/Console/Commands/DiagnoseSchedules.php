<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\TaskSchedule;
use Carbon\Carbon;

class DiagnoseSchedules extends Command
{
    protected $signature = 'schedules:diagnose {--id=* : Limit to specific schedule id(s)} {--json : Output JSON only}';
    protected $description = 'Diagnose why schedules have or have not generated tasks (shows due status, computed next run, reasons).';

    public function handle(): int
    {
        $now = Carbon::now();
        $ids = $this->option('id');
    $query = TaskSchedule::query();
        if (!empty($ids)) { $query->whereIn('id', $ids); }
        $schedules = $query->orderBy('id')->get();
        $rows = [];

        foreach ($schedules as $s) {
            $analysis = $this->analyze($s, $now);
            $rows[] = $analysis;
        }

        if ($this->option('json')) {
            $this->line(json_encode([
                'now' => $now->toDateTimeString(),
                'timezone' => config('app.timezone'),
                'schedules' => $rows,
            ], JSON_PRETTY_PRINT));
            return Command::SUCCESS;
        }

        $this->info('Now: '.$now.' TZ: '.config('app.timezone'));
        if ($rows) {
            $this->table([
                'ID','Active','Type','Start','Rec Day (W/M)','Interval','Next Run At','Last Gen','Due Now?','Reason'
            ], array_map(function($r){
                return [
                    $r['id'],
                    $r['is_active'] ? 'Y' : 'N',
                    $r['recurrence_type'],
                    $r['recurrence_start_date'] ?? '-',
                    $r['recurrence_day'] ?? '-',
                    $r['recurrence_interval'],
                    $r['next_run_at'] ?? '-',
                    $r['last_generated_at'] ?? '-',
                    $r['due_now'] ? 'YES' : 'NO',
                    $r['reason']
                ];
            }, $rows));
        } else {
            $this->warn('No schedules found.');
        }
        $this->line('Tip: Add system cron: * * * * * php artisan schedule:run');
        return Command::SUCCESS;
    }

    private function analyze(TaskSchedule $s, Carbon $now): array
    {
        $reason = [];
        $dueNow = false;
        $nextRun = $s->next_run_at; // already cast to Carbon|null
        $start = $s->recurrence_start_date ? $s->recurrence_start_date->copy()->startOfDay() : $now->copy()->startOfDay();
        $today = $now->copy()->startOfDay();

        if (!$s->is_active) { $reason[] = 'Inactive'; }

        if ($nextRun === null) {
            $reason[] = 'next_run_at NULL (generator will initialize)';
        } else {
            if ($nextRun->greaterThan($now)) { $reason[] = 'next_run_at in future'; }
        }

        // Determine if today matches recurrence
        switch ($s->recurrence_type) {
            case 'weekly':
                $dow = (int)($s->recurrence_day_of_week ?? $start->dayOfWeek); // 0=Sun
                $dueToday = ((int)$today->dayOfWeek === $dow);
                $recDay = 'DOW='.$dow; break;
            case 'monthly':
                $dom = (int)($s->recurrence_day_of_month ?? $start->day);
                $dueToday = ((int)$today->day === $dom);
                $recDay = 'DOM='.$dom; break;
            case 'daily':
            default:
                $dueToday = true; $recDay = '-'; break;
        }

        if ($today->lt($start)) { $reason[] = 'Before start date'; $dueToday = false; }

        // Compute if generator SHOULD create now (mirrors command logic)
        if ($s->is_active && $dueToday) {
            if ($nextRun === null || $nextRun->lessThanOrEqualTo($now)) {
                $dueNow = true; $reason[] = 'Due';
            }
        }

        if (!$dueNow && empty($reason)) { $reason[] = 'Not due yet'; }

        return [
            'id' => $s->id,
            'is_active' => (bool)$s->is_active,
            'recurrence_type' => $s->recurrence_type,
            'recurrence_start_date' => $s->recurrence_start_date?->toDateString(),
            'recurrence_day' => $recDay,
            'recurrence_interval' => $s->recurrence_interval,
            'next_run_at' => $nextRun?->toDateTimeString(),
            'last_generated_at' => $s->last_generated_at?->toDateTimeString(),
            'due_now' => $dueNow,
            'reason' => implode('; ', $reason),
        ];
    }
}
