import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {obtenerUsuarios,crearUsuario,actualizarUsuario,eliminarUsuario,} from "../services/UsuarioService";
import UsuarioFormModal from "../components/UsuarioFormModal";
import { cerrarSesion } from "../services/AuthService";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import {mostrarCargando,cerrarAlerta,mostrarExito,mostrarError,confirmarEliminacion,} from "../utils/alerts";

/**
 * Página de gestión de usuarios.
 *
 * Esta página solo puede ser utilizada por administradores y permite:
 * - Consultar los usuarios registrados en el aplicativo (todos son del LDAP).
 * - Agregar usuarios buscándolos en el Directorio Activo por su username.
 * - Cambiar el rol y el acceso de un usuario.
 * - Eliminar usuarios solo del aplicativo (no del Directorio Activo).
 *
 * La seguridad definitiva se aplica en Laravel mediante UsuarioPolicy.
 * La validación del rol en React solo mejora la experiencia visual.
 */

/**
 * Escapa caracteres especiales de HTML.
 *
 * El nombre del usuario viene del Directorio Activo y la alerta de
 * confirmación renderiza HTML, así que lo limpiamos para evitar inyección.
 */
const escaparHtml = (texto = "") =>
    String(texto)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

function UsuariosPage() {

    const navigate = useNavigate();
    const { usuario, cerrarSesionLocal } = useAuth();
    const [usuarios, setUsuarios] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [modalAbierto, setModalAbierto] = useState(false);
    const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
    const [modoModal, setModoModal] = useState("crear");
    const tableRef = useRef(null);

    /**
     * Verifica visualmente que solamente un administrador pueda ver la página.
     *
     * La API también comprueba este permiso en UsuarioPolicy.
     * Si un usuario no admin intenta entrar directamente a /usuarios,
     * lo enviamos a la página de productos.
     */
    useEffect(() => {
        // Si no existe sesión o el usuario no es administrador, redirigimos.
        if (!usuario || usuario.rol !== "admin") {
            navigate("/productos", { replace: true });
        }
    }, [usuario, navigate]);

    /**
     * Consulta la lista de usuarios al entrar a la página.
     *
     * Solo hacemos la petición si el usuario actual tiene rol admin.
     * Axios agrega el token Bearer automáticamente mediante su interceptor.
     */
    useEffect(() => {
        // Si aún no existe un usuario admin, no consultamos datos.
        if (usuario?.rol !== "admin") {
            return;
        }

        /**
         * Consulta la lista de usuarios registrados en Laravel.
         */
        const fetchUsuarios = async () => {
            try {
                // Limpiamos errores anteriores.
                setError("");

                // Activamos el estado de carga.
                setCargando(true);

                // Mostramos loader mientras llega GET /api/usuarios.
                mostrarCargando("Consultando usuarios...");

                // Consultamos la API mediante UsuarioService.
                const response = await obtenerUsuarios();

                // Guardamos el array que devuelve UsuarioResource::collection().
                setUsuarios(response.data.data || []);

                // Cerramos el loader cuando la consulta fue exitosa.
                cerrarAlerta();
            } catch (err) {
                // Registramos el error técnico para depuración.
                console.error("Error al cargar usuarios:", err);

                // Cerramos el loader antes de mostrar error.
                cerrarAlerta();

                // Obtenemos el mensaje enviado por Laravel o uno por defecto.
                const mensajeError =
                    err.response?.data?.message ||
                    "No se pudieron cargar los usuarios.";

                // Guardamos el mensaje para mostrarlo dentro de la página.
                setError(mensajeError);

                // Mostramos alerta reutilizable del proyecto.
                mostrarError(mensajeError);
            } finally {
                // Finalizamos el estado de carga, haya éxito o error.
                setCargando(false);
            }
        };

        // Ejecutamos la consulta.
        fetchUsuarios();
    }, [usuario]);

    /**
     * Inicializa Bootstrap Table.
     *
     * Este effect se ejecuta cuando:
     * - Cambia la lista de usuarios.
     * - Finaliza la carga.
     * - Cambia el estado de error.
     *
     * Destruimos la tabla anterior antes de crear una nueva para evitar
     * filas duplicadas, eventos repetidos o errores de memoria.
     */
    useEffect(() => {
        // Mientras se cargan usuarios, la tabla todavía no está montada.
        if (cargando) {
            return;
        }

        // Si hubo error, no hay tabla para inicializar.
        if (error) {
            return;
        }

        // Bootstrap Table requiere que jQuery exista globalmente.
        if (!window.jQuery) {
            console.error(
                "jQuery no está disponible. Verifica las librerías cargadas en index.html."
            );
            return;
        }

    /**
     * Devuelve la fecha actual en formato YYYY-MM-DD
     * para usarla en el nombre del archivo exportado.
     */
    const obtenerFechaDescarga = () => {
        const hoy = new Date();

        const anio = hoy.getFullYear();
        const mes = String(hoy.getMonth() + 1).padStart(2, "0");
        const dia = String(hoy.getDate()).padStart(2, "0");

        return `${anio}-${mes}-${dia}`;
    };
    /**
     * Construimos el nombre del archivo de exportación
     * usando la fecha actual del día en que el usuario descarga.
     */
    const nombreArchivoExportacion = `Usuarios-${obtenerFechaDescarga()}`;

        // Verificamos que React ya haya montado la etiqueta table.
        if (!tableRef.current) {
            return;
        }

        // Obtenemos la instancia global de jQuery.
        const $ = window.jQuery;

        // Transformamos el elemento table del DOM en objeto jQuery.
        const $table = $(tableRef.current);

        // Destruimos una instancia previa antes de volver a crearla.
        $table.bootstrapTable("destroy");

        // Inicializamos Bootstrap Table.
        $table.bootstrapTable({
            // Datos que se mostrarán como filas.
            data: usuarios,

            // Habilita el buscador general.
            search: true,

            // Habilita paginación.
            pagination: true,

            // Cantidad inicial de filas.
            pageSize: 10,

            // Opciones de filas por página.
            pageList: [10, 25, 50, 100],

            // Permite mostrar u ocultar columnas.
            showColumns: true,

            // Habilita exportación de datos.
            showExport: true,

            // Formatos permitidos al exportar.
            exportTypes: ["csv", "txt"],
            exportOptions: {
                fileName: nombreArchivoExportacion,
                ignoreColumn: ["acciones"],
        
            },

            // Definimos las columnas de la tabla.
            columns: [
                {
                    // Campo ID recibido desde la API.
                    field: "id",

                    // Texto mostrado en el encabezado.
                    title: "ID",

                    // Permite ordenar por ID.
                    sortable: true,

                    // Alineación vertical del contenido.
                    valign: "middle",
                },
                {
                    // Campo nombre recibido desde la API.
                    field: "name",

                    // Texto mostrado en el encabezado.
                    title: "Nombre",

                    // Permite ordenar alfabéticamente.
                    sortable: true,

                    // Alineación vertical del contenido.
                    valign: "middle",
                },
                {
                    // Username usado para iniciar sesión.
                    field: "username",

                    // Texto mostrado en el encabezado.
                    title: "Usuario",

                    // Permite ordenar por username.
                    sortable: true,

                    // Alineación vertical del contenido.
                    valign: "middle",
                },
                {
                    // Campo correo recibido desde la API.
                    field: "email",

                    // Texto mostrado en el encabezado.
                    title: "Correo",

                    // Permite ordenar por correo.
                    sortable: true,

                    // Alineación vertical del contenido.
                    valign: "middle",
                },
                {
                    // Campo del rol recibido desde la API.
                    field: "rol",

                    // Texto mostrado en el encabezado.
                    title: "Rol",

                    // Permite ordenar por rol.
                    sortable: true,

                    // Alineación vertical del contenido.
                    valign: "middle",

                    /**
                     * Transforma el rol en un badge de Bootstrap.
                     *
                     * admin: rojo.
                     * editor: amarillo.
                     * viewer: azul.
                     */
                    formatter: (value) => {
                        // Definimos el color visual según el rol.
                        const colores = {
                            admin: "bg-danger",
                            editor: "bg-warning text-dark",
                            viewer: "bg-info text-dark",
                        };

                        // Retornamos el HTML que Bootstrap Table inserta en la celda.
                        return `
                            <span class="badge ${colores[value] || "bg-secondary"}">
                                ${value}
                            </span>
                        `;
                    },
                },
                {
                    // Campo que representa el acceso del usuario.
                    field: "activo",

                    // Texto mostrado en el encabezado.
                    title: "Acceso",

                    // Permite ordenar por estado.
                    sortable: true,

                    // Alineación vertical del contenido.
                    valign: "middle",

                    /**
                     * Muestra el acceso como badge.
                     *
                     * Laravel puede retornar boolean, número o string:
                     * true, 1, "1", false, 0 o "0".
                     */
                    formatter: (value) => {
                        // Consideramos activo los valores true, 1 o "1".
                        const estaActivo =
                            value === true ||
                            value === 1 ||
                            value === "1";

                        // Retornamos el badge adecuado.
                        return estaActivo
                            ? '<span class="badge bg-success">Activo</span>'
                            : '<span class="badge bg-secondary">Sin acceso</span>';
                    },
                },
                {
                    // Columna virtual. No existe como campo real de la API.
                    field: "acciones",

                    // Texto mostrado en el encabezado.
                    title: "Acciones",

                    // Alineación vertical del contenido.
                    valign: "middle",

                    /**
                     * Renderiza los botones de acción de cada fila.
                     *
                     * Todos los usuarios se pueden editar (rol y acceso).
                     * Todos se pueden eliminar del aplicativo, excepto el propio admin
                     * que tiene la sesión abierta.
                     */
                    formatter: (value, row) => {
                        // Un admin no puede eliminarse a sí mismo.
                        const esMiUsuario = row.id === usuario?.id;

                        // El botón eliminar solo se ofrece sobre otros usuarios.
                        const botonEliminar = esMiUsuario
                            ? ""
                            : `
                                <button
                                    type="button"
                                    class="btn btn-sm btn-danger btn-eliminar"
                                    title="Eliminar usuario del aplicativo"
                                >
                                    <i class="bi bi-trash"></i>
                                    Eliminar
                                </button>
                            `;

                        return `
                            <div class="d-flex justify-content-center gap-2">
                                <button
                                    type="button"
                                    class="btn btn-sm btn-primary btn-editar"
                                    title="Editar rol y acceso"
                                >
                                    <i class="bi bi-pencil"></i>
                                    Editar
                                </button>

                                ${botonEliminar}
                            </div>
                        `;
                    },

                    /**
                     * Eventos de botones creados dinámicamente por Bootstrap Table.
                     */
                    events: {
                        // Al pulsar Editar, abrimos el modal con los datos de la fila.
                        "click .btn-editar": (event, value, row) => {
                            handleEditarUsuario(row);
                        },

                        // Al pulsar Eliminar, solicitamos confirmación.
                        "click .btn-eliminar": (event, value, row) => {
                            handleEliminarUsuario(row);
                        },
                    },
                },
            ],
        });

        /**
         * Limpieza del effect.
         *
         * Se ejecuta antes de reinicializar la tabla y al desmontar la página.
         */
        return () => {
            // Verificamos que la tabla exista antes de destruirla.
            if (tableRef.current) {
                $(tableRef.current).bootstrapTable("destroy");
            }
        };
    }, [usuarios, cargando, error, usuario?.id]);

    /**
     * Abre el modal en modo creación.
     */
    const handleAbrirModalCrear = () => {
        // Indicamos que se creará un usuario nuevo.
        setModoModal("crear");

        // Limpiamos una posible selección anterior.
        setUsuarioSeleccionado(null);

        // Mostramos el modal.
        setModalAbierto(true);
    };

    /**
     * Abre el modal en modo edición.
     *
     * @param {object} usuarioEditar Usuario correspondiente a la fila seleccionada.
     */
    const handleEditarUsuario = (usuarioEditar) => {
        // Indicamos que editaremos un usuario existente.
        setModoModal("editar");

        // Guardamos los datos para prellenar el modal.
        setUsuarioSeleccionado(usuarioEditar);

        // Mostramos el modal.
        setModalAbierto(true);
    };

    /**
     * Elimina un usuario del aplicativo después de solicitar confirmación.
     *
     * Es una eliminación suave en la base local: el usuario no se borra
     * del Directorio Activo y puede volver a agregarse más adelante.
     *
     * @param {object} usuarioEliminar Usuario que se eliminará.
     */
    const handleEliminarUsuario = async (usuarioEliminar) => {
        // Confirmación de SweetAlert2, aclarando que no se toca el LDAP.
        const confirmado = await confirmarEliminacion(
            escaparHtml(usuarioEliminar.name),
            "Se quitará del aplicativo. Su cuenta en el Directorio Activo no se modifica."
        );

        // Si el administrador cancela, no realizamos ninguna petición.
        if (!confirmado) {
            return;
        }

        try {
            // Mostramos loader mientras Laravel elimina el usuario.
            mostrarCargando("Eliminando usuario...");

            // Llamamos al servicio DELETE /api/usuarios/:id.
            await eliminarUsuario(usuarioEliminar.id);

            // Quitamos el usuario eliminado del estado local.
            setUsuarios((usuariosActuales) =>
                usuariosActuales.filter(
                    (usuarioActual) => usuarioActual.id !== usuarioEliminar.id
                )
            );

            // Cerramos el loader.
            cerrarAlerta();

            // Mostramos confirmación de éxito.
            mostrarExito("Usuario eliminado del aplicativo.");
        } catch (err) {
            // Registramos el error técnico.
            console.error("Error al eliminar el usuario:", err);

            // Cerramos loader aunque Laravel responda con error.
            cerrarAlerta();

            // Mostramos el mensaje del backend (por ejemplo, "último administrador").
            mostrarError(
                err.response?.data?.message || "No se pudo eliminar el usuario."
            );
        }
    };

    /**
     * Crea o actualiza un usuario según el modo actual del modal.
     *
     * @param {object} datosFormulario Datos recibidos desde UsuarioFormModal.
     */
    const handleGuardarUsuario = async (datosFormulario) => {
        try {
            // Si estamos creando, ejecutamos POST /api/usuarios.
            if (modoModal === "crear") {
                // Mostramos spinner durante creación.
                mostrarCargando("Creando usuario...");

                // Enviamos { username, rol, activo }. El backend consulta el LDAP.
                const response = await crearUsuario(datosFormulario);

                // Si el backend restauró a un usuario eliminado, no debe quedar duplicado:
                // quitamos cualquier fila con el mismo id y lo ponemos al inicio.
                setUsuarios((usuariosActuales) => [
                    response.data.data,
                    ...usuariosActuales.filter(
                        (usuarioActual) => usuarioActual.id !== response.data.data.id
                    ),
                ]);

                // Cerramos loader.
                cerrarAlerta();

                // Cerramos modal.
                setModalAbierto(false);

                // Limpiamos selección.
                setUsuarioSeleccionado(null);

                // Mostramos el mensaje del backend (creado o restaurado).
                mostrarExito(response.data.message || "Usuario creado correctamente.");

                // Detenemos la ejecución para no llegar a edición.
                return;
            }

            // Mostramos spinner durante actualización.
            mostrarCargando("Actualizando usuario...");

            // Actualizamos el usuario seleccionado.
            const response = await actualizarUsuario(
                usuarioSeleccionado.id,
                datosFormulario
            );

            // Reemplazamos solamente el usuario actualizado en la lista.
            setUsuarios((usuariosActuales) =>
                usuariosActuales.map((usuarioActual) =>
                    usuarioActual.id === usuarioSeleccionado.id
                        ? response.data.data
                        : usuarioActual
                )
            );

            // Cerramos loader.
            cerrarAlerta();

            // Cerramos modal.
            setModalAbierto(false);

            // Limpiamos selección.
            setUsuarioSeleccionado(null);

            // Mostramos éxito.
            mostrarExito("Usuario actualizado correctamente.");
        } catch (err) {
            // Registramos el error técnico.
            console.error("Error al guardar el usuario:", err);

            // Cerramos loader.
            cerrarAlerta();

            // Extraemos posibles errores de validación de Laravel.
            const erroresValidacion = err.response?.data?.errors;

            // Tomamos el primer mensaje específico si existe.
            const primerError = erroresValidacion
                ? Object.values(erroresValidacion).flat()[0]
                : null;

            // Mostramos el error más específico disponible.
            mostrarError(
                primerError ||
                err.response?.data?.message ||
                "No se pudo guardar el usuario."
            );
        }
    };

    /**
     * Cierra la sesión actual.
     *
     * Primero intenta revocar el token en Laravel y después
     * limpia los datos locales aunque el servidor falle.
     */
    const handleCerrarSesion = async () => {
        try {
            // Revocamos el token actual en Laravel.
            await cerrarSesion();
        } catch (err) {
            // Registramos el error, pero no impedimos cerrar localmente.
            console.error("Error al cerrar sesión en el servidor:", err);
        } finally {
            // Eliminamos token local.
            localStorage.removeItem("token");

            // Eliminamos datos locales del usuario.
            localStorage.removeItem("usuario");

            // Actualizamos AuthContext.
            cerrarSesionLocal();

            // Redirigimos al login.
            navigate("/login", { replace: true });
        }
    };

    /**
     * No renderizamos contenido mientras se produce la redirección
     * para usuarios no administradores.
     */
    if (!usuario || usuario.rol !== "admin") {
        return null;
    }

    return (
        // Contenedor principal de la página.
        <main className="bg-light min-vh-100 py-4">
            {/* Contenedor interno con márgenes responsivos. */}
            <div className="container-fluid px-3 px-md-4 px-lg-4">
                {/* Encabezado de la página. */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-start gap-3 mb-4">
                    {/* Título y descripción. */}
                    <div>
                        <h1 className="h3 fw-bold mb-1">
                            <i className="bi bi-people-fill me-2"></i>
                            Gestión de Usuarios
                        </h1>

                        <p
                            className="text-muted mb-0"
                            style={{ fontSize: "0.9rem" }}
                        >
                            Administración de accesos y roles de usuarios del Directorio Activo.
                        </p>
                    </div>

                    {/* Botones de acción. */}
                    <div className="d-flex flex-wrap align-items-center gap-2">
                        {/* Botón para abrir formulario de creación. */}
                        <button
                            type="button"
                            className="btn btn-primary d-inline-flex align-items-center gap-2"
                            onClick={handleAbrirModalCrear}
                        >
                            <i className="bi bi-plus-lg"></i>
                            Agregar usuario
                        </button>

                        {/* Botón para volver a productos. */}
                        <button
                            type="button"
                            className="btn btn-outline-secondary d-inline-flex align-items-center gap-2"
                            onClick={() => navigate("/productos")}
                        >
                            <i className="bi bi-box-seam"></i>
                            Productos
                        </button>

                        {/* Botón para cerrar sesión. */}
                        <button
                            type="button"
                            className="btn btn-outline-danger d-inline-flex align-items-center gap-2"
                            onClick={handleCerrarSesion}
                        >
                            <i className="bi bi-box-arrow-right"></i>
                            Cerrar sesión
                        </button>
                    </div>
                </div>

                {/* Estado de carga mientras se consulta la lista. */}
                {cargando && (
                    <div className="card shadow-sm rounded-3">
                        <div className="card-body p-5 d-flex justify-content-center align-items-center">
                            <div
                                className="spinner-border text-primary"
                                role="status"
                            >
                                <span className="visually-hidden">
                                    Cargando usuarios...
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Mensaje de error si falla la petición. */}
                {!cargando && error && (
                    <div className="alert alert-danger" role="alert">
                        {error}
                    </div>
                )}

                {/* Tabla de usuarios cuando terminó la carga sin errores. */}
                {!cargando && !error && (
                    <div className="card shadow-sm rounded-3">
                        <div className="card-body p-3">
                            {/* Bootstrap Table se inicializa sobre esta tabla. */}
                            <table ref={tableRef}></table>
                        </div>
                    </div>
                )}

                {/* Modal para crear o editar usuarios. */}
                {modalAbierto && (
                    <UsuarioFormModal
                        // Indica al modal que debe mostrarse.
                        isOpen={modalAbierto}

                        // Cierra modal y limpia selección.
                        onClose={() => {
                            setModalAbierto(false);
                            setUsuarioSeleccionado(null);
                        }}

                        // Recibe el formulario y decide si crea o actualiza.
                        onSubmit={handleGuardarUsuario}

                        // Define el modo visual y funcional.
                        modo={modoModal}

                        // Datos del usuario que se editará; null al crear.
                        usuarioInicial={usuarioSeleccionado}
                    />
                )}
            </div>
        </main>
    );
}

// Exportamos la página para utilizarla desde App.jsx.
export default UsuariosPage;