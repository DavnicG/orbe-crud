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
            'tipo_autenticacion' =>$this->tipo_autenticacion,
            'rol' => $this->rol,
            'activo' => $this->activo ?? true,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

        ];
    }
}
