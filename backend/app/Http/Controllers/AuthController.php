<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Requests\VerifyTwoFactorRequest;
use App\Http\Requests\ResendTwoFactorRequest;
use App\Models\User;
use App\Models\TwoFactorCode;
use App\Services\TwoFactorService;
use App\Notifications\TwoFactorCodeNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use LdapRecord\Connection;
use LdapRecord\Auth\BindException;
use LdapRecord\LdapRecordException;

class AuthController extends Controller
{
    /**
     * Iniciar sesión con credenciales LDAP.
     *
     * Solo usuarios LDAP. No se crea automáticamente.
     * Si el usuario no existe en la BD, se responde 403.
     * Si el usuario existe pero está inactivo, se responde 403.
     * Si las credenciales son válidas, se envía 2FA.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $datosValidos = $request->validated();
        $username = $datosValidos['username'];

        // ===== Bind LDAP =====
        $connection = new Connection([
            'hosts' => [config('services.ldap.host')],
            'port' => config('services.ldap.port', 389),
            'base_dn' => config('services.ldap.base_dn'),
            'username' => 'CORP\\' . $username,
            'password' => $datosValidos['password'],
            'timeout' => 5, // Timeout de 5 segundos para evitar cuelgues
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

        // Consultamos los datos del usuario en el LDAP
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

        // ===== Verificar que el usuario exista en la BD =====
        // Buscamos por username (prioridad) o por correo entre usuarios LDAP
        $usuario = User::withTrashed()
            ->where('username', $username)
            ->first()
            ?? User::withTrashed()
                ->where('email', $correoLdap)
                ->where('tipo_autenticacion', 'ldap')
                ->first();

        // Si el usuario no existe en la BD, no tiene acceso al aplicativo
        if (! $usuario) {
            return response()->json([
                'message' => 'No tienes acceso al aplicativo. Contacta al administrador.',
            ], 403);
        }

        // Si el usuario fue eliminado (soft delete), no puede entrar
        if ($usuario->trashed()) {
            return response()->json([
                'message' => 'Tu usuario está eliminado. Contacta al administrador.',
            ], 403);
        }

        // ===== Verificar que el usuario esté activo =====
        if (! $usuario->activo) {
            return response()->json([
                'message' => 'Tu usuario está desactivado. Contacta al administrador.',
            ], 403);
        }

        // ===== Sincronizar datos del LDAP (nombre y correo) =====
        // Solo actualizamos si algo cambió, para no escribir en cada login
        $cambios = [];

        if ($usuario->name !== $nombreLdap) {
            $cambios['name'] = $nombreLdap;
        }

        if ($usuario->email !== $correoLdap) {
            $cambios['email'] = $correoLdap;
        }

        if (! empty($cambios)) {
            $usuario->forceFill($cambios)->save();
        }

        // ===== Generar 2FA =====
        // Se envía el código al correo sincronizado
        $codigoDosFactores = app(TwoFactorService::class)->generarCodigo(
            $usuario,
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
            'message' => 'Inicio de sesión correcto',
            'user' => $usuario,
            'token' => $token,
            'token_type' => 'Bearer',
        ]);
    }

    /**
     * Verifica un código 2FA.
     *
     * Solo después de una verificación exitosa se crea el token Sanctum.
     * Ahora acepta usuarios LDAP (se quitó la condición de local).
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

        // Protección adicional: el usuario debe estar activo
        if (! $usuario->activo) {
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
     *
     * Ahora verifica que el usuario siga activo antes de reenviar.
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

        // Verificamos que el usuario siga activo
        if (! $nuevoCodigo->user->activo) {
            return response()->json([
                'message' => 'Tu usuario está desactivado. Contacta al administrador.',
            ], 403);
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
