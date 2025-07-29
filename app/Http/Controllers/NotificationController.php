<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Notification;
use App\Models\Employee;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    /**
     * Get notifications for the current authenticated user
     */
    public function getUserNotifications()
    {
        $user = Auth::user();
        
        if (!$user || !$user->employee) {
            return response()->json(['data' => [], 'count' => 0]);
        }

        $employeeId = $user->employee->id;
        
        // Ambil semua notifikasi untuk employee ini, termasuk yang sudah dibaca
        // Tapi tampilkan yang belum dibaca terlebih dahulu
        $notifications = Notification::where('employee_id', $employeeId)
            ->orderBy('is_read', 'asc') // Yang belum dibaca dulu
            ->orderBy('sent_at', 'desc')
            ->orderBy('created_at', 'desc')
            ->limit(50) // Batasi untuk performa
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
                'employee_id' => $notification->employee_id, // Tambahkan untuk validasi
            ];
        });

        return response()->json([
            'data' => $notificationsTransformed,
            'count' => $notifications->count()
        ]);
    }

    /**
     * Get the count of unread notifications for the current user
     */
    public function getUnreadCount()
    {
        $user = Auth::user();
        
        if (!$user || !$user->employee) {
            return response()->json(['count' => 0]);
        }

        $employeeId = $user->employee->id;
        
        $count = Notification::where('employee_id', $employeeId)
            ->where('is_read', false)
            ->count();
        
        return response()->json(['count' => $count]);
    }

    /**
     * Mark a notification as read (update is_read to true)
     */
    public function markAsRead($id)
    {
        $user = Auth::user();
        
        if (!$user || !$user->employee) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $employeeId = $user->employee->id;
        
        $notification = Notification::where('id', $id)
            ->where('employee_id', $employeeId)
            ->first();

        if (!$notification) {
            return response()->json(['error' => 'Notification not found'], 404);
        }

        $notification->update(['is_read' => true]);

        return response()->json(['message' => 'Notification marked as read']);
    }

    /**
     * Mark all notifications as read for the current user
     */
    public function markAllAsRead()
    {
        $user = Auth::user();
        
        if (!$user || !$user->employee) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $employeeId = $user->employee->id;
        
        Notification::where('employee_id', $employeeId)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json(['message' => 'All notifications marked as read']);
    }

    /**
     * Create notification for specific user
     */
    public static function createUserNotification($employeeId, $type, $title, $message, $createdBy = null, $taskId = null)
    {
        $fullMessage = $message;
        if ($taskId) {
            $fullMessage .= " [Task ID: {$taskId}]";
        }
        
        return Notification::create([
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
    }

    /**
     * Create notification for multiple users
     */
    public static function createBulkNotifications($employeeIds, $type, $title, $message, $createdBy = null)
    {
        $notifications = [];
        
        foreach ($employeeIds as $employeeId) {
            $notifications[] = self::createUserNotification($employeeId, $type, $title, $message, $createdBy);
        }
        
        return $notifications;
    }

    /**
     * Create notification for specific role
     */
    public static function createNotificationForRole($role, $type, $title, $message, $createdBy = null)
    {
        $employees = Employee::whereHas('user', function($query) use ($role) {
            $query->where('role', $role);
        })->get();

        $notifications = [];
        foreach ($employees as $employee) {
            $notifications[] = self::createUserNotification($employee->id, $type, $title, $message, $createdBy);
        }

        return $notifications;
    }

    /**
     * Delete a notification for the current authenticated user
     */
    public function deleteNotification($id)
    {
        $user = Auth::user();
        
        if (!$user || !$user->employee) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $employeeId = $user->employee->id;
        
        $notification = Notification::where('id', $id)
            ->where('employee_id', $employeeId)
            ->first();

        if (!$notification) {
            return response()->json(['error' => 'Notification not found'], 404);
        }

        $notification->delete();

        return response()->json(['message' => 'Notification deleted successfully']);
    }
}
