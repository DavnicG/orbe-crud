<?php

namespace App\Policies;

// Importamos el modelo de usuarios.
use App\Models\User;

class UsuarioPolicy
{
    /**
     * Determina si el usuario puede consultar la lista completa.
     */
    public function viewAny(User $currentUser): bool
    {
        // Solo los administradores pueden consultar todos los usuarios.
        return $currentUser->rol === 'admin';
    }

    /**
     * Determina si el usuario puede consultar un usuario específico.
     */
    public function view(User $currentUser, User $targetUser): bool
    {
        // Un admin puede consultar cualquier usuario.
        // Los demás solo pueden consultar su propio registro.
        return $currentUser->rol === 'admin'
            || $currentUser->id === $targetUser->id;
    }

    /**
     * Determina si el usuario puede crear usuarios.
     */
    public function create(User $currentUser): bool
    {
        // Solo los administradores pueden crear usuarios manuales.
        return $currentUser->rol === 'admin';
    }

    /**
     * Determina si el usuario puede editar usuarios.
     */
    public function update(User $currentUser, User $targetUser): bool
    {
        // Solo los administradores pueden editar usuarios.
        return $currentUser->rol === 'admin';
    }

    /**
     * Determina si el usuario puede eliminar usuarios.
     */
    public function delete(User $currentUser, User $targetUser): bool
    {
        // Solo los administradores pueden eliminar usuarios.
        if($currentUser->rol !== 'admin'){
            return false;
        }

        //Los usuarios LDAP se gestionan en el directorio activo
        if($targetUser ->tipo_autenticacion === 'ldap'){
            return false;
        }

        //Un admin no se puede eliminar a si mismo
        return $currentUser->id !== $targetUser->id;
    }
}
