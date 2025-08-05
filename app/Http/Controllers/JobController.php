<?php

namespace App\Http\Controllers;

use App\Models\Job;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

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
        try {
            DB::beginTransaction();

            $validator = Validator::make($request->all(), [
                'department_id' => 'required|exists:departments,id',
                'division_id' => 'required|exists:divisions,id',
                'job_name' => 'required|string|max:255',
                'status' => 'required|string|in:ACTIVE,INACTIVE,DELETED',
                'description' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                throw new \Exception($validator->errors()->first());
            }

            $userId = auth()->check() ? auth()->id() : 1;

            $job = Job::create([
                'department_id' => $request->department_id,
                'division_id' => $request->division_id,
                'job_name' => $request->job_name,
                'status' => $request->status,
                'description' => $request->description,
                'created_by' => $userId,
                'updated_by' => $userId,
                'deleted_by' => $userId,
            ]);

            if (!$job) {
                throw new \Exception('Failed to create job');
            }

            DB::commit();

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => $job,
                'message' => 'Job created successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'code' => 406,
                'status' => 'error',
                'data' => [],
                'message' => $e->getMessage()
            ], 406);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            DB::beginTransaction();

            $job = Job::find($id);
            if (!$job) {
                throw new \Exception('Job not found');
            }

            $validator = Validator::make($request->all(), [
                'department_id' => 'sometimes|exists:departments,id',
                'division_id' => 'sometimes|exists:divisions,id',
                'job_name' => 'sometimes|string|max:255',
                'status' => 'sometimes|string|in:ACTIVE,INACTIVE,DELETED',
                'description' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                throw new \Exception($validator->errors()->first());
            }

            $userId = auth()->check() ? auth()->id() : 1;

            $updateData = $request->only(['department_id', 'division_id', 'job_name', 'status', 'description']);
            $updateData['updated_by'] = $userId;

            $updated = $job->update($updateData);

            if (!$updated) {
                throw new \Exception('Failed to update job');
            }

            DB::commit();

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => $job,
                'message' => 'Job updated successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'code' => 406,
                'status' => 'error',
                'data' => [],
                'message' => $e->getMessage()
            ], 406);
        }
    }

    public function destroy($id)
    {
        try {
            DB::beginTransaction();

            $job = Job::find($id);
            if (!$job) {
                throw new \Exception('Job not found');
            }

            $userId = auth()->check() ? auth()->id() : 1;

            $job->status = 'DELETED';
            $job->deleted_by = $userId;
            $saved = $job->save();

            if (!$saved) {
                throw new \Exception('Failed to delete job');
            }

            DB::commit();

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => [],
                'message' => 'Job deleted successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'code' => 406,
                'status' => 'error',
                'data' => [],
                'message' => $e->getMessage()
            ], 406);
        }
    }
}
