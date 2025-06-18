<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DivisionController;
use App\Http\Controllers\DepartmentController;

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



Route::get('/', function () {
    return view('welcome');
});

Route::get('/login', function () {
    return view('auth.login');
});

Route::get('/dashboard', function () {
    return view('dashboard');
});
