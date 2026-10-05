import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function RutaProtegida({ children }) {
    const { usuario, cargandoSesion } = useAuth();
    const token = localStorage.getItem("token");

    // Mientras AuthContext confirma si el token guardado sigue siendo válido.
    if (cargandoSesion) {
        return (
            <div className="d-flex justify-content-center align-items-center min-vh-100">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                </div>
            </div>
        );
    }

    // El token es obligatorio. Sin él nunca se permite una ruta privada.
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // Si existe token pero el usuario todavía no se cargó,
    // mostramos el cargador en lugar de expulsar al usuario de inmediato.
    if (!usuario) {
        return (
            <div className="d-flex justify-content-center align-items-center min-vh-100">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando sesión...</span>
                </div>
            </div>
        );
    }

    return children;
}

export default RutaProtegida;