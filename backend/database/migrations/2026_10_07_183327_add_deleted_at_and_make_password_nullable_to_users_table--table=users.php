<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Añadimos la columna deleted_at para soft deletes
            $table->timestamp('deleted_at')->nullable()->after('updated_at');

            // Hacemos que password sea nullable (los usuarios LDAP no la usan)
            $table->string('password')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Eliminamos la columna deleted_at
            $table->dropColumn('deleted_at');

            // Volvemos a hacer password NOT NULL
            $table->string('password')->nullable(false)->change();
        });
    }
};
