<?php

namespace App\Http\Controllers;

use App\Models\Job;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class JobController extends Controller
{
      public function showJobPage()
    {
        return view('master/job/job');
    }

    public function index(Request $request)
    {
        $query = $request->input('query');
        $status = $request->input('status');
        $departmentId = $request->input('department_id');
        $divisionId = $request->input('division_id');

        $jobsQuery = Job::with(['department', 'division']);

        if ($query) {
            $jobsQuery->where('job_name', 'like', '%' . $query . '%');
        }

        if ($status) {
            if ($status === 'ALL') {
                $jobsQuery->where('status', '!=', 'DELETED');
            } else {
                $jobsQuery->where('status', $status);
            }
        } else {
            $jobsQuery->where('status', '!=', 'DELETED');
        }

        if ($departmentId) {
            $jobsQuery->where('department_id', $departmentId);
        }

        if ($divisionId) {
            $jobsQuery->where('division_id', $divisionId);
        }

        $jobs = $jobsQuery->get();

        return response()->json(['data' => $jobs]);
    }

    public function show($id)
    {
        $job = Job::with(['department', 'division'])->find($id);
        if (!$job) {
            return response()->json(['message' => 'Job not found'], 404);
        }
        return response()->json($job);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'department_id' => 'required|exists:departments,id',
            'division_id' => 'required|exists:divisions,id',
            'job_name' => 'required|string|max:255',
            'status' => 'required|string|in:ACTIVE,INACTIVE,DELETED',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $job = Job::create([
            'department_id' => $request->department_id,
            'division_id' => $request->division_id,
            'job_name' => $request->job_name,
            'status' => $request->status,
            'description' => $request->description,
            'created_by' => 1,
            'updated_by' => 1,
            'deleted_by' => 1,
        ]);

        return response()->json(['message' => 'Job created successfully', 'data' => $job]);
    }

    public function update(Request $request, $id)
    {
        $job = Job::find($id);
        if (!$job) {
            return response()->json(['message' => 'Job not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'department_id' => 'sometimes|exists:departments,id',
            'division_id' => 'sometimes|exists:divisions,id',
            'job_name' => 'sometimes|string|max:255',
            'status' => 'sometimes|string|in:ACTIVE,INACTIVE,DELETED',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $updateData = $request->only(['department_id', 'division_id', 'job_name', 'status', 'description']);
        $updateData['updated_by'] = 1;

        $job->update($updateData);

        return response()->json(['message' => 'Job updated successfully', 'data' => $job]);
    }

    public function destroy($id)
    {
        $job = Job::find($id);
        if (!$job) {
            return response()->json(['message' => 'Job not found'], 404);
        }

        $job->status = 'DELETED';
        $job->deleted_by = 1;
        $job->save();

        return response()->json(['message' => 'Job deleted successfully']);
    }
}
