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
            'rol' => 'sometimes|required|in:admin,editor,viewer',
            'activo' => 'sometimes|required|boolean',
        ];
    }
    /**
     * Rechaza solicitudes que no contengan ningún campo permitido.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            // Obtenemos solo las claves permitidas que llegaron en la petición.
            $camposPermitidos = $this->only(['rol', 'activo']);

            // Si no se envía rol ni activo, no hay nada válido por actualizar.
            if (empty($camposPermitidos)) {
                $validator->errors()->add(
                    'datos',
                    'Debes enviar al menos uno de estos campos: rol o activo.'
                );
            }
        });
    }

    /**
     * Mensajes personalizados de validación.
     */
    public function messages(): array
    {
        return [
            'rol.in' => 'El rol seleccionado no es válido.',
            'activo.boolean' => 'El estado de acceso no es válido.',
        ];
    }

    /**
     * Nombres legibles para mensajes de validación.
     */
    public function attributes(): array
    {
        return [
            'rol' => 'rol',
            'activo' => 'estado de acceso',
        ];
    }
}
