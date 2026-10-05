import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    verificarDosFactores,
    reenviarCodigoDosFactores,
} from "../services/AuthService";
import { useAuth } from "../context/AuthContext";

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
        if (reenviando || !challengeToken) {
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

            setMensaje(
                respuesta.data.message ||
                "Te enviamos un nuevo código a tu correo."
            );
        } catch (err) {
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
                        disabled={reenviando}
                    >
                        {reenviando ? "Reenviando..." : "Reenviar código"}
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