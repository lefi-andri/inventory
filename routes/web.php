<?php

use App\Http\Controllers\AdminChatController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\CustomerChatController;
use App\Http\Controllers\CustomerOrderController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HeroBannerController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\LocaleController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\PromotionController;
use App\Http\Controllers\SiteSettingController;
use App\Http\Controllers\PolicyController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\StorefrontController;
use App\Http\Controllers\UserManagementController;
use Illuminate\Support\Facades\Route;

Route::get('/', [StorefrontController::class, 'index'])->name('storefront');
Route::post('/locale', LocaleController::class)->name('locale.update');
Route::get('/privacy-policy', [PolicyController::class, 'privacy'])->name('privacy-policy');
Route::get('/cookie-policy', [PolicyController::class, 'cookie'])->name('cookie-policy');

Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified', 'permission:dashboard.view'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::post('/checkout', [CheckoutController::class, 'store'])->name('checkout.store');
    Route::post('/checkout/promotion', [CheckoutController::class, 'validatePromotion'])->name('checkout.promotion.validate');
    Route::get('/my-orders', [CustomerOrderController::class, 'index'])->name('customer.orders.index');
    Route::patch('/my-orders/{order}/received', [CustomerOrderController::class, 'confirmReceived'])->name('customer.orders.received');
    Route::get('/chat', [CustomerChatController::class, 'index'])->name('customer.chat.index');
    Route::get('/chat/messages', [CustomerChatController::class, 'messages'])->name('customer.chat.messages.index');
    Route::post('/chat/messages', [CustomerChatController::class, 'store'])->name('customer.chat.messages.store');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('/products', [ProductController::class, 'index'])->middleware('permission:products.view')->name('products.index');
    Route::post('/products', [ProductController::class, 'store'])->middleware('permission:products.create')->name('products.store');
    Route::patch('/products/{product}', [ProductController::class, 'update'])->middleware('permission:products.update')->name('products.update');
    Route::delete('/products/{product}', [ProductController::class, 'destroy'])->middleware('permission:products.delete')->name('products.destroy');
    Route::post('/products/{product}/media', [ProductController::class, 'storeMedia'])->middleware('permission:products.update')->name('products.media.store');
    Route::delete('/products/{product}/media/{media}', [ProductController::class, 'destroyMedia'])->middleware('permission:products.update')->name('products.media.destroy');
    Route::post('/products/{product}/media/{media}/primary', [ProductController::class, 'setPrimaryMedia'])->middleware('permission:products.update')->name('products.media.primary');

    Route::get('/inventory', [InventoryController::class, 'index'])->middleware('permission:inventory.view')->name('inventory.index');
    Route::post('/inventory/movements', [InventoryController::class, 'store'])->middleware('permission:inventory.adjust')->name('inventory.store');

    Route::get('/orders', [OrderController::class, 'index'])->middleware('permission:orders.view')->name('orders.index');
    Route::patch('/orders/{order}', [OrderController::class, 'update'])->middleware('permission:orders.update')->name('orders.update');

    Route::get('/users', [UserManagementController::class, 'index'])->middleware('permission:users.view')->name('users.index');
    Route::post('/users', [UserManagementController::class, 'store'])->middleware('permission:users.manage')->name('users.store');
    Route::patch('/users/{user}', [UserManagementController::class, 'update'])->middleware('permission:users.manage')->name('users.update');

    Route::middleware('role:admin')->prefix('admin')->name('admin.')->group(function () {
        Route::get('/site-settings', [SiteSettingController::class, 'edit'])->name('site-settings.edit');
        Route::patch('/site-settings', [SiteSettingController::class, 'update'])->name('site-settings.update');
        Route::get('/hero-banners', [HeroBannerController::class, 'index'])->name('hero-banners.index');
        Route::post('/hero-banners', [HeroBannerController::class, 'store'])->name('hero-banners.store');
        Route::patch('/hero-banners/{heroBanner}', [HeroBannerController::class, 'update'])->name('hero-banners.update');
        Route::delete('/hero-banners/{heroBanner}', [HeroBannerController::class, 'destroy'])->name('hero-banners.destroy');
        Route::get('/chats/{conversation?}', [AdminChatController::class, 'index'])->name('chats.index');
        Route::post('/chats', [AdminChatController::class, 'start'])->name('chats.store');
        Route::post('/chats/{conversation}/messages', [AdminChatController::class, 'store'])->name('chats.messages.store');
        Route::patch('/chats/{conversation}/status', [AdminChatController::class, 'updateStatus'])->name('chats.status.update');
        Route::get('/promotions', [PromotionController::class, 'index'])->name('promotions.index');
        Route::post('/promotions', [PromotionController::class, 'store'])->name('promotions.store');
        Route::patch('/promotions/{promotion}', [PromotionController::class, 'update'])->name('promotions.update');
        Route::delete('/promotions/{promotion}', [PromotionController::class, 'destroy'])->name('promotions.destroy');
        Route::patch('/shipping-settings', [PromotionController::class, 'updateShipping'])->name('shipping-settings.update');
        Route::patch('/payment-settings', [PromotionController::class, 'updatePayment'])->name('payment-settings.update');
    });
});

require __DIR__.'/auth.php';
