<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DivisionController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\JobController;
use App\Http\Controllers\PartnerController;
use App\Http\Controllers\LeaveController;
use App\Http\Controllers\OvertimeController;

use App\Http\Controllers\SalaryPayslipController;

use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\EmployeeOvertimeController;
use App\Http\Controllers\EmployeeTimeOffController;

use App\Http\Controllers\DocumentController;
use App\Http\Controllers\RecruitmentController;
use App\Http\Controllers\MonitoringController;

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
use App\Http\Controllers\EmployeeCalendarController;
use App\Http\Controllers\CalendarController;
use App\Http\Controllers\AttendanceTrackingController;
use App\Http\Controllers\WeekdayOffController;

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HRInfoController;
use App\Http\Controllers\HubDivisionController;
use Carbon\Carbon;



Route::get('/', function () {
    return redirect('dashboard');
});

Route::get('/auth_url', [UserController::class, 'authUrl'])->name('authUrl');

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
    Route::get('/dashboard/monitoring-widget', [DashboardController::class, 'dashboardMonitoringWidget'])
        ->name('dashboard.monitoringWidget');

    Route::get('/profile', [ProfileController::class, 'showprofilePage'])->name('profile');
    Route::post('/profile/edit-password', [ProfileController::class, 'editPassword'])->name('profile.editPassword');
    Route::post('/profile/edit-photo-profile', [ProfileController::class, 'editPhotoProfile'])->name('profile.editPhotoProfile');
    Route::get('/payslip/download/{year}/{month}', [ProfileController::class, 'downloadPDFPayslip'])->name('salary_payslip.downloadPDFPayslipProfile');

    // Employee list for projects (accessible to all authenticated users)
    Route::get('/employees-for-projects', [EmployeeController::class, 'getEmployeesForProjects'])->name('employees.for-projects');

    // Department list for projects (accessible to all authenticated users)
    Route::get('/departments-for-projects', [DepartmentController::class, 'getDepartmentsForProjects'])->name('departments.for-projects');

    // Division list for projects (accessible to all authenticated users)
    Route::get('/divisions-for-projects', [DivisionController::class, 'getDivisionsForProjects'])->name('divisions.for-projects');

    Route::get('/teams', [TeamsController::class, 'showTeamsPage'])->name('teams');
    Route::get('/teams/get-teams-detail', [TeamsController::class, 'getTeamsDetail'])->name('teams.getTeamsDetail');

    // Client-side routes JSON
    Route::get('/client-routes', [UserController::class, 'clientRoutes'])->name('client.routes');

    // Document routes
    Route::get('/document', [DocumentController::class, 'documentPage'])->name('document');
    Route::get('/document/get-all-folder', [DocumentController::class, 'getAllFolder'])->name('document.getAllFolder');
    Route::post('/document/create-folder', [DocumentController::class, 'createFolder'])->name('document.create-folder');
    Route::post('/document/update-folder', [DocumentController::class, 'updateFolder'])->name('document.update-folder');
    Route::post('/document/upload-files', [DocumentController::class, 'uploadFiles'])->name('document.upload-files');
    Route::post('/document/update-file', [DocumentController::class, 'updateFile'])->name('document.update-file');
    Route::delete('/document/delete-file/{id}', [DocumentController::class, 'deleteFile'])->name('document.delete-file');
    Route::delete('/document/delete-folder/{id}', [DocumentController::class, 'deleteFolder'])->name('document.delete-folder');

    // Notification routes
    Route::get('/notifications', [NotificationController::class, 'getUserNotifications'])->name('notifications.index');
    Route::get('/notifications/count', [NotificationController::class, 'getUnreadCount'])->name('notifications.count');
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead'])->name('notifications.markAsRead');
    Route::post('/notifications/task/{taskId}/mark-read', [NotificationController::class, 'markTaskAssignmentReadByTask'])->name('notifications.task.markRead');
    Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead'])->name('notifications.markAllAsRead');
    Route::post('/notifications/mark-project-read', [NotificationController::class, 'markProjectNotificationsRead'])->name('notifications.markProjectRead');
    Route::delete('/notifications/{id}', [NotificationController::class, 'deleteNotification'])->name('notifications.delete');

    Route::get('/attendance', [AttendanceController::class, 'showAttendancePage'])->name('attendance');
    Route::get('/attendance/get-attendance-employee-by-month', [AttendanceController::class, 'getAttendanceEmployeeByMonth'])->name('attendance.getAttendanceEmployeeByMonth');
    Route::get('/attendance/get-attendance-summary-by-month', [AttendanceController::class, 'getAttendanceSummaryByMonth']);
    Route::get('/attendance/get-attendance-today', [AttendanceController::class, 'getAttendanceToday'])->name('attendance.getDailyAttendance');

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


    Route::get('/calendar', [EmployeeCalendarController::class, 'showCalendarPage'])->name('calendar');
    Route::get('/calendar/all-event-employee-calendar-by-month', [EmployeeCalendarController::class, 'allEventEmployeeCalendarByMonth'])->name('calendar.allEventEmployeeCalendarByMonth');
    Route::get('/calendar/event-employee-detail', [EmployeeCalendarController::class, 'eventEmployeeDetail'])->name('calendar.eventEmployeeDetail');
    Route::post('/calendar/new-employee-event', [EmployeeCalendarController::class, 'newEmployeeEvent'])->name('calendar.newEmployeeEvent');
    Route::post('/calendar/edit-employee-event', [EmployeeCalendarController::class, 'editEmployeeEvent'])->name('calendar.editEmployeeEvent');
    Route::post('/calendar/delete-employee-event', [EmployeeCalendarController::class, 'deleteEmployeeEvent'])->name('calendar.deleteEmployeeEvent');
});




Route::middleware('auth', 'management')->group(function () {
    
    Route::get('/calendar_management', [EmployeeCalendarController::class, 'showCalendarPage'])->name('calendar_management');
    
    Route::get('/master', function () {
        if (Auth::user()->user_type !== 'SUPERADMIN') {
            return redirect('/');
        }
        return view('master.master');
    })->name('master');

    Route::get('/salary_payslip', [SalaryPayslipController::class, 'showSalaryPayslipPage'])->name('salary_payslip');
    Route::get('/salary_payslip/employee-salary-data', [SalaryPayslipController::class, 'getEmployeeSalaryData'])->name('salary_payslip.getEmployeeSalaryData');
    Route::get('/salary_payslip/employee-salary-detail', [SalaryPayslipController::class, 'getEmployeeSalaryDetail'])->name('salary_payslip.getEmployeeSalaryDetail');
    Route::get('/salary_payslip/view_payslip/{employeeId}/{year}/{month}', [SalaryPayslipController::class, 'viewPDFPayslip'])->name('salary_payslip.viewPayslip');
    Route::get('/salary_payslip/download_pdf_payslip/{employeeId}/{year}/{month}', [SalaryPayslipController::class, 'downloadPDFPayslip'])->name('salary_payslip.downloadPDFPayslip');
    
    Route::post('/salary_payslip/save-employee-salary-by-year-month', [SalaryPayslipController::class, 'saveEmployeeSalaryByYearMonth'])->name('salary_payslip.saveEmployeeSalaryByYearMonth');
    Route::post('/salary_payslip/send-employee-payslip-by-year-month', [SalaryPayslipController::class, 'sendEmployeePayslipByYearMonth'])->name('salary_payslip.sendEmployeePayslipByYearMonth');
    Route::post('/salary_payslip/recall-employee-payslip-by-year-month', [SalaryPayslipController::class, 'recallEmployeePayslipByYearMonth'])->name('salary_payslip.recallEmployeePayslipByYearMonth');

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


    Route::get('/department', [PartnerController::class, 'showPartnerPage'])->name('department');
    Route::get('/department/index', [PartnerController::class, 'index'])->name('department.index');
    Route::get('/department/options', [PartnerController::class, 'options'])->name('department.options');
    Route::get('/department/{id}', [PartnerController::class, 'show'])->name('department.show');
    Route::post('/department/store', [PartnerController::class, 'store'])->name('department.store');
    Route::put('/department/{id}', [PartnerController::class, 'update'])->name('department.update');
    Route::delete('/department/{id}', [PartnerController::class, 'destroy'])->name('department.destroy');

    Route::get('/partner', [PartnerController::class, 'showPartnerPage'])->name('partner');
    Route::get('/partner/index', [PartnerController::class, 'index'])->name('partner.index');
    Route::get('/partner/options', [PartnerController::class, 'options'])->name('partner.options');
    Route::get('/partner/{id}', [PartnerController::class, 'show'])->name('partner.show');
    Route::post('/partner/store', [PartnerController::class, 'store'])->name('partner.store');
    Route::put('/partner/{id}', [PartnerController::class, 'update'])->name('partner.update');
    Route::delete('/partner/{id}', [PartnerController::class, 'destroy'])->name('partner.destroy');


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
    Route::get('/employee/export-employee-active', [EmployeeController::class, 'exportEmployeeActive'])->name('employee.exportEmployeeActive');
    Route::post('/employee/import', [EmployeeController::class, 'import'])->name('employee.import');
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
    Route::post('/attendance_tracking/edit-employee-attendance', [AttendanceTrackingController::class, 'editEmployeeAttendance'])->name('attendance_tracking.editEmployeeAttendance');

    Route::get('/settings', [SettingsController::class, 'showSettingsPage'])->name('settings');
    Route::get('/settings/get-all-User', [SettingsController::class, 'getAllUser'])->name('settings.getAllUser');
    Route::post('/settings/edit-user-role', [SettingsController::class, 'editUserRole'])->name('settings.editUserRole');

    Route::get('/leave', [LeaveController::class, 'showLeavePage'])->name('leave');
    Route::POST('/leave/edit-employee-leave-by-year', [LeaveController::class, 'editEmployeeLeaveByYear'])->name('leave.editEmployeeLeaveByYear');
    Route::get('/leave/employee-leave-by-year', [LeaveController::class, 'getEmployeeLeaveByYear'])->name('leave.getEmployeeLeaveByYear');
    Route::get('/leave/all-employee-leave-request', [LeaveController::class, 'allEmployeeLeaveRequest'])->name('leave.allEmployeeLeaveRequest');

    Route::post('/leave/approve-employee-leave-request', [LeaveController::class, 'approveEmployeeLeaveRequest'])->name('leave.approveEmployeeLeaveRequest');
    Route::post('/leave/reject-employee-leave-request', [LeaveController::class, 'rejectEmployeeLeaveRequest'])->name('leave.rejectEmployeeLeaveRequest');

    Route::get('/overtime', [OvertimeController::class, 'showOvertimePage'])->name('overtime');
    Route::get('/overtime/employee-overtime-request', [OvertimeController::class, 'employeeOvertimeRequest'])->name('overtime.employeeOvertimeRequest');

    Route::post('/overtime/approve-employee-overtime-request', [OvertimeController::class, 'approveEmployeeOvertimeRequest'])->name('overtime.approveEmployeeOvertimeRequest');
    Route::post('/overtime/reject-employee-overtime-request', [OvertimeController::class, 'rejectEmployeeOvertimeRequest'])->name('overtime.rejectEmployeeOvertimeRequest');

    Route::get('/weekdays_off', [WeekdayOffController::class, 'showWeekdayOffPage'])->name('weekday_off');
    Route::post('/weekday_off/save-employee-weekday-off', [WeekdayOffController::class, 'saveEmployeeWeekdayoff'])->name('weekday_off.saveEmployeeWeekdayoff');

    Route::get('/recruitment', [RecruitmentController::class, 'showRecruitmentPage'])->name('recruitment');
    Route::get('/recruitment/data', [RecruitmentController::class, 'getRecruitmentData'])->name('recruitment.data');
    Route::get('/recruitment/jobs', [RecruitmentController::class, 'jobOptions'])->name('recruitment.jobs');
    Route::get('/recruitment/schedule-calendar', [RecruitmentController::class, 'scheduleCalendar'])->name('recruitment.scheduleCalendar');
 
    Route::get('/candidates', [RecruitmentController::class, 'candidateIndex'])->name('candidates.index');
    Route::post('/candidates', [RecruitmentController::class, 'candidateStore'])->name('candidates.store');
    Route::get('/candidates/{candidate}', [RecruitmentController::class, 'candidateShow'])->name('candidates.show');
    Route::put('/candidates/{candidate}', [RecruitmentController::class, 'candidateUpdate'])->name('candidates.update');
    Route::delete('/candidates/{candidate}', [RecruitmentController::class, 'candidateDestroy'])->name('candidates.destroy');
 
    Route::get('/schedules', [RecruitmentController::class, 'scheduleIndex'])->name('schedules.index');
    Route::post('/schedules', [RecruitmentController::class, 'scheduleStore'])->name('schedules.store');
    Route::get('/schedules/{schedule}', [RecruitmentController::class, 'scheduleShow'])->name('schedules.show');
    Route::put('/schedules/{schedule}', [RecruitmentController::class, 'scheduleUpdate'])->name('schedules.update');
    Route::delete('/schedules/{schedule}', [RecruitmentController::class, 'scheduleDestroy'])->name('schedules.destroy');

    Route::get('/recruitment/export', [RecruitmentController::class, 'exportRecruitment'])
    ->name('recruitment.export');

    Route::get('/monitoring', [MonitoringController::class, 'showMonitoringPage'])->name('monitoring');
    Route::get('/monitoring/data', [MonitoringController::class, 'getMonitoringData'])->name('monitoring.data');

    Route::get('/hr-info/count-employee-request', [HRInfoController::class, 'countEmployeeRequest'])->name('hr_info.countEmployeeRequest');
});