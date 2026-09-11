<?php

namespace App\Policies;

use App\Models\Producto;
use App\Models\User;

class ProductoPolicy
{
    /**
     * Determina si el usuario puede actualizar el producto.
     */
    public function update(User $user, Producto $producto): bool
    {
        // Puede actualizar si es el dueño del producto o si tiene rol de administrador.
        return $user->id === $producto->user_id || $user->rol === 'admin';
    }

    /**
     * Determina si el usuario puede eliminar el producto.
     */
    public function delete(User $user, Producto $producto): bool
    {
        // Puede eliminar si es el dueño del producto o si tiene rol de administrador.
        return $user->id === $producto->user_id || $user->rol === 'admin';
    }
}
