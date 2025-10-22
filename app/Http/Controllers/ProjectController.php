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
// Notification sending disabled: imports removed
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
     * Recursively delete a project feedback and its replies, including attached files.
     */
    private function deleteProjectFeedbackCascade(ProjectFeedback $feedback): void
    {
        // Delete children first
        try {
            $children = ProjectFeedback::where('parent_id', $feedback->id)->get();
            foreach ($children as $child) {
                $this->deleteProjectFeedbackCascade($child);
            }
        } catch (\Throwable $_) {}

        // Delete attached image
        try {
            if (!empty($feedback->image)) {
                $path = public_path('file/project/' . $feedback->image);
                if (is_file($path)) { @unlink($path); }
            }
        } catch (\Throwable $_) {}

        // Delete legacy single reference file
        try {
            if (!empty($feedback->reference_file)) {
                $p = public_path('file/project_reference_files/' . $feedback->reference_file);
                if (is_file($p)) { @unlink($p); }
            }
        } catch (\Throwable $_) {}

        // Delete array reference files
        try {
            $refFiles = is_array($feedback->reference_files) ? $feedback->reference_files : [];
            if (empty($refFiles) && is_string($feedback->reference_files) && $feedback->reference_files !== '') {
                $decoded = json_decode($feedback->reference_files, true);
                if (is_array($decoded)) $refFiles = $decoded;
            }
            foreach ($refFiles as $rf) {
                if (!$rf) continue; $p = public_path('file/project_reference_files/' . $rf); if (is_file($p)) { @unlink($p); }
            }
        } catch (\Throwable $_) {}

        // Finally delete row
        try { $feedback->delete(); } catch (\Throwable $_) {}
    }
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

            $canSeeAll = false;
            try {
                $userType = strtoupper((string) ($user->user_type ?? ''));
                $userRole = strtoupper((string) ($user->user_role ?? ''));
                if ($userType === 'MANAGEMENT' && in_array($userRole, ['GENERAL_MANAGER', 'CEO'])) {
                    $canSeeAll = true;
                }
                if ($userType === 'ADMINISTRATOR' && $userRole === 'ADMINISTRATOR') {
                    $canSeeAll = true;
                }

                if ($userType === 'REGULAR' && $userRole === 'PERSONAL_ASSISTANT') {
                    $canSeeAll = true;
                }

            } catch (\Throwable $_) {
                $canSeeAll = false;
            }

            if ($canSeeAll) {
                $projectsQuery = Project::where('status', '!=', 'DELETED');
            } else {
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
            }

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

            $canSeeAll = false;
            try {
                $userType = strtoupper((string) ($user->user_type ?? ''));
                $userRole = strtoupper((string) ($user->user_role ?? ''));
                if ($userType === 'MANAGEMENT' && in_array($userRole, ['GENERAL_MANAGER', 'CEO'])) {
                    $canSeeAll = true;
                }
                if ($userType === 'ADMINISTRATOR' && $userRole === 'ADMINISTRATOR') {
                    $canSeeAll = true;
                }

                if ($userType === 'REGULAR' && $userRole === 'PERSONAL_ASSISTANT') {
                    $canSeeAll = true;
                }
            } catch (\Throwable $_) {
                $canSeeAll = false;
            }

            if ($taskScope === 'all' || $canSeeAll) {

                $projects = Project::where('status', '!=', 'DELETED')
                    ->where(function ($q) use ($user, $canSeeAll) {
                        if ($canSeeAll) {
                            $q->whereRaw('1=1');
                        } else {
                            $q->whereNull('project_type')
                              ->orWhere('project_type', 'public');
                            try {
                                if ($user && $user->id) {
                                    $q->orWhere(function ($qq) use ($user) {
                                        $qq->where('project_type', 'private')
                                           ->where('created_by', $user->id);
                                    });
                                }
                            } catch (\Throwable $_) {
                            }
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

        // Load parents for tree badge and detail
        $parents = [];
        try {
            $parents = $project->relationLoaded('parents') ? $project->parents : $project->parents()->get();
        } catch (\Throwable $_) { $parents = collect(); }

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
            'parents' => $parents->map(fn($p) => ['id' => $p->id, 'title' => $p->title, 'image' => $p->image]),
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

    /**
     * Return a tree of projects (id, title, start/due, status, parents) for the Project Tree modal.
     */
    public function getProjectTree(Request $request)
    {
        try {
            $user = $request->user();
            $employeeId = $user && $user->employee ? $user->employee->id : null;

            $canSeeAll = false;
            try {
                $userType = strtoupper((string) ($user->user_type ?? ''));
                $userRole = strtoupper((string) ($user->user_role ?? ''));
                if ($userType === 'MANAGEMENT' && in_array($userRole, ['GENERAL_MANAGER', 'CEO'])) {
                    $canSeeAll = true;
                }
                if ($userType === 'ADMINISTRATOR' && $userRole === 'ADMINISTRATOR') {
                    $canSeeAll = true;
                }
                if ($userType === 'REGULAR' && $userRole === 'PERSONAL_ASSISTANT') {
                    $canSeeAll = true;
                }
            } catch (\Throwable $_) {
                $canSeeAll = false;
            }

            if (!$employeeId && !$canSeeAll) {
                return response()->json(['code' => 200, 'status' => 'success', 'data' => []]);
            }

            // Step 1: Project yang langsung di-assign ke user
            $assignedProjectIds = [];
            if (!$canSeeAll) {
                $assignedProjectIds = DB::table('project_assignments')
                    ->where('employee_id', $employeeId)
                    ->whereIn('role', ['author', 'co_author', 'contributor'])
                    ->pluck('project_id')
                    ->toArray();
            }

            // Step 2: Ambil semua anak project dari project-project di atas
            $childProjectIds = [];
            if (!empty($assignedProjectIds)) {
                // Cari di kolom part_of_project
                $childProjectIds = DB::table('projects')
                    ->whereIn('part_of_project', $assignedProjectIds)
                    ->pluck('id')
                    ->toArray();

                // Cari juga di project_parents (multi parent)
                $parentMatches = DB::table('project_parents')
                    ->get(['project_id', 'project_parent_ids'])
                    ->filter(function ($row) use ($assignedProjectIds) {
                        if (!$row->project_parent_ids) return false;
                        $parents = json_decode($row->project_parent_ids, true);
                        return is_array($parents) && count(array_intersect($parents, $assignedProjectIds)) > 0;
                    })
                    ->pluck('project_id')
                    ->toArray();

                $childProjectIds = array_unique(array_merge($childProjectIds, $parentMatches));
            }

            // Gabungkan semua project_id yang bisa dilihat
            $visibleProjectIds = $canSeeAll
                ? Project::where('status', '!=', 'DELETED')->pluck('id')->toArray()
                : array_unique(array_merge($assignedProjectIds, $childProjectIds));

            // Step 3: Ambil data project yang bisa dilihat
            $projects = Project::whereIn('id', $visibleProjectIds)
                ->where('status', '!=', 'DELETED')
                ->withCount([
                    'tasks as total_tasks' => function ($q) {
                        $q->whereRaw('LOWER(status) NOT IN (?, ?)', ['canceled', 'deleted']);
                    },
                    'tasks as completed_tasks' => function ($q) {
                        $q->whereIn(DB::raw('LOWER(status)'), ['completed']);
                    },
                    'tasks as new_request_tasks' => function ($q) {
                        $q->whereIn(DB::raw('LOWER(status)'), ['new_request']);
                    },
                    'tasks as late_tasks' => function ($q) {
                        $q->whereRaw('LOWER(status) <> ?', ['completed'])
                        ->whereNotNull('due_date')
                        ->where('due_date', '<', now());
                    },
                ])
                ->get(['id', 'title', 'status', 'start_date', 'due_date', 'image', 'part_of_project']);

            $data = $projects->map(function ($p) {
                $total = (int) ($p->total_tasks ?? 0);
                $completed = (int) ($p->completed_tasks ?? 0);
                $newReq = (int) ($p->new_request_tasks ?? 0);
                $lateCnt = (int) ($p->late_tasks ?? 0);

                $visual = 'not-started';
                if ($total === 0) {
                    $visual = 'not-started';
                } elseif ($completed === $total) {
                    $visual = 'complete';
                } else {
                    if ($newReq === $total) {
                        $visual = 'not-started';
                    } else {
                        $visual = 'in-progress';
                    }
                }

                if ($visual !== 'complete') {
                    $isPastDue = $p->due_date && (now()->toDateString() > (string) $p->due_date);
                    if ($lateCnt > 0 || $isPastDue) {
                        $visual = 'late';
                    }
                }

                $parentRecord = DB::table('project_parents')
                    ->where('project_id', $p->id)
                    ->first();

                $parentIds = [];
                if ($parentRecord && $parentRecord->project_parent_ids) {
                    $parentIds = json_decode($parentRecord->project_parent_ids, true) ?: [];
                }

                return [
                    'id' => $p->id,
                    'title' => $p->title,
                    'status' => $p->status,
                    'start_date' => $p->start_date,
                    'due_date' => $p->due_date,
                    'image' => $p->image,
                    'visual_status' => $visual,
                    'parent_ids' => $parentIds,
                    'legacy_parent_id' => $p->part_of_project ?? null,
                ];
            })->values();

            return response()->json(['code' => 200, 'status' => 'success', 'data' => $data]);
        } catch (\Exception $e) {
            $status = $this->deriveHttpStatusFromException($e);
            return response()->json(['code' => $status, 'status' => 'error', 'message' => $e->getMessage()], $status);
        }
    }

    /**
     * Add a parent relation to a project (multi-parent). body: { parent_id }
     */
    public function addParent(Request $request, string $id)
    {
        try {
            $project = Project::findOrFail($id);
            $parentId = (int) $request->input('parent_id');
            if ($parentId <= 0) throw new \Exception('parent_id is required');
            if ($parentId === (int) $project->id) throw new \Exception('Project cannot be its own parent');

            // Authorization: author or co-author or privileged roles can restructure project tree
            $user = $request->user();
            $employeeId = $user && $user->employee ? $user->employee->id : null;

            // Determine privileged backend roles (management/general manager/CEO or administrator)
            $canSeeAll = false;
            try {
                $userType = strtoupper((string) ($user->user_type ?? ''));
                $userRole = strtoupper((string) ($user->user_role ?? ''));
                if ($userType === 'MANAGEMENT' && in_array($userRole, ['GENERAL_MANAGER', 'CEO'])) {
                    $canSeeAll = true;
                }
                if ($userType === 'ADMINISTRATOR' && $userRole === 'ADMINISTRATOR') {
                    $canSeeAll = true;
                }
                if ($userType === 'REGULAR' && $userRole === 'PERSONAL_ASSISTANT') {
                    $canSeeAll = true;
                }
            } catch (\Throwable $_) { $canSeeAll = false; }

            $isAuthor = $employeeId && \App\Models\ProjectAssignment::where('project_id', $project->id)
                ->where('employee_id', $employeeId)
                ->where('role', 'author')->exists();

            $isCoAuthor = $employeeId && \App\Models\ProjectAssignment::where('project_id', $project->id)
                ->where('employee_id', $employeeId)
                ->where('role', 'co_author')->exists();

            $isContributor = $employeeId && \App\Models\ProjectAssignment::where('project_id', $project->id)
                ->where('employee_id', $employeeId)
                ->where('role', 'contributor')->exists();

            // Also allow the original creator (created_by) to manage the hierarchy as a safe fallback
            $isCreator = $user && isset($project->created_by) && $project->created_by == $user->id;

            if (!($isAuthor || $isCoAuthor || $isContributor || $isCreator || $canSeeAll)) {
                // Diagnostic logging to help troubleshoot unexpected 403 during drag & drop
                try {
                    // collect any project assignment roles for this employee (if present)
                    $roles = [];
                    if ($employeeId) {
                        $roles = \App\Models\ProjectAssignment::where('project_id', $project->id)
                            ->where('employee_id', $employeeId)
                            ->pluck('role')
                            ->toArray();
                    }

                    \Log::info('addParent authorization failed', [
                        'user_id' => $user?->id ?? null,
                        'employee_id' => $employeeId,
                        'project_id' => $project->id,
                        'parent_id' => $parentId,
                        'isAuthor' => $isAuthor,
                        'isCoAuthor' => $isCoAuthor,
                        'isContributor' => $isContributor,
                        'isCreator' => $isCreator,
                        'canSeeAll' => $canSeeAll,
                        'user_type' => $user?->user_type ?? null,
                        'user_role' => $user?->user_role ?? null,
                        'assignment_roles' => $roles,
                    ]);
                } catch (\Throwable $_) {}

                return response()->json(['code' => 403, 'status' => 'error', 'message' => 'Only author can modify project hierarchy'], 403);
            }

            // Prevent cycles: check if parentId is a descendant of $project recursively
            if ($this->isDescendantOf($project->id, $parentId)) {
                return response()->json(['code' => 422, 'status' => 'error', 'message' => 'Cycle detected'], 422);
            }

            // Add parent using the model method
            $project->addParent($parentId);

            return response()->json(['code' => 200, 'status' => 'success']);
        } catch (\Exception $e) {
            $status = $this->deriveHttpStatusFromException($e);
            return response()->json(['code' => $status, 'status' => 'error', 'message' => $e->getMessage()], $status);
        }
    }

    /**
     * Remove a parent relation or clear all parents when parent_id is null.
     */
    public function removeParent(Request $request, string $id)
    {
        try {
            $project = Project::findOrFail($id);
            $parentId = $request->input('parent_id');

            // Authorization: author or co-author or privileged roles can remove parents
            $user = $request->user();
            $employeeId = $user && $user->employee ? $user->employee->id : null;

            $canSeeAll = false;
            try {
                $userType = strtoupper((string) ($user->user_type ?? ''));
                $userRole = strtoupper((string) ($user->user_role ?? ''));
                if ($userType === 'MANAGEMENT' && in_array($userRole, ['GENERAL_MANAGER', 'CEO'])) {
                    $canSeeAll = true;
                }
                if ($userType === 'ADMINISTRATOR' && $userRole === 'ADMINISTRATOR') {
                    $canSeeAll = true;
                }
                if ($userType === 'REGULAR' && $userRole === 'PERSONAL_ASSISTANT') {
                    $canSeeAll = true;
                }
            } catch (\Throwable $_) { $canSeeAll = false; }

            $isAuthor = $employeeId && \App\Models\ProjectAssignment::where('project_id', $project->id)
                ->where('employee_id', $employeeId)
                ->where('role', 'author')->exists();

            $isCoAuthor = $employeeId && \App\Models\ProjectAssignment::where('project_id', $project->id)
                ->where('employee_id', $employeeId)
                ->where('role', 'co_author')->exists();

            $isContributor = $employeeId && \App\Models\ProjectAssignment::where('project_id', $project->id)
                ->where('employee_id', $employeeId)
                ->where('role', 'contributor')->exists();

            // Allow creator as well
            $isCreator = $user && isset($project->created_by) && $project->created_by == $user->id;

            if (!($isAuthor || $isCoAuthor || $isContributor || $isCreator || $canSeeAll)) {
                try {
                    $roles = [];
                    if ($employeeId) {
                        $roles = \App\Models\ProjectAssignment::where('project_id', $project->id)
                            ->where('employee_id', $employeeId)
                            ->pluck('role')
                            ->toArray();
                    }
                    \Log::info('removeParent authorization failed', [
                        'user_id' => $user?->id ?? null,
                        'employee_id' => $employeeId,
                        'project_id' => $project->id,
                        'parent_id' => $parentId,
                        'isAuthor' => $isAuthor,
                        'isCoAuthor' => $isCoAuthor,
                        'isContributor' => $isContributor,
                        'isCreator' => $isCreator,
                        'canSeeAll' => $canSeeAll,
                        'user_type' => $user?->user_type ?? null,
                        'user_role' => $user?->user_role ?? null,
                        'assignment_roles' => $roles,
                    ]);
                } catch (\Throwable $_) {}

                return response()->json(['code' => 403, 'status' => 'error', 'message' => 'Only author can modify project hierarchy'], 403);
            }

            if ($parentId === null || $parentId === '') {
                // Clear all parents
                $project->clearParents();
            } else {
                // Remove specific parent
                $project->removeParent((int)$parentId);
            }

            return response()->json(['code' => 200, 'status' => 'success']);
        } catch (\Exception $e) {
            $status = $this->deriveHttpStatusFromException($e);
            return response()->json(['code' => $status, 'status' => 'error', 'message' => $e->getMessage()], $status);
        }
    }

    /**
     * Check if projectId is a descendant of potentialAncestorId (to prevent cycles)
     */
    private function isDescendantOf($projectId, $potentialAncestorId, $visited = [])
    {
        if (in_array($projectId, $visited)) {
            return true; // Cycle detected
        }

        $visited[] = $projectId;

       
        $children = collect();
        try {
            $children = collect(DB::table('project_parents')
                ->whereRaw('JSON_CONTAINS(project_parent_ids, ?)', [json_encode((int)$projectId)])
                ->pluck('project_id'));
        } catch (\Throwable $e) {
            try {
                $rows = DB::table('project_parents')->get(['project_id', 'project_parent_ids']);
                $filtered = collect($rows)->filter(function ($row) use ($projectId) {
                    if (!isset($row->project_parent_ids) || $row->project_parent_ids === null) return false;
                    $raw = $row->project_parent_ids;
                    if (is_string($raw)) {
                        $decoded = json_decode($raw, true);
                        if (is_array($decoded)) {
                            return in_array((int)$projectId, array_map('intval', $decoded));
                        }
                        if (strpos($raw, ',') !== false) {
                            $parts = array_map('trim', explode(',', $raw));
                            return in_array((string)$projectId, $parts) || in_array((int)$projectId, array_map('intval', $parts));
                        }
                    }
                    if (is_array($raw)) {
                        return in_array((int)$projectId, array_map('intval', $raw));
                    }
                    return false;
                })->pluck('project_id');

                $children = collect($filtered->toArray());
            } catch (\Throwable $_) {
                $children = collect();
            }
        }

        foreach ($children as $childId) {
            if ($childId == $potentialAncestorId) {
                return true; // Found descendant
            }
            if ($this->isDescendantOf($childId, $potentialAncestorId, $visited)) {
                return true;
            }
        }

        return false;
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

            // Check if user is special role (GENERAL_MANAGER, CEO, or ADMINISTRATOR)
            $canSeeAll = false;
            try {
                $userType = strtoupper((string) ($user->user_type ?? ''));
                $userRole = strtoupper((string) ($user->user_role ?? ''));
                if ($userType === 'MANAGEMENT' && in_array($userRole, ['GENERAL_MANAGER', 'CEO'])) {
                    $canSeeAll = true;
                }
                if ($userType === 'ADMINISTRATOR' && $userRole === 'ADMINISTRATOR') {
                    $canSeeAll = true;
                }
                if ($userType === 'REGULAR' && $userRole === 'PERSONAL_ASSISTANT') {
                    $canSeeAll = true;
                }
            } catch (\Throwable $_) {
                $canSeeAll = false;
            }

            if (!$employeeId && $taskScope !== 'all' && !$canSeeAll) {
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
            // Special roles (GENERAL_MANAGER, CEO, ADMINISTRATOR) can see ALL projects
            $query = Project::where('status', '!=', 'DELETED')
                ->where(function ($q) use ($employeeId, $canSeeAll) {
                    if ($canSeeAll) {
                        // Special roles can see ALL projects without restriction
                        $q->whereRaw('1=1');
                    } else {
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
                    }
                });

            $divisionId = $request->input('division_id');
            if ($divisionId !== null && $divisionId !== '') {
                $query->where('division_id', $divisionId);
            }


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

            if ($taskScope !== 'all' && !$canSeeAll) {
                // Only include projects where current employee is assigned.
                // Authors should always see their projects (even if is_receive not set).
                // Co-authors and contributors should only see projects they've accepted (is_receive = true)
                // Special roles (GENERAL_MANAGER, CEO, ADMINISTRATOR) skip this check
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
                    // Search by employee names (author, co_author, contributor)
                    $q->orWhereHas('projectAssignments', function ($qa) use ($like) {
                        $qa->whereHas('employee', function ($qe) use ($like) {
                            $qe->where('name', 'like', $like);
                        });
                    });
                });
            }

            if ($filter === 'not_started') {
                // New Request: Project tanpa task ATAU semua task berstatus new_request
                // BUT exclude projects that are past due date (those should be "late")
                $query->where(function ($q) {
                    $q->whereDoesntHave('tasks')
                        ->orWhereIn('projects.id', function ($subquery) {
                            $subquery->from('tasks')
                                ->selectRaw('project_id')
                                ->groupBy('project_id')
                                ->havingRaw('COUNT(*) = SUM(CASE WHEN status = "new_request" THEN 1 ELSE 0 END)');
                        });
                })
                // Exclude projects that are past their due date
                ->where(function ($q) {
                    $q->whereNull('due_date')
                        ->orWhere('due_date', '>=', now()->toDateString());
                });
            } elseif ($filter === 'late') {
                // Late: Projects that match the visual 'late' status logic from getProjectTree
                // This means projects that are NOT completed AND (have late tasks OR are past due date)
                $query->where(function ($q) {
                    // First, exclude projects that are fully completed (all tasks completed)
                    $q->whereNotIn('projects.id', function ($subquery) {
                        $subquery->from('tasks')
                            ->selectRaw('project_id')
                            ->groupBy('project_id')
                            ->havingRaw('COUNT(*) = SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END)')
                            ->havingRaw('COUNT(*) > 0'); // Must have tasks to be considered completed
                    });
                })
                ->where(function ($q) {
                    // Then, include projects that have late tasks OR are past their due date
                    $q->whereHas('tasks', function ($taskQuery) {
                        // Projects with late tasks (task past due and not completed)
                        $taskQuery->whereRaw('LOWER(status) <> ?', ['completed'])
                                  ->whereNotNull('due_date')
                                  ->where('due_date', '<', now());
                    })
                    // OR projects past their due date (regardless of tasks)
                    ->orWhere(function ($projectQuery) {
                        $projectQuery->whereNotNull('due_date')
                                    ->where('due_date', '<', now()->toDateString());
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
                    'tasks as new_reques_tasks' => function ($q) {
                        $q->where('status', 'new_request');
                    },
                    'tasks as completed_tasks' => function ($q) {
                        $q->where('status', 'completed');
                    },
                    'tasks as late_tasks' => fn($q) =>
                        $q->whereRaw('LOWER(status) <> ?', ['completed'])
                            ->whereNotNull('due_date')
                            ->where('due_date', '<', now()),
                ])
                ->paginate(27);

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
                    'start_date' => $project->start_date,
                    'due_date' => $project->due_date,
                    'task_counts' => [
                        'total' => $project->total_tasks,
                        'in_progress' => $project->in_progress_tasks,
                        'new_request' => $project->new_reques_tasks,
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

            // Check if user is special role (GENERAL_MANAGER, CEO, or ADMINISTRATOR)
            $canSeeAll = false;
            try {
                $userType = strtoupper((string) ($user->user_type ?? ''));
                $userRole = strtoupper((string) ($user->user_role ?? ''));
                if ($userType === 'MANAGEMENT' && in_array($userRole, ['GENERAL_MANAGER', 'CEO'])) {
                    $canSeeAll = true;
                }
                if ($userType === 'ADMINISTRATOR' && $userRole === 'ADMINISTRATOR') {
                    $canSeeAll = true;
                }
                if ($userType === 'REGULAR' && $userRole === 'PERSONAL_ASSISTANT') {
                    $canSeeAll = true;
                }
            } catch (\Throwable $_) {
                $canSeeAll = false;
            }

            if (!$expectsJson) {
                // Render server-side view with full project model so Blade can display data
                $project = Project::with(['department', 'division', 'projectAssignments.employee.user', 'tasks'])->find($id);

                if (!$project || (isset($project->status) && $project->status === 'DELETED')) {
                    abort(404);
                }

                if (!$employeeId && !$canSeeAll) {
                    return redirect('/project')->with('error', 'You do not have permission to access the project.');
                }

                // Special roles can access all projects without assignment check
                if (!$canSeeAll) {
                    $isAssigned = ProjectAssignment::where('project_id', $project->id)
                        ->where('employee_id', $employeeId)
                        ->whereIn('role', ['author', 'co_author', 'contributor'])
                        ->exists();
                    if (!$isAssigned) {
                        return redirect('/project')->with('error', 'You do not have permission to access the project.');
                    }
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
            // Special roles (GENERAL_MANAGER, CEO, ADMINISTRATOR) can access all projects
            if (!$employeeId && !$canSeeAll) {
                return response()->json([
                    'code' => 403,
                    'status' => 'error',
                    'message' => 'Unauthorized'
                ], 403);
            }

            if (!$canSeeAll) {
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

        // Check if user is special role (GENERAL_MANAGER, CEO, or ADMINISTRATOR)
        $canSeeAll = false;
        try {
            $userType = strtoupper((string) ($user->user_type ?? ''));
            $userRole = strtoupper((string) ($user->user_role ?? ''));
            if ($userType === 'MANAGEMENT' && in_array($userRole, ['GENERAL_MANAGER', 'CEO'])) {
                $canSeeAll = true;
            }
            if ($userType === 'ADMINISTRATOR' && $userRole === 'ADMINISTRATOR') {
                $canSeeAll = true;
            }
            if ($userType === 'REGULAR' && $userRole === 'PERSONAL_ASSISTANT') {
                $canSeeAll = true;
            }
        } catch (\Throwable $_) {
            $canSeeAll = false;
        }

        foreach ($ids as $id) {
            $project = $projects->firstWhere('id', $id);

            if (!$project || (isset($project->status) && $project->status === 'DELETED')) {
                $result[] = null; // kalo ga ketemu atau deleted, tetap null
                continue;
            }

            // Enforce visibility: if project is private, only the author may see it
            // Special roles (GENERAL_MANAGER, CEO, ADMINISTRATOR) can see ALL projects
            if (!$canSeeAll) {
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
        $user = auth()->user();
        $employee = $user->employee ?? null;
        $deptId = $employee->department_id ?? null;

        $project = Project::with(['department', 'division', 'projectAssignments.employee.user'])
            ->findOrFail($id);

        if ($deptId && $project->department_id != $deptId) {
            return response()->json([
                'code' => 403,
                'status' => 'error',
                'message' => 'You are not authorized to access this project.'
            ], 403);
        }

        $coAuthors = [];
        $contributors = [];

        foreach ($project->projectAssignments as $assignment) {
            $employee = $assignment->employee;
            if (!$employee) continue;
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
        $files = $project->reference_files ?? $project->reference_file;
        if (is_string($files) && $files !== '') $files = [$files];
        if (!is_array($files)) $files = [];
        $response['reference_files'] = $files;
        $response['reference_file'] = $files;
        $response['reference_urls'] = $project->reference_urls ?: ($project->reference_url ? [$project->reference_url] : []);
        $response['co_authors'] = $coAuthors;
        $response['contributors'] = $contributors;


    return response()->json($response);
    }

    public function update(Request $request, string $id)
    {
        DB::beginTransaction();
        try {
            $project = Project::findOrFail($id);
            $authEmp = auth()->user()->employee ?? null;
            if (!$authEmp) throw new \Exception('Authenticated user has no employee relation');
            if ($authEmp->department_id && $project->department_id != $authEmp->department_id) {
                throw new \Exception('You are not allowed to update a project outside your department.');
            }

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
                            if (in_array($ext, $allowedExt, true)) return;
                            $mime = strtolower((string) ($value->getClientMimeType() ?? ''));
                            if (in_array($mime, $allowedMime, true)) return;
                        } catch (\Throwable $_) {}
                        $fail('Unsupported file type.');
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
                            if (in_array($ext, $allowedExt, true)) return;
                            $mime = strtolower((string) ($value->getClientMimeType() ?? ''));
                            if (in_array($mime, $allowedMime, true)) return;
                        } catch (\Throwable $_) {}
                        $fail('Unsupported file type.');
                    }
                ],
                'co_author' => 'nullable|array',
                'co_author.*' => 'nullable|exists:employees,id',
                'contributors' => 'nullable|array',
                'contributors.*' => 'nullable|exists:employees,id',
            ]);

            $existingCoAuthors = ProjectAssignment::where('project_id', $project->id)
                ->where('role', 'co_author')->pluck('employee_id')->toArray();

            $existingContributors = ProjectAssignment::where('project_id', $project->id)
                ->where('role', 'contributor')->pluck('employee_id')->toArray();

            $project->title = $request->title;
            if ($request->has('project_type')) {
                $project->project_type = in_array($request->input('project_type'), ['public', 'private']) ? $request->input('project_type') : 'public';
            }
            $project->description = $request->description;

            $departmentIdToUse = $authEmp->department_id;
            $providedDivision = $request->input('division');
            if ($providedDivision) {
                $div = Division::where('id', $providedDivision)->where('department_id', $departmentIdToUse)->first();
                if (!$div) throw new \Exception('Selected division is invalid for your department');
                $divisionIdToUse = $providedDivision;
            } else {
                $divisionIdToUse = null;
            }

            $project->department_id = $departmentIdToUse;
            $project->division_id = $divisionIdToUse;
            $project->status = $request->status ?? 'ACTIVE';

            $refUrls = [];
            if ($request->has('reference_urls')) {
                $incoming = $request->input('reference_urls', []);
                if (is_array($incoming)) $refUrls = array_values(array_filter($incoming));
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

            if ($request->input('remove_image') == "1") {
                if ($project->image && file_exists(public_path('file/project/' . $project->image))) {
                    @unlink(public_path('file/project/' . $project->image));
                }
                $project->image = null;
            }

            if ($request->hasFile('image')) {
                if ($project->image && file_exists(public_path('file/project/' . $project->image))) {
                    @unlink(public_path('file/project/' . $project->image));
                }
                $image = $request->file('image');
                $imageName = 'PROJECT_' . time() . '.' . $image->getClientOriginalExtension();
                $image->move(public_path('file/project'), $imageName);
                $project->image = $imageName;
            }

            $existing = [];
            if ($request->has('existing_reference_files')) {
                $existing = json_decode($request->existing_reference_files, true) ?: [];
            }
            $existing = is_array($existing) ? $existing : [];
            $currentFiles = $project->reference_files ?? $project->reference_file ?? [];
            if (!is_array($currentFiles) && $currentFiles) $currentFiles = [$currentFiles];
            $toDelete = array_diff($currentFiles, $existing);
            foreach ($toDelete as $del) {
                $path = public_path('file/project/' . $del);
                if ($del && file_exists($path)) @unlink($path);
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
                if (!$file) continue;
                $fileName = 'PROJECT_REF_' . time() . '_' . $idx . '_' . Str::random(5) . '.' . $file->getClientOriginalExtension();
                $file->move(public_path('file/project'), $fileName);
                $finalFiles[] = $fileName;
            }

            $project->reference_files = $finalFiles;
            $project->save();

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

            $newCoAuthors = $request->co_author && is_array($request->co_author) ? array_unique($request->co_author) : [];
            $addedCoAuthors = array_diff($newCoAuthors, $existingCoAuthors);

            ProjectAssignment::where('project_id', $project->id)->where('role', 'co_author')->delete();
            if ($newCoAuthors) {
                $coAuthorAssignments = [];
                foreach ($newCoAuthors as $employeeId) {
                    if (!Employee::where('id', $employeeId)->exists()) throw new \Exception("Co-author employee ID {$employeeId} does not exist");
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

            $newContributors = $request->contributors && is_array($request->contributors) ? array_unique($request->contributors) : [];
            $addedContributors = array_diff($newContributors, $existingContributors);

            ProjectAssignment::where('project_id', $project->id)->where('role', 'contributor')->delete();
            if ($newContributors) {
                $contributorAssignments = [];
                foreach ($newContributors as $employeeId) {
                    if (!Employee::where('id', $employeeId)->exists()) throw new \Exception("Contributor employee ID {$employeeId} does not exist");
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

            $employee = Employee::where('user_id', auth()->id())
                ->where('status','ACTIVE')
            ->first();

            if (!$employee) {
                throw new \Exception('Employee not found');
            }

            $projectAssignments = ProjectAssignment::where('project_id', $id)
                ->where('employee_id',$employee->id)
                ->whereIn('role',['author','co_author'])
            ->first();

            if (!$projectAssignments) {
                throw new \Exception('Access denied');
            }

            $project = Project::findOrFail($id);

            if(!$project) {
                throw new \Exception('Access denied');
            }

            $taskExist = Task::where('project_id', $project->id)
                ->whereIn('status',['completed','in_progress'])
            ->first();

            if($taskExist) {
                throw new \Exception('This project has a task Active, it cannot be deleted');
            }

            // If project has any tasks, do not allow deletion
            // if ($project->tasks()->exists()) {
            //     DB::rollBack();
            //     return response()->json([
            //         'code' => 400,
            //         'status' => 'error',
            //         'message' => 'This project has a task, it cannot be deleted'
            //     ], 400);
            // }

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
        // Debug: log all request data
        \Log::info('StoreFeedback request data:', [
            'all_request_data' => $request->all(),
            'files' => $request->allFiles(),
            'has_reference_files' => $request->hasFile('reference_files'),
            'reference_files_count' => $request->hasFile('reference_files') ? count($request->file('reference_files')) : 0
        ]);

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
                'reference_files.*' => 'file|max:5120',
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

                    // Debug: log file info
                    \Log::info('Uploading reference file:', [
                        'original_name' => $file->getClientOriginalName(),
                        'mime_type' => $file->getMimeType(),
                        'extension' => $file->getClientOriginalExtension(),
                        'size' => $file->getSize()
                    ]);

                    $fileName = 'FEEDBACK_' . time() . '_' . Str::random(5) . '.' . $file->getClientOriginalExtension();
                    $file->move(public_path('file/project_reference_files'), $fileName);
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
                'reference_files.*' => 'file|max:5120',
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
                $path = public_path('file/project_reference_files/' . $del);
                if ($del && file_exists($path))
                    @unlink($path);
            }
            $finalFiles = $existing;
            if ($request->hasFile('reference_files')) {
                foreach ((array) $request->file('reference_files') as $rf) {
                    if (!$rf)
                        continue;

                    // Debug: log file info for update
                    \Log::info('Updating reference file:', [
                        'original_name' => $rf->getClientOriginalName(),
                        'mime_type' => $rf->getMimeType(),
                        'extension' => $rf->getClientOriginalExtension(),
                        'size' => $rf->getSize()
                    ]);

                    $name = 'FEEDBACK_' . time() . '_' . Str::random(5) . '.' . $rf->getClientOriginalExtension();
                    $rf->move(public_path('file/project_reference_files'), $name);
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

            // Cascade delete feedback + its replies and files
            $this->deleteProjectFeedbackCascade($feedback);

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
     * Get count of feedbacks for a specific project (excluding replies whose parent no longer exists).
     */
    public function getProjectFeedbackCount($projectId)
    {
        try {
            $project = Project::find($projectId);
            if (!$project || ($project->status ?? null) === 'DELETED') {
                return response()->json([
                    'code' => 200,
                    'status' => 'success',
                    'data' => ['count' => 0]
                ]);
            }

            $count = ProjectFeedback::where('project_id', $projectId)
                ->where(function($q){
                    $q->whereNull('parent_id')
                      ->orWhereExists(function($sub){
                          $sub->select(DB::raw(1))
                              ->from('project_feedbacks as p')
                              ->whereColumn('p.id', 'project_feedbacks.parent_id');
                      });
                })
                ->count();

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => ['count' => $count]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => ['count' => 0]
            ]);
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
            // Current employee context (filter results to only their assignments)
            $employeeId = auth()->user()?->employee?->id;

            // Get active projects with relationships, filtered by employee assignment when available
            $projects = Project::where('status', '!=', 'DELETED')
                // Only include projects where this employee is assigned (when employee context exists)
                ->when($employeeId, function ($q) use ($employeeId) {
                    $q->whereHas('projectAssignments', function ($qa) use ($employeeId) {
                        $qa->where('employee_id', $employeeId);
                    });
                })
                ->with([
                    'department',
                    'division',
                    // Only include tasks assigned to this employee and not canceled/deleted
                    'tasks' => function($query) use ($employeeId) {
                        $query->whereRaw('LOWER(status) NOT IN (?, ?)', ['canceled', 'deleted'])
                              ->when($employeeId, function ($q) use ($employeeId) {
                                  $q->whereHas('assignments', function ($a) use ($employeeId) {
                                      $a->where('employee_id', $employeeId);
                                  });
                              });
                    },
                    // Keep loading assignments for reference (optionally could be filtered too)
                    'projectAssignments.employee'
                ])
                ->withCount([
                    // Count only this employee's active tasks within the project
                    'tasks as total_tasks' => function ($q) use ($employeeId) {
                        $q->whereRaw('LOWER(status) NOT IN (?, ?)', ['canceled', 'deleted'])
                          ->when($employeeId, function ($q2) use ($employeeId) {
                              $q2->whereHas('assignments', function ($a) use ($employeeId) {
                                  $a->where('employee_id', $employeeId);
                              });
                          });
                    },
                    // Completed tasks for this employee
                    'tasks as completed_tasks' => function($q) use ($employeeId) {
                        $q->whereIn(DB::raw('LOWER(status)'), ['completed'])
                          ->when($employeeId, function ($q2) use ($employeeId) {
                              $q2->whereHas('assignments', function ($a) use ($employeeId) {
                                  $a->where('employee_id', $employeeId);
                              });
                          });
                    },
                    // In progress-like tasks for this employee
                    'tasks as in_progress_tasks' => function($q) use ($employeeId) {
                        $q->whereIn(DB::raw('LOWER(status)'), ['in_progress', 'in progress', 'rejected'])
                          ->when($employeeId, function ($q2) use ($employeeId) {
                              $q2->whereHas('assignments', function ($a) use ($employeeId) {
                                  $a->where('employee_id', $employeeId);
                              });
                          });
                    },
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

            // Set headers: remove Department, Division and Status; combine Waktu Mulai & Deadline into Durasi
            $headers = [
                'A2' => 'No',
                'B2' => 'Nama Project',
                'C2' => 'Part of Project',
                'D2' => 'Project Type',
                'E2' => 'Task',
                'F2' => 'Status Task',
                'G2' => 'Durasi',
                'H2' => 'Jumlah Task'
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

            $activeWorksheet->getStyle('A2:H2')->applyFromArray($headerStyle)->getFont()->setBold(true)->setSize(10);
            $activeWorksheet->getStyle('A2:H2')
                ->getAlignment()
                ->setWrapText(true)
                ->setHorizontal(Alignment::HORIZONTAL_CENTER)
                ->setVertical(Alignment::VERTICAL_CENTER);

            // Set column widths (after removing Department/Division/Status)
            $columnWidths = [
                'A' => 5,   // No
                'B' => 30,  // Nama Project
                'C' => 20,  // Part of Project
                'D' => 12,  // Project Type
                'E' => 35,  // Task
                'F' => 15,  // Status Task
                'G' => 20,  // Durasi
                'H' => 12   // Jumlah Task
            ];

            foreach ($columnWidths as $column => $width) {
                $activeWorksheet->getColumnDimension($column)->setWidth($width);
            }

            // Helper to format duration similar to project detail
            $formatDuration = function ($startRaw, $endRaw) {
                if (empty($startRaw) && empty($endRaw)) return '-';
                try { $start = $startRaw ? Carbon::parse($startRaw) : null; } catch (\Throwable $_) { $start = null; }
                try { $end = $endRaw ? Carbon::parse($endRaw) : null; } catch (\Throwable $_) { $end = null; }
                if ($start && !$end) return $start->format('j F Y');
                if (!$start && $end) return $end->format('j F Y');
                if (!$start && !$end) return '-';
                $sY = $start->format('Y'); $eY = $end->format('Y');
                $sM = $start->format('F'); $eM = $end->format('F');
                $sD = $start->format('j'); $eD = $end->format('j');
                if ($sY === $eY) {
                    if ($sM === $eM) {
                        if ($sD === $eD) return "{$sD} {$sM} {$sY}";
                        return "{$sD}-{$eD} {$sM} {$sY}";
                    }
                    return "{$sD} {$sM} - {$eD} {$eM} {$sY}";
                }
                return "{$sD} {$sM} {$sY} - {$eD} {$eM} {$eY}";
            };

            // Fill data
            $row = 3;
            $no = 1;

            foreach ($projects as $project) {
                // For each project, write one Excel row per task. If no tasks, write a single row with 'No Tasks'.
                // Resolve part_of_project: if it stores another project's id, show that project's title
                $partOfProjectDisplay = $project->part_of_project ?? '-';
                if (!empty($project->part_of_project)) {
                    // If numeric and matches a project, try to resolve title
                    if (is_numeric($project->part_of_project)) {
                        try {
                            $parent = Project::find((int)$project->part_of_project);
                            if ($parent && isset($parent->title)) {
                                $partOfProjectDisplay = $parent->title;
                            }
                        } catch (\Throwable $_) {
                            // fallback keep original value
                        }
                    }
                }

                $baseProjectValues = [
                    'B' => $project->title,
                    'C' => $partOfProjectDisplay,
                    'D' => ucfirst($project->project_type ?? 'public'),
                    'L' => $project->total_tasks ?? 0, // temporary holder for total tasks
                ];

                // Determine the project's maximal (latest) deadline among its tasks.
                $projectMaxDue = null;
                foreach ($project->tasks as $tdd) {
                    if (empty($tdd->due_date)) continue;
                    try {
                        $d = Carbon::parse($tdd->due_date);
                    } catch (\Throwable $_) {
                        continue;
                    }
                    if ($projectMaxDue === null) {
                        $projectMaxDue = $d;
                    } else {
                        if ($d->greaterThan($projectMaxDue)) {
                            $projectMaxDue = $d;
                        }
                    }
                }
                if ($projectMaxDue === null && !empty($project->due_date)) {
                    try { $projectMaxDue = Carbon::parse($project->due_date); } catch (\Throwable $_) { $projectMaxDue = null; }
                }

                if ($project->tasks->count() > 0) {
                    // Remember start row for this project so we can merge project columns if multiple tasks
                    $projectStartRow = $row;
                    $projectNo = $no;
                    foreach ($project->tasks as $task) {
                        // Project columns (written per task row, will merge later)
                        $activeWorksheet->setCellValue('B'.$row, $baseProjectValues['B']);
                        $activeWorksheet->setCellValue('C'.$row, $baseProjectValues['C']);
                        $activeWorksheet->setCellValue('D'.$row, $baseProjectValues['D']);

                        // Task columns
                        $activeWorksheet->setCellValue('E'.$row, $task->title ?? '-');
                        $s = (string) ($task->status ?? '');
                        $s = str_replace('_', ' ', $s);
                        $s = trim($s);
                        $s = $s === '' ? '-' : ucfirst($s);
                        $activeWorksheet->setCellValue('F'.$row, $s);

                        // Durasi: prefer task start/due, fallback to project
                        $startRaw = $task->start_date ?: $project->start_date;
                        $endRaw = $task->due_date ?: $project->due_date;
                        $activeWorksheet->setCellValue('G'.$row, $formatDuration($startRaw, $endRaw));

                        $activeWorksheet->setCellValue('H'.$row, $baseProjectValues['L']);

                        // Set a reasonable row height per single-line task
                        $activeWorksheet->getRowDimension($row)->setRowHeight(18);

                        $row++;
                    }

                    // After writing all task rows for this project, merge project columns vertically if more than one task
                    $projectEndRow = $row - 1;

                    // Write project number in column A at projectStartRow and merge A if multiple rows
                    $activeWorksheet->setCellValue('A'.$projectStartRow, $projectNo);
                    if ($projectEndRow > $projectStartRow) {
                        // Merge project-related columns vertically across the task rows: A (No), B (Nama Project), C (Part of Project), D (Project Type), H (Jumlah Task)
                        $colsToMerge = ['A','B','C','D','H'];
                        foreach ($colsToMerge as $col) {
                            $activeWorksheet->mergeCells($col.$projectStartRow.':'.$col.$projectEndRow);
                            // Align center both horizontally and vertically for merged cells
                            $activeWorksheet->getStyle($col.$projectStartRow.':'.$col.$projectEndRow)
                                ->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER)
                                ->setVertical(Alignment::VERTICAL_CENTER);
                        }
                    }

                    // Increment project counter once
                    $no++;
                } else {
                    // Project with no tasks: single row
                    $activeWorksheet->setCellValue('A'.$row, $no);
                    // center A for single-row projects
                    $activeWorksheet->getStyle('A'.$row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER)->setVertical(Alignment::VERTICAL_CENTER);
                    $activeWorksheet->setCellValue('B'.$row, $baseProjectValues['B']);
                    // Center project-related columns for single-row projects
                    $activeWorksheet->getStyle('B'.$row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER)->setVertical(Alignment::VERTICAL_CENTER);
                    $activeWorksheet->getStyle('C'.$row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER)->setVertical(Alignment::VERTICAL_CENTER);
                    $activeWorksheet->getStyle('D'.$row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER)->setVertical(Alignment::VERTICAL_CENTER);
                    $activeWorksheet->setCellValue('C'.$row, $baseProjectValues['C']);
                    $activeWorksheet->setCellValue('D'.$row, $baseProjectValues['D']);
                    $activeWorksheet->setCellValue('E'.$row, 'No Tasks');
                    $activeWorksheet->setCellValue('F'.$row, '-');
                    // Untuk project tanpa task: tampilkan Durasi
                    $durationSingle = $formatDuration($project->start_date, $projectMaxDue ? $projectMaxDue->toDateString() : $project->due_date);
                    $activeWorksheet->setCellValue('G'.$row, $durationSingle);
                    $activeWorksheet->getStyle('G'.$row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER)->setVertical(Alignment::VERTICAL_CENTER);
                    $activeWorksheet->setCellValue('H'.$row, $baseProjectValues['L']);
                    $activeWorksheet->getRowDimension($row)->setRowHeight(18);

                    $row++;
                    $no++;
                }
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
                $activeWorksheet->getStyle('A3:H'.($row-1))->applyFromArray($dataStyle);

                // Center align specific columns
                $activeWorksheet->getStyle('A3:A'.($row-1))->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                // Project type now at column D
                $activeWorksheet->getStyle('D3:D'.($row-1))->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                // Durasi center
                $activeWorksheet->getStyle('G3:G'.($row-1))->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                // Jumlah Task at column H center
                $activeWorksheet->getStyle('H3:H'.($row-1))->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

                // Enable text wrapping for Task and Status Task columns (E and F)
                $activeWorksheet->getStyle('E3:F'.($row-1))->getAlignment()->setWrapText(true);
                $activeWorksheet->getStyle('E3:F'.($row-1))->getAlignment()->setVertical(Alignment::VERTICAL_TOP);
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

    /**
     * Export a single project's report to Excel (same format as exportProjectsExcel but scoped).
     */
    public function exportProjectExcelSingle(Request $request, string $id)
    {
        try {
            $employeeId = auth()->user()?->employee?->id;

            // Load the single project with relationships; filter tasks to active and to this employee when present
            $project = Project::where('status', '!=', 'DELETED')
                ->where('id', $id)
                ->when($employeeId, function ($q) use ($employeeId) {
                    $q->whereHas('projectAssignments', function ($qa) use ($employeeId) {
                        $qa->where('employee_id', $employeeId);
                    });
                })
                ->with([
                    'department',
                    'division',
                    'tasks' => function ($query) use ($employeeId) {
                        $query->whereRaw('LOWER(status) NOT IN (?, ?)', ['canceled', 'deleted'])
                              ->when($employeeId, function ($q) use ($employeeId) {
                                  $q->whereHas('assignments', function ($a) use ($employeeId) {
                                      $a->where('employee_id', $employeeId);
                                  });
                              })
                              ->with(['assignments.employee']);
                    },
                    'projectAssignments.employee'
                ])
                ->withCount([
                    'tasks as total_tasks' => function ($q) use ($employeeId) {
                        $q->whereRaw('LOWER(status) NOT IN (?, ?)', ['canceled', 'deleted'])
                          ->when($employeeId, function ($q2) use ($employeeId) {
                              $q2->whereHas('assignments', function ($a) use ($employeeId) {
                                  $a->where('employee_id', $employeeId);
                              });
                          });
                    },
                    'tasks as completed_tasks' => function ($q) use ($employeeId) {
                        $q->whereIn(DB::raw('LOWER(status)'), ['completed'])
                          ->when($employeeId, function ($q2) use ($employeeId) {
                              $q2->whereHas('assignments', function ($a) use ($employeeId) {
                                  $a->where('employee_id', $employeeId);
                              });
                          });
                    },
                    'tasks as in_progress_tasks' => function ($q) use ($employeeId) {
                        $q->whereIn(DB::raw('LOWER(status)'), ['in_progress', 'in progress', 'rejected'])
                          ->when($employeeId, function ($q2) use ($employeeId) {
                              $q2->whereHas('assignments', function ($a) use ($employeeId) {
                                  $a->where('employee_id', $employeeId);
                              });
                          });
                    },
                ])
                ->first();

            if (!$project) {
                return response()->json([
                    'code' => 404,
                    'status' => 'error',
                    'message' => 'Project not found or not accessible'
                ], 404);
            }

            // Reuse the same spreadsheet layout as exportProjectsExcel but adjusted for Project Detail
            $projects = collect([$project]);

            $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
            $activeWorksheet = $spreadsheet->getActiveSheet();

            $activeWorksheet->mergeCells('A1:H1');
            $activeWorksheet->setCellValue('A1', 'Project Report - NSA Office Management System');
            $activeWorksheet->getStyle('A1')->getFont()->setBold(true)->setSize(16);
            $activeWorksheet->getStyle('A1')->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);

            // Header layout for project detail export: remove Status, combine start/deadline into Durasi
            $headers = [
                'A2' => 'No',
                'B2' => 'Nama Project',
                'C2' => 'Task',
                'D2' => 'Status Task',
                'E2' => 'Durasi',
                'F2' => 'PIC',
                'G2' => 'Executors',
                'H2' => 'Total Task',
            ];
            foreach ($headers as $cell => $value) { $activeWorksheet->setCellValue($cell, $value); }

            $headerStyle = [
                'borders' => [ 'allBorders' => [ 'borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN ] ],
                'fill' => [ 'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'startColor' => [ 'argb' => 'FFE0E0E0' ] ],
            ];
            $activeWorksheet->getStyle('A2:H2')->applyFromArray($headerStyle)->getFont()->setBold(true)->setSize(10);
            $activeWorksheet->getStyle('A2:H2')->getAlignment()->setWrapText(true)->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER)->setVertical(\PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER);

            $columnWidths = [
                'A' => 5,
                'B' => 30,
                'C' => 35,
                'D' => 15,
                'E' => 20,
                'F' => 20,
                'G' => 35,
                'H' => 12,
            ];
            foreach ($columnWidths as $col=>$w) { $activeWorksheet->getColumnDimension($col)->setWidth($w); }

            // Helper to format duration string according to requirements
            $formatDuration = function ($startRaw, $endRaw) {
                if (empty($startRaw) && empty($endRaw)) return '-';
                try {
                    $start = $startRaw ? Carbon::parse($startRaw) : null;
                } catch (\Throwable $_) { $start = null; }
                try {
                    $end = $endRaw ? Carbon::parse($endRaw) : null;
                } catch (\Throwable $_) { $end = null; }

                if ($start && !$end) return $start->format('j F Y');
                if (!$start && $end) return $end->format('j F Y');
                if (!$start && !$end) return '-';

                // Both present
                $sY = $start->format('Y'); $eY = $end->format('Y');
                $sM = $start->format('F'); $eM = $end->format('F');
                $sD = $start->format('j'); $eD = $end->format('j');

                if ($sY === $eY) {
                    if ($sM === $eM) {
                        if ($sD === $eD) return "{$sD} {$sM} {$sY}";
                        return "{$sD}-{$eD} {$sM} {$sY}";
                    }
                    // same year, different months
                    return "{$sD} {$sM} - {$eD} {$eM} {$sY}";
                }
                // different years
                return "{$sD} {$sM} {$sY} - {$eD} {$eM} {$eY}";
            };

            $row = 3; $no = 1;
            foreach ($projects as $p) {
                $totalTasks = $p->total_tasks ?? $p->tasks->count();
                if ($p->tasks->count() > 0) {
                    $projStartRow = $row;
                    foreach ($p->tasks as $task) {
                        $projectName = $p->title;
                        $taskTitle = $task->title ?? '-';
                        $taskStatus = ucfirst(trim(str_replace('_',' ', (string)($task->status ?? '')))) ?: '-';

                        // Determine duration: prefer task start/due, fallback to project
                        $startRaw = $task->start_date ?: $p->start_date;
                        $endRaw = $task->due_date ?: $p->due_date;
                        $duration = $formatDuration($startRaw, $endRaw);

                        // PIC
                        $picAssign = $task->assignments ? $task->assignments->firstWhere('role', 'PIC') : null;
                        $picName = $picAssign && $picAssign->employee ? ($picAssign->employee->name ?? '-') : '-';
                        // Executors
                        $executorNames = '-';
                        if ($task->assignments) {
                            $execs = $task->assignments->where('role', 'EXECUTOR')
                                ->map(function($a){ return $a->employee->name ?? null; })
                                ->filter()
                                ->unique()
                                ->values()
                                ->all();
                            if (!empty($execs)) $executorNames = implode(', ', $execs);
                        }

                        // Set cells
                        $activeWorksheet->setCellValue('A'.$row, $no);
                        if ($row === $projStartRow) {
                            $activeWorksheet->setCellValue('B'.$row, $projectName);
                        }
                        $activeWorksheet->setCellValue('C'.$row, $taskTitle);
                        $activeWorksheet->setCellValue('D'.$row, $taskStatus);
                        $activeWorksheet->setCellValue('E'.$row, $duration);
                        $activeWorksheet->setCellValue('F'.$row, $picName);
                        $activeWorksheet->setCellValue('G'.$row, $executorNames);
                        if ($row === $projStartRow) {
                            $activeWorksheet->setCellValue('H'.$row, $totalTasks);
                        }

                        $activeWorksheet->getRowDimension($row)->setRowHeight(18);
                        $row++; $no++;
                    }
                    $projEndRow = $row - 1;
                    if ($projEndRow > $projStartRow) {
                        // Merge project name and total task columns vertically
                        $activeWorksheet->mergeCells('B'.$projStartRow.':B'.$projEndRow);
                        $activeWorksheet->mergeCells('H'.$projStartRow.':H'.$projEndRow);
                        $activeWorksheet->getStyle('B'.$projStartRow.':B'.$projEndRow)
                            ->getAlignment()
                            ->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER)
                            ->setVertical(\PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER);
                        $activeWorksheet->getStyle('H'.$projStartRow.':H'.$projEndRow)
                            ->getAlignment()
                            ->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER)
                            ->setVertical(\PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER);
                    }
                } else {
                    // No tasks: single row
                    $activeWorksheet->setCellValue('A'.$row, $no);
                    $activeWorksheet->setCellValue('B'.$row, $p->title);
                    $activeWorksheet->setCellValue('C'.$row, 'No Tasks');
                    $activeWorksheet->setCellValue('D'.$row, '-');
                    $durationSingle = $formatDuration($p->start_date, $p->due_date);
                    $activeWorksheet->setCellValue('E'.$row, $durationSingle);
                    $activeWorksheet->setCellValue('F'.$row, '-');
                    $activeWorksheet->setCellValue('G'.$row, '-');
                    $activeWorksheet->setCellValue('H'.$row, $totalTasks);
                    $activeWorksheet->getRowDimension($row)->setRowHeight(18);
                    $row++; $no++;
                }
            }

            if ($row > 3) {
                $dataStyle = ['borders' => ['allBorders' => ['borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN]]];
                $activeWorksheet->getStyle('A3:H'.($row-1))->applyFromArray($dataStyle);
                // Center some columns
                $activeWorksheet->getStyle('A3:A'.($row-1))->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);
                $activeWorksheet->getStyle('B3:B'.($row-1))->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);
                $activeWorksheet->getStyle('D3:D'.($row-1))->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);
                $activeWorksheet->getStyle('H3:H'.($row-1))->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);
                // Wrap long texts
                $activeWorksheet->getStyle('C3:C'.($row-1))->getAlignment()->setWrapText(true)->setVertical(\PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_TOP);
                $activeWorksheet->getStyle('G3:G'.($row-1))->getAlignment()->setWrapText(true)->setVertical(\PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_TOP);
            }

            $activeWorksheet->setTitle('Project Report');
            $filename = 'project_'.$id.'_report_'.date('Y_m_d_H_i_s').'.xlsx';

            $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
            $tempFile = tempnam(sys_get_temp_dir(), 'project_export_single');
            $writer->save($tempFile);
            return response()->download($tempFile, $filename, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ])->deleteFileAfterSend(true);
        } catch (\Exception $e) {
            return response()->json([
                'code' => 500,
                'status' => 'error',
                'message' => 'Failed to export project: ' . $e->getMessage(),
            ], 500);
        }
    }


}

