<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Controllers\NotificationController;
use Illuminate\Http\Request;
use App\Models\Task;
use App\Models\TaskAssignment;
use App\Models\TaskFeedback;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use App\Models\Employee;
use Illuminate\Support\Facades\DB;

class TaskController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function showTaskPage()
    {
        return view('task/task');
    }

    public function index(Request $request)
    {
        try {
            // Get current logged in user's employee ID
            $currentUser = auth()->user();
            $currentEmployeeId = $currentUser?->employee?->id;

            if (!$currentEmployeeId) {
                return response()->json([
                    'code' => 200,
                    'status' => 'success',
                    'data' => [
                        'new_request' => [],
                        'in_progress' => [],
                        'completed' => [],
                        'rejected' => [],
                    ]
                ]);
            }

            // Get filter parameters
            $projectId = $request->input('project');
            $status = $request->input('status');

            // Build base query
            $query = Task::with(['project', 'assignments.employee', 'feedback_comments'])
                ->whereHas('assignments', function ($query) use ($currentEmployeeId) {
                    $query->where(function ($q) use ($currentEmployeeId) {
                        $q->where('employee_id', $currentEmployeeId)
                          ->where(function ($q2) {
                              $q2->where('role', 'PIC')
                                 ->orWhere(function ($q3) {
                                     $q3->where('role', 'EXECUTOR')
                                        ->where('is_receive', true);
                                 });
                          });
                    });
                });

            // Apply filters
            if ($projectId) {
                $query->where('project_id', $projectId);
            }
            if ($status) {
                $query->where('status', $status);
            }

            // Get all tasks
            $tasks = $query->get()->groupBy('status');

            // Prepare response data
            $response = [
                'new_request' => [],
                'in_progress' => [],
                'completed' => [],
                'rejected' => [],
            ];

            foreach ($tasks as $status => $tasksGroup) {
                foreach ($tasksGroup as $task) {
                    $pic = $task->assignments->firstWhere('role', 'PIC');
                    $executors = $task->assignments->where('role', 'EXECUTOR');

                    $responseKey = match (strtolower($status)) {
                        'new request', 'new_request' => 'new_request',
                        'in progress', 'in_progress' => 'in_progress',
                        'completed' => 'completed',
                        'rejected' => 'rejected',
                        default => 'new_request'
                    };

                    // Prepare PIC data
                    $picData = null;
                    if ($pic && $pic->employee) {
                        $picData = [
                            'id' => $pic->employee->id,
                            'name' => $pic->employee->name,
                            'image' => $pic->employee->user && $pic->employee->user->photo 
                                ? asset($pic->employee->user->photo) 
                                : asset('asset/img/profile_picture/default.png'),
                            'is_receive' => true,
                        ];
                    }

                    // Prepare executors data
                    $executorsData = $executors->map(function ($executor) {
                        return [
                            'id' => $executor->employee->id,
                            'name' => $executor->employee->name,
                            'image' => $executor->employee->user && $executor->employee->user->photo 
                                ? asset($executor->employee->user->photo) 
                                : asset('asset/img/profile_picture/default.png'),
                            'is_receive' => $executor->is_receive,
                            'role' => $executor->role,
                        ];
                    })->values();

                    $response[$responseKey][] = [
                        'id' => $task->id,
                        'title' => $task->title,
                        'description' => $task->description,
                        'project_image' => ($task->project && $task->project->image) 
                            ? asset('file/project/' . $task->project->image) 
                            : asset('asset/img/profile_picture/sample_project.png'),
                        'project_id' => $task->project_id,
                        'pic' => $picData,
                        'executors' => $executorsData,
                        'reference_files_count' => is_array($task->reference_files) ? count($task->reference_files) : 0,
                        'feedback_comments_count' => $task->feedback_comments ? $task->feedback_comments->count() : 0,
                        'status' => $task->status,
                    ];
                }
            }

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => $response
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'code' => $e->getCode() ?: 500,
                'status' => 'error',
                'message' => $e->getMessage()
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
   public function store(Request $request)
{
    DB::beginTransaction();
    try {
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
                'code' => 422,
                'status' => 'error',
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

        // Initialize reference files array
        $referenceFiles = [];
        
        // Handle reference files upload
        if ($request->hasFile('reference_files')) {
            foreach ($request->file('reference_files') as $index => $file) {
                $referenceExtension = $file->getClientOriginalExtension();
                $referenceName = 'TASK_' . time() . '_' . $index . '.' . $referenceExtension;
                $file->move(public_path('file/task_reference_files'), $referenceName);
                $referenceFiles[] = $referenceName;
            }
        }
        $data['reference_files'] = $referenceFiles;

        // Set created_by
        if ($request->user()) {
            $data['created_by'] = $request->user()->id;
        }

        // Create task
        $task = Task::create($data);

        // Add creator as PIC
        $user = $request->user();
        if ($user && $user->employee) {
            TaskAssignment::create([
                'task_id' => $task->id,
                'employee_id' => $user->employee->id,
                'role' => 'PIC',
                'is_receive' => true,
                'date_receive' => now(),
                'created_by' => $user->id,
                'updated_by' => $user->id,
                'deleted_by' => null
            ]);
        } else {
            throw new \Exception('User not authenticated or has no employee record');
        }

        // Handle executor assignments with improved validation
        if ($request->has('executors')) {
            $executorIds = json_decode($request->input('executors'), true);
            
            // Ensure executors is always an array
            if (!is_array($executorIds)) {
                $executorIds = [];
            }

            $employee = auth()->user()->employee;

            
            foreach ($executorIds as $executorId) {
                // Skip if executor is same as PIC
                if ($executorId == $employee->id) continue;

                TaskAssignment::create([
                    'task_id' => $task->id,
                    'employee_id' => $executorId,
                    'role' => 'EXECUTOR',
                    'is_receive' => false,
                    'date_receive' => null,
                    'created_by' => auth()->id(),
                    'updated_by' => auth()->id(),
                    'deleted_by' => null
                ]);

                // Send notification to executor
                $executor = Employee::find($executorId);
                if ($executor) {
                    NotificationController::createUserNotification(
                        $executorId,
                        'task_assignment',
                        'You have been assigned as executor for task: ' . $task->title,
                        'You have been assigned as executor for task: ' . $task->title,
                        $employee->id,
                        $task->id
                    );
                }
            }
        }

        DB::commit();

        return response()->json([
            'code' => 200,
            'status' => 'success',
            'message' => 'Task created successfully',
            'data' => $task
        ]);

    } catch (\Exception $e) {
        DB::rollBack();
        return response()->json([
            'code' => $e->getCode() ?: 500,
            'status' => 'error',
            'message' => $e->getMessage()
        ], $e->getCode() ?: 500);
    }
}

    /**
     * Display the specified resource.
     */
   public function show(string $id)
{
    try {
        $task = Task::with([
            'project.department',
            'project.division',
            'assignments.employee.user'
        ])->findOrFail($id);

        // Get PIC dan Executors
        $pic = $task->assignments->firstWhere('role', 'PIC');
        $executors = $task->assignments->where('role', 'EXECUTOR');

        // Pastikan reference_files selalu array
        $referenceFiles = is_array($task->reference_files)
            ? $task->reference_files
            : (is_string($task->reference_files)
                ? json_decode($task->reference_files, true) ?? []
                : []);

        // Response
        $response = [
            'id' => $task->id,
            'title' => $task->title ?? '',
            'description' => $task->description ?? '',
            'point' => $task->point ?? '',
            'priority' => $task->priority ?? '',
            'status' => $task->status ?? '',
            'reference_url' => $task->reference_url ?? '',
            'reference_files' => $referenceFiles,
            'start_date' => $task->start_date ?? '',
            'due_date' => $task->due_date ?? '',
            'image' => $task->image ?: null,

            // Project data dengan fallback
            'project' => $task->project ? [
                'id' => $task->project->id,
                'title' => $task->project->title ?? '',
                'department' => $task->project->department->name_department ?? 'No Department',
                'division' => $task->project->division->name_division ?? 'No Division',
            ] : [
                'id' => null,
                'title' => 'No Project',
                'department' => 'No Department',
                'division' => 'No Division',
            ],

            // PIC dengan default
            'pic' => ($pic && $pic->employee) ? [
                'id' => $pic->employee->id,
                'name' => $pic->employee->name ?? '',
                'user_photo' => $pic->employee->user->photo
                    ? asset($pic->employee->user->photo)
                    : asset('asset/img/profile_picture/default.png'),
            ] : [
                'id' => null,
                'name' => 'None',
                'user_photo' => asset('asset/img/profile_picture/default.png'),
            ],

            // Executors dengan default
            'executors' => $executors->count() > 0
                ? $executors->map(function ($executor) {
                    return [
                        'id' => $executor->employee->id,
                        'name' => $executor->employee->name ?? '',
                        'user_photo' => $executor->employee->user->photo
                            ? asset($executor->employee->user->photo)
                            : asset('asset/img/profile_picture/default.png'),
                    ];
                })->values()
                : [],
        ];

        return response()->json([
            'code' => 200,
            'status' => 'success',
            'data' => $response
        ]);

    } catch (\Exception $e) {
        return response()->json([
            'code' => $e->getCode() ?: 500,
            'status' => 'error',
            'message' => $e->getMessage()
        ], $e->getCode() ?: 500);
    }
}


      public function edit(string $id)
    {
        $task = Task::with([
            'project',
            'assignments.employee.user'
        ])->findOrFail($id);

        // Get executors (excluding PIC)
        $executors = $task->assignments->where('role', 'EXECUTOR');

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
        DB::beginTransaction();
        try {
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
                    'code' => 422,
                    'status' => 'error',
                    'message' => 'Validation errors',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $data = $validator->validated();

            // Handle image upload
            if ($request->hasFile('image')) {
                // Delete old image
                if ($task->image && file_exists(public_path('file/task/' . $task->image))) {
                    unlink(public_path('file/task/' . $task->image));
                }

                $imageFile = $request->file('image');
                $imageExtension = $imageFile->getClientOriginalExtension();
                $imageName = 'TASK_' . time() . '.' . $imageExtension;
                $imageFile->move(public_path('file/task'), $imageName);
                $data['image'] = $imageName;
            }

            // Handle reference files
            $existingFilesToKeep = json_decode($request->input('existing_reference_files'), true) ?? [];
            
            // Delete removed files
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

            // Add new files
            if ($request->hasFile('reference_files')) {
                foreach ($request->file('reference_files') as $index => $file) {
                    $referenceExtension = $file->getClientOriginalExtension();
                    $referenceName = 'TASK_' . time() . '_' . $index . '.' . $referenceExtension;
                    $file->move(public_path('file/task_reference_files'), $referenceName);
                    $referenceFiles[] = $referenceName;
                }
            }

            $data['reference_files'] = $referenceFiles;

            // Update task
            $task->update($data);

            // Update executor assignments
            if ($request->has('executors')) {
                $newExecutorIds = json_decode($request->input('executors'), true) ?? [];
                $employee = auth()->user()->employee;

                // Get existing executors
                $existingExecutors = TaskAssignment::where('task_id', $task->id)
                    ->where('role', 'EXECUTOR')
                    ->get()
                    ->keyBy('employee_id');

                // Remove executors not in new list
                TaskAssignment::where('task_id', $task->id)
                    ->where('role', 'EXECUTOR')
                    ->whereNotIn('employee_id', $newExecutorIds)
                    ->delete();

                // Add new executors
                foreach ($newExecutorIds as $executorId) {
                    if ($executorId == $employee->id || isset($existingExecutors[$executorId])) {
                        continue;
                    }

                    TaskAssignment::create([
                        'task_id' => $task->id,
                        'employee_id' => $executorId,
                        'role' => 'EXECUTOR',
                        'is_receive' => false,
                        'date_receive' => null,
                    ]);

                    // Send notification
                    $executor = Employee::find($executorId);
                    if ($executor) {
                        NotificationController::createUserNotification(
                            $executorId,
                            'task_assignment',
                            'You have been assigned as executor for task: ' . $task->title,
                            'You have been assigned as executor for task: ' . $task->title,
                            $employee->id,
                            $task->id
                        );
                    }
                }
            }

            $updateData['updated_by'] = auth()->id();
            $task->update($updateData);

            DB::commit();

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'message' => 'Task updated successfully',
                'data' => $task
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'code' => $e->getCode() ?: 500,
                'status' => 'error',
                'message' => $e->getMessage()
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        DB::beginTransaction();
        try {
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
            $task->deleted_by = auth()->id();
            
            DB::commit();

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'message' => 'Task deleted successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'code' => $e->getCode() ?: 500,
                'status' => 'error',
                'message' => $e->getMessage()
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * Update task status
     */
  public function updateStatus(Request $request, string $id)
{
    DB::beginTransaction();
    try {
        $task = Task::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'status' => 'required|in:new request,in progress,completed,rejected,new_request,in_progress',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'code' => 422,
                'status' => 'error',
                'message' => 'Validation errors',
                'errors' => $validator->errors(),
            ], 422);
        }

        $statusMap = [
            'new request' => 'new_request',
            'in progress' => 'in_progress',
            'completed' => 'completed',
            'rejected' => 'rejected',
            'new_request' => 'new_request',
            'in_progress' => 'in_progress',
        ];

        $dbStatus = $statusMap[$request->status] ?? $request->status;
        $task->update(['status' => $dbStatus]);

        DB::commit();

        return response()->json([
            'code' => 200,
            'status' => 'success',
            'message' => 'Task status updated successfully',
            'data' => [
                'task' => $task,
                'updated_status' => $dbStatus
            ]
        ]);

    } catch (\Exception $e) {
        DB::rollBack();
        return response()->json([
            'code' => $e->getCode() ?: 500,
            'status' => 'error',
            'message' => $e->getMessage()
        ], $e->getCode() ?: 500);
    }
}

    /**
     * Store task feedback
     */
    public function storeFeedback(Request $request)
    {
        DB::beginTransaction();
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
                    'code' => 422,
                    'status' => 'error',
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

            DB::commit();

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'message' => 'Task feedback submitted successfully',
                'data' => $feedback,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'code' => $e->getCode() ?: 500,
                'status' => 'error',
                'message' => 'Failed to submit feedback: ' . $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * Get task feedbacks for a specific task
     */
    public function getTaskFeedbacks($taskId)
    {
        try {
            $feedbacks = TaskFeedback::with(['employee.user'])
                ->where('task_id', $taskId)
                ->orderBy('created_at', 'desc')
                ->get();

            $formattedFeedbacks = $feedbacks->map(function ($feedback) {
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
            });

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => $formattedFeedbacks
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'code' => $e->getCode() ?: 500,
                'status' => 'error',
                'message' => $e->getMessage()
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * Get count of feedbacks for a specific task
     */
    public function getTaskFeedbackCount($taskId)
    {
        try {
            $count = TaskFeedback::where('task_id', $taskId)->count();

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => [
                    'count' => $count
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'code' => $e->getCode() ?: 500,
                'status' => 'error',
                'message' => $e->getMessage()
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * Get all tasks for a specific project
     */
    public function getTasksByProject($projectId)
    {
        try {
            $tasks = Task::with([
                'assignments.employee.user',
                'project'
            ])
            ->where('project_id', $projectId)
            ->orderBy('created_at', 'desc')
            ->get();

            $formattedTasks = $tasks->map(function ($task) {
                // Get PIC
                $pic = $task->assignments->firstWhere('role', 'PIC');
                $picData = null;
                if ($pic && $pic->employee) {
                    $picData = [
                        'id' => $pic->employee->id,
                        'name' => $pic->employee->name ?? 'Not assigned',
                        'user_photo' => $pic->employee->user && $pic->employee->user->photo 
                            ? $pic->employee->user->photo 
                            : null,
                    ];
                }

                // Get Executors
                $executors = $task->assignments->where('role', 'EXECUTOR');
                $executorsData = $executors->map(function ($executor) {
                    return [
                        'id' => $executor->employee->id,
                        'name' => $executor->employee->name ?? 'Unknown',
                        'user_photo' => $executor->employee->user && $executor->employee->user->photo 
                            ? $executor->employee->user->photo 
                            : null,
                    ];
                })->values();

                return [
                    'id' => $task->id,
                    'title' => $task->title,
                    'description' => $task->description,
                    'image' => $task->image,
                    'created_at' => $task->created_at,
                    'pic' => $picData,
                    'executors' => $executorsData,
                    'status' => $task->status,
                ];
            });

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => $formattedTasks
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'code' => $e->getCode() ?: 500,
                'status' => 'error',
                'message' => $e->getMessage()
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * Check if task is already accepted by current user
     */
    public function checkAcceptStatus($taskId)
    {
        try {
            $user = auth()->user();
            if (!$user || !$user->employee) {
                throw new \Exception('Unauthorized', 401);
            }

            $assignment = TaskAssignment::where('task_id', $taskId)
                ->where('employee_id', $user->employee->id)
                ->where('role', 'EXECUTOR')
                ->first();

            if (!$assignment) {
                throw new \Exception('Task assignment not found', 404);
            }

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => [
                    'is_accepted' => $assignment->is_receive,
                    'task_id' => $taskId
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'code' => $e->getCode() ?: 500,
                'status' => 'error',
                'message' => $e->getMessage()
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * Accept task assignment for executor
     */
    public function acceptTask(Request $request, $taskId)
    {
        DB::beginTransaction();
        try {
            $user = auth()->user();
            if (!$user || !$user->employee) {
                throw new \Exception('Unauthorized', 401);
            }

            $assignment = TaskAssignment::where('task_id', $taskId)
                ->where('employee_id', $user->employee->id)
                ->where('role', 'EXECUTOR')
                ->first();

            if (!$assignment) {
                throw new \Exception('Task assignment not found', 404);
            }

            if ($assignment->is_receive) {
                throw new \Exception('Task already accepted', 400);
            }

            $assignment->update([
                'is_receive' => true,
                'date_receive' => now(),
            ]);

            // Tidak mengirim notifikasi ke PIC ketika executor menerima task
            // Hanya update status tanpa notifikasi

            DB::commit();

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'message' => 'Task accepted successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'code' => $e->getCode() ?: 500,
                'status' => 'error',
                'message' => $e->getMessage()
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * Get employees for task executor dropdown
     */
    public function getEmployeesForTaskExecutor(Request $request)
    {
        try {
            $query = $request->input('q', '');

            $employees = Employee::query()
                ->when($query !== '', function ($q) use ($query) {
                    return $q->where('name', 'like', '%' . $query . '%');
                })
                ->orderBy('name')
                ->get(['id', 'name', 'photo as user_photo']);

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => $employees
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'code' => 500,
                'status' => 'error',
                'message' => 'Failed to fetch employees: ' . $e->getMessage()
            ], 500);
        }
    }
}