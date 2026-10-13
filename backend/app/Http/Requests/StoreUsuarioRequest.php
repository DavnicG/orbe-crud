<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Override;

class StoreUsuarioRequest extends FormRequest{
    /**
     * Determina si el usuario autenticado puede realizar esta petición.
     *
     * La autorización real también se aplica en UsuarioController
     * con la UsuarioPolicy.
     */
    public function authorize():bool{
        return true;
    }

    //Reglas de validacion
    public function rules():array{
        return [
            'username' => [
                'required',
                'string',
                'min:3',
                'max:100',
                'regex:/^[A-Za-z0-9._-]+$/',
                'unique:users,username',
            ],
            'rol' => 'required|in:admin,editor,viewer',
            'activo' => 'boolean',
        ];
    }

    /**
     * Mensajes personalizados para errores de validación.
     */
    public function messages(): array
    {
        return [
            'username.required' => 'El username LDAP es obligatorio.',
            'username.min' => 'El username LDAP debe tener al menos 3 caracteres.',
            'username.max' => 'El username LDAP no puede tener más de 100 caracteres.',
            'username.regex' => 'El username LDAP solo puede tener letras, números, puntos, guiones y guiones bajos.',
            'rol.required' => 'Debes asignar un rol al usuario.',
            'rol.in' => 'El rol seleccionado no es válido.',
            'activo.required' => 'Debes indicar si el usuario tendrá acceso al aplicativo.',
            'activo.boolean' => 'El estado de acceso no es válido.',
        ];
    }

    /**
     * Nombres legibles de los campos en los mensajes de error.
     */
    public function attributes():array
    {
        return [
            'username' => 'usuario de acceso',
            'rol' => 'rol',
            'activo' => 'estado de acceso',
        ];
    }
}
