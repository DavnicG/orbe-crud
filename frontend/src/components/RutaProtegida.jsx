import {Navigate} from "react-router-dom"
import { useAuth } from "../context/AuthContext";

//Este componente envuelve cualquier pagina que requiere sesion activa.
//Si no hay usuario autenticado, redirige a /login.

function RutaProtegida({children}){
    
    const {usuario, cargandoSesion} = useAuth();

    //Mientras se verifica si hay sesion no mostramos nada
    if(cargandoSesion){
        return(
            <div className="d-flex justify-content-center align items-center min-vh-100">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                </div>
            </div>
        );
    }

    //Si ya termino de cargar y no hay usuario, mandamos al login
    if (!usuario){
        return <Navigate to="/login" replace/>;
    }

    //Si hay usuario, mostramos la pagina solicitada
    return children;
}

export default RutaProtegida;