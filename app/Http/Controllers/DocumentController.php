<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Document;
use App\Models\DocumentFolders;
use App\Models\Employee;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Pagination\LengthAwarePaginator;

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
        $authUser = Auth::user();
        $employeeId = $authUser->employee->id;
        $currentEmployee = $authUser->employee;
        $userType = strtoupper((string) ($authUser->user_type ?? ''));
        $departmentFilter = $request->input('filter_department');
        $divisionFilter = $request->input('filter_division');
        $jobFilter = $request->input('filter_job');
        $page = max((int) $request->input('page', 1), 1);
        $perPage = (int) $request->input('per_page', 10);

        if (!in_array($perPage, [10, 20, 50, 100], true)) {
            $perPage = 10;
        }

        $currentFolder = null;

        if ($request->parent_id) {
            $currentFolder = DocumentFolders::find($request->parent_id);
        }

        $query = DocumentFolders::query()
            ->with('creator')
            ->select('document_folders.*')
            ->leftJoin('employees as doc_employees', 'doc_employees.id', '=', 'document_folders.employee_id')
            ->where('document_folders.parent_folder_id', $request->parent_id);

        $fileQuery = Document::query()
            ->with('employee')
            ->select('documents.*')
            ->leftJoin('employees as doc_employees', 'doc_employees.id', '=', 'documents.employee_id')
            ->where('documents.folder_id', $request->parent_id);

        // Access rules:
        // - SUPERADMIN: see all folders/files
        // - ADMINISTRATOR: see folders/files owned by employees in same department
        // - REGULAR: only own folders/files
        if ($userType === 'SUPERADMIN') {
            if ($departmentFilter && $departmentFilter !== 'all') {
                $query->where('doc_employees.department_id', $departmentFilter);
                $fileQuery->where('doc_employees.department_id', $departmentFilter);
            }
        } elseif ($userType === 'ADMINISTRATOR') {
            $query->where('doc_employees.department_id', $currentEmployee->department_id);
            $fileQuery->where('doc_employees.department_id', $currentEmployee->department_id);
        } else {
            $query->where('document_folders.employee_id', $employeeId);
            $fileQuery->where('documents.employee_id', $employeeId);
        }

        if ($divisionFilter && $divisionFilter !== 'all') {
            $query->where('doc_employees.division_id', $divisionFilter);
            $fileQuery->where('doc_employees.division_id', $divisionFilter);
        }

        if ($jobFilter && $jobFilter !== 'all') {
            $query->where('doc_employees.job_id', $jobFilter);
            $fileQuery->where('doc_employees.job_id', $jobFilter);
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
                    ->leftJoin('employees as owner_employees', 'owner_employees.id', '=', 'users.employee_id')
                    ->orderBy('owner_employees.name', $direction);
                $fileQuery->leftJoin('users', 'users.id', '=', 'documents.created_by')
                    ->leftJoin('employees as owner_employees', 'owner_employees.id', '=', 'users.employee_id')
                    ->orderBy('owner_employees.name', $direction);
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

        $folders = $query->get()->map(function ($folder) {
            $folder->item_type = 'folder';
            return $folder;
        });

        $files = $fileQuery->get()->map(function ($file) {
            $file->item_type = 'file';
            return $file;
        });

        $merged = $folders->concat($files)->values();

        $sorted = $merged->sort(function ($a, $b) use ($sortBy, $direction) {
            if ($sortBy === 'owner') {
                $valueA = strtolower((string) ($a->item_type === 'folder' ? ($a->creator->name ?? '') : ($a->employee->name ?? '')));
                $valueB = strtolower((string) ($b->item_type === 'folder' ? ($b->creator->name ?? '') : ($b->employee->name ?? '')));
            } elseif ($sortBy === 'updated_at') {
                $valueA = strtotime((string) ($a->updated_at ?? '1970-01-01 00:00:00'));
                $valueB = strtotime((string) ($b->updated_at ?? '1970-01-01 00:00:00'));
            } else {
                $valueA = strtolower((string) ($a->item_type === 'folder' ? ($a->folder_name ?? '') : ($a->file_name ?? '')));
                $valueB = strtolower((string) ($b->item_type === 'folder' ? ($b->folder_name ?? '') : ($b->file_name ?? '')));
            }

            if ($valueA === $valueB) {
                return 0;
            }

            if ($direction === 'desc') {
                return $valueA < $valueB ? 1 : -1;
            }

            return $valueA > $valueB ? 1 : -1;
        })->values();

        $total = $sorted->count();
        $offset = ($page - 1) * $perPage;
        $pageItems = $sorted->slice($offset, $perPage)->values();

        $paginator = new LengthAwarePaginator(
            $pageItems,
            $total,
            $perPage,
            $page,
            [
                'path' => $request->url(),
                'query' => $request->query(),
            ]
        );

        $pagedFolders = $pageItems->where('item_type', 'folder')->values()->map(function ($item) {
            unset($item->item_type);
            return $item;
        });

        $pagedFiles = $pageItems->where('item_type', 'file')->values()->map(function ($item) {
            unset($item->item_type);
            return $item;
        });

        return response()->json([
            'folders' => $pagedFolders,
            'files' => $pagedFiles,
            'breadcrumb' => $this->getBreadcrumb($request->parent_id),
            'current_folder' => $currentFolder,
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ],
        ]);
    }

    public function createFolder(Request $request)
    {
        $request->validate([
            'folder_name'      => 'required|max:255',
            'parent_folder_id' => 'nullable|exists:document_folders,id'
        ]);

        $employeeId = Auth::user()->employee->id;
        $userId = Auth::id();

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
            'files.*' => 'file|max:20480',
        ]);

        $authUser = Auth::user();
        $currentEmployee = $authUser->employee;
        abort_if(!$currentEmployee, 403, 'Employee account is not linked.');

        $targetFolder = $request->folder_id
            ? DocumentFolders::findOrFail($request->folder_id)
            : null;
        $employeeId = (int) ($targetFolder?->employee_id ?? $currentEmployee->id);
        $targetEmployee = Employee::findOrFail($employeeId);
        $userType = strtoupper((string) ($authUser->user_type ?? ''));

        if ($userType !== 'SUPERADMIN') {
            if (in_array($userType, ['ADMINISTRATOR', 'ADMIN'], true)) {
                abort_unless(
                    (int) $targetEmployee->department_id === (int) $currentEmployee->department_id,
                    403,
                    'You cannot upload files outside your department.'
                );
            } else {
                abort_unless(
                    (int) $targetEmployee->id === (int) $currentEmployee->id,
                    403,
                    'You cannot upload files to another employee folder.'
                );
            }
        }

        $userId = Auth::id();
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

        $userId = Auth::id();

        $document = Document::where('id', $request->file_id)
            ->where('created_by', $userId)
            ->firstOrFail();

        $document->file_name = $request->file_name;
        $document->updated_by = Auth::id();
        $document->save();

        return response()->json([
            'status' => true,
            'message' => 'File name updated successfully.',
            'data' => $document,
        ]);
    }

    public function deleteFile($id)
    {
        $userId = Auth::id();

        $document = Document::where('id', $id)
            ->where('created_by', $userId)
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

        $userId = Auth::id();

        $folder = DocumentFolders::where('id', $request->folder_id)
            ->where('created_by', $userId)
            ->firstOrFail();

        $folder->folder_name = $request->folder_name;
        $folder->updated_by = Auth::id();
        $folder->save();

        return response()->json([
            'status'  => true,
            'message' => 'Folder name updated successfully.',
            'data'    => $folder
        ]);
    }

    public function deleteFolder($id)
    {
        $userId = Auth::id();

        $folder = DocumentFolders::where('id', $id)
            ->where('created_by', $userId)
            ->firstOrFail();

        $deleteIds = [$folder->id];
        $currentIds = [$folder->id];

        while (!empty($currentIds)) {
            $children = DocumentFolders::whereIn('parent_folder_id', $currentIds)
                ->where('created_by', $userId)
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
