<?php
//Conecta el codigo con la tabla productos en la BD
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Producto extends Model
{
    use HasFactory;
    /**
     * Campos que Laravel permite llenar de forma masiva.
     *
     * Ejemplo:
     * Producto::create($request->all());
     *
     * Si un campo no está aquí, Laravel no lo insertará
     * por seguridad.
     */
    protected $fillable = [

        'nombre',
        'marca',
        'categoria',
        'precio',
        'stock',
        'descripcion',
        'activo',
    ];

    /**
    * Conversión automática de tipos al leer/escribir datos.
    */
    protected $casts = [
        'precio'=> 'decimal:2',
        'stock'=> 'integer',
        'activo' => 'boolean'
    ];
}
