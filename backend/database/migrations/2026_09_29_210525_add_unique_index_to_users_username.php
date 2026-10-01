<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Agrega una restricción de unicidad al username.
     *
     * La base de datos será la protección definitiva para impedir
     * que existan dos usuarios con el mismo identificador de acceso.
     */
    public function up(): void
    {
        // Modificamos la tabla users.
        Schema::table('users', function (Blueprint $table) {
            // Creamos un índice único sobre username.
            $table->unique('username', 'users_username_unique');
        });
    }

    /**
     * Elimina la restricción única si hacemos rollback.
     */
    public function down(): void
    {
        // Eliminamos el índice por el nombre explícito que definimos.
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique('users_username_unique');
        });
    }
};