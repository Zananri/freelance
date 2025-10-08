<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Project;
use App\Models\ProjectFeedback;
use App\Models\ProjectAssignment;
use App\Models\Employee;
use App\Models\Task;
use App\Models\Department;
use App\Models\Division;
use App\Models\Notification;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Color;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use Carbon\Carbon;

class ProjectController extends Controller
{
    /**
     * Safely derive a proper HTTP status code from an exception.
     * Falls back to 500 when the exception code is non-numeric or out of 4xx/5xx range.
     */
    private function deriveHttpStatusFromException(\Throwable $e): int
    {
        $code = $e->getCode();
        if (is_numeric($code)) {
            $int = (int) $code;
            if ($int >= 400 && $int <= 599) {
                return $int;
            }
        }
        return 500;
    }
    /**
     * Resolve universal avatar for an employee (profile_picture > photo > user.photo > default)
     */
    private function resolveEmployeeAvatar($employee)
    {
        // No employee object at all
        if (!$employee)
            return asset('asset/img/avatar.png');

        // Pick first non-empty source (guard against missing related user)
        $userPhoto = null;
        try {
            // Avoid triggering errors if relation is missing
            if (isset($employee->user) && $employee->user) {
                $userPhoto = $employee->user->photo ?? null;
            }
        } catch (\Throwable $t) {
            $userPhoto = null;
        }
        $raw = $employee->profile_picture ?: ($employee->photo ?: $userPhoto);
        if (!$raw)
            return asset('asset/img/avatar.png');

        // If already absolute (external or protocol-relative) just return
        if (preg_match('/^(https?:)?\/\//', $raw))
            return $raw; // already absolute URL

        // Normalize relative path
        $relative = ltrim($raw, '/');

        // Build public path (assuming uploaded files live under public/)
        try {
            $publicPath = public_path($relative);

            // If the file recorded in DB no longer exists on disk, fallback to default avatar
            if (!is_file($publicPath)) {
                return asset('asset/img/avatar.png');
            }

            return asset($relative);
        } catch (\Throwable $t) {
            // If any error with file operations, return default avatar
            return asset('asset/img/avatar.png');
        }
    }

    /**
     * Accept project assignment for the authenticated user.
     */
    public function acceptProject($id)
    {
        try {
            DB::beginTransaction();

            \Log::info("Accept project called for project ID: " . $id);

            $user = auth()->user();
            if (!$user || !$user->employee) {
                throw new \Exception('Unauthorized');
            }

            $employeeId = $user->employee->id;
            \Log::info("Employee ID: " . $employeeId);

            // Find the project assignment for this user and project
            $assignment = ProjectAssignment::where('project_id', $id)
                ->where('employee_id', $employeeId)
                ->first();

            \Log::info("Assignment found: " . ($assignment ? 'Yes' : 'No'));

            if (!$assignment) {
                throw new \Exception('Project assignment not found');
            }

            \Log::info("Assignment role: " . $assignment->role);
            \Log::info("Assignment is_receive before: " . ($assignment->is_receive ? 'true' : 'false'));

            // Update is_receive to true
            $assignment->is_receive = true;
            $assignment->save();

            \Log::info("Assignment is_receive after: " . ($assignment->is_receive ? 'true' : 'false'));

            // Mark related notification as read
            $notification = Notification::where('employee_id', $employeeId)
                ->where('type', 'new job')
                ->where(function ($query) use ($assignment) {
                    $query->where('title', 'like', '%co-author for project: ' . $assignment->project->title)
                        ->orWhere('title', 'like', '%contributor for project: ' . $assignment->project->title);
                })
                ->where('is_read', false)
                ->orderBy('created_at', 'desc')
                ->first();

            if ($notification) {
                $notification->is_read = true;
                $notification->save();
            }

            DB::commit();

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'message' => 'Project assignment accepted successfully',
                'reload' => true
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            $status = $this->deriveHttpStatusFromException($e);
            return response()->json([
                'code' => $status,
                'status' => "error",
                'message' => $e->getMessage()
            ], $status);
        }
    }

    /**
     * Check accept status for a project assignment.
     */
    public function checkAcceptStatus($id)
    {
        try {
            $user = auth()->user();
            if (!$user || !$user->employee) {
                return response()->json([
                    'code' => 200,
                    'status' => 'success',
                    'data' => ['is_accepted' => false]
                ]);
            }

            $employeeId = $user->employee->id;

            // Find the project assignment for this user and project
            $assignment = ProjectAssignment::where('project_id', $id)
                ->where('employee_id', $employeeId)
                ->first();

            $isAccepted = $assignment ? $assignment->is_receive : false;

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => ['is_accepted' => $isAccepted]
            ]);

        } catch (\Exception $e) {
            $status = $this->deriveHttpStatusFromException($e);
            return response()->json([
                'code' => $status,
                'status' => "error",
                'message' => $e->getMessage()
            ], $status);
        }
    }

    /**
     * Return JSON data for employees filtered by search query.
     */
    public function getEmployees(Request $request)
    {
        try {
            $query = $request->input('q', '');
            $excludeEmployeeId = $request->input('exclude_employee_id');

            $employees = Employee::query();

            if ($query !== '') {
                $employees = $employees->where('name', 'like', '%' . $query . '%');
            }

            if ($excludeEmployeeId) {
                $employees = $employees->where('id', '!=', $excludeEmployeeId);
            }

            $employees = $employees->orderBy('name')->get(['id', 'name', 'photo', 'profile_picture']);

            // Map to unified avatar fields (user_photo + profile_picture + profile_picture_url)
            $mappedEmployees = $employees->map(function ($emp) {
                $avatar = $this->resolveEmployeeAvatar($emp);
                return [
                    'id' => $emp->id,
                    'name' => $emp->name,
                    'user_photo' => $avatar, // backward compatibility
                    'profile_picture' => $avatar,
                    'profile_picture_url' => $avatar,
                ];
            });

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => $mappedEmployees
            ]);

        } catch (\Exception $e) {
            $status = $this->deriveHttpStatusFromException($e);
            return response()->json([
                'code' => $status,
                'status' => "error",
                'message' => $e->getMessage()
            ], $status);
        }
    }

    /**
     * Display the project main page.
     */
    public function showProjectPage()
    {
        return view('project/project');
    }

    /**
     * Return JSON data for project assignments with employee names and project titles.
     */
    public function getProjectAssignments()
    {
        try {
            $assignments = ProjectAssignment::with(['employee', 'project'])->get();

            $assignmentsTransformed = $assignments->map(function ($assignment) {
                return [
                    'id' => $assignment->id,
                    'role' => $assignment->role,
                    'employee_id' => $assignment->employee_id,
                    'employee_name' => $assignment->employee ? $assignment->employee->name : null,
                    'project_id' => $assignment->project_id,
                    'project_title' => $assignment->project ? $assignment->project->title : null,
                ];
            });

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => $assignmentsTransformed
            ]);

        } catch (\Exception $e) {
            $status = $this->deriveHttpStatusFromException($e);
            return response()->json([
                'code' => $status,
                'status' => "error",
                'message' => $e->getMessage()
            ], $status);
        }
    }

    /**
     * Return JSON data for project cards with counts zero.
     */
    public function getCardData(Request $request)
    {
        try {
            $user = $request->user();
            $employeeId = $user && $user->employee ? $user->employee->id : null;

            $projectsQuery = Project::where('status', '!=', 'DELETED')
                ->where(function ($q) use ($employeeId) {
                    $q->whereNull('project_type')
                      ->orWhere('project_type', 'public');

                    if ($employeeId) {
                        $q->orWhere(function ($qq) use ($employeeId) {
                            $qq->where('project_type', 'private')
                               ->whereHas('projectAssignments', function ($q2) use ($employeeId) {
                                    $q2->where('employee_id', $employeeId)
                                       ->where('role', 'author');
                               });
                        });
                    }
                });

            $projects = $projectsQuery->get(['id', 'title', 'image']);
            $projectIds = $projects->pluck('id')->toArray();
            $projectTitles = $projects->pluck('title')->toArray();
            $projectImages = $projects->pluck('image')->toArray();

            $data = [
                'task' => 0,
                'in_progress' => 0,
                'completed' => 0,
                'project_ids' => $projectIds,
                'project_titles' => $projectTitles,
                'project_images' => $projectImages,
            ];

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => $data
            ]);

        } catch (\Exception $e) {
            $status = $this->deriveHttpStatusFromException($e);
            return response()->json([
                'code' => $status,
                'status' => "error",
                'message' => $e->getMessage()
            ], $status);
        }
    }

    public function index(Request $request)
    {
        try {
            $user = auth()->user();
            $employeeId = $user && $user->employee ? $user->employee->id : null;
            $filter = $request->input('filter', null);
            $includeUnaccepted = $request->input('include_unaccepted', false);
            $taskScopeRaw = strtolower($request->input('task_scope', 'project'));
            $taskScope = in_array($taskScopeRaw, ['project', 'me', 'all']) ? $taskScopeRaw : 'project';

            if ($taskScope === 'all') {
                // For 'all' scope (used by global listings and task dropdowns), expose public projects
                // and also allow the authenticated creator to see their own private projects.
                $projects = Project::where('status', '!=', 'DELETED')
                    ->where(function ($q) use ($user) {
                        $q->whereNull('project_type')
                          ->orWhere('project_type', 'public');
                        // Include private projects authored/created by current authenticated user
                        try {
                            if ($user && $user->id) {
                                $q->orWhere(function ($qq) use ($user) {
                                    $qq->where('project_type', 'private')
                                       ->where('created_by', $user->id);
                                });
                            }
                        } catch (\Throwable $_) {
                            // ignore and continue with public-only fallback
                        }
                    })
                    ->with([
                        'department',
                        'division',
                        'projectAssignments.employee.user',
                    ])
                    ->withCount([
                        // Count only active tasks (exclude canceled and deleted)
                        'tasks as total_tasks' => function ($q) {
                            $q->whereRaw('LOWER(status) NOT IN (?, ?)', ['canceled', 'deleted']);
                        },
                        'tasks as in_progress_tasks' => fn($q) =>
                            $q->whereIn(DB::raw('LOWER(status)'), ['in_progress', 'in progress', 'rejected']),
                        'tasks as rejected_tasks' => fn($q) =>
                            $q->whereIn(DB::raw('LOWER(status)'), ['rejected']),
                        'tasks as completed_tasks' => fn($q) =>
                            $q->whereIn(DB::raw('LOWER(status)'), ['completed']),
                        'tasks as late_tasks' => fn($q) =>
                            $q->whereRaw('LOWER(status) <> ?', ['completed'])
                                ->whereNotNull('due_date')
                                ->where('due_date', '<', now()),
                    ])
                    ->withMin('tasks', 'start_date')
                    ->withMax('tasks', 'due_date')
                    ->get();

                $projectsTransformed = $projects->map(fn($project) => $this->transformProject($project));

                return response()->json([
                    'code' => 200,
                    'status' => 'success',
                    'data' => $projectsTransformed,
                ]);
            }

            if (!$employeeId) {
                return response()->json([
                    'code' => 200,
                    'status' => 'success',
                    'data' => []
                ]);
            }

            $query = Project::where('status', '!=', 'DELETED')
                // The employee must be assigned to the project (author/co_author/contributor)
                ->whereHas('projectAssignments', function ($query) use ($employeeId, $includeUnaccepted) {
                    $query->where('employee_id', $employeeId)
                        ->whereIn('role', ['author', 'co_author', 'contributor']);
                    if (!$includeUnaccepted) {
                        $query->where(function ($q) {
                            $q->where('role', 'author')
                                ->orWhere('is_receive', true);
                        });
                    }
                })
                // Additionally, prevent showing PRIVATE projects to non-authors in dropdowns:
                // only projects that are public (or null project_type) OR private projects where
                // the current employee is the author should be visible here.
                ->where(function ($q) use ($employeeId) {
                    $q->whereNull('project_type')
                      ->orWhere('project_type', 'public')
                      ->orWhere(function ($qq) use ($employeeId) {
                          $qq->where('project_type', 'private')
                             ->whereHas('projectAssignments', function ($q2) use ($employeeId) {
                                 $q2->where('employee_id', $employeeId)
                                    ->where('role', 'author');
                             });
                      });
                });

            if ($filter === 'not_started') {
                // New Request: Project tanpa task ATAU semua task berstatus new_request
                $query->where(function ($q) {
                    $q->whereDoesntHave('tasks')
                        ->orWhereIn('projects.id', function ($subquery) {
                            $subquery->from('tasks')
                                ->selectRaw('project_id')
                                ->groupBy('project_id')
                                ->havingRaw('COUNT(*) = SUM(CASE WHEN status = "new_request" THEN 1 ELSE 0 END)');
                        });
                });
            } elseif ($filter === 'in_progress') {
                // On Progress: Project yang memiliki campuran status task
                $query->whereHas('tasks')
                    ->whereNotIn('projects.id', function ($subquery) {
                        // Exclude projects where ALL tasks are completed
                        $subquery->from('tasks')
                            ->selectRaw('project_id')
                            ->groupBy('project_id')
                            ->havingRaw('COUNT(*) = SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END)');
                    })
                    ->whereNotIn('projects.id', function ($subquery) {
                        // Exclude projects where ALL tasks are new_request
                        $subquery->from('tasks')
                            ->selectRaw('project_id')
                            ->groupBy('project_id')
                            ->havingRaw('COUNT(*) = SUM(CASE WHEN status = "new_request" THEN 1 ELSE 0 END)');
                    });
            } elseif ($filter === 'completed') {
                // Complete: Project dimana SEMUA task berstatus completed
                $query->whereIn('projects.id', function ($subquery) {
                    $subquery->from('tasks')
                        ->selectRaw('project_id')
                        ->groupBy('project_id')
                        ->havingRaw('COUNT(*) = SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END)')
                        ->havingRaw('COUNT(*) > 0'); // Pastikan ada task
                });
            }

            $projects = $query->with([
                'department',
                'division',
                'projectAssignments.employee.user',
            ])
                ->withCount([
                    'tasks as total_tasks' => function ($q) {
                        $q->whereRaw('LOWER(status) NOT IN (?, ?)', ['canceled', 'deleted']);
                    },
                    'tasks as in_progress_tasks' => function ($q) use ($taskScope, $employeeId) {
                        if ($taskScope === 'me') {
                            $q->whereHas('assignments', function ($q2) use ($employeeId) {
                                $q2->where('employee_id', $employeeId)
                                    ->where(function ($roleQ) {
                                        $roleQ->where('role', 'PIC')
                                            ->orWhere(fn($execQ) =>
                                                $execQ->where('role', 'EXECUTOR')->where('is_receive', true));
                                    });
                            });
                        }
                        $q->whereIn(DB::raw('LOWER(status)'), ['in_progress', 'in progress', 'rejected']);
                    },
                    'tasks as rejected_tasks' => fn($q) =>
                        $q->whereIn(DB::raw('LOWER(status)'), ['rejected']),
                    'tasks as completed_tasks' => fn($q) =>
                        $q->whereIn(DB::raw('LOWER(status)'), ['completed']),
                    'tasks as late_tasks' => fn($q) =>
                        $q->whereRaw('LOWER(status) <> ?', ['completed'])
                            ->whereNotNull('due_date')
                            ->where('due_date', '<', now()),
                ])
                ->withMin('tasks', 'start_date')
                ->withMax('tasks', 'due_date')
                ->get();

            $projectsTransformed = $projects->map(fn($project) => $this->transformProject($project));

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => $projectsTransformed
            ]);

        } catch (\Exception $e) {
            $status = $this->deriveHttpStatusFromException($e);
            return response()->json([
                'code' => $status,
                'status' => "error",
                'message' => $e->getMessage()
            ], $status);
        }
    }

    protected function transformProject($project)
    {
        $projectAssignments = $project->projectAssignments->map(function ($assignment) {
            $employee = $assignment->employee;
            $avatar = $this->resolveEmployeeAvatar($employee);
            return [
                'id' => $assignment->id,
                'role' => $assignment->role,
                'employee_id' => $assignment->employee_id,
                'employee_name' => $employee?->name,
                'project_id' => $assignment->project_id,
                'project_title' => $assignment->project?->title,
                'user_photo' => $avatar, // backward compatibility
                'profile_picture' => $avatar,
                'profile_picture_url' => $avatar,
            ];
        });

        $author = $projectAssignments->firstWhere('role', 'author');
        $coAuthors = $projectAssignments->where('role', 'co_author')->values();
        $contributors = $projectAssignments->where('role', 'contributor')->values();

        // Calculate timeline start and due based on project and tasks
        $minStart = $project->tasks_min_start_date;
        $maxDue = $project->tasks_max_due_date;
        $start = $project->start_date;
        $due = $project->due_date;
        if ($minStart && (!$start || $minStart < $start))
            $start = $minStart;
        if ($maxDue && (!$due || $maxDue > $due))
            $due = $maxDue;

        return [
            'id' => $project->id,
            'title' => $project->title,
            'description' => $project->description,
            'image' => $project->image,
            'department' => $project->department,
            'division' => $project->division,
            'status' => $project->status,
            'project_assignments' => $projectAssignments,
            'author' => $author,
            'co_authors' => $coAuthors,
            'contributors' => $contributors,
            'task_counts' => [
                'total' => $project->total_tasks,
                'in_progress' => $project->in_progress_tasks,
                'rejected' => $project->rejected_tasks,
                'completed' => $project->completed_tasks,
                'late' => $project->late_tasks,
            ],
            'start_date' => $start,
            'due_date' => $due,
        ];
    }


    public function getAllProjects(Request $request)
    {
        try {
            $user = auth()->user();
            $employeeId = $user && $user->employee ? $user->employee->id : null;
            $filter = $request->input('filter', null);
            $search = trim((string) $request->input('search', ''));
            $sortBy = strtolower($request->input('sort_by', 'asc'));
            // New: optional project/date filters (By Project / By Date)
            $projectIdFilter = $request->input('project_id');
            $dateFilter = trim((string) $request->input('date', ''));
            $includeUnaccepted = $request->input('include_unaccepted', false);
            $taskScope = strtolower($request->input('task_scope', 'project'));
            $taskScope = in_array($taskScope, ['project', 'me', 'all']) ? $taskScope : 'project';

            if (!$employeeId && $taskScope !== 'all') {
                return response()->json([
                    'code' => 200,
                    'status' => 'success',
                    'data' => [],
                    'pagination' => [
                        'total' => 0,
                        'per_page' => 9,
                        'current_page' => 1,
                        'last_page' => 1,
                    ]
                ]);
            }

            // Only public projects should be visible in general listing used by dropdowns unless task_scope=all
            // For private projects, only the author (creator) may see them in the general listing.
            $query = Project::where('status', '!=', 'DELETED')
                ->where(function ($q) use ($employeeId) {
                    $q->whereNull('project_type')
                      ->orWhere('project_type', 'public');

                    if ($employeeId) {
                        // include private projects only when the current employee is the author
                        $q->orWhere(function ($qq) use ($employeeId) {
                            $qq->where('project_type', 'private')
                               ->whereHas('projectAssignments', function ($q2) use ($employeeId) {
                                    $q2->where('employee_id', $employeeId)
                                       ->where('role', 'author');
                               });
                        });
                    }
                });

            // Handle sorting options
            switch ($sortBy) {
                case 'title_asc':
                    $query = $query->orderBy('projects.title', 'asc');
                    break;
                case 'title_desc':
                    $query = $query->orderBy('projects.title', 'desc');
                    break;
                case 'date_asc':
                case 'oldest':
                case 'asc':
                    $query = $query->orderBy('projects.created_at', 'asc');
                    break;
                case 'date_desc':
                case 'newest':
                case 'desc':
                    $query = $query->orderBy('projects.created_at', 'desc');
                    break;
                default:
                    $query = $query->orderBy('projects.title', 'asc');
            }

            if ($taskScope !== 'all') {
                // Only include projects where current employee is assigned.
                // Authors should always see their projects (even if is_receive not set).
                // Co-authors and contributors should only see projects they've accepted (is_receive = true)
                $query->whereHas('projectAssignments', function ($q) use ($employeeId, $includeUnaccepted) {
                    $q->where('employee_id', $employeeId)
                        ->whereIn('role', ['author', 'co_author', 'contributor']);
                    if (!$includeUnaccepted) {
                        $q->where(function ($sub) {
                            $sub->where('role', 'author')
                                ->orWhere('is_receive', true);
                        });
                    }
                });
            }

            // Optional text search across project fields and related department/division
            if ($search !== '') {
                $like = "%" . $search . "%";
                $query->where(function ($q) use ($like, $search) {
                    $q->where('projects.title', 'like', $like)
                        ->orWhere('projects.description', 'like', $like);
                    // If numeric, also allow direct ID match
                    if (is_numeric($search)) {
                        $q->orWhere('projects.id', (int) $search);
                    }
                    // Department name (name_department)
                    $q->orWhereHas('department', function ($qd) use ($like) {
                        $qd->where('name_department', 'like', $like);
                    });
                    // Division name (name_division)
                    $q->orWhereHas('division', function ($qv) use ($like) {
                        $qv->where('name_division', 'like', $like);
                    });
                });
            }

            if ($filter === 'not_started') {
                // New Request: Project tanpa task ATAU semua task berstatus new_request
                $query->where(function ($q) {
                    $q->whereDoesntHave('tasks')
                        ->orWhereIn('projects.id', function ($subquery) {
                            $subquery->from('tasks')
                                ->selectRaw('project_id')
                                ->groupBy('project_id')
                                ->havingRaw('COUNT(*) = SUM(CASE WHEN status = "new_request" THEN 1 ELSE 0 END)');
                        });
                });
            } elseif ($filter === 'in_progress') {
                // On Progress: Project yang memiliki campuran status task
                $query->whereHas('tasks')
                    ->whereNotIn('projects.id', function ($subquery) {
                        // Exclude projects where ALL tasks are completed
                        $subquery->from('tasks')
                            ->selectRaw('project_id')
                            ->groupBy('project_id')
                            ->havingRaw('COUNT(*) = SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END)');
                    })
                    ->whereNotIn('projects.id', function ($subquery) {
                        // Exclude projects where ALL tasks are new_request
                        $subquery->from('tasks')
                            ->selectRaw('project_id')
                            ->groupBy('project_id')
                            ->havingRaw('COUNT(*) = SUM(CASE WHEN status = "new_request" THEN 1 ELSE 0 END)');
                    });
            } elseif ($filter === 'completed') {
                // Complete: Project dimana SEMUA task berstatus completed
                $query->whereIn('projects.id', function ($subquery) {
                    $subquery->from('tasks')
                        ->selectRaw('project_id')
                        ->groupBy('project_id')
                        ->havingRaw('COUNT(*) = SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END)')
                        ->havingRaw('COUNT(*) > 0'); // Pastikan ada task
                });
            }

            // Apply project_id filter (By Project)
            if (!is_null($projectIdFilter) && $projectIdFilter !== '') {
                $pid = (int) $projectIdFilter;
                if ($pid > 0) {
                    $query->where('projects.id', $pid);
                }
            }

            // Apply date filter (By Date) - match start_date only
            if ($dateFilter !== '') {
                // Expecting YYYY-MM-DD; apply safe match against project start_date only
                $query->whereDate('projects.start_date', $dateFilter);
            }

            $projects = $query
                ->with([
                    'department',
                    'division',
                    'projectAssignments.employee.user',
                ])
                ->withCount([
                    'tasks as total_tasks' => function ($q) {
                        $q->whereRaw('LOWER(status) NOT IN (?, ?)', ['canceled', 'deleted']);
                    },
                    'tasks as in_progress_tasks' => function ($q) {
                        $q->whereIn(DB::raw('LOWER(status)'), ['in_progress', 'rejected']);
                    },
                    'tasks as completed_tasks' => function ($q) {
                        $q->where('status', 'completed');
                    },
                    'tasks as late_tasks' => fn($q) =>
                        $q->whereRaw('LOWER(status) <> ?', ['completed'])
                            ->whereNotNull('due_date')
                            ->where('due_date', '<', now()),
                ])
                ->paginate(9);

            $projectsTransformed = $projects->map(function ($project) {
                $projectAssignments = $project->projectAssignments->map(function ($a) {
                    $employee = $a->employee;
                    $avatar = $this->resolveEmployeeAvatar($employee);
                    return [
                        'id' => $a->id,
                        'role' => $a->role,
                        'employee_id' => $a->employee_id,
                        'employee_name' => $employee?->name,
                        'user_photo' => $avatar,
                        'profile_picture' => $avatar,
                        'profile_picture_url' => $avatar,
                    ];
                });

                $author = $projectAssignments->firstWhere('role', 'author');
                $coAuthors = $projectAssignments->where('role', 'co_author')->values();
                $contributors = $projectAssignments->where('role', 'contributor')->values();

                return [
                    'id' => $project->id,
                    'title' => $project->title,
                    'description' => $project->description,
                    'image' => $project->image,
                    'status' => $project->status,
                    'department' => $project->department,
                    'division' => $project->division,
                    'author' => $author,
                    'co_authors' => $coAuthors,
                    'contributors' => $contributors,
                    'project_assignments' => $projectAssignments,
                    'task_counts' => [
                        'total' => $project->total_tasks,
                        'in_progress' => $project->in_progress_tasks,
                        'completed' => $project->completed_tasks,
                        'late' => $project->late_tasks,
                    ]
                ];
            });

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => $projectsTransformed,
                'pagination' => [
                    'total' => $projects->total(),
                    'per_page' => $projects->perPage(),
                    'current_page' => $projects->currentPage(),
                    'last_page' => $projects->lastPage(),
                ]
            ]);
        } catch (\Exception $e) {
            $status = $this->deriveHttpStatusFromException($e);
            return response()->json([
                'code' => $status,
                'status' => 'error',
                'message' => $e->getMessage()
            ], $status);
        }
    }

    /**
     * Show the form for creating a new project.
     */
    public function create()
    {
        return response()->json([
            'code' => 200,
            'status' => 'success',
            'message' => 'Use frontend modal for create form'
        ]);
    }

    /**
     * Store a newly created project in storage.
     */
    public function store(Request $request)
    {
        DB::beginTransaction();
        try {
            if ($request->has('co_author') && is_string($request->co_author)) {
                $request->merge(['co_author' => json_decode($request->co_author, true)]);
            }
            if ($request->has('contributors') && is_string($request->contributors)) {
                $request->merge(['contributors' => json_decode($request->contributors, true)]);
            }

            $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'required|string',
                // department/division will be derived from authenticated employee; keep optional in request
                'department' => 'nullable|exists:departments,id',
                'division' => 'nullable|exists:divisions,id',
                'status' => 'string|max:50',
                // Accept both single and multiple reference URLs
                'reference_url' => 'nullable|url',
                'reference_urls' => 'nullable|array',
                'reference_urls.*' => 'nullable|url',
                'start_date' => 'required|date',
                'due_date' => 'required|date|after_or_equal:start_date',
                'part_of_project' => 'nullable|exists:projects,id',
                'co_author' => 'nullable|array',
                'co_author.*' => 'nullable|exists:employees,id',
                'contributors' => 'nullable|array',
                'contributors.*' => 'nullable|exists:employees,id',
                'complete_date' => 'nullable|date',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:10240',
                // Allow multiple reference files (both new and legacy keys) with Task's whitelist and 5MB limit
                'reference_files' => 'nullable|array',
                'reference_files.*' => [
                    'file',
                    'max:102400',
                    function ($attribute, $value, $fail) {
                        $allowedExt = ['jpeg', 'png', 'jpg', 'gif', 'svg', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'zip', 'csv'];
                        $allowedMime = [
                            'application/vnd.ms-excel',
                            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                            'text/csv',
                            'application/csv',
                            'application/octet-stream',
                        ];
                        try {
                            $ext = strtolower((string) ($value->getClientOriginalExtension() ?? ''));
                            if (in_array($ext, $allowedExt, true))
                                return;
                            $mime = strtolower((string) ($value->getClientMimeType() ?? ''));
                            if (in_array($mime, $allowedMime, true))
                                return;
                        } catch (\Throwable $_) {
                        }
                        $fail('The ' . $attribute . ' must be a supported file type (images, pdf, doc/docx, xls/xlsx, csv or zip).');
                    }
                ],
                'reference_file' => 'nullable|array',
                'reference_file.*' => [
                    'file',
                    'max:102400',
                    function ($attribute, $value, $fail) {
                        $allowedExt = ['jpeg', 'png', 'jpg', 'gif', 'svg', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'zip', 'csv'];
                        $allowedMime = [
                            'application/vnd.ms-excel',
                            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                            'text/csv',
                            'application/csv',
                            'application/octet-stream',
                        ];
                        try {
                            $ext = strtolower((string) ($value->getClientOriginalExtension() ?? ''));
                            if (in_array($ext, $allowedExt, true))
                                return;
                            $mime = strtolower((string) ($value->getClientMimeType() ?? ''));
                            if (in_array($mime, $allowedMime, true))
                                return;
                        } catch (\Throwable $_) {
                        }
                        $fail('The ' . $attribute . ' must be a supported file type (images, pdf, doc/docx, xls/xlsx, csv or zip).');
                    }
                ],

            ]);

            // Force department/division to be the one of the authenticated employee
            $authEmp = auth()->user()->employee ?? null;
            if (!$authEmp)
                throw new \Exception('Authenticated user has no employee relation');

            $departmentIdToUse = $authEmp->department_id;

            // If client provided division, ensure it belongs to employee department; otherwise leave null
            $providedDivision = $request->input('division');
            if ($providedDivision) {
                $div = Division::where('id', $providedDivision)->where('department_id', $departmentIdToUse)->first();
                if (!$div) {
                    throw new \Exception('Selected division is invalid for your department');
                }
                $divisionIdToUse = $providedDivision;
            } else {
                $divisionIdToUse = null;
            }

            $project = new Project();
            $project->title = $request->title;
            // project_type is optional: default to public
            $project->project_type = in_array($request->input('project_type'), ['public', 'private']) ? $request->input('project_type') : 'public';
            $project->description = $request->description;
            $project->department_id = $departmentIdToUse;
            $project->division_id = $divisionIdToUse;
            $project->status = $request->status ?? 'ACTIVE';
            // Normalize reference URLs
            $refUrls = [];
            if ($request->has('reference_urls') && is_array($request->reference_urls)) {
                $refUrls = array_values(array_filter($request->reference_urls));
            } elseif (!empty($request->reference_url)) {
                $refUrls = [$request->reference_url];
            }
            $project->reference_urls = $refUrls;
            // Mirror first into legacy single field for backward compatibility
            $project->reference_url = count($refUrls) ? $refUrls[0] : null;
            $project->start_date = $request->start_date;
            $project->due_date = $request->due_date;
            $project->part_of_project = $request->part_of_project;
            $project->complete_date = $request->complete_date;
            $project->created_by = auth()->user() ? auth()->user()->id : null;
            $project->updated_by = auth()->user() ? auth()->user()->id : null;
            $project->deleted_by = null;

            // Handle image upload
            if ($request->hasFile('image')) {
                $image = $request->file('image');
                $imageName = 'PROJECT_' . time() . '.' . $image->getClientOriginalExtension();
                $image->move(public_path('file/project'), $imageName);
                $project->image = $imageName;
            }

            // Handle reference file uploads from either reference_files[] (preferred) or reference_file[] (legacy)
            $uploadedFiles = [];
            $incomingFiles = [];
            if ($request->hasFile('reference_files')) {
                $rf = $request->file('reference_files');
                $incomingFiles = array_merge($incomingFiles, is_array($rf) ? $rf : [$rf]);
            }
            if ($request->hasFile('reference_file')) {
                $rfLegacy = $request->file('reference_file');
                $incomingFiles = array_merge($incomingFiles, is_array($rfLegacy) ? $rfLegacy : [$rfLegacy]);
            }
            foreach ($incomingFiles as $idx => $file) {
                if (!$file)
                    continue;
                $fileName = 'PROJECT_REF_' . time() . '_' . $idx . '_' . Str::random(5) . '.' . $file->getClientOriginalExtension();
                $file->move(public_path('file/project'), $fileName);
                $uploadedFiles[] = $fileName;
            }
            // If any files uploaded, set as array; otherwise keep null
            if (count($uploadedFiles)) {
                $project->reference_files = $uploadedFiles; // primary storage
            }

            $project->save();

            // Insert author assignment
            if (auth()->check()) {
                $employee = auth()->user()->employee;
                if ($employee) {
                    ProjectAssignment::create([
                        'project_id' => $project->id,
                        'employee_id' => $employee->id,
                        'role' => 'author',
                        'created_at' => now(),
                        'updated_at' => now(),
                        'created_by' => auth()->user() ? auth()->user()->id : null,
                        'updated_by' => auth()->user() ? auth()->user()->id : null,
                        'deleted_by' => null
                    ]);
                } else {
                    throw new \Exception('Authenticated user has no employee relation');
                }
            } else {
                throw new \Exception('User not authenticated');
            }

            // Insert co_author assignments and create notifications
            if ($request->co_author && is_array($request->co_author)) {
                $coAuthorAssignments = [];
                foreach ($request->co_author as $employeeId) {
                    if (!Employee::where('id', $employeeId)->exists()) {
                        throw new \Exception("Co-author employee ID {$employeeId} does not exist");
                    }

                    $coAuthorAssignments[] = [
                        'project_id' => $project->id,
                        'employee_id' => $employeeId,
                        'role' => 'co_author',
                        'is_receive' => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];

                    // Create notification for co-author
                    $authorEmployee = auth()->user()->employee;
                    Notification::create([
                        'employee_id' => $employeeId,
                        'type' => 'new job',
                        'title' => 'You have been assigned as co-author for project: ' . $project->title,
                        'message' => 'You have been assigned as co-author for project: ' . $project->title,
                        'sent_at' => now(),
                        'created_by' => $authorEmployee ? $authorEmployee->id : null,
                        'updated_at' => now(),
                        'created_at' => now(),
                    ]);
                }
                ProjectAssignment::insert($coAuthorAssignments);
            }

            // Insert contributor assignments and create notifications
            if ($request->contributors && is_array($request->contributors)) {
                $contributorAssignments = [];
                foreach ($request->contributors as $employeeId) {
                    if (!Employee::where('id', $employeeId)->exists()) {
                        throw new \Exception("Contributor employee ID {$employeeId} does not exist");
                    }

                    $contributorAssignments[] = [
                        'project_id' => $project->id,
                        'employee_id' => $employeeId,
                        'role' => 'contributor',
                        'is_receive' => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];

                    // Create notification for contributor
                    $authorEmployee = auth()->user()->employee;
                    Notification::create([
                        'employee_id' => $employeeId,
                        'type' => 'new job',
                        'title' => 'You have been assigned as contributor for project: ' . $project->title,
                        'message' => 'You have been assigned as contributor for project: ' . $project->title,
                        'sent_at' => now(),
                        'created_by' => $authorEmployee ? $authorEmployee->id : null,
                        'updated_at' => now(),
                        'created_at' => now(),
                    ]);
                }
                ProjectAssignment::insert($contributorAssignments);
            }

            DB::commit();

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'message' => 'Project created successfully',
                'project' => $project
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            $status = $this->deriveHttpStatusFromException($e);
            return response()->json([
                'code' => $status,
                'status' => "error",
                'message' => $e->getMessage()
            ], $status);
        }
    }

    /**
     * Display the specified project.
     */
    // Accept optional slug parameter for friendly URLs; slug is ignored server-side
    // If the request expects JSON (AJAX/API), return JSON payload as before.
    // For normal browser navigation, render the Blade view so the user sees the project page.
    public function show(Request $request, string $id, $slug = null)
    {
        try {
            // If the request expects JSON (AJAX / API), return the JSON payload as before.
            // For normal browser navigation, render the Blade view so the user sees the page.
            $expectsJson = $request->wantsJson() || $request->ajax() || str_contains($request->header('Accept', ''), '/json') || str_contains($request->header('Accept', ''), 'application/json');

            // Get current user and employee for authorization
            $user = auth()->user();
            $employeeId = $user && $user->employee ? $user->employee->id : null;

            if (!$expectsJson) {
                // Render server-side view with full project model so Blade can display data
                $project = Project::with(['department', 'division', 'projectAssignments.employee.user', 'tasks'])->find($id);

                if (!$project || (isset($project->status) && $project->status === 'DELETED')) {
                    abort(404);
                }

                if (!$employeeId) {
                    return redirect('/project')->with('error', 'You do not have permission to access the project.');
                }

                $isAssigned = ProjectAssignment::where('project_id', $project->id)
                    ->where('employee_id', $employeeId)
                    ->whereIn('role', ['author', 'co_author', 'contributor'])
                    ->exists();
                if (!$isAssigned) {
                    return redirect('/project')->with('error', 'You do not have permission to access the project.');
                }

                return view('project.show', ['project' => $project]);
            }

            // Eager-load employee.user to safely resolve avatars and reduce N+1
            $project = Project::with(['department', 'division', 'projectAssignments.employee.user'])->find($id);

            if (!$project) {
                return response()->json([
                    'code' => 404,
                    'status' => 'error',
                    'message' => 'Project not found'
                ], 404);
            }

            // If project was soft-deleted, pretend it doesn't exist for the frontend
            if (isset($project->status) && $project->status === 'DELETED') {
                return response()->json([
                    'code' => 404,
                    'status' => 'error',
                    'message' => 'Project not found'
                ], 404);
            }

            // Authorization check for JSON requests: only assigned users can access project details
            if (!$employeeId) {
                return response()->json([
                    'code' => 403,
                    'status' => 'error',
                    'message' => 'Unauthorized'
                ], 403);
            }

            $isAssigned = ProjectAssignment::where('project_id', $project->id)
                ->where('employee_id', $employeeId)
                ->whereIn('role', ['author', 'co_author', 'contributor'])
                ->exists();
            if (!$isAssigned) {
                return response()->json([
                    'code' => 403,
                    'status' => 'error',
                    'message' => 'Access denied'
                ], 403);
            }

            // Extract author and co_authors
            $author = null;
            $coAuthors = [];
            $contributors = [];

            foreach ($project->projectAssignments as $assignment) {
                $emp = $assignment->employee;
                if (!$emp)
                    continue;
                $avatar = $this->resolveEmployeeAvatar($emp);
                $empDivision = null;
                try {
                    $empDivision = $emp->division ? ($emp->division->name_division ?? $emp->division->name ?? null) : null;
                } catch (\Throwable $t) {
                    $empDivision = null;
                }
                $wrapped = [
                    'id' => $emp->id,
                    'name' => $emp->name,
                    'user_photo' => $avatar,
                    'profile_picture' => $avatar,
                    'profile_picture_url' => $avatar,
                    // expose division name for UI collaborator list
                    'division' => $empDivision,
                    'division_name' => $empDivision,
                ];
                if ($assignment->role === 'author') {
                    $author = $wrapped;
                } elseif ($assignment->role === 'co_author') {
                    $coAuthors[] = $wrapped;
                } elseif ($assignment->role === 'contributor') {
                    $contributors[] = $wrapped;
                }
            }

            // Normalize reference files (prefer JSON column reference_files)
            $files = $project->reference_files ?? $project->reference_file;
            if (is_string($files) && $files !== '') {
                $files = [$files];
            }
            if (!is_array($files)) {
                $files = [];
            }

            $response = [
                'id' => $project->id,
                'title' => $project->title,
                'description' => $project->description,
                'image' => $project->image,
                'department' => $project->department ? $project->department->name_department ?? $project->department->name : null,
                'division' => $project->division ? $project->division->name_division ?? $project->division->name : null,
                'reference_url' => $project->reference_url,
                // Preferred multi-URL field; fallback to single if needed
                'reference_urls' => $project->reference_urls ?: ($project->reference_url ? [$project->reference_url] : []),
                // Backward-compat alias for frontend
                'reference_file' => $files,
                // Preferred field
                'reference_files' => $files,
                'start_date' => $project->start_date,
                'due_date' => $project->due_date,
                'author' => $author,
                'co_authors' => $coAuthors,
                'contributors' => $contributors,
            ];

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => $response
            ]);

        } catch (\Exception $e) {
            $status = $this->deriveHttpStatusFromException($e);
            return response()->json([
                'code' => $status,
                'status' => "error",
                'message' => $e->getMessage()
            ], $status);
        }
    }

    public function getProjectsIds(Request $request)
    {
        $ids = $request->query('ids');
        if (!$ids) {
            return response()->json([
                'code' => 400,
                'status' => 'error',
                'message' => 'No project IDs provided'
            ], 400);
        }

        $ids = explode(',', $ids);

        $projects = Project::with(['department', 'division', 'projectAssignments.employee.user'])
            ->whereIn('id', $ids)
            ->get();

        $result = [];

        $user = $request->user();
        $employeeId = $user && $user->employee ? $user->employee->id : null;

        foreach ($ids as $id) {
            $project = $projects->firstWhere('id', $id);

            if (!$project || (isset($project->status) && $project->status === 'DELETED')) {
                $result[] = null; // kalo ga ketemu atau deleted, tetap null
                continue;
            }

            // Enforce visibility: if project is private, only the author may see it
            $pt = $project->project_type ?? null;
            if (strtolower((string) $pt) === 'private') {
                $isAuthor = false;
                if ($employeeId) {
                    $isAuthor = $project->projectAssignments->contains(function ($a) use ($employeeId) {
                        return isset($a->employee_id) && (int)$a->employee_id === (int)$employeeId && ($a->role === 'author');
                    });
                }
                if (!$isAuthor) {
                    $result[] = null; // hide private project
                    continue;
                }
            }

            $author = null;
            $coAuthors = [];
            $contributors = [];

            foreach ($project->projectAssignments as $assignment) {
                $emp = $assignment->employee;
                if (!$emp)
                    continue;

                $avatar = $this->resolveEmployeeAvatar($emp);
                $empDivision = null;
                try {
                    $empDivision = $emp->division ? ($emp->division->name_division ?? $emp->division->name ?? null) : null;
                } catch (\Throwable $t) {
                    $empDivision = null;
                }

                $wrapped = [
                    'id' => $emp->id,
                    'name' => $emp->name,
                    'user_photo' => $avatar,
                    'profile_picture' => $avatar,
                    'profile_picture_url' => $avatar,
                    'division' => $empDivision,
                    'division_name' => $empDivision,
                ];

                if ($assignment->role === 'author') {
                    $author = $wrapped;
                } elseif ($assignment->role === 'co_author') {
                    $coAuthors[] = $wrapped;
                } elseif ($assignment->role === 'contributor') {
                    $contributors[] = $wrapped;
                }
            }

            $files = $project->reference_files ?? $project->reference_file;
            if (is_string($files) && $files !== '')
                $files = [$files];
            if (!is_array($files))
                $files = [];

            $result[] = [
                'id' => $project->id,
                'title' => $project->title,
                'description' => $project->description,
                'image' => $project->image,
                'department' => $project->department ? $project->department->name_department ?? $project->department->name : null,
                'division' => $project->division ? $project->division->name_division ?? $project->division->name : null,
                'reference_url' => $project->reference_url,
                'reference_urls' => $project->reference_urls ?: ($project->reference_url ? [$project->reference_url] : []),
                'reference_file' => $files,
                'reference_files' => $files,
                'start_date' => $project->start_date,
                'due_date' => $project->due_date,
                'author' => $author,
                'co_authors' => $coAuthors,
                'contributors' => $contributors,
            ];
        }

        return response()->json([
            'code' => 200,
            'status' => 'success',
            'data' => $result
        ]);
    }

    /**
     * Show the form for editing the specified project.
     */
    public function edit(string $id)
    {
        // Eager-load employee.user to avoid null access when resolving avatars
        $project = Project::with(['department', 'division', 'projectAssignments.employee.user'])->findOrFail($id);

        $coAuthors = [];
        $contributors = [];

        foreach ($project->projectAssignments as $assignment) {
            $employee = $assignment->employee;
            if (!$employee)
                continue;
            $avatar = $this->resolveEmployeeAvatar($employee);
            $entry = [
                'id' => $employee->id,
                'name' => $employee->name,
                'user_photo' => $avatar,
                'profile_picture' => $avatar,
                'profile_picture_url' => $avatar,
            ];
            if ($assignment->role === 'co_author') {
                $coAuthors[] = $entry;
            } elseif ($assignment->role === 'contributor') {
                $contributors[] = $entry;
            }
        }

        $response = $project->toArray();
        // Normalize files: include both reference_files (preferred) and reference_file (alias array)
        $files = $project->reference_files ?? $project->reference_file;
        if (is_string($files) && $files !== '') {
            $files = [$files];
        }
        if (!is_array($files)) {
            $files = [];
        }
        $response['reference_files'] = $files;
        $response['reference_file'] = $files;
        // Ensure reference_urls present and normalized
        $response['reference_urls'] = $project->reference_urls ?: ($project->reference_url ? [$project->reference_url] : []);
        $response['co_authors'] = $coAuthors;
        $response['contributors'] = $contributors;

        return response()->json($response);
    }
    /**
     * Update the specified project in storage.
     */
    public function update(Request $request, string $id)
    {
        DB::beginTransaction();
        try {
            $project = Project::findOrFail($id);

            if ($request->has('co_author') && is_string($request->co_author)) {
                $request->merge(['co_author' => json_decode($request->co_author, true)]);
            }
            if ($request->has('contributors') && is_string($request->contributors)) {
                $request->merge(['contributors' => json_decode($request->contributors, true)]);
            }

            $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'required|string',
                'department' => 'required|exists:departments,id',
                'division' => 'required|exists:divisions,id',
                'status' => 'string|max:50',
                'reference_url' => 'nullable|url',
                'reference_urls' => 'nullable|array',
                'reference_urls.*' => 'nullable|url',
                'start_date' => 'required|date',
                'due_date' => 'required|date|after_or_equal:start_date',
                'part_of_project' => 'nullable|exists:projects,id',
                'complete_date' => 'nullable|date',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:10240',
                'reference_files' => 'nullable|array',
                'reference_files.*' => [
                    'file',
                    'max:102400',
                    function ($attribute, $value, $fail) {
                        $allowedExt = ['jpeg', 'png', 'jpg', 'gif', 'svg', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'zip', 'csv'];
                        $allowedMime = [
                            'application/vnd.ms-excel',
                            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                            'text/csv',
                            'application/csv',
                            'application/octet-stream',
                        ];
                        try {
                            $ext = strtolower((string) ($value->getClientOriginalExtension() ?? ''));
                            if (in_array($ext, $allowedExt, true))
                                return;
                            $mime = strtolower((string) ($value->getClientMimeType() ?? ''));
                            if (in_array($mime, $allowedMime, true))
                                return;
                        } catch (\Throwable $_) {
                        }
                        $fail('The ' . $attribute . ' must be a supported file type (images, pdf, doc/docx, xls/xlsx, csv or zip).');
                    }
                ],
                'reference_file' => 'nullable|array',
                'reference_file.*' => [
                    'file',
                    'max:102400',
                    function ($attribute, $value, $fail) {
                        $allowedExt = ['jpeg', 'png', 'jpg', 'gif', 'svg', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'zip', 'csv'];
                        $allowedMime = [
                            'application/vnd.ms-excel',
                            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                            'text/csv',
                            'application/csv',
                            'application/octet-stream',
                        ];
                        try {
                            $ext = strtolower((string) ($value->getClientOriginalExtension() ?? ''));
                            if (in_array($ext, $allowedExt, true))
                                return;
                            $mime = strtolower((string) ($value->getClientMimeType() ?? ''));
                            if (in_array($mime, $allowedMime, true))
                                return;
                        } catch (\Throwable $_) {
                        }
                        $fail('The ' . $attribute . ' must be a supported file type (images, pdf, doc/docx, xls/xlsx, csv or zip).');
                    }
                ],
                'co_author' => 'nullable|array',
                'co_author.*' => 'nullable|exists:employees,id',
                'contributors' => 'nullable|array',
                'contributors.*' => 'nullable|exists:employees,id',
            ]);

            // Get existing co-authors and contributors
            $existingCoAuthors = ProjectAssignment::where('project_id', $project->id)
                ->where('role', 'co_author')
                ->pluck('employee_id')
                ->toArray();

            $existingContributors = ProjectAssignment::where('project_id', $project->id)
                ->where('role', 'contributor')
                ->pluck('employee_id')
                ->toArray();

            // Update project fields
            $project->title = $request->title;
            // allow updating project_type; default to public if invalid
            if ($request->has('project_type')) {
                $project->project_type = in_array($request->input('project_type'), ['public', 'private']) ? $request->input('project_type') : 'public';
            }
            $project->description = $request->description;
            // Force department/division to employee's department
            $authEmp = auth()->user()->employee ?? null;
            if (!$authEmp)
                throw new \Exception('Authenticated user has no employee relation');
            $departmentIdToUse = $authEmp->department_id;
            $providedDivision = $request->input('division');
            if ($providedDivision) {
                $div = Division::where('id', $providedDivision)->where('department_id', $departmentIdToUse)->first();
                if (!$div) {
                    throw new \Exception('Selected division is invalid for your department');
                }
                $divisionIdToUse = $providedDivision;
            } else {
                $divisionIdToUse = null;
            }
            $project->department_id = $departmentIdToUse;
            $project->division_id = $divisionIdToUse;
            $project->status = $request->status ?? 'ACTIVE';

            // Normalize reference URLs
            $refUrls = [];
            if ($request->has('reference_urls')) {
                $incoming = $request->input('reference_urls', []);
                if (is_array($incoming)) {
                    $refUrls = array_values(array_filter($incoming));
                }
                $project->reference_urls = $refUrls;
                $project->reference_url = count($refUrls) > 0 ? $refUrls[0] : null;
            } elseif (!empty($request->reference_url)) {
                $refUrls = [$request->reference_url];
                $project->reference_urls = $refUrls;
                $project->reference_url = $request->reference_url;
            }

            $project->start_date = $request->start_date;
            $project->due_date = $request->due_date;
            $project->part_of_project = $request->part_of_project;
            $project->complete_date = $request->complete_date;
            $project->updated_by = auth()->user() ? auth()->user()->id : null;

            // Handle image upload
            // If frontend requested removal of existing image, delete it and clear DB field
            if ($request->input('remove_image') == "1") {
                if ($project->image && file_exists(public_path('file/project/' . $project->image))) {
                    @unlink(public_path('file/project/' . $project->image));
                }
                $project->image = null;
            }

            // Handle new image upload (overrides removal if a new file is provided)
            if ($request->hasFile('image')) {
                if ($project->image && file_exists(public_path('file/project/' . $project->image))) {
                    @unlink(public_path('file/project/' . $project->image));
                }
                $image = $request->file('image');
                $imageName = 'PROJECT_' . time() . '.' . $image->getClientOriginalExtension();
                $image->move(public_path('file/project'), $imageName);
                $project->image = $imageName;
            }

            // Handle reference file uploads & deletions
            $existing = [];
            if ($request->has('existing_reference_files')) {
                $existing = json_decode($request->existing_reference_files, true) ?: [];
            }
            $existing = is_array($existing) ? $existing : [];

            $currentFiles = $project->reference_files ?? $project->reference_file ?? [];
            if (!is_array($currentFiles) && $currentFiles) {
                $currentFiles = [$currentFiles];
            }

            $toDelete = array_diff($currentFiles, $existing);
            foreach ($toDelete as $del) {
                $path = public_path('file/project/' . $del);
                if ($del && file_exists($path)) {
                    @unlink($path);
                }
            }

            $finalFiles = $existing;

            $incomingFiles = [];
            if ($request->hasFile('reference_files')) {
                $rf = $request->file('reference_files');
                $incomingFiles = array_merge($incomingFiles, is_array($rf) ? $rf : [$rf]);
            }
            if ($request->hasFile('reference_file')) {
                $rfLegacy = $request->file('reference_file');
                $incomingFiles = array_merge($incomingFiles, is_array($rfLegacy) ? $rfLegacy : [$rfLegacy]);
            }
            foreach ($incomingFiles as $idx => $file) {
                if (!$file)
                    continue;
                $fileName = 'PROJECT_REF_' . time() . '_' . $idx . '_' . Str::random(5) . '.' . $file->getClientOriginalExtension();
                $file->move(public_path('file/project'), $fileName);
                $finalFiles[] = $fileName;
            }

            $project->reference_files = $finalFiles;
            $project->save();

            // Update project_assignments for author
            if (auth()->check()) {
                $employee = auth()->user()->employee;
                if ($employee) {
                    ProjectAssignment::updateOrCreate(
                        ['project_id' => $project->id, 'employee_id' => $employee->id],
                        ['role' => 'author', 'updated_at' => now(), 'created_at' => now()]
                    );
                } else {
                    throw new \Exception('Authenticated user has no employee relation');
                }
            } else {
                throw new \Exception('User not authenticated');
            }

            // Handle co-author assignments
            $newCoAuthors = $request->co_author && is_array($request->co_author)
                ? array_unique($request->co_author)
                : [];
            $addedCoAuthors = array_diff($newCoAuthors, $existingCoAuthors);

            ProjectAssignment::where('project_id', $project->id)
                ->where('role', 'co_author')
                ->delete();

            if ($newCoAuthors) {
                $coAuthorAssignments = [];
                foreach ($newCoAuthors as $employeeId) {
                    if (!Employee::where('id', $employeeId)->exists()) {
                        throw new \Exception("Co-author employee ID {$employeeId} does not exist");
                    }
                    $coAuthorAssignments[] = [
                        'project_id' => $project->id,
                        'employee_id' => $employeeId,
                        'role' => 'co_author',
                        'is_receive' => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
                ProjectAssignment::insert($coAuthorAssignments);
            }

            // Handle contributor assignments
            $newContributors = $request->contributors && is_array($request->contributors)
                ? array_unique($request->contributors)
                : [];
            $addedContributors = array_diff($newContributors, $existingContributors);

            ProjectAssignment::where('project_id', $project->id)
                ->where('role', 'contributor')
                ->delete();

            if ($newContributors) {
                $contributorAssignments = [];
                foreach ($newContributors as $employeeId) {
                    if (!Employee::where('id', $employeeId)->exists()) {
                        throw new \Exception("Contributor employee ID {$employeeId} does not exist");
                    }
                    $contributorAssignments[] = [
                        'project_id' => $project->id,
                        'employee_id' => $employeeId,
                        'role' => 'contributor',
                        'is_receive' => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
                ProjectAssignment::insert($contributorAssignments);
            }

            // 🔔 Gabungkan notifikasi co-author & contributor
            $notifyEmployees = array_merge($addedCoAuthors, $addedContributors);
            $uniqueNotifyEmployees = array_unique($notifyEmployees);

            if ($uniqueNotifyEmployees) {
                $authorEmployee = auth()->user()->employee;
                foreach ($uniqueNotifyEmployees as $employeeId) {
                    $exists = Notification::where('employee_id', $employeeId)
                        ->where('type', 'new job')
                        ->where('title', 'LIKE', '%project: ' . $project->title)
                        ->where('is_read', false)
                        ->exists();

                    if (!$exists) {
                        Notification::create([
                            'employee_id' => $employeeId,
                            'type' => 'new job',
                            'title' => 'You have been assigned to project: ' . $project->title,
                            'message' => 'You have been assigned to project: ' . $project->title,
                            'sent_at' => now(),
                            'created_by' => $authorEmployee ? $authorEmployee->id : null,
                            'updated_at' => now(),
                            'created_at' => now(),
                        ]);
                    }
                }
            }

            DB::commit();

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'message' => 'Project updated successfully',
                'project' => $project
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            $status = $this->deriveHttpStatusFromException($e);
            return response()->json([
                'code' => $status,
                'status' => "error",
                'message' => $e->getMessage()
            ], $status);
        }
    }


    /**
     * Remove the specified project from storage.
     */
    public function destroy(string $id)
    {
        DB::beginTransaction();
        try {
            $project = Project::findOrFail($id);
            // If project has any tasks, do not allow deletion
            if ($project->tasks()->exists()) {
                DB::rollBack();
                return response()->json([
                    'code' => 400,
                    'status' => 'error',
                    'message' => 'This project has a task, it cannot be deleted'
                ], 400);
            }

            // Soft-delete behavior: mark status as DELETED and record who deleted it.
            // Do NOT remove related assignments, feedbacks, or files so data remains in DB.
            $project->status = 'DELETED';
            $project->deleted_by = auth()->id();
            $project->updated_by = auth()->id();
            $project->save();

            DB::commit();

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'message' => 'Project deleted successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            $status = $this->deriveHttpStatusFromException($e);
            return response()->json([
                'code' => $status,
                'status' => "error",
                'message' => $e->getMessage()
            ], $status);
        }
    }

    /**
     * Delete a single reference file from a project (only author allowed).
     * Expects DELETE with 'filename' parameter specifying the stored filename.
     */
    public function destroyReferenceFile(Request $request, string $id)
    {
        DB::beginTransaction();
        try {
            $project = Project::findOrFail($id);

            $user = $request->user();
            $employeeId = $user && $user->employee ? $user->employee->id : null;
            if (!$employeeId) {
                return response()->json(['code' => 401, 'status' => 'error', 'message' => 'Unauthorized'], 401);
            }

            // Only author may delete project reference files
            $isAuthor = ProjectAssignment::where('project_id', $project->id)
                ->where('employee_id', $employeeId)
                ->where('role', 'author')
                ->exists();

            if (!$isAuthor) {
                return response()->json(['code' => 403, 'status' => 'error', 'message' => 'Only author can remove reference files.'], 403);
            }

            $filename = $request->input('filename');
            if (empty($filename)) {
                return response()->json(['code' => 422, 'status' => 'error', 'message' => 'Filename is required.'], 422);
            }

            $refFiles = is_array($project->reference_files) ? $project->reference_files : (is_string($project->reference_files) ? json_decode($project->reference_files, true) ?? [] : []);
            $found = false;
            foreach ($refFiles as $k => $f) {
                if ((string) $f === (string) $filename || $f === $filename) {
                    // delete file from public storage if exists
                    $path = public_path('file/project/' . $f);
                    if (file_exists($path)) {
                        @unlink($path);
                    }
                    unset($refFiles[$k]);
                    $found = true;
                    break;
                }
            }

            if (!$found) {
                return response()->json(['code' => 404, 'status' => 'error', 'message' => 'Reference file not found on this project.'], 404);
            }

            // Reindex array and persist
            $refFiles = array_values($refFiles);
            $project->reference_files = $refFiles;
            $project->save();

            DB::commit();
            return response()->json(['code' => 200, 'status' => 'success', 'message' => 'Reference file removed successfully']);
        } catch (\Exception $e) {
            DB::rollBack();
            $status = $this->deriveHttpStatusFromException($e);
            return response()->json(['code' => $status, 'status' => 'error', 'message' => $e->getMessage()], $status);
        }
    }

    /**
     * Store one or more reference files for a project (only author allowed).
     * Accepts multipart/form-data with files in `reference_files[]`.
     */
    public function storeReferenceFile(Request $request, string $id)
    {
        DB::beginTransaction();
        try {
            $project = Project::findOrFail($id);

            $user = $request->user();
            $employeeId = $user && $user->employee ? $user->employee->id : null;
            if (!$employeeId) {
                return response()->json(['code' => 401, 'status' => 'error', 'message' => 'Unauthorized'], 401);
            }

            // Only author can upload project reference files
            $isAuthor = ProjectAssignment::where('project_id', $project->id)
                ->where('employee_id', $employeeId)
                ->where('role', 'author')
                ->exists();

            if (!$isAuthor) {
                return response()->json(['code' => 403, 'status' => 'error', 'message' => 'Only author can add reference files.'], 403);
            }

            $files = $request->file('reference_files', []);
            if (!is_array($files) || count($files) === 0) {
                return response()->json(['code' => 422, 'status' => 'error', 'message' => 'No files uploaded.'], 422);
            }

            $stored = [];
            foreach ($files as $file) {
                if (!$file->isValid())
                    continue;
                $orig = $file->getClientOriginalName();
                $ext = $file->getClientOriginalExtension();
                $name = time() . '_' . Str::random(6) . '_' . preg_replace('/[^A-Za-z0-9_.-]/', '_', $orig);
                $destDir = public_path('file/project');
                if (!is_dir($destDir))
                    @mkdir($destDir, 0755, true);
                $file->move($destDir, $name);
                $stored[] = $name;
            }

            // Merge with existing reference_files (cast as array)
            $existing = is_array($project->reference_files) ? $project->reference_files : (is_string($project->reference_files) ? json_decode($project->reference_files, true) ?? [] : []);
            $merged = array_values(array_merge($existing, $stored));
            $project->reference_files = $merged;
            $project->save();

            DB::commit();
            return response()->json(['code' => 200, 'status' => 'success', 'message' => 'Files uploaded', 'reference_files' => $merged]);
        } catch (\Exception $e) {
            DB::rollBack();
            $status = $this->deriveHttpStatusFromException($e);
            return response()->json(['code' => $status, 'status' => 'error', 'message' => $e->getMessage()], $status);
        }
    }

    /**
     * Get project feedbacks for a given project.
     */
    public function getProjectFeedbacks($projectId)
    {
        try {
            $project = Project::find($projectId);
            if (!$project || ($project->status ?? null) === 'DELETED') {
                return response()->json([
                    'code' => 404,
                    'status' => 'error',
                    'message' => 'Project not found'
                ], 404);
            }
            // Ambil feedback dengan nested replies + order langsung
            $feedbacks = ProjectFeedback::with([
                'employee.user:id,photo',
                'replies' => function ($q) {
                    $q->with(['employee.user:id,photo'])
                        ->orderBy('created_at', 'asc');
                }
            ])
                ->where('project_id', $projectId)
                ->whereNull('parent_id')
                ->orderBy('created_at', 'desc')
                ->get();

            $formatOne = function ($fb) {
                $item = [
                    'id' => $fb->id,
                    'parent_id' => $fb->parent_id,
                    'feedback_comment' => $fb->feedback_comment,
                    'image' => $fb->image ? asset('file/project/' . $fb->image) : null,
                    'reference_url' => $fb->reference_url,
                    'reference_urls' => $fb->reference_urls ?: ($fb->reference_url ? [$fb->reference_url] : []),
                    'reference_file' => $fb->reference_file ? asset('file/project/' . $fb->reference_file) : null,
                    'reference_files' => (function () use ($fb) {
                        $arr = $fb->reference_files;
                        if (is_string($arr) && $arr !== '') {
                            $dec = json_decode($arr, true);
                            if (is_array($dec))
                                $arr = $dec;
                            else
                                $arr = [$arr];
                        }
                        if (!is_array($arr))
                            $arr = [];
                        return array_map(function ($f) {
                            return $f ? asset('file/project/' . ltrim($f, '/')) : null; }, $arr);
                    })(),
                    'created_at' => $fb->created_at,
                    'employee' => $fb->employee ? (function () {})() : null, // placeholder replaced below
                ];
                if ($fb->employee) {
                    $e = $fb->employee;
                    $avatar = $this->resolveEmployeeAvatar($e);
                    $item['employee'] = [
                        'id' => $e->id,
                        'name' => $e->name,
                        'photo' => $avatar,
                        'user_photo' => $avatar,
                        'profile_picture' => $avatar,
                        'profile_picture_url' => $avatar,
                    ];
                }

                $item['replies'] = $fb->replies->map(function ($reply) {
                    $avatar = $this->resolveEmployeeAvatar($reply->employee);
                    return [
                        'id' => $reply->id,
                        'parent_id' => $reply->parent_id,
                        'feedback_comment' => $reply->feedback_comment,
                        'image' => $reply->image ? asset('file/project/' . $reply->image) : null,
                        'reference_url' => $reply->reference_url,
                        'reference_urls' => $reply->reference_urls ?: ($reply->reference_url ? [$reply->reference_url] : []),
                        'reference_file' => $reply->reference_file ? asset('file/project/' . $reply->reference_file) : null,
                        'reference_files' => (function () use ($reply) {
                            $arr = $reply->reference_files;
                            if (is_string($arr) && $arr !== '') {
                                $dec = json_decode($arr, true);
                                if (is_array($dec))
                                    $arr = $dec;
                                else
                                    $arr = [$arr];
                            }
                            if (!is_array($arr))
                                $arr = [];
                            return array_map(function ($f) {
                                return $f ? asset('file/project/' . ltrim($f, '/')) : null; }, $arr);
                        })(),
                        'created_at' => $reply->created_at,
                        'employee' => $reply->employee ? [
                            'id' => $reply->employee->id,
                            'name' => $reply->employee->name,
                            'photo' => $avatar,
                            'user_photo' => $avatar,
                            'profile_picture' => $avatar,
                            'profile_picture_url' => $avatar,
                        ] : null,
                    ];
                });

                return $item;
            };

            $payload = $feedbacks->map($formatOne);

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => $payload
            ]);
        } catch (\Exception $e) {
            $status = $this->deriveHttpStatusFromException($e);
            return response()->json([
                'code' => $status,
                'status' => "error",
                'message' => $e->getMessage()
            ], $status);
        }
    }

    /**
     * Store a newly created project feedback in storage.
     */
    public function storeFeedback(Request $request)
    {
        DB::beginTransaction();
        try {
            $request->validate([
                'project_id' => 'required|exists:projects,id',
                'parent_id' => 'nullable|exists:project_feedbacks,id',
                'employee_id' => 'required|exists:employees,id',
                'feedback_comment' => 'required|string',
                // Match Task limits (image max 2MB)
                'feedback_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:2048',
                'reference_url' => 'nullable|url',
                'reference_urls' => 'nullable|array',
                'reference_urls.*' => 'nullable|url',
                // Multiple reference files support (match Task mimes & 5MB limit)
                'reference_files' => 'nullable|array',
                'reference_files.*' => 'file|mimes:jpeg,png,jpg,gif,svg,webp,pdf,doc,docx,xls,xlsx,zip|max:5120',
            ]);

            $feedback = new ProjectFeedback();
            $feedback->project_id = $request->project_id;
            $feedback->parent_id = $request->parent_id;
            $feedback->employee_id = $request->employee_id;
            $feedback->feedback_comment = $request->feedback_comment;
            // Normalize reference URLs for feedback
            $refUrls = [];
            if ($request->has('reference_urls') && is_array($request->reference_urls)) {
                $refUrls = array_values(array_filter($request->reference_urls));
            } elseif (!empty($request->reference_url)) {
                $refUrls = [$request->reference_url];
            }
            $feedback->reference_urls = $refUrls;
            $feedback->reference_url = count($refUrls) ? $refUrls[0] : null;
            $feedback->created_by = auth()->user() ? auth()->user()->id : null;
            $feedback->updated_by = auth()->user() ? auth()->user()->id : null;
            $feedback->deleted_by = null;

            // Handle feedback image upload
            if ($request->hasFile('feedback_image')) {
                $image = $request->file('feedback_image');
                $imageName = 'FEEDBACK_' . time() . '.' . $image->getClientOriginalExtension();
                $image->move(public_path('file/project'), $imageName);
                $feedback->image = $imageName;
            }

            // Handle multiple reference files upload
            $uploaded = [];
            if ($request->hasFile('reference_files')) {
                foreach ((array) $request->file('reference_files') as $file) {
                    if (!$file)
                        continue;
                    $fileName = 'FEEDBACK_' . time() . '_' . Str::random(5) . '.' . $file->getClientOriginalExtension();
                    $file->move(public_path('file/project'), $fileName);
                    $uploaded[] = $fileName;
                }
            }
            if (!empty($uploaded)) {
                $feedback->reference_files = $uploaded;
                // mirror first file for legacy single field consumers
                $feedback->reference_file = $uploaded[0];
            }

            $feedback->save();

            DB::commit();

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'message' => 'Feedback added successfully',
                'feedback' => $feedback
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            $status = $this->deriveHttpStatusFromException($e);
            return response()->json([
                'code' => $status,
                'status' => "error",
                'message' => $e->getMessage()
            ], $status);
        }
    }

    /**
     * Update project feedback or reply (author-only)
     */
    public function updateFeedback(Request $request, $id)
    {
        DB::beginTransaction();
        try {
            $feedback = ProjectFeedback::findOrFail($id);

            // Only author can edit
            $user = $request->user();
            $currentEmployeeId = $user && $user->employee ? $user->employee->id : null;
            if (!$currentEmployeeId || (int) $feedback->employee_id !== (int) $currentEmployeeId) {
                return response()->json([
                    'code' => 403,
                    'status' => 'error',
                    'message' => 'You are not allowed to edit this feedback.',
                ], 403);
            }

            $request->validate([
                'feedback_comment' => 'required|string',
                'reference_url' => 'nullable|url',
                'reference_urls' => 'nullable|array',
                'reference_urls.*' => 'nullable|url',
                // Match Task image limits (2MB)
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:2048',
                'feedback_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:2048',
                // Multiple reference files update (match Task)
                'reference_files' => 'nullable|array',
                'reference_files.*' => 'file|mimes:jpeg,png,jpg,gif,svg,webp,pdf,doc,docx,xls,xlsx,zip|max:5120',
                'existing_reference_files' => 'nullable', // JSON array of filenames to keep
            ]);

            $feedback->feedback_comment = $request->feedback_comment;
            // Normalize incoming reference URLs on update
            if ($request->has('reference_urls')) {
                $incoming = $request->input('reference_urls', []);
                $arr = is_array($incoming) ? array_values(array_filter($incoming)) : [];
                $feedback->reference_urls = $arr;
                $feedback->reference_url = count($arr) ? $arr[0] : null;
            } elseif (!is_null($request->reference_url)) {
                $val = $request->reference_url;
                $feedback->reference_urls = $val ? [$val] : [];
                $feedback->reference_url = $val ?: null;
            }

            // Normalize image input key
            // If frontend requested removal of existing feedback image, delete it and clear DB field
            if ($request->input('remove_image') == "1") {
                if ($feedback->image && file_exists(public_path('file/project/' . $feedback->image))) {
                    @unlink(public_path('file/project/' . $feedback->image));
                }
                $feedback->image = null;
            }

            $img = $request->file('image') ?: $request->file('feedback_image');
            if ($img) {
                $name = 'FEEDBACK_' . time() . '.' . $img->getClientOriginalExtension();
                $img->move(public_path('file/project'), $name);
                $feedback->image = $name;
            }

            // Handle existing + new reference files
            $existing = [];
            if ($request->has('existing_reference_files')) {
                $existing = json_decode($request->existing_reference_files, true) ?: [];
            }
            $existing = is_array($existing) ? $existing : [];
            $current = $feedback->reference_files ?: ($feedback->reference_file ? [$feedback->reference_file] : []);
            if (!is_array($current))
                $current = (strlen((string) $current) ? [$current] : []);
            // Delete removed
            $toDelete = array_diff($current, $existing);
            foreach ($toDelete as $del) {
                $path = public_path('file/project/' . $del);
                if ($del && file_exists($path))
                    @unlink($path);
            }
            $finalFiles = $existing;
            if ($request->hasFile('reference_files')) {
                foreach ((array) $request->file('reference_files') as $rf) {
                    if (!$rf)
                        continue;
                    $name = 'FEEDBACK_' . time() . '_' . Str::random(5) . '.' . $rf->getClientOriginalExtension();
                    $rf->move(public_path('file/project'), $name);
                    $finalFiles[] = $name;
                }
            }
            $feedback->reference_files = $finalFiles;
            $feedback->reference_file = count($finalFiles) ? $finalFiles[0] : null;

            if ($user) {
                $feedback->updated_by = $user->id;
            }

            $feedback->save();

            DB::commit();

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'message' => 'Project feedback updated successfully',
                'data' => $feedback,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            $status = $this->deriveHttpStatusFromException($e);
            return response()->json([
                'code' => $status,
                'status' => 'error',
                'message' => 'Failed to update feedback: ' . $e->getMessage(),
            ], $status);
        }
    }

    /**
     * Destroy project feedback or reply (only author allowed)
     */
    public function destroyFeedback(Request $request, $id)
    {
        DB::beginTransaction();
        try {
            $feedback = ProjectFeedback::findOrFail($id);

            $user = $request->user();
            $currentEmployeeId = $user && $user->employee ? $user->employee->id : null;
            if (!$currentEmployeeId || (int) $feedback->employee_id !== (int) $currentEmployeeId) {
                return response()->json([
                    'code' => 403,
                    'status' => 'error',
                    'message' => 'You are not allowed to delete this feedback.',
                ], 403);
            }

            // Delete attached image if any
            if (!empty($feedback->image)) {
                $path = public_path('file/project/' . $feedback->image);
                if (file_exists($path)) {
                    @unlink($path);
                }
            }

            // Delete attached reference files if any
            $refFiles = is_array($feedback->reference_files) ? $feedback->reference_files : [];
            foreach ($refFiles as $rf) {
                if (!$rf)
                    continue;
                $p = public_path('file/project/' . $rf);
                if (file_exists($p)) {
                    @unlink($p);
                }
            }

            // Delete the feedback (this will also delete replies if cascade set; otherwise remove replies manually)
            $feedback->delete();

            DB::commit();

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'message' => 'Feedback deleted successfully',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            $status = $this->deriveHttpStatusFromException($e);
            return response()->json([
                'code' => $status,
                'status' => 'error',
                'message' => 'Failed to delete feedback: ' . $e->getMessage(),
            ], $status);
        }
    }

    /**
     * Get unread feedback count for a project for current employee.
     */
    public function getAllUnreadCounts()
    {
        try {
            $user = auth()->user();
            $employeeId = $user?->employee?->id;
            if (!$employeeId) {
                return response()->json(['success' => true, 'data' => (object) []]);
            }

            // Ambil semua project aktif + marker baca
            $projects = Project::where(function ($q) {
                $q->whereNull('status')->orWhere('status', '!=', 'DELETED');
            })
                ->select('id', 'read_markers')
                ->get();

            $result = [];

            foreach ($projects as $project) {
                // Ambil marker last_read_at untuk employee ini
                $markers = [];
                if (!empty($project->read_markers)) {
                    $markers = is_array($project->read_markers)
                        ? $project->read_markers
                        : ((json_decode($project->read_markers, true)) ?: []);
                }
                $lastReadAt = $markers[(string) $employeeId] ?? null;

                // Hitung unread langsung pakai query builder
                $count = ProjectFeedback::where('project_id', $project->id)
                    ->where('employee_id', '!=', $employeeId)
                    ->when($lastReadAt, function ($q) use ($lastReadAt) {
                        $q->where('created_at', '>', $lastReadAt);
                    })
                    ->count();

                if ($count > 0) {
                    $result[$project->id] = $count;
                }
            }

            return response()->json([
                'success' => true,
                'data' => $result
            ]);

        } catch (\Exception $e) {
            // Kalau ada error → balikin kosong aja biar aman
            return response()->json([
                'success' => true,
                'data' => (object) []
            ]);
        }
    }


    /**
     * Mark all feedbacks as read for current employee for a project by updating last_read_at marker.
     */
    public function markProjectFeedbacksRead($projectId)
    {
        try {
            $user = auth()->user();
            $employeeId = $user?->employee?->id;
            if (!$employeeId) {
                return response()->json(['status' => 'ok']);
            }

            $project = Project::findOrFail($projectId);
            if (($project->status ?? null) === 'DELETED') {
                return response()->json(['status' => 'ok']);
            }
            $markers = [];
            if (!empty($project->read_markers)) {
                $markers = is_array($project->read_markers)
                    ? $project->read_markers
                    : ((json_decode($project->read_markers, true)) ?: []);
            }
            $markers[(string) $employeeId] = now()->toDateTimeString();
            $project->read_markers = $markers;
            $project->save();

            return response()->json(['status' => 'ok']);
        } catch (\Exception $e) {
            return response()->json(['status' => 'ok']);
        }
    }

    /**
     * Get the latest single feedback for a project
     */
    public function getProjectsLatestFeedback(Request $request)
    {
        try {
            $employeeId = auth()->user()?->employee?->id;
            $ids = explode(',', $request->query('ids', ''));
            $ids = array_filter(array_map('trim', $ids));

            if (empty($ids)) {
                return response()->json([
                    'code' => 200,
                    'status' => 'success',
                    'data' => []
                ]);
            }

            $projects = Project::whereIn('id', $ids)->get()->keyBy('id');
            $results = [];

            foreach ($ids as $pid) {
                $project = $projects[$pid] ?? null;
                if (!$project || ($project->status ?? null) === 'DELETED') {
                    $results[$pid] = null;
                    continue;
                }

                $lastReadAt = null;
                if ($employeeId && !empty($project->read_markers)) {
                    $markers = is_array($project->read_markers)
                        ? $project->read_markers
                        : (json_decode($project->read_markers, true) ?: []);
                    $lastReadAt = $markers[(string) $employeeId] ?? null;
                }

                $latest = ProjectFeedback::with(['employee.user'])
                    ->where('project_id', $pid)
                    ->when($employeeId, fn($q) => $q->where('employee_id', '!=', $employeeId))
                    ->when($lastReadAt, fn($q) => $q->where('created_at', '>', $lastReadAt))
                    ->orderBy('created_at', 'desc')
                    ->first();

                if (!$latest) {
                    $results[$pid] = null;
                    continue;
                }

                $payload = [
                    'id' => $latest->id,
                    'parent_id' => $latest->parent_id,
                    'feedback_comment' => $latest->feedback_comment,
                    'created_at' => $latest->created_at,
                    'employee' => null,
                ];

                if ($latest->employee) {
                    $e = $latest->employee;
                    $avatar = $this->resolveEmployeeAvatar($e);
                    $payload['employee'] = [
                        'id' => $e->id,
                        'name' => $e->name,
                        'photo' => $avatar,
                        'user_photo' => $avatar,
                        'profile_picture' => $avatar,
                        'profile_picture_url' => $avatar,
                    ];
                }

                $results[$pid] = $payload;
            }

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => $results
            ]);
        } catch (\Exception $e) {
            $status = $this->deriveHttpStatusFromException($e);
            return response()->json([
                'code' => $status,
                'status' => 'error',
                'message' => $e->getMessage(),
            ], $status);
        }
    }

    /**
     * Get unread feedback count for a specific project for the current employee.
     */
    public function getUnreadFeedbackCount($projectId)
    {
        try {
            $user = auth()->user();
            $employeeId = $user?->employee?->id;
            if (!$employeeId) {
                return response()->json([
                    'success' => true,
                    'data' => 0,
                ]);
            }

            $project = Project::find($projectId);
            if (!$project || ($project->status ?? null) === 'DELETED') {
                return response()->json([
                    'success' => true,
                    'data' => 0,
                ]);
            }

            $markers = [];
            if (!empty($project->read_markers)) {
                $markers = is_array($project->read_markers)
                    ? $project->read_markers
                    : (json_decode($project->read_markers, true) ?: []);
            }
            $lastReadAt = $markers[(string) $employeeId] ?? null;

            $count = ProjectFeedback::where('project_id', $project->id)
                ->where('employee_id', '!=', $employeeId)
                ->when($lastReadAt, function ($q) use ($lastReadAt) {
                    $q->where('created_at', '>', $lastReadAt);
                })
                ->count();

            return response()->json([
                'success' => true,
                'data' => $count,
            ]);
        } catch (\Exception $e) {
            // On error, do not break UI; return 0
            return response()->json([
                'success' => true,
                'data' => 0,
            ]);
        }
    }

    public function getAllProjectFeedbacks(Request $request)
    {
        $ids = $request->query('ids');

        if (!$ids) {
            return response()->json([
                'data' => []
            ]);
        }

        $ids = explode(',', $ids);

        $feedbacks = ProjectFeedback::whereIn('project_id', $ids)->get();

        $grouped = $feedbacks->groupBy('project_id');

        return response()->json([
            'data' => $grouped
        ]);
    }

    /**
     * Export projects to Excel
     */
    public function exportProjectsExcel(Request $request)
    {
        try {
            // Get all active projects with relationships
            $projects = Project::where('status', '!=', 'DELETED')
                ->with([
                    'department',
                    'division',
                    'tasks' => function($query) {
                        $query->whereRaw('LOWER(status) NOT IN (?, ?)', ['canceled', 'deleted']);
                    },
                    'projectAssignments.employee'
                ])
                ->withCount([
                    'tasks as total_tasks' => function ($q) {
                        $q->whereRaw('LOWER(status) NOT IN (?, ?)', ['canceled', 'deleted']);
                    },
                    'tasks as completed_tasks' => fn($q) =>
                        $q->whereIn(DB::raw('LOWER(status)'), ['completed']),
                    'tasks as in_progress_tasks' => fn($q) =>
                        $q->whereIn(DB::raw('LOWER(status)'), ['in_progress', 'in progress', 'rejected']),
                ])
                ->orderBy('created_at', 'desc')
                ->get();

            // Create spreadsheet
            $spreadsheet = new Spreadsheet();
            $activeWorksheet = $spreadsheet->getActiveSheet();

            // Set title
            $activeWorksheet->mergeCells('A1:K1');
            $activeWorksheet->setCellValue('A1', 'Project Report - NSA Office Management System');
            $activeWorksheet->getStyle('A1')->getFont()->setBold(true)->setSize(16);
            $activeWorksheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

            // Set headers
            $headers = [
                'A2' => 'No',
                'B2' => 'Nama Project',
                'C2' => 'Part of Project',
                'D2' => 'Department',
                'E2' => 'Division',
                'F2' => 'Status',
                'G2' => 'Task',
                'H2' => 'Status Task',
                'I2' => 'Project Type',
                'J2' => 'Waktu Mulai',
                'K2' => 'Deadline',
                'L2' => 'Jumlah Task'
            ];

            foreach ($headers as $cell => $value) {
                $activeWorksheet->setCellValue($cell, $value);
            }

            // Style headers
            $headerStyle = [
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                    ],
                ],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => [
                        'argb' => 'FFE0E0E0',
                    ],
                ],
            ];

            $activeWorksheet->getStyle('A2:L2')->applyFromArray($headerStyle)->getFont()->setBold(true)->setSize(10);
            $activeWorksheet->getStyle('A2:L2')
                ->getAlignment()
                ->setWrapText(true)
                ->setHorizontal(Alignment::HORIZONTAL_CENTER)
                ->setVertical(Alignment::VERTICAL_CENTER);

            // Set column widths
            $columnWidths = [
                'A' => 5,   // No
                'B' => 30,  // Nama Project
                'C' => 20,  // Part of Project
                'D' => 15,  // Department
                'E' => 15,  // Division
                'F' => 12,  // Status
                'G' => 25,  // Task
                'H' => 15,  // Status Task
                'I' => 12,  // Project Type
                'J' => 12,  // Waktu Mulai
                'K' => 12,  // Deadline
                'L' => 12   // Jumlah Task
            ];

            foreach ($columnWidths as $column => $width) {
                $activeWorksheet->getColumnDimension($column)->setWidth($width);
            }

            // Fill data
            $row = 3;
            $no = 1;

            foreach ($projects as $project) {
                // Create one row per project
                $activeWorksheet->setCellValue('A'.$row, $no);
                $activeWorksheet->setCellValue('B'.$row, $project->title);
                $activeWorksheet->setCellValue('C'.$row, $project->part_of_project ?? '-');
                $activeWorksheet->setCellValue('D'.$row, $project->department ? $project->department->name_department : '-');
                $activeWorksheet->setCellValue('E'.$row, $project->division ? $project->division->name_division : '-');
                $activeWorksheet->setCellValue('F'.$row, ucfirst($project->status));
                
                // Combine all task titles into one cell, separated by line breaks
                if ($project->tasks->count() > 0) {
                    $taskTitles = $project->tasks->pluck('title')->toArray();
                    $activeWorksheet->setCellValue('G'.$row, implode("; ", $taskTitles));
                    
                    // Show status of tasks (completed/in progress/etc.)
                    $taskStatuses = $project->tasks->pluck('status')->map(function($status) {
                        return ucfirst($status);
                    })->toArray();
                    $activeWorksheet->setCellValue('H'.$row, implode("; ", $taskStatuses));
                    
                    // Use project due date or latest task due date
                    $latestDueDate = $project->due_date;
                    if (!$latestDueDate) {
                        $taskDueDates = $project->tasks->pluck('due_date')->filter()->toArray();
                        if (!empty($taskDueDates)) {
                            $latestDueDate = max($taskDueDates);
                        }
                    }
                } else {
                    $activeWorksheet->setCellValue('G'.$row, 'No Tasks');
                    $activeWorksheet->setCellValue('H'.$row, '-');
                    $latestDueDate = $project->due_date;
                }
                
                $activeWorksheet->setCellValue('I'.$row, ucfirst($project->project_type ?? 'public'));
                $activeWorksheet->setCellValue('J'.$row, $project->start_date ? Carbon::parse($project->start_date)->format('d-M-Y') : '-');
                $activeWorksheet->setCellValue('K'.$row, $latestDueDate ? Carbon::parse($latestDueDate)->format('d-M-Y') : '-');
                $activeWorksheet->setCellValue('L'.$row, $project->total_tasks ?? 0);

                $row++;
                $no++;
            }

            // Apply borders to data rows
            $dataStyle = [
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                    ],
                ],
            ];

            if ($row > 3) {
                $activeWorksheet->getStyle('A3:L'.($row-1))->applyFromArray($dataStyle);
                
                // Center align specific columns
                $activeWorksheet->getStyle('A3:A'.($row-1))->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $activeWorksheet->getStyle('F3:F'.($row-1))->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $activeWorksheet->getStyle('I3:I'.($row-1))->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $activeWorksheet->getStyle('J3:J'.($row-1))->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $activeWorksheet->getStyle('K3:K'.($row-1))->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $activeWorksheet->getStyle('L3:L'.($row-1))->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                
                // Enable text wrapping for Task and Status Task columns
                $activeWorksheet->getStyle('G3:H'.($row-1))->getAlignment()->setWrapText(true);
                $activeWorksheet->getStyle('G3:H'.($row-1))->getAlignment()->setVertical(Alignment::VERTICAL_TOP);
                
                // Set row height for better readability when text wraps
                for ($i = 3; $i < $row; $i++) {
                    $activeWorksheet->getRowDimension($i)->setRowHeight(30);
                }
            }

            // Set sheet name
            $activeWorksheet->setTitle('Project Report');

            // Generate filename
            $filename = 'project_report_' . date('Y_m_d_H_i_s') . '.xlsx';

            // Create writer and download
            $writer = new Xlsx($spreadsheet);
            
            $tempFile = tempnam(sys_get_temp_dir(), 'project_export');
            $writer->save($tempFile);

            return response()->download($tempFile, $filename, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ])->deleteFileAfterSend(true);

        } catch (\Exception $e) {
            return response()->json([
                'code' => 500,
                'status' => 'error',
                'message' => 'Failed to export projects: ' . $e->getMessage()
            ], 500);
        }
    }


}

