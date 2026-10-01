import api from '../api/axiosClient'

//Este archivo concentra las funciones que hablan con la API para la gestion de usuarios.

//Obtener la lista de usuarios
export const obtenerUsuarios = async() =>{
    return await api.get('/usuarios');
}

//Obtener un usuario en especifico
export const obtenerUsuario = async(id) =>{
    return await api.get(`/usuarios/${id}`);
}

//Crear nuevo usuario
export const crearUsuario = async(datosUsuario) =>{
    return await api.post('/usuarios', datosUsuario);
}

//Actualizar usuario
export const actualizarUsuario = async(id, datosUsuario) =>{
    return await api.put(`/usuarios/${id}`, datosUsuario);
}

//Eliminar un usuario
export const eliminarUsuario = async(id) =>{
    return await api.delete(`/usuarios/${id}`);
}