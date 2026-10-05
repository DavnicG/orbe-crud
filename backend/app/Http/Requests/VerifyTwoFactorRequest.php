<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class VerifyTwoFactorRequest extends FormRequest
{
    /**
     * La autorización se valida dentro del controlador.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Reglas del desafío 2FA.
     */
    public function rules(): array
    {
        return [
            'challenge_token' => ['required', 'string', 'size:64'],
            'code' => ['required', 'string', 'digits:6'],
        ];
    }

    /**
     * Mensajes que verá el usuario.
     */
    public function messages(): array
    {
        return [
            'challenge_token.required' => 'El desafío de verificación es obligatorio.',
            'challenge_token.size' => 'El desafío de verificación no es válido.',
            'code.required' => 'El código de verificación es obligatorio.',
            'code.digits' => 'El código de verificación debe tener 6 dígitos.',
        ];
    }
}
