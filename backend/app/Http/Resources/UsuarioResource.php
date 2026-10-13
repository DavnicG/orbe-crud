<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UsuarioResource extends JsonResource{
    //Transformamos el array en para la respuesta JSON

    //Este metodo controla que informacion se expone en la API
    public function toArray(Request $request) : array{
        return[
            'id' => $this->id,
            'username' =>$this->username,
            'name' => $this->name,
            'email' => $this->email,
            'rol' => $this->rol,
            'activo' => (bool) $this->activo,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            // Es null para usuarios activos.
            // Solo será útil en consultas futuras que incluyan withTrashed().
            'deleted_at' => $this->deleted_at,

        ];
    }
}
