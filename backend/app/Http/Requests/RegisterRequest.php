<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    /**
     * Este método define si la petición está autorizada.
     * Por ahora vamos a permitirla siempre.
     * Más adelante podríamos restringir quién puede crear usuarios.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Aquí definimos las reglas de validación
     * para registrar un nuevo usuario.
     */
    public function rules(): array
    {
        return [
            // El nombre es obligatorio, debe ser texto y no puede superar los 255 caracteres.
            'name' => 'required|string|max:255',
            // El email es obligatorio, debe tener formato válido y no puede repetirse en la tabla users.
            'email' => 'required|email|unique:users,email',
            // La contraseña es obligatoria y debe tener al menos 8 caracteres.
            'password' => 'required|string|min:8',
            // El rol es obligatorio y solo puede tomar uno de los tres valores definidos.
            'rol' => 'required|in:admin,editor,viewer',
        ];
    }
}
