<?php

namespace App\Models;

// Este trait permite usar factorías de Laravel para pruebas o seeders.
use Illuminate\Database\Eloquent\Factories\HasFactory;
// Esta es la clase base del usuario autenticable de Laravel.
// User hereda de aquí porque este modelo se usa para login/autenticación.
use Illuminate\Foundation\Auth\User as Authenticatable;
// Este trait permite enviar notificaciones al usuario.
use Illuminate\Notifications\Notifiable;
// Este trait Sanctum lo necesita para poder crear y administrar tokens de acceso.
use Laravel\Sanctum\HasApiTokens;
use App\Models\Producto;

class User extends Authenticatable
{
    /* Aquí agregamos los traits que tendrá el modelo.
    HasApiTokens: permite crear tokens tipo Bearer para la API.
    HasFactory: permite usar factories.
    Notifiable: permite notificaciones.*/
    use HasApiTokens, HasFactory, Notifiable;

    /** Estos campos se pueden llenar de forma masiva. */
    protected $fillable = [
        'name',
        'email',
        'password',
        'rol',
    ];

    /**
     * Estos campos se ocultan cuando el modelo se convierte en JSON.
     * Así evitamos exponer datos sensibles en respuestas de la API.
     */
    protected $hidden = [
        'password',
        'remember_token'
    ];

    /**
     * Aquí definimos conversiones automáticas de tipos.
     * - email_verified_at se convierte automáticamente a fecha.
     * - password se almacena hasheada automáticamente.
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Productos creados por este usuario.
     */
    public function productos()
    {
        return $this->hasMany(Producto::class);
    }
}
