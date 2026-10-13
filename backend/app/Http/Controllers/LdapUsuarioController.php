<?php

namespace App\Http\Controllers;

use App\Services\LdapUserLookupService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LdapUsuarioController extends Controller
{
    /**
     * Busca un usuario del Directorio Activo por username.
     *
     * Solo un administrador puede usar esta función.
     */
    public function buscar(
        Request $request,
        LdapUserLookupService $ldap,
        string $username
    ): JsonResponse {
        // Verificamos que el usuario autenticado sea administrador.
        if ($request -> user()->rol !=='admin'){
            return response()->json([
                'message' => 'No tienes permisos para buscar usuarios del Directorio Activo.',
            ], 403);
        }

        // Validamos el formato del username antes de consultar LDAP.
        $validacion = validator(
            ['username' => $username],
            ['username' => ['required', 'string', 'min:3', 'max:100', 'regex:/^[A-Za-z0-9._-]+$/']]
        );

        if ($validacion ->fails()){
            return response()->json([
                'message' => 'El username no tiene un formato válido.',
                'errors' => $validacion->errors(),
            ], 422);
        }

        // Consultamos el Directorio Activo.
        $usuario = $ldap->buscarUsuario ($username);

        // Si no existe o no tiene correo, no permitimos crearlo.
        if (! $usuario){
            return response()->json([
                'message' => 'No se encontró un usuario válido con ese username o no tiene correo en el Directorio Activo.',
            ], 404);
        }

        return response()->json([
            'message' => 'Usuario encontrado en el Directorio Activo.',
            'data' => $usuario,
        ]);

    }
}
