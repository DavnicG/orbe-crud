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

// Buscar un usuario en el Directorio Activo por su username exacto.
// Devuelve { username, nombre, correo } solo para mostrar una vista previa.
// encodeURIComponent evita que caracteres raros rompan la URL.
export const buscarUsuarioLdap = async (username) =>{
    return await api.get(`/usuarios/ldap/${encodeURIComponent(username.trim())}`);
}

// Crear usuario: solo se envia { username, rol, activo }.
// El backend vuelve a consultar el LDAP para obtener nombre y correo.
export const crearUsuario = async(datosUsuario) =>{
    return await api.post('/usuarios', datosUsuario);
}

//Actualizar usuario: solo se envia { rol } y/o { activo }.
export const actualizarUsuario = async(id, datosUsuario) =>{
    return await api.put(`/usuarios/${id}`, datosUsuario);
}

//Eliminar un usuario del aplicativo (soft delete; no toca el LDAP)
export const eliminarUsuario = async(id) =>{
    return await api.delete(`/usuarios/${id}`);
}