<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateUsuarioRequest extends FormRequest{
    public function authorize(): bool{
    /**Este metodo define si la peticion esta autorizada
     * Devolvemos TRUE porque la autorizacion real esta en el controlador.
     */
        return true;
    }

    //Reglas de validacion
    public function rules(): array{

    // Obtenemos el ID del usuario que se está actualizando desde la ruta.
    $usuarioId = $this->route('usuario')->id;
        return[
            'name' => 'sometimes|required|string|max:255',
            // Username opcional, pero debe ser único excepto para este usuario.
            'username' => [
                'sometimes',
                'required',
                'string',
                'min:3',
                'max:100',
                'regex:/^[A-Za-z0-9._-]+$/',
                'unique:users,username,' . $usuarioId,
            ],
            'email' => 'sometimes|required|email|unique:users,email,'.$usuarioId,
            'password' => 'sometimes|required|string|min:8',
            'rol' => 'sometimes|required|in:admin,editor,viewer',
            'activo' => 'sometimes|required|boolean',
        ];
    }
}
