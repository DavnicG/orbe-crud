// useState guarda los datos del formulario y los estados de carga.
// useEffect reinicia el formulario cuando se abre el modal o cambia el usuario.
import { useEffect, useState } from "react";

// Estilos de Bootstrap para mantener el mismo estilo visual.
import "bootstrap/dist/css/bootstrap.min.css";

// Servicio que consulta el Directorio Activo a través del backend.
import { buscarUsuarioLdap } from "../services/UsuarioService";

/**
 * Modal para crear o editar usuarios del aplicativo.
 *
 * Todos los usuarios vienen del Directorio Activo (LDAP):
 * - Crear: el admin busca el username en el LDAP, ve nombre y correo
 *   en solo lectura y asigna rol y acceso.
 * - Editar: solo se pueden cambiar rol y acceso.
 *
 * Props:
 * - isOpen: indica si el modal debe mostrarse.
 * - onClose: función que cierra el modal desde el componente padre.
 * - onSubmit: recibe { username, rol, activo } al crear o { rol, activo } al editar.
 * - modo: "crear" o "editar".
 * - usuarioInicial: usuario seleccionado cuando el modo es editar.
 */
function UsuarioFormModal({
    isOpen,
    onClose,
    onSubmit,
    modo,
    usuarioInicial,
}) {
    // Username que el admin escribe para buscar en el LDAP (solo modo crear).
    const [username, setUsername] = useState("");

    // Resultado de la búsqueda: { username, nombre, correo } o null.
    const [usuarioLdap, setUsuarioLdap] = useState(null);

    // Datos que sí puede decidir el administrador.
    const [rol, setRol] = useState("viewer");
    const [activo, setActivo] = useState(true);

    // Estados que deshabilitan botones mientras se busca o se guarda.
    const [buscando, setBuscando] = useState(false);
    const [enviando, setEnviando] = useState(false);

    // Mensaje de error local dentro del modal.
    const [error, setError] = useState("");

    // Atajo para saber si estamos creando.
    const esCrear = modo === "crear";

    /**
     * Inicializa o limpia el formulario cuando cambia el modo,
     * el usuario seleccionado o el estado de apertura del modal.
     */
    useEffect(() => {
        if (modo === "editar" && usuarioInicial) {
            // Editar: precargamos solo lo que se puede cambiar.
            setRol(usuarioInicial.rol || "viewer");
            // El operador ?? conserva false si el usuario está sin acceso.
            setActivo(usuarioInicial.activo ?? true);
        } else {
            // Crear: valores por defecto, con el rol de menor privilegio.
            setRol("viewer");
            setActivo(true);
        }

        // Limpiamos búsqueda y errores previos.
        setUsername("");
        setUsuarioLdap(null);
        setError("");
    }, [modo, usuarioInicial, isOpen]);

    /**
     * Si el admin cambia el username después de buscar, descartamos la
     * vista previa. Así nunca se guarda un username distinto al verificado.
     */
    const handleUsernameChange = (e) => {
        setUsername(e.target.value);
        setUsuarioLdap(null);
        setError("");
    };

    /**
     * Busca el usuario en el Directorio Activo a través del backend.
     */
    const handleBuscar = async () => {
        const valor = username.trim();
        setError("");
        setUsuarioLdap(null);

        // Validaciones básicas antes de llamar a la API.
        if (valor.length < 3) {
            setError("Escribe al menos 3 caracteres del username LDAP.");
            return;
        }

        if (!/^[A-Za-z0-9._-]+$/.test(valor)) {
            setError(
                "El username solo puede tener letras, números, punto, guion y guion bajo."
            );
            return;
        }

        setBuscando(true);

        try {
            const respuesta = await buscarUsuarioLdap(valor);

            // El backend responde { message, data: { username, nombre, correo } }.
            setUsuarioLdap(respuesta.data.data);
        } catch (err) {
            console.error("Error al buscar usuario LDAP:", err);

            setError(
                err.response?.data?.message ||
                "No se pudo consultar el Directorio Activo. Intenta de nuevo."
            );
        } finally {
            setBuscando(false);
        }
    };

    /**
     * Enter en el campo username ejecuta la búsqueda en vez de enviar el formulario.
     */
    const handleUsernameKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();

            if (!buscando) {
                handleBuscar();
            }
        }
    };

    /**
     * Envía los datos al componente padre.
     */
    const handleSubmit = async (e) => {
        // Evitamos que el navegador recargue la página.
        e.preventDefault();
        setError("");

        // Al crear es obligatorio haber encontrado al usuario en el LDAP.
        if (esCrear && !usuarioLdap) {
            setError("Primero busca un usuario del Directorio Activo.");
            return;
        }

        setEnviando(true);

        try {
            if (esCrear) {
                // Solo enviamos lo que decide el admin.
                // Nombre y correo los vuelve a consultar el backend.
                await onSubmit({
                    username: usuarioLdap.username,
                    rol,
                    activo,
                });
            } else {
                // Editar: únicamente rol y acceso.
                await onSubmit({ rol, activo });
            }
        } catch (err) {
            console.error("Error al guardar usuario:", err);

            // Primer mensaje de validación de Laravel, si existe.
            const erroresValidacion = err.response?.data?.errors;
            const primerError = erroresValidacion
                ? Object.values(erroresValidacion).flat()[0]
                : null;

            setError(
                primerError ||
                err.response?.data?.message ||
                err.message ||
                "No se pudo guardar el usuario."
            );
        } finally {
            // Reactiva botones, haya éxito o error.
            setEnviando(false);
        }
    };

    // Si el modal no está abierto, no renderizamos su estructura.
    if (!isOpen) {
        return null;
    }

    // Datos de identidad que se muestran en solo lectura:
    // al crear vienen de la búsqueda; al editar, del usuario seleccionado.
    const identidad = esCrear
        ? usuarioLdap
            ? {
                username: usuarioLdap.username,
                nombre: usuarioLdap.nombre,
                correo: usuarioLdap.correo,
            }
            : null
        : {
            username: usuarioInicial?.username,
            nombre: usuarioInicial?.name,
            correo: usuarioInicial?.email,
        };

    // Rol y acceso se habilitan solo cuando ya hay un usuario identificado.
    const puedeEditarPermisos = Boolean(identidad);

    return (
        // Estructura principal del modal con fondo oscuro propio.
        <div
            className="modal fade show d-block"
            tabIndex="-1"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        >
            {/* Contenedor centrado verticalmente. */}
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    {/* Encabezado: el título cambia según el modo. */}
                    <div className="modal-header">
                        <h5 className="modal-title">
                            {esCrear
                                ? "Agregar usuario del Directorio Activo"
                                : "Editar acceso del usuario"}
                        </h5>

                        <button
                            type="button"
                            className="btn-close"
                            onClick={onClose}
                            disabled={enviando}
                            aria-label="Cerrar"
                        ></button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">
                            {/* Aviso informativo sobre qué se puede cambiar. */}
                            {!esCrear && (
                                <div className="alert alert-info py-2">
                                    <i className="bi bi-building me-2"></i>
                                    Estos datos los administra el Directorio Activo.
                                    Solo puedes cambiar el rol y el acceso.
                                </div>
                            )}

                            {/* Buscador: solo al crear. */}
                            {esCrear && (
                                <div className="mb-3">
                                    <label
                                        htmlFor="ldapUsername"
                                        className="form-label"
                                    >
                                        Username del Directorio Activo
                                    </label>

                                    <div className="input-group">
                                        <input
                                            type="text"
                                            id="ldapUsername"
                                            className="form-control"
                                            placeholder="Ej: jperez"
                                            value={username}
                                            onChange={handleUsernameChange}
                                            onKeyDown={handleUsernameKeyDown}
                                            disabled={buscando || enviando}
                                            autoComplete="off"
                                            autoFocus
                                        />

                                        <button
                                            type="button"
                                            className="btn btn-outline-primary"
                                            onClick={handleBuscar}
                                            disabled={
                                                buscando ||
                                                enviando ||
                                                !username.trim()
                                            }
                                        >
                                            {buscando
                                                ? "Buscando..."
                                                : "Buscar en LDAP"}
                                        </button>
                                    </div>

                                    <small className="text-muted">
                                        Nombre y correo se traen del directorio y no se pueden modificar.
                                    </small>
                                </div>
                            )}

                            {/* Datos de identidad en solo lectura. */}
                            {identidad && (
                                <div className="border rounded p-3 mb-3 bg-light">
                                    <div className="mb-2">
                                        <label className="form-label mb-0 small text-muted">
                                            Nombre completo
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={identidad.nombre || ""}
                                            readOnly
                                            disabled
                                        />
                                    </div>

                                    <div className="mb-2">
                                        <label className="form-label mb-0 small text-muted">
                                            Usuario de acceso
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={identidad.username || ""}
                                            readOnly
                                            disabled
                                        />
                                    </div>

                                    <div>
                                        <label className="form-label mb-0 small text-muted">
                                            Correo electrónico
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={identidad.correo || ""}
                                            readOnly
                                            disabled
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Campo rol. */}
                            <div className="mb-3">
                                <label htmlFor="rol" className="form-label">
                                    Rol
                                </label>

                                <select
                                    id="rol"
                                    className="form-select"
                                    value={rol}
                                    onChange={(e) => setRol(e.target.value)}
                                    disabled={!puedeEditarPermisos || enviando}
                                >
                                    {/* Viewer solo consulta productos. */}
                                    <option value="viewer">
                                        Viewer (solo consulta)
                                    </option>

                                    {/* Editor gestiona sus propios productos. */}
                                    <option value="editor">
                                        Editor (gestiona sus productos)
                                    </option>

                                    {/* Admin tiene acceso completo. */}
                                    <option value="admin">
                                        Administrador (acceso completo)
                                    </option>
                                </select>
                            </div>

                            {/* Control para dar o quitar acceso a la plataforma. */}
                            <div className="form-check mb-3">
                                <input
                                    type="checkbox"
                                    id="activo"
                                    className="form-check-input"
                                    checked={activo}
                                    onChange={(e) => setActivo(e.target.checked)}
                                    disabled={!puedeEditarPermisos || enviando}
                                />

                                <label
                                    htmlFor="activo"
                                    className="form-check-label"
                                >
                                    Usuario activo (puede acceder al sistema)
                                </label>
                            </div>

                            {/* Errores locales del formulario. */}
                            {error && (
                                <div
                                    className="alert alert-danger py-2 mb-0"
                                    role="alert"
                                >
                                    {error}
                                </div>
                            )}
                        </div>

                        {/* Pie del modal con botones de acción. */}
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={onClose}
                                disabled={enviando}
                            >
                                Cancelar
                            </button>

                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={
                                    enviando || buscando || !puedeEditarPermisos
                                }
                            >
                                {enviando
                                    ? "Guardando..."
                                    : esCrear
                                        ? "Crear usuario"
                                        : "Guardar"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

// Exportamos el modal para poder usarlo en UsuariosPage.
export default UsuarioFormModal;
