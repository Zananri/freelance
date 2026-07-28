<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        do {
            $folders = DB::table('document_folders as child')
                ->join('document_folders as parent', 'parent.id', '=', 'child.parent_folder_id')
                ->whereColumn('child.employee_id', '<>', 'parent.employee_id')
                ->select('child.id', 'parent.employee_id')
                ->get();

            foreach ($folders as $folder) {
                DB::table('document_folders')
                    ->where('id', $folder->id)
                    ->update(['employee_id' => $folder->employee_id]);
            }
        } while ($folders->isNotEmpty());

        $documents = DB::table('documents')
            ->join('document_folders', 'document_folders.id', '=', 'documents.folder_id')
            ->whereColumn('documents.employee_id', '<>', 'document_folders.employee_id')
            ->select('documents.id', 'document_folders.employee_id')
            ->get();

        foreach ($documents as $document) {
            DB::table('documents')
                ->where('id', $document->id)
                ->update(['employee_id' => $document->employee_id]);
        }
    }

    public function down(): void
    {
        // Ownership cannot be safely restored without losing newer document assignments.
    }
};
