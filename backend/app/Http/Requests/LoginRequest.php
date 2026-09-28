<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    /**
     * Este método define si la petición está autorizada.
     * Como cualquier usuario puede intentar iniciar sesión devolvemos true.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Aquí definimos las reglas de validación
     * para el login.
     */
    public function rules(): array
    {
        return [
            // El email es obligatorio y debe tener formato válido.
            'username' => 'required|string',
            // La contraseña es obligatoria.
            'password' => 'required|string',
        ];
    }
}
