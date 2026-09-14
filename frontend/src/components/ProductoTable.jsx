import { useEffect, useRef} from "react";
import "bootstrap-table/dist/bootstrap-table.min.css";

/**
 * Tabla de productos usando Bootstrap Table.
 * La lógica visual del plugin se apoya en las librerías globales
 * cargadas desde index.html para evitar conflictos entre instancias de jQuery.
 */
function ProductoTable({ productos, usuarioActual, onEditarProducto, onEliminarProducto, onSeleccionChange }) {
  // Referencia directa al elemento <table> del DOM
  const tableRef = useRef(null);

  // Referencias para mantener siempre actualizadas las funciones
  // de editar y eliminar sin reinicializar toda la tabla
  const editarRef = useRef(onEditarProducto);
  const eliminarRef = useRef(onEliminarProducto);
  const seleccionRef = useRef(onSeleccionChange);
  const usuarioActualRef = useRef(usuarioActual);

  /**
   * Cada vez que cambian las props recibidas desde el padre,
   * actualizamos las referencias internas.
   */
  useEffect(() => {
    editarRef.current = onEditarProducto;
    eliminarRef.current = onEliminarProducto;
    seleccionRef.current = onSeleccionChange;
    usuarioActualRef.current = usuarioActual;
  }, [onEditarProducto, onEliminarProducto, onSeleccionChange, usuarioActual]);

  /**
   * Este effect inicializa Bootstrap Table una sola vez.
   * Importante: se usa window.jQuery porque bootstrap-table,
   * tableExport y sus extensiones ya fueron cargados globalmente.
   */
  useEffect(() => {
    // Si la tabla todavía no existe en el DOM, no continuamos
    if (!tableRef.current) return;

    // Tomamos la misma instancia global de jQuery
    const $ = window.jQuery;

    // Validaciones defensivas para detectar problemas de carga
    if (!$) {
      console.error("jQuery no está disponible en window");
      return;
    }

    if (!$.fn.bootstrapTable) {
      console.error("bootstrapTable no está disponible en jQuery");
      return;
    }

    if (!$.fn.tableExport) {
      console.error("tableExport no está disponible en jQuery");
      return;
    }

    // Convertimos la tabla HTML en objeto jQuery
    const $table = $(tableRef.current);

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
    const nombreArchivoExportacion = `productos-tecnologicos-${obtenerFechaDescarga()}`;


    const actualizarSeleccion = () => {
      const rows = $table.bootstrapTable("getSelections");
      seleccionRef.current?.(rows);
    };

    // Inicializamos Bootstrap Table con sus opciones
    $table.bootstrapTable({
      data: [],

      // Funciones principales
      search: true,
      searchAlign: "left",
      buttonsAlign: "right",
      toolbarAlign: "both",
      pagination: true,
      pageSize: 5,
      pageList: [5, 10, 20, 50],
      showRefresh: true,
      showToggle: true,
      showColumns: true,
      striped: true,
      sortable: true,

      // Configuración de exportación
      showExport: true,
      exportDataType: "all",
      exportTypes: ["xlsx", "csv"],
      exportOptions: {
        fileName: nombreArchivoExportacion,
        ignoreColumn: ["acciones", "state"],
        
      },

      // Configuración regional
      locale: "es-MX",

      // Estilos y metadatos
      classes: "table table-hover align-middle",
      uniqueId: "id",
      clickToSelect: true,
      maintainMetaData: true,
      idField: 'id',
      iconsPrefix: "bi",
      icons: {
        refresh: "bi-arrow-clockwise",
        toggleOff: "bi-toggle-off",
        toggleOn: "bi-toggle-on",
        columns: "bi-funnel",
        fullscreen: "bi-arrows-fullscreen",
        detailOpen: "bi-plus",
        detailClose: "bi-dash",
        export: "bi-download",
      },

      onCheck: actualizarSeleccion,
      onUncheck: actualizarSeleccion,
      onCheckAll: actualizarSeleccion,
      onUncheckAll: actualizarSeleccion,

      // Definición de columnas
      columns: [
        {
          field: "state",
          checkbox: true,
          align: "center",
          valign: "middle",
        },
        {
          field: "nombre",
          title: "Nombre",
          sortable: true,
        },
        {
          field: "marca",
          title: "Marca",
          sortable: true,
        },
        {
          field: "categoria",
          title: "Categoria",
          sortable: true,
          /**
            * Renderiza la categoría como una píldora visual.
            * Bootstrap Table espera que devolvamos HTML como string.
          */
          formatter: (value) => {
            // Si no llega categoría, mostramos texto por defecto
            const categoriaTexto = value || "Sin categoría";

            return `
              <span
                class="badge rounded-pill text-dark border"
                style="
                  background-color: #f1f3f5;
                  border-color: #d9dee3;
                  font-weight: 500;
                  padding: 0.45rem 0.85rem;
                "
              >
                ${categoriaTexto}
              </span>
            `;
          },
        },
        {
          field: "precio",
          title: "Precio",
          sortable: true,
          /**
          * Formatea el precio con separador de miles y 2 decimales.
          * Ejemplo:
          * 1393864.23 -> $ 1,393,864.23
          */
          formatter: (value) => {
            // Convertimos el valor recibido a número
            const precio = Number(value) || 0;

            // Formateamos el número con estilo internacional
            const precioFormateado = precio.toLocaleString("es-MX",{
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            });

            return `$ ${precioFormateado}`;
            },
        },
        {
          field: "stock",
          title: "Stock",
          sortable: true,
          /**
           * Muestra el stock como una píldora con color según la cantidad.
           * Regla visual:
           * - Verde: stock alto
           * - Amarillo: stock medio
           * - Rojo: stock bajo
           */
          formatter: (value) =>{
            // Convertimos el valor a número por seguridad
            const stock = Number(value) || 0;

              let fondo = "#dcfce7";
              let texto = "#166534";

              // Stock bajo
              if(stock<30){
                fondo = "#fee2e2";
                texto = "#b91c1c";
              }
              // Stock medio
              else if(stock<50){
                fondo ="#fef3c7";
                texto ="#b45309";
              }

              return `
                <span
                  class="badge rounded-pill"
                  style="
                    background-color: ${fondo};
                    color: ${texto};
                    font-weight: 700;
                    min-width: 38px;
                    padding: 0.4rem 0.65rem;
                    display: inline-flex;
                    justify-content: center;
                    align-items: center;
                  "
                >
                  ${stock}
                </span>
              `;
          },
        },
        {
          field: "descripcion",
          title: "Descripcion",
          formatter: (value) => value || "Sin descripcion",
        },
        {
          field: "acciones",
          title: "Acciones",
          align: "center",
          searchable: false,
          clickToSelect: false,
          forceHide: true,

          // Render del HTML de botones dentro de la celda
          formatter: (value, row ) => {
          // Verificamos si el usuario actual puede editar/eliminar este producto.
          const usuario = usuarioActualRef.current;
        
          // Misma regla que ProductoPolicy en el backend:
          // dueño del producto O administrador.
          const puedeGestionar =
            usuario?.rol === 'admin' ||
            (
                usuario?.rol === 'editor' &&
                Number(usuario.id) === Number(row.user_id)
            );

          //Si tiene permiso, no mostramos ningun boton 
          if (!puedeGestionar){
            return '<span class="text-muted small">Sin permiso</span>';
          }
            return `
              <div class="d-flex justify-content-center gap-2">
                <button
                  class="btn btn-sm btn-light border btn-editar d-inline-flex align-items-center justify-content-center"
                  type="button"
                  title="Editar producto"
                  aria-label="Editar producto"
                  style="width: 36px; height: 36px;"
                >
                  <i class="bi bi-pencil-square text-primary"></i>
                </button>

                <button
                  class="btn btn-sm btn-light border btn-eliminar d-inline-flex align-items-center justify-content-center"
                  type="button"
                  title="Eliminar producto"
                  aria-label="Eliminar producto"
                  style="width: 36px; height: 36px;"
                >
                  <i class="bi bi-trash text-danger"></i>
                </button>
              </div>
            `;
          },

          // Eventos asociados a los botones de cada fila
          events: {
            "click .btn-editar": (e, value, row) => {
              editarRef.current(row);
            },
            "click .btn-eliminar": (e, value, row) => {
              eliminarRef.current(row);
            },
          },
        },
      ],
    });

    /**
     * Cuando el componente se desmonta,
     * destruimos la instancia de Bootstrap Table.
     */
    return () => {
      $table.bootstrapTable("destroy");
    };
  }, []);

  /**
   * Este efecto solo actualiza los datos de la tabla
   * cuando cambia el arreglo de productos.
   * No reconstruye la tabla completa.
   */
  useEffect(() => {
    if (!tableRef.current) return;

    const $ = window.jQuery;
    const $table = $(tableRef.current);

    $table.bootstrapTable("load", productos);
  }, [productos, usuarioActual]);

  /**
   * Dejamos la tabla vacía en el JSX.
   * Bootstrap Table se encarga de renderizar su contenido.
   */
  return (
    <div className="table-responsive">
      <table ref={tableRef}></table>
    </div>
  );
}

export default ProductoTable;