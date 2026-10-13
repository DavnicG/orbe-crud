<?php

namespace App\Console\Commands\Usuarios;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class LimpiarLocales extends Command
{
    /**
     * El nombre y la firma del comando.
     *
     * @var string
     */
    protected $signature = 'usuarios:limpiar-locales';

    /**
     * La descripción del comando.
     *
     * @var string
     */
    protected $description = 'Elimina (soft delete) todos los usuarios locales de autenticación';

    /**
     * Ejecutar el comando.
     */
    public function handle(): int
    {
        // Contamos cuántos usuarios locales existen antes de eliminar
        $cantidadAntes = User::where('tipo_autenticacion', 'local')->count();

        if ($cantidadAntes === 0) {
            $this->info('No hay usuarios locales que eliminar.');
            return Command::SUCCESS;
        }

        $this->info("Se eliminarán {$cantidadAntes} usuarios locales (soft delete).");

        if (!$this->confirm('¿Estás seguro de que deseas continuar?')) {
            $this->warn('Operación cancelada.');
            return Command::FAILURE;
        }

        // Eliminamos los usuarios locales (soft delete)
        $cantidadEliminados = User::where('tipo_autenticacion', 'local')
            ->delete();

        $this->info("Se eliminaron {$cantidadEliminados} usuarios locales.");
        $this->info('Los usuarios locales ahora están en la tabla users con deleted_at lleno.');

        return Command::SUCCESS;
    }
}
