<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Notification;
use App\Models\Employee;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class NotificationController extends Controller
{
    /**
     * Get notifications for the current authenticated user
     */
    public function getUserNotifications()
    {
        try {
            $user = Auth::user();
            
            if (!$user || !$user->employee) {
                return response()->json([
                    'code' => 200,
                    'status' => 'success',
                    'data' => [],
                    'count' => 0
                ]);
            }

            $employeeId = $user->employee->id;
            
            $notifications = Notification::with(['creator', 'employee'])
                ->where('employee_id', $employeeId)
                ->orderBy('is_read', 'asc')
                ->orderBy('sent_at', 'desc')
                ->orderBy('created_at', 'desc')
                ->limit(50)
                ->get();

            $notificationsTransformed = $notifications->map(function ($notification) {
                return [
                    'id' => $notification->id,
                    'type' => $notification->type,
                    'title' => $notification->title,
                    'message' => $notification->message,
                    'sent_at' => $notification->sent_at,
                    'created_at' => $notification->created_at,
                    'created_by_name' => $notification->creator ? $notification->creator->name : 'System',
                    'employee_name' => $notification->employee ? $notification->employee->name : 'Unknown',
                    'employee_id' => $notification->employee_id,
                    'is_read' => $notification->is_read,
                ];
            });

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => $notificationsTransformed,
                'count' => $notifications->count()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'code' => $e->getCode() ?: 500,
                'status' => 'error',
                'message' => $e->getMessage(),
                'data' => []
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * Get the count of unread notifications for the current user
     */
    public function getUnreadCount()
    {
        try {
            $user = Auth::user();
            
            if (!$user || !$user->employee) {
                return response()->json([
                    'code' => 200,
                    'status' => 'success',
                    'count' => 0
                ]);
            }

            $employeeId = $user->employee->id;
            
            $count = Notification::where('employee_id', $employeeId)
                ->where('is_read', false)
                ->count();
            
            return response()->json([
                'code' => 200,
                'status' => 'success',
                'count' => $count
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'code' => $e->getCode() ?: 500,
                'status' => 'error',
                'message' => $e->getMessage(),
                'count' => 0
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * Mark a notification as read
     */
    public function markAsRead($id)
    {
        DB::beginTransaction();
        try {
            $user = Auth::user();
            
            if (!$user || !$user->employee) {
                throw new \Exception('Unauthorized', 401);
            }

            $employeeId = $user->employee->id;
            
            $notification = Notification::where('id', $id)
                ->where('employee_id', $employeeId)
                ->first();

            if (!$notification) {
                throw new \Exception('Notification not found', 404);
            }

            $notification->update(['is_read' => true]);

            DB::commit();

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'message' => 'Notification marked as read'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'code' => $e->getCode() ?: 500,
                'status' => 'error',
                'message' => $e->getMessage()
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * Mark all notifications as read for the current user
     */
    public function markAllAsRead()
    {
        DB::beginTransaction();
        try {
            $user = Auth::user();
            
            if (!$user || !$user->employee) {
                throw new \Exception('Unauthorized', 401);
            }

            $employeeId = $user->employee->id;
            
            Notification::where('employee_id', $employeeId)
                ->where('is_read', false)
                ->update(['is_read' => true]);

            DB::commit();

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'message' => 'All notifications marked as read'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'code' => $e->getCode() ?: 500,
                'status' => 'error',
                'message' => $e->getMessage()
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * Create notification for specific user
     */
    public static function createUserNotification($employeeId, $type, $title, $message, $createdBy = null, $taskId = null)
    {
        DB::beginTransaction();
        try {
            $fullMessage = $message;
            if ($taskId) {
                $fullMessage .= " [Task ID: {$taskId}]";
            }
            
            $notification = Notification::create([
                'employee_id' => $employeeId,
                'type' => $type,
                'title' => $title,
                'message' => $fullMessage,
                'sent_at' => now(),
                'is_read' => false,
                'created_by' => $createdBy,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::commit();
            return $notification;

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error("Failed to create notification: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Create notification for multiple users
     */
    public static function createBulkNotifications($employeeIds, $type, $title, $message, $createdBy = null)
    {
        DB::beginTransaction();
        try {
            $notifications = [];
            
            foreach ($employeeIds as $employeeId) {
                $notification = self::createUserNotification($employeeId, $type, $title, $message, $createdBy);
                if ($notification) {
                    $notifications[] = $notification;
                }
            }
            
            DB::commit();
            return $notifications;

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error("Failed to create bulk notifications: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Create notification for specific role
     */
    public static function createNotificationForRole($role, $type, $title, $message, $createdBy = null)
    {
        DB::beginTransaction();
        try {
            $employees = Employee::whereHas('user', function($query) use ($role) {
                $query->where('role', $role);
            })->get();

            $notifications = [];
            foreach ($employees as $employee) {
                $notification = self::createUserNotification($employee->id, $type, $title, $message, $createdBy);
                if ($notification) {
                    $notifications[] = $notification;
                }
            }

            DB::commit();
            return $notifications;

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error("Failed to create role-based notifications: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Delete a notification for the current authenticated user
     */
    public function deleteNotification($id)
    {
        DB::beginTransaction();
        try {
            $user = Auth::user();
            
            if (!$user || !$user->employee) {
                throw new \Exception('Unauthorized', 401);
            }

            $employeeId = $user->employee->id;
            
            $notification = Notification::where('id', $id)
                ->where('employee_id', $employeeId)
                ->first();

            if (!$notification) {
                throw new \Exception('Notification not found', 404);
            }

            $notification->delete();

            DB::commit();

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'message' => 'Notification deleted successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'code' => $e->getCode() ?: 500,
                'status' => 'error',
                'message' => $e->getMessage()
            ], $e->getCode() ?: 500);
        }
    }
}