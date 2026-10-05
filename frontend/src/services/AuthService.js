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

export const verificarDosFactores = (datos) => {
    return api.post("/two-factor/verify", datos);
};

export const reenviarCodigoDosFactores = (challengeToken) => {
    return api.post("/two-factor/resend", {
        challenge_token: challengeToken,
    });
};

//Cerrar sesion
export const cerrarSesion = async () =>{
    return await api.post('/logout');
};

//Obtener los datos del usuario autenticado
export const obtenerUsuarioActual = () => {
    return api.get("/me");
};