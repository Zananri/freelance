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
use App\Http\Controllers\TaskController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Employee;

Route::get('/master', function () {
    return view('master/master');
})->name('master');


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

Route::get('/user', [UserController::class, 'showUserPage'])->name('user');
Route::get('/user/index', [UserController::class, 'index'])->name('user.index');
Route::get('/user/create', [UserController::class, 'create'])->name('user.create');
// Route::get('/user/{id}/edit', [UserController::class, 'edit'])->name('user.edit');
Route::get('/user/{id}', [UserController::class, 'show'])->name('user.show');
Route::post('/user/store', [UserController::class, 'store'])->name('user.store');
Route::put('/user/{id}', [UserController::class, 'update'])->name('user.update');
Route::delete('/user/{id}', [UserController::class, 'destroy'])->name('user.destroy');
Route::get('/user/ajax/data', [UserController::class, 'getUsersAjax'])->name('user.ajax.data');

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
Route::get('/project/create', [ProjectController::class, 'create'])->name('project.create');
Route::get('/project/{id}/edit', [ProjectController::class, 'edit'])->name('project.edit');
Route::get('/project/{id}', [ProjectController::class, 'show'])->name('project.show');
Route::post('/project/store', [ProjectController::class, 'store'])->name('project.store');
Route::post('/project-feedbacks', [ProjectController::class, 'storeFeedback'])->name('project-feedbacks.store');
Route::get('/project-feedbacks/{projectId}', [ProjectController::class, 'getProjectFeedbacks'])->name('project-feedbacks.get');
Route::put('/project/{id}', [ProjectController::class, 'update'])->name('project.update');
Route::delete('/project/{id}', [ProjectController::class, 'destroy'])->name('project.destroy');

Route::get('/project/index/card-data', [ProjectController::class, 'getCardData'])->name('project.cardData');

Route::get('/project-assignments', [ProjectController::class, 'getProjectAssignments'])->name('project.assignments');

Route::get('/task', [TaskController::class, 'showTaskPage'])->name('task');
Route::get('/task/index', [TaskController::class, 'index'])->name('task.index');
Route::get('/task/create', [TaskController::class, 'create'])->name('task.create');
Route::get('/task/employees-for-executor', [TaskController::class, 'getEmployeesForTaskExecutor'])->name('task.employees-for-executor');
Route::get('/task/{id}/edit', [TaskController::class, 'edit'])->name('task.edit');
Route::get('/task/{id}', [TaskController::class, 'show'])->name('task.show');
Route::post('/task/store', [TaskController::class, 'store'])->name('task.store');
Route::put('/task/{id}', [TaskController::class, 'update'])->name('task.update');
Route::delete('/task/{id}', [TaskController::class, 'destroy'])->name('task.destroy');

 // Task Feedback routes
 Route::post('/task-feedbacks', [TaskController::class, 'storeFeedback'])->name('task-feedbacks.store');
 Route::get('/task-feedbacks/{taskId}', [TaskController::class, 'getTaskFeedbacks'])->name('task-feedbacks.get');
 Route::get('/task-feedbacks/count/{taskId}', [TaskController::class, 'getTaskFeedbackCount'])->name('task-feedbacks.count');

// Task status update routes
Route::put('/task/{id}/status', [TaskController::class, 'updateStatus'])->name('task.update-status');


Route::get('/', function () {
    return view('welcome');
});

Route::get('/login', function () {
    return view('auth.login');
});

Route::post('/login', [UserController::class, 'login'])->name('login');
Route::post('/logout', [UserController::class, 'logout'])->name('logout');

Route::post('/user/{id}/reset-password', [UserController::class, 'resetPassword'])->name('user.resetPassword')->middleware('auth');

Route::get('/dashboard', [UserController::class, 'dashboard'])->name('dashboard');
