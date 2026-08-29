<?php

// Este archivo simula el comportamiento de "php artisan serve"
// para el servidor built-in de PHP, respetando las rutas de Laravel.

$uri = urldecode(
    parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH)
);

// Si el archivo pedido existe físicamente en /public, se sirve directo.
if ($uri !== '/' && file_exists(__DIR__.'/public'.$uri)) {
    return false;
}

// Si no existe, todo pasa por index.php (así funcionan las rutas de Laravel).
require_once __DIR__.'/public/index.php';
