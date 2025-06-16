<?php

use Illuminate\Support\Facades\Route;

Route::get('/master', function () {
    return view('master');
})->name('master');

Route::get('/detail-department', function () {
    return view('detail-department');
})->name('detail-department');

Route::get('/', function () {
    return view('welcome');
});

Route::get('/login', function () {
    return view('auth.login');
});

Route::get('/dashboard', function () {
    return view('dashboard');
});
