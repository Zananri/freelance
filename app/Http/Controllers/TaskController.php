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
        // Fetch tasks with related project and assignments
        $tasks = Task::with(['project', 'assignments.employee'])
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
            $imageFile->move(public_path('file/task'), $imageName);
            $data['image'] = $imageName;
        }

        // Handle reference file upload
        if ($request->hasFile('reference_file')) {
            $referenceFile = $request->file('reference_file');
            $referenceExtension = $referenceFile->getClientOriginalExtension();
            $referenceName = 'TASK_' . time() . '.' . $referenceExtension;
            $referenceFile->move(public_path('file/task_reference_files'), $referenceName);
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
