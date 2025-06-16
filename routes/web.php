<?php

use Illuminate\Support\Facades\Route;

Route::get('/master', function () {
    return view('master/master');
})->name('master');

Route::get('/department', function () {
    return view('/master/department/department');
})->name('department');

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
