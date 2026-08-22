<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProductoRequest extends FormRequest
{
    /**
     * Autoriza la petición.
    */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Reglas de validación para actualizar un producto.
     *
     * Si la peticion es PUT: Exige todos los campos
     *
     * Si la peticion es PATCH: Valida los campos que vienen  en la peticion
     */
    public function rules(): array
    {
        if  ($this -> isMethod('put')){
            return [
                'nombre' => 'required|string|max:150',
                'marca' => 'required|string|max:100',
                'categoria' => 'required|string|max:100',
                'precio' => 'required|numeric|min:0',
                'stock' => 'required|integer|min:0',
                'descripcion' => 'nullable|string',
                'activo' => 'required|boolean',
            ];
        }

        return[
            'nombre' => 'sometimes|required|string|max:150',
            'marca' => 'sometimes|required|string|max:100',
            'categoria' => 'sometimes|required|string|max:100',
            'precio' => 'sometimes|required|numeric|min:0',
            'stock' => 'sometimes|required|integer|min:0',
            'descripcion' => 'sometimes|nullable|string',
            'activo' => 'sometimes|required|boolean',
        ];
    }
}
