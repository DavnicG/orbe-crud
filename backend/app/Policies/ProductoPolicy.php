<?php

namespace App\Policies;

use App\Models\Producto;
use App\Models\User;

class ProductoPolicy
{
    /**
     * Determina si el usuario puede ver la lista de productos.
     */
    public function viewAny(User $user): bool
    {
        return in_array($user->rol, ['admin', 'editor', 'viewer'], true);
    }

    /**
     * Determina si el usuario puede ver un producto específico.
     */
    public function view(User $user, Producto $producto): bool
    {
        return in_array($user->rol, ['admin', 'editor', 'viewer'], true);
    }

    /**
     * Determina si el usuario puede crear productos.
     */
    public function create(User $user): bool
    {
        return in_array($user->rol, ['admin', 'editor'], true);
    }

    /**
     * Determina si el usuario puede actualizar un producto.
     */
    public function update(User $user, Producto $producto): bool
    {
        return $user->rol === 'admin'
            || (
                $user->rol === 'editor'
                && (int) $user->id === (int) $producto->user_id
            );
    }

    /**
     * Determina si el usuario puede eliminar un producto.
     */
    public function delete(User $user, Producto $producto): bool
    {
        return $user->rol === 'admin'
            || (
                $user->rol === 'editor'
                && (int) $user->id === (int) $producto->user_id
            );
    }
}
