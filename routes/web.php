<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DivisionController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\JobController;
use App\Http\Controllers\LeaveController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\EmployeeOvertimeController;
use App\Http\Controllers\EmployeeTimeOffController;

use App\Http\Controllers\UserController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\ScheduleController;
use App\Http\Controllers\ShiftController;
use App\Http\Controllers\ForgotController;
use App\Http\Controllers\ResetPasswordController;

use App\Http\Controllers\TeamsController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\CalendarController;
use App\Http\Controllers\AttendanceTrackingController;
use App\Http\Controllers\WeekdayOffController;

use App\Http\Controllers\DashboardController;


use Carbon\Carbon;



Route::get('/', function () {
    return redirect('dashboard');
});

Route::middleware('guest')->group(function () {
    Route::get('/login', function () {
        return view('auth.login');
    });

    Route::post('/login', [UserController::class, 'login'])->name('login');

    // Forgot password (accessible to guests)
    Route::get('/forgot-password', [ForgotController::class, 'showForgotPasswordPage'])->name('forgot-password');
    // Handle form submission from forgot password page
    Route::post('/forgot-password', [ForgotController::class, 'submitForgotPassword'])->name('forgot-password.post');
    // Show reset password form with token (link from email)
    Route::get('/reset-password/{token}', [ResetPasswordController::class, 'showResetPasswordPage'])->name('password.reset');
    // Handle reset password submission
    Route::post('/reset-password', [ResetPasswordController::class, 'submitResetPassword'])->name('password.update');
});


Route::get('/server-time', function () {
    $now = Carbon::now('Asia/Jakarta');
    return response()->json([
        'time' => $now->format('H:i'),
        'date' => $now->toDateString(),
        'formatted_date' => $now->format('d F Y'),
    ]);
});


Route::middleware('auth')->group(function () {

    Route::post('/logout', [UserController::class, 'logout'])->name('logout');


    Route::get('/dashboard', [DashboardController::class, 'dashboard'])->name('dashboard');


    Route::get('/profile', [ProfileController::class, 'showprofilePage'])->name('profile');
    Route::post('/profile/edit-password', [ProfileController::class, 'editPassword'])->name('profile.editPassword');
    Route::post('/profile/edit-photo-profile', [ProfileController::class, 'editPhotoProfile'])->name('profile.editPhotoProfile');


    // === Project routes ===
    Route::get('/project', [ProjectController::class, 'showProjectPage'])->name('project');
    Route::post('/project/update', [ProjectController::class, 'updateproject'])->name('project.update.post');
    Route::get('/project/index', [ProjectController::class, 'index'])->name('project.index');
    Route::get('/project/get-all-projects', [ProjectController::class, 'getAllProjects'])->name('project.getAllProjects');
    Route::get('/project/create', [ProjectController::class, 'create'])->name('project.create');
    Route::get('/project/{id}/edit', [ProjectController::class, 'edit'])->name('project.edit');
    // Accept optional slug segment for SEO-friendly URLs like /project/12/nama-project-permalink
    Route::get('/project/{id}/{slug?}', [ProjectController::class, 'show'])->name('project.show');
    Route::get('/projects', [ProjectController::class, 'getProjectsIds'])->name('projects.ids');
    Route::post('/project/store', [ProjectController::class, 'store'])->name('project.store');

    // === Project feedback routes ===
    Route::post('/project-feedbacks', [ProjectController::class, 'storeFeedback'])->name('project-feedbacks.store');
    Route::put('/project-feedbacks/{id}', [ProjectController::class, 'updateFeedback'])->name('project-feedbacks.update');
    // Allow authors to delete their own project feedback or replies
    Route::delete('/project-feedbacks/{id}', [ProjectController::class, 'destroyFeedback'])->name('project-feedbacks.destroy');
    Route::get('/project-feedbacks/latest', [ProjectController::class, 'getProjectsLatestFeedback'])
        ->name('project-feedbacks.latest');
    Route::get('/project-feedbacks/{projectId}', [ProjectController::class, 'getProjectFeedbacks'])->name('project-feedbacks.get');
    Route::get('/project-feedbacks', [ProjectController::class, 'getAllProjectFeedbacks'])->name('project-feedbacks.all');
    Route::get('/projects/feedbacks/unread-counts', [ProjectController::class, 'getAllUnreadCounts'])
        ->name('project-feedbacks.unread-counts');

    // Per project feedback endpoints
    Route::get('/project/{id}/feedbacks/unread-count', [ProjectController::class, 'getUnreadFeedbackCount'])
        ->name('project-feedbacks.unread-count');
    Route::post('/project/{id}/feedbacks/mark-read', [ProjectController::class, 'markProjectFeedbacksRead'])
        ->name('project-feedbacks.mark-read');

    // === Project update & delete ===
    Route::put('/project/{id}', [ProjectController::class, 'update'])->name('project.update');
    Route::delete('/project/{id}', [ProjectController::class, 'destroy'])->name('project.destroy');
    // Delete a single reference file attached to a project (authorized: author only)
    Route::delete('/project/{id}/reference-file', [ProjectController::class, 'destroyReferenceFile'])->name('project.reference-file.destroy');
    // Upload reference files to a project (authorized: author only)
    Route::post('/project/{id}/reference-file', [ProjectController::class, 'storeReferenceFile'])->name('project.reference-file.store');

    // === Other project routes ===
    Route::get('/project/index/card-data', [ProjectController::class, 'getCardData'])->name('project.cardData');
    Route::get('/project-assignments', [ProjectController::class, 'getProjectAssignments'])->name('project.assignments');



    Route::get('/task', [TaskController::class, 'showTaskPage'])->name('task');
    Route::get('/task/index', [TaskController::class, 'index'])->name('task.index');
    Route::get('/task/index/no-pagination', [TaskController::class, 'listNoPagination'])->name('task.index.no-pagination');
    Route::get('/task/create', [TaskController::class, 'create'])->name('task.create');
    Route::get('/task/employees-for-executor', [TaskController::class, 'getEmployeesForTaskExecutor'])->name('task.employees-for-executor');

    // Employee list for projects (accessible to all authenticated users)
    Route::get('/employees-for-projects', [EmployeeController::class, 'getEmployeesForProjects'])->name('employees.for-projects');

    // Department list for projects (accessible to all authenticated users)
    Route::get('/departments-for-projects', [DepartmentController::class, 'getDepartmentsForProjects'])->name('departments.for-projects');

    // Division list for projects (accessible to all authenticated users)
    Route::get('/divisions-for-projects', [DivisionController::class, 'getDivisionsForProjects'])->name('divisions.for-projects');
    Route::get('/task/{id}/edit', [TaskController::class, 'edit'])->name('task.edit');
    Route::get('/task/{id}', [TaskController::class, 'show'])->name('task.show');
    Route::post('/task/store', [TaskController::class, 'store'])->name('task.store');
    Route::put('/task/{id}', [TaskController::class, 'update'])->name('task.update');
    // Delete a single reference file attached to a task (authorized PIC only)
    Route::delete('/task/{id}/reference-file', [TaskController::class, 'destroyReferenceFile'])->name('task.reference-file.destroy');
    // Upload reference files to a task
    Route::post('/task/{id}/reference-file', [TaskController::class, 'storeReferenceFile'])->name('task.reference-file.store');
    // Soft delete task (mark as DELETED without removing from DB)
    Route::put('/task/{id}/soft-delete', [TaskController::class, 'softDelete'])->name('task.soft-delete');
    Route::delete('/task/{id}', [TaskController::class, 'destroy'])->name('task.destroy');
    // Dashboard: Today tasks for current user
    Route::get('/task/dashboard/today', [TaskController::class, 'getDashboardTasksToday'])->name('task.dashboard.today');
    // Dashboard: Tomorrow tasks for current user
    Route::get('/task/dashboard/tomorrow', [TaskController::class, 'getDashboardTasksTomorrow'])->name('task.dashboard.tomorrow');

    // Task Feedback routes
    Route::post('/task-feedbacks', [TaskController::class, 'storeFeedback'])->name('task-feedbacks.store');
    Route::put('/task-feedbacks/{id}', [TaskController::class, 'updateFeedback'])->name('task-feedbacks.update');
    // Allow authors to delete their own feedback or replies
    Route::delete('/task-feedbacks/{id}', [TaskController::class, 'destroyFeedback'])->name('task-feedbacks.destroy');
    // Batched latest feedbacks for multiple tasks (must be BEFORE dynamic {taskId} route)
    Route::get('/task-feedbacks/latest', [TaskController::class, 'getLatestFeedbacksBatch'])->name('task-feedbacks.latest-batch');
    Route::get('/task-feedbacks/{taskId}', [TaskController::class, 'getTaskFeedbacks'])->name('task-feedbacks.get');
    Route::get('/task-feedbacks/{taskId}/latest', [TaskController::class, 'getTaskLatestFeedback'])->name('task-feedbacks.latest');
    Route::get('/task-feedbacks/count/{taskId}', [TaskController::class, 'getTaskFeedbackCount'])->name('task-feedbacks.count');
    // Unread feedback per task
    Route::get('/task/{id}/feedbacks/unread-count', [TaskController::class, 'getUnreadFeedbackCount'])->name('task-feedbacks.unread-count');
    Route::post('/task/{id}/feedbacks/mark-read', [TaskController::class, 'markTaskFeedbacksRead'])->name('task-feedbacks.mark-read');

    // Task status update routes
    Route::put('/task/{id}/status', [TaskController::class, 'updateStatus'])->name('task.update-status');
    Route::post('/task/{id}/accept', [TaskController::class, 'acceptTask'])->name('task.accept');
    Route::post('/task/{id}/reject', [TaskController::class, 'rejectTask'])->name('task.reject');
    Route::get('/task/{id}/accept-status', [TaskController::class, 'checkAcceptStatus'])->name('task.accept-status');

    // Get tasks by project
    Route::get('/projects/{id}/tasks', [TaskController::class, 'getTasksByProject'])->name('project.tasks');
    Route::get('/projects/{id}/tasks/tree', [TaskController::class, 'getTasksByProjectForTree'])->name('project.tasks.tree');

    // Schedules (basic endpoints for modal create & list)
    Route::post('/schedules/create', [ScheduleController::class, 'store'])->name('schedules.store');
    Route::get('/schedules/index', [ScheduleController::class, 'index'])->name('schedules.index');
    Route::get('/schedules/{id}/edit', [ScheduleController::class, 'edit'])->name('schedules.edit');
    Route::put('/schedules/{id}', [ScheduleController::class, 'update'])->name('schedules.update');
    Route::delete('/schedules/{id}', [ScheduleController::class, 'destroy'])->name('schedules.destroy');
    Route::get('/get-schedule-data/{id}', [ScheduleController::class, 'show'])->name('get-schedule-data.schedules');
    Route::get('/schedules', [ScheduleController::class, 'showSchedulePage'])->name('schedules');

    Route::get('/teams', [TeamsController::class, 'showTeamsPage'])->name('teams');
    Route::get('/teams/get-teams-detail', [TeamsController::class, 'getTeamsDetail'])->name('teams.getTeamsDetail');

    // Client-side routes JSON
    Route::get('/client-routes', [UserController::class, 'clientRoutes'])->name('client.routes');

    // Notification routes
    Route::get('/notifications', [NotificationController::class, 'getUserNotifications'])->name('notifications.index');
    Route::get('/notifications/count', [NotificationController::class, 'getUnreadCount'])->name('notifications.count');
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead'])->name('notifications.markAsRead');
    Route::post('/notifications/task/{taskId}/mark-read', [NotificationController::class, 'markTaskAssignmentReadByTask'])->name('notifications.task.markRead');
    Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead'])->name('notifications.markAllAsRead');
    Route::post('/notifications/mark-project-read', [NotificationController::class, 'markProjectNotificationsRead'])->name('notifications.markProjectRead');
    Route::delete('/notifications/{id}', [NotificationController::class, 'deleteNotification'])->name('notifications.delete');

    Route::post('/project/{id}/accept', [ProjectController::class, 'acceptProject'])->name('project.accept');
    Route::get('/project/{id}/accept-status', [ProjectController::class, 'checkAcceptStatus'])->name('project.accept-status');

    Route::get('/attendance', [AttendanceController::class, 'showAttendancePage'])->name('attendance');
    Route::get('/attendance/get-attendance-employee-by-month', [AttendanceController::class, 'getAttendanceEmployeeByMonth'])->name('attendance.getAttendanceEmployeeByMonth');

    Route::post('/attendance/submit-checkin', [AttendanceController::class, 'submitCheckin'])->name('attendance.submitCheckin');
    Route::post('/attendance/submit-checkout', [AttendanceController::class, 'submitCheckout'])->name('attendance.submitCheckout');

    Route::get('/employee-time-off/all-request', [EmployeeTimeOffController::class, 'allRequest'])->name('employee-time-off.allRequest');
    Route::post('/employee-time-off/submit-new-request', [EmployeeTimeOffController::class, 'submitNewRequest'])->name('employee-time-off.submitNewRequest');
    Route::post('/employee-time-off/edit-time-off', [EmployeeTimeOffController::class, 'editTimeOff'])->name('employee-time-off.editTimeOff');
    Route::post('/employee-time-off/delete-time-off', [EmployeeTimeOffController::class, 'deleteTimeOff'])->name('employee-time-off.deleteTimeOff');
    
    Route::get('/employee-overtime/all-request', [EmployeeOvertimeController::class, 'allRequest'])->name('employee-overtime.allRequest');
    Route::post('/employee-overtime/submit-new-request', [EmployeeOvertimeController::class, 'submitNewRequest'])->name('employee-overtime.submitNewRequest');
    Route::post('/employee-overtime/submit-stop-overtime', [EmployeeOvertimeController::class, 'submitStopOvertime'])->name('employee-overtime.submitStopOvertime');
    Route::post('/employee-overtime/submit-edit-overtime', [EmployeeOvertimeController::class, 'submitEditOvertime'])->name('employee-overtime.submitEditOvertime');
    Route::post('/employee-overtime/submit-delete-overtime', [EmployeeOvertimeController::class, 'submitDeleteOvertime'])->name('employee-overtime.submitDeleteOvertime');
    
    Route::get('/shift', [ShiftController::class, 'showShiftPage'])->name('shift');
    Route::get('/shift/employees-with-shifts', [ShiftController::class, 'getEmployeesWithShifts'])->name('shift.employees-with-shifts');
    Route::get('/shift/employees-basic', [ShiftController::class, 'getEmployeesBasic'])->name('shift.employees-basic');
    Route::get('/shift/list', [ShiftController::class, 'getShifts'])->name('shift.list');
    Route::post('/shift/store', [ShiftController::class, 'store'])->name('shift.store');
    Route::put('/shift/update/{id}', [ShiftController::class, 'update'])->name('shift.update');
    // Update an existing shift definition (used by inline edit in Shift Config modal)
    Route::put('/shift/config/{id}', [ShiftController::class, 'updateConfig'])->name('shift.config.update');
    Route::put('/shift/{id}/soft-delete', [ShiftController::class, 'softDelete'])
        ->name('shift.soft-delete');


    Route::get('/calendar', [CalendarController::class, 'showCalendarPage'])->name('calendar');
    Route::get('/calendar/get-calendar-data', [CalendarController::class, 'getCalendarData'])->name('calendar.getCalendarData');

    // Contributions heatmap for employee (completed tasks per day)
    Route::get('/employees/{id}/contributions', [TaskController::class, 'getEmployeeContributions'])
        ->name('employees.contributions');

});


Route::middleware('auth', 'management')->group(function () {


    Route::get('/master', function () {
        return view('master.master');
    })->name('master');


    Route::post('/user/{id}/reset-password', [UserController::class, 'resetPassword'])->name('user.resetPassword');
    Route::get('/user', [UserController::class, 'showUserPage'])->name('user');
    Route::get('/user/index', [UserController::class, 'index'])->name('user.index');
    Route::get('/user/create', [UserController::class, 'create'])->name('user.create');
    // Route::get('/user/{id}/edit', [UserController::class, 'edit'])->name('user.edit');
    Route::get('/user/{id}', [UserController::class, 'show'])->name('user.show');
    Route::post('/user/store', [UserController::class, 'store'])->name('user.store');
    Route::put('/user/{id}', [UserController::class, 'update'])->name('user.update');
    Route::delete('/user/{id}', [UserController::class, 'destroy'])->name('user.destroy');
    Route::get('/user/ajax/data', [UserController::class, 'getUsersAjax'])->name('user.ajax.data');


    Route::get('/department', [DepartmentController::class, 'showDepartmentPage'])->name('department');
    Route::get('/department/index', [DepartmentController::class, 'index'])->name('department.index');
    Route::get('/department/{id}', [DepartmentController::class, 'show'])->name('department.show');
    Route::post('/department/store', [DepartmentController::class, 'store'])->name('department.store');
    Route::put('/department/{id}', [DepartmentController::class, 'update'])->name('department.update');
    Route::delete('/department/{id}', [DepartmentController::class, 'destroy'])->name('department.destroy');


    // Division CRUD routes
    Route::get('/division', [DivisionController::class, 'showDivisionPage'])->name('division');
    Route::get('/division/index', [DivisionController::class, 'index'])->name('division.index');
    Route::get('/division/{id}', [DivisionController::class, 'show'])->name('division.show');
    Route::get('/division/{id}/edit', [DivisionController::class, 'edit'])->name('division.edit');
    Route::post('/division/store', [DivisionController::class, 'store'])->name('division.store');
    Route::put('/division/{id}', [DivisionController::class, 'update'])->name('division.update');
    Route::delete('/division/{id}', [DivisionController::class, 'destroy'])->name('division.destroy');

    // Job CRUD routes
    Route::get('/job', [JobController::class, 'showJobPage'])->name('job');
    Route::get('/job/index', [JobController::class, 'index'])->name('job.index');
    Route::get('/job/{id}', [JobController::class, 'show'])->name('job.show');
    Route::post('/job/store', [JobController::class, 'store'])->name('job.store');
    Route::put('/job/{id}', [JobController::class, 'update'])->name('job.update');
    Route::delete('/job/{id}', [JobController::class, 'destroy'])->name('job.destroy');

    // Employee CRUD routes
    Route::get('/employee', [EmployeeController::class, 'showEmployeePage'])->name('employee');
    Route::get('/employee/index', [EmployeeController::class, 'index'])->name('employee.index');
    Route::get('/employee/create', [EmployeeController::class, 'create'])->name('employee.create');
    Route::get('/employee/{id}/edit', [EmployeeController::class, 'edit'])->name('employee.edit');
    Route::get('/employee/{id}', [EmployeeController::class, 'show'])->name('employee.show');
    Route::post('/employee', [EmployeeController::class, 'store'])->name('employee.store');
    Route::put('/employee/{id}', [EmployeeController::class, 'update'])->name('employee.update');
    Route::delete('/employee/{id}', [EmployeeController::class, 'destroy'])->name('employee.destroy');

    Route::get('/attendance_tracking', [AttendanceTrackingController::class, 'showAttendanceTrackingPage'])->name('attendance_tracking');
    Route::get('/attendance_tracking/get-attendance-tracking-data', [AttendanceTrackingController::class, 'getAttendanceTrackingData'])->name('attendance_tracking.getAttendanceTrackingData');
    Route::get('/attendance_tracking/get-attendance-detail', [AttendanceTrackingController::class, 'getAttendanceDetail'])->name('attendance_tracking.getAttendanceDetail');
    Route::get('/attendance_tracking/export-attendance-monthly/attendance_{year}_{month}.xlsx', [AttendanceTrackingController::class, 'exportAttendanceMonthly'])->name('attendance_tracking.exportAttendanceMonthly');

    Route::get('/settings', [SettingsController::class, 'showSettingsPage'])->name('settings');
    Route::get('/settings/get-all-User', [SettingsController::class, 'getAllUser'])->name('settings.getAllUser');
    Route::post('/settings/edit-user-role', [SettingsController::class, 'editUserRole'])->name('settings.editUserRole');

    Route::get('/leave', [LeaveController::class, 'showLeavePage'])->name('leave');
    Route::POST('/leave/edit-employee-leave-by-year', [LeaveController::class, 'editEmployeeLeaveByYear'])->name('leave.editEmployeeLeaveByYear');
    Route::get('/leave/employee-leave-by-year', [LeaveController::class, 'getEmployeeLeaveByYear'])->name('leave.getEmployeeLeaveByYear');
    Route::get('/leave/all-employee-leave-request', [LeaveController::class, 'allEmployeeLeaveRequest'])->name('leave.allEmployeeLeaveRequest');

    Route::post('/leave/approve-employee-leave-request', [LeaveController::class, 'approveEmployeeLeaveRequest'])->name('leave.approveEmployeeLeaveRequest');
    Route::post('/leave/reject-employee-leave-request', [LeaveController::class, 'rejectEmployeeLeaveRequest'])->name('leave.rejectEmployeeLeaveRequest');

    Route::get('/weekdays_off', [WeekdayOffController::class, 'showWeekdayOffPage'])->name('weekday_off');
    Route::post('/weekday_off/save-employee-weekday-off', [WeekdayOffController::class, 'saveEmployeeWeekdayoff'])->name('weekday_off.saveEmployeeWeekdayoff');

});






