<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
/**
     * Este método se ejecuta cuando corremos:
     * php artisan migrate
     *
     * Aquí definimos la estructura de la tabla productos.
     */
    public function up(): void
    {
        Schema::create('productos', function (Blueprint $table) {
            // Crea la columna id como clave primaria autoincremental.
            $table->id();

            // Nombre del producto, por ejemplo: "Laptop Lenovo Ideapad 3".
            $table -> string ('nombre', 150);

            // Marca del producto, por ejemplo: Lenovo, HP, Samsung.
            $table -> string('marca',100);

            // Categoría general, por ejemplo: laptops, accesorios, monitores.
            $table -> string('categoria', 100);

            // Precio con 2 decimales. 10 dígitos totales, 2 decimales.
            $table -> decimal('precio',10,2);

            // Cantidad disponible en inventario.
            $table -> integer('stock')->default(0);

            // Descripción opcional del producto.
            $table -> text('descripcion')->nullable();

            // Estado lógico del producto: activo o inactivo.
            $table -> boolean('activo')->default(true);

            // created_at y updated_at automáticos.
            $table->timestamps();
        });
    }

    /**
     * Este método revierte la migración.
     * Se ejecuta si hacemos rollback.
     */
    public function down(): void
    {
        Schema::dropIfExists('productos');
    }
};
