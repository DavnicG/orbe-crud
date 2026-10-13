import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    verificarDosFactores,
    reenviarCodigoDosFactores,
} from "../services/AuthService";
import { useAuth } from "../context/AuthContext";

// Segundos que el usuario debe esperar antes de pedir otro código.
const SEGUNDOS_ESPERA_REENVIO = 60;

function TwoFactorPage(){

    const navigate = useNavigate();
    const location = useLocation();
    const { iniciarSesionLocal } = useAuth();

    const [challengeToken, setChallengeToken] = useState(
        () => sessionStorage.getItem("challenge_token") || ""
    );
    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [enviando, setEnviando] = useState(false);
    const [reenviando, setReenviando] = useState(false);
    const verificacionExitosa = useRef(false);
    // Segundos restantes antes de poder reenviar. Empieza en espera porque el código acaba de enviarse durante el login.
    const [segundosRestantes, setSegundosRestantes] = useState(
        SEGUNDOS_ESPERA_REENVIO
    );

    useEffect(()=>{
        const tokenRecibido = location.state?.challengeToken;

        if(tokenRecibido){
            sessionStorage.setItem("challenge_token", tokenRecibido);
            setChallengeToken(tokenRecibido);
        }
    },[location.state]);

useEffect(() => {
    if (!challengeToken && !verificacionExitosa.current) {
        navigate("/login", { replace: true });
    }
}, [challengeToken, navigate]);

/**
 * Cuenta regresiva del reenvío.
 *
 * Mientras queden segundos, un temporizador resta 1 cada segundo.
 * Al llegar a 0 se detiene y el botón vuelve a habilitarse.
 */
useEffect(() => {
    if (segundosRestantes <= 0) {
        return;
    }

    const temporizador = setTimeout(() => {
        setSegundosRestantes((actual) => actual - 1);
    }, 1000);

    // Limpieza para no dejar temporizadores huérfanos al desmontar.
    return () => clearTimeout(temporizador);
}, [segundosRestantes]);

    const limpiarDesafio = () => {
        sessionStorage.removeItem("challenge_token");
        setChallengeToken("");
    }

    const handleChange = (event) => {
        const valor = event.target.value.replace(/\D/g, "").slice(0, 6);
        setCode(valor);
        setError("");
    }

    const handleSubmit = async (event) =>{
        event.preventDefault();

        if(enviando || code.length !== 6 || !challengeToken){
            return;
        }

        setEnviando(true);
        setError("");
        setMensaje("");

        try{
            const respuesta = await verificarDosFactores({
                challenge_token: challengeToken,
                code,
            });

            const {token, user} = respuesta.data;

            localStorage.setItem("token", token);
            localStorage.setItem("usuario", JSON.stringify(user));

            verificacionExitosa.current = true;
            
            iniciarSesionLocal(user);
            limpiarDesafio();

            navigate("/productos", { replace: true });
        }catch(err){
            if (err.response?.status === 429) {
                setError("Demasiados intentos. Espera un minuto e inténtalo de nuevo.");
                return;
            }
            const mensajeBackend = err.response?.data?.message;

            setError(
                mensajeBackend ||
                "No se pudo verificar el código. Intenta nuevamente."
            );
        }finally{
            setEnviando(false);
        }
    }

    const handleReenviar = async () => {
        // No reenviamos si ya hay una petición en curso, no hay desafío
        // o todavía falta tiempo de espera.
        if (reenviando || !challengeToken || segundosRestantes > 0) {
            return;
        }

        setReenviando(true);
        setError("");
        setMensaje("");

        try {
            const respuesta = await reenviarCodigoDosFactores(challengeToken);
            const nuevoChallengeToken = respuesta.data.challenge_token;

            sessionStorage.setItem("challenge_token", nuevoChallengeToken);
            setChallengeToken(nuevoChallengeToken);
            setCode("");

            // Reiniciamos la espera de 60 segundos.
            setSegundosRestantes(SEGUNDOS_ESPERA_REENVIO);

            setMensaje(
                respuesta.data.message ||
                "Te enviamos un nuevo código a tu correo."
            );
        } catch (err) {
            // 429: límite de reenvíos por minuto del backend.
            if (err.response?.status === 429) {
                setSegundosRestantes(SEGUNDOS_ESPERA_REENVIO);
                setError("Demasiadas solicitudes. Espera un minuto antes de reenviar.");
                return;
            }

            const mensajeBackend = err.response?.data?.message;

            setError(
                mensajeBackend ||
                "No se pudo reenviar el código. Inicia sesión nuevamente."
            );
        } finally {
            setReenviando(false);
        }
    };

    const cancelar = () =>{
        limpiarDesafio();
        navigate("/login", { replace: true });
    }

    return (
        <main className="bg-light min-vh-100 d-flex align-items-center justify-content-center">
            <div className="card shadow-sm" style={{ width: "100%", maxWidth: "400px" }}>
                <div className="card-body p-4">
                    <h1 className="card-title mb-3 text-center h4">
                        Verificación de acceso
                    </h1>

                    <p className="text-muted text-center">
                        Escribe el código de seis dígitos que enviamos a tu correo.
                    </p>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label htmlFor="code" className="form-label">
                                Código de verificación
                            </label>

                            <input
                                type="text"
                                id="code"
                                name="code"
                                className="form-control text-center"
                                value={code}
                                onChange={handleChange}
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                maxLength={6}
                                placeholder="000000"
                                required
                                autoFocus
                            />
                        </div>

                        {mensaje && (
                            <div className="alert alert-success mt-3" role="alert">
                                {mensaje}
                            </div>
                        )}

                        {error && (
                            <div className="alert alert-danger mt-3" role="alert">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn btn-primary w-100"
                            disabled={enviando || code.length !== 6}
                        >
                            {enviando ? "Verificando..." : "Verificar código"}
                        </button>
                    </form>

                    <button
                        type="button"
                        className="btn btn-link w-100 mt-2"
                        onClick={handleReenviar}
                        disabled={reenviando || segundosRestantes > 0}
                    >
                        {reenviando
                            ? "Reenviando..."
                            : segundosRestantes > 0
                                ? `Reenviar código en ${segundosRestantes} s`
                                : "Reenviar código"}
                    </button>

                    <button
                        type="button"
                        className="btn btn-outline-secondary w-100 mt-2"
                        onClick={cancelar}
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </main>
    );
}

export default TwoFactorPage;