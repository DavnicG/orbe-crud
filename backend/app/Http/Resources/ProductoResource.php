<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductoResource extends JsonResource
{
    /**
     * Transform el producto en un array para la respuesta JSON.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this -> id,
            'nombre' => $this -> nombre,
            'marca' => $this -> marca,
            'categoria' => $this -> categoria,
            'precio' => $this -> precio,
            'stock' => $this -> stock,
            'descripcion' => $this -> descripcion,
            'activo' => $this -> activo,
            'user_id' => $this -> user_id,
            'created_at' => $this -> created_at,
            'updated_at' => $this -> updated_at,
        ];
    }
}
