<?php

namespace App\Helpers;

use App\Models\TaskAssignmentLog;

class TaskAssignmentLogService
{
    /**
     * Record a task assignment related event.
     *
     * @param array $params
     * @return TaskAssignmentLog
     */
    public static function record(array $params)
    {
        list($actionNormalized, $statusDerived) = TaskAssignmentLog::normalizeActionAndStatus($params['action'] ?? null);

        $data = [
            'task_id' => $params['task_id'] ?? null,
            'employee_id' => $params['employee_id'] ?? null,
            'creator_task' => $params['creator_task'] ?? null,
            'action' => $actionNormalized,
            'status' => strtoupper($params['status'] ?? $statusDerived),
            'created_by' => $params['created_by'] ?? null,
            'updated_by' => $params['updated_by'] ?? null,
            'deleted_by' => $params['deleted_by'] ?? null,
        ];

        return TaskAssignmentLog::create($data);
    }
}
