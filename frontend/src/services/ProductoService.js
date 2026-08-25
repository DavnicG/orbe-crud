import api from '../api/axiosClient';

// Este archivo concentra las funciones que hablan con la API.
// Así evitamos escribir api.get(...) directamente en cada componente.

//Obtenemos todos los productos
export const obtenerProductos = async () => {
    return await api.get('/productos');
};

//Crear un nuevo producto
export const crearProducto = async (datosProducto) =>{
    return await api.post('/productos', datosProducto);
};

//Actualizar un producto
export const actualizarProducto =async(id, datosProducto) =>{
    return await api.patch(`/productos/${id}`, datosProducto);
}

//Eliminar un producto
export const eliminarProducto = async (id) =>{
    return await api.delete(`/productos/${id}`)
}
