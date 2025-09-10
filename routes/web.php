<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DivisionController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\JobController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\ScheduleController;
use App\Http\Controllers\ShiftController;

use App\Http\Controllers\TeamsController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\CalendarController;
use App\Http\Controllers\AttendanceTrackingController;

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
});

Route::post('/user/{id}/reset-password', [UserController::class, 'resetPassword'])->name('user.resetPassword')->middleware('auth');

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
    Route::post('/profile/update', [ProfileController::class, 'updateProfile'])->name('profile.updateProfile');
    Route::post('/profile/verify-current-password', [ProfileController::class, 'verifyCurrentPassword'])->name('profile.verifyCurrentPassword');
    Route::get('/profile/index', [ProfileController::class, 'index'])->name('profile.index');
    Route::get('/profile/create', [ProfileController::class, 'create'])->name('profile.create');
    Route::get('/profile/{id}/edit', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::get('/profile/{id}', [ProfileController::class, 'show'])->name('profile.show');
    Route::post('/profile/store', [ProfileController::class, 'store'])->name('profile.store');
    Route::put('/profile/{id}', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile/{id}', [ProfileController::class, 'destroy'])->name('profile.destroy');


    Route::get('/project', [ProjectController::class, 'showProjectPage'])->name('project');
    Route::post('/project/update', [ProjectController::class, 'updateproject'])->name('project.update.post');
    Route::get('/project/index', [ProjectController::class, 'index'])->name('project.index');
    Route::get('/project/get-all-projects', [ProjectController::class, 'getAllProjects'])->name('project.getAllProjects');
    Route::get('/project/create', [ProjectController::class, 'create'])->name('project.create');
    Route::get('/project/{id}/edit', [ProjectController::class, 'edit'])->name('project.edit');
    Route::get('/project/{id}', [ProjectController::class, 'show'])->name('project.show');
    Route::post('/project/store', [ProjectController::class, 'store'])->name('project.store');
    Route::post('/project-feedbacks', [ProjectController::class, 'storeFeedback'])->name('project-feedbacks.store');
    Route::put('/project-feedbacks/{id}', [ProjectController::class, 'updateFeedback'])->name('project-feedbacks.update');
    Route::get('/project-feedbacks/{projectId}', [ProjectController::class, 'getProjectFeedbacks'])->name('project-feedbacks.get');
    // Project unread and latest feedback endpoints
    Route::get('/project/{id}/feedbacks/unread-count', [ProjectController::class, 'getUnreadFeedbackCount'])->name('project-feedbacks.unread-count');
    Route::post('/project/{id}/feedbacks/mark-read', [ProjectController::class, 'markProjectFeedbacksRead'])->name('project-feedbacks.mark-read');
    Route::get('/project-feedbacks/{projectId}/latest', [ProjectController::class, 'getProjectLatestFeedback'])->name('project-feedbacks.latest');
    Route::put('/project/{id}', [ProjectController::class, 'update'])->name('project.update');
    Route::delete('/project/{id}', [ProjectController::class, 'destroy'])->name('project.destroy');

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
    Route::delete('/task/{id}', [TaskController::class, 'destroy'])->name('task.destroy');
    // Dashboard: Today tasks for current user
    Route::get('/task/dashboard/today', [TaskController::class, 'getDashboardTasksToday'])->name('task.dashboard.today');
    // Dashboard: Tomorrow tasks for current user
    Route::get('/task/dashboard/tomorrow', [TaskController::class, 'getDashboardTasksTomorrow'])->name('task.dashboard.tomorrow');

    // Task Feedback routes
    Route::post('/task-feedbacks', [TaskController::class, 'storeFeedback'])->name('task-feedbacks.store');
    Route::put('/task-feedbacks/{id}', [TaskController::class, 'updateFeedback'])->name('task-feedbacks.update');
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

    // Schedules (basic endpoints for modal create & list)
    Route::get('/schedules/create', [ScheduleController::class, 'create'])->name('schedules.create');
    Route::post('/schedules', [ScheduleController::class, 'store'])->name('schedules.store');
    Route::get('/schedules', [ScheduleController::class, 'index'])->name('schedules.index');


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
    Route::get('/attendance/index', [AttendanceController::class, 'index'])->name('attendance.index');
    Route::get('/attendance/create', [AttendanceController::class, 'create'])->name('attendance.create');
    Route::get('/attendance/{id}/edit', [AttendanceController::class, 'edit'])->name('attendance.edit');
    Route::get('/attendance/{id}', [AttendanceController::class, 'show'])->name('attendance.show');

    Route::post('/attendance/submit-checkin', [AttendanceController::class, 'submitCheckin'])->name('attendance.submitCheckin');
    Route::post('/attendance/submit-checkout', [AttendanceController::class, 'submitCheckout'])->name('attendance.submitCheckout');

    Route::post('/attendance/store', [AttendanceController::class, 'store'])->name('attendance.store');
    Route::post('/attendance/checkout', [AttendanceController::class, 'checkout'])->name('attendance.checkout');
    Route::get('/attendance/today/{employeeId}', [AttendanceController::class, 'getTodayAttendance'])->name('attendance.today');
    Route::get('/attendance/monthly/{employeeId}/{year}/{month}', [AttendanceController::class, 'getMonthlyAttendance'])->name('attendance.monthly');
    Route::put('/attendance/{id}', [AttendanceController::class, 'update'])->name('attendance.update');
    Route::delete('/attendance/{id}', [AttendanceController::class, 'destroy'])->name('attendance.destroy');


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

    Route::get('/attendance/latest-unclosed/{employeeId}', [AttendanceController::class, 'getLatestUnclosedAttendance']);
    Route::get('/attendance/daily/{employeeId}/{date}', [AttendanceController::class, 'getDailyAttendances']);
    Route::get('/attendance/shift-details/{employeeId}/{date}', [AttendanceController::class, 'getEmployeeShiftDetails']);
    Route::get('/attendance/today-status/{employeeId}', [AttendanceController::class, 'getTodayStatus']);


    Route::get('/calendar', [CalendarController::class, 'showCalendarPage'])->name('calendar');
    Route::get('/calendar/get-calendar-data', [CalendarController::class, 'getCalendarData'])->name('calendar.getCalendarData');

});


Route::middleware('auth', 'management')->group(function () {


    Route::get('/master', function () {
        return view('master.master');
    })->name('master');


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
    
    Route::get('/settings', [SettingsController::class, 'showSettingsPage'])->name('settings');
    Route::get('/settings/get-all-User', [SettingsController::class, 'getAllUser'])->name('settings.getAllUser');
    Route::post('/settings/edit-user-role', [SettingsController::class, 'editUserRole'])->name('settings.editUserRole');

});






