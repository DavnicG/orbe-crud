<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProductoController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UsuarioController;
use App\Http\Controllers\LdapUsuarioController;

// ===== RUTAS PÚBLICAS =====
// Estas no requieren token.

// Permite iniciar sesión y obtener un token. MAX 5 INTENTOS
// Login: máximo 5 intentos por minuto desde la misma IP.
Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:5,1');
// Verificar código: máximo 5 intentos por minuto por IP.
Route::post('/two-factor/verify', [AuthController::class, 'verifyTwoFactor'])
    ->middleware('throttle:5,1');
// Reenviar código: máximo 3 solicitudes por minuto por IP.
Route::post('/two-factor/resend', [AuthController::class, 'resendTwoFactor'])
    ->middleware('throttle:3,1');

// ===== RUTAS PROTEGIDAS =====
// Estas rutas requieren un token Sanctum válido.
Route::middleware('auth:sanctum', 'active.user')->group(function () {

    // Cerrar la sesión actual.
    Route::post('/logout', [AuthController::class, 'logout']);
    // Obtener los datos del usuario autenticado.
    Route::get('/me', [AuthController::class, 'me']);
    // CRUD de productos.
    Route::apiResource('productos', ProductoController::class);
    // Administración de usuarios.
    Route::apiResource('usuarios', UsuarioController::class);
    //Buscar un usuario para creacion
    Route::get('/usuarios/ldap/{username}', [LdapUsuarioController::class, 'buscar'])
    ->middleware('throttle:10,1');
});
