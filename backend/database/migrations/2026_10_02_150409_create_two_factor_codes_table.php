<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Esta migración ya se ejecutó previamente.
     *
     * Se conserva para que el historial de migraciones coincida
     * con la tabla migrations de la base de datos.
     */
    public function up(): void
    {
        Schema::create('two_factor_codes', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->string('code');

            // Nombres originales creados antes de la migración correctiva.
            $table->unsignedTinyInteger('atemps')->default(0);
            $table->timestamp('used_at')->nullable();
            $table->timestamp('expired_at');
            $table->ipAddress('ip_adress')->nullable();
            $table->string('user_agent', 1000)->nullable();

            $table->timestamps();

            $table->index(['user_id', 'used_at', 'expired_at']);
        });
    }

    /**
     * Elimina la tabla si se revierte esta migración.
     */
    public function down(): void
    {
        Schema::dropIfExists('two_factor_codes');
    }
};
