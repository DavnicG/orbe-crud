<?php

namespace Database\Factories;

use App\Models\Producto;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Producto>
 */
class ProductoFactory extends Factory
{
    protected $model = Producto::class;

    public function definition(): array
    {
        $productos = [
            'Mouse inalámbrico',
            'Teclado mecánico',
            'Monitor LED',
            'Cargador portátil',
            'Webcam HD',
            'Audífonos gamer',
            'Parlante Bluetooth',
            'Hub USB',
            'Disco SSD',
            'Memoria USB',
            'Base refrigerante',
            'Micrófono condensador',
            'Pad mouse XL',
            'Cable HDMI',
            'Adaptador USB-C',
        ];

        $marcas = [
            'Logitech',
            'HP',
            'Lenovo',
            'Samsung',
            'Dell',
            'Xiaomi',
            'Kingston',
            'Gamesir',
            'Redragon',
            'Sony',
        ];

        $categorias = [
            'Periféricos',
            'Pantallas',
            'Cargadores',
            'Audio',
            'Accesorios',
            'Almacenamiento',
            'Conectividad',
        ];
        return [
            'nombre' => fake()->randomElement($productos),
            'marca' => fake()->randomElement($marcas),
            'categoria' => fake()->randomElement($categorias),
            'precio' => fake()->randomFloat(2, 20000, 2500000),
            'stock' => fake()->numberBetween(0, 120),
            'descripcion' => fake()->sentence(8),
            'activo' => fake()->boolean(85),
        ];
    }
}
