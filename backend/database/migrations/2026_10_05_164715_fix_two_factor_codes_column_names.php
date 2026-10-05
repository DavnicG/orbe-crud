<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Corrige las columnas creadas con errores de escritura
     * y agrega el token temporal que identifica el desafío de 2FA.
     */
    public function up(): void
    {
        Schema::table('two_factor_codes', function (Blueprint $table) {
            // Identifica el desafío 2FA sin enviar user_id desde el frontend.
            // Se usa con el código para realizar la verificación posterior.
            $table->string('challenge_token', 64)
                ->unique()
                ->after('code');

            // Corrige el número de intentos fallidos.
            $table->renameColumn('atemps', 'attempts');

            // Corrige la fecha de vencimiento.
            $table->renameColumn('expired_at', 'expires_at');

            // Corrige la dirección IP registrada.
            $table->renameColumn('ip_adress', 'ip_address');
        });
    }

    /**
     * Revierte las correcciones si se ejecuta rollback.
     */
    public function down(): void
    {
        Schema::table('two_factor_codes', function (Blueprint $table) {
            // Se elimina primero el índice único y después su columna.
            $table->dropUnique(['challenge_token']);
            $table->dropColumn('challenge_token');

            // Restaura los nombres erróneos originales.
            $table->renameColumn('attempts', 'atemps');
            $table->renameColumn('expires_at', 'expired_at');
            $table->renameColumn('ip_address', 'ip_adress');
        });
    }
};
