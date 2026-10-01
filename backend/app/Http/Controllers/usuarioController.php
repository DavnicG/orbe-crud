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
            'message' => 'Uusario creado correctamente',
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

        //Si se envia una contraseña, la encriptamos
        if(isset($datosValidados['password'])){
            $datosValidados['password'] = Hash::make($datosValidados['password']);
        } else {
            //No se envia contraseña, mantenemos la existente
            unset($datosValidados['password']);
        }

        $usuario -> update($datosValidados);
        $usuario -> refresh();

        return response() ->json([
            'message' => 'Uusario actualizado correctamente',
            'data' => new UsuarioResource($usuario),
        ]);
    }
    /**
     * Eliminar usuario
     */
    public function destroy(User $usuario){
        $this ->authorize('delete', $usuario);

        $usuario-> delete();

        return response() ->json([
            'message' => 'Usario eliminado correctamente',
        ]);
    }
}
