<?php

use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\StorefrontController;
use App\Http\Controllers\UserManagementController;
use Illuminate\Support\Facades\Route;

Route::get('/', [StorefrontController::class, 'index'])->name('storefront');

Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified', 'permission:dashboard.view'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::post('/checkout', [CheckoutController::class, 'store'])->name('checkout.store');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('/products', [ProductController::class, 'index'])->middleware('permission:products.view')->name('products.index');
    Route::post('/products', [ProductController::class, 'store'])->middleware('permission:products.create')->name('products.store');
    Route::patch('/products/{product}', [ProductController::class, 'update'])->middleware('permission:products.update')->name('products.update');
    Route::delete('/products/{product}', [ProductController::class, 'destroy'])->middleware('permission:products.delete')->name('products.destroy');

    Route::get('/inventory', [InventoryController::class, 'index'])->middleware('permission:inventory.view')->name('inventory.index');
    Route::post('/inventory/movements', [InventoryController::class, 'store'])->middleware('permission:inventory.adjust')->name('inventory.store');

    Route::get('/orders', [OrderController::class, 'index'])->middleware('permission:orders.view')->name('orders.index');
    Route::patch('/orders/{order}', [OrderController::class, 'update'])->middleware('permission:orders.update')->name('orders.update');

    Route::get('/users', [UserManagementController::class, 'index'])->middleware('permission:users.view')->name('users.index');
    Route::post('/users', [UserManagementController::class, 'store'])->middleware('permission:users.manage')->name('users.store');
    Route::patch('/users/{user}', [UserManagementController::class, 'update'])->middleware('permission:users.manage')->name('users.update');
});

require __DIR__.'/auth.php';
