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
use Illuminate\Support\Str;
// use Illuminate\Support\Carbon; // not used directly

class TaskController extends Controller
{
    /**
     * Resolve universal avatar for an employee (profile_picture > photo > user.photo > default)
     */
    private function resolveEmployeeAvatar($employee)
    {
        if (!$employee) return asset('asset/img/avatar.png');

        $raw = $employee->profile_picture ?: ($employee->photo ?: ($employee->user->photo ?? null));
        if (!$raw) return asset('asset/img/avatar.png');

        if (preg_match('/^(https?:)?\/\//', $raw)) return $raw; // already absolute

        $relative = ltrim($raw, '/');
        $publicPath = public_path($relative);
        if (!is_file($publicPath)) {
            return asset('asset/img/avatar.png');
        }
        return asset($relative);
    }
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
            $search = $request->input('search'); // optional search keyword
            $perPage = (int) $request->input('per_page', 10);
            $page = (int) $request->input('page', 1);

            $currentUserId = $currentUser?->id;
            $baseQuery = Task::with(['project', 'assignments.employee', 'feedback_comments'])
                ->where(function ($outer) use ($currentEmployeeId, $currentUserId) {
                    $outer->whereHas('assignments', function ($query) use ($currentEmployeeId) {
                        $query->where(function ($q) use ($currentEmployeeId) {
                            $q->where('employee_id', $currentEmployeeId)
                                ->where(function ($q2) {
                                    $q2->where('role', 'PIC')
                                    ->orWhere('role', 'EXECUTOR');
                                });
                        });
                    })
                    ->orWhere(function ($q) use ($currentUserId) {
                        if ($currentUserId) $q->where('created_by', $currentUserId);
                    });
                });

            if ($projectId) $baseQuery->where('project_id', $projectId);

            // ===== Tambah filter search =====
            if ($search) {
                $baseQuery->where(function($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
                });
            }

            $response = [];

            $currentEmployeePendingAcceptance = function ($q) use ($currentEmployeeId) {
                $q->whereHas('assignments', function ($a) use ($currentEmployeeId) {
                    $a->where('role', 'EXECUTOR')
                    ->where('employee_id', $currentEmployeeId)
                    ->where(function ($r) {
                        $r->whereNull('is_receive')->orWhere('is_receive', false);
                    });
                });
            };

            if ($statusFilter) {
                $query = clone $baseQuery;
                $normalizedFilter = $statusFilter;

                if ($normalizedFilter === 'in_progress') {
                    $query->whereIn('status', ['in_progress', 'rejected'])
                        ->where(function ($q) use ($currentEmployeeId) {
                            $q->whereDoesntHave('assignments', function ($a) use ($currentEmployeeId) {
                                $a->where('role', 'EXECUTOR')
                                    ->where('employee_id', $currentEmployeeId)
                                    ->where(function ($r) {
                                        $r->whereNull('is_receive')->orWhere('is_receive', false);
                                    });
                            });
                        });
                } elseif ($normalizedFilter === 'new_request') {
                    $query->where(function ($q) use ($currentEmployeePendingAcceptance) {
                        $q->where('status', 'new_request')
                        ->orWhere(function ($qq) use ($currentEmployeePendingAcceptance) { $currentEmployeePendingAcceptance($qq); });
                    });
                } elseif ($normalizedFilter === 'completed') {
                    $query->where('status', 'completed')
                        ->where(function ($q) use ($currentEmployeeId) {
                            $q->whereDoesntHave('assignments', function ($a) use ($currentEmployeeId) {
                                $a->where('role', 'EXECUTOR')
                                    ->where('employee_id', $currentEmployeeId)
                                    ->where(function ($r) {
                                        $r->whereNull('is_receive')->orWhere('is_receive', false);
                                    });
                            });
                        });
                } else {
                    $query->where('status', $normalizedFilter)
                        ->where(function ($q) use ($currentEmployeeId) {
                            $q->whereDoesntHave('assignments', function ($a) use ($currentEmployeeId) {
                                $a->where('role', 'EXECUTOR')
                                    ->where('employee_id', $currentEmployeeId)
                                    ->where(function ($r) {
                                        $r->whereNull('is_receive')->orWhere('is_receive', false);
                                    });
                            });
                        });
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
                // ===== NEW_REQUEST =====
                $newQuery = clone $baseQuery;
                $newQuery->where(function ($q) use ($currentEmployeePendingAcceptance) {
                    $q->where('status', 'new_request')
                    ->orWhere(function ($qq) use ($currentEmployeePendingAcceptance) { $currentEmployeePendingAcceptance($qq); });
                });
                $newPaginator = $newQuery->paginate($perPage, ['*'], 'new_request_page');
                $response['new_request'] = [
                    'tasks' => $this->mapTasks($newPaginator->items()),
                    'pagination' => [
                        'current_page' => $newPaginator->currentPage(),
                        'per_page' => $newPaginator->perPage(),
                        'total' => $newPaginator->total(),
                        'last_page' => $newPaginator->lastPage(),
                    ]
                ];

                // ===== IN_PROGRESS =====
                $progressQuery = clone $baseQuery;
                $progressQuery->whereIn('status', ['in_progress', 'rejected'])
                            ->where(function ($q) use ($currentEmployeeId) {
                                $q->whereDoesntHave('assignments', function ($a) use ($currentEmployeeId) {
                                    $a->where('role', 'EXECUTOR')
                                        ->where('employee_id', $currentEmployeeId)
                                        ->where(function ($r) {
                                            $r->whereNull('is_receive')->orWhere('is_receive', false);
                                        });
                                });
                            });
                $progressPaginator = $progressQuery->paginate($perPage, ['*'], 'in_progress_page');
                $response['in_progress'] = [
                    'tasks' => $this->mapTasks($progressPaginator->items()),
                    'pagination' => [
                        'current_page' => $progressPaginator->currentPage(),
                        'per_page' => $progressPaginator->perPage(),
                        'total' => $progressPaginator->total(),
                        'last_page' => $progressPaginator->lastPage(),
                    ]
                ];

                // ===== COMPLETED =====
                $completedQuery = clone $baseQuery;
                $completedQuery->where('status', 'completed')
                            ->where(function ($q) use ($currentEmployeeId) {
                                $q->whereDoesntHave('assignments', function ($a) use ($currentEmployeeId) {
                                    $a->where('role', 'EXECUTOR')
                                        ->where('employee_id', $currentEmployeeId)
                                        ->where(function ($r) {
                                            $r->whereNull('is_receive')->orWhere('is_receive', false);
                                        });
                                });
                            });
                $completedPaginator = $completedQuery->paginate($perPage, ['*'], 'completed_page');
                $response['completed'] = [
                    'tasks' => $this->mapTasks($completedPaginator->items()),
                    'pagination' => [
                        'current_page' => $completedPaginator->currentPage(),
                        'per_page' => $completedPaginator->perPage(),
                        'total' => $completedPaginator->total(),
                        'last_page' => $completedPaginator->lastPage(),
                    ]
                ];
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

            // Base query: show tasks where current employee is PIC/EXECUTOR OR tasks created by the current user
            $currentUserId = $currentUser?->id;
            $baseQuery = Task::with(['project', 'assignments.employee', 'feedback_comments'])
                ->where(function ($outer) use ($currentEmployeeId, $currentUserId) {
                    $outer->whereHas('assignments', function ($query) use ($currentEmployeeId) {
                        $query->where(function ($q) use ($currentEmployeeId) {
                            $q->where('employee_id', $currentEmployeeId)
                                ->where(function ($q2) {
                                    $q2->where('role', 'PIC')
                                        ->orWhere('role', 'EXECUTOR');
                                });
                        });
                    })
                    ->orWhere(function ($q) use ($currentUserId) {
                        if ($currentUserId) {
                            $q->where('created_by', $currentUserId);
                        }
                    });
                });

            if ($projectId) {
                $baseQuery->where('project_id', $projectId);
            }

            // Per-user pending acceptance (only tasks this user hasn't accepted as EXECUTOR)
            $userPending = function ($q) use ($currentEmployeeId) {
                $q->whereHas('assignments', function ($a) use ($currentEmployeeId) {
                    $a->where('role', 'EXECUTOR')
                        ->where('employee_id', $currentEmployeeId)
                        ->where(function ($r) {
                            $r->whereNull('is_receive')->orWhere('is_receive', false);
                        });
                });
            };

            // NOT STARTED: original new_request or userPending
            $notStarted = (clone $baseQuery)
                ->where(function ($q) use ($userPending) {
                    $q->whereIn(DB::raw('LOWER(status)'), ['new_request', 'new request'])
                      ->orWhere(function ($qq) use ($userPending) { $userPending($qq); });
                })
                ->orderBy('created_at', 'desc')
                ->get();

            $inProgress = (clone $baseQuery)
                ->whereIn(DB::raw('LOWER(status)'), ['in_progress', 'in progress'])
                ->where(function ($q) use ($currentEmployeeId) {
                    $q->whereDoesntHave('assignments', function ($a) use ($currentEmployeeId) {
                        $a->where('role', 'EXECUTOR')
                            ->where('employee_id', $currentEmployeeId)
                            ->where(function ($r) {
                                $r->whereNull('is_receive')->orWhere('is_receive', false);
                            });
                    });
                })
                ->orderBy('created_at', 'desc')
                ->get();

            $rejected = (clone $baseQuery)
                ->whereIn(DB::raw('LOWER(status)'), ['rejected'])
                ->where(function ($q) use ($currentEmployeeId) {
                    $q->whereDoesntHave('assignments', function ($a) use ($currentEmployeeId) {
                        $a->where('role', 'EXECUTOR')
                            ->where('employee_id', $currentEmployeeId)
                            ->where(function ($r) {
                                $r->whereNull('is_receive')->orWhere('is_receive', false);
                            });
                    });
                })
                ->orderBy('created_at', 'desc')
                ->get();

            $completed = (clone $baseQuery)
                ->whereIn(DB::raw('LOWER(status)'), ['completed'])
                ->where(function ($q) use ($currentEmployeeId) {
                    $q->whereDoesntHave('assignments', function ($a) use ($currentEmployeeId) {
                        $a->where('role', 'EXECUTOR')
                            ->where('employee_id', $currentEmployeeId)
                            ->where(function ($r) {
                                $r->whereNull('is_receive')->orWhere('is_receive', false);
                            });
                    });
                })
                ->orderBy('created_at', 'desc')
                ->get();

            // LATE keep original grouping (overdue but not completed). We don't exclude pending so a user still sees overdue tasks even if not yet accepted.
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
                $emp = $pic->employee;
                $raw = $emp->profile_picture ?: ($emp->photo ?: ($emp->user->photo ?? null));
                $resolved = $raw ? (preg_match('/^(https?:)?\/\//', $raw) ? $raw : asset($raw)) : asset('asset/img/avatar.png');
                $picData = [
                    'id' => $emp->id,
                    'name' => $emp->name,
                    'image' => $resolved,
                    'profile_picture' => $resolved,
                    'is_receive' => true,
                ];
            }

            $executorsData = $executors->map(function ($executor) {
                $emp = $executor->employee;
                $raw = $emp->profile_picture ?: ($emp->photo ?: ($emp->user->photo ?? null));
                $resolved = $raw ? (preg_match('/^(https?:)?\/\//', $raw) ? $raw : asset($raw)) : asset('asset/img/avatar.png');
                return [
                    'id' => $emp->id,
                    'name' => $emp->name,
                    'image' => $resolved,
                    'profile_picture' => $resolved,
                    'is_receive' => $executor->is_receive,
                    'role' => $executor->role,
                ];
            })->values();

            // Robust project image URL: absolute URLs are used as-is; for local files, ensure existence or fall back to default.
            $projectHasImage = false;
            $projectImageUrl = null; // null menandakan tidak ada gambar -> frontend akan render avatar inisial
            if ($task->project && $task->project->image) {
                $img = $task->project->image;
                $normalized = ltrim($img, '/');
                if (Str::startsWith($img, ['http://', 'https://'])) {
                    $projectImageUrl = $img;
                    $projectHasImage = true;
                } elseif (Str::startsWith($normalized, 'asset/')) {
                    $full = asset($normalized);
                    $projectImageUrl = $full;
                    $projectHasImage = true;
                } else {
                    if (!Str::startsWith($normalized, 'file/project/')) {
                        $normalized = 'file/project/' . $normalized;
                    }
                    $disk = public_path($normalized);
                    if (file_exists($disk)) {
                        $projectImageUrl = asset($normalized);
                        $projectHasImage = true;
                    }
                }
            }

            return [
                'id' => $task->id,
                'title' => $task->title,
                'description' => $task->description,
                'project_title' => $task->project?->title,
                'project_image' => $projectImageUrl, // null jika tidak ada gambar
                'project_has_image' => $projectHasImage,
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
                    'project_title' => $task->project?->title, // added for dashboard avatar initials
                    // counts for dashboard badges
                    'feedback_comments_count' => (int) ($task->feedback_comments_count ?? 0),
                    'reference_files_count' => is_array($task->reference_files) ? count($task->reference_files) : 0,
                    'project_image' => $projectImageUrl,
                    'pic' => $pic && $pic->employee ? [
                        'id' => $pic->employee->id,
                        'name' => $pic->employee->name,
                        'photo' => $this->resolveEmployeeAvatar($pic->employee),
                        'profile_picture' => $this->resolveEmployeeAvatar($pic->employee),
                    ] : null,
                    'executors' => $executors->map(function ($ex) {
                        return [
                            'id' => $ex->employee->id,
                            'name' => $ex->employee->name,
                            'photo' => $this->resolveEmployeeAvatar($ex->employee),
                            'profile_picture' => $this->resolveEmployeeAvatar($ex->employee),
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
                    'project_title' => $task->project?->title, // added for dashboard avatar initials
                    'feedback_comments_count' => (int) ($task->feedback_comments_count ?? 0),
                    'reference_files_count' => is_array($task->reference_files) ? count($task->reference_files) : 0,
                    'project_image' => $projectImageUrl,
                    'pic' => $pic && $pic->employee ? [
                        'id' => $pic->employee->id,
                        'name' => $pic->employee->name,
                        'photo' => $this->resolveEmployeeAvatar($pic->employee),
                        'profile_picture' => $this->resolveEmployeeAvatar($pic->employee),
                    ] : null,
                    'executors' => $executors->map(function ($ex) {
                        return [
                            'id' => $ex->employee->id,
                            'name' => $ex->employee->name,
                            'photo' => $this->resolveEmployeeAvatar($ex->employee),
                            'profile_picture' => $this->resolveEmployeeAvatar($ex->employee),
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
                    'user_photo' => $this->resolveEmployeeAvatar($pic->employee),
                    'profile_picture' => $this->resolveEmployeeAvatar($pic->employee),
                ] : [
                    'id' => null,
                    'name' => 'None',
                    'user_photo' => asset('asset/img/avatar.png'),
                    'profile_picture' => asset('asset/img/avatar.png'),
                ],

                // Executors dengan default
                'executors' => $executors->count() > 0
                    ? $executors->map(function ($executor) {
                        return [
                            'id' => $executor->employee->id,
                            'name' => $executor->employee->name ?? '',
                            'user_photo' => $this->resolveEmployeeAvatar($executor->employee),
                            'profile_picture' => $this->resolveEmployeeAvatar($executor->employee),
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
                    'user_photo' => $this->resolveEmployeeAvatar($executor->employee),
                    'profile_picture' => $this->resolveEmployeeAvatar($executor->employee),
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
                // Allow missing employee_id and fallback to authenticated user's employee id
                'employee_id' => 'nullable|exists:employees,id',
                'feedback_comment' => 'required|string',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
                // Accept alias coming from some legacy JS (feedback_image)
                'feedback_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
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

            // Fallback employee_id if not explicitly provided
            if (empty($data['employee_id']) && $request->user() && $request->user()->employee) {
                $data['employee_id'] = $request->user()->employee->id;
            }
            if (empty($data['employee_id'])) {
                return response()->json([
                    'code' => 422,
                    'status' => 'error',
                    'message' => 'Unable to resolve employee_id for feedback.'
                ], 422);
            }

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
            // Mulai sekarang project_id boleh null; tidak ada guard khusus di sini.

            // Ensure directories exist before file operations
            $taskImgDir = public_path('file/task');
            $taskRefDir = public_path('file/task_reference_files');
            if (!is_dir($taskImgDir)) {
                @mkdir($taskImgDir, 0775, true);
            }
            if (!is_dir($taskRefDir)) {
                @mkdir($taskRefDir, 0775, true);
            }

            // Handle image upload (accept both 'image' and 'feedback_image')
            $imageField = null;
            if ($request->hasFile('image')) {
                $imageField = 'image';
            } elseif ($request->hasFile('feedback_image')) {
                $imageField = 'feedback_image';
            }
            if ($imageField) {
                $imageFile = $request->file($imageField);
                $imageExtension = $imageFile->getClientOriginalExtension();
                $imageName = 'TASK_FEEDBACK_' . time() . '.' . $imageExtension;
                try {
                    $imageFile->move($taskImgDir, $imageName);
                    $data['image'] = $imageName;
                } catch (\Exception $e) {
                    return response()->json([
                        'code' => 500,
                        'status' => 'error',
                        'message' => 'Failed to store feedback image: ' . $e->getMessage(),
                    ], 500);
                }
            }

            // Handle reference files upload (multiple)
            $uploadedRefFiles = [];
            if ($request->hasFile('reference_files')) {
                foreach ($request->file('reference_files') as $idx => $file) {
                    if (!$file) { continue; }
                    $ext = $file->getClientOriginalExtension();
                    $name = 'TASK_FEEDBACK_' . time() . '_' . $idx . '.' . $ext;
                    try {
                        $file->move($taskRefDir, $name);
                        $uploadedRefFiles[] = $name;
                    } catch (\Exception $e) {
                        return response()->json([
                            'code' => 500,
                            'status' => 'error',
                            'message' => 'Failed to store one of the reference files: ' . $e->getMessage(),
                        ], 500);
                    }
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
            $rawCode = (string)$e->getCode();
            $httpCode = 500;
            if (in_array((int)$rawCode, [400,401,403,404,409,422])) {
                $httpCode = (int)$rawCode;
            } elseif ($rawCode === '23000') { // integrity constraint
                $httpCode = 422;
            }
            $message = 'Failed to submit feedback: ' . $e->getMessage();
            if ($rawCode === '23000') {
                $message = 'Gagal menyimpan feedback karena pelanggaran integritas data (kemungkinan project_id/task_id/employee_id tidak valid atau null). Pastikan task memiliki project & relasi benar.';
            }
            return response()->json([
                'code' => $httpCode,
                'status' => 'error',
                'message' => $message,
                'sqlstate' => $rawCode,
            ], $httpCode);
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
                        'photo' => $this->resolveEmployeeAvatar($feedback->employee),
                        'profile_picture' => $this->resolveEmployeeAvatar($feedback->employee),
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
                                'photo' => $this->resolveEmployeeAvatar($r->employee),
                                'profile_picture' => $this->resolveEmployeeAvatar($r->employee),
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
                    'photo' => $this->resolveEmployeeAvatar($latest->employee),
                    'profile_picture' => $this->resolveEmployeeAvatar($latest->employee),
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
                        'user_photo' => $this->resolveEmployeeAvatar($pic->employee),
                        'profile_picture' => $this->resolveEmployeeAvatar($pic->employee),
                    ];
                }

                // Get Executors
                $executors = $task->assignments->where('role', 'EXECUTOR');
                $executorsData = $executors->map(function ($executor) {
                    return [
                        'id' => $executor->employee->id,
                        'name' => $executor->employee->name ?? 'Unknown',
                        'user_photo' => $this->resolveEmployeeAvatar($executor->employee),
                        'profile_picture' => $this->resolveEmployeeAvatar($executor->employee),
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
            // Include user relation for legacy photo fallback; we'll compute a universal avatar.
            $employees = Employee::with('user')
                ->when($query !== '', function ($q) use ($query) {
                    $q->where('name', 'like', '%' . $query . '%');
                })
                ->orderBy('name')
                ->get();

            $mapped = $employees->map(function ($emp) {
                $resolved = $this->resolveEmployeeAvatar($emp);
                return [
                    'id' => $emp->id,
                    'name' => $emp->name,
                    // Keep legacy user_photo field (raw original user->photo if exists) for backward compatibility
                    'user_photo' => $emp->user && $emp->user->photo ? (preg_match('/^(https?:)?\/\//', $emp->user->photo) ? $emp->user->photo : asset(ltrim($emp->user->photo,'/'))) : null,
                    // Provide unified avatar fields consumed by buildPhotoUrl in task.js
                    'profile_picture' => $resolved,
                    'profile_picture_url' => $resolved,
                ];
            })->values();

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => $mapped
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
