<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductoRequest extends FormRequest
{
    /**
     * Define si esta petición está autorizada.
     * Como no tenemos login ni roles, devolvemos true.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Reglas de validación para crear un producto.
    */
    public function rules(): array{

        return[

            'nombre' => 'required|string|max:150',
            'marca' => 'required|string|max:100',
            'categoria' => 'required|string|max:100',
            'precio' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'descripcion' => 'nullable|string',
            'activo' => 'nullable|boolean',

        ];

    }

}
