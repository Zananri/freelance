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

class ProjectController extends Controller
{
    /**
     * Accept project assignment for the authenticated user.
     */
    public function acceptProject($id)
    {
        try {
            DB::beginTransaction();
            
            $user = auth()->user();
            if (!$user || !$user->employee) {
                throw new \Exception('Unauthorized');
            }

            $employeeId = $user->employee->id;

            // Find the project assignment for this user and project
            $assignment = ProjectAssignment::where('project_id', $id)
                ->where('employee_id', $employeeId)
                ->first();

            if (!$assignment) {
                throw new \Exception('Project assignment not found');
            }

            // Update is_receive to true
            $assignment->is_receive = true;
            $assignment->save();

            // Mark related notification as read
            $notification = Notification::where('employee_id', $employeeId)
                ->where('type', 'new job')
                ->where('title', 'like', '%assigned as%project: ' . $assignment->project->title)
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
            return response()->json([
                'code' => $e->getCode() ?: 500,
                'status' => "error",
                'message' => $e->getMessage()
            ], $e->getCode() ?: 500);
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
            return response()->json([
                'code' => $e->getCode() ?: 500,
                'status' => "error",
                'message' => $e->getMessage()
            ], $e->getCode() ?: 500);
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

            $employees = $employees->orderBy('name')->get(['id', 'name', 'photo']);

            // Map the employees to include proper photo URL
            $mappedEmployees = $employees->map(function($emp) {
                return [
                    'id' => $emp->id,
                    'name' => $emp->name,
                    'user_photo' => $emp->photo ? asset('storage/'.$emp->photo) : asset('asset/img/profile_picture/default.png')
                ];
            });

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => $mappedEmployees
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'code' => $e->getCode() ?: 500,
                'status' => "error",
                'message' => $e->getMessage()
            ], $e->getCode() ?: 500);
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
            return response()->json([
                'code' => $e->getCode() ?: 500,
                'status' => "error",
                'message' => $e->getMessage()
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * Return JSON data for project cards with counts zero.
     */
    public function getCardData()
    {
        try {
            $projects = Project::where('status', '!=', 'DELETED')->get(['id', 'title', 'image']);
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
            return response()->json([
                'code' => $e->getCode() ?: 500,
                'status' => "error",
                'message' => $e->getMessage()
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * Display a listing of the projects.
     */
    public function index(Request $request)
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
            $filter = $request->input('filter', null);
            $includeUnaccepted = $request->input('include_unaccepted', false);

            // Base query for projects
            $query = Project::whereHas('projectAssignments', function ($query) use ($employeeId, $includeUnaccepted) {
                $query->where('employee_id', $employeeId)
                      ->whereIn('role', ['author', 'co_author', 'contributor']);
                
                if (!$includeUnaccepted) {
                    $query->where(function ($q) {
                        $q->where('role', 'author')
                          ->orWhere('is_receive', true);
                    });
                }
            });

            if ($filter === 'not_started') {
                $query->where(function ($q) {
                    $q->whereHas('tasks', function ($q2) {
                        $q2->where('status', 'new_request');
                    })->orWhereDoesntHave('tasks');
                });
            } elseif ($filter === 'in_progress') {
                $query->whereHas('tasks', function ($q) {
                    $q->whereIn('status', ['in_progress', 'rejected']);
                });
            } elseif ($filter === 'completed') {
                $query->whereIn('projects.id', function ($subquery) {
                    $subquery->from('tasks')
                        ->selectRaw('project_id')
                        ->groupBy('project_id')
                        ->havingRaw('COUNT(*) = SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END)');
                });
            }

            $projects = $query->with([
                'department',
                'division',
                'projectAssignments.employee',
                'projectAssignments.project'
            ])->get();

            $projectsTransformed = $projects->map(function ($project) {
                $projectAssignments = $project->projectAssignments->map(function ($assignment) {
                    return [
                        'id' => $assignment->id,
                        'role' => $assignment->role,
                        'employee_id' => $assignment->employee_id,
                        'employee_name' => $assignment->employee ? $assignment->employee->name : null,
                        'project_id' => $assignment->project_id,
                        'project_title' => $assignment->project ? $assignment->project->title : null,
                    ];
                });

                // Get task counts for this project (all tasks), treating 'rejected' as 'in_progress'
                $totalTasks = Task::where('project_id', $project->id)->count();
                // Accept both snake_case and spaced variants for backward data compatibility
                $inProgressTasks = Task::where('project_id', $project->id)
                    ->whereIn(DB::raw('LOWER(status)'), ['in_progress', 'in progress', 'rejected'])
                    ->count();
                $rejectedTasks = Task::where('project_id', $project->id)
                    ->whereIn(DB::raw('LOWER(status)'), ['rejected'])
                    ->count();
                $completedTasks = Task::where('project_id', $project->id)
                    ->whereIn(DB::raw('LOWER(status)'), ['completed'])
                    ->count();
                $lateTasks = Task::where('project_id', $project->id)
                    ->whereRaw('LOWER(status) <> ?', ['completed'])
                    ->whereNotNull('due_date')
                    ->where('due_date', '<', now())
                    ->count();

                // Mutually-exclusive buckets for charts (avoid overlap between in_progress and late)
                $nowTs = now();
                $inProgressOnTime = Task::where('project_id', $project->id)
                    ->whereIn(DB::raw('LOWER(status)'), ['in_progress', 'in progress', 'rejected'])
                    ->where(function ($q) use ($nowTs) {
                        $q->whereNull('due_date')->orWhere('due_date', '>=', $nowTs);
                    })
                    ->count();
                $lateExclusive = Task::where('project_id', $project->id)
                    ->whereRaw('LOWER(status) <> ?', ['completed'])
                    ->whereNotNull('due_date')
                    ->where('due_date', '<', $nowTs)
                    ->count();
                $notStartedOnTime = Task::where('project_id', $project->id)
                    ->whereIn(DB::raw('LOWER(status)'), ['new_request', 'new request'])
                    ->where(function ($q) use ($nowTs) {
                        $q->whereNull('due_date')->orWhere('due_date', '>=', $nowTs);
                    })
                    ->count();

                    // build author, co_authors and contributors with photo URLs if available
                    $author = null;
                    $coAuthors = [];
                    $contributors = [];

                    foreach ($project->projectAssignments as $assignment) {
                        $employee = $assignment->employee;
                        if (!$employee) continue;

                        // try to get user photo from related user record or employee photo
                        $userPhoto = null;
                        $rawPhoto = null;
                        if ($employee->user && $employee->user->photo) {
                            $rawPhoto = $employee->user->photo;
                        } elseif ($employee->photo) {
                            $rawPhoto = $employee->photo;
                        }

                        if ($rawPhoto) {
                            // If stored path already points to public 'file/...' folder, use asset(raw)
                            if (Str::startsWith($rawPhoto, 'file/') || Str::startsWith($rawPhoto, '/file/')) {
                                $userPhoto = asset($rawPhoto);
                            } elseif (Str::startsWith($rawPhoto, 'storage/') || Str::startsWith($rawPhoto, '/storage/')) {
                                $userPhoto = asset($rawPhoto);
                            } else {
                                // otherwise assume it's a storage filename and use storage path
                                $userPhoto = asset('storage/' . ltrim($rawPhoto, '/'));
                            }
                        }

                        if ($assignment->role === 'author') {
                            $author = ['id' => $employee->id, 'name' => $employee->name, 'user_photo' => $userPhoto];
                        } elseif ($assignment->role === 'co_author') {
                            $coAuthors[] = ['id' => $employee->id, 'name' => $employee->name, 'user_photo' => $userPhoto];
                        } elseif ($assignment->role === 'contributor') {
                            $contributors[] = ['id' => $employee->id, 'name' => $employee->name, 'user_photo' => $userPhoto];
                        }
                    }

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
                            'total' => $totalTasks,
                            'in_progress' => $inProgressTasks,
                            'rejected' => $rejectedTasks,
                            'completed' => $completedTasks,
                            'late' => $lateTasks,
                            // Exclusive buckets used by charts
                            'excl' => [
                                'completed' => $completedTasks,
                                'in_progress' => $inProgressOnTime,
                                'late' => $lateExclusive,
                                'not_started' => $notStartedOnTime,
                            ],
                        ]
                    ];
            });

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => $projectsTransformed
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'code' => $e->getCode() ?: 500,
                'status' => "error",
                'message' => $e->getMessage()
            ], $e->getCode() ?: 500);
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
                'description' => 'nullable|string',
                'department' => 'required|exists:departments,id',
                'division' => 'required|exists:divisions,id',
                'status' => 'string|max:50',
                'reference_url' => 'nullable|url',
                'start_date' => 'required|date',
                'due_date' => 'required|date|after_or_equal:start_date',
                'part_of_project' => 'nullable|exists:projects,id',
                'co_author' => 'nullable|array',
                'co_author.*' => 'nullable|exists:employees,id',
                'contributors' => 'nullable|array',
                'contributors.*' => 'nullable|exists:employees,id',
                'complete_date' => 'nullable|date',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:10240',
                // allow multiple files via reference_file[]
                'reference_file' => 'nullable',
                'reference_file.*' => 'file|mimes:pdf,doc,docx|max:10240',

            ]);

            $project = new Project();
            $project->title = $request->title;
            $project->description = $request->description;
            $project->department_id = $request->department;
            $project->division_id = $request->division;
            $project->status = $request->status ?? 'ACTIVE';
            $project->reference_url = $request->reference_url;
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

            // Handle reference file uploads (support multiple files) -> store into reference_files (JSON)
            $uploadedFiles = [];
            if ($request->hasFile('reference_file')) {
                $files = $request->file('reference_file');
                if (!is_array($files)) $files = [$files];
                foreach ($files as $file) {
                    if (!$file) continue;
                    $fileName = 'PROJECT_' . time() . '_' . Str::random(6) . '.' . $file->getClientOriginalExtension();
                    $file->move(public_path('file/project'), $fileName);
                    $uploadedFiles[] = $fileName;
                }
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
            return response()->json([
                'code' => $e->getCode() ?: 500,
                'status' => "error",
                'message' => $e->getMessage()
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * Display the specified project.
     */
    public function show(string $id)
    {
        try {
            $project = Project::with(['department', 'division', 'projectAssignments.employee'])->findOrFail($id);

            // Extract author and co_authors
            $author = null;
            $coAuthors = [];
            $contributors = [];

            foreach ($project->projectAssignments as $assignment) {
                if ($assignment->role === 'author' && $assignment->employee) {
                    $author = $assignment->employee;
                } elseif ($assignment->role === 'co_author' && $assignment->employee) {
                    $coAuthors[] = $assignment->employee;
                } elseif ($assignment->role === 'contributor' && $assignment->employee) {
                    $contributors[] = $assignment->employee;
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
                // Backward-compat alias for frontend
                'reference_file' => $files,
                // Preferred field
                'reference_files' => $files,
                'start_date' => $project->start_date,
                'due_date' => $project->due_date,
                'author' => $author ? ['id' => $author->id, 'name' => $author->name] : null,
                'co_authors' => array_map(function ($emp) {
                    return ['id' => $emp->id, 'name' => $emp->name];
                }, $coAuthors),
                'contributors' => array_map(function ($emp) {
                    return ['id' => $emp->id, 'name' => $emp->name];
                }, $contributors),
            ];

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => $response
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'code' => $e->getCode() ?: 500,
                'status' => "error",
                'message' => $e->getMessage()
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * Show the form for editing the specified project.
     */
    public function edit(string $id)
    {
        $project = Project::with(['department', 'division', 'projectAssignments.employee'])->findOrFail($id);

        $coAuthors = [];
        $contributors = [];

        foreach ($project->projectAssignments as $assignment) {
            $employee = $assignment->employee;
            if (!$employee) continue;
            $userPhoto = null;
            // Ambil dari relasi user
            if ($employee->user && $employee->user->photo) {
                $userPhoto = $employee->user->photo;
            }
            if ($assignment->role === 'co_author') {
                $coAuthors[] = [
                    'id' => $employee->id,
                    'name' => $employee->name,
                    'user_photo' => $userPhoto,
                ];
            } elseif ($assignment->role === 'contributor') {
                $contributors[] = [
                    'id' => $employee->id,
                    'name' => $employee->name,
                    'user_photo' => $userPhoto,
                ];
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
                'start_date' => 'required|date',
                'due_date' => 'required|date|after_or_equal:start_date',
                'part_of_project' => 'nullable|exists:projects,id',
                'complete_date' => 'nullable|date',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:10240',
                // allow multiple files via reference_file[] on update
                'reference_file' => 'nullable',
                'reference_file.*' => 'file|mimes:pdf,doc,docx|max:10240',
                'co_author' => 'nullable|array',
                'co_author.*' => 'nullable|exists:employees,id',
                'contributors' => 'nullable|array',
                'contributors.*' => 'nullable|exists:employees,id',
            ]);

            $project->title = $request->title;
            $project->description = $request->description;
            $project->department_id = $request->department;
            $project->division_id = $request->division;
            $project->status = $request->status ?? 'ACTIVE';
            $project->reference_url = $request->reference_url;
            $project->start_date = $request->start_date;
            $project->due_date = $request->due_date;
            $project->part_of_project = $request->part_of_project;
            $project->complete_date = $request->complete_date;
            $project->updated_by = auth()->user() ? auth()->user()->id : null;

            // Handle image upload
            if ($request->hasFile('image')) {
                // Delete old image if exists
                if ($project->image && file_exists(public_path('file/project/' . $project->image))) {
                    unlink(public_path('file/project/' . $project->image));
                }
                $image = $request->file('image');
                $imageName = 'PROJECT_' . time() . '.' . $image->getClientOriginalExtension();
                $image->move(public_path('file/project'), $imageName);
                $project->image = $imageName;
            }

            // Handle reference file uploads on update and deletion of removed files
            // existing_reference_files should be a JSON array (filenames to keep)
            $existing = [];
            if ($request->has('existing_reference_files')) {
                $existing = json_decode($request->existing_reference_files, true) ?: [];
            }

            $existing = is_array($existing) ? $existing : [];

            // Current files stored on model (prefer JSON column)
            $currentFiles = $project->reference_files ?? $project->reference_file ?? [];
            if (!is_array($currentFiles) && $currentFiles) {
                $currentFiles = [$currentFiles];
            }

            // Remove files that are present in currentFiles but not in existing
            $toDelete = array_diff($currentFiles, $existing);
            foreach ($toDelete as $del) {
                $path = public_path('file/project/' . $del);
                if ($del && file_exists($path)) {
                    @unlink($path);
                }
            }

            // Start with preserved files
            $finalFiles = $existing;

            // Handle newly uploaded files
            if ($request->hasFile('reference_file')) {
                $files = $request->file('reference_file');
                if (!is_array($files)) $files = [$files];
                foreach ($files as $file) {
                    if (!$file) continue;
                    $fileName = 'PROJECT_' . time() . '_' . Str::random(6) . '.' . $file->getClientOriginalExtension();
                    $file->move(public_path('file/project'), $fileName);
                    $finalFiles[] = $fileName;
                }
            }

            // Set final files (empty array allowed) -> primary JSON column
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

            // Remove existing co_author assignments
            ProjectAssignment::where('project_id', $project->id)
                ->where('role', 'co_author')
                ->delete();

            // Remove existing contributor assignments
            ProjectAssignment::where('project_id', $project->id)
                ->where('role', 'contributor')
                ->delete();

            // Insert new co_author assignments and create notifications
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
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];

                    // Create notification for new co-author
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

            // Insert new contributor assignments
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
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];

                    // Create notification for new contributor
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

            $updateData['updated_by'] = auth()->id();

            DB::commit();
            
            return response()->json([
                'code' => 200,
                'status' => 'success',
                'message' => 'Project updated successfully',
                'project' => $project
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'code' => $e->getCode() ?: 500,
                'status' => "error",
                'message' => $e->getMessage()
            ], $e->getCode() ?: 500);
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

            // Delete project assignments first
            $project->projectAssignments()->delete();
            
            // Delete project feedbacks
            $project->projectFeedbacks()->delete();
            
            // Delete project files
            if ($project->image && file_exists(public_path('file/project/' . $project->image))) {
                @unlink(public_path('file/project/' . $project->image));
            }
            // reference files can be array or string; handle both, prefer JSON column
            $refFiles = $project->reference_files ?? $project->reference_file ?? [];
            if (!is_array($refFiles) && $refFiles) {
                $refFiles = [$refFiles];
            }
            foreach ($refFiles as $rf) {
                if ($rf && file_exists(public_path('file/project/' . $rf))) {
                    @unlink(public_path('file/project/' . $rf));
                }
            }
            
            // Finally delete the project
            $project->deleted_by = auth()->id();
            $project->save();

            DB::commit();
            
            return response()->json([
                'code' => 200,
                'status' => 'success',
                'message' => 'Project deleted successfully'
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'code' => $e->getCode() ?: 500,
                'status' => "error",
                'message' => $e->getMessage()
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * Get project feedbacks for a given project.
     */
    public function getProjectFeedbacks($projectId)
    {
        try {
            $feedbacks = ProjectFeedback::with(['employee'])
                ->where('project_id', $projectId)
                ->orderBy('created_at', 'desc')
                ->get();

            $feedbacksTransformed = $feedbacks->map(function ($feedback) {
                $employee = $feedback->employee;

                return [
                    'id' => $feedback->id,
                    'employee_id' => $employee ? $employee->id : null,
                    'employee_name' => $employee ? $employee->name : null,
                    'employee_photo' => $employee ? $employee->photo : null,
                    'feedback_comment' => $feedback->feedback_comment,
                    'image' => $feedback->image,
                    'reference_url' => $feedback->reference_url,
                    'reference_file' => $feedback->reference_file,
                    'created_at' => $feedback->created_at,
                ];
            });

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => $feedbacksTransformed
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'code' => $e->getCode() ?: 500,
                'status' => "error",
                'message' => $e->getMessage()
            ], $e->getCode() ?: 500);
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
                'employee_id' => 'required|exists:employees,id',
                'feedback_comment' => 'nullable|string',
                'feedback_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:10240',
                'reference_url' => 'nullable|url',
                'reference_file' => 'nullable|file|mimes:pdf,doc,docx|max:10240',
            ]);

            $feedback = new ProjectFeedback();
            $feedback->project_id = $request->project_id;
            $feedback->employee_id = $request->employee_id;
            $feedback->feedback_comment = $request->feedback_comment;
            $feedback->reference_url = $request->reference_url;
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

            // Handle reference file upload
            if ($request->hasFile('reference_file')) {
                $file = $request->file('reference_file');
                $fileName = 'FEEDBACK_' . time() . '.' . $file->getClientOriginalExtension();
                $file->move(public_path('file/project'), $fileName);
                $feedback->reference_file = $fileName;
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
            return response()->json([
                'code' => $e->getCode() ?: 500,
                'status' => "error",
                'message' => $e->getMessage()
            ], $e->getCode() ?: 500);
        }
    }
}