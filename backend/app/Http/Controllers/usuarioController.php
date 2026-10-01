<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Http\Requests\StoreUsuarioRequest;
use App\Http\Requests\UpdateUsuarioRequest;
use App\Http\Resources\UsuarioResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Http\JsonResponse;

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
     * Crear un nuevo usuario manual(No LDAP)
     */
    Public function store(StoreUsuarioRequest $request){
        $this -> authorize('create', User::class);

        $datosValidados = $request -> validated();

    // Encriptamos la contraseña antes de guardarla en la base de datos.
    // Nunca guardamos contraseñas locales en texto plano.
    $datosValidados['password'] = Hash::make($datosValidados['password']);

    // Forzamos que los usuarios creados desde el panel administrativo
    // sean usuarios de autenticación local.
    $datosValidados['tipo_autenticacion'] = 'local';

    // Creamos el usuario con los datos validados y controlados por el backend.
    $usuario = User::create($datosValidados);

        return response() ->json([
            'message' => 'Usuario creado correctamente',
            'data' => new UsuarioResource($usuario),
        ],201);
    }
    /**
     * Campos que pertenecen al LDAP y no se pueden modificar
     */
    private const camposProtegidos = ['name', 'username','email', 'password'];
    /**
     * Actualizar(rol, actvio o contraseña si es local)
     */
    public function update(UpdateUsuarioRequest $request, User $usuario){

        $this -> authorize('update', $usuario);

        $datosValidados = $request -> validated();

        if($usuario->tipo_autenticacion === 'ldap'){
            $errores = [];

            foreach (self::camposProtegidos as $campo){
                if(! array_key_exists($campo, $datosValidados)){
                    continue;
                }

                //La contraseña no aplica a LDAP, el resto solo se rechaza si cambia
                $intentaCambiar = $campo === 'password'
                    ? filled($datosValidados[$campo])
                    : $datosValidados[$campo] !== $usuario -> {$campo};

                if($intentaCambiar){
                    $errores[$campo] = ['Este datos lo administra el Directorio Activo y no se puede modificar'];
                }
            }

            if (! empty($errores)){
                return response() ->json([
                    'message' => 'No se pueden modificar los datos de un usuario LDAP',
                    'errors' => $errores,
                ], 422);
            }

            //Solo se conservan los campos admnistrables desde la aplicacion
            $datosValidados = array_intersect_key($datosValidados, array_flip(['rol', 'activo']));
        }

        //Un admin no puede quitarse su propio acceso ni su rol.
        if($request -> user()->id === $usuario->id){
            if(($datosValidados['activo'] ?? true) === false
                || (isset($datosValidados['rol']) && $datosValidados['rol'] !== 'admin')){
                    return response() ->json([
                        'message' => 'No puedes quitarte tu propio acceso o rol de administrador',
                    ], 422);
                }
        }

        //Si se envia una contraseña(Solo local), la encriptamos, si no se conserva la actual
        if(! empty($datosValidados['password'])){
            $datosValidados['password'] = Hash::make($datosValidados['password']);
        } else {
            //No se envia contraseña, mantenemos la existente
            unset($datosValidados['password']);
        }

        $usuario -> update($datosValidados);

        // Si se desactivó el acceso, cerramos todas sus sesiones activas.
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
        //La policy rechaza LDAP y la auto-Eliminacion
        $this ->authorize('delete', $usuario);
        $usuario->tokens()->delete();
        $usuario-> delete();

        return response() ->json([
            'message' => 'Usuario eliminado correctamente',
        ]);
    }
}
