<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Project;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProjectController extends Controller
{
    /**
     * Display the project main page.
     */
    public function showProjectPage()
    {
        return view('project/project');
    }

    /**
     * Display a listing of the projects.
     */
    public function index()
    {
        $projects = Project::with(['department', 'division'])->get();
        return response()->json(['data' => $projects]);
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
                $image = $request->file('image');
                $imageName = 'PROJECT_' . time() . '.' . $image->getClientOriginalExtension();
                $image->move(public_path('file/project'), $imageName);
                $project->image = $imageName;
            }

            // Handle reference file upload
            if ($request->hasFile('reference_file')) {
                $file = $request->file('reference_file');
                $fileName = 'PROJECT_' . time() . '.' . $file->getClientOriginalExtension();
                $file->move(public_path('file/project'), $fileName);
                $project->reference_file = $fileName;
            }

            $project->save();

            return response()->json(['message' => 'Project created successfully', 'project' => $project]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to create project', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified project.
     */
    public function show(string $id)
    {
        $project = Project::with(['department', 'division'])->findOrFail($id);
        return response()->json($project);
    }

    /**
     * Show the form for editing the specified project.
     */
    public function edit(string $id)
    {
        $project = Project::with(['department', 'division'])->findOrFail($id);
        return response()->json($project);
    }

    /**
     * Update the specified project in storage.
     */
    public function update(Request $request, string $id)
    {
        $project = Project::findOrFail($id);

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

        return response()->json(['message' => 'Project updated successfully', 'project' => $project]);
    }

    /**
     * Remove the specified project from storage.
     */
    public function destroy(string $id)
    {
        $project = Project::findOrFail($id);

        // Delete image file if exists
        if ($project->image && file_exists(public_path('file/project/' . $project->image))) {
            unlink(public_path('file/project/' . $project->image));
        }

        // Delete reference file if exists
        if ($project->reference_file && file_exists(public_path('file/project/' . $project->reference_file))) {
            unlink(public_path('file/project/' . $project->reference_file));
        }

        $project->delete();

        return response()->json(['message' => 'Project deleted successfully']);
    }
}
