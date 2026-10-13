<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Http\Requests\StoreUsuarioRequest;
use App\Http\Requests\UpdateUsuarioRequest;
use App\Http\Resources\UsuarioResource;
use Illuminate\Support\Facades\Hash;
use App\Services\LdapUserLookupService;

class UsuarioController extends Controller
{
    /**
     * Listar todos los usuarios(solo admin)
     */
    public function index(){
        $this ->authorize('viewAny', User::class);

        $usuarios = User::orderBy('id', 'desc') -> get();

        return UsuarioResource::collection($usuarios);
    }
    /**
     * Mostrar solo un usuario en especifico
     */
    public function show (User $usuario){
        $this -> authorize('view', $usuario);

        return new UsuarioResource($usuario);
    }
    /**
     * Crear un nuevo usuario
     */
    public function store(
        StoreUsuarioRequest $request,
        LdapUserLookupService $ldap
    ) {
        // La policy asegura que solamente un admin pueda crear usuarios.
        $this->authorize('create', User::class);

        // Solo contiene username, rol y activo.
        $datosValidados = $request->validated();

        // Consultamos el Directorio Activo desde el backend.
        $datosLdap = $ldap->buscarUsuario($datosValidados['username']);

        // El usuario debe existir en LDAP y tener correo para recibir el 2FA.
        if (! $datosLdap) {
            return response()->json([
                'message' => 'No se encontró un usuario válido con ese username o no tiene correo en el Directorio Activo.',
            ], 422);
        }

        // Incluimos usuarios con soft delete para poder restaurarlos
        // en lugar de crear registros duplicados.
        $usuarioExistente = User::withTrashed()
            ->where('username', $datosLdap['username'])
            ->first();

        // Si ya existe y no está eliminado, no permitimos duplicados.
        if ($usuarioExistente && ! $usuarioExistente->trashed()) {
            return response()->json([
                'message' => 'Este usuario ya está registrado en el aplicativo.',
                'errors' => [
                    'username' => ['El username LDAP ya está registrado.'],
                ],
            ], 422);
        }

        // Datos procedentes de fuentes confiables:
        // LDAP proporciona identidad; el administrador asigna rol y acceso.
        $datosUsuario = [
            'name' => $datosLdap['nombre'],
            'username' => $datosLdap['username'],
            'email' => $datosLdap['correo'],
            'rol' => $datosValidados['rol'],
            'activo' => $datosValidados['activo'],
            'tipo_autenticacion' => 'ldap',
        ];

        // Si existía pero fue eliminado, lo restauramos y actualizamos.
        if ($usuarioExistente) {
            $usuarioExistente->restore();
            $usuarioExistente->update($datosUsuario);

            return response()->json([
                'message' => 'Usuario restaurado y actualizado correctamente.',
                'data' => new UsuarioResource($usuarioExistente->fresh()),
            ], 200);
        }

        // Si nunca estuvo registrado, lo creamos como usuario LDAP.
        $usuario = User::create($datosUsuario);

        return response()->json([
            'message' => 'Usuario creado correctamente.',
            'data' => new UsuarioResource($usuario),
        ], 201);
    }

    /**
     * Campos que pertenecen al LDAP y no se pueden modificar
     */
    private const camposProtegidos = ['name', 'username','email', 'password'];
    /**
     * Actualizar(rol, actvio o contraseña si es local)
     */
    public function update(UpdateUsuarioRequest $request, User $usuario){

        // Solo los administradores pueden actualizar usuarios.
        $this -> authorize('update', $usuario);

        // La petición ya contiene solamente rol y/o activo.
        $datosValidados = $request -> validated();

        // Un admin no puede quitarse a sí mismo el rol de administrador.
        if (
            $request->user()->id === $usuario->id
            && isset($datosValidados['rol'])
            && $datosValidados['rol'] !== 'admin'
        ) {
            return response()->json([
                'message' => 'No puedes quitarte tu propio rol de administrador.',
            ], 422);
        }

        // Un admin no puede desactivar su propio acceso.
            if (
            $request->user()->id === $usuario->id
            && array_key_exists('activo', $datosValidados)
            && ! $datosValidados['activo']
        ) {
            return response()->json([
                'message' => 'No puedes desactivar tu propio acceso.',
            ], 422);
        }

        // Si se intenta quitar el rol admin o desactivar al último admin activo, el sistema debe impedirlo.
        $quitaAdmin = isset($datosValidados['rol'])
            && $usuario->rol === 'admin'
            && $datosValidados['rol'] !== 'admin';

        $desactivaAdmin = array_key_exists('activo', $datosValidados)
            && $usuario->rol === 'admin'
            && ! $datosValidados['activo'];

        if ($quitaAdmin || $desactivaAdmin) {
            $adminsActivos = User::where('rol', 'admin')
                ->where('activo', true)
                ->count();

            if ($adminsActivos <= 1) {
                return response()->json([
                    'message' => 'No puedes quitar el acceso ni el rol al último administrador activo.',
                ], 422);
            }
        }

        // Aplicamos los cambios permitidos.
        $usuario -> update($datosValidados);

        // Si se desactivó la cuenta, revocamos todos sus tokens actuales.
        if (array_key_exists('activo', $datosValidados) && ! $datosValidados['activo']) {
            $usuario->tokens()->delete();
        }
        $usuario -> refresh();

        return response() ->json([
            'message' => 'Usuario actualizado correctamente',
            'data' => new UsuarioResource($usuario),
        ]);
    }
    /**
     * Eliminar usuario
     */
    public function destroy(User $usuario){
        // La policy valida que sea admin y evita la autoeliminación.
        $this->authorize('delete', $usuario);
         // Si se intenta eliminar al último admin activo, bloqueamos la operación.
        if ($usuario->rol === 'admin' && $usuario->activo) {
            $adminsActivos = User::where('rol', 'admin')
                ->where('activo', true)
                ->count();

            if ($adminsActivos <= 1) {
                return response()->json([
                    'message' => 'No puedes eliminar al último administrador activo.',
                ], 422);
            }
        }

        // Cerramos todas las sesiones activas antes de eliminar el usuario.
        $usuario->tokens()->delete();

        // Soft delete: llena deleted_at, no borra físicamente la fila.
        $usuario->delete();

        return response()->json([
            'message' => 'Usuario eliminado correctamente del aplicativo.',
        ]);
    }
}
