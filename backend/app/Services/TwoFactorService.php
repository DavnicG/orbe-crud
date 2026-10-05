<?php

namespace App\Services;

use App\Models\TwoFactorCode;
use App\Models\User;
use App\Notifications\TwoFactorCodeNotification;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class TwoFactorService{
    /**
     * Minutos durante los que un código permanece válido.
     */
    private const EXPIRACION_MINUTOS = 10;

    /**
     * Máximo de intentos permitidos por código.
     */
    private const MAXIMO_INTENTOS = 5;

    /**
     * Genera un código, invalida los anteriores y envía el correo.
     *
     * El código en texto plano se usa únicamente para notificar al usuario.
     * En la base de datos se almacena solamente Hash::make($codigo).
     *
     * @param User $usuario Usuario local que superó la validación de contraseña.
     * @param string|null $ip Direccion IP que solicitó el código.
     * @param string|null $userAgent User-Agent del navegador solicitante.
     */

    public function generarCodigo (
        User $usuario,
        ?string $ip = null,
        ?string $userAgent = null,
    ):TwoFactorCode{
        // Invalidamos cualquier código anterior aún pendiente de este usuario.
        // delete() es seguro porque estos códigos son temporales y de un solo uso.
        $usuario -> twoFactorCodes()
            ->whereNull('used_at')
            ->delete();

        // Generamos un entero aleatorio criptográficamente seguro de seis dígitos.
        $codigoPlano = (string) random_int(100000, 999999);

        // Creamos el token temporal que React enviará al verificar el código.
        // No concede acceso por sí solo; sirve para identificar el desafío.
        $challengeToken = str::random(64);

        // Creamos el registro con hash, expiración y metadatos de auditoría.
        $codigo = $usuario->twoFactorCodes()->create([
            'code'            => Hash::make($codigoPlano),
            'challenge_token' => $challengeToken,
            'attempts'        => 0,
            'expires_at'      => now()->addMinutes(self::EXPIRACION_MINUTOS),
            'ip_address'      => $ip,
            'user_agent'      => $userAgent,
        ]);

        // Enviamos el único lugar donde el código existe en texto plano.
        $usuario->notify(new TwoFactorCodeNotification($codigoPlano));

        return $codigo;
    }

    /**
     * Verifica un código usando el challenge_token asociado.
     *
     * @return User|null Retorna el usuario si el código es válido; null si falla.
     */
    public function verificarCodigo(
        string $challengeToken,
        string $codigoPlano,
    ): ?User{

        //Buscamos codigos no usados, vigentes y que coinicidan con el token temporal
        $codigo = TwoFactorCode::query()
            ->with('user')
            ->vigente()
            ->where('challenge_token', $challengeToken)
            ->latest('id')
            ->first();

        //Si no existe, vencio o ya se uso, no se autentica a nadie
        if( !$codigo ){
            return null;
        }

        //Si se acabaron los intetnos , invalidamos el codigo
        if($codigo -> attempts >= self::MAXIMO_INTENTOS){
            $codigo -> delete();

            return null;
        }

        //Si el codigo no coincide con su hash, sumamos un intento fallido
        if(! Hash::check($codigoPlano, $codigo->code)){
            $codigo -> increment ('attempts');

            return null;
        }

        //Marcamos el codigo como usado antes de devolver el usuario
        $codigo -> update(['used_at' => now()]);

        return $codigo -> user;
    }

    /**
     * Reenvia un codigo nuevo e invalida el anterior
     */
    public function reenviarCodigo(
        string $challengeToken,
        ?string $ip =null,
        ?string $userAgent = null
    ): ?TwoFactorCode{

        //Indentificamos un codigo pendiente a partir de su token temporal
        $codigo = TwoFactorCode:: query()
            ->with('user')
            ->vigente()
            ->where('challenge_token', $challengeToken)
            ->latest('id')
            ->first();

        // No reenviamos si no existe, vencio o ya fue usado
        if(!$codigo){
            return null;
        }

        //generarCodigo elimina el anterior pendiente y genera uno nuevo
        return $this ->generarCodigo($codigo->user, $ip, $userAgent);
    }

    /**
     * Indica si un codigo supero la cantidad maxima de intentos
     */

    public function alcanzoMaximoIntentos(TwoFactorCode $codigo): bool{
        return $codigo -> attempts >= self::MAXIMO_INTENTOS;
    }
}
