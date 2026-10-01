<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProductoController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UsuarioController;

// ===== RUTAS PÚBLICAS =====
// Estas no requieren token.

// Permite registrar un nuevo usuario.
Route::post('/register', [AuthController::class, 'register']);
// Permite iniciar sesión y obtener un token.
Route::post('/login', [AuthController::class, 'login']);

// ===== RUTAS PROTEGIDAS =====
// Estas sí requieren un token válido enviado en Authorization: Bearer ...
Route::middleware('auth:sanctum')->group(function () {

    // Permite cerrar sesión eliminando el token actual.
    Route::post('/logout', [AuthController::class, 'logout']);
    //Obtiene los datos del usuario autenticado
    Route::get('/me', [AuthController::class, 'me']);

    //Protegemos todo el CRUD de productos
    Route::apiResource('productos', ProductoController::class);

    //Mantenimiento de usuario
    Route::apiResource('usuarios', UsuarioController::class);
});
