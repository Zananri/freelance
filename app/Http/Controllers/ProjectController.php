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

class ProjectController extends Controller
{
    /**
     * Return JSON data for employees filtered by search query.
     */
   public function getEmployees(Request $request)
{
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

    return response()->json(['data' => $mappedEmployees]);
}
    /**
     * Display the project main page.ea
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

        return response()->json(['data' => $assignmentsTransformed]);
    }

    /**
     * Return JSON data for project cards with counts zero.
     */
    public function getCardData()
    {
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
        return response()->json($data);
    }

    /**
     * Display a listing of the projects.
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        if (!$user || !$user->employee) {
            // If no authenticated user or no employee relation, return empty list
            return response()->json(['data' => []]);
        }
        $employeeId = $user->employee->id;

        $filter = $request->input('filter', null);

        // Base query for projects where the employee is author, co_author, or contributor
        $query = Project::whereHas('projectAssignments', function ($query) use ($employeeId) {
            $query->where('employee_id', $employeeId)
                  ->whereIn('role', ['author', 'co_author', 'contributor']);
        });

        if ($filter === 'not_started') {
            // Filter projects where tasks have status 'new_request' or no tasks at all
            $query->where(function ($q) {
                $q->whereHas('tasks', function ($q2) {
                    $q2->where('status', 'new_request');
                })->orWhereDoesntHave('tasks');
            });
        } elseif ($filter === 'in_progress') {
            // Filter projects where tasks have status 'in_progress' or 'rejected'
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

            // Get task counts for this project
            $totalTasks = Task::where('project_id', $project->id)->count();
            $inProgressTasks = Task::where('project_id', $project->id)
                ->whereIn('status', ['in_progress', 'rejected'])
                ->count();
            $completedTasks = Task::where('project_id', $project->id)
                ->where('status', 'completed')
                ->count();

            return [
                'id' => $project->id,
                'title' => $project->title,
                'description' => $project->description,
                'image' => $project->image,
                'department' => $project->department,
                'division' => $project->division,
                'status' => $project->status,
                'project_assignments' => $projectAssignments,
                'task_counts' => [
                    'total' => $totalTasks,
                    'in_progress' => $inProgressTasks,
                    'completed' => $completedTasks
                ]
            ];
        });

        return response()->json(['data' => $projectsTransformed]);
    }

    /**
     * Show the form for creating a new project.
     */
    public function create()
    {
        // This can be handled by frontend modal, so no need to return a view here.
        return response()->json(['message' => 'Use frontend modal for create form']);
    }

    /**
     * Store a newly created project in storage.
     */
    public function store(Request $request)
    {
        \Log::info('Project creation request data:', $request->all());

        if ($request->has('co_author') && is_string($request->co_author)) {
            $request->merge(['co_author' => json_decode($request->co_author, true)]);
        }
        if ($request->has('contributors') && is_string($request->contributors)) {
            $request->merge(['contributors' => json_decode($request->contributors, true)]);
        }

        try {
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
                'co_author.*' => 'exists:employees,id',
                'contributors' => 'nullable|array',
                'contributors.*' => 'exists:employees,id',
                'complete_date' => 'nullable|date',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
                'reference_file' => 'nullable|file|mimes:pdf,doc,docx|max:5120',
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
            $project->created_by = auth()->user() ? auth()->user()->name : null;

            // Handle image upload
            if ($request->hasFile('image')) {
                try {
                    $image = $request->file('image');
                    $imageName = 'PROJECT_' . time() . '.' . $image->getClientOriginalExtension();
                    $image->move(public_path('file/project'), $imageName);
                    $project->image = $imageName;
                } catch (\Exception $ex) {
                    \Log::error('Image upload failed: ' . $ex->getMessage());
                }
            }

            // Handle reference file upload
            if ($request->hasFile('reference_file')) {
                try {
                    $file = $request->file('reference_file');
                    $fileName = 'PROJECT_' . time() . '.' . $file->getClientOriginalExtension();
                    $file->move(public_path('file/project'), $fileName);
                    $project->reference_file = $fileName;
                } catch (\Exception $ex) {
                    \Log::error('Reference file upload failed: ' . $ex->getMessage());
                }
            }

            $project->save();

            // Insert into project_assignments for author (authenticated user)
            if (auth()->check()) {
                $employee = auth()->user()->employee;
                if ($employee) {
                    try {
                        ProjectAssignment::create([
                            'project_id' => $project->id,
                            'employee_id' => $employee->id,
                            'role' => 'author',
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    } catch (\Exception $ex) {
                        \Log::error('Failed to insert author assignment: ' . $ex->getMessage());
                    }
                } else {
                    \Log::warning('Project creation: Authenticated user has no employee relation.');
                }
            } else {
                \Log::warning('Project creation: User not authenticated.');
            }

            // Insert co_author assignments into project_assignments and create notifications
            if ($request->co_author && is_array($request->co_author)) {
                $coAuthorAssignments = [];
                foreach ($request->co_author as $employeeId) {
                    // Check if employee exists before inserting
                $employeeExists = Employee::where('id', $employeeId)->exists();
                if ($employeeExists) {
                    $coAuthorAssignments[] = [
                        'project_id' => $project->id,
                        'employee_id' => $employeeId,
                        'role' => 'co_author',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                    
                    // Create notification for co-author
                    try {
                        $authorEmployee = auth()->user()->employee;
                        
                        // Cek apakah sudah ada notifikasi untuk project ini
                        $existingNotification = Notification::where('employee_id', $employeeId)
                            ->where('type', 'new job')
                            ->where('title', 'You have been assigned as co-author for project: ' . $project->title)
                            ->where('message', 'like', '%assigned as co-author for project%')
                            ->whereDate('created_at', now()->toDateString())
                            ->first();
                            
                        if (!$existingNotification) {
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
                    } catch (\Exception $ex) {
                        \Log::error('Failed to create notification for co-author ' . $employeeId . ': ' . $ex->getMessage());
                    }
                } else {
                    \Log::warning("Project creation: Co-author employee ID {$employeeId} does not exist.");
                }
                }
                if (!empty($coAuthorAssignments)) {
                    try {
                        ProjectAssignment::insert($coAuthorAssignments);
                    } catch (\Exception $ex) {
                        \Log::error('Failed to insert co_author assignments: ' . $ex->getMessage());
                    }
                }
            }

            // Insert contributor assignments into project_assignments and create notifications
            if ($request->contributors && is_array($request->contributors)) {
                $contributorAssignments = [];
                foreach ($request->contributors as $employeeId) {
                $employeeExists = Employee::where('id', $employeeId)->exists();
                if ($employeeExists) {
                    $contributorAssignments[] = [
                        'project_id' => $project->id,
                        'employee_id' => $employeeId,
                        'role' => 'contributor',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                    
                    // Create notification for contributor
                    try {
                        $authorEmployee = auth()->user()->employee;
                        
                        // Cek apakah sudah ada notifikasi untuk project ini
                        $existingNotification = Notification::where('employee_id', $employeeId)
                            ->where('type', 'new job')
                            ->where('title', 'You have been assigned as contributor for project: ' . $project->title)
                            ->where('message', 'like', '%assigned as contributor for project%')
                            ->whereDate('created_at', now()->toDateString())
                            ->first();
                            
                        if (!$existingNotification) {
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
                    } catch (\Exception $ex) {
                        \Log::error('Failed to create notification for contributor ' . $employeeId . ': ' . $ex->getMessage());
                    }
                } else {
                    \Log::warning("Project creation: Contributor employee ID {$employeeId} does not exist.");
                }
                }
                if (!empty($contributorAssignments)) {
                    try {
                        ProjectAssignment::insert($contributorAssignments);
                    } catch (\Exception $ex) {
                        \Log::error('Failed to insert contributor assignments: ' . $ex->getMessage());
                    }
                }
            }

            return response()->json(['message' => 'Project created successfully', 'project' => $project]);
        } catch (\Exception $e) {
            \Log::error('Project creation failed: ' . $e->getMessage(), [
                'exception' => $e,
                'request_data' => $request->all(),
                'request_files' => $request->files->all(),
            ]);
            return response()->json([
                'message' => 'Failed to create project',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }

        // After saving project and assignments, return project assignments with names
        $assignments = ProjectAssignment::with(['employee', 'project'])->where('project_id', $project->id)->get();

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

        return response()->json(['message' => 'Project created successfully', 'project' => $project, 'assignments' => $assignmentsTransformed]);
    }

    /**
     * Display the specified project.
     */
    public function show(string $id)
    {
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

        $response = [
            'id' => $project->id,
            'title' => $project->title,
            'description' => $project->description,
            'image' => $project->image,
            'department' => $project->department ? $project->department->name_department ?? $project->department->name : null,
            'division' => $project->division ? $project->division->name_division ?? $project->division->name : null,
            'reference_url' => $project->reference_url,
            'reference_file' => $project->reference_file,
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

        return response()->json($response);
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
        $response['co_authors'] = $coAuthors;
        $response['contributors'] = $contributors;

        return response()->json($response);
    }

    /**
     * Update the specified project in storage.
     */
    public function update(Request $request, string $id)
    {
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
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'reference_file' => 'nullable|file|mimes:pdf,doc,docx|max:5120',
            'co_author' => 'nullable|array',
            'co_author.*' => 'exists:employees,id',
            'contributors' => 'nullable|array',
            'contributors.*' => 'exists:employees,id',
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
        $project->updated_by = auth()->user() ? auth()->user()->name : null;

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

        // Handle reference file upload
        if ($request->hasFile('reference_file')) {
            // Delete old file if exists
            if ($project->reference_file && file_exists(public_path('file/project/' . $project->reference_file))) {
                unlink(public_path('file/project/' . $project->reference_file));
            }
            $file = $request->file('reference_file');
            $fileName = 'PROJECT_' . time() . '.' . $file->getClientOriginalExtension();
            $file->move(public_path('file/project'), $fileName);
            $project->reference_file = $fileName;
        }

        $project->save();

        // Update project_assignments for author and co_author
        if (auth()->check()) {
            $employee = auth()->user()->employee;
            if ($employee) {
                // Update or insert author assignment
                ProjectAssignment::updateOrCreate(
                    ['project_id' => $project->id, 'employee_id' => $employee->id],
                    ['role' => 'author', 'updated_at' => now(), 'created_at' => now()]
                );
            }
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
                $employeeExists = Employee::where('id', $employeeId)->exists();
                if ($employeeExists) {
                    $coAuthorAssignments[] = [
                        'project_id' => $project->id,
                        'employee_id' => $employeeId,
                        'role' => 'co_author',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                    
                    // Create notification for new co-author
                    try {
                        $authorEmployee = auth()->user()->employee;
                        // Check if notification already exists for this project and employee
                        $existingNotification = Notification::where('employee_id', $employeeId)
                            ->where('type', 'new job')
                            ->where('title', 'You have been assigned as co-author for project: ' . $project->title)
                            ->where('message', 'like', '%assigned as co-author for project%')
                            ->whereDate('created_at', now()->toDateString())
                            ->first();
                            
                        if (!$existingNotification) {
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
                    } catch (\Exception $ex) {
                        \Log::error('Failed to create notification for co-author ' . $employeeId . ': ' . $ex->getMessage());
                    }
                }
            }
            if (!empty($coAuthorAssignments)) {
                ProjectAssignment::insert($coAuthorAssignments);
            }
        }

            // Insert new contributor assignments
            if ($request->contributors && is_array($request->contributors)) {
                $contributorAssignments = [];
                foreach ($request->contributors as $employeeId) {
                    $employeeExists = Employee::where('id', $employeeId)->exists();
                    if ($employeeExists) {
                        $contributorAssignments[] = [
                            'project_id' => $project->id,
                            'employee_id' => $employeeId,
                            'role' => 'contributor',
                            'created_at' => now(),
                            'updated_at' => now(),
                        ];
                        
                        // Create notification for new contributor
                        try {
                            $authorEmployee = auth()->user()->employee;
                            $existingNotification = Notification::where('employee_id', $employeeId)
                                ->where('type', 'new job')
                                ->where('title', 'You have been assigned as contributor for project: ' . $project->title)
                                ->where('message', 'like', '%assigned as contributor for project%')
                                ->whereDate('created_at', now()->toDateString())
                                ->first();
                                
                            if (!$existingNotification) {
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
                        } catch (\Exception $ex) {
                            \Log::error('Failed to create notification for contributor ' . $employeeId . ': ' . $ex->getMessage());
                        }
                    }
                }
                if (!empty($contributorAssignments)) {
                    ProjectAssignment::insert($contributorAssignments);
                }
            }

        return response()->json(['message' => 'Project updated successfully', 'project' => $project]);
    }

    /**
     * Remove the specified project from storage.
     */
    public function destroy(string $id)
    {
        $project = Project::findOrFail($id);

        // Delete project assignments first
        $project->projectAssignments()->delete();
        
        // Delete project feedbacks
        $project->projectFeedbacks()->delete();
        
        // Delete project files
        if ($project->image && file_exists(public_path('file/project/' . $project->image))) {
            unlink(public_path('file/project/' . $project->image));
        }
        if ($project->reference_file && file_exists(public_path('file/project/' . $project->reference_file))) {
            unlink(public_path('file/project/' . $project->reference_file));
        }
        
        // Finally delete the project
        $project->delete();

        return response()->json(['message' => 'Project deleted successfully']);
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
                    'created_at' => $feedback->created_at,  // Added created_at field
                ];
            });

            // Debug: return raw feedbacks data for inspection
            // return response()->json(['data' => $feedbacks, 'transformed' => $feedbacksTransformed]);

            return response()->json(['data' => $feedbacksTransformed]);
        } catch (\Exception $e) {
            \Log::error('Error fetching project feedbacks: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json(['error' => 'Failed to fetch project feedbacks', 'message' => $e->getMessage(), 'trace' => $e->getTraceAsString()], 500);
        }
    }

    /**
     * Store a newly created project feedback in storage.
     */
    public function storeFeedback(Request $request)
    {
        try {
            $request->validate([
                'project_id' => 'required|exists:projects,id',
                'employee_id' => 'required|exists:employees,id',
                'feedback_comment' => 'nullable|string',
                'feedback_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
                'reference_url' => 'nullable|url',
                'reference_file' => 'nullable|file|mimes:pdf,doc,docx|max:5120',
            ]);

            $feedback = new ProjectFeedback();
            $feedback->project_id = $request->project_id;
            $feedback->employee_id = $request->employee_id;
            $feedback->feedback_comment = $request->feedback_comment;
            $feedback->reference_url = $request->reference_url;

            // Handle feedback image upload
            if ($request->hasFile('feedback_image')) {
                try {
                    $image = $request->file('feedback_image');
                    $imageName = 'FEEDBACK_' . time() . '.' . $image->getClientOriginalExtension();
                    $image->move(public_path('file/project'), $imageName);
                    $feedback->image = $imageName;
                } catch (\Exception $ex) {
                    \Log::error('Feedback image upload failed: ' . $ex->getMessage());
                }
            }

            // Handle reference file upload
            if ($request->hasFile('reference_file')) {
                try {
                    $file = $request->file('reference_file');
                    $fileName = 'FEEDBACK_' . time() . '.' . $file->getClientOriginalExtension();
                    $file->move(public_path('file/project'), $fileName);
                    $feedback->reference_file = $fileName;
                } catch (\Exception $ex) {
                    \Log::error('Feedback reference file upload failed: ' . $ex->getMessage());
                }
            }

            $feedback->save();

            return response()->json(['message' => 'Feedback added successfully', 'feedback' => $feedback]);
        } catch (\Exception $e) {
            \Log::error('Error storing feedback: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json(['error' => 'Failed to add feedback', 'message' => $e->getMessage(), 'trace' => $e->getTraceAsString()], 500);
        }
    }
}
