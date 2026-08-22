<?php

namespace App\Http\Controllers;

use App\Models\Producto;
use App\Http\Requests\StoreProductoRequest;
use App\Http\Requests\UpdateProductoRequest;

class ProductoController extends Controller
{
    /**
     * Mostrar todos los productos.
     *
     * Este método responde al GET /api/productos
     */
    public function index()
    {
        // Obtenemos todos los productos, ordenados del más reciente al más antiguo.
        $productos = Producto::orderBy('id','desc')->get();

        //Retornamos los datos en formato JSON
        return response()->json($productos);
    }

    /**
     * Guardar un nuevo producto.
     *
     * Este método responde al POST /api/productos
     */
    public function store(StoreProductoRequest $request)
    {
        // validated() devuelve solo los campos que pasaron la validación.
        // (...) El operador spread de PHP. Descompone un arreglo y coloca sus elementos dentro de otro arreglo

        $producto = Producto::create([

            ...$request -> validated(),
            'activo' => $request->validated()['activo']??true,
        ]);

        // Retornamos el producto creado con código HTTP 201.
        return response()->json([
            'message' => 'Producto creado correctamente',
            'data' => $producto
        ], 201);
    }

    /**
     * Mostrar un producto específico.
     *
     * Este método responde al GET /api/productos/{producto}
     */
    public function show(Producto $producto)
    {
        // Laravel ya buscó automáticamente el producto por su ID.
        return response()->json($producto);
    }

    /**
     * Actualizar un producto existente.
     *
     * Este método responde al PUT o PATCH /api/productos/{producto}
     */
    public function update(UpdateProductoRequest $request, Producto $producto)
    {
        // Validamos los datos y actualizamos el producto.
        $producto->update($request->validated());

        //Retornamos el producto actualizado
        return response() -> json([
            'message' => 'Producto actualizado correctamente',
            'data' => $producto
        ]);
    }

    /**
     * Eliminar un producto.
     *
     * Este método responde al DELETE /api/productos/{producto}
     */
    public function destroy(Producto $producto)
    {
        // Eliminamos el producto de la base de datos.
        $producto ->delete();

        //Retornamos mensaje de exito al borrar el producto
        return response([
            'message' => 'Producto eliminado correctamente'
        ]);
    }
}
