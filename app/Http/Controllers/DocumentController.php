<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\DocumentFolders;

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
        $employeeId = auth()->user()->employee->id;

        $currentFolder = null;

        if ($request->parent_id) {
            $currentFolder = DocumentFolders::find($request->parent_id);
        }

        $folders = DocumentFolders::with('creator')
            ->where('employee_id', $employeeId)
            ->where('parent_folder_id', $request->parent_id)
            ->orderBy('folder_name')
            ->get();

        return response()->json([
            'folders' => $folders,
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
}
