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
            'password' => 'sometimes|required|string|min:8|confirmed',
            'rol' => 'sometimes|required|in:admin,editor,viewer',
            'activo' => 'sometimes|required|boolean',
        ];
    }

    /**
     * Mensajes en español para las reglas de contraseñas
     */
    public function messages():array
    {
        return [
            'username.unique' => 'Ese usuario de acceso ya esta en uso',
            'username.regex' => 'El usuario de acceso solo puede tener letras, numeros o . - _ ',
            'email.unique' => 'Ese correo electronico ya esta registrado',
            'password.required' => 'La contraseña es obligatoria',
            'password.min' => 'La contraseña debe tener al menos 8 caracteres.',
            'password.confirmed' => 'La confirmacion de la contraseña no coincide'
        ];
    }

    /**
     * Nombres legibles de los campos en los mensajes de error.
     */
    public function attributes():array
    {
        return [
            'name' => 'nombre',
            'username' => 'usuario de acceso',
            'email' => 'correo electronico',
            'password' => 'contraseña',
            'rol' => 'rol',
            'activo' => 'estado de acceso',
        ];
    }
}
