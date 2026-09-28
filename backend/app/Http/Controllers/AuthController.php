<?php

namespace App\Http\Controllers;

// Importamos el modelo User porque vamos a crear usuarios
// y también consultar usuarios existentes para login.
use App\Models\User;
// Importamos los Form Requests personalizados.
// Estos se encargan de validar los datos antes de entrar al método.
use App\Http\Requests\RegisterRequest;
use App\Http\Requests\LoginRequest;
// Request nos permite leer y validar los datos enviados por el cliente.
use Illuminate\Http\Request;
// Auth nos ayuda a intentar autenticar al usuario con email y password.
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;


class AuthController extends Controller
{
    /**
     * Registrar un nuevo usuario.
     *
     * Este método:
     * 1. Recibe los datos ya validados por RegisterRequest.
     * 2. Crea el usuario en la base de datos.
     * 3. Genera un token de acceso con Sanctum.
     * 4. Retorna el usuario y el token en formato JSON.
     */
    public function register(RegisterRequest $request)
    {

        // validated() devuelve únicamente los datos que pasaron la validación.
        $datosValidos = $request->validated();

        // Creamos el usuario en la base de datos.
        $user = User::create([
            // Guardamos el nombre validado.
            'name' => $datosValidos['name'],
            // Guardamos el email validado.
            'email' => $datosValidos['email'],
            // La contraseña se encripta antes de guardarse.
            'password' => $datosValidos['password'],
            // Guardamos el rol validado.
            'rol' => $datosValidos['rol'],
        ]);

        // Creamos un token para el nuevo usuario.
        // plainTextToken es el valor que el frontend deberá guardar.
        $token = $user->createToken('auth_token')->plainTextToken;

        // Retornamos una respuesta JSON con código 201 porque el recurso fue creado correctamente.
        return response()->json([
            'message' => 'Usuario registrado correctamente',
            'user' => $user,
            'token' => $token,
            'token_type' => 'Bearer'
        ], 201);
    }

/**
 * Iniciar sesión.
 *
 * Este método:
 * 1. Recibe un LoginRequest ya validado (email y password).
 * 2. Extrae el sAMAccountName a partir del email recibido.
 * 3. Intenta hacer bind contra LDAP (Active Directory) con ese usuario
 *    y la contraseña enviada. Si el bind falla, las credenciales son incorrectas.
 * 4. Si el bind es exitoso, consulta el directorio para obtener el correo
 *    real y el nombre completo del usuario desde LDAP.
 * 5. Busca el usuario en la base local por ese correo; si no existe,
 *    lo crea con rol por defecto (el rol se administra localmente, no en LDAP).
 * 6. Genera un token Sanctum para el usuario y lo retorna junto con sus datos.
 * 7. Si algo falla en cualquier punto (bind, usuario no encontrado, sin correo),
 *    devuelve el código HTTP correspondiente (401 o 500).
 */
    public function login(LoginRequest $request)
    {
        //Obtenemos solo los datos basicos
        $datosValidos = $request->validated();

        // Armamos el usuario en formato CORP\usuario para el bind LDAP.
        // El campo 'email' del formulario en realidad se usa como sAMAccountName aquí.
        $samAccountName = $datosValidos['username'];
        $ldapUsername = 'CORP\\' . $samAccountName;

        $connection = new \LdapRecord\Connection([
            'hosts' => [env('LDAP_HOST')],
            'port' => env('LDAP_PORT', 389),
            'base_dn' => env('LDAP_BASE_DN'),
            'username' => $ldapUsername,
            'password' => $datosValidos['password'],
        ]);

        try{

            $connection -> connect();
        }catch(\LdapRecord\Auth\BindException $e){
            return response() -> json ([
                'message' => 'Credenciales incorrectas'
            ],401);
        }

        // Si el bind fue exitoso, buscamos los datos reales del usuario en el directorio.
        $ldapUser = $connection -> query() -> where ('sAMAccountName', '=', $samAccountName) -> first();

        if(!$ldapUser){
            return response() -> json ([
                'message' => 'Usuario no encontrado en el directorio',
            ],401);
        }

        $correoldap = $ldapUser['mail'][0] ?? null;
        $nombreldap = $ldapUser['displayname'][0] ?? $samAccountName;

        if(!$correoldap){
            return response()->json([
                'message' => 'El usuario no tiene correo configurado en el directorio',
            ], 500);
        }

        // Buscamos si ya existe localmente, o lo creamos con rol por defecto.
        $user = User::firstOrCreate(
            ['email' => $correoldap],
            [
                'name' => $nombreldap,
                'password' => bcrypt(Str::random(32)), // no se usa para login, LDAP ya validó
                'rol' => 'viewer', // rol por defecto para usuarios nuevos vía LDAP
            ]
        );

        $token = $user -> createToken('auth_token') -> plainTextToken;

        return response()->json([
            'message' => 'Inicio de sesion correcto',
            'user' => $user,
            'token' => $token,
            'token_type' => 'Bearer',
        ]);
    }

    /**
     * Cerrar sesión.
     * Este método elimina únicamente el token actual,
     * es decir, el token con el que se hizo la petición.
     */
    public function logout(Request $request)
    {
        // Eliminamos el token actual del usuario autenticado.
        $request->user()->currentAccessToken()->delete();

        // Retornamos mensaje de confirmación.
        return response()->json([
            'message' => 'Sesión cerrada correctamente',
        ]);
    }

    /**
     * Obtener el usuario autenticado actual
     */
    public function me(Request $request)
    {
        return response()->json($request->user());
    }
}
