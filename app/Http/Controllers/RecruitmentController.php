<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Response;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use App\Models\ScheduleRecruitment;
use Carbon\Carbon;
use App\Models\Employee;
use App\Models\Job;
use App\Models\Candidate;
use App\Exports\RecruitmentExport;
use Maatwebsite\Excel\Facades\Excel;

class RecruitmentController extends Controller
{
    public function showRecruitmentPage(Request $request)
    {
        [$startDate, $endDate] = $this->resolveDateRange($request);
        [$isSuper, $deptId] = $this->resolveAuthContext($request);

        $percentages = $this->buildPercentageComparisons($isSuper, $deptId);

        $total_applicants = Candidate::whereBetween('created_at', [$startDate, $endDate])
            ->count();

        return view(
            'recruitment.recruitment',
            compact('percentages', 'total_applicants')
        );
    }

    public function getRecruitmentData(Request $request): JsonResponse
    {
        [$startDate, $endDate] = $this->resolveDateRange($request);
        [$isSuper, $deptId] = $this->resolveAuthContext($request);

        $data = $this->buildDashboardData($startDate, $endDate, $isSuper, $deptId);

        return response()->json($data);
    }

    public function jobOptions(): JsonResponse
    {
        return response()->json(Job::select('id', 'job_name')->orderBy('job_name')->get());
    }

    public function candidateIndex(Request $request): JsonResponse
    {
        $query = Candidate::with('job:id,job_name');

        if ($status = $request->query('status')) {
            $query->where('status', Candidate::toDatabaseStatus($status));
        }

        return response()->json(
            $query->orderByDesc('created_at')->get()
        );
    }

    public function candidateShow(Candidate $candidate): JsonResponse
    {
        return response()->json($candidate);
    }

    public function candidateStore(Request $request): JsonResponse
    {
        $validated = $this->validateCandidate($request);
        $validated['gender'] = $validated['gender'] ?? 'male';
        $validated['experience_years'] = $validated['experience_years'] ?? 0;

        $candidate = Candidate::create($validated);

        return response()->json(['message' => 'Candidate created', 'data' => $candidate], 201);
    }

    public function candidateUpdate(Request $request, Candidate $candidate): JsonResponse
    {
        $validated = $this->validateCandidate($request);
        $validated['gender'] = $validated['gender'] ?? ($candidate->gender ?: 'male');
        $validated['experience_years'] = $validated['experience_years'] ?? 0;

        $candidate->update($validated);

        return response()->json(['message' => 'Candidate updated', 'data' => $candidate]);
    }

    public function candidateDestroy(Candidate $candidate): JsonResponse
    {
        $candidate->delete();

        return response()->json(['message' => 'Candidate deleted']);
    }

    public function scheduleIndex(Request $request): JsonResponse
    {
        $query = ScheduleRecruitment::with(['candidate:id,candidates_name,job_id,position', 'candidate.job:id,job_name']);

        if ($candidateId = $request->query('candidate_id')) {
            $query->where('candidate_id', $candidateId);
        }

        return response()->json($query->orderBy('time_start')->get());
    }

    public function scheduleShow(ScheduleRecruitment $schedule): JsonResponse
    {
        return response()->json($schedule->load(['candidate:id,candidates_name,job_id,position', 'candidate.job:id,job_name']));
    }

    public function scheduleStore(Request $request): JsonResponse
    {
        $validated = $this->validateSchedule($request);

        $schedule = ScheduleRecruitment::create($validated);

        return response()->json(['message' => 'Schedule created', 'data' => $schedule], 201);
    }

    public function scheduleUpdate(Request $request, ScheduleRecruitment $schedule): JsonResponse
    {
        $validated = $this->validateSchedule($request);

        $schedule->update($validated);

        return response()->json(['message' => 'Schedule updated', 'data' => $schedule]);
    }

    public function scheduleDestroy(ScheduleRecruitment $schedule): JsonResponse
    {
        $schedule->delete();

        return response()->json(['message' => 'Schedule deleted']);
    }

    public function scheduleCalendar(Request $request): JsonResponse
    {
        $year = (int) $request->query('year', now()->year);
        $month = (int) $request->query('month', now()->month);

        [$isSuper, $deptId] = $this->resolveAuthContext($request);

        $schedules = $this->scheduleQuery($isSuper, $deptId)
            ->with(['candidate:id,candidates_name,job_id,position', 'candidate.job:id,job_name'])
            ->whereYear('time_start', $year)
            ->whereMonth('time_start', $month)
            ->orderBy('time_start')
            ->get();

        $counts = $schedules
            ->groupBy(fn($schedule) => Carbon::parse($schedule->time_start)->format('Y-m-d'))
            ->map(fn($group) => $group->count());

        return response()->json([
            'year' => $year,
            'month' => $month,
            'schedules' => $schedules,
            'counts' => $counts,
        ]);
    }

    public function exportRecruitment(Request $request)
    {
        [$startDate, $endDate] = $this->resolveDateRange($request);
        [$isSuper, $deptId] = $this->resolveAuthContext($request);

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Recruitment Report');

        $lastColumn = 'G';

        // Report title
        $sheet->setCellValue('A1', 'Recruitment Report');
        $sheet->mergeCells("A1:{$lastColumn}1");
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(16);

        $sheet->setCellValue('A2', sprintf(
            'Period : %s - %s',
            $startDate->format('d M Y'),
            $endDate->format('d M Y')
        ));
        $sheet->mergeCells("A2:{$lastColumn}2");
        $sheet->getStyle('A2')->getFont()->setItalic(true)->setSize(11);
        $sheet->getStyle('A2')->getFont()->getColor()->setRGB('666666');

        $sheet->setCellValue('A3', 'Generated at : ' . Carbon::now()->format('d M Y H:i'));
        $sheet->mergeCells("A3:{$lastColumn}3");
        $sheet->getStyle('A3')->getFont()->setSize(9);
        $sheet->getStyle('A3')->getFont()->getColor()->setRGB('999999');

        $headerRow = 5;
        $headers = ['No', 'Candidate', 'Position', 'Status', 'Schedule Type', 'Schedule Date', 'Location'];
        $columns = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

        foreach ($headers as $index => $label) {
            $sheet->setCellValue($columns[$index] . $headerRow, $label);
        }

        $headerRange = "A{$headerRow}:{$lastColumn}{$headerRow}";
        $sheet->getStyle($headerRange)->getFont()->setBold(true)->getColor()->setRGB('FFFFFF');
        $sheet->getStyle($headerRange)->getFill()
            ->setFillType(Fill::FILL_SOLID)
            ->getStartColor()->setRGB('179BFF');
        $sheet->getStyle($headerRange)->getAlignment()
            ->setHorizontal(Alignment::HORIZONTAL_CENTER)
            ->setVertical(Alignment::VERTICAL_CENTER);
        $sheet->getStyle($headerRange)->getBorders()->getAllBorders()
            ->setBorderStyle(Border::BORDER_THIN);

        $candidatesQuery = Candidate::with(['job', 'scheduleRecruitments'])
            ->whereBetween('created_at', [$startDate, $endDate]);

        if (! $isSuper && $deptId) {
            $this->scopeToDepartment($candidatesQuery, $deptId);
        }

        $candidates = $candidatesQuery->orderByDesc('created_at')->get();

        $row = $headerRow + 1;
        $no = 1;

        foreach ($candidates as $candidate) {

            $schedule = $candidate->scheduleRecruitments->first();

            $sheet->setCellValue('A' . $row, $no);
            $sheet->setCellValue('B' . $row, $candidate->candidates_name);
            $sheet->setCellValue('C' . $row, $candidate->position ?: (optional($candidate->job)->job_name ?? '-'));
            $sheet->setCellValue('D' . $row, $candidate->status);
            $sheet->setCellValue('E' . $row, optional($schedule)->schedule_type ?? '-');
            $sheet->setCellValue(
                'F' . $row,
                optional($schedule)->time_start ? Carbon::parse($schedule->time_start)->format('d M Y H:i') : '-'
            );
            $sheet->setCellValue('G' . $row, optional($schedule)->location ?? '-');

            $sheet->getStyle("A{$row}:{$lastColumn}{$row}")->getBorders()->getAllBorders()
                ->setBorderStyle(Border::BORDER_THIN);

            $row++;
            $no++;
        }

        if ($candidates->isEmpty()) {
            $sheet->setCellValue('A' . $row, 'No data found for the selected date range.');
            $sheet->mergeCells("A{$row}:{$lastColumn}{$row}");
            $sheet->getStyle("A{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("A{$row}")->getFont()->setItalic(true)->getColor()->setRGB('999999');
        }

        foreach ($columns as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }

        $writer = new Xlsx($spreadsheet);

        $fileName = sprintf(
            'Recruitment_Report_%s_%s.xlsx',
            $startDate->format('Ymd'),
            $endDate->format('Ymd')
        );
        $tempFile = tempnam(sys_get_temp_dir(), 'recruitment');

        $writer->save($tempFile);

        return response()->download($tempFile, $fileName)->deleteFileAfterSend(true);
    }

    private function validateCandidate(Request $request): array
    {
        return $request->validate([
            'job_id' => 'nullable|exists:job_list,id',
            'position' => 'required|string|max:255',

            'candidates_name' => 'required|string|max:255',
            'candidates_email' => 'required|email|max:255',
            'candidates_phone' => 'nullable|string|max:20',
            'candidates_address' => 'nullable|string',

            'gender' => 'nullable|in:male,female',

            'candidates_birthdate' => 'nullable|date',

            'last_education' => 'nullable|string|max:100',

            'experience_years' => 'nullable|integer|min:0',

            'expected_salary' => 'nullable|numeric',

            'source' => 'nullable|string|max:255',

            'status' => 'required|in:' . implode(',', Candidate::STATUSES),
        ]);
    }

    private function validateSchedule(Request $request): array
    {
        return $request->validate([
            'candidate_id' => 'required|exists:candidates,id',
            'schedule_type' => 'required|string|max:100',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'location' => 'nullable|string|max:255',
            'time_start' => 'required|date',
            'time_end' => 'required|date|after_or_equal:time_start',
            'meeting_link' => 'nullable|string|max:255',
        ]);
    }

    private function resolveDateRange(Request $request): array
    {
        $start = $request->query('start_date');
        $end = $request->query('end_date');

        if ($start && $end) {
            try {
                return [
                    Carbon::parse($start)->startOfDay(),
                    Carbon::parse($end)->endOfDay(),
                ];
            } catch (\Exception $e) {
                //
            }
        }

        return [
            Carbon::now()->startOfMonth()->startOfDay(),
            Carbon::now()->endOfDay(),
        ];
    }

    private function resolveAuthContext(Request $request): array
    {
        $authUser = $request->user();
        $userType = strtoupper((string) ($authUser->user_type ?? ''));
        $deptId = $authUser->employee->department_id ?? null;

        return [$userType === 'SUPERADMIN', $deptId];
    }

    private function buildDashboardData(Carbon $startDate, Carbon $endDate, bool $isSuper, ?int $deptId): array
    {
        $schedules = ScheduleRecruitment::with(['candidate:id,candidates_name,job_id,position', 'candidate.job:id,job_name'])
            ->whereBetween('time_start', [$startDate, $endDate])
            ->orderBy('time_start')
            ->get();

        $totalEmployees = $this->employeeQuery($isSuper, $deptId)->count();

        $year = $startDate->year;
        $employeesByMonth = [];
        $hiredByMonth = [];
        $applicantsByMonth = [];
        $schedulesByMonth = [];

        for ($month = 1; $month <= 12; $month++) {
            $employeesByMonth[] = $this->employeeQuery($isSuper, $deptId)
                ->whereYear('created_at', $year)
                ->whereMonth('created_at', $month)
                ->count();

            $hiredByMonth[] = $this->hiredQuery($isSuper, $deptId)
                ->whereYear('updated_at', $year)
                ->whereMonth('updated_at', $month)
                ->count();

            $applicantsByMonth[] = $this->applicantQuery($isSuper, $deptId, $year, $month)->count();

            $schedulesByMonth[] = $this->scheduleQuery($isSuper, $deptId)
                ->whereYear('time_start', $year)
                ->whereMonth('time_start', $month)
                ->count();
        }

        [$overviewLabels, $overviewData] = $this->buildOverviewSeries($startDate, $endDate, $isSuper, $deptId);

        $pipelineStatuses = Candidate::STATUSES;
        $pipelineCounts = [];
        $pipelineCandidates = [];

        foreach ($pipelineStatuses as $status) {
            $query = $this->candidateStatusQuery($status, $isSuper, $deptId)
                ->whereBetween('created_at', [$startDate, $endDate]);
            $pipelineCounts[$status] = (clone $query)->count();
            $pipelineCandidates[$status] = (clone $query)
                ->with('job:id,job_name')
                ->orderByDesc('created_at')
                ->limit(50)
                ->get()
                ->map(fn($candidate) => [
                    'id' => $candidate->id,
                    'candidate_name' => $candidate->candidates_name,
                    'position' => $candidate->position ?: (optional($candidate->job)->job_name ?? '-'),
                ]);
        }

        $totalApplicants = Candidate::whereBetween('created_at', [$startDate, $endDate]);

        if (! $isSuper && $deptId) {
            $this->scopeToDepartment($totalApplicants, $deptId);
        }

        $totalApplicants = $totalApplicants->count();
        $totalNewApplicants = array_sum($overviewData);

        $percentages = $this->buildPercentageComparisons($isSuper, $deptId);

        return [
            'schedules' => $schedules,
            'totalEmployees' => $totalEmployees,
            'total_applicants' => $totalApplicants,
            'total_new_applicants' => $totalNewApplicants,
            'chart_employees' => $employeesByMonth,
            'chart_positions' => $hiredByMonth,
            'chart_applicants' => $applicantsByMonth,
            'chart_schedules' => $schedulesByMonth,
            'overview_labels' => $overviewLabels,
            'overview_data' => $overviewData,
            'pipeline_statuses' => $pipelineStatuses,
            'pipeline_counts' => $pipelineCounts,
            'pipeline_candidates' => $pipelineCandidates,
            'percentages' => $percentages,

            'selected_start' => $startDate->toDateString(),
            'selected_end' => $endDate->toDateString(),
        ];
    }

    private function buildPercentageComparisons(bool $isSuper, ?int $deptId): array
    {
        $now = Carbon::now();
        $curMonth = $now->month;
        $curYear = $now->year;

        $prev = $now->copy()->subMonthNoOverflow();
        $prevMonth = $prev->month;
        $prevYear = $prev->year;

        $employeesCurrent = $this->employeeQuery($isSuper, $deptId)
            ->whereYear('created_at', $curYear)->whereMonth('created_at', $curMonth)->count();
        $employeesPrevious = $this->employeeQuery($isSuper, $deptId)
            ->whereYear('created_at', $prevYear)->whereMonth('created_at', $prevMonth)->count();

        $hiredCurrent = $this->hiredQuery($isSuper, $deptId)
            ->whereYear('updated_at', $curYear)->whereMonth('updated_at', $curMonth)->count();
        $hiredPrevious = $this->hiredQuery($isSuper, $deptId)
            ->whereYear('updated_at', $prevYear)->whereMonth('updated_at', $prevMonth)->count();

        $applicantsCurrent = $this->applicantQuery($isSuper, $deptId, $curYear, $curMonth)->count();
        $applicantsPrevious = $this->applicantQuery($isSuper, $deptId, $prevYear, $prevMonth)->count();

        $schedulesCurrent = $this->scheduleQuery($isSuper, $deptId)
            ->whereYear('time_start', $curYear)->whereMonth('time_start', $curMonth)->count();
        $schedulesPrevious = $this->scheduleQuery($isSuper, $deptId)
            ->whereYear('time_start', $prevYear)->whereMonth('time_start', $prevMonth)->count();

        return [
            'employees' => $this->calculatePercentage($employeesCurrent, $employeesPrevious),
            'hired' => $this->calculatePercentage($hiredCurrent, $hiredPrevious),
            'applicants' => $this->calculatePercentage($applicantsCurrent, $applicantsPrevious),
            'schedules' => $this->calculatePercentage($schedulesCurrent, $schedulesPrevious),
        ];
    }

    private function calculatePercentage(int $current, int $previous): array
    {
        if ($previous === 0) {
            $value = $current > 0 ? 100.0 : 0.0;
        } else {
            $value = (($current - $previous) / $previous) * 100;
        }

        if ($value > 0) {
            $direction = 'up';
        } elseif ($value < 0) {
            $direction = 'down';
        } else {
            $direction = 'flat';
        }

        return [
            'value' => round(abs($value), 1),
            'direction' => $direction,
        ];
    }

    private function buildOverviewSeries(Carbon $startDate, Carbon $endDate, bool $isSuper, ?int $deptId): array
    {
        $labels = [];
        $data = [];

        for ($date = $startDate->copy()->startOfDay(); $date->lte($endDate->copy()->startOfDay()); $date->addDay()) {

            $labels[] = $date->format('d M');

            $query = Candidate::whereDate('created_at', $date);

            if (! $isSuper && $deptId) {
                $this->scopeToDepartment($query, $deptId);
            }

            $data[] = $query->count();
        }

        return [$labels, $data];
    }

    private function employeeQuery(bool $isSuper, ?int $deptId)
    {
        $query = Employee::whereHas('user', fn($q) => $q->where('user_type', '<>', 'ADMINISTRATOR'));

        if (! $isSuper && $deptId) {
            $query->where('department_id', $deptId);
        }

        return $query;
    }

    private function scheduleQuery(bool $isSuper, ?int $deptId)
    {
        $query = ScheduleRecruitment::query();

        if (! $isSuper && $deptId) {
            $query->whereHas('candidate.job', fn($q) => $q->where('department_id', $deptId));
        }

        return $query;
    }

    private function candidateStatusQuery(string $status, bool $isSuper, ?int $deptId)
    {
        $query = Candidate::where('status', Candidate::toDatabaseStatus($status));

        if (! $isSuper && $deptId) {
            $this->scopeToDepartment($query, $deptId);
        }

        return $query;
    }

    private function hiredQuery(bool $isSuper, ?int $deptId)
    {
        return $this->candidateStatusQuery('Hired', $isSuper, $deptId);
    }

    private function applicantQuery(bool $isSuper, ?int $deptId, int $year, int $month)
    {
        $query = Candidate::whereYear('created_at', $year)->whereMonth('created_at', $month);

        if (! $isSuper && $deptId) {
            $query->whereHas('job', fn($q) => $q->where('department_id', $deptId));
        }

        return $query;
    }

    private function scopeToDepartment($query, int $deptId): void
    {
        $query->whereHas('job', fn($q) => $q->where('department_id', $deptId));
    }
}
