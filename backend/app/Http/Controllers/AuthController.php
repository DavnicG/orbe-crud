<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use LdapRecord\Auth\BindException;
use LdapRecord\Connection;
use LdapRecord\LdapRecordException;
use App\Http\Requests\VerifyTwoFactorRequest;
use App\Http\Requests\ResendTwoFactorRequest;
use App\Services\TwoFactorService;

class AuthController extends Controller
{
    /**
     * Iniciar sesión.
     *
     * 1. Si el username pertenece a un usuario LOCAL, validamos con Hash::check.
     * 2. En cualquier otro caso, validamos contra LDAP (Active Directory).
     * 3. En ambos casos se bloquea a los usuarios inactivos antes de crear el token.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $datosValidos = $request->validated();
        $username = $datosValidos['username'];

        // ===== Camino 1: usuario local =====
        $usuarioLocal = User::where('username', $username)
            ->where('tipo_autenticacion', 'local')
            ->first();

        if ($usuarioLocal) {
            if (! Hash::check($datosValidos['password'], $usuarioLocal->password)) {
                return response()->json([
                    'message' => 'Credenciales incorrectas',
                ], 401);
            }

            // Rechazamos usuarios inactivos antes de crear un código o enviar correo.
            if (! $usuarioLocal->activo) {
                return response()->json([
                    'message' => 'Tu usuario está desactivado. Contacta al administrador.',
                ], 403);
            }

            // Generamos el desafío y enviamos el código al correo del usuario.
            $codigoDosFactores = app(TwoFactorService::class)->generarCodigo(
                $usuarioLocal,
                $request->ip(),
                $request->userAgent()
            );

            // Todavía NO se entrega token Sanctum.
            return response()->json([
                'message' => 'Te enviamos un código de verificación a tu correo electrónico.',
                'requires_two_factor' => true,
                'challenge_token' => $codigoDosFactores->challenge_token,
            ], 202);
        }

        // ===== Camino 2: usuario LDAP =====
        $connection = new Connection([
            'hosts'    => [config('services.ldap.host')],
            'port'     => config('services.ldap.port', 389),
            'base_dn'  => config('services.ldap.base_dn'),
            'username' => 'CORP\\' . $username,
            'password' => $datosValidos['password'],
        ]);

        try {
            $connection->connect();
        } catch (BindException $e) {
            // Credenciales rechazadas por el Directorio Activo.
            return response()->json(['message' => 'Credenciales incorrectas'], 401);
        } catch (LdapRecordException $e) {
            // Servidor caído o inaccesible: no es culpa de las credenciales.
            report($e);
            return response()->json([
                'message' => 'No se pudo conectar con el servicio de autenticación. Intenta más tarde.',
            ], 503);
        }

        $ldapUser = $connection->query()->where('sAMAccountName', '=', $username)->first();

        if (! $ldapUser) {
            return response()->json(['message' => 'Usuario no encontrado en el directorio'], 401);
        }

        $correoLdap = $ldapUser['mail'][0] ?? null;
        $nombreLdap = $ldapUser['displayname'][0] ?? $username;

        if (! $correoLdap) {
            return response()->json([
                'message' => 'El usuario no tiene correo configurado en el directorio',
            ], 422);
        }

        // Buscamos primero por username; si no, por correo SOLO entre usuarios LDAP
        // (cubre usuarios antiguos creados antes de existir el campo username).
        $usuario = User::where('username', $username)->first()
            ?? User::where('email', $correoLdap)
                ->where('tipo_autenticacion', 'ldap')
                ->first();

        if (! $usuario) {
            // Evita que un correo de AD se asocie a una cuenta local existente.
            if (User::where('email', $correoLdap)->exists()) {
                return response()->json([
                    'message' => 'El correo de tu cuenta ya está asociado a otro usuario. Contacta al administrador.',
                ], 409);
            }

            $usuario = User::create([
                'name'               => $nombreLdap,
                'username'           => $username,
                'email'              => $correoLdap,
                'password'           => Str::random(32), // no se usa; LDAP valida
                'tipo_autenticacion' => 'ldap',          // explícito, sin depender del default
                'rol'                => 'viewer',        // rol por defecto, se administra localmente
                'activo'             => true,
            ]);
        } else {
            // Completamos datos de usuarios LDAP antiguos y mantenemos el nombre sincronizado.
            $usuario->forceFill([
                'username'           => $usuario->username ?? $username,
                'tipo_autenticacion' => 'ldap',
                'name'               => $nombreLdap,
            ])->save();
        }

        return $this->responderConToken($usuario);
    }

    /**
     * Verifica que el usuario esté activo y genera el token Sanctum.
     */
    private function responderConToken(User $usuario): JsonResponse
    {
        if (! $usuario->activo) {
            return response()->json([
                'message' => 'Tu usuario está desactivado. Contacta al administrador.',
            ], 403);
        }

        $token = $usuario->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message'    => 'Inicio de sesión correcto',
            'user'       => $usuario,
            'token'      => $token,
            'token_type' => 'Bearer',
        ]);
    }

    /**
     * Verifica un código 2FA de un usuario local.
     *
     * Solo después de una verificación exitosa se crea el token Sanctum.
     */
    public function verifyTwoFactor(
        VerifyTwoFactorRequest $request,
        TwoFactorService $twoFactorService
    ): JsonResponse {
        $datosValidados = $request->validated();

        $usuario = $twoFactorService->verificarCodigo(
            $datosValidados['challenge_token'],
            $datosValidados['code']
        );

        // No revelamos si falló por token inválido, vencido, usado o código erróneo.
        if (! $usuario) {
            return response()->json([
                'message' => 'El código de verificación no es válido, ya fue usado o venció.',
            ], 422);
        }

        // Protección adicional: el 2FA solo debe emitir tokens a usuarios locales activos.
        if (
            $usuario->tipo_autenticacion !== 'local'
            || ! $usuario->activo
        ) {
            return response()->json([
                'message' => 'No fue posible completar la verificación de acceso.',
            ], 403);
        }

        $token = $usuario->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Inicio de sesión verificado correctamente.',
            'user' => $usuario,
            'token' => $token,
            'token_type' => 'Bearer',
        ]);
    }

    /**
     * Genera un código nuevo para un desafío 2FA aún vigente.
     */
    public function resendTwoFactor(
        ResendTwoFactorRequest $request,
        TwoFactorService $twoFactorService
    ): JsonResponse {
        $datosValidados = $request->validated();

        $nuevoCodigo = $twoFactorService->reenviarCodigo(
            $datosValidados['challenge_token'],
            $request->ip(),
            $request->userAgent()
        );

        // No revelamos detalles internos del desafío.
        if (! $nuevoCodigo) {
            return response()->json([
                'message' => 'No se pudo reenviar el código. Inicia sesión nuevamente.',
            ], 422);
        }

        return response()->json([
            'message' => 'Te enviamos un nuevo código de verificación a tu correo.',
            'challenge_token' => $nuevoCodigo->challenge_token,
        ]);
    }
    /** Cerrar sesión: elimina solo el token actual. */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Sesión cerrada correctamente']);
    }

    /** Obtener el usuario autenticado actual. */
    public function me(Request $request): JsonResponse
    {
        return response()->json($request->user());
    }
}
