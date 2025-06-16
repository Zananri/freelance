<?php

use Illuminate\Support\Facades\Route;

Route::get('/master', function () {
    return view('master/master');
})->name('master');

use App\Http\Controllers\DepartmentController;

Route::get('/department', function () {
    return view('/master/department/department');
})->name('department');

// Department CRUD routes
Route::get('/departments', [DepartmentController::class, 'index'])->name('departments.index');
Route::get('/departments/{id}', [DepartmentController::class, 'show'])->name('departments.show');
Route::post('/departments', [DepartmentController::class, 'store'])->name('departments.store');
Route::put('/departments/{id}', [DepartmentController::class, 'update'])->name('departments.update');
Route::delete('/departments/{id}', [DepartmentController::class, 'destroy'])->name('departments.destroy');

// Route::get('/department', function () {
//     return view('/department/detail-department');
// })->name('detail-department');

Route::get('/', function () {
    return view('welcome');
});

Route::get('/login', function () {
    return view('auth.login');
});

Route::get('/dashboard', function () {
    return view('dashboard');
});
