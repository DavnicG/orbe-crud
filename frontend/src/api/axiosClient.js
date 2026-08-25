import axios from 'axios';

// Creamos una instancia reutilizable de Axios.
// Todas las peticiones que hagamos con "api" usarán esta configuración.

const api = axios.create({

    // import.meta.env lee la variable VITE_API_URL desde el archivo .env.
    baseURL: import.meta.env.VITE_API_URL,

    // Laravel recibirá y devolverá información en formato JSON.
    headers:{
        Accept: 'application/json',
        'Content-Type': 'application/json'
    },

    // Tiempo máximo de espera para una respuesta.
    timeout: 10000,
});

export default api;