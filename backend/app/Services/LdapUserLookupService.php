<?php

namespace App\Services;

use LdapRecord\Connection;
use LdapRecord\Auth\BindException;
use LdapRecord\LdapRecordException;

class LdapUserLookupService
{
    /**
     * Busca un usuario del Directorio Activo por su username exacto.
     *
     * Retorna un arreglo con username, nombre y correo.
     * Retorna null si no existe o si no tiene correo.
     */
    public function buscarUsuario(string $username): ?array
    {
        //Se normaliza el username para evitar usuarios accidentales
        $username = trim($username);

        // Creamos la conexión al Directorio Activo.
        $connection = new Connection([
            'hosts' => [config('services.ldap.host')],
            'port' => config('services.ldap.port', 389),
            'base_dn' => config('services.ldap.base_dn'),

            // Temporalmente se usa la cuenta corporativa definida en .env
            // para permitir que el administrador consulte el directorio.
            'username' => 'CORP\\' . config('services.ldap.service_username'),
            'password' => config('services.ldap.service_password'),

            // Evita que una caída del LDAP deje bloqueada la petición.
            'timeout' => 5,
        ]);

        try {
            // Validamos que la conexión y las credenciales sean correctas.
            $connection -> connect();
        }catch(BindException $e){
            // La cuenta de servicio no pudo autenticarse.
            report($e);

            return null;
        }

        // Consultamos exactamente por sAMAccountName.
        $usuarioLdap = $connection->query()
            ->where('sAMAccountName', '=', $username)
            ->first();

        //Si no existe, no hay usuarios que retornar
        if (! $usuarioLdap){
            return null;
        }

        //Extraemos el correo y el nombre desde el Directorio activo
        $correo = $usuarioLdap['mail'][0] ?? null;
        $nombre = $usuarioLdap['displayname'][0] ?? $username;

        //Sin correo no se puede activar el 2FA
        if(!$correo){
            return null;
        }

        return[
            'username' => $username,
            'nombre' => $nombre,
            'correo' => $correo,
        ];
    }
}
