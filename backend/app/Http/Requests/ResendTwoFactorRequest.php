<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ResendTwoFactorRequest extends FormRequest
{
    /**
     * La autorización se valida dentro del controlador.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Solo se necesita el token temporal del desafío.
     */
    public function rules(): array
    {
        return [
            'challenge_token' => ['required', 'string', 'size:64'],
        ];
    }

    /**
     * Mensajes de validación en español.
     */
    public function messages(): array
    {
        return [
            'challenge_token.required' => 'El desafío de verificación es obligatorio.',
            'challenge_token.size' => 'El desafío de verificación no es válido.',
        ];
    }
}
