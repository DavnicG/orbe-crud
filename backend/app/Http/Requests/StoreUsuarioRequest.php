<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Override;

class StoreUsuarioRequest extends FormRequest{
    /**Este metodo define si la peticion esta autorizada
     * Devolvemos TRUE porque la autorizacion real esta en el controlador.
     */
    public function authorize():bool{
        return true;
    }

    //Reglas de validacion
    public function rules():array{
        return [
            'name' => 'required|string|max:255',
            'username' => [
                'required',
                'string',
                'min:3',
                'max:100',
                'regex:/^[A-Za-z0-9._-]+$/',
                'unique:users,username',
            ],
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'rol' => 'required|in:admin,editor,viewer',
            'activo' => 'boolean',
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
