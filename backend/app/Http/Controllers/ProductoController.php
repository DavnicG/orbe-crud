<?php

namespace App\Http\Controllers;

use App\Models\Producto;
use App\Http\Requests\StoreProductoRequest;
use App\Http\Requests\UpdateProductoRequest;
use App\Http\Resources\ProductoResource;

class ProductoController extends Controller
{
    /**
     * Mostrar todos los productos.
     *
     * Este método responde al GET /api/productos
     */
    public function index()
    {
        $this->authorize('viewAny', Producto::class);

        // Obtenemos todos los productos, ordenados del más reciente al más antiguo.
        $productos = Producto::orderBy('id', 'desc')->get();

        //Retornamos los datos en formato JSON
        return ProductoResource::collection($productos);
    }

    /**
     * Guardar un nuevo producto.
     *
     * Este método responde al POST /api/productos
     */
    public function store(StoreProductoRequest $request)
    {
        //Verifica la capacidad create de ProductoPolicy.
        $this -> authorize('create', Producto::class);

        // Obtenemos únicamente los datos que pasaron la validación.
        $datosValidados = $request->validated();

        // Obtenemos el usuario autenticado mediante el token Bearer.
        $user = $request->user();

        // Agregamos el usuario creador desde el backend.
        // El cliente no debe enviar user_id.
        $datosValidados['user_id'] = $user->id;

        // Creamos directamente el producto.
        // Producto::create() devuelve el modelo recién guardado.
        $producto = Producto::create($datosValidados);

        // Retornamos el producto creado.
        return response()->json([
            'message' => 'Producto creado correctamente',
            'data' => new ProductoResource($producto),
        ], 201);
    }

    /**
     * Mostrar un producto específico.
     *
     * Este método responde al GET /api/productos/{producto}
     */
    public function show(Producto $producto)
    {
        $this->authorize('view', $producto);

        // Laravel ya buscó automáticamente el producto por su ID.
        return new ProductoResource($producto);
    }

    /**
     * Actualizar un producto existente.
     *
     * Este método responde al PUT o PATCH /api/productos/{producto}
     */
    public function update(UpdateProductoRequest $request, Producto $producto)
    {
        // Laravel consulta ProductoPolicy::update().
        $this->authorize('update', $producto);

        // Actualizamos el producto con datos validados.
        $producto->update($request->validated());

        // Recargamos el modelo actualizado.
        $producto->refresh();

        //Retornamos el producto actualizado
        return response()->json([
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
        // Laravel consulta ProductoPolicy::delete().
        $this->authorize('delete', $producto);

        // Eliminamos el producto de la base de datos.
        $producto->delete();

        //Retornamos mensaje de exito al borrar el producto
        return response([
            'message' => 'Producto eliminado correctamente'
        ]);
    }
}
