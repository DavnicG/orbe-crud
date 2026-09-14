import api from '../api/axiosClient';

//Este archivo trae las funciones que hablan con la API de autenticacion

//Registrar nuevo usuario
export const registrarUsario = async (datosUsuario) => {
    return await api.post('/register', datosUsuario);
};

//Iniciar sesion con email y password Laravel devuelve el token
export const iniciarSesion = async (credenciales) => {
    return await api.post('/login', credenciales);
};

//Cerrar sesion
export const cerrarSesion = async () =>{
    return await api.post('/logout');
};

//Obtener los datos del usuario autenticado
export const obtenerUsuarioActual = async () =>{
    return await api.get('/me');
};