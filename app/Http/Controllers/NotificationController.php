<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Notification;
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
        
        $notifications = Notification::where('employee_id', $employeeId)
            ->orderBy('sent_at', 'desc')
            ->orderBy('created_at', 'desc')
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
        
        $count = Notification::where('employee_id', $employeeId)->count();
        
        return response()->json(['count' => $count]);
    }

    /**
     * Mark a notification as read (delete it or mark as read)
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

        $notification->delete(); // Soft delete as read

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
        
        Notification::where('employee_id', $employeeId)->delete(); // Soft delete as read

        return response()->json(['message' => 'All notifications marked as read']);
    }
}
