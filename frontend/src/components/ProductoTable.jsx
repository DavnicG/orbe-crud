import { useEffect, useRef } from "react";
import "bootstrap-table/dist/bootstrap-table.min.css";

/**
 * Tabla de productos usando Bootstrap Table.
 * La lógica visual del plugin se apoya en las librerías globales
 * cargadas desde index.html para evitar conflictos entre instancias de jQuery.
 */
function ProductoTable({ productos, onEditarProducto, onEliminarProducto }) {
  // Referencia directa al elemento <table> del DOM
  const tableRef = useRef(null);

  // Referencias para mantener siempre actualizadas las funciones
  // de editar y eliminar sin reinicializar toda la tabla
  const editarRef = useRef(onEditarProducto);
  const eliminarRef = useRef(onEliminarProducto);

  /**
   * Cada vez que cambian las props recibidas desde el padre,
   * actualizamos las referencias internas.
   */
  useEffect(() => {
    editarRef.current = onEditarProducto;
    eliminarRef.current = onEliminarProducto;
  }, [onEditarProducto, onEliminarProducto]);

  /**
   * Este efecto inicializa Bootstrap Table una sola vez.
   * Importante: usamos window.jQuery porque bootstrap-table,
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

    // Inicializamos Bootstrap Table con sus opciones
    $table.bootstrapTable({
      data: [],

      // Funciones principales
      search: true,
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
        ignoreColumn: ["acciones"],
      },

      // Configuración regional
      locale: "es-MX",

      // Estilos y metadatos
      classes: "table table-striped table-hover",
      uniqueId: "id",
      iconsPrefix: "bi",
      icons: {
        refresh: "bi-arrow-clockwise",
        toggleOff: "bi-toggle-off",
        toggleOn: "bi-toggle-on",
        columns: "bi-list-ul",
        fullscreen: "bi-arrows-fullscreen",
        detailOpen: "bi-plus",
        detailClose: "bi-dash",
      },

      // Definición de columnas
      columns: [
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
        },
        {
          field: "precio",
          title: "Precio",
          sortable: true,
          formatter: (value) => `$ ${value}`,
        },
        {
          field: "stock",
          title: "Stock",
          sortable: true,
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
          formatter: () => {
            return `
              <button class="btn btn-sm btn-warning btn-editar me-2">Editar</button>
              <button class="btn btn-sm btn-danger btn-eliminar">Eliminar</button>
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
  }, [productos]);

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