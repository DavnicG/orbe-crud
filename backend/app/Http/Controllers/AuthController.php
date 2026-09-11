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
     * 1. Recibe un LoginRequest ya validado.
     * 2. Intenta autenticar con Auth::attempt().
     * 3. Si las credenciales son correctas, genera token.
     * 4. Si no, devuelve error 401.
     */
    public function login(LoginRequest $request)
    {
        //Obtenemos solo los datos basicos
        $datosValidos = $request->validated();

        //Intentamos autenticar usando email y password
        if (!Auth::attempt($datosValidos)) {
            // Si las credenciales no son correctas, devolvemos respuesta no autorizada.
            return response()->json([
                'message' => 'Credenciales incorrectas',
            ], 401);
        }

        // Si el login fue exitoso, obtenemos el usuario autenticado.
        $user = Auth::user();

        // Verificamos que realmente sea una instancia del modelo User.
        // Esto además ayuda al editor a reconocer createToken().
        if (!$user instanceof User) {
            return response()->json([
                'message' => 'No se pudo obtener el usuario autenticado',
            ], 500);
        }

        // Generamos un nuevo token para esta sesión.
        $token = $user->createToken('auth_token')->plainTextToken;

        // Retornamos los datos del usuario y su token.
        return response()->json([
            'message' => 'Inicio de sesion correcto',
            'user' => $user,
            'token' => $token,
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
