<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Este método se ejecuta cuando corremos la migración.
    // Aquí agregamos los nuevos campos a las tablas existentes.
    public function up(): void
    {
        // Modificamos la tabla users para agregar el rol del usuario.
        Schema::table('users', function (Blueprint $table) {
            // El rol puede ser:
            // - admin: acceso completo
            // - editor: puede gestionar productos
            // - viewer: solo consulta
            // Si no se envía un rol, por defecto será editor.
            $table->enum('rol', ['admin', 'editor', 'viewer'])->default('editor');
        });

        // Modificamos la tabla productos para guardar qué usuario creó el producto.
        Schema::table('productos', function (Blueprint $table) {
            // foreignId crea la columna user_id como clave foránea.
            // nullable permite que el campo quede vacío temporalmente.
            // constrained enlaza automáticamente con la tabla users.
            // nullOnDelete hace que, si se elimina el usuario,
            // el campo user_id del producto quede en null.
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
        });
    }

    // Este método se ejecuta si hacemos rollback de la migración.
    // Aquí revertimos los cambios hechos en el método up().
    public function down(): void
    {
        // Primero eliminamos la relación foránea y la columna user_id
        // de la tabla productos.
        Schema::table('productos', function (Blueprint $table) {
            $table->dropConstrainedForeignId('user_id');
        });

        // Luego eliminamos la columna rol de la tabla users.
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('rol');
        });
    }
};
