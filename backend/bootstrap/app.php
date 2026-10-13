<?php

use App\Http\Middleware\EnsureUserIsActive;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Alias utilizado por las rutas protegidas.
        $middleware->alias([
            'active.user' => EnsureUserIsActive::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Convierte errores de autorización de rutas API a una respuesta JSON en español.
        $exceptions->render(function (
            \Illuminate\Auth\Access\AuthorizationException $exception,
            \Illuminate\Http\Request $request
        ) {
            // Solo modificamos respuestas que vayan a la API.
            if ($request->is('api/*')) {
                return response()->json([
                    'message' => 'No tienes permiso para realizar esta acción.',
                ], 403);
            }
        });
    })->create();
