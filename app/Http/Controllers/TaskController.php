<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Task;
use App\Models\TaskAssignment;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class TaskController extends Controller
{
    /**
     * Display a listing of the resource.
     */

      public function showTaskPage()
    {
        return view('task/task');
    }

    public function index()
    {
        //
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'project_id' => 'required|exists:projects,id',
            'point' => 'required|integer|min:1',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'priority' => 'required|in:HIGH,MEDIUM,LOW',
            'reference_url' => 'nullable|url|max:255',
            'reference_file' => 'nullable|file|mimes:pdf,doc,docx|max:5120',
            'start_date' => 'required|date',
            'due_date' => 'required|date|after_or_equal:start_date',
            'complete_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation errors',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();

        // Handle image upload
        if ($request->hasFile('image')) {
            $imageFile = $request->file('image');
            $imageExtension = $imageFile->getClientOriginalExtension();
            $imageName = 'TASK_' . time() . '.' . $imageExtension;
            $imagePath = $imageFile->storeAs('task_images', $imageName, 'public');
            $data['image'] = $imageName;
        }

        // Handle reference file upload
        if ($request->hasFile('reference_file')) {
            $referenceFile = $request->file('reference_file');
            $referenceExtension = $referenceFile->getClientOriginalExtension();
            $referenceName = 'TASK_' . time() . '.' . $referenceExtension;
            $referenceFilePath = $referenceFile->storeAs('task_reference_files', $referenceName, 'public');
            $data['reference_file'] = $referenceName;
        }

        // Set created_by if user is authenticated
        if ($request->user()) {
            $data['created_by'] = $request->user()->name;
        }

        $task = Task::create($data);

        // Add the creator as PIC in task_assignments
        $user = $request->user();
        if ($user && $user->employee) {
            TaskAssignment::create([
                'task_id' => $task->id,
                'employee_id' => $user->employee->id,
                'role' => 'PIC',
                'is_receive' => false,
                'date_receive' => null,
            ]);
        }

        // Handle executor assignments
        if ($request->has('executors')) {
            $executorIds = json_decode($request->input('executors'), true);
            if (is_array($executorIds)) {
                foreach ($executorIds as $executorId) {
                    TaskAssignment::create([
                        'task_id' => $task->id,
                        'employee_id' => $executorId,
                        'role' => 'executor',
                        'is_receive' => false,
                        'date_receive' => null,
                    ]);
                }
            }
        }

        return response()->json([
            'message' => 'Task created successfully',
            'task' => $task,
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
