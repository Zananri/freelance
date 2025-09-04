<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use App\Models\Schedule;

class ScheduleController extends Controller
{
    public function index(Request $request)
    {
        $schedules = Schedule::orderByDesc('created_at')->paginate(10);
        return response()->json([
            'code' => 200,
            'status' => 'success',
            'data' => $schedules,
        ]);
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
                'start_date' => 'required|date',
                'due_date' => 'required|date|after_or_equal:start_date',
                'complete_date' => 'nullable|date|after_or_equal:start_date',
                // Recurrence
                'recurrence_type' => 'required|in:daily,weekly,monthly',
                'recurrence_interval' => 'nullable|integer|min:1',
                'recurrence_day_of_week' => 'required_if:recurrence_type,weekly|nullable|integer|min:0|max:6',
                'recurrence_day_of_month' => 'required_if:recurrence_type,monthly|nullable|integer|min:1|max:31',
                'recurrence_start_date' => 'required|date',
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
            // Interval is fixed as 1 from UI point of view; default to 1 if missing
            $data['recurrence_interval'] = 1;
            if ($data['recurrence_type'] !== 'weekly') $data['recurrence_day_of_week'] = null;
            if ($data['recurrence_type'] !== 'monthly') $data['recurrence_day_of_month'] = null;

            $schedule = Schedule::create($data);

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
