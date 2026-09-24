import axios from "axios";

// Creamos una instancia reutilizable de Axios.
// Todas las peticiones que hagamos con "api" usarán esta configuración.
const api = axios.create({
  // import.meta.env lee la variable VITE_API_URL desde el archivo .env.
    baseURL: import.meta.env.VITE_API_URL,

  // Laravel recibirá y devolverá información en formato JSON.
    headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    },

  // Tiempo máximo de espera para una respuesta.
    timeout: 10000,
});

//Intercerptor de peticiones
api.interceptors.request.use((config) => {
  //Leemos el token guardado en LocalStorage.
    const token = localStorage.getItem("token");

  //Si existe un token lo agregamos el header de autorizacion
    if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

//Intercerptor de respuestas
api.interceptors.response.use(
  //Si la respuesta es exitosa retornamos
    (response) => response,

  //Si la respuesta falla revisamos el error
    (error) => {
    //Si el token es invalido
    if (error.response?.status === 401) {
      //Eliminamos el token invalido
        localStorage.removeItem("token");

      //Redirijimos al login
        window.location.href = "/login";
    }

    return Promise.reject(error);
    },
);

export default api;
