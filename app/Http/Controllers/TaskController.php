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
// use Illuminate\Support\Carbon; // not used directly

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
            $currentUser = auth()->user();
            $currentEmployeeId = $currentUser?->employee?->id;

            if (!$currentEmployeeId) {
                return response()->json([
                    'code' => 200,
                    'status' => 'success',
                    'data' => [
                        'new_request' => ['tasks' => [], 'pagination' => null],
                        'in_progress' => ['tasks' => [], 'pagination' => null],
                        'completed' => ['tasks' => [], 'pagination' => null],
                    ]
                ]);
            }

            $projectId = $request->input('project');
            $statusFilter = $request->input('status'); // optional
            $perPage = (int) $request->input('per_page', 10);
            $page = (int) $request->input('page', 1);

            // Base query: PIC atau EXECUTOR
            $baseQuery = Task::with(['project', 'assignments.employee', 'feedback_comments'])
                ->whereHas('assignments', function ($query) use ($currentEmployeeId) {
                    $query->where(function ($q) use ($currentEmployeeId) {
                        $q->where('employee_id', $currentEmployeeId)
                        ->where(function ($q2) {
                            $q2->where('role', 'PIC')
                                ->orWhere('role', 'EXECUTOR');
                        });
                    });
                });

            if ($projectId) {
                $baseQuery->where('project_id', $projectId);
            }

            $response = [];

            if ($statusFilter) {
                // Jika filter status di-apply
                $query = clone $baseQuery;

                if ($statusFilter === 'in_progress') {
                    $query->whereIn('status', ['in_progress', 'rejected']); // gabung rejected
                } else {
                    $query->where('status', $statusFilter);
                }

                $paginator = $query->paginate($perPage, ['*'], 'page', $page);
                $tasks = $paginator->items();
                $key = strtolower(str_replace(' ', '_', $statusFilter));

                $response[$key] = [
                    'tasks' => $this->mapTasks($tasks),
                    'pagination' => [
                        'current_page' => $paginator->currentPage(),
                        'per_page' => $paginator->perPage(),
                        'total' => $paginator->total(),
                        'last_page' => $paginator->lastPage(),
                    ]
                ];
            } else {
                // Ambil semua status
                $statuses = ['new_request', 'in_progress', 'completed'];

                foreach ($statuses as $st) {
                    $query = clone $baseQuery;

                    if ($st === 'in_progress') {
                        $query->whereIn('status', ['in_progress', 'rejected']); // gabung rejected
                    } else {
                        $query->where('status', $st);
                    }

                    $paginator = $query->paginate($perPage, ['*'], $st . '_page');
                    $tasks = $paginator->items();

                    $response[$st] = [
                        'tasks' => $this->mapTasks($tasks),
                        'pagination' => [
                            'current_page' => $paginator->currentPage(),
                            'per_page' => $paginator->perPage(),
                            'total' => $paginator->total(),
                            'last_page' => $paginator->lastPage(),
                        ]
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
     * List tasks for current employee without pagination, grouped for charts.
     * Categories: not_started (new_request), in_progress, rejected, completed, late (overdue and not completed).
     * Optional filter: project (project_id)
     */
    public function listNoPagination(Request $request)
    {
        try {
            $currentUser = auth()->user();
            $currentEmployeeId = $currentUser?->employee?->id;

            if (!$currentEmployeeId) {
                return response()->json([
                    'code' => 200,
                    'status' => 'success',
                    'data' => [
                        'not_started' => ['tasks' => [], 'count' => 0],
                        'in_progress' => ['tasks' => [], 'count' => 0],
                        'rejected' => ['tasks' => [], 'count' => 0],
                        'completed' => ['tasks' => [], 'count' => 0],
                        'late' => ['tasks' => [], 'count' => 0],
                    ]
                ]);
            }

            $projectId = $request->input('project');

            // Base query: tasks where current employee is PIC or EXECUTOR
            $baseQuery = Task::with(['project', 'assignments.employee', 'feedback_comments'])
                ->whereHas('assignments', function ($query) use ($currentEmployeeId) {
                    $query->where(function ($q) use ($currentEmployeeId) {
                        $q->where('employee_id', $currentEmployeeId)
                            ->where(function ($q2) {
                                $q2->where('role', 'PIC')
                                    ->orWhere('role', 'EXECUTOR');
                            });
                    });
                });

            if ($projectId) {
                $baseQuery->where('project_id', $projectId);
            }

            // Build each category without pagination
            $notStarted = (clone $baseQuery)
                ->whereIn(DB::raw('LOWER(status)'), ['new_request', 'new request'])
                ->orderBy('created_at', 'desc')
                ->get();

            $inProgress = (clone $baseQuery)
                ->whereIn(DB::raw('LOWER(status)'), ['in_progress', 'in progress'])
                ->orderBy('created_at', 'desc')
                ->get();

            $rejected = (clone $baseQuery)
                ->whereIn(DB::raw('LOWER(status)'), ['rejected'])
                ->orderBy('created_at', 'desc')
                ->get();

            $completed = (clone $baseQuery)
                ->whereIn(DB::raw('LOWER(status)'), ['completed'])
                ->orderBy('created_at', 'desc')
                ->get();

            $late = (clone $baseQuery)
                ->whereRaw('LOWER(status) <> ?', ['completed'])
                ->whereNotNull('due_date')
                ->where('due_date', '<', now())
                ->orderBy('created_at', 'desc')
                ->get();

            $response = [
                'not_started' => [
                    'tasks' => $this->mapTasks($notStarted->all()),
                    'count' => $notStarted->count(),
                ],
                'in_progress' => [
                    'tasks' => $this->mapTasks($inProgress->all()),
                    'count' => $inProgress->count(),
                ],
                'rejected' => [
                    'tasks' => $this->mapTasks($rejected->all()),
                    'count' => $rejected->count(),
                ],
                'completed' => [
                    'tasks' => $this->mapTasks($completed->all()),
                    'count' => $completed->count(),
                ],
                'late' => [
                    'tasks' => $this->mapTasks($late->all()),
                    'count' => $late->count(),
                ],
            ];

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => $response,
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
     * Map tasks ke format frontend
     */
    private function mapTasks(array $tasks): array
    {
        return array_map(function ($task) {
            $pic = $task->assignments->firstWhere('role', 'PIC');
            $executors = $task->assignments->where('role', 'EXECUTOR');

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

            $projectImageUrl = ($task->project && $task->project->image && file_exists(public_path('file/project/' . $task->project->image)))
                ? asset('file/project/' . $task->project->image)
                : asset('asset/img/profile_picture/default.png');

            return [
                'id' => $task->id,
                'title' => $task->title,
                'description' => $task->description,
                'project_title' => $task->project?->title,
                'project_image' => $projectImageUrl,
                'project_id' => $task->project_id,
                'due_date' => $task->due_date,
                'priority' => $task->priority,
                'pic' => $picData,
                'executors' => $executorsData,
                'reference_files_count' => is_array($task->reference_files) ? count($task->reference_files) : 0,
                'feedback_comments_count' => $task->feedback_comments?->count() ?? 0,
                'status' => $task->status,
            ];
        }, $tasks);
    }

    /**
     * Get unread feedback count for a task for current employee.
     */
    public function getUnreadFeedbackCount($taskId)
    {
        try {
            $user = auth()->user();
            $employeeId = $user?->employee?->id;
            if (!$employeeId) {
                return response()->json(['count' => 0]);
            }

            $task = Task::find($taskId);
            if (!$task)
                return response()->json(['count' => 0]);

            // Strategy: store per-employee last_read_at in tasks.read_markers (JSON)
            $markers = [];
            if (!empty($task->read_markers)) {
                $markers = is_array($task->read_markers)
                    ? $task->read_markers
                    : ((json_decode($task->read_markers, true)) ?: []);
            }
            $lastReadAt = $markers[(string) $employeeId] ?? null;

            $query = TaskFeedback::where('task_id', $taskId)
                ->where('employee_id', '!=', $employeeId); // exclude own feedback
            if ($lastReadAt) {
                $query->where('created_at', '>', $lastReadAt);
            }
            $count = $query->count();

            return response()->json(['count' => $count]);
        } catch (\Exception $e) {
            return response()->json(['count' => 0]);
        }
    }

    /**
     * Mark all feedbacks as read for current employee for a task by updating last_read_at marker.
     */
    public function markTaskFeedbacksRead($taskId)
    {
        try {
            $user = auth()->user();
            $employeeId = $user?->employee?->id;
            if (!$employeeId) {
                return response()->json(['status' => 'ok']);
            }

            $task = Task::findOrFail($taskId);
            $markers = [];
            if (!empty($task->read_markers)) {
                $markers = is_array($task->read_markers)
                    ? $task->read_markers
                    : ((json_decode($task->read_markers, true)) ?: []);
            }
            $markers[(string) $employeeId] = now()->toDateTimeString();
            $task->read_markers = $markers;
            $task->save();

            return response()->json(['status' => 'ok']);
        } catch (\Exception $e) {
            return response()->json(['status' => 'ok']);
        }
    }

    /**
     * Dashboard: Get "Today" tasks for current logged-in employee.
     */
    public function getDashboardTasksToday(Request $request)
    {
        try {
            $user = auth()->user();
            if (!$user || !$user->employee) {
                return response()->json([
                    'code' => 200,
                    'status' => 'success',
                    'data' => []
                ]);
            }

            $employeeId = $user->employee->id;

            $today = now()->toDateString();
            $yesterday = now()->subDay()->toDateString();

            // Base: tasks where current employee is PIC or accepted EXECUTOR
            $base = Task::query()
                ->with(['project', 'assignments.employee.user'])
                ->withCount(['feedback_comments'])
                ->whereHas('assignments', function ($q) use ($employeeId) {
                    $q->where('employee_id', $employeeId)
                        ->where(function ($roleQ) {
                            $roleQ->where('role', 'PIC')
                                ->orWhere(function ($execQ) {
                                    $execQ->where('role', 'EXECUTOR')
                                        ->where('is_receive', true);
                                });
                        });
                })
                // Do not show tasks that start in the future (e.g., tomorrow) on Today's tab
                ->where(function ($d) use ($today) {
                    $d->whereNull('start_date')
                        ->orWhereDate('start_date', '<=', $today);
                });

            // Build the Today filters (broadened)
            $base->where(function ($q) use ($today) {
                $q->whereIn('status', ['new_request', 'new request', 'in_progress', 'in progress'])
                    ->orWhere(function ($cq) use ($today) {
                        $cq->where('status', 'completed')
                            ->where(function ($w) use ($today) {
                                $w->whereDate('complete_date', $today)
                                    ->orWhere(function ($w2) use ($today) {
                                        $w2->whereNull('complete_date')
                                            ->whereDate('updated_at', $today);
                                    });
                            });
                    })
                    ->orWhere(function ($rq) use ($today) {
                        $rq->where('status', 'rejected')
                            ->whereDate('updated_at', $today);
                    });
            });

            $tasks = $base->orderByDesc('created_at')->get();

            // Final safety filter: only include completed if completed today
            $tasks = $tasks->filter(function ($task) use ($today) {
                $status = strtolower($task->status);
                if ($status === 'completed') {
                    if ($task->complete_date) {
                        return \Carbon\Carbon::parse($task->complete_date)->toDateString() === $today;
                    }
                    // fallback: consider updated_at as completion moment if complete_date missing
                    return $task->updated_at && \Carbon\Carbon::parse($task->updated_at)->toDateString() === $today;
                }
                if ($status === 'rejected') {
                    // Only show rejected if it became rejected today
                    return $task->updated_at && \Carbon\Carbon::parse($task->updated_at)->toDateString() === $today;
                }
                return true;
            })->values();

            // Map response minimal fields needed for dashboard
            $data = $tasks->map(function ($task) {
                $pic = $task->assignments->firstWhere('role', 'PIC');
                $executors = $task->assignments->where('role', 'EXECUTOR');

                $projectImageUrl = (function () use ($task) {
                    if ($task->project && $task->project->image) {
                        $image = $task->project->image;
                        $diskPath = public_path('file/project/' . $image);
                        if (file_exists($diskPath)) {
                            return asset('file/project/' . $image);
                        }
                    }
                    return asset('asset/img/profile_picture/default.png');
                })();

                return [
                    'id' => $task->id,
                    'title' => $task->title,
                    'description' => $task->description,
                    'priority' => $task->priority,
                    'status' => $task->status,
                    'due_date' => $task->due_date,
                    'complete_date' => $task->complete_date,
                    // counts for dashboard badges
                    'feedback_comments_count' => (int) ($task->feedback_comments_count ?? 0),
                    'reference_files_count' => is_array($task->reference_files) ? count($task->reference_files) : 0,
                    'project_image' => $projectImageUrl,
                    'pic' => $pic && $pic->employee ? [
                        'id' => $pic->employee->id,
                        'name' => $pic->employee->name,
                        'photo' => ($pic->employee->user && $pic->employee->user->photo)
                            ? asset($pic->employee->user->photo)
                            : asset('asset/img/profile_picture/default.png'),
                    ] : null,
                    'executors' => $executors->map(function ($ex) {
                        return [
                            'id' => $ex->employee->id,
                            'name' => $ex->employee->name,
                            'photo' => ($ex->employee->user && $ex->employee->user->photo)
                                ? asset($ex->employee->user->photo)
                                : asset('asset/img/profile_picture/default.png'),
                            'is_receive' => (bool) $ex->is_receive,
                        ];
                    })->values(),
                ];
            })->values();

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => $data
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
     * Dashboard: Get "Tomorrow" tasks for current logged-in employee (start_date = tomorrow).
     */
    public function getDashboardTasksTomorrow(Request $request)
    {
        try {
            $user = auth()->user();
            if (!$user || !$user->employee) {
                return response()->json([
                    'code' => 200,
                    'status' => 'success',
                    'data' => []
                ]);
            }

            $employeeId = $user->employee->id;

            $tomorrow = now()->addDay()->toDateString();

            // Base: tasks where current employee is PIC or accepted EXECUTOR
            $base = Task::query()
                ->with(['project', 'assignments.employee.user'])
                ->withCount(['feedback_comments'])
                ->whereHas('assignments', function ($q) use ($employeeId) {
                    $q->where('employee_id', $employeeId)
                        ->where(function ($roleQ) {
                            $roleQ->where('role', 'PIC')
                                ->orWhere(function ($execQ) {
                                    $execQ->where('role', 'EXECUTOR')
                                        ->where('is_receive', true);
                                });
                        });
                })
                ->whereDate('start_date', $tomorrow);

            $tasks = $base->orderByDesc('created_at')->get();

            // Map response minimal fields needed for dashboard (same shape as Today)
            $data = $tasks->map(function ($task) {
                $pic = $task->assignments->firstWhere('role', 'PIC');
                $executors = $task->assignments->where('role', 'EXECUTOR');

                $projectImageUrl = (function () use ($task) {
                    if ($task->project && $task->project->image) {
                        $image = $task->project->image;
                        $diskPath = public_path('file/project/' . $image);
                        if (file_exists($diskPath)) {
                            return asset('file/project/' . $image);
                        }
                    }
                    return asset('asset/img/profile_picture/default.png');
                })();

                return [
                    'id' => $task->id,
                    'title' => $task->title,
                    'description' => $task->description,
                    'priority' => $task->priority,
                    'status' => $task->status,
                    'due_date' => $task->due_date,
                    'complete_date' => $task->complete_date,
                    'start_date' => $task->start_date,
                    'feedback_comments_count' => (int) ($task->feedback_comments_count ?? 0),
                    'reference_files_count' => is_array($task->reference_files) ? count($task->reference_files) : 0,
                    'project_image' => $projectImageUrl,
                    'pic' => $pic && $pic->employee ? [
                        'id' => $pic->employee->id,
                        'name' => $pic->employee->name,
                        'photo' => ($pic->employee->user && $pic->employee->user->photo)
                            ? asset($pic->employee->user->photo)
                            : asset('asset/img/profile_picture/default.png'),
                    ] : null,
                    'executors' => $executors->map(function ($ex) {
                        return [
                            'id' => $ex->employee->id,
                            'name' => $ex->employee->name,
                            'photo' => ($ex->employee->user && $ex->employee->user->photo)
                                ? asset($ex->employee->user->photo)
                                : asset('asset/img/profile_picture/default.png'),
                            'is_receive' => (bool) $ex->is_receive,
                        ];
                    })->values(),
                ];
            })->values();

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => $data
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
            // Normalize blank project_id to null so it's truly optional
            if (!$request->filled('project_id') || $request->input('project_id') === '' || $request->input('project_id') === 'null') {
                $request->merge(['project_id' => null]);
            }
            $validator = Validator::make($request->all(), [
                'project_id' => 'nullable|exists:projects,id',
                'point' => 'required|integer|min:1',
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
                'priority' => 'required|in:HIGH,MEDIUM,LOW',
                // Back-compat: accept either single reference_url or multiple reference_urls[]
                'reference_url' => 'nullable|url|max:255',
                'reference_urls' => 'nullable|array',
                'reference_urls.*' => 'nullable|url|max:255',
                'reference_files' => 'nullable|array',
                // Whitelist: images, PDF, Word, Excel, ZIP
                'reference_files.*' => 'file|mimes:jpeg,png,jpg,gif,svg,webp,pdf,doc,docx,xls,xlsx,zip|max:5120',
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

            // Normalize reference URLs into array column reference_urls (preserve single field for legacy)
            $refUrls = [];
            if (!empty($data['reference_urls']) && is_array($data['reference_urls'])) {
                $refUrls = array_values(array_filter($data['reference_urls']));
            } elseif (!empty($data['reference_url'])) {
                $refUrls = [$data['reference_url']];
            }
            $data['reference_urls'] = $refUrls;

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
                    if ($executorId == $employee->id)
                        continue;

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
                'reference_urls' => (function () use ($task) {
                    $arr = [];
                    if (is_array($task->reference_urls))
                        $arr = $task->reference_urls;
                    elseif (is_string($task->reference_urls) && $task->reference_urls !== '') {
                        $decoded = json_decode($task->reference_urls, true);
                        if (is_array($decoded))
                            $arr = $decoded;
                        else
                            $arr = array_filter(array_map('trim', explode(',', $task->reference_urls)));
                    }
                    // Back-compat: if only single reference_url set, expose as array too
                    if (empty($arr) && !empty($task->reference_url))
                        $arr = [$task->reference_url];
                    return $arr;
                })(),
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
            'reference_urls' => (function () use ($task) {
                $arr = [];
                if (is_array($task->reference_urls))
                    $arr = $task->reference_urls;
                elseif (is_string($task->reference_urls) && $task->reference_urls !== '') {
                    $decoded = json_decode($task->reference_urls, true);
                    if (is_array($decoded))
                        $arr = $decoded;
                    else
                        $arr = array_filter(array_map('trim', explode(',', $task->reference_urls)));
                }
                if (empty($arr) && !empty($task->reference_url))
                    $arr = [$task->reference_url];
                return $arr;
            })(),
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
            // Normalize blank project_id to null so it's truly optional
            if (!$request->filled('project_id') || $request->input('project_id') === '' || $request->input('project_id') === 'null') {
                $request->merge(['project_id' => null]);
            }
            $validator = Validator::make($request->all(), [
                'project_id' => 'nullable|exists:projects,id',
                'point' => 'required|integer|min:1',
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
                'priority' => 'required|in:HIGH,MEDIUM,LOW',
                'reference_url' => 'nullable|url|max:255',
                'reference_urls' => 'nullable|array',
                'reference_urls.*' => 'nullable|url|max:255',
                'reference_files' => 'nullable|array',
                // Whitelist: images, PDF, Word, Excel, ZIP
                'reference_files.*' => 'file|mimes:jpeg,png,jpg,gif,svg,webp,pdf,doc,docx,xls,xlsx,zip|max:5120',
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

            // Normalize reference URLs
            $refUrls = [];
            if (!empty($data['reference_urls']) && is_array($data['reference_urls'])) {
                $refUrls = array_values(array_filter($data['reference_urls']));
            } elseif (!empty($data['reference_url'])) {
                $refUrls = [$data['reference_url']];
            }
            $data['reference_urls'] = $refUrls;

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

            // Update status and manage complete_date consistently
            $update = ['status' => $dbStatus];
            if ($dbStatus === 'completed') {
                // Set complete_date to today when marking as completed
                $update['complete_date'] = now()->toDateString();
            } else {
                // Clear complete_date for non-completed statuses
                $update['complete_date'] = null;
            }

            $task->update($update);

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
                'parent_id' => 'nullable|exists:task_feedbacks,id',
                'employee_id' => 'required|exists:employees,id',
                'feedback_comment' => 'required|string',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
                'reference_url' => 'nullable|url|max:255',
                'reference_urls' => 'nullable|array',
                'reference_urls.*' => 'nullable|url|max:255',
                // Multiple files: whitelist same as task reference files
                'reference_files' => 'nullable|array',
                'reference_files.*' => 'file|mimes:jpeg,png,jpg,gif,svg,webp,pdf,doc,docx,xls,xlsx,zip|max:5120',

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

            // Normalize feedback reference URLs (allow clearing on edit)
            $refUrls = [];
            if ($request->has('reference_urls')) {
                $incoming = $request->input('reference_urls', []);
                if (!is_array($incoming)) {
                    $incoming = [];
                }
                // Filter empties & reindex
                $refUrls = array_values(array_filter($incoming, function ($u) {
                    return is_string($u) && trim($u) !== '';
                }));
                $data['reference_urls'] = $refUrls; // even if empty, set to clear
                // Back-compat single field: if array provided, mirror first link into reference_url or clear it
                $data['reference_url'] = count($refUrls) > 0 ? $refUrls[0] : null;
            } elseif (!empty($data['reference_url'])) {
                // Only single provided
                $refUrls = [$data['reference_url']];
                $data['reference_urls'] = $refUrls;
            }

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

            // Handle reference files upload (multiple)
            $uploadedRefFiles = [];
            if ($request->hasFile('reference_files')) {
                foreach ($request->file('reference_files') as $idx => $file) {
                    $ext = $file->getClientOriginalExtension();
                    $name = 'TASK_FEEDBACK_' . time() . '_' . $idx . '.' . $ext;
                    $file->move(public_path('file/task_reference_files'), $name);
                    $uploadedRefFiles[] = $name;
                }
            }
            if (!empty($uploadedRefFiles)) {
                $data['reference_files'] = $uploadedRefFiles;
            }

            // Set created_by
            if ($request->user()) {
                $data['created_by'] = $request->user()->id;
                $data['updated_by'] = $request->user()->id;
                $data['deleted_by'] = null;
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
     * Update task feedback or reply
     */
    public function updateFeedback(Request $request, $id)
    {
        DB::beginTransaction();
        try {
            $feedback = TaskFeedback::findOrFail($id);

            // Only the author (employee) can update their feedback/reply
            $user = $request->user();
            $currentEmployeeId = $user && $user->employee ? $user->employee->id : null;
            if (!$currentEmployeeId || (int) $feedback->employee_id !== (int) $currentEmployeeId) {
                return response()->json([
                    'code' => 403,
                    'status' => 'error',
                    'message' => 'You are not allowed to edit this feedback.',
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'feedback_comment' => 'required|string',
                'reference_url' => 'nullable|url|max:255',
                'reference_urls' => 'nullable|array',
                'reference_urls.*' => 'nullable|url|max:255',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
                'feedback_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
                // Multiple files: whitelist
                'reference_files' => 'nullable|array',
                'reference_files.*' => 'file|mimes:jpeg,png,jpg,gif,svg,webp,pdf,doc,docx,xls,xlsx,zip|max:5120',
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

            // Normalize feedback reference URLs
            $refUrls = [];
            if (!empty($data['reference_urls']) && is_array($data['reference_urls'])) {
                $refUrls = array_values(array_filter($data['reference_urls']));
            } elseif (!empty($data['reference_url'])) {
                $refUrls = [$data['reference_url']];
            }
            if (!empty($refUrls))
                $data['reference_urls'] = $refUrls;

            // Normalize image input key (reply uses image, top-level add used image; our edit may use feedback_image for top-level)
            if ($request->hasFile('image')) {
                $img = $request->file('image');
            } elseif ($request->hasFile('feedback_image')) {
                $img = $request->file('feedback_image');
            } else {
                $img = null;
            }

            if ($img) {
                $ext = $img->getClientOriginalExtension();
                $name = 'TASK_FEEDBACK_' . time() . '.' . $ext;
                $img->move(public_path('file/task'), $name);
                $data['image'] = $name;
            }

            // Handle existing file removals and new uploads
            $currentExisting = is_array($feedback->reference_files) ? $feedback->reference_files : [];
            // existing_reference_files may come as absolute URLs from the client; normalize to filenames
            $keptInput = $request->input('existing_reference_files');
            if (!empty($keptInput)) {
                $keptArr = json_decode($keptInput, true);
                if (!is_array($keptArr)) {
                    $keptArr = [];
                }
                // Extract filenames from absolute URLs or keep plain names
                $keptNames = array_map(function ($v) {
                    if (!is_string($v) || $v === '')
                        return null;
                    // If it's a URL/path, take the basename
                    $parts = parse_url($v);
                    if (isset($parts['path'])) {
                        return basename($parts['path']);
                    }
                    return basename($v);
                }, $keptArr);
                $keptNames = array_values(array_filter($keptNames));

                // Delete removed files from disk
                foreach ($currentExisting as $old) {
                    if (!in_array($old, $keptNames)) {
                        $path = public_path('file/task_reference_files/' . $old);
                        if (file_exists($path)) {
                            @unlink($path);
                        }
                    }
                }
                $currentExisting = $keptNames;
            }

            // Append new reference files if provided
            if ($request->hasFile('reference_files')) {
                foreach ($request->file('reference_files') as $idx => $file) {
                    $ext = $file->getClientOriginalExtension();
                    $name = 'TASK_FEEDBACK_' . time() . '_' . $idx . '.' . $ext;
                    $file->move(public_path('file/task_reference_files'), $name);
                    $currentExisting[] = $name;
                }
            }
            if (!empty($currentExisting) || $request->has('existing_reference_files')) {
                // If client sent existing_reference_files (even empty), persist currentExisting (possibly empty) to reflect removals
                $data['reference_files'] = $currentExisting;
            }

            // Only update allowed fields
            $feedback->feedback_comment = $data['feedback_comment'];
            // Update URLs (arrays + legacy single) respecting clears
            if (array_key_exists('reference_urls', $data)) {
                $feedback->reference_urls = $data['reference_urls'];
            }
            if (array_key_exists('reference_url', $data)) {
                $feedback->reference_url = $data['reference_url']; // may be null to clear
            }
            if (isset($data['image'])) {
                $feedback->image = $data['image'];
            }
            if (isset($data['reference_files'])) {
                $feedback->reference_files = $data['reference_files'];
            }

            if ($request->user()) {
                $feedback->updated_by = $request->user()->id;
            }

            $feedback->save();

            DB::commit();

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'message' => 'Task feedback updated successfully',
                'data' => $feedback,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'code' => $e->getCode() ?: 500,
                'status' => 'error',
                'message' => 'Failed to update feedback: ' . $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * Get task feedbacks for a specific task
     */
    public function getTaskFeedbacks($taskId)
    {
        try {
            // Fetch only top-level feedbacks
            $feedbacks = TaskFeedback::with(['employee.user', 'replies.employee.user'])
                ->where('task_id', $taskId)
                ->whereNull('parent_id')
                ->orderBy('created_at', 'desc')
                ->get();

            $formatOne = function ($feedback) use (&$formatOne) {
                $item = [
                    'id' => $feedback->id,
                    'parent_id' => $feedback->parent_id,
                    'feedback_comment' => $feedback->feedback_comment,
                    'image' => $feedback->image ? asset('file/task/' . $feedback->image) : null,
                    'reference_url' => $feedback->reference_url,
                    'reference_urls' => (function () use ($feedback) {
                        $arr = [];
                        if (is_array($feedback->reference_urls))
                            $arr = $feedback->reference_urls;
                        elseif (is_string($feedback->reference_urls) && $feedback->reference_urls !== '') {
                            $decoded = json_decode($feedback->reference_urls, true);
                            if (is_array($decoded))
                                $arr = $decoded;
                            else
                                $arr = array_filter(array_map('trim', explode(',', $feedback->reference_urls)));
                        }
                        if (empty($arr) && !empty($feedback->reference_url))
                            $arr = [$feedback->reference_url];
                        return $arr;
                    })(),
                    // Backward compatibility: single reference_file + new array reference_files
                    'reference_file' => $feedback->reference_file ? asset('file/task_reference_files/' . $feedback->reference_file) : null,
                    'reference_files' => (function () use ($feedback) {
                        $arr = [];
                        if (is_array($feedback->reference_files)) {
                            $arr = $feedback->reference_files;
                        } elseif (is_string($feedback->reference_files) && $feedback->reference_files !== '') {
                            $decoded = json_decode($feedback->reference_files, true);
                            if (is_array($decoded))
                                $arr = $decoded;
                            else
                                $arr = array_filter(array_map('trim', explode(',', $feedback->reference_files)));
                        }
                        return array_map(function ($f) {
                            return asset('file/task_reference_files/' . $f); }, $arr);
                    })(),
                    'created_at' => $feedback->created_at,
                    'employee' => [
                        'id' => $feedback->employee->id,
                        'name' => $feedback->employee->name,
                        'photo' => $feedback->employee->user && $feedback->employee->user->photo
                            ? asset($feedback->employee->user->photo)
                            : asset('asset/img/profile_picture/default.png'),
                    ],
                ];
                // Map nested replies (one-level for now)
                if ($feedback->replies && $feedback->replies->count() > 0) {
                    $item['replies'] = $feedback->replies->sortBy('created_at')->values()->map(function ($r) {
                        return [
                            'id' => $r->id,
                            'parent_id' => $r->parent_id,
                            'feedback_comment' => $r->feedback_comment,
                            'image' => $r->image ? asset('file/task/' . $r->image) : null,
                            'reference_url' => $r->reference_url,
                            'reference_urls' => (function () use ($r) {
                                $arr = [];
                                if (is_array($r->reference_urls))
                                    $arr = $r->reference_urls;
                                elseif (is_string($r->reference_urls) && $r->reference_urls !== '') {
                                    $decoded = json_decode($r->reference_urls, true);
                                    if (is_array($decoded))
                                        $arr = $decoded;
                                    else
                                        $arr = array_filter(array_map('trim', explode(',', $r->reference_urls)));
                                }
                                if (empty($arr) && !empty($r->reference_url))
                                    $arr = [$r->reference_url];
                                return $arr;
                            })(),
                            'reference_file' => $r->reference_file ? asset('file/task_reference_files/' . $r->reference_file) : null,
                            'reference_files' => (function () use ($r) {
                                $arr = [];
                                if (is_array($r->reference_files)) {
                                    $arr = $r->reference_files;
                                } elseif (is_string($r->reference_files) && $r->reference_files !== '') {
                                    $decoded = json_decode($r->reference_files, true);
                                    if (is_array($decoded))
                                        $arr = $decoded;
                                    else
                                        $arr = array_filter(array_map('trim', explode(',', $r->reference_files)));
                                }
                                return array_map(function ($f) {
                                    return asset('file/task_reference_files/' . $f); }, $arr);
                            })(),
                            'created_at' => $r->created_at,
                            'employee' => [
                                'id' => $r->employee->id,
                                'name' => $r->employee->name,
                                'photo' => $r->employee->user && $r->employee->user->photo
                                    ? asset($r->employee->user->photo)
                                    : asset('asset/img/profile_picture/default.png'),
                            ],
                        ];
                    });
                } else {
                    $item['replies'] = [];
                }
                return $item;
            };

            $formattedFeedbacks = $feedbacks->map($formatOne);

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
     * Get the latest single feedback for a task
     */
    public function getTaskLatestFeedback($taskId)
    {
        try {
            $employeeId = auth()->user()?->employee?->id;

            // Apply unread window using task read_markers (per-employee last_read_at)
            $lastReadAt = null;
            if ($employeeId) {
                $task = Task::find($taskId);
                if ($task && !empty($task->read_markers)) {
                    $markers = is_array($task->read_markers) ? $task->read_markers : (json_decode($task->read_markers, true) ?: []);
                    $lastReadAt = $markers[(string) $employeeId] ?? null;
                }
            }

            $latest = TaskFeedback::with(['employee.user'])
                ->where('task_id', $taskId)
                // Only show if not authored by current user
                ->when($employeeId, function ($q) use ($employeeId) {
                    $q->where('employee_id', '!=', $employeeId);
                })
                // Only show if it's newer than last read
                ->when($lastReadAt, function ($q) use ($lastReadAt) {
                    $q->where('created_at', '>', $lastReadAt);
                })
                ->orderBy('created_at', 'desc')
                ->first();

            if (!$latest) {
                // Return 200 with null data to avoid noisy 404s in the browser console
                return response()->json([
                    'code' => 200,
                    'status' => 'success',
                    'data' => null
                ]);
            }

            $payload = [
                'id' => $latest->id,
                'parent_id' => $latest->parent_id,
                'feedback_comment' => $latest->feedback_comment,
                'created_at' => $latest->created_at,
                'reference_files' => (function () use ($latest) {
                    $arr = [];
                    if (is_array($latest->reference_files))
                        $arr = $latest->reference_files;
                    elseif (is_string($latest->reference_files) && $latest->reference_files !== '') {
                        $decoded = json_decode($latest->reference_files, true);
                        if (is_array($decoded))
                            $arr = $decoded;
                        else
                            $arr = array_filter(array_map('trim', explode(',', $latest->reference_files)));
                    }
                    return array_map(function ($f) {
                        return asset('file/task_reference_files/' . $f); }, $arr);
                })(),
                'employee' => [
                    'id' => $latest->employee->id,
                    'name' => $latest->employee->name,
                    'photo' => $latest->employee->user && $latest->employee->user->photo
                        ? asset($latest->employee->user->photo)
                        : asset('asset/img/profile_picture/default.png'),
                ],
            ];

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => $payload,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'code' => $e->getCode() ?: 500,
                'status' => 'error',
                'message' => $e->getMessage(),
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
                return response()->json([
                    'code' => 401,
                    'status' => 'error',
                    'message' => 'Unauthorized',
                    'data' => [
                        'is_accepted' => false,
                        'task_id' => $taskId
                    ]
                ], 401);
            }

            $assignment = TaskAssignment::where('task_id', $taskId)
                ->where('employee_id', $user->employee->id)
                ->where('role', 'EXECUTOR')
                ->first();

            if (!$assignment) {
                // Return false instead of error if user is not assigned to this task
                return response()->json([
                    'code' => 200,
                    'status' => 'success',
                    'data' => [
                        'is_accepted' => false,
                        'task_id' => $taskId,
                        'message' => 'User is not assigned to this task'
                    ]
                ]);
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
                'message' => $e->getMessage(),
                'data' => [
                    'is_accepted' => false,
                    'task_id' => $taskId
                ]
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
     * Reject task assignment for executor (remove assignment for current user)
     */
    public function rejectTask(Request $request, $taskId)
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

            // Remove the assignment to represent rejection
            $assignment->delete();

            DB::commit();

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'message' => 'Task invitation rejected',
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
