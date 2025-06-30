<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DivisionController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\JobController;
use App\Http\Controllers\EmployeeController;

Route::get('/master', function () {
    return view('master/master');
})->name('master');


Route::get('/department', function () {
    return view('/master/department/department');
})->name('department');

// Department CRUD routes
Route::get('/departments', [DepartmentController::class, 'index'])->name('departments.index');
Route::get('/departments/{id}', [DepartmentController::class, 'show'])->name('departments.show');
Route::post('/departments', [DepartmentController::class, 'store'])->name('departments.store');
Route::put('/departments/{id}', [DepartmentController::class, 'update'])->name('departments.update');
Route::delete('/departments/{id}', [DepartmentController::class, 'destroy'])->name('departments.destroy');

Route::get('/division', function () {
    return view('/master/division/division');
})->name('division');

// Division CRUD routes
Route::get('/divisions', [DivisionController::class, 'index'])->name('divisions.index');
Route::get('/divisions/{id}', [DivisionController::class, 'show'])->name('divisions.show');
Route::post('/divisions', [DivisionController::class, 'store'])->name('divisions.store');
Route::put('/divisions/{id}', [DivisionController::class, 'update'])->name('divisions.update');
Route::delete('/divisions/{id}', [DivisionController::class, 'destroy'])->name('divisions.destroy');

Route::get('/job-page', function () {
    return view('/master/job/job');
})->name('job.page');

Route::get('/jobs', [JobController::class, 'index'])->name('jobs.index');
Route::get('/jobs/{id}', [JobController::class, 'show'])->name('jobs.show');
Route::post('/jobs', [JobController::class, 'store'])->name('jobs.store');
Route::put('/jobs/{id}', [JobController::class, 'update'])->name('jobs.update');
Route::delete('/jobs/{id}', [JobController::class, 'destroy'])->name('jobs.destroy');

Route::get('/employee-page', function () {
    return view('/employee/employee');
})->name('employee.page');

Route::get('/employees', [EmployeeController::class, 'index'])->name('employees.index');
Route::get('/employees/create', [EmployeeController::class, 'create'])->name('employees.create');
Route::get('/employees/{id}/edit', [EmployeeController::class, 'edit'])->name('employees.edit');
Route::get('/employees/{id}', [EmployeeController::class, 'show'])->name('employees.show');
Route::post('/employees', [EmployeeController::class, 'store'])->name('employees.store');
Route::put('/employees/{id}', [EmployeeController::class, 'update'])->name('employees.update');
Route::delete('/employees/{id}', [EmployeeController::class, 'destroy'])->name('employees.destroy');



Route::get('/', function () {
    return view('welcome');
});

Route::get('/login', function () {
    return view('auth.login');
});

Route::get('/dashboard', function () {
    return view('dashboard');
});
