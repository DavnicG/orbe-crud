<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Nette\Schema\Message;
use Symfony\Component\HttpFoundation\Response;

use function Pest\Laravel\delete;

class EnsureUserIsActive
{
    /**
     * Procesa una solicitud entrante.
     */
    public function handle(Request $request, Closure $next): Response
    {
        //Obtenemos el usuario autenticado
        $usuario = $request->user();

        // Esta validación protege el middleware si se utiliza
        // accidentalmente en una ruta sin autenticación.
        if (! $usuario) {
            return response()->json([
                'message' => 'No estás autenticado.',
            ], 401);
        }

        //Rechazamos usuarios desactivados
        if( ! $usuario -> activo){
            //Revocamos todos los tokens para cerrar sus sesiones activas
            $usuario->tokens()->delete();

        return response()->json([
            'message' => 'Tu acceso está desactivado. Contacta al administrador.',
            // Código estable para que el frontend identifique este caso sin depender del texto del mensaje.
            'code' => 'USER_INACTIVE',
        ], 403);
        }

        // Si está activo, continúa con la petición.
        return $next($request);
    }
}
