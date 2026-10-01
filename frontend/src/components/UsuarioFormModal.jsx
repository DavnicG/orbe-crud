// Importamos hooks de React.
// useState guarda datos y estados del formulario.
// useEffect sincroniza el formulario y el modal con sus props.
// useRef guarda una referencia al elemento modal del DOM.
import { useEffect, useRef, useState } from "react";

// Importamos estilos de Bootstrap para mantener el mismo estilo visual.
import "bootstrap/dist/css/bootstrap.min.css";

/**
 * Modal reutilizable para crear o editar usuarios.
 *
 * Reglas según el tipo de usuario:
 *
 * Usuario local:
 * - Puede editar nombre, username, correo, rol, acceso y contraseña.
 *
 * Usuario LDAP:
 * - Solo puede editar rol y acceso.
 * - Nombre, username y correo vienen del Directorio Activo.
 * - La contraseña se valida contra Active Directory y no se administra aquí.
 *
 * Props:
 * - isOpen: indica si el modal debe mostrarse.
 * - onClose: función que cierra el modal desde el componente padre.
 * - onSubmit: función que recibe datos válidos para crear o actualizar.
 * - modo: puede ser "crear" o "editar".
 * - usuarioInicial: usuario seleccionado cuando el modo es editar.
 */
function UsuarioFormModal({
    isOpen,
    onClose,
    onSubmit,
    modo,
    usuarioInicial,
}) {
    // Estado local con los datos que maneja el formulario.
    const [formData, setFormData] = useState({
        // Nombre completo del usuario.
        name: "",

        // Username usado para iniciar sesión.
        username: "",

        // Correo electrónico.
        email: "",

        // Contraseña local. Nunca se precarga por seguridad.
        password: "",

        //Confirmacion de la contraseña
        password_confirmation: "",

        // Rol inicial de menor privilegio.
        rol: "viewer",

        // Los usuarios nuevos quedan activos por defecto.
        activo: true,
    });

    // Estado que deshabilita botones mientras se guarda.
    const [enviando, setEnviando] = useState(false);

    // Estado para mostrar errores locales dentro del modal.
    const [error, setError] = useState("");

    // Referencia al elemento principal del modal.
    const modalRef = useRef(null);

    /**
     * Identifica si estamos editando un usuario autenticado mediante LDAP.
     *
     * Para estos usuarios se bloquean campos gestionados por Active Directory:
     * nombre, username, correo y contraseña.
     */
    const esUsuarioLdap =
        modo === "editar" &&
        usuarioInicial?.tipo_autenticacion === "ldap";

    /**
     * Inicializa o limpia el formulario cuando cambia el modo,
     * el usuario seleccionado o el estado de apertura del modal.
     */
    useEffect(() => {
        // Si estamos editando y existe un usuario seleccionado.
        if (modo === "editar" && usuarioInicial) {
            // Prellenamos los campos con los datos actuales del usuario.
            setFormData({
                // Nombre actual.
                name: usuarioInicial.name || "",

                // Username actual.
                username: usuarioInicial.username || "",

                // Correo actual.
                email: usuarioInicial.email || "",

                // Nunca mostramos ni recuperamos la contraseña existente.
                password: "",

                //Confirmacion de la contraseña
                password_confirmation: "",

                // Rol actual del usuario.
                rol: usuarioInicial.rol || "viewer",

                // Estado activo actual.
                // El operador ?? preserva false si el usuario está desactivado.
                activo: usuarioInicial.activo ?? true,
            });
        } else if (modo === "crear") {
            // Si estamos creando, reiniciamos todos los campos.
            setFormData({
                name: "",
                username: "",
                email: "",
                password: "",
                password_confirmation: "",
                rol: "viewer",
                activo: true,
            });
        }

        // Limpiamos cualquier mensaje de error previo.
        setError("");
    }, [modo, usuarioInicial, isOpen]);

    /**
     * Sincroniza el modal de Bootstrap con la prop isOpen.
     */
    useEffect(() => {
        // Verificamos que Bootstrap esté disponible globalmente
        // y que el elemento del modal exista en el DOM.
        if (!window.bootstrap || !modalRef.current) {
            return;
        }

        // Creamos una instancia de Bootstrap Modal.
        const modal = new window.bootstrap.Modal(modalRef.current, {
            // No se cierra al hacer clic fuera.
            backdrop: "static",

            // No se cierra al presionar Escape.
            keyboard: false,
        });

        // Si el padre indica que debe abrirse, mostramos el modal.
        if (isOpen) {
            modal.show();
        } else {
            // Si el padre indica que debe cerrarse, lo ocultamos.
            modal.hide();
        }

        /**
         * Se ejecuta al terminar de ocultarse el modal.
         *
         * Esto cubre el caso donde el usuario pulsa la X
         * o donde Bootstrap cierra visualmente el modal.
         */
        const handleHidden = () => {
            // Avisamos al componente padre para sincronizar su estado.
            onClose();
        };

        // Agregamos el listener correcto del evento Bootstrap.
        modalRef.current.addEventListener("hidden.bs.modal", handleHidden);

        // Limpiamos listeners e instancia al desmontar el componente.
        return () => {
            // Removemos exactamente el mismo evento registrado.
            modalRef.current?.removeEventListener(
                "hidden.bs.modal",
                handleHidden
            );

            // Destruimos la instancia para liberar memoria.
            modal.dispose();
        };
    }, [isOpen, onClose]);

    /**
     * Actualiza el estado cuando el usuario escribe o modifica un campo.
     *
     * @param {Event} e Evento generado por input, select o checkbox.
     */
    const handleChange = (e) => {
        // Obtenemos información del control que cambió.
        const { name, value, type, checked } = e.target;

        // Actualizamos solamente el campo modificado.
        setFormData((datosActuales) => ({
            ...datosActuales,

            // Los checkbox usan true/false.
            // Los demás campos usan el texto ingresado.
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    /**
     * Maneja el envío del formulario.
     */
    const handleSubmit = async (e) => {
        // Evitamos que el navegador recargue la página.
        e.preventDefault();

        // Indicamos que se está enviando para bloquear botones.
        setEnviando(true);

        // Limpiamos el error local antes de validar.
        setError("");

        try {
            // En modo creación, una contraseña local es obligatoria.
            if (modo === "crear" && !formData.password) {
                throw new Error(
                    "La contraseña es obligatoria para crear un usuario."
                );
            }

            if(!formData.password && formData.password_confirmation){
                throw new Error("Escribe tambien la nueva contraseña");
            }

            if(formData.password && formData.password !== formData.password_confirmation){
                throw new Error("Las contraseñas no coinciden.");
            }

            // Copiamos los datos antes de ajustar el payload.
            const datosAEnviar = { ...formData };

            /**
             * Si editamos un usuario LDAP, el frontend solamente envía
             * rol y activo. Los demás campos son propiedad del AD.
             */
            if (esUsuarioLdap) {
                await onSubmit({
                    // Rol administrativo local.
                    rol: formData.rol,

                    // Estado local de acceso a la aplicación.
                    activo: formData.activo,
                });

                // Terminamos para evitar enviar campos locales más adelante.
                return;
            }

            /**
             * En edición de usuarios locales, si la contraseña queda vacía,
             * la eliminamos del payload para conservar el hash actual.
             */
            if (modo === "editar" && !datosAEnviar.password) {
                delete datosAEnviar.password;
                delete datosAEnviar.password_confirmation;
            }

            // Enviamos datos al componente padre.
            await onSubmit(datosAEnviar);
        } catch (err) {
            // Registramos el error técnico para depuración.
            console.error("Error al guardar usuario:", err);

            // Extraemos los posibles errores de validación de Laravel.
            const erroresValidacion = err.response?.data?.errors;

            // Tomamos el primer mensaje de validación disponible.
            const primerError = erroresValidacion
                ? Object.values(erroresValidacion).flat()[0]
                : null;

            // Mostramos el mensaje más específico posible.
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

    /**
     * Si el modal no está abierto, no renderizamos su estructura.
     */
    if (!isOpen) {
        return null;
    }

    return (
        // Estructura principal del modal Bootstrap.
        <div
            className="modal fade show d-block"
            tabIndex="-1"
            ref={modalRef}
            style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        >
            {/* Contenedor centrado verticalmente. */}
            <div className="modal-dialog modal-dialog-centered">
                {/* Contenido blanco del modal. */}
                <div className="modal-content">
                    {/* Encabezado del modal. */}
                    <div className="modal-header">
                        {/* Título que cambia según el modo. */}
                        <h5 className="modal-title">
                            {modo === "crear"
                                ? "Crear usuario"
                                : "Editar usuario"}
                        </h5>

                        {/* Botón para cerrar el modal. */}
                        <button
                            type="button"
                            className="btn-close"
                            onClick={onClose}
                            disabled={enviando}
                            aria-label="Cerrar"
                        ></button>
                    </div>

                    {/* Formulario del usuario. */}
                    <form onSubmit={handleSubmit}>
                        {/* Cuerpo principal del formulario. */}
                        <div className="modal-body">
                            {/* Aviso visible cuando se edita un usuario LDAP. */}
                            {esUsuarioLdap && (
                                <div className="alert alert-info py-2">
                                    <i className="bi bi-building me-2"></i>
                                    Este usuario se autentica mediante LDAP.
                                    Solo puedes cambiar su rol y estado de acceso.
                                </div>
                            )}

                            {/* Campo nombre completo. */}
                            <div className="mb-3">
                                <label htmlFor="name" className="form-label">
                                    Nombre completo
                                </label>

                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    className="form-control"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    autoFocus={!esUsuarioLdap}
                                    disabled={esUsuarioLdap || enviando}
                                />
                            </div>

                            {/* Campo username. */}
                            <div className="mb-3">
                                <label
                                    htmlFor="username"
                                    className="form-label"
                                >
                                    Usuario de acceso
                                </label>

                                <input
                                    type="text"
                                    id="username"
                                    name="username"
                                    className="form-control"
                                    value={formData.username}
                                    onChange={handleChange}
                                    required
                                    minLength={3}
                                    maxLength={100}
                                    pattern="[A-Za-z0-9._-]+"
                                    autoComplete="username"
                                    disabled={esUsuarioLdap || enviando}
                                />

                                <small className="text-muted">
                                    Usa letras, números, punto, guion o guion bajo.
                                </small>
                            </div>

                            {/* Campo correo electrónico. */}
                            <div className="mb-3">
                                <label htmlFor="email" className="form-label">
                                    Correo electrónico
                                </label>

                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    className="form-control"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    autoComplete="email"
                                    disabled={esUsuarioLdap || enviando}
                                />
                            </div>

                            {/* La contraseña solo se maneja en usuarios locales. */}
                            {!esUsuarioLdap && (
                                <div className="mb-3">
                                    <label
                                        htmlFor="password"
                                        className="form-label"
                                    >
                                        {modo === "crear"
                                            ? "Contraseña"
                                            : "Nueva contraseña (opcional)"}
                                    </label>

                                    <input
                                        type="password"
                                        id="password"
                                        name="password"
                                        className="form-control"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required={modo === "crear"}
                                        minLength={8}
                                        autoComplete={
                                            modo === "crear"
                                                ? "new-password"
                                                : "new-password"
                                        }
                                        disabled={enviando}
                                    />
                                    <label
                                        htmlFor="password_confirmation"
                                        className="form-label"
                                    >
                                        Confirmar contraseña
                                    </label>

                                    <input
                                        type="password"
                                        id="password_confirmation"
                                        name="password_confirmation"
                                        className={`form-control ${
                                            formData.password_confirmation &&
                                            formData.password !== formData.password_confirmation
                                            ? "is-invalid"
                                            : ""
                                        }`}
                                        value={formData.password_confirmation}
                                        onChange={handleChange}
                                        required={modo === "crear"|| formData.password !== ""}
                                        minLength={8}
                                        autoComplete="new-password"
                                        disabled={enviando}
                                    />
                                    {/*Mensaje visual si no coinciden*/}
                                    {FormData.password_confirmation &&
                                        formData.password !== formData.password_confirmation && (
                                            <div className="invalid-feedback">
                                                Las contraseñas no coinciden.
                                            </div>
                                    )}

                                    {/* Ayuda solo durante edición de usuarios locales. */}
                                    {modo === "editar" && (
                                        <small className="text-muted">
                                            Déjala vacía para conservar la contraseña actual.
                                        </small>
                                    )}
                                </div>
                            )}

                            {/* Campo rol. Está disponible para LDAP y Local. */}
                            <div className="mb-3">
                                <label htmlFor="rol" className="form-label">
                                    Rol
                                </label>

                                <select
                                    id="rol"
                                    name="rol"
                                    className="form-select"
                                    value={formData.rol}
                                    onChange={handleChange}
                                    required
                                    disabled={enviando}
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

                            {/* Control para habilitar o bloquear acceso. */}
                            <div className="form-check mb-3">
                                <input
                                    type="checkbox"
                                    id="activo"
                                    name="activo"
                                    className="form-check-input"
                                    checked={formData.activo}
                                    onChange={handleChange}
                                    disabled={enviando}
                                />

                                <label
                                    htmlFor="activo"
                                    className="form-check-label"
                                >
                                    Usuario activo (puede acceder al sistema)
                                </label>
                            </div>

                            {/* Mostramos errores locales del formulario. */}
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
                            {/* Botón para cancelar y cerrar. */}
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={onClose}
                                disabled={enviando}
                            >
                                Cancelar
                            </button>

                            {/* Botón para enviar formulario. */}
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={enviando}
                            >
                                {enviando ? "Guardando..." : "Guardar"}
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
