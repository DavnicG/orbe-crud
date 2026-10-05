<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProductoController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UsuarioController;
use Illuminate\Http\Request;

// ===== RUTAS PÚBLICAS =====
// Estas no requieren token.

// Permite iniciar sesión y obtener un token. MAX 5 INTENTOS
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
//Permite verificar codgio de acceso para usuarios locales
Route::post('/two-factor/verify', [AuthController::class, 'verifyTwoFactor']);
//Permite solicitar el reenvio del codigo de acceso para usuarios locales
Route::post('/two-factor/resend', [AuthController::class, 'resendTwoFactor']);

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
