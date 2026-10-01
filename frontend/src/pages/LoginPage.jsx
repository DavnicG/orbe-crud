import { useState } from "react";
import {useNavigate} from "react-router-dom";
import {iniciarSesion} from "../services/AuthService";
import {useAuth} from "../context/AuthContext";

function LoginPage (){

    //Estado local del formulario de login
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });

    //Estado para mostrar si se esta enviadno el formulario
    const [enviando, setEnviando] = useState(false);

    //Estador para mostrar errores de credenciales o conexion
    const [error, setError] = useState('');

    //Hook de react-router-dom para redirigi despues del login
    const navigate = useNavigate();

    //Hook para iniciar sesion
    const {iniciarSesionLocal} = useAuth();

    //Actualiza el estado cuando el usuario escribe en un input
    const handleChange = (e) => {

        const {name, value} = e.target;

        setFormData({
            ...formData,
            [name]: value,
        });
    }

    //Se ejecuta cuando el usuario envia el form
    const handleSubmit = async (e) => {

        //Evita que el navegador recargue lapagina
        e.preventDefault();

        //Evitamos  multiples envios mientras se procesa
        if(enviando) return;
        setEnviando(true);
        setError('');

        try{
            //Llamamos al backend con las credenciales ingresadas
            const respuesta = await iniciarSesion(formData);

            //Guardamos el token el localStorage
            localStorage.setItem('token', respuesta.data.token);

            //Guardamos los datos del usuario
            localStorage.setItem('usuario', JSON.stringify(respuesta.data.user));

            //Avisamos al compnente padre que el login fue exitoso
            iniciarSesionLocal(respuesta.data.user);

            //Redirigimos a la pagina de productos
            navigate("/productos", { replace: true });
        }catch(err){
            console.error('Error al iniciar sesion: ', err);

            // Mensaje específico del backend.
            const mensajeBackend = err.response?.data?.message;

            // Si el backend envió un mensaje, lo usamos.
            if (mensajeBackend) {
                setError(mensajeBackend);
            } else {
                setError("No se pudo iniciar sesión. Intenta de nuevo.");
            }
        }finally{
            setEnviando(false);
        }
    };

    return(
        //Contenedor centrado vertical y horizontalmente.
        <main className="bg-light min-vh-100 d-flex align-items-center justify-content-center">
            <div className="card shadow-sm" style={{width: '100%', maxWidth:'400px'}}>
                <div className="card-body p-4">
                    <h1 className="card-title mb-4 text-center h4">Iniciar sesion</h1>

                    <form onSubmit={handleSubmit}>
                        {/*Campo email*/}
                        <div className="mb-3">
                            <label htmlFor="username" className="form-label">
                                Usuario de dominio
                            </label>
                            <input 
                                type="text"
                                id="username"
                                name="username"
                                className="form-control"
                                value={formData.username}
                                onChange={handleChange}
                                required
                                autoFocus 
                            />
                        </div>
                        {/*Campo password*/}
                        <div className="mb-3">
                            <label htmlFor="password" className="form-label">
                                Contraseña
                            </label>
                            <input 
                                type="password"
                                id="password"
                                name="password"
                                className="form-control"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/*Mostramos el mensaje de error si lo hubo*/}
                        {error && (
                            <div className="alert alert-danger mt-3" role="alert">{error}</div>
                        )}

                        {/*Boton de envio*/}
                        <button
                            type="submit"
                            className="btn btn-primary w-100"
                            disabled={enviando}
                        >
                            {enviando ? 'Ingresando...' : 'Ingresar'}
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
}

export default LoginPage;