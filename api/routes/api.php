<?php

use App\Http\Controllers\Api\AccountController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\MenuController;
use App\Http\Controllers\Api\PageContentController;
use App\Http\Controllers\Api\Admin\DashboardController;
use App\Http\Controllers\Api\Admin\MenuCategoryController;
use App\Http\Controllers\Api\Admin\MenuItemController;
use App\Http\Controllers\Api\Admin\PageContentController as AdminPageContentController;
use App\Http\Controllers\Api\Admin\PurchaseController;
use App\Http\Controllers\Api\Admin\SettingController;
use App\Http\Controllers\Api\Admin\UserController;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

// ── Health check (used by load balancers, uptime monitors, deploy pipelines) ─
// Returns 200 + JSON when the app and database are reachable.
// Returns 503 if the database is down.
Route::get('/v1/health', function () {
    try {
        DB::connection()->getPdo();
        $dbOk = true;
    } catch (\Throwable) {
        $dbOk = false;
    }

    return response()->json([
        'status' => $dbOk ? 'ok' : 'degraded',
        'db'     => $dbOk ? 'connected' : 'unreachable',
        'env'    => app()->environment(),
    ], $dbOk ? 200 : 503);
});

Route::prefix('v1')->group(function () {

    // ── Public Auth ────────────────────────────────────────────────────────
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login',    [AuthController::class, 'login']);

    // ── Public Menu (QR code target) ───────────────────────────────────────
    Route::prefix('menu')->group(function () {
        Route::get('/categories',   [MenuController::class, 'categories']);
        Route::get('/items',        [MenuController::class, 'items']);
        Route::get('/items/{item}', [MenuController::class, 'show']);
        Route::get('/featured',     [MenuController::class, 'featured']);
    });

    // ── Public Page Content ────────────────────────────────────────────────
    Route::get('/page-contents/{page}', [PageContentController::class, 'show']);

    // ── Authenticated ──────────────────────────────────────────────────────
    Route::middleware('auth:sanctum')->group(function () {

        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me',      [AuthController::class, 'me']);
        Route::put('/auth/me',      [AuthController::class, 'updateProfile']);

        Route::prefix('account')->group(function () {
            Route::get('/dashboard',       [AccountController::class, 'dashboard']);
            Route::get('/purchases',       [AccountController::class, 'purchases']);
            Route::get('/rewards/balance', [AccountController::class, 'rewardsBalance']);
            Route::get('/rewards/history', [AccountController::class, 'rewardsHistory']);
            Route::post('/rewards/redeem', [AccountController::class, 'redeem']);
        });

        // ── Admin ──────────────────────────────────────────────────────────
        Route::middleware('admin')->prefix('admin')->group(function () {

            Route::get('/dashboard', [DashboardController::class, 'index']);

            Route::apiResource('/users', UserController::class)->only(['index', 'show', 'update']);
            Route::post('/users/{user}/adjust-stamps',  [UserController::class, 'adjustStamps']);
            Route::post('/users/{user}/redeem-reward',   [UserController::class, 'redeemReward']);

            Route::prefix('menu')->group(function () {
                Route::apiResource('/categories', MenuCategoryController::class);
                Route::apiResource('/items',      MenuItemController::class);
                Route::post('/items/{menuItem}/image', [MenuItemController::class, 'uploadImage']);
            });

            Route::get   ('/purchases',                   [PurchaseController::class, 'index']);
            Route::post  ('/purchases',                   [PurchaseController::class, 'store']);
            Route::get   ('/purchases/{purchase}',        [PurchaseController::class, 'show']);
            Route::patch ('/purchases/{purchase}/void',   [PurchaseController::class, 'void']);

            Route::get('/settings',       [SettingController::class, 'index']);
            Route::put('/settings/{key}', [SettingController::class, 'update']);

            Route::prefix('page-contents')->group(function () {
                Route::get   ('/{page}',                    [AdminPageContentController::class, 'show']);
                Route::put   ('/{page}',                    [AdminPageContentController::class, 'update']);
                Route::post  ('/{page}/image',              [AdminPageContentController::class, 'uploadImage']);
                Route::delete('/{page}/image',              [AdminPageContentController::class, 'removeImage']);
                Route::post  ('/{page}/images/{imageKey}',  [AdminPageContentController::class, 'uploadImageByKey']);
                Route::delete('/{page}/images/{imageKey}',  [AdminPageContentController::class, 'removeImageByKey']);
            });
        });
    });
});
