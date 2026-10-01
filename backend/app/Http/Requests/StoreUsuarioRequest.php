<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

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
            'password' => 'required|string|min:8',
            'rol' => 'required|in:admin,editor,viewer',
            'activo' => 'boolean',
        ];
    }
}
