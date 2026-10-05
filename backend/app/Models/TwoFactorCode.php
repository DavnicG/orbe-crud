<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TwoFactorCode extends Model
{
    use HasFactory;

    /**
     * Campos permitidos para asignación masiva.
     */
    protected $fillable = [
// Usuario propietario del código.
    'user_id',

    // Hash del código de seis dígitos.
    'code',

    // Token temporal que identifica el desafío en React.
    'challenge_token',

    // Número de intentos de verificación fallidos.
    'attempts',

    // Fecha/hora en que el código fue utilizado.
    'used_at',

    // Fecha/hora en que vence el código.
    'expires_at',

    // IP desde donde se solicitó el código.
    'ip_address',

    // Navegador o cliente que solicitó el código.
    'user_agent',
    ];

    /**
     * Convierte automáticamente estas columnas al tipo Carbon.
     */
    protected function cast(): array{
        return[
            'used_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    /**
     * Código temporal pertenece a un usuario.
     */
    public function user(): BelongsTo{
        return $this -> belongsTo(User::class);
    }

    /**
     * Filtra códigos que no han sido usados y todavía no vencen.
     */
    public function scopeVigente(Builder $query): Builder{
        return $query
            ->whereNull('used_at')
            ->where('expires_at', '>', now());
    }

    /**
     * Indica si el código venció.
     */
    public function estaVencido(): bool
    {
        return $this->expires_at->isPast();
    }

    /**
     * Indica si el código ya se usó.
     */
    public function fueUsado(): bool
    {
        return $this->used_at !== null;
    }
}
