import {createContext, useContext, useState, useEffect} from "react";
import {obtenerUsuarioActual} from "../services/AuthService";

//Creamos el contexto. Cualquier componente hijo podra leer de aqui
//sin necesidad de recibir props manualmente en cada nivel

const AuthContext = createContext (null);

export function AuthProvider({children}){

    //Guarda los datos del usuario autenticado(name, email, rol, id).
    //Empieza en null porque todavia no sabemos si hay sesion.
    const [usuario, setUsuario] = useState(null);

    //Indica si todavia estamos verificando la sesion al cargar la app.
    const [cargandoSesion, setCargandoSesion] = useState(true);
    
    //Al montar la aplicacion, revisamos si ya existe un token guardado
    useEffect(()=>{
        const  verficarSesion = async () =>{

            const token = localStorage.getItem('token');

            //Si no hay token, no hay nada que verificar.
            if(!token){
                setCargandoSesion(false);
                return;
            }

            try{
                //Le preguntamos a Laravel quien es el usuario de este token
                const respuesta = await obtenerUsuarioActual();
                setUsuario(respuesta.data);
            }catch(error){
                //Si el token ya no es valido, el interceptor de axios se encarga de limpiar localStorage y redirigir
                console.error('Sesion invalida:', error);
            }finally{
                setCargandoSesion(false);
            }
        };
        verficarSesion();
    },[]);

    //Esta funcion la llamara LoginPage cuando el login sea exitoso.
    const iniciarSesionLocal = (datosUsuario) =>{
        setUsuario(datosUsuario);
    };

    //Esta funcion la llamara el boton de "Cerrar sesion".
    const cerrarSesionLocal = () =>{
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        setUsuario(null);
    };

    return(
        <AuthContext.Provider
            value={{
                usuario,
                cargandoSesion,
                iniciarSesionLocal,
                cerrarSesionLocal,
            }}
        >{children}
        </AuthContext.Provider>
    );
}

//Hook personalizado para consumir el contexto
export function useAuth(){
    return useContext (AuthContext);
}