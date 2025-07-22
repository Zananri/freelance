<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Task;
use App\Models\TaskAssignment;
use App\Models\TaskFeedback;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use App\Models\Employee;

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
        // Fetch tasks with related project and assignments
        $tasks = Task::with(['project', 'assignments.employee', 'feedback_comments'])
            ->get()
            ->groupBy('status');

        // Prepare response data grouped by status
        $response = [
            'new_request' => [],
            'in_progress' => [],
            'completed' => [],
        ];

        foreach ($tasks as $status => $tasksGroup) {
            foreach ($tasksGroup as $task) {
                // Get PIC and executors
                $pic = $task->assignments->firstWhere('role', 'PIC');
                $executors = $task->assignments->where('role', 'executor');

                $responseKey = '';
                switch (strtolower($status)) {
                    case 'new request':
                    case 'new_request':
                        $responseKey = 'new_request';
                        break;
                    case 'in progress':
                    case 'in_progress':
                        $responseKey = 'in_progress';
                        break;
                    case 'completed':
                        $responseKey = 'completed';
                        break;
                    default:
                        $responseKey = 'new_request';
                }

                // Merge PIC into executors array as first element
                $allExecutors = collect();
                if ($pic) {
                    $allExecutors->push([
                        'name' => $pic->employee->name ?? '',
                        'image' => $pic->employee && $pic->employee->user && $pic->employee->user->photo ? asset($pic->employee->user->photo) : asset('asset/img/profile_picture/default.png'),
                    ]);
                }
                $executorsMapped = $executors->map(function ($executor) {
                    return [
                        'name' => $executor->employee->name ?? '',
                        'image' => $executor->employee && $executor->employee->user && $executor->employee->user->photo ? asset($executor->employee->user->photo) : asset('asset/img/profile_picture/default.png'),
                    ];
                })->values();
                $allExecutors = $allExecutors->merge($executorsMapped);

                $response[$responseKey][] = [
                    'id' => $task->id,
                    'title' => $task->title,
                    'description' => $task->description,
                    'project_image' => ($task->project && $task->project->image) ? asset('file/project/' . $task->project->image) : asset('asset/img/profile_picture/sample_project.png'),
                    'executors' => $allExecutors,
                    'reference_files_count' => is_array($task->reference_files) ? count($task->reference_files) : 0,
                    'feedback_comments_count' => $task->feedback_comments ? $task->feedback_comments->count() : 0,
                ];
            }
        }

        return response()->json($response);
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
            'reference_files' => 'nullable|array',
            'reference_files.*' => 'file|mimes:pdf,doc,docx|max:5120',
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
            $imageFile->move(public_path('file/task'), $imageName);
            $data['image'] = $imageName;
        }

        // Handle multiple reference files upload
        if ($request->hasFile('reference_files')) {
            $newFiles = [];
            
            foreach ($request->file('reference_files') as $index => $file) {
                $referenceExtension = $file->getClientOriginalExtension();
                $referenceName = 'TASK_' . time() . '_' . $index . '.' . $referenceExtension;
                $file->move(public_path('file/task_reference_files'), $referenceName);
                $newFiles[] = $referenceName;
            }
            
            $data['reference_files'] = $newFiles;
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
        $task = Task::with([
            'project.department', 
            'project.division',
            'assignments.employee.user'
        ])->findOrFail($id);

        // Get PIC and executors
        $pic = $task->assignments->firstWhere('role', 'PIC');
        $executors = $task->assignments->where('role', 'executor');

        $response = [
            'id' => $task->id,
            'title' => $task->title,
            'description' => $task->description,
            'point' => $task->point,
            'priority' => $task->priority,
            'status' => $task->status,
            'reference_url' => $task->reference_url,
            'reference_files' => $task->reference_files,
            'start_date' => $task->start_date,
            'due_date' => $task->due_date,
            'image' => $task->image,
            'project' => [
                'id' => $task->project->id,
                'title' => $task->project->title,
                'department' => $task->project->department->name_department ?? '',
                'division' => $task->project->division->name_division ?? '',
            ],
            'pic' => $pic ? [
                'id' => $pic->employee->id,
                'name' => $pic->employee->name,
                'user_photo' => $pic->employee->user->photo ?? null,
            ] : null,
            'executors' => $executors->map(function ($executor) {
                return [
                    'id' => $executor->employee->id,
                    'name' => $executor->employee->name,
                    'user_photo' => $executor->employee->user->photo ?? null,
                ];
            })->values(),
        ];

        return response()->json($response);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        $task = Task::with([
            'project',
            'assignments.employee.user'
        ])->findOrFail($id);

        // Get executors (excluding PIC)
        $executors = $task->assignments->where('role', 'executor');

        $response = [
            'id' => $task->id,
            'title' => $task->title,
            'description' => $task->description,
            'project_id' => $task->project_id,
            'point' => $task->point,
            'priority' => $task->priority,
            'reference_url' => $task->reference_url,
            'reference_files' => $task->reference_files,
            'start_date' => $task->start_date,
            'due_date' => $task->due_date,
            'image' => $task->image,
            'executors' => $executors->map(function ($executor) {
                return [
                    'id' => $executor->employee->id,
                    'name' => $executor->employee->name,
                    'user_photo' => $executor->employee->user->photo ?? null,
                ];
            })->values(),
        ];

        return response()->json($response);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $task = Task::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'project_id' => 'required|exists:projects,id',
            'point' => 'required|integer|min:1',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'priority' => 'required|in:HIGH,MEDIUM,LOW',
            'reference_url' => 'nullable|url|max:255',
            'reference_files' => 'nullable|array',
            'reference_files.*' => 'file|mimes:pdf,doc,docx|max:5120',
            'start_date' => 'required|date',
            'due_date' => 'required|date|after_or_equal:start_date',
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
            // Delete old image if exists
            if ($task->image && file_exists(public_path('file/task/' . $task->image))) {
                unlink(public_path('file/task/' . $task->image));
            }

            $imageFile = $request->file('image');
            $imageExtension = $imageFile->getClientOriginalExtension();
            $imageName = 'TASK_' . time() . '.' . $imageExtension;
            $imageFile->move(public_path('file/task'), $imageName);
            $data['image'] = $imageName;
        }

        // Handle multiple reference files upload and existing files
        $existingFilesToKeep = $request->input('existing_reference_files');
        if ($existingFilesToKeep) {
            $existingFilesToKeep = json_decode($existingFilesToKeep, true);
            if (!is_array($existingFilesToKeep)) {
                $existingFilesToKeep = [];
            }
        } else {
            $existingFilesToKeep = [];
        }

        // Delete files removed by user
        if ($task->reference_files && is_array($task->reference_files)) {
            foreach ($task->reference_files as $oldFile) {
                if (!in_array($oldFile, $existingFilesToKeep)) {
                    if (file_exists(public_path('file/task_reference_files/' . $oldFile))) {
                        unlink(public_path('file/task_reference_files/' . $oldFile));
                    }
                }
            }
        }

        $referenceFiles = $existingFilesToKeep;

        if ($request->hasFile('reference_files')) {
            foreach ($request->file('reference_files') as $index => $file) {
                $referenceExtension = $file->getClientOriginalExtension();
                // Use uniqid to avoid filename collisions
                $referenceName = 'TASK_' . time() . '_' . $index . '.' . $referenceExtension;
                $file->move(public_path('file/task_reference_files'), $referenceName);
                $referenceFiles[] = $referenceName;
            }
        }

        $data['reference_files'] = $referenceFiles;

        $task->update($data);

        // Update executor assignments
        if ($request->has('executors')) {
            // Delete existing executor assignments (keep PIC)
            TaskAssignment::where('task_id', $task->id)
                ->where('role', 'executor')
                ->delete();

            // Add new executor assignments
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
            'message' => 'Task updated successfully',
            'task' => $task,
        ]);
    }

    /**
     * Get employees for task executor dropdown, excluding logged-in user
     */
    public function getEmployeesForTaskExecutor(Request $request)
    {
        try {
            $query = $request->input('q', '');

            // Use null-safe operator to get employee id
            $excludeEmployeeId = auth()->user()?->employee?->id;

            $employees = Employee::query()
                ->when($query !== '', function ($q) use ($query) {
                    return $q->where('name', 'like', '%' . $query . '%');
                })
                ->when($excludeEmployeeId, function ($q) use ($excludeEmployeeId) {
                    return $q->where('id', '!=', $excludeEmployeeId);
                })
                ->orderBy('name')
                ->get(['id', 'name', 'photo as user_photo']);

            return response()->json(['data' => $employees]);
        } catch (\Exception $e) {
            \Log::error('Error in getEmployeesForTaskExecutor: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch employees'], 500);
        }
    }


    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $task = Task::findOrFail($id);

        // Delete associated files
        if ($task->image && file_exists(public_path('file/task/' . $task->image))) {
            unlink(public_path('file/task/' . $task->image));
        }

        if ($task->reference_files && is_array($task->reference_files)) {
            foreach ($task->reference_files as $referenceFile) {
                if (file_exists(public_path('file/task_reference_files/' . $referenceFile))) {
                    unlink(public_path('file/task_reference_files/' . $referenceFile));
                }
            }
        }

        // Delete task assignments
        TaskAssignment::where('task_id', $task->id)->delete();

        // Delete task
        $task->delete();

        return response()->json([
            'message' => 'Task deleted successfully',
        ]);
    }

    /**
     * Store task feedback
     */
    public function storeFeedback(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'task_id' => 'required|exists:tasks,id',
                'employee_id' => 'required|exists:employees,id',
                'feedback_comment' => 'required|string',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
                'reference_url' => 'nullable|url|max:255',
                'reference_file' => 'nullable|file|mimes:pdf,doc,docx|max:5120',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation errors',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $data = $validator->validated();

            // Get task to determine project_id
            $task = Task::findOrFail($data['task_id']);
            $data['project_id'] = $task->project_id;

            // Handle image upload
            if ($request->hasFile('image')) {
                $imageFile = $request->file('image');
                $imageExtension = $imageFile->getClientOriginalExtension();
                $imageName = 'TASK_FEEDBACK_' . time() . '.' . $imageExtension;
                $imageFile->move(public_path('file/task'), $imageName);
                $data['image'] = $imageName;
            }

            // Handle reference file upload
            if ($request->hasFile('reference_file')) {
                $referenceFile = $request->file('reference_file');
                $referenceExtension = $referenceFile->getClientOriginalExtension();
                $referenceName = 'TASK_FEEDBACK_' . time() . '.' . $referenceExtension;
                $referenceFile->move(public_path('file/task_reference_files'), $referenceName);
                $data['reference_file'] = $referenceName;
            }

            // Create task feedback
            $feedback = TaskFeedback::create($data);

            return response()->json([
                'message' => 'Task feedback submitted successfully',
                'feedback' => $feedback,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error storing task feedback: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to submit feedback: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get task feedbacks for a specific task
     */
    public function getTaskFeedbacks($taskId)
    {
        $feedbacks = TaskFeedback::with(['employee.user'])
            ->where('task_id', $taskId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'data' => $feedbacks->map(function ($feedback) {
                return [
                    'id' => $feedback->id,
                    'feedback_comment' => $feedback->feedback_comment,
                    'image' => $feedback->image ? asset('file/task/' . $feedback->image) : null,
                    'reference_url' => $feedback->reference_url,
                    'reference_file' => $feedback->reference_file ? asset('file/task_reference_files/' . $feedback->reference_file) : null,
                    'created_at' => $feedback->created_at,
                    'employee' => [
                        'id' => $feedback->employee->id,
                        'name' => $feedback->employee->name,
                        'photo' => $feedback->employee->user && $feedback->employee->user->photo 
                            ? asset($feedback->employee->user->photo) 
                            : asset('asset/img/profile_picture/default.png'),
                    ],
                ];
            }),
        ]);
    }
}
