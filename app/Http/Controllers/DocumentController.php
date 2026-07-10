<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Document;
use App\Models\DocumentFolders;
use Carbon\Carbon;

class DocumentController extends Controller
{
    public function documentPage()
    {
        return view('document.document');
    }

    private function getBreadcrumb($folderId)
    {
        $breadcrumb = collect();

        while ($folderId) {

            $folder = DocumentFolders::find($folderId);

            if (!$folder) {
                break;
            }

            $breadcrumb->prepend([
                'id' => $folder->id,
                'folder_name' => $folder->folder_name
            ]);

            $folderId = $folder->parent_folder_id;
        }

        $breadcrumb->prepend([
            'id' => null,
            'folder_name' => 'Documents'
        ]);

        return $breadcrumb->values();
    }

    public function getAllFolder(Request $request)
    {
        $authUser = auth()->user();
        $employeeId = $authUser->employee->id;
        $currentEmployee = $authUser->employee;
        $userType = strtoupper((string) ($authUser->user_type ?? ''));

        $currentFolder = null;

        if ($request->parent_id) {
            $currentFolder = DocumentFolders::find($request->parent_id);
        }

        $query = DocumentFolders::query()->with('creator')->where('document_folders.parent_folder_id', $request->parent_id);

        $fileQuery = Document::query()->with('employee')->where('documents.folder_id', $request->parent_id);

        // Access rules:
        // - SUPERADMIN: see all folders/files
        // - ADMINISTRATOR: see folders/files owned by employees in same department
        // - REGULAR: only own folders/files
        if ($userType === 'SUPERADMIN') {
            // no extra where
        } elseif ($userType === 'ADMINISTRATOR') {
            // restrict by department
            $query->leftJoin('employees', 'employees.id', '=', 'document_folders.employee_id')
                ->select('document_folders.*')
                ->where('employees.department_id', $currentEmployee->department_id);

            $fileQuery->leftJoin('employees', 'employees.id', '=', 'documents.employee_id')
                ->select('documents.*')
                ->where('employees.department_id', $currentEmployee->department_id);
        } else {
            $query->where('document_folders.employee_id', $employeeId);
            $fileQuery->where('documents.employee_id', $employeeId);
        }

        if ($request->search) {
            $searchTerm = '%' . strtolower($request->search) . '%';
            $query->whereRaw('LOWER(document_folders.folder_name) LIKE ?', [$searchTerm]);
            $fileQuery->whereRaw('LOWER(documents.file_name) LIKE ?', [$searchTerm]);
        }

        if ($request->filter_extension && $request->filter_extension !== 'all') {
            $extension = strtolower($request->filter_extension);
            $fileQuery->where(function ($q) use ($extension) {
                $q->whereRaw('LOWER(documents.file_type) LIKE ?', ["%{$extension}%"])
                    ->orWhereRaw('LOWER(documents.file_name) LIKE ?', ["%.{$extension}"]);
            });
        }

        if ($request->filter_updated && $request->filter_updated !== 'all') {
            $days = (int) $request->filter_updated;
            $pastDate = Carbon::now()->subDays($days)->startOfDay();
            $query->where('document_folders.updated_at', '>=', $pastDate);
            $fileQuery->where('documents.updated_at', '>=', $pastDate);
        }

        if ($request->filter_type === 'folder') {
            $fileQuery->whereRaw('1 = 0');
        } elseif ($request->filter_type === 'file') {
            $query->whereRaw('1 = 0');
        }

        $sortBy = $request->sort_by ?? 'folder_name';
        $direction = $request->sort_direction === 'desc' ? 'desc' : 'asc';

        switch ($sortBy) {

            case 'owner':
                $query->leftJoin('users', 'users.id', '=', 'document_folders.created_by')
                    ->leftJoin('employees', 'employees.id', '=', 'users.employee_id')
                    ->select('document_folders.*')
                    ->orderBy('employees.name', $direction);
                $fileQuery->leftJoin('employees', 'employees.id', '=', 'documents.employee_id')
                    ->select('documents.*')
                    ->orderBy('employees.name', $direction);
                break;

            case 'updated_at':
                $query->orderBy('document_folders.updated_at', $direction);
                $fileQuery->orderBy('documents.updated_at', $direction);
                break;

            case 'folder_name':
            default:
                $query->orderBy('document_folders.folder_name', $direction);
                $fileQuery->orderBy('documents.file_name', $direction);
                break;
        }

        $folders = $query->get();
        $files = $fileQuery->get();

        return response()->json([
            'folders' => $folders,
            'files' => $files,
            'breadcrumb' => $this->getBreadcrumb($request->parent_id),
            'current_folder' => $currentFolder
        ]);
    }

    public function createFolder(Request $request)
    {
        $request->validate([
            'folder_name'      => 'required|max:255',
            'parent_folder_id' => 'nullable|exists:document_folders,id'
        ]);

        $employeeId = auth()->user()->employee->id;
        $userId = auth()->id();

        $folder = DocumentFolders::create([
            'employee_id'      => $employeeId,
            'parent_folder_id' => $request->parent_folder_id,
            'folder_name'      => $request->folder_name,
            'created_by'       => $userId,
        ]);

        return response()->json([
            'status'  => true,
            'message' => 'Folder created successfully.',
            'data'    => $folder
        ]);
    }

    public function uploadFiles(Request $request)
    {
        $request->validate([
            'folder_id' => 'nullable|exists:document_folders,id',
            'files' => 'required|array',
            'files.*' => 'file|max:1048576',
        ]);

        $employeeId = auth()->user()->employee->id;
        $userId = auth()->id();
        $savedFiles = [];
        $uploadFolder = $request->folder_id ?? 'root';
        $destination = public_path("file/documents/{$uploadFolder}");

        if (!file_exists($destination)) {
            mkdir($destination, 0755, true);
        }

        foreach ($request->file('files') as $file) {
            $originalName = $file->getClientOriginalName();
            $extension = $file->getClientOriginalExtension();
            $filename = time() . '_' . uniqid() . '.' . $extension;
            $fileSize = $file->getSize();
            $mimeType = $file->getClientMimeType();
            $file->move($destination, $filename);

            $savedFiles[] = Document::create([
                'employee_id' => $employeeId,
                'folder_id' => $request->folder_id,
                'file_name' => $originalName,
                'file_path' => "file/documents/{$uploadFolder}/{$filename}",
                'file_type' => $mimeType,
                'file_size' => $fileSize,
                'created_by' => $userId,
                'updated_by' => $userId,
            ]);
        }

        return response()->json([
            'status' => true,
            'message' => 'Files uploaded successfully.',
            'data' => $savedFiles,
        ]);
    }

    public function updateFile(Request $request)
    {
        $request->validate([
            'file_id' => 'required|exists:documents,id',
            'file_name' => 'required|max:255',
        ]);

        $employeeId = auth()->user()->employee->id;

        $document = Document::where('id', $request->file_id)
            ->where('employee_id', $employeeId)
            ->firstOrFail();

        $document->file_name = $request->file_name;
        $document->updated_by = auth()->id();
        $document->save();

        return response()->json([
            'status' => true,
            'message' => 'File name updated successfully.',
            'data' => $document,
        ]);
    }

    public function deleteFile($id)
    {
        $employeeId = auth()->user()->employee->id;

        $document = Document::where('id', $id)
            ->where('employee_id', $employeeId)
            ->firstOrFail();

        $filePath = public_path($document->file_path);
        if (file_exists($filePath)) {
            @unlink($filePath);
        }

        $document->delete();

        return response()->json([
            'status' => true,
            'message' => 'File deleted successfully.',
        ]);
    }

    public function updateFolder(Request $request)
    {
        $request->validate([
            'folder_id'   => 'required|exists:document_folders,id',
            'folder_name' => 'required|max:255',
        ]);

        $employeeId = auth()->user()->employee->id;

        $folder = DocumentFolders::where('id', $request->folder_id)
            ->where('employee_id', $employeeId)
            ->firstOrFail();

        $folder->folder_name = $request->folder_name;
        $folder->updated_by = auth()->id();
        $folder->save();

        return response()->json([
            'status'  => true,
            'message' => 'Folder name updated successfully.',
            'data'    => $folder
        ]);
    }

    public function deleteFolder($id)
    {
        $employeeId = auth()->user()->employee->id;

        $folder = DocumentFolders::where('id', $id)
            ->where('employee_id', $employeeId)
            ->firstOrFail();

        $deleteIds = [$folder->id];
        $currentIds = [$folder->id];

        while (!empty($currentIds)) {
            $children = DocumentFolders::whereIn('parent_folder_id', $currentIds)
                ->where('employee_id', $employeeId)
                ->pluck('id')
                ->toArray();

            if (empty($children)) {
                break;
            }

            $deleteIds = array_merge($deleteIds, $children);
            $currentIds = $children;
        }

        DocumentFolders::whereIn('id', $deleteIds)->delete();

        return response()->json([
            'status'  => true,
            'message' => 'Folder and its child folders deleted successfully.',
        ]);
    }
}
