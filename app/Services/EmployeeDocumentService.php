<?php

namespace App\Services;

use App\Models\Document;
use App\Models\DocumentFolders;
use App\Models\Employee;
use Illuminate\Support\Str;

class EmployeeDocumentService
{
    public function sync(Employee $employee, int $actorId, array $sources = []): void
    {
        $root = DocumentFolders::firstOrCreate(
            [
                'employee_id' => $employee->id,
                'parent_folder_id' => null,
            ],
            [
                'folder_name' => $employee->name,
                'created_by' => $actorId,
                'updated_by' => $actorId,
            ]
        );

        if ($root->folder_name !== $employee->name) {
            $root->update([
                'folder_name' => $employee->name,
                'updated_by' => $actorId,
            ]);
        }

        $cvFolder = $this->folder($employee, $root->id, 'CV', $actorId);
        $pkwtFolder = $this->folder($employee, $root->id, 'PKWT', $actorId);
        $otherFolder = $this->folder($employee, $root->id, 'Dan Lainnya', $actorId);
        $ktpFolder = $this->folder($employee, $otherFolder->id, 'KTP', $actorId);
        $profileFolder = $this->folder($employee, $otherFolder->id, 'Photo Profile', $actorId);

        $employeeDirectoryName = 'employee_' . $employee->id . '_' . Str::slug($employee->name, '_');
        $folderMap = [
            'cv' => [$cvFolder, 'CV'],
            'pkwt' => [$pkwtFolder, 'PKWT'],
            'ktp' => [$ktpFolder, 'Dan_Lainnya/KTP'],
            'profile' => [$profileFolder, 'Dan_Lainnya/Photo_Profile'],
        ];

        $sources = array_merge($this->sourcesFromEmployee($employee), $sources);

        foreach ($folderMap as $key => [$folder, $directory]) {
            $source = $sources[$key] ?? null;
            $sourcePath = $this->resolveSourcePath($source['source_path'] ?? null);

            if (!$sourcePath || !is_file($sourcePath)) {
                continue;
            }

            $targetDirectory = public_path('file/documents/' . $employeeDirectoryName . '/' . $directory);
            if (!is_dir($targetDirectory)) {
                mkdir($targetDirectory, 0775, true);
            }

            $storedFilename = basename($sourcePath);
            $relativePath = 'file/documents/' . $employeeDirectoryName . '/' . $directory . '/' . $storedFilename;
            $destinationPath = public_path($relativePath);

            if (!is_file($destinationPath)) {
                copy($sourcePath, $destinationPath);
            }

            Document::updateOrCreate(
                [
                    'employee_id' => $employee->id,
                    'folder_id' => $folder->id,
                    'file_path' => $relativePath,
                ],
                [
                    'file_name' => $source['original_name'] ?? $storedFilename,
                    'file_type' => $source['mime_type']
                        ?? (function_exists('mime_content_type') ? mime_content_type($sourcePath) : null)
                        ?: 'application/octet-stream',
                    'file_size' => $source['file_size'] ?? filesize($sourcePath),
                    'created_by' => $actorId,
                    'updated_by' => $actorId,
                ]
            );
        }
    }

    private function folder(Employee $employee, int $parentId, string $name, int $actorId): DocumentFolders
    {
        $existingFolder = DocumentFolders::where('employee_id', $employee->id)
            ->where('parent_folder_id', $parentId)
            ->whereRaw('LOWER(folder_name) = ?', [strtolower($name)])
            ->first();

        if ($existingFolder) {
            return $existingFolder;
        }

        return DocumentFolders::create(
            [
                'employee_id' => $employee->id,
                'parent_folder_id' => $parentId,
                'folder_name' => $name,
                'created_by' => $actorId,
                'updated_by' => $actorId,
            ]
        );
    }

    private function sourcesFromEmployee(Employee $employee): array
    {
        return [
            'cv' => ['source_path' => $employee->cv],
            'pkwt' => ['source_path' => $employee->pkwt],
            'ktp' => ['source_path' => $employee->ktp],
            'profile' => ['source_path' => $employee->profile_picture ?: $employee->photo],
        ];
    }

    private function resolveSourcePath(?string $path): ?string
    {
        if (!$path || preg_match('/^https?:\/\//i', $path)) {
            return null;
        }

        $normalizedPath = ltrim(str_replace('\\', '/', $path), '/');
        if (in_array($normalizedPath, ['asset/img/avatar.png', 'asset/img/logo/logo.png'], true)) {
            return null;
        }

        if (is_file($path)) {
            return $path;
        }

        $publicPath = public_path($normalizedPath);
        return is_file($publicPath) ? $publicPath : null;
    }
}
